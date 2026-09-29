# Tambola rhyme catalog

The rhymes are what make calling fun. The catalog is [rhymes.csv](rhymes.csv): **404 rhymes** for
numbers 1 to 90. **Approved by the owner, 28 September 2026.**

## What's in it
| Style | Language | Rhymes | What it is |
|---|---|---|---|
| classic | English | 110 | Traditional calls from British bingo and Indian Housie ("Kelly's eye", "Legs eleven") |
| indian | English | 86 | Indian-flavoured English calls ("Pack of cards", "Dil maange more", "Voting age") |
| playful | English | 48 | New rhymes written for this app ("Sixty, still nifty", "Two snowmen") |
| cricket | English | 26 | India players' shirt numbers and cricket moments ("Thala Dhoni's seven", "1983, Kapil's Devils") |
| bollywood | English | 8 | Film titles with the number in them ("3 Idiots", "Special 26") |
| festival | English | 9 | Dates and history ("Independence Day, 15 August", "Republic Day, 26 January") |
| hindi | Hindi (Roman script) | 109 | Hindi and Hinglish calls ("Teen tigaada, kaam bigaada", "Chhappan bhog", "Shagun ka lifaafa") |

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

## Revision 2, 29 September 2026 (owner: "the cricket ones are substandard; make them punchy and wacky")
Product owner's critical review, and what changed:
- **Cricket, rewritten.** 30 of 41 were "[player]'s jersey": facts, not calls, with obscure players and
  numbers that change. Now 35 punchy calls built on moments, nicknames and slang that don't go out of date:
  "Thala for a reason!", "Yuvi's six sixes: thirty-six!", "Twenty-two yards of drama!", "83! Kapil lifts the
  Cup!", "Twelfth man, bring the drinks!", "Nervous nineties! Ninety!". **Shirt numbers only for the top three
  players** (owner): Dhoni 7, Sachin 10, Kohli 18. Every other cricket call is about the game itself or a
  historic moment: "Forty-two, rain stops play, boo!", "Seventy-seven, no-ball! Free hit!", "Forty-five, DRS
  review, stay alive!", "2011: Dhoni finishes with a six!", "Yuvi's six sixes: thirty-six!".
- **Playful filler replaced.** Most followed one template ("Sixty-one, having fun") and endings repeated
  across numbers ("…heaven" 6 times, "don't be late" 3, "still alive" 3). Now no English ending repeats,
  and most replacements are desi and wacky: "Twenty-eight, Bangalore traffic, wait!", "Thirty-seven, cooker
  whistle blown!", "Aunty's age: always twenty-nine", "Sixty-five, senior citizen discount!".
- **Flat ones fixed:** "Nine, feeling fine" is now "Navratri, nine nights of garba"; "Dus, the film" is now
  "Dus bahane, dus!"; "83, the film" and the obscure "36 Chowringhee Lane" are gone. New for 2: "Two! Run like
  Dhoni" and, in Hindi, "Kitne aadmi the? Do, Sardar!" (Sholay).
- **Avoided on purpose:** "Chinaman" (a term cricket itself dropped in 2017), "56-inch chest" (political),
  match-fixing jokes.
- Every rule still holds: at least 3 English rhymes per number (2 family-friendly), at least 1 Hindi, at
  least 1 family-friendly English rhyme with an Indian reference, at most 40 characters, no repeats.

## Revision 3, 29 September 2026 (owner: "the new ones are also bad, they don't make sense")
The rule for every call now: **the number and the phrase must link instantly**, by a rhyme, a fact, a
shape or a famous moment. Revision 2 had forced cricket situations onto numbers with no link ("Required
rate eight", "Nineteenth over"); all 14 of those are gone. Cricket is now 26 calls, each with a real link:
- the number *is* the cricket thing: 4 "Chauka! Kissed the rope", 6 "Maximum!", 3 "Hat-trick!", 5 "Five-for!",
  12 "Twelfth man, bring the drinks!", 20 "T20", 22 "Twenty-two yards of drama!", 44 "two chaukas",
  50 "Fifty! Raise the bat", 66 "back-to-back sixes", 90 "Nervous nineties!", 87 "cricket's unlucky number"
- the number is a year India won: 11 (2011 World Cup), 13 (2013 Champions Trophy), 24 (2024 T20 World Cup),
  25 (2025 Champions Trophy), 83 (1983 World Cup)
- a famous moment: 36 "Yuvi's six sixes"; shirt numbers only for 7 Dhoni, 10 Sachin, 18 Kohli
Numbers that lost a forced cricket call got a plainly linked line instead, for example 17 "Seventeen, board
exam scene!", 19 "Nineteen, college canteen!", 35 "Thirty-five and single? Aunties arrive!".

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
1. **Cricket shirt numbers** now appear only for Dhoni 7, Sachin 10 and Kohli 18 (all long-standing);
   the old note about 34 rhymes marked "verify" no longer applies.: shirt numbers come from two cricket sites checked on
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
