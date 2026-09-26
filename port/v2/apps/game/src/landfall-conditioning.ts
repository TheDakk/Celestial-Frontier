/* Pure conditioning data: no model, canvas, clock, RNG, save or route mutation.
 * Named Earth diagnostics come from the actual painter owners cited below;
 * raw procedural limb/color/body genes are NOT named Earth anatomy. This first
 * adapter retains the exact snapshot's Earth scope and D-9e refusal boundary. */
import { snapshotEarthLayerDataV1, EARTH_RAIN_INTENSITY_V1, EARTH_PAINTED_COMPOSITION_V1, EARTH_PAINTED_EDGE_RUNNERS_V1, EARTH_PAINTED_WEATHER_MAT_V1 } from '@cf/art/earth-resident-plan';
import { speciesVisualKey } from '@cf/art/species-identity';
import { FA_SIZE } from '@cf/domain-speciestraits';
import { starClass, KIND_DESC, SOL_PLANETS } from '@cf/domain-starcatalog';
import { systemFor } from '@cf/domain-worldgen';
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
export const LANDFALL_CONDITIONING_SCHEMA_V2 = 'cf.art.landfall-conditioning.v2' as const;
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
      "Show exactly three separate animals: Civet, Platypus and Frog, each with its own complete body and a visible gap between animal silhouettes. Image 1 guides ONLY the Platypus. Do not give the Civet a bill, webbed feet or paddle tail. Do not give the Platypus spots, a face mask, round ears or a furry pointed muzzle. Preserve the Civet's pointed nose and long ringed tail, and the Platypus's plain brown coat, broad bill and flat paddle tail. Never merge these animals.",
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


/** Ordered whole-image anatomy guides. This adapter changes model inputs only;
 * it does not promise mask/box control, classify pixels or widen world admission. */
export interface LandfallConditioningRecipeV2 extends Omit<LandfallConditioningRecipeV1, 'schema' | 'referenceRequirements'> {
  readonly schema: typeof LANDFALL_CONDITIONING_SCHEMA_V2;
  readonly referenceRequirements: readonly Readonly<{
    imageIndex: number;
    purpose: 'named-species-fidelity';
    subjectIdentityKey: string;
    name: string;
    fullGenome: Readonly<Record<string, LandfallJsonValueV1>>;
    requiredFeatures: readonly string[];
    acceptance: 'reviewed-exact-identity-reference-required';
  }>[];
}
export type LandfallConditioningResultV2 = Readonly<{
  ok: true; recipe: LandfallConditioningRecipeV2;
  snapshotKey: string; recipeKey: string; canonicalJson: string;
}> | Extract<LandfallConditioningResultV1, { ok: false }>;

export function buildLandfallConditioningV2(input: unknown): LandfallConditioningResultV2 {
  const previous = buildLandfallConditioningV1(input);
  if (!previous.ok) return previous;
  const { recipe: prior } = previous;
  const requirements = prior.residents.map((row, index) => ({ imageIndex: index + 1,
    purpose: 'named-species-fidelity' as const, subjectIdentityKey: row.identityKey,
    name: row.name, fullGenome: row.genome,
    requiredFeatures: row.namedRule.diagnostics.map(item => item.required),
    acceptance: 'reviewed-exact-identity-reference-required' as const }));
  const prompt = [
    'Cohesive natural-history painting: shared light, soft contact shadows, depth and restrained detail.',
    `${prior.scene.timeOfDay === 'day' ? 'Daylight' : prior.scene.timeOfDay}, rainy temperate riverbank with liquid water, rooted vegetation and damp stones.`,
    'Show exactly three separate animals: Civet, Platypus and Frog, each with its own complete body and a visible gap. Never merge animals or transfer anatomy between species.',
    ...prior.residents.map((row, index) => `Image ${index + 1} guides ONLY ${row.name}. One ${row.name} at ${Math.round(row.placement.x * 100)}% across, base ${Math.round(row.placement.groundY * 100)}% down, ${Math.round(row.placement.width * 100)}% wide${row.kingdom === 'fauna' && row.placement.flip ? ', facing left' : ''}: ${row.namedRule.diagnostics.map(item => item.required).join('; ')}.`),
    'Integrate subjects into one environment, not six panels. Keep each whole subject in frame. No extra animals, duplicate anatomy, text or interface.',
  ].join('\n');
  const recipe: LandfallConditioningRecipeV2 = freeze({ ...prior,
    schema: LANDFALL_CONDITIONING_SCHEMA_V2, referenceRequirements: requirements, prompt });
  const canonicalJson = JSON.stringify(recipe);
  return Object.freeze({ ok: true, recipe, snapshotKey: previous.snapshotKey,
    recipeKey: `lfc2:${canonicalJson}`, canonicalJson });
}

