// Secret Words, screen lane D (after the game), written before the screens (scenarios v3.7, 23 October 2026).
// G1 game over (SWD-050, 051, 052, 053, 112 with its v3.7 bottom bar, 128), D6 End the game (SWD-054), New board (SWD-055),
// D8 End for tonight and G2 the summary (SWD-060, 128), D9 Delete tonight's games (SWD-065), saved choices (SWD-066),
// Start new (SWD-067), leaving and resuming (SWD-062, 111) and the 12-hour limit (SWD-063).
// Exact words: docs/games/secret-words/text.csv. Coder's note: specs/secret-words/screens-d.md. Helpers: secret-words-d.ts.
// Most tests open the app on a saved game night (SWD-048: a reload returns to the step); tests that pass through lane A's
// or lane B's screens are marked `needsLanes` (expected to fail until those lanes are merged).
import { expect, test, type Page } from './fixtures';
import { mainButton } from './impostor';
import { oracleBoard, waitGuards } from './secret-words';
import {
  bestClue, bestClueFlows, box, boardCells, button, cellNames, cellsOfKind, clueCredit, CODES, dialog, EASY_CODES, endForTonight,
  exampleTeams, flows, fromMenu, gameHeading, heldLocks, hideAndShowApp, home, homeButton, menuItems, movesAfter, movesOf,
  NAME, nearMiss, needsLanes, nextClueGivers, openGameOver, openOn, phoneWithEvenings, playAgain,
  resolvedColour, resultLine, savedById, savedEvenings, savedOf, summaryHeading, summaryLine, tally, teamBar,
  SwEvening, turnedOver, undoToast, watchWakeLock, wholeMapNames,
} from './secret-words-d';

const B0 = oracleBoard(CODES[0]!); // starts with orange (Chai Champions)
const B1 = oracleBoard(CODES[1]!); // starts with teal (Coffee Commandos)
const ID = 'sw-lane-d';

const orangeWinsAtOnce = flows.orangeWinsAtOnce;
const midGame = flows.midGame;

