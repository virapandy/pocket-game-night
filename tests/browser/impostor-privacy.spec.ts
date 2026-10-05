// Impostor on screen: the deal and its privacy (specs/impostor/02-deal.md, 04-vote-and-reveal.md, 06-words.md,
// 07-secrets-and-seeds.md). C3 browser tests written before the screens exist (Test hooks items 3 to 9).
// IMP-010 to IMP-017, IMP-020, IMP-031, IMP-033, IMP-053, IMP-060, IMP-062, IMP-064.
// Impostor round 4 is built (main df8f362, 4 October 2026): no test here is marked expected-to-fail.
import { expect, test, type Page } from './fixtures';
import { expectOneMainButton } from './helpers';
import {
  CLUES_DONE, KHEER, LONGEST, P4, P5, PANI_PURI, SAMOSA, SCHOOL_TRIP, ci, phrase, result, dealAll, dontKnow, doneButton, exact, expectNoSecrets, freezeClock, fromMenu,
  hold, holdPad, imButton, mainButton, menuButton, onlyEvening, passName, pickerName, press, privateBlock, privateWord,
  release, revealLines, reveal, secretTerms, startEvening, textOf, toPicker, turn, word,
  aheadOfRound5,
  settle,
} from './impostor';

test.use({ viewport: { width: 390, height: 844 } });

const settingsClose = (page: Page) => page.getByRole('button', { name: /^(← Back|Back|Done|Close)$/ }).last();

test.describe('IMP-010: each player sees their role privately, in seat order', () => {
  test('screen A, screen B, the hold, "Done…" only after 500 ms, then the next player', async ({ page }) => {
    await startEvening(page, { seeds: { word: 'w', starter: 's', deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] } });
    await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Riya'));
    await expect(mainButton(page)).toHaveText(exact("I'm Riya"));
    await settle(page); await imButton(page, 'Riya').click();
    // Screen B: RIYA at the top, the pad, "Tap instead"; no word and no main look until "Done…".
    await expect(page.getByRole('heading', { name: new RegExp(`^${ci('Riya')}$`) })).toBeVisible();
    await expect(holdPad(page)).toHaveAccessibleName('Hold here to see your word');
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toBeVisible();
    await expect(privateWord(page)).toHaveCount(0);
    await expectOneMainButton(page, 'screen B before a hold', null);
    // Pressed: the block shows at once, wholly above the pad. (Fake time only, so 499 ms is exactly 499 ms.)
    await freezeClock(page);
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const b = (await privateBlock(page).boundingBox())!;
    const p = (await holdPad(page).boundingBox())!;
    expect(b.y + b.height, 'the block is wholly above the pad').toBeLessThanOrEqual(p.y + 0.5);
    await expectOneMainButton(page, 'screen B while held', null);
    // Let go before 500 ms: the block leaves the page and nothing is added.
    await page.clock.runFor(499);
    await release(page);
    await expect(privateWord(page)).toHaveCount(0);
    // v3.5: the reserved spaces may hold the buttons with visibility: hidden, so "not visible", not "not in the page".
    await expect(doneButton(page)).toBeHidden();
    await expect(dontKnow(page)).toBeHidden();
    // A hold of 500 ms adds "Done, pass to Arjun" and "Don't know this word?".
    await press(page);
    await page.clock.runFor(500);
    await release(page);
    await expect(privateWord(page)).toHaveCount(0);
    await expect(doneButton(page)).toHaveText(exact('Done, pass to Arjun'));
    await expect(dontKnow(page)).toBeVisible();
    await page.clock.resume();
    // Further holds of any length change nothing else.
    await press(page, 50);
    await release(page);
    await expect(doneButton(page)).toHaveText(exact('Done, pass to Arjun'));
    await doneButton(page).click();
    await expect(passName(page)).toHaveText(exact('Arjun'));
    await expect(privateWord(page)).toHaveCount(0);
    await turn(page, 'Arjun');
    await turn(page, 'Meena');
    await settle(page); await imButton(page, 'Kabir').click();
    await hold(page, 600);
    await expect(doneButton(page)).toHaveText(exact("Done, everyone's seen"));
  });

  test('at 812 × 375 the block is wholly left of the pad', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const b = (await privateBlock(page).boundingBox())!;
    const p = (await holdPad(page).boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(p.x + 0.5);
    await release(page);
  });
});

