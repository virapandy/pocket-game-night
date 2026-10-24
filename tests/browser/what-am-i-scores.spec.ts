// What Am I? end of a turn and scores on screen (specs/what-am-i/04-scores.md WAI-030 to WAI-033), scenarios version 1.3:
// T4 (Version 1.1 items 24, 46; Version 1.3 item 3), the Undo toast (Version 1.1 item 26), scoreboards (Version 1.1 item 30),
// Round over (Version 1.1 items 33, 34; Version 1.3 item 2). The rules behind them are in tests/games/what-am-i/scores.test.ts.
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import {
  TZ, UPRIGHT, WORDS, boardRows, box, button, chipNames, dialog, firstWords, fromMenu, guards, heading, listChips, mainButton,
  marks, moves, pauseButton, playTurn, runToTimeUp, saveScore, startNight, tap, text, toast, toWord, type WaiWord,
} from './what-am-i';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

const THREE = ['Riya', 'Arjun', 'Meena'];

test.describe('WAI-030: Time\'s up', () => {
  test('h1 with the count; "Got it" and "Passed" lists in the order shown (time-up word last); the lines, quiet Home, Pause, Menu, main "Save score"', async ({ page }) => {
    await startNight(page, { seed: 't4', pack: 'Animals', players: THREE, turnTime: 30 });
    const t3 = await toWord(page);
    const w = await marks(page, 'GPG');
    const want = firstWords('t4', 'Animals');
    await runToTimeUp(page, t3, 30);
    await expect(heading(page, "Time's up! Riya got 2")).toBeVisible();
    await expect(heading(page, 'Got it')).toBeVisible();
    await expect(heading(page, 'Passed')).toBeVisible();
    expect(await chipNames(page, 'Got it')).toEqual([w[0], w[2]]);
    expect(await chipNames(page, 'Passed')).toEqual([w[1], want[3]]);
    await expect(text(page, 'Marked wrong? Tap a word to move it.')).toBeVisible();
    await expect(text(page, 'Next: Arjun')).toBeVisible();
    await expect(button(page, '← Home (game saved)')).toBeVisible();
    await expect(pauseButton(page)).toBeVisible();
    await expect(button(page, 'Menu')).toBeVisible();
    await expect(mainButton(page)).toHaveText('Save score');
  });

  test('an empty list reads "None"; the last player of the round sees "Next: round over"', async ({ page }) => {
    await startNight(page, { seed: 't4-none', players: ['Riya', 'Arjun'], turnTime: 30 });
    await playTurn(page, 'G');
    await saveScore(page);
    const t3 = await toWord(page);
    await page.clock.runFor(30000 - 300);
    await page.mouse.click(195, 700); // a Got it 29 700 ms after the word: time is up during its flash
    await runToTimeUp(page, t3, 30);
    await expect(heading(page, "Time's up! Arjun got 1")).toBeVisible();
    await expect(page.getByRole('region', { name: 'Passed', exact: true }).getByText('None', { exact: true })).toBeVisible();
    await expect(text(page, 'Next: round over')).toBeVisible();
  });

  test('tapping a word moves it with ↺ and updates the count; moving it back removes ↺; each tap counts (no guard on chips)', async ({ page }) => {
    await startNight(page, { seed: 't4-fix', players: THREE, turnTime: 30 });
    const t3 = await toWord(page);
    const [a, b] = await marks(page, 'GG');
    await runToTimeUp(page, t3, 30);
    await listChips(page, 'Got it').filter({ hasText: a! }).click();
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    await listChips(page, 'Passed').filter({ hasText: a! }).click();
    await expect(heading(page, "Time's up! Riya got 2")).toBeVisible();
    expect(await chipNames(page, 'Got it')).toEqual([b, a]);
    expect((await moves(page)).filter((m) => m.type === 'fix')).toHaveLength(2);
  });

  test('Version 1.3 item 3: the totals line under the h1: "Riya: 2 in all · Top so far", later "Arjun: 1 in all · Top: Riya 2", then Meena with 0 still "Top: Riya 2"', async ({ page }) => {
    await startNight(page, { seed: 't4-top', players: THREE, turnTime: 30 });
    await playTurn(page, 'GG');
    await expect(text(page, 'Riya: 2 in all · Top so far')).toBeVisible();
    await saveScore(page);
    await playTurn(page, 'G');
    await expect(text(page, 'Arjun: 1 in all · Top: Riya 2')).toBeVisible();
    await saveScore(page);
    await playTurn(page, '');
    await expect(text(page, 'Meena: 0 in all · Top: Riya 2')).toBeVisible();
  });

  test('tied at the top counts as top (product owner, 25 October, item 25): Riya 2, then Meena 2: "Meena: 2 in all · Top so far"', async ({ page }) => {
    await startNight(page, { seed: 't4-top-tie', players: THREE, turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await playTurn(page, ''); await saveScore(page);
    await playTurn(page, 'GG');
    await expect(text(page, 'Meena: 2 in all · Top so far')).toBeVisible();
  });

  test('Version 1.3 item 3: a shared top names both: "Meena: 0 in all · Top: Riya and Arjun 2"', async ({ page }) => {
    await startNight(page, { seed: 't4-top-2', players: THREE, turnTime: 30 });
    await playTurn(page, 'GG'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    await playTurn(page, '');
    await expect(text(page, 'Meena: 0 in all · Top: Riya and Arjun 2')).toBeVisible();
  });

  test('Version 1.1 item 24: 25 words: chips 44 px tall with 8 px gaps in one scroll container; the h1, small lines and main button stay on screen', async ({ page }) => {
    const list: WaiWord[] = WORDS.filter((w) => w.pack === 'Jobs').slice(0, 30);
    await startNight(page, { seed: 't4-many', words: list, pack: 'Jobs', players: THREE, turnTime: 90 });
    const t3 = await toWord(page);
    await marks(page, 'G'.repeat(25));
    await runToTimeUp(page, t3, 90);
    const chips = listChips(page, 'Got it');
    const first = await box(chips.nth(0));
    expect(Math.round(first.height)).toBe(44);
    const scroller = page.getByTestId('turn-lists');
    const s = await scroller.evaluate((e) => ({ sh: e.scrollHeight, ch: e.clientHeight }));
    expect(s.sh).toBeGreaterThan(s.ch);
    await chips.nth(24).scrollIntoViewIfNeeded();
    for (const l of [heading(page, /^Time's up! Riya got 25/), text(page, 'Marked wrong? Tap a word to move it.'), mainButton(page)]) {
      const b = await box(l);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height).toBeLessThanOrEqual(844);
    }
  });

  test('up to 20 words fit without scrolling at 390 × 844', async ({ page }) => {
    const list: WaiWord[] = WORDS.filter((w) => w.pack === 'Jobs').slice(0, 25);
    await startNight(page, { seed: 't4-20', words: list, pack: 'Jobs', players: THREE, turnTime: 60 });
    const t3 = await toWord(page);
    await marks(page, 'GGGGGGGGGGGGGGGGGGG');
    await runToTimeUp(page, t3, 60); // 19 marked + the time-up word = 20
    const s = await page.getByTestId('turn-lists').evaluate((e) => ({ sh: e.scrollHeight, ch: e.clientHeight }));
    expect(s.sh).toBeLessThanOrEqual(s.ch);
    const doc = await page.evaluate(() => ({ h: document.scrollingElement!.scrollHeight, i: window.innerHeight }));
    expect(doc.h).toBeLessThanOrEqual(doc.i);
  });
});

test.describe('WAI-031: Save score and the Undo toast', () => {
  test('"Riya: 2 saved · Undo" stays through a guard-ignored tap and a pause, and goes on the next start tap', async ({ page }) => {
    await startNight(page, { seed: 'toast', players: THREE, turnTime: 30 });
    await playTurn(page, 'GG');
    await saveScore(page);
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
    await expect(toast(page)).toContainText('Riya: 2 saved');
    await page.clock.runFor(300);
    await mainButton(page).click({ force: true }); // inside the 1000 ms guard: does nothing
    await expect(toast(page)).toContainText('Riya: 2 saved');
    await page.clock.runFor(20000); // no time limit on this toast
    await expect(toast(page)).toContainText('Riya: 2 saved');
    await pauseButton(page).click();
    await expect(toast(page)).toBeHidden(); // hidden while the cover is open
    await tap(page, button(page, 'Carry on playing'));
    await expect(toast(page)).toContainText('Riya: 2 saved');
    await tap(page, mainButton(page));
    await expect(toast(page)).toHaveCount(0);
  });

  test('another recorded move (Hands-free for Arjun) takes the toast away: the turn is locked', async ({ page }) => {
    await startNight(page, { seed: 'toast-2', players: THREE, turnTime: 30 });
    await playTurn(page, 'G');
    await saveScore(page);
    await tap(page, button(page, 'Hands-free for Arjun'));
    await expect(toast(page)).toHaveCount(0);
  });

  test('Undo from R1 (after the round\'s last save) returns to that T4', async ({ page }) => {
    await startNight(page, { seed: 'toast-r1', players: ['Riya', 'Arjun'], turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(heading(page, "Time's up! Arjun got 2")).toBeVisible();
    expect((await moves(page)).at(-1)).toEqual({ type: 'undoScore' });
  });
});

test.describe('WAI-032 / WAI-033: scoreboards and Round over', () => {
  test('R1: h1 "Round 1 done. Round 2 next."; rows highest first, ties in turn order; the lines and buttons', async ({ page }) => {
    await startNight(page, { seed: 'r1', pack: 'Animals', players: THREE, turnTime: 30 });
    const want = firstWords('r1', 'Animals');
    await playTurn(page, 'GP'); await saveScore(page); // Riya 1, passed want[1] and the time-up word want[2]
    await playTurn(page, 'GGG'); await saveScore(page); // Arjun 3, passed the time-up word
    await playTurn(page, 'G'); await saveScore(page); // Meena 1
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    expect(await boardRows(page)).toEqual(['Arjun 3 (1 turn)', 'Riya 1 (1 turn)', 'Meena 1 (1 turn)']);
    await expect(text(page, `Words nobody got: ${want[1]}, ${want[2]}, ${want[6]}, ${want[8]}`)).toBeVisible();
    await expect(text(page, 'Play as many rounds as you like; tap End the game to see who got the most.')).toBeVisible();
    for (const q of ['Players (3) ›', 'Change players or words', 'End the game', '← Home (game saved)']) await expect(button(page, q)).toBeVisible();
    await expect(mainButton(page)).toHaveText('Round 2');
    await tap(page, mainButton(page));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await expect(text(page, 'Round 2 · player 1 of 3')).toBeVisible();
  });

  test('Version 1.1 item 34: more than 5 words nobody got: the first 5, then "and 3 more" (no comma before "and"); none: the line is left out', async ({ page }) => {
    await startNight(page, { seed: 'r1-many', pack: 'Animals', players: ['Riya', 'Arjun'], turnTime: 30 });
    const want = firstWords('r1-many', 'Animals');
    await playTurn(page, 'PPPPPPP'); await saveScore(page); // 7 passed + the time-up word = 8
    await playTurn(page, 'G'); await saveScore(page);
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    // Arjun's time-up word also counts: 9 passed this round
    await expect(text(page, `Words nobody got: ${want.slice(0, 5).join(', ')} and 4 more`)).toBeVisible();
    await tap(page, mainButton(page));
    await playTurn(page, 'G');
    await listChips(page, 'Passed').first().click();
    await saveScore(page);
    await playTurn(page, 'G');
    await listChips(page, 'Passed').first().click();
    await saveScore(page);
    await expect(heading(page, 'Round 2 done. Round 3 next.')).toBeVisible();
    await expect(page.getByText(/^Words nobody got:/)).toHaveCount(0);
  });

  test('a player who left is listed last as "Kabir 0 (0 turns) (left)"… and R1 keeps the order', async ({ page }) => {
    await startNight(page, { seed: 'r1-left', players: ['Riya', 'Arjun', 'Kabir'], turnTime: 30 });
    await playTurn(page, 'G'); await saveScore(page);
    await fromMenu(page, 'Players');
    await button(page, 'Remove Kabir').click();
    await tap(page, dialog(page, 'Kabir has to leave?').getByRole('button', { name: 'Kabir leaves', exact: true }));
    await tap(page, button(page, 'Done'));
    await playTurn(page, 'GG'); await saveScore(page);
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    expect(await boardRows(page)).toEqual(['Arjun 2 (1 turn)', 'Riya 1 (1 turn)', 'Kabir 0 (0 turns) (left)']);
  });

  test('Version 1.1 item 33: "Change players or words" → S1 with "← Back to the game" (back to R1, nothing recorded) → S2 "Carry on playing" (setChoices; scores kept) → T1 of the next round', async ({ page }) => {
    await startNight(page, { seed: 'r1-change', players: ['Riya', 'Arjun'], turnTime: 30, pack: 'mix' });
    await playTurn(page, 'G'); await saveScore(page);
    await playTurn(page, 'GG'); await saveScore(page);
    const before = (await moves(page)).length;
    await tap(page, button(page, 'Change players or words'));
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await tap(page, button(page, '← Back to the game'));
    await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
    expect((await moves(page)).length).toBe(before);
    await tap(page, button(page, 'Change players or words'));
    await tap(page, mainButton(page)); // Next
    await expect(heading(page, 'Words and time')).toBeVisible();
    await page.getByRole('radio', { name: /^Animals · 92 words/ }).click();
    await expect(mainButton(page)).toHaveText('Carry on playing');
    await tap(page, mainButton(page));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    expect((await moves(page)).at(-1)).toMatchObject({ type: 'setChoices', choices: { pack: 'Animals' } });
    await fromMenu(page, 'Scores');
    expect(await boardRows(page)).toEqual(['Arjun 2 (1 turn)', 'Riya 1 (1 turn)']);
    await guards(page);
  });
});
