// Impostor saved evenings on the phone (specs/impostor/10-lifecycle.md, C3): IMP-090 to IMP-099, and IMP-037's
// "Undo" after a reopen. Each test writes a saved evening (IMP-096's SavedGame, with forced deals) before the app loads,
// at a chosen fake-clock time, then opens it (Test hooks items 3, 5, 6 and 13).
// Impostor round 4 is built (main df8f362, 4 October 2026): no test here is marked expected-to-fail.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, silence, test, type Page } from './fixtures';
import { backgroundAndReturn, expectOneMainButton, openHistory } from './helpers';
import {
  KHEER, P4, PANI_PURI, SAMOSA, TZ, T0, ci, result, summaryAction, exact, expectNoSecrets, fromMenu, hold, imButton, mainButton, menuButton,
  onlyEvening, passName, phoneWith, revealLines, roundMoves, savedEvening, savedEvenings, secretTerms, startEvening, textOf, turn,
  type Move,
  aheadOfRound5,
  settle,
  aheadOfRound6,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const readFixture = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8'));
/** The v3 format fixture (word ids on every word-dealing move; IMP-096, v3.5). */
const fixture = readFixture('impostor-saved-evenings-v3.json');
/** The v2.2 fixture: an evening from an earlier preview build, without word ids, which no longer replays. */
const oldFixture = readFixture('impostor-saved-evenings.json');

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
  const inGame = page.getByTestId('main-button').or(page.getByRole('heading', { name: /^That's the (night|game)!$/ }));
  await expect(row.or(inGame).first()).toBeVisible();
  if (await row.first().isVisible()) { await settle(page); await row.getByText('Tap to resume').first().click(); } await settle(page); // 1.3.1 (I29, R2): Home, then the reopened screen, guard their buttons for 500 ms
}
const summaryHeading = (page: Page) => page.getByRole('heading', { name: "That's the game!" });
/** v3.8 (IMP-077): between rounds, the outlined "End game" beside "Next round" opens the summary at once. */
async function endGame(page: Page) {
  await settle(page); // 1.3.1 (I29, R2): every screen's buttons are guarded for 500 ms after it shows
  await page.getByRole('button', { name: 'End game', exact: true }).click();
  await expect(summaryHeading(page)).toBeVisible();
  await settle(page);
}
const leftHalfway = (page: Page) => page.getByRole('heading', { name: 'This round was left halfway. Start a fresh round?' });
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const historyRows = (page: Page) => page.getByTestId('history-game');

test.describe('IMP-090: interrupted during the deal', () => {
  test('reloaded within 3 hours after Riya\'s "Done": "Welcome back." and Arjun starts his turn again at screen A', async ({ page }) => {
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

  test('a return from hidden while Arjun holds his word: "Welcome back.", his screen A again, never a block', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir' }] } });
    await turn(page, 'Riya');
    await settle(page); await imButton(page, 'Arjun').click();
    await hold(page, 600);
    await backgroundAndReturn(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await expect(page.getByTestId('private-block')).toHaveCount(0);
    // Every return during the deal, and Riya is not asked again.
    await settle(page); await imButton(page, 'Arjun').click();
    await backgroundAndReturn(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Arjun'));
  });

  test('reopened more than 3 hours after the round\'s last move: "This round was left halfway."', async ({ page }) => {
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

  test('the clues screen shows again', async ({ page }) => {
    await reopen(page, [START, ...seen(4)]);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('starter-name')).toHaveText(exact('Riya'));
  });

  test('Free-flow talk shows the same screen', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }]);
    await expect(page.getByTestId('talk-heading')).toHaveText('Talk it over');
    await expect(mainButton(page)).toHaveText('Vote now');
  });

  test('Timer talk shows the timer paused at its saved value', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }], { choices: { talking: 'timer' }, ui: { timerMs: 90_000 } });
    await expect(page.getByTestId('timer')).toHaveText('1:30');
    await expect(quiet(page, 'Carry on')).toBeVisible();
    await expect(page.getByText('Paused · Tap to carry on', { exact: true })).toBeVisible();
    await page.clock.runFor(3000);
    await expect(page.getByTestId('timer')).toHaveText('1:30');
  });

  test('after "Vote now": the picker shows with nothing selected (after the countdown starts again)', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }, { type: 'voteNow' }]);
    await page.clock.runFor(6000);
    await expect(page.getByRole('heading', { name: 'Who got the most fingers?' })).toBeVisible();
    await expect(mainButton(page)).toHaveText('Reveal');
    await expect(mainButton(page)).toBeDisabled();
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test('a re-vote stays a re-vote: only the tied names and "Still a tie"', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }, { type: 'voteNow' }, { type: 'tie', players: ['Arjun', 'Meena'] }]);
    await page.clock.runFor(6000);
    await expect(quiet(page, 'Still a tie')).toBeVisible();
    for (const p of ['Arjun', 'Meena']) await expect(page.getByRole('button', { name: new RegExp(`^(✓\\s*)?${ci(p)}(\\s*✓)?$`) })).toBeVisible();
    for (const p of ['Riya', 'Kabir']) await expect(page.getByRole('button', { name: new RegExp(`^(✓\\s*)?${ci(p)}(\\s*✓)?$`) })).toHaveCount(0);
  });

  test('guess on, reopened before "Arjun guessed. Show the word": the two caught lines and that button, no build-up, no word in the page', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 8));
    await expect(result(page, 'build-up')).toHaveCount(0);
    await expect(result(page, 'result-headline')).toHaveText(exact('✓ Caught!', []));
    await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
    await expect(mainButton(page)).toHaveText(exact('Arjun guessed. Show the word'));
    await expectNoSecrets(page, secretTerms(SAMOSA, 'easy'), 'the reopened guess step');
  });

  test('guess off, reopened after the reveal of the impostor: the full result at once, no build-up, no "Undo"', async ({ page }) => {
    await reopen(page, roundMoves(P4, 'Arjun', { caught: 'none' }, START), { choices: { lastGuess: false } });
    await expect(result(page, 'build-up')).toHaveCount(0);
    await expect(result(page, 'result-headline')).toHaveText(exact('✓ Caught!', []));
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(result(page, 'round-outcome')).toHaveText(exact('You caught the impostor!'));
    await expect(quiet(page, 'Undo')).toHaveCount(0);
    await expect(mainButton(page)).toHaveText('Next round');
  });

  test('after "Show the word": the word and the verdict buttons', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 9));
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(quiet(page, 'Guessed right')).toBeVisible();
    await expect(quiet(page, 'Wrong guess')).toBeVisible();
  });

  test('IMP-037: after a verdict: the result with "Undo"; "Undo" brings the verdict buttons back under the word and takes the verdict out of the record', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG);
    await expect(page.getByTestId('round-outcome')).toHaveText('You caught the impostor!');
    await expect(mainButton(page)).toHaveText('Next round');
    await quiet(page, 'Undo').click();
    await expect(quiet(page, 'Guessed right')).toBeVisible();
    await expect(quiet(page, 'Wrong guess')).toBeVisible();
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(page.getByTestId('round-outcome')).toHaveCount(0);
    await expect(menuButton(page), 'the menu goes (IMP-075)').toHaveCount(0);
    const types = (await onlyEvening(page)).records.map((r: any) => r.move.type);
    expect(types).not.toContain('verdict');
  });

  test('an escaped reveal reopens on the full result (as at t = 1.5 s), with no "Undo"', async ({ page }) => {
    await reopen(page, R1_CAUGHT_WRONG.slice(0, 7).concat([{ type: 'reveal', player: 'Meena' }]));
    await expect(result(page, 'result-headline')).toHaveText(exact('✗ Escaped!', []));
    await expect(result(page, 'result-note')).toHaveText(exact('Meena was not the impostor.'));
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(page.getByTestId('round-outcome')).toHaveText(exact('Arjun escaped!'));
    await expect(quiet(page, 'Undo')).toHaveCount(0);
  });

  test('more than 3 hours later: "left halfway"; "Next round" deals the round again (dealAgain), from the first player', async ({ page }) => {
    await reopen(page, [START, ...seen(4), { type: 'startTalk' }], { after: 3 * H + 1 });
    await expect(leftHalfway(page)).toBeVisible();
    await settle(page); // between-rounds buttons are guarded for 500 ms (IMP-077)
    await mainButton(page).click();
    await expect(passName(page)).toHaveText(exact('Riya'));
    const recs = (await onlyEvening(page)).records;
    expect(recs.at(-1).move.type).toBe('dealAgain'); // its word id (v3.5): the IMP-096 test below
  });
});

