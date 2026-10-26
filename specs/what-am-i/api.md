# What Am I?: the rule API and browser hooks the tests use (C3, 24 October 2026)

For the Build role. This makes "Test hooks the build provides" (WAI-H1 to H11 and H1b, [README.md](README.md)) exact: what
the tests import, what they pass in and what they expect back. Nothing here changes a scenario; where this page and a
scenario differ, the scenario wins and the tester fixes this page (write it in `docs/test-questions.md`).

Tests: `tests/games/what-am-i/*.test.ts`, `tests/contract/what-am-i.test.ts`, `tests/browser/what-am-i-*.spec.ts`.
Until the game exists every one of them is marked "ahead of the build" and is checked to fail only because
`src/games/what-am-i` (or `window.__waiTest`) is missing; once `src/games/what-am-i/index.ts` exists they run normally.
`PGN_IGNORE_AHEAD=1` runs them unmarked at any time.

## Where
Everything comes from **`src/games/what-am-i/index.ts`**. Until an export exists, each test that needs it fails on its own
with "… is not exported from src/games/what-am-i yet". The engine (`startMatch`, `play`, `replay`, `createRng`, `shuffle`,
`readSavedGame`) is used as it is today; no engine change is expected.

## The word list (C3, list format)
`content/what-am-i/words.json`, built from `docs/games/what-am-i/words.csv` (as `npm run build:words` does for the other
games). One object per CSV row, in row order, exactly:
```ts
interface WaiWord {
  id: string;            // "WAIW-001"
  word: string;          // as in the list, "Pressure cooker"
  pack: Pack;            // the CSV pack name, e.g. "Sports and cricket"
  audience: 'family';
  nonveg: boolean;       // CSV "yes" → true, "no" → false
  edition: number;       // CSV "1" → 1
  retired_in: number | null;  // blank → null
}
type Pack = 'Animals' | 'Food' | 'Around the house' | 'Jobs' | 'Sports and cricket' | 'Festivals and places' | 'Act it out' | 'Famous Indians';
```
The `notes` column stays out. The tests compare the file with the CSV row for row.

## Exports
| Export | What |
|---|---|
| `whatAmIRules` | the game's `GameRules<Config, State, WaiMove, WaiView>`, `id: 'what-am-i'` |
| `whatAmIEdition` | WAI-092: the shipped word list's current edition, the highest `edition` or `retired_in` in `content/what-am-i/words.json` (1 today) |
| `queueFor(state)` | WAI-H1: the remaining queue as word ids, next word first: the unshown part (with any Mix of all fallback already appended), then the shown part. Empty before the first `start` and when no game is open. |

