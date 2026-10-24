// What Am I? C3 checks on the screen (scenarios version 1.3): the word order from the seed (WAI-010, Version 1.1 items 1 to
// 6), marking (WAI-020 areas, WAI-021 with Version 1.1 items 8 to 14 and Version 1.2 item 8), time up (WAI-023), fixing and
// saving (WAI-030, WAI-031) and the saved data (WAI-092). Times are exact: Playwright's clock is frozen and moved by the test
// (WAI-H2); orientation events are fired at exact app times (WAI-H3); the moves are read back from the saved game night.
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import {
  EXAMPLE_SEED, EXAMPLE_WORDS, idOf,
} from '../games/what-am-i/oracle';
import {
  SIDEWAYS, TZ, UPRIGHT, byId, button, chipNames, every16, firstWords, flash, heading, listChips, mainButton, marks, moves, now,
  onlyNight, pauseButton, runToTimeUp, saveScore, scheduleOrientation, shownWord, startNight, startTurn, tap, tapAt, tapMark,
  text, theWord, toast, toWord,
} from './what-am-i';

test.use({ timezoneId: TZ, viewport: SIDEWAYS });

const markMoves = async (page: import('@playwright/test').Page) => (await moves(page)).filter((m) => m.type === 'got' || m.type === 'pass');

