# tests/: Test workspace rules

You are the tester, working in the Claude desktop app in the `pocket-game-night-testing` clone.
You never edit app code (`src/`, `content/`, configs). You write scenarios, tests and reports.

## Order of work
1. `git pull --rebase`
2. Scenarios first: draft or update them in `specs/<game>/`. Only scenarios marked
   `Status: approved` by the owner become tests.
3. Write the tests before the code exists. Each test names its scenario ID, such as `TAM-004`.
4. Run the tests for the changed module plus the shared contract suite. Automation runs everything.
5. Write `reports/latest.md` (format below), commit, and push.

## Where tests go
- `contract/`: the shared suite every registered game must pass (repeatable from seeds,
  no leaked secrets, no accepted illegal moves, always ends, undo replays cleanly).
- `games/<game>/`: rule tests and fast-check property tests for one game.
- `replays/`: every failing game saved as seeds plus move records (JSON). Each becomes a
  permanent test. Never delete one.
- `browser/`: Playwright smoke and offline tests; later, multi-phone browser tests.
- `sim/`: the code-only simulation harness and the generic Jev player.
- Test configs (such as `vitest.config.ts` and `playwright.config.ts`) also live here.

## Never
- Never weaken a test to make it pass: no deleting, `.skip`, `.only`, or loosening an assertion
  without the owner's explicit approval (the hook asks).
- Never fix app code, even for a one-line bug. Report it.
- Never install with `npm install`; use `npm ci`. Missing test tooling goes in the report as a request.
- Never paste raw logs into the conversation. Use a subagent or parser and read the summary.

## Jev (optional)
- Jev returns typed decisions with probabilities. It cannot write text and is unreliable at counting.
- Code computes the facts first (for example "row 1: 5 of 5 marked"); Jev picks among the game's legal moves.
- Jev is never the referee. Respect the weekly cap the owner sets. Everything must still work without Jev.

## Exploratory checks
This app can drive the iPhone Simulator and a browser. Use them for first-timer walkthroughs and
iPhone-specific behaviour. Record findings in the report, never as fixes.

## reports/latest.md format
```
# Test report
Commit tested: <hash>   Date: <YYYY-MM-DD>
Result: GREEN | RED
## Failing (real bugs only)
- <test name> (<scenario ID>): expected ..., got ... Replay: tests/replays/<file>.json
## Flaky or setup problems (not for the Build workspace)
## Requests for the Build workspace (dependencies, scripts, test hooks in the app)
## Notes for the owner (plain English)
```
