// Problem reports (Phase 7, specs/platform/03-feedback.md, PLT-200 to PLT-208). Pure: no network, no storage,
// no screen, and the clock only through `at` / `now`. The app decides where a report goes (for now a stub that
// keeps it on the phone, PLT-208).
//
// A report never holds a name or a session name (PLT-201): each game says how to take names out of its setup and
// moves (`GameRules.forReport`). The money numbers stay in (owner, 2026-10-01), so money bugs replay (PLT-204). A report about a game still being played holds no seed until
// that game ends (PLT-206): `addSeeds` puts them in afterwards.
import type { GameRules, SetupInput } from './contract';
import type { Move, MoveRecord } from './moves';
import type { MoneyRecord } from './money';
import type { GameStatus, SavedGame } from './saved-game';

export const REPORT_FORMAT = 1;

export interface ReportGame {
  readonly gameType: string;
  readonly id: string;
  /** The game's status when it was reported. */
  readonly status: GameStatus;
  /** The setup with names taken out (money numbers kept); `seeds` empty until the game is over (PLT-206). Null if the game cannot say. */
  readonly setup: SetupInput<unknown> | null;
  /** The moves when it was reported, with names taken out. */
  readonly records: readonly MoveRecord[];
  /** The saved game's money record once it has ended, names as "Player N"; null otherwise (PLT-201). */
  readonly money?: MoneyRecord | null;
}

export interface ReportTicket {
  readonly ticket: number;
  readonly rows: readonly (readonly (number | null)[])[];
  readonly marks: readonly number[];
}

export interface Report {
  readonly v: typeof REPORT_FORMAT;
  readonly id: string;
  readonly at: number;
  readonly from: 'host' | 'player';
  /** The "What happened?" sentence, with player names replaced by "Player N". */
  readonly what: string;
  readonly appVersion: string;
  readonly phone: string;
  readonly error?: { readonly message: string; readonly stack?: string };
  readonly game?: ReportGame | null;
  /** PLT-206: the report waits, without seeds, until its game has ended or been discarded. */
  readonly waitingForGameEnd: boolean;
  /** Player reports only (PLT-207): this phone's own tickets and marks. */
  readonly tickets?: readonly ReportTicket[];
}

/** A game's setup and moves made safe to report: names become "Player N" (PLT-201). */
export interface ReportSafeGame<Config, M extends Move> {
  readonly setup: SetupInput<Config>;
  readonly records: readonly MoveRecord<M>[];
  /** Every name that was in the game (setup, renames, late joiners) and what it became, to clean the sentence typed. */
  readonly names: readonly { readonly name: string; readonly as: string }[];
  /** Each player id and the "Player N" it became, to clean the money record. */
  readonly ids?: readonly { readonly id: string; readonly as: string }[];
}

/** What a screen asks the app to report on: the game on screen (by its saved id), a player's tickets, or nothing. */
export type ReportSubject =
  | { readonly kind: 'game'; readonly gameId: string }
  | { readonly kind: 'tickets'; readonly tickets: readonly PlayerTicketInput[] }
  | null;

export interface PlayerTicketInput {
  readonly v: 1;
  readonly game: string;
  readonly ticket: number;
  readonly name: string;
  readonly rows: readonly (readonly (number | null)[])[];
  readonly startedAt: number;
  readonly tiers: readonly string[];
  readonly marks: readonly number[];
}

interface Common {
  readonly what: string;
  readonly appVersion: string;
  readonly phone: string;
  readonly at: number;
  /** Keeps the same id while the host is still typing. A new id is made when this is left out. */
  readonly id?: string;
}

export interface ReportInput extends Common {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly game?: { readonly saved: SavedGame; readonly rules: GameRules<any, any, any, any> } | null;
  readonly error?: { readonly message: string; readonly stack?: string } | null;
}

export interface PlayerReportInput extends Common {
  readonly tickets: readonly PlayerTicketInput[];
}

