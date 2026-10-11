# Exact rule edits for faster cycles and design before code (orchestrator, 11 October 2026)

Status: **approved by the owner, 11 October 2026** ("choose the options which will ensure lower cycle time but also balance
token consumption"). The orchestrator chose all of A–F with three token limits: **B** coders run only their lane's area
tests plus screenshots, never the full suite; **C** at most 2 testers in parallel, each short-lived; **E** the player helper
runs only on release candidates and on design prototypes, not on every bundle.

Original status: for the owner's approval, item by item. These edit project rules (root `CLAUDE.md`, `.claude/workspace/`,
`.claude/hooks/role-guard.mjs`, `.githooks/pre-commit`), so nothing is changed until the owner says yes. Sources:
`docs/proposals/faster-cycles.md` (items 1, 4, 5, 10, 12) and `docs/proposals/design-before-code.md` (step 1, already
approved in principle on 8 October). After approval the coder makes the hook and workflow edits in one lane, the
orchestrator makes the doc edits, and the reviewer checks both.

## A. Code and its tests land together, checked before merge (faster-cycles 1)
- **Rule (root `CLAUDE.md` "The loop", `.claude/workspace/CLAUDE.md` "Handing work over"):** each change is one short
  lane branch. The tester puts the matching test changes **on the same lane branch** (from its own Test worktree, see C).
  The orchestrator merges a lane to `main` only when quick verify **on that lane branch** is green and the branch is up
  to date with `main`. `main` stays green.
- **Automation (`.github/workflows/quick.yml`):** also run on pushes to `lane-*` branches, without publishing the
  preview (the preview publishes only from `main`, as now).
- **Effect:** ends "main red for hours"; code and tests are judged together.

## B. Coders may run the frozen tests and take screenshots, never edit tests (faster-cycles 4)
- **Rule (root `CLAUDE.md` roles table; `.claude/workspace/agents/coder.md`):** Build role "May run: type-check,
  boundaries, build, lint, **and the pushed tests of its lane, read only**, plus a screenshot command for its own
  screens at 360 × 640, 390 × 844 and 812 × 375". Unchanged: Build never writes, edits, skips or deletes tests, specs or
  reports.
- **Role guard (`role-guard.mjs`):** allow test-runner commands for the Build role **only inside a lane worktree**
  (`pocket-game-night-lane-*`); keep denying every edit to `tests/`, `specs/`, `reports/` for Build; the orchestrator
  still never runs tests.
- **Commit check (`.githooks/pre-commit`, plus a CI check on lane branches):** any Build commit that touches `tests/`,
  `specs/` or `reports/` is refused (already true locally; the CI check makes it hold on GitHub too).
- **Effect:** most failures and layout problems caught in minutes inside the build step; fix rounds 2–3 → about 1.

## C. Short-lived, focused testers, one per area (faster-cycles 5)
- **Rule (`.claude/workspace/CLAUDE.md` "Never two testers"; root `CLAUDE.md`):** becomes "never two testers **in the
  same folder**". Each tester works in its own worktree of the Test clone (`pocket-game-night-testing-lane-*`), one per
  lane, started fresh for one job and ended when it hands back. A short `reports/tester-notes.md` carries what the next
  tester needs. The Claude desktop app and a tester subagent still never share a folder.
- **Role guard:** treat `pocket-game-night-testing-lane-*` worktrees as Test-role folders.
- **Effect:** no single queue; no stalls from a full context.

## D. Review by risk (faster-cycles 10)
- **Rule (`.claude/workspace/CLAUDE.md` roles table, `docs/change-sop.md`):** the reviewer checks every **C2 and C3**
  change before merge (as now). **C0 and C1** changes merge after green quick verify; the reviewer reads them once per
  bundle, before the bundle's complete run. The reviewer also flags any deleted, skipped or loosened test check
  (faster-cycles 11).
- **Effect:** look and wording changes stop waiting for a review each.

## E. Player helper installed in this workspace (faster-cycles 12)
- **New brief `.claude/workspace/agents/player.md`:** as `docs/proposals/player-agent.md` (plays the live preview as one
  persona, never reads scenarios, decisions or guidelines, edits nothing, runs no tests); the orchestrator calls it after a
  green bundle and before every release; the product owner may call it too.
- **Role guard:** a `player` role that may only use the browser and read the files the caller names.
- **Needs:** a browser tool for agents. Proposed: the free Playwright MCP server, added to the workspace settings
  (`.claude/settings.json`), read-only use against the preview link. No paid service.

## F. Design before code, step 1 (approved 8 October; wording for the record)
- **New brief `.claude/workspace/agents/critic.md`:** read only; reviews a screen map or prototype for gaps against the
  player intentions and guidelines; reports to the product owner.
- **Design freeze rule (`docs/change-sop.md`, `docs/new-game-process.md`):** once a game's screen map and prototype are
  signed off, the design is frozen for that build; changes go to the next design round, except stuck or privacy problems
  (I30).
- **Role guard:** the product owner may edit `docs/games/<game>/screen-map.*` (in the product clone, as for other docs).

## What does not change
The coder never edits tests; the tester never edits app code; the orchestrator never runs tests; C3 is tests first; the
owner approves behaviour; releases follow I30 and the bundling rule of 8 October.
