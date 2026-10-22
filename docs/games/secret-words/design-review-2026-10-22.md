# Secret Words: critic pass and UX design review, before tests (product owner, 22 October 2026)

**What this is.** Stage 3 of `docs/proposals/design-before-code.md`, on scenarios version 3.5 and screen map draft 2, before
the tester writes a single test. Two read-only helpers: the **critic** (largest model; contradictions, missing intentions,
lifecycle gaps, ambiguity) and the **UX designer** (mid-size model; the guidelines at every size, on paper). Neither repeats
the 11 October persona walks or Jev read. **Nothing blocks play**; the UX designer rechecked every height budget the
scenarios state and they add up.

**Errata already fixed (my miss on 11 October, no decision needed).** Version 3.5's wording batch reached the strings table
but missed four strings that wrap across lines in scenario bodies (map phone code line, map phone small line, team-of-one
dialog, broke-a-rule line); fixed today. Version 3.5's new pieces (where-line, Pause icon, How to play on Choices, private
line, anyone line, map phone team choice) are in the strings table and the "What version 3.5 changes" list but not yet in
the scenario bodies tests are written from; version 3.6 writes them in.

## 1. Decisions for the owner (all at once)
| # | Question | Found by | Recommendation |
|---|---|---|---|
| D1 | **Three phones, new clue givers for game 2.** Today the screen says "Meena and Kabir: tap Next map on your phones", but their phones have no map (or last week's), while Riya and Arjun, now guessers, still hold working map phones and could see the next map. | Critic, worst room moment 1 | With three phones, when the clue givers change: "Meena and Kabir: scan this code on your phones. Riya and Arjun: tap Done with this game." Two phones keep "Hand the map phone to…". |
| D2 | **The host who also gives clues.** Nothing stops the host from opening the map on the board phone through Join a game, which puts the whole map face up on the table. | Critic, worst moment 3 | On a phone with a game night in progress, opening a map first asks "This phone is the board. Open the map here?" with main "No, keep the board" and points to "Show the map to a clue giver". |
| D3 | **"I give clues for:" on the map phone** can't be changed today. After a team change, the wrong team's words are listed first. | Critic, worst moment 2 | Keep asking until set, and add quiet "Change" beside it. |
| D4 | **Timer size.** Guideline 46 says timers are at least 120 px; the scenarios use 28, 40 and 56 px. | UX designer | Extend guideline 49 (word boards) to cover the timer on board screens; keep 56 px at 390 × 844 and make the pass-screen timer 120 px, where there is room. |
| D5 | **Pause icon on the scan screen and the preview board too** (decision 6 named "board screens"; 3.5 left these two out, and pausing the scan screen hides the QR). | Critic | Yes, on both. |
| D6 | **The 320 px wide phone in portrait** shows "Turn your phone sideways" for the board, a dead end with rotation lock. The Easy board fits (73 px cells). | UX designer | Show the Easy board in portrait at 320; keep the sideways line for Full, with "or choose the Easy board next game". |

## 2. Resolved by the product owner (go into version 3.6 and map draft 3; tell me if any should be a question)
| # | Finding | Resolution |
|---|---|---|
| R1 | `map-end-line` reads as "tap Done when the host deals a new board" | "Game over: tap Done with this game. New board on the host: tap Next map." |
| R2 | Where-line "Chai Champions' clue" is a possessive, which SWD-013 forbids | "Turn 4 · clue for Chai Champions" |
| R3 | Menu table order disagrees with the 3.5 groups | Rewrite the table's columns in group order |
| R4 | SWD-114 doesn't say which buttons get which tap guard, or that waiting looks like disabled | List every main with its guard; dialog mains get 800 ms; "Turn ends, they get a word" gets the 1.5 s on "Other team's turn"; a waiting main shows the greyed look with no label change, a disabled one keeps its own label |
| R5 | Where-line placement on Home's row and the picker card; text before the first reveal | Second line of the row, under the time; "Tap to resume" stays; before the first reveal "3 guesses left" |
| R6 | Private map: the "Our words / Flip" row appears and pushes the pad 48 px; "Not Riya?" turns into "Someone saw the map" in the same spot; 16 px over at 360 × 640 since the private line | Reserve the row's space from the start; "Someone saw the map" moves to the top right; the pad is 72 px tall while the map shows; the pad is a quiet outlined look |
| R7 | No line for first words that don't match | Scan screen and map phone: "Doesn't match? Scan this code again." |
| R8 | E10's "The host phone stays at the table." missing from How to play | Add it as rule 7 |
| R9 | `guide.md` and `lifecycle.md` still say the old judge, the old Landmine default and old names | Mark both "replaced by scenarios.md where they differ" at the top, and correct the five lines the critic named |
| R10 | Map rows without scenario IDs; scenarios with no map path (camera link to the map phone, Show the map to from guessing, team-of-one's End the game, the 12-hour limit); one impossible path | Add IDs and paths; remove P2 → New board → scan screen |
| R11 | Guessing at 568 × 320: result and guesses left fall below the fold; no room for the Pause icon in the 160 px panel | Guess line moves into the empty action slot until the first reveal; at 160 px "↻" moves into the menu and Pause takes its place |
| R12 | Guessing at 360 × 640 assumes no browser bars | Add a 360 × 560 case; the existing shrink order applies, then the page scrolls with the main fixed |
| R13 | Scan screen at 568 × 320 doesn't fit and the main overlaps the QR; in portrait the warning is below the fold | Landscape: QR left, text and main right; portrait: "Guessers: don't scan this one!" directly above the QR |
| R14 | Map phone: "Hide map" far down; three list buttons wrap at 320 and 360 | Pin "Hide map" at the top right; stack the list buttons in portrait |
| R15 | Faded cells at 40% and 50% opacity fall to about 2:1 contrast | Lighter fill with full-strength dark text, strikethrough and icon kept |
| R16 | Guidelines 14, 24 and 46a don't say what the scenarios rely on; the Players row can't fit one line at 320–360 | Reword 14 (main 60 px; 72 px for Tambola's "Next number"), 24 (12 px means CSS px), 46a (two columns allowed when each is at least 140 px); Players row stacks the move and remove buttons under the name |
| R17 | Locked cells look live | Play-test first (later list) |
| R18 | No shared on-screen text list exists yet (faster-cycles item 2) | Secret Words' canonical strings table becomes the seed of that list; the tester generates the list from it |

## 3. What happens next
Owner answers D1–D6 → version 3.6 (all of section 2 plus the answers, written into every scenario they touch) and screen map
draft 3 (no "proposed" marks) → a coder-reader and tester-reader check (`docs/spec-rules.md`) → the prototype is generated
from draft 3, and the tester copies 3.6 into `specs/secret-words/`. Draft 2 and version 3.5 stay as they are until then.

## 4. Precedent from other apps (owner asked, 22 October; research helper, web only, sources opened)
Evidence is thin: store pages and one university guide carried most of it; no Reddit or BGG threads and no help pages for
Codenames Online, Codewords or the clones were found. Sources: CODENAMES Companion on the App Store
(https://apps.apple.com/us/app/-/id1032754439); Horsepaste (https://www.horsepaste.com/, guide at
https://www.liverpool.ac.uk/researcher/postdoc-appreciation-week/npdc/engagement/pre-conference/codenames/); Codenames Offline
(http://imperialoctopus.com/posts/codenames-offline/); Codenames digital app review
(https://www.theboardgamefamily.com/2024/10/codenames-digital-app-review/).

| # | What others do | Effect on our recommendation |
|---|---|---|
| D1 | Companion: a new random key each round from one sync code. Horsepaste: "next game" resets everyone's role; spymasters choose again. | **Supported.** A new game resets who sees the key; ours says so on screen. |
| D2 | Companion's most recorded complaint is the key showing by accident when the phone changes hands or is laid down; a reviewer asked for a confirmation before the key shows. Horsepaste's only guard is a button on the same page. | **Supported, and strengthened:** confirm before a map opens on the board phone; we never rely on tilt sensing (already true). |
| D3 | Table-play apps show both colours equally; only the 2024 online app marks your team, by background colour. | **Partly.** Keep both colours shown; the chosen team is a highlight, not a filter, and changeable. |
| D4 | Companion: optional timer the host sets; audible announcements. Size not documented. | **No precedent on size.** Ours is optional with a chime; size stays a guideline call. |
| D5 | No pause found in any app. | **Ours alone.** Low stakes. |
| D6 | No evidence on portrait layout. | **Ours alone.** Low stakes. |
Borrowed for later: the game code always visible on the board screen (Companion), a colour-blind mode (Horsepaste; ours
already never uses colour alone). Because precedent is thin, the paper play-test in `lifecycle.md` remains the strongest check.