/** True when each locator's first element comes after the previous one's in the document. */
async function inDomOrder(page: Page, testIdsOrButtons: { id?: string; button?: string }[]): Promise<boolean> {
  return page.evaluate((parts) => {
    const els = parts.map((p) => (p.id
      ? document.querySelector(`[data-testid="${p.id}"]`)
      : [...document.querySelectorAll('button, [role="button"]')].find((b) => (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim() === p.button) ?? null));
    if (els.some((e) => !e)) return false;
    return els.every((e, i) => i === 0 || !!(els[i - 1]!.compareDocumentPosition(e!) & Node.DOCUMENT_POSITION_FOLLOWING));
  }, testIdsOrButtons);
}

test.describe('G1 game over: a won game (SWD-050, 051, 052, 112, 128)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('SWD-051/112: heading, line, the whole map, tally, next clue givers and every button, in SWD-112\'s order; the winner\'s team bar; no Pause', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await openGameOver(page, ev);
    await expect(page.getByRole('heading', { level: 1, name: 'Chai Champions win!', exact: true })).toBeVisible();
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    await expect(resultLine(page)).toHaveText('All 9 words found.');
    expect(await cellNames(page)).toEqual(wholeMapNames(B0, turnedOver(ev)));
    await expect(nearMiss(page)).toHaveCount(0); // Coffee Commandos had 8 left
    await expect(bestClue(page)).toHaveCount(0); // the only clue had no word
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 0');
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Meena and Kabir');
    for (const b of ['Swap clue givers', 'Change teams, players, phones or board', 'End for tonight', '← Home']) {
      await expect(button(page, b), b).toBeVisible();
    }
    await expect(playAgain(page)).toBeVisible();
    await expect(mainButton(page)).toHaveCount(1);
    expect(await inDomOrder(page, [
      { id: 'game-heading' }, { id: 'result-line' }, { id: 'word-board' }, { id: 'tally' }, { id: 'next-clue-givers' },
      { button: 'Swap clue givers' }, { button: 'Change teams, players, phones or board' }, { button: '← Home' },
    ]), 'SWD-112 order').toBe(true);
    // Team bar at game over: the winning team's bar (SWD-112).
    await expect(teamBar(page)).toBeVisible();
    const bar = await teamBar(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bar).toBe(await resolvedColour(page, 'var(--team-orange)', 'body'));
    // SWD-110: no Pause at game over.
    await expect(page.getByTestId('pause-button')).toHaveCount(0);
    // Nothing was recorded by opening game over.
    expect(await movesOf(page, ID)).toHaveLength(ev.records.length);
  });

  test('SWD-050: the other team turning over a team\'s last word makes that team win ("Chai Champions win!", "All 9 words found.")', async ({ page }) => {
    const ev = flows.otherTeamTurnsLast(); // Coffee Commandos turn over Chai Champions' last word
    await openGameOver(page, ev);
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    await expect(resultLine(page)).toHaveText('All 9 words found.');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 0');
  });

  test('SWD-051: Coffee Commandos win with their 8 words: "Coffee Commandos win!", "All 8 words found.", the teal bar', async ({ page }) => {
    const ev = flows.tealWins(); // a blank word ends Chai Champions' turn; Coffee Commandos find all 8
    await openGameOver(page, ev);
    await expect(gameHeading(page)).toHaveText('Coffee Commandos win!');
    await expect(resultLine(page)).toHaveText('All 8 words found.');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 0 · Coffee Commandos 1');
    const bar = await teamBar(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bar).toBe(await resolvedColour(page, 'var(--team-teal)', 'body'));
    expect(await cellNames(page)).toEqual(wholeMapNames(B0, turnedOver(ev)));
  });

  test('SWD-043/051/128: the Landmine (Lose the game): "Coffee Commandos win!", "Boom! Chai Champions hit the Landmine.", near-miss for the losing team 2 words away', async ({ page }) => {
    const ev = flows.landmine();
    await openGameOver(page, ev);
    await expect(gameHeading(page)).toHaveText('Coffee Commandos win!');
    await expect(resultLine(page)).toHaveText('Boom! Chai Champions hit the Landmine.');
    await expect(nearMiss(page)).toHaveText('Chai Champions were 2 words away!');
    const lm = cellsOfKind(B0, 'landmine')[0]!;
    expect((await cellNames(page))[lm]).toBe(`${B0.words[lm]}, the Landmine`);
  });

  for (const leftOver of [1, 2, 3]) {
    test(`SWD-128: near-miss when the losing team had ${leftOver} word${leftOver === 1 ? '' : 's'} left`, async ({ page }) => {
      const ev = flows.nearMiss(leftOver);
      await openGameOver(page, ev);
      await expect(gameHeading(page)).toHaveText('Chai Champions win!');
      if (leftOver === 3) await expect(nearMiss(page)).toHaveCount(0);
      else await expect(nearMiss(page)).toHaveText(`Coffee Commandos were ${leftOver} word${leftOver === 1 ? '' : 's'} away!`);
    });
  }

  for (const c of bestClueFlows) {
    test(`SWD-128 best-clue: ${c.name}`, async ({ page }) => {
      const ev = c.build();
      await openGameOver(page, ev);
      if (c.dom === null) { await expect(bestClue(page)).toHaveCount(0); return; }
      await expect(bestClue(page)).toHaveText(c.dom); // DOM text: the word as typed
      expect(await bestClue(page).innerText()).toContain(c.shown!); // shown upper case by CSS (Terms: Text matching)
    });
  }

  test('SWD-051 v3.6: faded face-down cells (20% of the kind\'s colour over the surface, word in --text); turned-over cells in their kind\'s colour', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await openGameOver(page, ev);
    const turned = turnedOver(ev);
    const fills = await boardCells(page).evaluateAll((els) => els.map((el) => ({
      i: Number(el.getAttribute('data-index')), bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, opacity: getComputedStyle(el).opacity,
    })));
    const token: Record<string, string> = { orange: '--team-orange', teal: '--team-teal', nobody: '--nobody', landmine: '--landmine' };
    const text = await resolvedColour(page, 'var(--text)');
    for (const f of fills) {
      const kind = B0.kinds[f.i]!;
      expect(f.opacity, `cell ${f.i}: no opacity rule`).toBe('1');
      if (turned.has(f.i)) {
        expect(f.bg, `cell ${f.i} turned over`).toBe(await resolvedColour(page, `var(${token[kind]})`));
      } else {
        expect(f.bg, `cell ${f.i} faded`).toBe(await resolvedColour(page, `color-mix(in srgb, var(${token[kind]}) 20%, var(--surface))`));
        expect(f.color, `cell ${f.i} word in --text`).toBe(text);
      }
    }
  });

  test('SWD-052/007: two games: the tally counts won games by team; next clue givers are those with the fewest games', async ({ page }) => {
    const ev = flows.twoGames(); // board 2 starts with Coffee Commandos
    await openGameOver(page, ev);
    await expect(gameHeading(page)).toHaveText('Coffee Commandos win!');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 1');
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Zoya and Dev');
    expect(await cellNames(page)).toEqual(wholeMapNames(B1, turnedOver(ev)));
  });

  test('SWD-007/014/112: a player who doesn\'t give clues is never suggested; a partner\'s game counts for them, and a suggestion has no partner', async ({ page }) => {
    const ev = orangeWinsAtOnce({ teams: exampleTeams({ partners: { orange: 'Meena', teal: null }, guessOnly: ['Zoya'] }) });
    await openGameOver(page, ev);
    // Riya and Meena (partner) each have 1 game; Zoya doesn't give clues: Om. Teal: Arjun has 1: Kabir.
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Om and Kabir');
  });

  test('menu table: game over\'s menu is Players · How to play · Settings · History (no Pause, New board, End the game)', async ({ page }) => {
    await openGameOver(page, orangeWinsAtOnce());
    expect(await menuItems(page)).toEqual(['Players', '|', 'How to play', 'Settings', 'History']);
  });

  test('SWD-051: the screen-on lock is not held at game over', async ({ page }) => {
    await watchWakeLock(page);
    await openGameOver(page, orangeWinsAtOnce());
    await page.clock.runFor(1000);
    expect(await heldLocks(page)).toBe(0);
  });
});