test.describe('WAI-010: the word order on screen (WAI-H1b)', () => {
  test('with seed "t1" and Animals, T3 shows the queue\'s words in order, the pack name "Animals" under each', async ({ page }) => {
    await startNight(page, { seed: 't1', pack: 'Animals', players: ['Riya', 'Arjun'] });
    const want = firstWords('t1', 'Animals');
    await toWord(page);
    await expect(theWord(page)).toHaveText(want[0]!);
    await expect(text(page, 'Animals')).toBeVisible();
    await tapMark(page, 'bottom');
    await expect(theWord(page)).toHaveText(want[1]!);
    await tapMark(page, 'top');
    await expect(theWord(page)).toHaveText(want[2]!);
    const m = await markMoves(page);
    expect(m).toEqual([{ type: 'got', word: idOf(want[0]!, 'Animals') }, { type: 'pass', word: idOf(want[1]!, 'Animals') }]);
  });

  test('Mix of all: the pack name under a word is that word\'s own pack (Version 1.1 item 2)', async ({ page }) => {
    await startNight(page, { seed: 'mix-pack', pack: 'mix', players: ['Riya', 'Arjun'] });
    await toWord(page);
    const word = await shownWord(page);
    const w = [...byId.values()].find((x) => x.word === word)!;
    await expect(page.getByText(w.pack, { exact: true })).toBeVisible();
  });

  test('Version 1.1 item 6 (WAI-H7 five Animals words, seed t31): Owl, Tiger, Duck hidden by Pause, then Bat, Camel, Duck at time up', async ({ page }) => {
    await startNight(page, { seed: EXAMPLE_SEED, words: EXAMPLE_WORDS, pack: 'Animals', players: ['Riya', 'Arjun'], turnTime: 30 });
    await toWord(page);
    await expect(theWord(page)).toHaveText('Owl');
    await tapMark(page, 'bottom');
    await expect(theWord(page)).toHaveText('Tiger');
    await tapMark(page, 'top');
    await expect(theWord(page)).toHaveText('Duck');
    await page.clock.runFor(200);
    await pauseButton(page).click();
    await expect(theWord(page)).toHaveCount(0); // WAI-040: the word is not in the DOM
    // 3000 ms of the turn clock have run (two marks of 1400 ms, then 200 ms); it stops while paused
    await tap(page, button(page, 'Carry on playing'));
    await page.clock.runFor(3000); // the countdown again
    await expect(theWord(page)).toHaveText('Bat');
    await tapMark(page, 'bottom');
    await expect(theWord(page)).toHaveText('Camel');
    await tapMark(page, 'bottom');
    await expect(theWord(page)).toHaveText('Duck');
    await page.clock.runFor(30000 - 3000 - 2800); // the time left, kept through the pause
    await expect(heading(page, /^Time's up!/)).toBeVisible();
    const id = (t: string) => idOf(t, 'Animals');
    expect((await moves(page)).filter((m) => ['got', 'pass', 'timeUp', 'pause'].includes(m.type))).toEqual([
      { type: 'got', word: id('Owl') }, { type: 'pass', word: id('Tiger') }, { type: 'pause', turn: true, word: id('Duck') },
      { type: 'got', word: id('Bat') }, { type: 'got', word: id('Camel') }, { type: 'timeUp', word: id('Duck') },
    ]);
  });
});

test.describe('WAI-020 / Version 1.1 item 13: the marking areas', () => {
  test('812 × 375: the grip bands (x < 121.8, x ≥ 690.2) and the Pause button plus 8 px are ignored; top area Pass, bottom area Got it', async ({ page }) => {
    await startNight(page, { seed: 'areas', pack: 'Food', players: ['Riya', 'Arjun'] });
    await toWord(page);
    await page.clock.runFor(900);
    await tapAt(page, 110, 300); // left grip band
    await tapAt(page, 700, 100); // right grip band
    await tapAt(page, 744, 40); // Pause's 8 px margin
    await page.clock.runFor(700);
    expect(await markMoves(page)).toEqual([]);
    await tapAt(page, 130, 300); // bottom area
    await page.clock.runFor(600 + 800);
    await tapAt(page, 680, 100); // top area
    await page.clock.runFor(600);
    expect((await markMoves(page)).map((m) => m.type)).toEqual(['got', 'pass']);
  });

  test('390 × 844 (portrait): no grip bands; the Pause rectangle x 318–382, y 8–72 is ignored; y < 422 Pass, y ≥ 422 Got it', async ({ page }) => {
    await startNight(page, { seed: 'areas-up', pack: 'Food', players: ['Riya', 'Arjun'], viewport: UPRIGHT });
    await toWord(page);
    await page.clock.runFor(900);
    await tapAt(page, 320, 40);
    await page.clock.runFor(700);
    expect(await markMoves(page)).toEqual([]);
    await tapAt(page, 5, 830);
    await page.clock.runFor(1400);
    await tapAt(page, 310, 40);
    await page.clock.runFor(600);
    expect((await markMoves(page)).map((m) => m.type)).toEqual(['got', 'pass']);
  });

  test('a tap on time-left or on the word inside an area counts (Version 1.1 item 13)', async ({ page }) => {
    await startNight(page, { seed: 'on-word', pack: 'Food', players: ['Riya', 'Arjun'] });
    await toWord(page);
    await page.clock.runFor(900);
    const b = await theWord(page).boundingBox();
    expect(b).not.toBeNull();
    const y = b!.y + b!.height - 2 >= 187.5 ? b!.y + b!.height - 2 : b!.y + 2;
    await tapAt(page, b!.x + b!.width / 2, y);
    await page.clock.runFor(600);
    expect(await markMoves(page)).toHaveLength(1);
  });
});

test.describe('WAI-021: what is ignored', () => {
  test('a tap 799 ms after the word appears does nothing; at 800 ms it counts; a second tap during the 600 ms flash does nothing', async ({ page }) => {
    await startNight(page, { seed: 'guard', pack: 'Food', players: ['Riya', 'Arjun'] });
    await toWord(page);
    await page.clock.runFor(799);
    await tapAt(page, 406, 300);
    await page.clock.runFor(1);
    expect(await markMoves(page)).toEqual([]);
    await expect(flash(page)).toHaveCount(0);
    await tapAt(page, 406, 300);
    await expect(flash(page)).toHaveText('Got it!');
    await page.clock.runFor(300);
    await tapAt(page, 406, 100);
    await page.clock.runFor(300);
    expect((await markMoves(page)).map((m) => m.type)).toEqual(['got']);
    // the next word's guard counts from the end of the flash
    await page.clock.runFor(799);
    await tapAt(page, 406, 100);
    await page.clock.runFor(1);
    expect(await markMoves(page)).toHaveLength(1);
    await tapAt(page, 406, 100);
    await page.clock.runFor(600);
    expect((await markMoves(page)).map((m) => m.type)).toEqual(['got', 'pass']);
  });

  test('the flash: "Got it!" in --good, "Pass" in --warn, over the whole screen, 600 ms', async ({ page }) => {
    await startNight(page, { seed: 'flash', pack: 'Food', players: ['Riya', 'Arjun'] });
    await toWord(page);
    await page.clock.runFor(800);
    await tapAt(page, 406, 300);
    await expect(flash(page)).toHaveText('Got it!');
    const f = await flash(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      // --good as it applies to the flash (the game may scope its colours to its own screens)
      const good = getComputedStyle(el).getPropertyValue('--good').trim();
      const probe = document.createElement('i'); probe.style.color = good; document.body.append(probe);
      const want = getComputedStyle(probe).color; probe.remove();
      return { w: r.width, h: r.height, bg: getComputedStyle(el).backgroundColor, want, good };
    });
    expect(f.good, '--good is set where the flash is').not.toBe('');
    expect(f.w).toBeGreaterThanOrEqual(812 - 1);
    expect(f.h).toBeGreaterThanOrEqual(375 - 1);
    expect(f.bg).toBe(f.want);
    await page.clock.runFor(599);
    await expect(flash(page)).toBeVisible();
    await page.clock.runFor(1);
    await expect(flash(page)).toHaveCount(0);
    await page.clock.runFor(800);
    await tapAt(page, 406, 100);
    await expect(flash(page)).toHaveText('Pass');
  });
});

test.describe('WAI-021 / Version 1.1 items 8 to 12: marking by moving the phone (WAI-H3)', () => {
  // Each test schedules 300 to 380 orientation events as page timers; Playwright's clock takes about 170 ms of real time
  // per timer on a low-priority Mac (`taskpolicy -b`), so up to about 65 s: a fitting limit, not a weaker check.
  test.describe.configure({ timeout: 150_000 });
  test('the worked example: θ₀ = 2; θ −45 from t = 1000 → Got it at the event at 1168; −50 at 1800 ignored; 5 at 2000 re-arms; +45 from 2100 → Pass at the first event after the guard (2576)', async ({ page }) => {
    await startNight(page, { seed: 'motion', pack: 'Food', players: ['Riya', 'Arjun'] });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    const theta = (r: number) => (r < 1000 ? 2 : r < 1800 ? -45 : r < 2000 ? -50 : r < 2100 ? 5 : 45);
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t2 + 3000, () => 2), // events from T2's start (WAI-013: motion on); its last 500 ms give θ₀ = 2
      ...every16(t3 + 16, t3 + 3000, (t) => theta(t - t3)),
    ]);
    await page.clock.runFor(3000 + 3000);
    const night = await onlyNight(page);
    const recs = night.records.filter((r: any) => r.move.type === 'got' || r.move.type === 'pass');
    expect(recs.map((r: any) => [r.move.type, r.at - t3])).toEqual([['got', 1168], ['pass', 2576]]);
  });

  test('Version 1.2 item 8: T2 not steady → θ₀ from T3\'s first steady 500 ms; until then no motion mark', async ({ page }) => {
    await startNight(page, { seed: 'motion-2', pack: 'Food', players: ['Riya', 'Arjun'] });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t2 + 2500, () => 0),
      ...every16(t2 + 2500, t2 + 3000, (t) => ((t - t2) % 32 === 4 ? -20 : 20)), // ±20: not within 10 of the mean
      ...every16(t3 + 16, t3 + 2400, (t) => (t - t3 < 1500 ? -45 : -88)), // θ₀ becomes −45; then −88 is 43 below it
    ]);
    await page.clock.runFor(3000 + 2400);
    const recs = (await onlyNight(page)).records.filter((r: any) => r.move.type === 'got' || r.move.type === 'pass');
    expect(recs.map((r: any) => [r.move.type, r.at - t3])).toEqual([['got', 1664]]);
  });

  test('Version 1.2 item 8: T2 steady but |mean| ≥ 35 (θ 60) is not used; T3\'s first steady span (θ 0) is', async ({ page }) => {
    await startNight(page, { seed: 'motion-3', pack: 'Food', players: ['Riya', 'Arjun'] });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t2 + 3000, () => 60),
      ...every16(t3 + 16, t3 + 2400, (t) => (t - t3 < 1500 ? 0 : -45)),
    ]);
    await page.clock.runFor(3000 + 2400);
    const recs = (await onlyNight(page)).records.filter((r: any) => r.move.type === 'got' || r.move.type === 'pass');
    expect(recs.map((r: any) => [r.move.type, r.at - t3])).toEqual([['got', 1664]]);
  });

  test('a turn in hands-free hold ignores every phone movement; taps still mark', async ({ page }) => {
    await startNight(page, { seed: 'free-motion', pack: 'Food', players: ['Riya', 'Arjun'], hold: 'free' });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t2 + 3000, () => 0),
      ...every16(t3 + 16, t3 + 2000, (t) => (t - t3 < 1000 ? -60 : 60)),
    ]);
    await page.clock.runFor(3000 + 2000);
    expect(await markMoves(page)).toEqual([]);
    await tapAt(page, 406, 300);
    await page.clock.runFor(600);
    expect((await markMoves(page)).map((m) => m.type)).toEqual(['got']);
  });
});

