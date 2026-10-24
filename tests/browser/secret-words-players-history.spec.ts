// Secret Words, screen lane D (after the game), written before the screens (scenarios v3.7, 23 October 2026).
// D7 the Players sheet with D7a (new clue giver) and D7b (team of one) (SWD-127, 123, 014), opened from game over's menu;
// E1 History and E1a one game (SWD-064). Exact words: docs/games/secret-words/text.csv. Coder's note:
// specs/secret-words/screens-d.md. Helpers: secret-words-d.ts. Tests that pass through lane B's screens are marked
// `needsLanes` (expected to fail until lane B is merged).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { mainButton } from './impostor';
import { openHistory } from './helpers';
import { oracleBoard, waitGuards } from './secret-words';
import {
  button, cellNames, dialog, exampleTeams, flows, fromMenu, gameHeading, movesAfter, nextClueGivers, openGameOver,
  openOn, phoneWithEvenings, savedOf, textOf, toast, twentyTeams, undoToast, wholeMapNames, type TeamsInput,
} from './secret-words-d';

const ID = 'sw-lane-d';

/** Game 1 won by Chai Champions at once; the phone opens on game over. */
async function gameOver(page: Page, teams?: TeamsInput) {
  const ev = flows.orangeWinsAtOnce(teams ? { teams } : {});
  await openGameOver(page, ev);
  return { ev, n: ev.records.length };
}

/** Game over → menu "Players" → the sheet. */
async function playersSheet(page: Page, teams?: TeamsInput) {
  const g = await gameOver(page, teams);
  await fromMenu(page, 'Players');
  const sheet = dialog(page, 'Players');
  await expect(sheet).toBeVisible();
  return { ...g, sheet };
}

/** The last recorded setPlayers' teams (orange, teal lists and clue givers). */
async function lastSetPlayers(page: Page, n: number) {
  const ms = (await movesAfter(page, ID, n)).filter((m) => m.type === 'setPlayers');
  return { count: ms.length, last: ms.at(-1) };
}

