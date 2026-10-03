# What happens to players' tickets after a game (3 October 2026)

Owner's question: what happens to player tickets when the host ends or discards a game, or when prizes are won?
Product owner answer from the specs and code, owner's choice ("all four"), details by the **UX designer**, decided by
the **product owner**.

## Today
Phone tickets work offline, so a player's phone never hears from the host after the QR. A won prize changes nothing
on the phone (the player crosses it out by hand, TAM-196; the host's scan refuses it calmly, TAM-179). After End or
Discard the ticket stays, marks and all, and the app opens straight into it the next day. Only a new game's ticket
replaces it (TAM-171). A claim QR from an old game gets "This claim is for another game".

## Decided (owner chose all four, 3 October; details product owner with UX designer)
1. **"Done with this game…"** is the last item in the player's menu, after a divider. Confirmation: "Clear your tickets
   from this phone?", "Tickets 1 · 2 · Game 7K3P. Your marks go too. Do this when the host says the game is over.",
   buttons **"Keep my tickets"** (main) and **"Clear tickets"** (outlined). A confirmation, not Undo: it's rare, can't be
   undone, and a stray tap mid-game would wipe the marks. Then Home. Held tickets are named ("and Grandma's ticket 3")
   and cleared too.
2. **Tickets more than 6 hours old open on Home, not the ticket.** The row sits below the two cards, where "Your
   tickets ›" is today: "Your tickets from 7:30 pm" (same day), "…from yesterday, 9:15 pm", "…from Sat 28 Sep", with
   quiet **Open** and **Clear** (Clear asks as in 1). The time is the game's start time from the QR; a typed code has
   none, so the phone saves when the ticket was added. Older saved tickets with neither still get the row.
3. **"Game over" on the host's summary**, as a banner at the top so payouts stay visible: after End, "✓ Game over ·
   Players: phones away. Tap Done with this game."; after Discard, "Game over · Discarded · Nobody wins. Everyone gets
   their contribution back." It stays until the host leaves the screen; nothing timed.
4. **A claim from an old game** is refused calmly (ⓘ, never ✗ or Bogey), looked up in History: "That game has ended
   (game 7K3P, 9:15 pm). This claim doesn't count." / "That game was discarded (game 7K3P). This claim doesn't count." /
   unknown or deleted from History: "This claim is for another game (code 7K3P)" as today. "Close" is the main button.
- A new game's ticket still replaces the old ones without asking, with one quiet line on the new ticket: "Your tickets
  from game 7K3P were cleared."
- Connected mode (on hold) would later cross out prizes and end the game on players' phones automatically.

## Scenario changes for the tester
- **TAM-171:** tickets stay until the player taps "Done with this game", clears them from Home, or adds a ticket from a
  new game (with the "were cleared" line); a ticket remembers its game's start time, or when it was added.
- **New (player):** "Done with this game" with the confirmation above, including held tickets (TAM-214).
- **New (PLT-300 Home):** tickets more than 6 hours old open on Home with the dated row, Open and Clear.
- **New (TAM-140 / PLT-005):** the "Game over" banner after End and after Discard, payouts still visible.
- **TAM-179:** claims from an ended or a discarded game get their own calm wording; unknown games as today.
