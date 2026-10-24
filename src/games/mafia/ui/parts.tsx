// Mafia's room frame pieces (MAF-050 to MAF-055, MAF-090): the guarded main button (Terms "Guard"), the Pause icon and
// "··· Menu", the Paused cover with the where-line, a dialog, the Players sheet (IMP-079 strings), and the 10 s undo toast.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { HideMainButton, MainButton, QuietButton, useBackCloses, type ToastState } from '../../../blocks';
import { T } from './text';

/** Terms "Guard": a main button ignores taps for 800 ms after its screen mounts (1000 ms for "I'm Riya"). */
export const MAIN_GUARD_MS = 800;
export const NAME_GUARD_MS = 1000;

/**
 * The main button with Mafia's guard: it looks live at once, and a tap within `ms` of it showing (or of `guardKey`
 * changing) does nothing at all (never carried to the next screen).
 */
export function Main({
  children,
  onClick,
  disabled,
  inline,
  ms = MAIN_GUARD_MS,
  guardKey,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  inline?: boolean;
  ms?: number;
  guardKey?: unknown;
}) {
  const shown = useRef(Date.now());
  useLayoutEffect(() => {
    shown.current = Date.now();
  }, [guardKey]);
  return (
    <MainButton
      disabled={disabled === true}
      inline={inline === true}
      onClick={() => {
        if (Date.now() - shown.current < ms) return;
        onClick?.();
      }}
    >
      {children}
    </MainButton>
  );
}

/** A small text link (S1–S3 "How to play"). */
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="maf-link" onClick={onClick}>
      {children}
    </button>
  );
}

/** Escape calls `run` while `on`. */
function useEscape(on: boolean, run: () => void) {
  const ref = useRef(run);
  ref.current = run;
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ref.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [on]);
}

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
}

/** Pause glyph: two bars, drawn, so no character is read aloud. */
function PauseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="4" y="3" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

