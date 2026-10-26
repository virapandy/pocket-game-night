# Mafia: the rule API the tests use (C3, 25 October 2026)

For the Build role. This makes MAF-H1 to MAF-H6 ([README.md](README.md), "Test hooks the build provides", and Version 1.1
items 33 and 34) exact: what the rule tests import, what they pass in and what they expect back. Nothing here changes a
scenario; where this page and a scenario differ, the scenario wins and the tester fixes this page (write it in
`docs/test-questions.md`). Points this page had to settle that the scenarios leave open are marked **(open)** and listed
in `docs/test-questions.md` (25 October rows); no test depends on an (open) point. The product owner's clarifications of
25 October (`mafia-build-answers.md`, to become scenarios Version 1.2; "PO n" below) are folded in.

Tests: `tests/games/mafia/*.test.ts` (review fixes: `editions.test.ts`, `leaves.test.ts`), `tests/contract/mafia.test.ts` (the shared contract suite),
`tests/browser/mafia-c3.spec.ts`. Fixture: `tests/fixtures/mafia-saved-nights-v1.json` (never edit it). The scenarios'
own algorithms (the deal, the night order, the Mafia's random choice, the story pick, the Mafia count limits) are written
out in `tests/games/mafia/oracle.ts` with the engine's `createRng` and `shuffle`; the tests compare the build with them.

## Where
Everything comes from **`src/games/mafia/index.ts`**. Until an export exists, each test that needs it fails on its own
with "src/games/mafia is not built yet (needs …)" or "… is not exported from src/games/mafia yet". The engine
(`startMatch`, `play`, `replay`, `undo`, `createRng`, `shuffle`, `readSavedGame`) is used as it is today; no engine
change is expected.

| Export | Input | Output |
|---|---|---|
| `mafiaRules` | — | the game's `GameRules<MafiaConfig, State, MafiaMove, MafiaView>`, `id: 'mafia'`, `detailMoves: ['start', 'tie', 'addNext']` |
| `mafiaCounts(n)` | players 5–16 | `{ suggested: number, allowed: number[] }` (MAF-003; `allowed` ascending) |
| `readMafiaNight(saved)` | a `SavedGame` of this game | see "The game night" below, or `null` when it is not a Mafia game night or does not replay |
| `mafiaStoryEditions` | — | the frozen story editions (MAF-037, MAF-093): `{ [edition]: { out: string[], saved: string[] } }`; `'1.2'` holds `stories.json`'s ids by kind, in row order |
| `MAFIA_STORY_EDITION` | — | `'1.2'`: the edition a new game night names in `config.edition` |
| `readTestSeeds(raw, release)` | `localStorage['pgn.test.seeds']`, whether this is the release build | the object under its `"mafia"` key, `{ seeds?: { roles }, deals?, stories? }` with only the keys present, or `null` (release build, missing, not JSON, not an object, no `"mafia"` object, or a part of the wrong type) |

## Stories: `content/mafia/stories.json`
Built from `docs/games/mafia/stories.csv` (edition 1.2, 22 rows), one object per CSV row, in row order, exactly
`{ id: string, kind: 'out' | 'saved', text: string }` (the `notes` column stays out). The tests compare the file with the
CSV row for row.

**Frozen editions (MAF-037, MAF-093; review fix, 25 October).** A game night picks its stories only from the ids of its
edition, `config.edition`, `mafiaStoryEditions[edition]`; texts come from `stories.json`. A game night saved without an edition is
always read as the fixed `'1.2'`, never as whatever `MAFIA_STORY_EDITION` is later (that constant is only what the screens
write into a new game night). An edition
is never changed; new stories make a new edition. So a night saved under 1.2 replays with the same `storyId`s when
`stories.json` gains new ids. An unknown edition is refused: setup throws, and `readMafiaNight` returns `null`. `readMafiaNight` returns `null` on any damaged setup or record
(it never throws).

## Setup
`startMatch(mafiaRules, setup, at)` with
```ts
{ gameId: 'mafia', seeds: { roles: string },          // MAF-H2: deal, the Mafia's random choice, stories
  config: {
    edition?: string,                                 // the frozen story edition (Stories above); missing means '1.2'
    deals?: Record<string, Record<string, Role>>,     // MAF-H3: by game index k ("1", "2", …): player → role
    stories?: { out: string[]; saved: string[] },     // MAF-H5: story ids from stories.json to use instead of the whole list
  } }
```
`Role` = `'mafia' | 'doctor' | 'police' | 'villager'`. A game night starts with no game; its first move is `start`.
- **MAF-H2:** `seeds.roles` must be non-empty text; without it setup throws (refused), and `readMafiaNight` of such a saved
  game night returns `null`.
- **Deal override (MAF-H3):** `deals[k]` is used for game k's **first** deal (not for `redeal`) when its keys are exactly
  that game's players and its roles are a valid deal for them (exactly `mafiaCount` `mafia`; with 6 or more players exactly
  one `doctor` and one `police`; with 5 none; the rest `villager`). Otherwise it is ignored and the seed deals (as M26). The
  streak rule is not applied to an override.
