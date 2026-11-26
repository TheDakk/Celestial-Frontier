/* First-landing field samples, added to the hold.

   LEGACY celestial-frontier.html, v1.8.9, `grantFieldSamples` 13681-13695: a first landing after training, on any
   world but Earth (`noteLanding` 13192-13206), puts one of each of the world's first two deposits in the cargo,
   pays 3 + 2 × the world's tier in Stardust (counted in the Stardust earned too) and raises `stats.landings`
   by one. The tier is the one the survey card shows, after the ring's cap (`ringDesignation`, 13728).

   Whether a landing earns samples, and which, is `projectFieldSamples` of `@cf/domain-opportunity`. This file
   adds them to the three fields they touch. The legacy game adds without a ceiling and holds a material to
   1,000,000 and the Stardust to 1,000,000,000 when the save is next read (16710, and the Stardust's own clamp
   beside it); the same two ceilings are kept here at once, so a full hold never refuses a landing. Ported from
   the painted port's `arc0-field-samples.ts`, which refused the whole landing at a ceiling and checked the shape
   of its own input; neither is carried. */
import {
  projectFieldSamples,
  type FieldSampleLandingAuthority,
  type FieldSampleReward,
  type FieldSampleSuppressionReason,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import type { CanonicalCF1WorldAddress } from '@cf/scene';

export const FIELD_SAMPLE_CARGO_MAX = 1_000_000;
export const FIELD_SAMPLE_STARDUST_MAX = 1_000_000_000;

export interface FieldSampleFields {
  readonly cargo: ReadonlyArray<readonly [string, number]>;
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
}

export type FieldSampleDerivation =
  | Readonly<{ kind: 'ready'; fields: { cargo: Array<[string, number]>; essence: number; stats: Record<string, number> }; reward: FieldSampleReward }>
  | Readonly<{ kind: 'unchanged'; reason: FieldSampleSuppressionReason }>;

/** The cargo, Stardust and stats after this landing's samples; `unchanged` when the landing earns none. Throws
    when the address and the world's facts are not one registered world. */
export function deriveFieldSamples(input: Readonly<{
  source: FieldSampleFields;
  address: CanonicalCF1WorldAddress;
  opportunity: WorldOpportunitySnapshot;
  landing: FieldSampleLandingAuthority;
  training: boolean;
}>): FieldSampleDerivation {
  const projection = projectFieldSamples({
    address: input.address, opportunity: input.opportunity, landing: input.landing, training: input.training,
  });
  if (projection.kind === 'suppressed') return { kind: 'unchanged', reason: projection.reason };
  const { reward } = projection;
  const cargo = new Map<string, number>(input.source.cargo);
  for (const material of reward.materials) {
    cargo.set(material.id, Math.min(FIELD_SAMPLE_CARGO_MAX, (cargo.get(material.id) ?? 0) + material.quantity));
  }
  const { stats } = input.source;
  return {
    kind: 'ready',
    fields: {
      cargo: [...cargo.entries()],
      essence: Math.min(FIELD_SAMPLE_STARDUST_MAX, input.source.essence + reward.stardust),
      stats: { ...stats, essenceEarned: (stats.essenceEarned ?? 0) + reward.stardust, landings: (stats.landings ?? 0) + 1 },
    },
    reward,
  };
}
