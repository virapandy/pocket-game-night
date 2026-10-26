// Mafia N2, Version 1.3 (owner, 26 October 2026; MF21): why a name can't be picked. A tap on a name the role may not
// pick selects nothing and puts one private line in `result-line` (the same box, size and place for every role) until
// the next tap on any name; Done's conditions don't change; nothing is recorded; no sound or vibration. C3 in look:
// MAF-P7 (the same frame whether or not a line shows) and MAF-P2 (never on a room screen). specs/mafia/03-night.md,
// MAF-022 Version 1.3 and the tester's reading; texts from docs/games/mafia/text.csv `mf.n2-why.1` to `.7`.
// Example deal: Mafia Arjun and Zoya; Doctor Meena; Police Dev. Flows: tests/games/mafia/flows.ts. Written before the build.
import { expect, test, type Page } from './fixtures';
import { box, button, byId, exactly, mainButton, nameButton, nightNames, nightTurn, openFlow, roomDump, tap, waitGuards, TZ } from './mafia';
import { hideApp, showApp } from './secret-words-b';

test.use({ timezoneId: TZ });

/** text.csv `mf.n2-why.1` to `.7`, with the example's names put in. */
const WHY = {
  you: "That's you. Pick someone else.",
  out: (n: string) => `${n} is out. Pick someone else.`,
  partner: (n: string) => `${n} is Mafia too. Pick someone else.`,
  lastNight: (n: string) => `You protected ${n} last night. Pick someone else.`,
  selfUsed: "You've already protected yourself once. Pick someone else.",
  checked: (n: string, night: number, mafia: boolean) => `You checked ${n} on night ${night}: ${mafia ? 'Mafia' : 'Not Mafia'}. Pick someone else.`,
  checkDone: (n: string, mafia: boolean) => `Tonight's check is done: ${n} is ${mafia ? 'MAFIA' : 'Not Mafia'}.`,
};
/** Text that only a why-line holds (for "never anywhere else"). */
const WHY_MARKS = /Pick someone else\.|Tonight's check is done|is Mafia too|already protected yourself/i;

// ---- What the phone holds ----
/** Every Mafia game night saved on this phone (`pgn.game.*`), as in mafia-results.spec.ts. */
async function records(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const out: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('pgn.game.')) continue;
      try { const g = JSON.parse(localStorage.getItem(k)!); if (g?.gameType === 'mafia') out.push(...g.records.map((r: any) => r.move)); } catch { /* not ours */ }
    }
    return out;
  });
}
/** Which name buttons are selected (`aria-pressed="true"`). */
const selected = (page: Page) => nightNames(page).evaluateAll((els) => els.filter((e) => e.getAttribute('aria-pressed') === 'true').map((e) => (e as HTMLElement).innerText.split('\n').map((l) => l.replace(/^[^\p{L}]+/u, '').trim()).find(Boolean)!.toLowerCase()));

/** "I'm X" and "Tap to see your night job". */
async function openJob(page: Page, who: string) {
  await expect(byId(page, 'pass-name')).toHaveText(exactly(who));
  await tap(page, button(page, `I'm ${who}`));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'night-names')).toBeVisible();
}
/**
 * A tap on a name the role may not pick (Version 1.3 item 1): the result line reads `line`, the selection and the main
 * button are as before, nothing is recorded.
 */
async function tapWhy(page: Page, who: string, name: string, line: string) {
  const before = { sel: await selected(page), main: await mainButton(page).isVisible(), moves: (await records(page)).length };
  await nameButton(page, name).click({ force: true });
  await page.clock.runFor(300);
  await expect(byId(page, 'result-line'), `${who} taps ${name}`).toHaveText(exactly(line));
  expect(await selected(page), `${who} taps ${name}: the pick is unchanged`).toEqual(before.sel);
  expect(await mainButton(page).isVisible(), `${who} taps ${name}: Done's conditions don't change`).toBe(before.main);
  expect((await records(page)).length, `${who} taps ${name}: nothing is recorded`).toBe(before.moves);
}
/** A name the role may pick: selected, its result line. */
async function tapPick(page: Page, name: string, line: string) {
  await nameButton(page, name).click({ force: true });
  await page.clock.runFor(300);
  await expect(byId(page, 'result-line')).toHaveText(exactly(line));
  expect(await selected(page)).toEqual([name.toLowerCase()]);
}

