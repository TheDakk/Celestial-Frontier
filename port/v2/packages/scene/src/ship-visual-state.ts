/* ShipVisualState — one pure projection shared by travel and ship art.

   `items` and `ascCh` are the already-normalized SaveStateV2 fields. The
   reach ladder remains owned by ascStageOf; this module must not grow a
   second stage selector. Livery identity is injected by the app so this
   projection creates neither a save field nor a dependency on mutable
   presentation facts such as explorer name, nameplate hue, route, or epoch.

   Equipment, affixes, research, chapter progress, and art never grant ship
   capability. Only the exact permanent-system item ids below project visible
   hardpoints. */
import { ASC_CHAPTER_COUNT, ascStageOf } from './charter.js';

export type ShipChassisStage = 0 | 1 | 2 | 3;
export type ShipVisualProvenance = 'owned-items' | 'legacy-charter-refit';
export type ShipInstalledSystemId =
  | 'jumpdrive'
  | 'array'
  | 'igdrive'
  | 'autoext'
  | 'cscoop';

export interface ShipVisualHardpoints {
  readonly array: boolean;
  readonly autoext: boolean;
  readonly cscoop: boolean;
}

export interface ShipVisualState {
  readonly chassisStage: ShipChassisStage;
  readonly hardpoints: ShipVisualHardpoints;
  readonly installedSystemIds: readonly ShipInstalledSystemId[];
  readonly liverySeed: number;
  readonly provenance: ShipVisualProvenance;
}

/** Inputs are normalized before this pure projection is called: persistence
 * owns item/count/chapter sanitation and the app injects one stable livery
 * seed. The mutable tuple type matches SaveStateV2 exactly; this function
 * treats the array as read-only. */
export interface NormalizedShipVisualInput {
  readonly items: Array<[string, number]>;
  readonly ascCh: number;
  readonly liverySeed: number;
}

function owns(items: Array<[string, number]>, id: string): boolean {
  return items.some(([candidate, count]) => candidate === id && count > 0);
}

export function shipVisualStateOf(input: NormalizedShipVisualInput): ShipVisualState {
  const chassisStage = ascStageOf(input.items, input.ascCh);
  const installedSystemIds = Object.freeze(([
    'jumpdrive',
    'array',
    'igdrive',
    'autoext',
    'cscoop',
  ] as const).filter((id) => owns(input.items, id)));
  const installed = new Set(installedSystemIds);
  const igDriveOwned = installed.has('igdrive');
  const hardpoints: ShipVisualHardpoints = Object.freeze({
    array: installed.has('array'),
    autoext: installed.has('autoext'),
    cscoop: installed.has('cscoop'),
  });

  /* Only the terminal legacy chapter fallback can grant reach without its
     corresponding item. Nonterminal chapter numbers and progress never mint
     a chassis stage. Keep the fallback generic: it must not claim a missing
     Intergalactic Drive by name. */
  const provenance: ShipVisualProvenance =
    chassisStage === 3 && input.ascCh >= ASC_CHAPTER_COUNT && !igDriveOwned
      ? 'legacy-charter-refit'
      : 'owned-items';

  return Object.freeze({
    chassisStage,
    hardpoints,
    installedSystemIds,
    liverySeed: input.liverySeed,
    provenance,
  });
}
