# Tambola user journeys

Approved by the owner, 28 September 2026. House rules use the **norms** from `docs/games/tambola/guide.md` until the
owner decides: six patterns, ties shared, claims before the next number, 1–3 tickets per player.

## Who is involved
| Person | Role |
|---|---|
| **Host** | Holds the host phone, sets up the game and the prize pool, enters and checks claims. Often also the anchor. |
| **Anchor** | Reads each number and rhyme aloud, and confirms the prize tiers before the first call. Can be the host. |
| **Player** | Pays their contribution, has one to three tickets, marks numbers, shouts claims. May have never played. |

## Two ways to get tickets
| Mode | Tickets | Player needs | Internet | Phase |
|---|---|---|---|---|
| **Paper tickets** | The group's own ticket book (shop-bought or saved) | A pen | None | 1 |
| **Phone tickets** | Made by the app; each player scans a QR from the host phone | Their own phone | None, if players opened the app link once before | 2 |

Both can be **mixed in one game**: a player without a phone, or whose phone dies, plays on paper.
Everything else (setup, prize pool, calling, checking, payouts) is the same in both modes.

## Money: what the app does and doesn't do
The app **calculates** the pot, suggests how to split it, and shows who should receive how much at
the end. It **never collects, holds or sends money**: contributions and prizes change hands in cash
or by UPI between people, outside the app. There are no payment links. This matches the research
brief: the app may track buy-ins and suggest settlements, but does not move money. Money is
optional: a group can play for chocolates instead, using text prize labels.

---

## 1. Game setup (both modes)

| Step | Host does | Host phone shows |
|---|---|---|
| 1. Start | Opens the app, taps **Tambola → New game** | Ticket mode: **Paper tickets** or **Phone tickets** |
| 2. Players | The shared players step (every game): number of players and names, with one-tap suggestions from names used before; blanks become Player 1, 2 … | "8 players" |
| 3. Tickets | Sets tickets per player (default 1, maximum 3); a player can take extra tickets | "10 tickets in play" |
| 4. Contribution | Enters the contribution per ticket, e.g. ₹50, or chooses **No money** | "Pot: 10 tickets × ₹50 = **₹500**" |
| 5. Tiers | Reviews the tiers the app suggests for this many tickets (below); removes or adds back tiers | Each tier with its % and ₹ amount; the total always equals the pot |
| 6. Anchor edits | The anchor changes any amount the room wants | The other tiers adjust to keep the total |
| 7. Anchor confirms | The anchor reads the tiers aloud to the room, adjusts any amount if the room wants, and taps **Confirm prizes** | "Prizes locked. Tap to call the first number" |

**Target:** under 60 seconds from opening the app to the first number, with the defaults.

### Suggested tiers (app default, editable)
The app suggests tiers from the number of tickets in play, so small groups get fewer, bigger prizes:

| Tickets in play | Suggested tiers | Split |
|---|---|---|
| 2–5 | Early Five, Top Line, Full House | 10 / 20 / 70 % |
| 6–11 | Early Five, three Lines, Full House | 10 / 15 / 15 / 15 / 45 % |
| 12–24 | Early Five, Four Corners, three Lines, Full House | 10 / 10 / 12 / 12 / 12 / 44 % |
| 25 or more | The six above plus Second Full House | 8 / 8 / 10 / 10 / 10 / 32 / 22 % |

- The 2–5 split is the common published example; the larger ones are Claude's suggestion in the
  same spirit (small first prizes, Full House always largest).
- The host can remove any tier except Full House, and add it back; the other tiers rebalance.
- The anchor can change any amount; the other tiers adjust so the total still equals the pot.
- **Amounts always add up to the pot exactly.** Tiers are rounded to ₹10 and individual tiers are
  nudged up or down as needed (a ₹530 pot at 10 / 20 / 70 % gives ₹50 / ₹110 / ₹370).
- An unclaimed tier is spread across the won tiers at the end, and ties split to the rupee.

