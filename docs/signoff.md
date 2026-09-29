# Sign-off packs for the coming phases

Plain-English summaries for the owner, one per phase, written by the product owner on 29 September 2026.
Each phase starts only after the owner signs off its pack. The detailed scenarios and the product owner's
verdicts are in `docs/scenario-review-outcome-2026-09-28.md`.

---

## Phase 2: tickets on players' phones
**What families get:** no ticket book needed. The host phone makes the tickets; each player scans one
onto their own phone, marks it by tapping, and shows a claim QR when they win. All without internet.
Design: `docs/games/tambola/ux-phone-tickets.md`.

**How it works**
1. At setup the host picks "Phone tickets". Tickets come from sheets of 6, like a real ticket book.
2. The host hands them out: each ticket is already assigned to a named player; the player scans its QR
   with their phone's camera (or types a 12-character code). About 5 seconds each.
3. Players listen to the anchor and tap their own numbers. Their phone never shows called numbers, other
   tickets, or anything about the draw: nobody can cheat with a curious phone.
4. A winner shouts, then shows a claim QR. The host scans it and the app gives the verdict at once;
   the prize is credited to the ticket's owner automatically. Typing the ticket number is the backup.
5. Paper and phone tickets can be mixed in one game; a phone that dies switches to paper.

**Things to know**
- Each guest must **open the app link once, with internet, before the day**. Share it in the family group.
- Players' phones show no called numbers (they can't know them without internet); the anchor's voice
  does that job, as with paper. Showing calls on phones would need connected mode, which is on hold.
- A claim QR that doesn't match the host's copy is refused, never counted as a bogey.

**Size:** about 50 scenarios, including the pattern rules the app checks for phone tickets.
**Sign-off:** approve Phase 2 as described? (Yes / changes)

---

## Phase 7: "Report a problem"
**What families get:** a "Report a problem" button in the menu, on the host phone and on phone tickets.

- It asks "What happened?" (optional) and shows exactly what would be sent before sending.
- Reports never include names, session names or money; players become "Player 1", "Player 2".
- A report about a game still being played waits until the game ends, so it can never reveal coming numbers.
- The app sends nothing on its own: no tracking, no analytics, no accounts.
- **Your decision already made:** for now reports go to a stub; nothing leaves the phone. A real free,
  no-account destination is needed **before sharing the app beyond family and friends**.

**Size:** 10 scenarios.
**Sign-off:** approve Phase 7 as described? (Yes / changes)

---

## Extended testing: simulations, mutation testing, Android emulator, Jev
**What families get:** nothing visible; fewer bugs reach them.

- **Mass simulations:** 100,000 simulated Tambola games a week, with every setting mixed (ties, late joiners,
  bogeys, undo, ending early), checking the rules and that the money always adds up exactly.
- **Mutation testing:** the tests are checked by planting deliberate small mistakes in a copy of the rules and
  money code; at least 80% must be caught.
- **Android emulator:** a full game on a virtual Android phone at two sizes, offline, including the back
  gesture, the app closing in the background, and install.
- **Jev** (already approved) plays simulated guests ("slow grandparent", "over-eager child"), choosing only
  among legal moves; the rules engine always decides. Everything also works without Jev.
- Runs weekly and on request, on free machines. A failure is reported for the next round; it never holds
  back the live link.

**Your decision needed: a weekly cap on Jev calls.**
| Option | Weekly cap | Worst-case cost |
|---|---|---|
| Small (recommended) | 20,000 Jev decisions a week | about $1.70 a week (about $7 a month) |
| Tiny | 5,000 a week | about $0.40 a week |
| Larger | 100,000 a week | about $8.40 a week |

Worked out from Jev's published price ($0.042 per million input tokens, output free), assuming a large
2,000-token situation per decision; real runs usually use less. When the cap is reached, the week's runs
finish with scripted players instead, so nothing breaks.

**Size:** 14 scenarios.
**Sign-off:** approve extended testing, and pick a weekly Jev cap?
