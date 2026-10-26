// Opening a map on a phone (SWD-002, SWD-036, SWD-133): the map link, the typed code ("Type the host's code"), Home's
// saved map, and, on a phone that is the board of an unfinished game night, "This phone is the board. Open the map
// here?" (SWD-002 version 3.6, D11). Also Home's and the picker's game night rows and "Start a new game night?"
// (SWD-115, SWD-067). Privacy: nothing here ever holds a word, a kind or a map; the map phone (lane C) opens only after
// a valid code and, on a board phone, only after "Open the map here".
import { useId, useState } from 'react';
import type { Preferences, SavedGameStore } from '../../../engine';
import { BlocksRoot, QuietButton, Screen, ScrollArea, keepNames } from '../../../blocks';
import { parseMapCode, WORDS } from '../rules';
import {
  endNight, homeRowLine, isNight, lastNight, loadNight, resumeCardLine, startNewText, unfinishedNight, whereLine, type Night,
} from './evening';
import { GuardedMain } from './guard';
import { MapPhone as LaneCMapPhone } from './MapPhone';
import { readSavedMap, SAVED_MAP_KEY } from './mapSaved';
import { HowToPlay } from './Texts';
import './secret-words.css';

/** A map to open: the 7-symbol code (no hyphen) and what the QR carried (SWD-117). */
export interface MapToOpen {
  readonly code: string;
  readonly t?: string;
  readonly p?: string;
}

const ERRORS = {
  invalid: "That code doesn't look right. Check it with the host.",
  newer: 'This map needs a newer version of the app. Open the app once with internet, then try again.',
} as const;
export type MapCodeError = keyof typeof ERRORS;

/** SWD-002: what was typed or scanned, read as a code ('invalid' / 'newer' when it can't be opened). */
export const readMapCode = (text: string): string | MapCodeError => parseMapCode(text, WORDS);

/**
 * A map link's text (`…#map=27P3QX8&t=SWDT-01&p=own`, SWD-002, SWD-117), or null when it holds no `#map=`. `raw` is the
 * code as written in the link.
 */
export function readMapLink(text: string): { raw: string; t?: string; p?: string } | null {
  const i = text.indexOf('#map=');
  if (i < 0) return null;
  const params = new URLSearchParams(text.slice(i + 1));
  const raw = params.get('map') ?? '';
  const t = params.get('t');
  const p = params.get('p');
  return { raw, ...(t ? { t } : {}), ...(p ? { p } : {}) };
}

/** D11: whether opening a map here asks first, and which paragraph it shows. Null on a phone with no unfinished game night. */
export function boardPhoneAsk(store: SavedGameStore): { onePhone: boolean } | null {
  // Read from the saved moves themselves, so a game night that no longer replays still protects its board.
  const nights = store
    .list()
    .filter((g): g is Night => isNight(g) && g.status === 'in-progress' && !g.records.some((r) => r.move.type === 'endEvening'))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const n = nights[0];
  if (!n) return null;
  let map = n.setup.config?.choices?.map;
  for (const r of n.records) if (r.move.type === 'setChoices') map = r.move.choices.map;
  return { onePhone: map === 'pass' };
}

// ---------------------------------------------------------------- J2 code entry

export function CodeEntry({
  initialText = '',
  initialError = null,
  onBack,
  onOpen,
}: {
  initialText?: string;
  initialError?: MapCodeError | null;
  onBack: () => void;
  /** A valid code (the app then asks D11 or opens the map phone). */
  onOpen: (code: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<MapCodeError | null>(initialError);
  const id = useId();
  const enough = text.replace(/[\s-]/g, '').length >= 7;
  const open = () => {
    const r = readMapCode(text);
    if (r === 'invalid' || r === 'newer') setError(r);
    else {
      setError(null);
      onOpen(r);
    }
  };
  return (
    <BlocksRoot className="sw">
      <Screen className="sw-setup">
        <header className="sw-bar">
          <QuietButton onClick={onBack}>← Back</QuietButton>
        </header>
        {/* RC fix: the content scrolls inside above "Open the map", so the typed code is never under the button. */}
        <ScrollArea>
        <h1 className="pgn-title">Type the host's code</h1>
        <form
          className="sw-code-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (enough) open();
          }}
        >
          <label className="sw-field-label" htmlFor={`${id}-code`}>
            Host's code
          </label>
          <input
            id={`${id}-code`}
            className="sw-input sw-code-input"
            type="text"
            value={text}
            placeholder="27P-3QX8"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            onFocus={(e) => e.target.scrollIntoView({ block: 'nearest' })}
          />
          <p className="sw-small">Dashes and small letters are fine.</p>
          {error && (
            <p role="alert" className="sw-alert">
              {ERRORS[error]}
            </p>
          )}
        </form>
        </ScrollArea>
        <GuardedMain disabled={!enough} onClick={open}>
          Open the map
        </GuardedMain>
      </Screen>
    </BlocksRoot>
  );
}

