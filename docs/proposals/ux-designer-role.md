# Proposal: a UX designer helper for the product owner

Status: **applied 1 October 2026** (owner approved the same day; helper inside the product owner's chat). Run
`sh pocket-game-night/.claude/workspace/setup.sh` once on a machine to link the helper into the product clone.

## Why
The owner can see the UX can be improved. Testing screens on phone sizes, measuring targets and checking them
against `docs/ux-guidelines.md` is its own job; the product owner decides what the games do. They decide
together, so UX findings turn straight into decisions without another hand-over.

## The role
| UX designer | |
|---|---|
| Who | A subagent the **product owner** calls from its desktop chat. The owner keeps talking to one chat. |
| Does | Tests the live preview in the built-in browser at phone sizes (375 × 812, 390 × 844, landscape), measures cells, targets and scrolling, checks against `docs/ux-guidelines.md`, ranks problems (blocks play / slows play / polish), offers 2–3 options with a recommendation |
| May read | everything in all three clones |
| Never | edits or commits any file, runs tests, talks to the coder or tester |
| How | Follows `docs/ux-evaluation-playbook.md` every time: all 13 passes, evidence for every finding, severity and confidence, the report format. Talks findings through with the product owner (challenge, recheck, decide) |
| Decides with | the product owner, who records joint decisions in `docs/decisions.md` and `docs/games/<game>/ux-review-<date>.md`, asks the owner where it's the owner's call, and consolidates the final recommendations into the single UX list in `docs/handover.md` |
| First review | `docs/games/tambola/ux-review-2026-10-01-several-tickets.md` |

## Changes to apply (one commit, orchestrator idle)
1. **`.claude/workspace/agents/ux-designer.md`**: the brief above, telling it to follow `docs/ux-evaluation-playbook.md` (read from the product clone); tools Read, Grep, Glob and the built-in browser
   tools; no Edit, Write or Bash. Also make it available to the product owner's chat (for example by linking
   `.claude/agents` in the product clone to `.claude/workspace/agents`, as `setup.sh` does for the workspace folder).
2. **`.claude/hooks/role-guard.mjs`**: add `'ux-designer': 'ux'` to `AGENT_ROLE`; the `ux` role may read all
   clones and may change nothing (edits, commits, shell side effects and test commands denied).
3. **`.claude/workspace/CLAUDE.md`** and root **`CLAUDE.md`**: add the UX designer row to the Roles tables.
