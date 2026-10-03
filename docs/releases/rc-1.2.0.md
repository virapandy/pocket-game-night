# Pocket Game Night 1.2.0 (release candidate rc-1.2.0)

The "next UX list" from the 1.1.0 release review (`docs/games/tambola/ux-review-2026-10-03-release-1.1.0.md`).
Tambola only: Impostor is still being built and is not in this release (cut on branch `release/1.2`).

## For the host
- **Paper winners in phone games (N1):** a claim for a ticket that plays on paper now offers "Pick the winner by
  name", also while a won prize waits to be closed. No more dead end. A wrong or tampered claim QR still gets its own
  warning and "Check ticket N by number".
- **Hand-out (N5):** the last-ticket question is now "Has Zoya got their ticket?" with "Yes, start calling",
  "Not yet, hand it out" and "Give a paper ticket".
- **Verdict card (point b):** "Undo claim" and "Done" stay pinned at the bottom, also on small and sideways phones.
- **Calling screen:** "Screen may sleep" sits on a thin line under the header (N2); nothing under the rhyme before the
  first call; a lighter Called · Undo bar.
- **Payouts:** "Settle with host" / "Settle with players" fit on small phones.
- **Prizes step:** the "Once you confirm…" note and the session name show in full on small phones.

## For players (phone tickets)
- **The hint line (point a):** up to two lines in short words, "Ticket 1: Early Five, Top Line. Shout!", with
  "More" only when even that doesn't fit.
- **Quick mark:** fits sideways phones, with the pad beside the ticket pictures (N3); the ✓ sits in the key's corner,
  clear of the number (N4).
- **Sideways phones:** "Which prize?" buttons full size; the claim QR's "Done" on screen.

## Testing for this release
- Every Tambola rule and browser test passed on Android and iPhone in the complete run on this candidate.
- Owner-approved for this release only: the complete run left out Impostor's tests (not in this release) and the
  screenshot comparison; the product owner approves the pictures from the release branch's own screenshot run
  (Screenshots run 37119724773).
- Saved games and tickets from 1.0.0 and 1.1.0 still open.
