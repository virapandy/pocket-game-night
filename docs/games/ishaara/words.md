# Ishaara: the word list (draft v1, 4 October 2026)

The list is `words.csv` (edition 1, 400 words). It is our own list, never Codenames'. Decision K10.

## What makes a good board word
1. **One word, 3 to 8 letters A–Z** (so 25 fit on a phone; ISH-090, ISH-099).
2. **Several meanings or many links**, so one clue can join two or three words: Match (cricket, matchbox, rishta),
   Rocket (Diwali rocket, space rocket), Fan (ceiling fan, cricket fan), Kite (Sankranti kite, the bird).
3. **Known without explanation by a 10-year-old and a grandparent from any region**: the Multicultural fairness rule
   from Impostor (`docs/games/impostor/words.md`). Words kids or elders may not know are marked `grownups`.
4. **Never:** politics, religion as a joke, gods' names, caste, real living people, brands, alcohol, adult content.
   Festival names are allowed as occasions (Diwali, Eid, Holi, Onam, Christmas words).
5. **No forms or compounds of each other** on the list (not both Rain and Rainbow).
6. **Non-veg food words** are marked but dealt (they are only words on a board; K10).

## Edition 1 at a glance
| Category | Words |
|---|---|
| Food | 52 |
| Home | 44 |
| Nature and animals | 44 |
| Out and about | 42 |
| Cricket and sport | 40 |
| Films and music | 38 |
| Things and ideas | 38 |
| Festivals | 35 |
| Body and clothes | 34 |
| School and work | 33 |
396 family, 4 grown-ups (Climax, Pichkari, Baraat, Sangeet); 4 non-veg (Egg, Chicken, Kebab, Fish).
Product owner changes to the first draft: Copy (Indian English, less used in the South) and Fast (religious sense)
replaced by Chennai and Kolkata, so the places aren't all north and west.

## Editions
`words.csv` has `edition` and `retired_in` columns (scenarios ISH-023): **any change to the list makes a new edition**;
retired words stay in the file with `retired_in`, so every old map code still rebuilds the same board.

## To check before release (as Impostor's list)
- **Persona review** (nine reviewers: North, South, East, West, a grandparent, a 9-year-old, a teen, a strict-veg home,
  a non-Hindi speaker) and then **real readers**.
- Flagged for that review: Pongal and Onam (regional festivals), Garba and Dandiya, Duster and Almirah (Indian English),
  Ladoo spelling (Laddu in the South), Googly (kids know only the ball), Santa, Hotel (eatery sense).
- Look-alikes on one board (Chai/Chain/Chair, Crow/Crown, Goa/Goal): fine by the rules; the play-test says if they
  confuse. Each word's fit in a 57 px cell at 12 px is checked by the build (ISH-099).
- About 60% general English with an Indian feel, 40% India-specific; aim nearer half-and-half in edition 2.
