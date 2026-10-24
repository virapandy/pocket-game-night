// Mafia section 07, game over and tonight (scenarios version 1.1): MAF-060 to MAF-064 and MAF-093's History line on
// screen, with items 15 and 17 to 19 and the product owner's clarifications 18, 27, 28, 31 (25 October). The facts
// behind them are rule-tested in tests/games/mafia/saved.test.ts. Built on lane-k: no mark.
// Helpers: mafia.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from './fixtures';
import { backgroundAndReturn, fromHome, hostAGame } from './helpers';
import {
  boot, button, byId, exactly, flowEnd, fromMenu, heading, mainButton, NINE, openFlow, tap, TZ, waitGuards,
} from './mafia';
import { FLOW_T0, flow, savedFlow } from '../games/mafia/flows';
/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ timezoneId: TZ });

test('MAF-060: Game over after the example: winner, "Who was who" in seat order, each night\'s line, fun lines, tally, buttons', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await expect(page.getByText(exactly('Every Mafia is out.'))).toBeVisible();
  await expect(heading(page, 'Who was who')).toBeVisible();
  const rows = [
    'Riya · Villager · in to the end', 'Arjun · Mafia · voted out day 3', 'Meena · Doctor · out night 3', 'Kabir · Villager · out night 1',
    'Zoya · Mafia · voted out day 2', 'Dev · Police · in to the end', 'Om · Villager · voted out day 1', 'Sunita · Villager · in to the end',
    'Neha · Villager · in to the end',
  ];
  const shown: string[] = [];
  for (const r of rows) { const l = page.getByText(exactly(r)); await expect(l, r).toBeVisible(); shown.push(r); }
  const ys = await Promise.all(rows.map(async (r) => (await page.getByText(exactly(r)).boundingBox())!.y));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  await expect(page.getByText(exactly('Best Mafia spotter: Riya picked a Mafia 3 nights out of 3'))).toBeVisible();
  await expect(page.getByText(exactly('Best ghost guess: Kabir'))).toBeVisible();
  await expect(page.getByText(exactly('Tonight: Village 1 · Mafia 0'))).toBeVisible();
  for (const q of ['Change players or roles', 'End for tonight', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Play again'));
  await tap(page, button(page, 'What happened each night'));
  for (const l of [
    'Night 1: the Mafia picked Kabir · the Doctor protected themselves · the Police checked Zoya (Mafia) · Kabir was out',
    'Night 2: the Mafia picked Riya · the Doctor protected Riya · the Police checked Arjun (Mafia) · nobody was out',
    'Night 3: the Mafia picked Meena · the Doctor protected Sunita · the Police checked Sunita (Not Mafia) · Meena was out',
  ]) await expect(page.getByText(exactly(l))).toBeVisible();
});

test('MAF-060 item 18: when the Mafia\'s picks differ, the night line names both and the phone\'s choice', async ({ page }) => {
  await openFlow(page, 'worked-example-ended');
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await tap(page, button(page, 'What happened each night'));
  await expect(page.getByText(exactly('Night 1: the Mafia picked Kabir and Om; the phone chose Om · the Doctor protected themselves · the Police checked Zoya (Mafia) · Om was out'))).toBeVisible();
  await expect(page.getByText(/^Tonight: Village/)).toHaveCount(0);   // no game tonight has a winner yet
});

test('MAF-042 / MAF-060: game 2 ended with no winner shows every role and tonight\'s tally from game 1', async ({ page }) => {
  await openFlow(page, 'game2-over');
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await expect(page.getByText(exactly('Tonight: Village 1 · Mafia 0'))).toBeVisible();
  for (const r of ['Riya · Mafia · in to the end', 'Om · Mafia · in to the end', 'Sunita · Doctor · in to the end', 'Neha · Police · in to the end']) {
    await expect(page.getByText(exactly(r))).toBeVisible();
  }
});

test('MAF-061: "Play again" deals game 2 straight away (no Read this aloud): "Player 1 of 9" for seat 0', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await tap(page, mainButton(page));
  await expect(heading(page, 'Read this aloud')).toHaveCount(0);
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
});

test('MAF-061 item 28: "Change players or roles" opens Who\'s playing? with "← Back to the game", which returns to Game over', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await tap(page, button(page, 'Change players or roles'));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await expect(button(page, '← Back')).toHaveCount(0);
  await tap(page, button(page, '← Back to the game'));
  await expect(heading(page, 'The Village wins!')).toBeVisible();
});

