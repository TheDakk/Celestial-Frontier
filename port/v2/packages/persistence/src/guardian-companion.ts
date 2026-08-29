/* Persistence carrier for combat-mutable captured Guardian/Titan companions.

   The immutable acquisition carrier remains the only source of creature
   identity. This additive namespace stores only the registered XP/injury/
   tombstone overlay and is written through the existing combat CAS. */
import {
  GUARDIAN_COMPANION_STATE_VERSION_V1,
  createEmptyGuardianCompanionStateV1,
  decodeGuardianCompanionStateV1,
  encodeGuardianCompanionStateV1,
  type GuardianCompanionStateV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import {
  V5_SEGMENTS,
  canonicalizeV5Extensions,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';

export const GUARDIAN_COMPANION_SEGMENT_V1 = 'creatures' as const;
export const GUARDIAN_COMPANION_NAMESPACE_V1 = 'arc6.guardian-companions' as const;

export type GuardianCompanionCarrierReadOutcomeV1 =
  | Readonly<{ readonly kind: 'loaded'; readonly state: GuardianCompanionStateV1 }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason: 'wrong-segment' | 'future-version' | 'corrupt';
    readonly version?: number;
  }>;

/** Absence means no captured Guardian has accumulated mutable combat state.
 * Wrong-segment, future, and non-fixed-point carriers protect instead. */
export function readGuardianCompanionCarrierV1(
  extensionsValue: unknown,
): GuardianCompanionCarrierReadOutcomeV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); }
  catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== GUARDIAN_COMPANION_SEGMENT_V1
    && extensions[segment]?.[GUARDIAN_COMPANION_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.creatures?.[GUARDIAN_COMPANION_NAMESPACE_V1];
  if (carrier === undefined) {
    return Object.freeze({ kind: 'loaded', state: createEmptyGuardianCompanionStateV1() });
  }
  if (carrier.version > GUARDIAN_COMPANION_STATE_VERSION_V1) {
    return Object.freeze({
      kind: 'protected', reason: 'future-version', version: carrier.version,
    });
  }
  if (carrier.version !== GUARDIAN_COMPANION_STATE_VERSION_V1) {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
  try {
    return Object.freeze({
      kind: 'loaded', state: decodeGuardianCompanionStateV1(carrier.json),
    });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
}

export function guardianCompanionCarrierWriteV1(
  state: GuardianCompanionStateV1,
): V5ExtensionWrite {
  return Object.freeze({
    segment: GUARDIAN_COMPANION_SEGMENT_V1,
    namespace: GUARDIAN_COMPANION_NAMESPACE_V1,
    carrier: Object.freeze({
      version: GUARDIAN_COMPANION_STATE_VERSION_V1,
      json: encodeGuardianCompanionStateV1(state),
    }),
  });
}
