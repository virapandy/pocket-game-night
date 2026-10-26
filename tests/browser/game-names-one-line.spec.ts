// PLT-303 (specs/platform/05-home-and-buttons.md; product owner, 26 October 2026, C1 for every game): a game's name never
// breaks across lines. On Home ("Host a game", the unfinished-games rows), "Join a game", the picker, History (rows and a
// past game's title) and a game's own headers ("Tonight's What Am I?"), every word of "Secret Words" and "What Am I?" (and
// the one-word names) sits on one line, at 320 × 568, 360 × 640, 568 × 320 and 812 × 375.
// How it is measured: each on-screen occurrence of a game name is wrapped in a Range; if its pieces sit on more than one
// line, the name broke. Text hidden for screen readers only (clipped boxes) is not on screen and is left out.
import { expect, test } from './fixtures';
import { joinAGame, HOME, fromHome } from './helpers';
import { variant, inProgress, ended } from './secret-words-a';
import {
  TZ, addNames, button, card, dialog, guards, heading, mainButton, openApp, playTurn, saveScore, startNight, tap, toPicker,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ });

const SIZES = [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 568, height: 320 }, { width: 812, height: 375 }];
const ALL = ['Tambola', 'Impostor', 'Secret Words', 'What Am I?', 'Mafia'];

/** Every game name on screen: what it is, and whether its words sit on more than one line. */
async function namesOnScreen(page: Page): Promise<{ name: string; broken: boolean; context: string }[]> {
  return page.evaluate(() => {
    const res = [/Tambola/g, /Impostor/g, /Secret\s+Words/g, /What\s+Am\s+I\?/g, /Mafia/g];
    const clipped = (el: Element | null): boolean => {
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden') return true;
        if ((s.clip && s.clip !== 'auto') || (s.clipPath && s.clipPath !== 'none')) return true;
        const r = e.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) return true;
      }
      return false;
    };
    const out: { name: string; broken: boolean; context: string }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.nodeValue ?? '';
      if (!t.trim() || clipped(n.parentElement)) continue;
      for (const re of res) {
        re.lastIndex = 0;
        for (let m = re.exec(t); m; m = re.exec(t)) {
          const r = document.createRange();
          r.setStart(n, m.index);
          r.setEnd(n, m.index + m[0].length);
          const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0.5 && x.height > 0.5);
          if (!rects.length) continue;
          const mid = rects.map((x) => x.top + x.height / 2);
          const h = Math.min(...rects.map((x) => x.height));
          out.push({
            name: m[0].replace(/\s+/g, ' '),
            broken: Math.max(...mid) - Math.min(...mid) > h / 2,
            context: t.replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
      }
    }
    return out;
  });
}

/** No game name on this screen breaks; and each name in `expected` is on it. */
async function expectNamesWhole(page: Page, where: string, expected: string[]) {
  await page.clock.runFor(300);
  const found = await namesOnScreen(page);
  for (const name of expected) expect(found.some((f) => f.name === name), `${where}: "${name}" is on the screen`).toBe(true);
  const broken = found.filter((f) => f.broken).map((f) => `"${f.name}" in "${f.context}"`);
  expect(broken, `${where}: a game name broke across lines`).toEqual([]);
}

/** A phone holding Secret Words game nights: one unfinished (Home's row) and one ended (History). */
function swStorage(now: number): Record<string, unknown> {
  const open = inProgress();
  const done = variant(ended(), { id: 'sw-ended-plt303', shift: -2 * 86_400_000 });
  const storage: Record<string, unknown> = {};
  for (const g of [open, done]) {
    storage[`pgn.game.${g.id}`] = g;
    storage[`pgn.session.${g.sessionId}`] = { format: 1, id: g.sessionId, name: 'Thursday 22 Oct', createdAt: Math.min(g.createdAt, now) - 60_000, settlements: [] };
  }
  return storage;
}
const SW_NOW = inProgress().records.at(-1).at + 60_000;

for (const size of SIZES) {
  test.describe(`PLT-303 at ${size.width} × ${size.height}`, () => {
    test.use({ viewport: size });

    test('Home ("Host a game" and the unfinished rows), "Join a game" and the picker: no game name breaks', async ({ page }) => {
      test.setTimeout(90_000);
      await openApp(page, { time: SW_NOW, storage: swStorage(SW_NOW), viewport: size });
      await expectNamesWhole(page, 'Home', ALL);
      await toPicker(page);
      await expectNamesWhole(page, 'the picker "What shall we play?"', ALL);
      await tap(page, card(page));
      await expect(heading(page, "Who's playing?")).toBeVisible();
      await addNames(page, ['Riya', 'Arjun']);
      await tap(page, mainButton(page)); // Words and time
      await tap(page, mainButton(page)); // Read this aloud
      await tap(page, mainButton(page)); // First turn
      await expect(heading(page, "Riya, you're guessing")).toBeVisible();
      await tap(page, button(page, '← Home (game saved)'));
      await expect(page.getByTestId('unfinished-games').filter({ hasText: 'What Am I?' })).toBeVisible();
      await expectNamesWhole(page, 'Home with unfinished What Am I? and Secret Words rows', [...ALL]);
      await guards(page);
      await joinAGame(page).click();
      await expect(page.getByText(/^What Am I\? is played on the host's phone/)).toBeVisible();
      await expectNamesWhole(page, '"Join a game"', ['What Am I?', 'Secret Words']);
    });

    test('a game\'s header ("Tonight\'s What Am I?"), History\'s rows and a past game\'s title: no game name breaks', async ({ page }) => {
      test.setTimeout(120_000);
      await startNight(page, { seed: 'plt303', players: ['Riya', 'Arjun'], turnTime: 30, viewport: size });
      await playTurn(page, 'G'); await saveScore(page);
      await playTurn(page, 'G'); await saveScore(page);
      await tap(page, button(page, 'End the game'));
      await tap(page, dialog(page, 'End the game?').getByRole('button', { name: 'End the game', exact: true }));
      await tap(page, button(page, 'End for tonight'));
      await tap(page, dialog(page, 'End for tonight?').getByRole('button', { name: 'End for tonight', exact: true }));
      await expect(heading(page, "Tonight's What Am I?")).toBeVisible();
      await expectNamesWhole(page, "Tonight's What Am I? (G2)", ['What Am I?']);
      // a Secret Words night in History as well
      await page.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v)); }, swStorage(Date.now()));
      await page.goto(HOME);
      await guards(page);
      await fromHome(page, 'History');
      await expect(page.getByText('What Am I? · 1 game', { exact: true })).toBeVisible();
      await expectNamesWhole(page, 'History', ['What Am I?', 'Secret Words']);
      await tap(page, page.getByText('What Am I? · 1 game', { exact: true }));
      await expect(page.getByText(/Riya/).first()).toBeVisible();
      await expectNamesWhole(page, 'History, the What Am I? game night', ['What Am I?']);
    });
  });
}