---|---|---|
| Early Five | 10% | ₹50 |
| Four Corners | 10% | ₹50 |
| Top Line | 12% | ₹60 |
| Middle Line | 12% | ₹60 |
| Bottom Line | 12% | ₹60 |
| Full House | 44% (plus any rounding remainder) | ₹220 |

- Smaller prizes come first and the largest goes to Full House, following the common practice of
  splitting a pot as, for example, 10% Early Five, 20% line, 70% Full House.
- Amounts are rounded down to a convenient unit (₹10 by default); the remainder goes to Full House,
  so the tiers always add up to the pot exactly.
- If the anchor edits a tier, the app shows the unallocated amount and cannot lock the prizes until
  it is zero, or until the anchor chooses to add the difference to Full House.
- With patterns unticked, the suggestion rescales over the remaining tiers.

---

## 2. Host journey during play

| Stage | Host does | Host phone shows |
|---|---|---|
| Hand out tickets | **Paper:** players pick tickets from the book; the host can note ticket numbers against names. **Phone:** each ticket is pre-assigned to a player ("Ticket 3 → Riya, 1 of 2"), the host can change it, then shows the QR; the QR carries the name, and the host phone keeps who holds which ticket; "7 of 10 joined". | Paper: nothing extra. Phone: the QR and join counter. |
| Call | Taps **Next number**; the anchor reads it aloud | The number, huge, with its rhyme; the last five calls |
| Repeat | Taps **Repeat** when asked | The same number and rhyme again |
| Claim | A player shouts. **Paper:** the anchor checks the ticket in the room; the host taps **Record a win**, picks the prize and the player (several for a tie). **Phone:** the player shows a claim QR; the host taps **Scan a claim** (typing the ticket number is the fallback). | Paper: **Top Line: ✓ Riya, ₹60**. Phone: **✓ Accepted, ₹60 to Riya** or **✗ Bogey: 72 not called** |
| Late claim | Checks a claim made after the next number | "Bogey: too late. Top Line was complete at 45" (phone tickets; with paper tickets the anchor judges) |
| Tie | Two players claim the same pattern on the same number | "Shared: ₹30 each" (split to the rupee, adding up exactly) |
| Mistake | Taps **Undo** on a wrongly accepted claim | The claim and its payout removed; the pattern open again |
| Close a tier | After an accepted claim: **Add another winner** (a tie on the same number) or **Close Top Line**; the next number waits until the tier is closed | "Top Line: Riya ₹60 · closed" |
| End | After closing the last Full House, taps **End game and show payouts**; or taps **End game** early | **Payout summary** (below) |
| Again | Taps **Play again** | Same players, contribution and split; new tickets and a new draw; the anchor confirms again |

### Payout summary at the end
| Shown | Example |
|---|---|
| Pot | ₹500 from 10 tickets |
| Each tier and its winner(s) | Early Five: Asha ₹50 · Top Line: Riya ₹60 · Full House: Dad ₹220 … |
| Unclaimed tiers | Four Corners: not won; its ₹50 spread across the won tiers |
| Per person | Riya: paid ₹50, won ₹60 · Asha: paid ₹100, won ₹50 … |
| Check | Total paid out = pot |

The host settles in cash or UPI, outside the app.

---

## 3. Player journey

### Paper tickets
| Stage | Player does | What they see or hear |
|---|---|---|
| Before | Pays their contribution to the host; picks tickets from the book | The pot and tiers, read out by the anchor |
| During | Listens and crosses off numbers | The anchor's call and rhyme; can ask for a repeat |
| Claim | Shouts the pattern; shows the ticket to the anchor | The anchor's verdict; the host phone shows the win and the prize |
| After | Collects their prize from the host | The payout summary |

