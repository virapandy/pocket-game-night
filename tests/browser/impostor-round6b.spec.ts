// Impostor round 6b → 1.3.1 (decision I29, 6 October 2026; binding: specs/impostor/12-later.md "Note, 6 October
// (player re-run; decision I29)", detail of IMP-010, IMP-075, IMP-077, IMP-081, IMP-088; docs/room-moments.md R1–R5, R10):
// R1 every "··· Menu" item, "End game" included, can be reached at 812 × 375 and 320 × 568, Larger text on or off;
// R2 the 500 ms tap guard on every Impostor screen, Home and "What shall we play?" (never the hold pad);
// R3 no text selection by taps or double taps (text fields still work); R4 option labels keep their spaces;
// R5 tonight's names after going Home (IMP-004) and R10 fast and slow Enter (IMP-003): checks of the released build.
// Lane V (main 131c234, version 1.3.1) builds R1–R4; every test here is expected to pass.
import { expect, test, type Locator, type Page } from './fixtures';
import { HOME, hostAGame } from './helpers';
import {
  CLUES_DONE, P4, SAMOSA, T0, TZ, dealAll, freezeClock, hold, holdPad, imButton, impostorCard, mainButton,
  menuButton, menuItem, onlyEvening, option, passName, phoneWith, pickerName, playerField, privateBlock, reveal, settle,
  startEvening, textOf, toPicker,
} from './impostor';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const DEAL = { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' };
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });
const records = async (page: Page) => (await onlyEvening(page)).records.map((r: any) => r.move);
const LARGER = { 'pgn.pref.largerText': true };

// ================================================================ R1 (IMP-075): every menu item can be reached

test.describe('R1, IMP-075 (I29): every "··· Menu" item, "End game" included, can be reached', () => {
  const DEAL_MENU = ['How to play', 'Players', 'Deal again with a new word', 'Settings', 'Home (game is saved)', 'End game'];
  const ROUND_MENU = ['How to play', 'Players', 'See my word again', 'Deal again with a new word', 'Settings', 'Home (game is saved)', 'End game'];
  const BETWEEN_MENU = ['How to play', 'Players', 'Change how we play', 'Settings', 'History'];

  /** Opens the menu; each item, in order, can be brought wholly onto the screen (scrolling inside the menu if needed). */
  async function everyItemReachable(page: Page, where: string, expected: string[]) {
    await settle(page);
    await menuButton(page).click();
    const items = page.getByRole('menuitem');
    await expect(items.first(), `${where}: the menu opens`).toBeVisible();
    expect(await textOf(items), `${where}: the items`).toEqual(expected);
    for (const name of expected) {
      const item = menuItem(page, name);
      await item.scrollIntoViewIfNeeded();
      // Wholly on the screen, to within 1 px (a fraction of a pixel at an edge is rounding, not a hidden item).
      const b = (await item.boundingBox())!;
      const vp = page.viewportSize()!;
      expect(b.y >= -1 && b.y + b.height <= vp.height + 1 && b.x >= -1 && b.x + b.width <= vp.width + 1, `${where}: "${name}" can be scrolled wholly onto the screen (${JSON.stringify(b)})`).toBe(true);
    }
  }

  for (const [w, h] of [[812, 375], [320, 568]] as const) {
    for (const larger of [false, true]) {
      test(`${w} × ${h}${larger ? ', Larger text' : ''}: the deal, clues and between-rounds menus show every item; the last mid-round item "End game" opens "End now?"`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width: w, height: h });
        await startEvening(page, { seeds: { deals: [DEAL] }, storage: larger ? LARGER : {} });
        await everyItemReachable(page, 'deal, screen A', DEAL_MENU);
        await page.keyboard.press('Escape');
        if (await page.getByRole('menuitem').first().isVisible()) await menuButton(page).click();
        await dealAll(page);
        await everyItemReachable(page, 'clues', ROUND_MENU);
        await menuItem(page, 'End game').click();
        const end = page.getByRole('dialog', { name: /End now\? This round won't count\./ });
        await expect(end, '"End game" opens IMP-093\'s dialog').toBeVisible();
        await settle(page); // the dialog's buttons are guarded for 500 ms (I29, R2)
        await end.getByRole('button', { name: 'Keep playing', exact: true }).click();
        await expect(end).toHaveCount(0);
        await toPicker(page);
        await reveal(page, 'Riya');
        await expect(page.getByTestId('round-outcome')).toBeVisible();
        await everyItemReachable(page, 'round result', BETWEEN_MENU);
      });
    }
  }
});

