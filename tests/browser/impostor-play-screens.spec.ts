// Impostor play screens (C1/C2), written 3 October 2026 from the approved scenarios v2.2 for the screens built in
// c857400: talk and timer (IMP-023, IMP-024, IMP-027), deal again (IMP-025), countdown (IMP-030), picker and tie
// (IMP-031, IMP-032), reveals (IMP-033, IMP-034, IMP-038), no words left (IMP-052), Rules (IMP-072), sizes (IMP-073),
// Players (IMP-074), the main button (IMP-080), nothing scrolls at the four sizes (IMP-081), long lists (IMP-082),
// screen readers (IMP-083), no flashing (IMP-084), kind words (IMP-085), a slipped finger (IMP-086), sounds (IMP-089),
// after the round (IMP-100 to IMP-108). Every text, name and test id is the one in specs/impostor/README.md.
// Updated 4 October 2026 to scenarios v3.5 (Impostor round 4). Impostor round 4 is built (main df8f362, 4 October 2026): no test here is marked expected-to-fail.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from './fixtures';
import {
  HOME, backgroundAndReturn, chooseTicketType, expectOneMainButton, fillPlayers, fromHome, hasMainLook, isOutlined, openTambola, ticketCard, toggle,
} from './helpers';
import {
  CLUES_DONE, COMMON_CATEGORIES, LONGEST, P4, PANI_PURI, SAMOSA, SCHOOL_TRIP, TZ, T0, WORDS, result, summaryAction, dealAll, exact, expectNoSecrets, freezeClock, fromMenu,
  hold, holdPad, imButton, mainButton, menuButton, onlyEvening, passName, phoneWith, pickerName, press, privateBlock,
  overlapping, release, revealLines, roundMoves, savedEvening, savedEvenings, secretTerms, startEvening, textOf, word, type Move, type StartOptions,
} from './impostor';

test.use({ timezoneId: TZ, viewport: { width: 390, height: 844 } });

const START: Move = { type: 'startDeal', practice: false };
const DEAL = { wordId: SAMOSA, impostor: 'Arjun', starter: 'Riya' };
const fontSize = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
const noPageScroll = (page: Page) => page.evaluate(() => {
  const s = document.scrollingElement!;
  return s.scrollHeight <= window.innerHeight && s.scrollWidth <= window.innerWidth;
});
const quiet = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const timer = (page: Page) => page.getByTestId('timer');
const countdown = (page: Page) => page.getByTestId('countdown-number');
const pickerHeading = (page: Page) => page.getByRole('heading', { name: 'Who got the most fingers?' });
const outcome = (page: Page) => page.getByTestId('round-outcome');
const announcer = (page: Page) => page.getByTestId('announcer');
const sounds = (page: Page): Promise<{ name: string; at: number; gain: number }[]> => page.evaluate(() => (window as any).__sounds ?? []);
/** The moves of the evening in progress (the newest one when an earlier evening is also saved). */
const records = async (page: Page) => {
  const all = (await savedEvenings(page)).filter((e) => e.status === 'in-progress').sort((a, b) => b.createdAt - a.createdAt);
  expect(all.length, 'an evening in progress').toBeGreaterThan(0);
  return all[0].records.map((r: any) => r.move);
};

/** A new evening dealt to the clues screen. */
async function toClues(page: Page, o: StartOptions = {}) {
  await startEvening(page, { seeds: { deals: [DEAL] }, ...o });
  await dealAll(page, o.players ?? P4);
}
/** Clues → talk (Free flow or Timer). */
async function toTalk(page: Page) {
  await mainButton(page).filter({ hasText: CLUES_DONE }).click();
}
/** Talk → "Vote now" → the picker, after the 6 s countdown. */
async function toPickerFromTalk(page: Page) {
  await mainButton(page).filter({ hasText: /^(Vote now|Get ready to point)$/ }).click();
  await page.clock.runFor(6000);
  await expect(pickerHeading(page)).toBeVisible();
}
/** Whatever opens first: the evening itself, or Home with its unfinished row (then "Tap to resume"). */
async function openEvening(page: Page) {
  const row = page.getByTestId('unfinished-games').filter({ hasText: /Impostor/ });
  const inGame = mainButton(page).or(page.getByRole('heading', { name: "That's the night!" }));
  await expect(row.or(inGame).first()).toBeVisible();
  if (await row.first().isVisible()) await row.getByText('Tap to resume').first().click();
}
/** A saved evening reopened on its round result: `rounds` caught-wrong rounds of 4 players (IMP-091 shows the result). */
async function atResult(page: Page, o: { score?: boolean; rounds?: number } = {}) {
  const deals = [DEAL, { wordId: PANI_PURI, impostor: 'Meena', starter: 'Arjun' }, { wordId: 'IMPW-007', impostor: 'Kabir', starter: 'Meena' }];
  let moves: Move[] = [];
  for (let i = 0; i < (o.rounds ?? 1); i++) moves = [...moves, ...roundMoves(P4, deals[i]!.impostor, { caught: 'wrong' }, i === 0 ? START : { type: 'nextRound' })];
  const e = savedEvening({ deals, moves, choices: { score: !!o.score } });
  await phoneWith(page, [e], { now: e.records.at(-1).at + 60_000 });
  await openEvening(page);
  await expect(outcome(page)).toHaveText(exact('The crew wins!'));
  return e;
}

test.describe('IMP-023: Free flow', () => {
  test('"Talk it over", "Who sounded unsure?" and "Vote now", no timer; 56 px; nothing changes by itself', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    const heading = page.getByTestId('talk-heading');
    await expect(heading).toHaveText(exact('Talk it over'));
    await expect(page.getByText('Who sounded unsure?', { exact: true })).toBeVisible();
    await expect(mainButton(page)).toHaveText(exact('Vote now'));
    await expect(timer(page)).toHaveCount(0);
    expect(await fontSize(heading)).toBe(56);
    const before = await page.locator('body').innerText();
    await page.clock.runFor(180_000);
    expect(await page.locator('body').innerText()).toBe(before);
    await page.setViewportSize({ width: 360, height: 640 });
    expect(await fontSize(heading), 'at 360').toBe(56);
    await page.setViewportSize({ width: 320, height: 568 });
    const s = await fontSize(heading);
    expect(s).toBeGreaterThanOrEqual(32);
    expect(s).toBeLessThanOrEqual(56);
  });
});

