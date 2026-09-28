#!/usr/bin/env node
// Checks the dependency rules in src/CLAUDE.md, plus the engine's purity rules. Prints only problems.
//   1. Games may use building blocks and the engine, never another game.
//   2. Building blocks may use the engine, never a game.
//   3. The engine depends on nothing else in the project (and on no outside package).
//   4. Adapters implement engine interfaces and never contain game rules (so they never import a game).
//   5. Only src/app/ assembles everything, and nothing imports it.
//   6. Other code imports a game only through its index.ts registration file.
//   Purity: no Math.random() or Date.now() in the engine or in any game's rules/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'src');
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx|mts)$/.test(name) ? [p] : [];
  });
}

// Which part of src a file belongs to: { area: 'engine' | 'app' | 'blocks' | 'adapters' | 'games' | 'other', game? }
function areaOf(file) {
  const parts = path.relative(src, file).split(path.sep);
  if (parts[0] === '..' ) return { area: 'outside' };
  if (parts[0] === 'games') return { area: 'games', game: parts[1], inner: parts.slice(2).join('/') };
  return { area: ['engine', 'app', 'blocks', 'adapters'].includes(parts[0]) ? parts[0] : 'other' };
}

const IMPORT = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const problems = [];
for (const file of walk(src)) {
  const text = readFileSync(file, 'utf8');
  const from = areaOf(file);
  const where = rel(file);

  if (from.area === 'engine' || (from.area === 'games' && from.inner?.startsWith('rules/'))) {
    const code = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    if (/\bMath\.random\s*\(/.test(code)) problems.push(`${where}: uses Math.random(); use the seeded generator from the engine`);
    if (/\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)/.test(code)) problems.push(`${where}: reads the clock; take time from the move record`);
  }

  for (const m of text.matchAll(IMPORT)) {
    const spec = m[1] ?? m[2];
    if (!spec.startsWith('.')) {
      if (from.area === 'engine') problems.push(`${where}: the engine imports the package "${spec}"; the engine depends on nothing`);
      continue;
    }
    const target = path.resolve(path.dirname(file), spec);
    const to = areaOf(target);
    const say = (why) => problems.push(`${where}: imports ${spec} (${why})`);

    if (to.area === 'outside') { say('outside src/'); continue; }
    if (to.area === 'app' && from.area !== 'app') say('nothing may import src/app');
    if (from.area === 'engine' && to.area !== 'engine') say('the engine depends on nothing else in the project');
    if (from.area === 'blocks' && !['engine', 'blocks'].includes(to.area)) say('building blocks may use only the engine');
    if (from.area === 'adapters' && !['engine', 'adapters'].includes(to.area)) say('adapters may use only the engine');
    if (from.area === 'games' && to.area === 'games' && to.game !== from.game) say('a game never uses another game');
    if (from.area === 'games' && ['adapters', 'other'].includes(to.area)) say('games may use only the engine and building blocks');
    if (to.area === 'games' && !(from.area === 'games' && from.game === to.game)) {
      const entry = /^index(\.tsx?)?$/.test(to.inner ?? '') || to.inner === '';
      if (!entry) say(`use src/games/${to.game}/index.ts, the game's only entry point`);
    }
  }
}

if (problems.length) {
  console.error(`Boundary check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Boundary check passed.');
