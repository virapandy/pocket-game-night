# Next game: learn from Tambola, design the whole evening (proposal, 3 October 2026)

Product owner, for the owner's approval. Docs only (C0): nothing here touches the Tambola build or release.

## 1. Looking back: how Tambola evolved
Phase 1a went live on 28 September. In the six days after, almost every change came from something
**the design never looked at**, not from bugs in what it did describe.

| When | What changed after it was built | Stage it belongs to | Why it was missed |
|---|---|---|---|
| 28 Sep | Unwon prize money goes back to players | After the game | Money worked out only for the "everything won" case |
| 29 Sep | The host is the bank; settle up separate | After the game | Money flow between people never walked through with real amounts |
| 29 Sep | Rounding gave Early Five more than a Line | Play | Rule written, never checked with worked numbers |
| 29 Sep | Several tickets on one phone, quick mark, claim QR, pattern cue | Play (player's phone) | Phone tickets designed a phase later than paper, piece by piece |
| 30 Sep | "Close the prize" not obvious (family play-test) | Play | First time the owner saw it in a real room was after building |
| 30 Sep | Which session a game joins | Setting up | Evening-level view (several games) came late |
| 1 Oct | Home doesn't say "host" or "join" | Deciding and joining | Designed for the host only; a guest opening the link was not a journey |
| 1 Oct | One solid main button per screen | Every stage | Rule learned in review, not in design |
| 2 Oct | 320 px phones, landscape, large text, screen readers | Every stage | Checked only after building |
| 3 Oct | What happens to tickets after the game ends | After the game | No journey for "the game is over, phones still out" |
| — | "How to play" is one help page | Teaching | Teaching never designed as a stage |

**The pattern:** we designed the middle (calling numbers) carefully and discovered the edges (arriving,
teaching, after the game, the players' phones) in use. Edge changes then arrived one review at a time, so the
UX list grew from 7 rows to 25 while builds were open, and the money changes (the slowest kind, C3) came last.

### What to keep
- Conventions first, with sources; the owner's "keep it simple" stance.
- Plain-English guide, worked examples, decisions with a recommendation.
- The rules learned the hard way, now in `docs/ux-guidelines.md` (17a one main button, 17b landscape,
  26a screen readers, 41 no scrolling) and the change classes in `docs/change-sop.md`.

### Eight lessons, and what we do differently
| # | Lesson | Do differently |
|---|---|---|
| 1 | The edges of the evening were found in use | Design all five stages below **before** any build, for every role |
| 2 | Players' phones were added a phase later | Design every role's phone journey up front, even if one is built later |
| 3 | Money changed after building (slow, risky) | Decide every **one-way door** first (scores, money, secrets, saved data) with worked numbers the owner checks |
| 4 | The owner first "saw" the game once built | Owner reviews **screen sketches** and plays the game **on paper with family** before any code |
| 5 | Phone sizes and accessibility checked late | Every sketch is checked at 320, 390 and landscape, larger text on, against the guidelines, before build |
| 6 | Reviews kept adding rows during builds | One design review before build. After build: only fixes for this release; new ideas wait for the next |
| 7 | 16 documents in the Tambola folder | Four per game: guide, lifecycle (journeys + sketches), decisions, scenarios. Later changes are rows in one list |
| 8 | Extended testing ran before the game was complete | Already fixed by the change SOP: complete testing only at release |

## 2. The game-night lifecycle: five stages every game is designed against
Your four stages, with "set up and join" split out of "decide" because in Tambola that is where most of the
setup rows were (rows 7–11).

| Stage | The moment in the room | Questions every game must answer |
|---|---|---|
| **1. Decide** | "What shall we play?" | Who is it for (players, ages, time, energy)? How does Home help pick it? What does a guest who opens the link see? |
| **2. Set up and join** | Gathering, phones out | Who is the host? Who joins, how (shared phone, pass the phone, own phone, paper)? Late joiners? Time to the first action (target 30 s)? |
| **3. Teach** | "How does this work?" | A 30-second pitch the host reads aloud; one picture of a round; a practice round or "first round explains itself"; a rule reminder mid-game that never shows secrets |
| **4. Play** | The game itself | The core loop, secrets, timers, disputes, mistakes and undo, interruptions (call, lock, dead phone), ending early |
| **5. After the game** | Results, then "again?" | The reveal; scores, prizes or money with worked numbers; play again (what carries over, who goes next); clearing secrets from phones; history; "how was it?" |

For each stage, the design fills one table: **role × what they see × what they do × which phone × target time**,
plus a sketch of each screen. Roles always include the **newcomer** (never played) and the **guest who just
opened the link**, the two people Tambola forgot.

### Pieces to build once, for every game (platform)
Learning from Tambola, these would otherwise be redesigned per game:
- **Game picker** on Home once there are two games: filter by number of players and time; "last played".
- **Teach card**: a standard "Read this aloud" screen and a "How to play" sheet any game can fill in.
- **The night's scoreboard**: a session (already built for Tambola) that totals points across rounds and games.
- **After-game clear-up**: "Game over, phones away" and clearing private things from phones (Tambola rows 20–23,
  made general).

## 3. A leaner new-game process (replaces `docs/new-game-process.md` once approved)
| # | Step | Output | Owner checkpoint |
|---|---|---|---|
| 1 | Fit check and pitch | Five yes/no answers; the 30-second pitch | Owner says go |
| 2 | Guide | `guide.md`: rules by convention, with three sources | Owner reads it |
| 3 | Lifecycle design | `lifecycle.md`: the five stages, every role, every phone mode, screen sketches checked at three sizes | **Owner walks through the sketches** |
| 4 | One-way doors and decisions | Rows in `decisions.md`: scoring, money, secrets, saved data, with worked numbers | Owner decides, or "follow conventions" |
| 5 | Paper play-test | Family plays 2–3 rounds with paper and one phone timer; findings fixed in steps 2–4 | Owner tells us what happened |
| 6 | Scenarios | `scenarios.md` drafts → tester turns them into `specs/<game>/` | Owner approves |
| 7 | Build and release | By `docs/change-sop.md`: rules and secrets are C3 (tests first), screens C1/C2 | Owner tries the preview |

Removed from the old process: separate files per review, the steps that duplicated each other (old 2–5 become
step 3), and design work after build except fixes. The contract check stays inside step 4, for the builders.

## 4. If the next game is Impostor (the roadmap's next), a first sketch
Impostor: everyone but one player gets the same secret word; each gives a one-word clue; the group votes on who
the impostor is; the impostor can still win by guessing the word.

| Stage | First thoughts (to research and decide) |
|---|---|
| Decide | 4–10 players, 10–20 minutes, loud and funny; works for mixed ages with a family word pack |
| Set up and join | One phone passed round (default) or players' own phones; names once per evening |
| Teach | Very short to teach; first round can be a "practice round" where the impostor is revealed at the end |
| Play | Private reveal that neighbours can't glimpse (pass the phone, "hide and pass"); clue order; a visible timer for discussion; the vote aloud or on the phone |
| After | Dramatic reveal; points per round; next round rotates the first speaker; **never repeat a word in the evening**; the secret word cleared from every phone |

## Questions for the owner (all at once)
1. **Approve** the eight lessons and the lifecycle as the way we design every new game?
2. **Which game next?** Recommendation: **Impostor** (simplest to teach, strong use of the phone for secrecy,
   playable on paper for the play-test). Alternatives: Dumb Charades, Scoreboard.
3. **The four platform pieces** (picker, teach card, night scoreboard, after-game clear-up): build them with the
   next game (recommended: picker and teach card now, scoreboard and clear-up when the game needs them)?
4. **Paper play-test before any code** (step 5): yes?
5. **Timing:** I design steps 1–5 now, in parallel with the Tambola release; the tester gets scenarios only after
   the Tambola release, so nothing slows it down. OK?
