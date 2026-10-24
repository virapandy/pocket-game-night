// What Am I? setup screens (specs/what-am-i/01-setup.md, scenarios version 1.3): WAI-001 picker and Start new (Version 1.1
// item 41, Version 1.2 item 1, Version 1.3 item 10), WAI-002 Who's playing?, WAI-003 Words and time (Version 1.1 items 22,
// 45; Version 1.2 item 4; Version 1.3 item 4), WAI-004 starting, WAI-005 Read this aloud (Version 1.2 item 12), WAI-006 How
// to play (Version 1.1 items 42, 43; Version 1.2 item 13; Version 1.3 item 7).
// Written before the build: see the note in what-am-i.ts (expected to fail until the screens and hooks exist).
import { expect, test } from './fixtures';
import { hostAGame, joinAGame } from './helpers';
import {
  NAMES, SIZES, TZ, UPRIGHT, addNames, box, button, card, chooseOnS2, dialog, guards, heading, mainButton, moves, openApp,
  packLabel, playerField, radio, savedNights, startNight, switchNamed, tap, text, toPicker, toast,
} from './what-am-i';
import type { Page } from '@playwright/test';

test.use({ timezoneId: TZ, viewport: UPRIGHT });

async function toS1(page: Page) {
  await toPicker(page);
  await tap(page, card(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
}
async function toS2(page: Page, names = NAMES) {
  await toS1(page);
  await addNames(page, names);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Words and time')).toBeVisible();
}

test.describe('WAI-001: picking What Am I?', () => {
  test('Home\'s "Host a game" names What Am I? last, after " or "; the picker shows its card after Secret Words\', same size as the others', async ({ page }) => {
    await openApp(page);
    await expect(hostAGame(page)).toContainText(/Secret Words or What Am I\?/);
    await toPicker(page);
    await expect(card(page)).toContainText('Phone on your forehead, the room gives clues · One phone, passed round · 2–20 players');
    const cards = page.getByRole('button', { name: /^(Tambola|Impostor|Secret Words|What Am I\?)/ });
    const names = await cards.evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()));
    const sw = names.findIndex((n) => n.startsWith('Secret Words'));
    expect(names[sw + 1]).toMatch(/^What Am I\?/);
    const boxes = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
    for (const b of boxes) {
      expect(Math.abs(b.w - boxes[0]!.w)).toBeLessThanOrEqual(1);
      expect(Math.abs(b.h - boxes[0]!.h)).toBeLessThanOrEqual(1);
    }
  });

  test('Version 1.3 item 10: the picker has a quiet "← Home" that goes back to Home', async ({ page }) => {
    await openApp(page);
    await toPicker(page);
    await tap(page, button(page, '← Home'));
    await expect(hostAGame(page)).toBeVisible();
  });

  test('the card opens "Who\'s playing?"; nothing is saved yet', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    expect(await savedNights(page)).toEqual([]);
  });

  test('Version 1.1 item 41: with an unfinished game night, the card opens "Start a new game night?"; Carry on that one resumes it', async ({ page }) => {
    await startNight(page, { seed: 'start-new' });
    await tap(page, button(page, '← Home (game saved)'));
    await toPicker(page);
    await tap(page, card(page));
    const d = dialog(page, 'Start a new game night?');
    await expect(d).toBeVisible();
    await expect(d.getByText('The game night from 8:05 pm (Riya, Arjun +4) will end.', { exact: true })).toBeVisible();
    const buttons = d.getByRole('button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText('Carry on that one');
    await expect(buttons.nth(1)).toHaveText('Start new (ends that one)');
    await expect(d.getByTestId('main-button')).toHaveCount(0);
    await tap(page, d.getByRole('button', { name: 'Carry on that one', exact: true }));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
  });

  test('"Start new (ends that one)" records endEvening for the unfinished night and opens "Who\'s playing?"', async ({ page }) => {
    await startNight(page, { seed: 'start-new-2' });
    await tap(page, button(page, '← Home (game saved)'));
    await toPicker(page);
    await tap(page, card(page));
    await tap(page, dialog(page, 'Start a new game night?').getByRole('button', { name: 'Start new (ends that one)', exact: true }));
    await expect(heading(page, "Who's playing?")).toBeVisible();
    const nights = await savedNights(page);
    expect(nights).toHaveLength(1);
    expect(nights[0].records.at(-1).move.type).toBe('endEvening');
  });

  test('Version 1.2 item 1: "Join a game" says "What Am I? is played on the host\'s phone. Ask the host to add your name."', async ({ page }) => {
    await openApp(page);
    await tap(page, joinAGame(page));
    await expect(page.getByTestId('join-line-what-am-i')).toHaveText("What Am I? is played on the host's phone. Ask the host to add your name.");
  });
});

