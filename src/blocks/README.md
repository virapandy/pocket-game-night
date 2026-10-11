# src/blocks: shared screen building blocks

Taken from Impostor's working screens (October 2026) so the next game (Secret Words) gets them working from day one
(`docs/proposals/faster-cycles.md`, item 8; CLAUDE.md: "generalise only when two real games need it"). Import from
`src/blocks` (the `index.ts`), never from a file inside.

Rules (`npm run check:boundaries`): games and the app may import blocks; blocks import only the engine and each other,
never a game or the app. Tambola does not use them (yet).

Styles: `blocks.css` loads once, through `index.ts`, before any game's stylesheet. Every class starts `pgn-` and works
inside a `BlocksRoot`. A game adjusts a block for its own screens with its own class (`.imp-setup.pgn-screen { … }`),
never by editing `blocks.css` for one game.

## Text sizes and spacing (CSS custom properties, set on `BlocksRoot`)

| Token | Value | Rule |
|---|---|---|
| `--pgn-body` | 17 px; 21 px with Larger text | guideline 24, IMP-109 |
| `--pgn-small` | 15 px; 19 px with Larger text | guideline 24, IMP-109 |
| `--pgn-gutter` | 16 px, the side and bottom margin | guideline 5 |
| `--pgn-main-h` | 60 px, the main button's height | guideline 14, 17a |
| `--pgn-foot` | `--pgn-main-h` + 2 × `--pgn-gutter`: the space kept free at the bottom for the main button. A screen may override it (a taller pinned area) | IMP-081 (P4) |
| `--pgn-tint` | the accent at 10%, the selected fill | guideline 26 |
| `--pgn-toast-h` | set by `Toast` on its parent: the toast's height | IMP-081 |

Classes: `pgn-title` (the screen heading, 1.75 rem, 800). Quiet buttons and toasts follow `--pgn-body`, so Larger
text reaches them. Inside `.pgn`, `p`, `h1`, `h2`, `ol` and `ul` have no margins and `[hidden]` is never shown.

## Screens (`screen.tsx`)

- **`BlocksRoot({ larger?, className?, children })`**: the root of a game's screens; sets the tokens. `larger` turns on
  Larger text. Put the game's class in `className` (Impostor: `imp`).
- **`Screen({ page?, className?, onClickCapture?, children })`**: one screen, a `<main>` the height of the phone, with
  `--pgn-foot` free at the bottom so **nothing hides under the pinned main button** (IMP-081). By default it is
  **fixed: it never scrolls**; put one `ScrollArea` inside for the part that may. `page`: the screen **scrolls as one
  page** instead (guideline 46a: results and summaries; no scroll area inside), and while a `Toast` shows the page
  ends above it. Landscape (812 × 375): no width limit, 8 px top. Pass `useTapGuard`'s handler as `onClickCapture`.
- **`ScreenContent({ hidden?, children })`**: the screen's content above the main button, as a column; `hidden` while
  a sheet covers the screen.
- **`ScrollArea({ className?, children })`**: the one scrolling part of a fixed screen, taking the space left.

## Buttons (`buttons.tsx`)

- **`MainButton({ children, onClick?, disabled?, inline? })`**: the one solid button, 60 px, pinned at the bottom
  (bottom right, 358 px wide, in landscape); `data-testid="main-button"`. `inline`: inside a dialog, in its flow.
  Guideline 17a, IMP-080: **at most one on screen**.
- **`HideMainButton`** (React context, default `false`): provide `true` around a screen while a dialog, sheet or
  summary covers it; its pinned `MainButton` is then left out of the page (inline ones stay).
- **`QuietButton({ children, onClick?, disabled?, className?, label? })`**: outlined, at least 48 px tall, never the
  main look (guidelines 14, 17a). `label` sets `aria-label`.
- **`OptionButton({ children, selected, onClick })`**: one choice of a group. **Selected** = outline, tint and a
  decorative ✓, plus `aria-pressed` (guideline 26: never colour alone); never the main look.

## Tap guard (`tapGuard.tsx`)

- **`useTapGuard(screen)`** returns an `onClickCapture` handler: a tap on a button within **500 ms**
  (`TAP_GUARD_MS`) of `screen` changing, or of mounting, does nothing (guideline 20, M18; IMP-010, I29). Keyboard
  clicks are never guarded, nor buttons inside `data-tap-guard="off"` (Impostor's hold pad). Uses `Date.now()`, so a
  fake clock drives it. The app's only tap guard (Home and "What shall we play?" use it too).
- **`TapGuard({ screen, children })`**: the same around part of a screen, laid out as if not there.

## Toasts (`toast.tsx`)

- **`useToast()`** returns `[toast, show(text, undo?), clear]`. One toast at a time; a new one replaces the old.
  **Undo toasts last 5 s, others 4 s** (guideline 18: undo beats confirmation).
- **`Toast({ toast, onDone })`**: the bar just above the main button (`data-testid="toast"`, or `"undo-toast"` with an
  "Undo" button). Place it as a direct child of the `Screen` (or sheet) so a page screen leaves room for it.

## Dialogs and sheets (`overlays.tsx`)

- **`Dialog({ text, children, className? })`**: `role="dialog"`, `aria-modal`, named by `text`. List its buttons main
  last (`QuietButton`s, then `MainButton inline`); **a destructive choice is never the main one** (guideline 15,
  IMP-080). Its buttons are tap-guarded for 500 ms from when it, or its question, shows.
- **`Sheet({ title, children, onDone, doneLabel = 'Done', cover? })`**: a full-screen sheet with its heading and its own
  pinned main button. It scrolls as one page, and its bottom space keeps every line and a focused field clear of
  "Done" (IMP-081). **"Done" is the only way a change is kept** (IMP-076). `cover`: a `Dialog` over the sheet; while
  it shows, the sheet behind is **`inert`** (no keyboard or screen-reader access to its list or "Done"). Tap-guarded
  for 500 ms from when it shows.
- **`useBackCloses(open, close)`**: while `open`, the phone's or browser's **Back** calls `close` and nothing else: a
  sheet closes **without saving**, a dialog closes changing nothing (IMP-015, IMP-076, IMP-078). Use it in the
  component that owns the open state.

Not in the blocks (yet): dialogs do not move focus when they open (Impostor's do not; add it with a scenario), and the
"··· Menu", switches and the room screens' large type stay in Impostor until a second game needs them.
