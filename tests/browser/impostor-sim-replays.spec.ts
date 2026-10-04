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
  test(`simulated evening ${saved.seed} replays without a finding (${saved.findings.map((x: { kind: string }) => x.kind).join(', ')})`, async ({ page }, testInfo) => {
    test.setTimeout(6 * 60_000);
    // A replay of a known app bug, still open, carries `expectedToFail` {scenario, platform, project, reason}: it is
    // expected to fail where the bug was seen until the app is fixed, then the field is removed (reports/latest.md).
    const known = saved.expectedToFail as { scenario: string; platform?: string; project?: string; reason: string } | undefined;
    if (known) test.fail((!known.platform || process.platform === known.platform) && (!known.project || testInfo.project.name === known.project), `${known.scenario}: ${known.reason}`);
    const res = await playEvening(page, saved.config, { replay: saved.steps });
    expect(res.findings).toEqual([]);
  });
}
