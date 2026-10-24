# What Am I?: 07 Game over and tonight (saved data C3)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-060 End the game
Status: approved · Phase: What Am I? 1
"End the game" (R1, the menu, the leave dialog) opens "End the game?". "End the game" records `endGame` and opens G1 with the toast
"Game ended · Undo"; Undo removes `endGame` and returns to the screen it came from. A turn in progress (T2–T4 unsaved) is dropped:
its marks don't count.

**Version 1.1** (wins over the text above):
1.1 item 27: `endGame` during an unsaved turn records only `endGame`; the turn's moves stay in the log but don't count. Undo removes
    `endGame` and returns to the Paused cover (from T2/T3, turn intact, time left) or to T4 (unsaved).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 5: **Ending with an unfinished round** (critic 4, uncle): when End the game is opened mid-round, its body is "Round 2 isn't done:
   Zoya and Dev haven't played. Shows this game's winner." (names of current players still to play, joined with ", " and " and ";
   more than 3: "4 players haven't played."). Main stays "Keep playing".

### WAI-061 Game over
Status: approved · Phase: What Am I? 1
G1 (Canonical strings). The winner is the highest score among players who haven't left (R4); ties share the win. "Best turn"
names the single turn with most Got it (ties: the earliest). "Words nobody got" lists this game's passed words, at most 5 then
"and 3 more". "Tonight: Arjun 1 win" counts won games tonight per player ("Arjun 1 win · Meena 1 win"; a shared win counts for
each). A game with no saved turn shows h1 "Game ended. No turns played." and no winner.

**Version 1.1** (wins over the text above):
1.1 item 34: Overflow: "Words nobody got: Penguin, Zebra, Kangaroo, Owl, Duck and 3 more" ("and 1 more"); no comma before "and".
1.1 item 35: "Best turn: Meena, 8 words" / "…, 1 word". A game whose saved turns all scored 0: h1 "Nobody got a word this game!", no
    winner, the tally unchanged.
1.1 item 36: G1 tally "Tonight: Arjun 2 wins · Meena 1 win" (most first, ties in turn order; no won game yet: line left out). G2 "Wins:
    Arjun 2 · Meena 1"; none: "No wins yet". "6 players" in G2 counts everyone who saved a turn tonight, leavers included;
    "1 word got" / "148 words got".
1.1 item 37: **Worked example:** Arjun 12 (left), Meena 12, Dev 12 → h1 "Meena and Dev share the win with 12!" (Arjun is not a winner,
    R4).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 6: **A visible record** (uncle): G1 gains the small line "Moved after time's up: 3 words · Turns ended early: 1" (each part only
   when not 0; the whole line left out when both are 0).

### WAI-062 Play again
Status: approved · Phase: What Am I? 1
"Play again" records `start` (gameIndex + 1) with the same players (leavers removed), order, pack, time and hold (per-player
overrides cleared), scores 0, and opens T1 for the first player. "Change players or words" → S1 → S2 → "Start with these words"
(no read-aloud).

### WAI-063 End for tonight
Status: approved · Phase: What Am I? 1
"End for tonight" (G1 or menu) opens its dialog; confirming records `endGame` if a game is open, then `endEvening`, and opens G2.

### WAI-064 Tonight's summary
Status: approved · Phase: What Am I? 1
G2 (Canonical strings): players who took part tonight, games ended with at least one saved turn, total Got it tonight; wins per
player (most first); "Best guesser tonight" = most Got it over tonight (ties: "Meena and Dev (31 words)"). "Oops, keep playing"
removes `endEvening` (and the `endGame` it added) and returns where the host came from. "← Home" / "Play something else" → Home /
the picker, tonight's names kept (IMP-102). Menu: only "Delete tonight's games" (as IMP).

**Version 1.1** (wins over the text above):
1.1 item 36: G1 tally "Tonight: Arjun 2 wins · Meena 1 win" (most first, ties in turn order; no won game yet: line left out). G2 "Wins:
    Arjun 2 · Meena 1"; none: "No wins yet". "6 players" in G2 counts everyone who saved a turn tonight, leavers included;
    "1 word got" / "148 words got".

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 16: **Settings and History in a game:** menu "Settings" opens the app's Settings sheet; "Done" returns to the same screen,
    unchanged. Menu "History" opens History; its "← Back" returns to the same screen. G2's menu "Delete tonight's games" works as
    Impostor's (IMP-105's delete, with its confirm).
