# Mafia: a short guide (draft, 22 October 2026)

Step 1 of `docs/new-game-process.md`. Fit check and player stories: `fit-and-stories.md`. Open rule questions for the
owner: `questions-2026-10-22.md` (M1–M13); all decided as recommended on 22 October (MF1–MF13 in `docs/decisions.md`).
Once scenarios exist, `scenarios.md` wins wherever it differs from this file.

## Overview
A few players are secretly the **Mafia**; everyone else is the **Village**. Each **night**, the Mafia quietly pick one
player to put out, the **Doctor** picks one player to protect, and the **Police** checks one player. Each **morning**
the phone tells the room what happened, and the room argues, accuses and votes one player out. The Village wins when
every Mafia is out; the Mafia win when they are as many as everyone else.

- **Other names:** Werewolf, Ultimate Werewolf, Town of Salem (online). Indian cousins: Raja Mantri Chor Sipahi (chits,
  points, nobody goes out) and Chor Police.
- **Origin:** Dmitry Davidoff, Moscow, 1986; the werewolf theme by Andrew Plotkin, 1997. The rules are a folk game.
- **Players:** 5 to 16 (convention: at least 6; apps allow 4–5); best with 7 to 11. **Time:** about 15 minutes with 7–10
  players, 30 with 10–15. An evening is 2 to 4 games.
- **Suits:** ages about 10 and up as convention; younger with the kids' wording and a grown-up nearby.

## What you need
Without the app: a moderator who **sits out the whole game**, role chits or cards, and the moderator's memory of every
night. **With the app: one phone.** Nobody sits out, roles are fair, every night is recorded exactly.

## How to play
1. Type the names (or keep tonight's). The phone says how many Mafia there will be (M5).
2. **Deal: pass the phone round.** Each player holds to see their role, lets go, taps "Done", passes on. Mafia also see
   who the other Mafia are.
3. **Night** (M1): the phone is passed round once more. Everyone does the same thing: tap to see their night job, pick a name, tap Done, pass.
   Mafia pick who to put out, the Doctor who to protect, the Police who to check (and see "Mafia" or "Not Mafia");
   Villagers pick who they suspect. Nobody can tell from the time or taps who is who.
4. **Morning:** the host reads the phone's short story aloud: who is out, or that the Doctor saved someone (without
   saying who the Doctor is).
5. **Day:** talk it over. Then "3, 2, 1, point!"; the host enters the player with most fingers. Tie: one re-vote
   between the tied; still tied, nobody is out (M6). The room may also choose "Nobody today" (M12).
6. The player voted out shows their role (M3). If that ends the game, the phone says who won; otherwise night again.
7. **Game over:** every role is shown, with each night's picks, and "Play again" with new roles.

## Rules
| # | Rule | Convention (source) | Ours? |
|---|---|---|---|
| 1 | Night comes first | Plotkin's rules; Wikipedia | |
| 2 | Roles: Mafia, Doctor, Police, Villagers | The classic four (Wikipedia; gameonfamily) | "Police" for Detective (M4) |
| 3 | Number of Mafia from the player count: 5–8 → 1, 9–12 → 2, 13–16 → 3; host may change it by one (MF5, MF16) | About 1 in 3 to 1 in 4 (Davidoff; gameonfamily; event guides) | Exact table ours |
| 4 | A Doctor from 5 players, the Police from 6; with 5: one Mafia, a Doctor and three Villagers (MF17) | Small tables usually drop both (apps) | Doctor at 5: ours, from the balance check |
| 5 | Mafia must agree on one name at night | Unanimous (Wikipedia) | How they agree with one phone: M1 |
| 6 | Doctor may protect anyone, but not the same player two nights running; themselves once a game (M7) | Self-save allowed, same player twice barred (Wikipedia) | Self "once a game": ours |
| 7 | Police learns only "Mafia" or "Not Mafia"; it stays private | Alignment only (Wikipedia) | |
| 8 | A player voted out shows their role (M3) | Both exist; shown is the usual live play (gameonfamily) | |
| 9 | Tie: one re-vote between the tied; still tied, nobody out (M6) | No standard (Wikipedia: by lot) | Ours, as Impostor |
| 10 | "Nobody today" is allowed (M12) | Optional variant (Wikipedia) | |
| 11 | Village wins when every Mafia is out; Mafia win when they equal or outnumber the rest | Parity (Wikipedia) | |
| 12 | Players who are out don't talk or signal; they watch (M11: plus a private guess) | Wikipedia; Ghost Mode in an open-source app | Guess: ours |
| 13 | "Out", never "killed" (M2) | "Tagged out" house rule for kids (gameonfamily) | |

## Variants we know of (not in the first release)
One Night (single night, nobody sits out, under 10 minutes; Bezier); Open Mafia (small groups); Quickfire Mafia (shorter
days); hidden roles on elimination; extra roles (Joker, Bodyguard); voice narration from a phone on the table (M1 B).

## What we do differently from other Mafia apps
Other moderator apps either speak the night aloud from one phone on the table (One Night's app) or need a phone each.
**None we found passes one phone round at night with every role doing the same thing** (research, 22 October), so the
night needs no silence, no closed eyes and no sound: a real opening for families. Plus: Indian-everyday role names, a
funny morning story, a job for players who are out, and the night's results kept for "who won tonight".

## How Pocket Game Night plays it
- **The phone does:** count the Mafia, deal roles, run the night privately, apply Doctor and Police rules, tell the
  morning story, count down the vote, check who won, show the whole game at the end, keep tonight's tally.
- **The room does:** the talking, accusing, defending and pointing.
- **One phone is enough**; phones for each player could come later, as with Impostor.

## Sources (opened 22 October 2026)
- Wikipedia, Mafia (party game): https://en.wikipedia.org/wiki/Mafia_(party_game)
- Wikipedia, Werewolf (social deduction game): https://en.wikipedia.org/wiki/Werewolf_(social_deduction_game)
- Game On Family, How to play Mafia: https://gameonfamily.com/blogs/tutorials/mafia
- The Board Game Family, One Night Ultimate Werewolf review: https://theboardgamefamily.com/?p=16598
- Mafia Moderator (App Store): https://apps.apple.com/app/id1139338408
- Werewolves game (F-Droid, open source): https://f-droid.org/en/packages/io.github.davidchilin.werewolves_game
- Wikipedia, Raja Chor Mantri Sipahi: https://en.wikipedia.org/wiki/Raja_Chor_Mantri_Sipahi
- Not reached yet: BoardGameGeek threads, Bezier's rules PDF, Play Store reviews. A second research pass covers them
  before scenarios (step 8), with app reviews for role leaks at night.

## Contract check (first look; step 7 later)
| Question | Mafia's answer |
|---|---|
| Setup | Players in seat order, Mafia count, roles on/off, Doctor self-protect rule, new-player ticks, role seed |
| Legal moves | Seen my role · night pick (a name, per player in turn) · story read · vote result (a name, tie, nobody) · re-vote · player leaves · see my role again · play again · end game: finite |
| Apply | Pure; the night resolves after the last player's pick |
| View | During the deal and night only the holder's role and options; the host screen never shows a role until it is revealed |
| Game over | All Mafia out, or Mafia ≥ the rest |
| Invariants | Exactly the set Mafia; one Doctor and one Police (6+); Doctor never protects the same player two nights running; nobody out acts; the game always ends |
| Undo | The vote entry before confirming only; never a night pick once passed on |
| Secrets | Roles from their own seed; night picks never shown until the end |
