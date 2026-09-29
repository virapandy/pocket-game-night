# Secrets and seeds

Nobody should be able to see another player's ticket or the upcoming numbers, even with a curious phone.

**Phase 2 decisions (owner, 29 September 2026, `docs/decisions.md`)**
- A claim on the player's phone is fully manual: the phone checks nothing; only the host's scan decides
  (TAM-177, TAM-193, TAM-195, TAM-196).
- Several tickets on one phone: all visible together, one at a time, quick mark, the claim screen showing the
  ticket, tickets from one sheet, the "your marks fill a pattern" cue and crossing out won prizes
  (TAM-122, TAM-173, TAM-191 to TAM-196; design in `docs/games/tambola/ux-phone-tickets.md`, section 2a).
- **Built to grow into connected mode (extensibility note, no test of its own):** the player's phone keeps its
  game knowledge (called numbers, won and closed prizes) in one place, each fact marked with where it came from:
  "the player" today, "the host" later. Phase 2 fills only the player's own facts (marks, crossed-out prizes).
  Connected mode (Phase 6) will add host facts through the same place, and quick mark, the pattern cue and the
  claim picker read from it without being rewritten. The ticket QR and the claim QR carry a format version, so
  later versions can add to them and still read old ones (the version is checked in the QR tests of TAM-053 and
  TAM-177). TAM-211 (won prizes crossed out automatically) is drafted for Phase 6 in `12-connected.md`.

## TAM-050: A player sees only their own ticket
Status: approved, owner, 2026-09-29 (Phase 2 sign-off; reworded by the product owner's verdict of 2026-09-28: offline, a player's phone shows no called numbers)
Phase: Phase 2 (phone tickets)
Given Riya holds ticket 3
When Riya's view of the game is shown
Then it contains ticket 3 and Riya's own marks
And it contains no other ticket's numbers and no called numbers (offline, the phone cannot know them; see TAM-133)

## TAM-051: A player never sees upcoming numbers
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
For every point in every game
Then no player's view contains any number that has not been called yet

## TAM-052: The draw seed never leaves the host phone
Status: approved, owner, 2026-09-28
Phase: Phase 1a
For every QR code, share link, printed ticket and player view
Then none of them contains the draw seed, or anything the draw order can be worked out from

