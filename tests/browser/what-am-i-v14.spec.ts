// What Am I? scenarios Version 1.4 (product owner, 26 October 2026; specs/what-am-i/README.md "Version 1.4"):
// item 2, the "Pass" and "Got it" labels on T3 (WAI-020); item 3, "Stand the phone up" in place of "Hands-free" on every
// screen (WAI-003, WAI-005, WAI-006, WAI-012, WAI-014). The changed strings of T4 and Read this aloud are checked where they
// were before (what-am-i-scores.spec.ts, what-am-i-setup.spec.ts). Item 4 lists things kept by design: no test here.
import { expect, test } from './fixtures';
import {
  SIZES, TZ, UPRIGHT, WORDS, button, every16, firstWords, guards, heading, mainButton, marks, moves, pauseButton, playTurn,
  radio, saveScore, scheduleOrientation, screenText, startNight, startTurn, tap, text, theWord, timeLeft, toWord, type WaiWord,
} from './what-am-i';
import type { Locator, Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

const TWO = ['Riya', 'Arjun'];
const HAND_TOP = "Everyone else: give clues. Don't say the word!";
const FREE_TOP = 'Clue givers: tap bottom for Got it, top for Pass.';
const NOT_FLASH = ':not([data-testid="mark-flash"]):not([data-testid="mark-flash"] *):not([data-testid="mark-live"]):not([data-testid="mark-live"] *)';
/** T3's label (Version 1.4 item 2): the text "Pass" or "Got it", not the flash and not the live region. */
const label = (page: Page, t: 'Pass' | 'Got it') => page.getByText(t, { exact: true }).and(page.locator(NOT_FLASH));

interface Box { x: number; y: number; width: number; height: number }
/** The box of the text itself (a Range over the element's contents), so a full-width line is measured by its words. */
async function textBox(l: Locator): Promise<Box> {
  return l.evaluate((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rs = Array.from(r.getClientRects()).filter((x) => x.width > 0 && x.height > 0);
    const left = Math.min(...rs.map((x) => x.left)), top = Math.min(...rs.map((x) => x.top));
    const right = Math.max(...rs.map((x) => x.right)), bottom = Math.max(...rs.map((x) => x.bottom));
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
}
async function elBox(l: Locator): Promise<Box> {
  const b = await l.boundingBox();
  expect(b, 'on screen').not.toBeNull();
  return b!;
}
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
const cx = (b: Box) => b.x + b.width / 2;
const cy = (b: Box) => b.y + b.height / 2;
function inside(b: Box, W: number, H: number, what: string) {
  expect(b.x, `${what}: inside the screen (left)`).toBeGreaterThanOrEqual(-0.5);
  expect(b.y, `${what}: inside the screen (top)`).toBeGreaterThanOrEqual(-0.5);
  expect(b.x + b.width, `${what}: inside the screen (right)`).toBeLessThanOrEqual(W + 0.5);
  expect(b.y + b.height, `${what}: inside the screen (bottom)`).toBeLessThanOrEqual(H + 0.5);
}
/** Neither label overlaps the word, the pack name, `time-left` or Pause (Version 1.4 item 2; tester's reading). */
async function labelsClear(page: Page, pack: string, where: string) {
  const others: [string, Box][] = [
    ['the word', await textBox(theWord(page))],
    ['the pack name', await textBox(text(page, pack))],
    ['time-left', await textBox(timeLeft(page))],
    ['Pause', await elBox(pauseButton(page))],
  ];
  for (const t of ['Pass', 'Got it'] as const) {
    const b = await textBox(label(page, t));
    for (const [n, o] of others) expect(overlaps(b, o), `${where}: "${t}" must not cover ${n}`).toBe(false);
  }
}

test.describe('Version 1.4 item 2 (WAI-020): "Pass" under the top line, "Got it" 8 px above the bottom edge', () => {
  const longest = WORDS.reduce((a, b) => (b.word.length > a.word.length ? b : a));
  const owl = WORDS.find((w) => w.word === 'Owl')!;
  const list: WaiWord[] = [longest, owl];

  for (const size of SIZES) {
    for (const hold of ['hand', 'free'] as const) {
      test(`${size.width} × ${size.height}, ${hold === 'hand' ? "in the guesser's hand" : 'stand the phone up'}: both labels 15 px (19 px Larger text), centred, placed, text not buttons, never covering the word (the longest word and Owl)`, async ({ page }) => {
        test.setTimeout(90_000);
        const W = size.width, H = size.height;
        for (const larger of [false, true]) {
          const seed = `labels-${hold}-${larger}`;
          await startNight(page, { seed, words: list, pack: 'mix', players: TWO, hold, larger, viewport: size });
          await toWord(page);
          const order = firstWords(seed, 'mix', false, list);
          for (let i = 0; i < 2; i++) {
            const where = `${W} × ${H}, ${hold}, Larger text ${larger ? 'on' : 'off'}, word ${order[i]}`;
            const pass = label(page, 'Pass'), got = label(page, 'Got it');
            await expect(pass, where).toBeVisible();
            await expect(got, where).toBeVisible();
            for (const l of [pass, got]) expect(await l.evaluate((e) => getComputedStyle(e).fontSize), where).toBe(larger ? '19px' : '15px');
            await expect(page.getByRole('button', { name: 'Pass', exact: true }), `${where}: "Pass" is text, not a button`).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Got it', exact: true }), `${where}: "Got it" is text, not a button`).toHaveCount(0);
            const top = await elBox(text(page, hold === 'hand' ? HAND_TOP : FREE_TOP));
            const p = await elBox(pass), g = await elBox(got);
            const pt = await textBox(pass), gt = await textBox(got);
            inside(pt, W, H, `${where}: "Pass"`);
            inside(gt, W, H, `${where}: "Got it"`);
            expect(Math.abs(cx(pt) - W / 2), `${where}: "Pass" centred`).toBeLessThanOrEqual(2);
            expect(Math.abs(cx(gt) - W / 2), `${where}: "Got it" centred`).toBeLessThanOrEqual(2);
            const gap = p.y - (top.y + top.height);
            expect(gap, `${where}: "Pass" directly under the top line`).toBeGreaterThanOrEqual(-0.5);
            expect(gap, `${where}: "Pass" directly under the top line`).toBeLessThanOrEqual(16);
            expect(Math.abs(H - (g.y + g.height) - 8), `${where}: "Got it" 8 px above the bottom edge`).toBeLessThanOrEqual(2);
            const word = await textBox(theWord(page));
            expect(word.y, `${where}: the word below "Pass"`).toBeGreaterThanOrEqual(pt.y + pt.height - 0.5);
            expect(word.y + word.height, `${where}: the word above "Got it"`).toBeLessThanOrEqual(gt.y + 0.5);
            const fit = await theWord(page).evaluate((el) => {
              const r = document.createRange();
              r.selectNodeContents(el);
              const tops = new Set(Array.from(r.getClientRects()).filter((x) => x.width > 0).map((x) => Math.round(x.top)));
              return { fs: parseFloat(getComputedStyle(el).fontSize), lines: tops.size };
            });
            expect(fit.fs, where).toBeGreaterThanOrEqual(40);
            expect(fit.lines, `${where}: fits in 2 lines`).toBeLessThanOrEqual(2);
            await labelsClear(page, list.find((w) => w.word === order[i])!.pack, where);
            if (i === 0) await marks(page, 'G');
          }
        }
      });
    }
  }

  for (const size of [{ width: 812, height: 375 }, UPRIGHT]) {
    for (const hold of ['hand', 'free'] as const) {
      test(`${size.width} × ${size.height}, ${hold}: a tap on "Got it" marks Got it and a tap on "Pass" marks Pass (they count for their marking area)`, async ({ page }) => {
        await startNight(page, { seed: `label-taps-${hold}`, pack: 'Animals', players: TWO, hold, viewport: size, turnTime: 30 });
        await toWord(page);
        for (const [t, move] of [['Got it', 'got'], ['Pass', 'pass']] as const) {
          await page.clock.runFor(800);
          const b = await textBox(label(page, t));
          await page.mouse.click(cx(b), cy(b));
          await page.clock.runFor(600);
          expect((await moves(page)).at(-1)?.type, `a tap on "${t}"`).toBe(move);
        }
      });
    }
  }

  test('after a WAI-024 turn (held sideways while the screen says portrait): both labels still show, "Got it" 8 px from the edge the room reads as the bottom, the word between them and never covered', async ({ page }) => {
    test.setTimeout(150_000); // about 250 scheduled orientation events, slow under `taskpolicy -b`
    await startNight(page, { seed: 'labels-rotate', words: [WORDS.find((w) => w.word === 'Owl')!, WORDS.find((w) => w.word === 'Tiger')!], pack: 'mix', players: TWO, orientationType: 'portrait-primary' });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t3 + 1000, () => 0).map((e) => ({ ...e, gamma: 0, beta: 90 })),
      ...every16(t3 + 1000, t3 + 2200, () => 0).map((e) => ({ t: e.t, gamma: 75, beta: 0 })),
    ]);
    await page.clock.runFor(3000 + 1900); // sideways from 1000, turned after 1500
    const turned = await elBox(theWord(page));
    expect(turned.height, 'T3 is drawn turned').toBeGreaterThan(turned.width);
    const W = UPRIGHT.width, H = UPRIGHT.height;
    await expect(label(page, 'Pass')).toBeVisible();
    await expect(label(page, 'Got it')).toBeVisible();
    const pt = await textBox(label(page, 'Pass')), gt = await textBox(label(page, 'Got it')), w = await textBox(theWord(page));
    inside(pt, W, H, '"Pass"');
    inside(gt, W, H, '"Got it"');
    // turned 90°: the room's top-to-bottom runs along the screen's x axis
    expect(Math.sign(cx(pt) - cx(w)), 'the word between "Pass" and "Got it"').toBe(-Math.sign(cx(gt) - cx(w)));
    expect(Math.abs(cy(pt) - H / 2), '"Pass" centred as the room reads it').toBeLessThanOrEqual(2);
    expect(Math.abs(cy(gt) - H / 2), '"Got it" centred as the room reads it').toBeLessThanOrEqual(2);
    const g = await elBox(label(page, 'Got it'));
    const edge = cx(gt) > cx(w) ? W - (g.x + g.width) : g.x;
    expect(Math.abs(edge - 8), '"Got it" 8 px above the bottom edge as the room reads it').toBeLessThanOrEqual(2);
    await labelsClear(page, 'Animals', 'turned');
  });
});