test.describe('IMP-092: ending and discarding the evening', () => {
  const atRound2Result = () => savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });

  test('IMP-077, IMP-092 (v3.9): "End game" opens the summary at once with nothing recorded yet ("Oops, keep playing" at the top, "Impostor caught 1 · escaped 1", main "Play again", then "Play something else", "Home", "More ›"); "Discard this game" deletes it', async ({ page }) => {
    const e = atRound2Result();
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await expect(menuButton(page)).toBeVisible();
    await endGame(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Impostor caught 1 · escaped 1', []));
    expect(await page.getByTestId('summary-line').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBe(32);
    await expect(mainButton(page)).toHaveText(exact('Play again', []));
    await expect(menuButton(page)).toHaveCount(0);
    const quietOrder = await textOf(page.getByRole('button').filter({ hasText: /^(Oops, keep playing|Play something else|Home|More ›)$/ }));
    expect(quietOrder).toEqual(['Oops, keep playing', 'Play something else', 'Home', 'More ›']);
    // v3.9 (IMP-092): "Oops, keep playing" full width, 48 px tall, directly under the top bar, above the heading.
    const oops = (await quiet(page, 'Oops, keep playing').boundingBox())!, head = (await summaryHeading(page).boundingBox())!;
    expect(oops.y + oops.height, '"Oops" above the heading').toBeLessThanOrEqual(head.y + 1);
    expect(oops.width, 'full width (16 px gutters)').toBeGreaterThanOrEqual(390 - 32 - 1);
    for (const name of ['Oops, keep playing', 'Play something else', 'Home', 'More ›']) {
      const b = (await quiet(page, name).boundingBox())!;
      expect(b.height, `${name}: 48 px tall`).toBeGreaterThanOrEqual(47.5);
    }
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('in-progress');
    expect(saved.records.map((r: any) => r.move.type)).not.toContain('endEvening');
    await quiet(page, 'More ›').click();
    expect(await textOf(page.getByRole('menuitem'))).toEqual(['Share', 'History', 'Discard this game']);
    await expect(page.getByRole('separator')).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'Discard this game', exact: true }).click();
    const discard = page.getByRole('dialog', { name: /Discard this game\? Its rounds and scores will be lost\./ });
    await expect(discard).toBeVisible();
    await expectOneMainButton(page, '"Discard this game?"', 'Keep it', true);
    await discard.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toHaveCount(0);
  });

  test('IMP-092 (v3.8): "Home" on the summary records endEvening; the game is kept in History', async ({ page }) => {
    const e = atRound2Result();
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await endGame(page);
    await quiet(page, 'Home').click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
    await openHistory(page);
    await expect(historyRows(page).filter({ hasText: 'Impostor · 2 rounds' })).toHaveCount(1);
  });

  test('IMP-092, IMP-103 (v3.8): "Play again" on the summary records endEvening, then "Who\'s playing?" with this game\'s players and "How do you want to play?" with its choices', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, choices: { mode: 'hard', score: true }, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await endGame(page);
    await mainButton(page).filter({ hasText: 'Play again' }).click();
    await settle(page); // v3.9: the setup screens' buttons are guarded for 500 ms whenever they show (P2)
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await expect(page.getByRole('dialog'), 'never the "Start a new game?" dialog').toHaveCount(0);
    const old = (await savedEvenings(page)).find((x: any) => x.id === e.id);
    expect(old.status).toBe('ended');
    expect(old.records.at(-1).move).toEqual({ type: 'endEvening' });
    const names = await page.getByRole('button', { name: /^Remove / }).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    expect(names, 'this game\'s final players, in seat order').toEqual(P4.map((p) => `Remove ${p}`));
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Mode', exact: true }).getByRole('button', { name: /Hard/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: 'Score', exact: true }).getByRole('button', { name: /Yes/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('IMP-093: ending mid-round', () => {
  test('"End game" in the round menu (v3.8): "End now? This round won\'t count."; "Oops, keep playing" returns to the round; leaving drops the round', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, { type: 'nextRound' }, ...seen(4)] });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openEvening(page);
    await expect(page.getByTestId('clue-order')).toBeVisible();
    await fromMenu(page, 'End game');
    await settle(page); // 1.3.1 (I29, R2): what the menu item opened guards its buttons for 500 ms
    const dialog = page.getByRole('dialog', { name: /End now\? This round won't count\./ });
    await expect(dialog).toBeVisible();
    await expectOneMainButton(page, '"End now?"', 'Keep playing', true);
    await settle(page); // 1.3.1 (I29, R2): a dialog's buttons are guarded for 500 ms after it opens
    await dialog.getByRole('button', { name: 'End now', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Impostor caught 1 · escaped 0', []));
    await summaryAction(page, 'Oops, keep playing');
    await expect(page.getByTestId('clue-order')).toHaveText(exact('Arjun → Meena → Kabir → Riya'));
    await fromMenu(page, 'End game');
    await settle(page); // 1.3.1 (I29, R2): a dialog's buttons are guarded for 500 ms after it opens
    await page.getByRole('dialog', { name: /End now\?/ }).getByRole('button', { name: 'End now', exact: true }).click();
    await settle(page); // 1.3.1 (I29, R2): the summary's buttons are guarded for 500 ms after it shows
    await quiet(page, 'Home').click();
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
  });
});

