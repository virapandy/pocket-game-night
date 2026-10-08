# Proposal: faster build-and-test cycles (orchestrator, 8 October 2026)

Status: **for the owner's approval. Do this first, before any Secret Words build work** (owner, 8 October: "add it as
a note to do first thing when we do Secret Words"). Nothing here is implemented yet.

Two passes went into it: the orchestrator's evaluation of the Impostor build (3–8 October) and an independent research
pass on best practices that was given the facts but not the orchestrator's conclusions (sources at the end). Where they
agree, the item is marked **both**.

## Why
A typical change took half a day to a day. Building took 10–15 minutes and review 3–5 minutes; the tester stage took
1–3 hours (once 20), and most changes needed 2–3 fix rounds. The measured causes:
1. **Coders work blind:** they can't run tests or see the screen, so layout bugs surfaced hours later ("Whole family"
   took 3 rounds, the practice chip 3, the clue order 2).
2. **Code merged before its test updates:** `main` was red for hours (2 h, once 20 h), which also froze the preview.
3. **Brittle tests:** exact wording and exact pixels broke dozens of tests at once on a wording change ("evening" →
   "game") or the 500 ms tap guard; Mac fonts passed where GitHub's Linux fonts failed.
4. **One long-running tester:** its context filled (4 stalls), it hit usage limits (3 times), it shared the Test clone
   with another session, and every change queued behind it.
5. **Scenario churn:** Impostor went v2.2 → v3.9 in four days; each version forced test rewrites.

## The plan, ranked by impact
| # | Change | Evidence | Expected effect | Needs |
|---|---|---|---|---|
| 1 | **Code and its tests land together, checked before merge**: one short branch per change carries the coder's commits and the tester's matching test commits; quick verify runs on the branch; merge only when green and up to date with `main` (both) | Fowler CI; DORA trunk-based; trunk-based short-lived branches | Ends "main red for hours"; removes a fix round | Owner OK (workflow rule); coder: CI on lane branches |
| 2 | **Tests check behaviour, not exact words or pixels**: one shared list of on-screen text used by app and tests; find elements by role and label; layout rules ("nothing overlaps, nothing cut off, no page scroll, tap targets ≥ 44 px") instead of exact sizes; screenshots for the look; keep a small set of exact-text checks for key strings (both) | SWE at Google ch. 12; Beck's Test Desiderata; Playwright best practices, ARIA snapshots | The largest single cut in tester hours | Tester round; product owner keeps the text list |
| 3 | **Same test environment everywhere**: ship the app's font with the app (both); run browser and screenshot tests in the official Playwright Docker image (research); control time with Playwright's clock and turn off animations in tests | Playwright visual comparisons, clock docs | Ends "passes on Mac, fails on GitHub" rounds | Coder (font), tester (Docker, clock) |
| 4 | **Coders may run the frozen tests and take screenshots, never edit tests**: a read-only command returns pass/fail and screenshots of the lane at the phone sizes; the role guard plus a CI check reject any coder commit touching test folders (both) | Claude Code best practices ("give Claude a way to verify its work"); Building Effective Agents; DORA test automation | Most failures caught in minutes inside the build step; fix rounds 2–3 → about 1 | **Owner OK** (changes the rule "Build never runs tests") |
| 5 | **Short-lived, focused testers**: a fresh tester per change (or per lane), reading `reports/latest.md` and a short tester-notes file; one tester per area at a time, not one for days (both) | Claude Code best practices (performance drops as context fills); Anthropic multi-agent research | Ends stalls; usage limits ease | **Owner OK** (relaxes "never two testers" to one per area/folder) |
| 6 | **Freeze scenarios per batch; numbers in a design-values file**: findings during a batch go to the next one; scenarios name design values ("spacing-large", "min-tap-target") with allowed ranges instead of raw pixels (both) | DORA small batches; W3C Design Tokens; SWE at Google | Fewer scenario versions and test rewrites | Product owner |
| 7 | **Tiered, fast CI**: game rules in fast rule and property tests; browser tests for key journeys; on branches only affected tests plus the smoke set, split across parallel jobs (target under 10 minutes); the full run on `main`, nightly and on release (both) | Fowler test pyramid; Testing Trophy; SWE at Google ch. 11; Playwright sharding, changed-files option; DORA (< 10 min) | Quick verify 6–25 → 5–10 minutes | Coder (workflow), tester (selection) |
| 8 | **Shared screen building blocks**, now that two games need them: a screen with a pinned bottom bar and its reserved space, one scroll area, dialogs and sheets, the tap guard, text sizes (orchestrator) | Principle "generalise when two real games need it" (CLAUDE.md) | Most Impostor layout bugs were the same problem solved per screen; Secret Words gets them working from day one | Coder lane before Secret Words screens |
| 9 | **Mutation off the critical path**: Stryker's incremental mode on changed code only, nightly and before release, never per change (research; mutation already moved to parallel CI jobs on 7 October) | Stryker incremental docs (check Vitest support) | Up to an hour saved where it was per change | Tester / coder (workflow) |
| 10 | **Small changes, WIP limits, review by risk**: no more lanes than the tester stage can absorb; reviewer for C2/C3, light or batched review for C0/C1 (both) | DORA WIP limits, streamlining change approval | Less waiting, fewer merge collisions | Owner OK (review rule) |
| 11 | **Guard against weakened tests**: the reviewer flags any deleted, skipped or loosened check; mutation score at release as a backstop; player runs as held-out checks coders never see; flaky tests quarantined with a named owner, never silently re-run (research) | Claude 3.7 system card notes; EvilGenie benchmark; Google testing blog on flaky tests | Keeps quality while items 2 and 4 loosen things | Reviewer brief; tester |
| 12 | **Player helper installed in this workspace** with a browser, so the orchestrator runs player checks itself (orchestrator) | `docs/proposals/player-agent.md` | No relay through the owner | Owner OK (project rules) |

