# Working with AI: what three weeks of Pocket Game Night taught us (product owner, 16 October 2026)

Owner's consolidated version, in everyday language with eleven principles from leading voices added: Claude Doc
"Working with AI agents: consolidated principles" (https://claude.ai/artifact/8rL2njGiChcAbgAcxFTAUk), 16 October 2026.

For the owner, who asked: how did the way we work evolve, what are the limits of a language model, where do several agents
and a division of responsibilities pay off, and what general principles follow? Everything below is drawn from the project's
own record: `docs/decisions.md`, the proposals in `docs/proposals/`, `reports/`, and the lifecycle look-back.

## 1. How the way of working evolved (five moves)
| When | What we noticed | What we changed |
|---|---|---|
| 28 September | One chat writing code and tests from one understanding passes its own tests and misses the same things twice. | Two clones, Build and Test, with a guard enforced by code: the coder never sees tests, the tester never sees code. The owner approves behaviour (scenarios, preview), never code. 57 decisions recorded that day with their basis. |
| 28 September to 3 October | Tambola went live; almost every change after that came from edges the design never looked at: arriving, teaching, money after the game, players' phones, small screens. Reviews kept adding rows while builds were open (7 to 25). | The lifecycle design (five stages, every role, before any build); one-way doors decided first with worked numbers; the change SOP (C0 to C3, tests first only for C3); parallel coder lanes by screen area. |
| 4 to 8 October | Impostor's scenarios went from version 2.2 to 3.9 in four days. A typical change took half a day to a day; the measured causes were blind coders, red `main`, brittle exact-text tests, one long-running tester that stalled, and scenario churn. | The player helper that plays without reading the spec; Jev as a cheap judge, not a referee; the faster-cycles plan from measured causes; freeze scenarios per batch. |
| 8 October | Jev was being asked to do coverage, which scripts do for free, and not to do judgement, which it does for a fraction of a cent. | Scripts own coverage, Jev owns judgement; standing Jev jobs (word lists, word-game guesser, finding triage); right-size the model to the task. |
| 8 to 11 October | Problems found after build cost code and test rounds; the same problems in a sketch cost minutes. | Design before code: one screen map per game as the single source; six personas and Jev walk the map, then the prototype, before any code. On Secret Words this found 22 gaps and 44 unclear labels in under an hour, for about the price of one coffee. |

The direction of travel is consistent: **move discovery earlier, separate who makes from who checks, and give each helper
only the knowledge its job needs.**

## 2. Where a language model is weak, as we actually saw it
| Weakness | What it looked like here | What works against it |
|---|---|---|
| **It grades its own homework.** One mind writing code and its tests shares every blind spot. | Early tests passed on wrong assumptions. | Separate roles with separate information; tests from owner-approved scenarios, written before code. |
| **It doesn't notice what isn't there.** It answers the question asked and fills the frame it is given. | Every "no way to stop", "no way home", "no help on the map phone" was found by someone playing, never by a spec read. | Players and personas who read only the screen; Jev asked "which button would you press?"; the "what next?" rule on every screen. |
| **It is literal.** Exact words and pixels in tests break on any change; an ambiguous spec gets a confident guess. | One wording change broke dozens of tests; Mac fonts passed where Linux fonts failed; scenario versions churned. | Behaviour-based checks, one shared text list, design values with ranges; unambiguous specs with exact strings and numbers; a coder-reader and a tester-reader before hand-over. |
| **It is bad at arithmetic and counting.** | Rounding gave Early Five more than a Line; Jev cannot count at all. | Worked examples the owner checks; property tests; the rules engine is always the referee; code computes facts, models judge. |
| **It loses the thread.** Long sessions fill their context, stall, and drift. | The long-running tester stalled four times and hit limits three times. | Short-lived specialists with one job each; instructions in `docs/handover.md`, never in chat; decisions with dates and basis. |
| **It adds scope.** Every review finds more; every finding feels urgent. | The UX list grew during builds; nine scenario versions in four days. | Change classes; freeze per batch; findings after a freeze go to the next version; the release rule (only stuck or privacy holds a release). |
| **It works blind unless you give it eyes.** | Coders could not see the screen or run tests, so layout bugs surfaced hours later. | Read-only test and screenshot commands for coders; screenshots for the owner's approval of look changes. |
| **It trusts its tools.** A tool's verdict looks like a fact. | The first 200-evening simulation reported 42 dead ends and 55 secrets shown; all were simulator faults. Today's CSV edit mangled three rows until a check caught it. | Prove a runner before it can block anything; count tool faults apart from findings; verify after every edit. |
| **It follows rules imperfectly.** An instruction is a suggestion; a hook is a wall. | Role rules in a text file were not enough. | The role guard enforces reads, edits and commands in code; the commit hook blocks crossing the line (section 3b). |

## 3. Where several agents and a division of responsibilities pay off
1. **Adversarial separation, always.** Whoever writes is never the one who checks. Build and Test; coder and reviewer;
   scenarios approved by a human before tests exist. This is the single most valuable split and costs almost nothing.
2. **Divide by what each one is allowed to know, not only by what it does.** The player reads no spec, so it finds what
   the spec forgot. The reviewer reads the spec, so it finds deviations. The critic reads the design, so it finds missing
   intentions. Jev sees only the words on a screen, so it tells us what the words alone convey. Same model, different
   information diet, different findings.
3. **Short-lived specialists beat one long generalist.** A tester per job, a coder per lane, a persona per walk, each with
   a fresh context and a written hand-back. The hand-over document is the shared memory, not the conversation.
4. **Parallelism only where the work doesn't collide.** Lanes by screen area; files needed by two changes go to one lane;
   core (C3) changes are never split; small merges, one at a time, so the main line stays green.
5. **One owner of the "what", separate from the "how".** The product owner writes decisions, scenarios and the screen map;
   the orchestrator plans and merges; coders and testers execute. Nobody edits another's folder.
6. **Enforce the division in code.** Hooks and commit checks, with the rule "never work around a block; say what is needed".
7. **Right-size the mind to the job.** A decision model at a fraction of a cent for judgement at scale; a mid-size model
   for walks, scripts and routine; the largest for design, rules, money and first plays of new screens.
8. **Know when not to.** Low-volume judgement (a few change classes a day) does not need a model; shared state that must
   live in one head (a C3 change) must not be split; two agents in one folder cost more than they save.

## 3b. Mechanical, deterministic enforcement: let the machine hold the line
A rule written in a prompt is advice; a model follows it most of the time, and "most" is where the damage happens. A rule
written in code runs every time, costs nothing, never tires and never argues. The project moved rule after rule from the
first kind to the second:

| Rule | Was | Now enforced by |
|---|---|---|
| Coders never touch tests; testers never touch app code; the product owner writes only its own `docs/` | A sentence in `CLAUDE.md` | `role-guard.mjs` on every edit, read and shell command, and `.githooks/pre-commit` on every commit; lanes and Test worktrees recognised by folder name |
| Tests run only on pushed code, never on half-finished edits | "Pull before testing" | Two clones that cannot read each other; the tester's commit names the commit it tested |
| Nothing reaches families without a green complete run | "Release only when green" | `release.yml` refuses unless a complete run on that exact commit is green |
| `main` stays green | "Merge carefully" | Quick verify on the lane branch; merge only when green and up to date (faster-cycles item 1) |
| Money always adds up; one winner or ended early; no turn exceeds its allowance | Rules in a guide | Invariants in the rules engine, property tests over thousands of random games, mutation testing on rules and money lines |
| Every path and button is exercised | "Test thoroughly" | A coverage map derived from the screen map, each item marked reached or not, red on unreached |
| Every screen has a way out; one main button; no text cut off; no secret in a room screen's page | UX guidelines | Player rules as scripted checks after every simulated step; the design rule checks run on the map before code |
| Jev only judges, never decides | A principle | Code offers the options, Jev picks one; thresholds live in one config; "uncertain" is always an option; the weekly cap stops the calls |
| Randomness is reproducible | — | Every draw from a named seed; a failing evening saves its seed and steps and becomes a permanent test; replays |
| Tests behave the same everywhere | "Works on my Mac" | The shipped font, the official browser image, a controlled clock, animations off |
| Old saved games always open | A promise | A format version in every saved game from day one, with migration tests |
| No helper reads outside content, holds a secret and can push, all at once (the lethal trifecta, adopted 16 October) | — | Key files unreadable except to the tester; no web for the tester; read-only helpers can't push; outside text is data (`docs/handover.md`) |
| No secrets in the public repo | A warning | Key only in gitignored files or a GitHub secret; every error message passes through a redactor; a key-hygiene test scans the tree |
| Changes are small and classed | "Keep changes small" | One commit per UX row, reviewer before C2/C3 merges, quick verify per push |

**Principles that follow.**
1. **If a rule matters, make the machine hold it.** Instructions decay with context length and with every new session; a
   hook, a CI gate, an invariant or a type check does not. Keep the sentence in the rules file for humans, and add the
   check for the machine.
2. **Deterministic before intelligent.** Where a question has a definite answer (does it add up, is every button reached,
   is a secret in the page, does the string match the list), a script answers it for free and exactly. Spend a model only
   on judgement: is this clear, would a person press this, is this word known.
3. **Reproducibility is the price of debugging AI-made systems.** Seeds, fixed clocks, pinned environments and saved
   replays turn "it failed once" into a permanent test. Without them, a model's fix for a flaky failure is a guess.
4. **A guard must leave a door.** Every block comes with the rule "never work around it; write what is needed" and a
   place to write it (`reports/latest.md`, `docs/test-questions.md`). The lanes had to be taught to the guard before they
   could be used; a guard that doesn't know a legitimate path blocks the work or, worse, lets everything through.
5. **Gates, not reviews, for the things that must never happen.** Secrets, money, releases and crossing the build-test
   line are gated by code; reviews are for quality, where judgement is the point.
6. **Encode decisions as data the machine reads.** Thresholds, caps, design values with ranges, the text list, the screen
   map: when a decision is a value in a file, every tool applies it the same way and changing it is one edit.
7. **Enforcement also protects the model from itself.** A model under pressure to make tests pass will weaken a test if it
   can; it cannot if it cannot edit the test folder and a reviewer flags any deleted or loosened check. The guard is not
   distrust; it removes a temptation that every optimiser has.

## 4. General principles for working with AI (the short list)
1. **Humans approve behaviour, not code.** A non-developer owner can run a software project if every question is about
   what happens on the screen, with a preview link, a screenshot or a worked number.
2. **The owner playing it is the highest-signal test. Move it earlier.** From "after the build" to "on a tap-through
   prototype" to "on a screen map".
3. **Shift left and price it.** A problem costs minutes in a sketch, an hour in a prototype, half a day in scenarios and
   tests, a day or more once built. Spend effort where fixes are cheap.
4. **One source of truth per kind of thing.** The screen map for flows, the text list for words, the decisions log for
   choices, scenarios for behaviour. Derive everything else from them so nothing drifts.
5. **Write it down with a date and a basis.** Models forget; documents don't. Instructions go in the handover, questions
   are batched once per round, and the owner is updated after every round.
6. **Measure cycle time and change the process from measured causes**, not from impressions. The faster-cycles plan named
   five causes with numbers; each change in it targets one.
7. **Freeze, then build.** New findings during a build go to the next version. Scope grows only between batches.
8. **Decide one-way doors explicitly.** Money, secrets, saved data and rules are the owner's decisions, asked as questions
   with a recommendation, never silently chosen.
9. **Discover with AI once, check with scripts forever.** Every new kind of finding becomes a rule or a scripted check, so
   the same mistake is never paid for twice.
10. **Trust nothing untested, including the testing tools.** Prove a runner with clean weeks before it can block a release;
    keep tool faults apart from findings; verify after edits.
11. **Keep the humans' time the scarce resource.** Batch questions; recommend a default; continue on low-impact calls when
    the owner is away and list them afterwards.
12. **Cheap and fast changes what is worth doing.** Six persona walks and a Jev read of 41 screens and 223 labels cost
    less than a cup of tea. Things that were "too expensive to check" are now routine.

## 5. What to keep watching
- **Document upkeep** is now real work: the map, the text list and the scenarios must stay in step. The derivations and
  checks are the answer; if they lag, drift returns.
- **The screen map is a new single point of failure.** A wrong map produces a wrong prototype, wrong tests and a wrong
  coverage map, all consistent with each other. The owner's tap-through and the personas are the check on the map itself.
- **Jev is a filter, never a judge of truth.** Its word-list flags were half right (Puri, Tiffin); the owner decides.
- **The prototype path is designed, not yet proven.** Secret Words is the first game through it; measure versions before
  build and findings before code against Impostor's numbers.
