// Impostor setup screens (C1/C2, specs/impostor/01-setup.md and 08-room-host-and-teach.md), written 3 October 2026
// from the approved scenarios v2.2: IMP-003 to IMP-009, IMP-070, IMP-071, IMP-088. Every text, name and test id is
// the one in specs/impostor/README.md (Terms, Canonical strings, Test hooks).
// Expected to fail (not built yet): tests marked `test.fail` need the round result (the next lane).
import { expect, test, type Locator, type Page } from './fixtures';
import { HOME, expectOneMainButton, hasMainLook, hostAGame, isOutlined } from './helpers';
import {
  CATEGORIES, P4, SAMOSA, TZ, T0, addPlayers, dealAll, doneButton, exact, hold, holdPad, imButton, impostorCard,
  mainButton, menuButton, onlyEvening, option, overlapping, passName, phoneWith, playerField, reveal, roundMoves, savedEvening,
  startEvening, toPicker, freezeClock, type Move,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const START: Move = { type: 'startDeal', practice: false };
const H = 3600_000;
const addButton = (page: Page) => page.getByRole('button', { name: 'Add', exact: true });
const nextButton = (page: Page) => page.getByRole('button', { name: 'Next', exact: true });
const backButton = (page: Page) => page.getByRole('button', { name: /^(← )?Back$/ });
const clearList = (page: Page) => page.getByRole('button', { name: 'Clear list', exact: true });
const removeButtons = (page: Page) => page.getByRole('button', { name: /^Remove / });
const alertWith = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text });
const whoHeading = (page: Page) => page.getByRole('heading', { name: "Who's playing?" });
const choicesHeading = (page: Page) => page.getByRole('heading', { name: 'How do you want to play?' });
const categoriesRow = (page: Page) => page.getByRole('button', { name: /^Categories: / });
const cardHeading = (page: Page) => page.getByRole('heading', { name: 'Read this aloud' });

/** IMP-003: the list, in seat order, read from the rows' "Remove <Name>" buttons from top to bottom. */
async function expectList(page: Page, names: string[]) {
  await expect(removeButtons(page)).toHaveCount(names.length);
  let lastY = -Infinity;
  for (const n of names) {
    const b = await page.getByRole('button', { name: `Remove ${n}`, exact: true }).boundingBox();
    expect(b, `a row for ${n}`).not.toBeNull();
    expect(b!.y, `${n} comes after the row above it`).toBeGreaterThan(lastY);
    lastY = b!.y;
  }
}

/** Home → "Host a game" → the Impostor card → "Who's playing?". */
async function toWhosPlaying(page: Page) {
  await hostAGame(page).click();
  await impostorCard(page).click();
  await expect(whoHeading(page)).toBeVisible();
}

/** An ended Impostor evening (one counted round) in the given session, its last move at `endAt`. */
function endedEvening(id: string, players: string[], endAt: number, sessionId: string, choices = {}) {
  const moves = [...roundMoves(players, players[1]!, { caught: 'wrong' }, START), { type: 'endEvening' }];
  const gap = 20_000;
  return savedEvening({
    id, players, choices, status: 'ended', sessionId, gap, t0: endAt - gap * (moves.length - 1),
    deals: [{ wordId: SAMOSA, impostor: players[1]!, starter: players[0]! }], moves,
  });
}

/**
 * A first evening of tonight's session shows the read-aloud card and is left unfinished ("← Back"); then, from Home, the
 * Impostor card → "Start a new evening?" → "Start new" opens "Who's playing?" for a second evening of the same session.
 * Returns the first evening as saved.
 */
async function secondEveningOfTonight(page: Page): Promise<any> {
  await startEvening(page, { deal: false });
  const first = await onlyEvening(page);
  await backButton(page).click();
  await page.goto(HOME);
  await hostAGame(page).click();
  await impostorCard(page).click();
  const dialog = page.getByRole('dialog', { name: /Start a new evening\?/ });
  await expect(dialog).toBeVisible(); // its exact words: IMP-001's test below
  await dialog.getByRole('button', { name: 'Start new', exact: true }).click();
  await expect(whoHeading(page)).toBeVisible();
  if ((await removeButtons(page).count()) === 0) await addPlayers(page, P4);
  return first;
}

