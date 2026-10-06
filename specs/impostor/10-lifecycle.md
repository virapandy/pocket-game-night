# 10-lifecycle.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.9, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-090: Interrupted during the deal
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Riya has tapped "Done" and Arjun has held but not tapped "Done"
When the page becomes hidden (phone locked, a call, another app) and visible again, or the page is reloaded, no more
than 3 hours after the round's last move (IMP-099)
Then the screen shows "Welcome back." and "Pass the phone to" ARJUN with the main button "I'm Arjun" (Arjun starts
his turn again at screen A), never a block
And this shows on every return from hidden during the deal and after every reload during the deal
And players who tapped "Done" are not asked again
And reopened more than 3 hours after the round's last move, IMP-091's "This round was left halfway." shows instead

## IMP-091: Interrupted later in a round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the app was closed (or reloaded) during the deal, clues, talk, countdown, picker, the build-up, or the guess
or verdict step of the last-chance guess (the deal within 3 hours: IMP-090)
When it is reopened no more than 3 hours after the round's last move
Then: clues and Free-flow talk show the same screen; Timer talk shows the timer paused at its saved value (IMP-027);
reopened after "Vote now" (or after a tie's "Point again"), the countdown always runs again from "Get ready to
point…" and then the picker opens with nothing selected (tie mode and ticks cleared, a re-vote stays a re-vote)
(product owner, 4 October)
And reopened after "Reveal …" or "Still a tie", the result screen shows with no build-up, exactly as at t = 1.5 s
(IMP-033, IMP-034, IMP-038)
And with the last-chance guess, reopened before "Arjun guessed. Show the word" was tapped it shows the two caught
lines and that button, with the word not in the page; after it, the word and the verdict buttons; after a verdict,
the full result with "Undo" (IMP-037)
And a return from hidden (without a reload) during the 1.5 s build-up shows the same as a reopen
When it is reopened more than 3 hours after the round's last move
Then the screen shows "This round was left halfway. Start a fresh round?" with the main button "Next round", the
outlined "End game" and "← Home" (IMP-077)
And "Next round" deals that round again with a new word and impostor under the same round number (recorded as
`dealAgain`); the menu is as IMP-075 lists for the "left halfway" screen (no "Change how we play"; choices can be
changed on the next round result)

## IMP-092: Ending and discarding the game
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
When the host taps the outlined "End game" between rounds (IMP-077), or "End now" in IMP-093's dialog
Then the summary shows at once (nothing recorded yet: the game stays in progress while the summary shows, and
`endEvening` is recorded when the summary is left, IMP-101), top to bottom: the quiet "Oops, keep playing" (full
width, 48 px tall, directly under the top bar); the heading "That's the game!"; the lead
line `summary-line` (32 px, centred); the fun lines (IMP-095); the final `scoreboard` (when Score was Yes at any
point; with IMP-043's caption; columns as IMP-044); the quiet buttons, in this order, "Play something else", "Home"
and "More ›" (each full width, 48 px tall, 8 px apart); and the main button "Play again", pinned
And `summary-line` is:
- when Score was Yes at any point and the top total is at least 1: "Arjun wins the game with 2 points!" ("1 point");
  with a shared top total, the names in seat order: "Arjun and Meena share the game with 2 points!", "Arjun, Meena
  and Kabir share the game with 2 points!";
- otherwise: "Impostor caught 4 · escaped 3": the counts of caught and escaped counted rounds (Terms), as in
  `evening-line` (IMP-040)
And "More ›" opens a menu with "Share", "History", a divider, and "Discard this game" last
And "End game" and "End now" lead to this summary with no extra confirmation ("Oops, keep playing" is the way back)
And the summary scrolls as one page (guideline 46a), has no menu button, and has no inner scroll area
When "Play again" is tapped
Then `endEvening` is recorded and a new game starts exactly as History's "Play again" does (IMP-103): "Who's
playing?" with this game's final players, then "How do you want to play?" with its final choices
When "Home" is tapped
Then `endEvening` is recorded and Home opens
When "Play something else" is tapped
Then `endEvening` is recorded and IMP-102 applies
And "History" (in "More ›") records `endEvening` and opens History
And once `endEvening` is recorded the game is kept in History (unless IMP-097 applies)
When "Discard this game" is tapped
Then a dialog asks "Discard this game? Its rounds and scores will be lost." with "Discard" and "Keep it" (main)
When "Discard" is tapped
Then the game and its scores are deleted from this phone (no `endEvening`; nothing kept), Home opens, and the game
is in neither History nor `unfinished-games`; its words do not count for IMP-052's "last 3 evenings"
Arithmetic (rule 4), 390 × 844, Score Yes, 12 players: top 16 + heading 40 + `summary-line` 2 lines 77 + 2 fun lines
48 + scoreboard 216 + caption 21 + 3 quiet buttons 160 + main button 76 + 6 gaps of 8 = 702 px ≤ 844 (no scroll);
at 320 × 568 the page scrolls (scoreboard one column: 12 × 36 = 432 px)

## IMP-093: Ending mid-round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "End game" in the menu during a round (deal, clues, talk or picker)
Then a dialog asks "End now? This round won't count." with "End now" and "Keep playing" (main)
When "End now" is tapped
Then the summary shows as in IMP-092; when `endEvening` is recorded (IMP-101) that round is dropped (no points,
not completed); "Oops, keep playing" returns to the round exactly where "End now" was tapped
And "Keep playing" closes the dialog with nothing changed (a running timer kept running while the dialog was open)

## IMP-094: What History keeps
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then a kept evening stores: players, choices, and for each completed round its word, impostor, who was revealed (or
"Still a tie"), the verdict (last-chance guess only), the points (when scored) and whether it was the practice round; plus its saved record
for exact replay (IMP-096)
And while an evening is in progress, History shows it as one `history-game` row containing "In progress", with no
rounds, words or names of impostors
And a completed round appears in History only once it is completed

## IMP-095: Fun lines at the end
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the summary shows these `fun-line`s, in this order, each only when its condition holds, at most these 2
(counted rounds only):
1. "Best impostor: Arjun, escaped 2 times": the player with the most escapes as impostor, when that is at least 1
   ("escaped 1 time"); equal counts: the first in seat order
2. "Most suspected: Meena, picked 3 times without being the impostor": the player revealed by the vote the most times while not the impostor, when that
   is at least 2; equal counts: the first in seat order
And "seat order" is the evening's final seat order, with players who left after everyone still playing, in the
order they left
Given 0 counted rounds
Then no fun lines show

## IMP-096: Saved evenings carry a format version
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then every evening is saved, at every move, as one engine `SavedGame` at the engine's current format
(`SAVED_GAME_FORMAT`, 2 on 3 October 2026; never format 1, which `readSavedGame` reads as an old Tambola game):
```json
{ "format": 2, "gameType": "impostor", "id": "…", "createdAt": 1791043200000, "updatedAt": 1791043212000,
  "status": "in-progress", "sessionId": "…",
  "setup": { "gameId": "impostor",
             "seeds": { "word": "3f9a0c…", "starter": "b71e44…" },
             "config": { "players": ["Riya", "Arjun", "Meena", "Kabir"],
                         "choices": { "mode": "easy", "talking": "free", "score": false, "words": "family",
                                      "categories": ["Food", "Festivals and occasions", "Around the house",
                                                     "Out and about", "Films, music and TV", "Sports and games",
                                                     "School and childhood", "Weddings and family", "Everyday moments"],
                                      "nonveg": false, "lastGuess": false },
                         "excludedWords": { "dealtTonight": ["IMPW-002"], "recent": ["IMPW-003"],
                                            "blocked": ["IMPW-018"] } } },
  "records": [ { "v": 1, "seq": 1, "at": 1791043200000, "by": "host", "move": { "type": "startDeal", "practice": false, "wordId": "IMPW-004" } },
               { "v": 1, "seq": 2, "at": 1791043212000, "by": "host", "move": { "type": "seen" } } ] }
```
And `status` follows PLT-001: "in-progress" while the evening runs (the summary included, IMP-101), "ended" after
`endEvening`; a discarded evening is deleted, not saved with a status (IMP-092)
And every move that deals a word records its `wordId` (Test hooks item 1); replay uses the recorded ids, so an evening
replays the same after later edits to `words.csv`
And a saved evening whose `choices` has no `lastGuess` reads as `lastGuess: true` (IMP-009 for stored last choices)
And a saved evening that no longer replays (refused by the rules, or an error while reading, for example a preview
evening from before 3.1 whose word ids are gone) is never offered anywhere: not on Home, not on "What shall we
play?", not in History (no row at all), not as tonight's names; opening the app never crashes on it
And `config.testDeals` may be present (development and preview builds only, Test hooks item 3); the rules use it
on replay exactly as live
And `config.players` and `config.choices` are those at the first "Start round"; later changes are `setPlayers` /
`setChoices` moves, so each round's players and choices follow from the records
And `config.excludedWords` holds the sets frozen at the first "Start round" (IMP-052): `dealtTonight` (dealt in
tonight's session), `recent` (dealt in the last 3 evenings), `blocked` ("This word didn't work" on this phone, and
"Don't know this word?" tonight)
And `readImpostorEvening(saved)` returns `{ players, choices, excludedWords, seeds, moves, status }` from it (Test
hooks item 1)
And a fixture `SavedGame` of this shape (in the Test clone) always opens with `readSavedGame` and the app, now and
after every later change (PLT-001, PLT-014). Note for the tester: regenerate the format fixture so every
word-dealing move carries `wordId`; a fixture without word ids is unreplayable and hidden

## IMP-097: An evening with no counted round is not kept
Status: approved, owner, 2026-10-06 (changed; detail of IMP-092, IMP-094)
Phase: Impostor 1
Given the summary shows (after "End game", "End now", or IMP-104) for an evening with no counted round (none,
or only the practice round)
Then it shows "That's the game!", `summary-line` "Impostor caught 0 · escaped 0" (whatever the Score choice; no
scoreboard), no fun lines, and "More ›" without "Share"; "Oops, keep playing", "Play again", "Play something else",
"Home", and "History" and "Discard this game" in "More ›" are still offered
And when `endEvening` is recorded the evening is deleted rather than kept in History, and its words do not count
for "the last 3 evenings"

## IMP-098: Plurals on the summary and in Share
Status: approved, owner, 2026-10-04 (changed; detail of IMP-092, IMP-106)
Phase: Impostor 1
Then with 1 counted round Share's first line reads "Impostor game · 1 round"
And "Arjun wins the game with 1 point!" / "… with 2 points!" in `summary-line`
And "escaped 1 time" / "escaped 2 times" in fun line 1

## IMP-099: Time limits, measured exactly
Status: approved, owner, 2026-10-04 (changed; detail of IMP-091, IMP-101, IMP-104)
Phase: Impostor 1
Then every limit is "more than" (strictly greater), measured with `Date.now()` against a move's `at`:
- 3 hours, IMP-090 and IMP-091: from the last move of the round in progress (its deal moves included); not used
  when `summaryShownAt` is set;
- 3 hours, IMP-101: from `summaryShownAt` (when the summary was first shown); then `endEvening` is recorded with
  `at` = the moment the limit is noticed (app open or next check). When `summaryShownAt` is set, this is the only
  limit that applies: reopened after it, `endEvening` is recorded and the summary shows without "Oops, keep playing";
  the IMP-091 "left halfway" screen never shows for such an evening, and IMP-104 does not apply;
- 12 hours, IMP-104: from the move that completed the last completed round (`reveal` with the last-chance guess off,
  `reveal` of a crew member, `stillTie`, or `verdict`), or from the first move when there is none
Example: a round whose last move was at 21:00:00.000 reopened at exactly 00:00:00.000 returns to the same step; at
00:00:00.001 it shows "This round was left halfway. Start a fresh round?"

---
