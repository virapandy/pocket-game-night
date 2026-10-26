// Mafia release candidate, player walk of 25 October (lane-q): failing tests first for what the walk found.
// 1. MAF-016 (MAF-P2), MAF-063, MAF-064: after "Play again", End for tonight in the middle of game 2 must not reveal any
//    role from game 2 on Tonight's summary (G2): game 2 isn't over ("Oops, keep playing" returns to it), so its players
//    are still in. "Arjun was Mafia in 2 games" counts game 2's deal: a leak. (How many games and players G2 counts is
//    MAF-064 item 15's call, not tested here: see docs/test-questions.md. Version 1.4 item 4 confirms: counts as item 15;
//    "was Mafia in N games" counts ended games only, also pinned in tests/games/mafia/saved.test.ts.)
// 2. MAF-060, MAF-080, UX guideline 46a: G1 scrolls as one page (Version 1.4 item 5: "Play again" and "End for tonight"
//    pinned, the other two scroll with it, tested in mafia-v14.spec.ts); every night's line and the tally can be reached
//    and nothing sits under the pinned buttons; while more is below, a visible "More below" cue shows (the What Am I?
//    pattern, orchestrator 25 October).
// 3. MAF-051, MAF-080: the Players sheet after adding a name: no control is covered (the "Done" bar covered the name box).
// 4. MAF-014 / MAF-011 (orchestrator's call, second walk, privacy hygiene): "Someone saw my role" tapped while the role
//    shows hides it at once: behind "Deal again?" the card is back to hidden and nothing of the role is in the page.
// 5. MAF-033 / MAF-034 / MAF-080 (orchestrator's call, third walk): the vote picker (V2, and V2t "Tap everyone who is
//    tied") shows a visible "More below" cue whenever a name is cut off below; N2's names box: tests/browser/mafia-c3.spec.ts
//    (MAF-P7 frame comparison).
// Flows: tests/games/mafia/flows.ts ("game2-night1-kabir", "game2-morning1", "game1-over", "morning1"). Helpers: mafia.ts.
import { expect, test, type Locator, type Page } from './fixtures';
import {
  button, byId, clipState, exactly, fromMenu, heading, mainButton, moreBelowCue, nameButton, NINE, openFlow, pad, roomDump, tap, toMorning, TZ, waitGuards,
} from './mafia';

test.use({ timezoneId: TZ });

/** Points across the element's box where something else is on top (25 points; a clipped part counts as covered). */
async function coveredPoints(l: Locator): Promise<string[]> {
  return l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const out: string[] = [];
    for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      for (const fy of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !el.contains(hit)) {
          const t = hit ? (hit.closest<HTMLElement>('button')?.innerText ?? hit.textContent ?? '').trim().slice(0, 30) : 'nothing (off screen)';
          out.push(`(${Math.round(x)}, ${Math.round(y)}) under ${hit?.tagName ?? ''} "${t}"`);
        }
      }
    }
    return out;
  });
}
/** Scrolls `l` to the middle of whatever scrolls it, then: wholly on the screen and nothing on top of it. */
async function expectReachable(page: Page, l: Locator, what: string) {
  await l.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const b = await l.boundingBox();
  const vp = page.viewportSize()!;
  expect(b, `${what}: on the page`).not.toBeNull();
  expect(b!.y >= -0.5 && b!.y + b!.height <= vp.height + 0.5, `${what}: wholly on the screen (y ${Math.round(b!.y)}, h ${Math.round(b!.height)})`).toBe(true);
  expect(await coveredPoints(l), `${what}: nothing on top of it`).toEqual([]);
}
/** How far each thing that scrolls (the page included) can still scroll down, px; only those with more than 4 px. */
async function moreBelow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const root = document.scrollingElement ?? document.documentElement;
    const rootLeft = root.scrollHeight - window.innerHeight - window.scrollY;
    if (rootLeft > 4) out.push(`page ${Math.round(rootLeft)}`);
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const s = getComputedStyle(el);
      if (!/(auto|scroll)/.test(s.overflowY) || el.clientHeight === 0) continue;
      const left = el.scrollHeight - el.clientHeight - el.scrollTop;
      if (left > 4) out.push(`${el.tagName}.${el.className} ${Math.round(left)}`);
    }
    return out;
  });
}
async function scrollAllToEnd(page: Page) {
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await waitGuards(page, 600);
}
const cue = (page: Page) => page.getByText(/More below/i);
const nightLines = (page: Page) => page.getByText(/^\s*Night \d+: /);

// ---- 1. Privacy: G2 after End for tonight in the middle of game 2 (MAF-016 / MAF-P2, MAF-063, MAF-064) ----

