# 01-setup.md: getting to the first deal

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.9, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-001: "Host a game" offers Tambola and Impostor
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Given Home (PLT-300: still "Host a game" and "Join with my ticket")
Then the "Host a game" button's second line reads exactly "Tambola or Impostor on this phone"
When the host taps "Host a game"
Then "What shall we play?" shows two cards of equal size and look (neither has the main look):
"Tambola" with "Housie on paper or phones · 2 hrs", and "Impostor" with
"Find who doesn't know the word · 3–20 players · about 4 min a round"
And there is no main button on this screen; tapping a card opens that game's setup at once
And "3–20 players" is never split across two lines (it sits in a `white-space: nowrap` span) at every size
Given an Impostor evening is unfinished (not ended, not discarded, not auto-ended by IMP-104)
Then "What shall we play?" shows, above the two cards, the button `resume-card` reading "Impostor · Riya, Arjun and 2
more · round 4" and "Tap to resume", and Home's `unfinished-games` shows a row with the same two texts
And the label names the first two players in the game's current seat order, then "and N more" for the others (3
players: "Riya, Arjun and 1 more"); names as typed
And "round N" is: during a round (deal to reveal), that round's number (the practice round: "round 1"). Between rounds
it is the number the next deal will carry: after a completed round, that round + 1; on the "left halfway" and
no-words screens, the round waiting to be dealt. While the summary shows, it is the number for the screen "Oops, keep
playing" returns to (End now in round 4: "round 4"; End game after round 4: "round 5")
And an evening whose summary was showing and not yet left is unfinished too
When either is tapped
Then the evening reopens at its saved step (IMP-090, IMP-091), or, for such an evening, at the summary (IMP-101)
When instead the host taps the "Impostor" card while that evening is unfinished
Then a dialog asks exactly "Start a new game? The game from 8:40 pm will be ended." (8:40 pm = the unfinished game's
start time) with two equal outlined buttons side by side, "Carry on that game" and "Start new"; neither has the main
look
And the dialog shows once per tap of the Impostor card, or of History's "Play again" (IMP-103) while a game is
unfinished (the summary's "Play again" ends its game first, so it never shows this dialog); "Start new" goes straight
on with no second question: to an empty or tonight-filled "Who's playing?" (IMP-004) after the card, or to "Who's
playing?" filled by IMP-103 after "Play again"
And "Carry on that game" reopens it at its saved step
And "Start new" records `endEvening` at once, with no summary (a half-played round is dropped; IMP-097 applies:
with no counted round it is deleted rather than kept), then opens "Who's playing?" for the new evening
And only one Impostor evening is ever unfinished at a time

## IMP-002: A guest is told there's nothing to join
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When a guest opens "Join with my ticket"
Then the last paragraph of that screen reads exactly
"Playing Impostor? It's all on the host's phone. Nothing to join, just play along!"
And nothing else on that screen changes

## IMP-003: Players are added in seat order, without dragging
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Given "Who's playing?" with an empty list
When the host types "Riya" in "Player name" and taps "Add" (or presses Enter), then Arjun, Meena and Kabir the same way
Then the list shows 1 Riya, 2 Arjun, 3 Meena, 4 Kabir, in that order: the passing order and the clue order
And after each add the field is empty and keeps focus (the phone keyboard stays open)
And every Enter adds the name typed before it, however quickly the names and Enters follow each other (typing
"Zoya", Enter, "Dev", Enter within 200 ms adds both, in that order); no Enter is dropped or merged
And each row has ▲ "Move Riya up", ▼ "Move Riya down" and ✕ "Remove Riya", each at least 44 × 44 CSS px
(guideline 21: nothing needs dragging); row 1's ▲ and the last row's ▼ are disabled
And names are trimmed of spaces at both ends; an empty or all-space name adds nothing ("Add" is disabled)
And the field has `maxlength="16"`, so a 17th character cannot be typed
And a name equal to one in the list, ignoring case ("riya"), is not added and shows
"Riya is already playing. Add an initial, like Riya S." (the name as already listed) until the field changes
And with 20 players "Add" is disabled and "20 players is the most." shows
And while fewer than 3 players are listed, the hint "Add at least 3 players." shows under the list as a grey small line
(15 px; 19 px with Larger text; the app's muted text colour, not an alert); "Next" stays enabled
When "Next" is tapped with fewer than 3 players
Then the screen does not move on and the same text turns into the error style (`role="alert"`, the error colour of
"Riya is already playing. …"); it returns to the grey hint when a name is added or removed
And past names show under the field as buttons, one tap adding that name at the end: the last 8 distinct names used
in any game on this phone, newest game first; within one game, in that game's seat order; names that differ only in
case count as one, shown as most recently typed; a name already in the list (ignoring case) is not offered
And ✕ during setup removes the player at once, with no toast; removing below 3 is allowed during setup (Next disables)
And a tap on "Add" (or Enter) with a refused name (duplicate, or 20 players listed) leaves the field as typed
And text left in the field when "Next" is tapped is not added and is cleared
And "← Back" on "Who's playing?" returns to "What shall we play?"; the list is kept if the host comes back within the
same visit to the Impostor setup, and is otherwise rebuilt by IMP-004

## IMP-004: Tonight's names arrive filled in
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given tonight's session (PLT-016) already has a game with Riya, Arjun and Meena (Tambola or Impostor; the most recent
game's players, PLT-024)
When the host taps the Impostor card
Then "Who's playing?" already lists Riya, Arjun and Meena in that game's order, with a quiet "Clear list"
And "Clear list" shows whenever the list has at least 1 name, filled in or typed
When the host taps "Clear list"
Then the list empties at once and the toast "List cleared · Undo" shows for 5 s; "Undo" restores the same list
in the same order
Given no session tonight
Then the list starts empty and "Clear list" is not shown until a name is added

## IMP-005: The four choices, with these defaults
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Next" on "Who's playing?"
Then "How do you want to play?" shows four groups, each with two option buttons:
Mode "Easy" / "Hard"; Talking "Free flow" / "Timer"; Score "No" / "Yes"; Words "Whole family" / "+ Grown-ups"
And on this phone's first ever evening the selected options are Easy, Free flow, No, Whole family (later: IMP-009)
And exactly one option per group is selected (outline, ✓, tint, `aria-pressed="true"`), never the main look
(guideline 17a); tapping the other option moves the selection; tapping the selected one changes nothing
And under each group only the selected option's line shows (Option lines in Canonical strings)
And below the groups: the button "Categories: all 9 ›" (IMP-007), then, on one row directly above "Start round",
two quiet buttons of equal width, "More options ›" (IMP-076) on the left and "How to play" (IMP-070) on the right
And "Start round" is the one main button; tapping it creates the evening and starts the first deal at once (records
`startDeal {practice: false}`; IMP-008)
And "← Back" returns to "Who's playing?" with the list unchanged

## IMP-006: Choices stay for the evening and change only between rounds
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the host chose Hard and Timer and round 1 ended
When the host taps "Next round"
Then round 2 uses Hard and Timer
When, on a round result, the host opens the menu and taps "Change how we play"
Then "How do you want to play?" opens with the evening's current choices selected; "Start round" records
`setChoices` (only when something changed) and then `nextRound`, and the next round's deal starts
And "← Back" (or the phone's Back) keeps the changes: it records `setChoices` when something changed (nothing
otherwise) and returns to the same result; the changes apply from the next round
And the evening stays the same evening (same seeds, same round numbering)
And "Change how we play" is not in the menu during a round (IMP-075)

## IMP-007: Categories, non-veg and one impostor
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the host taps "Categories: all 9 ›"
Then a sheet "Categories" shows 9 switches, named and ordered exactly: "Food", "Festivals and occasions",
"Around the house", "Out and about", "Films, music and TV", "Sports and games", "School and childhood",
"Weddings and family", "Everyday moments"; on the first ever evening all are on
And below them the switch "Include non-veg food", off on the first ever evening
And a switch that is on has the track colour #1E3A5F (the deep blue already used for marks, not the main-button
colour; guideline 17a) and a white (#FFFFFF) thumb, a contrast of at least 3:1 between thumb and track
And when only one category switch is on, that switch is disabled and "Keep at least one category." shows
When the host switches off two categories and taps "Done"
Then the button reads "Categories: 7 of 9 ›"
And "Include non-veg food" does not change that button's text
And every round has exactly one impostor (two impostors are later, IMP-036)

## IMP-008: Taps to the first deal
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given tonight's names are filled in (IMP-004) and the choices are as wanted
Then from tapping the Impostor card, the first "Pass the phone to…" screen comes after exactly 3 taps:
card → "Next" → "Start round", on every evening (no card shows by itself, IMP-070)
And no session-name question is asked (IMP-009)
(Time is a usability target, not a test: 30 s for a group that played tonight; under 90 s when typing names.)

## IMP-009: Choices start from last time; the evening joins tonight's session silently
Status: approved, owner, 2026-10-06 (changed; detail of IMP-005, IMP-006, IMP-008)
Phase: Impostor 1
Given `pgn.pref.impostor.lastChoices` (written at every first "Start round" and every `setChoices`: the most
recently started evening's latest choices, whether ended or discarded) holds Hard, Timer, Yes, + Grown-ups,
7 categories, non-veg on and the last-chance guess on
When the host starts a new evening from the Impostor card
Then "How do you want to play?" opens with exactly those 7 choices selected (the 4 groups, the categories, non-veg,
and the last-chance guess in "More options", IMP-076), and the small line "Same as last time" directly under the
heading
And "Same as last time" shows whenever the choices were carried over (from `lastChoices`, or "Play again"); it is
not shown on a phone that has never played, nor in "Change how we play"; once shown it stays, unmoved, until the
choices screen is left, even when a choice is changed (nothing on the screen moves; guideline 45a)
And a stored `lastChoices` without `lastGuess` reads as the last-chance guess off
And stored category names from before 4 October are mapped: "Travel and places" → "Out and about",
"Cricket and games" → "Sports and games", "Desi life" → "Everyday moments"; any other name not among the 9 is
dropped; when no category is left, all 9 are on
And on a phone that has never played, the IMP-005 defaults apply (last-chance guess off)
And "Play again" (IMP-103) uses the choices of the evening it was tapped on instead; the category name mapping
applies only to the stored `lastChoices`; a category name in a past evening's choices that is not among the 9 is
dropped (all 9 when none is left)
When "Start round" is tapped
Then the evening joins tonight's session by PLT-016's rules with no question (no "Session name" field, no
"Continue … or start a new session?")
And when PLT-016 would start a new session, it is created with the name PLT-016 suggests (the day, as
"Sunday 4 Oct"), without asking

---
