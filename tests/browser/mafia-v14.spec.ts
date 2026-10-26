// Mafia scenarios Version 1.4 (product owner, 26 October 2026; owner away) for the 1.6.2 point release:
// docs/games/mafia/scenarios.md "Version 1.4", copied into specs/mafia/ under each scenario it names. Texts from
// docs/games/mafia/text.csv. Written before the build.
//  - item 2, MAF-091: after the night's last pick and before "Read the morning", a resume opens N3 ("Night over.").
//  - item 3, MAF-026: the Villager's result line "You think it's Zoya. The best Mafia spotter is named at the end."
//  - item 5, MAF-060: G1 pins "Play again" and "End for tonight"; "Change players or roles" and "← Home" scroll with the page.
//  - item 6, MAF-011 / MAF-012 / MAF-023 / MAF-026 / MAF-032: wording for weak-English readers ("is out", "Your guess",
//    "Everyone still playing").
//  - item 7, MAF-006: How to play's new line `mf.s4.4`.
// Kept with them: MAF-P7 (every role's N2 the same frame, the new lines sized for every role) and MAF-P2 (none of the new
// private lines on a room screen). Item 4 (MAF-064) is pinned in tests/games/mafia/saved.test.ts and mafia-walk.spec.ts.
// Example deal: Mafia Arjun and Zoya; Doctor Meena; Police Dev. Flows: tests/games/mafia/flows.ts. Helpers: mafia.ts.
import { expect, test, type Locator, type Page } from './fixtures';
import {
  EXAMPLE_DEAL, NINE, button, byId, exactly, fromMenu, heading, mainButton, nameButton, openDeal, openFlow, pad,
  playNight, roomDump, tap, toMorning, toRoles, waitGuards, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

/** text.csv, Version 1.4. */
const V14 = {
  mafiaCard: 'At night, you pick who is out. By day, act like a Villager.',                       // mf.b2-mafia.6
  mafiaFirstTime: 'At night, pick who is out.',                                                   // mf.b2-first-time.2
  mafiaJob: (see: string) => `MAFIA · Pick who is out tonight. ${see} will see your pick.`,       // mf.n2-mafia.1
  mafiaJobAlone: 'MAFIA · Pick who is out tonight.',                                              // mf.n2-mafia.2
  villagerResult: (n: string) => `You think it's ${n}. The best Mafia spotter is named at the end.`,   // mf.n2-villager.2
  ghostJob: "YOU'RE OUT · Your guess: who is Mafia? Pick one.",                                   // mf.n2-villager.3
  countdown: 'Everyone still playing: point at who you think is Mafia.',                          // mf.v1.1
  howToPlay: "Need to stop during someone's turn? Let them finish, or close the app: the game is saved.",   // mf.s4.4
};
/** Words Version 1.4 retires from these screens. */
const OLD = /goes out tonight|pick who goes out|Ghost guess|who's Mafia\?|At the end we'll see|Everyone in, point/i;
/** Text only N2's new private lines hold (MAF-P2: never on a room screen). */
const PRIVATE_V14 = /best Mafia spotter is named at the end|Pick who is out tonight|Your guess: who is Mafia|pick who is out/i;

// ---- Item 6: the role card and "First time?" (MAF-011, MAF-012) ----

test('MAF-011 / MAF-012 Version 1.4 item 6: the Mafia\'s card reads "At night, you pick who is out."; First time? reads "At night, pick who is out."', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  await tap(page, mainButton(page));                       // I'm Riya
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  await tap(page, pad(page));
  await tap(page, mainButton(page));                       // Done, pass to Arjun
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
  await tap(page, button(page, "I'm Arjun"));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  const block = byId(page, 'private-block');
  await expect(byId(page, 'private-word')).toHaveText(exactly('MAFIA'));
  await expect(block.getByText(exactly('You and Zoya are the Mafia.'))).toBeVisible();
  await expect(block.getByText(exactly(V14.mafiaCard))).toBeVisible();
  await tap(page, button(page, 'First time? What this role means'));
  for (const l of ['Your side wins when the Mafia are as many as everyone else.', V14.mafiaFirstTime, 'By day, join in and point at others. Stay calm!']) {
    await expect(block.getByText(exactly(l)), l).toBeVisible();
  }
  expect(await block.innerText(), 'no retired wording on the card').not.toMatch(OLD);
  // Every card keeps the same height with the new line (MAF-011 item 20, MAF-P7 for the card): Arjun's with First time?
  // hidden equals Riya's (checked in mafia-deal-night.spec.ts for every role); here only that it hides with the role.
  await tap(page, pad(page));
  await expect(block.getByText(exactly(V14.mafiaFirstTime))).toHaveCount(0);
  expect(await roomDump(page), 'the card hidden: none of its lines in the page').not.toMatch(PRIVATE_V14);
});

