# 10-lifecycle.md

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the app was closed (or reloaded) during the deal, clues, talk, countdown, picker or reveal (the deal within 3
hours: IMP-090)
When it is reopened no more than 3 hours after the round's last move
Then: clues and Free-flow talk show the same screen; Timer talk shows the timer paused at its saved value (IMP-027);
the countdown starts again from "Get ready to point…"; the picker shows with nothing selected (tie mode and ticks
cleared, a re-vote stays a re-vote)
And a reveal reopened before "Show the word" was tapped shows every line up to "Arjun, one guess…" and the main
button "Show the word", with the word not in the page
And a reveal reopened after that shows its lines with no build-up and no timing: the word and the verdict buttons,
or, after a verdict, the result block with "Undo" (IMP-037); an escaped or "Still a tie" reveal shows all its lines and its result block
And a return from hidden (without a reload) during a reveal does the same as a reopen
When it is reopened more than 3 hours after the round's last move
Then the screen shows "This round was left halfway. Start a fresh round?" with the main button "Next round"
And "Next round" deals that round again with a new word and impostor under the same round number (recorded as
`dealAgain`); the menu (between-rounds items) is also available

## IMP-092: Ending and discarding the evening
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "End the evening" in the menu on a round result
Then a dialog asks "End the evening?" with "End the evening" and "Keep playing" (main); "Keep playing" closes it
When "End the evening" is tapped (nothing recorded yet: the evening stays in progress while the summary shows, and
`endEvening` is recorded when the summary is left, IMP-101)
Then the summary shows: the heading "That's the night!", the fun lines (IMP-095), then the final `scoreboard` (when
Score was Yes at any point; with IMP-043's caption) or `summary-line` "7 rounds · impostor caught 4 · escaped 3"
(Score No throughout); the main button "Back to Home"; and the quiet buttons, in this order: "Oops, keep playing",
"Play something else", "Share", "History", "Discard this evening"
And the summary has no menu button; once `endEvening` is recorded the evening is kept in History (unless IMP-097
applies)
When "Discard this evening" is tapped
Then a dialog asks "Discard this evening? Its rounds and scores will be lost." with "Discard" and "Keep it" (main)
When "Discard" is tapped
Then the evening and its scores are deleted from this phone (no `endEvening`; nothing kept), Home opens, and the evening is in neither History nor
`unfinished-games`; its words do not count for IMP-052's "last 3 evenings"
And "Back to Home" opens Home and "History" opens History, each recording `endEvening` first

## IMP-093: Ending mid-round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "End the evening" in the menu during a round (deal, clues, talk or picker)
Then a dialog asks "End now? This round won't count." with "End now" and "Keep playing" (main)
When "End now" is tapped
Then the summary shows as in IMP-092; when `endEvening` is recorded (IMP-101) that round is dropped (no points,
not completed); "Oops, keep playing" returns to the round exactly where "End now" was tapped
And "Keep playing" closes the dialog with nothing changed (a running timer kept running while the dialog was open)

## IMP-094: What History keeps
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then a kept evening stores: players, choices, and for each completed round its word, impostor, who was revealed (or
"Still a tie"), the verdict, the points (when scored) and whether it was the practice round; plus its saved record
for exact replay (IMP-096)
And while an evening is in progress, History shows it as one `history-game` row containing "In progress", with no
rounds, words or names of impostors
And a completed round appears in History only after its result block has appeared

## IMP-095: Fun lines at the end
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the summary shows these `fun-line`s, in this order, each only when its condition holds, at most these 3
(counted rounds only):
1. "Best impostor: Arjun, escaped 2 times": the player with the most escapes as impostor, when that is at least 1
   ("escaped 1 time"); equal counts: the first in seat order
2. "Most suspected: Meena, picked 3 times while crew": the crew member revealed by the vote the most times, when that
   is at least 2; equal counts: the first in seat order
3. "Rounds played: 7": when at least 1 counted round
And "seat order" is the evening's final seat order, with players who left after everyone still playing, in the
order they left
Given 0 counted rounds
Then no fun lines show

## IMP-096: Saved evenings carry a format version
Status: approved, owner, 2026-10-03
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
                                                     "Travel and places", "Films, music and TV", "Cricket and games",
                                                     "School and childhood", "Weddings and family", "Desi life"],
                                      "nonveg": false },
                         "excludedWords": { "dealtTonight": ["IMPW-002"], "recent": ["IMPW-003"],
                                            "blocked": ["IMPW-018"] } } },
  "records": [ { "v": 1, "seq": 1, "at": 1791043200000, "by": "host", "move": { "type": "startDeal", "practice": false } },
               { "v": 1, "seq": 2, "at": 1791043212000, "by": "host", "move": { "type": "seen" } } ] }
```
And `status` follows PLT-001: "in-progress" while the evening runs (the summary included, IMP-101), "ended" after
`endEvening`; a discarded evening is deleted, not saved with a status (IMP-092)
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
after every later change (PLT-001, PLT-014)

## IMP-097: An evening with no counted round is not kept
Status: approved, owner, 2026-10-03 (detail of IMP-092, IMP-094)
Phase: Impostor 1
Given the summary shows (after "End the evening", "End now", or IMP-104) for an evening with no counted round (none,
or only the practice round)
Then it shows "That's the night!", `summary-line` "0 rounds · impostor caught 0 · escaped 0" (whatever the Score
choice; no scoreboard), no fun lines and no "Share"; "Oops, keep playing", "Play something else", "History" and
"Discard this evening" are still offered
And when `endEvening` is recorded the evening is deleted rather than kept in History, and its words do not count
for "the last 3 evenings"

## IMP-098: Plurals on the summary and in Share
Status: approved, owner, 2026-10-03 (detail of IMP-092, IMP-106)
Phase: Impostor 1
Then with 1 counted round the summary line reads "1 round · impostor caught 1 · escaped 0" and Share's first line
"Impostor night · 1 round"; "Rounds played: 1"
And "escaped 1 time" / "escaped 2 times" in fun line 1

## IMP-099: Time limits, measured exactly
Status: approved, owner, 2026-10-03 (detail of IMP-091, IMP-101, IMP-104)
Phase: Impostor 1
Then every limit is "more than" (strictly greater), measured with `Date.now()` against a move's `at`:
- 3 hours, IMP-090 and IMP-091: from the last move of the round in progress (its deal moves included); not used
  when `summaryShownAt` is set;
- 3 hours, IMP-101: from `summaryShownAt` (when the summary was first shown); then `endEvening` is recorded with
  `at` = the moment the limit is noticed (app open or next check). When `summaryShownAt` is set, this is the only
  limit that applies: reopened after it, `endEvening` is recorded and the summary shows without "Oops, keep playing";
  the IMP-091 "left halfway" screen never shows for such an evening, and IMP-104 does not apply;
- 12 hours, IMP-104: from the move that completed the last completed round (`verdict`, `reveal` of a crew member, or
  `stillTie`), or from the first move when there is none
Example: a round whose last move was at 21:00:00.000 reopened at exactly 00:00:00.000 returns to the same step; at
00:00:00.001 it shows "This round was left halfway. Start a fresh round?"
