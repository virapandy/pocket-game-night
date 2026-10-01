# Test report
Commit tested: d3aa874   Date: 2026-10-01
Result: RED, as expected: new tests written before the code (loop step 2). Every test that existed before passes
unchanged on d3aa874; only the new and updated tests below fail, each for the reason the change needs.

Task: loop step 2 for `docs/handover.md` item 2 (app version) and item 2b, UX list rows 1, 1a and 2 to 7 (behaviour
approved by the owner on 1 October 2026). Scenarios written or updated (all `approved, owner, 2026-10-01`):
PLT-200, PLT-300 (new, Home), PLT-301 (new, one main button), TAM-053, TAM-057, TAM-103, TAM-124, TAM-089, TAM-137,
TAM-181, TAM-192, TAM-195, TAM-197, TAM-213 (new, paper or phone cards).

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays (no Jev key) | `npm test` | 512 | 5 (all new) | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) | `npm run build && npm run test:browser` | 508 | 58 (29 new or updated tests × 2 phones) | 8 (unchanged, deliberate) |

Where the names and test ids are written down for the Build workspace:
- `tests/browser/README.md`, new section "UX list of 1 October 2026" (main look, Home, paper or phone, the cue switch,
  the slim cue line, quick mark, the app version).
- `tests/games/tambola/README.md`, "The ticket QR, format version 2" (`settings.patternCue`, `cue`, `v: 2`; real
  format-1 QRs in `tests/fixtures/ticket-qr-v1.json`).

## Failing (new tests, waiting for the code; each fails for the right reason)
Rule level (`tests/games/tambola/phone-secrets.test.ts`):
- TAM-053/TAM-195 `ticketInfo` has no `cue`; the ticket QR decodes as `v: 1`, expected `v: 2` with `cue`.
- TAM-195 `tambolaDefaults.patternCue` is missing, expected `false`; `settings.patternCue: true` does not reach the QR.
- (Passing already, and must stay so: a real format-1 QR still opens with the cue off; a typed code never carries the cue.)

Browser (`home-and-buttons.spec.ts`, `pattern-cue.spec.ts`, `phone-tickets.spec.ts`, `setup-layout.spec.ts`, `report-problem.spec.ts`):
- PLT-200: reports say `appVersion` "0.0.0+local"; expected a release number such as "1.0.0".
- PLT-300/TAM-057: Home has no "Host a game" or "Join with my ticket", and no "You're ready for game night" on a first visit.
- PLT-300: Home's "Tap to resume" has the main look (solid red); unfinished games should be plain rows.
- TAM-213: the start screen does not say "Housie on paper or on phones"; tapping "Paper tickets" moves on at once, with no
  chosen state and no "Next" (TAM-181's ticket-mode test, replaced, fails the same way).
- TAM-195: no cue switch on the ticket-type step; with nothing turned on, the phone still shows the cue (always on);
  the slim-line tests and the three cue tests with the switch on stop at the missing switch.
- TAM-192: quick mark keys are 36 px tall (expected at least 44); thumbnails have no "Ticket 1" caption; quick mark has
  no "Show claim" (marked keys showing a ✓ is checked in the same test as the key height).
- TAM-103/PLT-301: in the End game question, "End game" has the main look; expected "Keep playing".
- TAM-197/PLT-301: "Play again" has the main look; expected outlined.
- PLT-301: in "One at a time" the chosen tab "Ticket 3" also has the main look, next to "Show claim".

## Tests replaced or adapted (behaviour the owner changed on 1 October; nothing loosened)
- TAM-181 "ticket-mode step: no separate Next; tapping Paper tickets moves on at once" (decision of 29 September) is
  replaced by "Next is fixed at the bottom and moves on once a card is chosen" (TAM-213).
- TAM-195: the three cue tests now turn the host's switch on first, and expect the new one-line wording
  ("Ticket 1: top row filled. Shout if it's right!") instead of "Your marks fill the top row of ticket 1…".
- TAM-053: the QR round trip expects format version 2 and the `cue` key (was version 1 without it).
- Shared steps go through the new screens: `openTambola` taps "Host a game" (or today's "Tambola" card),
  `chooseTicketType` taps a card then "Next" when there is one, typed codes go through "Join with my ticket" →
  "Type the code" (or today's "Enter ticket code"), History, Sessions and Settings may sit in Home's menu. The quick
  mark key may carry a ✓ in its name. All checks after these steps are unchanged.

## Flaky or setup problems (not for the Build workspace)
- None in the final runs. An earlier run of mine was disturbed by a one-off capture run I started alongside it (it
  cleared the shared results folder); the full run afterwards was clean.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
- None new. The early ticket link request still stands as optional.

## Notes for the owner (plain English)
- I wrote the scenarios for the app version and UX list rows 1, 1a and 2 to 7 exactly as you approved them on
  1 October, and tests for each. Everything that worked before still works; the new tests fail today simply because
  the changes are not built yet.
- Questions where the approved wording leaves a detail open (the tests accept either answer for now):
  1. Unfinished games on Home: the sketch shows an outlined "Resume", while PLT-004 says "Tap to resume". I kept
     "Tap to resume" and accept "Resume" too. Which words do you want?
  2. When one ticket fills two prizes at once (a full top row is also Early Five), what should the one line say? The
     tests accept "Ticket 1: top row filled" on the line, or under "More".
  3. Should "You're ready for game night" stay on Home after the first visit, or show only once? Only the first visit
     is tested.
  4. Home's menu: the sketch lists Settings there; today Settings is on the Tambola start screen. The tests ask for
     Settings to be reachable from Home (in the menu is fine). Please confirm.
  5. On the payout screen, which button (if any) should have the main look now that "Play again" is outlined? The
     tests only check that there is at most one and that it is not "Play again".
  6. Landscape with 3 tickets and Larger text (812 × 375): the tests require that the cue line covers no ticket and the
     three buttons stay on screen, but not that all three tickets fit without scrolling. Say if they must also fit.
- No scenarios are left in draft from this task.
