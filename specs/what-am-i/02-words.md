# What Am I?: 02 Words (C3)

Copied from `docs/games/what-am-i/scenarios.md` version 1.3 (approved by the owner, 24 October 2026). Each scenario
carries the Version 1.1, 1.2 and 1.3 items that name it, word for word; a later version wins over earlier text in the
same scenario (1.3 over 1.2 over 1.1 over the body). Terms, canonical strings and test hooks: [README.md](README.md);
the exact rule API and browser hooks the tests use: [api.md](api.md).

### WAI-010 The word order
Status: approved · Phase: What Am I? 1
At `start`, the game's queue is the eligible words shuffled with `shuffle(words, createRng(\`${wordSeed}:${gameIndex}\`))`
(gameIndex = 1 for tonight's first game), then filtered: words **shown** earlier tonight are moved to the end of the queue in
the order they were first shown (oldest first). Each T3 word is the next one in the queue. Property: within one game no word is
shown twice while unshown eligible words remain; across games, no word is shown twice tonight until every eligible word has
been shown. A test may fix `wordSeed` (WAI-H1).
**Running out:** when the chosen pack has no unshown word left, the next words come from Mix of all's unshown words (same seed
rule, gameIndex unchanged), without stopping the turn. When Mix of all has none left either, shown words return, oldest first.

**Version 1.1** (wins over the text above):
1.1 item 1: **Seeds.** The seed is `seeds.words` everywhere ("wordSeed" in WAI-010 means it). Browser hook: WAI-H1b sets it.
1.1 item 2: **Input order.** Before shuffling, eligible words are sorted by `id` ascending. R3: Mix of all keeps the copy with the
   lowest id (Bat WAIW-040 in Animals; Swimming WAIW-181 in Sports and cricket); T3's pack name and the saved id are that copy's.
1.1 item 3: **The queue** at `start` = `shuffle(sortedEligible, createRng(\`${seeds.words}:${gameIndex}\`))`, then stably split into
   the **unshown part** (not shown tonight, in shuffled order) followed by the **shown part** (shown earlier tonight, oldest
   first-shown first).
1.1 item 4: **Fallback** (pack not Mix of all): when the pack's unshown part becomes empty (its last unshown word is shown, or at `start`
   if already empty), Mix of all's eligible words minus every word shown tonight and minus the pack's words are shuffled with
   `createRng(\`${seeds.words}:${gameIndex}:mix\`)` and appended to the unshown part.
1.1 item 5: **A hidden word** (pause or skip, R2) is put at the end of the unshown part, before the shown part.
1.1 item 6: **Worked example** (WAI-H7 list of 5 Animals words, non-veg off, first game, seed fixed so the shuffle gives Owl, Tiger,
   Duck, Bat, Camel): Riya's turn shows Owl (Got it), Tiger (Pass), Duck (paused, hidden). Queue now: Bat, Camel, Duck. Carry on:
   Bat (Got it), Camel (Got it), Duck (time up, passed). Unshown part empty, so the Mix fallback is appended (H7 sets it empty
   too): the shown part follows, oldest first: Owl, Tiger, Bat, Camel, Duck. Next T1 shows tip 3.

### WAI-011 Tip lines on T1
Status: approved · Phase: What Am I? 1
At most one tip line shows on T1, the first that applies in this order:
1. "Joining this round: Om" while a player added this round has not had their turn (names joined with ", " and " and ").
2. "Only 8 new Animals words left. After that, words come from Mix of all." when the chosen pack (not Mix of all) has 1–14
   unshown eligible words ("Only 1 new Animals word left. …").
3. "All words used tonight. Words from earlier games come back, oldest first." when Mix of all has no unshown word.
4. A phone tip on this phone's first What Am I? turn ever, the first that applies: "Turn your ringer on so you hear each word
   count." (iPhone and Sounds on; WAI-H5 decides the platform) · "Screen not turning? Turn off rotation lock." (only if the last
   game on this phone recorded a rotation-lock event, WAI-024) · "Keep your screen on during the turn." (the wake lock was
   refused on this phone's last turn, WAI-025).

**Version 1.1** (wins over the text above):
1.1 item 7: **Tip for an active fallback:** WAI-011 gains item 2b, "Animals words used up. Words now come from Mix of all." (after 2,
   before 3), while the fallback supplies words.
1.1 item 17: Phone tips show on **the first turn of each game** on this phone, at most one, the first that applies: ringer (iPhone,
    Sounds on, and only in tonight's first game); rotation lock (a rotation-lock event recorded on this phone in an earlier game);
    screen on (a wake lock refused on an earlier turn on this phone).

**Version 1.2** (wins over the text above, and over Version 1.1):
1.2 item 9: **Sound tip for everyone** (critic 6, 10): the ringer tip becomes "Turn the sound up so the guesser hears each word count.",
   on both platforms, on the first turn of every game, while Sounds is on. "Ringer" never appears.
1.2 item 10: **Screen-on tip sooner** (critic 3): "Keep your screen on during the turn." shows on the next T1 after any refused wake lock,
    once per game; it ranks right after "Joining this round".
1.2 item 11: **Rotation tip by platform** (critic 10): iPhone "Screen not turning? Turn off rotation lock."; Android "Screen not turning?
    Turn on Auto-rotate."
