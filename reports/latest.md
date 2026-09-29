# Test report
Commit tested: 89a5e90 (app code from c647056 and 8cb71d9, phone tickets), with the test changes in this commit   Date: 2026-09-29
Result: RED, by one test that I believe is wrong (below). No real bugs found. Every browser test passes on both phones.

Phase 2 (phone tickets) ran against a working feature for the first time. `npm ci` installed qrcode-generator and jsqr.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 427 | 1 (test fault, see below) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 242 | 0 | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 236 | 0 | 7 (unchanged, incl. TAM-057 offline under the WebKit decision) |

Both browser layers were run in full twice, with the same result each time. `npm test` was run four times and gave the same result every time.
All Phase 2 files now pass: `tickets.test.ts`, `phone-secrets.test.ts`, `phone-late-joiners.test.ts`,
`contract/tambola-phone.test.ts`, `phone-tickets.spec.ts`, `phone-claims.spec.ts`, `phone-late-joiners.spec.ts`,
and all of `phone-claims.test.ts` except the one test below.

## Failing (real bugs only)
None.

## Test faults (for the owner; not for the Build workspace)
- `tests/games/tambola/phone-claims.test.ts`, "TAM-041, TAM-190 and TAM-145 … both shares go to Riya when she holds
  both". **Not changed; waiting for the owner.** To make Riya hold both tied tickets, the test gives both of them to
  Riya. In this game one of the two (ticket 1) is already Riya's, and the app refuses to give her a ticket she already
  holds: "Ticket 1 is already Riya's". The test stops there, before it checks anything about the tie. No scenario says
  whether giving a ticket to the player who already holds it should be accepted or refused. The test README lists
  only an unknown player or ticket as reasons to refuse, so the app's refusal is not in the documented interface, but
  it is a reasonable choice. Proposed fix: only reassign a tied ticket that is not already Riya's. Every check on the
  tie stays the same: both claims accepted, the prize is shared exactly, and both shares go to Riya. This removes
  only the unstated assumption that giving Riya her own ticket again is accepted. **Question for the owner:** is
  "Ticket 1 is already Riya's" the right answer when the host gives Riya a ticket she already holds? If yes, apply the
  fix above and add that refusal to TAM-175 and the README. If no, this becomes a bug for the Build workspace.

Test faults fixed in this commit (none of them loosens an assertion):
- `phone-claims.spec.ts`, the 7 tests that call numbers until 5 of a ticket's numbers are out (TAM-177/174/020/033,
  TAM-038, TAM-179/196, TAM-178 ×3, TAM-175): they ran out of Playwright's default 30 seconds. The app draws about
  one number a second: "Next number" stays off until the new number is on screen (TAM-101, approved), and these
  games need 25 to 60 or more calls. They now allow 90 seconds, as `calling.spec.ts` already does for its 90 calls.
  The 2-second verdict limit and every other check are unchanged.
- `phone-tickets.spec.ts`, TAM-173/TAM-122 landscape: on Android it checked for scrolling on the same frame the
  emulated phone turned, before the page had re-laid itself out. Measured: the page fits within 20 ms, every time. The
  check now waits at most 1 second for the turn to finish, then requires exactly the same thing: no scrolling, two side
  by side, the third below, 40 px cells, every mark kept.

## New checks (jsQR now available)
- TAM-117 and TAM-053 (`phone-tickets.spec.ts`): each ticket QR, as drawn on the hand-out screen, is photographed and
  read with jsQR. It must read back exactly as its `data-payload` link. Checked for all 3 tickets, on both phones.
- TAM-177 (`phone-claims.spec.ts`): the claim QR on the player's phone, read the same way, must equal its `data-payload`.
- Helper `readDrawnQr` in `tests/browser/phone.ts`. It decodes in a blank page, so the app's page is untouched.
  Passing on both phones.

## Flaky or setup problems (not for the Build workspace)
- In the first full run, iPhone "TAM-173/TAM-122 portrait" failed once. A scanned ticket link did not show the ticket
  within 5 seconds, while the whole suite was running. It did not happen again in about 300 more runs of the phone-ticket
  specs on iPhone (repeated 3 and 8 times) or in two more full runs. I am watching it. If it comes back, I will send a
  trace to the Build workspace.

## Requests for the Build workspace
- None.

## Notes for the owner (plain English)
- Phone tickets work end to end in the automated checks on both an Android and an iPhone: handing out tickets with a
  QR and a typed code, players seeing and marking their tickets, quick mark, "Scan a claim" with the typed-number
  fallback, the host's ticket list, and late joiners getting phone tickets. The QR codes on screen really scan to the
  right thing.
- One question for you: if the host gives Riya a ticket she already holds, should the app say "Ticket 1 is already
  Riya's" and do nothing (what it does now), or quietly accept it? Either is fine for players. The answer decides
  whether one test changes or the app does.
- Two questions from the Build workspace are still open in `docs/test-questions.md`: 44 px cells on a narrow phone,
  and what a phone shows after only typing a ticket code.