test.describe('IMP-011: what each role sees: always five lines', () => {
  // v3.5: the impostor's line 4 depends on the last-chance guess; lines 1-3 and 5 are checked here, line 4 below.
  test('Easy: the crew sees the word, category and other names; the impostor the category and hint, never the word', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya).toEqual(['Your secret', 'Pani puri', 'Category: Food', "Give one-word clues. Don't say it!", 'Also called Golgappa / Puchka']);
    expect([0, 1, 2, 4].map((i) => lines.Arjun![i])).toEqual(['Your secret', "You're the impostor", 'Category: Food · Hint: Street corner', '']);
    expect(lines.Arjun!.length).toBe(5);
    expect(lines.Meena).toEqual(lines.Riya);
  });

  test('Hard: the crew sees the word only; the impostor nothing', async ({ page }) => {
    await startEvening(page, { mode: 'hard', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya).toEqual(['Your secret', 'Samosa', 'Give one-word clues.', "Don't say it!", '']);
    expect([0, 1, 2, 4].map((i) => lines.Kabir![i])).toEqual(['Your secret', "You're the impostor", 'Listen and blend in.', '']);
    expect(lines.Kabir!.length).toBe(5);
  });

  for (const [mode, off, on] of [['easy', "Listen and blend in. Don't get caught!", 'Listen, blend in, guess the word.'], ['hard', "Don't get caught!", 'Guess the word if caught.']] as const) {
    test(`${mode}: the impostor's line 4 with the last-chance guess off (the default): "${off}"`, async ({ page }) => {
      await startEvening(page, { mode, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Riya', starter: 'Arjun' }] } });
      await settle(page); await imButton(page, 'Riya').click();
      expect((await hold(page, 600))[3]).toBe(off);
    });
    test(`${mode}: the impostor's line 4 with the last-chance guess on: "${on}"`, async ({ page }) => {
      await startEvening(page, { mode, lastGuess: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Riya', starter: 'Arjun' }] } });
      await settle(page); await imButton(page, 'Riya').click();
      expect((await hold(page, 600))[3]).toBe(on);
    });
  }

  test('line 5 is an empty element one small line tall when there are no other names, and always for the impostor', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun' }] } });
    const heights: Record<string, number[]> = {};
    for (const p of ['Riya', 'Arjun']) {
      await settle(page); await imButton(page, p).click();
      await press(page);
      await expect(privateBlock(page)).toBeVisible();
      heights[p] = await privateBlock(page).evaluate((el) => [0, 4].map((i) => (el.children[i] as HTMLElement).getBoundingClientRect().height));
      expect(await privateBlock(page).evaluate((el) => el.children.length)).toBe(5);
      await page.clock.runFor(600);
      await release(page);
      await doneButton(page).click();
    }
    // The impostor's empty line 5 is as tall as a small line (line 1).
    expect(Math.abs(heights.Arjun![1]! - heights.Arjun![0]!)).toBeLessThanOrEqual(1);
  });

  test('IMP-053: "Kheer / Payasam" shows both names, "Also called Payesh", and the result reads "The word was" "Kheer / Payasam"', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: KHEER, impostor: 'Arjun', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya![1]).toBe('Kheer / Payasam');
    expect(lines.Riya![4]).toBe('Also called Payesh');
    await toPicker(page);
    await reveal(page, 'Arjun', 1500);
    await expect(result(page, 'word-label')).toHaveText(exact('The word was', []));
    await expect(result(page, 'result-word')).toHaveText(exact('Kheer / Payasam', []));
    await expect(result(page, 'also-called')).toHaveText('Also called Payesh');
  });
});

