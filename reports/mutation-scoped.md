# Scoped mutation (docs/change-sop.md)

Range: `ae4b7f1~1..ae4b7f1` (lines touched) · 410 s · concurrency 2 · target 80% (report-only)

Caught 5 of 9 deliberate mistakes: **56%**.

| File | Caught | Missed | Score |
|---|---|---|---|
| `src/games/tambola/rules/rules.ts` | 5 | 4 | 56% |

## Mistakes no test caught
- `src/games/tambola/rules/rules.ts:766` ConditionalExpression (no test noticed): `patternCue: state.config.settings.patternCue === true,`
- `src/games/tambola/rules/rules.ts:766` ConditionalExpression (no test noticed): `patternCue: state.config.settings.patternCue === true,`
- `src/games/tambola/rules/rules.ts:766` EqualityOperator (no test noticed): `patternCue: state.config.settings.patternCue === true,`
- `src/games/tambola/rules/rules.ts:766` BooleanLiteral (no test noticed): `patternCue: state.config.settings.patternCue === true,`
