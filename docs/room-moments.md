# Real moments at a game night (every game) — owner, 4 October 2026

Owner: "focus more around things like more players wanting to join, someone leaving… think of actual scenarios during
a session." Every game's design starts from this list (new-game process step 0a) and every player run tries them.
Checked first against Impostor (the build of 4 October, three player runs and the UX "What next?" pass).

Labels: **Must** = before the Impostor release; **Next** = after it; **Later** = with a later phase.

## People coming and going
| # | Moment in the room | What should happen | Impostor today | Decided |
|---|---|---|---|---|
| M1 | Someone arrives **mid-round** and wants in | Add them now; they join from the next round, and the room can see it ("Joining next round: Zoya") | "Players" mid-round only says "Change players after this round." | **Must**: Players works mid-round for adding; newcomers wait for the next deal; a small line on the clues, talk and picker screens names them |
| M2 | Someone arrives **between rounds** | One visible tap to add them | Players is only in the menu | **Must**: "Players (5) ›" visible on the round result, beside the evening line or scoreboard |
| M3 | **Several** people arrive at once | Type names quickly, Enter after each | Fast typing with Enter loses names | **Must**: every Enter adds the name typed, however fast |
| M4 | Someone has to **leave mid-round** | Let them go without spoiling the round or revealing anything | Not possible until the round ends | **Must**: Players mid-round can remove someone; the app asks "Finish this round first" (main: they stay in the vote, removed after) or "Deal again without Kabir" (new word, new impostor). Never reveals whether the leaver was the impostor |
| M5 | Someone leaves **between rounds** | Remove them; points kept | ✕ in Players (menu-only) | Covered once M2 makes Players visible |
| M6 | Someone **steps out for a few rounds** (phone call, kitchen) and comes back | Sit out without losing seat or points; back in with one tap | Remove and re-add (points kept on re-add) | **Next**: "Sitting out" switch per player |
| M7 | Leaving takes the game **below 3 players** | Say so and offer a way on | Removal refused with "Keep at least 3 players." | **Must**: when someone must leave and only 2 would remain: "3 players needed. Add someone, or end the game." with "Add a player" / "End game" |
| M8 | A name was **typed wrong** | Fix it in a tap | Remove and re-add | **Next**: tap a name in Players to edit it |
| M9 | Two people with the **same name** | Tell them apart | "Riya is already playing. Add an initial, like Riya S." | Covered |
| M10 | A **child joins a parent** as one player | Play as a pair | Not possible | **Later** |

## Breaks, switching and ending
| # | Moment | What should happen | Impostor today | Decided |
|---|---|---|---|---|
| M11 | **Dinner is ready** mid-round | Stop now, keep everything, come back later | Only "End the evening" in the menu; closing the app works but nobody knows | **Must**: menu item "Home (game is saved)" during a round as well; between rounds "← Home" (I25) |
| M12 | **Back after the break** | Find our game at once | Unfinished games show only a time ("Impostor, 8:13 pm, round 1"); two can look the same | **Must**: label with names: "Impostor · Hansa, Raju +3 · round 2" |
| M13 | **Switch to Tambola** and back later | Same people carried over; Impostor waits to resume | Works, but finding it again is hard (M12) | Covered with M12 |
| M14 | **Stop for tonight** | A clear stop with a result | Hidden "End the evening" | **Must**: "End game" visible (I25) |
| M15 | **Play again** with the same people | One tap | Not built | **Must**: "Play again" (I25) |
| M16 | **Who won the whole night** across games | A night summary | Not available | **Later** |