/** Menu → End for tonight → the dialog's mid-game words → "End for tonight" → Tonight's summary. */
async function endTonightMidGame(page: Page) {
  await fromMenu(page, 'End for tonight');
  const d = page.getByRole('dialog').filter({ hasText: 'End for tonight?' });
  await expect(d.getByText(exactly("Tonight's score stays in History. This game won't count for either side."))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'End for tonight', exact: true }));
  await expect(heading(page, "Tonight's Mafia")).toBeVisible();
  await waitGuards(page);
}
/** Nothing on G2 tells a role from game 2 (Arjun and Om Mafia, Sunita Doctor, Neha Police; game 1 is the only game over). */
async function expectNoGame2Role(page: Page, when: string) {
  const dump = await roomDump(page);
  expect(dump, `${when}: "… was Mafia in 2 games" counts game 2, which isn't over`).not.toMatch(/was Mafia in \d+ games?/i);
  for (const n of NINE) {
    expect(dump, `${when}: a role next to ${n}`).not.toMatch(new RegExp(`\\b${n}\\b[^\\n]{0,40}\\b(Mafia|Doctor|Police|Villager)\\b`, 'i'));
  }
  // Game 1's facts only (MAF-064): the score of the one game with a winner, and game 1's spotter.
  await expect(page.getByText(exactly('Village 1 · Mafia 0'))).toBeVisible();
  // Game 2 isn't over: "Oops, keep playing" returns to it, so its players are still in (MAF-063).
  await expect(button(page, 'Oops, keep playing')).toBeVisible();
}

test('MAF-016 / MAF-064: End for tonight during game 2\'s night shows no role from game 2 on Tonight\'s summary (no "Arjun was Mafia in 2 games")', async ({ page }) => {
  await openFlow(page, 'game2-night1-kabir');
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Kabir'));
  await endTonightMidGame(page);
  await expectNoGame2Role(page, 'night 1 of game 2');
  await tap(page, button(page, 'Oops, keep playing'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Kabir'));
});

test('MAF-016 / MAF-064: End for tonight during game 2\'s day shows no role from game 2 on Tonight\'s summary', async ({ page }) => {
  await openFlow(page, 'game2-morning1');
  await toMorning(page);
  await tap(page, mainButton(page));   // "Start talking"
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  await endTonightMidGame(page);
  await expectNoGame2Role(page, 'day 1 of game 2');
  await tap(page, button(page, 'Oops, keep playing'));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
});

// ---- 2. G1 scrolls as one page; every line reachable; a cue while more is below (MAF-060, MAF-080, guideline 46a) ----

for (const vp of [{ width: 360, height: 640 }, { width: 320, height: 568 }, { width: 812, height: 375 }]) {
  test(`MAF-060 / MAF-080 at ${vp.width}×${vp.height}: Game over scrolls as one page; every night's line and the tally reachable, none under the pinned buttons; "More below" while more is below`, async ({ page }) => {
    await openFlow(page, 'game1-over', { viewport: vp });
    await expect(heading(page, 'The Village wins!')).toBeVisible();
    await tap(page, button(page, 'What happened each night'));
    await expect(nightLines(page)).toHaveCount(3);
    await page.evaluate(() => { window.scrollTo(0, 0); for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) el.scrollTop = 0; });
    await waitGuards(page, 600);

    // While anything can scroll further down, a visible cue says so.
    const below = await moreBelow(page);
    if (below.length) {
      // Soft (the test still fails), so one run also reports the checks below.
      await expect.soft(cue(page).first(), `more below (${below.join("; ")}) but no "More below" cue`).toBeVisible({ timeout: 2000 });
      if (await cue(page).count()) expect.soft(await coveredPoints(cue(page).first()), 'the cue is not covered').toEqual([]);
    }

    // The night lines scroll with the page (one scroll for the whole screen, guideline 46a): the nearest thing that
    // scrolls a night line also scrolls the heading.
    for (let i = 0; i < 3; i++) {
      const one = await nightLines(page).nth(i).evaluate((el) => {
        const h1 = document.querySelector('h1');
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (/(auto|scroll)/.test(s.overflowY) && a.scrollHeight > a.clientHeight + 1) return !!h1 && a.contains(h1);
        }
        return true;   // the page itself scrolls it
      });
      expect.soft(one, `night ${i + 1}'s line scrolls in a box of its own, not with the page`).toBe(true);
    }

    // Every night's line, every fun line and the tally can be brought on screen with nothing on top.
    for (let i = 0; i < 3; i++) await expectReachable(page, nightLines(page).nth(i), `night ${i + 1}'s line`);
    for (const t of ['Best Mafia spotter: Riya picked a Mafia 3 nights out of 3', 'Best ghost guess: Kabir', 'Tonight: Village 1 · Mafia 0']) {
      await expectReachable(page, page.getByText(exactly(t)), t);
    }

    // At the very end nothing sits under the pinned buttons, and the cue has gone.
    await scrollAllToEnd(page);
    const tally = page.getByText(exactly('Tonight: Village 1 · Mafia 0'));
    expect(await coveredPoints(tally), 'scrolled to the end, the tally is not under the pinned buttons').toEqual([]);
    for (const q of ['Change players or roles', 'End for tonight', '← Home', 'Play again']) {
      const b = q === 'Play again' ? mainButton(page) : button(page, q);
      await b.evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
      expect(await coveredPoints(b), `"${q}" is not covered`).toEqual([]);
    }
    expect(await moreBelow(page), 'nothing more below at the end').toEqual([]);
    await expect(cue(page)).toBeHidden();
  });
}

