# Change request from the family play-test (owner, 30 September 2026)

The owner ran the family play-test on Android with Phase 1b live. For the orchestrator: the tester applies
these scenario changes and checks, then the coder builds. Everything here is owner-approved.

## 1. Closing a prize must be obvious (owner: "not very evident; make it more prominent")
Today, after a win is recorded, "Next number" turns grey ("Close Top Line first") and the real Close button is
small, on the win card and the prize chip. At the table, the host didn't see what to do next.

**New TAM-198** (Phase 1a behaviour, fix now):
> ## TAM-198: After a win, closing the prize is the main action
> Given a win for Top Line has just been recorded (TAM-037)
> Then the big button at the bottom, where "Next number" is, becomes **"Close Top Line"**: filled, enabled,
> the same size and place (TAM-100)
> And "Add another winner" sits just above it, as a secondary button (TAM-145)
> And the rest of the calling screen is dimmed, except the win card, the number and these two buttons
> When the host taps anywhere in the dimmed area
> Then nothing happens there, and the "Close Top Line" button pulses once (never a repeating blink or flash)
> When the host taps "Close Top Line"
> Then the prize closes, the screen is no longer dimmed, and the button is "Next number" again
> And "Undo win" stays available on the win card until the prize is closed (TAM-070)

**Change TAM-145:** replace "Next number waits until the host closes Top Line" with "the main button becomes
'Close Top Line' until the host closes it (TAM-198)". The Close button on the prize chip may stay as a second way.

## 2. Seeing and changing the session (owner-approved, 30 September)
Only the first game of a gathering asks for a session name; later games within 3 hours join it silently
(PLT-016). The host can't see which session a game joins, or start a new one within those 3 hours.

**New PLT-029** (Phase 1b, owner-approved):
> ## PLT-029: The session is shown, and can be changed, before the game starts
> On the last setup step, above "Confirm prizes", one line shows "Session: Tuesday 29 Sep · Change"
> When the host taps "Change"
> Then they can start a new session (with a suggested name) or pick one of the recent unsettled sessions
> And with no change, the game joins the session shown, as today (PLT-016)
