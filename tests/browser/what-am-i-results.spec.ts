// What Am I? game over and tonight on screen (specs/what-am-i/07-results.md WAI-060 to WAI-064), scenarios version 1.3:
// End the game (Version 1.1 item 27; Version 1.2 item 5), G1 (Version 1.1 items 34 to 37; Version 1.2 item 6), Play again,
// End for tonight, G2 (Version 1.1 item 36; Version 1.2 item 16). The rules behind them: tests/games/what-am-i/results.test.ts.
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import { hostAGame } from './helpers';
import {
  TZ, UPRIGHT, boardRows, button, dialog, fromMenu, heading, listChips, mainButton, menuItems, moves, onlyNight, pauseButton,
  playTurn, saveScore, startNight, tap, text, toast, toWord,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

const TWO = ['Riya', 'Arjun'];
async function endGameFromR1(page: Page) {
  await tap(page, button(page, 'End the game'));
  await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
/** Riya 1, Arjun 3 (30 s turns), ends on R1. */
async function oneRound(page: Page, seed: string) {
  await startNight(page, { seed, players: TWO, turnTime: 30, pack: 'Animals' });
  await playTurn(page, 'G'); await saveScore(page);
  await playTurn(page, 'GGG'); await saveScore(page);
  await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
}

test.describe('WAI-060: End the game', () => {
  test('from R1: "End the game?" with its body and buttons; ending opens G1 with the toast "Game ended · Undo"; Undo returns to R1', async ({ page }) => {
    await oneRound(page, 'end');
    await tap(page, button(page, 'End the game'));
    const d = dialog(page, 'End the game?');
    await expect(d.getByText("Shows this game's winner. You can play again with the same people.", { exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep playing');
    await tap(page, d.getByRole('button', { name: 'End the game', exact: true }));
    await expect(heading(page, 'Arjun wins with 3!')).toBeVisible();
    await expect(toast(page)).toContainText('Game ended');
    expect((await moves(page)).at(-1)).toEqual({ type: 'endGame' });
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    expect((await moves(page)).at(-1)).not.toEqual({ type: 'endGame' });
  });

  test('Version 1.2 item 5: opened mid-round, the body names who has not played: "Round 1 isn\'t done: Arjun hasn\'t played. Shows this game\'s winner."', async ({ page }) => {
    await startNight(page, { seed: 'end-mid', players: ['Riya', 'Arjun', 'Meena'], turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await fromMenu(page, 'End the game');
    await expect(dialog(page, 'End the game?').getByText("Round 1 isn't done: Arjun and Meena haven't played. Shows this game's winner.", { exact: true })).toBeVisible();
    await expect(dialog(page, 'End the game?').getByTestId('main-button')).toHaveText('Keep playing');
  });

  test('Version 1.2 item 5: more than 3 still to play: "Round 1 isn\'t done: 4 players haven\'t played. …"', async ({ page }) => {
    await startNight(page, { seed: 'end-mid-4', players: ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya'], turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await fromMenu(page, 'End the game');
    await expect(dialog(page, 'End the game?').getByText("Round 1 isn't done: 4 players haven't played. Shows this game's winner.", { exact: true })).toBeVisible();
  });

  test('Version 1.1 item 27: ending from T4 unsaved drops that turn; Undo returns to T4 unsaved, lists kept', async ({ page }) => {
    await startNight(page, { seed: 'end-t4', players: TWO, turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'GGGG');
    await fromMenu(page, 'End the game');
    await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
    await expect(heading(page, 'Riya wins with 1!')).toBeVisible();
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(heading(page, "Time's up! Arjun got 4")).toBeVisible();
    await expect(listChips(page, 'Got it')).toHaveCount(4);
  });
});

test.describe('WAI-061: Game over', () => {
  test('G1: h1, rows with turns played, "Best turn: Arjun, 3 words", "Tonight: Arjun 1 win", the buttons', async ({ page }) => {
    await oneRound(page, 'g1');
    await endGameFromR1(page);
    await expect(heading(page, 'Arjun wins with 3!')).toBeVisible();
    expect(await boardRows(page)).toEqual(['Arjun 3 (1 turn)', 'Riya 1 (1 turn)']);
    await expect(text(page, 'Best turn: Arjun, 3 words')).toBeVisible();
    await expect(text(page, 'Tonight: Arjun 1 win')).toBeVisible();
    for (const q of ['Change players or words', 'End for tonight', '← Home']) await expect(button(page, q)).toBeVisible();
    await expect(mainButton(page)).toHaveText('Play again');
  });

  test('a shared win: "Riya and Arjun share the win with 2!"; best turn ties go to the earliest: "Best turn: Riya, 2 words"', async ({ page }) => {
    await startNight(page, { seed: 'tie', players: TWO, turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    await endGameFromR1(page);
    await expect(heading(page, 'Riya and Arjun share the win with 2!')).toBeVisible();
    await expect(text(page, 'Best turn: Riya, 2 words')).toBeVisible();
    await expect(text(page, 'Tonight: Riya 1 win · Arjun 1 win')).toBeVisible();
  });

  test('three share: "Riya, Arjun and Meena share the win with 1!"; "Best turn: Riya, 1 word"', async ({ page }) => {
    await startNight(page, { seed: 'tie-3', players: ['Riya', 'Arjun', 'Meena'], turnTime: 30 });
    for (let i = 0; i < 3; i++) { await playTurn(page, 'G'); await saveScore(page); }
    await endGameFromR1(page);
    await expect(heading(page, 'Riya, Arjun and Meena share the win with 1!')).toBeVisible();
    await expect(text(page, 'Best turn: Riya, 1 word')).toBeVisible();
  });

  test('Version 1.1 item 35: every saved turn scored 0: "Nobody got a word this game!", no winner, the tally line left out', async ({ page }) => {
    await startNight(page, { seed: 'zero', players: TWO, turnTime: 30 });
    await playTurn(page, 'P'); await saveScore(page);
    await playTurn(page, 'P'); await saveScore(page);
    await endGameFromR1(page);
    await expect(heading(page, 'Nobody got a word this game!')).toBeVisible();
    await expect(page.getByText(/^Tonight:/)).toHaveCount(0);
    await expect(page.getByText(/^Best turn:/)).toHaveCount(0); // best 0: left out (product owner, 25 October, item 31)
  });

  test('no saved turn: "Game ended. No turns played."', async ({ page }) => {
    await startNight(page, { seed: 'none', players: TWO });
    await fromMenu(page, 'End the game');
    await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
    await expect(heading(page, 'Game ended. No turns played.')).toBeVisible();
  });

  test('Version 1.2 item 6: "Moved after time\'s up: 1 word · Turns ended early: 1"; each part only when not 0; the line left out when both are 0', async ({ page }) => {
    await startNight(page, { seed: 'record', players: TWO, turnTime: 30 });
    await playTurn(page, 'GG');
    await listChips(page, 'Got it').first().click();
    await saveScore(page);
    await toWord(page);
    await page.clock.runFor(1000);
    await pauseButton(page).click();
    await tap(page, page.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: "End Arjun's turn now", exact: true }));
    await tap(page, dialog(page, "End Arjun's turn now?").getByRole('button', { name: "End Arjun's turn now", exact: true }));
    await saveScore(page);
    await endGameFromR1(page);
    await expect(text(page, "Moved after time's up: 1 word · Turns ended early: 1")).toBeVisible();
  });

  test('none moved, none ended early: no record line', async ({ page }) => {
    await oneRound(page, 'record-0');
    await endGameFromR1(page);
    await expect(page.getByText(/^Moved after time's up|^Turns ended early/)).toHaveCount(0);
  });
});

test.describe('WAI-062: Play again', () => {
  test('"Play again" records start (game 2) with the same players and choices and opens T1 for the first player, scores 0', async ({ page }) => {
    await oneRound(page, 'again');
    await endGameFromR1(page);
    await tap(page, mainButton(page));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await expect(text(page, 'Round 1 · player 1 of 2')).toBeVisible();
    const starts = (await moves(page)).filter((m) => m.type === 'start');
    expect(starts).toHaveLength(2);
    expect(starts[1]).toEqual(starts[0]);
    await fromMenu(page, 'Scores');
    expect(await boardRows(page)).toEqual(['Riya 0 (0 turns)', 'Arjun 0 (0 turns)']);
  });

  test('"Change players or words" → Who\'s playing? → Words and time → "Start with these words" (no Read this aloud) → T1', async ({ page }) => {
    await oneRound(page, 'again-change');
    await endGameFromR1(page);
    await tap(page, button(page, 'Change players or words'));
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await tap(page, mainButton(page));
    await expect(heading(page, 'Words and time')).toBeVisible();
    await expect(mainButton(page)).toHaveText('Start with these words');
    await tap(page, mainButton(page));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await expect(heading(page, 'Read this aloud')).toHaveCount(0);
  });
});

test.describe('WAI-063 / WAI-064: End for tonight and the summary', () => {
  test('G1 "End for tonight" → its dialog → G2: h1, players · games · words got, wins, best guesser, the buttons; the record ends with endEvening', async ({ page }) => {
    await oneRound(page, 'g2');
    await endGameFromR1(page);
    await tap(page, button(page, 'End for tonight'));
    const d = dialog(page, 'End for tonight?');
    await expect(d.getByText("Shows tonight's summary. Every score is kept in History.", { exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep playing');
    await tap(page, d.getByRole('button', { name: 'End for tonight', exact: true }));
    await expect(heading(page, "Tonight's What Am I?")).toBeVisible();
    await expect(text(page, '2 players · 1 game · 4 words got')).toBeVisible();
    await expect(text(page, 'Wins: Arjun 1')).toBeVisible();
    await expect(text(page, 'Best guesser tonight: Arjun (3 words)')).toBeVisible();
    for (const q of ['Oops, keep playing', '← Home']) await expect(button(page, q)).toBeVisible();
    await expect(mainButton(page)).toHaveText('Play something else');
    expect((await onlyNight(page)).records.at(-1).move).toEqual({ type: 'endEvening' });
  });

  test('from the menu mid-game: endGame then endEvening; "Oops, keep playing" removes both and returns where the host was', async ({ page }) => {
    await startNight(page, { seed: 'g2-mid', players: TWO, turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await fromMenu(page, 'End for tonight');
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
    await expect(heading(page, "Tonight's What Am I?")).toBeVisible();
    expect((await moves(page)).slice(-2)).toEqual([{ type: 'endGame' }, { type: 'endEvening' }]);
    await tap(page, button(page, 'Oops, keep playing'));
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
    expect((await moves(page)).map((m) => m.type)).not.toContain('endEvening');
    expect((await moves(page)).map((m) => m.type)).not.toContain('endGame');
  });

  test('no won game: "No wins yet"; ties for best guesser: "Riya and Arjun (2 words)"', async ({ page }) => {
    await startNight(page, { seed: 'g2-tie', players: TWO, turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    await endGameFromR1(page);
    await tap(page, button(page, 'End for tonight'));
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
    await expect(text(page, 'Wins: Riya 1 · Arjun 1')).toBeVisible();
    await expect(text(page, 'Best guesser tonight: Riya and Arjun (2 words)')).toBeVisible();
  });

  test('a night whose only game scored 0: "No wins yet"', async ({ page }) => {
    await startNight(page, { seed: 'g2-none', players: TWO, turnTime: 30 });
    await playTurn(page, 'P'); await saveScore(page);
    await playTurn(page, 'P'); await saveScore(page);
    await endGameFromR1(page);
    await tap(page, button(page, 'End for tonight'));
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
    await expect(text(page, 'No wins yet')).toBeVisible();
  });

  test('G2: "← Home" goes Home, "Play something else" to the picker; the menu has only "Delete tonight\'s games" (Version 1.2 item 16)', async ({ page }) => {
    await oneRound(page, 'g2-nav');
    await endGameFromR1(page);
    await tap(page, button(page, 'End for tonight'));
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
    const items = await menuItems(page);
    expect(items.map((i) => i.name)).toEqual(["Delete tonight's games"]);
    await page.keyboard.press('Escape');
    await tap(page, mainButton(page));
    await expect(heading(page, 'What shall we play?')).toBeVisible();
    await tap(page, button(page, '← Home'));
    await expect(hostAGame(page)).toBeVisible();
  });
});