test.describe('IMP-012: the impostor\'s turn looks exactly like everyone else\'s', () => {
  /** The page with every player name and the `deal-progress` text replaced by placeholders (IMP-012's property, v3.5). */
  const screen = (page: Page) => page.evaluate((names) => {
    const progress = document.querySelector('[data-testid="deal-progress"]');
    let html = document.body.outerHTML;
    if (progress?.textContent) html = html.split(progress.textContent).join('<PROGRESS>');
    for (const n of names) html = html.replace(new RegExp(n, 'gi'), '<NAME>');
    return html;
  }, P4);

  /** One deal: Riya's and Arjun's screens A and B before any hold; one of them is the impostor. */
  async function compareOneDeal(page: Page, where: string) {
    const aRiya = await screen(page);
    await settle(page); await imButton(page, 'Riya').click();
    const bRiya = await screen(page);
    await hold(page, 600);
    await doneButton(page).click();
    const aArjun = await screen(page);
    await settle(page); await imButton(page, 'Arjun').click();
    const bArjun = await screen(page);
    expect(aArjun, `${where}: screen A`).toBe(aRiya);
    expect(bArjun, `${where}: screen B`).toBe(bRiya);
    await settle(page); // the "··· Menu" button is guarded on the deal screens too (v3.8)
    await fromMenu(page, 'Deal again with a new word');
    await page.getByRole('dialog').getByRole('button', { name: 'Deal again', exact: true }).click();
    await expect(passName(page)).toHaveText(exact('Riya'));
  }

  // Property (200 seeded deals, Easy and Hard): 4 batches of 50, the impostor alternating between Riya and Arjun.
  for (const mode of ['easy', 'hard'] as const) {
    for (const batch of [1, 2]) {
      test(`property: screens A and B are the same for crew and impostor once names are replaced (${mode}, deals ${batch * 50 - 49}–${batch * 50})`, async ({ page }) => {
        test.setTimeout(240_000);
        const deals = Array.from({ length: 51 }, (_, k) => ({ impostor: k % 2 ? 'Riya' : 'Arjun' }));
        await startEvening(page, { mode, seeds: { word: `imp012-${mode}-${batch}`, starter: `imp012-s-${mode}-${batch}`, deals } });
        for (let k = 0; k < 50; k++) await compareOneDeal(page, `${mode} deal ${k + 1}`);
      });
    }
  }

  test('"Done…" appears at the same moment for the same hold, and every press vibrates once (10 ms), crew and impostor alike', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__vibrations = [];
      Object.defineProperty(Navigator.prototype, 'vibrate', { configurable: true, value: (p: unknown) => { (window as any).__vibrations.push(p); return true; } });
      (window as any).__sounds = [];
    });
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    for (const p of ['Riya', 'Arjun']) {
      await settle(page); await imButton(page, p).click();
      await freezeClock(page); // fake time only, so 499 ms is exactly 499 ms
      await press(page, 499);
      await release(page);
      await expect(doneButton(page), `${p}: 499 ms adds nothing`).toBeHidden();
      await press(page, 500);
      await release(page);
      await expect(doneButton(page), `${p}: 500 ms adds "Done…"`).toBeVisible();
      await page.clock.resume();
      expect(await page.evaluate(() => (window as any).__vibrations), `${p}: one vibrate(10) per press`).toEqual([10, 10]);
      await page.evaluate(() => { (window as any).__vibrations = []; });
      await doneButton(page).click();
    }
    expect(await page.evaluate(() => (window as any).__sounds ?? []), 'no sound during the deal').toEqual([]);
  });

  test('private-word is a box exactly 2 lines tall; the longest word fits in 2 lines, 30 to 36 px, at 320 wide (v3.5, F11)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await startEvening(page, { seeds: { deals: [{ wordId: LONGEST, impostor: 'Kabir' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateWord(page)).toHaveText(word(LONGEST).word);
    const fit = await privateWord(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { h: el.getBoundingClientRect().height, lh: parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2, sw: el.scrollWidth, cw: el.clientWidth, fs: parseFloat(s.fontSize) };
    });
    expect(Math.abs(fit.h - 2 * fit.lh), 'a box exactly 2 line-heights tall').toBeLessThanOrEqual(0.5);
    expect(fit.sw).toBeLessThanOrEqual(fit.cw);
    expect(fit.fs).toBeGreaterThanOrEqual(30);
    expect(fit.fs).toBeLessThanOrEqual(36);
    await release(page);
  });
});

