# Test report
Commit tested: 280a32d (app, with e4f99e7's fixes; tests 6dbb0c5 plus this round's test-side timing fix)   Date: 2026-10-01
Result: GREEN on this computer; automation run for the fix: PENDING (filled in below once it finishes)

Task: `docs/handover.md` "Next, in order" item 0, make automation ("Check and publish") green.

| Layer | Command | Passing | Failing | Skipped |
|---|---|---|---|---|
| Rules, contract, property, simulation, replays, key check (no Jev key) | `npm test` | 486 | 0 | 0 |
| Browser, Android (Chromium) and iPhone (WebKit) together | `npm run build && npm run test:browser` | 508 | 0 | 8 (unchanged, deliberate) |
| iPhone (WebKit) phone-ticket, claim, late-joiner and report files, 3 repeats, 8 workers, `CI=1` | `playwright test --project=iphone … --repeat-each=3` | 177 | 0 | 3 (deliberate) |

Not re-run this round: the Android emulator, the 100,000-game simulation and mutation testing (not part of item 0).

## Why automation was red since 53ac5db (runs 36610989976, 36656861486, 36788485111, 36804238090)
Every failure in all four runs (2, 3, 8 and 4 tests, a different set each time, iPhone engine only) is the same
step: `scanTicket` in `tests/browser/phone.ts`, "the phone ticket appears" (`phone-ticket` not found within 5 s),
on the first scan right after the test opened the app on a fresh player phone (`goto(HOME)` then the ticket link).
Affected tests: phone-claims (TAM-179, TAM-196, TAM-044, TAM-178, TAM-036), phone-tickets (TAM-170, TAM-173,
TAM-191, TAM-192, TAM-194, TAM-117/TAM-057), phone-late-joiners (TAM-212), report-problem (PLT-207, PLT-208).

Cause: test timing, not an app bug. A ticket link opened in an app that is already showing its home screen
changes only the "#t=…" part of the address, and the app picks it up once it has finished starting. Playwright
changed the address the instant the page reported "loaded"; on the slower Linux runner (2 workers) that landed in
the few milliseconds between the app's first screen being drawn and the app listening for a new address, so the
link was missed. Reproduced here on both engines by changing the address at exactly that moment (ticket lost);
changing it 1 ms or more later always worked. No person can scan a QR within milliseconds of the app opening, and
a QR opened in a closed app works because the app reads the address on start.

Fix (test side, no check loosened): `scanTicket` first waits until the app open on that phone has started (its
main screen is visible and two frames have passed), then opens the link. The ticket must still appear within the
same 5 seconds, and every assertion is unchanged. Checked with the worst case forced: 5 of 5 on each engine.

Retries: configured as PLT-122 says. PLT-122 covers emulator and simulation runs: the Android emulator config
retries once (`tests/playwright.android.config.ts`, `retries: 1`) and a failed Jev call is retried once
(`tests/sim/jev.ts`). The ordinary browser checks keep `retries: 0` on purpose ("a flaky test is a finding"), and
I have not changed that: retrying them would hide failures like this one, and that needs the owner's approval.

## Failing (real bugs only)
- None.

## Flaky or setup problems (not for the Build workspace)
- The failing automation runs above: test timing, fixed on the test side (see above).
- The automation does not upload Playwright traces (`test-results/`), so failed runs can only be studied from the
  log. Optional request below.

## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
1. Optional, small: in `.github/workflows/ci.yml`, after "Browser tests", upload `test-results/browser/` as an
   artifact when the step fails (`actions/upload-artifact@v4`, `if: failure()`, `retention-days: 7`), so the
   tester can open traces of a failed run.
2. Optional robustness, not a bug: a ticket link that arrives while the app is still starting (within
   milliseconds) is dropped and the address cleared. No person can do this; only mention it if you touch that code.
3. Earlier requests (Stryker, scripts, weekly workflow) were done in 280a32d.

## Notes for the owner (plain English)
- The automatic checks have been failing because the test robot "scanned" a ticket a few thousandths of a second
  after opening the app on a pretend phone, faster than any person can, on the slower online computer. The app was
  fine. The robot now waits until the app has finished opening before it scans; it still checks everything it
  checked before, just as strictly.
- Once the automatic checks pass, the live preview updates with phone tickets and "Report a problem".
