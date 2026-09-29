# Usability: mis-touches, legibility, offline and interruptions

From `docs/ux-guidelines.md`. Most of these become browser tests (size, position, contrast, timing)
or checks on the iPhone Simulator and a throttled Android browser.

## TAM-100: "Next number" is always in the same place, and big
Status: approved, owner, 2026-09-28
Phase: Phase 1a
On every host screen during a game
Then "Next number" sits at the bottom centre, at least 72 CSS px tall and at least 44 CSS px wide
And it never moves between calls, claims or screens

## TAM-101: A double tap calls only one number
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "Next number" twice within 0.5 seconds
Then exactly one number is drawn
And the button stays disabled until the new number is on screen

## TAM-102: Sliding off a button cancels it
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host presses "Next number" and slides the finger off before lifting
Then no number is drawn (the action fires only when the finger lifts on the button)

## TAM-103: Ending a game needs a specific confirmation
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "End game"
Then a confirmation asks "End the game and show payouts?" with buttons "End game" and "Keep playing"
And "End game" sits away from the thumb zone, not where "Next number" is

## TAM-104: Every control is big enough to hit
Status: approved, owner, 2026-09-28
Phase: Phase 1a
On every screen, host and player
Then every tappable control is at least 44 × 44 CSS px, with space between neighbours
Except ticket cells in portrait, which are at least 24 × 24 CSS px with no neighbour inside a 24 px circle

## TAM-105: Colour is never the only signal
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then a marked ticket number shows a fill and a mark
And every claim verdict shows an icon and a word: "✓ Accepted" or "✗ Bogey"
And called and not-called numbers in a claim check are shown with ✓ and ✗ as well as colour

## TAM-106: Text is readable in dim or bright rooms
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then all text has contrast of at least 4.5:1 (3:1 for large text and for state indicators)
And the called number on the room screen has contrast of at least 7:1

## TAM-107: The called number is readable across the room
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When a number is called
Then its digits are at least 25 mm tall on a typical phone (about 160 CSS px)
And the last 3 calls are visible on the same screen

## TAM-108: "Show the room" hides the controls
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "Show the room"
Then only the called number and the last 3 calls are shown, large
And one tap returns to the host controls

## TAM-109: Every icon has a word
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every icon button on host and player screens has a visible text label

## TAM-110: The screen stays on during a game
Status: approved, owner, 2026-09-28
Phase: Phase 1a
While a game is in progress on the host phone
Then the app asks the phone to keep the screen awake, and asks again after the app returns to the front
And if the phone refuses (for example in battery saver), a small "keep your screen on" hint appears

## TAM-111: The game can't be lost by pulling or swiping
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host pulls down on the screen, or swipes from the edge, during a game
Then the page does not refresh or navigate away
And if the page is refreshed anyway, the game resumes exactly where it was

## TAM-112: Android closing the app in the background doesn't lose the game
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the phone discarded the app while it was in the background
When the host returns to it
Then the game reopens at the same number with "Game resumed"

## TAM-113: No update in the middle of a game
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given a new version of the app is available
While a game is in progress
Then the app does not update or reload
And "Update available" appears only on the home screen

## TAM-114: Offline is never shown as an error
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the host phone has no internet
Then no screen shows an offline error or waits on the network
And every host action works the same as when online

## TAM-115: A lost saved game is handled calmly
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the browser has cleared the app's saved data
When the host opens the app
Then a normal start screen appears, with no error message

## TAM-116: Taps respond instantly on a budget phone
Status: approved, owner, 2026-09-28
Phase: Phase 1a
On a mid-range Android phone (or a browser with the CPU slowed to match)
Then every tap shows a visible response within 100 ms
And the app is usable within 5 seconds of opening over a slow connection the first time

