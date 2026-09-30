// PLT-115: the Jev key never ends up in the public repo, a test report, a saved replay or a simulation summary.
// The check reads the real key only to compare with (from JEV_API_KEY or the gitignored `.env.local`), and never
// prints it: a failure names the file, never what was found. With no key, it still looks for anything shaped like one.
// Automation logs: GitHub masks a secret in logs; the weekly workflow request in reports/latest.md keeps the key
// in a secret and never echoes it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { KEY_SHAPE, loadJevKey, makeBudget, makeJev, redact, type Transport } from './jev';
import { runMany, summaryText } from './mass';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const FAKE_KEY = ['apikey', 'test', 'Q'.repeat(30)].join('_');

/** Every file git would publish: tracked, plus new files that are not ignored. */
function publishable(): string[] {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, maxBuffer: 64 << 20 });
  return out.toString('utf8').split('\0').filter(Boolean).filter((f) => existsSync(ROOT + f) && statSync(ROOT + f).isFile());
}
/** Files under a folder, even ignored ones (reports/runs, saved replays, summaries). */
function under(dir: string): string[] {
  if (!existsSync(ROOT + dir)) return [];
  return readdirSync(ROOT + dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => `${e.parentPath.slice(ROOT.length)}/${e.name}`.replace(/\/+/g, '/'));
}

/** The files that hold the key or something shaped like it. Only names come back. */
export function filesWithKey(files: string[], key: string | null, root = ROOT): string[] {
  const hits: string[] = [];
  for (const f of files) {
    if (f === '.env.local' || f.startsWith('node_modules/')) continue;
    let text: string;
    try { text = readFileSync(root + f, 'utf8'); } catch { continue; }
    if ((key && text.includes(key)) || new RegExp(KEY_SHAPE.source).test(text)) hits.push(f);
  }
  return hits;
}

describe('PLT-115: the Jev key never ends up in the public repo', () => {
  it('no file git would publish holds the key or anything shaped like it', () => {
    const files = publishable();
    expect(files.length).toBeGreaterThan(50);
    expect(filesWithKey(files, loadJevKey()), 'these files hold the Jev key, or something shaped like it').toEqual([]);
  });

  it('no test report, saved replay, run record or simulation summary holds it (ignored files too)', () => {
    const files = [...under('reports'), ...under('tests/replays'), ...under('test-results'), ...under('playwright-report')];
    expect(filesWithKey(files, loadJevKey()), 'these reports or replays hold the Jev key').toEqual([]);
  });

  it('the key and key-shaped text are replaced in anything the simulation writes', async () => {
    expect(redact(`calling with ${FAKE_KEY} now`, FAKE_KEY)).toBe('calling with [redacted] now');
    expect(redact(`Authorization: Bearer ${FAKE_KEY}`)).not.toContain(FAKE_KEY);
    expect(redact('a key-free line')).toBe('a key-free line');
    const leaky: Transport = async () => { throw new Error(`401 for key ${FAKE_KEY}`); };
    const jev = makeJev({ key: FAKE_KEY, budget: makeBudget(), transport: leaky });
    const s = await runMany({ games: 3, prefix: 'plt-115', jev, jevShare: 1 });
    expect(JSON.stringify(s)).not.toContain(FAKE_KEY);
    expect(summaryText(s)).not.toContain(FAKE_KEY);
    expect(jev.stats.failures.join(' ')).not.toContain(FAKE_KEY);
  });

  it('the check itself catches a planted key, by file name only', () => {
    // Planted outside the repo, in a temporary folder.
    const dir = `${mkdtempSync(`${tmpdir()}/key-check-`)}/`;
    writeFileSync(`${dir}summary.md`, `Players: 4\nkey ${FAKE_KEY}\n`);
    writeFileSync(`${dir}exact.json`, JSON.stringify({ note: 'plain-secret-without-shape-123' }));
    writeFileSync(`${dir}clean.md`, 'Games played: 3\napikey_short\n');
    expect(filesWithKey(['summary.md', 'exact.json', 'clean.md'], 'plain-secret-without-shape-123', dir)).toEqual(['summary.md', 'exact.json']);
  });

  it('.env.local is ignored by git, so the key file itself can never be committed', () => {
    // `git check-ignore` fails (and this throws) when the file would not be ignored.
    expect(() => execFileSync('git', ['check-ignore', '-q', '.env.local'], { cwd: ROOT, stdio: 'pipe' })).not.toThrow();
  });

  it('with no key anywhere, the loader gives none (PLT-114)', () => {
    expect(loadJevKey({}, '')).toBeNull();
    expect(loadJevKey({ JEV_IGNORE_ENV_FILE: '1' })).toBeNull();
    expect(loadJevKey({ JEV_API_KEY: '  ' }, '')).toBeNull();
  });
});
