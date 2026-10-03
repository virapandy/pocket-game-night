# Impostor: the whole evening, stage by stage (draft, 3 October 2026)

Designed against the five stages in `docs/proposals/next-game-lifecycle.md`, before any build. Rules are in
`guide.md`, words in `words.md`, decisions in `docs/decisions.md` ("Impostor" rows). **Every screen in detail:
`ux.md`** (decided with the UX designer; where this file and `ux.md` differ, `ux.md` wins).

## Who is involved
| Role | Who | Note |
|---|---|---|
| **Host** | Holds the phone between turns; **also plays** | Tambola's host sat out its secrets; here the host must never see more than any player |
| **Crew** | Everyone with the word | |
| **Impostor** | One (or two) players without the word | |
| **Newcomer** | Never played | Must understand within the first round |
| **Guest with the link** | Opens the app on their own phone | Nothing to join in one-phone mode; must be told so |

## Ways to play
| Mode | First release? | Falls back to |
|---|---|---|
| **One phone, passed round** (default) | Yes | Paper slips |
| Players' own phones (each sees their word on their phone) | Later; designed now so it fits | One phone |
| Paper slips (phone dead) | Always possible: the phone can show the word to one "dealer" who sits out | Slips |

---

## Stage 1. Decide: "what shall we play?"
| Who | Sees | Does | Target |
|---|---|---|---|
| Host | Home unchanged ("Host a game" / "Join with my ticket"); "Host a game" → "What shall we play?" with Tambola and Impostor cards | Taps Impostor | 5 s |
| Guest with the link | "Join with my ticket" ends with "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!" | Puts the phone away | — |

Game picker (platform piece, two games now): a short filter by "How many of you?" comes later, when a third
game arrives; with two games, two cards are enough.

## Stage 2. Set up and join
```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ ← Impostor                   │   │ ← How do you want to play?   │
│ Who's playing?  (seat order) │   │ Mode      [ Easy ✓ ][ Hard ] │
│  1 Riya        ≡  ✕          │   │ Talking   [Free flow✓][Timer]│
│  2 Arjun       ≡  ✕          │   │ Score     [ No ✓ ][ Yes ]    │
│  3 Meena       ≡  ✕          │   │ Words [Whole family✓][+Grown-ups]│
│  [+ Add player]              │   │ Categories: all ›            │
│  Same players as Tambola? ✓  │   │                              │
│                              │   │                              │
│ [           Next           ] │   │ [        Start round       ] │
└──────────────────────────────┘   └──────────────────────────────┘
```
| Choice | Default | Note |
|---|---|---|
| Players | Names from tonight's session if there is one, else empty | Seat order = passing order = clue order; drag to fix |
| Mode | **Easy** | Hard: no category or hint, impostor never starts (`guide.md`) |
| Talking | **Free flow** with "Vote now" | Timer: 2 minutes, gentle chime |
| Score | **No** | Yes: the night's scoreboard |
| Words | **Whole family** | "+ Grown-ups" adds words kids or elders may not know; non-veg food stays off unless switched on in Categories |
| Categories | All 9 | Switch any off |
| Impostors | 1 (two after the play-test) | |

The four choices are equal two-way switches (guideline 17a: a chosen option is outlined with ✓, never the main
button look). They are asked once per evening and remembered; "Change how we play" is in the menu between rounds.
**Target:** 30 s for a group that played earlier tonight; under 90 s the first time (typing names).
**Late joiner:** "Add player" between rounds; they join from the next round, scoring from zero.
**Someone leaves:** remove between rounds; their points stay on the scoreboard.

## Stage 3. Teach
| Moment | What the app does |
|---|---|
| First round of the evening | Before the deal, a **"Read this aloud"** card: "Everyone gets the same secret word, except one impostor who gets none. Say one word each about it. Then point at who you think the impostor is. Impostor: blend in, and guess the word if you're caught." One button: "Got it, deal". Skippable with "We know it". |
| First round, newcomers present | Optional **practice round** (setting on the card): played normally, but no points |
| During the deal | The reveal screen says what to do: crew "Your word: **Samosa** · Give one-word clues. Don't say it!"; impostor "**You are the impostor** · Category: Food · Listen, blend in, guess the word" |
| During clues | "Rules" in the menu, never showing anyone's word |
| After the reveal | One line on why: "Arjun was the impostor. The word was Samosa." |

## Stage 4. Play
**The deal (pass the phone), one player at a time:**
```
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Pass the phone to │   │   Riya            │   │ (after one hold)  │
│                   │   │                   │   │ [Done, pass to    │
│      RIYA         │ → │  Hold to see your │ → │                   │
│                   │   │      word         │   │      ARJUN        │
│ [ I'm Riya ]      │   │   (press & hold)  │   │ [ I'm Arjun ]     │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```
- The word shows **only while held**; letting go hides it. No screen ever shows the previous player's word.
- **The impostor's turn looks and feels exactly like everyone's:** same screens, same taps, same length, no
  different colour, sound or animation before the reveal (apps leak roles this way, per reviews).
- Later, with regional themes: a script switch for this player on the hold screen (`words.md` rule 4).
- "Don't know this word?" under the word (crew and impostor alike) redeals quietly (`words.md`).
- After the last player: "Everyone has seen their word. Put the phone in the middle."

**Clues and discussion (phone in the middle, face up):**
- "**Meena starts**, then clockwise" with the seat order shown; never the impostor.
- **Free flow:** the screen shows "Talk it over" and one main button, "**Vote now**".
- **Timer:** a big 2-minute timer everyone can see, a gentle chime at the end; "Vote now" ends it early.

