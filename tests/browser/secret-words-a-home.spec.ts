// Secret Words screen lane A, part 1: Home (A1), the picker (A2), "Start a new game night?" (A3), Join (J1), code entry (J2) and
// "This phone is the board" (D11). Scenarios v3.7 (23 October 2026): SWD-001, SWD-002 (D11: privacy, tested first), SWD-115,
// SWD-067 (Start new), SWD-133. Written before the screens exist; lanes A and C are built, so none is marked expected-to-fail. What the screens need: tests/games/secret-words/screens-a.md.
import { expect, test } from './fixtures';
import { fakeCamera, showToCamera } from './phone';
import { hostAGame, joinAGame } from './helpers';
import { freezeClock } from './impostor';
import { savedEvening, roundMoves, P4, SAMOSA } from './impostor';
import { waitGuards, shown } from './secret-words';
import { oracleBoard, TEAM_PAIRS } from '../games/secret-words/oracle';
import {
  box, clone, CODE, codeFor, codeFromValues, dashed, END_AT, ended, H, heading, inProgress, joinCard, lastCode, mainText, movesOf,
  NIGHT_SESSION, PAIR, phoneWithNights, quiet, savedNights, secretWordsCard, SIZES, START_AT, toNames, toPicker, TZ, variant, boot,
} from './secret-words-a';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
// The three tests that end on the map phone (lane C) are real checks since lane C landed (23 October).

const NOW = START_AT + 10 * 60_000;
const dialogNamed = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

// ---------------------------------------------------------------- A1 Home

test.describe('SWD-001 / SWD-002: Home', () => {
  test('SWD-001: "Host a game" reads "Tambola, Impostor or Secret Words on this phone"', async ({ page }) => {
    await boot(page);
    await expect(hostAGame(page)).toContainText('Tambola, Impostor or Secret Words on this phone');
  });

  test('SWD-002: the second card is "Join a game" with the line "Tambola ticket or Secret Words map from the host"; the old wording is gone', async ({ page }) => {
    await boot(page);
    await expect(joinCard(page)).toBeVisible();
    await expect(joinCard(page).getByText('Join a game', { exact: true })).toBeVisible();
    await expect(joinCard(page).getByText('Tambola ticket or Secret Words map from the host', { exact: true })).toBeVisible();
    await expect(page.getByText(/Join with my ticket|Got a QR or code from the host\?|Tambola ticket from the host/)).toHaveCount(0);
  });
});

