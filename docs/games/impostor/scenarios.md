# Impostor: scenarios (version 3, 4 October 2026)

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
After approval the tester copies these into `specs/impostor/` (file names in each section heading) and writes tests.
**Hand-over only after the Tambola release** (`docs/roadmap.md`). Template: `specs/README.md`.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**

Phases: **Impostor 1** = the first release (one phone, the Multicultural list in `words.csv`). **Impostor later** =
designed now, built later.

Change classes (`docs/change-sop.md`): rules, secrets and seeds, saved evenings and the word list format = **C3**
(tests first; sections 05, 06, 07 and IMP-096); screens = C1/C2.

### What version 3 rewords or retires (rule 11)
- Retired in 3: "Caught red-handed! <NAME> was the impostor.", "Meena was crew!", "The impostor was <NAME>. Escaped!",
  "Still a tie! The impostor was <NAME>. Escaped!", the dots of the build-up (`build-up-dots`), the timed reveal
  steps (2.5 s, 4.0 s, 5.5 s, 7.0 s), the automatic "Read this aloud" card ("once per session"), "Start the deal",
  the menu item "Rules" (now "How to play").
- New strings in 3: "Caught! <NAME> was the impostor.", "Meena was crew.", "<NAME> was the impostor and escaped!",
  "Still a tie! <NAME> was the impostor and escaped!", "More options ›", "Last-chance guess", "Player 2 of 4",
  "Everyone else, look away!", "How to play" (button and menu item).
- Changed in 3: IMP-005, 008, 010, 011, 012, 013, 017, 031, 033, 034, 035, 037, 038, 041, 044, 070, 071, 072, 075, 080, 081,
  083, 084, 087, 091, 094, 099, 105. Reworded only, no change in behaviour: IMP-027, 040, 062, 089, 100, 107, 109.
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
| **Main button** | The one element with the solid main look (PLT-301; tests use `hasMainLook`). It carries `data-testid="main-button"` and is 60 px tall. In portrait it spans the screen width minus 16 px gutters and sits fixed at the bottom of the screen. At 812 × 375 it is 358 px wide, fixed at the bottom right (16 px from the right and bottom edges), and no other content lies under it. At most one is on screen (IMP-080). |
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
| **Last-chance guess** | The choice `lastGuess` (IMP-076), off by default: when on, a caught impostor may guess the word before it is shown (IMP-039). |
| **Caught / escaped** | **Caught**: the vote revealed the impostor (whatever the guess). **Escaped**: the vote revealed a crew member, or the re-vote ended "Still a tie". The practice round counts as neither. |
| **Evening** | One Impostor game: from the first "Start round" to ended or discarded. One saved game (engine `SavedGame`) per evening. "Change how we play" never starts a new evening. |
| **Tonight / tonight's session** | The session (PLT-016) the evening belongs to. "Tonight's" counts on the result screen count this evening's counted rounds only. |
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
`words.csv` has 291 rows (4 October 2026) in 9 categories: Food, Festivals and occasions, Around the house, Out and
about, Films, music and TV, Sports and games, School and childhood, Weddings and family, Everyday moments.

---

## Canonical strings
One wording per place. A test matches these exactly (names case-insensitively). `<Name>` is a player's name as typed;
`<NAME>` is the same name shown upper case by CSS. "·" is U+00B7 with one space either side; "…" is U+2026; "→" is
U+2192; "✓" is U+2713; "›" is U+203A; "–" in "3–20" is U+2013; apostrophes are U+0027.

