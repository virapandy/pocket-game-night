// Impostor golden journeys (layer 2 of docs/proposals/e2e-and-jev-testing.md, owner approved 4 October 2026): 12
// complete evenings through the real app, each covering one path, checking the scenarios v3.5 strings at every step
// (specs/impostor/README.md, Canonical strings). Both phones, in the complete run; journey 1 is in the smoke set.
// Forced deals (Test hooks item 3) make every word, impostor and starter known.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { HOME, chooseTicketType, hostAGame, openHistory } from './helpers';
import {
  CLUES_DONE, COMMON_CATEGORIES, KHEER, P4, PANI_PURI, SAMOSA, TZ, WORDS, dealAll, dontKnow, doneButton, exact,
  expectNoSecrets, freezeClock, fromMenu, hold, holdPad, imButton, mainButton, menuButton, noPageScrollAt, onlyEvening,
  passName, pickerName, result, reveal, savedEvening, secretTerms, startEvening, summaryAction, textOf,
  toPicker, turn, word,
  aheadOfRound5,
  settle,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const DEALS3 = [
  { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' },
  { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' },
  { wordId: KHEER, impostor: 'Kabir', starter: 'Meena' },
];
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const pickerHeading = (page: Page) => page.getByRole('heading', { name: 'Who got the most fingers?' });
const summaryHeading = (page: Page) => page.getByRole('heading', { name: "That's the game!" });
const moves = async (page: Page) => (await onlyEvening(page)).records.map((r: any) => r.move);

/** The clues screen after the deal: the v3.5 lines (IMP-016, IMP-020). */
async function expectClues(page: Page, starter: string, order: string, timer = false) {
  await expect(page.getByText('✓ Everyone has seen their word.', { exact: true })).toBeVisible();
  await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('starter-name')).toHaveText(exact(starter));
  await expect(page.getByText('Each say one word about your secret:', { exact: true })).toBeVisible();
  await expect(page.getByTestId('clue-order')).toHaveText(exact(order));
  await expect(mainButton(page)).toHaveText(timer ? 'Clues done, start timer' : 'Clues done, talk it over');
}

/** The result screen's lines (IMP-033, IMP-034, IMP-038). */
async function expectResult(page: Page, r: { headline: '✓ Caught!' | '✗ Escaped!'; note?: string; impostor: string; wordId: string; outcome: string }) {
  await expect(result(page, 'result-headline')).toHaveText(exact(r.headline, []));
  if (r.note) await expect(result(page, 'result-note')).toHaveText(exact(r.note));
  else await expect(result(page, 'result-note')).toHaveCount(0);
  await expect(result(page, 'result-impostor')).toHaveText(exact(`${r.impostor} was the impostor`));
  await expect(result(page, 'word-label')).toHaveText(exact('The word was', []));
  await expect(result(page, 'result-word')).toHaveText(exact(word(r.wordId).word, []));
  await expect(result(page, 'word-category')).toHaveText(exact(word(r.wordId).category, []));
  await expect(result(page, 'round-outcome')).toHaveText(exact(r.outcome));
  await expect(mainButton(page)).toHaveText('Next round');
  await settle(page); // between-rounds buttons are guarded for 500 ms (IMP-077)
}

/** Picker → "It's a tie" with two names → "Point again: …" → re-vote → "Still a tie" (IMP-032, IMP-038). */
async function stillTie(page: Page, a: string, b: string, label: string) {
  await quiet(page, "It's a tie").click();
  await pickerName(page, a).click();
  await pickerName(page, b).click();
  await expect(mainButton(page)).toHaveText(exact(`Point again: ${label}`));
  await mainButton(page).click();
  await page.clock.runFor(6000);
  await expect(quiet(page, 'Still a tie')).toBeVisible();
  await quiet(page, 'Still a tie').click();
}

/** v3.8 (IMP-077, IMP-092): between rounds, the outlined "End game" beside "Next round" opens the summary at once. */
async function endEvening(page: Page) {
  await quiet(page, 'End game').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(summaryHeading(page)).toBeVisible();
}

test('Journey 1: defaults, 4 players, 3 rounds (caught, escaped, still a tie), end the evening, summary, History', { tag: '@smoke' }, async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { seeds: { deals: DEALS3 } });
  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
  await expect(page.getByTestId('look-away')).toHaveText(exact('Everyone else, look away!', []));
  await expect(mainButton(page)).toHaveText(exact("I'm Riya"));
  const lines = await dealAll(page);
  expect(lines.Riya).toEqual(['Your secret', 'Samosa', 'Category: Food', "Give one-word clues. Don't say it!", '']);
  expect(lines.Arjun!.slice(0, 4)).toEqual(['Your secret', "You're the impostor", 'Category: Food · Hint: Tea time', "Listen and blend in. Don't get caught!"]);
  await expectClues(page, 'Riya', 'Riya → Arjun → Meena → Kabir');
  await expect(page.getByRole('button', { name: 'Go round again', exact: true })).toBeVisible();
  await mainButton(page).click();
  await expect(page.getByTestId('talk-heading')).toHaveText(exact('Talk it over', []));
  await expect(page.getByText('Who sounded unsure?', { exact: true })).toBeVisible();
  await mainButton(page).filter({ hasText: 'Vote now' }).click();
  await expect(page.getByTestId('countdown-heading')).toHaveText('Get ready to point…');
  await page.clock.runFor(6000);
  await expect(pickerHeading(page)).toBeVisible();
  await expect(page.getByText('Not sure?', { exact: true })).toBeVisible();
  await pickerName(page, 'Arjun').click();
  await expect(mainButton(page)).toHaveText(exact('Reveal Arjun'));
  await mainButton(page).click();
  await expect(result(page, 'build-up')).toHaveText(exact('Arjun was…'));
  await page.clock.runFor(1500);
  await expectResult(page, { headline: '✓ Caught!', impostor: 'Arjun', wordId: SAMOSA, outcome: 'You caught the impostor!' });
  await expect(page.getByTestId('evening-line')).toHaveText('This game: impostor caught 1 · escaped 0');
  await mainButton(page).click();

  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  await dealAll(page);
  await expectClues(page, 'Arjun', 'Arjun → Meena → Kabir → Riya');
  await toPicker(page);
  await reveal(page, 'Riya', 1500);
  await expectResult(page, { headline: '✗ Escaped!', note: 'Riya was not the impostor.', impostor: 'Meena', wordId: PANI_PURI, outcome: 'Meena escaped!' });
  await expect(result(page, 'also-called')).toHaveText(exact('Also called Golgappa / Puchka', []));
  await expect(page.getByTestId('evening-line')).toHaveText('This game: impostor caught 1 · escaped 1');
  await mainButton(page).click();

  await dealAll(page);
  await expectClues(page, 'Meena', 'Meena → Kabir → Riya → Arjun');
  await toPicker(page);
  await stillTie(page, 'Riya', 'Kabir', 'Riya or Kabir');
  await expectResult(page, { headline: '✗ Escaped!', note: 'Still a tie.', impostor: 'Kabir', wordId: KHEER, outcome: 'Kabir escaped!' });
  await expect(page.getByTestId('evening-line')).toHaveText('This game: impostor caught 1 · escaped 2');

  await endEvening(page);
  await expect(page.getByTestId('summary-line')).toHaveText('Impostor caught 1 · escaped 2');
  expect(await textOf(page.getByTestId('fun-line'))).toEqual([expect.stringMatching(exact('Best impostor: Meena, escaped 1 time'))]);
  await expect(mainButton(page)).toHaveText(exact('Play again', []));
  await quiet(page, 'Home').click();
  await expect(hostAGame(page)).toBeVisible();
  const saved = await onlyEvening(page);
  expect(saved.status).toBe('ended');
  await summaryOrHistory(page);
});

