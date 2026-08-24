/* Arc 3 engineering persistence owner.

   `player/arc3.engineering` is a v5-only, independently versioned carrier.
   The domain codec owns canonical address-keyed engineering state; this
   adapter owns only extension classification, aggregate v5 bounds, and the
   explicit seed-mirror bootstrap boundary. It never invents an address and
   never replaces bytes it cannot first classify as absent or current. */
import {
  decodeEngineeringState,
  encodeEngineeringState,
  isEngineeringState,
  MAX_ENGINEERING_REVISION,
  migrateLegacyEngineeringState,
  type EngineeringAddressResolver,
  type EngineeringStateV2,
  type LegacyEngineeringSeedResolver,
} from '@cf/domain-opportunity';
import {
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5Extensions,
} from './migration-v5.js';

export const ARC3_ENGINEERING_SEGMENT = 'player' as const;
export const ARC3_ENGINEERING_NAMESPACE = 'arc3.engineering' as const;
export const ARC3_ENGINEERING_VERSION = 1 as const;

export type Arc3EngineeringReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly state: EngineeringStateV2 }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export interface Arc3EngineeringExtensionWrite {
  readonly segment: typeof ARC3_ENGINEERING_SEGMENT;
  readonly namespace: typeof ARC3_ENGINEERING_NAMESPACE;
  readonly carrier: V5ExtensionCarrier;
}

export interface PreparedArc3EngineeringWrite {
  readonly kind: 'prepared';
  readonly state: EngineeringStateV2;
  readonly write: Arc3EngineeringExtensionWrite;
  /** Complete checked projection for fixed-point and transaction tests. F4
      product writers consume only `write` and apply it once with the action. */
  readonly extensions: V5Extensions;
}

export type Arc3EngineeringProtectionReason =
  | 'target-absent'
  | 'target-future'
  | 'target-corrupt'
  | 'legacy-refused'
  | 'state-unreadable'
  | 'revision-conflict'
  | 'revision-exhausted'
  | 'extensions-corrupt'
  | 'extension-bounds';

export type Arc3EngineeringWritePreparation =
  | PreparedArc3EngineeringWrite
  | {
    readonly kind: 'protected';
    readonly reason: Arc3EngineeringProtectionReason;
    readonly version?: number;
    readonly expectedRevision?: number;
    readonly actualRevision?: number;
  };

export type Arc3EngineeringBootstrapPreparation =
  | PreparedArc3EngineeringWrite
  | { readonly kind: 'already-loaded'; readonly state: EngineeringStateV2 }
  | {
    readonly kind: 'protected';
    readonly reason: Arc3EngineeringProtectionReason;
    readonly version?: number;
    readonly expectedRevision?: number;
    readonly actualRevision?: number;
  };

function isolatedCarrier(rawCarrier: unknown): V5ExtensionCarrier | null {
  try {
    const isolated = canonicalizeV5Extensions({
      [ARC3_ENGINEERING_SEGMENT]: { [ARC3_ENGINEERING_NAMESPACE]: rawCarrier },
    });
    return isolated[ARC3_ENGINEERING_SEGMENT]?.[ARC3_ENGINEERING_NAMESPACE] ?? null;
  } catch {
    return null;
  }
}

/** Encode only domain-registered current state. The isolated v5 validator
    enforces per-carrier bytes independently from the domain's broader codec
    compatibility bound. */
export function encodeArc3EngineeringCarrier(state: EngineeringStateV2): V5ExtensionCarrier {
  const carrier = Object.freeze({
    version: ARC3_ENGINEERING_VERSION,
    json: encodeEngineeringState(state),
  });
  const checked = isolatedCarrier(carrier);
  if (checked === null) throw new RangeError('Arc 3 engineering carrier exceeds v5 bounds');
  return checked;
}

/** Classify only the owned namespace. Canonical state is rebound through the
    caller's address resolver; opaque siblings are neither read nor changed. */