test.describe('WAI-002: Who\'s playing?', () => {
  test('h1 and small line; under 2 names "Next" is disabled and "What Am I? needs at least 2 players." shows', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    await expect(text(page, 'Players take turns in this order. Drag a name to move it.')).toBeVisible();
    await expect(mainButton(page)).toHaveText('Next');
    await expect(mainButton(page)).toBeDisabled();
    await expect(page.getByRole('alert').filter({ hasText: 'What Am I? needs at least 2 players.' })).toBeVisible();
    await addNames(page, ['Riya']);
    await expect(mainButton(page)).toBeDisabled();
    await addNames(page, ['Arjun']);
    await expect(mainButton(page)).toBeEnabled();
    await expect(text(page, 'What Am I? needs at least 2 players.')).toHaveCount(0);
  });

  test('every Enter adds its name and keeps the field focused; a name twice gets Impostor\'s message', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    for (const n of ['Riya', 'Arjun', 'Meena']) { await playerField(page).fill(n); await playerField(page).press('Enter'); }
    await expect(playerField(page)).toBeFocused();
    for (const n of ['Riya', 'Arjun', 'Meena']) await expect(button(page, `Move ${n}`)).toBeVisible();
    await playerField(page).fill('Riya');
    await playerField(page).press('Enter');
    await expect(page.getByRole('alert').filter({ hasText: 'Riya is already playing. Add an initial, like Riya S.' })).toBeVisible();
  });

  test('a 21st name shows "Up to 20 players." and adds nothing', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    const twenty = Array.from({ length: 20 }, (_, i) => `Player ${i + 1}`);
    await addNames(page, twenty);
    await playerField(page).fill('Om');
    await playerField(page).press('Enter');
    await expect(text(page, 'Up to 20 players.')).toBeVisible();
    await expect(button(page, 'Move Om')).toHaveCount(0);
  });

  test('✕ removes a name with the toast "Kabir removed · Undo"; Undo puts him back in his place', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    await addNames(page, NAMES);
    await button(page, 'Remove Kabir').click();
    await expect(toast(page)).toContainText('Kabir removed');
    await expect(button(page, 'Move Kabir')).toHaveCount(0);
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    const order = await page.getByRole('button', { name: /^Move / }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent));
    expect(order).toEqual(NAMES.map((n) => `Move ${n}`));
  });

  test('"← Back" goes to the picker; "Next" to Words and time', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    await tap(page, button(page, '← Back'));
    await expect(heading(page, 'What shall we play?')).toBeVisible();
    await tap(page, card(page));
    await addNames(page, ['Riya', 'Arjun']);
    await tap(page, mainButton(page));
    await expect(heading(page, 'Words and time')).toBeVisible();
  });
});

