# Pocket Game Night

An installable, offline-capable web app that helps friends and families run in-person party and
card games from one host phone. The phone replaces paper and bookkeeping, not the social ritual.
First game: **Tambola**. Games two to four follow quickly on the same game contract.

The owner is not a developer. The owner approves **behaviour** (scenarios in `specs/`, preview
links), never code. Explain every change in plain English.

## Two workspaces: read this first

| Workspace | Folder | Tool | May edit | May run |
|---|---|---|---|---|
| **Build** | `pocket-game-night/` | Claude Code in VS Code | `src/`, `content/`, root config files, `.github/` | type-check, build, lint |
| **Test** | `pocket-game-night-testing/` | Claude desktop app | `tests/`, `specs/`, `reports/` | every test, simulations, iPhone Simulator, browser checks |

- Both workspaces may edit `docs/`.
- Root `CLAUDE.md`, `.claude/` and `.githooks/` are project rules: every edit asks the owner first.
- The Build workspace never writes or runs tests. The Test workspace never edits app code.
- This is enforced by `.claude/hooks/role-guard.mjs` (edits, test commands, stray file changes)
  and `.githooks/pre-commit` (commits). Never work around a block. Say what is needed instead:
  the Test side writes it in `reports/latest.md`; the Build side writes it in `docs/test-questions.md`.
- The two folders are separate clones of github.com/virapandy/pocket-game-night, so tests always
  run on pushed code, never on half-finished edits.

## The loop

1. **Test:** draft plain-English scenarios in `specs/`; the owner approves them.
2. **Test:** write failing tests from the approved scenarios in `tests/`; push.
3. **Build:** pull; write code so the tests pass (read them, never edit or run them); type-check; push.
4. **Test:** pull; run the tests; write `reports/latest.md` naming the commit tested; push.
5. **Build:** pull; read `reports/latest.md`; fix. Repeat 3–5 until green.
6. **Automation:** runs every test layer on push and publishes a preview link; the owner plays it.

Git: one branch, `main`. `git pull --rebase` before starting and before every push. Small commits.

## Layout

```
CLAUDE.md               this index
.claude/                settings.json (hooks), hooks/role-guard.mjs
.githooks/pre-commit    blocks commits that cross the build/test line
docs/                   decisions.md (owner decisions), test-questions.md
src/                    BUILD: app code
  app/                  host app shell; assembles everything; nothing imports it
  engine/               game contract, referee, seeds, move records, undo, interfaces
  games/tambola/        one self-contained game slice (rules/, ui/, index.ts)
content/tambola/        BUILD: rhymes and calls per language (data, not code)
specs/                  TEST: plain-English scenarios the owner approves
tests/                  TEST: contract/, games/<game>/, replays/, browser/, sim/
reports/latest.md       TEST: the test report the Build workspace reads
```

`src/blocks/` (shared building blocks) and `src/adapters/` are created only when a real need
appears (Phase 2.5 and later).

## Principles

- **The room comes first.** Calling aloud, shouting claims and checking tickets together are the
  game. Digital shortcuts are optional, off by default, and come with a short warning to the host.
- **One phone always works**, with no internet.
- **Every game follows one contract:** setup, legal moves, apply, view, game over, invariants, undo.
  Rules are pure: all randomness from seeds, no screen or network code. The host phone is the referee.
- **Secrets get their own seeds.** The Tambola draw seed never leaves the host phone; each ticket has
  its own seed, so a player's phone can rebuild only its own ticket.
- **Generalise only when two real games need it.**
- **Complexity budget.** Before adding a framework, service, dependency or abstraction, state: the
  problem it solves now, why something simpler cannot, what it costs to maintain, and how we will
  know it was worth it. No paid service without the owner's explicit approval.
- **$0 per month.** Free hosting, standard GitHub runners only.
- **The repo is public.** Never commit secrets, API keys, player data, or the private research brief.
- **Jev is optional everywhere.** Jev (TypeSafe AI) returns typed decisions with probabilities; it
  cannot write text and is unreliable at counting. Code computes facts, Jev judges behaviour, and
  the rules engine is always the referee.
- **Tests are never weakened, skipped or deleted** without the owner's explicit approval.

## Stack (Phase 0 defaults)

TypeScript · React + Vite as an installable web app · Vitest + fast-check · Playwright · Stryker ·
Cloudflare Pages · GitHub Actions.

- Test configs live in `tests/` (for example `tests/vitest.config.ts`); `package.json` scripts point there.
- Dependencies are added by the Build workspace; the Test workspace requests test tooling in
  `reports/latest.md`. The Test workspace installs with `npm ci`, never `npm install`.

## Commands

Not set up yet (Phase 0). When `package.json` exists, list them here:
- Build: `npm run typecheck`, `npm run build`
- Test: `npm test`, plus simulation and browser commands

## Habits

- One task per session; `/clear` between unrelated tasks.
- Read summaries, never raw logs; test tools print failures only.
- Secrets (such as the Jev key) go in `.env.local` or `.claude/settings.local.json`, both gitignored.