test.describe('SWD-115: Home rows', () => {
  test('an unfinished game night is a row of three lines in `unfinished-games`: start time, teams and score; the where-line; "Tap to resume"', async ({ page }) => {
    const g = inProgress();
    await phoneWithNights(page, [g], { now: NOW });
    const row = page.getByTestId('unfinished-games').filter({ hasText: 'Secret Words' });
    await expect(row).toBeVisible();
    const starts = TEAM_PAIRS.find((p) => p.id === PAIR.id)![oracleBoard(lastCode(g)).starts];
    const lines = (await row.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual([
      'Secret Words, 9:00 pm · Chai Champions v Coffee Commandos · 1–1',
      `Turn 1 · clue for ${starts}`,
      'Tap to resume',
    ]);
    await expect(row.getByTestId('where-line')).toHaveText(`Turn 1 · clue for ${starts}`);
    await expect(page.getByRole('button', { name: new RegExp(`^Secret Words, 9:00 pm · Chai Champions v Coffee Commandos · 1–1 · Turn 1 · clue for ${starts} · Tap to resume$`) })).toBeVisible();
  });

  test('before any won game the score reads "0–0"', async ({ page }) => {
    const g = variant(inProgress(), { id: 'sw-zero', shift: 0, keep: 3 });
    await phoneWithNights(page, [g], { now: NOW });
    const row = page.getByTestId('unfinished-games').filter({ hasText: 'Secret Words' });
    await expect(row).toContainText('Secret Words, 9:00 pm · Chai Champions v Coffee Commandos · 0–0');
    await expect(row).toContainText('Tap to resume');
  });

  test('"Last game night: Chai Champions 1 · Coffee Commandos 1" with "Play again with these teams" shows for the newest ended night under 36 hours', async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + 2 * H });
    const last = page.getByTestId('last-night');
    await expect(last).toHaveText('Last game night: Chai Champions 1 · Coffee Commandos 1');
    await expect(page.getByRole('button', { name: 'Play again with these teams', exact: true })).toBeVisible();
  });

  test('36 hours exactly: the last game night is no longer offered; one second before, it is', async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + 36 * H - 1000, fixed: true });
    await expect(page.getByTestId('last-night')).toBeVisible();
    await phoneWithNights(page, [ended()], { now: END_AT + 36 * H, fixed: true });
    await expect(hostAGame(page)).toBeVisible();
    await expect(page.getByTestId('last-night')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Play again with these teams', exact: true })).toHaveCount(0);
  });

  test('only the newest ended night is shown, and a night under the unfinished rows stays below them', async ({ page }) => {
    const newer = variant(ended(), { id: 'sw-newer', shift: 3 * H, names: { id: 'SWDT-02', orange: 'Sleepy Samosas', teal: 'Crispy Dosas' }, keep: 15, end: true });
    await phoneWithNights(page, [ended(), newer], { now: END_AT + 5 * H });
    await expect(page.getByTestId('last-night')).toHaveCount(1);
    await expect(page.getByTestId('last-night')).toHaveText('Last game night: Sleepy Samosas 1 · Crispy Dosas 0');
    const unfinished = variant(inProgress(), { id: 'sw-open', shift: 4 * H });
    await phoneWithNights(page, [ended(), unfinished], { now: END_AT + 5 * H });
    const row = await box(page.getByTestId('unfinished-games'));
    const last = await box(page.getByTestId('last-night'));
    expect(last.y, '"Last game night" is under the unfinished rows').toBeGreaterThan(row.y + row.height - 1);
  });

  test('a phone with no saved game night shows no "Last game night" line', async ({ page }) => {
    await phoneWithNights(page, [], { now: END_AT + H });
    await expect(page.getByTestId('last-night')).toHaveCount(0);
    await expect(hostAGame(page)).toBeVisible();
  });

  test('"Play again with these teams" opens Make teams with the same players, teams and team names, and no "New team names"; "← Back" gives the same names; "Next" gives the choices', async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + 2 * H });
    await waitGuards(page);
    await page.getByRole('button', { name: 'Play again with these teams', exact: true }).click();
    await expect(heading(page, 'Make teams')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Chai Champions · 4 players' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Coffee Commandos · 3 players' })).toBeVisible();
    const order = await page.getByRole('button', { name: /^Move / }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(order).toEqual([
      'Move Riya to Coffee Commandos', 'Move Meena to Coffee Commandos', 'Move Zoya to Coffee Commandos', 'Move Om to Coffee Commandos',
      'Move Arjun to Chai Champions', 'Move Kabir to Chai Champions', 'Move Dev to Chai Champions',
    ]);
    await expect(quiet(page, 'New team names')).toHaveCount(0);
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    for (const n of ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Om']) await expect(page.getByRole('button', { name: `Remove ${n}`, exact: true })).toBeVisible();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await expect(heading(page, 'Make teams')).toBeVisible();
    await waitGuards(page);
    await mainText(page, 'Next').click();
    await expect(heading(page, 'How do you want to play?')).toBeVisible();
  });

  test('with an unfinished game night too, "Play again with these teams" asks "Start a new game night?" first', async ({ page }) => {
    const open = variant(inProgress(), { id: 'sw-open', shift: 4 * H });
    await phoneWithNights(page, [ended(), open], { now: END_AT + 5 * H });
    await waitGuards(page);
    await page.getByRole('button', { name: 'Play again with these teams', exact: true }).click();
    await expect(dialogNamed(page, 'Start a new game night?')).toBeVisible();
    await waitGuards(page);
    await dialogNamed(page, 'Start a new game night?').getByRole('button', { name: 'Start new (ends that one)', exact: true }).click();
    await expect(heading(page, 'Make teams')).toBeVisible();
  });

  test("Home's own menu gains \"History\"", async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: /Menu/ }).first().click();
    await expect(page.getByRole('menuitem', { name: 'History', exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------- A2 picker, A3 Start new

test.describe('SWD-001: the picker', () => {
  for (const size of SIZES) {
    test(`three cards in the order Tambola, Impostor, Secret Words, equal width and height (±1 px) at ${size.width} × ${size.height}`, async ({ page }) => {
      await boot(page, { viewport: size });
      await toPicker(page);
      const cards = [page.getByRole('button', { name: /^Tambola/ }), page.getByRole('button', { name: /^Impostor/ }), secretWordsCard(page)];
      const boxes = [];
      for (const c of cards) { await expect(c).toHaveCount(1); boxes.push(await box(c)); }
      for (const b of boxes) {
        expect(Math.abs(b.width - boxes[0]!.width), 'equal width').toBeLessThanOrEqual(1);
        expect(Math.abs(b.height - boxes[0]!.height), 'equal height').toBeLessThanOrEqual(1);
      }
      const reading = boxes.map((b) => b.y * 10_000 + b.x);
      expect([...reading].sort((a, b) => a - b), 'in reading order').toEqual(reading);
    });
  }

  test('the Secret Words card says "Secret Words" and "Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game"; tapping it opens "Who\'s playing?"', async ({ page }) => {
    await boot(page);
    await toPicker(page);
    await expect(secretWordsCard(page)).toContainText('Secret Words');
    await expect(secretWordsCard(page)).toContainText('Inspired by Codenames · team word hunt · 4–20 players · 15–25 min a game');
    await secretWordsCard(page).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
  });

  test('an unfinished game night shows the resume card above the cards: three lines, "Secret Words · Chai Champions v Coffee Commandos · 1–1", the where-line, "Tap to resume"', async ({ page }) => {
    const g = inProgress();
    await phoneWithNights(page, [g], { now: NOW });
    await toPicker(page);
    const card = page.getByTestId('resume-card');
    await expect(card).toHaveCount(1);
    const starts = TEAM_PAIRS.find((p) => p.id === PAIR.id)![oracleBoard(lastCode(g)).starts];
    const lines = (await card.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(['Secret Words · Chai Champions v Coffee Commandos · 1–1', `Turn 1 · clue for ${starts}`, 'Tap to resume']);
    const cardBox = await box(card);
    expect(cardBox.y + cardBox.height, 'above the three game cards').toBeLessThanOrEqual((await box(page.getByRole('button', { name: /^Tambola/ }))).y + 1);
  });

  test("with an unfinished Impostor evening too, Secret Words' resume card comes after Impostor's", async ({ page }) => {
    const imp = savedEvening({ deals: [{ wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' }], moves: [{ type: 'startDeal', practice: false }, ...roundMoves(P4, 'Arjun', { caught: 'wrong' }).slice(1, 3)], t0: START_AT - H, sessionId: NIGHT_SESSION });
    await phoneWithNights(page, [inProgress(), imp], { now: NOW });
    await toPicker(page);
    const cards = page.getByTestId('resume-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('Impostor');
    await expect(cards.nth(1)).toContainText('Secret Words');
  });

  test('the resume card goes back into the game, not to "Who\'s playing?"', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await toPicker(page);
    await page.getByTestId('resume-card').click();
    await expect(heading(page, "Who's playing?")).toHaveCount(0);
    await expect(page.getByTestId('resume-card')).toHaveCount(0);
  });
});

test.describe('SWD-115 / SWD-067: "Start a new game night?"', () => {
  const open = async (page: Page, g = inProgress()) => {
    await phoneWithNights(page, [g], { now: NOW });
    await toPicker(page);
    await secretWordsCard(page).click();
    return dialogNamed(page, 'Start a new game night?');
  };

  test('tapping the Secret Words card asks: heading, the paragraph with the start time, teams and score, two equal quiet buttons in order, and no main button', async ({ page }) => {
    const dialog = await open(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Start a new game night?', exact: true })).toBeVisible();
    await expect(dialog).toContainText('The game night from 9:00 pm (Chai Champions v Coffee Commandos, 1–1) will end.');
    const buttons = dialog.getByRole('button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText('Carry on that one');
    await expect(buttons.nth(1)).toHaveText('Start new (ends that one)');
    const [a, b] = [await box(buttons.nth(0)), await box(buttons.nth(1))];
    expect(Math.abs(a.width - b.width), 'equal width').toBeLessThanOrEqual(1);
    expect(Math.abs(a.height - b.height), 'equal height').toBeLessThanOrEqual(1);
    await expect(dialog.getByTestId('main-button')).toHaveCount(0);
    await expect(heading(page, "Who's playing?")).toHaveCount(0);
  });

  test('"Carry on that one" resumes the game night: nothing recorded, "Who\'s playing?" never shows', async ({ page }) => {
    const dialog = await open(page);
    const before = movesOf((await savedNights(page))[0]);
    await waitGuards(page);
    await dialog.getByRole('button', { name: 'Carry on that one', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(heading(page, "Who's playing?")).toHaveCount(0);
    expect(movesOf((await savedNights(page))[0])).toEqual(before);
  });

  test('"Start new (ends that one)" records endGame (mid-game) then endEvening, opens "Who\'s playing?" and shows no summary', async ({ page }) => {
    const dialog = await open(page);
    await waitGuards(page);
    await dialog.getByRole('button', { name: 'Start new (ends that one)', exact: true }).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await expect(heading(page, "Tonight's Secret Words")).toHaveCount(0);
    const old = (await savedNights(page)).find((g) => g.id === 'sw-fixture-v1-in-progress');
    expect(movesOf(old).slice(-2)).toEqual(['endGame', 'endEvening']);
    expect(old.status).toBe('ended');
  });

  test('it asks once per tap of the card: after "Start new", the next tap on the card goes straight to "Who\'s playing?"', async ({ page }) => {
    const dialog = await open(page);
    await waitGuards(page);
    await dialog.getByRole('button', { name: 'Start new (ends that one)', exact: true }).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await waitGuards(page);
    await secretWordsCard(page).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
    await expect(dialogNamed(page, 'Start a new game night?')).toHaveCount(0);
  });

  test('a night already ended never asks', async ({ page }) => {
    await phoneWithNights(page, [ended()], { now: END_AT + H });
    await toPicker(page);
    await secretWordsCard(page).click();
    await expect(heading(page, "Who's playing?")).toBeVisible();
  });
});

// ---------------------------------------------------------------- J1 Join, J2 code entry

const SW_LINE = "Secret Words clue givers: scan the host's code to get your secret map.";
const IMP_LINE = "Playing Impostor? It's all on the host's phone. Nothing to join, just play along!";

async function toJoin(page: Page) {
  await waitGuards(page);
  await joinCard(page).click();
  await expect(heading(page, 'Join a game')).toBeVisible();
  await waitGuards(page);
}
async function toCodeEntry(page: Page) {
  await toJoin(page);
  await quiet(page, "Type the host's code").click();
  await expect(heading(page, "Type the host's code")).toBeVisible();
  await waitGuards(page);
}
const codeField = (page: Page) => page.getByLabel("Host's code", { exact: true });
const openMapButton = (page: Page) => page.getByRole('button', { name: 'Open the map', exact: true });
const mapPhoneHeading = (page: Page) => heading(page, 'Secret Words map');

test.describe('SWD-002 / SWD-133: the Join screen', () => {
  test('headed "Join a game": the scanner "Scan a ticket or secret map", "Type a ticket code", Impostor\'s line, Secret Words\' line, then quiet "Type the host\'s code", in that order', async ({ page }) => {
    await boot(page);
    await toJoin(page);
    const order = await page.evaluate(([scan, ticket, imp, sw, host]) => {
      const where = (match: (el: Element) => boolean) => {
        const all = [...document.querySelectorAll('body *')].filter(match);
        const el = all.at(-1);
        return el ? el.getBoundingClientRect().top + window.scrollY : NaN;
      };
      const label = (t: string) => where((el) => el.getAttribute('aria-label') === t || (el.children.length === 0 && el.textContent?.trim() === t));
      return [label(scan!), label(ticket!), label(imp!), label(sw!), label(host!)];
    }, ['Scan a ticket or secret map', 'Type a ticket code', IMP_LINE, SW_LINE, "Type the host's code"]);
    expect(order.every((y) => !Number.isNaN(y)), `all five parts are on the screen (${JSON.stringify(order)})`).toBe(true);
    expect([...order].sort((a, b) => a - b), 'in this order').toEqual(order);
    await expect(page.getByText('Scan a ticket or secret map').first()).toBeVisible();
    await expect(quiet(page, 'Type a ticket code')).toBeVisible();
    await expect(page.getByText(IMP_LINE, { exact: true })).toBeVisible();
    await expect(page.getByText(SW_LINE, { exact: true })).toBeVisible();
    await expect(page.getByText('Scan your ticket')).toHaveCount(0);
    await expect(quiet(page, 'Type the code')).toHaveCount(0);
  });

  test('"← Back" on the Join screen returns to Home', async ({ page }) => {
    await boot(page);
    await toJoin(page);
    await quiet(page, '← Back').click();
    await expect(hostAGame(page)).toBeVisible();
  });

  test('SWD-133: a map QR shown to the scanner opens the map phone with the team names from `t`', async ({ page }) => {
    await fakeCamera(page);
    await boot(page);
    await toJoin(page);
    const origin = new URL(page.url()).origin;
    await showToCamera(page, `${origin}/pocket-game-night/#map=${CODE}&t=${PAIR.id}`);
    await expect(mapPhoneHeading(page)).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveText('Chai Champions (orange) · Coffee Commandos (teal)');
  });
});

test.describe('SWD-002: code entry', () => {
  test('heading "Type the host\'s code", label "Host\'s code", small line "Dashes and small letters are fine.", placeholder "27P-3QX8", `autocapitalize="characters"`, `maxlength="12"`', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    const field = codeField(page);
    await expect(field).toHaveAttribute('placeholder', '27P-3QX8');
    await expect(field).toHaveAttribute('autocapitalize', 'characters');
    await expect(field).toHaveAttribute('maxlength', '12');
    await expect(page.getByText('Dashes and small letters are fine.', { exact: true })).toBeVisible();
    await expect(openMapButton(page)).toBeVisible();
  });

  test('"Open the map" is disabled while fewer than 7 characters are left after spaces and hyphens go', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    await expect(openMapButton(page)).toBeDisabled();
    await codeField(page).fill('27P-3Q');
    await expect(openMapButton(page)).toBeDisabled();
    await codeField(page).fill(' 27 P - 3 Q X ');
    await expect(openMapButton(page)).toBeDisabled();
    await codeField(page).fill('27P-3QX8');
    await expect(openMapButton(page)).toBeEnabled();
  });

  test('a valid code opens the map phone without team names; dashes, spaces and small letters are fine', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    await codeField(page).fill('27p-3qx8');
    await openMapButton(page).click();
    await expect(mapPhoneHeading(page)).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveCount(0);
    await expect(page.getByTestId('map-code-line')).toContainText(`Host's code ${shown(CODE)}`);
  });

  const INVALID = [
    ['a wrong check symbol', '27P3QX9'],
    ['a letter outside the alphabet (0)', '27P3QX0'],
    ['a letter outside the alphabet (O)', '27P3QXO'],
    ['a letter outside the alphabet (1)', '27P3QX1'],
    ['a letter outside the alphabet (I)', '27P3QXI'],
    ['a letter outside the alphabet (L)', '27P3QXL'],
    ['8 characters', '27P3QX88'],
    ['a deal index too large for its edition', codeFromValues([0, 17, 0, 0, 0, 0])],
  ];
  for (const [what, typed] of INVALID) {
    test(`${what} (${typed}): "That code doesn't look right. Check it with the host." as an alert, the typed text kept`, async ({ page }) => {
      await boot(page);
      await toCodeEntry(page);
      await codeField(page).fill(typed!);
      await openMapButton(page).click();
      await expect(page.getByRole('alert')).toHaveText("That code doesn't look right. Check it with the host.");
      await expect(codeField(page)).toHaveValue(typed!);
      await expect(mapPhoneHeading(page)).toHaveCount(0);
    });
  }

  test('a code for an edition this app does not have (config symbol 4 or more, right check): "This map needs a newer version of the app. Open the app once with internet, then try again."', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    const newer = codeFromValues([4, 0, 0, 0, 0, 1]);
    await codeField(page).fill(newer);
    await openMapButton(page).click();
    await expect(page.getByRole('alert')).toHaveText('This map needs a newer version of the app. Open the app once with internet, then try again.');
    await expect(codeField(page)).toHaveValue(newer);
  });

  test('a Harder-words Easy code opens too (config symbols 0 to 3 are this edition)', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    await codeField(page).fill(codeFor('easy', 'grownups', 5, 0));
    await openMapButton(page).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(mapPhoneHeading(page)).toBeVisible();
  });

  test('"← Back" on the code entry returns to the Join screen', async ({ page }) => {
    await boot(page);
    await toCodeEntry(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, 'Join a game')).toBeVisible();
  });
});

test.describe('SWD-002: the QR link', () => {
  test('`#map=27P3QX8&t=SWDT-01` opens the map phone directly with the team names, and the hash is removed from the address', async ({ page }) => {
    await boot(page);
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await expect(mapPhoneHeading(page)).toBeVisible();
    await expect(page.getByTestId('map-teams')).toHaveText('Chai Champions (orange) · Coffee Commandos (teal)');
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('an invalid code in the link opens the code entry with it filled in (raw) and the error shown; "← Back" goes to the Join screen', async ({ page }) => {
    await boot(page);
    await page.goto('./#map=27p3qx9&t=SWDT-01');
    await expect(heading(page, "Type the host's code")).toBeVisible();
    await expect(codeField(page)).toHaveValue('27p3qx9');
    await expect(page.getByRole('alert')).toHaveText("That code doesn't look right. Check it with the host.");
    await waitGuards(page);
    await quiet(page, '← Back').click();
    await expect(heading(page, 'Join a game')).toBeVisible();
  });

  test('a newer code in the link opens the code entry with the newer-version error', async ({ page }) => {
    await boot(page);
    const newer = codeFromValues([4, 0, 0, 0, 0, 1]);
    await page.goto(`./#map=${newer}`);
    await expect(heading(page, "Type the host's code")).toBeVisible();
    await expect(codeField(page)).toHaveValue(newer);
    await expect(page.getByRole('alert')).toHaveText('This map needs a newer version of the app. Open the app once with internet, then try again.');
  });
});

// ---------------------------------------------------------------- D11 "This phone is the board" (privacy: tested first)

const BOARD_PARAGRAPH_MANY = "Clue givers use their own phone. To show the map on this phone, use Show the map to a clue giver in the game's menu.";
const BOARD_PARAGRAPH_ONE = 'Clue givers use their own phone. With one phone, pass this phone to the clue giver when the game says so.';
const boardDialog = (page: Page) => page.getByTestId('board-phone-dialog');
const SAVED_MAP = { code: CODE, savedAt: NOW - 60_000, found: [], t: PAIR.id };

type Route = 'typed' | 'link' | 'scanner' | 'saved map';
async function openMapBy(page: Page, route: Route) {
  if (route === 'typed') { await toCodeEntry(page); await codeField(page).fill(dashed(CODE)); await openMapButton(page).click(); }
  else if (route === 'link') { await page.goto(`./#map=${CODE}&t=${PAIR.id}`); }
  else if (route === 'scanner') { await toJoin(page); await showToCamera(page, `${new URL(page.url()).origin}/pocket-game-night/#map=${CODE}&t=${PAIR.id}`); }
  else { await waitGuards(page); await page.getByTestId('saved-map').click(); }
}
const ROUTES: Route[] = ['typed', 'link', 'scanner', 'saved map'];

test.describe('SWD-002 (v3.6) D11: opening a map on the board phone', () => {
  for (const route of ROUTES) {
    test(`${route}: with an unfinished game night the dialog "This phone is the board. Open the map here?" shows after the code is found valid; its words, buttons and order`, async ({ page }) => {
      if (route === 'scanner') await fakeCamera(page);
      await phoneWithNights(page, [variant(inProgress(), { id: 'sw-two', shift: 0, map: 'shared' })], { now: NOW, storage: { 'pgn.secretWords.map': SAVED_MAP } });
      await openMapBy(page, route);
      const dialog = dialogNamed(page, 'This phone is the board. Open the map here?');
      await expect(dialog).toBeVisible();
      await expect(boardDialog(page)).toBeVisible();
      await expect(dialog.getByRole('heading', { name: 'This phone is the board. Open the map here?' })).toBeVisible();
      await expect(dialog).toContainText(BOARD_PARAGRAPH_MANY);
      const buttons = dialog.getByRole('button');
      await expect(buttons.nth(0)).toHaveText('Open the map here');
      await expect(buttons.nth(1)).toHaveText('No, keep the board');
      await expect(dialog.getByTestId('main-button')).toHaveText('No, keep the board');
      await expect(mapPhoneHeading(page)).toHaveCount(0);
    });
  }

  test('one-phone game night: the paragraph is "Clue givers use their own phone. With one phone, pass this phone to the clue giver when the game says so."', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await expect(boardDialog(page)).toContainText(BOARD_PARAGRAPH_ONE);
    await expect(boardDialog(page)).not.toContainText('Show the map to a clue giver');
  });

  for (const route of ROUTES) {
    test(`${route}: privacy: while the dialog is open the page holds no map: no map grid, no kinds, no lists of orange or teal words, no Landmine line`, async ({ page }) => {
      if (route === 'scanner') await fakeCamera(page);
      await phoneWithNights(page, [inProgress()], { now: NOW, storage: { 'pgn.secretWords.map': SAVED_MAP } });
      await openMapBy(page, route);
      await expect(boardDialog(page)).toBeVisible();
      for (const id of ['map-grid', 'map-cell', 'map-list', 'our-words', 'avoid-line', 'first-words', 'map-qr']) {
        await expect(page.getByTestId(id), `${id} is not in the page`).toHaveCount(0);
      }
      const html = await page.evaluate(() => document.documentElement.outerHTML.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
      for (const t of ['Orange words', 'Teal words', 'Never guess', "Orange team's words", "Teal team's words", 'Whole map']) {
        expect(html, `"${t}" must not be in the page`).not.toContain(t);
      }
      const b = oracleBoard(CODE);
      const landmineWord = b.words[b.kinds.indexOf('landmine')]!;
      expect(html, 'the Landmine word is not named as the Landmine').not.toContain(`Never guess: ${landmineWord}`);
    });
  }

  test('privacy: after "No, keep the board" the page still holds no map', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await waitGuards(page);
    await boardDialog(page).getByRole('button', { name: 'No, keep the board', exact: true }).click();
    await expect(boardDialog(page)).toHaveCount(0);
    for (const id of ['map-grid', 'map-cell', 'map-list', 'our-words', 'avoid-line']) await expect(page.getByTestId(id)).toHaveCount(0);
  });

  test('"No, keep the board" has the 800 ms guard but looks live at once (not aria-disabled, full opacity): a tap inside it does nothing; after it, the dialog closes (v3.8)', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await freezeClock(page);
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    const no = boardDialog(page).getByRole('button', { name: 'No, keep the board', exact: true });
    await expect(no).toBeVisible();
    await expect(no).not.toHaveAttribute('aria-disabled', 'true');
    await expect(no).toHaveCSS('opacity', '1');
    await page.clock.runFor(400);
    await no.click({ force: true }); // inside the guard
    await expect(boardDialog(page)).toBeVisible();
    await page.clock.runFor(500);
    await expect(no).not.toHaveAttribute('aria-disabled', 'true');
    await expect(no).toHaveCSS('opacity', '1');
    await no.click();
    await expect(boardDialog(page)).toHaveCount(0);
  });

  const BACK: [Route, string][] = [
    ['typed', 'the code entry'], ['scanner', 'the Join screen'], ['link', 'Home'], ['saved map', 'Home'],
  ];
  for (const [route, where] of BACK) {
    test(`${route}: "No, keep the board" returns to ${where}`, async ({ page }) => {
      if (route === 'scanner') await fakeCamera(page);
      await phoneWithNights(page, [inProgress()], { now: NOW, storage: { 'pgn.secretWords.map': SAVED_MAP } });
      await openMapBy(page, route);
      await waitGuards(page);
      await boardDialog(page).getByRole('button', { name: 'No, keep the board', exact: true }).click();
      await expect(boardDialog(page)).toHaveCount(0);
      if (where === 'the code entry') await expect(heading(page, "Type the host's code")).toBeVisible();
      else if (where === 'the Join screen') await expect(heading(page, 'Join a game')).toBeVisible();
      else await expect(hostAGame(page)).toBeVisible();
      await expect(mapPhoneHeading(page)).toHaveCount(0);
    });
  }

  test('"Open the map here" goes on as before: the map phone opens (map phone screens are lane C)', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await waitGuards(page);
    await boardDialog(page).getByRole('button', { name: 'Open the map here', exact: true }).click();
    await expect(mapPhoneHeading(page)).toBeVisible();
  });

  test('invalid and newer codes show their errors first and never the dialog', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    await toCodeEntry(page);
    await codeField(page).fill('27P3QX9');
    await openMapButton(page).click();
    await expect(page.getByRole('alert')).toHaveText("That code doesn't look right. Check it with the host.");
    await expect(boardDialog(page)).toHaveCount(0);
    await codeField(page).fill(codeFromValues([4, 0, 0, 0, 0, 1]));
    await openMapButton(page).click();
    await expect(page.getByRole('alert')).toContainText('This map needs a newer version of the app.');
    await expect(boardDialog(page)).toHaveCount(0);
  });

  test('a phone with no unfinished game night never asks (none at all, or the night is ended): the map phone opens at once', async ({ page }) => {
    await boot(page);
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await expect(mapPhoneHeading(page)).toBeVisible();
    await expect(boardDialog(page)).toHaveCount(0);
    await phoneWithNights(page, [ended()], { now: END_AT + H });
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await expect(mapPhoneHeading(page)).toBeVisible();
    await expect(boardDialog(page)).toHaveCount(0);
  });

  test('opening (or refusing) a map never changes the unfinished game night: its saved moves are the same', async ({ page }) => {
    await phoneWithNights(page, [inProgress()], { now: NOW });
    const before = clone((await savedNights(page))[0].records);
    await page.goto(`./#map=${CODE}&t=${PAIR.id}`);
    await waitGuards(page);
    await boardDialog(page).getByRole('button', { name: 'Open the map here', exact: true }).click();
    expect((await savedNights(page))[0].records).toEqual(before);
    expect((await savedNights(page))[0].status).toBe('in-progress');
  });
});

// ---------------------------------------------------------------- Home and the picker are one-hand targets

test.describe('SWD-001: the picker and Join at the five screen sizes', () => {
  for (const size of SIZES) {
    test(`${size.width} × ${size.height}: Home, the picker and the Join screen do not scroll sideways`, async ({ page }) => {
      await boot(page, { viewport: size });
      const wide = async (where: string) => expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= window.innerWidth), `${where}: no sideways scrolling`).toBe(true);
      await wide('Home');
      await toPicker(page);
      await wide('picker');
      await quiet(page, '← Back').click();
      await expect(hostAGame(page)).toBeVisible();
      await toNames(page, { viewport: size });
      await wide("Who's playing?");
    });
  }
});

