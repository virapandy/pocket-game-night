// Secret Words on the host phone: setup (lane A: "Who's playing?", "Make teams", "How do you want to play?", "Read this
// aloud", "How to play") up to the first deal, then the game. The game's own screens (the turn, the board, game over)
// are lanes B to D: after the first deal this shows lane B's turn screens (ui/turn/Turn.tsx).
import { useEffect, useState, type ReactNode } from 'react';
import type { Preferences, SavedGameStore, SessionPicker } from '../../../engine';
import { BlocksRoot } from '../../../blocks';
import type { SecretWordsChoices, SecretWordsTeamNames } from '../rules';
import {
  landmineDefault, loadNight, pastNames, PREF, readAloudDue, readLastChoices, recentPairIds, startNight, teamSeedFor, tonightsNames,
  type ChoicesDraft, type Night, type NightMatch,
} from './evening';
import { Choices, MakeTeams, SettingsScreen, WhosPlaying } from './Setup';
import { drawNames, drawSplit, fromSplit, keepTeams, movePlayer, teamOf, otherTeam, type TeamsDraft } from './teams';
import { HowToPlay, ReadAloud } from './Texts';
import { dealNext, SecretWordsNight } from './after/Night';
import type { NextGivers } from './after/facts';
import type { SecretWordsMove } from '../rules';
import './secret-words.css';

/** How the screen opens: a new game night (from the picker), "Play again with these teams" (Home), or a resume. */
export type SecretWordsStart =
  | { readonly kind: 'new'; readonly names?: readonly string[] }
  | { readonly kind: 'again'; readonly id: string }
  | { readonly kind: 'resume'; readonly id: string };

type Step = 'names' | 'teams' | 'choices' | 'how' | 'aloud' | 'settings' | 'playing';

interface TeamsState {
  readonly seed: string;
  /** Draws so far (SWD-006: k counts every draw of the evening). */
  readonly k: number;
  /** "New team names" draws so far (SWD-013: m). */
  readonly m: number;
  readonly names: SecretWordsTeamNames;
  readonly draft: TeamsDraft;
  /** SWD-013, SWD-115: no "New team names" once the names are fixed ("Play again with these teams"). */
  readonly fixedNames: boolean;
}

