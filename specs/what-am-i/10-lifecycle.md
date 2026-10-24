# What Am I?: 10 Lifecycle (saved data C3)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-090 Where-line
Status: approved · Phase: What Am I? 1
The where-line (Canonical strings) shows under "Welcome back." after a reload or a return from hidden, on the Paused cover, and
on Home's unfinished row (line 1 there uses "What Am I? · Round 2 · Arjun's turn").

**Version 1.1** (wins over the text above):
1.1 item 40: Where-line on T4 unsaved: "Round 2 · Riya's turn, not saved yet". After G1, Home's line 1: "What Am I? · Game over, game 1".
    Line 2: the first two current players in turn order, "+n" for the other current players (leavers not counted), and the
    time of tonight's first `start` in the phone's local time, "8:05 pm" (h:mm, lower-case am/pm). G2 has no where-line (tonight
    has ended).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 15: **Home row for a paused turn** (distracted host): line 1 uses the where-line: "What Am I? · Round 2 · Arjun guessing, 34 s
    left"; tapping it opens the Paused cover, where "Carry on playing" counts 3, 2, 1 and shows a new word with that time.

### WAI-091 Resume
Status: approved · Phase: What Am I? 1
Every move is saved as it happens. Reopening the app (or tapping the Home row) returns to the same screen: T1, T4 (lists and ↺
kept), R1 or G1; a turn in T2/T3 returns on the Paused cover with its time left. A game night left unfinished ends by itself 12
hours after its last move, as IMP-104 (unsaved turn dropped).

**Version 1.1** (wins over the text above):
1.1 item 40: Where-line on T4 unsaved: "Round 2 · Riya's turn, not saved yet". After G1, Home's line 1: "What Am I? · Game over, game 1".
    Line 2: the first two current players in turn order, "+n" for the other current players (leavers not counted), and the
    time of tonight's first `start` in the phone's local time, "8:05 pm" (h:mm, lower-case am/pm). G2 has no where-line (tonight
    has ended).
1.1 item 44: Ending by itself: a game night left unfinished is ended 12 hours after its last move when the app is next opened
    (`endEvening` at the opening time); an unsaved turn is dropped; it then shows in History, not on Home.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 15: **Home row for a paused turn** (distracted host): line 1 uses the where-line: "What Am I? · Round 2 · Arjun guessing, 34 s
    left"; tapping it opens the Paused cover, where "Carry on playing" counts 3, 2, 1 and shows a new word with that time.

### WAI-092 History
Status: approved · Phase: What Am I? 1
The game night is listed in History as "What Am I? · 2 games" with its players; "Play again" there opens S1 with its players and
S2 with its last choices. Saved data carries a format version and each shown word's id (B9), so a later edition never changes
what an old game shows.

**Version 1.1** (wins over the text above):
1.1 item 39: "··· Menu" button, accessible name "Menu". Items by screen (others hidden): T1 and R1: all nine; T4: How to play, Words and
    time, Pause, Home (game saved), End the game, End for tonight, Settings, with Players greyed ("After this turn"); T2, T3: no
    menu; G1: How to play, End for tonight, Settings, History.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 16: **Settings and History in a game:** menu "Settings" opens the app's Settings sheet; "Done" returns to the same screen,
    unchanged. Menu "History" opens History; its "← Back" returns to the same screen. G2's menu "Delete tonight's games" works as
    Impostor's (IMP-105's delete, with its confirm).

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 3: **Who's ahead, during play** (10-year-old, uncle): T4 gains the small line under the h1 "Riya: 9 in all · Top: Arjun 14"
   (after this turn's count, before saving; when Riya is top: "Riya: 14 in all · Top so far"; a shared top: "Top: Arjun and Meena
   12"). The menu gains "Scores" (after "Players"), opening a sheet with R1's scoreboard and "Done".
