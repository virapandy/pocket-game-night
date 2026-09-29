# Handover: start here

## Now: status and what's next (product owner, updated 29 September 2026)
The orchestrator works through **"Next, in order"** from the top. The product owner keeps this section
current; instructions live here, not in chat. History from Phase 0 and 1a is further down.

### Status
| Item | State |
|---|---|
| Phase 1a and 1a.1 (Tambola, paper tickets, redesign, money back per ticket) | **Green and live** at https://virapandy.github.io/pocket-game-night/ |
| Phase 1b (sessions, tally and settle up, late joiners, voice, auto-call, dark mode, history tools) | Tests written (006cfea); **the coder is building** |
| Product owner review of the live 1a.1 build | Done: 4 findings in `docs/games/tambola/review-2026-09-29.md` |
| Family play-test on Android | **Not done yet**: owner's task; 1a.1 is live, so it can happen now (`docs/playtest-checklist.md`) |
| Phase 2, Phase 7, extended testing | **All three signed off by the owner** (29 September; packs in `docs/signoff.md`). Phase 2 design: `docs/games/tambola/ux-phone-tickets.md` |
| Phase 6 (connected mode), new games | On hold |

### Next, in order (for the orchestrator)
1. **Finish Phase 1b** as now running; report green to the owner.
2. **Fix the 1a.1 review findings** in `docs/games/tambola/review-2026-09-29.md`. The tester first adds or
   changes checks from the scenarios named there: TAM-082 (Full House takes every rounding difference;
   finding 1), TAM-138 and TAM-123 (the number stays visible while a win is shown; finding 2), TAM-125
   (the undo toast also never covers the prize chips: owner-approved change; finding 3). Then the coder fixes.
   Finding 4 is minor and may go in the same round.
3. **Owner play-test.** Tell the owner the play-test can start (checklist above). The product owner turns
   what the owner reports into changes here.
4. **Phase 2 (phone tickets): signed off by the owner (29 September).** The tester applies the product owner's
   verdicts (including TAM-050 reworded, TAM-133 moved to Phase 6, TAM-179 changed) **and** the additions in
   `docs/games/tambola/changes-2026-09-29-phone-tickets.md` (all tickets visible together, switch to one at a
   time, quick mark, claim screen showing the ticket, tickets from one sheet: TAM-122, TAM-173, TAM-191 to
   TAM-194), then writes tests; the coder builds to `docs/games/tambola/ux-phone-tickets.md`.
5. **Phase 7 ("Report a problem", stub destination)**: **signed off** (29 September). The tester marks PLT-200 to
   PLT-209 approved (PLT-208 with the stub wording) and writes tests when this step comes up.
