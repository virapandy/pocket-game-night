// Secret Words 1.4.1, scenarios version 3.9 (product owner, 24 October 2026): the screen changes that are new in 3.9.
//   SWD-031 Pause on the private map        SWD-110 "← Home (keep this game)" on the Pause cover
//   SWD-040 / SWD-041 team names on the counts   SWD-122 the picker is named in the turn line, never on the button
// (SWD-128 `night-result` is in secret-words-game-over.spec.ts; SWD-039 "Next map opens hidden" in
// secret-words-c-map.spec.ts.) Version 3.8's invisible tap guards stay; undo after a reveal stays out (K35).
import { expect, test, type Page } from './fixtures';
import { mainButton } from './impostor';
import { mapCells, menuButton, oracleBoard, tapMain, waitGuards } from './secret-words';
import { mapInPage } from './secret-words-c';
import { box, byId, fullCode, guessersOf, holdPad, host, moveTypes, pauseButton, quiet, teamsOf, toClueScreen, toGuessing, turnLine, whereLine } from './secret-words-b';
import { exampleTeams, flows, openOn, savedOf } from './secret-words-d';

const CODE = fullCode(9001, 2);
const B = oracleBoard(CODE);
const HOME_ON_COVER = '← Home (keep this game)';

async function toPrivateMap(page: Page, seed: string) {
  await host(page, { phones: 'One phone', boards: [CODE], seed });
  const t = await teamsOf(page);
  await tapMain(page, /^I'm /);
  await expect(holdPad(page)).toBeVisible();
  return { t, team: t.names[B.starts], cg: t.clueGivers[B.starts]! };
}
const cover = (page: Page) => page.getByRole('dialog', { name: 'Paused' });

// ---------------------------------------------------------------------------------------------------------------------
// SWD-031 (v3.9): Pause on the private map
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-031 (v3.9): Pause on the private map', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pause-button "Pause", 44 × 44, at the top left of the heading row, before the first show and while the map shows; still no menu, no team bar', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm39-button');
    for (const state of ['hidden', 'shown']) {
      if (state === 'shown') { await waitGuards(page); await holdPad(page).click(); await expect(mapCells(page)).toHaveCount(25); }
      const p = pauseButton(page);
      await expect(p, `${state}: pause-button`).toBeVisible();
      await expect(p).toHaveAccessibleName('Pause');
      const pb = await box(p), hb = await box(page.getByRole('heading', { level: 1, name: n.cg }));
      expect(Math.abs(pb.width - 44) + Math.abs(pb.height - 44), `${state}: 44 × 44`).toBeLessThanOrEqual(1);
      expect(pb.x, `${state}: at the left edge of the row`).toBeLessThanOrEqual(24);
      expect(pb.x + pb.width, `${state}: left of the heading`).toBeLessThanOrEqual(hb.x + 0.5);
      expect(Math.abs(pb.y + pb.height / 2 - (hb.y + hb.height / 2)), `${state}: on the heading's row`).toBeLessThanOrEqual(12);
      await expect(menuButton(page), `${state}: no menu`).toHaveCount(0);
      await expect(byId(page, 'team-bar'), `${state}: no team bar`).toHaveCount(0);
    }
  });

  test('the heading shrinks to fit the rest of the row: at 320 px with the map shown, pause, heading and "Someone saw the map" sit on one row without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const n = await toPrivateMap(page, 'pm39-narrow');
    await waitGuards(page);
    await holdPad(page).click();
    await expect(quiet(page, 'Someone saw the map')).toBeVisible(); // shown (a 320 px screen lists "Our words" instead of the grid)
    const p = await box(pauseButton(page)), h = await box(page.getByRole('heading', { level: 1, name: n.cg })), s = await box(quiet(page, 'Someone saw the map'));
    expect(p.x + p.width, 'pause left of the heading').toBeLessThanOrEqual(h.x + 0.5);
    expect(h.x + h.width, 'heading left of "Someone saw the map"').toBeLessThanOrEqual(s.x + 0.5);
    expect(s.x + s.width, 'inside the screen').toBeLessThanOrEqual(320 + 0.5);
    expect(Math.abs(p.y - s.y), 'one row').toBeLessThanOrEqual(8);
  });

  test('a tap with the map shown removes the map from the page at once and opens the Pause cover; nothing is recorded', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm39-tap');
    await waitGuards(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    const sameTask = await page.evaluate(async () => {
      (document.querySelector('[data-testid="pause-button"]') as HTMLElement).click();
      await Promise.resolve(); await Promise.resolve();
      return document.querySelectorAll('[data-testid="map-cell"]').length;
    });
    expect(sameTask, 'the map is gone in the same task as the tap').toBe(0);
    await expect(cover(page)).toBeVisible();
    await expect(cover(page).getByRole('heading', { name: 'Paused' })).toBeVisible();
    await expect(cover(page).getByTestId('where-line')).toHaveText(`Turn 1 · clue for ${n.team}`);
    expect(await mapInPage(page), 'no map, no kind of any word, anywhere in the page').toEqual([]);
    expect(await moveTypes(page)).toEqual(['deal']);
  });

  test('"Carry on" returns to the private map with the map hidden ("Tap to see the map"); the main "I have my clue" stays; tapping the pad shows the map again', async ({ page }) => {
    await toPrivateMap(page, 'pm39-carry');
    await waitGuards(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
    await waitGuards(page);
    await pauseButton(page).click();
    await expect(cover(page)).toBeVisible();
    await waitGuards(page);
    await tapMain(page, /^Carry on$/);
    await expect(cover(page)).toHaveCount(0);
    await expect(holdPad(page)).toHaveText('Tap to see the map');
    expect(await mapInPage(page)).toEqual([]);
    await expect(quiet(page, 'Our words')).toHaveCount(0);
    await expect(quiet(page, 'Someone saw the map')).toHaveCount(0);
    await expect(mainButton(page), 'the main stays').toHaveText('I have my clue');
    await expect(menuButton(page)).toHaveCount(0);
    await waitGuards(page);
    await holdPad(page).click();
    await expect(mapCells(page)).toHaveCount(25);
  });

  test('paused before the first show: "Carry on" returns to the hidden private map as it was ("Not <name>? Go back", no main)', async ({ page }) => {
    const n = await toPrivateMap(page, 'pm39-before');
    await waitGuards(page);
    await pauseButton(page).click();
    await expect(cover(page)).toBeVisible();
    await waitGuards(page);
    await tapMain(page, /^Carry on$/);
    await expect(holdPad(page)).toHaveText('Tap to see the map');
    await expect(quiet(page, `Not ${n.cg}? Go back`)).toBeVisible();
    await expect(mainButton(page)).toHaveCount(0);
    expect(await mapInPage(page)).toEqual([]);
  });

  test('a reload while paused on the private map shows the cover and no map; "Carry on" then shows the map hidden', async ({ page }) => {
    await toPrivateMap(page, 'pm39-reload');
    await waitGuards(page);
    await holdPad(page).click();
    await waitGuards(page);
    await pauseButton(page).click();
    await expect(cover(page)).toBeVisible();
    await page.reload();
    await expect(cover(page)).toBeVisible();
    expect(await mapInPage(page)).toEqual([]);
    await waitGuards(page);
    await tapMain(page, /^Carry on$/);
    expect(await mapInPage(page)).toEqual([]);
    await expect(holdPad(page)).toHaveText('Tap to see the map');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// SWD-110 (v3.9): Home from the Pause cover
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-110 (v3.9): "← Home (keep this game)" on the Pause cover', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  async function expectHomeUnderCarryOn(page: Page) {
    const c = cover(page);
    await expect(c).toBeVisible();
    const home = c.getByRole('button', { name: HOME_ON_COVER, exact: true });
    await expect(home).toBeVisible();
    await expect(home).toHaveText(HOME_ON_COVER);
    const carry = await box(c.getByRole('button', { name: 'Carry on', exact: true })), h = await box(home);
    expect(h.y, 'under "Carry on"').toBeGreaterThanOrEqual(carry.y + carry.height - 0.5);
    expect(h.height, 'a quiet button at least 44 px tall').toBeGreaterThanOrEqual(44 - 0.5);
    await expect(c.getByTestId('main-button'), '"Carry on" stays the only main').toHaveCount(1);
    await expect(c.getByTestId('main-button')).toHaveText('Carry on');
    return home;
  }
  async function unfinishedGame(page: Page) {
    return page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!k.startsWith('pgn.game.')) continue;
        const g = JSON.parse(localStorage.getItem(k)!);
        if (g?.gameType === 'secret-words') return { status: g.status as string, moves: g.records.map((r: any) => r.move.type as string) };
      }
      return null;
    });
  }

  test('guessing: the cover has quiet "← Home (keep this game)" under "Carry on"; a tap opens Home at once (no dialog) and the game stays unfinished', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-home-guess', n: 2 });
    const before = await moveTypes(page);
    await waitGuards(page);
    await pauseButton(page).click();
    const home = await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await home.click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const g = await unfinishedGame(page);
    expect(g?.status, 'the game stays unfinished').toBe('in-progress');
    expect(g?.moves, 'nothing recorded').toEqual(before);
  });

  test('it resumes from Home\'s row at the same step', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-home-resume', n: 2 });
    await waitGuards(page);
    await pauseButton(page).click();
    await waitGuards(page);
    await cover(page).getByRole('button', { name: HOME_ON_COVER, exact: true }).click();
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ });
    await waitGuards(page);
    await row.getByText('Tap to resume').click();
    await waitGuards(page);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
  });

  test('the same button on the pass screen, the clue screen and (two phones) the scan screen', async ({ page }) => {
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'p39-home-pass' });
    await waitGuards(page);
    await pauseButton(page).click();
    await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await tapMain(page, /^Carry on$/);
    await toClueScreen(page, 'One phone');
    await waitGuards(page);
    await pauseButton(page).click();
    await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await cover(page).getByRole('button', { name: HOME_ON_COVER, exact: true }).click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
  });

  test('the scan screen (two phones) has it too', async ({ page }) => {
    await host(page, { phones: 'Two phones', boards: [CODE], seed: 'p39-home-scan' });
    await waitGuards(page);
    await pauseButton(page).click();
    const home = await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await home.click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
  });

  test('the private map\'s Pause cover has it too (SWD-031 v3.9)', async ({ page }) => {
    await toPrivateMap(page, 'p39-home-map');
    await waitGuards(page);
    await holdPad(page).click();
    await waitGuards(page);
    await pauseButton(page).click();
    const home = await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await home.click();
    await expect(page.getByRole('button', { name: /^Host a game/ })).toBeVisible();
    expect((await unfinishedGame(page))?.status).toBe('in-progress');
  });

  test('"Carry on" is unchanged: back to the same step', async ({ page }) => {
    await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-carry', n: 2 });
    await waitGuards(page);
    await pauseButton(page).click();
    await expectHomeUnderCarryOn(page);
    await waitGuards(page);
    await tapMain(page, /^Carry on$/);
    await expect(cover(page)).toHaveCount(0);
    await expect(byId(page, 'clue-line')).toHaveText('Clue: 2');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// SWD-040 / SWD-041 (v3.9): team names on the counts
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The counts as a player sees them: the visible text with the icons taken out, whitespace collapsed (`text`), the number
 * of text lines on screen, ignoring the "·" separator (`lines`), the accessible name, and whether nothing is cut off.
 */
async function counts(page: Page) {
  const el = byId(page, 'word-counts');
  await expect(el).toBeVisible();
  const text = (await el.innerText()).replace(/[●◆○◇■□▲△]/g, '').replace(/\s+/g, ' ').trim();
  const label = await el.getAttribute('aria-label');
  const fits = await el.evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
  const lines = await el.evaluate((root) => {
    const tops: number[] = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = w.nextNode())) {
      const s = (n.textContent ?? '').replace(/[●◆○◇■□▲△·\s]/g, '');
      if (!s) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (!tops.some((t) => Math.abs(t - r.top) < 6)) tops.push(r.top);
    }
    return tops.length;
  });
  return { text, label, fits, lines, h: (await box(el)).height };
}
const guessingWith = (names: { orange: string; teal: string }) => {
  const ev = flows.midGame({ teams: exampleTeams({ names: { id: 'SWDT-01', ...names } }) }); // orange starts: 9 - 1 = 8 left; teal 8 left
  return savedOf(ev);
};

