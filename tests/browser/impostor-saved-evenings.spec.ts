// Expected to fail (not built yet): tests marked `test.fail` wait for the Impostor screens (owner decision 2026-10-03).
// A marked test that starts passing turns red: then remove its `.fail` mark. What each test checks is unchanged.
// Impostor saved evenings on the phone (specs/impostor/10-lifecycle.md, C3): IMP-090 to IMP-099, and IMP-037's
// "Undo" after a reopen. Each test writes a saved evening (IMP-096's SavedGame, with forced deals) before the app loads,
// at a chosen fake-clock time, then opens it (Test hooks items 3, 5, 6 and 13).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, silence, test, type Page } from './fixtures';
import { backgroundAndReturn, expectOneMainButton, openHistory } from './helpers';
import {
  KHEER, P4, PANI_PURI, SAMOSA, TZ, T0, ci, exact, expectNoSecrets, fromMenu, hold, imButton, mainButton, menuButton,
  onlyEvening, passName, phoneWith, revealLines, roundMoves, savedEvening, savedEvenings, secretTerms, startEvening, textOf, turn,
  type Move,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/impostor-saved-evenings.json', import.meta.url)), 'utf8'));

const H = 3600_000;
const START: Move = { type: 'startDeal', practice: false };
/** Four forced deals with starters that follow the cycle. */
const DEALS = [
  { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' },
  { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' },
  { wordId: KHEER, impostor: 'Kabir', starter: 'Meena' },
  { wordId: 'IMPW-006', impostor: 'Riya', starter: 'Kabir' },
];
const seen = (n: number): Move[] => Array.from({ length: n }, () => ({ type: 'seen' }));
const R1_CAUGHT_WRONG = roundMoves(P4, 'Arjun', { caught: 'wrong' }, START);
const R2_ESCAPED = roundMoves(P4, 'Meena', { escaped: 'Riya' });
const lastAt = (e: any) => e.records.at(-1).at as number;

/** Whatever opens first: the evening itself, or Home with its unfinished row (then "Tap to resume"). */
async function openEvening(page: Page) {
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  const inGame = page.getByTestId('main-button').or(page.getByRole('heading', { name: "That's the night!" }));
  await expect(row.or(inGame).first()).toBeVisible();
  if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
}
const summaryHeading = (page: Page) => page.getByRole('heading', { name: "That's the night!" });
const leftHalfway = (page: Page) => page.getByRole('heading', { name: 'This round was left halfway. Start a fresh round?' });
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const historyRows = (page: Page) => page.getByTestId('history-game');

test.describe('IMP-090: interrupted during the deal', () => {
  test.fail('reloaded within 3 hours after Riya\'s "Done": "Welcome back." and Arjun starts his turn again at screen A', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [START, ...seen(1)] });
    await phoneWith(page, [e], { now: lastAt(e) + H });
    await openEvening(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await expect(mainButton(page)).toHaveText(exact("I'm Arjun"));
    await expect(page.getByTestId('private-block')).toHaveCount(0);
    await expectNoSecrets(page, secretTerms(SAMOSA, 'hard'), '"Welcome back."');
  });

  test.fail('a return from hidden while Arjun holds his word: "Welcome back.", his screen A again, never a block', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir' }] } });
    await turn(page, 'Riya');
    await imButton(page, 'Arjun').click();
    await hold(page, 600);
    await backgroundAndReturn(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await expect(page.getByTestId('private-block')).toHaveCount(0);
    // Every return during the deal, and Riya is not asked again.
    await imButton(page, 'Arjun').click();
    await backgroundAndReturn(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Arjun'));
  });

  test.fail('reopened more than 3 hours after the round\'s last move: "This round was left halfway."', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [START, ...seen(1)] });
    await phoneWith(page, [e], { now: lastAt(e) + 3 * H + 1 });
    await openEvening(page);
    await expect(leftHalfway(page)).toBeVisible();
    await expect(mainButton(page)).toHaveText('Next round');
  });
});

