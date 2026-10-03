// One evening on screen: the read-aloud card, the deal, the clues, the menu and its dialogs and sheets, the privacy
// cover, "Welcome back." and "left halfway" (IMP-070, IMP-010 to IMP-018, IMP-075, IMP-087, IMP-090, IMP-091).
// Talk, timer, vote, reveal, result and the summary are the next build's.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Preferences, SavedGameStore } from '../../../engine';
import { HOST } from '../../../engine';
import { impostorRules, wordById, type ImpostorMove, type PlayerView } from '../rules';
import { Clues } from './Clues';
import { Turn, type Secret } from './Deal';
import { usePageHidden, useWakeLock } from './device';
import {
  endEvening, LEFT_HALFWAY_MS, markCardShown, PREF, record, type Evening, type EveningMatch, type UiState,
} from './evening';
import { Dialog, MainButton, Menu, QuietButton, type MenuItem } from './parts';
import { ReadAloud } from './Setup';
import { RulesSheet, SettingsSheet } from './Sheets';

type Overlay = 'rules' | 'settings' | 'dealAgain' | 'end' | 'playersMid' | 'whose' | null;
type Banner = { readonly turn: string; readonly kind: 'welcome' | 'noProblem' } | null;

/** IMP-091, IMP-099: reopened more than 3 hours after the round's last move (and no summary showing). */
function leftTooLong(match: EveningMatch, ui: UiState, now: number): boolean {
  const r = match.state.phase === 'round' ? match.state.round : null;
  if (!r || r.step === 'result' || ui.summaryShownAt !== undefined) return false;
  const last = match.records[match.records.length - 1];
  return !!last && now - last.at > LEFT_HALFWAY_MS;
}

