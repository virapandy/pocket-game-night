// Tambola's screens: start, how to play, settings, setup, the game, and a past game (read-only).
import { useState } from 'react';
import { startMatch, type Preferences, type SavedGame, type SavedGameStore } from '../../../engine';
import { PATTERN_NAMES, tambolaRules, type TambolaConfig } from '../rules';
import { freshSeed } from './device';
import { HowToPlay } from './HowToPlay';
import { Play } from './Play';
import { loadMatch, newSaved, type TambolaMatch, type TambolaSaved } from './saved';
import { loadSettings, saveSettings, SettingsPanel } from './Settings';
import { draftFromConfig, Setup, type SetupDraft, type SetupStep } from './Setup';
import { Summary } from './Summary';

export interface OpenRequest {
  readonly id: string;
  /** Resume it, or open it asking to end or discard (PLT-004, after 12 hours). */
  readonly action?: 'resume' | 'end' | 'discard';
}

type Route =
  | { name: 'start' }
  | { name: 'how' }
  | { name: 'settings' }
  | { name: 'setup'; initial?: { draft: SetupDraft; step: SetupStep } }
  | { name: 'play'; saved: TambolaSaved; match: TambolaMatch; resumed: boolean; startDialog?: 'end' | 'discard' };

function openRoute(store: SavedGameStore, open: OpenRequest | undefined): Route {
  if (!open) return { name: 'start' };
  const saved = store.get(open.id) as TambolaSaved | undefined;
  const match = saved && loadMatch(saved);
  if (!saved || !match) return { name: 'start' };
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
  open,
}: {
  onExit: () => void;
  store: SavedGameStore;
  prefs: Preferences;
  open?: OpenRequest;
}) {
  const [route, setRoute] = useState<Route>(() => openRoute(store, open));
  const [settings, setSettings] = useState(() => loadSettings(prefs));

  const start = (config: TambolaConfig) => {
    const now = Date.now();
    const id = freshSeed(8);
    const setup = { gameId: id, seeds: { draw: freshSeed(16) }, config };
    const match = startMatch(tambolaRules, setup, now);
    const saved = newSaved(id, setup, now);
    store.put(saved);
    setRoute({ name: 'play', saved, match, resumed: false });
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
            onDone={() => setRoute({ name: 'start' })}
          />
        </main>
      );
    case 'setup':
      return (
        <Setup
          prefs={prefs}
          settings={loadSettings(prefs)}
          {...(route.initial ? { initial: route.initial } : {})}
          onStart={start}
          onCancel={() => setRoute({ name: 'start' })}
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
          onPlayAgain={(finished) => {
            const m = loadMatch(finished);
            const config = m ? { ...finished.setup.config, players: m.state.players } : finished.setup.config;
            setRoute({ name: 'setup', initial: { draft: draftFromConfig(config), step: 'prizes' } });
          }}
        />
      );
    default:
      return (
        <main className="screen">
          <header className="top-bar">
            <button type="button" className="button button-quiet" onClick={onExit}>
              ← Home
            </button>
          </header>
          <section className="centre">
            <h1 className="game-title">Tambola</h1>
            <p className="lead">Housie with paper tickets. This phone draws the numbers with rhymes, keeps the board and checks every claim.</p>
            <button type="button" className="button button-big" onClick={() => setRoute({ name: 'setup' })}>
              New game
            </button>
            <button type="button" className="button button-quiet" onClick={() => setRoute({ name: 'how' })}>
              How to play
            </button>
            <button type="button" className="button button-quiet" onClick={() => setRoute({ name: 'settings' })}>
              Settings
            </button>
          </section>
        </main>
      );
  }
}

/** A past game in History: the summary plus every call and claim, read-only (PLT-008, TAM-143). */
export function TambolaPastGame({ saved, onBack }: { saved: SavedGame; onBack: () => void }) {
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
              <h2 className="section-title">Every claim, in order</h2>
              <ol className="rules-list">
                {view.claims.map((c, i) => (
                  <li key={i}>
                    {name(c.playerId)}, {PATTERN_NAMES[c.pattern]}: {c.verdict === 'accepted' ? '✓ Accepted' : '✗ Bogey'} ({c.numbers.join(' ')})
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
