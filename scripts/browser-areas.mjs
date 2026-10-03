// Quick verify: which browser spec files cover the files a push changed.
// Usage: node scripts/browser-areas.mjs <before-sha> <after-sha>
// Prints the mapped spec files, one per line; prints nothing when there is no map, the push range
// cannot be read, or nothing maps. Automation then runs the smoke set only. Never fails the run.
// Two special spec entries:
//   "*"                    every browser spec: prints the single line __ALL__ and quick.yml runs them all.
//   "<the changed file>"   the changed spec file itself: each changed path that the area matches and that
//                          is a tests/browser/*.spec.ts file still in the repo is printed by file name.
//
// The map, tests/browser/areas.json, is written by the Test side. Either shape is accepted:
//   { "src/games/tambola/ui/Claims*": ["claims.spec.ts"], "src/app/**": ["app-shell.spec.ts"] }
//   { "areas": [ { "paths": ["src/app/**"], "specs": ["app-shell.spec.ts"] } ] }
// A path ending in "/" or "/**" covers everything under it; "*" matches within one folder, "**" across folders.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const MAP = 'tests/browser/areas.json';
const ALL = '__ALL__';
const CHANGED_FILE = '<the changed file>';
const SPEC_FILE = /^tests\/browser\/([^/]+\.spec\.ts)$/;

function globToRegExp(glob) {
  let g = glob.trim().replace(/^\.\//, '');
  if (g.endsWith('/')) g += '**';
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      re += '.*';
      i++;
      if (g[i + 1] === '/') i++;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

function readAreas(raw) {
  const areas = [];
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.areas) ? raw.areas : null;
  if (list) {
    for (const a of list) {
      const paths = [a?.paths ?? a?.path ?? []].flat().filter((p) => typeof p === 'string');
      const specs = [a?.specs ?? a?.spec ?? []].flat().filter((s) => typeof s === 'string');
      areas.push({ paths, specs });
    }
  } else if (raw && typeof raw === 'object') {
    for (const [path, specs] of Object.entries(raw)) {
      if (path.startsWith('$') || path.startsWith('_')) continue; // comments
      areas.push({ paths: [path], specs: [specs].flat().filter((s) => typeof s === 'string') });
    }
  }
  return areas;
}

try {
  const [before, after] = process.argv.slice(2);
  if (!existsSync(MAP) || !before || !after || /^0+$/.test(before)) process.exit(0);
  const changed = execFileSync('git', ['diff', '--name-only', `${before}..${after}`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const areas = readAreas(JSON.parse(readFileSync(MAP, 'utf8')));
  const specs = new Set();
  let all = false;
  for (const { paths, specs: s } of areas) {
    const res = paths.map(globToRegExp);
    const hits = changed.filter((f) => res.some((re) => re.test(f)));
    if (hits.length === 0) continue;
    for (const x of s) {
      const name = x.trim();
      if (name === '*') all = true;
      else if (name === CHANGED_FILE) {
        for (const f of hits) {
          const m = SPEC_FILE.exec(f);
          if (m && existsSync(f)) specs.add(m[1]); // a deleted spec has nothing to run
        }
      } else if (name) specs.add(name.replace(/^tests\/browser\//, '').replace(/^tests\//, ''));
    }
  }
  if (all) console.log(ALL);
  else for (const s of specs) console.log(s);
} catch (e) {
  console.error(`Area map not used (${e instanceof Error ? e.message : e}); smoke set only.`);
}