// ---- Item 2: each line for its case ----

test('MAF-026 / MAF-022 Version 1.3: a Villager taps their own name: "That\'s you. Pick someone else.", nothing selected, Done hidden, nothing recorded; a real pick replaces it', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await openJob(page, 'Riya');
  await tapWhy(page, 'Riya', 'Riya', WHY.you);
  expect(await selected(page), 'selects nothing').toEqual([]);
  await page.clock.runFor(4100);
  await expect(mainButton(page), 'no pick yet: Done stays hidden after 4000 ms').toBeHidden();
  await tapPick(page, 'Om', "You think it's Om. At the end we'll see if you were right.");
  await expect(mainButton(page)).toBeVisible();
  await tapWhy(page, 'Riya', 'Riya', WHY.you);
  await expect(nameButton(page, 'Om')).toHaveAttribute('aria-pressed', 'true');
  await tapPick(page, 'Sunita', "You think it's Sunita. At the end we'll see if you were right.");
  const before = (await records(page)).length;
  await tap(page, mainButton(page));
  const after = await records(page);
  expect(after.length, 'Done records one move').toBe(before + 1);
  expect(after[after.length - 1]).toEqual({ type: 'nightPick', player: 'Riya', target: 'Sunita' });
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Arjun'));
});

test('MAF-023 / MAF-022 Version 1.3: a Mafia taps a partner: "Zoya is Mafia too. Pick someone else."; own name "That\'s you."; the line changes with each tap', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await nightTurn(page, 'Riya', 'Om');
  await openJob(page, 'Arjun');
  await tapWhy(page, 'Arjun', 'Zoya', WHY.partner('Zoya'));
  await tapWhy(page, 'Arjun', 'Arjun', WHY.you);
  await tapPick(page, 'Kabir', 'Kabir. Zoya can agree or change it.');
  await tapWhy(page, 'Arjun', 'Zoya', WHY.partner('Zoya'));
  await expect(nameButton(page, 'Kabir')).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  expect((await records(page)).at(-1)).toEqual({ type: 'nightPick', player: 'Arjun', target: 'Kabir' });
  await nightTurn(page, 'Meena', 'Meena');
  await nightTurn(page, 'Kabir', 'Zoya');
  await openJob(page, 'Zoya');
  await tapWhy(page, 'Zoya', 'Arjun', WHY.partner('Arjun'));
});

test('MAF-024 / MAF-026 Version 1.3: the Doctor on night 3 ("used", last night\'s pick, out) and a ghost guess (own name, out players)', async ({ page }) => {
  await openFlow(page, 'night3-meena');
  await openJob(page, 'Meena');
  await tapWhy(page, 'Meena', 'Meena', WHY.selfUsed);
  await tapWhy(page, 'Meena', 'Riya', WHY.lastNight('Riya'));
  await tapWhy(page, 'Meena', 'Kabir', WHY.out('Kabir'));
  expect(await selected(page)).toEqual([]);
  await page.clock.runFor(4100);
  await expect(mainButton(page)).toBeHidden();
  await tapPick(page, 'Sunita', 'Sunita is protected tonight.');
  await tapWhy(page, 'Meena', 'Riya', WHY.lastNight('Riya'));
  await tapPick(page, 'Neha', 'Neha is protected tonight.');
  await tap(page, mainButton(page));
  expect((await records(page)).at(-1)).toEqual({ type: 'nightPick', player: 'Meena', target: 'Neha' });
  // Kabir is out (night 1): a ghost guess. His own name, then Om (voted out day 1) and Zoya (day 2).
  await openJob(page, 'Kabir');
  await tapWhy(page, 'Kabir', 'Kabir', WHY.you);
  await tapWhy(page, 'Kabir', 'Om', WHY.out('Om'));
  await tapWhy(page, 'Kabir', 'Zoya', WHY.out('Zoya'));
  await tapPick(page, 'Arjun', 'Your guess: Arjun.');
});

