# tests/sims: screen simulations (layers 3 and 4)

From `docs/proposals/e2e-and-jev-testing.md` (owner approved 4 October 2026, "for 200"). A simulated host plays whole
Impostor evenings through the real app (the preview build, `npm run build`) in a hidden browser, choosing among the
buttons on screen, and checks after every step. Not part of `npm run test:browser`.

| File | What it is |
|---|---|
| `impostor-runner.ts` | Plays one evening: names each screen from the spec's test ids and headings, lists the buttons on screen, picks one (scripted host: mostly the main button, sometimes a quiet button, the menu, closing and reopening the app, hiding the page; or a Jev persona), and checks after every step: at most one main button and none where IMP-080 says; no secret word, other name, hint or role in the page outside the hold (IMP-013; words that are part of the app itself, such as "Cover" in `privacy-cover`, are left out); no sideways scrolling, room screens that do not scroll, the main button wholly on screen, nothing drawn over anything else (IMP-081); no console error; a known screen; never a dead end (nothing to tap, or the same step 25 times). A failing evening saves `tests/replays/screen/impostor-<seed>.json` and its last 40 screenshots in `reports/sim/screen/<seed>/`. Since 4 October 2026 (evening 128 of weekly run 37189752105): the app's clock is frozen once the evening starts and moves only when the runner moves it (50 ms a step, the waits, the 550 ms hold), so a seed plays the same on any machine; a toast lying over the button the host wants is waited out (5.1 s) before the tap |
| `impostor-evenings.sim.ts` | `SIM_EVENINGS` evenings, one test each, seeds from `SIM_RUN`; the first `SIM_JEV_EVENINGS` played by Jev personas (slow grandparent, over-eager child, distracted host, group that keeps tying) when a key is present |
| `summary.mjs` | The owner's line: "N evenings played (N with Jev people): N dead ends, N secrets shown, N screens flagged confusing, N layout breaks", from `reports/sim/screen/*.json`, into `reports/sim/screen-summary.md` |
| `../browser/impostor-sim-replays.spec.ts` | Replays every saved failing evening step by step, on both phones, in the complete run; once the saved steps run out (an evening saved at a crash), the scripted host carries on so a fixed evening can reach its end. A replay of a known, still-open app bug carries `expectedToFail` {scenario, platform, project, reason} and is expected to fail there until the fix; then the field is removed |

Each evening mixes a size (360 × 640, 390 × 844, 812 × 375), 3 to 12 players (sometimes 16-character names), Easy or
Hard, Free flow or Timer, Score, the last-chance guess, a practice round and Larger text, from its seed.

Jev (layer 4) chooses for the persona on screens with a real choice, and on each new screen of an evening answers
"Which button would you press next?"; a screen is flagged confusing when its confident answer (0.6 or more) is not the
main button, with a screenshot. About 30 Jev decisions an evening (`JEV_PER_EVENING`), at most `JEV_DECISIONS` per job
(default 400), inside the weekly cap of 20,000 (`tests/sim/jev.ts`). Jev never judges facts or rules. Without a key,
the persona evenings are played by the scripted host and the summary counts 0 with Jev people.

Run (GitHub, the weekly workflow; locally only a few, at most 3 workers):
```
npm run build
SIM_EVENINGS=200 SIM_JEV_EVENINGS=50 SIM_RUN=w41 npx playwright test --config tests/playwright.sims.config.ts --shard=1/8 --workers=2
node tests/sims/summary.mjs
```
