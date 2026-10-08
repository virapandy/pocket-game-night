# Adding a new game: the design process

How a game goes from an idea to approved test cases, before any code is written. Tambola is the
worked example; every file named here exists for Tambola under `docs/games/tambola/` and `specs/tambola/`.
All steps happen in the **Test role**: the `tester` subagent (run by the orchestrator in the
workspace folder) or the Claude desktop app. The Build role starts only after step 9.

## At a glance
| # | Step | Output | Owner checkpoint |
|---|---|---|---|
| 0 | Fit check | A short yes/no against the brief's intake questions | Owner says go |
| 1 | Game overview, how to play, rules | `docs/games/<game>/guide.md` | Owner reads the guide |
| 1b | Screen map and tap-through prototype | `docs/games/<game>/screen-map.md`; the prototype in the preview; one gap list | Owner drafts the screens, taps the prototype, fixes |
| 2 | Game setup, anchor/host role and controls | "Setup" and "Host" sections of `journeys.md` | |
| 3 | Player roles and controls | "Players" section of `journeys.md` | |
| 4 | User journeys | `docs/games/<game>/journeys.md` | Owner reviews the journeys |
| 4b | Lifecycle and long-term behaviour | "Lifecycle" section of `journeys.md`; game-specific scenarios in `specs/<game>/10-lifecycle.md` | Owner reviews with the journeys |
| 5 | UX considerations | "UX notes" section of `journeys.md`, plus new rules in `docs/ux-guidelines.md` if any | |
| 6 | Decisions | Rows in `docs/decisions.md` | Owner decides, or says "follow conventions" |
| 7 | Contract check | "Contract" section of `guide.md` | Owner told if the engine must change |
| 8 | Test cases | `specs/<game>/` scenario files | Owner approves the scenarios |
| 9 | Cross-check and hand-off | A clean gap list; `reports/latest.md` updated | Tests are written, then code |

Steps 1, 5 and parts of 3 need research. Run them as parallel research agents while drafting.

---

## Step 0a: Player stories first (owner, 4 October 2026)
Start from the people, not the rules. For each persona in `docs/proposals/player-agent.md` (first-time host,
grandparent, 10-year-old, distracted host, competitive uncle, guest with the link), write "I want to… so that…" for
every stage of the evening, including **stopping, pausing and coming back, switching game, teaching someone, fixing a
mistake**, and every moment in `docs/room-moments.md` (people arriving and leaving mid-round, breaks, switching game,
mistakes). Every later step is checked against these stories. After the screen sketches, a **player walk** (the player
helper, each persona, reading only the sketches) lists what players want and can't see; after the build, a **player
play** of the preview does the same before release.

## Step 0: Fit check
Answer the five intake questions from the research brief in one line each. Stop if any answer is no.
| Question | Include only if |
|---|---|
| Does it work in a real room? | It creates conversation, observation, movement or a shared reveal |
| Can it start quickly? | A new group reaches the first action in about 30 seconds |
| Does a phone add something? | Secrecy, fair randomness, automatic bookkeeping, or a richer reveal |
| Is it culturally flexible? | Prompts, scoring and names can be localised without breaking the game |
| Can it degrade safely? | It still works with one device and without internet |

## Step 1: Game overview, how to play, rules → `guide.md`
Written for someone who has never played. One page.
1. **Overview:** what the game is, other names, who it suits, group size, time.
2. **What you need.**
3. **How to play:** numbered steps from start to finish.
4. **Rules:** numbered. Each rule says what the **convention** is.
5. **Variants:** where sources differ, say so and name the one we follow.
6. **How Pocket Game Night plays it:** what the phone does, and what stays in the room.
7. **Sources:** at least three established sources, each actually opened, with the date checked.

Rule: conventions win by default. Anything we change from the convention is marked as ours.

## Step 1b: Screen map and tap-through prototype (owner approved, 8 October 2026)
Before journeys and scenarios, the game gets a **screen map** (`docs/games/<game>/screen-map.md`) and a generated
**tap-through prototype**, made and checked as `docs/proposals/design-before-code.md` describes: the owner's plain-word draft,
the product owner's table, Jev's per-screen checks, six persona agents walking the map, the owner's fixes; then the prototype,
played by the owner on their phone, by the same six persona agents in a browser at phone sizes, read by Jev at every screen
state, and walked by a script that runs the design rule checks. Output: one gap list by screen, worked down to zero or to
conscious decisions, before step 4. Then the **critic pass** (stage 3 of the proposal), and a **design freeze** before build.

## Step 2: Game setup, anchor/host role and controls
- **Setup screen by screen:** every choice, its default, and the target time to the first action.
- **Settings:** each house rule becomes a setting whose default is the convention.
- **Anchor / host role:** what they say aloud, what they tap, and what they confirm (e.g. prizes).
- **Host controls:** the one primary action (fixed, bottom centre), secondary actions, and rare or
  destructive actions (top, behind a specific confirmation).
- **Money or prizes**, if the game has them: reuse the Tambola prize-pool rules
  (`specs/tambola/08-prizes.md`). The app never moves money.

## Step 3: Player roles and controls
For each role (e.g. Impostor: crew and impostor):
- What they **see** (public on the host screen vs private on their phone)
- What they **do** (aloud, on paper, or on a phone)
- What they must **never** see (other roles, upcoming answers)
- **Controls**, if any, on their own phone. Default to none: the room is the interface.

## Step 4: User journeys → `journeys.md`
- **Modes:** which ways to play apply: one shared phone, pass the phone, phones for private info,
  paper. Each mode must fall back to a simpler one.
- **One table per role per mode:** stage · what they do · what they see · target time.
- **Moments every game must handle:** late joiner, interruption (lock, call, app closed), first-timer,
  ending early, play again, a phone dying.
