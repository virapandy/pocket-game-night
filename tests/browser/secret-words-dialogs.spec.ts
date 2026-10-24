// Secret Words, screen lane B: the dialogs, the menu and the rules that hold on every turn screen (scenarios v3.7,
// 23 October 2026): D1 dispute (SWD-124, 046), D4 Pause (SWD-110), D5 New board (SWD-055 from the menu, SWD-116 board
// check after it), the menu at each step (SWD-110 v3.7 order, the menu table), the timer (SWD-047), a reload (SWD-048),
// double taps (SWD-049), the map on the host (SWD-037), Home during a game (SWD-111), the map code again (SWD-129),
// screen readers (SWD-095), reduce motion (SWD-096), sound and vibration (SWD-097), targets (SWD-094), one main (SWD-098).
// Written before the screens exist: they fail until lane B (and lane A's setup screens, which lead here) are built.
import { expect, test, type Page } from './fixtures';
import { expectOneMainButton } from './helpers';
import { freezeClock, mainButton } from './impostor';
import { giveClue, mapCells, menuButton, oracleBoard, scanHeading, shown, tapMain, waitGuards } from './secret-words';
import {
  announcer, box, byId, cellAt, clearEffects, clueGiver, easyCode, fullCode, guess, hideApp, holdPad, host, indexesOf, itemsOnly,
  listenForEffects, menuOf, moves, moveTypes, other, quiet, resultLine, showApp, sounds, teamsOf, toClueScreen, toGuessing,
  turnHeading, uiState, vibrations,
} from './secret-words-b';

const CODE = fullCode(9001, 2);
const B = oracleBoard(CODE);
const ownOf = (t: 'orange' | 'teal') => indexesOf(B, t);
const NOBODY = indexesOf(B, 'nobody');
const LANDMINE = indexesOf(B, 'landmine')[0]!;
const menuItem = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });
async function openMenuItem(page: Page, name: string) {
  await waitGuards(page);
  await menuButton(page).click();
  await menuItem(page, name).click();
}

