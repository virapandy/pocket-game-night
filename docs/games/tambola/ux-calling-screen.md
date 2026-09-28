# Tambola calling screen: review and redesign

Product owner review of the live Phase 1a app (https://virapandy.github.io/pocket-game-night/) at
390 × 844 (a typical Android phone), 28 September 2026, after the owner said the layout, especially the
calling screen, could be better. Rules referred to are in `docs/ux-guidelines.md`.

## What the calling screen does today
From top to bottom, on a page about 1.5 screens tall that scrolls:
1. Four buttons: Home, Settings, End game, Discard game (two rows)
2. A permanent line: "Keep your screen on: this phone may let the screen sleep during the game."
3. The called number (large) and its rhyme
4. Repeat, Another rhyme, and after each call "Undo last call" (a third button that appears and disappears)
5. Last calls (4 boxes)
6. Show the room, Check a claim (both filled red, like the main button)
7. Prizes, one line each ("Early Five ₹30 · open")
8. The 1–90 board
9. "Next number", fixed at the bottom

## Problems found
| # | Problem | Why it matters | Guideline |
|---|---|---|---|
| 1 | **The number doesn't dominate.** The top quarter of the screen is admin buttons and a hint; the number sits in the second quarter. | The anchor reads it from arm's length while talking; the room glances at it. | 1, 2 |
| 2 | **The number can scroll out of view.** After a few calls in our walkthrough, the page was scrolled down to the board, with the number off-screen above. | The host has to scroll back up on every call. | 1, 13 |
| 3 | **End game and Discard sit in the first row**, the same size as Home. | Destructive actions should be out of the way, behind a menu. | 15 |
| 4 | **"Undo last call" appears and disappears in the flow**, pushing everything below it down by a row. | Layout jumps under the thumb cause mis-taps. | 18, 20 |
| 5 | **Three filled red buttons** (Show the room, Check a claim, Next number) compete. | One primary action per screen: Next number. | 13 |
| 6 | **The whole page scrolls** (board and prizes below the fold, partly hidden behind Next number). | The host should never need to scroll during play. | 13, 16 |
| 7 | **The screen-sleep hint takes a permanent line.** | It's a one-time tip, not content. | 32 |
| 8 | **Prize lines are plain text** with "· open"; winners and closed prizes aren't obvious at a glance. | The anchor announces prizes; the room asks "what's left?" | 1 |

Setup screens (smaller):
| # | Problem |
|---|---|
| 9 | Players: "Next" is below the fold after 6 players; the host scrolls to find it. The main button should stay at the bottom of the screen on every step. |
| 10 | Contribution: the field shows "50" as a grey placeholder, so it looks filled but is empty until typed. Use a real default value. |
| 11 | Prizes: each tier shows its amount twice (heading and field) plus a large Remove button; five tiers take two screens. |
| 12 | Prizes: with 6 tickets, the three Lines (same share) came out ₹50, ₹40, ₹40. Tiers with the same share should get the same amount; rounding differences should go to Full House first. |

## The redesign: one screen, no scrolling
```
┌──────────────────────────────────────┐
│ ←   Tambola · 23 of 90 called     ⋯  │  top bar: back, progress, menu
│                                      │  (menu: Settings, Show the room,
│                                      │   Board, End game, Discard game)
│                                      │
│                 21                   │  the number: about 40% of the screen
│                                      │
│        Twenty-one, just begun        │  rhyme, large
│      Repeat   ·   Another rhyme      │  quiet text buttons
│                                      │
│      Last:  65   83   3   47   12    │  last 5 calls, small
│                                      │
│  Early 5 ✓Riya  Top ●  Mid ●  Bot ●  │  prize chips: open ● / won ✓ name /
│  House ●                              │  closed (greyed), scroll sideways
│ ┌──────────────────────────────────┐ │
│ │  Called 21 · Undo (5s)           │ │  undo toast, floats, no layout jump
│ └──────────────────────────────────┘ │
│  [ Record a win ]  [  NEXT NUMBER  ] │  fixed thumb zone: secondary + primary
└──────────────────────────────────────┘
```
- **Board** opens as a sheet from the menu or a swipe up; it never pushes the number off screen.
- **Show the room** stays one tap away in the menu, and also on a long press of the number.
- **Screen-sleep hint:** a one-time tip, then a small icon in the top bar if the screen can still sleep.
- **After a win** (TAM-145): the prize chip turns into "Top Line ✓ Riya · Close"; Next number shows
  "Close Top Line first" until it's closed.
- **Landscape** (phone on a stand facing the room): number on the left half, rhyme and last calls on
  the right, buttons along the bottom.

## Acceptance (for the tester to turn into checks)
- On a 390 × 844 screen the calling screen needs **no scrolling**, and the number stays fully visible
  after 90 calls, a claim, an undo and a tier close.
- The number's digits are at least 160 CSS px tall (TAM-107); nothing above it except the top bar.
- Only Next number is a filled primary button; End game and Discard are only in the menu.
- The undo toast never moves any other element.
- Tiers with the same share always get the same amount.