test.describe('IMP-091: interrupted later in a round', () => {
  const reopen = async (page: Page, moves: Move[], o: { choices?: any; ui?: any; after?: number } = {}) => {
    const e = savedEvening({ deals: DEALS, moves, choices: o.choices });
    await phoneWith(page, [e], { now: lastAt(e) + (o.after ?? 10 * 60_000), ui: o.ui ? { [e.id]: o.ui } : undefined });
    await openEvening(page);
    return e;
  };

  test.fail('the clues screen shows again', async ({ page }) => {
    await reopen(page, [START, ...seen(4)]);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('starter-name')).toHaveText(exact('Riya'));
  });

  test.fail('Free-flow talk shows the same screen', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }]);
    await expect(page.getByTestId('talk-heading')).toHaveText('Talk it over');
    await expect(mainButton(page)).toHaveText('Vote now');
  });

  test.fail('Timer talk shows the timer paused at its saved value', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }], { choices: { talking: 'timer' }, ui: { timerMs: 90_000 } });
    await expect(page.getByTestId('timer')).toHaveText('1:30');
    await expect(quiet(page, 'Carry on')).toBeVisible();
    await expect(page.getByText('Paused · Tap to carry on', { exact: true })).toBeVisible();
    await page.clock.runFor(3000);
    await expect(page.getByTestId('timer')).toHaveText('1:30');
  });

  test.fail('after "Vote now": the picker shows with nothing selected (after the countdown starts again)', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }, { type: 'voteNow' }]);
    await page.clock.runFor(6000);
    await expect(page.getByRole('heading', { name: 'Who got the most fingers?' })).toBeVisible();
    await expect(mainButton(page)).toHaveText('Reveal');
    await expect(mainButton(page)).toBeDisabled();
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test.fail('a re-vote stays a re-vote: only the tied names and "Still a tie"', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }, { type: 'voteNow' }, { type: 'tie', players: ['Arjun', 'Meena'] }]);
    await page.clock.runFor(6000);
    await expect(quiet(page, 'Still a tie')).toBeVisible();
    for (const p of ['Arjun', 'Meena']) await expect(page.getByRole('button', { name: new RegExp(`^(✓\\s*)?${ci(p)}(\\s*✓)?$`) })).toBeVisible();
    for (const p of ['Riya', 'Kabir']) await expect(page.getByRole('button', { name: new RegExp(`^(✓\\s*)?${ci(p)}(\\s*✓)?$`) })).toHaveCount(0);
  });

  test.fail('a caught reveal before "Show the word": every line up to the guess, "Show the word", and no word in the page', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 8));
    expect(await textOf(revealLines(page))).toEqual(['Caught red-handed! Arjun was the impostor.', 'Arjun, one guess. Say it out loud! (No repeating the clues.)']);
    await expect(mainButton(page)).toHaveText('Show the word');
    await expectNoSecrets(page, secretTerms(SAMOSA, 'easy'), 'the reopened reveal');
  });

  test.fail('after "Show the word": the word and the verdict buttons', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 9));
    await expect(revealLines(page).last()).toHaveText('The word was Samosa.');
    await expect(quiet(page, 'Guessed right')).toBeVisible();
    await expect(quiet(page, 'Wrong guess')).toBeVisible();
  });

  test.fail('IMP-037: after a verdict: the result block with "Undo"; "Undo" brings the verdict buttons back and takes the verdict out of the record', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG);
    await expect(page.getByTestId('round-outcome')).toHaveText('The crew wins!');
    await expect(mainButton(page)).toHaveText('Next round');
    await quiet(page, 'Undo').click();
    await expect(quiet(page, 'Guessed right')).toBeVisible();
    await expect(quiet(page, 'Wrong guess')).toBeVisible();
    await expect(revealLines(page).last()).toHaveText('The word was Samosa.');
    await expect(page.getByTestId('round-outcome')).toHaveCount(0);
    const types = (await onlyEvening(page)).records.map((r: any) => r.move.type);
    expect(types).not.toContain('verdict');
  });

  test.fail('an escaped reveal shows all its lines and its result block, with no "Undo"', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 7).concat([{ type: 'reveal', player: 'Meena' }]));
    expect(await textOf(revealLines(page))).toEqual(['Meena was crew!', 'The impostor was Arjun. Escaped!', 'The word was Samosa.']);
    await expect(page.getByTestId('round-outcome')).toHaveText(exact('Arjun escaped!'));
    await expect(quiet(page, 'Undo')).toHaveCount(0);
  });

  test.fail('more than 3 hours later: "left halfway"; "Next round" deals the round again (dealAgain), from the first player', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }], { after: 3 * H + 1 });
    await expect(leftHalfway(page)).toBeVisible();
    await mainButton(page).click();
    await expect(passName(page)).toHaveText(exact('Riya'));
    const recs = (await onlyEvening(page)).records;
    expect(recs.at(-1).move).toEqual({ type: 'dealAgain' });
  });
});

