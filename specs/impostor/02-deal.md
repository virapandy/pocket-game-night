# 02-deal.md: passing the phone

Copied unchanged from `docs/games/impostor/scenarios.md` (version 2.2, 3 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-010: Each player sees their role privately, in seat order
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Riya, Arjun, Meena and Kabir; Arjun is the impostor; the word is Samosa; hold mode (IMP-014 off)
When the round's deal starts
Then screen A shows "Pass the phone to" and RIYA (`pass-name`), with the main button "I'm Riya"
When "I'm Riya" is tapped
Then screen B shows RIYA at the top, the pad "Hold here to see your word" (`hold-pad`, a button with that accessible
name) in the lower half, and the quiet "Tap instead"; no word, and no element with the main look (the pad included)
until "Done…" appears, in hold mode and tap mode alike, and in "See my word again" (IMP-017)
When Riya presses the pad (`pointerdown`)
Then the private block (IMP-011) shows at once, wholly above the pad in portrait (the block's bottom edge ≤ the
pad's top edge) and wholly left of the pad at 812 × 375 (the block's right edge ≤ the pad's left edge)
When she lets go (`pointerup`)
Then the block leaves the page at once (IMP-013) and the pad shows again
And the first time the block hides after showing for at least 500 ms without a break (by `pointerup`,
`pointercancel` or `pointerleave`), the main button "Done, pass to Arjun" and the quiet "Don't know this word?"
appear, and stay for the rest of her turn
And a hold under 500 ms shows and hides the block and adds nothing; any later hold of at least 500 ms adds them
And once they are shown, further holds of any length show and hide the block, and change nothing else
When she taps "Done, pass to Arjun"
Then screen A shows "Pass the phone to" ARJUN with "I'm Arjun", and so on in seat order
And the last player's button reads "Done, everyone's seen" (IMP-016)
And no screen A or B ever shows the previous player's block
And a double tap on "Done…" may open the next player's screen B; nothing private shows there without a hold

## IMP-011: What each role sees: always five lines
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the word is Samosa (category Food, hint "Tea time", no other names)
Then while held, `private-block` has exactly 5 children, in this order, for every role and mode:

| Line | Crew, Easy | Impostor, Easy | Crew, Hard | Impostor, Hard |
|---|---|---|---|---|
| 1 (small line) | "Your secret" | "Your secret" | "Your secret" | "Your secret" |
| 2 (`private-word`) | "Samosa" | "You're the impostor" | "Samosa" | "You're the impostor" |
| 3 (body text) | "Category: Food" | "Category: Food · Hint: Tea time" | "Give one-word clues." | "Listen and blend in." |
| 4 (body text) | "Give one-word clues. Don't say it!" | "Listen, blend in, guess the word." | "Don't say it!" | "Guess the word if caught." |
| 5 (small line) | other names line | empty | other names line | empty |

And line 5 is "Also called " followed by `other_names` exactly as in `words.csv`, for example the word Pani puri gives
"Also called Golgappa / Puchka", and Kheer / Payasam gives "Also called Payesh"
And line 5 is an empty element of the same height as one small line when the word has no other names, and **always**
empty for the impostor
And the word shows exactly as in the list, both names included ("Kheer / Payasam", IMP-053)
And the category shown is the word's `category` exactly ("Films, music and TV")
And the impostor's block never contains the word or its other names

## IMP-012: The impostor's turn looks exactly like everyone else's
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then for crew and impostor alike: the same screens A and B, the same buttons in the same places, the same background
colour, the same five-line block with the same font sizes per line, `navigator.vibrate(10)` once on every
`pointerdown` on the pad (or on "Tap to see your word"), no sound when the block shows, and "Done…" appearing at the
same fake-clock moment for the same hold (guideline 45)
And `private-word` is 36 px; with Larger text on, or for a word longer than 20 characters, it may be any size from
30 px to 36 px; it fits in 3 lines at every size (the longest word, "Five more minutes, then phone off", included)
And lines 1 and 5 are small lines (15 px; 19 px with Larger text) and lines 3 and 4 body text (17 px; 21 px with
Larger text) for every role
Property (sample 200 seeded deals of 4 players, Easy and Hard): before any hold, the `outerHTML` of screens A and B
for the impostor's turn equals that of a crew member's turn once player names are replaced by a placeholder;
tolerance 0 differences

## IMP-013: The word is never in the page except while held
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then from the first "Pass the phone to…" until the reveal shows the word (IMP-033, IMP-034, IMP-038), none of these
is in `document.documentElement.outerHTML` or `document.title`, except inside `private-block` and `private-live`
while that player's block is shown: the round's word, each of its other names, its hint, "You're the impostor",
and (Hard) its category
And "in" means a case-insensitive match of each term as a whole phrase, with a word boundary at both ends; `localStorage` and script sources are not checked
And this holds on every screen reachable during a round: room screens, screen B before and between holds, the
menu, Settings, Rules and "See my word again" before a hold (History is not reachable during a round, IMP-075)
And long-pressing the pad or the word opens no text selection, copy or look-up bubble, magnifier, context menu or
drag: the pad, `private-block` and their children have computed `user-select: none`, `-webkit-user-select: none`,
`-webkit-touch-callout: none`, `-webkit-user-drag: none`, the attribute `draggable="false"`, and a `contextmenu`
event on them is `defaultPrevented`
(A manual check on the owner's Android phone and an iPhone stays a release step, not a test.)
Tests choose words (by forced deals) whose word, other names and hint do not occur, as whole phrases, in the
Canonical strings.

## IMP-014: Tap to show, for players who can't hold
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the app Settings switch "Tap to show instead of hold" is on (kept on this phone, off by default)
Then on every screen B the pad reads "Tap to see your word" and "Tap instead" is not shown
And under that switch in Settings the small line reads exactly
"Your screen reader will say the word out loud. Use earphones or turn the volume down."
Given the switch is off and Meena taps "Tap instead" on her screen B
Then her pad becomes "Tap to see your word" for her turn only; Kabir's turn starts in hold mode again
When "Tap to see your word" is tapped
Then the block shows and the pad reads "Tap to hide" (tapping "Tap to hide" does not vibrate)
When "Tap to hide" is tapped, or 8 s pass since the block was shown (t = 8 s after that tap)
Then the block hides and the pad reads "Tap to see your word" again
And the first hide (by either way) adds "Done, pass to …" and "Don't know this word?", as a 500 ms hold does
And showing again restarts the 8 s; every hide trigger of IMP-018 also hides it

## IMP-015: "Don't know this word?" redeals without giving anything away
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given Meena (third in seat order) has held and sees "Don't know this word?"
When she taps it
Then a room screen shows "No problem! New word coming." and "Pass the phone back to RIYA" (the first player in seat
order), with the main button "I'm Riya"
And the tap on "Don't know this word?" records `dontKnow`, which draws the new word and the new impostor by
IMP-061 (the same player may be drawn again), same players, same round number; tapping "I'm Riya" (no move) opens
Riya's screen B and the deal runs again from her
And this "No problem!" screen shows only after "Don't know this word?"; "Deal again" (IMP-025) and the "left halfway"
"Next round" (IMP-091) go straight to the first player's screen A
And the menu on the "No problem!" screen is the deal menu (IMP-075)
And the button has the same label, place and behaviour on the impostor's screen B
And the word given up is not dealt again tonight (tonight's session), even after "Allow repeats" (IMP-052); it is not
listed in Settings' "Skipped words" (that list is IMP-107's)
And there is no limit on how many times it can be used in a round
And the starter is picked after the final deal (IMP-021)

## IMP-016: After the last player, straight to the clues
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the last player taps "Done, everyone's seen"
Then one room screen shows, top to bottom: "✓ Everyone has seen their word.", "Phone in the middle, face up.", the
starter and the clue order (IMP-020), and the main button "Talk it over" (Free flow) or
"Start the 2-minute timer" (Timer)
And the 3–5 player button of IMP-022 when it applies

## IMP-017: See my word again
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given the clues screen, the talk screen or the picker is showing
When the host opens the menu and taps "See my word again"
Then a dialog "Whose word?" lists one button per player in seat order, and a quiet "Cancel"
And the timer, if running, pauses at once (IMP-027)
When "Cancel" is tapped
Then the dialog closes and nothing else changes (the timer stays paused, showing "Carry on")
When "Meena" is tapped
Then screen A shows "Pass the phone to" MEENA with "I'm Meena", then screen B exactly as in the deal (IMP-010 to
IMP-014), and her "Done" button reads "Done, everyone's seen"
And "Don't know this word?" is not shown during "See my word again"
When she taps it
Then the screen it was opened from shows again, unchanged, with the timer paused
And there is no menu button from "Whose word?" until it returns
And if the page becomes hidden during it, on return it shows "Pass the phone to" MEENA (screen A) again
And it is not recorded as a move and changes no round state

## IMP-018: Hide triggers and the privacy cover
Status: approved, owner, 2026-10-03 (detail of IMP-013)
Phase: Impostor 1
Given a player's block is shown (held, or tapped open)
When any of these happens: `pointerup`, `pointercancel` or `pointerleave` on the pad (hold mode); `scroll` on
`window`; `resize` or `scroll` on `window.visualViewport`; `visibilitychange` to hidden; `pagehide`
Then the block and `private-live` are emptied in the same event (before any later task)
And while `document.visibilityState` is hidden, `privacy-cover` is in the page: `position: fixed`, covering the whole
viewport, opaque, above everything; it is removed when the page is visible again
And a return to visible during the deal shows "Welcome back." (IMP-090)