test.describe('D7 the Players sheet at game over (SWD-127)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('an h2 per team, its players in list order (Rename, Switch team for guessers, Remove), the adding row, main "Done"', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    expect(await textOf(sheet.getByRole('heading', { level: 2 }))).toEqual(['Chai Champions', 'Coffee Commandos']);
    expect(await sheet.getByRole('button', { name: /^Rename / }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent)))
      .toEqual(['Rename Riya', 'Rename Meena', 'Rename Zoya', 'Rename Om', 'Rename Arjun', 'Rename Kabir', 'Rename Dev']);
    // Switch team: guessers only (not this game's clue givers Riya and Arjun).
    const moves = sheet.getByRole('button', { name: /^Move .+ to (Chai Champions|Coffee Commandos)$/ });
    expect(await moves.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual([
      'Move Meena to Coffee Commandos', 'Move Zoya to Coffee Commandos', 'Move Om to Coffee Commandos',
      'Move Kabir to Chai Champions', 'Move Dev to Chai Champions',
    ]);
    for (const t of await textOf(moves)) expect(t).toBe('Switch team');
    for (const p of ['Riya', 'Meena', 'Zoya', 'Om', 'Arjun', 'Kabir', 'Dev']) await expect(sheet.getByRole('button', { name: `Remove ${p}`, exact: true })).toBeVisible();
    // The adding row.
    const field = sheet.getByLabel('Player name', { exact: true });
    await expect(field).toHaveAttribute('placeholder', 'Type a name…');
    await expect(sheet.getByRole('switch', { name: "Doesn't give clues" })).toHaveAttribute('aria-checked', 'false');
    await expect(sheet.getByRole('button', { name: 'Add to Chai Champions', exact: true })).toBeDisabled();
    await expect(sheet.getByRole('button', { name: 'Add to Coffee Commandos', exact: true })).toBeDisabled();
    await expect(sheet.getByTestId('main-button')).toHaveText('Done');
    await waitGuards(page);
    await sheet.getByTestId('main-button').click();
    await expect(sheet).toHaveCount(0);
    await expect(gameHeading(page)).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('Switch team: to the end of the other team, toast "Zoya moved to Coffee Commandos · Undo", one setPlayers; Undo restores with another', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Move Zoya to Coffee Commandos', exact: true }).click();
    await expect(undoToast(page)).toHaveText(/^Zoya moved to Coffee Commandos · Undo$/);
    let s = await lastSetPlayers(page, n);
    expect(s.count).toBe(1);
    expect(s.last.teams.orange).toEqual(['Riya', 'Meena', 'Om']);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabir', 'Dev', 'Zoya']);
    expect([...s.last.players].sort()).toEqual(['Arjun', 'Dev', 'Kabir', 'Meena', 'Om', 'Riya', 'Zoya']);
    await expect(sheet.getByRole('button', { name: 'Move Zoya to Chai Champions', exact: true })).toBeVisible();
    await undoToast(page).getByRole('button', { name: 'Undo' }).click();
    s = await lastSetPlayers(page, n);
    expect(s.count).toBe(2);
    expect(s.last.teams.orange).toEqual(['Riya', 'Meena', 'Zoya', 'Om']);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabir', 'Dev']);
  });

  test('Switch team is disabled when the team would be left with fewer than 2 players or no guesser', async ({ page }) => {
    const { sheet } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Move Kabir to Chai Champions', exact: true }).click();
    // Coffee Commandos: Arjun (clue giver) and Dev: moving Dev would leave Arjun alone.
    await expect(sheet.getByRole('button', { name: 'Move Dev to Chai Champions', exact: true })).toBeDisabled();
  });

  test('Rename: an input "Player name" holding the name; Enter saves (setPlayers with renames), place kept, no Undo; the next clue givers follow', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Rename Kabir', exact: true }).click();
    const input = sheet.getByLabel('Player name', { exact: true }).and(sheet.locator(':not([placeholder="Type a name…"])'));
    await expect(input).toHaveValue('Kabir');
    await expect(sheet.getByRole('button', { name: 'Done', exact: true }).and(sheet.locator(':not([data-testid="main-button"])'))).toBeVisible();
    await input.fill('Kabeer');
    await input.press('Enter');
    const s = await lastSetPlayers(page, n);
    expect(s.count).toBe(1);
    expect(s.last.renames).toEqual({ Kabir: 'Kabeer' });
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabeer', 'Dev']);
    await expect(sheet.getByRole('button', { name: 'Rename Kabeer', exact: true })).toBeVisible();
    await expect(undoToast(page)).toHaveCount(0);
    await waitGuards(page);
    await sheet.getByTestId('main-button').click();
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Meena and Kabeer');
  });

  test('Rename: a name already playing shows the duplicate message; an empty name keeps the old one; nothing recorded', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Rename Kabir', exact: true }).click();
    const input = sheet.getByLabel('Player name', { exact: true }).and(sheet.locator(':not([placeholder="Type a name…"])'));
    await input.fill('riya');
    await input.press('Enter');
    await expect(sheet.getByRole('alert')).toHaveText(/^Riya is already playing\. Add an initial, like Riya S\.$/);
    await input.fill('');
    await input.press('Enter');
    await expect(sheet.getByRole('button', { name: 'Rename Kabir', exact: true })).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('Add: "Add to …" disabled while empty; joins the end of that team as a guesser, toast "Neha joined Chai Champions" without Undo', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    const field = sheet.locator('input[placeholder="Type a name…"]');
    await field.fill('Neha');
    await sheet.getByRole('button', { name: 'Add to Chai Champions', exact: true }).click();
    await expect(toast(page)).toHaveText('Neha joined Chai Champions');
    await expect(toast(page).getByRole('button')).toHaveCount(0);
    const s = await lastSetPlayers(page, n);
    expect(s.count).toBe(1);
    expect(s.last.teams.orange).toEqual(['Riya', 'Meena', 'Zoya', 'Om', 'Neha']);
    expect(s.last.players).toContain('Neha');
    expect(s.last.teams.guessOnly).not.toContain('Neha');
    await expect(sheet.getByRole('button', { name: 'Rename Neha', exact: true })).toBeVisible();
  });

  test('Add with "Doesn\'t give clues" on: kept in guessOnly (SWD-014)', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.locator('input[placeholder="Type a name…"]').fill('Neha');
    await sheet.getByRole('switch', { name: "Doesn't give clues" }).click();
    await sheet.getByRole('button', { name: 'Add to Coffee Commandos', exact: true }).click();
    const s = await lastSetPlayers(page, n);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabir', 'Dev', 'Neha']);
    expect(s.last.teams.guessOnly).toContain('Neha');
  });

  test('Add: the duplicate message; and "20 players is the most."', async ({ page }) => {
    const { sheet, n } = await playersSheet(page, twentyTeams());
    const field = sheet.locator('input[placeholder="Type a name…"]');
    const add = sheet.getByRole('button', { name: 'Add to Chai Champions', exact: true });
    await field.fill('player b');
    if (await add.isEnabled()) await add.click();
    await expect(sheet.getByText('Player B is already playing. Add an initial, like Player B S.', { exact: true })).toBeVisible();
    await field.fill('Neha');
    if (await add.isEnabled()) await add.click();
    await expect(sheet.getByText('20 players is the most.', { exact: true })).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('Remove a guesser: toast "Dev left · Undo"; Undo puts Dev back in place', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Remove Dev', exact: true }).click();
    await expect(undoToast(page)).toHaveText(/^Dev left · Undo$/);
    let s = await lastSetPlayers(page, n);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabir']);
    expect(s.last.players).not.toContain('Dev');
    await undoToast(page).getByRole('button', { name: 'Undo' }).click();
    s = await lastSetPlayers(page, n);
    expect(s.count).toBe(2);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Kabir', 'Dev']);
  });

  test('D7a: removing a clue giver asks "Who gives clues for Coffee Commandos now?" (next eligible pre-selected); "Done" confirms with "Arjun left · Undo"', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    const d = dialog(page, 'Who gives clues for Coffee Commandos now?');
    await expect(d).toBeVisible();
    await expect(d.getByRole('button', { name: 'Kabir', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(d.getByRole('button', { name: 'Dev', exact: true })).toHaveAttribute('aria-pressed', 'false');
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await d.getByRole('button', { name: 'Dev', exact: true }).click();
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(undoToast(page)).toHaveText(/^Arjun left · Undo$/);
    const s = await lastSetPlayers(page, n);
    expect(s.count).toBe(1);
    expect(s.last.teams.teal).toEqual(['Kabir', 'Dev']);
    expect(s.last.teams.clueGivers.teal).toBe('Dev');
  });

  test('D7a: closing it without "Done" cancels the removal', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    const d = dialog(page, 'Who gives clues for Coffee Commandos now?');
    await expect(d).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(d).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: 'Rename Arjun', exact: true })).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('D7b: a removal that would leave a team of 1: "Move Zoya over" per movable guesser, main "Don\'t remove Kabir"; no "End the game" at game over', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Remove Dev', exact: true }).click();
    await sheet.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, 'Coffee Commandos would have only Arjun left. Move someone from Chai Champions?');
    await expect(d).toBeVisible();
    expect(await textOf(d.getByRole('button', { name: /^Move .+ over$/ }))).toEqual(['Move Meena over', 'Move Zoya over', 'Move Om over']);
    await expect(d.getByTestId('main-button')).toHaveText("Don't remove Kabir");
    await expect(d.getByRole('button', { name: 'End the game', exact: true })).toHaveCount(0);
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(d).toHaveCount(0);
    expect((await lastSetPlayers(page, n)).count).toBe(1); // Dev's removal only
  });

  test('D7b: "Move Zoya over" removes Kabir and moves Zoya in one change', async ({ page }) => {
    const { sheet, n } = await playersSheet(page);
    await sheet.getByRole('button', { name: 'Remove Dev', exact: true }).click();
    await sheet.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, 'Coffee Commandos would have only Arjun left. Move someone from Chai Champions?');
    await d.getByRole('button', { name: 'Move Zoya over', exact: true }).click();
    const s = await lastSetPlayers(page, n);
    expect(s.count).toBe(2);
    expect(s.last.teams.orange).toEqual(['Riya', 'Meena', 'Om']);
    expect(s.last.teams.teal).toEqual(['Arjun', 'Zoya']);
    expect(s.last.players).not.toContain('Kabir');
  });

  test('D7b: when no one can move: "No one can move over." with main "Don\'t remove Kabir" (no "End the game" at game over)', async ({ page }) => {
    const { sheet, n } = await playersSheet(page, exampleTeams({ orange: ['Riya', 'Meena'], teal: ['Arjun', 'Kabir'] }));
    await sheet.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, 'Coffee Commandos would have only Arjun left. Move someone from Chai Champions?');
    await expect(d).toBeVisible();
    await expect(d.getByText('No one can move over.', { exact: true })).toBeVisible();
    await expect(d.getByRole('button', { name: /^Move .+ over$/ })).toHaveCount(0);
    await expect(d.getByTestId('main-button')).toHaveText("Don't remove Kabir");
    await expect(d.getByRole('button', { name: 'End the game', exact: true })).toHaveCount(0);
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('SWD-014: "Remove" is disabled for a team\'s last eligible player', async ({ page }) => {
    const { sheet } = await playersSheet(page, exampleTeams({ guessOnly: ['Kabir', 'Dev'] }));
    await expect(sheet.getByRole('button', { name: 'Remove Arjun', exact: true })).toBeDisabled();
    await expect(sheet.getByRole('button', { name: 'Remove Riya', exact: true })).toBeEnabled();
  });

  test('SWD-123: removing one of a pair leaves the other as the clue giver, with no dialog', async ({ page }) => {
    const { sheet, n } = await playersSheet(page, exampleTeams({ partners: { orange: null, teal: 'Kabir' } }));
    await sheet.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    await expect(dialog(page, 'Who gives clues for Coffee Commandos now?')).toHaveCount(0);
    await expect(undoToast(page)).toHaveText(/^Arjun left · Undo$/);
    const s = await lastSetPlayers(page, n);
    expect(s.last.teams.clueGivers.teal).toBe('Kabir');
    expect(s.last.teams.partners.teal).toBeNull();
  });
});

