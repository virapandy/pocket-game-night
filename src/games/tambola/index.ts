// Tambola's registration: the only file other code may import from this game.
import type { GameInfo } from '../../engine';
import { TambolaScreen } from './ui/TambolaScreen';

export const tambolaInfo: GameInfo = {
  id: 'tambola',
  title: 'Tambola',
  tagline: 'Housie for the whole room. The anchor calls, everyone shouts.',
};

export const tambola = { info: tambolaInfo, Screen: TambolaScreen };
