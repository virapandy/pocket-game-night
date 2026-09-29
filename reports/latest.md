# Test report
Commit tested: c085e40 (app code = 5c26598, unchanged since the last green report; the tests are the ones in this commit)   Date: 2026-09-29
Result: RED, as expected. Tests for owner-approved changes (handover items 3 and 4), updated with the owner's answers of
2026-09-30 (docs/decisions.md, 765855e). They wait for the Build role. Nothing that passed before fails for any other reason.

Scenarios changed in `specs/` (all approved, owner, 2026-09-30, from the owner's answers to last report's questions):
- TAM-088 and TAM-089 (08-prizes.md): each person's row on the payout screen shows paid, won and net; below it two
  buttons. "Settle with host" shows what the host, as the bank, gives each person ("Host gives Riya ₹77"; they add up to
  the pot).
- New **TAM-199** (08-prizes.md, Phase 1a): "Settle with players" shows who pays whom for this game only, in the fewest
  hand-overs ("Dad pays Riya ₹50"); everyone ends at ₹0. The session tally keeps its own Settle up (PLT-028 unchanged).
- TAM-198 and TAM-145 (10-lifecycle.md), TAM-126 (09-usability.md): while the won prize waits to be closed, the screen
  dims, but "Add another winner", the Close on the prize's chip and the menu (End game, Discard game, Show the room)
  still work. The chip keeps its Close.
- PLT-017 (platform/01-lifecycle.md): tapping a person's compact row shows what they paid, won and got back.
- PLT-029 (platform/01-lifecycle.md): the first game, or one more than 3 hours after the last, shows
  "Session: <suggested name> (new) · Change"; Change lists up to 3 unsettled sessions from the last 7 days.
- TAM-109: unchanged; its test already passes and stays.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 318 | 3 (all new: TAM-089) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 161 | 36 (all new) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 156 | 36 (all new) | 6 (unchanged) |

## Failing (new tests waiting for the Build role; not regressions)
Each fails the same way on Android and iPhone, because the feature isn't built yet.
- `games/tambola/handback.test.ts` TAM-089 (3 tests): expected `hostGives` (= won + handed back, adding up to the pot)
  on each person in `summary.payouts`; got no such field.
- `browser/payouts-and-tally.spec.ts` TAM-088/TAM-089 (3 tests): expected one `payout-person` row per person with
  `data-net`, and the buttons `Settle with host` / `Settle with players`; got no `payout-person` and no such buttons.
  (The "No money" edge passes: nothing says "Host gives" today.)
- `payouts-and-tally.spec.ts` TAM-199 (4 tests): expected `Settle with players` to show `settle-with-players` with
  "Asha pays Riya ₹50", "Dad pays Riya ₹50" (fewest hand-overs, this game only); got no button.
- `payouts-and-tally.spec.ts` TAM-197 and TAM-181 (4 tests): expected `Play again` and `Session tally` fixed at the
  bottom of the payout screen, and `Settle up` fixed at the bottom of the session screen with 20 people; got them below
  the bottom of the screen, and no `Session tally` button.
- `payouts-and-tally.spec.ts` PLT-017 (3 tests): expected each tally row at most 60 px tall (got a taller card), and a
  tap on a row to show `tally-person-detail` with paid, won and got back (got nothing).
- `browser/close-prize.spec.ts` TAM-198 (10 tests), `claims.spec.ts` TAM-145 (1), `layout.spec.ts` TAM-126 (1):
  expected the bottom button (`main-button`) to read "Close Top Line" after a win, with the dimming and the one-time
  pulse, and the chip's Close and "Add another winner" still working under the dim; got no `main-button`.
- `browser/session-line.spec.ts` PLT-029 (10 tests): expected a `session-line` on the last setup step ("Session: Diwali at
  Nani's · Change", or "Session: Monday 5 Oct (new)" for a first game or one after 3 hours, with up to 3 recent unsettled
  sessions under Change); got none.
- Already passing (the app does this today): the menu works while a won prize waits (opens; End game pays the won prize;
  Discard asks first; Show the room shows the room), TAM-109 session labels, and the "No money" edges.

