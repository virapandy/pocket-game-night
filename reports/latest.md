# Test report
Progress (2026-10-03 09:35 local, tester): SPEED FIRST step 3 (tester part) done: C3 rows 6, 20, 21 and 23 have approved scenarios and failing tests, pushed; the product owner's answers 1-6 applied (no "either answer" left); scoped mutation set up and proved once (one file, 410 s). Next: lanes A, B, C (step 2), then one coder builds the C3 batch (rows 6, 15, 20, 21, 23) against these tests. Rows done: 0 of 25 built; tests ready for rows 6, 15, 20, 21, 23.

Commit tested: d0cdd8c (app; no app change since; tests at the commit carrying this report)   Date: 2026-10-03
Result: RED (expected: tests written first for the C3 rows; the app has not been built for them yet)

Task: `docs/handover.md` SPEED FIRST step 3, C3 rows tests first (`docs/change-sop.md`), and handover items 3 and 3b.
Scenarios (all `approved, owner, 2026-10-03`, the owner-approved UX list rows):
- Row 6: TAM-145 and TAM-198 (phone-ticket games: "Add another winner" while a win waits to close).
- Row 20: TAM-215, new ("Done with this game…").
- Row 21: PLT-300 (tickets more than 6 hours old open on Home) and TAM-171 (tickets keep their time; stay until cleared).
- Row 23: TAM-179 (a claim from an ended, discarded or unknown game) and TAM-171 ("Your tickets from game 7K3P were cleared.").
- Answers 1-6 written into TAM-057 (first visit only), TAM-195 (both prizes named; 3 tickets fit at 812 × 375), TAM-089
  ("Settle with host" the main look until a tab is opened).
Names and test ids for the Build workspace: `tests/browser/README.md`, the last two sections.

Run locally on the owner's Mac (`caffeinate -i taskpolicy -b`, 3 workers), only the new and changed tests; no full suite.
Rule tests (`npm test`) not run: no rule test or rules code changed.

| Layer | Tests run | Passing | Failing |
|---|---|---|---|
| Browser, Android: `after-the-game.spec.ts` (new) | 14 | 2 | 12 (all new, waiting for the build) |
| Browser, Android: changed tests in `phone-claims`, `pattern-cue`, `home-and-buttons`, `phone-tickets` | 21 | 13 | 8 (2 new for row 6; 6 that now expect the answered behaviour) |
| Browser, iPhone: the new C3 tests (after-the-game and row 6) | 16 | 2 | 14 (same failures as Android) |

The 2 passing new tests are the "as before" cases (a claim from a game the host phone never ran, or one removed from
History, still says "This claim is for another game (code …)"). The changed tests that pass: first visit only (TAM-057),
"Tap to resume", and the cue tests that don't fill two prizes.

## Failing (real bugs only): new tests waiting for the build, each failing for the right reason
Files: `after-the-game.spec.ts` (G), `phone-claims.spec.ts` (C), `pattern-cue.spec.ts` (P), `phone-tickets.spec.ts` (T),
`home-and-buttons.spec.ts` (H).
- TAM-145/TAM-198, row 6 (C, 2 tests): after a phone claim is accepted there is no "Add another winner" at all (only
  "Close Early Five"); expected it above the main button, working, so a paper player's tie can be added.
- TAM-215, row 20 (G, 3 tests): the player's menu has Larger text, Add a ticket by code, Report a problem, Home; no
  "Done with this game…".
- PLT-300/TAM-171, row 21 (G, 5 tests): tickets 6 h 10 min old (and yesterday's, and last Saturday's) open straight
  away; expected Home with "Your tickets from 9:15 am" / "yesterday, 9:15 pm" / "Sat 26 Sep", Open and Clear. A
  typed-code ticket 6 h 10 min after it was added also opens straight away. (Under 6 hours opening as before passes.)
- TAM-179, row 23 (G, 2 tests): a claim from a game this phone ended, or discarded, says "This claim is for another
  game (code P7CR)."; expected "That game has ended (game P7CR, 9:20 am). This claim doesn't count." and "That game
  was discarded (game PTWU). This claim doesn't count."
- TAM-171, row 23 (G, 2 tests): a new game's ticket (scanned or typed) replaces the old ones but shows no "Your tickets
  from game CF6T were cleared."
- TAM-195, answer 2 (T 1 test, P 4 tests): the cue says "Ticket 1: top row filled. Shout if it's right!" and, under
  More, "Early Five filled on ticket 1"; expected "Ticket 1: Early Five and Top Line filled. Shout if it's right!"
  (with two tickets, More says "Ticket 1: top row filled"; expected the prize, "Top Line filled"). UX list row 1.
  The answer-6 check (3 tickets fit at 812 × 375 with Larger text) sits in the 3-ticket test after the wording check,
  so it runs once the wording is fixed.
