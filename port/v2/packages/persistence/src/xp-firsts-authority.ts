/* Durable compatibility authority for the legacy v1 `xpFirsts` ledger.

   The v4 mirror deliberately keeps only its newest 4,000 `xpf` strings so an
   old client can still load the save. Once a 4,001st distinct first is
   claimed, this owner moves the displaced oldest string into one v5-only
   overflow carrier. The small additive `xpa` record remains in the v4 mirror
   and binds that carrier; losing either side is protected instead of looking
   like a pre-overflow save and re-arming an old reward.

   This module owns only opaque legacy keys and their durable membership. It
   neither assigns XP nor defines future v2 creature/action identities. A
   caller must commit the returned state and complete namespace replacement in
   the same F3/F4 transaction as its product outcome. */
import {
  canonicalizeData,
  sha256Hex,
  type CanonicalDataBudget,
  type CanonicalJson,
  type CanonicalJsonObject,
} from '@cf/domain-acquisition';
import type { LegacyXpFirstsBindingV1, SaveStateV2 } from './import-v2.js';
import {
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';

export const LEGACY_XP_FIRSTS_WINDOW = 4000 as const;
export const LEGACY_XP_FIRSTS_MAX_KEY_LENGTH = 64 as const;
export const LEGACY_XP_FIRSTS_NAMESPACE = 'progression.xp-firsts' as const;
export const LEGACY_XP_FIRSTS_SEGMENT = 'inventory' as const;
export const LEGACY_XP_FIRSTS_VERSION = 1 as const;
export const LEGACY_XP_FIRSTS_SCHEMA = 'cf-v2-legacy-xp-firsts/v1' as const;

interface LegacyXpFirstsPayloadV1 {
  readonly schema: typeof LEGACY_XP_FIRSTS_SCHEMA;
  readonly version: typeof LEGACY_XP_FIRSTS_VERSION;
  readonly archived: readonly string[];
  readonly windowDigest: string;
  readonly totalCount: number;
}

export type LegacyXpFirstsProtectionReason =
  | 'state-corrupt'
  | 'extensions-corrupt'
  | 'binding-corrupt'
  | 'binding-future'
  | 'binding-without-carrier'
  | 'carrier-without-binding'
  | 'carrier-wrong-segment'
  | 'carrier-corrupt'
  | 'carrier-future'
  | 'binding-mismatch'
  | 'invalid-key'
  | 'extension-bounds';

export interface LegacyXpFirstsProtection {
  readonly kind: 'protected';
  readonly reason: LegacyXpFirstsProtectionReason;
  readonly version?: number;
}

export type LegacyXpFirstsAuthorityReadOutcome =
  | LegacyXpFirstsProtection
  | {
    readonly kind: 'loaded';
    readonly mode: 'legacy-tail' | 'overflow';
    readonly window: readonly string[];
    readonly archived: readonly string[];
    readonly totalCount: number;
  };

export interface PreparedLegacyXpFirstClaim {
  readonly kind: 'prepared';
  readonly state: SaveStateV2;
  readonly writes: readonly V5ExtensionWrite[];
  readonly extensions: V5Extensions;
  readonly totalCount: number;
}

export type LegacyXpFirstClaimPreparation =
  | LegacyXpFirstsProtection
  | { readonly kind: 'duplicate'; readonly totalCount: number }
  | PreparedLegacyXpFirstClaim;

const XP_DATA_BUDGET: CanonicalDataBudget = Object.freeze({
  maxDepth: 4,
  maxNodes: V5_MAX_EXTENSION_JSON_BYTES + 16,
  maxKeys: 8,
  maxArrayLength: V5_MAX_EXTENSION_JSON_BYTES,
  maxStringLength: LEGACY_XP_FIRSTS_MAX_KEY_LENGTH,
  maxCharacters: V5_MAX_EXTENSION_JSON_BYTES,
});

const EMPTY_KEYS: readonly string[] = Object.freeze([]);
const EMPTY_WRITES: readonly V5ExtensionWrite[] = Object.freeze([]);
const SHA256 = /^[0-9a-f]{64}$/u;

type BindingRead =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly binding: LegacyXpFirstsBindingV1 }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'corrupt' };

interface LoadedInspection {
  readonly kind: 'loaded';
  readonly mode: 'legacy-tail' | 'overflow';
  readonly window: readonly string[];
  readonly archived: readonly string[];
  readonly totalCount: number;
  readonly extensions: V5Extensions;
}

type Inspection = LegacyXpFirstsProtection | LoadedInspection;

function protection(
  reason: LegacyXpFirstsProtectionReason,
  version?: number,
): LegacyXpFirstsProtection {
  return Object.freeze({ kind: 'protected', reason, ...(version === undefined ? {} : { version }) });
}

function exactKeys(value: CanonicalJsonObject, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length
    && actual.every((key, index) => key === wanted[index]);
}