## Setup
`startMatch(whatAmIRules, setup, at)` with
```ts
{ gameId: 'what-am-i', seeds: { words: string }, config: { edition?: number; testWords?: WaiWord[] } }
```
**WAI-010 (orchestrator's call, 25 October 2026; confirmed by the product owner, 26 October):** `seeds.words` is required: a setup without it (or with an empty or
non-text value) is refused, that is `startMatch` (the rules' `setup`) throws.

**Word-list editions (WAI-092, orchestrator's call, 25 October 2026, `docs/test-questions.md`; confirmed by the product owner, 26 October):** the app starts every new
game night with `config.edition = whatAmIEdition`, so the saved night records the edition it was played with. The rules use
only words with `edition <= config.edition` that were not retired by then (`retired_in` null or greater than
`config.edition`); a saved night with no `edition` is treated as edition 1. So a night saved under edition 1 replays word for
word after the list gains edition-2 words and retires a word in edition 2, and a night started under edition 2 uses the new
words and leaves the retired one out. (Tests: `tests/games/what-am-i/editions.test.ts`, which load the game with a later
`words.json` in place of the shipped one.)
`testWords` is WAI-H7: when present it replaces the whole word list (every pack and Mix of all) for this game night.
The game night starts with no game; its first move is `start`.

## Moves (WaiMove)
```ts
type Choices = { pack: Pack | 'mix'; time: 30 | 60 | 90; hold: 'hand' | 'free'; nonveg: boolean; sounds: boolean };
{ type: 'start'; players: string[]; choices: Choices }      // a new game, gameIndex = games started tonight + 1
{ type: 'got'; word: string } | { type: 'pass'; word: string }   // the word on screen: queueFor(state)[0]
{ type: 'timeUp'; word?: string }                             // the word on screen, passed; none during a flash or in T2
{ type: 'pause'; turn: boolean; word?: string }               // turn: paused from T2/T3; word: the word that was on T3 (hidden, R2)
{ type: 'resume' } | { type: 'skip' } | { type: 'scoreTurn' } | { type: 'undoScore' }
{ type: 'fix'; word: string }                                 // a word of the open turn's lists, moved to the other list
{ type: 'addPlayer'; name: string } | { type: 'leave'; player: string }
{ type: 'reorder'; order: string[] }                          // the whole new turn order of the current players;
                                                              // refused if any player who has played this round moves (WAI-041)
{ type: 'setHold'; player: string; hold: 'hand' | 'free' }
{ type: 'setChoices'; choices: Choices } | { type: 'setPlayers'; players: string[] }
{ type: 'endGame' } | { type: 'endEvening' }
```
**WAI-010, no word twice in a turn (orchestrator's call, 25 October 2026, owner away; confirmed by the product owner, 26 October,
`docs/test-questions.md`):** a word never comes back within the same turn. "Shown in this turn" means marked Got it or Pass
in it (a word hidden by a pause is not shown, so it can still come back, as Duck does in Version 1.1 item 6). When every
eligible word has been shown in the open turn (only possible with a tiny list, such as the WAI-H7 lists), there is no next
word: `legalMoves` offers no `got` or `pass`, and `got`, `pass`, `timeUp { word }` and `pause { turn: true, word }` with any
word are refused; `timeUp` with no word and `pause { turn: true }` with no word are accepted. On screen, time up happens at
once: when the last mark's 600 ms flash ends (the moment the next word would show), the app records `timeUp` with no word,
plays the time-up sound and vibration and opens T4 ("Time's up! …"), whatever time is left. `queueFor(state)` keeps its
meaning (its first word is then a word of this turn, not on screen). From the next turn the words come back as usual,
oldest first-shown first. (Tests: `queue.test.ts` "a word never comes back within the same turn"; WAI-011 tip 3 in
`what-am-i-turn.spec.ts`.)

Made exact here (the scenarios name these moves but not all their fields):
- `got` and `pass` carry the word id, as `timeUp` does, so the saved data holds each shown word's id (WAI-092, B9).
- `pause` says whether a turn was under way (`turn: true` from T2 or T3; false from T1 or T4) and, from T3 outside a flash,
  which word it hid. A hidden word goes to the end of the unshown part (Version 1.1 item 5). `skip` needs a `pause` with
  `turn: true` as the last move.
- `detailMoves` = `['start', 'addPlayer', 'reorder', 'setHold', 'setChoices', 'setPlayers']`; every other move is listed
  complete by `legalMoves(state, 'host')` when it is allowed (the marks with the queue's first word).
- A turn starts with its first `got`, `pass`, `timeUp` or `pause { turn: true }`; it is open until `scoreTurn` (or until the
  game ends). `undoScore` is allowed only while the last `scoreTurn` has had no later move other than `pause` and `resume`.
- `endEvening` needs no open game (End for tonight records `endGame` first). After `endEvening`, `isOver` is true.
- `canUndo` is always false (Undo is the `undoScore` move; the app removes `endGame` and `endEvening` itself, WAI-060, 064).

## View (`view(state, { kind: 'host' })`; the room's view is the same)
```ts
interface WaiView {
  step: 'new' | 'pass' | 'turn' | 'review' | 'gameOver' | 'ended';
  //  new: before the first start · pass: T1 (or R1), a turn not started · turn: T2/T3 · review: T4 ·
  //  gameOver: after endGame (G1) · ended: after endEvening (G2)
  paused: boolean;
  game: number;                 // gameIndex of the open or last game; 0 before the first start
  round: number;                // the round of the current or next turn (2 once round 1's last turn is saved)
  player: string | null;        // whose turn, in pass, turn and review; else null
  order: string[];              // current players in turn order
  toPlay: string[];             // current players still to play this round, in turn order (the current player first)
  left: string[];               // players who left this game and have not rejoined, in the order they left
  holds: Record<string, 'hand' | 'free'>;   // each current player's hold (S2's, or their own choice this game)
  choices: Choices | null;
  turn: { got: string[]; passed: string[]; moved: string[]; endedEarly: boolean } | null;
  //  the open turn (turn and review): word ids in T4's order (shown order; a fixed word at the other list's end; the
  //  time-up word last in passed); moved = ids now showing ↺; endedEarly after skip
  scoreboard: { player: string; score: number; turns: number; left: boolean }[];   // WAI-032's order, leavers last
  passedByRound: string[][];    // [r - 1]: round r's passed words of saved turns, after fixes, in the order shown
  result: GameResult | null;    // the last ended game, from endGame on
  tonight: Tonight;
}
interface GameResult {
  game: number; winners: string[]; top: number;      // winners [] when no turn was saved or every saved turn scored 0
  bestTurn: { player: string; got: number } | null;  // the single saved turn with most Got it (ties: the earliest); null with no saved turn
  passed: string[];                                   // this game's passed words of saved turns, after fixes, in the order shown
  moved: number; endedEarly: number; turns: number;   // words showing ↺ when saved; saved skipped turns; saved turns
}
interface Tonight {
  players: string[];            // everyone who saved a turn tonight, leavers included, in the order of their first saved turn
  games: number;                // ended games with at least one saved turn
  got: number;                  // Got it over every saved turn of tonight's ended games
  wins: { player: string; wins: number }[];   // most first, ties in turn order; only players with a win
  best: { players: string[]; got: number } | null;   // most Got it tonight (ties: every one, in turn order)
  //  "turn order" (WAI-061, WAI-064; orchestrator's call, 25 October 2026; confirmed 26 October): the current (last game's) turn order, then
  //  everyone not in it (leavers, players not in the last game) in the order of their first saved turn tonight
}
```
No seed is ever in a view.

## Browser hooks (`window.__waiTest`, every build except the release build)
```ts
window.__waiTest = {
  setSeed(seed: string): void;               // WAI-H1b: seeds.words of the next game night started on this page
  setWords(words: WaiWord[]): void;          // WAI-H7: config.testWords of the next game night started on this page
  setPlatform(p: 'iphone' | 'android'): void;   // WAI-H5 (rotation tip wording, vibration)
  log: { t: number; kind: 'sound' | 'vibrate'; name?: 'countdown' | 'got' | 'pass' | 'tick' | 'timeUp'; pattern?: number[] }[];
  //  WAI-H8: every sound and vibration call, t = Date.now() when it was made
  clearPhone(): void;                        // WAI-H11: forget this phone's stored What Am I? state (motion answer, tips, last choices)
};
```
- **Clock (H2, H10):** the app takes every time from `Date.now()`, `performance.now()`, timers and animation frames, never
  from an event's `timeStamp`, so Playwright's clock drives the countdown, the turn clock, guards and toasts. Time zone:
  the browser's (`timezoneId`).
- **Orientation (H3):** the tests fire real `deviceorientation` events (`new DeviceOrientationEvent('deviceorientation',
  { beta, gamma })`) and replace `screen.orientation.type` with a getter; the app reads `screen.orientation.type` afresh at
  each event. "No orientation events" = none fired.
- **Permission (H4):** the tests define or delete `DeviceOrientationEvent.requestPermission` before the app loads.
- **Wake lock (H6):** the tests replace `navigator.wakeLock` before the app loads (granted, refused, missing).
- **Visibility and Back (H9):** the tests fire `visibilitychange` (with `document.visibilityState` replaced) and `popstate`
  through `history.back()`.
- Saved game nights: `pgn.game.<id>` as the other games, `gameType: 'what-am-i'`.

## Test ids and names
`the-word`, `time-left`, `mark-flash`, `mark-live`, `countdown`, `tip-line`, `where-line`, `scoreboard`, `undo-toast`,
`turn-lists`, `hold-drawing`, `unfinished-games`, `join-line-what-am-i`, `main-button` (as Impostor). The Pause button's
accessible name is "Pause"; the menu button's "Menu", its items `role="menuitem"` (greyed ones `aria-disabled="true"`, their
"After this turn" line inside the item). Word chips on T4 are buttons named by the word ("Owl", "Owl ↺"); each of T4's two
lists is a `section` labelled by its h2 (role region, name "Got it" / "Passed"). On S1 and in Players, as Impostor: "✕" is
a button named "Remove Riya"; the drag handle is named "Move Riya". Choices on S2 are `role="radio"` in a `radiogroup` named
by its h2; switches `role="switch"` with `aria-checked`. The scoreboard (`scoreboard`) is a list, one `listitem` per row,
its text "Arjun 7 (1 turn)". Dialogs are `role="dialog"` named by their h1 (the Paused cover: "Paused").