test.describe('WAI-023: time up', () => {
  test('time up records timeUp with the word on screen as passed; T4 lists it last under Passed', async ({ page }) => {
    await startNight(page, { seed: 'time-up', pack: 'Food', players: ['Riya', 'Arjun'], turnTime: 30 });
    const t3 = await toWord(page);
    const [a] = await marks(page, 'G');
    const last = await shownWord(page);
    await runToTimeUp(page, t3, 30);
    const m = (await moves(page)).filter((x) => x.type !== 'start');
    expect(m.at(-1)).toEqual({ type: 'timeUp', word: idOf(last) });
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    expect(await chipNames(page, 'Got it')).toEqual([a]);
    expect(await chipNames(page, 'Passed')).toEqual([last]);
  });

  test('time up during a flash: the mark stands, no word is passed (Version 1.1 item 14)', async ({ page }) => {
    await startNight(page, { seed: 'time-up-flash', pack: 'Food', players: ['Riya', 'Arjun'], turnTime: 30 });
    const t3 = await toWord(page);
    await page.clock.runFor(30000 - 300 - ((await now(page)) - t3));
    const w = await shownWord(page);
    await tapAt(page, 406, 300);
    await page.clock.runFor(400);
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    const m = (await moves(page)).filter((x) => x.type === 'got' || x.type === 'timeUp');
    expect(m).toEqual([{ type: 'got', word: idOf(w) }, { type: 'timeUp' }]);
  });
});

