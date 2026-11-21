/* Arc 6 Guardian / Prime Codex preservation foundation.
   This module does not generate a world or a roster. Its caller supplies one
   already-canonical world identity, descriptor, region and fauna roster; the
   functions below apply the exact legacy v1.8.9 encounter rules to those
   inputs. Presentation, settlement, persistence and receipt ownership belong
   to later layers. */
import {
  describeSpecies,
  guardianFor,
  makeGenome,
  type Genome,
  type Guardian,
} from '@cf/domain-genome';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  isRegisteredCF1WorldAddress,
  type RegisteredCF1WorldAddress,
} from '@cf/domain-worldidentity';
import { battleStats } from './combatcore.verbatim.js';

export const GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1 = 'cf-v2-guardian-prime-encounter/v1' as const;

export const PRIME_SIGNATURE_IDS_V1 = Object.freeze([
  'stone', 'flame', 'sky', 'star', 'ocean', 'mind', 'life', 'void', 'prism',
] as const);

export type PrimeSignatureIdV1 = typeof PRIME_SIGNATURE_IDS_V1[number];

export interface PrimeSignatureDefinitionV1 {
  readonly id: PrimeSignatureIdV1;
  readonly element: string;
  readonly tier: 1 | 2 | 3;
  readonly minimumRegionIndex: 0 | 1 | 2;
  readonly icon: string;
  readonly signatureName: string;
  readonly verb: 'Conquer';
  readonly guardianName: string;
  readonly hint: string;
  readonly lore: string;
  readonly reach: string;
  readonly hunt: string;
  readonly eligibleWorldTypes: readonly string[];
  readonly titanColorIndex: number;
  readonly battlefieldWorldField: 'lava' | 'gas' | 'ocean' | 'ice' | null;
}

function signature(
  value: PrimeSignatureDefinitionV1,
): PrimeSignatureDefinitionV1 {
  return Object.freeze({
    ...value,
    eligibleWorldTypes: Object.freeze([...value.eligibleWorldTypes]),
  });
}

/* Exact legacy `SIGS`, `_TITAN_WORLD`, `_TITAN_MINREG`, `_TITAN_THEME` and
   `_SIG_HUNT` facts, expressed once as immutable domain data. Internal ids are
   deliberately unchanged because saves and relic recipes already use them. */
