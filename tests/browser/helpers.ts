// Browser helpers: how the tests find things on screen. The names below are what the app must show;
// they come from the scenarios and journeys (buttons named as in the specs). Listed in tests/browser/README.md.
import { expect, type Page } from '@playwright/test';

export const HOME = './';

export interface SetupOptions {
  players?: string[]; // names; '' leaves a name blank
  contribution?: number | 'none';
  session?: { name?: string; newSession?: boolean }; // how to answer the session question (PLT-016)
}

export async function openTambola(page: Page) {
  await page.goto(HOME);
  await page.getByRole('button', { name: /^Tambola/ }).click();
}

/** Tambola → New game → Paper tickets → players → contribution → Confirm prizes. */
export async function setUpPaperGame(page: Page, opts: SetupOptions = {}) {
  const names = opts.players ?? ['Riya', 'Asha', 'Dad', 'Kabir', 'Meera', 'Nani'];
  await openTambola(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Paper tickets' }).click();
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
  await page.getByRole('button', { name: 'Confirm prizes' }).click();
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

/** True when "Next number" can't be tapped: hidden, disabled, or showing "Close Top Line first" (TAM-126, TAM-145). */
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

/** Home → Sessions (PLT-022). */
export async function openSessions(page: Page) {
  await page.goto(HOME);
  await page.getByRole('button', { name: 'Sessions', exact: true }).click();
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
  await page.getByRole('button', { name: 'History' }).click();
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
