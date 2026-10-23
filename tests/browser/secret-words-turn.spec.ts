// Secret Words, screen lane B: the turn on the host (scenarios v3.7, 23 October 2026), screen by screen:
// S6 preview (SWD-012), S7 scan (SWD-033, 116, 104), P1 pass (SWD-030, 103, 104, 126), P2 private map (SWD-031, 032, 113,
// 121 on the private map), P3 clue (SWD-040, 101, 118, 126), P4 guessing (SWD-041, 042, 043, 102, 122, 125), P5 end-turn
// line (SWD-044), P6 turn over (SWD-045, 046 via the dispute in secret-words-dialogs.spec.ts).
// Written before the screens exist: they fail until lane B (and lane A's setup screens, which lead here) are built.
import { expect, test, type Page } from './fixtures';
import { freezeClock, mainButton } from './impostor';
import { cellsOf, giveClue, kindOf, mapCells, menuButton, oracleBoard, scanHeading, shown, tapMain, waitGuards } from './secret-words';
import { readDrawnQr } from './phone';
import {
  announcer, box, byId, cellAt, clueGiver, endOurTurn, fontPx, fullCode, guess, guessersOf, holdPad, host, indexesOf,
  menuOf, moves, moveTypes, other, pageScrolls, quiet, resultLine, showApp, teamsOf, toClueScreen, toGuessing,
  turnHeading, turnLine, type Team, type Teams, whereLine,
} from './secret-words-b';

const CODE = fullCode(9001, 2);
const B = oracleBoard(CODE);
const ownOf = (t: Team) => indexesOf(B, t);
const NOBODY = indexesOf(B, 'nobody');
const LANDMINE = indexesOf(B, 'landmine')[0]!;

const clueKey = (page: Page, n: number) => page.getByTestId('clue-key').filter({ hasText: new RegExp(`^${n}$`) });
const clueWord = (page: Page) => page.getByLabel('Clue word (optional)', { exact: true });
/** True when `word` shows upper case by CSS inside `l` (DOM text as typed, Terms "Word text" / "Text matching"). */
const shownUpper = (l: import('@playwright/test').Locator, word: string) => l.evaluate((root, w) => {
  const all = [root, ...root.querySelectorAll('*')];
  return all.some((el) => (el.textContent ?? '').includes(w) && getComputedStyle(el).textTransform === 'uppercase');
}, word);
const names = (t: Teams, team: Team) => ({ T: t.names[team], O: t.names[other(team)], cg: clueGiver(t, team), colour: team });