// ---- 3. Players sheet: no control covered after adding a name (MAF-051, MAF-080) ----

for (const vp of [{ width: 360, height: 640 }, { width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`MAF-051 / MAF-080 at ${vp.width}×${vp.height}: after adding a name in Players, the name box and every button are on screen with nothing on top`, async ({ page }) => {
    await openFlow(page, 'morning1', { viewport: vp });
    await toMorning(page);
    await fromMenu(page, 'Players');
    const field = page.getByLabel('Player name', { exact: true });
    await field.fill('Imran');
    await field.press('Enter');
    await expect(page.getByText(exactly('Imran · joins next game'))).toBeVisible();
    await waitGuards(page, 600);
    // As left after the add, ready for the next name: the box is wholly on screen and nothing (the "Done" bar) is on it.
    const b = await field.boundingBox();
    expect(b, 'the name box is on the page').not.toBeNull();
    expect(b!.y >= -0.5 && b!.y + b!.height <= vp.height + 0.5, `the name box is wholly on screen after adding (y ${Math.round(b!.y)})`).toBe(true);
    expect(await coveredPoints(field), 'right after adding, nothing covers the name box').toEqual([]);
    // Every control in the sheet can be reached with nothing on top of it.
    await expectReachable(page, field, 'the name box');
    const sheet = page.getByRole('dialog').last();
    const buttons = sheet.getByRole('button');
    const n = await buttons.count();
    expect(n, 'the sheet has buttons').toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      const x = buttons.nth(i);
      if (!(await x.isVisible())) continue;
      const name = ((await x.getAttribute('aria-label')) ?? (await x.innerText())).trim();
      await expectReachable(page, x, `button "${name}"`);
    }
  });
}

// ---- 4. "Someone saw my role" hides the role at once (MAF-014, MAF-011; orchestrator, second walk) ----

test('MAF-014 / MAF-011: "Someone saw my role" while Arjun\'s role shows: behind "Deal again?" the card is hidden and no role is in the page; "Keep these roles" returns to the hidden card', async ({ page }) => {
  await openFlow(page, 'deal-arjun');
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
  await tap(page, button(page, "I'm Arjun"));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  await expect(byId(page, 'private-word')).toHaveText(exactly('MAFIA'));
  // The room spotted the open card: the player taps "Someone saw my role" without hiding it first.
  await tap(page, button(page, 'Someone saw my role'));
  const d = page.getByRole('dialog').filter({ hasText: 'Deal again?' });
  await expect(d).toBeVisible();
  await expect(byId(page, 'private-word'), 'the role word has gone behind the dialog').toHaveCount(0);
  await expect(byId(page, 'private-block'), 'the role block has gone behind the dialog').toHaveCount(0);
  const html = await page.evaluate(() => document.body.innerHTML + ' ' + document.body.textContent);
  for (const bad of [/\bMAFIA\b/, /You and Zoya are the Mafia/i, /At night, you pick who goes out/i, /At night, you pick who is out/i]) {
    expect(html, `while "Deal again?" shows, ${bad} is not in the page`).not.toMatch(bad);
  }
  await expect(pad(page), 'the card is back to hidden behind the dialog').toHaveText(exactly('Tap to see'));
  await tap(page, d.getByRole('button', { name: 'Keep these roles', exact: true }));
  await expect(d).toHaveCount(0);
  await expect(byId(page, 'private-word'), 'back on the card, the role stays hidden').toHaveCount(0);
  await expect(pad(page)).toHaveText(exactly('Tap to see'));
});

// ---- 5. The vote picker: a "More below" cue whenever a name is cut off below (MAF-033, MAF-034, MAF-080; third walk) ----

