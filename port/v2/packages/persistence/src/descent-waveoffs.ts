/* V5 carrier for canonical descent wave-off progress.

   The v4 `waveOffs` array remains the compatibility/import mirror. On first
   use, its seed-only rows become explicit unresolved evidence; they are never
   mistaken for a complete world identity. Each selected success/failure
   yields one extension replacement plus the corresponding lossy v4 mirror so
   a later Landing action can commit both in its existing single receipt. */
import {
  createLegacyDescentWaveOffStateV1,
  decodeDescentWaveOffStateV1,
  descentWaveOffCountV1,
  encodeDescentWaveOffStateV1,
  projectLegacyDescentWaveOffMirrorV1,
  stageDescentWaveOffOutcomeV1,
  type DescentWaveOffOutcomeKindV1,
  type DescentWaveOffStateV1,
} from '@cf/domain-opportunity';
import {
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';

export const DESCENT_WAVE_OFF_SEGMENT_V1 = 'catalog' as const;
export const DESCENT_WAVE_OFF_NAMESPACE_V1 = 'descent.wave-offs' as const;
export const DESCENT_WAVE_OFF_CARRIER_VERSION_V1 = 1 as const;

export type DescentWaveOffProtectionReasonV1 =
  | 'extensions-corrupt'
  | 'wrong-segment'
  | 'future-version'
  | 'carrier-corrupt'
  | 'legacy-corrupt'
  | 'address-invalid'
  | 'outcome-impossible'
  | 'capacity'
  | 'extension-bounds';

export interface DescentWaveOffProtectionV1 {
  readonly kind: 'protected';
  readonly reason: DescentWaveOffProtectionReasonV1;
  readonly version?: number;
}

export type DescentWaveOffCarrierReadOutcomeV1 =
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'loaded'; readonly state: DescentWaveOffStateV1 }>
  | DescentWaveOffProtectionV1;

export type DescentWaveOffAuthorityLoadOutcomeV1 =
  | Readonly<{
    readonly kind: 'loaded';
    readonly source: 'current' | 'legacy-bootstrap';
    readonly state: DescentWaveOffStateV1;
    readonly extensions: V5Extensions;
  }>
  | DescentWaveOffProtectionV1;

export type DescentWaveOffMutationPreparationV1 =
  | Readonly<{
    readonly kind: 'prepared';
    readonly source: 'current' | 'legacy-bootstrap';
    readonly outcome: DescentWaveOffOutcomeKindV1;
    readonly countBefore: number;
    readonly countAfter: number;
    readonly state: DescentWaveOffStateV1;
    readonly write: V5ExtensionWrite;
    readonly writes: readonly V5ExtensionWrite[];
    readonly extensions: V5Extensions;
    readonly legacyWaveOffs: readonly (readonly [seed: number, count: number])[];
  }>
  | DescentWaveOffProtectionV1;

function protection(
  reason: DescentWaveOffProtectionReasonV1,
  version?: number,
): DescentWaveOffProtectionV1 {
  return Object.freeze({
    kind: 'protected', reason,
    ...(version === undefined ? {} : { version }),
  });
}

function canonicalExtensions(value: unknown): V5Extensions | null {
  try { return canonicalizeV5Extensions(value); }
  catch { return null; }
}

function wrongSegment(extensions: V5Extensions): boolean {
  return V5_SEGMENTS.some((segment) => segment !== DESCENT_WAVE_OFF_SEGMENT_V1
    && extensions[segment]?.[DESCENT_WAVE_OFF_NAMESPACE_V1] !== undefined);
}

function carrierFor(state: DescentWaveOffStateV1): V5ExtensionCarrier {
  return Object.freeze({
    version: DESCENT_WAVE_OFF_CARRIER_VERSION_V1,
    json: encodeDescentWaveOffStateV1(state),
  });
}

/** Classify only the canonical owner namespace; absence is distinct so the
 * caller can explicitly bootstrap the still-retained v4 mirror. */