// ---------------------------------------------------------------------------------------------------------------------
// S6: the preview board (SWD-012)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-012: the preview board', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('h1 "The board, before you start", turn-line "<team> start", the counts, every cell locked, main "Start"; no clue line, no tips; dealt already', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'preview', preview: true });
    const t = await teamsOf(page);
    await expect(page.getByRole('heading', { level: 1, name: 'The board, before you start' })).toBeVisible();
    await expect(turnLine(page)).toHaveText(`${t.names[B.starts]} start`);
    await expect(byId(page, 'word-counts')).toBeVisible();
    await expect(page.getByTestId('word-board').locator('[data-index]')).toHaveCount(25);
    await expect(byId(page, 'clue-line')).toHaveCount(0);
    await expect(byId(page, 'tip')).toHaveCount(0);
    await expect(byId(page, 'dnd-tip')).toHaveCount(0);
    await expect(mainButton(page)).toHaveText('Start');
    expect(await moveTypes(page), '"Show me the board first" deals').toEqual(['deal']);
    // A tap on a cell records nothing.
    await waitGuards(page);
    await cellAt(page, 0).click({ force: true });
    expect(await moveTypes(page)).toEqual(['deal']);
    // The menu (SWD-110 v3.7 order): Pause first; New board directly above the leave group.
    expect((await menuOf(page)).filter((x) => x !== '|')).toEqual(['Pause', 'New board', 'Home (keep this game)', 'End for tonight', 'How to play', 'Settings', 'History']);
  });

  test('"Start" leads to the pass screen (one phone) or the scan screen (two phones)', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'preview-1', preview: true });
    await tapMain(page, /^Start$/);
    await expect(byId(page, 'pass-name')).toBeVisible();
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'preview-2', preview: true });
    await tapMain(page, /^Start$/);
    await expect(scanHeading(page)).toBeVisible();
  });

  test.describe('360 × 640', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('the preview fits wherever guessing fits: no page scrolling', async ({ page }) => {
      await host(page, { phones: 'One phone', boards: [CODE], seed: 'preview-fit', preview: true });
      await expect(mainButton(page)).toHaveText('Start');
      expect(await pageScrolls(page)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// S7: the scan screen (SWD-033, 116 wording 1, 104)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-033: two or three phones, scan the map', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('two phones, portrait, in this order: heading, the clue-giver line, other-phone-line, "Guessers: don\'t scan this one!", the QR (200 × 200), the code, board-check, mismatch-line, dnd-tip; main "The map phone has the map"', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'scan-2' });
    const t = await teamsOf(page);
    const cgO = clueGiver(t, 'orange'), cgT = clueGiver(t, 'teal');
    const heading = page.getByRole('heading', { level: 1, name: 'Clue givers: scan to get the secret map' });
    const line = page.getByText(`${cgO} and ${cgT} give clues for different teams but share one map phone, as at a real table: sit side by side.`, { exact: true });
    const otherPhone = byId(page, 'other-phone-line');
    const guessers = page.getByText("Guessers: don't scan this one!", { exact: true });
    const qr = byId(page, 'map-qr');
    const code = byId(page, 'map-code-text');
    const check = byId(page, 'board-check');
    const mismatch = byId(page, 'mismatch-line');
    const dnd = byId(page, 'dnd-tip');
    await expect(otherPhone).toHaveText('On the other phone: open the app, tap Join a game, scan this.');
    await expect(code).toHaveText(`Or type this code: ${shown(CODE)}`);
    await expect(check).toHaveText(`The map phone should start with: ${B.words.slice(0, 3).join(' · ')}`);
    await expect(mismatch).toHaveText('Doesn\'t match? Scan this code again.');
    await expect(dnd).toHaveText("Tip: turn on Do Not Disturb so messages don't pop up on the board.");
    await expect(qr).toHaveAccessibleName(`Map code ${shown(CODE)}`);
    const q = await box(qr);
    expect(Math.abs(q.width - 200) + Math.abs(q.height - 200), 'QR 200 × 200').toBeLessThanOrEqual(1);
    const ys: number[] = [];
    for (const l of [heading, line, otherPhone, guessers, qr, code, check, mismatch, dnd]) ys.push((await box(l)).y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]!, `item ${i} below item ${i - 1}`).toBeGreaterThan(ys[i - 1]!);
    await expect(mainButton(page)).toHaveText('The map phone has the map');
    await expect(byId(page, 'waiting-line'), 'no waiting line on the scan screen').toHaveCount(0);
    // The QR encodes <origin><BASE_URL>#map=<code>&t=<pair id> (no &p=own with two phones).
    const text = await readDrawnQr(qr);
    expect(text).toBe(`${new URL('./', page.url()).href}#map=${CODE}&t=${t.names.id}`);
  });

  test('three phones: "<orange cg> (<orange>, orange) and <teal cg> (<teal>, teal): scan on your own phones.", "On your phones: …", board-check "The map phones should start with: …", main "Both have the map"', async ({ page }) => {
    await host(page, { phones: 'Three phones', boards: [CODE], seed: 'scan-3' });
    const t = await teamsOf(page);
    await expect(page.getByText(`${clueGiver(t, 'orange')} (${t.names.orange}, orange) and ${clueGiver(t, 'teal')} (${t.names.teal}, teal): scan on your own phones.`, { exact: true })).toBeVisible();
    await expect(byId(page, 'other-phone-line')).toHaveText('On your phones: open the app, tap Join a game, scan this.');
    await expect(byId(page, 'board-check')).toHaveText(`The map phones should start with: ${B.words.slice(0, 3).join(' · ')}`);
    await expect(mainButton(page)).toHaveText('Both have the map');
    // The main opens the starting team's clue screen; nothing but the deal is recorded.
    await tapMain(page, /^Both have the map$/);
    await expect(turnHeading(page)).toHaveText(`${t.names[B.starts]}, your turn`);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    expect(await moveTypes(page)).toEqual(['deal']);
  });

  test('a reload before the board\'s first clue shows the scan screen again; while paused the QR is removed from the DOM', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'scan-reload' });
    await tapMain(page, /^The map phone has the map$/);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await page.reload();
    await expect(scanHeading(page)).toBeVisible();
    await waitGuards(page);
    await page.getByTestId('pause-button').click();
    await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
    await expect(byId(page, 'map-qr')).toHaveCount(0);
    await tapMain(page, /^Carry on$/);
    await expect(byId(page, 'map-qr')).toBeVisible();
  });

  test.describe('568 × 320', () => {
    test.use({ viewport: { width: 568, height: 320 } });
    test('landscape: QR 160 × 160 at the left (8 px margin); main 358 × 60 at the bottom right; no page scrolling', async ({ page }) => {
      await host(page, { phones: 'Two phones', boards: [CODE], seed: 'scan-568' });
      const q = await box(byId(page, 'map-qr'));
      expect(Math.abs(q.width - 160) + Math.abs(q.height - 160)).toBeLessThanOrEqual(1);
      expect(Math.abs(q.x - 8)).toBeLessThanOrEqual(0.6);
      const m = await box(mainButton(page));
      expect(Math.abs(m.width - 358) + Math.abs(m.height - 60)).toBeLessThanOrEqual(1);
      expect(Math.abs(568 - 16 - (m.x + m.width))).toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
    });
  });

  test.describe('812 × 375', () => {
    test.use({ viewport: { width: 812, height: 375 } });
    test('landscape: QR 200 × 200 at the left (16 px margin); no page scrolling', async ({ page }) => {
      await host(page, { phones: 'Three phones', boards: [CODE], seed: 'scan-812' });
      const q = await box(byId(page, 'map-qr'));
      expect(Math.abs(q.width - 200) + Math.abs(q.height - 200)).toBeLessThanOrEqual(1);
      expect(Math.abs(q.x - 16)).toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// P1: the pass screen (SWD-030, 126, 103, 104)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-030: one phone, pass to the clue giver', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('team bar; "<team>, your turn"; "Pass the phone to"; pass-name (DOM as typed, upper case by CSS, 48 px); "Clue giver for <team> (<colour>)"; waiting-line; dnd-tip; quiet "Start 90-second timer"; main "I\'m <name>"', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'pass' });
    const n = names(await teamsOf(page), B.starts);
    await expect(byId(page, 'team-bar')).toBeVisible();
    await expect(turnHeading(page)).toHaveText(`${n.T}, your turn`);
    await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
    const pn = byId(page, 'pass-name');
    await expect(pn).toHaveText(n.cg);
    expect(await pn.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
    expect(await fontPx(pn), 'a short name: 48 px').toBe(48);
    await expect(page.getByText(`Clue giver for ${n.T} (${n.colour})`, { exact: true })).toBeVisible();
    await expect(byId(page, 'waiting-line')).toHaveText(`While you wait, ${n.O}: guess how many words ${n.cg}'s clue will be for.`);
    await expect(byId(page, 'dnd-tip')).toHaveText("Tip: turn on Do Not Disturb so messages don't pop up on the board.");
    await expect(byId(page, 'recap-line'), 'no recap on the board\'s first turn').toHaveCount(0);
    await expect(quiet(page, 'Start 90-second timer')).toBeVisible();
    await expect(mainButton(page)).toHaveText(`I'm ${n.cg}`);
    expect(await moveTypes(page)).toEqual(['deal']);
  });

  test('a 16-character clue giver name shrinks in 1 px steps to fit one line, floor 32 px, and wraps onto 2 lines at 32 px only if it still doesn\'t fit', async ({ page }) => {
    const long = ['Bhagyalakshmiaaa', 'Venkataramanaaaa', 'Subramaniamaaaaa', 'Krishnamurthiaaa'];
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'pass-long', names: long });
    const pn = byId(page, 'pass-name');
    const m = await pn.evaluate((el) => {
      const cs = getComputedStyle(el);
      const range = document.createRange(); range.selectNodeContents(el);
      return { size: parseFloat(cs.fontSize), lines: new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size, sw: el.scrollWidth, cw: el.clientWidth };
    });
    expect(Number.isInteger(m.size) && m.size >= 32 && m.size <= 48, `pass-name ${m.size} px`).toBe(true);
    expect(m.sw, 'nothing cut off').toBeLessThanOrEqual(m.cw + 1);
    if (m.size > 32) expect(m.lines, 'one line above the floor').toBe(1);
    expect(m.lines).toBeLessThanOrEqual(2);
  });

  test.describe('320 × 568, Larger text on', () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test('when space runs short dnd-tip hides first, then waiting-line, then recap-line; the heading, "Pass the phone to", pass-name, the clue-giver line, the timer button and the main never hide; the main stays fixed on screen', async ({ page }) => {
      await host(page, { phones: 'One phone', boards: [CODE], seed: 'pass-short', storage: { 'pgn.pref.largerText': true } });
      for (const l of [turnHeading(page), page.getByText('Pass the phone to', { exact: true }), byId(page, 'pass-name'), quiet(page, 'Start 90-second timer')]) await expect(l).toBeAttached();
      const shownNow = async (id: string) => (await byId(page, id).count()) > 0 && (await byId(page, id).isVisible());
      // Hide order: dnd-tip first, then waiting-line, so a shown waiting-line means nothing hid yet or only dnd-tip did.
      expect(!(await shownNow('dnd-tip')) || (await shownNow('waiting-line')), 'dnd-tip hides before waiting-line').toBe(true);
      await expect(page.getByText(/^Clue giver for .+ \((orange|teal)\)$/), 'the clue-giver line never hides').toBeVisible();
      const m = await box(mainButton(page));
      expect(m.y + m.height, 'main on screen').toBeLessThanOrEqual(568 + 0.5);
      expect(await pageScrolls(page), 'the content scrolls inside, not the page').toBe(false);
    });
  });
});

test.describe('SWD-126: a job for the waiting team', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('two phones: waiting-line on the clue screen; one phone: on the pass screen, not on the clue screen', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'wait-2' });
    await toClueScreen(page, 'Two phones');
    const n = names(await teamsOf(page), B.starts);
    await expect(byId(page, 'waiting-line')).toHaveText(`While you wait, ${n.O}: guess how many words ${n.cg}'s clue will be for.`);
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'wait-1' });
    await expect(byId(page, 'waiting-line')).toBeVisible();
    await toClueScreen(page, 'One phone');
    await expect(byId(page, 'waiting-line')).toHaveCount(0);
  });
});

