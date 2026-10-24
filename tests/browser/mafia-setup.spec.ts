// Mafia section 01, setup (C1/C2; scenarios version 1.1): MAF-001 to MAF-006. Written before the screens exist: every
// test is `aheadOfMafiaScreens`. Helpers: mafia.ts.
import { expect, test } from './fixtures';
import { hostAGame } from './helpers';
import {
  NINE, aheadOfMafiaScreens, boot, fromMenu, openFlow, box, button, byId, exactly, heading, mafiaCard, mainButton, playerField, tap, toNames,
  toPicker, toRoles, typeNames, TZ, SIZES, noPageScroll,
} from './mafia';

test.use({ timezoneId: TZ });

test('MAF-001: Home\'s Host a game line ends "What Am I? or Mafia on this phone"; the Mafia card is last, after What Am I?, same size as the others', async ({ page }) => {
  aheadOfMafiaScreens('MAF-001 picker');
  await boot(page);
  await expect(hostAGame(page)).toHaveAccessibleName(/What Am I\? or Mafia on this phone$/);
  await toPicker(page);
  const card = mafiaCard(page);
  await expect(card).toHaveAccessibleName(/^Mafia/);
  await expect(card).toContainText('Find the Mafia before they find you · 5–16 players · 15–30 min a game');
  const cards = page.getByRole('button', { name: /^(Tambola|Impostor|Secret Words|What Am I\?|Mafia)/ }).and(page.locator(':not([data-testid="resume-card"])'));
  const names = await cards.evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()));
  expect(names[names.length - 1]).toMatch(/^Mafia/);
  expect(names[names.length - 2]).toMatch(/^What Am I\?/);
  const sizes = await cards.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  for (const s of sizes) { expect(Math.abs(s[0]! - sizes[0]![0]!)).toBeLessThanOrEqual(1); expect(Math.abs(s[1]! - sizes[0]![1]!)).toBeLessThanOrEqual(1); }
  await tap(page, card);
  await expect(heading(page, "Who's playing?")).toBeVisible();
});

test('MAF-001: with an unfinished Mafia game night, the Mafia card opens Start new; "Carry on that one" resumes it', async ({ page }) => {
  aheadOfMafiaScreens('MAF-001 Start new');
  // An unfinished game night saved on this phone (opened once through MAF-H6, then Home).
  await openFlow(page, 'morning1');
  await fromMenu(page, 'Home (game is saved)');
  await toPicker(page);
  await tap(page, mafiaCard(page));
  await expect(button(page, 'Start new (ends that one)')).toBeVisible();
  await tap(page, button(page, 'Carry on that one'));
  await expect(page.getByText(exactly('Welcome back.'))).toBeVisible();
});

test('MAF-002: Who\'s playing? counts players, needs 5, takes at most 16, refuses a name twice, and ✕ removes with Undo', async ({ page }) => {
  aheadOfMafiaScreens('MAF-002 names');
  await toNames(page);
  await expect(page.getByText(/First time/)).toHaveCount(0);   // MF14: no "First time" tick
  await typeNames(page, NINE.slice(0, 4));
  await expect(page.getByText(exactly('4 players'))).toBeVisible();
  await expect(mainButton(page)).toBeDisabled();
  await expect(page.getByRole('alert').filter({ hasText: 'Mafia needs at least 5 players.' })).toBeVisible();
  await expect(playerField(page)).toBeFocused();
  await typeNames(page, ['Riya']);
  await expect(page.getByText('Riya is already playing. Add an initial, like Riya S.')).toBeVisible();
  await typeNames(page, NINE.slice(4, 5));
  await expect(page.getByText(exactly('5 players'))).toBeVisible();
  await expect(mainButton(page)).toBeEnabled();
  await expect(page.getByText('Mafia needs at least 5 players.')).toHaveCount(0);
  await tap(page, button(page, 'Remove Kabir'));
  await expect(page.getByText(exactly('Kabir removed · Undo'))).toBeVisible();
  await expect(page.getByText(exactly('4 players'))).toBeVisible();
  await tap(page, button(page, 'Undo'));
  await expect(page.getByText(exactly('5 players'))).toBeVisible();
  const more = ['Dev', 'Om', 'Sunita', 'Neha', 'Imran', 'Priya', 'Farhan', 'Lata', 'Ravi', 'Asha', 'Gopal'];
  await typeNames(page, more);
  await expect(page.getByText(exactly('16 players'))).toBeVisible();
  await playerField(page).fill('Uma');
  await playerField(page).press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Up to 16 players.' })).toBeVisible();
  await expect(page.getByText(exactly('16 players'))).toBeVisible();
  await expect(playerField(page)).toHaveValue('Uma');   // item 28: the field keeps the text
});

test('MAF-002: one player reads "1 player"; "← Back" returns to the picker; "How to play" opens How to play', async ({ page }) => {
  aheadOfMafiaScreens('MAF-002 plurals and links');
  await toNames(page);
  await typeNames(page, ['Riya']);
  await expect(page.getByText(exactly('1 player'))).toBeVisible();
  await tap(page, button(page, 'How to play'));
  await expect(heading(page, 'How to play')).toBeVisible();
  await tap(page, mainButton(page));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await tap(page, button(page, '← Back'));
  await expect(heading(page, 'What shall we play?')).toBeVisible();
});

