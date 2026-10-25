// What Am I? marks around pauses (specs/what-am-i/03-turn.md WAI-020, WAI-021 Version 1.1 item 14; 04-scores.md WAI-030;
// 06-interruptions.md WAI-040, WAI-043 Version 1.2 item 2; 02-words.md WAI-010 Version 1.1 items 5, 6), scenarios version 1.3.
//
// A player walk (25 October 2026) reported: round 2, Dev's turn, after a pause and a Home trip, resume onto the Paused cover,
// Carry on, countdown; the word showed; two quick taps on the bottom half; "Got it!" flashed; Pause, "End Dev's turn now";
// T4 listed only the earlier word and "Dev got 1". These tests try that path and its neighbours. The one rule they check
// everywhere: a word whose "Got it!" flash showed is on T4's Got it list, in T4's count, in the saved moves and in the score
// (WAI-021: each mark records `got` for the word on screen; WAI-043: "Words marked so far still count").
import { expect, test } from './fixtures';
import {
  SIDEWAYS, TZ, areaPoint, boardRows, chipNames, dialog, flash, guards, heading, mainButton, marks,
  moves, now, pauseButton, setHidden, playTurn, saveScore, shownWord, startNight, tap, textOf, theWord, toWord,
} from './what-am-i';
import { EXAMPLE_SEED, EXAMPLE_WORDS } from '../games/what-am-i/oracle';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: SIDEWAYS });
test.describe.configure({ timeout: 90_000 }); // three whole turns before Dev's (turn clock runs under a low-priority Mac)

const PLAYERS = ['Riya', 'Dev'];
const cover = (page: Page) => dialog(page, 'Paused');
type How = 'mouse' | 'touch';

/** Round 1 (Riya Got it, Dev Got it), Round 2 (Riya Pass): ends on Dev's T1 in round 2 with Dev on 1 point. */
async function toDevRound2(page: Page, seed: string, running = false) {
  await startNight(page, { seed, pack: 'mix', players: PLAYERS, turnTime: 30 });
  await playTurn(page, 'G', 30); await saveScore(page);
  await playTurn(page, 'G', 30); await saveScore(page);
  await expect(heading(page, 'Round 1 done. Round 2 next.')).toBeVisible();
  await tap(page, mainButton(page)); // Round 2
  await playTurn(page, 'P', 30); await saveScore(page);
  await expect(heading(page, "Dev, you're guessing")).toBeVisible();
  if (running) await page.clock.resume();
}

/** Pause from T3, then "Carry on playing" and the 3 s countdown: a new word shows. */
async function pauseAndCarryOn(page: Page) {
  await pauseButton(page).click();
  await expect(cover(page)).toBeVisible();
  await tap(page, cover(page).getByTestId('main-button'));
  await page.clock.runFor(3000);
  await expect(theWord(page)).toBeVisible();
}

/** Pause, "← Home (game saved)", Home's row: back on the Paused cover. */
async function homeTripToCover(page: Page) {
  await pauseButton(page).click();
  await tap(page, cover(page).getByRole('button', { name: '← Home (game saved)', exact: true }));
  const row = page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' });
  await expect(row).toContainText('What Am I? · Round 2 · Dev guessing');
  await tap(page, row.getByRole('button').first());
  await expect(cover(page)).toBeVisible();
}

/** The phone's Home: the app hidden mid-turn (WAI-040), then shown again: back on the Paused cover. */
async function hiddenToCover(page: Page) {
  await setHidden(page, true);
  await page.clock.runFor(5000);
  await setHidden(page, false);
  await expect(cover(page)).toBeVisible();
}
/** The app reopened mid-turn (WAI-091): back on the Paused cover. */
async function reloadToCover(page: Page) {
  await page.reload();
  await guards(page);
  await expect(cover(page)).toBeVisible();
}
type Trip = 'home row' | 'hidden' | 'reload';
const TRIPS: Record<Trip, (page: Page) => Promise<void>> = { 'home row': homeTripToCover, hidden: hiddenToCover, reload: reloadToCover };

/** The earlier interruptions of the walk: a Got it, a pause and Carry on, then a trip away and Carry on from the cover. */
async function walkToResumedWord(page: Page, trip: Trip = 'home row'): Promise<string> {
  await toWord(page);
  const [first] = await marks(page, 'G');
  await pauseAndCarryOn(page);
  await TRIPS[trip](page);
  await tap(page, cover(page).getByTestId('main-button'));
  await expect(page.getByTestId('countdown')).toHaveText('3');
  await page.clock.runFor(3000);
  await expect(theWord(page)).toBeVisible();
  return first!;
}

async function hit(page: Page, how: How) {
  const p = await areaPoint(page, 'bottom');
  if (how === 'touch') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}