test.describe('WAI-003: Words and time', () => {
  test('Version 1.3 item 4: the order is "Time for each turn", "How to hold the phone", "Which words?", then the two switches', async ({ page }) => {
    await openApp(page);
    await toS2(page);
    const h2s = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(h2s.map((h) => h.trim())).toEqual(['Time for each turn', 'How to hold the phone', 'Which words?']);
    const y = async (name: string) => (await box(switchNamed(page, name))).y;
    const words = (await box(heading(page, 'Which words?'))).y;
    expect(await y('Include non-veg food (chicken, fish, egg)')).toBeGreaterThan(words);
    expect(await y('Sounds')).toBeGreaterThan(await y('Include non-veg food (chicken, fish, egg)'));
  });

  test('nine word options in order with their counts (non-veg off); Mix of all is chosen, with ✓ and aria-checked, and "Words from every pack."', async ({ page }) => {
    await openApp(page);
    await toS2(page);
    const group = page.getByRole('radiogroup', { name: 'Which words?' });
    const labels = await group.getByRole('radio').evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').replace('✓', '').replace(/\s+/g, ' ').trim()));
    expect(labels.map((l) => l.replace(' Words from every pack.', ''))).toEqual([
      'Mix of all · 714 words', 'Animals · 92 words', 'Food · 88 words', 'Around the house · 100 words', 'Jobs · 94 words',
      'Sports and cricket · 87 words', 'Festivals and places · 91 words', 'Act it out · 100 words', 'Famous Indians · 64 words',
    ]);
    const mix = radio(page, /^Mix of all · 714 words/);
    await expect(mix).toHaveAttribute('aria-checked', 'true');
    await expect(mix).toContainText('✓');
    await expect(text(page, 'Words from every pack.')).toBeVisible();
    await radio(page, /^Animals · 92 words/).click();
    await expect(radio(page, /^Animals · 92 words/)).toHaveAttribute('aria-checked', 'true');
    await expect(mix).toHaveAttribute('aria-checked', 'false');
    await expect(mix).not.toContainText('✓');
  });

  test('non-veg on: Food 98 and Mix of all 724; the switch is off at first', async ({ page }) => {
    await openApp(page);
    await toS2(page);
    const nv = switchNamed(page, 'Include non-veg food (chicken, fish, egg)');
    await expect(nv).toHaveAttribute('aria-checked', 'false');
    await nv.click();
    await expect(radio(page, /^Food · 98 words/)).toBeVisible();
    await expect(radio(page, /^Mix of all · 724 words/)).toBeVisible();
  });

  test('time 30 s · 60 s · 90 s (60 chosen) with "30 s for small kids, 90 s for grandparents"; hold lines; Sounds lines on and off', async ({ page }) => {
    await openApp(page);
    await toS2(page);
    for (const t of ['30 s', '60 s', '90 s']) await expect(radio(page, t)).toHaveAttribute('aria-checked', t === '60 s' ? 'true' : 'false');
    await expect(text(page, '30 s for small kids, 90 s for grandparents')).toBeVisible();
    await expect(radio(page, /^In the guesser's hand/)).toHaveAttribute('aria-checked', 'true');
    await expect(text(page, 'Forehead or chest; the guesser moves it to answer.')).toBeVisible();
    await expect(text(page, 'The phone stands behind the guesser; one clue giver taps to answer. Good for grandparents and small children.')).toBeVisible();
    await expect(text(page, 'You can change this for one player on their turn.')).toBeVisible();
    const sounds = switchNamed(page, 'Sounds');
    await expect(sounds).toHaveAttribute('aria-checked', 'true');
    await expect(text(page, 'So the guesser knows a word counted.')).toBeVisible();
    await sounds.click();
    await expect(text(page, "The guesser won't know a word counted.")).toBeVisible();
    await expect(text(page, 'So the guesser knows a word counted.')).toHaveCount(0);
  });

  test('"Ready as it is, or change anything above." sits directly above "Start with these words"; the main button stays fixed while the page scrolls', async ({ page }) => {
    await openApp(page, { viewport: { width: 320, height: 568 } });
    await toS2(page);
    await expect(mainButton(page)).toHaveText('Start with these words');
    const line = await box(text(page, 'Ready as it is, or change anything above.'));
    const main = await box(mainButton(page));
    expect(main.y - (line.y + line.height)).toBeGreaterThanOrEqual(0);
    expect(main.y - (line.y + line.height)).toBeLessThanOrEqual(24);
    await heading(page, 'Time for each turn').scrollIntoViewIfNeeded();
    await page.clock.runFor(300);
    const after = await box(mainButton(page));
    expect(Math.abs(after.y - main.y)).toBeLessThanOrEqual(1); // fixed while the page scrolls (Version 1.1 item 22)
  });

  test('Version 1.1 item 45: the last-used choices come back on this phone (saved at start); "← Back" keeps the names', async ({ page }) => {
    await startNight(page, { seed: 'last-used', pack: 'Jobs', turnTime: 90, hold: 'free', nonveg: true, sounds: false, players: ['Riya', 'Arjun'] });
    await tap(page, button(page, '← Home (game saved)'));
    await toPicker(page);
    await tap(page, card(page));
    await tap(page, dialog(page, 'Start a new game night?').getByRole('button', { name: 'Start new (ends that one)', exact: true }));
    await expect(heading(page, "Who's playing?")).toBeVisible();
    if (!(await button(page, 'Move Riya').isVisible())) await addNames(page, ['Riya', 'Arjun']); // the names are not what is checked here
    await tap(page, mainButton(page));
    await expect(radio(page, /^Jobs · 94 words/)).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, '90 s')).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, /^Hands-free/)).toHaveAttribute('aria-checked', 'true');
    await expect(switchNamed(page, 'Include non-veg food (chicken, fish, egg)')).toHaveAttribute('aria-checked', 'true');
    await expect(switchNamed(page, 'Sounds')).toHaveAttribute('aria-checked', 'false');
    await tap(page, button(page, '← Back'));
    await expect(button(page, 'Move Riya')).toBeVisible();
  });
});

