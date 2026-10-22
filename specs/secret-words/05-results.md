# 05-results.md: Winning and the night (C3)

Copied from `docs/games/secret-words/scenarios.md` (version 3.6, approved by the owner 22 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.6", that paragraph wins over the text above it. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-050: Who wins
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
A team wins when all its words are turned over (by either team, or SWD-046). With Lose the game, turning over the Landmine makes the other team win; with Lose your turn, see SWD-043.
**Property:** every one of 10,000 random scripted games ends with exactly one winner, or ended early.

## SWD-051: Game over
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Heading "Chai Champions win!"; line "All 9 words found." (the winner's total: 9, 8, 6 or 5) or, for the Landmine, "Boom! The
Landmine got Coffee Commandos." (the losing team); the whole map: turned-over cells as before, face-down cells now in their
kind's colour and icon at 50% opacity (accessible name "Kite, teal team, not found"); then the parts and buttons of SWD-112 in
its order (`near-miss`, `best-clue`, tally, `next-clue-givers` with "Swap clue givers", "Change teams, players, phones or board", "End for
tonight", "← Home", main "Play again"). The page may scroll as one, main fixed. Wake lock released. Narrow portrait: the
sideways line instead of the board.
**Version 3.6 (owner, 22 October):** **Faded cells, replacing every opacity rule** (40% in SWD-031 and 035, 50% here): face-down cells at game over, found cells on the map phone and on the private map are filled with `color-mix(in srgb, <kind token> 20%, var(--surface))` (kind tokens `--team-orange`, `--team-teal`, `--nobody`, `--landmine`), with the word in `--text` at full strength and the kind's icon at full strength; found cells keep the strikethrough. Word text contrast at least 4.5:1 in light and dark. Accessible names unchanged.

## SWD-052: Tally
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
"Tonight: Chai Champions 2 · Coffee Commandos 1" (won games only); "Tonight: Chai Champions 0 · Coffee Commandos 0" before any.

## SWD-053: Play again
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Same teams and choices; the clue givers shown in `next-clue-givers` (SWD-007's suggestion, without a partner, unless changed
by "Swap clue givers", SWD-112); a new deal (SWD-024); then the scan screen or the new starting team's pass screen.

## SWD-054: End the game
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Menu "End the game" (scan, pass, clue, guessing, end-turn line, turn over) → dialog "End this game with no winner?" → "End the
game": game over with heading "Game ended. No winner.", no result line, the whole map as SWD-051, tally unchanged, the parts
and buttons of SWD-112 (`best-clue` by SWD-128; no `near-miss`), and a 10 s `undo-toast` "Game ended · Undo". `endGame` is
recorded when the toast expires (t = 10 s from the dialog's "End the game"), or earlier at the first of: a tap that leaves the
game over screen ("Play again", "Change teams, players, phones or board", "End for tonight", "← Home", or the menu's "How to play",
"Settings" or "History"), a reload, or the app being hidden; the toast is then removed. "Undo" within the 10 s records nothing
and returns to the step the menu was opened from, as it was (the timer stays removed). Taps on "Swap clue givers" or the menu's "Players"
don't leave the screen. Once recorded, the game counts for SWD-007 and History. `canUndo` stays false: the Undo is screen state,
not a move.

## SWD-055: New board
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Menu "New board" (any step from the first deal until game over) and the private map's "Someone saw the map" (SWD-113) → dialog
→ "New board": a new deal with the same teams, clue givers and choices; the starting team drawn anew; turn numbers restart;
tips don't show again; the timer stops; clue-giver counts unchanged. Then the scan screen or the new starting team's pass screen.

## SWD-056: (retired)
Status: retired (version 3.4)
Retired in version 3.4: replaced by SWD-112 ("Change teams, players, phones or board").
