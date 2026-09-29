// Phase 1b: auto-call, off by default, on a timer the host sets.
// Scenarios: TAM-120 (auto-call mode: timer, change at any time, one-tap pause in the same place, pauses in the
// background, never skips or repeats), TAM-186 (waits for wins; timer from zero after resuming; undo pauses it;
// 5 to 30 seconds in 5-second steps, 10 by default), TAM-187 (a failing voice never stops the timer),
// TAM-062 (auto-call's own warning). The clock is Playwright's fake clock; the voice is fakeVoices().
import { expect, test, type Page } from '@playwright/test';
import {
  backgroundAndReturn, calledCount, calledNumbers, checkNumbers, currentNumber, dismiss, fakeVoices, fromMenu, recordWin,
  setUpPaperGame, spoken, toggle, turnOnInGame, undoLastCall,
} from './helpers';

const T0 = new Date('2026-10-04T19:00:00+05:30');
const EN_IN = { name: 'Veena', lang: 'en-IN' };
const timer = (page: Page) => page.getByLabel('Time between calls', { exact: true });
const pause = (page: Page) => page.getByRole('button', { name: 'Pause auto-call', exact: true });
const resume = (page: Page) => page.getByRole('button', { name: /^(Resume auto-call|Paused: tap to resume)$/ }).first();

/** A game with auto-call turned on (warning confirmed), timer at `seconds` if given. Settings closed. */
async function autoCallGame(page: Page, seconds?: number) {
  await page.clock.install({ time: T0 });
  await fakeVoices(page, [EN_IN]);
  await setUpPaperGame(page);
  await turnOnInGame(page, 'Auto-call');
  if (seconds) await timer(page).selectOption(String(seconds));
  await dismiss(page);
  await expect(pause(page)).toBeVisible();
}

/** Lets `ms` of game time pass. */
const wait = (page: Page, ms: number) => page.clock.runFor(ms);

test.describe('TAM-120: auto-call mode', () => {
  test('off by default: nothing is called on its own', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await setUpPaperGame(page);
    await wait(page, 60_000);
    expect(await calledCount(page)).toBe(0);
    await fromMenu(page, 'Settings');
    await expect(toggle(page, 'Auto-call')).not.toBeChecked();
  });

  test('TAM-186 and TAM-062: turning it on warns once; the timer is 5 to 30 seconds in 5-second steps, 10 by default', async ({ page }) => {
    await page.clock.install({ time: T0 });
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await fromMenu(page, 'Settings');
    await toggle(page, 'Auto-call').click();
    const warning = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Turn on', exact: true }) });
    await expect(warning).toBeVisible();
    await warning.getByRole('button', { name: 'Turn on', exact: true }).click();
    await expect(timer(page)).toHaveValue('10');
    const options = await timer(page).locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    expect(options).toEqual(['5', '10', '15', '20', '25', '30']);
  });

  test('on the timer, a number is called every 10 seconds, and the phone speaks each one', async ({ page }) => {
    await autoCallGame(page);
    const start = await calledCount(page);
    await wait(page, 7_000);
    expect(await calledCount(page)).toBe(start);
    await wait(page, 4_500);
    expect(await calledCount(page)).toBe(start + 1);
    await wait(page, 10_000);
    expect(await calledCount(page)).toBe(start + 2);
    const text = (await spoken(page)).map((l) => l.text).join(' ');
    expect(text).toContain(((await currentNumber(page).textContent()) ?? '').trim());
  });

  test('one tap pauses and resumes, always in the same place', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    const where = (await pause(page).boundingBox())!;
    await pause(page).click();
    const count = await calledCount(page);
    await wait(page, 45_000);
    expect(await calledCount(page)).toBe(count);
    const there = (await resume(page).boundingBox())!;
    expect({ x: Math.round(there.x), y: Math.round(there.y) }).toEqual({ x: Math.round(where.x), y: Math.round(where.y) });
    await resume(page).click();
    await wait(page, 11_000);
    expect(await calledCount(page)).toBe(count + 1);
  });

  test('if the app goes to the background, auto-call pauses and shows "Paused: tap to resume" on return', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    await backgroundAndReturn(page);
    await expect(page.getByText('Paused: tap to resume')).toBeVisible();
    const count = await calledCount(page);
    await wait(page, 30_000);
    expect(await calledCount(page)).toBe(count);
    await page.getByText('Paused: tap to resume').click();
    await wait(page, 11_000);
    expect(await calledCount(page)).toBe(count + 1);
  });

  test('the timer can be changed during the game, taking effect from the next call', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    const c0 = await calledCount(page);
    await fromMenu(page, 'Settings');
    await timer(page).selectOption('30');
    await dismiss(page);
    // The call already on its way may still come at the old time; after it, calls are 30 seconds apart.
    await wait(page, 12_000);
    const c1 = await calledCount(page);
    expect(c1 - c0).toBeLessThanOrEqual(1);
    if (c1 === c0) {
      await wait(page, 20_000);
      expect(await calledCount(page)).toBe(c0 + 1);
    }
    const c2 = await calledCount(page);
    await wait(page, 24_000);
    expect(await calledCount(page), 'no call within 24 seconds at a 30-second timer').toBe(c2);
    await wait(page, 8_000);
    expect(await calledCount(page)).toBe(c2 + 1);
  });

  test('pausing and changing the timer never skip or repeat a number', async ({ page }) => {
    test.setTimeout(90_000);
    await autoCallGame(page, 5);
    const seen: number[] = [];
    const note = async () => {
      const n = Number(((await currentNumber(page).textContent()) ?? '').trim());
      if (n && seen[seen.length - 1] !== n) seen.push(n);
    };
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 3; i++) { await wait(page, 5_500); await note(); }
      await pause(page).click();
      await wait(page, 12_000);
      await note();
      await fromMenu(page, 'Settings');
      await timer(page).selectOption(round % 2 ? '5' : '10');
      await dismiss(page);
      await resume(page).click();
    }
    const board = await calledNumbers(page);
    expect(new Set(board).size).toBe(board.length);
    expect(board.length).toBe(await calledCount(page));
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort((a, b) => a - b)).toEqual([...board].sort((a, b) => a - b));
  });
});

