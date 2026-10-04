// One evening on screen, start to finish: the deal, the clues, talk and the timer, the countdown,
// the picker, the reveal and the round result, the menu with its dialogs and sheets, the privacy cover,
// "Welcome back.", "left halfway", the no-words screen and the summary (IMP-016 to IMP-109).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Preferences, SavedGameStore } from '../../../engine';
import { HOST } from '../../../engine';
import { impostorRules, wordById, type AskedMove, type Choices, type PlayerView } from '../rules';
import { Clues } from './Clues';
import { Turn, type Secret } from './Deal';
import { usePageHidden, useWakeLock } from './device';
import {
  clearUi, endEvening, LEFT_HALFWAY_MS, PREF, record, undoableVerdict, undoVerdict,
  type Evening, type EveningMatch, type UiState,
} from './evening';
import { Dialog, HideMainButton, MainButton, Menu, QuietButton, Toast, useToast, type MenuItem } from './parts';
import { Reveal, type ResultInfo } from './Reveal';
import { HowToPlayChoices } from './Setup';
import { PlayersSheet, RulesSheet, SettingsSheet } from './Sheets';
import { counts, headline, pointsText, scoreRows, storyOf } from './story';
import { Summary } from './Summary';
import { Countdown, FreeTalk, Picker, TimerTalk } from './Talk';

