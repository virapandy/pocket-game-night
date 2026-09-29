# Test report
Commit tested: 5030bde (app code), with the Phase 2 tests added in this commit   Date: 2026-09-29
Result: RED, as expected: the new Phase 2 (phone tickets) tests fail because phone tickets are not built yet.
Everything that passed before still passes.

Phase 2 was signed off by the owner on 29 September 2026. Every Phase 2 scenario in `specs/tambola/` is now
`approved`, with the product owner's verdicts applied (TAM-050 reworded, TAM-133 moved to Phase 6, TAM-179 changed)
and the additions from `docs/games/tambola/changes-2026-09-29-phone-tickets.md` (TAM-122 and TAM-173 replaced,
TAM-191 to TAM-196 new, the "claim on the phone is fully manual" decision and the extensibility note). TAM-211 is a
Phase 6 draft. 54 Phase 2 scenarios in all.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 324 (321 before + 3 new) | 89 (all new, Phase 2) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 197 (unchanged) | 41 (all new, Phase 2) | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 192 (unchanged) | 40 (all new, Phase 2) | 7 (6 before + TAM-057 offline, see below) |

Every new test fails for the right reason: the rule tests because `makeTickets`, the QR functions, the host view's
`tickets` and the `check-claim` move don't exist yet (the app refuses phone-ticket games: "Phase 1a plays with paper
tickets only"); the browser tests because `Phone tickets (coming later)` is disabled. The 3 new tests that already pass
are contract-suite checks that hold for any game (repeatable, no seed shown, undo replays cleanly); they will keep
checking once phone games are built.

## Failing (real bugs only)
None. All failures are the Phase 2 features still to build.

## Flaky or setup problems (not for the Build workspace)
- None in this run.
- The uncommitted Phase 2 work from the interrupted session is reviewed, finished and in this commit. The Test clone
  is clean.

## For the Build workspace: what to build against
- Rule tests: `tests/games/tambola/tickets.test.ts`, `phone-claims.test.ts`, `phone-secrets.test.ts` and
  `tests/contract/tambola-phone.test.ts`. Names and shapes: `tests/games/tambola/README.md`, "Phase 2: phone tickets"
  (`makeTickets`, `ticketInfo`, `encodeTicket`/`decodeTicket`, `typedCode`/`decodeTypedCode`, `encodeClaim`/
  `decodeClaim`, `readClaim`; moves `check-claim`, `assign`, `to-paper`; the host view's `code` and `tickets`).
  The "Waiting for Phase 2" checks (TAM-034, TAM-035, TAM-036, TAM-038) are back as phone-ticket tests.
- Browser tests: `tests/browser/phone-tickets.spec.ts` and `phone-claims.spec.ts`. Button words, labels, test ids and
  the camera hook: `tests/browser/README.md`, "Phase 2: phone tickets".

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
1. **Camera test hook** (needed): when `window.__pgnCamera` exists, "Scan a claim" calls
   `window.__pgnCamera.start(onRead, onFail)` instead of the real camera (details in `tests/browser/README.md`).
2. **`data-payload`** on every QR (`ticket-qr`, `claim-qr`): the exact text the QR encodes, so tests never decode images.
3. **Dependencies, likely needed (for the coder's complexity-budget case):**
   - Drawing QR codes: browsers have no built-in QR maker. A small library (for example `qrcode-generator`, about
     20 KB, no dependencies) is much simpler than writing the error-correction code by hand.
   - Reading QR codes on the host: Chrome on Android has a built-in reader (`BarcodeDetector`), but Safari on iPhone
     does not, so an iPhone host needs a reader library (for example `jsQR`, about 45 KB minified, or `qr-scanner`,
     which uses the built-in reader when there is one). Players need nothing: their phone's own camera opens the link.
   - Optional, test side later: `jsqr` as a dev dependency would let one browser test check that the QR drawn on screen
     really holds its `data-payload`. Not needed for the tests in this commit.

## Questions for the owner (tests follow the approved wording; answers may change them)
1. **TAM-117, the typed code is too short to hold a ticket.** 12 characters (without 0, O, 1, I, L) hold about 59.5
   bits; a Tambola ticket alone needs about 61.7 bits (about 3.7 million million million possible tickets), before the
   ticket number and game code. Because nothing can be fetched and no seed may be shared (TAM-053, TAM-057), the code
   must carry the whole ticket. The two tests ("at most 12 characters" and "the code alone opens the ticket") cannot
   both pass. Suggested: allow up to **20 characters in 5 groups of 4** ("7K3P-M4X9-2TRD-8QWE-5HJN"), carrying the
   ticket, its number and the game code; the name, start time and prize list come only with the QR.
2. **TAM-178, "with the prize already picked":** the design has the camera open at once and the prize come from the
   QR, so when the camera fails the host has not picked a prize yet. The tests accept either: the host picks the
   prize after typing the number, or it is already picked.
3. **"Scan a claim" (TAM-177, TAM-178) or "Check a claim" (the screen design)?** The tests accept either name.
4. **TAM-053 says the QR holds the ticket, its number and the game code "and nothing else"**, but TAM-170 and TAM-172
   add the player's name, the start time and the prize list. The tests allow exactly those, and never a seed.
5. **TAM-194, handing out in order:** the tests hand tickets out strictly in order (Riya 1–2, Asha 3–5, Dad 6, …), so a
   player spans two sheets only when the current sheet has too few left. The other reading, skipping to a fresh sheet
   and leaving the rest unused (TAM-176), is not what the tests expect. Please confirm.
6. **Late joiners in a phone-ticket game (TAM-067):** no Phase 2 scenario says whether a late joiner gets phone tickets
   handed out. No test for it yet.
7. **TAM-057 offline on iPhone:** the "scan with no internet" test runs on Android only, for the same WebKit limit as
   the owner's decision of 28 September 2026 (Playwright issue #42775). The iPhone test still checks that nothing is
   fetched from another server. Please confirm this extends the decision; the iPhone offline scan joins the by-hand check.
8. Still open from the last report: PLT-029 vs PLT-016 (the question after "(new)"), and PLT-017 "got back".

## Notes for the owner (plain English)
- Phone tickets are now fully described as tests: handing out tickets, players scanning and marking them, all tickets
  together or one at a time, quick mark, the "your marks fill a row" hint, crossing out won prizes, showing a claim,
  and the host scanning it, with typing the ticket number as the backup. They fail now because the coder hasn't built
  phone tickets yet; that is the next step.
- One thing needs your decision first: the typed ticket code can't fit in 12 characters (question 1). We suggest 20.
- An edited or damaged claim QR ("doesn't match ticket 3", then "Check ticket 3 by number") is checked in the rule
  tests only; the browser tests can't make a damaged QR.