test.describe('TAM-186: auto-call waits for wins', () => {
  test('"Record a win" pauses it; nothing is called until the tier is closed and the host resumes; then the timer starts from zero', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    await page.getByRole('button', { name: 'Record a win' }).click();
    const count = await calledCount(page);
    await wait(page, 25_000);
    expect(await calledCount(page)).toBe(count);
    await page.getByRole('button', { name: 'Early Five', exact: true }).click();
    await page.getByRole('button', { name: 'Riya', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await wait(page, 25_000);
    expect(await calledCount(page)).toBe(count);
    await page.getByRole('button', { name: 'Close Early Five', exact: true }).click();
    await wait(page, 25_000);
    expect(await calledCount(page), 'still paused until the host resumes').toBe(count);
    await resume(page).click();
    await wait(page, 8_000);
    expect(await calledCount(page), 'the timer starts again from zero').toBe(count);
    await wait(page, 3_500);
    expect(await calledCount(page)).toBe(count + 1);
  });

  test('"Check numbers" pauses it too, until the host resumes', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    const n = Number(((await currentNumber(page).textContent()) ?? '').trim());
    await checkNumbers(page, 'Top Line', [n, ...[1, 2, 3, 4, 5, 6].filter((x) => x !== n)].slice(0, 5));
    const count = await calledCount(page);
    await wait(page, 25_000);
    expect(await calledCount(page)).toBe(count);
    await dismiss(page);
    await wait(page, 25_000);
    expect(await calledCount(page)).toBe(count);
    await resume(page).click();
    await wait(page, 11_000);
    expect(await calledCount(page)).toBe(count + 1);
  });

  test('a won tier waiting to be closed keeps it paused', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    await recordWin(page, 'Top Line', ['Asha']);
    const count = await calledCount(page);
    await wait(page, 40_000);
    expect(await calledCount(page)).toBe(count);
  });

  test('undo of the last call works the same with auto-call on, and pauses auto-call', async ({ page }) => {
    await autoCallGame(page);
    await wait(page, 11_000);
    const first = Number(((await currentNumber(page).textContent()) ?? '').trim());
    await wait(page, 10_000);
    const count = await calledCount(page);
    expect(count).toBe(2);
    await undoLastCall(page).click();
    await expect(currentNumber(page)).toHaveText(String(first));
    expect(await calledCount(page)).toBe(1);
    await wait(page, 25_000);
    expect(await calledCount(page), 'paused after undo').toBe(1);
    await resume(page).click();
    await wait(page, 11_000);
    expect(await calledCount(page)).toBe(2);
  });
});

test('TAM-187: a voice that fails never stops auto-call; the timer carries on', async ({ page, context }) => {
  await page.clock.install({ time: T0 });
  await fakeVoices(page, [EN_IN], true);
  await setUpPaperGame(page);
  await turnOnInGame(page, 'Auto-call');
  await dismiss(page);
  await context.setOffline(true);
  await wait(page, 11_000);
  expect(await calledCount(page)).toBe(1);
  await wait(page, 10_000);
  expect(await calledCount(page)).toBe(2);
  await wait(page, 10_000);
  expect(await calledCount(page)).toBe(3);
  await context.setOffline(false);
});