// ---------------------------------------------------------------- D11 "This phone is the board"

export function BoardPhoneDialog({ onePhone, onOpenHere, onKeep }: { onePhone: boolean; onOpenHere: () => void; onKeep: () => void }) {
  const id = useId();
  return (
    <BlocksRoot className="sw">
      <div className="pgn-backdrop">
        <div className="pgn-dialog" role="dialog" aria-modal="true" aria-labelledby={id} data-testid="board-phone-dialog">
          <h2 id={id} className="sw-dialog-heading">
            This phone is the board. Open the map here?
          </h2>
          <p className="sw-body">
            {onePhone
              ? 'Clue givers use their own phone. With one phone, pass this phone to the clue giver when the game says so.'
              : "Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu."}
          </p>
          <div className="pgn-dialog-buttons">
            <QuietButton onClick={onOpenHere}>Open the map here</QuietButton>
            <GuardedMain inline onClick={onKeep}>
              No, keep the board
            </GuardedMain>
          </div>
        </div>
      </div>
    </BlocksRoot>
  );
}

/**
 * The map phone (SWD-034, lane C), with "Clue rules" opening How to play at its Clue rules (SWD-011 v3.6). The map
 * phone's own file holds the screen and its privacy rules; this only joins it to How to play.
 */
export function MapPhone(props: { map: MapToOpen; onHome: () => void; keys: Preferences; prefs: Preferences }) {
  return (
    <LaneCMapPhone
      {...props}
      renderClueRules={(about, done) => (
        <HowToPlay
          names={about.names}
          // The map phone doesn't know the host's Landmine choice: K33's default for the code's word list.
          choices={{ board: about.board, landmine: about.audience === 'grownups' ? 'lose' : 'turn' }}
          at="clue-rules"
          onDone={done}
        />
      )}
    />
  );
}

// ---------------------------------------------------------------- Home and the picker (SWD-115, SWD-036)

/** Home's unfinished row and the picker's resume card: three lines (SWD-115 version 3.6), or null when it doesn't replay. */
export function nightRow(saved: Night, card: boolean): { line: string; where: string; label: string } | null {
  const m = loadNight(saved);
  if (!m) return null;
  const line = card ? resumeCardLine(m.state) : homeRowLine(saved, m.state);
  const where = whereLine(m.state);
  return { line, where, label: `${line} · ${where} · Tap to resume` };
}

/** The three-line button of Home's row and the picker's resume card. */
export function NightRowButton({ row, className, testId, onClick }: { row: { line: string; where: string; label: string }; className: string; testId?: string; onClick: () => void }) {
  return (
    <button type="button" className={className} aria-label={row.label} onClick={onClick} {...(testId ? { 'data-testid': testId } : {})}>
      <span className="sw-row-line">{keepNames(row.line)}</span>
      <span className="sw-row-where" data-testid="where-line">
        {row.where}
      </span>
      <span className="sw-row-tap">Tap to resume</span>
    </button>
  );
}

/** The picker's resume card (SWD-115): null without an unfinished game night. */
export function resumeCard(store: SavedGameStore): { id: string; row: { line: string; where: string; label: string } } | null {
  const n = unfinishedNight(store);
  const row = n && nightRow(n.saved, true);
  return n && row ? { id: n.saved.id, row } : null;
}

