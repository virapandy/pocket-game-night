// One evening on screen, start to finish: the deal, the clues, talk and the timer, the countdown,
// the picker, the reveal and the round result, the menu with its dialogs and sheets, the privacy cover,
// "Welcome back.", "left halfway", the no-words screen and the summary (IMP-016 to IMP-109).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Preferences, SavedGameStore } from '../../../engine';
import { HOST } from '../../../engine';
import { impostorRules, withDealtWord, wordById, type AskedMove, type Choices, type PlayerView } from '../rules';
import { Clues } from './Clues';
import { Turn, type SeeAgainFrom, type Secret } from './Deal';
import { usePageHidden, useWakeLock } from './device';
import {
  clearUi, endEvening, LEFT_HALFWAY_MS, PREF, record, undoableVerdict, undoVerdict,
  type Evening, type EveningMatch, type UiState,
} from './evening';
import { Dialog, HideMainButton, MainButton, Menu, QuietButton, TapGuard, Toast, useToast, type MenuItem } from './parts';
import { EndGameButton, Reveal, useTapGuard, type ResultInfo } from './Reveal';
import { HowToPlayChoices } from './Setup';
import { PlayersSheet, RulesSheet, SettingsSheet, type PlayersMoment } from './Sheets';
import { counts, outcomeLine, pointsText, scoreRows, storyOf } from './story';
import { Summary } from './Summary';
import { Countdown, FreeTalk, Picker, TimerTalk } from './Talk';

type Overlay = 'rules' | 'settings' | 'players' | 'choices' | 'dealAgain' | 'end' | 'whose' | null;
type Banner = { readonly turn: string; readonly kind: 'welcome' | 'noProblem' } | null;

const TIMER_MS = 120_000;