// ---------------------------------------------------------------------------------------------------------------------
// D1: Clue not allowed? (SWD-124, 046)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-124 / SWD-046: disputes', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const dispute = (page: Page) => page.getByRole('dialog', { name: 'Clue not allowed? Both clue givers decide together.' });

  test('the dialog: stacked full-width 48 px buttons in this order: "Try another clue", "Turn ends, and one of their words is turned over for them", "Clue rules", main "Let it go"; "Let it go" records nothing, "Change clue" still works', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute', n: 2 });
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    const d = dispute(page);
    await expect(d).toBeVisible();
    const buttons = d.getByRole('button');
    await expect(buttons).toHaveText(['Try another clue', 'Turn ends, and one of their words is turned over for them', 'Clue rules', 'Let it go']);
    const boxes = await buttons.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.y, 'stacked').toBeGreaterThan(boxes[i - 1]!.y);
    for (const b of boxes.slice(0, 3)) expect(b.h, 'quiet buttons at least 48 px (the second may wrap to 2 lines)').toBeGreaterThanOrEqual(48 - 0.5);
    expect(Math.abs(boxes[0]!.w - boxes[2]!.w), 'full width').toBeLessThanOrEqual(1);
    const before = await moveTypes(page);
    await waitGuards(page);
    await d.getByRole('button', { name: 'Let it go', exact: true }).click();
    await expect(d).toHaveCount(0);
    expect(await moveTypes(page)).toEqual(before);
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await expect(byId(page, 'clue-prompt')).toBeVisible();
  });

  test('closing the dialog any other way (Escape) is "Let it go"', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute-esc', n: 2 });
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    await page.keyboard.press('Escape');
    await expect(dispute(page)).toHaveCount(0);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
    expect(await moveTypes(page)).toEqual(['deal', 'clue']);
  });

  test('"Try another clue": the clue screen with "Keep my clue", which returns to guessing; confirming records a replacing clue', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute-try', n: 2 });
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    await dispute(page).getByRole('button', { name: 'Try another clue', exact: true }).click();
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await quiet(page, 'Keep my clue').click();
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    await dispute(page).getByRole('button', { name: 'Try another clue', exact: true }).click();
    await giveClue(page, 1);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 1');
    expect((await moves(page)).filter((m) => m.type === 'clue').map((m) => m.n)).toEqual([2, 1]);
  });

  test('"Clue rules" opens How to play at h2 "Clue rules"; its "Done" returns to the dialog', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute-rules', n: 2 });
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    await dispute(page).getByRole('button', { name: 'Clue rules', exact: true }).click();
    const h2 = page.getByRole('heading', { level: 2, name: 'Clue rules' });
    await expect(page.getByRole('heading', { level: 1, name: 'How to play' })).toBeVisible();
    const top = await h2.evaluate((el) => el.getBoundingClientRect().top);
    expect(top, 'scrolled to "Clue rules" (at the top of the viewport)').toBeLessThanOrEqual(80);
    expect(top).toBeGreaterThanOrEqual(-1);
    await tapMain(page, /^Done$/);
    await expect(dispute(page)).toBeVisible();
  });

  test('"Turn ends, and one of their words is turned over for them": records brokeRule; one of the other team\'s face-down words turns over; result line "The clue broke a rule, so the other team got a free word."; turn over; vibration 50 ms and the thud sound', async ({ page }) => {
    await listenForEffects(page);
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute-broke', n: 2 });
    await clearEffects(page);
    await waitGuards(page);
    await quiet(page, 'Clue not allowed?').click();
    await waitGuards(page);
    await dispute(page).getByRole('button', { name: 'Turn ends, and one of their words is turned over for them', exact: true }).click();
    await page.clock.runFor(400);
    const m = (await moves(page)).at(-1);
    expect(m.type).toBe('brokeRule');
    expect(ownOf(other(B.starts))).toContain(m.cell);
    await expect(cellAt(page, m.cell)).toHaveAccessibleName(new RegExp(`^${B.words[m.cell]}, ${other(B.starts)} team`));
    await expect(resultLine(page)).toHaveText('The clue broke a rule, so the other team got a free word.');
    await expect(mainButton(page)).toHaveText("Other team's turn");
    await expect(quiet(page, 'End our turn')).toHaveCount(0);
    expect(await vibrations(page)).toContain(50);
    expect((await sounds(page)).map((s) => s.name)).toContain('thud');
  });

  test('the menu item "Clue not allowed?" is enabled from the clue until the turn\'s first guess, then disabled', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'dispute-window', n: 2 });
    await waitGuards(page);
    await menuButton(page).click();
    await expect(menuItem(page, 'Clue not allowed?')).toBeEnabled();
    await menuItem(page, 'Clue not allowed?').click();
    await expect(dispute(page)).toBeVisible();
    await waitGuards(page);
    await dispute(page).getByRole('button', { name: 'Let it go', exact: true }).click();
    await guess(page, ownOf(B.starts)[0]!);
    await waitGuards(page);
    await menuButton(page).click();
    await expect(menuItem(page, 'Clue not allowed?')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// D4: Pause (SWD-110)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-110: Pause', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('the cover: dialog named "Paused", heading "Paused", the where-line, "Tap Carry on when you\'re ready.", main "Carry on"; nothing recorded; the timer shows "Paused" and stays so; "Carry on" returns to the same step', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'pause', n: 2 });
    const t = await teamsOf(page);
    await openMenuItem(page, 'Start 90-second timer');
    await expect(byId(page, 'hurry-timer')).toHaveText('1:30');
    const before = await moveTypes(page);
    await waitGuards(page);
    await openMenuItem(page, 'Pause');
    const cover = page.getByRole('dialog', { name: 'Paused' });
    await expect(cover).toBeVisible();
    await expect(cover.getByRole('heading', { name: 'Paused' })).toBeVisible();
    await expect(cover.getByTestId('where-line')).toHaveText(`${t.names[B.starts]} guessing · 3 guesses left`);
    await expect(cover.getByText("Tap Carry on when you're ready.", { exact: true })).toBeVisible();
    await expect(byId(page, 'pause-cover')).toBeVisible();
    await page.clock.runFor(5000);
    await tapMain(page, /^Carry on$/);
    await expect(cover).toHaveCount(0);
    await expect(byId(page, 'hurry-timer')).toHaveText('Paused');
    await page.clock.runFor(3000);
    await expect(byId(page, 'hurry-timer'), '"Carry on" does not restart it').toHaveText('Paused');
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
    expect(await moveTypes(page)).toEqual(before);
  });

  test('a reload while paused returns to the step with the cover shown; the screen-on lock is released while paused', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any; w.__wake = [];
      Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: (t: string) => { w.__wake.push(`request ${t}`); const l = { released: false, addEventListener() {}, removeEventListener() {}, release() { w.__wake.push('release'); l.released = true; return Promise.resolve(); } }; return Promise.resolve(l); } } });
    });
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'pause-reload', n: 2 });
    await page.evaluate(() => { (window as any).__wake = []; });
    await waitGuards(page);
    await byId(page, 'pause-button').click();
    await expect.poll(async () => page.evaluate(() => (window as any).__wake as string[])).toContain('release');
    expect((await uiState(page))?.paused).toBe(true);
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
    await tapMain(page, /^Carry on$/);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
  });

  test('no Pause at game over; the private map has the pause-button but still no menu (SWD-031 v3.9)', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'pause-none' });
    await tapMain(page, /^I'm /);
    await expect(holdPad(page)).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
    await expect(byId(page, 'pause-button')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The menu at each step (SWD-110 v3.6 groups, v3.7 order; the menu table)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-110 (v3.7): the game menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('one phone: pass screen, clue screen, guessing, end-turn line and turn over have the menu table\'s items in group order: Pause first; play; New board directly above the leave group; more', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'menu-1' });
    const leaveMore = ['New board', 'Home (keep this game)', 'End the game', 'End for tonight', 'How to play', 'Settings', 'History'];
    expect(itemsOnly(await menuOf(page)), 'pass screen').toEqual(['Pause', 'Players', ...leaveMore]);
    await toClueScreen(page, 'One phone');
    expect(itemsOnly(await menuOf(page)), 'clue screen').toEqual(['Pause', 'Players', ...leaveMore]);
    await giveClue(page, 2);
    const guessing = await menuOf(page);
    expect(itemsOnly(guessing), 'guessing (7 players: more than 1 guesser)').toEqual(['Pause', 'Earlier clues', 'Start 90-second timer', 'Clue not allowed?', 'Someone else taps Reveal', 'Players', ...leaveMore]);
    // A separator between groups that have items: before New board, before the leave group, before the more group.
    const at = (x: string) => guessing.indexOf(x);
    expect(guessing[at('New board') - 1], 'a rule above New board').toBe('|');
    expect(guessing[at('Home (keep this game)') - 1], 'a rule above the leave group').toBe('|');
    expect(guessing[at('How to play') - 1], 'a rule above the more group').toBe('|');
    await guess(page, ownOf(B.starts)[0]!);
    await waitGuards(page);
    await quiet(page, 'End our turn').click();
    expect(itemsOnly(await menuOf(page)), 'end-turn line').toEqual(['Pause', 'Earlier clues', 'Players', ...leaveMore]);
    await quiet(page, 'Oops, keep guessing').click();
    await guess(page, NOBODY[0]!);
    expect(itemsOnly(await menuOf(page)), 'turn over').toEqual(['Pause', 'Earlier clues', 'Players', ...leaveMore]);
  });

  test('two phones: the scan screen; the clue screen adds "Show the map to a clue giver" and "Show the map code again"', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'menu-2' });
    expect(itemsOnly(await menuOf(page)), 'scan screen').toEqual(['Pause', 'Players', 'New board', 'Home (keep this game)', 'End the game', 'End for tonight', 'How to play', 'Settings', 'History']);
    await toClueScreen(page, 'Two phones');
    expect(itemsOnly(await menuOf(page)), 'clue screen').toEqual(['Pause', 'Players', 'Show the map to a clue giver', 'Show the map code again', 'New board', 'Home (keep this game)', 'End the game', 'End for tonight', 'How to play', 'Settings', 'History']);
  });

  test.describe('360 × 640', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('the menu sheet scrolls inside with "Done" pinned at the bottom; while more items are below the fold a fade shows at the list\'s bottom edge; the page does not scroll', async ({ page }) => {
      await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'menu-sheet', n: 2 });
      await waitGuards(page);
      await menuButton(page).click();
      const done = page.getByRole('button', { name: 'Done', exact: true }).filter({ visible: true }).last();
      await expect(done).toBeVisible();
      const d = await box(done);
      expect(d.y + d.height, 'Done on screen').toBeLessThanOrEqual(640 + 0.5);
      const last = menuItem(page, 'History');
      const lastBox = await last.boundingBox();
      if (lastBox && lastBox.y + lastBox.height > d.y) {
        await last.scrollIntoViewIfNeeded();
        expect((await box(done)).y, 'Done stays pinned').toBeCloseTo(d.y, 0);
      }
      const scrolls = await page.evaluate(() => document.scrollingElement!.scrollHeight > window.innerHeight + 1);
      expect(scrolls).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// D5: New board from the menu (SWD-055) and the board check after it (SWD-116)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-055 / SWD-116: New board', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const newBoardDialog = (page: Page) => page.getByRole('dialog', { name: /^New board\?/ });

  test('the dialog "New board? Fresh words, same teams. …" with "New board" / main "Keep playing"; "Keep playing" returns as it was', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'nb-keep', n: 2 });
    await openMenuItem(page, 'New board');
    const d = newBoardDialog(page);
    await expect(d).toContainText('New board? Fresh words, same teams. Use it if someone saw the map or the words are too hard. This board won\'t count.');
    await tapMain(page, /^Keep playing$/);
    await expect(d).toHaveCount(0);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
    expect(await moveTypes(page)).not.toContain('dealNew');
  });

  test('two phones, the next deal of the same deck, clue givers unchanged: the scan screen with "On the map phone, tap Next map. Its first words should be: …"; turn numbers restart; the timer stops; no tips again', async ({ page }) => {
    const next = fullCode(9001, 3);
    const nb = oracleBoard(next);
    await host(page, { phones: 'Two phones', boards: [CODE, next], seed: 'nb-same' });
    await toClueScreen(page, 'Two phones');
    await giveClue(page, 2); // the evening's first clue: the Do Not Disturb tip is done (SWD-104)
    await openMenuItem(page, 'Start 90-second timer');
    await expect(byId(page, 'hurry-timer')).toBeVisible();
    await openMenuItem(page, 'New board');
    await waitGuards(page);
    await newBoardDialog(page).getByRole('button', { name: 'New board', exact: true }).click();
    await expect(scanHeading(page)).toBeVisible();
    await expect(byId(page, 'hurry-timer')).toHaveCount(0);
    await expect(byId(page, 'map-code-text')).toContainText(shown(next));
    await expect(byId(page, 'board-check')).toHaveText(`On the map phone, tap Next map. Its first words should be: ${nb.words.slice(0, 3).join(' · ')}`);
    await expect(byId(page, 'mismatch-line')).toHaveText('First words different? Scan this code again.');
    await expect(byId(page, 'dnd-tip')).toHaveCount(0);
    expect((await moves(page)).at(-1)).toEqual({ type: 'dealNew', code: next });
    await waitGuards(page);
    await byId(page, 'pause-button').click();
    await expect(page.getByRole('dialog', { name: 'Paused' }).getByTestId('where-line')).toHaveText('Scan the map, game 1');
    await tapMain(page, /^Carry on$/);
    await toClueScreen(page, 'Two phones');
    await expect(byId(page, 'anyone-line')).toHaveCount(0);
    await expect(byId(page, 'tip')).toHaveCount(0);
    await expect(turnHeading(page)).toHaveText(`${(await teamsOf(page)).names[nb.starts]}, your turn`);
  });

  test(`three phones, a new deck: "New code: scan it again. The map phones' first words should be: …"`, async ({ page }) => {
    const next = fullCode(123_457, 0);
    const nb = oracleBoard(next);
    await host(page, { phones: 'Three phones', boards: [CODE, next], seed: 'nb-deck' });
    await openMenuItem(page, 'New board');
    await waitGuards(page);
    await newBoardDialog(page).getByRole('button', { name: 'New board', exact: true }).click();
    await expect(byId(page, 'board-check')).toHaveText(`New code: scan it again. The map phones' first words should be: ${nb.words.slice(0, 3).join(' · ')}`);
  });

  test('one phone: the new starting team\'s pass screen; the recap restarts', async ({ page }) => {
    const next = fullCode(9001, 3);
    const nb = oracleBoard(next);
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'nb-one', n: 1 });
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await expect(byId(page, 'recap-line')).toBeVisible();
    await openMenuItem(page, 'New board');
    await waitGuards(page);
    await newBoardDialog(page).getByRole('button', { name: 'New board', exact: true }).click();
    const t = await teamsOf(page);
    await expect(turnHeading(page)).toHaveText(`${t.names[nb.starts]}, your turn`);
    await expect(byId(page, 'pass-name')).toHaveText(clueGiver(t, nb.starts));
    await expect(byId(page, 'recap-line')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The timer (SWD-047)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-047: Start 90-second timer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('"1:30" at t = 0, "1:29" at 1 s, "0:01" at 89 s, "Time\'s up!" from 90 s with the chime ("0:00" never shows); the button reads "Stop timer", which removes it; nothing else happens', async ({ page }) => {
    await listenForEffects(page);
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'timer' });
    await waitGuards(page);
    await freezeClock(page);
    await quiet(page, 'Start 90-second timer').click();
    const timer = byId(page, 'hurry-timer');
    await expect(timer).toHaveText('1:30');
    await expect(quiet(page, 'Stop timer')).toBeVisible();
    await page.clock.runFor(1000);
    await expect(timer).toHaveText('1:29');
    await page.clock.runFor(88_000);
    await expect(timer).toHaveText('0:01');
    const seen: string[] = [];
    await page.exposeFunction('__seenTimer', (t: string) => { seen.push(t); });
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="hurry-timer"]')!;
      new MutationObserver(() => (window as any).__seenTimer((el.textContent ?? '').trim())).observe(el, { childList: true, characterData: true, subtree: true });
    });
    await page.clock.runFor(1000);
    await expect(timer).toHaveText("Time's up!");
    expect(seen, '"0:00" never shows').not.toContain('0:00');
    expect((await sounds(page)).filter((s) => s.name === 'chime')).toHaveLength(1);
    await expect(quiet(page, 'Stop timer')).toBeVisible();
    await expect(byId(page, 'pass-name'), 'nothing else happens').toBeVisible();
    expect(await moveTypes(page)).toEqual(['deal']);
    await quiet(page, 'Stop timer').click();
    await expect(timer).toHaveCount(0);
    await expect(quiet(page, 'Start 90-second timer')).toBeVisible();
  });

  test('pass screen: its own line under the team bar, above the heading, 120 px at 390 × 844; it keeps running on the private map (28 px) and the clue screen (28 px); removed when the clue is given', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'timer-carry' });
    await waitGuards(page);
    await quiet(page, 'Start 90-second timer').click();
    const timer = byId(page, 'hurry-timer');
    const size = (async () => parseFloat(await timer.evaluate((el) => getComputedStyle(el).fontSize)));
    expect(await size()).toBe(120);
    expect((await box(timer)).y + (await box(timer)).height, 'above the heading').toBeLessThanOrEqual((await box(turnHeading(page))).y + 0.5);
    await tapMain(page, /^I'm /);
    await expect(timer).toBeVisible();
    expect(await size()).toBe(28);
    await waitGuards(page);
    await holdPad(page).click();
    await tapMain(page, /^I have my clue$/);
    await expect(timer).toBeVisible();
    expect(await size()).toBe(28);
    await giveClue(page, 2);
    await expect(timer).toHaveCount(0);
  });

  test('board screens: 56 px at 390 × 844, in the top bar; app hidden → "Paused" and the item reads "Start 90-second timer", which restarts at 1:30; not saved: after a reload there is no timer', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'timer-board', n: 2 });
    await openMenuItem(page, 'Start 90-second timer');
    const timer = byId(page, 'hurry-timer');
    await expect(timer).toHaveText('1:30');
    expect(parseFloat(await timer.evaluate((el) => getComputedStyle(el).fontSize))).toBe(56);
    await page.clock.runFor(10_000);
    await hideApp(page);
    await showApp(page);
    await expect(timer).toHaveText('Paused');
    await waitGuards(page);
    await menuButton(page).click();
    await expect(menuItem(page, 'Start 90-second timer')).toBeVisible();
    await menuItem(page, 'Start 90-second timer').click();
    await expect(timer).toHaveText('1:30');
    await page.reload();
    await expect(byId(page, 'clue-line')).toBeVisible();
    await expect(timer).toHaveCount(0);
  });

  test.describe('360 × 640', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('72 px on the pass screen; 40 px on the board', async ({ page }) => {
      await host(page, { phones: 'One phone', boards: [CODE], seed: 'timer-360' });
      await waitGuards(page);
      await quiet(page, 'Start 90-second timer').click();
      expect(parseFloat(await byId(page, 'hurry-timer').evaluate((el) => getComputedStyle(el).fontSize))).toBe(72);
      await quiet(page, 'Stop timer').click();
      await toClueScreen(page, 'One phone');
      await giveClue(page, 2);
      await openMenuItem(page, 'Start 90-second timer');
      expect(parseFloat(await byId(page, 'hurry-timer').evaluate((el) => getComputedStyle(el).fontSize))).toBe(40);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Reload (SWD-048) and double taps (SWD-049)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-048: reload during play', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('guessing: back to the same step with the last reveal\'s result line; the pick is lost; the picker override of this turn kept', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'reload-guess', n: 'inf' });
    const g = teams[B.starts].filter((n) => n !== teams.clueGivers[B.starts] && n !== teams.partners[B.starts]);
    await guess(page, ownOf(B.starts)[0]!);
    const line = (await resultLine(page).textContent())!.trim();
    await openMenuItem(page, 'Someone else taps Reveal');
    await page.getByRole('dialog', { name: 'Who taps Reveal this turn?' }).getByRole('button', { name: g[1]!, exact: true }).click();
    await waitGuards(page);
    await cellAt(page, ownOf(B.starts)[1]!).click();
    await page.reload();
    await expect(resultLine(page)).toHaveText(line);
    await expect(cellAt(page, ownOf(B.starts)[1]!)).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText('Reveal');
    await expect(page.getByTestId('turn-line')).toContainText(`${g[1]} taps Reveal`); // SWD-122 v3.9: the picker is named in the turn-line
    expect((await uiState(page))?.pickerOverride).toBe(g[1]);
  });

  test('a clue screen opened by "Change clue" returns to guessing with the old clue; a typed, unconfirmed clue word is lost', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'reload-change', n: 2, word: 'Spice' });
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await page.getByLabel('Clue word (optional)', { exact: true }).fill('Smoke');
    await page.reload();
    await expect(byId(page, 'clue-line')).toHaveText('Spice · 2');
    await expect(byId(page, 'clue-prompt')).toHaveCount(0);
  });

  test('the end-turn line comes back after a reload (step "end-turn")', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'reload-end', n: 'inf' });
    await guess(page, ownOf(B.starts)[0]!);
    await waitGuards(page);
    await quiet(page, 'End our turn').click();
    expect((await uiState(page))?.step).toBe('end-turn');
    await page.reload();
    await expect(resultLine(page)).toHaveText(`${teams.names[B.starts]} ended their turn.`);
    await expect(quiet(page, 'Oops, keep guessing')).toBeVisible();
  });
});