test('MAF-003: Roles for 9 players: Mafia 2 (suggested), Doctor 1, Police 1, Villagers 5; − and + limits 1 to 3; rules box', async ({ page }) => {
  aheadOfMafiaScreens('MAF-003 roles 9');
  await toRoles(page, NINE);
  await expect(page.getByText(exactly('Mafia: 2'))).toBeVisible();
  await expect(page.getByText(exactly('We suggest 2 for 9 players.'))).toBeVisible();
  for (const l of ['Doctor: 1', 'Police: 1', 'Villagers: 5']) await expect(page.getByText(exactly(l))).toBeVisible();
  const fewer = page.getByRole('button', { name: 'Fewer Mafia', exact: true });
  const more = page.getByRole('button', { name: 'More Mafia', exact: true });
  for (const b of [fewer, more]) { const r = await box(b); expect(Math.round(r.width)).toBeGreaterThanOrEqual(48); expect(Math.round(r.height)).toBeGreaterThanOrEqual(48); }
  await tap(page, more);
  await expect(page.getByText(exactly('Mafia: 3'))).toBeVisible();
  await expect(page.getByText(exactly('Villagers: 4'))).toBeVisible();
  await expect(more).toBeDisabled();
  await tap(page, fewer);
  await tap(page, fewer);
  await expect(page.getByText(exactly('Mafia: 1'))).toBeVisible();
  await expect(fewer).toBeDisabled();
  for (const l of ['Night comes first.', 'The Doctor can protect themselves once a game, never the same person two nights running.',
    'The Police learns only Mafia or Not Mafia.', 'A tie: point again once, then nobody is out.', 'A player who goes out shows their role.']) {
    await expect(page.getByText(exactly(l)).first()).toBeVisible();
  }
  await expect(mainButton(page)).toHaveText(exactly('Give everyone a role'));
});

test('MAF-003: with 5 players there is no Doctor or Police line, and − and + are both disabled (item 27)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-003 roles 5');
  await toRoles(page, NINE.slice(0, 5));
  await expect(page.getByText(exactly('With 5 players: 1 Mafia and 4 Villagers. Doctor and Police join at 6.'))).toBeVisible();
  await expect(page.getByText(exactly('Doctor: 1'))).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Fewer Mafia', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'More Mafia', exact: true })).toBeDisabled();
  await expect(page.getByText(exactly('We suggest 1 for 5 players.'))).toBeVisible();
});

test('MAF-003 / item 27: Back keeps the names and the count; a changed number of players resets the count to the suggestion', async ({ page }) => {
  aheadOfMafiaScreens('MAF-003 keep or reset');
  await toRoles(page, NINE);
  await tap(page, page.getByRole('button', { name: 'More Mafia', exact: true }));
  await tap(page, button(page, '← Back'));
  await expect(heading(page, "Who's playing?")).toBeVisible();
  await tap(page, mainButton(page));
  await expect(page.getByText(exactly('Mafia: 3'))).toBeVisible();
  await tap(page, button(page, '← Back'));
  await tap(page, button(page, 'Remove Neha'));
  await tap(page, mainButton(page));
  await expect(heading(page, 'Roles for 8 players')).toBeVisible();
  await expect(page.getByText(exactly('Mafia: 2'))).toBeVisible();
});

test('MAF-005: Read this aloud, M = 2 and M = 1; Back undoes the deal; fits without scrolling at every size (Larger text off)', async ({ page }) => {
  aheadOfMafiaScreens('MAF-005 read aloud');
  const card2 = '2 of us are secretly the Mafia. Everyone else is the Village. At night we pass the phone round and everyone does the same thing, so nobody can tell who is who. Each morning the phone tells us what happened, then we talk and vote someone out. The Village wins by finding every Mafia. The Mafia win when they are as many as everyone else.';
  for (const viewport of SIZES) {
    await toRoles(page, NINE, { viewport });
    await tap(page, mainButton(page));
    await expect(heading(page, 'Read this aloud')).toBeVisible();
    await expect(page.getByText(card2)).toBeVisible();
    await noPageScroll(page, `S3 at ${viewport.width} × ${viewport.height}`);
  }
  await tap(page, button(page, '← Back'));
  await expect(heading(page, 'Roles for 9 players')).toBeVisible();
  await tap(page, page.getByRole('button', { name: 'Fewer Mafia', exact: true }));
  await tap(page, mainButton(page));
  await expect(page.getByText(/^1 of us is secretly the Mafia\. Everyone else is the Village\./)).toBeVisible();
  await tap(page, mainButton(page));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
});

test('MAF-006: How to play has the seven steps, the rules box and the peek line, names nobody, and Done returns unchanged', async ({ page }) => {
  aheadOfMafiaScreens('MAF-006 how to play');
  await toRoles(page, NINE);
  await tap(page, button(page, 'How to play'));
  await expect(heading(page, 'How to play')).toBeVisible();
  await expect(page.getByText('Saw someone\'s screen? Keep it to yourself and carry on. Before the first night, Deal again instead.')).toBeVisible();
  await expect(page.getByText('Night comes first.').first()).toBeVisible();
  for (const n of NINE) await expect(page.getByText(new RegExp(`\\b${n}\\b`))).toHaveCount(0);
  await tap(page, mainButton(page));
  await expect(heading(page, 'Roles for 9 players')).toBeVisible();
});
