// Impostor round 5 (scenarios v3.8; owner decisions I25 and I26, 4 October 2026; docs/room-moments.md): the new
// behaviour that no earlier test covers. Lane O: setup, deal, clues, talk, picker and the double-tap guard; lane N: the
// result, between rounds, the end screen, History and Home's resume rows; C3: people leaving and arriving mid-round.
// Changed wording and changed screens of earlier scenarios are tested in the files that already covered them.
// Every test here is written before its lane is built: each calls `aheadOfRound5` (expected to fail) until then.
import { expect, test, type Page } from './fixtures';
import { HOME, expectOneMainButton, hostAGame, isOutlined, openHistory } from './helpers';
import {
  CLUES_DONE, P4, P5, PANI_PURI, SAMOSA, T0, TZ, WORDS, aheadOfRound5, dealAll, doneButton, exact, freezeClock, fromMenu,
  hold, holdPad, imButton, impostorCard, mainButton, onlyEvening, passName, phoneWith, pickerName, playerField, press,
  release, reveal, roundMoves, savedEvening, settle, startEvening, textOf, toPicker, turn, type Move,
} from './impostor';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const START: Move = { type: 'startDeal', practice: false };
const DEAL = { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' };
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const records = async (page: Page) => (await onlyEvening(page)).records.map((r: any) => r.move);
const fontSize = (page: Page, testId: string) => page.getByTestId(testId).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
/** The box of an element even while it is `visibility: hidden` (a reserved space). */
const rect = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const notRiyaBack = (page: Page, name = 'Riya') => page.getByRole('button', { name: `Not ${name}? ← Back`, exact: true });

/** A saved game reopened on its first round's result (4 players, caught with a wrong guess). */
async function atRound1Result(page: Page, o: { players?: string[]; practice?: boolean; score?: boolean } = {}) {
  const players = o.players ?? P4;
  const moves = roundMoves(players, 'Arjun', { caught: 'wrong' }, o.practice ? { type: 'startDeal', practice: true } : START);
  const e = savedEvening({ players, deals: [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }], moves, choices: { score: !!o.score } });
  await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  await expect(row.or(mainButton(page)).first()).toBeVisible();
  if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
  await expect(page.getByTestId('round-outcome')).toBeVisible();
  return e;
}

// ================================================================ Lane O

test.describe('Lane O: IMP-003 fast Enter (M3)', () => {
  test('typing "Zoya", Enter, "Dev", Enter within 200 ms adds both, in that order; the field is empty and keeps focus', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await hostAGame(page).click();
    await impostorCard(page).click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await playerField(page).click();
    await page.keyboard.type('Zoya', { delay: 0 });
    await page.keyboard.press('Enter');
    await page.keyboard.type('Dev', { delay: 0 });
    await page.keyboard.press('Enter');
    const names = await page.getByRole('button', { name: /^Remove / }).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    expect(names).toEqual(['Remove Zoya', 'Remove Dev']);
    await expect(playerField(page)).toHaveValue('');
    await expect(playerField(page)).toBeFocused();
  });
});