export const PRIME_SIGNATURES_V1: readonly PrimeSignatureDefinitionV1[] = Object.freeze([
  signature({
    id: 'stone', element: 'Earth', tier: 1, minimumRegionIndex: 0,
    icon: '⛰️', signatureName: 'Earth Signature', verb: 'Conquer',
    guardianName: 'Terrakoth, the Mountain’s Fist',
    hint: 'a rare world of stone, metal or mineral',
    lore: 'Terrakoth stands where the crust runs richest — a titan of living rock. Break it, take the Earth.',
    reach: 'the basic elements lie near home — Earth among the first',
    hunt: 'rocky, mineral worlds', eligibleWorldTypes: ['rocky'],
    titanColorIndex: 13, battlefieldWorldField: null,
  }),
  signature({
    id: 'flame', element: 'Fire', tier: 1, minimumRegionIndex: 0,
    icon: '🔥', signatureName: 'Fire Signature', verb: 'Conquer',
    guardianName: 'Pyraxis, the Ember Tyrant',
    hint: 'an extreme volcanic world',
    lore: 'Pyraxis coils on a molten shore, breathing furnace-light. Quench it, take the Fire.',
    reach: 'near — the molten worlds of the inner rings',
    hunt: 'molten worlds', eligibleWorldTypes: ['lava'],
    titanColorIndex: 1, battlefieldWorldField: 'lava',
  }),
  signature({
    id: 'sky', element: 'Air', tier: 1, minimumRegionIndex: 0,
    icon: '🌬️', signatureName: 'Air Signature', verb: 'Conquer',
    guardianName: 'Sylphrend, the Gale Sovereign',
    hint: 'an aerial or gas-giant ecosystem',
    lore: 'Sylphrend rides the cloud decks, never once touching ground. Ground it, take the Air.',
    reach: 'near — the gas giants and aerial worlds',
    hunt: 'the gas giants', eligibleWorldTypes: ['gas'],
    titanColorIndex: 10, battlefieldWorldField: 'gas',
  }),
  signature({
    id: 'star', element: 'Stellar', tier: 1, minimumRegionIndex: 0,
    icon: '🌀', signatureName: 'Stellar Signature', verb: 'Conquer',
    guardianName: 'Zephyrmaw, the Stellar Squall',
    hint: 'a world scoured by a dying star’s solar wind',
    lore: 'Zephyrmaw is born of stellar wind, a storm given shape near the extreme stars. Still it, take the Star.',
    reach: 'near — worlds under the fiercest stars',
    hunt: 'wind-scoured desert worlds', eligibleWorldTypes: ['desert'],
    titanColorIndex: 3, battlefieldWorldField: 'gas',
  }),
  signature({
    id: 'ocean', element: 'Water', tier: 1, minimumRegionIndex: 0,
    icon: '🌊', signatureName: 'Water Signature', verb: 'Conquer',
    guardianName: 'Abyssleth, the Tide Devout',
    hint: 'a living ocean world',
    lore: 'Abyssleth swims the breathing seas, older than any shore. Beach it, take the Water.',
    reach: 'near — any world with living seas',
    hunt: 'living ocean worlds', eligibleWorldTypes: ['ocean'],
    titanColorIndex: 8, battlefieldWorldField: 'ocean',
  }),
  signature({
    id: 'mind', element: 'Electric', tier: 2, minimumRegionIndex: 1,
    icon: '⚡', signatureName: 'Electric Signature', verb: 'Conquer',
    guardianName: 'Voltmaw, the Living Current',
    hint: 'a world alive with electric, signalling life',
    lore: 'Voltmaw answers your scans in a voice of raw current. Earth it, take the Electric.',
    reach: 'the middle reach — the Local Cluster and Near Field',
    hunt: 'storm-lit ice worlds', eligibleWorldTypes: ['ice'],
    titanColorIndex: 4, battlefieldWorldField: 'ice',
  }),
  signature({
    id: 'life', element: 'Poison', tier: 2, minimumRegionIndex: 1,
    icon: '☠️', signatureName: 'Poison Signature', verb: 'Conquer',
    guardianName: 'Venomroyne, the Blight Mother',
    hint: 'a virulent, toxic biosphere',
    lore: 'Venomroyne festers at the heart of a poisoned canopy, mother to a thousand toxins. End it, take the Poison.',
    reach: 'the middle reach — the tainted worlds farther out',
    hunt: 'toxic hothouse worlds', eligibleWorldTypes: ['venus'],
    titanColorIndex: 0, battlefieldWorldField: null,
  }),
  signature({
    id: 'void', element: 'Void', tier: 3, minimumRegionIndex: 2,
    icon: '🕳️', signatureName: 'Void Signature', verb: 'Conquer',
    guardianName: 'Nullreth, the Devourer',
    hint: 'a world at the edge of a black hole or anomaly',
    lore: 'Nullreth feeds where light itself is swallowed, out past the Deep Field. Deny it, take the Void.',
    reach: 'far out — the dark places beyond the Deep Field',
    hunt: 'worlds at a black hole’s edge', eligibleWorldTypes: [],
    titanColorIndex: 9, battlefieldWorldField: null,
  }),
  signature({
    id: 'prism', element: 'Prism', tier: 3, minimumRegionIndex: 2,
    icon: '🔮', signatureName: 'Prism Signature', verb: 'Conquer',
    guardianName: 'Iridax, the Spectral Paragon',
    hint: 'a unique prismatic world at the trail’s end',
    lore: 'Iridax is a color no one has named, waiting at the farthest edge of the sky. Claim it, and the Frontier itself opens.',
    reach: 'the farthest reach — the trail’s end',
    hunt: 'prismatic worlds at the frontier', eligibleWorldTypes: ['terran'],
    titanColorIndex: 16, battlefieldWorldField: null,
  }),
]);

const SIGNATURE_BY_ID = new Map(PRIME_SIGNATURES_V1.map((row) => [row.id, row] as const));
const WORLD_TYPE_SIGNATURE = new Map<string, PrimeSignatureIdV1>();
for (const row of PRIME_SIGNATURES_V1) {
  for (const worldType of row.eligibleWorldTypes) WORLD_TYPE_SIGNATURE.set(worldType, row.id);
}

