#!/usr/bin/env node
// Role guard: keeps code and tests apart. See CLAUDE.md, "How we work".
//
// Roles:  build        writes app code in pocket-game-night/ (the coder subagent, or Claude Code
//                      opened in that folder)
//         test         writes and runs tests in pocket-game-night-testing/ (the tester subagent,
//                      or the Claude desktop app opened in that folder)
//         orchestrator the main session opened in the workspace folder that holds the clones;
//                      hands work to the coder and tester, edits only docs/ in the Build clone
//         product      the product owner: the Claude desktop app opened in pocket-game-night-product/
//                      (or in the workspace folder); edits only docs/ in its own clone, runs no tests,
//                      and may work in parallel with the others because it never writes to their clones
//         ux           the ux-designer subagent the product owner calls: reads every clone, changes
//                      nothing, runs no commands
//         review       the reviewer subagent the orchestrator calls before merging a lane: reads every
//                      clone, runs only git diff/log/show/status, changes nothing
//         critic       the critic subagent: reads screen maps and prototypes, changes nothing, runs nothing
//         player       the player subagent: plays the live preview in a browser as one persona; never reads
//                      scenarios, decisions or guidelines; changes nothing, runs nothing
// Owner, 11 October 2026 (docs/proposals/rule-edits-faster-cycles.md): coders may run their lane's pushed
// tests (never edit them); testers may work in their own Test worktrees, <test folder>-lane-<letter>.
//
// Modes:  pre     PreToolUse   - block edits and reads outside the role, and test runs outside Test
//         post    PostToolUse  - catch shell commands that changed files the role must not touch
//         session SessionStart - wire up the git hook and tell Claude which role it has
//         commit  git pre-commit - block commits that cross the line
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
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
const AGENT_ROLE = { coder: 'build', tester: 'test', 'ux-designer': 'ux', reviewer: 'review', critic: 'critic', player: 'player', 'jev-design': 'jevdesign' };
// Coders may run these in their lane (never mutation, mass simulation or the emulator).
const LANE_TEST_RUNNERS = /\b(vitest|playwright)\b|\bnpm\s+(run\s+)?(test|test:browser|screenshots)\b|\bnpm\s+t\b/;
const HEAVY_RUNNERS = /\b(stryker|appium)\b|\b(npm|pnpm|yarn|bun)\s+(run\s+)?(sim|mutation|e2e)\b/;
// The player plays as a family would: it never reads the design or the rules behind the screens.
const PLAYER_FORBIDDEN = /(^|\/)(specs\/|docs\/decisions\.md$|docs\/ux-guidelines\.md$|docs\/games\/[^/]+\/(scenarios|guide|ux|lifecycle|screen-map)\b)/;
// The lethal trifecta (owner, 16 October 2026): only the tester, which runs Jev, may read the key files; the tester,
// which holds the key, never fetches web pages or drives a browser.
const SECRET_FILES = /(^|[\/\s'"*])(\.env\.local|\.claude\/settings\.local\.json|settings\.local\.json)\b/;
const WEB_TOOLS = /^(WebFetch|WebSearch|mcp__browser__.*)$/;
// The jev-design helper (owner, 23 October 2026): holds the Jev key for design checks, so it reads only the product docs
// and the Jev tools, never reports or other helpers' output, writes only design reports, and never commits or pushes.
const JEV_TOOLS = /^tests\/(tools\/jev[^/]*|sim\/jev[^/]*)$|^tests\/tools\/jev-design\//;
const JEV_GIT = /^\s*git\s+-C\s+("[^"]*pocket-game-night-product"|'[^']*pocket-game-night-product'|\S*pocket-game-night-product)\/?\s+(pull|status)\b[^;&|`$<>]*$/;
const NETWORK_COMMANDS = /\b(curl|wget|gh|ssh|scp|nc|open)\b/;
const SCRATCH = /^\/(private\/)?tmp\/claude-/;
// The reviewer may only look at changes: git diff, log, show, status (optionally after `cd <folder> &&`).
const READ_ONLY_GIT = /^\s*(cd\s+("[^"]*"|'[^']*'|[^\s;&|]+)\s*&&\s*)?git\s+(diff|log|show|status)\b[^;&|`$<>]*$/;

// This file lives in every clone; the clones sit side by side in the workspace folder.
const real = (p) => { try { return realpathSync(p); } catch { return path.resolve(p); } };
const SELF = real(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
// A lane (a worktree named <clone>-lane-<letter>) runs its own copy of this file: drop the lane ending first.
const BASE = SELF.replace(/-lane-[a-z]$/, '').replace(/-(testing|product)$/, '');
const FOLDER = { build: BASE, test: `${BASE}-testing`, product: `${BASE}-product` };
const WORKSPACE = path.dirname(FOLDER.build);
// Lanes: extra working copies of the Build clone (git worktrees) named <build folder>-lane-<letter>, one per
// parallel coder (docs/proposals/parallel-coders.md). They count as the Build clone everywhere.
const LANES = (() => {
  const prefix = `${path.basename(FOLDER.build)}-lane-`;
  try {
    return readdirSync(WORKSPACE)
      .filter((n) => n.startsWith(prefix) && /^[a-z]$/.test(n.slice(prefix.length)))
      .map((n) => path.join(WORKSPACE, n));
  } catch { return []; }
})();
// Test lanes: worktrees of the Test clone, <test folder>-lane-<letter>, one short-lived tester each (owner,
// 11 October 2026). They count as the Test clone everywhere.
const TEST_LANES = (() => {
  const prefix = `${path.basename(FOLDER.test)}-lane-`;
  try {
    return readdirSync(WORKSPACE)
      .filter((n) => n.startsWith(prefix) && /^[a-z]$/.test(n.slice(prefix.length)))
      .map((n) => path.join(WORKSPACE, n));
  } catch { return []; }
})();
// Every working copy the guard knows: [key, root, clone].
const ROOTS = [
  ...Object.entries(FOLDER).map(([clone, root]) => [clone, root, clone]),
  ...LANES.map((root) => [path.basename(root), root, 'build']),
  ...TEST_LANES.map((root) => [path.basename(root), root, 'test']),
];
// Is this shell command run inside a Build lane (its folder, or `cd <lane> && …`)?
function inBuildLane(cwd, command) {
  const dirs = [real(cwd)];
  const m = /^\s*cd\s+("([^"]*)"|'([^']*)'|([^\s;&|]+))/.exec(command || '');
  if (m) dirs.push(real(path.resolve(cwd, m[2] ?? m[3] ?? m[4])));
  return dirs.some((d) => LANES.some((lane) => inside(d, lane)));
}

const entry = process.env.CLAUDE_CODE_ENTRYPOINT;
const projectDir = real(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const inside = (dir, root) => dir === root || dir.startsWith(root + path.sep);
// The desktop app is the Test role in the Test clone, and the product owner anywhere else.
let role = entry === 'claude-desktop'
  ? (inside(projectDir, FOLDER.test) ? 'test' : 'product')
  : projectDir === WORKSPACE ? 'orchestrator' : 'build';
let agent = null; // 'coder', 'tester' or 'ux-designer' when a subagent is acting
const NAME = { build: 'Build role', test: 'Test role', orchestrator: 'orchestrator', product: 'product owner', ux: 'UX designer', review: 'reviewer', critic: 'critic', player: 'player', jevdesign: 'jev-design helper' };
const who = () => (agent ? `${agent} subagent` : NAME[role]);

const git = (args, cwd) => execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const base = (clone) => path.basename(FOLDER[clone]);

// Which clone a path is in, and its path inside that clone; null when it is in neither.
function locate(p) {
  let dir = path.resolve(p);
  let rest = '';
  while (!existsSync(dir)) { rest = path.join(path.basename(dir), rest); dir = path.dirname(dir); }
  const full = path.join(real(dir), rest);
  for (const [, root, clone] of ROOTS) {
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
function allowed(clone, owner, rel = '') {
  if (role === 'jevdesign') return clone === 'product' && rel.startsWith('docs/games/');
  if (owner === 'governance') return true;
  if (role === 'orchestrator') return owner === 'shared' && clone === 'build';
  if (role === 'product') return owner === 'shared' && clone === 'product';
  return clone === role && (owner === 'shared' || owner === role);
}

function wrongFolderMessage(clone) {
  if (agent) return `The ${agent} works only in ${base(role)}/, not ${base(clone)}/.`;
  if (role === 'product') return `The product owner edits only docs/ in ${base('product')}/, not ${base(clone)}/.`;
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
// Bringing a lane up to date (owner, 22 October 2026): during a merge, rebase or cherry-pick, a staged file that matches
// the branch coming in is that branch's committed work, not this role's edit. Returns a test for such files.
function incoming(root) {
  for (const ref of ['MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD']) {
    try { git(`rev-parse -q --verify ${ref}`, root); } catch { continue; }
    try {
      const differ = new Set(git(`diff --cached --name-only ${ref}`, root).split('\n').filter(Boolean));
      return (rel) => !differ.has(rel);
    } catch { return () => false; }
  }
  return () => false;
}

// The jev-design helper: reads the product docs, the Jev tools and the key; runs the Jev tool; writes only design
// reports in the product docs' game folders or a scratchpad; no other git than pulling and checking the product clone.
function jevDesign(tool, ti, cwd) {
  const why = 'The jev-design helper holds the Jev key, so it reads only the product docs and the Jev tools, ' +
    'never reports, test output, the web or other helpers\' work, and changes only design reports (never all three in one helper).';
  if (READ_TOOLS.includes(tool)) {
    const asked = [ti.file_path, ti.path, ti.pattern, ti.glob].join(' ');
    if (SECRET_FILES.test(' ' + asked)) process.exit(0);
    const loc = locate(path.resolve(cwd, ti.file_path || ti.path || '.'));
    const ok = loc && ((loc.clone === 'product' && loc.rel.startsWith('docs/')) || (loc.clone === 'test' && JEV_TOOLS.test(loc.rel)));
    if (!ok) decide('deny', `${why} Give the tool a path inside pocket-game-night-product/docs/ or a Jev tool.`);
    process.exit(0);
  }
  if (tool === 'Bash') {
    const cmd = ti.command || '';
    if (/\bgit\b/.test(cmd) && !JEV_GIT.test(cmd)) decide('deny', `${why} Its only git commands are \`git -C <product clone> pull\` and \`status\`.`);
    if (NETWORK_COMMANDS.test(cmd)) decide('deny', why);
    if (/(^|[\s\/'"=])reports\//.test(cmd)) decide('deny', why);
    return; // the shared shell checks below still apply (no test runners; files changed are checked afterwards)
  }
  const file = ti.file_path || ti.notebook_path;
  if (!file) process.exit(0);
  const full = path.resolve(cwd, file);
  const loc = locate(full);
  if (SCRATCH.test(real(path.dirname(full))) && !loc) process.exit(0);
  if (loc && allowed(loc.clone, ownerOf(loc.rel), loc.rel)) process.exit(0);
  decide('deny', `${why} It writes only to pocket-game-night-product/docs/games/<game>/ (left uncommitted) or the scratchpad.`);
}

function pre(input) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};
  const cwd = input.cwd || projectDir;

  // Never all three in one helper: the key files are for the tester and the jev-design helper alone, and neither goes on the web.
  if ((role === 'test' || role === 'jevdesign') && WEB_TOOLS.test(tool)) {
    decide('deny', `The ${who()} holds the Jev key, so it never fetches web pages, searches the web or drives a browser ` +
      '(never all three in one helper). Report the link or page you need instead.');
  }
  if (role === 'jevdesign') jevDesign(tool, ti, cwd);
  if (role !== 'test' && role !== 'jevdesign') {
    const looked = tool === 'Bash' ? ti.command : READ_TOOLS.includes(tool) ? [ti.file_path, ti.path, ti.pattern, ti.glob].join(' ') : '';
    if (looked && SECRET_FILES.test(' ' + looked)) {
      decide('deny', `.env.local and .claude/settings.local.json hold the Jev key; only the tester reads them (never all ` +
        `three in one helper). The ${who()} works without the key.`);
    }
  }

  // The reviewer reads anything and runs read-only git, nothing else.
  if (role === 'review') {
    if (READ_TOOLS.includes(tool)) process.exit(0);
    if (tool === 'Bash' && READ_ONLY_GIT.test(ti.command || '')) process.exit(0);
    decide('deny', 'The reviewer changes nothing and runs only git diff, log, show or status. Put the finding in your reply.');
  }

  // The player uses the browser and may read only what the caller names, never the design or rules.
  if (role === 'player') {
    if (READ_TOOLS.includes(tool)) {
      const loc = locate(path.resolve(cwd, ti.file_path || ti.path || '.'));
      if (loc && PLAYER_FORBIDDEN.test(loc.rel)) {
        decide('deny', 'The player plays from the screen only: it never reads scenarios, guides, decisions or guidelines.');
      }
      process.exit(0);
    }
    if (tool === 'Bash' || ti.file_path || ti.notebook_path) {
      decide('deny', 'The player changes nothing and runs no commands. Report what you saw as a player instead.');
    }
    process.exit(0);
  }

  // The UX designer and the critic read anything (the designer also uses the browser), but change and run nothing.
  if (role === 'ux' || role === 'critic') {
    if (READ_TOOLS.includes(tool)) process.exit(0);
    if (tool === 'Bash' || ti.file_path || ti.notebook_path) {
      decide('deny', 'The UX designer changes nothing and runs no commands. Report the finding to the product owner instead.');
    }
    process.exit(0);
  }

  if (tool === 'Bash') {
    const cmd = ti.command || '';
    if (role !== 'test' && TEST_RUNNERS.test(cmd)) {
      // Coders may run the pushed tests of their own lane (read only) and take screenshots; never heavy runs.
      const laneRun = role === 'build' && inBuildLane(cwd, cmd) && LANE_TEST_RUNNERS.test(cmd) && !HEAVY_RUNNERS.test(cmd);
      if (!laneRun) {
        decide('deny', role === 'orchestrator'
          ? 'The orchestrator never runs tests. Hand testing to the tester subagent.'
          : role === 'build'
            ? 'Coders run tests only inside their lane folder (pocket-game-night-lane-<x>), only the area tests and screenshots, never mutation, simulation or the emulator.'
            : 'Only the Test role runs tests. Type-check instead, push, and read reports/latest.md for results.');
      }
    }
    if (input.tool_use_id) {
      const snap = Object.fromEntries(ROOTS.map(([key, root]) => [key, changedFiles(root)]));
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
  if (!loc) process.exit(0); // outside the clones
  const { clone, rel } = loc;

  const owner = ownerOf(rel);
  if (owner === 'governance') {
    if (agent) decide('deny', `${rel} is a project rule file. Subagents never change it; tell the orchestrator.`);
    decide('ask', `${rel} is a project rule file. Changing it needs the owner's approval.`);
  }
  if (role === 'product') {
    if (allowed(clone, owner)) process.exit(0);
    decide('deny', clone === 'product'
      ? `The product owner edits only docs/. ${rel} belongs to the ${owner === 'test' ? 'tester' : 'coder'}; describe the change for the orchestrator instead.`
      : wrongFolderMessage(clone));
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
  const own = role === 'test' ? 'test' : role === 'product' ? 'product' : 'build';
  const stray = [];
  // The working copies this command ran in (its folder, or `cd <folder> && …`). Owner, 23 October 2026: with several
  // coders and testers in lanes at once, a command is checked only against the folder it worked in, so another lane's
  // work in progress is never blamed on it (and never "undone" by it).
  const cwd = real(input.cwd || projectDir);
  const m = /^\s*cd\s+("([^"]*)"|'([^']*)'|([^\s;&|]+))/.exec(input.tool_input?.command || '');
  const dirs = [cwd, ...(m ? [real(path.resolve(cwd, m[2] ?? m[3] ?? m[4]))] : [])];
  const here = new Set(ROOTS.filter(([, root]) => dirs.some((d) => inside(d, root))).map(([key]) => key));
  for (const [key, root, clone] of ROOTS) {
    // Several agents work at once (product owner, tester, coders in lanes), so each checks only its own
    // working copies; another agent's work landing meanwhile is not this command's doing. The orchestrator
    // (which edits only docs/ in the Build clone) checks the Build clone only: coders work in the lanes meanwhile.
    // The jev-design helper may only leave design reports behind: it checks the Build and Product clones.
    const mine = role === 'jevdesign' ? key === 'build' || key === 'product'
      : clone === own && !(role === 'orchestrator' && key !== 'build');
    if (!mine) continue;
    // A helper that ran in one of its working copies is checked there only; from elsewhere (the workspace folder),
    // only its main clone.
    if (role !== 'jevdesign' && role !== 'orchestrator' && (here.size ? !here.has(key) : key !== clone)) continue;
    const now = changedFiles(root);
    // Without a snapshot, check the role's own clone fully and skip the other one.
    const was = new Set(before ? before[key] ?? [] : clone === own ? [] : now);
    const fromBranch = incoming(root);
    for (const line of now) {
      if (was.has(line)) continue;
      const rel = line.slice(3).split(' -> ').pop().replace(/^"|"$/g, '');
      // Staged as it came from the other branch, with no edit on top: not this role's change.
      if (line[1] === ' ' && fromBranch(rel)) continue;
      if (!allowed(clone, ownerOf(rel), rel)) stray.push(`${path.basename(root)}/${rel}`);
    }
  }
  if (stray.length) {
    out({
      decision: 'block',
      reason: `That command changed files the ${who()} must not touch: ${stray.slice(0, 10).join(', ')}. ` +
        'Undo those changes now (git restore / remove new files), only inside the folder you worked in, and report the need instead.',
    });
  }
  process.exit(0);
}

function session() {
  for (const root of Object.values(FOLDER)) {
    try { git('config core.hooksPath .githooks', root); } catch { /* clone missing or not a repo yet */ }
  }
  const lines = [];
  if (role === 'product') {
    lines.push('You are the product owner. Work in pocket-game-night-product/ and edit only its docs/.');
    lines.push('Read anything in any clone; never edit the Build or Test clones, never run tests. Send build and test work through the orchestrator.');
  } else if (role === 'orchestrator') {
    lines.push('You are the orchestrator, in the workspace folder. Follow CLAUDE.md here, then pocket-game-night/CLAUDE.md.');
    lines.push('Hand app code to the coder subagent and testing to the tester subagent. You edit only docs/ in pocket-game-night/.');
    const missing = Object.values(FOLDER).filter((root) => !existsSync(path.join(root, '.git')));
    if (missing.length) lines.push(`WARNING: missing clone(s): ${missing.join(', ')}. Run pocket-game-night/.claude/workspace/setup.sh.`);
  } else {
    lines.push(`You are in the ${NAME[role]}. Follow "How we work" in CLAUDE.md.`);
    lines.push(role === 'test'
      ? 'You may edit tests/, specs/, reports/ and docs/ only, and you run all testing.'
      : 'You may edit app code only. Never write or edit tests. In a lane folder you may run your area\'s pushed tests and screenshots; otherwise type-check and read reports/latest.md.');
    const here = locate(projectDir);
    if (here && here.clone !== role) lines.push(`WARNING: ${wrongFolderMessage(here.clone)}`);
  }
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(0);
}

function commit() {
  if (!entry) process.exit(0); // the owner committing by hand is always allowed
  const root = git('rev-parse --show-toplevel', process.cwd()).trim();
  // The folder decides who is committing: the coder in Build, the tester in Test, the product owner
  // in Product. The desktop app may commit only in the Test clone (as Test) or Product (as product owner).
  const clone = locate(root)?.clone ?? 'build';
  if (entry !== 'claude-desktop' || clone !== 'build') role = clone;
  const staged = git('diff --cached --name-only', root).split('\n').filter(Boolean);
  const fromBranch = incoming(root);
  const bad = staged.filter((rel) => !allowed(clone, ownerOf(rel)) && !fromBranch(rel));
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
