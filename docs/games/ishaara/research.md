# Ishaara: research (4 October 2026)

Product owner, for the owner. **Ishaara** ("a hint") is our Codenames-style team word game (name decided by the owner, 4 October,
decision K1). We follow the conventions of Codenames but use **our own name, our
own words and our own look**, never theirs.

Three research passes ran in parallel on 4 October 2026: the official rules, existing apps and their reviews, and
what real players say. **Access limits:** Reddit refused automated reading; BoardGameGeek threads returned
"forbidden", so BGG appears only through search snippets and thread titles; Google Play listings would not load in
full, so Play reviews come from search snippets and App Store pages. **[Inference]** marks our own reasoning.

## 1. Fit check (process step 1)
| Question | Answer |
|---|---|
| Does it work in a real room? | Yes: two teams arguing over which words the clue meant is the whole game |
| Can it start quickly? | Yes, once dealt: the phone deals the 25 words and the secret map in one tap (the box takes 2–3 minutes) |
| Does a phone add something? | **Yes, it replaces the box**: 25 word cards, 40 key cards and the stand, 25 cover tiles, the sand timer, and the counting of words left. It also ends key-card orientation mistakes and repeated words |
| Is it culturally flexible? | Yes: the words are the content; ours are India-centric and fair to mixed-region groups |
| Can it degrade safely? | Yes: one phone is enough; with no phone, write 25 words on paper and draw a map |

Passes the "replaces the box" test (`docs/decisions.md`, 3 October): Codenames needs a box of cards, a key card and
tiles. Shortlisted by the owner on 3 October.

## 2. The rules, by convention (sources opened 4 October 2026)
Full rule book: `guide.md`. The facts it rests on:
| Fact | Convention |
|---|---|
| Board | 25 words in a 5 × 5 grid |
| Split | Starting team 9 words, other team 8, 7 bystanders (ours: "nobody's words"), 1 assassin (ours: the **Bhoot**) |
| Who starts | Shown on the key card; the starting team has 9 |
| Clue | One word plus one number; the number says how many words it links |
| Guesses | At least one; after each right guess, carry on up to **number + 1**; stop any time |
| Results | Own word: carry on. Bystander: turn ends. Other team's word: it counts for them, turn ends. Assassin: that team **loses at once** |
| Win | All your words found, even if the other team turns over your last word |
| Clue rules | About meaning, not letters or position; no form or part of a word still on the board; English, plus foreign words "your group would use in an English sentence"; **the other spymaster judges** ("if no one notices, it counts") |
| Bad clue | Turn ends; the other spymaster covers one of their own words |
| Expert clues | **0** ("none of ours are about this": guess freely, at least one) and **unlimited** |
| Timer | Sand timer "not used very often"; anyone may flip it on a slow player |
| Players | 4 or more, two teams of similar size and skill; 6 (3 v 3) called the best; 2–3 players: a co-op variant |
| Next game | New key, new words; "Do other people want a chance to be spymasters?" |
| Length | 15–30 minutes a game; families play "about eight games" in an evening |
| Word pool | 400 words (200 double-sided cards) in the base box |

Variants: **Duet** (2 players, co-op, double-sided key, 9 turns), **Pictures** (5 × 4 grid, 8/7/4/1), **Disney Family**
(easy mode: 4 × 4 grid with **no assassin**, for ages 8+; exact neutral count unconfirmed), Deep Undercover (adult words).

## 3. Existing apps (what to copy, what to avoid)
| App | How the spymaster sees the key | Good | Bad |
|---|---|---|---|
| Codenames Online (CGE, web) | Their own browser | No sign-up, one link | Needs internet; built for remote play |
| Horsepaste (fan, web) | Any device taps "Spymaster" | "Cards left" always shown; full key at the end with unguessed words faded; one-tap next game | **Anyone can tap Spymaster by mistake** and spoil the game; red/blue only |
| **CODENAMES Companion** (CGE app) | Key card generated on a phone; **several phones synced by a short code** | Exactly "board on the table, key on the phone" | Rated 3.2: the hide-when-laid-flat feature misfires; sync glitches |
| Codenames App (CGE, 2024, paid) | Own device; pass-and-play on one phone | Team colour shows whose turn it is; 0 and ∞ allowed; no ads; 4.7 stars | Online, slow 24-hour turns |
| Secret Agent (clone) | **A second phone as the spymaster screen, paired by QR** | QR pairing; a recap at the end | Pushes payment; assumes you know the rules |
| Key-card generators (open source) | **A 4-character code gives the same key on every phone** | No server, no internet | No board, no counting |
| Codewords (TheWordFinder) | Spymaster icon under the board | A separate TV/table view; family words; kept clear of the name | Web only |

Review themes: praise for random balanced keys, no sign-up, a key view that **highlights the words** (easier than
matching a printed card), one-time price. Complaints: ads and paywalls, sync glitches between phones, unreliable
auto-hide, unclear for newcomers, needs internet, red/blue only (colour-blind players), tiny text in a 5 × 5 grid.