/** Home → History: the evening's row and its 3 round rows (IMP-105). */
async function summaryOrHistory(page: Page) {
  await openHistory(page);
  const row = page.getByTestId('history-game').filter({ hasText: 'Impostor · 3 rounds' });
  await expect(row).toHaveCount(1);
  await row.click();
  expect(await textOf(page.getByTestId('history-round'))).toEqual([
    expect.stringMatching(/^Round 1 · Samosa · [Aa][Rr][Jj][Uu][Nn] caught$/),
    expect.stringMatching(/^Round 2 · Pani puri · [Mm][Ee][Ee][Nn][Aa] escaped$/),
    expect.stringMatching(/^Round 3 · Kheer \/ Payasam · [Kk][Aa][Bb][Ii][Rr] escaped$/),
  ]);
}

test('Journey 2: Hard, Timer and Score: the impostor never starts, the timer runs out, the scoreboard and the winner line', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { mode: 'hard', talking: 'timer', score: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }, { wordId: PANI_PURI, impostor: 'Meena' }] } });
  const lines = await dealAll(page);
  expect(lines.Riya).toEqual(['Your secret', 'Samosa', 'Give one-word clues.', "Don't say it!", '']);
  expect(lines.Arjun!.slice(0, 4)).toEqual(['Your secret', "You're the impostor", 'Listen and blend in.', "Don't get caught!"]);
  expect((await page.getByTestId('starter-name').textContent())!.toLowerCase(), 'Hard: the impostor never starts').not.toBe('arjun');
  await mainButton(page).filter({ hasText: 'Clues done, start timer' }).click();
  await expect(page.getByTestId('timer-label')).toHaveText(exact('Talk it over', []));
  await expect(page.getByTestId('timer')).toHaveText('2:00');
  await page.clock.runFor(120_000);
  await expect(page.getByTestId('timer')).toHaveText('0:00');
  await expect(page.getByRole('heading', { name: "Time's up!" })).toBeVisible();
  await expect(quiet(page, '1 more minute')).toBeVisible();
  await mainButton(page).filter({ hasText: 'Get ready to point' }).click();
  await page.clock.runFor(6000);
  await reveal(page, 'Arjun', 1500);
  await expect(result(page, 'round-outcome')).toHaveText(exact('You caught the impostor!'));
  await expect(page.getByTestId('round-points')).toHaveText(exact('+1 each: Riya, Meena, Kabir'));
  await expect(page.getByTestId('evening-line')).toHaveCount(0);
  await expect(page.getByTestId('score-row')).toHaveCount(4);
  await mainButton(page).click();
  await dealAll(page);
  expect((await page.getByTestId('starter-name').textContent())!.toLowerCase(), 'Hard: the impostor never starts').not.toBe('meena');
  await mainButton(page).click();
  await page.clock.runFor(120_000);
  await mainButton(page).filter({ hasText: 'Get ready to point' }).click();
  await page.clock.runFor(6000);
  await reveal(page, 'Kabir', 1500);
  await expect(page.getByTestId('round-points')).toHaveText(exact('+2 Meena'));
  const rows = await page.getByTestId('score-row').evaluateAll((els) => els.map((e) => [e.getAttribute('data-name')!.toLowerCase(), Number(e.getAttribute('data-points'))]));
  expect(rows[0]).toEqual(['meena', 3]);
  await endEvening(page);
  await expect(page.getByTestId('summary-line')).toHaveText(exact('Meena wins the game with 3 points!'));
  await expect(page.getByTestId('scoreboard')).toBeVisible();
});