test.describe('SWD-104: the Do Not Disturb tip', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('one phone: on the first pass screen, also after a reload, until the evening\'s first mapSeen; not on the next pass screen; never with the "One word, one number" tip', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'dnd-1' });
    await expect(byId(page, 'dnd-tip')).toBeVisible();
    await page.reload();
    await expect(byId(page, 'dnd-tip')).toBeVisible();
    await toClueScreen(page, 'One phone');
    await expect(byId(page, 'tip')).toHaveText('One word, one number. No faces, no pointing!');
    await expect(byId(page, 'dnd-tip')).toHaveCount(0);
    await giveClue(page, 1);
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await expect(byId(page, 'pass-name')).toBeVisible();
    await expect(byId(page, 'dnd-tip')).toHaveCount(0);
  });

  test('two phones: on the first scan screen until the evening\'s first clue (also after a reload); not on "Show the map code again"', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'dnd-2' });
    await expect(byId(page, 'dnd-tip')).toBeVisible();
    await tapMain(page, /^The map phone has the map$/);
    await page.reload();
    await expect(scanHeading(page)).toBeVisible();
    await expect(byId(page, 'dnd-tip'), 'before the first clue, after a reload').toBeVisible();
    await toClueScreen(page, 'Two phones');
    await giveClue(page, 1);
    await waitGuards(page);
    await menuButton(page).click();
    await page.getByRole('menuitem', { name: 'Show the map code again', exact: true }).click();
    await expect(scanHeading(page)).toBeVisible();
    await expect(byId(page, 'dnd-tip')).toHaveCount(0);
  });
});

test.describe('SWD-103: the recap line', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const recap = (page: Page) => byId(page, 'recap-line');

  test('one phone, on the pass screen from the board\'s second turn: a nobody\'s word → "Last turn: <team> found 1 word; <WORD> was nobody\'s."', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'recap-nobody', n: 2 });
    const t = await teamsOf(page);
    await guess(page, ownOf(B.starts)[0]!);
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[B.starts]} found 1 word; ${B.words[NOBODY[0]!]} was nobody's.`);
    // It shows again after a reload.
    await page.reload();
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[B.starts]} found 1 word; ${B.words[NOBODY[0]!]} was nobody's.`);
  });

  test('the other team\'s word → "…found 0 words; <WORD> was yours!"; "End our turn" → "…found 2 words; they stopped."', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'recap-yours', n: 3 });
    const t = await teamsOf(page);
    const theirs = ownOf(other(B.starts))[0]!;
    await guess(page, theirs);
    await tapMain(page, /^Other team's turn$/);
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[B.starts]} found 0 words; ${B.words[theirs]} was yours!`);
    await toClueScreen(page, 'One phone');
    await giveClue(page, 3);
    const mine = ownOf(other(B.starts));
    await guess(page, mine[1]!);
    await guess(page, mine[2]!);
    await endOurTurn(page);
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[other(B.starts)]} found 2 words; they stopped.`);
  });

  test('allowance used up on the team\'s own word → "…found 2 words; they used all their guesses."; the last allowed guess on a nobody\'s word → that word\'s line', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'recap-all', n: 1 });
    const t = await teamsOf(page);
    const mine = ownOf(B.starts);
    await guess(page, mine[0]!);
    await guess(page, mine[1]!);
    await expect(resultLine(page)).toHaveText(`✓ ${clueGiver(t, B.starts)}'s clue works! That's all your guesses.`);
    await tapMain(page, /^Other team's turn$/);
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[B.starts]} found 2 words; they used all their guesses.`);
    await toClueScreen(page, 'One phone');
    await giveClue(page, 1);
    const theirs = ownOf(other(B.starts));
    await guess(page, theirs[0]!);
    await guess(page, NOBODY[0]!); // the last allowed guess, on a nobody's word
    await tapMain(page, /^Other team's turn$/);
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[other(B.starts)]} found 1 word; ${B.words[NOBODY[0]!]} was nobody's.`);
  });

  test('the Landmine (Lose your turn) → "…; they stepped on the Landmine."; two phones: on the clue screen', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'recap-mine', n: 2, landmine: 'Lose your turn' });
    const t = await teamsOf(page);
    await guess(page, LANDMINE);
    await tapMain(page, /^Other team's turn$/);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await expect(recap(page)).toHaveText(`Last turn: ${t.names[B.starts]} found 0 words; they stepped on the Landmine.`);
  });

  for (const larger of [false, true]) {
    test(`fits in ${larger ? 3 : 2} lines${larger ? ' with Larger text' : ''} (pass screen, 390 × 844)`, async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: `recap-fit-${larger}`, n: 1, storage: larger ? { 'pgn.pref.largerText': true } : {} });
      await guess(page, NOBODY[0]!);
      await tapMain(page, /^Other team's turn$/);
      const r = recap(page);
      await expect(r).toBeVisible();
      const m = await r.evaluate((el) => ({ h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.5, sw: el.scrollWidth, cw: el.clientWidth }));
      expect(m.h).toBeLessThanOrEqual((larger ? 3 : 2) * m.lh + 1);
      expect(m.sw).toBeLessThanOrEqual(m.cw + 1);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// P2: the private map (SWD-031, 032, 113, and SWD-121's private-map clock)
// ---------------------------------------------------------------------------------------------------------------------

async function toPrivateMap(page: Page, seed: string) {
  await host(page, { phones: 'One phone', boards: [CODE], seed });
  const t = await teamsOf(page);
  await tapMain(page, /^I'm /);
  await expect(holdPad(page)).toBeVisible();
  return names(t, B.starts);
}

test.describe('SWD-031: one phone, the private map', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('before the first show: heading <NAME>, private-line, "You give clues for <team> (<colour>)", counts, pad "Tap to see the map", "Not <name>? Go back"; no map in the page, no main, no menu, no team bar, no pause', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm-before');
    await expect(page.getByRole('heading', { level: 1, name: n.cg })).toBeVisible();
    await expect(byId(page, 'private-line')).toHaveText(`Only ${n.cg} should see this screen.`);
    await expect(page.getByText(`You give clues for ${n.T} (${n.colour})`, { exact: true })).toBeVisible();
    await expect(byId(page, 'word-counts')).toBeVisible();
    await expect(holdPad(page)).toHaveText('Tap to see the map');
    expect(await holdPad(page).getAttribute('aria-pressed')).toBeNull();
    await expect(quiet(page, `Not ${n.cg}? Go back`)).toBeVisible();
    await expect(mapCells(page)).toHaveCount(0);
    await expect(mainButton(page)).toHaveCount(0);
    await expect(menuButton(page)).toHaveCount(0);
    await expect(byId(page, 'team-bar')).toHaveCount(0);
    await expect(byId(page, 'pause-button')).toHaveCount(0);
    // No kind of any word anywhere in the page before the show.
    expect(await page.evaluate(() => document.querySelectorAll('[data-testid="map-cell"]').length)).toBe(0);
  });

  test('a tap shows the map: every word with its kind (accessible name), pad "Tap to hide", "Our words" and "↻ Flip", "Someone saw the map", main "I have my clue"; "Tap to hide" removes the map, the main stays', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm-show');
    await waitGuards(page);
    await holdPad(page).click();
    const cells = await cellsOf(mapCells(page));
    expect(cells.map((c) => c.word)).toEqual(B.words);
    expect(cells.map((c) => kindOf(c.name))).toEqual(B.kinds);
    await expect(holdPad(page)).toHaveText('Tap to hide');
    await expect(quiet(page, 'Our words')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flip the board', exact: true })).toHaveText('↻ Flip');
    await expect(quiet(page, 'Someone saw the map')).toBeVisible();
    await expect(quiet(page, `Not ${n.cg}? Go back`)).toHaveCount(0);
    await expect(mainButton(page)).toHaveText('I have my clue');
    // The map key (v3.7): two lines under the map.
    const key = byId(page, 'map-key');
    await expect(key).toContainText(`${(await teamsOf(page)).names.orange}`);
    await expect(key).toContainText("nobody's word");
    await expect(key).toContainText('Landmine: never guess');
    await page.clock.runFor(600);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(0);
    await expect(holdPad(page)).toHaveText('Tap to see the map');
    await expect(quiet(page, 'Our words')).toHaveCount(0);
    await expect(quiet(page, 'Someone saw the map')).toHaveCount(0);
    await expect(mainButton(page), 'the main stays').toHaveText('I have my clue');
    expect(await moveTypes(page), 'nothing recorded yet').toEqual(['deal']);
  });

  test('pad taps within 500 ms of the last are ignored', async ({ page }) => {
    await toPrivateMap(page, 'pm-double');
    await waitGuards(page);
    await freezeClock(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(450);
    await holdPad(page).click();
    await expect(mapCells(page), 'a second tap at 450 ms is ignored').toHaveCount(25);
    await page.clock.runFor(100);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(0);
  });

  test('"Our words": h2 "Your words (N left)", the team\'s face-down words as li in cell order, avoid-line "Never guess: <WORD> (the Landmine)"; the button reads "Whole map"', async ({ page }) => {
    await toPrivateMap(page, 'pm-list');
    await waitGuards(page);
    await holdPad(page).click();
    await quiet(page, 'Our words').click();
    const list = byId(page, 'our-words');
    const mine = ownOf(B.starts);
    await expect(list.getByRole('heading', { level: 2 })).toHaveText(`Your words (${mine.length} left)`);
    await expect(list.getByRole('listitem')).toHaveText(mine.map((i) => B.words[i]!));
    expect(await fontPx(list.getByRole('listitem').first())).toBe(24);
    await expect(byId(page, 'avoid-line')).toHaveText(`Never guess: ${B.words[LANDMINE]} (the Landmine)`);
    await expect(quiet(page, 'Whole map')).toBeVisible();
    await quiet(page, 'Whole map').click();
    await expect(mapCells(page)).toHaveCount(25);
  });

  test('"I have my clue" removes the map, records mapSeen once and opens the clue screen', async ({ page }) => {
    await toPrivateMap(page, 'pm-seen');
    await waitGuards(page);
    await holdPad(page).click();
    await tapMain(page, /^I have my clue$/);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await expect(mapCells(page)).toHaveCount(0);
    expect(await moveTypes(page)).toEqual(['deal', 'mapSeen']);
    // "See the map again" and back: no second mapSeen.
    await waitGuards(page);
    await quiet(page, 'See the map again').click();
    await expect(mapCells(page)).toHaveCount(25);
    await tapMain(page, /^Back to my clue$/);
    expect(await moveTypes(page)).toEqual(['deal', 'mapSeen']);
  });

  test.describe('360 × 640', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('fixed places (v3.6, v3.7): the pad (60 px, never the main look) and the main slot don\'t move when the map shows or hides; no page scrolling, shown or hidden', async ({ page }) => {
      await toPrivateMap(page, 'pm-fit');
      const pad0 = await box(holdPad(page));
      expect(Math.abs(pad0.height - 60), `pad ${pad0.height} px`).toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
      await waitGuards(page);
      await holdPad(page).click();
      const pad1 = await box(holdPad(page));
      expect(Math.abs(pad1.y - pad0.y), 'the pad stays in place').toBeLessThanOrEqual(0.5);
      expect(Math.abs(pad1.height - 60)).toBeLessThanOrEqual(0.6);
      const main1 = await box(mainButton(page));
      expect(Math.abs(main1.height - 60)).toBeLessThanOrEqual(0.6);
      expect(await pageScrolls(page)).toBe(false);
      await page.clock.runFor(600);
      await holdPad(page).click();
      expect(Math.abs((await box(holdPad(page))).y - pad0.y)).toBeLessThanOrEqual(0.5);
      expect(Math.abs((await box(mainButton(page))).y - main1.y), 'the main stays in place').toBeLessThanOrEqual(0.5);
    });
  });

  test.describe('320 × 568 (narrow portrait, Full board)', () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test('a tap on the pad shows the our-words list, not the grid; the main appears at that first show', async ({ page }) => {
      await toPrivateMap(page, 'pm-narrow');
      await expect(byId(page, 'turn-sideways')).toBeVisible();
      await waitGuards(page);
      await holdPad(page).click();
      await expect(byId(page, 'our-words')).toBeVisible();
      await expect(mapCells(page)).toHaveCount(0);
      await expect(mainButton(page)).toHaveText('I have my clue');
    });
  });
});

