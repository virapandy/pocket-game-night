# Tambola scenarios

These are the test cases for Tambola in plain English. The game itself is explained in
[docs/games/tambola/guide.md](../../docs/games/tambola/guide.md), which these scenarios were checked against,
and the host and player journeys are in [docs/games/tambola/journeys.md](../../docs/games/tambola/journeys.md). Each scenario becomes one or more automated
tests once the owner approves it. All are **draft** until approved.

| File | Covers | Scenarios |
|---|---|---|
| [01-tickets.md](01-tickets.md) | What a valid ticket and sheet look like | TAM-001 – TAM-008 |
| [02-calling.md](02-calling.md) | Drawing and calling numbers | TAM-010 – TAM-017 |
| [03-claims.md](03-claims.md) | Checking claims: accepted, bogey, already won, paper tickets | TAM-020 – TAM-039 |
| [04-house-rules.md](04-house-rules.md) | Scenarios that depend on owner decisions | TAM-040 – TAM-049 |
| [05-secrets-and-seeds.md](05-secrets-and-seeds.md) | Nobody sees what they shouldn't; phone tickets | TAM-050 – TAM-058, TAM-131 – TAM-133, TAM-170 – TAM-176 |
| [06-room-and-host.md](06-room-and-host.md) | Fun-friction defaults, host controls, late joiners, play again | TAM-060 – TAM-069, TAM-130, TAM-137, TAM-180 |
| [07-undo-replay-end.md](07-undo-replay-end.md) | Undo, replay, and how the game ends | TAM-070 – TAM-078 |
| [08-prizes.md](08-prizes.md) | Contribution, pot, suggested split, payouts; no money moved | TAM-080 – TAM-091 |
| [10-lifecycle.md](10-lifecycle.md) | Ending vs discarding with money, game-level winnings, what a game keeps; no prize won; closing tiers and ending by hand | TAM-140 – TAM-145 |
| [11-rhymes.md](11-rhymes.md) | Rhymes: several per number, picked at random, language and family-friendly settings | TAM-150 – TAM-158 |
| [12-connected.md](12-connected.md) | Connected mode: calls, claims and verdicts over the network; faults; fallback | TAM-200 – TAM-210 |
| [09-usability.md](09-usability.md) | Mis-touches, legibility, offline, interruptions (from docs/ux-guidelines.md) | TAM-100 – TAM-122, TAM-134 – TAM-136 |

## How to approve
Read a file. For each scenario, either leave it (approve), change the words, or delete it.
Then tell Claude in the desktop app "approve 01, 02, 03" (or whichever). Claude changes
`Status: draft` to `Status: approved, owner, <date>` and writes the tests.

Scenarios in `04-house-rules.md` show the choices. Pick one per question, and that scenario is finished.

## Words used
- **Anchor**: the person calling numbers aloud, reading from the host phone.
- **Host phone**: the phone that runs the game and is the referee.
- **Bogey**: a false claim.
- **Pattern**: what a player claims (Early Five, Top Line, Full House …).
- **Seed**: a secret starting number that decides the random draw or a ticket. The same seed always gives the same result.

## Phases
Every scenario has a **Phase** line.
| Phase | Scope | Tambola | Platform |
|---|---|---|---|
| **1a: one great game** | Paper tickets on one host phone: calling, rhymes, board, claim checks, undo, the prize pool for a single game, resume, history view, key UX rules | 88 | 10 |
| **1b: the evening** | Sessions, tally and settle, reusing a setup, deleting history, late joiners, phone voice and auto-call, dark mode | 6 | 12 |
| **2: phone tickets** | Tickets made by the app and scanned onto players' phones | 36 | |
| **2.5: new-game kit** | The contract suite every game must pass; the generic simulated player | | 14 |
| **6: connected mode** | Calls, claims and verdicts over the network, only if play-tests justify it | 11 | |
| **7: feedback** | Problem reports, crash reports, sorting | | 6 |

Why this split: 1b adds features on top of 1a without changing how a game is played or stored,
so 1a can go to family play-tests first, and play-tests decide how much of 1b is needed.

## Readiness check (28 September 2026)
Checked three ways, following `docs/new-game-process.md` step 9.

| Check | Result |
|---|---|
| Guide ↔ scenarios | Every rule has a scenario. Added: the bogey consequence (TAM-044 made concrete) and house rules as settings (TAM-130). |
| Journeys ↔ scenarios | Added: who is claiming with paper tickets (TAM-039), setup mode and names (TAM-137), marking and unmarking (TAM-131), join counter (TAM-132). Fixed: host board shows the last 5 calls, the room view the last 3 (TAM-016, TAM-107). |
| UX guidelines ↔ scenarios | Added: player's own "last calls" (TAM-133), dark mode not default (TAM-134), vibration and sound (TAM-135), no dragging (TAM-136). Guidelines 5, 7 and 44 (edges, testing at distance, real devices) are for design and play-tests, not scenarios. |
| Consistency | Fixed: TAM-071 now matches the 5-second undo (TAM-119); TAM-013 has a precise fairness test; TAM-062 separates Phase 1 and Phase 6 shortcuts; TAM-066 shows payouts; TAM-100 uses CSS px. |
| Contract | Fits, with four points the engine must support from Phase 0 (`docs/games/tambola/guide.md`, "Contract check"). |

## Checked against the guide (28 September 2026)
| Result | Scenarios |
|---|---|
| Match the established rules | TAM-001–009 (ticket and sheet of 6), TAM-010–017 (calling), TAM-020–029 (patterns), TAM-050–056 |
| Fixed to match | TAM-030 (a tie on the same number is shared, not refused as "already won"), TAM-076 (after 90 calls every ticket is complete) |
| Added from the guide | TAM-035 (unmarked called numbers still count), TAM-036 (a claim is judged at the moment it is made) |
| House-rule options marked **norm** | TAM-040–048; the norm differs from the family-friendly recommendation only for TAM-044 (bogey penalty) |
| App-specific (no traditional rule to check) | TAM-060–066 (room defaults, offline), TAM-070–074 (undo, replay), TAM-077 |
