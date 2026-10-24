// What Am I? usability (specs/what-am-i/09-usability.md WAI-080 to WAI-082), scenarios version 1.3: every size with Larger
// text off and on (Version 1.1 item 25; Version 1.3 items 5, 6), accessibility (Version 1.1 item 47), words never used
// (Version 1.1 item 48).
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import {
  SIZES, TZ, box, button, dialog, heading, mainButton, marks, noSidewaysScroll, pauseButton, playTurn, saveScore, screenText,
  startNight, tap, theWord, toWord, flash, WORDS,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ });

async function mainFixed(page: Page, where: string) {
  const v = page.viewportSize()!;
  const m = await box(mainButton(page));
  expect(m.y + m.height, `${where}: main button on screen`).toBeLessThanOrEqual(v.height + 0.5);
  expect(m.x + m.width, `${where}: main button on screen`).toBeLessThanOrEqual(v.width + 0.5);
  await page.mouse.wheel(0, 400);
  await page.clock.runFor(200);
  const after = await box(mainButton(page));
  expect(Math.abs(after.y - m.y), `${where}: main button stays fixed`).toBeLessThanOrEqual(1);
}

test.describe('WAI-080: every size, Larger text off and on', () => {
  for (const size of SIZES) {
    for (const larger of [false, true]) {
      const where = `${size.width} × ${size.height}${larger ? ', Larger text' : ''}`;
      test(`${where}: S1, S2, Read this aloud, T1, T4 and R1 with 16-character names: no sideways scrolling, the main button fixed and on screen`, async ({ page }) => {
        const names = ['Aishwaryalakshmi', 'Venkatasubraman'];
        await startNight(page, { seed: 'sizes', players: names, viewport: size, larger, turnTime: 30, stopAt: 'S1' });
        await noSidewaysScroll(page, `${where}, S1`); await mainFixed(page, `${where}, S1`);
        await tap(page, mainButton(page));
        await noSidewaysScroll(page, `${where}, S2`); await mainFixed(page, `${where}, S2`);
        await tap(page, mainButton(page));
        await noSidewaysScroll(page, `${where}, Read this aloud`);
        await tap(page, mainButton(page));
        await expect(heading(page, `${names[0]}, you're guessing`)).toBeVisible();
        await noSidewaysScroll(page, `${where}, T1`); await mainFixed(page, `${where}, T1`);
        await playTurn(page, 'GP');
        await noSidewaysScroll(page, `${where}, T4`); await mainFixed(page, `${where}, T4`);
        await saveScore(page);
        await playTurn(page, 'G');
        await saveScore(page);
        await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
        await noSidewaysScroll(page, `${where}, R1`); await mainFixed(page, `${where}, R1`);
      });
    }
  }

  test('Version 1.1 item 25: landscape main button 358 × 60 at bottom right, 16 px in (812 × 375); 240 × 52, 12 px in (568 × 320); T3 has none', async ({ page }) => {
    for (const [size, w, h, inset] of [[{ width: 812, height: 375 }, 358, 60, 16], [{ width: 568, height: 320 }, 240, 52, 12]] as const) {
      await startNight(page, { seed: 'land', players: ['Riya', 'Arjun'], viewport: size });
      const m = await box(mainButton(page));
      expect(Math.round(m.width)).toBe(w);
      expect(Math.round(m.height)).toBe(h);
      expect(Math.round(size.width - (m.x + m.width))).toBe(inset);
      expect(Math.round(size.height - (m.y + m.height))).toBe(inset);
      await toWord(page);
      await expect(mainButton(page)).toHaveCount(0);
    }
  });

  test('Version 1.3 item 5: at 320 × 568 with Larger text, Words and time scrolls so its last line and "← Back" clear the main button', async ({ page }) => {
    await startNight(page, { seed: 'pad', players: ['Riya', 'Arjun'], viewport: { width: 320, height: 568 }, larger: true, stopAt: 'S2' });
    const back = button(page, '← Back');
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight));
    await page.mouse.wheel(0, 5000);
    await page.clock.runFor(300);
    const m = await box(mainButton(page));
    const b = await box(back);
    expect(b.y + b.height).toBeLessThanOrEqual(m.y);
  });
});

