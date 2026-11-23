import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import type { NavAuthoritySave } from '../src/nav/search-travel';
import type { NavPorts } from '../src/nav/controller';

export const HOME = { seed: 999, x: 90, y: -60 };
export const SOL = { seed: 424242, x: 560, y: 170 };
export const NEW_GAME: NavAuthoritySave = { primeFill: {}, items: [], ascCh: 0 };
export const ownerOf = (...items: string[]): NavAuthoritySave => ({ primeFill: {}, items: items.map((id) => [id, 1]), ascCh: 0 });

export interface NavHarness {
  ports: NavPorts;
  saves: number;
  changed: GameEvents['nav:changed'][];
  refused: GameEvents['nav:refused'][];
}

/** The ports of a nav controller over one save, with everything it sends recorded. */
export function portsFor(save: NavAuthoritySave): NavHarness {
  const bus = createBus<GameEvents>();
  const harness: NavHarness = {
    ports: { authority: () => save, liverySeed: () => 0, bus, requestSave: () => { harness.saves += 1; } },
    saves: 0, changed: [], refused: [],
  };
  bus.on('nav:changed', (event) => harness.changed.push(event));
  bus.on('nav:refused', (event) => harness.refused.push(event));
  return harness;
}
