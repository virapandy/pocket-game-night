// Impostor round 6 (scenarios v3.9, decision I28, 6 October 2026; docs/room-moments.md "Player runs before the 1.3.0
// freeze", P1–P11): new behaviour with no earlier test. Changed wording of earlier tests is in their own files.
// P1 is privacy-critical: in "See my word again" a wrong name must never see anyone's card, the impostor's above all.
// Every test here is written before lane T is merged: each calls `aheadOfRound6` (expected to fail) until then.
import { expect, test, type Page } from './fixtures';
import { isOutlined } from './helpers';
import {
  CLUES_DONE, P4, P5, PANI_PURI, SAMOSA, T0, TZ, aheadOfRound6, dealAll, exact, freezeClock, fromMenu, hold, holdPad,
  imButton, mainButton, onlyEvening, passName, phoneWith, pickerName, playerField, privateBlock, reveal, roundMoves,
  savedEvening, secretTerms, settle, startEvening, textOf, toPicker,
} from './impostor';
import { hostAGame } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const DEAL = { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' };
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const records = async (page: Page) => (await onlyEvening(page)).records.map((r: any) => r.move);
const notBack = (page: Page, name: string) => page.getByRole('button', { name: `Not ${name}? ← Back`, exact: true });
const whoseWord = (page: Page) => page.getByRole('dialog', { name: /Whose word\?/ });
const fontSize = (page: Page, l: ReturnType<Page['getByText']>) => l.first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

/** Records every moment a private block or any secret term appears in the page (P1: a wrong name must never see a card). */
async function watchForCards(page: Page, terms: string[]) {
  await page.evaluate((terms) => {
    const w = window as any; w.__cards = [];
    const look = () => {
      if (document.querySelector('[data-testid="private-block"], [data-testid="private-word"]')) w.__cards.push('private block');
      const text = document.body.innerText;
      for (const t of terms) if (new RegExp(`(?<![\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(text)) w.__cards.push(t);
    };
    new MutationObserver(look).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  }, terms);
}
const cardsSeen = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__cards);

// ================================================================ P2 (IMP-010)

test.describe('P2, IMP-010: the 500 ms tap guard on the setup screens', () => {
  test('a double tap on "Next" never lands on "Start round": the choices screen stays and nothing is dealt; after 500 ms "Start round" deals', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await hostAGame(page).click();
    await page.getByRole('button', { name: /^Impostor\b/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    await settle(page); // v3.9: the setup screens' buttons are guarded for 500 ms whenever they show (P2)
    for (const n of P4) { await playerField(page).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    await freezeClock(page);
    await page.clock.runFor(500);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
    await mainButton(page).click(); // the second tap of the double tap, at once
    await expect(page.getByRole('heading', { name: 'How do you want to play?' }), 'still the choices screen').toBeVisible();
    await expect(passName(page)).toHaveCount(0);
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
  });
});

// ================================================================ P7 (IMP-078)

test.describe('P7, IMP-078: "Cancel" when someone has to leave', () => {
  test('"Kabir has to leave?" has the quiet "Cancel" under its two buttons; it closes the dialog, the Players sheet stays open, nothing is recorded', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: { deals: [DEAL] } });
    await dealAll(page, P5);
    await fromMenu(page, 'Players');
    await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Kabir has to leave\?/ });
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
    await expect(cancel).toBeVisible();
    const c = (await cancel.boundingBox())!, f = (await dialog.getByRole('button', { name: 'Finish this round first', exact: true }).boundingBox())!, d = (await dialog.getByRole('button', { name: 'Deal again without Kabir', exact: true }).boundingBox())!;
    expect(c.y, '"Cancel" under the two buttons').toBeGreaterThanOrEqual(Math.max(f.y + f.height, d.y + d.height) - 1);
    expect(await isOutlined(cancel), '"Cancel" is quiet').toBe(true);
    const before = await records(page);
    await cancel.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Players' }), 'the Players sheet stays open').toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Kabir', exact: true })).toBeVisible();
    expect(await records(page)).toEqual(before);
  });
});

// ================================================================ P4 (IMP-081)

test.describe('P4, IMP-081: nothing is ever hidden under the pinned buttons', () => {
  const TWELVE = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi'];

  /** Scrolled to the end, the last visible piece of content ends above the pinned area. */
  async function lastContentAbovePinned(page: Page, where: string) {
    await page.evaluate(() => { window.scrollTo(0, 1e6); for (const el of Array.from(document.querySelectorAll('*'))) if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight; });
    const r = await page.evaluate(() => {
      const pinned = Array.from(document.querySelectorAll('[data-testid="main-button"]')).map((el) => el.getBoundingClientRect()).filter((b) => b.height > 0);
      const end = document.querySelectorAll('button, [role="button"]');
      const top = Math.min(...pinned.map((b) => b.top), ...Array.from(end).filter((el) => /^(End game)$/.test((el.textContent ?? '').trim())).map((el) => el.getBoundingClientRect().top));
      let bottom = 0; let what = '';
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        if (el.closest('[data-testid="main-button"]') || /^(End game|··· Menu|← Home)$/.test((el.textContent ?? '').trim()) || el.children.length) continue;
        if (!(el.textContent ?? '').trim()) continue;
        const b = el.getBoundingClientRect();
        if (b.height > 1 && b.bottom > bottom && b.top < window.innerHeight) { bottom = b.bottom; what = (el.textContent ?? '').trim().slice(0, 40); }
      }
      return { top, bottom, what };
    });
    expect(r.bottom, `${where}: "${r.what}" ends above the pinned buttons`).toBeLessThanOrEqual(r.top + 0.5);
  }

  for (const [w, h] of [[390, 844], [320, 568], [812, 375]] as const) {
    test(`${w} × ${h}, Score Yes, 12 players: the result scrolled to the end and the summary scrolled to the end show their last line above the pinned buttons`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: w, height: h });
      const moves = roundMoves(TWELVE, 'Arjun', { escaped: 'Meena' }, { type: 'startDeal', practice: false });
      const e = savedEvening({ players: TWELVE, choices: { score: true }, deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }], moves });
      await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
      const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
      await expect(row.or(mainButton(page)).first()).toBeVisible();
      if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
      await expect(page.getByTestId('round-outcome')).toBeVisible();
      await lastContentAbovePinned(page, 'result');
      await settle(page);
      await quiet(page, 'End game').click();
      await expect(page.getByRole('heading', { name: "That's the game!" })).toBeVisible();
      await lastContentAbovePinned(page, 'summary');
      await page.evaluate(() => window.scrollTo(0, 1e6));
      await expect(quiet(page, 'More ›'), 'the last quiet button can be scrolled into view').toBeInViewport({ ratio: 1 });
    });
  }

  for (const n of [5, 12]) {
    test(`812 × 375, ${n} players: the picker's heading and names in the left half; "Not sure?", the text buttons and the main button in the right half`, async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 });
      const players = TWELVE.slice(0, n);
      await startEvening(page, { players, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
      await dealAll(page, players);
      await toPicker(page);
      const head = (await page.getByRole('heading', { name: 'Who got the most fingers?' }).boundingBox())!;
      expect(head.x + head.width, 'heading in the left half').toBeLessThanOrEqual(406 + 1);
      for (const p of players.slice(0, 2)) expect((await pickerName(page, p).boundingBox())!.x + (await pickerName(page, p).boundingBox())!.width, `${p} in the left half`).toBeLessThanOrEqual(406 + 1);
      for (const l of [page.getByText('Not sure?', { exact: true }), quiet(page, "It's a tie"), quiet(page, 'Count again'), mainButton(page)]) {
        expect((await l.boundingBox())!.x, 'in the right half').toBeGreaterThanOrEqual(406 - 1);
      }
      await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    });
  }

  test('812 × 375, 12 players: "Whose word?" shows the names in two columns in a box that scrolls inside, with "Cancel" pinned at the dialog\'s bottom, always visible', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await startEvening(page, { players: TWELVE, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page, TWELVE);
    await quiet(page, 'See my word again').click();
    const d = whoseWord(page);
    const a = (await d.getByRole('button', { name: 'Riya', exact: true }).boundingBox())!, b = (await d.getByRole('button', { name: 'Arjun', exact: true }).boundingBox())!;
    expect(Math.abs(a.y - b.y), 'two columns').toBeLessThanOrEqual(1);
    await expect(d.getByRole('button', { name: 'Cancel', exact: true })).toBeInViewport({ ratio: 1 });
    await d.getByRole('button', { name: 'Ravi', exact: true }).scrollIntoViewIfNeeded();
    await expect(d.getByRole('button', { name: 'Cancel', exact: true }), '"Cancel" stays visible').toBeInViewport({ ratio: 1 });
  });
});

// ================================================================ IMP-010: the block starts 8 px below the layer's top

test.describe('IMP-010 (v3.9): the private block starts 8 px below the top, so "Your secret" is never cut', () => {
  for (const [w, h, larger] of [[390, 844, false], [320, 568, true], [812, 375, false]] as const) {
    test(`${w} × ${h}${larger ? ', Larger text' : ''}: while held, the block's top is at y = 8 and "Your secret" lies wholly on screen`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await startEvening(page, { seeds: { deals: [DEAL] }, storage: larger ? { 'pgn.pref.largerText': true } : {} });
      await settle(page);
      await imButton(page, 'Riya').click();
      await freezeClock(page);
      const pad = (await holdPad(page).boundingBox())!;
      await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
      await page.mouse.down();
      await expect(privateBlock(page)).toBeVisible();
      const block = (await privateBlock(page).boundingBox())!;
      const first = await privateBlock(page).evaluate((el) => el.children[0]!.getBoundingClientRect().top);
      expect(Math.abs(block.y - 8), 'the block starts 8 px below the top').toBeLessThanOrEqual(1);
      expect(first, '"Your secret" is not cut at the top').toBeGreaterThanOrEqual(7.5);
      if (w === 812) {
        // At 812 × 375 the block is in the left half and runs from y = 8 to at most y = 254 (IMP-010).
        expect(block.y + block.height, 'ends by y = 254').toBeLessThanOrEqual(254.5);
        expect(block.x + block.width, 'in the left half').toBeLessThanOrEqual(406 + 0.5);
      } else expect(block.y + block.height, 'and ends above the pad').toBeLessThanOrEqual(pad.y - 8 + 0.5);
      await page.mouse.up();
    });
  }
});

// ================================================================ P11 (IMP-109): Larger text on every Impostor screen

test.describe('P11, IMP-109: Larger text applies on every Impostor screen', () => {
  test('with Larger text on: setup, How to play, clues, talk, result, summary and "Whose word?" use 21 px body and quiet labels, 19 px small lines; the room sizes stay', async ({ page }) => {
    test.setTimeout(120_000);
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.largerText': true, 'pgn.test.seeds': { deals: [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }] } } });
    await hostAGame(page).click();
    await page.getByRole('button', { name: /^Impostor\b/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    await settle(page); // v3.9: the setup screens' buttons are guarded for 500 ms whenever they show (P2)
    expect(await fontSize(page, page.getByText('Add at least 3 players.', { exact: true })), '"Who\'s playing?" small line').toBe(19);
    for (const n of P4) { await playerField(page).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    expect(await quiet(page, 'Clear list').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'quiet "Clear list"').toBe(21);
    await settle(page);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    expect(await fontSize(page, page.getByText('Talk as long as you like, then tap Vote now.', { exact: true })), 'option line (small)').toBe(19);
    expect(await quiet(page, 'More options ›').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'quiet "More options ›"').toBe(21);
    await settle(page);
    await quiet(page, 'How to play').click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    expect(await fontSize(page, page.getByText("One player is the impostor: they don't know the secret word.", { exact: true })), 'How to play body').toBe(21);
    await settle(page);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await settle(page);
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await dealAll(page);
    expect(await fontSize(page, page.getByText('Phone in the middle, face up.', { exact: true })), 'clues body').toBe(21);
    expect(await quiet(page, 'See my word again').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'quiet "See my word again"').toBe(21);
    expect(await page.getByTestId('starter-name').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'the room size stays').toBe(56);
    await quiet(page, 'See my word again').click();
    expect(await whoseWord(page).getByRole('button', { name: 'Cancel', exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), '"Whose word?" Cancel').toBe(21);
    await whoseWord(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    expect(await fontSize(page, page.getByText('Who sounded unsure?', { exact: true })), 'talk body').toBe(21);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000);
    await reveal(page, 'Riya');
    expect(await quiet(page, "This word didn't work").evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'result quiet button').toBe(21);
    expect(await page.getByTestId('result-headline').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'the room size stays').toBe(56);
    expect(await page.getByTestId('word-category').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'word-category').toBe(21);
    await quiet(page, 'End game').click();
    for (const name of ['Oops, keep playing', 'Play something else', 'Home', 'More ›']) {
      expect(await quiet(page, name).evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), `summary "${name}"`).toBe(21);
    }
  });
});
