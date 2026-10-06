// Impostor round 6, P1 (scenarios v3.9, IMP-017, decision I28, 6 October 2026), privacy-critical (C3 by the reviewer):
// in "See my word again" a wrong name taps "Not Meena? ← Back" (screen A under "Everyone else, look away!"; screen B under
// the pad until the word first shows, then hidden with its space kept) and returns to "Whose word?" with nothing recorded,
// the timer still paused, and no word, hint or impostor card ever in the page, the same for every role; both phones.
// Expected to fail until lane T is on main (`aheadOfRound6`).
import { expect, test, type Page } from './fixtures';
import { CLUES_DONE, P4, SAMOSA, TZ, aheadOfRound6, dealAll, exact, hold, holdPad, imButton, mainButton, onlyEvening, passName, privateBlock, secretTerms, settle, startEvening, textOf } from './impostor';

/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const DEAL = { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' };
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const records = async (page: Page) => (await onlyEvening(page)).records.map((r: any) => r.move);
const notBack = (page: Page, name: string) => page.getByRole('button', { name: `Not ${name}? ← Back`, exact: true });
const whoseWord = (page: Page) => page.getByRole('dialog', { name: /Whose word\?/ });

/** Records every moment a private block or any secret term appears in the page. */
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

test.describe('P1, IMP-017: "See my word again", a wrong name goes back without seeing a card', () => {
  for (const who of ['Arjun', 'Meena'] as const) {
    test(`the wrong name ${who}${who === 'Arjun' ? ' (the impostor)' : ''} on screen A: "Not ${who}? ← Back" directly under "Everyone else, look away!" returns to "Whose word?"; no card was ever shown; nothing recorded`, async ({ page }) => {
      aheadOfRound6('P1', `"Not ${who}? ← Back" on screen A of "See my word again"`);
      await startEvening(page, { seeds: { deals: [DEAL] } });
      await dealAll(page);
      const before = await records(page);
      await watchForCards(page, [...secretTerms(SAMOSA, 'easy'), "You're the impostor"]);
      await quiet(page, 'See my word again').click();
      await whoseWord(page).getByRole('button', { name: who, exact: true }).click();
      await expect(passName(page)).toHaveText(exact(who, P4));
      const back = notBack(page, who);
      await expect(back).toBeVisible();
      const look = (await page.getByTestId('look-away').boundingBox())!, b = (await back.boundingBox())!;
      expect(b.y, 'under "Everyone else, look away!"').toBeGreaterThanOrEqual(look.y + look.height - 1);
      expect(b.y - (look.y + look.height), 'directly under').toBeLessThanOrEqual(24);
      await settle(page);
      await back.click();
      await expect(whoseWord(page)).toBeVisible();
      expect(await textOf(whoseWord(page).getByRole('button')), 'the dialog again, with every name').toEqual([...P4, 'Cancel']);
      expect(await cardsSeen(page), 'no card, word, hint or role was ever on the page').toEqual([]);
      expect(await records(page)).toEqual(before);
    });

    test(`the wrong name ${who}${who === 'Arjun' ? ' (the impostor)' : ''} on screen B before any hold: "Not ${who}? ← Back" directly under the pad returns to "Whose word?"; no card was ever shown; nothing recorded`, async ({ page }) => {
      aheadOfRound6('P1', `"Not ${who}? ← Back" on screen B of "See my word again"`);
      await startEvening(page, { seeds: { deals: [DEAL] } });
      await dealAll(page);
      const before = await records(page);
      await watchForCards(page, [...secretTerms(SAMOSA, 'easy'), "You're the impostor"]);
      await quiet(page, 'See my word again').click();
      await whoseWord(page).getByRole('button', { name: who, exact: true }).click();
      await settle(page);
      await imButton(page, who).click();
      await expect(holdPad(page)).toBeVisible();
      const back = notBack(page, who);
      await expect(back).toBeVisible();
      const pad = (await holdPad(page).boundingBox())!, b = (await back.boundingBox())!;
      expect(b.y, 'under the pad').toBeGreaterThanOrEqual(pad.y + pad.height - 1);
      expect(b.y - (pad.y + pad.height), 'directly under').toBeLessThanOrEqual(12);
      await settle(page);
      await back.click();
      await expect(whoseWord(page)).toBeVisible();
      await expect(privateBlock(page)).toHaveCount(0);
      expect(await cardsSeen(page), 'no card, word, hint or role was ever on the page').toEqual([]);
      expect(await records(page)).toEqual(before);
      // The right name then sees their own card as before, and the button goes after the first hold.
      await whoseWord(page).getByRole('button', { name: 'Riya', exact: true }).click();
      await settle(page);
      await imButton(page, 'Riya').click();
      await hold(page, 600);
      await expect(notBack(page, 'Riya')).toBeHidden();
      // Hidden with its space kept (visibility: hidden), as "Not Riya? ← Back" in the deal (IMP-010).
      const kept = await page.getByText('Not Riya? ← Back', { exact: true }).evaluateAll((els) => els.map((el) => getComputedStyle(el.closest('button') ?? el).visibility));
      if (kept.length) expect(kept[0], 'hidden with its space kept').toBe('hidden');
      await expect(mainButton(page)).toHaveText(exact('Done, back to clues', []));
    });
  }

  test('Timer: from the talk screen, a wrong name and "Not Meena? ← Back" return to "Whose word?" with the timer still paused', async ({ page }) => {
    aheadOfRound6('P1', '"Not Meena? ← Back" keeps the timer paused');
    await startEvening(page, { talking: 'timer', seeds: { deals: [DEAL] } });
    await dealAll(page);
    await mainButton(page).filter({ hasText: CLUES_DONE }).click();
    await page.clock.runFor(10_000);
    await quiet(page, 'See my word again').click();
    await whoseWord(page).getByRole('button', { name: 'Meena', exact: true }).click();
    await page.clock.runFor(30_000);
    await settle(page);
    await notBack(page, 'Meena').click();
    await expect(whoseWord(page)).toBeVisible();
    await page.clock.runFor(30_000);
    await whoseWord(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByTestId('timer'), 'paused since "Whose word?" opened at 1:50').toHaveText('1:50');
  });
});

