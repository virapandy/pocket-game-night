# Ishaara: the rule book (draft, 4 October 2026)

Exact screens, wording and numbers for the build are in `scenarios.md`; where this file differs, `scenarios.md` wins.
Evidence: `research.md`. Look and screens: `ux.md`. The whole evening: `lifecycle.md`. Decisions: K1–K18 in
`docs/decisions.md`. Rules marked **ours** differ from the convention; every other rule is the convention.

## Overview
Two teams, **Team Mango** and **Team Peacock**, race to find their secret words among 25 words on the phone. In each
team one player, the **clue giver**, sees the **secret map**: which words are Mango's, which are Peacock's, which are
nobody's, and which one is the **Bhoot**. The clue giver says **one word and a number** ("Cricket, 3!") to point their
team at several of their words at once. The team talks it over and turns words over one at a time. Find all your
words first and you win; wake the Bhoot and you lose at once.

- **Inspired by:** Codenames (Vlaada Chvátil, Czech Games Edition, 2015). Close cousins: Codenames Duet, Pictures.
  Our name, words, team names and look are our own; only the rules, which are common to the genre, follow it.
- **Players:** 4 to 20; best with 6 to 8 (3 or 4 a side). **Time:** about 15 minutes a game; an evening is 3 to 6 games.
- **Suits:** ages about 8 and up as guessers, 12 and up as clue givers; families, friends, mixed regions.