test('Journey 3: last-chance guess on: a right guess, its Undo, then a wrong guess; another round with a right guess', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { lastGuess: true, score: true, seeds: { deals: DEALS3 } });
  const lines = await dealAll(page);
  expect(lines.Arjun![3]).toBe('Listen, blend in, guess the word.');
  await toPicker(page);
  await reveal(page, 'Arjun', 1500);
  await expect(result(page, 'result-headline')).toHaveText(exact('✓ Caught!', []));
  await expect(result(page, 'guess-line')).toHaveText(exact('Last chance, Arjun! Guess the word out loud. Get it right and you win the round.'));
  await expectNoSecrets(page, secretTerms(SAMOSA, 'easy'), 'the guess step');
  await expect(menuButton(page)).toHaveCount(0);
  await mainButton(page).filter({ hasText: exact('Arjun guessed. Show the word') }).click();
  await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
  await quiet(page, 'Guessed right').click();
  await expect(result(page, 'round-outcome')).toHaveText(exact('Arjun wins the round!'));
  await expect(page.getByTestId('round-points')).toHaveText(exact('+1 Arjun'));
  await settle(page);
  await quiet(page, 'Undo').click();
  await expect(result(page, 'round-outcome')).toHaveCount(0);
  await expect(quiet(page, 'Guessed right')).toBeVisible();
  await quiet(page, 'Wrong guess').click();
  await expect(result(page, 'round-outcome')).toHaveText(exact('You caught the impostor!'));
  await expect(page.getByTestId('round-points')).toHaveText(exact('+1 each: Riya, Meena, Kabir'));
  expect((await moves(page)).filter((m: any) => m.type === 'verdict')).toEqual([{ type: 'verdict', right: false }]);
  await settle(page); // between-rounds buttons are guarded for 500 ms after the verdict (IMP-077)
  await mainButton(page).click();
  await dealAll(page);
  await toPicker(page);
  await reveal(page, 'Meena', 1500);
  await mainButton(page).filter({ hasText: exact('Meena guessed. Show the word') }).click();
  await quiet(page, 'Guessed right').click();
  await expect(result(page, 'round-outcome')).toHaveText(exact('Meena wins the round!'));
  await expect(quiet(page, 'Undo')).toBeVisible();
});