test.describe('Lane O: IMP-010 screen B (v3.8): "Tap instead" under the name; "Not Riya? ← Back" under the pad', () => {
  for (const [w, h] of [[320, 568], [360, 640], [390, 844]] as const) {
    test(`${w} × ${h}: "Tap instead" directly under the name, at least 48 px from the main button's space; "Not Riya? ← Back" directly under the pad`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await startEvening(page, { seeds: { deals: [DEAL] } });
      await settle(page);
      await imButton(page, 'Riya').click();
      const name = (await passName(page).boundingBox())!, tap = (await quiet(page, 'Tap instead').boundingBox())!;
      const pad = (await holdPad(page).boundingBox())!, back = (await notRiyaBack(page).boundingBox())!;
      // Terms, "Main button": 60 px tall, fixed at the bottom with 16 px below; its space is reserved on screen B.
      const main = { y: h - 16 - 60 };
      expect(tap.y, '"Tap instead" under the name').toBeGreaterThanOrEqual(name.y + name.height - 1);
      expect(tap.y - (name.y + name.height), 'directly under (8 px gap)').toBeLessThanOrEqual(12);
      expect(main.y - (tap.y + tap.height), '"Tap instead" at least 48 px from the main button\'s space').toBeGreaterThanOrEqual(48);
      expect(back.y, '"Not Riya? ← Back" under the pad').toBeGreaterThanOrEqual(pad.y + pad.height - 1);
      expect(back.y - (pad.y + pad.height), 'directly under (8 px gap)').toBeLessThanOrEqual(12);
      expect(back.y + back.height, 'above the main button\'s space').toBeLessThanOrEqual(main.y + 1);
    });
  }

  test('before the first hold "Not Riya? ← Back" returns to screen A of the same player; nothing recorded; after the first hold it is hidden, its space kept', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    const before = await records(page);
    await settle(page);
    await imButton(page, 'Riya').click();
    await settle(page);
    await notRiyaBack(page).click();
    await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Riya'));
    expect(await records(page)).toEqual(before);
    await settle(page);
    await imButton(page, 'Riya').click();
    const space = await rect(page, `button:has-text("Not Riya? ← Back")`);
    await hold(page, 600);
    await expect(notRiyaBack(page)).toBeHidden();
    const after = await page.getByText('Not Riya? ← Back', { exact: true }).evaluateAll((els) => els.map((el) => ({ v: getComputedStyle(el.closest('button') ?? el).visibility, y: el.getBoundingClientRect().y })));
    if (after.length) expect(after[0]!.v, 'hidden with visibility: hidden (its space kept)').toBe('hidden');
    const pad = (await holdPad(page).boundingBox())!;
    expect(pad.y + pad.height, 'nothing on screen B moved').toBeLessThanOrEqual(space.y + 1);
  });

  test('at 812 × 375: "Tap instead" and "Don\'t know this word?" under the name on the left; the pad, "Not Riya? ← Back" and "Done…" on the right', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await settle(page);
    await imButton(page, 'Riya').click();
    expect((await quiet(page, 'Tap instead').boundingBox())!.x + (await quiet(page, 'Tap instead').boundingBox())!.width, '"Tap instead" on the left').toBeLessThanOrEqual(406 + 1);
    expect((await notRiyaBack(page).boundingBox())!.x, '"Not Riya? ← Back" on the right').toBeGreaterThanOrEqual(406 - 1);
    expect((await holdPad(page).boundingBox())!.x, 'the pad on the right').toBeGreaterThanOrEqual(406 - 1);
  });
});

test.describe('Lane O: IMP-010 the 500 ms double-tap guard (M18, guideline 20)', () => {
  test('a second tap on "Done…" within 500 ms never skips "Pass the phone to ARJUN"; at 500 ms "I\'m Arjun" works; nothing extra recorded', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await freezeClock(page);
    await page.clock.runFor(500);
    await imButton(page, 'Riya').click();
    await press(page);
    await page.clock.runFor(600);
    await release(page);
    await doneButton(page).click();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    // The double tap: the same place, at once (a fake clock: no app time passes).
    await mainButton(page).click();
    await expect(page.getByText('Pass the phone to', { exact: true }), 'still screen A of Arjun').toBeVisible();
    await expect(holdPad(page)).toHaveCount(0);
    expect((await records(page)).filter((m: any) => m.type === 'seen')).toHaveLength(1);
    await page.clock.runFor(499);
    await mainButton(page).click();
    await expect(holdPad(page), 'still guarded at 499 ms').toHaveCount(0);
    await page.clock.runFor(1);
    await imButton(page, 'Arjun').click();
    await expect(holdPad(page)).toBeVisible();
  });

  test('the pad is not guarded: a press within 500 ms of screen B showing works as at any other time', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await freezeClock(page);
    await page.clock.runFor(500);
    await imButton(page, 'Riya').click();
    await press(page);
    await page.clock.runFor(500);
    await release(page);
    await expect(doneButton(page)).toBeVisible();
  });
});

