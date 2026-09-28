# Tambola rhyme catalog

The rhymes are what make calling fun. The catalog is [rhymes.csv](rhymes.csv): **409 rhymes** for
numbers 1 to 90. **Approved by the owner, 28 September 2026.**

## What's in it
| Style | Language | Rhymes | What it is |
|---|---|---|---|
| classic | English | 110 | Traditional calls from British bingo and Indian Housie ("Kelly's eye", "Legs eleven") |
| indian | English | 63 | Indian-flavoured English calls ("Pack of cards", "Dil maange more", "Voting age") |
| playful | English | 69 | New rhymes written for this app ("Sixty, still nifty", "Two snowmen") |
| cricket | English | 41 | India players' shirt numbers and cricket moments ("Thala Dhoni's seven", "1983, Kapil's Devils") |
| bollywood | English | 10 | Film titles with the number in them ("3 Idiots", "Special 26") |
| festival | English | 8 | Dates and history ("Independence Day, 15 August", "Republic Day, 26 January") |
| hindi | Hindi (Roman script) | 108 | Hindi and Hinglish calls ("Teen tigaada, kaam bigaada", "Chhappan bhog", "Shagun ka lifaafa") |

Every number has at least 3 English rhymes (at least 2 of them family-friendly), at least 1 Hindi rhyme,
and at least 1 family-friendly English rhyme with an Indian reference.
Every rhyme is 40 characters or fewer, so it fits under the number and reads aloud in a breath.

## How the app uses it
- On each call, one rhyme for that number is picked **at random** from those the host's settings
  allow: language (English, Hindi or both) and the family-friendly filter (on by default).
- The pick comes from the game's seed, so a replayed game shows the same rhymes.
- **Indian references come first.** Rhymes in the indian, cricket, bollywood, festival and hindi styles
  are twice as likely to be picked as classic or playful ones (owner, 28 September 2026).
- The anchor can tap **Another rhyme** for a different one for the same number.
- Scenarios: `specs/tambola/11-rhymes.md` (TAM-150 to TAM-157).

## Choices made
- **Left out entirely:** calls that shame bodies or women ("Women get flirty", "Oversize",
  "Watch your waistline", "moti aurat"), sexual ones ("Netflix and chill", "J.Lo's bum"), and
  party-political ones ("Symbol of Congress", "Kaala dhan").
- **Kept, but not family-friendly (7):** iconic traditional calls some groups expect: "Legs eleven",
  "Two fat ladies", "One fat lady", "Dirty Gertie", "Naughty forty", "Either way up",
  "Gandhi's breakfast". They only appear when the host turns the filter off. For 88, the default is the
  modern "Wobbly wobbly".
- **UK-only references** (Heinz, Brighton line, Torquay) are kept as classics but marked in the notes;
  every number also has rhymes that land with Indian players.
- **1857** is called "the first freedom war", not "Mutiny year".

## Review checklist (done; keep for future updates)
1. **34 cricket rhymes are marked "verify"**: shirt numbers come from two cricket sites checked on
   28 September 2026 (myKhel, CricHeroes). Numbers change and players retire, so check before release.
2. **Hindi spellings** are Roman script, as people type on phones. Check they read naturally aloud;
   a Devanagari version can follow when the phone voice supports Hindi.
3. **Film and song references** marked in the notes come from memory: "Nau nau choodiyan"
   (Chandni), "Solah baras ki bali umar", "Saat samundar paar". Check the titles.
4. Read every family-friendly rhyme with a grandparent and a child in mind.
5. Change the `family_friendly` column or delete rows freely; add new rows in the same format.

## Sources
Traditional and modern calls, and the move away from offensive ones:
[Wikipedia: List of British bingo nicknames](https://en.wikipedia.org/wiki/List_of_British_bingo_nicknames),
[Mecca Bingo](https://blog.meccabingo.com/bingo-calls-complete-list/),
[WhichBingo](https://www.whichbingo.co.uk/guides/bingo-calls/),
[BingoWebsites: has bingo gone woke?](https://www.bingowebsites.org.uk/articles/what-happened-to-traditional-bingo-calls-has-bingo-gone-woke/).
Indian Tambola calls: [PartyStuff](https://partystuff.in/tambola-lingo),
[Untumble](https://www.untumble.com/blog/tambola-housie-bingo-number-rhymes-for-your-next-party/).
Cricket shirt numbers: [myKhel](https://www.mykhel.com/cricket/indian-cricket-players-jersey-number-list-from-rohit-sharma-virat-kohli-to-sachin-tendulkar-ms-dhoni-191573.html),
[CricHeroes](https://blog.cricheroes.com/indian-cricket-jersey-numbers/).
Film titles with numbers: [nitinmishra.com](https://www.nitinmishra.com/movies/number-in-movie-name).
Rhymes marked "playful" and most Hindi lines were written for this app.