**Patterns we take:** a code or QR that rebuilds the same key on another phone with no network (Tambola's ticket QR
already does this); hold-to-see on one phone (Impostor's deal already does this); the clue said aloud, only the number
tapped; a big "guesses left" counter that counts the +1; whose turn shown by team colour **and** name; words left per
team always on screen; the full key at the end with unfound words faded; one-tap "Play again" that rotates the clue
giver; **pick, then confirm** before a word is turned over.
**Pitfalls we avoid:** a spymaster switch anyone can tap; colour alone; hide-when-flat; accounts, internet, ads; tiny
text; assuming players know the game; the Codenames name, words, beige-card look and the words "spymaster", "agent",
"assassin".

## 4. What real players say
- **Fun:** the team debate and the jolt when a clue lands; fun "even better when you're losing" (Shut Up & Sit Down).
- **Slow clue givers** are the top complaint; most groups rarely use the sand timer; the rulebook's fix: give a clue for
  your hardest word and keep thinking.
- **Tells:** first-time spymasters and kids under about 14 give answers away with their faces.
- **Clue arguments** vary group to group (rhymes, spellings, two-word names); the advice is "ask the other spymaster".
- **Quiet players and the loudest voice:** at 8–10 players one person decides and half the room goes passive.
- **Group size:** 6 (3 v 3) best; 4 works; 2–3 not recommended (Duet instead); 9+ suggests two tables.
- **Families:** box says 14+, but 8–13-year-olds do well as guessers and struggle more as clue givers; check all 25
  words before starting; families allow simpler play (4 × 4 grid, no assassin, two-word clues).
- **Words:** non-American players stumble on US words (PEWTER, Shirley Temple). India: **Codenames India Edition**
  (CGE via Boardway, 400 words, about ₹1,900), Desi-pher (online, Bollywood), an open-source Hindi-films fork.
- **Hinglish:** the official rule already lets in words used in an English sentence, so chai, jugaad and dhaba are fine.
- **Scoring:** casual groups tally wins informally; there is no sourced best-of-3.
- **Box pains a phone fixes:** setup and reset, key-card orientation mistakes, counting words left, a sand timer that
  is too long or ignored, repeated words with regular groups.
- **The assassin** is mostly loved for the tension; some find it a cheap ending. Show the full key afterwards so the
  room can laugh at near-misses.
- **Duet:** liked by couples; less lively than the team game.

## 5. Ten lessons for our design (with Tambola and Impostor)
| # | Lesson | Where it lands |
|---|---|---|
| 1 | The key never leaks: one phone uses Impostor's hold-to-see; own phones use a code like Tambola's tickets. No "spymaster" switch on the board | `guide.md` rule 3, decision K3 |
| 2 | The board must be readable by guessers leaning in: landscape first, words of at most 8 letters, a 4 × 4 Family board | `ux.md` screens 6–7, decision K5 |
| 3 | The phone counts: words left, guesses left (+1), whose turn | `ux.md` screen 7 |
| 4 | Turning a word over is pick, then confirm (guideline 47) | `ux.md` screen 7 |
| 5 | Clue rules are shown in plain words and judged by the room; the app never polices a spoken clue | `guide.md` rules 6–8 |
| 6 | Timer off by default; a 90-second "hurry up" timer anyone may start; it never moves on by itself (guideline 48) | decision K8 |
| 7 | Rotate the clue giver every game; light tally of the night | decision K9 |
| 8 | The Bhoot is a laugh, not a humiliation; Family board has no Bhoot | `ux.md` tone, decision K6 |
| 9 | Our own India-centric words, fair to every region, tagged family / grown-ups, no repeats in an evening | `words.md`, decision K10 |
| 10 | Design every phone (host, clue givers' own phones, guests) and every stage before any build | `lifecycle.md` |

## Sources (opened 4 October 2026 unless marked)
**Rules:** official CGE rulebook (July 2015), read in full from https://cdn.1j1ju.com/medias/89/5e/99-codenames-rule.pdf
(CGE's own link returns 404) · official Duet rulebook, https://cdn.1j1ju.com/medias/de/45/03-codenames-duet-rulebook.pdf ·
https://en.wikipedia.org/wiki/Codenames_(board_game) · https://www.ultraboardgames.com/codenames/valid-clues.php ·
https://www.ultraboardgames.com/codenames/codenames-pictures.php · https://www.ultraboardgames.com/codenames/disney-family-edition.php ·
https://www.geekyhobbies.com/codenames-rules/ · https://www.thefamilygamers.com/codenames-disney/ ·
https://www.codenamesgame.com/news/the-story-behind-codenames-a-game-of-words-wits-and-worldwide-success
**Apps:** https://codenamesgame.com/play-online · https://github.com/jbowens/codenames/issues/10 ·
https://apps.apple.com/us/app/codenames-companion/id1032754439 · https://apps.apple.com/us/app/codenames/id1055650930 ·
https://faq.codenamesapp.com · https://apps.apple.com/ca/app/secret-agent-game/id1568454272 ·
https://thewordfinder.com/codewords · https://github.com/harid001/speednames · https://github.com/salcode/codenames-keycard ·
https://github.com/jbowens/codenamesgreen
**Players:** https://www.shutupandsitdown.com/review-codenames/ · https://jlericson.com/2024/02/15/codenames.html ·
https://oneboardfamily.com/review-codenames/ · https://www.kingpandagames.com/codenames-review/ ·
https://www.kingpandagames.com/codenames-how-many-players/ · https://whatsericplaying.com/2016/02/21/30-codenames/ ·
https://www.meeplemountain.com/articles/games-we-love-codenames/ · https://slate.com/human-interest/2018/11/best-family-games-codenames-rules.html ·
https://www.theboardgamefamily.com/2016/01/codenames-party-game-review/ · https://www.mummyfromtheheart.com/2017/08/review-codenames-board-game.html ·
https://www.geekyhobbies.com/codenames-disney-family-edition-board-game-review-and-rules/ · https://flameeyes.blog/2016/12/07/codenames-review/ ·
https://www.funcorp.in/products/codenames-the-india-edition-word-board-game-8594156310318 · https://www.subtlecurrygames.com/ ·
https://github.com/captn3m0/codenames · https://zatu.com/codenames-duet-review/
BoardGameGeek (titles and snippets only): threads 1845817 (key card orientation), 1979914 (key generators), 2846054 (zero clue).