test('MAF-025 Version 1.3: the Police on night 3: out wins over an earlier check, "You checked Arjun on night 2: Mafia.", no check recorded; after tonight\'s check "Tonight\'s check is done: Sunita is Not Mafia."', async ({ page }) => {
  await openFlow(page, 'night3-dev');
  await openJob(page, 'Dev');
  await tapWhy(page, 'Dev', 'Zoya', WHY.out('Zoya'));
  await tapWhy(page, 'Dev', 'Arjun', WHY.checked('Arjun', 2, true));
  await tapWhy(page, 'Dev', 'Dev', WHY.you);
  const before = (await records(page)).length;
  await tapPick(page, 'Sunita', 'Sunita: Not Mafia.');
  expect((await records(page)).at(-1), 'the first allowed tap is the check (Version 1.2 C)').toEqual({ type: 'check', player: 'Dev', target: 'Sunita' });
  expect((await records(page)).length).toBe(before + 1);
  await tapWhy(page, 'Dev', 'Riya', WHY.checkDone('Sunita', false));
  await expect(nameButton(page, 'Sunita'), 'the checked name stays selected').toHaveAttribute('aria-pressed', 'true');
  await tapWhy(page, 'Dev', 'Arjun', WHY.checked('Arjun', 2, true));
  await tapWhy(page, 'Dev', 'Dev', WHY.you);
  await tapWhy(page, 'Dev', 'Neha', WHY.checkDone('Sunita', false));
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  expect((await records(page)).at(-1)).toEqual({ type: 'nightPick', player: 'Dev', target: 'Sunita' });
});

test('MAF-025 Version 1.3: "You checked Riya on night 1: Not Mafia. Pick someone else."', async ({ page }) => {
  await openFlow(page, 'night2-dev-riya-checked');
  await openJob(page, 'Dev');
  await tapWhy(page, 'Dev', 'Riya', WHY.checked('Riya', 1, false));
  await tapWhy(page, 'Dev', 'Kabir', WHY.out('Kabir'));
  await tapPick(page, 'Zoya', 'Zoya: MAFIA.');
  await tapWhy(page, 'Dev', 'Riya', WHY.checked('Riya', 1, false));
  await tapWhy(page, 'Dev', 'Meena', WHY.checkDone('Zoya', true));
});

test('MAF-025 Version 1.3 / 1.2 C: after tonight\'s check and a reload, another name says "Tonight\'s check is done: Zoya is MAFIA."', async ({ page }) => {
  await openFlow(page, 'night1-dev');
  await openJob(page, 'Dev');
  await tapPick(page, 'Zoya', 'Zoya: MAFIA.');
  await tapWhy(page, 'Dev', 'Riya', WHY.checkDone('Zoya', true));
  await page.reload();
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Dev'));
  await openJob(page, 'Dev');
  await expect(byId(page, 'result-line'), 'the same answer before any tap').toHaveText(exactly('Zoya: MAFIA.'));
  await tapWhy(page, 'Dev', 'Riya', WHY.checkDone('Zoya', true));
  await expect(nameButton(page, 'Zoya')).toHaveAttribute('aria-pressed', 'true');
});

test('MAF-082 Version 1.3: a why tap makes no sound and no vibration', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await page.evaluate(() => { (window as any).__vibrations = 0; navigator.vibrate = () => { (window as any).__vibrations++; return true; }; });
  await tap(page, mainButton(page));
  const before = await page.evaluate(() => ((window as any).__sounds ?? []).length);
  await nightTurn(page, 'Riya', 'Om');
  await openJob(page, 'Arjun');
  await tapWhy(page, 'Arjun', 'Zoya', WHY.partner('Zoya'));
  await tapWhy(page, 'Arjun', 'Arjun', WHY.you);
  expect(await page.evaluate(() => ((window as any).__sounds ?? []).length)).toBe(before);
  expect(await page.evaluate(() => (window as any).__vibrations)).toBe(0);
});

