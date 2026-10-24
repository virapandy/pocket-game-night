# What Am I?: 06 Interruptions and people (C2)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-040 Pause
Status: approved · Phase: What Am I? 1
The Pause button, the menu item, the phone's Back gesture during T1–T4, and the app being hidden (`visibilitychange` to
hidden) all open the Paused cover (Canonical strings) and record `pause`. On T2/T3 the clock stops at once and the word is hidden
(the cover covers the whole screen; the word is not in the DOM). "Carry on playing" records `resume`: from T1 or T4, back to
that screen; from T2/T3, the countdown runs again (WAI-016, new θ₀) and T3 shows the **next** word in the queue with the time
left kept; the hidden word goes to the end of the queue unshown (R2). "← Home (game saved)" → Home; the game stays unfinished.

**Version 1.1** (wins over the text above):
1.1 item 5: **A hidden word** (pause or skip, R2) is put at the end of the unshown part, before the shown part.
1.1 item 46: Pause on T1 or T4: the cover without "End Riya's turn now". Each tap on a T4 word is one `fix` (no guard on word chips).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 2: **"End Riya's turn now"** replaces "Skip Riya's turn" everywhere (uncle, guest: "Pass" vs "Skip"). Its dialog: h1 "End Riya's
   turn now?", body "Riya's turn ends now. Words marked so far still count.", buttons "End Riya's turn now" / "Carry on playing"
   (main). It records `skip` (Version 1.1 item 15), and T4 then reads "Turn ended early. Riya got 2".
1.2 item 12: **Do Not Disturb** (critic 7): Read this aloud ends with the sentence "Tip: turn on Do Not Disturb so messages don't buzz."
    A notification banner or a system dialog over the page (battery saver, a permission prompt) does not pause the turn; only
    the page being hidden does (WAI-040).
1.2 item 17: **Phone Back on screens without a turn:** S1–S4 as their "← Back"; G1 and G2 as "← Home"; on any dialog it closes the dialog
    (as its quiet, non-destructive button).

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 8: **Paused says the clock stopped** (distracted host): the cover's body reads "The clock is stopped and the word is hidden.
   Tap Carry on playing when you're ready."

### WAI-041 Players during a game
Status: approved · Phase: What Am I? 1
Players (from "Players (6) ›" on R1, or the menu) lists the players in turn order with ✕ and drag handles, an add row,
and the top line "Add a name to join. New players go after the last player in this round." Adding Om mid-round records
`addPlayer` and puts Om at the end of the turn order; he takes a turn this round and T1 shows "Joining this round: Om" until
then. Dragging records `reorder` (only among players still to play this round; players who have played stay in place). Re-adding
the name of a player who left this game brings back their points and turns.

**Version 1.1** (wins over the text above):
1.1 item 30: Players and leaving are greyed during T2–T4 with the small line "After this turn" (T4 included: a guesser can't leave before
    saving). Several leavers are listed at the end of scoreboards in the order they left.
1.1 item 32: A leaver's exact name is accepted in the add row (no duplicate message) and rejoins at the end of the order with their points.

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 6: **D2's add row at 320 px** (10-year-old: "Add" cut off): the input shrinks; "Add" keeps at least 72 × 48 px.

### WAI-042 Someone leaves
Status: approved · Phase: What Am I? 1
✕ opens "Kabir has to leave?". "Kabir leaves" records `leave`: Kabir leaves the turn order, keeps his points (R4), the undo toast
"Kabir left · Undo" shows; if it was Kabir's T1, T1 opens for the next player. With 2 players, ✕ instead opens the dialog with
"2 players needed. Add someone, or end the game.", buttons "Add a player" (focuses the add row) and "End the game" (→ WAI-060).
Leaving is not offered during T2–T3 (the menu's Players item is greyed with the small line "After this turn").

**Version 1.1** (wins over the text above):
1.1 item 29: **2 players left:** when the game has exactly 2 current players, ✕ opens a dialog whose h1 is "2 players needed." with the body
    "Add someone, or end the game." and buttons "Add a player" (focuses the add row) and "End the game" (main) → WAI-060.
1.1 item 30: Players and leaving are greyed during T2–T4 with the small line "After this turn" (T4 included: a guesser can't leave before
    saving). Several leavers are listed at the end of scoreboards in the order they left.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 7: **Two players left** (critic 2): that dialog's buttons become "End the game", quiet "Don't remove Kabir" (→ D2), and main
   "Add a player" (focuses the add row).

### WAI-043 Skip a turn
Status: approved · Phase: What Am I? 1
"End Riya's turn now" on the Paused cover (during T2/T3 only) opens "End Riya's turn now?". "End Riya's turn now" records `skip` (the
hidden word goes back unshown, R2) and opens T4 with what was marked; "Carry on playing" → back to the cover.

**Version 1.1** (wins over the text above):
1.1 item 5: **A hidden word** (pause or skip, R2) is put at the end of the unshown part, before the shown part.
1.1 item 15: **Moves.** `timeUp { word?: id }`: the word on screen is passed; no `word` when a flash was running or the turn was in T2.
    New move **`skip`**: ends the turn from the Paused cover (WAI-043); the hidden word goes back unshown; T4 opens with h1 "Turn
    skipped. Riya got 2" and the marks so far. A skipped turn is saved by "Save score" like any other and counts as a turn played.
    The Turn term ends at "Save score" in every case.

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 2: **"End Riya's turn now"** replaces "Skip Riya's turn" everywhere (uncle, guest: "Pass" vs "Skip"). Its dialog: h1 "End Riya's
   turn now?", body "Riya's turn ends now. Words marked so far still count.", buttons "End Riya's turn now" / "Carry on playing"
   (main). It records `skip` (Version 1.1 item 15), and T4 then reads "Turn ended early. Riya got 2".

### WAI-044 Words and time mid-game
Status: approved · Phase: What Am I? 1
The menu's "Words and time" between turns (T1, T4 before saving, R1) opens S2's choices in a sheet with main "Done"; changes record
`setChoices` and apply from the next turn (a changed pack builds a new queue by WAI-010 with the same gameIndex). During T2–T3 the
item is greyed with "After this turn".
