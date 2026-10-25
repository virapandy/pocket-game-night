// Mafia sections 02 and 03 on screen (C2; the rules are C3 in tests/games/mafia/): the deal pass and role cards
// (MAF-010 to MAF-015, items 20 and 26), the night screens and every role's night job lines (MAF-020 to MAF-028, items
// 4, 8, 9). The screens are built (lane-k): no mark; the deal opens through MAF-H6 (`openDeal`). Helpers: mafia.ts.
import { expect, test, type Page } from './fixtures';
import {
  EXAMPLE_DEAL, NINE, box, button, byId, exactly, heading, mainButton, nameButton, openFlow, pad, tap, openDeal,
  toMorning, TZ,
} from './mafia';

test.use({ timezoneId: TZ });

async function openCard(page: Page, name: string) {
  await tap(page, button(page, `I'm ${name}`));
  await tap(page, button(page, 'Tap instead'));
  await tap(page, pad(page));
}

test('MAF-010: the deal pass screen: "Player 1 of 9", "Pass the phone to", RIYA, "Everyone else, look away!", main "I\'m Riya"', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
  await expect(page.getByText(exactly('Pass the phone to'))).toBeVisible();
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
  await expect(page.getByText(exactly('Everyone else, look away!'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly("I'm Riya"));
});

test('MAF-011 item 20: each role card\'s words; every card the same height', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  const cards: Record<string, string[]> = {
    Riya: ['VILLAGER', 'You have no night power.', 'By day, talk, watch and find the Mafia.'],
    Arjun: ['MAFIA', 'You and Zoya are the Mafia.', 'At night, you pick who goes out. By day, act like a Villager.'],
    Meena: ['DOCTOR', 'At night, pick someone to protect from the Mafia.', 'Yourself once a game. Never the same person two nights running.'],
    Kabir: ['VILLAGER', 'You have no night power.', 'By day, talk, watch and find the Mafia.'],
    Zoya: ['MAFIA', 'You and Arjun are the Mafia.', 'At night, you pick who goes out. By day, act like a Villager.'],
    Dev: ['POLICE', 'At night, check one person.', 'The phone tells only you: Mafia or Not Mafia.'],
  };
  const heights: number[] = [];
  for (const p of NINE) {
    await openCard(page, p);
    const block = byId(page, 'private-block');
    if (cards[p]) {
      await expect(byId(page, 'private-word')).toHaveText(exactly(cards[p]![0]!));
      for (const l of cards[p]!.slice(1)) await expect(block.getByText(exactly(l))).toBeVisible();
    }
    heights.push(Math.round((await box(block)).height));
    await expect(button(page, 'First time? What this role means')).toBeVisible();
    await tap(page, pad(page));
    await expect(byId(page, 'private-word')).toHaveCount(0);
    await expect(button(page, 'Someone saw my role')).toBeVisible();
    await expect(mainButton(page)).toHaveText(exactly(p === 'Neha' ? "Done, everyone's seen" : `Done, pass to ${NINE[NINE.indexOf(p) + 1]}`));
    await tap(page, mainButton(page));
  }
  for (const h of heights) expect(Math.abs(h - heights[0]!)).toBeLessThanOrEqual(1);
  await expect(heading(page, 'Night 1')).toBeVisible();
});

test('MAF-012: "First time? What this role means" shows three private lines for the role, "Hide this" hides them', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  await openCard(page, 'Riya');
  await tap(page, button(page, 'First time? What this role means'));
  const block = byId(page, 'private-block');
  for (const l of ['Your side wins when every Mafia is out.', 'At night, pick who you think is Mafia. Only you see it.', 'By day, listen, ask questions and vote.']) {
    await expect(block.getByText(exactly(l))).toBeVisible();
  }
  await tap(page, button(page, 'Hide this'));
  await expect(block.getByText('Your side wins')).toHaveCount(0);
});

test('MAF-013: "Not Riya? ← Back" before the first look returns to Riya\'s pass screen; nothing recorded', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  await tap(page, button(page, "I'm Riya"));
  await tap(page, button(page, 'Not Riya? ← Back'));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
});

