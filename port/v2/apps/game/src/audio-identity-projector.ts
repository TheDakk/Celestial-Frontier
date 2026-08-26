/* Arc 7 app-owned creature -> audible-identity adapter.

   The ownership model decides which exact individual is live. This adapter
   reads that registered row and projects only immutable sound identity into
   @cf/audio's existing pure resolver. It owns no save writer, gameplay RNG,
   AudioContext, companion policy, or playback lifecycle. */
import {
  audioRouteManifestRow,
  createAudioIdentityProfile,
  createAudioSignature,
  createCreatureCallPlan,
  isAudioKingdom,
  type AudioIdentityProfile,
  type AudioKingdom,
  type AudioSignature,
  type CanonicalAudioOwner,
  type CreatureCallPlan,
  type ImmutableAudioPhenotype,
  type OrderedParentSeeds,
} from '@cf/audio';
import {
  isOwnershipStateV2,
  type CanonicalGenomeV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';

const MAX_AUDIO_GENE = 0xFFFF;
const MAX_UINT32 = 0xFFFF_FFFF;

export type OwnedCreatureAudioIdentityUnavailableReason =
  | 'ownership-unregistered'
  | 'ownership-protected'
  | 'creature-not-live'
  | 'phenotype-invalid'
  | 'owner-invalid'
  | 'lineage-invalid'
  | 'resolver-rejected';

export type OwnedCreatureAudioIdentityProjection =
  | Readonly<{
      readonly kind: 'projected';
      /** Lookup receipt only; it is deliberately absent from AudioSignature. */
      readonly creatureId: CreatureInstanceId;
      readonly signature: AudioSignature;
      readonly profile: AudioIdentityProfile;
      readonly callPlan: CreatureCallPlan;
    }>
  | Readonly<{
      readonly kind: 'unavailable';
      readonly reason: OwnedCreatureAudioIdentityUnavailableReason;
    }>;

type OwnerProjection = Readonly<{
  readonly owner: CanonicalAudioOwner;
  readonly anchorBasisPoints: number | null;
}>;

type LineageProjection =
  | Readonly<{ readonly ok: true; readonly parentSeeds: OrderedParentSeeds | null }>
  | Readonly<{ readonly ok: false }>;

function unavailable(
  reason: OwnedCreatureAudioIdentityUnavailableReason,
): OwnedCreatureAudioIdentityProjection {
  return Object.freeze({ kind: 'unavailable', reason });
}

function boundedInteger(value: unknown, maximum: number): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= maximum
    ? value as number
    : null;
}

function selectedGene(
  genome: CanonicalGenomeV1,
  key: string,
  bredLegacyDefault = false,
): number | null {
  // The byte-pinned legacy crossGenome never emitted these later descriptor
  // genes. Every existing descriptor reader gives an absent value index 0;
  // retain exactly that meaning only for an authority-registered bred row.
  if (bredLegacyDefault && !Object.hasOwn(genome, key)) return 0;
  return boundedInteger(genome[key], MAX_AUDIO_GENE);
}

function projectPhenotype(creature: CreatureInstanceV1): ImmutableAudioPhenotype | null {
  const genome = creature.genome;
  const seed = boundedInteger(genome.seed, MAX_UINT32);
  if (seed === null || !isAudioKingdom(genome.kingdom) || typeof genome.lumin !== 'boolean') {
    return null;
  }
  const heat = genome.heat;
  if (typeof heat !== 'number' || !Number.isFinite(heat) || heat < 0 || heat > 2) {
    return null;
  }
  const color = selectedGene(genome, 'color');
  const accent = selectedGene(genome, 'accent');
  const form = selectedGene(genome, 'form');
  const body = selectedGene(genome, 'body');
  const loco = selectedGene(genome, 'loco');
  const trait = selectedGene(genome, 'trait');
  const size = selectedGene(genome, 'size');
  const diet = selectedGene(genome, 'diet');
  const head = selectedGene(genome, 'head');
  const limbs = selectedGene(genome, 'limbs');
  const skin = selectedGene(genome, 'skin');
  const tail = selectedGene(genome, 'tail');
  const pattern = selectedGene(genome, 'pattern');
  const behavior = selectedGene(genome, 'behavior');
  const habitat = selectedGene(genome, 'habitat');
  const bredLegacyDefault = creature.origin === 'bred';
  const temper = selectedGene(genome, 'temper', bredLegacyDefault);
  const sense = selectedGene(genome, 'sense', bredLegacyDefault);
  const metab = selectedGene(genome, 'metab', bredLegacyDefault);
  if (color === null || accent === null || form === null || body === null
    || loco === null || trait === null || size === null || diet === null
    || head === null || limbs === null || skin === null || tail === null
    || pattern === null || behavior === null || habitat === null
    || temper === null || sense === null || metab === null) return null;

  return Object.freeze({
    seed,
    kingdom: genome.kingdom,
    color,
    accent,
    form,
    body,
    loco,
    trait,
    size,
    diet,
    head,
    limbs,
    skin,
    tail,
    pattern,
    behavior,
    habitat,
    temper,
    sense,
    metab,
    lumin: genome.lumin,
    heatBand: Math.round(heat) as 0 | 1 | 2,
  });
}

