# What Am I?: answers for the build, ready in advance (product owner, 25 October 2026)

For the tester writing `specs/what-am-i/` and tests, and for the coder lanes after them. Binding text is still
`scenarios.md` version 1.3 (with its Version 1.1, 1.2 and 1.3 sections); these items only **clarify** it where a reader is
likely to stop. Each item: scenario, question, answer, source. Wording, screen detail and ambiguity are the product owner's
call while the owner is away (handover, 25 October); anything that would change a rule is in **"For the owner"** at the end,
and is built as approved until the owner answers.

**Open test questions (docs/test-questions.md, pulled 25 October):** none for What Am I? on `main` or on any pushed lane
branch. New ones go there as usual; the product owner answers them the same way.

Precedence reminder: Version 1.3 > 1.2 > 1.1 > the scenario's own text > the Canonical strings table > `screen-map.md`.
Several Canonical strings rows predate the Version sections; items 1–4 list every such row.

## A. Strings the Canonical table still shows in their old form

1. **WAI-020, T3 top line.** Q: "Give clues. Don't say the word!" or the 1.3 line? A: hand hold **"Everyone else: give clues.
   Don't say the word!"**; hands-free unchanged "Clue givers: tap bottom for Got it, top for Pass." Source: 1.3 item 1.
2. **WAI-033 R1 h1, WAI-012 score line, WAI-040 Paused body, WAI-043 dialog.** A, final text: R1 h1 **"Round 1 done. Round 2
   next."** (1.3 item 2); score line **"Round 1 · player 1 of 6"** (1.2 item 3); Paused body **"The clock is stopped and the word
   is hidden. Tap Carry on playing when you're ready."** (1.3 item 8); end-turn dialog h1 **"End Riya's turn now?"**, body
   **"Riya's turn ends now. Words marked so far still count."**, buttons "End Riya's turn now" / main "Carry on playing"; T4 after
   it **"Turn ended early. Riya got 2"** (1.2 item 2 wins over 1.1 item 15's "Turn skipped"). The move is still `skip`.
3. **WAI-011 tip lines.** Q: the table lists "Turn your ringer on…", "Turn off rotation lock." A: both replaced. Sound tip
   **"Turn the sound up so the guesser hears each word count."** (both platforms; "ringer" never appears); rotation tip iPhone
   **"Screen not turning? Turn off rotation lock."**, Android **"Screen not turning? Turn on Auto-rotate."** Source: 1.2 items 9, 11.
4. **WAI-012, T1 quiet buttons.** Q: the table still lists "Players (6) ›" on T1. A: withdrawn; T1 has no Players button
   (R1 and the menu keep it). Source: 1.1 item 50.

## B. Words and the queue (C3)

5. **WAI-010, R3 (1.1 item 2): Swimming's id.** Q: item 2 says the kept Swimming is "WAIW-181 in Sports and cricket", but in
   `words.csv` WAIW-181 is "Six". A: the **rule** wins: keep the copy with the lowest id, which is **WAIW-170 Swimming, Sports and
   cricket** (the other is WAIW-251, Act it out). Bat: WAIW-040 Animals (other WAIW-191), as written. Source: words.csv;
   1.1 item 2's rule.
6. **WAI-003 counts.** Q: do the quoted counts match the file? A: yes, checked against `words.csv` (726 rows, all edition 1,
   none retired): Animals 92, Food 88 (98 with non-veg), Around the house 100, Jobs 94, Sports and cricket 87, Festivals and
   places 91, Act it out 100, Famous Indians 64; Mix of all 714 (724). Longest word 22 characters ("Eating something spicy").
   Words with non-letters: "Chicken 65", "Children's Day", "Teachers' Day", "Mother's Day" (apostrophes U+0027).
7. **WAI-010, "shown tonight" for a word in two packs.** Q: Bat shown from Mix (WAIW-040) in game 1; game 2 uses Sports and
   cricket, where Bat is WAIW-191. Is it shown? A: **yes. "Shown" is tracked by word text** (exact text as in the list), so a
   word shown under either id counts for both; the fallback's "minus every word shown tonight and minus the pack's words" is
   by text too. The saved id stays the copy actually shown. Source: R3; the csv's note "also in another pack: never twice in
   one evening"; guide rule 10.
8. **WAI-010, the word seed.** Q: when is `seeds.words` made? A: fresh with `crypto.getRandomValues` at tonight's first
   `start`, saved with the game night; later games and Play again make no new seed (gameIndex changes instead). Test hooks
   set it in development and preview builds only. Source: as Impostor's seeds (IMP scenarios, "Then each evening's setup has
   seeds…"), IMP-064.
9. **WAI-044, a changed pack or non-veg switch mid-game.** Q: is the new queue built from scratch? A: yes: WAI-010 at that
   moment with the same gameIndex and the same seed string; words shown tonight go to the end as usual. The non-veg switch
   changes the eligible words, so it rebuilds the queue the same way.
10. **WAI-011 tip order, final.** Q: Versions 1.1 and 1.2 each move tips. A: at most one line, the first that applies:
    (1) "Joining this round: Om"; (2) "Keep your screen on during the turn." (next T1 after any refused wake lock, once per
    game); (3) "Only 8 new Animals words left. After that, words come from Mix of all." (chosen pack, not Mix, 1–14 unshown);
    (4) "Animals words used up. Words now come from Mix of all." (on every T1 while the fallback supplies words); (5) "All words
    used tonight. Words from earlier games come back, oldest first."; (6) on the first T1 of each game only: the sound tip
    (Sounds on), else the rotation tip (rotation-lock event in an earlier game on this phone). Note: with Sounds on, the sound
    tip comes first, so the rotation tip shows only with Sounds off; this is the approved order, kept. Source: WAI-011,
    1.1 items 7, 17; 1.2 items 9–11.
11. **WAI-011 tip 3 count.** Q: "Only 8 new … left" counts what? A: unshown eligible words of the chosen pack still in the
    queue (not fallback words); "Only 1 new Animals word left. …" at 1.

## C. Marking, sounds and the turn (C3 for marking)

12. **WAI-H8, sound and vibration names.** Q: the log needs names; none are given. A: sounds `countdown` (the 3-2-1 beep),
    `got`, `pass`, `tick`, `timeUp`; vibration patterns as arrays `[40]` (Got it), `[40, 60, 40]` (Pass), `[400]` (time up).
    If the tester's pushed tests already name them differently, the tests win. Source: product owner, from WAI-022.
13. **WAI-021, marks during a flash.** Q: is a motion mark during the 600 ms flash ignored like a second tap? A: yes, every
    mark (tap or motion) during a flash is ignored and records nothing; an event with |θ − θ₀| < 15 during the flash still
    re-arms motion. The 800 ms guard counts from the end of the flash (the new word). Source: WAI-021; 1.1 items 10–12.
14. **WAI-081, "10 seconds left".** Q: which live region? A: the same assertive `mark-live` region, once, at T − 10000.
15. **WAI-090 / 1.2 item 15, "34 s left".** Q: format for more than 59 s? A: always whole seconds, rounded up: "75 s left"
    (never m:ss). Paused during T2: the full turn time ("60 s left").
16. **WAI-040, Paused cover on T1 or T4.** Q: the 1.3 body says "The clock is stopped and the word is hidden", but on T1/T4
    there is no clock running and no word. A: on T1 and T4 the body is only **"Tap Carry on playing when you're ready."**; the
    full 1.3 body on T2/T3 (and the Home-row resume of a paused turn). No "End Riya's turn now" on T1/T4 (1.1 item 46).
17. **Phone Back on screens not covered.** Q: 1.2 item 17 covers S1–S4, G1, G2, dialogs; WAI-040 covers T1–T4. What about R1,
    T0, S3? A: **R1** → the Paused cover (as T1/T4; never leaves the game); **T0** → back to T1, nothing recorded; **S3** → S2
    (as its "← Back").
18. **WAI-025, wake lock.** Q: the map says awake "from T2 to T4"; WAI-023 releases it after T4 shows. A: the scenario wins:
    released once T4 shows.
19. **WAI-005, Read this aloud at 568 × 320.** Q: with the Do Not Disturb sentence (1.2 item 12) the card may not fit without
    scrolling at 568 × 320. A: at that size only, the card text may go down to 15 px; if it still does not fit, the card scrolls
    inside its own box and the main button stays fixed (1.3 item 5 padding applies). Other sizes as written.

## D. People, turns and scores

20. **WAI-042 / 1.1 item 29 + 1.2 item 7, the two-players dialog, final.** A: h1 **"2 players needed."**, body **"Add someone,
    or end the game."**, quiet "End the game" (→ WAI-060), quiet "Don't remove Kabir" (→ D2), main **"Add a player"** (focuses
    the add row). Shown when ✕ is tapped and the game has exactly 2 current players.
