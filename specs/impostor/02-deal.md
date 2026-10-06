# 02-deal.md: passing the phone

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.9, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-010: Each player sees their role privately, in seat order
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Given Riya, Arjun, Meena and Kabir; Arjun is the impostor; the word is Samosa; hold mode (IMP-014 off)
When the round's deal starts
Then screen A shows, top to bottom: `deal-progress` "Player 1 of 4" (17 px; 21 px with Larger text) directly above
"Pass the phone to", then RIYA (`pass-name`), then `look-away` "Everyone else, look away!" (20 px; 24 px with Larger
text), and the main button "I'm Riya"
When "I'm Riya" is tapped
Then screen B shows, top to bottom: `deal-progress` "Player 1 of 4" (17 px; 21 px with Larger text); RIYA
(`pass-name`, the screen's heading) directly under it; the quiet "Tap instead" directly under the name; a reserved
space for the text button "Don't know this word?" (IMP-015); the space for the private block; the pad "Hold here to
see your word" (`hold-pad`); the text button "Not Riya? ← Back" directly under the pad (until the first hold); and
the reserved space of the main button; "Tap instead" is at least 48 px from the main button's space at every size
And before the first 500 ms hold there is no word and no element with the main look (the pad included), and the two
reserved spaces are empty (`visibility: hidden`), in hold mode and tap mode alike, and in "See my word again"
(IMP-017)
And nothing on screen B moves after the first hold (guideline 45a): the bounding boxes of `pass-name`, `hold-pad`
and "Tap instead" are the same, to the pixel, before any hold, while held, and after "Done…" appears; after the
first hold "Not Riya? ← Back" is hidden (`visibility: hidden`), its space kept
When "Not Riya? ← Back" is tapped (before the first hold)
Then screen A of the same player shows again ("Pass the phone to" RIYA); nothing is recorded
And `hold-pad` spans the screen width minus 32 px (16 px gutters) and is at least 160 px tall at every size: 288 ×
160 at 320 × 568, 328 × 160 at 360 × 640, 358 × 160 at 390 × 844; at 812 × 375 it spans the right half minus 32 px
(374 × 160)
When Riya presses the pad (`pointerdown`)
Then the pad's text and accessible name become "Let go to hide" (for every role), and the private block (IMP-011)
is drawn at once, at every size, over the top part of screen B on an opaque layer: it covers the top bar,
`deal-progress`, the name and "Don't know this word?" (they return, unmoved, on release); it is never under the
finger and never off-screen
And the layer's top edge is the top of the viewport (y = 0) and its bottom edge is 8 px above the pad's top edge;
the block lies wholly inside it, starting 8 px below the layer's top, so line 1 "Your secret" is never cut at the top
(its top edge at y = 8, inside the viewport): at 320 × 568 the pad's top is at y = 268, so the layer runs from y = 0
to y = 260 and the block runs from y = 8 to y ≤ 260; at 360 × 640, y = 0 to y = 332; at 390 × 844, y = 0 to y = 536 (the pad's
top is 300 px above the bottom edge: 160 + 8 + 48 + 8 + 60 + 16)
And at 812 × 375 the layer covers the whole top bar across the full width (y = 0 to 48, x = 0 to 812; the menu
button cannot be tapped while held) and the left half, x = 0 to x = 406, y = 0 to y = 375 (the block's right edge ≤
the pad's left edge)
When she lets go (`pointerup`)
Then the layer and the block leave the page at once (IMP-013), and the pad reads "Hold here to see your word" again
And the first time the block hides after showing for at least 500 ms without a break (by `pointerup`,
`pointercancel` or `pointerleave`), the main button "Done, pass to Arjun" and the text button "Don't know this
word?" appear in their reserved spaces and stay for the rest of her turn
And a hold under 500 ms shows and hides the block and adds nothing; any later hold of at least 500 ms adds them
And once they are shown, further holds of any length show and hide the block, and change nothing else
When she taps "Done, pass to Arjun"
Then screen A shows "Player 2 of 4", "Pass the phone to" ARJUN, "Everyone else, look away!" and "I'm Arjun", and so
on in seat order
And the last player's button reads "Done, everyone's seen" (IMP-016)
And no screen A or B ever shows the previous player's block
And a tap within 500 ms of any screen change on the deal screens (A, B, "No problem!", "Welcome back.") is ignored:
it records nothing and changes nothing (guideline 20), so a double tap on "Done…" never skips "Pass the phone to
ARJUN"; the same guard covers the buttons of "Who's playing?", "How do you want to play?" and "How to play" (a double
tap on "Next" never lands on "Start round"); the 500 ms run from the moment the new screen is shown; the guard covers buttons only. The pad is not guarded: a
press within 500 ms works as at any other time
And inside the layer the block's lines have line-height 1.2, 4 px gaps between the 5 lines and no padding, starting at
y = 8; when the block would be taller than the layer, first lines 3, 4 and 5 shrink to 15 px, then `private-word`
shrinks to 30 px
Arithmetic (rule 4), screen B at 320 × 568: pad 160 + 8 + "Not Riya? ← Back" 48 + 8 + main button 60 + 16 = 300 px
from the bottom, so the pad's top is at y = 268 and the layer is 260 px tall (y = 0 to 260). Worst case, Larger text on, a
two-line line 3, line 4 and line 5: 22.8 (line 1, 19 px) + 86.4 (`private-word`, 2 × 36 × 1.2) + 2 × 50.4 (lines 3
and 4 at 21 px) + 45.6 (line 5 at 19 px) + 16 (gaps) = 271.6 px > 260, so lines 3–5 shrink to 15 px: 22.8 + 86.4 +
2 × 36 + 36 + 16 = 233.2 px, from y = 8 to y = 241.2 ≤ 260; `private-word` stays 36 px. Larger text off: 18 + 86.4 +
2 × 40.8 + 36 + 16 = 238 px, from y = 8 to y = 246 ≤ 260, no shrinking. At 812 × 375 the block runs from y = 8 to at
most y = 254 in the left half. Gaps on screen B (portrait): none between the top bar and `deal-progress`; 8 px between `deal-progress` and the name,
the name and "Tap instead", and "Tap instead" and "Don't know this word?"; 8 px between the pad and "Not Riya? ← Back"
and between it and the main button's space; 16 px under the main button. Above the pad, when the block is hidden:
48 + 21 + 8 + 28 + 8 + 48 + 8 + 48 = 217 px ≤ 268; "Tap instead" ends at y = 161 and the main button's space starts
at y = 492 (331 px apart)

## IMP-011: What each role sees: always five lines
Status: approved, owner, 2026-10-04 (changed)
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

And the impostor's line 4 above is for the last-chance guess on; with it off (the default) it reads, in Easy,
"Listen and blend in. Don't get caught!" and, in Hard, "Don't get caught!" (lines 1–3 and 5 unchanged)

And line 5 is "Also called " followed by `other_names` exactly as in `words.csv`, for example the word Pani puri gives
"Also called Golgappa / Puchka", and Kheer / Payasam gives "Also called Payesh"
And line 5 is an empty element of the same height as one small line when the word has no other names, and **always**
empty for the impostor
And the word shows exactly as in the list, both names included ("Kheer / Payasam", IMP-053)
And the category shown is the word's `category` exactly ("Films, music and TV")
And the impostor's block never contains the word or its other names

## IMP-012: The impostor's turn looks exactly like everyone else's
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then for crew and impostor alike: the same screens A and B, the same buttons in the same places, the same background
colour, the same five-line block with the same font sizes per line, `navigator.vibrate(10)` once on every
`pointerdown` on the pad while it reads "Hold here to see your word", or tap on it while it reads "Tap to see your
word" (never while it reads "Let go to hide" or "Tap to hide"), no sound when the block shows, and "Done…" appearing at the
same fake-clock moment for the same hold (guideline 45)
And `private-word` is a box exactly 2 × its line-height tall for every role (guideline 45a; F11), its text centred
horizontally and vertically; 36 px; with Larger text on, or for a word longer than 20 characters, it may be any
size from 30 px to 36 px; the text fits in 2 lines at every size ("You're the impostor" and the longest word,
"Mummy finding it in two seconds", included: at 320 px wide, 2 lines at 30 px)
And lines 1 and 5 are small lines (15 px; 19 px with Larger text) and lines 3 and 4 body text (17 px; 21 px with
Larger text) for every role
Property (sample 200 seeded deals of 4 players, Easy and Hard): before any hold, the `outerHTML` of screens A and B
for the impostor's turn equals that of a crew member's turn once player names and the `deal-progress` text are
replaced by placeholders;
tolerance 0 differences

## IMP-013: The word is never in the page except while held
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then from the first "Pass the phone to…" until the result screen shows the word (IMP-033, IMP-034, IMP-038, IMP-039),
none of these
is in `document.documentElement.outerHTML` or `document.title`, except inside `private-block` and `private-live`
while that player's block is shown: the round's word, each of its other names, its hint, "You're the impostor",
and (Hard) its category
And "in" means a case-insensitive match of each term as a whole phrase, with a word boundary at both ends; `localStorage` and script sources are not checked
And this holds on every screen reachable during a round: room screens, screen B before and between holds, the
menu, Settings, "How to play" and "See my word again" before a hold, and the build-up (History is not reachable
during a round, IMP-075)
And long-pressing the pad or the word opens no text selection, copy or look-up bubble, magnifier, context menu or
drag: the pad, `private-block` and their children have computed `user-select: none`, `-webkit-user-select: none`,
`-webkit-touch-callout: none`, `-webkit-user-drag: none`, the attribute `draggable="false"`, and a `contextmenu`
event on them is `defaultPrevented`
(A manual check on the owner's Android phone and an iPhone stays a release step, not a test.)
Tests choose words (by forced deals) whose word, other names and hint do not occur, as whole phrases, in the
Canonical strings.

## IMP-014: Tap to show, for players who can't hold
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given the app Settings switch "Tap to show instead of hold" is on (kept on this phone, off by default)
Then on every screen B the pad reads "Tap to see your word" and "Tap instead" is not shown
And under that switch in Settings, only while it is on, the small line reads exactly
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
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given Meena (third in seat order) has held and sees the text button "Don't know this word?" under her name
When she taps it
Then a dialog asks "New word for everyone?" with "New word" and "Back" (main); nothing is recorded yet
When "Back" is tapped (or the dialog is closed by the browser's or phone's Back)
Then the dialog closes, her screen B is exactly as before, and nothing is recorded
When "New word" is tapped
Then `dontKnow` is recorded, which draws the new word and the new impostor by IMP-061 (the same player may be drawn
again), same players, same round number; a room screen shows "No problem! New word coming." and "Pass the phone back
to RIYA" (the first player in seat order), with the main button "I'm Riya"; tapping "I'm Riya" (no move) opens
Riya's screen B and the deal runs again from her
And this "No problem!" screen shows only after "New word"; "Deal again" (IMP-025) and the "left halfway" "Next round"
(IMP-091) go straight to the first player's screen A
And the menu on the "No problem!" screen is the deal menu (IMP-075)
And the button and the dialog have the same labels, place and behaviour on the impostor's screen B
And the word given up is not dealt again tonight (tonight's session), even after "Allow repeats" (IMP-052); it is not
listed in Settings' "Skipped words" (that list is IMP-107's)
And there is no limit on how many times it can be used in a round
And the starter is picked after the final deal (IMP-021)

## IMP-016: After the last player, straight to the clues
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the last player taps "Done, everyone's seen"
Then one room screen shows, top to bottom: "✓ Everyone has seen their word.", "Phone in the middle, face up.", the
starter and the clue order (IMP-020), and the main button "Clues done, talk it over" (Free flow) or
"Clues done, start timer" (Timer)
And the 3–5 player button of IMP-022 when it applies, the quiet "See my word again" (IMP-017), and the joining line of
IMP-079 when someone is waiting

## IMP-017: See my word again
Status: approved, owner, 2026-10-06 (changed)
Phase: Impostor 1
Given the clues screen, the talk screen or the picker is showing
When the host taps the quiet "See my word again" (on the clues and talk screens) or the menu item "See my word again"
(on all three)
Then a dialog "Whose word?" lists one button per player of this round in seat order, and a quiet "Cancel"
And the timer, if running, pauses at once (IMP-027)
When "Cancel" is tapped
Then the dialog closes and nothing else changes (the timer stays paused, showing "Carry on")
When "Meena" is tapped
Then screen A shows "Pass the phone to" MEENA with "I'm Meena", then screen B exactly as in the deal (IMP-010 to
IMP-014), and her main button reads "Done, back to clues" (opened from the clues screen), "Done, back to talking"
(the talk screen) or "Done, back to the vote" (the picker)
And neither screen shows `deal-progress` during "See my word again"; screen A still shows "Everyone else, look
away!"; screen B shows no "Don't know this word?"
And screen A shows the text button "Not Meena? ← Back" directly under "Everyone else, look away!", and screen B shows
it directly under the pad until the first hold (as "Not Riya? ← Back", IMP-010)
When "Not Meena? ← Back" is tapped
Then the dialog "Whose word?" shows again (with the timer still paused); nothing is recorded and no block was shown
When she taps "Done, back to …"
Then the screen it was opened from shows again, unchanged, with the timer paused
And there is no menu button from "Whose word?" until it returns
And if the page becomes hidden during it, on return it shows "Pass the phone to" MEENA (screen A) again
And it is not recorded as a move and changes no round state

## IMP-018: Hide triggers and the privacy cover
Status: approved, owner, 2026-10-04 (changed; detail of IMP-013)
Phase: Impostor 1
Given a player's block is shown (held, or tapped open)
When any of these happens: `pointerup`, `pointercancel` or `pointerleave` on the pad (hold mode); `scroll` on
`window`; `resize` or `scroll` on `window.visualViewport`; `visibilitychange` to hidden; `pagehide`
Then the block and `private-live` are emptied in the same event (before any later task)
And only a hide by `pointerup`, `pointercancel` or `pointerleave` after at least 500 ms adds "Done…" and "Don't know
this word?" (IMP-010); the other hides here (scroll, viewport resize or scroll, hidden page, `pagehide`) add nothing
And while `document.visibilityState` is hidden, `privacy-cover` is in the page: `position: fixed`, covering the whole
viewport, opaque, above everything; it is removed when the page is visible again
And a return to visible during the deal shows "Welcome back." (IMP-090)


## IMP-019: "Player 2 of 4" and "Everyone else, look away!"
Status: approved, owner, 2026-10-04 (changed; detail of IMP-010)
Phase: Impostor 1
Then screens A and B of the deal show `deal-progress` "Player N of M": N = the current player's position in this
round's seat order (1 for the first), M = the number of this round's players; 17 px text (21 px with Larger text),
centred; on screen A directly above "Pass the phone to", on screen B directly above the name
And `deal-progress` is not shown during "See my word again" (IMP-017)
And when the practice chip shows (IMP-071), it stays at the top left and `deal-progress` keeps its place
And after a redeal ("New word", "Deal again", "left halfway" "Next round") the deal shows "Player 1 of 4" again;
"Welcome back." (IMP-090) shows the progress of the player named
And screen A shows `look-away` "Everyone else, look away!" (20 px; 24 px with Larger text) directly under `pass-name`
on every screen A, "Welcome back." and "See my word again" included
And the "No problem! New word coming." screen shows neither line
And nothing else on screens A and B changes

---
