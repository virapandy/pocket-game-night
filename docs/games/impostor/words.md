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

## Categories (each theme)
Food · Festivals and occasions · Around the house · Travel and places · Films and music · Cricket and games ·
School and childhood · Weddings and family. All **family-friendly** by default; nothing about politics, religion
as a joke, caste, or real people other than well-loved film and sports names. A "grown-ups" set can come later.
The host can switch categories off (for example no Films for grandparents).

## How big
| Theme | Words at first release | Why |
|---|---|---|
| Multicultural | about 240 (8 categories × 30) | The only theme at first; must not repeat across several evenings |
| Each regional theme (later) | about 160 (8 × 20) | Enough for 4–5 evenings of 8 rounds with no repeats |

**No word repeats within an evening**, and recent evenings' words are avoided where possible (to decide, see
`decisions.md`).

## Who checks the words
Like the Tambola rhymes (`docs/games/tambola/rhymes.csv`), the product owner drafts each list as a sheet; the
owner approves. For Multicultural, readers who grew up in the North, the South and the East each strike anything they
wouldn't know. (Later, each regional theme gets a reader who grew up there.)

## Behind the scenes (for the builders later)
Each word is stored once with: the word, other names ("Payasam"), native-script spellings, its themes,
its category, family-friendly yes/no, and a **close cousin** ("Idli ↔ Dosa"). The cousin isn't used now; it
lets us add the popular "Undercover" variant later (the impostor gets a similar word instead of none) without
redoing the lists.

## First samples (flavour only, not the lists; regional rows are for later)
| Theme | Food | Festivals and occasions | Around the house / life | Films and music |
|---|---|---|---|---|
| Multicultural | Biryani, Dosa, Samosa, Pani puri, Gulab jamun, Kheer / Payasam | Diwali, Holi, Onam, Christmas, Eid, Birthday party | Pressure cooker, Ceiling fan, Tiffin box, Auto-rickshaw, Board exam | Rajinikanth, Shah Rukh Khan, A. R. Rahman, Baahubali, Cinema interval |
| Full Desi | Chhole bhature, Golgappe, Kachori, Kulhad chai | Karva Chauth, Raksha Bandhan, Baraat, Mehendi | Dhaba, Paan, Mela, Sasural | Sholay, DDLJ, Amitabh Bachchan, Antakshari |
| Tamil | Filter kaapi, Pongal, Jigarthanda, Murukku | Karthigai Deepam, Jallikattu, Thiruvizha | Kolam, Veshti, Marina Beach, Meenakshi temple | Rajinikanth, Vijay, Ilaiyaraaja |
| Telugu | Pesarattu, Gongura pachadi, Pulihora, Tirupati laddu | Ugadi, Bathukamma, Bonalu, Sankranti kites | Charminar, Hyderabadi Irani chai | Chiranjeevi, Pushpa, Baahubali |
| Malayalam | Sadya, Puttu and kadala, Appam and stew, Banana chips | Onam, Vishu kani, Vallam kali, Thrissur Pooram | Pookalam, Mundu, Houseboat, Kathakali | Mohanlal, Mammootty |
| Kannada | Bisi bele bath, Mysore pak, Ragi mudde, Masala dosa at a darshini | Mysuru Dasara, Ugadi, Kambala | Filter coffee, Lalbagh, Mysore Palace, Yakshagana | Dr Rajkumar, Puneeth Rajkumar, KGF |
| Bengali | Rosogolla, Mishti doi, Macher jhol, Kathi roll | Durga Puja, Pandal hopping, Poila Baishakh | Howrah Bridge, Yellow taxi, Tram, Adda | Satyajit Ray, Uttam Kumar, Rabindra Sangeet |