## Mistakes and fairness
| # | Moment | What should happen | Impostor today | Decided |
|---|---|---|---|---|
| M17 | The **wrong person** tapped "I'm Riya" | Go back before any word shows | No way back | **Must**: "Not Riya? ← Back" under the pad before the first hold |
| M18 | A quick **double tap** while passing | Never skip a player's screen | A double tap jumped past "Pass the phone to ARJUN" | **Must**: a tap within 0.5 s of a new screen does nothing (guideline 20) |
| M19 | Someone **forgot their word** | Visible way to see it again | Menu-only | **Must**: small "See my word again" on the clues and talk screens |
| M20 | Someone **peeked** or **said the word** | Deal again | "Deal again with a new word" in the menu | Covered |
| M21 | The host **changed a setting** and pressed Back | Keep the change | Back silently threw it away | **Must**: Back keeps the change (records it), applied from the next round |
| M22a | **"It's a tie"** tapped | Say what to do next | "Point again" greyed with no instruction (player run and UX pass) | **Must**: heading "Tap everyone who is tied"; quiet "Not a tie" goes back |
| M22b | One hand busy (plate, drink) on the hold screen | Hard to hit the wrong button | "Tap instead" sits right next to the big "Done" | **Must**: "Tap instead" moves up under the name, at least 48 px away from "Done" |
| M22c | One player's "See my word again" ends | Back to where we were | The button says "Done, everyone's seen" | **Must**: "Done, back to clues" (or "…back to talking") |
| M22d | Wrong person voted out, impostor escaped | Undo it | Not possible (a reveal can't be undone, guideline 47) | **No change**: "Reveal Arjun" is the safety; explained in How to play |
| M22e | Switch to Tambola and keep the Impostor scores | Leave without ending | Only "End the evening" | Covered by "← Home" (I25): the game stays saved |
| M22f | Tambola after Impostor reuses tonight's names | Names carried over | Tambola didn't take them | **Next**: platform (PLT-024) |
| M22 | "Start new?" when an old game exists | Equal, clear choices, asked once | Asked twice; the risky-looking red button | **Must**: asked once; "Carry on that game" and "Start new" look equal; "Start new" goes straight on |

## Comfort and words
| # | Moment | What should happen | Impostor today | Decided |
|---|---|---|---|---|
| M23 | An elder needs **bigger text** | Find it without the menu | Settings → Larger text | **Next**: an "Aa" button on the choices screen |
| M24 | Words families don't use | Plain words | "crew", "steal the round", "Most fingers is revealed", "evening" | **Must**: "game" everywhere (I25); "The crew wins!" → "You caught the impostor!"; "steal the round" → "win the round"; "Whoever gets the most fingers is revealed." |
| M25 | A button label cut off | Whole label visible | "Clues done, start the 2-minute ti…" at 360–375 px | **Must**: "Clues done, start timer" |
| M26 | Bad test data on a phone (preview only) | Never a silent dead button | "Start round" did nothing | **Must**: test seeds that don't fit the players are ignored; any round that can't start says why |

## After round 5 (6 October)
| # | Moment | Finding | Decided |
|---|---|---|---|
| M27 | Talk screen | Jev (60-evening run 37278246923) would tap "See my word again" (0.65) over "Vote now" | **Next**: show "See my word again" as a smaller text link so "Vote now" stands out; harmless meanwhile (it returns to talking) |

## Player runs before the 1.3.0 freeze (6 October; three players, one at a time, cleared data)
Verdicts: party host "yes, without help"; grandmother "almost"; child in landscape "fun and mostly clear".
| # | Finding (players) | Decided |
|---|---|---|
| P1 | "See my word again" → wrong name: no way back; one run saw "You're the impostor" (all 3) | **Must**: "Not Pinky? ← Back" on its screen A and on screen B until the first hold, back to "Whose word?" (as M17) |
| P2 | Double tap on "Next" lands on "Start round" in the same spot and skips the choices (child) | **Must**: the 500 ms tap guard also on the setup screens ("Who's playing?", choices, How to play) |
| P3 | "Oops, keep playing" hidden under "More ›"; two players expected "Are you sure?" after End game | **Must**: "Oops, keep playing" back as a visible quiet button at the top of the summary (no confirmation added) |
| P4 | Content under the pinned buttons: score rows, "Home" under "Play again"; sideways: a vote name, "Golu escaped!", help text, the Players Add box, "More ›" squeezed | **Must**: every screen leaves room above the pinned buttons so everything scrolls into view; sideways layouts re-checked at 812 × 375 with 5 players |
| P5 | Labels cut off: "Talking" behind "Free flow", "Your secret" at the top of the hold screen | **Must** |
| P6 | Tapping Hard removed "Same as last time" and the page jumped, so the next tap missed (child) | **Must**: the line stays until the screen is left (nothing moves, as 45a) |
| P7 | No "Cancel" when removing a player | **Must**: quiet "Cancel" in "Kabir has to leave?" |
| P8 | "Hansa, Raju +3" unclear | **Must**: "Hansa, Raju and 3 more" |
| P9 | Red "Add at least 3 players." before typing | **Must**: grey hint until someone tries "Next" |
| P10 | "Impostor" never explained | **Must**: How to play starts "One player is the impostor: they don't know the secret word." |
| P11 | "Larger text" made no visible difference (grandmother) | **Must**: tester checks IMP-109 on every Impostor screen; fix if not applied |
| P12 | Words: "Bharatanatyam" under Whole family; hint "Creases" | Done in words.csv: Bharatanatyam → grown-ups; Iron box hint "Wrinkles" |
| P13 | Settings from Home full of Tambola words; menus look different | Next |
| P14 | Can't switch to Hard mid-round (only between rounds) | Next: say so in the mid-round menu ("Change how we play after this round") |
| P15 | Resume card pushes Tambola down; "Unfinished games" below the fold sideways | Next |
| P16 | Players sheet doesn't say when a newcomer plays | Next: "Isha joins next round" inside the sheet |
| P17 | "Play something else" / Tambola don't reuse tonight's names | Next (platform) |
| P18 | "I'm Golu" ignored for about a second after a pass, with no sign | Next: a brief pressed look |

## Player re-run after round 6 (6 October)
P1 (wrong name in "See my word again") and P3 (visible "Oops, keep playing") **pass**; P2 passes on "Who's playing?";
P4 passes on the vote, result, Players and "Whose word?" screens.
| # | Finding | Decided |
|---|---|---|
| R1 | Sideways (812 × 375), the in-round "··· Menu" cuts off its last item "End game" and doesn't scroll (child) | **Must**: menus scroll inside the screen and every item is reachable at 812 × 375 and 320 × 568 |
| R2 | The double-tap guard is not everywhere: a double tap on "End game" hits "Play again" (winner screen skipped), on "Clues done…" hits "Vote now" (talk skipped), on Home's "Host a game" opens Tambola | **Must**: the 500 ms guard applies to every button on every Impostor screen and on Home and "What shall we play?" (Tambola's own fast buttons keep TAM-101) |
| R3 | A double tap selects all the screen's text (it turns blue) | **Must**: app text is not selectable by tapping (except text fields) |
| R4 | "Freeflow", "Wholefamily": the space squeezed out | **Must**: option labels keep their spaces (tighter spacing only within words) |
| R5 | "Who's playing?" empty after going Home and starting again (child) | **Must-check**: tester confirms IMP-004 (tonight's names filled) |
| R6 | "Play again" vs "Oops, keep playing": unclear which keeps the score (grandmother) | Next: "Play again" gets the line "New game, same players" |
| R7 | Long phrase secrets ("Dancing uncle at the wedding") and hard hints ("Signature step") | Next: word-list pass |
| R8 | Tapping a name during "Get ready to point…" does nothing, with no sign | Next |
| R9 | The impostor also sees "Don't know this word?" (by design) | Next: friendlier wording, same for everyone |
| R10 | One Enter after a name didn't add it (grandmother, slow typing) | **Must-check**: tester confirms M3 |