/** Runtime-proven full CF1 identity. Structural lookalikes are deliberately
 * rejected by `projectGuardianPrimeEncounterV1`; combat must consume the one
 * universe authority rather than minting a parallel leaf-seed address. */
export type GuardianPrimeWorldIdentityV1 = RegisteredCF1WorldAddress;

export interface GuardianPrimeWorldDescriptorV1 {
  readonly worldType: string;
}

export interface GuardianPrimeFaunaV1 {
  readonly speciesId: string;
  readonly genome: Genome;
}

export interface GuardianPrimeEncounterInputV1 {
  readonly world: GuardianPrimeWorldIdentityV1;
  readonly descriptor: GuardianPrimeWorldDescriptorV1;
  readonly regionIndex: number;
  readonly faunaRoster: readonly GuardianPrimeFaunaV1[];
  readonly claimedSignatureIds: readonly PrimeSignatureIdV1[];
  readonly conquered: boolean;
}

export interface OrdinaryGuardianIdentityV1 {
  readonly kind: 'guardian';
  readonly sourceId: string;
  readonly worldSeed: number;
  readonly name: string;
  readonly tier: number;
  readonly genome: Readonly<Genome>;
}

export interface TitanPlacementFactV1 {
  readonly signatureId: PrimeSignatureIdV1;
  readonly minimumRegionIndex: number;
  readonly worldTypeEligible: boolean;
  readonly regionEligible: boolean;
  readonly seededPresent: boolean;
  readonly claimed: boolean;
  readonly present: boolean;
  readonly selected: boolean;
}

export type PrimeResonanceStateV1 = 'beyond-charter' | 'strong' | 'faint' | 'whisper';

export interface PrimeResonanceFactV1 {
  readonly signatureId: PrimeSignatureIdV1;
  readonly minimumRegionIndex: number;
  readonly hunt: string;
  readonly reachable: boolean;
  readonly state: PrimeResonanceStateV1;
}

export type GuardianPrimeDefenderKindV1 = 'titan' | 'guardian' | 'fauna';

export interface GuardianPrimeDefenderV1 {
  readonly kind: GuardianPrimeDefenderKindV1;
  readonly sourceId: string;
  readonly name: string;
  readonly tier: number;
  readonly regionIndex: number;
  readonly signatureId: PrimeSignatureIdV1 | null;
  readonly battleGenome: Readonly<Genome>;
  readonly capturableGenome: Readonly<Genome> | null;
  readonly power: number;
}

export interface GuardianPrimeEncounterIdentityV1 {
  readonly schema: typeof GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1;
  readonly world: GuardianPrimeWorldIdentityV1;
  readonly worldType: string;
  readonly regionIndex: number;
  /** Canonical Prime-order suppression authority consumed by defender
   * selection. A later settlement must join this exact set to its save. */
  readonly claimedSignatureIds: readonly PrimeSignatureIdV1[];
  readonly conquered: false;
  readonly defenderKind: GuardianPrimeDefenderKindV1;
  readonly defenderSourceId: string;
  readonly signatureId: PrimeSignatureIdV1 | null;
}

export interface GuardianPrimeEncounterV1 {
  readonly identity: GuardianPrimeEncounterIdentityV1;
  readonly defender: GuardianPrimeDefenderV1;
  /** Canonical, complete semantic input for a later receipt digest. */
  readonly witness: string;
}

const GUARDIAN_PRIME_ENCOUNTERS_V1 = new WeakSet<object>();

/** Runtime authority check for downstream settlement. A structural clone may
 * retain every visible field, but it cannot become an encounter producer. */
export function isGuardianPrimeEncounterV1(value: unknown): value is GuardianPrimeEncounterV1 {
  return typeof value === 'object'
    && value !== null
    && GUARDIAN_PRIME_ENCOUNTERS_V1.has(value)
    && (value as GuardianPrimeEncounterV1).identity.schema === GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1;
}

