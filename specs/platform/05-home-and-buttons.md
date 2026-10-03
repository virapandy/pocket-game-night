# Home and button looks (every game)

What the first screen offers, and which button looks most important on every screen. From the owner's
observations of 1 October 2026, checked by the UX designer and decided with the product owner
(`docs/games/tambola/ux-review-2026-10-01-action-hierarchy.md`, UX guideline 17a in `docs/ux-guidelines.md`,
`docs/decisions.md` 2026-10-01, UX list rows 2 and 4 in `docs/handover.md`).

## PLT-300: Home: host a game or join with my ticket
Status: approved, owner, 2026-10-03 (UX list row 21: tickets more than 6 hours old open on Home); was approved, owner, 2026-10-01 (UX list row 2)
Phase: Phase 2 (phone tickets)
Given the app opens on Home
Then Home shows two equal choices, "Host a game" and "Join with my ticket", as cards of the same size and look,
neither with the main-button look (PLT-301)
And each card says in one line what it is for: hosting runs the game on this phone; joining is for a player with a
QR or code from the host
And any unfinished games are listed below the two choices, as plain rows ("Tambola 11:17 · 30 called"), whose
resume button is never the main-button look (one tap still goes back in, PLT-004)
And Sessions, History, Report a problem and Settings are still reachable from Home (in a menu ⋯ is fine)
When the host taps "Host a game"
Then the game's start screen opens (for Tambola: "New game", TAM-213)
When a guest taps "Join with my ticket"
Then the phone offers both ways in: scanning the host's QR with the phone's camera, and "Type the code"
When the guest taps "Type the code" and types the code from the host (TAM-117)
Then their ticket opens
Given this is the first time the app has been opened on this phone
Then Home also says "You're ready for game night" (TAM-057)
Wrong input: a typed code that is not a ticket is refused with a one-line reason, and no ticket opens (TAM-117)

Tickets left on a player's phone (UX list row 21, approved, owner, 2026-10-03; docs/handover.md 2b;
docs/games/tambola/ux-review-2026-10-03-after-the-game.md, decision 2)
Given a player's phone holds tickets whose time (TAM-171: the game's start time, or when a typed-code ticket was added)
is less than 6 hours ago
When the app is opened
Then the tickets open, as before (TAM-171)
Given the tickets' time is more than 6 hours ago
When the app is opened
Then Home opens, not the tickets, with one row below the two choices, where "Your tickets ›" is today:
- the same day: "Your tickets from 7:30 pm"
- the day before: "Your tickets from yesterday, 9:15 pm"
- earlier: "Your tickets from Sat 28 Sep"
And the row has two quiet buttons, "Open" and "Clear", neither with the main look (PLT-301)
When the player taps "Open"
Then the tickets open with every mark
When the player taps "Clear"
Then the question of TAM-215 is asked; "Clear tickets" clears them and the row goes; "Keep my tickets" keeps them and the row
And saved tickets that have neither time (kept from before this change) also get the row

## PLT-301: One main button per screen, and it is the next step
Status: approved, owner, 2026-10-01 (UX list row 4; UX guideline 17a; hand-out and typed claim form named from UX list rows 8 and 9)
Phase: Phase 2 (phone tickets)
On every screen, host and player
Then at most one button has the solid main look, and it is the next step on that screen:
- setup: "Next" on each step (once a choice is made on the ticket-type step), "Confirm prizes" on the last
- calling: "Next number" (TAM-124)
- the End game question: "Keep playing" (TAM-103)
- a player's tickets and quick mark: "Show claim" (TAM-192)
- handing out phone tickets: "Next ticket", then "Start calling" (TAM-181, UX list row 9, owner, 2026-10-01)
- the host's typed claim form: "Check", once the ticket number and prize are filled in (TAM-178, UX list row 8)
And a chosen option (such as the chosen ticket type, TAM-213) shows an outline, a ✓ and a light tint, never the
main look
And choices between equals look equal: "Host a game" and "Join with my ticket" (PLT-300); "Paper tickets" and
"Phone tickets" (TAM-213)
And a destructive action ("End game", "Discard…") is never the main button
And "Play again" on the payout screen is outlined (TAM-197)
