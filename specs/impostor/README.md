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

In this folder: copied unchanged from `docs/games/impostor/scenarios.md` (version 3.8) by the Test role, 4 October 2026,
one file per section heading. The game guide, journeys and screens are in `docs/games/impostor/` (`guide.md`,
`lifecycle.md`, `ux.md`); where they differ, these scenarios win. The words are `docs/games/impostor/words.csv`.

## Files

| File | Scenarios |
|---|---|
| [01-setup.md](01-setup.md) | IMP-001 – IMP-009 (9) |
| [02-deal.md](02-deal.md) | IMP-010 – IMP-019 (10) |
| [03-clues-and-talk.md](03-clues-and-talk.md) | IMP-020 – IMP-027 (7) |
| [04-vote-and-reveal.md](04-vote-and-reveal.md) | IMP-030 – IMP-039 (10) |
| [05-scoring.md](05-scoring.md) | IMP-040 – IMP-044 (5) |
| [06-words.md](06-words.md) | IMP-050 – IMP-055 (6) |
| [07-secrets-and-seeds.md](07-secrets-and-seeds.md) | IMP-060 – IMP-064 (5) |
| [08-room-host-and-teach.md](08-room-host-and-teach.md) | IMP-070 – IMP-079 (10) |
| [09-usability.md](09-usability.md) | IMP-080 – IMP-089 (10) |
| [10-lifecycle.md](10-lifecycle.md) | IMP-090 – IMP-099 (10) |
| [11-after-the-game.md](11-after-the-game.md) | IMP-100 – IMP-109 (10) |
| [12-later.md](12-later.md) | IMP-200 – IMP-204 (5) |


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
