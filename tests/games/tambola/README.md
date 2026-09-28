# What the Tambola tests expect (Phase 1a, with the 1a.1 feedback fixes)

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

`legalMoves(state, HOST)`, until the game is over:
- while a won tier is waiting to be closed: one `close-tier` per such tier, `end`, `discard` (no `call`: the next
  number waits, TAM-145);
- once the last Full House tier is closed: only `end` and `discard` (no more calls, TAM-075);
- otherwise: `call` (while fewer than 90 are called), `end`, `discard`.
After the game is over: nothing. `detailMoves` includes `'record-win'`, `'record-bogey'` and `'rename'`.
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

## Prizes
```ts
planPrizes({
  tickets: number, contribution: number, unit?: number /* default 10 */,
  removed?: Pattern[], added?: Pattern[], fixed?: Partial<Record<Pattern, number>>,
}) => { pot: number; tiers: { pattern: Pattern; percent: number; amount: number }[] }
```
Tiers add up to the pot exactly; never negative; Full House the largest unless the anchor fixed amounts;
removing `full-house` has no effect (or throws). TAM-082 and TAM-092: tiers with the same `percent` always get
the same amount (unless the anchor fixed one of them); every tier except Full House is a multiple of `unit`,
and rounding differences go to Full House, which takes the difference (with Full House fixed by the anchor,
the other unfixed tiers take it, still keeping equal shares equal).

## Rhymes
`pickRhyme(pack, n, { language, familyFriendly }, rng, excludeText?)`: an entry of the pack for `n`
allowed by the settings, chosen by `rng` with the pack's `styleWeights` (Indian styles 2, others 1);
never the `excludeText` one if another is allowed; `null` if none is allowed.

## Waiting for Phase 2 (phone tickets)
The change request of 28 September 2026 made the app's own claim check phone-tickets only. The old paper-ticket
tests of these scenarios checked a claim from the numbers read out, which paper games no longer do, so they
were taken out of the paper-ticket suite. They come back as phone-ticket tests once the owner signs off Phase 2:
- **TAM-034**: now tested on the "Check numbers" helper (claims.test.ts), as the scenario says; the phone-ticket
  part waits for Phase 2.
- **TAM-035** (a number the player forgot to mark still counts): checked that only called numbers matter and the
  host state holds no marks.
- **TAM-036** (judged on the numbers called at the moment of the claim): checked that a claim missing a number
  stays a bogey after that number is called, and replays the same.
- **TAM-038** (a late claim shows "Top Line was complete at 45"): checked `reason: 'late'` and `completedAt`,
  the number that completed the pattern.
The late-claim part of **TAM-043** follows TAM-038: with paper tickets the anchor judges lateness and the host
records a bogey (claims.test.ts).