test.describe('IMP-094: what History keeps', () => {
  test('an evening in progress is one row, "In progress", with no rounds, words or names of impostors', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });
    await phoneWith(page, [e], { now: lastAt(e) + 60_000 });
    await openHistory(page);
    const row = historyRows(page).filter({ hasText: 'Impostor' });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('In progress');
    const text = await row.innerText();
    for (const banned of ['Samosa', 'Pani puri', 'Arjun', 'Meena', 'Round 1']) expect(text.toLowerCase(), banned).not.toContain(banned.toLowerCase());
  });

  test('IMP-096: the v3 format fixture opens: the ended evening in History with its 3 rounds, the other resumes at Meena\'s turn', async ({ page }) => {
    await phoneWith(page, [fixture.ended, fixture.inProgress], { now: lastAt(fixture.inProgress) + 30 * 60_000 });
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'Impostor · Riya, Arjun and 2 more · round 3' })).toBeVisible();
    await openEvening(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Meena'));
    await openHistory(page);
    const row = historyRows(page).filter({ hasText: 'Impostor · 3 rounds' });
    await expect(row).toHaveCount(1);
    await row.click();
    expect(await textOf(page.getByTestId('history-round'))).toEqual([
      expect.stringMatching(/^Round 1 · Samosa · [Aa][Rr][Jj][Uu][Nn] caught(?!,)/),
      expect.stringMatching(/^Round 2 · Pani puri · [Mm][Ee][Ee][Nn][Aa] escaped/),
      expect.stringMatching(/^Round 3 · Kheer \/ Payasam · [Kk][Aa][Bb][Ii][Rr] escaped/),
    ]);
  });

  test('IMP-096: an evening from an earlier preview build (no word ids) is never offered: not on Home, not on "What shall we play?", not in History, not as tonight\'s names; the app does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await phoneWith(page, [oldFixture.ended, oldFixture.inProgress], { now: lastAt(oldFixture.inProgress) + 30 * 60_000 });
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toHaveCount(0);
    await settle(page); // 1.3.1 (I29, R2): Home and "What shall we play?" guard their buttons for 500 ms
    await page.getByRole('button', { name: /^Host a game/ }).click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    await expect(page.getByTestId('resume-card')).toHaveCount(0);
    await page.getByRole('button', { name: /^Impostor\b/ }).click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Remove / }), 'not as tonight\'s names').toHaveCount(0);
    await openHistory(page);
    await expect(historyRows(page).filter({ hasText: 'Impostor' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('IMP-096 (v3.5): every word-dealing move is saved with the dealt word id: startDeal, dontKnow, dealAgain, nextRound, allowRepeats', async ({ page }) => {
    await startEvening(page, { seeds: { word: 'w96b', starter: 's96b', deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Kabir', starter: 'Riya' }, { wordId: KHEER, impostor: 'Meena', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Riya', starter: 'Arjun' }] } });
    expect((await onlyEvening(page)).records[0].move).toEqual({ type: 'startDeal', practice: false, wordId: SAMOSA });
    await settle(page); await imButton(page, 'Riya').click();
    await hold(page, 600);
    await page.getByRole('button', { name: "Don't know this word?", exact: true }).click();
    await settle(page); // 1.3.1 (I29, R2): a dialog's buttons are guarded for 500 ms after it opens
    await page.getByRole('dialog', { name: /New word for everyone\?/ }).getByRole('button', { name: 'New word', exact: true }).click();
    expect((await onlyEvening(page)).records.at(-1).move).toEqual({ type: 'dontKnow', wordId: PANI_PURI });
    await settle(page); await imButton(page, 'Riya').click();
    await hold(page, 600);
    await fromMenu(page, 'Deal again with a new word');
    await settle(page); // 1.3.1 (I29, R2): a dialog's buttons are guarded for 500 ms after it opens
    await page.getByRole('dialog', { name: /^Deal again\?/ }).getByRole('button', { name: 'Deal again', exact: true }).click();
    expect((await onlyEvening(page)).records.at(-1).move).toEqual({ type: 'dealAgain', wordId: KHEER });
  });

  test('IMP-096: the app saves every evening as a format 2 SavedGame of gameType "impostor", by the host, at every move (v3.5: lastGuess in the choices, the word id on startDeal)', async ({ page }) => {
    await startEvening(page, { seeds: { word: 'w96', starter: 's96', deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    let saved = await onlyEvening(page);
    expect(saved).toMatchObject({ format: 2, gameType: 'impostor', status: 'in-progress', setup: { gameId: 'impostor', seeds: { word: 'w96', starter: 's96' } } });
    expect(typeof saved.sessionId).toBe('string');
    expect(saved.setup.config.players).toEqual(P4);
    expect(saved.setup.config.choices).toEqual({ mode: 'easy', talking: 'free', score: false, words: 'family', categories: expect.any(Array), nonveg: false, lastGuess: false });
    expect(saved.setup.config.excludedWords).toEqual({ dealtTonight: expect.any(Array), recent: expect.any(Array), blocked: expect.any(Array) });
    expect(saved.records).toEqual([{ v: 1, seq: 1, at: expect.any(Number), by: 'host', move: { type: 'startDeal', practice: false, wordId: SAMOSA } }]);
    await turn(page, 'Riya');
    saved = await onlyEvening(page);
    expect(saved.records.map((r: any) => r.move)).toEqual([{ type: 'startDeal', practice: false, wordId: SAMOSA }, { type: 'seen' }]);
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
    await endGame(page);
  };

  test('IMP-095 (v3.7): best impostor and most suspected, in this order, at most 2; the lead line "Impostor caught 4 · escaped 3"', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: SEVEN, moves: sevenRounds }));
    expect(await textOf(page.getByTestId('fun-line'))).toEqual([
      expect.stringMatching(exact('Best impostor: Arjun, escaped 2 times')),
      expect.stringMatching(exact('Most suspected: Meena, picked 3 times without being the impostor')),
    ]);
    // Caught (Terms): the vote revealed the impostor, whatever the guess: 3 wrong guesses and 1 right guess; escaped 3.
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Impostor caught 4 · escaped 3', []));
  });

  test('IMP-097 (v3.9): a game with only the practice round: "Impostor caught 0 · escaped 0", no fun lines, "Oops, keep playing" at the top, "More ›" without "Share"; leaving deletes it', async ({ page }) => {
    const e = savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { escaped: 'Meena' }, { type: 'startDeal', practice: true }) });
    await toSummary(page, e);
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Impostor caught 0 · escaped 0', []));
    await expect(page.getByTestId('fun-line')).toHaveCount(0);
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(exact('Play again', []));
    for (const b of ['Oops, keep playing', 'Play something else', 'Home']) await expect(quiet(page, b)).toBeVisible();
    await expect(quiet(page, 'More ›')).toBeVisible();
    await quiet(page, 'More ›').click();
    expect(await textOf(page.getByRole('menuitem'))).toEqual(['History', 'Discard this game']);
    await page.keyboard.press('Escape');
    if (await page.getByRole('menuitem').first().isVisible()) await quiet(page, 'More ›').click();
    await quiet(page, 'Home').click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
  });

  test('IMP-098 (v3.8): one counted round: "Impostor caught 1 · escaped 0", no fun line, Share\'s first line "Impostor game · 1 round"', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: DEALS, moves: R1_CAUGHT_WRONG }));
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Impostor caught 1 · escaped 0', []));
    await expect(page.getByTestId('fun-line')).toHaveCount(0);
    await summaryAction(page, 'Share');
    const shared: string[] = await page.evaluate(() => (window as any).__shared);
    expect(shared.length).toBe(1);
    expect(shared[0]!.split('\n')[0]).toBe('Impostor game · 1 round');
  });

  test('IMP-098: "escaped 1 time"', async ({ page }) => {
    await toSummary(page, savedEvening({ deals: DEALS, moves: roundMoves(P4, 'Arjun', { escaped: 'Meena' }, START) }));
    await expect(page.getByTestId('fun-line').first()).toHaveText(exact('Best impostor: Arjun, escaped 1 time'));
  });

  test('IMP-092 and IMP-098 (v3.6): Score Yes: "Arjun wins the game with 1 point!" / "… with 2 points!"', async ({ page, browser }) => {
    await toSummary(page, savedEvening({ deals: DEALS, choices: { score: true }, moves: roundMoves(P4, 'Arjun', { caught: 'right' }, START) }));
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Arjun wins the game with 1 point!'));
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const p2 = await ctx.newPage();
    await toSummary(p2, savedEvening({ deals: DEALS, choices: { score: true }, moves: [...roundMoves(P4, 'Arjun', { caught: 'right' }, START), ...roundMoves(P4, 'Meena', { caught: 'wrong' })] }));
    // Round 1: +1 Arjun; round 2: +1 each to Riya, Arjun, Kabir: Arjun 2, Riya 1, Kabir 1.
    await expect(p2.getByTestId('summary-line')).toHaveText(exact('Arjun wins the game with 2 points!'));
    await ctx.close();
  });
});