test.describe('IMP-024 and IMP-027: Timer', () => {
  test('2:00 counting down once a second; 1 minute left; at 0:00 "Time\'s up!", the chime, "Get ready to point"; never moves on by itself', async ({ page }) => {
    await toClues(page, { talking: 'timer' });
    await freezeClock(page);
    await toTalk(page);
    await expect(timer(page)).toHaveText('2:00');
    await expect(page.getByTestId('talk-heading')).toHaveCount(0);
    await expect(page.getByText('Who sounded unsure?', { exact: true })).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(exact('Vote now'));
    await expect(quiet(page, 'Pause')).toBeVisible();
    await expect(menuButton(page)).toBeVisible();
    expect(await fontSize(timer(page))).toBe(120);
    await page.clock.runFor(999);
    await expect(timer(page)).toHaveText('2:00');
    await page.clock.runFor(1);
    await expect(timer(page)).toHaveText('1:59');
    await page.clock.runFor(59_000);
    await expect(timer(page)).toHaveText('1:00');
    await expect(announcer(page)).toHaveText(exact('1 minute left'));
    await page.clock.runFor(60_000);
    await expect(timer(page)).toHaveText('0:00');
    await expect(page.getByRole('heading', { name: "Time's up!" })).toBeVisible();
    await expect(announcer(page)).toHaveText(exact("Time's up"));
    await expect(mainButton(page)).toHaveText(exact('Get ready to point'));
    await expect(quiet(page, 'Pause')).toHaveCount(0);
    expect((await sounds(page)).filter((s) => s.name === 'chime').length, 'one chime').toBe(1);
    await page.clock.runFor(120_000);
    await expect(timer(page)).toHaveText('0:00');
    await expect(countdown(page)).toHaveCount(0);
    await mainButton(page).click();
    await expect(page.getByRole('heading', { name: 'Get ready to point…' })).toBeVisible();
  });

  test('at 320 wide the timer is 112 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await toClues(page, { talking: 'timer' });
    await toTalk(page);
    expect(await fontSize(timer(page))).toBe(112);
  });

  test('v3.5: "Talk it over" label (28 px) above the timer; at 0:00 "1 more minute" replaces "Pause"; it gives 1:00 again, "Vote now" returns, no "1 minute left" for an added minute', async ({ page }) => {
    await toClues(page, { talking: 'timer' });
    await freezeClock(page);
    await toTalk(page);
    const label = page.getByTestId('timer-label');
    await expect(label).toHaveText(exact('Talk it over', []));
    expect(await fontSize(label)).toBe(28);
    const lb = (await label.boundingBox())!, tb = (await timer(page).boundingBox())!;
    expect(lb.y + lb.height, 'directly above the timer').toBeLessThanOrEqual(tb.y + 1);
    await page.clock.runFor(120_000);
    await expect(page.getByRole('heading', { name: "Time's up!" })).toBeVisible();
    const more = quiet(page, '1 more minute');
    await expect(more).toBeVisible();
    expect(await isOutlined(more)).toBe(true);
    const before = await records(page);
    await more.click();
    await expect(timer(page)).toHaveText('1:00');
    await expect(page.getByRole('heading', { name: "Time's up!" })).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(exact('Vote now'));
    await expect(quiet(page, 'Pause')).toBeVisible();
    expect(await records(page), '"1 more minute" records nothing').toEqual(before);
    await page.clock.runFor(60_000);
    await expect(timer(page)).toHaveText('0:00');
    await expect(page.getByRole('heading', { name: "Time's up!" })).toBeVisible();
    await expect(quiet(page, '1 more minute')).toBeVisible();
    expect((await sounds(page)).filter((x) => x.name === 'chime').length, 'a chime each time').toBe(2);
  });

  test('"Pause" at 1:30 holds it, "Paused · Tap to carry on"; "Carry on" resumes from 1:30; the menu never pauses; hidden pauses; timerMs kept', async ({ page }) => {
    await toClues(page, { talking: 'timer' });
    await freezeClock(page);
    await toTalk(page);
    await page.clock.runFor(30_000);
    await expect(timer(page)).toHaveText('1:30');
    await quiet(page, 'Pause').click();
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('1:30');
    await expect(quiet(page, 'Carry on')).toBeVisible();
    await expect(page.getByText('Paused · Tap to carry on', { exact: true })).toBeVisible();
    const id = (await onlyEvening(page)).id;
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.timerMs, `pgn.impostor-ui.${id}`)).toBe(90_000);
    await quiet(page, 'Carry on').click();
    await page.clock.runFor(999);
    await expect(timer(page)).toHaveText('1:30');
    await page.clock.runFor(1);
    await expect(timer(page)).toHaveText('1:29');
    await expect(quiet(page, 'Pause')).toBeVisible();
    await expect(page.getByText('Paused · Tap to carry on', { exact: true })).toHaveCount(0);
    await menuButton(page).click();
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('1:27');
    await page.keyboard.press('Escape');
    if (await page.getByRole('menuitem').first().isVisible()) await menuButton(page).click();
    await backgroundAndReturn(page);
    await expect(quiet(page, 'Carry on')).toBeVisible();
    const held = await timer(page).textContent();
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText(held!);
  });
});

test.describe('IMP-025: deal again with a new word', () => {
  test('"Deal again? This round won\'t count. …", "Keep playing" (main) changes nothing; "Deal again" records dealAgain and deals a new word from the first player', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL, { wordId: PANI_PURI, impostor: 'Kabir', starter: 'Meena' }] } });
    await dealAll(page);
    const before = await records(page);
    await fromMenu(page, 'Deal again with a new word');
    const dialog = page.getByRole('dialog', { name: /^Deal again\?/ });
    await expect(dialog).toContainText('Deal again? This round won\'t count. For when someone said the word or saw a screen.');
    await expectOneMainButton(page, 'Deal again dialog', 'Keep playing', true);
    await dialog.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('clue-order')).toBeVisible();
    expect(await records(page)).toEqual(before);
    await fromMenu(page, 'Deal again with a new word');
    await page.getByRole('dialog', { name: /^Deal again\?/ }).getByRole('button', { name: 'Deal again', exact: true }).click();
    await expect(passName(page)).toHaveText(exact('Riya'));
    expect((await records(page)).at(-1).type).toBe('dealAgain'); // the full record (v3.5, with wordId): impostor-saved-evenings.spec.ts
    await imButton(page, 'Riya').click();
    expect((await hold(page, 600))[1]).toBe(word(PANI_PURI).word);
  });
});

test.describe('IMP-030: the countdown to point', () => {
  test('"Get ready to point…", then 3, 2, 1, "Point!" each second, the picker at 6 s; no menu, no main button; sounds and announcer', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await freezeClock(page);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await expect(page.getByRole('heading', { name: 'Get ready to point…' })).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
    await expect(mainButton(page)).toHaveCount(0);
    await expectOneMainButton(page, 'countdown', null);
    for (const [ms, text] of [[1000, '3'], [1000, '2'], [1000, '1'], [1000, 'Point!']] as const) {
      await page.clock.runFor(ms);
      await expect(countdown(page)).toHaveText(text);
      await expect(announcer(page)).toHaveText(exact(text));
    }
    expect(await fontSize(countdown(page)), '"Point!"').toBe(96);
    await page.clock.runFor(1999);
    await expect(pickerHeading(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(pickerHeading(page)).toBeVisible();
    expect((await sounds(page)).map((s) => s.name)).toEqual(['tick', 'tick', 'tick', 'ding']);
  });

  test('"3" is 200 px in portrait and 160 px at 812 × 375; "Point!" is 72 px at 320 wide', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await freezeClock(page);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(1000);
    expect(await fontSize(countdown(page))).toBe(200);
    await page.setViewportSize({ width: 812, height: 375 });
    expect(await fontSize(countdown(page))).toBe(160);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.clock.runFor(3000);
    await expect(countdown(page)).toHaveText('Point!');
    expect(await fontSize(countdown(page))).toBe(72);
  });

  test('hidden during the countdown: on return it starts again from "Get ready to point…"', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await freezeClock(page);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    await page.clock.runFor(2500);
    await expect(countdown(page)).toHaveText('2');
    await backgroundAndReturn(page);
    await expect(page.getByRole('heading', { name: 'Get ready to point…' })).toBeVisible();
    await page.clock.runFor(1000);
    await expect(countdown(page)).toHaveText('3');
  });
});

test.describe('IMP-031 and IMP-032: the picker and a tie', () => {
  test('two columns of 56 px names, "Reveal" disabled; pick moves; "Count again" clears and counts down again', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await toPickerFromTalk(page);
    const boxes = [];
    for (const n of P4) boxes.push((await pickerName(page, n).boundingBox())!);
    for (const b of boxes) expect(Math.round(b.height), 'name button height').toBe(56);
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y), 'Riya and Arjun share a row').toBeLessThanOrEqual(1);
    expect(boxes[1]!.x, 'Arjun is in the second column').toBeGreaterThan(boxes[0]!.x + boxes[0]!.width - 1);
    expect(boxes[2]!.y, 'Meena starts the second row').toBeGreaterThan(boxes[0]!.y);
    await expect(mainButton(page)).toHaveText(exact('Reveal'));
    await expect(mainButton(page)).toBeDisabled();
    await expect(quiet(page, "It's a tie")).toBeVisible();
    await expect(quiet(page, 'Count again')).toBeVisible();
    await pickerName(page, 'Arjun').click();
    await expect(pickerName(page, 'Arjun')).toHaveAttribute('aria-pressed', 'true');
    await expect(mainButton(page)).toHaveText(exact('Reveal Arjun'));
    await expect(mainButton(page)).toBeEnabled();
    await pickerName(page, 'Meena').click();
    await expect(pickerName(page, 'Arjun')).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText(exact('Reveal Meena'));
    await pickerName(page, 'Meena').click();
    await expect(pickerName(page, 'Meena')).toHaveAttribute('aria-pressed', 'true');
    expect(await hasMainLook(pickerName(page, 'Meena')), 'a picked name is not the main look').toBe(false);
    const before = await records(page);
    await quiet(page, 'Count again').click();
    await expect(page.getByRole('heading', { name: 'Get ready to point…' })).toBeVisible();
    await page.clock.runFor(6000);
    await expect(pickerHeading(page)).toBeVisible();
    for (const n of P4) await expect(pickerName(page, n)).toHaveAttribute('aria-pressed', 'false');
    expect(await records(page)).toEqual(before);
  });

  test('"It\'s a tie": ticks, "Point again: Arjun or Meena" / "…, Meena or Kabir"; the re-vote shows only the tied names and "Still a tie"', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await toPickerFromTalk(page);
    await pickerName(page, 'Riya').click();
    await quiet(page, "It's a tie").click();
    await expect(quiet(page, "It's a tie")).toHaveCount(0);
    await expect(pickerName(page, 'Riya')).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText(exact('Point again'));
    await expect(mainButton(page)).toBeDisabled();
    await pickerName(page, 'Meena').click();
    await pickerName(page, 'Arjun').click();
    await expect(mainButton(page)).toHaveText(exact('Point again: Arjun or Meena'));
    await pickerName(page, 'Kabir').click();
    await expect(mainButton(page)).toHaveText(exact('Point again: Arjun, Meena or Kabir'));
    await pickerName(page, 'Kabir').click();
    await expect(pickerName(page, 'Kabir')).toHaveAttribute('aria-pressed', 'false');
    await mainButton(page).click();
    await page.clock.runFor(6000);
    await expect(pickerHeading(page)).toBeVisible();
    expect((await records(page)).at(-1)).toEqual({ type: 'tie', players: ['Arjun', 'Meena'] });
    await expect(pickerName(page, 'Riya')).toHaveCount(0);
    await expect(pickerName(page, 'Kabir')).toHaveCount(0);
    await expect(pickerName(page, 'Arjun')).toBeVisible();
    await expect(quiet(page, 'Still a tie')).toBeVisible();
    await expect(quiet(page, 'Count again')).toBeVisible();
    await expect(quiet(page, "It's a tie")).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(exact('Reveal'));
    await expect(mainButton(page)).toBeDisabled();
    await pickerName(page, 'Meena').click();
    await expect(mainButton(page)).toHaveText(exact('Reveal Meena'));
  });

  test('"Count again" in tie mode clears the ticks and returns to the one-name picker', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await toPickerFromTalk(page);
    await quiet(page, "It's a tie").click();
    await pickerName(page, 'Arjun').click();
    await quiet(page, 'Count again').click();
    await page.clock.runFor(6000);
    await expect(pickerHeading(page)).toBeVisible();
    await expect(quiet(page, "It's a tie")).toBeVisible();
    await expect(pickerName(page, 'Arjun')).toHaveAttribute('aria-pressed', 'false');
    await expect(mainButton(page)).toHaveText(exact('Reveal'));
  });
});