test.describe('SWD-049: double taps', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('two taps on "Reveal <Word>" 50 ms apart record one reveal; picks follow the last tap', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'double', n: 'inf' });
    const [a, b] = ownOf(B.starts);
    await waitGuards(page);
    await cellAt(page, a!).click();
    await cellAt(page, b!).click();
    await expect(mainButton(page)).toHaveText(new RegExp(`^Reveal ${B.words[b!]}$`));
    await freezeClock(page);
    await mainButton(page).click();
    await page.clock.runFor(50);
    await mainButton(page).click({ force: true });
    await page.clock.runFor(1000);
    expect((await moves(page)).filter((m) => m.type === 'reveal')).toEqual([{ type: 'reveal', cell: b }]);
  });

  test('two taps on "Other team\'s turn" after the end-turn line record one endTurn and one nextTurn', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'double-end', n: 'inf' });
    await guess(page, ownOf(B.starts)[0]!);
    await waitGuards(page);
    await quiet(page, 'End our turn').click();
    await waitGuards(page);
    await freezeClock(page);
    const next = mainButton(page).filter({ hasText: /^Other team's turn$/ });
    await next.click();
    await page.clock.runFor(50);
    if (await next.count()) await next.click({ force: true });
    await page.clock.runFor(1000);
    const types = await moveTypes(page);
    expect(types.filter((m) => m === 'endTurn')).toHaveLength(1);
    expect(types.filter((m) => m === 'nextTurn')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// S7b and S7a: the map on the host (SWD-037) and the map code again (SWD-129)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-037: showing the map on the host (two or three phones)', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('menu → sheet "Show the map to" with "<name> (<team>)" for both clue givers and quiet "Cancel"; a name → the pass and private map for them with main "Done, hide the map", which returns to the step; Cancel returns; nothing recorded', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'show-map' });
    await toClueScreen(page, 'Two phones');
    const t = await teamsOf(page);
    const before = await moveTypes(page);
    await openMenuItem(page, 'Show the map to a clue giver');
    const sheet = page.getByRole('dialog', { name: 'Show the map to' });
    await expect(sheet.getByRole('button')).toHaveText([`${clueGiver(t, 'orange')} (${t.names.orange})`, `${clueGiver(t, 'teal')} (${t.names.teal})`, 'Cancel']);
    await sheet.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await openMenuItem(page, 'Show the map to a clue giver');
    await page.getByRole('dialog', { name: 'Show the map to' }).getByRole('button', { name: `${clueGiver(t, 'teal')} (${t.names.teal})`, exact: true }).click();
    await expect(byId(page, 'pass-name')).toHaveText(clueGiver(t, 'teal'));
    await tapMain(page, /^I'm /);
    await waitGuards(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    await tapMain(page, /^Done, hide the map$/);
    await expect(mapCells(page)).toHaveCount(0);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    expect(await moveTypes(page)).toEqual(before);
  });
});

test.describe('SWD-129 / SWD-116: Show the map code again', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('from guessing and turn over: the scan screen for the current board with board-check in wording 1\'s form and mismatch-line, no dnd-tip, no menu; "Back to the game" returns to the step', async ({ page }) => {
    await toGuessing(page, { phones: 'Three phones', code: CODE, seed: 'again-steps', n: 2 });
    for (const where of ['guessing', 'turn over'] as const) {
      if (where === 'turn over') await guess(page, NOBODY[0]!);
      await openMenuItem(page, 'Show the map code again');
      await expect(scanHeading(page)).toBeVisible();
      await expect(byId(page, 'map-code-text')).toContainText(shown(CODE));
      await expect(byId(page, 'board-check'), where).toHaveText(`The map phones should start with: ${B.words.slice(0, 3).join(' · ')}`);
      await expect(byId(page, 'mismatch-line')).toHaveText('First words different? Scan this code again.');
      await expect(byId(page, 'dnd-tip')).toHaveCount(0);
      await expect(menuButton(page)).toHaveCount(0);
      await tapMain(page, /^Back to the game$/);
      if (where === 'guessing') await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
      else await expect(mainButton(page)).toHaveText("Other team's turn");
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Home during a game (SWD-111)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-111: Home during a game', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('"Home (keep this game)" opens Home at once (no dialog); the game stays unfinished; phone Back does nothing during a game', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'home', n: 2 });
    const before = await moveTypes(page);
    await page.goBack();
    await expect(byId(page, 'clue-line'), 'Back does nothing').toHaveText('Clue: 2');
    expect(await moveTypes(page)).toEqual(before);
    await openMenuItem(page, 'Home (keep this game)');
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const e = (await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!k.startsWith('pgn.game.')) continue;
        const g = JSON.parse(localStorage.getItem(k)!);
        if (g?.gameType === 'secret-words') return g;
      }
      return null;
    }));
    expect(e?.status, 'the game stays unfinished').toBe('in-progress');
    expect(e.records.map((r: any) => r.move.type)).not.toContain('endGame');
  });

  test('it resumes at the same step from Home\'s row', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'home-resume', n: 2 });
    await guess(page, ownOf(B.starts)[0]!);
    await openMenuItem(page, 'Home (keep this game)');
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ });
    await waitGuards(page);
    await row.getByText('Tap to resume').click();
    await waitGuards(page);
    await expect(byId(page, 'guess-line')).toHaveText('2 guesses left');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Screen readers (SWD-095), reduce motion (SWD-096), sound and vibration (SWD-097)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-095: screen readers', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('the announcer reads the clue ("Clue for <team>: <Word>, 2 words"), each result line, "Other team\'s turn" at turn over; never the map, never the poker line', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'sr' });
    const t = await teamsOf(page);
    await expect(announcer(page)).toHaveAttribute('aria-live', 'polite');
    await tapMain(page, /^I'm /);
    await waitGuards(page);
    await holdPad(page).click();
    const mapWords = await page.evaluate(() => document.querySelector('[data-testid="announcer"]')?.textContent ?? '');
    for (const w of B.words) expect(mapWords, 'the map is never announced').not.toContain(w);
    await tapMain(page, /^I have my clue$/);
    await page.getByLabel('Clue word (optional)', { exact: true }).fill('Spice');
    await giveClue(page, 2);
    await expect(announcer(page)).toContainText(`Clue for ${t.names[B.starts]}: Spice, 2 words`);
    await expect(announcer(page)).not.toContainText('no hints');
    await guess(page, ownOf(B.starts)[0]!);
    await expect(announcer(page)).toContainText(`✓ ${clueGiver(t, B.starts)}'s clue works! 2 guesses left.`);
    await guess(page, NOBODY[0]!);
    await expect(announcer(page)).toContainText("Nobody's word. Other team's turn next.");
    await expect(announcer(page)).toContainText("Other team's turn");
  });

  test('clue wordings: "1 word", "0 words", "as many as you like"; announced again after "Change clue"', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'sr-1', n: 1 });
    const T = teams.names[B.starts];
    await expect(announcer(page)).toContainText(`Clue for ${T}: 1 word`);
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await giveClue(page, 0);
    await expect(announcer(page)).toContainText(`Clue for ${T}: 0 words`);
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await giveClue(page, 'inf');
    await expect(announcer(page)).toContainText(`Clue for ${T}: as many as you like`);
  });
});

