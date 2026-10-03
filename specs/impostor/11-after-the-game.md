# 11-after-the-game.md (shared rules: `specs/platform/01-lifecycle.md`, PLT-001 to PLT-029)

Copied unchanged from `docs/games/impostor/scenarios.md` (version 3.5, 4 October 2026), the binding contract. Terms, Canonical strings and Test hooks: [README.md](README.md).

## IMP-100: After the round, the phone can rest
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
When the round is completed (IMP-087 names the moment for each result)
Then the wake lock is released exactly as IMP-087 says, and nothing still secret is on screen (the word and the
impostor are shown by then)

## IMP-101: Ended by mistake
Status: approved, owner, 2026-10-04 (changed; changed 3 October for engine fit; owner informed)
Phase: Impostor 1
Given the summary shows after "End the evening" (or "End now")
Then the evening is still in progress (`status` "in-progress", no `endEvening` yet), and `pgn.impostor-ui.<id>`
holds `summaryShownAt`
When the host taps "Oops, keep playing"
Then the summary goes and the evening is exactly where "End the evening" or "End now" was tapped (between rounds:
the same result screen, with "Undo" when its window is open, IMP-037); nothing is recorded and nothing is lost
And `endEvening` is recorded when the host leaves the summary screen: "Back to Home", "Play something else",
"History" (in "More ›"), or "Discard this evening" then "Discard" (which deletes instead). "Share" does not leave it, and a share
sheet's return does not count
And when the app is closed and reopened while the summary was showing, the summary shows again until it is left,
with "Oops, keep playing" only within 3 hours of `summaryShownAt` (IMP-099); Home and "What shall we play?" list such
an evening as unfinished (IMP-001)
And 3 hours after `summaryShownAt` (IMP-099) `endEvening` is recorded by itself; the summary, if still on screen,
then has no "Oops, keep playing"
And History never offers to reopen an ended evening (PLT-008)

## IMP-102: Something else tonight, with the same people
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Play something else" on the summary
Then "What shall we play?" opens, and the next game's players arrive filled in (IMP-004, PLT-024)
And the Impostor evening belongs to tonight's session (PLT-016) and stays out of any money tally (PLT-023); the
session screen lists it as one `session-game` reading "Impostor · 7 rounds"
And when Tambola is picked and Tambola has an unfinished setup (PLT-006), that setup opens exactly as it was saved
(its own names); tonight's names fill only a new Tambola setup (product owner, 4 October)

## IMP-103: Play again another day
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Given History lists only evenings that replay (evenings saved before version 3.1 without word ids are hidden,
IMP-096)
When the host taps "Play again" on a past evening in History (PLT-009)
Then "Who's playing?" opens with that evening's players in its final seat order (leavers left out), then "Next"
opens "How do you want to play?" with that evening's final choices (IMP-009)
And "Start round" starts a new evening in tonight's session (IMP-009), with the words of the last 3 evenings
avoided (IMP-052)

## IMP-104: An evening left open ends by itself
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Given an evening was left unfinished
When the app is opened more than 12 hours after the move that completed its last round (IMP-099)
Then the evening is ended with `endEvening` (its `at` = the opening time) and kept in History with its completed
rounds; a half-played round is dropped (IMP-097 applies when there is no counted round)
And neither "What shall we play?" nor Home shows it as unfinished

## IMP-105: Looking back at an evening
Status: approved, owner, 2026-10-04 (changed)
Phase: Impostor 1
Then History lists a kept Impostor evening as a `history-game` row reading "Impostor · 7 rounds"
When the host opens it
Then its heading shows the evening's date and start time once ("Sunday 4 Oct, 8:40 pm"); no round row repeats the
date; it shows the players, the choices, and one `history-round` per completed round in order, reading exactly:
"Round 3 · Samosa · Arjun caught" (no last-chance guess) / "Round 3 · Samosa · Arjun caught, guessed right" /
"Round 3 · Samosa · Arjun caught, wrong guess" / "Round 3 · Samosa · Arjun escaped"; the practice round reads "Practice · Samosa · Arjun escaped" (and so on); when
the round was scored, its `round-points` text follows on its own line ("+2 Arjun")
And the fun lines of IMP-095 and, when scored, the final scoreboard
And it can't be changed (PLT-008); it can be deleted (PLT-010) or cleared with all history (PLT-011)

