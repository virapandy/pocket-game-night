# Pocket Game Night

An installable, offline-capable web app that helps friends and families run in-person party and
card games from one host phone. The phone replaces paper and bookkeeping, not the social ritual.
First game: **Tambola**. Games two to four (Impostor, Dumb Charades, Scoreboard / Rummy scorekeeper)
follow quickly on the same game contract.

**Current stage:** Phase 1a (Tambola with paper tickets on one host phone) is built, green and live.
What comes next, and in what order: `docs/roadmap.md`. Build handover: `docs/handover.md`.

The owner is not a developer. The owner approves **behaviour** (scenarios in `specs/`, preview
links), never code. Explain every change in plain English.

## How we work: read this first

Code and tests are never written from one shared understanding. Two clones of
github.com/virapandy/pocket-game-night sit side by side in one **workspace folder**, so tests
always run on pushed code, never on half-finished edits:

```
<workspace>/                   open Claude Code here to orchestrate (set up by .claude/workspace/setup.sh)
  pocket-game-night/           Build clone
  pocket-game-night-testing/   Test clone
  pocket-game-night-product/   Product clone (product owner's docs; works in parallel)
```

| Role | Who | Folder | May edit | May run |
|---|---|---|---|---|
| **Orchestrator** | Claude Code opened in the workspace folder | both, read only | `docs/` in the Build clone | git, type-check, build; never tests |
| **Build** | `coder` subagent, or Claude Code opened in `pocket-game-night/` | `pocket-game-night/` | `src/`, `content/`, root config files, `.github/`, `docs/` | type-check, build, lint |
| **Test** | `tester` subagent, or the Claude desktop app opened in `pocket-game-night-testing/` | `pocket-game-night-testing/` | `tests/`, `specs/`, `reports/`, `docs/` | every test, simulations, iPhone Simulator, browser checks |
| **Product owner** | the Claude desktop app opened in `pocket-game-night-product/` (or the workspace folder) | all, read only; writes only its own clone | `docs/` in `pocket-game-night-product/` | nothing that builds or tests |
| **UX designer** | `ux-designer` subagent, called by the product owner | all, read only; the live preview | nothing | nothing (reviews screens by `docs/ux-evaluation-playbook.md`; reports to the product owner) |

- **Usual way: three agents in one chat.** Open the workspace folder. The main session is the
  **orchestrator**; it runs the loop below by handing work to the **coder** and the **tester**
  subagents, one at a time, and reports to the owner. The owner talks only to the orchestrator.
  Its instructions are in `.claude/workspace/CLAUDE.md`; the subagents' are in
  `.claude/workspace/agents/`.
- **Also allowed:** Claude Code in `pocket-game-night/` as the Build role alone, or the desktop
  app in `pocket-game-night-testing/` as the Test role alone. Never have the desktop app and the
  `tester` subagent working at the same time: they share the Test clone.
- Build never writes or runs tests. Test never edits app code. The subagents cannot even read the
  other clone, so the tester sees only pushed code and the coder sees only pushed tests.
- Root `CLAUDE.md`, `.claude/` and `.githooks/` are project rules: every edit asks the owner
  first, and subagents may not change them.
- Enforced by `.claude/hooks/role-guard.mjs` (edits, reads, test commands, files changed by shell
  commands) and `.githooks/pre-commit` (commits). Never work around a block. Say what is needed
  instead: the Test side writes it in `reports/latest.md`; the Build side in `docs/test-questions.md`.

**New machine:** make a workspace folder, clone the repo into it, then run
`sh pocket-game-night/.claude/workspace/setup.sh` from the workspace folder. It clones the Test
copy, turns on the commit check, and links the orchestrator's `CLAUDE.md`, hooks and subagents
into the workspace folder. Links mean a `git pull` updates them. Change them in
`.claude/workspace/` in the repo, never in the workspace folder.

## The loop

1. **Test:** draft plain-English scenarios in `specs/`; the owner approves them.
2. **Test:** write failing tests from the approved scenarios in `tests/`; push.
3. **Build:** pull; write code so the tests pass (read them, never edit or run them); type-check; push.
4. **Test:** pull; run every rule test and the affected browser tests; push; the automation run's
   full browser run is the verdict; write `reports/latest.md` naming the commit and that run.
5. **Build:** pull; read `reports/latest.md`; fix. Repeat 3–5 until green.
6. **Automation:** runs every test layer on push and publishes a preview link; the owner plays it.

