# Family play-test checklist (roadmap step 2, "1.5 Family play-test")

A hand check, not an automated test. Play **3 real Tambola games** on Android phones with family or
friends, after the 1a.1 feedback fixes are green and live. Based on the play-test kit in `docs/roadmap.md`.
Scenario IDs are there so each finding can be tied to the rule it touches; you don't need to read them.

## Before you start
- [ ] The preview link opens on the host phone: https://virapandy.github.io/pocket-game-night/
- [ ] Open it once with internet, then it works with none (TAM-064). Try at least one game in Airplane Mode.
- [ ] One host and one anchor (can be the same person), at least 6 players with paper tickets.
- [ ] Decide: real contributions, or "No money" with prize labels such as "chocolate" (TAM-090).
- [ ] Keep the suggested prizes unless someone insists (TAM-081).
- [ ] One person (not the host) notes things down during the game, with the time. A phone timer is enough.

## During each game: what to watch
| # | What to watch | Write down | Scenarios |
|---|---|---|---|
| 1 | Time from opening the app to the first number | Minutes and seconds; where the host slowed down | TAM-063, TAM-181 to TAM-183 |
| 2 | Setup: names, contribution, prizes | Anything the host had to look for, scroll to, or ask about | PLT-024, TAM-182, TAM-183 |
| 3 | Calling: can the anchor read the number and rhyme at arm's length? Can the room see it from 2 to 3 metres? | Distance, room light, who squinted | TAM-107, TAM-123, TAM-138 |
| 4 | Did the host ever scroll, or lose sight of the number? | When, and what they were doing | TAM-138 |
| 5 | Mis-taps: a number called by mistake, a wrong button, a double tap | What was tapped, what was meant, whether Undo fixed it | TAM-101, TAM-119, TAM-125 |
| 6 | Recording a win: shout, anchor checks the paper ticket, host taps "Record a win" | Did it feel natural? How long did it take? Did anyone want the app to check the numbers? | TAM-037, TAM-039, TAM-139 |
| 7 | Ties: two people shouting for the same prize | How the host added the second winner | TAM-041, TAM-145 |
| 8 | Closing a prize before the next number | Did the host understand why "Next number" waited? | TAM-126, TAM-145 |
| 9 | Bogeys | Was "Bogey: name" recorded? Did the room agree with the outcome? | TAM-037, TAM-044 |
| 10 | Rhymes | Favourite rhymes, flat ones, any that were wrong or embarrassing, English or Hindi | TAM-151, TAM-154, TAM-158 |
| 11 | The room | Anything that made the room quieter (people staring at the phone) or louder (laughing, shouting) | TAM-060 |
| 12 | The screen | Did the screen go dark during the game? | TAM-110, TAM-128 |
| 13 | Interruptions | Phone locked, a call came in, app switched: did the game come back where it was? | TAM-065, TAM-112 |
| 14 | Phone tickets | Did anyone ask to have their ticket on their own phone? | Phase 2 |
| 16 | Tickets per player | How many tickets each person wanted; did anyone ask for a 4th, or hold a ticket for someone else? (sets the limit for a later version) | TAM-045 |
| 15 | Anything else | Late arrivals who wanted to join, requests for the phone to speak, dark mode | TAM-067, TAM-180, TAM-134 |

## At the end of each game
- [ ] Ending the game: was "End game" easy to find in the menu, and its question clear? (TAM-103, TAM-124)
- [ ] The payout summary: did the amounts match what people expected? Were prizes nobody won handed back as
      people expected, per ticket? (TAM-088, TAM-089, TAM-093) Write down what people said, especially about
      "equal per ticket" versus "equal per person".
- [ ] Did the money add up when it changed hands in cash or UPI?
- [ ] "Play again": did it keep the names and prizes? (TAM-068)

## How to report
Tell the product owner in plain words, one short note per game, for example:

> Game 2, 8 players, ₹50, offline. 3 min 10 s to the first number (typing names took longest).
> Dad tapped Next number instead of Record a win once; Undo fixed it. Everyone loved "Kelly's eye".
> Nani asked if the phone could say the numbers. Payout: Asha thought unwon money should go per person.

Add a photo or screen recording if something looked wrong. Anything that stopped the game, lost it, or got
the money wrong is a **blocker**: say so first, because 1b does not start until blockers are fixed.

The product owner turns findings into decisions, scenario changes or new tests; the orchestrator runs them
through the usual loop.

## Not covered by this play-test
- iPhone: covered by the automated iPhone-sized checks only, until someone with an iPhone joins a play-test.
- Phone tickets, sessions and the tally: later phases.
