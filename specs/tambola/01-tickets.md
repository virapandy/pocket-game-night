# Tickets

A Tambola ticket is a grid of 3 rows and 9 columns holding 15 numbers.
Column 1 holds 1–9, column 2 holds 10–19, and so on up to column 9, which holds 80–90.

## TAM-001: Every ticket has 15 numbers, 5 in each row
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
For every ticket the app makes
Then it has exactly 15 numbers
And each of its 3 rows has exactly 5 numbers and 4 blank spaces

## TAM-002: Every number sits in its column's range
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
For every ticket the app makes
Then every number in column 1 is between 1 and 9
And every number in column 2 is between 10 and 19, and so on
And every number in column 9 is between 80 and 90

## TAM-003: No column is empty, and none is overfull
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
For every ticket the app makes
Then every column has at least 1 number and at most 3

## TAM-004: Numbers go down each column in order
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
For every ticket the app makes
Then within each column, numbers increase from top to bottom

## TAM-005: No number appears twice on a ticket
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
For every ticket the app makes
Then all 15 numbers are different

## TAM-006: A sheet of 6 tickets uses every number exactly once
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
When the app makes a full sheet of 6 tickets
Then every number from 1 to 90 appears exactly once across the 6 tickets

## TAM-007: Tickets for different players are different
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
Given a game with 10 players
When tickets are handed out
Then no two players hold identical tickets

## TAM-008: The same sheet seed always gives the same tickets
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
Given the host's sheet seed (host-only, like the draw seed)
When the tickets are made from it today, and again later when the game is replayed
Then every ticket is identical, number for number
(Tickets are made in sheets of 6 on the host phone. Each player's phone receives only its own
ticket's numbers, never a seed: see TAM-053.)

## TAM-009: Retired
Status: retired 2026-09-28 (the app no longer prints or shares ticket images; tickets are paper or on phones)