export function SecretWordsScreen({
  start,
  store,
  prefs,
  sessions,
  testSeedsRaw,
  release,
  settingsPanel,
  onExit,
  onBack,
  ui,
  onHistory,
  onPlaying,
}: {
  /** True while a game night's turn screens show (the app then keeps phone Back in the game), false on setup. */
  onPlaying?: (playing: boolean) => void;
  /** `pgn.secretWords-ui.*` (SWD-048), the turn screens' state. */
  ui: Preferences;
  /** History, from the game's menu. */
  onHistory: () => void;
  start: SecretWordsStart;
  store: SavedGameStore;
  prefs: Preferences;
  sessions: SessionPicker;
  /** `localStorage['pgn.test.seeds']` (Test hooks item 2). */
  testSeedsRaw: () => string | null;
  release: boolean;
  /** This phone's settings (Larger text and the rest), shown under "Settings" with "← Back". */
  settingsPanel: ReactNode;
  /** Home. */
  onExit: () => void;
  /** "← Back" on "Who's playing?": the picker, with the names as they are, kept for this visit. */
  onBack: (names: string[]) => void;
}) {
  const [init] = useState(() => opening(start, store, sessions, testSeedsRaw(), release));
  const [step, setStep] = useState<Step>(init.step);
  const [names, setNames] = useState<string[]>(init.names);
  const [past] = useState(() => pastNames(store));
  const [teams, setTeams] = useState<TeamsState | null>(init.teams);
  const [last] = useState(() => readLastChoices(prefs));
  const [choices, setChoices] = useState<ChoicesDraft>(last.choices);
  /** SWD-119: the host tapped a Landmine option in this setup (or one was saved): Words no longer changes it. */
  const [landmineSet, setLandmineSet] = useState(last.landmineSaved);
  /** SWD-009: "Same as last time" is decided when the choices open and stays until they are left. */
  const [sameShown, setSameShown] = useState(false);
  /** Choices mount again after "How to play" (SWD-009 v3.6: "Start the game" waits its 800 ms again). */
  const [mount, setMount] = useState(0);
  const [larger, setLarger] = useState(() => prefs.get<boolean>(PREF.largerText, false) === true);
  const [settingsFrom, setSettingsFrom] = useState<Step>('aloud');
  const [night, setNight] = useState<{ saved: Night; match: NightMatch } | null>(init.night);
  /** SWD-112: "Change teams, players, phones or board" from game over: setup for the next game of this night. */
  const [changing, setChanging] = useState<string | null>(null);

  const startChange = (next: NextGivers) => {
    if (!night) return;
    const saved = store.get(night.saved.id);
    const match = saved && loadNight(saved);
    if (!match) return;
    const s = match.state;
    setNames([...s.players]);
    setTeams({
      seed: teamSeedFor(testSeedsRaw(), release),
      k: 0,
      m: 0,
      names: s.teams.names,
      draft: {
        orange: [...s.teams.orange],
        teal: [...s.teams.teal],
        clueGivers: { ...next.clueGivers },
        partners: { ...next.partners },
        guessOnly: [...next.guessOnly],
      },
      fixedNames: true,
    });
    setChoices({ ...s.choices });
    setLandmineSet(true);
    setChanging(night.saved.id);
    setStep('names');
  };
  /** "Start the game" after changes: no read-aloud; the changes (tap → move table), then the deal (SWD-112). */
  const changeDeal = () => {
    if (!changing || !teams || choices.map === null) return;
    const saved = store.get(changing);
    const match = saved && loadNight(saved);
    if (!match) return;
    const s = match.state;
    const d = teams.draft;
    const t = {
      orange: [...d.orange],
      teal: [...d.teal],
      clueGivers: { ...d.clueGivers },
      partners: { ...d.partners },
      names: s.teams.names,
      guessOnly: [...d.guessOnly],
    };
    const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
    const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));
    const moves: SecretWordsMove[] = [];
    if (!sameSet(names, s.players)) moves.push({ type: 'setPlayers', players: [...names], teams: t });
    else if (!same(d.orange, s.teams.orange) || !same(d.teal, s.teams.teal) || !sameSet(d.guessOnly, s.teams.guessOnly)) {
      moves.push({ type: 'setTeams', teams: t, splits: Math.max(s.splits, teams.k) });
    } else if (
      d.clueGivers.orange !== s.teams.clueGivers.orange ||
      d.clueGivers.teal !== s.teams.clueGivers.teal ||
      d.partners.orange !== s.teams.partners.orange ||
      d.partners.teal !== s.teams.partners.teal
    ) {
      moves.push({ type: 'setClueGivers', clueGivers: { ...d.clueGivers }, partners: { ...d.partners } });
    }
    const c: SecretWordsChoices = { map: choices.map, board: choices.board, landmine: choices.landmine, words: choices.words };
    const sc = s.choices;
    if (c.map !== sc.map || c.board !== sc.board || c.landmine !== sc.landmine || c.words !== sc.words) moves.push({ type: 'setChoices', choices: c });
    const made = dealNext(store, prefs, ui, changing, moves);
    if (!made) return;
    setNight(made);
    setChanging(null);
    setPreview(false);
    setStep('playing');
  };

  const toTeams = () => {
    if (teams) {
      setTeams({ ...teams, draft: keepTeams(teams.draft, names) });
    } else {
      // SWD-004: the team seed is made (or read from the test hook) on first entering Make teams for a new evening.
      const seed = teamSeedFor(testSeedsRaw(), release);
      const split = drawSplit(names, seed, 1);
      setTeams({ seed, k: split.k, m: 1, names: drawNames(seed, 1, recentPairIds(store)), draft: fromSplit(split, []), fixedNames: false });
    }
    setStep('teams');
  };
  const toChoices = () => {
    setSameShown(last.same);
    setStep('choices');
  };
  /** "Show me the board first" (SWD-010, 012): the turn screens open on the preview board. */
  const [preview, setPreview] = useState(false);
  const deal = (first = false): boolean => {
    if (!teams || choices.map === null) return false;
    const c: SecretWordsChoices = { map: choices.map, board: choices.board, landmine: choices.landmine, words: choices.words };
    const made = startNight({
      store, prefs, sessions, players: names, teams: teams.draft, names: teams.names, splits: teams.k, teamSeed: teams.seed,
      choices: c, testSeedsRaw: testSeedsRaw(), release,
    });
    if (!made) return false;
    setNight(made);
    setPreview(first);
    setStep('playing');
    return true;
  };

  useEffect(() => {
    onPlaying?.(step === 'playing');
  }, [step, onPlaying]);

  let screen: ReactNode;
  switch (step) {
    case 'names':
      screen = (
        <WhosPlaying
          names={names}
          onChange={setNames}
          past={past}
          {...(changing ? { backLabel: '← Back to the game' } : {})}
          onBack={() => {
            if (!changing) return onBack(names);
            setChanging(null);
            setStep('playing');
          }}
          onNext={toTeams}
        />
      );
      break;
    case 'teams':
      if (!teams) return null;
      screen = (
        <MakeTeams
          draft={teams.draft}
          names={teams.names}
          canRename={!teams.fixedNames}
          onMove={(p) => {
            const before = teams;
            const to = otherTeam(teamOf(teams.draft, p));
            setTeams({ ...teams, draft: movePlayer(teams.draft, p) });
            return { text: `${p} moved to ${teams.names[to]}`, undo: () => setTeams((cur) => (cur ? { ...cur, draft: before.draft } : cur)) };
          }}
          onShuffle={() => {
            const before = teams.draft;
            const split = drawSplit(names, teams.seed, teams.k + 1, { guessOnly: teams.draft.guessOnly, now: teams.draft });
            setTeams({ ...teams, k: split.k, draft: fromSplit(split, teams.draft.guessOnly) });
            return () => setTeams((cur) => (cur ? { ...cur, draft: before } : cur));
          }}
          onNewNames={() => {
            const before = teams.names;
            const m = teams.m + 1;
            setTeams({ ...teams, m, names: drawNames(teams.seed, m, recentPairIds(store), teams.names.id) });
            return () => setTeams((cur) => (cur ? { ...cur, names: before } : cur));
          }}
          onClueGivers={(draft) => setTeams({ ...teams, draft })}
          onBack={() => setStep('names')}
          onNext={toChoices}
        />
      );
      break;
    case 'choices':
      screen = (
        <Choices
          key={mount}
          choices={choices}
          sameAsLast={sameShown}
          playerCount={names.length}
          onPhones={(map) => setChoices({ ...choices, map })}
          onBoard={(board) => setChoices({ ...choices, board })}
          onLandmine={(landmine) => {
            setLandmineSet(true);
            setChoices({ ...choices, landmine });
          }}
          onWords={(words) => setChoices({ ...choices, words, ...(landmineSet ? {} : { landmine: landmineDefault(words) }) })}
          onHowToPlay={() => setStep('how')}
          onBack={() => setStep('teams')}
          onStart={() => {
            if (changing) return changeDeal();
            // SWD-010: the read-aloud card when no game has been dealt yet in this session; otherwise deal at once.
            if (readAloudDue(store, sessions, Date.now())) setStep('aloud');
            else deal();
          }}
        />
      );
      break;
    case 'how':
      screen = (
        <HowToPlay
          names={teams?.names ?? { id: '', orange: 'Orange team', teal: 'Teal team' }}
          choices={choices}
          onDone={() => {
            setMount((n) => n + 1);
            setStep('choices');
          }}
        />
      );
      break;
    case 'aloud':
      screen = teams && (
        <ReadAloud
          names={teams.names}
          choices={choices}
          larger={larger}
          onBack={() => setStep('choices')}
          onPlay={() => deal()}
          onPreview={() => deal(true)}
          onSettings={() => {
            setSettingsFrom('aloud');
            setStep('settings');
          }}
        />
      );
      break;
    case 'settings':
      screen = (
        <SettingsScreen
          panel={settingsPanel}
          onBack={() => {
            setLarger(prefs.get<boolean>(PREF.largerText, false) === true);
            setStep(settingsFrom);
          }}
        />
      );
      break;
    default:
      screen = night && (
        <SecretWordsNight
          id={night.saved.id}
          store={store}
          prefs={prefs}
          ui={ui}
          {...(preview ? { start: 'preview' as const } : {})}
          onHome={onExit}
          onHistory={onHistory}
          onChangeSetup={startChange}
          onSomethingElse={(list) => onBack(list)}
          onSettings={() => {
            setSettingsFrom('playing');
            setStep('settings');
          }}
          howToPlay={({ onDone }) => <HowToPlay names={night.match.state.teams.names} choices={night.match.state.choices} onDone={onDone} />}
        />
      );
  }
  return (
    <BlocksRoot className="sw" larger={larger}>
      {screen}
    </BlocksRoot>
  );
}