- TAM-089/TAM-197, answer 5 (H): no control on the payout screen has the main look; expected "Settle with host". UX list row 5.

## Test changes (the product owner's answers 1-6; each makes a test stricter, none looser)
- `home-and-buttons.spec.ts`: the unfinished game's row must say exactly "Tap to resume" (was "Tap to resume" or
  "Resume"); new test "You're ready for game night" on the first visit only; the payout test now also requires
  "Settle with host" to be the one main button before a tab is opened.
- `phone-tickets.spec.ts` and `pattern-cue.spec.ts` (TAM-195): the line must name both prizes in prize order (was "top
  row filled" on the line or under More); with two tickets each names its prizes, Early Five at most once; the
  3-ticket landscape test with Larger text now also requires all three tickets on screen with no scrolling.
- `phone.ts`: `newPhone` takes an optional time zone (used only by the new tests). `areas.json`: the new spec added to
  the areas it reaches.

## Scoped mutation (set up this round; owner decision 3 October)
- `tests/mutation/scoped.mjs` takes a git range, picks the changed lines in `src/games/*/rules/**` and
  `src/engine/{money,tally,session}.ts`, and runs Stryker on just those (`--whole-files` for a release). Nothing to mutate:
  "Green", exit 0. Documented in `tests/mutation/README.md`.
- Proved once, low priority, concurrency 2: 3 changed lines of `rules.ts` (`ae4b7f1~1..ae4b7f1`), 9 mistakes, **410 s**;
  5 caught (56%). The 4 missed are all on `rules.ts:766` (`patternCue: state.config.settings.patternCue === true`): no
  rule test checks the player's view for the cue setting (browser tests do). A test gap for me, not an app bug; I'll
  add a rule test with the C3 batch. Summary: `reports/mutation-scoped.md`.

## Flaky or setup problems (not for the Build workspace)
- None in these runs.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- New test id: `saved-tickets` (the Home row of tickets more than 6 hours old). Everything else is found by words.
- Optional script in `package.json`: `"test:mutation:scoped": "node tests/mutation/scoped.mjs"` (the Test role runs it
  with a range; the C3 batch's quick verify could call it on the batch's range).

## Questions (C3: one list for the owner; the tests use my recommendation for now)
1. Row 6: after "Add another winner" in a phone-ticket game, what does the host see? Recommended (tested): the paper
   players as buttons by name, then Confirm (as in paper games), plus scanning another claim QR (the scanner opening
   at once, or a "Scan a claim" button). If there are no paper players, opening the scanner at once.
2. Row 20: the question's exact text with held tickets. Recommended (tested in parts): "Tickets 1 · 2 and Grandma's
   ticket 3 · Game 7K3P. Your marks go too. …"; the tests check "Tickets 1 · 2", "Grandma's ticket 3" and "Game 7K3P"
   separately. With one ticket: "Ticket 1 · Game 7K3P" (not tested).
3. Row 21: is 6 hours exactly the line? Recommended: more than 6 hours opens Home (tested at 5 h 50 min and 6 h 10 min,
   so either reading of "exactly 6 hours" passes).
4. Row 21: "Older saved tickets with neither time still get the row" can't be set up from the screen without knowing
   how the app stores tickets. Recommended: the coder adds it; I test it only if the owner wants a stored-ticket
   fixture (as `format-1.spec.ts` does for saved games).
5. Row 23: the ⓘ symbol is not checked (an icon may be drawn rather than typed); the tests check no "✗", no "Bogey",
   and "Close" as the main button. Recommended: keep it that way.
6. Answer 2 together with row 11 ("Early Five said once"): with two tickets both filling Early Five and Top Line, what
   does More say? Recommended (tested loosely): each ticket names "Top Line filled", and Early Five appears once, e.g.
   "Ticket 1: Early Five and Top Line filled · Ticket 3: Top Line filled".

## Notes for the owner (plain English)
- I wrote the checks for the four "core" rows before any building, as the new way of working asks: "Add another winner"
  in phone games (row 6), "Done with this game" on players' phones (row 20), old tickets waiting on Home instead of
  opening by themselves (row 21), and clear messages for claims from an old game (row 23). They fail today only
  because the app hasn't been changed yet.
- The six earlier "either answer" checks now follow your product owner's answers, so the app must match them exactly.
- Mutation checking for core changes now runs only on the lines a change touched; on your Mac a small change takes
  about 7 minutes at low priority.
