# Jev text check: Secret Words on-screen words, 1.4.1 follow-up

Date: 2026-10-24. Budget: product. Source: `docs/games/secret-words/text.csv`, column `text`. Findings only; nothing else was changed. Uncommitted.

Method: the existing tool `tests/tools/jev-design/run.ts --texts`. Its question (b) is "Would a mixed-region Indian family (ages 8 to 80, including someone from Tirunelveli who does not speak Hindi) understand this text at once?" with the text as the state. This is close to the requested wording but not word for word (it does not say "on a phone"; the tool says "a line of text shown in a family party game played in English in India"). The tool cannot be changed, so (b) is used as the Choice. It also asks (a) family-friendly, (c) scary, (d) laugh for each row; those are not reported here. Each answer is one Jev answer (no repeats), so values near 0.5 may move on a re-run.

Rows: 326 in the CSV, 9 skipped (names or code only): sw.code-entry.4 (code), sw.picker-card.1 (game name), sw.clue-givers-sheet.2 and .3 and sw.v37.map-key.1 and .2 (team names), sw.scan-screen.5, sw.pass-screen.3 and .4 (player names). Asked: 317 of 317. No row was a lone example board word. Rows that show a board word with a number (for example `CRICKET · 2`) were kept and asked.

## Counts (P yes, understood at once)

- Below 0.5: 34
- 0.5 to 0.8: 132
- Above 0.8: 151
- Unsure (top answer "uncertain" on any of the four questions): sw.private-map.12, sw.game-over.5, sw.new-clue-giver.1. (None of these is below 0.5 on (b).)

## Texts below 0.5 (lowest first)

| Text | Key | P yes |
|---|---|---|
| Step on it and your turn ends; the other team gets one word free. | sw.option-lines.4 | 0.14 |
| Tap Next map on the map phone and check it starts with: Kite · Tiffin · Rain | sw.board-check-scan-screen.5 | 0.19 |
| 6 and 5 words to find, 5 blank, no Landmine. | sw.option-lines.2 | 0.21 |
| Coffee Commandos would be left with only Om. Move someone over? | sw.team-of-one.1 | 0.21 |
| Doesn't match? Scan the host's code again. | sw.version-3-6-strings.7 | 0.22 |
| Tap Next map on both map phones and check they start with: Kite · Tiffin · Rain | sw.board-check-scan-screen.6 | 0.25 |
| Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu. | sw.version-3-6-strings.2 | 0.26 |
| Step on it and your team loses. | sw.option-lines.3 | 0.28 |
| Best clue: RAIN ∞ · 4 found | sw.game-over.9 | 0.29 |
| Secret Words clue givers: scan the host's code to get your secret map. | sw.join-screen.5 | 0.30 |
| Riya and Arjun give clues for different teams but share one map phone, as at a real table: sit side by side. | sw.v37.two-phone-line.1 | 0.31 |
| New code: scan again. The map phones should start with: Kite · Tiffin · Rain | sw.board-check-scan-screen.8 | 0.34 |
| Tip: turn on Do Not Disturb so messages don't pop up on the board. | sw.do-not-disturb-tip.1 | 0.34 |
| New code: scan again. The map phone should start with: Kite · Tiffin · Rain | sw.board-check-scan-screen.7 | 0.37 |
| Clue: ∞ | sw.board-status.9 | 0.37 |
| Tambola ticket or Secret Words map from the host | sw.home-second-card.3 | 0.37 |
| No more maps from this code. Scan the host's new code. | sw.map-phone-toasts.3 | 0.37 |
| Landmine | sw.choices.5 | 0.38 |
| Got a QR or code from the host? | sw.home-second-card.5 | 0.41 |
| Game over: tap Done with this game. New board on the host: tap Next map. | sw.map-phone.18 | 0.42 |
| Never guess: Shadow (the Landmine) | sw.private-map.16 | 0.42 |
| New board? New words, same teams, fresh start. For when someone saw the map or the words are too hard. This board won't count. | sw.deal-new.1 | 0.43 |
| Chai Champions: RAIN ∞ | sw.earlier-clues-sheet.4 | 0.43 |
| Hand the map phone to Meena and Kabir, tap Next map, and check it starts with: Kite · Tiffin · Rain | sw.board-check-scan-screen.3 | 0.45 |
| Best clue: MONSOON 2 · 3 found | sw.game-over.8 | 0.46 |
| Next map? Only after the host starts the next game. | sw.map-phone-dialogs.4 | 0.46 |
| Tap a word when it's found to fade it (optional). The host's board is what counts. | sw.map-phone.6 | 0.46 |
| Scan a ticket or secret map | sw.join-screen.2 | 0.47 |
| 9 and 8 words to find, 7 blank, 1 Landmine. | sw.option-lines.1 | 0.47 |
| On the other phone: open the app, tap Join a game, scan this. | sw.scan-screen.2 | 0.47 |
| Delete tonight's games? The games and tally will be lost. | sw.delete-tonight-s-games.1 | 0.48 |
| Someone else taps Reveal | sw.someone-else-taps-reveal.1 | 0.48 |
| Meena and Kabir: scan this code on your phones and check they start with: Kite · Tiffin · Rain. Riya and Arjun: tap Done with this game. | sw.board-check-scan-screen.4 | 0.49 |
| Clue givers: scan to get the secret map | sw.scan-screen.1 | 0.49 |

## Decisions used

- This run: 1,268 (317 rows x 4 questions).
- Product weekly total after this run: 20,787 of 30,000. Shared weekly total: 22,590 of 50,000.
- The run was not stopped early by any limit.

## Tool faults

None: every call answered on the first try; no row skipped.

## Raw tool report

Full per-row table (a to d): `/private/tmp/claude-501/-Users-virat-Documents-Game-On/c353611c-ee33-4925-8a43-52d566e85742/scratchpad/sw-raw.md`.