## TAM-117: Joining a phone ticket works with the phone's camera, or a typed code
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
When a player points their phone's own camera at the ticket QR
Then their ticket opens, with no separate scanner app
And the host screen also shows a typed code of at most 12 characters, in groups of 4, with no
look-alike characters (no 0, O, 1, I or L)
And typing that code opens the same ticket, with no internet
(The code carries the ticket's numbers, so it needs more than 6 characters.)

## TAM-118: iPhone hosts get a one-time install tip
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the host uses an iPhone and has not added the app to the home screen
Then a one-time tip shows how to add it ("Share → Add to Home Screen")
And explains that games saved in Safari and in the home-screen app are separate

## TAM-119: Undo last call within 5 seconds
Status: approved, owner, 2026-09-28 (decided: owner)
Phase: Phase 1a
Given the host tapped "Next number" by mistake
When they tap "Undo last call" within 5 seconds
Then that number goes back into the draw and the previous number is shown again
And after 5 seconds the option disappears and TAM-071 applies

## TAM-120: Auto-call mode
Status: decided 2026-09-28 (owner)
Phase: Phase 1b
Given auto-call is off by default
When the host turns it on (with a one-time warning)
Then the host chooses the time between calls, and the phone speaks each number on that timer
And the host can change the timer at any time during the game, taking effect from the next call
And the host can pause and resume with one tap, always in the same place
And if the app goes to the background, auto-call pauses and shows "Paused: tap to resume" on return
And pausing or changing the timer never skips or repeats a number

## TAM-121: Players can make text larger
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
When a player turns on "Larger text" on their phone ticket
Then the ticket and all text grow, and nothing is cut off or overlaps

## TAM-122: Tickets on phones default to landscape
Status: draft (product owner verdict 2026-09-28: approve; awaiting owner sign-off when Phase 2 comes up)
Phase: Phase 2 (phone tickets)
When a player opens their phone ticket
Then it is shown in landscape with cells at least 44 CSS px, and turning the phone to portrait still works

## TAM-134: Dark mode is an option, not the default
Status: approved, owner, 2026-09-28
Phase: Phase 1b
Then the app starts in light mode
And the host or a player can switch to dark mode, where text stays at least as large

## TAM-135: Host taps are felt and heard
Status: approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "Next number" or confirms a claim
Then the phone gives a short vibration and sound where the phone supports it
And both can be turned off in settings

## TAM-136: Nothing needs dragging
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Then every action in the app can be done with taps alone

## Calling screen and setup redesign (change request, 28 September 2026)
From `docs/games/tambola/ux-calling-screen.md`. TAM-138 is owner-approved in the change request. TAM-123
to TAM-129 turn the redesign's layout and acceptance list into checks; they are new drafts for the owner.
All sizes are checked on a 390 × 844 screen (a typical Android phone) unless a scenario says otherwise.

## TAM-138: The calling screen needs no scrolling, and the number never goes out of view
Status: approved, owner, 2026-09-28 (change request)
Phase: Phase 1a
Given a game in progress on a 390 × 844 screen
Then the calling screen needs no scrolling
And the called number stays fully visible after calls, claims, undo and closing a tier

## TAM-123: The number dominates the calling screen
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
Given a game in progress on a 390 × 844 screen
Then nothing sits above the called number except a top bar with Back, the progress ("23 of 90 called") and a menu (⋯)
And the number's digits are at least 160 CSS px tall (TAM-107), taking about 40% of the screen
And the rhyme is shown large under it, with "Repeat" and "Another rhyme" as quiet text buttons (still at least 44 × 44 CSS px, TAM-104)
And the last 5 calls are shown small under the rhyme, most recent first (TAM-016)
And after all 90 numbers are called, the number, the rhyme and the buttons are all still fully visible
Edge: a long rhyme (40 characters, TAM-156) still shows in full without pushing anything off the screen

## TAM-124: One main button; End game and Discard live in the menu
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
Given a game in progress
Then "Next number" is the only filled main button on the calling screen, in a fixed zone at the bottom (TAM-100)
And "Record a win" (TAM-037) sits in its own row just above "Next number", full width but not filled, so the two are never side by side
And "Next number" is full width at the very bottom, centred (TAM-100)
And the menu (⋯) holds Settings, Show the room, Board, Check numbers (TAM-139), End game and Discard game
And End game and Discard game appear nowhere on the calling screen outside the menu, and still ask for their
confirmations (TAM-103, PLT-005)
And "Show the room" can also be opened by a long press on the number (the menu stays the tap-only way, TAM-136)

## TAM-125: The undo toast never moves anything
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
When the host calls 21
Then a toast "Called 21 · Undo (5s)" floats just above the bottom buttons for 5 seconds (TAM-119)
And no other element on the screen moves, grows or shrinks when the toast appears or disappears
And the toast never covers "Next number" or "Record a win"
When the host taps Undo on the toast within 5 seconds
Then TAM-119 applies, and again nothing else moves
Edge: calling again while a toast is showing replaces it with the new number's toast; only the latest call can be undone

## TAM-126: Prize chips show at a glance what is open, won and closed
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
Given a game with five tiers
Then each tier shows as a chip on the calling screen: open ("Top ●"), won ("Early 5 ✓ Riya"), or closed (greyed)
And each state has a word or symbol as well as colour (TAM-105)
When a win is recorded for Top Line (TAM-037, TAM-145)
Then its chip reads "Top Line ✓ Riya · Close", and "Next number" reads "Close Top Line first" until the host closes it
And if the chips do not fit on one line, they scroll sideways inside their own row; the page itself never scrolls (TAM-138)

## TAM-127: The board opens as a sheet over the calling screen
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
When the host taps "Board" in the menu (or swipes up from the prize chips)
Then the 1–90 board opens as a sheet over the calling screen, with the called numbers marked (TAM-016)
And one tap closes it, and the calling screen is exactly as it was, number fully visible
And the board never pushes the number off the screen

## TAM-128: The screen-sleep hint is a one-time tip, not a permanent line
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign; refines the hint in TAM-110)
Phase: Phase 1a
Given the phone refuses to keep the screen awake (TAM-110)
Then a one-time tip explains it, and can be dismissed
And after that, only a small icon with a word ("Screen may sleep", TAM-109) stays in the top bar
And no permanent line of text takes space on the calling screen
And when the phone does keep the screen awake, neither the tip nor the icon appears

## TAM-129: Landscape: the phone on a stand, facing the room
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign). "At least as readable" decided 2026-09-29 (docs/decisions.md)
Phase: Phase 1a
Given the host turns the phone to landscape during a game (844 × 390)
Then the number fills the left half, the rhyme and the last calls sit on the right, and the buttons run along the bottom
And nothing needs scrolling, and the number is at least as readable as in portrait:
its digits are at least 160 CSS px tall (TAM-107) and never smaller than in portrait
And turning back to portrait keeps the game exactly where it was

## TAM-188: Dark mode keeps the readability rules
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1b); was draft (new, tester, 2026-09-28, 1b review; follows from TAM-134 and TAM-106)
Phase: Phase 1b
Given the host switched to dark mode (TAM-134)
Then every contrast rule still holds (TAM-106: 4.5:1 for text, 7:1 for the number on the room view)
And the number, the rhyme and every control are exactly as large as in light mode
And colour is still never the only signal (TAM-105)
And the choice is remembered on this phone for the next game, and switching it never changes the game in progress
