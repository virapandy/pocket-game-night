# Impostor: the whole evening, stage by stage (draft, 3 October 2026)

Designed against the five stages in `docs/proposals/next-game-lifecycle.md`, before any build. Rules are in
`guide.md`, words in `words.md`, open questions in `docs/decisions.md` ("Impostor" rows).

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
| Host | Home: Tambola and Impostor cards, each with players and time: "Impostor · 3–20 players · 4 min a round · Find who doesn't know the word" | Taps Impostor | 5 s |
| Guest with the link | Home with "Host a game" / "Join". Join on Impostor: "Impostor plays on the host's phone. Nothing to join: just play along!" | Puts the phone away | — |

Game picker (platform piece, two games now): a short filter by "How many of you?" comes later, when a third
game arrives; with two games, two cards are enough.

## Stage 2. Set up and join
```
┌──────────────────────────────┐
│ ← Impostor                   │
│ Who's playing?  (seat order) │
│  1 Riya        ≡  ✕          │
│  2 Arjun       ≡  ✕          │
│  3 Meena       ≡  ✕          │
│  [+ Add player]              │
│  Same players as Tambola? ✓  │  offered when a session is running
│ Words: Multicultural ›       │
│ Categories: all 8 ›          │
│ Impostors: 1                 │  2 offered from 8 players
│                              │
│ [        Start round       ] │  main button, fixed bottom
└──────────────────────────────┘
```
| Choice | Default | Note |
|---|---|---|
| Players | Names from tonight's session if there is one, else empty | Seat order = passing order = clue order; drag to fix |
| Word theme | **Multicultural** (the only one at first) | Regional themes later |
| Categories | All 8 | Switch any off |
| Impostors | 1; 2 offered from 8 players | |
| Settings (menu) | Discussion 60 s; one clue round; kids' rule off | |

**Target:** 30 s for a group that played earlier tonight; under 90 s the first time (typing names).
**Late joiner:** "Add player" between rounds; they join from the next round, scoring from zero.
**Someone leaves:** remove between rounds; their points stay on the scoreboard.

## Stage 3. Teach
| Moment | What the app does |
|---|---|
| First round of the evening | Before the deal, a **"Read this aloud"** card: "Everyone gets the same secret word, except one impostor who gets none. Say one word each about it. Then point at who you think the impostor is. Impostor: blend in, and guess the word if you're caught." One button: "Got it, deal". Skippable with "We know it". |
| First round, newcomers present | Optional **practice round** (setting on the card): played normally, but no points |
| During the deal | The reveal screen says what to do: crew "Your word: **Biryani** · Give one-word clues. Don't say it!"; impostor "**You are the impostor** · Category: Food · Listen, blend in, guess the word" |
| During clues | "Rules" in the menu, never showing anyone's word |
| After the reveal | One line on why: "Arjun was the impostor. The word was Biryani." |

## Stage 4. Play
**The deal (pass the phone), one player at a time:**
```
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Pass the phone to │   │   Riya            │   │ Done? Let go and  │
│                   │   │                   │   │ pass to           │
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
- "Start discussion" runs a big 60-second timer everyone can see; "Skip" ends it.

**Vote:**
- "Get ready to point… 3, 2, 1, **point!**" (voice and big numbers).
- The host taps who has most fingers: "Who was accused?" with each name, plus "It's a tie" → pick the tied players
  → one re-vote → still tied, the impostor escapes.

**Reveal:** a short drum-roll screen, then "**Arjun was the impostor!** The word was **Biryani**." or "**Meena was
crew.** The impostor was Arjun. The word was Biryani."
**Last guess** (only if caught): "Arjun, guess the word aloud." The room decides: "Guessed right" / "Wrong".

**Moments every game must handle**
| Moment | Behaviour |
|---|---|
| Phone locks or a call comes during the deal | Resumes at "Pass the phone to <next>", never on a word |
| App closed mid-round | Reopens at the same step; the word only reappears by "hold to see" for a chosen player |
| Someone forgets their word | Menu: "See my word again" → "Pass the phone to…" pick a name → hold to see. Family trust, like Tambola's anchor |
| Someone glimpsed another's screen | Menu: "Redeal this round" (new word, new impostor), no points |
| Phone dies | Paper: one person sits out, writes slips; the guide's "How to play" works without the app |
| Ending early | "End the evening" any time between rounds; mid-round, the round is dropped with no points |

## Stage 5. After the round, after the evening
| Moment | What happens |
|---|---|
| Round result | Points for this round, then the **night's scoreboard** (one row per player, sorted) |
| Next round | "Next round" (main): new word, never one used tonight; new impostor at random; the starter moves on one seat |
| Who's impostor next | Purely random each round, so nobody can rule themselves out (convention); a player may be impostor twice in a row |
| End the evening | Final scoreboard with the winner and fun lines ("Best impostor: Arjun, escaped 3 times"); "Play something else" back to Home; the session keeps the totals |
| Words afterwards | The history shows each round's word and impostor (fun to look back on). Words used in the last 3 evenings are avoided when possible |
| Play again tomorrow | A new evening; the player list is offered again |
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
1. The dealer picks a word from the Multicultural samples in `words.md`, writes it on all slips but one
   ("IMPOSTOR · Category: Food"), folds them, and hands them out at random.
2. The dealer names a starter (never the impostor), runs a 60-second timer on a phone, counts "3, 2, 1, point!".
3. Note afterwards: did anyone not know a word? Was one-word clues right, or too hard for kids? Was 60 seconds
   too long or short? Did the impostor ever guess the word? Did the scoring feel fair? Did anyone want to see
   their word again? Which category was most fun?

## UX notes (checked against `docs/ux-guidelines.md`)
- One main button per screen (17a): "I'm Riya", "Start round", "Next round".
- Hold-to-see must also work for people who can't hold (accessibility): a "Tap to show / Tap to hide" setting.
- Screen readers: the word is read only while held, and never announced on the shared screen.
- Nothing flashes during the reveal; the drum-roll is sound plus a calm animation (reduce motion respected).
- Landscape and 320 px: the deal screens are one name and one button, so they fit anywhere; check the scoreboard
  with 10 players at 360 × 640.
- Tone: a caught impostor gets a laugh ("Caught red-handed!"), never a put-down.
