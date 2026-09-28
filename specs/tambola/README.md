# Tambola scenarios

These are the test cases for Tambola in plain English. Each scenario becomes one or more automated
tests once the owner approves it. All are **draft** until approved.

| File | Covers | Scenarios |
|---|---|---|
| [01-tickets.md](01-tickets.md) | What a valid ticket and sheet look like | TAM-001 – TAM-009 |
| [02-calling.md](02-calling.md) | Drawing and calling numbers | TAM-010 – TAM-017 |
| [03-claims.md](03-claims.md) | Checking claims: accepted, bogey, already won | TAM-020 – TAM-034 |
| [04-house-rules.md](04-house-rules.md) | Scenarios that depend on owner decisions | TAM-040 – TAM-049 |
| [05-secrets-and-seeds.md](05-secrets-and-seeds.md) | Nobody sees what they shouldn't | TAM-050 – TAM-056 |
| [06-room-and-host.md](06-room-and-host.md) | Fun-friction defaults and host controls | TAM-060 – TAM-066 |
| [07-undo-replay-end.md](07-undo-replay-end.md) | Undo, replay, and how the game ends | TAM-070 – TAM-078 |

## How to approve
Read a file. For each scenario, either leave it (approve), change the words, or delete it.
Then tell Claude in the desktop app "approve 01, 02, 03" (or whichever). Claude changes
`Status: draft` to `Status: approved, owner, <date>` and writes the tests.

Scenarios in `04-house-rules.md` show the choices. Pick one per question, and that scenario is finished.

## Words used
- **Anchor**: the person calling numbers aloud, reading from the host phone.
- **Host phone**: the phone that runs the game and is the referee.
- **Bogey**: a false claim.
- **Pattern**: what a player claims (Early Five, Top Line, Full House …).
- **Seed**: a secret starting number that decides the random draw or a ticket. The same seed always gives the same result.
