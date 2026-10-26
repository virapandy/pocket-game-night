// Mafia on screen: the C3 browser checks (scenarios version 1.1, 25 October 2026), written before the screens exist.
// MAF-P2 / MAF-016 (no room screen differs with the roles), MAF-P7 (every role's night job is the same frame), MAF-010
// (the deal on screen is the scenario's deal), MAF-037 (the story read out), MAF-091 / MAF-H6 (resume, never on a
// private screen). Rules: tests/games/mafia/. Helpers: mafia.ts. The screens are built (lane-k): no mark; the deal is opened through MAF-H6 (`openDeal`).
import { expect, test, type Page } from './fixtures';
import {
  EXAMPLE_DEAL, NINE, box, button, byId, dealAll, dealTurn, exactly, heading, mainButton, nameButton,
  nightNames, openFlow, pad, playNight, roomDump, tap, openDeal, toMorning, TZ, clipState, moreBelowCue, waitGuards,
} from './mafia';
import { hideApp, showApp } from './secret-words-b';
import { oracleDeal, oracleStory, storyText, STORIES, type Role } from '../games/mafia/oracle';

test.use({ timezoneId: TZ });

/** Deal B: Mafia Riya and Om; Doctor Sunita; Police Neha (Kabir a Villager in both). */
const DEAL_B: Record<string, Role> = {
  Riya: 'mafia', Arjun: 'villager', Meena: 'villager', Kabir: 'villager', Zoya: 'villager', Dev: 'villager', Om: 'mafia', Sunita: 'doctor', Neha: 'police',
};
/** Night 1 picks that put Kabir out under either deal: Mafia pick Kabir, the Doctor protects themselves, the Police checks the first other name. */
function picksFor(deal: Record<string, Role>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of NINE) {
    const r = deal[p];
    out[p] = r === 'mafia' ? 'Kabir' : r === 'doctor' ? p : r === 'police' ? (p === 'Riya' ? 'Arjun' : 'Riya') : p === 'Kabir' ? 'Riya' : 'Kabir';
  }
  return out;
}

/** Walks deal, night 1, morning and day 1 by screen, keeping what every room screen shows. */
async function walk(page: Page, deal: Record<string, Role>): Promise<string[]> {
  const dumps: string[] = [];
  await openDeal(page, NINE, { deals: { 1: deal } });
  for (const n of NINE) { dumps.push(await roomDump(page)); await dealTurn(page, n); }
  await expect(heading(page, 'Night 1')).toBeVisible();
  dumps.push(await roomDump(page));
  await tap(page, mainButton(page));
  const picks = picksFor(deal);
  for (let i = 0; i < NINE.length; i++) {
    dumps.push(await roomDump(page));   // N1
    const name = (await byId(page, 'pass-name').innerText()).trim();
    const key = NINE.find((x) => x.toLowerCase() === name.toLowerCase())!;
    await tap(page, button(page, `I'm ${key}`));
    await tap(page, button(page, 'Tap to see your night job'));
    await tap(page, nameButton(page, picks[key]!));
    await page.clock.runFor(4100);
    await tap(page, mainButton(page));
  }
  dumps.push(await roomDump(page));     // N3
  await toMorning(page);
  dumps.push(await roomDump(page));     // M1
  await tap(page, mainButton(page));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  dumps.push(await roomDump(page));     // Y1
  return dumps;
}

test('MAF-016 MAF-P2: every room screen of the deal, night 1, morning and day 1 is identical under two different deals', async ({ page, browser }) => {
  // Two whole walks (2 × 9 deal turns, 2 × 9 night turns with their 4000 ms guards): about 26 s alone, so the default
  // 30 s left no margin with 3 workers (lane M3's question, 25 October). Triple limit (90 s); nothing it checks changes.
  test.slow();
  const a = await walk(page, EXAMPLE_DEAL);
  const other = await browser.newPage({ timezoneId: TZ, viewport: page.viewportSize() ?? undefined });
  try {
    const b = await walk(other, DEAL_B);
    expect(b.length).toBe(a.length);
    for (let i = 0; i < a.length; i++) expect(b[i], `room screen ${i + 1}`).toBe(a[i]);
    // And the morning names Kabir, a Villager, in both: nothing of either deal's Mafia, Doctor or Police.
    expect(a[a.length - 2]).toMatch(/Kabir was a Villager\./i);
  } finally { await other.close(); }
});

