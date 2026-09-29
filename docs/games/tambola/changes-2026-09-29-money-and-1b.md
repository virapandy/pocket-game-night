# Change request: the host is the bank; 1b review findings (29 September 2026)

Owner-approved. For the orchestrator: the tester applies these scenario changes and checks, then the coder
builds. Source: the product owner's review of the live 1b build (below) and the owner's decision.

## 1. The host is the bank; settling is a separate step (owner)
The convention in Tambola: everyone pays the host for their tickets before the game; the host pays each
winner and hands back unwon money at the end of the game. The game's payout screen says exactly that.
The session tally is an **optional** extra, for groups that didn't hand money over after each game; even
then, every hand-over is between the **host** and one person, never player to player.

**Change TAM-089** to:
> ## TAM-089: The payout summary says what the host hands each person
> When a game ends
> Then the summary lists each tier with its winner(s) and amount (or "not won")
> And, for each person: paid, prize won, money handed back, and **"Host gives Riya ₹77"** (prize plus money back)
> And the total the host gives out equals the pot, to the rupee
> And there is no player-to-player line on this screen

**Change PLT-017** to:
> ## PLT-017: The session tally shows each person's balance with the host
> When the host opens the tally for a session
> Then it adds up only games that are Ended and not yet settled (not in progress, paused or abandoned)
> And for each person it shows what they paid the host and what the host owes them across those games, and
> one balance: "Host owes Riya ₹27" or "Asha owes the host ₹7" (or "Even")
> And the balances add up: everything paid in equals everything owed back

**Change PLT-028** to:
> ## PLT-028: Settle up is an optional, separate step with the host
> Given a session tally with unsettled games
> When the host taps "Settle up"
> Then it lists one hand-over per person with a balance, always with the host: "Host gives Riya ₹27",
> "Asha gives the host ₹7"; people who are even are not listed
> And no payment is made or requested: text only (TAM-090)
> When the host taps "Mark as settled" and confirms (PLT-019)
> Then those games are settled (PLT-027 undo for 5 seconds still applies)
> And a group that handed money over after every game can simply ignore the tally, or mark it settled

## 2. 1b review findings (product owner, live build, 390 × 844)
Works well: update offered only on the home screen; the session name is suggested ("Tuesday 29 Sep");
prize split right (₹30 / ₹50 / ₹50 / ₹50 / ₹170 from ₹350); a late player re-splits the prizes and the
anchor is asked to announce them; hand-back per ticket is exact (two tickets, twice the share); the tally
balances; Settings has vibration, sound, dark mode, house rules, late joining and rhymes; nothing covers
the number.

| # | Finding | Fix | Scenario |
|---|---|---|---|
| 1 | "Play again" on the payout screen is below the bottom of the screen | Fixed at the bottom, like the setup steps | extend TAM-181 to the payout screen |
| 2 | "Settle up" / "Mark as settled" on the session screen are below the bottom | Fixed at the bottom | extend TAM-181 to the session screen |
| 3 | No way from a game's payout screen to its session tally | Add "Session tally" beside "Play again" | new TAM-197 (below) |
| 4 | The tally uses a large card per person; 7 people fill the screen | One compact row per person: name, balance | PLT-017 |
| 5 | Each session in the Sessions list is a button with no readable label | Label it with the session name, games and state | TAM-109 (every control has a word) |

**New TAM-197** (Phase 1b):
> ## TAM-197: From the payouts to the session tally in one tap
> When a game ends and the payout summary shows
> Then "Play again" and "Session tally" are fixed at the bottom of the screen
> And "Session tally" opens this game's session tally (PLT-017)
