# Owner decisions

| Date | Decision | Basis |
|---|---|---|
| 2026-09-28 | First game: Tambola. | Owner |
| 2026-09-28 | Code only in Claude Code inside VS Code; testing only in the Claude desktop app. (Widened below.) | Owner |
| 2026-09-28 | One chat can run the whole loop: Claude Code opened in the workspace folder is the orchestrator and hands work to a `coder` subagent (Build clone only) and a `tester` subagent (Test clone only); the role guard enforces it. The desktop app stays a valid Test workspace. Rejected: a test-writer that writes tests after the code, and a hook that runs tests whenever Claude stops, because tests must come from approved scenarios before code. | Owner |
| 2026-09-28 | Repository public at github.com/virapandy/pocket-game-night; commits as virapandy@gmail.com. | Owner |
| 2026-09-28 | Ticket modes: paper tickets (own ticket book) or tickets on phones; no printed or shared ticket images. | Owner |
| 2026-09-28 | Money: contributions form a pot; the app suggests tiers and split, the anchor confirms, the app shows payouts but never moves money. | Owner |
| 2026-09-28 | Prize amounts always add up to the pot exactly; individual tiers are adjusted as needed. | Owner |
| 2026-09-28 | Tiers suggested from the number of tickets; the host can remove any tier except Full House and add it back. | Owner |
| 2026-09-28 | Ties on the same number share the prize. | Convention |
| 2026-09-28 | Claims must come before the next number; a late claim is a bogey. | Convention |
| 2026-09-28 | Bogey: the ticket is out (default); host setting "carry on" for gentle games. | Convention |
| 2026-09-28 | 1 to 3 tickets per player, default 1; phone tickets handed out from sheets of 6. | Convention |
| 2026-09-28 | Late joiners until 10 numbers called; called numbers count; a pattern already complete on joining can't be claimed; their contribution is split across the tiers not yet won, rounded. | Convention + owner |
| 2026-09-28 | No roll-over: an unclaimed tier is spread across the tiers won in the same game. | Owner |
| 2026-09-28 | The game ends when the last Full House tier in play is won. | Convention |
| 2026-09-28 | Rhymes in English and Hindi first; phone voice in Indian English first. | Claude, on owner's instruction |
| 2026-09-28 | Auto-call: off by default; host sets and can change the timer at any time; one-tap pause (TAM-120). | Owner |
| 2026-09-28 | Undo last call within 5 seconds of a mis-tap (TAM-119). | Owner |
| 2026-09-28 | Several unfinished games allowed; no one-game limit unless absolutely necessary (PLT-002). | Owner |
| 2026-09-28 | Resume straight away within 12 hours, otherwise ask; never ended automatically (PLT-004). (Changed below.) | Owner |
| 2026-09-28 | Within 12 hours an unfinished game is not opened automatically: the home screen shows it with "Tap to resume" and one tap goes back in, paused. Chosen because opening it automatically clashes with PLT-002 (several unfinished games; the host picks from the home screen). After 12 hours and "never ended automatically" are unchanged (PLT-004). | Owner |
| 2026-09-28 | The three "opens with no internet" browser tests (app shell, TAM-064/TAM-114, TAM-069) run in Chromium only, because Playwright's WebKit fails offline reloads with an internal error, locally and in automation. The Test role confirms this is a WebKit limitation first, then checks offline opening by hand in the iPhone Simulator and records the result in `reports/latest.md`. Every other iPhone test still runs. | Owner |
| 2026-09-28 | No limit on history; ask before removing anything; no hand-entered games (PLT-012, PLT-015). | Owner |
| 2026-09-28 | Discard means the game is void and contributions are handed back (TAM-140). | Owner |
| 2026-09-28 | Games are grouped in named sessions; a tally covers ended, unsettled games in one session; Settle marks them done; sessions are never tallied together (PLT-016 to PLT-020). | Owner |
| 2026-09-28 | Phase 1 splits into 1a (one great game) and 1b (sessions, tally, history management, late joiners, voice and auto-call). | Owner |
| 2026-09-28 | The tally is a shared feature for any game with money; each game records what each person paid and won. | Owner |
| 2026-09-28 | Rhymes: several per number, picked at random on each call from the game's seed; host picks English, Hindi or both; family-friendly filter on by default; anchor can ask for another rhyme. | Owner + Claude |
| 2026-09-28 | Phase 1a scenarios approved (97: 83 approved drafts plus 14 already decided). | Owner |
| 2026-09-28 | Rhyme catalog approved; Indian references preferred: twice as likely to be picked (TAM-158). | Owner |
| 2026-09-28 | The anchor calls aloud by default; the phone's voice is optional, off in every new game (TAM-180). | Owner |
| 2026-09-28 | Owner approved the decisions log, the Tambola guide and the Tambola journeys. | Owner |
| 2026-09-28 | Phase 1b scenarios approved. | Owner |
| 2026-09-28 | Every game's setup captures players' names in one shared step, with suggestions from past names (PLT-024). | Owner |
| 2026-09-28 | Phone tickets are assigned to named players at hand-out; the host phone keeps who holds which ticket; claims credit the owner automatically (TAM-172 to TAM-176). | Owner direction, Claude design |
| 2026-09-28 | Games two to four, in order: Impostor, Dumb Charades, Scoreboard / Rummy scorekeeper. | Claude, on owner's instruction |
| 2026-09-28 | Hosting: GitHub Pages instead of Cloudflare Pages (no extra account). One live link, https://virapandy.github.io/pocket-game-night/, updated on every push to main, and only when every check and test is green. | Owner |
| 2026-09-28 | Winning is manual: after an accepted claim the host can add more winners, then closes the tier by hand; the next number waits until it is closed. The game ends only when the host ends it, including after the last Full House (TAM-145, TAM-075). | Owner |
| 2026-09-28 | A game with money that ends with no prize won hands every contribution back, as with Discard (TAM-144). | Owner |
| 2026-09-28 | A product owner role: Claude in the desktop app, in its own clone `pocket-game-night-product/`, owns `docs/` (guides, journeys, UX guidelines, decisions, new-game designs and scenario drafts). Rules to be baselined when the orchestrator is idle. | Owner |
| 2026-09-28 | Money of prizes nobody won goes back to the players, equally per ticket, instead of to the winners (TAM-088, TAM-144). Confirmed per ticket on 2026-09-28. | Owner |
| 2026-09-28 | Paper tickets: trust the anchor. The anchor checks the ticket in the room; the host only records the win and the player; no numbers typed (TAM-037). | Owner |
| 2026-09-28 | Phone tickets: the player's phone shows a claim QR; the host scans it to verify, offline (TAM-177); typing the ticket number is the fallback. | Owner |
| 2026-09-28 | Calling screen and setup redesign: one screen, no scrolling, number dominant (docs/games/tambola/ux-calling-screen.md). | Owner |
| 2026-09-28 | Android is the hand-checked phone; iPhone is covered by automated checks only until an iPhone joins a play-test. | Owner |
| 2026-09-28 | Order: finish Tambola completely (feedback fixes, play-test, 1b, phone tickets, feedback reports), then simulations and extended testing (Jev); new games on hold. | Owner |

