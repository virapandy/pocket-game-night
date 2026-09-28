# src/games/tambola/: Tambola (Housie)

## Rules the tests will prove
- Every ticket has 15 numbers, 5 per row across 3 rows, each in its column range
  (1–9, 10–19 … 80–90), and every column has at least one number.
- A standard sheet of 6 tickets uses every number from 1 to 90 exactly once.
- No number is called twice, and at most 90 are called.
- A claim is accepted if and only if the pattern is complete on numbers already called.
- Simultaneous claims follow the configured house rule every time.
- A player's view never contains another player's ticket or the upcoming draw order.
- The same seeds and moves always replay to the same result.

## Seeds
- **Draw seed:** host phone only. It never appears in a QR code, a link or a player's view.
- **Ticket seeds:** one per ticket. A QR code carries only that player's ticket seed and number.

## Fun friction: defaults protect the room
| Moment | Default | Optional shortcut (off, with a one-time warning) |
|---|---|---|
| Calling | The anchor reads the number and rhyme aloud from the host phone | Phone speaks the call |
| Marking | Players tap their own numbers | Auto-mark |
| Claiming | Players shout; the host enters the claim | Claim button on each phone |
| Verifying | The host checks and announces | Verdict pushed to every phone |

## House rules (decided 2026-09-28)
Each is a declared setting with the convention as its default (TAM-130). Changing one never affects a game
in progress. Source: `specs/tambola/04-house-rules.md` and `docs/decisions.md`.

| Rule | Default | Setting |
|---|---|---|
| Ties on the same called number, claimed before the next number | Share the prize (TAM-041, TAM-042) | |
| Claim after the next number was called | Late, so a bogey; the host sees which number completed it (TAM-043, TAM-038) | |
| Bogey | The ticket is out; its contribution stays in the pot (TAM-044) | "Carry on" |
| Tickets per player | 1, up to 3 (TAM-045) | Limit |
| End of game | The last Full House tier in play is won (TAM-046, TAM-075) | Via tiers |
| Rhyme language | English and Hindi first (TAM-049) | English, Hindi, Both |
| Late joiners (Phase 1b) | Until 10 calls; 0 turns it off (TAM-067) | Limit |
| Auto-call (Phase 1b) | Off (TAM-120) | Timer |

## Tickets
- **Phase 1a is paper tickets only.** Players bring their own ticket book; the app makes no tickets.
  A claim is checked from the numbers the player reads out, typed by the host (TAM-037), against
  the numbers called at that moment (TAM-035, TAM-036). The host picks the claiming player (TAM-039).
- **Phase 2** adds tickets made by the app from ticket seeds, handed out from sheets of 6 (TAM-048).

## Prizes
From `specs/tambola/08-prizes.md` (TAM-080 to TAM-091). Money is calculated, never moved.
- Pot = tickets in play × contribution. Tiers are suggested from the ticket count (TAM-081).
- Tiers always add up to the pot exactly: round to the unit (₹10 default), then nudge (TAM-082).
- The host can remove any tier except Full House and add it back (TAM-083); the anchor confirms
  before the first number, and prizes are then locked (TAM-084, TAM-085).
- Shared prizes split to the rupee, the extra rupees going in ticket or player order (TAM-087).
- No roll-over: an unclaimed tier is spread across the tiers won in the same game (TAM-088).
- "No money" games use text labels as prizes (TAM-090).
- Every finished game records what each person paid and won (TAM-089, PLT-021).

## Undo
- Claims: any time; later calls stay as they were (TAM-070, TAM-072).
- Calls: only within 5 seconds, measured from the time on the move record (TAM-119, TAM-071).
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
- `rules/`: the pure rules module (the contract answers)
- `ui/`: screens
- `index.ts`: registration, the only file other code may import
- Rhymes live in `content/tambola/`, not in code.