const IN_DAY_1 = NINE.filter((p) => p !== 'Kabir');
/** Each player's name button on the picker: where it sits ('shown', 'below', 'above'). */
async function pickerNames(page: Page): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const p of IN_DAY_1) out[p] = await clipState(button(page, p));
  return out;
}
async function expectCueWhenNamesBelow(page: Page, where: string) {
  await waitGuards(page, 600);
  const at = await pickerNames(page);
  const below = Object.keys(at).filter((p) => at[p] === 'below');
  if (below.length) {
    await expect(moreBelowCue(page).first(), `${where}: ${below.join(', ')} cut off below but no "More below" cue`).toBeVisible({ timeout: 2000 });
  } else {
    await expect(moreBelowCue(page), `${where}: every name shows, so no cue`).toBeHidden();
  }
  return below;
}

for (const o of [{ vp: { width: 320, height: 568 }, larger: false }, { vp: { width: 320, height: 568 }, larger: true }, { vp: { width: 568, height: 320 }, larger: false }]) {
  test(`MAF-033 / MAF-034 / MAF-080 at ${o.vp.width}×${o.vp.height}${o.larger ? ', Larger text' : ''}: the vote picker and the tie picker show "More below" while a name is cut off below`, async ({ page }) => {
    await openFlow(page, 'morning1', { viewport: o.vp, larger: o.larger });
    await toMorning(page);
    await tap(page, mainButton(page));
    await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
    await tap(page, mainButton(page));
    await page.clock.runFor(5000);
    await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
    const v2 = await expectCueWhenNamesBelow(page, 'V2');
    if (v2.length) {
      // Brought into view, the last name shows and the cue goes once nothing is cut off below.
      await button(page, IN_DAY_1[IN_DAY_1.length - 1]!).evaluate((el) => el.scrollIntoView({ block: 'end' }));
      await expectCueWhenNamesBelow(page, 'V2 scrolled to the last name');
    }
    await tap(page, button(page, "It's a tie"));
    await expect(heading(page, 'Tap everyone who is tied')).toBeVisible();
    await page.evaluate(() => { for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) el.scrollTop = 0; window.scrollTo(0, 0); });
    await expectCueWhenNamesBelow(page, 'V2t');
  });
}

// ---- 6. Privacy tidy-ups (reviewer): a covered role stays hidden; no "More below" cue above a cover ----

/** Role text still held by the page's role slots: `private-word` and every `.maf-measure` (the hidden measuring copy). */
async function roleSlots(page: Page): Promise<{ word: string; measure: string[] }> {
  return page.evaluate(() => ({
    word: Array.from(document.querySelectorAll('[data-testid="private-word"]')).map((e) => e.textContent ?? '').join('|'),
    measure: Array.from(document.querySelectorAll('.maf-measure')).map((e) => (e.textContent ?? '') + ' ' + (e.innerHTML ?? '')),
  }));
}
const ROLE_TEXT = /\b(Mafia|Doctor|Police|Villager)\b/i;
/** "More below" cues that show on the screen outside the open cover (not inside a dialog, and nothing is on top of them). */
async function cuesAboveCover(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el.children.length > 0 || !/More below/i.test(el.textContent ?? '')) continue;
      if (el.closest('[role="dialog"]')) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0) continue;
      const was = el.style.pointerEvents;
      el.style.pointerEvents = 'auto';   // the cue ignores taps; for the look-up it must be hittable, so a cue above the cover is found
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      el.style.pointerEvents = was;
      // The cue ignores taps (pointer-events: none), so the hit is whatever is under it: covered only by a dialog or a full-screen overlay.
      let covered = false;
      for (let a: Element | null = hit; a && a !== document.body; a = a.parentElement) {
        const ar = a.getBoundingClientRect();
        if (a.getAttribute('role') === 'dialog' || (getComputedStyle(a).position === 'fixed' && ar.width >= innerWidth * 0.9 && ar.height >= innerHeight * 0.9)) { covered = true; break; }
      }
      if (hit && (el === hit || el.contains(hit)) && !covered) out.push(`"${(el.textContent ?? '').trim()}" at y ${Math.round(r.top)}`);
    }
    return out;
  });
}

