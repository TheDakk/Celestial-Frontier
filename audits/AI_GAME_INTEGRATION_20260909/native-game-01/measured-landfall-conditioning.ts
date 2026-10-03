/* Pure conditioning data: no model, canvas, clock, RNG, save or route mutation.
 * Named Earth diagnostics come from the actual painter owners cited below;
 * raw procedural limb/color/body genes are NOT named Earth anatomy. This first
 * adapter retains the exact snapshot's Earth scope and D-9e refusal boundary. */
import { snapshotEarthLayerDataV1 } from '@cf/art/earth-resident-plan';
import { speciesVisualKey } from '@cf/art/species-identity';
import { buildEarthLayeredRecipeV1 } from './earth-layered-recipe.js';
import {
  buildLandfallAppearanceSnapshotV1,
  LANDFALL_APPEARANCE_RECIPE_ID_V1,
  LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1,
  type LandfallAppearanceSnapshotV1,
  type LandfallJsonValueV1,
} from './landfall-appearance-snapshot.js';

export const LANDFALL_CONDITIONING_SCHEMA_V1 = 'cf.art.landfall-conditioning.v1' as const;
export const LANDFALL_NAMED_RULES_VERSION_V1 = 'cf.art.named-earth-diagnostics.v1' as const;
export const LANDFALL_STYLE_VERSION_V1 = 'cf.art.cohesive-natural-history.v1' as const;