// ---- Where the line is, and where it never is (MAF-P2, screen readers) ----

/** Where a text is: visible holders (at least 2 × 2 px, not clipped away) and live regions holding it. */
async function whereIs(page: Page, text: string) {
  return page.evaluate((t) => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const want = norm(t);
    const visibleOutside: string[] = [];
    const result = document.querySelector('[data-testid="result-line"]');
    // The deepest elements whose text holds the whole line (a name button "Zoya" alone never counts).
    const holders = Array.from(document.body.querySelectorAll('*')).filter((e) => norm(e.textContent ?? '').includes(want)
      && !Array.from(e.children).some((c) => norm(c.textContent ?? '').includes(want))) as HTMLElement[];
    for (const n of holders) {
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') continue;
      if (!result || !result.contains(n)) visibleOutside.push(n.outerHTML.slice(0, 120));
    }
    const live = Array.from(document.querySelectorAll('[aria-live],[role="status"],[role="alert"],[role="log"]'));
    const holding = live.filter((e) => norm(e.textContent ?? '').includes(want));
    const privateLive = document.querySelector('[data-testid="private-live"]');
    return {
      visibleOutside,
      inResult: !!result && norm(result.textContent ?? '').includes(want),
      inPrivateLive: !!privateLive && norm(privateLive.textContent ?? '').includes(want),
      privateLiveMode: privateLive?.getAttribute('aria-live') ?? null,
      otherLive: holding.filter((e) => !(privateLive && (privateLive === e || privateLive.contains(e) || e.contains(privateLive)))).map((e) => e.outerHTML.slice(0, 120)),
      anywhere: norm(document.documentElement.outerHTML.replace(/<[^>]+>/g, ' ')).includes(want),
    };
  }, text);
}

test('MAF-082 / MAF-P2 Version 1.3: the line shows in the result line only, is read on N2\'s private live region only, leaves the names\' accessible names alone, and is on no room screen', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await nightTurn(page, 'Riya', 'Om');
  await openJob(page, 'Arjun');
  await tapWhy(page, 'Arjun', 'Zoya', WHY.partner('Zoya'));
  const w = await whereIs(page, WHY.partner('Zoya'));
  expect(w.inResult, 'in the result line').toBe(true);
  expect(w.visibleOutside, 'shown nowhere but the result line').toEqual([]);
  expect(w.inPrivateLive, 'screen readers: in N2\'s private live region (`private-live`, MAF-082)').toBe(true);
  expect(['polite', 'assertive'], '`private-live` is a live region').toContain(w.privateLiveMode);
  expect(w.otherLive, 'in no other live region').toEqual([]);
  for (const n of ['Zoya', 'Arjun', 'Kabir']) await expect(nameButton(page, n).first(), `${n}: the name only (Version 1.2 A)`).toHaveAccessibleName(new RegExp(`^\\s*${n}\\s*$`, 'i'));
  // Hidden by "Tap to hide": the job, names and result empty at once (MAF-022), so the line is gone, also for screen readers.
  await tap(page, button(page, 'Tap to hide'));
  expect((await whereIs(page, WHY.partner('Zoya'))).anywhere, 'after "Tap to hide": the line is nowhere in the page').toBe(false);
  await tap(page, button(page, 'Tap to see your night job').or(button(page, 'Tap to see')));
  await tapPick(page, 'Kabir', 'Kabir. Zoya can agree or change it.');
  await tapWhy(page, 'Arjun', 'Arjun', WHY.you);
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  // N1 (a room screen): nothing of the line, anywhere a room could read it.
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Meena'));
  const n1 = await roomDump(page);
  expect(n1, 'N1 after a why-line').not.toMatch(WHY_MARKS);
  expect((await whereIs(page, WHY.you)).anywhere, 'N1: not in the page at all').toBe(false);
  // The app hidden while a why-line shows: back on the pass screen, nothing of it.
  await openJob(page, 'Meena');
  await tapPick(page, 'Riya', 'Riya is protected tonight.');
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  await openJob(page, 'Kabir');
  await tapWhy(page, 'Kabir', 'Kabir', WHY.you);
  await hideApp(page);
  await page.clock.runFor(1000);
  await showApp(page);
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Kabir'));
  await waitGuards(page);
  expect(await roomDump(page), 'pass screen after the app was hidden').not.toMatch(WHY_MARKS);
  expect((await whereIs(page, WHY.you)).anywhere).toBe(false);
});

