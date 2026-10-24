// What every room and private screen gets from the room frame (Room.tsx). The screens themselves live in StandIns.tsx
// (stand-ins until the private-screen and day lanes replace them); they draw their body and their one main button.
import type { MafiaMove, MafiaNight, MafiaPlayerView, MafiaView } from '../rules';
import type { ScreenId } from './tonight';

export interface RoomCtx {
  /** The room view (`viewFor(state, 'room')`): all a room screen may show. */
  readonly view: MafiaView;
  /** One player's own view (private screens only). */
  readonly own: (player: string) => MafiaPlayerView;
  readonly screen: ScreenId;
  readonly go: (screen: ScreenId) => void;
  /** Records moves through the rules, saved at once; false (nothing recorded) when the rules refuse one. */
  readonly play: (...moves: MafiaMove[]) => boolean;
  /** The room view, and a player's own view, as they would be after `move` (nothing recorded). */
  readonly peek: (move: MafiaMove) => MafiaView | null;
  readonly peekOwn: (move: MafiaMove, player: string) => MafiaPlayerView | null;
  /** Tonight as History and G1/G2 read it. */
  readonly night: () => MafiaNight | null;
  /** MAF-092: "Back after a break? Everyone can see their role again." is due on this M1 or Y1. */
  readonly breakLine: boolean;
  readonly askEndGame: () => void;
  readonly askEndTonight: () => void;
  readonly askDealAgain: () => void;
  readonly askNobody: () => void;
  readonly seeRoleAgain: () => void;
  readonly home: () => void;
  /** N3's "Read the morning": leaves asked for on N3 apply now (item 11), then the morning (or G1). */
  readonly readMorning: () => void;
  /** Leaving G2: records `endGame` (mid-game) and `endEvening` (MAF-063, PO 27), then Home or the picker. */
  readonly finishTonight: (then: 'home' | 'else') => void;
  /** G2's "Oops, keep playing". */
  readonly backFromSummary: () => void;
  readonly playAgain: () => void;
  readonly changePlayers: () => void;
}
