// Jev (TypeSafe AI, "System One") for simulations: PLT-111, PLT-113, PLT-114, PLT-115, PLT-122.
// Jev returns typed decisions with probabilities. It never writes text, never counts, and is never the referee:
// code works out the facts, Jev picks one of the options code offers, and the rules engine decides every verdict.
//
// Key: JEV_API_KEY from the environment, or from the gitignored `.env.local` at the repo root. The key is only ever
// placed in the Authorization header. It is never printed, logged, saved in a replay or a summary (PLT-115): every
// error message passes through `redact()` first.
//
// Cap (PLT-113): 20,000 Jev decisions a week (owner, 2026-09-29). One decision = one question in a call. Usage is
// kept per ISO week in `reports/runs/jev-usage.json` (gitignored); when the cap is reached no more calls are made and
// the run finishes with scripted players.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
export const JEV_MODEL = 'jev-latest';
/** Owner, 2026-09-29 (PLT-113). */
export const WEEKLY_CAP = 20_000;
export const NO_KEY_MESSAGE = 'No Jev key: ran with random and scripted players';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const USAGE_FILE = `${ROOT}reports/runs/jev-usage.json`;

/** The Jev key, or null. Reads the environment first, then `.env.local`. Never print the result. */
export function loadJevKey(env: Record<string, string | undefined> = process.env, envFile = `${ROOT}.env.local`): string | null {
  const fromEnv = env.JEV_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (env.JEV_IGNORE_ENV_FILE === '1' || !envFile || !existsSync(envFile)) return null;
  const line = readFileSync(envFile, 'utf8').split(/\r?\n/).find((l) => /^\s*(export\s+)?JEV_API_KEY\s*=/.test(l));
  if (!line) return null;
  const value = line.replace(/^\s*(export\s+)?JEV_API_KEY\s*=\s*/, '').trim().replace(/^["']|["']$/g, '');
  return value || null;
}

/** Replaces the key, and anything shaped like a TypeSafe key, with "[redacted]" (PLT-115). */
export function redact(text: string, key?: string | null): string {
  let out = String(text);
  if (key) out = out.split(key).join('[redacted]');
  return out.replace(KEY_SHAPE, '[redacted]').replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
}
/** Anything that looks like a TypeSafe API key (PLT-115). */
export const KEY_SHAPE = /apikey_[A-Za-z0-9_\-.]{16,}/g;

// ---------- The weekly budget (PLT-113) ----------

/** ISO week, such as "2026-W40". */
export function isoWeek(ms: number): string {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7; // Monday 0
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface Budget {
  readonly cap: number;
  /** Decisions already used this week, by earlier runs and this one. */
  used(): number;
  left(): number;
  /** Reserves `n` decisions. False (and nothing reserved) if that would pass the cap. */
  take(n: number): boolean;
  /** Decisions this run used. */
  readonly thisRun: number;
  /** Why the last `take` was refused: the owner's weekly cap, or this run's own lower limit. */
  readonly stoppedBy: 'weekly cap' | 'run limit' | null;
}

/** A budget kept in memory only (tests), or in a JSON file per ISO week (real runs). */
export function makeBudget(opts: { cap?: number; runLimit?: number; usedAlready?: number; file?: string | null; now?: number } = {}): Budget {
  const cap = opts.cap ?? WEEKLY_CAP;
  const week = isoWeek(opts.now ?? Date.now());
  const file = opts.file ?? null;
  let before = opts.usedAlready ?? 0;
  if (file && existsSync(file)) {
    try { before = Number(JSON.parse(readFileSync(file, 'utf8'))[week] ?? 0) || 0; } catch { before = 0; }
  }
  let run = 0;
  let stoppedBy: Budget['stoppedBy'] = null;
  const runLimit = opts.runLimit ?? Infinity;
  const save = () => {
    if (!file) return;
    let all: Record<string, number> = {};
    try { if (existsSync(file)) all = JSON.parse(readFileSync(file, 'utf8')); } catch { all = {}; }
    all[week] = before + run;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(all, null, 1));
  };
  return {
    cap,
    used: () => before + run,
    left: () => Math.max(0, Math.min(cap - before - run, runLimit - run)),
    take(n: number) {
      if (before + run + n > cap) { stoppedBy = 'weekly cap'; return false; }
      if (run + n > runLimit) { stoppedBy = 'run limit'; return false; }
      run += n;
      save();
      return true;
    },
    get thisRun() { return run; },
    get stoppedBy() { return stoppedBy; },
  };
}

// ---------- Calls ----------

export interface ChoiceQuestion { type: 'choice'; instructions: unknown; criteria: Record<string, unknown> }
export interface ChoiceAnswer { type: 'choice'; choice: string; confidence: number; probabilities: Record<string, number> }
export interface JevRequest { state: unknown; model: string; questions: Record<string, ChoiceQuestion> }
export interface JevResponse { model: string; answers: Record<string, ChoiceAnswer>; usage?: { input_tokens?: number; output_tokens?: number } }

/** How a request reaches Jev. Tests pass a fake; real runs use `httpTransport`. */
export type Transport = (body: JevRequest, key: string) => Promise<JevResponse>;

export class JevUnavailable extends Error {}

export const httpTransport: Transport = async (body, key) => {
  let res: Response;
  try {
    res = await fetch(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e: any) {
    throw new JevUnavailable(redact(`Jev could not be reached: ${e?.message ?? e}`, key));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new JevUnavailable(redact(`Jev answered ${res.status}: ${text.slice(0, 200)}`, key));
  }
  return (await res.json()) as JevResponse;
};

export interface JevStats { calls: number; decisions: number; inputTokens: number; failures: string[]; capReached: boolean; stoppedBy: Budget['stoppedBy'] }

export interface Jev {
  readonly stats: JevStats;
  /** True while Jev can still be asked (a key, budget left, not failed twice in a row). */
  available(questions?: number): boolean;
  /** Asks several Choice questions in one call (fan-out). Null if Jev is unavailable or out of budget. */
  choose(state: unknown, questions: Record<string, ChoiceQuestion>): Promise<Record<string, ChoiceAnswer> | null>;
}

/**
 * A Jev client with a budget. It never throws: when Jev is unavailable (PLT-122: no key, a time-out, an error) it
 * returns null and the caller uses its scripted player. A failed call is retried once (PLT-122); after that Jev is
 * treated as unavailable for the rest of the run.
 */
export function makeJev(opts: { key: string | null; budget: Budget; transport?: Transport }): Jev {
  const transport = opts.transport ?? httpTransport;
  const stats: JevStats = { calls: 0, decisions: 0, inputTokens: 0, failures: [], capReached: false, stoppedBy: null };
  let broken = !opts.key;
  return {
    stats,
    available(questions = 1) {
      if (broken) return false;
      if (opts.budget.left() < questions) {
        stats.capReached = true;
        stats.stoppedBy = opts.budget.cap - opts.budget.used() < questions ? 'weekly cap' : 'run limit';
        return false;
      }
      return true;
    },
    async choose(state, questions) {
      const n = Object.keys(questions).length;
      if (n === 0 || broken || !opts.key) return null;
      if (!opts.budget.take(n)) { stats.capReached = true; stats.stoppedBy = opts.budget.stoppedBy; return null; }
      const body: JevRequest = { state, model: JEV_MODEL, questions };
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          stats.calls++;
          const res = await transport(body, opts.key);
          stats.decisions += n;
          stats.inputTokens += res.usage?.input_tokens ?? 0;
          const answers = res.answers ?? {};
          return answers;
        } catch (e: any) {
          stats.failures.push(redact(String(e?.message ?? e), opts.key));
        }
      }
      // Two failures in a row: counted against the budget already, and Jev is off for the rest of the run.
      broken = true;
      return null;
    },
  };
}

/**
 * The Jev client for a run, from the environment (PLT-114): null, with the plain note, when there is no key or Jev is
 * turned off (`JEV=off`). The note never contains the key.
 */
export function jevForRun(opts: { env?: Record<string, string | undefined>; envFile?: string; budget?: Budget; transport?: Transport } = {}): {
  jev: Jev | null; note: 'no-key' | 'off' | 'jev';
} {
  const env = opts.env ?? process.env;
  if (env.JEV === 'off') return { jev: null, note: 'off' };
  const key = opts.envFile === undefined ? loadJevKey(env) : loadJevKey(env, opts.envFile);
  if (!key) return { jev: null, note: 'no-key' };
  const budget = opts.budget ?? makeBudget({ file: USAGE_FILE });
  return { jev: makeJev({ key, budget, ...(opts.transport ? { transport: opts.transport } : {}) }), note: 'jev' };
}
