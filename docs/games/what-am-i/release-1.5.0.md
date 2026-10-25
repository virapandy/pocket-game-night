# What Am I?, first release: app 1.5.0 (draft, product owner, 25 October 2026; the owner releases)

The product owner's record of what families get, what is known to be imperfect, and what comes next. Draft written before
the build so the release isn't held up by writing; the version number assumes Secret Words ships as 1.4.0 first. The
"Known issues" table is filled in from the release candidate's playthrough. The technical release notes (commits, test runs)
are the orchestrator's, in the Build clone's `docs/releases/`.

## What families get
- **A new game on the same app:** Home → Host a game → **What Am I?** (after Secret Words). One phone, passed round; no
  internet, no sign-in, free. Nobody sits out writing words, and nobody has seen them.
- **How it plays:** one player, the guesser, holds the phone on their forehead or chest with the screen facing the room.
  Everyone else gives clues (talk, act, make the noise) but never says the word. Move the phone down for Got it, up to pass;
  passing is free. Each mark plays a sound (and a buzz on Android), because the guesser can't see the screen.
- **Hands-free, for grandparents and small children:** stand the phone behind the guesser and one clue giver taps the bottom
  half for Got it, the top half to pass. Choose it for the whole game, or for one player on their turn.
- **Taps always work too:** if a phone doesn't allow moving (or someone prefers it), tap the bottom or top half instead.
- **724 everyday words in eight packs:** Animals, Food, Around the house, Jobs, Sports and cricket, Festivals and places,
  Act it out, Famous Indians, or Mix of all. Words known everywhere in India (checked against a non-Hindi speaker from
  Tirunelveli and Sivagangai), easy for a 10-year-old to act or describe; non-veg food words only when switched on.
  No word repeats tonight until every word has been used.
- **30, 60 or 90 seconds a turn:** 30 for small kids, 90 for grandparents.
- **Fair scores without arguments:** when time's up the room sees what was got and passed, and can move any word that was
  marked wrong (or said by mistake) before saving. Undo after saving, until the next turn starts.
- **Real game-night moments:** someone joining mid-round ("Joining this round: Om"), someone leaving (their points stay),
  someone else going first, a pause that stops the clock and hides the word (a phone call or a dropped phone pauses by
  itself), "End Riya's turn now", "Home (game saved)" and resume where you left off, a running total on every
  end-of-turn screen, "Scores" in the menu, as many rounds as you like, "End the game" for the winner (ties shared), "Play
  again", and a summary of the night.
- **Never records anyone:** no camera, no microphone, nothing about players leaves the phone.

## Known issues in 1.5.0
| Issue | Workaround |
|---|---|
| (filled in from the release candidate playthrough; only stuck or privacy problems hold a release) | |

Known limits by design: iPhone browsers can't buzz, so on iPhone the sound carries each mark (keep the sound up); on an
iPhone, moving the phone needs one "Allow" the first time.

## Next: 1.5.1 and later
- Point-release fixes from the release candidate playthrough and families' reports.
- Later, from the guide's variants: teams; an "Act it out only" round; pictures for small children; an opt-in films pack.
- Then **Mafia** (game five), designed and tested alongside What Am I?, released after it.

## How it was made (for the next game)
Designed from player stories and room moments; a screen map walked by six personas twice and a critic, a tap-through
prototype walked by six more personas, and Jev reads of the screens and the word list; scenarios checked by independent
coder and tester reads before the owner approved them; rules tested first, built in lanes, each lane reviewed before
merge; checked by the complete test run on both phones and an AI playthrough of the release candidate.
