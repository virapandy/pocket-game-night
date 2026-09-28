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

"Convention" means the established Tambola rule in `docs/games/tambola/guide.md`, chosen because the owner asked
Claude to follow game conventions. Every Tambola rule above is also a host setting with this default.

## Open
- Approval of Phase 2, 2.5, 6 and 7 scenarios (when those phases come up)