/** MAF-050, MAF-053: the Pause icon (name "Pause") beside "··· Menu" (name "Menu"), top right of every room screen. */
export function TopBar({ items, onPause }: { items: readonly MenuItem[]; onPause: () => void }) {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  return (
    <header className="maf-bar">
      <span className="maf-grow" />
      <button type="button" className="maf-icon" aria-label={T.pause.button} onClick={onPause}>
        <PauseGlyph />
      </button>
      <button type="button" className="maf-menu-button" aria-label={T.menu.name} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {T.menu.button}
      </button>
      {open && (
        <div className="maf-menu-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="maf-menu-sheet">
            <div className="maf-menu" role="menu" aria-label={T.menu.name}>
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className="maf-menu-item"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="pgn-quiet maf-menu-close" onClick={() => setOpen(false)}>
              {T.menu.close}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/** "Welcome back." and the where-line (MAF-090, MAF-091), after a reload, a resume or a return from hidden. */
export function WelcomeBack({ where }: { where: string }) {
  return (
    <div className="maf-welcome" role="status">
      <p className="maf-welcome-title">{T.pause.welcome}</p>
      <p className="maf-small" data-testid="where-line">
        {where}
      </p>
    </div>
  );
}

/**
 * A dialog: `role="dialog"` named by its first line; buttons listed main last. Escape (or a tap on the backdrop) is
 * `onDismiss`, the safe choice.
 */
export function MafDialog({
  title,
  heading,
  children,
  onDismiss,
}: {
  title: string;
  /** The title is a heading ("Paused") rather than the dialog's question. */
  heading?: boolean;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const id = useId();
  useEscape(onDismiss !== undefined, () => onDismiss?.());
  return (
    <div className="pgn-backdrop maf-backdrop" onClick={(e) => e.target === e.currentTarget && onDismiss?.()}>
      <div className="pgn-dialog maf-dialog" role="dialog" aria-modal="true" aria-labelledby={id}>
        {heading ? (
          <h2 id={id} className="maf-dialog-heading">
            {title}
          </h2>
        ) : (
          <p id={id} className="pgn-dialog-text">
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/** MAF-050: the Paused cover: "Paused", the where-line, "Tap Carry on when everyone's back.", main "Carry on". */
export function PausedCover({ where, onCarryOn }: { where: string; onCarryOn: () => void }) {
  return (
    <MafDialog title={T.pause.title} heading>
      <p className="maf-small" data-testid="where-line">
        {where}
      </p>
      <p className="maf-body">{T.pause.line}</p>
      <Main inline onClick={onCarryOn}>
        {T.pause.carryOn}
      </Main>
    </MafDialog>
  );
}

/** A yes/no question (End the game, End for tonight, Deal again, a leave): quiet `yes`, then main `no` (the safe one). */
export function Question({
  ask,
  body,
  yes,
  no,
  onYes,
  onNo,
}: {
  ask: string;
  body: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <MafDialog title={ask} onDismiss={onNo}>
      <p className="maf-body">{body}</p>
      <div className="pgn-dialog-buttons">
        <QuietButton onClick={onYes}>{yes}</QuietButton>
        <Main inline onClick={onNo}>
          {no}
        </Main>
      </div>
    </MafDialog>
  );
}

export interface PlayerRow {
  readonly name: string;
  /** The row's words when not just the name ("Kabir · Villager · out night 1", "Neha · left", "Imran · joins next game"). */
  readonly text?: string;
  /** ✕ shown (a player who is in, MAF-052). */
  readonly canLeave: boolean;
  readonly greyed?: boolean;
}

/**
 * MAF-051, MAF-052 (PO 17): the Players sheet: seat order, ✕ beside players who are in, out players and leavers greyed,
 * additions "Imran · joins next game", the add row ("Player name", "Add") and "Done". `cover` is a dialog over it (the
 * sheet is then inert); it is drawn beside the sheet, never inside it.
 */
export function PlayersSheet({
  rows,
  canAdd,
  onAdd,
  onRemove,
  onDone,
  cover,
}: {
  rows: readonly PlayerRow[];
  canAdd: boolean;
  /** Returns the message to show when the name is refused, else null. */
  onAdd: (name: string) => string | null;
  onRemove: (name: string) => void;
  onDone: () => void;
  cover: ReactNode;
}) {
  const id = useId();
  const covered = cover !== null && cover !== undefined && cover !== false;
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  useEscape(!covered, onDone);
  useBackCloses(true, onDone);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = (field.current?.value ?? text).trim();
    if (name === '') return;
    const refused = onAdd(name);
    setMessage(refused);
    if (refused === null) {
      setText('');
      if (field.current) field.current.value = '';
    }
    field.current?.focus();
  };
  return (
    <>
      <div className="pgn-sheet maf-sheet" role="dialog" aria-modal="true" aria-labelledby={id} inert={covered}>
        <div className="pgn-sheet-body">
          <h1 id={id} className="pgn-title">
            {T.leave.title}
          </h1>
          <ol className="maf-player-list">
            {rows.map((r) => (
              <li key={r.name} className={r.greyed ? 'maf-player-row maf-greyed' : 'maf-player-row'}>
                <span className="maf-player-name">{r.text ?? r.name}</span>
                {r.canLeave && (
                  <button type="button" className="maf-icon" aria-label={T.s1.remove(r.name)} onClick={() => onRemove(r.name)}>
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ol>
          {canAdd && (
            <form className="maf-add" onSubmit={submit}>
              <label className="maf-sr" htmlFor={`${id}-name`}>
                {T.s1.field}
              </label>
              <input
                ref={field}
                id={`${id}-name`}
                className="maf-input"
                type="text"
                value={text}
                maxLength={16}
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="done"
                onChange={(e) => {
                  setText(e.target.value);
                  setMessage(null);
                }}
              />
              <button type="submit" className="pgn-quiet maf-add-button" disabled={text.trim() === ''}>
                {T.s1.add}
              </button>
            </form>
          )}
          {message && (
            <p role="alert" className="maf-alert">
              {message}
            </p>
          )}
        </div>
        <HideMainButton.Provider value={covered}>
          <MainButton onClick={onDone}>{T.leave.done}</MainButton>
        </HideMainButton.Provider>
      </div>
      {covered && cover}
    </>
  );
}

/** Undo toasts last 10 s in Mafia (Terms); a new toast replaces the old. Returns [toast, show, clear]. */
export function useUndoToast(): [ToastState | null, (text: string, undo?: () => void) => void, () => void] {
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), toast.undo ? 10_000 : 4_000);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text: string, undo?: () => void) => {
    seq.current += 1;
    setToast({ id: seq.current, text, ...(undo ? { undo } : {}) });
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return [toast, show, clear];
}