test.describe('D7 the Players sheet during a turn (SWD-127)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('one phone, on the team\'s pass step: removing its clue giver restarts the pass screen for the new one', async ({ page }) => {
    const ev = flows.tealPassStep(); // Coffee Commandos' pass screen: Arjun
    await openOn(page, savedOf(ev), page.getByTestId('turn-heading'));
    await expect(mainButton(page)).toHaveText("I'm Arjun");
    await fromMenu(page, 'Players');
    const sheet = dialog(page, 'Players');
    await sheet.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    const d = dialog(page, 'Who gives clues for Coffee Commandos now?');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await waitGuards(page);
    await sheet.getByTestId('main-button').click();
    await expect(mainButton(page)).toHaveText("I'm Kabir");
  });

  test('D7b mid-game: no one can move: quiet "End the game" opens the End the game dialog (Kabir stays)', async ({ page }) => {
    const ev = flows.fourPlayersGuessing();
    const n = ev.records.length;
    await openOn(page, savedOf(ev), page.getByTestId('turn-line'));
    await fromMenu(page, 'Players');
    await dialog(page, 'Players').getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    const d = dialog(page, 'Coffee Commandos would have only Arjun left. Move someone from Chai Champions?');
    await expect(d.getByText('No one can move over.', { exact: true })).toBeVisible();
    await d.getByRole('button', { name: 'End the game', exact: true }).click();
    await expect(dialog(page, 'End this game with no winner?')).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });
});