test.describe('Lane O: IMP-017 "See my word again" visible on clues and talk (M19, M22c)', () => {
  test('the clues screen has the quiet "See my word again"; it opens "Whose word?"; Meena\'s screen B has no "Not Meena? ← Back" and no "Don\'t know this word?"', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    const btn = quiet(page, 'See my word again');
    await expect(btn).toBeVisible();
    expect(await isOutlined(btn)).toBe(true);
    await btn.click();
    const dialog = page.getByRole('dialog', { name: /Whose word\?/ });
    expect(await textOf(dialog.getByRole('button'))).toEqual([...P4, 'Cancel']);
    await dialog.getByRole('button', { name: 'Meena', exact: true }).click();
    await settle(page);
    await imButton(page, 'Meena').click();
    await expect(notRiyaBack(page, 'Meena')).toHaveCount(0);
    await hold(page, 600);
    await expect(page.getByRole('button', { name: "Don't know this word?", exact: true })).toBeHidden();
    await expect(mainButton(page)).toHaveText(exact('Done, back to clues', []));
  });

  test('the talk screen (Free flow and Timer) has the quiet "See my word again"; from talk her button reads "Done, back to talking"; from the picker (menu) "Done, back to the vote"', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await quiet(page, 'See my word again').click();
    await page.getByRole('dialog', { name: /Whose word\?/ }).getByRole('button', { name: 'Kabir', exact: true }).click();
    await settle(page);
    await imButton(page, 'Kabir').click();
    await hold(page, 600);
    await expect(mainButton(page)).toHaveText(exact('Done, back to talking', []));
    await mainButton(page).click();
    await expect(page.getByTestId('talk-heading')).toBeVisible();
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await fromMenu(page, 'See my word again');
    await page.getByRole('dialog', { name: /Whose word\?/ }).getByRole('button', { name: 'Riya', exact: true }).click();
    await settle(page);
    await imButton(page, 'Riya').click();
    await hold(page, 600);
    await expect(mainButton(page)).toHaveText(exact('Done, back to the vote', []));
  });

  test('Timer: the talk screen has the quiet "See my word again" under the timer', async ({ page }) => {
    await startEvening(page, { talking: 'timer', seeds: { deals: [DEAL] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await expect(page.getByTestId('timer')).toBeVisible();
    await expect(quiet(page, 'See my word again')).toBeVisible();
  });
});

test.describe('Lane O: IMP-020 the clues screen at 812 × 375 and 320 × 568 (v3.8)', () => {
  const DEAL5 = { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] };

  test('812 × 375: "Go round again" and "See my word again" share one row (two equal halves) in the right half; no "Not enough clues?"', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    const g = (await quiet(page, 'Go round again').boundingBox())!, s = (await quiet(page, 'See my word again').boundingBox())!;
    expect(Math.abs(g.y - s.y), 'one row').toBeLessThanOrEqual(1);
    expect(Math.abs(g.width - s.width), 'equal halves').toBeLessThanOrEqual(1);
    expect(Math.min(g.x, s.x), 'in the right half').toBeGreaterThanOrEqual(406 - 1);
    await expect(page.getByText('Not enough clues?', { exact: true })).toHaveCount(0);
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
  });

  test('320 × 568: MEENA, "starts", one box (scrolling inside) with the three lines and the clue order, then "Not enough clues?", then "Go round again" and "See my word again" on one row, then the main button; no page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await startEvening(page, { players: P5, seeds: DEAL5 });
    await dealAll(page, P5);
    const order = [page.getByTestId('starter-name'), page.getByText('starts', { exact: true }), page.getByText('✓ Everyone has seen their word.', { exact: true }),
      page.getByTestId('clue-order'), page.getByText('Not enough clues?', { exact: true }), quiet(page, 'Go round again'), mainButton(page)];
    let last = -Infinity;
    for (const [i, l] of order.entries()) { const b = (await l.boundingBox())!; expect(b.y, `part ${i + 1} below the one above`).toBeGreaterThanOrEqual(last - 1); last = b.y + b.height; }
    const g = (await quiet(page, 'Go round again').boundingBox())!, s = (await quiet(page, 'See my word again').boundingBox())!;
    expect(Math.abs(g.y - s.y), 'one row').toBeLessThanOrEqual(1);
    const scrolls = await page.evaluate(() => document.scrollingElement!.scrollHeight > window.innerHeight + 1);
    expect(scrolls, 'no page scrolling').toBe(false);
  });
});