test('Journey 4: "Don\'t know this word?" (New word for everyone?) and "Deal again with a new word"', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Kabir', starter: 'Riya' }, { wordId: KHEER, impostor: 'Meena', starter: 'Riya' }] } });
  await turn(page, 'Riya');
  await turn(page, 'Arjun');
  await settle(page); await imButton(page, 'Meena').click();
  await hold(page, 600);
  await dontKnow(page).click();
  const d = page.getByRole('dialog', { name: /New word for everyone\?/ });
  await expect(d).toBeVisible();
  await d.getByRole('button', { name: 'New word', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No problem! New word coming.' })).toBeVisible();
  await expect(page.getByText(exact('Pass the phone back to Riya'))).toBeVisible();
  await expect(page.getByTestId('deal-progress')).toHaveCount(0);
  await settle(page); await imButton(page, 'Riya').click();
  expect((await hold(page, 600))[1]).toBe('Pani puri');
  await doneButton(page).click();
  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 2 of 4', []));
  await dealAll(page, P4.slice(1));
  await fromMenu(page, 'Deal again with a new word');
  const again = page.getByRole('dialog', { name: /^Deal again\?/ });
  await expect(again).toContainText("Deal again? This round won't count. For when someone said the word or saw a screen.");
  await again.getByRole('button', { name: 'Deal again', exact: true }).click();
  await expect(passName(page)).toHaveText(exact('Riya'));
  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  const third = await dealAll(page);
  expect(third.Riya![1]).toBe('Kheer / Payasam');
  expect((await moves(page)).filter((m: any) => ['startDeal', 'dontKnow', 'dealAgain'].includes(m.type)).map((m: any) => [m.type, m.wordId]))
    .toEqual([['startDeal', SAMOSA], ['dontKnow', PANI_PURI], ['dealAgain', KHEER]]);
});

/** Closes the app and opens it again (a reload), then opens the evening from Home if Home shows first. */
async function reopen(page: Page) {
  await page.reload();
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  const inGame = mainButton(page).or(summaryHeading(page)).or(page.getByTestId('countdown-heading'));
  await expect(row.or(inGame).first()).toBeVisible();
  if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
}

test('Journey 5: close and reopen at every step: deal, clues, talk, countdown, picker, result, summary', async ({ page }) => {
  test.setTimeout(150_000);
  await startEvening(page, { seeds: { deals: DEALS3 } });
  await turn(page, 'Riya');
  await reopen(page);
  await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
  await expect(passName(page)).toHaveText(exact('Arjun'));
  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 2 of 4', []));
  await dealAll(page, P4.slice(1));
  await reopen(page);
  await expectClues(page, 'Riya', 'Riya → Arjun → Meena → Kabir');
  await settle(page); // the clues screen's buttons are guarded for 500 ms after it shows (reopened too)
  await mainButton(page).click();
  await reopen(page);
  await expect(page.getByTestId('talk-heading')).toHaveText(exact('Talk it over', []));
  await mainButton(page).filter({ hasText: 'Vote now' }).click();
  await page.clock.runFor(2000);
  await reopen(page);
  await expect(page.getByTestId('countdown-heading')).toHaveText('Get ready to point…');
  await page.clock.runFor(6000);
  await expect(pickerHeading(page)).toBeVisible();
  await reopen(page);
  await page.clock.runFor(6000);
  await expect(pickerHeading(page)).toBeVisible();
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
  await reveal(page, 'Arjun', 1500);
  await reopen(page);
  await expect(result(page, 'build-up')).toHaveCount(0);
  await expectResult(page, { headline: '✓ Caught!', impostor: 'Arjun', wordId: SAMOSA, outcome: 'You caught the impostor!' });
  await endEvening(page);
  await reopen(page);
  await expect(summaryHeading(page)).toBeVisible();
  await expect(quiet(page, 'More ›')).toBeVisible();
  await expect(mainButton(page)).toHaveText(exact('Play again', []));
  await expect(page.getByTestId('summary-line')).toHaveText('Impostor caught 1 · escaped 0');
});

test('Journey 6: "How to play" on request and a practice round, then round 1; "How to play" from the menu mid-round', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { practice: true, seeds: { deals: DEALS3 } });
  await expect(page.getByTestId('practice-chip')).toHaveText(exact('Practice', []));
  expect((await moves(page))[0]).toEqual({ type: 'startDeal', practice: true, wordId: SAMOSA });
  await dealAll(page);
  await expect(page.getByTestId('practice-chip')).toBeVisible();
  await fromMenu(page, 'How to play');
  await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
  await expect(page.getByRole('heading', { name: 'Read this aloud' })).toBeVisible();
  await expect(page.locator('ol > li')).toHaveText([
    'Everyone sees the secret word except one impostor.', "Clockwise, say one word about it. Don't say the word!",
    'Talk, then on 3, 2, 1 everyone points.', 'Whoever gets the most fingers is revealed. Caught: you win. Wrong person: the impostor wins.',
  ]);
  await expect(page.getByRole('button', { name: 'Practice round first', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await settle(page); // v3.9: the setup screens' buttons are guarded for 500 ms whenever they show (P2)
  await toPicker(page);
  await reveal(page, 'Riya', 1500);
  await expect(result(page, 'round-outcome')).toHaveText(exact('Arjun escaped!'));
  await expect(page.getByTestId('evening-line')).toHaveCount(0);
  await expect(page.getByTestId('practice-chip')).toBeVisible();
  await mainButton(page).click();
  await expect(page.getByTestId('practice-chip')).toHaveCount(0);
  await dealAll(page);
  await toPicker(page);
  await reveal(page, 'Meena', 1500);
  await expect(page.getByTestId('evening-line')).toHaveText('This game: impostor caught 1 · escaped 0');
});

test('Journey 7: 12 players with long names, in landscape (812 × 375)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 812, height: 375 });
  const players = ['Alexandrapetrova', 'Bhagyashreemani', 'Chandrashekharan', 'Dhananjayapillai', 'Ekaterinavolkova', 'Fatimazahrakhan',
    'Gurpreetsandhuuu', 'Harikrishnanpill', 'Indumathiraghav', 'Jayalakshmiiyer', 'Kamaleshwarnath', 'Lakshminarayana'];
  await startEvening(page, { players, seeds: { deals: [{ wordId: SAMOSA, impostor: players[1]!, starter: players[0]! }] } });
  await dealAll(page, players);
  expect(await noPageScrollAt(page), 'clues: no page scrolling').toBe(true);
  await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
  await toPicker(page);
  expect(await noPageScrollAt(page), 'picker: no page scrolling').toBe(true);
  await expect(pickerHeading(page)).toBeInViewport({ ratio: 1 });
  await pickerName(page, players[11]!).scrollIntoViewIfNeeded();
  await pickerName(page, players[11]!).click();
  await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
  await mainButton(page).click();
  await page.clock.runFor(1500);
  await expect(result(page, 'round-outcome')).toHaveText(exact(`${players[1]} escaped!`, players));
  await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
});

test('Journey 8: 320 × 568 with Larger text and tap to show', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await startEvening(page, { storage: { 'pgn.pref.largerText': true, 'pgn.pref.impostor.tapToShow': true }, seeds: { deals: DEALS3 } });
  for (const p of P4) {
    await settle(page); await imButton(page, p).click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toBeHidden();
    await holdPad(page).click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to hide');
    await expect(page.getByTestId('private-word')).toHaveText(p === 'Arjun' ? "You're the impostor" : 'Samosa');
    await holdPad(page).click();
    await expect(page.getByTestId('private-word')).toHaveCount(0);
    await settle(page); // screen B's buttons are guarded for 500 ms (v3.8); a tap-mode turn can be that quick
    await doneButton(page).click();
  }
  await expect(page.getByTestId('clue-order')).toHaveText(exact('Riya → Arjun → Meena → Kabir'));
  expect(await noPageScrollAt(page)).toBe(true);
  await toPicker(page);
  expect(await noPageScrollAt(page)).toBe(true);
  await reveal(page, 'Arjun', 1500);
  await expect(result(page, 'round-outcome')).toHaveText(exact('You caught the impostor!'));
  await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
});

