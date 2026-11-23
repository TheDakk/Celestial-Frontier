import { createBus } from './bus';
import type { GameEvents } from './events';

// The composition root: it creates the bus and wires each system to it. No system's own code lives here.
export const bus = createBus<GameEvents>();