async function storageJson(page: Page, key: string): Promise<any> {
  return page.evaluate((k) => { const v = localStorage.getItem(k); return v === null ? null : JSON.parse(v); }, key);
}

test.describe('IMP-003: players are added in seat order, without dragging', () => {
  test('Add or Enter adds at the end; the field empties and keeps focus; names are trimmed', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await expect(page.getByText('Sit in a circle. This is the passing and clue order.', { exact: true })).toBeVisible();
    await expect(playerField(page)).toHaveAttribute('placeholder', 'Type a name…');
    await playerField(page).fill('  Riya  ');
    await addButton(page).click();
    await expect(playerField(page)).toHaveValue('');
    await expect(playerField(page)).toBeFocused();
    await playerField(page).fill('Arjun');
    await playerField(page).press('Enter');
    await expect(playerField(page)).toHaveValue('');
    await expect(playerField(page)).toBeFocused();
    await addPlayers(page, ['Meena', 'Kabir']);
    await expect(playerField(page)).toBeFocused();
    await expectList(page, P4);
  });

  test('each row has ▲, ▼ and ✕ of at least 44 × 44; row 1\'s ▲ and the last row\'s ▼ are disabled; ▲ ▼ move a player', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    for (const n of P4) {
      for (const name of [`Move ${n} up`, `Move ${n} down`, `Remove ${n}`]) {
        const b = await page.getByRole('button', { name, exact: true }).boundingBox();
        expect(b, name).not.toBeNull();
        expect(b!.width, `${name} width`).toBeGreaterThanOrEqual(44);
        expect(b!.height, `${name} height`).toBeGreaterThanOrEqual(44);
      }
    }
    await expect(page.getByRole('button', { name: 'Move Riya up', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Kabir down', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Riya down', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Move Meena up', exact: true }).click();
    await expectList(page, ['Riya', 'Meena', 'Arjun', 'Kabir']);
    await page.getByRole('button', { name: 'Move Riya down', exact: true }).click();
    await expectList(page, ['Meena', 'Riya', 'Arjun', 'Kabir']);
  });

  test('an empty or all-space name adds nothing; 16 characters at most', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await expect(addButton(page)).toBeDisabled();
    await playerField(page).fill('   ');
    await expect(addButton(page)).toBeDisabled();
    await playerField(page).press('Enter');
    await expect(removeButtons(page)).toHaveCount(0);
    await expect(playerField(page)).toHaveAttribute('maxlength', '16');
    await playerField(page).fill('');
    await playerField(page).pressSequentially('Abcdefghijklmnopq'); // 17 characters
    await expect(playerField(page)).toHaveValue('Abcdefghijklmnop');
  });

  test('a duplicate, ignoring case, is refused with the listed name until the field changes; the field stays as typed', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, ['Riya', 'Arjun', 'Meena']);
    await playerField(page).fill('riya');
    await addButton(page).click();
    const msg = alertWith(page, 'already playing');
    await expect(msg).toHaveText(exact('Riya is already playing. Add an initial, like Riya S.', []));
    await expect(playerField(page)).toHaveValue('riya');
    await expectList(page, ['Riya', 'Arjun', 'Meena']);
    await playerField(page).press('Enter');
    await expectList(page, ['Riya', 'Arjun', 'Meena']);
    await expect(msg).toBeVisible();
    await playerField(page).fill('riya S');
    await expect(msg).toHaveCount(0);
    await addButton(page).click();
    await expectList(page, ['Riya', 'Arjun', 'Meena', 'riya S']);
  });

  test('with 20 players "Add" is disabled and "20 players is the most."; Enter leaves the typed name in the field', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    const twenty = Array.from({ length: 20 }, (_, i) => `Player ${i + 1}`);
    await addPlayers(page, twenty.slice(0, 19));
    await expect(page.getByText('20 players is the most.', { exact: true })).toHaveCount(0);
    await addPlayers(page, twenty.slice(19));
    await playerField(page).fill('Zoya');
    await expect(addButton(page)).toBeDisabled();
    await expect(alertWith(page, '20 players is the most.')).toHaveText(exact('20 players is the most.', []));
    await playerField(page).press('Enter');
    await expect(playerField(page)).toHaveValue('Zoya');
    await expect(removeButtons(page)).toHaveCount(20);
  });

  test('under 3 players "Next" is disabled with "Add at least 3 players."; ✕ removes at once with no toast, even below 3', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await expect(nextButton(page)).toBeDisabled();
    await expect(alertWith(page, 'Add at least 3 players.')).toHaveText(exact('Add at least 3 players.', []));
    await addPlayers(page, ['Riya', 'Arjun']);
    await expect(nextButton(page)).toBeDisabled();
    await expect(alertWith(page, 'Add at least 3 players.')).toBeVisible();
    await addPlayers(page, ['Meena']);
    await expect(nextButton(page)).toBeEnabled();
    await expect(page.getByText('Add at least 3 players.', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    await expectList(page, ['Riya', 'Meena']);
    await expect(page.getByTestId('undo-toast')).toHaveCount(0);
    await expect(page.getByTestId('toast')).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await expect(alertWith(page, 'Add at least 3 players.')).toBeVisible();
  });

  test('text left in the field when "Next" is tapped is not added and is cleared; "← Back" keeps the list', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await playerField(page).fill('Zoya');
    await nextButton(page).click();
    await expect(choicesHeading(page)).toBeVisible();
    await backButton(page).click();
    await expect(whoHeading(page)).toBeVisible();
    await expectList(page, P4);
    await expect(playerField(page)).toHaveValue('');
  });

  test('"← Back" returns to "What shall we play?"; the list is kept when the host comes back in the same visit', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, ['Riya', 'Arjun']);
    await backButton(page).click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    await impostorCard(page).click();
    await expect(whoHeading(page)).toBeVisible();
    await expectList(page, ['Riya', 'Arjun']);
  });

  test('320 × 568, Larger text off and on: "Who\'s playing?" with four 16-character names: rows in full, 44 × 44 row buttons, nothing drawn over anything else, no sideways scrolling', async ({ page }) => {
    // The reviewer's layout check, 3 October 2026 (IMP-003 rows; IMP-081's "nothing over anything else" on setup).
    const LONG = ['Alexandrapetrova', 'Bhagyashreemani', 'Chandrashekharan', 'Dhananjayapillai'];
    for (const larger of [false, true]) {
      const where = larger ? 'Larger text' : 'Larger text off';
      await page.setViewportSize({ width: 320, height: 568 });
      await phoneWith(page, [], { now: T0, storage: larger ? { 'pgn.pref.largerText': true } : {} });
      await toWhosPlaying(page);
      await addPlayers(page, LONG);
      await playerField(page).fill('Ekaterinavolkova');
      expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= window.innerWidth), `${where}: no sideways scrolling`).toBe(true);
      await expectList(page, LONG);
      for (const n of LONG) {
        for (const name of [`Move ${n} up`, `Move ${n} down`, `Remove ${n}`]) {
          const b = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
          expect(Math.min(b.width, b.height), `${where}: "${name}" at least 44 × 44`).toBeGreaterThanOrEqual(44);
        }
        const shown = await page.getByText(n, { exact: true }).first().evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
        expect(shown, `${where}: ${n} shown in full`).toBe(true);
      }
      for (const l of [playerField(page), addButton(page), nextButton(page)]) {
        await l.scrollIntoViewIfNeeded();
        const b = (await l.boundingBox())!;
        expect(b.x >= -1 && b.x + b.width <= 321, `${where}: within the screen's width (${JSON.stringify(b)})`).toBe(true);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await overlapping(page), `${where}: nothing drawn over anything else (top)`).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 1e6));
      expect(await overlapping(page), `${where}: nothing drawn over anything else (bottom)`).toEqual([]);
    }
  });

  test('past names: the last 8 distinct names, newest game first, in seat order, case-insensitive; listed names are not offered', async ({ page }) => {
    const older = endedEvening('imp-past-1', ['Asha', 'Dev', 'Neel', 'Tara', 'Om'], T0 - 48 * H, 'session-past-1');
    const newer = endedEvening('imp-past-2', ['Riya', 'Arjun', 'Meena', 'Kabir', 'ASHA'], T0 - 24 * H, 'session-past-2');
    await phoneWith(page, [older, newer], { now: T0 });
    await toWhosPlaying(page);
    await expect(removeButtons(page)).toHaveCount(0); // no session tonight: the list starts empty (IMP-004)
    const offered = ['Riya', 'Arjun', 'Meena', 'Kabir', 'ASHA', 'Dev', 'Neel', 'Tara'];
    let lastPos = { y: -Infinity, x: -Infinity };
    for (const n of offered) {
      const b = page.getByRole('button', { name: n, exact: true });
      await expect(b, `"${n}" is offered`).toHaveCount(1);
      const box = (await b.boundingBox())!;
      const after = box.y > lastPos.y + 2 || (Math.abs(box.y - lastPos.y) <= 2 && box.x > lastPos.x);
      expect(after, `"${n}" comes after the name before it`).toBe(true);
      lastPos = { y: box.y, x: box.x };
    }
    await expect(page.getByRole('button', { name: 'Om', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Asha$/ })).toHaveCount(0); // shown once, as most recently typed
    await page.getByRole('button', { name: 'Meena', exact: true }).click();
    await page.getByRole('button', { name: 'Riya', exact: true }).click();
    await expectList(page, ['Meena', 'Riya']);
    await expect(page.getByRole('button', { name: 'Riya', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Meena', exact: true })).toHaveCount(0);
    await playerField(page).fill('Dev');
    await addButton(page).click();
    await expect(page.getByRole('button', { name: 'Dev', exact: true })).toHaveCount(0);
  });
});

test.describe('IMP-004: tonight\'s names arrive filled in', () => {
  test('tonight\'s last game\'s players, in its order, with "Clear list"; "List cleared · Undo" for 5 s restores them', async ({ page }) => {
    const tonight = endedEvening('imp-tonight', ['Riya', 'Arjun', 'Meena'], T0 - 30 * 60_000, 'session-tonight');
    await phoneWith(page, [tonight], { now: T0 });
    await toWhosPlaying(page);
    await expectList(page, ['Riya', 'Arjun', 'Meena']);
    await expect(clearList(page)).toBeVisible();
    expect(await isOutlined(clearList(page)), '"Clear list" is quiet').toBe(true);
    await freezeClock(page); // fake time only, so 4.8 s is exactly 4.8 s
    await clearList(page).click();
    await expect(removeButtons(page)).toHaveCount(0);
    const toast = page.getByTestId('undo-toast');
    await expect(toast).toHaveText(/^\s*List cleared ·\s*Undo\s*$/);
    await page.clock.runFor(4800);
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Undo', exact: true }).click();
    await expectList(page, ['Riya', 'Arjun', 'Meena']);
    await clearList(page).click();
    await expect(toast).toBeVisible();
    await page.clock.runFor(5200);
    await expect(toast).toHaveCount(0);
    await expect(removeButtons(page)).toHaveCount(0);
  });

  test('no session tonight: the list starts empty, and "Clear list" shows once a name is added', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await expect(removeButtons(page)).toHaveCount(0);
    await expect(clearList(page)).toHaveCount(0);
    await addPlayers(page, ['Riya']);
    await expect(clearList(page)).toBeVisible();
  });
});