// ================================================================ R2 (IMP-010, IMP-077): the tap guard everywhere

test.describe('R2, IMP-010 (I29): a tap within 500 ms of a screen change does nothing, on every Impostor screen, Home and "What shall we play?"', () => {
  test('"What shall we play?": a double tap on Home\'s "Host a game" does not open Tambola; after 500 ms the Impostor card opens "Who\'s playing?"', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await settle(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?')).toBeVisible();
    await page.getByRole('button', { name: /^Tambola/ }).click(); // the second tap of the double tap, at once
    await expect(heading(page, 'What shall we play?'), 'still "What shall we play?"').toBeVisible();
    await expect(page.getByRole('button', { name: 'New game', exact: true }), 'Tambola did not open').toHaveCount(0);
    await page.clock.runFor(500);
    await impostorCard(page).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
  });

  test('Home: a tap at once after "← Back" from "What shall we play?" does nothing; after 500 ms "Host a game" works', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await settle(page);
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?')).toBeVisible();
    await settle(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await page.getByRole('button', { name: /^(← )?Back$/ }).click();
    await expect(hostAGame(page)).toBeVisible();
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?'), 'Home stays').toHaveCount(0);
    await expect(hostAGame(page)).toBeVisible();
    await page.clock.runFor(500);
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?')).toBeVisible();
  });

  test('Home: a tap at once on the resume row after "Home (game is saved)" does nothing; after 500 ms it resumes', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await menuButton(page).click();
    await freezeClock(page);
    await page.clock.runFor(500);
    await menuItem(page, 'Home (game is saved)').click();
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    await expect(row.first()).toBeVisible();
    await row.getByText('Tap to resume').first().click();
    await expect(page.getByTestId('clue-order'), 'Home stays').toHaveCount(0);
    await expect(hostAGame(page)).toBeVisible();
    await page.clock.runFor(500);
    await row.getByText('Tap to resume').first().click();
    await expect(page.getByTestId('clue-order')).toBeVisible();
  });

  test('clues → talk: a double tap on "Clues done, talk it over" does not land on "Vote now"; after 500 ms "Vote now" starts the countdown', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await expect(page.getByTestId('talk-heading')).toBeVisible();
    await mainButton(page).click(); // the second tap, at once, where "Vote now" now is
    await expect(page.getByTestId('talk-heading'), 'still talking').toBeVisible();
    await expect(page.getByTestId('countdown-heading')).toHaveCount(0);
    expect((await records(page)).at(-1), 'nothing recorded after "Clues done"').toEqual({ type: 'startTalk' });
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await expect(page.getByTestId('countdown-heading')).toBeVisible();
  });

  test('the picker: a tap on a name the moment the picker opens does nothing; after 500 ms the name is picked', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await settle(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(6000); // IMP-030: the picker opens by itself at t = 6 s
    await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
    await pickerName(page, 'Meena').click();
    await expect(pickerName(page, 'Meena'), 'not picked').toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page).filter({ hasText: /^Reveal Meena$/ })).toHaveCount(0);
    await page.clock.runFor(500);
    await pickerName(page, 'Meena').click();
    await expect(pickerName(page, 'Meena')).toHaveAttribute('aria-pressed', 'true');
    await expect(mainButton(page).filter({ hasText: /^Reveal Meena$/ })).toBeVisible();
  });

  test('result → summary: a double tap on "End game" does not land on "Play again"; the summary stays; after 500 ms "Play again" works', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    await freezeClock(page);
    await page.clock.runFor(500);
    await quiet(page, 'End game').click();
    await expect(heading(page, "That's the game!")).toBeVisible();
    await mainButton(page).click(); // the second tap, at once, on "Play again"
    await expect(heading(page, "That's the game!"), 'the summary stays').toBeVisible();
    await page.clock.runFor(500);
    await mainButton(page).filter({ hasText: 'Play again' }).click();
    await expect(heading(page, "That's the game!")).toHaveCount(0);
  });

  test('summary → Home: a tap at once on "Host a game" after the summary\'s "Home" does nothing; after 500 ms it works', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya');
    await quiet(page, 'End game').click();
    await expect(heading(page, "That's the game!")).toBeVisible();
    await settle(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await quiet(page, 'Home').click();
    await expect(hostAGame(page)).toBeVisible();
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?'), 'Home stays').toHaveCount(0);
    await page.clock.runFor(500);
    await hostAGame(page).click();
    await expect(heading(page, 'What shall we play?')).toBeVisible();
  });

  test('How to play from the menu: a tap at once on "Done" does nothing; after 500 ms "Done" returns to the clues', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await dealAll(page);
    await menuButton(page).click();
    await freezeClock(page);
    await page.clock.runFor(500);
    await menuItem(page, 'How to play').click();
    await expect(heading(page, 'How to play')).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(heading(page, 'How to play'), 'still How to play').toBeVisible();
    await page.clock.runFor(500);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByTestId('clue-order')).toBeVisible();
  });

  test('the hold pad is never guarded: pressed the moment screen B shows, the word shows at once', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await settle(page);
    await freezeClock(page);
    await page.clock.runFor(500);
    await imButton(page, 'Riya').click();
    await expect(holdPad(page)).toBeVisible();
    await hold(page, 600); // pressed at once (0 ms after screen B), held 600 ms
    await expect(mainButton(page).filter({ hasText: /^Done, pass to / })).toBeVisible();
  });
});

