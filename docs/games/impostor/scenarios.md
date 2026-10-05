# Impostor: scenarios (version 3.8, 4 October 2026)

Status: **IMP-001 to IMP-108 approved by the owner, 3 October 2026.** Version 2 (same day) makes every approved
scenario exact, from two independent readers (a coder-reader and a tester-reader, `docs/spec-rules.md` rule 12) and
the product owner's resolutions. IDs marked "(detail of IMP-xxx)" are new in version 2: they add no behaviour, they
only make approved behaviour exact. Version 2.2 adds the last engine-fit details (`config.testDeals`, when
`wordDidntWork` is legal, "Start new", the unfinished summary). Version 2.1 (same day) fits the existing engine (`SavedGame`, setup, views, move
records) after a second coder read and tester read; the one behaviour change is IMP-101 (owner informed).
IMP-200+ are approved as direction, built later.
**Version 3 (owner-approved change, 4 October 2026):** one result screen right after the reveal (a 1.5 s build-up,
then everything at once, the word always shown); the last guess becomes the optional "Last-chance guess" (off by
default); "How to play" opens only on request (choices screen and menu) and holds the rules; the deal shows
"Player 2 of 4" and "Everyone else, look away!". Changed IDs carry "Status: approved, owner, 2026-10-04 (changed)".
**Version 3.8 (same day):** fixes from the coder and tester reads: the move `dealAgainWithout`, every deal deals the
current players, pending leavers, the clues screen at 320 × 568 and 812 × 375, the no-words screen's buttons, and
the screen B gaps. Changed: IMP-001, 010, 020, 022, 052, 070, 074, 077, 078, 079.
**Version 3.7 (owner decision I26, 4 October; `docs/room-moments.md`, every **Must** row):** people joining and
leaving mid-round (M1, M4, M7), a visible "Players (5) ›" (M2), fast Enter (M3), "Home (game is saved)" (M11), names
on unfinished games (M12), "Not Riya? ← Back" (M17), no double taps (M18), a visible "See my word again" (M19),
Back keeps choices (M21), one equal "Start new?" (M22), tie instructions (M22a), "Tap instead" under the name
(M22b), "Done, back to …" (M22c), plain words without "crew" or "steal" (M24), "Clues done, start timer" (M25), no
dead buttons (M26). New: IMP-078, IMP-079. Changed: IMP-001, 003, 006, 010, 016, 017, 020, 023, 024, 031, 032, 033,
034, 035, 039, 044, 070, 074, 075, 076, 077, 080, 085, 092, 095, 097, 098.
- Retired in 3.7: "The crew wins!", "<Name> steals the round!", "… you steal the round.", "A caught impostor can steal
  the round by guessing the word.", "Meena was crew.", "Most fingers is revealed. Caught: the crew wins. Wrong person:
  the impostor wins.", "picked 3 times while crew", "Crew 4 · Impostors 3", "Clues done, start the 2-minute timer",
  "Impostor, 8:40 pm, round 4", "Impostor · round 4 · Tap to resume", "Keep at least 3 players.", "Change players
  after this round." / "OK", the "Start new?" main button, "Done, everyone's seen" in "See my word again".
**Version 3.6 (owner decision I25, 4 October; `ux.md` "Owner's play, 4 October: how do I stop?", guideline 47a):**
every between-rounds screen shows "Next round", an outlined "End game" and "← Home"; on screen, Impostor says only
"game" (never "evening", "night" or "session"); the end screen's main button is "Play again". New: IMP-077.
Changed: IMP-001, 040, 052, 075, 080, 085, 091, 092, 093, 095, 097, 098, 101, 102, 103, 106.
- Retired in 3.6: "End the evening" (menu item and dialog "End the evening?"), "Tonight: impostor caught 3 · escaped
  2", "Points every round, totals for the night.", "That's the night!", "… wins the night …", "… share the night …", "Discard this evening" and its dialog,
  "Start a new evening? The evening from 8:40 pm will be ended.", "Carry on that evening", "Impostor night ·",
  "You've played every word in these categories tonight!", the summary's main "Back to Home".
**Version 3.5 (same day):** final fixes from a tester read and a coder read; `words.csv` now has 311 rows (291
active, 20 retired).
**Version 3.4 (same day):** the "How to play" text (F7), the category switch colour, and the hold layer's exact
bounds (IMP-010, IMP-070, IMP-072, IMP-007).
**Version 3.3 (same day):** the UX designer's review of the first build, decided by the product owner (`ux.md`,
"Review of the first build", F1–F12; guidelines 45a and 46a): a room-sized result screen that scrolls as one page,
a deal screen whose controls never move, a full-width hold pad, "New word for everyone?", new clue wording, a
quieter picker for "It's a tie", a summary with a lead line and "More ›", and the setting "Last guess for a caught
impostor".
**Version 3.1 (same day):** fixes from a fresh coder read and tester read; dealt word ids are recorded in the moves
(IMP-096), and old choices read safely (IMP-009, IMP-096).
After approval the tester copies these into `specs/impostor/` (file names in each section heading) and writes tests.
**Hand-over only after the Tambola release** (`docs/roadmap.md`). Template: `specs/README.md`.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**

Phases: **Impostor 1** = the first release (one phone, the Multicultural list in `words.csv`). **Impostor later** =
designed now, built later.

Change classes (`docs/change-sop.md`): rules, secrets and seeds, saved evenings and the word list format = **C3**
(tests first; sections 05, 06, 07 and IMP-096); screens = C1/C2.

### What version 3.3 rewords or retires (rule 11)
- Retired in 3.3: "Caught! <NAME> was the impostor.", "<NAME> was the impostor and escaped!", "Still a tie! <NAME> was
  the impostor and escaped!", "The word was School trip." as one line, `reveal-line`, "then clockwise: …", the clues
  main buttons "Talk it over" and "Start the 2-minute timer", "Another round of clues", the switch "Last-chance
  guess" and its line, "Scores from round 4", `summary-line` "7 rounds · impostor caught 4 · escaped 3", fun line
  "Rounds played: 7", the summary's separate "Share", "History" and "Discard this evening" buttons, inner scroll
  areas on the result screen, the scoreboard's "6 rows per column" rule, hold-pad sizes 200 × 160 / 200 × 120,
  `deal-progress` at 15 px top left, "Everyone else, look away!" at 17 px, `private-word` "fits in 3 lines".
- New strings in 3.3: "✓ Caught!", "✗ Escaped!", "<NAME> was the impostor", "Still a tie.", "The word was",
  "Let go to hide", "New word for everyone?" / "New word" / "Back", "Each say one word about your secret:",
  "Clues done, talk it over", "Clues done, start the 2-minute timer", "Go round again", "Not sure?",
  "1 more minute", "Last guess for a caught impostor" / "Off" / "On", "A caught impostor can steal the round by
  guessing the word.", "Same as last time", "Scores since round 4", "Arjun wins the night with 2 points!",
  "Crew 4 · Impostors 3", "More ›".
- Changed in 3.3: IMP-001, 007, 009, 010, 012, 014, 015, 016, 019, 020, 022, 024, 030, 031, 032, 033, 034, 037, 038,
  039, 043, 044, 073, 076, 080, 081, 082, 083, 088, 092, 095, 097, 098, 101, 105, 109.

### What version 3 rewords or retires (rule 11)
- Retired in 3: "Caught red-handed! <NAME> was the impostor.", "Meena was crew!", "The impostor was <NAME>. Escaped!",
  "Still a tie! The impostor was <NAME>. Escaped!", the dots of the build-up (`build-up-dots`), the timed reveal
  steps (2.5 s, 4.0 s, 5.5 s, 7.0 s), the automatic "Read this aloud" card ("once per session"), "Start the deal",
  the menu item "Rules" (now "How to play").
- New strings in 3: "Caught! <NAME> was the impostor.", "Meena was crew.", "<NAME> was the impostor and escaped!",
  "Still a tie! <NAME> was the impostor and escaped!", "More options ›", "Last-chance guess", "Player 2 of 4",
  "Everyone else, look away!", "How to play" (button and menu item).
- Changed in 3: IMP-005, 007, 008, 010, 011, 012, 013, 017, 031, 033, 034, 035, 037, 038, 041, 044, 070, 071, 072, 075, 080, 081,
  054, 083, 084, 087, 088, 091, 094, 096, 099, 100, 105. Reworded only, no change in behaviour: IMP-027, 040, 062, 089, 107, 109.
  New in 3: IMP-019 (detail of IMP-010), IMP-039 (detail of IMP-033), IMP-076
  (detail of IMP-005).

### What version 2 rewords or retires (rule 11)
- Retired wordings: "Caught!" (IMP-085), "Sorry, Meena!", "Who was accused?", "Got it, deal", "We know it",
  "Hold to see your word" as the pad's name (IMP-083), "Sharpest eyes" (IMP-095), "Discard the evening" (IMP-092),
  "Impostor caught 3 · escaped 2" without "Tonight:" (IMP-040), "Kabir left. Points kept · Undo" (IMP-074),
  "Also called Payasam" (IMP-011), "Carry on this evening" (IMP-101, retired in 2.1), the format-1 saved record
  (IMP-096, replaced in 2.1 by the engine's `SavedGame`).
- Reworded: IMP-001, 003, 006, 008, 010–017, 020–025, 030–035, 037, 040–043, 050–054, 060–063, 070–074, 080–088,
  090–096, 101–107. New detail IDs: IMP-009, 018, 027, 038, 044, 055, 064, 075, 089, 097, 098, 099, 109.

---

## Terms
Every scenario uses these words with exactly these meanings.

| Term | Meaning |
|---|---|
| **Main button** | The one element with the solid main look (PLT-301; tests use `hasMainLook`). It carries `data-testid="main-button"` and is 60 px tall. In portrait it spans the screen width minus 16 px gutters and sits fixed at the bottom of the screen, except on the between-rounds screens at widths of 360 px and more, in portrait and at 812 × 375, where it is the right half of its bottom row (IMP-077). At 812 × 375 it is 358 px wide, fixed at the bottom right (16 px from the right and bottom edges), and no other content lies under it. At most one is on screen (IMP-080). |
| **Quiet button** | An outlined button (PLT-301 "outlined"), 48 px tall, never the main look. |
| **Selected** | An option or name with a visible outline, a "✓" (decorative, `aria-hidden`) and the tint, and `aria-pressed="true"`. Never the main look. Unselected: `aria-pressed="false"`. |
| **Tint** | A background of the outline colour at 10% opacity. |
| **Greyed** | Computed `opacity` 0.5. |
| **Disabled** | The `disabled` attribute set and greyed; a tap does nothing at all. |
| **Small line** | Text on its own line at a computed font size of 15 px (19 px with Larger text). |
| **Body text** | 17 px (21 px with Larger text). |
| **Toast** | A bar above the main button. Undo toasts (`data-testid="undo-toast"`, as in Tambola) last 5 s from appearing and contain a button "Undo"; other toasts (`data-testid="toast"`) last 4 s. A new toast replaces the old one. |
| **Dialog** | An element with `role="dialog"`, whose accessible name is its first sentence. Its buttons are listed main last in this file as "A" / "B (main)". |
| **Larger text** | The host-phone switch "Larger text" in the app's Settings (IMP-109), kept on this phone (not the phone's own text size). When on: body text 21 px and small lines 19 px; the sizes in IMP-073 stay as listed there. |
| **Screen sizes** | CSS-px viewports 320 × 568, 360 × 640, 390 × 844 (portrait) and 812 × 375 (landscape). "Every size" = all four, each with Larger text off and on. |
| **Size of an element** | The computed `font-size` of the named `data-testid` element, in CSS px. |
| **Fits in N lines** | The element's height ≤ N × its computed `line-height`, with `scrollWidth ≤ clientWidth` (nothing cut off, no ellipsis). |
| **No page scrolling** | `document.scrollingElement.scrollHeight ≤ window.innerHeight` and no horizontal scroll. A box that "scrolls inside" has `overflow-y: auto` and its own height limit; the page itself still does not scroll. |
| **Room screens** | The screens meant for the whole table: "Pass the phone to…", "No problem! New word coming.", "Welcome back.", clues, talk, countdown, picker and the result screen (with its build-up and, with the last-chance guess, its guess and verdict steps). The **hold screen** (screen B of the deal) is private. |
| **Round** | From the round's first "Pass the phone to…" screen to its result. A **redeal** ("Don't know this word?", "Deal again", "Start a fresh round") replaces the round in progress with a new deal under the same round number. |
| **Completed round** | A round that reached its result: escaped (`reveal` of a crew member, or `stillTie`); caught with the last-chance guess off (`reveal` of the impostor); caught with it on, once a verdict is tapped (`verdict`). Practice rounds included. Redealt rounds and rounds dropped by the end of the evening are not completed. |
| **Counted round** | A completed round that is not the practice round. **Round numbers** count only counted rounds: round 1 is the first counted round; the round in progress is number (counted rounds so far + 1); the practice round has no number. |
| **Last-chance guess** | The choice `lastGuess` (IMP-076), shown to the host as "Last guess for a caught impostor" (Off / On), off by default: when on, a caught impostor may guess the word before it is shown (IMP-039). |
| **Text button** | A button with no outline and no fill, its text 17 px (21 px with Larger text), its tap area at least 48 px tall and 44 px wide. |
| **Page scrolls as one** | On the result screen and the summary (guideline 46a): only the page scrolls; no element inside has its own scroll area; only the main button stays pinned. |
| **Caught / escaped** | **Caught**: the vote revealed the impostor (whatever the guess). **Escaped**: the vote revealed a crew member, or the re-vote ended "Still a tie". The practice round counts as neither. |
| **Evening** | Internal name (Terms, test hooks, saved record) for one Impostor game; on screen it is always "game" (IMP-085). From the first "Start round" to ended or discarded. One saved game (engine `SavedGame`) per evening. "Change how we play" never starts a new evening. |
| **Tonight / tonight's session** | Internal: the session (PLT-016) the evening belongs to; never named on an Impostor screen. The counts on the result screen ("This game: …") count this evening's counted rounds only. |
| **Between rounds** | The round result once the round is completed, the "left halfway" screen (IMP-091) and the no-words screen (IMP-052). |
| **This phone** | This browser's storage for the app. |
| **Seat order** | The order of the list on "Who's playing?": passing order and clue order. |
| **Names** | Stored and in the page exactly as typed. In this file a name written in CAPITALS (RIYA) is shown upper case with CSS `text-transform: uppercase` only; its DOM text is as typed. Tests match names case-insensitively. |
| **Plurals** | "1 round" / "2 rounds"; "1 time" / "2 times". Every template below follows this. |
| **t = …** | Fake-clock time after the named trigger (a tap means its `click` event; a hold means `pointerdown`). |
| **Sound on** | The app's existing sound setting is on. **Phone voice on**: the app's existing phone-voice setting is on (off by default). |

Example players used throughout, in seat order: **Riya, Arjun, Meena, Kabir** (and **Zoya** where five are needed).
Example words, all real rows of `words.csv`: **Samosa** (IMPW-004, Food, family, hint "Tea time", no other names);
**Pani puri** (IMPW-005, Food, other names "Golgappa / Puchka", hint "Street corner"); **Kheer / Payasam** (IMPW-007,
Food, other names "Payesh", hint "Cardamom"); **School trip** (IMPW-203, School and childhood, other names
"Excursion", hint "Headcount"); **Mummy finding it in two seconds** (the longest word, 31 characters).
`words.csv` has 311 rows (4 October 2026): 291 active rows in 9 categories and 20 retired rows (`retired` = "yes").
The 9 categories: Food, Festivals and occasions, Around the house, Out and
about, Films, music and TV, Sports and games, School and childhood, Weddings and family, Everyday moments.

---

## Canonical strings
One wording per place. A test matches these exactly (names case-insensitively). `<Name>` is a player's name as typed;
`<NAME>` is the same name shown upper case by CSS. "·" is U+00B7 with one space either side; "…" is U+2026; "→" is
U+2192; "✓" is U+2713; "›" is U+203A; "–" in "3–20" is U+2013; apostrophes are U+0027.

| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola or Impostor on this phone" | text inside the "Host a game" button | IMP-001 |
| Home, unfinished row | "Impostor · Riya, Arjun +2 · round 4" and "Tap to resume" | inside `unfinished-games` | IMP-001 |
| What shall we play? | heading "What shall we play?" | h1 | IMP-001 |
| Tambola card | "Tambola" · "Housie on paper or phones · 2 hrs" | button, name starts "Tambola" | IMP-001 |
| Impostor card | "Impostor" · "Find who doesn't know the word · 3–20 players · about 4 min a round" ("3–20 players" never breaks across lines) | button, name starts "Impostor" | IMP-001 |
| Resume card | "Impostor · Riya, Arjun +2 · round 4" and "Tap to resume" | button `resume-card` | IMP-001 |
| Join with my ticket, last line | "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!" | paragraph | IMP-002 |
| Who's playing? | heading "Who's playing?"; line "Sit in a circle. This is the passing and clue order." | h1; paragraph | IMP-003 |
| Name field | label "Player name", placeholder "Type a name…"; button "Add" | input (`maxlength="16"`); button | IMP-003 |
| Row buttons | "Move Riya up" (▲), "Move Riya down" (▼), "Remove Riya" (✕) | buttons, accessible names | IMP-003 |
| Messages | "Riya is already playing. Add an initial, like Riya S." · "Add at least 3 players." · "20 players is the most." | `role="alert"` paragraph | IMP-003 |
| Filled-in list | quiet "Clear list"; toast "List cleared · Undo" | button; `undo-toast` | IMP-004 |
| Choices | heading "How do you want to play?"; small line "Same as last time" when the choices were carried over (IMP-009); groups "Mode", "Talking", "Score", "Words" | h1; `role="group"` named by its label | IMP-005 |
| Options | "Easy" / "Hard"; "Free flow" / "Timer"; "No" / "Yes"; "Whole family" / "+ Grown-ups" | buttons with `aria-pressed` | IMP-005 |
| Option lines | Easy "The impostor gets the category and a hint." · Hard "The impostor gets nothing and never starts." · Free flow "Talk as long as you like, then tap Vote now." · Timer "Two minutes to talk, then a chime." · No "Just play. We count catches and escapes." · Yes "Points every round, totals for the game." · Whole family "Words kids and grandparents know." · + Grown-ups "Adds words kids or elders may not know." | small line under the group | IMP-005 |
| Categories row | "Categories: all 9 ›" / "Categories: 7 of 9 ›" | button | IMP-007 |
| Categories sheet | heading "Categories"; 9 switches named exactly as the categories; switch "Include non-veg food"; message "Keep at least one category."; main "Done" | `role="switch"` each | IMP-007 |
| More options | quiet "More options ›"; sheet heading "More options"; group "Last guess for a caught impostor" with options "Off" / "On"; small line "A caught impostor can win the round by guessing the word."; main "Done" | button; `role="group"` with buttons with `aria-pressed` | IMP-076 |
| Choices, How to play | quiet "How to play" (right half of the row directly above "Start round"; "More options ›" on the left) | button | IMP-070 |
| Choices main | "Start round" | main button | IMP-005 |
| How to play (no menu) | heading "How to play"; heading "Read this aloud" and 4 lines (IMP-070); the rules (IMP-072); main "Done"; quiet "Practice round first" (only from the choices screen of a new evening) | h1; h2 and `ol` with 4 `li`; paragraphs | IMP-070, 071, 072 |
| No words left | heading "You've played every word in these categories!"; line "Turn on more categories or + Grown-ups."; main "Allow repeats"; quiet "Change categories" | h1; paragraph | IMP-052 |
| Deal, screen A | "Player 2 of 4"; "Pass the phone to" and `<NAME>`; "Everyone else, look away!"; main "I'm <Name>" | `deal-progress`; paragraph; `pass-name`; paragraph `look-away`; main button | IMP-010, 019 |
| Deal, after a return | "Welcome back." above screen A | paragraph | IMP-090 |
| Deal, screen B | "Player 2 of 4"; `<NAME>`; quiet "Tap instead" under the name; pad "Hold here to see your word", while held "Let go to hide"; text button "Not Riya? ← Back" under the pad until the first hold | `deal-progress`; heading `pass-name`; button; button `hold-pad`, accessible name = its visible text; text button | IMP-010, 083 |
| Deal, after the first hold | text button "Don't know this word?" under the name; main "Done, pass to <Name>" (last player: "Done, everyone's seen") | text button; main button | IMP-010, 015 |
| New word | dialog "New word for everyone?" with "New word" / "Back" (main) | dialog | IMP-015 |
| Tap mode | "Tap to see your word" / "Tap to hide" | button `hold-pad` | IMP-014 |
| Private block | IMP-011 table | `private-block`, 5 children | IMP-011 |
| Redeal | "No problem! New word coming." · "Pass the phone back to <NAME>"; main "I'm <Name>" | h1; paragraph | IMP-015 |
| See my word again (visible) | quiet "See my word again" on the clues and talk screens | button | IMP-017 |
| See my word again, Done | "Done, back to clues" / "Done, back to talking" / "Done, back to the vote" | main button | IMP-017 |
| Joining | "Joining next round: Zoya" ("Joining next round: Zoya, Dev") | small line `joining-line` | IMP-079 |
| Clues | "✓ Everyone has seen their word." · "Phone in the middle, face up." · `<NAME>` · "starts" · "Each say one word about your secret:" · "Meena → Kabir → Zoya → Riya → Arjun" | paragraphs; `starter-name`; paragraphs; `clue-order` | IMP-016, 020 |
| Clues main | "Clues done, talk it over" (Free flow) / "Clues done, start timer" (Timer) | main button | IMP-016 |
| Second round | small line "Not enough clues?" (not at 812 × 375); quiet "Go round again" (in the bottom bar, directly above the main button); then line "Second round: <NAME> starts again" | button; paragraph | IMP-022 |
| Talk, Free flow | heading "Talk it over"; "Who sounded unsure?"; main "Vote now" | h1 `talk-heading`; paragraph | IMP-023 |
| Talk, Timer | label "Talk it over" above `timer` "2:00"…"0:00"; main "Vote now"; quiet "Pause" / "Carry on"; small line "Paused · Tap to carry on"; heading "Time's up!"; main "Get ready to point"; quiet "1 more minute" | `timer-label`; `timer`; buttons; small line; h1 | IMP-024, 027 |
| Countdown | "Get ready to point…" then "3", "2", "1", "Point!" | h1 `countdown-heading` then `countdown-number` | IMP-030 |
| Picker | heading "Who got the most fingers?"; one button per name; label "Not sure?"; text buttons "It's a tie", "Count again"; main "Reveal" (disabled) / "Reveal <Name>" | h1; buttons with `aria-pressed`; paragraph; text buttons | IMP-031 |
| Tie | heading "Tap everyone who is tied"; text button "Not a tie"; main "Point again" (disabled) / "Point again: Arjun or Meena" / "Point again: Arjun, Meena or Kabir"; re-vote text button "Still a tie" | main button; text button | IMP-032 |
| Build-up | "<Name> was…" | `build-up` | IMP-033 |
| Result headline | "✓ Caught!" / "✗ Escaped!" | h1 `result-headline` | IMP-033, 034, 038 |
| Result note | "Meena was not the impostor." (wrong person) / "Still a tie." | paragraph `result-note` | IMP-034, 038 |
| Impostor line | "<NAME> was the impostor" | paragraph `result-impostor` | IMP-033 |
| Word | "The word was" · "School trip" · small line "Also called Excursion" · chip "School and childhood" | `word-label`; `result-word`; `also-called`; `word-category` | IMP-033 |
| Last-chance guess | "Last chance, <Name>! Guess the word out loud. Get it right and you win the round." · main "<Name> guessed. Show the word" · "Guessed right" / "Wrong guess" | `guess-line`; main button; two quiet buttons | IMP-039 |
| Round outcome | "You caught the impostor!" · "<Name> wins the round!" · "<Name> escaped!" | h2 `round-outcome` | IMP-035, 034, 085 |
| Result, Score No | "This game: impostor caught 3 · escaped 2" | paragraph `evening-line` | IMP-040 |
| Between rounds | "← Home" (top left); outlined "End game" beside (or, at 320 px wide, above) the main button | buttons | IMP-077 |
| Result, Score Yes | "+2 Arjun" · "+1 Arjun" · "+1 each: Riya, Meena, Kabir"; caption "Scores since round 4" | `round-points`; small line in `scoreboard` | IMP-044, 043 |
| Result buttons | main "Next round"; quiet "Undo" (after a verdict, last-chance guess only; never with it off); quiet "This word didn't work"; toast "Samosa won't come up again · Undo" | buttons; `undo-toast` | IMP-037, 107 |
| Players sheet | heading "Players"; main "Done"; toast "Kabir left · Undo" / "Kabir left · Points kept · Undo" | h1; `undo-toast` | IMP-074 |
| Players link | quiet text button "Players (5) ›" on the round result | text button | IMP-074 |
| Leaving mid-round | dialog "Kabir has to leave?" with "Deal again without Kabir" / "Finish this round first" (main); toast "Kabir left after this round" | dialog; `toast` | IMP-078 |
| Below 3 players | dialog "3 players needed. Add someone, or end the game." with "End game" / "Add a player" (main) | dialog | IMP-078 |
| Menu button | "··· Menu" | button, name contains "Menu" | IMP-075 |
| Menu items | "How to play" · "Players" · "See my word again" · "Deal again with a new word" · "Change how we play" · "Settings" · "History" · "Home (game is saved)" (mid-round only) · "End game" (mid-round only) | `role="menuitem"` | IMP-075 |
| See my word again | heading "Whose word?"; one button per name; quiet "Cancel" | dialog | IMP-017 |
| Deal again | dialog "Deal again? This round won't count. For when someone said the word or saw a screen." with "Deal again" / "Keep playing" (main) | dialog | IMP-025 |
| Start new | dialog "Start a new game? The game from 8:40 pm will be ended." with two equal outlined buttons "Carry on that game" / "Start new" (no main) | dialog | IMP-001 |
| End mid-round | dialog "End now? This round won't count." with "End now" / "Keep playing" (main) | dialog | IMP-093 |
| Left over 3 hours | "This round was left halfway. Start a fresh round?" with main "Next round", outlined "End game", "← Home" | h1 | IMP-091, 077 |
| Summary (no menu) | heading "That's the game!"; lead line "Arjun wins the game with 2 points!" / "Arjun and Meena share the game with 2 points!" / "Impostor caught 4 · escaped 3"; `fun-line` ×0–2; main "Play again"; quiet, in this order: "Play something else", "Home", "More ›"; "More ›" menu: "Oops, keep playing", "Share", "History", divider, "Discard this game" | h1; `summary-line`; paragraphs; buttons; `role="menu"` with `role="menuitem"` and `role="separator"` | IMP-092, 095, 101 |
| Discard | dialog "Discard this game? Its rounds and scores will be lost." with "Discard" / "Keep it" (main) | dialog | IMP-092 |
| Fun lines | "Best impostor: Arjun, escaped 2 times" · "Most suspected: Meena, picked 3 times without being the impostor" | `fun-line` | IMP-095 |
| Share fallback | toast "Copied. Paste it into any chat." | `toast` | IMP-106 |
| History, in progress | "In progress" | inside `history-game` | IMP-094 |
| History rows | "Impostor · 7 rounds"; round rows (IMP-105); "Play again"; "← Back" when opened between rounds | `history-game`; `history-round`; buttons | IMP-103, 105, 092 |
| Settings | switches "Larger text" and "Tap to show instead of hold"; note "Your screen reader will say the word out loud. Use earphones or turn the volume down."; "Skipped words (3)"; "Bring back" per word (accessible name "Bring back Samosa") | switches; small line; heading; buttons | IMP-014, 107, 109 |
| Announcements | IMP-083 list; `announcer` is emptied when a new deal starts (product owner, 4 October) | `announcer` (`aria-live="polite"`) | IMP-083 |

---

## Test hooks the build provides
A test may set exactly these; the build must honour them.