// ---- Items 3 and 6 with MAF-P7 and MAF-P2: every role's N2 on nights 1 and 3 ----

const FRAME_IDS = ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button'];
type Frame = Record<string, string>;
/**
 * Every box of N2 (x, y, width, height to the pixel; "hidden" when not shown), the pad included, read in one go (one
 * round trip, so the long walks below stay quick on a busy machine).
 */
async function frame(page: Page): Promise<Frame> {
  return page.evaluate((ids) => {
    const out: Record<string, string> = {};
    const rect = (el: Element | null | undefined) => {
      if (!el) return 'hidden';
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 && r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return 'hidden';
      return [r.x, r.y, r.width, r.height].map((v) => Math.round(v)).join(',');
    };
    for (const id of ids) out[id] = rect(document.querySelector(`[data-testid="${id}"]`));
    out.pad = rect(Array.from(document.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim() === 'Tap to hide'));
    return out;
  }, FRAME_IDS);
}
function sameFrame(a: Frame, b: Frame, what: string) {
  for (const id of Object.keys(a)) {
    const x = a[id]!, y = b[id]!;
    if (x === 'hidden' || y === 'hidden') { expect.soft(y, `${what}: ${id}`).toBe(x); continue; }
    const xs = x.split(',').map(Number), ys = y.split(',').map(Number);
    for (let i = 0; i < 4; i++) expect.soft(Math.abs(xs[i]! - ys[i]!), `${what}: ${id} ${['x', 'y', 'width', 'height'][i]} (${x} vs ${y})`).toBeLessThanOrEqual(1);
  }
}
/** The text is wholly inside its box (glyphs may poke 1–2 px out on WebKit; a line that doesn't fit is ~20 px out). */
const fits = (l: Locator) => l.evaluate((el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const t = range.getBoundingClientRect(), b = el.getBoundingClientRect();
  return el.scrollHeight <= el.clientHeight + 1 && t.bottom <= b.bottom + 3 && t.right <= b.right + 3 && t.top >= b.top - 3;
});