test.describe('IMP-092: ending and discarding the evening', () => {
  const atRound2Result = () => savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });

  test.fail('"End the evening" asks first; the summary shows with nothing recorded yet; "Discard" deletes the evening', async ({ page }) => {
    const e = atRound2Result();
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await fromMenu(page, 'End the evening');
    const dialog = page.getByRole('dialog', { name: /End the evening\?/ });
    await expect(dialog).toBeVisible();
    await expectOneMainButton(page, '"End the evening?"', 'Keep playing', true);
    await dialog.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog', { name: /End the evening\?/ }).getByRole('button', { name: 'End the evening', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await expect(page.getByTestId('summary-line')).toHaveText('2 rounds · impostor caught 1 · escaped 1');
    await expect(mainButton(page)).toHaveText('Back to Home');
    await expect(menuButton(page)).toHaveCount(0);
    const quietOrder = await textOf(page.getByRole('button').filter({ hasText: /^(Oops, keep playing|Play something else|Share|History|Discard this evening)$/ }));
    expect(quietOrder).toEqual(['Oops, keep playing', 'Play something else', 'Share', 'History', 'Discard this evening']);
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('in-progress');
    expect(saved.records.map((r: any) => r.move.type)).not.toContain('endEvening');
    await quiet(page, 'Discard this evening').click();
    const discard = page.getByRole('dialog', { name: /Discard this evening\? Its rounds and scores will be lost\./ });
    await expect(discard).toBeVisible();
    await expectOneMainButton(page, '"Discard this evening?"', 'Keep it', true);
    await discard.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toHaveCount(0);
  });

  test.fail('"Back to Home" records endEvening; the evening is kept in History', async ({ page }) => {
    const e = atRound2Result();
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog', { name: /End the evening\?/ }).getByRole('button', { name: 'End the evening', exact: true }).click();
    await mainButton(page).filter({ hasText: 'Back to Home' }).click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
    await openHistory(page);
    await expect(historyRows(page).filter({ hasText: 'Impostor · 2 rounds' })).toHaveCount(1);
  });
});

test.describe('IMP-093: ending mid-round', () => {
  test.fail('"End now? This round won\'t count."; "Oops, keep playing" returns to the round; leaving drops the round', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, { type: 'nextRound' }, ...seen(4)] });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await expect(page.getByTestId('clue-order')).toBeVisible();
    await fromMenu(page, 'End the evening');
    const dialog = page.getByRole('dialog', { name: /End now\? This round won't count\./ });
    await expect(dialog).toBeVisible();
    await expectOneMainButton(page, '"End now?"', 'Keep playing', true);
    await dialog.getByRole('button', { name: 'End now', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await expect(page.getByTestId('summary-line')).toHaveText('1 round · impostor caught 1 · escaped 0');
    await quiet(page, 'Oops, keep playing').click();
    await expect(page.getByTestId('clue-order')).toHaveText(exact('then clockwise: Arjun → Meena → Kabir → Riya'));
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog', { name: /End now\?/ }).getByRole('button', { name: 'End now', exact: true }).click();
    await mainButton(page).filter({ hasText: 'Back to Home' }).click();
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
  });
});