- **Gaps:** list behaviour the journeys need that no rule covers yet. These feed step 6 and step 8.

## Step 4b: Lifecycle and long-term behaviour
The shared rules are in `specs/platform/01-lifecycle.md` (states, one game at a time, resume, discard,
history, delete, storage, updates). For each new game, answer only what is special to it:
- **Ending early vs discarding:** what happens to scores, prizes or roles in each case?
- **Resuming:** can the game sensibly resume hours later, or does it lose its point (e.g. a timed round)?
- **Chaining games:** does "Play again" carry anything over (scores, roll-overs, teams)? Is there a
  night-level total?
- **What a finished game keeps** for history, disputes and exact replay, and what it must not keep
  (e.g. secret words or roles after the game, if they would spoil a replay of the same pack).
- **Anything that must never be lost** (money, roll-overs) when a game is discarded.

## Step 5: UX considerations
1. Walk the journeys against every section of `docs/ux-guidelines.md` and note where the game needs
   something specific (e.g. a timer that everyone can see, a secret reveal that neighbours can't glimpse).
2. Research anything new to this game in parallel (e.g. pass-the-phone privacy, reading prompts aloud).
3. Add lasting rules to `docs/ux-guidelines.md`; keep game-only notes in `journeys.md`.
4. Check tone: a mistake or a loss should get a laugh, not embarrass anyone.

## Step 6: Decisions
- List every open question from steps 1–5 in `docs/decisions.md`, each with options, the convention
  marked **norm**, and Claude's recommendation.
- The owner decides, or says "follow conventions"; Claude then records the norm with its source.

## Step 7: Contract check
Map the game onto the seven contract questions in `src/engine/CLAUDE.md`:
| Question | This game's answer |
|---|---|
| Setup | |
| Legal moves | (must be a finite list, so the generic Jev player can choose) |
| Apply | |
| View | (what each role may see) |
| Game over | |
| Invariants | |
| Undo | |
If any answer doesn't fit, flag it to the owner before scenarios are written: it means an engine change.
Also note which secrets need their own seeds.

## Step 8: Test cases → `docs/games/<game>/scenarios.md` (drafts), then `specs/<game>/`
**Every scenario follows `docs/spec-rules.md`** (exact words, numbers with where they hold, edge cases, test hooks,
one fact in one place), and passes the two-reader check (a coder-reader and a tester-reader list every guess; all
resolved) before it goes to the tester.
- Use the scenario template in `specs/README.md` and the game's ID prefix (below).
- Suggested files, following Tambola:
  `01-setup` · `02-core-play` · `03-winning-and-scoring` · `04-house-rules` · `05-secrets` ·
  `06-room-and-host` · `07-undo-replay-end` · `08-prizes` (if any) · `09-usability` · `10-lifecycle`.
- Include **property scenarios** ("for thousands of random games, X is always true") for every invariant.
- House-rule scenarios state the decided option.

## Step 9: Cross-check and hand-off
Before asking for approval, check three ways and fix every gap:
1. **Guide ↔ scenarios:** every rule in the guide has a scenario, and no scenario contradicts the guide.
2. **Journeys ↔ scenarios:** every journey step and moment has a scenario.
3. **UX guidelines ↔ scenarios:** every guideline that applies has a scenario in `09-usability`.

Record the result in `specs/<game>/README.md` ("Checked against …"), update `reports/latest.md`, and
ask the owner to approve. Approved scenarios become tests; then the Build role starts.

---

## Jev during design (owner, 8 October 2026)
Jev (TypeSafe's decision model; `docs/proposals/e2e-and-jev-testing.md`) answers typed questions cheaply with probabilities.
The product owner asks the orchestrator to run these **before** asking the owner to approve:
1. **Word list check** (step 1 and whenever a word file changes): for every word, yes/no with probability on: belongs to its
   category; known to most Indian families, including a non-Hindi speaker from Tirunelveli or Sivagangai; family-friendly;
   one word, not a phrase. Words below 0.5 on any question go in a short list for the product owner, who decides, and the
   owner approves the list with that list attached. Jev is a first filter, never the approver.
2. **Board or clue check for word games** (step 2–3, Secret Words and the like): Jev guesses as the team would (a clue
   against the board words); word pairs the guesses confuse are reworded before scenarios are drafted.
3. **Screen text check** (step 5, with the UX designer): for each sketched screen, "which button would you press next?" from
   the on-screen words alone. A screen whose most likely answer is not its main button is reworked before build.
Jev never writes text, counts or decides a rule; it sorts, scores and says yes or no. Costs sit inside the weekly cap.

## ID prefixes
| Game | Prefix | Folder |
|---|---|---|
| All games (platform) | PLT | `platform` |
| Tambola | TAM | `tambola` |
| Impostor | IMP | `impostor` |
| Dumb Charades | CHA | `charades` |
| Scoreboard / Rummy scorekeeper | SCO | `scoreboard` |
| Secret Words (Codenames-style) | SWD | `secret-words` |

## Definition of done (design)
- [ ] Fit check passed
- [ ] Guide with at least three opened sources
- [ ] Journeys for every role and mode, with the shared moments
- [ ] Lifecycle questions answered, with game-specific scenarios in `10-lifecycle.md`
- [ ] UX notes, and new guidelines added where lasting
- [ ] Every decision recorded, with its basis
- [ ] Contract check with no unflagged engine changes
- [ ] Scenarios cross-checked three ways
- [ ] Owner approval recorded in each scenario's status
- [ ] Jev word list check run and its short list settled (word games and any game with a word file)
- [ ] Screen map and prototype checked by Jev and the six persona agents; gap list at zero or decided; critic pass done; design frozen
