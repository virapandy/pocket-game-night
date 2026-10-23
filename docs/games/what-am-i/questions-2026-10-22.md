# What Am I?: questions for the owner (product owner, 22 October 2026)

**Decided 23 October 2026: owner, "follow your recommendations on WA1 to WA10".** Rows copied to `docs/decisions.md`.

These change how the game plays, so they are the owner's (rule decisions are asked, never decided silently). Each has
the convention marked **norm** and the product owner's recommendation. Answered rows move to `docs/decisions.md` as
WA1, WA2, ….

| # | Question | Options | Recommendation |
|---|---|---|---|
| WA1 | **How long is a turn?** | 60 seconds (**norm**) · host picks 30, 60 or 90 | 60 seconds, with 30 / 60 / 90 in setup (30 for young kids, 90 for grandparents) |
| WA2 | **How does the guesser mark a word?** | Tilt only (**norm**) · tap only · both | **Both**: tilt down / up, and two big tap areas (bottom half Got it, top half Pass) for anyone whose tilt doesn't work or who prefers it |
| WA3 | **Each for themselves, or teams?** | Each player scores (**norm** for families) · two teams (also played) | Each for themselves in the first release; teams later |
| WA4 | **Does passing cost anything?** | Free and unlimited (**norm**) · minus 1 · at most 3 passes | Free; at the end of the turn the room can swap any word between Got it and Passed |
| WA5 | **A clue giver says the word** | Nothing happens; the room marks it Pass · the word doesn't count and the turn goes on (same thing) · the turn ends | The room marks it Pass; no extra button |
| WA6 | **Recording the clue givers** (Heads Up! records video) | Never · optional | **Never**: no camera, nothing about players leaves the phone |
| WA7 | **When does the game end?** | No fixed end (**norm**); host taps "End game" · a set number of rounds (say 3), then a winner | No fixed end, a scoreboard after each round, "End game" names the winner; ties shared |
| WA8 | **Word packs in the first release** | About 40 words each: **Animals · Food · Around the house · Jobs · Sports and cricket · Festivals and places · Act it out (actions like "brushing teeth", "flying a kite") · Famous Indians (known in every state, nothing political)** · plus "Mix of all" · Indian films later as an opt-in pack | All eight plus "Mix of all" (the default); films later |
| WA9 | **Non-veg food words** | Off unless the host turns them on (as in Impostor, rule 11) · always in | Off unless turned on, as in Impostor |
| WA10 | **Sound and buzz during a turn** | On by default (the guesser can't see the screen) · off by default | On, with a mute on the setup screen |

Not questions (product owner follows conventions; owner may overrule): turn order is the player list, nobody guesses
twice before everyone has once; no word repeats tonight; Pause and leaving the app stop the clock; the word screen is
sideways and readable from 3 metres; iPhone asks once for "Allow tilt" and falls back to tap.

Next, once answered: the word packs (`words.csv`), then the screen map and tap-through prototype (step 1b), persona
walks, then scenarios (WAI-) for your approval. Nothing goes to the orchestrator until Secret Words is released.