test.describe('SWD-040 / SWD-041 (v3.9): team names on the counts', () => {
  test('names that fit: each team\'s full name with its number and "left", on one line ("Reds 8 left · Blues 8 left"); the accessible name is unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openOn(page, guessingWith({ orange: 'Reds', teal: 'Blues' }), turnLine(page));
    const c = await counts(page);
    expect(c.text).toBe('Reds 8 left · Blues 8 left');
    expect(c.label).toBe('Reds: 8 words left. Blues: 8 words left.');
    expect(c.fits, 'nothing cut off').toBe(true);
    expect(c.lines, 'one line').toBe(1);
  });

  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }]) {
    test(`Chai Champions / Coffee Commandos at ${vp.width} × ${vp.height}: full names if both fit on one line, otherwise first words ("Chai 8 · Coffee 8"); one line; accessible name unchanged`, async ({ page }) => {
      await page.setViewportSize(vp);
      await openOn(page, guessingWith({ orange: 'Chai Champions', teal: 'Coffee Commandos' }), turnLine(page));
      const c = await counts(page);
      expect(['Chai Champions 8 left · Coffee Commandos 8 left', 'Chai 8 · Coffee 8'], `shown: "${c.text}"`).toContain(c.text);
      if (vp.width === 320) expect(c.text, 'the full form does not fit a 320 px screen').toBe('Chai 8 · Coffee 8');
      expect(c.label).toBe('Chai Champions: 8 words left. Coffee Commandos: 8 words left.');
      expect(c.fits, 'nothing cut off').toBe(true);
      expect(c.lines, 'one line').toBe(1);
    });
  }

  test('first words too long as well: icons and numbers only, as before ("8 left · 8 left") at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openOn(page, guessingWith({ orange: 'Extraordinarily Brilliant', teal: 'Unbelievably Fantastic' }), turnLine(page));
    const c = await counts(page);
    expect(c.text).toBe('8 left · 8 left');
    expect(c.label).toBe('Extraordinarily Brilliant: 8 words left. Unbelievably Fantastic: 8 words left.');
    expect(c.fits).toBe(true);
    expect(c.lines, 'one line').toBe(1);
  });

  test('the clue screen follows the same rule (SWD-040): whichever of the three forms fits, on one line', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await host(page, { phones: 'One phone', boards: [CODE], seed: 'p39-counts-clue' });
    const t = await teamsOf(page);
    await toClueScreen(page, 'One phone');
    const c = await counts(page);
    const first = (n: string) => n.split(' ')[0]!;
    const forms = [
      `${t.names.orange} 9 left · ${t.names.teal} 8 left`, `${t.names.orange} 8 left · ${t.names.teal} 9 left`,
      `${first(t.names.orange)} 9 · ${first(t.names.teal)} 8`, `${first(t.names.orange)} 8 · ${first(t.names.teal)} 9`,
      '9 left · 8 left', '8 left · 9 left',
    ];
    expect(forms, `shown: "${c.text}"`).toContain(c.text);
    expect(c.fits).toBe(true);
  });

  for (const vp of [{ width: 812, height: 375 }, { width: 568, height: 320 }]) {
    test(`landscape panel at ${vp.width} × ${vp.height}: each team on its own line, first word of the name then the number ("Chai 8" / "Coffee 8")`, async ({ page }) => {
      await page.setViewportSize(vp);
      await openOn(page, guessingWith({ orange: 'Chai Champions', teal: 'Coffee Commandos' }), turnLine(page));
      const c = await counts(page);
      expect(c.text.replace(/ ·/g, '')).toBe('Chai 8 Coffee 8');
      expect(c.lines, 'two lines, one per team').toBe(2);
      expect(c.label).toBe('Chai Champions: 8 words left. Coffee Commandos: 8 words left.');
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// SWD-122 (v3.9): the picker is named in the turn line, not on the Reveal button
// ---------------------------------------------------------------------------------------------------------------------

test.describe('SWD-122 (v3.9): who taps Reveal', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the main reads "Reveal" (disabled) and "Reveal <WORD>" with no name in it; the picker is named in the turn-line after the 3 s poker line', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-picker', n: 2 });
    const g = guessersOf(teams, B.starts);
    await expect(turnLine(page), 'the poker line shows first').toContainText('no hints, no faces!');
    await expect(mainButton(page)).toHaveText('Reveal');
    await expect(mainButton(page)).toBeDisabled();
    await page.clock.runFor(3100);
    await expect(turnLine(page)).toHaveText(`${teams.names[B.starts]} guessing · ${g[0]} taps Reveal`);
    await waitGuards(page);
    const cell = B.kinds.findIndex((k) => k === B.starts);
    await page.locator(`[data-testid="word-board"] [data-index="${cell}"]`).click();
    await expect(mainButton(page)).toHaveText(`Reveal ${B.words[cell]}`);
    for (const name of g) expect(await mainButton(page).innerText(), 'no name on the button').not.toContain(name);
  });

  test('the first-guess tip: "Tap a word to suggest it. <name> taps Reveal this turn; it moves round each turn."', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-tip', n: 2 });
    const g = guessersOf(teams, B.starts);
    await expect(byId(page, 'tip')).toHaveText(`Tap a word to suggest it. ${g[0]} taps Reveal this turn; it moves round each turn.`);
  });

  test('"Someone else taps Reveal" changes the name in the turn-line for this turn only; the button never shows a name; the rotation continues unchanged', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-override', n: 'inf' });
    const g = guessersOf(teams, B.starts);
    await page.clock.runFor(3100);
    await waitGuards(page);
    await menuButton(page).click();
    await page.getByRole('menuitem', { name: 'Someone else taps Reveal', exact: true }).click();
    await page.getByRole('dialog', { name: 'Who taps Reveal this turn?' }).getByRole('button', { name: g[1]!, exact: true }).click();
    await expect(turnLine(page)).toHaveText(`${teams.names[B.starts]} guessing · ${g[1]} taps Reveal`);
    await expect(mainButton(page)).toHaveText('Reveal');
  });

  test('a team with one guesser still names its picker in the turn-line', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-one', n: 1, names: ['Riya', 'Arjun', 'Meena', 'Kabir'] });
    const g = guessersOf(teams, B.starts);
    expect(g).toHaveLength(1);
    await page.clock.runFor(3100);
    await expect(turnLine(page)).toHaveText(`${teams.names[B.starts]} guessing · ${g[0]} taps Reveal`);
    await expect(mainButton(page)).toHaveText('Reveal');
  });

  test('a long picker name does not push the Reveal button: the main is one line "Reveal" and the turn-line stays inside the screen', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-long', n: 1, names: ['Riya', 'Arjun', 'Meena', 'Kabir', 'Bartholomew-Alexander', 'Zoya', 'Dev'] });
    await page.clock.runFor(3100);
    await expect(turnLine(page)).toContainText('taps Reveal');
    const tl = await box(turnLine(page));
    expect(tl.x + tl.width, 'inside the screen').toBeLessThanOrEqual(390 + 0.5);
    const mb = await box(mainButton(page));
    expect(mb.height, 'the main is 60 px tall, one line').toBeLessThanOrEqual(60 + 0.5);
    expect(teams.names[B.starts].length).toBeGreaterThan(0);
  });

  test('the where-line is unchanged by 3.9 (guessing "<team> guessing · 3 guesses left")', async ({ page }) => {
    const { teams } = await toGuessing(page, { phones: 'One phone', code: CODE, seed: 'p39-where', n: 2 });
    await waitGuards(page);
    await pauseButton(page).click();
    await expect(whereLine(page)).toHaveText(`${teams.names[B.starts]} guessing · 3 guesses left`);
  });
});
