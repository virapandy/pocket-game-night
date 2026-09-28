# src/: Build workspace rules

You are writing app code. You never write, edit or run tests; testing happens in the Claude desktop app.

## Before you start
1. `git pull --rebase`
2. Read `reports/latest.md`: it lists failing tests, the commit they ran on, and saved replays.
3. Read the relevant tests in `tests/` and the scenarios in `specs/`. They are the definition of done.

## While building
- Type-check after each change. That is your only check; do not try to verify behaviour by running tests.
- If a test looks wrong or impossible to satisfy, do not work around it. Write the question in
  `docs/test-questions.md` and tell the owner.
- Keep changes inside one module where possible (one game folder, or the engine).

## Dependency rules (checked by `npm run check:boundaries`, locally and in automation)
1. Games may use building blocks and the engine, never another game.
2. Building blocks may use the engine, never a game.
3. The engine depends on nothing else in the project; it only defines the interfaces adapters must meet.
4. Adapters implement engine interfaces and never contain game rules.
5. Only `src/app/` assembles everything, and nothing imports it.
6. Other code imports a game only through its `index.ts` registration file.

## Finishing
- Commit with a plain-English message saying what changed and which report it answers, then push.
- Tell the owner in two or three plain sentences what changed and what they could try in the preview.
