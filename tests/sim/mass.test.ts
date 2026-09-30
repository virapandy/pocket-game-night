// PLT-116, PLT-117, PLT-114: mass simulations of Tambola with scripted players, their plain summary, and the
// no-key path. Every ordinary run uses no Jev and no internet. The long weekly run (100,000 games, and Jev
// personas when a key is present) is tests/sim/extended.run.ts (PLT-118).
import { describe, expect, it } from 'vitest';
import { NO_KEY_MESSAGE, jevForRun } from './jev';
import { playGame, runMany, summaryText, type RunSummary } from './mass';

const GAMES = Number(process.env.SIM_MASS_GAMES ?? 300);

let noKey: RunSummary;
async function noKeyRun(): Promise<RunSummary> {
  // PLT-114: a run with no key at all (nothing from the environment, no `.env.local`).
  const { jev, note } = jevForRun({ env: {}, envFile: '' });
  expect(jev).toBeNull();
  noKey ??= await runMany({ games: GAMES, prefix: 'mass', jev, jevNote: note, saveReplays: true });
  return noKey;
}

describe('PLT-116: mass simulations of Tambola find rule and money bugs', () => {
  it(`${GAMES} varied games keep every rule, end, balance the money, hide the secrets and replay the same`, async () => {
    const s = await noKeyRun();
    // Each failure is already saved as a permanent replay in tests/replays/ (TAM-074).
    expect(s.failures.map((f) => `${f.seed}: ${f.problems.join('; ')}${f.replay ? ` Replay: ${f.replay}` : ''}`)).toEqual([]);
    expect(s.games).toBe(GAMES);
    expect(s.ended.never, 'every game ends (TAM-077)').toBe(0);
  });

  it('the games really are varied: paper and phone, 2 to 60 tickets, ties, late joiners, bogeys, undo, ending early, discarding', async () => {
    const s = await noKeyRun();
    expect(s.paperGames).toBeGreaterThan(0);
    expect(s.phoneGames).toBeGreaterThan(0);
    expect(s.ticketsLowest).toBeLessThanOrEqual(5);
    expect(s.ticketsHighest).toBeGreaterThanOrEqual(45);
    expect(s.ticketsHighest).toBeLessThanOrEqual(60);
    expect(s.ties).toBeGreaterThan(0);
    expect(s.lateJoiners).toBeGreaterThan(0);
    expect(s.bogeys).toBeGreaterThan(0);
    expect(s.undos).toBeGreaterThan(0);
    expect(s.ended['ended-early']).toBeGreaterThan(0);
    expect(s.ended.discarded).toBeGreaterThan(0);
    expect(s.ended.ended).toBeGreaterThan(0);
    // Scripted players who claim early, late, falsely or never (no Jev needed).
    for (const p of ['prompt', 'late', 'false', 'never', 'eager']) expect(Object.keys(s.personas)).toContain(p);
    expect(s.personas.late!.late).toBeGreaterThan(0);
    expect(s.personas.false!.falseClaims + s.personas.eager!.falseClaims).toBeGreaterThan(0);
    expect(s.personas.never!.onTime + s.personas.never!.late + s.personas.never!.falseClaims).toBe(0);
  });

  it('the same seed plays the same game (TAM-073): same records, same end', async () => {
    for (const seed of ['mass-3', 'mass-17', 'mass-42']) {
      const a = await playGame(seed), b = await playGame(seed);
      expect(JSON.stringify(b.match.records)).toBe(JSON.stringify(a.match.records));
      expect(b.ended).toBe(a.ended);
    }
  });
});

describe('PLT-117: a simulation run ends with a plain summary', () => {
  it('says games played, how they ended, claims and bogeys, ties, numbers before the first Full House, and failures', async () => {
    const text = summaryText(await noKeyRun());
    expect(text).toMatch(new RegExp(`Games played: ${GAMES} \\(`));
    expect(text).toMatch(/How they ended: \d+ played to the end, \d+ ended early, \d+ discarded, \d+ never ended/);
    expect(text).toMatch(/Claims: \d+ wins recorded, \d+ bogeys, \d+ shared prizes \(ties\)/);
    expect(text).toMatch(/Numbers called before the first Full House: lowest \d+, typical \d+, highest \d+/);
    expect(text).toMatch(/Failures: \d+/);
    const fh = noKey.firstFullHouse;
    expect(fh.lowest!).toBeLessThanOrEqual(fh.typical!);
    expect(fh.typical!).toBeLessThanOrEqual(fh.highest!);
    expect(fh.highest!).toBeLessThanOrEqual(90);
    expect(fh.lowest!).toBeGreaterThanOrEqual(15);
  });
});

describe('PLT-114: every ordinary test passes without a Jev key', () => {
  it(`without a key the simulation says "${NO_KEY_MESSAGE}" and completes`, async () => {
    const s = await noKeyRun();
    expect(summaryText(s)).toContain(`Players: ${NO_KEY_MESSAGE}`);
    expect(s.decisionsBy.jev).toBe(0);
    expect(s.jev.calls).toBe(0);
  });

  it('turning Jev off gives the same kind of run', async () => {
    const { jev, note } = jevForRun({ env: { JEV: 'off', JEV_API_KEY: 'x'.repeat(24) } });
    expect(jev).toBeNull();
    const s = await runMany({ games: 5, prefix: 'off', jev, jevNote: note });
    expect(summaryText(s)).toContain('Jev turned off: ran with random and scripted players');
    expect(s.failures).toEqual([]);
  });
});