function integer(value: number, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function uint32(value: number, label: string): number {
  return integer(value, label, 0xffff_ffff);
}

function checkedWorld(world: GuardianPrimeWorldIdentityV1): GuardianPrimeWorldIdentityV1 {
  if (!isRegisteredCF1WorldAddress(world)) {
    throw new TypeError('Guardian encounter requires a registered canonical CF1 world address');
  }
  return world;
}

function worldTypeOf(descriptor: GuardianPrimeWorldDescriptorV1): string {
  if (typeof descriptor.worldType !== 'string'
    || descriptor.worldType.length === 0
    || descriptor.worldType.length > 64) {
    throw new TypeError('world type must be a non-empty bounded string');
  }
  return descriptor.worldType;
}

function claimedSet(ids: readonly PrimeSignatureIdV1[]): ReadonlySet<PrimeSignatureIdV1> {
  const result = new Set<PrimeSignatureIdV1>();
  for (const id of ids) {
    if (!SIGNATURE_BY_ID.has(id)) throw new TypeError(`unknown Prime Signature id: ${String(id)}`);
    if (result.has(id)) throw new TypeError(`duplicate Prime Signature id: ${id}`);
    result.add(id);
  }
  return result;
}

function cloneData(value: unknown): unknown {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Guardian encounter genome contains a non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(cloneData);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) result[key] = cloneData(child);
    }
    return result;
  }
  throw new TypeError('Guardian encounter genome contains unsupported data');
}

function deepFreezeData<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreezeData(child);
    Object.freeze(value);
  }
  return value;
}

function cloneGenome(genome: Readonly<Genome>): Genome {
  return cloneData(genome) as Genome;
}

function stripBattlefieldModifiers(genome: Genome): Readonly<Genome> {
  const portable = cloneGenome(genome);
  delete portable._mult;
  delete portable._wf;
  return deepFreezeData(portable);
}

function freezeBattleGenome(genome: Genome): Readonly<Genome> {
  return deepFreezeData(cloneGenome(genome));
}

function seededTitanPresent(planetSeed: number, signatureId: PrimeSignatureIdV1): boolean {
  const salt = signatureId === 'void' ? 0x5d : signatureId.charCodeAt(0);
  return mulberry32(hashInt(planetSeed >>> 0, 0x7174, salt) >>> 0)() < 0.085;
}

function selectedTitanId(
  planetSeed: number,
  worldType: string,
  regionIndex: number,
  claimed: ReadonlySet<PrimeSignatureIdV1>,
): PrimeSignatureIdV1 | null {
  const available = (id: PrimeSignatureIdV1): boolean => {
    const definition = SIGNATURE_BY_ID.get(id)!;
    return !claimed.has(id)
      && regionIndex >= definition.minimumRegionIndex
      && seededTitanPresent(planetSeed, id);
  };
  if (available('void')) return 'void';
  const nature = WORLD_TYPE_SIGNATURE.get(worldType) ?? null;
  return nature !== null && available(nature) ? nature : null;
}

/** Exact immutable projection of the lifted legacy `guardianFor` identity. */
export function projectOrdinaryGuardianV1(worldSeed: number): OrdinaryGuardianIdentityV1 | null {
  const seed = uint32(worldSeed, 'guardian world seed');
  const guardian: Guardian | null = guardianFor(seed);
  if (guardian === null) return null;
  return Object.freeze({
    kind: 'guardian',
    sourceId: `guardian:${seed}`,
    worldSeed: seed,
    name: guardian.name,
    tier: guardian.tier,
    genome: stripBattlefieldModifiers(guardian.genome),
  });
}

/** All nine world-local placement facts. `selected` preserves legacy Void-first priority. */
export function projectTitanPlacementFactsV1(input: Readonly<{
  planetSeed: number;
  worldType: string;
  regionIndex: number;
  claimedSignatureIds: readonly PrimeSignatureIdV1[];
}>): readonly TitanPlacementFactV1[] {
  const planetSeed = uint32(input.planetSeed, 'Titan planet seed');
  const worldType = worldTypeOf({ worldType: input.worldType });
  const regionIndex = integer(input.regionIndex, 'Titan region index', 5);
  const claimed = claimedSet(input.claimedSignatureIds);
  const selected = selectedTitanId(planetSeed, worldType, regionIndex, claimed);
  const nature = WORLD_TYPE_SIGNATURE.get(worldType) ?? null;
  return Object.freeze(PRIME_SIGNATURES_V1.map((definition) => {
    const worldTypeEligible = definition.id === 'void' || nature === definition.id;
    const regionEligible = regionIndex >= definition.minimumRegionIndex;
    const seededPresent = seededTitanPresent(planetSeed, definition.id);
    const isClaimed = claimed.has(definition.id);
    const present = worldTypeEligible && regionEligible && seededPresent && !isClaimed;
    return Object.freeze({
      signatureId: definition.id,
      minimumRegionIndex: definition.minimumRegionIndex,
      worldTypeEligible,
      regionEligible,
      seededPresent,
      claimed: isClaimed,
      present,
      selected: selected === definition.id,
    });
  }));
}