| 2026-09-28 | "Report a problem" (Phase 7) sends reports to a stub for now: nothing leaves the phone. **Must be replaced with a real free, no-account destination before any wider public release** (PLT-208). | Owner |
| 2026-09-28 | Jev approved for simulations and extended testing. The key lives only in a gitignored `.env.local` on the testing machine (and later a GitHub secret); every ordinary test still passes without it (PLT-114, PLT-115). | Owner |
| 2026-09-28 | Scenario review (cc447aa) answered: outcome and every verdict in `docs/scenario-review-outcome-2026-09-28.md`. Owner signed off Phase 1a.1 and 1b; Phase 2, 7 and extended testing wait for sign-off when they come up; Phase 6 on hold. | Owner + product owner |
| 2026-09-28 | A ticket out after a bogey still gets its per-ticket share of unwon money (TAM-093). | Product owner, by convention |
| 2026-09-28 | "Next number" full width at the very bottom; "Record a win" in its own row above it, never side by side (TAM-100, TAM-124). | Product owner |
| 2026-09-28 | "Check numbers" helper kept in the menu for disputes; records nothing (TAM-139). | Product owner |
| 2026-09-28 | Offline phone tickets show no called numbers; last calls on the player's phone moves to connected mode (TAM-050, TAM-133 → Phase 6). | Product owner |
| 2026-09-28 | A claim QR that doesn't match the host's copy is refused, never a bogey; the host can check by ticket number (TAM-179). | Product owner |
| 2026-09-28 | Auto-call timer 5 to 30 seconds in 5-second steps, default 10 (TAM-186). | Product owner |
| 2026-09-28 | Tally shows net amounts; an explicit "Settle up" lists who pays whom in the fewest hand-overs, then "Mark as settled"; settling can be undone for 5 seconds (PLT-027, PLT-028). | Owner + product owner |
| 2026-09-28 | Weekly long runs report failures only; they never hold back the preview link. Mutation target: at least 80% for rules and money code (PLT-118, PLT-119). | Owner + product owner |

