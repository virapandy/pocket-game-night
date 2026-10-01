# UX review: host or player, paper or phone, and which button looks most important (1 October 2026)

Owner's observations, checked live by the **UX designer** (390 × 844) and decided with the **product owner**.
1. The home screen doesn't say whether you are **hosting** or **joining as a player**.
2. On the ticket-type step, **paper tickets** is the bright main button, so **phone tickets** looks second class.
3. Check which action *looks* most important on every screen against which one *is* the next step.

## What we found
- **Home:** the loudest things are two red "Tap to resume" buttons; "Tambola" is a plain card that doesn't look
  tappable; joining is a small outlined "Enter ticket code" styled like Sessions and History; the subtitle "One phone
  runs it" speaks only to the host. A guest opening the link lands on the host's screen. "You're ready for game
  night" (TAM-057) isn't shown. Scanning a ticket QR with the camera opens straight onto the ticket (good).
- **Ticket type:** paper is the full-width red button in the bottom thumb spot where "Next" always is; phone is an
  outlined button mid-screen. The Tambola start screen still says "Housie with paper tickets".
- **Root cause:** the app has two button looks, solid red (main) and red outline (quiet). "Chosen option" borrows the
  solid red, and some screens give solid red to the wrong action.

## Decided (product owner with UX designer, from the owner's observations)
### A new rule for every game (added to `docs/ux-guidelines.md`, rule 17a)
**One solid main button per screen, and it is always the next step.** A chosen option is shown with an outline, a ✓
and a light tint, never with the main-button look. Choices between equals look equal. Destructive actions are never
the main button.

### Home screen
```
┌──────────────────────────────┐
│ Pocket Game Night        ⋯   │  menu: Sessions, History, Report a problem, Settings
│ (first visit) ✓ You're ready for game night │
│ ┌──────────────────────────┐ │
│ │  HOST A GAME             │ │  two equal cards, same size and weight
│ │  Run Tambola on this phone│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │  JOIN WITH MY TICKET     │ │  → "Scan the host's QR with your camera" + "Type the code"
│ │  Got a QR from the host? │ │
│ └──────────────────────────┘ │
│ Your tickets · Game D6BE   › │  only if this phone holds tickets
│ Unfinished games             │
│  Tambola 11:17 · 30 called › │  plain rows with an outlined "Resume", not red
└──────────────────────────────┘
```
### Paper or phone tickets
Two **equal cards**, each with its one-line explanation inside it, **neither chosen in advance**; the host taps one
and then the usual bottom button "Next". Paper: "Always works. Print or bring tickets." Phone: "Each player gets
their ticket on their phone. Everyone must have opened the link once." The start screen line becomes "Housie on
paper or on phones".

### Other screens (ranked; owner sees the result on the preview)
| Screen | Loudest now | Becomes | Severity |
|---|---|---|---|
| Claim scan, typed fallback | the chosen prize looks like the "Check" button | chosen prize = outline + ✓; "Check" the only solid button, active once ticket and prize are filled | slows |
| Claim scan | "Enter ticket number" shows while its form is already open | hidden while open | slows |
| Hand-out | "Next ticket" half width mid-screen, next to "Can't scan?" | full width at the bottom; "Can't scan? Give a paper ticket" as a link above it (TAM-181) | slows |
| Calling | black "Called 60 · Undo" bar tight above "Scan a claim" | lighter bar, more space between (guideline 14) | slows |
| End game question | "End game" solid red on the left | "Keep playing" is the main button; "End game" outlined (guideline 15) | slows |
| Payouts | "Play again" solid at the bottom; settling small mid-screen | "Settle with host" / "Settle with players" reachable without scrolling (handover step 2); "Play again" outlined | slows |
| Player "Which prize?" | "Cancel" looks like a prize | "Cancel" as a link | slows |
| Quick mark | "Back" takes the bottom spot; no "Show claim" | "Show claim" at the bottom; "Back" at the top; marked numbers filled with ✓ (several-tickets review) | slows |
| Show claim QR | "Done" solid under the QR | "Done" outlined, so the QR stands out | polish |
| Hand-out | "Waiting: Player 1 1" | "Waiting: Player 1 (1 ticket)" | polish |
| Tambola start | "New game" mid-screen | at the bottom like every step | polish |
| Prizes | "Remove" in main-action red | neutral grey | polish |

Kept as is: "Show claim" stays the player's main button during the game; the 20-character typed code stays (owner,
30 September).

## Scenario changes for the tester
- **New, home (PLT):** "Given the app opens with no game running on this phone, then Home shows two equal choices,
  'Host a game' and 'Join with my ticket', above any unfinished games; 'Join with my ticket' leads to scanning with
  the camera or typing the code." Plus TAM-057's "You're ready for game night" on a first visit.
- **New, ticket type (TAM, near TAM-058):** "Paper and phone tickets are two equal choices, neither chosen in
  advance; 'Next' works once one is chosen."
- **New, platform rule:** "Every screen has at most one main-style button, and a chosen option never uses it" (a
  browser check across screens).
- TAM-103/TAM-124 (end game question: "Keep playing" is the main button), TAM-181 (hand-out button), TAM-178 (claim
  scan fallback), TAM-177 ("Which prize?" cancel), TAM-192 (quick mark bottom button).
