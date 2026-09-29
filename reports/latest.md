# Test report
Commit tested: 5030bde (app code; unchanged at 1d748a2), with the Phase 2 test updates added in this commit   Date: 2026-09-29
Result: RED, as expected: the Phase 2 (phone tickets) tests fail because phone tickets are not built yet.
Everything that passed before still passes.

This commit applies the owner's answers of 30 September 2026 (`docs/decisions.md`, commit 1d748a2):
- **TAM-117** reworded: the typed code is exactly 20 characters in 5 groups of 4 (such as K7QM-2XPA-9RTD-4HWC-B3NF),
  carrying the whole ticket (numbers and layout, ticket number, game code) so it opens offline. Tests rewritten.
- **TAM-053** reworded: the ticket QR holds exactly the ticket, its number, the game code, the player's name, the start
  time and the prize list, never a seed. The tests already checked exactly these; only their titles changed.
- **TAM-194** clarified: tickets are handed out strictly in order; a player's tickets span two sheets when the current
  sheet has too few left, and no ticket is skipped. Two tests added.
- **TAM-212** (new, extends TAM-067): in a phone-ticket game, a late joiner gets phone tickets from the next sheet,
  on the same hand-out screen. Rule tests and browser tests added.
- The host's button is **"Scan a claim"**: the browser tests now require exactly that name ("Check a claim" no longer passes).
- TAM-178 (either form of picking the prize) is unchanged, as the owner asked. TAM-057's iPhone offline test stays
  skipped under the 28 September WebKit decision, now confirmed by the 30 September decision.
All changed scenarios are `approved, owner, 2026-09-30`.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays | `npm test` | 324 (unchanged) | 104 (89 before + 15 new, all Phase 2) | 0 |
| Browser, Android (Chromium) | `npm run build && npm run test:browser` | 197 (unchanged) | 43 (41 before + 2 new, all Phase 2) | 1 (unchanged) |
| Browser, iPhone (WebKit) | same | 192 (unchanged) | 42 (40 before + 2 new, all Phase 2) | 7 (unchanged) |

Every failing test fails for the right reason:
- Rule tests: `makeTickets`, `ticketInfo`, `typedCode` and the other QR functions are not exported, the host view has no
  `tickets`, `check-claim`, `assign` and `to-paper` are not moves yet, and a phone-ticket game refuses to call
  ("Phase 1a plays with paper tickets only"). The 12 new late-joiner rule tests all stop at that refusal.
- Browser tests: all 85 stop at the disabled `Phone tickets (coming later)` button on setup.

### Failing tests by file (all Phase 2 features still to build)
- `tests/games/tambola/tickets.test.ts` (20): TAM-001 to TAM-008, TAM-048, TAM-172, TAM-194. No `makeTickets`, no host `tickets`.
- `tests/games/tambola/phone-claims.test.ts` (43): TAM-020 to TAM-032, TAM-034 to TAM-036, TAM-038, TAM-041, TAM-043,
  TAM-044, TAM-056, TAM-058, TAM-070, TAM-072, TAM-145, TAM-172, TAM-174 to TAM-176, TAM-178, TAM-190. No `check-claim` move.
- `tests/games/tambola/phone-secrets.test.ts` (27): TAM-050 to TAM-055, TAM-057, TAM-117, TAM-170, TAM-172, TAM-176 to
  TAM-179, TAM-196. QR and typed-code functions not exported.
- `tests/games/tambola/phone-late-joiners.test.ts` (12, new): TAM-212 with TAM-032, TAM-050, TAM-067, TAM-117,
  TAM-172, TAM-174. Phone-ticket game refuses to start calling.
- `tests/contract/tambola-phone.test.ts` (2): the contract suite for a phone-ticket game (always ends, TAM-077): the game cannot call.
- `tests/browser/phone-tickets.spec.ts` (49 across both phones): TAM-050, TAM-051, TAM-055 to TAM-058, TAM-117, TAM-121,
  TAM-122, TAM-131, TAM-132, TAM-170 to TAM-173, TAM-191, TAM-192, TAM-194 to TAM-196. `Phone tickets` disabled.
