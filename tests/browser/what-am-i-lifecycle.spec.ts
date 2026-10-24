// What Am I? lifecycle (specs/what-am-i/10-lifecycle.md WAI-090 to WAI-092), scenarios version 1.3: the where-line and
// Home row (Version 1.1 item 40; Version 1.2 item 15), resume and ending by itself (Version 1.1 item 44), History and the
// menu (Version 1.1 item 39; Version 1.2 item 16).
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import { fromHome, hostAGame } from './helpers';
import {
  TZ, UPRIGHT, button, chipNames, dialog, fromMenu, guards, heading, listChips, mainButton, menuItems, moves, onlyNight,
  pauseButton, playTurn, radio, saveScore, startNight, switchNamed, tap, text, theWord, timeLeft, toWord, whereLine,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

const TWO = ['Riya', 'Arjun'];
async function reload(page: Page) { await page.reload(); await guards(page); }
async function endGame(page: Page) {
  await tap(page, button(page, 'End the game'));
  await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
}

test.describe('WAI-090 / WAI-091: where-line, Home row and resume', () => {
  test('reload on T1: "Welcome back." and the where-line "Round 1 · Riya\'s turn next"; still T1', async ({ page }) => {
    await startNight(page, { seed: 'reload-t1', players: TWO });
    await reload(page);
    await expect(text(page, 'Welcome back.')).toBeVisible();
    await expect(whereLine(page)).toHaveText("Round 1 · Riya's turn next");
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
  });

  test('Version 1.1 item 40: reload on T4 unsaved: "Round 1 · Riya\'s turn, not saved yet"; T4 with its lists and ↺ kept', async ({ page }) => {
    await startNight(page, { seed: 'reload-t4', players: TWO, turnTime: 30 });
    await playTurn(page, 'GG');
    const first = (await chipNames(page, 'Got it'))[0]!;
    await listChips(page, 'Got it').first().click();
    const got = await chipNames(page, 'Got it'), passed = await chipNames(page, 'Passed');
    await reload(page);
    await expect(whereLine(page)).toHaveText("Round 1 · Riya's turn, not saved yet");
    expect(await chipNames(page, 'Got it')).toEqual(got);
    expect(await chipNames(page, 'Passed')).toEqual(passed);
    expect(passed.at(-1)).toBe(`${first} ↺`);
  });

  test('a turn in T3 reopens on the Paused cover with its time left; Carry on counts 3, 2, 1 and shows a new word', async ({ page }) => {
    await startNight(page, { seed: 'reload-t3', players: TWO, turnTime: 60, pack: 'Food' });
    await toWord(page);
    await page.clock.runFor(26000);
    const w = (await theWord(page).textContent())!.trim();
    await reload(page);
    const cover = dialog(page, 'Paused');
    await expect(cover).toBeVisible();
    await expect(cover.getByTestId('where-line')).toHaveText('Round 1 · Riya guessing, 34 s left');
    await tap(page, cover.getByTestId('main-button'));
    await expect(page.getByTestId('countdown')).toHaveText('3');
    await page.clock.runFor(3000);
    await expect(theWord(page)).not.toHaveText(w);
    await expect(timeLeft(page)).toHaveText('0:34');
  });

  test('Home\'s row: "What Am I? · Round 1 · Arjun\'s turn" / "Riya, Arjun · 8:05 pm · Tap to resume"; six players: "Riya, Arjun +4"', async ({ page }) => {
    await startNight(page, { seed: 'home-row', turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await tap(page, button(page, '← Home (game saved)'));
    const row = page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' });
    await expect(row).toContainText("What Am I? · Round 1 · Arjun's turn");
    await expect(row).toContainText('Riya, Arjun +4 · 8:05 pm · Tap to resume');
    await tap(page, row.getByRole('button').first());
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
  });

  test('Version 1.1 item 40: leavers are not counted in "+n"; the time is tonight\'s first start', async ({ page }) => {
    await startNight(page, { seed: 'home-row-2', players: ['Riya', 'Arjun', 'Meena', 'Kabir'] });
    await page.clock.runFor(3 * 60_000);
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    await tap(page, dialog(page, 'Kabir has to leave?').getByRole('button', { name: 'Kabir leaves', exact: true }));
    await tap(page, dialog(page, 'Players').getByRole('button', { name: 'Done', exact: true }));
    await tap(page, button(page, '← Home (game saved)'));
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' })).toContainText('Riya, Arjun +1 · 8:05 pm · Tap to resume');
  });

  test('Version 1.2 item 15: a paused turn\'s row reads "What Am I? · Round 1 · Riya guessing, 34 s left" and opens the Paused cover', async ({ page }) => {
    await startNight(page, { seed: 'home-paused', players: TWO, turnTime: 60 });
    await toWord(page);
    await page.clock.runFor(26000);
    await pauseButton(page).click();
    await tap(page, dialog(page, 'Paused').getByRole('button', { name: '← Home (game saved)', exact: true }));
    const row = page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' });
    await expect(row).toContainText('What Am I? · Round 1 · Riya guessing, 34 s left');
    await tap(page, row.getByRole('button').first());
    await expect(dialog(page, 'Paused')).toBeVisible();
  });

  test('after G1: Home\'s line 1 "What Am I? · Game over, game 1"; reload on G1 shows G1 with "Game over, game 1"', async ({ page }) => {
    await startNight(page, { seed: 'home-g1', players: TWO, turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    await endGame(page);
    await reload(page);
    await expect(heading(page, 'Arjun wins with 2!')).toBeVisible();
    await expect(whereLine(page)).toHaveText('Game over, game 1');
    await tap(page, button(page, '← Home'));
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' })).toContainText('What Am I? · Game over, game 1');
  });

  test('Version 1.1 item 44: a night left 12 hours after its last move ends by itself when the app opens (unsaved turn dropped); it shows in History, not on Home', async ({ page }) => {
    await startNight(page, { seed: 'twelve', players: TWO, turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'GGG'); // Arjun's T4, not saved
    const last = (await onlyNight(page)).records.at(-1).at as number;
    await page.clock.setSystemTime(last + 12 * 3_600_000 + 1000);
    await page.reload();
    await guards(page);
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' })).toHaveCount(0);
    const night = await onlyNight(page);
    // endGame (the open game, unsaved turn dropped) then endEvening, both at the opening time (product owner, 25 October, item 33)
    expect(night.records.slice(-2).map((r: any) => [r.move, r.at])).toEqual([
      [{ type: 'endGame' }, last + 12 * 3_600_000 + 1000], [{ type: 'endEvening' }, last + 12 * 3_600_000 + 1000],
    ]);
    await expect(hostAGame(page)).toBeVisible();
  });

  test('11 hours 59 minutes later the night is still on Home', async ({ page }) => {
    await startNight(page, { seed: 'not-twelve', players: TWO });
    const last = (await onlyNight(page)).records.at(-1).at as number;
    await page.clock.setSystemTime(last + 12 * 3_600_000 - 60_000);
    // Open the app's own address (Home), not the game's: a reload of the game's address reopens the game (WAI-091).
    await page.goto(page.url().split('#')[0]!);
    await guards(page);
    await expect(hostAGame(page)).toBeVisible();
    await expect(page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' })).toHaveCount(1);
  });
});

test.describe('WAI-092: History, the menu, Settings', () => {
  test('History lists "What Am I? · 2 games" with its players; its "Play again" opens S1 with them and S2 with the last choices', async ({ page }) => {
    test.setTimeout(90_000); // two whole games (four turns) and History: about 35 s on a low-priority Mac
    await startNight(page, { seed: 'history', players: TWO, turnTime: 30, pack: 'Jobs' });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'G'); await saveScore(page);
    await endGame(page);
    await tap(page, mainButton(page)); // Play again
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'G'); await saveScore(page);
    await endGame(page);
    await tap(page, button(page, 'End for tonight'));
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
    await tap(page, button(page, '← Home'));
    await guards(page);
    await fromHome(page, 'History'); // History is on Home or in its menu (PLT-300)
    const entry = page.getByText('What Am I? · 2 games', { exact: true });
    await expect(entry).toBeVisible();
    await tap(page, entry);
    await expect(page.getByText(/Riya/).first()).toBeVisible();
    await tap(page, button(page, 'Play again'));
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await expect(button(page, 'Move Riya')).toBeVisible();
    await expect(button(page, 'Move Arjun')).toBeVisible();
    await tap(page, mainButton(page));
    await expect(radio(page, /^Jobs · 94 words/)).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, '30 s')).toHaveAttribute('aria-checked', 'true');
  });

  test('Version 1.1 item 39: the menu on T4 and on G1; no menu on T2 and T3', async ({ page }) => {
    await startNight(page, { seed: 'menus', players: TWO, turnTime: 30 });
    await tap(page, mainButton(page));
    await expect(button(page, 'Menu')).toHaveCount(0); // T2
    await page.clock.runFor(3000);
    await expect(button(page, 'Menu')).toHaveCount(0); // T3
    await page.clock.runFor(30000);
    const t4 = await menuItems(page);
    expect(t4.map((i) => i.name)).toEqual([
      'How to play', 'Players', 'Scores', 'Words and time', 'Pause', 'Home (game saved)', 'End the game', 'End for tonight', 'Settings',
    ]);
    expect(t4.filter((i) => i.disabled).map((i) => i.name)).toEqual(['Players']);
    await page.keyboard.press('Escape');
    await saveScore(page);
    await playTurn(page, 'G'); await saveScore(page);
    await endGame(page);
    const g1 = await menuItems(page);
    expect(g1.map((i) => i.name)).toEqual(['How to play', 'End for tonight', 'Settings', 'History']);
  });

  test('Version 1.2 item 16: menu Settings opens the app\'s Settings; "Done" returns to the same screen; menu History → "← Back" returns too', async ({ page }) => {
    await startNight(page, { seed: 'settings', players: TWO });
    await fromMenu(page, 'Settings');
    await expect(switchNamed(page, 'Answer by moving the phone')).toBeVisible();
    await tap(page, button(page, 'Done'));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await fromMenu(page, 'History');
    await tap(page, button(page, '← Back'));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    expect((await moves(page)).map((m) => m.type)).toEqual(['start']);
  });
});