The orchestrator runs steps 2–5 in order, gives each subagent only what it needs (to the tester,
scenario IDs and the commit to test; to the coder, the tested commit and its failures), and stops
to ask the owner when scenarios are not approved, a test looks wrong, or three rounds have not
turned the tests green.

Git: one branch, `main`. `git pull --rebase` before starting and before every push. Small commits.

## Layout

```
CLAUDE.md               this index
.claude/                settings.json (hooks), hooks/role-guard.mjs
  workspace/            the orchestrator's CLAUDE.md, settings.json, agents/ (coder, tester)
                        and setup.sh, linked into the workspace folder
.githooks/pre-commit    blocks commits that cross the build/test line
docs/                   roadmap.md, handover.md, decisions.md, new-game-process.md,
                        ux-guidelines.md, test-questions.md
  games/<game>/         guide.md (rules and contract check), journeys.md, rhymes or other source content
src/                    BUILD: app code
  app/                  host app shell; assembles everything; nothing imports it
  engine/               game contract, referee, seeds, move records, undo, interfaces
  games/tambola/        one self-contained game slice (rules/, ui/, index.ts)
content/tambola/        BUILD: rhymes and calls per language (data, not code)
specs/                  TEST: plain-English scenarios the owner approves
  platform/             PLT-: lifecycle, history, sessions, tally (all games)
  <game>/               TAM-, IMP-, CHA-, SCO-: one folder per game
tests/                  TEST: contract/, games/<game>/, replays/, browser/, sim/
reports/latest.md       TEST: the test report the Build role reads
```

`src/blocks/` (shared building blocks) and `src/adapters/` are created only when a real need
appears (Phase 2.5 and later).

## Phases
Every scenario has a `Phase:` line. Build only the current phase: **1a** (one great game) →
**1b** (sessions, tally, history management, late joiners, voice) → **2** (tickets on phones).
Later phases add features without changing how earlier games are played or stored.

## Principles

- **The room comes first.** Calling aloud, shouting claims and checking tickets together are the
  game. Digital shortcuts are optional, off by default, and come with a short warning to the host.
- **One phone always works**, with no internet.
- **Every game follows one contract:** setup, legal moves, apply, view, game over, invariants, undo.
  Rules are pure: all randomness from seeds, no screen or network code. The host phone is the referee.
- **Secrets get their own seeds, and seeds never leave the host phone.** Tambola's draw seed and
  sheet seed stay on the host; a player's phone receives only its own ticket's numbers (TAM-053).
- **Generalise only when two real games need it.**
- **Complexity budget.** Before adding a framework, service, dependency or abstraction, state: the
  problem it solves now, why something simpler cannot, what it costs to maintain, and how we will
  know it was worth it. No paid service without the owner's explicit approval.
- **$0 per month.** Free hosting, standard GitHub runners only.
- **The repo is public.** Never commit secrets, API keys, player data, or the private research brief.
- **Money is calculated, never moved.** Pots, prizes and tallies always add up exactly; no payments.
- **Saved games carry a format version** from the first release, and old games always still open.
- **Jev is optional everywhere.** Jev (TypeSafe AI) returns typed decisions with probabilities; it
  cannot write text and is unreliable at counting. Code computes facts, Jev judges behaviour, and
  the rules engine is always the referee.
- **Tests are never weakened, skipped or deleted** without the owner's explicit approval.

## Stack (Phase 0 defaults)

TypeScript · React + Vite as an installable web app · Vitest + fast-check · Playwright · Stryker ·
GitHub Pages · GitHub Actions.

- Test configs live in `tests/` (for example `tests/vitest.config.ts`); `package.json` scripts point there.
- Dependencies are added by the Build role; the Test role requests test tooling in
  `reports/latest.md`. The Test role installs with `npm ci`, never `npm install`.

## Commands

- Build role: `npm run typecheck`, `npm run check:boundaries` (dependency rules), `npm run build`,
  `npm run dev` (local app)
- Test role: `npm test` (Vitest, config `tests/vitest.config.ts`), `npm run test:browser`
  (Playwright, config `tests/playwright.config.ts`, against `npm run build` + `npm run preview`)
- Automation (`.github/workflows/ci.yml`) runs all of these on every push to `main`, then publishes
  https://virapandy.github.io/pocket-game-night/ only if everything is green. The app is served under
  `/pocket-game-night/`, locally too.

## Habits

- One task per session; `/clear` between unrelated tasks.
- Read summaries, never raw logs; test tools print failures only.
- Secrets (such as the Jev key) go in `.env.local` or `.claude/settings.local.json`, both gitignored.
