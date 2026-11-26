/* What a landing's receipt says, and the check that what was stored is what the landing staged.

   The receipt's witness is the facts below, as JSON: the world, the descent as it was resolved (LEGACY
   celestial-frontier.html, v1.8.9, `_descRoll` 13438-13462), and for a landing the region it touched down in
   (`openLandingVista` 13558), the samples it paid (`grantFieldSamples` 13681-13695), the Charters and the Ascent
   it moved (`gameEvent` 25358-25363) and the achievements it unlocked (13473-13474).

   The check after storage follows the painted port's `verifyArc0LandingPostcommit` (`arc0-landing-action.ts`
   1310-1471) field by field: the receipt is this landing's, the state returned is the state stored, and every
   field the landing staged holds the staged value. Its hashed copies of the whole state and of each carrier are
   not carried: the fields a landing owns are compared directly. */
import { descentWaveOffCountV1, type FieldSampleLandingAuthority } from '@cf/domain-opportunity';
import type { SceneRoute } from '@cf/domain-landing';
import {
  loadDescentWaveOffAuthorityV1,
  readWorldIdentity,
  worldIdentityRecord,
  type F4DeterministicProductTransactionOutcome,
  type F4MultiOutcomeTransactionOutcome,
  type SaveStateV2,
  type V5ExtensionWrite,
} from '@cf/persistence';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import type { DescentSafeReasonV1 } from './descent-policy';

export const LANDING_RECEIPT_KIND_V1 = 'arc0-land' as const;
export const LANDING_WITNESS_SCHEMA_V1 = 'cf-v2-landing-witness/v1' as const;
/** A receipt's witness holds at most this many characters. */
const WITNESS_MAX_CHARS = 4_096;

export interface LandingDescentFactV1 {
  readonly kind: 'landed' | 'wave-off';
  /** Why no roll was made; null when the descent was rolled. */
  readonly safeReason: DescentSafeReasonV1;
  readonly stormActive: boolean;
  readonly successPercent: number;
  /** The random values this descent took: none, or success then damage. */
  readonly draws: 0 | 2;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly damage: number;
  readonly waveOffsBefore: number;
  readonly waveOffsAfter: number;
  /** A rolled landing on a world whose biome lands at 30 or less. */
  readonly throughTheFire: boolean;
  /** After a wave-off: the odds of the next attempt in the same weather. */
  readonly nextSuccessPercent: number | null;
}

export interface LandedFactV1 {
  /** The world is marked stood on. False only for a training landing away from Earth. */
  readonly permanent: boolean;
  /** A first landing after training: the deed Charters and the Ascent count, and field samples pay. */
  readonly deed: boolean;
  readonly region: { readonly key: string | null; readonly route: SceneRoute; readonly salt: number };
  readonly sample: { readonly stardust: number; readonly materials: readonly string[] } | null;
  readonly charters: { readonly progressIds: readonly string[]; readonly completedIds: readonly string[] };
  readonly ascent: { readonly banked: boolean; readonly chapterBefore: number; readonly chapterAfter: number };
  /** Achievements this landing unlocked. */
  readonly achievementIds: readonly string[];
}

export interface LandingFactsV1 {
  readonly schema: typeof LANDING_WITNESS_SCHEMA_V1;
  readonly receiptOrdinal: number;
  readonly worldKey: string;
  readonly planetSeed: number;
  readonly training: boolean;
  /** Whether the save already held this world as landed, exactly or by its seed alone. */
  readonly landing: FieldSampleLandingAuthority;
  readonly descent: LandingDescentFactV1;
  /** Null for a wave-off. */
  readonly landed: LandedFactV1 | null;
}

/** The values the landing staged in the fields it owns, to hold against what storage returns. */
export interface LandingExpectationV1 {
  readonly hp: number;
  readonly waveOffCount: number;
  readonly identityLanded: boolean;
  /** Null for a wave-off, which stages none of these. */
  readonly landed: null | {
    readonly permanent: boolean;
    readonly journalRow: SaveStateV2['journal'][number];
    readonly essence: number;
    readonly essenceEarned: number;
    readonly landings: number;
    readonly cargo: ReadonlyArray<readonly [string, number]>;
    readonly ascCh: number;
    readonly ascProg: Readonly<Record<string, number>>;
    readonly chDone: readonly string[];
    readonly unlocked: readonly string[];
  };
}

