# Tambola user journeys

Draft, 28 September 2026. House rules use the **norms** from `docs/tambola-guide.md` until the owner
decides: six patterns, ties shared, claims before the next number, 1–3 tickets per player.

## Who is involved
| Person | Role |
|---|---|
| **Host** | Holds the host phone, sets up the game, enters and checks claims. Often also the anchor. |
| **Anchor** | Reads each number and rhyme aloud. Can be the host or someone with a big voice. |
| **Player** | Has one to three tickets, marks numbers, shouts claims. May have never played. |

## The three ways to play
| Mode | Tickets | Player needs | Internet | Phase |
|---|---|---|---|---|
| **A. Caller only** | The group's own ticket book (bought from a shop, or old tickets) | Pen | None | 1 |
| **B. App tickets on paper** | Made by the app, then printed or shared as images | Pen and paper, or the image | None for the host; images are shared on WhatsApp beforehand or on the spot | 1 |
| **C. Tickets on phones** | Made by the app, scanned by each player from a QR on the host phone | Their own phone | None, if players opened the app link once before | 2 |

Every mode uses the same host flow for calling. They differ in how tickets reach players and how
the host checks a claim. A game can always drop from C to B (a player's phone dies: show or print
their ticket) and from B to A.

---

## Mode A: Caller only, with the group's own ticket book

**When it fits:** the family already has a Tambola ticket book; they just need a fair caller, the
rhymes, and a board of called numbers.

### Host journey
| Stage | Host does | Host phone shows | Target |
|---|---|---|---|
| Start | Opens the app, taps **Tambola → Play with your own tickets** | Pattern list with the six defaults ticked, prize labels (optional) | Under 30 s to the first number |
| Set up | Keeps the defaults or unticks a pattern; types prizes if wanted | "Ready. Tap to call the first number" | |
| Call | Taps **Next number**; the anchor reads it aloud | The number, huge, with its rhyme; the last five calls | One tap per number |
| Repeat | A player asks "what was that?"; taps **Repeat** | The same number and rhyme again | |
| Claim | A player shouts "Top Line!"; host taps **Check a claim**, picks Top Line, and types the 5 numbers the player reads out from their row | Each typed number in green (called) or red (not called), then **Accepted** or **Bogey** | Under 20 s per check |
| Tie | A second player shouts the same pattern before the next number | Both checked; both accepted; "Shared" | |
| Mistake | Host accepted a claim by mistake; taps **Undo** | The claim removed; the pattern open again | |
| End | Full House accepted | Summary: each pattern, winner's name (typed or skipped), numbers called | |

### Player journey
| Stage | Player does | What they see or hear |
|---|---|---|
| Before | Takes one to three tickets from the book | Their paper tickets |
| During | Listens to the anchor; crosses off numbers | The anchor's call and rhyme; can ask for a repeat |
| Claim | Shouts the pattern, then reads their numbers aloud to the host | The host phone turned towards the room: green and red numbers, then the verdict |
| After | Cheers or groans | The summary on the host phone |

**Limit:** the app cannot see these tickets, so the host types the numbers for each claim. It
cannot check that the ticket itself is valid, only that the numbers read out were called.

---

## Mode B: App tickets on paper or as images

**When it fits:** no ticket book, a printer or WhatsApp available, or the host wants the app to
check claims just from a ticket number.

### Host journey
| Stage | Host does | Host phone shows | Target |
|---|---|---|---|
| Before (optional) | The day before: taps **Tambola → Make tickets**, sets the number of players | Sheets of 6 tickets, each with a ticket number and game code | |
| Hand out | Prints sheets, or shares each ticket image in the family WhatsApp group, one per person; writes names next to ticket numbers (optional) | A share button per ticket; "Ticket 4 shared" | Under 2 min for 10 players |
| Start | On the day, opens the saved game, taps **Start** | "Ready. Tap to call the first number" | Under 30 s |
| Call, Repeat | As in mode A | As in mode A | |
| Claim | Player shouts; host taps **Check a claim**, enters **ticket number 4** and picks **Top Line** | Ticket 4 drawn large with called numbers highlighted; **Accepted** or **Bogey**, and which number was missing | Under 10 s per check |
| Late claim | Player claims after the next number was called | "Bogey: too late. Top Line was complete at 45" | |
| Tie, Undo, End | As in mode A | As in mode A, with ticket numbers and names | |

