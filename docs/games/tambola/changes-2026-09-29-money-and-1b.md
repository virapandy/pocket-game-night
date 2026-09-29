# Change request: the host is the bank for each game; 1b review findings (29 September 2026)

Owner-approved. For the orchestrator: the tester applies these scenario changes and checks, then the coder
builds. Source: the product owner's review of the live 1b build (below) and the owner's decision.

## 1. The host is the bank for each game; settling is separate and player to player (owner)
- **Each game:** the convention in Tambola. Everyone pays the host for their tickets before the game; the
  host pays each winner and hands back unwon money at the end of the game. The payout screen says exactly
  that ("Host gives Riya ₹77").
- **Settle up:** an optional, separate step for groups that didn't hand money over after each game. The
  session tally nets each person's amounts across the session, and Settle up lists the fewest **player to
  player** hand-overs ("Asha pays Riya ₹7"). This is how PLT-017 and PLT-028 already read and how the live
  build already works: **no change to PLT-017 or PLT-028**.

**Change TAM-089** to:
> ## TAM-089: The payout summary says what the host hands each person
> When a game ends
> Then the summary lists each tier with its winner(s) and amount (or "not won")
> And, for each person: paid, prize won, money handed back, and **"Host gives Riya ₹77"** (prize plus money back)
> And the total the host gives out equals the pot, to the rupee
> (Player-to-player hand-overs appear only in the session's optional Settle up, PLT-028.)

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
