# Secret Words: player walk of the screens (4 October 2026)

Product owner. First run of the **player helper** (`docs/proposals/player-agent.md`, run through general helpers until it is
installed). Six personas each played a whole evening **from the screen text only** (a "screens only" pack of every screen's
words and buttons, no rules or specs): Priya (first-time host, 6 people), Lakshmi Paati (72, Tirunelveli, slow English reader),
Aarav (10), Sameer (distracted host, 10 people at Diwali), Rajesh Mama (competitive uncle who knows Codenames), Neha (guest on
an iPhone, clue giver on a shared map phone). Design stage: nothing is built yet, so every fix here is cheap.

## What players loved
The secret coloured map ("like a spy"), "Our words", the funny team names (Aarav re-rolled them 8 times), the Landmine ending the
game in one tap ("everyone screamed"), Read this aloud ("the best screen"), the tally, and two phones ("clearly more fun").

## Findings, ranked (who hit it)
| # | Severity | What happened (players' words) | Who | Proposed fix |
|---|---|---|---|---|
| W1 | Stuck | "Check 78 / 8A": nobody knew what to compare or what to do on a mismatch | 5 of 6 | Replace the check code with **words**: the host shows "The map phone should start with: Cricket · Bat · Monsoon"; the map phone shows its first 3 words the same way |
| W2 | Stuck | Game over: no way Home without ending the evening; no way to switch to two phones ("Change teams" doesn't say so) | Priya | Game over gets quiet "Change players, phones or board" and "Home" (the evening stays to resume, as Impostor I25) |
| W3 | Stuck | A clue giver leaves mid-game: nobody is told who gives clues now | Sameer, Priya | Removing a clue giver asks "Who gives clues for Coffee Commandos now?" with the team's names |
| W4 | Stuck | Clue givers rotate after Play again: whose phone is the map phone now? | Neha, Priya, Sameer | Game over shows "Next clue givers: Meena and Kabir"; the scan screen says "Hand the map phone to Meena and Kabir, then tap Next map on it" |
| W5 | Confused | The map phone says "Orange team", the host says "Chai Champions": "which team am I?" | Neha, Lakshmi | The QR also carries the team names, so a scanned map phone shows "Chai Champions ● orange · Coffee Commandos ◆ teal" (a typed code still shows colours) |
| W6 | Confused | "∞" and "0" mean nothing; "CRICKET · 2 · 3 guesses left" started an argument ("2 or 3?") | all 6 | Under the keys: "2 means up to 3 guesses. 0 or ∞: as many as you like."; the board shows "CRICKET · 2" big and "3 guesses left (2 + 1 extra)" small; ∞ key also reads "Many" |
| W7 | Confused | Setup asks four things before anyone knows the game; "Deal the words" greyed with no reason | Priya, Sameer, Aarav | Under the greyed main: "Pick how many phones to start."; "Deal the words" becomes "Start the game"; "+ Grown-ups" becomes "+ Harder words" |
| W8 | Confused | "Clue broke a rule?": which rules? Feels like an accusation (Paati); the house argues about part-words, acronyms, Hindi | Rajesh, Aarav, Lakshmi, Priya | Rename "Clue not allowed?"; the dialog lists the 4 clue rules in one line each; How to play gets a "Clue rules" box; **owner question Q2** on other languages |
| W9 | Confused | "nobody's", "Guesses only", "Hurry up: 90 s", "↻ Turn", "Avoid: Shadow", "Discard this evening", "map code" | most | Plainer words: "blank word"; "Doesn't give clues"; "Start 90-second timer"; "Flip board"; "Landmine word: Shadow"; "Delete tonight's games"; "secret map" |
| W10 | Annoyed | Reveal tapped before the team agreed; can't take it back | Aarav, Rajesh, Sameer, Priya | **Owner question Q3** (convention: a touched card is final) |
| W11 | Annoyed | A fast double tap skipped the result straight to the next team (the main button stays in the same spot) | Aarav | After a reveal that ends the turn, "Other team's turn" ignores taps for 1.5 s |
| W12 | Annoyed | Map phone: fading found words by hand; two people forget; can't tell how to undo a fade | Rajesh, Neha, Sameer, Priya | Line: "Optional: tap a word once it's found to fade it; tap again to undo. The board in the middle is always right." (Auto-fade needs connected play, SWD-206) |
| W13 | Annoyed | Someone glimpsed the map: the fix hides as "Deal a new board" | Sameer | Menu item reads "New board (someone saw the map)" |
| W14 | Annoyed | Latecomers put on a team silently | Sameer | Players sheet: "Add to Chai Champions" / "Add to Coffee Commandos"; toast "Neha joined Chai Champions" |
| W15 | Annoyed | People more than about 1 m away can't read 25 words on a flat phone | Sameer, Lakshmi | With 9+ players, Choices adds "Big group? The Easy board is easier to read." Board on the TV and "board on your phone" stay later (SWD-203, 205) |
| W16 | Annoyed | "Clue rules say: pick another word" feels like a scolding | Lakshmi | "Heads up: Cricket is on the board." |
| W17 | Annoyed | Map phone never says the game is over; "what do I do now?" | Neha | Map phone always shows "Game over? Tap Done with this game, or Next map for the next one." |
| W18 | Confused | The Join screen's ticket scanner: does it read the map QR too? | Neha | The app's own scanner on Join accepts map QRs as well ("Scan a ticket or secret map") |
| W19 | Bored | One phone: about 5 taps per turn while everyone waits; the teens picked up their own phones | Priya, Sameer | Already known (`play-modes.md`); two phones recommended. No change |
| W20 | — | Wants: a season scoreboard across weeks; "Keep clue givers" on Play again; fix a misspelled name | Rajesh, Priya | Later list |

## Questions for the owner (rule decisions)
| # | Question | Options | Recommendation |
|---|---|---|---|
| Q1 | The Landmine with **Whole family** words: a kid tapped it, the game ended, "cue tears" (Sameer) | Keep the default "Lose the game" · default "Lose your turn" when Whole family is chosen | Default "Lose your turn" with Whole family, "Lose the game" with + Harder words; the host can still change it |
| Q2 | Clues in Hindi, Tamil or another shared language | Only English and Indian-English words (the convention: chai, dosa) · a house setting "Clues in other languages: allowed / not allowed" | Convention only, stated plainly in the Clue rules box (keeps it fair for mixed-language groups) |
| Q3 | Taking back a Reveal | Keep pick, then "Reveal KITE" (a touched card is final) · add "Hold to reveal" (1 s) so a quick tap can't do it · a 3-second "Undo" after the reveal | Keep pick-then-Reveal, and the 1.5 s guard of W11; no undo (seeing the colour then undoing would be cheating) |