## TAM-053: A player's QR code carries only their own ticket
Status: approved, owner, 2026-09-30 (reworded on the owner's decision of 2026-09-30, docs/decisions.md, to match TAM-170 and TAM-172; was approved 2026-09-29)
Phase: Phase 2 (phone tickets)
When the host shows the join QR for ticket 3
Then the QR holds exactly: ticket 3's 15 numbers and layout, its ticket number, the game code, the player's
name (TAM-172), the game's start time and its prize list (TAM-170), and nothing else
And no seed of any kind, and no other ticket's numbers or called numbers (TAM-054)
(A seed would let a curious phone rebuild the other tickets on the same sheet of 6.)

## TAM-054: One ticket reveals nothing useful about other tickets or the draw
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given a player has ticket 3's QR or code
Then they cannot work out any other ticket's numbers or the draw order from it
(They can only tell that the other 5 tickets on their sheet don't contain their own numbers, which gives no advantage.)

## TAM-055: A ticket on a player's phone matches the host's copy
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given a player scanned the QR for ticket 3, with no internet
When their phone shows the ticket
Then it is identical to ticket 3 on the host phone

## TAM-056: The host can see all tickets
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
When the host checks a claim
Then the host phone can show any ticket in the game
(Only the host has this view.)

## TAM-057: A phone ticket works with no internet
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given a player opened the app link once before, and now has no internet
When they scan their ticket QR
Then their ticket appears and they can mark it
And nothing is fetched from a server: everything the ticket needs is inside the QR link

## TAM-058: Paper and phone tickets can be mixed in one game
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given 6 players use phone tickets and 2 use paper tickets from a book
When claims are made
Then phone-ticket claims are checked by the host phone, by scanning the claim QR (TAM-177) or entering the ticket number (TAM-174)
And paper-ticket wins are checked by the anchor and recorded by the host (TAM-037)
And a player can switch from phone to paper mid-game
(Changed by the tester on 2026-09-28 to fit the change request: paper claims were checked by the numbers read out.)

## TAM-131: Players mark their own phone ticket, and can unmark
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
When a player taps a number on their phone ticket
Then it shows as marked (fill and mark); tapping again unmarks it; nothing asks for confirmation
And marks stay on the player's phone and never affect claim checks (TAM-035)

## TAM-132: The host sees which tickets have been handed out
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
While handing out phone tickets
When a player has scanned and the host taps "Next ticket"
Then the host screen shows "7 of 10 handed out" and which tickets are still waiting
(With no internet, the host phone cannot know that a scan worked, so the host confirms each hand-out.)

## TAM-133: A player's phone can show the last calls
Status: draft (moved to Phase 6 by the product owner, 2026-09-28: offline, a player's phone cannot know the calls; not reviewed for approval)
Phase: Phase 6 (connected mode)
Given a player cannot see the host screen
When they open "Last calls" on their phone ticket
Then the last 3 calls are shown, and nothing that has not been called
(Moved from Phase 2 on 2026-09-28: with no connection, the player's phone has no way to learn the calls.
Players who cannot see the host screen rely on the anchor's voice, as with paper.)

## TAM-170: A phone ticket shows its game
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
When a player's ticket is shown on their phone
Then it shows the ticket number, the game code and start time, and the prize tiers for that game
And the host screen shows the same game code, so a ticket from an earlier game is easy to spot

## TAM-171: A phone ticket survives locks and reloads
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given a player's phone shows ticket 3 with 9 numbers marked
When the phone locks, the browser reloads, or the player switches apps and comes back
Then ticket 3 is still there with the same 9 marks
And it stays until the player scans a ticket for a new game

## TAM-172: Each phone ticket is handed to a named player
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given the players and their tickets per player were set at setup (PLT-024, TAM-045)
When the host hands out tickets
Then the host screen shows the next ticket already assigned: "Ticket 3 → Riya (1 of 2)"
And the host can pick a different player from the list before showing the QR
And the QR carries that player's name, so their phone shows "Riya, ticket 3"
And the host phone keeps the record of which ticket belongs to whom; it is the only record

## TAM-173: All of a player's tickets are visible together
Status: approved, owner, 2026-09-29 (Phase 2 sign-off; replaced by docs/games/tambola/changes-2026-09-29-phone-tickets.md; was approved 2026-09-28 as "A player with several tickets keeps them on one phone")
Phase: Phase 2 (phone tickets)
Given Riya has 3 tickets on her phone
Then on a 390 × 844 screen in portrait, all 3 are shown at once, stacked, with no scrolling, each with its own marks
And in landscape, two sit side by side and the third below, with no scrolling
And turning the phone keeps every mark

## TAM-174: A phone-ticket claim credits the ticket's owner automatically
Status: approved, owner, 2026-09-28 (changed by the change request: entering the number is the fallback to scanning)
Phase: Phase 2 (phone tickets)
When the host checks a claim by scanning the claim QR (TAM-177), or, when scanning fails, by entering ticket 3 by hand
Then the verdict shows the owner ("Top Line: ✓ Accepted, ₹60 to Riya")
And the prize is credited to Riya, with no need to pick the player (unlike paper tickets, TAM-039)

## TAM-175: The host can correct who holds a ticket
Status: approved, owner, 2026-09-30 (refusal added on the owner's decision of 2026-09-30, docs/decisions.md; was approved 2026-09-28)
Phase: Phase 2 (phone tickets)
Given ticket 3 was assigned to Riya by mistake and Arjun has it
When the host changes ticket 3's owner to Arjun
Then any prize ticket 3 wins from then on, and any it already won, is credited to Arjun
And the change is recorded in the game's history (so a replay shows it)
And Arjun's phone still shows "Riya" on the ticket until he rescans; that label is only a display
Wrong input: giving a player a ticket they already hold is refused politely, "Ticket 1 is already Riya's", and nothing changes

## TAM-176: Tickets that were never handed out are not in the game
Status: approved, owner, 2026-09-28
Phase: Phase 2 (phone tickets)
Given the host made a sheet of 6 but handed out only 4 tickets
Then the other 2 tickets are not in play, count for nothing in the pot, and any claim on them is refused (TAM-032)

## TAM-177: A phone-ticket claim is verified by scanning the player's claim QR
Status: approved, owner, 2026-09-30 (typed-code prizes noted on the owner's decision of 2026-09-30; was approved 2026-09-28, change request)
Phase: Phase 2 (phone tickets)
Given Riya holds ticket 3 on her phone
When she shouts "Top Line!" and taps "Show claim" on her phone, picking Top Line
Then her phone shows a claim QR carrying her ticket number, the game code and the prize claimed
When the host taps "Scan a claim" and points the host phone at it
Then the verdict appears within 2 seconds, with no internet: "Top Line: ✓ Accepted, ₹50 to Riya"
or "✗ Bogey: 72 not called"
And the host phone checks the ticket against its own copy (TAM-055), so an edited QR is refused
And a ticket opened only by typed code (TAM-117) offers every usual prize under "Show claim"; if the player picks a
prize this game doesn't have, the host's scan refuses it calmly with a plain reason, never as a bogey (owner decision 2026-09-30)
(TAM-060 still holds: the player shouts first; the QR only replaces typing, not the shout.)

## TAM-178: When scanning fails, typing the ticket number takes over
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given the host taps "Scan a claim"
When the phone has no camera, the camera permission is refused, or no claim QR is read within 10 seconds
Then the host sees "Enter the ticket number instead" one tap away, with the prize already picked
And the verdict is exactly the same as a scan would give (TAM-174)
And the claim is judged on the numbers called when the host scans or enters it (TAM-036), so waiting for the
camera never makes a claim late by itself; "Next number" is not needed to try again

## TAM-179: A claim QR that does not belong to this game is refused, calmly
Status: approved, owner, 2026-09-29 (Phase 2 sign-off; changed by the product owner's verdict of 2026-09-28: a mismatched claim QR is refused, never a bogey, and the host can check by ticket number)
Phase: Phase 2 (phone tickets)
When the host scans a claim QR
Then it is refused with a plain reason, and nothing in the game changes, when:
- it is from another game (a different game code): "This claim is for another game (code 7K3P)"
- its ticket was never handed out in this game (TAM-176): "Ticket 5 is not in this game"
- its ticket is out after a bogey (TAM-044): "Ticket 3 is out"
- the prize is closed or already won (TAM-030): "Top Line already won"
- it does not match the host's copy of the ticket (edited or damaged): "This claim doesn't match ticket 3"
And none of these counts as a bogey
And when a claim QR doesn't match the host's copy, the host is offered "Check ticket 3 by number", which gives the verdict from the host's own copy (TAM-174).

## TAM-190: A player with several tickets picks the ticket to claim with
Status: approved, owner, 2026-09-29 (Phase 2 sign-off, with the product owner's verdict of 2026-09-28)
Phase: Phase 2 (phone tickets)
Given Riya has tickets 3 and 8 on her phone (TAM-173)
When she taps "Show claim"
Then she picks the ticket as well as the prize, and the claim QR carries only that ticket
And a tie on her own two tickets is two claims, scanned one after the other (TAM-041, TAM-145 "Add another winner")

## TAM-191: The player can switch between all tickets and one at a time
Status: approved, owner, 2026-09-30 (42 px portrait fit added on the owner's decision of 2026-09-30); was approved, owner, 2026-09-29 (new with the Phase 2 sign-off: docs/games/tambola/changes-2026-09-29-phone-tickets.md)
Phase: Phase 2 (phone tickets)
Given Riya has 3 tickets
When she taps "One at a time"
Then one ticket fills the screen, with tabs "Ticket 3 · 4 · 8" to switch
And on a 390 px portrait screen the whole ticket fits, cells at least 42 CSS px, with no sideways sliding (TAM-122)
When she taps "All tickets"
Then all 3 show again (TAM-173)
And her choice is remembered on her phone for the next game

## TAM-192: Quick mark: tap the number you heard
Status: approved, owner, 2026-09-29 (new with the Phase 2 sign-off: docs/games/tambola/changes-2026-09-29-phone-tickets.md; thumbnails of all tickets, owner decision 2026-09-29)
Phase: Phase 2 (phone tickets)
Given Riya has tickets 3, 4 and 8
When she opens "Quick mark" and taps 36
Then 36 is marked on the ticket that has it, and she sees "✓ 36 marked on ticket 3"
When she taps 37, which is on none of her tickets
Then nothing is marked, and she sees "37: not on your tickets"
When she taps 36 again
Then it is unmarked
And all the player's tickets are shown under the pad as small thumbnails: numbers may be too small to
read, but every marked cell is clearly filled, so each tap is seen landing on its ticket
When she taps a thumbnail
Then that ticket opens full size ("One at a time", TAM-191), and "Back" returns to quick mark
And quick mark never shows which numbers were called; the player still listens to the anchor (TAM-050)

## TAM-193: The claim screen shows the ticket, with the claimed pattern outlined
Status: approved, owner, 2026-09-29 (new with the Phase 2 sign-off: docs/games/tambola/changes-2026-09-29-phone-tickets.md)
Phase: Phase 2 (phone tickets)
When Riya taps "Show claim", picks ticket 3 and Top Line
Then the claim QR is shown above ticket 3, and ticket 3's top row is outlined
(Four Corners outlines the four corner numbers; Full House the whole ticket; Early Five nothing)
And the outline is a visual aid only: the phone never says whether the claim is right (the host's scan does, TAM-177)

## TAM-194: A player's tickets come from one sheet where possible
Status: approved, owner, 2026-09-30 (clarified on the owner's decision of 2026-09-30, docs/decisions.md: strictly in order; was approved 2026-09-29)
Phase: Phase 2 (phone tickets)
Given the host hands out tickets strictly in order from sheets of 6 (TAM-172)
Then each player's tickets are consecutive: with Riya 2, Asha 3, Dad 1 and Kabir 3 tickets, Riya gets 1–2,
Asha 3–5, Dad 6 and Kabir 7–9
And a player's tickets are on the same sheet whenever the current sheet has enough left
So a called number is on at most one of that player's tickets (TAM-006)
When the current sheet has too few left (Asha, with 3 tickets, after 4 are handed out)
Then her tickets span two sheets (5 and 6 on the first, 7 on the next); no ticket is skipped to start a fresh sheet
And quick mark (TAM-192) marks every one of her tickets that has the number

## TAM-195: The phone points out when the player's own marks fill a pattern
Status: approved, owner, 2026-09-29 (new with the Phase 2 sign-off: docs/games/tambola/changes-2026-09-29-phone-tickets.md)
Phase: Phase 2 (phone tickets)
Given the game's prizes include Top Line
When Riya's marks cover every number in ticket 3's top row
Then that row is outlined on her tickets (on the ticket screen and under the quick-mark pad), and she sees
"Your marks fill the top row of ticket 3. Shout if it's right!"
And the same for any prize in this game: 5 marks on a ticket (Early Five), a full row (a Line), the four
corners (Four Corners), every number (Full House)
And the cue is based only on her own marks: it never says the claim is right, never claims for her, and
goes away if she unmarks a number
And it never mentions a prize this game doesn't have

## TAM-196: Players can cross out prizes that are gone; the host's scan catches the rest
Status: approved, owner, 2026-09-29 (new with the Phase 2 sign-off: docs/games/tambola/changes-2026-09-29-phone-tickets.md; replaces "every prize stays selectable")
Phase: Phase 2 (phone tickets)
When the anchor announces that Top Line has been won
Then Riya can tap Top Line in her phone's prize list to cross it out (tap again to undo)
And a crossed-out prize is shown greyed with "won" and cannot be picked in "Show claim"
And every prize she has not crossed out stays selectable, because her phone cannot know what has been won
And if she claims a prize that is gone, the host's scan refuses it calmly: "Top Line already won", not a bogey (TAM-179)
(In connected mode, later, won prizes will be crossed out automatically: TAM-211, Phase 6.)
