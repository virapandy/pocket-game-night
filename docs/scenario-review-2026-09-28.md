# Scenario review, 28 September 2026

One pass over the remaining roadmap (`docs/roadmap.md`), so the product owner and the owner can review
everything at once. Written by the Test role. Sources: the roadmap, the change request
(`docs/games/tambola/changes-2026-09-28.md`) and the calling screen review (`docs/games/tambola/ux-calling-screen.md`).

**Marks used**
- **new, approved (change request)**: written word for word from the change request, which the owner approved.
- **changed, approved (change request)**: an approved scenario changed exactly as the change request says.
- **aligned, approved (change request)**: the change request asked us to check these still read correctly;
  the wording was adjusted to match the new rule and nothing else.
- **new draft**: added by the tester; needs the owner's approval before it is tested.
- **reworded, back to draft**: was approved, but had to be reworded to fit the change request; needs approval again.
- **changed draft**: a draft whose wording was changed; still a draft.
- **unchanged draft**: read and left as it was; still a draft.
- **already approved**: approved or decided before; read and left as it was.

No tests were written or changed in this pass. The automatic checks for the old wording of the changed
scenarios are updated in the next step, once this review is agreed.

---

## 1. Step 1a.1: feedback fixes (Phase 1a)

### Money of prizes nobody won
| ID | Summary | Mark |
|---|---|---|
| TAM-088 | Money of prizes nobody won goes back to the players, equally per ticket; winners get exactly their tier; summary shows paid, won, handed back, net | new, approved (change request); replaces "spread across the won tiers". "Equal per ticket" still to confirm |
| TAM-144 | Nobody won anything: the special case of TAM-088, so all the money goes back | changed, approved (change request) |
| TAM-089 | The payout summary lists "not won" tiers and money handed back, and balances to the rupee | aligned, approved (change request) |
| TAM-091 | Over thousands of random games, prizes plus money handed back always equal the pot | aligned, approved (change request) |
| PLT-017 | The session tally shows, per person, paid, got back (prizes plus money handed back) and net | aligned, decided (change request) |
| TAM-066 | Ending early pays the winners so far; unclaimed tiers follow TAM-088 | already approved; checked, reads correctly |
| TAM-140 | End game pays winners (unclaimed tiers follow TAM-088); Discard hands every contribution back | already approved; checked, reads correctly |
| TAM-093 | Money handed back is split to the rupee (₹17, ₹17, ₹16), extra rupees in player order; late joiners count; "No money" hands nothing back | new draft |

PLT-021 (each game records what each person paid and won, for the tally) was also checked: it reads
correctly if "won" includes money handed back, which is how the new PLT-017 reads it. Unchanged.

### Paper tickets: trust the anchor
| ID | Summary | Mark |
|---|---|---|
| TAM-037 | Paper tickets: the anchor checks the ticket; the host taps "Record a win", picks prize and player, no numbers typed; can record "Bogey: Riya" | new, approved (change request); replaces "the host types the numbers read out" |
| TAM-039 | Paper tickets: the host picks the player (several for a tie) as part of "Record a win" | changed, approved (change request) |
| TAM-038 | A late claim shows which number completed the pattern: phone tickets only; with paper the anchor judges | changed, approved (change request); now Phase 2 |
| TAM-034 | The app's claim check is right for every ticket and call history: phone tickets only (and the helper) | changed, approved (change request); now Phase 2 |
| TAM-035 | A number the player forgot to mark still counts: phone tickets only | changed, approved (change request); now Phase 2 |
| TAM-036 | A claim is judged on the numbers called when it is made: phone tickets only | changed, approved (change request); now Phase 2 |
| TAM-033 | The result is shown large to the room; the ticket is shown with called numbers only for phone tickets or the helper | reworded, back to draft |
| TAM-086 | A win shows the prize: "Top Line: ✓ Riya, ₹60" (paper) or "Top Line: ✓ Accepted, ₹60 to Riya" (phone) | reworded, back to draft |
| TAM-139 | "Check numbers": the old typed-number check stays as an optional helper in the menu for disputes; it records nothing by itself | new draft |

