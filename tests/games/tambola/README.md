# What the Tambola tests expect (Phase 1a)

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

The rhyme pack itself is read by the tests straight from `content/tambola/rhymes.json`.

## Patterns
`'early-five' | 'top-line' | 'middle-line' | 'bottom-line' | 'four-corners' | 'full-house' | 'second-full-house'`

Numbers a paper-ticket claim must read out: Early Five 5 · each Line 5 · Four Corners 4 · Full House 15 ·
Second Full House 15.

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
| `{ type: 'claim', playerId, pattern, numbers }` | Check a paper-ticket claim from the numbers read out (a *detail move*) |
| `{ type: 'rename', playerId, name }` | Rename a player during the game; a duplicate name is refused (PLT-024) |
| `{ type: 'end' }` | End the game now (TAM-066) |
| `{ type: 'discard' }` | Discard the game: void, contributions handed back (TAM-140) |

`legalMoves(state, HOST)` lists `call` (while fewer than 90 are called), `end` and `discard` until the
game is over. `detailMoves` includes `'claim'` and `'rename'`.

`apply` returns `ok: false` (nothing changes) for: a pattern not in this game (TAM-031); a pattern
already won on an earlier number, with a reason containing "already won" (TAM-030); the wrong count of
numbers read out; numbers outside 1–90 or repeated; an unknown player; a duplicate name.
A bogey is **not** `ok: false`: it is `ok: true` with the verdict in the state.

### How a claim is judged (paper tickets)
1. Every number read out must have been called (TAM-037, TAM-035: marks never matter).
2. The most recently called of them must be the latest call; otherwise it is **late**: a bogey with
   `reason: 'late'` and `completedAt` = the number that completed it (TAM-038, TAM-043).
3. A pattern already won stays claimable, and the prize is shared, only until the next number is
   called (TAM-041, TAM-042).
4. A bogey is recorded against the player (TAM-044). With paper tickets the app does not block that
   player's later claims (the room keeps the ticket out; they may hold another).

### Undo (through the engine's `undo(rules, match, seq, { by, now })`)
- A claim: any time; later calls stay (TAM-070, TAM-072).
- A call: only the latest call, and only if `now - record.at <= 5000` (TAM-119, TAM-071).
- `end` and `discard`: never.

### Game over
When the last Full House tier in play is accepted (`full-house`, or `second-full-house` if that tier
is in play), or after `end` or `discard` (TAM-075, TAM-046).

## View (`view(state, viewer)`)
```ts
TambolaView = {
 players: { id: string; name: string }[],
  tiers: { pattern: Pattern; amount: number; label?: string }[],   // the locked tiers (TAM-085)
  called: number[],                 // every call so far, in order
  current: { number: number; rhyme: Rhyme | null } | null,
  lastCalls: number[],              // most recent first, current included: host 5 (TAM-016), room 3 (TAM-107)
  allCalled: boolean,               // TAM-076
  openPatterns: Pattern[],          // tiers in play that can still be claimed (TAM-031)
  claims: ClaimView[],              // host: every claim in order; room: at least the latest
  over: boolean,
  summary: TambolaSummary | null,   // once over
}
Rhyme = { n: number; lang: 'en' | 'hi'; style: string; familyFriendly: boolean; text: string }  // a pack entry
ClaimView = {
  playerId: string, pattern: Pattern, numbers: number[],
  checks: { number: number; called: boolean }[],     // TAM-037 green/red
  verdict: 'accepted' | 'bogey', reason?: 'not-called' | 'late', completedAt?: number,
  prize?: number,                                     // this claim's share after ties (TAM-086, TAM-087)
}
TambolaSummary = {
  result: 'ended' | 'discarded',
  callsMade: number,
  pot: number | null,
  tiers: { pattern: Pattern; amount: number; label?: string; winners: { playerId: string; amount: number }[] }[],
  bogeys: { playerId: string; pattern: Pattern }[],
  money: MoneyRecord | null,        // engine's MoneyRecord, one person per player (PLT-021, TAM-089)
}
```
In `summary.tiers`, `amount` is what the tier finally pays after unclaimed tiers are spread (TAM-088);
winners' amounts add up to it. The room and player views must never hold the draw seed or any number
not yet called (TAM-052).

## Prizes
```ts
planPrizes({
  tickets: number, contribution: number, unit?: number /* default 10 */,
  removed?: Pattern[], added?: Pattern[], fixed?: Partial<Record<Pattern, number>>,
}) => { pot: number; tiers: { pattern: Pattern; percent: number; amount: number }[] }
```
Tiers add up to the pot exactly; multiples of `unit` where possible; never negative; Full House
the largest unless the anchor fixed amounts; removing `full-house` has no effect (or throws).

## Rhymes
`pickRhyme(pack, n, { language, familyFriendly }, rng, excludeText?)`: an entry of the pack for `n`
allowed by the settings, chosen by `rng` with the pack's `styleWeights` (Indian styles 2, others 1);
never the `excludeText` one if another is allowed; `null` if none is allowed.