// ---- MAF-P7: the same frame whether or not a why-line shows ----

const FRAME_IDS = ['night-progress', 'pass-name', 'job-line', 'night-names', 'result-line', 'main-button'];
interface Frame { boxes: Record<string, string>; font: string; fits: boolean }
/** Every box of N2 (x, y, width, height to the pixel; "hidden" when not shown) and the result line's text size. */
async function frame(page: Page): Promise<Frame> {
  const boxes: Record<string, string> = {};
  for (const id of FRAME_IDS) {
    const l = byId(page, id);
    boxes[id] = (await l.count()) && (await l.isVisible()) ? Object.values(await box(l)).map((v) => Math.round(v)).join(',') : 'hidden';
  }
  boxes.pad = Object.values(await box(button(page, 'Tap to hide'))).map((v) => Math.round(v)).join(',');
  const r = await byId(page, 'result-line').evaluate((el) => {
    const sizes = new Set<string>();
    for (const e of [el, ...Array.from(el.querySelectorAll('*'))]) {
      if (Array.from(e.childNodes).some((c) => c.nodeType === Node.TEXT_NODE && (c.textContent ?? '').trim())) { const s = getComputedStyle(e); sizes.add(`${s.fontSize}/${s.lineHeight}`); }
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { font: [...sizes].sort().join(' '), fits: el.scrollHeight <= el.clientHeight + 1 && t.bottom <= b.bottom + 3 && t.right <= b.right + 3 };  // glyphs may poke 1–2 px out (WebKit); a line that doesn't fit is ~20 px out
  }).catch(() => ({ font: 'none', fits: false }));
  return { boxes, ...r };
}
/** Same boxes (±1 px) and, when both show text, the same text size. */
function sameFrame(a: Frame, b: Frame, what: string) {
  for (const id of Object.keys(a.boxes)) {
    const x = a.boxes[id]!, y = b.boxes[id]!;
    if (x === 'hidden' || y === 'hidden') { expect(y, `${what}: ${id}`).toBe(x); continue; }
    const xs = x.split(',').map(Number), ys = y.split(',').map(Number);
    for (let i = 0; i < 4; i++) expect(Math.abs(xs[i]! - ys[i]!), `${what}: ${id} ${['x', 'y', 'width', 'height'][i]} (${x} vs ${y})`).toBeLessThanOrEqual(1);
  }
}

/** One role's N2: the frame before any pick and with a pick, each with and without a why-line. */
async function roleFrames(page: Page, who: string, pick: string, notAllowed: { name: string; line: string }[], pickLine?: string) {
  await openJob(page, who);
  await waitGuards(page, 600);
  const out: { what: string; f: Frame; why: boolean; picked: boolean }[] = [];
  const noPick = await frame(page);
  out.push({ what: `${who}, no pick`, f: noPick, why: false, picked: false });
  if (notAllowed[0]) {
    await tapWhy(page, who, notAllowed[0].name, notAllowed[0].line);
    out.push({ what: `${who}, no pick, "${notAllowed[0].line}"`, f: await frame(page), why: true, picked: false });
  }
  await nameButton(page, pick).click({ force: true });
  if (pickLine) await expect(byId(page, 'result-line')).toHaveText(exactly(pickLine));
  await page.clock.runFor(4100);
  await expect(mainButton(page)).toBeVisible();
  out.push({ what: `${who}, picked ${pick}`, f: await frame(page), why: false, picked: true });
  for (const n of notAllowed) {
    await tapWhy(page, who, n.name, n.line);
    out.push({ what: `${who}, picked, "${n.line}"`, f: await frame(page), why: true, picked: true });
  }
  return out;
}

/** Compares every frame with the first of its kind (before or after a pick), and the result line's text size. */
function allSame(frames: { what: string; f: Frame; why: boolean; picked: boolean }[], where: string) {
  for (const picked of [false, true]) {
    const set = frames.filter((x) => x.picked === picked);
    const ref = set[0]!;
    for (const x of set) sameFrame(ref.f, x.f, `${where}: ${x.what} vs ${ref.what}`);
  }
  const fonts = new Set(frames.filter((x) => x.f.font !== 'none' && x.f.font !== '').map((x) => x.f.font));
  expect([...fonts], `${where}: the result line's text size is the same for every line`).toHaveLength(1);
  for (const x of frames.filter((y) => y.why || y.picked)) expect(x.f.fits, `${where}: ${x.what}: the line fits the result-line box`).toBe(true);
}

test('MAF-P7 Version 1.3: every role\'s N2 has the same boxes and sizes with and without a why-line (night 1 and night 3; 320 × 568 and 390 × 844)', async ({ page }) => {
  test.slow();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    const at = `${viewport.width} × ${viewport.height}`;
    const frames: { what: string; f: Frame; why: boolean; picked: boolean }[] = [];
    await openFlow(page, 'night1-start', { viewport });
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Riya', 'Arjun', [{ name: 'Riya', line: WHY.you }]));
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Arjun', 'Kabir', [{ name: 'Zoya', line: WHY.partner('Zoya') }, { name: 'Arjun', line: WHY.you }]));
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Meena', 'Meena', []));
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Kabir', 'Zoya', [{ name: 'Kabir', line: WHY.you }]));
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Zoya', 'Kabir', [{ name: 'Arjun', line: WHY.partner('Arjun') }]));
    await tap(page, mainButton(page));
    frames.push(...await roleFrames(page, 'Dev', 'Zoya', [{ name: 'Dev', line: WHY.you }, { name: 'Riya', line: WHY.checkDone('Zoya', true) }], 'Zoya: MAFIA.'));
    // Night 3 of the same game (same players, same names box): the longest lines.
    await openFlow(page, 'night3-meena', { viewport });
    frames.push(...await roleFrames(page, 'Meena', 'Sunita', [{ name: 'Meena', line: WHY.selfUsed }, { name: 'Riya', line: WHY.lastNight('Riya') }, { name: 'Kabir', line: WHY.out('Kabir') }]));
    await openFlow(page, 'night3-dev', { viewport });
    frames.push(...await roleFrames(page, 'Dev', 'Sunita', [{ name: 'Arjun', line: WHY.checked('Arjun', 2, true) }, { name: 'Riya', line: WHY.checkDone('Sunita', false) }], 'Sunita: Not Mafia.'));
    allSame(frames, at);
  }
});

test('MAF-P7 Version 1.3: with Larger text at 320 × 568 the longest lines fit, and the Doctor\'s and the Police\'s N2 keep the same frame', async ({ page }) => {
  test.slow();
  const viewport = { width: 320, height: 568 };
  const frames: { what: string; f: Frame; why: boolean; picked: boolean }[] = [];
  await openFlow(page, 'night3-meena', { viewport, larger: true });
  frames.push(...await roleFrames(page, 'Meena', 'Sunita', [{ name: 'Meena', line: WHY.selfUsed }, { name: 'Riya', line: WHY.lastNight('Riya') }]));
  await openFlow(page, 'night2-dev-riya-checked', { viewport, larger: true });
  frames.push(...await roleFrames(page, 'Dev', 'Zoya', [{ name: 'Riya', line: WHY.checked('Riya', 1, false) }, { name: 'Meena', line: WHY.checkDone('Zoya', true) }], 'Zoya: MAFIA.'));
  allSame(frames, '320 × 568, Larger text');
});
