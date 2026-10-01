# UX review: one player with several phone tickets (1 October 2026)

The first joint review by the **UX designer** (tests and recommends) and the **product owner** (decides with the
UX designer and records the decision). Live app, phone sizes 375 × 812, 390 × 844 and landscape 844 × 390, host and
player in two browser tabs, tickets loaded by typed code (no camera). The owner asked to test with 4 tickets.

## What we found
- **The host can't give 4.** The "Tickets" dropdown offers 1, 2, 3 with no reason shown (TAM-045 caps it at 3).
- **A player's phone takes any ticket code, with no limit** and no check whose ticket it is. That is how 4 was tested.
- **Measured on the player's phone ("All tickets"):**

| Screen | Tickets | Cell | Fits with no scrolling? |
|---|---|---|---|
| 375 × 812 | 3 | 40 px | Yes, about 210 px spare |
| 375 × 812 | 4, no pattern message | 40 px | Yes, about 60 px spare |
| 375 × 812 and 390 × 844 | 4, three pattern-message lines | 40 px | **No**: "One at a time", "Quick mark" and "Show claim" pushed off screen |
| 375 × 812, Larger text | 4, one message line | 40 px | No (just over); button labels wrap |
| 844 × 390 landscape | 3 or 4, two by two | 42 px | Fits, but **the message box covers the bottom rows of the lower tickets** |

- One at a time: 42 px cells, last column cut off by 3 px, about 330 px empty below the ticket.
- Quick mark: keys 33 × 36 px (below our 44 px target), **marked numbers not shown on the keys**; feedback line
  ("✓ 5 marked on ticket 4", "21: not on your tickets") works well; thumbnails have no "Ticket 1…4" caption.
- Show claim, crossing out won prizes, the "marks fill a pattern" message: all work. The pattern outline is a thin
  green line, so it leans on colour alone; Early Five repeats once per ticket.

## Problems, ranked (they apply with 2 and 3 tickets, not just 4)
1. **Blocks play:** in landscape the pattern message covers ticket rows (UX guideline 41, "no scrolling").
2. **Slows play:** in portrait the pattern message pushes the action buttons off screen (guideline 13 and "no scrolling").
3. **Slows play:** Quick mark keys are too small and don't show what's marked (guidelines 14, 26).
4. **Slows play:** nothing tells a player which ticket a message or claim is about, outside Quick mark.
5. **Polish:** colour-only pattern outline (26); One at a time cut off at the edge (5); host's prize chips cut off
   ("Ho…"); the ticket-code box shows a real-looking sample code; "Enter a ticket code" doesn't say it adds a ticket.

## Decided together (product owner and UX designer, owner's answers of 1 October)
| # | Decision | Why |
|---|---|---|
| 1 | **Limit stays at 3 for now** (TAM-045). We test with 3; the limit is proposed for a later version from what real games show (play-test checklist row 16). | Owner, 1 October |
| 2 | **A phone may hold someone else's ticket** (e.g. Grandma's); it stays under the holder's name on the phone, on claims and in payouts. A phone holds at most as many tickets as the per-player limit (3 today), held tickets included: a 4th gets "This phone already holds 3 tickets". | Owner, 1 October |
| 3 | **The pattern message becomes one slim line** in the space it has, never covering tickets or pushing buttons off screen: "Ticket 3: top row filled. Shout if it's right!" with "More" for the rest. Several matches: "Tickets 1 and 3: patterns filled · More". | UX designer recommendation, product owner agrees |
| 4 | **Quick mark keys** grow to at least 44 px tall (the empty space is there) and show marked numbers with a fill **and** a ✓; thumbnails get "Ticket 1", "Ticket 2" captions. | Guidelines 14 and 26 |
| 5 | **"Which ticket?"** shows each ticket's small picture, and puts the ticket the pattern message named first, marked "Pattern filled". | Fewer wrong-ticket claims |
| 6 | **Pattern outline**: thicker, and the outlined cells also get a corner mark, so it doesn't rely on colour. Early Five says it once: "Early Five filled on ticket 1". | Guideline 26 |
| 7 | **Polish**: One at a time keeps a 12 px margin each side (cells about 39 px at 375 px, still above 24 px); host prize chips wrap instead of cutting off; the code box shows a pattern hint ("XXXX-XXXX-…"), not a real-looking code; the button says "Add a ticket by code". | Guidelines 5, 14 |
| 8 | **For a later version with 4 tickets** (only if decision 1 changes): all four stacked in portrait with the slim message line (fits 375 × 812), "One at a time" and Quick mark one tap away; not landscape two by two as the default (real landscape is about 340 px tall). | Measured above |

## Scenario changes for the tester (drafts; the owner approved the behaviour on 1 October)
- **TAM-195 (pattern cue):** add: "The cue takes one line at the bottom of the tickets; it never covers a ticket
  and never pushes 'One at a time', 'Quick mark' or 'Show claim' off a 375 × 812 screen, in portrait or landscape,
  with Larger text on or off, with 1 to 3 tickets." and the Early Five wording; the outline is not colour alone.
- **TAM-192 (quick mark):** keys at least 44 CSS px tall; marked numbers show fill and ✓; thumbnails captioned.
- **TAM-190 (which ticket):** thumbnails; the cue's ticket listed first, labelled "Pattern filled".
- **New: holding another player's ticket.** "Given Riya's phone holds her ticket 2, when she adds Grandma's ticket 5
  by code or QR, then ticket 5 shows 'Grandma · Ticket 5', and a claim on it reads 'Top Line · Ticket 5 · Grandma'
  and is credited to Grandma." and "Given a phone holds 3 tickets, when a 4th is added, then it is refused:
  'This phone already holds 3 tickets'." (A typed code carries no name; the ticket then shows just "Ticket 5", and
  the host's copy still credits Grandma.)
- **TAM-122 / TAM-191 (one at a time):** 12 px side margin, no cut-off column.
- Host prize chips wrap (TAM-183); ticket-code field hint and button wording (TAM-117).
