// Setting up a paper-ticket game: ticket mode (TAM-137), players (PLT-024), contribution and pot
// (TAM-080, TAM-090), then the prizes the anchor confirms (TAM-081 to TAM-084).
import { useState, type ReactNode } from 'react';
import type { Preferences } from '../../../engine';
import {
  PATTERN_NAMES,
  PATTERNS,
  planPrizes,
  suggestTiers,
  type Pattern,
  type PrizePlan,
  type TambolaConfig,
  type TambolaSettings,
  type Tier,
} from '../rules';
import { plural, rupees } from './format';

export interface SetupDraft {
  count: string;
  names: string[];
  tickets: number[];
  contribution: string;
  noMoney: boolean;
  /** The prize patterns, or null to follow the suggestion for the ticket count. */
  patterns: Pattern[] | null;
  fixed: Partial<Record<Pattern, number>>;
  labels: Partial<Record<Pattern, string>>;
}

export type SetupStep = 'mode' | 'players' | 'money' | 'prizes';

export const emptyDraft: SetupDraft = {
  count: '6',
  names: [],
  tickets: [],
  // TAM-182: a real default value, not a grey hint.
  contribution: '50',
  noMoney: false,
  patterns: null,
  fixed: {},
  labels: {},
};

const NAMES_KEY = 'names.recent';
const DRAFT_KEY = 'tambola.setup-draft';

/** PLT-006: the setup being made, kept on this phone until the prizes are confirmed. */
export function saveDraft(prefs: Preferences, draft: SetupDraft) {
  prefs.set(DRAFT_KEY, draft);
}

export function clearDraft(prefs: Preferences) {
  prefs.set(DRAFT_KEY, null);
}

/** The setup left unconfirmed last time, or null. */
export function loadDraft(prefs: Preferences): SetupDraft | null {
  const d = prefs.get<Partial<SetupDraft> | null>(DRAFT_KEY, null);
  if (!d || typeof d !== 'object') return null;
  const strings = (x: unknown) => (Array.isArray(x) ? x.map((v) => (typeof v === 'string' ? v : '')) : []);
  const numbers = (x: unknown) => (Array.isArray(x) ? x.map((v) => (Number.isInteger(v) ? (v as number) : 1)) : []);
  return {
    count: typeof d.count === 'string' ? d.count : emptyDraft.count,
    names: strings(d.names),
    tickets: numbers(d.tickets),
    contribution: typeof d.contribution === 'string' ? d.contribution : emptyDraft.contribution,
    noMoney: d.noMoney === true,
    patterns: Array.isArray(d.patterns) ? PATTERNS.filter((p) => d.patterns!.includes(p)) : null,
    fixed: d.fixed && typeof d.fixed === 'object' ? d.fixed : {},
    labels: d.labels && typeof d.labels === 'object' ? d.labels : {},
  };
}
const MAX_PLAYERS = 30;

function playerCount(d: SetupDraft): number {
  const n = Number.parseInt(d.count, 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(n, MAX_PLAYERS)) : 0;
}

function resolvedPlayers(d: SetupDraft) {
  return Array.from({ length: playerCount(d) }, (_, i) => ({
    id: `p${i + 1}`,
    name: (d.names[i] ?? '').trim() || `Player ${i + 1}`,
    tickets: d.tickets[i] ?? 1,
  }));
}

function contributionOf(d: SetupDraft): number | null {
  if (d.noMoney) return null;
  const c = Number(d.contribution.trim());
  return Number.isSafeInteger(c) && c >= 1 && c <= 100_000 ? c : null;
}

function prizeInput(d: SetupDraft) {
  const tickets = resolvedPlayers(d).reduce((s, p) => s + p.tickets, 0);
  const suggested = suggestTiers(tickets).map((t) => t.pattern);
  const patterns = d.patterns ?? suggested;
  return {
    tickets,
    patterns: PATTERNS.filter((p) => patterns.includes(p)),
    removed: suggested.filter((p) => !patterns.includes(p)),
    added: patterns.filter((p) => !suggested.includes(p)),
  };
}

function plan(d: SetupDraft): { plan: PrizePlan | null; error: string | null } {
  const c = contributionOf(d);
  if (c === null) return { plan: null, error: null };
  const { tickets, removed, added } = prizeInput(d);
  try {
    return {
      plan: planPrizes({
        tickets,
        contribution: c,
        removed,
        added,
        fixed: d.fixed,
      }),
      error: null,
    };
  } catch (e) {
    return {
      plan: null,
      error: e instanceof Error ? e.message : 'These prizes do not add up.',
    };
  }
}

