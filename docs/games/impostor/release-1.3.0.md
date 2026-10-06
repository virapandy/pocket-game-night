# Impostor, first release: app 1.3.0 (owner releases, 6 October 2026)

The product owner's record of what families get, what is known to be imperfect, and what comes next. The technical
release notes (commits, test runs) are the orchestrator's, in the Build clone's `docs/releases/`.

## What families get
- **A new game on the same app:** Home → Host a game → **Impostor** (beside Tambola). One phone, no internet, no
  sign-in, free.
- **Setup in three taps for a group that played earlier tonight:** names filled in, choices remembered ("Same as last
  time"), "How to play" only when someone asks.
- **Four simple choices:** Easy or Hard, Free flow or a 2-minute timer, scores or not, Whole family or + Grown-ups words
  (non-veg words off unless switched on). Optional "Last guess for a caught impostor" (off by default).
- **291 India-centric words** in 9 categories, fair to players from anywhere in India and to kids and elders (checked
  by nine simulated players, a full audit and real play); no word repeats in a game.
- **A private deal:** pass the phone; each player holds to see their word, which disappears on letting go; the
  impostor's screen looks exactly like everyone's; "Not Riya? ← Back" and "Don't know this word?" for mistakes.
- **The round in the room:** who starts, clues aloud, talk (free or timed), "3, 2, 1, point!", pick who got the most
  fingers, then one result screen: "✓ Caught!" or "✗ Escaped!", the word and its category.
- **Real game-night moments:** someone joining mid-round ("Joining next round: Zoya"), someone leaving ("Finish this
  round first" or "Deal again without Kabir"), "See my word again", "Home (game is saved)" for breaks, resume with
  names, "End game" and "← Home" between rounds, "Oops, keep playing", "Play again", Share.

## Known issues in 1.3.0 (none stops a game; fixed in 1.3.1)
| Issue | Workaround |
|---|---|
| Phone sideways: the in-round menu cuts off "End game" | Turn the phone upright, or finish the round and use "End game" on the result |
| A quick double tap can skip a screen (the talk screen, the winner screen, or open Tambola from Home) | Talk anyway; the winner is in History; go Back |
| A double tap can select the screen's text (it turns blue) | Tap elsewhere |
| "Free flow" and "Whole family" can show without their space | None needed |

## Next: 1.3.1, right after this release
- Round 6b fixes (handover "Impostor round 6b → 1.3.1"): the four issues above.
- The next list, for the owner to pick from (`docs/room-moments.md`): "New game, same players" under "Play again";
  shorter secret phrases and easier hints; a sign when tapping during the countdown; friendlier "Don't know this word?"
  for everyone; "See my word again" as a smaller link; "Sitting out" for someone stepping away; editing a name; Tambola
  reusing tonight's names; Settings without Tambola words; the resume card layout; "Isha joins next round" in the
  Players sheet; the scoreboard rank spacing and long one-word names.

## How it was made (for the next game)
Designed from the whole evening and real game-night moments; spec checked by independent coder and tester reads;
built in parallel lanes; checked by the complete test run on both phones, 200- and 60-evening screen simulations with
Jev, the UX designer, and three player runs. Lessons now in the process: start from player stories and room moments
(`docs/new-game-process.md` step 0a), the player helper (`docs/proposals/player-agent.md`), cheaper scripted player
checks (`docs/proposals/player-scripts.md`), and the release rule: only stuck or privacy problems hold a release (I30).
