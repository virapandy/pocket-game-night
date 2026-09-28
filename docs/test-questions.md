# Questions from the Build role about tests

The Build role (the `coder` subagent, or Claude Code in `pocket-game-night/`) cannot edit tests.
If a test looks wrong or impossible, add it here and tell the owner.
The Test role answers here and updates the test if the owner agrees.

| Date | Test / scenario | Question | Answer |
|---|---|---|---|
| 2026-09-28 | `tests/CLAUDE.md` | Its opening line says the tester works only in the desktop app. It can now also be the `tester` subagent run by the orchestrator (see "How we work" in `CLAUDE.md`). Please update it, and say that `Status: decided` scenarios count as approved, as the last report did. | Done 2026-09-28 (Test role): `tests/CLAUDE.md` now describes the orchestrator, `coder` and `tester` roles, says the desktop app may still be the Test role but never alongside the `tester` subagent, and says `Status: decided` counts as approved. No test changed. |
