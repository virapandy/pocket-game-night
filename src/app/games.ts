// Every registered game. Adding a game is one import and one line here.
import { impostor } from '../games/impostor';
import { tambola } from '../games/tambola';

/** Games with saved games, History rows and reports (IMP-096: Impostor's evenings are saved games too). */
export const games = [tambola, impostor] as const;
export type GameId = (typeof games)[number]['info']['id'];

/** Games with tickets on players' phones (Phase 2). Impostor is all on the host's phone (IMP-002). */
export const phoneGames = [tambola] as const;
export type PhoneGameId = (typeof phoneGames)[number]['info']['id'];

/** "What shall we play?" (IMP-001): the games a host can start, in this order. */
export const hostGames = [tambola, impostor] as const;
export type HostGameId = (typeof hostGames)[number]['info']['id'];

export { impostor, tambola };