/** Pure projection of legacy `_sigResonance` state, without rendering copy or navigation. */
export function projectPrimeResonanceV1(input: Readonly<{
  signatureId: PrimeSignatureIdV1;
  ascentStage: number;
  reachableRegionIndex: number;
}>): PrimeResonanceFactV1 {
  const definition = SIGNATURE_BY_ID.get(input.signatureId);
  if (definition === undefined) throw new TypeError(`unknown Prime Signature id: ${String(input.signatureId)}`);
  const ascentStage = integer(input.ascentStage, 'Ascent stage');
  const reachableRegionIndex = integer(input.reachableRegionIndex, 'reachable region index', 5);
  const state: PrimeResonanceStateV1 = ascentStage < 3
    ? 'beyond-charter'
    : definition.minimumRegionIndex <= reachableRegionIndex
      ? 'strong'
      : definition.minimumRegionIndex - reachableRegionIndex === 1
        ? 'faint'
        : 'whisper';
  return Object.freeze({
    signatureId: definition.id,
    minimumRegionIndex: definition.minimumRegionIndex,
    hunt: definition.hunt,
    reachable: state === 'strong',
    state,
  });
}

function titanDefender(
  definition: PrimeSignatureDefinitionV1,
  planetSeed: number,
  regionIndex: number,
): GuardianPrimeDefenderV1 {
  const heat = definition.id === 'flame' ? 2 : (definition.id === 'mind' || definition.id === 'void') ? 0 : 1;
  const battleGenome = makeGenome(hashInt(planetSeed >>> 0, 0x7174, 0x99) >>> 0, 'fauna', heat);
  battleGenome.size = 5;
  battleGenome.lumin = true;
  battleGenome.wild = 1;
  battleGenome.apex = 14;
  battleGenome._titan = definition.id;
  battleGenome.color = definition.titanColorIndex;
  if (definition.battlefieldWorldField !== null) battleGenome._wf = definition.battlefieldWorldField;
  battleGenome._mult = 1.15 + regionIndex * 0.03;
  const frozenBattle = freezeBattleGenome(battleGenome);
  const capturable = stripBattlefieldModifiers(battleGenome);
  return Object.freeze({
    kind: 'titan',
    sourceId: `titan:${definition.id}:${planetSeed}`,
    name: definition.guardianName,
    tier: 14,
    regionIndex,
    signatureId: definition.id,
    battleGenome: frozenBattle,
    capturableGenome: capturable,
    power: battleStats(frozenBattle).total,
  });
}

function guardianDefender(
  guardian: OrdinaryGuardianIdentityV1,
  regionIndex: number,
): GuardianPrimeDefenderV1 {
  const battleGenome = cloneGenome(guardian.genome as Genome);
  if (regionIndex > 0) battleGenome._mult = 1 + regionIndex * 0.14;
  const frozenBattle = freezeBattleGenome(battleGenome);
  return Object.freeze({
    kind: 'guardian',
    sourceId: guardian.sourceId,
    name: guardian.name,
    tier: guardian.tier,
    regionIndex,
    signatureId: null,
    battleGenome: frozenBattle,
    capturableGenome: stripBattlefieldModifiers(battleGenome),
    power: battleStats(frozenBattle).total,
  });
}

function faunaDefender(
  row: GuardianPrimeFaunaV1,
  worldType: string,
  regionIndex: number,
): GuardianPrimeDefenderV1 {
  const battleGenome = cloneGenome(row.genome);
  delete battleGenome._mult;
  delete battleGenome._wf;
  const multiplier = 1 + regionIndex * 0.14;
  if (multiplier > 1) battleGenome._mult = multiplier;
  if (worldType === 'lava' || worldType === 'ice' || worldType === 'gas'
    || worldType === 'ocean' || worldType === 'desert') battleGenome._wf = worldType;
  const frozenBattle = freezeBattleGenome(battleGenome);
  const stats = battleStats(frozenBattle);
  return Object.freeze({
    kind: 'fauna',
    sourceId: row.speciesId,
    name: describeSpecies(row.genome).name,
    tier: stats.tier,
    regionIndex,
    signatureId: null,
    battleGenome: frozenBattle,
    capturableGenome: null,
    power: stats.total,
  });
}