test.describe('SWD-032: leaving a map screen (the private map)', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('hidden: privacy-cover and the map removed in the same task; back: the pass screen for the same player with "Welcome back." and the where-line', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm-hide');
    await waitGuards(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    const sameTask = await page.evaluate(async () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve(); await Promise.resolve();
      return {
        cover: !!document.querySelector('[data-testid="privacy-cover"]'),
        cells: document.querySelectorAll('[data-testid="map-cell"]').length,
      };
    });
    expect(sameTask).toEqual({ cover: true, cells: 0 });
    await showApp(page);
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(whereLine(page)).toHaveText(`Turn 1 · clue for ${n.T}`);
    await expect(byId(page, 'pass-name')).toHaveText(n.cg);
    await expect(mapCells(page)).toHaveCount(0);
  });

  test('a reload on the private map does the same', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm-reload');
    await waitGuards(page);
    await holdPad(page).click();
    await page.reload();
    await expect(page.getByText('Welcome back.', { exact: true })).toBeVisible();
    await expect(byId(page, 'pass-name')).toHaveText(n.cg);
    await expect(mapCells(page)).toHaveCount(0);
  });
});

test.describe('SWD-113: the private map, wrong person and someone looking', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('"Not <name>? Go back" returns to the pass screen without "Welcome back."; nothing recorded', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm-back');
    await quiet(page, `Not ${n.cg}? Go back`).click();
    await expect(byId(page, 'pass-name')).toHaveText(n.cg);
    await expect(page.getByText('Welcome back.', { exact: true })).toHaveCount(0);
    expect(await moveTypes(page)).toEqual(['deal']);
  });

  test('"Someone saw the map" removes the map and opens the New board dialog; "Keep playing" returns with the map hidden; "New board" deals', async ({ page }) => {
    await toPrivateMap(page, 'pm-saw');
    await waitGuards(page);
    await holdPad(page).click();
    await quiet(page, 'Someone saw the map').click();
    await expect(mapCells(page)).toHaveCount(0);
    const d = page.getByRole('dialog', { name: /^New board\?/ });
    await expect(d).toBeVisible();
    await waitGuards(page);
    await d.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(holdPad(page)).toHaveText('Tap to see the map');
    await expect(mapCells(page)).toHaveCount(0);
    await holdPad(page).click();
    await quiet(page, 'Someone saw the map').click();
    await waitGuards(page);
    await page.getByRole('dialog', { name: /^New board\?/ }).getByRole('button', { name: 'New board', exact: true }).click();
    await expect(byId(page, 'pass-name')).toBeVisible();
    expect((await moveTypes(page)).filter((m) => m === 'dealNew')).toHaveLength(1);
  });
});