test.describe('IMP-013 and IMP-062: the word is never in the page except while held', () => {
  for (const mode of ['easy', 'hard'] as const) {
    test(`${mode}: no word, other name, hint, role${mode === 'hard' ? ' or category' : ''} on any screen of the round before the result shows the word`, async ({ page }) => {
      test.setTimeout(90_000);
      await startEvening(page, { mode, seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Meena' }] } });
      const terms = secretTerms(PANI_PURI, mode);
      const check = (where: string) => expectNoSecrets(page, terms, where);
      await check('screen A');
      await settle(page); await imButton(page, 'Riya').click();
      await check('screen B before a hold');
      await hold(page, 600);
      await check('screen B between holds');
      // The menu, Rules and Settings from the deal.
      await menuButton(page).click();
      await check('the deal menu');
      await page.getByRole('menuitem', { name: 'How to play', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
      await check('How to play');
      await mainButton(page).filter({ hasText: /^Done$/ }).click();
      await fromMenu(page, 'Settings');
      await check('Settings');
      await settingsClose(page).click();
      await doneButton(page).click();
      for (const p of ['Arjun', 'Meena', 'Kabir']) { await check(`${p}'s screen A`); await turn(page, p); }
      await check('the clues');
      await fromMenu(page, 'See my word again');
      await expect(page.getByRole('dialog', { name: /Whose word\?/ })).toBeVisible();
      await check('"Whose word?"');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await settle(page); // the clues screen's buttons are guarded for 500 ms after it shows again (v3.8)
      await mainButton(page).filter({ hasText: CLUES_DONE }).click();
      await check('the talk');
      await mainButton(page).filter({ hasText: 'Vote now' }).click();
      await page.clock.runFor(2000);
      await check('the countdown');
      await page.clock.runFor(4000);
      await expect(page.getByRole('heading', { name: 'Who got the most fingers?' })).toBeVisible();
      await check('the picker');
      // IMP-033 (v3.5, the last-chance guess off): the build-up shows no secret; the result shows the word at 1.5 s.
      await reveal(page, 'Arjun', 1000);
      await expect(result(page, 'build-up')).toBeVisible();
      await check('the build-up');
      await page.clock.runFor(500);
      await expect(result(page, 'result-word')).toHaveText(exact('Pani puri', []));
    });
  }

  test('nothing on the pad or the block can be selected, copied, looked up or dragged', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const bad = await page.evaluate(() => {
      const els = [document.querySelector('[data-testid="hold-pad"]'), document.querySelector('[data-testid="private-block"]')]
        .flatMap((el) => (el ? [el, ...Array.from(el.querySelectorAll('*'))] : [])) as HTMLElement[];
      const out: string[] = [];
      if (els.length < 2) out.push('pad or block missing');
      for (const el of els) {
        const s = getComputedStyle(el) as any;
        const id = el.getAttribute('data-testid') ?? el.tagName;
        if (s.userSelect !== 'none') out.push(`${id} user-select ${s.userSelect}`);
        if ((s.webkitUserSelect ?? 'none') !== 'none') out.push(`${id} -webkit-user-select ${s.webkitUserSelect}`);
        if ((s.webkitTouchCallout ?? 'none') !== 'none') out.push(`${id} -webkit-touch-callout ${s.webkitTouchCallout}`);
        if (s.getPropertyValue('-webkit-user-drag') && s.getPropertyValue('-webkit-user-drag') !== 'none') out.push(`${id} -webkit-user-drag`);
        if (el.getAttribute('draggable') !== 'false') out.push(`${id} draggable="${el.getAttribute('draggable')}"`);
        const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        el.dispatchEvent(ev);
        if (!ev.defaultPrevented) out.push(`${id} contextmenu not prevented`);
      }
      return out;
    });
    await release(page);
    expect(bad).toEqual([]);
  });
});

test.describe('IMP-014: tap to show, for players who can\'t hold', () => {
  test('with the setting on: "Tap to see your word", "Tap to hide", hidden again after 8 s, then "Done…"', async ({ page }) => {
    await startEvening(page, { storage: { 'pgn.pref.impostor.tapToShow': true }, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toBeHidden();
    await expectOneMainButton(page, 'tap mode before a tap', null);
    await freezeClock(page); // fake time only, so 7,999 ms is exactly 7,999 ms
    await holdPad(page).click();
    await expect(privateWord(page)).toHaveText('Samosa');
    await expect(holdPad(page)).toHaveAccessibleName('Tap to hide');
    await page.clock.runFor(7999);
    await expect(privateWord(page)).toHaveText('Samosa');
    await page.clock.runFor(1);
    await expect(privateWord(page)).toHaveCount(0);
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await expect(doneButton(page)).toHaveText(exact('Done, pass to Arjun'));
    await expect(dontKnow(page)).toBeVisible();
  });

  test('"Tap instead" switches only this player\'s turn; the next player starts in hold mode', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await settle(page); // screen B's buttons are guarded for 500 ms (v3.8)
    await page.getByRole('button', { name: 'Tap instead', exact: true }).click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await holdPad(page).click();
    await expect(privateWord(page)).toHaveText('Samosa');
    await holdPad(page).click(); // "Tap to hide"
    await expect(privateWord(page)).toHaveCount(0);
    await doneButton(page).click();
    await settle(page); await imButton(page, 'Arjun').click();
    await expect(holdPad(page)).toHaveAccessibleName('Hold here to see your word');
  });
});

test.describe('IMP-015: "Don\'t know this word?" redeals without giving anything away', () => {
  test('"New word for everyone?": "Back" (main) changes nothing; "New word" records dontKnow, then "No problem! New word coming." and back to the first player, with a new word', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }, { wordId: PANI_PURI, impostor: 'Kabir', starter: 'Riya' }] } });
    await turn(page, 'Riya');
    await turn(page, 'Arjun');
    await settle(page); await imButton(page, 'Meena').click();
    await hold(page, 600);
    const before = (await onlyEvening(page)).records.length;
    await dontKnow(page).click();
    const dialog = page.getByRole('dialog', { name: /New word for everyone\?/ });
    await expect(dialog).toBeVisible();
    await expectOneMainButton(page, '"New word for everyone?"', 'Back', true);
    await dialog.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(dontKnow(page)).toBeVisible();
    expect((await onlyEvening(page)).records.length, '"Back" records nothing').toBe(before);
    await dontKnow(page).click();
    await page.getByRole('dialog', { name: /New word for everyone\?/ }).getByRole('button', { name: 'New word', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No problem! New word coming.' })).toBeVisible();
    await expect(page.getByText(exact('Pass the phone back to Riya'))).toBeVisible();
    await expect(mainButton(page)).toHaveText(exact("I'm Riya"));
    await expectNoSecrets(page, [...secretTerms(SAMOSA, 'hard'), ...secretTerms(PANI_PURI, 'hard')], '"No problem!"');
    const after = await onlyEvening(page);
    expect(after.records.length).toBe(before + 1);
    expect(after.records.at(-1).move).toEqual({ type: 'dontKnow', wordId: PANI_PURI });
    await settle(page); await imButton(page, 'Riya').click();
    const lines = await hold(page, 600);
    expect(lines[1]).toBe('Pani puri');
  });

  test('the button is the same on the impostor\'s screen B', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Riya' }] } });
    await settle(page); await imButton(page, 'Riya').click();
    await hold(page, 600);
    await expect(dontKnow(page)).toBeVisible();
  });
});