### Phone tickets
| Stage | Player does | What they see on their phone |
|---|---|---|
| Before the day | Opens the shared app link once, with internet | "You're ready for game night" |
| Join | Pays the host; scans the QR the host shows for them ("Ticket 3 → Riya") with the phone's camera, or types the short code | "Riya, ticket 3", the game code and the prize tiers (TAM-170, TAM-172) |
| During | Listens to the anchor and **taps** numbers to mark them; taps again to unmark | Their ticket with their own marks only: offline, the phone doesn't know which numbers were called (TAM-050) |
| Claim | Shouts first; taps **Show claim**, picks the ticket (if several) and the prize; holds up the claim QR for the host to scan | A large claim QR with "Top Line · Ticket 3 · Riya"; the verdict appears on the host phone (TAM-177, TAM-190) |
| Phone dies | Tells the host | Switches to a paper ticket from the book, or the host reads out their app ticket from the host phone |
| After | Collects their prize | The payout summary is on the host phone |

**Privacy:** a player's phone holds only their own ticket. It cannot show other tickets or upcoming
numbers (TAM-050 to TAM-055).

---

## Lifecycle: the game over time
| Situation | What happens |
|---|---|
| Host leaves a game unfinished | Saved at every step. Within 12 hours the home screen shows it with "Tap to resume"; later it asks "Resume", "End it" or "Discard it". Never ended automatically (PLT-004). |
| Host starts a new game while one is unfinished | It just starts; unfinished games stay listed on the home screen (PLT-002) |
| **End game** | Prizes won are paid; money of unclaimed prizes goes back to the players, equally per ticket (TAM-088) |
| **Discard game** | Void: nobody is paid; the summary lists each player's contribution to hand back |
| Several games in one gathering (Phase 1b) | Grouped in a named session. The host is the bank: after each game the app shows what the host gives each person. Groups that don't hand money over after every game can open the optional **tally** (each person's net amount across the session) and **Settle up** (the fewest hand-overs between players), then **Mark as settled**, with 5 seconds to undo (PLT-016 to PLT-028) |
| Looking back | History, newest first; each game opens read-only with every call and claim, for disputes |
| Same group next week | "Use this setup" on a past game: same players, contribution and tiers |
| Deleting | One game (with 5-second Undo), or all history (with a specific confirmation) |
| History size | No limit: a game takes a few kilobytes. If storage runs low, the app asks before removing the oldest. |
| Phone lost or app data cleared | History is gone: it lives only on this phone, and the app says so |

## Moments every game must handle
| Moment | Expected behaviour |
|---|---|
| A player arrives late (Phase 1b) | Allowed until 10 numbers are called. Pays, gets a ticket, catches up from the board: earlier numbers count, but a prize already complete when they join can't be claimed. Their contribution is split across the prizes not yet won; the anchor announces the new amounts. Added by mistake: removable before the next number (TAM-067, TAM-184) |
| The host phone locks or the app closes | The game resumes exactly where it was, prizes included |
| A first-timer doesn't know the rules | **How to play** on the start screen, offline |
| Nobody wants to anchor (Phase 1b) | The host turns on **Phone speaks the call** (one-time warning), and optionally **auto-call** every 5–30 seconds (default 10), with one-tap pause and mute; auto-call pauses while a win is being recorded (TAM-120, TAM-180, TAM-185, TAM-186) |
| The game drags | The host ends early; prizes won are paid and the rest is handed back per ticket (TAM-066, TAM-088) |

---

## Scenarios this adds or changes
| ID | Change |
|---|---|
| TAM-009 | Retired: the app no longer prints or shares ticket images |
| TAM-047 | Replaced by the prize-pool scenarios in `specs/tambola/08-prizes.md` |
| TAM-037 | New: paper-ticket claim check by typing the numbers read out |
| TAM-038 | New: a late claim shows which number completed the pattern (both modes) |
| TAM-057 | New: a phone ticket works with no internet, if the app was opened once before |
| TAM-058 | New: paper and phone tickets can be mixed in one game |
| TAM-067 | New: late joiners, by the owner's rule |
| TAM-068 | New: **Play again** keeps players, contribution and split, with new tickets and a new draw |
| TAM-069 | New: **How to play** works offline from the start screen |
| TAM-080 – TAM-091 | New: setup, pot, tiers suggested by ticket count, remove and add back, anchor confirmation, exact totals, ties, unclaimed tiers, payouts, no money moved |