/** The unfinished game night, for the Start new dialog. */
export function startNewAsk(store: SavedGameStore): { id: string; text: string } | null {
  const n = unfinishedNight(store);
  return n ? { id: n.saved.id, text: startNewText(n.saved, n.match.state) } : null;
}

/** SWD-067: ends that game night (no summary). */
export function endUnfinished(store: SavedGameStore, id: string): void {
  const saved = store.get(id) as Night | undefined;
  const match = saved && loadNight(saved);
  if (saved && match && !match.state.ended) endNight(store, saved, match);
}

/** SWD-115 "Start a new game night?": heading, paragraph, two equal quiet buttons, no main (Terms: Dialog exception). */
export function StartNewNightDialog({ text, onCarryOn, onStartNew }: { text: string; onCarryOn: () => void; onStartNew: () => void }) {
  const id = useId();
  return (
    <BlocksRoot className="sw">
      <div className="pgn-backdrop">
        <div className="pgn-dialog" role="dialog" aria-modal="true" aria-labelledby={id}>
          <h2 id={id} className="sw-dialog-heading">
            Start a new game night?
          </h2>
          <p className="sw-body">{text}</p>
          <div className="sw-equal-row">
            <QuietButton onClick={onCarryOn}>Carry on that one</QuietButton>
            <QuietButton onClick={onStartNew}>Start new (ends that one)</QuietButton>
          </div>
        </div>
      </div>
    </BlocksRoot>
  );
}

/** SWD-115 "Next day": "Last game night: …" with "Play again with these teams". */
export function lastNightRow(store: SavedGameStore, now: number): { id: string; text: string } | null {
  const n = lastNight(store, now);
  return n ? { id: n.saved.id, text: n.text } : null;
}

// ---- Home's saved map (SWD-036) ----

const SIX_HOURS = 6 * 3600_000;

const shown = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;

/**
 * Home's saved map (`pgn.secretWords.map`, SWD-036): "Secret Words map 27P-3QX8 · Tap to open"; more than 6 hours after
 * `savedAt`, the text with "Open" and "Remove" ("Remove" asks first). `keys` is the store of `pgn.*` keys.
 */
export function SavedMapRow({ keys, onOpen }: { keys: Preferences; onOpen: (map: MapToOpen) => void }) {
  const [map, setMap] = useState(() => readSavedMap(keys));
  const [now] = useState(() => Date.now());
  const [asking, setAsking] = useState(false);
  if (!map) return null;
  const open = () => onOpen({ code: map.code, ...(map.t ? { t: map.t } : {}), ...(map.p ? { p: map.p } : {}) });
  if (now - map.savedAt <= SIX_HOURS) {
    return (
      <button type="button" className="home-row" data-testid="saved-map" onClick={open}>
        <span>{keepNames(`Secret Words map ${shown(map.code)} · Tap to open`)}</span>
        <span aria-hidden="true">›</span>
      </button>
    );
  }
  return (
    <div className="home-row saved-tickets" data-testid="saved-map">
      <span className="saved-tickets-text">{keepNames(`Secret Words map ${shown(map.code)}`)}</span>
      <span className="saved-tickets-buttons">
        <button type="button" className="button button-quiet" onClick={open}>
          Open
        </button>
        <button type="button" className="button button-quiet" onClick={() => setAsking(true)}>
          Remove
        </button>
      </span>
      {asking && (
        <BlocksRoot className="sw">
          <div className="pgn-backdrop">
            <div className="pgn-dialog" role="dialog" aria-modal="true" aria-label="Remove this map from your phone?">
              <p className="pgn-dialog-text">Remove this map from your phone?</p>
              <div className="pgn-dialog-buttons">
                <QuietButton
                  onClick={() => {
                    keys.set(SAVED_MAP_KEY, null);
                    setAsking(false);
                    setMap(null);
                  }}
                >
                  Remove
                </QuietButton>
                <GuardedMain inline onClick={() => setAsking(false)}>
                  Keep it
                </GuardedMain>
              </div>
            </div>
          </div>
        </BlocksRoot>
      )}
    </div>
  );
}
