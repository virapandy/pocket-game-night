// PLT-303 (product owner, 26 October 2026): a game's name never breaks across lines. Its words are joined with no-break
// spaces (U+00A0) wherever a name is shown; the saved text and the rules' text keep ordinary spaces.

/** The game names of more than one word (the one-word names cannot break). */
const NAMES = ['Secret Words', 'What Am I?'] as const;
const NBSP = ' ';

/** The text with every game name in it held on one line. */
export function keepNames(text: string): string {
  let out = text;
  for (const name of NAMES) out = out.split(name).join(name.replace(/ /g, NBSP));
  return out;
}
