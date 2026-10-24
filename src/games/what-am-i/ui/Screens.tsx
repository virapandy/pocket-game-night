// The game screens inside the frame. Lane W2 leaves simple stand-ins only: lane W3 builds T1, T0, T2, T3 and T4 (the turn),
// lane W4 builds R1, G1 and G2 (between rounds and after). Each gets `StepProps` from the frame (Frame.tsx): the Pause button
// and "··· Menu" (`top`), "Welcome back." (`welcome`), `act` to record a move, `pauseTurn` for T2 and T3, and the dialogs.
import { QuietButton, Screen, ScrollArea } from '../../../blocks';
import type { StepProps } from './Frame';
import { HomeButton, Main, Scoreboard } from './parts';
import { TurnEnd, TurnFlow } from './Turn';

/**
 * T1, T0, T2 and T3 (lane W3, Turn.tsx). The frame shows T1 for a turn not started and the turn's screen once it runs; both
 * are the same component, so a running turn keeps its clock when its first move is recorded.
 */
export const PassScreen = TurnFlow;
export const TurnScreen = TurnFlow;

/** T4 (lane W3, Turn.tsx): Time's up, fixes and Save score. */
export const TurnEndScreen = TurnEnd;

/** R1 (stand-in until lane W4): the scoreboard and the next round. */
export function RoundOverScreen(p: StepProps) {
  const done = p.state.round - 1;
  return (
    <Screen className="wai-game wai-round">
      <header className="wai-bar">
        <HomeButton onClick={p.onHome} />
        {p.top}
      </header>
      {p.welcome}
      <ScrollArea>
        <h1 className="pgn-title">{`Round ${done} done. Round ${done + 1} next.`}</h1>
        <Scoreboard rows={p.view.scoreboard} />
      </ScrollArea>
      <Main guardKey={`${p.state.game}:${p.state.round}:R1`} onClick={() => p.setUi({ roundStarted: p.state.round })}>
        {`Round ${done + 1}`}
      </Main>
    </Screen>
  );
}

/** G1 (stand-in until lane W4). */
export function GameOverScreen(p: StepProps) {
  return (
    <Screen className="wai-game wai-over">
      <header className="wai-bar">
        <QuietButton onClick={p.onHome}>← Home</QuietButton>
        {p.top}
      </header>
      {p.welcome}
      <ScrollArea>
        <h1 className="pgn-title">Game over</h1>
        <Scoreboard rows={p.view.scoreboard} />
      </ScrollArea>
    </Screen>
  );
}

/** G2 (stand-in until lane W4). */
export function SummaryScreen(p: StepProps) {
  return (
    <Screen className="wai-game wai-summary">
      <header className="wai-bar">
        <QuietButton onClick={p.onHome}>← Home</QuietButton>
      </header>
      <h1 className="pgn-title">Tonight's What Am I?</h1>
    </Screen>
  );
}
