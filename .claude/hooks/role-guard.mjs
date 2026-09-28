#!/usr/bin/env node
// Role guard: keeps code and tests apart. See CLAUDE.md, "How we work".
//
// Roles:  build        writes app code in pocket-game-night/ (the coder subagent, or Claude Code
//                      opened in that folder)
//         test         writes and runs tests in pocket-game-night-testing/ (the tester subagent,
//                      or the Claude desktop app opened in that folder)
//         orchestrator the main session opened in the workspace folder that holds both clones;
//                      hands work to the coder and tester, edits only docs/ itself
//
// Modes:  pre     PreToolUse   - block edits and reads outside the role, and test runs outside Test
//         post    PostToolUse  - catch shell commands that changed files the role must not touch
//         session SessionStart - wire up the git hook and tell Claude which role it has
//         commit  git pre-commit - block commits that cross the line
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_OWNED = ['tests/', 'specs/', 'reports/'];
const SHARED = ['docs/'];
const GOVERNANCE = ['CLAUDE.md', '.claude/', '.githooks/'];
const TEST_RUNNERS =
  /\b(vitest|playwright|stryker|jest|mocha|appium)\b|\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|e2e|sim|mutation)\b|\bnpm\s+t\b/;
const WEAKENING = /\.(skip|only|todo)\s*\(|\bx(it|describe|test)\s*\(/;
const READ_TOOLS = ['Read', 'Grep', 'Glob'];
const AGENT_ROLE = { coder: 'build', tester: 'test' };

// This file lives in both clones; the two clones sit side by side in the workspace folder.
const real = (p) => { try { return realpathSync(p); } catch { return path.resolve(p); } };
const SELF = real(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const FOLDER = { build: SELF.replace(/-testing$/, ''), test: `${SELF.replace(/-testing$/, '')}-testing` };
const WORKSPACE = path.dirname(FOLDER.build);

const entry = process.env.CLAUDE_CODE_ENTRYPOINT;
const projectDir = real(process.env.CLAUDE_PROJECT_DIR || process.cwd());
let role = entry === 'claude-desktop' ? 'test' : projectDir === WORKSPACE ? 'orchestrator' : 'build';
let agent = null; // 'coder' or 'tester' when a subagent is acting
const NAME = { build: 'Build role', test: 'Test role', orchestrator: 'orchestrator' };
const who = () => (agent ? `${agent} subagent` : NAME[role]);

const git = (args, cwd) => execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const base = (clone) => path.basename(FOLDER[clone]);

// Which clone a path is in, and its path inside that clone; null when it is in neither.
function locate(p) {
  let dir = path.resolve(p);
  let rest = '';
  while (!existsSync(dir)) { rest = path.join(path.basename(dir), rest); dir = path.dirname(dir); }
  const full = path.join(real(dir), rest);
  for (const [clone, root] of Object.entries(FOLDER)) {
    if (full === root || full.startsWith(root + path.sep)) {
      return { clone, rel: path.relative(root, full).split(path.sep).join('/') };
    }
  }
  return null;
}

function ownerOf(rel) {
  if (GOVERNANCE.some((g) => (g.endsWith('/') ? rel.startsWith(g) : rel === g))) return 'governance';
  if (SHARED.some((p) => rel.startsWith(p))) return 'shared';
  return TEST_OWNED.some((p) => rel.startsWith(p)) ? 'test' : 'build';
}

// May this role change a file with this owner in this clone? (Rule files ask separately.)
function allowed(clone, owner) {
  if (owner === 'governance') return true;
  if (role === 'orchestrator') return owner === 'shared' && clone === 'build';
  return clone === role && (owner === 'shared' || owner === role);
}

function wrongFolderMessage(clone) {
  if (agent) return `The ${agent} works only in ${base(role)}/, not ${base(clone)}/.`;
  return role === 'test'
    ? `This is the Build folder (${FOLDER.build}). The desktop app tests from the ${base('test')} clone. Open that folder instead.`
    : `This is the Test folder (${FOLDER.test}). Write code from the ${base('build')} folder, or open the workspace folder to orchestrate.`;
}

function out(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }
const decide = (decision, reason) =>
  out({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } });

// Shell commands: remember each clone's changed files before, so "post" sees only what the command did.
const snapshotFile = (input) => path.join(os.tmpdir(), `pgn-role-guard-${input.session_id}-${input.tool_use_id}.json`);
function changedFiles(root) {
  if (!existsSync(path.join(root, '.git'))) return [];
  try { return git('status --porcelain --untracked-files=all', root).split('\n').filter(Boolean); } catch { return []; }
}

function pre(input) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const cwd = input.cwd || projectDir;

  if (tool === 'Bash') {
    if (role !== 'test' && TEST_RUNNERS.test(ti.command || '')) {
      decide('deny', role === 'orchestrator'
        ? 'The orchestrator never runs tests. Hand testing to the tester subagent.'
        : 'Only the Test role runs tests. Type-check instead, push, and read reports/latest.md for results.');
    }
    if (input.tool_use_id) {
      const snap = Object.fromEntries(Object.entries(FOLDER).map(([clone, root]) => [clone, changedFiles(root)]));
      try { writeFileSync(snapshotFile(input), JSON.stringify(snap)); } catch { /* post falls back */ }
    }
    process.exit(0);
  }

  if (READ_TOOLS.includes(tool)) {
    if (!agent) process.exit(0); // only the subagents are kept to one folder when reading
    const target = real(path.resolve(cwd, ti.file_path || ti.path || '.'));
    const loc = locate(target);
    if (loc && loc.clone !== role) decide('deny', wrongFolderMessage(loc.clone));
    if (!loc && FOLDER.build.startsWith(target + path.sep)) {
      decide('deny', `Search inside ${FOLDER[role]} only: give the tool a path in that folder.`);
    }
    process.exit(0);
  }

  const file = ti.file_path || ti.notebook_path;
  if (!file) process.exit(0);
  const loc = locate(path.resolve(cwd, file));
  if (!loc) process.exit(0); // outside both clones
  const { clone, rel } = loc;

  const owner = ownerOf(rel);
  if (owner === 'governance') {
    if (agent) decide('deny', `${rel} is a project rule file. Subagents never change it; tell the orchestrator.`);
    decide('ask', `${rel} is a project rule file. Changing it needs the owner's approval.`);
  }
  if (role === 'orchestrator') {
    if (allowed(clone, owner)) process.exit(0);
    decide('deny', `The orchestrator edits only docs/ in ${base('build')}/. Hand app code to the coder ` +
      'subagent, and tests, specs and reports to the tester subagent.');
  }
  if (clone !== role) decide('deny', wrongFolderMessage(clone));
  if (!allowed(clone, owner)) {
    decide('deny', role === 'test'
      ? `${rel} is app code. The Test role never edits app code. Report the problem in reports/latest.md instead.`
      : `${rel} belongs to the Test role (tests, specs, reports). If a test looks wrong, add it to docs/test-questions.md and tell the owner.`);
  }
  if (role === 'test' && /(^|\/)tests\//.test(rel)) {
    const text = [ti.new_string, ti.content, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
    if (WEAKENING.test(text)) decide('ask', 'This adds a skipped, focused or placeholder test. Tests are never weakened without the owner\'s approval.');
  }
  process.exit(0);
}

function post(input) {
  if (input.tool_name !== 'Bash') process.exit(0);
  let before = null;
  try { before = JSON.parse(readFileSync(snapshotFile(input), 'utf8')); unlinkSync(snapshotFile(input)); } catch { /* none */ }
  const own = role === 'test' ? 'test' : 'build';
  const stray = [];
  for (const [clone, root] of Object.entries(FOLDER)) {
    const now = changedFiles(root);
    // Without a snapshot, check the role's own clone fully and skip the other one.
    const was = new Set(before ? before[clone] : clone === own ? [] : now);
    for (const line of now) {
      if (was.has(line)) continue;
      const rel = line.slice(3).split(' -> ').pop().replace(/^"|"$/g, '');
      if (!allowed(clone, ownerOf(rel))) stray.push(`${base(clone)}/${rel}`);
    }
  }
  if (stray.length) {
    out({
      decision: 'block',
      reason: `That command changed files the ${who()} must not touch: ${stray.slice(0, 10).join(', ')}. ` +
        'Undo those changes now (git restore / remove new files) and report the need instead.',
    });
  }
  process.exit(0);
}

function session() {
  for (const root of Object.values(FOLDER)) {
    try { git('config core.hooksPath .githooks', root); } catch { /* clone missing or not a repo yet */ }
  }
  const lines = [];
  if (role === 'orchestrator') {
    lines.push('You are the orchestrator, in the workspace folder. Follow CLAUDE.md here, then pocket-game-night/CLAUDE.md.');
    lines.push('Hand app code to the coder subagent and testing to the tester subagent. You edit only docs/ in pocket-game-night/.');
    const missing = Object.values(FOLDER).filter((root) => !existsSync(path.join(root, '.git')));
    if (missing.length) lines.push(`WARNING: missing clone(s): ${missing.join(', ')}. Run pocket-game-night/.claude/workspace/setup.sh.`);
  } else {
    lines.push(`You are in the ${NAME[role]}. Follow "How we work" in CLAUDE.md.`);
    lines.push(role === 'test'
      ? 'You may edit tests/, specs/, reports/ and docs/ only, and you run all testing.'
      : 'You may edit app code only. Never write, edit or run tests; type-check instead and read reports/latest.md.');
    const here = locate(projectDir);
    if (here && here.clone !== role) lines.push(`WARNING: ${wrongFolderMessage(here.clone)}`);
  }
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(0);
}

function commit() {
  if (!entry) process.exit(0); // the owner committing by hand is always allowed
  const root = git('rev-parse --show-toplevel', process.cwd()).trim();
  // Outside the desktop app, the folder decides: the coder commits in Build, the tester in Test.
  const clone = locate(root)?.clone ?? 'build';
  if (entry !== 'claude-desktop') role = clone;
  const staged = git('diff --cached --name-only', root).split('\n').filter(Boolean);
  const bad = staged.filter((rel) => !allowed(clone, ownerOf(rel)));
  if (bad.length) {
    process.stderr.write(`Commit blocked: the ${NAME[role]} cannot commit these files:\n  ${bad.join('\n  ')}\n`);
    process.exit(1);
  }
  process.exit(0);
}

const mode = process.argv[2];
if (mode === 'commit') commit();
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* no input */ }
if (AGENT_ROLE[input.agent_type]) { agent = input.agent_type; role = AGENT_ROLE[agent]; }
({ pre, post, session })[mode]?.(input);