test.describe('IMP-005: the four choices, with these defaults', () => {
  const GROUPS: [string, string, string, string, string][] = [
    ['Mode', 'Easy', 'Hard', 'The impostor gets the category and a hint.', 'The impostor gets nothing and never starts.'],
    ['Talking', 'Free flow', 'Timer', 'Talk as long as you like, then tap Vote now.', 'Two minutes to talk, then a chime.'],
    ['Score', 'No', 'Yes', 'Just play. We count catches and escapes.', 'Points every round, totals for the night.'],
    ['Words', 'Whole family', '+ Grown-ups', 'Words kids and grandparents know.', 'Adds words kids or elders may not know.'],
  ];

  async function toChoices(page: Page) {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await expect(choicesHeading(page)).toBeVisible();
  }

  test('first ever evening: Easy, Free flow, No, Whole family; one selected per group, never the main look; only its line shows', async ({ page }) => {
    await toChoices(page);
    for (const [group, first, second, firstLine, secondLine] of GROUPS) {
      const a = option(page, group, first), b = option(page, group, second);
      await expect(a, `${group}: ${first}`).toHaveAttribute('aria-pressed', 'true');
      await expect(b, `${group}: ${second}`).toHaveAttribute('aria-pressed', 'false');
      expect(await a.innerText(), `${group}: the selected option shows a ✓`).toContain('✓');
      expect(await b.innerText(), `${group}: the other option has no ✓`).not.toContain('✓');
      expect(await hasMainLook(a), `${group}: ${first} is not the main look`).toBe(false);
      expect(await hasMainLook(b), `${group}: ${second} is not the main look`).toBe(false);
      expect(await isOutlined(a), `${group}: ${first} has an outline`).toBe(true);
      await expect(page.getByText(firstLine, { exact: true })).toBeVisible();
      await expect(page.getByText(secondLine, { exact: true })).toBeHidden();
    }
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: all 9 ›\s*$/);
    await expectOneMainButton(page, 'How do you want to play?', 'Start round', true);
    await expect(mainButton(page)).toHaveText(exact('Start round'));
  });

  test('tapping the other option moves the selection and its line; tapping the selected one changes nothing', async ({ page }) => {
    await toChoices(page);
    for (const [group, first, second, firstLine, secondLine] of GROUPS) {
      await option(page, group, first).click();
      await expect(option(page, group, first)).toHaveAttribute('aria-pressed', 'true');
      await option(page, group, second).click();
      await expect(option(page, group, second)).toHaveAttribute('aria-pressed', 'true');
      await expect(option(page, group, first)).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByText(secondLine, { exact: true })).toBeVisible();
      await expect(page.getByText(firstLine, { exact: true })).toBeHidden();
      expect(await hasMainLook(option(page, group, second)), `${group}: ${second} is not the main look`).toBe(false);
    }
  });

  test('"← Back" returns to "Who\'s playing?" with the list unchanged', async ({ page }) => {
    await toChoices(page);
    await backButton(page).click();
    await expect(whoHeading(page)).toBeVisible();
    await expectList(page, P4);
  });
});