test.describe('IMP-031 (v3.5): "Not sure?" and its text buttons', () => {
  test('24 px below the names: "Not sure?", then "It\'s a tie" and "Count again" side by side, equal, 48 px tall, no outline', async ({ page }) => {
    await toClues(page);
    await toTalk(page);
    await toPickerFromTalk(page);
    const label = page.getByText('Not sure?', { exact: true });
    await expect(label).toBeVisible();
    const last = (await pickerName(page, 'Kabir').boundingBox())!, l = (await label.boundingBox())!;
    expect(Math.round(l.y - (last.y + last.height)), '24 px below the last name').toBeGreaterThanOrEqual(23);
    const tie = quiet(page, "It's a tie"), again = quiet(page, 'Count again');
    const t = (await tie.boundingBox())!, c = (await again.boundingBox())!;
    expect(t.y, 'under "Not sure?"').toBeGreaterThanOrEqual(l.y + l.height - 1);
    expect(Math.abs(t.y - c.y), 'side by side').toBeLessThanOrEqual(1);
    expect(Math.abs(t.width - c.width), 'equal width').toBeLessThanOrEqual(1);
    expect(Math.round(t.height)).toBeGreaterThanOrEqual(48);
    expect(await isOutlined(tie), 'no outline').toBe(false);
    expect(await isOutlined(again), 'no outline').toBe(false);
  });
});

