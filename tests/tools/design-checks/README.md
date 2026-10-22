# Design rule checks (a tool, not a test)

`docs/proposals/design-before-code.md` row 5. Checks a game's screen map before any code exists. `npm test` never runs it.

```
node tests/tools/design-checks/run.ts docs/games/secret-words/screen-map.md \
     --scenarios docs/games/secret-words/scenarios.md --report reports/design-checks-secret-words.md
node tests/tools/design-checks/run.ts --self-test     # a fixture with one deliberate fault per rule
```

| File | Does |
|---|---|
| `model.ts` | the shape of a screen (buttons, where each leads, what it records, intentions, main button) |
| `read-map.ts` | reader for the map's markdown. Reads only; knows no rules. A live-screen reader for the prototype only has to produce the same `ScreenSet` |
| `rules.ts` | the seven rules over the model, and `SECRET_WORDS`, the per-game settings (banned words, between-rounds screens, accepted exceptions with their decision) |
| `run.ts` | command line and the markdown report |

Rules: R1 way out · R2 every button leads to a screen that exists · R3 stop and home visible (47a between rounds; 12a on game steps) ·
R4 one main button, never destructive (17a) · R5 banned words and bare Yes/No · R6 every rule hook has a scenario id that exists ·
R7 every secret behind a hold or a tap with auto-hide (45). Where the map does not say enough the result is "cannot check" with the
reason; nothing is guessed. For another game, add a settings object next to `SECRET_WORDS` and a scenario-id pattern.
