# Connected mode (Phase 6, only if play-tests justify it)

Optional, off by default. When the phones have internet, a small relay can carry moves between the
host and players. The host phone stays the referee, and the game always falls back to Phase 2 play.

## TAM-200: Connected mode is optional and never needed to start
Status: draft
Phase: Phase 6
Then every game can start and finish with connected mode off
And connected mode is off by default, and turning it on shows a one-time warning (TAM-062)

## TAM-201: Called numbers appear on every connected phone
Status: draft
Phase: Phase 6
Given connected mode is on
When the host calls a number
Then every connected player's phone shows it within 2 seconds on a normal connection

## TAM-202: Auto-mark is a separate choice
Status: draft
Phase: Phase 6
Given connected mode is on
Then players still mark their own tickets unless the host also turns on "Auto-mark", with its warning

## TAM-203: The Claim button sends a claim to the host
Status: draft
Phase: Phase 6
Given the host has turned on "Claim button" (with its warning)
When a player taps Claim and picks a pattern
Then the claim reaches the host phone, which checks it exactly as if it had been shouted
And players are still encouraged to shout: the button adds, it doesn't replace

## TAM-204: Simultaneous claims over the network follow the tie rule
Status: draft
Phase: Phase 6
Given two players' claims for the same pattern arrive at the host in either order
And both completed on the same called number, before the next number
Then they share the prize, whatever order the network delivered them in (TAM-041, TAM-042)

## TAM-205: A claim delayed by the network is judged by when it was made
Status: draft
Phase: Phase 6
Given a player tapped Claim before the next number was called
When the claim reaches the host after the next number, because of a slow network
Then it is judged on the numbers called when the player tapped, not when it arrived
(The host only accepts this if the claim's timing is consistent with the host's own record of calls.)

## TAM-206: Verdicts on every phone are a separate choice
Status: draft
Phase: Phase 6
Given the host has turned on "Verdict on every phone" (with its warning)
When a claim is checked
Then every connected phone shows the verdict after the host phone does

## TAM-207: Dropped and repeated messages don't change the game
Status: draft
Phase: Phase 6
With network faults injected at random (delays, drops, duplicates, reordering, disconnects)
Then no number is shown twice or skipped on any phone, no claim is counted twice,
and after reconnecting every phone agrees with the host

## TAM-208: Ten phones always agree with the host
Status: draft
Phase: Phase 6
For thousands of simulated games with 10 connected phones and random network faults
Then at the end of every game, every phone's record of calls and verdicts matches the host's exactly

## TAM-209: Losing the connection falls back smoothly
Status: draft
Phase: Phase 6
Given connected mode is on
When the internet drops for the host or a player
Then the game carries on as in Phase 2 (players listen and mark; the host checks claims by ticket number)
And when the connection returns, phones catch up without the host doing anything

## TAM-210: The relay costs nothing and keeps nothing
Status: draft
Phase: Phase 6
Then the relay runs on a free tier
And it passes moves between phones in one game only; it stores no names, tickets or money after the game ends