test.describe('WAI-030 / WAI-031: fixing, saving and Undo on screen', () => {
  test('a word tapped on T4 moves with ↺ and records fix; Save score records scoreTurn; Undo records undoScore and reopens T4 as it was', async ({ page }) => {
    await startNight(page, { seed: 'fix-save', pack: 'Food', players: ['Riya', 'Arjun'], turnTime: 30 });
    const t3 = await toWord(page);
    const [a, b] = await marks(page, 'GG');
    await runToTimeUp(page, t3, 30);
    await listChips(page, 'Got it').filter({ hasText: a! }).click();
    expect(await chipNames(page, 'Got it')).toEqual([b]);
    expect((await chipNames(page, 'Passed')).at(-1)).toBe(`${a} ↺`);
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    await saveScore(page);
    await expect(toast(page)).toContainText('Riya: 1 saved');
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    expect((await chipNames(page, 'Passed')).at(-1)).toBe(`${a} ↺`);
    const types = (await moves(page)).map((m) => m.type);
    expect(types.slice(-3)).toEqual(['fix', 'scoreTurn', 'undoScore']);
  });
});

test.describe('WAI-092: the saved game night', () => {
  test('saved as it happens with a format version, gameType what-am-i, seeds.words, and each shown word\'s id', async ({ page }) => {
    await startNight(page, { seed: 'saved', pack: 'Jobs', players: ['Riya', 'Arjun'], turnTime: 30 });
    const t3 = await toWord(page);
    await marks(page, 'GP');
    await runToTimeUp(page, t3, 30);
    await saveScore(page);
    const night = await onlyNight(page);
    expect(night.format).toBeGreaterThanOrEqual(1);
    expect(night.gameType).toBe('what-am-i');
    expect(night.setup.seeds).toEqual({ words: 'saved' });
    const shown = night.records.filter((r: any) => ['got', 'pass', 'timeUp'].includes(r.move.type) && r.move.word);
    expect(shown).toHaveLength(3);
    for (const r of shown) expect(byId.get(r.move.word)?.pack).toBe('Jobs');
    expect(night.records.map((r: any) => r.move.type)).toEqual(['start', 'got', 'pass', 'timeUp', 'scoreTurn']);
    await expect(mainButton(page)).toBeVisible();
  });
});
