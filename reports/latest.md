# Test report
Commit tested: 7fe071d (Phase 1b screens)   Date: 2026-09-29
Result: RED. Two small real bugs (both about the big number); the rest of the failures are two faults in my own
tests, which I have not changed (they need the owner's OK, see "Test faults" below).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 304 | 0 | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 142 | 8 | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 136 | 9 | 6 (unchanged: 3 Android or Chromium only; 3 offline reload, owner decision) |

Build (`npm run build`): succeeds.

Phase 1b rules layer is fully green: tally and settle up (money adds up to the rupee in every property run),
late joiners, and every Phase 1a rule, contract, simulation and replay test.

## Old saved games (PLT-014): confirmed they still open
Saved games are now format 2. To check this with real data, I built the Phase 1a app (12e38a3), played it in a
browser, and kept exactly what it saved on the phone: one finished game (a win, money, hand-backs) and one
game left in progress after 5 calls. That data is now a permanent fixture, `tests/fixtures/phase-1a-saved-games.json`.
- `tests/replays/format-1-saved-games.test.ts` (2 tests, new): both format-1 games read and replay move for
  move in 7fe071d, every rule holds, the money balances. Pass.
- `tests/browser/format-1.spec.ts` (2 tests per phone, new): on a phone holding the 1a data, History shows the
  finished game with all 8 calls and the same payouts ("Early Five: Asha ₹20", "Pot ₹150"); the game in progress
  resumes on the same number, calls on without repeating, survives a reload, and ends with payouts. Pass on both phones.
- `tests/replays/` has no saved failing-game replays yet (none has ever been needed), so there is nothing else to replay.

## Failing (real bugs only)
- **iPhone: with the phone's voice or auto-call on, the big number covers the Menu button** (TAM-180, TAM-120,
  TAM-186). `tests/browser/voice.spec.ts` "Play again: the voice is off again in the new game" (iPhone): expected
  a tap on Menu to open the menu; got the tap landing on the current number (`current-number` "intercepts pointer
  events") for 10 seconds, so End game could not be reached. With either shortcut on, the stage is laid out so the
  number's digits reach up to about 26 px from the top, inside the top bar (which ends at 48 px). A probe of 8
  two-digit numbers per game: Menu was covered for 7 of 8 with the voice on; never with both shortcuts off; never
  on Android. It depends on the number drawn (single digits don't reach), so it also hit 1 to 3 of the iPhone
  auto-call tests per run ("the timer can be changed during the game", "pausing and changing the timer never skip
  or repeat a number", "Check numbers pauses it too"). Expected: the number never overlaps the top bar, so Menu
  always works.
- **Closing Settings replays the "new number" pop** (TAM-134). `tests/browser/dark-mode.spec.ts` "the host can
  switch to dark mode during a game, and text stays exactly as large" (both phones): expected the number's box to
  be the same size before and after switching to dark mode (358 × 414); got 387 × 447, exactly 8% larger. The font
  size is unchanged; the cause is that coming back from Settings replays the half-second grow-and-shrink the number
  does when it is first called, so the number looks as if it had just been called again. During that half second
  the enlarged number also reaches into the top bar and blocks Menu (both phones). Expected: returning from
  Settings leaves the number as it was.

## Test faults (my tests are wrong; not changed, owner's OK needed to fix)
These fail against correct app behaviour. Rule 5 says I may not change a test to make it pass, so they stay as they
are until the owner agrees. Each proposed fix is exactly as strict as the original.
1. **Auto-call timer lookup** (TAM-186, TAM-120), `tests/browser/auto-call.spec.ts`, 3 tests × 2 phones. The app's
   `select` is correctly named "Time between calls" (checked in the page's accessibility tree), but Playwright's
   `getByLabel(…, { exact: true })` compares the whole label's text, which also contains the six option texts, so
   it finds nothing. Proposed fix, line 14: `page.getByRole('combobox', { name: 'Time between calls', exact: true })`.
   Tried on a throwaway copy: all 12 auto-call tests then pass on Android; on iPhone the only failures left are the
   Menu bug above.
2. **Session row game count** (PLT-016, PLT-026), `tests/browser/sessions.spec.ts`, 4 tests × 2 phones (lines 82,
   125, 285, 309, 310). The row reads "Diwali at Nani's", "2 games", "Not settled" in separate pieces with no
   spaces between them in the text, so `/\b2 games\b/` cannot match "Nani's2 gamesNot settled". Proposed fix:
   `/(?<!\d)2 games(?![a-z])/` (and the same for "3 games" and "1 game"). Tried on a throwaway copy: all 9 session
   tests then pass on both phones.

## Flaky or setup problems (not for the Build workspace)
- The iPhone Menu failures above come and go between runs because they depend on which number is drawn; they are
  the real bug above, not flakiness. No other flaky test in two full runs.

## Requests for the Build workspace
- Fix the two bugs above (keep the big number out of the top bar on iPhone with the voice or auto-call on; do not
  replay the call animation when returning from Settings).
- Optional, for screen readers: the session row reads as "Nani's2 gamesNot settled" run together; a space or
  separator between its parts would read better.

## Spec questions (for the orchestrator and the owner)
- Still open from last report: PLT-026 vs PLT-016 (a game paused overnight and ended in the morning: does the next
  game ask "Continue … or start a new session?"), TAM-067 paper-ticket late claims, TAM-067 rounding.
- PLT-014 does not say which session old (format-1) games belong to. Tested only what PLT-014 promises: they open,
  with nothing lost.

## Scenarios without tests (not approved, or not this phase)
Phase 1b: none left. Draft, awaiting owner sign-off: Phase 2 (TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-032,
TAM-050, TAM-051, TAM-053 to TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171, TAM-178,
TAM-179, TAM-190); Phase 2.5 (PLT-100 to PLT-113); extended testing (PLT-114 to PLT-123); Phase 6 on hold
(TAM-133, TAM-200 to TAM-210).

## Notes for the owner (plain English)
Nearly all of the next stage works: sessions, the money tally and Settle up, adding a late player, deleting and
reusing past games, the phone's voice, auto-call and dark mode. Games saved by the current live version still
open after the update, checked with real saved games. Two small things to fix: on an iPhone, with the phone's
voice or auto-call turned on, the big number can sit over the Menu button so tapping Menu does nothing; and closing
Settings makes the number "pop" as if it had just been called. Separately, two of my own checks are written wrongly
(they look for the auto-call timer and the "2 games" count in a way that doesn't match how the screen is built).
The app is right in both cases. May I correct those two checks? The corrections keep them just as strict.