**Vote:**
- "Get ready to point… 3, 2, 1, **point!**" (voice and big numbers).
- Someone said the word by mistake: menu "Deal again with a new word", no points.
- The host taps who has most fingers: "Who was accused?" with each name, plus "It's a tie" → pick the tied players
  → one re-vote → still tied, the impostor escapes.

**Reveal:** after "Reveal Arjun" (pick, then confirm), a short calm build-up, then "**Caught red-handed! ARJUN was
the impostor.**" or "**Meena was crew!** The impostor was ARJUN. Escaped!" (then the word).
**Last guess** (only if caught): "Arjun, one guess. Say it out loud!" **before** the word is shown; then "Show the word",
and the room decides: "Guessed right" / "Wrong guess".

**Moments every game must handle**
| Moment | Behaviour |
|---|---|
| Phone locks or a call comes during the deal | Resumes at "Pass the phone to <next>", never on a word |
| App closed mid-round | Reopens at the same step; the word only reappears by "hold to see" for a chosen player |
| Someone forgets their word | Menu: "See my word again" → "Pass the phone to…" pick a name → hold to see. Family trust, like Tambola's anchor |
| Someone glimpsed another's screen | Menu: "Deal again with a new word" (new word, new impostor), no points |
| Phone dies | Paper: one person sits out, writes slips; the guide's "How to play" works without the app |
| Ending early | "End the evening" any time between rounds; mid-round, the round is dropped with no points |

## Stage 5. After the round, after the evening
| Moment | What happens |
|---|---|
| Round result | The reveal; if keeping score, this round's points and the **night's scoreboard** (one row per player, sorted); if not, a running "Impostor caught 3 · escaped 2" for the night |
| Next round | "Next round" (main): new word, never one used tonight; new impostor at random; the starter moves on one seat |
| Who's impostor next | Random each round, but never the same player 3 rounds running (owner, I5); twice in a row can happen, so nobody can rule themselves out |
| End the evening | Fun lines for the night ("Best impostor: Arjun, escaped 3 times"), and the final scoreboard if keeping score; "Play something else" back to Home |
| Words afterwards | The history shows each round's word and impostor (fun to look back on). Words used in the last 3 evenings are avoided when possible |
| Play again tomorrow | A new evening; the player list is offered again |
| Ended by mistake | "Oops, keep playing" on the summary; "Carry on this evening" in History within 3 hours (IMP-101) |
| Something else tonight | "Play something else" keeps the players; the evening sits in tonight's session, outside any money tally (IMP-102) |
| Left open | Ends by itself after 12 hours, kept in History (IMP-104) |
| Share the night | A plain-text recap through the phone's share sheet, only on tap (IMP-106) |
| A word that flopped | "This word didn't work" skips it on this phone for good; Settings can bring it back (IMP-107) |
| Clearing secrets | One phone: nothing to clear (the word is hidden until the reveal). Own phones (later): "Game over, phones away" as Tambola rows 20–22 |

## Lifecycle questions (process step 4b)
| Question | Answer |
|---|---|
| Ending early vs discarding | Ending keeps the scoreboard; discarding the evening throws its points away (asks first) |
| Resuming hours later | Yes, between rounds; a half-played round restarts with a new deal (the word may have been forgotten or discussed) |
| Chaining | Each round chains into the next; the night's scoreboard carries across Impostor rounds, and into the session total with other games (later) |
| What a finished evening keeps | Players, each round's word, impostor, accused, guess, points; the seed for replay |
| Must never be lost | The scoreboard of a finished evening |

## Players' own phones (later, designed now)
Each player scans the host's QR once per evening to join; at each deal, their own phone shows "hold to see".
Offline, the host phone would show each player's QR in turn, which needs passing anyway; so own phones are
only worth it **with connected mode** (Phase 6). Until then: one phone. The engine keeps "who may see what" in one
place so own phones need no rule changes.

## Paper play-test (process step 5), before any build
Play 3 rounds with 5+ family members, one person as the dealer (sits out this once):
1. The dealer picks a "family" word from `words.csv`, writes it on all slips but one
   ("IMPOSTOR · Category: Food"), folds them, and hands them out at random.
2. Play one round in Easy mode (slip says "IMPOSTOR · Food · hint: Sunday lunch") and one in Hard mode (just
   "IMPOSTOR"). The dealer names a starter, lets the talk flow, counts "3, 2, 1, point!". Try one round with a
   2-minute timer.
3. Note afterwards: did anyone not know a word? Was one-word clues right, or too hard for kids? Free flow or
   timer: which felt better? Did anyone want points? Did the impostor ever guess the word? Did the scoring feel fair? Did anyone want to see
   their word again? Which category was most fun?

## UX notes (checked against `docs/ux-guidelines.md`)
- One main button per screen (17a): "I'm Riya", "Start round", "Next round".
- Hold-to-see must also work for people who can't hold (accessibility): a "Tap to show / Tap to hide" setting.
- Screen readers: the word is read only while held, and never announced on the shared screen.
- Nothing flashes during the reveal; the drum-roll is sound plus a calm animation (reduce motion respected).
- Landscape and 320 px: the deal screens are one name and one button, so they fit anywhere; check the scoreboard
  with 10 players at 360 × 640.
- Tone: a caught impostor gets a laugh ("Caught red-handed!"), never a put-down.
