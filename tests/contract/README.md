# What the contract tests expect

For the Build workspace. The tests are the definition of done; this page lists the names and shapes they
import. If something here is wrong or impossible, write it in `docs/test-questions.md`; don't work around it.

- `engine.test.ts`, `suite.ts`, `tambola.test.ts`: the shared game contract (Phase 0 and 1a). They import from
  `src/engine` and the game registrations.
- `tally.test.ts`: the session tally and "Settle up" (Phase 1b), below.
- `tambola-phone.test.ts`: Tambola with **phone tickets** (Phase 2) through the same suite: both seeds (`draw` and
  `sheet`) stay out of the room and every player view, and the moves `check-claim`, `assign` and `to-paper` follow
  the same rules as every other move. Setup and moves: `tests/games/tambola/README.md`, "Phase 2: phone tickets".

## The session tally (Phase 1b: PLT-017 to PLT-021, PLT-023, PLT-025, PLT-028)

Both functions are imported from **`src/engine`** (the engine's `index.ts`). They are pure: no storage, no
screen, no clock. The tally is shared by every game with money, so it reads only each game's `MoneyRecord`
(the one already in `src/engine/money.ts`, `{ currency, people: { personId, name, paid, won }[] }`), never a
game's own rules (PLT-021).

### `tallySession(sessionId, games)`
```ts
games: {
  id: string;
  sessionId: string;
  status: 'setup' | 'in-progress' | 'paused' | 'ended' | 'abandoned';   // GameStatus
  settled: boolean;
  money: MoneyRecord | null | undefined;  // null or missing = a "No money" game (PLT-023)
  gameType?: string;                       // any game: the tally never looks at it
}[]

returns {
  sessionId: string;
  gameIds: string[];     // the games in this tally, in the order given
  people: { name: string; paid: number; gotBack: number; net: number }[];
  paidIn: number;        // sum of paid
  paidOut: number;       // sum of gotBack; always equal to paidIn
}
```
- A game is in the tally only if its `sessionId` is the one asked for (PLT-018), its `status` is `'ended'`
  (PLT-017: not in progress, paused, abandoned or still in setup), it is not `settled` (PLT-019), and it has
  money (PLT-023). Any other game handed in is simply left out.
- People are matched across games **by name** (PLT-020), never by `personId`: "Riya" in two games is one line;
  "Riya" and "Riya S" are two. People are listed in the order they first appear (game order, then the order
  within the game's record).
- `paid` and `gotBack` add up that person's `paid` and `won` across the games (for Tambola, `won` already
  includes money handed back from prizes nobody won, TAM-088). `net = gotBack − paid`.
- With no games in the tally: `gameIds: []`, `people: []`, `paidIn: 0`, `paidOut: 0`.

### `settleUp(people)` (PLT-028)
```ts
settleUp(people: { name: string; net: number }[]) => { from: string; to: string; amount: number }[]
```
Who pays whom, in whole amounts. `from` always has a negative net and `to` a positive one; `amount > 0`.
After every hand-over, everyone's net is exactly 0. It uses the **fewest possible** hand-overs: a group that
already balances among itself settles on its own (for example +50, +30, −30, −50 is "Nani pays Riya ₹50" and
"Dad pays Asha ₹30", two hand-overs, not three). The same nets always give the same list. Nobody, or all nets 0:
an empty list. The tests check "fewest" against their own count for up to 8 people.

Money is calculated, never moved: nothing here makes or asks for a payment (TAM-090).

## Problem reports (Phase 7: PLT-200 to PLT-208, owner sign-off 29 September 2026)

Tests: `reports.test.ts` (and `tests/replays/replays.test.ts`, which also replays saved reports, PLT-204). Every
function below is imported from **`src/engine`** (the engine's `index.ts`). They are pure: no network, no storage, no
screen; the clock only through `at` / `now`. The screens, the stub destination and the waiting list are in
`tests/browser/README.md`, "Phase 7: Report a problem".

### `makeReport(input)`: the host phone's report (PLT-200, PLT-201, PLT-203, PLT-206)
```ts
makeReport({
  what: string,                 // the host's "What happened?" sentence; '' when left empty
  appVersion: string,
  phone: string,                // the phone type, as the app works it out (for example from the user agent)
  at: number,                   // when (ms)
  game?: { saved: SavedGame; rules: GameRules } | null,   // the game on screen, if any (engine SavedGame, format 2)
  error?: { message: string; stack?: string } | null,    // a caught crash (PLT-203)
}) => Report

Report = {
  v: 1,
  id: string,                   // different for every report (the same report keeps its id when it is re-sent)
  at: number,
  from: 'host' | 'player',
  what: string,                 // with player names replaced (below)
  appVersion: string,
  phone: string,
  error?: { message: string; stack?: string },
  game?: {                      // absent (or null) when there was no game
    gameType: string,
    setup: SetupInput,          // anonymised (below); `seeds` only once the game is over
    records: MoveRecord[],      // the moves at the time of the report, anonymised
    money?: MoneyRecord | null, // the saved game's money record (the payouts), names as "Player N"; null or absent
                                // while the game is still being played and for a "No money" game (PLT-201, 2026-10-01)
    …                           // anything else (status, id) that holds no name or seed
  },
  waitingForGameEnd: boolean,   // PLT-206: true while the game is in progress or paused
  tickets?: { ticket: number; rows: (number | null)[][]; marks: number[] }[],   // player reports only
}
```
- **Seeds (PLT-206).** Game `status` `'ended'` or `'abandoned'`: `game.setup.seeds` are the game's real seeds, so it
  replays. `'in-progress'` or `'paused'`: no seed at all (`seeds` empty or missing), and no seed anywhere in
  `reportText` in any form (plain, URL-encoded, base64); `waitingForGameEnd: true`.
- **No names (PLT-201).** The players in `game.setup` are named `Player 1`, `Player 2` … in setup order; late joiners
  and renamed players get `Player N` too (in the moves as well), and the game still replays with the same calls and
  claims. A player's name typed in `what` becomes their `Player N` ("Ashalata got a bogey" → "Player 2 got a bogey").
- **Money numbers are in (PLT-201, PLT-204; owner, 1 October 2026, replacing "no money").** `game.setup.config`
  keeps the game's `money` (`{ currency, contribution }`) and every tier's `amount` exactly as set up, also while the
  game is in progress. For an ended game, `game.money` is the saved game's `MoneyRecord` with the same `currency`,
  `personId`s, `paid` and `won`, each `name` replaced by that player's `Player N`. Read back from `reportText`, the game
  replays with the same `pot`, tier amounts and winners, `payouts` (`paid`, `won`, `handedBack`, `net`, `hostGives`)
  and `money`. A "No money" game has no amounts (`money: null`). The session name and settlement never go in.
- No account, e-mail or sign-in details (no key named `email`, `account`, `userId`, `token`, `password`, `apiKey`, `key`).
- Engine code cannot know a game's config, so `rules` is passed in; how a game anonymises its setup and moves (for
  example an optional method on `GameRules`) is the Build workspace's choice.

### `makePlayerReport(input)`: a player's phone (PLT-207)
```ts
makePlayerReport({
  what: string, appVersion: string, phone: string, at: number,
  tickets: { v: 1; game; ticket; name; rows; startedAt; tiers; marks: number[] }[],   // the phone's tickets (decodeTicket's shape) + marks
}) => Report   // from: 'player'; tickets: [{ ticket, rows, marks }] in the order given; no `game`, no setup, no seed;
               // waitingForGameEnd: false; the player's name nowhere (also not from `what`)
```

### `reportText(report)` and `readReport(text)` (PLT-201, PLT-204)
`reportText` is the exact text that is shown in the preview and sent: the same report always gives the same text.
`readReport(text)` returns `{ ok: true, report }` (deep-equal to the report that made the text) or `{ ok: false, reason }`
for anything that is not a report (empty, garbage, `{}`, an unknown `v`, a JSON array); it never throws.

### `addSeeds(report, saved)` (PLT-206)
Once the reported game has ended (`saved.status` `'ended'`, also after a discard, or `'abandoned'`) and `saved` is the
same game (same `setup.gameId`): the same report (same `id`, `what`, `records`) with `game.setup.seeds` set to the
game's seeds and `waitingForGameEnd: false`. It then replays the game **as it was when reported**. For the same game
still in progress or paused, or for another game: the report unchanged (still waiting, no seed).

### `sortReports(reports, { now })` (PLT-205)
```ts
=> { groups: { kind: 'bug' | 'confusion' | 'idea' | 'noise'; reportIds: string[]; … }[] }
```
Only reports with `now − 7 days < at ≤ now`, each in exactly one group. A report with an `error` is a `bug`, and
reports with the same error message are one group. Reports whose `what` is the same apart from case, spaces and
punctuation are one group. An empty report (no words, no error) is `noise`.
The kind (product owner, 1 October 2026), from the words of `what`, in any case, a curly apostrophe (’) counting as
`'`: `bug` for "crash", "error", "wrong", "didn't work", "stuck"; `confusion` for "how do I", "where is", "can't find",
"confusing", "didn't understand"; `idea` for "add", "wish", "would be nice", "could you", "idea"; otherwise `noise`.
A report with an `error` is always a `bug`, whatever its words. (Which kind wins when words of two kinds appear is not
decided; the tests use no such sentence.) Groups are ranked biggest first; the same
reports in any order give the same groups in the same order. No reports: `groups: []`. Works with no Jev and no network.
