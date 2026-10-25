# What Am I? screen-played evenings (25 October 2026)

Lane `lane-o`, tested build: `main` d5dd03e (What Am I? as released in 1.5.0). Owner's request of 25 October: extensive
testing via Jev. Report-only: nothing here fails a build.

Tool: `tests/sims/what-am-i-runner.ts` with `what-am-i-evenings.sim.ts` (the Secret Words screen-simulation pattern), run
locally on the preview build, 3 workers under `caffeinate -i taskpolicy -b`. After the run, `tests/sim/what-am-i-replay.run.ts`
replays every saved night through the real rules engine. Results per evening: `reports/sim/screen/what-am-i/wai-w43-*.json`.

## What was played

- **40 evenings, seeds `w43-001` to `w43-040`, every one with Jev choosing as the persona** (first-time host, grandparent with
  weak English, 10-year-old, distracted host, competitive uncle, guest: 7, 7, 7, 7, 6 and 6 evenings). Jev saw only the
  headings and button names and chose among the buttons on screen (40 decisions an evening, including a "which button next?"
  rating of each new screen); after that, and on the word screen, the scripted persona carried on. **1,602 Jev decisions.**
- **All 40 reached Home after "Tonight's What Am I?"** (End for tonight): 54 games, 8,459 steps, 4,456 marks (817 by moving
  the phone, the rest by taps), 3 to 10 players (3: 4 evenings, 4: 8, 5: 7, 6: 5, 7: 3, 8: 5, 9: 3, 10: 5), turns of 30 s or
  60 s, in the guesser's hand (22) and hands-free (18), motion allowed, absent or refused, sizes 320, 360, 390 and 812 wide,
  Larger text in 3.
- Every evening covered Who's playing, Words and time, Read this aloud, the pass screen, the countdown, the word screen, Time's
  up, Round over, Pause and its cover, End the game, Game over and End for tonight. Also: the motion question (19 evenings),
  Play again (14 evenings with a second game), leaving (16 evenings) and joining through Players (14), "End Riya's turn now"
  (3), the Scores sheet (9), How to play (20), Settings (7), 39 reloads and 63 times the app was hidden and shown again. The
  guest (and 7 other evenings) first opened Home → Join a game on a second phone and found the line "What Am I? is played on
  the host's phone. Ask the host to add your name." every time.

## Checks after every step, and what they found

| Check | Result |
|---|---|
| The scores add up: every in-game scoreboard on screen (Round over, Game over, Scores) sums to the words got in saved turns, counted by code from the saved moves; Time's up's "Riya got 5" equals the Got it chips | **No wrong score** |
| The same scoreboards equal the engine's replay of the saved night at that moment (264 scoreboards) | **All equal** |
| Every shown word is in exactly one list, or was hidden by Pause: Time's up's chips equal the saved moves' lists, no word in both, every word seen on the word screen this turn is in a list or was hidden by a pause | **No slip** |
| Nothing stuck: a way on on every screen but the countdown, no screen for 30 steps, no unknown screen | **None in the 40 evenings**; see finding 1 from the trial runs |
| Saved nights replay: a reload keeps every saved move; each evening's saved night replays through the engine, twice, to the same state | **All 40 replay; no reload lost a move** |
| At most one main button, nothing sideways, no console error | **None** |

## Findings

1. **Stuck (real, rare): a blank screen at time up.** When a mark's 600 ms flash ends on the very millisecond the turn time
   runs out, the app shows an empty page (`wai-turn-blank`, nothing to tap) instead of "Time's up!". It stays blank (40 s of
   app time and the phone's Back tried); only a reload or Home gets out: Home's row then reads "What Am I? · Round 1 · Meena
   guessing, 0 s left", its Paused cover's "Carry on playing" counts 3, 2, 1 and then opens Time's up with the marks kept.
   Scenarios: WAI-022 with Version 1.1 item 14 (marks in flight) and WAI-030.
   - Exact steps (deterministic): 3 players Riya, Arjun, Meena; 30 s turns; Hands-free; word seed `r1` (WAI-H1b); start
     Riya's turn; on the first word tap the top area (Pass) exactly 29,400 ms after the word appears; wait. Taps at 29,399 or
     29,401 ms open Time's up normally. Repro file: `tests/sims/what-am-i-blank-at-time-up.sim.ts` (report-only).
   - Seen in the first trial run (seeds `dbg-001`, `dbg-002`, `dbg-006` of the runner before its steps had a human jitter):
     3 of 6 evenings hit it, because every step there was a whole multiple of 100 ms. With a jittered pace the 40 Jev evenings
     never hit it. On a real phone it needs the flash end and time up in the same instant, so it should be rare, but when it
     happens the room is stuck until someone reloads.
2. **Privacy:** not applicable beyond the word lists (What Am I? shows the word to the room by design); no slip found.
3. **Scoring:** none.
4. **Other, for the product owner (Jev as persona, a weak signal, not a bug):**
   - On Time's up, Jev personas chose "← Home (game saved)" instead of "Save score" again and again (3 or more times in 17
     evenings), and on the Paused cover chose "← Home (game saved)" over "Carry on playing" (12 evenings).
   - Jev's "which button next?" rating picked "How to play" over "Start with these words" on Words and time (0.60 to 0.69) in 6
     evenings (first-time host, guest, distracted host, 10-year-old); personas kept opening How to play on S1, S2 and S3 (19,
     17 and 19 evenings).
   - The guest on the host's phone went Home → Join a game → "Type the host's code" and back three times in 6 of 6 guest
     evenings before taking the host path, although the Join screen has the What Am I? line.
   - Motion marks: 420 of the 817 marks by moving the phone did not change the word within the runner's one second. Not a
     finding: it is the throttled run's timing. The same runner without `taskpolicy -b` missed 0 of 212 and 15 of 91 (seeds
     `dbg2-009`, `dbg2-011`), and motion is covered exactly by the browser tests.
   - Sim faults (not app findings): in `w43-040` the runner tried to add a name in the "Someone else goes first" list (fixed
     in the runner); earlier runner versions looped on the deal or a turn's word list when Jev chose on the screen before.

## Budget

Shared weekly count (2026-W43, `reports/runs/jev-usage.json`): 22,842 before this job. This report: 1,602 decisions (and about
280 more in runs stopped to fix the runner).
