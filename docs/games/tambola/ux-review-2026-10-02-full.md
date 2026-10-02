# UX review: the whole Tambola flow, host and player (2 October 2026)

First full review under `docs/ux-evaluation-playbook.md` (all 13 passes), by the **UX designer**, challenged and decided
by the **product owner**. Live preview, app 5c5030d (the app reports "1.0.0+d1a1b42": d1a1b42 changed only tests),
automation run 36852157933 green. Sizes 320 × 568, 360 × 640, 375 × 812, 390 × 844, 412 × 915, 844 × 390, 812 × 375.
First-visit pass on a cleared phone. Host and player in two tabs; tickets by typed code, and a cue-on QR link built
from the app's own format (no camera in the review browser).
**Not covered:** offline, storage lost, update waiting, wake lock refused, slow phone, 200% zoom, keyboard focus order,
dark mode, iPhone, real QR scanning, a phone holding another player's ticket.

## Verdict
Good for a family game on mid-size phones. Fix the 320 px tickets, the 360 × 640 cue layout, the red marks and the
screen-reader gap before a wider play-test.

## Strengths to keep
Home's two equal cards and "You're ready"; the cue switch and its warning; bogey verdicts that say why ("Early Five was
complete at 73"); the room view (273 px number, last 3 calls); Quick mark's feedback line; confirmations that name the
action; payouts on one screen; the called number stays bright on the dimmed screen (TAM-198 fixed).

## Re-check of UX list rows 1–7 (built in 5c5030d)
| Row | Result |
|---|---|
| 1 Cue is a host option, off by default | **Done** |
| 1a Slim cue line | **Partly:** fine at 375 × 812 and up and in landscape, but at 360 × 640 with Larger text and 3 tickets the buttons end 15 px below the screen; in landscape the line is cut to "Shout if it's rig…" |
| 2 Home | **Done** |
| 3 Paper or phone | **Done** in portrait; in landscape "Phone tickets" hides under "Next" (new row) |
| 4 One main button per screen | **Partly:** the solid main look is still on the chosen winner in "Record a win", the chosen "Settle with host" tab, History's "Delete all", and the chosen prize in the claim scan (was row 8) |
| 5 Payouts reachable | **Done** |
| 6 End game question | **Done** |
| 7 Quick mark | **Done** (keys 35 × 44 px) |

## Marked cells in solid red (the coder's question)
Yes, it works against guideline 17a. The marks are the same red as "Show claim" (rgb 179, 38, 30): after 71 calls three
tickets showed 25 red blocks, and "Show claim" became one of 26 same-red shapes in the squint test. The ✓ is 9.8 px (below
the 11 pt floor), and the green cue outline on a red mark is 1.20:1 (needs 3:1), nearly invisible to red-green colour-blind
players. Players don't mistake marks for buttons; the problem is that the main action and the cue outline get lost.
**Decided:** marks use a deep blue fill (#1E3A5F) with a white number (11.5:1) and a ✓ of at least 14 px; the pattern
outline is orange (#D97706: 3.6:1 on the blue, 3.2:1 on white) plus a corner mark, with a thin white inner line;
Quick mark's marked keys use the same blue style. Red is kept for actions only. Amber was rejected (2.0:1 on white).

## The product owner's challenges, and what changed
| Finding | Challenge | Outcome |
|---|---|---|
| No "Add another winner" while a win waits to close | The 30 September decision keeps it usable | Present in paper games; **missing only in phone-ticket games**, so a paper player's tie there can't be added. Severity 3 → 2 |
| Extra "New session" screen on the first game | PLT-029 has a line above "Confirm prizes" | Both appear on the very first game: the line, then a naming screen from the older PLT-016. **Decided:** the line is enough; drop the screen; PLT-016 reworded to match PLT-029 |
| Zoya charged when calling starts with her ticket waiting | Is the money wrong? | No: the pot counts setup tickets by design and her ticket is in the game. **Decided:** prevent it with a question, not a money change |
| 320 px tickets cut off | Default to "One at a time" instead? | No: one ticket is already 378 px wide. **Decided:** cells shrink to fit (about 32 px at 320 px, 12 px margins); above the 24 px minimum, as guideline 41 already accepts |
| Auto-call calls at once and turns on the voice | The host just chose it | Accepted as is (its confirmation says so). Dropped; the Settings Back button stays |

## Tester's six questions (report on 5c5030d): answers
1. Unfinished games on Home keep **"Tap to resume"** (PLT-004, outlined); not "Resume".
2. One ticket fills two prizes: the line names both, in prize order: "Ticket 1: Early Five and Top Line filled. Shout if
   it's right!", with "More" when it doesn't fit. Several tickets name their prizes the same way.
3. "You're ready for game night" shows on the **first visit only**.
4. **Confirmed:** Settings is reachable from Home's menu (the Tambola start screen may keep its link too).
5. Payout screen: **"Settle with host"** has the main look until a settle tab is opened; an opened tab shows outline, ✓
   and tint, never the main look.
6. Landscape 812 × 375 with 3 tickets and Larger text: **all three must fit with no scrolling** (they do today), and the
   cue line is never cut off.

## Guideline changes (added to `docs/ux-guidelines.md`)
17a gains "marks and states never use the main-button colour"; 41 gains "tickets fit the width down to 320 px";
new 26a: the called number, rhyme and verdicts are announced to screen readers; new 17b: in landscape, the bottom button
never hides a setup choice.

## Questions for the next play-test
Do marked tickets pull eyes away from "Show claim" (and does blue read well for marks)? Does a paper tie happen in a
phone-ticket game? Do players with the cue on wait for it? Does anyone in the family have a 320 px phone?
