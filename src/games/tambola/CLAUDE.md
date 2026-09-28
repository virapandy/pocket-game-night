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

## House rules: waiting for the owner's decisions
Do not hard-code these. Each is a declared setting with a default, set once the owner decides:
claim patterns offered, the simultaneous-claim rule, the bogey penalty, tickets per player,
and the first languages for rhymes and voice.

## Structure
- `rules/`: the pure rules module (the contract answers)
- `ui/`: screens
- `index.ts`: registration, the only file other code may import
- Rhymes live in `content/tambola/`, not in code.
