// The game screens inside the frame. Lane W3 built T1, T0, T2, T3 and T4 (the turn, Turn.tsx),
// lane W4 built R1, G1 and G2 (Results.tsx). Each gets `StepProps` from the frame (Frame.tsx): the Pause button
// and "··· Menu" (`top`), "Welcome back." (`welcome`), `act` to record a move, `pauseTurn` for T2 and T3, and the dialogs.
import { TurnEnd, TurnFlow } from './Turn';

/**
 * T1, T0, T2 and T3 (lane W3, Turn.tsx). The frame shows T1 for a turn not started and the turn's screen once it runs; both
 * are the same component, so a running turn keeps its clock when its first move is recorded.
 */
export const PassScreen = TurnFlow;
export const TurnScreen = TurnFlow;

/** T4 (lane W3, Turn.tsx): Time's up, fixes and Save score. */
export const TurnEndScreen = TurnEnd;

// R1, G1 and G2 (lane W4) are in Results.tsx.
export { GameOverScreen, RoundOverScreen, SummaryScreen } from './Results';