/** The setup draft for "Play again" (TAM-068): same players, contribution, patterns and split. */
export function draftFromConfig(config: TambolaConfig): SetupDraft {
  const patterns = config.tiers.map((t) => t.pattern);
  const draft: SetupDraft = {
    count: String(config.players.length),
    names: config.players.map((p) => p.name),
    tickets: config.players.map((p) => p.tickets),
    contribution: config.money ? String(config.money.contribution) : '50',
    noMoney: config.money === null,
    patterns,
    fixed: {},
    labels: Object.fromEntries(config.tiers.filter((t) => t.label).map((t) => [t.pattern, t.label])),
  };
  if (!config.money) return draft;
  // Keep any amounts the anchor had changed.
  const unfixed = plan(draft).plan;
  const fixed: Partial<Record<Pattern, number>> = {};
  for (const t of config.tiers) {
    if (unfixed?.tiers.find((x) => x.pattern === t.pattern)?.amount !== t.amount) fixed[t.pattern] = t.amount;
  }
  return { ...draft, fixed };
}

export function Setup({
  prefs,
  settings,
  initial,
  onDraft,
  onStart,
  onCancel,
  sessionLine,
}: {
  prefs: Preferences;
  settings: TambolaSettings;
  initial?: { draft: SetupDraft; step: SetupStep };
  /** Told of every change, so an unfinished setup can be remembered (PLT-006). */
  onDraft?: (draft: SetupDraft) => void;
  onStart: (config: TambolaConfig) => void;
  onCancel: () => void;
  /** PLT-029: the session line shown above "Confirm prizes". */
  sessionLine?: ReactNode;
}) {
  const [step, setStep] = useState<SetupStep>(initial?.step ?? 'mode');
  const [draft, setDraft] = useState<SetupDraft>(initial?.draft ?? emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [recent] = useState<string[]>(() => prefs.get<string[]>(NAMES_KEY, []).filter((n) => typeof n === 'string'));
  const update = (patch: Partial<SetupDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      onDraft?.(next);
      return next;
    });
    setError(null);
  };
  const go = (next: SetupStep) => {
    setError(null);
    setStep(next);
  };
  const back = {
    mode: null,
    players: 'mode',
    money: 'players',
    prizes: 'money',
  } as const;

  const confirm = () => {
    const players = resolvedPlayers(draft);
    const contribution = contributionOf(draft);
    let tiers: Tier[];
    if (contribution !== null) {
      const p = plan(draft);
      if (!p.plan) return setError(p.error ?? 'These prizes do not add up.');
      tiers = p.plan.tiers.map(({ pattern, amount }) => ({ pattern, amount }));
    } else {
      tiers = prizeInput(draft).patterns.map((pattern) => {
        const label = draft.labels[pattern]?.trim();
        return label ? { pattern, amount: 0, label } : { pattern, amount: 0 };
      });
    }
    // PLT-024: remember typed names as one-tap suggestions for next time.
    const typed = draft.names
      .slice(0, players.length)
      .map((n) => n.trim())
      .filter(Boolean);
    const names = [...typed, ...recent.filter((r) => !typed.some((t) => t.toLowerCase() === r.toLowerCase()))].slice(0, 24);
    prefs.set(NAMES_KEY, names);
    onStart({
      ticketMode: 'paper',
      players,
      money: contribution === null ? null : { currency: 'INR', contribution },
      tiers,
      settings,
    });
  };

  const prev = back[step];
  return (
    <main className="screen setup-screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={() => (prev ? go(prev) : onCancel())}>
          ← {prev ? 'Back' : 'Cancel'}
        </button>
      </header>
      {step === 'mode' && (
        <>
          <section className="stack setup-body">
            <h1 className="step-title">New game</h1>
            <p className="lead">How are tickets handed out?</p>
            <p className="note">Paper tickets: everyone brings a ticket from a Tambola ticket book.</p>
            <button type="button" className="button button-quiet button-big" disabled>
              Phone tickets (coming later)
            </button>
          </section>
          <BottomAction>
            <button type="button" className="button button-big" onClick={() => go('players')}>
              Paper tickets
            </button>
          </BottomAction>
        </>
      )}
      {step === 'players' && (
        <PlayersStep
          draft={draft}
          update={update}
          recent={recent}
          maxTickets={settings.maxTicketsPerPlayer}
          error={error}
          onNext={() => {
            const n = playerCount(draft);
            if (Number.parseInt(draft.count, 10) !== n || n < 2) return setError(`Enter the number of players, from 2 to ${MAX_PLAYERS}.`);
            const players = resolvedPlayers(draft);
            const dup = players.find((p, i) => players.some((q, j) => j < i && q.name.toLowerCase() === p.name.toLowerCase()));
            if (dup) return setError(`Two players are called ${dup.name}. Add an initial to one of them, such as "${dup.name} S".`);
            go('money');
          }}
        />
      )}
      {step === 'money' && (
        <MoneyStep
          draft={draft}
          update={update}
          error={error}
          onNext={() => {
            if (!draft.noMoney && contributionOf(draft) === null) {
              return setError('Enter the contribution per ticket in whole rupees, or tap No money.');
            }
            go('prizes');
          }}
        />
      )}
      {step === 'prizes' && <PrizesStep draft={draft} update={update} error={error} onConfirm={confirm} sessionLine={sessionLine} />}
    </main>
  );
}

