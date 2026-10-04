# UX evaluation playbook

Owner's instruction, 1 October 2026: the **UX designer** evaluates comprehensively every time; the **product owner**
and the UX designer talk it through; the product owner consolidates the final recommendations into
`docs/handover.md`. Built from a research pass on how UX designers evaluate and decide (sources at the end).
`docs/ux-guidelines.md` holds *what* good looks like; this doc is *how* we check. **[Inference]** marks our own reasoning.

## 1. The two roles
| | UX designer | Product owner |
|---|---|---|
| Does | Evaluates the live preview with every method below; brings evidence; offers 2–3 options with a recommendation | Sets the scope and goal; challenges findings; weighs them against decisions, scenarios and the roadmap; decides or asks the owner |
| Writes | Nothing (read only); reports back in the chat | `docs/games/<game>/ux-review-<date>.md`, `docs/decisions.md`, `docs/ux-guidelines.md`, and the **one consolidated UX item in `docs/handover.md`** |
| Never | Edits files, talks to the coder or tester, decides alone | Passes on raw findings without consolidating them |

## 2. How the two talk (every review)
1. **Brief (product owner):** the goal, the screens and flows in scope, the preview commit, anything the owner noticed,
   and the decisions already made in that area (so they aren't reopened without new evidence).
2. **Evaluate (UX designer):** run the methods in section 3 in separate passes and report in the format of section 5.
3. **Challenge (product owner):** reply in the same conversation, so the UX designer keeps its context. For each
   finding: Does it conflict with a decision or an approved scenario? Is the evidence measured or guessed? Is the
   severity right for real family play? Is there a simpler fix? What would make it wrong? Ask for anything missing
   (an untested state, a persona, a screen size).
4. **Answer and recheck (UX designer):** re-test where asked, change a rating or recommendation only on evidence,
   and drop findings that don't hold. Disagreement is argued **once** with evidence and then logged.
5. **Decide (product owner):** decide what is the product owner's call; take behaviour changes, money or rules, new
   dependencies and anything the two still disagree on to the owner as plain-English choices.
6. **Consolidate (product owner):** write the review doc and decisions, then **merge** the agreed changes into the
   single "UX fixes" item in the handover: one list across all reviews, de-duplicated, in priority order, each line
   naming its scenario. Superseded lines are removed, not left beside the new ones.
7. **Close the loop:** after the next green build, the UX designer re-checks every changed line: fixed, still open,
   or worse. The product owner updates the handover.

A decision is reopened only on new evidence (a play-test, a measurement), never on taste.

## 3. What a comprehensive evaluation covers
Each pass starts fresh and every finding needs evidence: a screenshot, a measurement or a line of code.

| # | Pass | What the UX designer does |
|---|---|---|
| 1 | **Learn** | Walk every flow in scope once without judging; draw the screen map (dead ends, traps, ways back) |
| 2 | **Tasks and personas** (cognitive walkthrough) | For each key task, ask at every step: will they try the right thing, notice the control, connect it to their goal, see that it worked? Once per persona: host with one hand busy, tipsy player, grandparent, child or low-literacy player, guest on a budget Android |
| 3 | **Task cost** | Taps, screens, words to read and decisions per task; any core action (next number, a verdict, a mark) that needs more than one tap or reading is a finding |
| 4 | **Heuristics** | Nielsen's 10, screen by screen: status, real-world match, control and undo, consistency, error prevention, recognition over recall, efficiency, minimalism, error recovery, help |
| 5 | **Hierarchy** | Squint test (blur the screenshot: the main action and the called number must still stand out); one main button per screen, always the next step (guideline 17a); equal choices look equal; related things grouped |
| 6 | **Consistency** | All screens side by side: button looks and positions, wording, icons, colours for state, spacing, host and player using the same words |
| 7 | **States** | A grid of screens × states, a screenshot per cell: first use, empty, partly filled, full or overflowing (90th call, long names, big pot, 3 tickets, Larger text), error, offline, resumed, storage lost, update waiting, permission refused (camera, wake lock). An unseen cell is itself a finding |
| 8 | **Mistakes and edges** | Double taps, back and swipe, refresh mid-game, rotate, hidden 10 minutes, undo after its window, claim after the end, two claims at once, bogey, QR that won't scan |
| 9 | **Words** | Verbs on buttons; confirmations name the action; no jargon (seed, sync, session); one word for one idea across the whole app (e.g. never "evening" in one game and "session" in another); short, plain, kid-readable; errors say what happened and what to do |
| 10 | **Accessibility** (WCAG 2.2, by inspection) | Contrast computed from styles; every target measured (44 px goal, 24 px minimum); 320 px wide with no sideways scrolling; 200% text; both orientations; greyscale and colour-blind check; tab order and visible focus not hidden under bars; every control named; auto-call pausable; reduced motion respected; the number and verdicts announced to screen readers |
| 11 | **Phone realities** | 320 × 568, 360 × 640, 390 × 844, 412 × 915, portrait and landscape; browser bars shown and hidden, and the home-screen app; the keyboard never hides a field or its button; one-handed reach of the main and destructive actions; interruptions (call, lock, app switch); 4× slower CPU |
| 12 | **Play and the room** | Mobile and multiplayer playability (clear goal, don't waste the player's time, ready for interruptions); seconds per round with eyes on a screen instead of the room; the room screen readable at 2–3 m; pace of a calling and claiming round; fairness people can see (random draw, visible calls, verdict says why, undo visible to the room); the app supports shouting and banter rather than replacing it |
| 12a | **What next? (player intentions)** | On every screen, list what a player may want to do next: carry on, **stop**, pause and come back later, go home, get help, undo, switch game. Each common intention must be **visible without opening a menu**; a common intention reachable only through a menu is a finding (severity 3). Judge this by what people want, not by what the spec says (added 4 October 2026 after the owner found that Impostor's round result offered only "Next round") |
| 13 | **Devil's advocate** | A last pass that tries to disprove each finding; drop or downgrade what doesn't survive |

## 4. Ratings
**Severity** (Nielsen 0–4, adapted to party play [Inference]):
| | Meaning |
|---|---|
| 4 | The game can be lost or wrongly decided, the room stalls, or a core task can't be done (including an accessibility blocker). Fix before anything else ships |
| 3 | A host or player fails or hesitates on a core task; a WCAG AA failure |
| 2 | Slower or confusing on a secondary task |
| 1 | Polish |

Rate on how often it happens, how hard it is to get past, whether it keeps happening, and how it makes the app look.
Also tag each finding: **confidence** (Measured, Observed or Predicted) and **who it hurts** (personas).

## 5. The UX designer's report
1. **Scope:** preview commit, screen sizes, personas, passes run, and what was **not** covered.
2. **Summary:** the top 3–5 problems in plain English and an overall verdict.
3. **Strengths to keep**, so a fix doesn't lose them.
4. **Findings:** ID · screen and state · problem · evidence · rule broken (heuristic, WCAG or guideline number) ·
   severity · confidence · who it hurts · recommendation with 1–2 alternatives · needs a play-test?
5. **State grid and accessibility checklist** results.
6. **Priorities:** quick wins, big bets, not worth it (impact against effort).
7. **Questions only real people can answer** (for the play-test checklist).
8. **Proposed guideline changes.**

## 6. What an AI review can't do
A study found a GPT-4o reviewer caught only about a fifth of what human experts found, with some invented problems,
and was weakest on user control and efficiency; single human evaluators also miss many problems. So: separate passes,
evidence for every finding, the devil's-advocate pass, and confidence tags. The AI can't judge the room's noise and
glare, fun, tipsy or older fingers, real phones, or whether people trust the draw: those go to
`docs/playtest-checklist.md`. Each play-test round aims for about 5 people across our personas (a family game night
with a grandparent and a child counts), thinking aloud where it doesn't spoil the game.

## Sources
[1] NN/g, 10 usability heuristics, https://www.nngroup.com/articles/ten-usability-heuristics/ ·
[2] NN/g, how to conduct a heuristic evaluation, https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/ ·
[3] NN/g, severity ratings, https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/ ·
[4] Cognitive walkthrough, https://en.wikipedia.org/wiki/Cognitive_walkthrough ·
[5] NN/g, cognitive walkthrough workshop, https://www.nngroup.com/articles/cognitive-walkthrough-workshop/ ·
[6] Desurvire and Wiberg, game approachability (GAP), https://link.springer.com/chapter/10.1007/978-3-319-15985-0_8 ·
[7] NN/g, empty states, https://www.nngroup.com/articles/empty-state-interface-design/ ·
[8] WCAG 2.2, https://www.w3.org/TR/WCAG22/ ·
[9] WCAG reflow, https://www.w3.org/WAI/WCAG21/Understanding/reflow.html ·
[10] VisualViewport, https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport ·
[11] Korhonen and Koivisto, playability heuristics for mobile games, https://www.semanticscholar.org/paper/Playability-heuristics-for-mobile-games-Korhonen-Koivisto/3fe3d3b293bc622a3083ec0128b9f9a46dd8ae47 ·
[12] Korhonen and Koivisto, mobile multiplayer, https://www.semanticscholar.org/paper/Playability-heuristics-for-mobile-multi-player-Korhonen-Koivisto/339edb3b68193857188ef34e3f2e08be15a482ba ·
[13] Desurvire and Wiberg, PLAY heuristics, https://link.springer.com/chapter/10.1007/978-3-642-02774-1_60 ·
[14] LLM heuristic evaluation study, https://arxiv.org/abs/2506.16345 ·
[15] Prompting strategies for LLM heuristic evaluation, https://cbsoft.sbc.org.br/2026/data/papers/sast/An%20Exploratory%20Study%20on%20Prompting%20Strategies%20for%20LLM-Assisted%20Heuristic%20Evaluation%20of%20Web%20User%20Interfaces.pdf ·
[16] NN/g, UX expert reviews, https://www.nngroup.com/articles/ux-expert-reviews/ ·
[17] NN/g, test with 5 users, https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/ ·
[18] NN/g, thinking aloud, https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/ ·
[19] NN/g, prioritisation methods, https://www.nngroup.com/articles/prioritization-methods/ ·
[20] NN/g, design critiques, https://www.nngroup.com/articles/design-critiques/ ·
[21] Disagree and commit, https://en.wikipedia.org/wiki/Disagree_and_commit

**Evidence notes:** the full Korhonen multiplayer and PLAY heuristic lists were behind paywalls; their categories come
from abstracts. Baymard's checklists are about online shops and aren't used.
