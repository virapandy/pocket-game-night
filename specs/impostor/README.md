# Impostor: scenarios (version 2.2, 3 October 2026)

Status: **IMP-001 to IMP-108 approved by the owner, 3 October 2026.** Version 2 (same day) makes every approved
scenario exact, from two independent readers (a coder-reader and a tester-reader, `docs/spec-rules.md` rule 12) and
the product owner's resolutions. IDs marked "(detail of IMP-xxx)" are new in version 2: they add no behaviour, they
only make approved behaviour exact. Version 2.2 adds the last engine-fit details (`config.testDeals`, when
`wordDidntWork` is legal, "Start new", the unfinished summary). Version 2.1 (same day) fits the existing engine (`SavedGame`, setup, views, move
records) after a second coder read and tester read; the one behaviour change is IMP-101 (owner informed).
IMP-200+ are approved as direction, built later.
After approval the tester copies these into `specs/impostor/` (file names in each section heading) and writes tests.
**Hand-over only after the Tambola release** (`docs/roadmap.md`). Template: `specs/README.md`.

**This file is binding: where `ux.md`, `lifecycle.md` or `guide.md` differ, this file wins.**

Phases: **Impostor 1** = the first release (one phone, the Multicultural list in `words.csv`). **Impostor later** =
designed now, built later.

Change classes (`docs/change-sop.md`): rules, secrets and seeds, saved evenings and the word list format = **C3**
(tests first; sections 05, 06, 07 and IMP-096); screens = C1/C2.

### What version 2 rewords or retires (rule 11)
- Retired wordings: "Caught!" (IMP-085), "Sorry, Meena!", "Who was accused?", "Got it, deal", "We know it",
  "Hold to see your word" as the pad's name (IMP-083), "Sharpest eyes" (IMP-095), "Discard the evening" (IMP-092),
  "Impostor caught 3 · escaped 2" without "Tonight:" (IMP-040), "Kabir left. Points kept · Undo" (IMP-074),
  "Also called Payasam" (IMP-011), "Carry on this evening" (IMP-101, retired in 2.1), the format-1 saved record
  (IMP-096, replaced in 2.1 by the engine's `SavedGame`).
- Reworded: IMP-001, 003, 006, 008, 010–017, 020–025, 030–035, 037, 040–043, 050–054, 060–063, 070–074, 080–088,
  090–096, 101–107. New detail IDs: IMP-009, 018, 027, 038, 044, 055, 064, 075, 089, 097, 098, 099, 109.

In this folder: copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2) by the Test role, 3 October 2026,
one file per section heading. The game guide, journeys and screens are in `docs/games/impostor/` (`guide.md`,
`lifecycle.md`, `ux.md`); where they differ, these scenarios win. The words are `docs/games/impostor/words.csv`.

## Files

