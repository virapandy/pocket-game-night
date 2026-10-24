# What Am I?: 04 End of a turn and scores (C3)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-030 Time's up screen
Status: approved · Phase: What Am I? 1
T4, portrait layout. h1 "Time's up! Riya got 5" (the Got it count). h2 "Got it" then its words as buttons in the order shown;
h2 "Passed" then its words (time-up word last). Empty list: "None". Small line "Marked wrong? Tap a word to move it."; small line
"Next: Arjun" (the next player in the order; after the round's last player "Next: round over"); quiet "← Home (game saved)";
Pause; "··· Menu"; main "Save score". Fits without scrolling at 390 × 844 for up to 20 words; more words scroll the lists only.
Tapping a word records `fix` and moves it to the other list's end with "↺" after it ("Owl ↺"; moving it back removes the ↺); the
h1's count updates.

**Version 1.1** (wins over the text above):
1.1 item 24: WAI-030: words are chips 44 px tall, 8 px gaps, wrapping; each list sits in one scroll container `turn-lists`, which takes
    the space between the h1 and the small lines; the h1, small lines and main button never scroll away.
1.1 item 46: Pause on T1 or T4: the cover without "End Riya's turn now". Each tap on a T4 word is one `fix` (no guard on word chips).

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 3: **Who's ahead, during play** (10-year-old, uncle): T4 gains the small line under the h1 "Riya: 9 in all · Top: Arjun 14"
   (after this turn's count, before saving; when Riya is top: "Riya: 14 in all · Top so far"; a shared top: "Top: Arjun and Meena
   12"). The menu gains "Scores" (after "Players"), opening a sheet with R1's scoreboard and "Done".

### WAI-031 Save score, and Undo
Status: approved · Phase: What Am I? 1
"Save score" records `scoreTurn`: the player's score grows by the Got it count, turns played by 1, and T1 opens for the next
player (or R1 after the round's last player). The undo toast "Riya: 5 saved · Undo" stays until the next "I'm Riya: start" /
"Start Riya's turn" or "Round 2" tap, or until another toast replaces it. Undo records `undoScore`, takes the turn's points and
turn count back, and reopens T4 exactly as before Save (lists and ↺ marks kept). After the toast has gone, the turn is locked.

**Version 1.1** (wins over the text above):
1.1 item 26: "Riya: 5 saved · Undo" is hidden while a dialog or the Paused cover is open and shows again after; it goes (turn locked) on
    the next start tap, on "Round 2", on any other recorded move (reorder, addPlayer, leave, setHold, setChoices), on Home, or on a
    reload. A tap ignored by a guard does not remove it. Undo from R1 (after the round's last save) returns to that T4.

### WAI-032 Scores
Status: approved · Phase: What Am I? 1
Scoreboards list players highest score first; ties in the order of the turn order. Each row "Arjun 7 (1 turn)"; players who left
"Kabir 3 (1 turn) (left)" at the end. Example K2 of `screen-map.md`: after round 1, Arjun 7, Dev 6, Riya 5, Meena 5, Zoya 4,
Kabir 3; after round 2, Arjun 14, Meena 13, Dev 11, Riya 9, Kabir 7, Zoya 7.

**Version 1.1** (wins over the text above):
1.1 item 30: Players and leaving are greyed during T2–T4 with the small line "After this turn" (T4 included: a guesser can't leave before
    saving). Several leavers are listed at the end of scoreboards in the order they left.
1.1 item 38: Per turn in example K2: round 1 Riya 5, Arjun 7, Meena 5, Kabir 3, Zoya 4, Dev 6; round 2 Riya 4, Arjun 7, Meena 8, Kabir 4,
    Zoya 3, Dev 5.

### WAI-033 Round over
Status: approved · Phase: What Am I? 1
After the last player's "Save score": R1 (Canonical strings). "Words nobody got: Penguin, Zebra" lists this round's passed words
(after fixes) in order shown, at most 5, then "and 3 more"; none: the line is left out. "Round 2" (the next round's number) →
T1 for the first player in the turn order. "Change players or words" → Who's playing? with "← Back to the game", then Words and
time with main "Carry on playing" (records `setChoices` / `setPlayers`; scores kept) → T1 for the next round's first player.

**Version 1.1** (wins over the text above):
1.1 item 33: Mid-game "Change players or words" (from R1 or G1): S1's ✕ opens WAI-042's dialog (`leave`); new names go to the end
    (`addPlayer`); drag records `reorder`; the quiet button "← Back to the game" returns to R1 or G1 with nothing recorded.
1.1 item 34: Overflow: "Words nobody got: Penguin, Zebra, Kangaroo, Owl, Duck and 3 more" ("and 1 more"); no comma before "and".

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 2: **A round is not the game** (guest): R1's h1 reads "Round 1 done. Round 2 next." (k and k + 1).