// v2.2's timed reveals (reveal lines at 2.5 s, 4.0 s, 5.5 s, 7.0 s) are retired: v3 shows one result screen at 1.5 s.
test.describe('IMP-033, IMP-034, IMP-038, IMP-039, IMP-073: the one result screen', () => {
  async function toResult(page: Page, o: StartOptions & { word?: string; impostor?: string } = {}) {
    await startEvening(page, { ...o, seeds: { deals: [{ wordId: o.word ?? SCHOOL_TRIP, impostor: o.impostor ?? 'Arjun', starter: 'Riya' }] } });
    await dealAll(page, o.players ?? P4);
    await toTalk(page);
    await toPickerFromTalk(page);
    await freezeClock(page);
  }
  const order = async (page: Page, ids: string[]) => {
    let last = -Infinity;
    for (const id of ids) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b, id).not.toBeNull();
      expect(b.y, `${id} is below the line above`).toBeGreaterThanOrEqual(last - 1);
      last = b.y + b.height;
    }
  };

  test('IMP-033 caught, guess off: "Arjun was…" alone for 1.5 s with a drumroll, no menu, no main button; then everything at once, top to bottom, with these sizes', async ({ page }) => {
    await toResult(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await expect(result(page, 'build-up')).toHaveText(exact('Arjun was…'));
    expect(await fontSize(result(page, 'build-up'))).toBe(40);
    await expect(menuButton(page)).toHaveCount(0);
    await expectOneMainButton(page, 'build-up', null);
    expect((await sounds(page)).filter((x) => x.name === 'drumroll').length).toBe(1);
    await page.clock.runFor(1499);
    await expect(result(page, 'result-headline')).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(result(page, 'build-up')).toHaveCount(0);
    await expect(result(page, 'result-headline')).toHaveText(exact('✓ Caught!', []));
    await expect(result(page, 'result-note')).toHaveCount(0);
    await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
    await expect(result(page, 'word-label')).toHaveText(exact('The word was', []));
    await expect(result(page, 'result-word')).toHaveText(exact('School trip', []));
    await expect(result(page, 'also-called')).toHaveText(exact('Also called Excursion', []));
    await expect(result(page, 'word-category')).toHaveText(exact('School and childhood', []));
    await expect(result(page, 'round-outcome')).toHaveText(exact('The crew wins!'));
    await expect(page.getByTestId('evening-line')).toHaveText('Tonight: impostor caught 1 · escaped 0');
    await order(page, ['result-headline', 'result-impostor', 'word-label', 'result-word', 'also-called', 'word-category', 'round-outcome', 'evening-line']);
    await expect(mainButton(page)).toHaveText(exact('Next round'));
    await expect(quiet(page, "This word didn't work")).toBeVisible();
    await expect(quiet(page, 'Undo')).toHaveCount(0);
    await expect(menuButton(page)).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'the body colour never changes').toBe(bg);
    for (const [id, px] of [['result-headline', 56], ['result-impostor', 32], ['result-word', 44], ['word-category', 17], ['round-outcome', 28], ['evening-line', 17], ['also-called', 15]] as const)
      expect(await fontSize(page.getByTestId(id)), id).toBe(px);
    expect(await isOutlined(result(page, 'word-category')), 'the category is an outlined chip').toBe(true);
    expect(await result(page, 'word-category').evaluate((el) => el.closest('button') === null), 'the chip is not a button').toBe(true);
    expect((await records(page)).at(-1)).toEqual({ type: 'reveal', player: 'Arjun' });
    await page.clock.runFor(30_000);
    await expect(result(page, 'round-outcome'), 'nothing else appears later').toHaveText(exact('The crew wins!'));
  });

  test('IMP-073 (I23): the headline is 44 px below 360 px wide, always one line there; 56 px at 360 wide', async ({ page }) => {
    await toResult(page);
    await pickerName(page, 'Riya').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    const h = result(page, 'result-headline');
    await expect(h).toHaveText(exact('✗ Escaped!', []));
    const oneLine = () => h.evaluate((el) => {
      const r = document.createRange(); r.selectNodeContents(el);
      return new Set(Array.from(r.getClientRects()).filter((x) => x.width > 1).map((x) => Math.round(x.top))).size === 1 && el.scrollWidth <= el.clientWidth;
    });
    // "Always one line" is the rule for the 44 px size below 360 px wide; at 360 and up the spec sets only 56 px.
    for (const [w, ht, px] of [[320, 568, 44], [359, 640, 44], [360, 640, 56]] as const) {
      await page.setViewportSize({ width: w, height: ht });
      expect(await fontSize(h), `${w} wide`).toBe(px);
      if (px === 44) expect(await oneLine(), `${w} wide: one line`).toBe(true);
    }
  });

  test('IMP-034 escaped: "✗ Escaped!", "Meena was crew.", ARJUN was the impostor, the word, no "Also called", "Food", "Arjun escaped!"; no guess, no "Undo"', async ({ page }) => {
    await toResult(page, { word: SAMOSA, lastGuess: true });
    await pickerName(page, 'Meena').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await expect(result(page, 'build-up')).toHaveText(exact('Meena was…'));
    await page.clock.runFor(1500);
    await expect(result(page, 'result-headline')).toHaveText(exact('✗ Escaped!', []));
    await expect(result(page, 'result-note')).toHaveText(exact('Meena was crew.'));
    expect(await fontSize(result(page, 'result-note'))).toBe(20);
    await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(result(page, 'also-called')).toHaveCount(0);
    await expect(result(page, 'word-category')).toHaveText(exact('Food', []));
    await expect(result(page, 'round-outcome')).toHaveText(exact('Arjun escaped!'));
    await order(page, ['result-headline', 'result-note', 'result-impostor', 'word-label', 'result-word', 'word-category', 'round-outcome']);
    await expect(result(page, 'guess-line')).toHaveCount(0);
    await expect(quiet(page, 'Undo')).toHaveCount(0);
    await expect(mainButton(page)).toHaveText(exact('Next round'));
  });

  test('IMP-038 "Still a tie": at once, no build-up, no drumroll: "✗ Escaped!", "Still a tie.", the word, "Arjun escaped!"; no "Undo"', async ({ page }) => {
    await toResult(page, { word: SAMOSA });
    await quiet(page, "It's a tie").click();
    await pickerName(page, 'Riya').click();
    await pickerName(page, 'Meena').click();
    await mainButton(page).click();
    await page.clock.runFor(6000);
    const before = (await sounds(page)).length;
    await quiet(page, 'Still a tie').click();
    await expect(result(page, 'build-up')).toHaveCount(0);
    await expect(result(page, 'result-headline')).toHaveText(exact('✗ Escaped!', []));
    await expect(result(page, 'result-note')).toHaveText(exact('Still a tie.', []));
    await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
    await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
    await expect(result(page, 'round-outcome')).toHaveText(exact('Arjun escaped!'));
    await expect(quiet(page, 'Undo')).toHaveCount(0);
    expect((await sounds(page)).slice(before).map((x) => x.name)).not.toContain('drumroll');
    expect((await records(page)).at(-1)).toEqual({ type: 'stillTie' });
  });

  test('IMP-039 guess on: the guess step (no menu, no word), "Arjun guessed. Show the word", equal verdict buttons (no main look), then the outcome, "Undo", "This word didn\'t work", "Next round"; the menu returns', async ({ page }) => {
    await toResult(page, { lastGuess: true });
    await pickerName(page, 'Arjun').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await expect(result(page, 'guess-line')).toHaveText(exact('Last chance, Arjun! Guess the word out loud. Get it right and you steal the round.'));
    expect(await fontSize(result(page, 'guess-line'))).toBe(20);
    await expect(menuButton(page)).toHaveCount(0);
    await expectNoSecrets(page, secretTerms(SCHOOL_TRIP, 'easy'), 'the guess step');
    await mainButton(page).filter({ hasText: exact('Arjun guessed. Show the word') }).click();
    await expect(result(page, 'result-word')).toHaveText(exact('School trip', []));
    await expect(result(page, 'word-category')).toHaveText(exact('School and childhood', []));
    const right = quiet(page, 'Guessed right'), wrong = quiet(page, 'Wrong guess');
    const r = (await right.boundingBox())!, w = (await wrong.boundingBox())!;
    expect(Math.abs(r.width - w.width), 'equal width').toBeLessThanOrEqual(1);
    expect(Math.abs(r.y - w.y), 'side by side').toBeLessThanOrEqual(1);
    await expectOneMainButton(page, 'verdict step', null);
    await expect(menuButton(page)).toHaveCount(0);
    await right.click();
    await expect(result(page, 'round-outcome')).toHaveText(exact('Arjun steals the round!'));
    await expect(result(page, 'round-outcome')).toBeInViewport({ ratio: 1 });
    const u = (await quiet(page, 'Undo').boundingBox())!, d = (await quiet(page, "This word didn't work").boundingBox())!;
    expect(u.y, '"Undo" then "This word didn\'t work"').toBeLessThan(d.y);
    await expect(mainButton(page)).toHaveText(exact('Next round'));
    await expect(menuButton(page)).toBeVisible();
    expect((await records(page)).slice(-3)).toEqual([{ type: 'reveal', player: 'Arjun' }, { type: 'showWord' }, { type: 'verdict', right: true }]);
  });

  test('IMP-081: the result scrolls as one page: nothing inside has its own scroll area; the main button stays pinned; at 812 × 375 the headline to the outcome sit left, the evening line and quiet buttons right', async ({ page }) => {
    await toResult(page, { score: true, players: ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi'] });
    await pickerName(page, 'Arjun').click();
    await mainButton(page).filter({ hasText: /^Reveal / }).click();
    await page.clock.runFor(1500);
    await expect(result(page, 'round-outcome')).toBeVisible();
    for (const [w, h] of [[390, 844], [320, 568], [812, 375]] as const) {
      await page.setViewportSize({ width: w, height: h });
      const inner = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter((el) => {
        const cs = getComputedStyle(el);
        return /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
      }).map((el) => el.getAttribute('data-testid') ?? el.tagName));
      expect(inner, `${w} × ${h}: no inner scroll area`).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 1e6));
      await expect(mainButton(page), `${w} × ${h}: main button pinned`).toBeInViewport({ ratio: 1 });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    const half = 406;
    for (const id of ['result-headline', 'result-impostor', 'result-word', 'word-category', 'round-outcome']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b.x + b.width, `${id} in the left half`).toBeLessThanOrEqual(half + 1);
    }
    for (const l of [page.getByTestId('round-points'), page.getByTestId('scoreboard'), quiet(page, "This word didn't work")]) {
      const b = (await l.boundingBox())!;
      expect(b.x, 'in the right half').toBeGreaterThanOrEqual(half - 1);
    }
  });
});

