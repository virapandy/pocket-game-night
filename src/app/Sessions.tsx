// Sessions, the tally and settling up (PLT-016 to PLT-023, PLT-026 to PLT-028), for every game with money.
// The tally reads only each game's money record. Money is calculated, never moved (TAM-090): text only.
import { useEffect, useState, type ReactNode } from 'react';
import { settleUp, tallySession, type SavedGame, type Session, type Settlement, type TallyGame, type TallyPerson } from '../engine';
import { games } from './games';
import { freshId, gameStore, sessionStore } from './storage';

const UNDO_MS = 5_000;

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const signed = (n: number) => (n > 0 ? `+${rupees(n)}` : n < 0 ? `−${rupees(-n)}` : rupees(0));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const when = (t: number) =>
  new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

const gameOf = (type: string) => games.find((g) => g.info.id === type);

export function asTallyGame(g: SavedGame): TallyGame {
  return { id: g.id, sessionId: g.sessionId ?? '', status: g.status, settled: !!g.settlementId, money: g.money ?? null, gameType: g.gameType };
}

export function sessionGames(sessionId: string): SavedGame[] {
  return gameStore
    .list()
    .filter((g) => g.sessionId === sessionId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function sessionTally(sessionId: string) {
  return tallySession(sessionId, sessionGames(sessionId).map(asTallyGame));
}

/** "Settled", "Not settled", or nothing to settle yet (PLT-022). */
function tallyWord(s: Session): string {
  if (sessionTally(s.id).people.length > 0) return 'Not settled';
  return s.settlements.length > 0 ? 'Settled' : 'Nothing to settle';
}

/** PLT-022: every session, newest first, with its games and whether its tally is settled. */
export function SessionList({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const [sessions] = useState(() => sessionStore.list().sort((a, b) => b.createdAt - a.createdAt));
  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Home
        </button>
      </header>
      <h1 className="step-title">Sessions</h1>
      <p className="note">Each gathering is a session. Its tally adds up the money of its finished games.</p>
      {sessions.length === 0 ? (
        <p className="lead">No sessions yet. The first game you start begins one.</p>
      ) : (
        <ul className="history-list">
          {sessions.map((s) => {
            const n = sessionGames(s.id).length;
            return (
              <li key={s.id}>
                <button type="button" className="history-row" data-testid="session" onClick={() => onOpen(s.id)}>
                  <span className="history-title">{s.name}</span>
                  <span>{plural(n, 'game')}</span>
                  <span className="history-result">{tallyWord(s)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

/** PLT-017: one compact row per person, with the name and the balance; a tap shows the details. */
function PersonRow({ p, onOpen }: { p: TallyPerson; onOpen: (p: TallyPerson) => void }) {
  return (
    <li
      className="tally-person"
      data-testid="tally-person"
      data-name={p.name}
      data-paid={String(p.paid)}
      data-got-back={String(p.gotBack)}
      data-net={String(p.net)}
    >
      <button type="button" className="tally-row" onClick={() => onOpen(p)}>
        <span className="tally-name">{p.name}</span>
        <span className="tally-balance">{p.net === 0 ? 'Even' : signed(p.net)}</span>
      </button>
    </li>
  );
}

function People({ people, testId }: { people: readonly TallyPerson[]; testId: string }) {
  const [open, setOpen] = useState<TallyPerson | null>(null);
  return (
    <>
      <ul className="tally-list tally-compact" data-testid={testId}>
        {people.map((p) => (
          <PersonRow key={p.name} p={p} onOpen={setOpen} />
        ))}
      </ul>
      {open && (
        <Dialog>
          <div className="stack-tight" data-testid="tally-person-detail">
            <h2 className="section-title">{open.name}</h2>
            <ul className="detail-list">
              <li>Paid {rupees(open.paid)}</li>
              {open.prizes !== undefined && <li>Won {rupees(open.prizes)}</li>}
              <li>Got back {rupees(open.gotBack)}</li>
              <li>
                <strong>{open.net === 0 ? 'Even' : open.net > 0 ? `Up ${rupees(open.net)}` : `Down ${rupees(-open.net)}`}</strong>
              </li>
            </ul>
            <p className="note">Got back is prizes won plus money handed back from prizes nobody won.</p>
          </div>
          <button type="button" className="button" onClick={() => setOpen(null)}>
            Close
          </button>
        </Dialog>
      )}
    </>
  );
}

/** One session: its games, its unsettled tally, "Settle up", "Mark as settled", and past settles (PLT-017 to PLT-028). */
export function SessionScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const [session, setSession] = useState(() => sessionStore.get(id));
  const [, setVersion] = useState(0);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [justSettled, setJustSettled] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!justSettled) return;
    const t = setTimeout(() => setJustSettled(null), UNDO_MS);
    return () => clearTimeout(t);
  }, [justSettled]);

  if (!session) {
    return (
      <main className="screen">
        <header className="top-bar">
          <button type="button" className="button button-quiet" onClick={onBack}>
            ← Sessions
          </button>
        </header>
        <p className="lead">This session could not be found.</p>
      </main>
    );
  }

  const list = sessionGames(session.id);
  const tally = tallySession(session.id, list.map(asTallyGame));
  const handOvers = settleUp(tally.people);
  const save = (next: Session) => {
    sessionStore.put(next);
    setSession(next);
  };
  const refresh = () => setVersion((v) => v + 1);

  const markSettled = () => {
    const settlement: Settlement = { id: freshId(), at: Date.now(), gameIds: tally.gameIds, people: tally.people, handOvers };
    for (const g of list) if (tally.gameIds.includes(g.id)) gameStore.put({ ...g, settlementId: settlement.id });
    save({ ...session, settlements: [...session.settlements, settlement] });
    setConfirm(false);
    setJustSettled(settlement.id);
    refresh();
  };
  const undoSettle = (settlementId: string) => {
    for (const g of gameStore.list()) {
      if (g.settlementId === settlementId) {
        const { settlementId: _gone, ...rest } = g;
        gameStore.put(rest);
      }
    }
    save({ ...session, settlements: session.settlements.filter((s) => s.id !== settlementId) });
    setJustSettled(null);
    refresh();
  };
  const opened = session.settlements.find((s) => s.id === open);

  const canSettle = tally.people.length > 0;
  return (
    // TAM-181: the session scrolls; "Settle up" and "Mark as settled" stay fixed at the bottom.
    <main className="screen setup-screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onBack}>
          ← Sessions
        </button>
      </header>
      <div className="setup-body stack">
      {renaming === null ? (
        <div className="row">
          <h1 className="step-title grow">{session.name}</h1>
          <button type="button" className="button button-quiet" onClick={() => setRenaming(session.name)}>
            Rename…
          </button>
        </div>
      ) : (
        <div className="stack-tight">
          <label className="field">
            <span>Session name</span>
            <input type="text" maxLength={40} value={renaming} onChange={(e) => setRenaming(e.target.value)} />
          </label>
          <div className="row">
            <button
              type="button"
              className="button"
              disabled={renaming.trim() === ''}
              onClick={() => {
                save({ ...session, name: renaming.trim() });
                setRenaming(null);
              }}
            >
              Save
            </button>
            <button type="button" className="button button-quiet" onClick={() => setRenaming(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="stack-tight" aria-labelledby="games-title">
        <h2 id="games-title" className="section-title">
          Games
        </h2>
        {list.length === 0 ? (
          <p className="note">No games in this session.</p>
        ) : (
          <ul className="history-list">
            {list.map((g) => (
              <li key={g.id} className="session-game" data-testid="session-game">
                <GameLine g={g} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack-tight" aria-labelledby="tally-title">
        <h2 id="tally-title" className="section-title">
          Tally
        </h2>
        {tally.people.length === 0 ? (
          <p className="note">Nothing to settle: the tally adds up finished games with money that are not settled yet.</p>
        ) : (
          <p className="note">
            {plural(tally.gameIds.length, 'finished game')} · {rupees(tally.paidIn)} paid in, {rupees(tally.paidOut)} paid out.
          </p>
        )}
        <People people={tally.people} testId="tally" />
        {justSettled && (
          <div className="banner" role="status">
            <p>Settled.</p>
            <button type="button" className="button button-quiet" onClick={() => undoSettle(justSettled)}>
              Undo
            </button>
          </div>
        )}
        {canSettle && showSettle && (
          <>
            <div className="stack-tight" data-testid="settle-up">
              <h3 className="section-title">Who pays whom</h3>
              {handOvers.length === 0 ? (
                <p className="lead">Everyone is even: nothing to hand over.</p>
              ) : (
                <ul className="tally-list">
                  {handOvers.map((h, i) => (
                    <li key={i} className="hand-over" data-testid="hand-over" data-from={h.from} data-to={h.to} data-amount={String(h.amount)}>
                      {h.from} pays {h.to} {rupees(h.amount)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="note">Hand the money over in person. The app only works it out.</p>
            </div>
          </>
        )}
      </section>

      {session.settlements.length > 0 && (
        <section className="stack-tight" aria-labelledby="settles-title">
          <h2 id="settles-title" className="section-title">
            Settled
          </h2>
          <ul className="history-list">
            {[...session.settlements].reverse().map((s) => (
              <li key={s.id}>
                <button type="button" className="history-row" data-testid="settlement" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <span className="history-title">{when(s.at)}</span>
                  <span>{plural(s.gameIds.length, 'game')} settled</span>
                </button>
              </li>
            ))}
          </ul>
          {opened && (
            <div className="stack-tight settlement-detail" data-testid="settlement-detail">
              <h3 className="section-title">Settled on {when(opened.at)}</h3>
              <People people={opened.people} testId="settled-people" />
              {opened.handOvers.length > 0 && (
                <ul className="tally-list">
                  {opened.handOvers.map((h, i) => (
                    <li key={i}>
                      {h.from} pays {h.to} {rupees(h.amount)}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="button button-quiet" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          )}
        </section>
      )}

      </div>
      {canSettle && (
        <div className="bottom-action">
          {showSettle ? (
            <button type="button" className="button button-big" onClick={() => setConfirm(true)}>
              Mark as settled
            </button>
          ) : (
            <button type="button" className="button button-big" onClick={() => setShowSettle(true)}>
              Settle up
            </button>
          )}
        </div>
      )}

      {confirm && (
        <Dialog>
          <p className="lead">
            Mark {plural(tally.gameIds.length, 'game')} as settled? Do this after the money has changed hands.
          </p>
          <div className="row">
            <button type="button" className="button" onClick={markSettled}>
              Mark as settled
            </button>
            <button type="button" className="button button-quiet" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}

function GameLine({ g }: { g: SavedGame }) {
  const game = gameOf(g.gameType);
  const d = game?.describe(g);
  const status = g.status === 'ended' ? (g.settlementId ? 'Settled' : g.money ? 'In the tally' : 'No money') : g.status === 'abandoned' ? 'Abandoned' : g.status === 'paused' ? 'Paused' : 'In progress';
  return (
    <div className="history-row">
      <span className="history-title">
        {game?.info.title ?? g.gameType}, {new Date(g.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
      </span>
      {d && <span>{d.result}</span>}
      <span className="history-result">{status}</span>
    </div>
  );
}

export function Dialog({ children }: { children: ReactNode }) {
  return (
    <div className="backdrop">
      <div className="dialog" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
