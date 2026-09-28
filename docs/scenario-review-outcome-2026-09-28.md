# Scenario review: product owner's outcome, 28 September 2026

Answers `docs/scenario-review-2026-09-28.md` (tester, commit cc447aa). Owner decisions from b98852b
(per ticket; report stub until public release; Jev approved) and from the owner today (below) are applied.

**Owner sign-off:** the owner approved the product owner's verdicts for **Phase 1a.1 and Phase 1b** on
28 September 2026, so the tester may mark them approved and write tests. Phase 2, Phase 7 and the extended
testing are reviewed below but wait for the owner's sign-off when those phases come up. Phase 6 is on hold.

## Answers to the questions
| # | Question | Answer | By |
|---|---|---|---|
| 1 | Unwon money: per ticket or per person? | **Per ticket.** | Owner (b98852b) |
| 2 | Does a ticket that is out after a bogey still get its share of unwon money back? | **Yes.** Its contribution stays in the pot, and the hand-back returns unused pot money per ticket paid for; the bogey already cost it the chance to win. | Product owner, by convention |
| 3 | Are the new words of TAM-033 and TAM-086 right? | **Yes, approve both as written.** | Product owner |
| 4 | Where does "Next number" sit? | **Full width at the very bottom, centred (TAM-100 stands).** "Record a win" sits in its own row just above it, not side by side, so a hurried thumb can't hit the wrong one. | Product owner (UX) |
| 5 | Approve the redesign drafts? | **Yes**, with the change to TAM-124 below. | Product owner, owner sign-off |
| 6 | Keep the "Check numbers" helper? | **Yes**, in the menu only; it records nothing (TAM-139). It's already built and settles disputes. | Product owner |
| 7 | Phone tickets offline: called numbers and last calls on the player's phone? | **Drop them from Phase 2.** Offline, a player's phone can't know the calls. TAM-050 is reworded (below); TAM-133 moves to Phase 6 (connected mode). Players who can't see the host screen rely on the anchor's voice, as with paper. | Product owner |
| 8 | An edited claim QR: refused, or also a bogey? | **Refused only, never a bogey** (it may just be damaged or from an old game). The host is offered "Check ticket 3 by number", which gives the true verdict from the host's own copy. | Product owner |
| 9 | Auto-call timer range and default? | **5 to 30 seconds, in 5-second steps, default 10 seconds**, as in common Tambola caller apps. | Product owner |
| 10 | Settle undo, and who pays whom? | **Settle can be undone for 5 seconds** ("Settled. Undo"). **Both:** the tally shows each person's net amount; an explicit **"Settle up"** action then lists who pays whom in the fewest hand-overs, and confirming it marks the games settled. | Owner (who pays whom), product owner (undo) |
| 11 | Where do reports go? | **A stub for now:** nothing leaves the phone. Must be replaced with a real free, no-account destination before any wider public release. | Owner (b98852b) |
| 12 | Weekly runs: hold the preview link? Mutation target? | **Report only**; the link keeps updating and the failure goes to the orchestrator. **At least 80%** of deliberate mistakes caught for rules and money code; below that, the uncaught ones are listed and fixed next. | Owner (report only), product owner (80%) |

## Verdicts

### Phase 1a.1 (owner signed off)
| ID | Verdict |
|---|---|
| TAM-088, TAM-144, TAM-089, TAM-091, PLT-017, TAM-037, TAM-039, TAM-038, TAM-034, TAM-035, TAM-036, TAM-082, TAM-138 | Already approved through the change request: no change |
| TAM-093 | **Change:** replace the last two lines ("Question for the owner… so this draft says yes.") with: "And a ticket that is out after a bogey (TAM-044) still gets its share, because its contribution stayed in the pot." Then approve. |
| TAM-033 | Approve |
| TAM-086 | Approve |
| TAM-139 | Approve |
| TAM-092 | Approve |
| TAM-123 | Approve |
| TAM-124 | **Change:** replace the second line with "And 'Record a win' (TAM-037) sits in its own row just above 'Next number', full width but not filled, so the two are never side by side"; add "And 'Next number' is full width at the very bottom, centred (TAM-100)". Then approve. |
| TAM-125 | Approve |
| TAM-126 | Approve |
| TAM-127 | Approve (the swipe is an extra; the menu tap is the way that always works, TAM-136) |
| TAM-128 | Approve |
| TAM-129 | Approve |
| TAM-181 | Approve |
| TAM-182 | Approve |
| TAM-183 | Approve |

