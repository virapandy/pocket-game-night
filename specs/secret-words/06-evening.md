# 06-evening.md: The evening (saved data C3)

Copied from `docs/games/secret-words/scenarios.md` (version 3.7, approved by the owner 23 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.7", that paragraph wins over the text above it, then its "Version 3.6" paragraph. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-060: End of the evening
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"End for tonight" (game over button, or menu) → dialog → "End for tonight": the summary shows what SWD-128 lists, with quiet
"Oops, keep playing", quiet "← Home" and main "Play something else" (the picker, tonight's names kept). **Nothing is recorded
until the summary is left**: by "← Home", "Play something else", a reload, the app being hidden, or SWD-063; then `endGame` (if a
game was in progress, it is ended early) and `endEvening` are recorded. "Oops, keep playing" (only until they are recorded)
returns to the step the host came from, as it was, and records nothing. After a reload or the app being hidden, the summary
shows without "Oops, keep playing". Once `endEvening` is recorded the game night never reopens; a game night with no game at
all is then deleted, otherwise it stays in History.

## SWD-061: (retired)
Status: retired (version 3.4)
Retired in version 3.4: replaced by SWD-127.

## SWD-062: Leaving and resuming
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Every move is saved. Home's unfinished row and the picker's resume card (SWD-115) return to the same step (SWD-048).

## SWD-063: The 12-hour limit
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
When the app opens or Home shows, an evening whose last move is more than 12 hours old ends: `endGame` (if a game was in
progress) and `endEvening`, both at the last move + 12 hours. No summary shows. A pending "Game ended" (SWD-054) or summary
(SWD-060) is recorded the same way.

## SWD-064: History
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Evening row "Secret Words · 3 games" (won and ended early). Game rows: "Game 2 · Chai Champions won · Riya and Arjun gave clues"; Landmine: "Game
2 · Chai Champions won (Landmine) · Riya and Arjun gave clues"; "Game 3 · Ended early · Meena and Kabir gave clues"
(credited clue givers, the orange team's first; a pair "Nana + Aarav and Kabir gave clues"; names as renamed, SWD-127).
Tapping a game row opens a screen headed h1 "Game 2 · Chai Champions won" (the row's text up to the clue givers) with its board, the whole map and the line `history-clues` "Clues: Chai Champions CRICKET 2 · Coffee
Commandos 1 · Chai Champions RAIN ∞" (every clue in force, oldest first; a clue without a word shows its number alone) ("←
Back" to the evening).

## SWD-065: Delete tonight's games
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
Summary menu "Delete tonight's games" → dialog → "Delete": the evening is deleted and Home opens. No undo.

## SWD-066: Saved choices (detail of SWD-009)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
`pgn.pref.secretWords.lastChoices` = `{ map, board, landmine, words }`, written at each deal. Unreadable or missing → the
first-time state; a missing `landmine` alone → SWD-119's default.

## SWD-067: Start new (detail of SWD-001)
Status: approved, owner, 2026-10-23 (version 3.7)
Phase: Secret Words 1
"Start new (ends that one)" (SWD-115) records `endGame` (if a game was in progress) and `endEvening` for the old evening, then
opens "Who's playing?" for a new evening. No summary shows.
