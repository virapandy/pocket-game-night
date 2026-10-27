// PLT-303 (product owner, 26 October 2026): a game's name never breaks across lines. Each name of more than one word is
// held on one line (`white-space: nowrap`, the same as joining its words with no-break spaces); the text itself keeps
// ordinary spaces, so it reads, copies and matches exactly as before.
import { Fragment, type ReactNode } from 'react';

/** The game names of more than one word (the one-word names cannot break). */
const NAMES = /(Secret Words|What Am I\?)/;

/** The text with every game name in it held on one line. */
export function keepNames(text: string): ReactNode {
  const parts = text.split(NAMES);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ whiteSpace: 'nowrap' }}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
