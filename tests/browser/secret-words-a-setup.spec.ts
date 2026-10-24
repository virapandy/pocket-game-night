// Secret Words screen lane A, part 2: setup. "Who's playing?" (S1), "Make teams" (S2) and its "Clue givers" sheet (S2a), "How do you
// want to play?" (S3), "Read this aloud" (S4), "How to play" (S5). Scenarios v3.7 (23 October 2026): SWD-003 to SWD-014, SWD-009
// (v3.6), SWD-010 (v3.7 larger-text hint), SWD-011, SWD-066 ("Same as last time"), SWD-119, SWD-130, SWD-131, SWD-132.
// Written before the screens exist: the expected-to-fail marks were removed when lane A was built. What the screens need: tests/games/secret-words/screens-a.md.
import { expect, test } from './fixtures';
import { freezeClock } from './impostor';
import { waitGuards } from './secret-words';
import { TEAM_PAIRS } from '../games/secret-words/oracle';
import {
  box, boot, choose, codeFor, drawSplit, ended, END_AT, firstEligible, group, H, heading, mainButton, mainText, NAMES, noSidewaysScroll,
  phoneWithNights, playerField, pressed, quiet, savedNights, SIZES, smallLineColour, teamsOnScreen, toChoices, toNames, toPicker,
  toReadAloud, toTeams, typeNames, TZ, CODE, knownPair, type Boot, type Split,
} from './secret-words-a';
import type { Locator, Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const SEED = 'teams-a';
const removeButtons = (page: Page) => page.getByRole('button', { name: /^Remove / });
const toast = (page: Page) => page.getByTestId('undo-toast');
const undo = (page: Page) => toast(page).getByRole('button', { name: 'Undo', exact: true });
const textOf = async (l: Locator) => ((await l.innerText()).replace(/\s+/g, ' ').trim());
const moveButton = (page: Page, player: string, to: string) => page.getByRole('button', { name: `Move ${player} to ${to}`, exact: true });
const expectSplit = async (page: Page, split: Split, where: string) => {
  const t = await teamsOnScreen(page);
  expect(t.orange, `${where}: orange team`).toEqual(split.orange);
  expect(t.teal, `${where}: teal team`).toEqual(split.teal);
  return t;
};

// ---------------------------------------------------------------- S1 Who's playing?

test.describe("S1 Who's playing? (SWD-003, SWD-132)", () => {
  test('SWD-003: the screen is Impostor\'s names screen without the "Sit in a circle" line and without ▲ ▼', async ({ page }) => {
    await toNames(page);
    await typeNames(page, ['Riya', 'Arjun']);
    await expect(page.getByText(/Sit in a circle/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Move .* (up|down)$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove Riya', exact: true })).toBeVisible();
    const b = await box(page.getByRole('button', { name: 'Remove Riya', exact: true }));
    expect(Math.min(b.width, b.height), '✕ at least 44 × 44').toBeGreaterThanOrEqual(44);
  });

  test('SWD-003: "Next" is disabled with fewer than 4 names, with "Add at least 4 players." shown below the list whenever that is true (0 names included)', async ({ page }) => {
    await toNames(page);
    const next = mainText(page, 'Next');
    await expect(next).toBeDisabled();
    await expect(page.getByText('Add at least 4 players.', { exact: true })).toBeVisible();
    for (let i = 1; i <= 3; i++) {
      await typeNames(page, [NAMES[i - 1]!]);
      await expect(next).toBeDisabled();
      await expect(page.getByText('Add at least 4 players.', { exact: true })).toBeVisible();
    }
    await typeNames(page, [NAMES[3]!]);
    await expect(next).toBeEnabled();
    await expect(page.getByText('Add at least 4 players.')).toHaveCount(0);
  });

  test('SWD-003: a 21st name shows "20 players is the most." and adds nothing', async ({ page }) => {
    await toNames(page);
    const names = Array.from({ length: 20 }, (_, i) => `P${i + 1}`);
    await typeNames(page, names);
    await expect(removeButtons(page)).toHaveCount(20);
    await playerField(page).fill('Extra');
    await playerField(page).press('Enter');
    await expect(page.getByRole('alert').filter({ hasText: '20 players is the most.' })).toBeVisible();
    await expect(removeButtons(page)).toHaveCount(20);
    await expect(page.getByRole('button', { name: 'Remove Extra', exact: true })).toHaveCount(0);
  });

  test('SWD-003: a name equal to one in the list, ignoring case, is not added (Impostor\'s message)', async ({ page }) => {
    await toNames(page);
    await typeNames(page, ['Riya', 'Arjun']);
    await playerField(page).fill('riya');
    await playerField(page).press('Enter');
    await expect(page.getByText('Riya is already playing. Add an initial, like Riya S.', { exact: true })).toBeVisible();
    await expect(removeButtons(page)).toHaveCount(2);
  });

  test('SWD-132: every Enter adds its name and keeps the field focused and empty', async ({ page }) => {
    await toNames(page);
    await playerField(page).fill('Riya');
    await playerField(page).press('Enter');
    await expect(playerField(page)).toHaveValue('');
    await expect(playerField(page)).toBeFocused();
    await playerField(page).fill('Arjun');
    await playerField(page).press('Enter');
    await expect(playerField(page)).toBeFocused();
    await expect(removeButtons(page)).toHaveCount(2);
  });

  test('SWD-132: seven names typed quickly with Enter give seven rows, in order', async ({ page }) => {
    await toNames(page);
    await playerField(page).pressSequentially(`${NAMES.join('\n')}\n`, { delay: 0 });
    await expect(removeButtons(page)).toHaveCount(7);
    const labels = await removeButtons(page).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(labels).toEqual(NAMES.map((n) => `Remove ${n}`));
  });

  test('SWD-003: "Clear list" empties the list with the toast "List cleared · Undo"; Undo restores it', async ({ page }) => {
    await toNames(page);
    await typeNames(page, NAMES.slice(0, 5));
    await quiet(page, 'Clear list').click();
    await expect(removeButtons(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(/^\s*List cleared ·\s*Undo\s*$/);
    await undo(page).click();
    await expect(removeButtons(page)).toHaveCount(5);
  });

  test("SWD-003: tonight's names arrive filled in, in the order of the night's players, with \"Clear list\"", async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + H });
    await toPicker(page);
    await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    const labels = await removeButtons(page).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(labels).toEqual(NAMES.map((n) => `Remove ${n}`));
    await expect(quiet(page, 'Clear list')).toBeVisible();
  });

  test('SWD-003: "← Back" returns to the picker, and the names are kept in the same visit', async ({ page }) => {
    await toNames(page);
    await typeNames(page, NAMES.slice(0, 4));
    await quiet(page, '← Back').click();
    await expect(heading(page, 'What shall we play?')).toBeVisible();
    await waitGuards(page);
    await page.getByRole('button', { name: /^Secret Words/ }).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await expect(removeButtons(page)).toHaveCount(4);
  });
});

// ---------------------------------------------------------------- S2 Make teams

test.describe('S2 Make teams (SWD-004 to SWD-008, SWD-013)', () => {
  test('SWD-004: the first split is the scenario\'s draw: names shuffled with `teams-a:1`, the first ⌈n/2⌉ to the orange team; each team\'s first player is its clue giver', async ({ page }) => {
    await toTeams(page);
    const expected = drawSplit(NAMES, SEED, 1).split;
    const t = await expectSplit(page, expected, 'first draw');
    expect(t.clueGivers).toEqual({ orange: expected.orange[0], teal: expected.teal[0] });
    expect(t.guessOnly).toEqual([]);
  });

  test('SWD-004 / SWD-013 (v3.7): headings "<team name> · 4 players" and "<team name> · 3 players" with the pair from team-names.csv, orange first; small lines "Orange team" / "Teal team"; "Tap a name to move it to the other team."; main "Next"', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    expect(knownPair(t.names), `"${t.names.orange}" and "${t.names.teal}" are a pair from team-names.csv`).toBeTruthy();
    await expect(page.getByRole('heading', { level: 2, name: `${t.names.orange} · 4 players` })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: `${t.names.teal} · 3 players` })).toBeVisible();
    await expect(page.getByText('Orange team', { exact: true })).toBeVisible();
    await expect(page.getByText('Teal team', { exact: true })).toBeVisible();
    await expect(page.getByText('Tap a name to move it to the other team.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('clue-giver-badge')).toHaveCount(2);
    await expect(page.getByTestId('clue-giver-badge').first()).toHaveText('Clue giver');
    await expect(mainText(page, 'Next')).toBeEnabled();
    for (const [who, name] of [['orange', t.names.orange], ['teal', t.names.teal]] as const) {
      expect(name.length, `${who} team name at most 18 characters`).toBeLessThanOrEqual(18);
      expect(name, 'never a possessive').not.toMatch(/'s$/);
    }
  });

  test('SWD-004: the columns sit side by side, each (screen width − 32 − 8) / 2 px wide, orange on the left', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    const o = await box(page.getByRole('heading', { level: 2, name: new RegExp(`^${t.names.orange} · `) }));
    const e = await box(page.getByRole('heading', { level: 2, name: new RegExp(`^${t.names.teal} · `) }));
    expect(o.x, 'orange first (left)').toBeLessThan(e.x);
    expect(Math.abs(o.y - e.y), 'same row').toBeLessThanOrEqual(2);
    const widths = await page.evaluate(() => [...document.querySelectorAll('h2')].filter((h) => / · \d+ players?$/.test(h.textContent ?? '')).map((h) => {
      const out: number[] = [];
      for (let p: Element | null = h; p && p !== document.body; p = p.parentElement) out.push(p.getBoundingClientRect().width);
      return out;
    }));
    const column = (390 - 32 - 8) / 2;
    for (const w of widths) expect(w.some((x) => Math.abs(x - column) <= 1), `an ancestor column of ${column} px among ${w.map(Math.round)}`).toBe(true);
  });

  test('SWD-005: each name is a button "Move Om to <other team>"; a tap moves the player to the end of the other team and shows "Om moved to <team> · Undo"; Undo restores the teams and clue givers exactly', async ({ page }) => {
    await toTeams(page);
    const before = await teamsOnScreen(page);
    const mover = before.orange[2]!;
    await moveButton(page, mover, before.names.teal).click();
    const after = await teamsOnScreen(page);
    expect(after.orange).toEqual(before.orange.filter((p) => p !== mover));
    expect(after.teal).toEqual([...before.teal, mover]);
    expect(after.clueGivers).toEqual(before.clueGivers);
    await expect(toast(page)).toHaveText(new RegExp(`^\\s*${mover} moved to ${before.names.teal} ·\\s*Undo\\s*$`));
    await undo(page).click();
    expect(await teamsOnScreen(page)).toEqual(before);
  });

  test('SWD-005: moving a clue giver makes the player now at their old place the clue giver (else the first); the moved player is a guesser; only the latest move can be undone', async ({ page }) => {
    await toTeams(page);
    const before = await teamsOnScreen(page);
    const cg = before.clueGivers.orange!;
    await moveButton(page, cg, before.names.teal).click();
    await waitGuards(page);
    const mid = await teamsOnScreen(page);
    expect(mid.clueGivers.orange, 'the player now at the old position').toBe(before.orange[1]);
    expect(mid.clueGivers.teal, 'the other team\'s clue giver is unchanged').toBe(before.clueGivers.teal);
    expect(mid.teal.at(-1)).toBe(cg);
    const second = mid.teal[1]!;
    await moveButton(page, second, mid.names.orange).click();
    await expect(toast(page)).toContainText(`${second} moved to ${mid.names.orange}`);
    await undo(page).click();
    const back = await teamsOnScreen(page);
    expect(back, 'Undo undoes only the latest move').toEqual(mid);
    await expect(toast(page)).toHaveCount(0);
  });

  test('SWD-005: a second tap within 500 ms of the first does nothing', async ({ page }) => {
    await toTeams(page);
    await freezeClock(page);
    const before = await teamsOnScreen(page);
    await moveButton(page, before.orange[1]!, before.names.teal).dblclick();
    const after = await teamsOnScreen(page);
    expect(after.orange.length + after.teal.length).toBe(7);
    expect(Math.abs(after.orange.length - before.orange.length), 'one player moved, not two').toBe(1);
  });

  test('SWD-005 / SWD-008: a team can be left empty (no clue giver, "Each team needs at least 2 players.", "Next" disabled); the next player to join it becomes its clue giver', async ({ page }) => {
    await toTeams(page, { names: ['Riya', 'Arjun', 'Meena', 'Kabir'] });
    const t0 = await teamsOnScreen(page);
    expect(t0.orange).toHaveLength(2);
    for (const p of t0.teal) { await waitGuards(page); await moveButton(page, p, t0.names.orange).click(); }
    const empty = await teamsOnScreen(page);
    expect(empty.teal).toEqual([]);
    expect(empty.clueGivers.teal).toBeNull();
    await expect(page.getByRole('alert').filter({ hasText: 'Each team needs at least 2 players.' })).toBeVisible();
    await expect(mainText(page, 'Next')).toBeDisabled();
    await waitGuards(page);
    await moveButton(page, t0.teal[1]!, t0.names.teal).click();
    const one = await teamsOnScreen(page);
    expect(one.clueGivers.teal).toBe(t0.teal[1]);
    await expect(page.getByRole('heading', { level: 2, name: `${t0.names.teal} · 1 player` })).toBeVisible();
    await waitGuards(page);
    await moveButton(page, t0.teal[0]!, t0.names.teal).click();
    await expect(page.getByText('Each team needs at least 2 players.')).toHaveCount(0);
    await expect(mainText(page, 'Next')).toBeEnabled();
  });

  test('SWD-006: "Shuffle teams" draws the next split by the same rule, shows "Teams shuffled · Undo", and Undo restores teams and clue givers; k counts every draw', async ({ page }) => {
    await toTeams(page);
    const first = drawSplit(NAMES, SEED, 1);
    const before = await expectSplit(page, first.split, 'draw 1');
    await quiet(page, 'Shuffle teams').click();
    const second = drawSplit(NAMES, SEED, first.k + 1, { now: first.split });
    const after = await expectSplit(page, second.split, `draw ${second.k}`);
    expect(after.clueGivers).toEqual({ orange: second.split.orange[0], teal: second.split.teal[0] });
    await expect(toast(page)).toHaveText(/^\s*Teams shuffled ·\s*Undo\s*$/);
    await undo(page).click();
    expect(await teamsOnScreen(page)).toEqual(before);
    await waitGuards(page);
    await quiet(page, 'Shuffle teams').click();
    const third = drawSplit(NAMES, SEED, second.k + 1, { now: first.split });
    await expectSplit(page, third.split, `draw ${third.k} after Undo (k is not given back)`);
  });

  test('SWD-013: "New team names" draws another pair (never the one on screen) with "New team names · Undo"; Undo restores the pair', async ({ page }) => {
    await toTeams(page);
    const before = await teamsOnScreen(page);
    await quiet(page, 'New team names').click();
    const after = await teamsOnScreen(page);
    expect(knownPair(after.names)).toBeTruthy();
    expect(after.names).not.toEqual(before.names);
    expect(after.orange).toEqual(before.orange);
    await expect(toast(page)).toHaveText(/^\s*New team names ·\s*Undo\s*$/);
    await undo(page).click();
    expect((await teamsOnScreen(page)).names).toEqual(before.names);
  });

  test('SWD-013: the pair is one of the 20 in team-names.csv, whatever the evening', async ({ page }) => {
    const seen = new Set<string>();
    for (const seed of ['b', 'c', 'd']) {
      await toTeams(page, { seed });
      const t = await teamsOnScreen(page);
      const pair = knownPair(t.names);
      expect(pair, `a known pair for seed ${seed}`).toBeTruthy();
      seen.add(pair!.id);
    }
    expect(TEAM_PAIRS).toHaveLength(20);
  });

  test('SWD-004: "← Back" then "Next" keeps the teams; a name added joins the smaller team at the end; a removed name is dropped', async ({ page }) => {
    await toTeams(page);
    const before = await teamsOnScreen(page);
    await quiet(page, '← Back').click();
    await expect(page.getByRole('heading', { name: "Who's playing?", exact: true })).toBeVisible();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await expect(page.getByRole('heading', { name: 'Make teams', exact: true })).toBeVisible();
    expect(await teamsOnScreen(page)).toEqual(before);
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await waitGuards(page);
    await page.getByRole('button', { name: `Remove ${before.orange[0]}`, exact: true }).click();
    await typeNames(page, ['Neha']);
    await mainText(page, 'Next').click();
    await expect(page.getByRole('heading', { name: 'Make teams', exact: true })).toBeVisible();
    const after = await teamsOnScreen(page);
    expect(after.orange, 'the removed name is dropped; Neha joins the smaller team (3 v 3: orange) at the end').toEqual([...before.orange.slice(1), 'Neha']);
    expect(after.teal).toEqual(before.teal);
    expect(after.clueGivers.orange, 'the clue giver who left is replaced').toBe(before.orange[1]);
  });

  test('SWD-008: while either team has fewer than 2 players "Next" is disabled with "Each team needs at least 2 players."; teams may differ in size by any amount', async ({ page }) => {
    await toTeams(page, { names: ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev'] });
    const t = await teamsOnScreen(page);
    expect(t.orange).toHaveLength(3);
    await waitGuards(page);
    await moveButton(page, t.teal[0]!, t.names.orange).click(); // 4 v 2: teams may differ in size by any amount
    await expect(page.getByText('Each team needs at least 2 players.')).toHaveCount(0);
    await expect(mainText(page, 'Next')).toBeEnabled();
    await waitGuards(page);
    await moveButton(page, t.teal[2]!, t.names.orange).click();
    await expect(mainText(page, 'Next')).toBeDisabled();
    await expect(page.getByRole('alert').filter({ hasText: 'Each team needs at least 2 players.' })).toBeVisible();
    await waitGuards(page);
    await moveButton(page, t.teal[2]!, t.names.teal).click();
    await expect(mainText(page, 'Next')).toBeEnabled();
  });
});

// ---------------------------------------------------------------- S2a Clue givers sheet

test.describe('S2a "Clue givers" (SWD-007, SWD-014, SWD-130)', () => {
  const sheet = (page: Page) => page.getByRole('dialog', { name: 'Clue givers', exact: true });
  const open = async (page: Page) => { await waitGuards(page); await quiet(page, 'Choose clue givers').click(); await expect(sheet(page)).toBeVisible(); await waitGuards(page); };
  const playerButton = (page: Page, team: string, name: string) => sheet(page).getByRole('group', { name: team, exact: true }).getByRole('button', { name, exact: true });
  const guessOnlySwitch = (page: Page, name: string) => sheet(page).getByRole('switch', { name: `${name}: doesn't give clues`, exact: true });

  test('SWD-007: "Choose clue givers" opens the sheet: a group per team, one button per player, the current clue giver selected; main "Done"', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    await open(page);
    for (const [team, players, cg] of [[t.names.orange, t.orange, t.clueGivers.orange], [t.names.teal, t.teal, t.clueGivers.teal]] as const) {
      await expect(sheet(page).getByRole('group', { name: team, exact: true })).toBeVisible();
      for (const p of players) expect(await pressed(playerButton(page, team, p)), `${p} selected = clue giver`).toBe(p === cg);
    }
    await expect(sheet(page).getByTestId('main-button')).toHaveText('Done');
  });

  test('SWD-007: tapping another player selects them; "Done" applies and the badge moves; nothing changes before "Done"', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    const other = t.orange[2]!;
    await open(page);
    await playerButton(page, t.names.orange, other).click();
    expect(await pressed(playerButton(page, t.names.orange, other))).toBe(true);
    expect(await pressed(playerButton(page, t.names.orange, t.clueGivers.orange!))).toBe(false);
    await sheet(page).getByTestId('main-button').click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await teamsOnScreen(page)).clueGivers).toEqual({ orange: other, teal: t.clueGivers.teal });
  });

  test('SWD-014: each player row has the switch "Doesn\'t give clues" (`role="switch"`, off by default, accessible name "Riya: doesn\'t give clues") and the small line "Plays as a guesser only. Good for small kids."', async ({ page }) => {
    await toTeams(page);
    await open(page);
    for (const n of NAMES) {
      await expect(guessOnlySwitch(page, n)).toHaveAttribute('aria-checked', 'false');
    }
    await expect(sheet(page).getByText('Plays as a guesser only. Good for small kids.', { exact: true }).first()).toBeVisible();
    await expect(sheet(page).getByText('Two people give the clues together.', { exact: true }).first()).toBeVisible();
    await expect(sheet(page).getByRole('button', { name: 'Add a partner', exact: true }).first()).toBeVisible();
  });

  test('SWD-014: turning it on for the current clue giver makes the next eligible player the clue giver; on "Done" Make teams shows "Doesn\'t give clues" under that name; their button is disabled in the sheet', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    const cg = t.clueGivers.orange!;
    await open(page);
    await guessOnlySwitch(page, cg).click();
    await expect(guessOnlySwitch(page, cg)).toHaveAttribute('aria-checked', 'true');
    await expect(playerButton(page, t.names.orange, cg)).toBeDisabled();
    expect(await pressed(playerButton(page, t.names.orange, t.orange[1]!)), 'the next eligible player is selected').toBe(true);
    await sheet(page).getByTestId('main-button').click();
    const after = await teamsOnScreen(page);
    expect(after.clueGivers.orange).toBe(t.orange[1]);
    expect(after.guessOnly).toEqual([cg]);
    await expect(page.getByTestId('guess-only-tag')).toHaveText("Doesn't give clues");
  });

  test('SWD-014: a team\'s last eligible player\'s switch is disabled, with "Each team needs someone who can give clues." under that team\'s group', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    await open(page);
    await guessOnlySwitch(page, t.teal[0]!).click();
    await guessOnlySwitch(page, t.teal[1]!).click();
    await expect(guessOnlySwitch(page, t.teal[2]!)).toBeDisabled();
    await expect(sheet(page).getByText('Each team needs someone who can give clues.', { exact: true })).toBeVisible();
  });

  test('SWD-014: a move that leaves a team with no eligible player shows "Each team needs someone who can give clues." on Make teams and disables "Next"', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    await open(page);
    await guessOnlySwitch(page, t.teal[0]!).click();
    await guessOnlySwitch(page, t.teal[1]!).click();
    await sheet(page).getByTestId('main-button').click();
    await waitGuards(page);
    await moveButton(page, t.teal[2]!, t.names.orange).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Each team needs someone who can give clues.' })).toBeVisible();
    await expect(mainText(page, 'Next')).toBeDisabled();
  });

  test('SWD-130: with two "Doesn\'t give clues" players on one team, "Shuffle teams" accepts only a draw whose teams differ by at most 1 such player and that is not the split on screen', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    const go = [t.orange[0]!, t.orange[1]!];
    await open(page);
    for (const g of go) await guessOnlySwitch(page, g).click();
    await sheet(page).getByTestId('main-button').click();
    const now = await teamsOnScreen(page);
    expect(now.clueGivers.orange).toBe(firstEligible(now.orange, go));
    expect(now.guessOnly.sort()).toEqual([...go].sort());
    await waitGuards(page);
    await quiet(page, 'Shuffle teams').click();
    const k = drawSplit(NAMES, SEED, 1).k;
    const expected = drawSplit(NAMES, SEED, k + 1, { guessOnly: go, now: { orange: t.orange, teal: t.teal } });
    const after = await expectSplit(page, expected.split, 'fair shuffle');
    const count = (team: string[]) => team.filter((p) => go.includes(p)).length;
    if (expected.k < 10) expect(Math.abs(count(after.orange) - count(after.teal))).toBeLessThanOrEqual(1);
    expect(after.clueGivers).toEqual({ orange: firstEligible(expected.split.orange, go), teal: firstEligible(expected.split.teal, go) });
  });
});

