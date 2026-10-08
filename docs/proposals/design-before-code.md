# Design before code: a system that finds problems while they are still cheap (proposal, 8 October 2026)

**Status: approved by the owner, 8 October 2026 ("I approve all"), with the clarification that Jev and the persona agents
evaluate the tap-through prototype as well as the map.** For the orchestrator to apply ("What it needs").

Owner: "optimise the development cycle time: ensure proposed changes are deeply analysed, scenarios simulated and
user journeys critically assessed before any code is written. What architecture and system can strengthen it?"

## What the evidence says
- Impostor's scenarios went from version 2.2 to 3.9 in four days. Each version forced test rewrites and a coder round.
  Most of those versions came from problems found **after** build: the owner playing ("no way to stop", "evening" v
  "session"), the player walks (W1–W20), the session events (E1–E25), Jev's 25 confusing-screen flags.
- The same problem costs minutes in a sketch, an hour in a tap-through, half a day in scenarios and tests, and a day or
  more once code, tests and a release are involved. Everything below moves discovery to the left of "code".
- What already works and stays: player stories first (step 0a), the lifecycle stages, the dual coder-and-tester read,
  the three-way cross-check (step 9), the decisions log, the UX designer and the player helper. What is missing is a
  **model of the game that can be played before it is built**, and a **gate** that closes design before code opens.

## The architecture: one screen map per game, and everything hangs off it
A **screen map** is a plain table the product owner owns, `docs/games/<game>/screen-map.md` (or `.csv`):

| Screen | Size class | On-screen words (from the text list) | Button or gesture | Leads to | Rule it calls | Intentions present (stop · home · back · help · undo) |
|---|---|---|---|---|---|---|

Every screen, every button, every tap-to-move, every rule hook, every "what next?" intention. It is the **single source**
that five things are derived from or checked against, so they can never drift apart:

| Derived from the map | Who uses it | Replaces |
|---|---|---|
| 1. **Tap-through prototype**: a generic renderer (built once, reused for every game) turns the map into a clickable, text-only phone prototype at `/preview/proto/<game>/`, with the real words, real sizes and a pinned bottom bar, but no rules behind it (choices are scripted from the scenario examples) | Owner on their phone; the player helper; Jev screen reads; scripted coverage | Finding "no way to stop" after the build |
| 2. **Scenario skeletons**: every path on the map has at least one scenario ID; the cross-check becomes mechanical (paths with no scenario, scenarios with no path) | Product owner, tester | Hand cross-checking; missed paths |
| 3. **Coverage map** for the Jev and scripted runs (`e2e-and-jev-testing.md`), finite by construction | Tester | A separate hand-written list |
| 4. **Test navigation helpers**: the tester's "go to screen X" steps follow the map, so a flow change is one map edit, not twenty test edits | Tester | Brittle per-test navigation |
| 5. **Design rule checks**, run on the map itself before any code: every screen has a way out; every button leads somewhere; stop and home visible where the guidelines say; one main button per screen; banned words absent; every rule hook has a scenario; every secret is behind a hold | Product owner (automatic, a script in the Test clone the tester keeps) | The player rules of `player-scripts.md`, applied to the design instead of the build |

### How the map gets made (owner, 8 October): owner, Jev and persona agents together
1. **Owner's draft, in plain words:** one screen per line: its name, what it says, its buttons, where each button goes.
   No table skills needed. The product owner turns it into the table and fills the bookkeeping columns (rule hooks,
   intentions, size classes).
2. **Jev reads every screen** of the table (typed questions, inside the weekly cap): which button would a person press
   next; is a way out visible; is any word unlikely to be known by a non-Hindi-speaking family; does this screen duplicate
   one we already have. Jev cannot write the map; it checks it.
3. **Persona agents walk the map**, one agent per persona from the player cast (`player-agent.md`: first-time host,
   grandparent with weak English, 10-year-old, distracted host with one hand busy, competitive uncle, guest who just
   opened the link). Each reads **only the on-screen words and buttons** of the map, never the guide, rules or
   decisions, and plays the evening screen by screen: at every screen, what it wants to do next (carry on, stop, pause,
   go home, get help, undo, change something, switch game) and whether it can see how; words it does not understand;
   where it feels rushed or lost. Text only, no browser, a few minutes each; run one after another, each from a clean
   start. The product owner merges the six reports into one list of gaps, by screen.
4. **Owner fixes the draft** from that list, then the prototype is generated and the owner taps through it (stage 2).
The same four steps run on the **diff** of the map for a C2 or C3 change to a shipped game, and stage 2 repeats them on
the generated prototype (owner, 8 October: Jev and the persona agents evaluate the prototype too, not only the map). This replaces the design-time
player walk of `player-agent.md` with a definite place in the pipeline; its testing-time play of the preview stays.

