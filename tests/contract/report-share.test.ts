// Phase 7: what "Share report" hands to the phone's share sheet (specs/platform/03-feedback.md, PLT-208, decided by the
// owner on 22 October 2026). Pure formatting only: the title, the three lines of text, the file name and the replay
// code. The screens, the stubbed share sheet and the clipboard are in tests/browser/report-problem.spec.ts.
// Names and shapes: tests/contract/README.md, "Sharing a report: shareParts".
import { describe, expect, it } from 'vitest';
import * as engine from '../../src/engine';

/* eslint-disable @typescript-eslint/no-explicit-any */
const need = (name: string): any => {
  const f = (engine as any)[name];
  if (typeof f !== 'function') throw new Error(`${name} is not exported from src/engine yet (PLT-208, tests/contract/README.md "Sharing a report")`);
  return f;
};
const shareParts = (report: any, opts: any): any => need('shareParts')(report, opts);
const reportText = (report: any): string => need('reportText')(report);
const readReport = (text: string): any => need('readReport')(text);
const makePlayerReport = (input: any): any => need('makePlayerReport')(input);

const T0 = new Date(2026, 9, 22, 7, 5, 9).getTime(); // 22 Oct 2026, 07:05:09 local time
const ticket = { v: 1, game: '7K3P', ticket: 3, name: 'Riyaben', rows: [[4, null, 21, null, 45, null, 63, null, 88], [null, 12, null, 33, 49, null, null, 71, 85], [7, null, 28, 38, null, 56, 69, null, null]], startedAt: T0, tiers: ['early-five', 'top-line', 'full-house'], marks: [4, 21] };
const report = (what: string, at = T0): any => makePlayerReport({ what, appVersion: '1.7.0', phone: 'Pixel 7 (Android 14), Chrome 129', at, tickets: [ticket] });
const WHEN = '22 Oct 2026, 7:05 am';
const parts = (what: string, over: Record<string, unknown> = {}) => shareParts(report(what), { gameTitle: 'Tambola', when: WHEN, at: new Date(T0), ...over });
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

describe('PLT-208: what the share sheet is given', () => {
  it('the title is exactly "Pocket Game Night problem report"', () => {
    expect(parts('x').title).toBe('Pocket Game Night problem report');
  });

  it('the text is three lines, in order: the header, the words, and the replay line', () => {
    const p = parts('The board froze');
    expect(p.text.split('\n')).toEqual([
      'Problem report · Tambola · app 1.7.0 · 22 Oct 2026, 7:05 am',
      'The board froze',
      'Replay attached. Please send this to whoever shared the app with you.',
    ]);
  });

  it('edge: nothing written reads "(nothing written)", on the second line, in both texts', () => {
    const p = parts('');
    expect(p.text.split('\n')[1]).toBe('(nothing written)');
    expect(p.textWithCode.split('\n')[1]).toBe('(nothing written)');
  });

  it('edge: a report started from Home (no game) leaves the game out: "Problem report · app <version> · <date and time>"', () => {
    for (const gameTitle of [undefined, null, '']) {
      const p = parts('From Home', { gameTitle });
      expect(p.text.split('\n')[0]).toBe('Problem report · app 1.7.0 · 22 Oct 2026, 7:05 am');
      expect(p.textWithCode.split('\n')[0]).toBe('Problem report · app 1.7.0 · 22 Oct 2026, 7:05 am');
    }
  });

  it('the file is named pgn-report-YYYYMMDD-HHMM.json from the phone\'s own time, with leading zeros', () => {
    expect(parts('x').fileName).toBe('pgn-report-20261022-0705.json');
    const early = shareParts(report('x'), { gameTitle: 'Tambola', when: WHEN, at: new Date(2026, 0, 3, 0, 9, 59) });
    expect(early.fileName).toBe('pgn-report-20260103-0009.json');
  });

  it('the file holds exactly the report text of PLT-201 (what the preview shows), and reads back as the same report', () => {
    const r = report('Marks vanished');
    const p = shareParts(r, { gameTitle: 'Tambola', when: WHEN, at: new Date(T0) });
    expect(p.fileText).toBe(reportText(r));
    const back = readReport(p.fileText);
    expect(back.ok).toBe(true);
    expect(back.report).toEqual(r);
  });

  it('where files cannot be shared: the same two first lines, then "Replay code:" and the report as one line of base64 text', () => {
    const r = report('The board froze');
    const p = shareParts(r, { gameTitle: 'Tambola', when: WHEN, at: new Date(T0) });
    const lines = p.textWithCode.split('\n');
    expect(lines.slice(0, 2)).toEqual(['Problem report · Tambola · app 1.7.0 · 22 Oct 2026, 7:05 am', 'The board froze']);
    expect(lines.slice(2)).toEqual(['Replay code:', b64(reportText(r))]);
    expect(p.replayCode).toBe(b64(reportText(r)));
    expect(p.replayCode).not.toMatch(/\s/);
    expect(p.textWithCode).not.toContain('Replay attached');
  });

  it('edge: words with ₹ and accents survive the replay code (UTF-8), and the code reads back as the report', () => {
    const r = report('₹37 was wrong, café "Player 1"');
    const p = shareParts(r, { gameTitle: 'Tambola', when: WHEN, at: new Date(T0) });
    const back = readReport(Buffer.from(p.replayCode, 'base64').toString('utf8'));
    expect(back.ok).toBe(true);
    expect(back.report).toEqual(r);
  });

  it('wrong input: it never makes names appear that the report does not hold', () => {
    const p = parts('Player 1 lost');
    for (const s of [p.text, p.textWithCode, p.fileText, Buffer.from(p.replayCode, 'base64').toString('utf8')]) expect(s).not.toContain('Riyaben');
  });
});

describe('PLT-208: preparing a share sends nothing', () => {
  it('shareParts never touches the network', async () => {
    const calls: string[] = [];
    const realFetch = globalThis.fetch;
    (globalThis as any).fetch = (...a: any[]) => { calls.push(String(a[0])); return Promise.reject(new Error('no network in this test')); };
    try {
      parts('offline please');
      await new Promise((ok) => setTimeout(ok, 20));
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(calls).toEqual([]);
  });
});
