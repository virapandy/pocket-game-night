// Rhyme language in a real game: TAM-153 (changed 2026-09-29: with Hindi, a number with no Hindi rhyme shows a
// family-friendly English rhyme with an Indian reference, never the number alone) and TAM-015.
// Which numbers have no Hindi rhyme comes from the reviewed catalog, docs/games/tambola/rhymes.csv.
import { expect, test } from './fixtures';
import { INDIAN_STYLES, numbersWithoutHindi, readCatalog } from '../rhyme-catalog';
import { call, currentRhyme, dismiss, openTambola, setUpPaperGame } from './helpers';

test('TAM-153: in a Hindi game, every call shows a rhyme; numbers with no Hindi rhyme show a family-friendly English one with an Indian reference', async ({ page }) => {
  test.setTimeout(180_000);
  const catalog = readCatalog();
  const withoutHindi = new Set(numbersWithoutHindi(catalog));
  expect(withoutHindi.size).toBeGreaterThan(0);
  const textsFor = (n: number, pick: (r: (typeof catalog)[number]) => boolean) =>
    new Set(catalog.filter((r) => r.n === n && pick(r)).map((r) => r.text));

  await openTambola(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Rhyme language').selectOption('hi');
  await dismiss(page);
  await setUpPaperGame(page);

  const problems: string[] = [];
  for (let i = 1; i <= 90; i++) {
    const n = await call(page);
    const rhyme = ((await currentRhyme(page).textContent()) ?? '').trim();
    if (!rhyme) { problems.push(`${n}: no rhyme, the number alone`); continue; }
    if (withoutHindi.has(n)) {
      const ok = textsFor(n, (r) => r.lang === 'en' && r.familyFriendly && INDIAN_STYLES.has(r.style));
      if (!ok.has(rhyme)) problems.push(`${n}: "${rhyme}" is not one of its family-friendly English rhymes with an Indian reference`);
    } else {
      const ok = textsFor(n, (r) => r.lang === 'hi' && r.familyFriendly);
      if (!ok.has(rhyme)) problems.push(`${n}: "${rhyme}" is not one of its Hindi rhymes`);
    }
  }
  expect(problems, 'checked against docs/games/tambola/rhymes.csv').toEqual([]);
});