export function Game({
  store,
  prefs,
  ui,
  initial,
  resumed,
  onHome,
  onHistory,
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
  onHome: () => void;
  onHistory: () => void;
  /** "← Back" on the read-aloud card: the choices again, with the evening kept (IMP-070). */
  onBackToChoices: (saved: Evening) => void;
  onSettingsClosed: () => void;
}) {
  const [ev, setEv] = useState(initial);
  const { saved, match } = ev;
  const state = match.state;
  const r = state.phase === 'round' ? state.round : null;
  const step = r?.step ?? null;
  const turnKey = r ? `${state.dealCount}-${r.seen}` : '';

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [leftHalfway, setLeftHalfway] = useState(() => resumed && leftTooLong(initial.match, ui.get<UiState>(initial.saved.id, {}), Date.now()));
  const [banner, setBanner] = useState<Banner>(() => (resumed && step === 'deal' ? { turn: turnKey, kind: 'welcome' } : null));
  const [returns, setReturns] = useState(0);
  const [seeAgain, setSeeAgain] = useState<{ name: string; key: number } | null>(null);
  const [said, setSaid] = useState('');
  const announce = useCallback((text: string) => setSaid(text), []);

  const act = (move: ImpostorMove): EveningMatch | null => {
    const res = record(store, saved, match, move);
    if (res) setEv(res);
    return res?.match ?? null;
  };

  const hidden = usePageHidden(() => {
    // IMP-017: back to that player's screen A. IMP-090: "Welcome back." and the player who hasn't tapped "Done".
    if (seeAgain) setSeeAgain({ ...seeAgain, key: seeAgain.key + 1 });
    else if (step === 'deal' && !leftHalfway) {
      setBanner({ turn: turnKey, kind: 'welcome' });
      setReturns((n) => n + 1);
    }
  });

  // IMP-087: the screen stays on from a round's first screen A until its result.
  useWakeLock(state.phase === 'round' && step !== 'result' && !leftHalfway, state.dealCount);

  // IMP-070: the card counts as shown for tonight's session once it is on screen.
  useEffect(() => {
    if (state.phase === 'ready') markCardShown(prefs, saved);
  }, [state.phase, prefs, saved]);

  if (state.phase === 'ready') {
    return <ReadAloud onBack={() => onBackToChoices(saved)} onDeal={(practice) => act({ type: 'startDeal', practice })} />;
  }

  const secretFor = (name: string): Secret => {
    const view = impostorRules.view(state, { kind: 'player', playerId: name }) as PlayerView;
    return { role: view?.role === 'impostor' ? 'impostor' : 'crew', word: wordById(r!.wordId)!, mode: state.choices.mode };
  };
  const tapPref = () => prefs.get<boolean>(PREF.tapToShow, false) === true;
  const midRound = !!r && step !== 'result';

  // IMP-075: the menu at each moment.
  const items = (list: readonly (MenuItem | false)[]) => list.filter((x): x is MenuItem => x !== false);
  const rules: MenuItem = { label: 'Rules', onSelect: () => setOverlay('rules') };
  // The Players sheet between rounds (IMP-074) is the next build's; every moment built so far is mid-round.
  const players: MenuItem = { label: 'Players', onSelect: () => setOverlay('playersMid') };
  const settings: MenuItem = { label: 'Settings', onSelect: () => setOverlay('settings') };
  const end: MenuItem = { label: 'End the evening', onSelect: () => setOverlay('end') };
  const dealAgain: MenuItem = { label: 'Deal again with a new word', onSelect: () => setOverlay('dealAgain') };
  let menu: MenuItem[] | null = null;
  if (leftHalfway || state.phase === 'noWords' || step === 'result') {
    menu = items([rules, players, settings, { label: 'History', onSelect: onHistory }, end]);
  } else if (step === 'deal') menu = items([rules, players, dealAgain, settings, end]);
  else if (step === 'clues' || step === 'talk' || step === 'vote' || step === 'revote') {
    menu = items([rules, players, { label: 'See my word again', onSelect: () => setOverlay('whose') }, dealAgain, settings, end]);
  }
  if (seeAgain) menu = null;

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
              setBanner(null);
            }
          }}
        >
          Next round
        </MainButton>
      </>
    );
  } else if (state.phase === 'noWords') {
    const canRepeat = impostorRules.legalMoves(state, HOST).some((m) => m.type === 'allowRepeats');
    body = (
      <>
        <section className="imp-stage imp-center">
          <h1 className="imp-room-title">You've played every word in these categories tonight!</h1>
          <p className="imp-body">Turn on more categories or + Grown-ups.</p>
        </section>
        {canRepeat && <MainButton onClick={() => act({ type: 'allowRepeats' })}>Allow repeats</MainButton>}
      </>
    );
  } else if (seeAgain && r) {
    body = (
      <Turn
        key={`again-${seeAgain.name}-${seeAgain.key}`}
        name={seeAgain.name}
        next={null}
        secret={secretFor(seeAgain.name)}
        banner={null}
        tapPref={tapPref}
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
        secret={secretFor(name)}
        banner={banner?.turn === turnKey ? banner.kind : null}
        tapPref={tapPref}
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
        onTalk={() => act({ type: 'startTalk' })}
        announce={announce}
      />
    );
  } else {
    body = (
      <section className="imp-stage imp-center">
        <p className="imp-body">Talking, the vote and the reveal come in the next build.</p>
      </section>
    );
  }

  const sheet = overlay === 'rules' || overlay === 'settings';
  return (
    <main className="imp-screen imp-room">
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
      <div className="imp-sr" data-testid="announcer" aria-live="polite">
        {said}
      </div>

      {overlay === 'rules' && <RulesSheet mode={state.choices.mode} onDone={() => setOverlay(null)} />}
      {overlay === 'settings' && (
        <SettingsSheet
          prefs={prefs}
          onDone={() => {
            setOverlay(null);
            onSettingsClosed();
          }}
        />
      )}
      {overlay === 'dealAgain' && (
        <Dialog text="Deal again? This round won't count. For when someone said the word or saw a screen.">
          <QuietButton
            onClick={() => {
              setOverlay(null);
              if (act({ type: 'dealAgain' })) setBanner(null);
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
              // The summary (IMP-092, IMP-093, IMP-101) is the next build's: for now the evening ends at once.
              endEvening(store, saved, match);
              onHome();
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