test.describe('SWD-096: reduce motion', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('no cell turn and no animations on board screens; the result shows at once (t = 0)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'motion', n: 'inf' });
    const i = ownOf(B.starts)[0]!;
    await waitGuards(page);
    await freezeClock(page);
    await cellAt(page, i).click();
    expect(await page.evaluate(() => document.getAnimations().length), 'no animations while guessing').toBe(0);
    await mainButton(page).click();
    await expect(resultLine(page)).toBeVisible();
    await expect(cellAt(page, i)).toHaveAccessibleName(new RegExp(`^${B.words[i]}, ${B.starts} team`));
    expect(await page.evaluate(() => document.getAnimations().length), 'no animations after a reveal').toBe(0);
  });
});

test.describe('SWD-097: sound and vibration', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('ding (own word), thud (nobody\'s, the other team\'s), boom (the Landmine); thud and boom peak gains ≤ ding\'s; vibration 50 ms on every reveal, 200 ms on the Landmine; the private map makes no sound and no vibration', async ({ page }) => {
    await listenForEffects(page);
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'sound', landmine: 'Lose your turn' });
    await clearEffects(page);
    await tapMain(page, /^I'm /);
    await waitGuards(page);
    await holdPad(page).click();
    await page.clock.runFor(600);
    await holdPad(page).click();
    expect(await sounds(page), 'private map: no sound').toEqual([]);
    expect(await vibrations(page), 'private map: no vibration').toEqual([]);
    await tapMain(page, /^I have my clue$/);
    await giveClue(page, 'inf');
    await guess(page, ownOf(B.starts)[0]!);
    expect((await sounds(page)).map((s) => s.name)).toEqual(['ding']);
    expect(await vibrations(page)).toEqual([50]);
    await guess(page, NOBODY[0]!);
    expect((await sounds(page)).map((s) => s.name)).toEqual(['ding', 'thud']);
    expect(await vibrations(page)).toEqual([50, 50]);
    await tapMain(page, /^Other team's turn$/);
    await toClueScreen(page, 'One phone');
    await clearEffects(page);
    await giveClue(page, 2);
    await guess(page, ownOf(B.starts)[1]!); // the other team's word for this team
    expect((await sounds(page)).map((s) => s.name)).toEqual(['thud']);
    await tapMain(page, /^Other team's turn$/);
    await toClueScreen(page, 'One phone');
    await clearEffects(page);
    await giveClue(page, 2);
    await guess(page, LANDMINE);
    expect((await sounds(page)).map((x) => x.name)).toContain('boom');
    expect(await vibrations(page)).toContain(200);
  });
});