interface Turn { who: string; job: string; pick: string; result: string }
/** Night 1 of the example (night order Riya … Neha), every role, the picks of NIGHT_1. */
const NIGHT1_TURNS: Turn[] = [
  { who: 'Riya', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Arjun', result: V14.villagerResult('Arjun') },
  { who: 'Arjun', job: V14.mafiaJob('Zoya'), pick: 'Kabir', result: 'Kabir. Zoya can agree or change it.' },
  { who: 'Meena', job: 'DOCTOR · Pick someone to protect tonight.', pick: 'Meena', result: 'You are protected tonight.' },
  { who: 'Kabir', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Zoya', result: V14.villagerResult('Zoya') },
  { who: 'Zoya', job: "MAFIA · Arjun's pick: KABIR. Tap Kabir to agree, or pick someone else.", pick: 'Kabir', result: 'Kabir. You agree.' },
  { who: 'Dev', job: 'POLICE · Pick someone to check.', pick: 'Zoya', result: 'Zoya: MAFIA.' },
  { who: 'Om', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Arjun', result: V14.villagerResult('Arjun') },
];
/** Night 3 of the example (order Meena … Arjun; Kabir, Zoya and Om are out; Arjun is the only Mafia left), the picks of NIGHT_3. */
const NIGHT3_TURNS: Turn[] = [
  { who: 'Meena', job: 'DOCTOR · Pick someone to protect tonight.', pick: 'Sunita', result: 'Sunita is protected tonight.' },
  { who: 'Kabir', job: V14.ghostJob, pick: 'Arjun', result: 'Your guess: Arjun.' },
  { who: 'Zoya', job: V14.ghostJob, pick: 'Riya', result: 'Your guess: Riya.' },
  { who: 'Dev', job: 'POLICE · Pick someone to check.', pick: 'Sunita', result: 'Sunita: Not Mafia.' },
  { who: 'Om', job: V14.ghostJob, pick: 'Arjun', result: 'Your guess: Arjun.' },
  { who: 'Sunita', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Arjun', result: V14.villagerResult('Arjun') },
  { who: 'Neha', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Arjun', result: V14.villagerResult('Arjun') },
  { who: 'Riya', job: 'VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.', pick: 'Arjun', result: V14.villagerResult('Arjun') },
  { who: 'Arjun', job: V14.mafiaJobAlone, pick: 'Meena', result: 'Meena.' },
];

/** Plays `turns` on screen: the exact job and result lines, both fitting their boxes; the frames before and after the pick. */
async function playTurns(page: Page, turns: Turn[], where: string) {
  const before: { who: string; f: Frame }[] = [], after: { who: string; f: Frame }[] = [];
  for (const t of turns) {
    await expect(byId(page, 'pass-name')).toHaveText(exactly(t.who));
    // MAF-P2: the pass screen (a room screen) holds none of the new private lines.
    expect(await roomDump(page), `${where}: ${t.who}'s pass screen`).not.toMatch(PRIVATE_V14);
    await tap(page, button(page, `I'm ${t.who}`));
    await tap(page, button(page, 'Tap to see your night job'));
    await waitGuards(page, 600);
    await expect(byId(page, 'job-line'), `${where}: ${t.who}'s job line`).toHaveText(exactly(t.job));
    expect.soft(await fits(byId(page, 'job-line')), `${where}: ${t.who}'s job line fits its box`).toBe(true);
    before.push({ who: t.who, f: await frame(page) });
    await nameButton(page, t.pick).click({ force: true });
    await expect(byId(page, 'result-line'), `${where}: ${t.who}'s result line`).toHaveText(exactly(t.result));
    await page.clock.runFor(4100);
    await expect(mainButton(page)).toBeVisible();
    expect.soft(await fits(byId(page, 'result-line')), `${where}: ${t.who}'s result line "${t.result}" fits its box`).toBe(true);
    after.push({ who: t.who, f: await frame(page) });
    expect(await page.locator('body').innerText(), `${where}: ${t.who}'s N2 has no retired wording`).not.toMatch(OLD);
    await tap(page, mainButton(page));
  }
  for (const set of [before, after]) for (const x of set) sameFrame(set[0]!.f, x.f, `${where}: ${x.who} vs ${set[0]!.who} (${set === before ? 'before' : 'after'} the pick)`);
}

for (const o of [
  { viewport: { width: 320, height: 568 }, larger: false },
  { viewport: { width: 320, height: 568 }, larger: true },
  { viewport: { width: 390, height: 844 }, larger: false },
]) {
  const at = `${o.viewport.width} × ${o.viewport.height}${o.larger ? ', Larger text' : ''}`;
  test(`MAF-022 to MAF-026 / MAF-P7 / MAF-P2 Version 1.4 items 3 and 6, night 1 at ${at}: every role's new job and result lines (Villager, first and later Mafia, Doctor, Police), each fitting its box, the same frame for every role, none on a room screen`, async ({ page }) => {
    test.setTimeout(240_000);
    await openFlow(page, 'night1-start', o);
    await tap(page, mainButton(page));                   // Start the night
    await playTurns(page, NIGHT1_TURNS, `night 1, ${at}`);
  });
  test(`MAF-026 / MAF-023 / MAF-P7 / MAF-P2 Version 1.4 item 6, night 3 at ${at}: "Your guess: who is Mafia?" for players who are out, the lone Mafia's "Pick who is out tonight.", the same frame for every role, none on a room screen`, async ({ page }) => {
    test.setTimeout(240_000);
    await openFlow(page, 'night3-meena', o);
    await playTurns(page, NIGHT3_TURNS, `night 3, ${at}`);
    await expect(heading(page, 'Night over.')).toBeVisible();
    expect(await roomDump(page), 'N3').not.toMatch(PRIVATE_V14);
  });
}

// ---- Item 6: the countdown (MAF-032) ----

test('MAF-032 Version 1.4 item 6: the countdown reads "Everyone still playing: point at who you think is Mafia."', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await tap(page, mainButton(page));                     // Start talking
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  await tap(page, mainButton(page));                     // Time to vote
  await expect(byId(page, 'countdown-heading')).toHaveText(exactly(V14.countdown));
  expect(await page.locator('body').innerText()).not.toMatch(OLD);
});

// ---- Item 7: How to play's new line (MAF-006) ----

async function expectHowToPlayLine(page: Page, where: string) {
  await expect(heading(page, 'How to play')).toBeVisible();
  const line = page.getByText(exactly(V14.howToPlay));
  await expect(line, `${where}: the line once`).toHaveCount(1);
  await line.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(line, `${where}: the line can be read`).toBeVisible();
  // The earlier lines stay (MAF-006, MF15).
  await expect(page.getByText(exactly("Saw someone's screen? Keep it to yourself and carry on. Before the first night, Deal again instead.")), where).toHaveCount(1);
}

test('MAF-006 Version 1.4 item 7: How to play from Roles has "Need to stop during someone\'s turn? Let them finish, or close the app: the game is saved."; Done returns', async ({ page }) => {
  await toRoles(page, NINE);
  await tap(page, button(page, 'How to play'));
  await expectHowToPlayLine(page, 'from Roles');
  for (const n of NINE) await expect(page.getByText(new RegExp(`\\b${n}\\b`))).toHaveCount(0);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Roles for 9 players')).toBeVisible();
});

test('MAF-006 Version 1.4 item 7: How to play from the menu at night (Night begins) has the new line, at 320 × 568 with Larger text too', async ({ page }) => {
  await openFlow(page, 'night1-start', { viewport: { width: 320, height: 568 }, larger: true });
  await expect(heading(page, 'Night 1')).toBeVisible();
  await fromMenu(page, 'How to play');
  await expectHowToPlayLine(page, 'from the menu on N0, Larger text');
  await tap(page, mainButton(page));
  await expect(heading(page, 'Night 1')).toBeVisible();
});

// ---- Item 2: a resume after the night's last pick opens N3 (MAF-091) ----

async function expectN3Resumed(page: Page, night: number, where: string) {
  await expect(heading(page, 'Night over.'), `${where}: resumes on Night over`).toBeVisible();
  await expect(page.getByText(exactly('Welcome back.')), where).toBeVisible();
  await expect(byId(page, 'where-line'), where).toHaveText(exactly(`Night ${night} · over`));
  await expect(page.getByText(exactly('Host, take the phone and read the morning aloud.')), where).toBeVisible();
  await expect(mainButton(page), where).toHaveText(exactly('Read the morning'));
  // The morning has not shown: no story, no role line, no count line.
  await expect(heading(page, /^Morning, day \d+$/i), where).toHaveCount(0);
  for (const id of ['story', 'role-line', 'count-line']) await expect(byId(page, id), `${where}: ${id}`).toHaveCount(0);
  expect(await roomDump(page), `${where}: nothing of the morning or a role`).not.toMatch(/\bwas (a Villager|MAFIA|the Doctor|the Police)\b|players left/i);
}

test('MAF-091 Version 1.4 item 2: a game night saved after the night\'s last pick resumes on Night over ("Night 1 · over"), then "Read the morning" opens Morning, day 1', async ({ page }) => {
  await openFlow(page, 'morning1');
  await expectN3Resumed(page, 1, 'game 1, night 1');
  await page.reload();
  await expectN3Resumed(page, 1, 'reloaded on Night over');
  await tap(page, mainButton(page));
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
  await expect(byId(page, 'role-line')).toHaveText(exactly('Kabir was a Villager.'));
});

test('MAF-091 Version 1.4 item 2: a reload right after the last player\'s "Done, night over" opens Night over, not the morning', async ({ page }) => {
  await openFlow(page, 'night1-meena');
  await playNight(page, { Meena: 'Meena', Kabir: 'Zoya', Zoya: 'Kabir', Dev: 'Zoya', Om: 'Arjun', Sunita: 'Riya', Neha: 'Om' });
  await expect(heading(page, 'Night over.')).toBeVisible();
  await page.reload();
  await expectN3Resumed(page, 1, 'reload after the last pick');
});

test('MAF-091 Version 1.4 item 2: in game 2, after night 1\'s last pick, the resume opens Night over too', async ({ page }) => {
  await openFlow(page, 'game2-morning1');
  await expectN3Resumed(page, 1, 'game 2, night 1');
  await toMorning(page);
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
});

// ---- Item 5: G1's pinned buttons (MAF-060, guidelines 46a and 47a) ----

/** Where each thing sits now (y, height), with the main button found by its role. */
async function g1Places(page: Page) {
  const out: Record<string, { y: number; h: number }> = {};
  const things: [string, Locator][] = [
    ['Who was who', heading(page, 'Who was who')],
    ['Play again', mainButton(page)],
    ['End for tonight', button(page, 'End for tonight')],
    ['Change players or roles', button(page, 'Change players or roles')],
    ['← Home', button(page, '← Home')],
  ];
  for (const [k, l] of things) {
    const b = await l.boundingBox();
    expect(b, `${k} is on the page`).not.toBeNull();
    out[k] = { y: b!.y, h: b!.height };
  }
  return out;
}
/** No point of the element has something else on top (a clipped or off-screen part counts as covered). */
const uncovered = (l: Locator) => l.evaluate((el) => {
  const r = el.getBoundingClientRect();
  for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.2, 0.5, 0.8]) {
    const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
    if (!hit || !el.contains(hit)) return false;
  }
  return true;
});
async function scrollG1(page: Page, to: 'top' | 'end') {
  await page.evaluate((end) => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el.scrollTop = end ? el.scrollHeight : 0;
    }
    window.scrollTo(0, end ? document.documentElement.scrollHeight : 0);
  }, to === 'end');
  await waitGuards(page, 600);
}
/** At the top and at the end of G1: "Play again" and "End for tonight" stay put, on screen, uncovered; the other two move with the page. */
async function expectG1Pins(page: Page, where: string) {
  const vp = page.viewportSize()!;
  await scrollG1(page, 'top');
  const top = await g1Places(page);
  for (const k of ['Play again', 'End for tonight']) {
    const l = k === 'Play again' ? mainButton(page) : button(page, k);
    expect(top[k]!.y >= -0.5 && top[k]!.y + top[k]!.h <= vp.height + 0.5, `${where}: "${k}" on screen at the top of G1`).toBe(true);
    expect(await uncovered(l), `${where}: "${k}" uncovered at the top of G1`).toBe(true);
  }
  await scrollG1(page, 'end');
  const end = await g1Places(page);
  const moved = top['Who was who']!.y - end['Who was who']!.y;
  expect(moved, `${where}: G1 is longer than the screen (the page scrolled ${Math.round(moved)} px)`).toBeGreaterThan(20);
  for (const k of ['Play again', 'End for tonight']) {
    const l = k === 'Play again' ? mainButton(page) : button(page, k);
    expect.soft(Math.abs(end[k]!.y - top[k]!.y), `${where}: "${k}" is pinned (moved ${Math.round(top[k]!.y - end[k]!.y)} px while the page moved ${Math.round(moved)})`).toBeLessThanOrEqual(1);
    expect.soft(end[k]!.y >= -0.5 && end[k]!.y + end[k]!.h <= vp.height + 0.5, `${where}: "${k}" on screen at the end of G1`).toBe(true);
    expect.soft(await uncovered(l), `${where}: "${k}" uncovered at the end of G1`).toBe(true);
  }
  for (const k of ['Change players or roles', '← Home']) {
    expect.soft(Math.abs((top[k]!.y - end[k]!.y) - moved), `${where}: "${k}" scrolls with the page (moved ${Math.round(top[k]!.y - end[k]!.y)} px, the page ${Math.round(moved)})`).toBeLessThanOrEqual(1);
    const l = button(page, k);
    await l.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await waitGuards(page, 300);
    expect.soft(await uncovered(l), `${where}: "${k}" can be reached with nothing on top`).toBe(true);
  }
}