test.describe('IMP-052: no words left', () => {
  // One category with every word but one skipped on this phone, and that one dealt in an evening earlier tonight.
  // The smallest of the categories named alike on the old and the 4 October list, counting words that may be dealt.
  const CAT = (() => {
    const counts = new Map<string, number>();
    for (const w of WORDS) if (w.retired !== 'yes' && COMMON_CATEGORIES.includes(w.category)) counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[1] - b[1])[0]![0];
  })();
  const inCat = WORDS.filter((w) => w.category === CAT && w.retired !== 'yes' && (w as any).audience !== 'grownups' && (w as any).nonveg !== 'yes' && (w as any).nonveg !== 'true');
  const last = inCat[0]!.id;
  // Every other word of the category skipped on this phone, by words.csv and by the shipped list (Test hooks item 2),
  // so none is left while the shipped list still has the categories of before 4 October.
  const shipped: { id: string; category: string }[] = JSON.parse(readFileSync(fileURLToPath(new URL('../../content/impostor/words.json', import.meta.url)), 'utf8'));
  const blocked = [...new Set([...WORDS.filter((w) => w.category === CAT).map((w) => w.id), ...shipped.filter((w) => w.category === CAT).map((w) => w.id)])].filter((id) => id !== last);

  async function toNoWords(page: Page) {
    const earlier = savedEvening({
      id: 'imp-earlier-tonight', status: 'ended', t0: T0 - 40 * 60_000,
      deals: [{ wordId: last, impostor: 'Arjun', starter: 'Riya' }],
      moves: [...roundMoves(P4, 'Arjun', { caught: 'wrong' }, START), { type: 'endEvening' }],
    });
    await phoneWith(page, [earlier], {
      now: T0,
      storage: { 'pgn.pref.impostor.blockedWords': blocked, 'pgn.pref.impostor.lastChoices': { mode: 'easy', talking: 'free', score: false, words: 'family', categories: [CAT], nonveg: false, lastGuess: true } },
    });
    await page.getByRole('button', { name: /^Host a game/ }).click();
    await page.getByRole('button', { name: /^Impostor\b/ }).and(page.locator(':not([data-testid="resume-card"])')).click();
    if ((await page.getByRole('button', { name: /^Remove / }).count()) === 0) {
      for (const n of P4) { await page.getByLabel('Player name', { exact: true }).fill(n); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
    }
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    const card = mainButton(page).filter({ hasText: 'Start the deal' });
    const heading = page.getByRole('heading', { name: "You've played every word in these categories tonight!" });
    await expect(card.or(heading).first()).toBeVisible();
    if (await card.isVisible()) await card.click();
    await expect(heading).toBeVisible();
  }

  test('the heading, "Turn on more categories or + Grown-ups.", "Allow repeats" (main) and "Change categories"; the between-rounds menu; "Allow repeats" deals', async ({ page }) => {
    await toNoWords(page);
    await expect(page.getByText('Turn on more categories or + Grown-ups.', { exact: true })).toBeVisible();
    await expectOneMainButton(page, 'no words left', 'Allow repeats', true);
    expect(await isOutlined(quiet(page, 'Change categories'))).toBe(true);
    await menuButton(page).click();
    expect(await textOf(page.getByRole('menuitem'))).toEqual(['How to play', 'Players', 'Change how we play', 'Settings', 'History', 'End the evening']);
    await page.keyboard.press('Escape');
    if (await page.getByRole('menuitem').first().isVisible()) await menuButton(page).click();
    await mainButton(page).filter({ hasText: 'Allow repeats' }).click();
    await expect(passName(page)).toBeVisible();
    expect((await records(page)).map((m: any) => m.type)).toContain('allowRepeats'); // its word id: impostor-saved-evenings.spec.ts
  });

  test('"Change categories" opens the current choices; "Start round" records setChoices only and deals', async ({ page }) => {
    await toNoWords(page);
    await quiet(page, 'Change categories').click();
    await expect(page.getByRole('heading', { name: 'How do you want to play?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Categories: 1 of 9/ })).toBeVisible();
    await page.getByRole('button', { name: /^Categories: / }).click();
    for (let i = 0; i < 9; i++) { const s = page.getByRole('switch').nth(i); if (!(await s.isChecked())) await s.click(); }
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    const before = (await records(page)).length;
    await mainButton(page).filter({ hasText: 'Start round' }).click();
    await expect(passName(page)).toBeVisible();
    const after = await records(page);
    expect(after.slice(before).map((m: any) => m.type)).toEqual(['setChoices']);
  });
});

// v2.2's "Rules" sheet tests are retired: v3 has "How to play" in the menu (IMP-070, IMP-072, IMP-075).
test.describe('IMP-070 and IMP-072: "How to play" from the menu mid-round never shows secrets', () => {
  const RULES = ["Not allowed: the word itself, a rhyme, a translation, or 'thing'.", "Repeating someone's clue is allowed.", 'Kids may use up to 3 words.'];
  for (const mode of ['easy', 'hard'] as const) {
    test(`${mode}: the 4 read-aloud lines, the ${mode} line, the 3 rules; no "Practice round first"; "Done" returns to the same screen; no secrets; nothing recorded`, async ({ page }) => {
      await toClues(page, { mode });
      const recs = await records(page);
      await fromMenu(page, 'How to play');
      await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible();
      await expect(page.locator('ol > li')).toHaveCount(4);
      await expect(page.getByText(mode === 'easy' ? 'The impostor sees the category and a hint.' : 'The impostor sees nothing and never starts.', { exact: true })).toBeVisible();
      await expect(page.getByText('A caught impostor can steal the round by guessing the word.', { exact: true }), 'the guess is off').toHaveCount(0);
      await expect(page.locator('ul > li')).toHaveText(RULES);
      await expect(page.getByRole('button', { name: 'Practice round first', exact: true })).toHaveCount(0);
      await expectNoSecrets(page, secretTerms(SAMOSA, mode), 'How to play');
      await expectOneMainButton(page, 'How to play', 'Done', true);
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'How to play' })).toHaveCount(0);
      await expect(page.getByTestId('clue-order')).toBeVisible();
      expect(await records(page)).toEqual(recs);
    });
  }

  test('a running timer keeps running while "How to play" is open', async ({ page }) => {
    await toClues(page, { talking: 'timer' });
    await freezeClock(page);
    await toTalk(page);
    await fromMenu(page, 'How to play');
    await page.clock.runFor(5000);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(timer(page)).toHaveText('1:55');
  });
});

test.describe('IMP-074: late joiner and someone leaving', () => {
  test('between rounds: add Zoya, "Done" records one setPlayers; she is dealt in next round', async ({ page }) => {
    await atResult(page);
    const before = (await records(page)).length;
    await fromMenu(page, 'Players');
    await expect(page.getByRole('heading', { name: 'Players' })).toBeVisible();
    await page.getByLabel('Player name', { exact: true }).fill('Zoya');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expectOneMainButton(page, 'Players sheet', 'Done', true);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    const after = await records(page);
    expect(after.slice(before)).toEqual([{ type: 'setPlayers', players: [...P4, 'Zoya'] }]);
    await mainButton(page).filter({ hasText: 'Next round' }).click();
    await expect(passName(page)).toBeVisible();
    for (const n of [...P4]) { await imButton(page, n).click(); await hold(page, 600); await mainButton(page).click(); }
    await expect(passName(page)).toHaveText(exact('Zoya'));
  });

  test('✕ Kabir: removed at once, "Kabir left · Undo" for 5 s; "Undo" puts him back in his seat; unchanged list records nothing', async ({ page }) => {
    await atResult(page);
    const before = (await records(page)).length;
    await fromMenu(page, 'Players');
    await freezeClock(page);
    await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Remove Kabir', exact: true })).toHaveCount(0);
    const toast = page.getByTestId('undo-toast');
    await expect(toast).toHaveText(/^\s*Kabir left ·\s*Undo\s*$/);
    await toast.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Remove Kabir', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    expect((await records(page)).length).toBe(before);
  });

  test('keeping score: "Kabir left · Points kept · Undo"; with 3 players ✕ removes nobody: "Keep at least 3 players."', async ({ page }) => {
    await atResult(page, { score: true });
    await fromMenu(page, 'Players');
    await page.getByRole('button', { name: 'Remove Kabir', exact: true }).click();
    await expect(page.getByTestId('undo-toast')).toHaveText(/^\s*Kabir left · Points kept ·\s*Undo\s*$/);
    await page.getByRole('button', { name: 'Remove Meena', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Remove Meena', exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Keep at least 3 players.' })).toBeVisible();
  });

  test('mid-round: "Change players after this round." with "OK", nothing changed', async ({ page }) => {
    await toClues(page);
    const recs = await records(page);
    await fromMenu(page, 'Players');
    const dialog = page.getByRole('dialog', { name: /Change players after this round\./ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('clue-order')).toBeVisible();
    expect(await records(page)).toEqual(recs);
  });
});