function selectDefender(
  input: GuardianPrimeEncounterInputV1,
  world: GuardianPrimeWorldIdentityV1,
  worldType: string,
  regionIndex: number,
  claimed: ReadonlySet<PrimeSignatureIdV1>,
): GuardianPrimeDefenderV1 | null {
  if (input.conquered) return null;
  const titanId = selectedTitanId(world.planet.seed, worldType, regionIndex, claimed);
  if (titanId !== null) return titanDefender(SIGNATURE_BY_ID.get(titanId)!, world.planet.seed, regionIndex);

  const fauna = input.faunaRoster.filter((row) => row.genome.kingdom === 'fauna');
  if (fauna.length === 0) return null;
  const guardian = projectOrdinaryGuardianV1(world.planet.seed);
  if (guardian !== null) return guardianDefender(guardian, regionIndex);

  let strongest = fauna[0]!;
  let strongestPower = battleStats(stripBattlefieldModifiers(strongest.genome)).total;
  for (let index = 1; index < fauna.length; index++) {
    const candidate = fauna[index]!;
    const power = battleStats(stripBattlefieldModifiers(candidate.genome)).total;
    if (power > strongestPower) {
      strongest = candidate;
      strongestPower = power;
    }
  }
  return faunaDefender(strongest, worldType, regionIndex);
}

interface CanonicalObject {
  readonly [key: string]: CanonicalValue;
}

type CanonicalValue = null | boolean | number | string | readonly CanonicalValue[] | CanonicalObject;

function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Guardian encounter witness contains a non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return Object.freeze(value.map(canonicalize));
  if (typeof value === 'object') {
    const result: Record<string, CanonicalValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child === undefined) continue;
      result[key] = canonicalize(child);
    }
    return Object.freeze(result);
  }
  throw new TypeError('Guardian encounter witness contains unsupported data');
}

function encounterIdentity(
  world: GuardianPrimeWorldIdentityV1,
  worldType: string,
  regionIndex: number,
  claimedSignatureIds: readonly PrimeSignatureIdV1[],
  defender: GuardianPrimeDefenderV1,
): GuardianPrimeEncounterIdentityV1 {
  return Object.freeze({
    schema: GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1,
    world,
    worldType,
    regionIndex,
    claimedSignatureIds,
    conquered: false as const,
    defenderKind: defender.kind,
    defenderSourceId: defender.sourceId,
    signatureId: defender.signatureId,
  });
}

/**
 * Select the exact legacy defender and bind its complete semantic identity.
 * Returns null when the world is conquered or no eligible Titan/Guardian/fauna
 * defender exists. No gameplay RNG is consumed beyond the legacy seed-local
 * presence and identity derivations.
 */
export function projectGuardianPrimeEncounterV1(
  input: GuardianPrimeEncounterInputV1,
): GuardianPrimeEncounterV1 | null {
  const world = checkedWorld(input.world);
  const worldType = worldTypeOf(input.descriptor);
  const regionIndex = integer(input.regionIndex, 'encounter region index', 5);
  const claimed = claimedSet(input.claimedSignatureIds);
  const claimedSignatureIds = Object.freeze(PRIME_SIGNATURE_IDS_V1.filter((id) => claimed.has(id)));
  const defender = selectDefender(input, world, worldType, regionIndex, claimed);
  if (defender === null) return null;
  const identity = encounterIdentity(world, worldType, regionIndex, claimedSignatureIds, defender);
  const witness = JSON.stringify(canonicalize({
    identity,
    defender: {
      kind: defender.kind,
      sourceId: defender.sourceId,
      name: defender.name,
      tier: defender.tier,
      signatureId: defender.signatureId,
      battleGenome: defender.battleGenome,
      capturableGenome: defender.capturableGenome,
      power: defender.power,
    },
  }));
  const encounter = Object.freeze({ identity, defender, witness });
  GUARDIAN_PRIME_ENCOUNTERS_V1.add(encounter);
  return encounter;
}
