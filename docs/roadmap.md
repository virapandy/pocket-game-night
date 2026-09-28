# Roadmap

Owned by the product owner. Updated 28 September 2026, after Phase 1a went green and live.
Phase numbers match the `Phase:` lines in `specs/`; the **order** below is the recommended build order.

## Where we are
| Phase | What | State |
|---|---|---|
| 0 | Foundation: app skeleton, engine, automation, hosting | Done |
| **1a** | **Tambola, paper tickets, one host phone** | **Done: green and live** at https://virapandy.github.io/pocket-game-night/ |

Left over from 1a: an **iPhone offline check by hand** (open the link once, Airplane Mode, reopen; the
automated iPhone check hits a known test-tool bug), and a note the coder still has to update
(`src/games/tambola/CLAUDE.md`, "End of game" row).

## Two tracks, in parallel
- **Build track** (VS Code: orchestrator, coder, tester): builds one phase at a time from approved scenarios.
- **Product track** (desktop app: product owner): designs the next thing while the current one is built,
  so the build track never waits for designs.

## Recommended order
| Step | Phase | What it gives families | Scenarios | Gate to start | Product track meanwhile |
|---|---|---|---|---|---|
| 1 | **1.5 Family play-test** | Real games with Phase 1a; bugs become permanent tests | play-test kit (below) | now | writes the play-test kit; starts the Impostor design |
| 2 | **1b The evening** | Sessions, tally and settle, late joiners, optional phone voice and auto-call, dark mode, history tools | 18, approved | play-test done, no blockers | Impostor design (new-game process steps 0–7) |
| 3 | **2.5 New-game kit** | Nothing visible: the contract checks every game must pass, shared building blocks taken out of Tambola, the new-game template, the generic simulated player | 14 drafts | owner approves them | Impostor scenarios (steps 8–9) for approval |
| 4 | **3 Impostor** (one phone, pass the phone) | A second game: secret roles, discussion, vote | from design | 2.5 green; Impostor scenarios approved | Dumb Charades design |
| 5 | **4 Dumb Charades** (one phone, teams) | A third game: Bollywood and custom prompt packs, timer, team scores | from design | Impostor green | Phase 2 review; Scoreboard design |
| 6 | **2 Phone tickets** | Tambola tickets on players' phones, offline QR hand-out | 38 (6 approved, rest drafts) | owner approves the drafts | Scoreboard scenarios |
| 7 | **5 Scoreboard / Rummy scorekeeper** | Any card or board game's scores, round by round, feeding the tally | from design | phone tickets green | feedback review |
| 8 | **7 Feedback** | "Report a problem" with replays; needed before sharing beyond family | 6 drafts | before any wider release | |
| — | **6 Connected mode** | Calls and claims over the internet | 11 drafts | **only if** play-tests show it's wanted | |

### Why this order (a change from the original plan)
- **Play-test before 1b.** Real families will tell us whether the manual prize closing, the rhymes and the
  prize flow feel right, before more is built on top.
- **Games before phone tickets.** Impostor and Dumb Charades both work on **one phone** (pass the phone,
  or one phone for the team), so they don't need Phase 2. Moving them earlier reaches "3–4 games quickly"
  sooner. Phone tickets are the most complex phase (offline QR, privacy), and Tambola already works well
  with paper tickets.
- **The kit (2.5) right before game two**, because the contract checks and shared blocks should come from
  a real second game's needs, not guesses.
- **Scoreboard after phone tickets**, because it reuses the tally from 1b and is the game least like the others.

**Owner decision needed:** accept this order, or keep the original (1b → 2 → 2.5 → games).

## Play-test kit (Phase 1.5)
Before 1b starts, play **3 real Tambola games** with family or friends using Phase 1a:
1. One host, one anchor (can be the same person), at least 6 players with paper tickets.
2. Use real contributions or "No money", with the suggested prizes.
3. Afterwards, note: time from opening the app to the first number; anything confusing; any mis-tap;
   whether manual closing of prizes felt natural; favourite and flat rhymes; anything that made the room
   quieter or louder; whether anyone wanted phone tickets.

Tell the product owner what happened in plain words; it turns findings into decisions, scenario changes,
or new tests for the orchestrator.