export interface StagedLandingV1 {
  readonly state: SaveStateV2;
  readonly extensionWrites: readonly V5ExtensionWrite[];
  readonly facts: LandingFactsV1;
  readonly expect: LandingExpectationV1;
}

/** What the two paths of the save runtime a landing uses answer; the stored state rides on a committed outcome. */
type Stored<O extends { readonly kind: string }> =
  | Exclude<O, { readonly kind: 'committed' }>
  | (Extract<O, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };
export type LandingTransactionV1 = Stored<F4DeterministicProductTransactionOutcome> | Stored<F4MultiOutcomeTransactionOutcome>;
export type LandingCommittedV1 = Extract<LandingTransactionV1, { readonly kind: 'committed' }>;

export function landingWitness(facts: LandingFactsV1): string {
  const encoded = JSON.stringify(facts);
  if (encoded.length > WITNESS_MAX_CHARS) throw new RangeError('landing witness exceeds its receipt bound');
  return encoded;
}

export type LandingMismatchV1 =
  | 'receipt' | 'state-not-stored' | 'health' | 'wave-offs' | 'world-identity' | 'landed-set' | 'stood-on-set'
  | 'journal' | 'samples' | 'ascent' | 'charters' | 'achievements';

const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

/** Null when the stored result is this landing's own; else the first thing that is not. */
export function verifyLandingPostcommit(input: Readonly<{
  transaction: LandingCommittedV1;
  address: CanonicalCF1WorldAddress;
  staged: StagedLandingV1;
}>): LandingMismatchV1 | null {
  const { transaction, address, staged } = input;
  const { facts, expect } = staged;
  const { state } = transaction;
  const seed = address.planet.seed;
  if (transaction.receipt.ordinal !== facts.receiptOrdinal || transaction.plan.receiptOrdinal !== facts.receiptOrdinal
    || transaction.receipt.kind !== LANDING_RECEIPT_KIND_V1 || transaction.receipt.witness !== landingWitness(facts)) return 'receipt';
  if (!same(state, transaction.saved.canonicalState)) return 'state-not-stored';
  if (state.hp !== expect.hp) return 'health';
  const waveOffs = loadDescentWaveOffAuthorityV1({ extensions: transaction.saved.extensions, legacyWaveOffs: state.waveOffs });
  if (waveOffs.kind !== 'loaded' || descentWaveOffCountV1(waveOffs.state, address) !== expect.waveOffCount
    || (state.waveOffs.find(([world]) => world === seed)?.[1] ?? 0) !== expect.waveOffCount) return 'wave-offs';
  const identity = readWorldIdentity(transaction.saved.extensions);
  if (identity.kind !== 'loaded' || (worldIdentityRecord(identity.state, address)?.landed === true) !== expect.identityLanded) return 'world-identity';
  const landed = expect.landed;
  if (landed === null) return null;
  if (landed.permanent && !state.landed.includes(seed)) return 'landed-set';
  if (landed.permanent && !state.surfSeen.includes(seed)) return 'stood-on-set';
  if (!same(state.journal.at(-1), landed.journalRow)) return 'journal';
  const cargo = new Map(state.cargo);
  if (state.essence !== landed.essence || (state.stats.essenceEarned ?? 0) !== landed.essenceEarned
    || (state.stats.landings ?? 0) !== landed.landings
    || landed.cargo.some(([id, quantity]) => cargo.get(id) !== quantity)) return 'samples';
  if (state.ascCh !== landed.ascCh || Object.entries(landed.ascProg).some(([goal, count]) => state.ascProg[goal] !== count)) return 'ascent';
  if (landed.chDone.some((id) => !state.chDone.includes(id))) return 'charters';
  if (landed.unlocked.some((id) => !state.unlocked.includes(id))) return 'achievements';
  return null;
}
