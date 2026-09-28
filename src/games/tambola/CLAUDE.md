# src/games/tambola/: Tambola (Housie)

## Rules the tests will prove
- Every ticket has 15 numbers, 5 per row across 3 rows, each in its column range
  (1–9, 10–19 … 80–90), and every column has at least one number.
- A standard sheet of 6 tickets uses every number from 1 to 90 exactly once.
- No number is called twice, and at most 90 are called.
- Paper tickets: a win is recorded on the anchor's word (TAM-037); the "Check numbers" helper says a set of
  numbers is complete if and only if every one has been called (TAM-034, TAM-139). It records nothing.
- Simultaneous claims follow the configured house rule every time.
- A player's view never contains another player's ticket or the upcoming draw order.
- The same seeds and moves always replay to the same result.

## Seeds
- **Draw seed:** host phone only. It never appears in a QR code, a link or a player's view (TAM-052).
- **Sheet seed (Phase 2):** host phone only. Tickets are made in sheets of 6 from it (TAM-008).
- **No seed ever leaves the host.** A player's QR carries only that ticket's 15 numbers and layout, its
  ticket number and the game code (TAM-053), because a seed would let a phone rebuild the rest of its sheet.

## Fun friction: defaults protect the room
| Moment | Default | Optional shortcut (off, with a one-time warning) |
|---|---|---|
| Calling | The anchor reads the number and rhyme aloud from the host phone | Phone speaks the call |
| Marking | Players tap their own numbers | Auto-mark |
| Claiming | Players shout; the anchor checks the paper ticket; the host taps "Record a win" | Claim button on each phone |
| Verifying | The anchor announces; the app shows "Top Line: ✓ Riya, ₹60" | Verdict pushed to every phone |

## House rules (decided 2026-09-28)
Each is a declared setting with the convention as its default (TAM-130). Changing one never affects a game
in progress. Source: `specs/tambola/04-house-rules.md` and `docs/decisions.md`.

| Rule | Default | Setting |
|---|---|---|
| Ties on the same called number, claimed before the next number | Share the prize (TAM-041, TAM-042) | |
| Claim after the next number was called | Late, so a bogey. Paper tickets: the anchor judges and the host records the bogey (TAM-043); the app's own check is phone tickets only (TAM-038, Phase 2) | |
| Bogey | The ticket is out; its contribution stays in the pot (TAM-044) | "Carry on" |
| Tickets per player | 1, up to 3 (TAM-045) | Limit |
| End of game | Manual: after a recorded win the host adds winners ("Add another winner") or closes the tier ("Close Top Line", or the chip's Close); "Next number" reads "Close Top Line first" until then. Once the last Full House tier is closed, the main button is "End game and show payouts"; End game and Discard are also in the menu. Recording or closing a Full House never ends the game by itself. Unwon prize money is handed back per ticket (TAM-046, TAM-075, TAM-088, TAM-145) | Via tiers |
| Rhyme language | English and Hindi first (TAM-049) | English, Hindi, Both |
| Late joiners (Phase 1b) | Until 10 calls; 0 turns it off (TAM-067) | Limit |
| Auto-call (Phase 1b) | Off (TAM-120) | Timer |

## Tickets
- **Phase 1a is paper tickets only.** Players bring their own ticket book; the app makes no tickets.
  The anchor checks a claimed ticket in the room; the host taps "Record a win", picks the prize and the
  player (several for a tie), then Confirm, or Bogey (TAM-037, TAM-039). No numbers are typed.
  "Check numbers" in the menu is an optional helper for disputes that records nothing (TAM-139).
  Games saved before 28 September 2026 hold the old typed-number `claim` moves; the rules still replay them.
- **Phase 2** adds tickets made by the app from the sheet seed, handed out from sheets of 6 (TAM-048).

## Prizes
From `specs/tambola/08-prizes.md` (TAM-080 to TAM-091). Money is calculated, never moved.
- Pot = tickets in play × contribution. Tiers are suggested from the ticket count (TAM-081).
- Tiers always add up to the pot exactly: every tier but Full House is a whole number of units (₹10 default),
  tiers with the same share always get the same amount, and Full House takes the rounding difference
  (TAM-082, TAM-092).
- The host can remove any tier except Full House and add it back (TAM-083); the anchor confirms
  before the first number, and prizes are then locked (TAM-084, TAM-085).
- Shared prizes split to the rupee, the extra rupees going in ticket or player order (TAM-087).
- A won tier pays exactly its amount. The money of tiers nobody won is handed back equally per ticket,
  extra rupees to tickets in setup order (TAM-088, TAM-093); nobody won, or a discard: every contribution
  goes back (TAM-144, TAM-140). `summary.payouts` has paid, won, handed back and net per player.
- "No money" games use text labels as prizes (TAM-090).
- Every finished game records what each person paid and won (TAM-089, PLT-021).

## Undo
- Recorded wins and bogeys: any time; later calls stay as they were (TAM-070, TAM-072).
- Calls: only within 5 seconds, measured from the time on the move record (TAM-119, TAM-071); on screen,
  the undo toast "Called 21 · Undo (5s)" (TAM-125).
- Game end: never.

## Rhymes
- Several per number, English and Hindi, with style tags and a family-friendly flag.
- The pack is `content/tambola/rhymes.json` (format 1), made from the approved catalog
  `docs/games/tambola/rhymes.csv` by `npm run build:rhymes`, which refuses to write a pack that breaks
  TAM-150, TAM-156 or TAM-157. Never edit the JSON by hand; change the catalog and rebuild.
- `styleWeights` in the pack: Indian styles (indian, cricket, bollywood, festival, hindi) weigh 2,
  classic and playful 1 (owner, 2026-09-28).
- On each call one allowed rhyme is picked **from the game's seeded generator** (TAM-151, TAM-152),
  filtered by the host's language setting and the family-friendly filter, on by default (TAM-153, TAM-154).
- "Another rhyme" shows a different allowed rhyme without changing the number (TAM-155).
- No rhyme for a language: show the number alone (TAM-015).

## Structure
- `rules/`: the pure rules module: `rules.ts` (the contract answers, `tambolaDefaults`), `prizes.ts`
  (`suggestTiers`, `planPrizes`, `apportion`), `rhymes.ts` (`pickRhyme`), `check.ts` (`checkNumbers`), `types.ts`
- `ui/`: screens: `TambolaScreen` (start, setup, game, past game), `Setup`, `Play`, `Summary`, `Settings`,
  `HowToPlay`; the calling screen follows `docs/games/tambola/ux-calling-screen.md` (one screen, no
  scrolling; menu, prize chips, board sheet, undo toast); `saved.ts` turns saved games into matches; `device.ts` holds wake lock, vibration, sound, seeds
- `index.ts`: registration (`tambola = { info, Screen, PastGame, describe, rules }`), the only file other code may import
- Storage is not here: the app passes a `SavedGameStore` and `Preferences` (engine interfaces) to the screens.
- Rhymes live in `content/tambola/`, not in code.
