/* Fixed review inputs, not a new catalogue, phenotype classifier or breeding
   owner. Earth inputs use audit.ts's existing catalogue recipe; procedural and
   hybrid inputs use the unchanged genome/genetics owners. Portrait delivery
   consumes the complete detached genome and its existing visual key. */
import { _EARTH_NAMES } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { hashInt } from '@cf/domain-rand';
import {
  snapshotSpeciesGenome,
  speciesVisualKey,
  type SpeciesVisualKey,
} from '@cf/art/species-identity';
import { recursivelyFreezeVisualPolicyV1 } from './visual-policy-contract.js';

export const PILOT_PORTRAIT_SIZES_V1 = Object.freeze([132, 300, 440] as const);
export type PilotPortraitSizeV1 = typeof PILOT_PORTRAIT_SIZES_V1[number];
export const PILOT_BODY_PLANS_V1 = Object.freeze([
  'quadruped', 'biped', 'avian', 'serpentine', 'arthropod', 'tentacled', 'aquatic', 'flora-fungus',
] as const);
export type PilotBodyPlanV1 = typeof PILOT_BODY_PLANS_V1[number];
export type PilotKingdomV1 = keyof typeof _EARTH_NAMES;

export type PilotParentSourceV1 =
  | Readonly<{
    kind: 'earth-catalogue'; kingdom: PilotKingdomV1; name: string;
    catalogueIndex: number; seed: number; heat: 1;
  }>
  | Readonly<{ kind: 'procedural'; kingdom: PilotKingdomV1; seed: number; heat: number }>;
export type PilotSpecimenSourceV1 = PilotParentSourceV1
  | Readonly<{ kind: 'hybrid'; left: PilotParentSourceV1; right: PilotParentSourceV1 }>;

export interface PilotSpecimenV1 {
  readonly id: string;
  readonly family: PilotBodyPlanV1;
  readonly label: string;
  readonly familyBasis: string;
  readonly source: PilotSpecimenSourceV1;
  readonly genome: Readonly<Genome>;
  readonly visualKey: SpeciesVisualKey;
  readonly anatomicalAnimation: 'incomplete';
  readonly staticFallback: true;
  readonly animationLimitation: string;
}

function parentGenome(source: PilotParentSourceV1): Genome {
  if (source.kind === 'procedural') return makeGenome(source.seed, source.kingdom, source.heat);
  const pool = _EARTH_NAMES[source.kingdom];
  const kingdomIndex = Object.keys(_EARTH_NAMES).indexOf(source.kingdom);
  if (pool.indexOf(source.name) !== source.catalogueIndex
    || (hashInt(0xEA47, source.catalogueIndex, kingdomIndex) >>> 0) !== source.seed) {
    throw new Error(`Pilot Earth identity no longer matches the canonical audit recipe: ${source.name}`);
  }
  return { ...makeGenome(source.seed, source.kingdom, source.heat), _earthName: source.name };
}

function specimen(
  id: string, family: PilotBodyPlanV1, label: string, familyBasis: string,
  source: PilotSpecimenSourceV1,
): PilotSpecimenV1 {
  const generated = source.kind === 'hybrid'
    ? crossGenome(parentGenome(source.left), parentGenome(source.right))
    : parentGenome(source);
  const genome = snapshotSpeciesGenome(generated) as Genome;
  return recursivelyFreezeVisualPolicyV1({
    id, family, label, familyBasis, source, genome,
    visualKey: speciesVisualKey(genome),
    anatomicalAnimation: 'incomplete' as const,
    staticFallback: true as const,
    animationLimitation: 'The protected portrait is retained. Anatomical animation has not been proved for this specimen.',
  });
}

const earth = (name: string, catalogueIndex: number, seed: number): PilotParentSourceV1 => ({
  kind: 'earth-catalogue', kingdom: 'fauna', name, catalogueIndex, seed, heat: 1,
});

export const PILOT_SPECIMENS_V1: readonly PilotSpecimenV1[] = Object.freeze([
  specimen('wolf', 'quadruped', 'Wolf', 'Named Earth Wolf portrait; quadruped review bucket.',
    earth('Wolf', 105, 792844710)),
  specimen('kangaroo', 'biped', 'Kangaroo', 'Named Earth Kangaroo portrait; bipedal hopper review bucket.',
    earth('Kangaroo', 563, 4108794714)),
  specimen('eagle-hybrid', 'avian', 'Eagle × procedural fauna 133',
    'Actual Eagle-lineage cross; the existing reviewed Eagle portrait owner retains its avian form.', {
      kind: 'hybrid', left: earth('Eagle', 30, 3837331972),
      right: { kind: 'procedural', kingdom: 'fauna', seed: 133, heat: 1 },
    }),
  specimen('serpentine-10', 'serpentine', 'Procedural serpentine · seed 10',
    'Unchanged body 4 / locomotion 15 inputs select the existing procedural snake portrait.',
    { kind: 'procedural', kingdom: 'fauna', seed: 10, heat: 1 }),
  specimen('dragonfly', 'arthropod', 'Dragonfly', 'Named Earth Dragonfly portrait; arthropod review bucket.',
    earth('Dragonfly', 192, 862555894)),
  specimen('octopus', 'tentacled', 'Octopus', 'Named Earth Octopus portrait; tentacled review bucket.',
    earth('Octopus', 326, 6160491)),
  specimen('blue-whale', 'aquatic', 'Blue Whale', 'Named Earth Blue Whale portrait; aquatic review bucket.',
    earth('Blue Whale', 319, 2875388574)),
  specimen('fungus-42', 'flora-fungus', 'Procedural fungus · seed 42',
    'Unchanged fungi genome; the existing fungi portrait owner supplies the non-fauna comparison.',
    { kind: 'procedural', kingdom: 'fungi', seed: 42, heat: 1 }),
]);

export function getPilotSpecimenV1(id: string): PilotSpecimenV1 | null {
  return PILOT_SPECIMENS_V1.find((entry) => entry.id === id) ?? null;
}

