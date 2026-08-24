/* Fresh Arc 2 carrier -> Arc 3 capability bridge.

   Every call rereads `inventory/arc2.loot`; no cached inventory, loose
   counts, or app-authored bonus object can cross this boundary.  Only a
   current, canonical, editable carrier receives the private loadout brand.
   Older protected migrations and every absent/future/corrupt carrier remain
   explicit fail-closed outcomes. */
import {
  projectEngineeringCapabilities,
  type Arc2EngineeringLoadout,
  type EngineeringCapabilitySnapshot,
} from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import { readArc2Loot } from './arc2-loot.js';
import type { V5Extensions } from './migration-v5.js';

export type Arc2EngineeringLoadoutReadOutcome =
  | Readonly<{
    kind: 'loaded';
    loadout: Arc2EngineeringLoadout;
    capabilities: EngineeringCapabilitySnapshot;
  }>
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'future-version'; version: number }>
  | Readonly<{ kind: 'corrupt' }>
  | Readonly<{ kind: 'legacy-protected'; reason: 'capacity' | 'extension-bytes' }>;

/** Freshly decode one V5Extensions snapshot and issue the only registered
 * loadout/capability pair suitable for Arc 3 planning. */
export function readArc2EngineeringLoadout(
  extensions: V5Extensions,
): Arc2EngineeringLoadoutReadOutcome {
  const read = readArc2Loot(extensions);
  if (read.kind !== 'loaded') return read;
  if (read.state.kind === 'legacy-protected') {
    return Object.freeze({ kind: 'legacy-protected', reason: read.state.reason });
  }
  const loadout = registerArc2EngineeringLoadout(
    read.state.inventory,
    read.state.stackableCounts,
  );
  return Object.freeze({
    kind: 'loaded',
    loadout,
    capabilities: projectEngineeringCapabilities(loadout),
  });
}
