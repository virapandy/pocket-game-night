# House rules: needs owner decisions

Each scenario below has a question. Pick one option (or write your own), and the scenario is finished.
Every choice becomes a **setting** with a default the host can change. These are the defaults.

**Norm** marks the option that matches the established rules in `docs/tambola-guide.md`.
**Recommended** is Claude's suggestion for family play, where it differs from the norm.

## TAM-040: Which patterns are in a game by default?
Status: waiting for owner decision
Options:
- A. Early Five, Top Line, Middle Line, Bottom Line, Full House
- B. A plus Four Corners (**norm**: the standard six dividends)
- C. B plus extras (Early Seven, Star, Pyramid …) as optional patterns the host can switch on
Scenario once chosen:
When the host starts a new game without changing settings
Then exactly the chosen default patterns are available to claim

## TAM-041: Two players claim the same pattern at the same moment
Status: waiting for owner decision
Options:
- A. Both win and share the prize (**norm**)
- B. The first claim entered by the host wins
- C. The host decides each time
Scenario once chosen:
Given tickets 3 and 8 both complete Top Line on the same called number
When both players claim before the next number is called
Then the chosen rule is applied, every time

## TAM-042: What counts as "the same moment"?
Status: waiting for owner decision
Options:
- A. Both completed their pattern on the same called number, and both claimed before the next number (**norm**)
- B. Only if the host entered them within a few seconds of each other
Scenario once chosen: the rule in TAM-041 applies only to claims that match this definition.

## TAM-043: Late claims
Status: waiting for owner decision
A player's pattern was complete after number 45 was called, but they only claimed after 12 was called next.
Options:
- A. Still valid (gentler)
- B. Invalid: a claim must come before the next number is called, and a late claim counts as a bogey (**norm**)
Scenario once chosen:
When the host checks the late claim
Then it is accepted (A) or treated as a bogey with the reason "too late" (B)
(For B, the app records which number completed each ticket's pattern, so "late" is exact.)

## TAM-044: What happens after a bogey?
Status: waiting for owner decision
Options:
- A. Nothing; the room laughs and play continues (**recommended** for family play)
- B. That ticket is out of the game (**norm**: the ticket is "cancelled")
- C. That ticket cannot claim the same pattern again
Scenario once chosen:
Given ticket 3 made a bogey on Top Line
Then the chosen consequence applies, and the host sees it clearly

## TAM-045: How many tickets may one player hold?
Status: waiting for owner decision
Options:
- A. One
- B. Up to a limit the host sets, default 3 (**norm**: 1 to 3 tickets per player)
Scenario once chosen:
When the host hands out tickets
Then no player gets more than the allowed number

## TAM-046: Second and third Full House
Status: waiting for owner decision
Options:
- A. The game ends at the first Full House (**norm**)
- B. The host can allow a second (and third) Full House before the game ends (a common extra)
Scenario once chosen: see TAM-075.

## TAM-047: Prizes
Status: replaced 2026-09-28 by the prize-pool scenarios in 08-prizes.md (TAM-080 to TAM-089)

## TAM-048: Phone tickets per game
Status: waiting for owner decision
Options:
- A. Hand out tickets one by one, from full sheets of 6 (so numbers spread evenly) (**norm**: tickets come in strips of 6)
- B. Every ticket made independently
Scenario once chosen: TAM-006 applies to every group of 6 tickets handed out (A), or only when printing full sheets (B).

## TAM-049: First languages for rhymes and the voice caller
Status: waiting for owner decision
Options: English, Hindi, Tamil, others (choose one or two to start)
Scenario once chosen:
Given the host picks a language
Then every number 1–90 has a rhyme in that language, or falls back to the number alone (TAM-015)