async function flashing(page: Page): Promise<string | null> {
  const f = flash(page);
  if (!(await f.isVisible())) return null;
  return ((await f.textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

/** Two taps on the bottom half, `gap` ms apart (app time). Returns the word and whether "Got it!" flashed. */
async function doubleTap(page: Page, gap: number, how: How = 'mouse'): Promise<{ word: string; flashed: boolean }> {
  const word = await shownWord(page);
  await hit(page, how);
  let seen = await flashing(page);
  if (gap > 0) await page.clock.runFor(gap);
  await hit(page, how);
  seen ??= await flashing(page);
  return { word, flashed: seen !== null && /Got it!/.test(seen) };
}

/** Pause, "End Dev's turn now", confirm: T4 "Turn ended early. Dev got n". */
async function endTurnNow(page: Page) {
  // During a flash the Pause button may sit under the whole-screen flash; then Pause is tapped as the flash ends.
  const flashOn = await flash(page).isVisible();
  const during = await pauseButton(page).click({ timeout: 2000 }).then(() => flashOn, async () => { await page.clock.runFor(600); await pauseButton(page).click(); return false; });
  test.info().annotations.push({ type: 'pause', description: during ? 'Pause tapped during the flash' : 'Pause tapped with no flash showing' });
  await expect(cover(page)).toBeVisible();
  await tap(page, cover(page).getByRole('button', { name: "End Dev's turn now", exact: true }));
  await tap(page, dialog(page, "End Dev's turn now?").getByRole('button', { name: "End Dev's turn now", exact: true }));
  await expect(heading(page, /^Turn ended early\. Dev got \d+$/)).toBeVisible();
}

/** The open turn's moves (after the last scoreTurn). */
async function turnMoves(page: Page): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const all = await moves(page);
  const i = all.map((m) => m.type).lastIndexOf('scoreTurn');
  return all.slice(i + 1);
}

/** The check of every case: each flashed word counts on T4, in the saved moves and, after Save score, in Dev's score. */
async function flashedWordsCount(page: Page, flashed: string[], devBefore = 1) {
  const got = await chipNames(page, 'Got it');
  for (const w of flashed) expect(got, `"${w}" flashed "Got it!" so it is on T4's Got it list`).toContain(w);
  await expect(heading(page, `Turn ended early. Dev got ${got.length}`)).toBeVisible();
  const gotMoves = (await turnMoves(page)).filter((m) => m.type === 'got').map((m) => textOf(m.word));
  for (const w of flashed) expect(gotMoves, `"${w}" recorded as got`).toContain(w);
  expect(new Set(gotMoves).size, 'one got per word').toBe(gotMoves.length);
  expect(gotMoves.length, 'T4 count = got moves').toBe(got.length);
  await saveScore(page);
  await expect(heading(page, 'Round 2 done. Round 3 next.')).toBeVisible();
  expect(await boardRows(page)).toContain(`Dev ${devBefore + got.length} (2 turns)`);
}

test.describe('WAI-021 / WAI-030 / WAI-043: a word that flashed "Got it!" always counts', () => {
  for (const c of [
    { gap: 100, pause: 'after' as const, how: 'mouse' as How },
    { gap: 0, pause: 'during' as const, how: 'mouse' as How },
    { gap: 300, pause: 'during' as const, how: 'mouse' as How },
    { gap: 150, pause: 'after' as const, how: 'touch' as How },
  ]) {
    test(`(a) round 2: Got it tap, a second tap ${c.gap} ms later inside the flash (${c.how}), Pause ${c.pause} the flash, End Dev's turn now`, async ({ page }) => {
      await toDevRound2(page, `flight-a-${c.gap}-${c.how}`);
      await toWord(page);
      const [first] = await marks(page, 'G');
      await page.clock.runFor(800);
      const d = await doubleTap(page, c.gap, c.how);
      expect(d.flashed, 'a tap after the guard flashes "Got it!"').toBe(true);
      if (c.pause === 'after') await page.clock.runFor(600);
      await endTurnNow(page);
      await flashedWordsCount(page, [first!, d.word]);
    });
  }

  for (const c of [
    { gap: 100, pause: 'after' as const, how: 'mouse' as How, trip: 'home row' as Trip },
    { gap: 0, pause: 'during' as const, how: 'mouse' as How, trip: 'home row' as Trip },
    { gap: 150, pause: 'after' as const, how: 'touch' as How, trip: 'home row' as Trip },
    { gap: 100, pause: 'after' as const, how: 'touch' as How, trip: 'hidden' as Trip },
    { gap: 50, pause: 'during' as const, how: 'mouse' as How, trip: 'hidden' as Trip },
    { gap: 100, pause: 'after' as const, how: 'mouse' as How, trip: 'reload' as Trip },
  ]) {
    test(`(b) the walk: pause, a trip away (${c.trip}), Carry on from the Paused cover, then a double tap (${c.gap} ms, ${c.how}), Pause ${c.pause} the flash, End Dev's turn now`, async ({ page }) => {
      await toDevRound2(page, `flight-b-${c.gap}-${c.how}-${c.trip}`);
      const first = await walkToResumedWord(page, c.trip);
      await page.clock.runFor(800);
      const d = await doubleTap(page, c.gap, c.how);
      expect(d.flashed, 'a tap after the guard flashes "Got it!"').toBe(true);
      if (c.pause === 'after') await page.clock.runFor(600);
      await endTurnNow(page);
      await flashedWordsCount(page, [first, d.word]);
    });
  }

  test('(b) the walk around the 800 ms guard after resume: double taps starting at 0, 300, 700, 790, 800 and 900 ms after the word shows', async ({ page }) => {
    await toDevRound2(page, 'flight-b-sweep');
    const first = await walkToResumedWord(page);
    const flashed = [first];
    for (const at of [0, 300, 700, 790, 800, 900]) {
      // the word now showing appeared at `shown`; tap at shown + at and shown + at + 150
      const shown = await now(page);
      await page.clock.runFor(at);
      const d = await doubleTap(page, 150);
      if (d.flashed) flashed.push(d.word);
      if (at + 150 >= 800) expect(d.flashed, `a tap at ${at + 150} ms is past the guard`).toBe(true);
      // let any flash end so the next word shows (WAI-021), then start the next try from there
      const t = await now(page);
      if (d.flashed) await page.clock.runFor(600);
      else await page.clock.runFor(Math.max(0, shown + 800 - t));
      await expect(theWord(page)).toBeVisible();
    }
    await endTurnNow(page);
    await flashedWordsCount(page, flashed);
  });

  test('(b) in real time: after the Home trip and Carry on, two quick taps on the bottom half, Pause, End Dev\'s turn now', async ({ page }) => {

    await toDevRound2(page, 'flight-b-real');
    const first = await walkToResumedWord(page);
    await page.clock.resume();
    await page.waitForTimeout(1000); // past the 800 ms guard, real time
    const word = await shownWord(page);
    const p = await areaPoint(page, 'bottom');
    await page.mouse.click(p.x, p.y);
    await page.mouse.click(p.x, p.y);
    await expect(flash(page)).toHaveText(/Got it!/);
    await page.waitForTimeout(800);
    await endTurnNow(page);
    await flashedWordsCount(page, [first, word]);
  });

  test('(c) taps during the countdown just after resume are ignored (no flash, nothing recorded); the first tap after the guard counts', async ({ page }) => {
    await toDevRound2(page, 'flight-c');
    await toWord(page);
    const [first] = await marks(page, 'G');
    await homeTripToCover(page);
    await tap(page, cover(page).getByTestId('main-button'));
    await expect(page.getByTestId('countdown')).toHaveText('3');
    const before = (await turnMoves(page)).length;
    for (const step of [50, 50, 900, 1000, 900, 90]) { // taps at 50, 100, 1000, 2000, 2900 and 2990 ms of T2
      await page.clock.runFor(step);
      await hit(page, 'mouse');
      await hit(page, 'touch');
      expect(await flashing(page), 'no flash during the countdown').toBeNull();
    }
    expect((await turnMoves(page)).length, 'nothing recorded during the countdown').toBe(before);
    await page.clock.runFor(10); // T3 opens
    await expect(theWord(page)).toBeVisible();
    const word = await shownWord(page);
    await hit(page, 'mouse');
    await page.clock.runFor(50);
    await hit(page, 'touch');
    expect(await flashing(page), 'no flash inside the 800 ms guard').toBeNull();
    await page.clock.runFor(800);
    const d = await doubleTap(page, 100);
    expect(d.word).toBe(word);
    expect(d.flashed).toBe(true);
    await endTurnNow(page);
    await flashedWordsCount(page, [first!, word]);
  });
});

test.describe('WAI-010 / WAI-040 / WAI-091: a reload mid-turn hides the word on screen', () => {
  test('reload with Duck showing records pause { turn: true, word: Duck\'s id }; after Carry on, Duck comes back after Bat and Camel (Version 1.1 items 5, 6)', async ({ page }) => {
    await startNight(page, { seed: EXAMPLE_SEED, words: EXAMPLE_WORDS, pack: 'Animals', players: PLAYERS, turnTime: 30 });
    await toWord(page);
    expect(await marks(page, 'GP')).toEqual(['Owl', 'Tiger']);
    await page.clock.runFor(800);
    expect(await shownWord(page)).toBe('Duck');
    await page.reload();
    await guards(page);
    await expect(cover(page)).toBeVisible();
    const duck = EXAMPLE_WORDS.find((w) => w.word === 'Duck')!.id;
    expect((await moves(page)).at(-1)).toEqual({ type: 'pause', turn: true, word: duck });
    await tap(page, cover(page).getByTestId('main-button'));
    await page.clock.runFor(3000);
    expect(await marks(page, 'GG')).toEqual(['Bat', 'Camel']);
    expect(await shownWord(page)).toBe('Duck');
  });
});
