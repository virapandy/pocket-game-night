// Reader: a screen map in the markdown format of docs/games/<game>/screen-map.md  ->  ScreenSet (model.ts).
// Knows the map's layout and nothing about the rules. Anything it cannot read goes into `faults`, never guessed.
import { readFileSync } from 'node:fs';
import type { Button, Intention, Screen, ScreenSet, Target } from './model.ts';

const ID = '[A-Z]\\d+[a-z]?';
const ID_RE = new RegExp(`^${ID}$`);
// Letters that start a screen id in the map (W and K are wording and decision numbers, not screens).
const TARGET_RE = new RegExp(`\\b([ABDEGJMPS]\\d+[a-z]?)\\b`, 'g');

function splitTop(s: string, sep: string): string[] {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseIntentions(raw: string): Intention[] {
  const out: Intention[] = [];
  for (const clause of splitTop(raw, ';')) {
    const tokens = splitTop(clause, ',').map((t) => t.trim()).filter(Boolean);
    let carry: string | null = null;
    const quals: (string | null)[] = new Array(tokens.length).fill(null);
    for (let i = tokens.length - 1; i >= 0; i--) {
      const m = /\(([^()]*)\)\s*$/.exec(tokens[i]);
      if (m) carry = m[1];
      quals[i] = carry;
    }
    tokens.forEach((t, i) => {
      const name = t.replace(/\([^()]*\)\s*$/, '').trim();
      const q = quals[i] ?? '';
      for (const n of name.split('/')) {
        const nn = n.trim().toLowerCase();
        if (nn) out.push({ name: nn, visible: !/\bmenu\b/i.test(q), raw: t });
      }
    });
  }
  return out;
}

function cutIntentions(text: string): string | null {
  const i = text.indexOf('*Intentions:*');
  if (i < 0) return null;
  const s = text.slice(i + '*Intentions:*'.length);
  let depth = 0;
  for (let k = 0; k < s.length; k++) {
    if (s[k] === '(') depth++;
    else if (s[k] === ')') depth = Math.max(0, depth - 1);
    else if (s[k] === '.' && depth === 0 && /\s[A-Z]/.test(s.slice(k + 1, k + 3))) return s.slice(0, k).trim();
  }
  return s.replace(/\.\s*$/, '').trim();
}

export function classifyTarget(leads: string, label: string): Target {
  const t = leads.trim();
  if (!t || t === '—' || t === '-') return { kind: 'none' };
  const ids = [...t.matchAll(TARGET_RE)].map((m) => m[1]);
  if (ids.length) return { kind: 'screen', ids: [...new Set(ids)] };
  if (/\bsame screen\b|^here\b|^same\b|\bthis screen\b/i.test(t)) return { kind: 'self' };
  if (/\bthe (same )?step\b|same step|last step|opened from|\bback\b|as it was|as before|Close any other way/i.test(t + ' ' + label)) return { kind: 'dynamic' };
  const ext = /\b(Settings)\b/.exec(t);
  if (ext) return { kind: 'external', name: ext[1] };
  return { kind: 'words' };
}

export function scenarioIds(cell: string): string[] {
  const out: string[] = [];
  for (const m of cell.matchAll(/SWD-(\d+)((?:\s*,\s*\d+)*)/g)) {
    out.push(`SWD-${m[1].padStart(3, '0')}`);
    for (const n of m[2].split(',').map((x) => x.trim()).filter(Boolean)) out.push(`SWD-${n.padStart(3, '0')}`);
  }
  return out;
}

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const stripMd = (s: string) => s.replace(/`/g, '').replace(/\*\*/g, '').replace(/\*proposed\*|\*[^*]+\*/g, (m) => m).trim();

function quoted(s: string): string[] { return [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1]); }

function mainLabelsIn(texts: string[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    for (const m of t.matchAll(/\bmain\s+(?:button\s+)?(?:renamed\s+)?"([^"]+)"/g)) out.add(m[1]);
    for (const m of t.matchAll(/"([^"]+)"\s*\(main\)/g)) out.add(m[1]);
  }
  return [...out];
}

function newScreen(id: string, name: string, kind: Screen['kind']): Screen {
  return { id, name, kind, texts: [], words: '', buttons: [], intentions: null, hasMenu: null, mainLabels: [], mainLabelsInDescription: [], noMain: false, mainMentioned: false };
}

function finish(s: Screen, desc: string, rowTexts: string[]): void {
  const wi = desc.indexOf('*Words:*');
  s.words = (wi >= 0 ? desc.slice(wi + 8) : desc).trim();
  const raw = cutIntentions(desc);
  s.intentions = raw === null ? null : parseIntentions(raw);
  if (/\bno menu\b/i.test(desc)) s.hasMenu = false;
  else if (/\bMenu:/.test(desc) || (s.intentions ?? []).some((i) => !i.visible)) s.hasMenu = true;
  s.texts = [s.name, desc, ...rowTexts];
  const all = [desc, ...rowTexts];
  s.mainLabels = mainLabelsIn(all);
  s.mainLabelsInDescription = mainLabelsIn([desc]);
  s.noMain = /\bno main\b/i.test(desc);
  s.mainMentioned = all.some((t) => /\bmain\b/i.test(t));
}

export function readMap(file: string): ScreenSet {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const set: ScreenSet = { source: file, screens: [], paths: [], faults: [] };
  let cur: Screen | null = null; let desc: string[] = []; let rowTexts: string[] = []; let header: string[] | null = null;
  let inPaths = false; let inCode = false; let dialogTable = false;
  const close = () => { if (cur) finish(cur, desc.join(' ').replace(/\s+/g, ' '), rowTexts); cur = null; desc = []; rowTexts = []; header = null; };

  for (const line of lines) {
    if (/^## /.test(line)) { close(); inPaths = /^## G\./.test(line); dialogTable = false; continue; }
    const h = /^###\s+([A-Z]\d+[a-z]?)\.\s+(.*)$/.exec(line);
    if (h) { close(); cur = newScreen(h[1], h[2].trim(), 'screen'); set.screens.push(cur); continue; }
    if (inPaths) {
      if (line.startsWith('```')) { inCode = !inCode; continue; }
      if (inCode) {
        for (const chunk of line.split(/\s{2,}/)) {
          const parts = chunk.trim().split('→');
          for (let i = 0; i + 1 < parts.length; i++) {
            const froms = [...parts[i].matchAll(TARGET_RE)].map((m) => m[1]);
            const tos = [...parts[i + 1].matchAll(TARGET_RE)].map((m) => m[1]);
            if (!froms.length && !/\(resume\)/.test(parts[i])) set.faults.push(`paths line not read: "${chunk.trim()}"`);
            for (const from of froms) for (const to of tos) set.paths.push({ from, to });
          }
        }
      }
      continue;
    }
    if (!line.startsWith('|')) { if (cur && !header) desc.push(line.trim()); continue; }
    const c = cells(line);
    if (c.every((x) => /^:?-{2,}:?$/.test(x))) continue;
    // Section D: one table of dialogs, first column '#'
    if (c[0] === '#' && /dialog/i.test(c[1] ?? '')) { dialogTable = true; header = c.map((x) => x.toLowerCase()); continue; }
    if (dialogTable && ID_RE.test(c[0])) {
      const s = newScreen(c[0], c[1], 'dialog'); set.screens.push(s);
      const [words, btns, rec, ids] = [c[2] ?? '', c[3] ?? '', c[4] ?? '', c[5] ?? ''];
      for (const seg of splitTop(btns, '·').map((x) => x.trim()).filter(Boolean)) {
        const a = seg.split('→');
        if (a.length < 2) continue; // a toast or note inside the cell, not a button
        const label = a[0].trim(); const leads = a.slice(1).join('→').trim();
        s.buttons.push({ label: label.replace(/\s*\(main\)/, ''), leadsText: leads, target: classifyTarget(leads, label), records: stripMd(rec), scenarioIds: scenarioIds(ids), idsText: ids, isMain: /\(main\)/.test(label), inMenu: false });
      }
      if (!s.buttons.length) set.faults.push(`${s.id}: no "label → where" buttons found in the buttons cell`);
      s.words = words; s.texts = [s.name, words, btns, rec];
      s.mainLabels = mainLabelsIn([btns]); s.mainLabelsInDescription = s.mainLabels; s.noMain = false; s.mainMentioned = /\(main\)/.test(btns);
      continue;
    }
    if (!cur) continue;
    if (!header) { header = c.map((x) => x.toLowerCase()); continue; }
    // a tap-table row
    const ix = (n: string) => header!.findIndex((x) => x === n);
    const [iT, iL, iR, iI] = [ix('tap'), ix('leads to'), ix('records'), ix('ids')];
    if (iT < 0 || iL < 0) { set.faults.push(`${cur.id}: table header not understood: ${header.join(' | ')}`); continue; }
    if (c.length !== header.length) set.faults.push(`${cur.id}: row has ${c.length} cells, header has ${header.length}: "${c[0].slice(0, 40)}"`);
    const label = (c[iT] ?? '').replace(/\s*\(main\)/, '');
    const leads = c[iL] ?? '';
    const b: Button = {
      label, leadsText: leads, target: classifyTarget(leads, label), records: stripMd(iR >= 0 ? c[iR] ?? '' : ''),
      scenarioIds: scenarioIds(iI >= 0 ? c[iI] ?? '' : ''), idsText: iI >= 0 ? c[iI] ?? '' : '',
      isMain: /\(main\)/.test(c[iT] ?? ''), inMenu: /^(Menu\b|Other menu items)/i.test(label),
    };
    cur.buttons.push(b);
    rowTexts.push(c.join(' | '));
  }
  close();
  return set;
}

export function quotedStrings(s: Screen): string[] {
  return [...s.texts.flatMap(quoted), ...s.buttons.map((b) => b.label)];
}