test('MAF-016: a day leaver\'s role is on no room screen before game over ("Neha · left", no role)', async ({ page }) => {
  await openFlow(page, 'day1-left-neha');
  await toMorning(page);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Day 1 · Talk it over')).toBeVisible();
  await expect(page.getByText(exactly('Neha · left'))).toBeVisible();
  const dump = await roomDump(page);
  expect(dump).not.toMatch(/Neha[^\n]{0,20}(Villager|Mafia|Doctor|Police)/i);
});

test('MAF-P7: every role\'s night job (N2) has the same elements in the same order and the same sizes (320 × 568 and 390 × 844)', async ({ page }) => {
  // Two sizes, each a whole deal and six night jobs: about 27 s alone; triple limit (90 s) for a safe margin (lane M3).
  test.slow();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL }, viewport });
    await dealAll(page);
    await tap(page, mainButton(page));
    const frames: { who: string; order: string[]; sizes: Record<string, number>; names: number; buttonHeights: number[]; lineHeight: number; below: number; cue: boolean }[] = [];
    // Night 1 order: Riya (Villager), Arjun (Mafia), Meena (Doctor), Kabir, Zoya (Mafia), Dev (Police), …: the first six cover every role.
    const picks: Record<string, string> = { Riya: 'Arjun', Arjun: 'Kabir', Meena: 'Meena', Kabir: 'Zoya', Zoya: 'Kabir', Dev: 'Zoya' };
    for (const who of Object.keys(picks)) {
      await tap(page, button(page, `I'm ${who}`));
      await tap(page, button(page, 'Tap to see your night job'));
      // "More below" cue (orchestrator's call, third walk; MAF-P7): before any pick, with the names box as it opens.
      await waitGuards(page, 600);
      let below = 0;
      for (let i = 0; i < await nightNames(page).count(); i++) if ((await clipState(nightNames(page).nth(i))) === 'below') below++;
      const cue = await moreBelowCue(page).first().isVisible().catch(() => false);
      await tap(page, nameButton(page, picks[who]!));
      await page.clock.runFor(4100);
      await expect(mainButton(page)).toBeVisible();
      const order = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid]')).map((e) => e.getAttribute('data-testid')!)
        .filter((id) => ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button'].includes(id)));
      const sizes: Record<string, number> = {};
      for (const id of ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button']) sizes[id] = Math.round((await box(byId(page, id))).height);
      sizes.pad = Math.round((await box(pad(page))).height);
      const buttonHeights = await nightNames(page).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
      const lineHeight = await byId(page, 'job-line').evaluate((e) => parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2);
      frames.push({ who, order, sizes, names: await nightNames(page).count(), buttonHeights, lineHeight, below, cue });
      await tap(page, mainButton(page));
    }
    const first = frames[0]!;
    expect(first.order).toEqual(['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button']);
    for (const f of frames) {
      expect(f.order, `${f.who}: order`).toEqual(first.order);
      for (const [k, v] of Object.entries(first.sizes)) expect(Math.abs(f.sizes[k]! - v), `${f.who}: ${k} height at ${viewport.width}`).toBeLessThanOrEqual(1);
      expect(f.names, `${f.who}: name buttons (item 4)`).toBe(9);
      for (const h of f.buttonHeights) expect(Math.abs(h - 56), `${f.who}: name button height`).toBeLessThanOrEqual(1);
      // Product owner, 25 October (P7 sameness wins): job and result boxes at least 2 lines tall, equal for every role.
      expect(f.sizes['job-line']!, `${f.who}: job line at least 2 lines`).toBeGreaterThanOrEqual(2 * f.lineHeight - 1);
      expect(f.sizes['result-line']!, `${f.who}: result line at least 2 lines`).toBeGreaterThanOrEqual(2 * f.lineHeight - 1);
      // The "More below" cue (orchestrator, third walk): the same for every role, and shown whenever names are cut off below.
      expect(f.below, `${f.who}: names cut off below at ${viewport.width}, same as ${first.who}`).toBe(first.below);
      expect(f.cue, `${f.who}: "More below" cue the same as ${first.who}'s at ${viewport.width}`).toBe(first.cue);
      expect(f.cue, `${f.who}: ${f.below} names cut off below at ${viewport.width}, "More below" cue shown`).toBe(f.below > 0);
    }
  }
});

