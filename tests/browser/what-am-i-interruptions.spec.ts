// What Am I? interruptions and people (specs/what-am-i/06-interruptions.md WAI-040 to WAI-044), scenarios version 1.3:
// Pause (Version 1.1 item 46; Version 1.2 items 2, 12, 17; Version 1.3 item 8), Players (Version 1.1 items 30, 32;
// Version 1.3 item 6), leaving (Version 1.1 item 29; Version 1.2 item 7), End Riya's turn now (Version 1.2 item 2),
// Words and time mid-game.
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import { hostAGame } from './helpers';
import {
  SIDEWAYS, TZ, UPRIGHT, box, button, dialog, firstWords, fromMenu, heading, mainButton, marks, menuItems, moves, now, pauseButton,
  playTurn, radio, saveScore, setHidden, shownWord, startNight, tap, text, theWord, timeLeft, toWord, toast,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: SIDEWAYS });

const TWO = ['Riya', 'Arjun'];
const cover = (page: Page) => dialog(page, 'Paused');

test.describe('WAI-040: Pause', () => {
  test('the Pause button on T3 opens the cover and records pause; the word leaves the DOM; the clock stops (Version 1.3 item 8 body)', async ({ page }) => {
    await startNight(page, { seed: 'pause', pack: 'Food', players: TWO, turnTime: 60 });
    await toWord(page);
    await page.clock.runFor(26000);
    const w = await shownWord(page);
    await pauseButton(page).click();
    await expect(cover(page)).toBeVisible();
    await expect(cover(page).getByTestId('where-line')).toHaveText('Round 1 · Riya guessing, 34 s left');
    await expect(cover(page).getByText("The clock is stopped and the word is hidden. Tap Carry on playing when you're ready.", { exact: true })).toBeVisible();
    for (const q of ["End Riya's turn now", '← Home (game saved)']) await expect(cover(page).getByRole('button', { name: q, exact: true })).toBeVisible();
    await expect(cover(page).getByTestId('main-button')).toHaveText('Carry on playing');
    await expect(theWord(page)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(w);
    expect((await moves(page)).at(-1)).toMatchObject({ type: 'pause', turn: true });
    await page.clock.runFor(60000);
    await expect(cover(page)).toBeVisible(); // no time up while paused
  });

  test('"Carry on playing" from T3: resume, the countdown again, then the next word with the time left kept; the hidden word is not shown', async ({ page }) => {
    await startNight(page, { seed: 'resume', pack: 'Food', players: TWO, turnTime: 60 });
    const want = firstWords('resume', 'Food');
    await toWord(page);
    await page.clock.runFor(26000);
    await pauseButton(page).click();
    await tap(page, cover(page).getByTestId('main-button'));
    await expect(page.getByTestId('countdown')).toHaveText('3');
    await page.clock.runFor(3000);
    await expect(theWord(page)).toHaveText(want[1]!);
    await expect(timeLeft(page)).toHaveText('0:34');
    expect((await moves(page)).slice(-2).map((m) => m.type)).toEqual(['pause', 'resume']);
  });

  test('the phone\'s Back gesture and the app being hidden pause the turn; a notification over the page (window blur) does not (Version 1.2 item 12)', async ({ page }) => {
    await startNight(page, { seed: 'back', pack: 'Food', players: TWO });
    await toWord(page);
    await page.clock.runFor(1000);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.clock.runFor(200);
    await expect(cover(page)).toHaveCount(0);
    await page.evaluate(() => history.back());
    await expect(cover(page)).toBeVisible();
    await tap(page, cover(page).getByTestId('main-button'));
    await page.clock.runFor(3000);
    await expect(theWord(page)).toBeVisible();
    await setHidden(page, true);
    await page.clock.runFor(100);
    await setHidden(page, false);
    await expect(cover(page)).toBeVisible();
    expect((await moves(page)).filter((m) => m.type === 'pause')).toHaveLength(2);
  });

  test('Version 1.1 item 46: Pause on T1 (button or menu) and on T4: the cover without "End Riya\'s turn now"; Carry on returns to that screen', async ({ page }) => {
    await startNight(page, { seed: 'pause-t1', players: TWO, turnTime: 30, viewport: UPRIGHT });
    await fromMenu(page, 'Pause');
    await expect(cover(page)).toBeVisible();
    await expect(cover(page).getByRole('button', { name: "End Riya's turn now" })).toHaveCount(0);
    // on T1 and T4 the body is only "Tap Carry on playing when you're ready." (product owner, 25 October, item 16)
    await expect(cover(page).getByText("Tap Carry on playing when you're ready.", { exact: true })).toBeVisible();
    await expect(cover(page).getByText(/clock is stopped/)).toHaveCount(0);
    await tap(page, cover(page).getByTestId('main-button'));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await playTurn(page, 'G');
    await tap(page, pauseButton(page));
    await expect(cover(page).getByRole('button', { name: "End Riya's turn now" })).toHaveCount(0);
    await tap(page, cover(page).getByTestId('main-button'));
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    expect((await moves(page)).filter((m) => m.type === 'pause').every((m) => m.turn === false)).toBe(true);
  });

  test('"← Home (game saved)" on the cover goes Home; the game stays unfinished', async ({ page }) => {
    await startNight(page, { seed: 'pause-home', players: TWO });
    await toWord(page);
    await pauseButton(page).click();
    await tap(page, cover(page).getByRole('button', { name: '← Home (game saved)', exact: true }));
    await expect(hostAGame(page)).toBeVisible();
    await expect(page.getByTestId('unfinished-games')).toContainText('What Am I?');
  });

  test('Version 1.2 item 17: phone Back on Words and time = its "← Back"; on a dialog it closes the dialog', async ({ page }) => {
    await startNight(page, { seed: 'back-s2', players: TWO, stopAt: 'S2', viewport: UPRIGHT });
    await page.evaluate(() => history.back());
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await tap(page, mainButton(page));
    await tap(page, mainButton(page));
    await tap(page, mainButton(page)); // First turn
    await fromMenu(page, 'End the game');
    await expect(dialog(page, 'End the game?')).toBeVisible();
    await page.evaluate(() => history.back());
    await expect(dialog(page, 'End the game?')).toHaveCount(0);
    await expect(cover(page)).toHaveCount(0); // Back closed the dialog only
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
  });
});

test.describe('WAI-043: End Riya\'s turn now', () => {
  test('from the cover: "End Riya\'s turn now?" with its body; "Carry on playing" goes back to the cover; confirming records skip and opens "Turn ended early. Riya got 2"', async ({ page }) => {
    await startNight(page, { seed: 'skip', pack: 'Food', players: TWO });
    await toWord(page);
    const [a, b] = await marks(page, 'GG');
    const hidden = await shownWord(page);
    await pauseButton(page).click();
    await tap(page, cover(page).getByRole('button', { name: "End Riya's turn now", exact: true }));
    const d = dialog(page, "End Riya's turn now?");
    await expect(d.getByText("Riya's turn ends now. Words marked so far still count.", { exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Carry on playing');
    await tap(page, d.getByTestId('main-button'));
    await expect(cover(page)).toBeVisible();
    await tap(page, cover(page).getByRole('button', { name: "End Riya's turn now", exact: true }));
    await tap(page, dialog(page, "End Riya's turn now?").getByRole('button', { name: "End Riya's turn now", exact: true }));
    await expect(heading(page, 'Turn ended early. Riya got 2')).toBeVisible();
    expect((await moves(page)).slice(-2)).toEqual([{ type: 'pause', turn: true, word: expect.any(String) }, { type: 'skip' }]);
    expect(await page.locator('body').innerText()).not.toContain(hidden);
    expect([a, b]).toHaveLength(2);
  });
});

test.describe('WAI-041 / WAI-042: Players and leaving', () => {
  test.use({ viewport: UPRIGHT });

  test('Players: the top line, ✕ and handles in turn order, an add row; adding Om records addPlayer and puts him last', async ({ page }) => {
    await startNight(page, { seed: 'players' });
    await fromMenu(page, 'Players');
    const d = dialog(page, 'Players');
    await expect(d.getByText('Add a name to join. New players go after the last player in this round.', { exact: true })).toBeVisible();
    const handles = await d.getByRole('button', { name: /^Move / }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent));
    expect(handles).toEqual(['Move Riya', 'Move Arjun', 'Move Meena', 'Move Kabir', 'Move Zoya', 'Move Dev']);
    await d.getByLabel('Player name', { exact: true }).fill('Om');
    await d.getByRole('button', { name: 'Add', exact: true }).click();
    expect((await moves(page)).at(-1)).toEqual({ type: 'addPlayer', name: 'Om' });
    await expect(d.getByRole('button', { name: 'Move Om' })).toBeVisible();
  });

  test('Version 1.3 item 6: at 320 px the add row\'s "Add" keeps at least 72 × 48 px', async ({ page }) => {
    await startNight(page, { seed: 'add-320', viewport: { width: 320, height: 568 } });
    await fromMenu(page, 'Players');
    const add = await box(dialog(page, 'Players').getByRole('button', { name: 'Add', exact: true }));
    expect(add.width).toBeGreaterThanOrEqual(72);
    expect(add.height).toBeGreaterThanOrEqual(48);
    expect(add.x + add.width).toBeLessThanOrEqual(320);
  });

  test('✕ opens "Kabir has to leave?"; "Kabir leaves" records leave with the toast "Kabir left · Undo"; "Don\'t remove Kabir" is the main button', async ({ page }) => {
    await startNight(page, { seed: 'leave' });
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, 'Kabir has to leave?');
    await expect(d.getByText("Kabir's points stay on tonight's scoreboard.", { exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText("Don't remove Kabir");
    await tap(page, d.getByRole('button', { name: 'Kabir leaves', exact: true }));
    expect((await moves(page)).at(-1)).toEqual({ type: 'leave', player: 'Kabir' });
    await expect(toast(page)).toContainText('Kabir left');
  });

  test('leaving on one\'s own T1 hands T1 to the next player', async ({ page }) => {
    await startNight(page, { seed: 'leave-t1', players: ['Riya', 'Arjun', 'Meena'] });
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Riya', exact: true }).click();
    await tap(page, dialog(page, 'Riya has to leave?').getByRole('button', { name: 'Riya leaves', exact: true }));
    await tap(page, dialog(page, 'Players').getByRole('button', { name: 'Done', exact: true }));
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
  });

  test('Version 1.1 item 29 / Version 1.2 item 7: with 2 players ✕ opens "2 players needed." with "End the game", quiet "Don\'t remove Kabir" and main "Add a player" (focuses the add row)', async ({ page }) => {
    await startNight(page, { seed: 'two-left', players: ['Riya', 'Kabir'] });
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, '2 players needed.');
    await expect(d.getByText('Add someone, or end the game.', { exact: true })).toBeVisible();
    await expect(d.getByRole('button', { name: 'End the game', exact: true })).toBeVisible();
    await expect(d.getByRole('button', { name: "Don't remove Kabir", exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Add a player');
    await tap(page, d.getByTestId('main-button'));
    await expect(page.getByLabel('Player name', { exact: true })).toBeFocused();
    expect((await moves(page)).some((m) => m.type === 'leave')).toBe(false);
  });

  test('Version 1.1 item 32: a leaver\'s exact name is accepted again (no duplicate message) and rejoins last with their points', async ({ page }) => {
    await startNight(page, { seed: 'rejoin', players: ['Riya', 'Arjun', 'Kabir'], turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Riya', exact: true }).click();
    await tap(page, dialog(page, 'Riya has to leave?').getByRole('button', { name: 'Riya leaves', exact: true }));
    await dialog(page, 'Players').getByLabel('Player name', { exact: true }).fill('Riya');
    await dialog(page, 'Players').getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(/is already playing/)).toHaveCount(0);
    const handles = await dialog(page, 'Players').getByRole('button', { name: /^Move / }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent));
    expect(handles).toEqual(['Move Arjun', 'Move Kabir', 'Move Riya']);
    await tap(page, dialog(page, 'Players').getByRole('button', { name: 'Done', exact: true }));
    await fromMenu(page, 'Scores');
    await expect(page.getByTestId('scoreboard')).toContainText('Riya 2 (1 turn)');
  });

  test('Version 1.1 items 30, 39: on T4 the menu\'s Players is greyed with "After this turn"', async ({ page }) => {
    await startNight(page, { seed: 'greyed', players: TWO, turnTime: 30 });
    await playTurn(page, 'G');
    const items = await menuItems(page);
    expect(items.find((i) => i.name === 'Players')).toEqual({ name: 'Players', disabled: true });
    await expect(page.getByRole('menuitem', { name: /Players/ })).toContainText('After this turn');
  });
});

test.describe('WAI-044: Words and time mid-game', () => {
  test.use({ viewport: UPRIGHT });

  test('from the menu on T1: S2\'s choices in a sheet with "Done"; a change records setChoices and applies from the next turn', async ({ page }) => {
    await startNight(page, { seed: 'mid-words', players: TWO, pack: 'mix', turnTime: 30 });
    await fromMenu(page, 'Words and time');
    await radio(page, /^Animals · 92 words/).click();
    await radio(page, '90 s').click();
    await tap(page, button(page, 'Done'));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    expect((await moves(page)).at(-1)).toEqual({ type: 'setChoices', choices: { pack: 'Animals', time: 90, hold: 'hand', nonveg: false, sounds: true } });
    await toWord(page);
    await expect(timeLeft(page)).toHaveText('1:30');
    await expect(theWord(page)).toHaveText(firstWords('mid-words', 'Animals')[0]!);
    expect(await now(page)).toBeGreaterThan(0);
  });

  test('on T1 and R1 the menu shows all ten items in order (Version 1.1 item 39, Version 1.3 item 3)', async ({ page }) => {
    await startNight(page, { seed: 'menu', players: TWO });
    const items = await menuItems(page);
    expect(items.map((i) => i.name)).toEqual([
      'How to play', 'Players', 'Scores', 'Words and time', 'Pause', 'Home (game saved)', 'End the game', 'End for tonight', 'Settings', 'History',
    ]);
    expect(items.every((i) => !i.disabled)).toBe(true);
  });
});