// ================================================================ R3: no text selection by tapping

/** Double-taps the first word of the element's first line of text; returns what the page then has selected. */
async function doubleTapText(page: Page, l: Locator): Promise<string> {
  await expect(l).toBeVisible();
  const p = await l.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent ?? '';
      const start = t.search(/[\p{L}\p{N}]/u);
      if (start < 0) continue;
      const end = start + (t.slice(start).search(/[^\p{L}\p{N}]/u) + 1 || t.length - start + 1) - 1;
      const r = document.createRange();
      r.setStart(n, start); r.setEnd(n, Math.max(end, start + 1));
      const b = r.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    return null;
  });
  if (!p) throw new Error('no text in the element');
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page.mouse.dblclick(p.x, p.y);
  return page.evaluate(() => (window.getSelection()?.toString() ?? '').trim());
}

test.describe('R3 (I29): text on Impostor screens, Home and "What shall we play?" cannot be selected by tapping', () => {
  test('Home, "What shall we play?", "Who\'s playing?", the choices, the clues, the result and the summary: a double tap on text selects nothing', async ({ page }) => {
    test.setTimeout(90_000);
    await phoneWith(page, [], { now: T0, storage: { 'pgn.test.seeds': { deals: [DEAL] } } });
    await settle(page);
    expect(await doubleTapText(page, page.getByText('Pocket Game Night', { exact: true }).first()), 'Home, the app\'s name').toBe('');
    await hostAGame(page).click();
    await settle(page);
    expect(await doubleTapText(page, heading(page, 'What shall we play?')), '"What shall we play?"').toBe('');
    await impostorCard(page).click();
    await settle(page);
    expect(await doubleTapText(page, page.getByText('Sit in a circle. This is the passing and clue order.', { exact: true })), '"Who\'s playing?"').toBe('');
    for (const n of P4) { await playerField(page).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    await settle(page);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await settle(page);
    expect(await doubleTapText(page, heading(page, 'How do you want to play?')), 'choices heading').toBe('');
    expect(await doubleTapText(page, page.getByText('Talk as long as you like, then tap Vote now.', { exact: true })), 'an option line').toBe('');
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await dealAll(page);
    expect(await doubleTapText(page, page.getByText('Phone in the middle, face up.', { exact: true })), 'clues').toBe('');
    expect(await doubleTapText(page, page.getByTestId('clue-order')), 'the clue order').toBe('');
    await toPicker(page);
    expect(await doubleTapText(page, heading(page, 'Who got the most fingers?')), 'picker').toBe('');
    await reveal(page, 'Riya');
    expect(await doubleTapText(page, page.getByTestId('round-outcome')), 'result').toBe('');
    expect(await doubleTapText(page, page.getByTestId('result-impostor')), 'result, the impostor line').toBe('');
    await quiet(page, 'End game').click();
    await settle(page);
    expect(await doubleTapText(page, heading(page, "That's the game!")), 'summary').toBe('');
  });

  test('text fields still work: in "Player name" a double tap selects the typed word, and typing replaces it', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await settle(page);
    await hostAGame(page).click();
    await settle(page);
    await impostorCard(page).click();
    await settle(page);
    await playerField(page).fill('Riya');
    const box = (await playerField(page).boundingBox())!;
    await page.mouse.dblclick(box.x + 16, box.y + box.height / 2);
    const sel = await playerField(page).evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0));
    expect(sel, 'the typed name is selected inside the field').toBe('Riya');
    await page.keyboard.type('Zoya');
    await expect(playerField(page)).toHaveValue('Zoya');
  });
});