/** Where the screen opens, and with what (SWD-003 names, SWD-115 "Play again with these teams", a resume). */
function opening(
  start: SecretWordsStart,
  store: SavedGameStore,
  sessions: SessionPicker,
  testSeedsRaw: string | null,
  release: boolean,
): { step: Step; names: string[]; teams: TeamsState | null; night: { saved: Night; match: NightMatch } | null } {
  if (start.kind === 'resume') {
    const saved = store.get(start.id) as Night | undefined;
    const match = saved && loadNight(saved);
    return { step: 'playing', names: [], teams: null, night: saved && match ? { saved, match } : null };
  }
  if (start.kind === 'again') {
    const saved = store.get(start.id);
    const match = saved && loadNight(saved);
    if (match) {
      // SWD-115: the same players, teams, team names (reused) and "Doesn't give clues" switches; clue givers by SWD-007.
      const s = match.state;
      const seed = teamSeedFor(testSeedsRaw, release);
      return {
        step: 'teams',
        names: [...s.players],
        teams: { seed, k: 0, m: 0, names: s.teams.names, draft: fromSplit(s.teams, s.teams.guessOnly), fixedNames: true },
        night: null,
      };
    }
  }
  const names = start.kind === 'new' && start.names ? [...start.names] : tonightsNames(store, sessions, Date.now());
  return { step: 'names', names, teams: null, night: null };
}
