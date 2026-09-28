# Questions from the Build role about tests

The Build role (the `coder` subagent, or Claude Code in `pocket-game-night/`) cannot edit tests.
If a test looks wrong or impossible, add it here and tell the owner.
The Test role answers here and updates the test if the owner agrees.

| Date | Test / scenario | Question | Answer |
|---|---|---|---|
| 2026-09-28 | `tests/CLAUDE.md` | Its opening line says the tester works only in the desktop app. It can now also be the `tester` subagent run by the orchestrator (see "How we work" in `CLAUDE.md`). Please update it, and say that `Status: decided` scenarios count as approved, as the last report did. | Done 2026-09-28 (Test role): `tests/CLAUDE.md` now describes the orchestrator, `coder` and `tester` roles, says the desktop app may still be the Test role but never alongside the `tester` subagent, and says `Status: decided` counts as approved. No test changed. |
| 2026-09-28 | `tests/browser/helpers.ts` `fillPlayers` (used by TAM-084 in `setup.spec.ts`, 10 players) | `getByLabel('Name of player 1')` is a substring match in Playwright, so with 10 or more players it also matches "Name of player 10" and fails in strict mode before the prize step is reached. The app labels each box "Name of player N" as the README asks. Could the helper use `{ exact: true }`? | |
| 2026-09-28 | `tests/browser/claims.spec.ts` "TAM-037, TAM-033, TAM-086, TAM-105: an accepted claim …" | `result.getByText(`${n} ✓`)` is a substring match, so when the five numbers include, say, 3 and 23, "3 ✓" matches both and the test fails at random (depends on the draw). The app shows each number as "23 ✓" in its own element as the README asks. Could it use `{ exact: true }`? | |