## IMP-106: Share the night
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps "Share" on the summary
Then `navigator.share({ text })` is called once with this text, lines joined by "\n":
- "Impostor night · 7 rounds"
- "Impostor caught 4 · escaped 3"
- fun line 1 of IMP-095, only when it shows ("Best impostor: Arjun, escaped 2 times")
- "Words: " + the words of the completed rounds in round order (the practice round's first), at most 8, joined by
  ", ", with "…" right after the 8th word when there are more
Example (7 counted rounds, no practice):
```
Impostor night · 7 rounds
Impostor caught 4 · escaped 3
Best impostor: Arjun, escaped 2 times
Words: Samosa, Pet name, Cow on the road, Chai, Dosa, Idli, Mango
```
With 9 completed rounds the last line ends "…, Idli, Mango, Pani puri…" (8 words, then "…")
And names appear exactly as typed; the text has nothing else from the phone
When `navigator.share` is missing
Then `navigator.clipboard.writeText(text)` is called with the same text and the toast "Copied. Paste it into any
chat." shows for 4 s
And when the share sheet is closed without choosing an app, nothing else happens
And nothing is sent unless the host picks an app; it works with no internet (the message waits in that app)

## IMP-107: "This word didn't work"
Status: approved, owner, 2026-10-03
Phase: Impostor 1
When the host taps the quiet "This word didn't work" on a round's result screen (practice included; the move itself
is legal from the round's `reveal` or `stillTie` until its `nextRound`, `dealAgain` or `endEvening`, with or without a
verdict, so it survives an "Undo" of the verdict, IMP-037)
Then that word is never dealt again on this phone (blocked; recorded as `wordDidntWork {blocked: true}`), and
the toast "Samosa won't come up again · Undo" shows for 5 s; "Undo" unblocks it (`wordDidntWork {blocked: false}`);
the button is gone for that round once tapped, and comes back after "Undo"
And Settings shows the heading "Skipped words (3)" (the count of blocked words; the heading is hidden at 0) and each
blocked word, newest first, each as the word followed by a button "Bring back" (accessible name "Bring back
Samosa"); tapping it removes that row at once with no toast and no dialog, lowers the count by 1, and the word can be
dealt from the next evening on (an evening in progress keeps its frozen blocked set)
And only "This word didn't work" words are listed and blocked for good; "Don't know this word?" words are not
(IMP-015)
And a problem report (PLT-200) may include the skipped words, so the list can be improved for everyone

## IMP-108: Nothing about the evening leaves the phone by itself
Status: approved, owner, 2026-10-03
Phase: Impostor 1
Then from "Who's playing?" until the summary is left, the page makes no request to any origin other than its own,
and no request to any origin has a URL or body containing a player's name or a word of the evening
And players, words and results leave the phone only through "Share" (IMP-106) or a problem report the host chooses to
send (PLT-200) (PLT-013)

## IMP-109: Settings for Impostor
Status: approved, owner, 2026-10-04 (changed; detail of IMP-014, IMP-107)
Phase: Impostor 1
Then the app's Settings (as reached today, or "Settings" in the menu) has the switch "Larger text" (off by default, kept on this
phone; body text 21 px and small lines 19 px when on, Terms), the switch "Tap to show instead of hold" with its
small line, shown only while it is on (IMP-014), and "Skipped words (N)" when N ≥ 1 (IMP-107)
And changing a setting mid-round takes effect when Settings closes ("Larger text") or on the next screen B (tap
mode), and never shows a word on any other screen
And closing Settings returns to the same screen with nothing else changed; opening the menu, "How to play" or Settings
does not pause a running timer

---