21. **WAI-015, "Someone else goes first".** Q: is Riya offered? A: no: the names are the other players still to play this
    round; "Keep Riya first" keeps her (1.1 item 28).
22. **WAI-041, dragging on Riya's T1.** Q: the host drags Meena above Riya. A: T1 always shows the first player still to
    play in the turn order, so it switches to Meena (records `reorder`), as "Someone else goes first" does.
23. **WAI-042, Undo after "Kabir left".** Q: where does Kabir come back? A: to his old place in the turn order; if it was his
    T1, T1 returns to him.
24. **1.1 item 32, a leaver who rejoins.** Q: he had already played this round before leaving; does he guess again this round?
    A: no: he goes to the end of the order and next guesses in the next round (nobody guesses twice before everyone has once).
    If he had not played this round, he plays this round ("Joining this round: Kabir"). Source: guide rule 11; WAI-041.
25. **1.3 item 3, the T4 totals line.** Q: what counts? A: "Riya: 9 in all" = Riya's saved score in this game plus this turn's
    current Got it count (it updates with each fix). "Top" compares that with other **current** players' saved scores (leavers
    are left out, as R4). Riya alone at the top or tied at the top: "Riya: 14 in all · Top so far". Others above her and tied:
    "Top: Arjun and Meena 12" (turn order; three or more "Arjun, Meena and Dev 12"). Same line on a T4 after "End Riya's turn now".
