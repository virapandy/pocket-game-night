# Simulated table games: Secret Words

Engine commit b5f030b rules; 60 boards played turn by turn; clues from outside (clues.json), Jev as the guesser (Choice over the face-down words plus "uncertain").

## Turns per game

| Board | Games | Mean turns | Min | Max | Won by finding all | Landmine ended it | Stalled or capped |
|---|---|---|---|---|---|---|---|
| full | 30 | 13.2 | 10 | 16 | 28 | 2 | 0 |
| easy | 30 | 8.4 | 6 | 11 | 30 | 0 | 0 |

Turns per board: full-01=11, full-02=15, full-03=13, full-04=12, full-05=10, full-06=15, full-07=13, full-08=16, full-09=12, full-10=13, full-11=15, full-12=12, full-13=15, full-14=12, full-15=16, full-16=13, full-17=11, full-18=12, full-19=11, full-20=15, full-21=12, full-22=14, full-23=12, full-24=12, full-25=14, full-26=15, full-27=14, full-28=16, full-29=12, full-30=13, easy-01=8, easy-02=6, easy-03=7, easy-04=8, easy-05=6, easy-06=9, easy-07=8, easy-08=8, easy-09=10, easy-10=9, easy-11=9, easy-12=9, easy-13=8, easy-14=11, easy-15=7, easy-16=10, easy-17=10, easy-18=9, easy-19=7, easy-20=8, easy-21=9, easy-22=8, easy-23=7, easy-24=8, easy-25=10, easy-26=9, easy-27=10, easy-28=8, easy-29=8, easy-30=8

## Word pairs Jev confuses most often

Counted when Jev's two best-fitting face-down words for a clue were close (second at least half as likely as the first); across boards.

| Pair | Times | Boards |
|---|---|---|
| Bus / Drive | 1 | 1 |
| Exam / Homework | 1 | 1 |
| Band / Magic | 1 | 1 |
| Canada / Shimla | 1 | 1 |
| Kurta / Trailer | 1 | 1 |
| Banana / Shimla | 1 | 1 |
| Pilot / Point | 1 | 1 |
| Head / Picnic | 1 | 1 |
| Map / Record | 1 | 1 |
| Rank / Wedding | 1 | 1 |
| Popcorn / Trailer | 1 | 1 |
| Canada / Ginger | 1 | 1 |
| Ball / Goa | 1 | 1 |
| King / Lucknow | 1 | 1 |
| Garland / Ribbon | 1 | 1 |
| Hockey / Keeper | 1 | 1 |
| Glove / Nail | 1 | 1 |
| Net / Surat | 1 | 1 |
| Halwa / Surat | 1 | 1 |
| Hand / Pad | 1 | 1 |
| Bread / Cow | 1 | 1 |
| Cow / Curd | 1 | 1 |
| Metro / Station | 1 | 1 |
| Band / Bug | 1 | 1 |
| Head / Top | 1 | 1 |

Guesses made: 834 (compulsory first guesses where Jev said uncertain: 62); guesses on a word that was not the guessing team's own: 174.

## Clues where Jev's pick was the other team's word or the Landmine

