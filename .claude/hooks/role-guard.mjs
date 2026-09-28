#!/usr/bin/env node
// Role guard: keeps the Build workspace (Claude Code in VS Code) and the
// Test workspace (Claude desktop app) apart. See CLAUDE.md, "Two workspaces".
//
// Modes:  pre     PreToolUse   - block edits to the other side's files, and test runs in Build
//         post    PostToolUse  - catch shell commands that changed the other side's files
//         session SessionStart - wire up the git hook and tell Claude which workspace it is in
//         commit  git pre-commit - block commits that cross the line
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const TEST_OWNED = ['tests/', 'specs/', 'reports/'];
const SHARED = ['docs/'];
const GOVERNANCE = ['CLAUDE.md', '.claude/', '.githooks/'];
const TEST_RUNNERS =
  /\b(vitest|playwright|stryker|jest|mocha|appium)\b|\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|e2e|sim|mutation)\b|\bnpm\s+t\b/;
const WEAKENING = /\.(skip|only|todo)\s*\(|\bx(it|describe|test)\s*\(/;

const entry = process.env.CLAUDE_CODE_ENTRYPOINT;
const role = entry === 'claude-desktop' ? 'test' : 'build';
const NAME = { build: 'Build workspace (VS Code)', test: 'Test workspace (Claude desktop app)' };

const git = (args, cwd) => execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const repoRoot = (cwd) => {
  try { return git('rev-parse --show-toplevel', cwd).trim(); } catch { return cwd; }
};

function ownerOf(rel) {
  if (GOVERNANCE.some((g) => (g.endsWith('/') ? rel.startsWith(g) : rel === g))) return 'governance';
  if (SHARED.some((p) => rel.startsWith(p))) return 'shared';
  return TEST_OWNED.some((p) => rel.startsWith(p)) ? 'test' : 'build';
}

// The Test workspace lives in a folder ending in "-testing"; the Build workspace does not.
const folderRole = (root) => (path.basename(root).endsWith('-testing') ? 'test' : 'build');

function wrongFolderMessage(root) {
  return role === 'test'
    ? `This is the Build folder (${root}). The desktop app tests from the pocket-game-night-testing clone. Open that folder instead.`
    : `This is the Test folder (${root}). Write code in VS Code from the pocket-game-night folder instead.`;
}

function out(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }
const decide = (decision, reason) =>
  out({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } });

function pre(input) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const root = repoRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());

  if (tool === 'Bash') {
    if (role === 'build' && TEST_RUNNERS.test(ti.command || '')) {
      decide('deny', 'Testing happens only in the Claude desktop app (Test workspace). Type-check instead, push, and read reports/latest.md for results.');
    }
    process.exit(0);
  }

  const file = ti.file_path || ti.notebook_path;
  if (!file) process.exit(0);
  const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
  if (rel.startsWith('..')) process.exit(0); // outside the repository

  const owner = ownerOf(rel);
  if (owner === 'governance') decide('ask', `${rel} is a project rule file. Changing it needs the owner's approval.`);
  if (folderRole(root) !== role) decide('deny', wrongFolderMessage(root));
  if (owner === 'shared') process.exit(0);
  if (owner !== role) {
    decide('deny', role === 'test'
      ? `${rel} is app code. The Test workspace never edits app code. Report the problem in reports/latest.md instead.`
      : `${rel} belongs to the Test workspace (tests, specs, reports). If a test looks wrong, add it to docs/test-questions.md and tell the owner.`);
  }
  if (role === 'test' && /(^|\/)tests\//.test(rel)) {
    const text = [ti.new_string, ti.content, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
    if (WEAKENING.test(text)) decide('ask', 'This adds a skipped, focused or placeholder test. Tests are never weakened without the owner\'s approval.');
  }
  process.exit(0);
}

function strayChanges(root) {
  let status = '';
  try { status = git('status --porcelain', root); } catch { return []; }
  return status.split('\n').filter(Boolean)
    .map((line) => line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''))
    .filter((rel) => { const o = ownerOf(rel); return o !== 'shared' && o !== 'governance' && o !== role; });
}

function post(input) {
  if (input.tool_name !== 'Bash') process.exit(0);
  const root = repoRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  const stray = strayChanges(root);
  if (stray.length) {
    out({
      decision: 'block',
      reason: `That command changed files the ${NAME[role]} must not touch: ${stray.slice(0, 10).join(', ')}. ` +
        'Undo those changes now (git restore / remove new files) and report the need instead.',
    });
  }
  process.exit(0);
}

function session(input) {
  const root = repoRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  try { git('config core.hooksPath .githooks', root); } catch { /* not a git repo yet */ }
  const lines = [`You are in the ${NAME[role]}. Follow "Two workspaces" in CLAUDE.md.`];
  lines.push(role === 'test'
    ? 'You may edit tests/, specs/, reports/ and docs/ only, and you run all testing.'
    : 'You may edit app code only. Never write, edit or run tests; type-check instead and read reports/latest.md.');
  if (folderRole(root) !== role) lines.push(`WARNING: ${wrongFolderMessage(root)}`);
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(0);
}

function commit() {
  if (!entry) process.exit(0); // the owner committing by hand is always allowed
  const root = repoRoot(process.cwd());
  const staged = git('diff --cached --name-only', root).split('\n').filter(Boolean);
  const bad = staged.filter((rel) => { const o = ownerOf(rel); return o !== 'shared' && o !== 'governance' && o !== role; });
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
({ pre, post, session })[mode]?.(input);