- **Story override (MAF-H5):** when `stories` is given, `out` and `saved` replace the two kinds' lists (ids of
  `stories.json`, texts from that file).

## Moves
```ts
type MafiaMove =
  | { type: 'start'; players: string[]; mafiaCount: number }   // "Give everyone a role" / "Play again"
  | { type: 'seen'; player: string }                           // "Done, pass to …" / "Done, everyone's seen"
  | { type: 'redeal' }                                         // "Deal again"
  | { type: 'startNight'; night: number }                      // "Start the night"
  | { type: 'check'; player: string; target: string }           // the Police's first name tap on N2 (Version 1.2 C)
  | { type: 'nightPick'; player: string; target: string | null } // N2's main button
  | { type: 'voteOut'; player: string }                        // "Vote Kabir out"
  | { type: 'tie'; players: string[] }                         // "Point again: Kabir or Om"
  | { type: 'voteNobody'; reason: 'chosen' | 'secondTie' }     // "Nobody today" / "Still a tie"
  | { type: 'leave'; player: string; when?: 'night' | 'day' } // "Kabir leaves" (`when`: see "Leaves" below)
  | { type: 'unleave'; player: string }                        // the toast's Undo
  | { type: 'addNext'; name: string }                          // Players dialog, mid-game
  | { type: 'endGame' } | { type: 'unEndGame' }                // "End the game" and its Undo
  | { type: 'endEvening' };                                    // leaving G2
```
Every move is made by `HOST` (the engine's `'host'`). The tests play them through the engine's `play`, one second apart.

### Steps
The room view's `step` (below) is one of:

| Step | Screens | Ends with |
|---|---|---|
| `idle` | before the first `start` | `start` |
| `deal` | B1, B2 | the last `seen` → `nightStart` (night 1) |
| `nightStart` | N0 (and V3s, V4 after the day's vote) | `startNight { night }` → `night` |
| `night` | N1, N2 | the night's last turn: the night resolves (MAF-027) → `day` or `gameOver` |
| `day` | N3, M1, Y1, V1, V2, V2t | `voteOut` / `voteNobody chosen` → `nightStart` (r + 1) or `gameOver`; `tie` → `revote` |
| `revote` | V3 | `voteOut` / `voteNobody secondTie` → `nightStart` (r + 1) or `gameOver` |
| `gameOver` | G1 | `start` (k + 1) → `deal`; `endEvening` → `ended` |
| `ended` | G2 left | nothing; `isOver` is true |

### When each move is legal (`legalMoves(state, HOST)` lists complete moves, the three detail moves aside)

| Step | Listed |
|---|---|
| `idle` | nothing (`start` is a detail move) |
| `deal` | `seen { player }` for the player whose turn it is (seat order from seat 0); `redeal`; `leave { p }` for each dealt player when at least 5 would remain; `endGame`. Right after a deal leave: `redeal` only |
| `nightStart` | `startNight { night: r }` (r = the night to start); `redeal` (night 1 only, and not while someone is leaving tonight); `leave { p }` for each player who is in, and from night 2 also `leave { p, when: 'night' }` for each; `endGame` |
| `night` | one `nightPick { player, target }` for the player whose turn it is per allowed target (seat order), or exactly `{ player, target: null }` when they have no allowed name (MAF-025); on a Police's turn (a Police who is in) with no check yet this turn, also one `check { player, target }` per allowed target (seat order); after that check, exactly one `nightPick { player, target }` naming the checked player and no `check`; `leave { p }`; `endGame` |
| `day` | `voteOut { p }` per player who is in; `voteNobody { reason: 'chosen' }`; `leave { p }`; `endGame` |
| `revote` | `voteOut { p }` per tied player still in; `voteNobody { reason: 'secondTie' }`; `leave { p }`; `endGame` |
| `gameOver` | "Play again" (MAF-061): `start` with this game's players minus every player who left, then the `addNext` names in the order added, and this game's Mafia count if `mafiaCounts(n).allowed` has it, else the suggested count; only when that is at least 5 players. And `endEvening` |
| `ended` | nothing |

Also, at any step: `unleave { p }` is listed and legal **only** while the last recorded move is that `leave { p }` (for a deal leave: while
the last two are that leave and its `redeal`, PO 16; any later move closes the undo, item 13); `unEndGame` only while the last recorded move is
`endGame`. A night leave that ends the night (the night resolves at once, MAF-027) has no Undo: `unleave` is not listed
and is refused. `leave { p }` is for players who are **in** (not out, not left, not leaving tonight).
- `start`: legal at `idle` and `gameOver`. (S3's "← Back" removes the `start` record, PO 4: the app keeps the game night
  without it; starting again deals the same roles, same seed and k.) Players: 5 to 16 names, each 1–16 characters after trimming, no name twice
  (exact match after trimming); `mafiaCount` in `mafiaCounts(n).allowed`. Anything else is refused. Game index k = 1 for
  tonight's first `start`, then k + 1.
- `seen { player }`: only the player whose turn it is in the deal.
- `redeal`: from `start` until `startNight { night: 1 }`, except on Night 1's N0 while someone is leaving tonight (not listed,
  refused; after that leave's Undo it is back). Deals again (MAF-014), and the deal starts again at seat 0.
- `startNight { night }`: `night` must be exactly the night to start.
- `nightPick { player, target }`: only the player whose turn it is; `target` an allowed name (MAF-023 to MAF-026 with item 4
  and item 11), or `null` only when they have none. After a `check` this turn, only the checked player.
- `check { player, target }` (Version 1.2 C, owner 25 October): the Police's first name tap, recorded at once. Only on the
  turn of a Police who is in, only once per turn, `target` one of their allowed names (so never when nobody is left to
  check). It changes nothing in the room view (MAF-P2). From it on, the Police's own view holds the answer (`checks`, and
  `job.check`), `job.names` allows only the checked player, and a second `check` or a `nightPick` of anyone else is
  refused. A `nightPick` by the Police with no `check` before it stays legal (it is the check and the pick at once, as
  game nights saved before 1.2 have it). **(open)** If the checked player leaves before the Police's Done: the check
  stands and the `nightPick` may still name them; no test depends on it.
- `tie { players }` (detail move): in `day` only, 2 or more distinct players who are in. Never in `revote` (MF6).
- `voteNobody { reason: 'chosen' }` in `day` only; `{ reason: 'secondTie' }` in `revote` only.
- `addNext { name }` (detail move): from the first `start` until `endEvening`, 1–16 characters after trimming, not the
  name of a player dealt this game who hasn't left, nor of a name already added. Joins the next game only.
- `endGame`: from `start` until game over. `endEvening`: at `gameOver` only (mid-game, `endGame` comes first).
- `canUndo` is always false (Undo is the moves `unleave` and `unEndGame`). `invariants` returns `[]` for every reachable state.
- A refused move changes nothing (the engine's `play` returns `ok: false`).

## The rules, exactly (the oracle in `tests/games/mafia/oracle.ts` does the same)
- **`rng()`** in MAF-023 and MAF-037 (item 10) is the generator's next 32-bit value over 2³²: with the engine's generator,
  `r.int(2 ** 32) / 2 ** 32`. `pick(list, seed)` = `list[Math.floor(rng() × list.length)]` with the **first** value of
  `createRng(seed)`. (The engine's `Rng` has no `rng()`; `int(2 ** 32)` gives that value exactly.)
- **Mafia counts (MAF-003):** suggested 5–7 → 1, 8–11 → 2, 12–15 → 3, 16 → 4; allowed = every M with
  max(1, S − 1) ≤ M ≤ S + 1 and (M = 1 or 2M + 1 < n). So 5 → [1], 6 → [1, 2], 9 → [1, 2, 3], 16 → [3, 4, 5].
- **The deal (MAF-010):** `base` = M × `'mafia'`, then (n ≥ 6) `'doctor'`, `'police'`, then `'villager'` up to n. The roles
  are `shuffle(base, createRng(seed))`, given to the players in seat order (seat i gets item i). `seed` is
  `` `${roles}:${k}` `` for a game's first deal and `` `${roles}:${k}:d${d}` `` for its d-th `redeal`. **Streaks:** while
  the result makes some player `mafia` who was `mafia` in **both** games k − 1 and k − 2 of tonight (their final deals,
  whatever the game's end; a player not dealt in one of them is not on a streak), deal again from `base` with
  `` `${seed}:r1` ``, then `` `${seed}:r2` ``, ….
- **A deal leave (item 12):** `leave { p }` in `deal` (only while at least 5 would remain) takes p out of this game's
  players at once (p is not dealt: not in `players`, not in `left`); the only legal move is then `redeal`, which deals the
  remaining players as above, keeping the Mafia count unless `mafiaCounts(n − 1).allowed` lacks it, then the suggestion
  (PO 16). **Undo of a deal leave (PO 16):** while the last two moves are that `leave { p }` and its `redeal`,
  `unleave { p }` is listed and legal: p is back at their seat (`start`'s order), the count as `start` had it, and the
  players are dealt again with the next `:d<n>` seed (a redeal), back to "Player 1 of N".
- **The night order (Terms):** every player dealt this game who hasn't left and isn't leaving tonight, in seat order,
  starting at seat ((k − 1) + (r − 1)) mod n (n = players dealt this game, seats numbered in `start`'s order; a starting
  seat whose player has left starts at the next seat). Players who are out are in it (ghost guess). Turn i of T: i = turns
  taken tonight + 1, T = turns taken + players still to take a turn.
- **Allowed names (MAF-023 to MAF-026, item 4, item 11)** for the player whose turn it is; "in" = not out, not left, not
  leaving tonight:
  - out player (any role): every player who is in (a ghost guess);
  - `mafia`: in and not `mafia`;
  - `doctor`: in, except the player the Doctor picked on night r − 1 (only that night), and except the Doctor once they
    have picked themselves in this game;
  - `police`: in, except themselves and players they have already checked this game;
  - `villager`: in, except themselves.
- **The night resolves (MAF-027)** after the night's last turn (a `nightPick`, or a night `leave` that leaves no turn to
  take): (1) `picks` = the `nightPick` targets of players who were `mafia` and in when they picked, in night order; none →
  nobody is out ("A quiet night. Nobody is out!"); all equal → that player; else `pick(picks, `${roles}:${k}:night${r}`)`
  (repeats kept); Mafia picks naming a player who left or is leaving tonight are dropped first (PO 15), so if none remain
  nobody is out and the morning is the fixed line; (2) if the Doctor (in when they picked) picked the target, nobody is
  out (a Doctor's pick of a night leaver protects nobody); (3) else the target is out (`out night r`, role shown);
  (4) every night leave of tonight applies; (5) the winner check. The night's `mafia` (in `readMafiaNight`) still lists
  every Mafia pick made.
- **The story (MAF-037):** a night with someone out → an `out` story with every `{NAME}` replaced by their name; nobody out
  with a Mafia target → a `saved` story; no Mafia pick → the fixed line, `storyId` null. Story = `pick(unused,
  `${roles}:${k}:story${r}`)`, `unused` = that kind's ids not yet used in this game, sorted by id; when none is unused,
  all of that kind are unused again: the kind's used list starts again empty and fills again (so with 2 `out` stories,
  nights 1 and 2 use both, night 3 either, night 4 the other one).
- **The winner check (MAF-040):** m = `mafia` who are in, v = others who are in (leavers count as out once their leave
  applies): m = 0 → `'village'`; m ≥ v → `'mafia'`; else go on. Checked after each night resolves, each `voteOut` and each
  day leave (in `day` or `revote`).
- **Leaves:** in `day` and `revote` a leave applies at once (a tied player who leaves is dropped from `tied`, item 14); in
  `night` it is a night leave: out of every names box at once, their turn skipped if not taken, a pick already made counts,
  applies at step (4). In `nightStart` of night 1 (all `seen`) it is always a night leave of night 1.
  **The leave's `when` (MAF-052; review fix, 25 October):** in `nightStart` of night r ≥ 2, `when: 'night'` (sent by N0) is
  a night leave of night r: it waits (`leaving`), applies when night r resolves, its Undo works right after it, and it is
  logged `{ when: 'night', round: r }`; a leave without `when` (V3s, V4), or with `when: 'day'`, is a day leave of day r − 1:
  it applies at once, runs the winner check, and is logged `{ when: 'day', round: r − 1 }`. In `nightStart` of night 1 a
  leave without `when` or with `when: 'night'` is a night leave; `when: 'day'` is refused. Elsewhere `when` may be left
  out or must match the phase (`'day'` in `day` and `revote`, `'night'` in `night`); in `deal` any `when` is refused. Any
  other value of `when` is refused.
- **Mafia caught** = `mafia` whose role is shown (voted out); a leave never changes it before game over (MAF-P4).

## Views
`view(state, { kind: 'room' })` and `view(state, { kind: 'host' })` are the **room view**, exactly these fields:
```ts
interface MafiaView {
  step: 'idle' | 'deal' | 'nightStart' | 'night' | 'day' | 'revote' | 'gameOver' | 'ended';
  game: number;                 // k; 0 before the first start
  players: string[];            // dealt this game, seat order ([] before the first start)
  mafiaCount: number;           // this game's M (0 before the first start)
  round: number;                // r: the night to start, being played, or just played (the day after it); 0 in the deal
  turn: { player: string; i: number; of: number } | null;   // deal: "Player i of N"; night: "i of T"; else null
  in: string[];                 // players who are in, seat order
  out: { player: string; role: Role; how: 'night' | 'vote'; round: number }[];   // shown roles, in the order they went out
  left: string[];               // players whose leave has applied, in that order (never a role before game over)
  leaving: string[];            // night leaves recorded tonight and not yet applied, in order (they still count in `in`)
  caught: number;               // Mafia whose role is shown ("Mafia caught: caught of mafiaCount")
  morning: { story: string; storyId: string | null; out: string | null } | null;   // night r's result, from its resolution until the next startNight
  tied: string[] | null;        // in revote: the tied players still in, seat order; else null
  vote: { player: string; role: Role } | null;   // the day's voteOut, until the next startNight; else null
  winner: 'village' | 'mafia' | null;            // at gameOver (null: ended with no winner)
  roles: Record<string, Role> | null;            // every dealt player's role, at gameOver only
  tally: { village: number; mafia: number };     // tonight's games won by each side
  games: number;                // games started tonight
  next: string[];               // addNext names waiting for the next game, in order
}
```
Nothing else: no seed, no night pick, no Police answer, no role of a player who is in or has left before `gameOver`, and
nothing that differs with the roles (MAF-P2: the tests compare room views across deals).

`view(state, { kind: 'player', playerId })` is the room view plus exactly:
```ts
{ me: { role: Role; partners: string[] } | null;   // this game's role; partners = the other mafia dealt this game (seat order), [] for other roles; null if not dealt
  job: NightJob | null;          // only while it is this player's night turn
  checks: { player: string; mafia: boolean }[]; }   // this Police's checks this game, in order; [] for everyone else
interface NightJob {
  kind: 'mafia' | 'doctor' | 'police' | 'villager' | 'ghost';   // ghost: the player is out
  names: { player: string; allowed: boolean; tags: string[]; why: Why | null }[];  // item 4: every player dealt, not left, not leaving tonight, seat order
  check: { player: string; mafia: boolean } | null;   // police: this turn's check once made (Version 1.2 C); else null
  latest: { by: string; target: string } | null;   // mafia: the latest Mafia pick so far tonight (item 9); else null
  see: string[];                 // mafia: the Mafia who are in and still to take their turn tonight, night order; else []
}
```
`allowed` is exactly the allowed names above (after a Police's `check` this turn: only the checked player). It is the
screen's only use of the role: a tap on a name not allowed does nothing (Version 1.2 A).
**`tags` are the same for every role (Version 1.2 A, owner 25 October; replaces PO 9 and item 8):** `["you"]` for the
player whose turn it is, `["out"]` for a player who is out, `[]` for everyone else, whatever the role (so `tags` never
says who is allowed). No "Mafia", "used", "protected last night" or Police answer tag; the Police's answers are in
`checks` and `job.check` only. A Police job never holds the answer of a player not yet checked.

**`why` (Version 1.3, owner 26 October, MF21): the reason a name can't be picked**, for N2's private line. `null` exactly
when `allowed` is true; otherwise the first that applies, in this order:
```ts
type Why =
  | { kind: 'you' }                                   // mf.n2-why.1: the player's own name (see the Doctor below)
  | { kind: 'out' }                                   // mf.n2-why.2: a player who is out (ghost guesses included)
  | { kind: 'partner' }                               // mf.n2-why.3: Mafia (in), another mafia dealt this game
  | { kind: 'lastNight' }                             // mf.n2-why.4: Doctor (in), the player they picked on night r − 1
  | { kind: 'selfUsed' }                              // mf.n2-why.5: Doctor (in), themselves after protecting themselves this game
  | { kind: 'checked'; night: number; mafia: boolean }  // mf.n2-why.6: Police (in), checked on night `night` of this game, its answer
  | { kind: 'checkDone' };                            // mf.n2-why.7: Police (in), any other name after this turn's check (answer in job.check)
```
- `you` is for the player's own name whenever they may not pick it, except a **Doctor who is in**: being themselves never
  stops a Doctor, so the Doctor's own name gets `selfUsed` (orchestrator's decision, 26 October, specs/mafia/03-night.md).
- `checked` comes from the Police's earlier nights of this game (a `check`, or a `nightPick` saved before 1.2); after this
  turn's `check`, earlier checks still read `checked` and every other name that is in reads `checkDone`.
- A Police with nobody left to check: every name has a `why` as above (no `checkDone`); the screen still shows "Nobody left
  to check." for any tap (Version 1.2 A).
- **Orchestrator's decision, 26 October (for the product owner to confirm):** the Doctor's own name on the night right
  after they protected themselves (`lastNight` and `selfUsed` both fit) is `selfUsed`.
- `why` is in the player's own view only (inside `job`); the room view is unchanged (MAF-P2). Like `allowed`, it is never
  shown until that name is tapped.

## The game night (`readMafiaNight`)
```ts
{ seeds: { roles: string }, ended: boolean /* endEvening recorded */,
  keep: boolean,                 // some game is past the deal (its startNight 1 recorded); else not kept (IMP-097)
  games: {                       // every game started tonight, in order (one in progress included)
    number: number; players: string[]; mafiaCount: number; roles: Record<string, Role> /* final deal */;
    deals: number;               // 1 + redeals
    over: boolean; winner: 'village' | 'mafia' | null; endedEarly: boolean;   // endedEarly: endGame
    nights: {                    // resolved nights, in order
      night: number; turns: string[];                          // players who took a turn, in order
      picks: { player: string; target: string | null }[];      // every nightPick, in order (Villagers and ghosts too)
      mafia: string[]; target: string | null; chosen: boolean; // chosen: the picks differed and the phone chose
      protected: string | null;                                // the Doctor's pick (Doctor in), else null
      checked: { player: string; mafia: boolean } | null;    // from the Police's check (or their nightPick, before 1.2)
      out: string | null; left: string[]; storyId: string | null;
    }[];
    votes: { day: number; tie: string[] | null; out: string | null; nobody: 'chosen' | 'secondTie' | null }[];  // one per day with a result
    left: { player: string; when: 'night' | 'day'; round: number }[];   // leaves that applied (a deal leave is not here)
    spotter: { player: string; nights: number; of: number } | null;     // MAF-062 with item 17
    ghost: string | null;        // MAF-062 "Best ghost guess" with item 17
  }[];
  tally: { village: number; mafia: number };
  summary: { players: number; games: number; mostMafia: { player: string; games: number } | null; spotter: string | null } }  // MAF-064
```
- `spotter`: among players dealt `villager`, the one whose night picks while in named a `mafia` on the most nights, at least
  2 (ties: seat order); `nights` = those nights, `of` = nights they picked while in.
- `ghost`: among out players dealt `villager` or `doctor`, the one whose ghost guesses named a `mafia` most often, at least 1
  (ties: seat order).
- `summary.players` = players dealt in any game tonight; `games` = games started (item 15); `mostMafia` = the player dealt
  `mafia` in the most games, at least 2 (ties: seat order of the first game they played); `spotter` = most spotter nights
  over all games, at least 2.
- A game night replays exactly from its saved setup and moves (MAF-093): `replay(mafiaRules, saved.setup, saved.records)`
  gives the same state, and `readMafiaNight` of the replay equals that of the original.

## Browser hooks (development and preview builds only)
- `localStorage['pgn.test.seeds']` = `{ "mafia": { "seeds": { "roles": … }, "deals": { "1": { … } }, "stories": { "out":
  [ids], "saved": [ids] } } }` (item 33), read when a new game night's first `start` is recorded: `seeds.roles`,
  `config.deals` and `config.stories` come from it.
- `localStorage['pgn.test.load']` = a `SavedGame` JSON (item 34), opened on the next load as if resumed (MAF-091: the room
  screen of the current step, "Welcome back." and the where-line). The tests build these from move lists
  (`tests/browser/mafia.ts`), each replayed through the rules by `tests/games/mafia/saved.test.ts`.