test.describe('WAI-081: accessibility', () => {
  test.use({ viewport: { width: 812, height: 375 } });

  test('each mark is announced in mark-live (aria-live assertive): "Got it", "Pass"; "10 seconds left" at 10 s; flash text 4.5:1 on its colour', async ({ page }) => {
    await startNight(page, { seed: 'live', players: ['Riya', 'Arjun'], turnTime: 30 });
    const t3 = await toWord(page);
    const live = page.getByTestId('mark-live');
    await expect(live).toHaveAttribute('aria-live', 'assertive');
    await page.clock.runFor(800);
    await page.mouse.click(406, 300);
    await expect(live).toHaveText('Got it');
    const ratio = await flash(page).evaluate((el) => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
      const a = lum(rgb(getComputedStyle(el).color)), b = lum(rgb(getComputedStyle(el).backgroundColor));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    await page.clock.runFor(600 + 800);
    await page.mouse.click(406, 100);
    await expect(live).toHaveText('Pass');
    await page.clock.runFor(t3 + 20000 - (await page.evaluate(() => Date.now())));
    await expect(page.locator('[aria-live]').filter({ hasText: '10 seconds left' })).toHaveCount(1);
  });

  test('every icon button has a word or an accessible name (T1, T3, T4)', async ({ page }) => {
    await startNight(page, { seed: 'names', players: ['Riya', 'Arjun'], turnTime: 30 });
    const unnamed = async () => page.getByRole('button').evaluateAll((els) => els.filter((e) => !((e.getAttribute('aria-label') ?? '') + (e.textContent ?? '')).trim()).length);
    expect(await unnamed()).toBe(0);
    await toWord(page);
    expect(await unnamed()).toBe(0);
    await expect(pauseButton(page)).toBeVisible();
    await page.clock.runFor(30000);
    expect(await unnamed()).toBe(0);
  });
});

test.describe('WAI-082: words never used on screen (Version 1.1 item 48)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no screen of a whole night says "tilt", "tilting", "nod", "session", "evening" or "card"; "clue" only in the allowed phrases', async ({ page }) => {
    const seen: string[] = [];
    const look = async (where: string) => seen.push(`${where}\n${await screenText(page)}`);
    await startNight(page, { seed: 'words', players: ['Riya', 'Arjun'], turnTime: 30, stopAt: 'S1' });
    await look('S1');
    await tap(page, mainButton(page)); await look('S2');
    await tap(page, button(page, 'How to play')); await look('How to play');
    await tap(page, mainButton(page));
    await tap(page, mainButton(page)); await look('Read this aloud');
    await tap(page, mainButton(page)); await look('T1');
    await tap(page, mainButton(page)); await look('T2');
    await page.clock.runFor(3000); await look('T3');
    await marks(page, 'G');
    await pauseButton(page).click(); await look('Paused');
    await tap(page, button(page, "End Riya's turn now")); await look('End Riya\'s turn now?');
    await tap(page, dialog(page, "End Riya's turn now?").getByRole('button', { name: "End Riya's turn now", exact: true })); await look('T4');
    await saveScore(page);
    await playTurn(page, 'G'); await saveScore(page); await look('R1');
    await tap(page, button(page, 'End the game')); await look('End the game?');
    await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true })); await look('G1');
    await tap(page, button(page, 'End for tonight'));
    await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true })); await look('G2');
    // Version 1.1 item 48's phrases, with T3's "give clues" (Version 1.3 item 1) and How to play's "a clue broke the rules"
    // (Version 1.3 item 7), which win over item 48.
    const allowed = /Give clues|gives clues|give clues|Clue givers|clue giver|a clue broke the rules/gi;
    // words from the word list are not the app's own text (product owner, 25 October, item 37)
    const listWords = WORDS.map((w) => w.word).sort((a, b) => b.length - a.length);
    for (const raw of seen) {
      let s = raw;
      for (const w of listWords) s = s.split(w).join(' ');
      const where = raw.split('\n')[0];
      expect(s, where).not.toMatch(/\b(tilt|tilting|nod|session|evening|card)\b/i);
      expect(s.replace(allowed, ''), where).not.toMatch(/\bclues?\b/i);
    }
    await expect(theWord(page)).toHaveCount(0);
  });
});
