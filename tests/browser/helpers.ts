// Browser helpers: how the tests find things on screen. The names below are what the app must show;
// they come from the scenarios and journeys (buttons named as in the specs). Listed in tests/browser/README.md.
import { expect, type Locator, type Page } from '@playwright/test';

export const HOME = './';

export interface SetupOptions {
  players?: string[]; // names; '' leaves a name blank
  contribution?: number | 'none';
  session?: { name?: string; newSession?: boolean }; // how to answer the session question (PLT-016)
}

/** PLT-300 (owner 2026-10-01): Home's two equal choices. */
export const hostAGame = (page: Page) => page.getByRole('button', { name: /^Host a game/ });
export const joinWithMyTicket = (page: Page) => page.getByRole('button', { name: /^Join with my ticket/ });

/**
 * Home → the Tambola start screen. Home's "Host a game" (PLT-300); if a game picker follows, "Tambola". Until Home
 * changes, the older "Tambola" card on Home is tapped instead (PLT-300's own tests check Home strictly).
 */
export async function openTambola(page: Page) {
  await page.goto(HOME);
  const tambola = page.getByRole('button', { name: /^Tambola/ });
  await expect(hostAGame(page).or(tambola).first()).toBeVisible();
  if (await hostAGame(page).isVisible()) {
    await hostAGame(page).click();
    await expect(page.getByRole('button', { name: 'New game' }).or(tambola).first()).toBeVisible();
    if (!(await page.getByRole('button', { name: 'New game' }).isVisible())) await tambola.first().click();
  } else {
    await tambola.first().click();
  }
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
}

/** TAM-213: the two ticket-type cards ("Paper tickets …", "Phone tickets …"), as buttons or radio buttons. */
export const ticketCard = (page: Page, kind: 'paper' | 'phone') => {
  const name = kind === 'paper' ? /^Paper tickets/ : /^Phone tickets/;
  return page.getByRole('button', { name }).or(page.getByRole('radio', { name })).first();
};