test.describe('IMP-016 and IMP-020: straight to the clues; who starts', () => {
  test('after the last "Done": everyone has seen, phone in the middle, MEENA starts, "Each say one word about your secret:", then the order from her', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] } });
    await dealAll(page, P5);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('starter-name')).toHaveText(exact('Meena'));
    await expect(page.getByText('starts', { exact: true })).toBeVisible();
    await expect(page.getByText('Each say one word about your secret:', { exact: true })).toBeVisible();
    await expect(page.getByTestId('clue-order')).toHaveText(exact('Meena → Kabir → Zoya → Riya → Arjun'));
    await expect(mainButton(page)).toHaveText('Clues done, talk it over');
    await expect(page.getByRole('button', { name: 'Go round again', exact: true })).toBeVisible();
    await expect(page.getByTestId('announcer')).toContainText(phrase('Meena starts. Each say one word about your secret: Meena, Kabir, Zoya, Riya, Arjun'));
  });

  test('Timer: the clues screen\'s main button is "Clues done, start timer" (IMP-016, v3.8)', async ({ page }) => {
    await startEvening(page, { talking: 'timer', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await dealAll(page);
    await expect(mainButton(page)).toHaveText(exact('Clues done, start timer', []));
  });
});

test.describe('IMP-017: see my word again', () => {
  test('from the clues: "Whose word?", Meena\'s turn again with "Done, back to clues" (v3.8), then the same screen; nothing recorded', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    const before = (await onlyEvening(page)).records;
    const order = await page.getByTestId('clue-order').textContent();
    await fromMenu(page, 'See my word again');
    const dialog = page.getByRole('dialog', { name: /Whose word\?/ });
    await expect(dialog).toBeVisible();
    expect(await textOf(dialog.getByRole('button'))).toEqual([...P4, 'Cancel']);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('clue-order')).toBeVisible();
    await fromMenu(page, 'See my word again');
    await page.getByRole('dialog', { name: /Whose word\?/ }).getByRole('button', { name: 'Meena', exact: true }).click();
    await expect(passName(page)).toHaveText(exact('Meena'));
    await expect(menuButton(page)).toHaveCount(0);
    await settle(page); await imButton(page, 'Meena').click();
    await expect(menuButton(page)).toHaveCount(0);
    const lines = await hold(page, 600);
    expect(lines[1]).toBe('Samosa');
    await expect(dontKnow(page)).toBeHidden();
    // v3.8 (IMP-017): opened from the clues screen, her main button reads "Done, back to clues".
    await expect(mainButton(page)).toHaveText(exact('Done, back to clues', []));
    await mainButton(page).click();
    await expect(page.getByTestId('clue-order')).toHaveText(order!);
    expect((await onlyEvening(page)).records).toEqual(before);
  });

  test('v3.5: screen A of "See my word again" shows "Everyone else, look away!" and no deal-progress (IMP-017, IMP-019)', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await fromMenu(page, 'See my word again');
    await page.getByRole('dialog', { name: /Whose word\?/ }).getByRole('button', { name: 'Meena', exact: true }).click();
    await expect(page.getByTestId('look-away')).toHaveText(exact('Everyone else, look away!', []));
    await expect(page.getByTestId('deal-progress')).toHaveCount(0);
    await settle(page); await imButton(page, 'Meena').click();
    await expect(page.getByTestId('deal-progress')).toHaveCount(0);
  });
});