test.describe('G1 game over: ended early (SWD-054, 048, 128)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('SWD-054: "Game ended. No winner.": no result line, no near-miss, no team bar; the whole map; tally unchanged; best-clue still shown', async ({ page }) => {
    const ev = flows.endedEarlyWithBest();
    await openGameOver(page, ev);
    await expect(gameHeading(page)).toHaveText('Game ended. No winner.');
    await expect(resultLine(page)).toHaveCount(0);
    await expect(nearMiss(page)).toHaveCount(0);
    await expect(teamBar(page)).toHaveCount(0);
    await expect(bestClue(page)).toHaveText('Best clue: Ocean 2 · all 2 found');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 0 · Coffee Commandos 0');
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Meena and Kabir'); // an ended-early game counts (SWD-007, 112)
    expect(await cellNames(page)).toEqual(wholeMapNames(B0, turnedOver(ev)));
    await expect(undoToast(page)).toHaveCount(0);
  });

  test('SWD-048/054: a reload while "Game ended · Undo" ran (step game-over, no endGame) records endGame and shows game over without the toast', async ({ page }) => {
    const ev = midGame();
    const n = ev.records.length;
    await openGameOver(page, ev, { ui: { step: 'game-over' } });
    await expect(gameHeading(page)).toHaveText('Game ended. No winner.');
    await expect(undoToast(page)).toHaveCount(0);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame']);
    await page.clock.runFor(11_000);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame']);
  });
});

test.describe('D6 End the game, from a game step (SWD-054)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /** Mid-game, back on guessing after a reload (SWD-048, lane B), then the menu's "End the game" and its dialog. */
  async function toDialog(page: Page) {
    const ev = midGame();
    const saved = savedOf(ev);
    await openOn(page, saved, page.getByTestId('turn-line'));
    await fromMenu(page, 'End the game');
    const d = dialog(page, 'End this game with no winner?');
    await expect(d).toBeVisible();
    return { ev, n: ev.records.length, d };
  }

  test('the dialog: "End the game" and main "Keep playing"; Keep playing goes back to guessing and records nothing', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const { n, d } = await toDialog(page);
    await expect(d.getByRole('button', { name: 'End the game', exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep playing');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(d).toHaveCount(0);
    await expect(page.getByTestId('turn-line')).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('"End the game": game over "Game ended. No winner." with the 10 s toast "Game ended · Undo"; endGame recorded when it expires', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const { n, d } = await toDialog(page);
    await waitGuards(page);
    await d.getByRole('button', { name: 'End the game', exact: true }).click();
    await expect(gameHeading(page)).toHaveText('Game ended. No winner.');
    await expect(undoToast(page)).toHaveText(/^Game ended · Undo$/);
    expect(await movesAfter(page, ID, n)).toEqual([]);
    expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), `pgn.secretWords-ui.${ID}`))?.step).toBe('game-over');
    await page.clock.runFor(9_000);
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await page.clock.runFor(1_500);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame']);
    await expect(undoToast(page)).toHaveCount(0);
  });

  test('"Undo" within 10 s returns to guessing as it was and records nothing, then or later', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const { n, d } = await toDialog(page);
    const clueLine = await page.getByTestId('clue-line').textContent().catch(() => null);
    await waitGuards(page);
    await d.getByRole('button', { name: 'End the game', exact: true }).click();
    await expect(undoToast(page)).toBeVisible();
    await page.clock.runFor(3_000);
    await undoToast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(gameHeading(page)).toHaveCount(0);
    await expect(page.getByTestId('turn-line')).toBeVisible();
    if (clueLine !== null) await expect(page.getByTestId('clue-line')).toHaveText(clueLine);
    await page.clock.runFor(12_000);
    expect(await movesAfter(page, ID, n)).toEqual([]);
  });

  test('a tap that leaves game over ("← Home") records endGame at once; "Players" and "Swap clue givers" don\'t', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const { n, d } = await toDialog(page);
    await waitGuards(page);
    await d.getByRole('button', { name: 'End the game', exact: true }).click();
    await expect(gameHeading(page)).toBeVisible();
    await fromMenu(page, 'Players');
    await expect(dialog(page, 'Players')).toBeVisible();
    await waitGuards(page);
    await dialog(page, 'Players').getByTestId('main-button').click();
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await homeButton(page).click();
    await expect(home(page)).toBeVisible();
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame']);
  });

  test('the app hidden while the toast runs records endGame', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const { n, d } = await toDialog(page);
    await waitGuards(page);
    await d.getByRole('button', { name: 'End the game', exact: true }).click();
    await expect(undoToast(page)).toBeVisible();
    await hideAndShowApp(page);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame']);
    await expect(undoToast(page)).toHaveCount(0);
  });
});