test.describe('IMP-094: what History keeps', () => {
  test.fail('an evening in progress is one row, "In progress", with no rounds, words or names of impostors', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openHistory(page);
    const row = historyRows(page).filter({ hasText: 'Impostor' });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('In progress');
    const text = await row.innerText();
    for (const banned of ['Samosa', 'Pani puri', 'Arjun', 'Meena', 'Round 1']) expect(text.toLowerCase(), banned).not.toContain(banned.toLowerCase());
  });

  test.fail('IMP-096: the saved fixture opens: the ended evening in History with its 3 rounds, the other resumes at Meena\'s turn', async ({ page }) => {
    await phoneWith(page, [fixture.ended, fixture.inProgress], { now: lastAt(fixture.inProgress) + 30 * 60_000 });
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'Impostor, 9:30 pm, round 3' })).toBeVisible();
    await openEvening(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Meena'));
    await openHistory(page);
    const row = historyRows(page).filter({ hasText: 'Impostor · 3 rounds' });
    await expect(row).toHaveCount(1);
    await row.click();
    expect(await textOf(page.getByTestId('history-round'))).toEqual([
      expect.stringMatching(/^Round 1 · Samosa · [Aa][Rr][Jj][Uu][Nn] caught, wrong guess/),
      expect.stringMatching(/^Round 2 · Pani puri · [Mm][Ee][Ee][Nn][Aa] escaped/),
      expect.stringMatching(/^Round 3 · Kheer \/ Payasam · [Kk][Aa][Bb][Ii][Rr] escaped/),
    ]);
  });

  test.fail('IMP-096: the app saves every evening as a format 2 SavedGame of gameType "impostor", by the host, at every move', async ({ page }) => {
    await startEvening(page, { seeds: { word: 'w96', starter: 's96', deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    let saved = await onlyEvening(page);
    expect(saved).toMatchObject({ format: 2, gameType: 'impostor', status: 'in-progress', setup: { gameId: 'impostor', seeds: { word: 'w96', starter: 's96' } } });
    expect(typeof saved.sessionId).toBe('string');
    expect(saved.setup.config.players).toEqual(P4);
    expect(saved.setup.config.choices).toEqual({ mode: 'easy', talking: 'free', score: false, words: 'family', categories: expect.any(Array), nonveg: false });
    expect(saved.setup.config.excludedWords).toEqual({ dealtTonight: expect.any(Array), recent: expect.any(Array), blocked: expect.any(Array) });
    expect(saved.records).toEqual([{ v: 1, seq: 1, at: expect.any(Number), by: 'host', move: { type: 'startDeal', practice: false } }]);
    await turn(page, 'Riya');
    saved = await onlyEvening(page);
    expect(saved.records.map((r: any) => r.move)).toEqual([{ type: 'startDeal', practice: false }, { type: 'seen' }]);
  });
});

test.describe('IMP-095, IMP-097, IMP-098: the summary', () => {
  const SEVEN = [
    { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Riya', starter: 'Arjun' },
    { wordId: 'IMPW-008', impostor: 'Arjun', starter: 'Meena' }, { wordId: 'IMPW-009', impostor: 'Kabir', starter: 'Kabir' },
    { wordId: 'IMPW-010', impostor: 'Riya', starter: 'Riya' }, { wordId: 'IMPW-011', impostor: 'Kabir', starter: 'Arjun' },
    { wordId: 'IMPW-014', impostor: 'Arjun', starter: 'Meena' },
  ];
  const sevenRounds: Move[] = [
    ...roundMoves(P4, 'Arjun', { escaped: 'Meena' }, START),
    ...roundMoves(P4, 'Riya', { caught: 'wrong' }),
    ...roundMoves(P4, 'Arjun', { escaped: 'Meena' }),
    ...roundMoves(P4, 'Kabir', { caught: 'right' }),
    ...roundMoves(P4, 'Riya', { caught: 'wrong' }),
    ...roundMoves(P4, 'Kabir', { escaped: 'Meena' }),
    ...roundMoves(P4, 'Arjun', { caught: 'wrong' }),
  ];
  const toSummary = async (page: Page, e: any) => {
    await page.addInitScript(() => {
      (window as any).__shared = [];
      Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: (d: { text: string }) => { (window as any).__shared.push(d.text); return Promise.resolve(); } });
    });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog', { name: /End the evening\?/ }).getByRole('button', { name: 'End the evening', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
  };

  test.fail('IMP-095: best impostor, most suspected and rounds played, in this order', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: SEVEN, moves: sevenRounds }));
    expect(await textOf(page.getByTestId('fun-line'))).toEqual([
      expect.stringMatching(exact('Best impostor: Arjun, escaped 2 times')),
      expect.stringMatching(exact('Most suspected: Meena, picked 3 times while crew')),
      'Rounds played: 7',
    ]);
    await expect(page.getByTestId('summary-line')).toHaveText('7 rounds · impostor caught 4 · escaped 3');
  });

  test.fail('IMP-097: an evening with only the practice round: "0 rounds", no fun lines, no Share; leaving deletes it', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { escaped: 'Meena' }, { type: 'startDeal', practice: true }) });
    await toSummary(page, e);
    await expect(page.getByTestId('summary-line')).toHaveText('0 rounds · impostor caught 0 · escaped 0');
    await expect(page.getByTestId('fun-line')).toHaveCount(0);
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await expect(quiet(page, 'Share')).toHaveCount(0);
    for (const b of ['Oops, keep playing', 'Play something else', 'History', 'Discard this evening']) await expect(quiet(page, b)).toBeVisible();
    await mainButton(page).filter({ hasText: 'Back to Home' }).click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
  });

  test.fail('IMP-098: one counted round: "1 round", "Rounds played: 1", Share\'s first line "Impostor night · 1 round"', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: DEALS, moves: R1_CAUGHT_WRONG }));
    await expect(page.getByTestId('summary-line')).toHaveText('1 round · impostor caught 1 · escaped 0');
    expect(await textOf(page.getByTestId('fun-line'))).toEqual(['Rounds played: 1']);
    await quiet(page, 'Share').click();
    const shared: string[] = await page.evaluate(() => (window as any).__shared);
    expect(shared.length).toBe(1);
    expect(shared[0]!.split('\n')[0]).toBe('Impostor night · 1 round');
  });

  test.fail('IMP-098: "escaped 1 time"', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { escaped: 'Meena' }, START) }));
    await expect(page.getByTestId('fun-line').first()).toHaveText(exact('Best impostor: Arjun, escaped 1 time'));
    await expect(page.getByTestId('summary-line')).toHaveText('1 round · impostor caught 0 · escaped 1');
  });
});