### Player journey
| Stage | Player does | What they see |
|---|---|---|
| Before | Gets a printed ticket, or opens the image on WhatsApp | One ticket with its number, e.g. "Ticket 4, game ABCD" |
| During | Marks with a pen (on an image: watches, or copies it to paper) | Their ticket; the anchor's call |
| Claim | Shouts the pattern and their ticket number | Their ticket on the host phone, called numbers lit up, then the verdict |
| After | | The summary with names |

**Limit:** a ticket shared as an image is awkward to mark on screen; paper is best. Mode C fixes this.

---

## Mode C: Tickets on players' phones (Phase 2)

**When it fits:** everyone has a phone and would rather not print. Still no internet during play.

### Host journey
| Stage | Host does | Host phone shows | Target |
|---|---|---|---|
| Before (recommended) | Shares the app link in the family group: "open this once before Sunday" | | |
| Set up | Taps **Tambola → Tickets on phones**, sets the number of players | A QR code per ticket and a counter "3 of 10 joined" | |
| Hand out | Shows the QR to each player in turn, or puts the phone in the middle | The next ticket's QR after each scan | About 5 s per player |
| Fallback | A player without the app, or with a flat phone, gets a printed or shared ticket (mode B) | That ticket's image or print | |
| Start | Taps **Start** once everyone has a ticket | "Ready" | Under 60 s from set-up to the first number for 10 players |
| Call, Repeat | As in mode A | As in mode A | |
| Claim | Player shouts; host enters their ticket number and pattern | As in mode B | Under 10 s |
| Tie, Undo, End | As in mode B | As in mode B | |

### Player journey
| Stage | Player does | What they see on their phone |
|---|---|---|
| Before | Opens the shared link once, with internet | "You're ready for game night" |
| Join | Scans the host's QR with their camera | Their own ticket, ticket number, and their name if the host added one |
| During | Listens to the anchor; **taps** numbers to mark them (default: no auto-marking) | Their ticket with marked numbers; tapping a marked number unmarks it |
| Claim | Shouts; tells the host their ticket number | Their own phone does nothing by default (no Claim button); the verdict is on the host phone |
| Phone dies | Tells the host | The host shows or prints their ticket (mode B); they carry on with pen or by watching |
| After | | Their ticket stays on the phone until the next game starts |

**Privacy:** a player's phone holds only their own ticket. It cannot show other tickets or upcoming
numbers (TAM-050 to TAM-055).

---

## Moments every mode must handle
| Moment | Expected behaviour |
|---|---|
| A player arrives late | The host hands them a new ticket mid-game, and they catch up from the board of called numbers. **Open question for the owner:** do numbers called before they joined count towards their claims, including Early Five straight away? |
| The host phone locks or the app closes | The game resumes exactly where it was |
| A first-timer doesn't know the rules | **How to play** on the start screen: the one-page guide with a sample ticket |
| Nobody wants to anchor | The host turns on **Phone speaks the call**, after a one-time warning |
| The game drags | The host can end early; the summary shows the winners so far |
| Another round | **Play again** keeps the players, patterns and prizes, with new tickets and a new draw |

---

## Gaps found against the scenarios
These journeys need behaviour the 67 scenarios don't cover yet. Proposed additions:

| Proposed | Scenario |
|---|---|
| TAM-037 | Mode A: the host checks a claim by typing the numbers read out; each is shown as called or not, and the verdict follows the pattern's rules |
| TAM-038 | A late claim shows which number completed the pattern ("Top Line was complete at 45") |
| TAM-057 | Mode C: a player's QR works with no internet, if the app was opened once before |
| TAM-058 | Mode C: a player can switch to a printed or shared ticket mid-game, and it matches the ticket on their phone |
| TAM-067 | A late joiner gets a new ticket mid-game, and claims are checked by the owner's rule on numbers called before they joined |
| TAM-068 | **Play again** keeps players, patterns and prizes, with new tickets and a new draw seed |
| TAM-069 | **How to play** is reachable from the start screen, and works offline |
| TAM-079 | A game set up the day before (mode B) can be reopened and started on the day with the same tickets |
