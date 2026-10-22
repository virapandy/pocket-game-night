# PLT-208 and PLT-209, version 2: sending a report through the phone's share sheet (product owner, 22 October 2026)

Status: **decided** (owner, 22 October: "Report a problem" made real before Secret Words reaches families, no hand testing;
mechanism and words by the product owner). For the tester to replace PLT-208 and PLT-209 in `specs/platform/03-feedback.md`,
tests first (C3). PLT-201 (what a report holds), PLT-203, 204, 205, 206 and 207 are unchanged.

## PLT-208: Nothing leaves the phone unless a person shares it
Phase: Phase 7
Then the app sends nothing in the background: no analytics, no tracking, no automatic crash upload
And the only way a report leaves the phone is the person sharing it through the phone's own share sheet, after seeing it (PLT-201)
And it needs no account, no sign-in and no server of ours, and costs nothing
When the person taps the report screen's main button "Share report"
Then the app calls the share sheet with:
- title "Pocket Game Night problem report"
- text, in this order, one item per line: "Problem report · <game title> · app <version> · <date and time, phone's format>";
  the "What happened?" text (or "(nothing written)"); "Replay attached. Please send this to whoever shared the app with you."
- the replay as a file `pgn-report-<YYYYMMDD-HHMM>.json` (the report of PLT-201, as JSON)
And where the phone can share text but not files, the text ends instead with "Replay code:" and the report as one line of
base64 text
And where the phone has no share sheet, the report text with the replay code is copied to the clipboard and the toast reads
"Report copied. Paste it in a message to whoever shared this app."
And when the share sheet closes after sharing, the toast reads "Thanks! Your report is on its way." and the report is removed
from the phone
And when the share sheet is closed without sharing, the toast reads "Not shared. It's kept in Settings, under Reports to
share." and the report stays (PLT-209)
And a game still being played follows PLT-206: its report waits, with the line "This report can be shared when the game
ends, so it can't give away the game.", and when that game ends or is discarded Home shows the row "A problem report is ready
to share" with the button "Share", which opens the same share sheet

## PLT-209: Reports not yet shared can be seen, shared or deleted
Phase: Phase 7
Given two reports have not been shared (closed without sharing, or waiting for their game to end)
When the person opens Settings, "Reports to share" (renamed from "Reports waiting to send")
Then both are listed with their date and first line, newest first
And each has "Share" (disabled with the small line "Waiting for the game to end" while PLT-206 applies) and "Delete"
And "Delete" asks "Delete this report? It hasn't been shared." with "Delete" and main "Keep it"
And a report is removed only after a share completes, never twice
And the old note "Kept on this phone: sending isn't set up yet" is gone

## What the tester can assert
`navigator.share` and `navigator.canShare` are stubbed in tests (resolve = shared; reject with `AbortError` = closed without
sharing; absent = no share sheet); the clipboard is read through Playwright's clipboard permission. The shared payload's
title, text lines and file name are asserted exactly; the file's JSON is checked with `readReport` (PLT-204).
