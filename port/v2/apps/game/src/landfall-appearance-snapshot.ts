/* Read-only appearance inputs, not a save, ownership grant or generated image.
 * The first adapter supports only the exact canonical Earth epoch-0 recipe.
 * TIME_AND_SHARING.md owns the wider proposal; seasons and arbitrary worlds
 * are deliberately not inferred from this snapshot. */
import { snapshotEarthLayerDataV1, type EarthResidentLayerPlanV1 } from '@cf/art/earth-resident-plan';
import { buildEarthLayeredRecipeV1 } from './earth-layered-recipe.js';
import type { BiomeVistaRenderRequestV1 } from './biome-vista-protocol.js';
import { isCanonicalWorldRoster, type CanonicalWorldRoster } from './world-roster.js';

export const LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1 = 'cf.art.landfall-snapshot.v1' as const;
export const LANDFALL_APPEARANCE_RECIPE_ID_V1 = 'canonical-earth-epoch0-six-residents-v1' as const;

export type LandfallJsonValueV1 = null | boolean | number | string
  | readonly LandfallJsonValueV1[] | { readonly [key: string]: LandfallJsonValueV1 };
/** Remove type-only provenance as well as mutability from exported data.
 * In particular a detached address/roster is not a branded runtime authority. */
type DataMirror<T> = unknown extends T ? LandfallJsonValueV1
  : T extends string ? string : T extends number ? number : T extends boolean ? boolean
  : T extends null ? null : T extends readonly (infer Item)[] ? readonly DataMirror<Item>[]
  : T extends object ? { readonly [Key in keyof T as Key extends string ? Key : never]: DataMirror<T[Key]> }
  : never;

type RosterMirror = DataMirror<CanonicalWorldRoster>;
export type LandfallAppearanceRosterV1 = Omit<RosterMirror, 'view'> & {
  readonly view: Pick<RosterMirror['view'], 'all' | 'total'>;
};

export interface LandfallAppearanceSnapshotV1 {
  readonly schema: typeof LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1;
  readonly recipeId: typeof LANDFALL_APPEARANCE_RECIPE_ID_V1;
  /** Successful input admission never certifies an image's quality. */
  readonly qualityAccepted: false;
  /** Exact source projection, including static weather/day/dusk/night inputs. */
  readonly request: DataMirror<Extract<BiomeVistaRenderRequestV1, { scene: 'generic' }>>;
  readonly roster: LandfallAppearanceRosterV1;
  /** Existing six complete identities and normalized composition anchors. */
  readonly displayPlan: DataMirror<EarthResidentLayerPlanV1>;
}

export type LandfallAppearanceSnapshotResultV1 = Readonly<{
  ok: true;
  snapshot: LandfallAppearanceSnapshotV1;
  /** Stable source bytes for an outer export receipt/content hash. This is
   * not a promise of reproducible model pixels or a new sharing codec. */
  canonicalJson: string;
}> | Readonly<{ ok: false; reason: 'unproven-roster' | 'unsupported-recipe' }>;

const UNPROVEN = Object.freeze({ ok: false, reason: 'unproven-roster' } as const);
const UNSUPPORTED = Object.freeze({ ok: false, reason: 'unsupported-recipe' } as const);

function freezeData<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    // The existing descriptor snapshot uses null-prototype arrays. Traverse
    // own values without invoking array instance methods or inherited hooks.
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value;
}

/** Only an actual live roster can enter this boundary. Parsed JSON, diagnostic
 * snapshots, spreads and proxies cannot manufacture the private WeakSet brand.
 * The detached result intentionally cannot be fed back as live roster authority.
 *
 * Model pins, prompts, references, render dimensions and scheduler parameters
 * belong to the separate generation recipe. This function owns no RNG or clock.
 * Data arrays retain the safe null prototype of snapshotEarthLayerDataV1; use
 * Array.from/Array.prototype methods or parse canonicalJson for transport use. */
export function buildLandfallAppearanceSnapshotV1(
  request: unknown,
  roster: unknown,
): LandfallAppearanceSnapshotResultV1 {
  if (!isCanonicalWorldRoster(roster)) return UNPROVEN;
  try {
    // Read caller-controlled request descriptors once. Validate and export
    // that same detached graph, never re-read a Proxy after admission.
    const requestData = snapshotEarthLayerDataV1(request);
    const rosterData = snapshotEarthLayerDataV1(roster) as RosterMirror;
    const plan = buildEarthLayeredRecipeV1(requestData, rosterData);
    if (plan === null) return UNSUPPORTED;
    const { view, ...authority } = rosterData;
    const snapshot = freezeData({
      schema: LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1,
      recipeId: LANDFALL_APPEARANCE_RECIPE_ID_V1,
      qualityAccepted: false,
      request: requestData,
      roster: { ...authority, view: { all: view.all, total: view.total } },
      displayPlan: snapshotEarthLayerDataV1(plan),
    }) as LandfallAppearanceSnapshotV1;
    return Object.freeze({ ok: true, snapshot, canonicalJson: JSON.stringify(snapshot) });
  } catch {
    return UNSUPPORTED;
  }
}