/** IMP-091, IMP-099: reopened more than 3 hours after the round's last move (and no summary showing). */
function leftTooLong(match: EveningMatch, ui: UiState, now: number): boolean {
  const r = match.state.phase === 'round' ? match.state.round : null;
  if (!r || r.step === 'result' || ui.summaryShownAt !== undefined) return false;
  const last = match.records[match.records.length - 1];
  return !!last && now - last.at > LEFT_HALFWAY_MS;
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameChoices = (a: Choices, b: Choices) =>
  a.mode === b.mode &&
  a.talking === b.talking &&
  a.score === b.score &&
  a.words === b.words &&
  a.nonveg === b.nonveg &&
  a.lastGuess === b.lastGuess &&
  sameList(a.categories, b.categories);

export function Game({
  store,
  prefs,
  ui,
  initial,
  resumed,
  past,
  onHome,
  onHistory,
  onSomethingElse,
  onPlayAgain,
  onBackToChoices,
  onSettingsClosed,
}: {
  store: SavedGameStore;
  prefs: Preferences;
  /** `pgn.impostor-ui.<id>` (Test hooks item 13). */
  ui: Preferences;
  initial: { saved: Evening; match: EveningMatch };
  /** Opened from storage (a reload or "Tap to resume"), not just started. */
  resumed: boolean;
  /** Past names for the Players sheet (IMP-003). */
  past: readonly string[];
  onHome: () => void;
  /** History: from the between-rounds menu (with "← Back" to this screen, IMP-075) or from the summary. */
  onHistory: (fromMenu: boolean) => void;
  /** "Play something else" (IMP-102). */
  onSomethingElse: () => void;
  /** "Play again" on the summary (IMP-092, IMP-103): "Who's playing?" with these players, then these choices. */
  onPlayAgain: (players: string[], choices: Choices) => void;
  /** "← Back" on the read-aloud card: the choices again, with the evening kept (IMP-070). */
  onBackToChoices: (saved: Evening) => void;
  onSettingsClosed: () => void;
}) {
  const [ev, setEv] = useState(initial);
  const evRef = useRef(ev);
  evRef.current = ev;
  const { saved, match } = ev;
  const state = match.state;
  const r = state.phase === 'round' ? state.round : null;
  const step = r?.step ?? null;
  const roundKey = state.dealCount;
  const turnKey = r ? `${roundKey}-${r.seen}` : '';
  const id = saved.id;

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [leftHalfway, setLeftHalfway] = useState(() => resumed && leftTooLong(initial.match, ui.get<UiState>(initial.saved.id, {}), Date.now()));
  /** IMP-074: players of the half-played round the host took off on the "left halfway" screen (recorded at "Next round"). */
  const [halfwayOut, setHalfwayOut] = useState<string[]>([]);
  const [banner, setBanner] = useState<Banner>(() => (resumed && step === 'deal' ? { turn: turnKey, kind: 'welcome' } : null));
  const [returns, setReturns] = useState(0);
  /** Screen B of the deal is showing (IMP-010: in landscape its top bar runs y = 0 to 48). */
  const [holdScreen, setHoldScreen] = useState(false);
  const [seeAgain, setSeeAgain] = useState<{ name: string; key: number; from: SeeAgainFrom } | null>(null);
  const [said, setSaid] = useState('');
  const announce = useCallback((text: string) => setSaid(text), []);
  // IMP-083 (I24): a new deal empties the announcer, so the last round's result is not kept into the next deal.
  // Only when the deal counter changes, never on first open (reopening on the clues screen keeps the clue order).
  const lastDeal = useRef(roundKey);
  useEffect(() => {
    if (lastDeal.current === roundKey) return;
    lastDeal.current = roundKey;
    setSaid('');
  }, [roundKey]);
  /** The summary shows (IMP-092, IMP-101); `ended` once `endEvening` is recorded (or the evening deleted) meanwhile. */
  const [summary, setSummary] = useState(() => ui.get<UiState>(initial.saved.id, {}).summaryShownAt !== undefined);
  const [ended, setEnded] = useState(false);
  /** IMP-030: the countdown before the picker; `countKey` starts it again. */
  const [counting, setCounting] = useState(() => step === 'vote' || step === 'revote');
  const [countKey, setCountKey] = useState(0);
  /** The round whose reveal was just tapped (timed); otherwise the reveal shows at once (IMP-091). */
  const [revealLive, setRevealLive] = useState<number | null>(null);
  const [revealDone, setRevealDone] = useState<number | null>(null);
  /** IMP-083: each round's reveal lines already announced, kept while the reveal is drawn again. */
  const heard = useRef(new Map<number, Set<string>>());
  const heardFor = (round: number) => {
    let set = heard.current.get(round);
    if (!set) heard.current.set(round, (set = new Set()));
    return set;
  };
  /** The round whose timer the host just started (it runs; otherwise it shows paused, IMP-027). */
  const [talkRun, setTalkRun] = useState<number | null>(null);
  const [draft, setDraft] = useState<Choices>(state.choices);
  const [toast, showToast, clearToast] = useToast();

  const story = useMemo(() => storyOf(match.setup, match.records), [match]);

  const keepEv = (next: { saved: Evening; match: EveningMatch } | null) => {
    if (!next) return null;
    evRef.current = next;
    setEv(next);
    return next.match;
  };
  const act = (move: AskedMove): EveningMatch | null => {
    const cur = evRef.current;
    return keepEv(record(store, cur.saved, cur.match, move));
  };
  /** Records a move; null when it was recorded, otherwise the rules' reason, to show the host (IMP-078: no dead buttons). */
  const actOrWhy = (move: AskedMove): string | null => {
    if (act(move)) return null;
    const st = evRef.current.match.state;
    const r = impostorRules.apply(st, withDealtWord(st, move), { by: HOST, at: Date.now() });
    return r.ok ? 'That change could not be saved. Try again.' : r.reason;
  };
  const setUi = (patch: Partial<Record<keyof UiState, number | undefined>>) => {
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries({ ...ui.get<UiState>(id, {}), ...patch })) if (typeof v === 'number') next[k] = v;
    ui.set(id, next);
  };
  const keepTimer = useCallback(
    (ms: number) => {
      const cur = ui.get<UiState>(id, {});
      if (cur.timerMs !== ms) ui.set(id, { ...cur, timerMs: ms });
    },
    [ui, id],
  );

  const hidden = usePageHidden(() => {
    // IMP-017: back to that player's screen A. IMP-090: "Welcome back." and the player who hasn't tapped "Done".
    if (seeAgain) setSeeAgain({ ...seeAgain, key: seeAgain.key + 1 });
    else if (step === 'deal' && !leftHalfway) {
      setBanner({ turn: turnKey, kind: 'welcome' });
      setReturns((n) => n + 1);
    }
    // IMP-030: the countdown starts again. IMP-091: a reveal shows at once, as after a reopen.
    if (counting) setCountKey((k) => k + 1);
    if (revealLive !== null) setRevealLive(null);
  });

  // IMP-033, IMP-038, IMP-039: the round's result shows (after the 1.5 s build-up; at once after "Still a tie").
  const resultShown =
    step === 'result' && (r!.stillTie || revealLive !== roundKey || revealDone === roundKey || r!.verdict !== null);
  /** The one result screen (with its build-up and guess steps): it scrolls as one page (guideline 46a). */
  const resultScreen = !leftHalfway && !seeAgain && (step === 'caught' || step === 'guess' || step === 'result');
  /** IMP-077: a between-rounds screen ("Next round", "End game", "← Home"). */
  const betweenRounds = leftHalfway || state.phase === 'noWords' || (step === 'result' && resultShown);
  // IMP-077: the guard starts only at its moments (1.5 s after "Reveal …", at once after "Still a tie" or the verdict,
  // when the "left halfway" or no-words screen shows), not when a round result is merely reopened (resume, History's
  // "← Back"). Once the result has gone (Undo of a verdict, the next round), every later showing is guarded again.
  const guardKey = `${roundKey}|${state.phase}|${leftHalfway}`;
  const reopenedResult = useRef<string | null>(resumed && step === 'result' && !leftHalfway ? guardKey : null);
  if (!betweenRounds) reopenedResult.current = null;
  const guard = useTapGuard(betweenRounds && guardKey !== reopenedResult.current ? guardKey : null);

  // IMP-087, IMP-100: the screen stays on from a round's first screen A until the round's result shows.
  useWakeLock(state.phase === 'round' && !resultShown && !leftHalfway && !summary, roundKey);

  // IMP-078: "Kabir left after this round" (4 s) when the result's lines appear: once per round, not on a reopen.
  const leftToasted = useRef<number | null>(resumed && step === 'result' ? roundKey : null);
  const leftNow = resultShown && r ? r.left : [];
  useEffect(() => {
    if (leftNow.length === 0 || leftToasted.current === roundKey) return;
    leftToasted.current = roundKey;
    showToast(`${leftNow.join(', ')} left after this round`);
    // Once per round's result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftNow.length, roundKey]);

  // IMP-070: no card opens by itself; an evening with no deal yet goes back to its choices.
  useEffect(() => {
    if (state.phase === 'ready') onBackToChoices(saved);
  }, [state.phase, onBackToChoices, saved]);

  // IMP-099, IMP-101: 3 hours after the summary first showed, `endEvening` is recorded by itself.
  useEffect(() => {
    if (!summary) return;
    const shownAt = ui.get<UiState>(id, {}).summaryShownAt;
    if (shownAt === undefined) return;
    const endIt = () => {
      const cur = evRef.current;
      if (!cur.match.state.over) keepEv(endEvening(store, cur.saved, cur.match, Date.now()));
      setEnded(true);
    };
    // The limit is "more than 3 hours": exactly 3 hours still offers "Oops". A timer that fires before the clock has
    // passed the limit checks again rather than ending early.
    let t: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      const wait = shownAt + LEFT_HALFWAY_MS - Date.now();
      if (wait < 0) endIt();
      else t = setTimeout(check, Math.max(wait + 1, 250));
    };
    const wait = shownAt + LEFT_HALFWAY_MS - Date.now();
    if (wait < 0) {
      endIt();
      return;
    }
    t = setTimeout(check, wait + 1);
    return () => clearTimeout(t);
    // Once per showing of the summary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  if (state.phase === 'ready') return null;

  // ---- The summary (IMP-092, IMP-093, IMP-097, IMP-101) ----
  if (summary) {
    const over = ended || state.over;
    const shownAt = ui.get<UiState>(id, {}).summaryShownAt ?? Date.now();
    const leave = (go: () => void) => () => {
      const cur = evRef.current;
      if (!ended && !cur.match.state.over) endEvening(store, cur.saved, cur.match);
      clearUi(ui, id);
      go();
    };
    return (
      <Summary
        state={state}
        story={story}
        canOops={!over && Date.now() - shownAt <= LEFT_HALFWAY_MS}
        onOops={() => {
          setUi({ summaryShownAt: undefined });
          setSummary(false);
        }}
        // IMP-103: the ended game's players; a pending leaver goes when `endEvening` is recorded (IMP-078).
        onPlayAgain={leave(() =>
          onPlayAgain(state.players.filter((p) => !state.leaving.includes(p) && !halfwayOut.includes(p)), state.choices),
        )}
        onHome={leave(onHome)}
        onSomethingElse={leave(onSomethingElse)}
        onHistory={leave(() => onHistory(false))}
        onDiscard={() => {
          store.remove(id);
          clearUi(ui, id);
          onHome();
        }}
      />
    );
  }

  // ---- "Change how we play" / "Change categories" (IMP-006, IMP-052) ----
  if (overlay === 'choices') {
    return (
      <HowToPlayChoices
        choices={draft}
        onChange={setDraft}
        lastGuess={draft.lastGuess}
        onLastGuess={(on) => on !== draft.lastGuess && setDraft({ ...draft, lastGuess: on })}
        onBack={() => {
          // IMP-006 (M21): "← Back" (or the phone's Back) keeps the changes: `setChoices` when something changed,
          // applied from the next round (on the no-words screen the same round is dealt again with them, IMP-052).
          // The screen closes only once the change is recorded (or nothing changed), so no change is lost.
          if (!sameChoices(draft, state.choices)) {
            if (!act({ type: 'setChoices', choices: draft })) return;
            prefs.set(PREF.lastChoices, draft);
            if (state.phase === 'noWords') resetRound();
          }
          setOverlay(null);
        }}
        phoneBack
        onStart={() => {
          const noWords = state.phase === 'noWords';
          const changed = !sameChoices(draft, state.choices);
          if (!changed || act({ type: 'setChoices', choices: draft })) {
            // IMP-009: the last-used choices are saved at every "Start round", changed or not ("Same as last time").
            prefs.set(PREF.lastChoices, draft);
            // Between rounds the next deal follows; on the no-words screen the same round is dealt again by itself.
            if (!noWords) act({ type: 'nextRound' });
            resetRound();
          }
          setOverlay(null);
        }}
      />
    );
  }

  function resetRound() {
    setBanner(null);
    setCounting(false);
    setRevealLive(null);
    setRevealDone(null);
    setTalkRun(null);
    clearToast();
    setUi({ timerMs: undefined });
  }

  const secretFor = (name: string): Secret => {
    const view = impostorRules.view(state, { kind: 'player', playerId: name }) as PlayerView;
    // IMP-011: the rules read choices without `lastGuess` (evenings before version 3) as on.
    return { role: view?.role === 'impostor' ? 'impostor' : 'crew', word: wordById(r!.wordId)!, mode: state.choices.mode, lastGuess: state.choices.lastGuess };
  };
  const tapPref = () => prefs.get<boolean>(PREF.tapToShow, false) === true;

  /** The summary shows at once; nothing is recorded until it is left (IMP-077, IMP-093, IMP-101). */
  const showSummary = () => {
    setOverlay(null);
    if (ui.get<UiState>(id, {}).summaryShownAt === undefined) setUi({ summaryShownAt: Date.now() });
    setTalkRun(null);
    setSeeAgain(null);
    clearToast();
    setSummary(true);
  };

  // IMP-075: the menu at each moment.
  const rules: MenuItem = { label: 'How to play', onSelect: () => setOverlay('rules') };
  const settings: MenuItem = { label: 'Settings', onSelect: () => setOverlay('settings') };
  const end: MenuItem = { label: 'End game', onSelect: () => setOverlay('end') };
  // IMP-075 (M11): mid-round, Home at once with nothing recorded (the game stays unfinished; a running timer is kept
  // paused). "End game" asks "End now?" (IMP-093).
  const home: MenuItem = { label: 'Home (game is saved)', onSelect: onHome };
  const dealAgain: MenuItem = { label: 'Deal again with a new word', onSelect: () => setOverlay('dealAgain') };
  // IMP-074: one Players sheet; mid-round (and on the "left halfway" screen) it is for adding (IMP-078, IMP-079).
  const playersItem: MenuItem = { label: 'Players', onSelect: () => setOverlay('players') };
  let menu: MenuItem[] | null = null;
  if (betweenRounds) {
    menu = [
      rules,
      playersItem,
      ...(leftHalfway
        ? []
        : [
            {
              label: 'Change how we play',
              onSelect: () => {
                setDraft(state.choices);
                setOverlay('choices');
              },
            },
          ]),
      settings,
      { label: 'History', onSelect: () => onHistory(true) },
    ];
  } else if (step === 'deal') menu = [rules, playersItem, dealAgain, settings, home, end];
  else if ((step === 'clues' || step === 'talk' || step === 'vote' || step === 'revote') && !counting) {
    menu = [rules, playersItem, { label: 'See my word again', onSelect: () => setOverlay('whose') }, dealAgain, settings, home, end];
  }
  // IMP-017: no menu from "Whose word?" until the screen it was opened from shows again.
  if (seeAgain || overlay === 'whose') menu = null;

  const startCountdown = () => {
    setCounting(true);
    setCountKey((k) => k + 1);
  };
  const onVote = () => {
    if (act({ type: 'voteNow' })) startCountdown();
  };

  let body: ReactNode;
  if (leftHalfway) {
    body = (
      <>
        <section className="imp-stage imp-center">
          <h1 className="imp-room-title">This round was left halfway. Start a fresh round?</h1>
        </section>
        <EndGameButton onClick={guard(showSummary)} />
        <MainButton
          onClick={guard(() => {
            // IMP-074: each player taken off in the Players sheet is one "Deal again without …" (the last one is the
            // fresh round); with nobody taken off, one `dealAgain`. So k removals use k deals.
            let dealt = false;
            for (const p of halfwayOut) if (act({ type: 'dealAgainWithout', player: p })) dealt = true;
            if (halfwayOut.length === 0) dealt = act({ type: 'dealAgain' }) !== null;
            if (dealt) {
              setHalfwayOut([]);
              setLeftHalfway(false);
              resetRound();
            }
          })}
        >
          Next round
        </MainButton>
      </>
    );
  } else if (state.phase === 'noWords') {
    const canRepeat = impostorRules.legalMoves(state, HOST).some((m) => m.type === 'allowRepeats');
    const change = () => {
      setDraft(state.choices);
      setOverlay('choices');
    };
    body = (
      <>
        <section className="imp-stage imp-center">
          <h1 className="imp-room-title">You've played every word in these categories!</h1>
          <p className="imp-body">Turn on more categories or + Grown-ups.</p>
          {canRepeat && (
            <QuietButton className="imp-allow-repeats" onClick={guard(() => act({ type: 'allowRepeats' }))}>
              Allow repeats
            </QuietButton>
          )}
        </section>
        <EndGameButton onClick={guard(showSummary)} />
        <MainButton onClick={guard(change)}>Change categories</MainButton>
      </>
    );
  } else if (seeAgain && r) {
    body = (
      <Turn
        key={`again-${seeAgain.name}-${seeAgain.key}`}
        name={seeAgain.name}
        next={null}
        progress={null}
        secret={secretFor(seeAgain.name)}
        banner={null}
        tapPref={tapPref}
        onHoldScreen={setHoldScreen}
        seeAgain={seeAgain.from}
        onDone={() => setSeeAgain(null)}
        // IMP-017 (P1): the wrong name: "Whose word?" again, timer still paused; nothing recorded, nothing shown.
        onBack={() => {
          setSeeAgain(null);
          setOverlay('whose');
        }}
      />
    );
  } else if (r && step === 'deal') {
    const name = r.players[r.seen]!;
    body = (
      <Turn
        key={`${turnKey}-${returns}`}
        name={name}
        next={r.players[r.seen + 1] ?? null}
        progress={{ n: r.seen + 1, of: r.players.length }}
        secret={secretFor(name)}
        banner={banner?.turn === turnKey ? banner.kind : null}
        tapPref={tapPref}
        onHoldScreen={setHoldScreen}
        onDone={() => {
          act({ type: 'seen' });
          setBanner(null);
        }}
        onDontKnow={() => {
          const next = act({ type: 'dontKnow' });
          if (next) setBanner({ turn: `${next.state.dealCount}-0`, kind: 'noProblem' });
        }}
      />
    );
  } else if (r && step === 'clues') {
    body = (
      <Clues
        players={r.players}
        starter={r.starter ?? r.players[0]!}
        talking={state.choices.talking}
        secondClues={r.secondClues}
        onSecondClues={() => act({ type: 'anotherRoundOfClues' })}
        onSeeAgain={() => setOverlay('whose')}
        onTalk={() => {
          if (act({ type: 'startTalk' })) {
            setUi({ timerMs: undefined });
            setTalkRun(roundKey);
          }
        }}
        announce={announce}
      />
    );
  } else if (r && step === 'talk') {
    body =
      state.choices.talking === 'timer' ? (
        <TimerTalk
          key={`talk-${roundKey}`}
          initialMs={ui.get<UiState>(id, {}).timerMs ?? TIMER_MS}
          autoStart={talkRun === roundKey}
          onVote={onVote}
          onSeeAgain={() => setOverlay('whose')}
          hold={overlay === 'whose'}
          keep={keepTimer}
          announce={announce}
          prefs={prefs}
        />
      ) : (
        <FreeTalk onVote={onVote} onSeeAgain={() => setOverlay('whose')} />
      );
  } else if (r && (step === 'vote' || step === 'revote')) {
    body = counting ? (
      <Countdown key={`count-${roundKey}-${countKey}`} onDone={() => setCounting(false)} announce={announce} prefs={prefs} />
    ) : (
      <Picker
        key={`pick-${roundKey}-${countKey}`}
        names={step === 'revote' ? (r.tied ?? []) : r.players}
        revote={step === 'revote'}
        onReveal={(player) => {
          if (act({ type: 'reveal', player })) setRevealLive(roundKey);
        }}
        onTie={(players) => {
          if (act({ type: 'tie', players })) startCountdown();
        }}
        onStillTie={() => {
          if (act({ type: 'stillTie' })) setRevealLive(roundKey);
        }}
        onCountAgain={startCountdown}
      />
    );
  } else if (r) {
    // caught, guess or result: the reveal, then the result block.
    let result: ResultInfo | null = null;
    if (step === 'result') {
      const c = counts(story);
      result = {
        outcome: outcomeLine(r),
        eveningLine: r.points === null && !r.practice ? `This game: impostor caught ${c.caught} · escaped ${c.escaped}` : null,
        points: pointsText(r),
        rows: r.points !== null ? scoreRows(state, story) : null,
        scoresFrom: story.firstScored,
        canUndo: undoableVerdict(match) !== null,
        canSkipWord: !r.wordBlocked,
      };
    }
    body = (
      <Reveal
        key={`reveal-${roundKey}`}
        round={r}
        // The build-up only until the result shows: drawn again later (back from "Change how we play"), it shows at
        // once. "Still a tie" has no build-up, but its lines are still said as they appear (IMP-083).
        live={revealLive === roundKey && (r.stillTie || !resultShown)}
        result={result}
        prefs={prefs}
        announce={announce}
        heard={heardFor(roundKey)}
        onShowWord={() => act({ type: 'showWord' }) !== null}
        onVerdict={(right) => act({ type: 'verdict', right })}
        onDone={() => setRevealDone(roundKey)}
        onNext={() => {
          if (act({ type: 'nextRound' })) resetRound();
        }}
        playerCount={state.players.length}
        onPlayers={() => setOverlay('players')}
        onEndGame={showSummary}
        guard={guard}
        onUndo={() => {
          const cur = evRef.current;
          if (keepEv(undoVerdict(store, cur.saved, cur.match))) {
            clearToast();
            // IMP-083: the next verdict's outcome is said again.
            heardFor(roundKey).delete('outcome');
          }
        }}
        onSkipWord={() => {
          const wordId = r.wordId;
          if (!act({ type: 'wordDidntWork', blocked: true })) return;
          // IMP-107: never dealt again on this phone, until "Undo" or "Bring back".
          const list = (prefs.get<unknown>(PREF.blockedWords, []) as unknown[]).filter((x): x is string => typeof x === 'string');
          const added = !list.includes(wordId);
          if (added) prefs.set(PREF.blockedWords, [...list, wordId]);
          showToast(`${wordById(wordId)?.word ?? ''} won't come up again`, () => {
            if (!act({ type: 'wordDidntWork', blocked: false })) return;
            if (added) {
              const now = (prefs.get<unknown>(PREF.blockedWords, []) as unknown[]).filter((x): x is string => typeof x === 'string');
              prefs.set(PREF.blockedWords, now.filter((x) => x !== wordId));
            }
          });
        }}
      />
    );
  }

  const sheet = overlay === 'rules' || overlay === 'settings' || overlay === 'players';
  const dialog = overlay === 'dealAgain' || overlay === 'end' || overlay === 'whose';
  /** Where the Players sheet opens (IMP-074): between rounds, mid-round (adding only), or "left halfway". */
  const playersMoment: PlayersMoment = leftHalfway ? 'halfway' : r && step !== 'result' ? 'mid' : 'between';
  /** IMP-079: players added during this round, in the order added (dealt in by the next deal). */
  const joining = r && step !== 'result' ? state.players.filter((p) => !r.players.includes(p)) : [];
  /** The sheet's list as the rules take it mid-round: this round's players in their seats, then anyone added. */
  const asListed = (list: readonly string[]) =>
    r && playersMoment !== 'between' ? [...r.players, ...list.filter((p) => !r.players.includes(p))] : [...list];
  const showJoining =
    joining.length > 0 && !leftHalfway && !seeAgain && !counting && (step === 'clues' || step === 'talk' || step === 'vote' || step === 'revote');
  const practiceChip = r?.practice && !leftHalfway && (
    <span className="imp-practice" data-testid="practice-chip">
      Practice
    </span>
  );
  return (
    <main
      className={`imp-screen imp-room${holdScreen ? ' imp-hold-screen' : ''}${resultScreen ? ' imp-page' : ''}${betweenRounds ? ' imp-between' : ''}`}
    >
      <HideMainButton.Provider value={dialog || sheet}>
        <div className="imp-screen-inner" hidden={sheet}>
          <header className="imp-bar">
            {/* IMP-071 with IMP-077 (orchestrator's call): between rounds "← Home" first, top left, and the practice
                chip on its own line directly under it, left-aligned, so both stay in the left half at every size. */}
            {betweenRounds ? (
              <div className="imp-bar-stack">
                <QuietButton className="imp-home" onClick={guard(onHome)}>
                  ← Home
                </QuietButton>
                {practiceChip}
              </div>
            ) : (
              practiceChip
            )}
            <span className="imp-grow" />
            {/* IMP-010 (guideline 20): on the deal screens the menu button is guarded like the screen's own buttons. */}
            {menu && step === 'deal' ? (
              <TapGuard screen={`${turnKey}-${returns}-${holdScreen}-${banner?.turn === turnKey ? banner.kind : ''}`}>
                <Menu items={menu} />
              </TapGuard>
            ) : (
              menu && <Menu items={menu} />
            )}
          </header>
          {body}
          {showJoining && (
            <p className="imp-small imp-joining" data-testid="joining-line">
              Joining next round: {joining.join(', ')}
            </p>
          )}
        </div>
        {!sheet && <Toast toast={toast} onDone={clearToast} />}
      </HideMainButton.Provider>
      <div className="imp-sr" data-testid="announcer" aria-live="polite">
        {said}
      </div>

      {/* IMP-010 (P2): "How to play" has the 500 ms tap guard wherever it opens. */}
      {overlay === 'rules' && (
        <TapGuard screen="rules">
          <RulesSheet choices={state.choices} onDone={() => setOverlay(null)} />
        </TapGuard>
      )}
      {overlay === 'settings' && (
        <SettingsSheet
          prefs={prefs}
          onDone={() => {
            setOverlay(null);
            onSettingsClosed();
          }}
        />
      )}
      {overlay === 'players' && (
        <PlayersSheet
          players={state.players.filter((p) => !halfwayOut.includes(p))}
          past={past}
          keepingScore={state.choices.score}
          moment={playersMoment}
          roundPlayers={r?.players ?? []}
          leaving={state.leaving}
          onDone={(players) => {
            // A refused change keeps the sheet open with the reason (IMP-078: never a silent no).
            if (playersMoment === 'between') {
              const why = sameList(players, state.players) ? null : actOrWhy({ type: 'setPlayers', players });
              if (why) return why;
              setOverlay(null);
              return null;
            }
            // Mid-round, names added are recorded at once (IMP-079); the round's players keep their seats.
            const listed = asListed(players);
            const why = sameList(listed, state.players) ? null : actOrWhy({ type: 'setPlayers', players: listed });
            if (why) return why;
            // On the "left halfway" screen ✕ takes a player of the round off (IMP-074); "Next round" records it.
            if (playersMoment === 'halfway' && r) setHalfwayOut(r.players.filter((p) => !players.includes(p)));
            setOverlay(null);
            return null;
          }}
          onLeave={(players, player, how) => {
            // IMP-078: names added in the sheet are recorded first, then the leave.
            const listed = asListed(players);
            const added = sameList(listed, state.players) ? null : actOrWhy({ type: 'setPlayers', players: listed });
            if (added) return added;
            const why = actOrWhy(how === 'finish' ? { type: 'leaveAfterRound', player } : { type: 'dealAgainWithout', player });
            if (why) return why;
            setOverlay(null);
            if (how === 'without') resetRound();
            return null;
          }}
          onEndGame={showSummary}
        />
      )}
      {overlay === 'dealAgain' && (
        <Dialog text="Deal again? This round won't count. For when someone said the word or saw a screen.">
          <QuietButton
            onClick={() => {
              setOverlay(null);
              if (act({ type: 'dealAgain' })) resetRound();
            }}
          >
            Deal again
          </QuietButton>
          <MainButton inline onClick={() => setOverlay(null)}>
            Keep playing
          </MainButton>
        </Dialog>
      )}
      {overlay === 'end' && (
        <Dialog text="End now? This round won't count.">
          {/* Nothing is recorded yet: the summary shows, and `endEvening` follows when it is left (IMP-101). */}
          <QuietButton onClick={showSummary}>End now</QuietButton>
          <MainButton inline onClick={() => setOverlay(null)}>
            Keep playing
          </MainButton>
        </Dialog>
      )}
      {overlay === 'whose' && r && (
        // IMP-081 (P4): the names in a box that scrolls inside (two columns sideways), "Cancel" pinned at the bottom.
        <Dialog text="Whose word?" className="imp-whose">
          <div className="imp-whose-list">
            {r.players.map((p) => (
              <QuietButton
                key={p}
                onClick={() => {
                  setOverlay(null);
                  // IMP-027: the timer pauses while a word is seen again (kept, shown paused on return).
                  setTalkRun(null);
                  setSeeAgain({ name: p, key: 0, from: step === 'clues' ? 'clues' : step === 'talk' ? 'talking' : 'the vote' });
                }}
              >
                {p}
              </QuietButton>
            ))}
          </div>
          <QuietButton onClick={() => setOverlay(null)}>Cancel</QuietButton>
        </Dialog>
      )}
      {/* IMP-018: while the page is hidden, a blank cover over everything (the app-switcher picture). */}
      {hidden && <div className="imp-cover" data-testid="privacy-cover" />}
    </main>
  );
}
