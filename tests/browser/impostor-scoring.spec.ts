// Expected to fail (not built yet): tests marked `test.fail` wait for the Impostor screens (owner decision 2026-10-03).
// A marked test that starts passing turns red: then remove its `.fail` mark. What each test checks is unchanged.
// Impostor scoring on the round result (specs/impostor/05-scoring.md, C3; IMP-035's headlines): IMP-040, IMP-041,
// IMP-042 (an example evening on screen), IMP-043, IMP-044. Each test reopens a saved evening at a round result
// (IMP-091) with forced deals, so every outcome is known.
import { expect, silence, test, type Page } from './fixtures';
import {
  DEFAULT_CHOICES, P4, SAMOSA, PANI_PURI, KHEER, TZ, exact, mainButton, phoneWith, roundMoves, savedEvening, type Move,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const START: Move = { type: 'startDeal', practice: false };
const openAt = async (page: Page, e: any) => {
  await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  await expect(row.or(mainButton(page)).first()).toBeVisible();
  if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
  await expect(mainButton(page)).toHaveText('Next round');
};
const rows = async (page: Page) => page.getByTestId('score-row').evaluateAll((els) => els.map((e) => ({
  name: e.getAttribute('data-name'), points: Number(e.getAttribute('data-points')), rank: Number(e.getAttribute('data-rank')),
  opacity: Number(getComputedStyle(e).opacity),
})));
const lower = (r: { name: string | null }[]) => r.map((x) => (x.name ?? '').toLowerCase());

test.describe('IMP-040: no points by default', () => {
  const DEALS = [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }];

  test('each counted round shows "Tonight: impostor caught … · escaped …", this round included; no points, ranks or scoreboard', async ({ page }) => {
    await openAt(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { caught: 'wrong' }, START) }));
    await expect(page.getByTestId('evening-line')).toHaveText('Tonight: impostor caught 1 · escaped 0');
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await expect(page.getByTestId('round-points')).toHaveCount(0);
    await expect(page.getByTestId('score-row')).toHaveCount(0);
  });

  test('after a second, escaped round: "Tonight: impostor caught 1 · escaped 1"', async ({ page }) => {
    await openAt(page, savedEvening({ deals: DEALS, moves: [...roundMoves(P4, 'Arjun', { caught: 'right' }, START), ...roundMoves(P4, 'Meena', { escaped: 'Kabir' })] }));
    await expect(page.getByTestId('evening-line')).toHaveText('Tonight: impostor caught 1 · escaped 1');
  });

  test('the practice round\'s result has no evening line', async ({ page }) => {
    await openAt(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { caught: 'wrong' }, { type: 'startDeal', practice: true }) }));
    await expect(page.getByTestId('practice-chip')).toBeVisible();
    await expect(page.getByTestId('evening-line')).toHaveCount(0);
  });

  test('IMP-035: the headlines are exactly "The crew wins!", "<Name> steals the round!" and "<Name> escaped!"', async ({ page, browser }) => {
    await openAt(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { caught: 'wrong' }, START) }));
    await expect(page.getByTestId('round-outcome')).toHaveText('The crew wins!');
    for (const [moves, headline] of [
      [roundMoves(P4, 'Arjun', { caught: 'right' }, START), "Arjun steals the round!"],
      [roundMoves(P4, 'Arjun', { escaped: 'Meena' }, START), 'Arjun escaped!'],
      [roundMoves(P4, 'Arjun', { stillTie: ['Arjun', 'Meena'] }, START), 'Arjun escaped!'],
    ] as [Move[], string][]) {
      const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
      await silence(ctx);
      const p = await ctx.newPage();
      await openAt(p, savedEvening({ deals: DEALS, moves }));
      await expect(p.getByTestId('round-outcome')).toHaveText(exact(headline));
      await ctx.close();
    }
  });
});

