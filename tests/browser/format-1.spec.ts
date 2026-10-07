// PLT-014: old games still open after an app update, with nothing lost. The phone below holds exactly what
// the Phase 1a app saved (format 1, before sessions): a finished game and a game in progress
// (tests/fixtures/phase-1a-saved-games.json, captured from the real 1a build). The rules side is
// tests/replays/format-1-saved-games.test.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { HOME, call, currentNumber, endGame, nextNumber, fromHome, waitOutTapGuard } from './helpers';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/phase-1a-saved-games.json', import.meta.url)), 'utf8'),
);
const ended = fixture.expect.ended as { players: string[]; called: number[]; payout: string[] };
const inProgress = fixture.expect.inProgress as { id: string; called: number[] };
const savedAt = JSON.parse(fixture.localStorage[`pgn.game.${inProgress.id}`]).updatedAt as number;

/** A phone that last ran the Phase 1a app 30 minutes ago, now on this version. */
async function phoneFromPhase1a(page: Page) {
  await page.clock.install({ time: new Date(savedAt + 30 * 60_000) });
  await page.goto(HOME);
  await page.evaluate((items: Record<string, string>) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
  }, fixture.localStorage);
  await page.reload();
}

const calledOnList = (page: Page) =>
  page.getByTestId('call-list').locator('[data-number]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-number'))));

test.describe('PLT-014: games saved by the Phase 1a app still open', () => {
  test('the finished game is in History, with every call and the same payouts', async ({ page }) => {
    await phoneFromPhase1a(page);
    await fromHome(page, 'History');
    const rows = page.getByTestId('history-game');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText('Tambola')).toBeVisible();
    await expect(rows.first().getByText(/3 players/)).toBeVisible();
    await rows.first().click();
    expect((await calledOnList(page)).sort((a, b) => a - b)).toEqual([...ended.called].sort((a, b) => a - b));
    await expect(nextNumber(page)).toHaveCount(0);
    for (const line of ended.payout) await expect(page.getByTestId('payout-summary')).toContainText(line);
  });

  test('the game in progress resumes where it was, with the same calls, and plays on to the end', async ({ page }) => {
    await phoneFromPhase1a(page);
    const list = page.getByTestId('unfinished-games');
    await expect(list.getByText(/5 numbers called/)).toBeVisible();
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await list.getByRole('button', { name: /Tap to resume|Resume/ }).first().click();
    await expect(currentNumber(page)).toHaveText(String(inProgress.called.at(-1)));
    const next = await call(page);
    expect(inProgress.called).not.toContain(next);
    // Still there, with the new call, after the app is closed and opened again.
    await page.reload();
    await page.goto(HOME);
    await expect(page.getByTestId('unfinished-games').getByText(/6 numbers called/)).toBeVisible();
    await waitOutTapGuard(page); // 1.3.1 (I29, R2): Home's buttons are guarded for 500 ms after it shows
    await page.getByTestId('unfinished-games').getByRole('button', { name: /Tap to resume|Resume/ }).first().click();
    await expect(currentNumber(page)).toHaveText(String(next));
    await endGame(page);
    await expect(page.getByTestId('payout-summary')).toContainText('6 numbers called');
  });
});
