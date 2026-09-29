// Phase 1b: the phone's voice, optional and off by default.
// Scenarios: TAM-061 (a friendly warning, once), TAM-062 (each shortcut has its own warning), TAM-180 (the phone
// says number, rhyme, number; Indian English first; Hindi only with a Hindi voice; greyed out with no voice),
// TAM-185 (Repeat and Another rhyme speak again; one-tap mute), TAM-187 (a voice that fails never stops the game).
// The phone's voice is stood in for by fakeVoices() in helpers.ts. Names: tests/browser/README.md.
import { expect, test, type Page } from './fixtures';
import {
  call, confirmPrizes, currentNumber, currentRhyme, dismiss, endGame, fakeVoices, fromMenu, openTambola, setUpPaperGame, spoken, toggle,
  turnOnInGame,
} from './helpers';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Hindi rhyme texts per number in the app's pack. Since TAM-153 changed (2026-09-29), a Hindi game shows an
 *  English rhyme for numbers with no Hindi one, so the Hindi-voice checks wait for a call with a Hindi rhyme. */
const HINDI: Set<string> = new Set(
  (JSON.parse(readFileSync(fileURLToPath(new URL('../../content/tambola/rhymes.json', import.meta.url)), 'utf8')).rhymes as
    { n: number; lang: string; text: string }[]).filter((r) => r.lang === 'hi').map((r) => `${r.n}|${r.text.trim()}`),
);
const isHindi = (h: { n: number; rhyme: string }) => HINDI.has(`${h.n}|${h.rhyme}`);

const EN_IN = { name: 'Veena', lang: 'en-IN' };
const EN_US = { name: 'Samantha', lang: 'en-US' };
const HI_IN = { name: 'Lekha', lang: 'hi-IN' };
const VOICE = 'Phone speaks the call';

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const words = (n: number) => (n < 20 ? ONES[n]! : `${TENS[Math.floor(n / 10)]}${n % 10 ? `[ -]?${ONES[n % 10]}` : ''}`);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The number said as digits or as words ("5" or "Five"). */
const said = (n: number) => `(?:${n}|${words(n)})`;

/** Everything said since `from`, joined up. */
async function saidSince(page: Page, from: number) {
  return (await spoken(page)).slice(from);
}

/** Calls a number and returns it, its rhyme, and what the phone said for it. */
async function callAndHear(page: Page) {
  const before = (await spoken(page)).length;
  const n = await call(page);
  const rhyme = ((await currentRhyme(page).textContent()) ?? '').trim();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(before);
  await page.waitForTimeout(200);
  const lines = await saidSince(page, before);
  return { n, rhyme, lines, text: lines.map((l) => l.text).join(' ') };
}

const warning = (page: Page) => page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Turn on', exact: true }) });

test.describe('TAM-061 and TAM-062: turning on a shortcut shows a friendly warning, once', () => {
  test('"Phone speaks the call" warns that the anchor\'s calling is part of the fun; Cancel leaves it off', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await fromMenu(page, 'Settings');
    await toggle(page, VOICE).click();
    await expect(warning(page)).toBeVisible();
    await expect(warning(page)).toContainText(/anchor/i);
    await warning(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(toggle(page, VOICE)).not.toBeChecked();
    await dismiss(page);
    await call(page);
    await page.waitForTimeout(300);
    expect(await spoken(page)).toEqual([]);
  });

  test('confirmed once, then off and on again in the same game: no second warning', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await expect(toggle(page, VOICE)).toBeChecked();
    await toggle(page, VOICE).click(); // off
    await expect(toggle(page, VOICE)).not.toBeChecked();
    await toggle(page, VOICE).click(); // on again
    await page.waitForTimeout(300);
    await expect(warning(page)).toHaveCount(0);
    await expect(toggle(page, VOICE)).toBeChecked();
  });

  test('"Auto-call" has its own warning the first time, even after the voice warning was seen', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await fromMenu(page, 'Settings');
    await toggle(page, VOICE).click();
    const voiceWarning = ((await warning(page).textContent()) ?? '').trim();
    await warning(page).getByRole('button', { name: 'Turn on', exact: true }).click();
    await toggle(page, 'Auto-call').click();
    await expect(warning(page)).toBeVisible();
    const autoWarning = ((await warning(page).textContent()) ?? '').trim();
    expect(autoWarning).not.toEqual(voiceWarning);
    await warning(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(toggle(page, 'Auto-call')).not.toBeChecked();
  });
});

