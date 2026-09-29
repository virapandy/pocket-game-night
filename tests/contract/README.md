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
