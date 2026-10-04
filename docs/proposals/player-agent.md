# Proposal: a player helper that only looks for what real players would miss (owner, 4 October 2026)

Status: **owner asked for it, 4 October 2026** ("start with the user perspective… have a player agent whose job is
only to find these things; invoke it during design and testing too"). For the orchestrator to apply (project rules).

## Why
The lifecycle design (`docs/proposals/next-game-lifecycle.md`) was meant to start from the people in the room, and it
did at the level of the evening. But nobody walked each **screen** as a player. The owner, playing once, found what
two specification reads, a UX review and 200 simulated evenings did not: after a round there was no visible way to
stop ("End the evening" hidden in a menu), no way home, and "evening" clashed with "session".
Every reviewer so far reads the spec first, so it judges the build against the spec. A player helper must **not** read
the spec: it plays the way a family does and says where it got stuck, what it wanted and couldn't see, and what made
no sense.

## The role
| Player | |
|---|---|
| Who | A subagent the **product owner** calls (design) and the **orchestrator** calls (testing). |
| Plays as | One person at a time from a fixed cast: a first-time host, a grandparent with weak English, a 10-year-old, a distracted host with one hand busy, a competitive uncle who argues every clue, a guest who just opened the link. Each run names the persona. |
| Does | Plays the game end to end, **without reading the scenarios, guides or UX docs**, from what is on screen only. At every screen it writes what it wants to do next (carry on, stop, pause, go home, get help, undo, change something, switch game) and whether it can see how. It reports: where it got stuck, what it expected and didn't find, words it didn't understand, moments it felt rushed or lost, and what made the room quieter. |
| In design | Walks the screen sketches and the screen-by-screen text (`lifecycle.md`, `ux.md`) as each persona **before** scenarios are written, and lists missing intentions. (Here it may read only the sketches and on-screen words, not rules or decisions.) |
| In testing | Plays the preview link in the built-in browser at a phone size, once per persona, after each green build of a game or a changed flow, and before every release. |
| May read | the live preview; in design, only the sketches and screen text it is given |
| Never | reads the scenarios, decisions or guidelines; edits anything; runs tests; proposes code. It reports as a player, in plain words. |
| Output | Per persona: a timeline of screens with "I wanted… I could / couldn't…", the top problems in the player's words, severity (stuck / confused / annoyed), and a screenshot each. The product owner turns real problems into decisions; the UX designer measures and proposes the fix. |

## How it fits with the others
| Helper | Reads the spec? | Finds |
|---|---|---|
| Coder and tester readers | Yes | Ambiguity in the spec |
| UX designer | Yes | Broken guidelines, layout, accessibility, sizes |
| Jev in screen simulations | No (taps by persona) | Dead ends, confusing main buttons, at scale |
| **Player** | **No** | **What a real family wants and can't see; words that make no sense; the flow as a whole** |

## The workflow, now starting from the player
1. **Player stories first** (new step 0 of `docs/new-game-process.md`): for each persona, "I want to… so that…" for
   every stage of the evening, including stopping, pausing, coming back, switching game and teaching someone.
2. Lifecycle design and screen sketches.
3. **Player walk of the sketches** (each persona) → fix the design.
4. Rules, decisions, scenarios; the coder and tester readers.
5. Build.
6. **Player play of the preview** (each persona) with the UX designer's review and the Jev simulations.
7. Owner tries it; release.
The UX playbook's pass 12a "What next?" and guideline 47a stay as the measurable checks.

## Changes to apply (one commit, orchestrator idle; owner approval: this request)
1. `.claude/workspace/agents/player.md`: the brief above; tools Read and the built-in browser tools only (no Edit,
   Write or Bash); explicitly forbidden to open `specs/`, `docs/decisions.md`, `docs/games/*/scenarios.md`,
   `docs/ux-guidelines.md`. Available to the product owner's chat (as the UX designer is) and to the orchestrator.
2. `.claude/hooks/role-guard.mjs`: a `player` role that may read only the preview (browser) and, in design, the files
   the caller names; changes nothing.
3. Root `CLAUDE.md` and `.claude/workspace/CLAUDE.md`: add the Player row to the Roles tables; the orchestrator calls
   the player after each green build of a changed flow and before every release.
4. Until it is installed, the product owner runs the same brief through a general helper (below).

## Brief for a player run (used now, until installed)
"You are <persona>. You have never seen this game's rules. Open <preview link> at <size>, and play a whole game of
<game> with <n> imaginary people, from Home. Do not read any project files. At every screen write: what you want to
do next, whether you can see how, and anything you don't understand. Try at least once each: stop after a round,
go home and come back, ask how to play, undo a wrong tap, change who is playing. Report your timeline and your top
problems in your own words, with a screenshot each."