| 2026-09-29 | Setup, first step: tapping "Paper tickets" moves on at once; no separate "Next" on a one-choice step (TAM-181). | Claude, on owner's instruction (most user-friendly) |
| 2026-09-29 | With paper tickets the anchor judges late claims; the app's record of which number completed a pattern applies to phone tickets only (TAM-043). | Owner |
| 2026-09-29 | Landscape calling screen: the number's digits are at least 160 px tall and never smaller than in portrait (TAM-129). | Claude, on owner's instruction (most user-friendly) |
| 2026-09-29 | The undo toast never covers the prize chips either (TAM-125 change, from the product owner's review of the live 1a.1 build). | Product owner (UX) |
| 2026-09-29 | Product owner instructions for the orchestrator live in `docs/handover.md` ("Now: status and what's next"), not in chat. | Owner |
| 2026-09-29 | Phase 7 ("Report a problem", stub destination) signed off. | Owner |
| 2026-09-29 | Extended testing signed off with a weekly Jev cap of 20,000 decisions (at most about $1.70 a week); when reached, runs finish with scripted players (PLT-113). | Owner |
| 2026-09-29 | Phase 2 (phone tickets) signed off. A claim on the player's phone is fully manual: the phone checks nothing; only the host's scan decides. | Owner |
| 2026-09-29 | Several tickets on one phone: all tickets visible together (portrait stacked, landscape 2 + 1), switch to one at a time, optional quick-mark pad, claim screen shows the ticket with the pattern outlined; tickets handed out from one sheet (TAM-122, TAM-173, TAM-191 to TAM-194). | Owner |
| 2026-09-29 | Quick mark shows the tickets under the pad; the phone points out when the player's own marks fill a pattern (never a verdict); every prize stays selectable when claiming, the host's scan refuses won ones (TAM-192, TAM-195, TAM-196). | Owner |
| 2026-09-29 | Quick mark shows **all** tickets as small thumbnails (marked cells filled, numbers may be unreadable); tapping one opens it (TAM-192). | Owner |
| 2026-09-29 | Players can cross out prizes announced as won; crossed-out prizes can't be picked when claiming; anything else stays selectable and the host's scan refuses won ones (TAM-196, replaces "every prize stays selectable"). | Owner |
| 2026-09-29 | Phase 2 is built so connected mode can be added later without redesigning screens: player-side facts tagged by source, versioned QR formats (TAM-211 drafted for Phase 6). | Owner |
| 2026-09-29 | Rhyme catalog revision 2: cricket calls rewritten to be punchy and timeless (moments, nicknames, slang, not shirt numbers); playful filler and repeated endings replaced with desi, wacky lines; 405 rhymes. | Owner request, product owner |
| 2026-09-29 | Cricket rhymes use shirt numbers only for the top three players (Dhoni 7, Sachin 10, Kohli 18); all others are about the game or historic moments. | Owner |
| 2026-09-29 | Rhymes revision 3: every call must link instantly to its number (rhyme, fact, shape or famous moment). Cricket cut to 26 calls with real links, including India's trophy years 2011, 2013, 2024, 2025 and 1983; 404 rhymes. | Owner request, product owner |
| 2026-09-29 | Rhyme rule: every call rhymes with its number or links directly to it through popular culture or common knowledge; nothing niche. Applied to all English lines (revision 4, 397 rhymes). | Owner |

| 2026-09-29 | Prize rounding: every tier except Full House rounds to the nearest ₹10 (an exact half rounds down); Full House takes whatever is left (TAM-082). | Owner |
| 2026-09-29 | After the host closes a tier, its win card goes away by itself; no Done tap (TAM-145). | Owner |
| 2026-09-29 | The one-time screen-sleep tip never covers the called number (TAM-128, TAM-138). | Owner |
| 2026-09-29 | 36 Hindi rhymes that fail the rule are cut; 35 numbers have no Hindi rhyme for now, and a Hindi game uses an Indian-reference English rhyme for them (TAM-150, TAM-153 changed). | Owner |

| 2026-09-29 | Tiny pots: when rounding the smaller prizes to the ₹10 unit would leave Full House smaller than another prize, they round to the nearest ₹1 instead (e.g. ₹36 → ₹4 / ₹5 / ₹5 / ₹5 / ₹17); only if even that fails are the smaller prizes lowered ₹1 at a time until Full House is the largest (TAM-082). | Owner |
| 2026-09-29 | The host is the bank for each game: everyone pays the host up front; the host pays winners and hands back unwon money after the game (TAM-089). The session tally and Settle up are an optional, separate step, and settling is player to player (PLT-017, PLT-028 unchanged). | Owner (corrected the same day) |
| 2026-09-30 | Family play-test done. After a win, closing the prize becomes the main action: the big bottom button turns into "Close Top Line", the rest of the screen dims, and a stray tap pulses the button once; no blinking (TAM-198, TAM-145). | Owner |
| 2026-09-30 | The last setup step shows the session a game will join, with "Change" to start a new session or pick a recent one (PLT-029). | Owner |

| 2026-09-30 | Payout screen: each person's row shows paid, won and net; two buttons below: "Settle with host" (host is the bank: "Host gives Riya ₹77") and "Settle with players" (who pays whom for this game, fewest hand-overs). The session tally keeps its own Settle up (TAM-089, TAM-088). | Owner |
| 2026-09-30 | While a won prize waits to be closed (TAM-198) the screen dims, but "Add another winner", the prize chip's Close and the menu (End game, Discard, Show the room) still work. | Owner |
| 2026-09-30 | Compact session tally: one row per person (name, balance); tapping a row shows paid, won and got back (PLT-017). | Owner |
| 2026-09-30 | Session line (PLT-029): a first game, or one more than 3 hours after the last, shows "Session: <suggested name> (new) · Change"; Change lists up to 3 unsettled sessions from the last 7 days. | Owner |

"Convention" means the established Tambola rule in `docs/games/tambola/guide.md`, chosen because the owner asked
Claude to follow game conventions. Every Tambola rule above is also a host setting with this default.

## Open
- iPhone check by hand, later (owner has only Android for now): open the preview once, turn on Airplane Mode, reopen, and check Tambola opens. The automated iPhone offline tests are skipped until Playwright issue #42775 is fixed.
- Before wider public release: replace the "Report a problem" stub with a real destination (PLT-208)
- Approval of Phase 2, 2.5, 6 and 7 scenarios (when those phases come up)
