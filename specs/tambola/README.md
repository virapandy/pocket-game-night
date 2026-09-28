# Tambola scenarios

These are the test cases for Tambola in plain English. The game itself is explained in
[docs/tambola-guide.md](../../docs/tambola-guide.md), which these scenarios were checked against,
and the host and player journeys are in [docs/tambola-journeys.md](../../docs/tambola-journeys.md). Each scenario becomes one or more automated
tests once the owner approves it. All are **draft** until approved.

| File | Covers | Scenarios |
|---|---|---|
| [01-tickets.md](01-tickets.md) | What a valid ticket and sheet look like | TAM-001 – TAM-008 |
| [02-calling.md](02-calling.md) | Drawing and calling numbers | TAM-010 – TAM-017 |
| [03-claims.md](03-claims.md) | Checking claims: accepted, bogey, already won, paper tickets | TAM-020 – TAM-038 |
| [04-house-rules.md](04-house-rules.md) | Scenarios that depend on owner decisions | TAM-040 – TAM-049 |
| [05-secrets-and-seeds.md](05-secrets-and-seeds.md) | Nobody sees what they shouldn't; phone tickets | TAM-050 – TAM-058 |
| [06-room-and-host.md](06-room-and-host.md) | Fun-friction defaults, host controls, late joiners, play again | TAM-060 – TAM-069 |
| [07-undo-replay-end.md](07-undo-replay-end.md) | Undo, replay, and how the game ends | TAM-070 – TAM-078 |
| [08-prizes.md](08-prizes.md) | Contribution, pot, suggested split, payouts; no money moved | TAM-080 – TAM-089 |

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

## Checked against the guide (28 September 2026)
| Result | Scenarios |
|---|---|
| Match the established rules | TAM-001–009 (ticket and sheet of 6), TAM-010–017 (calling), TAM-020–029 (patterns), TAM-050–056 |
| Fixed to match | TAM-030 (a tie on the same number is shared, not refused as "already won"), TAM-076 (after 90 calls every ticket is complete) |
| Added from the guide | TAM-035 (unmarked called numbers still count), TAM-036 (a claim is judged at the moment it is made) |
| House-rule options marked **norm** | TAM-040–048; the norm differs from the family-friendly recommendation only for TAM-044 (bogey penalty) |
| App-specific (no traditional rule to check) | TAM-060–066 (room defaults, offline), TAM-070–074 (undo, replay), TAM-077 |