test('Journey 9: a late joiner and a leaver between rounds', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { score: true, seeds: { deals: [DEALS3[0]!, { wordId: PANI_PURI, impostor: 'Zoya', starter: 'Arjun' }] } });
  await dealAll(page);
  await toPicker(page);
  await reveal(page, 'Arjun', 1500);
  await fromMenu(page, 'Players');
  await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();
  await page.getByLabel('Player name', { exact: true }).fill('Zoya');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
  await expect(page.getByTestId('undo-toast')).toHaveText(/^\s*Kabir left · Points kept ·\s*Undo\s*$/);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  expect((await moves(page)).at(-1)).toEqual({ type: 'setPlayers', players: ['Riya', 'Arjun', 'Meena', 'Zoya'] });
  await mainButton(page).click();
  await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  await dealAll(page, ['Riya', 'Arjun', 'Meena', 'Zoya']);
  await toPicker(page);
  await expect(pickerName(page, 'Kabir')).toHaveCount(0);
  await reveal(page, 'Riya', 1500);
  await expect(page.getByTestId('round-points')).toHaveText(exact('+2 Zoya'));
  // Kabir left with 1 point: he stays on the scoreboard with it, greyed (IMP-044).
  const kabir = page.locator('[data-testid="score-row"][data-name="Kabir"]');
  await expect(kabir).toHaveAttribute('data-points', '1');
  expect(await kabir.evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(0.5);
});

