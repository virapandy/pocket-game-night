# Mafia: fit check and player stories (product owner, draft, 22 October 2026)

Steps 0 and 0a of `docs/new-game-process.md`. Owner asked for Mafia as the next game on 22 October 2026 ("5th game -
mafia"); it was on the 3 October shortlist (`docs/decisions.md`). Design only: nothing is built until Secret Words is
released (roadmap).

## Step 0: fit check
| Question | Mafia | Pass? |
|---|---|---|
| Replaces the box? (3 October) | Yes: without the app someone must **sit out as the moderator** all game, deal role chits, remember who is who and run every night. The phone does all of it, so everyone plays | Yes |
| Works in a real room? | It is all talk, accusing, defending and a shared reveal each morning | Yes |
| Starts quickly? | Names, one tap for roles, pass the phone: first night in about 1 minute with 8 players (longer than Impostor: every player must see a role) | Yes, just |
| Does a phone add something? | Secret, fair roles; a night where nobody can tell who woke; the Doctor's and Police's actions kept exactly; a funny "what happened last night" story read aloud | Yes, strongly |
| Culturally flexible? | Known in Indian colleges and offices; its cousin **Raja Mantri Chor Sipahi** is played with chits at home; roles can use Indian-everyday names (Police, Doctor) and stories | Yes |
| Degrades safely? | One phone, offline, passed round; no voice needed | Yes |

**Two risks to design around**, both from the convention itself:
1. **Players out early sit bored** for the rest of a long game. Fix in design: short games (small groups, few nights),
   a job for players who are out, and quick "play again".
2. **Night needs silence and closed eyes**, which families with kids find hard. Fix in design: the phone is passed so
   everyone does something at night and nobody's movement gives them away (decision M1).

## Step 0a: player stories
Each persona from `docs/proposals/player-agent.md`, for every stage, plus the moments in `docs/room-moments.md`.

### First-time host
- I want to start with just names and one tap, so that the room isn't waiting on me reading rules.
- I want the phone to tell me how many Mafia there will be and why, so that I don't have to know the ratios.
- I want a 30-second "how it works" I can read aloud, so that first-timers can play the first night.
- I want the phone to tell me what to say each morning, so that I'm not inventing it.
- I want the vote to be quick to enter (who got most fingers), so that arguing, not tapping, takes the time.
- I want to be a player too, so that hosting doesn't mean sitting out.

### Grandparent with weak English
- I want my role in one big word and a picture (Mafia, Doctor, Police, Villager), so that I know it at a glance.
- I want what to do at night in one short line ("Tap someone to protect tonight"), so that I don't hold up the phone.
- I want "out" rather than "killed", so that it feels like a game with the grandchildren.
- When I'm out, I want to know I can still watch and enjoy it, so that I don't feel sent away.

### 10-year-old
- I want my role kept secret even if I'm excited, so that I don't give it away by my face: hold to see, let go to hide.
- I want something to do at night even as a Villager, so that nobody can tell from me holding the phone longer.
- I want a short game, so that being out early isn't a long wait.
- I want a fun story in the morning, so that being caught by the Mafia is a laugh.

### Distracted host, one hand busy
- I want one big main button on every screen, so that I can run it with a plate in the other hand.
- I want to stop for dinner and come back to the same night, so that nothing is lost (M11, M12).
- I want a wrong tap on the vote to be fixable before it's final, so that the wrong person isn't put out.

### Competitive uncle
- I want the rules exact and shown (ties, can the Doctor save themselves, what Police learns), so that arguments end quickly.
- I want the phone to confirm what happened each night, so that nobody claims the moderator cheated.
- I want to see at the end who was who and what everyone did each night, so that we can relive the game.
- I want who won across several games tonight, so that there's a night champion.

### Guest who just opened the link
- I want to join the next game without the game stopping, so that I'm not left out (M1, M2).
- I want to learn by playing a Villager first, so that I'm not Mafia on my first game: decided instead (MF14): a private "New to Mafia? What this means" on every role card, since a tick would tell the room

### Every game must also handle (room moments)
| Moment | Mafia's special case |
|---|---|
| Someone arrives mid-game (M1) | Roles are dealt; they join the next game (never mid-game: it would change the Mafia count) |
| Someone must leave mid-game (M4) | They go "out" without their role being shown, or the game is redealt; if they were the last Mafia the game must still end correctly (decision M10) |
| Dinner mid-night (M11) | The night is saved at the exact step; when we come back the phone says whose turn it is to take it |
| Someone forgot their role (M19) | "See my role again" during the day, held privately; never at night out of turn |
| Wrong person took the phone at night (M17) | "Not Riya? ← Back" before anything shows |
| Someone peeked at another's role (M20) | "Deal again" before the first night only; after that, carry on and forget it (MF15) |
| Play again (M15) | Same people, new roles, one tap |
| Who won the night (M16) | Games won by the Mafia and by the Village; who was Mafia most |