The Tambola scenarios list now also explains "checking a claim" for paper and phone tickets, so scenarios such
as TAM-030 (a prize already won), TAM-031, TAM-070 (undo a wrong win) and TAM-145 (closing a tier) read
correctly without changes.

### Equal prizes
| ID | Summary | Mark |
|---|---|---|
| TAM-082 | Tiers with the same share always get the same amount; rounding differences go to Full House first; example: three Lines never ₹50, ₹40, ₹40 | changed, approved (change request) |
| TAM-092 | Equal-share tiers stay equal after the anchor edits or removes other tiers; tiny pots: Full House takes the difference | new draft |

### Calling screen and setup redesign
| ID | Summary | Mark |
|---|---|---|
| TAM-138 | The calling screen needs no scrolling on a 390 × 844 screen; the number stays visible after calls, claims, undo and closing a tier | new, approved (change request) |
| TAM-123 | Nothing above the number but the top bar; number at least 160 px, about 40% of the screen; still all visible after 90 calls | new draft |
| TAM-124 | "Next number" is the only filled main button; "Record a win" beside it; End game and Discard only in the menu | new draft |
| TAM-125 | The undo toast "Called 21 · Undo (5s)" floats and never moves anything else | new draft |
| TAM-126 | Prize chips show open, won (with name) and closed; after a win the chip offers "Close", and Next number says "Close Top Line first" | new draft |
| TAM-127 | The board opens as a sheet over the calling screen and never pushes the number away | new draft |
| TAM-128 | The screen-sleep hint is a one-time tip, then a small icon; no permanent line | new draft |
| TAM-129 | Landscape on a stand: number on the left, rhyme and last calls on the right, buttons along the bottom | new draft |
| TAM-181 | Every setup step keeps its main button fixed at the bottom, whatever the number of players | new draft |
| TAM-182 | The contribution field has a real default value (₹50), not a grey hint; wrong input is refused | new draft |
| TAM-183 | The prizes step fits five tiers, the pot and "Confirm prizes" on one screen | new draft |

**Count for 1a.1:** 30 scenarios. 1 new approved (TAM-138) and 2 replaced approved (TAM-088, TAM-037);
7 changed approved; 3 aligned approved; 2 checked and unchanged; 2 reworded back to draft; 13 new drafts.
TAM-174 and TAM-177 from the change request are in section 4.

---

## 2. Step 1.5: family play-test

Not something the app's automatic checks can do. A hand-check checklist is in `docs/playtest-checklist.md`:
what to set up, 15 things to watch during each game (each tied to its scenario), what to check at the end
(including whether people expected unwon money back per ticket or per person), and how to report findings
to the product owner. No scenarios added or changed.

---

## 3. Step 3: 1b, the evening

Checked against the roadmap line "sessions, tally and settle, late joiners, optional phone voice and
auto-call, dark mode, history tools".