test.describe('SWD-055: New board', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('menu "New board" → "New board": dealNew with the next board; the new starting team\'s pass screen, turn 1; tally unchanged', async ({ page }) => {
    needsLanes('B', 'the pass screen after a reload, its menu, the New board dialog (D5) and Pause (SWD-048, 110)');
    const ev = flows.tealPassStep(); // turn 2: Coffee Commandos' pass screen
    const n = ev.records.length;
    await openOn(page, savedOf(ev), page.getByTestId('turn-heading'));
    await fromMenu(page, 'New board');
    const d = dialog(page, /^New board\?/);
    await waitGuards(page);
    await d.getByRole('button', { name: 'New board', exact: true }).click();
    expect(await movesAfter(page, ID, n)).toEqual([{ type: 'dealNew', code: CODES[1] }]);
    await expect(page.getByTestId('turn-heading')).toHaveText(`${NAME[B1.starts]}, your turn`);
    await page.getByTestId('pause-button').click();
    await expect(page.getByTestId('pause-cover').getByTestId('where-line')).toHaveText(`Turn 1 · clue for ${NAME[B1.starts]}`);
  });
});

test.describe('SWD-053/066: Play again', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('records setClueGivers for the suggested clue givers, then the deal of the next board; saves the choices', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await openGameOver(page, ev);
    await playAgain(page).click();
    await expect(gameHeading(page)).toHaveCount(0);
    expect(await movesAfter(page, ID, n)).toEqual([
      { type: 'setClueGivers', clueGivers: { orange: 'Meena', teal: 'Kabir' }, partners: { orange: null, teal: null } },
      { type: 'deal', code: CODES[1] },
    ]);
    // SWD-066: written at each deal.
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.secretWords.lastChoices') ?? 'null')))
      .toEqual({ map: 'pass', board: 'full', landmine: 'lose', words: 'family' });
  });

  test('with the same clue givers as the last game, only the deal is recorded', async ({ page }) => {
    // Meena and Kabir don't give clues, so Riya and Arjun are suggested again.
    const ev = orangeWinsAtOnce({ teams: exampleTeams({ orange: ['Riya', 'Meena'], teal: ['Arjun', 'Kabir'], guessOnly: ['Meena', 'Kabir'] }) });
    const n = ev.records.length;
    await openGameOver(page, ev);
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Riya and Arjun');
    await playAgain(page).click();
    await expect(gameHeading(page)).toHaveCount(0);
    expect(await movesAfter(page, ID, n)).toEqual([{ type: 'deal', code: CODES[1] }]);
  });

  test('one phone: then the new starting team\'s pass screen for its new clue giver', async ({ page }) => {
    needsLanes('B', 'the pass screen (P1)');
    await openGameOver(page, orangeWinsAtOnce());
    await playAgain(page).click();
    await expect(page.getByTestId('turn-heading')).toHaveText('Coffee Commandos, your turn');
    await expect(mainButton(page)).toHaveText("I'm Kabir");
  });

  test('two phones: then the scan screen', async ({ page }) => {
    needsLanes('B', 'the scan screen (S7)');
    await openGameOver(page, orangeWinsAtOnce({ choices: { map: 'shared' } }));
    await playAgain(page).click();
    await expect(page.getByRole('heading', { name: 'Clue givers: scan to get the secret map' })).toBeVisible();
  });
});