test.describe('IMP-080: at most one main button, and never a destructive one', () => {
  test('"End the evening" between rounds and "End now" mid-round: the main look is "Keep playing"', async ({ page }) => {
    await toClues(page);
    await fromMenu(page, 'End the evening');
    await expect(page.getByRole('dialog', { name: /End now\? This round won't count\./ })).toBeVisible();
    await expectOneMainButton(page, 'End now dialog', 'Keep playing', true);
    await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await atResult(page);
    await fromMenu(page, 'End the evening');
    await expect(page.getByRole('dialog', { name: /End the evening\?/ })).toBeVisible();
    await expectOneMainButton(page, 'End the evening dialog', 'Keep playing', true);
  });

  test('summary: "Discard this evening" (in "More ›"); "Discard this evening?" has "Keep it" as the main look', async ({ page }) => {
    await atResult(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await expect(page.getByRole('heading', { name: "That's the night!" })).toBeVisible();
    await expectOneMainButton(page, 'summary', 'Back to Home', true);
    await expect(page.getByRole('button', { name: 'More ›', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'More ›', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Discard this evening', exact: true }).click();
    await expect(page.getByRole('dialog', { name: /Discard this evening\?/ })).toBeVisible();
    await expectOneMainButton(page, 'Discard dialog', 'Keep it', true);
  });
});

test.describe('IMP-081: nothing scrolls during a round, at every size', () => {
  const NAME = 'Alexandrapetrova';
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [812, 375]] as const) {
    for (const larger of [false, true]) {
      const where = `${width} × ${height}${larger ? ', Larger text' : ''}`;
      const start = async (page: Page) => {
        await page.setViewportSize({ width, height });
        const players = [NAME, 'Arjun', 'Meena', 'Kabir', 'Zoya'];
        await startEvening(page, { players, talking: 'timer', practice: true, storage: larger ? { 'pgn.pref.largerText': true } : {}, seeds: { deals: [{ wordId: LONGEST, impostor: 'Arjun', starter: NAME }] } });
        await dealAll(page, players);
      };
      const check = async (page: Page, w: string, key?: Locator) => {
        expect(await noPageScroll(page), `${w}: no page scrolling`).toBe(true);
        if (await mainButton(page).count()) await expect(mainButton(page), `${w}: main button on screen`).toBeInViewport({ ratio: 1 });
        if (key) {
          // wholly on screen, allowing 1 px for sub-pixel rounding
          const b = (await key.boundingBox())!;
          expect(b.y >= -1 && b.x >= -1 && b.y + b.height <= height + 1 && b.x + b.width <= width + 1, `${w}: wholly on screen (${JSON.stringify(b)})`).toBe(true);
        }
      };
      test(`${where}: clues, talk (timer), countdown and picker with a practice chip and 16-character names`, async ({ page }) => {
        test.setTimeout(60_000);
        await start(page);
        await check(page, 'clues', page.getByTestId('starter-name'));
        await toTalk(page);
        await check(page, 'timer', timer(page));
        await mainButton(page).filter({ hasText: 'Vote now' }).click();
        await page.clock.runFor(1000);
        await check(page, 'countdown', countdown(page));
        await page.clock.runFor(5000);
        await check(page, 'picker', pickerHeading(page));
        await pickerName(page, 'Arjun').click();
        await check(page, 'picker, one picked', mainButton(page));
      });
      test(`${where}: the result screen (v3.5) scrolls as one page: main button pinned, no inner scroll area, scrolled to the top`, async ({ page }) => {
        test.setTimeout(60_000);
        await start(page);
        await toTalk(page);
        await mainButton(page).filter({ hasText: 'Vote now' }).click();
        await page.clock.runFor(6000);
        await pickerName(page, 'Arjun').click();
        await mainButton(page).click();
        await page.clock.runFor(1500);
        await expect(result(page, 'result-headline')).toBeVisible();
        expect(await page.evaluate(() => window.scrollY), 'scrolled to the top').toBe(0);
        await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
        const inner = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).length);
        expect(inner, 'no inner scroll area').toBe(0);
        await expect(page.getByTestId('practice-chip')).toBeVisible();
      });
    }
  }
});

test.describe('IMP-081: the room screens at 320 × 568 and 360 × 640: nothing drawn over anything else', () => {
  const NAME = 'Alexandrapetrova';
  for (const [width, height] of [[320, 568], [360, 640]] as const) {
    for (const larger of [false, true]) {
      const where = `${width} × ${height}${larger ? ', Larger text' : ''}`;
      const start = async (page: Page) => {
        await page.setViewportSize({ width, height });
        const players = [NAME, 'Arjun', 'Meena', 'Kabir', 'Zoya'];
        await startEvening(page, { players, talking: 'timer', practice: true, storage: larger ? { 'pgn.pref.largerText': true } : {}, seeds: { deals: [{ wordId: LONGEST, impostor: 'Arjun', starter: NAME }] } });
        return players;
      };
      const check = async (page: Page, w: string, scrolls = false) => {
        if (!scrolls) expect(await noPageScroll(page), `${w}: no page scrolling`).toBe(true);
        if (await mainButton(page).count()) await expect(mainButton(page), `${w}: main button wholly on screen`).toBeInViewport({ ratio: 1 });
        await expect(page.getByTestId('practice-chip'), `${w}: the practice chip`).toBeVisible();
        // A page that scrolls as one (the result) may pass under the pinned main button; scrolled to the end, nothing
        // may still lie under it.
        if (scrolls) await page.evaluate(() => window.scrollTo(0, 1e6));
        expect(await overlapping(page), `${w}: nothing drawn over anything else`).toEqual([]);
      };
      test(`${where}: deal, clues, talk, countdown, picker, practice chip and 16-character names`, async ({ page }) => {
        test.setTimeout(60_000);
        const players = await start(page);
        await check(page, 'deal, screen A');
        await dealAll(page, players);
        await check(page, 'clues');
        await toTalk(page);
        await check(page, 'talk, timer');
        await mainButton(page).filter({ hasText: 'Vote now' }).click();
        await page.clock.runFor(1000);
        await check(page, 'countdown');
        await page.clock.runFor(5000);
        await check(page, 'picker');
        await pickerName(page, 'Arjun').click();
        await check(page, 'picker, one picked');
      });
      test(`${where}: the build-up, the result (v3.5) and its toast: nothing drawn over anything else; the toast above the main button`, async ({ page }) => {
        test.setTimeout(60_000);
        const players = await start(page);
        await dealAll(page, players);
        await toTalk(page);
        await mainButton(page).filter({ hasText: 'Vote now' }).click();
        await page.clock.runFor(6000);
        await pickerName(page, 'Arjun').click();
        await mainButton(page).click();
        await page.clock.runFor(500);
        await expect(result(page, 'build-up')).toBeVisible();
        await check(page, 'build-up');
        await page.clock.runFor(1000);
        await expect(result(page, 'result-headline')).toBeVisible();
        await check(page, 'result', true);
        await quiet(page, "This word didn't work").click();
        const toast = page.getByTestId('undo-toast');
        await expect(toast).toBeVisible();
        await check(page, 'result with its toast', true);
        const t = (await toast.boundingBox())!;
        const m = (await mainButton(page).boundingBox())!;
        expect(t.y >= -1 && t.x >= -1 && t.y + t.height <= height + 1 && t.x + t.width <= width + 1, `the toast wholly on screen (${JSON.stringify(t)})`).toBe(true);
        expect(t.y + t.height, 'the toast is a bar above the main button').toBeLessThanOrEqual(m.y + 1);
      });
    }
  }
});

test.describe('IMP-082: lists of 12 to 20 players', () => {
  const twelve = ['Riya', 'Arjun', 'Meena', 'Kabir', 'Zoya', 'Dev', 'Asha', 'Neel', 'Tara', 'Om', 'Isha', 'Ravi'];
  test('390 × 844: 12 names of up to 8 characters in two columns with no scrolling at all', async ({ page }) => {
    test.setTimeout(90_000);
    await toClues(page, { players: twelve });
    await toTalk(page);
    await toPickerFromTalk(page);
    for (const n of twelve) await expect(pickerName(page, n), n).toBeInViewport({ ratio: 1 });
    expect(await noPageScroll(page)).toBe(true);
    const scrolls = await pickerName(page, 'Ravi').evaluate((el) => {
      for (let e = el.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(e).overflowY)) return true;
      return false;
    });
    expect(scrolls, 'nothing scrolls').toBe(false);
  });

  test('20 names at 320 × 568: two columns that scroll inside their own box; heading and main button stay on screen', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 568 });
    const twenty = [...twelve, 'Sana', 'Vik', 'Lata', 'Jai', 'Pia', 'Raj', 'Uma', 'Ved'];
    await toClues(page, { players: twenty });
    await toTalk(page);
    await toPickerFromTalk(page);
    expect(await noPageScroll(page)).toBe(true);
    await expect(pickerHeading(page)).toBeInViewport({ ratio: 1 });
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
    const a = (await pickerName(page, 'Riya').boundingBox())!, b = (await pickerName(page, 'Arjun').boundingBox())!;
    expect(Math.abs(a.y - b.y), 'two columns').toBeLessThanOrEqual(1);
    await pickerName(page, 'Ved').scrollIntoViewIfNeeded();
    await pickerName(page, 'Ved').click();
    await expect(mainButton(page)).toHaveText(exact('Reveal Ved', ['Ved']));
    await expect(mainButton(page)).toBeInViewport({ ratio: 1 });
  });
});