test.describe('IMP-007: categories, non-veg', () => {
  async function openSheet(page: Page): Promise<Locator> {
    await categoriesRow(page).click();
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
    return page.getByRole('switch');
  }
  const sw = (page: Page, name: string) => page.getByRole('switch', { name, exact: true });
  const done = (page: Page) => page.getByRole('button', { name: 'Done', exact: true });

  test('9 category switches, named and ordered exactly, all on; "Include non-veg food" off; 2 off → "Categories: 7 of 9 ›"', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    const switches = await openSheet(page);
    await expect(switches).toHaveCount(10);
    let lastY = -Infinity;
    for (const c of [...CATEGORIES, 'Include non-veg food']) {
      const box = (await sw(page, c).boundingBox())!;
      expect(box, `switch ${c}`).not.toBeNull();
      expect(box.y, `${c} comes after the switch above it`).toBeGreaterThan(lastY);
      lastY = box.y;
    }
    for (const c of CATEGORIES) await expect(sw(page, c), c).toBeChecked();
    await expect(sw(page, 'Include non-veg food')).not.toBeChecked();
    await expectOneMainButton(page, 'Categories sheet', 'Done', true);
    await sw(page, 'Food').click();
    await sw(page, 'Desi life').click();
    await expect(sw(page, 'Food')).not.toBeChecked();
    await done(page).click();
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: 7 of 9 ›\s*$/);
    await openSheet(page);
    await expect(sw(page, 'Food')).not.toBeChecked();
    await sw(page, 'Include non-veg food').click();
    await expect(sw(page, 'Include non-veg food')).toBeChecked();
    await done(page).click();
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: 7 of 9 ›\s*$/);
  });

  test('with one category left, its switch is disabled and "Keep at least one category." shows', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await openSheet(page);
    await expect(page.getByText('Keep at least one category.', { exact: true })).toHaveCount(0);
    for (const c of CATEGORIES.slice(0, 8)) await sw(page, c).click();
    const last = sw(page, 'Desi life');
    await expect(last).toBeChecked();
    await expect(last).toBeDisabled();
    await expect(page.getByText('Keep at least one category.', { exact: true })).toBeVisible();
    await sw(page, 'Food').click();
    await expect(last).toBeEnabled();
  });
});