test.describe('Lane O: IMP-075 "Home (game is saved)" mid-round (M11)', () => {
  test('from the clues screen it opens Home at once, no dialog, nothing recorded; the game stays unfinished and reopens on the clues', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    const before = await records(page);
    await fromMenu(page, 'Home (game is saved)');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(hostAGame(page)).toBeVisible();
    expect(await records(page)).toEqual(before);
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    await expect(row).toContainText('Impostor · Riya, Arjun +2 · round 1');
    await row.getByText('Tap to resume').first().click();
    await expect(page.getByTestId('clue-order')).toHaveText(exact('Riya → Arjun → Meena → Kabir', P4));
  });
});

// ================================================================ Lane N

test.describe('Lane N: IMP-077 between rounds: "Next round", outlined "End game", "← Home"', () => {
  const ROW: [number, number, number | null][] = [[360, 640, 160], [390, 844, 175], [812, 375, 183]];
  for (const [w, h, each] of ROW) {
    test(`${w} × ${h}: one row, "End game" left and "Next round" right, ${each} px each, 60 px tall, 8 px apart, 16 px gutters and 16 px below`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await atRound1Result(page);
      const end = quiet(page, 'End game');
      const e = (await end.boundingBox())!, m = (await mainButton(page).boundingBox())!;
      expect(await isOutlined(end)).toBe(true);
      await expect(mainButton(page)).toHaveText(exact('Next round', []));
      expect(Math.abs(e.y - m.y), 'one row').toBeLessThanOrEqual(1);
      expect(e.x, '"End game" on the left').toBeLessThan(m.x);
      expect(Math.round(e.width)).toBe(each);
      expect(Math.round(m.width)).toBe(each);
      expect(Math.round(e.height)).toBe(60);
      expect(Math.round(m.height)).toBe(60);
      expect(Math.round(m.x - (e.x + e.width)), '8 px apart').toBe(8);
      expect(Math.round(w - (m.x + m.width)), '16 px from the right edge').toBe(16);
      expect(Math.round(h - (m.y + m.height)), '16 px from the bottom').toBe(16);
      if (w !== 812) expect(Math.round(e.x), '16 px from the left edge').toBe(16);
    });
  }

  test('320 × 568: "End game" full width (288 px), 48 px tall, 8 px above the full-width main button', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await atRound1Result(page);
    const e = (await quiet(page, 'End game').boundingBox())!, m = (await mainButton(page).boundingBox())!;
    expect(Math.round(e.width)).toBe(288);
    expect(Math.round(e.height)).toBe(48);
    expect(Math.round(m.width)).toBe(288);
    expect(Math.round(m.y - (e.y + e.height)), '8 px above the main button').toBe(8);
  });

  test('"← Home" at the top left opens Home; nothing recorded; the row reads "Impostor · Riya, Arjun +2 · round 2" with "Tap to resume", and resuming returns to the same result', async ({ page }) => {
    await atRound1Result(page);
    const before = await records(page);
    const home = quiet(page, '← Home');
    const b = (await home.boundingBox())!;
    expect(b.x).toBeLessThan(195);
    expect(b.y).toBeLessThan(100);
    await home.click();
    await expect(hostAGame(page)).toBeVisible();
    expect(await records(page)).toEqual(before);
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    await expect(row).toContainText('Impostor · Riya, Arjun +2 · round 2');
    await expect(row).toContainText('Tap to resume');
    await hostAGame(page).click();
    const card = page.getByTestId('resume-card');
    await expect(card).toContainText('Impostor · Riya, Arjun +2 · round 2');
    await expect(card).toContainText('Tap to resume');
    await card.click();
    await expect(page.getByTestId('round-outcome')).toBeVisible();
  });

  test('"← Home" and "End game" are never shown mid-round (deal, clues, talk, picker); the practice round\'s result has both', async ({ page }) => {
    await startEvening(page, { practice: true, seeds: { deals: [DEAL] } });
    await expect(quiet(page, '← Home')).toHaveCount(0);
    await expect(quiet(page, 'End game')).toHaveCount(0);
    await dealAll(page);
    await expect(quiet(page, '← Home')).toHaveCount(0);
    await expect(quiet(page, 'End game')).toHaveCount(0);
    await toPicker(page);
    await expect(quiet(page, 'End game')).toHaveCount(0);
    await reveal(page, 'Arjun');
    await expect(quiet(page, '← Home')).toBeVisible();
    await expect(quiet(page, 'End game')).toBeVisible();
  });

  test('a tap on "Next round" within 500 ms of the result lines appearing (t = 1.5 s) is ignored; at 500 ms it deals', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await toPicker(page);
    await freezeClock(page);
    await pickerName(page, 'Riya').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await expect(mainButton(page)).toHaveText(exact('Next round', []));
    await mainButton(page).click();
    await expect(passName(page), 'ignored within 500 ms').toHaveCount(0);
    await page.clock.runFor(500);
    await mainButton(page).click();
    await expect(passName(page)).toBeVisible();
  });
});