test.describe('SWD-121 (the private map): the map hides after 60 s', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('hide-warning "Still looking? Tap to keep the map" from 50 000 ms; its first tap only restarts the clock; at 60 000 ms the map is removed and the pad reads "Tap to see the map"', async ({ page }) => {
    await toPrivateMap(page, 'pm-60');
    await waitGuards(page);
    await freezeClock(page);
    await holdPad(page).click();
    await page.clock.runFor(49_900);
    await expect(byId(page, 'hide-warning')).toHaveCount(0);
    await page.clock.runFor(200);
    await expect(byId(page, 'hide-warning')).toHaveText('Still looking? Tap to keep the map');
    await holdPad(page).click(); // only restarts the clock: the map stays
    await expect(byId(page, 'hide-warning')).toHaveCount(0);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(59_900);
    await expect(mapCells(page)).toHaveCount(25);
    await page.clock.runFor(200);
    await expect(mapCells(page)).toHaveCount(0);
    await expect(holdPad(page)).toHaveText('Tap to see the map');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// P3: the clue screen (SWD-040, 101, 118)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-040: the clue', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('heading, clue-prompt "<name>, say your clue out loud. How many words is it for?", 11 keys (∞ named "As many as you like", "many" under it), anyone-line and clue-help under the keys, the input, counts, the tip; main "Pick a number" (disabled)', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue' });
    const n = names(await teamsOf(page), B.starts);
    await toClueScreen(page, 'One phone');
    await expect(turnHeading(page)).toHaveText(`${n.T}, your turn`);
    await expect(byId(page, 'clue-prompt')).toHaveText(`${n.cg}, say your clue out loud. How many words is it for?`);
    await expect(byId(page, 'clue-key')).toHaveCount(11);
    const inf = page.getByRole('button', { name: 'As many as you like', exact: true });
    await expect(inf).toContainText('∞');
    await expect(inf).toContainText('many');
    await expect(byId(page, 'anyone-line')).toHaveText('Anyone can tap the number.');
    await expect(byId(page, 'clue-help')).toHaveText('2 means up to 3 guesses. 0 or ∞: as many as you like.');
    const keysBottom = Math.max(...(await byId(page, 'clue-key').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom))));
    const anyone = await box(byId(page, 'anyone-line')), help = await box(byId(page, 'clue-help'));
    expect(anyone.y, 'anyone-line under the keys').toBeGreaterThanOrEqual(keysBottom - 0.5);
    expect(help.y, 'clue-help under anyone-line').toBeGreaterThan(anyone.y);
    const input = clueWord(page);
    await expect(input).toHaveAttribute('maxlength', '24');
    await expect(input).toHaveAttribute('autocapitalize', 'off');
    await expect(byId(page, 'word-counts')).toBeVisible();
    await expect(byId(page, 'tip')).toHaveText('One word, one number. No faces, no pointing!');
    await expect(quiet(page, 'See the map again')).toBeVisible();
    await expect(mainButton(page)).toHaveText('Pick a number');
    await expect(mainButton(page)).toBeDisabled();
    for (const k of await byId(page, 'clue-key').all()) {
      const b = await box(k);
      expect(Math.round(b.height), 'keys 56 px tall').toBe(56);
    }
    expect(await pageScrolls(page), 'no scrolling at 390 × 844').toBe(false);
  });

  test('a tap selects a key; another moves the pick; the main names the number: "Clue for 2: start guessing", "Clue for 0: …", "Clue for ∞: …"', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue-keys' });
    await toClueScreen(page, 'One phone');
    await waitGuards(page);
    await clueKey(page, 2).click();
    await expect(clueKey(page, 2)).toHaveAttribute('aria-pressed', 'true');
    await expect(mainButton(page)).toHaveText('Clue for 2: start guessing');
    await clueKey(page, 0).click();
    await expect(clueKey(page, 2)).toHaveAttribute('aria-pressed', 'false');
    await expect(clueKey(page, 0)).toHaveAttribute('aria-pressed', 'true');
    await expect(mainButton(page)).toHaveText('Clue for 0: start guessing');
    await page.getByRole('button', { name: 'As many as you like', exact: true }).click();
    await expect(mainButton(page)).toHaveText('Clue for ∞: start guessing');
  });

  test('the word is recorded trimmed (inner spaces and case kept); Enter does not submit; an empty word is left out', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue-word' });
    await toClueScreen(page, 'One phone');
    await waitGuards(page);
    await clueKey(page, 2).click();
    await clueWord(page).fill('  Ice Cream  ');
    await clueWord(page).press('Enter');
    await expect(byId(page, 'clue-prompt'), 'Enter does not submit').toBeVisible();
    expect(await moveTypes(page)).not.toContain('clue');
    await tapMain(page, /^Clue for 2: start guessing$/);
    expect((await moves(page)).find((m) => m.type === 'clue')).toEqual({ type: 'clue', n: 2, word: 'Ice Cream' });

    await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue-noword' });
    await toClueScreen(page, 'One phone');
    await clueWord(page).fill('   ');
    await giveClue(page, 'inf');
    expect((await moves(page)).find((m) => m.type === 'clue')).toEqual({ type: 'clue', n: 'inf' });
  });

  test('"See the map again" opens the private map shown, main "Back to my clue", which returns with the number and word kept; nothing recorded', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue-again' });
    await toClueScreen(page, 'One phone');
    await waitGuards(page);
    await clueKey(page, 4).click();
    await clueWord(page).fill('Spice');
    const before = await moveTypes(page);
    await quiet(page, 'See the map again').click();
    await expect(mapCells(page)).toHaveCount(25);
    await tapMain(page, /^Back to my clue$/);
    await expect(clueKey(page, 4)).toHaveAttribute('aria-pressed', 'true');
    await expect(clueWord(page)).toHaveValue('Spice');
    expect(await moveTypes(page)).toEqual(before);
  });

  test('the anyone-line and the tip are only on the evening\'s first turn', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'clue-first', n: 1 });
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await expect(byId(page, 'anyone-line')).toHaveCount(0);
    await expect(byId(page, 'tip')).toHaveCount(0);
  });

  test.describe('320 × 568', () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test('keys 56 × 56 with 2 px gaps; the main stays fixed on screen; the page doesn\'t scroll (the content scrolls inside)', async ({ page }) => {
      await host(page, { phones: 'One phone', boards: [CODE], seed: 'clue-320' });
      await toClueScreen(page, 'One phone');
      const k0 = await box(clueKey(page, 0)), k1 = await box(clueKey(page, 1));
      expect(Math.round(k0.width)).toBe(56);
      expect(Math.round(k1.x - (k0.x + k0.width))).toBe(2);
      const m = await box(mainButton(page));
      expect(m.y + m.height).toBeLessThanOrEqual(568 + 0.5);
      expect(await pageScrolls(page)).toBe(false);
    });
  });

  test.describe('568 × 320', () => {
    test.use({ viewport: { width: 568, height: 320 } });
    test('keys in one row of 11 at 44 × 44 with 4 px gaps', async ({ page }) => {
      await host(page, { phones: 'Two phones', boards: [CODE], seed: 'clue-568' });
      await toClueScreen(page, 'Two phones');
      const keys = await byId(page, 'clue-key').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
      expect(keys).toHaveLength(11);
      for (const k of keys) { expect(Math.round(k.w)).toBe(44); expect(Math.round(k.h)).toBe(44); expect(Math.abs(k.y - keys[0]!.y)).toBeLessThanOrEqual(0.5); }
      for (let i = 1; i < keys.length; i++) expect(Math.round(keys[i]!.x - keys[i - 1]!.x - keys[i - 1]!.w)).toBe(4);
    });
  });
});