**One correction from the research:** the orchestrator had suggested a hidden test-only switch that turns off the 500 ms
tap guard. Better: let Playwright's clock control the guard's time, so tests run the real app, not a test mode.

## Expected result
Items 1–5 target the measured causes directly. Together they plausibly take a typical change from half a day–a day
to **about 1–2 hours, with mostly one fix round**, and keep `main` green. This is an estimate, not a measurement;
measure lead time per change before and after.

## Order of work (first thing for Secret Words)
1. **Owner approves** items 1, 4, 5, 10 and 12 (they change project rules: root `CLAUDE.md`, `.claude/workspace/`,
   the role guard). The orchestrator proposes the exact rule edits first.
2. **Coder:** CI on lane branches (1), shipped font (3), coder-runs-tests command with screenshots and the CI check that
   rejects test edits (4), shared screen building blocks (8).
3. **Tester (short-lived, in parallel):** shared text list and behaviour-based checks (2), Playwright Docker and clock
   (3), affected-test selection and sharding (7), incremental mutation (9), quarantine (11).
4. **Product owner:** freeze rule and design-values file (6).
5. Then start Secret Words on the new setup.

## Sources (opened by the research pass)
DORA: small batches, test automation, trunk-based development, WIP limits, streamlining change approval (dora.dev) ·
Fowler, Continuous Integration; Fowler/Vocke, Practical Test Pyramid · Kent C. Dodds, Testing Trophy · Software
Engineering at Google, ch. 11 and 12 · Google Testing Blog, flaky tests (2016) · Kent Beck, Test Desiderata · Playwright
docs: best practices, visual comparisons, clock, sharding, CLI, ARIA snapshots · Stryker incremental mode · GitHub merge
queue (likely organisation repos only; required checks with "up to date" are the free fallback) · trunkbaseddevelopment.com
short-lived branches · W3C Design Tokens Community Group · Claude Code best practices · Anthropic, Building Effective
Agents; multi-agent research system · EvilGenie reward-hacking benchmark (arXiv 2511.21654). The Claude 3.7 system card
point came from search summaries, not the card itself.
