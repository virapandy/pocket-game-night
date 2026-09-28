// The end-of-game summary (TAM-078, TAM-089): each prize and who won it, what each person paid and
// won, bogeys, and how many numbers were called. After a discard, or with no prize won, it shows the
// contributions to hand back (TAM-140, TAM-144).
import { PATTERN_NAMES, type TambolaView } from '../rules';
import { plural, rupees } from './format';

export function Summary({ view }: { view: TambolaView }) {
  const s = view.summary;
  if (!s) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const money = s.money;
  const anyWinner = s.tiers.some((t) => t.winners.length > 0);
  const refund = s.result === 'discarded' || !anyWinner;
  const totalWon = money ? money.people.reduce((sum, p) => sum + p.won, 0) : 0;

  return (
    <section className="summary" data-testid="payout-summary" aria-labelledby="summary-title">
      <h2 id="summary-title" className="step-title">
        {s.result === 'discarded' ? 'Game discarded' : money ? 'Payouts' : 'Winners'}
      </h2>
      <p className="note">{plural(s.callsMade, 'number')} called.</p>

      {refund ? (
        money ? (
          <>
            <p className="lead">
              {s.result === 'discarded' ? 'Nobody wins this game.' : 'No prize was won.'} Hand back each contribution:
            </p>
            <table className="money-table">
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col">Hand back</th>
                </tr>
              </thead>
              <tbody>
                {money.people.map((p) => (
                  <tr key={p.personId}>
                    <td>{p.name}</td>
                    <td>{rupees(p.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="lead">Nobody wins this game.</p>
        )
      ) : (
        <>
          <ul className="summary-tiers">
            {s.tiers.map((t) => (
              <li key={t.pattern}>
                <strong>{PATTERN_NAMES[t.pattern]}</strong>
                {t.label ? <span> ({t.label})</span> : null}
                {': '}
                {t.winners.length === 0
                  ? money
                    ? 'not won, shared across the prizes that were won'
                    : 'not won'
                  : t.winners.map((w, i) => (
                      <span key={i}>
                        {i > 0 ? ', ' : ''}
                        {name(w.playerId)}
                        {money ? ` ${rupees(w.amount)}` : ''}
                      </span>
                    ))}
              </li>
            ))}
          </ul>
          {money && (
            <>
              <table className="money-table">
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    <th scope="col">Paid</th>
                    <th scope="col">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {money.people.map((p) => (
                    <tr key={p.personId}>
                      <td>{p.name}</td>
                      <td>{rupees(p.paid)}</td>
                      <td>{rupees(p.won)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="lead">
                Total paid out: <strong>{rupees(totalWon)}</strong>, the whole pot.
              </p>
            </>
          )}
        </>
      )}

      {s.bogeys.length > 0 && (
        <p className="note">
          Bogeys: {s.bogeys.map((b) => `${name(b.playerId)} (${PATTERN_NAMES[b.pattern]})`).join(', ')}
        </p>
      )}
    </section>
  );
}