| Area | ID | Summary | Mark |
|---|---|---|---|
| Sessions | PLT-016 | Every game belongs to a named session; asks after 3 hours | already approved |
| Sessions | PLT-022 | Sessions are listed and can be renamed | already approved |
| Sessions | PLT-026 | A game paused overnight stays in the session it started in | new draft |
| Tally | PLT-017 | The tally covers ended, unsettled games in one session (see section 1) | aligned, decided |
| Tally | PLT-018 | Games in different sessions are never tallied together | already approved |
| Tally | PLT-019 | "Settle" marks the games done and empties the tally | already approved |
| Tally | PLT-020 | The same person is matched across games by name | already approved |
| Tally | PLT-021 | Any game with money feeds the tally the same way | already approved |
| Tally | PLT-023 | Games with "No money" stay out of the tally | already approved |
| Tally | PLT-027 | A settled tally can be looked at later, read-only | new draft |
| Tally | PLT-028 | The tally suggests who pays whom, in the fewest hand-overs (text only) | new draft, proposal |
| Late joiners | TAM-067 | A late joiner gets a ticket until 10 numbers; called numbers count; contribution spread over open tiers | already approved |
| Late joiners | TAM-184 | A late joiner added by mistake can be taken out before the next number | new draft |
| Voice and auto-call | TAM-061 | Turning on a shortcut shows a friendly warning, once | already approved |
| Voice and auto-call | TAM-062 | Each shortcut has its own warning | already approved |
| Voice and auto-call | TAM-120 | Auto-call: off by default, host sets the timer, one-tap pause | already approved |
| Voice and auto-call | TAM-180 | The phone speaks the number and rhyme only if the host turns it on | already approved |
| Voice and auto-call | TAM-185 | The voice repeats on "Repeat" and "Another rhyme", and can be muted with one tap | new draft |
| Voice and auto-call | TAM-186 | Auto-call pauses while a win is recorded or a tier waits to be closed | new draft |
| Voice and auto-call | TAM-187 | If the phone's voice fails, the game carries on; one short note to the host | new draft |
| Dark mode | TAM-134 | Dark mode is an option, not the default | already approved |
| Dark mode | TAM-188 | Dark mode keeps every contrast and size rule, and is remembered on the phone | new draft |
| History tools | PLT-006 | An unfinished setup is remembered | already approved |
| History tools | PLT-009 | "Use this setup" from a past game | already approved |
| History tools | PLT-010 | Deleting a past game, with 5 seconds to undo | already approved |
| History tools | PLT-011 | Clearing all history, with a clear confirmation | already approved |
| History tools | PLT-025 | Deleting a game that is in an unsettled tally warns first and keeps the tally balanced | new draft |

**Count for 1b:** 27 scenarios. 17 already approved (plus PLT-017, counted in section 1); 9 new drafts
(TAM-184 to TAM-188, PLT-025 to PLT-028). No gap found in "reusing a setup".

---

## 4. Step 4: Phase 2, phone tickets

Checked against the change request: the claim QR (TAM-177), typing the ticket number as the fallback
(TAM-174), and paper tickets judged by the anchor while phone tickets are judged by the app.

### Claims on phone tickets
| ID | Summary | Mark |
|---|---|---|
| TAM-177 | The player taps "Show claim"; the host scans the claim QR; verdict in 2 seconds, offline; an edited QR is refused | new, approved (change request) |
| TAM-174 | The verdict credits the ticket's owner; typing the ticket number is the fallback when scanning fails | changed, approved (change request) |
| TAM-178 | No camera, permission refused, or no QR read in 10 seconds: "Enter the ticket number instead", same verdict | new draft |
| TAM-179 | A claim QR from another game, for a ticket not handed out or out after a bogey, for a closed prize, or edited, is refused calmly and is not a bogey | new draft |
| TAM-190 | A player with two tickets picks which ticket the claim QR is for | new draft |
| TAM-058 | Paper and phone tickets mixed: phone claims by claim QR or ticket number, paper wins on the anchor's word | changed draft |
| TAM-020 to TAM-029 | The pattern rules (Early Five, the three Lines, Four Corners, Full House, and their bogeys): now say paper tickets are judged by the anchor and the helper uses the same rules | changed draft (10 scenarios, one line each) |
| TAM-032 | A claim for a ticket not in the game is refused | unchanged draft |
| TAM-060 | Room defaults: players shout; no Claim button. Still holds: "Show claim" only replaces typing, not the shout | already approved; checked (Phase 1a) |
| TAM-034, TAM-035, TAM-036, TAM-038 | Now phone tickets only (see section 1) | changed, approved (change request) |