function PlayersStep({
  draft,
  update,
  recent,
  maxTickets,
  error,
  onNext,
}: {
  draft: SetupDraft;
  update: (patch: Partial<SetupDraft>) => void;
  recent: string[];
  maxTickets: number;
  error: string | null;
  onNext: () => void;
}) {
  const n = playerCount(draft);
  const used = new Set(draft.names.slice(0, n).map((x) => x.trim().toLowerCase()));
  const suggestions = recent.filter((r) => !used.has(r.toLowerCase())).slice(0, 12);
  const setName = (i: number, name: string) => {
    const names = [...draft.names];
    names[i] = name;
    update({ names });
  };
  const pickSuggestion = (name: string) => {
    const blank = Array.from({ length: n }, (_, i) => i).find((i) => !(draft.names[i] ?? '').trim());
    if (blank !== undefined) return setName(blank, name);
    if (n >= MAX_PLAYERS) return;
    const names = [...draft.names];
    names[n] = name;
    update({ names, count: String(n + 1) });
  };
  return (
    <>
      <section className="stack setup-body">
        <h1 className="step-title">Players</h1>
        <label className="field">
          <span>Number of players</span>
          <input
            type="number"
            inputMode="numeric"
            min={2}
            max={MAX_PLAYERS}
            value={draft.count}
            onChange={(e) => update({ count: e.target.value })}
          />
        </label>
        {suggestions.length > 0 && (
          <div className="stack-tight">
            <p className="note">Names used before: tap to add</p>
            <div className="chips">
              {suggestions.map((s) => (
                <button key={s} type="button" className="button button-quiet" onClick={() => pickSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="note">Leave a name blank and it becomes "Player 1", "Player 2" … You can rename players during the game.</p>
        <ol className="player-list">
          {Array.from({ length: n }, (_, i) => (
            <li key={i} className="player-row">
              <label className="field grow">
                <span>Name of player {i + 1}</span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={30}
                  placeholder={`Player ${i + 1}`}
                  value={draft.names[i] ?? ''}
                  onChange={(e) => setName(i, e.target.value)}
                />
              </label>
              <label className="field">
                <span>Tickets</span>
                <select
                  aria-label={`Tickets for player ${i + 1}`}
                  value={draft.tickets[i] ?? 1}
                  onChange={(e) => {
                    const tickets = [...draft.tickets];
                    tickets[i] = Number(e.target.value);
                    update({ tickets });
                  }}
                >
                  {Array.from({ length: maxTickets }, (_, k) => (
                    <option key={k} value={k + 1}>
                      {k + 1}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ol>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <BottomAction>
        <button type="button" className="button button-big" onClick={onNext}>
          Next
        </button>
      </BottomAction>
    </>
  );
}

function MoneyStep({
  draft,
  update,
  error,
  onNext,
}: {
  draft: SetupDraft;
  update: (patch: Partial<SetupDraft>) => void;
  error: string | null;
  onNext: () => void;
}) {
  const tickets = resolvedPlayers(draft).reduce((s, p) => s + p.tickets, 0);
  const c = contributionOf(draft);
  return (
    <>
      <section className="stack setup-body">
        <h1 className="step-title">Contribution</h1>
        {draft.noMoney ? (
          <>
            <p className="lead">No money: play for fun. Prizes can be small treats, such as chocolate.</p>
            <button type="button" className="button button-quiet" onClick={() => update({ noMoney: false })}>
              Play for money instead
            </button>
          </>
        ) : (
          <>
            <label className="field">
              <span>Contribution per ticket</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={draft.contribution}
                onChange={(e) => update({ contribution: e.target.value })}
              />
            </label>
            <p className="pot" aria-live="polite">
              {c === null
                ? `${plural(tickets, 'ticket')} in play`
                : `Pot: ${rupees(tickets * c)} (${plural(tickets, 'ticket')} × ${rupees(c)})`}
            </p>
            <p className="note">The app only works out the prizes. Money is collected and paid by hand, never through the app.</p>
            <button type="button" className="button button-quiet" onClick={() => update({ noMoney: true, fixed: {} })}>
              No money
            </button>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <BottomAction>
        <button type="button" className="button button-big" onClick={onNext}>
          Next
        </button>
      </BottomAction>
    </>
  );
}

function PrizesStep({
  draft,
  update,
  error,
  onConfirm,
  sessionLine,
}: {
  draft: SetupDraft;
  update: (patch: Partial<SetupDraft>) => void;
  error: string | null;
  onConfirm: () => void;
  sessionLine?: ReactNode;
}) {
  const [editing, setEditing] = useState<{
    pattern: Pattern;
    text: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { patterns, tickets } = prizeInput(draft);
  const money = !draft.noMoney;
  const result = money ? plan(draft) : { plan: null, error: null };
  const amountOf = (p: Pattern) => result.plan?.tiers.find((t) => t.pattern === p)?.amount ?? 0;

  const setPatterns = (next: Pattern[]) => {
    const fixed = { ...draft.fixed };
    for (const p of PATTERNS) if (!next.includes(p)) delete fixed[p];
    update({ patterns: next, fixed });
  };
  const commit = (pattern: Pattern, text: string) => {
    setEditing(null);
    const v = Number(text.trim());
    if (text.trim() === '' || !Number.isSafeInteger(v) || v < 0) {
      setEditError('Type a whole amount in rupees.');
      return;
    }
    const fixed = { ...draft.fixed, [pattern]: v };
    const trial = plan({ ...draft, fixed });
    if (!trial.plan) {
      setEditError(trial.error);
      return;
    }
    setEditError(null);
    update({ fixed });
  };

  return (
    <>
      <section className="stack setup-body">
        <h1 className="step-title">Prizes</h1>
        <p className="lead">
          {money && result.plan
            ? `Pot ${rupees(result.plan.pot)} from ${plural(tickets, 'ticket')}. The prizes always add up to the pot.`
            : `${plural(tickets, 'ticket')} in play. Prizes are optional: type a treat for each, or leave them blank.`}
        </p>
        <ul className="tier-list">
          {patterns.map((p) => (
            <li key={p} className="tier-row">
              <span className="tier-name">{PATTERN_NAMES[p]}</span>
              {money ? (
                <>
                  <span className="tier-input">
                    <span aria-hidden="true">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      aria-label={`${PATTERN_NAMES[p]} amount`}
                      value={editing?.pattern === p ? editing.text : String(amountOf(p))}
                      onChange={(e) => setEditing({ pattern: p, text: e.target.value })}
                      onBlur={(e) => {
                        if (editing?.pattern === p) commit(p, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commit(p, (e.target as HTMLInputElement).value);
                      }}
                    />
                  </span>
                </>
              ) : (
                <input
                  type="text"
                  className="tier-label"
                  maxLength={30}
                  aria-label={`${PATTERN_NAMES[p]} prize`}
                  placeholder="Optional treat"
                  value={draft.labels[p] ?? ''}
                  onChange={(e) => update({ labels: { ...draft.labels, [p]: e.target.value } })}
                />
              )}
              {p !== 'full-house' ? (
                <button
                  type="button"
                  className="button button-quiet tier-remove"
                  aria-label={`Remove ${PATTERN_NAMES[p]}`}
                  onClick={() => setPatterns(patterns.filter((x) => x !== p))}
                >
                  ✕ Remove
                </button>
              ) : (
                <span className="tier-remove-space" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
        {PATTERNS.some((p) => !patterns.includes(p)) && (
          <div className="chips">
            {PATTERNS.filter((p) => !patterns.includes(p)).map((p) => (
              <button key={p} type="button" className="button button-quiet tier-add" onClick={() => setPatterns([...patterns, p])}>
                + {PATTERN_NAMES[p]}
              </button>
            ))}
          </div>
        )}
        {money && Object.keys(draft.fixed).length > 0 && (
          <button type="button" className="button button-quiet" onClick={() => update({ fixed: {} })}>
            Use the suggested amounts
          </button>
        )}
        {(editError || result.error || error) && (
          <p className="error" role="alert">
            {editError ?? result.error ?? error}
          </p>
        )}
        <p className="note">Once you confirm, the prizes are locked for this game.</p>
      </section>
      <BottomAction>
        {sessionLine}
        <button type="button" className="button button-big" onClick={onConfirm} disabled={money && !result.plan}>
          Confirm prizes
        </button>
      </BottomAction>
    </>
  );
}

/** TAM-181: the step's main button stays fixed at the bottom of the screen. */
function BottomAction({ children }: { children: ReactNode }) {
  return <div className="bottom-action">{children}</div>;
}
