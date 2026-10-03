# Impostor: word themes (draft, 3 October 2026)

Owner's brief: words are **India-centric**. **The first release has one theme, Multicultural** (owner, 3 October):
picture friends who grew up in Chennai, Delhi, Lucknow and Calicut playing together. Six regional themes come later.

## Themes
| Theme | When | For | What's in it | How words are shown |
|---|---|---|---|---|
| **Multicultural** | **First release** | Mixed groups from anywhere in India | Common ground: things anyone who grew up in India knows, wherever they grew up | English letters |
| **Full Desi** | Later | Hindi-speaking groups | Bollywood, North Indian food, festivals, weddings, everyday Hindi-belt life | English letters; Devanagari as an option |
| **Tamil** | Later | Tamil groups | Kollywood, Tamil food, festivals, places, everyday life | English letters; Tamil script as an option |
| **Telugu** | Later | Telugu groups | Tollywood, Andhra and Telangana food, festivals, places | English letters; Telugu script as an option |
| **Malayalam** | Later | Malayali groups | Mollywood, Kerala food, festivals, places | English letters; Malayalam script as an option |
| **Kannada** | Later | Kannada groups | Sandalwood, Karnataka food, festivals, places | English letters; Kannada script as an option |
| **Bengali** | Later | Bengali groups | Bengali cinema and music, Bengali food, Durga Puja and festivals, places | English letters; Bengali script as an option |

## The fairness rule for Multicultural
Impostor only works if **every crew member knows the word**. If the Calicut player doesn't know "Chhath",
they look like the impostor and the round is spoiled. So:
1. **A word is in Multicultural only if someone who grew up in any of Delhi, Lucknow, Chennai, Hyderabad,
   Bengaluru, Calicut or Kolkata would know it without an explanation.** Regional things that went national count (Dosa, Biryani, Onam).
2. **One thing, two names: show both.** "Kheer / Payasam", "Rangoli / Kolam", "Lohri / Pongal / Sankranti" is a
   separate harvest card only if each name is known; otherwise the thing is left out.
3. **Never stars of one industry only.** A film person goes in only if known nationally (Rajinikanth, Shah Rukh
   Khan, A. R. Rahman), never a regional favourite the rest won't know.
4. **Later, with the regional themes: each player picks their own script on their own reveal screen.** The Chennai player can read
   "பிரியாணி", the Delhi player "बिरयानी", the Calicut player "ബിരിയാണി", the Bengaluru player "ಬಿರಿಯಾನಿ", the Kolkata player
   "বিরিয়ানি", the rest "Biryani": same word, one game.
   English letters is the default; a player's choice is remembered for the evening.
5. **"Don't know this word?"** is on every reveal screen, for the crew **and** the impostor, so pressing it gives
   nothing away. It quietly redeals the round with a new word (same players, new impostor).

The regional themes go the other way: they are meant to be insider fun, so local favourites are welcome.

## Why this matters (from the app research, 3 October)
The big Impostor apps (Undercover, 50 lakh+ downloads; Imposter Who?, 10M+) have **no Indian content**; reviewers
ask for Tamil. A few small apps have a Hindi or Malayalam pack, and none is built for mixed-region groups. Across
about 800 reviews the top complaints were paywalls, ads, and **the same words repeating**. Ours: Indian themes,
mixed-region fairness, every word free and offline, no repeats.

## Categories
Nine, named exactly as in `words.csv`: Food · Festivals and occasions · Around the house · Travel and places ·
Films, music and TV · Cricket and games · School and childhood · Weddings and family · **Desi life** (funny everyday
moments). Each word is marked **family** (dealt by default) or **grown-ups** (dealt with "+ Grown-ups"); nothing about
politics, religion as a joke, caste, or real people other than well-loved film and sports names.
The host can switch categories off (for example no Films for grandparents).

## How big
| Theme | Words at first release | Why |
|---|---|---|
| Multicultural | 309 in 9 categories (version 3, below) | The only theme at first; must not repeat across several evenings |
| Each regional theme (later) | about 160 (8 × 20) | Enough for 4–5 evenings of 8 rounds with no repeats |

**No word repeats within an evening**, and recent evenings' words are avoided where possible (to decide, see
`decisions.md`).

## The list: `words.csv` (version 3, 309 words)
Drafted 3 October, then checked by **nine simulated players** (persona reviewers, each judging every word as that
person would): Delhi 34, Lucknow 56, Chennai 29, Hyderabad 41, Bengaluru 27, Calicut 45, Kolkata 50, a Jain
vegetarian grandmother of 70 from Ahmedabad, and a 10-year-old in Pune. The changed rows were checked again.