test('MAF-063 / MAF-064: End for tonight → Tonight\'s summary: players, games, score, spotter; "Oops, keep playing" returns', async ({ page }) => {
  await openFlow(page, 'game2-over');
  await tap(page, button(page, 'End for tonight'));
  const d = page.getByRole('dialog').filter({ hasText: 'End for tonight?' });
  await expect(d.getByText(exactly("Tonight's score stays in History."))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(page.getByText(exactly('9 players · 2 games'))).toBeVisible();
  await expect(page.getByText(exactly('Village 1 · Mafia 0'))).toBeVisible();
  await expect(page.getByText(exactly('Best Mafia spotter tonight: Riya'))).toBeVisible();
  await expect(page.getByText(/was Mafia in \d games/)).toHaveCount(0);
  for (const q of ['Oops, keep playing', '← Home']) await expect(button(page, q)).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Play something else'));
  await tap(page, button(page, 'Oops, keep playing'));
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
});

test('MAF-063 item 15: mid-game, End for tonight says "This game won\'t count for either side."', async ({ page }) => {
  await openFlow(page, 'night2-meena');
  await fromMenu(page, 'End for tonight');
  await expect(page.getByRole('dialog').getByText(exactly("Tonight's score stays in History. This game won't count for either side."))).toBeVisible();
});

test('MAF-064 item 29: G2\'s menu has only "Delete tonight\'s games"', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await tap(page, button(page, 'End for tonight'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End for tonight', exact: true }));
  await tap(page, page.getByRole('button', { name: 'Menu', exact: true }));
  const items = (await page.getByRole('menu').getByRole('menuitem').or(page.getByRole('menu').getByRole('button')).allInnerTexts()).map((s) => s.trim());
  expect(items).toEqual(["Delete tonight's games"]);
});

test('MAF-093 item 19: History lists the game "Mafia · 9:10 pm · 9 players · The Village won · 3 nights"', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await fromMenu(page, 'History');
  await expect(page.getByText(exactly('Mafia · 9:10 pm · 9 players · The Village won · 3 nights'))).toBeVisible();
});

// ---- MAF-093 History, PLT-011 Clear all history, MAF-063 G2 left by the app being hidden (lane-q's build, 25 October) ----

const HOUR = 3_600_000;
const readFixture = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8'));
/** The ended Impostor evening of the v3 fixture ("Impostor · 3 rounds"), moved in time to start at `t0` (a copy; the fixture is never edited). */
function impostorAt(t0: number): Record<string, unknown> {
  const fx = readFixture('impostor-saved-evenings-v3.json');
  const e = fx.ended;
  const d = t0 - e.createdAt;
  const ended = { ...e, createdAt: e.createdAt + d, updatedAt: e.updatedAt + d, records: e.records.map((r: any) => ({ ...r, at: r.at + d })) };
  return { [`pgn.game.${e.id}`]: ended, [`pgn.session.${fx.session.id}`]: { ...fx.session, createdAt: fx.session.createdAt + d } };
}
const historyRows = (page: Page) => page.getByTestId('history-game');
const rowTexts = async (page: Page) => (await historyRows(page).allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
/** Every Mafia game night saved on this phone (`pgn.game.*`, IMP-096's SavedGame). */
async function mafiaNights(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'mafia') out.push(g); } catch { /* not ours */ }
    }
    return out;
  });
}
/** Opens another saved game night through MAF-H6 on the same phone (its storage and clock kept): a reload. */
async function loadNight(page: Page, name: string, o: { id: string; at0: number }) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['pgn.test.load', JSON.stringify(savedFlow(flow(name), o))] as const);
  await page.reload();
  await waitGuards(page);
}
/** From Game over: End for tonight → the dialog → Tonight's summary → "← Home" (records endEvening, SWD-060). */
async function endTonightToHome(page: Page) {
  await tap(page, button(page, 'End for tonight'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await tap(page, button(page, '← Home'));
  await expect(hostAGame(page)).toBeVisible();
}
/** Two ended Mafia nights (5:10 pm Village won; 9:10 pm ended, no winner) and the Impostor evening at 7:10 pm, then History. */
async function historyWithThree(page: Page) {
  await boot(page, { time: flowEnd('game1-over'), storage: { ...impostorAt(FLOW_T0 - 2 * HOUR), 'pgn.test.load': savedFlow(flow('game1-over'), { id: 'mafia-early', at0: FLOW_T0 - 4 * HOUR }) } });
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await endTonightToHome(page);
  await loadNight(page, 'worked-example-ended', { id: 'mafia-late', at0: FLOW_T0 });
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await endTonightToHome(page);
  await waitGuards(page);
  await fromHome(page, 'History');
  await expect(historyRows(page).first()).toBeVisible();
}

test('MAF-093 / PLT-007: Mafia\'s History rows sit among other games by start time, newest first', async ({ page }) => {
  test.slow();   // two game nights ended through the screens
  await historyWithThree(page);
  const rows = await rowTexts(page);
  const late = rows.findIndex((t) => /^Mafia · 9:10 pm · 9 players · Game ended · /.test(t));
  const imp = rows.findIndex((t) => t.includes('Impostor · 3 rounds'));
  const early = rows.indexOf('Mafia · 5:10 pm · 9 players · The Village won · 3 nights');
  expect(late, `9:10 pm Mafia row in ${JSON.stringify(rows)}`).toBeGreaterThanOrEqual(0);
  expect(imp, 'Impostor row').toBeGreaterThan(late);
  expect(early, '5:10 pm Mafia row').toBeGreaterThan(imp);
});

test('MAF-093 / PLT-008: tapping a Mafia row opens that past game: result, "Who was who", each night, "← Back"; main "Play again"', async ({ page }) => {
  test.slow();
  await historyWithThree(page);
  await tap(page, historyRows(page).filter({ hasText: 'Mafia · 5:10 pm · 9 players · The Village won · 3 nights' }));
  await expect(page.getByText(/^\s*The Village (wins!|won)\s*$/).first()).toBeVisible();
  await expect(heading(page, 'Who was who')).toBeVisible();
  const rows = [
    'Riya · Villager · in to the end', 'Arjun · Mafia · voted out day 3', 'Meena · Doctor · out night 3', 'Kabir · Villager · out night 1',
    'Zoya · Mafia · voted out day 2', 'Dev · Police · in to the end', 'Om · Villager · voted out day 1', 'Sunita · Villager · in to the end',
    'Neha · Villager · in to the end',
  ];
  for (const r of rows) await expect(page.getByText(exactly(r)), r).toBeVisible();
  const ys = await Promise.all(rows.map(async (r) => (await page.getByText(exactly(r)).boundingBox())!.y));
  expect([...ys].sort((a, b) => a - b), 'seat order').toEqual(ys);
  const each = button(page, 'What happened each night');
  if (await each.count()) await tap(page, each);
  for (const l of [
    'Night 1: the Mafia picked Kabir · the Doctor protected themselves · the Police checked Zoya (Mafia) · Kabir was out',
    'Night 2: the Mafia picked Riya · the Doctor protected Riya · the Police checked Arjun (Mafia) · nobody was out',
    'Night 3: the Mafia picked Meena · the Doctor protected Sunita · the Police checked Sunita (Not Mafia) · Meena was out',
  ]) await expect(page.getByText(exactly(l)), l).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Play again'));
  // Nothing in it can be changed (PLT-008): no game buttons of G1.
  for (const q of ['Change players or roles', 'End for tonight']) await expect(button(page, q)).toHaveCount(0);
  await tap(page, button(page, '← Back'));
  await expect(historyRows(page).filter({ hasText: 'Impostor · 3 rounds' })).toBeVisible();
  // "Play again" there opens Who's playing? with its players (MAF-093), all nine.
  await tap(page, historyRows(page).filter({ hasText: 'Mafia · 5:10 pm · 9 players · The Village won · 3 nights' }));
  await tap(page, mainButton(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  for (const n of NINE) await expect(button(page, `Remove ${n}`), n).toHaveCount(1);
});

test('MAF-093 / MAF-061: a past game\'s "Play again" leaves out a player who left (Who\'s playing? without Neha)', async ({ page }) => {
  await boot(page, { time: flowEnd('left-neha-ended'), storage: { 'pgn.test.load': savedFlow(flow('left-neha-ended'), { id: 'mafia-left' }) } });
  await expect(heading(page, 'Game ended. No winner.')).toBeVisible();
  await endTonightToHome(page);
  await waitGuards(page);
  await fromHome(page, 'History');
  await tap(page, historyRows(page).filter({ hasText: /^\s*Mafia · 9:10 pm · 9 players · Game ended/ }));
  await tap(page, mainButton(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  for (const n of NINE.filter((x) => x !== 'Neha')) await expect(button(page, `Remove ${n}`), n).toHaveCount(1);
  await expect(button(page, 'Remove Neha')).toHaveCount(0);
});

test('PLT-011 / MAF-093: "Clear all history" deletes ended Mafia nights and counts them; a night still going is kept', async ({ page }) => {
  test.slow();
  await boot(page, { time: flowEnd('game1-over'), storage: { 'pgn.test.load': savedFlow(flow('game1-over'), { id: 'mafia-a', at0: FLOW_T0 - 4 * HOUR }) } });
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await endTonightToHome(page);
  await loadNight(page, 'game1-over', { id: 'mafia-b', at0: FLOW_T0 - 2 * HOUR });
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await endTonightToHome(page);
  // A third game night, still going: Meena's turn on night 2, left by "Home (game is saved)".
  await loadNight(page, 'night2-meena', { id: 'mafia-c', at0: FLOW_T0 });
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  await fromMenu(page, 'Home (game is saved)');
  await expect(hostAGame(page)).toBeVisible();
  const going = (await mafiaNights(page)).filter((g) => !g.records.some((r: any) => r.move.type === 'endEvening'));
  expect(going.length, 'one night still going').toBe(1);
  await waitGuards(page);
  await fromHome(page, 'History');
  await expect(historyRows(page).filter({ hasText: 'The Village won' })).toHaveCount(2);
  await tap(page, button(page, 'Clear all history'));
  const d = page.getByRole('dialog');
  await expect(d).toContainText("Delete all 2 past games from this phone? This can't be undone.");
  await tap(page, d.getByRole('button', { name: 'Delete all', exact: true }));
  await expect(historyRows(page).filter({ hasText: 'The Village won' })).toHaveCount(0);
  const left = await mafiaNights(page);
  expect(left.map((g) => g.id), 'only the night still going is kept').toEqual([going[0].id]);
  expect(left[0].records.length, 'kept unchanged').toBe(going[0].records.length);
});

test('MAF-P2 / MAF-093: opening #mafia-past/<id>/2 while game 2 is still being played shows no role, night pick or Police result', async ({ page }) => {
  // Game 1 finished, game 2 dealt and in its first night: the night is still going.
  const g2 = flow('game2-over');
  const live = { ...g2, name: 'game2-live', moves: g2.moves.slice(0, -1) };
  const id = 'mafia-g2-live';
  await boot(page, { time: flowEnd(live), storage: { 'pgn.test.load': savedFlow(live, { id }) } });
  await waitGuards(page);
  const noLeak = async (how: string) => {
    await waitGuards(page);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    for (const bad of [/Who was who/i, /Night \d:/, /the Police checked/i, /the Mafia picked/i, /the Doctor protected/i, /\((Not )?Mafia\)/, /\b(Villager|Doctor|Police) ·/, /voted out day/i, /out night/i]) {
      expect(text, `${how}: ${bad} must not show`).not.toMatch(bad);
    }
    expect(/Host a game|not found|can't find|cannot find/i.test(text), `${how}: Home or a not-found state`).toBe(true);
  };
  // 1. Left to Home (game is saved), then the address is typed in.
  await fromMenu(page, 'Home (game is saved)');
  await expect(hostAGame(page)).toBeVisible();
  await page.evaluate((i) => { location.hash = `#mafia-past/${i}/2`; }, id);
  await noLeak('from Home');
  // 2. The same address opened fresh (a reload).
  await page.reload();
  await noLeak('after a reload');
});

/** The moves of the only Mafia game night on this phone, as types. */
async function moveTypes(page: Page): Promise<string[]> {
  const all = await mafiaNights(page);
  expect(all.length, 'one Mafia game night').toBe(1);
  return all[0].records.map((r: any) => r.move.type);
}

test('MAF-063 / SWD-060: mid-game, hiding the app on Tonight\'s summary records endGame then endEvening; no "Oops"; a reload reopens it; "← Home" stops that', async ({ page }) => {
  await openFlow(page, 'night2-meena');
  const before = (await moveTypes(page)).length;
  await fromMenu(page, 'End for tonight');
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(button(page, 'Oops, keep playing')).toBeVisible();
  expect((await moveTypes(page)).length, 'nothing recorded while the summary shows').toBe(before);
  await backgroundAndReturn(page);
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
  const types = await moveTypes(page);
  expect(types.slice(before), 'endGame (mid-game) then endEvening').toEqual(['endGame', 'endEvening']);
  await page.reload();
  await waitGuards(page);
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
  expect(await moveTypes(page), 'the reload records nothing more').toEqual(types);
  await tap(page, button(page, '← Home'));
  await expect(hostAGame(page)).toBeVisible();
  await page.reload();
  await waitGuards(page);
  await expect(hostAGame(page)).toBeVisible();
  await expect(heading(page, "Tonight's Mafia")).toHaveCount(0);
});

test('MAF-063 / SWD-060: at game over, hiding the app on Tonight\'s summary records only endEvening; "Play something else" stops a reload reopening it', async ({ page }) => {
  await openFlow(page, 'game1-over');
  const before = await moveTypes(page);
  await tap(page, button(page, 'End for tonight'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await backgroundAndReturn(page);
  await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
  expect(await moveTypes(page), 'endEvening only (the game had ended)').toEqual([...before, 'endEvening']);
  await page.reload();
  await waitGuards(page);
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
  await tap(page, mainButton(page));
  await expect(heading(page, 'What shall we play?')).toBeVisible();
  await page.reload();
  await waitGuards(page);
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(heading(page, "Tonight's Mafia")).toHaveCount(0);
  expect(await moveTypes(page), 'nothing more recorded').toEqual([...before, 'endEvening']);
});