/** TAM-195 (owner 2026-10-01): the host's cue switch on the ticket-type step, shown once "Phone tickets" is chosen. */
export const cueSwitch = (page: Page) => {
  const name = /Players['’] phones say when their marks fill a prize pattern/;
  return page.getByRole('switch', { name }).or(page.getByRole('checkbox', { name })).first();
};
export const CUE_WARNING = /Some players may stop listening and wait for the phone/;

/**
 * The ticket-type step (TAM-213): tap a card, (phone only) turn the cue on if asked (TAM-195), then "Next" to the
 * players step. Until TAM-213 is built, tapping "Paper tickets" may move on at once (the older one-tap step).
 */
export async function chooseTicketType(page: Page, kind: 'paper' | 'phone', opts: { cue?: boolean } = {}) {
  await ticketCard(page, kind).click();
  if (opts.cue) await turnCueOn(page);
  const players = page.getByLabel('Number of players');
  const next = page.getByRole('button', { name: 'Next', exact: true });
  await expect(players.or(next).first()).toBeVisible();
  if (!(await players.isVisible())) await next.click();
  await expect(players).toBeVisible();
}

/** TAM-195: turns the host's cue switch on and accepts the warning (a dialog with "Turn on", or a note on the step). */
export async function turnCueOn(page: Page) {
  await expect(cueSwitch(page), 'the pattern-cue switch on the ticket-type step (TAM-195)').toBeVisible();
  await cueSwitch(page).click();
  await expect(page.getByText(CUE_WARNING).first(), 'the warning when the cue is turned on').toBeVisible();
  const turnOn = page.getByRole('dialog').getByRole('button', { name: 'Turn on', exact: true });
  if (await turnOn.isVisible()) await turnOn.click();
  await expect(cueSwitch(page)).toBeChecked();
}

/** Tambola → New game → Paper tickets (→ Next) → players → contribution → Confirm prizes. */
export async function setUpPaperGame(page: Page, opts: SetupOptions = {}) {
  const names = opts.players ?? ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani'];
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await chooseTicketType(page, 'paper');
  await fillPlayers(page, names);
  await page.getByRole('button', { name: 'Next' }).click();
  if (opts.contribution === 'none') {
    await page.getByRole('button', { name: 'No money' }).click();
  } else {
    await page.getByLabel('Contribution per ticket').fill(String(opts.contribution ?? 50));
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await confirmPrizes(page, opts.session);
}

/**
 * Taps "Confirm prizes", then answers the session question if the app asks it (PLT-016, Phase 1b): the first
 * game of a gathering asks for a session name; a game more than 3 hours after the session's last game asks
 * "Continue '<name>' or start a new session?". By default the helper keeps the suggested name, or continues.
 */
export async function confirmPrizes(page: Page, session?: SessionAnswer) {
  const confirm = page.getByRole('button', { name: 'Confirm prizes' });
  await expect(confirm).toBeVisible();
  // PLT-029 (owner, 2026-09-30): a first game, or one after 3 hours, may show "Session: Sunday 4 Oct (new) · Change"
  // instead of asking afterwards. A test that names its session then names it through "Change".
  const line = page.getByTestId('session-line');
  if (session?.name && (await line.isVisible()) && /\(new\)/.test((await line.textContent()) ?? '')) {
    await line.getByRole('button', { name: /^Change/ }).click();
    await page.getByRole('button', { name: 'New session', exact: true }).click();
    await sessionNameField(page).fill(session.name);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(line).toContainText(`Session: ${session.name}`);
  }
  await confirm.click();
  await answerSession(page, session);
  await expect(nextNumber(page)).toBeVisible();
}

/** How a test answers the session question: keep the suggestion / continue (default), a name, or a new session. */
export type SessionAnswer = { name?: string; newSession?: boolean };

export const sessionNameField = (page: Page) => page.getByLabel('Session name', { exact: true });
export const continueOrNew = (page: Page) => page.getByText(/Continue .+ or start a new session\?/).first();

/** Answers the session question if one is showing (or appears together with the game screen). */
export async function answerSession(page: Page, answer: SessionAnswer = {}) {
  await expect(nextNumber(page).or(sessionNameField(page)).or(continueOrNew(page)).first()).toBeVisible();
  // The question may show over the game screen: give it a moment to appear.
  await sessionNameField(page).or(continueOrNew(page)).first().waitFor({ state: 'visible', timeout: 500 }).catch(() => {});
  if (await continueOrNew(page).isVisible()) {
    if (answer.newSession || answer.name) {
      await page.getByRole('button', { name: 'New session', exact: true }).click();
    } else {
      await page.getByRole('button', { name: /^Continue / }).click();
    }
  }
  if (await sessionNameField(page).isVisible()) {
    if (answer.name) await sessionNameField(page).fill(answer.name);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
  }
}

/** The shared players step (PLT-024): number of players, then a name box per player. */
export async function fillPlayers(page: Page, names: string[]) {
  await page.getByLabel('Number of players').fill(String(names.length));
  for (const [i, name] of names.entries()) {
    await page.getByLabel(`Name of player ${i + 1}`, { exact: true }).fill(name);
  }
}

export const nextNumber = (page: Page) => page.getByRole('button', { name: 'Next number' });
export const currentNumber = (page: Page) => page.getByTestId('current-number');
export const currentRhyme = (page: Page) => page.getByTestId('current-rhyme');
export const lastCalls = (page: Page) => page.getByTestId('last-calls');
export const board = (page: Page) => page.getByTestId('board');

/** Taps "Next number" and waits for a new number to show. Returns it. */
export async function call(page: Page): Promise<number> {
  const before = (await currentNumber(page).count()) ? ((await currentNumber(page).textContent()) ?? '').trim() : '';
  await nextNumber(page).click();
  await expect(currentNumber(page)).not.toHaveText(before === '' ? /^$/ : before);
  await expect(currentNumber(page)).toHaveText(/^\s*\d{1,2}\s*$/);
  return Number((await currentNumber(page).textContent())!.trim());
}

/** Calls `times` numbers and returns them in call order. */
export async function callMany(page: Page, times: number): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < times; i++) out.push(await call(page));
  return out;
}

/** The menu (⋯) in the top bar, named "Menu" (TAM-109: every icon has a word). */
export const menuButton = (page: Page) => page.getByRole('button', { name: /Menu/ });

/** An item of the menu: Settings, Show the room, Board, Check numbers, End game, Discard game (TAM-124). */
export const menuItem = (page: Page, name: string) =>
  page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

/** Opens the menu (if needed) and taps one of its items. */
export async function fromMenu(page: Page, name: string) {
  if (!(await menuItem(page, name).first().isVisible())) await menuButton(page).click();
  await menuItem(page, name).first().click();
}