| File | Scenarios |
|---|---|
| [01-setup.md](01-setup.md) | IMP-001 – IMP-009 (9) |
| [02-deal.md](02-deal.md) | IMP-010 – IMP-018 (9) |
| [03-clues-and-talk.md](03-clues-and-talk.md) | IMP-020 – IMP-027 (7) |
| [04-vote-and-reveal.md](04-vote-and-reveal.md) | IMP-030 – IMP-038 (9) |
| [05-scoring.md](05-scoring.md) | IMP-040 – IMP-044 (5) |
| [06-words.md](06-words.md) | IMP-050 – IMP-055 (6) |
| [07-secrets-and-seeds.md](07-secrets-and-seeds.md) | IMP-060 – IMP-064 (5) |
| [08-room-host-and-teach.md](08-room-host-and-teach.md) | IMP-070 – IMP-075 (6) |
| [09-usability.md](09-usability.md) | IMP-080 – IMP-089 (10) |
| [10-lifecycle.md](10-lifecycle.md) | IMP-090 – IMP-099 (10) |
| [11-after-the-game.md](11-after-the-game.md) | IMP-100 – IMP-109 (10) |
| [12-later.md](12-later.md) | IMP-200 – IMP-204 (5) |

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
| **Room screens** | The screens meant for the whole table: "Pass the phone to…", "No problem! New word coming.", "Welcome back.", clues, talk, countdown, picker, reveal and round result. The **hold screen** (screen B of the deal) is private. |
| **Round** | From the round's first "Pass the phone to…" screen to its result. A **redeal** ("Don't know this word?", "Deal again", "Start a fresh round") replaces the round in progress with a new deal under the same round number. |
| **Completed round** | A round that reached a result: escaped, or caught plus a verdict. Practice rounds included. Redealt rounds and rounds dropped by the end of the evening are not completed. |
| **Counted round** | A completed round that is not the practice round. **Round numbers** count only counted rounds: round 1 is the first counted round; the round in progress is number (counted rounds so far + 1); the practice round has no number. |
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
Food, other names "Payesh", hint "Cardamom"); **Five more minutes, then phone off** (IMPW-402, School and childhood,
the longest word, 33 characters).

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
| Choices main | "Start round" | main button | IMP-005 |
| Read-aloud card (no menu) | heading "Read this aloud"; 4 lines (IMP-070); main "Start the deal"; quiet "Practice round first" | h1; `ol` with 4 `li` | IMP-070 |
| No words left | heading "You've played every word in these categories tonight!"; line "Turn on more categories or + Grown-ups."; main "Allow repeats"; quiet "Change categories" | h1; paragraph | IMP-052 |
| Deal, screen A | "Pass the phone to" and `<NAME>`; main "I'm <Name>" | paragraph; `pass-name`; main button | IMP-010 |
| Deal, after a return | "Welcome back." above screen A | paragraph | IMP-090 |
| Deal, screen B | `<NAME>` at the top; pad "Hold here to see your word"; quiet "Tap instead" | heading; button `hold-pad`, accessible name = its visible text | IMP-010, 083 |
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
| Build-up | "<Name> was" with `build-up-dots` "." → ".." → "..." | `reveal-line`; span | IMP-033 |
| Caught | "Caught red-handed! <NAME> was the impostor." · "<Name>, one guess. Say it out loud! (No repeating the clues.)" · main "Show the word" · "The word was Samosa." · small line "Also called Golgappa / Puchka" · "Guessed right" / "Wrong guess" | `reveal-line` each, except the small line: `also-called` (not a reveal line, not announced); two quiet buttons | IMP-033 |
| Escaped | "Meena was crew!" · "The impostor was <NAME>. Escaped!" · "The word was Samosa." | `reveal-line` each | IMP-034 |
| Still a tie | "Still a tie! The impostor was <NAME>. Escaped!" · "The word was Samosa." | `reveal-line` each | IMP-038 |
| Result headline | "The crew wins!" · "<Name> steals the round!" · "<Name> escaped!" | h2 `round-outcome` | IMP-035, 034 |
| Result, Score No | "Tonight: impostor caught 3 · escaped 2" | paragraph `evening-line` | IMP-040 |
| Result, Score Yes | "+2 Arjun" · "+1 Arjun" · "+1 each: Riya, Meena, Kabir"; caption "Scores from round 4" | `round-points`; small line in `scoreboard` | IMP-044, 043 |
| Result buttons | main "Next round"; quiet "Undo" (after a verdict); quiet "This word didn't work"; toast "Samosa won't come up again · Undo" | buttons; `undo-toast` | IMP-037, 107 |
| Players sheet | heading "Players"; main "Done"; toast "Kabir left · Undo" / "Kabir left · Points kept · Undo"; message "Keep at least 3 players." | h1; `undo-toast`; `role="alert"` | IMP-074 |
| Players, mid-round | "Change players after this round." with main "OK" | dialog | IMP-074 |
| Menu button | "··· Menu" | button, name contains "Menu" | IMP-075 |
| Menu items | "Rules" · "Players" · "See my word again" · "Deal again with a new word" · "Change how we play" · "Settings" · "History" · "End the evening" | `role="menuitem"` | IMP-075 |
| See my word again | heading "Whose word?"; one button per name; quiet "Cancel" | dialog | IMP-017 |
| Deal again | dialog "Deal again? This round won't count. For when someone said the word or saw a screen." with "Deal again" / "Keep playing" (main) | dialog | IMP-025 |
| End between rounds | dialog "End the evening?" with "End the evening" / "Keep playing" (main) | dialog | IMP-092 |
| Start new | dialog "Start a new evening? The evening from 8:40 pm will be ended." with "Start new" / "Carry on that evening" (main) | dialog | IMP-001 |
| End mid-round | dialog "End now? This round won't count." with "End now" / "Keep playing" (main) | dialog | IMP-093 |
| Rules | IMP-072 text; main "Done" | sheet, h1 "How to play" | IMP-072 |
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
     categories: string[] (exact CSV names), nonveg: boolean }`. Seeds are made only by a new evening's first
     "Start round" (IMP-060).
   - Moves, all recorded as `MoveRecord`s with `by: 'host'` (`type`, extra fields): `startDeal {practice: boolean}` ·
     `seen` · `dontKnow` · `startTalk` · `anotherRoundOfClues` · `voteNow` · `reveal {player}` ·
     `tie {players: string[]}` · `stillTie` · `showWord` · `verdict {right: boolean}` · `nextRound` · `dealAgain` ·
     `allowRepeats` · `wordDidntWork {blocked: boolean}` · `setPlayers {players: string[]}` · `setChoices {choices}` ·
     `endEvening`. `isOver` is true after `endEvening`.
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
     | "Start round" (a new evening) | nothing (the evening is created; the read-aloud card or the deal follows) |
     | "Start the deal" / "Practice round first" (or "Start round" when the card is skipped) | `startDeal {practice: false / true}` |
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
     | "Show the word" | `showWord` |
     | "Guessed right" / "Wrong guess" | `verdict {right: true / false}` |
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
     string[]): Record<string, number>` (every player present, 0 when no points; IMP-041).
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
5. **Clock.** Every timer (500 ms hold, 8 s tap-mode hide, 2-minute timer, countdown, reveal steps, toasts, 3 h, 12 h)
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
   `countdown-number`, `reveal-line` (one per reveal line, in order), `build-up-dots`, `also-called`, `round-outcome`,
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