6. **Extended testing (simulations, mutation testing, Android emulator, Jev)**: **signed off** (29 September),
   weekly Jev cap **20,000 decisions**. The tester marks PLT-110 to PLT-123 approved (PLT-118 and PLT-119 with
   the product owner's wording) and sets the cap in PLT-113.

---

# History: Phase 0 and 1a (28 September 2026)

## Status at the start of Phase 1a
| Item | State |
|---|---|
| Architecture, principles, two-workspace split | Decided (`CLAUDE.md`) |
| Tambola rules, journeys, UX guidelines, lifecycle | Written and cross-checked (`docs/games/tambola/`, `docs/ux-guidelines.md`) |
| Owner decisions | All made (`docs/decisions.md`) |
| Scenarios | Every phase has scenarios: 1a 100 (**all approved**, including TAM-144 and TAM-145 added on 28 September), 1b 18, 2 36, 2.5 14, 6 11, 7 6 (drafts until each phase comes up) |
| Rhyme catalog | `docs/games/tambola/rhymes.md` and `rhymes.csv` (409 rhymes, English and Hindi, 4–6 per number); **approved by the owner** |
| Tests | **Phase 1a tests written and pushed** (see "Phase 1a tests ready" at the end). They fail until Phase 1a is built |
| Code | Phase 0 built (engine, app shell, automation). **Next: Phase 1a**, against the tests |

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
   - GitHub Actions: type-check, build and all tests on every push; GitHub Pages link updated when green (owner decision)
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
   now (approved). Selection rules are below.

Then wait for tests: the Test workspace pushes them after the owner approves Phase 1a, and you build
against them (`reports/latest.md` says what's failing).

## Rhymes: how they are chosen
- Each number has several rhymes, in English and Hindi, with style tags (classic, Indian, Bollywood,
  cricket, festival, playful).
- On each call, one rhyme is picked **at random from the ones allowed by the host's settings**,
  with Indian-reference styles twice as likely as classic or playful ones (TAM-158)
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

## How Phase 1a was started (history)
> Read `docs/handover.md` and follow "Your first tasks, in order". Start with task 1, then plan
> Phase 0 and show me the plan in plain English before building. Remember: you never write or
> run tests; type-check, push, and read `reports/latest.md`.

(Phase 0 is done. From now on, open Claude Code in the workspace folder and ask the orchestrator
for the next task. See "How we work" in `CLAUDE.md`.)

## Phase 0 built (Build workspace, 28 September 2026)
For the Test workspace:
- `package.json` scripts are ready: `npm test` expects `tests/vitest.config.ts`, and `npm run test:browser`
  expects `tests/playwright.config.ts`. Both configs are yours to write. Automation runs each layer
  as soon as its config exists (`.github/workflows/ci.yml`).
- The app is served under `/pocket-game-night/` everywhere: `npm run build && npm run preview` serves
  http://localhost:4173/pocket-game-night/. The home screen shows a "Tambola" button, which opens a screen with the heading "Tambola".
- The engine's public entry is `src/engine/index.ts`; see `src/engine/CLAUDE.md` "What is here" for the
  contract shape the shared contract suite can test against. Tambola's rules module is not written yet:
  it waits for the approved Phase 1a tests.
- Live link (after the first green run): https://virapandy.github.io/pocket-game-night/
- Rhyme pack built: `content/tambola/rhymes.json` (format 1, 409 rhymes, fields `n`, `lang`, `style`,
  `familyFriendly`, `text`, plus `styleWeights`). Rebuilt from the catalog with `npm run build:rhymes`.
  TAM-150, TAM-156 and TAM-157 can be tested against this file.

## Phase 1a tests ready (Test workspace, 28 September 2026)
For the Build workspace. Every approved Phase 1a scenario now has tests; build until they pass.

**Read first**
1. `reports/latest.md`: what passes now, what fails, and requests.
2. `tests/games/tambola/README.md`: the names and shapes the rule tests import from
   `src/games/tambola/index.ts` (`tambolaRules`, `tambolaDefaults`, `suggestTiers`, `planPrizes`,
   `pickRhyme`, `rules` on the registration), the moves, the views and the summary.
3. `tests/browser/README.md`: the button words, field labels and `data-testid`s the browser tests look for.

**Two owner decisions made while writing the tests** (both in `docs/decisions.md`)
- **TAM-145: prizes are closed by hand, and the host ends the game.** After an accepted claim the tier stays
  open ("Add another winner" / "Close Top Line"); Next number waits until it is closed; closing the last
  Full House does not end the game; the host taps "End game and show payouts". TAM-075 changed to match.
  `src/games/tambola/CLAUDE.md` still says the game ends at Full House: please update it.
- **TAM-144: no prize won means contributions are handed back**, as with Discard.

**Where things stand**
| Layer | Command | Now |
|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 112 pass (engine, rhyme pack); 131 wait for Tambola's rules |
| Browser (Android and iPhone sizes) | `npm run build && npm run test:browser` | 5 pass (home, install, offline, fast first load); the rest wait for Phase 1a screens |

The rule tests were checked against a throwaway Tambola written only for that purpose (never committed):
all pass against it, so a failure means the app differs from the tests. Automation stops at the first failing
layer, so the browser tests run there once the rule tests pass. The live link updates only when everything is green.

**Suggested order:** rules module → setup screens → calling → claim check and closing tiers → end, discard,
play again → saving, resume, history → usability. Build only Phase 1a.

**Paste this into Claude Code in VS Code**
> Pull, then read `docs/handover.md` ("Phase 1a tests ready"), `reports/latest.md`,
> `tests/games/tambola/README.md` and `tests/browser/README.md`. Build Phase 1a in the suggested order,
> starting with Tambola's rules module. Type-check and push after each step. If a test looks wrong, write it
> in `docs/test-questions.md` instead of working around it. Explain each change to me in plain English.