export function readDescentWaveOffCarrierV1(
  extensionsValue: unknown,
): DescentWaveOffCarrierReadOutcomeV1 {
  const extensions = canonicalExtensions(extensionsValue);
  if (extensions === null) return protection('extensions-corrupt');
  if (wrongSegment(extensions)) return protection('wrong-segment');
  const carrier = extensions[DESCENT_WAVE_OFF_SEGMENT_V1]?.[DESCENT_WAVE_OFF_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'absent' });
  if (carrier.version > DESCENT_WAVE_OFF_CARRIER_VERSION_V1) {
    return protection('future-version', carrier.version);
  }
  if (carrier.version !== DESCENT_WAVE_OFF_CARRIER_VERSION_V1) {
    return protection('carrier-corrupt');
  }
  try {
    const state = decodeDescentWaveOffStateV1(carrier.json);
    if (encodeDescentWaveOffStateV1(state) !== carrier.json) {
      return protection('carrier-corrupt');
    }
    return Object.freeze({ kind: 'loaded', state });
  } catch {
    return protection('carrier-corrupt');
  }
}

/** Obtain display/preflight authority without writing. Current extension
 * state wins; an absent carrier explicitly projects the legacy mirror. */
export function loadDescentWaveOffAuthorityV1(input: Readonly<{
  readonly extensions: unknown;
  readonly legacyWaveOffs: unknown;
}>): DescentWaveOffAuthorityLoadOutcomeV1 {
  const extensions = canonicalExtensions(input.extensions);
  if (extensions === null) return protection('extensions-corrupt');
  const read = readDescentWaveOffCarrierV1(extensions);
  if (read.kind === 'protected') return read;
  if (read.kind === 'loaded') {
    return Object.freeze({ kind: 'loaded', source: 'current', state: read.state, extensions });
  }
  try {
    return Object.freeze({
      kind: 'loaded', source: 'legacy-bootstrap',
      state: createLegacyDescentWaveOffStateV1(input.legacyWaveOffs),
      extensions,
    });
  } catch {
    return protection('legacy-corrupt');
  }
}

/** Prepare one selected outcome. The returned extension write and v4 mirror
 * are deliberately not committed here; Landing must combine them with its
 * world-identity/progression result and F4 authority in one outer CAS. */
export function prepareDescentWaveOffMutationV1(input: Readonly<{
  readonly extensions: unknown;
  readonly legacyWaveOffs: unknown;
  readonly address: CanonicalCF1WorldAddress;
  readonly outcome: DescentWaveOffOutcomeKindV1;
}>): DescentWaveOffMutationPreparationV1 {
  const loaded = loadDescentWaveOffAuthorityV1({
    extensions: input.extensions,
    legacyWaveOffs: input.legacyWaveOffs,
  });
  if (loaded.kind === 'protected') return loaded;
  if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)) {
    return protection('address-invalid');
  }
  if (input.outcome !== 'failure' && input.outcome !== 'success') {
    return protection('outcome-impossible');
  }
  let countBefore: number;
  let state: DescentWaveOffStateV1;
  try {
    countBefore = descentWaveOffCountV1(loaded.state, input.address);
    state = stageDescentWaveOffOutcomeV1(loaded.state, input.address, input.outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/400-world|byte bound/u.test(message)) return protection('capacity');
    if (/fully learned/u.test(message)) return protection('outcome-impossible');
    return protection('address-invalid');
  }
  const write: V5ExtensionWrite = Object.freeze({
    segment: DESCENT_WAVE_OFF_SEGMENT_V1,
    namespace: DESCENT_WAVE_OFF_NAMESPACE_V1,
    carrier: carrierFor(state),
  });
  try {
    const applied = applyV5ExtensionWrites(loaded.extensions, Object.freeze([write]));
    return Object.freeze({
      kind: 'prepared', source: loaded.source, outcome: input.outcome,
      countBefore,
      countAfter: descentWaveOffCountV1(state, input.address),
      state,
      write,
      writes: applied.writes,
      extensions: applied.extensions,
      legacyWaveOffs: projectLegacyDescentWaveOffMirrorV1(state),
    });
  } catch {
    return protection('extension-bounds');
  }
}
