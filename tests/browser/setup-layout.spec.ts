// The setup redesign (change request of 28 September 2026, docs/games/tambola/ux-calling-screen.md, setup
// problems 9 to 12): TAM-181, TAM-182, TAM-183, and TAM-082 on the prizes step. On a 390 × 844 screen.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { fillPlayers, openTambola } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const nextButton = (page: Page) => page.getByRole('button', { name: 'Next', exact: true });
const contribution = (page: Page) => page.getByLabel('Contribution per ticket');
const names = (n: number) => Array.from({ length: n }, (_, i) => `Name${i + 1}`);

async function toPlayers(page: Page) {
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
}

async function toPrizes(page: Page, players: number) {
  await toPlayers(page);
  await fillPlayers(page, names(players));
  await nextButton(page).click();
  await contribution(page).fill('50');
  await nextButton(page).click();
  await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
}

/** Fixed at the bottom of the screen and fully visible without scrolling. */
async function atBottom(page: Page, l: Locator) {
  const vp = page.viewportSize()!;
  const b = (await l.boundingBox())!;
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height + 0.5);
  expect(vp.height - (b.y + b.height)).toBeLessThanOrEqual(40);
  return b;
}

async function pageScrolls(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return el.scrollHeight > window.innerHeight + 1;
  });
}

test.describe('TAM-181: the main button stays at the bottom on every setup step', () => {
  test('ticket-mode step (owner decision 2026-09-29): no separate "Next"; tapping "Paper tickets" moves on at once', async ({ page }) => {
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByRole('button', { name: 'Paper tickets' })).toBeVisible();
    await expect(nextButton(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Paper tickets' }).click();
    // One tap, and the players step is there: nothing else to confirm.
    await expect(page.getByLabel('Number of players')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Paper tickets' })).toHaveCount(0);
  });

  test('players step: "Next" is fixed at the bottom for 6, 12 and 20 players, and never hides the last name box', async ({ page }) => {
    await toPlayers(page);
    let first: { x: number; y: number } | null = null;
    for (const n of [6, 12, 20]) {
      await fillPlayers(page, names(n));
      await page.evaluate(() => window.scrollTo(0, 0));
      const b = await atBottom(page, nextButton(page));
      if (first) expect({ x: b.x, y: b.y }).toEqual(first);
      first ??= { x: b.x, y: b.y };
      const last = page.getByLabel(`Name of player ${n}`, { exact: true });
      await last.scrollIntoViewIfNeeded();
      const lb = (await last.boundingBox())!;
      const nb = (await nextButton(page).boundingBox())!;
      expect(lb.y + lb.height, `player ${n}'s name box sits above "Next"`).toBeLessThanOrEqual(nb.y + 0.5);
      const onTop = await last.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return hit === el || el.contains(hit);
      });
      expect(onTop, `player ${n}'s name box is not covered`).toBe(true);
    }
  });

  test('contribution and prizes steps: "Next" and "Confirm prizes" are fixed at the bottom', async ({ page }) => {
    await toPlayers(page);
    await fillPlayers(page, names(6));
    await nextButton(page).click();
    await expect(contribution(page)).toBeVisible();
    await atBottom(page, nextButton(page));
    await contribution(page).fill('50');
    await nextButton(page).click();
    await atBottom(page, page.getByRole('button', { name: 'Confirm prizes' }));
  });
});

test.describe('TAM-182: the contribution has a real default value, not a grey hint', () => {
  test('the field holds ₹50 and the pot shows straight away; it can be changed, or "No money" chosen', async ({ page }) => {
    await toPlayers(page);
    await fillPlayers(page, names(6));
    await nextButton(page).click();
    await expect(contribution(page)).toHaveValue('50');
    await expect(page.getByText('₹300').first()).toBeVisible();
    await contribution(page).fill('20');
    await expect(page.getByText('₹120').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'No money' })).toBeVisible();
    // The default is real: going on without typing gives a ₹300 pot.
    await contribution(page).fill('50');
    await nextButton(page).click();
    await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
    await expect(page.getByText('₹300').first()).toBeVisible();
  });

  test('going on without typing anything uses the default', async ({ page }) => {
    await toPlayers(page);
    await fillPlayers(page, names(6));
    await nextButton(page).click();
    await nextButton(page).click();
    await expect(page.getByRole('button', { name: 'Confirm prizes' })).toBeVisible();
    await expect(page.getByText('₹300').first()).toBeVisible();
  });

  for (const wrong of ['', '0', '-5', 'abc']) {
    test(`wrong input ${JSON.stringify(wrong)} is refused with a one-line reason, and "Next" waits`, async ({ page }) => {
      await toPlayers(page);
      await fillPlayers(page, names(6));
      await nextButton(page).click();
      const field = contribution(page);
      try {
        await field.fill(wrong);
      } catch {
        // A number field may not accept letters through fill(); type them as a person would.
        await field.fill('');
        await field.pressSequentially(wrong);
      }
      await nextButton(page).click();
      await expect(page.getByRole('button', { name: 'Confirm prizes' })).toHaveCount(0);
      await expect(field).toBeVisible();
      const reason = page.getByRole('alert').filter({ hasText: /\S/ });
      await expect(reason.first()).toBeVisible();
      expect(((await reason.first().innerText()).trim().split('\n')).length).toBe(1);
    });
  }
});

test.describe('TAM-183: the prizes step fits on one screen', () => {
  test('five tiers (6 tickets): each name once, a remove control of at least 44 × 44, and all of it with the pot and "Confirm prizes" on one screen', async ({ page }) => {
    await toPrizes(page, 6);
    expect(await pageScrolls(page)).toBe(false);
    const vp = page.viewportSize()!;
    for (const tier of ['Early Five', 'Top Line', 'Middle Line', 'Bottom Line', 'Full House']) {
      await expect(page.getByText(tier, { exact: true })).toHaveCount(1);
      const b = (await page.getByText(tier, { exact: true }).boundingBox())!;
      expect(b.y + b.height).toBeLessThanOrEqual(vp.height);
    }
    await expect(page.getByText('₹300').first()).toBeInViewport();
    await atBottom(page, page.getByRole('button', { name: 'Confirm prizes' }));
    const removes = page.getByRole('button', { name: /Remove/ });
    expect(await removes.count()).toBeGreaterThanOrEqual(4);
    for (const r of await removes.all()) {
      const b = (await r.boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('six tiers (12 tickets): the list may scroll, but "Confirm prizes" stays fixed at the bottom', async ({ page }) => {
    await toPrizes(page, 12);
    await atBottom(page, page.getByRole('button', { name: 'Confirm prizes' }));
    await page.getByText('Full House', { exact: true }).scrollIntoViewIfNeeded();
    await atBottom(page, page.getByRole('button', { name: 'Confirm prizes' }));
  });
});

test('TAM-082: with 6 tickets at ₹50 the three Lines get the same amount', async ({ page }) => {
  await toPrizes(page, 6);
  const values = await Promise.all(['Top Line', 'Middle Line', 'Bottom Line'].map((t) => page.getByLabel(`${t} amount`).inputValue()));
  expect(new Set(values).size).toBe(1);
});