test.describe('IMP-099: time limits, measured exactly', () => {
  test.fail('3 hours after the round\'s last move exactly: the same step; 1 ms more: "left halfway"', async ({ page, browser }) => {
    const e = savedEvening({ deals: DEALS, moves: [START, ...seen(4)] });
    await phoneWith(page, [e], { now: lastAt(e) + 3 * H });
    await openEvening(page);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(leftHalfway(page)).toHaveCount(0);
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    await phoneWith(later, [e], { now: lastAt(e) + 3 * H + 1 });
    await openEvening(later);
    await expect(leftHalfway(later)).toBeVisible();
    await ctx.close();
  });

  test.fail('the summary\'s 3 hours: at exactly 3 hours it still offers "Oops, keep playing"; 1 ms later endEvening is recorded at that moment and "Oops" is gone', async ({ page, browser }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });
    const shownAt = lastAt(e) + 5 * 60_000;
    await phoneWith(page, [e], { now: shownAt + 3 * H, ui: { [e.id]: { summaryShownAt: shownAt } } });
    await openEvening(page);
    await expect(summaryHeading(page)).toBeVisible();
    await expect(quiet(page, 'Oops, keep playing')).toBeVisible();
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    const now = shownAt + 3 * H + 1;
    await phoneWith(later, [e], { now, ui: { [e.id]: { summaryShownAt: shownAt } } });
    await expect(summaryHeading(later)).toBeVisible();
    await expect(quiet(later, 'Oops, keep playing')).toHaveCount(0);
    const saved = await onlyEvening(later);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
    expect(saved.records.at(-1).at).toBeGreaterThanOrEqual(now);
    await ctx.close();
  });

  test.fail('12 hours after the last completed round: still unfinished at exactly 12 hours; 1 ms later ended by itself and kept in History', async ({ page, browser }) => {
    const moves = [...R1_CAUGHT_WRONG, { type: 'nextRound' }, ...seen(1)];
    const verdictAt = T0 + 9 * 20_000; // record 10, the verdict
    const e = savedEvening({ deals: DEALS, moves, at: { 9: verdictAt, 10: verdictAt + 60_000, 11: verdictAt + 120_000 } });
    expect(e.records[9].move.type).toBe('verdict');
    await phoneWith(page, [e], { now: verdictAt + 12 * H });
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toBeVisible();
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    const now = verdictAt + 12 * H + 1;
    await phoneWith(later, [e], { now });
    await expect(later.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    await expect(later.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toHaveCount(0);
    const saved = await onlyEvening(later);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1)).toMatchObject({ move: { type: 'endEvening' } });
    expect(saved.records.at(-1).at).toBeGreaterThanOrEqual(now);
    await ctx.close();
  });
});