test.describe('SWD-097: peak gains', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('thud\'s and boom\'s peak gains are at most ding\'s', async ({ page }) => {
    await listenForEffects(page);
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'gains', n: 'inf', landmine: 'Lose your turn' });
    await guess(page, ownOf(B.starts)[0]!);
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await toClueScreen(page, 'One phone');
    await giveClue(page, 'inf');
    await guess(page, LANDMINE);
    const s = await sounds(page);
    const ding = s.find((x) => x.name === 'ding')!.gain;
    for (const name of ['thud', 'boom']) {
      const g = s.find((x) => x.name === name);
      expect(g, `${name} played`).toBeDefined();
      expect(g!.gain, `${name} ≤ ding`).toBeLessThanOrEqual(ding);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Targets (SWD-094) and one main button (SWD-098) on every lane B screen
// ---------------------------------------------------------------------------------------------------------------------

async function targetsAtLeast44(page: Page, where: string) {
  const small = await page.evaluate(() => [...document.querySelectorAll('button, [role="button"], a[href], [role="menuitem"]')]
    .filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; })
    .filter((el) => !el.closest('[data-testid="word-board"], [data-testid="map-grid"]'))
    .map((el) => { const r = el.getBoundingClientRect(); return { name: (el.getAttribute('aria-label') || el.textContent || '').trim(), w: r.width, h: r.height }; })
    .filter((b) => b.w < 44 - 0.5 || b.h < 44 - 0.5));
  expect(small, `${where}: every button at least 44 × 44`).toEqual([]);
}