/** The sheet the board opens in (TAM-127), and the one tap that closes it. */
const boardSheet = (page: Page) => page.getByRole('dialog').filter({ has: board(page) });
export async function closeBoard(page: Page) {
  await boardSheet(page).getByRole('button', { name: /^(Close|Done|Back)/ }).first().click();
  await expect(board(page)).toBeHidden();
}

/** The 1–90 board (TAM-016): opened from the menu as a sheet (TAM-127). Returns true if it had to be opened. */
export async function openBoard(page: Page): Promise<boolean> {
  if (await board(page).isVisible()) return false;
  await fromMenu(page, 'Board');
  await expect(board(page)).toBeVisible();
  return true;
}

/** The numbers marked on the host board (cells with data-called="true"), in board order. Leaves the screen as it was. */
export async function calledNumbers(page: Page): Promise<number[]> {
  const opened = await openBoard(page);
  const cells = board(page).locator('[data-called="true"]');
  const out = (await cells.allTextContents()).map((t) => Number(t.trim()));
  if (opened) await closeBoard(page);
  return out;
}

/** Paper tickets (TAM-037): Record a win → prize → player(s) → Confirm. No numbers are typed. */
export async function recordWin(page: Page, pattern: string, players: string[]) {
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: pattern, exact: true }).click();
  for (const p of players) await page.getByRole('button', { name: p, exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
}

/** Paper tickets (TAM-037): the anchor ruled a bogey. Record a win → prize → player → Bogey. */
export async function recordBogey(page: Page, pattern: string, player: string) {
  await page.getByRole('button', { name: 'Record a win' }).click();
  await page.getByRole('button', { name: pattern, exact: true }).click();
  await page.getByRole('button', { name: player, exact: true }).click();
  await page.getByRole('button', { name: 'Bogey', exact: true }).click();
}

/** The optional helper (TAM-139): menu → Check numbers → pattern → numbers read out → Check. */
export async function checkNumbers(page: Page, pattern: string, numbers: number[]) {
  await fromMenu(page, 'Check numbers');
  await page.getByRole('button', { name: pattern, exact: true }).click();
  await page.getByLabel('Numbers read out').fill(numbers.join(' '));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

/** Closes whatever sheet or dialog is open (Close, Done, Back or Cancel), never the top bar's Back. */
export async function dismiss(page: Page) {
  const dialogs = page.getByRole('dialog');
  const n = await dialogs.count();
  const scope = n > 0 && (await dialogs.nth(n - 1).isVisible()) ? dialogs.nth(n - 1) : page.locator('body');
  await scope
    .locator('button:not([data-testid="top-bar"] *)')
    .filter({ hasText: /^\s*(Close|Done|Back|Cancel)\b/ })
    .first()
    .click();
}

/** The undo toast (TAM-125): "Called 21 · Undo (5s)". */
export const undoToast = (page: Page) => page.getByTestId('undo-toast');
/** The undo for the last call (TAM-119): on the toast (TAM-125 checks the toast itself). */
export const undoLastCall = (page: Page) =>
  undoToast(page).getByRole('button', { name: /Undo/ }).or(page.getByRole('button', { name: 'Undo last call' })).first();

/** True when "Next number" can't be tapped: hidden, disabled, or turned into "Close Top Line" (TAM-145, TAM-198). */
export async function nextNumberWaits(page: Page): Promise<boolean> {
  const b = page.getByRole('button', { name: 'Next number', exact: true });
  return (await b.count()) === 0 || !(await b.isVisible()) || (await b.isDisabled());
}

export async function endGame(page: Page) {
  await fromMenu(page, 'End game');
  await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click();
}

/** Things every screen can be checked for: the app never moves money (TAM-090). */
export async function expectNoPaymentUi(page: Page) {
  await expect(page.getByText(/\b(pay now|upi:\/\/|wallet|send money|payment link)\b/i)).toHaveCount(0);
  await expect(page.locator('a[href^="upi:"]')).toHaveCount(0);
}

// ---- Phase 1b ----

/** "N of 90 called" from the top bar: how many numbers have been called. */
export async function calledCount(page: Page): Promise<number> {
  const text = (await page.getByTestId('top-bar').textContent()) ?? '';
  const m = text.match(/(\d+) of 90 called/);
  return m ? Number(m[1]) : 0;
}

/** A setting's on/off control: a checkbox or a switch with this name. */
export const toggle = (page: Page, name: string) =>
  page.getByRole('checkbox', { name, exact: true }).or(page.getByRole('switch', { name, exact: true })).first();

/** Turns a switch on in the game's Settings (menu → Settings); confirms a one-time warning if one shows. */
export async function turnOnInGame(page: Page, name: string, { confirmWarning = true } = {}) {
  await fromMenu(page, 'Settings');
  await toggle(page, name).click();
  const warning = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Turn on', exact: true }) });
  if (confirmWarning && (await warning.isVisible().catch(() => false))) {
    await warning.getByRole('button', { name: 'Turn on', exact: true }).click();
  }
}

/** Records a win for every tier in play for one player, closes each, then ends the game (TAM-037, TAM-145). */
export async function winEverythingAndEnd(page: Page, player: string, tiers: string[]) {
  if ((await calledCount(page)) === 0) await call(page);
  for (const tier of tiers) {
    await recordWin(page, tier, [player]);
    await page.getByRole('button', { name: `Close ${tier}`, exact: true }).click();
  }
  const endNow = page.getByRole('button', { name: 'End game and show payouts' });
  if (await endNow.isVisible()) await endNow.click();
  else await endGame(page);
  await expect(page.getByTestId('payout-summary')).toBeVisible();
}

/** The tiers suggested for 2 to 5 tickets (TAM-081). */
export const THREE_TIERS = ['Early Five', 'Top Line', 'Full House'];

/** Opens an item that Home offers directly or inside its menu ⋯ (PLT-300: Sessions, History, Report a problem, Settings). */
export async function fromHome(page: Page, name: string) {
  const item = page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('button', { name, exact: true })).first();
  const menu = page.getByRole('button', { name: /Menu/ }).first();
  await expect(item.or(menu).first()).toBeVisible();
  if (!(await item.isVisible())) await menu.click();
  await item.click();
}

/** Home → Sessions (PLT-022). */
export async function openSessions(page: Page) {
  await page.goto(HOME);
  await expect(page.getByRole('main').first()).toBeVisible();
  await fromHome(page, 'Sessions');
}

/** Home → Sessions → the session with this name. */
export async function openSession(page: Page, name: string | RegExp) {
  await openSessions(page);
  await page.getByTestId('session').filter({ hasText: name }).first().click();
}

/** The people in the tally on screen: name, paid, got back, net (from the row's data attributes). */
export async function tallyPeople(page: Page, scope = 'tally') {
  const rows = page.getByTestId(scope).getByTestId('tally-person');
  const n = await rows.count();
  const out: { name: string; paid: number; gotBack: number; net: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    out.push({
      name: (await r.getAttribute('data-name')) ?? '',
      paid: Number(await r.getAttribute('data-paid')),
      gotBack: Number(await r.getAttribute('data-got-back')),
      net: Number(await r.getAttribute('data-net')),
    });
  }
  return out;
}

/** Home → History. */
export async function openHistory(page: Page) {
  await page.goto(HOME);
  await expect(page.getByRole('main').first()).toBeVisible();
  await fromHome(page, 'History');
}

/**
 * Home → the typed-code form (TAM-117, PLT-300): "Join with my ticket" → "Type the code", then the field "Ticket code"
 * and "Open ticket". Until Home changes, the older "Enter ticket code" on Home is tapped instead.
 */
export async function openTypedCode(page: Page) {
  const field = page.getByLabel('Ticket code', { exact: true });
  const old = page.getByRole('button', { name: 'Enter ticket code', exact: true });
  await expect(joinWithMyTicket(page).or(old).first()).toBeVisible();
  if (await joinWithMyTicket(page).isVisible()) {
    await joinWithMyTicket(page).click();
    await page.getByRole('button', { name: /^Type the code/ }).click();
  } else {
    await old.click();
  }
  await expect(field).toBeVisible();
}

/** Types a ticket code on a phone at Home and opens it (TAM-117). */
export async function typeTicketCode(page: Page, code: string) {
  await openTypedCode(page);
  await page.getByLabel('Ticket code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Open ticket', exact: true }).click();
}

