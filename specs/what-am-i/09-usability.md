# What Am I?: 09 Usability (C1/C2)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-080 Sizes and text
Status: approved · Phase: What Am I? 1
Every screen works at every size with Larger text off and on: nothing cut off, no horizontal scrolling, the main button fixed
(Impostor's landscape main button rule except on T3, which has no main button). The longest real values: 16-character player
names, 22-character words, 20 players.

**Version 1.1** (wins over the text above):
1.1 item 25: Landscape main button: at 812 × 375 Impostor's rule (358 × 60, bottom right, 16 px in); at 568 × 320, 240 × 52, bottom right,
    12 px in. T3 has none.

**Version 1.3** (wins over the text above, and over Versions 1.1 and 1.2):
1.3 item 5: **Nothing under the main button** (four walks): every scrolling screen ends with bottom padding equal to the main button's
   height plus 16 px (plus any toast's height while one shows), so the last line, "← Back", "How to play" and "← Home (game saved)"
   can always be scrolled clear of it. Toasts sit above the main button and never cover a quiet button that is the only way to a
   screen: while a toast shows, that button is scrolled into view above it.
1.3 item 6: **D2's add row at 320 px** (10-year-old: "Add" cut off): the input shrinks; "Add" keeps at least 72 × 48 px.

### WAI-081 Accessibility
Status: approved · Phase: What Am I? 1
Each mark is announced in an `aria-live="assertive"` region ("Got it", "Pass"); time left announced at 10 s ("10 seconds left");
T3's word is in an `h1`. Every icon button has a word or accessible name. Contrast 4.5:1 for all text; the flashes 3:1 against
the word.

**Version 1.1** (wins over the text above):
1.1 item 47: WAI-081: live region `data-testid="mark-live"`; flash text 4.5:1 against the flash colour.

### WAI-082 Words on screen never used
Status: approved · Phase: What Am I? 1
No What Am I? screen shows "tilt", "nod", "session", "evening", "card" or "clue" as a noun for the word (the hands-free line's
"clue giver" is allowed). Checked by text search on every screen state.

**Version 1.1** (wins over the text above):
1.1 item 48: WAI-082, exact: no screen text contains, as a whole word, case-insensitive, "tilt", "tilting", "nod", "session", "evening"
    or "card"; "clue" appears only in "Give clues", "gives clues", "Clue givers", "clue giver".
