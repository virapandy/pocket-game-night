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

| 2026-09-30 | Typed ticket code (fallback when scanning fails, TAM-117): 20 characters in 5 groups of 4, carrying the whole ticket so it opens offline. | Owner |
| 2026-09-30 | QR libraries approved: a small free QR drawing library and a QR reading library for iPhone hosts (Android uses the built-in reader); no accounts, $0. | Owner |
| 2026-09-30 | Late joiners in a phone-ticket game get phone tickets from the next sheet (TAM-067). | Owner |
| 2026-09-30 | Phone tickets are handed out strictly in order from sheets of 6; a player's tickets may span two sheets (TAM-194). | Owner |
| 2026-09-30 | The host's button is "Scan a claim"; the claim QR carries the ticket, ticket number, game code, player name, start time and prize list, never a seed (TAM-053, TAM-170, TAM-172); the iPhone offline-scan test is skipped under the 28 September WebKit decision (TAM-057). | Claude, on owner's standing instruction |

| 2026-09-30 | Giving a player a ticket they already hold is refused politely: "Ticket 1 is already Riya's" (TAM-175). | Owner |
| 2026-09-30 | One ticket at a time in portrait uses 42 px cells so the ticket fits a 390 px screen with no sideways sliding (TAM-122, TAM-191). | Owner |
| 2026-09-30 | A ticket opened by typed code offers every usual prize under "Show claim"; the host's scan refuses any prize the game doesn't have (TAM-117, TAM-177). | Owner |
| 2026-10-01 | Problem reports include the game's money numbers (contribution per ticket, prize amounts, payouts), with names still replaced by Player 1, Player 2, so money bugs can be replayed (PLT-201, PLT-204). | Owner |
| 2026-10-01 | Report sorting: bug (something went wrong), confusion (didn't know how), idea (a wish), otherwise noise; stub-kept reports are listed under "Reports waiting to send" with "Kept on this phone: sending isn't set up yet" (PLT-205, PLT-202, PLT-209). | Product owner |
| 2026-10-01 | A test report counts as GREEN only when the automation run for that commit is green too. | Product owner |
| 2026-10-01 | Tickets per player stay 1 to 3 for now (TAM-045); the limit is proposed for a later version from what real games show. | Owner |
| 2026-10-01 | A phone may hold another player's ticket (e.g. Grandma's); it keeps the holder's name on the phone, on claims and in payouts. A phone holds at most the per-player limit (3), held tickets included. | Owner |
| 2026-10-01 | Several-ticket screens: the pattern message is one slim line that never covers tickets or pushes buttons off screen; Quick mark keys at least 44 px and show marks; "Which ticket?" shows thumbnails with the flagged ticket first; pattern outline not colour alone (TAM-195, TAM-192, TAM-190; `docs/games/tambola/ux-review-2026-10-01-several-tickets.md`). | Product owner with UX designer |
| 2026-10-01 | A UX designer helper joins the product owner's chat: tests and recommends, decides with the product owner, edits nothing (`docs/proposals/ux-designer-role.md`). | Owner |
| 2026-10-01 | Home shows two equal choices, "Host a game" and "Join with my ticket", above unfinished games; paper and phone tickets are two equal cards with no default; one main button per screen, always the next step (UX guideline 17a; `docs/games/tambola/ux-review-2026-10-01-action-hierarchy.md`). | Owner's observations, product owner with UX designer |
| 2026-10-01 | UX reviews follow `docs/ux-evaluation-playbook.md`: comprehensive passes with evidence, the product owner and UX designer talk findings through, and the product owner consolidates the final recommendations into one UX list in `docs/handover.md`. | Owner |
| 2026-10-01 | The "your marks fill a pattern" cue on players' phones is a host option on the ticket-type step (phone tickets only), **off by default**, with a short warning when turned on; it travels in the ticket QR; typed codes and older QRs have it off; players can't turn it on themselves (TAM-195). | Owner, details product owner with UX designer |
| 2026-10-02 | Marked cells and Quick mark's marked keys use a deep blue fill with a white number and a ✓ of at least 14 px; the cue outline is orange with a corner mark; red is for actions only (UX guideline 17a). | Product owner with UX designer (full review) |
| 2026-10-02 | Tickets fit the width down to 320 px by shrinking cells; the called number, rhyme and verdicts reach screen readers; landscape never hides a setup choice. | Product owner with UX designer |
| 2026-10-02 | First game of all: the session line above "Confirm prizes" replaces a separate naming screen (PLT-016 follows PLT-029). | Product owner |
| 2026-10-02 | Tester's questions: keep "Tap to resume"; the cue names both prizes in prize order; "You're ready" on the first visit only; Settings in Home's menu; "Settle with host" is the payout screen's main button until a tab opens; at 812 × 375 with Larger text all three tickets fit. | Product owner with UX designer |

