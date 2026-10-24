// One Jev budget for every screen-simulation file in a worker, so the Impostor and Secret Words evenings together stay inside
// JEV_DECISIONS per worker (the weekly cap's share, set by the workflow) and the weekly cap (tests/sim/jev.ts).
import { makeBudget, jevForRun, USAGE_FILE } from '../sim/jev';

export const shared = jevForRun({ budget: makeBudget({ file: USAGE_FILE, runLimit: Number(process.env.JEV_DECISIONS ?? 400) }) });
