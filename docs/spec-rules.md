# Writing specs that can't be misread (owner, 3 October 2026)

Owner: "every change is becoming too long to see the result; build is time consuming, so ensure your specs are
detailed without misinterpretation possibilities." Every misread scenario costs a full build-and-test round.
These rules apply to every scenario the product owner writes, for every game and every change.

## What Tambola taught us (from the build history, 28 September to 3 October)
| Case | What went wrong | Cost |
|---|---|---|
| TAM-082 prize rounding | The example meant "nearest", the review meant "round down"; then two "always" rules clashed in 1 pot in 1,000 | 3 owner decisions, about 3 rounds |
| TAM-122 / TAM-191 cells | 44 px × 9 columns = 396 px on a 390 px screen: impossible as written | Decided 3 times over 4 days |
| TAM-181 vs TAM-137 | One scenario asked for a "Next" button, another for a single tap | Open across 3 reports, then reversed |
| TAM-117 typed code | "At most 12 characters" and "the code alone opens the ticket" can't both be true | 1 round |
| TAM-175 | Nothing said what happens when a ticket is given twice; app refused, test assumed accepted | 1 round blocked |
| TAM-108 | The coder added a 0.5 s pause nobody asked for | Red round |
| TAM-195 cue line | Wording changed 4 times; "fits on one line" not stated per font and orientation | 3 bugs, 2 test faults |
| PLT-016 vs PLT-026 | Two scenarios gave different times for asking about a new session | Open across about 6 reports |
| Text matching | Tests assumed how text runs together on screen ("Nani's2 gamesNot settled") | 6 test faults |
| Invented numbers | "Large text", "about 40%" left the tester to pick 24 px, 30% | Rework |

## The rules
1. **Exact words, in quotes.** Every button, label, message and announcement is written word for word, with its
   variants for 1 and for several, and for each mode. Nothing on screen is left to the coder's wording.
2. **Numbers, not adjectives.** No "about", "short", "large", "gentle", "quiet", "calm", "readable", "fits" without a
   number. Sizes in CSS px, times in seconds or milliseconds, counts as numbers. Where something is a feeling
   (calm, gentle), translate it into the measurable thing (no colour change; volume ≤ the tick; no flash).
3. **Say where a number holds.** Each size or "no scrolling" names the screen sizes (320 × 568, 360 × 640, 390 × 844,
   812 × 375), the font setting (normal, Larger text), the longest content (16-character names, the longest word,
   12 players) and every state that adds things (timer on, practice chip, voice on).
4. **Check the arithmetic.** Before writing a size, add it up on the smallest screen. If it can't fit, say what
   shrinks first and its floor.
5. **One rule wins.** When two "always" rules could meet, say which gives way, with a worked example at the edge.
6. **Every input's edge cases.** For each action: repeat, double tap, duplicate, empty, too many, undo, Back, menu,
   app hidden, and what happens with nothing else ("nothing else changes" where an extra behaviour would be wrong).
7. **Clocks start somewhere.** Every time says which event starts the clock and what pauses it.
8. **Randomness is a stated property.** Say what is random, what must always hold (a property test), and that a test
   can fix the seed.
9. **Name the test hooks.** Say what a test may set: seeds, the clock, the word, the impostor, background/foreground.
10. **Name the element.** Say what each piece of text is (a heading, a button, a caption on its own line), so tests
    find it by role and name, not by how text happens to run together.
11. **One fact, one place.** The scenario is the contract. Design notes (`ux.md`, `lifecycle.md`) may explain, but if
    a fact is in a scenario it is not restated elsewhere with different words. When a decision changes wording, list
    every scenario ID it rewords or retires.
12. **Two readers before hand-over.** A coder-reader and a tester-reader each read the scenarios alone and list every
    guess. Every difference is resolved in the scenario before the tester writes a test.
