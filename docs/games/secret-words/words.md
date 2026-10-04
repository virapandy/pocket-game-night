# Secret Words: the word list (draft v1, 4 October 2026)

The list is `words.csv` (edition 1, 452 words). It is our own list, never Codenames'. Decision K10.

## What makes a good board word
1. **One word, 3 to 8 letters A–Z** (so 25 fit on a phone; SWD-090, SWD-099).
2. **Several meanings or many links**, so one clue can join two or three words: Match (cricket, matchbox, rishta),
   Rocket (Diwali rocket, space rocket), Fan (ceiling fan, cricket fan), Kite (Sankranti kite, the bird).
3. **English, or an Indian word known everywhere** (owner, 4 October, K24). The test person: **someone from Tirunelveli or
   Sivagangai who doesn't speak Hindi**, and a 10-year-old and a grandparent. Chai, Diwali, Dosa, Samosa, Auto pass;
   Mela, Rangoli, Lassi, Dhol fail. Words kids or elders may not know are marked `grownups`.
   The Landmine is never a board word. Team names (`team-names.csv`, K25) follow the same rule: English or known everywhere,
   plural, at most 18 characters, kind to everyone.
4. **Never:** politics, religion as a joke, gods' names, caste, real living people, brands, alcohol, adult content.
   Festival names are allowed as occasions (Diwali, Eid, Holi, Onam, Christmas words).
5. **No forms or compounds of each other** on the list (not both Rain and Rainbow).
6. **Non-veg food words** are marked but dealt (they are only words on a board; K10).

## Edition 1 at a glance
| Category | Words |
|---|---|
| **Geography** | 58 |
| Food | 52 |
| Home | 44 |
| Nature and animals | 44 |
| Out and about | 36 |
| Cricket and sport | 40 |
| Films and music | 38 |
| Things and ideas | 38 |
| Festivals | 35 |
| Body and clothes | 34 |
| School and work | 33 |
451 family, 1 grown-ups (Climax); 4 non-veg (Egg, Chicken, Kebab, Fish).
Changes to the first draft: Copy and Fast → Chennai and Kolkata (product owner); Landmine → Shadow (K23); **35 words that a
non-Hindi speaker from a small Tamil town wouldn't know, or that clash with team names, replaced by English words**
(K24: Pakora, Papad, Kheer, Khichdi, Dal, Roti, Paratha, Lassi, Kulfi, Tawa, Almirah, Dhaba, Dhol, Bhangra, Gully, Onam,
Pongal, Navratri, Dussehra, Rakhi, Diya, Rangoli, Pichkari, Baraat, Sangeet, Haldi, Mehndi, Mela, Garba, Dandiya, Dhoti,
Dupatta, Bindi, Mango, Peacock); Ladoo spelt Laddu. Each replaced row says so in `notes`.

**Geography** (owner, 4 October, K26), as in the original game's mix: 19 countries Indians relate to (America, England,
Japan, China, Turkey, Greece…), 10 world cities (London, Paris, Dubai, Tokyo, Sydney…), 7 Indian states (Kerala, Punjab,
Assam, Gujarat…), 17 Indian cities (Delhi, Mumbai, Chennai, Kolkata moved here; Jaipur, Madurai, Ooty, Mysore…) and 5
landmarks (Everest, Sahara, Nile, Himalaya, Ganga). One word of at most 8 letters, so Australia, Rajasthan and Bengaluru
can't fit; nothing political (no Pakistan, no Kashmir). The owner called the rest of the list good (4 October).

## Editions
`words.csv` has `edition` and `retired_in` columns (scenarios SWD-023): **any change to the list makes a new edition**;
retired words stay in the file with `retired_in`, so every old map code still rebuilds the same board.

## Approved
**The owner approved the list and the team names on 4 October (K27).** The notes below were the planned review, now not needed.

## To check before release (as Impostor's list)
- **Persona review** (nine reviewers: North, South, East, West, a grandparent, a 9-year-old, a teen, a strict-veg home,
  a non-Hindi speaker) and then **real readers**.
- Flagged for that review: Holi and Eid (Tamil homes may say Ramzan; Diwali is Deepavali there, kept by the owner),
  Paneer, Naan, Tabla, Sitar, Kurta, Neem, Metro, Googly (kids know only the ball), Santa, Hotel (eatery sense).
- Look-alikes on one board (Chai/Chain/Chair, Crow/Crown, Goa/Goal): fine by the rules; the play-test says if they
  confuse. Each word's fit in a 57 px cell at 12 px is checked by the build (SWD-099).
- Now mostly English with an Indian feel; India-specific words only where known in every region.