1. **Rule API** in `src/games/impostor/index.ts` (pure, no clock, no storage), fitting the existing engine
   (`src/engine`: `startMatch`, `play`, `replay`, `undo`, `viewFor`, `SavedGame`, `MoveRecord`, `createRng`):
   - `impostorRules`: the `GameRules` for the engine, with `id: 'impostor'`.
   - Setup (`SetupInput`): `{ gameId: 'impostor', seeds: { word: string, starter: string }, config: { players: string[]
     (seat order), choices, excludedWords: { dealtTonight: string[], recent: string[], blocked: string[] },
     testDeals?: { wordId?: string; impostor?: string; starter?: string }[] } }` (`testDeals`: Test hooks item 3).
     `choices = { mode: 'easy' | 'hard', talking: 'free' | 'timer', score: boolean, words: 'family' | 'grownups',
     categories: string[] (exact CSV names), nonveg: boolean, lastGuess: boolean }` (`lastGuess` false for a new evening
     unless chosen; new evenings always write it; a saved evening whose `choices` has no `lastGuess` reads as `true`,
     since every evening before version 3 had the guess). Seeds are made only by a new evening's first
     "Start round" (IMP-060).
   - Moves, all recorded as `MoveRecord`s with `by: 'host'` (`type`, extra fields): `startDeal {practice: boolean}` ·
     `seen` · `dontKnow` · `startTalk` · `anotherRoundOfClues` · `voteNow` · `reveal {player}` ·
     `tie {players: string[]}` · `stillTie` · `showWord` · `verdict {right: boolean}` · `nextRound` · `dealAgain` ·
     `allowRepeats` · `wordDidntWork {blocked: boolean}` · `setPlayers {players: string[]}` · `leaveAfterRound {player}` · `dealAgainWithout {player}` ·
     `setChoices {choices}` ·
     `endEvening`. `isOver` is true after `endEvening`.
   - `setPlayers` mid-round (deal to picker) may only add players; a mid-round removal by itself is not a legal move.
     `dealAgainWithout {player}` (IMP-078) is one atomic move: it removes that player and redeals the round (new word,
     impostor and starter from the next per-deal seed n). `leaveAfterRound {player}` (IMP-078) marks a pending leaver,
     removed when the round reaches a result, or when `endEvening` drops the round.
   - Every new deal, redeals included (`dontKnow`, `dealAgain`, `dealAgainWithout`, the "left halfway" `dealAgain`,
     `nextRound`), deals the current list: players added during the round are dealt in; pending leavers are still
     dealt in until a round reaches its result.
   - Every move that deals a word carries the dealt word's id as `wordId`: `startDeal`, `nextRound`, `dealAgain`,
     `dealAgainWithout`, `dontKnow`, `allowRepeats`, and `setChoices` when it redeals the same round from the no-words screen (IMP-052).
     `nextRound` that finds no word left carries `wordId: null` (the no-words screen shows). The rules accept any
     recorded id that exists in the shipped list (retired words included, IMP-054), live and on replay alike (the engine
     can't tell them apart); the app always records the id that `pickWord` gives for deal n (or that deal's `testDeals`
     entry), and tests check exactly that (product owner, 4 October, as built), so later edits to `words.csv` never change a past
     evening (IMP-096). A word-dealing move without `wordId` makes the evening unreplayable (hidden by IMP-096).
   - Random draws are per dealt round: the n-th deal of the evening (every move that deals a word counts, redeals included, from 1; a `nextRound`
     with `wordId: null` does not)
     picks its word with ``createRng(`${seeds.word}:word:${n}`)``, its impostor with
     ``createRng(`${seeds.word}:impostor:${n}`)`` and its starter with ``createRng(`${seeds.starter}:${n}`)``, so a
     recorded word id never shifts the impostor or starter draws.
   - `showWord` and `verdict` are legal only in a round where the impostor was revealed and `lastGuess` is true;
     with `lastGuess` false the `reveal` of the impostor completes the round.
   - Undo of a verdict is the engine's `undo` of that `verdict` record: `canUndo` is true only for the round's latest
     `verdict` while no `nextRound`, `setPlayers`, `setChoices` or `endEvening` has been recorded after it
     (`wordDidntWork` after it does not end the window).
   - Views: `view(state, { kind: 'player', playerId: name })` → `{ role: 'crew', wordId }` or `{ role: 'impostor' }`
     for the round being dealt or played. Host and room views → `{ round: number | null (null for the practice
     round), practice: boolean, players: string[] (mid-round: this round's dealt players; joiners and pending leavers
     follow from the moves), starter: string | null (null until picked) }`, plus `impostor`
     and `wordId` only after that round's `reveal` or `stillTie`.
   - Tap → move, exactly (a tap not listed records nothing):

     | Tap | Records |
     |---|---|
     | "Start round" (a new evening) | the evening is created, then `startDeal {practice: false}` |
     | "Practice round first" (How to play, opened from a new evening's choices screen) | the evening is created, then `startDeal {practice: true}` |
     | "How to play", its "Done", "More options ›", "Off" / "On" and "Done" | nothing ("Done" changes the choices on screen) |
     | "I'm <Name>", holds, "Tap instead", "Tap to see your word", "Tap to hide" | nothing |
     | "Done, pass to …" / "Done, everyone's seen" | `seen` |
     | "Don't know this word?", and "Back" in its dialog | nothing |
     | "New word" (dialog "New word for everyone?") | `dontKnow` (the new word and impostor are drawn now) |
     | "Clues done, talk it over" / "Clues done, start timer" | `startTalk` |
     | "Go round again" | `anotherRoundOfClues` |
     | "Vote now" / "Get ready to point" | `voteNow` |
     | "Pause", "Carry on", "1 more minute", "Count again", "It's a tie", ticking names, the countdown | nothing |
     | "Point again: …" | `tie {players}` |
     | "Reveal <Name>" | `reveal {player}` |
     | "Still a tie" | `stillTie` |
     | "<Name> guessed. Show the word" (last-chance guess on) | `showWord` |
     | "Guessed right" / "Wrong guess" (last-chance guess on) | `verdict {right: true / false}` |
     | "Undo" (verdict) | engine `undo` of the `verdict` record |
     | "Next round" (result, or "left halfway" screen) | `nextRound` alone on a result (the next deal starts with it); `dealAgain` on the "left halfway" screen |
     | "Deal again" (dialog) | `dealAgain` |
     | "Allow repeats" | `allowRepeats` |
     | "This word didn't work" / its toast's "Undo" | `wordDidntWork {blocked: true}` / `{blocked: false}` |
     | Players sheet "Done" (with a change; between rounds or mid-round adding) | `setPlayers {players}` (one move with the final list) |
     | "Finish this round first" (IMP-078) | `setPlayers` first when names were added in the sheet, then `leaveAfterRound {player}` |
     | "Deal again without Kabir" (IMP-078) | `setPlayers` first when names were added in the sheet, then `dealAgainWithout {player}` |
     | "Add a player" / "End game" in "3 players needed." (IMP-078) | nothing (the Players sheet / the summary opens) |
     | "Not Riya? ← Back", "See my word again" (button or menu), "Done, back to …", "Not a tie" | nothing |
     | "Home (game is saved)" (mid-round menu) | nothing (Home opens; the game stays unfinished) |
     | "Change how we play", then "Start round" (between rounds) | `setChoices` (only when something changed), then `nextRound` |
     | "Change how we play", then "← Back" (between rounds) | `setChoices` when something changed, else nothing |
     | "Change categories", then "Start round" or "← Back" (no words left) | `setChoices` (when something changed) only; the same round is dealt again with a new word |
     | "End game" (between rounds) / "End now" (mid-round dialog) | nothing (the summary shows, IMP-092, IMP-101) |
     | "← Home" (between rounds) | nothing (the game stays unfinished, IMP-077) |
     | "Play again" (end screen) | `endEvening` (the summary is left), then a new evening starts as IMP-103 |
     | Leaving the summary ("Play again", "Play something else", "Home", "History", IMP-101), "Start new" (IMP-001), or the 3-hour and 12-hour limits (IMP-099) | `endEvening` |

   - `dontKnow` and `wordDidntWork {blocked: true}` add the word to the evening's blocked set at once.
   - `wordDidntWork` is legal at any point from that round's `reveal` or `stillTie` until its `nextRound`,
     `dealAgain` or `endEvening`, with or without a verdict (so the engine's undo of a verdict replays cleanly).
   - `pickImpostor(players: readonly string[], recentImpostors: readonly string[], rng: Rng): string`
     (`recentImpostors` = the impostor of each completed round of the evening, oldest first; IMP-061).
   - `pickStarter(players: readonly string[], startedThisCycle: readonly string[], skip: string | null, rng: Rng):
     { starter: string; newCycle: boolean }` (`skip` = this round's impostor in Hard, `null` in Easy; IMP-021).
   - `pickWord(words: readonly ImpostorWord[], filter: { words: 'family' | 'grownups'; categories: readonly string[];
     nonveg: boolean; usedTonight: ReadonlySet<string>; recent: ReadonlySet<string>; blocked: ReadonlySet<string>;
     allowRepeats: boolean }, rng: Rng): ImpostorWord | null` (sets hold word ids; `null` = no word left; IMP-052).
   - `scoreRound(outcome: { impostor: string; caught: boolean; guessedRight: boolean | null }, players: readonly
     string[]): Record<string, number>` (every player present, 0 when no points; `guessedRight` is `null` when the
     impostor escaped or the last-chance guess was off; IMP-041).
   - `readImpostorEvening(saved: SavedGame): { players, choices, excludedWords, seeds, moves, status }`: the
     evening's starting players, choices and excluded words, its seeds, its moves (the `move` of each record, in
     order) and the `SavedGame` status (IMP-096).
   - `readTestSeeds(raw: string | null, release: boolean): { word?: string; starter?: string; deals?: { wordId?:
     string; impostor?: string; starter?: string }[] } | null`: parses `localStorage['pgn.test.seeds']`; returns
     `null` when `release` is true, when `raw` is `null`, or when it is not valid JSON of that shape (IMP-064).
   - `Rng` is the engine's `createRng(seed)`.
2. **Word list** at `content/impostor/words.json` (IMP-055): an array of
   `{ id, word, other_names, category, audience, nonveg, hint, retired }`, built from `docs/games/impostor/words.csv`;
   a word with `retired: true` is never dealt but still resolves for replay and History (IMP-054).
3. **Browser seeds and forced deals**, honoured only in development and preview builds (IMP-064). "Preview builds"
   = every build except the release build published to the families' link: `npm run dev`, a local `npm run build`
   served by `npm run preview` (what the browser tests use), and the preview link. The release build ignores them.
   Before load a test may set `localStorage['pgn.test.seeds']` to JSON:
   `{ "word": "<seed>", "starter": "<seed>", "deals": [ { "wordId": "IMPW-004", "impostor": "Arjun", "starter": "Meena" } ] }`.
   `word` and `starter` become the next evening's `seeds.word` and `seeds.starter`; `deals` is copied into that
   evening's setup as `config.testDeals` (set only in development and preview builds; absent otherwise), so replay
   and reload use the same forced deals (IMP-060, IMP-090, IMP-091). Deal n of the evening takes `testDeals[n-1]`
   (every deal counts, `dontKnow` and `dealAgain` redeals included); a missing field, or no entries left, falls back to the
   seeded pick. An entry naming an impostor or starter who is not among that round's players is ignored as a whole
   (the seeded picks are used; IMP-078 "no dead buttons"). An entry that breaks another rule (a starter who is the impostor in Hard, a word outside the filters) is a
   test error; the build need not check it. The key is read once, at a new evening's first "Start round", through
   `readTestSeeds(raw, release)`. The release build is made with `npm run build -- --mode release`
   (`import.meta.env.MODE === 'release'`), and only that build passes `release: true`.
4. **Hold input** uses Pointer Events only (`pointerdown`, `pointerup`, `pointercancel`, `pointerleave`), so
   `page.mouse.down/up` and dispatched events work. Only the first pointer on the pad counts; others are ignored.
5. **Clock.** Every timer (500 ms hold, 8 s tap-mode hide, 2-minute timer, countdown, 1.5 s build-up, toasts, 3 h, 12 h)
   uses `setTimeout`/`setInterval` and `Date.now()`, so Playwright's `clock.install` / `runFor` drive them; no step
   waits on `requestAnimationFrame` alone.
6. **Visibility.** The app reads `document.visibilityState` and listens to `visibilitychange` and `pagehide`
   (as the existing `backgroundAndReturn` helper fakes).
7. **Sounds.** Four named sounds, `tick`, `ding`, `chime`, `drumroll`, are made in the app with Web Audio (no audio
   files, no new dependency) and played through one function. In development and preview builds that function appends
   `{ name, at: Date.now(), gain }` (`gain` = the sound's peak gain, 0–1) to `window.__sounds`; `chime` and
   `drumroll` have a peak gain ≤ `tick`'s (IMP-089). With sound off nothing
   plays and nothing is appended. Voice uses `speechSynthesis` (the existing `__spoken` stub sees it).
8. **Wake lock** via `navigator.wakeLock.request('screen')` (IMP-087); **vibration** via `navigator.vibrate`, called
   only where it exists. Both can be stubbed.
9. **Test ids** (`data-testid`): `main-button`, `resume-card`, `unfinished-games` (existing), `pass-name`,
   `hold-pad`, `private-block`, `private-word`, `private-live`, `starter-name`, `clue-order`, `talk-heading`, `timer`,
   `countdown-heading`, `countdown-number`, `timer-label`, `build-up`, `result-headline`, `result-note`,
   `result-impostor`, `word-label`, `result-word`, `also-called`, `word-category`, `guess-line`, `round-outcome`,
   `deal-progress`, `look-away`, `joining-line`,
   `evening-line`,
   `round-points`, `scoreboard`, `score-row` (with `data-name`, `data-points`, `data-rank`), `practice-chip`,
   `privacy-cover`, `fun-line`, `summary-line`, `history-game` (existing), `history-round`, `announcer`, `undo-toast`
   (existing), `toast`.
10. **Share.** `navigator.share({ text })` when it exists, else `navigator.clipboard.writeText(text)` (IMP-106). Both
    can be stubbed.
11. **Network.** All requests go through `fetch` or the browser's own loading, so a test can watch `page.on('request')`
    (IMP-108).
12. **Settings used:** the existing sound and phone-voice settings; the new host switches "Larger text" and "Tap to
    show instead of hold" (IMP-109, IMP-014); the `prefers-reduced-motion: reduce` media query (IMP-033).
13. **Storage a test may write before load** (keys under the app's existing key root, `pgn.` locally):
    - saved evenings: `pgn.game.<id>` = an Impostor `SavedGame` (IMP-096), in progress or ended, with `sessionId`
      (sessions under the existing `pgn.session.` keys, as Tambola's tests do);
    - `pgn.pref.impostor.lastChoices` = a `choices` object (IMP-009);
    - `pgn.pref.impostor.blockedWords` = an array of word ids ("This word didn't work", IMP-107);
    - `pgn.pref.impostor.tapToShow` = `true` / `false` (IMP-014); `pgn.pref.largerText` = `true` / `false` (IMP-109);
    - `pgn.impostor-ui.<id>` = `{ "timerMs": 90000, "summaryShownAt": 1791043200000 }`: screen state that is not a
      move and not in the saved record: the paused timer's remaining time (IMP-027) and when the summary was first
      shown (IMP-101). The app writes it at every change; a missing key means "timer full" and "no summary shown".

---

## 01-setup.md: getting to the first deal

## IMP-001: "Host a game" offers Tambola and Impostor
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Home (PLT-300: still "Host a game" and "Join with my ticket")
Then the "Host a game" button's second line reads exactly "Tambola or Impostor on this phone"
When the host taps "Host a game"
Then "What shall we play?" shows two cards of equal size and look (neither has the main look):
"Tambola" with "Housie on paper or phones · 2 hrs", and "Impostor" with
"Find who doesn't know the word · 3–20 players · about 4 min a round"
And there is no main button on this screen; tapping a card opens that game's setup at once
And "3–20 players" is never split across two lines (it sits in a `white-space: nowrap` span) at every size
Given an Impostor evening is unfinished (not ended, not discarded, not auto-ended by IMP-104)
Then "What shall we play?" shows, above the two cards, the button `resume-card` reading "Impostor · Riya, Arjun +2 ·
round 4" and "Tap to resume", and Home's `unfinished-games` shows a row with the same two texts
And the label names the first two players in the game's current seat order, then "+N" for the others (3 players:
"Riya, Arjun +1"); names as typed
And "round N" is: during a round (deal to reveal), that round's number (the practice round: "round 1"). Between rounds
it is the number the next deal will carry: after a completed round, that round + 1; on the "left halfway" and
no-words screens, the round waiting to be dealt. While the summary shows, it is the number for the screen "Oops, keep
playing" returns to (End now in round 4: "round 4"; End game after round 4: "round 5")
And an evening whose summary was showing and not yet left is unfinished too
When either is tapped
Then the evening reopens at its saved step (IMP-090, IMP-091), or, for such an evening, at the summary (IMP-101)
When instead the host taps the "Impostor" card while that evening is unfinished
Then a dialog asks exactly "Start a new game? The game from 8:40 pm will be ended." (8:40 pm = the unfinished game's
start time) with two equal outlined buttons side by side, "Carry on that game" and "Start new"; neither has the main
look
And the dialog shows once per tap of the Impostor card, or of History's "Play again" (IMP-103) while a game is
unfinished (the summary's "Play again" ends its game first, so it never shows this dialog); "Start new" goes straight
on with no second question: to an empty or tonight-filled "Who's playing?" (IMP-004) after the card, or to "Who's
playing?" filled by IMP-103 after "Play again"
And "Carry on that game" reopens it at its saved step
And "Start new" records `endEvening` at once, with no summary (a half-played round is dropped; IMP-097 applies:
with no counted round it is deleted rather than kept), then opens "Who's playing?" for the new evening
And only one Impostor evening is ever unfinished at a time

## IMP-002: A guest is told there's nothing to join
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When a guest opens "Join with my ticket"
Then the last paragraph of that screen reads exactly
"Playing Impostor? It's all on the host's phone. Nothing to join, just play along!"
And nothing else on that screen changes

## IMP-003: Players are added in seat order, without dragging
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given "Who's playing?" with an empty list
When the host types "Riya" in "Player name" and taps "Add" (or presses Enter), then Arjun, Meena and Kabir the same way
Then the list shows 1 Riya, 2 Arjun, 3 Meena, 4 Kabir, in that order: the passing order and the clue order
And after each add the field is empty and keeps focus (the phone keyboard stays open)
And every Enter adds the name typed before it, however quickly the names and Enters follow each other (typing
"Zoya", Enter, "Dev", Enter within 200 ms adds both, in that order); no Enter is dropped or merged
And each row has ▲ "Move Riya up", ▼ "Move Riya down" and ✕ "Remove Riya", each at least 44 × 44 CSS px
(guideline 21: nothing needs dragging); row 1's ▲ and the last row's ▼ are disabled
And names are trimmed of spaces at both ends; an empty or all-space name adds nothing ("Add" is disabled)
And the field has `maxlength="16"`, so a 17th character cannot be typed
And a name equal to one in the list, ignoring case ("riya"), is not added and shows
"Riya is already playing. Add an initial, like Riya S." (the name as already listed) until the field changes
And with 20 players "Add" is disabled and "20 players is the most." shows
And while fewer than 3 players are listed, "Next" is disabled and "Add at least 3 players." shows
And past names show under the field as buttons, one tap adding that name at the end: the last 8 distinct names used
in any game on this phone, newest game first; within one game, in that game's seat order; names that differ only in
case count as one, shown as most recently typed; a name already in the list (ignoring case) is not offered
And ✕ during setup removes the player at once, with no toast; removing below 3 is allowed during setup (Next disables)
And a tap on "Add" (or Enter) with a refused name (duplicate, or 20 players listed) leaves the field as typed
And text left in the field when "Next" is tapped is not added and is cleared
And "← Back" on "Who's playing?" returns to "What shall we play?"; the list is kept if the host comes back within the
same visit to the Impostor setup, and is otherwise rebuilt by IMP-004

## IMP-004: Tonight's names arrive filled in
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given tonight's session (PLT-016) already has a game with Riya, Arjun and Meena (Tambola or Impostor; the most recent
game's players, PLT-024)
When the host taps the Impostor card
Then "Who's playing?" already lists Riya, Arjun and Meena in that game's order, with a quiet "Clear list"
And "Clear list" shows whenever the list has at least 1 name, filled in or typed
When the host taps "Clear list"
Then the list empties at once and the toast "List cleared · Undo" shows for 5 s; "Undo" restores the same list
in the same order
Given no session tonight
Then the list starts empty and "Clear list" is not shown until a name is added

## IMP-005: The four choices, with these defaults
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Next" on "Who's playing?"
Then "How do you want to play?" shows four groups, each with two option buttons:
Mode "Easy" / "Hard"; Talking "Free flow" / "Timer"; Score "No" / "Yes"; Words "Whole family" / "+ Grown-ups"
And on this phone's first ever evening the selected options are Easy, Free flow, No, Whole family (later: IMP-009)
And exactly one option per group is selected (outline, ✓, tint, `aria-pressed="true"`), never the main look
(guideline 17a); tapping the other option moves the selection; tapping the selected one changes nothing
And under each group only the selected option's line shows (Option lines in Canonical strings)
And below the groups: the button "Categories: all 9 ›" (IMP-007), then, on one row directly above "Start round",
two quiet buttons of equal width, "More options ›" (IMP-076) on the left and "How to play" (IMP-070) on the right
And "Start round" is the one main button; tapping it creates the evening and starts the first deal at once (records
`startDeal {practice: false}`; IMP-008)
And "← Back" returns to "Who's playing?" with the list unchanged

## IMP-006: Choices stay for the evening and change only between rounds
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the host chose Hard and Timer and round 1 ended
When the host taps "Next round"
Then round 2 uses Hard and Timer
When, on a round result, the host opens the menu and taps "Change how we play"
Then "How do you want to play?" opens with the evening's current choices selected; "Start round" records
`setChoices` (only when something changed) and then `nextRound`, and the next round's deal starts
And "← Back" (or the phone's Back) keeps the changes: it records `setChoices` when something changed (nothing
otherwise) and returns to the same result; the changes apply from the next round
And the evening stays the same evening (same seeds, same round numbering)
And "Change how we play" is not in the menu during a round (IMP-075)

## IMP-007: Categories, non-veg and one impostor
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Categories: all 9 ›"
Then a sheet "Categories" shows 9 switches, named and ordered exactly: "Food", "Festivals and occasions",
"Around the house", "Out and about", "Films, music and TV", "Sports and games", "School and childhood",
"Weddings and family", "Everyday moments"; on the first ever evening all are on
And below them the switch "Include non-veg food", off on the first ever evening
And a switch that is on has the track colour #1E3A5F (the deep blue already used for marks, not the main-button
colour; guideline 17a) and a white (#FFFFFF) thumb, a contrast of at least 3:1 between thumb and track
And when only one category switch is on, that switch is disabled and "Keep at least one category." shows
When the host switches off two categories and taps "Done"
Then the button reads "Categories: 7 of 9 ›"
And "Include non-veg food" does not change that button's text
And every round has exactly one impostor (two impostors are later, IMP-036)

## IMP-008: Taps to the first deal
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given tonight's names are filled in (IMP-004) and the choices are as wanted
Then from tapping the Impostor card, the first "Pass the phone to…" screen comes after exactly 3 taps:
card → "Next" → "Start round", on every evening (no card shows by itself, IMP-070)
And no session-name question is asked (IMP-009)
(Time is a usability target, not a test: 30 s for a group that played tonight; under 90 s when typing names.)

## IMP-009: Choices start from last time; the evening joins tonight's session silently
Status: approved, owner, 2026-10-04 (changed; detail of IMP-005, IMP-006, IMP-008)
Phase: Impostor 1
Given `pgn.pref.impostor.lastChoices` (written at every first "Start round" and every `setChoices`: the most
recently started evening's latest choices, whether ended or discarded) holds Hard, Timer, Yes, + Grown-ups,
7 categories, non-veg on and the last-chance guess on
When the host starts a new evening from the Impostor card
Then "How do you want to play?" opens with exactly those 7 choices selected (the 4 groups, the categories, non-veg,
and the last-chance guess in "More options", IMP-076), and the small line "Same as last time" directly under the
heading
And "Same as last time" shows whenever the choices were carried over (from `lastChoices`, or "Play again"); it is
not shown on a phone that has never played, nor in "Change how we play"; it goes as soon as any choice is changed
And a stored `lastChoices` without `lastGuess` reads as the last-chance guess off
And stored category names from before 4 October are mapped: "Travel and places" → "Out and about",
"Cricket and games" → "Sports and games", "Desi life" → "Everyday moments"; any other name not among the 9 is
dropped; when no category is left, all 9 are on
And on a phone that has never played, the IMP-005 defaults apply (last-chance guess off)
And "Play again" (IMP-103) uses the choices of the evening it was tapped on instead; the category name mapping
applies only to the stored `lastChoices`; a category name in a past evening's choices that is not among the 9 is
dropped (all 9 when none is left)
When "Start round" is tapped
Then the evening joins tonight's session by PLT-016's rules with no question (no "Session name" field, no
"Continue … or start a new session?")
And when PLT-016 would start a new session, it is created with the name PLT-016 suggests (the day, as
"Sunday 4 Oct"), without asking

---
## 02-deal.md: passing the phone

## IMP-010: Each player sees their role privately, in seat order
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Riya, Arjun, Meena and Kabir; Arjun is the impostor; the word is Samosa; hold mode (IMP-014 off)
When the round's deal starts
Then screen A shows, top to bottom: `deal-progress` "Player 1 of 4" (17 px; 21 px with Larger text) directly above
"Pass the phone to", then RIYA (`pass-name`), then `look-away` "Everyone else, look away!" (20 px; 24 px with Larger
text), and the main button "I'm Riya"
When "I'm Riya" is tapped
Then screen B shows, top to bottom: `deal-progress` "Player 1 of 4" (17 px; 21 px with Larger text); RIYA
(`pass-name`, the screen's heading) directly under it; the quiet "Tap instead" directly under the name; a reserved
space for the text button "Don't know this word?" (IMP-015); the space for the private block; the pad "Hold here to
see your word" (`hold-pad`); the text button "Not Riya? ← Back" directly under the pad (until the first hold); and
the reserved space of the main button; "Tap instead" is at least 48 px from the main button's space at every size
And before the first 500 ms hold there is no word and no element with the main look (the pad included), and the two
reserved spaces are empty (`visibility: hidden`), in hold mode and tap mode alike, and in "See my word again"
(IMP-017)
And nothing on screen B moves after the first hold (guideline 45a): the bounding boxes of `pass-name`, `hold-pad`
and "Tap instead" are the same, to the pixel, before any hold, while held, and after "Done…" appears; after the
first hold "Not Riya? ← Back" is hidden (`visibility: hidden`), its space kept
When "Not Riya? ← Back" is tapped (before the first hold)
Then screen A of the same player shows again ("Pass the phone to" RIYA); nothing is recorded
And `hold-pad` spans the screen width minus 32 px (16 px gutters) and is at least 160 px tall at every size: 288 ×
160 at 320 × 568, 328 × 160 at 360 × 640, 358 × 160 at 390 × 844; at 812 × 375 it spans the right half minus 32 px
(374 × 160)
When Riya presses the pad (`pointerdown`)
Then the pad's text and accessible name become "Let go to hide" (for every role), and the private block (IMP-011)
is drawn at once, at every size, over the top part of screen B on an opaque layer: it covers the top bar,
`deal-progress`, the name and "Don't know this word?" (they return, unmoved, on release); it is never under the
finger and never off-screen
And the layer's top edge is the top of the viewport (y = 0) and its bottom edge is 8 px above the pad's top edge;
the block lies wholly inside it: at 320 × 568 the pad's top is at y = 268, so the layer runs from y = 0 to y = 260
and the block's bottom edge is at y ≤ 260; at 360 × 640, y = 0 to y = 332; at 390 × 844, y = 0 to y = 536 (the pad's
top is 300 px above the bottom edge: 160 + 8 + 48 + 8 + 60 + 16)
And at 812 × 375 the layer covers the whole top bar across the full width (y = 0 to 48, x = 0 to 812; the menu
button cannot be tapped while held) and the left half, x = 0 to x = 406, y = 0 to y = 375 (the block's right edge ≤
the pad's left edge)
When she lets go (`pointerup`)
Then the layer and the block leave the page at once (IMP-013), and the pad reads "Hold here to see your word" again
And the first time the block hides after showing for at least 500 ms without a break (by `pointerup`,
`pointercancel` or `pointerleave`), the main button "Done, pass to Arjun" and the text button "Don't know this
word?" appear in their reserved spaces and stay for the rest of her turn
And a hold under 500 ms shows and hides the block and adds nothing; any later hold of at least 500 ms adds them
And once they are shown, further holds of any length show and hide the block, and change nothing else
When she taps "Done, pass to Arjun"
Then screen A shows "Player 2 of 4", "Pass the phone to" ARJUN, "Everyone else, look away!" and "I'm Arjun", and so
on in seat order
And the last player's button reads "Done, everyone's seen" (IMP-016)
And no screen A or B ever shows the previous player's block
And a tap within 500 ms of any screen change on the deal screens (A, B, "No problem!", "Welcome back.") is ignored:
it records nothing and changes nothing (guideline 20), so a double tap on "Done…" never skips "Pass the phone to
ARJUN"; the 500 ms run from the moment the new screen is shown; the guard covers buttons only. The pad is not guarded: a
press within 500 ms works as at any other time
And inside the layer the block's lines have line-height 1.2, 4 px gaps between the 5 lines and no padding, starting at
y = 0; when the block would be taller than the layer, first lines 3, 4 and 5 shrink to 15 px, then `private-word`
shrinks to 30 px
Arithmetic (rule 4), screen B at 320 × 568: pad 160 + 8 + "Not Riya? ← Back" 48 + 8 + main button 60 + 16 = 300 px
from the bottom, so the pad's top is at y = 268 and the layer is 260 px tall (y = 0 to 260). Worst case, Larger text on, a
two-line line 3, line 4 and line 5: 22.8 (line 1, 19 px) + 86.4 (`private-word`, 2 × 36 × 1.2) + 2 × 50.4 (lines 3
and 4 at 21 px) + 45.6 (line 5 at 19 px) + 16 (gaps) = 271.6 px > 260, so lines 3–5 shrink to 15 px: 22.8 + 86.4 +
2 × 36 + 36 + 16 = 233.2 px, bottom at y ≤ 260; `private-word` stays 36 px. Larger text off: 18 + 86.4 + 2 × 40.8 +
36 + 16 = 238 px, no shrinking. Gaps on screen B (portrait): none between the top bar and `deal-progress`; 8 px between `deal-progress` and the name,
the name and "Tap instead", and "Tap instead" and "Don't know this word?"; 8 px between the pad and "Not Riya? ← Back"
and between it and the main button's space; 16 px under the main button. Above the pad, when the block is hidden:
48 + 21 + 8 + 28 + 8 + 48 + 8 + 48 = 217 px ≤ 268; "Tap instead" ends at y = 161 and the main button's space starts
at y = 492 (331 px apart)

## IMP-011: What each role sees: always five lines
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the word is Samosa (category Food, hint "Tea time", no other names)
Then while held, `private-block` has exactly 5 children, in this order, for every role and mode:

| Line | Crew, Easy | Impostor, Easy | Crew, Hard | Impostor, Hard |
|---|---|---|---|---|
| 1 (small line) | "Your secret" | "Your secret" | "Your secret" | "Your secret" |
| 2 (`private-word`) | "Samosa" | "You're the impostor" | "Samosa" | "You're the impostor" |
| 3 (body text) | "Category: Food" | "Category: Food · Hint: Tea time" | "Give one-word clues." | "Listen and blend in." |
| 4 (body text) | "Give one-word clues. Don't say it!" | "Listen, blend in, guess the word." | "Don't say it!" | "Guess the word if caught." |
| 5 (small line) | other names line | empty | other names line | empty |

And the impostor's line 4 above is for the last-chance guess on; with it off (the default) it reads, in Easy,
"Listen and blend in. Don't get caught!" and, in Hard, "Don't get caught!" (lines 1–3 and 5 unchanged)

And line 5 is "Also called " followed by `other_names` exactly as in `words.csv`, for example the word Pani puri gives
"Also called Golgappa / Puchka", and Kheer / Payasam gives "Also called Payesh"
And line 5 is an empty element of the same height as one small line when the word has no other names, and **always**
empty for the impostor
And the word shows exactly as in the list, both names included ("Kheer / Payasam", IMP-053)
And the category shown is the word's `category` exactly ("Films, music and TV")
And the impostor's block never contains the word or its other names

## IMP-012: The impostor's turn looks exactly like everyone else's
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then for crew and impostor alike: the same screens A and B, the same buttons in the same places, the same background
colour, the same five-line block with the same font sizes per line, `navigator.vibrate(10)` once on every
`pointerdown` on the pad while it reads "Hold here to see your word", or tap on it while it reads "Tap to see your
word" (never while it reads "Let go to hide" or "Tap to hide"), no sound when the block shows, and "Done…" appearing at the
same fake-clock moment for the same hold (guideline 45)
And `private-word` is a box exactly 2 × its line-height tall for every role (guideline 45a; F11), its text centred
horizontally and vertically; 36 px; with Larger text on, or for a word longer than 20 characters, it may be any
size from 30 px to 36 px; the text fits in 2 lines at every size ("You're the impostor" and the longest word,
"Mummy finding it in two seconds", included: at 320 px wide, 2 lines at 30 px)
And lines 1 and 5 are small lines (15 px; 19 px with Larger text) and lines 3 and 4 body text (17 px; 21 px with
Larger text) for every role
Property (sample 200 seeded deals of 4 players, Easy and Hard): before any hold, the `outerHTML` of screens A and B
for the impostor's turn equals that of a crew member's turn once player names and the `deal-progress` text are
replaced by placeholders;
tolerance 0 differences

## IMP-013: The word is never in the page except while held
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then from the first "Pass the phone to…" until the result screen shows the word (IMP-033, IMP-034, IMP-038, IMP-039),
none of these
is in `document.documentElement.outerHTML` or `document.title`, except inside `private-block` and `private-live`
while that player's block is shown: the round's word, each of its other names, its hint, "You're the impostor",
and (Hard) its category
And "in" means a case-insensitive match of each term as a whole phrase, with a word boundary at both ends; `localStorage` and script sources are not checked
And this holds on every screen reachable during a round: room screens, screen B before and between holds, the
menu, Settings, "How to play" and "See my word again" before a hold, and the build-up (History is not reachable
during a round, IMP-075)
And long-pressing the pad or the word opens no text selection, copy or look-up bubble, magnifier, context menu or
drag: the pad, `private-block` and their children have computed `user-select: none`, `-webkit-user-select: none`,
`-webkit-touch-callout: none`, `-webkit-user-drag: none`, the attribute `draggable="false"`, and a `contextmenu`
event on them is `defaultPrevented`
(A manual check on the owner's Android phone and an iPhone stays a release step, not a test.)
Tests choose words (by forced deals) whose word, other names and hint do not occur, as whole phrases, in the
Canonical strings.

## IMP-014: Tap to show, for players who can't hold
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the app Settings switch "Tap to show instead of hold" is on (kept on this phone, off by default)
Then on every screen B the pad reads "Tap to see your word" and "Tap instead" is not shown
And under that switch in Settings, only while it is on, the small line reads exactly
"Your screen reader will say the word out loud. Use earphones or turn the volume down."
Given the switch is off and Meena taps "Tap instead" on her screen B
Then her pad becomes "Tap to see your word" for her turn only; Kabir's turn starts in hold mode again
When "Tap to see your word" is tapped
Then the block shows and the pad reads "Tap to hide" (tapping "Tap to hide" does not vibrate)
When "Tap to hide" is tapped, or 8 s pass since the block was shown (t = 8 s after that tap)
Then the block hides and the pad reads "Tap to see your word" again
And the first hide (by either way) adds "Done, pass to …" and "Don't know this word?", as a 500 ms hold does
And showing again restarts the 8 s; every hide trigger of IMP-018 also hides it

## IMP-015: "Don't know this word?" redeals without giving anything away
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Meena (third in seat order) has held and sees the text button "Don't know this word?" under her name
When she taps it
Then a dialog asks "New word for everyone?" with "New word" and "Back" (main); nothing is recorded yet
When "Back" is tapped (or the dialog is closed by the browser's or phone's Back)
Then the dialog closes, her screen B is exactly as before, and nothing is recorded
When "New word" is tapped
Then `dontKnow` is recorded, which draws the new word and the new impostor by IMP-061 (the same player may be drawn
again), same players, same round number; a room screen shows "No problem! New word coming." and "Pass the phone back
to RIYA" (the first player in seat order), with the main button "I'm Riya"; tapping "I'm Riya" (no move) opens
Riya's screen B and the deal runs again from her
And this "No problem!" screen shows only after "New word"; "Deal again" (IMP-025) and the "left halfway" "Next round"
(IMP-091) go straight to the first player's screen A
And the menu on the "No problem!" screen is the deal menu (IMP-075)
And the button and the dialog have the same labels, place and behaviour on the impostor's screen B
And the word given up is not dealt again tonight (tonight's session), even after "Allow repeats" (IMP-052); it is not
listed in Settings' "Skipped words" (that list is IMP-107's)
And there is no limit on how many times it can be used in a round
And the starter is picked after the final deal (IMP-021)

## IMP-016: After the last player, straight to the clues
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the last player taps "Done, everyone's seen"
Then one room screen shows, top to bottom: "✓ Everyone has seen their word.", "Phone in the middle, face up.", the
starter and the clue order (IMP-020), and the main button "Clues done, talk it over" (Free flow) or
"Clues done, start timer" (Timer)
And the 3–5 player button of IMP-022 when it applies, the quiet "See my word again" (IMP-017), and the joining line of
IMP-079 when someone is waiting

## IMP-017: See my word again
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the clues screen, the talk screen or the picker is showing
When the host taps the quiet "See my word again" (on the clues and talk screens) or the menu item "See my word again"
(on all three)
Then a dialog "Whose word?" lists one button per player of this round in seat order, and a quiet "Cancel"
And the timer, if running, pauses at once (IMP-027)
When "Cancel" is tapped
Then the dialog closes and nothing else changes (the timer stays paused, showing "Carry on")
When "Meena" is tapped
Then screen A shows "Pass the phone to" MEENA with "I'm Meena", then screen B exactly as in the deal (IMP-010 to
IMP-014), and her main button reads "Done, back to clues" (opened from the clues screen), "Done, back to talking"
(the talk screen) or "Done, back to the vote" (the picker)
And neither screen shows `deal-progress` during "See my word again"; screen A still shows "Everyone else, look
away!"; screen B shows no "Don't know this word?" and no "Not Riya? ← Back"
When she taps "Done, back to …"
Then the screen it was opened from shows again, unchanged, with the timer paused
And there is no menu button from "Whose word?" until it returns
And if the page becomes hidden during it, on return it shows "Pass the phone to" MEENA (screen A) again
And it is not recorded as a move and changes no round state

## IMP-018: Hide triggers and the privacy cover
Status: approved, owner, 2026-10-04 (changed; detail of IMP-013)
Phase: Impostor 1
Given a player's block is shown (held, or tapped open)
When any of these happens: `pointerup`, `pointercancel` or `pointerleave` on the pad (hold mode); `scroll` on
`window`; `resize` or `scroll` on `window.visualViewport`; `visibilitychange` to hidden; `pagehide`
Then the block and `private-live` are emptied in the same event (before any later task)
And only a hide by `pointerup`, `pointercancel` or `pointerleave` after at least 500 ms adds "Done…" and "Don't know
this word?" (IMP-010); the other hides here (scroll, viewport resize or scroll, hidden page, `pagehide`) add nothing
And while `document.visibilityState` is hidden, `privacy-cover` is in the page: `position: fixed`, covering the whole
viewport, opaque, above everything; it is removed when the page is visible again
And a return to visible during the deal shows "Welcome back." (IMP-090)


## IMP-019: "Player 2 of 4" and "Everyone else, look away!"
Status: approved, owner, 2026-10-04 (changed; detail of IMP-010)
Phase: Impostor 1
Then screens A and B of the deal show `deal-progress` "Player N of M": N = the current player's position in this
round's seat order (1 for the first), M = the number of this round's players; 17 px text (21 px with Larger text),
centred; on screen A directly above "Pass the phone to", on screen B directly above the name
And `deal-progress` is not shown during "See my word again" (IMP-017)
And when the practice chip shows (IMP-071), it stays at the top left and `deal-progress` keeps its place
And after a redeal ("New word", "Deal again", "left halfway" "Next round") the deal shows "Player 1 of 4" again;
"Welcome back." (IMP-090) shows the progress of the player named
And screen A shows `look-away` "Everyone else, look away!" (20 px; 24 px with Larger text) directly under `pass-name`
on every screen A, "Welcome back." and "See my word again" included
And the "No problem! New word coming." screen shows neither line
And nothing else on screens A and B changes

---

## 03-clues-and-talk.md

## IMP-020: Who starts
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Riya, Arjun, Meena, Kabir and Zoya, and Meena starts
Then the clues screen shows `starter-name` MEENA, then "starts", then "Each say one word about your secret:", then
`clue-order` "Meena → Kabir → Zoya → Riya → Arjun" (seat order from the starter, wrapping round)
And the announcer says "Meena starts. Each say one word about your secret: Meena, Kabir, Zoya, Riya, Arjun"
And `starter-name` is 56 px at widths of 360 px and up and at 812 × 375 for names of up to 8 characters; for longer
names, and at 320 px wide, it may be any size from 32 px to 56 px; at 32 px it may wrap onto 2 lines; never cut off
And `clue-order` is body text; when its text is taller than the space left above the main button, it scrolls inside
its own box and the main button stays wholly on screen (20 names of 16 characters at 320 × 568 with Larger text
included)
And at 812 × 375 `starter-name` and "starts" sit in the left half; "✓ Everyone has seen their word.", "Phone in the
middle, face up.", "Each say one word about your secret:", `clue-order`, the IMP-022 button and the main button sit
in the right half
And in **Hard** mode the starter is never the round's impostor; in **Easy** mode the impostor may start
And at 812 × 375 "Go round again" and "See my word again" share one row (two equal halves) in the right half, and
"Not enough clues?" is not shown (the button alone)
And at 320 × 568 the order is: `starter-name`, "starts", then one box that scrolls inside its own height holding
"✓ Everyone has seen their word.", "Phone in the middle, face up.", "Each say one word about your secret:" and
`clue-order`; then "Not enough clues?", then "Go round again" and "See my word again" on one row (two equal halves),
then the joining line (IMP-079), then the main button
Arithmetic (rule 4), 320 × 568, 5 players, Larger text off: top bar 48 + `starter-name` (32 px, 2 lines) 77 +
"starts" 24 + the box 120 (5 lines: 24 + 24 + 24 + 48) + "Not enough clues?" 21 + shared row 48 + joining line 21 +
main button 76 + 8 gaps of 8 = 499 px ≤ 568 (with more players the box scrolls inside); at 360 × 640 and 390 × 844
the screen keeps the order of IMP-016 with "Go round again" and "See my word again" stacked: 48 + 48 + 77 + 24 + 24
+ 48 + 21 + 48 + 48 + 21 + 76 + 10 × 8 = 563 px ≤ 640; at 812 × 375 the right half: 48 + 24 + 24 + 24 + 48 + 48
(shared row) + 21 + 76 + 7 × 8 = 369 px ≤ 375

## IMP-021: The starter moves round, without repeats
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the starter is picked when the deal ends (after the last "Done"), by the starter seed, uniformly among players
who have not started in the current cycle and (Hard) are not this round's impostor
And when no player qualifies, a new cycle starts first (everyone becomes "not started"), then the pick is made
And a round counts for the cycle once its clues screen shows, the practice round included; a round redealt after
its clues screen showed ("Deal again") still counted
And a removed player leaves the cycle; a player who joins enters it as not yet started
Example (Hard, 4 players): Riya, Arjun and Meena have started; Kabir is this round's impostor; nobody qualifies, so a
new cycle starts and the starter is one of Riya, Arjun, Meena (each one third)
Property (1,000 seeded evenings of 20 rounds, 3 to 12 players, Easy and Hard): within one cycle nobody starts twice;
in Hard the starter is never the impostor; tolerance 0 failures

## IMP-022: One round of clues; a second round for 3 to 5 players
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given 3, 4 or 5 players
Then the clues screen has the quiet button "Go round again", placed in the bottom bar directly above the main button
(not under `clue-order`), with the small line "Not enough clues?" (15 px; 19 px with Larger text) directly above
it, except at 812 × 375 (IMP-020) (product owner, 4 October,
after Jev's confusion flags: the old label in the middle of the screen read as the first step)
When it is tapped
Then the line "Second round: MEENA starts again" (the same starter) appears under `clue-order`, the button disappears
for the rest of the round, and nothing else changes (recorded as `anotherRoundOfClues`)
Given 6 or more players
Then the button is not shown

## IMP-023: Free flow
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Talking is Free flow
When "Clues done, talk it over" is tapped on the clues screen
Then the talk screen shows the heading "Talk it over" (`talk-heading`), "Who sounded unsure?", the quiet "See my word
again" (IMP-017), the joining line of IMP-079 when someone is waiting, and the main button "Vote now", with no timer
And `talk-heading` is 56 px at widths of 360 px and up (it may wrap onto 2 lines); at 320 px wide it may be any size
from 32 px to 56 px
And nothing on this screen changes by itself (guideline 28)

## IMP-024: Timer
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Talking is Timer
When "Clues done, start timer" is tapped (t = 0)
Then the talk screen shows `timer-label` "Talk it over" (28 px) directly above `timer`, which reads "2:00" (m:ss)
and counts down once per second: "1:59" at t = 1 s … "0:00" at t = 120 s, with the main button "Vote now" and the
quiet "Pause", the quiet "See my word again" (IMP-017) and the joining line of IMP-079 when someone is waiting;
there is no `talk-heading` and no "Who sounded unsure?"
And `timer` is 120 px (112 px at 320 px wide)
And at "1:00" the announcer says "1 minute left"
And at "0:00": `timer` stays showing "0:00"; the heading "Time's up!" (h1, 40 px, never shrinks) appears directly
under `timer`; sound `chime` plays once (if sound on);
the announcer says "Time's up"; the main button "Vote now" is replaced by "Get ready to point"; "Pause" is replaced
by the quiet "1 more minute"
When "1 more minute" is tapped (no move)
Then `timer` reads "1:00" and counts down again; "Time's up!" goes; the main button reads "Vote now"; "Pause"
returns; at "0:00" everything above happens again ("1 more minute" has no limit; no "1 minute left" announcement
for an added minute)
And it never moves on to the vote by itself (guideline 48): "0:00" stays until a tap
And "Vote now" and "Get ready to point" both start the countdown (IMP-030)
And there is no menu from t = 0 of the countdown (IMP-075); the menu is available during the timer
And at 812 × 375 `timer-label`, `timer` and "Time's up!" sit in the left half; the buttons in the right half
Arithmetic (rule 4), 812 × 375: left half 48 (top bar) + 34 + 132 (`timer`, 120 px) + 40 = 254 px ≤ 375; portrait
320 × 568: 48 + 34 + 124 + 40 + 21 + 48 + 48 + 21 + 76 + 8 gaps of 8 = 524 px ≤ 568

## IMP-025: Deal again with a new word
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host opens the menu during a round (deal, clues, talk or picker) and taps "Deal again with a new word"
Then a dialog asks "Deal again? This round won't count. For when someone said the word or saw a screen." with
"Deal again" and "Keep playing" (main)
When "Keep playing" is tapped
Then the dialog closes and nothing changes (a running timer kept running while the dialog was open)
When "Deal again" is tapped
Then the deal starts again from the first player in seat order with a new word and a new impostor (IMP-061), the same
players and round number, and no points; recorded as `dealAgain`
And the dealt-again word stays used tonight (IMP-051)

## IMP-027: The timer pauses
Status: approved, owner, 2026-10-03 (detail of IMP-024)
Phase: Impostor 1
Given the timer is running at "1:30"
When "Pause" is tapped
Then `timer` stays at "1:30", "Pause" becomes "Carry on", and the small line "Paused · Tap to carry on" shows under
the timer
When "Carry on" is tapped
Then counting resumes from "1:30" (the next change, to "1:29", 1 s later), "Pause" returns and the small line goes
And the timer also pauses, exactly as if "Pause" were tapped, only when the page becomes hidden (and so when the
evening is reopened, IMP-091) and when "See my word again" opens (IMP-017); dialogs ("Deal again?", "End now?",
"Players"), the menu, "How to play" and Settings never pause it; it never catches up for time spent paused (guideline 34);
only "Carry on" resumes it
And the remaining time is kept in `pgn.impostor-ui.<id>` (`timerMs`), not as a move and not in the saved record

---

## 04-vote-and-reveal.md

## IMP-030: The countdown to point
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Vote now", "Get ready to point", "Point again: …" (IMP-032) or "Count again" (IMP-031) (t = 0)
Then the countdown screen shows: the heading `countdown-heading` "Get ready to point…" (40 px) from t = 0; `countdown-number` "3" at t = 1 s,
"2" at t = 2 s, "1" at t = 3 s, "Point!" at t = 4 s; and the picker opens by itself at t = 6 s (a countdown started by
a tap, guideline 48)
And `countdown-number` for "3", "2", "1" is 200 px in portrait and 160 px at 812 × 375; "Point!" is 96 px
(72 px at 320 px wide)
And sound `tick` plays at t = 1, 2 and 3 s and `ding` at t = 4 s (if sound on); with phone voice on, "3", "2", "1"
and "Point!" are spoken at the same moments; the announcer says "3", "2", "1", "Point!"
And with reduced motion the numbers change with no transform and no transition
And there is no menu and no main button on the countdown screen
And if the page is hidden during the countdown, on return it starts again from "Get ready to point…" (t = 0)

## IMP-031: Recording who got the most fingers: pick, then reveal
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the picker shows the heading "Who got the most fingers?", one button per player in seat order (two columns,
each button 56 px tall, 8 px apart); 24 px below the last name button the label "Not sure?" (body text); under it,
side by side and of equal width, the text buttons "It's a tie" and "Count again" (48 px tall, no outline, so they
never look like names); and the main button "Reveal", disabled
Arithmetic (rule 4), 390 × 844, 12 players, Larger text off: top bar 48 + heading 70 + 6 rows × 64 = 384 + 24 + 24 +
48 + main button 76 + 3 gaps of 8 = 698 px ≤ 844
And at 812 × 375 the heading and the names box (two columns, scrolling inside its own box) sit in the left half;
"Not sure?", "It's a tie" (or "Still a tie"), "Count again" and the main button sit in the right half
When the host taps Arjun
Then Arjun is selected (outline, ✓, tint, `aria-pressed="true"`), nothing is revealed, and the main button reads
"Reveal Arjun", enabled
When the host taps Meena
Then the selection moves to Meena (Arjun `aria-pressed="false"`) and the main button reads "Reveal Meena"
And tapping the selected name again changes nothing
When the host taps "Count again"
Then the selection is cleared and the countdown runs again (IMP-030), then this same picker
When the host taps "Reveal Arjun"
Then the result screen starts (IMP-033, IMP-034 or IMP-039; guideline 47); recorded as `reveal`

## IMP-032: A tie gets one re-vote
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "It's a tie"
Then the picker switches to ticking 2 or more names: the heading reads "Tap everyone who is tied"; "It's a tie" is
replaced by the text button "Not a tie" ("Not sure?" and "Count again" stay), any selection is cleared, and the main
button reads "Point again", disabled
And tapping a name ticks it (`aria-pressed="true"`); tapping a ticked name unticks it
And with 2 or more ticked, the main button reads "Point again: " plus the ticked names in seat order, joined by ", "
with " or " before the last: "Point again: Arjun or Meena", "Point again: Arjun, Meena or Kabir"; every player may be
ticked
When "Not a tie" is tapped
Then the picker goes back to picking one name: the heading reads "Who got the most fingers?", all ticks are cleared,
"It's a tie" returns, and the main button reads "Reveal", disabled; nothing is recorded
When "Point again: Arjun or Meena" is tapped
Then the countdown runs (IMP-030); recorded as `tie`
And then the re-vote picker shows only Arjun and Meena, "Not sure?" with the text buttons "Still a tie" and "Count
again", and the main button
"Reveal" (disabled until one is picked, then "Reveal Arjun"), picking one name as in IMP-031
And "Count again" here runs the countdown again and returns to this re-vote picker
And "Count again" in tie mode (before "Point again") clears the ticks, runs the countdown and returns to the
one-name picker of IMP-031
When the host taps "Still a tie"
Then the impostor escapes (IMP-038); recorded as `stillTie`
And there is never a second re-vote

## IMP-033: Caught: one result screen, the word shown at once
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor, the word is School trip (other names "Excursion", category "School and childhood"),
and the last-chance guess is off (IMP-076)
When "Reveal Arjun" is tapped (t = 0; recorded as `reveal`, which completes the round)
Then the result screen shows only `build-up` "Arjun was…" from t = 0 to t = 1.5 s; sound `drumroll` plays once at
t = 0 (if sound on); `body`'s background colour does not change; there is no menu button and no main button
And at t = 1.5 s the build-up is replaced, all at once, by, top to bottom:
1. `result-headline` "✓ Caught!"
2. `result-impostor` "ARJUN was the impostor"
3. `word-label` "The word was", then `result-word` "School trip"
4. `also-called` "Also called Excursion" (only when the word has other names; not announced)
5. `word-category` "School and childhood" (the word's `category` exactly; not a button)
6. `round-outcome` "You caught the impostor!" (h2)
7. `evening-line` (Score No, IMP-040) or `round-points` and `scoreboard` (Score Yes, IMP-044)
8. the quiet "This word didn't work" (IMP-107); and the main button "Next round", pinned; the menu button returns
And sizes: `build-up` 40 px; `result-headline` 56 px, centred (44 px at widths below 390 px, always one line); `result-note` 20 px; `result-impostor` 32 px, centred
(it may wrap onto 3 lines); `word-label` body text; `result-word` 44 px, centred, fitting in 3 lines (a word over 12
characters may be any size from 32 px to 44 px); `also-called` small line; `word-category` 17 px (21 px with Larger
text) in an outlined chip directly below the word (and below `also-called` when shown); `round-outcome` 28 px;
`evening-line` and `round-points` body text
And there is no "Undo" and no guess step with the last-chance guess off (a reveal is never undone, guideline 47)
And the screen scrolls as one page (guideline 46a; IMP-081); no part of it has its own scroll area
And with reduced motion the build-up and the switch at t = 1.5 s happen with no transform, transition or animation
And nothing else appears later on this screen; it stays until "Next round" (or the menu) is used
Arithmetic (rule 4), 390 × 844, Score No, guess off, a word of up to 12 characters with no other names, a name of up
to 8 characters, Larger text off: top bar 48 + 67 + 77 (2 lines) + 24 + 53 + 36 + 34 + 24 + 48 + main button 76 + 9
gaps of 8 = 559 px ≤ 844, so it does not scroll; with Score Yes and 12 players (scoreboard 6 rows × 36 = 216,
`round-points` 24 in place of `evening-line`, and one more 8 px gap) 783 px ≤ 844. At 320 × 568 and 360 × 640, with Larger text, longer
words or names, or `also-called`, the page may scroll

## IMP-034: The result when the crew picked the wrong person
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor and the word is Samosa (category "Food", no other names)
When "Reveal Meena" is tapped (t = 0; recorded as `reveal`, which completes the round)
Then the build-up "Meena was…" shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by, top to bottom: `result-headline` "✗ Escaped!", `result-note` "Meena
was not the impostor.", `result-impostor` "ARJUN was the impostor", `word-label` "The word was", `result-word` "Samosa", no
`also-called`, `word-category` "Food", `round-outcome` "Arjun escaped!", then items 7 and 8 of IMP-033, with
IMP-033's sizes and scrolling
And there is no guess step and no "Undo", whatever the last-chance guess setting

## IMP-035: The room judges the last-chance guess
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on, Arjun was caught, the word is Pani puri, and IMP-039's verdict step shows
When the room agrees Arjun's guess "Samosa" is wrong and the host taps "Wrong guess"
Then `round-outcome` reads "You caught the impostor!"
When instead the host taps "Guessed right" (another name counts: "Golgappa" for Pani puri)
Then `round-outcome` reads "Arjun wins the round!"
And the app never judges the guess; it records only the tap
Given the last-chance guess is off
Then there is no guess, no verdict and no "Arjun wins the round!"

## IMP-036: Two impostors (after the play-test)
Status: approved, owner, 2026-10-03
Phase: Impostor later
Given 8 or more players and 2 impostors chosen
Then both impostors see "You're one of 2 impostors" and never who the other is
(The vote and reveal for two impostors are designed after the play-test.)

## IMP-037: Undo the verdict only, before the next round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on, Arjun was caught, and the result shows after a verdict ("Guessed right" or
"Wrong guess") (IMP-039)
Then the quiet buttons under the result read, in this order, "Undo" then "This word didn't work", above the main
button "Next round"
When "Undo" is tapped (engine `undo` of the `verdict` record)
Then `round-outcome`, the evening line or points, the scoreboard, "Undo", "This word didn't work" and "Next round"
go; "Guessed
right" and "Wrong guess" show again under the word, which stays shown; that verdict's points are taken back; the
round is not completed until a verdict is tapped again; the menu button goes (IMP-075); a "This word didn't work"
tapped before "Undo" stays recorded
And "Undo" stays offered until "Next round" is tapped or players or choices change (`setPlayers`, `setChoices`),
including after the evening is reopened (IMP-091) or after "Oops, keep playing" (IMP-101)
And "Undo" is never offered with the last-chance guess off, nor on an escaped or "Still a tie" round
And a reveal is never undone (it is protected by "Reveal Arjun", IMP-031), and a deal is never undone (use "Deal
again with a new word")

## IMP-038: "Still a tie": the impostor escapes
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor, the word is Samosa, and the re-vote picker is showing
When "Still a tie" is tapped (t = 0; recorded as `stillTie`, which completes the round)
Then the result screen shows at once, with no build-up and no `drumroll`, top to bottom: `result-headline`
"✗ Escaped!", `result-note` "Still a tie.", `result-impostor` "ARJUN was the impostor", `word-label` "The word was",
`result-word` "Samosa", `word-category` "Food", `round-outcome` "Arjun escaped!", then items 7 and 8 of IMP-033,
with IMP-033's sizes and scrolling
And the round is escaped (+2 to Arjun when keeping score); there is no guess step and no "Undo"

## IMP-039: The last-chance guess, when it is on
Status: approved, owner, 2026-10-04 (changed; detail of IMP-033)
Phase: Impostor 1
Given the last-chance guess is on (IMP-076), Arjun is the impostor and the word is School trip
When "Reveal Arjun" is tapped (t = 0; recorded as `reveal`)
Then the build-up shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by: `result-headline` "✓ Caught!", `result-impostor` "ARJUN was the
impostor", `guess-line` "Last chance, Arjun! Guess the word out loud. Get it right and you win the round." (20 px)
and the main button "Arjun guessed. Show the word"; the word is not in the page (IMP-013); there is no menu button
When "Arjun guessed. Show the word" is tapped (recorded as `showWord`)
Then that button goes and, under those lines, `word-label` "The word was", `result-word` "School trip",
`also-called` "Also called Excursion" and `word-category` "School and childhood" appear, with two quiet buttons of
equal size side by side, "Guessed right" and "Wrong guess"; neither has the main look (IMP-080)
When a verdict is tapped (recorded as `verdict`, which completes the round)
Then the two buttons go and these appear under the chip, at once: `round-outcome` "You caught the impostor!" ("Wrong guess")
or "Arjun wins the round!" ("Guessed right"), then item 7 of IMP-033, then the quiet "Undo" (IMP-037), the quiet
"This word didn't work" and the main button "Next round"; the menu button returns; the page scrolls so that
`round-outcome` is wholly in view
And every line shown stays on the screen until "Next round"; sizes and scrolling as in IMP-033
And when the vote revealed a crew member, or the re-vote ended "Still a tie", there is no guess step: IMP-034 and
IMP-038 apply unchanged

---

## 05-scoring.md (C3)

## IMP-040: No points by default
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score is No
Then no points, ranks or scoreboard show anywhere in the evening
And each counted round's result screen shows `evening-line` "This game: impostor caught 3 · escaped 2": the counts of
this evening's counted rounds, this round included
And the practice round's result shows no `evening-line`
And `evening-line` is never shown while Score is Yes

## IMP-041: Points when keeping score
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score is Yes
Then each counted round scores exactly (`scoreRound`): escaped (wrong person or "Still a tie"): the impostor +2;
caught with the last-chance guess off: every crew member of that round +1; with it on, caught and "Guessed right":
the impostor +1; caught and "Wrong guess": every crew member of that round +1
And nobody else gets points; the practice round scores nothing
And the result screen shows this round's points and the evening's scoreboard (IMP-044)
And there is no target score: the evening ends only when the host ends it

## IMP-042: Points always add up
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Property (sample 1,000 seeded evenings of 1 to 30 rounds, 3 to 12 players, random outcomes, verdicts, undos,
joins, leaves and Score switches): every player's total equals the sum of their points in the rounds that were
scored; each round's points equal `scoreRound` for its outcome; tolerance 0 differences

## IMP-043: Turning score on or off mid-evening
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Score was No for rounds 1 to 3
When the host switches Score to Yes between rounds ("Change how we play", IMP-006)
Then rounds from round 4 score, and `scoreboard` shows the small line "Scores since round 4"
And "Scores since round N" names the evening's first scored round and shows only when N is greater than 1
When Score is later switched to No
Then `scoreboard` and `round-points` are hidden and `evening-line` shows instead; totals are kept unchanged
When it is switched to Yes again
Then scoring resumes from the next round, adding to the kept totals

## IMP-044: Scoreboard order and this round's points
Status: approved, owner, 2026-10-04 (changed; detail of IMP-041)
Phase: Impostor 1
Then `round-points` shows this round's points: "+2 Arjun" (escaped), "+1 Arjun" (caught, guessed right: last-chance
guess on only), "+1 each: Riya, Meena, Kabir" (caught, with no guess or a wrong guess; that round's crew in seat
order)
And `scoreboard` lists every player of the evening, one `score-row` each, highest total first, ranked 1-2-2-4
(players with equal totals share the rank; the next rank skips), equal totals in seat order
And a player who left stays in the ranking by their total, like everyone else, greyed; among equal totals, current
players come first in seat order, then players who left, in the order they left
And a player who left and is added again with the same name (ignoring case) is a current player again, keeps their
old total, and is no longer greyed
And each row shows the rank, the name and the total, with `data-rank`, `data-name`, `data-points`
And each row has a minimum height of 36 px; a name that does not fit on one line wraps and the row grows; at widths of 360 px or less (320 × 568, 360 × 640) and at 812 × 375 (where the scoreboard
sits in the right half, IMP-081) the scoreboard is one column; at 390 px wide and more in portrait (390 × 844) it is
two columns of 50% each, the first column holding the first ceil(n / 2) rows in rank order and the second the rest
(12 players: 6 and 6; 7 players: 4 and 3; 3 players: 2 and 1)
And the scoreboard never has its own scroll area: the result screen scrolls as one page (guideline 46a, IMP-081)

---

## 06-words.md (C3)

## IMP-050: Words come from the list with the chosen audience
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Words is Whole family
Then only words with `audience` "family" are dealt
And with "+ Grown-ups", words with `audience` "family" or "grownups" are dealt
And only from categories switched on, and words with `nonveg` true only when "Include non-veg food" is on
Property (sample 10,000 seeded picks over random filters): every picked word passes the filter; tolerance 0

## IMP-051: No word repeats in an evening
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then within one evening no word is dealt twice, counting every dealt round: given-up ("Don't know this word?"),
dealt-again, practice and fresh-round words included, until the host taps "Allow repeats" (IMP-052)
Property (sample 1,000 seeded evenings of 30 dealt rounds, random filters, no "Allow repeats"): no word id appears
twice; tolerance 0

## IMP-052: Tonight's and recent evenings' words are avoided
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then each deal picks, uniformly by the word seed, from the first non-empty group among the words that pass IMP-050
and are not blocked (IMP-015, IMP-107):
1. not dealt in tonight's session and not dealt in the last 3 evenings;
2. not dealt in tonight's session but dealt in the last 3 evenings
And "the last 3 evenings" = the 3 most recently ended (not discarded) Impostor evenings on this phone; "dealt" counts
every dealt round, practice and redeals included
And the sets are fixed when the evening starts ("Start round", IMP-096 `excludedWords`); words dealt during the
evening join "dealt tonight" as they are dealt
When both groups are empty at the moment a word is needed
Then instead of "Pass the phone to…" the screen shows the heading
"You've played every word in these categories!", the line "Turn on more categories or + Grown-ups.", the main
button "Change categories" paired with the outlined "End game" in the bottom row exactly like the result's row
(IMP-077), the quiet "Allow repeats" directly above that row, and "← Home" at the top left
When "Allow repeats" is tapped (recorded as `allowRepeats`)
Then for the rest of the evening each deal picks uniformly among all words that pass IMP-050 and are not blocked,
and the deal starts
When "Change categories" is tapped
Then "How do you want to play?" opens with the current choices; its "Start round" records `setChoices` (when
something changed; no `nextRound`) and the same round is dealt again, same round number, with a word drawn under the
current choices; "← Back" there keeps the changes and does exactly what "Start round" does
And the menu on this screen is the between-rounds menu (IMP-075)
And when even "Allow repeats" would find no word (every allowed word blocked), "Allow repeats" is not shown

## IMP-053: Both names are shown where a thing has two
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the word is "Kheer / Payasam"
Then the crew's `private-word` reads exactly "Kheer / Payasam", line 5 reads "Also called Payesh", and the result
screen shows `word-label` "The word was" and `result-word` "Kheer / Payasam" (IMP-033)

## IMP-054: Every word in the list is valid
Status: approved, owner, 2026-10-04 (changed: the 4 October list)
Phase: Impostor 1
Then every row of `words.csv` (parsed as CSV, quoted fields allowed) and of `words.json` has: an id "IMPW-" plus
3 digits, unique; a non-empty word; a category that is one of the 9 (IMP-007), except retired rows, which may carry
a retired category name ("Travel and places", "Cricket and games", "Desi life"); audience "family" or "grownups";
nonveg "yes" or "no" (`true`/`false` in JSON); a non-empty hint that is not, ignoring case, the word, one of its
names (split on " / "), or one of its other names
And rows are never deleted from `words.csv`: a word taken out gets "yes" in a column `retired` (empty otherwise); a
retired word is never dealt (IMP-050, IMP-052) but still resolves for replay and History (IMP-096, IMP-105)
And no two rows (active or retired) have the same word, ignoring case; a renamed word gets a new id and its old row
is retired with its old word (IMPW-397 → IMPW-403 "Squeezing in one more", IMPW-402 → IMPW-404 "Screen time")
And `words.json` has exactly the rows of `words.csv`, in the same order, with `retired` as `true`/`false`: the
shipped list is `words.csv` as of 4 October 2026: 311 rows, 291 active (in the 9 categories of IMP-007) and 20
retired (`retired` = "yes")

## IMP-055: The shipped word list file
Status: approved, owner, 2026-10-03 (detail of IMP-054)
Phase: Impostor 1
Then the app ships `content/impostor/words.json`, built from `docs/games/impostor/words.csv` with a real CSV parser
And each entry is `{ "id": "IMPW-004", "word": "Samosa", "other_names": "", "category": "Food", "audience": "family",
"nonveg": false, "hint": "Tea time", "retired": false }`: `other_names` is the CSV text exactly ("" when empty, "Golgappa / Puchka"
otherwise)
And the CSV columns `difficulty`, `close_cousin`, `change` and `notes` are not in the file and not used by the app

---

## 07-secrets-and-seeds.md (C3)

## IMP-060: The word and the impostor come from their own seed
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each evening's setup has `seeds.word` (draws every word and impostor of the evening) and a separate
`seeds.starter` (draws every starter), used through the per-deal seed names of Test hooks item 1
(`${seeds.word}:word:${n}`, `${seeds.word}:impostor:${n}`, `${seeds.starter}:${n}`), both made fresh on the phone with `crypto.getRandomValues` when a new
evening's first "Start round" is tapped (except IMP-064); "Change how we play" and later rounds make no new seeds
And replaying an evening's `SavedGame` (IMP-096: setup plus move records) with the engine's `replay` gives exactly
the same words, impostors, starters, outcomes and points
Property (sample 500 seeded evenings with random moves): `replay` of the saved record equals the live result;
tolerance 0

## IMP-061: Impostor choice is fair, with no 3 in a row
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each dealt round's impostor is drawn uniformly (word seed) among the players who were not the impostor in
both of the last two completed rounds of the evening (`pickImpostor`)
And a redeal draws again by the same rule, and may draw the same player
Property 1 (sample 10,000 seeds, 4 players, no history): each player's share is 25% ± 1.5%
Property 2 (sample 10,000 seeds, 4 players, recent impostors [Riya, Arjun]): Arjun's share is 25% ± 1.5% (being
impostor last round never rules you out)
Property 3 (sample 10,000 seeds, 4 players, recent impostors [Arjun, Arjun]): Arjun's share is 0%; each other
player's 33.3% ± 1.5%
Property 4 (sample 1,000 seeded evenings of 30 rounds, 3 to 12 players): nobody is impostor in 3 completed rounds
running; tolerance 0

## IMP-062: The host sees nothing secret
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then IMP-013's check holds on every screen the host can reach during a round: screen A, screen B before a hold, the
clues, talk, countdown and picker screens, the build-up, the menu, Settings, "How to play" and the "Whose word?"
dialog
And `viewFor` the host viewer returns no word, hint, other name or impostor before the reveal (contract suite)

## IMP-063: Every crew member has the same word, every round one impostor
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Property (sample 1,000 seeded dealt rounds, 3 to 20 players): exactly one player's view says "You're the impostor";
every other player's view has the same word id; tolerance 0

## IMP-064: Test seeds work only in development and preview builds
Status: approved, owner, 2026-10-03 (detail of IMP-060)
Phase: Impostor 1
Given the release build (`npm run build -- --mode release`, as published to the families' link) and
`localStorage['pgn.test.seeds']` set
When an evening starts
Then the key is ignored: seeds are made fresh (IMP-060) and no `deals` entry is used
And `readTestSeeds(raw, true)` returns `null` for every `raw` (rule test)
Given a development or preview build and the key set as in Test hooks item 3
Then the evening's seeds and forced deals are exactly as given

---

## 08-room-host-and-teach.md

## IMP-070: How to play, on request
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then "How to play" never opens by itself
When the host taps the quiet "How to play" on "How do you want to play?", or the menu item "How to play" (IMP-075)
Then a sheet shows the heading "How to play", then the heading "Read this aloud" with these 4 lines in an ordered
list, exactly, in this order:
1. "Everyone sees the secret word except one impostor."
2. "Clockwise, say one word about it. Don't say the word!"
3. "Talk, then on 3, 2, 1 everyone points."
4. "Whoever gets the most fingers is revealed. Caught: you win. Wrong person: the impostor wins."
And under the list, one paragraph by mode: Easy "The impostor sees the category and a hint." / Hard "The impostor
sees nothing and never starts."
And then, only with the last-chance guess on, the paragraph "A caught impostor can win the round by guessing the
word."
And then the rules of IMP-072
And the main button "Done" closes the sheet and returns to the screen it was opened from, with nothing else changed
(a running timer keeps running, IMP-027)
And the quiet "Practice round first" (IMP-071) shows only when the sheet was opened from the choices screen of a new
evening (not from "Change how we play", IMP-006, and not from the menu)
And the text follows the choices selected on screen when opened from the choices screen, and the evening's current
choices when opened from the menu
And the sheet has no menu button; IMP-013's check holds while it is open

## IMP-071: Practice round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Practice round first" in "How to play" opened from a new evening's choices screen
Then the evening is created with the choices on screen and its first round is a practice round (records
`startDeal {practice: true}`), played exactly like a normal round, with the chip "Practice" (`practice-chip`) at the
top left of its deal, clues, talk, countdown, picker and result screens
And it has no round number (the round after it is round 1); it uses a word (which then counts as dealt tonight,
IMP-051); it counts for the starter cycle (IMP-021) and the impostor streak (IMP-061)
And it scores no points (no `round-points`, no `scoreboard` on its result) and is not in `evening-line`,
the summary line, fun lines or Share's counts
And with the last-chance guess on, a caught impostor in the practice round gets the guess step (IMP-039), scoring
nothing
And after its result, "Next round" deals round 1 with no chip
And a practice round can only be the first round of an evening

## IMP-072: The rules in "How to play" never show secrets
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then after the paragraphs of IMP-070, "How to play" shows an unordered list of exactly these 3 items, in this order,
the same in every mode and setting:
- "Not allowed: the word itself, a rhyme, a translation, or 'thing'."
- "Repeating someone's clue is allowed."
- "Kids may use up to 3 words."
And they never show a word, hint, other name or role (IMP-013)

## IMP-073: Sizes for the phone in the middle of the table
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then at every size, these sizes hold (guideline 46):

| Element | Size | May shrink when | Floor |
|---|---|---|---|
| `starter-name` | 56 px | name over 8 characters, or 320 px wide | 32 px (may wrap onto 2 lines) |
| `talk-heading` | 56 px | 320 px wide | 32 px |
| `pass-name` on screen A | 48 px | name would not fit in 1 line at 48 px | 32 px (may wrap onto 2 lines) |
| `pass-name` on screen B | 48 px | name would not fit in 1 line at 48 px (it never wraps) | 32 px; 20 px in portrait at heights of 640 px or less; a name still too wide at that floor shrinks just enough to fit on one line, never cut off (product owner, 4 October, as built) |
| "Time's up!" (h1) | 40 px | never | 40 px |
| `timer` | 120 px | 320 px wide: exactly 112 px | 112 px |
| `countdown-heading` "Get ready to point…" | 40 px | never | 40 px |
| `timer-label` | 28 px | never | 28 px |
| `countdown-number` "3" "2" "1" | 200 px portrait | 812 × 375: exactly 160 px | 160 px |
| `countdown-number` "Point!" | 96 px | 320 px wide: exactly 72 px | 72 px |
| `private-word` (box 2 lines tall) | 36 px | Larger text on, or word over 20 characters | 30 px |
| `build-up` | 40 px | never | 40 px |
| `result-headline` | 56 px | widths below 390 px, so it stays on one line on every font (product owner, 4 October) | 44 px |
| `result-impostor` | 32 px (may wrap onto 3 lines) | never | 32 px |
| `result-word` | 44 px | word over 12 characters | 32 px (fits in 3 lines) |
| `result-note`, `guess-line` | 20 px | never | 20 px |
| `round-outcome` | 28 px | never | 28 px |
| `deal-progress`, `word-category` | 17 px (21 px with Larger text) | never | 17 px |
| `look-away` | 20 px (24 px with Larger text) | never | 20 px |
| `also-called` | small line | never | 15 px |

And "may shrink" means the size is any value from the floor to the full size; with no listed reason it is exactly the
full size
And every row that may shrink also may shrink, on any row, when the screen's content is taller than the screen
(IMP-081 step 2)

## IMP-074: Late joiner and someone leaving
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given a round result is showing (between rounds)
Then a quiet text button "Players (5) ›" (5 = the current number of players) sits on the same row as `evening-line`
(Score No) or `round-points` (Score Yes), right-aligned; on the practice round's result (no `evening-line`, no
points) it sits alone, right-aligned, where `evening-line` would be; the menu item "Players" does the same
When the host taps it and adds Zoya
Then the sheet "Players" (the list, field and buttons of IMP-003, with its limits) shows Zoya at the end; ▲ ▼ move
her to her seat; the main button "Done" closes the sheet and records one `setPlayers` with the final list (nothing
is recorded when the list is unchanged); she is dealt in from the next round, at 0 points when keeping score (or
with her old total when she had left earlier, IMP-044)
When the host taps ✕ next to Kabir (4 or more players)
Then he is removed at once and the toast reads "Kabir left · Points kept · Undo" (keeping score) or "Kabir left ·
Undo" (not keeping score), for 5 s inside the sheet; "Undo" puts him back in the same seat; tapping "Done" while
the toast shows closes the toast with the sheet (he stays removed)
And his points stay on the scoreboard, greyed (IMP-044)
And when removing would leave 2 players (pending leavers counted as gone), tapping ✕ opens IMP-078's "3 players
needed." dialog
And on the "left halfway" screen (IMP-091) ✕ removes at once as between rounds (no "Finish this round first": there
is no round to finish)
When "Players" is opened from the menu during a round (deal, clues, talk or picker)
Then the same sheet opens for adding only: the field and "Add" work (IMP-079); ▲ ▼ are hidden; ✕ on a player of this
round opens IMP-078's "Kabir has to leave?" dialog; ✕ on a player added during this round removes them at once; a
pending leaver ("Finish this round first") is shown greyed, with no ✕, and cannot be cancelled

## IMP-075: The menu at each moment
Status: approved, owner, 2026-10-04 (changed; detail of IMP-006, IMP-017, IMP-025, IMP-093)
Phase: Impostor 1
Then "··· Menu" (top right) has exactly these items, in this order (the item that ends things last):

| Moment | Items |
|---|---|
| Deal (screens A, B, "No problem!", "Welcome back.") | How to play · Players · Deal again with a new word · Settings · Home (game is saved) · End game |
| Clues, talk (Free flow or Timer), picker | How to play · Players · See my word again · Deal again with a new word · Settings · Home (game is saved) · End game |
| Round result (between rounds), no-words screen (IMP-052) | How to play · Players · Change how we play · Settings · History |
| "left halfway" screen (IMP-091) | How to play · Players · Settings · History ("Players" opens the adding-only sheet of IMP-074) |

And "Home (game is saved)" opens Home at once, with no dialog and nothing recorded; the game stays unfinished
(IMP-001 label) and reopens by IMP-090 and IMP-091 (a running timer is paused, IMP-027)
And between rounds "End game" is not in the menu: it is the outlined button beside "Next round" (IMP-077); in the
mid-round menus "End game" opens IMP-093's dialog

And there is no menu button on "How to play", the countdown screen, during "See my word again", on the summary,
during the 1.5 s build-up, nor during the last-chance guess's guess and verdict steps (IMP-039); the result screen
has it (between-rounds items) once the round is completed
And History opened from the between-rounds menu has "← Back", which returns to the same screen
And there is no "← Back" during a round; the browser's or phone's Back button during a round keeps the same
screen and changes nothing


## IMP-076: More options: the last-chance guess
Status: approved, owner, 2026-10-04 (changed; detail of IMP-005)
Phase: Impostor 1
When the host taps the quiet "More options ›" on "How do you want to play?"
Then a sheet shows the heading "More options", the group "Last guess for a caught impostor" with two option buttons
"Off" and "On" (one selected: outline, ✓, tint, `aria-pressed="true"`; never the main look), the small line "A
caught impostor can win the round by guessing the word." under them, and the main button "Done"
And the selected option shows the choice on screen: off on this phone's first ever evening; otherwise from the last-used
choices (IMP-009), or the evening's choices in "Change how we play" and "Play again"
When "On" is tapped and then "Done"
Then the choice on screen becomes `lastGuess: true`; it is saved with the other choices when "Start round" is tapped
(`setChoices` between rounds, IMP-006); the button text "More options ›" does not change
And a change applies only on "Done"; closing the sheet any other way (tapping outside it, the browser's or phone's
Back) discards the change
And "Include non-veg food" stays in the Categories sheet (IMP-007)
And the setting changes exactly these and nothing else: the impostor's private line 4 (IMP-011), the guess step
(IMP-033, IMP-039, IMP-071), Undo (IMP-037), the +1 to the impostor (IMP-041, IMP-044), the menu during the guess
and verdict steps (IMP-075), the main look on the verdict step (IMP-080), the wake lock release (IMP-087), reopening
during the guess (IMP-091), the verdict kept in History (IMP-094, IMP-105), and the paragraph "A caught impostor can
win the round by guessing the word." in "How to play" (IMP-070)


## IMP-077: Between rounds: carry on, stop, or go Home
Status: approved, owner, 2026-10-04 (changed; detail of IMP-075, IMP-092; owner decision I25, guideline 47a)
Phase: Impostor 1
Given a between-rounds screen: a round result once the round is completed (IMP-033, IMP-034, IMP-038, IMP-039),
the "left halfway" screen (IMP-091) or the no-words screen (IMP-052)
Then the bottom row shows the main button "Next round" ("Change categories" on the no-words screen) and the outlined
"End game", and the top bar shows "← Home" at the top left (the menu button stays top
right)
And sizes and layout of the bottom row, pinned at the bottom with 16 px gutters and 16 px below:
- widths of 360 px and more in portrait (360 × 640, 390 × 844): one row, two equal halves 8 px apart, "End game" on
  the left, the main button on the right, both 60 px tall: (360 − 32 − 8) / 2 = 160 px each at 360 × 640, 175 px
  each at 390 × 844;
- 320 × 568: "End game" full width (288 px) and 48 px tall, 8 px above the full-width main button: the pinned area is
  16 + 60 + 8 + 48 = 132 px; the rest of the result screen scrolls as one page above it (guideline 46a);
- 812 × 375: one row in the right half: (406 − 32 − 8) / 2 = 183 px each, 60 px tall
And on the no-words screen the main button of that row is "Change categories" (IMP-052), with the quiet "Allow repeats"
above the row
When "End game" is tapped
Then the summary (IMP-092) shows at once, with no dialog; nothing is recorded until the summary is left (IMP-101);
"Oops, keep playing" (in "More ›") comes back to this screen exactly as it was; from the "left halfway" screen the
half-played round is dropped when `endEvening` is recorded
When "← Home" is tapped
Then Home opens; nothing is recorded; the game stays unfinished: Home's `unfinished-games` row and the resume card
on "What shall we play?" read "Impostor · Riya, Arjun +2 · round 5" and "Tap to resume" after round 4 (IMP-001: the
number the next deal will carry); resuming
returns to the same between-rounds screen (with "Undo" when its window is open, IMP-037)
And "← Home" and "End game" are never shown mid-round (deal, clues, talk, countdown, picker, build-up, the guess and
verdict steps); there, "End game" is only in the menu (IMP-093)
And the practice round's result has both
And a tap on a button within 500 ms of the guard window's start is ignored on every between-rounds screen (guideline
20; IMP-010); the window starts t = 1.5 s after "Reveal …"; at once after "Still a tie" or the verdict; when the
"left halfway" or no-words screen shows
And "End game" and "← Home" are not announced and change nothing else

## IMP-078: Someone has to leave mid-round; fewer than 3; no dead buttons
Status: approved, owner, 2026-10-04 (detail of IMP-074, IMP-025; owner decision I26, M4, M7, M26)
Phase: Impostor 1
Given a round is in progress (deal, clues, talk or picker) with Riya, Arjun, Meena, Kabir and Zoya
When the host opens "Players" (menu) and taps ✕ next to Kabir
Then a dialog asks "Kabir has to leave?" with "Deal again without Kabir" (outlined) and "Finish this round first"
(main); closing it (the phone's Back) changes nothing
And nothing in it, or after it, shows or hints whether Kabir is the impostor (same text and buttons whatever his role)
When "Finish this round first" is tapped
Then `leaveAfterRound {player: "Kabir"}` is recorded; Kabir stays in this round (clues order, vote, picker, scoring,
and any redeal of this round: "New word", "Deal again"); when a round reaches its result (IMP-033, IMP-034, IMP-038,
IMP-039) he is removed, his points kept, and the toast "Kabir left after this round" (4 s) shows when the result's
lines appear: at t = 1.5 s, at once after "Still a tie", or on the verdict when the last-chance guess is on
And when "End now" drops the round (IMP-093), he is removed too when `endEvening` is recorded, so he is not among
the final players ("Play again", IMP-103)
When "Deal again without Kabir" is tapped
Then `dealAgainWithout {player: "Kabir"}` is recorded (one move): Kabir is removed and the deal starts again from the
first player of the current list with a new word, impostor and starter (IMP-025, IMP-061, the next per-deal seed);
his points are kept, greyed
And after either button the Players sheet closes; names added in the sheet before it are recorded first
(`setPlayers`) and are dealt in by any new deal (IMP-079)
Given removing a player (mid-round or between rounds) would leave only 2 players, pending leavers counted as gone
When ✕ is tapped
Then instead a dialog says "3 players needed. Add someone, or end the game." with "End game" (outlined) and "Add a
player" (main)
And "Add a player" closes the dialog and focuses the Players sheet's name field; "End game" opens the summary
(mid-round: as "End now", IMP-093; between rounds: as IMP-077); nothing is recorded by either tap
And no enabled button on any Impostor screen silently does nothing: a tap either moves on or shows why not (a
disabled button shows its reason line, as "Add at least 3 players."); test seeds that do not fit the players are
ignored (Test hooks item 3), so a round can always start

## IMP-079: Someone arrives mid-round
Status: approved, owner, 2026-10-04 (detail of IMP-074; owner decision I26, M1)
Phase: Impostor 1
Given a round is in progress
When the host opens "Players" (menu) and adds Zoya, then taps "Done"
Then `setPlayers` with Zoya at the end is recorded at once; she is not in the deal in progress (not in its clue order,
not on its picker, no points from it); she is dealt in by the next deal, whichever comes first: a redeal of this
round ("New word", "Deal again", "Deal again without …") or the next round; at 0 points
And the clues, talk and picker screens of this round show `joining-line` "Joining next round: Zoya" (small line: 15 px;
19 px with Larger text), directly above the main button's area; several names are joined by ", " in the order added
("Joining next round: Zoya, Dev")
And the line is not announced and goes when the deal that includes her starts
And nothing else in the round changes
---

## 09-usability.md

## IMP-080: At most one main button, and it is the next step
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then every Impostor screen has at most one element with the main look, `data-testid="main-button"`, and it is the
next step (guideline 17a)
And exactly these have none: "What shall we play?" (cards), screen B until "Done…" appears (hold mode, tap mode and
"See my word again"), the countdown,
the 1.5 s build-up, the verdict step of the last-chance guess ("Guessed right" / "Wrong guess" look equal), and the "Start a new game?"
dialog (IMP-001)
And a destructive choice ("End now", "End game", "Discard", "Deal again") is never the main button

## IMP-081: Nothing scrolls during a round, except the result screen
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the deal, clues, talk, countdown and picker screens have no page scrolling at every size, with names of 16
characters, 3 to 20 players, the practice chip, the timer, and the longest word ("Mummy finding it in two seconds":
`private-word` fits in 2 lines, IMP-012)
And where content on those screens is taller than the screen, these give way, in this order, and nothing else:
1. `clue-order` and the picker's name list scroll inside their own boxes (IMP-020, IMP-082);
2. the room-screen names shrink to their floors (IMP-073)
And the result screen (and the summary, IMP-092) scrolls as one page (guideline 46a): the main button stays pinned at
the bottom; no element inside has its own scroll area; when the screen appears it is scrolled to the top (after the
last-chance guess's verdict: scrolled so `round-outcome` is wholly in view)
And the main button stays wholly on screen and fixed at the bottom on every screen
And at 812 × 375 the hold screen puts the block on the left (its layer also covers the whole top bar, menu button
included, IMP-010) and the pad, "Not Riya? ← Back" and "Done…" on the right ("Tap instead" and "Don't know this word?" under the name
on the left); the result
screen puts `result-headline`, `result-note`, `result-impostor`, the word, `also-called`, the chip and
`round-outcome` in the left half, and `evening-line` or `round-points` with the scoreboard, and the quiet buttons, in
the right half; the guess and verdict steps of IMP-039 do the same (lines and word left; "Arjun guessed. Show the
word", "Guessed right" and "Wrong guess" right)

## IMP-082: Lists of 12 to 20 players
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then at 390 × 844 with Larger text off and names of up to 8 characters, the picker ("Who got the most fingers?")
shows 12 players in two columns with no scrolling at all (arithmetic in IMP-031)
And otherwise (13 to 20 players, longer names, Larger text, smaller screens or landscape) the picker's names are two
columns and scroll inside their own box, the main button stays fixed at the bottom, and the heading stays wholly on
screen
And at 812 × 375 the layout is IMP-031's (heading and names box left; "Not sure?", the text buttons and the main
button right)
And the scoreboard follows IMP-044 (one or two columns; never its own scroll area)

## IMP-083: Screen readers
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then `announcer` (`aria-live="polite"`) receives exactly these, and nothing else:
- the clue order (IMP-020);
- "1 minute left" and "Time's up" (IMP-024);
- "3", "2", "1", "Point!" (IMP-030);
- "Arjun was…" once, at t = 0 of the build-up (IMP-033);
- at t = 1.5 s (at t = 0 after "Still a tie", IMP-038), in screen order: `result-headline`, `result-note` (when
  shown), `result-impostor`, "The word was Samosa" (`word-label` and `result-word` as one announcement) and
  `round-outcome` (IMP-033, IMP-034, IMP-038); with the last-chance guess: `result-headline`, `result-impostor` and
  `guess-line` (IMP-039);
- with the last-chance guess, after "Arjun guessed. Show the word": "The word was School trip"; after a verdict:
  `round-outcome`
And `also-called`, `word-category`, `deal-progress`, `look-away`, `evening-line` and `round-points` are never
announced
And `hold-pad` is a button whose accessible name is its visible text: "Hold here to see your word", "Let go to hide"
while held (or "Tap to see your word" / "Tap to hide")
And the player's block is put in `private-live` (`aria-live="assertive"`) only while it is shown on their own turn,
and emptied when it hides (IMP-018); `announcer` never receives a word, hint or role before the result screen
shows the word

## IMP-084: No flashing
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then sampled every 50 ms through the countdown, the build-up and the first 3 s of the result screen, no element's
computed background colour
changes more than 3 times in any 1 s window
And the result screens for caught, escaped and "Still a tie" have the same `body` background colour ("✓" and "✗" are
text, with no coloured background)

## IMP-085: Kind words
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then no Impostor text (every string in this file, every screen's text) contains, ignoring case, "liar", "loser",
"fooled", "stupid" or "bad clue"
And no Impostor screen shows the words "evening", "night" or "session" (case-insensitive, whole word) in its own
text; the word list's words, other names and hints (for example the hint "Late night") are not counted
And no Impostor screen shows the words "crew" or "steal" in its own text (M24)
And the `round-outcome` lines are exactly "You caught the impostor!", "Arjun wins the round!" and "Arjun escaped!"; the
`result-headline` is exactly "✓ Caught!" or "✗ Escaped!"

## IMP-086: A slipped finger costs nothing
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When a player's finger slips off the pad (`pointerleave` or `pointercancel`) while the block shows
Then the block hides at once, the pad shows again, and the player stays on their screen B
And the phone moves to the next player only on "Done…" (IMP-010); nothing else changes

## IMP-087: The screen stays awake during a round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then `navigator.wakeLock.request('screen')` is called when a round's first screen A shows, and again on every return
to visible while a round is in progress (guideline 32)
And the lock is released when the round is completed: at t = 1.5 s of the result screen (IMP-033, IMP-034), at once
on "Still a tie" (IMP-038), or, with the last-chance guess, on the verdict tap (IMP-039)
And it is requested again when "Undo" reopens the verdict (IMP-037), and released again on the next verdict
And when `navigator.wakeLock` is missing or refused, nothing else happens (no message)

## IMP-088: The choices screen at 320 × 568 and in landscape
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then on "How do you want to play?" each group is one row: the label in a 64 px column, then the two options sharing
the rest of the row equally (each at least 48 px tall), with only the selected option's line under it
And option text is 17 px (15 px at 320 px wide; with Larger text 21 px, and 17 px at 320 px wide); "Whole family"
fits on one line inside its 48 px-tall button at every size (at 320 px wide each option is (320 − 32 − 64 − 8) / 2 =
108 px wide)
And at 320 × 568, with Larger text on or off, the content above "Start round" (the four groups, the Categories
button and the row "More options ›" / "How to play") may scroll inside its own box; at the other sizes it scrolls
inside that box only with Larger text on; "Start round" stays fixed at the bottom and the page never scrolls
And at 812 × 375 the four groups sit in a 2 × 2 grid and "Start round" overlaps none of them (guideline 17b)

## IMP-089: Sounds, vibration and voice
Status: approved, owner, 2026-10-03 (detail of IMP-012, IMP-024, IMP-030, IMP-033)
Phase: Impostor 1
Then the only sounds in Impostor are `tick` (each countdown number), `ding` ("Point!"), `chime` (timer at 0:00) and
`drumroll` (start of the 1.5 s build-up after "Reveal …"), played only with sound on, and recorded in `window.__sounds` (Test hooks item 7)
And `chime` and `drumroll` peak gain ≤ `tick`'s peak gain
And no sound plays during the deal (screens A and B) for any role
And vibration is `navigator.vibrate(10)` on each press of the pad only (IMP-012)
And speech is used only for the countdown (IMP-030), only with phone voice on

---

## 10-lifecycle.md

## IMP-090: Interrupted during the deal
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Riya has tapped "Done" and Arjun has held but not tapped "Done"
When the page becomes hidden (phone locked, a call, another app) and visible again, or the page is reloaded, no more
than 3 hours after the round's last move (IMP-099)
Then the screen shows "Welcome back." and "Pass the phone to" ARJUN with the main button "I'm Arjun" (Arjun starts
his turn again at screen A), never a block
And this shows on every return from hidden during the deal and after every reload during the deal
And players who tapped "Done" are not asked again
And reopened more than 3 hours after the round's last move, IMP-091's "This round was left halfway." shows instead

## IMP-091: Interrupted later in a round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the app was closed (or reloaded) during the deal, clues, talk, countdown, picker, the build-up, or the guess
or verdict step of the last-chance guess (the deal within 3 hours: IMP-090)
When it is reopened no more than 3 hours after the round's last move
Then: clues and Free-flow talk show the same screen; Timer talk shows the timer paused at its saved value (IMP-027);
reopened after "Vote now" (or after a tie's "Point again"), the countdown always runs again from "Get ready to
point…" and then the picker opens with nothing selected (tie mode and ticks cleared, a re-vote stays a re-vote)
(product owner, 4 October)
And reopened after "Reveal …" or "Still a tie", the result screen shows with no build-up, exactly as at t = 1.5 s
(IMP-033, IMP-034, IMP-038)
And with the last-chance guess, reopened before "Arjun guessed. Show the word" was tapped it shows the two caught
lines and that button, with the word not in the page; after it, the word and the verdict buttons; after a verdict,
the full result with "Undo" (IMP-037)
And a return from hidden (without a reload) during the 1.5 s build-up shows the same as a reopen
When it is reopened more than 3 hours after the round's last move
Then the screen shows "This round was left halfway. Start a fresh round?" with the main button "Next round", the
outlined "End game" and "← Home" (IMP-077)
And "Next round" deals that round again with a new word and impostor under the same round number (recorded as
`dealAgain`); the menu is as IMP-075 lists for the "left halfway" screen (no "Change how we play"; choices can be
changed on the next round result)

## IMP-092: Ending and discarding the game
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps the outlined "End game" between rounds (IMP-077), or "End now" in IMP-093's dialog
Then the summary shows at once (nothing recorded yet: the game stays in progress while the summary shows, and
`endEvening` is recorded when the summary is left, IMP-101), top to bottom: the heading "That's the game!"; the lead
line `summary-line` (32 px, centred); the fun lines (IMP-095); the final `scoreboard` (when Score was Yes at any
point; with IMP-043's caption; columns as IMP-044); the quiet buttons, in this order, "Play something else", "Home"
and "More ›" (each full width, 48 px tall, 8 px apart); and the main button "Play again", pinned
And `summary-line` is:
- when Score was Yes at any point and the top total is at least 1: "Arjun wins the game with 2 points!" ("1 point");
  with a shared top total, the names in seat order: "Arjun and Meena share the game with 2 points!", "Arjun, Meena
  and Kabir share the game with 2 points!";
- otherwise: "Impostor caught 4 · escaped 3": the counts of caught and escaped counted rounds (Terms), as in
  `evening-line` (IMP-040)
And "More ›" opens a menu with "Oops, keep playing", "Share", "History", a divider, and "Discard this game" last
And the summary scrolls as one page (guideline 46a), has no menu button, and has no inner scroll area
When "Play again" is tapped
Then `endEvening` is recorded and a new game starts exactly as History's "Play again" does (IMP-103): "Who's
playing?" with this game's final players, then "How do you want to play?" with its final choices
When "Home" is tapped
Then `endEvening` is recorded and Home opens
When "Play something else" is tapped
Then `endEvening` is recorded and IMP-102 applies
And "History" (in "More ›") records `endEvening` and opens History
And once `endEvening` is recorded the game is kept in History (unless IMP-097 applies)
When "Discard this game" is tapped
Then a dialog asks "Discard this game? Its rounds and scores will be lost." with "Discard" and "Keep it" (main)
When "Discard" is tapped
Then the game and its scores are deleted from this phone (no `endEvening`; nothing kept), Home opens, and the game
is in neither History nor `unfinished-games`; its words do not count for IMP-052's "last 3 evenings"
Arithmetic (rule 4), 390 × 844, Score Yes, 12 players: top 16 + heading 40 + `summary-line` 2 lines 77 + 2 fun lines
48 + scoreboard 216 + caption 21 + 3 quiet buttons 160 + main button 76 + 6 gaps of 8 = 702 px ≤ 844 (no scroll);
at 320 × 568 the page scrolls (scoreboard one column: 12 × 36 = 432 px)

## IMP-093: Ending mid-round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "End game" in the menu during a round (deal, clues, talk or picker)
Then a dialog asks "End now? This round won't count." with "End now" and "Keep playing" (main)
When "End now" is tapped
Then the summary shows as in IMP-092; when `endEvening` is recorded (IMP-101) that round is dropped (no points,
not completed); "Oops, keep playing" returns to the round exactly where "End now" was tapped
And "Keep playing" closes the dialog with nothing changed (a running timer kept running while the dialog was open)

## IMP-094: What History keeps
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then a kept evening stores: players, choices, and for each completed round its word, impostor, who was revealed (or
"Still a tie"), the verdict (last-chance guess only), the points (when scored) and whether it was the practice round; plus its saved record
for exact replay (IMP-096)
And while an evening is in progress, History shows it as one `history-game` row containing "In progress", with no
rounds, words or names of impostors
And a completed round appears in History only once it is completed

## IMP-095: Fun lines at the end
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the summary shows these `fun-line`s, in this order, each only when its condition holds, at most these 2
(counted rounds only):
1. "Best impostor: Arjun, escaped 2 times": the player with the most escapes as impostor, when that is at least 1
   ("escaped 1 time"); equal counts: the first in seat order
2. "Most suspected: Meena, picked 3 times without being the impostor": the player revealed by the vote the most times while not the impostor, when that
   is at least 2; equal counts: the first in seat order
And "seat order" is the evening's final seat order, with players who left after everyone still playing, in the
order they left
Given 0 counted rounds
Then no fun lines show

## IMP-096: Saved evenings carry a format version
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then every evening is saved, at every move, as one engine `SavedGame` at the engine's current format
(`SAVED_GAME_FORMAT`, 2 on 3 October 2026; never format 1, which `readSavedGame` reads as an old Tambola game):
```json
{ "format": 2, "gameType": "impostor", "id": "…", "createdAt": 1791043200000, "updatedAt": 1791043212000,
  "status": "in-progress", "sessionId": "…",
  "setup": { "gameId": "impostor",
             "seeds": { "word": "3f9a0c…", "starter": "b71e44…" },
             "config": { "players": ["Riya", "Arjun", "Meena", "Kabir"],
                         "choices": { "mode": "easy", "talking": "free", "score": false, "words": "family",
                                      "categories": ["Food", "Festivals and occasions", "Around the house",
                                                     "Out and about", "Films, music and TV", "Sports and games",
                                                     "School and childhood", "Weddings and family", "Everyday moments"],
                                      "nonveg": false, "lastGuess": false },
                         "excludedWords": { "dealtTonight": ["IMPW-002"], "recent": ["IMPW-003"],
                                            "blocked": ["IMPW-018"] } } },
  "records": [ { "v": 1, "seq": 1, "at": 1791043200000, "by": "host", "move": { "type": "startDeal", "practice": false, "wordId": "IMPW-004" } },
               { "v": 1, "seq": 2, "at": 1791043212000, "by": "host", "move": { "type": "seen" } } ] }
```
And `status` follows PLT-001: "in-progress" while the evening runs (the summary included, IMP-101), "ended" after
`endEvening`; a discarded evening is deleted, not saved with a status (IMP-092)
And every move that deals a word records its `wordId` (Test hooks item 1); replay uses the recorded ids, so an evening
replays the same after later edits to `words.csv`
And a saved evening whose `choices` has no `lastGuess` reads as `lastGuess: true` (IMP-009 for stored last choices)
And a saved evening that no longer replays (refused by the rules, or an error while reading, for example a preview
evening from before 3.1 whose word ids are gone) is never offered anywhere: not on Home, not on "What shall we
play?", not in History (no row at all), not as tonight's names; opening the app never crashes on it
And `config.testDeals` may be present (development and preview builds only, Test hooks item 3); the rules use it
on replay exactly as live
And `config.players` and `config.choices` are those at the first "Start round"; later changes are `setPlayers` /
`setChoices` moves, so each round's players and choices follow from the records
And `config.excludedWords` holds the sets frozen at the first "Start round" (IMP-052): `dealtTonight` (dealt in
tonight's session), `recent` (dealt in the last 3 evenings), `blocked` ("This word didn't work" on this phone, and
"Don't know this word?" tonight)
And `readImpostorEvening(saved)` returns `{ players, choices, excludedWords, seeds, moves, status }` from it (Test
hooks item 1)
And a fixture `SavedGame` of this shape (in the Test clone) always opens with `readSavedGame` and the app, now and
after every later change (PLT-001, PLT-014). Note for the tester: regenerate the format fixture so every
word-dealing move carries `wordId`; a fixture without word ids is unreplayable and hidden

## IMP-097: An evening with no counted round is not kept
Status: approved, owner, 2026-10-04 (changed; detail of IMP-092, IMP-094)
Phase: Impostor 1
Given the summary shows (after "End game", "End now", or IMP-104) for an evening with no counted round (none,
or only the practice round)
Then it shows "That's the game!", `summary-line` "Impostor caught 0 · escaped 0" (whatever the Score choice; no
scoreboard), no fun lines, and "More ›" without "Share"; "Play again", "Play something else", "Home", and
"Oops, keep playing", "History" and "Discard this game" in "More ›" are still offered
And when `endEvening` is recorded the evening is deleted rather than kept in History, and its words do not count
for "the last 3 evenings"

## IMP-098: Plurals on the summary and in Share
Status: approved, owner, 2026-10-04 (changed; detail of IMP-092, IMP-106)
Phase: Impostor 1
Then with 1 counted round Share's first line reads "Impostor game · 1 round"
And "Arjun wins the game with 1 point!" / "… with 2 points!" in `summary-line`
And "escaped 1 time" / "escaped 2 times" in fun line 1

## IMP-099: Time limits, measured exactly
Status: approved, owner, 2026-10-04 (changed; detail of IMP-091, IMP-101, IMP-104)
Phase: Impostor 1
Then every limit is "more than" (strictly greater), measured with `Date.now()` against a move's `at`:
- 3 hours, IMP-090 and IMP-091: from the last move of the round in progress (its deal moves included); not used
  when `summaryShownAt` is set;
- 3 hours, IMP-101: from `summaryShownAt` (when the summary was first shown); then `endEvening` is recorded with
  `at` = the moment the limit is noticed (app open or next check). When `summaryShownAt` is set, this is the only
  limit that applies: reopened after it, `endEvening` is recorded and the summary shows without "Oops, keep playing";
  the IMP-091 "left halfway" screen never shows for such an evening, and IMP-104 does not apply;
- 12 hours, IMP-104: from the move that completed the last completed round (`reveal` with the last-chance guess off,
  `reveal` of a crew member, `stillTie`, or `verdict`), or from the first move when there is none
Example: a round whose last move was at 21:00:00.000 reopened at exactly 00:00:00.000 returns to the same step; at
00:00:00.001 it shows "This round was left halfway. Start a fresh round?"

---

## 11-after-the-game.md (shared rules: `specs/platform/01-lifecycle.md`, PLT-001 to PLT-029)

## IMP-100: After the round, the phone can rest
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the round is completed (IMP-087 names the moment for each result)
Then the wake lock is released exactly as IMP-087 says, and nothing still secret is on screen (the word and the
impostor are shown by then)

## IMP-101: Ended by mistake
Status: approved, owner, 2026-10-04 (changed; changed 3 October for engine fit; owner informed)
Phase: Impostor 1
Given the summary shows after "End game" (or "End now")
Then the evening is still in progress (`status` "in-progress", no `endEvening` yet), and `pgn.impostor-ui.<id>`
holds `summaryShownAt`
When the host taps "Oops, keep playing" (in "More ›")
Then the summary goes and the game is exactly where "End game" or "End now" was tapped (between rounds:
the same result screen, with "Undo" when its window is open, IMP-037); nothing is recorded and nothing is lost
And `endEvening` is recorded when the host leaves the summary screen: "Play again", "Home", "Play something else",
"History" (in "More ›"), or "Discard this game" then "Discard" (which deletes instead). "Share" does not leave it, and a share
sheet's return does not count
And when the app is closed and reopened while the summary was showing, the summary shows again until it is left,
with "Oops, keep playing" only within 3 hours of `summaryShownAt` (IMP-099); Home and "What shall we play?" list such
an evening as unfinished (IMP-001)
And 3 hours after `summaryShownAt` (IMP-099) `endEvening` is recorded by itself; the summary, if still on screen,
then has no "Oops, keep playing"
And History never offers to reopen an ended evening (PLT-008)

## IMP-102: Something else, with the same people
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Play something else" on the summary (IMP-092)
Then "What shall we play?" opens, and the next game's players arrive filled in (IMP-004, PLT-024)
And the Impostor evening belongs to tonight's session (PLT-016) and stays out of any money tally (PLT-023); the
session screen lists it as one `session-game` reading "Impostor · 7 rounds"
And when Tambola is picked and Tambola has an unfinished setup (PLT-006), that setup opens exactly as it was saved
(its own names); tonight's names fill only a new Tambola setup (product owner, 4 October)

## IMP-103: Play again another day
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given History lists only evenings that replay (evenings saved before version 3.1 without word ids are hidden,
IMP-096)
When the host taps "Play again" on a past game in History (PLT-009), or "Play again" on the summary (IMP-092)
Then "Who's playing?" opens with that evening's players in its final seat order (leavers left out), then "Next"
opens "How do you want to play?" with that evening's final choices (IMP-009)
And "Start round" starts a new game in tonight's session, silently (IMP-009), with the words of the last 3 evenings
avoided (IMP-052)

## IMP-104: An evening left open ends by itself
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given an evening was left unfinished
When the app is opened more than 12 hours after the move that completed its last round (IMP-099)
Then the evening is ended with `endEvening` (its `at` = the opening time) and kept in History with its completed
rounds; a half-played round is dropped (IMP-097 applies when there is no counted round)
And neither "What shall we play?" nor Home shows it as unfinished

## IMP-105: Looking back at an evening
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then History lists a kept Impostor evening as a `history-game` row reading "Impostor · 7 rounds"
When the host opens it
Then its heading shows the evening's date and start time once ("Sunday 4 Oct, 8:40 pm"); no round row repeats the
date; it shows the players, the choices, and one `history-round` per completed round in order, reading exactly:
"Round 3 · Samosa · Arjun caught" (no last-chance guess) / "Round 3 · Samosa · Arjun caught, guessed right" /
"Round 3 · Samosa · Arjun caught, wrong guess" / "Round 3 · Samosa · Arjun escaped"; the practice round reads "Practice · Samosa · Arjun escaped" (and so on); when
the round was scored, its `round-points` text follows on its own line ("+2 Arjun")
And the fun lines of IMP-095 and, when scored, the final scoreboard
And it can't be changed (PLT-008); it can be deleted (PLT-010) or cleared with all history (PLT-011)

## IMP-106: Share the game
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Share" (in "More ›" on the summary)
Then `navigator.share({ text })` is called once with this text, lines joined by "\n":
- "Impostor game · 7 rounds"
- "Impostor caught 4 · escaped 3"
- fun line 1 of IMP-095, only when it shows ("Best impostor: Arjun, escaped 2 times")
- "Words: " + the words of the completed rounds in round order (the practice round's first), at most 8, joined by
  ", ", with "…" right after the 8th word when there are more
Example (7 counted rounds, no practice):
```
Impostor game · 7 rounds
Impostor caught 4 · escaped 3
Best impostor: Arjun, escaped 2 times
Words: Samosa, Pet name, Cow on the road, Chai, Dosa, Idli, Mango
```
With 9 completed rounds the last line ends "…, Idli, Mango, Pani puri…" (8 words, then "…")
And names appear exactly as typed; the text has nothing else from the phone
When `navigator.share` is missing
Then `navigator.clipboard.writeText(text)` is called with the same text and the toast "Copied. Paste it into any
chat." shows for 4 s
And when the share sheet is closed without choosing an app, nothing else happens
And nothing is sent unless the host picks an app; it works with no internet (the message waits in that app)

## IMP-107: "This word didn't work"
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps the quiet "This word didn't work" on a round's result screen (practice included; the move itself
is legal from the round's `reveal` or `stillTie` until its `nextRound`, `dealAgain` or `endEvening`, with or without a
verdict, so it survives an "Undo" of the verdict, IMP-037)
Then that word is never dealt again on this phone (blocked; recorded as `wordDidntWork {blocked: true}`), and
the toast "Samosa won't come up again · Undo" shows for 5 s; "Undo" unblocks it (`wordDidntWork {blocked: false}`);
the button is gone for that round once tapped, and comes back after "Undo"
And Settings shows the heading "Skipped words (3)" (the count of blocked words; the heading is hidden at 0) and each
blocked word, newest first, each as the word followed by a button "Bring back" (accessible name "Bring back
Samosa"); tapping it removes that row at once with no toast and no dialog, lowers the count by 1, and the word can be
dealt from the next evening on (an evening in progress keeps its frozen blocked set)
And only "This word didn't work" words are listed and blocked for good; "Don't know this word?" words are not
(IMP-015)
And a problem report (PLT-200) may include the skipped words, so the list can be improved for everyone

## IMP-108: Nothing about the evening leaves the phone by itself
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then from "Who's playing?" until the summary is left, the page makes no request to any origin other than its own,
and no request to any origin has a URL or body containing a player's name or a word of the evening
And players, words and results leave the phone only through "Share" (IMP-106) or a problem report the host chooses to
send (PLT-200) (PLT-013)

## IMP-109: Settings for Impostor
Status: approved, owner, 2026-10-04 (changed; detail of IMP-014, IMP-107)
Phase: Impostor 1
Then the app's Settings (as reached today, or "Settings" in the menu) has the switch "Larger text" (off by default, kept on this
phone; body text 21 px and small lines 19 px when on, Terms), the switch "Tap to show instead of hold" with its
small line, shown only while it is on (IMP-014), and "Skipped words (N)" when N ≥ 1 (IMP-107)
And changing a setting mid-round takes effect when Settings closes ("Larger text") or on the next screen B (tap
mode), and never shows a word on any other screen
And closing Settings returns to the same screen with nothing else changed; opening the menu, "How to play" or Settings
does not pause a running timer

---

## Later (designed, not in the first release)

## IMP-200: Regional word themes
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then Full Desi, Tamil, Telugu, Malayalam, Kannada and Bengali themes can be chosen, each with its own list

## IMP-201: Each player's own script
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then on their own hold screen a player can switch the word's script; the choice is remembered for the evening

## IMP-202: Players' own phones (with connected mode)
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then each player sees "Hold here to see your word" on their own phone; the host phone shows only room screens

## IMP-203: Twist rounds
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then a rare optional twist: no impostor, or everyone an impostor, revealed at the end

## IMP-204: Undercover variant
Status: approved as direction, owner, 2026-10-03 (built later)
Phase: Impostor later
Then the impostor gets the word's close cousin instead of nothing, and may not know they are the impostor

## Note, 5 October (decision I27): the "left halfway" Players sheet
Detail of IMP-074, IMP-075 and IMP-078, as built: on the "left halfway" screen ▲ ▼ are hidden; ✕ on a player of the
half-played round takes them off in the sheet at once with the toast "Kabir left · Undo"; "Done" records `setPlayers`
only for names added; "Next round" then records one `dealAgainWithout {player}` for each player taken off (the last of
these is the fresh round), or `dealAgain` when nobody was taken off. "End game" from that screen before "Next round"
records nothing for those taken off, so the ended game still lists them; the summary's "Play again" leaves them out.
Two or more leavers after a round: one toast, "Kabir, Zoya left after this round".