| 2026-10-03 | "One at a time" tickets keep a 12 px side margin; cells fill the space between (about 39 px at 390 px wide), replacing the 42 px minimum of 30 September (TAM-122, TAM-191). | Owner |
| 2026-10-03 | Prize chips on the calling screen wrap onto a second line instead of being cut off (TAM-126, UX list row 15). | Owner |
| 2026-10-03 | After a game: players clear tickets with "Done with this game" (confirmation); tickets more than 6 hours old open on Home with Open / Clear; the host's summary shows "Game over" after End or Discard; claims from ended or discarded games get their own calm refusal (TAM-171, TAM-179; `docs/games/tambola/ux-review-2026-10-03-after-the-game.md`). | Owner (all four), details product owner with UX designer |
| 2026-10-03 | The host sees the proof that a claim is from its game: each scanned verdict adds "Ticket 3 · game 7K3P · same numbers as your copy" (bogeys too; "checked from your copy" by number); the game code shows on the calling screen, the room view and the hand-out screen (TAM-179). | Owner, details product owner with UX designer |
| 2026-10-03 | Release 1.1.0: GO after one text fix (paper winner dead end); cue line "…" + More and the scrolling verdict card accepted for 1.1.0, fixed next (two-line cue, pinned buttons). | Product owner with UX designer |
| 2026-10-03 | Release 1.2.0 (Tambola, no Impostor): GO from the release branch's screenshots; N1 and the thin sleep line checked in the owner's try-out. | Product owner with UX designer |

| 2026-10-03 | Faster loop: automation splits browser tests into parallel jobs and caches browsers; report-only pushes don't restart automation; long checks (mutation, mass simulation, emulator) stay weekly and never block a round. | Owner |
| 2026-10-03 | The app honours the phone's "reduce motion" setting: no number animation and the next call is ready at once; browser tests run with it on. Phones without the setting are unchanged. | Owner |
| 2026-10-03 | The tester runs the affected browser tests plus every rule test locally, then reads automation's full run, which is the verdict; a full local browser run only to reproduce an automation failure. | Owner |
| 2026-10-03 | Speed first, by `docs/change-sop.md`: every change is sorted into C0 Docs, C1 Look, C2 Screen behaviour or C3 Core and follows that class's recipe; only C3 (rules, money, claims, saved data, ticket/QR format, privacy, dependencies, build) gets tests first; quick verify on every push; the complete test only before a release; a preview link for the owner and a families' link updated only by releases; up to 3 coders in parallel in separate working copies, split by area; new UX rows and extended testing paused until UX rows 1–25 are released. Replaces the 3 October "full run is the verdict every round" rule. | Owner |
| 2026-10-03 | Added to the change SOP: release packages (freeze, one complete run, release notes); screenshot comparison approved by the product owner or UX designer for C1 changes; one commit and merge per change; per-copy ports and a quick verify after every merge for parallel coders; a read-only AI reviewer before each merge; flaky tests quarantined for at most 2 days, listed and fixed, never deleted (standing approval, not for release-blocking tests); weekly speed numbers. | Owner |
| 2026-10-03 | Mutation runs only where a change touched code: a C3 change gets mutation on the rules and money lines it changed; a release covers every such line changed since the last release; the full mutation run stays weekly and never blocks. | Owner |

| 2026-10-03 | C3 rows 6, 20, 21, 23 follow the tester's recommendations: row 6 "Add another winner" in phone games offers paper players by name or another claim scan (scanner opens at once with no paper players); row 20 the clear question lists each ticket, held ones by holder; row 21 tickets more than 6 hours old open on Home with Open and Clear; row 23 an old game's claim gets a calm note, never ✗ or "Bogey". | Owner |
| 2026-10-03 | Row 8: "plays on paper" can be undone until the first number is called ("Kabir plays on paper · Undo"); after the first call it is final. | Owner |
| 2026-10-03 | The preview link keeps its own saved games and settings, separate from the families' link on the same phone. | Owner |