/**
 * Stands in for the phone's voice (speechSynthesis), before the page loads. `voices: null` means the phone has
 * no voice at all. With `fail`, every utterance ends in an error, as a broken voice does. What the app asked
 * to be said is in `window.__spoken`: { text, lang, voice, voiceLang }.
 */
export async function fakeVoices(page: Page, voices: { name: string; lang: string }[] | null, fail = false) {
  await page.addInitScript(
    ({ voices, fail }) => {
      const w = window as any;
      w.__spoken = [];
      if (voices === null) {
        Object.defineProperty(w, 'speechSynthesis', { configurable: true, value: undefined });
        return;
      }
      class Utterance {
        text: string; lang = ''; voice: any = null; rate = 1; pitch = 1; volume = 1;
        onstart: any = null; onend: any = null; onerror: any = null;
        private l: Record<string, ((e: any) => void)[]> = {};
        constructor(text = '') { this.text = text; }
        addEventListener(t: string, f: (e: any) => void) { (this.l[t] ??= []).push(f); }
        removeEventListener(t: string, f: (e: any) => void) { this.l[t] = (this.l[t] ?? []).filter((x) => x !== f); }
        fire(type: string, extra: Record<string, unknown> = {}) {
          const e = Object.assign(new Event(type), { utterance: this, charIndex: 0, elapsedTime: 0 }, extra);
          (this as any)['on' + type]?.(e);
          (this.l[type] ?? []).forEach((f) => f(e));
        }
      }
      const list = voices.map((v) => ({ name: v.name, lang: v.lang, default: false, localService: true, voiceURI: v.name }));
      const synth = {
        speaking: false, pending: false, paused: false, onvoiceschanged: null,
        getVoices: () => list,
        speak(u: any) {
          w.__spoken.push({ text: u.text, lang: u.lang ?? '', voice: u.voice?.name ?? null, voiceLang: u.voice?.lang ?? null });
          setTimeout(() => (fail ? u.fire?.('error', { error: 'synthesis-failed' }) : (u.fire?.('start'), u.fire?.('end'))), 20);
        },
        cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
      };
      Object.defineProperty(w, 'speechSynthesis', { configurable: true, value: synth });
      Object.defineProperty(w, 'SpeechSynthesisUtterance', { configurable: true, writable: true, value: Utterance });
    },
    { voices, fail },
  );
}

