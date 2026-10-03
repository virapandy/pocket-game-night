# Proposal: up to 3 coders at once, each in its own lane

Status: **approved by the owner, 3 October 2026** (asked for by `docs/change-sop.md`, "Parallel work"). The owner works
on the same MacBook Air, so: coders are light (their thinking runs remotely; locally only edits, type-check and
build), up to 3 lanes; the tester's local browser runs use at most 3 workers at low priority (`taskpolicy -b`,
efficiency cores) and the heavy runs happen on GitHub.

## What changes for the owner
Nothing to do day to day. Up to three coders build different parts of the app at the same time; the orchestrator
merges each one's finished work into `main`, and the quick checks run after each merge. Same safety rules: coders
still never touch tests, and nobody but the tester runs them.

## How it works
- The orchestrator makes up to three extra working copies of the Build clone, called **lanes**, next to it:
  `pocket-game-night-lane-a/`, `-lane-b/`, `-lane-c/` (git worktrees: they share one repository, so no extra
  downloads). Each lane works on its own short branch, `lane-a`, `lane-b` or `lane-c`.
- Each lane owns one area of screens (the handover names them), so no two coders change the same file. If two
  changes need the same file, they go to the same lane. C3 (core) changes are never split across lanes.
- A coder pushes only its lane branch, never `main`. The orchestrator merges lane branches into `main` one at a
  time (rebasing on the latest `main` first), then deletes the branch once merged. Branches live hours, not days.

## Exact rule edits (one commit)
1. **`.claude/hooks/role-guard.mjs`**: folders named `pocket-game-night-lane-<letter>` in the workspace folder
   count as the Build clone, for edits, reads, shell side effects and commits. Without this, the guard would not
   recognise a lane and would let anything through there.
   - add `LANES`: the workspace folder's entries named `<build folder>-lane-<a-z>`;
   - `locate()`: a path inside a lane returns clone `build`, with its path relative to that lane;
   - `post()`: also checks files changed in each lane (a coder's shell command may only change Build files);
   - `commit()` already decides by folder, so a commit in a lane is checked as a Build commit.
2. **`.claude/workspace/agents/coder.md`**: "Where you work" adds: the orchestrator may name a lane folder instead
   of `pocket-game-night/`; in a lane, work on that lane's branch, change only the files of the lane's area, and
   `git push origin lane-<x>`, never `main`.
3. **`.claude/workspace/CLAUDE.md`** ("Handing work over"): replaces "one coder and one tester when the owner asks"
   with: up to three coders in lanes plus one tester; the orchestrator creates the lanes
   (`git -C pocket-game-night worktree add ../pocket-game-night-lane-a -b lane-a`), merges each finished lane into
   `main`, and removes lanes when the work is merged.
4. **Root `CLAUDE.md`** ("Git"): "one branch, `main`" becomes "`main`, plus short lane branches the orchestrator
   merges within hours".

## Why it's safe
The tester still sees only pushed code on `main` (lane branches are not tested until merged), the guard keeps every
lane to Build files only, and quick verify runs on `main` after each merge.
