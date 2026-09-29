# Tambola phone tickets: screen design (Phase 2)

Product owner design, 29 September 2026, for the Phase 2 scenarios (TAM-001 to TAM-008, TAM-050 to
TAM-058, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170 to TAM-179, TAM-190). Follows
`docs/ux-guidelines.md` and the 1a.1 calling screen. Everything works with **no internet**, once each
phone has opened the app link before.

## The idea in one line
The host phone makes the tickets and keeps the only copy of who holds what; each player's phone holds
just their own ticket, marks it by hand, and shows a **claim QR** the host scans to check a claim.

## 1. Host: handing out tickets
Right after "Confirm prizes", with "Phone tickets" chosen at setup.
```
┌──────────────────────────────────────┐
│ ←  Hand out tickets     7 of 10  ⋯   │
│                                      │
│        Ticket 3  →  Riya (1 of 2)    │  pre-assigned; tap the name to change it (TAM-172)
│      ┌──────────────────────┐        │
│      │                      │        │
│      │       [ QR code ]    │        │  large, high contrast, quiet border
│      │                      │        │
│      └──────────────────────┘        │
│   Scan with your phone's camera      │
│   or type:  7K3P-M4X9-2TRD            │  typed code, no look-alike characters (TAM-117)
│                                      │
│   Waiting: Asha 2, Dad 1, Kabir 1    │  who still needs a ticket (TAM-132)
│ [ Can't scan? Give a paper ticket ]  │  mixed game (TAM-058)
│ [          NEXT TICKET           ]   │  host confirms each hand-out (offline: no feedback)
└──────────────────────────────────────┘
```
- "Next ticket" is the main button; after the last ticket it becomes **"Start calling"**.
- Tickets are taken from sheets of 6 in order; unused tickets on a sheet are simply not in the game (TAM-176).

## 2. Player: the ticket
Landscape by default (cells about 80 px); portrait works too (TAM-122).
```
┌───────────────────────────────────────────────────────────────┐
│ Riya · Ticket 3 · Game 7K3P · 8:40 pm          Prizes ▾   ⋯   │
│ ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐                │
│ │ 4✓ │    │ 23 │    │ 41 │    │ 62✓│    │ 85 │                │  tap to mark (fill + ✓),
│ ├────┼────┼────┼────┼────┼────┼────┼────┼────┤                │  tap again to unmark (TAM-131)
│ │    │ 15 │    │ 36✓│    │ 57 │ 68 │    │ 89 │                │
│ ├────┼────┼────┼────┼────┼────┼────┼────┼────┤                │
│ │ 9  │    │ 28 │    │ 47 │    │    │ 74 │ 90 │                │
│ └────┴────┴────┴────┴────┴────┴────┴────┴────┘                │
│  Listen to the anchor and mark your numbers.    [ SHOW CLAIM ] │
└───────────────────────────────────────────────────────────────┘
```
- The phone never shows called numbers or other tickets (TAM-050, TAM-051).
- **Several tickets** (TAM-173): stacked one above the other in portrait, or one tap apart ("Ticket 3 | Ticket 8").
- **Prizes ▾** opens the prize list for this game (TAM-170). The menu holds Larger text (TAM-121) and
  "Report a problem" (Phase 7).
- The ticket survives locks and reloads, marks included (TAM-171), until the player scans a new game.

## 3. Player: showing a claim
The player **shouts first**, then taps **Show claim** (TAM-060, TAM-177).
1. With several tickets: "Which ticket?" (TAM-190).
2. "Which prize?": only the prizes this game has, as big buttons.
3. The claim QR fills the screen:
```
┌──────────────────────────────┐
│   TOP LINE · Ticket 3 · Riya │
│   ┌──────────────────────┐   │
│   │      [ claim QR ]    │   │
│   └──────────────────────┘   │
│   Show this to the host      │
│   [ Done ]                   │
└──────────────────────────────┘
```
The screen goes to full brightness while the QR shows, where the phone allows.

## 4. Host: scanning a claim
On the calling screen, with phone tickets, **"Record a win"** becomes **"Check a claim"** (paper players
are still recorded as in 1a.1).
1. The camera opens at once, with a frame to aim at. The prize comes from the QR.
2. The verdict appears within 2 seconds, in the same place as a paper win (TAM-033, TAM-174):
   "Top Line: ✓ Accepted, ₹60 to Riya", or "Top Line: ✗ Bogey: 72 not called".
3. **"Enter ticket number"** is always one tap away, and takes over after 10 seconds without a read, or with
   no camera permission (TAM-178).
4. Refusals are calm and never a bogey (TAM-179): another game, a ticket not handed out, a ticket that is
   out, a prize already won or closed, or a QR that doesn't match the host's copy (then "Check ticket 3 by number").

## 5. Before the day
The host shares the app link in the family group: "Open this once before Sunday." Opening it shows
"You're ready for game night" (TAM-057). A guest who didn't open it plays on paper; the host taps
"Can't scan? Give a paper ticket".

## Acceptance notes for the tester
- Hand-out: about 5 seconds per player with the camera; the QR readable from 30–50 cm in a lit room.
- Player ticket: every cell at least 44 CSS px in landscape; marks show a fill **and** a ✓.
- Claim QR: readable on a budget Android phone at arm's length; the verdict within 2 seconds.
