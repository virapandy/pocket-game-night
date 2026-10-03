# Impostor: a short guide (draft, 3 October 2026)

## Overview
Everyone gets the same secret word, except one player: the **impostor**, who gets no word. Going round the
circle, each player says **one word** linked to the secret word. Say too much and the impostor learns it; say
too little and you look like the impostor. Then everyone votes on who the impostor is. A caught impostor gets
one last chance: guess the word and steal the round.

- **Other names:** Imposter, Undercover (a variant), Who is the Spy; close cousins: The Chameleon, Spyfall.
- **Players:** 3 to 20; best with 5 to 10. **Time:** about 4 minutes a round; an evening is 5 to 8 rounds.
- **Suits:** families and friends, ages about 8 and up (younger players with the kids' rule below).

## What you need
Without the app: someone who sits out to write words on slips, plus a word list, paper and a timer. **With the
app: one phone.** Nobody sits out, the word is fair and new every round, and the score is kept.

## How to play
1. Pick a word theme and categories. The phone picks a secret word and, at random, the impostor.
2. **Pass the phone round.** Each player sees the screen "Pass to Riya", takes the phone, holds to see their
   word (or "You are the impostor"), lets go, and passes it on.
3. The phone names who starts (never the impostor), then play goes clockwise.
4. **Clues:** each player says one word linked to the secret word. No saying the word, no repeating a clue, no
   rhymes or "sounds like".
5. **Discuss** for up to a minute: who sounded unsure?
6. **Vote:** on "3, 2, 1, point!" everyone points at once. The player with the most fingers on them is accused.
7. **Reveal:** the phone shows whether they were the impostor, and the word.
8. **Last guess:** a caught impostor says one guess aloud. Right: they steal the round.
9. Score, then the next round with a new word, a new impostor and the next starter.

## Rules
| # | Rule | Convention | Ours? |
|---|---|---|---|
| 1 | One impostor for 3–7 players; from 8 players, the host may choose 2 | imposter.online | |
| 2 | The impostor sees "You are the impostor" and the **category** (the room knows the category anyway) | Most phone versions show the category | |
| 3 | Clues are one word, one round round the circle; a second round is a setting | imposter.online, impostergames.org | |
| 4 | Banned clues: the word itself, a repeat, a rhyme, a direct translation, filler like "thing" | psycatgames, impostergames.org | Translations banned: ours, for mixed-language groups |
| 5 | **The impostor never starts**; the starter is random among the others, then clockwise | Sources only advise rotating | **Ours**: the worst unfair round for families |
| 6 | Discussion up to 60 seconds, visible timer, skippable; can be switched off | 15–45 s in sources; apps offer 30 s–3 min or off | 60 s: ours, slower family pace |
| 7 | Vote by pointing together on a count of three; the host enters who was accused | The Chameleon (pointing) | |
| 8 | Tie: one re-vote between the tied players; still tied, the impostor escapes | imposter.online; impostor-wins is a common house rule | |
| 9 | A caught impostor gets one guess, said aloud; **the room judges** if it's right (like trusting the Tambola anchor) | imposter.online, imposter.hu | Room judges: ours |
| 10 | Kids' rule (setting): clues of up to 3 words | impostergames.org | |

## Scoring
| Outcome | Points |
|---|---|
| The impostor escapes (not accused) | Impostor +2 |
| Caught, but guesses the word | Impostor +1 |
| Caught, guess wrong | Every crew member +1 |

Points add up across the evening on the night's scoreboard. (A simplified version of the sources' scoring:
imposter.online uses +3/+2/+1 to 10; The Chameleon 2/1/2 to 5.) No first-to-X race by default; the evening
ends when the host ends it.

## Variants (not in the first release)
- **Undercover:** the impostor gets a *similar* word (Idli instead of Dosa) and may not know they're the impostor;
  players are voted out one by one. The word lists store a close cousin for every word so this can come later.
- **Mr White:** Undercover plus a player with no word.
- **Spyfall:** questions instead of clues, with a location and roles.

## What we do differently from other Impostor apps
Research of the leading apps and about 800 reviews (3 October 2026): the complaints are paywalls, ads, repeated
words, roles leaking while the phone is passed, an impostor picked suspiciously often, and no Indian content.
Ours: India-centric word themes with a fair Multicultural default, each player's own script, every word free and
offline, no repeats in an evening, a private deal where the impostor's turn looks identical, and the scores of
the whole night.

## How Pocket Game Night plays it
- **The phone does:** pick a fair word from India-centric themes (`words.md`), pick the impostor, deal privately
  by passing the phone, choose the starter, run the timer, count down the vote, the reveal, and the scoreboard.
- **The room does:** the clues, the arguing, the pointing, and judging the last guess.
- **One phone is enough**; players' own phones are a later option (see `lifecycle.md`).

## Sources (opened 3 October 2026)
- imposter.online, How to play: https://imposter.online/how-to-play
- Psycat Games, Impostor game: https://psycatgames.com/magazine/party-games/impostor-game/
- impostergames.org, How to: https://impostergames.org/how-to
- imposter.hu, How to play: https://imposter.hu/en/how-to-play/
- The Chameleon: https://en.wikipedia.org/wiki/The_Chameleon_(party_game) and https://www.geekyhobbies.com/the-chameleon-2017-rules/
- Undercover (Yanstar): https://www.yanstarstudio.com/undercover-how-to-play
- Spyfall: https://en.wikipedia.org/wiki/Spyfall_(card_game)
- Apps and reviews: Undercover (Play, com.yanstarstudio.joss.undercover), Imposter Who? (imposterwho.com),
  Impostor: Bluff Word Game (Play, com.phyxgames.impostor), Dronk imposter game (dronkapp.com/imposter-game)

## Contract check (for the builders)
| Question | Impostor's answer |
|---|---|
| Setup | Players in seat order, theme, categories, number of impostors, settings, seed |
| Legal moves | Seen my word · don't know the word (redeal) · start clues · start/skip timer · record accused (one of the players) · re-vote · guess right / wrong · next round · end evening: a finite list |
| Apply | Pure: each move gives the next state |
| View | Each player sees only their own role during the deal; the host screen never shows the word or the impostor until the reveal |
| Game over | A round ends at its score; the evening ends when the host ends it |
| Invariants | Exactly the set number of impostors; every crew member has the same word; the impostor never starts; no word repeats in an evening; points add up |
| Undo | Undo the last recorded vote or guess before "Next round"; never undo the deal (redeal instead) |
| Secrets | The word and impostor come from their own seed, separate from the starter |