test('Journey 10: "Oops, keep playing", Share, History, then "Play something else" into Tambola with tonight\'s names', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const w = window as any; w.__shared = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d: any) => { w.__shared.push(d.text); return Promise.resolve(); } });
  });
  await startEvening(page, { seeds: { deals: DEALS3 } });
  await dealAll(page);
  await toPicker(page);
  await reveal(page, 'Arjun', 1500);
  await endEvening(page);
  await summaryAction(page, 'Oops, keep playing');
  await expect(result(page, 'round-outcome')).toHaveText(exact('You caught the impostor!'));
  await endEvening(page);
  await summaryAction(page, 'Share');
  await expect.poll(() => page.evaluate(() => (window as any).__shared.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).__shared[0])).toBe(['Impostor game · 1 round', 'Impostor caught 1 · escaped 0', 'Words: Samosa'].join('\n'));
  await expect(summaryHeading(page)).toBeVisible();
  await quiet(page, 'Play something else').click();
  await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
  expect((await onlyEvening(page)).status).toBe('ended');
  await page.getByRole('button', { name: /^Tambola/ }).click();
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  for (const [i, n] of P4.entries()) await expect(page.getByLabel(`Name of player ${i + 1}`, { exact: true })).toHaveValue(n);
  await page.goto(HOME);
});