test.describe('SWD-101: the clue word warning', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('equals, contains or is contained in a face-down word (≥ 3 letters, reduced to a–z): "Careful: <Word> is a word on the board."; 2 letters, other scripts and turned-over words never warn; it never blocks', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'warn' });
    await toClueScreen(page, 'Two phones');
    const warning = byId(page, 'clue-warning');
    const first = B.words[0]!; // the first face-down word in data-index order
    const lower = first.toLowerCase();
    await clueWord(page).fill(lower);
    await expect(warning).toHaveText(`Careful: ${first} is a word on the board.`);
    await clueWord(page).fill(`${lower.split('').join('-')}s`); // "b-a-ts": letters only, contains the word
    await expect(warning).toHaveText(`Careful: ${first} is a word on the board.`);
    await clueWord(page).fill(lower.slice(0, 2));
    await expect(warning, 'two letters never warn').toHaveCount(0);
    await clueWord(page).fill('मानसून');
    await expect(warning).toHaveCount(0);
    await clueWord(page).fill(lower);
    await waitGuards(page);
    await clueKey(page, 1).click();
    await expect(mainButton(page), 'the warning never blocks').toBeEnabled();
    await tapMain(page, /^Clue for 1: start guessing$/);
    // Turn cell 0 over, then on the next team's clue screen its word no longer warns.
    if (B.kinds[0] === 'landmine') return; // the board's first word is the Landmine: no reveal (never for CODE)
    await guess(page, 0);
    if (await mainButton(page).filter({ hasText: /: Reveal/ }).count()) await endOurTurn(page);
    else await tapMain(page, /^Other team's turn$/);
    await expect(byId(page, 'clue-prompt')).toBeVisible();
    await clueWord(page).fill(lower);
    await expect(warning, 'a turned-over word never warns').toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// P4: guessing (SWD-041, 042, 043, 118, 122, 125, 102)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-041 / SWD-118: guessing and the allowance', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('clue-line "Clue: 2"; guess-line "3 guesses left (2 + 1 extra)", then "2 guesses left", "1 guess left"; until the first reveal "Change clue" and "Clue not allowed?" side by side, then "End our turn"; the third own word ends the turn', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'allow', n: 2 });
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
    await expect(byId(page, 'guess-line')).toHaveText('3 guesses left (2 + 1 extra)');
    const change = await box(quiet(page, 'Change clue')), dispute = await box(quiet(page, 'Clue not allowed?'));
    expect(Math.abs(change.y - dispute.y), 'side by side').toBeLessThanOrEqual(0.5);
    expect(Math.abs(change.height - 48)).toBeLessThanOrEqual(0.6);
    await expect(quiet(page, 'End our turn')).toHaveCount(0);
    const mine = ownOf(B.starts);
    await guess(page, mine[0]!);
    await expect(byId(page, 'guess-line')).toHaveText('2 guesses left');
    await expect(quiet(page, 'Change clue')).toHaveCount(0);
    await expect(quiet(page, 'End our turn')).toBeVisible();
    await guess(page, mine[1]!);
    await expect(byId(page, 'guess-line')).toHaveText('1 guess left');
    await guess(page, mine[2]!);
    await expect(resultLine(page)).toHaveText(`✓ ${clueGiver(teams, B.starts)}'s clue works! That's all your guesses.`);
    await expect(mainButton(page)).toHaveText("Other team's turn");
    expect((await moveTypes(page)).filter((m) => m === 'reveal')).toHaveLength(3);
  });

  test('a clue with a word: clue-line DOM "<Word> · 2" shown upper case; clue 1: "2 guesses left (1 + 1 extra)"; 0 and ∞: "Guess as many as you like"', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'clue-line', n: 1, word: 'Spice' });
    await expect(byId(page, 'clue-line')).toHaveText('Spice · 1');
    expect(await shownUpper(byId(page, 'clue-line'), 'Spice'), 'the word upper case by CSS').toBe(true);
    await expect(byId(page, 'guess-line')).toHaveText('2 guesses left (1 + 1 extra)');
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'clue-line-0', n: 0 });
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 0');
    await expect(byId(page, 'guess-line')).toHaveText('Guess as many as you like');
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'clue-line-inf', n: 'inf', word: 'Rain' });
    await expect(byId(page, 'clue-line')).toHaveText('Rain · ∞');
  });

  test('"Change clue" opens the clue screen with the number and word selected and "Keep my clue"; "Keep my clue" returns unchanged; confirming records a replacing clue', async ({ page }) => {
    await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'change', n: 2, word: 'Spice' });
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await expect(clueKey(page, 2)).toHaveAttribute('aria-pressed', 'true');
    await expect(clueWord(page)).toHaveValue('Spice');
    await quiet(page, 'Keep my clue').click();
    await expect(byId(page, 'clue-line')).toHaveText('Spice · 2');
    expect((await moveTypes(page)).filter((m) => m === 'clue')).toHaveLength(1);
    await waitGuards(page);
    await quiet(page, 'Change clue').click();
    await waitGuards(page);
    await clueKey(page, 3).click();
    await clueWord(page).fill('Smoke');
    await tapMain(page, /^Clue for 3: start guessing$/);
    await expect(byId(page, 'clue-line')).toHaveText('Smoke · 3');
    await expect(byId(page, 'guess-line')).toHaveText('4 guesses left (3 + 1 extra)');
    expect((await moves(page)).filter((m) => m.type === 'clue')).toEqual([{ type: 'clue', n: 2, word: 'Spice' }, { type: 'clue', n: 3, word: 'Smoke' }]);
  });

  test('clue-history from the team\'s second clue: "Earlier: <WORD> 2 · 1", newest first, at most 3 (innerHeight ≥ 700); the menu\'s "Earlier clues" sheet lists every clue in force, oldest first', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'history', n: 2, word: 'Spice' });
    await expect(byId(page, 'clue-history')).toHaveCount(0);
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 1);
    await guess(page, NOBODY[1]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 1);
    await expect(byId(page, 'clue-history')).toHaveText('Earlier: Spice 2');
    await guess(page, NOBODY[2]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 2);
    await guess(page, NOBODY[3]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 3);
    await expect(byId(page, 'clue-history')).toHaveText('Earlier: 1 · Spice 2');
    await waitGuards(page);
    await menuButton(page).click();
    await page.getByRole('menuitem', { name: 'Earlier clues', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Earlier clues' });
    const T = teams.names[B.starts], O = teams.names[other(B.starts)];
    await expect(sheet.getByRole('listitem')).toHaveText([`${T}: Spice 2`, `${O}: 1`, `${T}: 1`, `${O}: 2`, `${T}: 3`]);
    await tapMain(page, /^Done$/);
    await expect(sheet).toHaveCount(0);
  });

  test.describe('360 × 640', () => {
    test.use({ viewport: { width: 360, height: 640 } });
    test('the fit: no page scrolling with the longest status lines (a 12-letter clue word with ∞); "↻ Flip" 72 × 44 at the right end of the counts row', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'fit-360', n: 'inf', word: 'Grandparents' });
      expect(await pageScrolls(page)).toBe(false);
      const flip = page.getByRole('button', { name: 'Flip the board', exact: true });
      await expect(flip).toHaveText('↻ Flip');
      const f = await box(flip), counts = await box(byId(page, 'word-counts'));
      expect(Math.abs(f.width - 72) + Math.abs(f.height - 44)).toBeLessThanOrEqual(1);
      expect(f.x, 'right of the counts').toBeGreaterThanOrEqual(counts.x + counts.width - 0.5);
    });
  });

  test.describe('390 × 844, Larger text on', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('no page scrolling', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'fit-390-larger', n: 2, storage: { 'pgn.pref.largerText': true } });
      expect(await pageScrolls(page)).toBe(false);
    });
  });
});