function isCanonicalObject(value: CanonicalJson): value is CanonicalJsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalKeyArray(value: unknown, maximum: number): readonly string[] {
  const canonical = canonicalizeData(value, { ...XP_DATA_BUDGET, maxArrayLength: maximum });
  if (!Array.isArray(canonical)) throw new TypeError('legacy XP keys must be an array');
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const key of canonical) {
    if (typeof key !== 'string' || key.length > LEGACY_XP_FIRSTS_MAX_KEY_LENGTH) {
      throw new TypeError('legacy XP keys must be strings of at most 64 code units');
    }
    if (seen.has(key)) throw new TypeError('legacy XP keys must be unique');
    seen.add(key);
    keys.push(key);
  }
  return Object.freeze(keys);
}

function readBinding(value: unknown): BindingRead {
  if (value === undefined || value === null) return Object.freeze({ kind: 'absent' });
  try {
    const canonical = canonicalizeData(value, XP_DATA_BUDGET);
    if (!isCanonicalObject(canonical)) {
      return Object.freeze({ kind: 'corrupt' });
    }
    const version = canonical.v;
    if (typeof version === 'number' && Number.isSafeInteger(version) && version > 1) {
      return Object.freeze({ kind: 'future', version });
    }
    if (!exactKeys(canonical, ['v', 'totalCount', 'carrierDigest'])) {
      return Object.freeze({ kind: 'corrupt' });
    }
    if (version !== 1
      || typeof canonical.totalCount !== 'number'
      || !Number.isSafeInteger(canonical.totalCount)
      || canonical.totalCount <= LEGACY_XP_FIRSTS_WINDOW
      || typeof canonical.carrierDigest !== 'string'
      || !SHA256.test(canonical.carrierDigest)) {
      return Object.freeze({ kind: 'corrupt' });
    }
    return Object.freeze({
      kind: 'loaded',
      binding: Object.freeze({
        v: 1,
        totalCount: canonical.totalCount,
        carrierDigest: canonical.carrierDigest,
      }),
    });
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
}

function windowDigest(window: readonly string[]): string {
  return sha256Hex(JSON.stringify(window));
}

function payloadFor(
  archived: readonly string[],
  window: readonly string[],
): LegacyXpFirstsPayloadV1 {
  return Object.freeze({
    schema: LEGACY_XP_FIRSTS_SCHEMA,
    version: LEGACY_XP_FIRSTS_VERSION,
    archived,
    windowDigest: windowDigest(window),
    totalCount: archived.length + window.length,
  });
}

function carrierFor(payload: LegacyXpFirstsPayloadV1): V5ExtensionCarrier {
  return Object.freeze({
    version: LEGACY_XP_FIRSTS_VERSION,
    json: JSON.stringify(payload),
  });
}

function bindingFor(payload: LegacyXpFirstsPayloadV1, carrier: V5ExtensionCarrier): LegacyXpFirstsBindingV1 {
  return Object.freeze({
    v: 1,
    totalCount: payload.totalCount,
    carrierDigest: sha256Hex(carrier.json),
  });
}

function readPayload(carrier: V5ExtensionCarrier): LegacyXpFirstsPayloadV1 | null {
  try {
    const canonical = canonicalizeData(JSON.parse(carrier.json) as unknown, XP_DATA_BUDGET);
    if (!isCanonicalObject(canonical)
      || !exactKeys(canonical, ['schema', 'version', 'archived', 'windowDigest', 'totalCount'])
      || canonical.schema !== LEGACY_XP_FIRSTS_SCHEMA
      || canonical.version !== LEGACY_XP_FIRSTS_VERSION
      || typeof canonical.windowDigest !== 'string'
      || !SHA256.test(canonical.windowDigest)
      || typeof canonical.totalCount !== 'number'
      || !Number.isSafeInteger(canonical.totalCount)) return null;
    const archived = canonicalKeyArray(canonical.archived, V5_MAX_EXTENSION_JSON_BYTES);
    if (archived.length === 0) return null;
    const payload = Object.freeze({
      schema: LEGACY_XP_FIRSTS_SCHEMA,
      version: LEGACY_XP_FIRSTS_VERSION,
      archived,
      windowDigest: canonical.windowDigest,
      totalCount: canonical.totalCount,
    });
    return JSON.stringify(payload) === carrier.json ? payload : null;
  } catch {
    return null;
  }
}

function inspect(state: SaveStateV2, extensions: V5Extensions): Inspection {
  let window: readonly string[];
  let canonicalExtensions: V5Extensions;
  try {
    window = canonicalKeyArray(state.xpFirsts, LEGACY_XP_FIRSTS_WINDOW);
  } catch {
    return protection('state-corrupt');
  }
  try {
    canonicalExtensions = canonicalizeV5Extensions(extensions);
  } catch {
    return protection('extensions-corrupt');
  }
  const binding = readBinding(state.xpFirstsBinding);
  if (binding.kind === 'future') return protection('binding-future', binding.version);
  if (binding.kind === 'corrupt') return protection('binding-corrupt');
  if (V5_SEGMENTS.some((segment) => (
    segment !== LEGACY_XP_FIRSTS_SEGMENT
    && canonicalExtensions[segment]?.[LEGACY_XP_FIRSTS_NAMESPACE] !== undefined
  ))) return protection('carrier-wrong-segment');
  const carrier = canonicalExtensions[LEGACY_XP_FIRSTS_SEGMENT]?.[LEGACY_XP_FIRSTS_NAMESPACE];
  if (carrier === undefined && binding.kind === 'loaded') return protection('binding-without-carrier');
  if (carrier !== undefined && binding.kind === 'absent') return protection('carrier-without-binding');
  if (carrier === undefined) {
    return Object.freeze({
      kind: 'loaded', mode: 'legacy-tail', window, archived: EMPTY_KEYS,
      totalCount: window.length, extensions: canonicalExtensions,
    });
  }
  if (carrier.version > LEGACY_XP_FIRSTS_VERSION) {
    return protection('carrier-future', carrier.version);
  }
  if (carrier.version !== LEGACY_XP_FIRSTS_VERSION) return protection('carrier-corrupt');
  const payload = readPayload(carrier);
  if (payload === null) return protection('carrier-corrupt');
  if (window.length !== LEGACY_XP_FIRSTS_WINDOW
    || payload.totalCount !== payload.archived.length + window.length
    || payload.windowDigest !== windowDigest(window)
    || binding.kind !== 'loaded'
    || binding.binding.totalCount !== payload.totalCount
    || binding.binding.carrierDigest !== sha256Hex(carrier.json)) {
    return protection('binding-mismatch');
  }
  const union = new Set(payload.archived);
  if (window.some((key) => union.has(key))) return protection('carrier-corrupt');
  return Object.freeze({
    kind: 'loaded', mode: 'overflow', window, archived: payload.archived,
    totalCount: payload.totalCount, extensions: canonicalExtensions,
  });
}

/** Read the legacy tail and its optional v5 overflow as one membership
 * authority. One-sided or mismatched evidence is refusal-only. */
export function readLegacyXpFirstsAuthority(
  state: SaveStateV2,
  extensions: V5Extensions,
): LegacyXpFirstsAuthorityReadOutcome {
  const inspected = inspect(state, extensions);
  if (inspected.kind === 'protected') return inspected;
  return Object.freeze({
    kind: 'loaded', mode: inspected.mode, window: inspected.window,
    archived: inspected.archived, totalCount: inspected.totalCount,
  });
}

function nextState(
  state: SaveStateV2,
  window: readonly string[],
  binding: LegacyXpFirstsBindingV1 | null,
): SaveStateV2 {
  return {
    ...state,
    xpFirsts: [...window],
    xpFirstsBinding: binding,
  };
}

/** Prepare one opaque legacy first claim without assigning any reward. The
 * returned state and namespace replacement must share the caller's product
 * transaction; capacity failure never returns a lossy prefix. */
export function prepareLegacyXpFirstClaim(input: Readonly<{
  state: SaveStateV2;
  extensions: V5Extensions;
  key: string;
}>): LegacyXpFirstClaimPreparation {
  if (typeof input.key !== 'string'
    || input.key.length === 0
    || input.key.length > LEGACY_XP_FIRSTS_MAX_KEY_LENGTH) {
    return protection('invalid-key');
  }
  const inspected = inspect(input.state, input.extensions);
  if (inspected.kind === 'protected') return inspected;
  if (inspected.window.includes(input.key) || inspected.archived.includes(input.key)) {
    return Object.freeze({ kind: 'duplicate', totalCount: inspected.totalCount });
  }
  if (inspected.mode === 'legacy-tail' && inspected.window.length < LEGACY_XP_FIRSTS_WINDOW) {
    const window = Object.freeze([...inspected.window, input.key]);
    return Object.freeze({
      kind: 'prepared',
      state: nextState(input.state, window, null),
      writes: EMPTY_WRITES,
      extensions: inspected.extensions,
      totalCount: window.length,
    });
  }

  const displaced = inspected.window[0];
  if (displaced === undefined) return protection('state-corrupt');
  const archived = Object.freeze([...inspected.archived, displaced]);
  const window = Object.freeze([...inspected.window.slice(1), input.key]);
  const payload = payloadFor(archived, window);
  const carrier = carrierFor(payload);
  const write: V5ExtensionWrite = Object.freeze({
    segment: LEGACY_XP_FIRSTS_SEGMENT,
    namespace: LEGACY_XP_FIRSTS_NAMESPACE,
    carrier,
  });
  try {
    const applied = applyV5ExtensionWrites(inspected.extensions, Object.freeze([write]));
    return Object.freeze({
      kind: 'prepared',
      state: nextState(input.state, window, bindingFor(payload, carrier)),
      writes: applied.writes,
      extensions: applied.extensions,
      totalCount: payload.totalCount,
    });
  } catch {
    return protection('extension-bounds');
  }
}