test('Journey 11: out of words in a category: "Allow repeats" deals again', async ({ page }) => {
  test.setTimeout(120_000);
  const shipped: { id: string; category: string; audience: string; nonveg: boolean; retired?: boolean }[] =
    JSON.parse(readFileSync(fileURLToPath(new URL('../../content/impostor/words.json', import.meta.url)), 'utf8'));
  const cat = 'Films, music and TV';
  const inCat = shipped.filter((w) => w.category === cat && !w.retired && w.audience === 'family' && !w.nonveg).map((w) => w.id);
  const [a, b] = inCat;
  const blocked = shipped.filter((w) => w.category === cat && w.id !== a && w.id !== b).map((w) => w.id);
  expect(COMMON_CATEGORIES).toContain(cat);
  await startEvening(page, { storage: { 'pgn.pref.impostor.blockedWords': blocked, 'pgn.pref.impostor.lastChoices': { mode: 'easy', talking: 'free', score: false, words: 'family', categories: [cat], nonveg: false, lastGuess: false } }, seeds: { deals: [{ impostor: 'Arjun', starter: 'Riya' }, { impostor: 'Meena', starter: 'Arjun' }, { impostor: 'Kabir', starter: 'Meena' }] } });
  for (let r = 0; r < 2; r++) {
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya', 1500);
    await mainButton(page).click();
  }
  await expect(page.getByRole('heading', { name: "You've played every word in these categories!" })).toBeVisible();
  await expect(page.getByText('Turn on more categories or + Grown-ups.', { exact: true })).toBeVisible();
  // v3.8 (IMP-052, IMP-077): main "Change categories" beside the outlined "End game"; "Allow repeats" is quiet above them.
  await expect(mainButton(page)).toHaveText(exact('Change categories', []));
  await settle(page);
  await quiet(page, 'Allow repeats').click();
  await expect(passName(page)).toHaveText(exact('Riya'));
  const third = await dealAll(page);
  expect([word(a!).word, word(b!).word]).toContain(third.Riya![1]);
  expect((await moves(page)).at(-P4.length - 1)).toMatchObject({ type: 'allowRepeats' });
  expect(WORDS.length).toBe(311);
});

test('Journey 12: screen-reader announcements through one full round', async ({ page }) => {
  test.setTimeout(120_000);
  await startEvening(page, { seeds: { deals: DEALS3 } });
  await page.evaluate(() => {
    const w = window as any; w.__ann = [];
    const seen = () => { const a = document.querySelector('[data-testid="announcer"]'); const t = (a?.textContent ?? '').trim(); if (t && t !== w.__ann.at(-1)) w.__ann.push(t); };
    new MutationObserver(seen).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await expect(page.getByTestId('announcer')).toHaveAttribute('aria-live', 'polite');
  await dealAll(page);
  await expect(page.getByTestId('announcer')).toHaveText(exact('Riya starts. Each say one word about your secret: Riya, Arjun, Meena, Kabir'));
  await mainButton(page).filter({ hasText: CLUES_DONE }).click();
  await freezeClock(page);
  await mainButton(page).filter({ hasText: 'Vote now' }).click();
  for (const n of ['3', '2', '1', 'Point!']) { await page.clock.runFor(1000); await expect(page.getByTestId('countdown-number')).toHaveText(n); }
  await page.clock.runFor(2000);
  await pickerName(page, 'Arjun').click();
  await mainButton(page).click();
  await page.clock.runFor(1500);
  await expect(result(page, 'round-outcome')).toBeVisible();
  await page.clock.runFor(500);
  const ann: string[] = await page.evaluate(() => (window as any).__ann);
  const fromCount = ann.slice(ann.indexOf('3'));
  expect(fromCount.slice(0, 5)).toEqual(['3', '2', '1', 'Point!', 'Arjun was…']);
  expect(fromCount.slice(5).join(' ')).toMatch(/^✓ Caught!.*[Aa][Rr][Jj][Uu][Nn] was the impostor.*The word was Samosa.*You caught the impostor!$/);
  for (const t of ann) for (const banned of ['Tonight:', 'Category:', 'Player 1 of 4', 'look away']) expect(t).not.toContain(banned);
});