test.describe('Lane N: IMP-001 resume rows with names (M12)', () => {
  test('3 players: "Impostor · Riya, Arjun +1 · round 1" during the first round', async ({ page }) => {
    const players = ['Riya', 'Arjun', 'Meena'];
    const e = savedEvening({ players, deals: [DEAL], moves: [START, { type: 'seen' }] });
    await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
    await page.goto(HOME);
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toContainText('Impostor · Riya, Arjun +1 · round 1');
  });

  test('during round 2 the label carries that round\'s number; names in the current seat order', async ({ page }) => {
    const e = savedEvening({ deals: [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }], moves: [...roundMoves(P4, 'Arjun', { caught: 'wrong' }, START), { type: 'nextRound' }, { type: 'seen' }] });
    await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
    await page.goto(HOME);
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ })).toContainText('Impostor · Riya, Arjun +2 · round 2');
  });
});

test.describe('Lane N: IMP-074 "Players (5) ›" on the result (M2)', () => {
  test('Score No: the quiet "Players (4) ›" on the evening line\'s row, right-aligned; it opens the Players sheet', async ({ page }) => {
    await atRound1Result(page);
    const link = quiet(page, 'Players (4) ›');
    await expect(link).toBeVisible();
    const l = (await link.boundingBox())!, line = (await page.getByTestId('evening-line').boundingBox())!;
    expect(Math.abs((l.y + l.height / 2) - (line.y + line.height / 2)), 'same row as the evening line').toBeLessThanOrEqual(12);
    expect(l.x, 'right of the evening line').toBeGreaterThan(line.x);
    await link.click();
    await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();
  });

  test('the practice round\'s result: "Players (4) ›" alone, right-aligned', async ({ page }) => {
    await atRound1Result(page, { practice: true });
    const l = (await quiet(page, 'Players (4) ›').boundingBox())!;
    expect(l.x + l.width, 'right-aligned').toBeGreaterThan(390 / 2);
  });
});

test.describe('Lane N: IMP-103 History "Play again" while a game is unfinished asks once', () => {
  test('"Start a new game?" once; "Start new" goes straight to "Who\'s playing?" filled with the past game\'s players', async ({ page }) => {
    const past = savedEvening({ id: 'imp-past', status: 'ended', t0: T0 - 2 * 3600_000, players: ['Asha', 'Dev', 'Neel'], deals: [{ wordId: SAMOSA, impostor: 'Dev', starter: 'Asha' }], moves: [...roundMoves(['Asha', 'Dev', 'Neel'], 'Dev', { caught: 'wrong' }, START), { type: 'endEvening' }] });
    const open = savedEvening({ id: 'imp-open', deals: [DEAL], moves: [START, { type: 'seen' }] });
    await phoneWith(page, [past, open], { now: open.records.at(-1).at + 60_000 });
    await openHistory(page);
    await page.getByTestId('history-game').filter({ hasText: 'Impostor · 1 round' }).click();
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Start a new game\?/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Start new', exact: true }).click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const names = await page.getByRole('button', { name: /^Remove / }).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    expect(names).toEqual(['Remove Asha', 'Remove Dev', 'Remove Neel']);
  });
});

