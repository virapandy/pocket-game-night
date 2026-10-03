# 06-words.md (C3)

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-050: Words come from the list with the chosen audience
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Words is Whole family
Then only words with `audience` "family" are dealt
And with "+ Grown-ups", words with `audience` "family" or "grownups" are dealt
And only from categories switched on, and words with `nonveg` true only when "Include non-veg food" is on
Property (sample 10,000 seeded picks over random filters): every picked word passes the filter; tolerance 0

## IMP-051: No word repeats in an evening
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then within one evening no word is dealt twice, counting every dealt round: given-up ("Don't know this word?"),
dealt-again, practice and fresh-round words included, until the host taps "Allow repeats" (IMP-052)
Property (sample 1,000 seeded evenings of 30 dealt rounds, random filters, no "Allow repeats"): no word id appears
twice; tolerance 0

## IMP-052: Tonight's and recent evenings' words are avoided
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each deal picks, uniformly by the word seed, from the first non-empty group among the words that pass IMP-050
and are not blocked (IMP-015, IMP-107):
1. not dealt in tonight's session and not dealt in the last 3 evenings;
2. not dealt in tonight's session but dealt in the last 3 evenings
And "the last 3 evenings" = the 3 most recently ended (not discarded) Impostor evenings on this phone; "dealt" counts
every dealt round, practice and redeals included
And the sets are fixed when the evening starts ("Start round", IMP-096 `excludedWords`); words dealt during the
evening join "dealt tonight" as they are dealt
When both groups are empty at the moment a word is needed
Then instead of "Pass the phone to…" the screen shows the heading
"You've played every word in these categories tonight!", the line "Turn on more categories or + Grown-ups.", the main
button "Allow repeats" and the quiet "Change categories"
When "Allow repeats" is tapped (recorded as `allowRepeats`)
Then for the rest of the evening each deal picks uniformly among all words that pass IMP-050 and are not blocked,
and the deal starts
When "Change categories" is tapped
Then "How do you want to play?" opens with the current choices; its "Start round" records `setChoices` only (no
`nextRound`) and the same round is dealt again, same round number, with a word drawn under the new choices
And the menu on this screen is the between-rounds menu (IMP-075)
And when even "Allow repeats" would find no word (every allowed word blocked), "Allow repeats" is not shown and
"Change categories" is the main button

## IMP-053: Both names are shown where a thing has two
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the word is "Kheer / Payasam"
Then the crew's `private-word` reads exactly "Kheer / Payasam", line 5 reads "Also called Payesh", and the reveal
reads "The word was Kheer / Payasam."

## IMP-054: Every word in the list is valid
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then every row of `words.csv` (parsed as CSV, quoted fields allowed) and of `words.json` has: an id "IMPW-" plus
3 digits, unique; a non-empty word; a category that is one of the 9 (IMP-007); audience "family" or "grownups";
nonveg "yes" or "no" (`true`/`false` in JSON); a non-empty hint that is not, ignoring case, the word, one of its
names (split on " / "), or one of its other names
And no two rows have the same word, ignoring case
And `words.json` has exactly the rows of `words.csv`, in the same order (309 rows on 3 October 2026)

## IMP-055: The shipped word list file
Status: approved, owner, 2026-10-03 (detail of IMP-054)
Phase: Impostor 1
Then the app ships `content/impostor/words.json`, built from `docs/games/impostor/words.csv` with a real CSV parser
And each entry is `{ "id": "IMPW-004", "word": "Samosa", "other_names": "", "category": "Food", "audience": "family",
"nonveg": false, "hint": "Tea time" }`: `other_names` is the CSV text exactly ("" when empty, "Golgappa / Puchka"
otherwise)
And the CSV columns `difficulty`, `close_cousin`, `change` and `notes` are not in the file and not used by the app
