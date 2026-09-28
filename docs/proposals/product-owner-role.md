# Proposal: add a product owner role to the workspace rules

Status: **applied 28 September 2026**, after Phase 1a turned green and the orchestrator was idle.
The guard was tested for all four roles (edits, reads, test commands, commits, shell side effects).

## Why
The workspace has three roles (orchestrator, coder, tester). Product work (game designs, guides,
journeys, decisions, UX guidelines, answering behaviour questions) has no lane of its own. Doing it in
the Test clone would collide with the tester; the orchestrator's `docs/` edits are for running the loop.

## The role
| Product owner | |
|---|---|
| Who | Claude in the desktop app, opened in `pocket-game-night-product/` |
| Owns | `docs/games/` (guides, journeys, rhymes, new-game designs and scenario drafts), `docs/decisions.md`, `docs/ux-guidelines.md`, `docs/new-game-process.md`, `docs/proposals/` |
| May read | everything in all three clones |
| Never | edits `src/`, `content/`, `tests/`, `specs/`, `reports/` or configs; runs tests; commits outside `docs/` |
| Works with | the **tester**, who turns approved scenario drafts from `docs/games/<game>/` into `specs/<game>/`; the **orchestrator**, who keeps `docs/handover.md` and `docs/test-questions.md` (the product owner answers behaviour questions there by telling the orchestrator, or in a decisions entry) |

Safe in parallel: the product owner never writes to the Build or Test clones, and its commits touch
only its own files in `docs/`, so it can run while the orchestrator, coder and tester work.

## Changes to apply (one commit, while the orchestrator is idle)
1. **`.claude/hooks/role-guard.mjs`**
   - Add a third folder: `FOLDER.product = <build folder> + '-product'`.
   - Role for the desktop app by folder: `-testing` → test, `-product` → product; the Build folder → deny.
   - `allowed()`: product may change only `shared` files (`docs/`) in the product clone.
   - Reads: product may read all clones. Test commands: denied for product.
   - `commit()`: in the product clone, allow only `docs/`.
   - `session()`: "You are the product owner …" message; warn if opened in another clone.
2. **`.claude/workspace/CLAUDE.md`**: add the product owner row to the Roles table, the parallel-safety
   note, and how scenario drafts move from `docs/games/<game>/` to `specs/<game>/`.
3. **`.claude/workspace/setup.sh`**: clone `pocket-game-night-product/` too, and set its git hook path.
4. **Root `CLAUDE.md`**: add the product owner row to the "Two workspaces" table.
5. **`docs/new-game-process.md`**: step 8 drafts go to `docs/games/<game>/scenarios.md`; the tester
   moves approved ones into `specs/<game>/`.
6. Remove the interim local pre-commit hook from `pocket-game-night-product/` and set
   `core.hooksPath .githooks` there, like the other clones.

## How to apply
When the VS Code orchestrator has no task running, either:
- ask the orchestrator: "Apply docs/proposals/product-owner-role.md", or
- close the VS Code session and ask the product owner to apply it.

Every rule file edit asks the owner first. After applying, test the guard for all four roles
(orchestrator, coder, tester, product) before resuming the loop.
