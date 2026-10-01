# Handover: start here

## Now: status and what's next (product owner, updated 1 October 2026, after the Phase 2 and Phase 7 review)
A new orchestrator session starts here: read this section, then work through **"Next, in order"** from the
top, one item at a time, reporting to the owner after each. The product owner keeps this section
current; instructions live here, not in chat. History from Phase 0 and 1a is further down.

### Status (1 October, product owner review after the run that ended with report 357b824)
| Item | State |
|---|---|
| Tester's report 357b824 on app a9ed2c3 | GREEN on the tester's machine for 1a.1 fixes, money and 1b review fixes, play-test fixes, Phase 2 and Phase 7 |
| Automation ("Check and publish") | **Green again** (a test scanned before the app had started; fixed, checks as strict as before) |
| Live preview | **Up to date: phone tickets and "Report a problem" are live** |
| Product owner review of what is live (money, 1b and play-test fixes) | Matches the scenarios and the owner's 30 September decisions: payout rows with "Settle with host" and "Settle with players", "Session tally" and "Play again" fixed at the bottom, compact tally with "Settle up", the session line, "Close Early Five" as the main button with the screen dimmed. Two small findings below. |
| Product owner review of Phase 2 and Phase 7 | **Done** (1 October, live, two browser tabs as host and player): matches the scenarios; small findings in step 2 below |
| Extended testing | Started (122da49, 23d3f41, e289eb8) while automation was red |
| Phase 6 (connected mode), new games | On hold |

### Next, in order (for the orchestrator)
0. ~~Make automation green and publish~~ **done** (1 October). Keep the rule: **a test report is GREEN only if the
   automation run for that commit is green too**; the report names that run.
1. ~~Product owner review of Phase 2 and Phase 7~~ **done.** Works as specified: hand-out ("Ticket 1 → Riya (1 of 2)",
   QR, 20-character code, "0 of 4 handed out", who's waiting, paper fallback); a valid ticket on the player's
   phone; both tickets together with no scrolling and "One at a time"; quick mark ("✓ 54 marked on ticket 1",
   "11: not on your tickets", thumbnails with filled cells); the claim screen (big QR, top row outlined);
   crossing out prizes; Larger text; the host's "Scan a claim" falling back to the ticket number when there is no
   camera, with only this game's prizes; "Top Line: ✗ Bogey: 12, 22, 30, 40, 80 not called", credited to Riya,
   ticket out; "Ticket 1 is out" refused calmly; "Report a problem" on host and player, with the preview of what is
   sent, held until the game ends, kept on the phone.
2. **Small fixes from the product owner's reviews** (owner-approved scenarios, no new behaviour):
   - Hand-out screen: "Next ticket" / "Start calling" sits mid-screen; fix it at the bottom like every other step
     (TAM-181).
   - Problem reports show "App version: 0.0.0+059aaaa"; give the app a real version number (for example 1.0.0)
     so reports can be matched to a release (PLT-200).
   - Optional polish: the quick-mark pad could also show which numbers the player has marked (the design sketch
     did); TAM-192 does not require it, so only if cheap.
   - TAM-198 says the called number stays bright while the screen is dimmed; live, the number is dimmed too.
   - Payout screen at 390 × 844 with 6 players: "Settle with host" and "Settle with players" sit below the
     bottom, so the host scrolls to find them. Keep them reachable without scrolling (for example in the fixed
     bottom area with "Session tally" and "Play again", or by folding the per-person rows).
3. **Answers to the open report questions** (report 357b824):
   - **Q1, money in reports (owner, 1 October):** reports **include** the game's money numbers (contribution per
     ticket, prize amounts, payouts), with names still replaced by "Player 1", "Player 2"; the host still sees
     exactly what is sent. Change PLT-201 ("never includes player names or session names") and PLT-204 (money
     bugs can be replayed from a report).
   - **Q2, free text:** no change. Only player names are replaced; the host sees exactly what is sent (PLT-201).
   - **Q3, sorting (product owner):** bug = something went wrong ("crash", "error", "wrong", "didn't work",
     "stuck"); confusion = didn't know how ("how do I", "where is", "can't find", "confusing", "didn't
     understand"); idea = a wish ("add", "wish", "would be nice", "could you", "idea"); otherwise noise (PLT-205).
   - **Q4, stub reports (product owner):** yes, list them under "Reports waiting to send" with the note "Kept on
     this phone: sending isn't set up yet" (PLT-202, PLT-209).
4. **Owner check on two real Android phones (owner's task):** scan a ticket QR with a phone camera, mark a few
   numbers, show a claim QR and scan it with the host phone. This is the one path the review could not try (no
   camera in the review browser). Check the player's phone shows their **name and the game's start time** (a
   typed code carries neither, which is expected), and that the verdict appears within 2 seconds.
5. **Extended testing** (signed off; weekly Jev cap 20,000 decisions) continues once 0 is done.

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

## Phase 7: Report a problem (Build workspace, 29 September 2026)

- **Stub destination, must be replaced (PLT-208).** "Send report" goes to a stub for now: the report is kept on the
  phone (`pgn.reports.kept` in the phone's storage) and nothing leaves it. A real free, no-account destination is
  required **before any wider public release** (owner, 2026-09-28). The one place to change is `stubSend` in
  `src/app/reports.ts` (marked `TODO(PLT-208)`); the waiting list, retries and "one send at a time" already work
  for a real destination.
- What a report holds, and what it never holds, is worked out in `src/engine/reports.ts` (`makeReport`,
  `makePlayerReport`, `addSeeds`, `reportText`, `readReport`, `sortReports`). Each game takes names and money out of
  its own setup and moves with the optional `GameRules.forReport` (Tambola: `forReport` in `rules/rules.ts`).
- Where it shows: home, the calling screen's Menu, the payout screen, the player's ticket Menu; after an
  unexpected error, a calm message offers a report. Waiting reports: Tambola → Settings → "Reports waiting to send".
- Tests use a stand-in, `window.__pgnSendReport(text)`, in place of the stub; the app never defines it.
