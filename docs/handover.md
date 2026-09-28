# Handover: start here (Build workspace, VS Code)

28 September 2026. Everything designed so far, and what to build first.

## Status
| Item | State |
|---|---|
| Architecture, principles, two-workspace split | Decided (`CLAUDE.md`) |
| Tambola rules, journeys, UX guidelines, lifecycle | Written and cross-checked (`docs/games/tambola/`, `docs/ux-guidelines.md`) |
| Owner decisions | All made (`docs/decisions.md`) |
| Scenarios | 126 Tambola + 21 platform, drafted and cross-checked; **Phase 1a approved** (97 scenarios); 1b and 2 still drafts |
| Rhyme catalog | `docs/games/tambola/rhymes.md` and `rhymes.csv` (402 rhymes, English and Hindi, 4–6 per number); **needs a human review before shipping** |
| Tests | None yet. The Test workspace writes them after approval and after Phase 0 exists |
| Code | None yet. **Phase 0 can start now**; it doesn't depend on approval |

## Read in this order
1. `CLAUDE.md` (root), then `src/CLAUDE.md` and `src/engine/CLAUDE.md`
2. `docs/games/tambola/guide.md`, including the **Contract check** section
3. `docs/games/tambola/journeys.md`
4. `docs/ux-guidelines.md`
5. `specs/tambola/README.md` and `specs/platform/README.md` (phases and scenario map)
6. `reports/latest.md` (requests to the Build workspace)

## Your first tasks, in order
1. **Update `src/games/tambola/CLAUDE.md`.** Its "House rules: waiting for the owner's decisions"
   section is out of date. Replace it with the decided rules from `specs/tambola/04-house-rules.md`,
   and add: paper tickets in Phase 1a (the app makes no tickets until Phase 2); prizes from
   `specs/tambola/08-prizes.md`; rhymes chosen at random (below).
2. **Phase 0: the foundation.** Done when an empty Tambola screen opens offline on the owner's
   phone from a preview link, and a first test written by the Test workspace passes in automation.
   - `package.json` with TypeScript, Vite + React, `vite-plugin-pwa`, Vitest, fast-check, Playwright
   - Test configs live in `tests/` (`tests/vitest.config.ts`, `tests/playwright.config.ts`);
     scripts: `typecheck`, `build`, `test`, `test:browser`
   - Installable web app: precache the whole app shell on first visit; updates offered only on the
     home screen, never mid-game (`registerType: 'prompt'`)
   - GitHub Actions: type-check, build and all tests on every push; Cloudflare Pages preview link per push
   - A dependency-boundary check for the rules in `src/CLAUDE.md`
   - Fill in the **Commands** section of the root `CLAUDE.md` (it will ask the owner)
3. **The engine skeleton** (`src/engine/`): the seven-question contract, seeded randomness, move
   records, replay and undo, plus these points from the Tambola contract check:
   - every move record carries a time (the 5-second undo of a call needs it; rules never read the clock)
   - viewers: host, **room**, and each player
   - moves carry details (pattern, player or ticket, numbers read out)
   - player-only state (ticket marks) stays outside the host's game state
   - saved games carry a **format version** from the first release (PLT-014)
   - every finished game with money records what each person paid and won (PLT-021)
4. **Rhyme content pack.** Convert `docs/games/tambola/rhymes.csv` into `content/tambola/`
   once the owner's reviewer has marked it approved. Selection rules are below.

Then wait for tests: the Test workspace pushes them after the owner approves Phase 1a, and you build
against them (`reports/latest.md` says what's failing).

## Rhymes: how they are chosen
- Each number has several rhymes, in English and Hindi, with style tags (classic, Indian, Bollywood,
  cricket, festival, playful).
- On each call, one rhyme is picked **at random from the ones allowed by the host's settings**
  (language: English, Hindi or both; family-friendly filter on by default).
- The pick comes from the game's seeded random generator, never `Math.random()`, so a replay shows
  the same rhymes (TAM-073).
- Scenarios: `specs/tambola/11-rhymes.md`.

## Phase 1a scope (build this, nothing more)
Scenarios marked `Phase: Phase 1a` in `specs/tambola/` and `specs/platform/`. In short:
setup with paper tickets and the prize pool · calling with rhymes · the host board and room view ·
checking claims from numbers read out · ties, bogeys, late claims · undo of claims and of a call within
5 seconds · end, discard, play again · resume and history view · the key usability rules.

**Not yet:** sessions and tally, late joiners, phone voice and auto-call, dark mode (Phase 1b);
tickets on phones and QR codes (Phase 2); Jev; any server or relay.

## Paste this into Claude Code in VS Code to begin
> Read `docs/handover.md` and follow "Your first tasks, in order". Start with task 1, then plan
> Phase 0 and show me the plan in plain English before building. Remember: you never write or
> run tests; type-check, push, and read `reports/latest.md`.
