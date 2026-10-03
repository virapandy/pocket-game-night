// Every registered game. Adding a game is one import and one line here.
import { tambola } from '../games/tambola';

export const games = [tambola] as const;
export type GameId = (typeof games)[number]['info']['id'];
