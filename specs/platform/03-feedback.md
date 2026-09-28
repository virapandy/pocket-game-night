# Feedback and problem reports (Phase 7)

How real families tell us what went wrong, without accounts and without sharing personal data.

## PLT-200: Report a problem from any screen
Status: draft
Phase: Phase 7
When the host taps "Report a problem" (in the menu, not in the thumb zone)
Then a short form asks "What happened?" with an optional sentence
And the report includes the app version, the phone type, and the game's seeds and moves, so it can be replayed

## PLT-201: Reports never include personal data
Status: draft
Phase: Phase 7
Then a report never includes player names, session names or money amounts;
names are replaced with "Player 1", "Player 2" …
And the host sees exactly what will be sent before sending it

## PLT-202: Reports wait for a connection
Status: draft
Phase: Phase 7
Given the phone has no internet
When the host sends a report
Then it is kept on the phone and sent automatically when a connection returns
And it never interrupts a game

## PLT-203: Crashes are caught and offered as reports
Status: draft
Phase: Phase 7
When the app hits an unexpected error
Then the game is saved, the host sees a calm "Something went wrong; your game is safe" message,
and is offered to send a report (never sent without asking)

## PLT-204: Every report becomes a replay
Status: draft
Phase: Phase 7
When a report arrives with seeds and moves
Then the Test workspace can replay the exact game, and a confirmed bug is saved as a permanent test (TAM-074)

## PLT-205: Reports are sorted before anyone reads them
Status: draft
Phase: Phase 7
When reports arrive
Then each is sorted into bug, confusion, idea or noise, and grouped with similar reports
(By Jev where available, otherwise by simple rules), and the owner gets a ranked weekly list