| What the review found | Words | Done |
|---|---|---|
| Not known across regions (Gilli danda, Tawa, Kadai, Matka, SPB, Kishore Kumar, Sholay, Rasam…) | 16 | Dropped, or both names shown (Poha / Aval, Janmashtami / Gokulashtami) |
| Known to the adults but not the kid or the grandmother (old films and singers, new films, cricket terms, wedding rituals) | 56 | Marked **grown-ups** |
| Two meanings or touchy (Duck, Duster, Thali vs thaali, Mother-in-law, Honeymoon) | 14 | Dropped or renamed (Thali meal) |
| Hints that gave the word away ("Style" for Rajinikanth) or meant nothing (seasons differ across India) | about 40 | Rewritten; no month or season hints |
| Words everyone suggested (Coconut, Umbrella, Rain, Banana leaf meal, Gas cylinder) | 20 | Added |

**Result of version 2 (superseded by version 3 below):** 241 words in 8 categories: **185 "whole family"**, 56 "grown-ups"; 2 non-veg (off by default).
Films is the thinnest for families (11), because films split by age more than anything else.

**Biggest lesson:** age divides a family table more than region does (56 words against 16).

**Version 3, quirky and funny (owner, 3 October):** 95 more drafted, including a 9th category, **Desi life**
(everyday funny moments: Ice cream tub full of dal, Neighbour aunty, Monkey stealing food, Mummy finding it in two
seconds). The same nine reviewers also judged "does it make you smile" and "is it kind". 33 dropped as not
funny (Sneeze, Dentist), unkind or scary (Mummy's chappal, Stuck in the lift) or regional (Jugaad, Holi colour);
6 added from the reviewers' own suggestions. **Now 309 words: 239 whole family, 70 grown-ups, 2 non-veg.**

Columns: id, word, other names, category, audience (family / grownups), nonveg, difficulty, hint (Easy mode),
close cousin (for a later Undercover variant), what changed, notes.

## Who checks the words
Like the Tambola rhymes (`docs/games/tambola/rhymes.csv`), the product owner drafts each list as a sheet; the
owner approves. Simulated players are a first filter, not the last word. Before release, real readers who grew up in the
North, the South and the East, plus a grandparent and a child, each strike anything they wouldn't know. (Later, each regional theme gets a reader who grew up there.)

## Behind the scenes (for the builders later)
Each word is stored once with: the word, other names ("Payesh" for "Kheer / Payasam"), native-script spellings (later),
its themes, its category, its audience (family or grown-ups), non-veg yes/no, an Easy-mode hint, and a **close cousin** ("Idli ↔ Dosa"). The cousin isn't used now; it
lets us add the popular "Undercover" variant later (the impostor gets a similar word instead of none) without
redoing the lists. The first release ships `content/impostor/words.json` built from `words.csv` (fields and rules:
`scenarios.md` IMP-054, IMP-055).

## First samples (flavour only, not the lists; regional rows are for later)
| Theme | Food | Festivals and occasions | Around the house / life | Films, music and TV |
|---|---|---|---|---|
| Multicultural | Biryani, Dosa, Samosa, Pani puri, Gulab jamun, Kheer / Payasam | Diwali, Holi, Onam, Christmas, Eid, Birthday party | Pressure cooker, Ceiling fan, Tiffin box, Auto-rickshaw, Board exam | Rajinikanth, Shah Rukh Khan, A. R. Rahman, Baahubali, Cinema interval |
| Full Desi | Chhole bhature, Golgappe, Kachori, Kulhad chai | Karva Chauth, Raksha Bandhan, Baraat, Mehendi | Dhaba, Paan, Mela, Sasural | Sholay, DDLJ, Amitabh Bachchan, Antakshari |
| Tamil | Filter kaapi, Pongal, Jigarthanda, Murukku | Karthigai Deepam, Jallikattu, Thiruvizha | Kolam, Veshti, Marina Beach, Meenakshi temple | Rajinikanth, Vijay, Ilaiyaraaja |
| Telugu | Pesarattu, Gongura pachadi, Pulihora, Tirupati laddu | Ugadi, Bathukamma, Bonalu, Sankranti kites | Charminar, Hyderabadi Irani chai | Chiranjeevi, Pushpa, Baahubali |
| Malayalam | Sadya, Puttu and kadala, Appam and stew, Banana chips | Onam, Vishu kani, Vallam kali, Thrissur Pooram | Pookalam, Mundu, Houseboat, Kathakali | Mohanlal, Mammootty |
| Kannada | Bisi bele bath, Mysore pak, Ragi mudde, Masala dosa at a darshini | Mysuru Dasara, Ugadi, Kambala | Filter coffee, Lalbagh, Mysore Palace, Yakshagana | Dr Rajkumar, Puneeth Rajkumar, KGF |
| Bengali | Rosogolla, Mishti doi, Macher jhol, Kathi roll | Durga Puja, Pandal hopping, Poila Baishakh | Howrah Bridge, Yellow taxi, Tram, Adda | Satyajit Ray, Uttam Kumar, Rabindra Sangeet |