### Tickets, secrets and handing out
| ID | Summary | Mark |
|---|---|---|
| TAM-001 to TAM-008 | A valid ticket (15 numbers, 5 a row, columns in range and order, no repeats); a sheet of 6 uses 1 to 90 once; the same sheet seed gives the same tickets | unchanged draft (8) |
| TAM-048 | Phone tickets are handed out from sheets of 6 | already decided |
| TAM-050 | A player sees only their own ticket | changed draft: open question added (see questions) |
| TAM-051 | A player never sees upcoming numbers | unchanged draft |
| TAM-053 | A player's ticket QR carries only their own ticket, no seed | unchanged draft |
| TAM-054 | One ticket reveals nothing about other tickets or the draw | unchanged draft |
| TAM-055 | A phone ticket matches the host's copy | unchanged draft |
| TAM-056 | The host can see all tickets | unchanged draft |
| TAM-057 | A phone ticket works with no internet; everything is in the QR link | unchanged draft |
| TAM-117 | Joining with the phone's own camera, or a typed code of at most 12 characters | unchanged draft |
| TAM-121 | Players can make text larger | unchanged draft |
| TAM-122 | Phone tickets default to landscape | unchanged draft |
| TAM-131 | Players mark and unmark their own ticket; marks never affect claims | unchanged draft |
| TAM-132 | The host sees "7 of 10 handed out" | unchanged draft |
| TAM-133 | A player's phone can show the last 3 calls | changed draft: open question added (see questions) |
| TAM-170 | A phone ticket shows its game code, start time and prizes | unchanged draft |
| TAM-171 | A phone ticket survives locks and reloads | unchanged draft |
| TAM-172 | Each phone ticket is handed to a named player | already approved |
| TAM-173 | A player with several tickets keeps them on one phone | already approved |
| TAM-175 | The host can correct who holds a ticket | already approved |
| TAM-176 | Tickets never handed out are not in the game | already approved |

**Count for Phase 2:** 49 scenarios with a Phase 2 line (45 listed here plus the four from section 1).
1 new approved, 1 changed approved, 3 new drafts, 13 changed drafts (TAM-058, TAM-020 to TAM-029, and
questions added to TAM-050 and TAM-133), 22 unchanged drafts, 5 already approved or decided.

---

## 5. Step 5: Phase 7, "Report a problem"

| ID | Summary | Mark |
|---|---|---|
| PLT-200 | "Report a problem" from the menu: one optional sentence, plus app version, phone type, seeds and moves | changed draft (points to PLT-206 for games still in progress) |
| PLT-201 | Reports never include names, session names or money; the host sees exactly what is sent | unchanged draft |
| PLT-202 | With no internet, a report waits on the phone and is sent later, never interrupting a game | unchanged draft |
| PLT-203 | A crash saves the game, shows a calm message, and offers a report (never sent without asking) | unchanged draft |
| PLT-204 | Every report can be replayed; a confirmed bug becomes a permanent test | unchanged draft |
| PLT-205 | Reports are sorted into bug, confusion, idea or noise, and ranked weekly | unchanged draft |
| PLT-206 | A report about a game still being played waits for its seeds until the game ends, so no one can learn the coming numbers | new draft |
| PLT-207 | A player can report from their phone ticket, sending only their own ticket and marks | new draft |
| PLT-208 | Nothing leaves the phone unless the host sends it: no tracking; no account; free | new draft |
| PLT-209 | Reports waiting to send can be seen and deleted; each is sent only once | new draft |

**Count for Phase 7:** 10 scenarios. 1 changed draft, 5 unchanged drafts, 4 new drafts.

---

## 6. Step 6: Phase 6, connected mode

Not changed, as asked: it waits for play-test evidence.
TAM-200 to TAM-210 (11 scenarios): unchanged drafts. They cover: connected mode is optional; calls on every
phone; auto-mark as a separate choice; a Claim button; ties and delays over the network; verdicts on every
phone; dropped messages; ten phones agreeing; falling back when the connection drops; a relay that costs and
keeps nothing.