function approvedOwnerRoute(kingdom: AudioKingdom, name: unknown): string | null {
  if (typeof name !== 'string') return null;
  try {
    return audioRouteManifestRow(kingdom, name) ? name : null;
  } catch {
    return null;
  }
}

function projectOwner(
  genome: CanonicalGenomeV1,
  phenotypeKingdom: AudioKingdom,
): OwnerProjection | null {
  const hasEarthName = Object.hasOwn(genome, '_earthName');
  const hasEarthBlend = Object.hasOwn(genome, '_earthBlend');
  const hasEarthBlendKingdom = Object.hasOwn(genome, '_earthBlendKingdom');
  const hasAnchor = Object.hasOwn(genome, '_anchorVal');

  if (hasEarthName) {
    if (hasEarthBlend || hasEarthBlendKingdom || hasAnchor) return null;
    const name = approvedOwnerRoute(phenotypeKingdom, genome._earthName);
    return name === null ? null : Object.freeze({
      owner: Object.freeze({ route: 'catalogue', kingdom: phenotypeKingdom, name }),
      anchorBasisPoints: null,
    });
  }

  if (hasEarthBlend || hasEarthBlendKingdom || hasAnchor) {
    if (!hasEarthBlend || !hasEarthBlendKingdom || !hasAnchor
      || !isAudioKingdom(genome._earthBlendKingdom)) return null;
    const ownerKingdom = genome._earthBlendKingdom;
    const name = approvedOwnerRoute(ownerKingdom, genome._earthBlend);
    const anchor = genome._anchorVal;
    if (name === null || typeof anchor !== 'number' || !Number.isFinite(anchor)
      || anchor < 0 || anchor > 1) return null;
    const quantizedAnchor = Math.round(anchor * 10_000);
    return Object.freeze({
      owner: Object.freeze({ route: 'lineage', kingdom: ownerKingdom, name }),
      anchorBasisPoints: quantizedAnchor === 0 ? 0 : quantizedAnchor,
    });
  }

  return Object.freeze({
    owner: Object.freeze({ route: 'procedural', kingdom: phenotypeKingdom, name: null }),
    anchorBasisPoints: null,
  });
}

function checkedParentSeeds(value: readonly number[]): OrderedParentSeeds | null {
  if (value.length !== 2
    || boundedInteger(value[0], MAX_UINT32) === null
    || boundedInteger(value[1], MAX_UINT32) === null) return null;
  return Object.freeze([value[0]!, value[1]!] as const);
}

function projectLineage(
  state: OwnershipStateV2,
  creature: CreatureInstanceV1,
): LineageProjection {
  if (creature.lineage.kind === 'none') {
    return Object.freeze({ ok: true, parentSeeds: null });
  }
  if (creature.lineage.kind === 'legacy-parent-seeds') {
    const parentSeeds = checkedParentSeeds(creature.lineage.parentSeeds);
    return parentSeeds === null
      ? Object.freeze({ ok: false })
      : Object.freeze({ ok: true, parentSeeds });
  }

  const acquisition = state.bredAcquisitions.find((row) => (
    row.recordId === creature.acquisitionRecordId
  ));
  if (!acquisition || acquisition.speciesId !== creature.speciesId
    || acquisition.provenance.parentCreatureIds[0] !== creature.lineage.parentCreatureIds[0]
    || acquisition.provenance.parentCreatureIds[1] !== creature.lineage.parentCreatureIds[1]) {
    return Object.freeze({ ok: false });
  }
  const parentSeeds = checkedParentSeeds(acquisition.provenance.parentSeeds);
  return parentSeeds === null
    ? Object.freeze({ ok: false })
    : Object.freeze({ ok: true, parentSeeds });
}

/** Resolve one exact live owned individual into the existing pure Arc 7
 * signature/profile/call-plan pipeline. Every unavailable case is silent and
 * read-only; the caller must never substitute a tombstone, species row, loose
 * genome, or display alias. */
export function projectOwnedCreatureAudioIdentity(
  state: OwnershipStateV2,
  creatureId: CreatureInstanceId,
): OwnedCreatureAudioIdentityProjection {
  if (!isOwnershipStateV2(state)) return unavailable('ownership-unregistered');
  if (state.mode !== 'current') return unavailable('ownership-protected');
  const creature = state.creatures.find((row) => row.creatureId === creatureId);
  if (!creature) return unavailable('creature-not-live');

  const phenotype = projectPhenotype(creature);
  if (!phenotype) return unavailable('phenotype-invalid');
  const owner = projectOwner(creature.genome, phenotype.kingdom);
  if (!owner) return unavailable('owner-invalid');
  const lineage = projectLineage(state, creature);
  if (!lineage.ok) return unavailable('lineage-invalid');

  try {
    const signature = createAudioSignature({
      owner: owner.owner,
      phenotype,
      lineage: Object.freeze({
        parentSeeds: lineage.parentSeeds,
        anchorBasisPoints: owner.anchorBasisPoints,
      }),
    });
    const profile = createAudioIdentityProfile(signature);
    const callPlan = createCreatureCallPlan(profile);
    return Object.freeze({
      kind: 'projected',
      creatureId: creature.creatureId,
      signature,
      profile,
      callPlan,
    });
  } catch {
    return unavailable('resolver-rejected');
  }
}