// ---------------------------------------------------------------- S3 How do you want to play?

const PHONES = [
  ['One phone', 'Pass it to the clue giver to see the map. About 25 min a game.', 'pass'],
  ['Two phones', 'One more phone, shared by both clue givers. About 15 min a game.', 'shared'],
  ['Three phones', 'One more phone for each clue giver. About 15 min a game.', 'own'],
] as const;
const phoneCard = (page: Page, title: string) => page.getByRole('button', { name: title, exact: true });
const LINE = {
  full: '9 and 8 words to find, 7 blank, 1 Landmine.', easy: '6 and 5 words to find, 5 blank, no Landmine.',
  lose: 'Step on it and your team loses.', turn: 'Step on it and your turn ends; the other team gets one word free.',
  family: 'Words kids and grandparents know.', harder: 'Adds words kids or elders may not know.',
};

test.describe('S3 How do you want to play? (SWD-009, SWD-066, SWD-119)', () => {
  test('SWD-009: three phone cards in order, each named by its title and described by its text; "Recommended" sits inside "Two phones" between title and text; none selected the first time', async ({ page }) => {
    await toChoices(page);
    await expect(group(page, 'How many phones?')).toBeVisible();
    for (const [title, text] of PHONES) {
      const card = phoneCard(page, title);
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(text);
      await expect(card).toHaveAccessibleDescription(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      expect(await pressed(card), `${title} not selected`).toBe(false);
    }
    const lines = (await phoneCard(page, 'Two phones').innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(['Two phones', 'Recommended', PHONES[1][1]]);
    await expect(phoneCard(page, 'Two phones').getByTestId('recommended')).toHaveText('Recommended');
    await expect(page.getByTestId('recommended')).toHaveCount(1);
    const ys = [];
    for (const [title] of PHONES) ys.push((await box(phoneCard(page, title))).y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  test('SWD-009 / SWD-119: "Start the game" is disabled until a phones card is tapped, with `start-hint` "Pick how many phones to start." directly above it', async ({ page }) => {
    await toChoices(page);
    const start = mainText(page, 'Start the game');
    await expect(start).toBeDisabled();
    const hint = page.getByTestId('start-hint');
    await expect(hint).toHaveText('Pick how many phones to start.');
    const [h, m] = [await box(hint), await box(start)];
    expect(h.y + h.height, 'above the main button').toBeLessThanOrEqual(m.y + 1);
    expect(m.y - (h.y + h.height), 'directly above').toBeLessThanOrEqual(32);
    await phoneCard(page, 'One phone').click();
    await expect(start).toBeEnabled();
    await expect(hint).toHaveCount(0);
  });

  test('SWD-009: the three cards are equal (±1 px); stacked full width in portrait and at 568 × 320, side by side at 812 × 375', async ({ page }) => {
    for (const size of SIZES) {
      await toChoices(page, { viewport: size });
      const boxes = [];
      for (const [title] of PHONES) boxes.push(await box(phoneCard(page, title)));
      for (const b of boxes) {
        expect(Math.abs(b.width - boxes[0]!.width), `${size.width} × ${size.height}: equal width`).toBeLessThanOrEqual(1);
        expect(Math.abs(b.height - boxes[0]!.height), `${size.width} × ${size.height}: equal height`).toBeLessThanOrEqual(1);
      }
      if (size.width === 812) {
        expect(boxes.map((b) => Math.round(b.y)), 'side by side: one row').toEqual([Math.round(boxes[0]!.y), Math.round(boxes[0]!.y), Math.round(boxes[0]!.y)]);
        expect(boxes[0]!.x).toBeLessThan(boxes[1]!.x);
        expect(boxes[1]!.x).toBeLessThan(boxes[2]!.x);
      } else {
        expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
        expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
        for (const b of boxes) expect(Math.abs(b.width - (size.width - 32)), `${size.width} × ${size.height}: full width`).toBeLessThanOrEqual(2);
      }
    }
  });

  test('SWD-009: four groups; each shows only its chosen option\'s line; Easy has no Landmine group, and the Landmine choice is kept while Easy is chosen', async ({ page }) => {
    await toChoices(page);
    for (const g of ['How many phones?', 'Board', 'Landmine', 'Words']) await expect(group(page, g)).toBeVisible();
    const board = group(page, 'Board'), words = group(page, 'Words'), landmine = group(page, 'Landmine');
    expect(await pressed(board.getByRole('button', { name: 'Full: 25 words', exact: true })), 'Full is the default').toBe(true);
    expect(await pressed(words.getByRole('button', { name: 'Whole family', exact: true })), 'Whole family is the default').toBe(true);
    await expect(board).toContainText(LINE.full);
    await expect(board).not.toContainText(LINE.easy);
    await expect(words).toContainText(LINE.family);
    await expect(words).not.toContainText(LINE.harder);
    await choose(page, { landmine: 'Lose the game' });
    await expect(landmine).toContainText(LINE.lose);
    await expect(landmine).not.toContainText(LINE.turn);
    await choose(page, { board: 'Easy: 16 words' });
    await expect(board).toContainText(LINE.easy);
    await expect(board).not.toContainText(LINE.full);
    await expect(group(page, 'Landmine')).toHaveCount(0);
    await choose(page, { board: 'Full: 25 words', words: '+ Harder words' });
    await expect(words).toContainText(LINE.harder);
    expect(await pressed(group(page, 'Landmine').getByRole('button', { name: 'Lose the game', exact: true })), 'the Landmine choice was kept while Easy was chosen').toBe(true);
  });

  test('SWD-119: the Landmine default is "Lose your turn" with Whole family and "Lose the game" with + Harder words, following Words until the host taps a Landmine option', async ({ page }) => {
    await toChoices(page);
    const turn = group(page, 'Landmine').getByRole('button', { name: 'Lose your turn', exact: true });
    const lose = group(page, 'Landmine').getByRole('button', { name: 'Lose the game', exact: true });
    expect(await pressed(turn)).toBe(true);
    await choose(page, { words: '+ Harder words' });
    expect(await pressed(lose), 'follows + Harder words').toBe(true);
    await choose(page, { words: 'Whole family' });
    expect(await pressed(turn), 'follows Whole family again').toBe(true);
    await choose(page, { landmine: 'Lose your turn' });
    await choose(page, { words: '+ Harder words' });
    expect(await pressed(turn), 'the host chose: Words no longer changes it').toBe(true);
  });

  test('SWD-119: with 9 or more players `big-group-hint` "Big group? The Easy board is easier to read." shows under the Board group; with 8 it does not', async ({ page }) => {
    await toChoices(page, { names: NAMES.concat(['Sunita', 'Nana']).slice(0, 8) });
    await expect(page.getByTestId('big-group-hint')).toHaveCount(0);
    await toChoices(page, { names: NAMES.concat(['Sunita', 'Nana']).slice(0, 9) });
    const hint = page.getByTestId('big-group-hint');
    await expect(hint).toHaveText('Big group? The Easy board is easier to read.');
    expect((await box(hint)).y).toBeGreaterThan((await box(group(page, 'Board'))).y);
  });

  test('SWD-009 (v3.6): quiet "How to play", full width and 48 px tall, directly under the heading; "Done" returns with every choice as it was, and "Start the game" waits its 800 ms again', async ({ page }) => {
    await toChoices(page);
    await choose(page, { phones: 'Three phones', board: 'Easy: 16 words', words: '+ Harder words' });
    const how = quiet(page, 'How to play');
    const [h1, b] = [await box(heading(page, 'How do you want to play?')), await box(how)];
    expect(Math.round(b.height)).toBe(48);
    expect(Math.abs(b.width - (390 - 32)), 'full width').toBeLessThanOrEqual(2);
    expect(b.y).toBeGreaterThanOrEqual(h1.y + h1.height - 1);
    expect(b.y - (h1.y + h1.height), 'directly under the heading').toBeLessThanOrEqual(40);
    await how.click();
    await expect(heading(page, 'How to play')).toBeVisible();
    await waitGuards(page);
    await freezeClock(page);
    await mainButton(page).filter({ hasText: /^Done$/ }).click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    expect(await pressed(phoneCard(page, 'Three phones'))).toBe(true);
    expect(await pressed(group(page, 'Board').getByRole('button', { name: 'Easy: 16 words', exact: true }))).toBe(true);
    expect(await pressed(group(page, 'Words').getByRole('button', { name: '+ Harder words', exact: true }))).toBe(true);
    const start = mainText(page, 'Start the game');
    await expect(start, 'looks live at once (v3.8)').not.toHaveAttribute('aria-disabled', 'true');
    await expect(start).toHaveCSS('opacity', '1');
    await page.clock.runFor(400);
    await start.click({ force: true });
    await expect(heading(page, 'How do you want to play?'), 'a tap inside the guard does nothing').toBeVisible();
    await page.clock.runFor(500);
    await expect(start).not.toHaveAttribute('aria-disabled', 'true');
    await expect(start).toHaveCSS('opacity', '1');
  });

  test('SWD-009: "← Back" returns to Make teams with the teams kept', async ({ page }) => {
    await toTeams(page);
    const before = await teamsOnScreen(page);
    await mainText(page, 'Next').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, 'Make teams')).toBeVisible();
    expect(await teamsOnScreen(page)).toEqual(before);
  });

  test('SWD-009 / SWD-010: "Start the game" in a new evening opens "Read this aloud" and deals nothing yet; "Let\'s play" creates the game night and records `deal` with the seeded board and the chosen choices', async ({ page }) => {
    await toReadAloud(page, { choose: { phones: 'Three phones' } });
    expect(await savedNights(page), 'nothing saved before "Let\'s play"').toHaveLength(0);
    await mainText(page, "Let's play").click();
    await expect.poll(async () => (await savedNights(page)).length).toBe(1);
    const [night] = await savedNights(page);
    expect(night.status).toBe('in-progress');
    expect(night.setup.config.players).toEqual(NAMES);
    expect(night.setup.config.choices).toMatchObject({ map: 'own', board: 'full', landmine: 'turn', words: 'family' });
    expect(night.setup.seeds.deal).toBe('deal-a');
    expect(night.records[0].move).toEqual({ type: 'deal', code: CODE });
    expect(night.setup.config.teams.orange.concat(night.setup.config.teams.teal).sort()).toEqual([...NAMES].sort());
  });

  for (const [title, , map] of PHONES) {
    test(`SWD-009: "${title}" is saved as choices.map = '${map}'`, async ({ page }) => {
      await toReadAloud(page, { choose: { phones: title } });
      await mainText(page, "Let's play").click();
      await expect.poll(async () => (await savedNights(page)).length).toBe(1);
      expect((await savedNights(page))[0].setup.config.choices.map).toBe(map);
    });
  }

  test('SWD-009 / SWD-066: Two phones, Easy and + Harder words are saved and the next evening starts from them ("Same as last time" under the heading); a first-time phone shows no such line', async ({ page }) => {
    const board = codeFor('easy', 'grownups', 0, 0);
    await toChoices(page, { boards: [board] });
    await expect(page.getByText('Same as last time', { exact: true })).toHaveCount(0);
    await choose(page, { phones: 'Two phones', board: 'Easy: 16 words', words: '+ Harder words' });
    await mainText(page, 'Start the game').click();
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    await waitGuards(page);
    await mainText(page, "Let's play").click();
    await expect.poll(async () => (await savedNights(page)).length).toBe(1);
    await page.goto('./');
    await waitGuards(page);
    await toPicker(page);
    await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    await page.getByRole('dialog', { name: 'Start a new game night?' }).getByRole('button', { name: 'Start new (ends that one)', exact: true }).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    await expect(page.getByText('Same as last time', { exact: true })).toBeVisible();
    expect(await pressed(phoneCard(page, 'Two phones'))).toBe(true);
    expect(await pressed(group(page, 'Board').getByRole('button', { name: 'Easy: 16 words', exact: true }))).toBe(true);
    expect(await pressed(group(page, 'Words').getByRole('button', { name: '+ Harder words', exact: true }))).toBe(true);
    await expect(mainText(page, 'Start the game')).toBeEnabled();
  });

  test('SWD-009 / SWD-010: when a Secret Words game was already dealt in this session, "Start the game" deals at once and does not open "Read this aloud"', async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + H, storage: { 'pgn.test.seeds': { deal: 'deal-b', teams: 'teams-b', boards: [CODE] } } });
    await toPicker(page);
    await page.getByRole('button', { name: /^Secret Words/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    await waitGuards(page);
    await phoneCard(page, 'Two phones').click();
    await waitGuards(page);
    await mainText(page, 'Start the game').click();
    await expect(heading(page, 'Read this aloud')).toHaveCount(0);
    await expect.poll(async () => (await savedNights(page)).length).toBe(2);
    const fresh = (await savedNights(page)).find((g) => g.id !== 'sw-fixture-v1-ended')!;
    expect(fresh.records[0].move.type).toBe('deal');
  });
});

// ---------------------------------------------------------------- S4 Read this aloud

const LINE2 = "Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon.";
const LINE3 = 'Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends.';
async function readLines(page: Page): Promise<string[]> {
  return page.locator('ol li').evaluateAll((els) => els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

test.describe('S4 Read this aloud (SWD-010)', () => {
  test('four numbered lines with the evening\'s team names; "Let\'s play" and "Show me the board first"; no "← Back" needed to leave', async ({ page }) => {
    await toTeams(page);
    const t = await teamsOnScreen(page);
    await mainText(page, 'Next').click();
    await waitGuards(page);
    await choose(page, { phones: 'Two phones', landmine: 'Lose the game' });
    await mainText(page, 'Start the game').click();
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    expect(await readLines(page)).toEqual([
      `Two teams, ${t.names.orange} and ${t.names.teal}. Each has a clue giver who sees the secret map.`,
      LINE2, LINE3, 'Find all your words first. Step on the Landmine and you lose!',
    ]);
    await expect(mainText(page, "Let's play")).toBeVisible();
    await expect(quiet(page, 'Show me the board first')).toBeVisible();
    await expect(quiet(page, '← Back')).toBeVisible();
  });

  test('line 4 follows the choices: "Lose your turn" and Easy have their own wording', async ({ page }) => {
    await toReadAloud(page, { choose: { landmine: 'Lose your turn' } });
    expect((await readLines(page))[3]).toBe('Find all your words first. Step on the Landmine and your turn ends!');
    await toReadAloud(page, { choose: { board: 'Easy: 16 words' }, boards: [codeFor('easy', 'family')] });
    expect((await readLines(page))[3]).toBe('Find all your words first!');
  });

  test('"← Back" returns to the choices', async ({ page }) => {
    await toReadAloud(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
  });

  test('"Show me the board first" deals (records `deal`) and leaves the screen', async ({ page }) => {
    await toReadAloud(page);
    await quiet(page, 'Show me the board first').click();
    await expect.poll(async () => (await savedNights(page)).length).toBe(1);
    expect((await savedNights(page))[0].records[0].move).toEqual({ type: 'deal', code: CODE });
    await expect(heading(page, 'Read this aloud')).toHaveCount(0);
  });

  test('SWD-010 (v3.7): with Larger text off `larger-text-hint` "Small text? Turn on Larger text in Settings." shows under the lines, "Settings" is a link, and Settings\' "← Back" returns to Read this aloud as it was', async ({ page }) => {
    await toReadAloud(page);
    const hint = page.getByTestId('larger-text-hint');
    await expect(hint).toHaveText('Small text? Turn on Larger text in Settings.');
    await expect(hint.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
    const lines = await readLines(page);
    expect((await box(hint)).y, 'under the numbered lines').toBeGreaterThan((await box(page.locator('ol li').last())).y);
    await hint.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(heading(page, 'Settings')).toBeVisible();
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    expect(await readLines(page)).toEqual(lines);
    await expect(hint).toBeVisible();
  });

  test('SWD-010 (v3.7): with Larger text on the hint is absent', async ({ page }) => {
    await toReadAloud(page, { larger: true });
    await expect(page.getByTestId('larger-text-hint')).toHaveCount(0);
    await expect(page.getByText(/Small text\?/)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- S5 How to play

const RULES = [
  'Clue givers see the secret map. Everyone else sees only the words.',
  'A clue is one word and one number. It must be about meaning, not spelling or where a word sits.',
  'No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed.',
  'Guessers take at least one guess, and up to the number plus one. 0 or ∞: as many as you like.',
  "Your word: keep going. Nobody's word or the other team's: your turn ends. The Landmine: you lose!",
  'First team to find all its words wins.',
  'Keep the host phone on the table: it shows the board.',
];
const CLUE_RULES = [
  'One word only. Names like Taj Mahal count as one.',
  "About meaning: no spelling, no rhymes, no 'top left'.",
  "Not a word on the board, or a form or part of one (no 'rail' while Railway is face down). Letters inside another word are fine (Pan with Japan).",
  "English, or a word you'd use in English (chai, dosa).",
];
const CREDIT = 'Secret Words uses game rules inspired by Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or endorsed by Czech Games Edition.';
/** The items of the first `ol` after the h2 with this text, in document order. */
async function listAfter(page: Page, h2: string): Promise<string[] | null> {
  return page.evaluate((h2) => {
    const all = [...document.querySelectorAll('h2, ol')];
    const i = all.findIndex((e) => e.tagName === 'H2' && (e.textContent ?? '').trim() === h2);
    const ol = i < 0 ? undefined : all.slice(i + 1).find((e) => e.tagName === 'OL');
    return ol ? [...ol.querySelectorAll('li')].map((li) => (li.textContent ?? '').replace(/\s+/g, ' ').trim()) : null;
  }, h2);
}
async function toHowToPlay(page: Page, o: Boot & { choose?: Parameters<typeof choose>[1] } = {}) {
  await toChoices(page, o);
  if (o.choose) await choose(page, o.choose);
  await quiet(page, 'How to play').click();
  await expect(heading(page, 'How to play')).toBeVisible();
  await waitGuards(page);
}

test.describe('S5 How to play (SWD-011, SWD-131)', () => {
  test('h1 "How to play"; h2 "Read this aloud" with its 4 lines, h2 "The rules" with 7, h2 "Clue rules" with 4, in that order, then the `credit` line; main "Done"', async ({ page }) => {
    await toHowToPlay(page, { choose: { landmine: 'Lose the game' } });
    const order = await page.evaluate(() => [...document.querySelectorAll('h1, h2')].map((h) => (h.textContent ?? '').trim()));
    expect(order.filter((t) => ['How to play', 'Read this aloud', 'The rules', 'Clue rules'].includes(t))).toEqual(['How to play', 'Read this aloud', 'The rules', 'Clue rules']);
    const aloud = await listAfter(page, 'Read this aloud');
    expect(aloud).toHaveLength(4);
    expect(aloud![1]).toBe(LINE2);
    expect(aloud![2]).toBe(LINE3);
    expect(await listAfter(page, 'The rules')).toEqual(RULES);
    expect(await listAfter(page, 'Clue rules')).toEqual(CLUE_RULES);
    const credit = page.getByTestId('credit');
    await expect(credit).toHaveText(CREDIT);
    const clue = await box(page.getByRole('heading', { level: 2, name: 'Clue rules', exact: true }));
    expect((await box(credit)).y, '`credit` after "Clue rules"').toBeGreaterThan(clue.y);
    await expect(mainButton(page)).toHaveText('Done');
  });

  test('rule 5 follows the Landmine choice: "Lose your turn" and Easy have their own wording', async ({ page }) => {
    await toHowToPlay(page, { choose: { landmine: 'Lose your turn' } });
    expect((await listAfter(page, 'The rules'))![4]).toBe("Your word: keep going. Nobody's word or the other team's: your turn ends. The Landmine: your turn ends and the other team gets a word free.");
    await toHowToPlay(page, { choose: { board: 'Easy: 16 words' }, boards: [codeFor('easy', 'family')] });
    expect((await listAfter(page, 'The rules'))![4]).toBe("Your word: keep going. Nobody's word or the other team's: your turn ends.");
  });

  test('the page may scroll to the end; "Done" is pinned and returns to the choices', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await toHowToPlay(page, { viewport: { width: 320, height: 568 } });
    await page.evaluate(() => window.scrollTo(0, 1e6));
    const credit = await box(page.getByTestId('credit'));
    const done = await box(mainButton(page));
    expect(done.y + done.height, '"Done" within the screen').toBeLessThanOrEqual(568 + 1);
    expect(credit.y + credit.height, 'the last line scrolls fully above the pinned button').toBeLessThanOrEqual(done.y + 1);
    await mainButton(page).click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
  });
});

// ---------------------------------------------------------------- The five sizes, Larger text off and on; small lines

test.describe('Setup screens at every size (Terms: screen sizes, landscape main button, no sideways scrolling)', () => {
  for (const size of SIZES) {
    for (const larger of [false, true]) {
      test(`${size.width} × ${size.height}, Larger text ${larger ? 'on' : 'off'}: S1 to S5 do not scroll sideways, keep the main button on screen, and in landscape put it 358 × 60 at the bottom right`, async ({ page }) => {
        const check = async (where: string, main: string | RegExp) => {
          await noSidewaysScroll(page, where);
          const m = await box(mainButton(page).filter({ hasText: main }));
          expect(m.y + m.height, `${where}: main button on screen`).toBeLessThanOrEqual(size.height + 1);
          expect(m.x, `${where}: main button on screen (left)`).toBeGreaterThanOrEqual(-1);
          if (size.width > size.height) {
            expect(Math.round(m.width), `${where}: landscape main width`).toBe(358);
            expect(Math.round(m.height), `${where}: landscape main height`).toBe(60);
            expect(Math.round(size.width - (m.x + m.width)), `${where}: 16 px from the right`).toBe(16);
            expect(Math.round(size.height - (m.y + m.height)), `${where}: 16 px from the bottom`).toBe(16);
          }
        };
        await toNames(page, { viewport: size, larger });
        await typeNames(page, NAMES);
        await check("Who's playing?", /^Next$/);
        await mainText(page, 'Next').click();
        await expect(heading(page, 'Make teams')).toBeVisible();
        await waitGuards(page);
        await check('Make teams', /^Next$/);
        await mainText(page, 'Next').click();
        await expect(heading(page, 'How do you want to play?')).toBeVisible();
        await waitGuards(page);
        await phoneCard(page, 'Two phones').click();
        await check('Choices', /^Start the game$/);
        await quiet(page, 'How to play').click();
        await expect(heading(page, 'How to play')).toBeVisible();
        await waitGuards(page);
        await check('How to play', /^Done$/);
        await mainButton(page).click();
        await waitGuards(page);
        await mainText(page, 'Start the game').click();
        await expect(heading(page, 'Read this aloud')).toBeVisible();
        await waitGuards(page);
        await check('Read this aloud', /^Let's play$/);
      });
    }
  }

  test('SWD-004 / SWD-009: Make teams with 20 names at 320 × 568 scrolls as a page while the main button stays where it is', async ({ page }) => {
    await toNames(page, { viewport: { width: 320, height: 568 } });
    await typeNames(page, Array.from({ length: 20 }, (_, i) => `Player${i + 1}`));
    await mainText(page, 'Next').click();
    await expect(heading(page, 'Make teams')).toBeVisible();
    await waitGuards(page);
    const top = await box(mainText(page, 'Next'));
    await page.evaluate(() => window.scrollTo(0, 1e6));
    const bottom = await box(mainText(page, 'Next'));
    expect(Math.round(bottom.y), 'fixed while the page scrolls').toBe(Math.round(top.y));
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight > window.innerHeight), 'the page scrolls').toBe(true);
    await noSidewaysScroll(page, 'Make teams, 20 names');
  });
});

test.describe('Version 3.7 P10: every small line uses `--text` with at least 4.5:1 contrast', () => {
  test('Make teams, Choices, Read this aloud and How to play small lines', async ({ page }) => {
    await toTeams(page, { names: NAMES.concat(['Sunita', 'Nana']) });
    const lines: [string, Locator][] = [
      ['"Tap a name to move it to the other team."', page.getByText('Tap a name to move it to the other team.', { exact: true })],
      ['"Orange team"', page.getByText('Orange team', { exact: true })],
    ];
    for (const [what, l] of lines) {
      const c = await smallLineColour(page, l);
      expect(c.mine, `${what} is in --text`).toBe(c.text);
      expect(c.ratio, `${what} contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await mainText(page, 'Next').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
    const choices: [string, Locator][] = [
      ['start-hint', page.getByTestId('start-hint')],
      ['big-group-hint', page.getByTestId('big-group-hint')],
      ['"Recommended"', page.getByTestId('recommended')],
      ['the Board line', group(page, 'Board').getByText(LINE.full, { exact: true })],
    ];
    for (const [what, l] of choices) {
      const c = await smallLineColour(page, l);
      expect(c.mine, `${what} is in --text`).toBe(c.text);
      expect(c.ratio, `${what} contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await waitGuards(page);
    await phoneCard(page, 'Two phones').click();
    await waitGuards(page);
    await mainText(page, 'Start the game').click();
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    const hint = await smallLineColour(page, page.getByTestId('larger-text-hint'));
    expect(hint.mine, 'larger-text-hint is in --text').toBe(hint.text);
    expect(hint.ratio).toBeGreaterThanOrEqual(4.5);
  });
});
