# Feedback and problem reports (Phase 7)

How real families tell us what went wrong, without accounts and without sharing personal data.

## PLT-200: Report a problem from any screen
Status: approved, owner, 2026-10-01 (a real version number, docs/handover.md step 2); was approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
When the host taps "Report a problem" (in the menu, not in the thumb zone)
Then a short form asks "What happened?" with an optional sentence
And the report includes the app version, the phone type, and the game's seeds and moves, so it can be replayed
And the app version is a real release number, such as "1.0.0" (major.minor.patch, 1.0.0 or later; never "0.0.0"),
the same on the host's and the players' phones, so every report can be matched to a release
(For a game still in progress, the seeds wait until the game ends: PLT-206.)

## PLT-201: Reports never include personal data
Status: approved, owner, 2026-10-01 (docs/decisions.md 2026-10-01: reports include the game's money numbers); was approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve; then "never includes … money amounts")
Phase: Phase 7
Then a report never includes player names or session names;
names are replaced with "Player 1", "Player 2" …
And it does include the game's money numbers: the contribution per ticket, the prize amounts and the payouts
(what each person paid and won), with the names in them replaced too, so money bugs can be replayed (PLT-204)
And the host sees exactly what will be sent before sending it

## PLT-202: Reports wait for a connection
Status: approved, owner, 2026-10-01 (docs/decisions.md 2026-10-01: reports kept by the stub are listed as waiting); was approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
Given the phone has no internet
When the host sends a report
Then it is kept on the phone and sent automatically when a connection returns
And it never interrupts a game
And while sending is not set up yet (the stub, PLT-208), every report kept on the phone is listed under
"Reports waiting to send" (PLT-209) with the note "Kept on this phone: sending isn't set up yet"

## PLT-203: Crashes are caught and offered as reports
Status: approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
When the app hits an unexpected error
Then the game is saved, the host sees a calm "Something went wrong; your game is safe" message,
and is offered to send a report (never sent without asking)

## PLT-204: Every report becomes a replay
Status: approved, owner, 2026-10-01 (docs/decisions.md 2026-10-01: money bugs can be replayed from a report); was approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
When a report arrives with seeds and moves
Then the Test workspace can replay the exact game, and a confirmed bug is saved as a permanent test (TAM-074)
And because the report holds the money numbers (PLT-201), the replay has the same pot, prize amounts, winners'
shares and payouts, so a money bug can be replayed too

## PLT-205: Reports are sorted before anyone reads them
Status: approved, owner, 2026-10-01 (docs/decisions.md 2026-10-01: the sorting words); was approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
When reports arrive
Then each is sorted into bug, confusion, idea or noise, and grouped with similar reports
(By Jev where available, otherwise by simple rules), and the owner gets a ranked weekly list
The simple rules (product owner, 2026-10-01, docs/decisions.md), on the words in "What happened?", in any case:
- bug: something went wrong ("crash", "error", "wrong", "didn't work", "stuck")
- confusion: didn't know how ("how do I", "where is", "can't find", "confusing", "didn't understand")
- idea: a wish ("add", "wish", "would be nice", "could you", "idea")
- otherwise noise
And a report with a caught error (PLT-203) is always a bug

## Gaps found in the review of 28 September 2026 (new drafts)

## PLT-206: A report never gives away a game still being played
Status: approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
Given a game is in progress and the host reports a problem
Then the report is sent with the moves so far but without the game's seeds
And the seeds are added, and the full report sent, only once that game has ended or been discarded
And the host is told so: "Your report will be sent when this game ends"
(So nobody could ever learn the coming numbers from a report.)

## PLT-207: A player can report a problem from their phone ticket
Status: approved, owner, 2026-09-29 (Phase 7 sign-off, with the product owner's verdict of 2026-09-28: approve)
Phase: Phase 7
Given a player holds a phone ticket (Phase 2)
When they tap "Report a problem" on their ticket screen
Then the report includes only what their phone has: the app version, the phone type, their own ticket and their marks
And never another ticket, a seed, or a name (TAM-053, PLT-201)

## PLT-208: Nothing leaves the phone unless a person shares it
Status: decided, owner, 2026-10-22 (docs/scenario-drafts/plt-208-209-share-sheet.md, version 2: "Report a problem" made real through the phone's share sheet; replaces the 2026-09-28 stub wording)
Phase: Phase 7
Then the app sends nothing in the background: no analytics, no tracking, no automatic crash upload
And the only way a report leaves the phone is the person sharing it through the phone's own share sheet, after seeing it (PLT-201)
And it needs no account, no sign-in and no server of ours, and costs nothing
When the person taps the report screen's main button "Share report"
Then the app calls the share sheet with:
- title "Pocket Game Night problem report"
- text, in this order, one item per line: "Problem report · <game title> · app <version> · <date and time, phone's format>"
  (a report started from Home, with no game, leaves the game out: "Problem report · app <version> · <date and time>");
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
And when "Share report" is tapped while its game is still being played, nothing opens and the toast reads "Kept. You can
share it when this game ends." (confirmed by the product owner, 23 October 2026)
And a game still being played follows PLT-206: its report waits, with the line "This report can be shared when the game
ends, so it can't give away the game.", and when that game ends or is discarded Home shows the row "A problem report is ready
to share" with the button "Share", which opens the same share sheet

## PLT-209: Reports not yet shared can be seen, shared or deleted
Status: decided, owner, 2026-10-22 (same draft)
Phase: Phase 7
Given two reports have not been shared (closed without sharing, or waiting for their game to end)
When the person opens Settings, "Reports to share" (renamed from "Reports waiting to send")
Then both are listed with their date and first line, newest first
And each has "Share" (disabled with the small line "Waiting for the game to end" while PLT-206 applies) and "Delete"
And "Delete" asks "Delete this report? It hasn't been shared." with "Delete" and main "Keep it"
And a report is removed only after a share completes, never twice
And the old note "Kept on this phone: sending isn't set up yet" is gone