| Where | Exact text | Element | ID |
|---|---|---|---|
| Home, under "Host a game" | "Tambola or Impostor on this phone" | text inside the "Host a game" button | IMP-001 |
| Home, unfinished row | "Impostor, 8:40 pm, round 4" and "Tap to resume" | inside `unfinished-games` | IMP-001 |
| What shall we play? | heading "What shall we play?" | h1 | IMP-001 |
| Tambola card | "Tambola" · "Housie on paper or phones · 2 hrs" | button, name starts "Tambola" | IMP-001 |
| Impostor card | "Impostor" · "Find who doesn't know the word · 3–20 players · about 4 min a round" | button, name starts "Impostor" | IMP-001 |
| Resume card | "Impostor · round 4 · Tap to resume" | button `resume-card` | IMP-001 |
| Join with my ticket, last line | "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!" | paragraph | IMP-002 |
| Who's playing? | heading "Who's playing?"; line "Sit in a circle. This is the passing and clue order." | h1; paragraph | IMP-003 |
| Name field | label "Player name", placeholder "Type a name…"; button "Add" | input (`maxlength="16"`); button | IMP-003 |
| Row buttons | "Move Riya up" (▲), "Move Riya down" (▼), "Remove Riya" (✕) | buttons, accessible names | IMP-003 |
| Messages | "Riya is already playing. Add an initial, like Riya S." · "Add at least 3 players." · "20 players is the most." | `role="alert"` paragraph | IMP-003 |
| Filled-in list | quiet "Clear list"; toast "List cleared · Undo" | button; `undo-toast` | IMP-004 |
| Choices | heading "How do you want to play?"; groups "Mode", "Talking", "Score", "Words" | h1; `role="group"` named by its label | IMP-005 |
| Options | "Easy" / "Hard"; "Free flow" / "Timer"; "No" / "Yes"; "Whole family" / "+ Grown-ups" | buttons with `aria-pressed` | IMP-005 |
| Option lines | Easy "The impostor gets the category and a hint." · Hard "The impostor gets nothing and never starts." · Free flow "Talk as long as you like, then tap Vote now." · Timer "Two minutes to talk, then a chime." · No "Just play. We count catches and escapes." · Yes "Points every round, totals for the night." · Whole family "Words kids and grandparents know." · + Grown-ups "Adds words kids or elders may not know." | small line under the group | IMP-005 |
| Categories row | "Categories: all 9 ›" / "Categories: 7 of 9 ›" | button | IMP-007 |
| Categories sheet | heading "Categories"; 9 switches named exactly as the categories; switch "Include non-veg food"; message "Keep at least one category."; main "Done" | `role="switch"` each | IMP-007 |
| More options | quiet "More options ›"; sheet heading "More options"; switch "Last-chance guess" with small line "A caught impostor can guess the word to steal the round."; main "Done" | button; `role="switch"` | IMP-076 |
| Choices, How to play | quiet "How to play" (directly above "Start round") | button | IMP-070 |
| Choices main | "Start round" | main button | IMP-005 |
| How to play (no menu) | heading "How to play"; heading "Read this aloud" and 4 lines (IMP-070); the rules (IMP-072); main "Done"; quiet "Practice round first" (only from the choices screen of a new evening) | h1; h2 and `ol` with 4 `li`; paragraphs | IMP-070, 071, 072 |
| No words left | heading "You've played every word in these categories tonight!"; line "Turn on more categories or + Grown-ups."; main "Allow repeats"; quiet "Change categories" | h1; paragraph | IMP-052 |
| Deal, screen A | "Player 2 of 4" (top left); "Pass the phone to" and `<NAME>`; "Everyone else, look away!"; main "I'm <Name>" | small line `deal-progress`; paragraph; `pass-name`; paragraph; main button | IMP-010, 019 |
| Deal, after a return | "Welcome back." above screen A | paragraph | IMP-090 |
| Deal, screen B | "Player 2 of 4" (top left); `<NAME>` at the top; pad "Hold here to see your word"; quiet "Tap instead" | heading; button `hold-pad`, accessible name = its visible text | IMP-010, 083 |
| Deal, after the first hold | main "Done, pass to <Name>" (last player: "Done, everyone's seen"); quiet "Don't know this word?" | main button; quiet button | IMP-010, 015 |
| Tap mode | "Tap to see your word" / "Tap to hide" | button `hold-pad` | IMP-014 |
| Private block | IMP-011 table | `private-block`, 5 children | IMP-011 |
| Redeal | "No problem! New word coming." · "Pass the phone back to <NAME>"; main "I'm <Name>" | h1; paragraph | IMP-015 |
| Clues | "✓ Everyone has seen their word." · "Phone in the middle, face up." · `<NAME>` · "starts" · "then clockwise: Meena → Kabir → Zoya → Riya → Arjun" | paragraphs; `starter-name`; paragraph; `clue-order` | IMP-016, 020 |
| Clues main | "Talk it over" (Free flow) / "Start the 2-minute timer" (Timer) | main button | IMP-016 |
| Second round | quiet "Another round of clues"; then line "Second round: <NAME> starts again" | button; paragraph | IMP-022 |
| Talk, Free flow | heading "Talk it over"; "Who sounded unsure?"; main "Vote now" | h1 `talk-heading`; paragraph | IMP-023 |
| Talk, Timer | `timer` "2:00"…"0:00" (no `talk-heading`); main "Vote now"; quiet "Pause" / "Carry on"; small line "Paused · Tap to carry on"; heading "Time's up!"; main "Get ready to point" | `timer`; buttons; small line; h1 | IMP-024, 027 |
| Countdown | "Get ready to point…" then "3", "2", "1", "Point!" | h1 then `countdown-number` | IMP-030 |
| Picker | heading "Who got the most fingers?"; one button per name; quiet "It's a tie", "Count again"; main "Reveal" (disabled) / "Reveal <Name>" | h1; buttons with `aria-pressed` | IMP-031 |
| Tie | main "Point again" (disabled) / "Point again: Arjun or Meena" / "Point again: Arjun, Meena or Kabir"; re-vote quiet "Still a tie" | main button; quiet button | IMP-032 |
| Build-up | "<Name> was…" | `build-up` | IMP-033 |
| Caught | "Caught! <NAME> was the impostor." | `reveal-line` | IMP-033 |
| Word | "The word was School trip." · small line "Also called Excursion" · category chip "School and childhood" | `reveal-line`; `also-called` (not a reveal line, not announced); `word-category` | IMP-033 |
| Last-chance guess | "Last chance, <Name>! Guess the word out loud. Get it right and you steal the round." · main "<Name> guessed. Show the word" · "Guessed right" / "Wrong guess" | `reveal-line`; main button; two quiet buttons | IMP-039 |
| Wrong person | "Meena was crew." · "<NAME> was the impostor and escaped!" | `reveal-line` each | IMP-034 |
| Still a tie | "Still a tie! <NAME> was the impostor and escaped!" | `reveal-line` | IMP-038 |
| Result headline | "The crew wins!" · "<Name> steals the round!" · "<Name> escaped!" | h2 `round-outcome` | IMP-035, 034 |
| Result, Score No | "Tonight: impostor caught 3 · escaped 2" | paragraph `evening-line` | IMP-040 |
| Result, Score Yes | "+2 Arjun" · "+1 Arjun" · "+1 each: Riya, Meena, Kabir"; caption "Scores from round 4" | `round-points`; small line in `scoreboard` | IMP-044, 043 |
| Result buttons | main "Next round"; quiet "Undo" (after a verdict, last-chance guess only); quiet "This word didn't work"; toast "Samosa won't come up again · Undo" | buttons; `undo-toast` | IMP-037, 107 |
| Players sheet | heading "Players"; main "Done"; toast "Kabir left · Undo" / "Kabir left · Points kept · Undo"; message "Keep at least 3 players." | h1; `undo-toast`; `role="alert"` | IMP-074 |
| Players, mid-round | "Change players after this round." with main "OK" | dialog | IMP-074 |
| Menu button | "··· Menu" | button, name contains "Menu" | IMP-075 |
| Menu items | "How to play" · "Players" · "See my word again" · "Deal again with a new word" · "Change how we play" · "Settings" · "History" · "End the evening" | `role="menuitem"` | IMP-075 |
| See my word again | heading "Whose word?"; one button per name; quiet "Cancel" | dialog | IMP-017 |
| Deal again | dialog "Deal again? This round won't count. For when someone said the word or saw a screen." with "Deal again" / "Keep playing" (main) | dialog | IMP-025 |
| End between rounds | dialog "End the evening?" with "End the evening" / "Keep playing" (main) | dialog | IMP-092 |
| Start new | dialog "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" / "Carry on that evening" (main) | dialog | IMP-001 |
| End mid-round | dialog "End now? This round won't count." with "End now" / "Keep playing" (main) | dialog | IMP-093 |
| Left over 3 hours | "This round was left halfway. Start a fresh round?" with main "Next round" | h1 | IMP-091 |
| Summary (no menu) | heading "That's the night!"; `fun-line` ×0–3; "7 rounds · impostor caught 4 · escaped 3" (Score No); main "Back to Home"; quiet, in this order: "Oops, keep playing", "Play something else", "Share", "History", "Discard this evening" | h1; paragraphs; `summary-line`; buttons | IMP-092, 095, 101 |
| Discard | dialog "Discard this evening? Its rounds and scores will be lost." with "Discard" / "Keep it" (main) | dialog | IMP-092 |
| Fun lines | "Best impostor: Arjun, escaped 2 times" · "Most suspected: Meena, picked 3 times while crew" · "Rounds played: 7" | `fun-line` | IMP-095 |
| Share fallback | toast "Copied. Paste it into any chat." | `toast` | IMP-106 |
| History, in progress | "In progress" | inside `history-game` | IMP-094 |
| History rows | "Impostor · 7 rounds"; round rows (IMP-105); "Play again"; "← Back" when opened between rounds | `history-game`; `history-round`; buttons | IMP-103, 105, 092 |
| Settings | switches "Larger text" and "Tap to show instead of hold"; note "Your screen reader will say the word out loud. Use earphones or turn the volume down."; "Skipped words (3)"; "Bring back" per word (accessible name "Bring back Samosa") | switches; small line; heading; buttons | IMP-014, 107, 109 |
| Announcements | IMP-083 list | `announcer` (`aria-live="polite"`) | IMP-083 |

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
     categories: string[] (exact CSV names), nonveg: boolean, lastGuess: boolean }` (`lastGuess` false by default;
     a saved evening without it reads as false). Seeds are made only by a new evening's first
     "Start round" (IMP-060).
   - Moves, all recorded as `MoveRecord`s with `by: 'host'` (`type`, extra fields): `startDeal {practice: boolean}` ·
     `seen` · `dontKnow` · `startTalk` · `anotherRoundOfClues` · `voteNow` · `reveal {player}` ·
     `tie {players: string[]}` · `stillTie` · `showWord` · `verdict {right: boolean}` · `nextRound` · `dealAgain` ·
     `allowRepeats` · `wordDidntWork {blocked: boolean}` · `setPlayers {players: string[]}` · `setChoices {choices}` ·
     `endEvening`. `isOver` is true after `endEvening`.
   - `showWord` and `verdict` are legal only in a round where the impostor was revealed and `lastGuess` is true;
     with `lastGuess` false the `reveal` of the impostor completes the round.
   - Undo of a verdict is the engine's `undo` of that `verdict` record: `canUndo` is true only for the round's latest
     `verdict` while no `nextRound`, `setPlayers`, `setChoices` or `endEvening` has been recorded after it
     (`wordDidntWork` after it does not end the window).
   - Views: `view(state, { kind: 'player', playerId: name })` → `{ role: 'crew', wordId }` or `{ role: 'impostor' }`
     for the round being dealt or played. Host and room views → `{ round: number | null (null for the practice
     round), practice: boolean, players: string[], starter: string | null (null until picked) }`, plus `impostor`
     and `wordId` only after that round's `reveal` or `stillTie`.
   - Tap → move, exactly (a tap not listed records nothing):

     | Tap | Records |
     |---|---|
     | "Start round" (a new evening) | the evening is created, then `startDeal {practice: false}` |
     | "Practice round first" (How to play, opened from a new evening's choices screen) | the evening is created, then `startDeal {practice: true}` |
     | "How to play", its "Done", "More options ›", its switch and "Done" | nothing (the switch changes the choices on screen) |
     | "I'm <Name>", holds, "Tap instead", "Tap to see your word", "Tap to hide" | nothing |
     | "Done, pass to …" / "Done, everyone's seen" | `seen` |
     | "Don't know this word?" | `dontKnow` (the new word and impostor are drawn now) |
     | "Talk it over" / "Start the 2-minute timer" (clues screen) | `startTalk` |
     | "Another round of clues" | `anotherRoundOfClues` |
     | "Vote now" / "Get ready to point" | `voteNow` |
     | "Pause", "Carry on", "Count again", "It's a tie", ticking names, the countdown | nothing |
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
     | Players sheet "Done" (with a change) | `setPlayers {players}` (one move with the final list) |
     | "Change how we play", then "Start round" (between rounds) | `setChoices`, then `nextRound` |
     | "Change categories", then "Start round" (no words left) | `setChoices` only; the same round is dealt again with a new word |
     | "End the evening" / "End now" (dialog) | nothing (the summary shows, IMP-092, IMP-101) |
     | Leaving the summary (IMP-101), "Start new" (IMP-001), or the 3-hour and 12-hour limits (IMP-099) | `endEvening` |

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
   `{ id, word, other_names, category, audience, nonveg, hint }`, built from `docs/games/impostor/words.csv`.
3. **Browser seeds and forced deals**, honoured only in development and preview builds (IMP-064). "Preview builds"
   = every build except the release build published to the families' link: `npm run dev`, a local `npm run build`
   served by `npm run preview` (what the browser tests use), and the preview link. The release build ignores them.
   Before load a test may set `localStorage['pgn.test.seeds']` to JSON:
   `{ "word": "<seed>", "starter": "<seed>", "deals": [ { "wordId": "IMPW-004", "impostor": "Arjun", "starter": "Meena" } ] }`.
   `word` and `starter` become the next evening's `seeds.word` and `seeds.starter`; `deals` is copied into that
   evening's setup as `config.testDeals` (set only in development and preview builds; absent otherwise), so replay
   and reload use the same forced deals (IMP-060, IMP-090, IMP-091). Each dealt round of that evening (redeals
   included) takes the next `testDeals` entry in order; a missing field, or no entries left, falls back to the
   seeded pick. An entry that breaks a rule (a starter who is the impostor in Hard, a word outside the filters) is a
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
   `countdown-number`, `build-up`, `reveal-line` (one per reveal line, in order), `also-called`, `word-category`,
   `round-outcome`, `deal-progress`,
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Home (PLT-300: still "Host a game" and "Join with my ticket")
Then the "Host a game" button's second line reads exactly "Tambola or Impostor on this phone"
When the host taps "Host a game"
Then "What shall we play?" shows two cards of equal size and look (neither has the main look):
"Tambola" with "Housie on paper or phones · 2 hrs", and "Impostor" with
"Find who doesn't know the word · 3–20 players · about 4 min a round"
And there is no main button on this screen; tapping a card opens that game's setup at once
Given an Impostor evening is unfinished (not ended, not discarded, not auto-ended by IMP-104)
Then "What shall we play?" shows, above the two cards, the button "Impostor · round 4 · Tap to resume"
(`resume-card`), and Home's `unfinished-games` shows a row "Impostor, 8:40 pm, round 4" with "Tap to resume"
(8:40 pm = the evening's start time, in Tambola's row format)
And "round 4" is the number of the round in progress, or of the next round when between rounds (a practice round in
progress shows "round 1")
And an evening whose summary was showing and not yet left (`summaryShownAt` set, no `endEvening`) is unfinished too,
and shows the next round's number
When either is tapped
Then the evening reopens at its saved step (IMP-090, IMP-091), or, for such an evening, at the summary (IMP-101)
When instead the host taps the "Impostor" card while that evening is unfinished
Then a dialog asks exactly "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" and
"Carry on that evening" (main)
And "Carry on that evening" reopens it at its saved step
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given "Who's playing?" with an empty list
When the host types "Riya" in "Player name" and taps "Add" (or presses Enter), then Arjun, Meena and Kabir the same way
Then the list shows 1 Riya, 2 Arjun, 3 Meena, 4 Kabir, in that order: the passing order and the clue order
And after each add the field is empty and keeps focus (the phone keyboard stays open)
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
And below the groups, in this order: the button "Categories: all 9 ›" (IMP-007), the quiet "More options ›"
(IMP-076), and, directly above "Start round", the quiet "How to play" (IMP-070)
And "Start round" is the one main button; tapping it creates the evening and starts the first deal at once (records
`startDeal {practice: false}`; IMP-008)
And "← Back" returns to "Who's playing?" with the list unchanged

## IMP-006: Choices stay for the evening and change only between rounds
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the host chose Hard and Timer and round 1 ended
When the host taps "Next round"
Then round 2 uses Hard and Timer
When, on a round result, the host opens the menu and taps "Change how we play"
Then "How do you want to play?" opens with the evening's current choices selected; "Start round" records
`setChoices` (even with nothing changed) and then `nextRound`, and the next round's deal starts; "← Back" returns
to the same result unchanged and records nothing
And the evening stays the same evening (same seeds, same round numbering)
And "Change how we play" is not in the menu during a round (IMP-075)

## IMP-007: Categories, non-veg and one impostor
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Categories: all 9 ›"
Then a sheet "Categories" shows 9 switches, named and ordered exactly: "Food", "Festivals and occasions",
"Around the house", "Out and about", "Films, music and TV", "Sports and games", "School and childhood",
"Weddings and family", "Everyday moments"; on the first ever evening all are on
And below them the switch "Include non-veg food", off on the first ever evening
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
Status: approved, owner, 2026-10-03 (detail of IMP-005, IMP-006, IMP-008)
Phase: Impostor 1
Given `pgn.pref.impostor.lastChoices` (written at every first "Start round" and every `setChoices`: the most
recently started evening's latest choices, whether ended or discarded) holds Hard, Timer, Yes, + Grown-ups,
7 categories and non-veg on
When the host starts a new evening from the Impostor card
Then "How do you want to play?" opens with exactly those 6 choices selected
And on a phone that has never played, the IMP-005 defaults apply
And "Play again" (IMP-103) uses the choices of the evening it was tapped on instead
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
Then screen A shows, top to bottom: "Player 1 of 4" (`deal-progress`, IMP-019), "Pass the phone to", RIYA
(`pass-name`), "Everyone else, look away!" (body text, 17 px; 21 px with Larger text), and the main button "I'm Riya"
When "I'm Riya" is tapped
Then screen B shows "Player 1 of 4" (`deal-progress`), RIYA at the top, the pad "Hold here to see your word" (`hold-pad`, a button with that accessible
name) in the lower half, and the quiet "Tap instead"; no word, and no element with the main look (the pad included)
until "Done…" appears, in hold mode and tap mode alike, and in "See my word again" (IMP-017)
When Riya presses the pad (`pointerdown`)
Then the private block (IMP-011) shows at once, wholly above the pad in portrait (the block's bottom edge ≤ the
pad's top edge) and wholly left of the pad at 812 × 375 (the block's right edge ≤ the pad's left edge)
When she lets go (`pointerup`)
Then the block leaves the page at once (IMP-013) and the pad shows again
And the first time the block hides after showing for at least 500 ms without a break (by `pointerup`,
`pointercancel` or `pointerleave`), the main button "Done, pass to Arjun" and the quiet "Don't know this word?"
appear, and stay for the rest of her turn
And a hold under 500 ms shows and hides the block and adds nothing; any later hold of at least 500 ms adds them
And once they are shown, further holds of any length show and hide the block, and change nothing else
When she taps "Done, pass to Arjun"
Then screen A shows "Player 2 of 4", "Pass the phone to" ARJUN, "Everyone else, look away!" and "I'm Arjun", and so
on in seat order
And the last player's button reads "Done, everyone's seen" (IMP-016)
And no screen A or B ever shows the previous player's block
And a double tap on "Done…" may open the next player's screen B; nothing private shows there without a hold

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
`pointerdown` on the pad (or on "Tap to see your word"), no sound when the block shows, and "Done…" appearing at the
same fake-clock moment for the same hold (guideline 45)
And `private-word` is 36 px; with Larger text on, or for a word longer than 20 characters, it may be any size from
30 px to 36 px; it fits in 3 lines at every size (the longest word, "Mummy finding it in two seconds", included)
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the app Settings switch "Tap to show instead of hold" is on (kept on this phone, off by default)
Then on every screen B the pad reads "Tap to see your word" and "Tap instead" is not shown
And under that switch in Settings the small line reads exactly
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Meena (third in seat order) has held and sees "Don't know this word?"
When she taps it
Then a room screen shows "No problem! New word coming." and "Pass the phone back to RIYA" (the first player in seat
order), with the main button "I'm Riya"
And the tap on "Don't know this word?" records `dontKnow`, which draws the new word and the new impostor by
IMP-061 (the same player may be drawn again), same players, same round number; tapping "I'm Riya" (no move) opens
Riya's screen B and the deal runs again from her
And this "No problem!" screen shows only after "Don't know this word?"; "Deal again" (IMP-025) and the "left halfway"
"Next round" (IMP-091) go straight to the first player's screen A
And the menu on the "No problem!" screen is the deal menu (IMP-075)
And the button has the same label, place and behaviour on the impostor's screen B
And the word given up is not dealt again tonight (tonight's session), even after "Allow repeats" (IMP-052); it is not
listed in Settings' "Skipped words" (that list is IMP-107's)
And there is no limit on how many times it can be used in a round
And the starter is picked after the final deal (IMP-021)

## IMP-016: After the last player, straight to the clues
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the last player taps "Done, everyone's seen"
Then one room screen shows, top to bottom: "✓ Everyone has seen their word.", "Phone in the middle, face up.", the
starter and the clue order (IMP-020), and the main button "Talk it over" (Free flow) or
"Start the 2-minute timer" (Timer)
And the 3–5 player button of IMP-022 when it applies

## IMP-017: See my word again
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the clues screen, the talk screen or the picker is showing
When the host opens the menu and taps "See my word again"
Then a dialog "Whose word?" lists one button per player in seat order, and a quiet "Cancel"
And the timer, if running, pauses at once (IMP-027)
When "Cancel" is tapped
Then the dialog closes and nothing else changes (the timer stays paused, showing "Carry on")
When "Meena" is tapped
Then screen A shows "Pass the phone to" MEENA with "I'm Meena", then screen B exactly as in the deal (IMP-010 to
IMP-014), and her "Done" button reads "Done, everyone's seen"
And neither screen shows `deal-progress` during "See my word again"; screen A still shows "Everyone else, look
away!"
And "Don't know this word?" is not shown during "See my word again"
When she taps it
Then the screen it was opened from shows again, unchanged, with the timer paused
And there is no menu button from "Whose word?" until it returns
And if the page becomes hidden during it, on return it shows "Pass the phone to" MEENA (screen A) again
And it is not recorded as a move and changes no round state

## IMP-018: Hide triggers and the privacy cover
Status: approved, owner, 2026-10-03 (detail of IMP-013)
Phase: Impostor 1
Given a player's block is shown (held, or tapped open)
When any of these happens: `pointerup`, `pointercancel` or `pointerleave` on the pad (hold mode); `scroll` on
`window`; `resize` or `scroll` on `window.visualViewport`; `visibilitychange` to hidden; `pagehide`
Then the block and `private-live` are emptied in the same event (before any later task)
And while `document.visibilityState` is hidden, `privacy-cover` is in the page: `position: fixed`, covering the whole
viewport, opaque, above everything; it is removed when the page is visible again
And a return to visible during the deal shows "Welcome back." (IMP-090)


## IMP-019: "Player 2 of 4" and "Everyone else, look away!"
Status: approved, owner, 2026-10-04 (detail of IMP-010)
Phase: Impostor 1
Then screens A and B of the deal show `deal-progress` "Player N of M": N = the current player's position in this
round's seat order (1 for the first), M = the number of this round's players; it is a small line (15 px; 19 px with
Larger text) at the top left
And when the practice chip shows (IMP-071), `deal-progress` sits on the same row directly to its right, 8 px from it
And after a redeal ("No problem!", "Deal again", "left halfway" "Next round") the deal shows "Player 1 of 4" again;
"Welcome back." (IMP-090) shows the progress of the player named
And screen A shows "Everyone else, look away!" (body text) directly under `pass-name` on every screen A, "Welcome
back." and "See my word again" included
And the "No problem! New word coming." screen shows neither line
And nothing else on screens A and B changes
---

## 03-clues-and-talk.md

## IMP-020: Who starts
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Riya, Arjun, Meena, Kabir and Zoya, and Meena starts
Then the clues screen shows `starter-name` MEENA, then "starts", then `clue-order`
"then clockwise: Meena → Kabir → Zoya → Riya → Arjun" (seat order from the starter, wrapping round)
And the announcer says "Meena starts, then clockwise: Meena, Kabir, Zoya, Riya, Arjun"
And `starter-name` is 56 px at widths of 360 px and up for names of up to 8 characters; for longer names, at 320 px
wide, and at 812 × 375, it may be any size from 32 px to 56 px; at 32 px it may wrap onto 2 lines; never cut off
And `clue-order` is body text; when its text is taller than the space left above the main button, it scrolls inside its own box and the main button stays
wholly on screen (20 names of 16 characters at 320 × 568 with Larger text included)
And in **Hard** mode the starter is never the round's impostor; in **Easy** mode the impostor may start

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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given 3, 4 or 5 players
Then the clues screen has the quiet button "Another round of clues"
When it is tapped
Then the line "Second round: MEENA starts again" (the same starter) appears under `clue-order`, the button disappears
for the rest of the round, and nothing else changes (recorded as `anotherRoundOfClues`)
Given 6 or more players
Then the button is not shown

## IMP-023: Free flow
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Talking is Free flow
When "Talk it over" is tapped on the clues screen
Then the talk screen shows the heading "Talk it over" (`talk-heading`), "Who sounded unsure?" and the main button
"Vote now", with no timer
And `talk-heading` is 56 px at widths of 360 px and up (it may wrap onto 2 lines); at 320 px wide it may be any size
from 32 px to 56 px
And nothing on this screen changes by itself (guideline 28)

## IMP-024: Timer
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Talking is Timer
When "Start the 2-minute timer" is tapped (t = 0)
Then the talk screen shows only `timer` (no `talk-heading`, no "Who sounded unsure?"), which reads "2:00" (m:ss)
and counts down once per second: "1:59" at t = 1 s … "0:00" at t = 120 s, with the
main button "Vote now" and the quiet "Pause"
And `timer` is 120 px (112 px at 320 px wide)
And at "1:00" the announcer says "1 minute left"
And at "0:00": `timer` stays showing "0:00"; the heading "Time's up!" appears; sound `chime` plays once (if sound on);
the announcer says "Time's up"; the main button "Vote now" is replaced by "Get ready to point"; "Pause" is removed
And it never moves on to the vote by itself (guideline 48): "0:00" stays until a tap
And "Vote now" (before 0:00) and "Get ready to point" (at 0:00) both start the countdown (IMP-030)
And there is no menu from t = 0 of the countdown (IMP-075); the menu is available during the timer

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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Vote now", "Get ready to point", "Point again: …" (IMP-032) or "Count again" (IMP-031) (t = 0)
Then the countdown screen shows: the heading "Get ready to point…" from t = 0; `countdown-number` "3" at t = 1 s,
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
each button 56 px tall), the quiet "It's a tie" and "Count again", and the main button "Reveal", disabled
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "It's a tie"
Then the picker switches to ticking 2 or more names: "It's a tie" disappears, any selection is cleared, and the main
button reads "Point again", disabled
And tapping a name ticks it (`aria-pressed="true"`); tapping a ticked name unticks it
And with 2 or more ticked, the main button reads "Point again: " plus the ticked names in seat order, joined by ", "
with " or " before the last: "Point again: Arjun or Meena", "Point again: Arjun, Meena or Kabir"; every player may be
ticked
When "Point again: Arjun or Meena" is tapped
Then the countdown runs (IMP-030); recorded as `tie`
And then the re-vote picker shows only Arjun and Meena, the quiet "Still a tie" and "Count again", and the main button
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
Then the result screen shows only the build-up `build-up` "Arjun was…" (28 px) from t = 0 to t = 1.5 s; sound
`drumroll` plays once at t = 0 (if sound on); `body`'s background colour does not change; there is no menu button
and no main button
And at t = 1.5 s the build-up is replaced, all at once, by, top to bottom:
1. `reveal-line` "Caught! ARJUN was the impostor." (28 px)
2. `round-outcome` "The crew wins!" (h2, 28 px)
3. `reveal-line` "The word was School trip." (20 px)
4. `also-called` "Also called Excursion" (small line; only when the word has other names; not a reveal line)
5. `word-category` "School and childhood": a chip with the word's `category` exactly, text 15 px (19 px with Larger
   text), outlined, not a button
6. `evening-line` (Score No, IMP-040) or `round-points` and `scoreboard` (Score Yes, IMP-044)
7. the quiet "This word didn't work" (IMP-107) and the main button "Next round"; the menu button returns
And there is no "Undo" and no guess step (a reveal is never undone, guideline 47; IMP-037)
And with reduced motion the build-up and the switch at t = 1.5 s happen with no transform, transition or animation
And nothing else appears later on this screen; it stays until "Next round" (or the menu) is used

## IMP-034: The result when the crew picked the wrong person
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor and the word is Samosa (category "Food", no other names)
When "Reveal Meena" is tapped (t = 0; recorded as `reveal`, which completes the round)
Then the build-up "Meena was…" shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by, top to bottom: `reveal-line` "Meena was crew." (28 px),
`reveal-line` "ARJUN was the impostor and escaped!" (20 px), `round-outcome` "Arjun escaped!", `reveal-line`
"The word was Samosa.", no `also-called` line, `word-category` "Food", then items 6 and 7 of IMP-033
And there is no guess step and no "Undo", whatever the last-chance guess setting

## IMP-035: The room judges the last-chance guess
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on, Arjun was caught, the word is Pani puri, and IMP-039's verdict step shows
When the room agrees Arjun's guess "Samosa" is wrong and the host taps "Wrong guess"
Then `round-outcome` reads "The crew wins!"
When instead the host taps "Guessed right" (another name counts: "Golgappa" for Pani puri)
Then `round-outcome` reads "Arjun steals the round!"
And the app never judges the guess; it records only the tap
Given the last-chance guess is off
Then there is no guess, no verdict and no "Arjun steals the round!"

## IMP-036: Two impostors (after the play-test)
Status: approved, owner, 2026-10-03
Phase: Impostor later
Given 8 or more players and 2 impostors chosen
Then both impostors see "You're one of 2 impostors" and never who the other is
(The vote and reveal for two impostors are designed after the play-test.)

## IMP-037: Undo the verdict only, before the next round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the last-chance guess is on and a caught round's result shows after "Wrong guess"
Then the result has the quiet "Undo"
When "Undo" is tapped
Then the result lines below the word (IMP-039's step 3) go and "Guessed right" / "Wrong guess" show again, with the
word still shown; any points of that verdict are taken back, and the round is no longer completed until a verdict is
tapped again (engine `undo` of the `verdict` record; a "This word didn't work" tapped meanwhile stays)
And "Undo" is offered until "Next round" is tapped or players or choices are changed (`setPlayers`, `setChoices`),
also after the evening is reopened (IMP-091) or after "Oops, keep playing" (IMP-101)
And "Undo" is never offered with the last-chance guess off, nor on an escaped or "Still a tie" round
And a reveal is never undone (it is protected by "Reveal Arjun", IMP-031), and a deal is never undone (use "Deal
again with a new word")

## IMP-038: "Still a tie": the impostor escapes
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Arjun is the impostor, the word is Samosa, and the re-vote picker is showing
When "Still a tie" is tapped (t = 0; recorded as `stillTie`, which completes the round)
Then the result screen shows at once, with no build-up and no `drumroll`, top to bottom: `reveal-line`
"Still a tie! ARJUN was the impostor and escaped!" (28 px), `round-outcome` "Arjun escaped!", `reveal-line`
"The word was Samosa.", `word-category` "Food", then items 6 and 7 of IMP-033
And the round is escaped (+2 to Arjun when keeping score); there is no guess step and no "Undo"


## IMP-039: The last-chance guess, when it is on
Status: approved, owner, 2026-10-04 (detail of IMP-033)
Phase: Impostor 1
Given the last-chance guess is on (IMP-076), Arjun is the impostor and the word is School trip
When "Reveal Arjun" is tapped (t = 0; recorded as `reveal`)
Then the build-up shows from t = 0 to t = 1.5 s exactly as in IMP-033
And at t = 1.5 s it is replaced, all at once, by: `reveal-line` "Caught! ARJUN was the impostor." (28 px),
`reveal-line` "Last chance, Arjun! Guess the word out loud. Get it right and you steal the round." (20 px) and the
main button "Arjun guessed. Show the word"; the word is not in the page (IMP-013); there is no menu button
When "Arjun guessed. Show the word" is tapped (recorded as `showWord`)
Then that button goes and, under the two lines, `reveal-line` "The word was School trip.", `also-called` "Also
called Excursion" and `word-category` "School and childhood" appear, with two quiet buttons of equal size side by
side, "Guessed right" and "Wrong guess"; neither has the main look (IMP-080)
When a verdict is tapped (recorded as `verdict`, which completes the round)
Then the two buttons go and these appear under the word, at once: `round-outcome` "The crew wins!" ("Wrong guess")
or "Arjun steals the round!" ("Guessed right"), then items 6 and 7 of IMP-033, plus the quiet "Undo" (IMP-037);
the menu button returns
And every line shown stays on the screen until "Next round"
And when the vote revealed a crew member, or the re-vote ended "Still a tie", there is no guess step: IMP-034 and
IMP-038 apply unchanged
---

## 05-scoring.md (C3)

## IMP-040: No points by default
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Score is No
Then no points, ranks or scoreboard show anywhere in the evening
And each counted round's result screen shows `evening-line` "Tonight: impostor caught 3 · escaped 2": the counts of
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Score was No for rounds 1 to 3
When the host switches Score to Yes between rounds ("Change how we play", IMP-006)
Then rounds from round 4 score, and `scoreboard` shows the small line "Scores from round 4"
And "Scores from round N" names the evening's first scored round and shows only when N is greater than 1
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
And rows are 36 px tall; up to 6 players in one column; from 7 players in two columns: the first column holds the
first ceil(n / 2) rows in rank order, the second column the rest (12 players: 6 and 6; 7 players: 4 and 3)
And at 390 × 844 with Larger text off and names of up to 8 characters, 12 players show with no scrolling at all;
otherwise (more players, longer names, Larger text, smaller screens) `scoreboard` scrolls inside its own box, the
main button stays fixed and `round-outcome` stays wholly on screen (IMP-082)

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
Status: approved, owner, 2026-10-03
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
"You've played every word in these categories tonight!", the line "Turn on more categories or + Grown-ups.", the main
button "Allow repeats" and the quiet "Change categories"
When "Allow repeats" is tapped (recorded as `allowRepeats`)
Then for the rest of the evening each deal picks uniformly among all words that pass IMP-050 and are not blocked,
and the deal starts
When "Change categories" is tapped
Then "How do you want to play?" opens with the current choices; its "Start round" records `setChoices` only (no
`nextRound`) and the same round is dealt again, same round number, with a word drawn under the new choices
And the menu on this screen is the between-rounds menu (IMP-075)
And when even "Allow repeats" would find no word (every allowed word blocked), "Allow repeats" is not shown and
"Change categories" is the main button

## IMP-053: Both names are shown where a thing has two
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the word is "Kheer / Payasam"
Then the crew's `private-word` reads exactly "Kheer / Payasam", line 5 reads "Also called Payesh", and the reveal
reads "The word was Kheer / Payasam."

## IMP-054: Every word in the list is valid
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then every row of `words.csv` (parsed as CSV, quoted fields allowed) and of `words.json` has: an id "IMPW-" plus
3 digits, unique; a non-empty word; a category that is one of the 9 (IMP-007); audience "family" or "grownups";
nonveg "yes" or "no" (`true`/`false` in JSON); a non-empty hint that is not, ignoring case, the word, one of its
names (split on " / "), or one of its other names
And no two rows have the same word, ignoring case
And `words.json` has exactly the rows of `words.csv`, in the same order (291 rows on 4 October 2026)

## IMP-055: The shipped word list file
Status: approved, owner, 2026-10-03 (detail of IMP-054)
Phase: Impostor 1
Then the app ships `content/impostor/words.json`, built from `docs/games/impostor/words.csv` with a real CSV parser
And each entry is `{ "id": "IMPW-004", "word": "Samosa", "other_names": "", "category": "Food", "audience": "family",
"nonveg": false, "hint": "Tea time" }`: `other_names` is the CSV text exactly ("" when empty, "Golgappa / Puchka"
otherwise)
And the CSV columns `difficulty`, `close_cousin`, `change` and `notes` are not in the file and not used by the app

---

## 07-secrets-and-seeds.md (C3)

## IMP-060: The word and the impostor come from their own seed
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each evening's setup has `seeds.word` (draws every word and impostor of the evening) and a separate
`seeds.starter` (draws every starter), both made fresh on the phone with `crypto.getRandomValues` when a new
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
list, exactly:
1. "Everyone gets the same secret word, except the impostor."
2. "Take turns to say one word about it. Don't say the word!"
3. "Then talk, and all point at who you think the impostor is."
4. with the last-chance guess on: "Impostor: blend in. Caught? Guess the word to steal the round."; off:
   "Impostor: blend in. Don't get caught!"
And under them the rules of IMP-072
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
And after its result, "Next round" deals round 1 with no chip
And a practice round can only be the first round of an evening

## IMP-072: The rules in "How to play" never show secrets
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then under the read-aloud lines (IMP-070), "How to play" shows these paragraphs for **Easy**, exactly:
"1. Everyone sees the same secret word, except the impostor, who sees only the category and a hint." ·
"2. Take turns clockwise. Say one word about the secret word." ·
"3. Not allowed: the word itself, a rhyme, a translation, or 'thing'. Repeating someone's clue is allowed." ·
"4. Talk it over, then everyone points at once on 3, 2, 1." ·
"5. Caught? The impostor gets one guess at the word to steal the round." (only with the last-chance guess on) ·
"Kids may use up to 3 words."
And for **Hard**, line 1 reads "1. Everyone sees the same secret word, except the impostor, who sees nothing." and
the paragraph "The impostor never starts." comes between lines 2 and 3; the rest is the same
And they never show a word, hint, other name or role (IMP-013)

## IMP-073: Sizes for the phone in the middle of the table
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then at every size, these sizes hold (guideline 46):

| Element | Size | May shrink when | Floor |
|---|---|---|---|
| `starter-name` | 56 px | name over 8 characters, 320 px wide, or 812 × 375 | 32 px (may wrap onto 2 lines) |
| `talk-heading` | 56 px | 320 px wide | 32 px |
| `pass-name` | 48 px | name would not fit in 1 line at 48 px | 32 px (may wrap onto 2 lines); on screen B at 320 × 568 and 360 × 640, 20 px on one line (product owner, 4 October) |
| `timer` | 120 px | 320 px wide: exactly 112 px | 112 px |
| `countdown-number` "3" "2" "1" | 200 px portrait | 812 × 375: exactly 160 px | 160 px |
| `countdown-number` "Point!" | 96 px | 320 px wide: exactly 72 px | 72 px |
| `private-word` | 36 px | Larger text on, or word over 20 characters | 30 px |
| `build-up`, and the first `reveal-line` of each result | 28 px | never | 28 px |
| `reveal-line`, other lines | 20 px | never | 20 px |
| `round-outcome` | 28 px | never | 28 px |
| `deal-progress`, `word-category`, `also-called` | 15 px (19 px with Larger text) | never | 15 px |

And "may shrink" means the size is any value from the floor to the full size; with no listed reason it is exactly the
full size

## IMP-074: Late joiner and someone leaving
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given a round result is showing (between rounds)
When the host opens the menu, taps "Players", and adds Zoya
Then the sheet "Players" (the list, field and buttons of IMP-003, with its limits) shows Zoya at the end; ▲ ▼ move
her to her seat; the main button "Done" closes the sheet and records one `setPlayers` with the final list (nothing
is recorded when the list is unchanged); she is dealt in from the next round, at 0 points when keeping score (or
with her old total when she had left earlier, IMP-044)
When the host taps ✕ next to Kabir
Then he is removed at once and the toast reads "Kabir left · Points kept · Undo" (keeping score) or "Kabir left ·
Undo" (not keeping score), for 5 s inside the sheet; "Undo" puts him back in the same seat; tapping "Done" while
the toast shows closes the toast with the sheet (he stays removed)
And his points stay on the scoreboard, greyed (IMP-044)
And with 3 players, tapping ✕ removes nobody and shows "Keep at least 3 players."
When "Players" is opened from the menu during a round (deal, clues, talk or picker)
Then a dialog shows only "Change players after this round." and the main button "OK", which closes it with nothing
changed

## IMP-075: The menu at each moment
Status: approved, owner, 2026-10-04 (changed; detail of IMP-006, IMP-017, IMP-025, IMP-093)
Phase: Impostor 1
Then "··· Menu" (top right) has exactly these items, in this order (the item that ends things last):

| Moment | Items |
|---|---|
| Deal (screens A, B, "No problem!", "Welcome back.") | How to play · Players · Deal again with a new word · Settings · End the evening |
| Clues, talk (Free flow or Timer), picker | How to play · Players · See my word again · Deal again with a new word · Settings · End the evening |
| Round result (between rounds), no-words screen (IMP-052) | How to play · Players · Change how we play · Settings · History · End the evening |
| "left halfway" screen (IMP-091) | How to play · Players · Settings · History · End the evening ("Players" shows only "Change players after this round." and "OK"; product owner, 4 October) |

And there is no menu button on "How to play", the countdown screen, during "See my word again", on the summary,
during the 1.5 s build-up, nor during the last-chance guess's guess and verdict steps (IMP-039); the result screen
has it (between-rounds items) once the round is completed
And History opened from the between-rounds menu has "← Back", which returns to the same screen
And there is no "← Back" during a round; the browser's or phone's Back button during a round keeps the same
screen and changes nothing


## IMP-076: More options: the last-chance guess
Status: approved, owner, 2026-10-04 (detail of IMP-005)
Phase: Impostor 1
When the host taps the quiet "More options ›" on "How do you want to play?"
Then a sheet shows the heading "More options", the switch "Last-chance guess" with the small line "A caught
impostor can guess the word to steal the round." under it, and the main button "Done"
And the switch is off on this phone's first ever evening; afterwards it starts from the last-used choices (IMP-009),
or the evening's choices in "Change how we play" and "Play again"
When the switch is turned on and "Done" is tapped
Then the choice `lastGuess` is true; it is saved with the other choices (`setChoices` between rounds, IMP-006), and
the button text "More options ›" does not change
And "Include non-veg food" stays in the Categories sheet (IMP-007)
And the setting changes only IMP-033/IMP-039 (the guess step), IMP-037 (Undo), IMP-041 (+1 to the impostor), the
read-aloud line 4 and rule 5 (IMP-070, IMP-072); nothing else changes
---

## 09-usability.md

## IMP-080: At most one main button, and it is the next step
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then every Impostor screen has at most one element with the main look, `data-testid="main-button"`, and it is the
next step (guideline 17a)
And exactly these have none: "What shall we play?" (cards), screen B until "Done…" appears (hold mode, tap mode and
"See my word again"), the countdown,
the 1.5 s build-up, and the verdict step of the last-chance guess ("Guessed right" / "Wrong guess" look equal)
And a destructive choice ("End now", "End the evening", "Discard", "Deal again") is never the main button

## IMP-081: Nothing scrolls during a round
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then the deal, clues, talk, countdown, picker and result screens have no page scrolling at every size, with
names of 16 characters, 3 to 20 players, the practice chip, the timer, and the longest word
("Mummy finding it in two seconds": `private-word` fits in 3 lines, IMP-012)
And where content is taller than the screen, these give way, in this order, and nothing else:
1. `clue-order`, the picker's name list and `scoreboard` scroll inside their own boxes (IMP-020, IMP-082, IMP-044);
2. the room-screen names shrink to their floors (IMP-073);
3. on the result screen, everything above its buttons scrolls inside one box, scrolled to the top when the screen
   appears (after the last-chance guess's verdict: scrolled so `round-outcome` is wholly in view)
And the main button stays wholly on screen and fixed at the bottom throughout
And at 812 × 375 the hold screen puts the block on the left and the pad (and "Done…") on the right; the result
screen puts the reveal lines, the word and its chip on the left and `round-outcome`, the evening line or points and
the buttons on the right

## IMP-082: Lists of 12 to 20 players
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then at 390 × 844 with Larger text off and names of up to 8 characters, the picker ("Who got the most fingers?")
shows 12 players in two columns with no scrolling at all
And the `scoreboard` on the result screen may always scroll inside its own box (the lines above it stay)
And otherwise (13 to 20 players, longer names, Larger text, smaller screens or landscape) each list is two columns
and scrolls inside its own box, the main button stays fixed at the bottom, and the heading or `round-outcome`
stays wholly on screen

## IMP-083: Screen readers
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then `announcer` (`aria-live="polite"`) receives exactly: the clue order (IMP-020), "1 minute left" and "Time's up"
(IMP-024), "3", "2", "1", "Point!" (IMP-030), the build-up once ("Arjun was…", at t = 0), and at t = 1.5 s each
`reveal-line` and `round-outcome` in screen order (IMP-033, IMP-034, IMP-038, IMP-039; after a verdict,
`round-outcome`)
And `also-called`, `word-category` and `deal-progress` are never announced
And `hold-pad` is a button whose accessible name is its visible text: "Hold here to see your word" (or "Tap to see
your word" / "Tap to hide")
And the player's block is put in `private-live` (`aria-live="assertive"`) only while it is shown on their own turn,
and emptied when it hides (IMP-018); `announcer` never receives a word, hint or role before the reveal

## IMP-084: No flashing
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then sampled every 50 ms through the countdown, the build-up and the first 3 s of the result screen, no element's
computed background colour
changes more than 3 times in any 1 s window
And the result screens for caught, escaped and "Still a tie" have the same `body` background colour

## IMP-085: Kind words
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then no Impostor text (every string in this file, every screen's text) contains, ignoring case, "liar", "loser",
"fooled", "stupid" or "bad clue"
And the result headlines are exactly "The crew wins!", "Arjun steals the round!" and "Arjun escaped!"

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
And the lock is released when the round is completed (the result screen at t = 1.5 s, or the verdict with the
last-chance guess) and requested again if "Undo" reopens the verdict
And when `navigator.wakeLock` is missing or refused, nothing else happens (no message)

## IMP-088: The choices screen at 320 × 568 and in landscape
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then on "How do you want to play?" each group is one row: the label in a 64 px column, then the two options sharing
the rest of the row equally (each at least 48 px tall), with only the selected option's line under it
And option text is 17 px (15 px at 320 px wide; with Larger text 21 px, and 19 px at 320 px wide)
And at 320 × 568 with Larger text off, the four groups, the Categories button and "Start round" show with no page
scrolling
And with Larger text the content above "Start round" may scroll; "Start round" stays fixed at the bottom
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
Given the app was closed (or reloaded) during the deal, clues, talk, countdown, picker or reveal (the deal within 3
hours: IMP-090)
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
Then the screen shows "This round was left halfway. Start a fresh round?" with the main button "Next round"
And "Next round" deals that round again with a new word and impostor under the same round number (recorded as
`dealAgain`); the menu is as IMP-075 lists for the "left halfway" screen (no "Change how we play"; choices can be
changed on the next round result)

## IMP-092: Ending and discarding the evening
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "End the evening" in the menu on a round result
Then a dialog asks "End the evening?" with "End the evening" and "Keep playing" (main); "Keep playing" closes it
When "End the evening" is tapped (nothing recorded yet: the evening stays in progress while the summary shows, and
`endEvening` is recorded when the summary is left, IMP-101)
Then the summary shows: the heading "That's the night!", the fun lines (IMP-095), then the final `scoreboard` (when
Score was Yes at any point; with IMP-043's caption) or `summary-line` "7 rounds · impostor caught 4 · escaped 3"
(Score No throughout); the main button "Back to Home"; and the quiet buttons, in this order: "Oops, keep playing",
"Play something else", "Share", "History", "Discard this evening"
And the summary has no menu button; once `endEvening` is recorded the evening is kept in History (unless IMP-097
applies)
When "Discard this evening" is tapped
Then a dialog asks "Discard this evening? Its rounds and scores will be lost." with "Discard" and "Keep it" (main)
When "Discard" is tapped
Then the evening and its scores are deleted from this phone (no `endEvening`; nothing kept), Home opens, and the evening is in neither History nor
`unfinished-games`; its words do not count for IMP-052's "last 3 evenings"
And "Back to Home" opens Home and "History" opens History, each recording `endEvening` first

## IMP-093: Ending mid-round
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "End the evening" in the menu during a round (deal, clues, talk or picker)
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then the summary shows these `fun-line`s, in this order, each only when its condition holds, at most these 3
(counted rounds only):
1. "Best impostor: Arjun, escaped 2 times": the player with the most escapes as impostor, when that is at least 1
   ("escaped 1 time"); equal counts: the first in seat order
2. "Most suspected: Meena, picked 3 times while crew": the crew member revealed by the vote the most times, when that
   is at least 2; equal counts: the first in seat order
3. "Rounds played: 7": when at least 1 counted round
And "seat order" is the evening's final seat order, with players who left after everyone still playing, in the
order they left
Given 0 counted rounds
Then no fun lines show

## IMP-096: Saved evenings carry a format version
Status: approved, owner, 2026-10-03
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
  "records": [ { "v": 1, "seq": 1, "at": 1791043200000, "by": "host", "move": { "type": "startDeal", "practice": false } },
               { "v": 1, "seq": 2, "at": 1791043212000, "by": "host", "move": { "type": "seen" } } ] }
```
And `status` follows PLT-001: "in-progress" while the evening runs (the summary included, IMP-101), "ended" after
`endEvening`; a discarded evening is deleted, not saved with a status (IMP-092)
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
after every later change (PLT-001, PLT-014)

