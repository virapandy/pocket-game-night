// The end-of-game summary (TAM-078, TAM-088, TAM-089): each prize and who won it, or "not won"; per person
// what they paid, won, got handed back and their net; bogeys; and how many numbers were called. After a
// discard, or with no prize won, every contribution is handed back (TAM-140, TAM-144).
import { useState } from 'react';
import { settleUp } from '../../../engine';
import { PATTERN_NAMES, type Payout, type TambolaView } from '../rules';
import { plural, rupees } from './format';

/** TAM-089 (UX list row 14): the sign stays with the amount, in words: "gets ₹35", "pays ₹12", "even". */
const netWords = (n: number) => (n > 0 ? `gets ${rupees(n)}` : n < 0 ? `pays ${rupees(-n)}` : 'even');

export function Summary({ view }: { view: TambolaView }) {
  const s = view.summary;
  if (!s) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const payouts = s.payouts;
  const discarded = s.result === 'discarded';
  const anyWinner = s.tiers.some((t) => t.winners.length > 0);
  const prizes = payouts ? payouts.reduce((sum, p) => sum + p.won, 0) : 0;
  const back = payouts ? payouts.reduce((sum, p) => sum + p.handedBack, 0) : 0;

  return (
    <section className="summary" data-testid="payout-summary" aria-labelledby="summary-title">
      <h2 id="summary-title" className="step-title">
        {discarded ? 'Game discarded' : payouts ? 'Payouts' : 'Winners'}
      </h2>
      <p className="note">{plural(s.callsMade, 'number')} called.</p>

      {discarded || !anyWinner ? (
        <p className="lead">
          {discarded ? 'Nobody wins this game.' : 'No prize was won.'}
          {payouts ? ' Hand back each contribution:' : ''}
        </p>
      ) : (
        <ul className="summary-tiers">
          {s.tiers.map((t) => (
            <li key={t.pattern}>
              <strong>{PATTERN_NAMES[t.pattern]}</strong>
              {t.label ? <span> ({t.label})</span> : null}
              {': '}
              {t.winners.length === 0
                ? payouts
                  ? `not won, ${rupees(t.amount)} handed back`
                  : 'not won'
                : t.winners.map((w, i) => (
                    <span key={i}>
                      {i > 0 ? ', ' : ''}
                      {name(w.playerId)}
                      {payouts ? ` ${rupees(w.amount)}` : ''}
                    </span>
                  ))}
            </li>
          ))}
        </ul>
      )}

      {payouts && (
        <>
          {/* TAM-181, TAM-199 (owner, 2026-10-01): above the rows, so both are on screen without scrolling. */}
          <Settle payouts={payouts} />
          <ul className="payout-people">
            {payouts.map((p) => (
              <li
                key={p.playerId}
                className="payout-person"
                data-testid="payout-person"
                data-name={p.name}
                data-paid={String(p.paid)}
                data-won={String(p.won)}
                data-net={String(p.net)}
              >
                <span className="payout-name">{p.name}</span>
                <span className="payout-figures">
                  paid {rupees(p.paid)} · won {rupees(p.won)}
                  {p.handedBack > 0 ? ` · handed back ${rupees(p.handedBack)}` : ''} ·{' '}
                  <span className="payout-net">
                    net: <strong>{netWords(p.net)}</strong>
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="lead">
            Pot <strong>{rupees(s.pot ?? 0)}</strong>
            {!discarded && anyWinner ? `: ${rupees(prizes)} in prizes${back > 0 ? ` and ${rupees(back)} handed back, equally per ticket` : ''}.` : '.'}
          </p>
        </>
      )}

      {s.bogeys.length > 0 && (
        <ul className="summary-tiers">
          {s.bogeys.map((b, i) => (
            <li key={i}>
              Bogey: {name(b.playerId)} ({PATTERN_NAMES[b.pattern]})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * TAM-089, TAM-199 (owner, 2026-09-30): two ways to settle this game. "Settle with host": the host, as the bank,
 * hands each person their prize plus money handed back (adding up to the pot). "Settle with players": who pays
 * whom for this game only, in the fewest hand-overs. Money is calculated, never moved (TAM-090).
 */
function Settle({ payouts }: { payouts: readonly Payout[] }) {
  const [shown, setShown] = useState<'host' | 'players' | null>(null);
  const handOvers = shown === 'players' ? settleUp(payouts.map((p) => ({ name: p.name, net: p.net }))) : [];
  return (
    <div className="stack-tight">
      {/* PLT-301, guideline 17a: "Settle with host" has the main look until a tab is opened; an opened tab shows an
          outline, a ✓ and a tint, never the main look. */}
      <div className="row">
        <button
          type="button"
          className={shown === null ? 'button grow' : shown === 'host' ? 'button button-quiet grow pick-on' : 'button button-quiet grow'}
          aria-pressed={shown === 'host'}
          onClick={() => setShown(shown === 'host' ? null : 'host')}
        >
          {shown === 'host' && <span aria-hidden="true">✓ </span>}
          Settle with host
        </button>
        <button
          type="button"
          className={shown === 'players' ? 'button button-quiet grow pick-on' : 'button button-quiet grow'}
          aria-pressed={shown === 'players'}
          onClick={() => setShown(shown === 'players' ? null : 'players')}
        >
          {shown === 'players' && <span aria-hidden="true">✓ </span>}
          Settle with players
        </button>
      </div>
      {shown === 'host' && (
        <div className="stack-tight" data-testid="settle-with-host">
          <p className="note">Everyone paid the host. The host hands out:</p>
          <ul className="settle-lines">
            {payouts.map((p) => (
              <li key={p.playerId} data-testid="host-gives" data-name={p.name} data-amount={String(p.hostGives)}>
                Host gives {p.name} {rupees(p.hostGives)}
              </li>
            ))}
          </ul>
          <p className="note">Hand the money over in person. The app only works it out.</p>
        </div>
      )}
      {shown === 'players' && (
        <div className="stack-tight" data-testid="settle-with-players">
          <p className="note">For this game only, in the fewest hand-overs:</p>
          {handOvers.length === 0 ? (
            <p className="lead">Everyone is even: nothing to hand over.</p>
          ) : (
            <ul className="settle-lines">
              {handOvers.map((h, i) => (
                <li key={i} data-testid="hand-over" data-from={h.from} data-to={h.to} data-amount={String(h.amount)}>
                  {h.from} pays {h.to} {rupees(h.amount)}
                </li>
              ))}
            </ul>
          )}
          <p className="note">Hand the money over in person. The app only works it out.</p>
        </div>
      )}
    </div>
  );
}
