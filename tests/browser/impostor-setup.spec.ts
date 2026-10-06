// Impostor setup screens (C1/C2, specs/impostor/01-setup.md and 08-room-host-and-teach.md), written 3 October 2026
// from the approved scenarios v2.2 and updated 4 October 2026 to v3.5: IMP-003 to IMP-009, IMP-070, IMP-071, IMP-076,
// IMP-088. Every text, name and test id is the one in specs/impostor/README.md (Terms, Canonical strings, Test hooks).
// Impostor round 4 is built (main df8f362, 4 October 2026): no test here is marked expected-to-fail.
import { expect, test, type Locator, type Page } from './fixtures';
import { HOME, expectOneMainButton, hasMainLook, hostAGame, isOutlined } from './helpers';
import {
  CATEGORIES, P4, SAMOSA, TZ, T0, addPlayers, dealAll, doneButton, exact, hold, holdPad, imButton, impostorCard,
  mainButton, menuButton, onlyEvening, option, overlapping, passName, phoneWith, playerField, reveal, roundMoves, savedEvening,
  savedEvenings, startEvening, toPicker, freezeClock, type Move,
  aheadOfRound5,
  settle,
  aheadOfRound6,
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
/** The v2.2 read-aloud card, which v3.5 retires (IMP-070: "How to play" never opens by itself). */
const cardHeading = (page: Page) => page.getByRole('heading', { name: 'Read this aloud' });
const howToPlayButton = (page: Page) => page.getByRole('button', { name: 'How to play', exact: true });
const moreOptions = (page: Page) => page.getByRole('button', { name: 'More options ›', exact: true });
const sameAsLastTime = (page: Page) => page.getByText('Same as last time', { exact: true });

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
  await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
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
 * A first evening of tonight's session is started and left unfinished on its first deal (Home); then, from Home, the
 * Impostor card → "Start a new evening?" → "Start new" opens "Who's playing?" for a second evening of the same session.
 * Returns the first evening as saved.
 */
async function secondEveningOfTonight(page: Page): Promise<any> {
  await startEvening(page);
  const first = await onlyEvening(page);
  await page.goto(HOME);
  await hostAGame(page).click();
  await impostorCard(page).click();
  await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
  // v3.5 "Start a new evening?" / v3.8 "Start a new game?" (navigation only; the words: IMP-001's test below).
  const dialog = page.getByRole('dialog', { name: /Start a new (evening|game)\?/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Start new', exact: true }).click();
  await expect(whoHeading(page)).toBeVisible();
  if ((await removeButtons(page).count()) === 0) await addPlayers(page, P4);
  return first;
}

/** Whether a ✓ shows in this element: in its text, as CSS content, or drawn as a tick shape (::before / ::after). */
const tick = (l: Locator) => l.evaluate((el) => {
  const shown = (e: Element) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  if ((el as HTMLElement).innerText.includes('✓')) return true;
  for (const e of [el, ...Array.from(el.querySelectorAll('*'))]) {
    if (!shown(e)) continue;
    for (const p of ['::before', '::after']) {
      const cs = getComputedStyle(e, p);
      if (cs.content.includes('✓')) return true;
      // A tick drawn as a shape (a masked mark, as since 7af8f9e), of a visible size.
      const drawn = cs.content !== 'none' && /url\(/.test(`${cs.maskImage} ${cs.webkitMaskImage} ${cs.backgroundImage}`);
      if (drawn && parseFloat(cs.width) >= 8 && parseFloat(cs.height) >= 8) return true;
    }
  }
  return false;
});

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

  test('IMP-003 (v3.9, P9): under 3 players a grey hint "Add at least 3 players." (15 px, not an alert); "Next" stays enabled; tapped with fewer than 3 it does not move on and the hint turns into an alert; adding or removing a name turns it back; ✕ removes at once with no toast', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    const hint = page.getByText('Add at least 3 players.', { exact: true });
    await expect(hint).toBeVisible();
    await expect(alertWith(page, 'Add at least 3 players.')).toHaveCount(0);
    expect(await hint.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'a small line').toBe(15);
    await expect(nextButton(page)).toBeEnabled();
    await addPlayers(page, ['Riya', 'Arjun']);
    await expect(nextButton(page)).toBeEnabled();
    await settle(page);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(whoHeading(page), 'does not move on').toBeVisible();
    await expect(alertWith(page, 'Add at least 3 players.')).toHaveText(exact('Add at least 3 players.', []));
    const errorColour = await alertWith(page, 'Add at least 3 players.').evaluate((el) => getComputedStyle(el).color);
    await addPlayers(page, ['Meena']);
    await expect(page.getByText('Add at least 3 players.', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remove Arjun', exact: true }).click();
    await expectList(page, ['Riya', 'Meena']);
    await expect(page.getByTestId('undo-toast')).toHaveCount(0);
    await expect(page.getByTestId('toast')).toHaveCount(0);
    await expect(hint, 'back to the grey hint').toBeVisible();
    await expect(alertWith(page, 'Add at least 3 players.')).toHaveCount(0);
    expect(await hint.evaluate((el) => getComputedStyle(el).color), 'not the error colour').not.toBe(errorColour);
  });

  test('text left in the field when "Next" is tapped is not added and is cleared; "← Back" keeps the list', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await playerField(page).fill('Zoya');
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
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
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
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
    ['Score', 'No', 'Yes', 'Just play. We count catches and escapes.', 'Points every round, totals for the game.'],
    ['Words', 'Whole family', '+ Grown-ups', 'Words kids and grandparents know.', 'Adds words kids or elders may not know.'],
  ];

  async function toChoices(page: Page) {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(choicesHeading(page)).toBeVisible();
  }

  test('first ever evening: Easy, Free flow, No, Whole family; one selected per group, never the main look; only its line shows', async ({ page }) => {
    await toChoices(page);
    for (const [group, first, second, firstLine, secondLine] of GROUPS) {
      const a = option(page, group, first), b = option(page, group, second);
      await expect(a, `${group}: ${first}`).toHaveAttribute('aria-pressed', 'true');
      await expect(b, `${group}: ${second}`).toHaveAttribute('aria-pressed', 'false');
      // Terms "Selected": a decorative ✓, in the button's text or drawn by CSS (::before / ::after, as since 7af8f9e).
      expect(await tick(a), `${group}: the selected option shows a ✓`).toBe(true);
      expect(await tick(b), `${group}: the other option has no ✓`).toBe(false);
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

  test('9 category switches, named and ordered exactly (v3.5 names), all on; "Include non-veg food" off; 2 off → "Categories: 7 of 9 ›"', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
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
    await sw(page, 'Everyday moments').click();
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
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await openSheet(page);
    await expect(page.getByText('Keep at least one category.', { exact: true })).toHaveCount(0);
    // Every category switch but the last, by their order in the sheet (the names are checked in the test above).
    await expect(page.getByRole('switch'), '9 categories and "Include non-veg food"').toHaveCount(10);
    for (let i = 0; i < 8; i++) await page.getByRole('switch').nth(i).click();
    const last = page.getByRole('switch').nth(8);
    await expect(last).toBeChecked();
    await expect(last).toBeDisabled();
    await expect(page.getByText('Keep at least one category.', { exact: true })).toBeVisible();
    await page.getByRole('switch').nth(0).click();
    await expect(last).toBeEnabled();
  });

  test('a switch that is on has the track colour #1E3A5F and a white thumb (IMP-007, v3.4)', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await openSheet(page);
    const colours = await sw(page, 'Food').evaluate((el) => {
      const all = [el, ...Array.from(el.querySelectorAll('*'))].map((e) => getComputedStyle(e as Element).backgroundColor);
      return all;
    });
    expect(colours, 'the on track is rgb(30, 58, 95)').toContain('rgb(30, 58, 95)');
    expect(colours, 'the thumb is white').toContain('rgb(255, 255, 255)');
  });
});

test.describe('IMP-008 and IMP-009: taps to the first deal; choices from last time; tonight\'s session joined silently', () => {
  test('a later evening of tonight\'s session: after "Start new", "Next" → "Start round" is the first "Pass the phone to…", with no session question', async ({ page }) => {
    const first = await secondEveningOfTonight(page);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    await expect(page.getByLabel('Session name', { exact: true })).toHaveCount(0);
    const evenings = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pgn.game.')).map((k) => JSON.parse(localStorage.getItem(k)!)));
    const fresh = evenings.find((e: any) => e.gameType === 'impostor' && e.id !== first.id);
    expect(fresh, 'the new evening is saved').toBeTruthy();
    expect(fresh.sessionId, 'the new evening joins tonight\'s session').toBe(first.sessionId);
  });

  test('the first evening on a new phone: typed names, then "Next" → "Start round" is the first "Pass the phone to…"; no card shows by itself; startDeal recorded', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'How to play' })).toHaveCount(0);
    const moves = (await onlyEvening(page)).records.map((r: any) => r.move);
    expect(moves.map((m: any) => [m.type, m.practice])).toEqual([['startDeal', false]]);
  });

  test('lastChoices opens with exactly those 7 choices and "Same as last time"; "Start round" writes the screen\'s choices back; a new session "Saturday 3 Oct" with no question', async ({ page }) => {
    const seven = CATEGORIES.filter((c) => c !== 'Food' && c !== 'Everyday moments');
    const last = { mode: 'hard', talking: 'timer', score: true, words: 'grownups', categories: seven, nonveg: true, lastGuess: true };
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.impostor.lastChoices': last } });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(sameAsLastTime(page)).toBeVisible();
    const h = (await choicesHeading(page).boundingBox())!, l = (await sameAsLastTime(page).boundingBox())!;
    expect(l.y, '"Same as last time" directly under the heading').toBeGreaterThanOrEqual(h.y + h.height - 1);
    for (const [g, o] of [['Mode', 'Hard'], ['Talking', 'Timer'], ['Score', 'Yes'], ['Words', '+ Grown-ups']] as const)
      await expect(option(page, g, o), `${g}: ${o}`).toHaveAttribute('aria-pressed', 'true');
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: 7 of 9 ›\s*$/);
    await categoriesRow(page).click();
    await expect(page.getByRole('switch', { name: 'Food', exact: true })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Everyday moments', exact: true })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Include non-veg food', exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    await expect(option(page, 'Last guess for a caught impostor', 'On')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(sameAsLastTime(page)).toBeVisible();
    const before = (await sameAsLastTime(page).boundingBox())!;
    await option(page, 'Words', 'Whole family').click();
    // v3.9 (IMP-009, P6): once shown it stays, unmoved, until the choices screen is left (nothing on the screen moves).
    await expect(sameAsLastTime(page), 'it stays after a change').toBeVisible();
    const after = (await sameAsLastTime(page).boundingBox())!;
    expect(Math.abs(after.y - before.y), 'unmoved').toBeLessThanOrEqual(0.5);
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(page.getByLabel('Session name', { exact: true })).toHaveCount(0);
    const saved = await storageJson(page, 'pgn.pref.impostor.lastChoices');
    expect({ ...saved, categories: [...saved.categories].sort() }).toEqual({ ...last, words: 'family', categories: [...seven].sort() });
    const evening = await onlyEvening(page);
    expect(evening.setup.config.choices.lastGuess).toBe(true);
    const sess = await storageJson(page, `pgn.session.${evening.sessionId}`);
    expect(sess, 'the evening\'s session is saved').toBeTruthy();
    expect(sess.name).toBe('Saturday 3 Oct');
  });

  test('a stored lastChoices without lastGuess reads as the guess off; category names from before 4 October are mapped, unknown names dropped', async ({ page }) => {
    const old = { mode: 'easy', talking: 'free', score: false, words: 'family', categories: ['Food', 'Travel and places', 'Cricket and games', 'Desi life', 'Nonsense'], nonveg: false };
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.impostor.lastChoices': old } });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: 4 of 9 ›\s*$/);
    await categoriesRow(page).click();
    for (const c of ['Food', 'Out and about', 'Sports and games', 'Everyday moments']) await expect(page.getByRole('switch', { name: c, exact: true }), c).toBeChecked();
    for (const c of ['Festivals and occasions', 'Around the house', 'Films, music and TV', 'School and childhood', 'Weddings and family']) await expect(page.getByRole('switch', { name: c, exact: true }), c).not.toBeChecked();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    await expect(option(page, 'Last guess for a caught impostor', 'Off')).toHaveAttribute('aria-pressed', 'true');
  });

  test('stored names that are all unknown: all 9 on', async ({ page }) => {
    const old = { mode: 'easy', talking: 'free', score: false, words: 'family', categories: ['Nonsense'], nonveg: false, lastGuess: false };
    await phoneWith(page, [], { now: T0, storage: { 'pgn.pref.impostor.lastChoices': old } });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: all 9 ›\s*$/);
    await expect(sameAsLastTime(page)).toBeVisible();
  });

  test('a phone that has never played opens with the IMP-005 defaults', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    for (const [g, o] of [['Mode', 'Easy'], ['Talking', 'Free flow'], ['Score', 'No'], ['Words', 'Whole family']] as const)
      await expect(option(page, g, o), `${g}: ${o}`).toHaveAttribute('aria-pressed', 'true');
  });

  test('a phone that has never played: no "Same as last time"; the last-chance guess is off', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(sameAsLastTime(page)).toHaveCount(0);
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    await expect(option(page, 'Last guess for a caught impostor', 'Off')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('IMP-001 (v3.8, M22): with a game unfinished, the Impostor card asks once "Start a new game? The game from 9:30 pm will be ended." with two equal outlined buttons; "Start new" goes straight to "Who\'s playing?"', async ({ page }) => {
  await startEvening(page);
  await page.goto(HOME);
  await hostAGame(page).click();
  await impostorCard(page).click();
  await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
  const dialog = page.getByRole('dialog', { name: /Start a new game\?/ });
  await expect(dialog).toContainText(/^\s*Start a new game\? The game from 9:3\d pm will be ended\./);
  const carry = dialog.getByRole('button', { name: 'Carry on that game', exact: true });
  const fresh = dialog.getByRole('button', { name: 'Start new', exact: true });
  await expect(carry).toBeVisible();
  await expect(fresh).toBeVisible();
  await expectOneMainButton(page, 'Start a new game? dialog', null);
  expect(await isOutlined(carry), '"Carry on that game" is outlined').toBe(true);
  expect(await isOutlined(fresh), '"Start new" is outlined').toBe(true);
  const c = (await carry.boundingBox())!, f = (await fresh.boundingBox())!;
  expect(Math.abs(c.y - f.y), 'side by side').toBeLessThanOrEqual(1);
  expect(Math.abs(c.width - f.width), 'equal width').toBeLessThanOrEqual(1);
  expect(Math.abs(c.height - f.height), 'equal height').toBeLessThanOrEqual(1);
  await fresh.click();
  await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

// v2.2's read-aloud card tests are retired (IMP-070 changed in v3: "How to play" opens only on request).
test.describe('IMP-070, IMP-072, IMP-076: How to play and More options, on request', () => {
  async function toChoices(page: Page, storage: Record<string, unknown> = {}) {
    await phoneWith(page, [], { now: T0, storage });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(choicesHeading(page)).toBeVisible();
  }
  const LINES = [
    'Everyone sees the secret word except one impostor.',
    "Clockwise, say one word about it. Don't say the word!",
    'Talk, then on 3, 2, 1 everyone points.',
    'Whoever gets the most fingers is revealed. Caught: you win. Wrong person: the impostor wins.',
  ];
  const RULES = ["Not allowed: the word itself, a rhyme, a translation, or 'thing'.", "Repeating someone's clue is allowed.", 'Kids may use up to 3 words.'];
  const GUESS = 'A caught impostor can win the round by guessing the word.';

  test('the choices screen: "More options ›" and "How to play", equal quiet buttons on one row directly above "Start round"', async ({ page }) => {
    await toChoices(page);
    await expect(moreOptions(page)).toBeVisible();
    const m = (await moreOptions(page).boundingBox())!, h = (await howToPlayButton(page).boundingBox())!, s0 = (await mainButton(page).boundingBox())!;
    expect(await isOutlined(moreOptions(page))).toBe(true);
    expect(await isOutlined(howToPlayButton(page))).toBe(true);
    expect(Math.abs(m.y - h.y), 'one row').toBeLessThanOrEqual(1);
    expect(m.x, '"More options ›" on the left').toBeLessThan(h.x);
    expect(Math.abs(m.width - h.width), 'equal width').toBeLessThanOrEqual(1);
    expect(h.y + h.height, 'above "Start round"').toBeLessThanOrEqual(s0.y + 1);
    // "Directly above": no other control between the row and "Start round" (the space between may be empty).
    const between = await page.evaluate(([top, bottom]) => Array.from(document.querySelectorAll('button, input, [role="switch"], [role="group"]'))
      .filter((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= top! - 0.5 && r.bottom <= bottom! + 0.5; })
      .map((el) => (el.textContent ?? '').trim()), [h.y + h.height, s0.y]);
    expect(between, 'nothing between the row and "Start round"').toEqual([]);
  });

  test('"How to play" from the choices screen: Read this aloud with its 4 lines, the Easy line, the 3 rules, "Done" (main), "Practice round first"; no menu; nothing recorded', async ({ page }) => {
    await toChoices(page);
    await howToPlayButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Read this aloud' })).toBeVisible();
    // v3.9 (IMP-070, P10): the paragraph under "How to play", above "Read this aloud".
    const first = page.getByText("One player is the impostor: they don't know the secret word.", { exact: true });
    await expect(first).toBeVisible();
    const fb = (await first.boundingBox())!, hb = (await page.getByRole('heading', { name: 'Read this aloud' }).boundingBox())!, tb = (await page.getByRole('heading', { name: 'How to play' }).boundingBox())!;
    expect(fb.y, 'under "How to play"').toBeGreaterThanOrEqual(tb.y + tb.height - 1);
    expect(fb.y + fb.height, 'above "Read this aloud"').toBeLessThanOrEqual(hb.y + 1);
    await expect(page.locator('ol > li')).toHaveText(LINES);
    await expect(page.locator('ul > li')).toHaveText(RULES);
    await expect(page.getByText('The impostor sees the category and a hint.', { exact: true })).toBeVisible();
    await expect(page.getByText(GUESS, { exact: true })).toHaveCount(0);
    await expectOneMainButton(page, 'How to play', 'Done', true);
    const practice = page.getByRole('button', { name: 'Practice round first', exact: true });
    await expect(practice).toBeVisible();
    expect(await isOutlined(practice)).toBe(true);
    await expect(menuButton(page)).toHaveCount(0);
    expect(await savedEvenings(page)).toEqual([]);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(choicesHeading(page)).toBeVisible();
    expect(await savedEvenings(page)).toEqual([]);
  });

  test('the text follows the choices on screen: Hard, and the guess paragraph only with the last-chance guess on', async ({ page }) => {
    await toChoices(page);
    await option(page, 'Mode', 'Hard').click();
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    await expect(page.getByRole('heading', { name: 'More options' })).toBeVisible();
    await expect(page.getByText(GUESS, { exact: true })).toBeVisible();
    await option(page, 'Last guess for a caught impostor', 'On').click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(moreOptions(page), 'its text does not change').toBeVisible();
    await howToPlayButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(page.getByText('The impostor sees nothing and never starts.', { exact: true })).toBeVisible();
    await expect(page.getByText(GUESS, { exact: true })).toBeVisible();
    await expect(page.locator('ul > li')).toHaveText(RULES);
  });

  test('More options: Off selected on a first evening; a change applies only on "Done"; Back discards it', async ({ page }) => {
    await toChoices(page);
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    const off = option(page, 'Last guess for a caught impostor', 'Off'), on = option(page, 'Last guess for a caught impostor', 'On');
    await expect(off).toHaveAttribute('aria-pressed', 'true');
    expect(await hasMainLook(on)).toBe(false);
    await expectOneMainButton(page, 'More options', 'Done', true);
    await on.click();
    await page.goBack();
    await expect(choicesHeading(page)).toBeVisible();
    await expect(moreOptions(page)).toBeVisible();
    await moreOptions(page).click();
    await expect(off, 'closed by Back: the change is discarded').toHaveAttribute('aria-pressed', 'true');
    await on.click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    expect((await onlyEvening(page)).setup.config.choices.lastGuess).toBe(true);
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
    // The record's word id (v3.5) is checked in impostor-saved-evenings.spec.ts (IMP-096).
    expect((await onlyEvening(page)).records.map((r: any) => [r.move.type, r.move.practice])).toEqual([['startDeal', true]]);
    await expectChipTopLeft(page, 'screen A');
    await settle(page); await imButton(page, 'Riya').click();
    await expect(holdPad(page)).toBeVisible();
    await expectChipTopLeft(page, 'screen B');
    await hold(page, 600);
    await doneButton(page).click();
    await dealAll(page, P4.slice(1));
    await expectChipTopLeft(page, 'clues screen');
  });

  test('after the practice result, "Next round" deals round 1 with no card and no chip; the practice result has no points', async ({ page }) => {
    // Orchestrator's call (5 October): "← Home" first, the practice chip directly to its right, both in the left half.
    await startEvening(page, { practice: true, score: true, seeds: { deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }, { wordId: 'IMPW-006', impostor: 'Meena', starter: 'Arjun' }] } });
    await dealAll(page);
    await toPicker(page);
    await expectChipTopLeft(page, 'picker');
    await reveal(page, 'Riya');
    await expect(page.getByTestId('round-outcome')).toBeVisible();
    await expectChipTopLeft(page, 'result');
    // Orchestrator's decision (5 October, IMP-071 with IMP-077): between rounds the chip sits on its own line directly
    // under "← Home", both in the left half.
    const home = (await page.getByRole('button', { name: '← Home', exact: true }).boundingBox())!;
    const chip = (await page.getByTestId('practice-chip').boundingBox())!;
    expect(chip.y, 'result: the chip is under "← Home"').toBeGreaterThanOrEqual(home.y + home.height - 1);
    expect(chip.y - (home.y + home.height), 'result: directly under').toBeLessThanOrEqual(16);
    expect(home.x + home.width, 'result: "← Home" in the left half').toBeLessThanOrEqual(page.viewportSize()!.width / 2);
    for (const [w, h] of [[320, 568], [360, 640]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await expectChipTopLeft(page, `result at ${w} × ${h}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('round-points')).toHaveCount(0);
    await expect(page.getByTestId('scoreboard')).toHaveCount(0);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(passName(page)).toBeVisible();
    await expect(cardHeading(page)).toHaveCount(0);
    await expect(page.getByTestId('practice-chip')).toHaveCount(0);
  });
});

test.describe('IMP-007, IMP-070 (orchestrator, 4 October, like IMP-076): Back closes the Categories and How to play sheets without saving', () => {
  async function toChoices(page: Page) {
    await phoneWith(page, [], { now: T0 });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(choicesHeading(page)).toBeVisible();
  }

  test('Categories: two switched off, then the browser\'s Back: back on the choices with "Categories: all 9 ›", the switches unchanged', async ({ page }) => {
    await toChoices(page);
    await categoriesRow(page).click();
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
    await page.getByRole('switch', { name: 'Food', exact: true }).click();
    await page.getByRole('switch', { name: 'Everyday moments', exact: true }).click();
    await page.goBack();
    await expect(choicesHeading(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toHaveCount(0);
    await expect(categoriesRow(page)).toHaveText(/^\s*Categories: all 9 ›\s*$/);
    await categoriesRow(page).click();
    await expect(page.getByRole('switch', { name: 'Food', exact: true })).toBeChecked();
    await expect(page.getByRole('switch', { name: 'Everyday moments', exact: true })).toBeChecked();
  });

  test('How to play: the browser\'s Back returns to the choices with nothing changed and nothing recorded', async ({ page }) => {
    await toChoices(page);
    await option(page, 'Mode', 'Hard').click();
    await howToPlayButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
    await page.goBack();
    await expect(choicesHeading(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How to play' })).toHaveCount(0);
    await expect(option(page, 'Mode', 'Hard')).toHaveAttribute('aria-pressed', 'true');
    expect(await savedEvenings(page)).toEqual([]);
  });
});

test.describe('IMP-088: the choices screen at 320 × 568 and in landscape', () => {
  async function toChoicesAt(page: Page, width: number, height: number, larger = false) {
    await page.setViewportSize({ width, height });
    await phoneWith(page, [], { now: T0, storage: larger ? { 'pgn.pref.largerText': true } : {} });
    await toWhosPlaying(page);
    await addPlayers(page, P4);
    await nextButton(page).click();
    await settle(page); // v3.9: setup and How to play buttons are guarded for 500 ms (P2)
    await expect(choicesHeading(page)).toBeVisible();
  }
  const GROUP_NAMES = ['Mode', 'Talking', 'Score', 'Words'];
  const FIRST = { Mode: ['Easy', 'Hard'], Talking: ['Free flow', 'Timer'], Score: ['No', 'Yes'], Words: ['Whole family', '+ Grown-ups'] } as Record<string, [string, string]>;

  /** v3.9 (IMP-088, P5): the label column and each option's width at each size. */
  const COLUMNS: Record<number, { label: number; option: number }> = { 390: { label: 88, option: 127 }, 360: { label: 88, option: 112 }, 320: { label: 72, option: 100 }, 812: { label: 88, option: 139 } };
  async function expectRows(page: Page, where: string) {
    const col = COLUMNS[page.viewportSize()!.width]!;
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
      expect(a.x - lb.x, `${where} ${g}: the label takes a ${col.label} px column (then 8 px)`).toBeGreaterThanOrEqual(col.label + 8 - 1.5);
      expect(a.x - lb.x, `${where} ${g}: the options start right after the label column`).toBeLessThanOrEqual(col.label + 8 + 1.5);
      expect(Math.abs(a.width - col.option), `${where} ${g}: each option ${col.option} px wide`).toBeLessThanOrEqual(1.5);
      expect(b.x - (a.x + a.width), `${where} ${g}: the options 8 px apart`).toBeGreaterThanOrEqual(7);
      expect(lb.x + lb.width, `${where} ${g}: the label never sits behind an option`).toBeLessThanOrEqual(a.x);
      const oneLine = await label.evaluate((el) => { const r = document.createRange(); r.selectNodeContents(el); return new Set(Array.from(r.getClientRects()).filter((x) => x.width > 1).map((x) => Math.round(x.top))).size <= 1; });
      expect(oneLine, `${where} ${g}: the label fits on one line`).toBe(true);
      expect(lb.y + lb.height / 2, `${where} ${g}: the label is on the options' row`).toBeGreaterThanOrEqual(a.y);
      expect(lb.y + lb.height / 2, `${where} ${g}: the label is on the options' row`).toBeLessThanOrEqual(a.y + a.height);
    }
  }
  const fontSize = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const noPageScroll = (page: Page) => page.evaluate(() => {
    const s = document.scrollingElement!;
    return s.scrollHeight <= window.innerHeight && s.scrollWidth <= window.innerWidth;
  });

  test('390 × 844 (v3.9): each group is one row, an 88 px label column, then two 127 px options 8 px apart; label and option text 17 px', async ({ page }) => {
    await toChoicesAt(page, 390, 844);
    await expectRows(page, '390');
    for (const g of GROUP_NAMES) {
      expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text`).toBe(17);
      expect(await fontSize(page.getByRole('group', { name: g, exact: true }).getByText(g, { exact: true }).first()), `${g} label text`).toBe(17);
    }
  });

  test('320 × 568 with Larger text (v3.9, P5): every label on one line in its 72 px column, never behind an option; options 100 px', async ({ page }) => {
    await toChoicesAt(page, 320, 568, true);
    await expectRows(page, '320, Larger text');
  });

  for (const [w, h] of [[360, 640], [812, 375]] as const) {
    test(`${w} × ${h} (v3.9): the label column and the options (${w === 360 ? '88 + 112 + 112' : '88 + 139 + 139 in each grid cell'})`, async ({ page }) => {
      await toChoicesAt(page, w, h);
      await expectRows(page, `${w}`);
    });
  }

  test('320 × 568 (v3.9: 72 px label column, 100 px options): one row per group, option text 15 px; no page scrolling; "Start round" fixed at the bottom; the content above it may scroll inside its own box (v3.5)', async ({ page }) => {
    await toChoicesAt(page, 320, 568);
    await expectRows(page, '320');
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![1])), `${g} option text`).toBe(15);
    expect(await noPageScroll(page), 'no page scrolling').toBe(true);
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    const box = await categoriesRow(page).evaluate((el) => {
      for (let e = el.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight + 1) return getComputedStyle(e).overflowY;
      return 'fits';
    });
    expect(box, 'content taller than its box scrolls inside it').toMatch(/fits|auto|scroll/);
  });

  test('Larger text (v3.9): label and option text 19 px (17 px at 320 wide); "Start round" stays fixed at the bottom', async ({ page }) => {
    await toChoicesAt(page, 390, 844, true);
    for (const g of GROUP_NAMES) {
      expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text, 390`).toBe(19);
      expect(await fontSize(page.getByRole('group', { name: g, exact: true }).getByText(g, { exact: true }).first()), `${g} label text, 390`).toBe(19);
    }
    await page.setViewportSize({ width: 320, height: 568 });
    for (const g of GROUP_NAMES) expect(await fontSize(option(page, g, FIRST[g]![0])), `${g} option text, 320`).toBe(17);
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    const mb = (await mainButton(page).boundingBox())!;
    expect(568 - (mb.y + mb.height), '"Start round" is at the bottom').toBeLessThanOrEqual(24);
    await page.evaluate(() => { for (const el of Array.from(document.querySelectorAll('*'))) if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight; window.scrollTo(0, 1e6); });
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="main-button"]')!).position)).toMatch(/fixed|sticky/);
  });

  for (const [w, h] of [[320, 568], [360, 640]] as const) {
    for (const larger of [false, true]) {
      test(`${w} × ${h}${larger ? ', Larger text' : ''}: "Whole family" fits on one line inside its 48 px button (nothing cut off)`, async ({ page }) => {
        await toChoicesAt(page, w, h, larger);
        const b = option(page, 'Words', 'Whole family');
        const fit = await b.evaluate((el) => {
          const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.25;
          const range = document.createRange();
          range.selectNodeContents(el);
          const lines = new Set(Array.from(range.getClientRects()).filter((r) => r.width > 1).map((r) => Math.round(r.top)));
          return { sw: el.scrollWidth, cw: el.clientWidth, lines: lines.size, lh, h: el.getBoundingClientRect().height };
        });
        expect(fit.sw, 'scrollWidth ≤ clientWidth').toBeLessThanOrEqual(fit.cw);
        expect(fit.lines, 'one line').toBeLessThanOrEqual(1);
        expect(fit.h, '48 px tall').toBeGreaterThanOrEqual(47.5);
        // For the reviewer: the corner ✓ next to "family" (picture kept with the test results).
        await b.screenshot({ path: test.info().outputPath(`whole-family-${w}x${h}${larger ? '-larger' : ''}.png`) });
      });
    }
  }

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