## IMP-097: An evening with no counted round is not kept
Status: approved, owner, 2026-10-03 (detail of IMP-092, IMP-094)
Phase: Impostor 1
Given the summary shows (after "End the evening", "End now", or IMP-104) for an evening with no counted round (none,
or only the practice round)
Then it shows "That's the night!", `summary-line` "0 rounds · impostor caught 0 · escaped 0" (whatever the Score
choice; no scoreboard), no fun lines and no "Share"; "Oops, keep playing", "Play something else", "History" and
"Discard this evening" are still offered
And when `endEvening` is recorded the evening is deleted rather than kept in History, and its words do not count
for "the last 3 evenings"

## IMP-098: Plurals on the summary and in Share
Status: approved, owner, 2026-10-03 (detail of IMP-092, IMP-106)
Phase: Impostor 1
Then with 1 counted round the summary line reads "1 round · impostor caught 1 · escaped 0" and Share's first line
"Impostor night · 1 round"; "Rounds played: 1"
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
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the round is completed (IMP-033, IMP-034, IMP-038, IMP-039)
Then the wake lock is released (IMP-087), and nothing still secret is on screen (every secret of the round has been
revealed by then)

## IMP-101: Ended by mistake
Status: approved, owner, 2026-10-03 (changed 3 October for engine fit; owner informed)
Phase: Impostor 1
Given the summary shows after "End the evening" (or "End now")
Then the evening is still in progress (`status` "in-progress", no `endEvening` yet), and `pgn.impostor-ui.<id>`
holds `summaryShownAt`
When the host taps "Oops, keep playing"
Then the summary goes and the evening is exactly where "End the evening" or "End now" was tapped (between rounds:
the same result screen, with "Undo" when its window is open, IMP-037); nothing is recorded and nothing is lost
And `endEvening` is recorded when the host leaves the summary screen: "Back to Home", "Play something else",
"History", or "Discard this evening" then "Discard" (which deletes instead). "Share" does not leave it, and a share
sheet's return does not count
And when the app is closed and reopened while the summary was showing, the summary shows again until it is left,
with "Oops, keep playing" only within 3 hours of `summaryShownAt` (IMP-099); Home and "What shall we play?" list such
an evening as unfinished (IMP-001)
And 3 hours after `summaryShownAt` (IMP-099) `endEvening` is recorded by itself; the summary, if still on screen,
then has no "Oops, keep playing"
And History never offers to reopen an ended evening (PLT-008)