test.describe('SWD-112: game over, what next', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('SWD-111: "← Home" opens Home; the game night stays unfinished and nothing is recorded', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await openGameOver(page, ev);
    await homeButton(page).click();
    await expect(home(page)).toBeVisible();
    const saved = await savedById(page, ID);
    expect(saved.status).toBe('in-progress');
    expect(saved.records).toHaveLength(ev.records.length);
  });

  test('SWD-062/111: Home\'s row resumes at game over, as it was', async ({ page }) => {
    needsLanes('A', 'Home\'s Secret Words row (SWD-115)');
    await openGameOver(page, orangeWinsAtOnce());
    await homeButton(page).click();
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ });
    await expect(row).toBeVisible();
    await waitGuards(page);
    await row.getByText('Tap to resume').first().click();
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 0');
  });

  test('"Swap clue givers": the Clue givers sheet for the next game; "Done" updates the line; nothing recorded until Play again', async ({ page }) => {
    needsLanes('A', 'the Clue givers sheet (S2a, SWD-007)');
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await openGameOver(page, ev);
    await button(page, 'Swap clue givers').click();
    const sheet = dialog(page, 'Clue givers');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('group', { name: 'Chai Champions', exact: true }).getByRole('button', { name: 'Zoya', exact: true }).click();
    await waitGuards(page);
    await sheet.getByTestId('main-button').click();
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Zoya and Kabir');
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await waitGuards(page);
    await playAgain(page).click();
    expect(await movesAfter(page, ID, n)).toEqual([
      { type: 'setClueGivers', clueGivers: { orange: 'Zoya', teal: 'Kabir' }, partners: { orange: null, teal: null } },
      { type: 'deal', code: CODES[1] },
    ]);
  });

  test('"Change teams, players, phones or board": Who\'s playing? with tonight\'s names and "← Back to the game", which returns to game over', async ({ page }) => {
    needsLanes('A', 'Who\'s playing? from game over (S1, SWD-003)');
    const ev = orangeWinsAtOnce();
    await openGameOver(page, ev);
    await button(page, 'Change teams, players, phones or board').click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    for (const name of ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om']) await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    await waitGuards(page);
    await button(page, '← Back to the game').click();
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    expect(await movesOf(page, ID)).toHaveLength(ev.records.length);
  });

  test('→ Make teams (no "New team names") → Choices → "Start the game": no read-aloud; records setChoices, then the deal', async ({ page }) => {
    needsLanes('A', 'Who\'s playing?, Make teams and Choices from game over (S1–S3)');
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await openGameOver(page, ev);
    await button(page, 'Change teams, players, phones or board').click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await waitGuards(page);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Make teams' })).toBeVisible();
    await expect(button(page, 'New team names')).toHaveCount(0);
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await waitGuards(page);
    await mainButton(page).filter({ hasText: /^Next$/ }).click();
    await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
    await waitGuards(page);
    await button(page, 'Two phones').click();
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await waitGuards(page);
    await mainButton(page).filter({ hasText: /^Start the game$/ }).click();
    await expect(page.getByRole('heading', { name: 'Read this aloud' })).toHaveCount(0);
    const after = await movesAfter(page, ID, n);
    expect(after.map((m) => m.type)).not.toContain('setPlayers');
    expect(after.map((m) => m.type)).not.toContain('setTeams');
    expect(after.slice(-2)).toEqual([
      { type: 'setChoices', choices: { map: 'shared', board: 'full', landmine: 'lose', words: 'family' } },
      { type: 'deal', code: CODES[1] },
    ]);
  });
});