// ================================================================ R4 (IMP-005, IMP-088): labels keep their spaces

test.describe('R4, IMP-088 (I29): option labels keep the space between words; tighter spacing only within words', () => {
  /** Choices screen at w × h. */
  async function toChoices(page: Page, w: number, h: number, larger: boolean) {
    await page.setViewportSize({ width: w, height: h });
    await phoneWith(page, [], { now: T0, storage: larger ? LARGER : {} });
    await settle(page);
    await hostAGame(page).click();
    await settle(page);
    await impostorCard(page).click();
    await settle(page);
    for (const n of P4) { await playerField(page).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    await settle(page);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    await settle(page);
  }

  /**
   * Each space between words inside the label: the gap drawn between the two words, and the same gap in a copy of the
   * label with normal letter and word spacing (same font, same size), laid out by the same browser.
   */
  const spaces = (l: Locator) => l.evaluate((el) => {
    const measure = (root: Element) => {
      const out: number[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent ?? '';
        for (let i = t.indexOf(' '); i >= 0; i = t.indexOf(' ', i + 1)) {
          if (!/\S/.test(t.slice(0, i)) || !/\S/.test(t.slice(i + 1))) continue;
          // The gap between the words as laid out: from the end of the letter before the space to the start of the
          // letter after it (a range around the space alone leaves out word spacing in WebKit).
          const before = document.createRange(), after = document.createRange();
          before.setStart(n, i - 1); before.setEnd(n, i);
          after.setStart(n, i + 1); after.setEnd(n, i + 2);
          out.push(after.getBoundingClientRect().left - before.getBoundingClientRect().right);
        }
      }
      return out;
    };
    const drawn = measure(el);
    const copy = el.cloneNode(true) as HTMLElement;
    copy.style.cssText += ';position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;width:auto';
    for (const e of [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))]) { e.style.letterSpacing = 'normal'; e.style.wordSpacing = 'normal'; }
    el.parentElement!.appendChild(copy);
    const natural = measure(copy);
    copy.remove();
    return drawn.map((d, i) => ({ drawn: d, natural: natural[i] ?? NaN }));
  });

  for (const [w, h] of [[390, 844], [360, 640], [320, 568], [812, 375]] as const) {
    for (const larger of [false, true]) {
      test(`${w} × ${h}${larger ? ', Larger text' : ''}: "Free flow", "Whole family" and "+ Grown-ups" each show a full space between their words`, async ({ page }) => {
        await toChoices(page, w, h, larger);
        for (const [g, name] of [['Talking', 'Free flow'], ['Words', 'Whole family'], ['Words', '+ Grown-ups']] as const) {
          const l = option(page, g, name);
          await expect(l).toBeVisible();
          const s = await spaces(l);
          expect(s.length, `"${name}" has its space in the text`).toBe(1);
          expect(s[0]!.drawn, `"${name}": the space is drawn ${s[0]!.drawn.toFixed(2)} px wide; a plain space in this font is ${s[0]!.natural.toFixed(2)} px`).toBeGreaterThanOrEqual(s[0]!.natural - 0.5);
        }
      });
    }
  }
});

// ================================================================ R5 (IMP-004) and R10 (IMP-003): checks of the released build