## IMP-102: Something else tonight, with the same people
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Play something else" on the summary
Then "What shall we play?" opens, and the next game's players arrive filled in (IMP-004, PLT-024)
And the Impostor evening belongs to tonight's session (PLT-016) and stays out of any money tally (PLT-023); the
session screen lists it as one `session-game` reading "Impostor · 7 rounds"
And when Tambola is picked and Tambola has an unfinished setup (PLT-006), that setup opens exactly as it was saved
(its own names); tonight's names fill only a new Tambola setup (product owner, 4 October)

## IMP-103: Play again another day
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Play again" on a past evening in History (PLT-009)
Then "Who's playing?" opens with that evening's players in its final seat order (leavers left out), then "Next"
opens "How do you want to play?" with that evening's final choices (IMP-009)
And "Start round" starts a new evening in tonight's session (IMP-009), with the words of the last 3 evenings
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
Then it shows the players, the choices, and one `history-round` per completed round in order, reading exactly:
"Round 3 · Samosa · Arjun caught" (no last-chance guess) / "Round 3 · Samosa · Arjun caught, guessed right" /
"Round 3 · Samosa · Arjun caught, wrong guess" / "Round 3 · Samosa · Arjun escaped"; the practice round reads "Practice · Samosa · Arjun escaped" (and so on); when
the round was scored, its `round-points` text follows on its own line ("+2 Arjun")
And the fun lines of IMP-095 and, when scored, the final scoreboard
And it can't be changed (PLT-008); it can be deleted (PLT-010) or cleared with all history (PLT-011)

## IMP-106: Share the night
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Share" on the summary
Then `navigator.share({ text })` is called once with this text, lines joined by "\n":
- "Impostor night · 7 rounds"
- "Impostor caught 4 · escaped 3"
- fun line 1 of IMP-095, only when it shows ("Best impostor: Arjun, escaped 2 times")
- "Words: " + the words of the completed rounds in round order (the practice round's first), at most 8, joined by
  ", ", with "…" right after the 8th word when there are more
Example (7 counted rounds, no practice):
```
Impostor night · 7 rounds
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
Status: approved, owner, 2026-10-03 (detail of IMP-014, IMP-107)
Phase: Impostor 1
Then the app's Settings (as reached today, or "Settings" in the menu) has the switch "Larger text" (off by default, kept on this
phone; body text 21 px and small lines 19 px when on, Terms), the switch "Tap to show instead of hold" with its
small line (IMP-014), and "Skipped words (N)" when N ≥ 1 (IMP-107)
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
