# Secret Words: one phone or several? Gameplay research and play modes (4 October 2026)

Product owner, for the owner's decision. Three research passes on 4 October 2026: (1) how the game flows at a real table,
(2) single-device and multi-device party games, and how phones can link in one room for $0, (3) a turn-by-turn paper
simulation of our approved design with three family groups. **[Estimate]** marks our own timings (no measured data exists).
Proposed changes are decisions P1–P10 at the end; nothing changes in the approved scenarios until the owner decides.

## 1. How the game really flows at a table
- **Both clue givers sit side by side and share one key card the whole game.** They check it at every guess, judge each
  other's clues, and **plan their next clue during the other team's turn**. The rulebook even says: stuck? "give a clue for
  your hardest word and keep thinking while the other team plays."
- **Guessers huddle around the board**, touch a card to guess, and rely on remembering the clue (and earlier clues, for the
  extra "+1" guess).
- **The slow part is the clue giver thinking** ("analysis paralysis"); team discussion is quick by comparison.
- **Numbers:** about 1.3–2 words per clue, so about 10–14 turns per game [estimate from machine-play and Duet data]; 15–30
  minutes a game; 6 players (3 v 3) is the sweet spot; at 8–10 "the loudest voice makes every call" and games stretch to 45 min.
- **How others do it:** the official Companion app shows the key on phones from a shared code (players complained that its
  "hide when the phone lies flat" misfires: use a deliberate tap); the Secret Agent app adds a **second phone as the clue
  giver's screen**; "Codenames Offline" puts the board on one tablet and the key on clue givers' phones.
Sources: CGE rulebook; arXiv 2412.11373 and 2306.02475; 103percent strategy blog; Kingpanda; App Store pages of CODENAMES
Companion and Secret Agent; imperialoctopus.com/posts/codenames-offline (full list in the research notes of 4 October).

## 2. What our approved one-phone design does in a real room (simulation)
| Group | Mode | Time per game | Phone passes per game | Time each player is idle |
|---|---|---|---|---|
| 6 adults and teens, Full board | One phone | **about 28 min** | 18 passes + 14 pick-ups | about 45% |
| 4 (parents, a 9-year-old, a grandparent), Easy board | One phone | about 14 min | 14 | the child about 66% |
| 10 at a family gathering | One phone | **about 40 min** | about 50 handlings | guessers about 67% |
| 6 adults and teens | Clue givers' own phones | **about 17 min** | none | about 20% (as at a real table) |

**Why one phone is slow:** clue givers can only think while holding the phone, one after the other, and the room has no
board for about 40% of the time. Two phones turn this back into the real-table rhythm.

### Frictions found, ranked (4 = spoils the evening)
| # | Sev | Friction | Fix |
|---|---|---|---|
| F1 | 4 | Clue givers think one at a time; one phone is about twice as slow | Recommend a second phone for the clue givers; say honestly "about 25 min" for one phone |
| F2 | 3 | No board for the room while the clue giver holds the phone | Two phones; later a "board on your phone" QR for guests |
| F3 | 3 | 25 small words on a flat phone: half the table reads upside down; landscape needs a tilt | A "Turn ↻" button that rotates the board inside the app, remembered per team |
| F4 | 3 | The clue word is never shown, only the number: "what was the clue?" | Optional clue word, shown big ("CRICKET · 3") with a list of earlier clues; a gentle warning if it is a word on the board |
| F5 | 3 | Game 1 may make a 9-year-old or a grandparent the clue giver | "Guesses only" switch per name on Make teams; rotation skips them |
| F6 | 3 | Holding the pad for a 70–120 s think tires the thumb; the map can't be made larger | One phone: tap to show, hides 3 min after the last touch (or at once when the screen goes off); an "Our words" list in large text |
| F7 | 2 | No way back to the map after "I have my clue" | "See the map again" on the clue screen |
| F8 | 2 | A wrong number tapped can't be fixed | "Change number" until the first reveal |
| F9 | 2 | Everyone grabs the phone; a kid confirms a word too early | Keep pick-then-confirm; optional "Zoya taps for …" line that rotates (play-test first) |
| F10 | 2 | The waiting team has nothing to look at | Recap line on the pass screen: "Last turn: Chai Champions found 2; TRAIN was nobody's." |
| F11 | 2 | "That clue broke a rule" is three taps deep | A visible quiet button on the board until the first reveal |
| F12 | 2 | WhatsApp pop-ups and calls on the host's phone in the middle | Tip: "Turn on Do Not Disturb" on the deal screen |
| F13 | 2 | Screen dimming and battery over 1.5–2 hours | Wake lock (already in the specs), checked on a budget Android and an iPhone home-screen app; "Tap the board to wake it" if refused |
| F14 | 2 | Own phones: a new scan every game; faded words drift | "Next map" on the clue giver's phone (no new scan); a check on the host |
| F15 | 1 | The hurry-up timer is 28 px, hidden in the clue giver's hands | 56 px or more on the board while guessing |

