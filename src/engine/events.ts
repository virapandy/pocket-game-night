// The engine announces key moments through one hook. Nothing listens yet; later this feeds
// privacy-respecting measures such as time to first action.

export interface EngineEvent {
  readonly type: 'game-started' | 'first-action' | 'game-ended';
  readonly gameType: string;
  readonly gameId: string;
  readonly at: number;
}

export type Announce = (event: EngineEvent) => void;

export const silent: Announce = () => {};
