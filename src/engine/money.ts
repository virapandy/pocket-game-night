// Money is calculated, never moved. Every finished game with money records what each person paid
// and won (PLT-021), so the tally works for any game without knowing its rules.

export interface PersonMoney {
  readonly personId: string;
  readonly name: string;
  /** Whole amounts in the unit the group settles in (for example rupees). */
  readonly paid: number;
  readonly won: number;
  /**
   * The part of `won` that is prizes, without money handed back (PLT-017: the tally's "won"). Missing in games
   * saved before 30 September 2026; then only `won` is known.
   */
  readonly prizes?: number;
}

export interface MoneyRecord {
  /** ISO 4217 code, such as "INR". */
  readonly currency: string;
  readonly people: readonly PersonMoney[];
}

/** Problems with a money record, in plain English. Empty means it balances: everything paid in is paid out. */
export function moneyProblems(record: MoneyRecord): string[] {
  const problems: string[] = [];
  let paid = 0;
  let won = 0;
  for (const p of record.people) {
    for (const [label, amount] of [['paid', p.paid], ['won', p.won]] as const) {
      if (!Number.isSafeInteger(amount) || amount < 0) problems.push(`${p.name} ${label} ${amount}, which is not a whole amount of zero or more`);
    }
    paid += p.paid;
    won += p.won;
  }
  if (paid !== won) problems.push(`Paid in ${paid} but paid out ${won}`);
  return problems;
}
