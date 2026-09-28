// The optional "Check numbers" helper (TAM-139, TAM-034): for a dispute, the host types the numbers read
// out from a paper ticket and sees which have been called. Pure: it never changes a game or records anything.
import { NEEDS, PATTERN_NAMES, type ClaimCheck, type Pattern } from './types';

export type CheckResult =
  | {
      readonly ok: true;
      readonly checks: readonly ClaimCheck[];
      readonly complete: boolean;
    }
  | { readonly ok: false; readonly reason: string };

export function checkNumbers(called: readonly number[], pattern: Pattern, numbers: readonly number[]): CheckResult {
  const name = PATTERN_NAMES[pattern] ?? 'That pattern';
  const need = NEEDS[pattern];
  if (!Array.isArray(numbers) || numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 90)) {
    return { ok: false, reason: 'Every number is from 1 to 90.' };
  }
  if (new Set(numbers).size !== numbers.length) return { ok: false, reason: 'A number was typed twice.' };
  if (need !== undefined && numbers.length < need) return { ok: false, reason: `${name} needs ${need} numbers` };
  if (need !== undefined && numbers.length > need)
    return {
      ok: false,
      reason: `${name} needs ${need} numbers, not ${numbers.length}`,
    };
  const calledSet = new Set(called);
  const checks = numbers.map((n) => ({ number: n, called: calledSet.has(n) }));
  return { ok: true, checks, complete: checks.every((c) => c.called) };
}