test.describe('IMP-008 and IMP-009: taps to the first deal; choices from last time; tonight\'s session joined silently', () => {
  test('a later evening of tonight\'s session: after "Start new", "Next" → "Start round" is the first "Pass the phone to…", with no session question', async ({ page }) => {
    const first = await secondEveningOfTonight(page);
    await nextButton(page).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    await expect(page.getByLabel('Session name', { exact: true })).toHaveCount(0);
    const evenings = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pgn.game.')).map((k) => JSON.parse(localStorage.getItem(k)!)));
    const fresh = evenings.find((e: any) => e.gameType === 'impostor' && e.id !== first.id);
    expect(fresh, 'the new evening is saved').toBeTruthy();
    expect(fresh.sessionId, 'the new evening joins tonight\'s session').toBe(first.sessionId);
  });

  test('the first evening on a new phone: typed names, then "Next" → "Start round" → "Start the deal" is the first "Pass the phone to…"', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await mainButton(page).filter({ hasText: 'Start the deal' }).click();
    await expect(passName(page)).toBeVisible();
  });

  test('lastChoices opens with exactly those 6 choices; "Start round" writes the screen\'s choices back; a new session "Saturday 3 Oct" with no question', async ({ page }) => {
    const seven = CATEGORIES.filter((c) => c !== 'Food' && c !== 'Desi life');
    const last = { mode: 'hard', talking: 'timer', score: true, words: 'grownups', categories: seven, nonveg: true };
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.impostor.lastChoices': last } });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    for (const [g, o] of [['Mode', 'Hard'], ['Talking', 'Timer'], ['Score', 'Yes'], ['Words', '+ Grown-ups']] as const)
      await expect(option(page, g, o), `${g}: ${o}`).toHaveAttribute('aria-pressed', 'true');
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: 7 of 9 ›\s*$/);
    await categoriesRow(page).click();
    await expect(page.getByRole('switch', { name: 'Food', exact: true })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Desi life', exact: true })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Include non-veg food', exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await option(page, 'Words', 'Whole family').click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(cardHeading(page)).toBeVisible();
    await expect(page.getByLabel('Session name', { exact: true })).toHaveCount(0);
    const saved = await storageJson(page, 'pgn.pref.impostor.lastChoices');
    expect({ ...saved, categories: [...saved.categories].sort() }).toEqual({ ...last, words: 'family', categories: [...seven].sort() });
    const evening = await onlyEvening(page);
    const sess = await storageJson(page, `pgn.session.${evening.sessionId}`);
    expect(sess, 'the evening\'s session is saved').toBeTruthy();
    expect(sess.name).toBe('Saturday 3 Oct');
  });

  test('a phone that has never played opens with the IMP-005 defaults', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    for (const [g, o] of [['Mode', 'Easy'], ['Talking', 'Free flow'], ['Score', 'No'], ['Words', 'Whole family']] as const)
      await expect(option(page, g, o), `${g}: ${o}`).toHaveAttribute('aria-pressed', 'true');
  });
});

