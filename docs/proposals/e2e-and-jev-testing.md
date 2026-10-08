# End-to-end testing and Jev simulations: a smaller, smarter plan (product owner, 4 October 2026)

For the owner's approval. Owner: "strategise on the e2e testing and simulations using Jev; it can be 50–200, not
some tens of thousands."


> **Owner's clarification (6 October 2026, `docs/decisions.md`):** the Jev test exists to **tap every button at random through the real screens and check that every flow ends rationally**: no dead ends, no stuck screens, no game that carries on after it should have ended, no Back or Home that goes nowhere. Weeding out breakage in game play, flow and navigation is job 1 for layers 3 and 4 below. Playing people realistically and rating confusing screens are secondary and must never shrink the random coverage: every button on every screen gets pressed, including quiet buttons, the menu, Back, Home, close-and-reopen, mid-round taps and taps that make no sense for that moment.

> **Owner's direction (8 October 2026):** Jev is the **engine** for simulated play, used as much as possible because it is
> cheap and fast: it plays the game extensively through the real screens, covering game play, the rules and every flow and
> navigation path, so that every potential path is tested and verified. The counts below (50 per release, 200 a week, 50 with
> Jev) are no longer the ceiling; they are the floor. How many evenings run is set by the weekly cap and by a coverage map:
> every screen, every button on it, every rule branch and every path between screens, each marked reached or not reached in
> the report. Scripts guarantee the coverage; Jev supplies the human-like and odd choices along the way. Confusion flags stay.

## Why change
- Today's simulations play **100,000 Tambola games inside the rules engine** (no screens), plus 2,000 and 300 on every
  test run. They prove the maths, but they have never found the kind of problem the owner found by playing:
  "Badminton under Cricket", "the game carried on after we caught the impostor". Those live in **screens, words and
  flow**, which engine-only games never see.
- Browser tests today check one scenario at a time. Nothing plays a **whole evening through the real screens** the way a
  family does, with mistakes, interruptions and odd choices.
- So: fewer games, but each one a real evening through the real app, checked at every step, with Jev playing the
  people.

## The four layers (what each one is for)
| Layer | What it is | How many | When | Finds |
|---|---|---|---|---|
| 1. Rule tests and properties | Today's rule tests; property checks ("points always add up") | As now; property checks at the tool's normal run counts | Every push | Rule and money bugs |
| 2. Golden journeys | A fixed set of complete evenings through the real app, each covering a path: per game about 12 (Impostor list below) | ~12 per game, both phones | Every release; journey 1 on every push | Broken flows, wrong words on screen |
| 3. Screen simulations | A simulated host plays full evenings through the real app in a hidden browser, pressing **every button on every screen at random** (main, quiet, menu, Back, Home, close-and-reopen, taps that make no sense right then), with checks after every step | **50 per release, 200 a week** | Release; weekly | Dead ends, stuck screens, secrets showing, layout breaks, crashes |
| 4. Jev people | Jev plays the people in layer 3 (a slow grandparent, an over-eager child, a distracted host, a group that keeps tying) and rates how obvious each screen's next step is | **50 of the weekly 200** | Weekly | Confusing screens, content that doesn't make sense |
The mass engine simulation drops from 100,000 to **200** games a week (properties already cover the maths), and the
2,000 and 300 on every test run drop to **50**, so ordinary runs get faster too.

## Layer 2: Impostor's golden journeys (about 12)
1. Defaults, 4 players, 3 rounds: caught, escaped, tie; end the evening; summary.
2. Hard + Timer + Score: the impostor never starts; the timer runs out; scoreboard.
3. Last-chance guess on: right and wrong guesses; Undo of a verdict.
4. "Don't know this word?" and "Deal again with a new word".
5. Close and reopen at every step (deal, clues, talk, countdown, picker, result, summary).
6. "How to play" and a practice round, opened on request.
7. 12 players, long names, landscape.
8. 320 × 568 with Larger text and tap-to-show.
9. Late joiner and leaver between rounds.
10. "Oops, keep playing", Share, History, "Play something else" into Tambola.
11. Out of words in a category ("Allow repeats").
12. Screen reader announcements on one full round.

