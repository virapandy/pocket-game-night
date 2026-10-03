# Change SOP: sort every change, then follow its lane

Owner decision, 3 October 2026: cycles must be fast. The complete test runs **only before a release**.
Every change is first sorted into one of the classes below; the class decides what checking it gets.
The orchestrator does the sorting and writes the class next to the change (for example "row 3: C1").

## The engineering patterns this follows
| Pattern | Where it comes from | What we take from it |
|---|---|---|
| Standard / normal / high-risk changes | ITIL change management | Low-risk change types are pre-approved and follow a fixed recipe; only risky ones get extra checks |
| Test only what a change can reach | Google's test selection, test impact analysis | Quick checks on every change; the complete run on a batch |
| Batch verification and finding the culprit | Google, merge queues (GitHub, Shopify, Uber) | One heavy run per batch; if it fails, rerun the failures on each change to find which broke it |
| Release train | Mobile and web release practice | Changes flow continuously to the preview; families get a release only after the complete run |
| Trunk-based development with short branches | DORA research on fast teams | Small changes merged to `main` within hours, never long-lived branches |
| Parallel work in separate working copies, split by area | git worktrees; code ownership | Several coders at once, each on its own screens, so their changes don't collide |
| One-way and two-way doors | Amazon | Reversible choices (wording, layout) are decided quickly; hard-to-undo ones (money, saved data) are slowed down |

## Classes
| Class | What it covers | Examples |
|---|---|---|
| **C0 Docs** | docs, reports, specs wording only | handover, decisions, a test report |
| **C1 Look** | how one screen looks or reads; no new behaviour | colour, size, spacing, wording, margins, button style, fitting the width, landscape layout |
| **C2 Screen behaviour** | what a screen does, without touching rules, money, saved data or the ticket/QR format | a new confirmation dialog, a button moving to another step, a new banner, screen-reader announcements |
| **C3 Core** | anything that could spoil a game or lose data | game rules, money and payouts, winners and claims checking, saved games and their format, ticket and QR contents, privacy, secrets and seeds, dependencies, build and automation settings |
| **Hotfix** | something broken in the released app | any class, done first and alone |

When unsure between two classes, take the higher one.

## What each class gets
| Step | C0 | C1 Look | C2 Screen behaviour | C3 Core |
|---|---|---|---|---|
| Owner approval | none | the UX list row is enough | the UX list row is enough | scenarios approved by the owner |
| Tests | none | none first; the tester updates any test the change breaks | the tester writes or updates tests **at the same time** as the coder builds | tests **first**, then the build |
| Checks before push (coder, ~10 s) | none | type-check, boundaries, build | same | same |
| Quick verify (automatic on push, ~3 min) | none | rule tests, smoke set, that screen's tests, screenshots at 360, 390 and 812 × 375 | same, plus that area's browser tests | same, plus that area's tests on both phones |
| Can be batched with others | yes | yes, freely | yes | in a batch of its own, or last in a batch |
| Goes to the preview | n/a | after quick verify | after quick verify | after quick verify |

## Release (the only complete test)
1. The orchestrator calls a release when the owner asks, or when a set of handover items is done.
2. The complete run: every browser test on both phones, every rule test, and the UX designer's re-check of the rows
   in the release.
3. Red: rerun the failing tests on each change in the batch to find the one that broke it; fix it first.
4. Green: the owner tries the preview and says yes; then the release goes to the families' link.
5. Nightly and weekly runs (complete run nightly; mutation, simulation, emulator, Jev weekly) never block anyone.

**Two links:** a **preview** link for the owner, updated after every quick verify, and the **families'** link,
updated only by a release. (Build to set up; until then the single link updates on releases only.)

## Parallel work
- Up to **3 coders** at once, each in its own working copy (git worktree) on its own short branch, each owning one
  area of screens, so no two coders change the same file. One tester runs alongside them.
- The orchestrator merges each finished branch to `main` in turn; quick verify runs after each merge.
- If two changes need the same file, they go to the same coder.
- C3 changes are never split across coders.
- This changes project rules (`.claude/`, root `CLAUDE.md`, the role guard): the orchestrator proposes the exact
  edits and the owner approves them once.

## Questions
- C1 and C2: the coder or tester picks the option closest to `docs/ux-guidelines.md`, notes it in the report, and
  keeps going. The product owner reviews the notes afterwards.
- C3: ask the owner, all questions for the batch in one list, before building.

## Limits and progress
- A batch not green within 3 rounds or half a day: stop and tell the owner in plain English what is stuck.
- After every step, one line at the top of `reports/latest.md`: time, what finished, what runs next, rows done.
- After every batch, tell the owner what changed and what to try in the preview.
