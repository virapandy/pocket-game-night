# Feedback and problem reports (Phase 7)

How real families tell us what went wrong, without accounts and without sharing personal data.

## PLT-200: Report a problem from any screen
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
When the host taps "Report a problem" (in the menu, not in the thumb zone)
Then a short form asks "What happened?" with an optional sentence
And the report includes the app version, the phone type, and the game's seeds and moves, so it can be replayed
(For a game still in progress, the seeds wait until the game ends: PLT-206.)

## PLT-201: Reports never include personal data
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Then a report never includes player names, session names or money amounts;
names are replaced with "Player 1", "Player 2" …
And the host sees exactly what will be sent before sending it

## PLT-202: Reports wait for a connection
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Given the phone has no internet
When the host sends a report
Then it is kept on the phone and sent automatically when a connection returns
And it never interrupts a game

## PLT-203: Crashes are caught and offered as reports
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
When the app hits an unexpected error
Then the game is saved, the host sees a calm "Something went wrong; your game is safe" message,
and is offered to send a report (never sent without asking)

## PLT-204: Every report becomes a replay
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
When a report arrives with seeds and moves
Then the Test workspace can replay the exact game, and a confirmed bug is saved as a permanent test (TAM-074)

## PLT-205: Reports are sorted before anyone reads them
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
When reports arrive
Then each is sorted into bug, confusion, idea or noise, and grouped with similar reports
(By Jev where available, otherwise by simple rules), and the owner gets a ranked weekly list

## Gaps found in the review of 28 September 2026 (new drafts)

## PLT-206: A report never gives away a game still being played
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Given a game is in progress and the host reports a problem
Then the report is sent with the moves so far but without the game's seeds
And the seeds are added, and the full report sent, only once that game has ended or been discarded
And the host is told so: "Your report will be sent when this game ends"
(So nobody could ever learn the coming numbers from a report.)

## PLT-207: A player can report a problem from their phone ticket
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Given a player holds a phone ticket (Phase 2)
When they tap "Report a problem" on their ticket screen
Then the report includes only what their phone has: the app version, the phone type, their own ticket and their marks
And never another ticket, a seed, or a name (TAM-053, PLT-201)

## PLT-208: Nothing leaves the phone unless the host sends it
Status: draft (product owner verdict 2026-09-28: approve with the change applied; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Then the app sends nothing in the background: no analytics, no tracking, no automatic crash upload
And the only thing that ever leaves the phone is a report the host (or player) chose to send, after seeing it (PLT-201)
And sending a report needs no account and no sign-in, and costs nothing ("$0 per month")
And until a real destination is chosen, sending goes to a stub: the report is kept on the phone and nothing leaves it; a real free, no-account destination is required before any wider public release (owner, 2026-09-28).

## PLT-209: Reports waiting to be sent can be seen and cancelled
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 7 comes up)
Phase: Phase 7
Given two reports are waiting for a connection (PLT-202)
When the host opens Settings, "Reports waiting to send"
Then both are listed with their date and first line
And the host can delete either before it is sent
And a report is sent only once, even if the connection drops and returns while sending
