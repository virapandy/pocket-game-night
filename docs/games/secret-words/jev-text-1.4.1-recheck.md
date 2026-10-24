# Jev re-check of the Version 3.9 wording (Secret Words 1.4.1)

Run 2026-10-24, budget `product`, tool `tests/tools/jev-design/run.ts --texts`. Source: the 29 old → new pairs under "### Version 3.9 wording" in `scenarios.md`, plus the five `sw.v39.` rows of `text.csv`. Old and new texts were scored in the same run (63 rows). Question (b) "understood by a mixed-region Indian family"; P yes values below. Findings only.

Medians over the 29 pairs: P yes old 0.37, new 0.45 (change +0.08). New text below 0.5: 17 of 29. Improved: 20, same or worse: 9. Question (a) (family-friendly) was 0.88 or higher on every new text; (c) (scary) at most 0.18.

## Pairs, worst new first

| # | New text | P yes old | P yes new | Change |
|---|---|---|---|---|
| 10 | First words different? Scan the host's code again. | 0.26 | 0.29 | +0.03 |
| 23 | Coffee Commandos would have only Om left. Move someone from Chai Champions? | 0.22 | 0.30 | +0.08 |
| 15 | Tip: turn on Do Not Disturb, so messages don't pop up over the board. | 0.34 | 0.31 | -0.03 |
| 12 | Clue givers should use their own phones. To show the map here instead, use the menu: Show the map to a clue giver. | 0.27 | 0.32 | +0.05 |
| 17 | When the game ends, tap Done with this game. If the host starts a new board, tap Next map. | 0.33 | 0.32 | -0.01 |
| 2 | Each team finds 6 or 5 words. 5 belong to nobody. No Landmine. | 0.24 | 0.33 | +0.09 |
| 5 | On the map phone, tap Next map. Its first words should be: Kite · Tiffin · Rain | 0.22 | 0.33 | +0.11 |
| 6 | On both map phones, tap Next map. Their first words should be: Kite · Tiffin · Rain | 0.25 | 0.35 | +0.10 |
| 8 | New code: scan it again. The map phones' first words should be: Kite · Tiffin · Rain | 0.37 | 0.35 | -0.02 |
| 3 | Guess the Landmine and your turn ends; the other team gets a free word. | 0.21 | 0.37 | +0.16 |
| 22 | On the second phone: open this app, tap Join a game, and scan this. | 0.51 | 0.37 | -0.14 |
| 25 | Scan a ticket or a secret map | 0.41 | 0.38 | -0.03 |
| 7 | New code: scan it again. The map phone's first words should be: Kite · Tiffin · Rain | 0.37 | 0.39 | +0.02 |
| 14 | Riya and Arjun: sit together and share one map phone (each gives clues for their own team). | 0.29 | 0.43 | +0.14 |
| 13 | Giving clues in Secret Words? Scan the host's code to see your secret map. | 0.35 | 0.45 | +0.10 |
| 29 | Best clue: MONSOON for 2 · both found | 0.72 | 0.47 | -0.25 |
| 16 | This code has no more maps. Scan the host's new code. | 0.37 | 0.49 | +0.12 |
| 9 | Give the map phone to Meena and Kabir. They tap Next map; its first words should be: Kite · Tiffin · Rain | 0.47 | 0.50 | +0.03 |
| 20 | Tap a word once it's been guessed, to fade it (optional). The board on the host's phone is what counts. | 0.42 | 0.51 | +0.09 |
| 21 | Clue givers: scan this to see the secret map | 0.52 | 0.53 | +0.01 |
| 24 | New board? Fresh words, same teams. Use it if someone saw the map or the words are too hard. This board won't count. | 0.44 | 0.53 | +0.09 |
| 1 | Each team finds 9 or 8 words. 7 belong to nobody, and 1 is the Landmine. | 0.37 | 0.55 | +0.18 |
| 4 | Guess the Landmine and your team loses. | 0.26 | 0.55 | +0.29 |
| 18 | Landmine, never guess: Shadow | 0.39 | 0.55 | +0.16 |
| 11 | First words different? Scan this code again. | 0.60 | 0.56 | -0.04 |
| 28 | Best clue: MONSOON for 2 · 3 words found | 0.46 | 0.57 | +0.11 |
| 27 | Best clue: RAIN (any number) · 4 found | 0.27 | 0.59 | +0.32 |
| 19 | Has the host started the next game? Then tap Next map. | 0.53 | 0.63 | +0.10 |
| 26 | Clue: any number | 0.37 | 0.85 | +0.48 |

(# is the line's position in the list; pair 29's old text was the best old row, 0.72, and the new "both found" lost 0.25.)

## The five sw.v39 rows

| Key | Text | P yes (b) |
|---|---|---|
| sw.v39.night-result.1 | Chai Champions won the night, 3–2 | 0.87 |
| sw.v39.night-result.2 | A draw tonight, 2–2 | 0.83 |
| sw.v39.pause-home.1 | ← Home (keep this game) | 0.79 |
| sw.v39.turn-line-picker.1 | Chai Champions guessing · Sunita taps Reveal | 0.40 |
| sw.v39.next-map-toast.1 | Next map. Tap Show map when you're ready. It should start with: Kite · Tiffin · Rain. | 0.42 |

Two of the five are below 0.5: turn-line-picker (0.40) and next-map-toast (0.42; it still says "start with", unlike the reworded "first words should be" lines).

## Decisions used

252 decisions (63 rows, 4 questions each). Product count this week (2026-W43): 20,787 before, 21,039 after, of 30,000. Shared: 22,590 → 22,842 of 50,000. Not stopped early; nothing skipped.

## Tool faults

None; every call answered first time. Jev's answers are one sample each (no repeats). Most texts sit at 0.3 to 0.5 on (b), including the ones that changed little, so differences under about 0.1 are within noise.