test.describe('Version 1.4 item 3: "Stand the phone up" in place of "Hands-free" on every screen', () => {
  test('S2\'s option is "Stand the phone up" (its small line unchanged); "Hands-free" shows on no screen of a night, in either hold', async ({ page }) => {
    test.setTimeout(90_000);
    const seen: string[] = [];
    const look = async (where: string) => seen.push(`${where}\n${await screenText(page)}`);
    await startNight(page, { seed: 'stand-up', players: TWO, turnTime: 30, stopAt: 'S2' });
    await expect(radio(page, "In the guesser's hand")).toBeVisible();
    await expect(radio(page, 'Stand the phone up')).toBeVisible();
    await expect(text(page, 'The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small children.')).toBeVisible();
    await look('S2');
    await tap(page, button(page, 'How to play')); await look('How to play');
    await tap(page, mainButton(page));
    await expect(heading(page, 'Words and time')).toBeVisible();
    await tap(page, mainButton(page)); await look('Read this aloud (hand)');
    await tap(page, mainButton(page)); await look('T1 (hand)');
    await tap(page, button(page, 'Stand the phone up for Riya'));
    await expect(text(page, "Stand the phone up (Riya's choice)")).toBeVisible();
    await look('T1 (Riya stands the phone up)');
    await startTurn(page); await look('T2');
    await page.clock.runFor(3000); await look('T3');
    await marks(page, 'G');
    await page.clock.runFor(30000);
    await expect(heading(page, /^Time's up!/)).toBeVisible();
    await look('T4');
    await saveScore(page);
    await look('T1 (Arjun)');
    // a night chosen with the phone standing up from the start
    await startNight(page, { seed: 'stand-up-free', players: TWO, turnTime: 30, hold: 'free', stopAt: 'S3' });
    await look('Read this aloud (free)');
    await tap(page, mainButton(page));
    await expect(button(page, 'Riya will hold it')).toBeVisible();
    await look('T1 (free)');
    await playTurn(page, 'G'); await look('T4 (free)');
    for (const raw of seen) expect(raw, raw.split('\n')[0]).not.toMatch(/hands[\s-]?free/i);
    await guards(page);
  });
});