## Layer 3: screen simulations, how they work
- A hidden browser opens the preview build with a fixed seed (the test hooks already in the spec).
- At each screen the simulated host lists the buttons on screen and picks one (scripted rules: mostly the main button,
  sometimes a quiet one, sometimes the menu, sometimes "close the app and reopen"). Over a run, **every button on every screen is
  pressed at least once**, and the report says which were never reached (owner, 6 October).
- **After every step, the same checks:** exactly one main button (or none where the spec says); no secret word in the
  page outside the hold; nothing off screen or overlapping; no error in the browser console; the screen matches a known
  screen of the spec; the evening can always reach "Next round" or the summary (no dead end).
- A failing evening saves its seed, the steps and a screenshot of each step, and becomes a permanent test.
- 50 evenings with a mix of sizes (360, 390, 812 × 375), choices and player counts take about 10 minutes on GitHub's
  free machines in 4 parallel jobs.

## Layer 4: what Jev does (and doesn't)
Jev answers typed questions with probabilities; it cannot write text and is weak at counting, so it never judges facts
or rules (PLT-112). It does two jobs:
1. **Plays the people.** In 50 weekly evenings, each persona chooses among the on-screen buttons the way that person
   would (the grandparent taps slowly and sometimes the wrong thing, the child taps Back, the distracted host leaves
   the app mid-round). This reaches odd paths scripted rules don't think of.
2. **Rates confusion.** On each new screen, Jev is asked "Which button would you press next?" with the screen's words.
   If Jev's most likely choice is not the screen's main button, with high confidence, the screen is **flagged as
   confusing** in the report, with a screenshot, for the product owner and UX designer. (The old "Show the word" step
   after a correct catch is exactly the kind of screen this would have flagged.)
3. **Optional content check (on request, not weekly):** for each word in a list, "Does this word belong in this
   category?" and "Would most families know it?" (yes/no with probability), as a cheap first filter before real
   readers. 291 words × 2 questions ≈ 600 decisions.

**Two additions from a published two-model pattern the owner shared (8 October 2026; for the owner's approval, built with
layer 4):**
1. **Every Jev question offers "uncertain"** as one of its options, so Jev is never forced to pick a button it has no view on;
   a forced pick looks confident and would wrongly pass or flag a screen. (Adds to PLT-110 and PLT-123.)
2. **One config file holds every Jev question and its confidence thresholds**, and every decision is logged with its
   confidence. Three bands, fixed once: **high** (above 0.8) the run acts on it; **medium** (0.5 to 0.8) the screen goes in the
   report for the product owner to look at; **low** (below 0.5, or "uncertain") the screen is listed as "Jev unsure" and a
   scripted player takes the tap. Today the 0.65 on the Talk screen (M27) was read by hand; with fixed bands the weekly line
   is the same every week. (Adds to PLT-110 and the report format.)
The tester confirms first whether Jev's API also offers score (low, medium, high) and true/false questions, as the pattern
claims; if so, the optional content check uses true/false. Not taken from that pattern: its "Jev, then Opus, then Jev"
drafting loop (we never let Jev judge facts or rules, PLT-112), its plugin install (our client calls the API directly) and
its email and calendar workflow.

**Budget:** about 50 evenings × 30 decisions = 1,500 Jev decisions a week, well inside the 20,000 weekly cap; no
paid service ($0 rule).

## What the owner sees
One short weekly line in the report: "200 evenings played (50 with Jev people): 0 dead ends, 0 secrets shown, 2 screens
flagged confusing (screenshots), 1 layout break at 812 × 375 (replay saved)". Flags go to the product owner, who turns
real problems into fixes; nothing is added to a batch that is already being built.

## What changes (for the orchestrator, once approved)
- Tester: golden journeys for Impostor (layer 2); the screen-simulation runner (layer 3) reusing the existing simulated
  player (`tests/sim/player.ts`) and Jev client (`tests/sim/jev.ts`); smaller counts in `weekly.yml` and `npm test`.
- Specs: PLT-116's "for example 100,000 games" becomes 200; new PLT scenarios for layer 3 and layer 4 (written by the
  product owner under `docs/spec-rules.md`).
- No app changes, except that the test hooks in the Impostor spec are already required.
