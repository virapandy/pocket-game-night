# Test report
Commit tested: 6aced77 (app code; test and docs commits on top: see git log)   Date: 2026-09-29
Result: RED, on the TAM-150 / TAM-153 rhyme change only. TAM-082 tiny pots is now fixed: all TAM-082 checks pass
(the prize tests passed on 6 runs in a row). The owner-approved rhyme change (docs/decisions.md, 2026-09-29;
docs/games/tambola/changes-2026-09-29-rhymes.md) is applied to the scenarios and tests. The app has not yet
rebuilt the rhyme pack or added the Hindi fallback, so the new checks fail, as expected.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (Phase 1a and 1b) | `npm test` | 315 | 3 (TAM-150, TAM-153) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 156 | 1 (TAM-153) | 1 (iPhone only) |
| Browser, iPhone (WebKit) | same | 151 | 1 (TAM-153) | 6 (unchanged: offline and Chromium-only checks) |

`npm ci` run; build succeeded.

## Failing (real bugs only)
- TAM-150, `tests/games/tambola/rhymes.test.ts` "Hindi rhymes exist for most numbers … the pack has them for the
  same numbers as the catalog (55 of 90 today)": expected Hindi rhymes for the 55 numbers the catalog
  (`docs/games/tambola/rhymes.csv`) has them for; the pack `content/tambola/rhymes.json` still has them for all 90.
  Cause: the pack has not been rebuilt from the catalog (361 rhymes) yet.
- TAM-153, same file, "Hindi: the numbers the catalog gives no Hindi rhyme fall back to English in a game": expected a
  family-friendly English rhyme with an Indian reference for each of those numbers; got the cut Hindi lines for all
  35 of them. Cause: the pack has not been rebuilt.
- TAM-153, same file, `pickRhyme` "with Hindi, a number without Hindi rhymes gets a family-friendly English rhyme with
  an Indian reference": on a pack where numbers 7 and 67 have no Hindi lines, `pickRhyme(..., { language: 'hi' })`
  returns `null` (the number alone); expected one of their family-friendly Indian-reference English rhymes. Cause:
  the app has no Hindi fallback yet. This one does not depend on the pack, so rebuilding the pack alone will not
  turn it green.
- TAM-153, `tests/browser/rhymes.spec.ts` (Android and iPhone), a Hindi game called to 90: every number that has a
  Hindi rhyme in the catalog showed one of them; each of the 35 numbers with no Hindi rhyme in the catalog showed a
  cut Hindi line instead (e.g. 27 "Sattaais, sab khush", 88 "Kya thaat baat"). Expected a family-friendly English
  rhyme with an Indian reference from the catalog. Cause: the pack has not been rebuilt (and, once it is, the
  fallback above is needed so these numbers do not show the number alone).

## What changed in the tests (rhymes, owner-approved 2026-09-29)
- `specs/tambola/11-rhymes.md`: TAM-150 and TAM-153 reworded exactly as approved (Status: approved, owner, 2026-09-29).
- `tests/games/tambola/rhymes.test.ts`: TAM-150 no longer requires a Hindi rhyme for every number; it requires 3
  English (2 family-friendly) and 1 family-friendly English rhyme with an Indian reference per number, and that the
  pack's Hindi numbers match the catalog's. TAM-153 "only Hindi" now covers numbers that have a Hindi rhyme; new
  fallback checks (filter on and off; on the pack, against the catalog, and via `pickRhyme`); with Hindi, a number
  with no rhyme at all still gives `null` (TAM-015). The general `pickRhyme` check expects the fallback for Hindi.
- `tests/rhyme-catalog.ts` (new): reads the reviewed catalog CSV for the rule and browser tests.
- `tests/browser/rhymes.spec.ts` (new): the Hindi-game check above, on both phones.
- `tests/browser/voice.spec.ts`: the two Hindi-voice checks (TAM-180) now wait for a call whose rhyme is a Hindi one
  in the pack, instead of any rhyme, because an English fallback rhyme is not a Hindi rhyme. Same assertions.
- `tests/browser/README.md`: notes the fallback under the `Rhyme language` select.
- `docs/test-questions.md`: the Build role's rhyme question is answered.

## Flaky or setup problems (not for the Build workspace)
- None this run.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- Relax the `build:rhymes` rule to the new TAM-150, rebuild `content/tambola/rhymes.json` from
  `docs/games/tambola/rhymes.csv` (361 rhymes), and add the Hindi fallback to `pickRhyme` (TAM-153).

## Notes for the owner (plain English)
- The tiny-pot prize fix works: small pots now round the smaller prizes to the rupee as you decided.
- Your rhyme change is now in the scenarios and the tests. The app still shows the 36 Hindi lines you cut, and it
  does not yet know to use an English rhyme with an Indian touch when a number has no Hindi rhyme. The Build side
  needs to rebuild the rhyme list and add that fallback; the tests will then check it on both phones.
- Scenarios still in draft: none touched by this task.