type Kingdom = 'fauna' | 'flora';
type Family = 'mammal' | 'amphibian' | 'tree' | 'shrub';
type AnatomyRole = 'body' | 'head' | 'limbs' | 'tail' | 'stem' | 'leaves' | 'fruit';
export interface NamedLandfallRuleV1 {
  readonly id: string;
  readonly name: string;
  readonly kingdom: Kingdom;
  readonly family: Family;
  /** A taxonomy seam for later proved family adapters, not a new classifier. */
  readonly taxon: 'viverrid' | 'monotreme' | 'anuran' | 'fruit-tree' | 'creeping-shrub' | 'spiny-shrub';
  readonly sourceOwners: readonly string[];
  readonly diagnostics: readonly Readonly<{ role: AnatomyRole; required: string }>[];
  readonly forbiddenSubstitutions: readonly string[];
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Small source-backed named records, kept separate from compilation/style.
 * New names need their actual winning owner and explicit diagnostics; unknown
 * names, lineages and body families never fall back to a generic animal/plant.
 * SPECIES_AND_GENOME Earth rules and ART_DIRECTION §1 own these requirements.
 * This table does not invoke/import painters or claim their pixels are accepted. */
export const LANDFALL_NAMED_RULES_V1: readonly NamedLandfallRuleV1[] = freeze([
  { id: 'earth-civet-v1', name: 'Civet', kingdom: 'fauna', family: 'mammal', taxon: 'viverrid',
    sourceOwners: ['art/mammaloverrides.ts#QUAD2_SPEC.Civet', 'art/quadrupedoverrides.ts#mammalDViverrid'],
    diagnostics: [{ role: 'body', required: 'low long body, spotted natural fur' },
      { role: 'head', required: 'one pointed muzzle, small round ears, dark face mask' },
      { role: 'limbs', required: 'four short legs with paws' },
      { role: 'tail', required: 'one long ringed tail' }],
    forbiddenSubstitutions: ['fox head', 'duplicate head or body', 'extra legs', 'unringed tail'] },
  { id: 'earth-platypus-v1', name: 'Platypus', kingdom: 'fauna', family: 'mammal', taxon: 'monotreme',
    sourceOwners: ['art/speciesoverrides.ts#CANON.fauna|Platypus', 'art/faunaoverrides5.ts#faunaMonotreme'],
    diagnostics: [{ role: 'body', required: 'low sleek dark-brown furred body' },
      { role: 'head', required: 'broad flat rubbery duck bill' },
      { role: 'limbs', required: 'four short limbs with webbed clawed feet' },
      { role: 'tail', required: 'broad flat blunt paddle tail' }],
    forbiddenSubstitutions: ['rodent muzzle', 'furred nose instead of bill', 'round rodent ears', 'thin tail'] },
  { id: 'earth-frog-v1', name: 'Frog', kingdom: 'fauna', family: 'amphibian', taxon: 'anuran',
    sourceOwners: ['art/faunaoverrides2.ts#FAUNA2_NAME.Frog', 'art/faunaoverrides2.ts#amphFrog'],
    diagnostics: [{ role: 'body', required: 'small green crouched body' },
      { role: 'head', required: 'wide mouth and two domed eyes' },
      { role: 'limbs', required: 'four limbs, long folded hind legs' }],
    forbiddenSubstitutions: ['mammal fur', 'upright mammal posture', 'adult tail'] },
  { id: 'earth-persimmon-v1', name: 'Persimmon', kingdom: 'flora', family: 'tree', taxon: 'fruit-tree',
    sourceOwners: ['art/florarost.ts#FLORA2_SPEC.Persimmon', 'art/floraoverrides2.ts#plantBody.Persimmon'],
    diagnostics: [{ role: 'stem', required: 'branching woody tree' },
      { role: 'leaves', required: 'broad simple oval green leaves' },
      { role: 'fruit', required: 'orange fruits with four-lobed calyx' }],
    forbiddenSubstitutions: ['pinnate compound leaves', 'citrus fruit', 'generic berry bush'] },
  { id: 'earth-devils-club-v1', name: "Devil's Club", kingdom: 'flora', family: 'shrub', taxon: 'spiny-shrub',
    sourceOwners: ['art/floraoverrides.ts#FLORA_ICONIC', 'art/floraoverrides.ts#floraDevilsClub'],
    diagnostics: [{ role: 'stem', required: 'thick spiny canes' },
      { role: 'leaves', required: 'huge palmate lobed green leaves' },
      { role: 'fruit', required: 'upright terminal red berry cones' }],
    forbiddenSubstitutions: ['small narrow leaves', 'smooth canes', 'generic berry bush'] },
  { id: 'earth-cranberry-v1', name: 'Cranberry', kingdom: 'flora', family: 'shrub', taxon: 'creeping-shrub',
    sourceOwners: ['art/florarost.ts#FLORA2_SPEC.Cranberry', 'art/floraoverrides2.ts#berryHabit.cranberry'],
    diagnostics: [{ role: 'stem', required: 'low creeping runners' },
      { role: 'leaves', required: 'small simple oval green leaves' },
      { role: 'fruit', required: 'red berries close to the ground' }],
    forbiddenSubstitutions: ['tall woody bush', 'large leaves', 'hanging grape bunches'] },
]);

export interface LandfallConditioningResidentV1 {
  readonly identityKey: string;
  readonly name: string;
  readonly kingdom: Kingdom;
  readonly family: Family;
  readonly genome: Readonly<Record<string, LandfallJsonValueV1>>;
  readonly placement: Readonly<{ x: number; groundY: number; width: number; flip: boolean }>;
  readonly namedRule: NamedLandfallRuleV1;
  readonly rawGenomicVisualPolicy: 'preserve-identity-use-named-earth-anatomy';
}
export interface LandfallConditioningRecipeV1 {
  readonly schema: typeof LANDFALL_CONDITIONING_SCHEMA_V1;
  readonly namedRulesVersion: typeof LANDFALL_NAMED_RULES_VERSION_V1;
  readonly styleVersion: typeof LANDFALL_STYLE_VERSION_V1;
  /** Complete authoritative input data; detached data never becomes live trust. */
  readonly sourceSnapshot: LandfallAppearanceSnapshotV1;
  readonly scene: Readonly<{ biome: string; weather: string; timeOfDay: 'day' | 'dusk' | 'night'; water: string }>;
  readonly residents: readonly LandfallConditioningResidentV1[];
  readonly referenceRequirements: readonly Readonly<{
    imageIndex: 1;
    purpose: 'named-species-fidelity';
    subjectIdentityKey: string;
    name: 'Platypus';
    fullGenome: Readonly<Record<string, LandfallJsonValueV1>>;
    requiredFeatures: readonly string[];
    acceptance: 'reviewed-exact-identity-reference-required';
  }>[];
  /** Plain model-neutral text. Tokenization and image-slot binding belong to
   * the model adapter; never silently truncate this prompt to a token limit. */
  readonly prompt: string;
  readonly negativePrompt: string;
  readonly qualityAccepted: false;
  readonly referenceStatus: 'unresolved';
  readonly fidelityGuarantee: 'none-prose-and-reference-require-outcome-review';
}
export type LandfallConditioningResultV1 = Readonly<{
  ok: true;
  recipe: LandfallConditioningRecipeV1;
  /** Collision-free exact content identities, not compact hashes or art seeds.
   * Transport/storage owners may SHA256 these bytes without changing them. */
  snapshotKey: string;
  recipeKey: string;
  canonicalJson: string;
}> | Readonly<{ ok: false; reason: 'unproven-roster' | 'unsupported-schema' | 'unsupported-snapshot' | 'unsupported-species' }>;
type RefusalReason = Extract<LandfallConditioningResultV1, { ok: false }>['reason'];
const refuse = (reason: RefusalReason): LandfallConditioningResultV1 => Object.freeze({ ok: false, reason });
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Accept a transported snapshot only as conditioning data. Reuse the original
 * full request/19-roster gate; the cosmetic empty preview needed by that gate
 * is reconstructed locally and never supplied to gameplay. This cannot mint a
 * CanonicalWorldRoster. No widened Earth epoch/world/species admission. */
export function buildLandfallConditioningV1(input: unknown): LandfallConditioningResultV1 {
  try {
    const data = snapshotEarthLayerDataV1(input);
    if (!object(data)) return refuse('unsupported-snapshot');
    if (data.schema !== LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1 || data.recipeId !== LANDFALL_APPEARANCE_RECIPE_ID_V1)
      return refuse('unsupported-schema');
    if (Object.keys(data).sort().join('|') !== 'displayPlan|qualityAccepted|recipeId|request|roster|schema'
      || data.qualityAccepted !== false || !object(data.roster) || !object(data.roster.view)
      || Object.keys(data.roster.view).sort().join('|') !== 'all|total'
      || !object(data.displayPlan) || !Array.isArray(data.displayPlan.residents)) return refuse('unsupported-snapshot');
    for (const row of Array.from(data.displayPlan.residents)) {
      if (!object(row) || !LANDFALL_NAMED_RULES_V1.some(rule => rule.name === row.name
        && rule.kingdom === row.kingdom && rule.family === row.family)) return refuse('unsupported-species');
    }
    const roster = { ...data.roster, view: { all: data.roster.view.all, preview: [],
      total: data.roster.view.total, hiddenFromPreview: data.roster.view.total } };
    const plan = buildEarthLayeredRecipeV1(data.request, roster);
    if (!plan || JSON.stringify(data.displayPlan) !== JSON.stringify(plan)) return refuse('unsupported-snapshot');
    // Normal detached arrays are safe here after the existing descriptor guard;
    // speciesVisualKey uses the established full-field/lineage identity owner.
    const snapshot = JSON.parse(JSON.stringify(data)) as LandfallAppearanceSnapshotV1;
    const residents: LandfallConditioningResidentV1[] = Array.from(snapshot.displayPlan.residents, row => {
      const rule = LANDFALL_NAMED_RULES_V1.find(candidate => candidate.name === row.name)!;
      return { identityKey: speciesVisualKey(row.genome), name: row.name, kingdom: rule.kingdom, family: rule.family,
        genome: row.genome, placement: { x: row.x, groundY: row.groundY, width: row.width, flip: row.flip },
        namedRule: rule, rawGenomicVisualPolicy: 'preserve-identity-use-named-earth-anatomy' };
    });
    const options = snapshot.request.options;
    // Existing exact Earth admission guarantees these values. Unknown future
    // environmental adapters must add their own explicit vocabulary, not guess.
    if (snapshot.roster.biomeProfileKey !== 'temperate' || options.wx !== 'rain' || options.water !== 'liquid')
      return refuse('unsupported-snapshot');
    const scene = { biome: snapshot.roster.biomeProfileKey, weather: options.wx,
      timeOfDay: options.nightize ? 'night' as const : options.duskize ? 'dusk' as const : 'day' as const,
      water: options.water };
    const subject = residents.find(row => row.name === 'Platypus')!;
    const prompt = [
      'Cohesive natural-history painting: shared light, soft contact shadows, depth and restrained detail.',
      `${scene.timeOfDay === 'day' ? 'Daylight' : scene.timeOfDay}, rainy ${scene.biome} riverbank with liquid water, rooted vegetation and damp stones.`,
      'Image 1 defines only the Platypus anatomy. Keep its diagnostic features clear.',
      ...residents.map(row => `One ${row.name} at ${Math.round(row.placement.x * 100)}% across, base ${Math.round(row.placement.groundY * 100)}% down, ${Math.round(row.placement.width * 100)}% wide${row.kingdom === 'fauna' && row.placement.flip ? ', facing left' : ''}: ${row.namedRule.diagnostics.map(item => item.required).join('; ')}.`),
      'Keep each whole subject in frame, naturally integrated. No extra animals, duplicate anatomy, text or interface.',
    ].join('\n');
    const recipe: LandfallConditioningRecipeV1 = freeze({ schema: LANDFALL_CONDITIONING_SCHEMA_V1,
      namedRulesVersion: LANDFALL_NAMED_RULES_VERSION_V1, styleVersion: LANDFALL_STYLE_VERSION_V1,
      sourceSnapshot: snapshot, scene, residents,
      referenceRequirements: [{ imageIndex: 1, purpose: 'named-species-fidelity', subjectIdentityKey: subject.identityKey,
        name: 'Platypus', fullGenome: subject.genome, requiredFeatures: subject.namedRule.diagnostics.map(item => item.required),
        acceptance: 'reviewed-exact-identity-reference-required' }],
      prompt, negativePrompt: residents.flatMap(row => row.namedRule.forbiddenSubstitutions.map(text => `${row.name}: ${text}`)).join('; '),
      qualityAccepted: false, referenceStatus: 'unresolved', fidelityGuarantee: 'none-prose-and-reference-require-outcome-review' });
    const canonicalJson = JSON.stringify(recipe);
    return Object.freeze({ ok: true, recipe, snapshotKey: `lfas1:${JSON.stringify(snapshot)}`,
      recipeKey: `lfc1:${canonicalJson}`, canonicalJson });
  } catch { return refuse('unsupported-snapshot'); }
}

/** Normal-game entry: require the existing live brand before snapshotting.
 * The model may use the result only as appearance input, never as a world/save. */
export function buildCanonicalLandfallConditioningV1(request: unknown, liveRoster: unknown): LandfallConditioningResultV1 {
  const result = buildLandfallAppearanceSnapshotV1(request, liveRoster);
  if (!result.ok) return refuse(result.reason === 'unproven-roster' ? 'unproven-roster' : 'unsupported-snapshot');
  return buildLandfallConditioningV1(result.snapshot);
}