**Rules stay separate from screens.** The rules engine for a game is pure logic with no screens (as Tambola's is). Its
scenarios carry worked examples with exact numbers (`spec-rules.md`). It is written and mass-simulated **before any
screen code**, because it is the cheapest code to write and the cheapest to prove. Screens come only after the map and
prototype have been played.

## The pipeline before code (the design gate)
| # | Stage | Who | What comes out | Cheap simulation at this stage |
|---|---|---|---|---|
| 0 | Problem and player stories (exists, step 0a) | Product owner | "I want to… so that…" per persona and lifecycle stage | — |
| 1 | **Screen map** and words | Owner's draft; product owner's table; Jev checks; persona agents walk it ("How the map gets made") | The table above; new words into the shared text list; one gap list by screen | Design rule checks (5) run automatically; Jev per screen; six persona walks |
| 2 | **Tap-through prototype** | Generated | A phone-playable prototype in the preview | **Owner taps through on their phone (10 minutes)**; **the same six persona agents play it** in a browser at phone sizes, from what is on screen only, one after another from a clean start, each reporting its timeline, where it got stuck and what it wanted and could not see; **Jev reads every screen state** it produces ("which button would you press?", way out visible, unknown words); a scripted walk proves every path reachable and runs the design rule checks on the live screens. The product owner merges it all into one gap list by screen; the owner fixes; repeat until the list is empty or every open item is a conscious decision |
| 3 | **Critic pass** | A read-only "critic" helper, same model as the designer, different brief | Contradictions between guide, map and decisions; missing intentions; lifecycle gaps (pause, stop, resume, late joiner, phone dies); words a non-Hindi speaker would not know; the three worst things that could happen in the room | — |
| 4 | Rules engine and its scenarios | Tester (scenarios), coder (engine only) | Engine passing rule tests; mass simulation green | Mass simulation, property tests (free) |
| 5 | Scenarios from the map, dual read, cross-check (exists, steps 8–9) | Product owner, tester, coder readers | Approved scenarios, one per path at least | Path-to-scenario check is mechanical |
| 6 | **Design freeze** | Owner | A tagged scenario version; findings after the freeze go to the **next** version (faster-cycles item 6) | — |
| 7 | Screen code | Coder lanes | | The map's coverage run (bundle run) |

Stages 1–3 take hours, not days, and that is where Impostor's post-build findings would have surfaced. Stage 6 is what
stops the churn: a build round works against one frozen version.

**For changes to a shipped game**, the same gate at smaller scale: a C2 or C3 change edits the map first (which screens,
buttons and paths change), the design rule checks run, the owner taps the changed screens in the prototype if the flow
changed, the critic reads the diff, scenarios update, freeze, code. C0 and C1 changes skip the gate.

## Why this is faster, not slower
- Every problem found in stages 1–3 costs minutes to fix and no test or code round.
- The map removes three kinds of rework at once: scenario churn (the owner sees the flow before approving), test
  navigation rewrites (one map edit), and coverage lists written by hand.
- The prototype renderer is built once (one coder lane, a small change: it reads a table and draws screens with the
  shared building blocks from faster-cycles item 8), then every game and every flow change uses it for free.
- Measure, don't assume: lead time per change (design start → families' link), scenario versions per game before build
  starts, and the share of findings made before code. Secret Words is the first game to run through it; compare with
  Impostor's numbers (v2.2 → v3.9; three AI player runs after build; 25 Jev flags after build).

## What it needs
| Item | Who | Class | Owner decision |
|---|---|---|---|
| Screen map as a required design artefact (step 1b of `new-game-process.md`; Secret Words first), made by the owner's draft, the product owner's table, Jev checks and persona-agent walks | Owner, product owner | C0 | **Owner said yes, 8 October** (the making of it); the artefact itself: **yes** |
| Generic prototype renderer at `/preview/proto/` reading `docs/games/<game>/screen-map` from the product docs, using the shared building blocks | Coder, one lane, after faster-cycles item 8 | C1 (no rules, no saved data) | **Yes** (8 October); it is app code that families never see |
| Design rule checks as a script in the Test clone, run on the map (and later on the build) | Tester | Test only | **Yes** (8 October) |
| Critic helper: a read-only brief in `.claude/workspace/agents/critic.md`, called by the product owner at stage 3 and on every C2/C3 design diff | Orchestrator applies (project rules) | Rules | **Yes** (8 October) |
| Design freeze rule: scenario versions are tagged; after a freeze, findings go to the next version; a build round never changes its version | Owner | Rules | **Yes** (8 October; same as faster-cycles item 6) |
| Role guard: the product owner may edit `docs/games/<game>/screen-map.*`; no other change | Coder (guard) | Rules | Follows from the first row |

Nothing here needs a paid service. Jev screen reads sit inside the weekly cap.

## Not proposed
- A full visual design tool or hand-drawn mockups per screen: the text-only prototype with real words and sizes is enough
  to find flow and wording problems, and it stays in sync with the map because it is generated from it.
- Writing the app itself from the map ("low code"): the map describes the flow; the coder still builds the screens with
  the shared building blocks. Generating the app would tie the design to the code's shape.
- A second product owner or a committee: one owner of the map; the critic is a brief, not a person.