/** What the app has asked the phone to say so far. */
export const spoken = (page: Page): Promise<{ text: string; lang: string; voice: string | null; voiceLang: string | null }[]> =>
  page.evaluate(() => (window as any).__spoken ?? []);

/** Pretends the app went to the background and came back (visibilitychange). */
export async function backgroundAndReturn(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
  });
}

// ---- Money and 1b review fixes (29 September 2026), play-test fixes (30 September 2026) ----

/**
 * The big button at the bottom of the calling screen (TAM-100, TAM-198): "Next number", or "Close Top Line"
 * ("Close <Pattern>") while a recorded win waits to be closed.
 */
export const mainButton = (page: Page) => page.getByTestId('main-button');

/** One person's row on the payout screen (TAM-088, TAM-089, owner 2026-09-30): name, paid, prize won, net. */
export async function payoutPeople(page: Page) {
  const rows = page.getByTestId('payout-summary').getByTestId('payout-person');
  const n = await rows.count();
  const out: { name: string; paid: number; won: number; net: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    out.push({
      name: (await r.getAttribute('data-name')) ?? '',
      paid: Number(await r.getAttribute('data-paid')),
      won: Number(await r.getAttribute('data-won')),
      net: Number(await r.getAttribute('data-net')),
    });
  }
  return out;
}