test('IMP-001: with an evening unfinished, the Impostor card asks "Start a new evening? The evening from 9:30 pm will be ended."', async ({ page }) => {
  await startEvening(page, { deal: false });
  await backButton(page).click();
  await page.goto(HOME);
  await hostAGame(page).click();
  await impostorCard(page).click();
  const dialog = page.getByRole('dialog', { name: /Start a new evening\?/ });
  await expect(dialog).toContainText(/^\s*Start a new evening\? The evening from 9:3\d pm will be ended\./);
  await expect(dialog.getByRole('button', { name: 'Start new', exact: true })).toBeVisible();
  await expectOneMainButton(page, 'Start new dialog', 'Carry on that evening', true);
});

test.describe('IMP-070: the read-aloud card, once a session', () => {
  test('heading, the 4 lines in an ordered list, "Start the deal" (main), "Practice round first" (quiet), no menu; records startDeal', async ({ page }) => {
    await startEvening(page, { deal: false });
    await expect(cardHeading(page)).toBeVisible();
    const items = page.locator('ol > li');
    await expect(items).toHaveText([
      'Everyone gets the same secret word, except the impostor.',
      "Take turns to say one word about it. Don't say the word!",
      'Then talk, and all point at who you think the impostor is.',
      'Impostor: blend in. Caught? Guess the word to steal the round.',
    ]);
    await expectOneMainButton(page, 'read-aloud card', 'Start the deal', true);
    await expect(mainButton(page)).toHaveText(exact('Start the deal'));
    const practice = page.getByRole('button', { name: 'Practice round first', exact: true });
    await expect(practice).toBeVisible();
    expect(await isOutlined(practice), '"Practice round first" is quiet').toBe(true);
    await expect(menuButton(page)).toHaveCount(0);
    expect((await onlyEvening(page)).records).toEqual([]);
    await mainButton(page).filter({ hasText: 'Start the deal' }).click();
    await expect(passName(page)).toBeVisible();
    expect((await onlyEvening(page)).records.map((r: any) => r.move)).toEqual([{ type: 'startDeal', practice: false }]);
  });

  test('"← Back" returns to "How do you want to play?" and the evening stays created (unfinished on Home)', async ({ page }) => {
    await startEvening(page, { deal: false });
    await backButton(page).click();
    await expect(choicesHeading(page)).toBeVisible();
    expect(await onlyEvening(page)).toBeTruthy();
    await page.goto(HOME);
    const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
    await expect(row).toContainText(/Impostor, 9:3\d pm, round 1/);
    await expect(row).toContainText('Tap to resume');
  });

  test('a later evening of the same session skips the card (the first evening left unfinished): "Start round" goes straight to the deal, recording startDeal', async ({ page }) => {
    const tonight = await secondEveningOfTonight(page);
    await nextButton(page).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    const evenings = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pgn.game.')).map((k) => JSON.parse(localStorage.getItem(k)!)));
    const fresh = evenings.find((e: any) => e.gameType === 'impostor' && e.id !== tonight.id);
    expect(fresh.records.map((r: any) => r.move)).toEqual([{ type: 'startDeal', practice: false }]);
  });
});

