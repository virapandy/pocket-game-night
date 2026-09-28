# Test report
Commit tested: fb66361   Date: 2026-09-28
Result: RED (expected: the Phase 1a tests are written, and the Tambola code they test does not exist yet)

| Layer | Command | Passing now | Waiting for Phase 1a code |
|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 112 (engine, rhyme pack) | 131 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 5 (home, installable, opens offline, fast first load, no iPhone tip) | 52 (1 skipped: iPhone only) |
| Browser, iPhone (WebKit) | same | not run here (runs in automation) | |

## Failing (real bugs only)
None. Every failure is a Phase 1a feature not built yet.

## Flaky or setup problems (not for the Build workspace)
- WebKit is not installed on the Test Mac, so the iPhone browser tests run only in automation for now.
- Before pushing, every rule test was checked against a throwaway Tambola written only for this purpose
  (never committed): all 243 pass against it, including 2,000 simulated games in under 10 seconds.
  So a failure means the app differs from the tests, not that the tests contradict each other.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- **Build Phase 1a against the tests.** What the tests import, and the shapes they expect:
  `tests/games/tambola/README.md`. What the browser tests look for on screen (button names, field
  labels, `data-testid`s): `tests/browser/README.md`. Both are written for you; ask in
  `docs/test-questions.md` if anything doesn't fit.
- Suggested order (each step turns a block of tests green): rules module (`tambolaRules`, `pickRhyme`,
  `suggestTiers`, `planPrizes`, `tambolaDefaults`, and `rules` on the `tambola` registration) → setup
  screens → calling screen → claim check → end, discard, play again → saving, resume, history → usability.
- Test configs are in: `tests/vitest.config.ts` and `tests/playwright.config.ts`. Automation now runs both.
  The browser config serves the built app with `npm run preview` on port 4173, as the handover said.
- The rhyme pack in `content/tambola/rhymes.json` passes every pack test (TAM-150, 156, 157, 158).
- The engine passes its tests: seeded randomness, referee, undo, replay, saved-game formats, money records.
- **New owner decision, TAM-145: winning and ending are manual.** After an accepted claim, the tier stays
  open: the host can "Add another winner" (a tie on the same number) or "Close Top Line". Next number waits
  until the tier is closed. This is true for every tier, Full House included. Accepting or closing a Full
  House never ends the game; after the last Full House is closed the host taps "End game and show payouts".
  New move `close-tier`, view fields `awaitingClose` and `readyToEnd`: `tests/games/tambola/README.md`.
  Please update the "End of game" row in `src/games/tambola/CLAUDE.md` (TAM-075 has changed).
- **New owner decision, TAM-144:** a game with money that ends with **no prize won** hands everyone's
  contribution back (each person: won = paid), as with Discard.
- Automation stops at the first failing layer, so the browser tests will run there once the rule tests pass.
- A paper-ticket claim is judged only from the numbers read out; a player who made a bogey is recorded
  but not blocked by the app (the room keeps that ticket out; they may hold another ticket).

## Notes for the owner (plain English)
- **All Phase 1a scenarios are now approved**, including the 16 that were "decided" rather than
  "approved" (house rules, prize rules, resume, names). Their decisions are kept in the wording.
- **Tests are written for all of Phase 1a**: 243 rule and simulation checks, and 58 browser checks
  that each run on an Android-sized and an iPhone-sized phone. Each names the scenario it proves.
- The Build side builds next; the tests tell it exactly what "done" means.
- **The live link will not update until Phase 1a passes.** Automation publishes only when every test is
  green, so https://virapandy.github.io/pocket-game-night/ keeps showing the Phase 0 screen until then.
  If you would like to play half-finished versions along the way, that is a change to the automation
  (Build side); say so and I'll pass it on.
- **Your decision is in (TAM-145):** every prize is closed by hand. After a win the host can add another
  winner or close the prize; the next number waits until it's closed; after the last Full House is
  closed, the host ends the game. TAM-030, TAM-042, TAM-046 and TAM-075 now say the same.
- **TAM-144 approved:** if a game with money ends and nobody won anything, everyone gets their contribution back.
- **Ready for handover:** `docs/handover.md` now ends with "Phase 1a tests ready", including what to paste
  into Claude Code in VS Code to start the build.
- A few things can't be proved by automated tests and need a real phone: the app update never
  interrupting a game (TAM-113; the test only checks no update message shows mid-game), how the app
  feels in the hand, and reading the number from across a room. I'll do these as walkthroughs on the
  iPhone Simulator once the screens exist.