test.describe('WAI-004 / WAI-005: starting, and Read this aloud', () => {
  test('the night\'s first game: "Start with these words" opens Read this aloud and records nothing; "First turn" records start', async ({ page }) => {
    await startNight(page, { seed: 'first', stopAt: 'S3', pack: 'Animals', players: ['Riya', 'Arjun', 'Meena'] });
    expect(await savedNights(page)).toEqual([]);
    await tap(page, mainButton(page));
    await expect(heading(page, "Riya, you're guessing")).toBeVisible();
    const m = await moves(page);
    expect(m).toEqual([{ type: 'start', players: ['Riya', 'Arjun', 'Meena'], choices: { pack: 'Animals', time: 60, hold: 'hand', nonveg: false, sounds: true } }]);
  });

  test('the card in hand hold, 60 s, ending with the Do Not Disturb tip (Version 1.2 item 12)', async ({ page }) => {
    await startNight(page, { seed: 'card', stopAt: 'S3' });
    const card = page.getByText(/^One of us holds the phone/);
    await expect(card).toContainText('One of us holds the phone on their forehead or chest, screen to the room. Everyone else gives clues: talk, act, make the noise, but never say the word. Got it? Move the phone down. Stuck? Move it up to pass. Passing is free. Marked wrong? Fix it when time\'s up. You have 60 seconds. Play as many rounds as you like; tap End the game to see who got the most.');
    // "ends with the sentence": the last sentence read aloud, in the card or on its own line after it
    const all = (await page.getByRole('main').innerText()).replace(/\s+/g, ' ');
    const at = all.indexOf('see who got the most.');
    expect(all.slice(at, at + 80)).toMatch(/^see who got the most\. ?Tip: turn on Do Not Disturb so messages don't buzz\./);
    await expect(mainButton(page)).toHaveText('First turn');
  });

  test('hands-free and 30 s: the two sentences change and the time reads "30 seconds"', async ({ page }) => {
    await startNight(page, { seed: 'card-free', stopAt: 'S3', hold: 'free', turnTime: 30 });
    const p = page.getByText(/^One of us holds the phone/);
    await expect(p).toContainText('The phone stands behind the guesser. One clue giver taps the bottom for Got it, the top to pass.');
    await expect(p).not.toContainText('Move the phone down');
    await expect(p).toContainText('You have 30 seconds.');
  });

  test('90 s reads "90 seconds"; "← Back" returns to Words and time with every choice kept, nothing recorded', async ({ page }) => {
    await startNight(page, { seed: 'card-back', stopAt: 'S3', turnTime: 90, pack: 'Food' });
    await expect(page.getByText(/^One of us holds the phone/)).toContainText('You have 90 seconds.');
    await tap(page, button(page, '← Back'));
    await expect(heading(page, 'Words and time')).toBeVisible();
    await expect(radio(page, '90 s')).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, /^Food · 88 words/)).toHaveAttribute('aria-checked', 'true');
    expect(await savedNights(page)).toEqual([]);
  });

  for (const size of SIZES) {
    test(`Read this aloud fits without scrolling at ${size.width} × ${size.height} (Larger text off)`, async ({ page }) => {
      await startNight(page, { seed: 'fits', stopAt: 'S3', viewport: size });
      const s = await page.evaluate(() => ({ h: document.scrollingElement!.scrollHeight, i: window.innerHeight }));
      expect(s.h).toBeLessThanOrEqual(s.i);
    });
  }
});