| 2026-10-03 | While another game is half-built on `main`, a Tambola release is cut on a release branch (`release/<version>`) from `main` with the unfinished game's app commits reverted and its tests left out; the complete run and the release run on that branch's tag. `main` is untouched. | Owner |
| 2026-10-03 | Tests written first for a feature not yet built are marked "expected to fail" (Playwright `test.fail`, Vitest `test.fails`) so quick verify stays green and the preview keeps updating; each flips to a normal test when its feature works. A test that passes while marked expected-to-fail is a finding. | Owner |

| 2026-10-03 | Release 1.2.0 only (branch `release/1.2`): the complete run leaves out Impostor's tests (Impostor is not in this release) and the screenshot comparison (main's reference pictures show the Impostor picker); the product owner approves the 1.2.0 pictures from the release branch's own Screenshots run. Every Tambola rule and browser test still runs on both phones. Not a precedent for main. | Owner (explicit) |

| 2026-10-04 | Overnight checks (run 37143638539): TAM-112 confirmed on the emulator between Impostor rounds, then fixed (save every call at once); the weekly mutation run split into parallel jobs under 5 hours; Impostor's unbuilt tests marked expected-to-fail so `main` is green | Owner |
| 2026-10-04 | TAM-112 emulator check: the weekly failure was a test fault (Chrome force-closed 1 s after leaving, before its storage write). The test gains a "game saved after the last call" check, waits 10 s before the force-close (Android discarding a backgrounded app), and confirms Chrome went to the background; the expected result is unchanged. | Owner |
| 2026-10-04 | Not now: a sturdier save for the rare case where Android force-closes Chrome within 1–2 s of the host leaving (the last call or two could be lost; the host calls them again). For the product owner's later list. | Owner |

"Convention" means the established Tambola rule in `docs/games/tambola/guide.md`, chosen because the owner asked
Claude to follow game conventions. Every Tambola rule above is also a host setting with this default.
| 2026-10-03 | **What makes us different:** one app for the whole fun night, in the room, with games the phone makes possible that normally need a box, cards, tokens or a moderator who sits out. New games must pass this "replaces the box" test; games that need nothing (Dumb Charades, Antakshari) are out. Shortlist: Impostor, Mafia, a Codenames-style word game (own name and words, never a copy). Lessons and lifecycle in `docs/proposals/next-game-lifecycle.md` approved. | Owner |

## Open
- iPhone check by hand, later (owner has only Android for now): open the preview once, turn on Airplane Mode, reopen, and check Tambola opens. The automated iPhone offline tests are skipped until Playwright issue #42775 is fixed.
- Before wider public release: replace the "Report a problem" stub with a real destination (PLT-208)
- Approval of Phase 2, 2.5, 6 and 7 scenarios (when those phases come up)