/** After "Settle with host" (TAM-089): what the host gives each person, one `host-gives` per person listed. */
export async function hostGivesList(page: Page) {
  const rows = page.getByTestId('settle-with-host').getByTestId('host-gives');
  const n = await rows.count();
  const out: { name: string; amount: number; text: string }[] = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    out.push({
      name: (await r.getAttribute('data-name')) ?? '',
      amount: Number(await r.getAttribute('data-amount')),
      text: ((await r.textContent()) ?? '').replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}

/** The hand-overs inside a container (`settle-with-players` on the payout screen, `settle-up` in a session). */
export async function handOvers(page: Page, scope: string) {
  const rows = page.getByTestId(scope).getByTestId('hand-over');
  const n = await rows.count();
  const out: { from: string; to: string; amount: number; text: string }[] = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    out.push({
      from: (await r.getAttribute('data-from')) ?? '',
      to: (await r.getAttribute('data-to')) ?? '',
      amount: Number(await r.getAttribute('data-amount')),
      text: ((await r.textContent()) ?? '').replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}

/** Fixed at the bottom of the screen: fully on screen without scrolling, its bottom edge within 40 px of the screen's (TAM-181). */
export async function expectAtBottom(page: Page, l: Locator, what: string) {
  const vp = page.viewportSize()!;
  const b = await l.boundingBox();
  expect(b, `${what} is on the screen`).not.toBeNull();
  expect(b!.y, `${what} starts on the screen`).toBeGreaterThanOrEqual(-0.5);
  expect(b!.y + b!.height, `${what} ends on the screen`).toBeLessThanOrEqual(vp.height + 0.5);
  expect(vp.height - (b!.y + b!.height), `${what} is within 40 px of the bottom`).toBeLessThanOrEqual(40);
  return b!;
}

/** The element's centre is not covered by anything else (it is the topmost thing there, or holds it). */
export const onTopAtCentre = (l: Locator) =>
  l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });

/**
 * TAM-181: scrolls `last` into view and checks it sits wholly above every one of `buttons` and is not covered.
 */
export async function expectNotHiddenBehind(page: Page, last: Locator, buttons: Locator[], what: string) {
  await last.scrollIntoViewIfNeeded();
  const lb = (await last.boundingBox())!;
  for (const b of buttons) {
    const bb = (await b.boundingBox())!;
    expect(lb.y + lb.height, `${what} sits above the fixed buttons`).toBeLessThanOrEqual(bb.y + 0.5);
  }
  expect(await onTopAtCentre(last), `${what} is not covered`).toBe(true);
}

// ---- UX list of 1 October 2026: one main button per screen (PLT-301, UX guideline 17a) ----

/**
 * The "main look" (PLT-301): a solid fill that stands out from what is behind it. The button's background is opaque
 * (alpha at least 0.9, opacity at least 0.9) and has a contrast of at least 3:1 with the colour behind it (the
 * nearest ancestor with an opaque background, or white). A light tint (a chosen option) or no fill is not the main look.
 * Runs in the page: it must stay self-contained (no outside names).
 */
function mainLookIn(el: Element): boolean {
  const parse = (c: string) => {
    const m = c.match(/[\d.]+/g) ?? ['0', '0', '0', '0'];
    return { r: +m[0]!, g: +m[1]!, b: +m[2]!, a: m[3] === undefined ? 1 : +m[3] };
  };
  const lum = (c: { r: number; g: number; b: number }) => {
    const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const own = parse(getComputedStyle(el).backgroundColor);
  if (own.a < 0.9 || Number(getComputedStyle(el).opacity) < 0.9) return false;
  let behind = { r: 255, g: 255, b: 255, a: 1 };
  for (let e = el.parentElement; e; e = e.parentElement) {
    const c = parse(getComputedStyle(e).backgroundColor);
    if (c.a >= 0.9) { behind = c; break; }
  }
  const a = lum(own), b = lum(behind);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 3;
}

/** True when this button has the main look (PLT-301). */
export const hasMainLook = (l: Locator) => l.evaluate(mainLookIn);

/**
 * Outlined (PLT-301): not the main look, with a visible line around it: a border of at least 1 px in a colour that is
 * not transparent, a CSS outline, or a box-shadow.
 */
export async function isOutlined(l: Locator): Promise<boolean> {
  if (await hasMainLook(l)) return false;
  return l.evaluate((el) => {
    const s = getComputedStyle(el);
    const seen = (w: string, style: string, color: string) =>
      parseFloat(w) >= 1 && style !== 'none' && style !== 'hidden' && color !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(color);
    const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
    const border = sides.some((k) => seen(s.getPropertyValue(`border-${k.toLowerCase()}-width`), s.getPropertyValue(`border-${k.toLowerCase()}-style`), s.getPropertyValue(`border-${k.toLowerCase()}-color`)));
    const outline = seen(s.outlineWidth, s.outlineStyle, s.outlineColor);
    const shadow = s.boxShadow !== 'none' && s.boxShadow !== '';
    return border || outline || shadow;
  });
}

const CONTROLS = 'button, [role="button"], a[href], [role="radio"], [role="tab"], [role="switch"]';

/**
 * Every visible control on the screen with the main look (PLT-301), by its words. With a dialog open, only the top
 * dialog's controls count (the screen behind it is covered); otherwise controls in dialogs and open menus are left out.
 */
export async function mainLookButtons(page: Page): Promise<string[]> {
  const dialogs = page.locator('[role="dialog"], [role="alertdialog"], dialog[open]').filter({ visible: true });
  const n = await dialogs.count();
  const scope = n ? dialogs.nth(n - 1).locator(CONTROLS) : page.locator(CONTROLS);
  const all = scope.filter({ visible: true });
  const out: string[] = [];
  for (let i = 0; i < (await all.count()); i++) {
    const c = all.nth(i);
    if (!n && (await c.evaluate((el) => !!el.closest('[role="dialog"], [role="alertdialog"], dialog, [role="menu"]')))) continue;
    if (!(await hasMainLook(c))) continue;
    out.push(((await c.getAttribute('aria-label')) || (await c.innerText())).replace(/\s+/g, ' ').trim());
  }
  return out;
}

/**
 * PLT-301: at most one control has the main look, and if one does, it is `next` (its words start with it). With
 * `required`, exactly that one has it. `next` null: none may have it.
 */
export async function expectOneMainButton(page: Page, where: string, next: string | null, required = false) {
  const main = await mainLookButtons(page);
  expect(main.length, `${where}: controls with the main look: ${JSON.stringify(main)}`).toBeLessThanOrEqual(1);
  if (next === null) expect(main, `${where}: no control should have the main look`).toEqual([]);
  else if (main.length) expect(main[0]!.startsWith(next), `${where}: the main look is on "${main[0]}", not on "${next}"`).toBe(true);
  if (required && next !== null) expect(main.length, `${where}: "${next}" has the main look`).toBe(1);
}

// ---- UX list of 1 October 2026, rows 8 to 15 ----

/**
 * The link look (TAM-181 hand-out, TAM-177 "Which prize?", owner 2026-10-01): a control that looks like a link, not a
 * button: not the main look, no fill of its own (background alpha below 0.1), no border of 1 px or more in a visible
 * colour, no CSS outline at rest, and no box-shadow. A real link (`a[href]` or `role="link"`) must look the same way.
 */
export async function hasLinkLook(l: Locator): Promise<boolean> {
  if (await hasMainLook(l)) return false;
  return l.evaluate((el) => {
    const s = getComputedStyle(el);
    const alpha = (c: string) => { const m = c.match(/[\d.]+/g); return !m ? 0 : m[3] === undefined ? 1 : +m[3]; };
    if (alpha(s.backgroundColor) >= 0.1) return false;
    for (const k of ['top', 'right', 'bottom', 'left']) {
      const w = parseFloat(s.getPropertyValue(`border-${k}-width`));
      const st = s.getPropertyValue(`border-${k}-style`);
      if (w >= 1 && st !== 'none' && st !== 'hidden' && alpha(s.getPropertyValue(`border-${k}-color`)) > 0.05) return false;
    }
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1) return false;
    return s.boxShadow === 'none' || s.boxShadow === '';
  });
}

/** Relative luminance (WCAG) of a CSS colour "rgb(…)" / "rgba(…)". */
export function luminance(color: string): number {
  const m = color.match(/[\d.]+/g) ?? ['0', '0', '0'];
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(+m[0]!) + 0.7152 * f(+m[1]!) + 0.0722 * f(+m[2]!);
}
/** WCAG contrast ratio of two CSS colours. */
export const contrast = (a: string, b: string) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** A neutral grey (or black or white): its red, green and blue differ by at most 24 (TAM-183 "Remove", owner 2026-10-01). */
export const isNeutral = (color: string) => {
  const m = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  return Math.max(...m) - Math.min(...m) <= 24;
};

/** The element's own background, and the opaque colour behind it (the nearest ancestor with alpha ≥ 0.9, or white). */
export const backgrounds = (l: Locator) =>
  l.evaluate((el) => {
    const alpha = (c: string) => { const m = c.match(/[\d.]+/g); return !m ? 0 : m[3] === undefined ? 1 : +m[3]; };
    let behind = 'rgb(255, 255, 255)';
    for (let e = el.parentElement; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (alpha(c) >= 0.9) { behind = c; break; }
    }
    const own = getComputedStyle(el).backgroundColor;
    return { own: alpha(own) >= 0.9 ? own : behind, behind, color: getComputedStyle(el).color };
  });