### Phase 1b (owner signed off)
| ID | Verdict |
|---|---|
| PLT-025 | Approve |
| PLT-026 | Approve |
| PLT-027 | **Change:** replace the question line with: "And right after settling, 'Settled. Undo' shows for 5 seconds; undo puts the games back into the unsettled tally exactly as before." Then approve. |
| PLT-028 | **Change** to: "## PLT-028: Settle up: net amounts first, then who pays whom" / Given a session tally where Riya is +₹120, Asha −₹70 and Dad −₹50 / Then the tally shows each person's net amount / When the host taps 'Settle up' / Then it lists the fewest hand-overs that settle it: 'Asha pays Riya ₹70 · Dad pays Riya ₹50', adding up exactly to each net amount / And no payment is made or requested: text only (TAM-090) / When the host taps 'Mark as settled' and confirms (PLT-019) / Then the games are settled (PLT-019, PLT-027)". Then approve. |
| TAM-184 | Approve |
| TAM-185 | Approve |
| TAM-186 | **Change:** replace the question line with: "And the time between calls is 5 to 30 seconds, in 5-second steps, 10 seconds by default (TAM-120)." Then approve. |
| TAM-187 | Approve |
| TAM-188 | Approve |

### Phase 2 (product owner verdicts; owner sign-off when Phase 2 comes up)
| ID | Verdict |
|---|---|
| TAM-001 to TAM-008, TAM-032, TAM-051, TAM-053 to TAM-057, TAM-117, TAM-121, TAM-122, TAM-131, TAM-132, TAM-170, TAM-171 | Approve (unchanged drafts; they follow the Tambola conventions and the seed decision) |
| TAM-020 to TAM-029 (changed line), TAM-058 | Approve |
| TAM-178 | Approve |
| TAM-179 | **Change:** replace the question line with: "And when a claim QR doesn't match the host's copy, the host is offered 'Check ticket 3 by number', which gives the verdict from the host's own copy (TAM-174)." Then approve. |
| TAM-190 | Approve |
| TAM-050 | **Change:** "Then it contains ticket 3 and Riya's own marks / And it contains no other ticket's numbers and no called numbers (offline, the phone cannot know them; see TAM-133)"; remove the open question. Then approve. |
| TAM-133 | **Move to Phase 6** (connected mode). Remove it from Phase 2. |

### Phase 7 (product owner verdicts; owner sign-off when Phase 7 comes up)
| ID | Verdict |
|---|---|
| PLT-200 to PLT-207, PLT-209 | Approve |
| PLT-208 | **Change:** replace the question line with: "And until a real destination is chosen, sending goes to a stub: the report is kept on the phone and nothing leaves it; a real free, no-account destination is required before any wider public release (owner, 2026-09-28)." Then approve. |

### Phase 6 (on hold)
TAM-200 to TAM-210, and TAM-133 (moved here): **not reviewed for approval**; revisit only if play-tests show
people want connected mode.

### Extended testing (product owner verdicts; owner sign-off when that step comes up; Jev already approved)
| ID | Verdict |
|---|---|
| PLT-110 to PLT-117, PLT-120 to PLT-123 | Approve |
| PLT-118 | **Change:** replace the question line with: "And a failed weekly run never holds back the preview link; it is reported for the next round (owner, 2026-09-28)." Then approve. |
| PLT-119 | **Change:** replace the question line with: "And the target is at least 80% of deliberate mistakes caught in the rules and money code; below that, each uncaught mistake is listed for the next round." Then approve. |
