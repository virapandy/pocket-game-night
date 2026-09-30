# tests/sim: simulations and the generic simulated player

For the Build workspace and the owner. Nothing here is part of the app; nothing here needs Jev or the internet
in an ordinary run (PLT-114).

| File | What it is |
|---|---|
| `tambola-sim.ts`, `tambola.test.ts` | The first paper-ticket simulation (TAM-077), 2,000 games on every `npm test` |
| `player.ts` | The generic simulated player (PLT-110): options are the actor's legal moves plus the driver's detail moves and "do nothing"; code states the facts; the player is random, scripted, or Jev-backed; it never applies a move itself (PLT-112) |
| `jev.ts` | Jev (TypeSafe AI) for simulations: typed Choice questions with probabilities, the weekly cap of 20,000 decisions (PLT-113, owner 2026-09-29) kept per ISO week in `reports/runs/jev-usage.json` (gitignored), one retry then Jev off (PLT-122), and `redact()` on every message (PLT-115) |
| `mass.ts` | Mass Tambola simulation (PLT-116): paper and phone tickets, 2 to 60 tickets, tier sets, money or none, ties, late joiners, bogeys, late claims, undo of claims and of the last call, closing tiers, handing tickets over, ending early and discarding; checks after every move; the plain summary (PLT-117) |
| `mass.test.ts` | 300 games on every `npm test` (`SIM_MASS_GAMES` to change), no Jev |
| `player.test.ts` | PLT-110 to PLT-113, PLT-122, PLT-123 with a fake Jev (no network) |
| `key-hygiene.test.ts` | PLT-115: fails if the key, or anything shaped like a TypeSafe key, is in a file git would publish, a report, a replay or a summary. It names files only |
| `extended.run.ts` | The long run (PLT-118): not part of `npm test`. `npx vitest run --config tests/vitest.extended.config.ts`. Writes `reports/sim/summary-latest.md` |

## The long run's settings (environment variables)
- `SIM_GAMES` scripted games (default 100000)
- `JEV_GAMES` games with Jev personas when a key is present (default 200); `JEV_DECISIONS` most Jev decisions this run (default 2000); `JEV=off` turns Jev off
- `JEV_API_KEY`, or `JEV_API_KEY=...` in the gitignored `.env.local`. Never print it.

Without a key the run says "No Jev key: ran with random and scripted players" and completes.
A failing game is saved in `tests/replays/tambola-mass-<seed>.json` and becomes a permanent test (TAM-074).