// v2.2's caught flow ("Caught red-handed!", the guess before "Show the word") is retired: v3.5 IMP-033 and IMP-039.
test.describe('IMP-031, IMP-033, IMP-039: pick, then reveal; the word stays secret until the result shows it', () => {
  test('the picker, then (guess off) only "Arjun was…" for 1.5 s with no secret, then the result with the word', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await toPicker(page);
    const revealBtn = mainButton(page);
    await expect(revealBtn).toHaveText('Reveal');
    await expect(revealBtn).toBeDisabled();
    await pickerName(page, 'Arjun').click();
    await expect(revealBtn).toHaveText(exact('Reveal Arjun'));
    await expectNoSecrets(page, secretTerms(PANI_PURI, 'easy'), 'the picker with a name picked');
    await freezeClock(page);
    await revealBtn.click();
    await expect(result(page, 'build-up')).toHaveText(exact('Arjun was…'));
    await expectNoSecrets(page, secretTerms(PANI_PURI, 'easy'), 'the build-up');
    expect((await onlyEvening(page)).records.at(-1).move).toEqual({ type: 'reveal', player: 'Arjun' });
    await page.clock.runFor(1499);
    await expect(result(page, 'result-word')).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(result(page, 'result-word')).toHaveText(exact('Pani puri', []));
  });

  test('guess on: "✓ Caught!", ARJUN was the impostor and the guess line, with no word in the page; "Arjun guessed. Show the word" shows it and the verdict buttons', async ({ page }) => {
    await startEvening(page, { lastGuess: true, seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await toPicker(page);
    await reveal(page, 'Arjun', 1500);
    await expect(result(page, 'result-headline')).toHaveText(exact('✓ Caught!', []));
    await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
    await expect(result(page, 'guess-line')).toHaveText(exact('Last chance, Arjun! Guess the word out loud. Get it right and you win the round.'));
    await expectNoSecrets(page, secretTerms(PANI_PURI, 'easy'), 'the guess step');
    await mainButton(page).filter({ hasText: exact('Arjun guessed. Show the word') }).click();
    expect((await onlyEvening(page)).records.at(-1).move).toEqual({ type: 'showWord' });
    await expect(result(page, 'result-word')).toHaveText(exact('Pani puri', []));
    await expect(result(page, 'also-called')).toHaveText('Also called Golgappa / Puchka');
    await expect(page.getByRole('button', { name: 'Guessed right', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Wrong guess', exact: true })).toBeVisible();
    await expectOneMainButton(page, 'the verdict step', null);
  });
});

test.describe('IMP-060 and IMP-064: seeds made on the phone; test seeds honoured in preview builds', () => {
  test('without test seeds, a new evening has a fresh word seed and starter seed, different each evening', async ({ page }) => {
    await startEvening(page);
    const a = await onlyEvening(page);
    expect(typeof a.setup.seeds.word).toBe('string');
    expect(typeof a.setup.seeds.starter).toBe('string');
    expect(a.setup.seeds.word.length).toBeGreaterThanOrEqual(8);
    expect(a.setup.seeds.word).not.toBe(a.setup.seeds.starter);
    expect(a.setup.config.testDeals).toBeUndefined();
    await startEvening(page);
    const b = await onlyEvening(page);
    expect(b.setup.seeds.word).not.toBe(a.setup.seeds.word);
    expect(b.setup.seeds.starter).not.toBe(a.setup.seeds.starter);
  });

  test('in a preview build, pgn.test.seeds sets the evening\'s seeds and its forced deals exactly', async ({ page }) => {
    const seeds = { word: 'imp064-word', starter: 'imp064-starter', deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] };
    await startEvening(page, { seeds });
    const e = await onlyEvening(page);
    expect(e.setup.seeds).toEqual({ word: 'imp064-word', starter: 'imp064-starter' });
    expect(e.setup.config.testDeals).toEqual(seeds.deals);
  });
});

test('IMP-010: screens A and B never show the previous player\'s block, even after a quick double tap on "Done…"', async ({ page }) => {
  await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir' }] } });
  await settle(page); await imButton(page, 'Riya').click();
  await hold(page, 600);
  await doneButton(page).dblclick();
  await expect(privateWord(page)).toHaveCount(0);
  await expectNoSecrets(page, secretTerms(SAMOSA, 'hard'), 'after a double tap on "Done…"');
});