test.describe('IMP-083 and IMP-084: screen readers, no flashing', () => {
  // v2.2's announcer test (each timed reveal line) is retired: v3.5 IMP-083 lists the result screen's announcements.
  test('the announcer gets the countdown, "Arjun was…" once at t = 0, then at 1.5 s the headline, the impostor line, "The word was Samosa" and the outcome; never the word early', async ({ page }) => {
    await toClues(page);
    await page.evaluate(() => {
      const w = window as any; w.__ann = [];
      const seen = () => { const a = document.querySelector('[data-testid="announcer"]'); const t = (a?.textContent ?? '').trim(); if (t && t !== w.__ann.at(-1)) w.__ann.push(t); };
      new MutationObserver(seen).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    await expect(announcer(page)).toHaveAttribute('aria-live', 'polite');
    await toTalk(page);
    await mainButton(page).filter({ hasText: 'Vote now' }).click();
    for (const n of ['3', '2', '1', 'Point!']) { await page.clock.runFor(1000); await expect(countdown(page)).toHaveText(n); }
    await page.clock.runFor(2000);
    await expect(pickerHeading(page)).toBeVisible();
    await pickerName(page, 'Arjun').click();
    await mainButton(page).click();
    await page.clock.runFor(1000);
    const beforeWord: string[] = await page.evaluate(() => (window as any).__ann);
    for (const t of beforeWord) for (const x of secretTerms(SAMOSA, 'hard')) expect(t.toLowerCase(), 'no secret announced').not.toContain(x.toLowerCase());
    await page.clock.runFor(1000);
    await expect(result(page, 'round-outcome')).toBeVisible();
    const ann: string[] = await page.evaluate(() => (window as any).__ann);
    const tail = ann.filter((t) => !/→|starts/.test(t));
    expect(tail.slice(0, 5)).toEqual(['3', '2', '1', 'Point!', 'Arjun was…']);
    expect(tail.slice(5).join(' ')).toMatch(/^✓ Caught!.*[Aa][Rr][Jj][Uu][Nn] was the impostor.*The word was Samosa.*The crew wins!$/);
    expect(tail.join(' '), 'never announced').not.toMatch(/Tonight:|Also called|Food/);
  });

  test('private-live is assertive and holds the block only while it shows', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await imButton(page, 'Riya').click();
    const live = page.getByTestId('private-live');
    await expect(live).toHaveAttribute('aria-live', 'assertive');
    await expect(live).toHaveText('');
    await press(page);
    await expect(live).toContainText('Samosa');
    await release(page);
    await expect(live).toHaveText('');
  });

  test('no background colour changes more than 3 times in 1 s through the countdown and reveal; same body colour for caught, escaped and still a tie', async ({ page, browser }) => {
    await toClues(page);
    await toTalk(page);
    await page.evaluate(() => {
      const w = window as any; w.__bg = [] as { t: number; k: string; c: string }[];
      setInterval(() => {
        const t = Date.now();
        w.__bg.push({ t, k: 'body', c: getComputedStyle(document.body).backgroundColor });
        document.querySelectorAll('[data-testid]').forEach((el) => w.__bg.push({ t, k: el.getAttribute('data-testid'), c: getComputedStyle(el).backgroundColor }));
      }, 50);
    });
    await mainButton(page).click();
    for (let i = 0; i < 120; i++) await page.clock.runFor(50);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).click();
    for (let i = 0; i < 100; i++) await page.clock.runFor(50);
    const samples: { t: number; k: string; c: string }[] = await page.evaluate(() => (window as any).__bg);
    const byKey = new Map<string, { t: number; c: string }[]>();
    for (const s of samples) byKey.set(s.k, [...(byKey.get(s.k) ?? []), s]);
    for (const [k, list] of byKey) {
      const changes = list.filter((s, i) => i > 0 && s.c !== list[i - 1]!.c).map((s) => s.t);
      for (const t of changes) expect(changes.filter((u) => u >= t && u < t + 1000).length, `${k}: changes in 1 s`).toBeLessThanOrEqual(3);
    }
    const caughtBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const other = await browser.newContext({ timezoneId: TZ, viewport: { width: 390, height: 844 } });
    const p2 = await other.newPage();
    await toClues(p2);
    await toTalk(p2);
    await toPickerFromTalk(p2);
    await pickerName(p2, 'Meena').click();
    await mainButton(p2).click();
    await p2.clock.runFor(7500);
    expect(await p2.evaluate(() => getComputedStyle(document.body).backgroundColor), 'escaped').toBe(caughtBg);
    await other.close();
  });
});

test.describe('IMP-085, IMP-086, IMP-089: kind words, a slipped finger, sounds', () => {
  test('no screen of a whole round says "liar", "loser", "fooled", "stupid" or "bad clue"', async ({ page }) => {
    const texts: string[] = [];
    const grab = async () => texts.push((await page.locator('body').innerText()).toLowerCase());
    await startEvening(page, { seeds: { deals: [DEAL] } });
    await grab();
    await dealAll(page);
    await grab();
    await toTalk(page);
    await grab();
    await toPickerFromTalk(page);
    await grab();
    await pickerName(page, 'Riya').click();
    await mainButton(page).click();
    await page.clock.runFor(7500);
    await grab();
    for (const t of texts) for (const bad of ['liar', 'loser', 'fooled', 'stupid', 'bad clue']) expect(t).not.toContain(bad);
  });

  test('a finger slipping off the pad hides the block at once; the player stays on screen B; nothing else changes', async ({ page }) => {
    await startEvening(page, { seeds: { deals: [DEAL] } });
    const recs = await records(page);
    await imButton(page, 'Riya').click();
    await press(page);
    await expect(privateBlock(page)).toBeVisible();
    const box = (await holdPad(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, Math.max(1, box.y - 120));
    await expect(privateBlock(page)).toHaveCount(0);
    await page.mouse.up();
    await expect(holdPad(page)).toBeVisible();
    await expect(holdPad(page)).toHaveAccessibleName('Hold here to see your word');
    expect(await records(page)).toEqual(recs);
  });

  test('sounds: none during the deal; tick ×3 and ding in the countdown, drumroll at the reveal; chime and drumroll no louder than tick', async ({ page }) => {
    await toClues(page);
    expect(await sounds(page), 'no sound during the deal').toEqual([]);
    await toTalk(page);
    await toPickerFromTalk(page);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).click();
    await page.clock.runFor(500);
    const s = await sounds(page);
    expect(s.map((x) => x.name)).toEqual(['tick', 'tick', 'tick', 'ding', 'drumroll']);
    const tick = s[0]!.gain;
    for (const x of s) if (x.name === 'drumroll' || x.name === 'chime') expect(x.gain).toBeLessThanOrEqual(tick);
  });

  test('IMP-089 sound off (Home → "⋯ Menu" → Settings → "This phone" → "Sound" unticked): no sound at all through the deal, countdown and reveal', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await fromHome(page, 'Settings');
    const thisPhone = page.getByRole('tab', { name: 'This phone', exact: true }).or(page.getByRole('button', { name: 'This phone', exact: true })).first();
    if (await thisPhone.isVisible()) await thisPhone.click();
    const sound = toggle(page, 'Sound');
    await expect(sound).toBeVisible();
    if (await sound.isChecked()) await sound.click();
    await expect(sound).not.toBeChecked();
    const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('pgn.pref.tambola.settings') ?? 'null'));
    expect(settings?.sound, 'the phone\'s sound setting is saved as off').toBe(false);
    // The same phone, sound still off, plays a round.
    await toClues(page, { storage: { 'pgn.pref.tambola.settings': settings } });
    await toTalk(page);
    await toPickerFromTalk(page);
    await pickerName(page, 'Arjun').click();
    await mainButton(page).click();
    await page.clock.runFor(4500);
    expect(await sounds(page), 'no sound with sound off').toEqual([]);
  });
});