const COVERS = ['Paused', 'Players'] as const;
async function openCover(page: Page, cover: string): Promise<Locator> {
  if (cover === 'Paused') {
    await tap(page, page.getByRole('button', { name: 'Pause', exact: true }));
    const d = page.getByRole('dialog');
    await expect(d.getByText(exactly('Paused'))).toBeVisible();
    return d;
  }
  if (cover === 'Players') {
    await fromMenu(page, 'Players');
    const d = page.getByRole('dialog').last();
    await expect(d).toBeVisible();
    return d;
  }
  await fromMenu(page, 'End for tonight');
  const d = page.getByRole('dialog').filter({ hasText: 'End for tonight?' });
  await expect(d).toBeVisible();
  return d;
}
async function closeCover(page: Page, cover: string, d: Locator) {
  if (cover === 'Paused') await tap(page, d.getByRole('button', { name: 'Carry on', exact: true }));
  else if (cover === 'Players') await tap(page, d.getByRole('button', { name: /^(Done|Close)$/ }).first());
  else await tap(page, d.getByRole('button', { name: /^(Keep playing|Cancel|Back|Oops, keep playing)$/ }).first());
  await expect(d).toHaveCount(0);
}

// B2 and N2 have no Pause or Menu (specs/mafia/06-room.md: "No menu on B2, N2"), so a cover can't open over a showing role.
// The reachable moment is the next pass screen (B1, N1) right after a role was shown: nothing of it may linger.
for (const cover of COVERS) {
  for (const where of ['B1', 'N1'] as const) {
    test(`MAF-050 / MAF-051 / MAF-011 / MAF-P2: after Arjun's role showed (tap to see), ${cover} over the next pass screen (${where}): private-word and .maf-measure hold no role, and after it closes no role comes back by itself`, async ({ page }) => {
      if (where === 'B1') {
        await openFlow(page, 'deal-arjun');
        await tap(page, button(page, "I'm Arjun"));
        await tap(page, button(page, 'Tap instead'));
        await tap(page, pad(page));
        await expect(byId(page, 'private-word')).toHaveText(exactly('MAFIA'));
        await tap(page, pad(page));   // hide it again, as dealTurn does
        await tap(page, button(page, 'Done, pass to Meena'));
        await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
      } else {
        await openFlow(page, 'night1-meena');
        await tap(page, button(page, "I'm Meena"));
        await tap(page, button(page, 'Tap to see your night job'));
        await expect(page.getByText(/DOCTOR/i).first()).toBeVisible();
        await tap(page, nameButton(page, 'Riya'));
        await page.clock.runFor(4100);
        await tap(page, mainButton(page));
        await expect(byId(page, 'pass-name')).not.toHaveText(exactly('Meena'));
      }
      const d = await openCover(page, cover);
      await waitGuards(page, 600);
      let slots = await roleSlots(page);
      expect(slots.word, `while ${cover} is open, private-word holds no role`).not.toMatch(ROLE_TEXT);
      expect(slots.measure.join(' '), `while ${cover} is open, .maf-measure holds no role text`).not.toMatch(ROLE_TEXT);
      await closeCover(page, cover, d);
      await waitGuards(page, 5000);
      slots = await roleSlots(page);
      expect(slots.word, 'after the cover closes, no role comes back by itself').not.toMatch(ROLE_TEXT);
      expect(slots.measure.join(' '), 'after the cover closes, .maf-measure holds no role').not.toMatch(ROLE_TEXT);
      await expect(byId(page, 'private-word')).toHaveCount(0);
    });
  }
}

const CUE_COVERS = ['Paused', 'Players', 'End for tonight'] as const;
for (const cover of CUE_COVERS) {
  for (const where of ['V2'] as const) {   // N2 has no Pause or Menu, so no cover can open over it
    test(`MAF-080 / MAF-033: no "More below" cue shows above ${cover} opened over ${where} (320×568)`, async ({ page }) => {
      const viewport = { width: 320, height: 568 };
      if (where === 'V2') {
        await openFlow(page, 'morning1', { viewport });
        await toMorning(page);
        await tap(page, mainButton(page));
        await tap(page, mainButton(page));
        await page.clock.runFor(5000);
        await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
      } else {
        await openFlow(page, 'night1-meena', { viewport });
        await tap(page, button(page, "I'm Meena"));
        await tap(page, button(page, 'Tap to see your night job'));
      }
      await waitGuards(page, 600);
      // Precondition (else the test proves nothing): without a cover, the cue shows here.
      await expect(moreBelowCue(page).first(), `${where} at 320×568 shows its cue before any cover`).toBeVisible({ timeout: 2000 });
      // The detector itself sees the cue when nothing covers it.
      expect((await cuesAboveCover(page)).length, 'without a cover the cue is detected').toBeGreaterThan(0);
      const d = await openCover(page, cover);
      await waitGuards(page, 600);
      expect(await cuesAboveCover(page), `${cover} open over ${where}: a "More below" cue shows above it`).toEqual([]);
      await closeCover(page, cover, d);
    });
  }
}
