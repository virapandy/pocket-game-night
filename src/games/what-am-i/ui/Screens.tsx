// The game screens inside the frame. Lane W2 leaves simple stand-ins only: lane W3 builds T1, T0, T2, T3 and T4 (the turn),
// lane W4 built R1, G1 and G2 (Results.tsx). Each gets `StepProps` from the frame (Frame.tsx): the Pause button
// and "··· Menu" (`top`), "Welcome back." (`welcome`), `act` to record a move, `pauseTurn` for T2 and T3, and the dialogs.
import { QuietButton, Screen } from '../../../blocks';
import type { StepProps } from './Frame';
import { Main, PauseButton, START_GUARD_MS } from './parts';

/** T1 (stand-in until lane W3): whose turn, "← Home (game saved)", Pause, the menu and the start button. */
export function PassScreen(p: StepProps) {
  const player = p.view.player ?? '';
  const hold = p.view.holds[player] ?? p.state.choices?.hold ?? 'hand';
  return (
    <Screen className="wai-game wai-pass">
      <header className="wai-bar">
        <QuietButton onClick={p.onHome}>← Home (game saved)</QuietButton>
        {p.top}
      </header>
      {p.welcome}
      <h1 className="pgn-title">{`${player}, you're guessing`}</h1>
      <Main guardKey={`${p.state.game}:${p.state.round}:${player}`} wait={START_GUARD_MS} onClick={() => undefined}>
        {hold === 'free' ? `Start ${player}'s turn` : `I'm ${player}: start`}
      </Main>
    </Screen>
  );
}

/** T2 and T3 (stand-in until lane W3): only the Pause button. */
export function TurnScreen(p: StepProps) {
  return (
    <Screen className="wai-game wai-turn">
      <header className="wai-bar wai-bar-end">
        <PauseButton onPause={() => p.pauseTurn(undefined, (p.ui.msLeft ?? (p.state.choices?.time ?? 60) * 1000))} />
      </header>
    </Screen>
  );
}

/** T4 (stand-in until lane W3): the count and "Save score". */
export function TurnEndScreen(p: StepProps) {
  const player = p.view.player ?? '';
  const got = p.view.turn?.got.length ?? 0;
  return (
    <Screen className="wai-game wai-review">
      <header className="wai-bar">
        <QuietButton onClick={p.onHome}>← Home (game saved)</QuietButton>
        {p.top}
      </header>
      {p.welcome}
      <h1 className="pgn-title">{`${p.view.turn?.endedEarly ? 'Turn ended early.' : "Time's up!"} ${player} got ${got}`}</h1>
      <Main guardKey={`${p.state.game}:${p.state.round}:${player}:review`} onClick={() => p.act({ type: 'scoreTurn' })}>
        Save score
      </Main>
    </Screen>
  );
}

// R1, G1 and G2 (lane W4) are in Results.tsx.
export { GameOverScreen, RoundOverScreen, SummaryScreen } from './Results';
