// SCREENS: the table of every Mafia screen. The private screens are in Private.tsx (lane M3), the morning, day and
// results in Day.tsx and Results.tsx (lane M4). The frame (Room.tsx) only reads SCREENS.
import type { ReactNode } from 'react';
import type { RoomCtx } from './ctx';
import { M1, V1, V2, V2t, V3, V3s, V4, Y1 } from './Day';
import { PRIVATE_SCREENS } from './Private';
import { G1, G2 } from './Results';
import type { ScreenId } from './tonight';

/** Screen id → its body (and its one main button). The frame draws the top bar, "Welcome back." and the dialogs. */
export const SCREENS: Record<ScreenId, (p: { ctx: RoomCtx }) => ReactNode> = {
  ...PRIVATE_SCREENS, m1: M1, y1: Y1, v1: V1, v2: V2, v2t: V2t, v3: V3, v3s: V3s, v4: V4, g1: G1, g2: G2,
};

export { RoleAgain } from './Private';