test.describe('Lanes N and O: IMP-085 plain words (M24): "game", never "evening", "night", "session", "crew" or "steal"', () => {
  test('a whole game, last-chance guess on, Score Yes: no screen\'s own text has those words (the word list\'s words and hints aside)', async ({ page }) => {
    test.setTimeout(120_000);
    const listWords = WORDS.flatMap((w: any) => [w.word, ...String(w.other_names ?? '').split(' / '), w.hint, w.category]).filter(Boolean) as string[];
    const banned = /\b(evening|evenings|night|nights|session|sessions|crew|steal|steals)\b/i;
    const check = async (where: string) => {
      let text = await page.locator('body').innerText();
      for (const w of listWords) text = text.split(w).join(' ');
      expect(text.match(banned)?.[0] ?? null, `${where}: "${text.replace(/\s+/g, ' ').slice(0, 200)}"`).toBeNull();
    };
    await phoneWith(page, [], { now: T0 });
    await hostAGame(page).click();
    await check('What shall we play?');
    await impostorCard(page).click();
    await check('Who\'s playing?');
    for (const n of P4) { await playerField(page).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('group', { name: 'Score', exact: true }).getByRole('button', { name: /Yes/ }).click();
    await check('How do you want to play? (Score Yes)');
    await page.getByRole('button', { name: 'More options ›', exact: true }).click();
    await check('More options');
    await page.getByRole('group', { name: 'Last guess for a caught impostor', exact: true }).getByRole('button', { name: /On/ }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'How to play', exact: true }).click();
    await check('How to play');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await check('screen A');
    await settle(page);
    await imButton(page, 'Riya').click();
    await check('screen B');
    await hold(page, 600);
    await doneButton(page).click();
    for (const n of P4.slice(1)) await turn(page, n);
    await check('clues');
    await settle(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await check('talk');
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await check('picker');
    await page.getByRole('button', { name: "It's a tie", exact: true }).click();
    await check('picker, tie');
    await page.getByRole('button', { name: /^(Not a tie|Count again)$/ }).first().click();
    await page.clock.runFor(6000);
    await pickerName(page, 'Riya').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await check('result');
    await settle(page);
    await page.getByRole('button', { name: 'End game', exact: true }).click();
    await check('summary');
    await page.getByRole('button', { name: 'More ›', exact: true }).click();
    await check('summary, More ›');
  });
});

// ================================================================ C3

test.describe('C3: IMP-078 someone has to leave mid-round', () => {
  async function leaveDialog(page: Page, impostor: string) {
    await startEvening(page, { players: P5, seeds: { deals: [{ wordId: SAMOSA, impostor, starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page, P5);
    await fromMenu(page, 'Players');
    await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Kabir has to leave\?/ });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  test('✕ Kabir mid-round asks "Kabir has to leave?" with "Deal again without Kabir" (outlined) and "Finish this round first" (main); the same words and buttons whether or not he is the impostor', async ({ page, browser }) => {
    const dialog = await leaveDialog(page, 'Kabir');
    await expectOneMainButton(page, '"Kabir has to leave?"', 'Finish this round first', true);
    expect(await isOutlined(dialog.getByRole('button', { name: 'Deal again without Kabir', exact: true }))).toBe(true);
    const asImpostor = (await dialog.innerText()).replace(/\s+/g, ' ').trim();
    const ctx = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    const p2 = await ctx.newPage();
    const d2 = await leaveDialog(p2, 'Arjun');
    expect((await d2.innerText()).replace(/\s+/g, ' ').trim(), 'nothing hints at his role').toBe(asImpostor);
    await ctx.close();
  });

  test('closing the dialog with the phone\'s Back changes nothing', async ({ page }) => {
    await leaveDialog(page, 'Arjun');
    const before = await records(page);
    await page.goBack();
    await expect(page.getByRole('dialog', { name: /Kabir has to leave\?/ })).toHaveCount(0);
    expect(await records(page)).toEqual(before);
  });

  test('"Finish this round first": leaveAfterRound recorded; Kabir greyed with no ✕; he stays in the clue order; at the result "Kabir left after this round" shows for 4 s and he is gone from the next deal', async ({ page }) => {
    const dialog = await leaveDialog(page, 'Arjun');
    await dialog.getByRole('button', { name: 'Finish this round first', exact: true }).click();
    expect((await records(page)).at(-1)).toEqual({ type: 'leaveAfterRound', player: 'Kabir' });
    await expect(page.getByTestId('clue-order')).toHaveText(exact('Riya → Arjun → Meena → Kabir → Zoya'));
    await fromMenu(page, 'Players');
    await expect(page.getByRole('button', { name: 'Remove Kabir', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await toPicker(page);
    await freezeClock(page);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await expect(page.getByTestId('toast')).toHaveText(exact('Kabir left after this round', ['Kabir']));
    await page.clock.runFor(4001);
    await expect(page.getByTestId('toast')).toHaveCount(0);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  });

  test('"Deal again without Kabir": dealAgainWithout recorded (one move, no role); the deal starts again from Riya, "Player 1 of 4"', async ({ page }) => {
    const dialog = await leaveDialog(page, 'Arjun');
    await dialog.getByRole('button', { name: 'Deal again without Kabir', exact: true }).click();
    const last = (await records(page)).at(-1);
    expect(last.type).toBe('dealAgainWithout');
    expect(last.player).toBe('Kabir');
    expect(Object.keys(last).sort()).toEqual(['player', 'type', 'wordId']);
    await expect(passName(page)).toHaveText(exact('Riya', P4));
    await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 4', []));
  });
});

test.describe('C3: IMP-078 two leavers after the same round (decision I27 note)', () => {
  test('Kabir and Zoya both choose "Finish this round first": one toast "Kabir, Zoya left after this round" at the result; the next deal has 3 players', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page, P5);
    for (const n of ['Kabir', 'Zoya']) {
      await fromMenu(page, 'Players');
      await page.getByRole('button', { name: `Remove ${n}`, exact: true }).click();
      await page.getByRole('dialog', { name: new RegExp(`${n} has to leave\\?`) }).getByRole('button', { name: 'Finish this round first', exact: true }).click();
    }
    expect((await records(page)).filter((m: any) => m.type === 'leaveAfterRound')).toEqual([{ type: 'leaveAfterRound', player: 'Kabir' }, { type: 'leaveAfterRound', player: 'Zoya' }]);
    await toPicker(page);
    await freezeClock(page);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await expect(page.getByTestId('toast')).toHaveText(exact('Kabir, Zoya left after this round', ['Kabir', 'Zoya']));
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 3', []));
  });
});

test.describe('C3: IMP-079 someone arrives mid-round', () => {
  test('"Joining next round: Zoya, Dev" (15 px, 19 px with Larger text) directly above the main button on clues, talk and picker; not announced; gone when the next deal starts', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    for (const n of ['Zoya', 'Dev']) {
      await fromMenu(page, 'Players');
      await playerField(page).fill(n);
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
    }
    const line = page.getByTestId('joining-line');
    const expectLine = async (where: string) => {
      await expect(line, where).toHaveText(exact('Joining next round: Zoya, Dev', ['Zoya', 'Dev']));
      expect(await fontSize(page, 'joining-line')).toBe(15);
      const l = (await line.boundingBox())!, m = (await mainButton(page).boundingBox())!;
      expect(l.y + l.height, `${where}: above the main button`).toBeLessThanOrEqual(m.y + 1);
      expect(m.y - (l.y + l.height), `${where}: directly above`).toBeLessThanOrEqual(24);
      await expect(page.getByTestId('announcer')).not.toContainText('Joining');
    };
    await expectLine('clues');
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await expectLine('talk');
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await expectLine('picker');
    await expect(pickerName(page, 'Zoya'), 'not on this round\'s picker').toHaveCount(0);
    await reveal(page, 'Riya');
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(line).toHaveCount(0);
    await expect(page.getByTestId('deal-progress')).toHaveText(exact('Player 1 of 6', []));
  });
});

test.describe('C3: Test hooks item 3 (v3.8): test seeds that do not fit the players are ignored', () => {
  test('a forced impostor who is not playing: "Start round" still deals (seeded picks)', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Zoya', starter: 'Riya' }] } });
    await expect(passName(page)).toHaveText(exact('Riya', P4));
    await dealAll(page);
    await expect(page.getByTestId('clue-order')).toBeVisible();
  });
});