## What you need
Without the app: 25 word cards, a key card for the clue givers, 25 cover tiles, a sand timer, and someone to set it
all out. **With the app: one phone** (or one phone plus the clue givers' own phones). The phone deals the words and
the map, turns words over, counts words and guesses left, and keeps the night's tally.

## How to play
1. **Teams.** Split into Mango and Peacock (the phone can shuffle). Each team picks a clue giver; the phone suggests
   one and gives everyone a turn over the evening.
2. **Deal.** The phone lays out 25 words and secretly picks which team starts. The starting team has **9** words,
   the other **8**; **7** are nobody's; **1** is the Bhoot.
3. **The clue givers see the map** privately: by holding the phone (one phone), or on their own phones after scanning
   the host's map QR.
4. **Clue.** The starting team's clue giver says one word and one number, for example "Monsoon, 2". They tap the
   number on the phone. No other hints, no faces, no pointing.
5. **Guess.** The team talks it over, picks a word on the phone and confirms it. The phone turns it over:
   - **Your team's word:** well done, guess again if you have guesses left.
   - **Nobody's word:** your turn ends.
   - **The other team's word:** it counts for them, and your turn ends.
   - **The Bhoot:** your team loses at once.
6. You must make **at least one** guess. You may take up to **the number + 1** guesses (the extra one lets you catch up
   on an earlier clue). You may stop whenever you like with "End our turn".
7. Teams take turns until one team has found all its words (it wins, even if the other team turned over its last word)
   or a team wakes the Bhoot (the other team wins).
8. **Play again:** new words, a new map, the next clue givers.

## Rules
| # | Rule | Convention | Ours? |
|---|---|---|---|
| 1 | Board of 25 words, 5 × 5: starting team 9, other team 8, nobody's 7, Bhoot 1. The starting team is random each game | CGE rulebook | Names: ours |
| 2 | **Family board** (a choice): 16 words, 4 × 4: starting team 6, other team 5, nobody's 5, **no Bhoot** | Disney Family easy mode (4 × 4, no assassin; its exact split unconfirmed) | Split: ours |
| 3 | Only the clue givers ever see the map. **One phone:** the clue giver takes the phone and holds or taps to see the map, then puts the phone in the middle. **Own phones:** each clue giver scans the host's map QR (or types its code) at the start of each game | Companion app, key generators; Impostor's private reveal; Tambola's ticket QR | How: ours |
| 4 | A clue is **one word and one number**. The number is **0 to 9**, or **∞** ("as many as you like") | CGE rulebook incl. expert clues | |
| 5 | Guesses: at least 1; up to number + 1 for 1–9; **unlimited** for 0 and ∞ | CGE rulebook | |
| 6 | The clue must be about **meaning**: not about letters, spelling, the number of letters, or where a word sits on the phone | CGE rulebook | |
| 7 | The clue may not be a word on the board **still face down**, or a form or part of one (while CRICKET is face down: no "cricketer"; while RAILWAY is: no "rail"). Once a word is turned over, it is free to use | CGE rulebook | |
| 8 | **Language:** an English word, or any word your group would use in an English sentence: chai, jugaad, dhaba, yaar are fine. A whole group may agree to allow Hindi or another shared language | CGE rulebook ("strudel" rule) | Example words: ours |
| 9 | Names of people, places, films and songs are allowed, including two-word ones like "Taj Mahal" or "Sholay"; made-up names are not | CGE flexible rules | Two-word names allowed by default: ours |
| 10 | Rhymes, sounds-like and spelling out are allowed only when they point to meaning; a clue giver may spell their clue if asked | CGE rulebook | |
| 11 | No extra hints: no faces, no "this one's a stretch", no pointing, no reacting while the team guesses | CGE rulebook | |
| 12 | **Who judges a clue:** the other team's clue giver. If nobody objects before the first guess, the clue stands | CGE rulebook | |
| 13 | **A clue that breaks a rule:** the turn ends at once, and **the phone turns over one of the other team's words, picked at random** | CGE: the other spymaster covers a word of their choice | Random pick: **ours** (no map on the room screen) |
| 14 | A team wins when all its words are turned over, by either team | CGE rulebook | |
| 15 | Turning over the Bhoot: that team loses at once | CGE rulebook | Name: ours |
| 16 | **Timer:** none by default. Anyone may start a **90-second "hurry up" timer** on a slow clue giver or team. When it runs out, the clue giver must give a clue (the rulebook's advice: clue your hardest word and keep thinking); the team must guess or end its turn. The phone never ends a turn by itself | CGE sand timer (about 1.5 min) | Never automatic: ours (UX guideline 48) |
| 17 | **Clue givers rotate:** each new game suggests, for each team, the player who has been clue giver least often tonight (ties: the earliest in that team's list) | CGE: "do other people want a chance?" | Rotation rule: ours |
| 18 | Teams of similar size; uneven by one is fine; at least 2 per team (a clue giver and a guesser) | CGE rulebook | Minimum per team stated: ours |
| 19 | A word turned over can't be turned back (it was confirmed first). Undo exists only for team moves and removing a player | Touching a card is final (CGE) | Pick-then-confirm: ours (UX guideline 47) |

## Choices asked at the start (their default first; later games start from the last-used values on this phone)
| Choice | Options | Why |
|---|---|---|
| **How clue givers see the map** | "Pass this phone" · "Clue givers' own phones" (two equal cards, **no default**) | Both are fair; it depends on how many phones are free (like paper or phone tickets) |
| **Board** | **Full: 25 words** · Family: 16 words, no Bhoot | Family for kids and first-timers (Disney easy mode) |
| **Words** | **Whole family** · + Grown-ups | As Impostor (`words.md`) |
Timer and the clue rules are not setup choices: the hurry-up timer is always one tap away, and the clue rules are the
room's to judge.

## Scoring
None inside a game: a game is won or lost. **Tonight's tally** counts games won by each team colour
("Tonight: Mango 2 · Peacock 1"), plus fun lines at the end of the evening (most games won as clue giver, the Bhoot
count). No points, no target: the evening ends when the host ends it. (Sources: no scoring across games in the rules;
casual groups tally wins informally, `research.md`.)

## Variants (not in the first release)
- **2 or 3 players, together against the phone** (official co-op variant): one team; after each of its turns the phone
  turns over one word of the "other team". Score = their words still face down. Duet-style play comes with it.
- **Picture boards** for small children who can't read yet.
- **Regional word themes**, as Impostor's (`docs/games/impostor/words.md`): Tamil, Bengali, Full Desi and others.
- **"My pick" on players' own phones** so quiet players get a voice: needs connected mode (Phase 6).
- **Board on the TV** (cast the room screen).

## How Pocket Game Night plays it
- **The phone does:** deals 25 (or 16) fair words never used tonight, makes the map, shows the map only to clue
  givers, takes the clue's number, counts guesses (+1) and words left, turns words over after a confirm, ends the turn
  when it must, announces the winner, shows the whole map at the end, rotates clue givers, keeps the night's tally.
- **The room does:** says the clues, argues, judges clue rules, keeps straight faces.
- **One phone is enough.** Clue givers' own phones are optional and work **without internet**: the map is rebuilt
  from the code in the QR.

## Contract check (for the builders)
| Question | Ishaara's answer |
|---|---|
| Setup | Players, teams (Mango list, Peacock list), clue giver per team, map mode, board size, words audience, excluded words (used tonight), board seed |
| Legal moves | show map (one phone) · give clue (number 0–9 or ∞) · pick word · reveal picked word · end turn · clue broke a rule · start/stop hurry-up timer · next team's turn · play again · change teams · change clue giver · end the evening: a finite list |
| Apply | Pure: each move gives the next state |
| View | Room view: words, turned-over colours, whose turn, clue number, guesses left, words left. **Map view: clue givers only.** The room view never contains the map of a face-down word (not in the page at all) |
| Game over | A team's words all turned over, or the Bhoot turned over |
| Invariants | Exactly 9/8/7/1 (or 6/5/5/0); the starting team has the larger count; guesses never exceed number + 1; at least one guess before "End our turn"; no word repeats in an evening; the same code always rebuilds the same board and map |
| Undo | Not for reveals (pick, then confirm); only team moves and shuffles on "Make teams", and removing a player |
| Secrets | The board and map come from the map code (edition, board size, audience, deal index, deck seed, check symbol), so any phone rebuilds the same board offline; scenarios ISH-022 to ISH-028 |