test.describe('R5, IMP-004: tonight\'s names after going Home and starting again', () => {
  /** One counted round of a 4-player game started on screen; returns at its result. */
  async function oneRound(page: Page) {
    await startEvening(page, { seeds: { deals: [DEAL, { ...DEAL, impostor: 'Meena' }] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
  }
  async function whosPlayingFromHome(page: Page) {
    await expect(hostAGame(page)).toBeVisible();
    await settle(page);
    await hostAGame(page).click();
    await settle(page);
    await impostorCard(page).click();
    await settle(page);
  }
  const listed = (page: Page) => page.getByRole('button', { name: /^Remove / }).evaluateAll((els) => els.map((el) => (el.getAttribute('aria-label') ?? '').replace(/^Remove /, '')));

  test('ended with "End game", then "Home": "Who\'s playing?" lists tonight\'s names in order', async ({ page }) => {
    await oneRound(page);
    await quiet(page, 'End game').click();
    await settle(page);
    await quiet(page, 'Home').click();
    await whosPlayingFromHome(page);
    await expect(heading(page, "Who's playing?")).toBeVisible();
    expect(await listed(page)).toEqual(P4);
  });

  test('left with "← Home" after a counted round, then "Start new": "Who\'s playing?" lists tonight\'s names in order', async ({ page }) => {
    await oneRound(page);
    await quiet(page, '← Home').click();
    await whosPlayingFromHome(page);
    const dialog = page.getByRole('dialog', { name: /Start a new game\?/ });
    await expect(dialog).toBeVisible();
    await settle(page); // 1.3.1 (I29, R2): a dialog's buttons are guarded for 500 ms after it opens
    await dialog.getByRole('button', { name: 'Start new', exact: true }).click();
    await settle(page);
    await expect(heading(page, "Who's playing?")).toBeVisible();
    expect(await listed(page)).toEqual(P4);
  });

  test('ended ("End game", then the summary\'s "Home"), then the app opened again (a new visit): "Who\'s playing?" lists tonight\'s names', async ({ page }) => {
    await oneRound(page);
    await quiet(page, 'End game').click();
    await settle(page);
    await quiet(page, 'Home').click();
    await expect(hostAGame(page)).toBeVisible();
    await page.goto(HOME);
    await whosPlayingFromHome(page);
    expect(await listed(page)).toEqual(P4);
  });
});

test.describe('R10, IMP-003: every Enter adds the name typed before it, fast or slow', () => {
  async function toWho(page: Page) {
    await phoneWith(page, [], { now: T0 });
    await settle(page);
    await hostAGame(page).click();
    await settle(page);
    await impostorCard(page).click();
    await settle(page);
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await playerField(page).click();
  }
  const listed = (page: Page) => page.getByRole('button', { name: /^Remove / }).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));

  test('slow typing (one key every 400 ms), a 2 s pause, then Enter: the name is added; again for a second name', async ({ page }) => {
    test.setTimeout(60_000);
    await toWho(page);
    for (const n of ['Riya', 'Arjun']) {
      await page.keyboard.type(n, { delay: 400 });
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');
      await expect(playerField(page)).toHaveValue('');
    }
    expect(await listed(page)).toEqual(['Remove Riya', 'Remove Arjun']);
    await expect(playerField(page)).toBeFocused();
  });

  test('Enter the moment the last letter is typed, then the next name at once: four names, four Enters, all added in order', async ({ page }) => {
    await toWho(page);
    for (const n of P4) { await page.keyboard.type(n, { delay: 0 }); await page.keyboard.press('Enter'); }
    expect(await listed(page)).toEqual(P4.map((n) => `Remove ${n}`));
    await expect(playerField(page)).toHaveValue('');
  });

  test('a slow name right after the screen opens (Enter within the first second): it is added', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await settle(page);
    await hostAGame(page).click();
    await settle(page);
    await impostorCard(page).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await playerField(page).click();
    await page.keyboard.type('Om', { delay: 0 });
    await page.keyboard.press('Enter');
    expect(await listed(page)).toEqual(['Remove Om']);
  });
});

// Keep the imports used only by some layouts referenced (screen B's pad and block).
void privateBlock; void passName;
