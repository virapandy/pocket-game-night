// The end-of-game summary (TAM-078, TAM-088, TAM-089): each prize and who won it, or "not won"; per person
// what they paid, won, got handed back and their net; bogeys; and how many numbers were called. After a
// discard, or with no prize won, every contribution is handed back (TAM-140, TAM-144).
import { PATTERN_NAMES, type TambolaView } from '../rules';
import { plural, rupees } from './format';

const signed = (n: number) => (n > 0 ? `+${rupees(n)}` : n < 0 ? `−${rupees(-n)}` : rupees(0));

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
          <table className="money-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Paid</th>
                {!discarded && anyWinner && <th scope="col">Won</th>}
                <th scope="col">{discarded || !anyWinner ? 'Hand back' : 'Handed back'}</th>
                {!discarded && anyWinner && <th scope="col">Net</th>}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.playerId}>
                  <td>{p.name}</td>
                  <td>{rupees(p.paid)}</td>
                  {!discarded && anyWinner && <td>{rupees(p.won)}</td>}
                  <td>{rupees(p.handedBack)}</td>
                  {!discarded && anyWinner && <td>{signed(p.net)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!discarded && anyWinner && (
            <p className="lead">
              Pot <strong>{rupees(s.pot ?? 0)}</strong>: {rupees(prizes)} in prizes
              {back > 0 ? ` and ${rupees(back)} handed back, equally per ticket` : ''}.
            </p>
          )}
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
