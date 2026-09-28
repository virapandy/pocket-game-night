# Rhymes

The rhymes make the game fun. The catalog is `docs/games/tambola/rhymes.csv`; the app's content pack
is made from it once a person has reviewed it.

## TAM-150: Every number has several rhymes
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every number from 1 to 90 has at least 3 rhymes in English and at least 1 in Hindi
And at least 2 English rhymes per number are marked family-friendly

## TAM-151: A rhyme is picked at random on each call
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When a number is called
Then one of its allowed rhymes is shown for the anchor to read, chosen at random
And over many games, every allowed rhyme for a number gets picked

## TAM-152: The same game always shows the same rhymes
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given a game's seed and its moves
When it is replayed
Then every call shows the same rhyme as the first time
(Rhymes are picked by the game's seeded random generator, never by an unseeded one.)

## TAM-153: The host chooses the rhyme language
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host sets rhymes to English, Hindi, or Both
Then only rhymes in the chosen language(s) are picked
And with Both, either language can come up on any call

## TAM-154: Family-friendly rhymes by default
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When a new game starts without changing settings
Then only rhymes marked family-friendly are picked
When the host turns the family-friendly filter off
Then every rhyme in the chosen language(s) can come up

## TAM-155: The anchor can ask for another rhyme
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the anchor taps "Another rhyme" for the current number
Then a different allowed rhyme for that number is shown, if one exists
And the called number itself does not change

## TAM-156: Rhymes fit the screen and read aloud quickly
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every rhyme in the pack is at most 40 characters
And shows in full, without cutting off, under the called number on the room view

## TAM-157: The rhyme pack is valid
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every entry has a number from 1 to 90, a language, a style, a family-friendly flag and text
And no number has the same rhyme twice
And the pack carries a format version, so later packs (more languages, community packs) load the same way

## TAM-158: Indian references come first
Status: approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
Given a number has allowed rhymes with Indian references (styles indian, cricket, bollywood, festival, hindi)
and allowed rhymes without (classic, playful)
Then each Indian-reference rhyme is twice as likely to be picked as each other rhyme
And over many games, Indian-reference rhymes come up about twice as often per rhyme, within normal random variation
And every number has at least one family-friendly English rhyme with an Indian reference
