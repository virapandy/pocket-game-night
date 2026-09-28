// Phase 0: an empty Tambola screen. Setup, calling and claims arrive in Phase 1a.

export function TambolaScreen({ onExit }: { onExit: () => void }) {
  return (
    <main className="screen">
      <header className="top-bar">
        <button type="button" className="button button-quiet" onClick={onExit}>
          ← Home
        </button>
      </header>
      <section className="centre">
        <h1 className="game-title">Tambola</h1>
        <p className="lead">Coming soon: set up a game with paper tickets, call numbers with rhymes, and check claims.</p>
      </section>
    </main>
  );
}