- clue "Books" 1, board full-01: Jev picked "Comic" (the other team's word), confidence 0.85
- clue "Court" 1, board full-01: Jev picked "Guard" (the other team's word), confidence 0.41
- clue "Topper" 1, board full-01: Jev picked "Helmet" (the other team's word), confidence 0.69
- clue "Wizard" 1, board full-02: Jev picked "Kurta" (the Landmine), confidence 0.77 (compulsory first guess)
- clue "Post" 2, board full-03: Jev picked "Point" (the other team's word), confidence 0.27
- clue "Teeth" 1, board full-03: Jev picked "Head" (the other team's word), confidence 0.57
- clue "Cricket" 2, board full-04: Jev picked "Uniform" (the Landmine), confidence 0.36
- clue "Tea" 1, board full-04: Jev picked "Lemon" (the other team's word), confidence 0.34
- clue "Bengal" 1, board full-05: Jev picked "Sikkim" (the other team's word), confidence 0.52
- clue "Gangtok" 1, board full-05: Jev picked "Ginger" (the other team's word), confidence 0.27 (compulsory first guess)
- clue "Sambar" 1, board full-05: Jev picked "Pickle" (the Landmine), confidence 0.43
- clue "Ludo" 1, board full-06: Jev picked "Six" (the other team's word), confidence 0.64
- clue "Bollywood" 1, board full-06: Jev picked "Chutney" (the other team's word), confidence 0.45
- clue "Snow" 1, board full-07: Jev picked "Cooler" (the other team's word), confidence 0.67
- clue "Bracelet" 1, board full-08: Jev picked "Ribbon" (the Landmine), confidence 0.38
- clue "Diamonds" 1, board full-09: Jev picked "Queen" (the other team's word), confidence 0.30
- clue "Sewing" 2, board full-09: Jev picked "Glove" (the other team's word), confidence 0.28
- clue "Beach" 1, board full-09: Jev picked "Net" (the other team's word), confidence 0.28
- clue "Bitter" 1, board full-09: Jev picked "Chilli" (the other team's word), confidence 0.72
- clue "Butter" 1, board full-10: Jev picked "Curd" (the Landmine), confidence 0.41
- clue "Flip" 1, board full-11: Jev picked "Wave" (the other team's word), confidence 0.26
- clue "Zebra" 2, board full-12: Jev picked "Bug" (the other team's word), confidence 0.25 (compulsory first guess)
- clue "Pressure" 1, board full-12: Jev picked "Top" (the other team's word), confidence 0.25 (compulsory first guess)
- clue "Tandoor" 1, board full-12: Jev picked "Cooker" (the other team's word), confidence 0.69
- clue "Sofa" 1, board full-13: Jev picked "Lift" (the other team's word), confidence 0.77 (compulsory first guess)
- clue "Spicy" 1, board full-14: Jev picked "Ginger" (the other team's word), confidence 0.87
- clue "Bow" 1, board full-14: Jev picked "Bangle" (the other team's word), confidence 0.40
- clue "Tide" 1, board full-15: Jev picked "Ship" (the other team's word), confidence 0.91
- clue "Christmas" 2, board full-16: Jev picked "Candy" (the other team's word), confidence 0.56
- clue "Toffee" 1, board full-16: Jev picked "Sugar" (the other team's word), confidence 0.90
- clue "Biscuit" 1, board full-17: Jev picked "Laddu" (the other team's word), confidence 0.54
- clue "Ride" 2, board full-18: Jev picked "Ship" (the other team's word), confidence 0.49
- clue "Graph" 1, board full-19: Jev picked "Map" (the other team's word), confidence 0.63
- clue "Atlas" 1, board full-19: Jev picked "Library" (the Landmine), confidence 0.41 (compulsory first guess)
- clue "Temple" 1, board full-20: Jev picked "Bangkok" (the Landmine), confidence 0.39
- clue "Frozen" 1, board full-20: Jev picked "Fan" (the other team's word), confidence 0.60 (compulsory first guess)
- clue "Sound" 1, board full-20: Jev picked "Bell" (the other team's word), confidence 0.54
- clue "Link" 1, board full-23: Jev picked "Bangle" (the other team's word), confidence 0.45
- clue "Kitchen" 2, board full-24: Jev picked "Bread" (the other team's word), confidence 0.26
- clue "Taste" 1, board full-25: Jev picked "Chutney" (the other team's word), confidence 0.51
- clue "Tea" 1, board full-27: Jev picked "Chair" (the other team's word), confidence 0.44
- clue "Taste" 1, board full-28: Jev picked "Salt" (the other team's word), confidence 0.67
- clue "Mint" 1, board full-29: Jev picked "Jelly" (the other team's word), confidence 0.24 (compulsory first guess)
- clue "Mountain" 1, board full-30: Jev picked "Bhutan" (the other team's word), confidence 0.79
- clue "Bread" 2, board full-30: Jev picked "Feast" (the other team's word), confidence 0.36
- clue "Dhoti" 1, board full-30: Jev picked "Costume" (the other team's word), confidence 0.62
- clue "Disguise" 1, board full-30: Jev picked "Bow" (the other team's word), confidence 0.88 (compulsory first guess)
- clue "Cricket" 2, board easy-01: Jev picked "Tabla" (the other team's word), confidence 0.17
- clue "Pressure" 1, board easy-02: Jev picked "Fire" (the other team's word), confidence 0.46 (compulsory first guess)
- clue "Kerala" 2, board easy-03: Jev picked "Mumbai" (the other team's word), confidence 0.25
- clue "Desert" 1, board easy-03: Jev picked "Palm" (the other team's word), confidence 0.88
- clue "Bollywood" 1, board easy-03: Jev picked "Curtain" (the other team's word), confidence 0.28
- clue "Lollipop" 1, board easy-03: Jev picked "Ribbon" (the other team's word), confidence 0.62
- clue "Hammer" 1, board easy-05: Jev picked "Mark" (the other team's word), confidence 0.38 (compulsory first guess)
- clue "Republic" 1, board easy-05: Jev picked "Delhi" (the other team's word), confidence 0.33 (compulsory first guess)
- clue "Banana" 1, board easy-07: Jev picked "Jelly" (the other team's word), confidence 0.25
- clue "Bollywood" 1, board easy-10: Jev picked "Madurai" (the other team's word), confidence 0.34
- clue "Bathroom" 2, board easy-11: Jev picked "Mint" (the other team's word), confidence 0.25
- clue "Bhangra" 1, board easy-11: Jev picked "Stunt" (the other team's word), confidence 0.45
- clue "Microphone" 1, board easy-13: Jev picked "Song" (the other team's word), confidence 0.69
- clue "Idli" 1, board easy-13: Jev picked "Samosa" (the other team's word), confidence 0.79
- clue "Hand" 1, board easy-13: Jev picked "Pad" (the other team's word), confidence 0.17
- clue "Stripes" 1, board easy-15: Jev picked "Ribbon" (the other team's word), confidence 0.44
- clue "Lunch" 1, board easy-15: Jev picked "Dosa" (the other team's word), confidence 0.96
- clue "Needle" 1, board easy-16: Jev picked "File" (the other team's word), confidence 0.23
- clue "Desert" 1, board easy-19: Jev picked "Dubai" (the other team's word), confidence 0.90
- clue "Cupboard" 1, board easy-21: Jev picked "Box" (the other team's word), confidence 0.89
- clue "Paris" 1, board easy-22: Jev picked "Rome" (the other team's word), confidence 0.70
- clue "Italy" 1, board easy-22: Jev picked "Paneer" (the other team's word), confidence 0.48 (compulsory first guess)
- clue "Astronaut" 2, board easy-24: Jev picked "Ship" (the other team's word), confidence 0.74
- clue "Rainbow" 1, board easy-26: Jev picked "Ribbon" (the other team's word), confidence 0.53
- clue "Car" 1, board easy-28: Jev picked "Rickshaw" (the other team's word), confidence 0.88
- clue "Tyre" 1, board easy-29: Jev picked "Stunt" (the other team's word), confidence 0.41 (compulsory first guess)
- clue "Mountain" 1, board easy-29: Jev picked "Shimla" (the other team's word), confidence 0.87

## Clues the engine refused, and clues that broke the clue rules

(none)

## Teams running out of planned clues

Boards where a team ran out: 0 of 60. The engine has no pass move (a clue needs at least one guess; the only turn that ends with no guess is "Clue not allowed", which hands the other team a word), so such a board is ended early and counted here.


## Jev decisions and cost

- Jev decisions this run: 1226 (one per guess); used this ISO week after this run: 1226 of 50,000.
- Jev calls: 1226; input tokens reported by Jev: 1111992; failures: 0.
- Clue giver (outside the script) cost: Claude subagents (4, largest model), owner plan, no API key.

## Notes from the clue givers

1. SWD-131's "part of a board word" rule catches natural clues without any warning to the clue giver (Ring/Spring, Pan/Japan, Paper/Newspaper, Keeper/Goalkeeper, Rainbow/Bow, Plant/Ant, Football, Watchman).
2. On boards where the Landmine loses the game, natural clues often point at the Landmine (Coin/Diamonds near Gold; food near Pickle, Bread), so clue givers chose weaker words.
3. On 4x4 boards safe clues for 2 to 3 words were hard, so most clues are for 1 word.
4. The rules do not say whether a clue may repeat an earlier clue. Some one-word names (Meenakshi, Gangtok, Thimphu, Dhoni, ISRO) may not be known to every family.
