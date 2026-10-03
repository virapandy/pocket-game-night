# 07-secrets-and-seeds.md (C3)

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.5, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-060: The word and the impostor come from their own seed
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each evening's setup has `seeds.word` (draws every word and impostor of the evening) and a separate
`seeds.starter` (draws every starter), used through the per-deal seed names of Test hooks item 1
(`${seeds.word}:word:${n}`, `${seeds.word}:impostor:${n}`, `${seeds.starter}:${n}`), both made fresh on the phone with `crypto.getRandomValues` when a new
evening's first "Start round" is tapped (except IMP-064); "Change how we play" and later rounds make no new seeds
And replaying an evening's `SavedGame` (IMP-096: setup plus move records) with the engine's `replay` gives exactly
the same words, impostors, starters, outcomes and points
Property (sample 500 seeded evenings with random moves): `replay` of the saved record equals the live result;
tolerance 0

## IMP-061: Impostor choice is fair, with no 3 in a row
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then each dealt round's impostor is drawn uniformly (word seed) among the players who were not the impostor in
both of the last two completed rounds of the evening (`pickImpostor`)
And a redeal draws again by the same rule, and may draw the same player
Property 1 (sample 10,000 seeds, 4 players, no history): each player's share is 25% ± 1.5%
Property 2 (sample 10,000 seeds, 4 players, recent impostors [Riya, Arjun]): Arjun's share is 25% ± 1.5% (being
impostor last round never rules you out)
Property 3 (sample 10,000 seeds, 4 players, recent impostors [Arjun, Arjun]): Arjun's share is 0%; each other
player's 33.3% ± 1.5%
Property 4 (sample 1,000 seeded evenings of 30 rounds, 3 to 12 players): nobody is impostor in 3 completed rounds
running; tolerance 0

## IMP-062: The host sees nothing secret
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then IMP-013's check holds on every screen the host can reach during a round: screen A, screen B before a hold, the
clues, talk, countdown and picker screens, the build-up, the menu, Settings, "How to play" and the "Whose word?"
dialog
And `viewFor` the host viewer returns no word, hint, other name or impostor before the reveal (contract suite)

## IMP-063: Every crew member has the same word, every round one impostor
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Property (sample 1,000 seeded dealt rounds, 3 to 20 players): exactly one player's view says "You're the impostor";
every other player's view has the same word id; tolerance 0

## IMP-064: Test seeds work only in development and preview builds
Status: approved, owner, 2026-10-03 (detail of IMP-060)
Phase: Impostor 1
Given the release build (`npm run build -- --mode release`, as published to the families' link) and
`localStorage['pgn.test.seeds']` set
When an evening starts
Then the key is ignored: seeds are made fresh (IMP-060) and no `deals` entry is used
And `readTestSeeds(raw, true)` returns `null` for every `raw` (rule test)
Given a development or preview build and the key set as in Test hooks item 3
Then the evening's seeds and forced deals are exactly as given

---