---

## 7. Step 7: simulations and extended testing (Jev)

| ID | Summary | Mark |
|---|---|---|
| PLT-110 | The simulated player (Jev) always picks one of the legal moves; code states the facts first | unchanged draft |
| PLT-111 | Without Jev, random and scripted players take over; same summary | unchanged draft |
| PLT-112 | Jev is never the referee; disagreements are recorded, not applied | unchanged draft |
| PLT-113 | Jev calls stop at the owner's weekly cap | unchanged draft |
| PLT-114 | Every ordinary test passes without a Jev key; Jev runs are a separate, optional step | new draft |
| PLT-115 | The Jev key never ends up in the public repo, reports, replays or logs | new draft |
| PLT-116 | Mass simulations (for example 100,000 games) mix every setting and check the rules and money after every move; failures become permanent tests | new draft |
| PLT-117 | Each simulation run ends with a plain summary | new draft |
| PLT-118 | Long runs happen weekly and on request, on free machines, without slowing the everyday checks | new draft |
| PLT-119 | Mutation testing: deliberate small mistakes in a copy of the rules and money code show whether the tests would catch them | new draft |
| PLT-120 | A full paper game on an Android phone emulator, offline, at two phone sizes | new draft |
| PLT-121 | Android-only behaviour on the emulator: back gesture, app closed in the background, home-screen install, screen awake, budget-phone speed | new draft |
| PLT-122 | Tool problems (emulator not starting, Jev unavailable) are kept apart from real bugs | new draft |
| PLT-123 | Jev personas (slow grandparent, eager child) play like real guests but never decide | new draft |

These are in `specs/platform/04-extended-testing.md`, except PLT-110 to PLT-113 (unchanged, in
`02-contract-and-new-games.md`). Jev stays optional: PLT-111, PLT-113 and PLT-114 together mean nothing
fails for lack of a key.

**Count for step 7:** 14 scenarios. 4 unchanged drafts, 10 new drafts.

---

## Questions for the owner
1. **Unwon prize money: equal per ticket, or equal per person?** (TAM-088, TAM-093) We read "equally" as per
   ticket: a player with 2 tickets gets twice as much back. If you meant per person, only that line changes.
2. **A ticket that is out after a bogey:** does it still get its share of unwon money back? Its contribution
   stays in the pot, so the draft says yes. (TAM-093)
3. **Two approved scenarios had to be reworded** to fit "trust the anchor": TAM-033 (the app no longer has a
   paper ticket to show) and TAM-086 (the win message now reads "Top Line: ✓ Riya, ₹60"). Are the new words right?
4. **Where does "Next number" sit?** TAM-100 says bottom centre; the redesign sketch puts "Record a win" on the
   left and "Next number" on the right. Keep it centred, or follow the sketch?
5. **The redesign drafts** (TAM-123 to TAM-129, TAM-181 to TAM-183) come straight from the product owner's
   redesign. Approve as written?
6. **The "Check numbers" helper** (TAM-139): keep it in the menu for disputes, recording nothing by itself?
7. **Phone tickets with no internet:** a player's phone cannot know which numbers were called. Should
   "the numbers called so far" (TAM-050) and "last calls on the player's phone" (TAM-133) be dropped from
   Phase 2, or wait for connected mode?
8. **An edited claim QR** that doesn't match the host's copy: refused only, or also a bogey? (TAM-179)
9. **Auto-call timer:** what range and default? For example 5 to 30 seconds, default 10. (TAM-186)
10. **The tally:** should "Settle" be undoable for a few seconds (PLT-027), and do you want "who pays whom"
    suggestions (PLT-028), or is one net amount per person enough?
11. **Problem reports:** where should they go? It must be free and need no account from families. (PLT-208)
12. **Weekly extended runs:** should a failure hold back the next preview link, or only be reported (PLT-118)?
    And what share of deliberate mistakes should the tests catch, for example 80% (PLT-119)?
