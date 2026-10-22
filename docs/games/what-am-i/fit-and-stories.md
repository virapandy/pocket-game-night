# What Am I?: fit check and player stories (product owner, draft, 22 October 2026)

Steps 0 and 0a of `docs/new-game-process.md`. Owner chose What Am I? as game four on 22 October 2026, Heads Up style,
design to start now alongside Secret Words (`docs/decisions.md`). Design only: nothing is built until Secret Words is
released (roadmap).

## The game in one paragraph
One player holds the phone to their forehead, screen facing the room. The phone shows a word ("Elephant", "Samosa",
"Sachin Tendulkar"). Everyone else gives clues, acts or sings, without saying the word. The guesser tilts the phone
down for "Got it" or up for "Pass". When the time is up the phone shows what they got and passed, and goes to the next
player. Known as Heads Up! (the phone app) and Hedbanz (the box with headbands and cards). "What Am I?" is a common
name, not a brand; we never use the Heads Up! name or look.

## Step 0: fit check
| Question | What Am I? | Pass? |
|---|---|---|
| Replaces the box? (3 October) | Yes, close to the line: the box (Hedbanz) has headbands, cards and a sand timer; the paper version needs someone to write every word, so they see them all and sit out. The phone is a hidden, fair deck, the headband and the timer. Owner: passes (22 October) | Yes |
| Works in a real room? | The whole room shouts and acts at once; the end-of-turn list of misses gets the biggest laugh | Yes, strongly |
| Starts quickly? | Pick a word pack, tap Start, first word in about 10 seconds; no names needed for a first go | Yes, the quickest of our games |
| Does a phone add something? | Words nobody has seen, the timer, tilt to mark, the count and the "what you missed" list | Yes |
| Culturally flexible? | The word packs are the game (Indian food, films, cricket, animals, jobs), held to the "known everywhere" rule (K24) | Yes |
| Degrades safely? | One phone, no internet, no sound needed. Tapping works where tilting does not | Yes |

**Three risks to design around:**
1. **The guesser can't see the screen**: every on-screen word during a turn is for the room, not the guesser. The
   guesser needs sound or a buzz, not text, to know "got it" registered and that time is nearly up.
2. **Tilt misfires**: the phone tips by accident while someone laughs, or an iPhone asks for motion permission. Tap
   must always work too, and a wrong mark must be fixable at the end of the turn.
3. **A word nobody in the room knows** kills the turn. Packs follow the known-everywhere rule, and "Pass" is free.

## Step 0a: player stories
Each persona from `docs/proposals/player-agent.md`, for every stage, plus the moments in `docs/room-moments.md`.

### First-time host
- I want to start with one pack and one tap, so that the room is laughing within a minute.
- I want a one-line "how it works" I can read aloud, so that nobody needs the rules first.
- I want the phone to tell me how to hold it (screen to the room, top of the phone up), so that the first turn isn't wasted.
- I want to play too, so that hosting doesn't mean sitting out.

### Grandparent with weak English
- I want big, simple words I can read from across the room, so that I can give clues.
- When I guess, I want a sound or buzz for each word, so that I know it counted without seeing the screen.
- I want to tap instead of tilt, so that my shaky hand doesn't mark words by mistake.
- I want my turn to feel like fun even if I get only two, so that I'm not embarrassed.

### 10-year-old
- I want words I know (animals, cartoons, food), so that I can guess and give clues.
- I want to act things out, so that I don't need many words.
- I want to see my score go up and beat my cousin, so that I want another turn.
- I want a countdown sound at the end, so that I hurry.

### Distracted host, one hand busy
- I want to hand the phone on without menus between turns: one big "Pass to Riya" button, so that it keeps moving.
- I want to stop for dinner and come back later with the scores kept (M11, M12).
- I want to pause a turn if the doorbell rings, so that the guesser doesn't lose their time.

### Competitive uncle
- I want the same time for everyone, shown, so that nobody says their turn was shorter.
- I want to fix a word that was marked wrong (a tilt when we laughed), so that the score is fair.
- I want to know if passing costs a point, so that arguments end quickly.
- I want who won tonight, so that there's a champion.

### Guest who just opened the link
- I want to join the next turn by adding my name, without the game stopping (M1, M2).
- I want to watch one turn and get it, so that I don't need the rules.

### Every game must also handle (room moments)
| Moment | What Am I?'s special case |
|---|---|
| Someone arrives mid-turn (M1) | Add them; they take a turn in the next round of turns |
| Someone must leave (M4) | Remove them between turns; their score stays on the night's result |
| Dinner mid-turn (M11) | Pause stops the clock and hides the word; "Resume" brings back the same word |
| Doorbell or a call mid-turn | Same pause; leaving the app also pauses the turn |
| A word marked wrong (tilt by accident) | At the end of the turn, tap a word to swap Got it and Passed before the score is kept |
| Someone says the word | No penalty by convention; the room just laughs and marks it passed (owner question) |
| Not enough players | Works with 2 (one guesser, one clue giver); best with 4 or more |
| Play again (M15) | Same people, new words, no word repeats tonight |
| Who won the night (M16) | Most words got, and the funniest misses |
