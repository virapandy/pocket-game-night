// Every failing simulated evening (layer 3, tests/sims/) is saved in tests/replays/screen/ and replayed here, step by
// step, with the same checks after every step, on both phones in the complete run. A replay passes once the app is
// fixed. Never delete a replay (tests/CLAUDE.md).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from './fixtures';
import { playEvening } from '../sims/impostor-runner';
import { TZ } from './impostor';

test.use({ timezoneId: TZ });

const dir = fileURLToPath(new URL('../replays/screen/', import.meta.url));
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];

for (const f of files) {
  const saved = JSON.parse(readFileSync(`${dir}${f}`, 'utf8'));
  test(`simulated evening ${saved.seed} replays without a finding (${saved.findings.map((x: { kind: string }) => x.kind).join(', ')})`, async ({ page }) => {
    test.setTimeout(6 * 60_000);
    const res = await playEvening(page, saved.config, { replay: saved.steps });
    expect(res.findings).toEqual([]);
  });
}
