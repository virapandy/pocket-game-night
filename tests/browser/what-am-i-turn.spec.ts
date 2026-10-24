// What Am I? a turn on screen (specs/what-am-i/02-words.md WAI-011; 03-turn.md WAI-012 to WAI-016, WAI-020, WAI-022,
// WAI-024, WAI-025), scenarios version 1.3 with the Version 1.1 to 1.3 items each scenario carries.
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import { EXAMPLE_SEED, EXAMPLE_WORDS } from '../games/what-am-i/oracle';
import {
  SIDEWAYS, TZ, UPRIGHT, WORDS, box, button, dialog, every16, fromMenu, heading, mainButton, marks, moves, now,
  pauseButton, permissionCalls, playTurn, runToTimeUp, saveScore, scheduleOrientation, setSwitch, soundLog, startNight, startTurn,
  switchNamed, tap, tapAt, text, theWord, timeLeft, tipLine, toWord, wakeLog, type WaiWord,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

const TWO = ['Riya', 'Arjun'];
const animals = (n: number) => WORDS.filter((w) => w.pack === 'Animals').slice(0, n);
const food = (n: number) => WORDS.filter((w) => w.pack === 'Food' && !w.nonveg).slice(0, n);
/** Plays every remaining turn of the round with one Got it each (30 s turns), ending on R1 or the next T1. */
async function saveTurns(page: Page, k: number) { for (let i = 0; i < k; i++) { await playTurn(page, 'G'); await saveScore(page); } }

test.describe('WAI-012: the pass screen', () => {
  test('hand hold: h1, hold line, rule line, score line, quiet buttons, Pause and Menu; no "Players (6) ›" (Version 1.1 item 50)', async ({ page }) => {
    await startNight(page, { seed: 'pass', pack: 'mix' });
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    await expect(text(page, 'Hold the phone on your forehead or chest, screen facing the room.')).toBeVisible();
    await expect(text(page, 'Phone down: Got it · Phone up: Pass')).toBeVisible();
    await expect(text(page, 'Round 1 · player 1 of 6')).toBeVisible();
    for (const q of ['Hands-free for Riya', 'Someone else goes first', '← Home (game saved)']) await expect(button(page, q)).toBeVisible();
    await expect(pauseButton(page)).toBeVisible();
    await expect(button(page, 'Menu')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Players \(/ })).toHaveCount(0);
    await expect(mainButton(page)).toHaveText("I'm Riya: start");
  });

  test('the main button ignores a tap for 1000 ms and keeps its live look (Terms: Guard, Version 1.3 item 11)', async ({ page }) => {
    await startNight(page, { seed: 'guard-1000', players: TWO, turnTime: 30 });
    await tap(page, mainButton(page)); // start Riya's turn
    await page.clock.runFor(3000 + 30000);
    await expect(heading(page, /^Time's up!/)).toBeVisible();
    await tap(page, mainButton(page)); // Save score → Arjun's T1
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
    const look = await mainButton(page).evaluate((e) => ({ o: getComputedStyle(e).opacity, d: (e as HTMLButtonElement).disabled }));
    await page.clock.runFor(999);
    await mainButton(page).click({ force: true }); // the guard is invisible: the tap really lands (Version 1.3 item 11)
    await page.clock.runFor(0);
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
    expect(look).toEqual({ o: '1', d: false });
    await expect(mainButton(page)).not.toHaveAttribute('aria-disabled', 'true');
    await page.clock.runFor(1);
    await mainButton(page).click();
    await expect(page.getByTestId('countdown')).toBeVisible();
  });

  test('Settings "Answer by moving the phone" off: the rule line reads "Tap bottom: Got it · Tap top: Pass"', async ({ page }) => {
    await startNight(page, { seed: 'taps-line', players: TWO });
    await fromMenu(page, 'Settings');
    await setSwitch(page, 'Answer by moving the phone', false);
    await tap(page, button(page, 'Done'));
    await expect(text(page, 'Tap bottom: Got it · Tap top: Pass')).toBeVisible();
    await expect(text(page, 'Phone down: Got it · Phone up: Pass')).toHaveCount(0);
  });

  test('hands-free game: standing line, rule line, "Riya will hold it", main "Start Riya\'s turn"', async ({ page }) => {
    await startNight(page, { seed: 'free', hold: 'free', players: TWO });
    await expect(text(page, "Stand the phone behind Riya, facing the room. Riya, don't turn round!")).toBeVisible();
    await expect(text(page, 'One clue giver taps: bottom half Got it · top half Pass')).toBeVisible();
    await expect(button(page, 'Riya will hold it')).toBeVisible();
    await expect(mainButton(page)).toHaveText("Start Riya's turn");
    await expect(text(page, "Hands-free (Riya's choice)")).toHaveCount(0);
  });

  test('Version 1.1 item 31 / Version 1.2 item 3: "player k of n" counts saved turns this round plus current players still to play', async ({ page }) => {
    await startNight(page, { seed: 'k-of-n', players: ['Riya', 'Arjun', 'Meena', 'Kabir'], turnTime: 30 });
    await saveTurns(page, 1);
    await expect(text(page, 'Round 1 · player 2 of 4')).toBeVisible();
    await fromMenu(page, 'Players');
    await page.getByLabel('Player name', { exact: true }).fill('Om');
    await button(page, 'Add').click();
    await tap(page, button(page, 'Done'));
    await expect(text(page, 'Round 1 · player 2 of 5')).toBeVisible();
    await fromMenu(page, 'Players');
    await button(page, 'Remove Kabir').click();
    await tap(page, dialog(page, 'Kabir has to leave?').getByRole('button', { name: 'Kabir leaves', exact: true }));
    await tap(page, button(page, 'Done'));
    await expect(text(page, 'Round 1 · player 2 of 4')).toBeVisible();
  });
});

test.describe('WAI-011: tip lines on T1 (at most one, the first that applies)', () => {
  test('2: "Only 10 new Animals words left. After that, words come from Mix of all." (1–14 unshown); one word: "Only 1 new Animals word left. …"', async ({ page }) => {
    await startNight(page, { seed: 'tip-2', words: [...animals(10), ...food(5)], pack: 'Animals', players: TWO, turnTime: 30 });
    await expect(tipLine(page)).toHaveText('Only 10 new Animals words left. After that, words come from Mix of all.');
    await expect(tipLine(page)).toHaveCount(1);
    await playTurn(page, 'GGGGGGGG'); // eight marked plus the word on screen at time up (WAI-023: shown): nine of ten shown
    await saveScore(page);
    await expect(tipLine(page)).toHaveText('Only 1 new Animals word left. After that, words come from Mix of all.');
  });

  test('2b (Version 1.1 item 7): "Animals words used up. Words now come from Mix of all." while the fallback supplies words', async ({ page }) => {
    await startNight(page, { seed: 'tip-2b', words: [...animals(3), ...food(10)], pack: 'Animals', players: TWO, turnTime: 30 });
    await playTurn(page, 'GGGG'); // three Animals, then a Mix word
    await saveScore(page);
    await expect(tipLine(page)).toHaveText('Animals words used up. Words now come from Mix of all.');
  });

  test('3: "All words used tonight. Words from earlier games come back, oldest first." (the worked example, Version 1.1 item 6)', async ({ page }) => {
    await startNight(page, { seed: EXAMPLE_SEED, words: EXAMPLE_WORDS, pack: 'Animals', players: TWO, turnTime: 30 });
    const t3 = await toWord(page);
    await marks(page, 'GPGGG');
    // WAI-010 (orchestrator's call, 25 October 2026): a word never comes back within the same turn. All five words are
    // shown, so time up comes at once when the fifth mark's flash ends, with no word on screen, long before 30 s.
    expect((await now(page)) - t3).toBeLessThan(30000);
    await expect(heading(page, /^Time's up!/)).toBeVisible();
    expect((await moves(page)).at(-1)).toEqual({ type: 'timeUp' });
    expect((await soundLog(page)).filter((e) => e.kind === 'sound' && e.name === 'timeUp')).toHaveLength(1);
    await saveScore(page);
    await expect(tipLine(page)).toHaveText('All words used tonight. Words from earlier games come back, oldest first.');
  });

  test('1 first: "Joining this round: Om" wins over the words tip; gone once Om has played', async ({ page }) => {
    await startNight(page, { seed: 'tip-1', words: [...animals(12), ...food(12)], pack: 'Animals', players: TWO, turnTime: 30 });
    await fromMenu(page, 'Players');
    await page.getByLabel('Player name', { exact: true }).fill('Om');
    await button(page, 'Add').click();
    await tap(page, button(page, 'Done'));
    await expect(tipLine(page)).toHaveText('Joining this round: Om');
    await saveTurns(page, 2); // Riya, Arjun
    await expect(heading(page, "Om, you're guessing")).toBeVisible();
    await expect(tipLine(page)).toHaveText('Joining this round: Om');
    await saveTurns(page, 1);
    await expect(tipLine(page)).not.toHaveText('Joining this round: Om');
  });

  test('Version 1.2 item 9: the sound tip on the first turn of every game while Sounds is on; never on later turns; "ringer" never shows', async ({ page }) => {
    await startNight(page, { seed: 'tip-sound', pack: 'mix', players: TWO, turnTime: 30 });
    await expect(tipLine(page)).toHaveText('Turn the sound up so the guesser hears each word count.');
    await saveTurns(page, 1);
    await expect(tipLine(page)).toHaveCount(0);
    expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('ringer');
  });

  test('Sounds off: no sound tip', async ({ page }) => {
    await startNight(page, { seed: 'tip-quiet', pack: 'mix', players: TWO, sounds: false });
    await expect(tipLine(page)).toHaveCount(0);
  });

  test('Version 1.2 item 10: a refused wake lock → "Keep your screen on during the turn." on the next T1, once per game', async ({ page }) => {
    await startNight(page, { seed: 'tip-screen', pack: 'mix', players: TWO, wakeLock: 'refused', turnTime: 30 });
    await saveTurns(page, 1);
    await expect(tipLine(page)).toHaveText('Keep your screen on during the turn.');
    await saveTurns(page, 1);
    await expect(tipLine(page)).toHaveCount(0);
  });
});

test.describe('WAI-013: motion permission and the motion question (Version 1.1 item 16)', () => {
  test('requestPermission exists, first hand-hold turn: T0, then "Yes, move the phone" asks and opens T2; T0 never again', async ({ page }) => {
    await startNight(page, { seed: 't0', players: TWO, permission: 'granted' });
    await tap(page, mainButton(page));
    await expect(heading(page, 'Answer by moving the phone?')).toBeVisible();
    await expect(text(page, 'Move the phone down for Got it, up for Pass. Your phone will ask once. You can change this in Settings.')).toBeVisible();
    await expect(button(page, 'Use taps instead')).toBeVisible();
    await expect(mainButton(page)).toHaveText('Yes, move the phone');
    await tap(page, mainButton(page));
    await expect(page.getByTestId('countdown')).toBeVisible();
    expect(await permissionCalls(page)).toHaveLength(1);
    await page.clock.runFor(3000 + 60000);
    await saveScore(page);
    await tap(page, mainButton(page)); // Arjun
    await expect(page.getByTestId('countdown')).toBeVisible();
    await expect(heading(page, 'Answer by moving the phone?')).toHaveCount(0);
  });

  test('refused: T2 with taps only and the toast "Tap bottom: Got it · Tap top: Pass"; Settings explains', async ({ page }) => {
    await startNight(page, { seed: 't0-no', players: TWO, permission: 'refused' });
    await tap(page, mainButton(page));
    await tap(page, mainButton(page)); // Yes, move the phone
    await expect(page.getByTestId('countdown')).toBeVisible();
    await expect(text(page, 'Tap bottom: Got it · Tap top: Pass')).toBeVisible();
  });

  test('refused: no T0 later; under the Settings switch "Your phone said no. To use moving, allow motion for this site in the phone\'s settings."', async ({ page }) => {
    await startNight(page, { seed: 't0-no-2', players: TWO, permission: 'throws' });
    await tap(page, mainButton(page));
    await tap(page, mainButton(page));
    await page.clock.runFor(3000 + 60000);
    await saveScore(page);
    await expect(text(page, 'Tap bottom: Got it · Tap top: Pass')).toBeVisible(); // Arjun's rule line: taps only
    await fromMenu(page, 'Settings');
    await expect(text(page, "Your phone said no. To use moving, allow motion for this site in the phone's settings.")).toBeVisible();
  });

  test('"Use taps instead": T2 with taps only, and Settings "Answer by moving the phone" is off; turning it off and on asks again', async ({ page }) => {
    await startNight(page, { seed: 't0-taps', players: TWO, permission: 'granted' });
    await tap(page, mainButton(page));
    await tap(page, button(page, 'Use taps instead'));
    await expect(page.getByTestId('countdown')).toBeVisible();
    expect(await permissionCalls(page)).toHaveLength(0);
    await page.clock.runFor(3000 + 60000);
    await saveScore(page);
    await fromMenu(page, 'Settings');
    await expect(switchNamed(page, 'Answer by moving the phone')).toHaveAttribute('aria-checked', 'false');
    await setSwitch(page, 'Answer by moving the phone', true);
    await tap(page, button(page, 'Done'));
    await tap(page, mainButton(page)); // Arjun, hand hold
    await expect(heading(page, 'Answer by moving the phone?')).toBeVisible();
  });

  test('hands-free never shows T0', async ({ page }) => {
    await startNight(page, { seed: 't0-free', players: TWO, permission: 'granted', hold: 'free' });
    await tap(page, mainButton(page));
    await expect(page.getByTestId('countdown')).toBeVisible();
    expect(await permissionCalls(page)).toHaveLength(0);
  });

  test('no orientation event within 1 s of T2: the turn runs with taps only (later movement marks nothing), no message', async ({ page }) => {
    test.setTimeout(150_000); // about 245 scheduled orientation events, ~170 ms of real time each under `taskpolicy -b`
    await startNight(page, { seed: 'no-events', players: TWO });
    const t2 = await startTurn(page);
    await scheduleOrientation(page, every16(t2 + 1100, t2 + 5000, (t) => (t - t2 < 3000 ? 0 : -60)));
    await page.clock.runFor(5000);
    expect((await moves(page)).filter((m) => m.type === 'got' || m.type === 'pass')).toEqual([]);
    await tapAt(page, 195, 700);
    await page.clock.runFor(600);
    expect((await moves(page)).filter((m) => m.type === 'got')).toHaveLength(1);
  });
});

test.describe('WAI-014 / WAI-015: hold for one player, someone else goes first', () => {
  test('"Hands-free for Riya" records setHold, shows the hands-free T1 with "Hands-free (Riya\'s choice)"; kept on her next turn; "Riya will hold it" reverses', async ({ page }) => {
    await startNight(page, { seed: 'hold', players: TWO, turnTime: 30 });
    await tap(page, button(page, 'Hands-free for Riya'));
    await expect(mainButton(page)).toHaveText("Start Riya's turn");
    await expect(text(page, "Hands-free (Riya's choice)")).toBeVisible();
    expect((await moves(page)).at(-1)).toEqual({ type: 'setHold', player: 'Riya', hold: 'free' });
    await saveTurns(page, 2);
    await expect(mainButton(page)).toHaveText("Start Riya's turn");
    await tap(page, button(page, 'Riya will hold it'));
    await expect(mainButton(page)).toHaveText("I'm Riya: start");
    expect((await moves(page)).at(-1)).toEqual({ type: 'setHold', player: 'Riya', hold: 'hand' });
  });

  test('"Someone else goes first": "Who goes now?", name buttons only, "Keep Riya first"; tapping Meena records reorder and opens her T1', async ({ page }) => {
    await startNight(page, { seed: 'first' });
    await tap(page, button(page, 'Someone else goes first'));
    const d = page.getByRole('dialog');
    await expect(d.getByText('Who goes now?', { exact: true })).toBeVisible();
    await expect(d.getByRole('button', { name: /^Remove / })).toHaveCount(0);
    await expect(d.getByRole('button', { name: /^Move / })).toHaveCount(0);
    await expect(d.getByLabel('Player name')).toHaveCount(0);
    await expect(d.getByRole('button', { name: 'Keep Riya first', exact: true })).toBeVisible();
    await expect(d.getByRole('button', { name: 'Done', exact: true })).toHaveCount(0);
    await tap(page, d.getByRole('button', { name: 'Meena', exact: true }));
    await expect(heading(page, "Meena, you're guessing")).toBeVisible();
    expect((await moves(page)).at(-1)).toEqual({ type: 'reorder', order: ['Meena', 'Riya', 'Arjun', 'Kabir', 'Zoya', 'Dev'] });
  });

  test('"Keep Riya first" records nothing; only players still to play this round are offered', async ({ page }) => {
    await startNight(page, { seed: 'first-2', players: ['Riya', 'Arjun', 'Meena'], turnTime: 30 });
    await saveTurns(page, 1);
    await tap(page, button(page, 'Someone else goes first'));
    const d = page.getByRole('dialog');
    await expect(d.getByRole('button', { name: 'Riya', exact: true })).toHaveCount(0);
    await expect(d.getByRole('button', { name: 'Meena', exact: true })).toBeVisible();
    const before = (await moves(page)).length;
    await tap(page, d.getByRole('button', { name: 'Keep Arjun first', exact: true }));
    await expect(heading(page, "Arjun, you're guessing")).toBeVisible();
    expect((await moves(page)).length).toBe(before);
  });
});

test.describe('WAI-016: the countdown', () => {
  test('"3", "2", "1" each 1000 ms with a beep at 0, 1000, 2000 ms; the line; Pause; T3 at 3000 ms; wake lock asked at T2\'s start', async ({ page }) => {
    await startNight(page, { seed: 'count', players: TWO });
    const t2 = await startTurn(page);
    const c = page.getByTestId('countdown');
    await expect(c).toHaveText('3');
    await expect(text(page, 'Put it on your forehead or chest!')).toBeVisible();
    await expect(pauseButton(page)).toBeVisible();
    await page.clock.runFor(1000); await expect(c).toHaveText('2');
    await page.clock.runFor(1000); await expect(c).toHaveText('1');
    await page.clock.runFor(999); await expect(theWord(page)).toHaveCount(0);
    await page.clock.runFor(1); await expect(theWord(page)).toBeVisible();
    const beeps = (await soundLog(page)).filter((e) => e.kind === 'sound' && e.name === 'countdown').map((e) => e.t - t2);
    expect(beeps).toEqual([0, 1000, 2000]);
    const w = await wakeLog(page);
    expect(w[0]).toMatchObject({ kind: 'request', type: 'screen' });
    expect(w[0]!.t - t2).toBe(0);
  });

  test('hands-free: the line reads "Riya, don\'t turn round!"', async ({ page }) => {
    await startNight(page, { seed: 'count-free', players: TWO, hold: 'free' });
    await startTurn(page);
    await expect(text(page, "Riya, don't turn round!")).toBeVisible();
  });
});

test.describe('WAI-020: the word screen', () => {
  test.use({ viewport: SIDEWAYS });

  test('top line "Everyone else: give clues. Don\'t say the word!" (Version 1.3 item 1); the word in an h1, bold, CAPITALS by CSS; pack name; time; Pause 48 × 48 at 16 px from top and right', async ({ page }) => {
    await startNight(page, { seed: 'word', pack: 'Animals', players: TWO });
    await toWord(page);
    await expect(text(page, "Everyone else: give clues. Don't say the word!")).toBeVisible();
    const w = await theWord(page).evaluate((el) => ({ h1: el.tagName === 'H1' || !!el.closest('h1'), tt: getComputedStyle(el).textTransform, fw: Number(getComputedStyle(el).fontWeight) }));
    expect(w).toEqual({ h1: true, tt: 'uppercase', fw: w.fw });
    expect(w.fw).toBeGreaterThanOrEqual(700);
    await expect(text(page, 'Animals')).toBeVisible();
    const p = await box(pauseButton(page));
    expect(p.width).toBeGreaterThanOrEqual(48);
    expect(p.height).toBeGreaterThanOrEqual(48);
    expect(Math.round(p.y)).toBe(16);
    expect(Math.round(812 - (p.x + p.width))).toBe(16);
    await expect(pauseButton(page)).toContainText('Pause');
  });

  test('hands-free top line: "Clue givers: tap bottom for Got it, top for Pass."', async ({ page }) => {
    await startNight(page, { seed: 'word-free', players: TWO, hold: 'free' });
    await toWord(page);
    await expect(text(page, 'Clue givers: tap bottom for Got it, top for Pass.')).toBeVisible();
  });

  test('Version 1.1 item 19: time-left shows ⌈(T − t)/1000⌉ as m:ss: "1:00" at 0 ms, "1:00" at 999, "0:59" at 1000, "0:01" at 59 999; "0:00" only as time up fires', async ({ page }) => {
    await startNight(page, { seed: 'clock', players: TWO, turnTime: 60 });
    await toWord(page);
    await expect(timeLeft(page)).toHaveText('1:00');
    await page.clock.runFor(999); await expect(timeLeft(page)).toHaveText('1:00');
    await page.clock.runFor(1); await expect(timeLeft(page)).toHaveText('0:59');
    await page.clock.runFor(26000); await expect(timeLeft(page)).toHaveText('0:33');
    await page.clock.runFor(32999); await expect(timeLeft(page)).toHaveText('0:01');
    await page.clock.runFor(1);
    await expect(heading(page, /^Time's up!/)).toBeVisible();
  });

  test('Version 1.3 item 9: time-left 28 px bold; pack name 18 px (22 px with Larger text)', async ({ page }) => {
    for (const larger of [false, true]) {
      await startNight(page, { seed: `sizes-${larger}`, pack: 'Animals', players: TWO, larger });
      await toWord(page);
      const t = await timeLeft(page).evaluate((e) => ({ fs: getComputedStyle(e).fontSize, fw: Number(getComputedStyle(e).fontWeight) }));
      expect(t.fs).toBe('28px');
      expect(t.fw).toBeGreaterThanOrEqual(700);
      expect(await text(page, 'Animals').evaluate((e) => getComputedStyle(e).fontSize)).toBe(larger ? '22px' : '18px');
    }
  });

  for (const size of [{ width: 812, height: 375 }, { width: 568, height: 320 }]) {
    test(`Version 1.1 item 23 at ${size.width} × ${size.height}: the word size is 40–96 px in 2 px steps and fits in 2 lines; the 22-character word fits at 40 px`, async ({ page }) => {
      const longest = WORDS.reduce((a, b) => (b.word.length > a.word.length ? b : a));
      expect(longest.word.length).toBe(22);
      const list: WaiWord[] = [longest, WORDS.find((w) => w.word === 'Owl')!];
      await startNight(page, { seed: 'fit', words: list, pack: 'mix', players: TWO, viewport: size });
      await toWord(page);
      for (let i = 0; i < 2; i++) {
        const m = await theWord(page).evaluate((el) => {
          const fs = parseFloat(getComputedStyle(el).fontSize);
          const lh = parseFloat(getComputedStyle(el).lineHeight) || fs * 1.2;
          const r = el.getBoundingClientRect();
          return { fs, lines: Math.round(r.height / lh), right: r.right, w: window.innerWidth, sw: el.scrollWidth, cw: el.clientWidth, text: el.textContent };
        });
        expect(m.fs).toBeGreaterThanOrEqual(40);
        expect(m.fs).toBeLessThanOrEqual(96);
        expect(m.fs % 2).toBe(0);
        expect(m.lines).toBeLessThanOrEqual(2);
        expect(m.right).toBeLessThanOrEqual(m.w);
        expect(m.sw).toBeLessThanOrEqual(m.cw + 1);
        if (m.text === 'Owl') expect(m.fs).toBe(96);
        await page.clock.runFor(800);
        await tapAt(page, size.width / 2, size.height * 0.8);
        await page.clock.runFor(600);
      }
    });
  }
});

test.describe('WAI-022: sounds and vibration (WAI-H8, Version 1.1 item 18)', () => {
  test.use({ viewport: SIDEWAYS });

  test('Sounds on: got and pass sounds with their vibrations; ticks at T − 10 000, −9 900, −9 800, then each second to T − 1 000; no tick at T; the time-up tone and 400 ms buzz at T', async ({ page }) => {
    await startNight(page, { seed: 'sounds', players: TWO, turnTime: 30 });
    const t3 = await toWord(page);
    await marks(page, 'GP');
    await runToTimeUp(page, t3, 30);
    const log = (await soundLog(page)).map((e) => ({ ...e, t: e.t - t3 }));
    const sounds = log.filter((e) => e.kind === 'sound' && e.name !== 'countdown');
    expect(sounds.map((e) => [e.name, e.t])).toEqual([
      ['got', 800], ['pass', 2200],
      ['tick', 20000], ['tick', 20100], ['tick', 20200],
      ...[21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000].map((t) => ['tick', t]),
      ['timeUp', 30000],
    ]);
    const canVibrate = await page.evaluate(() => typeof navigator.vibrate === 'function');
    if (canVibrate) {
      expect(log.filter((e) => e.kind === 'vibrate').map((e) => [e.pattern, e.t])).toEqual([[[40], 800], [[40, 60, 40], 2200], [[400], 30000]]);
    }
  });

  test('Sounds off: no sound at all; the vibrations stay', async ({ page }) => {
    await startNight(page, { seed: 'quiet', players: TWO, turnTime: 30, sounds: false });
    const t3 = await toWord(page);
    await marks(page, 'G');
    await runToTimeUp(page, t3, 30);
    const log = await soundLog(page);
    expect(log.filter((e) => e.kind === 'sound')).toEqual([]);
    if (await page.evaluate(() => typeof navigator.vibrate === 'function')) {
      expect(log.filter((e) => e.kind === 'vibrate').map((e) => e.pattern)).toEqual([[40], [400]]);
    }
  });
});

test.describe('WAI-024: rotation lock (Version 1.1 item 21; Version 1.2 item 11)', () => {
  test('held sideways (|γ| ≥ 60 for 500 ms) while the screen says portrait: T3 is drawn turned 90°; it turns back after 500 ms with |γ| < 45', async ({ page }) => {
    test.setTimeout(150_000); // about 375 scheduled orientation events, ~170 ms of real time each under `taskpolicy -b`
    await startNight(page, { seed: 'rotate', words: [WORDS.find((w) => w.word === 'Owl')!, WORDS.find((w) => w.word === 'Tiger')!], pack: 'mix', players: TWO, orientationType: 'portrait-primary' });
    const t2 = await startTurn(page);
    const t3 = t2 + 3000;
    await scheduleOrientation(page, [
      ...every16(t2 + 16, t3 + 1000, () => 0).map((e) => ({ ...e, gamma: 0, beta: 90 })),
      ...every16(t3 + 1000, t3 + 2000, () => 0).map((e) => ({ t: e.t, gamma: 75, beta: 0 })),
      ...every16(t3 + 2000, t3 + 3000, () => 0).map((e) => ({ t: e.t, gamma: 10, beta: 80 })),
    ]);
    await page.clock.runFor(3000 + 900);
    const flat = await box(theWord(page));
    expect(flat.width).toBeGreaterThan(flat.height);
    await page.clock.runFor(700); // sideways from 1000, turned after 1500
    const turned = await box(theWord(page));
    expect(turned.height).toBeGreaterThan(turned.width);
    await page.clock.runFor(1200); // upright again from 2000, back after 2500
    const back = await box(theWord(page));
    expect(back.width).toBeGreaterThan(back.height);
  });

  test('a rotation-lock event shows "Screen not turning? Turn on Auto-rotate." (Android) on the first turn of a later game; iPhone: "…Turn off rotation lock."', async ({ page }) => {
    test.setTimeout(240_000); // two nights of about 310 scheduled orientation events each, ~170 ms of real time per event under `taskpolicy -b`
    for (const platform of ['android', 'iphone'] as const) {
      await startNight(page, { seed: `rot-${platform}`, players: TWO, orientationType: 'portrait-primary', platform, sounds: false, turnTime: 30 });
      const t2 = await startTurn(page);
      await scheduleOrientation(page, every16(t2 + 16, t2 + 3000 + 2000, () => 0).map((e) => ({ t: e.t, gamma: 75, beta: 0 })));
      await page.clock.runFor(3000 + 30000);
      await saveScore(page);
      await fromMenu(page, 'End the game');
      await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
      await tap(page, mainButton(page)); // Play again
      await expect(tipLine(page)).toHaveText(platform === 'android' ? 'Screen not turning? Turn on Auto-rotate.' : 'Screen not turning? Turn off rotation lock.');
    }
  });
});

test.describe('WAI-025: the screen stays awake', () => {
  test('requested at T2, released on T4; released on Pause and asked again on Carry on playing', async ({ page }) => {
    await startNight(page, { seed: 'awake', players: TWO, turnTime: 30 });
    const t3 = await toWord(page);
    await page.clock.runFor(1000);
    await pauseButton(page).click();
    await tap(page, button(page, 'Carry on playing'));
    await page.clock.runFor(3000); // the countdown again; 29 000 ms of the turn are left
    await page.clock.runFor(29000);
    await expect(heading(page, /^Time's up!/)).toBeVisible();
    await page.clock.runFor(100);
    const kinds = (await wakeLog(page)).map((e) => e.kind);
    expect(kinds).toEqual(['request', 'release', 'request', 'release']);
    expect(await now(page)).toBeGreaterThan(t3);
  });

  test('refused or missing: the turn goes on', async ({ page }) => {
    for (const wakeLock of ['refused', 'missing'] as const) {
      await startNight(page, { seed: `awake-${wakeLock}`, players: TWO, wakeLock, turnTime: 30 });
      const t3 = await toWord(page);
      await marks(page, 'G');
      await runToTimeUp(page, t3, 30);
      await expect(heading(page, "Time's up! Riya got 1")).toBeVisible();
    }
  });
});

