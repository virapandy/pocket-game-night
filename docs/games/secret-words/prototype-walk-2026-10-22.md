# Secret Words: six persona walks of the prototype (product owner, 22 October 2026)

Stage 2 of `docs/proposals/design-before-code.md`, on the prototype's second pass (published by b82c5e4). Six player helpers,
one at a time, mid-size model, each from the screen only: grandparent (360 × 640), 10-year-old (812 × 375 and 320 × 568),
first-time host (390 × 844, setup from scratch), distracted host (360 × 640, one thumb), competitive uncle (390 × 844), guest on
the map phone (360 × 640). Jev's read of the prototype is pending (tester) and will be merged here.

Every finding is sorted into one of three kinds. **Only section 1 changes the design.**

## 1. Design changes (for scenarios version 3.7; owner's yes needed)
| # | Finding | Who hit it | Proposed change |
|---|---|---|---|
| P1 | **Game over hides "End for tonight" and "← Home" below "Play again"** until you scroll; nothing says to scroll. Our own guideline 47a says a between-games screen shows both "carry on" and "stop" | grandparent, 10-year-old, uncle | Game over's pinned bottom bar holds quiet "End for tonight" **beside** main "Play again" (40 / 60 split; stacked at 320 px); the rest scrolls above |
| P2 | **The menu's rows move between screens**, so a thumb aimed at Pause hit "New board" | distracted host, grandparent | "Pause" is always the first item; "New board" sits in its own group directly above the leave group, always last but two; the menu scrolls inside with "Done" pinned and a fade at the bottom edge when more is below |
| P3 | **The flip arrow "↻" has no label**; a delayed turn confused people and later taps hit the wrong word | grandparent, 10-year-old | Board button reads "↻ Flip" (as on the private map); the flip is instant and taps on the board are ignored for 300 ms after it |
| P4 | **"Blank word"** is not a term families know | uncle, grandparent | Result line "Nobody's word. Other team's turn next."; recap "Train was nobody's."; the kind is called "nobody's word" everywhere a person reads it |
| P5 | **"Coffee Commandos: guess how many Riya will say!"** reads like a separate bonus game | uncle | "While you wait, Coffee Commandos: guess how many words Riya's clue will be for." |
| P6 | **"Turn ends, they get a word"** doesn't say whose word | uncle | "Turn ends, and one of their words is turned over for them" |
| P7 | **Two clue givers from rival teams "sit side by side"** looks odd | first-time host | "Riya and Arjun give clues for different teams but share one map phone, as at a real table: sit side by side." |
| P8 | **The map screens have no key to the shapes**, and the Landmine is never named on the grid | guest | A one-line key under the grid on the private map and the map phone: circle "Chai Champions", diamond "Coffee Commandos", dash "nobody", landmine "Landmine: never guess" |
| P9 | **The map phone's list buttons don't show which view is on** | guest | The current view's button has the selected look (`aria-pressed`) |
| P10 | **Small grey lines are hard for older eyes** | grandparent | Small lines use `--text` (not the muted grey) at 15 px; "Larger text" is offered on the first Read-this-aloud card ("Small text? Larger text in Settings") |

## 2. Already in the spec, not in the prototype (the build must do these; tests exist or are listed)
The map hides when you leave the app or after 60 s with "Still looking?"; double-tap guards on "I'm Riya" and "Play again" (test
added to the build plan); the greyed "waiting" look; Undo toasts after removing a player and after ending a game; the visible
timer countdown; a wrong code shows "That code doesn't look right"; the map phone asks "I give clues for:" with three phones and
"Hide map" hides it; Back during a game does nothing; the landscape panel layout and Easy board at 320 px; the board check after
"Next map"; the where-line after resuming; "Clue rules" opening at the clue rules.

## 3. Prototype shortcuts (no action)
The example night's names, scores and counts don't add up ("6 players", "Nana", 2–1 one way and 1–2 the other); adding players,
picking clue givers and the number pick don't stick; the clue shown is always "Cricket · 2"; old wording ("Heads up", "Pass
the pick") in a few places; the History back loop; the guest's Home showing the host's game; a stale script on first load.

## 4. Kept as decided
**No undo of a reveal** (K35, confirmed 11 October): wanted by four of six personas. The pick-then-confirm step, the picker's name
on the main button and the 300 ms turn are the guards. Unchanged unless the owner says otherwise.