test('MAF-P7: the main button of the night job stays hidden until both 4000 ms and a pick, for every role', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  for (const [who, target] of [['Riya', 'Arjun'], ['Arjun', 'Kabir'], ['Meena', 'Meena']] as const) {
    await tap(page, button(page, `I'm ${who}`));
    // Pause the app's clock a whole second ahead, so the pause can't land in the past on a busy machine ("Cannot
    // fast-forward to the past", lane M3); the 4000 ms are counted from the tap below, after the pause.
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
    await button(page, 'Tap to see your night job').click({ force: true });
    await page.clock.runFor(3900);
    await expect(mainButton(page), `${who}: no pick yet, 3.9 s`).toBeHidden();
    await nameButton(page, target).click({ force: true });
    await expect(mainButton(page), `${who}: picked at 3.9 s`).toBeHidden();
    await page.clock.runFor(200);
    await expect(mainButton(page), `${who}: 4.1 s and a pick`).toBeVisible();
    await page.clock.runFor(1000);
    await mainButton(page).click({ force: true });
  }
});

test('MAF-010: with seeds.roles fixed, each role card shows the scenario\'s deal (shuffle with `${roles}:1`)', async ({ page }) => {
  await openDeal(page, NINE, { roles: 'browser-deal-1' });
  const shown = await dealAll(page);
  const expected = oracleDeal('browser-deal-1', 1, NINE, 2, []);
  for (const p of NINE) expect(shown[p]!.toUpperCase(), p).toBe(expected[p]!.toUpperCase());
});

test('MAF-037: the morning reads the scenario\'s story with the name in it (night 1 of the example: Kabir)', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  const id = oracleStory('mafia-example', 1, 1, STORIES.filter((s) => s.kind === 'out').map((s) => s.id), []);
  await expect(byId(page, 'story')).toHaveText(exactly(storyText(id, 'Kabir')));
  await expect(byId(page, 'role-line')).toHaveText(exactly('Kabir was a Villager.'));
  await expect(byId(page, 'count-line')).toHaveText(exactly('8 players left · Mafia caught: 0 of 2'));
});

test('MAF-091 / MAF-H6: a reload during the night resumes on the pass screen of the player whose turn it is, never the night job', async ({ page }) => {
  await openFlow(page, 'night1-meena');
  await expect(page.getByText(exactly('Welcome back.'))).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly("Night 1 · Meena's turn with the phone"));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  await expect(byId(page, 'night-progress')).toHaveText(exactly('Night 1 · 3 of 9'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await expect(byId(page, 'night-names')).toHaveCount(0);
  // Into the night job, then a reload: back to Meena's pass screen, nothing recorded for her.
  await tap(page, button(page, "I'm Meena"));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'job-line')).toBeVisible();
  await page.reload();
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await expect(page.getByText(exactly('Welcome back.'))).toBeVisible();
});

test('MAF-091 / MAF-013: a reload during the deal resumes on that player\'s pass screen, never the role card', async ({ page }) => {
  await openFlow(page, 'deal-arjun');
  await expect(byId(page, 'where-line')).toHaveText(exactly("Dealing roles · Arjun's turn with the phone"));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 2 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
  await expect(byId(page, 'private-word')).toHaveCount(0);
  await tap(page, button(page, "I'm Arjun"));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
  await expect(byId(page, 'private-word')).toBeVisible();
  await page.reload();
  await expect(byId(page, 'private-word')).toHaveCount(0);
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
});

