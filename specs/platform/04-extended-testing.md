# Simulations and extended testing (roadmap step 7)

Nothing here is visible to families. These scenarios describe the extra checks that run after Tambola is
complete, so bugs are caught before families see them: mass simulations, mutation testing (checking that
the tests themselves would notice a broken rule) and runs on an Android phone emulator.

The simulated player itself is PLT-110 to PLT-113 in `02-contract-and-new-games.md`. Everything here must
work, and every ordinary test must pass, **without a Jev key** (Jev is optional everywhere).
All drafts, written by the tester on 2026-09-28.

## PLT-114: Every ordinary test passes without a Jev key
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Given a computer or automation run with no Jev key
When every ordinary test layer runs (rules, contract, property, simulation, replays, browser)
Then all of them run in full and can pass; none of them needs Jev or the internet
And runs that use Jev are a separate, optional step
When that optional step runs without a key
Then it says "No Jev key: ran with random and scripted players" and completes as PLT-111 describes

## PLT-115: The Jev key never ends up in the public repo
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Then the Jev key is never in the repo, a test report, a saved replay, a simulation summary or an automation log
And a check fails the run if anything that looks like the key appears in those places

## PLT-116: Mass simulations of Tambola find rule and money bugs
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
When a mass simulation runs (for example 100,000 Tambola games, from different seeds)
Then it mixes paper and phone tickets, 2 to 60 tickets, every tier set, ties, late joiners, bogeys,
late claims, undo of claims and of the last call, closing tiers, ending early and discarding
And it uses scripted players who claim early, late, falsely or never (no Jev needed)
And after every move it checks: no number called twice, every game ends (TAM-077), prizes and money handed
back add up to the pot exactly (TAM-091), no view shows a secret (PLT-101), and the replay matches (TAM-073)
And every game that breaks a check is saved as a permanent replay test (TAM-074)

## PLT-117: A simulation run ends with a plain summary
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
When a simulation run finishes
Then it writes a short summary: games played, how they ended, claims and bogeys, ties, how many numbers
were called before the first Full House (lowest, typical, highest), and any failures with their replay files
And the same summary format is used with and without Jev (PLT-111)

## PLT-118: Long runs happen on a schedule, not on every push
Status: draft (product owner verdict 2026-09-28: approve with the change applied; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Then mass simulations, mutation testing and Android emulator runs happen once a week and on request,
on the free standard automation machines (no paid service)
And they never slow down the ordinary checks that run on every push and publish the preview link
And when a scheduled run finds a problem, it is written into `reports/` with the scenario IDs, for the
orchestrator to hand to the coder
And a failed weekly run never holds back the preview link; it is reported for the next round (owner, 2026-09-28).

## PLT-119: Mutation testing shows whether the tests would catch a broken rule
Status: draft (product owner verdict 2026-09-28: approve with the change applied; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
When mutation testing runs on Tambola's rules and prize maths
Then it makes many small deliberate mistakes in a copy of that code (for example "5 of 5" becomes "4 of 5",
or a rupee goes missing in a split) and runs the tests against each one
And it reports the share of mistakes the tests caught, and lists each mistake no test caught
And it never changes the real app code
And each uncaught mistake becomes either a new test from an approved scenario, or a note that it cannot change behaviour
And the target is at least 80% of deliberate mistakes caught in the rules and money code; below that, each uncaught mistake is listed for the next round.

## PLT-120: A full paper game on an Android phone emulator
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Given an Android phone emulator running Chrome for Android at 390 × 844 and at a small phone size (360 × 800)
When a full paper-ticket game is set up and played to the end, offline after the first visit
Then every step works as on the preview link: setup, calling, recording wins, closing tiers, undo, ending
and the payout summary
And the calling screen needs no scrolling (TAM-138)

## PLT-121: Android-only behaviour is checked on the emulator
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Given the Android phone emulator
Then the back gesture and pull-down during a game do not lose it (TAM-111)
And a game survives Android closing the app in the background (TAM-112)
And the app can be added to the home screen and opens offline from there (TAM-064)
And the screen is kept awake during a game, or the hint appears (TAM-110, TAM-128)
And, with the processor slowed to a budget phone, taps respond within 100 ms (TAM-116)

## PLT-122: Emulator and simulation problems are kept apart from real bugs
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
When an emulator run or a simulation fails because of the tool itself (the emulator did not start, a
time-out, Jev unavailable)
Then the report lists it under "Flaky or setup problems", not as a bug in the app
And the run is retried once; a failure that repeats with the same seeds is treated as a real bug

## PLT-123: Jev personas play like real guests, but never decide
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when extended testing comes up)
Phase: Extended testing (roadmap step 7)
Given Jev is available and the weekly cap (PLT-113) is not reached
When a simulation uses Jev personas (a slow grandparent, an over-eager child, a distracted host)
Then each persona only chooses among the legal moves the rules offer (PLT-110)
And the rules engine decides every verdict (PLT-112)
And the summary reports what the personas did (for example "claims made late: 14") alongside the scripted runs
