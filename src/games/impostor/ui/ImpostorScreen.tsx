/**
 * Placeholder until the Impostor screens are built (docs/games/impostor/scenarios.md). Choosing Impostor on
 * "What shall we play?" opens this; the next build replaces it with "Who's playing?" (IMP-003).
 */
export function ImpostorScreen({ onExit }: { onExit: () => void }) {
  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onExit}>
          ← Back
        </button>
      </header>
      <h1 className="step-title">Impostor</h1>
      <p className="lead">Impostor is on its way. It isn't ready to play yet.</p>
    </main>
  );
}