test.describe('IMP-041 and IMP-044: points when keeping score; the scoreboard', () => {
  // Score Yes. R1 Riya escapes (+2 Riya); R2 Arjun caught, guessed right (+1 Arjun); R3 Meena caught, guessed right
  // (+1 Meena); then Kabir leaves and Zoya joins; R4 Zoya caught, wrong guess (+1 each: Riya, Arjun, Meena).
  const DEALS = [
    { wordId: SAMOSA, impostor: 'Riya', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Arjun', starter: 'Arjun' },
    { wordId: KHEER, impostor: 'Meena', starter: 'Meena' }, { wordId: 'IMPW-006', impostor: 'Zoya', starter: 'Zoya' },
  ];
  const R1 = roundMoves(P4, 'Riya', { escaped: 'Arjun' }, START);
  const R2 = roundMoves(P4, 'Arjun', { caught: 'right' });
  const R3 = roundMoves(P4, 'Meena', { caught: 'right' });
  const NEW = ['Riya', 'Arjun', 'Meena', 'Zoya'];
  const R4 = [{ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena'] }, { type: 'setPlayers', players: NEW }, ...roundMoves(NEW, 'Zoya', { caught: 'wrong' })];
  const ev = (moves: Move[]) => savedEvening({ deals: DEALS, moves, choices: { score: true } });

  test('escaped: "+2 Riya"; the scoreboard lists everyone, highest first; no evening line', async ({ page }) => {
    await openAt(page, ev(R1));
    await expect(page.getByTestId('round-points')).toHaveText(exact('+2 Riya'));
    await expect(page.getByTestId('evening-line')).toHaveCount(0);
    const r = await rows(page);
    expect(lower(r)).toEqual(['riya', 'arjun', 'meena', 'kabir']);
    expect(r.map((x) => x.points)).toEqual([2, 0, 0, 0]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 2]);
  });

  test('caught, guessed right: "+1 Arjun"', async ({ page }) => {
    await openAt(page, ev([...R1, ...R2]));
    await expect(page.getByTestId('round-points')).toHaveText(exact('+1 Arjun'));
  });

  test('ranked 1-2-2-4, equal totals in seat order', async ({ page }) => {
    await openAt(page, ev([...R1, ...R2, ...R3]));
    await expect(page.getByTestId('round-points')).toHaveText(exact('+1 Meena'));
    const r = await rows(page);
    expect(lower(r)).toEqual(['riya', 'arjun', 'meena', 'kabir']);
    expect(r.map((x) => x.points)).toEqual([2, 1, 1, 0]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 4]);
  });

  test('caught, wrong guess: "+1 each: Riya, Arjun, Meena"; a player who left keeps their total, greyed, after current players with the same total', async ({ page }) => {
    await openAt(page, ev([...R1, ...R2, ...R3, ...R4]));
    await expect(page.getByTestId('round-points')).toHaveText(exact('+1 each: Riya, Arjun, Meena'));
    const r = await rows(page);
    expect(lower(r)).toEqual(['riya', 'arjun', 'meena', 'zoya', 'kabir']);
    expect(r.map((x) => x.points)).toEqual([3, 2, 2, 0, 0]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 4, 4]);
    expect(r.map((x) => x.opacity)).toEqual([1, 1, 1, 1, 0.5]);
  });

  test('IMP-042 (example on screen): with a leave and a join, every total is the sum of that player\'s round points', async ({ page }) => {
    await openAt(page, ev([...R1, ...R2, ...R3, ...R4]));
    const r = await rows(page);
    const want: Record<string, number> = { riya: 2 + 1, arjun: 1 + 1, meena: 1 + 1, zoya: 0, kabir: 0 };
    for (const x of r) expect(x.points, x.name ?? '').toBe(want[(x.name ?? '').toLowerCase()]);
  });

  test('a player who left and comes back with the same name (ignoring case) keeps their total and is no longer greyed', async ({ page }) => {
    // R1: Riya caught, wrong guess: +1 each to Arjun, Meena and Kabir. Kabir leaves, comes back as "kabir"; R2: +1 Arjun.
    const back = ['Riya', 'Arjun', 'Meena', 'kabir'];
    await openAt(page, ev([...roundMoves(P4, 'Riya', { caught: 'wrong' }, START), { type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena'] },
      { type: 'setPlayers', players: back }, ...roundMoves(back, 'Arjun', { caught: 'right' })]));
    const r = await rows(page);
    const kabir = r.filter((x) => (x.name ?? '').toLowerCase() === 'kabir');
    expect(kabir.length).toBe(1);
    expect(kabir[0]!.points).toBe(1);
    expect(kabir[0]!.opacity).toBe(1);
  });
});

test.describe('IMP-043: turning score on or off mid-evening', () => {
  const DEALS = [
    { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' },
    { wordId: KHEER, impostor: 'Kabir', starter: 'Meena' }, { wordId: 'IMPW-006', impostor: 'Riya', starter: 'Kabir' },
    { wordId: 'IMPW-008', impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-009', impostor: 'Meena', starter: 'Arjun' },
  ];
  const choices = (score: boolean) => ({ ...DEFAULT_CHOICES, score });
  const first3 = [
    ...roundMoves(P4, 'Arjun', { caught: 'wrong' }, START), ...roundMoves(P4, 'Meena', { escaped: 'Riya' }), ...roundMoves(P4, 'Kabir', { caught: 'right' }),
  ];
  const r4 = [{ type: 'setChoices', choices: choices(true) }, ...roundMoves(P4, 'Riya', { caught: 'wrong' })];
  const r5 = [{ type: 'setChoices', choices: choices(false) }, ...roundMoves(P4, 'Arjun', { escaped: 'Kabir' })];
  const r6 = [{ type: 'setChoices', choices: choices(true) }, ...roundMoves(P4, 'Meena', { caught: 'right' })];
  const ev = (moves: Move[]) => savedEvening({ deals: DEALS, moves });

  test('switched on before round 4: rounds from 4 score, with "Scores from round 4"', async ({ page }) => {
    await openAt(page, ev([...first3, ...r4]));
    await expect(page.getByTestId('scoreboard')).toContainText('Scores from round 4');
    await expect(page.getByTestId('round-points')).toHaveText(exact('+1 each: Arjun, Meena, Kabir'));
    const r = await rows(page);
    expect(Object.fromEntries(r.map((x) => [(x.name ?? '').toLowerCase(), x.points]))).toEqual({ riya: 0, arjun: 1, meena: 1, kabir: 1 });
    await expect(page.getByTestId('evening-line')).toHaveCount(0);
  });

  test('switched off again: no scoreboard or round points, the evening line instead', async ({ page }) => {
    await openAt(page, ev([...first3, ...r4, ...r5]));
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await expect(page.getByTestId('round-points')).toHaveCount(0);
    await expect(page.getByTestId('evening-line')).toHaveText('Tonight: impostor caught 3 · escaped 2');
  });

  test('switched on once more: scoring resumes from the next round, adding to the kept totals', async ({ page }) => {
    await openAt(page, ev([...first3, ...r4, ...r5, ...r6]));
    await expect(page.getByTestId('round-points')).toHaveText(exact('+1 Meena'));
    const r = await rows(page);
    expect(Object.fromEntries(r.map((x) => [(x.name ?? '').toLowerCase(), x.points]))).toEqual({ riya: 0, arjun: 1, meena: 2, kabir: 1 });
    await expect(page.getByTestId('scoreboard')).toContainText('Scores from round 4');
  });

  test('evenings that scored from round 1 show no "Scores from round" caption', async ({ page }) => {
    await openAt(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { caught: 'wrong' }, START), choices: { score: true } }));
    await expect(page.getByTestId('scoreboard')).toBeVisible();
    await expect(page.getByTestId('scoreboard')).not.toContainText('Scores from round');
  });
});
