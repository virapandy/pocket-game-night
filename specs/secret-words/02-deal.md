# 02-deal.md: The deal and its secrets (C3)

Copied from `docs/games/secret-words/scenarios.md` (version 3.6, approved by the owner 22 October 2026), the binding contract. Where a scenario ends with a paragraph headed "Version 3.6", that paragraph wins over the text above it. Terms, canonical strings, the menu table and the test hooks: [README.md](README.md). Rule API for the tests: [api.md](api.md).

## SWD-020: What a board holds
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Full: 25 distinct words; starting team 9, other 8, nobody 7, Landmine 1. Easy: 16 distinct words; 6, 5, 5, 0.
**Property:** for 10,000 random valid codes of each size, exactly these counts and all words distinct.

## SWD-021: Who starts
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
**Property:** over 10,000 random valid codes, each team starts between 48% and 52% of boards.

## SWD-022: The map code
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Symbols (values 0–30): **1 config** = (edition − 1) × 4 + (Easy ? 2 : 0) + (+ Harder words ? 1 : 0) (edition 1: 0–3);
**2 deal index** n (0–30, the board's place in the deck, SWD-024); **3–6 deck seed** d (0 to 31⁴ − 1 = 923,520, base 31,
most significant first); **7 check** = (1·v1 + 2·v2 + 3·v3 + 4·v4 + 5·v5 + 6·v6) mod 31. Shown "27P-3QX8".
**The board from a code** (`boardFromCode`), a pure function of the code and the shipped list:
1. `candidates` = rows with `edition` ≤ e and (`retired_in` blank or > e); for Whole family only rows with `audience` =
   family; in `words.csv` row order.
2. `deck` = ``shuffle(candidates, createRng(`secret-words:deck:${d}`))`` (the engine's `shuffle`).
3. `words` = `deck.slice(25·n, 25·n + size)` (size 25 or 16; Easy boards also step by 25).
4. `r` = ``createRng(`secret-words:board:${d}:${n}`)``; `starts` = `r.int(2) === 0 ? 'orange' : 'teal'`; then `kinds` =
   `shuffle([starts × 9, other × 8, nobody × 7, landmine × 1], r)` (Easy 6, 5, 5, 0), in that order of draws.
A code is valid only if its check is right, its edition is shipped and 25·n + size ≤ candidates.length.
**Property:** `boardFromCode` gives the same result for 10,000 codes on every call. **Browser check (5 codes, via test hook
2):** the host board and a map phone given the same code show the same words in the same cells with the same kinds and
starting team. **Golden boards:** the tester records 5 codes with their exact boards from the first green build as fixtures;
any later change to them is a C3 defect (a list change makes a new edition instead).

## SWD-023: Words and editions
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
`words.csv` columns: `id, word, meanings, category, audience, nonveg, edition, retired_in, notes`. Edition 1 = every row with
`edition` 1. **Any change to the list makes a new edition** (new rows get the new edition; a retired row gets `retired_in` =
the new edition and stays in the file). The app ships every edition it knows, so old codes and old evenings always rebuild the
same boards. At most 7 editions fit the config symbol; each edition's candidates stay at most 775 words (31 deals of 25).
Non-veg words are dealt (K10).

## SWD-024: The deck: no repeats this evening
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
At evening creation, whenever the candidate list changes (Board or Words changed), and when the deck runs out, the host picks
a **deck**: with ``rng = createRng(`${seeds.deal}:deck:${k}`)`` (k = the evening's deck number from 1) it draws up to 200
deck seeds, each `rng.int(923521)`, and keeps the one whose first min(75, candidates.length) deck words contain the fewest of
(this evening's words ∪ recent words), ties to the earliest drawn, stopping early at the first with none. `recent` = the board
words of the 3 most recently started other Secret Words evenings on this phone that weren't deleted, frozen at evening
creation. Deals then use n = 0, 1, 2, … in that deck; when 25·n + size would exceed the candidates, the next deal picks a new
deck (k + 1) and starts at n = 0. **Property:** for 1,000 random evenings of 15 Full Whole-family deals with the edition-1
list, no word is on two boards. (Once the deck runs out, or after a change of Board or Words, repeats can happen.)

## SWD-025: The map stays private
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
Until game over, every room screen's DOM has no kind of a face-down cell: all face-down cells have the same attributes,
classes, inline style and computed style except `data-index` and the word text. **Rule property:** over 10,000 random games,
`viewFor(room)` never contains a face-down cell's kind. **Browser check:** 10 seeded games in each map mode, at every step.
The map and the code appear only on map screens.

## SWD-026: Replays
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
The evening's record holds its seeds, setup and moves; every `deal` and `dealNew` records its code, and `brokeRule` its cell.
Replay accepts any recorded code valid for the shipped editions and gives the same boards, reveals and results. Live, `play`
accepts only the code SWD-024 gives for that deal (or the test hook's), and only SWD-046's cell.

## SWD-027: Map code checks (detail of SWD-022)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
**Property:** every code `codeFor` makes passes the check; changing any one symbol of a valid code to any other symbol fails
it, and so does swapping two adjacent different symbols.

## SWD-028: The scan screen shows the code (detail of SWD-025)
Status: approved, owner, 2026-10-22 (version 3.6)
Phase: Secret Words 1
The scan screen shows the code by design (K3, owner); it is a map screen. Accepted with K3: someone who can read the code
and the app's source could work out the other boards of that deck. This is family trust, like Tambola's anchor, and an
owner-accepted exception to "seeds never leave the host phone".