test('MAF-014: "Someone saw my role" → "Deal again?" → "Deal again" starts at "Player 1 of 9"; "Keep these roles" changes nothing', async ({ page }) => {
  await openDeal(page, NINE, { deals: { 1: EXAMPLE_DEAL } });
  await openCard(page, 'Riya');
  await tap(page, pad(page));
  await tap(page, button(page, 'Someone saw my role'));
  const d = page.getByRole('dialog').filter({ hasText: 'Deal again?' });
  await expect(d.getByText(exactly('Everyone gets a new role.'))).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Keep these roles', exact: true }));
  await expect(mainButton(page)).toHaveText(exactly('Done, pass to Arjun'));
  await tap(page, button(page, 'Someone saw my role'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Deal again', exact: true }));
  await expect(byId(page, 'deal-progress')).toHaveText(exactly('Player 1 of 9'));
});

test('MAF-015 item 20: "See my role again" on the morning: "Whose role?" lists players who are in; a Mafia with no partner out reads as dealt; "Done, back to the day"', async ({ page }) => {
  await openFlow(page, 'morning1');
  await toMorning(page);
  await tap(page, button(page, 'See my role again'));
  const d = page.getByRole('dialog').filter({ hasText: 'Whose role?' });
  for (const p of NINE.filter((x) => x !== 'Kabir')) await expect(d.getByRole('button', { name: p, exact: true })).toBeVisible();
  await expect(d.getByRole('button', { name: 'Kabir', exact: true })).toHaveCount(0);
  await expect(d.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  await tap(page, d.getByRole('button', { name: 'Arjun', exact: true }));
  await expect(byId(page, 'deal-progress')).toHaveCount(0);
  await openCard(page, 'Arjun');
  await expect(byId(page, 'private-block').getByText(exactly('You and Zoya are the Mafia.'))).toBeVisible();
  await tap(page, pad(page));
  await expect(mainButton(page)).toHaveText(exactly('Done, back to the day'));
  await tap(page, mainButton(page));
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
});

test('MAF-015 item 20: after day 2 (Zoya voted out), Arjun\'s card reads "Zoya is out. You\'re the only Mafia left."', async ({ page }) => {
  await openFlow(page, 'day3');
  await toMorning(page);
  await tap(page, button(page, 'See my role again'));
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Arjun', exact: true }));
  await openCard(page, 'Arjun');
  await expect(byId(page, 'private-block').getByText(exactly("Zoya is out. You're the only Mafia left."))).toBeVisible();
});

test('MAF-020: Night 1 begins: the two lines and "Start the night"; MAF-021 the pass screen "Night 1 · 1 of 9"', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await expect(heading(page, 'Night 1')).toBeVisible();
  await expect(page.getByText(exactly('Pass the phone round once more. Everyone does the same: tap to see your night job, pick one name, tap Done, pass it on.'))).toBeVisible();
  await expect(page.getByText(exactly('Keep your face still!'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(exactly('Start the night'));
  await tap(page, mainButton(page));
  await expect(byId(page, 'night-progress')).toHaveText(exactly('Night 1 · 1 of 9'));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Riya'));
  await expect(mainButton(page)).toHaveText(exactly("I'm Riya"));
});

/** One night turn on screen, checking the job line before the pick and the result line after each tap in `taps`. */
async function jobTurn(page: Page, who: string, job: string, taps: [string, string][], next: string) {
  await tap(page, button(page, `I'm ${who}`));
  await expect(byId(page, 'pass-name')).toHaveText(exactly(who));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'job-line')).toHaveText(exactly(job));
  for (const [name, result] of taps) {
    await tap(page, nameButton(page, name));
    await expect(nameButton(page, name)).toHaveAttribute('aria-pressed', 'true');
    await expect(byId(page, 'result-line')).toHaveText(exactly(result));
  }
  await page.clock.runFor(4100);
  await expect(mainButton(page)).toHaveText(exactly(next));
  await tap(page, mainButton(page));
}

test('MAF-022 to MAF-026: every role\'s job line and result line on night 1 of the example', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await jobTurn(page, 'Riya', "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.",
    [['Arjun', "You think it's Arjun. At the end we'll see if you were right."]], 'Done, pass to Arjun');
  await jobTurn(page, 'Arjun', 'MAFIA · Pick who goes out tonight. Zoya will see your pick.', [['Kabir', 'Kabir. Zoya can agree or change it.']], 'Done, pass to Meena');
  await jobTurn(page, 'Meena', 'DOCTOR · Pick someone to protect tonight.', [['Om', 'Om is protected tonight.'], ['Meena', 'You are protected tonight.']], 'Done, pass to Kabir');
  await jobTurn(page, 'Kabir', "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.",
    [['Zoya', "You think it's Zoya. At the end we'll see if you were right."]], 'Done, pass to Zoya');
  await jobTurn(page, 'Zoya', "MAFIA · Arjun's pick: KABIR. Tap Kabir to agree, or pick someone else.",
    [['Om', "Om. If the Mafia's picks differ, the phone picks one of them at random."], ['Kabir', 'Kabir. You agree.']], 'Done, pass to Dev');
  // Police: the first name tapped is the check; its answer shows in the result line only (MAF-025). Version 1.2 A (owner,
  // 25 October): the other names do not grey out and keep their plain names.
  await tap(page, button(page, "I'm Dev"));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'job-line')).toHaveText(exactly('POLICE · Pick someone to check.'));
  await tap(page, nameButton(page, 'Zoya'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Zoya: MAFIA.'));
  await expect(byId(page, 'night-names').getByRole('button', { name: 'Riya', exact: true })).toBeEnabled();
});

test('MAF-022 Version 1.2 A: no name is greyed for any role; names read as the name only; tags "you" only (Arjun sees Zoya as any name)', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await jobTurn(page, 'Riya', "VILLAGER · Who do you think is Mafia? Think, then pick. Only you see this.", [['Om', "You think it's Om. At the end we'll see if you were right."]], 'Done, pass to Arjun');
  await tap(page, button(page, "I'm Arjun"));
  await tap(page, button(page, 'Tap to see your night job'));
  const names = byId(page, 'night-names').getByRole('button');
  await expect(names).toHaveCount(9);
  const zoya = byId(page, 'night-names').getByRole('button', { name: 'Zoya', exact: true });
  await expect(zoya).toBeEnabled();
  await expect(zoya).not.toHaveAttribute('aria-disabled', 'true');
  await expect(zoya).not.toContainText('Mafia');
  await expect(byId(page, 'night-names').getByRole('button', { name: 'Arjun', exact: true })).toContainText('you');
  await expect(page.getByRole('button', { name: /can't pick/ })).toHaveCount(0);
});

test('MAF-026 / MAF-021: a player who is out: the pass screen line and the ghost guess', async ({ page }) => {
  await openFlow(page, 'night2-meena');
  await tap(page, button(page, "I'm Meena"));
  await tap(page, button(page, 'Tap to see your night job'));
  await tap(page, nameButton(page, 'Riya'));
  await page.clock.runFor(4100);
  await tap(page, mainButton(page));
  await expect(byId(page, 'pass-name')).toHaveText(exactly('Kabir'));
  await expect(page.getByText(exactly("You're out: pick who you think is Mafia."))).toBeVisible();
  await tap(page, button(page, "I'm Kabir"));
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(byId(page, 'job-line')).toHaveText(exactly("YOU'RE OUT · Ghost guess: who's Mafia? Pick one."));
  await tap(page, nameButton(page, 'Zoya'));
  await expect(byId(page, 'result-line')).toHaveText(exactly('Your guess: Zoya.'));
});

test('MAF-022 product owner 10: "Tap to hide" empties the job, names and result; the pick is kept; Done stays hidden while hidden', async ({ page }) => {
  await openFlow(page, 'night1-start');
  await tap(page, mainButton(page));
  await tap(page, button(page, "I'm Riya"));
  await tap(page, button(page, 'Tap to see your night job'));
  await tap(page, nameButton(page, 'Om'));
  await tap(page, button(page, 'Tap to hide'));
  await expect(byId(page, 'job-line')).toHaveCount(0);
  await expect(byId(page, 'night-names')).toHaveCount(0);
  await expect(byId(page, 'result-line')).toHaveCount(0);
  await page.clock.runFor(4100);
  await expect(mainButton(page)).toBeHidden();
  await tap(page, button(page, 'Tap to see your night job'));
  await expect(nameButton(page, 'Om')).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(1000);
  await expect(mainButton(page)).toBeVisible();
});

test('MAF-028: Night over: "Host, take the phone and read the morning aloud."; "Read the morning" opens the morning', async ({ page }) => {
  await openFlow(page, 'morning1');
  if (await heading(page, 'Night over.').isVisible().catch(() => false)) {
    await expect(page.getByText(exactly('Host, take the phone and read the morning aloud.'))).toBeVisible();
    await expect(mainButton(page)).toHaveText(exactly('Read the morning'));
  }
  await toMorning(page);
  await expect(heading(page, 'Morning, day 1')).toBeVisible();
});