test.describe('WAI-006: How to play', () => {
  const LINES = [
    'One player guesses. They hold the phone on their forehead or chest, screen facing the room.',
    'Everyone else gives clues: talk, act, make the noise. Never say the word.',
    'Got it? Phone down. Stuck? Phone up to pass. Passing is free.',
    'Hands-free: stand the phone behind the guesser; a clue giver taps the bottom for Got it, the top to pass.',
    "When time's up, fix any word marked wrong, then save the score.",
  ];
  const AFTER_5 = [
    "Said the word, or the guesser peeked? Move that word to Passed when time's up.",
    'One point for each word you got. Passing costs nothing.',
    'The room decides if a clue broke the rules.',
  ];
  const LAST = ['Pass the phone to the next player. Everyone once is a round.', 'Play as many rounds as you like. End the game to see who got the most.'];

  test('h1 "How to play"; the steps as a list: lines 1 to 5, Version 1.3\'s two lines, 5b, then 6 and 7; three drawings with alt texts', async ({ page }) => {
    await openApp(page);
    await toS1(page);
    await tap(page, button(page, 'How to play'));
    await expect(heading(page, 'How to play')).toBeVisible();
    const items = (await page.getByRole('listitem').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
    // final order (product owner, 25 October, item 38): 1–5, the two Version 1.3 lines, 5b, then 6 and 7
    expect(items).toEqual([...LINES, AFTER_5[1], AFTER_5[2], AFTER_5[0], ...LAST]);
    const alts = await page.getByTestId('hold-drawing').evaluateAll((els) => els.map((e) => e.getAttribute('alt') ?? e.getAttribute('aria-label')));
    expect(alts).toEqual([
      'Phone held on the forehead, screen facing the room', 'Phone held against the chest, screen facing the room',
      'Phone standing behind a seated player, facing the room',
    ]);
  });

  test('"Done" returns to the screen it came from, unchanged (from Words and time, with a changed choice)', async ({ page }) => {
    await openApp(page);
    await toS2(page, ['Riya', 'Arjun']);
    await chooseOnS2(page, { pack: 'Jobs', turnTime: 30 });
    await tap(page, button(page, 'How to play'));
    await tap(page, mainButton(page));
    await expect(heading(page, 'Words and time')).toBeVisible();
    await expect(radio(page, /^Jobs · 94 words/)).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, '30 s')).toHaveAttribute('aria-checked', 'true');
  });

  test('from Read this aloud and back', async ({ page }) => {
    await startNight(page, { seed: 'htp-s3', stopAt: 'S3' });
    await tap(page, button(page, 'How to play'));
    await expect(heading(page, 'How to play')).toBeVisible();
    await tap(page, mainButton(page));
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    await guards(page);
    expect(packLabel('mix')).toBe('Mix of all · 714 words');
  });
});