let counter = 0;
/** A report id: the time, a counter and a mix of the words, so reports made in the same instant still differ. */
function newId(at: number, what: string): string {
  counter = (counter + 1) % 1_000_000;
  let h = 2166136261;
  const mix = `${what}|${counter}|${at}`;
  for (let i = 0; i < mix.length; i++) h = Math.imul(h ^ mix.charCodeAt(i), 16777619) >>> 0;
  return `r-${Math.max(0, Math.floor(at)).toString(36)}-${counter.toString(36)}-${h.toString(36)}`;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Replaces each name, as a whole word and in any case, longest first ("Ashalata K" before "Ashalata"). */
export function replaceNames(text: string, names: readonly { readonly name: string; readonly as: string }[]): string {
  const list = names.filter((n) => n.name.trim() !== '').sort((a, b) => b.name.trim().length - a.name.trim().length);
  let out = text;
  for (const { name, as } of list) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escape(name.trim())}(?![\\p{L}\\p{N}])`, 'giu');
    out = out.replace(re, as);
  }
  return out;
}

const OVER: readonly GameStatus[] = ['ended', 'abandoned'];

/** The saved money record with each name replaced by that player's "Player N"; nothing else from it. */
function safeMoney(money: MoneyRecord, safe: ReportSafeGame<unknown, Move>): MoneyRecord {
  const byId = new Map((safe.ids ?? []).map((x) => [x.id, x.as]));
  return {
    currency: money.currency,
    people: money.people.map((p, i) => {
      const as = byId.get(p.personId) ?? safe.names.find((n) => n.name === p.name.trim())?.as ?? `Player ${i + 1}`;
      return {
        personId: p.personId,
        name: as,
        paid: p.paid,
        won: p.won,
        ...(p.prizes !== undefined ? { prizes: p.prizes } : {}),
      };
    }),
  };
}

/** The host phone's report (PLT-200, PLT-201, PLT-203, PLT-206). */
export function makeReport(input: ReportInput): Report {
  const id = input.id ?? newId(input.at, input.what);
  let what = input.what ?? '';
  let game: ReportGame | null = null;
  let waiting = false;
  if (input.game) {
    const { saved, rules } = input.game;
    const over = OVER.includes(saved.status);
    waiting = !over;
    const safe = rules.forReport ? (rules.forReport(saved.setup, saved.records) as ReportSafeGame<unknown, Move>) : null;
    if (safe) what = replaceNames(what, safe.names);
    game = {
      gameType: saved.gameType,
      id: saved.id,
      status: saved.status,
      setup: safe ? { gameId: safe.setup.gameId, seeds: over ? { ...safe.setup.seeds } : {}, config: safe.setup.config } : null,
      records: safe ? safe.records.map((r) => ({ v: r.v, seq: r.seq, at: r.at, by: r.by, move: r.move })) : [],
      money: over && safe && saved.money ? safeMoney(saved.money, safe) : null,
    };
  }
  const error = input.error
    ? { message: String(input.error.message), ...(input.error.stack ? { stack: String(input.error.stack).slice(0, 4000) } : {}) }
    : null;
  return {
    v: REPORT_FORMAT,
    id,
    at: input.at,
    from: 'host',
    what,
    appVersion: input.appVersion,
    phone: input.phone,
    ...(error ? { error } : {}),
    game,
    waitingForGameEnd: waiting,
  };
}

/** A player's phone: only its own tickets and marks; never a name, a seed or the setup (PLT-207). */
export function makePlayerReport(input: PlayerReportInput): Report {
  const id = input.id ?? newId(input.at, input.what);
  const names = [...new Set(input.tickets.map((t) => t.name).filter((n) => typeof n === 'string' && n.trim() !== ''))];
  const what = replaceNames(input.what ?? '', names.map((name) => ({ name, as: 'Player' })));
  return {
    v: REPORT_FORMAT,
    id,
    at: input.at,
    from: 'player',
    what,
    appVersion: input.appVersion,
    phone: input.phone,
    game: null,
    waitingForGameEnd: false,
    tickets: input.tickets.map((t) => ({
      ticket: t.ticket,
      rows: t.rows.map((row) => [...row]),
      marks: [...new Set(t.marks)].sort((a, b) => a - b),
    })),
  };
}

/**
 * PLT-206: once the reported game has ended (or was discarded or abandoned), the same report with its seeds, so it
 * replays the game as it was when reported. Otherwise (still being played, or another game) the report unchanged.
 */
export function addSeeds(report: Report, saved: SavedGame): Report {
  const game = report.game;
  if (!report.waitingForGameEnd || !game || !game.setup) return report;
  if (!saved || saved.setup?.gameId !== game.setup.gameId || !OVER.includes(saved.status)) return report;
  return { ...report, waitingForGameEnd: false, game: { ...game, setup: { ...game.setup, seeds: { ...saved.setup.seeds } } } };
}

/** The exact text shown in the preview and sent. The same report always gives the same text. */
export function reportText(report: Report): string {
  return JSON.stringify(report);
}

/** Reads a report's text back (PLT-204). Never throws. */
export function readReport(text: string): { ok: true; report: Report } | { ok: false; reason: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'This is not a problem report.' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'This is not a problem report.' };
  const r = raw as Partial<Report>;
  if (r.v !== REPORT_FORMAT) return { ok: false, reason: `Unknown report format (${String(r.v)}).` };
  if (typeof r.id !== 'string' || typeof r.at !== 'number' || (r.from !== 'host' && r.from !== 'player')) {
    return { ok: false, reason: 'The report is missing parts.' };
  }
  if (typeof r.what !== 'string' || typeof r.appVersion !== 'string' || typeof r.phone !== 'string' || typeof r.waitingForGameEnd !== 'boolean') {
    return { ok: false, reason: 'The report is missing parts.' };
  }
  return { ok: true, report: raw as Report };
}

// ----- Sorting (PLT-205) -----

export type ReportKind = 'bug' | 'confusion' | 'idea' | 'noise';

export interface ReportGroup {
  readonly kind: ReportKind;
  /** What the reports in the group share: the error message, or the words. */
  readonly about: string;
  readonly reportIds: readonly string[];
}

const WEEK_MS = 7 * 24 * 3600 * 1000;
const KIND_ORDER: readonly ReportKind[] = ['bug', 'confusion', 'idea', 'noise'];
const normalise = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * The simple rules (product owner, 2026-10-01, PLT-205), on the words in any case, a curly apostrophe counting as
 * a straight one. A word counts at the start of a word ("crash" in "crashed"). When words of two kinds appear,
 * bug wins over confusion, and confusion over idea (not yet decided by the owner: docs/test-questions.md).
 */
const KIND_WORDS: readonly (readonly [ReportKind, readonly string[]])[] = [
  ['bug', ['crash', 'error', 'wrong', "didn't work", 'stuck']],
  ['confusion', ['how do i', 'where is', "can't find", 'confusing', "didn't understand"]],
  ['idea', ['add', 'wish', 'would be nice', 'could you', 'idea']],
];
const KIND_RES = KIND_WORDS.map(([kind, words]) => [kind, new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escape).join('|')})`, 'u')] as const);
function kindOf(what: string): ReportKind {
  const text = what.toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/\s+/g, ' ');
  for (const [kind, re] of KIND_RES) if (re.test(text)) return kind;
  return 'noise';
}

