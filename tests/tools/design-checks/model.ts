// The shape of a screen, as the design rule checks see it. Both readers (the screen-map reader today, a live-screen
// reader for the prototype later) produce this; rules.ts reads only this and never knows where it came from.

/** Where a button leads, as far as the source says. */
export type Target =
  | { kind: 'screen'; ids: string[] }       // names one or more screens by id
  | { kind: 'self' }                        // stays on the same screen
  | { kind: 'dynamic' }                     // "the step it was opened from", "back": decided at run time
  | { kind: 'external'; name: string }      // a screen that lives outside this map (for example Settings)
  | { kind: 'words' }                       // only described in words ("map shown"): not decidable
  | { kind: 'none' };                       // nothing written

export interface Button {
  label: string;
  /** What the source says it leads to, verbatim. */
  leadsText: string;
  target: Target;
  /** What the tap records, verbatim ('' when nothing). */
  records: string;
  /** Scenario ids written next to the button, expanded ("SWD-003, 132" gives SWD-003 and SWD-132). */
  scenarioIds: string[];
  /** The ids cell, verbatim (to report "new", "decision 6"). */
  idsText: string;
  isMain: boolean;
  /** Reached through the menu, not drawn on the screen. */
  inMenu: boolean;
}

export interface Intention {
  name: string;          // lower case: stop, home, back, help, undo, pause, players, timer, ...
  visible: boolean;      // false when only through the menu
  raw: string;
}

export interface Screen {
  id: string;
  name: string;
  kind: 'screen' | 'dialog';
  /** Every piece of on-screen text the source gives (for word checks). */
  texts: string[];
  words: string;
  buttons: Button[];
  /** null when the source gives no intentions line. */
  intentions: Intention[] | null;
  /** null when unknown. */
  hasMenu: boolean | null;
  mainLabels: string[];
  /** Main labels found in the screen's own description (not inside a row that may describe a dialog). */
  mainLabelsInDescription: string[];
  /** The source says "no main button". */
  noMain: boolean;
  /** The source mentions a main button at all (a label, "main fixed", ...). */
  mainMentioned: boolean;
}

export interface ScreenSet {
  source: string;
  screens: Screen[];
  /** Screen-to-screen moves listed in the source (each a list of ids; empty when the source has none). */
  paths: { from: string; to: string }[];
  /** Problems the reader had with the source file. Kept apart from findings. */
  faults: string[];
}

export type Rule = 'R1 way out' | 'R2 button leads somewhere' | 'R3 stop and home' | 'R4 one main button' | 'R5 banned words' | 'R6 rule hook has a scenario' | 'R7 secret behind a hold';

export interface Result {
  kind: 'finding' | 'cannot';
  rule: Rule;
  screen: string;     // screen id, or '-' for whole-map results
  text: string;
}