26. **1.3 item 3, menu "Scores".** Q: on which screens, and what does the sheet show? A: in the menu on **T1, T4 and R1** (after
    "Players"); not on G1 (it has its own scoreboard). Sheet h1 "Scores", R1's scoreboard of saved scores (WAI-032 rows,
    leavers at the end), main "Done" → the same screen. Before any saved turn: every current player "Riya 0 (0 turns)".
    So item 39's "all nine" on T1 and R1 becomes all ten.
27. **1.2 item 5, End the game mid-round.** Q: when is it "mid-round", and the one-name grammar? A: when at least one player
    has saved a turn in the current round and at least one current player has not (a turn in progress counts as not played).
    One name: "Round 2 isn't done: Dev hasn't played. Shows this game's winner."; two or three: "… Zoya and Dev haven't
    played. …"; four or more: "4 players haven't played." Otherwise the usual body.
28. **WAI-044, the hold changed in the sheet mid-game.** A: applies from the next turn to players without their own choice;
    a player's own choice (WAI-014) stays until the game ends.
29. **WAI-014, hand hold chosen by one player in a hands-free game.** Q: is there a "(Riya's choice)" line in the hand layout?
    A: no extra line (only the hands-free one is written); "Hands-free for Riya" switches back.

## E. Results and tonight

30. **WAI-033 / WAI-061, "Words nobody got" with a repeated word.** A: each word text once, in the order first shown.
    Word chips and lists show the word as in the list (not capitals; capitals are T3 only, by CSS).
31. **WAI-061, Best turn.** Q: do leavers' turns count; what if the best is 0? A: a leaver's saved turn counts (the line is a
    fun fact, not a win; name without "(left)"). Best 0: the line is left out.
32. **WAI-064, G2 lines with zero.** A: "Best guesser tonight" left out when the best is 0; three or more tied: "Meena, Dev
    and Om (31 words)"; "(1 word)". "0 words got" when nothing was got. "Wins:" line: "No wins yet" (1.1 item 36).
33. **WAI-091, ending by itself after 12 hours.** Q: is `endGame` recorded too? A: yes, as WAI-063: `endGame` (if a game is
    open, unsaved turn dropped) then `endEvening`, both at the opening time. The night then shows in History only.
34. **WAI-064, G2 after a reload.** A: the game night has ended, so the app opens on Home (nothing unfinished); the night is in
    History. "Oops, keep playing" exists only on the G2 that was just opened.
