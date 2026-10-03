// Expected to fail (not built yet): tests marked `test.fail` wait for the Impostor screens (owner decision 2026-10-03).
// A marked test that starts passing turns red: then remove its `.fail` mark. What each test checks is unchanged.
// Impostor on screen: the deal and its privacy (specs/impostor/02-deal.md, 04-vote-and-reveal.md, 06-words.md,
// 07-secrets-and-seeds.md). C3 browser tests written before the screens exist (Test hooks items 3 to 9).
// IMP-010 to IMP-017, IMP-020, IMP-031, IMP-033, IMP-053, IMP-060, IMP-062, IMP-064.
import { expect, test, type Page } from './fixtures';
import { expectOneMainButton } from './helpers';
import {
  KHEER, LONGEST, P4, P5, PANI_PURI, SAMOSA, ci, phrase, dealAll, dontKnow, doneButton, exact, expectNoSecrets, freezeClock, fromMenu,
  hold, holdPad, imButton, mainButton, menuButton, onlyEvening, passName, pickerName, press, privateBlock, privateWord,
  release, revealLines, reveal, secretTerms, startEvening, textOf, toPicker, turn, word,
} from './impostor';

test.use({ viewport: { width: 390, height: 844 } });

const settingsClose = (page: Page) => page.getByRole('button', { name: /^(← Back|Back|Done|Close)$/ }).last();

test.describe('IMP-010: each player sees their role privately, in seat order', () => {
  test('screen A, screen B, the hold, "Done…" only after 500 ms, then the next player', async ({ page }) => {
    await startEvening(page, { seeds: { word: 'w', starter: 's', deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] } });
    await expect(page.getByText('Pass the phone to', { exact: true })).toBeVisible();
    await expect(passName(page)).toHaveText(exact('Riya'));
    await expect(mainButton(page)).toHaveText(exact("I'm Riya"));
    await imButton(page, 'Riya').click();
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
    await expect(doneButton(page)).toHaveCount(0);
    await expect(dontKnow(page)).toHaveCount(0);
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
    await imButton(page, 'Kabir').click();
    await hold(page, 600);
    await expect(doneButton(page)).toHaveText(exact("Done, everyone's seen"));
  });

  test('at 812 × 375 the block is wholly left of the pad', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const b = (await privateBlock(page).boundingBox())!;
    const p = (await holdPad(page).boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(p.x + 0.5);
    await release(page);
  });
});

test.describe('IMP-011: what each role sees: always five lines', () => {
  test('Easy: the crew sees the word, category and other names; the impostor the category and hint, never the word', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya).toEqual(['Your secret', 'Pani puri', 'Category: Food', "Give one-word clues. Don't say it!", 'Also called Golgappa / Puchka']);
    expect(lines.Arjun).toEqual(['Your secret', "You're the impostor", 'Category: Food · Hint: Street corner', 'Listen, blend in, guess the word.', '']);
    expect(lines.Meena).toEqual(lines.Riya);
  });

  test('Hard: the crew sees the word only; the impostor nothing', async ({ page }) => {
    await startEvening(page, { mode: 'hard', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Kabir', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya).toEqual(['Your secret', 'Samosa', 'Give one-word clues.', "Don't say it!", '']);
    expect(lines.Kabir).toEqual(['Your secret', "You're the impostor", 'Listen and blend in.', 'Guess the word if caught.', '']);
  });

  test('line 5 is an empty element one small line tall when there are no other names, and always for the impostor', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun' }] } });
    const heights: Record<string, number[]> = {};
    for (const p of ['Riya', 'Arjun']) {
      await imButton(page, p).click();
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

  test.fail('IMP-053: "Kheer / Payasam" shows both names, "Also called Payesh", and the reveal reads "The word was Kheer / Payasam."', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: KHEER, impostor: 'Arjun', starter: 'Riya' }] } });
    const lines = await dealAll(page);
    expect(lines.Riya![1]).toBe('Kheer / Payasam');
    expect(lines.Riya![4]).toBe('Also called Payesh');
    await toPicker(page);
    await reveal(page, 'Arjun');
    await mainButton(page).filter({ hasText: 'Show the word' }).click();
    await expect(revealLines(page).last()).toHaveText('The word was Kheer / Payasam.');
    await expect(page.getByTestId('also-called')).toHaveText('Also called Payesh');
  });
});

