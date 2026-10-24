# Test report
Commit tested: lane-a d63f4cf + origin/main (scenarios 3.9)   Date: 2026-10-24
Result: RED (expected: tests first for Secret Words 1.4.1, the coder has not built 3.9 yet; no automation run read)
## Failing (real bugs only)
- None yet. Every new or edited test fails only because 3.9 is not built: pause-button missing on the private map (SWD-031), "← Home (keep this game)" missing on the Pause cover (SWD-110), counts show no team names (SWD-040/041), "Reveal" still carries the picker's name and the turn-line does not name them (SWD-122), `night-result` missing (SWD-128), "Next map" opens the map shown with the old toast (SWD-039), and the 27 old strings are still on screen.
## Flaky or setup problems (not for the Build workspace)
- Two-phone tests stop at the old scan heading, so their later checks are not yet exercised.
## Requests for the Build workspace
- None.
## Notes for the owner (plain English)
- Android, local, PGN_PORT=4174: new tests 36 (SWD-031 6, SWD-110 6, SWD-040/041 8, SWD-122 6, SWD-128 4, SWD-039 2, plus edited counterparts), all failing for the reasons above; edited files: 97 of 293 tests fail, all on the new wording or the new behaviour. Rule tests (tests/games/secret-words) 170 of 170 pass.