## Impostor: decisions after research (3 October 2026; evidence in `docs/games/impostor/guide.md`)
| # | Decision | Basis |
|---|---|---|
| I1 | **Easy mode**: the impostor sees the category and a hint word. **Hard mode**: only "You are the impostor" | Owner; the hint as a difficulty dial (app reviews) |
| I2 | Starter random; in Hard mode never the impostor; in Easy mode the impostor may start | Owner; "playing blind" when first with nothing (BGG) |
| I3 | "Keep score?" asked at the start, **default No**; if Yes: escape +2, caught but guessed +1, caught crew +1 each; no target | Owner confirmed 3 October; most groups play without points (BGG) |
| I4 | Tie after one re-vote: the impostor escapes | Owner |
| I5 | Impostor random, never the same player 3 rounds running | Owner; streak complaints (BGG, reviews) |
| I6 | "Talking": **Free flow** (default, "Vote now" button) or **Timer** (2 min), asked at the start | Owner confirmed 3 October; groups prefer momentum (BGG) |
| I7 | "See my word again" allowed | Owner |
| I8 | One phone first; own phones with connected mode | Owner |
| I9 | No repeats in an evening; avoid the last 3 evenings | Owner |
| I10 | First release: Multicultural theme only, English letters | Owner |
| I11 | Word list `words.csv` v2 checked by 9 persona reviewers; real readers (North, South, East, a grandparent, a child) before release | Owner asked for persona review first |
| I12 | No team-gives-the-word mode | Owner |
| I13 | Words: **Whole family** (default) or "+ Grown-ups"; non-veg food off unless switched on | Owner confirmed 3 October; persona review; veg/non-veg divide |
| I14 | Repeating someone's clue is allowed (it looks suspicious); saying the word restarts the round | Owner confirmed 3 October; convention (BGG, Spyfall publisher) |
| I16 | **Add quirky, funny words** to the list (owner, 3 October); same fairness and persona checks | Owner |
| I17 | Detailed UX decided with the UX designer (`docs/games/impostor/ux.md`, findings R1–R20): the word is shown only after the last guess; "Reveal Arjun" (pick, then confirm); letting go only hides, "Done, pass to…" moves on; same screen for every role; no long-press menus; nothing auto-advances | Product owner with the UX designer, 3 October |
| I18 | Home stays as decided on 1 October; "Host a game" leads to "What shall we play?" (Tambola, Impostor) | Product owner (keeps the owner's Home decision) |
| I19 | First release: one impostor only; two impostors for 8+ players after the play-test | Product owner (simplicity first; reversible) — owner may overrule |
| I20 | New lasting UX guidelines 45–48 (private reveal on a passed phone, table screens, pick-then-reveal, no auto-advance at decision points) | Product owner with the UX designer |
| I21 | After the first build (4 October), product owner: the "left halfway" screen keeps the menu as built (no "Change how we play"; Players only "Change players after this round."), choices change on the next result; reopening after "Vote now" always reruns the countdown, then the picker; an unfinished Tambola setup opens as saved, tonight's names fill only a new one; on screen B at 320 and 360 px wide a long name may shrink to 20 px on one line; the orchestrator's other calls (summary over 3 hours opens on the summary, "← Back" keeps the players list, no session question) match the approved scenarios. Build-side picks in test-questions (rows of 3 October: IMP-002 guest line on the first Join view only, `eveningTotals` export for the IMP-042 property, the two refusals, Larger text on Impostor screens only, IMP-070 "← Back" rewrites the same evening, IMP-094 History row, IMP-001 "Start new" whenever another evening is unfinished) accepted as built | Product owner |
| I22 | Owner's play (4 October): the category "Cricket and games" is renamed **"Sports and games"** (Badminton, Hockey, Chess under "Cricket" made no sense); Elephant dropped (no fitting category), Rain and Aadhaar card moved to Desi life; one duplicate hint fixed (308 words). The last-guess step now says what is at stake: "Last chance, Arjun! Guess the word out loud. Get it right and you steal the round." with main "Arjun guessed. Show the word" (the owner read the old step as the game carrying on after a correct catch) | Owner's play-test; product owner |
| I23 | Round 4 build questions (4 October): result screens scroll as one page on small phones (handover corrected; scenarios win); on the hold screen a long name shrinks just enough to fit one line below the 20 px floor (as built); "✓ Caught!" / "✗ Escaped!" may shrink to 44 px below 360 px wide so it stays on one line; the rules accept any listed word id live and on replay, the app records the pickWord id and tests check that (as built); "unfinished Tambola setup first" was already in IMP-102 (since 4 October) | Product owner |
| I24 | Jev's confusing-screen flags (25 of 26 on the clues screen, 4 October): **must fix before release** (one-line C1 changes, with evening 128's fix round): the quiet button becomes "Go round again", moved to the bottom bar directly above the main button with "Not enough clues?" above it (it sat under the clue order and read as the first step); the result headline is 44 px below 390 px wide (wraps at 360 on Linux fonts); the screen-reader announcer is emptied when a new deal starts. No change: on an empty summary "Oops, keep playing" is a fine choice | Product owner |
| I25 | Owner's play (4 October): the round result shows "End game" beside "Next round" and "← Home" (game kept to resume); Impostor's screens say "game", never "evening", "night" or "session"; the end screen offers "Play again", "Play something else", "Home". Process: UX playbook pass 12a "What next?" and guideline 47a | Owner ("End game", not "End session") |
| I26 | Real game-night moments (`docs/room-moments.md`): every item labelled **Must** is done before the Impostor release; someone leaving mid-round gets "Finish this round first" (main) or "Deal again without Kabir", never revealing the leaver's role | Owner, 4 October |
| I15 | Later, rarely: twist rounds (no impostor; everyone an impostor) | Players love them used sparingly (BGG) — later |

