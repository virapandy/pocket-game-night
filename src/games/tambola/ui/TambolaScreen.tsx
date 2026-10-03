// Tambola's screens: start, how to play, settings, setup, the game, and a past game (read-only).
import { useState, type ReactNode } from 'react';
import {
  startMatch,
  type Preferences,
  type ReportSubject,
  type SavedGame,
  type SavedGameStore,
  type Session,
  type SessionPicker,
} from '../../../engine';
import { PATTERN_NAMES, tambolaRules, type TambolaConfig } from '../rules';
import { freshSeed } from './device';
import { HowToPlay } from './HowToPlay';
import { Play } from './Play';
import { loadMatch, newSaved, type TambolaMatch, type TambolaSaved } from './saved';
import { loadSettings, saveSettings, SettingsPanel } from './Settings';
import { clearDraft, draftFromConfig, loadDraft, saveDraft, Setup, type SetupDraft, type SetupStep } from './Setup';
import { SessionLine, SessionQuestionScreen, suggestedSessionName, type SessionChoice } from './SessionQuestion';
import { Summary } from './Summary';
import { isDark, setDark } from './theme';

export interface OpenRequest {
  readonly id: string;
  /**
   * Resume it, or open it asking to end or discard (PLT-004, after 12 hours), or start a new game with a
   * past game's setup ("Use this setup", PLT-009).
   */
  readonly action?: 'resume' | 'end' | 'discard' | 'reuse';
}

type Route =
  | { name: 'start' }
  | { name: 'how' }
  | { name: 'settings' }
  | { name: 'setup'; initial?: { draft: SetupDraft; step: SetupStep } }
  | { name: 'session'; config: TambolaConfig; ask: 'name' | { continue: Session } }
  | { name: 'play'; saved: TambolaSaved; match: TambolaMatch; resumed: boolean; startDialog?: 'end' | 'discard' };

/** The setup of a played game, with any renames and late joiners (TAM-068, PLT-009, PLT-020). */
function configToReuse(saved: TambolaSaved, match: TambolaMatch | null): TambolaConfig {
  return match ? { ...saved.setup.config, players: match.state.players, tiers: match.state.tiers } : saved.setup.config;
}

function openRoute(store: SavedGameStore, open: OpenRequest | undefined): Route {
  if (!open) return { name: 'start' };
  const saved = store.get(open.id) as TambolaSaved | undefined;
  const match = saved && loadMatch(saved);
  if (!saved || !match) return { name: 'start' };
  if (open.action === 'reuse') return { name: 'setup', initial: { draft: draftFromConfig(configToReuse(saved, match)), step: 'prizes' } };
  let current = saved;
  if (!match.state.result && saved.status !== 'in-progress') {
    current = { ...saved, status: 'in-progress' };
    store.put(current);
  }
  const route: Route = { name: 'play', saved: current, match, resumed: !match.state.result };
  return open.action === 'end' || open.action === 'discard' ? { ...route, startDialog: open.action } : route;
}