/** Reports of the last 7 days, sorted into kinds, grouped, biggest group first (PLT-205). */
export function sortReports(reports: readonly Report[], { now }: { now: number }): { groups: ReportGroup[] } {
  const inWeek = reports.filter((r) => r.at <= now && r.at > now - WEEK_MS);
  const groups = new Map<string, { kind: ReportKind; about: string; ids: { id: string; at: number }[] }>();
  for (const r of inWeek) {
    const words = normalise(r.what ?? '');
    let key: string;
    let kind: ReportKind;
    let about: string;
    if (r.error) {
      kind = 'bug';
      about = r.error.message;
      key = `error:${r.error.message}`;
    } else if (words === '') {
      kind = 'noise';
      about = '';
      key = 'noise';
    } else {
      kind = kindOf(r.what ?? '');
      about = words;
      key = `words:${words}`;
    }
    const g = groups.get(key) ?? { kind, about, ids: [] };
    g.ids.push({ id: r.id, at: r.at });
    groups.set(key, g);
  }
  const list = [...groups.entries()].map(([key, g]) => ({
    key,
    kind: g.kind,
    about: g.about,
    reportIds: g.ids.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((x) => x.id),
  }));
  list.sort(
    (a, b) =>
      b.reportIds.length - a.reportIds.length ||
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
  return { groups: list.map(({ kind, about, reportIds }) => ({ kind, about, reportIds })) };
}
