// A saved What Am I? game night (WAI-091, WAI-092, B9), read back by replaying its moves.
import { replay, type SavedGame } from '../../../engine';
import { whatAmIRules } from './rules';
import type { WaiConfig, WaiMove, WaiState, WaiView } from './types';

export interface WhatAmINight {
  readonly state: WaiState;
  readonly view: WaiView;
  readonly status: SavedGame['status'];
  /** The time of tonight's first `start`, or null. */
  readonly firstStart: number | null;
}

/** The game night as Home, History and the summary read it. Null when it no longer replays. */
export function readWhatAmINight(saved: SavedGame): WhatAmINight | null {
  const records = saved.records as SavedGame<WaiConfig, WaiMove>['records'];
  const r = replay(whatAmIRules, saved.setup as SavedGame<WaiConfig>['setup'], records);
  if (!r.ok) return null;
  const first = records.find((x) => x.move.type === 'start');
  return {
    state: r.value.state,
    view: whatAmIRules.view(r.value.state, { kind: 'host' }),
    status: saved.status,
    firstStart: first ? first.at : null,
  };
}
