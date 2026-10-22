// The clue word (specs/secret-words/04-play.md SWD-101): its letters, and the warning when it is a face-down word.

/** SWD-101: NFKC, lower case, a–z only ("ice-cream" → "icecream", "Taj Mahal" → "tajmahal"). */
export function reduceLetters(text: string): string {
  return String(text).normalize('NFKC').toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * SWD-101's warning: the word text of the first face-down word (in `data-index` order) that the typed text equals,
 * contains or is contained in, after both are reduced to their letters; null when the typed text keeps fewer than
 * 3 letters or matches none.
 */
export function clueWarning(typed: string, cells: readonly { readonly word: string; readonly turned: boolean }[]): string | null {
  const t = reduceLetters(typed);
  if (t.length < 3) return null;
  for (const c of cells) {
    if (c.turned) continue;
    const w = reduceLetters(c.word);
    if (w && (t.includes(w) || w.includes(t))) return c.word;
  }
  return null;
}
