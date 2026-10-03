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
Status: approved, owner, 2026-10-01 ("Keep playing" is the main button, UX list row 6, UX guideline 17a); was approved, owner, 2026-09-28
Phase: Phase 1a
When the host taps "End game"
Then a confirmation asks "End the game and show payouts?" with buttons "End game" and "Keep playing"
And "End game" sits away from the thumb zone, not where "Next number" is
And "Keep playing" is the confirmation's one main button; "End game" is outlined, never the main look (PLT-301)

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
Status: approved, owner, 2026-10-03 (the game code visible to the room, UX list row 25); was approved, owner, 2026-09-28
Phase: Phase 1a
When a number is called
Then its digits are at least 25 mm tall on a typical phone (about 160 CSS px)
And the last 3 calls are visible on the same screen
And (UX list row 25, approved, owner, 2026-10-03; phone-ticket games, where the game has a code) the calling
screen's top bar shows "Tambola · Game 7K3P" as quiet text, not a control, and the room view shows a small
"Game 7K3P" in its bottom-left corner, kept in from the edge, below the number and the last 3 calls

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
And every row that is a button has a readable name: each session in the Sessions list is labelled with the
session's name, its games and whether it is settled (1b review finding 5, approved, owner, 2026-09-29,
docs/games/tambola/changes-2026-09-29-money-and-1b.md)

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
Status: approved, owner, 2026-10-01 (the field's hint and "Add a ticket by code", UX list row 15, docs/games/tambola/ux-review-2026-10-01-several-tickets.md decision 7); approved, owner, 2026-09-30 (typed-code prizes noted on the owner's decision of 2026-09-30; reworded on the owner's decision of 2026-09-30, docs/decisions.md: 20 characters, because 12 cannot hold a ticket; was approved 2026-09-29 with "at most 12 characters")
Phase: Phase 2 (phone tickets)
When a player points their phone's own camera at the ticket QR
Then their ticket opens, with no separate scanner app
And the host screen also shows a typed code of 20 characters in 5 groups of 4, such as
K7QM-2XPA-9RTD-4HWC-B3NF, with no look-alike characters (no 0, O, 1, I or L)
And typing that code opens the same ticket, with the same numbers, its ticket number and the game code, with no internet
(The code carries the whole ticket, so it opens offline; nothing is fetched and no seed is shared. The player's
name, the start time and the prize list come only with the QR.)
Wrong input: a code that is not a ticket (too short, wrong letters) is refused with a one-line reason
And a ticket opened only by typed code offers every usual prize under "Show claim" (it has no prize list);
the host's scan refuses a prize the game doesn't have, calmly, never as a bogey (TAM-177, TAM-179; owner decision 2026-09-30)
And (UX list row 15, approved, owner, 2026-10-01) the code field shows a pattern hint made only of X's and dashes,
such as "XXXX-XXXX-XXXX-XXXX-XXXX", never a real-looking code
And on a phone that already shows tickets, the way to add one more by code is a button "Add a ticket by code" (in
the player's menu is fine); it opens the same code field, and the typed ticket joins the others (TAM-214 limits a
phone to 3)

## TAM-118: iPhone hosts get a one-time install tip
Status: approved, owner, 2026-09-28
Phase: Phase 1a
Given the host uses an iPhone and has not added the app to the home screen
Then a one-time tip shows how to add it ("Share → Add to Home Screen")
And explains that games saved in Safari and in the home-screen app are separate

## TAM-119: Undo last call within 5 seconds
Status: approved, owner, 2026-09-28 (decided: owner); the toast's look changed with TAM-125 (UX list row 13, approved, owner, 2026-10-01)
Phase: Phase 1a
Given the host tapped "Next number" by mistake
When they tap "Undo last call" within 5 seconds
Then that number goes back into the draw and the previous number is shown again
And after 5 seconds the option disappears and TAM-071 applies

## TAM-120: Auto-call mode
Status: approved, owner, 2026-10-03 (Settings opened during a game has "← Back" at the top, UX list row 18); was decided 2026-09-28 (owner)
Phase: Phase 1b
Given auto-call is off by default
When the host turns it on (with a one-time warning)
Then the host chooses the time between calls, and the phone speaks each number on that timer
And the host can change the timer at any time during the game, taking effect from the next call
And the host can pause and resume with one tap, always in the same place
And if the app goes to the background, auto-call pauses and shows "Paused: tap to resume" on return
And pausing or changing the timer never skips or repeats a number
And (UX list row 18, approved, owner, 2026-10-03) Settings opened during a game has "← Back" at the top, on the
screen as it first appears, which returns to the game where it was

## TAM-121: Players can make text larger
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
When a player turns on "Larger text" on their phone ticket
Then the ticket and all text grow, and nothing is cut off or overlaps

## TAM-122: Tickets work in both orientations
Status: approved, owner, 2026-10-03 (UX list row 2, docs/handover.md 2b: tickets fit the width down to 320 px); approved, owner, 2026-10-01 (12 px margin in "One at a time", UX list row 15); approved, owner, 2026-09-30 (reworded on the owner's decision of 2026-09-30, docs/decisions.md: 42 px cells in "One at a time" so the ticket fits a 390 px portrait screen; was approved 2026-09-29 with "at least 44 CSS px in One at a time")
Phase: Phase 2 (phone tickets)
When a player opens their phone tickets
Then they follow the phone's orientation (TAM-173); nothing forces landscape
And on a 390 px or wider portrait screen, ticket cells are at least 40 CSS px with all tickets shown (UX list row 2,
approved, owner, 2026-10-03: was "at least 40 CSS px" on every screen, and "at least 42 CSS px in One at a time")
And (UX list row 2) on narrower screens, down to 320 px, the cells shrink so the tickets fit the width, in "All
tickets" and "One at a time": about 32 CSS px at 320 px, never below 24 CSS px (TAM-104, guideline 41), with no
sideways sliding and every cell on the screen
And in "One at a time" on a 390 px portrait screen the whole ticket fits, with no sideways sliding (TAM-191)
And (UX list row 15, approved, owner, 2026-10-01) in "One at a time" the ticket keeps a margin of at least 12 CSS px
on each side, so its cells are the width between the margins (about 40 CSS px at 390 px, 39 at 375 px) instead of
"at least 42 CSS px"

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
Status: approved, owner, 2026-09-29 (reworded on the owner's decision of 2026-09-29, docs/decisions.md: the one-time screen-sleep tip never covers the number); was approved, owner, 2026-09-28 (change request)
Phase: Phase 1a
Given a game in progress on a 390 × 844 screen
Then the calling screen needs no scrolling
And the called number stays fully visible after calls, claims, undo and closing a tier
And nothing lies on top of the number, including the one-time screen-sleep tip (TAM-128) while it is shown

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
confirmations (TAM-103, PLT-005), where the destructive button is never the main look ("Keep playing" is, owner,
2026-10-01, UX list row 6, PLT-301)
And "Show the room" can also be opened by a long press on the number (the menu stays the tap-only way, TAM-136)

## TAM-125: The undo toast never moves anything, and never covers the main buttons or the prize chips
Status: approved, owner, 2026-10-01 (a lighter bar with more space above the button below it, UX list row 13, docs/games/tambola/ux-review-2026-10-01-action-hierarchy.md); approved, owner, 2026-09-29 (change: the toast never covers the prize chips either; product owner review of the live 1a.1 build, finding 3, docs/decisions.md 2026-09-29); was approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
When the host calls 21
Then a toast "Called 21 · Undo (5s)" floats just above the bottom buttons for 5 seconds (TAM-119)
And no other element on the screen moves, grows or shrinks when the toast appears or disappears
And the toast never covers "Next number", "Record a win" or the prize chips (TAM-126), so with auto-call the chips stay readable
When the host taps Undo on the toast within 5 seconds
Then TAM-119 applies, and again nothing else moves
Edge: calling again while a toast is showing replaces it with the new number's toast; only the latest call can be undone
And (UX list row 13, approved, owner, 2026-10-01) the toast is a light bar, not a dark one: it does not stand out
from the screen behind it the way the main button does (less than 3:1 against it), while its words still meet
4.5:1 (TAM-106)
And there are at least 16 CSS px between the toast and the button just below it ("Scan a claim" with phone tickets,
"Record a win" with paper tickets)

## TAM-126: Prize chips show at a glance what is open, won and closed
Status: approved, owner, 2026-10-01 (the chips wrap instead of scrolling sideways, UX list row 15, listed there under TAM-183; docs/games/tambola/ux-review-2026-10-01-several-tickets.md: "host's prize chips cut off ('Ho…')"); approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
Given a game with five tiers
Then each tier shows as a chip on the calling screen: open ("Top ●"), won ("Early 5 ✓ Riya"), or closed (greyed)
And each state has a word or symbol as well as colour (TAM-105)
When a win is recorded for Top Line (TAM-037, TAM-145)
Then its chip reads "Top Line ✓ Riya", and the main button reads "Close Top Line" until the host closes it (TAM-198;
changed by the owner on 2026-09-30, docs/games/tambola/changes-2026-09-30-playtest.md: was "'Next number' reads
'Close Top Line first'"); the chip also keeps a Close, which closes the prize too and works while the screen is
dimmed (owner, 2026-09-30, docs/decisions.md)
And if the chips do not fit on one line, they wrap onto the next line: every chip is wholly on screen with its
words in full, nothing in the row scrolls sideways, and the page itself never scrolls (TAM-138), on a 375 px or
wider screen with up to seven tiers (UX list row 15, approved, owner, 2026-10-01; replaces "they scroll sideways
inside their own row")

## TAM-127: The board opens as a sheet over the calling screen
Status: approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign)
Phase: Phase 1a
When the host taps "Board" in the menu (or swipes up from the prize chips)
Then the 1–90 board opens as a sheet over the calling screen, with the called numbers marked (TAM-016)
And one tap closes it, and the calling screen is exactly as it was, number fully visible
And the board never pushes the number off the screen

## TAM-128: The screen-sleep hint is a one-time tip, not a permanent line
Status: approved, owner, 2026-09-29 (reworded on the owner's decision of 2026-09-29, docs/decisions.md: the tip never covers the called number); was approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign; refines the hint in TAM-110)
Phase: Phase 1a
Given the phone refuses to keep the screen awake (TAM-110)
Then a one-time tip explains it, and can be dismissed
And while the tip is shown, it never covers the called number (TAM-138)
And after that, only a small icon with a word ("Screen may sleep", TAM-109) stays in the top bar
And no permanent line of text takes space on the calling screen
And when the phone does keep the screen awake, neither the tip nor the icon appears

## TAM-129: Landscape: the phone on a stand, facing the room
Status: approved, owner, 2026-10-03 (UX list row 11, docs/handover.md 2b: "Next number" 72 px tall, "Record a win" never beside it; guideline 17b); approved, owner, 2026-09-28 (scenario review outcome: product owner verdict, owner sign-off for Phase 1a.1); was draft (new, tester, 2026-09-28, from the redesign). "At least as readable" decided 2026-09-29 (docs/decisions.md)
Phase: Phase 1a
Given the host turns the phone to landscape during a game (844 × 390)
Then the number fills the left half, the rhyme and the last calls sit on the right, and the buttons are at the bottom
And (UX list row 11, approved, owner, 2026-10-03) "Next number" is at the very bottom and 72 CSS px tall, and "Record
a win" sits just above it, never beside it
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