export function buildCanonicalLandfallConditioningV2(request: unknown, liveRoster: unknown): LandfallConditioningResultV2 {
  const snapshot = buildLandfallAppearanceSnapshotV1(request, liveRoster);
  if (!snapshot.ok) return Object.freeze({ ok: false,
    reason: snapshot.reason === 'unproven-roster' ? 'unproven-roster' : 'unsupported-snapshot' });
  return buildLandfallConditioningV2(snapshot.snapshot);
}


/** Approved kit interpreter's first bounded adapter. The host supplies the exact
 * Markdown bytes; this owner extracts, fills and orders blocks. No separately
 * authored system cards or send-time rewrites. Other worlds and unlisted family
 * exemplars remain unsupported until their source adapters are implemented. */
export function compileEarthArtKitV4(input: unknown, kit: string) {
  if (!kit.startsWith('# Celestial Frontier Art Kit\n') || !['4', '4.2', '4.3'].some(version => kit.includes(`style_id: frontier   |   version ${version},`)))
    throw Error('Art Kit v4 required; retired kits are refused');
  const admitted = buildLandfallConditioningV1(input);
  if (!admitted.ok) throw Error('Art Kit source refused: ' + admitted.reason);
  const { sourceSnapshot: source, scene, residents } = admitted.recipe;
  const between = (text: string, first: string, last: string) => {
    if (text.split(first).length !== 2) throw Error('Nonunique kit marker: ' + first);
    const tail = text.slice(text.indexOf(first) + first.length);
    if (tail.split(last).length !== 2) throw Error('Nonunique kit end: ' + last);
    return tail.slice(0, tail.indexOf(last));
  };
  const block = (heading: string) => {
    if (kit.split('\n## ' + heading + '\n').length !== 2) throw Error('Missing kit section: ' + heading);
    const section = kit.split('\n## ' + heading + '\n')[1]!.split('\n## ')[0]!.split('\n### ')[0]!;
    return between(section, '```text\n', '\n```');
  };
  const reference = block('1. Reference lock'), style = block('2. Frozen style');
  const universe = block('3. The one universe'), technical = block('5. Technical output');
  const negative = block('6. Shared negative');
  const sharedNegative = between(negative, 'Paste in every prompt, then add the class\'s NEGATIVE ADDITIONS.\n\n', '\n\n  For CUT-OUT classes, add:');
  const cutoutNegative = between(negative, '  For CUT-OUT classes, add:\n', '\n\n  For SCENE classes, do not add those clauses.');
  const cutoutTechnical = between(technical, 'table says 1536, 512 or 256):\n', '\n\nSCENE BLOCK');
  const sceneTechnical = between(technical, 'SCENE BLOCK (paste for universe, stars, planet biomes):\n', '\n\nGlow is painted');
  const star = starClass(source.roster.starSeed);
  const planet = SOL_PLANETS.find(row => row.P.seed === source.roster.planetSeed);
  if (!planet || star.kind !== 'G' || source.request.options.stc !== star.col) throw Error('Unsupported star/planet card');
  const system = systemFor(source.roster.starSeed) as Record<string, unknown>;
  const starRow = between(universe, '\n  G      ', '\n  A      ');
  const profile = source.roster.biomeProfile;
  const options = source.request.options;
  const flora = residents.filter(row => row.kingdom === 'flora');
  const fauna = residents.filter(row => row.kingdom === 'fauna');
  // These source-owned named paint colours replace random procedural colour
  // genes for Earth, just as the named anatomy table replaces random limb genes.
  const pigments: Record<string, string> = {
    Civet: 'matte warm grey-ochre fur (#a8996f), dark spots, face mask and tail rings',
    Platypus: 'sleek dark-brown fur and a dark rubbery bill',
    Frog: 'green skin', Persimmon: 'green leaves, orange fruit, brown wood',
    Cranberry: 'green leaves and red berries', "Devil's Club": 'green leaves and red berry cones',
  };
  const card = [
    `SYSTEM CARD - ${system.sol ? 'Sol' : source.roster.starSeed} / ${planet.name}; ${source.roster.worldKey}`,
    `  Star: ${star.kind}; ${KIND_DESC[star.kind]}; ${star.col}; radius ${star.r}. ${starRow}`,
    `  Light: ${scene.timeOfDay}; ${scene.weather}; ${system.binary || system.trinary ? JSON.stringify({ binary: system.binary, trinary: system.trinary }) : 'one primary, no companions'}; diffuse cloud-filtered light, soft neutral contact shadows; directional sun position absent from source, do not invent a visible second light.`,
    `  Mineral palette: ${planet.P.type}; seaHue ${planet.P.seaHue}, landHue ${planet.P.landHue}, iceAmt ${planet.P.iceAmt}; blue water, green land, pale ice; hue absent from source.`,
    `  Atmosphere: vista palette ${options.pal}, climate ${source.roster.climateBand}, weather ${scene.weather}, water ${scene.water}; rain softens distant blue-grey layers.`,
    `  Flora pigment: ${source.roster.biomeProfileKey}; forms ${Array.from(profile.flora).join(', ')}; ${flora.map(row => `${row.name}: ${pigments[row.name]}`).join('; ')}.`,
    `  Fauna adaptation: families ${Array.from(profile.fauna).join(', ')}; Earth named anatomy and natural materials take priority over raw procedural genes: ${fauna.map(row => `${row.name}: ${row.namedRule.diagnostics.map(d => d.required).join('; ')}; ${pigments[row.name]}`).join(' | ')}.`,
    `  One signature: ${profile.hazard === null ? 'no biome hazard in source; no added hazard motif' : profile.hazard}.`,
  ].join('\n');
  const prompts = residents.map(row => {
    const animal = row.kingdom === 'fauna';
    const cls = block(animal ? '4E. Fauna (cut-out)' : '4D. Flora (cut-out)');
    const counts = animal ? 'one head, exactly one head; four limbs, two fore and two hind, exactly four limbs' : 'one connected specimen, exactly one connected growth';
    const size = row.name === 'Persimmon' ? 'tree taller than a human' : row.name === "Devil's Club" ? 'shrub comparable to human height' : 'a fraction of human height';
    const accuracyTemplate = between(cls, 'ACCURACY (paste and fill):\n', animal ? '\n\nLAYOUT, TOKEN POSE' : '\n\nLAYOUT (paste)');
    const accuracy = accuracyTemplate.replace(/<[^>]+>/g, token => token.includes('count') || token.includes('stalks') ? counts : size);
    const layout = between(cls, animal ? 'LAYOUT, TOKEN POSE (paste; the gameplay image):\n' : 'LAYOUT (paste):\n', animal ? '\n\nLAYOUT, TURNAROUND' : '\n\nNEGATIVE ADDITIONS:');
    const additions = between(cls, 'NEGATIVE ADDITIONS:\n', '\n\nOUTPUT:');
    const subject = `One Earth ${row.name}; ${size}; ${counts}; ${row.namedRule.diagnostics.map(d => d.required).join('; ')}; ${pigments[row.name]}; ${animal ? 'no armour, no harness, no gear; alert natural expression, named anatomy preserved' : 'complete anchoring base through crown, no soil'}.`;
    return { key: row.name.toLowerCase().replace(/'/g, '').replace(/ /g, '-'), name: row.name,
      kind: 'cut-out' as const, width: 1024, height: 1024, identityKey: row.identityKey,
      sourceOwners: row.namedRule.sourceOwners, systemCard: card,
      prompt: [reference, style, card, 'SUBJECT\n' + subject, 'ACCURACY\n' + accuracy,
        'LAYOUT\n' + layout, 'TECHNICAL OUTPUT\n' + cutoutTechnical,
        'NEGATIVE\n' + sharedNegative + '\n' + cutoutNegative + '\n' + additions].join('\n\n') };
  });
  const biomeClass = block('4C. Planets (orbital cut-out, biome scene)');
  const biomeLayout = between(biomeClass, 'BIOME - LAYOUT (paste):\n', '\n\nBIOME - OUTPUT:');
  const biomeAdditions = biomeClass.split('NEGATIVE ADDITIONS (both profiles):\n')[1];
  if (!biomeAdditions) throw Error('Missing biome negative');
  const plate = { key: 'earth-temperate', name: 'Earth temperate biome plate', kind: 'scene' as const,
    width: 2560, height: 1440, systemCard: card,
    prompt: [reference, style, card,
      `SUBJECT\nEarth ${scene.biome} riverbank; damp grey-brown stones, blue liquid water and green banks; distant tree and shrub growth from this biome, blue-grey rainy atmosphere washing out distant layers; rain falling across the river; a distant stand of trees gives scale; diffuse cloud-filtered daylight with no visible sun position supplied by the vista. Empty foreground landing areas for the six resident passes: no foreground organisms or animals painted into this anchor.`,
      'LAYOUT\n' + biomeLayout, 'TECHNICAL OUTPUT\n' + sceneTechnical,
      'NEGATIVE\n' + sharedNegative + '\n' + biomeAdditions].join('\n\n') };
  // Named catalogue exemplars illustrate painter families; they are not added
  // to the Earth landing roster and cannot masquerade as live creature IDs.
  const exemplars = [
    { family: 'mammal quadruped', name: 'Fox', realm: 'land',
      owner: 'art/mammaloverrides.ts#QUAD2_SPEC.Fox',
      counts: 'one head, exactly one head; four legs, two fore and two hind, exactly four legs; one tail, exactly one tail',
      anatomy: 'fine pointed muzzle, large upright ears, long plume tail with pale cream tip, dark stockings; narrow canid body, alert eyes, closed natural jaw',
      pigment: 'warm russet fur (#c4642a), cream tail tip (#f2efe6), dark brown stockings (#241b19)' },
    { family: 'bird', name: 'Pheasant', realm: 'land', owner: 'art/faunaoverrides.ts#birdB3Pheasant',
      counts: 'one head, exactly one head; two legs, exactly two legs; two folded wings, exactly two wings; one long feathered tail, exactly one tail',
      anatomy: 'rounded chest, long barred pointed tail, folded feathered wings, white neck ring, green head, red cheek patch, short horn-coloured bill, alert golden eyes',
      pigment: 'ochre and chestnut feathers (#c28a46, #8a4525), dark green head (#164f43), red cheek (#bd3c36), cream neck ring (#f1e9d6)' },
    { family: 'fish', name: 'Trout', realm: 'aquatic', owner: 'art/faunaoverrides3.ts#FAUNA3_NAME.Trout',
      counts: 'one head, exactly one head; one forked tail, exactly one tail; two pectoral fins, exactly two pectoral fins; two pelvic fins, exactly two pelvic fins; one main dorsal fin, exactly one main dorsal fin; no legs, zero legs',
      anatomy: 'fusiform salmonid body, blunt snout, spotted scales, natural fins and gill covers, clear lateral silhouette with slight three-quarter turn, naturally suspended swimming posture, watchful lateral eye and closed mouth',
      pigment: 'muted bronze-brown scales (#7b6136), pale underside, dark spots' },
    { family: 'insect', name: 'Beetle', realm: 'land', owner: 'art/faunaoverrides.ts#FAUNA_NAME.Beetle/faunaBeetle',
      counts: 'one head, exactly one head; six jointed legs, three near and three far, exactly six legs; two antennae, exactly two antennae; two closed elytra, exactly two wing cases',
      anatomy: 'oval chitin body with a central elytra seam, pronotum and small head, six jointed legs, small compound eyes and natural mandibles; low crawling stance with body raised enough to read the legs',
      pigment: 'burnished brown chitin (#96551f), dark jointed legs (#20242c)' },
    { family: 'reptile', name: 'Skink', realm: 'land', owner: 'art/faunaoverrides2.ts#faunaESquamata.Skink',
      counts: 'one head, exactly one head; four small legs, two fore and two hind, exactly four legs; one long tapered tail, exactly one tail',
      anatomy: 'slender glossy scaled body and slender head, tiny legs, tail a little longer than body (source ratio 1.08), low lizard posture, small lateral eyes and closed natural jaw',
      pigment: 'glossy brown scales (#7c5b34), restrained natural highlights' },
  ];
  const familyClass = block('4E. Fauna (cut-out)');
  const familyLayout = between(familyClass, 'LAYOUT, TOKEN POSE (paste; the gameplay image):\n', '\n\nLAYOUT, TURNAROUND');
  const familyReferences = exemplars.map(row => {
    const familyCard = card.replace('\n  One signature:', `; family-reference exemplar only, not an Earth landing resident: ${row.name}, ${row.family}, ${row.realm}; ${row.pigment}.\n  One signature:`);
    const accuracy = between(familyClass, 'ACCURACY (paste and fill):\n', '\n\nLAYOUT, TOKEN POSE')
      .replace(/<[^>]+>/g, token => token.includes('count') ? row.counts : 'a fraction of human height');
    return { key: 'family-' + row.family.replace(/ /g, '-'), name: row.name, family: row.family,
      kind: 'cut-out' as const, width: 1024, height: 1024, realm: row.realm,
      sourceOwners: [row.owner], systemCard: familyCard, liveResident: false,
      prompt: [reference, style, familyCard,
        `SUBJECT\nOne Earth ${row.name}, a ${row.family} family reference; a fraction of human height; ${row.counts}; ${row.pigment}; ${row.anatomy}; no armour, no harness, no gear, no added growth or bioluminescence.`,
        'ACCURACY\n' + accuracy, 'LAYOUT\n' + familyLayout, 'TECHNICAL OUTPUT\n' + cutoutTechnical,
        'NEGATIVE\n' + sharedNegative + '\n' + cutoutNegative + '\n' + between(familyClass, 'NEGATIVE ADDITIONS:\n', '\n\nOUTPUT:')].join('\n\n') };
  });
  const frozenParagraph = '  Rich natural-history fantasy painting,' + between(style,
    '  Rich natural-history fantasy painting,', '\n\nThe scene-contact');
  // Model-facing natural language, compiled from the same source fields/pigments.
  // Authoring prompts/cards above remain byte-identical to the accepted inputs.
  const runtimeCard = [
    `Light: ${scene.timeOfDay}; ${scene.weather}; diffuse cloud-filtered light, soft neutral contact shadows.`,
    `Mineral palette: ${planet.P.type}; blue water, green land, pale ice.`,
    `Atmosphere: ${scene.weather}; rain softens distant blue-grey layers.`,
    `Pigments: ${residents.map(row => `${row.name}: ${pigments[row.name]!.replace(/ \(#[a-f0-9]+\)/g, '')}`).join('; ')}.`,
  ].join('\n');
  return freeze({ schema: 'cf.art.kit-earth-inputs.v4', sourceSnapshot: source, systemCard: card, runtimeCard, frozenParagraph, prompts, plate, familyReferences,
    qualityAccepted: false, scope: 'six-earth-cutouts-temperate-plate-five-named-family-exemplars' });
}

/** Desktop creature texture class, same kit finisher, inverted protection polarity.
 * No per-species prompt/settings; pixels carry anatomy and palette. */
export type CreatureFinishImageV1 = {readonly sha256:string;readonly width:number;readonly height:number} &
 ({readonly url:string;readonly buffer?:never}|{readonly buffer:ArrayBuffer;readonly url?:never});
export function compileCreatureFinishV1(input:{recordRecipeHash:string;cutoutAssetHash:string;seed:number;width:number;height:number;master:CreatureFinishImageV1;labels:CreatureFinishImageV1}) {
 if(!/^[a-f0-9]{64}$/.test(input.recordRecipeHash)||!/^[a-f0-9]{64}$/.test(input.cutoutAssetHash)||!Number.isSafeInteger(input.seed))throw Error('Creature finish identity');
 const seed=(input.seed ^ Number.parseInt(input.recordRecipeHash.slice(0,8),16))>>>0;
 return freeze({schema:'cf.creature-finish.v1',tier:'desktop',width:input.width,height:input.height,seed,master:input.master,labels:input.labels,
   settings:{strength:.35,steps:1,boundaryPixels:4,gradientRatio:.95},
   prompt:'Rich natural-history fantasy painting. Finish the existing painted creature with fine natural material texture and softly modeled light. Preserve its exact anatomy, count of legs and pincers, pose, silhouette, pigment colors, markings and part boundaries. Work only inside the existing painted surfaces. Keep the source background unchanged. No added limbs, objects, scenery, lettering or decorations.'});
}

export interface KitPreparedImageV4 { readonly url: string; readonly sha256: string; readonly width: number; readonly height: number }
export interface KitEngineAssetsV4 { readonly plate: KitPreparedImageV4; readonly atlas: KitPreparedImageV4; readonly triptych: KitPreparedImageV4; readonly residents: Readonly<Record<string, KitPreparedImageV4>>; readonly foreground?: KitPreparedImageV4 }
export interface KitEngineSettingsV4 { readonly width: number; readonly height: number; readonly passSize: number; readonly seed: number; readonly steps: number; readonly strength: number; readonly finisherStrength: number; readonly compositionProfile?: 'edge-runners-v1' | 'weather-mat-v1' }
/** Nick's authorized runtime projection. Kit text and authoring prompts are unchanged.
 * Geometry comes from the art data owner; only model-relevant language reaches text. */
export function compileEarthKitEngineV4(input: unknown, kit: string, assets: KitEngineAssetsV4, settings: KitEngineSettingsV4) {
  const compiled = compileEarthArtKitV4(input, kit);
  const model = buildLandfallConditioningV1(compiled.sourceSnapshot);
  if (!model.ok || !assets.foreground) throw Error('Canonical contact scene/foreground unavailable');
  const profile = settings.compositionProfile === 'weather-mat-v1' ? EARTH_PAINTED_WEATHER_MAT_V1 : settings.compositionProfile === 'edge-runners-v1' ? EARTH_PAINTED_EDGE_RUNNERS_V1 : EARTH_PAINTED_COMPOSITION_V1;
  const passes = compiled.prompts.map(row => {
    const resident = model.recipe.residents.find(r => r.identityKey === row.identityKey)!;
    const reference = assets.residents[row.key];
    const composition = profile.residents.find(r => r.name === row.name)!;
    if (!reference) throw Error('Missing fitted reference for ' + row.name);
    return { name: row.name, identityKey: row.identityKey, reference,
      placement: { ...resident.placement, ...composition } };
  });
  const subject = model.recipe.residents.map(row =>
    `One ${row.name}: ${row.namedRule.diagnostics[0]!.required}.`).join(' ') +
    ' Integrate feet and stems into wet ground with visible contact shadows under Civet and Platypus, shared light and natural ground reflections.';
  const layout = 'A coherent riverbank scene with distinct readable subjects, the Civet as hero, a smaller Platypus, a clearly visible Frog, a taller Persimmon, and foreground grass overlapping the lowest animal feet.';
  const finisherPrompt = [compiled.frozenParagraph, compiled.runtimeCard, subject, layout].join('\n\n');
  return freeze({ schema: 'cf.kit-engine.v4', experiment: settings.compositionProfile === 'weather-mat-v1' ? 'cf.kit-weather-mat.v1' : settings.compositionProfile === 'edge-runners-v1' ? 'cf.kit-edge-runners.v1' : 'cf.kit-contact.v1', ...settings,
    ...(settings.compositionProfile === 'edge-runners-v1' ? { interiorErosionPixels: 8 } : {}),
    ...(settings.compositionProfile === 'weather-mat-v1' ? { compositorSystemCard: compiled.systemCard, weatherIntensity: /rain|storm/.test(model.recipe.scene.weather) ? EARTH_RAIN_INTENSITY_V1 : { dropletCount: 1, specularStrength: 1, precipitationDensity: 1 } } : {}),
    plate: assets.plate, atlas: assets.atlas, triptych: assets.triptych, foreground: assets.foreground,
    composition: profile, passes, finisherPrompt, sourceSnapshot: compiled.sourceSnapshot,
    qualityAccepted: false, mastersAccepted: true, textTokenCeiling: 512, finisherSteps: 1, skipOrganismPasses: true });
}

/** Authoring-only procedural proof under the canonical Earth lighting fixture.
 * This does not add residents to Earth or broaden the runtime model adapter.
 * Inputs must come from planFor, the winning painter and speciesGenomePalette;
 * the host verifies the hash-bound observation before compiling. */
export function compileProceduralQuadrupedProofV43(input: unknown, kit: string, source: {
  genome: Record<string, unknown>;
  identity: {speciesVisualKey:string; earthName:string|null; seed:number};
  material: string;
  palette: {base:string;lit:string;dark:string};
  plan: {kind:string;spec:{legs:number;depth:number;len:number;neck:number;back:string;muzzle:number;jaw:string;ears:string;tail:string;coat:string;horn?:string;alien?:{legPairs?:number;eyes?:string;skin?:string;tendrils?:boolean;lumin?:boolean;sail?:boolean;armor?:boolean}}};
}) {
  const {genome,identity,plan,palette,material}=source,spec=plan.spec;
  if(identity.earthName!==null||genome._earthName||genome.kingdom!=='fauna'||identity.seed!==genome.seed||identity.speciesVisualKey!==speciesVisualKey(genome))throw Error('Procedural proof identity mismatch');
  if(plan.kind!=='quad'||spec.alien?.legPairs!==2||spec.alien.eyes!=='normal'||spec.tail!=='banded'||spec.alien.tendrils||spec.alien.armor||(spec.horn&&spec.horn!=='straight'))throw Error('Procedural proof anatomy unsupported');
  if(material!==(spec.alien.skin??'fur'))throw Error('Procedural proof painted material mismatch');
  for(const n of[spec.legs,spec.depth,spec.len,spec.neck,spec.muzzle])if(!Number.isFinite(n)||n<=0)throw Error('Procedural proof proportion');
  for(const v of Object.values(palette))if(!/^rgb\(\d+,\d+,\d+\)$/.test(v)||v.match(/\d+/g)!.some(n=>Number(n)>255))throw Error('Procedural proof palette');
  const [red,green,blue]=palette.base.match(/\d+/g)!.map(Number);
  if(red!>green!+40&&blue!>green!+40)throw Error('Procedural proof pigment conflicts with magenta key; preserve genome and refuse');
  if(!Number.isInteger(genome.size)||Number(genome.size)<0||Number(genome.size)>=FA_SIZE.length)throw Error('Procedural proof size');
  const compiled=compileEarthArtKitV4(input,kit),template=compiled.familyReferences[0]!;
  const counts='one head, exactly one head; four legs, two fore and two hind, exactly four legs; two ears, exactly two ears; two eyes, exactly two eyes; one tail, exactly one tail'+(spec.horn?'; two straight horns, exactly two horns':'');
  const size='source size class '+FA_SIZE[Number(genome.size)]+' (relative metre scale is not supplied by this adapter; no scale prop)';
  const traits=`${material}; base pigment ${palette.base}, illuminated pigment ${palette.lit}, dark pigment ${palette.dark}; ${spec.coat} body markings and a banded tail`;
  const proportion=`body length ${spec.len}, torso depth ${spec.depth}, leg length ${spec.legs}, neck length ${spec.neck}, in the same source coordinate units; preserve their ratios; ${spec.back} back; ${spec.jaw} jaw, muzzle ratio ${spec.muzzle}, ${spec.ears} ears`;
  const accessories=[spec.horn?'two straight horns':'no horns',spec.alien.sail?'one dorsal sail':'no dorsal sail',spec.alien.lumin?'source-owned bioluminescence as bounded painted shapes':'no bioluminescence'].join('; ');
  const card=compiled.systemCard.split('\n').map(line=>line.startsWith('  Fauna adaptation:')?`  Fauna adaptation: authoring comparison visitor, procedural seed ${identity.seed}; not an Earth resident or claimed home world; ${traits}; ${proportion}; ${accessories}.`:line).join('\n');
  const subject=`One procedural quadruped, seed ${identity.seed}; ${size}; ${counts}; ${traits}; ${proportion}; land locomotion on four paws, weight supported by connected shoulder, pelvis and jointed limbs; natural mouth and paws, no invented ability weapons; ${accessories}; no armour, no harness, no gear; alert animal expression, readable brow, closed natural mouth. The source silhouette is anatomy evidence only: render organic volume, convincing muscle and surface detail in the frozen painted style, not the source canvas's flat ellipses, graphic shading or toy face.`;
  const replaceSection=(text:string,start:string,end:string,value:string)=>{
    if(text.split(start).length!==2||text.split(end).length!==2)throw Error('Procedural proof prompt boundary');
    return text.slice(0,text.indexOf(start)+start.length)+value+text.slice(text.indexOf(end));
  };
  let prompt=template.prompt.replace(template.systemCard,card);
  prompt=replaceSection(prompt,'SUBJECT\n','\n\nACCURACY\n',subject);
  const accuracy=prompt.slice(prompt.indexOf('ACCURACY\n')+9,prompt.indexOf('\n\nLAYOUT\n'));
  const fixed=accuracy.replace(/Anatomy\/count constraints: .*?\./,`Anatomy/count constraints: ${counts}.`).replace('a fraction of human height',size);
  prompt=replaceSection(prompt,'ACCURACY\n','\n\nLAYOUT\n',fixed);
  return freeze({schema:'cf.art.procedural-quadruped-proof.v1',qualityAccepted:false,animationReady:false,
    source,systemCard:card,subject,prompt,scope:'authoring comparison under canonical Earth light; not runtime generation or a home-world claim',
    needs:'new painting hash, fitted landmarks and masks; canvas masks must not be reused'});
}