35. **WAI-090, Home row line 1 in each state.** A: "What Am I? · " followed by: "Round 2 · Arjun's turn" (T1, R1, T4 saved);
    "Round 2 · Arjun guessing, 34 s left" (paused turn); "Round 2 · Riya's turn, not saved yet" (T4 unsaved); "Game over, game
    1" (G1). Line 2: first two current players, "+n", tonight's first `start` time, "Tap to resume".

## F. Words-on-screen check

36. **WAI-082 / 1.1 item 48 vs 1.3 item 7.** Q: How to play's new line "The room decides if a clue broke the rules." uses
    "clue" outside the allowed list. A: 1.3 wins: add **"a clue broke the rules"** to the allowed phrases. The list is
    case-insensitive, so "give clues" (1.3 item 1) is covered by "Give clues".
37. **WAI-082, words from the word list.** Q: "Shuffling cards" (WAIW-697) shows on T3/T4/R1/G1. A: the ban applies to the
    app's own text, not to word-list words; search screen text with `the-word` and word chips left out ("cards" is not the
    whole word "card" anyway).
38. **WAI-006, How to play lines, final order.** A: an `ol` of ten: 1–5 as 1.1 item 42; then "One point for each word you got.
    Passing costs nothing."; "The room decides if a clue broke the rules." (1.3 item 7, straight after line 5); then "Said the
    word, or the guesser peeked? Move that word to Passed when time's up." (1.2 item 13); then lines 6 and 7.
39. **WAI-003, S2 final order.** A: h1; "Time for each turn"; "How to hold the phone" (with its two options and the small line
    "You can change this for one player on their turn." under them); "Which words?"; the two switches; "Ready as it is, or
    change anything above."; main. Source: 1.3 item 4, 1.2 item 4.

## G. Shared screens and other games

40. **1.3 item 10, the picker's "← Home".** This is the shared picker: one lane owns it for every game (see the lane split).
    If Secret Words' lanes have already added it, nothing to do.
41. **1.3 item 11, invisible guards in tests.** A tap inside a guard must really land: use `click({ force: true })` or a
    dispatched click, as the Secret Words tests now do (test-questions, 23 October). No greyed look and no `aria-disabled` on a
    guarded main button.
42. **WAI-001, the Host-a-game line.** Until Mafia is released: "Tambola, Impostor, Secret Words or What Am I? on this phone".
    Mafia's tests assert its own longer line (Mafia 1.1 item 30). If Mafia's lanes merge into `main` before What Am I? is
    released, release What Am I? from a release branch (as Impostor's `release/1.3`) or keep Mafia's card out of the release
    build, so families never see an unfinished game.

## Suggested screen lanes (for the orchestrator)
Files used by two changes stay in one lane; C3 never split.
- **Lane W1, rules (C3, first, alone):** `src/games/what-am-i/` rules (queue, fallback, shown-by-text, scores, results,
  tonight, saved data, `queueFor`), the pure marking decision (θ₀, held, re-arm, guard, areas from W × H), the where-line and
  tip-line text as pure functions, and `content/what-am-i/` built from `words.csv`. Screen lanes start after it merges.
- **Lane W2, setup and the game's frame:** Home row and the Join line, picker card and the picker's "← Home" (the shared
  picker and Home: if Mafia's card and Host line are built in the same window, they go here too), S1–S4, Settings switch,
  History row, Start-new dialog; plus the frame other screens use: "··· Menu", the Paused cover (with its T2/T3 and T1/T4
  forms), Players and leave dialogs, End the game / End for tonight dialogs, the Scores and Words-and-time sheets.
- **Lane W3, the turn (marking is C3 in look and timing):** T1, T0, T2, T3 (motion, taps, rotation, wake lock, sounds and
  vibration, `mark-live`), T4 with fixes, Save and Undo, D7 "End Riya's turn now?".
- **Lane W4, between rounds and after:** R1, G1, G2, "Change players or words" mid-game, Play again.
Order: W1 → W2 → W3 and W4 in parallel (both use W2's frame). With only two coder slots free: W2 + W4 as one lane.

## For the owner
None. No question found that needs a rule decided: every item above is wording, screen detail or a reading of an approved
rule. (Items 24 and 25 lean on approved rules: guide rule 11, "nobody guesses twice before everyone has once", and R4, "a
leaver can't win". Tell the product owner if either reads wrong.)