/** The practice chip is at the top left: in the left half and the top fifth of the screen. */
async function expectChipTopLeft(page: Page, where: string) {
  const chip = page.getByTestId('practice-chip');
  await expect(chip, where).toHaveText(exact('Practice', []));
  const box = (await chip.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x, `${where}: the chip is at the left`).toBeLessThan(vp.width / 2);
  expect(box.x + box.width, `${where}: the chip is in the left half`).toBeLessThanOrEqual(vp.width / 2);
  expect(box.y, `${where}: the chip is at the top`).toBeLessThan(vp.height / 5);
}

test.describe('IMP-071: practice round', () => {
  test('"Practice round first" records startDeal {practice: true}; the chip "Practice" is at the top left of the deal and clues screens', async ({ page }) => {
    await startEvening(page, { practice: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }] } });
    expect((await onlyEvening(page)).records.map((r: any) => r.move)).toEqual([{ type: 'startDeal', practice: true }]);
    await expectChipTopLeft(page, 'screen A');
    await imButton(page, 'Riya').click();
    await expect(holdPad(page)).toBeVisible();
    await expectChipTopLeft(page, 'screen B');
    await hold(page, 600);
    await doneButton(page).click();
    await dealAll(page, P4.slice(1));
    await expectChipTopLeft(page, 'clues screen');
  });

  test('after the practice result, "Next round" deals round 1 with no card and no chip; the practice result has no points', async ({ page }) => {
    await startEvening(page, { practice: true, score: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await toPicker(page);
    await expectChipTopLeft(page, 'picker');
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    await expectChipTopLeft(page, 'result');
    await expect(page.getByTestId('round-points')).toHaveCount(0);
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    await expect(page.getByTestId('practice-chip')).toHaveCount(0);
  });
});

