// "Read this aloud" (SWD-010) and "How to play" (SWD-011, SWD-131): the exact words of the scenarios.
// Nothing about the map is ever here.
import { useEffect, useRef } from 'react';
import { QuietButton, Screen } from '../../../blocks';
import type { SecretWordsChoices, SecretWordsTeamNames } from '../rules';
import { GuardedMain } from './guard';

type RuleChoices = Pick<SecretWordsChoices, 'board' | 'landmine'>;

/** SWD-010: the 4 lines, with the evening's team names; line 4 follows the Board and Landmine choices. */
export function readAloudLines(names: SecretWordsTeamNames, c: RuleChoices): string[] {
  return [
    `Two teams, ${names.orange} and ${names.teal}. Each has a clue giver who sees the secret map.`,
    "Clue givers: say one word and a number. 'Monsoon, 2' means two of our words go with monsoon.",
    'Guessers: talk, then turn over words one at a time. Wrong word? Your turn ends.',
    c.board === 'easy'
      ? 'Find all your words first!'
      : c.landmine === 'turn'
        ? 'Find all your words first. Step on the Landmine and your turn ends!'
        : 'Find all your words first. Step on the Landmine and you lose!',
  ];
}

/** SWD-011 (version 3.6): "The rules", 7 lines; line 5 follows the Board and Landmine choices. */
function rules(c: RuleChoices): string[] {
  const five = "Your word: keep going. Nobody's word or the other team's: your turn ends.";
  return [
    'Clue givers see the secret map. Everyone else sees only the words.',
    'A clue is one word and one number. It must be about meaning, not spelling or where a word sits.',
    'No faces, no pointing, no extra hints. Before the first guess, both clue givers decide together whether a clue is allowed.',
    'Guessers take at least one guess, and up to the number plus one. 0 or ∞: as many as you like.',
    c.board === 'easy'
      ? five
      : c.landmine === 'turn'
        ? `${five} The Landmine: your turn ends and the other team gets a word free.`
        : `${five} The Landmine: you lose!`,
    'First team to find all its words wins.',
    'Keep the host phone on the table: it shows the board.',
  ];
}

/** SWD-131 (version 3.6). */
const CLUE_RULES = [
  'One word only. Names like Taj Mahal count as one.',
  "About meaning: no spelling, no rhymes, no 'top left'.",
  "Not a word on the board, or a form or part of one (no 'rail' while Railway is face down). Letters inside another word are fine (Pan with Japan).",
  "English, or a word you'd use in English (chai, dosa).",
];

const CREDIT =
  'Secret Words uses game rules inspired by Codenames, designed by Vlaada Chvátil. Codenames is a trademark of Czech Games Edition. Secret Words is an independent free game and is not made, sponsored or endorsed by Czech Games Edition.';

export function ReadAloud({
  names,
  choices,
  larger,
  onBack,
  onPlay,
  onPreview,
  onSettings,
}: {
  names: SecretWordsTeamNames;
  choices: RuleChoices;
  larger: boolean;
  onBack: () => void;
  onPlay: () => void;
  onPreview: () => void;
  onSettings: () => void;
}) {
  return (
    <Screen page className="sw-setup sw-aloud">
      <header className="sw-bar">
        <QuietButton onClick={onBack}>← Back</QuietButton>
      </header>
      <h1 className="pgn-title">Read this aloud</h1>
      <ol className="sw-lines sw-aloud-lines">
        {readAloudLines(names, choices).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      {/* SWD-010 (version 3.7, P10): only while Larger text is off. */}
      {!larger && (
        <p className="sw-small" data-testid="larger-text-hint">
          Small text? Turn on Larger text in{' '}
          <a
            href="#"
            className="sw-link"
            onClick={(e) => {
              e.preventDefault();
              onSettings();
            }}
          >
            Settings
          </a>
          .
        </p>
      )}
      <QuietButton className="sw-wide" onClick={onPreview}>
        Show me the board first
      </QuietButton>
      <GuardedMain onClick={onPlay}>Let's play</GuardedMain>
    </Screen>
  );
}

export function HowToPlay({
  names,
  choices,
  onDone,
  at,
}: {
  names: SecretWordsTeamNames;
  choices: RuleChoices;
  onDone: () => void;
  /** Opened from the map phone's "Clue rules" (SWD-011 v3.6): its h2 "Clue rules" at the top of the screen. */
  at?: 'clue-rules';
}) {
  const clueRules = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (at === 'clue-rules' && clueRules.current) clueRules.current.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [at]);
  return (
    <Screen page className="sw-setup sw-how">
      <h1 className="pgn-title">How to play</h1>
      <h2 className="sw-h2">Read this aloud</h2>
      <ol className="sw-lines">
        {readAloudLines(names, choices).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <h2 className="sw-h2">The rules</h2>
      <ol className="sw-lines">
        {rules(choices).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <h2 className="sw-h2" ref={clueRules}>
        Clue rules
      </h2>
      <ol className="sw-lines">
        {CLUE_RULES.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <p className="sw-small sw-credit" data-testid="credit">
        {CREDIT}
      </p>
      <GuardedMain onClick={onDone}>Done</GuardedMain>
    </Screen>
  );
}