- `tests/browser/phone-claims.spec.ts` (32): TAM-020, TAM-022, TAM-023, TAM-032, TAM-033, TAM-036, TAM-038, TAM-044,
  TAM-056, TAM-058, TAM-174, TAM-175, TAM-177 to TAM-179, TAM-190, TAM-193, TAM-196. `Phone tickets` disabled.
- `tests/browser/phone-late-joiners.spec.ts` (4, new): TAM-212. `Phone tickets` disabled.

## Failing (real bugs only)
None. All failures are Phase 2 features still to build.

## Flaky or setup problems (not for the Build workspace)
- None in this run.

## For the Build workspace: what to build against
- Everything in the last report still holds (`tests/games/tambola/README.md` and `tests/browser/README.md`, "Phase 2:
  phone tickets"). What changed:
  - Typed code: exactly `XXXX-XXXX-XXXX-XXXX-XXXX` (20 characters, no 0, O, 1, I, L); `decodeTypedCode` gives
    `{ rows, ticket, game }`; every ticket in a game has its own; codes of the wrong length are refused.
  - The host's button is exactly `Scan a claim`.
  - Late joiners with phone tickets: `add-player` adds the joiner's tickets to the host view's `tickets`, after every
    ticket already in the game, from the next sheet (README "Late joiners with phone tickets"); in the browser, the
    hand-out screen shows them, then `Back to calling` (or `Start calling`) (browser README "Late joiners").

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
1. **Camera test hook** and **`data-payload`** on every QR: still needed, as in the last report.
2. **QR libraries (owner approved, 30 September 2026):** a small QR drawing library and a QR reading library for
   iPhone hosts (Android uses the built-in reader). The Build side adds them.
3. **Optional dev dependency `jsqr` (request, not installed):** it would let one browser test check that the QR drawn
   on screen really decodes to its `data-payload`, which today is trusted. Problem it solves: a QR drawn wrongly (or
   too small to decode) would pass every current test. Simpler option: none in the browser; the rule tests only
   check the text. Cost: one dev dependency, about 45 KB, test-only, never shipped. Worth it if it ever catches a QR
   that looks right but does not scan. Recommended once QR drawing is built.

## Questions for the owner (tests follow the approved wording; answers may change them)
1. **TAM-212, "from the next sheet" when a sheet is part used.** With 6 tickets (a full sheet) handed out, the late
   joiner clearly gets 7 onwards; the tests check that exactly. With, say, 3 tickets handed out, "next sheet" could
   mean tickets 4 onwards (carry on in order, as TAM-194) or 7 onwards (a fresh sheet). The tests accept either for
   now: new, consecutive tickets after every ticket already in the game, never a number used twice. Please say which.
2. **The claim QR.** The 30 September decision row says "the claim QR carries the ticket, ticket number, game code,
   player name, start time and prize list". That list is what the *ticket* QR (TAM-053) holds, so TAM-053 was
   reworded to it. The claim QR (TAM-177) must also carry the prize claimed, and its tests are unchanged: format
   version, game code, ticket number, prize and the ticket's numbers, never a seed. Please confirm.
3. Still open from before: PLT-029 vs PLT-016 (the question after "(new)"), and PLT-017 "got back".

## Notes for the owner (plain English)
- Your answers are now in the tests. The typed code is 20 characters, so a player can type it with no internet and
  still get their exact ticket. The host's button is "Scan a claim". Tickets are handed out strictly in order.
- New: someone arriving late to a phone-ticket game gets phone tickets from the next sheet, handed out on the same
  screen as at the start, and can win like anyone else. Something already complete on their ticket when they join
  can't be claimed, as with paper.
- The product docs still call the button "Check a claim" in `docs/games/tambola/ux-phone-tickets.md` and
  `ux-calling-screen.md`; the product owner may want to update them.
- Everything new fails for now because the coder hasn't built phone tickets yet; that is the next step.