test.describe('IMP-012: the impostor\'s turn looks exactly like everyone else\'s', () => {
  /** The page with every player name replaced by one placeholder (IMP-012's property). */
  const screen = (page: Page) => page.evaluate((names) => {
    let html = document.body.outerHTML;
    for (const n of names) html = html.replace(new RegExp(n, 'gi'), '<NAME>');
    return html;
  }, P4);

  /** One deal: Riya's and Arjun's screens A and B before any hold; one of them is the impostor. */
  async function compareOneDeal(page: Page, where: string) {
    const aRiya = await screen(page);
    await imButton(page, 'Riya').click();
    const bRiya = await screen(page);
    await hold(page, 600);
    await doneButton(page).click();
    const aArjun = await screen(page);
    await imButton(page, 'Arjun').click();
    const bArjun = await screen(page);
    expect(aArjun, `${where}: screen A`).toBe(aRiya);
    expect(bArjun, `${where}: screen B`).toBe(bRiya);
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
      await imButton(page, p).click();
      await freezeClock(page); // fake time only, so 499 ms is exactly 499 ms
      await press(page, 499);
      await release(page);
      await expect(doneButton(page), `${p}: 499 ms adds nothing`).toHaveCount(0);
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

  test('the longest word fits the block in 3 lines', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await startEvening(page, { seeds: { deals: [{ wordId: LONGEST, impostor: 'Kabir' }] } });
    await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateWord(page)).toHaveText(word(LONGEST).word);
    const fit = await privateWord(page).evaluate((el) => {
      const s = getComputedStyle(el);
      return { h: el.getBoundingClientRect().height, lh: parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2, sw: el.scrollWidth, cw: el.clientWidth, fs: parseFloat(s.fontSize) };
    });
    expect(fit.h).toBeLessThanOrEqual(3 * fit.lh + 0.5);
    expect(fit.sw).toBeLessThanOrEqual(fit.cw);
    expect(fit.fs).toBeGreaterThanOrEqual(30);
    expect(fit.fs).toBeLessThanOrEqual(36);
    await release(page);
  });
});

test.describe('IMP-013 and IMP-062: the word is never in the page except while held', () => {
  for (const mode of ['easy', 'hard'] as const) {
    test.fail(`${mode}: no word, other name, hint, role${mode === 'hard' ? ' or category' : ''} on any screen of the round before the reveal`, async ({ page }) => {
      test.setTimeout(90_000);
      await startEvening(page, { mode, seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Meena' }] } });
      const terms = secretTerms(PANI_PURI, mode);
      const check = (where: string) => expectNoSecrets(page, terms, where);
      await check('screen A');
      await imButton(page, 'Riya').click();
      await check('screen B before a hold');
      await hold(page, 600);
      await check('screen B between holds');
      // The menu, Rules and Settings from the deal.
      await menuButton(page).click();
      await check('the deal menu');
      await page.getByRole('menuitem', { name: 'Rules', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
      await check('Rules');
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
      await mainButton(page).filter({ hasText: 'Talk it over' }).click();
      await check('the talk');
      await mainButton(page).filter({ hasText: 'Vote now' }).click();
      await page.clock.runFor(2000);
      await check('the countdown');
      await page.clock.runFor(4000);
      await expect(page.getByRole('heading', { name: 'Who got the most fingers?' })).toBeVisible();
      await check('the picker');
      // IMP-033: through the reveal, until "Show the word".
      await reveal(page, 'Arjun', 4500);
      await check('the reveal before "Show the word"');
      await mainButton(page).filter({ hasText: 'Show the word' }).click();
      await expect(revealLines(page).last()).toHaveText('The word was Pani puri.');
    });
  }

  test('nothing on the pad or the block can be selected, copied, looked up or dragged', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await imButton(page, 'Riya').click();
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
    await imButton(page, 'Riya').click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await expect(page.getByRole('button', { name: 'Tap instead', exact: true })).toHaveCount(0);
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
    await imButton(page, 'Riya').click();
    await page.getByRole('button', { name: 'Tap instead', exact: true }).click();
    await expect(holdPad(page)).toHaveAccessibleName('Tap to see your word');
    await holdPad(page).click();
    await expect(privateWord(page)).toHaveText('Samosa');
    await holdPad(page).click(); // "Tap to hide"
    await expect(privateWord(page)).toHaveCount(0);
    await doneButton(page).click();
    await imButton(page, 'Arjun').click();
    await expect(holdPad(page)).toHaveAccessibleName('Hold here to see your word');
  });
});

test.describe('IMP-015: "Don\'t know this word?" redeals without giving anything away', () => {
  test('"No problem! New word coming." and back to the first player, with a new word', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }, { wordId: PANI_PURI, impostor: 'Kabir', starter: 'Riya' }] } });
    await turn(page, 'Riya');
    await turn(page, 'Arjun');
    await imButton(page, 'Meena').click();
    await hold(page, 600);
    const before = (await onlyEvening(page)).records.length;
    await dontKnow(page).click();
    await expect(page.getByRole('heading', { name: 'No problem! New word coming.' })).toBeVisible();
    await expect(page.getByText(exact('Pass the phone back to Riya'))).toBeVisible();
    await expect(mainButton(page)).toHaveText(exact("I'm Riya"));
    await expectNoSecrets(page, [...secretTerms(SAMOSA, 'hard'), ...secretTerms(PANI_PURI, 'hard')], '"No problem!"');
    const after = await onlyEvening(page);
    expect(after.records.length).toBe(before + 1);
    expect(after.records.at(-1).move).toEqual({ type: 'dontKnow' });
    await imButton(page, 'Riya').click();
    const lines = await hold(page, 600);
    expect(lines[1]).toBe('Pani puri');
  });

  test('the button is the same on the impostor\'s screen B', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Riya' }] } });
    await imButton(page, 'Riya').click();
    await hold(page, 600);
    await expect(dontKnow(page)).toBeVisible();
  });
});

