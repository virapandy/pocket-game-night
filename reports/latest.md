# Test report
Commit tested: 7cd0b7d app code (Phase 1a as built; tests are the new Phase 1a.1 tests from this commit)   Date: 2026-09-28
Result: RED (expected: loop step 2, failing tests written before the code)

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 207 | 58 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 47 | 45 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 42 | 45 | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds. No replay files were written (the simulation checks first that recording wins exists).

## What this round did
1. **Specs:** every verdict in `docs/scenario-review-outcome-2026-09-28.md` applied. Phase 1a.1 and Phase 1b are
   approved (owner sign-off). Rewordings applied word for word: TAM-093, TAM-124, PLT-027, PLT-028, TAM-186, TAM-050,
   TAM-179, PLT-208, PLT-118, PLT-119; TAM-133 moved to Phase 6. Phase 2, Phase 7, Phase 2.5 (PLT-110 to PLT-113)
   and extended-testing scenarios carry the product owner's verdict in their Status line but stay `draft`, awaiting
   the owner's sign-off. Phase 6 untouched.
2. **Tests for Phase 1a.1 only.** No Phase 1b tests yet.

## Failing, for the Build workspace (new behaviour not built yet; all failures are for this reason)
Interfaces are in `tests/games/tambola/README.md` and `tests/browser/README.md`.
- **TAM-037, TAM-039, TAM-033, TAM-086** (claims.test.ts, claims.spec.ts): paper wins are recorded with
  `{ type: 'record-win', pattern, playerIds }` and bogeys with `{ type: 'record-bogey', playerId, pattern }`; no
  numbers. Got: move refused (unknown). On screen: "Record a win" → prize → player(s) → Confirm or Bogey; the
  result reads "Top Line: ✓ Riya, ₹…" in large text. Got: no "Record a win" button.
- **TAM-139** (claims.test.ts, claims.spec.ts): `checkNumbers(called, pattern, numbers)` exported, pure; "Check
  numbers" in the menu, result in `check-result`; "Top Line needs 5 numbers" for too few. Got: not exported, no menu.
- **TAM-034** (claims.test.ts): the property now runs on `checkNumbers`. Got: not exported.
- **TAM-088, TAM-089, TAM-093, TAM-144, TAM-066, PLT-017 data** (handback.test.ts): won tiers pay exactly their
  amount; money of unwon tiers is handed back per ticket, extra rupees in setup order; `summary.payouts` per player
  with paid, won, handed back, net. Got: no `payouts`, and no win can be recorded yet (record-win), so no tier has winners.
- **TAM-082, TAM-092** (prizes.test.ts, setup-layout.spec.ts): same share, same amount; every tier but Full House a
  whole number of units. Got: 6 tickets at ₹50 gives the Lines different amounts; ₹20 pot gives ₹10 vs ₹0.
- **TAM-091** (prizes.test.ts) and **TAM-077** simulation (sim/tambola.test.ts): now record wins on the anchor's word
  and check that prizes plus money handed back equal the pot. Got: record-win not built.
- **TAM-123 to TAM-129, TAM-138** (layout.spec.ts, 390 × 844): top bar `top-bar` with Back, "N of 90 called" and
  Menu; digits at least 160 px (got 93 px); page never scrolls (got: scrolls); "Record a win" in its own row above a
  full-width "Next number"; only one filled button (got 4 others filled); End game and Discard only in the menu (got:
  on screen); long press opens Show the room; undo toast `undo-toast`; prize chips `prize-chip`; board as a sheet
  (got: always shown); one-time sleep tip then "Screen may sleep" icon; landscape layout (got: number crosses the middle).
- **TAM-181, TAM-182, TAM-183** (setup-layout.spec.ts): main button fixed at the bottom (got: "Next" 350 px up, or
  off screen with 12 or 20 players); contribution holds a real 50 (got: empty); prizes step fits without scrolling (got: scrolls).

Older tests that now fail only because they reach the screen the new way (they pass once the above is built):
TAM-070, TAM-072, TAM-075, TAM-076, TAM-078, TAM-090, TAM-143 and the detail-move list (rules: they record wins with
`record-win`); TAM-100, TAM-103/TAM-066, TAM-068, PLT-005/TAM-140, PLT-024 blank names (browser: "Record a win", menu);
TAM-104, TAM-106, TAM-109 (browser: they now also visit the menu and a recorded win).

## Already passing on the current app
- TAM-182 wrong input (empty, 0, −5, letters refused with a one-line reason, "Next" waits).
- TAM-128 second half (screen kept awake: no tip, no icon).
- TAM-092 "fixing Full House keeps the three Lines equal" (rules).
- TAM-119 (Undo last call) still passes: the test accepts the undo on the toast or the old button; TAM-125 checks the toast.

## Tests replaced or moved (behaviour changed by the owner-approved change request)
- Paper claims checked from typed numbers (old TAM-037, TAM-038 late with "complete at 45", TAM-035, TAM-036) are
  gone from the paper suite: those scenarios are now Phase 2 (phone tickets). What they checked is written down in
  `tests/games/tambola/README.md`, "Waiting for Phase 2", to return as phone-ticket tests when Phase 2 is signed off.
  TAM-034 now runs on the "Check numbers" helper, as its Phase line says.
- Old TAM-066/TAM-088 test (unwon money spread across won tiers) replaced by the hand-back tests (TAM-088).
- The contract suite's and simulation's random moves now record wins and bogeys instead of typed claims.
No test was skipped, focused or loosened.

## Flaky or setup problems (not for the Build workspace)
None this run.

## Requests for the Build workspace
None (no new tooling). New test ids: `top-bar`, `prize-chips`, `prize-chip`, `undo-toast`, `check-result`.

## Spec questions (for the orchestrator and the owner)
1. **TAM-181:** is there a "Next" on the ticket-mode step, or does tapping "Paper tickets" go on? Tested on the
   players, contribution and prizes steps only.
2. **TAM-043** still says "the app records which number completed each ticket's pattern". With paper tickets the
   anchor now judges lateness (TAM-037, TAM-038), so it was tested as "the host records a bogey". Reword TAM-043 to
   say the app's part is phone tickets only?
3. **TAM-129** "at least as readable as in portrait" is tested strictly: landscape digits at least as tall as portrait
   digits. If the owner means "at least 160 px", say so.
4. Readings used where the spec gives no number: "large text" (TAM-033, TAM-123 rhyme) = at least 24 CSS px;
   "about 40% of the screen" (TAM-123) = the number's area at least 30% of the screen height; "full width" = within
   48 px of the screen width; "at the bottom" = within 40 px of the bottom edge.
5. **TAM-183** "amount shown once" is not checked automatically (only "name once"); check it by eye in the preview.
6. **TAM-093** late-joiner line needs late joiners (TAM-067, Phase 1b): tested with the 1b tests.

## Scenarios without tests (not approved, or not this phase)
Phase 1b (approved; tests next round). Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029,
TAM-032, TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171,
TAM-178, TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); Phase 7 (PLT-200 to PLT-209); extended testing
(PLT-114 to PLT-123); Phase 6 on hold (TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
The checks for the feedback fixes are written and, as expected, fail on today's app: it still asks for the numbers
on a ticket, spreads unwon money onto the winners, and has the old scrolling calling screen. Once the builder makes
them pass, the app will record wins on the anchor's word, give unwon money back per ticket, keep equal prizes equal,
and show the new one-screen calling layout.
