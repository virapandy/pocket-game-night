# Roadmap

Owned by the product owner. Updated 28 September 2026, after Phase 1a went green and live.
Phase numbers match the `Phase:` lines in `specs/`; the **order** below is the recommended build order.

## Where we are
| Phase | What | State |
|---|---|---|
| 0 | Foundation: app skeleton, engine, automation, hosting | Done |
| **1a** | **Tambola, paper tickets, one host phone** | **Done: green and live** at https://virapandy.github.io/pocket-game-night/ |

Left over from 1a: the coder still has to update a note (`src/games/tambola/CLAUDE.md`, "End of game"
row). The owner has Android only, so iPhone is covered by automated checks, not by hand.

## Direction (owner, 28 September 2026)
**Finish Tambola completely first, then simulations and extended testing (Jev). New games are on hold.**

## Order
| Step | Phase | What it gives families | Gate to start | Product owner meanwhile |
|---|---|---|---|---|
| 1 | **1a.1 Feedback fixes** | Money of unwon prizes back to players; paper claims recorded on the anchor's word; calling screen and setup redesign | the change request is applied (`docs/games/tambola/changes-2026-09-28.md`) | play-test kit; review the redesign on the preview |
| 2 | **1.5 Family play-test** (Android): **done 30 September** | 3 real games; findings become decisions and tests | 1a.1 green | turns findings into changes |
| 3 | **1b The evening** | Sessions, tally and settle, late joiners, optional phone voice and auto-call, dark mode, history tools | play-test done, no blockers | Phase 2 scenario review, including the claim QR |
| 4 | **2 Phone tickets** | Tickets on players' phones; claims verified by scanning the player's claim QR | owner approves the Phase 2 drafts | Phase 7 review |
| 5 | **7 Feedback reports** | "Report a problem" with replays; ready to share beyond family | Phase 2 green | decide on connected mode |
| 6 | **6 Connected mode** | Calls and claims over the internet | **only if** play-tests show it's wanted | |
| 7 | **Simulations and extended testing** | Nothing visible: the generic simulated player (Jev), mass simulations, mutation testing, Android emulator runs, so bugs are caught before families see them | Tambola complete | |
| — | **Impostor** (next game; owner, 3 October): design done in `docs/games/impostor/` (scenarios await approval) by the lifecycle process (`docs/proposals/next-game-lifecycle.md`); scenarios go to the tester only after the Tambola release. New games must replace a box, cards or a moderator (`docs/decisions.md`, 3 October); Mafia and a Codenames-style game are next candidates | | owner approves the design | design and paper play-test |

Step 7 uses the Phase 2.5 scenarios for the simulated player (PLT-110 to PLT-113) and the testing
layers from the architecture proposal; the rest of Phase 2.5 (shared blocks, the new-game template)
waits for the next game.

## Play-test kit (step 2)
Before 1b starts, play **3 real Tambola games** with family or friends on Android phones:
1. One host, one anchor (can be the same person), at least 6 players with paper tickets.
2. Use real contributions or "No money", with the suggested prizes.
3. Afterwards, note: time from opening the app to the first number; anything confusing; any mis-tap;
   whether recording wins and closing prizes felt natural; favourite and flat rhymes; anything that made
   the room quieter or louder; whether anyone asked for phone tickets.

Tell the product owner what happened in plain words; it turns findings into decisions, scenario changes,
or new tests for the orchestrator.
