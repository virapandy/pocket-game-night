# Impostor: scenario drafts (product owner, 3 October 2026)

Status of every scenario below: **draft**, for the owner's approval. After approval, the tester copies them into
`specs/impostor/` (file names in each heading) and writes tests. **Hand-over only after the Tambola release**
(`docs/roadmap.md`). Template: `specs/README.md`. Prefix `IMP-`; platform behaviour `PLT-`.

**Checked three ways (process step 9), 3 October:** every rule in `guide.md` has a scenario (room-only rules such as
"no rhymes" are in the read-aloud card and Rules, IMP-070, IMP-072); every stage and moment in `lifecycle.md` and
every screen in `ux.md` has one; every UX guideline that applies (13, 14, 17a, 17b, 18, 21, 24–28, 26a, 32–35, 45–48)
is in 09-usability or named in a scenario. Contract: fits the existing engine (viewers host, room and player; the
deal shows each player's view on the host phone in turn); secrets: a word-and-impostor seed and a separate starter
seed. No engine change expected.

Phase lines: **Impostor 1** = the first release (one phone, Multicultural words). **Impostor later** = designed
now, built later (own phones, regional themes, twists).

Change classes (`docs/change-sop.md`): rules, secrets and seeds, saved evenings, the word list format = **C3**
(tests first); screens = C1/C2.

Sources: `guide.md` (rules), `lifecycle.md` (stages, moments), `ux.md` (every screen, decided with the UX
designer), `words.md` / `words.csv` (words), `docs/decisions.md` I1–I20.

---

## 01-setup.md: getting to the first deal

## IMP-001: "Host a game" offers Tambola and Impostor
Phase: Impostor 1
When the host taps "Host a game" on Home (Home itself is unchanged, PLT-300)
Then "What shall we play?" shows two equal cards: Tambola "Housie on paper or phones · 2 hrs" and
Impostor "Find who doesn't know the word · 3–20 players · about 4 min a round"
And tapping a card moves on, with no separate main button
And an unfinished game shows above the cards: "Impostor · round 4 · Tap to resume"

## IMP-002: A guest is told there's nothing to join
Phase: Impostor 1
When a guest opens "Join with my ticket"
Then the screen ends with "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!"

## IMP-003: Players are added in seat order, without dragging
Phase: Impostor 1
When the host adds Riya, Arjun, Meena and Kabir
Then they are listed 1 to 4 in that order, which is the passing order and the clue order
And ▲ and ▼ (each at least 44 × 44 CSS px) move a player, and ✕ removes them (guideline 21: no dragging needed)
And names are at most 16 characters; a duplicate gets "Riya is already playing. Add an initial, like Riya S."
And "Next" is enabled only with at least 3 players, with "Add at least 3 players." until then

## IMP-004: Tonight's names arrive filled in
Phase: Impostor 1
Given Tambola or Impostor was played tonight with Riya, Arjun and Meena (PLT-016)
When the host opens Impostor
Then "Who's playing?" already lists them, with a quiet "Clear list"

## IMP-005: The four choices are asked once, with these defaults
Phase: Impostor 1
When the host reaches "How do you want to play?"
Then it shows four two-way choices, each with a one-line explanation:
Mode **Easy** / Hard; Talking **Free flow** / Timer; Score **No** / Yes; Words **Whole family** / + Grown-ups
And the defaults are the first of each pair
And a chosen option has an outline and ✓, never the main-button look (guideline 17a)
And "Start round" is the one main button

## IMP-006: The choices are remembered for the evening and can be changed between rounds
Phase: Impostor 1
Given the host chose Hard and Timer
When the next round starts
Then Hard and Timer still apply
And "Change how we play" in the menu between rounds reopens the choices
And mid-round it is not offered

## IMP-007: Categories, and one impostor
Phase: Impostor 1
Then all 9 categories are on by default and any can be switched off, but not all of them
And non-veg food words are off unless "Include non-veg food" is switched on
And every round has exactly one impostor (two impostors come after the play-test, IMP-036)

## IMP-008: Time to the first deal
Phase: Impostor 1
Given a group that played Impostor earlier tonight
Then from tapping the Impostor card to the first "Pass the phone to…" takes at most 3 taps with the defaults
(a usability target of about 30 seconds; first time with typing names, under 90 seconds)

---

## 02-deal.md: passing the phone

## IMP-010: Each player sees their role privately, in seat order
Phase: Impostor 1
Given Riya, Arjun, Meena and Kabir, Arjun is the impostor, and the word is Samosa
When the round is dealt
Then the phone shows "Pass the phone to RIYA" with the main button "I'm Riya"
When Riya presses and holds the "Hold here to see your word" pad
Then "Your secret: Samosa" shows above the pad, never under her finger
When she lets go
Then the word disappears at once and the pad is offered again
And after her first hold of at least 0.5 seconds, the main button "Done, pass to Arjun" appears
When she taps it
Then the phone shows "Pass the phone to ARJUN", and so on in seat order
And the last player's button says "Done, everyone's seen"

## IMP-011: What each role sees depends on the mode
Phase: Impostor 1
Given the word is Samosa (category Food, hint "Tea time")
Then while holding, every role sees a block of the same shape:
| | Crew | Impostor |
| Easy | Your secret · **Samosa** · Category: Food · Give one-word clues. Don't say it! | Your secret · **You're the impostor** · Category: Food · Hint: Tea time · Listen, blend in, guess the word. |
| Hard | Your secret · **Samosa** · Give one-word clues. Don't say it! | Your secret · **You're the impostor** · Listen and blend in. Guess the word if caught. |
And the impostor never sees the word
And a word's other names show in a small line ("Also called Payasam")

## IMP-012: The impostor's turn looks exactly like everyone else's
Phase: Impostor 1
Then every role's turn has the same steps, buttons, background, block shape, a 10 ms vibration on press, no sound on
reveal, and "Done" appearing at the same moment (guideline 45)
And the private text is 34–40 CSS px, sized for one reader at arm's length
And nothing before the hold differs by role (a property check over many deals)

## IMP-013: The word is never on screen or in the page except while held
Phase: Impostor 1
Then a player's word or role is in the page only while it is being held (or shown in tap mode): not as hidden text,
not in the title, not in History during the round
And it hides on lift, on the finger being cancelled, on scroll or zoom, and when the app goes to the background
And when the app is hidden a blank cover is drawn, so the app-switcher thumbnail shows nothing
And long-pressing the pad or the word never opens text selection, a copy or look-up bubble, a magnifier, a context
menu or a drag (checked on Android Chrome and iPhone Safari)

## IMP-014: Tap to show, for players who can't hold
Phase: Impostor 1
Given "Tap to show" is switched on in Settings, or the player taps "Tap instead" on their own turn
Then "Tap to see your word" shows it and "Tap to hide" hides it
And it hides by itself after 8 seconds, then "Done, pass to…" appears
And the Settings line warns: "Your screen reader will say the word out loud. Use earphones or turn the volume down."

## IMP-015: "Don't know this word?" redeals without giving anything away
Phase: Impostor 1
Given Meena has held to see her word
When she taps the quiet "Don't know this word?"
Then the phone shows "No problem! New word coming. Pass the phone back to RIYA" and the whole round is dealt again
with a new word and a new random impostor
And the button has the same label and place on the impostor's screen and behaves the same
And the skipped word is not used again tonight

## IMP-016: After the last player, straight to the clues
Phase: Impostor 1
When the last player taps "Done, everyone's seen"
Then one screen shows "✓ Everyone has seen their word. Phone in the middle, face up.", the starter (IMP-020) and the
seat order, with the main button "Talk it over" (Timer: "Start the 2-minute timer")

## IMP-017: See my word again
Phase: Impostor 1
Given the clues have started
When the host opens the menu and taps "See my word again"
Then it asks "Whose word?" with the player names
When Meena's name is picked
Then "Pass the phone to MEENA" and the hold pad follow, exactly as in the deal
And after "Done" the screen returns to where it was

---

## 03-clues-and-talk.md

## IMP-020: Who starts
Phase: Impostor 1
Then the clues screen shows "MEENA starts, then clockwise: Meena → Kabir → Zoya → Riya → Arjun", the starter's name
at least 56 CSS px
And the starter is chosen at random among the players
And in **Hard** mode the starter is never the impostor; in Easy mode it may be

## IMP-021: The starter moves round
Phase: Impostor 1
Then over the rounds of an evening, a different starter is picked each round until everyone has started once,
then the cycle repeats (still never an impostor in Hard mode)

## IMP-022: One round of clues; a second round for small groups
Phase: Impostor 1
Then with 3 to 5 players a quiet "Another round of clues" is offered on the clues screen

## IMP-023: Free flow
Phase: Impostor 1
Given Talking is Free flow
Then the talk screen shows "Talk it over" (at least 56 CSS px) and "Who sounded unsure?", with the main button
"Vote now", and no timer

## IMP-024: Timer
Phase: Impostor 1
Given Talking is Timer
Then a 2-minute countdown is shown at least 120 CSS px tall, with "Vote now" (main) and a quiet "Pause"
And at 0:00 a gentle chime plays (if sound is on) and "Time's up!" shows with the main button "Get ready to point"
And it never moves on to the vote by itself (guideline 48)

## IMP-025: Deal again with a new word
Phase: Impostor 1
When the host opens the menu during a round and taps "Deal again with a new word"
Then it asks "Deal again? This round won't count. For when someone said the word or saw a screen." with
"Deal again" and "Keep playing" (main)
When the host taps "Deal again"
Then a new word and a new impostor are dealt to the same players, from the first player, with no points


---

## 04-vote-and-reveal.md

## IMP-030: The countdown to point
Phase: Impostor 1
When the host taps "Vote now" (or "Get ready to point")
Then the phone shows "Get ready to point…" for 1 second, then "3", "2", "1" at least 200 CSS px, one per second,
then "Point!" for 2 seconds
And a soft tick plays on each number and a ding on "Point!" (if sound is on); the numbers are spoken only if the
phone voice is on
And with reduce motion on, the numbers change without scaling

## IMP-031: Recording who was accused: pick, then reveal
Phase: Impostor 1
Then "Who got the most fingers?" shows every player as a name button, plus quiet "It's a tie" and "Count again"
When the host taps Arjun
Then Arjun is selected (outline, ✓, tint) and nothing is revealed
And the main button reads "Reveal Arjun"
When the host taps "Reveal Arjun"
Then the reveal starts (guideline 47)

## IMP-032: A tie gets one re-vote
Phase: Impostor 1
When the host taps "It's a tie" and picks Arjun and Meena
Then the main button reads "Point again: Arjun or Meena", which runs the countdown
And the picker then offers only Arjun, Meena and "Still a tie"
When the host taps "Still a tie"
Then the impostor escapes

## IMP-033: Caught: the guess comes before the word is shown
Phase: Impostor 1
Given Arjun is the impostor and the word is Samosa
When "Reveal Arjun" is tapped
Then after a 2.5-second build-up ("Arjun was…", calm dots, no colour change) the phone shows
"Caught red-handed! ARJUN was the impostor."
And then "Arjun, one guess. Say it out loud! (No repeating the clues.)" with the main button "Show the word"
And the word is not on screen until "Show the word" is tapped
When it is tapped
Then the word and its other names show, with two equal buttons "Guessed right" and "Wrong guess"

## IMP-034: The reveal when the crew got it wrong
Phase: Impostor 1
When Meena is revealed but Arjun is the impostor
Then the phone shows "Meena was crew!", then "The impostor was ARJUN. Escaped!", then "The word was Samosa."
And there is no last guess

## IMP-035: The room judges the last guess
Phase: Impostor 1
When the room agrees Arjun's guess "Kachori" is wrong and the host taps "Wrong guess"
Then the round ends with "The crew wins!"
When instead the host taps "Guessed right" (another name of the word counts, e.g. "Golgappa" for Pani puri)
Then "Arjun steals the round!"

## IMP-036: Two impostors (after the play-test)
Phase: Impostor later
Given 8 or more players and 2 impostors chosen
Then both impostors see "You're one of 2 impostors" and never who the other is
(The vote and reveal for two impostors are designed after the play-test.)

## IMP-037: Undo before the next round, never undo a reveal
Phase: Impostor 1
When the host taps the wrong guess verdict
Then the quiet "Undo" on the result screen goes back to "Guessed right" / "Wrong guess", until "Next round" is tapped
And a reveal is never undone (it is protected by "Reveal Arjun", IMP-031), and the deal is never undone
(use "Deal again with a new word")

---

## 05-scoring.md

## IMP-040: No points by default
Phase: Impostor 1
Given Score is No
Then no points are shown anywhere
And the round result shows a running line for the evening: "Impostor caught 3 · escaped 2"

## IMP-041: Points when keeping score
Phase: Impostor 1
Given Score is Yes
Then an impostor who escapes gets +2; caught but guessed right +1; caught and wrong: every crew member +1
And the night's scoreboard lists every player with their total, highest first, ties sharing a place
And there is no target score

## IMP-042: Points always add up
Phase: Impostor 1
Then for thousands of random evenings, every player's total equals the sum of their round points, and a round's
points match its outcome exactly (property check)

## IMP-043: Turning score on mid-evening
Phase: Impostor 1
When the host switches Score to Yes between rounds
Then scoring starts from the next round, and the scoreboard says "Scores from round 4"

---

## 06-words.md

## IMP-050: Words come from the Multicultural list with the chosen audience
Phase: Impostor 1
Given Words is Whole family
Then only words marked "family" are dealt
And with "+ Grown-ups", family and grown-up words are both used
And only from categories that are on, and non-veg only if switched on

## IMP-051: No word repeats in an evening
Phase: Impostor 1
Then within one evening no word is dealt twice, including skipped and redealt words (property check)

## IMP-052: Recent evenings' words are avoided
Phase: Impostor 1
Then words used in the last 3 evenings on this phone are picked only when no unused word is left
And when every allowed word has been used tonight, the phone says "You've played every word in these categories
tonight! Turn on more categories or + Grown-ups" and offers to allow repeats

## IMP-053: Both names are shown where a thing has two
Phase: Impostor 1
Given the word is "Kheer / Payasam"
Then the crew see both names, exactly as in the list

## IMP-054: Every word in the list is valid
Phase: Impostor 1
Then every word in the shipped list has: a category from the 9, audience family or grownups, non-veg yes or no,
an Easy-mode hint that is not the word itself or one of its names, and no duplicate word (a content check)

---

## 07-secrets-and-seeds.md (C3)

## IMP-060: The word and the impostor come from their own seed
Phase: Impostor 1
Then each round's word and impostor(s) are drawn from a secret seed made fresh on the phone, separate from the
starter's seed
And replaying an evening with the same seeds gives the same words, impostors and starters

## IMP-061: Impostor choice is fair, with no 3 in a row
Phase: Impostor 1
Then over many evenings each player is impostor about equally often (property check)
And no player is impostor in 3 rounds running
And being impostor in the last round never makes it certain you are not impostor now

## IMP-062: The host sees nothing secret
Phase: Impostor 1
Then the host's screens (between turns, the menu, Settings, History during the round) never show the word or who
the impostor is until the reveal (the host plays too)

## IMP-063: Every crew member has the same word, every impostor none
Phase: Impostor 1
Then in every dealt round all crew see the same word and the number of impostors is exactly as set (property check)

---

## 08-room-host-and-teach.md

## IMP-070: The read-aloud card on the first round
Phase: Impostor 1
When the first round of an evening is about to be dealt
Then a "Read this aloud" card shows four short lines (see `ux.md`), with "Start the deal" (main) and a quiet
"Practice round first"
And it does not appear again that evening

## IMP-071: Practice round
Phase: Impostor 1
When the host taps "Practice round first"
Then the next round is played normally, with a "Practice" chip on every room screen, no points, and not counted in
the evening's line

## IMP-072: Rules mid-game never show secrets
Phase: Impostor 1
When anyone opens "Rules" from the menu during a round
Then the rules for the chosen mode are shown, with no word, hint or role

## IMP-073: The phone in the middle is readable across a table
Phase: Impostor 1
Then on a 390 × 844 screen the starter's name and "Talk it over" are at least 56 CSS px, the timer at least 120 CSS
px, and the countdown numbers at least 200 CSS px (guideline 46)

## IMP-074: Late joiner and someone leaving
Phase: Impostor 1
When the host adds Zoya between rounds (menu → Players)
Then she is added at the end, can be moved to her seat with ▲ ▼, and is dealt in from the next round (at 0 if
keeping score)
When the host taps ✕ next to Kabir between rounds
Then he is removed at once with "Kabir left. Points kept · Undo"; his points stay on the scoreboard, greyed
And during a round, Players shows "Change players after this round."

---

## 09-usability.md

## IMP-080: One main button per screen
Phase: Impostor 1
Then every Impostor screen has exactly one solid main button, and it is the next step (guideline 17a)

## IMP-081: Nothing scrolls during a round
Phase: Impostor 1
Then the deal, clues, talk, countdown, reveal and result screens need no page scrolling at 320 × 568, 360 × 640,
390 × 844 and 812 × 375, with Larger text on and names up to 16 characters (names shrink to 32 CSS px to fit)
And the longest word in the list ("Five more minutes, then phone off") fits in at most 3 lines at no less than 30 CSS px

## IMP-082: Lists with many players
Phase: Impostor 1
Then "Who got the most fingers?" and the scoreboard show 12 players without scrolling at 390 × 844
And on smaller screens or with Larger text the list scrolls inside, with the main button fixed at the bottom and the
outcome line still visible

## IMP-083: Screen readers
Phase: Impostor 1
Then the clue order, the timer at each minute, each countdown number and every reveal are announced (guideline 26a)
And the hold pad is a button named "Hold to see your word"
And a player's word is announced only on their own turn, from a live region that is emptied when it hides, and never
on a shared screen

## IMP-084: No flashing
Phase: Impostor 1
Then no reveal or countdown flashes more than 3 times a second, and crew and impostor results don't differ by a
sudden colour flash

## IMP-085: Kind words
Phase: Impostor 1
Then every result line is light ("Caught!", "Arjun steals the round!", "Meena was crew!") and none names a
player as a liar or a loser

## IMP-086: A slipped finger costs nothing
Phase: Impostor 1
When a player's finger slips off during hold-to-see
Then the word hides, the pad is offered again, and no step is skipped (the phone moves on only with "Done")

## IMP-087: The screen stays awake during a round
Phase: Impostor 1
Then the screen stays awake from the first "Pass the phone to…" until the round result (guideline 32)

## IMP-088: The choices fit small phones and landscape
Phase: Impostor 1
Then on "How do you want to play?" each choice is one row with only the chosen option's line shown, fitting 320 × 568
without scrolling (Larger text may scroll, with "Start round" fixed)
And in landscape 812 × 375 the four choices sit in a 2 × 2 grid and "Start round" hides none of them (guideline 17b)

---

## 10-lifecycle.md

## IMP-090: Interrupted during the deal
Phase: Impostor 1
When the phone locks, a call comes in, or the app is closed during the deal
Then on return it shows "Welcome back. Pass the phone to ARJUN", naming the player who hasn't tapped "Done", never a word

## IMP-091: Interrupted later in a round
Phase: Impostor 1
When the app is closed during clues, talk or the vote and reopened within 3 hours
Then it returns to the same step; the timer shows "Paused · Tap to carry on"; a countdown restarts at "Get ready to
point"; after "Reveal" it shows the outcome without the build-up
And reopened after more than 3 hours: "This round was left halfway. Start a fresh round?" with "Next round"

## IMP-092: Ending and discarding the evening
Phase: Impostor 1
When the host taps "End the evening" between rounds
Then the evening's summary shows (fun lines; the final scoreboard if keeping score) and it is kept in History
When the host chooses "Discard the evening" after confirming
Then the evening and its scores are thrown away

## IMP-093: Ending mid-round
Phase: Impostor 1
When the host ends the evening during a round
Then that round is dropped with no points, after "End now? This round won't count."

## IMP-094: What History keeps
Phase: Impostor 1
Then a finished evening keeps: players, choices, and for each round the word, impostor(s), accused, guess result and
points; plus its seeds for exact replay
And it never shows a round's word while that round is still being played

## IMP-095: Fun lines at the end
Phase: Impostor 1
Then the summary picks up to three true lines, e.g. "Best impostor: Arjun, escaped 3 times", "Sharpest eyes: Riya
caught the impostor 4 times" (only with scores), "Rounds played: 7"

## IMP-096: Saved evenings carry a format version
Phase: Impostor 1
Then a saved evening has a format version, and older formats always still open (principle; PLT-001)

---

## Later (designed, not in the first release)

## IMP-200: Regional word themes
Phase: Impostor later
Then Full Desi, Tamil, Telugu, Malayalam, Kannada and Bengali themes can be chosen, each with its own list

## IMP-201: Each player's own script
Phase: Impostor later
Then on their own hold screen a player can switch the word's script; the choice is remembered for the evening

## IMP-202: Players' own phones (with connected mode)
Phase: Impostor later
Then each player sees "Hold to see" on their own phone; the host phone shows only room screens

## IMP-203: Twist rounds
Phase: Impostor later
Then a rare optional twist: no impostor, or everyone an impostor, revealed at the end

## IMP-204: Undercover variant
Phase: Impostor later
Then the impostor gets the word's close cousin instead of nothing, and may not know they are the impostor