What to build, with every name and test id: `tests/browser/README.md` (the test-id table: `payout-person`,
`settle-with-host`, `host-gives`, `settle-with-players`, `hand-over`; "After a recorded win"; and the section
"Money and 1b review fixes … and play-test fixes") and `tests/games/tambola/README.md` (`hostGives`).

## What changed in the existing tests (owner's answers of 2026-09-30 only)
- Undone: last round's "close the prize first" steps in `claims.spec.ts` (No money), `lifecycle.spec.ts` (PLT-005
  discard) and `usability.spec.ts` (every screen). The owner decided the menu still works while the prize waits, so
  these tests again open the menu straight after a win, as they did before. All three pass on this build.
- `layout.spec.ts` TAM-126: the chip's Close is required again (the owner kept it), besides the main button.
- `close-prize.spec.ts` TAM-198: the menu and the chip's Close are no longer required to look dimmed; they must now be
  tappable (nothing lies over them). The stray tap now lands on "Record a win" and the top bar instead of the menu.
  New tests: the chip's Close closes the prize; "Add another winner" works; the menu's End game, Discard game and
  Show the room work while the prize waits.
- `payouts-and-tally.spec.ts` TAM-089: the person row now needs paid, won and net (`data-net`); "Host gives Riya ₹…"
  moved under `Settle with host`. The old "no player-to-player line on the payout screen" test is replaced by TAM-199:
  no `hand-over` until `Settle with players` is tapped. `claims.spec.ts` TAM-088: the row words are paid, won and net
  (was paid, handed back and net).
- `helpers.ts`: `payoutPeople` reads `data-net` (no longer `data-handed-back`/`data-host-gives`); new `hostGivesList`
  and `handOvers`. `confirmPrizes` names a session through the session line's Change when the line says "(new)", and
  still answers the PLT-016 question if one appears.

## Flaky or setup problems (not for the Build workspace)
- The Test clone still holds **uncommitted Phase 2 (phone tickets) work** from an earlier session (spec changes in
  01-tickets, 03-claims, 05-secrets-and-seeds, 09-usability, 12-connected, README; `tests/browser/fixtures.ts`; new files
  `tests/browser/phone.ts`, `tests/contract/tambola-phone.test.ts`, `tests/games/tambola/phone*.ts`,
  `tests/games/tambola/tickets.test.ts`). It is handover item 5. It was left untouched and is **not** in this commit.
  Locally its 92 rule tests run too (3 pass, 89 fail, because Phase 2 is not built); they are not counted above.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- New test ids: `main-button`, `payout-person` (with `data-name`, `data-paid`, `data-won`, `data-net`),
  `settle-with-host` and `host-gives` (`data-name`, `data-amount`), `settle-with-players` (holding `hand-over`s),
  `tally-person-detail`, `session-line`. Field `hostGives` in `summary.payouts`.

## Questions for the owner (no test depends on a guess)
1. PLT-029 vs PLT-016 and PLT-026: when the line already says "Session: Monday 5 Oct (new)", should the old question
   ("Continue 'Diwali at Nani's' or start a new session?", or the session-name box on the first game) still appear
   after Confirm prizes, or does the line replace it? The PLT-016 and PLT-026 tests still expect the question after
   3 hours; the new tests accept either. If the line replaces it, PLT-016 and PLT-026 need rewording.
2. TAM-198: should the menu button and the chip's Close look dimmed (but still work), or look normal? The tests only
   check that they work.
3. PLT-017: in the row detail, is "got back" the prizes plus money handed back (as PLT-017 says today), or only the
   money handed back? The tests check it only where both are the same.

## Notes for the owner (plain English)
- Your answers are in the scenarios and the tests. They fail now because the app doesn't do these things yet; the
  coder builds next.
- Payouts: each person gets one row (paid, won, net). "Settle with host" shows what you hand each person; "Settle with
  players" shows who pays whom for just this game, in as few hand-overs as possible.
- After a win the screen dims, but the menu, the prize's Close and "Add another winner" keep working (today's app
  already lets the menu work, and those tests pass).
- Session line: the first game of the evening shows "(new)", and Change offers up to 3 recent unsettled sessions.
- Three small questions above.