test.describe('IMP-099: time limits, measured exactly', () => {
  test('3 hours after the round\'s last move exactly: the same step; 1 ms more: "left halfway"', async ({ page, browser }) => {
    const e = savedEvening({ deals: DEALS, moves: [START, ...seen(4)] });
    // 1.3.1 (I29, R2): Home's 500 ms tap guard never ends while the clock is fixed, so the phone opens a minute earlier
    // and the clock is paused 500 ms before the limit; openEvening waits out the guard (500 ms) and taps "Tap to resume"
    // at exactly 3 hours, with the clock still paused there.
    await phoneWith(page, [e], { now: lastAt(e) + 3 * H - 60_000 });
    await page.clock.pauseAt(lastAt(e) + 3 * H - 500);
    await openEvening(page);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(leftHalfway(page)).toHaveCount(0);
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    await phoneWith(later, [e], { now: lastAt(e) + 3 * H + 1 - 60_000 });
    await later.clock.pauseAt(lastAt(e) + 3 * H + 1 - 500); // as above: "Tap to resume" at exactly 3 hours + 1 ms
    await openEvening(later);
    await expect(leftHalfway(later)).toBeVisible();
    await ctx.close();
  });

  test('the summary\'s 3 hours: at exactly 3 hours it still offers "Oops, keep playing" (at the top, v3.9); 1 ms later endEvening is recorded at that moment and "Oops" is gone', async ({ page, browser }) => {
    const e = savedEvening({ deals: DEALS, moves: [...R1_CAUGHT_WRONG, ...R2_ESCAPED] });
    const shownAt = lastAt(e) + 5 * 60_000;
    await phoneWith(page, [e], { now: shownAt + 3 * H, ui: { [e.id]: { summaryShownAt: shownAt } }, fixed: true });
    await openEvening(page);
    await expect(summaryHeading(page)).toBeVisible();
    await expect(quiet(page, 'Oops, keep playing')).toBeVisible();
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    const now = shownAt + 3 * H + 1;
    await phoneWith(later, [e], { now, ui: { [e.id]: { summaryShownAt: shownAt } }, fixed: true });
    await expect(summaryHeading(later)).toBeVisible();
    await expect(quiet(later, 'Oops, keep playing')).toHaveCount(0);
    await quiet(later, 'More ›').click();
    await expect(later.getByRole('menuitem', { name: 'Oops, keep playing', exact: true })).toHaveCount(0);
    const saved = await onlyEvening(later);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1).move).toEqual({ type: 'endEvening' });
    expect(saved.records.at(-1).at).toBeGreaterThanOrEqual(now);
    await ctx.close();
  });

  test('12 hours after the last completed round: still unfinished at exactly 12 hours; 1 ms later ended by itself and kept in History', async ({ page, browser }) => {
    const moves = [...R1_CAUGHT_WRONG, { type: 'nextRound' }, ...seen(1)];
    const verdictAt = T0 + 9 * 20_000; // record 10, the verdict
    const e = savedEvening({ deals: DEALS, moves, at: { 9: verdictAt, 10: verdictAt + 60_000, 11: verdictAt + 120_000 } });
    expect(e.records[9].move.type).toBe('verdict');
    await phoneWith(page, [e], { now: verdictAt + 12 * H, fixed: true });
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toBeVisible();
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    await silence(ctx);
    const later = await ctx.newPage();
    const now = verdictAt + 12 * H + 1;
    await phoneWith(later, [e], { now, fixed: true });
    await expect(later.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    await expect(later.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toHaveCount(0);
    const saved = await onlyEvening(later);
    expect(saved.status).toBe('ended');
    expect(saved.records.at(-1)).toMatchObject({ move: { type: 'endEvening' } });
    expect(saved.records.at(-1).at).toBeGreaterThanOrEqual(now);
    await ctx.close();
  });
});