test.describe('SWD-094 / SWD-098: targets and one main button', () => {
  for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 812, height: 375 }]) {
    test.describe(`${vp.width} × ${vp.height}`, () => {
      test.use({ viewport: vp });
      test('preview, pass screen, private map, clue screen, guessing, end-turn line, turn over: every button at least 44 × 44, at most one main button and it is the next step', async ({ page }) => {
        // Narrow portrait shows a Full board's grid nowhere (SWD-092): the Easy board there.
        const easy = vp.width < 360;
        const code = easy ? easyCode(9001, 2) : CODE;
        const b = oracleBoard(code);
        await host(page, { phones: 'One phone', boards: [code], seed: `targets-${vp.width}`, preview: true, board: easy ? 'easy' : 'full' });
        await targetsAtLeast44(page, 'preview');
        await expectOneMainButton(page, 'preview', 'Start', true);
        await tapMain(page, /^Start$/);
        await waitGuards(page); // SWD-114: "I'm ..." is greyed for its first second
        await targetsAtLeast44(page, 'pass screen');
        await expectOneMainButton(page, 'pass screen', "I'm", true);
        await tapMain(page, /^I'm /);
        await waitGuards(page);
        await targetsAtLeast44(page, 'private map, hidden');
        await expectOneMainButton(page, 'private map, hidden', null);
        await holdPad(page).click();
        await targetsAtLeast44(page, 'private map, shown');
        await expectOneMainButton(page, 'private map, shown', 'I have my clue', true);
        await tapMain(page, /^I have my clue$/);
        await waitGuards(page);
        await targetsAtLeast44(page, 'clue screen');
        await giveClue(page, 'inf');
        await waitGuards(page);
        await targetsAtLeast44(page, 'guessing');
        await guess(page, indexesOf(b, b.starts)[0]!);
        await waitGuards(page);
        await quiet(page, 'End our turn').click();
        await waitGuards(page);
        await targetsAtLeast44(page, 'end-turn line');
        await expectOneMainButton(page, 'end-turn line', "Other team's turn", true);
        await quiet(page, 'Oops, keep guessing').click();
        await guess(page, indexesOf(b, 'nobody')[0]!);
        await waitGuards(page);
        await targetsAtLeast44(page, 'turn over');
        await expectOneMainButton(page, 'turn over', "Other team's turn", true);
      });
    });
  }
});