test.describe('SWD-042: pick, then confirm', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('face-down cells are buttons "<Word>, face down" with aria-pressed; a tap picks, a tap again unpicks, another moves the pick; main "<picker>: Reveal" (disabled) / "<picker>: Reveal <Word>"; the pick clears after the guess; turned-over cells are not buttons', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'pick', n: 'inf' });
    const picker = guessersOf(teams, B.starts)[0]!;
    const [a, b] = ownOf(B.starts);
    await waitGuards(page);
    await expect(cellAt(page, a!)).toHaveAccessibleName(`${B.words[a!]}, face down`);
    await expect(cellAt(page, a!)).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText(`${picker}: Reveal`);
    await expect(mainButton(page)).toBeDisabled();
    await cellAt(page, a!).click();
    await expect(cellAt(page, a!)).toHaveAttribute('aria-pressed', 'true');
    await expect(mainButton(page)).toHaveText(`${picker}: Reveal ${B.words[a!]}`);
    expect(await shownUpper(mainButton(page), B.words[a!]!), '<WORD> upper case by CSS, the name as typed').toBe(true);
    await cellAt(page, a!).click();
    await expect(cellAt(page, a!)).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText(`${picker}: Reveal`);
    await cellAt(page, a!).click();
    await cellAt(page, b!).click();
    await expect(cellAt(page, a!)).toHaveAttribute('aria-pressed', 'false');
    await expect(cellAt(page, b!)).toHaveAttribute('aria-pressed', 'true');
    await tapMain(page, /: Reveal /);
    await page.clock.runFor(400);
    expect((await moves(page)).filter((m) => m.type === 'reveal')).toEqual([{ type: 'reveal', cell: b }]);
    await expect(mainButton(page)).toHaveText(`${picker}: Reveal`);
    const turned = await cellAt(page, b!).evaluate((el) => ({ tag: el.tagName, role: el.getAttribute('role') }));
    expect(turned.tag === 'BUTTON' || turned.role === 'button', 'a turned-over cell is not a button').toBe(false);
  });
});

test.describe('SWD-043: what a guess does', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('own word with guesses left: "✓ <name>\'s clue works! 2 guesses left." then "… 1 guess left."; guessing continues; the counts update', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'own', n: 2 });
    const before = await byId(page, 'word-counts').getAttribute('aria-label');
    await guess(page, ownOf(B.starts)[0]!);
    await expect(resultLine(page)).toHaveText(`✓ ${clueGiver(teams, B.starts)}'s clue works! 2 guesses left.`);
    expect(await byId(page, 'word-counts').getAttribute('aria-label')).not.toBe(before);
    await guess(page, ownOf(B.starts)[1]!);
    await expect(resultLine(page)).toHaveText(`✓ ${clueGiver(teams, B.starts)}'s clue works! 1 guess left.`);
    await expect(mainButton(page)).toHaveText(/: Reveal$/);
  });

  test('clue 0 or ∞: "✓ <name>\'s clue works! Keep going, or end your turn."', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'own-0', n: 0 });
    await guess(page, ownOf(B.starts)[0]!);
    await expect(resultLine(page)).toHaveText(`✓ ${clueGiver(teams, B.starts)}'s clue works! Keep going, or end your turn.`);
  });

  test('a nobody\'s word: "Nobody\'s word. Other team\'s turn next." and turn over', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'nobody', n: 2 });
    await guess(page, NOBODY[0]!);
    await expect(resultLine(page)).toHaveText("Nobody's word. Other team's turn next.");
    await expect(mainButton(page)).toHaveText("Other team's turn");
  });

  test('the other team\'s word: "✗ The other team\'s word! It counts for them." and turn over; the result line names no one', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'theirs', n: 2 });
    await guess(page, ownOf(other(B.starts))[0]!);
    await expect(resultLine(page)).toHaveText("✗ The other team's word! It counts for them.");
    await expect(mainButton(page)).toHaveText("Other team's turn");
  });

  test('the Landmine with Lose your turn: "Boom! The Landmine. Your turn ends and the other team gets a free word."; one of the other team\'s words turns over (freeCell); the Landmine stays turned over and can\'t be picked', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'mine-turn', n: 2, landmine: 'Lose your turn' });
    await guess(page, LANDMINE);
    await expect(resultLine(page)).toHaveText('Boom! The Landmine. Your turn ends and the other team gets a free word.');
    const r = (await moves(page)).find((m) => m.type === 'reveal');
    expect(r.cell).toBe(LANDMINE);
    expect(ownOf(other(B.starts))).toContain(r.freeCell);
    await expect(cellAt(page, r.freeCell)).toHaveAccessibleName(new RegExp(`^${B.words[r.freeCell]}, ${other(B.starts)} team`));
    await expect(cellAt(page, LANDMINE)).toHaveAccessibleName(`${B.words[LANDMINE]}, the Landmine`);
    await expect(mainButton(page)).toHaveText("Other team's turn");
  });

  test('t = 0 to 300 ms: the cell turns; at t = 300 ms it shows turned over and the result line shows; taps do nothing until then', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'turn-300', n: 'inf' });
    const [a, b] = ownOf(B.starts);
    await waitGuards(page);
    await freezeClock(page);
    await cellAt(page, a!).click();
    await mainButton(page).click(); // t = 0
    await page.clock.runFor(150);
    await expect(resultLine(page)).toHaveCount(0);
    await cellAt(page, b!).click({ force: true }); // ignored
    await page.clock.runFor(200);
    await expect(resultLine(page)).toBeVisible();
    await expect(cellAt(page, a!)).toHaveAccessibleName(new RegExp(`^${B.words[a!]}, ${B.starts} team`));
    await expect(cellAt(page, b!), 'the tap during the turn picked nothing').toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('SWD-125: credit people, blame the board', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('the poker line "<name>: no hints, no faces!" for 3 000 ms from the guessing screen mounting after a clue, then "<team> guessing"; not after a reload; never announced', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'poker' });
    const n = names(await teamsOf(page), B.starts);
    await toClueScreen(page, 'Two phones');
    await waitGuards(page);
    await clueKey(page, 2).click();
    await waitGuards(page);
    await freezeClock(page);
    await mainButton(page).click();
    await expect(turnLine(page)).toHaveText(`${n.cg}: no hints, no faces!`);
    await page.clock.runFor(2900);
    await expect(turnLine(page)).toHaveText(`${n.cg}: no hints, no faces!`);
    await page.clock.runFor(200);
    await expect(turnLine(page)).toHaveText(`${n.T} guessing`);
    expect((await announcer(page).count()) ? (await announcer(page).textContent()) ?? '' : '').not.toContain('no hints');
    await page.clock.resume();
    await page.reload();
    await expect(turnLine(page)).toHaveText(`${n.T} guessing`);
  });
});

test.describe('SWD-122: the picker', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('picker = guessers[r mod n] (r = the team\'s earlier guessing turns on this board); the first-guess tip names them; turn-line has no picker; "Someone else taps Reveal" sets the picker for this turn only', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'picker', n: 1 });
    const g = guessersOf(teams, B.starts), h = guessersOf(teams, other(B.starts));
    await expect(mainButton(page)).toHaveText(`${g[0]}: Reveal`);
    await expect(byId(page, 'tip')).toHaveText(`Tap a word to suggest it. ${g[0]} taps Reveal (it takes turns).`);
    await page.clock.runFor(3100);
    await expect(turnLine(page)).toHaveText(`${teams.names[B.starts]} guessing`);
    // Someone else taps Reveal.
    await waitGuards(page);
    await menuButton(page).click();
    await page.getByRole('menuitem', { name: 'Someone else taps Reveal', exact: true }).click();
    const d = page.getByRole('dialog', { name: 'Who taps Reveal this turn?' });
    await expect(d.getByRole('button', { name: g[0]!, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(d.getByRole('button').filter({ hasNotText: 'Cancel' })).toHaveCount(g.length);
    await d.getByRole('button', { name: g[1]!, exact: true }).click();
    await expect(d).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(`${g[1]}: Reveal`);
    expect(await moveTypes(page), 'nothing recorded').toEqual(['deal', 'clue']);
    await guess(page, NOBODY[0]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 1);
    await expect(mainButton(page)).toHaveText(`${h[0]}: Reveal`);
    await expect(byId(page, 'tip'), 'the tip only on the evening\'s first guessing turn').toHaveCount(0);
    await guess(page, NOBODY[1]!);
    await tapMain(page, /^Other team's turn$/);
    await giveClue(page, 1);
    await expect(mainButton(page), 'rotation unaffected by the override').toHaveText(`${g[1 % g.length]}: Reveal`);
  });

  test('a team with one guesser: "Someone else taps Reveal" is hidden', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'picker-1', n: 1, names: ['Riya', 'Arjun', 'Meena', 'Kabir'] });
    const items = await menuOf(page);
    expect(items).not.toContain('Someone else taps Reveal');
  });
});