// ---- E1 History, E1a one game (SWD-064) ----

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/secret-words-saved-evenings-v1.json', import.meta.url)), 'utf8'));

/** Cells turned over on a game's last board, from the fixture's records of that game only (game = 1-based). */
function turnedInGame(records: any[], game: number): Set<number> {
  let g = 0;
  let out = new Set<number>();
  for (const r of records) {
    const m = r.move;
    if (m.type === 'deal') { if (g === game) return out; g++; out = new Set(); }
    if (m.type === 'dealNew') out = new Set();
    if (g !== game) continue;
    if (m.type === 'reveal') { out.add(m.cell); if (typeof m.freeCell === 'number') out.add(m.freeCell); }
    if (m.type === 'brokeRule') out.add(m.cell);
  }
  return out;
}

const historyGame = (page: Page) => page.getByTestId('history-game');
const historyRounds = (page: Page) => page.getByTestId('history-round');

test.describe('E1 History and E1a one game (SWD-064)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the format fixture: "Secret Words · 3 games" and its game rows (won, won by the Landmine, ended early; a replaced board is not a game)', async ({ page }) => {
    await phoneWithEvenings(page, [fixture.ended], { now: fixture.ended.updatedAt + 60 * 60_000 });
    await openHistory(page);
    const row = historyGame(page).filter({ hasText: 'Secret Words · 3 games' });
    await expect(row).toHaveCount(1);
    await row.click();
    expect(await textOf(historyRounds(page))).toEqual([
      'Game 1 · Chai Champions won · Riya and Arjun gave clues',
      'Game 2 · Coffee Commandos won (Landmine) · Meena and Kabir gave clues',
      'Game 3 · Ended early · Meena and Kabir gave clues',
    ]);
  });

  for (const g of [
    { n: 1, h1: 'Game 1 · Chai Champions won', clues: 'Clues: Coffee Commandos Monsoon 2 · Chai Champions ∞', code: '22G4T54' },
    { n: 2, h1: 'Game 2 · Coffee Commandos won (Landmine)', clues: 'Clues: Coffee Commandos Kite 1 · Chai Champions 3', code: '23G4T56' },
    { n: 3, h1: 'Game 3 · Ended early', clues: 'Clues: Chai Champions Rain 2 · Coffee Commandos 0', code: '25G4T5A' },
  ]) {
    test(`E1a game ${g.n}: h1 "${g.h1}", its board with the whole map, history-clues; "← Back" to the game night`, async ({ page }) => {
      await phoneWithEvenings(page, [fixture.ended], { now: fixture.ended.updatedAt + 60 * 60_000 });
      await openHistory(page);
      await historyGame(page).filter({ hasText: 'Secret Words · 3 games' }).click();
      await historyRounds(page).nth(g.n - 1).click();
      await expect(page.getByRole('heading', { level: 1, name: g.h1, exact: true })).toBeVisible();
      expect(await cellNames(page)).toEqual(wholeMapNames(oracleBoard(g.code), turnedInGame(fixture.ended.records, g.n)));
      await expect(page.getByTestId('history-clues')).toHaveText(g.clues); // DOM text; words upper case by CSS
      await expect(mainButton(page)).toHaveCount(0);
      await waitGuards(page);
      await button(page, '← Back').click();
      await expect(historyRounds(page)).toHaveCount(3);
    });
  }

  test('credited clue givers: a pair "Riya + Meena and …", names as renamed after the game', async ({ page }) => {
    const ev = flows.pairRenamedEnded();
    await phoneWithEvenings(page, [savedOf(ev, { status: 'ended' })]);
    await openHistory(page);
    await historyGame(page).filter({ hasText: 'Secret Words · 1 game' }).click();
    expect(await textOf(historyRounds(page))).toEqual(['Game 1 · Chai Champions won · Riya + Meena and Arjun K gave clues']);
  });
});

