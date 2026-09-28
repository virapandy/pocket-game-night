# Test report
Commit tested: fb66361   Date: 2026-09-28
Result: RED (expected: the Phase 1a tests are written, and the Tambola code they test does not exist yet)

| Layer | Command | Passing now | Waiting for Phase 1a code |
|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 112 (engine, rhyme pack) | 124 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 5 (home, installable, opens offline, fast first load, no iPhone tip) | 51 (1 skipped: iPhone only) |
| Browser, iPhone (WebKit) | same | not run here (runs in automation) | |

## Failing (real bugs only)
None. Every failure is a Phase 1a feature not built yet.

## Flaky or setup problems (not for the Build workspace)
- WebKit is not installed on the Test Mac, so the iPhone browser tests run only in automation for now.
- Before pushing, every rule test was checked against a throwaway Tambola written only for this purpose
  (never committed): all 236 pass against it, including 2,000 simulated games in under 10 seconds.
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
- Two assumptions the tests make, now draft scenarios for the owner (see below): a game with money
  that ends with **no prize won** gives everyone their contribution back (TAM-144); the **first
  Full House** entered ends the game even if another player completed it on the same number (TAM-145).
- A paper-ticket claim is judged only from the numbers read out; a player who made a bogey is recorded
  but not blocked by the app (the room keeps that ticket out; they may hold another ticket).

## Notes for the owner (plain English)
- **All Phase 1a scenarios are now approved**, including the 16 that were "decided" rather than
  "approved" (house rules, prize rules, resume, names). Their decisions are kept in the wording.
- **Tests are written for all of Phase 1a**: 236 rule and simulation checks, and 57 browser checks
  that each run on an Android-sized and an iPhone-sized phone. Each names the scenario it proves.
- The Build side builds next; the tests tell it exactly what "done" means.
- **The live link will not update until Phase 1a passes.** Automation publishes only when every test is
  green, so https://virapandy.github.io/pocket-game-night/ keeps showing the Phase 0 screen until then.
  If you would like to play half-finished versions along the way, that is a change to the automation
  (Build side); say so and I'll pass it on.
- **Two questions for you** (added as drafts at the end of `specs/tambola/10-lifecycle.md`):
  1. **TAM-144.** If a game with money ends and nobody won anything, should everyone get their
     contribution back? (The tests assume yes; it is the only way the money still adds up.)
  2. **TAM-145.** If two players complete Full House on the same number, the tie rule says they share,
     but the game ends the moment the first Full House is accepted. Keep it simple (first one entered
     wins, the tests' current assumption), or have the phone ask "Any more Full Houses on this number?"
     before ending?
- A few things can't be proved by automated tests and need a real phone: the app update never
  interrupting a game (TAM-113; the test only checks no update message shows mid-game), how the app
  feels in the hand, and reading the number from across a room. I'll do these as walkthroughs on the
  iPhone Simulator once the screens exist.