export function TambolaScreen({
  onExit,
  store,
  prefs,
  sessions,
  open,
  onSession,
  onReport,
  settingsExtra,
  startAt,
}: {
  onExit: () => void;
  /** PLT-300: Home's menu opens Tambola's settings directly; "Done" then goes back to Home. */
  startAt?: 'settings';
  /** Phase 7: "Report a problem" on the calling screen and the payouts (PLT-200). */
  onReport?: (subject: ReportSubject) => void;
  /** Phase 7: the app's "Reports waiting to send", shown in Settings (PLT-209). */
  settingsExtra?: ReactNode;
  /** Opens a session's screen (TAM-197). */
  onSession?: (sessionId: string) => void;
  store: SavedGameStore;
  prefs: Preferences;
  sessions: SessionPicker;
  open?: OpenRequest;
}) {
  const [route, setRoute] = useState<Route>(() => (startAt === 'settings' && !open ? { name: 'settings' } : openRoute(store, open)));
  const [settings, setSettings] = useState(() => loadSettings(prefs));
  const [dark, setDarkState] = useState(() => isDark(prefs));
  /** PLT-029: the session the host picked with "Change"; null means the one suggested. */
  const [choice, setChoice] = useState<SessionChoice | null>(null);
  const suggested = (now: number): SessionChoice => {
    const q = sessions.question(now);
    return q.kind === 'join' ? { kind: 'existing', session: q.session } : { kind: 'new', name: suggestedSessionName(now), chosen: false };
  };
  const toSetup = (r: Extract<Route, { name: 'setup' }>) => {
    setChoice(null);
    setRoute(r);
  };

  const begin = (config: TambolaConfig, session: Session) => {
    const now = Date.now();
    const id = freshSeed(8);
    // Phone tickets (Phase 2) get their own secret seed for the sheets of tickets (TAM-008, TAM-052).
    const seeds: Record<string, string> = config.ticketMode === 'phone' ? { draw: freshSeed(16), sheet: freshSeed(16) } : { draw: freshSeed(16) };
    const setup = { gameId: id, seeds, config };
    const match = startMatch(tambolaRules, setup, now);
    const saved: TambolaSaved = { ...newSaved(id, setup, now), sessionId: session.id };
    store.put(saved);
    setRoute({ name: 'play', saved, match, resumed: false });
  };
  /** Prizes confirmed: the setup is no longer "unfinished" (PLT-006); then, only long after the last game, the session question (PLT-016). */
  const start = (config: TambolaConfig) => {
    clearDraft(prefs);
    const now = Date.now();
    // PLT-029: the session shown on the line, as picked or named with "Change".
    if (choice?.kind === 'existing') return begin(config, choice.session);
    if (choice?.kind === 'new' && choice.chosen) return begin(config, sessions.create(choice.name, now));
    const q = sessions.question(now);
    if (q.kind === 'join') begin(config, q.session);
    // UX list row 9 (PLT-016, PLT-029): the very first game has no naming screen; the line already showed the
    // new session's suggested name, so the game starts in it.
    else if (q.kind === 'name') begin(config, sessions.create(choice?.kind === 'new' ? choice.name : suggestedSessionName(now), now));
    else setRoute({ name: 'session', config, ask: { continue: q.session } });
  };

  switch (route.name) {
    case 'how':
      return <HowToPlay onBack={() => setRoute({ name: 'start' })} />;
    case 'settings':
      return (
        <main className="screen">
          <SettingsPanel
            settings={settings}
            inGame={false}
            onChange={(next) => {
              setSettings(next);
              saveSettings(prefs, next);
            }}
            dark={dark}
            onDark={(on) => {
              setDark(prefs, on);
              setDarkState(on);
            }}
            onDone={() => (startAt === 'settings' ? onExit() : setRoute({ name: 'start' }))}
          >
            {settingsExtra}
          </SettingsPanel>
        </main>
      );
    case 'setup':
      return (
        <Setup
          prefs={prefs}
          settings={loadSettings(prefs)}
          {...(route.initial ? { initial: route.initial } : {})}
          onDraft={(draft) => saveDraft(prefs, draft)}
          onStart={start}
          onCancel={() => setRoute({ name: 'start' })}
          sessionLine={<SessionLine choice={choice ?? suggested(Date.now())} recent={() => sessions.recent(Date.now(), 3)} onChange={setChoice} />}
        />
      );
    case 'session':
      return (
        <SessionQuestionScreen
          ask={route.ask}
          onStart={(name) => begin(route.config, sessions.create(name, Date.now()))}
          onContinue={(session) => begin(route.config, session)}
          onBack={() => setRoute({ name: 'setup', initial: { draft: draftFromConfig(route.config), step: 'prizes' } })}
        />
      );
    case 'play':
      return (
        <Play
          key={route.saved.id}
          initialSaved={route.saved}
          initialMatch={route.match}
          store={store}
          prefs={prefs}
          resumed={route.resumed}
          {...(route.startDialog ? { startDialog: route.startDialog } : {})}
          onHome={() => {
            const s = store.get(route.saved.id);
            if (s && s.status === 'in-progress') store.put({ ...s, status: 'paused', updatedAt: Date.now() });
            onExit();
          }}
          {...(onSession ? { onSessionTally: onSession } : {})}
          {...(onReport ? { onReport } : {})}
          onPlayAgain={(finished) => {
            const config = configToReuse(finished, loadMatch(finished));
            toSetup({ name: 'setup', initial: { draft: draftFromConfig(config), step: 'prizes' } });
          }}
        />
      );
    default:
      return (
        <main className="screen start-screen">
          <header className="top-bar">
            <button type="button" className="button button-quiet" onClick={onExit}>
              ← Home
            </button>
          </header>
          <section className="centre">
            <h1 className="game-title">Tambola</h1>
            <p className="lead">Housie on paper or on phones. This phone draws the numbers with rhymes, keeps the board, records every win and works out the payouts.</p>
            <button type="button" className="button button-quiet" onClick={() => setRoute({ name: 'how' })}>
              How to play
            </button>
            <button type="button" className="button button-quiet" onClick={() => setRoute({ name: 'settings' })}>
              Settings
            </button>
          </section>
          {/* TAM-181 (UX list row 15): "New game" at the bottom, like every step. */}
          <div className="bottom-action">
            <button
              type="button"
              className="button button-big"
              onClick={() => {
                // PLT-006: a setup left unconfirmed comes back, ready to change or confirm.
                const draft = loadDraft(prefs);
                toSetup(draft ? { name: 'setup', initial: { draft, step: 'mode' } } : { name: 'setup' });
              }}
            >
              New game
            </button>
          </div>
        </main>
      );
  }
}

/** A past game in History: the summary plus every call and claim, read-only (PLT-008, TAM-143). */
export function TambolaPastGame({ saved, onBack, actions }: { saved: SavedGame; onBack: () => void; actions?: ReactNode }) {
  const match = loadMatch(saved);
  const view = match && tambolaRules.view(match.state, { kind: 'host' });
  const name = (id: string) => view?.players.find((p) => p.id === id)?.name ?? id;
  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Back
        </button>
      </header>
      <h1 className="step-title">Tambola</h1>
      <p className="note">
        {new Date(saved.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
      {actions}
      {!view ? (
        <p className="lead">This game could not be opened.</p>
      ) : (
        <>
          <Summary view={view} />
          <section aria-label="Every call">
            <h2 className="section-title">Every call, in order</h2>
            <ol className="call-list" data-testid="call-list">
              {view.called.map((n, i) => (
                <li key={n} data-number={n}>
                  <span className="note">{i + 1}.</span> {n}
                </li>
              ))}
            </ol>
          </section>
          {view.claims.length > 0 && (
            <section aria-label="Every claim">
              <h2 className="section-title">Every win and bogey, in order</h2>
              <ol className="rules-list">
                {view.claims.map((c, i) => (
                  <li key={i}>
                    {name(c.playerId)}, {PATTERN_NAMES[c.pattern]}: {c.verdict === 'accepted' ? '✓ Won' : '✗ Bogey'}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </main>
  );
}