## Secret Words (Codenames-style word game): decisions (4 October 2026; evidence in `docs/games/secret-words/research.md`)
Status: **decided: owner, 4 October 2026, "follow the recommendation"** for K1–K18 (the Recommendation column is the decision), including festival names as board words. Norm = the Codenames convention.
| # | Question | Options | Recommendation |
|---|---|---|---|
| K1 | Name | ~~Ishaara~~ → **Secret Words** (owner, 4 October: an English name, since "Codenames" is a trademark; the rules themselves are free to use) | Secret Words; "Codenames" never as our name (K22: "Inspired by Codenames" allowed) |
| K2 | Theme | Spy noir (norm, too close to Codenames) · flat minimal red/blue · **flat board with Team Mango and Team Peacock and the Landmine** | ~~Mango v Peacock~~ → orange and teal teams with funny names (K25) + the Landmine; red stays for the main button |
| K3 | How clue givers see the map | **Both in the first release**: "Pass this phone" (hold to see) and "Clue givers' own phones" (QR or code, offline); two equal cards, no default | Both; the code makes own phones work offline |
| K4 | Teams | Shuffled into equal teams the first time; tap to move; last teams after | As recommended |
| K5 | Board | **Full 25** (norm, default) · Family 16 | Both, Full default |
| K6 | Easy board | 6 / 5 / 5, **no Landmine** (Disney easy mode has no assassin) | As recommended |
| K7 | A clue that breaks a rule | Norm: the other clue giver covers a word of their choice · **the phone turns over a random word of the other team** | Random (keeps the map off the room screen) |
| K8 | Timer | Norm: sand timer, rarely used · **none by default, a 90-second "Hurry up" anyone can start, never automatic** | As recommended |
| K9 | Scoring | **Tonight's tally of games won** by Mango and Peacock, fun lines at the end; no points or target | As recommended |
| K10 | Words | Our own list, 400 words (452 with K26), 3–8 letters, India-centric and fair to every region; Whole family default, + Grown-ups option; non-veg words included (they are only words on a board) | As recommended; persona and real-reader checks as Impostor's |
| K11 | Clue numbers | 0–9 and ∞ (norm's expert clues included) | As recommended |
| K12 | Players | 4–20, at least 2 per team; 2–3 players later (co-op) | As recommended |
| K13 | Clue language | Norm: English plus words used in an English sentence (chai, jugaad); groups may agree on more | As norm |
| K14 | Two-word names as clues (Taj Mahal, Sholay) | Allowed by default (norm: group choice) | Allowed |
| K15 | The clue word (~~reversed by P3~~) | **Only the number is tapped**; the clue is said aloud, not typed | As recommended (typing slows every turn) |
| K16 | Undo | No undo of a reveal (pick, then confirm); "Oops, keep guessing" after "End our turn"; undo for team moves | As recommended |
| K17 | Clue giver rotation | Fewest games as clue giver tonight, ties to the earliest in the team list | As recommended |
| K18 | Resume | Within 12 hours at the same step; the map screen always returns to "Pass the phone to…" | As recommended |
| K19 | Map code and words after the two-reader check (product owner, 4 October): 7-symbol code (config, deal index, deck seed, check symbol); each evening deals from a shuffled deck so no word repeats for 15 games; any word-list change makes a new edition. Showing the code to clue givers is accepted with K3 as family trust, an exception to "seeds never leave the host phone" (SWD-028) | Product owner (follows from K3 and K10) |
| K20 | Secret Words scenarios version 2 (SWD-001 to SWD-099) approved; queued for the tester after Impostor's release | Owner, 4 October |
| K21 | Renamed Ishaara → **Secret Words**: IDs SWD- (scenarios) and SWDW- (words), folder `docs/games/secret-words/`, game id `secret-words`. A name change only; scenario approval (K20) stands | Owner, 4 October |
| K22 | The app may say **"Inspired by Codenames"** in plain text: on the Secret Words picker card and in How to play, with the credit line in `docs/games/secret-words/legal.md` (independent, not made, sponsored or endorsed by Czech Games Edition). Never as the game's name, heading, title or address, never their logo or look; legality and precedent checked (Scrabulous, Delhi HC 2008) (SWD-001, SWD-011) | Owner, 4 October |
| K23 | All game names in English: the losing card is **the Ghost** (was "the Bhoot"; now the Landmine, K28); board word Ghost replaced by Shadow. Board words themselves stay India-centric (K10) | Owner, 4 October |
| K24 | Board words: **English, or an Indian word known everywhere**; test person someone from Tirunelveli or Sivagangai who doesn't speak Hindi. 35 words replaced (Mela, Rangoli, Lassi and others; Mango and Peacock clash with team names); example clue words "chai, dosa" | Owner, 4 October |
| K25 | **Funny team names, random each evening** from 20 pairs in `docs/games/secret-words/team-names.csv` (e.g. Chai Champions v Coffee Commandos, Back Benchers v Front Benchers, Snooze Buttons v Alarm Clocks); "New team names" before the first deal. Colours stay fixed (orange, teal) with shape icons; replaces Mango v Peacock (K2) | Owner, 4 October |
| K26 | Word list: add **Geography** (58 words: countries Indians relate to, world cities, Indian states and cities, landmarks); one word of at most 8 letters, nothing political. The rest of the list approved as good | Owner, 4 October |
| K27 | Secret Words word list (452 words, `words.csv` edition 1) and team names (`team-names.csv`) **approved by the owner**; no separate persona review needed | Owner, 4 October |
| P1–P9 | Secret Words play modes (`docs/games/secret-words/play-modes.md`): "How many phones?" (one · two, recommended · three); "15–25 min a game"; optional clue word shown big with earlier clues and a board-word warning (**reverses K15**); one phone: tap to see the map, "Our words", "See the map again"; "Change clue" and "Clue broke a rule?" on the board; "Turn" the board; "Guesses only"; "Next map"; recap line, Do Not Disturb tip, bigger timer. P10: "Board on your phone" and connected play designed, built later | Owner, 4 October ("follow the recommendation") |
| P11 | Home's "Join with my ticket" becomes **"Join a game"** with "Tambola ticket or Secret Words map from the host" (until Secret Words ships: "Tambola ticket from the host"; C1, may ship now) | Owner, 4 October |
| K28 | The danger word is **the Landmine** (was the Ghost) | Owner, 4 October (product owner noted the real-weapon tone; owner chose it) |
| K29 | New setup choice for the Full board: **Landmine: Lose the game** (default, the standard rule) or **Lose your turn** (turn ends, the other team gets one word free) | Owner, 4 October |
| K30 | Boards are **Full** (25 words) and **Easy** (16 words, no Landmine); playing against the phone (2–3 players) is a future extension | Owner, 4 October |
| K31 | Secret Words scenarios **version 3.2 approved**; the build starts when Impostor's release candidate 1.3.0 is frozen (release work on its branch, Secret Words on `main`) | Owner, 4 October |
| K32 | Player walk and session events (`player-walk-2026-10-04.md` W1–W20, `session-events-2026-10-04.md` E1–E25): fixes accepted as proposed, for scenarios v3.3 | Owner, 4 October ("follow the recommendation") |
| K33 | Q1: the Landmine defaults to **Lose your turn** with Whole family words, **Lose the game** with + Harder words; the host can change it | Owner, 4 October |
| K34 | Q2: clues in English or words used in English (chai, dosa), stated in a "Clue rules" box; no other-language setting | Owner, 4 October |
| K35 | Q3: a Reveal stays final; every main button ignores taps for 800 ms after its screen appears (1.5 s after a turn-ending reveal) | Owner, 4 October |
| K36 | Q4: the secret map hides 60 s after the last touch, with "Still looking? Tap to keep the map" from 50 s | Owner, 4 October |
| K37 | Q5: next day, Home offers "Play again with last night's teams" (names and teams filled in, new tally); last night stays in History | Owner, 4 October |
| K38 | A rotating **picker** makes the final Reveal tap each turn, named on screen ("Sunita picks this turn"); every game; "Pass the pick" hands it on (`behaviour.md` B1) | Owner, 4 October |
| K39 | **Pairs of clue givers** allowed ("Nana + Aarav"), set in the Clue givers sheet (B2) | Owner, 4 October |
| K40 | Disputes: "Clue not allowed?" offers **Let it go · Try another clue · Turn ends, they get a word**, with "Both clue givers decide together." (B3) | Owner, 4 October |
| K41 | Behaviour proposals B4–B12 (ask before making someone clue giver; credit people, blame the board; poker-face line; a job for the waiting team; end on a high; fair shuffles; "Our words" on the map phone; "tap to suggest"; easy joining) and the never-do list of `behaviour.md` §3 | Owner, 4 October ("follow the recommendation") |
| K42 | Secret Words scenarios **version 3.4 approved** (SWD-001 to SWD-133); the build starts when Impostor's release candidate 1.3.0 is frozen | Owner, 4 October |
