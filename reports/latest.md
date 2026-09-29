# Test report
Commit tested: c085e40 (app code = 5c26598, unchanged since the last green report)   Date: 2026-09-29
Result: RED, as expected. New tests for owner-approved changes (handover items 3 and 4); they wait for the Build role.
Nothing that passed before fails for any other reason.

Scenarios changed in `specs/` (all approved, owner, dates in each file):
- Money and 1b review (docs/games/tambola/changes-2026-09-29-money-and-1b.md, 2026-09-29): TAM-089 reworded (the payout
  screen says "Host gives Riya ₹77"); new TAM-197 (payouts → session tally); TAM-181 extended to the payout and session
  screens; PLT-017 gains "one compact row per person"; TAM-109 gains "each session in the list has a readable label".
  PLT-028 is unchanged: Settle up stays player to player (correction d48249b).
- Play-test (docs/games/tambola/changes-2026-09-30-playtest.md, 2026-09-30): new TAM-198 (after a win the main button
  becomes "Close Top Line", the rest dims, a stray tap pulses it once); TAM-145 reworded; TAM-126 aligned with TAM-198
  (its "Close Top Line first" line was superseded); new PLT-029 (session line with "Change" on the last setup step).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 318 | 3 (all new: TAM-089) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 157 | 23 (all new) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 152 | 23 (all new) | 6 (unchanged) |

## Failing (new tests waiting for the Build role; not regressions)
Each fails the same way on Android and iPhone, for the reason given: the feature isn't built yet.
- `games/tambola/handback.test.ts` TAM-089 (3 tests): expected `hostGives` (= won + handed back, adding up to the pot)
  on each person in `summary.payouts`; got no such field.
- `browser/payouts-and-tally.spec.ts` TAM-089 (3 tests): expected one `payout-person` per person with "Host gives Riya ₹…";
  got none. (The "No money" edge already passes: nothing says "Host gives" today.)
- `payouts-and-tally.spec.ts` TAM-197 and TAM-181 (4 tests): expected `Play again` fixed at the bottom of the payout
  screen; got it below the bottom of the screen (review finding 1). Expected a `Session tally` button; there is none.
  Expected `Settle up` fixed at the bottom of the session screen with 20 people; got it below the bottom (finding 2).
- `payouts-and-tally.spec.ts` PLT-017 (1 test): expected each tally row at most 60 px tall; got a taller card (finding 4).
- `browser/close-prize.spec.ts` TAM-198 (8 tests), `claims.spec.ts` TAM-145 (1), `layout.spec.ts` TAM-126 (1): expected
  the bottom button (`main-button`) to read "Close Top Line" after a win, with the dimming and pulse; got no
  `main-button` and "Next number" greyed with "Close Top Line first".
- `browser/session-line.spec.ts` PLT-029 (5 tests): expected a `session-line` "Session: Diwali at Nani's · Change" on the
  last setup step; got none.
- Passing already: the TAM-109 test for session labels. On this build each session in the list is a button whose name
  already holds the session name, the number of games and whether it is settled. See question 6.

What to build, with every name and test id: `tests/browser/README.md` (sections "After a recorded win", the test-id
table, and "Money and 1b review fixes … and play-test fixes") and `tests/games/tambola/README.md` (`hostGives`).

## What changed in the existing tests (superseded behaviour only)
- `claims.spec.ts` TAM-145: now also checks that the main button reads "Close Top Line" (was: Next number waits).
- `layout.spec.ts` TAM-126: "Close Top Line first" on a greyed Next number is replaced by the main button reading
  "Close Top Line", which closes the tier. A Close button on the chip is no longer required, since the owner's change
  says it "may stay as a second way". All other chip checks unchanged.
- `claims.spec.ts` (No money), `lifecycle.spec.ts` (PLT-005 discard) and `usability.spec.ts` (TAM-104 and others,
  every screen): these recorded a win and then opened the menu without closing the prize. Under TAM-198 the rest of the
  screen is dimmed and does nothing until the prize is closed, so they now close it first. Every assertion is unchanged.
- `handback.test.ts` TAM-089: the old test is kept as it was; three new tests add `hostGives`.

## Flaky or setup problems (not for the Build workspace)
- The Test clone holds **uncommitted Phase 2 (phone tickets) work** left by an earlier session (spec status changes in
  01-tickets, 03-claims, 05-secrets-and-seeds, 09-usability, 12-connected, README; `tests/browser/fixtures.ts`; new
  files `tests/browser/phone.ts`, `tests/contract/tambola-phone.test.ts`, `tests/games/tambola/phone*.ts`,
  `tests/games/tambola/tickets.test.ts`). It is handover item 5, not this task. It was left untouched and is **not**
  in this commit. Locally its 92 rule tests run too (3 pass, 89 fail, because Phase 2 is not built); they are not
  counted above. Automation does not see them.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- New test ids: `main-button`, `payout-person` (with `data-*`), `session-line`. Field `hostGives` in `summary.payouts`.

## Questions for the owner (spec gaps found while writing the tests; no test depends on a guess)
1. TAM-088 still says the payout summary shows each person's "net amount"; the new TAM-089 lists paid, won, handed back
   and "Host gives". The tests still require the net (TAM-088 is unchanged). Keep both, or drop the net from the payout
   screen (TAM-088 would need rewording)?
2. TAM-198 dims the rest of the screen, but the change also says the Close on the prize chip "may stay as a second way".
   A chip under the dim can't be tapped. Should the chip stay undimmed, or is the chip's Close simply dropped?
3. TAM-198: while the prize waits to be closed, the menu is dimmed too, so End game, Discard and Show the room wait
   until the prize is closed. Is that what you want?
4. PLT-017 compact rows show name and balance. Where do "paid" and "got back" (still in PLT-017) show: a tap on the row,
   or not at all? The tests don't check either way.
5. PLT-029: what does the line show on the very first game of all (no session yet), and on a game more than 3 hours
   after the last one (PLT-016 asks "Continue … or start a new session?")? The tests cover only games within the 3 hours.
   Which sessions count as "recent"? The tests only require that an unsettled session from the same evening is offered
   and a settled one is not.
6. TAM-109 (review finding 5, "each session is a button with no readable label"): on this build the test already passes
   on both phones. Each session button's name reads its name, games and state. Could the product owner say which button
   they meant, or on which screen? The test stays as it is.

## Notes for the owner (plain English)
- The tests for your two change requests are written and pushed. They fail now because the app doesn't do these
  things yet; the coder builds next.
- Money: after each game the payout screen will say exactly what you, as host, hand each person ("Host gives Riya ₹77"),
  and it will add up to the pot. Settle up still lists who pays whom between players.
- Closing a prize: after a win, the big bottom button will turn into "Close Top Line", the rest of the screen will dim,
  and tapping elsewhere just nudges that button once.
- Sessions: the last setup step will show which session the game joins, with "Change".
- There are six small questions above where the change requests don't say what should happen.
