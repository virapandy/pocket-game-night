# Platform scenarios

Behaviour shared by every game, with the prefix `PLT-`. Game-specific behaviour lives in `specs/<game>/`.

| File | Covers | Scenarios |
|---|---|---|
| [01-lifecycle.md](01-lifecycle.md) | Game states, resume, abandon, history, delete, storage, updates, sessions and the tally | PLT-001 – PLT-028 |
| [02-contract-and-new-games.md](02-contract-and-new-games.md) | The contract suite every game must pass, new games plugging in, the generic simulated player | PLT-100 – PLT-113 |
| [03-feedback.md](03-feedback.md) | Reporting problems, crash reports, privacy, replays, sorting | PLT-200 – PLT-209 |
| [04-extended-testing.md](04-extended-testing.md) | Mass simulations, mutation testing, Android emulator runs; everything passes without a Jev key | PLT-114 – PLT-123 |