test.describe('IMP-088: the choices screen at 320 × 568 and in landscape', () => {
  async function toChoicesAt(page: Page, width: number, height: number, larger = false) {
    await page.setViewportSize({ width, height });
    await phoneWith(page, [], { now: T0, storage: larger ? { 'pgn.pref.largerText': true } : {} });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await expect(choicesHeading(page)).toBeVisible();
  }
  const GROUP_NAMES = ['Mode', 'Talking', 'Score', 'Words'];
  const FIRST = { Mode: ['Easy', 'Hard'], Talking: ['Free flow', 'Timer'], Score: ['No', 'Yes'], Words: ['Whole family', '+ Grown-ups'] } as Record<string, [string, string]>;

  async function expectRows(page: Page, where: string) {
    for (const g of GROUP_NAMES) {
      const group = page.getByRole('group', { name: g, exact: true });
      const label = group.getByText(g, { exact: true }).first();
      const lb = (await label.boundingBox())!;
      const a = (await option(page, g, FIRST[g]![0]).boundingBox())!;
      const b = (await option(page, g, FIRST[g]![1]).boundingBox())!;
      expect(Math.abs((a.y + a.height / 2) - (b.y + b.height / 2)), `${where} ${g}: both options on one row`).toBeLessThanOrEqual(1);
      expect(Math.abs(a.width - b.width), `${where} ${g}: the options share the row equally`).toBeLessThanOrEqual(1);
      expect(a.height, `${where} ${g}: option height`).toBeGreaterThanOrEqual(48);
      expect(b.height, `${where} ${g}: option height`).toBeGreaterThanOrEqual(48);
      expect(a.x - lb.x, `${where} ${g}: the label takes a 64 px column`).toBeGreaterThanOrEqual(63);
      expect(a.x - lb.x, `${where} ${g}: the options start right after the 64 px label column`).toBeLessThanOrEqual(80);
      expect(lb.y + lb.height / 2, `${where} ${g}: the label is on the options' row`).toBeGreaterThanOrEqual(a.y);
      expect(lb.y + lb.height / 2, `${where} ${g}: the label is on the options' row`).toBeLessThanOrEqual(a.y + a.height);
    }
  }
  const fontSize = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const noPageScroll = (page: Page) => page.evaluate(() => {
    const s = document.scrollingElement!;
    return s.scrollHeight <= window.innerHeight && s.scrollWidth <= window.innerWidth;
  });

  test('390 × 844: each group is one row, label column then two equal options; option text 17 px', async ({ page }) => {
    await toChoicesAt(page, 390, 844);
    await expectRows(page, '390');
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text`).toBe(17);
  });

  test('320 × 568: one row per group, option text 15 px, and everything shows with no page scrolling', async ({ page }) => {
    await toChoicesAt(page, 320, 568);
    await expectRows(page, '320');
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![1])), `${g} option text`).toBe(15);
    expect(await noPageScroll(page), 'no page scrolling').toBe(true);
    for (const l of [...GROUP_NAMES.map((g) => page.getByRole('group', { name: g, exact: true })), categoriesRow(page), mainButton(page)])
      await expect(l).toBeInViewport({ ratio: 1 });
  });

  test('Larger text: option text 21 px (19 px at 320 wide); "Start round" stays fixed at the bottom', async ({ page }) => {
    await toChoicesAt(page, 390, 844, true);
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text, 390`).toBe(21);
    await page.setViewportSize({ width: 320, height: 568 });
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text, 320`).toBe(19);
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    const mb = (await mainButton(page).boundingBox())!;
    expect(568 - (mb.y + mb.height), '"Start round" is at the bottom').toBeLessThanOrEqual(24);
    await page.evaluate(() => { for (const el of Array.from(document.querySelectorAll('*'))) if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight; window.scrollTo(0, 1e6); });
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="main-button"]')!).position)).toMatch(/fixed|sticky/);
  });

  test('812 × 375: the four groups in a 2 × 2 grid, and "Start round" overlaps none of them', async ({ page }) => {
    await toChoicesAt(page, 812, 375);
    const boxes = [];
    for (const g of GROUP_NAMES) boxes.push((await page.getByRole('group', { name: g, exact: true }).boundingBox())!);
    const [m, t, s, w] = boxes as [any, any, any, any];
    expect(Math.abs(m.y - t.y), 'Mode and Talking share the first row').toBeLessThanOrEqual(1);
    expect(Math.abs(s.y - w.y), 'Score and Words share the second row').toBeLessThanOrEqual(1);
    expect(s.y, 'the second row is below the first').toBeGreaterThanOrEqual(m.y + m.height - 1);
    expect(Math.abs(m.x - s.x), 'the first column lines up').toBeLessThanOrEqual(1);
    expect(Math.abs(t.x - w.x), 'the second column lines up').toBeLessThanOrEqual(1);
    expect(t.x, 'the second column is right of the first').toBeGreaterThanOrEqual(m.x + m.width - 1);
    const mb = (await mainButton(page).boundingBox())!;
    for (const [i, b] of boxes.entries()) {
      const overlap = mb.x < b.x + b.width && b.x < mb.x + mb.width && mb.y < b.y + b.height && b.y < mb.y + mb.height;
      expect(overlap, `"Start round" overlaps ${GROUP_NAMES[i]}`).toBe(false);
    }
  });
});