export function readArc3Engineering(
  extensions: V5Extensions,
  resolver: EngineeringAddressResolver,
): Arc3EngineeringReadOutcome {
  const rawCarrier = extensions[ARC3_ENGINEERING_SEGMENT]?.[ARC3_ENGINEERING_NAMESPACE] as unknown;
  if (rawCarrier === undefined) return Object.freeze({ kind: 'absent' });
  const carrier = isolatedCarrier(rawCarrier);
  if (carrier === null) return Object.freeze({ kind: 'corrupt' });
  if (carrier.version > ARC3_ENGINEERING_VERSION) {
    return Object.freeze({ kind: 'future-version', version: carrier.version });
  }
  if (carrier.version !== ARC3_ENGINEERING_VERSION) {
    return Object.freeze({ kind: 'corrupt' });
  }
  try {
    const state = decodeEngineeringState(carrier.json, resolver);
    if (encodeEngineeringState(state) !== carrier.json) {
      return Object.freeze({ kind: 'corrupt' });
    }
    return Object.freeze({ kind: 'loaded', state });
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
}

function canonicalBase(extensions: V5Extensions): V5Extensions | null {
  try {
    return canonicalizeV5Extensions(extensions);
  } catch {
    return null;
  }
}

function withCarrier(base: V5Extensions, carrier: V5ExtensionCarrier): V5Extensions {
  return canonicalizeV5Extensions({
    ...base,
    [ARC3_ENGINEERING_SEGMENT]: {
      ...(base[ARC3_ENGINEERING_SEGMENT] ?? {}),
      [ARC3_ENGINEERING_NAMESPACE]: carrier,
    },
  });
}

type PrivatePreparation = PreparedArc3EngineeringWrite | {
  readonly kind: 'protected';
  readonly reason: 'state-unreadable' | 'extension-bounds';
};

function prepared(
  base: V5Extensions,
  state: EngineeringStateV2,
  resolver: EngineeringAddressResolver,
): PrivatePreparation {
  let encoded: string;
  try {
    encoded = encodeEngineeringState(state);
    const rebound = decodeEngineeringState(encoded, resolver);
    if (encodeEngineeringState(rebound) !== encoded) throw new Error('engineering fixed point changed');
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'state-unreadable' });
  }
  try {
    const carrier = encodeArc3EngineeringCarrier(state);
    if (carrier.json !== encoded) throw new Error('engineering carrier bytes changed');
    const extensions = withCarrier(base, carrier);
    return Object.freeze({
      kind: 'prepared',
      state,
      write: Object.freeze({
        segment: ARC3_ENGINEERING_SEGMENT,
        namespace: ARC3_ENGINEERING_NAMESPACE,
        carrier,
      }),
      extensions,
    });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'extension-bounds' });
  }
}

function targetProtection(
  read: Arc3EngineeringReadOutcome,
): Exclude<Arc3EngineeringWritePreparation, PreparedArc3EngineeringWrite> | null {
  if (read.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: read.version });
  }
  if (read.kind === 'corrupt') {
    return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  }
  return null;
}

/** Prepare one replacement for an existing, decodable current carrier.
    Missing state must go through the explicit bootstrap function below. */
export function prepareArc3EngineeringWrite(input: Readonly<{
  extensions: V5Extensions;
  state: EngineeringStateV2;
  resolver: EngineeringAddressResolver;
}>): Arc3EngineeringWritePreparation {
  const base = canonicalBase(input.extensions);
  if (base === null) {
    return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  }
  const read = readArc3Engineering(base, input.resolver);
  if (read.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: read.version });
  }
  if (read.kind === 'corrupt') {
    return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  }
  if (read.kind === 'absent') {
    return Object.freeze({ kind: 'protected', reason: 'target-absent' });
  }
  if (!isEngineeringState(input.state)) {
    return Object.freeze({ kind: 'protected', reason: 'state-unreadable' });
  }
  if (read.state.revision === MAX_ENGINEERING_REVISION) {
    return Object.freeze({
      kind: 'protected',
      reason: 'revision-exhausted',
      actualRevision: read.state.revision,
    });
  }
  const expectedRevision = read.state.revision + 1;
  if (input.state.revision !== expectedRevision) {
    return Object.freeze({
      kind: 'protected',
      reason: 'revision-conflict',
      expectedRevision,
      actualRevision: input.state.revision,
    });
  }
  return prepared(base, input.state, input.resolver);
}

/** Seed an absent carrier from a caller-owned legacy seed mirror. The legacy
    resolver must return every canonical match; the domain migration refuses
    zero or multiple matches. Existing loaded bytes are returned unchanged,
    and future/corrupt targets are refusal-only. An empty legacy mirror is the
    explicit fresh-save bootstrap—there is no implicit address or state. */
export function prepareArc3EngineeringLegacyBootstrap(input: Readonly<{
  extensions: V5Extensions;
  legacy: unknown;
  addressResolver: EngineeringAddressResolver;
  legacyResolver: LegacyEngineeringSeedResolver;
}>): Arc3EngineeringBootstrapPreparation {
  const base = canonicalBase(input.extensions);
  if (base === null) {
    return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  }
  const read = readArc3Engineering(base, input.addressResolver);
  const protection = targetProtection(read);
  if (protection !== null) return protection;
  if (read.kind === 'loaded') {
    return Object.freeze({ kind: 'already-loaded', state: read.state });
  }

  let state: EngineeringStateV2;
  try {
    state = migrateLegacyEngineeringState(input.legacy, input.legacyResolver);
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'legacy-refused' });
  }
  return prepared(base, state, input.addressResolver);
}
