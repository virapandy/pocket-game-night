# What the Tambola tests expect (Phase 1a with the 1a.1 fixes, Phase 1b, and Phase 2)

For the Build workspace. The tests are the definition of done; this page lists the names and shapes
they import, so you don't have to reverse-engineer them. If something here is wrong or impossible,
write it in `docs/test-questions.md`; don't work around it.

Everything below is imported from **`src/games/tambola/index.ts`** only (the game's registration file).

## Exports

| Export | What it is |
|---|---|
| `tambolaRules` | `GameRules<TambolaConfig, TambolaState, TambolaMove, TambolaView>` from the engine contract |
| `tambola.rules` | The same object, on the registration (`tambola = { info, Screen, rules }`), for the shared contract suite |
| `tambolaDefaults` | `TambolaSettings`: the house rules and room defaults a new game starts with |
| `suggestTiers(tickets)` | Suggested tiers for this many tickets: `{ pattern, percent }[]` (TAM-081) |
| `planPrizes(input)` | Pot and rounded tier amounts: see "Prizes" below (TAM-080 to TAM-084) |
| `pickRhyme(pack, n, settings, rng, excludeText?)` | One allowed rhyme for number `n`, or `null` (TAM-015, TAM-151 to TAM-158) |
| `checkNumbers(called, pattern, numbers)` | The optional "Check numbers" helper (TAM-139): pure, records nothing. See below |

The rhyme pack itself is read by the tests straight from `content/tambola/rhymes.json`.

## Patterns
`'early-five' | 'top-line' | 'middle-line' | 'bottom-line' | 'four-corners' | 'full-house' | 'second-full-house'`

Numbers the "Check numbers" helper needs (TAM-139): Early Five 5 · each Line 5 · Four Corners 4 · Full House 15 ·
Second Full House 15. Display names: Early Five, Top Line, Middle Line, Bottom Line, Four Corners, Full House,
Second Full House.

## Setup (`SetupInput<TambolaConfig>`)
```ts
seeds: { draw: string }                     // host-only
config: {
  ticketMode: 'paper',
  players: { id: string; name: string; tickets: number }[],   // tickets 1..3 (TAM-045)
  money: { currency: 'INR'; contribution: number } | null,     // null = "No money" (TAM-090)
  tiers: { pattern: Pattern; amount: number; label?: string }[], // as confirmed by the anchor
  settings: TambolaSettings,
}
TambolaSettings = {
  ties: 'share', lateClaims: 'bogey', bogey: 'out' | 'carry-on',
  ticketsPerPlayer: 1, maxTicketsPerPlayer: 3, lateJoinUntil: 10, autoCall: 'off' | number,
  speakCalls: boolean, autoMark: boolean, claimButtons: boolean, verdictsOnPhones: boolean,
  vibrate: boolean, sound: boolean,
  rhymes: { language: 'en' | 'hi' | 'both'; familyFriendly: boolean },
}
```
`setup()` throws (or `invariants()` reports a problem) if a player has fewer than 1 or more than 3
tickets, or if the tier amounts don't add up to the pot (tickets × contribution) in a money game.

## Moves (all by `HOST`)
| Move | Meaning |
|---|---|
| `{ type: 'call' }` | Draw the next number. Refused with a reason containing "All 90 numbers called" after 90 |
| `{ type: 'another-rhyme' }` | Show a different allowed rhyme for the current number (TAM-155) |
| `{ type: 'record-win', pattern, playerIds: string[] }` | Paper tickets (TAM-037): the anchor checked the ticket; record a win for one or more players (a tie). No numbers. A *detail move* |
| `{ type: 'record-bogey', playerId, pattern }` | Paper tickets (TAM-037): the anchor ruled a bogey; record it against the player. A *detail move* |
| `{ type: 'close-tier', pattern }` | Close a won tier: no more winners for it (TAM-145). For a tier nobody won, accepted and changes nothing |
| `{ type: 'rename', playerId, name }` | Rename a player during the game; a duplicate name is refused (PLT-024) |
| `{ type: 'end' }` | End the game now (TAM-066) |
| `{ type: 'discard' }` | Discard the game: void, contributions handed back (TAM-140) |
| `{ type: 'add-player', player: { id, name, tickets } }` | Phase 1b, TAM-067: a late joiner with 1 to 3 tickets. A *detail move*. See "Late joiners" below |
| `{ type: 'remove-player', playerId }` | Phase 1b, TAM-184: take out a late joiner added by mistake. A *detail move* |

`legalMoves(state, HOST)`, until the game is over:
- while a won tier is waiting to be closed: one `close-tier` per such tier, `end`, `discard` (no `call`: the next
  number waits, TAM-145);
- once the last Full House tier is closed: only `end` and `discard` (no more calls, TAM-075);
- otherwise: `call` (while fewer than 90 are called), `end`, `discard`.
After the game is over: nothing. `detailMoves` includes `'record-win'`, `'record-bogey'`, `'rename'`,
`'add-player'` and `'remove-player'`.
`call` is refused (`ok: false`) while a won tier waits to be closed, and after the last Full House tier is closed.

`apply` returns `ok: false` (nothing changes) for: a pattern not in this game (TAM-031); a pattern
already closed, with a reason containing "already won" (TAM-030); an empty `playerIds`, a player listed twice,
an unknown player, or a player who already won that tier; a win or bogey before the first number or after the
game is over; a duplicate name.
A bogey is **not** `ok: false`: it is `ok: true` with the verdict in the state.

### How a paper-ticket win is recorded (TAM-037, change request of 28 September 2026)
1. The app does not check numbers or lateness with paper tickets: the anchor checks the ticket in the room,
   and the host records what the anchor decided. A `record-win` for an open tier is always accepted.
2. A won tier stays open, and more winners can be recorded for it (another `record-win`, "Add another winner"),
   until the host closes it with `close-tier` (TAM-145, TAM-041, TAM-042). The prize is shared between all its
   winners, split to the rupee, extra rupees in player order (TAM-087). After closing, a win for it is refused
   with "already won" (TAM-030). `second-full-house` can be won only after `full-house` is closed.
3. A bogey is recorded against the player (TAM-044) and listed in `summary.bogeys`. With paper tickets the app
   does not block that player's later wins (the room keeps the ticket out; they may hold another).

### The "Check numbers" helper (TAM-139)
`checkNumbers(called: number[], pattern, numbers: number[])` is a pure function: it never changes a game.
- Returns `{ ok: true, checks: { number, called }[], complete: boolean }`: one check per typed number, in the
  order typed; `complete` is true if, and only if, every typed number has been called (TAM-034).
- Returns `{ ok: false, reason }` with a one-line reason for a number outside 1–90 or typed twice, and exactly
  `"<Pattern> needs <n> numbers"` (for example "Top Line needs 5 numbers") for too few numbers.

### Undo (through the engine's `undo(rules, match, seq, { by, now })`)
- A recorded win or bogey: any time; later calls stay (TAM-070, TAM-072). Undoing a win reopens its tier.
- A call: only the latest call, and only if `now - record.at <= 5000` (TAM-119, TAM-071).
- `end` and `discard`: never.

### Game over
Only after `end` or `discard`. Accepting or closing a Full House never ends the game by itself (TAM-075, TAM-145).

## View (`view(state, viewer)`)
```ts
TambolaView = {
 players: { id: string; name: string }[],
  tiers: { pattern: Pattern; amount: number; label?: string }[],   // the locked tiers (TAM-085)
  called: number[],                 // every call so far, in order
  current: { number: number; rhyme: Rhyme | null } | null,
  lastCalls: number[],              // most recent first, current included: host 5 (TAM-016), room 3 (TAM-107)
  allCalled: boolean,               // TAM-076
  openPatterns: Pattern[],          // tiers in play not yet closed: still claimable (TAM-031, TAM-145)
  awaitingClose: Pattern[],         // won, not yet closed: the host may add winners or close (TAM-145)
  readyToEnd: boolean,              // the last Full House tier is closed: only End or Discard now (TAM-075)
  claims: ClaimView[],              // host: every claim in order; room: at least the latest
  over: boolean,
  summary: TambolaSummary | null,   // once over
}
Rhyme = { n: number; lang: 'en' | 'hi'; style: string; familyFriendly: boolean; text: string }  // a pack entry
ClaimView = {                                        // one per recorded winner or bogey, in order
  playerId: string, pattern: Pattern,
  verdict: 'accepted' | 'bogey',
  prize?: number,                                     // this winner's share after ties (TAM-086, TAM-087); none with "No money"
}
TambolaSummary = {
  result: 'ended' | 'discarded',
  callsMade: number,
  pot: number | null,
  tiers: { pattern: Pattern; amount: number; label?: string; winners: { playerId: string; amount: number }[] }[],
  bogeys: { playerId: string; pattern: Pattern }[],
  payouts: {                        // TAM-088, TAM-089: one per player, in setup order; null with "No money"
    playerId: string; name: string;
    paid: number;                   // contribution × tickets
    won: number;                    // prizes only
    handedBack: number;             // this player's share of the money of tiers nobody won
    net: number;                    // won + handedBack − paid
    hostGives: number;              // TAM-089: what the host hands this person = won + handedBack; they add up to the pot
  }[] | null,
  money: MoneyRecord | null,        // engine's MoneyRecord, one person per player (PLT-021, TAM-089):
                                    // paid = payouts.paid, won = payouts.won + payouts.handedBack (what they get back, PLT-017)
}
```
In `summary.tiers`, `amount` is the tier's locked amount (TAM-085); a won tier pays exactly that, and its
winners' amounts add up to it. A tier nobody won has `winners: []` ("not won"); its money is handed back
(TAM-088): the total of the unwon tiers is split equally **per ticket**, to the rupee, extra rupees going to
tickets in the order the players were listed at setup (a player's tickets together). A ticket that is out after
a bogey still gets its share (TAM-093). Discard (TAM-140) and "nobody won anything" (TAM-144) hand back every
contribution. Prizes paid out plus money handed back always equal the pot. The room and player views must never hold the draw seed or any number
not yet called (TAM-052).

## Late joiners (Phase 1b: TAM-067, TAM-184, TAM-093)
Tested in `late-joiners.test.ts`, through the two moves above.
- `add-player` is accepted while fewer than `settings.lateJoinUntil` numbers have been called (10 by default;
  at 10 it is refused with a reason). With `lateJoinUntil: 0` it is always refused. Also refused, with nothing
  changed: a name already in the game (PLT-024), 0 or more than 3 tickets (TAM-045), an id already used, and
  anything after the game is over.
- The numbers already called stay called; nothing about the draw changes. The joiner can be named in
  `record-win` like anyone else.
- Money game: the pot grows by `tickets × contribution`, and that money is split across the tiers **not yet
  won** (a tier with a recorded winner keeps its amount, even before it is closed), rounded as in TAM-092:
  every tier except Full House grows by a whole multiple of the ₹10 unit (the tests check this for ₹50 added
  to the suggested tiers for 6 tickets); Full House takes the rest and stays the largest, so the tiers in
  `view.tiers` always add up to the new pot exactly. The new amounts are in `view.tiers` for the host screen.
  "No money" game: the player is added and the tiers do not change.
- `remove-player` works only for a late joiner, and only if no number has been called since they joined.
  It puts every tier amount back exactly as it was before they joined; adding them again gives the same
  amounts as the first time. After a later call it is refused, and nothing changes.
- A late joiner is in `summary.payouts` (after the players listed at setup, in the order they joined), pays
  `tickets × contribution`, and their tickets count like every other ticket in money handed back (TAM-093),
  extra rupees still going in player order. `summary.money` balances (`moneyProblems` is empty).
- A game with late joiners replays exactly (TAM-073).
- Paper tickets: a pattern already complete when someone joins "cannot be claimed" (TAM-067); with paper
  tickets that is the anchor's call, like any late claim (TAM-043), so the app records whatever win the anchor
  accepts. The app's own check waits for phone tickets (Phase 2).

## Prizes
```ts
planPrizes({
  tickets: number, contribution: number, unit?: number /* default 10 */,
  removed?: Pattern[], added?: Pattern[], fixed?: Partial<Record<Pattern, number>>,
}) => { pot: number; tiers: { pattern: Pattern; percent: number; amount: number }[] }
```
Tiers add up to the pot exactly; never negative; Full House the largest unless the anchor fixed amounts;
removing `full-house` has no effect (or throws). TAM-082 and TAM-092: tiers with the same `percent` always get
the same amount (unless the anchor fixed one of them); every tier except Full House is its share rounded to
the nearest `unit` (an exact half rounds down), or, in tiny pots where that would leave Full House smaller than
another tier, to the nearest ₹1 (TAM-082, owner decision 2026-09-29: ₹36 over 6 tickets gives 4 / 5 / 5 / 5 / 17);
rounding differences go to Full House, which takes the difference (with Full House fixed by the anchor,
the other unfixed tiers take it, still keeping equal shares equal).

## Rhymes
`pickRhyme(pack, n, { language, familyFriendly }, rng, excludeText?)`: an entry of the pack for `n`
allowed by the settings, chosen by `rng` with the pack's `styleWeights` (Indian styles 2, others 1);
never the `excludeText` one if another is allowed; `null` if none is allowed.

## Phase 2: phone tickets (owner sign-off 29 September 2026)
Tests: `tickets.test.ts`, `phone-claims.test.ts`, `phone-secrets.test.ts` (helpers in `phone.ts`), and
`tests/contract/tambola-phone.test.ts`. Everything is still imported from `src/games/tambola/index.ts` only.
Scenarios: TAM-001 to TAM-008, TAM-020 to TAM-029, TAM-030 to TAM-032, TAM-034 to TAM-036, TAM-038, TAM-041,
TAM-044, TAM-048, TAM-050 to TAM-058, TAM-117, TAM-170, TAM-172, TAM-174 to TAM-179, TAM-190, TAM-194, TAM-196.

### Extra exports
| Export | What it is |
|---|---|
| `makeTickets(sheetSeed, count)` | Tickets 1..count from sheets of 6: `{ number, sheet, rows }[]`. `rows` is 3 rows of 9 cells, `number` or `null` for a blank. Ticket n is on sheet ⌈n/6⌉; every full sheet holds 1–90 exactly once (TAM-006); fewer tickets are the first ones of the same sheets (`makeTickets(s, 4)` equals the first 4 of `makeTickets(s, 18)`). Same seed, same tickets (TAM-008). A count of 0 or less gives `[]` (or throws); never a broken ticket |
| `ticketInfo(hostView, ticket, startedAt)` | What the hand-out QR carries for one ticket: `{ game, ticket, name, rows, startedAt, tiers }` (`v` allowed too). `game` is the host view's `code`, `name` the owner's name, `tiers` the patterns in play in tier order (TAM-053, TAM-170, TAM-172) |
| `encodeTicket(info)` / `decodeTicket(text)` | The ticket QR's text and back. `decodeTicket` returns `{ ok: true, ticket: { v: 1, game, ticket, name, rows, startedAt, tiers } }` (exactly these keys) or `{ ok: false, reason }` for anything else (garbage, a claim QR). The text depends only on `info`: no seed, no other ticket, no called number (TAM-053, TAM-054) |
| `typedCode(info)` / `decodeTypedCode(code)` | The typed code "7K3P-M4X9-2TRD": letters and digits without 0, O, 1, I, L, in groups of 4 (TAM-117). Decoding it alone gives `{ ok: true, ticket: { rows, … } }` with the ticket's numbers, or `{ ok: false, reason }`. See the note on its length below |
| `encodeClaim(claim)` / `decodeClaim(text)` | The claim QR: `{ game, ticket, pattern, rows }` in, `{ ok: true, claim: { v: 1, game, ticket, pattern, rows } }` (exactly these keys) or `{ ok: false, reason }` out. A ticket QR is not a claim QR, and the other way round (TAM-177) |
| `readClaim(hostView, text)` | The host reading a claim QR against its own copy (TAM-177, TAM-179). Pure, never throws, changes nothing. `{ ok: true, ticket, pattern }`, or `{ ok: false, reason, checkByNumber? }` |

The QR text returned by `encodeTicket` is what the app puts inside its own link for the hand-out QR (for example
after `#t=`), so a phone's camera opens the app (TAM-117); `decodeTicket` must accept that text (accepting the whole
link as well is fine). Both QR formats carry `v: 1` so later versions can add to them and still read old ones
(the extensibility note in `specs/tambola/05-secrets-and-seeds.md`).

`readClaim` reasons (none is a bogey, nothing changes): "This claim is for another game (code 7K3P)" (the other
game's code); "Ticket 5 is not in this game" (never handed out, TAM-176); "This claim doesn't match ticket 3"
(the rows differ from the host's copy) with `checkByNumber: 3`, so the host can be offered "Check ticket 3 by
number"; a plain reason for garbage. "Top Line already won" and "Ticket 3 is out" may come from `readClaim` or from
the `check-claim` move; the tests accept either. Any edit to a claim QR is refused, or still reads as a claim whose
rows match the host's copy exactly.

### Setup
```ts
seeds: { draw: string, sheet: string }       // both host-only (TAM-008, TAM-052)
config: { ticketMode: 'phone', players, money, tiers, settings }   // as for paper
```
Tickets are handed out in the order players are listed, each player's tickets together: Riya (2) gets 1–2,
Asha (3) 3–5, Dad (1) 6, Kabir (3) 7–9 (TAM-172, TAM-194). Tickets not handed out are not in the game (TAM-176).

### Views
- Host view adds `code` (the game code: 4 characters from `2-9 A-H J K M N P-Z`, different between games; worked
  out from the setup, for example `gameId`, **never** from a seed) and
  `tickets: { number, sheet, rows, playerId, status: 'in-play' | 'out' | 'paper' }[]`: every ticket in the game (TAM-056).
- Room view: no tickets (`tickets` missing or `[]`).
- Player view (`{ kind: 'player', playerId }`): `tickets: { number, rows }[]`, that player's own tickets only, and
  no called numbers: no number 1–90 in any list in the view except their own tickets' numbers (TAM-050, TAM-051).
  Neither seed appears in the room or player views, in any form (plain, URL-encoded, base64).
- `ClaimView` for a phone claim adds `ticket`. A bogey adds `reason: 'not-called' | 'late'`; `'not-called'` adds
  `missing: number[]` (the pattern's numbers not called; lines, Four Corners, Full House) or `needed: number`
  (Early Five: how many more); `'late'` adds `completedAt`, the number whose call completed the pattern (TAM-038).
  `playerId` is the ticket's owner when the claim was checked.

### Moves (all by `HOST`, all *detail moves*, none in `legalMoves`)
| Move | Meaning |
|---|---|
| `{ type: 'check-claim', ticket, pattern }` | The host checked a phone ticket, by scan or typed number (same move either way, TAM-178). Judged on the numbers called so far (TAM-036): complete, and completed by the latest call → accepted; complete earlier → bogey `'late'`; otherwise bogey `'not-called'`. Only called numbers matter; any `marks` or `playerId` sent along is ignored (TAM-035, TAM-174). Accepted claims credit the owner and leave the tier waiting to be closed, exactly like `record-win` (ties share, TAM-041, TAM-145). A bogey with `bogey: 'out'` makes the ticket `'out'` |
| `{ type: 'assign', ticket, playerId }` | Give a ticket to another player, any time (TAM-172, TAM-175). Prizes it won before and after go to the new owner; kept in the records, so a replay shows it |
| `{ type: 'to-paper', playerId }` | "Can't scan? Give a paper ticket" or a phone that died: that player's tickets become `'paper'` (TAM-058). Their wins are then recorded with `record-win` |

`check-claim` is refused (`ok: false`, nothing changes) with: a ticket not in this game (0, negative, fractional,
`NaN`, a string, or beyond the tickets handed out; reason containing the number and "in this game", such as "No ticket
14 in this game", TAM-032); a pattern not in this game (TAM-031); a closed tier ("Top Line already won", TAM-030); a
ticket that is out ("Ticket 3 is out", TAM-044); a paper ticket (reason mentions "paper"); the same ticket winning
the same tier twice; before the first number or after the game is over. `assign` and `to-paper` are refused for an
unknown player or ticket. A claim can be undone any time, like a recorded win (TAM-070, TAM-072).

### Back from "Waiting for Phase 2"
The checks taken out of the paper suite by the change request of 28 September 2026 are back, as phone-ticket
tests in `phone-claims.test.ts`:
- **TAM-034**: the property test (400 random games, tickets and patterns): accepted if, and only if, complete on
  called numbers by the latest call. The "Check numbers" helper keeps its own test in `claims.test.ts`.
- **TAM-035**: only called numbers matter; the host state holds no marks; marks sent with a claim are ignored.
- **TAM-036**: a claim missing a number stays a bogey after that number is called, and replays the same; waiting
  for the camera never makes a claim late by itself (TAM-178).
- **TAM-038**: a late claim is a bogey with `reason: 'late'` and `completedAt` ("Top Line was complete at 45").

### Note on the typed code (question for the owner, in `reports/latest.md`)
TAM-117 asks for at most 12 characters, and TAM-055/TAM-057 for the ticket to open from the code alone, with no
seed. 12 characters from 31 allowed letters and digits hold about 59.5 bits; a Tambola ticket alone needs about 61.7
bits (there are about 3.7 × 10^18 valid tickets), before the ticket number and game code. Both tests are written as
the scenarios say; they cannot both pass until the owner decides.

**TAM-043** (reworded on the owner's decision of 29 September 2026): the app's record of which number
completed a pattern is for phone tickets only (TAM-038, Phase 2). With paper tickets the anchor judges whether
a claim is late; the host records a win or a bogey, and a win the anchor accepts is recorded however many
numbers later it comes, with no `reason` (claims.test.ts).
