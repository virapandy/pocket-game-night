# What the What Am I? tests expect (written before the build, 24 October 2026)

For the Build workspace. The contract is `specs/what-am-i/` (scenarios version 1.3, approved 24 October; each scenario's
Version 1.1–1.3 items win over its earlier text). The exact rule API and browser hooks the tests use are in
**`specs/what-am-i/api.md`**. If something there is wrong or impossible, write it in `docs/test-questions.md`; don't
work around it.

| File | Scenarios |
|---|---|
| `words.test.ts` | WAI-003 counts, R3, the list format (`content/what-am-i/words.json` row for row with `docs/games/what-am-i/words.csv`), WAI-092 ids |
| `queue.test.ts` | WAI-010 (Version 1.1 items 1–6: seed, input order, queue, fallback, hidden word, the worked example), WAI-043's hidden word, WAI-044's new queue |
| `turn.test.ts` | WAI-021 (Version 1.1 item 14 property), WAI-023, WAI-040, WAI-043, WAI-014, WAI-015 |
| `scores.test.ts` | WAI-030 to WAI-033 (K2 scoreboards), WAI-041 / WAI-042 rule parts |
| `results.test.ts` | WAI-060 to WAI-064, WAI-092 (replay, ids, no seed in a view) |
| `../../contract/what-am-i.test.ts` | the shared contract suite (joins once `whatAmIRules` exists) |

`oracle.ts` holds the scenarios' own word-order algorithm (WAI-010 with Version 1.1 items 2–4) written with the engine's
`createRng` and `shuffle`, and reads `words.csv` itself; the tests compare the build with it. `helpers.ts` loads
`src/games/what-am-i` with a dynamic import and plays game nights through the engine's `play` (`Night`).

**Ahead of the build.** While `src/games/what-am-i` cannot be loaded, each test that needs it (written with `wit`) must fail
with "src/games/what-am-i is not built yet" and is then reported as passing: so `npm test` stays green for every other game,
and a mistake in a test still shows. Once `src/games/what-am-i/index.ts` exists they are plain tests and run for real; there
is nothing to remove. `PGN_IGNORE_AHEAD=1 npm test` runs them unmarked at any time. The four checks of `words.csv` itself run
now. The browser tests (`tests/browser/what-am-i-*.spec.ts`, helper `tests/browser/what-am-i.ts`) do the same with
`window.__waiTest`: until the screens provide it, each is marked expected-to-fail and stops at once.

The rule tests were checked against a throwaway reference build kept outside the repo (all 83, with the contract suite,
passed; and each of four planted faults was caught), so a red rule test after the build is most likely a real difference:
read the scenario before suspecting the test. The browser tests have never met a real screen: expect to adjust selectors
(not checks) the first time.

Timing in the browser tests is exact: Playwright's clock is frozen and moved by the test, orientation events are fired at
exact app times, and moves are read back from the saved game night (`pgn.game.<id>`, `at` = `Date.now()` when recorded).
So the app must take every time from `Date.now()`, `performance.now()`, timers or animation frames, never from an event's
`timeStamp`.