test('MAF-091 item 22: after a recorded tie the game resumes at the re-vote (the tied players only)', async ({ page }) => {
  await openFlow(page, 'day1-tie');
  await expect(heading(page, 'Who got the most fingers?')).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly('Day 1 · vote'));
  for (const p of ['Om', 'Neha']) await expect(button(page, p)).toBeVisible();
  for (const p of ['Riya', 'Arjun', 'Meena', 'Zoya', 'Dev', 'Sunita']) await expect(button(page, p)).toHaveCount(0);
  await expect(button(page, 'Still a tie')).toBeVisible();
  await expect(button(page, 'Nobody today')).toHaveCount(0);
});

test('MAF-091: a finished game resumes on Game over with "Welcome back." and "Game over, game 1"', async ({ page }) => {
  await openFlow(page, 'game1-over');
  await expect(heading(page, 'The Village wins!')).toBeVisible();
  await expect(byId(page, 'where-line')).toHaveText(exactly('Game over, game 1'));
});

// ---- Version 1.2 (owner, 25 October 2026): privacy changes A and C (C3, MAF-P2/P7, guideline 51) ----

/** How every name button on N2 looks and reads: the things a glance or a screen reader could tell apart. */
async function namesLook(page: Page) {
  return byId(page, 'night-names').getByRole('button').evaluateAll((els) => els.map((e) => {
    const cs = getComputedStyle(e);
    return {
      text: (e as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
      disabled: (e as HTMLButtonElement).disabled, ariaDisabled: e.getAttribute('aria-disabled'), pressed: e.getAttribute('aria-pressed'),
      look: [cs.opacity, cs.color, cs.backgroundColor, cs.borderColor, cs.filter, cs.textDecorationLine].join(' | '),
    };
  }));
}
/** What a tap could change on N2: the names box, the result line and whether the main button shows. */
async function n2State(page: Page) {
  return {
    names: await byId(page, 'night-names').evaluate((e) => e.outerHTML),
    result: await byId(page, 'result-line').evaluate((e) => e.outerHTML).catch(() => ''),
    main: await mainButton(page).isVisible(),
  };
}
/** "I'm X" and "Tap to see your night job". */
async function openJob(page: Page, who: string) {
  await expect(byId(page, 'pass-name')).toHaveText(exactly(who));
  await tap(page, button(page, `I'm ${who}`));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'night-names')).toBeVisible();
}
/**
 * A tap on a name the role may not pick: the names box (selection, looks, tags) and the main button stay exactly as they
 * were (Version 1.2 A). Version 1.3 (owner, 26 October; MF21) wins over 1.2 A's "the result line stays": the result line
 * now holds the private why-line (each exact text: tests/browser/mafia-why.spec.ts).
 */