type Overlay = 'rules' | 'settings' | 'players' | 'choices' | 'dealAgain' | 'end' | 'playersMid' | 'whose' | null;
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
  const [banner, setBanner] = useState<Banner>(() => (resumed && step === 'deal' ? { turn: turnKey, kind: 'welcome' } : null));
  const [returns, setReturns] = useState(0);
  /** Screen B of the deal is showing (IMP-010: in landscape its top bar runs y = 0 to 48). */
  const [holdScreen, setHoldScreen] = useState(false);
  const [seeAgain, setSeeAgain] = useState<{ name: string; key: number } | null>(null);
  const [said, setSaid] = useState('');
  const announce = useCallback((text: string) => setSaid(text), []);
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

  const resultShown =
    step === 'result' && (revealLive !== roundKey || revealDone === roundKey || r?.verdict !== null);

  // IMP-087, IMP-100: the screen stays on from a round's first screen A until its result block appears.
  useWakeLock(state.phase === 'round' && !resultShown && !leftHalfway && !summary, roundKey);

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
        onBack={() => setOverlay(null)}
        onStart={() => {
          const noWords = state.phase === 'noWords';
          if (act({ type: 'setChoices', choices: draft })) {
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
    // IMP-011, Test hooks item 1: choices without `lastGuess` (evenings before version 3) read as on.
    const lastGuess = (state.choices as unknown as { lastGuess?: boolean }).lastGuess !== false;
    return { role: view?.role === 'impostor' ? 'impostor' : 'crew', word: wordById(r!.wordId)!, mode: state.choices.mode, lastGuess };
  };
  const tapPref = () => prefs.get<boolean>(PREF.tapToShow, false) === true;
  const midRound = !!r && step !== 'result';
  const betweenRounds = leftHalfway || state.phase === 'noWords' || (step === 'result' && resultShown);

  // IMP-075: the menu at each moment.
  const rules: MenuItem = { label: 'How to play', onSelect: () => setOverlay('rules') };
  const settings: MenuItem = { label: 'Settings', onSelect: () => setOverlay('settings') };
  const end: MenuItem = { label: 'End the evening', onSelect: () => setOverlay('end') };
  const dealAgain: MenuItem = { label: 'Deal again with a new word', onSelect: () => setOverlay('dealAgain') };
  const playersMid: MenuItem = { label: 'Players', onSelect: () => setOverlay('playersMid') };
  let menu: MenuItem[] | null = null;
  if (betweenRounds) {
    menu = [
      rules,
      // The "left halfway" screen keeps the round's limits (docs/test-questions.md, lane E).
      leftHalfway ? playersMid : { label: 'Players', onSelect: () => setOverlay('players') },
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
      end,
    ];
  } else if (step === 'deal') menu = [rules, playersMid, dealAgain, settings, end];
  else if ((step === 'clues' || step === 'talk' || step === 'vote' || step === 'revote') && !counting) {
    menu = [rules, playersMid, { label: 'See my word again', onSelect: () => setOverlay('whose') }, dealAgain, settings, end];
  }
  if (seeAgain) menu = null;

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
        <MainButton
          onClick={() => {
            if (act({ type: 'dealAgain' })) {
              setLeftHalfway(false);
              resetRound();
            }
          }}
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
          <h1 className="imp-room-title">You've played every word in these categories tonight!</h1>
          <p className="imp-body">Turn on more categories or + Grown-ups.</p>
          {canRepeat && <QuietButton onClick={change}>Change categories</QuietButton>}
        </section>
        {canRepeat ? (
          <MainButton onClick={() => act({ type: 'allowRepeats' })}>Allow repeats</MainButton>
        ) : (
          <MainButton onClick={change}>Change categories</MainButton>
        )}
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
        seeAgain
        onDone={() => setSeeAgain(null)}
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
          keep={keepTimer}
          announce={announce}
          prefs={prefs}
        />
      ) : (
        <FreeTalk onVote={onVote} />
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
        headline: headline(r),
        eveningLine: r.points === null && !r.practice ? `Tonight: impostor caught ${c.caught} · escaped ${c.escaped}` : null,
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
        // Timed only until its result shows: drawn again later (back from "Change how we play"), it shows at once.
        live={revealLive === roundKey && !resultShown}
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
        onUndo={() => {
          const cur = evRef.current;
          if (keepEv(undoVerdict(store, cur.saved, cur.match))) clearToast();
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
  const dialog = overlay === 'dealAgain' || overlay === 'end' || overlay === 'playersMid' || overlay === 'whose';
  return (
    <main className={holdScreen ? 'imp-screen imp-room imp-hold-screen' : 'imp-screen imp-room'}>
      <HideMainButton.Provider value={dialog || sheet}>
        <div className="imp-screen-inner" hidden={sheet}>
          <header className="imp-bar">
            {r?.practice && !leftHalfway && (
              <span className="imp-practice" data-testid="practice-chip">
                Practice
              </span>
            )}
            <span className="imp-grow" />
            {menu && <Menu items={menu} />}
          </header>
          {body}
        </div>
        {!sheet && <Toast toast={toast} onDone={clearToast} />}
      </HideMainButton.Provider>
      <div className="imp-sr" data-testid="announcer" aria-live="polite">
        {said}
      </div>

      {overlay === 'rules' && <RulesSheet choices={state.choices} onDone={() => setOverlay(null)} />}
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
          players={state.players}
          past={past}
          keepingScore={state.choices.score}
          onDone={(players) => {
            if (!sameList(players, state.players)) act({ type: 'setPlayers', players });
            setOverlay(null);
          }}
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
        <Dialog text={midRound && !leftHalfway ? "End now? This round won't count." : 'End the evening?'}>
          <QuietButton
            onClick={() => {
              // Nothing is recorded yet: the summary shows, and `endEvening` follows when it is left (IMP-101).
              setOverlay(null);
              if (ui.get<UiState>(id, {}).summaryShownAt === undefined) setUi({ summaryShownAt: Date.now() });
              setTalkRun(null);
              setSeeAgain(null);
              clearToast();
              setSummary(true);
            }}
          >
            {midRound && !leftHalfway ? 'End now' : 'End the evening'}
          </QuietButton>
          <MainButton inline onClick={() => setOverlay(null)}>
            Keep playing
          </MainButton>
        </Dialog>
      )}
      {overlay === 'playersMid' && (
        <Dialog text="Change players after this round.">
          <MainButton inline onClick={() => setOverlay(null)}>
            OK
          </MainButton>
        </Dialog>
      )}
      {overlay === 'whose' && r && (
        <Dialog text="Whose word?">
          {r.players.map((p) => (
            <QuietButton
              key={p}
              onClick={() => {
                setOverlay(null);
                // IMP-027: the timer pauses while a word is seen again (kept, shown paused on return).
                setTalkRun(null);
                setSeeAgain({ name: p, key: 0 });
              }}
            >
              {p}
            </QuietButton>
          ))}
          <QuietButton onClick={() => setOverlay(null)}>Cancel</QuietButton>
        </Dialog>
      )}
      {/* IMP-018: while the page is hidden, a blank cover over everything (the app-switcher picture). */}
      {hidden && <div className="imp-cover" data-testid="privacy-cover" />}
    </main>
  );
}
