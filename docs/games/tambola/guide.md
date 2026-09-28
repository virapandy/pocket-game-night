# Tambola: a short guide

*Approved by the owner, 28 September 2026.*

**Tambola** (also called **Housie**, and a close cousin of British 90-ball bingo) is a number-calling
game for any group, from 4 people to 100. One person, the **caller** (or anchor), draws numbers from
1 to 90 and calls them out, often with a traditional rhyme ("Two fat ladies, 88!"). Everyone else
crosses those numbers off their ticket. The first to complete a winning pattern shouts their claim,
the caller checks it in front of everyone, and they win that prize. It's loud, simple and suits all
ages, which is why it's a favourite at Indian family gatherings, kitty parties, clubs and festivals.

In Pocket Game Night, the **host phone** draws the numbers, shows the rhyme for the anchor to read,
makes the tickets, and checks claims. The calling, the shouting and the checking stay in the room.

---

## What you need
- One phone (the host phone). No internet needed once the app has been opened.
- A ticket for each player: from your own Tambola ticket book, or (later) on each player's phone.
- A pen, for paper tickets.
- Optional: a small contribution per ticket that makes up the prize pot, or small prizes such as
  chocolates. The app works out the pot and each prize, but never collects or sends money.

## The ticket
A ticket is a grid of **3 rows × 9 columns** holding **15 numbers**.

- Each row has **5 numbers and 4 blanks**.
- Each column holds a range: column 1 is **1–9**, column 2 is **10–19**, and so on; column 9 is **80–90**.
- Each column has **1 to 3 numbers**, in increasing order from top to bottom.
- Tickets come in **sheets of 6** that together use every number from 1 to 90 exactly once.

```
 ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐
 │  4 │    │ 23 │    │ 41 │    │ 62 │    │ 85 │   top row: 5 numbers
 ├────┼────┼────┼────┼────┼────┼────┼────┼────┤
 │    │ 15 │    │ 36 │    │ 57 │ 68 │    │ 89 │   middle row
 ├────┼────┼────┼────┼────┼────┼────┼────┼────┤
 │  9 │    │ 28 │    │ 47 │    │    │ 74 │ 90 │   bottom row
 └────┴────┴────┴────┴────┴────┴────┴────┴────┘
```
*(Four Corners on this ticket = 4, 85, 9 and 90.)*

## How to play
1. **Hand out tickets.** Usually one to three per player.
2. **Agree the prizes** (called *dividends*): which patterns are in play and what each one wins.
   Often everyone pays a small amount per ticket, and the pot is split across the patterns, with
   the smallest share for Early Five and the largest for Full House.
3. **The caller calls numbers**, one at a time, reading each number and its rhyme from the host phone.
   A number is never called twice.
4. **Players mark** any called number that's on their ticket.
5. **Claim out loud.** When your ticket completes a pattern, shout it ("Top Line!" or "Housie!")
   **before the next number is called**.
6. **The claim is checked** in front of everyone against the numbers called so far.
   If it's right, you win that prize. If it's wrong, it's a **bogey**.
7. **Each prize is won once.** Play carries on until **Full House** is won (or the agreed number
   of Full Houses), which ends the game.

## Winning patterns

| Pattern | Also called | You need |
|---|---|---|
| Early Five | Quick Five, *Jaldi Paanch* | Any 5 numbers on your ticket called |
| Top Line | First Line | All 5 numbers in the top row called |
| Middle Line | Second Line | All 5 numbers in the middle row |
| Bottom Line | Third Line | All 5 numbers in the bottom row |
| Four Corners | Corners | The first and last numbers of the top and bottom rows |
| Full House | Housie, Tambola | All 15 numbers called |

Many groups add a **Second (and Third) Full House**, and hosts sometimes invent fun patterns
(Star, Pyramid, a letter shape). These are optional.

## The rules

1. **Claims are checked against called numbers only.** A number you forgot to mark still counts;
   a number you marked by mistake doesn't.
2. **Claim before the next number is called.** A claim after that is late and is treated as a bogey.
3. **Bogey (false or late claim):** traditionally, that ticket is out of the game. That is
   Pocket Game Night's default; for gentle family games the host can switch to "carry on".
4. **Ties:** if two or more tickets complete the same pattern on the same number and claim in time,
   they **share** the prize.
5. **One winner per pattern.** Once a pattern is won, later claims for it don't count.
6. **The game ends** when the last Full House is won. If all 90 numbers are called, every ticket
   is complete.