test.describe('IMP-100 to IMP-108: after the round', () => {
  test('IMP-101 and IMP-092: the summary (lead line, "Oops, keep playing", "Play something else", "More ›"); "Oops, keep playing" returns to the same result with "Undo"; nothing recorded; summaryShownAt kept', async ({ page }) => {
    const e = await atResult(page);
    const recs = await records(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await expect(page.getByRole('heading', { name: "That's the night!" })).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
    const saved = await onlyEvening(page);
    expect(saved.status).toBe('in-progress');
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.summaryShownAt, `pgn.impostor-ui.${e.id}`)).toEqual(expect.any(Number));
    await expectOneMainButton(page, 'summary', 'Back to Home', true);
    await expect(quiet(page, 'More ›')).toBeVisible();
    let lastY = -Infinity;
    for (const name of ['Oops, keep playing', 'Play something else', 'More ›']) {
      const y = (await quiet(page, name).boundingBox())!.y;
      expect(y, `"${name}" comes after the button above it`).toBeGreaterThan(lastY);
      lastY = y;
    }
    await expect(page.getByTestId('summary-line')).toHaveText(exact('Crew 1 · Impostors 0', []));
    await quiet(page, 'More ›').click();
    expect(await textOf(page.getByRole('menuitem'))).toEqual(['Share', 'History', 'Discard this evening']);
    await expect(page.getByRole('menu').getByRole('separator')).toHaveCount(1);
    await page.keyboard.press('Escape');
    if (await page.getByRole('menuitem').first().isVisible()) await quiet(page, 'More ›').click();
    await quiet(page, 'Oops, keep playing').click();
    await expect(outcome(page)).toHaveText(exact('The crew wins!'));
    await expect(quiet(page, 'Undo')).toBeVisible();
    expect(await records(page)).toEqual(recs);
  });

  test('IMP-102: "Play something else" → "What shall we play?"; Tambola\'s setup arrives with tonight\'s names; the session lists "Impostor · 1 round"', async ({ page }) => {
    await atResult(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await quiet(page, 'Play something else').click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    expect((await onlyEvening(page)).status).toBe('ended');
    await page.getByRole('button', { name: /^Tambola/ }).click();
    await page.getByRole('button', { name: 'New game' }).click();
    const paper = page.getByRole('button', { name: /^Paper tickets/ }).or(page.getByRole('radio', { name: /^Paper tickets/ })).first();
    await paper.click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    for (const [i, n] of P4.entries()) await expect(page.getByLabel(`Name of player ${i + 1}`, { exact: true })).toHaveValue(n);
    await page.goto(HOME);
    await fromHome(page, 'Sessions');
    await page.getByTestId('session').first().click();
    await expect(page.getByTestId('session-game').filter({ hasText: 'Impostor · 1 round' })).toHaveCount(1);
  });

  test('IMP-102 and PLT-024: on a phone with no game tonight, Tambola started from Home still has empty name boxes', async ({ page }) => {
    await phoneWith(page, [], { now: T0 });
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    await chooseTicketType(page, 'paper');
    await page.getByLabel('Number of players').fill('4');
    for (const i of [1, 2, 3, 4]) await expect(page.getByLabel(`Name of player ${i}`, { exact: true })).toHaveValue('');
  });

  test('IMP-102 and PLT-006: an unfinished Tambola setup still comes first after "Play something else"', async ({ page }) => {
    await atResult(page);
    await openTambola(page);
    await page.getByRole('button', { name: 'New game' }).click();
    await chooseTicketType(page, 'paper');
    await fillPlayers(page, ['Zoya', 'Farhan', 'Ira']);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    // The host leaves Tambola's setup unconfirmed and goes back to the Impostor evening.
    await page.goto(HOME);
    await openEvening(page);
    await expect(outcome(page)).toHaveText(exact('The crew wins!'));
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await quiet(page, 'Play something else').click();
    await expect(page.getByRole('heading', { name: 'What shall we play?' })).toBeVisible();
    await page.getByRole('button', { name: /^Tambola/ }).click();
    await page.getByRole('button', { name: 'New game' }).click();
    if (await ticketCard(page, 'paper').isVisible()) await chooseTicketType(page, 'paper');
    await expect(page.getByLabel('Number of players')).toHaveValue('3');
    for (const [i, n] of ['Zoya', 'Farhan', 'Ira'].entries()) await expect(page.getByLabel(`Name of player ${i + 1}`, { exact: true })).toHaveValue(n);
  });

  test('IMP-103 and IMP-105: History shows "Impostor · 1 round" and "Round 1 · Samosa · Arjun caught, wrong guess"; "Play again" brings the players and choices', async ({ page }) => {
    await atResult(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await summaryAction(page, 'History');
    const row = page.getByTestId('history-game').filter({ hasText: 'Impostor' });
    await expect(row).toContainText('Impostor · 1 round');
    await row.click();
    await expect(page.getByTestId('history-round')).toHaveText([exact('Round 1 · Samosa · Arjun caught, wrong guess')]);
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await expect(page.getByRole('heading', { name: "Who's playing?" })).toBeVisible();
    for (const n of P4) await expect(page.getByRole('button', { name: `Remove ${n}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Mode', exact: true }).getByRole('button', { name: /Easy/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('IMP-105 scored: the round\'s points follow on their own line', async ({ page }) => {
    await atResult(page, { score: true });
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await summaryAction(page, 'History');
    await page.getByTestId('history-game').filter({ hasText: 'Impostor' }).click();
    await expect(page.getByTestId('history-round').first()).toContainText('Round 1 · Samosa · Arjun caught, wrong guess');
    await expect(page.getByTestId('history-round').first()).toContainText('+1 each: Riya, Meena, Kabir');
  });

  test('IMP-106: Share sends the exact text once; without navigator.share it copies and says "Copied. Paste it into any chat."', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any; w.__shared = [];
      Object.defineProperty(navigator, 'share', { configurable: true, value: (d: any) => { w.__shared.push(d); return Promise.resolve(); } });
    });
    await atResult(page, { rounds: 2 });
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await summaryAction(page, 'Share');
    await expect.poll(() => page.evaluate(() => (window as any).__shared.length)).toBe(1);
    const shared = await page.evaluate(() => (window as any).__shared[0].text);
    expect(shared).toBe(['Impostor night · 2 rounds', 'Impostor caught 2 · escaped 0', 'Words: Samosa, Pani puri'].join('\n'));
    await expect(page.getByRole('heading', { name: "That's the night!" })).toBeVisible();
  });

  test('IMP-106 fallback: the clipboard and the toast for 4 s', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any; w.__copied = [];
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t: string) => { w.__copied.push(t); return Promise.resolve(); } } });
    });
    await atResult(page);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await freezeClock(page);
    await summaryAction(page, 'Share');
    await expect.poll(() => page.evaluate(() => (window as any).__copied.length)).toBe(1);
    expect(await page.evaluate(() => (window as any).__copied[0])).toBe(['Impostor night · 1 round', 'Impostor caught 1 · escaped 0', 'Words: Samosa'].join('\n'));
    const toast = page.getByTestId('toast');
    await expect(toast).toHaveText(exact('Copied. Paste it into any chat.', []));
    await page.clock.runFor(3900);
    await expect(toast).toBeVisible();
    await page.clock.runFor(200);
    await expect(toast).toHaveCount(0);
  });

  test('IMP-107: "This word didn\'t work": toast "Samosa won\'t come up again · Undo", recorded; "Undo" brings the button back; Settings lists it', async ({ page }) => {
    await atResult(page);
    const before = (await records(page)).length;
    await quiet(page, "This word didn't work").click();
    const toast = page.getByTestId('undo-toast');
    await expect(toast).toHaveText(/^\s*Samosa won't come up again ·\s*Undo\s*$/);
    await expect(quiet(page, "This word didn't work")).toHaveCount(0);
    expect((await records(page)).slice(before)).toEqual([{ type: 'wordDidntWork', blocked: true }]);
    await toast.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(quiet(page, "This word didn't work")).toBeVisible();
    expect((await records(page)).slice(before)).toEqual([{ type: 'wordDidntWork', blocked: true }, { type: 'wordDidntWork', blocked: false }]);
    await quiet(page, "This word didn't work").click();
    await fromMenu(page, 'Settings');
    await expect(page.getByRole('heading', { name: 'Skipped words (1)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bring back Samosa', exact: true })).toBeVisible();
  });

  test('IMP-108: from "Who\'s playing?" to the summary, no request leaves the app\'s own origin, and none carries a name or word', async ({ page }) => {
    const bad: string[] = [];
    let origin = '';
    page.on('request', (r) => {
      if (!origin) return;
      const u = r.url();
      const text = `${u} ${r.postData() ?? ''}`.toLowerCase();
      if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) bad.push(`other origin: ${u}`);
      for (const s of [...P4, 'samosa', 'tea time']) if (text.includes(s.toLowerCase())) bad.push(`"${s}" in ${u}`);
    });
    await phoneWith(page, [], { now: T0 });
    origin = new URL(page.url()).origin;
    await toClues(page);
    await toTalk(page);
    await toPickerFromTalk(page);
    await pickerName(page, 'Riya').click();
    await mainButton(page).click();
    await page.clock.runFor(7500);
    await fromMenu(page, 'End the evening');
    await page.getByRole('dialog').getByRole('button', { name: 'End the evening', exact: true }).click();
    await expect(page.getByRole('heading', { name: "That's the night!" })).toBeVisible();
    expect(bad).toEqual([]);
  });
});

test('IMP-100: when the result appears nothing secret is left unrevealed (the word shown) and the wake lock is let go', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any; w.__wake = [];
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: (t: string) => { w.__wake.push(`request ${t}`); const l = { released: false, addEventListener() {}, removeEventListener() {}, release() { w.__wake.push('release'); l.released = true; return Promise.resolve(); } }; return Promise.resolve(l); } } });
  });
  await toClues(page);
  await toTalk(page);
  await toPickerFromTalk(page);
  await pickerName(page, 'Riya').click();
  await mainButton(page).click();
  await page.clock.runFor(7500);
  await expect(outcome(page)).toBeVisible();
  await expect.poll(async () => (await page.evaluate(() => (window as any).__wake as string[])).includes('release')).toBe(true);
  await expect(result(page, 'result-word')).toHaveText(exact('Samosa', []));
  await expect(result(page, 'result-impostor')).toHaveText(exact('Arjun was the impostor'));
});
