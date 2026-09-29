# Phase 2 additions: several tickets on one phone (owner, 29 September 2026)

Owner-approved with the Phase 2 sign-off. For the tester to apply in `specs/tambola/` (Phase 2) before
writing the Phase 2 tests. Design: `docs/games/tambola/ux-phone-tickets.md`, section 2a.

**Change TAM-173** to:
> ## TAM-173: All of a player's tickets are visible together
> Given Riya has 3 tickets on her phone
> Then on a 390 × 844 screen in portrait, all 3 are shown at once, stacked, with no scrolling, each with its own marks
> And in landscape, two sit side by side and the third below, with no scrolling
> And turning the phone keeps every mark

**Change TAM-122** to:
> ## TAM-122: Tickets work in both orientations
> When a player opens their phone tickets
> Then they follow the phone's orientation (TAM-173); nothing forces landscape
> And ticket cells are at least 40 CSS px with all tickets shown, and at least 44 CSS px in "One at a time"

**New TAM-191** (Phase 2):
> ## TAM-191: The player can switch between all tickets and one at a time
> Given Riya has 3 tickets
> When she taps "One at a time"
> Then one ticket fills the screen, with tabs "Ticket 3 · 4 · 8" to switch
> When she taps "All tickets"
> Then all 3 show again (TAM-173)
> And her choice is remembered on her phone for the next game

**New TAM-192** (Phase 2):
> ## TAM-192: Quick mark: tap the number you heard
> Given Riya has tickets 3, 4 and 8
> When she opens "Quick mark" and taps 36
> Then 36 is marked on the ticket that has it, and she sees "✓ 36 marked on ticket 3"
> When she taps 37, which is on none of her tickets
> Then nothing is marked, and she sees "37: not on your tickets"
> When she taps 36 again
> Then it is unmarked
> And the player's tickets, with their marks, are shown under the pad, so each tap is seen landing on its ticket
> And quick mark never shows which numbers were called; the player still listens to the anchor (TAM-050)

**New TAM-193** (Phase 2):
> ## TAM-193: The claim screen shows the ticket, with the claimed pattern outlined
> When Riya taps "Show claim", picks ticket 3 and Top Line
> Then the claim QR is shown above ticket 3, and ticket 3's top row is outlined
> (Four Corners outlines the four corner numbers; Full House the whole ticket; Early Five nothing)
> And the outline is a visual aid only: the phone never says whether the claim is right (the host's scan does, TAM-177)

**New TAM-194** (Phase 2):
> ## TAM-194: A player's tickets come from one sheet where possible
> Given the host hands out tickets in order (TAM-172)
> Then a player's tickets are consecutive tickets from the same sheet of 6 whenever the sheet has enough left
> So a called number is on at most one of that player's tickets (TAM-006)
> When a player's tickets must span two sheets
> Then quick mark (TAM-192) marks every one of their tickets that has the number

**New TAM-195** (Phase 2; owner, 29 September: yes):
> ## TAM-195: The phone points out when the player's own marks fill a pattern
> Given the game's prizes include Top Line
> When Riya's marks cover every number in ticket 3's top row
> Then that row is outlined on her tickets (on the ticket screen and under the quick-mark pad), and she sees
> "Your marks fill the top row of ticket 3. Shout if it's right!"
> And the same for any prize in this game: 5 marks on a ticket (Early Five), a full row (a Line), the four
> corners (Four Corners), every number (Full House)
> And the cue is based only on her own marks: it never says the claim is right, never claims for her, and
> goes away if she unmarks a number
> And it never mentions a prize this game doesn't have

**New TAM-196** (Phase 2; owner, 29 September: keep it simple):
> ## TAM-196: Every prize stays selectable when claiming
> When Riya taps "Show claim"
> Then every prize in this game can be picked, including prizes already won or closed, because her phone
> cannot know (it has no connection to the host)
> And if she claims a prize that is gone, the host's scan refuses it calmly: "Top Line already won", not a bogey (TAM-179)
> (Disabling won prizes automatically would need connected mode, Phase 6, on hold.)

**Carry-over:** TAM-190 ("picks the ticket to claim with") is unchanged; with layout D the chosen ticket is shown.
