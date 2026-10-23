# Using Jev before code: a strategy (product owner, 23 October 2026)

**Status: approved by the owner on 23 October 2026, as written, with up to 15,000 decisions a week for the product side** (`docs/decisions.md`).

Owner, 23 October: the tester tests code; anything before code is the product side's, and Jev or any tool may be used
for it (`docs/decisions.md`). This proposal says **where Jev earns its place before code, how we ask it, what it costs,
and what it must never do.** For the owner's approval.

## 1. What Jev is good at, and what it isn't
- **Good at:** picking one option from a list we give it, with probabilities, as a stand-in for "what would most people
  think?". The spread of its answer is the signal: 0.9 on one option means clear; a split means people would argue.
- **Not able to:** write text, count, or answer yes/no or score questions directly (the API refused them on 11 October).
  Every question is a Choice with an "uncertain" option.
- **So the split of work is:** Claude (me and the helpers) writes words, clues and situations; **code** finds the facts
  (lengths, duplicates, counts); **Jev judges**. Nobody but the owner decides rules.

## 2. Who runs it (keeps the 16 October safety rule)
A small **`jev-design` helper** (requested in `docs/handover.md`): holds the key, reads only our own docs, never the web,
the preview or other helpers' reports, never pushes. I give it the questions; it returns the probabilities; I read
them, decide the fixes and commit. The tester keeps Jev for code (screen simulations of the built app, table games on
the real rules engine).

## 3. Seven jobs, in the order they pay off
| # | Job | When in the design | The question to Jev (a Choice) | What it catches | Calls (What Am I? example) |
|---|---|---|---|---|---|
| J1 | **Known at once** | every word-list change, before approval | "A family from Tirunelveli / a grandparent / a 10-year-old sees this word. Do they: know it at once · know it with a hint · not know it · uncertain?" | Words a region or age doesn't know (word guidelines B1, B4) | 789 words × 3 people ≈ 2,400 |
| J2 | **Fits its pack** | same | "Which pack does this word belong in?" (the game's packs + "none of these" + "uncertain") | Badminton under "Cricket" (Impostor I22); a word that reads as two packs | 789 |
| J3 | **Guessable from a clue** (simulated turns) | after J1–J2 | I write two typical room clues for each word; Jev, as the guesser, picks the word from it plus 5 others from the same pack | Words nobody can guess, and pairs the room will mix up (Skipping / Jumping rope) | 789 × 2 ≈ 1,600 |
| J4 | **Laugh and difficulty balance** | once per edition | "Which of these 5 words would get the biggest laugh to act out?" and "…be hardest for a 10-year-old?" over random groups of 5 | Packs with no fun words, packs far harder than others (B7) | about 400 groups ≈ 800 |
| J5 | **Screen read** | screen map, then prototype | per screen and per persona: "Which button would you press next?" (the visible buttons + uncertain); per label: "Would a family understand this at once?" (yes · no · uncertain as a Choice) | Confusing main buttons, hidden ways out, unclear words (as on the Secret Words map, 11 October) | about 25 screens × 9 + 150 labels ≈ 400 |
| J6 | **Rule clarity** | rule book and scenarios, before the tester reads them | I write a situation ("Riya's turn ends while 'Tiger' is on screen"); Jev picks what the rule says happens from 3–4 outcomes | Rules people would read two ways; a split answer means the rule's words need fixing (specs must be unambiguous) | about 30 situations × 3 personas ≈ 100 |
| J7 | **Read-aloud understood** | every "Read this aloud" and How to play | after the text: "You're stuck on a word. What do you do?" and similar, from 3–4 actions | Instructions that sound clear but don't teach (S3, the tilt rule late joiners missed) | ≈ 30 |

**Control words** in every run: a few with known answers ("Elephant": known at once; a made-up word: not known). If Jev
gets a control wrong, the run is rejected, not read.

## 4. How findings become fixes
- Same bands as the tester's runs: **above 0.8 clear**, **0.5–0.8 look at it**, **below 0.5 or "uncertain" fix it**.
- Content words (J1–J4): below 0.5 is replaced unless it is a deliberate term (word guidelines C3). Pairs confused in J3
  more than once: drop one, or keep them apart in one game.
- Screens and rules (J5–J7): a finding counts when **Jev and at least one other check agree** (a persona walk, the critic
  or the UX helper). Jev alone moves it to "look at it". This stops one tool's quirk from rewriting a screen.
- Rule questions stay the owner's: Jev shows where a rule is unclear, never what the rule should be.
- Every run is saved as a short report beside the game's docs (`docs/games/<game>/jev-<job>-<date>.md`) with the exact
  question wording, so a rerun after fixes can be compared like for like.

## 5. Cost and the weekly cap
- The cap is **50,000 decisions a week**, shared with the tester's code runs; the worst case at that cap was about
  **$4.20 a week** (8 October estimate).
- A full design pass for one game (J1–J7) is about **6,000 decisions**, roughly 50 cents at worst. Reruns after fixes
  ask only the changed words or screens.
- Recommendation: the product side uses **up to 15,000 a week**; the tester keeps the rest. When the product side's
  share is used up, its runs wait for the next week rather than eat into release checks.

## 6. Order to roll it out
1. The guard change and the `jev-design` helper (orchestrator, `docs/handover.md`).
2. **What Am I?**: J1, J2, J3 on the 789 words; fix; then J5 on screen map draft 3 and J7 on the read-aloud.
3. **Mafia**: J6 on its rules and J5 on its map (its Jev checks are already queued after What Am I?).
4. Make J1–J7 standard steps: add them to `docs/new-game-process.md` (step 1b and word lists) and to
   `docs/word-guidelines.md` Part C.

## 7. Never
- Never let Jev write or choose rules, words or screen text; it only judges what we wrote.
- Never treat a Jev result as the only reason to change a screen (section 4).
- Never run Jev on anything already built: that is the tester's.
- Never put players' names, the key or anything private into a question.
