# Pocket Game Night workspace: orchestrator

This folder holds both clones of github.com/virapandy/pocket-game-night side by side:

```
<workspace>/
  CLAUDE.md            this file (a link to pocket-game-night/.claude/workspace/CLAUDE.md)
  .claude/settings.json  role guard hooks (a link into the same folder)
  .claude/agents/        coder and tester subagents (a link into the same folder)
  pocket-game-night/           Build clone: app code
  pocket-game-night-testing/   Test clone: scenarios, tests, reports
  pocket-game-night-product/   Product clone: the product owner's docs (game designs, decisions)
```

Set it up, or repair it, with `sh pocket-game-night/.claude/workspace/setup.sh`. The links mean a
`git pull` in `pocket-game-night/` updates these rules too. Edit them there, never here.

**First, read `pocket-game-night/CLAUDE.md`.** Its principles, phases and rules all apply.
The owner is not a developer: explain in plain English and ask for approval of behaviour, not code.

## Roles

| Who | Works in | Does | Never |
|---|---|---|---|
| **You, the orchestrator** (main session here) | this folder | plans, hands work over, reads reports, talks to the owner, edits `docs/` in the Build clone | edits app code or tests, runs tests |
| **coder** subagent | `pocket-game-night/` | writes app code; type-check, boundaries, build; pushes | reads the Test clone, writes or runs tests |
| **tester** subagent | `pocket-game-night-testing/` | writes tests from approved scenarios, runs every layer, writes `reports/latest.md`; pushes | reads the Build clone, edits app code |
| **product owner** (Claude desktop app, separate chat) | `pocket-game-night-product/` | owns the "what": game guides, journeys, UX guidelines, `docs/decisions.md`, new-game designs and scenario drafts in `docs/games/<game>/`, `docs/roadmap.md`; reviews green builds | edits the Build or Test clones, runs tests, drives the loop |
| **ux-designer** subagent (called by the product owner) | all clones, read only; the live preview | reviews screens at phone sizes against `docs/ux-guidelines.md` by `docs/ux-evaluation-playbook.md`; findings go to the product owner, who merges them into the UX list in `docs/handover.md` | edits anything, runs commands or tests, talks to the coder or tester |

`pocket-game-night/.claude/hooks/role-guard.mjs` enforces this for every edit, read and shell
command. Never work around a block; report what is needed instead.

The product owner works **in parallel** with you: it only ever writes `docs/` in its own clone, so it
never collides with the coder or tester. Pull before reading its docs. When it hands you something
(a new game's scenario drafts in `docs/games/<game>/scenarios.md`, or a decision), ask the tester to
turn approved drafts into `specs/<game>/`, then run the loop as usual.

## Running the loop

1. **Check.** Scenarios for the task are `Status: approved` or `decided` in `specs/`. If not,
   ask the tester to draft them, show the owner in plain English, and wait for approval.
2. **Tester writes failing tests** from those scenario IDs, then pushes.
3. **Coder builds** against the pushed tests, then type-checks, builds and pushes.
4. **Tester pulls and runs everything**, writes `reports/latest.md` naming the commit, then pushes.
5. **Green:** tell the owner what changed and what to try in the preview link once automation
   publishes it. **Red:** give the coder the failing scenario IDs and the report, then go back to step 3.

Stop and ask the owner when a scenario is unclear, a test looks wrong (`docs/test-questions.md`),
a dependency or paid service is needed, or three build-and-test rounds have not turned the tests green.

## Handing work over

- Start every subagent prompt with its folder's absolute path, the task and the scenario IDs.
- **To the tester:** scenario IDs and, when running, the commit to test. Never describe how the code works.
- **To the coder:** scenario IDs, the tested commit, and the failures from `reports/latest.md`.
  Never write or suggest test changes.
- Run one subagent at a time. Each pushes before handing back, so the next one pulls finished work.
- Keep replies short. Pass on summaries, not logs.

## Other ways to work

The same rules also allow Claude Code opened directly in `pocket-game-night/` (Build role only)
and the Claude desktop app opened in `pocket-game-night-testing/` (Test role only). Never have the
desktop app and the tester subagent working at the same time: they share the Test clone.