for (const o of [
  { viewport: { width: 360, height: 640 }, larger: false },
  { viewport: { width: 320, height: 568 }, larger: false },
  { viewport: { width: 320, height: 568 }, larger: true },
  { viewport: { width: 812, height: 375 }, larger: false },
]) {
  const at = `${o.viewport.width} × ${o.viewport.height}${o.larger ? ', Larger text' : ''}`;
  test(`MAF-060 Version 1.4 item 5 at ${at}: Game over pins "Play again" and "End for tonight"; "Change players or roles" and "← Home" scroll with the page`, async ({ page }) => {
    await openFlow(page, 'game1-over', o);
    await expect(heading(page, 'The Village wins!')).toBeVisible();
    await tap(page, button(page, 'What happened each night'));
    await expect(page.getByText(/^\s*Night \d+: /)).toHaveCount(3);
    await expectG1Pins(page, at);
  });
}

test('MAF-060 Version 1.4 item 5: on Game over reached by "End the game" (no winner, not a resume), the same two buttons are pinned', async ({ page }) => {
  await openFlow(page, 'morning1', { viewport: { width: 320, height: 568 }, larger: true });
  await toMorning(page);
  await tap(page, button(page, 'End the game'));
  const d = page.getByRole('dialog').filter({ hasText: 'End this game with no winner?' });
  await tap(page, d.getByRole('button', { name: 'End the game', exact: true }));
  await expect(page.getByText(exactly('Game ended. No winner.'))).toBeVisible();
  await page.clock.runFor(15_000);                        // the "Game ended · Undo" toast goes (Version 1.2 B)
  await expect(heading(page, 'Who was who')).toBeVisible();
  await expectG1Pins(page, '320 × 568, Larger text, after End the game');
});
