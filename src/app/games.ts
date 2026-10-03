// Every registered game. Adding a game is one import and one line here.
import { impostor } from '../games/impostor';
import { tambola } from '../games/tambola';

/** Games with saved games, History rows and player phones. Impostor joins once its rules and saved evenings are built. */
export const games = [tambola] as const;
export type GameId = (typeof games)[number]['info']['id'];

/** "What shall we play?" (IMP-001): the games a host can start, in this order. */
export const hostGames = [tambola, impostor] as const;
export type HostGameId = (typeof hostGames)[number]['info']['id'];

export { impostor, tambola };
