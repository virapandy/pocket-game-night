// The tap-through prototype (docs/proposals/design-before-code.md, stage 2): draws each screen and dialog of a game's
// screen map with the shared building blocks, and follows the map's "Leads to" on every tap. No rules, nothing saved.
// Address: <base>proto/<game>/ is the index (screens and map problems); <base>proto/<game>/#<screen-id> opens a screen.
import { useEffect, useRef, useState } from 'react';
import { BlocksRoot, Dialog, HideMainButton, MainButton, QuietButton, Screen, ScreenContent, Sheet } from '../blocks';
import type { ProtoMap, ProtoScreen, Tap } from './parse';

interface Note {
  text: string;
  choices: ProtoScreen[];
  missing: string[];
}

const hashId = () => decodeURIComponent(location.hash.slice(1));

export function Proto({ game, map }: { game: string; map: ProtoMap }) {
  const [id, setId] = useState(hashId);
  const [note, setNote] = useState<Note | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Screens opened in this visit, so a "back" row can go back.
  const visited = useRef<string[]>([hashId()]);

  useEffect(() => {
    const onHash = () => {
      const next = hashId();
      const v = visited.current;
      if (v[v.length - 2] === next) v.pop();
      else v.push(next);
      setId(next);
      setNote(null);
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const byId = new Map(map.screens.map((s) => [s.id, s]));
  const screen = byId.get(id);
  const open = (to: string) => {
    location.hash = to;
  };

  const tap = (t: Tap) => {
    setMenuOpen(false);
    const g = t.go;
    if (g.kind === 'go' && g.ids.length === 1 && g.missing.length === 0) return open(g.ids[0] as string);
    if (g.kind === 'back' && visited.current.length > 1) return history.back();
    const text =
      g.kind === 'none'
        ? `Not in the map: "${t.label}" has no "Leads to".`
        : g.kind === 'back'
          ? `Goes back: ${t.to} (no earlier screen in this visit).`
          : g.kind === 'stay'
            ? `Stays on this screen: ${t.to}`
            : `${g.ids.length > 1 ? 'Leads to one of these' : 'Leads to'}: ${t.to}`;
    setNote({ text, choices: g.kind === 'go' ? g.ids.map((i) => byId.get(i) as ProtoScreen) : [], missing: g.kind === 'go' ? g.missing : [] });
  };

  return (
    <>
      <Bar game={game} map={map} screen={screen} />
      {screen ? <Draw key={screen.id} screen={screen} tap={tap} menuOpen={menuOpen} setMenuOpen={setMenuOpen} /> : <Index map={map} id={id} />}
      {note && (
        <div className="proto-note" role="status" data-testid="proto-note">
          <p>{note.text}</p>
          {note.missing.map((m) => (
            <p key={m} className="proto-missing">
              Not in the map: {m}
            </p>
          ))}
          <div className="proto-note-buttons">
            {note.choices.map((c) => (
              <button key={c.id} type="button" onClick={() => open(c.id)}>
                {c.id} {c.title}
              </button>
            ))}
            <button type="button" onClick={() => setNote(null)}>
              Close note
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** The prototype's own bar (never part of a game screen): where you are, and a jump to any screen. */
function Bar({ game, map, screen }: { game: string; map: ProtoMap; screen: ProtoScreen | undefined }) {
  const sections = [...new Set(map.screens.map((s) => s.section))];
  return (
    <nav className="proto-bar" aria-label="Prototype">
      <a href="#">Prototype: {game}</a>
      <span className="proto-where">{screen ? `${screen.id} · ${screen.section}` : 'Index'}</span>
      <select aria-label="Go to screen" value={screen?.id ?? ''} onChange={(e) => (location.hash = e.target.value)}>
        <option value="">Index</option>
        {sections.map((sec) => (
          <optgroup key={sec} label={sec}>
            {map.screens
              .filter((s) => s.section === sec)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} {s.title}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </nav>
  );
}

function Draw({
  screen,
  tap,
  menuOpen,
  setMenuOpen,
}: {
  screen: ProtoScreen;
  tap: (t: Tap) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const main = screen.taps.find((t) => t.main);
  const quiet = screen.taps.filter((t) => !t.main);
  const quietButtons = quiet.map((t, i) => (
    <QuietButton key={i} onClick={() => tap(t)} label={t.label}>
      {t.label}
    </QuietButton>
  ));
  const [first, ...rest] = screen.words;

  if (screen.kind === 'dialog') {
    return (
      <BlocksRoot className="proto">
        <Screen>
          <ScreenContent>
            <p className="proto-under">{screen.title}</p>
          </ScreenContent>
        </Screen>
        <Dialog
          text={
            <>
              {first ?? screen.title}
              {rest.map((w, i) => (
                <span key={i} className="proto-dialog-line">
                  {w}
                </span>
              ))}
            </>
          }
        >
          {quietButtons}
          {main && (
            <MainButton inline onClick={() => tap(main)}>
              {main.label}
            </MainButton>
          )}
        </Dialog>
      </BlocksRoot>
    );
  }

  if (screen.kind === 'sheet') {
    const done = main ?? screen.taps.find((t) => /^done\b/i.test(t.label));
    return (
      <BlocksRoot className="proto">
        <Sheet
          title={first ?? screen.title}
          doneLabel={done?.label ?? 'Done'}
          onDone={() => (done ? tap(done) : history.back())}
        >
          {rest.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
          {screen.taps
            .filter((t) => t !== done)
            .map((t, i) => (
              <QuietButton key={i} onClick={() => tap(t)}>
                {t.label}
              </QuietButton>
            ))}
        </Sheet>
      </BlocksRoot>
    );
  }

  return (
    <BlocksRoot className="proto">
      <HideMainButton.Provider value={menuOpen}>
        <Screen page>
          <ScreenContent hidden={menuOpen}>
            {screen.menu.length > 0 && (
              <div className="proto-top">
                <QuietButton onClick={() => setMenuOpen(true)}>··· Menu</QuietButton>
              </div>
            )}
            {first && <h1 className="pgn-title">{first}</h1>}
            {rest.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            {quietButtons}
          </ScreenContent>
          {main && <MainButton onClick={() => tap(main)}>{main.label}</MainButton>}
        </Screen>
      </HideMainButton.Provider>
      {menuOpen && (
        <Sheet title="Menu" onDone={() => setMenuOpen(false)}>
          {screen.menu.map((t, i) => (
            <QuietButton key={i} onClick={() => tap(t)}>
              {t.label}
            </QuietButton>
          ))}
        </Sheet>
      )}
    </BlocksRoot>
  );
}

/** The start list: every screen by section (host phone, second phone…), and what the map leaves unanswered. */
export function Index({ map, id }: { map: ProtoMap; id: string }) {
  const sections = [...new Set(map.screens.map((s) => s.section))];
  return (
    <main className="proto-index">
      <h1>{map.title}</h1>
      {id && <p className="proto-missing">There is no screen "{id}" in the map.</p>}
      <p>
        A tap-through prototype drawn from the screen map: real words and buttons, no rules behind them. {map.screens.length}{' '}
        screens and dialogs.
      </p>
      {sections.map((sec) => (
        <section key={sec}>
          <h2>{sec}</h2>
          <ul>
            {map.screens
              .filter((s) => s.section === sec)
              .map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    {s.id} {s.title}
                  </a>
                  {s.kind !== 'screen' && <span className="proto-kind"> ({s.kind})</span>}
                </li>
              ))}
          </ul>
        </section>
      ))}
      <section data-testid="proto-problems">
        <h2>Map problems ({map.problems.length})</h2>
        {map.problems.length === 0 ? (
          <p>None: every button leads to a screen in the map.</p>
        ) : (
          <ul>
            {map.problems.map((p, i) => (
              <li key={i}>
                "{p.label}" {p.what}. On: {p.screens.map((s, j) => (
                  <span key={s}>
                    {j > 0 && ', '}
                    <a href={`#${s}`}>{s}</a>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
      {map.noMain.length > 0 && (
        <section>
          <h2>Screens where the map names no main button ({map.noMain.length})</h2>
          <p>
            The map says <code>main "…"</code> nowhere on these, so every button is drawn quiet:{' '}
            {map.noMain.map((s, j) => (
              <span key={s}>
                {j > 0 && ', '}
                <a href={`#${s}`}>{s}</a>
              </span>
            ))}
          </p>
        </section>
      )}
    </main>
  );
}