test.describe('IMP-016 and IMP-020: straight to the clues; who starts', () => {
  test('after the last "Done": everyone has seen, phone in the middle, MEENA starts, then clockwise from her', async ({ page }) => {
    await startEvening(page, { players: P5, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Meena' }] } });
    await dealAll(page, P5);
    await expect(page.getByText('Phone in the middle, face up.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('starter-name')).toHaveText(exact('Meena'));
    await expect(page.getByText('starts', { exact: true })).toBeVisible();
    await expect(page.getByTestId('clue-order')).toHaveText(exact('then clockwise: Meena → Kabir → Zoya → Riya → Arjun'));
    await expect(mainButton(page)).toHaveText('Talk it over');
    await expect(page.getByRole('button', { name: 'Another round of clues', exact: true })).toBeVisible();
    await expect(page.getByTestId('announcer')).toContainText(phrase('Meena starts, then clockwise: Meena, Kabir, Zoya, Riya, Arjun'));
  });

  test('Timer: the clues screen\'s main button is "Start the 2-minute timer"', async ({ page }) => {
    await startEvening(page, { talking: 'timer', seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun' }] } });
    await dealAll(page);
    await expect(mainButton(page)).toHaveText('Start the 2-minute timer');
  });
});

test.describe('IMP-017: see my word again', () => {
  test('from the clues: "Whose word?", Meena\'s turn again with "Done, everyone\'s seen", then the same screen; nothing recorded', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    const before = (await onlyEvening(page)).records;
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
    await imButton(page, 'Meena').click();
    await expect(menuButton(page)).toHaveCount(0);
    const lines = await hold(page, 600);
    expect(lines[1]).toBe('Samosa');
    await expect(dontKnow(page)).toHaveCount(0);
    await expect(doneButton(page)).toHaveText(exact("Done, everyone's seen"));
    await doneButton(page).click();
    await expect(page.getByTestId('clue-order')).toHaveText(exact('then clockwise: Riya → Arjun → Meena → Kabir'));
    expect((await onlyEvening(page)).records).toEqual(before);
  });
});

test.describe('IMP-031 and IMP-033: pick, then reveal; caught, the guess before the word', () => {
  test.fail('the picker, the build-up, "Caught red-handed!", the guess, then "Show the word" and the verdict', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [{ wordId: PANI_PURI, impostor: 'Arjun', starter: 'Riya' }] } });
    await dealAll(page);
    await toPicker(page);
    const revealBtn = mainButton(page);
    await expect(revealBtn).toHaveText('Reveal');
    await expect(revealBtn).toBeDisabled();
    await pickerName(page, 'Arjun').click();
    await expect(pickerName(page, 'Arjun')).toHaveAttribute('aria-pressed', 'true');
    await expect(revealBtn).toHaveText(exact('Reveal Arjun'));
    await pickerName(page, 'Meena').click();
    await expect(pickerName(page, 'Arjun')).toHaveAttribute('aria-pressed', 'false');
    await expect(revealBtn).toHaveText(exact('Reveal Meena'));
    await pickerName(page, 'Arjun').click();
    await expectNoSecrets(page, secretTerms(PANI_PURI, 'easy'), 'the picker with a name picked');
    await revealBtn.click();
    await expect(revealLines(page)).toHaveCount(1);
    await expect(revealLines(page).first()).toContainText(new RegExp(`^${ci('Arjun')} was`));
    await page.clock.runFor(2500);
    await expect(revealLines(page)).toHaveCount(1);
    await expect(revealLines(page).first()).toHaveText(exact('Caught red-handed! Arjun was the impostor.'));
    await page.clock.runFor(1500);
    await expect(revealLines(page)).toHaveCount(2);
    await expect(revealLines(page).nth(1)).toHaveText(exact('Arjun, one guess. Say it out loud! (No repeating the clues.)'));
    await expect(mainButton(page)).toHaveText('Show the word');
    await expectNoSecrets(page, secretTerms(PANI_PURI, 'easy'), 'the reveal before "Show the word"');
    const recs = (await onlyEvening(page)).records;
    expect(recs.at(-1).move).toEqual({ type: 'reveal', player: 'Arjun' });
    await mainButton(page).click();
    await expect(revealLines(page).nth(2)).toHaveText('The word was Pani puri.');
    await expect(page.getByTestId('also-called')).toHaveText('Also called Golgappa / Puchka');
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
  await imButton(page, 'Riya').click();
  await hold(page, 600);
  await doneButton(page).dblclick();
  await expect(privateWord(page)).toHaveCount(0);
  await expectNoSecrets(page, secretTerms(SAMOSA, 'hard'), 'after a double tap on "Done…"');
});