## 3. Linking phones in one room, for $0 (research)
| Way | Works offline? | Verdict |
|---|---|---|
| **Shared code**: each phone rebuilds the same board and map from a short code (our map code; the official Companion app does this) | **Yes** | ✅ Reliable; nothing to drop when a phone sleeps. Updates aren't live (each phone shows its own copy) |
| Phones linked directly by scanning QR codes (WebRTC) | Wi-Fi only | ❌ Two scans per phone; iPhone drops the link when the screen locks, so everyone re-scans; many home and guest Wi-Fi networks block it |
| Bluetooth between phones from a web app | — | ❌ Impossible in browsers (no iPhone support at all) |
| A free online relay (Cloudflare free plan; one room = one small server object) | **Needs internet** | ✅ for a later "connected" mode: live sync, about $0 within free limits, but our first server to build and look after |
| Firebase / Supabase / PeerJS free tiers | Needs internet | ⚠️ Hard caps, projects pause, or no uptime promise |
A reveal must reach other phones within about 0.3–0.5 s to feel shared; after a phone sleeps it must reload the whole game.

## 4. The versions
### Version A: One phone (works anywhere, no internet)
For 4–6 players, a quick game, or when only one phone is free. **About 25 minutes a game** (Full board), about 14 (Family).
1. Turn over → **pass screen** with a recap line ("Last turn: …") → the clue giver taps "I'm Riya".
2. **Private map:** tap to show (hold also works); hides 3 minutes after the last touch, or at once when the screen goes off;
   "Our words" switch lists their words and the Landmine in large text.
3. **Clue screen**, still in the clue giver's hands: optional clue word, number keys, "See the map again".
4. Phone back in the middle: **board** turned to face the guessing team ("Turn ↻"), "CRICKET · 3 · 4 guesses left" in large
   text, earlier clues listed, "Clue broke a rule?" and "Change number" until the first reveal; pick, then "Reveal".
5. Result line; "Other team's turn". Repeat.

### Version B: Two phones (recommended) (works anywhere, no internet)
**The board phone in the middle and one map phone shared by both clue givers**, sitting side by side as at a real table.
**About 17 minutes a game.** No passing, no hold pad; both clue givers plan all the time.
1. The host phone deals and shows the map QR once; the map phone scans it (or types the 7-character code).
2. Each turn: the clue giver says the clue; a guesser taps the number (and the optional clue word) on the board phone.
3. Guessers pick and reveal on the board phone; clue givers fade found words on the map phone (optional).
4. **Play again:** the map phone taps **"Next map"** and shows the next board of the same deck; a 2-symbol check on both
   phones confirms they match (no new scan).
This is the approved "clue givers' own phones" flow with one map phone instead of two: mainly new wording, plus "Next map".

### Version C: Three phones (works anywhere, no internet)
Board phone, plus **one map phone per clue giver**, so each clue giver sits with their own team. Same speed as B; more private;
two phones to scan or step with "Next map". Best for big gatherings (8+).

### Add-on for big groups: "Board on your phone" (works anywhere, no internet)
Any guest scans a board QR and sees the **words only** (no colours), large, on their own phone; tapping a word fades it on
that phone. Helps 8–10 people who can't all see the centre phone. Needs its own QR format (word list, no map), so it is a C3
change. **Later**, after the play-test shows the need.

### Version D: Connected (later; needs internet)
Board phone + a phone per team (the board up close, guess from your seat, "my pick" votes so quiet players are heard) +
clue givers' phones, **all updating live**. Needs a small free relay (Cloudflare free plan) and internet for this mode only;
offline play stays as it is. Our first server, so it waits for connected mode on the roadmap (Phase 6), and the play-test
decides if families want it.

### Which version when
| Group | Phones free | Best version |
|---|---|---|
| 4–6, quick game | 1 | A |
| 4–8, normal evening | 2 | **B** |
| 8–20, gathering | 3+ | C (plus the board add-on, later) |
| Anyone, with internet, wanting everyone on their own phone | many | D (later) |

## 5. Decisions for the owner (P1–P10)
Recommended unless the owner says otherwise. All but P2 and P10 change the approved scenarios (version 3 after decisions).
| # | Decision | Recommendation |
|---|---|---|
| P1 | Setup choice "How do clue givers see the map?" becomes **"How many phones?"**: "One phone (about 25 min)" · "Two phones: one for clue givers (about 15 min)" · "Three phones: one per clue giver"; two-phone card marked "Recommended" | Yes |
| P2 | Picker card time "about 15 min a game" becomes "15–25 min a game" | Yes |
| P3 | **Optional clue word**, shown big with earlier clues; a gentle warning if it is a face-down word (reverses K15, which was number only) | Yes |
| P4 | One-phone map: tap to show by default, hides 3 min after the last touch; "Our words" list; "See the map again" | Yes |
| P5 | "Change number" until the first reveal; "Clue broke a rule?" visible on the board until the first reveal | Yes |
| P6 | "Turn ↻" rotates the board inside the app, remembered per team | Yes |
| P7 | "Guesses only" switch per player (kids, grandparents); rotation skips them | Yes |
| P8 | "Next map" on the map phone (no re-scan between games), with a 2-symbol match check | Yes |
| P9 | Recap line on the pass screen; Do Not Disturb tip; timer 56 px on the board | Yes |
| P10 | "Board on your phone" add-on and Version D (connected): designed now, built later, after the play-test | Later |