const WHY_LINE = /^\s*(That's you\. Pick someone else\.|.+ is out\. Pick someone else\.|.+ is Mafia too\. Pick someone else\.|You protected .+ last night\. Pick someone else\.|You've already protected yourself once\. Pick someone else\.|You checked .+ on night \d+: (Mafia|Not Mafia)\. Pick someone else\.|Tonight's check is done: .+ is (MAFIA|Not Mafia)\.)\s*$/i;
async function tapDoesNothing(page: Page, who: string, name: string) {
  const before = await n2State(page);
  await nameButton(page, name).click({ force: true });
  await page.clock.runFor(300);
  const after = await n2State(page);
  expect({ names: after.names, main: after.main }, `${who} taps ${name}: names box and main button unchanged`).toEqual({ names: before.names, main: before.main });
  await expect(byId(page, 'result-line'), `${who} taps ${name}: a why-line (Version 1.3)`).toHaveText(WHY_LINE);
}

test('MAF-022 to MAF-026 Version 1.2 A / MAF-P7: every role sees the same names box: none greyed, same look, same tags, names read as the name only', async ({ page }) => {
  test.slow();
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  const picks: Record<string, string> = { Riya: 'Arjun', Arjun: 'Kabir', Meena: 'Meena', Kabir: 'Zoya', Zoya: 'Kabir', Dev: 'Zoya' };
  const seen: { who: string; looks: string[]; tags: string[] }[] = [];
  for (const who of Object.keys(picks)) {
    await openJob(page, who);
    const look = await namesLook(page);
    expect(look.length, `${who}: 9 names`).toBe(9);
    for (const [i, n] of NINE.entries()) {
      const b = nightNames(page).nth(i);
      // Screen readers: the name only, the same for every role (no ", can't pick", no tag, no partner name).
      await expect(b, `${who}: name ${n}`).toHaveAccessibleName(new RegExp(`^\\s*${n}\\s*$`, 'i'));
      expect(look[i]!.disabled, `${who}: ${n} disabled`).toBe(false);
      expect(look[i]!.ariaDisabled, `${who}: ${n} aria-disabled`).not.toBe('true');
    }
    const looks = look.map((l) => l.look);
    for (const [i, l] of looks.entries()) expect(l, `${who}: ${NINE[i]} looks like ${NINE[0]}`).toBe(looks[0]);
    // Tags: the text under each name with the name taken off; only "you" on the own name (nobody is out on night 1).
    const tags = look.map((l, i) => l.text.replace(new RegExp(`^${NINE[i]}`, 'i'), '').replace(/^[\s·]+/, '').trim().toLowerCase());
    for (const [i, t] of tags.entries()) expect(t, `${who}: tag under ${NINE[i]}`).toBe(NINE[i] === who ? 'you' : '');
    seen.push({ who, looks, tags });
    await tap(page, nameButton(page, picks[who]!));
    // The Police: after the first tap, the answer is in the result line only and no other name greys out.
    if (who === 'Dev') {
      await expect(byId(page, 'result-line')).toHaveText(exactly('Zoya: MAFIA.'));
      const after = await namesLook(page);
      for (const [i, l] of after.entries()) {
        expect(l.disabled || l.ariaDisabled === 'true', `Dev after the check: ${NINE[i]} greyed`).toBe(false);
        if (NINE[i] !== 'Zoya') expect(l.look, `Dev after the check: ${NINE[i]} look`).toBe(seen[0]!.looks[0]);
      }
      await expect(byId(page, 'night-names')).not.toContainText(/mafia/i);
    }
    await page.clock.runFor(4100);
    await tap(page, mainButton(page));
  }
  for (const s of seen) expect(s.looks, `${s.who}: the same look as ${seen[0]!.who}`).toEqual(seen[0]!.looks);
});

test('MAF-023 to MAF-026 Version 1.2 A and 1.3: a tap on a name the role may not pick changes no pick, look or Done, only a why-line (partners, "you", used, last night\'s, out, earlier checks)', async ({ page }) => {
  test.slow();
  // Night 1: Riya (Villager) taps herself; Arjun (Mafia) taps himself and his partner Zoya, before and after a real pick.
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await openJob(page, 'Riya');
  await tapDoesNothing(page, 'Riya', 'Riya');
  await tap(page, nameButton(page, 'Om'));
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  await openJob(page, 'Arjun');
  await tapDoesNothing(page, 'Arjun', 'Zoya');
  await tapDoesNothing(page, 'Arjun', 'Arjun');
  await page.clock.runFor(4100);
  await expect(mainButton(page), 'no pick: Done stays hidden').toBeHidden();
  await tap(page, nameButton(page, 'Kabir'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Kabir. Zoya can agree or change it.'));
  await tapDoesNothing(page, 'Arjun', 'Zoya');
  await expect(nameButton(page, 'Kabir')).toHaveAttribute('aria-pressed', 'true');
  // Night 2: Meena (Doctor, used her self-protect on night 1) taps herself and Kabir (out): nothing; Riya works.
  await openFlow(page, 'night2-meena');
  await openJob(page, 'Meena');
  await tapDoesNothing(page, 'Meena', 'Meena');
  await tapDoesNothing(page, 'Meena', 'Kabir');
  await tap(page, nameButton(page, 'Riya'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Riya is protected tonight.'));
  // Night 3: Meena protected Riya on night 2: Riya does nothing. Dev checked Zoya and Arjun: they do nothing.
  await openFlow(page, 'night3-meena');
  await openJob(page, 'Meena');
  await tapDoesNothing(page, 'Meena', 'Riya');
  await tapDoesNothing(page, 'Meena', 'Meena');
  await openFlow(page, 'night3-dev');
  await openJob(page, 'Dev');
  await tapDoesNothing(page, 'Dev', 'Zoya');
  await tapDoesNothing(page, 'Dev', 'Arjun');
  await tapDoesNothing(page, 'Dev', 'Dev');
  await expect(byId(page, 'night-names')).not.toContainText(/mafia/i);
  await tap(page, nameButton(page, 'Sunita'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Sunita: Not Mafia.'));
  // After the check, another name changes no pick either (Version 1.2 A and C); the line says so (Version 1.3).
  await tapDoesNothing(page, 'Dev', 'Riya');
  await expect(byId(page, 'result-line')).toHaveText(exactly("Tonight's check is done: Sunita is Not Mafia."));
});

test('MAF-025 Version 1.2 A: a Police with nobody left to check still taps a name: no name greyed, Done only after a tap, "Nobody left to check."', async ({ page }) => {
  await openFlow(page, 'police-nobody-left');
  await openJob(page, 'Dev');
  const look = await namesLook(page);
  expect(look.length).toBe(6);
  for (const l of look) expect(l.disabled || l.ariaDisabled === 'true', `${l.text} greyed`).toBe(false);
  for (const l of look) expect(l.look, `${l.text} look`).toBe(look[0]!.look);
  await expect(byId(page, 'night-names')).not.toContainText(/mafia/i);
  await page.clock.runFor(4100);
  await expect(mainButton(page), 'no tap yet: Done hidden as for every role').toBeHidden();
  await nameButton(page, 'Kabir').click({ force: true });
  await expect(byId(page, 'result-line')).toHaveText(exactly('Nobody left to check.'));
  await page.clock.runFor(1000);
  await expect(mainButton(page)).toHaveText(exactly('Done, pass to Riya'));
  await tap(page, mainButton(page));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
});

/** Dev's N2 on night 1 after the reload or hide: the same answer, Zoya selected, before any tap; no other check. */
async function sameCheckAgain(page: Page, how: string) {
  await expect(page.getByText(exactly('Welcome back.')), how).toBeVisible();
  await openJob(page, 'Dev');
  await expect(byId(page, 'result-line'), `${how}: the same answer before any tap`).toHaveText(exactly('Zoya: MAFIA.'));
  await expect(nameButton(page, 'Zoya')).toHaveAttribute('aria-pressed', 'true');
  await nameButton(page, 'Riya').click({ force: true });
  await page.clock.runFor(300);
  // No second check: the line says tonight's check is done (Version 1.3, owner 26 October; was "Zoya: MAFIA." under 1.2 C).
  await expect(byId(page, 'result-line'), `${how}: no second check`).toHaveText(exactly("Tonight's check is done: Zoya is MAFIA."));
  await expect(nameButton(page, 'Riya')).not.toHaveAttribute('aria-pressed', 'true');
}

test('MAF-025 Version 1.2 C: the Police\'s first tap is saved at once: after a reload, Dev sees the same answer and cannot check another name', async ({ page }) => {
  await openFlow(page, 'night1-dev');
  await openJob(page, 'Dev');
  await tap(page, nameButton(page, 'Zoya'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Zoya: MAFIA.'));
  await page.reload();
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Dev'));
  await sameCheckAgain(page, 'reload');
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Om'));
});

test('MAF-025 Version 1.2 C: the Police\'s first tap is saved at once: after the app is hidden, Dev sees the same answer and cannot check another name', async ({ page }) => {
  await openFlow(page, 'night1-dev');
  await openJob(page, 'Dev');
  await tap(page, nameButton(page, 'Zoya'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Zoya: MAFIA.'));
  await hideApp(page);
  await page.clock.runFor(1000);
  await showApp(page);
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Dev'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await sameCheckAgain(page, 'app hidden');
});
