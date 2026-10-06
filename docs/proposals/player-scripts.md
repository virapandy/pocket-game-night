# Cheaper player testing: scripts for what we know, AI players only for what we don't (proposal, 6 October 2026)

Owner: "how can we make the multi-agent test simulating a user type cheaper, and as scripts?"

## Where the cost is today
Each AI player run plays a whole game by reading the screen and deciding every tap: 70–200 tool calls, 6–25 minutes,
one persona at a time. Most of its findings fall into a few repeatable kinds: a common action hidden or missing, a
dead end, text cut off or hidden under a button, a double tap doing harm, a word people don't understand.

## The idea: discover once with AI, then check forever with scripts
| Layer | What runs | Cost | When |
|---|---|---|---|
| 1. **Player rules** (new, scripts) | Automatic checks on every screen the browser tests and simulations already visit | Free (GitHub's free machines) | Every push (smoke) and every simulation |
| 2. **Persona scripts** (new, scripts) | The screen simulation (`tests/sim`) plays with persona settings: tap speed and double taps, wrong taps then back, phone sideways, Larger text, leaving and coming back, joining and leaving mid-round | Free | Every release and weekly, 50–200 games |
| 3. **Jev people** (exists) | Jev picks taps for 10–50 games and flags confusing screens | Small (inside the weekly Jev cap) | Weekly |
| 4. **AI player** (exists) | One persona plays the changed flow and says what confused it | The expensive one | Only for new screens or changed flows; at design time on sketches (text only) |
Every new kind of AI finding becomes a rule in layer 1 or a behaviour in layer 2, so the same mistake is never paid
for twice.

## Layer 1: player rules checked on every screen (scripted)
1. **Stop is always visible between rounds**, and every screen has a visible way out or back (no dead end, except the
   hold screen during a hold). A "what next?" map lists, per screen, the actions that must be on screen.
2. **Nothing hidden:** no text cut off (an element's content wider or taller than its box), and nothing overlapped by
   the pinned bottom buttons once scrolled to the end.
3. **A double tap never skips a screen or a player.**
4. **Every pick of a person can be taken back before anything secret shows** (wrong name).
5. **One word per idea:** a list of banned words on Impostor screens ("evening", "crew", "steal"…), and every button
   ends up somewhere (no tap that silently does nothing).
6. **Sizes and fit** at 320, 360, 390 and 812 × 375, with Larger text on and off.

## Layer 2: personas as script settings (no AI)
| Persona | Settings for the simulated host |
|---|---|
| Grandparent | Slow taps; reads every screen; Larger text on; sometimes taps a neighbouring button, then looks for a way back |
| Child | Phone sideways; double taps everything; presses Back often |
| Party host | One hand: taps near the bottom; leaves mid-round and comes back; people join and leave mid-round |
| Competitive uncle | Ties, undo, deal again, "someone said the word" |
After each step the layer 1 rules run. A failing game saves its seed, steps and screenshots and becomes a permanent test.

## Making the AI players cheaper when we do use them
- Read the page as text first (accessibility tree), and take screenshots only when something looks wrong.
- Give each run a short checklist of the moments to try, and a cap of about 60 steps.
- Use a smaller, cheaper model for routine re-runs; the larger model only for first plays of new screens.
- At design time, walk the sketches and screen text only (no browser), which costs a few minutes.
- Always one at a time, from cleared app data.

## What it saves
For Impostor, the three AI player runs before the freeze took about 45 minutes and several hundred tool calls. With
layers 1–2 in place, a release would need one short AI player run on the changed flow (about 10 minutes, fewer steps)
instead of three full ones, and the scripts would catch any return of the issues already found, for free, on every push.

## Work to do (tester, after the Impostor release; owner approval needed)
1. Layer 1 checks as a shared helper used by every browser test and the screen simulation, with the "what next?" map
   for Impostor and Tambola screens (from `docs/room-moments.md` and the player-run findings).
2. Persona settings in the screen simulation (`tests/sim`), reusing the existing simulated player.
3. Add the four player-run findings of 6 October (P1–P4) as scripted checks first.
4. Update `docs/proposals/player-agent.md`: AI player runs only for new or changed flows, with the cheaper settings.
