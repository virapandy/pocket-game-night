# Usability: mis-touches, legibility, offline and interruptions

From `docs/ux-guidelines.md`. Most of these become browser tests (size, position, contrast, timing)
or checks on the iPhone Simulator and a throttled Android browser.

## TAM-100: "Next number" is always in the same place, and big
Status: draft
Phase: Phase 1a
On every host screen during a game
Then "Next number" sits at the bottom centre, at least 72 CSS px tall and at least 44 CSS px wide
And it never moves between calls, claims or screens

## TAM-101: A double tap calls only one number
Status: draft
Phase: Phase 1a
When the host taps "Next number" twice within 0.5 seconds
Then exactly one number is drawn
And the button stays disabled until the new number is on screen

## TAM-102: Sliding off a button cancels it
Status: draft
Phase: Phase 1a
When the host presses "Next number" and slides the finger off before lifting
Then no number is drawn (the action fires only when the finger lifts on the button)

## TAM-103: Ending a game needs a specific confirmation
Status: draft
Phase: Phase 1a
When the host taps "End game"
Then a confirmation asks "End the game and show payouts?" with buttons "End game" and "Keep playing"
And "End game" sits away from the thumb zone, not where "Next number" is

## TAM-104: Every control is big enough to hit
Status: draft
Phase: Phase 1a
On every screen, host and player
Then every tappable control is at least 44 × 44 CSS px, with space between neighbours
Except ticket cells in portrait, which are at least 24 × 24 CSS px with no neighbour inside a 24 px circle

## TAM-105: Colour is never the only signal
Status: draft
Phase: Phase 1a
Then a marked ticket number shows a fill and a mark
And every claim verdict shows an icon and a word: "✓ Accepted" or "✗ Bogey"
And called and not-called numbers in a claim check are shown with ✓ and ✗ as well as colour

## TAM-106: Text is readable in dim or bright rooms
Status: draft
Phase: Phase 1a
Then all text has contrast of at least 4.5:1 (3:1 for large text and for state indicators)
And the called number on the room screen has contrast of at least 7:1

## TAM-107: The called number is readable across the room
Status: draft
Phase: Phase 1a
When a number is called
Then its digits are at least 25 mm tall on a typical phone (about 160 CSS px)
And the last 3 calls are visible on the same screen

## TAM-108: "Show the room" hides the controls
Status: draft
Phase: Phase 1a
When the host taps "Show the room"
Then only the called number and the last 3 calls are shown, large
And one tap returns to the host controls

## TAM-109: Every icon has a word
Status: draft
Phase: Phase 1a
Then every icon button on host and player screens has a visible text label

## TAM-110: The screen stays on during a game
Status: draft
Phase: Phase 1a
While a game is in progress on the host phone
Then the app asks the phone to keep the screen awake, and asks again after the app returns to the front
And if the phone refuses (for example in battery saver), a small "keep your screen on" hint appears

## TAM-111: The game can't be lost by pulling or swiping
Status: draft
Phase: Phase 1a
When the host pulls down on the screen, or swipes from the edge, during a game
Then the page does not refresh or navigate away
And if the page is refreshed anyway, the game resumes exactly where it was

## TAM-112: Android closing the app in the background doesn't lose the game
Status: draft
Phase: Phase 1a
Given the phone discarded the app while it was in the background
When the host returns to it
Then the game reopens at the same number with "Game resumed"

## TAM-113: No update in the middle of a game
Status: draft
Phase: Phase 1a
Given a new version of the app is available
While a game is in progress
Then the app does not update or reload
And "Update available" appears only on the home screen

## TAM-114: Offline is never shown as an error
Status: draft
Phase: Phase 1a
Given the host phone has no internet
Then no screen shows an offline error or waits on the network
And every host action works the same as when online

## TAM-115: A lost saved game is handled calmly
Status: draft
Phase: Phase 1a
Given the browser has cleared the app's saved data
When the host opens the app
Then a normal start screen appears, with no error message

## TAM-116: Taps respond instantly on a budget phone
Status: draft
Phase: Phase 1a
On a mid-range Android phone (or a browser with the CPU slowed to match)
Then every tap shows a visible response within 100 ms
And the app is usable within 5 seconds of opening over a slow connection the first time

## TAM-117: Joining a phone ticket works with the phone's camera, or a typed code
Status: draft
Phase: Phase 2 (phone tickets)
When a player points their phone's own camera at the ticket QR
Then their ticket opens, with no separate scanner app
And the host screen also shows a 6-character code with no look-alike characters (no 0, O, 1, I or L)
And typing that code opens the same ticket

## TAM-118: iPhone hosts get a one-time install tip
Status: draft
Phase: Phase 1a
Given the host uses an iPhone and has not added the app to the home screen
Then a one-time tip shows how to add it ("Share → Add to Home Screen")
And explains that games saved in Safari and in the home-screen app are separate

## TAM-119: Undo last call within 5 seconds
Status: decided 2026-09-28 (owner)
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
Status: draft
Phase: Phase 2 (phone tickets)
When a player turns on "Larger text" on their phone ticket
Then the ticket and all text grow, and nothing is cut off or overlaps

## TAM-122: Tickets on phones default to landscape
Status: draft
Phase: Phase 2 (phone tickets)
When a player opens their phone ticket
Then it is shown in landscape with cells at least 44 CSS px, and turning the phone to portrait still works

## TAM-134: Dark mode is an option, not the default
Status: draft
Phase: Phase 1b
Then the app starts in light mode
And the host or a player can switch to dark mode, where text stays at least as large

## TAM-135: Host taps are felt and heard
Status: draft
Phase: Phase 1a
When the host taps "Next number" or confirms a claim
Then the phone gives a short vibration and sound where the phone supports it
And both can be turned off in settings

## TAM-136: Nothing needs dragging
Status: draft
Phase: Phase 1a
Then every action in the app can be done with taps alone