test.describe('SWD-112 v3.7: game over\'s pinned bottom bar ("End for tonight" beside "Play again")', () => {
  /** The bar's two buttons: positions in the viewport. */
  async function bar(page: Page) {
    const end = await box(endForTonight(page));
    const play = await box(playAgain(page));
    const vp = page.viewportSize()!;
    return { end, play, vp };
  }

  for (const vp of [{ width: 390, height: 844, end: 137, play: 205 }, { width: 360, height: 640, end: 125, play: 187 }]) {
    test.describe(`${vp.width} × ${vp.height}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });
      test('side by side, 40 / 60, both 60 px tall, 16 px side margins and from the bottom; pinned while the list scrolls above it', async ({ page }) => {
        await openGameOver(page, orangeWinsAtOnce());
        const { end, play } = await bar(page);
        expect(end.height).toBeCloseTo(60, 0);
        expect(play.height).toBeCloseTo(60, 0);
        expect(Math.abs(end.y - play.y)).toBeLessThanOrEqual(1);
        expect(end.x + end.width).toBeLessThanOrEqual(play.x); // "End for tonight" left of "Play again"
        expect(end.x).toBeCloseTo(16, 0);
        expect(play.x + play.width).toBeCloseTo(vp.width - 16, 0);
        expect(play.y + play.height).toBeCloseTo(vp.height - 16, 0);
        expect(end.width / (end.width + play.width)).toBeCloseTo(0.4, 1);
        // The scenario's widths (137 / 205 at 390 px, 125 / 187 at 360 px) hold with a 16 px gap, its text says 8 px:
        // asked in docs/test-questions.md (23 October); either reading passes until the answer.
        const gap = play.x - (end.x + end.width);
        expect([8, 16].some((g) => Math.abs(gap - g) <= 1), `gap ${gap}`).toBe(true);
        if (Math.abs(gap - 16) <= 1) {
          expect(end.width).toBeCloseTo(vp.end, 0);
          expect(play.width).toBeCloseTo(vp.play, 0);
        }
        // Pinned: the same place after scrolling; the list ends above the bar.
        await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight));
        await page.mouse.wheel(0, 2000);
        const after = await bar(page);
        expect(after.end.y).toBeCloseTo(end.y, 0);
        expect(after.play.y).toBeCloseTo(play.y, 0);
        const homeBox = await box(homeButton(page));
        expect(homeBox.y + homeBox.height).toBeLessThanOrEqual(after.end.y + 0.5);
      });
    });
  }

  test.describe('320 × 568 (narrow portrait)', () => {
    test.use({ viewport: { width: 320, height: 568 } });
    test('stacked full width: "End for tonight" above "Play again", 60 + 8 + 60 px, 16 px from the bottom', async ({ page }) => {
      await openGameOver(page, orangeWinsAtOnce());
      const { end, play } = await bar(page);
      for (const b of [end, play]) {
        expect(b.x).toBeCloseTo(16, 0);
        expect(b.width).toBeCloseTo(288, 0);
        expect(b.height).toBeCloseTo(60, 0);
      }
      expect(play.y - (end.y + end.height)).toBeCloseTo(8, 0);
      expect(play.y + play.height).toBeCloseTo(568 - 16, 0);
    });

    test('SWD-051/092: a Full board shows the sideways line instead of the board', async ({ page }) => {
      await openGameOver(page, orangeWinsAtOnce());
      await expect(page.getByTestId('turn-sideways')).toHaveText('Turn your phone sideways to see the board.');
      await expect(boardCells(page).filter({ visible: true })).toHaveCount(0);
    });

    test('SWD-092 v3.6: an Easy board shows its 4 × 4 grid, no sideways line', async ({ page }) => {
      const ev = flows.easyWin();
      await openGameOver(page, ev);
      await expect(page.getByTestId('turn-sideways')).toHaveCount(0);
      await expect(boardCells(page).filter({ visible: true })).toHaveCount(16);
      expect(await cellNames(page)).toEqual(wholeMapNames(oracleBoard(EASY_CODES[0]!), turnedOver(ev)));
    });
  });

  test.describe('390 × 844, Larger text', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('stacked full width with Larger text on', async ({ page }) => {
      await openGameOver(page, orangeWinsAtOnce(), { storage: { 'pgn.pref.largerText': true } });
      const { end, play } = await bar(page);
      expect(end.width).toBeCloseTo(358, 0);
      expect(play.width).toBeCloseTo(358, 0);
      expect(play.y - (end.y + end.height)).toBeCloseTo(8, 0);
      expect(play.y + play.height).toBeCloseTo(844 - 16, 0);
    });
  });

  for (const vp of [{ width: 812, height: 375 }, { width: 568, height: 320 }]) {
    test.describe(`${vp.width} × ${vp.height} (landscape)`, () => {
      test.use({ viewport: vp });
      test('stacked in the landscape main area: 358 px wide, 128 px tall, 16 px from the right and bottom edges', async ({ page }) => {
        await openGameOver(page, orangeWinsAtOnce());
        const { end, play } = await bar(page);
        for (const b of [end, play]) {
          expect(b.width).toBeCloseTo(358, 0);
          expect(b.x + b.width).toBeCloseTo(vp.width - 16, 0);
        }
        expect(end.y).toBeLessThan(play.y);
        expect(play.y + play.height - end.y).toBeCloseTo(128, 0);
        expect(play.y + play.height).toBeCloseTo(vp.height - 16, 0);
      });
    });
  }
});

test.describe('D8 End for tonight and G2 the summary (SWD-060, 128)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  async function toSummary(page: Page, ev: SwEvening) {
    await openGameOver(page, ev);
    await endForTonight(page).click();
    const d = dialog(page, "End for tonight? Tonight's tally stays in History.");
    await expect(d).toBeVisible();
    await waitGuards(page);
    await d.getByRole('button', { name: 'End for tonight', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await waitGuards(page);
  }

  test('the dialog at game over: "End for tonight? Tonight\'s tally stays in History." with "End for tonight" and main "Keep playing", which returns', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await openGameOver(page, ev);
    await endForTonight(page).click();
    const d = dialog(page, "End for tonight? Tonight's tally stays in History.");
    await expect(d).toBeVisible();
    await expect(d.getByRole('button', { name: 'End for tonight', exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep playing');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(d).toHaveCount(0);
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    expect(await movesOf(page, ID)).toHaveLength(ev.records.length);
  });

  test('the summary: heading, summary-line, tally, clue-credit, "Oops, keep playing", "← Home", main "Play something else", in order; nothing recorded yet', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await toSummary(page, ev);
    await expect(page.getByRole('heading', { level: 1, name: "Tonight's Secret Words", exact: true })).toBeVisible();
    await expect(summaryLine(page)).toHaveText('7 players · 1 game · 9 words found');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 0');
    await expect(clueCredit(page)).toHaveText('Clues tonight from Riya and Arjun');
    await expect(mainButton(page)).toHaveText('Play something else');
    expect(await inDomOrder(page, [
      { id: 'summary-line' }, { id: 'tally' }, { id: 'clue-credit' }, { button: 'Oops, keep playing' }, { button: '← Home' },
    ])).toBe(true);
    // No Landmine count, no ranking of clue givers (SWD-128).
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/Landmine/);
    expect(await movesOf(page, ID)).toHaveLength(ev.records.length);
    expect((await savedById(page, ID)).status).toBe('in-progress');
  });

  test('the summary\'s menu holds only "Delete tonight\'s games"', async ({ page }) => {
    await toSummary(page, orangeWinsAtOnce());
    expect(await menuItems(page)).toEqual(["Delete tonight's games"]);
  });

  test('"Oops, keep playing" returns to game over as it was and records nothing', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    await toSummary(page, ev);
    await button(page, 'Oops, keep playing').click();
    await expect(gameHeading(page)).toHaveText('Chai Champions win!');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 0');
    await expect(nextClueGivers(page)).toHaveText('Next clue givers: Meena and Kabir');
    expect(await movesOf(page, ID)).toHaveLength(ev.records.length);
  });

  test('"← Home" records endEvening once (no endGame after a finished game); Home; the game night never reopens', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await toSummary(page, ev);
    await homeButton(page).click();
    await expect(home(page)).toBeVisible();
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
    expect((await savedById(page, ID)).status).toBe('ended');
    await expect(page.getByTestId('unfinished-games').filter({ hasText: /Secret Words/ })).toHaveCount(0);
    await page.reload();
    await expect(home(page)).toBeVisible();
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
  });

  test('"Play something else" opens the picker and records endEvening', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await toSummary(page, ev);
    await mainButton(page).filter({ hasText: /^Play something else$/ }).click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
  });

  test('a reload on the summary records endEvening and shows the summary without "Oops, keep playing"', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await toSummary(page, ev);
    await page.reload();
    await expect(summaryHeading(page)).toBeVisible();
    await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
    await expect(summaryLine(page)).toHaveText('7 players · 1 game · 9 words found');
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
  });

  test('SWD-048: opening the app on a summary not yet left (step summary) records endEvening and shows it without "Oops, keep playing"', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await openOn(page, savedOf(ev), summaryHeading(page), { ui: { step: 'summary' } });
    await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
  });

  test('the app hidden on the summary records endEvening; "Oops, keep playing" goes', async ({ page }) => {
    const ev = orangeWinsAtOnce();
    const n = ev.records.length;
    await toSummary(page, ev);
    await hideAndShowApp(page);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endEvening']);
    await expect(summaryHeading(page)).toBeVisible();
    await expect(button(page, 'Oops, keep playing')).toHaveCount(0);
  });

  test('SWD-128: two games: "7 players · 2 games · 17 words found", the tally, credits in order of first credit', async ({ page }) => {
    const ev = flows.twoGames(); // Coffee Commandos find their 8 in game 2
    await toSummary(page, ev);
    await expect(summaryLine(page)).toHaveText('7 players · 2 games · 17 words found');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 1 · Coffee Commandos 1');
    await expect(clueCredit(page)).toHaveText('Clues tonight from Riya, Arjun, Meena and Kabir');
  });

  test('SWD-128: singulars and an ended-early game: "7 players · 1 game · 1 word found"; partners credited each on their own', async ({ page }) => {
    const ev = flows.oneWordEndedEarly({ teams: exampleTeams({ partners: { orange: 'Meena', teal: null } }) });
    await toSummary(page, ev);
    await expect(summaryLine(page)).toHaveText('7 players · 1 game · 1 word found');
    await expect(tally(page)).toHaveText('Tonight: Chai Champions 0 · Coffee Commandos 0');
    await expect(clueCredit(page)).toHaveText('Clues tonight from Riya, Meena and Arjun');
  });

  test('mid-game: "End for tonight? This game won\'t count in the tally."; the game counts as ended early; "Oops" returns; "← Home" records endGame then endEvening', async ({ page }) => {
    needsLanes('B', 'guessing after a reload and its menu (SWD-048, 110)');
    const ev = midGame();
    const n = ev.records.length;
    await openOn(page, savedOf(ev), page.getByTestId('turn-line'));
    await fromMenu(page, 'End for tonight');
    const d = dialog(page, "End for tonight? This game won't count in the tally.");
    await expect(d).toBeVisible();
    await waitGuards(page);
    await d.getByRole('button', { name: 'End for tonight', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await expect(summaryLine(page)).toHaveText('7 players · 1 game · 1 word found');
    await expect(clueCredit(page)).toHaveText('Clues tonight from Riya and Arjun');
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await waitGuards(page);
    await button(page, 'Oops, keep playing').click();
    await expect(page.getByTestId('turn-line')).toBeVisible();
    expect(await movesAfter(page, ID, n)).toEqual([]);
    await fromMenu(page, 'End for tonight');
    await waitGuards(page);
    await dialog(page, "End for tonight? This game won't count in the tally.").getByRole('button', { name: 'End for tonight', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await waitGuards(page);
    await homeButton(page).click();
    await expect(home(page)).toBeVisible();
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame', 'endEvening']);
  });
});

test.describe('D9 Delete tonight\'s games (SWD-065)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  async function toDelete(page: Page) {
    await openGameOver(page, orangeWinsAtOnce());
    await endForTonight(page).click();
    await waitGuards(page);
    await dialog(page, "End for tonight? Tonight's tally stays in History.").getByRole('button', { name: 'End for tonight', exact: true }).click();
    await expect(summaryHeading(page)).toBeVisible();
    await fromMenu(page, "Delete tonight's games");
    const d = dialog(page, "Delete tonight's games? The games and tally will be lost.");
    await expect(d).toBeVisible();
    return d;
  }

  test('"Keep it" (main) returns to the summary; nothing deleted', async ({ page }) => {
    const d = await toDelete(page);
    await expect(d.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await expect(d.getByTestId('main-button')).toHaveText('Keep it');
    await waitGuards(page);
    await d.getByTestId('main-button').click();
    await expect(summaryHeading(page)).toBeVisible();
    expect(await savedById(page, ID)).not.toBeNull();
  });

  test('"Delete": the game night is deleted and Home opens; no undo', async ({ page }) => {
    const d = await toDelete(page);
    await waitGuards(page);
    await d.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(home(page)).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
    await expect(page.getByRole('button', { name: /Undo/ })).toHaveCount(0);
  });
});

test.describe('SWD-063: the 12-hour limit', () => {
  const H12 = 12 * 60 * 60 * 1000;

  test('at exactly 12 hours after the last move the game night is still unfinished', async ({ page }) => {
    const saved = savedOf(midGame());
    const last = saved.records.at(-1).at;
    await phoneWithEvenings(page, [saved], { now: last + H12 });
    await expect(home(page)).toBeVisible();
    await page.clock.runFor(500);
    const now = await savedById(page, ID);
    expect(now.status).toBe('in-progress');
    expect(now.records).toHaveLength(saved.records.length);
  });

  test('1 ms later: endGame and endEvening recorded at the last move + 12 hours; Home, no summary', async ({ page }) => {
    const saved = savedOf(midGame());
    const last = saved.records.at(-1).at;
    await phoneWithEvenings(page, [saved], { now: last + H12 + 1 });
    await expect(home(page)).toBeVisible();
    await expect(summaryHeading(page)).toHaveCount(0);
    await expect.poll(async () => (await savedById(page, ID)).records.length).toBe(saved.records.length + 2);
    const now = await savedById(page, ID);
    expect(now.records.slice(-2).map((r: any) => [r.move.type, r.at])).toEqual([['endGame', last + H12], ['endEvening', last + H12]]);
    expect(now.status).toBe('ended');
  });

  test('a finished game left on game over: only endEvening, at the last move + 12 hours', async ({ page }) => {
    const saved = savedOf(orangeWinsAtOnce());
    const last = saved.records.at(-1).at;
    await phoneWithEvenings(page, [saved], { now: last + H12 + 60_000 });
    await expect(home(page)).toBeVisible();
    await expect.poll(async () => (await savedById(page, ID)).records.length).toBe(saved.records.length + 1);
    const r = (await savedById(page, ID)).records.at(-1);
    expect([r.move.type, r.at]).toEqual(['endEvening', last + H12]);
  });

  for (const step of ['summary', 'game-over'] as const) {
    test(`a pending ${step === 'summary' ? 'summary (SWD-060)' : '"Game ended" (SWD-054)'} is recorded the same way, and no summary shows`, async ({ page }) => {
      const saved = savedOf(midGame());
      const last = saved.records.at(-1).at;
      await phoneWithEvenings(page, [saved], { now: last + H12 + 1, ui: { [saved.id]: { step } } });
      await expect(home(page)).toBeVisible();
      await expect(summaryHeading(page)).toHaveCount(0);
      await expect(gameHeading(page)).toHaveCount(0);
      await expect.poll(async () => (await savedById(page, ID)).records.length).toBe(saved.records.length + 2);
      const now = await savedById(page, ID);
      expect(now.records.slice(-2).map((r: any) => [r.move.type, r.at])).toEqual([['endGame', last + H12], ['endEvening', last + H12]]);
    });
  }
});

test.describe('SWD-067: Start new (ends that one)', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('from the picker: endGame and endEvening for the old game night, then Who\'s playing?; no summary', async ({ page }) => {
    needsLanes('A', 'the picker\'s Secret Words card and the Start new dialog (A2, A3, SWD-115)');
    const saved = savedOf(midGame());
    const n = saved.records.length;
    await phoneWithEvenings(page, [saved]);
    await waitGuards(page);
    await home(page).click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    await waitGuards(page);
    await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    const d = dialog(page, 'Start a new game night?');
    await expect(d).toBeVisible();
    await d.getByRole('button', { name: 'Start new (ends that one)', exact: true }).click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    await expect(summaryHeading(page)).toHaveCount(0);
    expect((await movesAfter(page, ID, n)).map((m) => m.type)).toEqual(['endGame', 'endEvening']);
  });
});