test.describe('SWD-102: flip the board', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('each tap turns the grid 180° (data-angle 0 ↔ 180), cells keep their data-index (index 0 at the bottom right); the first flip of the evening shows "Board flipped for the other side of the table"; taps on cells are ignored for 300 ms after a flip', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'flip', n: 'inf' });
    const board = byId(page, 'word-board');
    await expect(board).toHaveAttribute('data-angle', '0');
    const flip = page.getByRole('button', { name: 'Flip the board', exact: true });
    await waitGuards(page);
    await freezeClock(page);
    await flip.click();
    await expect(board).toHaveAttribute('data-angle', '180');
    await expect(byId(page, 'toast')).toHaveText('Board flipped for the other side of the table');
    const c0 = await box(cellAt(page, 0)), c24 = await box(cellAt(page, 24));
    expect(c0.y, 'index 0 at the bottom').toBeGreaterThan(c24.y);
    expect(c0.x, 'index 0 at the right').toBeGreaterThan(c24.x);
    const i = ownOf(B.starts)[0]!;
    await page.clock.runFor(200);
    await cellAt(page, i).click();
    await expect(cellAt(page, i), 'ignored within 300 ms').toHaveAttribute('aria-pressed', 'false');
    await page.clock.runFor(200);
    await cellAt(page, i).click();
    await expect(cellAt(page, i)).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(2100);
    await flip.click();
    await expect(board).toHaveAttribute('data-angle', '0');
    await expect(byId(page, 'toast'), 'only the first flip of the evening').toHaveCount(0);
  });

  test('the angle is kept per team: the other team\'s turn starts at its own angle, the first team\'s next turn at 180; the private map shows its team\'s angle; a reload keeps it', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'flip-team', n: 1 });
    await waitGuards(page);
    await page.getByRole('button', { name: 'Flip the board', exact: true }).click();
    await guess(page, NOBODY[0]!);
    await expect(byId(page, 'word-board'), 'turn over keeps the team that just played').toHaveAttribute('data-angle', '180');
    await tapMain(page, /^Other team's turn$/);
    await tapMain(page, /^I'm /);
    await waitGuards(page);
    await holdPad(page).click();
    await expect(byId(page, 'map-grid')).toHaveAttribute('data-angle', '0');
    await tapMain(page, /^I have my clue$/);
    await giveClue(page, 1);
    await expect(byId(page, 'word-board')).toHaveAttribute('data-angle', '0');
    await guess(page, NOBODY[1]!);
    await tapMain(page, /^Other team's turn$/);
    await tapMain(page, /^I'm /);
    await waitGuards(page);
    await holdPad(page).click();
    await expect(byId(page, 'map-grid')).toHaveAttribute('data-angle', '180');
    await tapMain(page, /^I have my clue$/);
    await giveClue(page, 1);
    await expect(byId(page, 'word-board')).toHaveAttribute('data-angle', '180');
    await page.reload();
    await expect(byId(page, 'word-board')).toHaveAttribute('data-angle', '180');
  });

  test.describe('320 × 568', () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test('hidden in narrow portrait', async ({ page }) => {
      await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'flip-narrow', n: 1 });
      await expect(page.getByRole('button', { name: 'Flip the board', exact: true })).toHaveCount(0);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// P5 end-turn line (SWD-044) and P6 turn over (SWD-045)
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-044: ending the turn early', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('"End our turn": cells locked, "<team> ended their turn.", quiet "Oops, keep guessing" (back, nothing recorded), main "Other team\'s turn" (records endTurn then nextTurn); a running timer stops', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'end', n: 'inf' });
    await guess(page, ownOf(B.starts)[0]!);
    await waitGuards(page);
    await menuButton(page).click();
    await page.getByRole('menuitem', { name: 'Start 90-second timer', exact: true }).click();
    await expect(byId(page, 'hurry-timer')).toBeVisible();
    await quiet(page, 'End our turn').click();
    await expect(resultLine(page)).toHaveText(`${teams.names[B.starts]} ended their turn.`);
    await expect(byId(page, 'hurry-timer')).toHaveCount(0);
    await expect(cellAt(page, ownOf(B.starts)[1]!)).toHaveAttribute('aria-disabled', 'true');
    const before = await moveTypes(page);
    await quiet(page, 'Oops, keep guessing').click();
    await expect(quiet(page, 'End our turn')).toBeVisible();
    await expect(mainButton(page)).toHaveText(/: Reveal$/);
    expect(await moveTypes(page)).toEqual(before);
    await endOurTurn(page);
    expect((await moveTypes(page)).slice(-2)).toEqual(['endTurn', 'nextTurn']);
    await expect(byId(page, 'pass-name')).toHaveText(clueGiver(teams, other(B.starts)));
  });

  test('"End our turn" is never shown before the turn\'s first reveal', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'end-early', n: 2 });
    await expect(quiet(page, 'End our turn')).toHaveCount(0);
  });
});

test.describe('SWD-045: turn over', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('cells locked (not greyed), the result line stays, clue line, guess line and tip removed, "End our turn" hidden; "Other team\'s turn": one phone → the pass screen of the other team\'s clue giver', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'over-1', n: 2 });
    await guess(page, ownOf(B.starts)[0]!);
    await guess(page, NOBODY[0]!);
    await expect(resultLine(page)).toHaveText("Nobody's word. Other team's turn next.");
    for (const id of ['clue-line', 'guess-line', 'tip']) await expect(byId(page, id), id).toHaveCount(0);
    await expect(quiet(page, 'End our turn')).toHaveCount(0);
    const c = cellAt(page, ownOf(B.starts)[1]!);
    await expect(c).toHaveAttribute('aria-disabled', 'true');
    expect(Number(await c.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    expect(await moveTypes(page)).not.toContain('nextTurn');
    await tapMain(page, /^Other team's turn$/);
    expect((await moveTypes(page)).at(-1)).toBe('nextTurn');
    await expect(turnHeading(page)).toHaveText(`${teams.names[other(B.starts)]}, your turn`);
    await expect(byId(page, 'pass-name')).toHaveText(clueGiver(teams, other(B.starts)));
  });

  test('two phones: "Other team\'s turn" → the other team\'s clue screen', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'Two phones', code: CODE, seed: 'over-2', n: 2 });
    await guess(page, ownOf(other(B.starts))[0]!);
    await tapMain(page, /^Other team's turn$/);
    await expect(turnHeading(page)).toHaveText(`${teams.names[other(B.starts)]}, your turn`);
    await expect(byId(page, 'clue-prompt')).toHaveText(`${clueGiver(teams, other(B.starts))}, say your clue out loud. How many words is it for?`);
  });
});