test.describe('TAM-180: the phone\'s voice calls the number, only if the host wants it', () => {
  test('off in every new game; once on, it says the number, the rhyme, and the number again, in an Indian English voice', async ({ page }) => {
    await fakeVoices(page, [EN_US, EN_IN]);
    await setUpPaperGame(page);
    await call(page);
    await page.waitForTimeout(300);
    expect(await spoken(page)).toEqual([]);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    const { n, rhyme, lines, text } = await callAndHear(page);
    expect(rhyme.length).toBeGreaterThan(0);
    expect(text).toMatch(new RegExp(`^\\W*${said(n)}\\b[\\s\\S]*${escape(rhyme)}[\\s\\S]*\\b${said(n)}\\W*$`, 'i'));
    for (const l of lines) expect(l.voiceLang ?? l.lang).toBe('en-IN');
  });

  test('without an Indian English voice, any English voice is used', async ({ page }) => {
    await fakeVoices(page, [HI_IN, EN_US]);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    const { lines } = await callAndHear(page);
    for (const l of lines) expect(l.voiceLang ?? l.lang).toMatch(/^en/);
  });

  test('a Hindi rhyme is spoken only with a Hindi voice; otherwise only the number is spoken', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await openTambola(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Rhyme language').selectOption('hi');
    await dismiss(page);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    let heard = await callAndHear(page);
    for (let i = 0; i < 30 && !isHindi(heard); i++) heard = await callAndHear(page);
    expect(isHindi(heard), 'a number with a Hindi rhyme').toBe(true);
    expect(heard.text).not.toContain(heard.rhyme);
    expect(heard.text).toMatch(new RegExp(`\\b${said(heard.n)}\\b`, 'i'));
  });

  test('with a Hindi voice, the Hindi rhyme is spoken in it', async ({ page }) => {
    await fakeVoices(page, [EN_IN, HI_IN]);
    await openTambola(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Rhyme language').selectOption('hi');
    await dismiss(page);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    let heard = await callAndHear(page);
    for (let i = 0; i < 30 && !isHindi(heard); i++) heard = await callAndHear(page);
    expect(isHindi(heard), 'a number with a Hindi rhyme').toBe(true);
    const hindi = heard.lines.filter((l) => l.text.includes(heard.rhyme));
    expect(hindi.length).toBeGreaterThan(0);
    for (const l of hindi) expect(l.voiceLang ?? l.lang).toMatch(/^hi/);
  });

  test('if the phone has no voice at all, the option is greyed out with a one-line reason', async ({ page }) => {
    await fakeVoices(page, null);
    await setUpPaperGame(page);
    await fromMenu(page, 'Settings');
    await expect(toggle(page, VOICE)).toBeDisabled();
    await expect(page.getByText(/(no|doesn['’]t have a|does not have a|can['’]t find a) (voice|speech)|can['’]t speak|cannot speak/i).first()).toBeVisible();
  });

  test('Play again: the voice is off again in the new game', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page, { players: ['Riya', 'Asha'] });
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    await callAndHear(page);
    await endGame(page);
    await page.getByRole('button', { name: 'Play again' }).click();
    await confirmPrizes(page);
    const before = (await spoken(page)).length;
    await call(page);
    await page.waitForTimeout(300);
    expect((await spoken(page)).length).toBe(before);
  });
});

test.describe('TAM-185: the phone\'s voice repeats when asked', () => {
  test('Repeat says the same number and rhyme again; Another rhyme says the number with the new rhyme', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    const first = await callAndHear(page);

    let before = (await spoken(page)).length;
    await page.getByRole('button', { name: 'Repeat', exact: true }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(before);
    await page.waitForTimeout(200);
    expect((await saidSince(page, before)).map((l) => l.text).join(' ')).toBe(first.text);

    before = (await spoken(page)).length;
    await page.getByRole('button', { name: 'Another rhyme', exact: true }).click();
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(before);
    await page.waitForTimeout(200);
    const rhyme = ((await currentRhyme(page).textContent()) ?? '').trim();
    const text = (await saidSince(page, before)).map((l) => l.text).join(' ');
    await expect(currentNumber(page)).toHaveText(String(first.n));
    expect(text).toMatch(new RegExp(`\\b${said(first.n)}\\b`, 'i'));
    if (rhyme) expect(text).toContain(rhyme);
  });

  test('the host can mute the voice with one tap, and turn it back on without the warning', async ({ page }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    await callAndHear(page);
    await page.getByRole('button', { name: 'Mute voice', exact: true }).click();
    const before = (await spoken(page)).length;
    await call(page);
    await page.waitForTimeout(300);
    expect((await spoken(page)).length).toBe(before);
    await page.getByRole('button', { name: 'Unmute voice', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(warning(page)).toHaveCount(0);
    await callAndHear(page);
  });
});

test.describe('TAM-187: a voice that fails never stops the game', () => {
  test('with no internet, a voice that works offline still speaks', async ({ page, context }) => {
    await fakeVoices(page, [EN_IN]);
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    await context.setOffline(true);
    await callAndHear(page);
    await context.setOffline(false);
  });

  test('if the phone cannot speak, the number still shows, and the host sees one short note, once', async ({ page, context }) => {
    await fakeVoices(page, [EN_IN], true);
    // Count how many times the note appears on screen (from absent to shown).
    await page.addInitScript(() => {
      const w = window as any;
      w.__noteShown = 0;
      let showing = false;
      const check = () => {
        const now = /The phone.s voice isn.t working; the anchor calls/.test(document.body?.innerText ?? '');
        if (now && !showing) w.__noteShown++;
        showing = now;
      };
      new MutationObserver(check).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await setUpPaperGame(page);
    await turnOnInGame(page, VOICE);
    await dismiss(page);
    await context.setOffline(true);
    const n = await call(page);
    await expect(currentNumber(page)).toHaveText(String(n));
    await expect(page.getByText(/The phone.s voice isn.t working; the anchor calls/)).toBeVisible();
    for (let i = 0; i < 3; i++) await call(page);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__noteShown)).toBe(1);
    await context.setOffline(false);
  });
});