7. **Late joiners** may join a game in progress and cross off the numbers already called. Because
   claims must come before the next number, a pattern that was already complete when they joined
   can't be claimed. Pocket Game Night allows joining until 10 numbers have been called.
8. **Unclaimed prizes:** some groups roll them over to the next round ("Progressive Tambola").
   Pocket Game Night keeps each game self-contained: an unclaimed prize is spread across the
   prizes won in that game.
9. **House rules are fine.** Patterns, prizes, bogey penalties and the number of tickets vary
   between groups. Agree them before the first number.

## A few traditional calls
| Number | Call |
|---|---|
| 1 | Kelly's eye |
| 11 | Legs eleven |
| 22 | Two little ducks |
| 88 | Two fat ladies |
| 90 | Top of the house (UK: top of the shop) |

## How Pocket Game Night plays it
- The anchor still calls aloud; the phone only draws the number and shows the rhyme.
- The host enters players, tickets and the contribution; the app suggests how to split the pot,
  and the anchor confirms the prizes out loud before the first number.
- Players still shout claims. With paper tickets, the host types the numbers the player reads out;
  with phone tickets, just the ticket number. The phone checks the claim instantly and shows the room.
- At the end, the app shows who won what. Money changes hands between people, never through the app.
- Shortcuts (phone speaks the calls, auto-marking, Claim buttons) exist but are off by default,
  because the shouting and checking are the fun.
- Mistakes are forgiving: the host can undo a wrongly entered claim. A number already called
  can't be taken back, because the room has heard it.

## Contract check (for the builders)
How Tambola answers the seven contract questions in `src/engine/CLAUDE.md`. Checked 28 September 2026.

| Question | Tambola's answer |
|---|---|
| Setup | Ticket mode, players (names optional), tickets per player, contribution, prize tiers confirmed by the anchor, house-rule settings, a host-only draw seed; with phone tickets, a host-only sheet seed for the sheets of 6 |
| Legal moves | Host: call next number, undo last call (within 5 s), check a claim (player or ticket, pattern, and with paper tickets the numbers read out), close a won tier (TAM-145), undo a claim, add a late joiner (until 10 calls), end the game. Setup moves: edit, remove or add back a tier; confirm prizes. |
| Apply | A call adds the next number from the draw; a claim is accepted, shared, refused as already won, or a bogey (late claims too); prizes are credited; a bogeyed ticket is out |
| View | Host: everything. Room: the called number, the last 3 calls, verdicts. Player (phone tickets): own ticket and called numbers only |
| Game over | Only when the host ends it: after closing the last Full House tier, or early. Each tier is closed by hand (TAM-145), so tied winners can be added first |
| Invariants | No number twice; at most 90 calls; valid tickets; claims judged only on numbers called at the time; tiers and payouts always add up to the pot; no view leaks another ticket or an upcoming number |
| Undo | Claims: any time. Calls: only within 5 seconds. Game end: never (it has a confirmation instead) |

**Fits the contract, with four points the engine must support from Phase 0:**
1. **Moves carry a time.** The 5-second undo window needs a time on each move record, because rules
   may not read the clock.
2. **A "room" viewer** alongside host and players, for what the whole room may see.
3. **Moves with details.** "Check a claim" carries a pattern, a player or ticket, and sometimes typed
   numbers. For the generic Jev player, a player's choices stay a short list ("claim Top Line", "wait").
4. **Player marks live only on the player's phone.** They never change the game state (TAM-035), so
   they sit outside the host's game.

Auto-call timers, the screen wake lock and sounds are app features, not rules.
Secrets with their own seeds, both host-only: the draw and the ticket sheets. A player's phone gets
only its own ticket's numbers, never a seed (TAM-053).

---
*Sources (checked 28 September 2026):* rules and patterns from
[Party Tambola: rules](https://www.partytambola.in/tambola-rules),
[Party Tambola: how to play](https://www.partytambola.in/how-to-play-tambola),
[TambolaCaller: rules](https://tambolacaller.com/rules) and
[Octro Tambola: how to play](https://tambola.octro.com/HowToPlay/index.php); late joiners from
[Crownit Tambola FAQ](https://crownit.in/tambola-faqs/); rolling over unclaimed prizes from
[Party Tambola: game ideas](https://www.partytambola.in/tambola-game-ideas); ticket structure,
strips of 6, and claim timing also from
[Wikipedia: Bingo (British version)](https://en.wikipedia.org/wiki/Bingo_(British_version)).
Sources differ slightly on column ranges (some use 1–10, 11–20 … 81–90); this guide uses the
1–9 … 80–90 layout most Indian sources use.
