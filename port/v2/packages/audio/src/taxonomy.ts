/* Canonical Earth-audio route inventory.

   This data boundary reads the current catalogue instead of copying 1,010
   names into the audio package. Four v1 compatibility routes deliberately
   remain addressable because old set-qualified identities may still carry
   them; each points at the one current D-CAT-1 owner. The route itself remains
   distinct in an AudioSignature, while canonicalIdentityKey records the
   deduplicated catalogue identity.

   This is intentionally a coarse first taxonomy: one truthful sonic domain
   per biological kingdom. It neither imports the browser painter nor pretends
   that family-level listening/content review has happened. */
import { _EARTH_NAMES } from '@cf/domain-descriptors';

/** A route-inventory change is a resolver-version decision, even when its
 * row count stays unchanged. The pinned digest below fails closed until both
 * are deliberately advanced together. */
export const AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION = 1 as const;
export const AUDIO_ROUTE_INVENTORY_DIGEST = 'arv1-f715350becaa52946933ff5039030733' as const;

export const AUDIO_KINGDOM_ORDER = Object.freeze([
  'fauna', 'flora', 'fungi', 'microbe',
] as const);

export type AudioKingdom = typeof AUDIO_KINGDOM_ORDER[number];

export const AUDIO_PALETTE_POLICY = Object.freeze({
  fauna: 'fauna-vocal-foley',
  flora: 'flora-environmental-sonification',
  fungi: 'fungi-environmental-sonification',
  microbe: 'microbe-environmental-sonification',
} as const);

export type AudioPalettePolicy = typeof AUDIO_PALETTE_POLICY[AudioKingdom];

export const AUDIO_TAXONOMY = Object.freeze({
  fauna: Object.freeze({ taxonomyId: 'earth-fauna-biophony', palettePolicy: AUDIO_PALETTE_POLICY.fauna }),
  flora: Object.freeze({ taxonomyId: 'earth-flora-botanical-sonification', palettePolicy: AUDIO_PALETTE_POLICY.flora }),
  fungi: Object.freeze({ taxonomyId: 'earth-fungi-mycological-sonification', palettePolicy: AUDIO_PALETTE_POLICY.fungi }),
  microbe: Object.freeze({ taxonomyId: 'earth-microbe-scientific-sonification', palettePolicy: AUDIO_PALETTE_POLICY.microbe }),
} as const);

export type AudioTaxonomyId = typeof AUDIO_TAXONOMY[AudioKingdom]['taxonomyId'];
export type AudioRouteStatus = 'current' | 'legacy-compatibility';

declare const audioCatalogueRouteKeyBrand: unique symbol;
export type AudioCatalogueRouteKey = string & {
  readonly [audioCatalogueRouteKeyBrand]: true;
};

declare const audioCanonicalIdentityKeyBrand: unique symbol;
export type AudioCanonicalIdentityKey = string & {
  readonly [audioCanonicalIdentityKeyBrand]: true;
};

export interface AudioRouteManifestRow {
  readonly routeKey: AudioCatalogueRouteKey;
  readonly kingdom: AudioKingdom;
  readonly name: string;
  readonly canonicalIdentityKey: AudioCanonicalIdentityKey;
  readonly canonicalKingdom: AudioKingdom;
  readonly taxonomyId: AudioTaxonomyId;
  readonly palettePolicy: AudioPalettePolicy;
  readonly status: AudioRouteStatus;
}

export interface AudioRouteManifestAudit {
  readonly resolverVersion: typeof AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION;
  readonly sourceRouteDigest: typeof AUDIO_ROUTE_INVENTORY_DIGEST;
  readonly routeCount: 1_014;
  readonly currentRouteCount: 1_010;
  readonly compatibilityRouteCount: 4;
  readonly canonicalIdentityCount: 1_010;
}

export const AUDIO_LEGACY_FALLBACK = Object.freeze({
  taxonomyId: 'legacy-fallback',
  paletteId: 'legacy',
  ordinarySelection: false,
} as const);

const EXPECTED_CURRENT_ROUTES = 1_010;
const EXPECTED_APPROVED_ROUTES = 1_014;

const LEGACY_COMPATIBILITY_ROUTES = Object.freeze([
  Object.freeze({ kingdom: 'microbe' as const, name: 'Tardigrade', canonicalKingdom: 'fauna' as const }),
  Object.freeze({ kingdom: 'flora' as const, name: 'Reindeer Lichen', canonicalKingdom: 'fungi' as const }),
  Object.freeze({ kingdom: 'flora' as const, name: 'Snow Algae', canonicalKingdom: 'microbe' as const }),
  Object.freeze({ kingdom: 'microbe' as const, name: 'Green Algae', canonicalKingdom: 'flora' as const }),
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && actual.every((key) => expected.includes(key));
}

export function isAudioKingdom(value: unknown): value is AudioKingdom {
  return typeof value === 'string' && (AUDIO_KINGDOM_ORDER as readonly string[]).includes(value);
}

function canonicalName(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128
    || value.trim() !== value || value.normalize('NFC') !== value
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError('audio catalogue name is not a bounded canonical name');
  }
  return value;
}

export function audioCatalogueRouteKey(
  kingdom: AudioKingdom,
  name: string,
): AudioCatalogueRouteKey {
  if (!isAudioKingdom(kingdom)) throw new TypeError('audio catalogue route kingdom is invalid');
  return JSON.stringify([kingdom, canonicalName(name)]) as AudioCatalogueRouteKey;
}

function canonicalIdentityKey(
  kingdom: AudioKingdom,
  name: string,
): AudioCanonicalIdentityKey {
  return JSON.stringify([kingdom, canonicalName(name)]) as AudioCanonicalIdentityKey;
}

function routeRow(
  kingdom: AudioKingdom,
  name: string,
  canonicalKingdom: AudioKingdom,
  status: AudioRouteStatus,
): AudioRouteManifestRow {
  const taxonomy = AUDIO_TAXONOMY[kingdom];
  return Object.freeze({
    routeKey: audioCatalogueRouteKey(kingdom, name),
    kingdom,
    name: canonicalName(name),
    canonicalIdentityKey: canonicalIdentityKey(canonicalKingdom, name),
    canonicalKingdom,
    taxonomyId: taxonomy.taxonomyId,
    palettePolicy: taxonomy.palettePolicy,
    status,
  });
}

const CURRENT_ROWS = AUDIO_KINGDOM_ORDER.flatMap((kingdom) =>
  _EARTH_NAMES[kingdom].map((name) => routeRow(kingdom, name, kingdom, 'current')));

const EXPECTED_ROWS = Object.freeze([
  ...CURRENT_ROWS,
  ...LEGACY_COMPATIBILITY_ROUTES.map((row) =>
    routeRow(row.kingdom, row.name, row.canonicalKingdom, 'legacy-compatibility')),
]);

const EXPECTED_BY_ROUTE = new Map(EXPECTED_ROWS.map((row) => [row.routeKey, row]));
const ROUTE_DIGEST_KEYS = Object.freeze([
  'routeKey', 'kingdom', 'name', 'canonicalIdentityKey', 'canonicalKingdom',
  'taxonomyId', 'palettePolicy', 'status',
] as const satisfies readonly (keyof AudioRouteManifestRow)[]);
const ROUTE_DIGEST_SEEDS = Object.freeze([
  0x811C9DC5, 0x9E3779B9, 0x85EBCA6B, 0xC2B2AE35,
] as const);

function routeDigestHash(source: string, seed: number): string {
  let hash = seed >>> 0;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85EBCA6B) >>> 0;
  hash ^= hash >>> 13;
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Digest exact ordered source/route data, including canonical ownership and
 * taxonomy. This is deliberately independent of the expected-row lookup so a
 * same-count edit to the authoritative catalogue cannot redefine both sides
 * of its own check. */
export function audioRouteInventoryDigest(rows: readonly unknown[]): string {
  if (!Array.isArray(rows)) throw new TypeError('audio route inventory rows are required');
  const source = JSON.stringify(rows.map((value, index) => {
    if (!isRecord(value) || !hasExactKeys(value, ROUTE_DIGEST_KEYS)) {
      throw new TypeError(`audio route inventory row ${index} has an invalid digest shape`);
    }
    return ROUTE_DIGEST_KEYS.map((key) => {
      const field = value[key];
      if (typeof field !== 'string') {
        throw new TypeError(`audio route inventory row ${index} has a non-string digest field`);
      }
      return field;
    });
  }));
  return `arv${AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION}-${ROUTE_DIGEST_SEEDS
    .map((seed) => routeDigestHash(source, seed)).join('')}`;
}

export function assertPinnedAudioRouteInventory(
  rows: readonly unknown[],
): typeof AUDIO_ROUTE_INVENTORY_DIGEST {
  const digest = audioRouteInventoryDigest(rows);
  if (digest !== AUDIO_ROUTE_INVENTORY_DIGEST) {
    throw new RangeError(
      `audio resolver ${AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION} source/route digest changed: ${digest}`,
    );
  }
  return AUDIO_ROUTE_INVENTORY_DIGEST;
}

/** Validate the entire route join in both directions. This accepts an explicit
 * row array so tests can inject missing, duplicate, cross-kingdom, legacy, and
 * mammal-fallback defects and prove the instrument rejects each one. */
export function auditAudioRouteManifest(rows: readonly unknown[]): AudioRouteManifestAudit {
  if (!Array.isArray(rows) || rows.length !== EXPECTED_APPROVED_ROUTES) {
    throw new RangeError(`audio route manifest must contain exactly ${EXPECTED_APPROVED_ROUTES} routes`);
  }
  if (CURRENT_ROWS.length !== EXPECTED_CURRENT_ROUTES) {
    throw new RangeError(`current Earth catalogue must contain exactly ${EXPECTED_CURRENT_ROUTES} routes`);
  }
  const routeKeys = new Set<string>();
  const canonicalKeys = new Set<string>();
  let currentRouteCount = 0;
  let compatibilityRouteCount = 0;
  for (const [index, value] of rows.entries()) {
    if (!isRecord(value) || !hasExactKeys(value, [
      'routeKey', 'kingdom', 'name', 'canonicalIdentityKey', 'canonicalKingdom',
      'taxonomyId', 'palettePolicy', 'status',
    ])) throw new TypeError(`audio route manifest row ${index} has an invalid shape`);
    if (!isAudioKingdom(value.kingdom) || !isAudioKingdom(value.canonicalKingdom)) {
      throw new TypeError(`audio route manifest row ${index} has an invalid kingdom`);
    }
    const name = canonicalName(value.name);
    const routeKey = audioCatalogueRouteKey(value.kingdom, name);
    if (value.routeKey !== routeKey || routeKeys.has(routeKey)) {
      throw new RangeError(`audio route manifest row ${index} has a duplicate or mismatched route key`);
    }
    routeKeys.add(routeKey);
    const expected = EXPECTED_BY_ROUTE.get(routeKey);
    if (!expected) throw new RangeError(`audio route manifest row ${index} is not an approved catalogue route`);
    const expectedTaxonomy = AUDIO_TAXONOMY[value.kingdom];
    if (value.taxonomyId !== expectedTaxonomy.taxonomyId
      || value.palettePolicy !== expectedTaxonomy.palettePolicy) {
      throw new RangeError(`audio route manifest row ${index} crossed its intentional kingdom taxonomy`);
    }
    if (value.canonicalKingdom !== expected.canonicalKingdom
      || value.canonicalIdentityKey !== expected.canonicalIdentityKey
      || value.status !== expected.status) {
      throw new RangeError(`audio route manifest row ${index} changed its canonical catalogue identity`);
    }
    canonicalKeys.add(value.canonicalIdentityKey as string);
    if (value.status === 'current') currentRouteCount++;
    else if (value.status === 'legacy-compatibility') compatibilityRouteCount++;
    else throw new RangeError(`audio route manifest row ${index} has an invalid status`);
  }
  for (const key of EXPECTED_BY_ROUTE.keys()) {
    if (!routeKeys.has(key)) throw new RangeError(`audio route manifest omitted approved route ${key}`);
  }
  if (currentRouteCount !== EXPECTED_CURRENT_ROUTES || compatibilityRouteCount !== 4
    || canonicalKeys.size !== EXPECTED_CURRENT_ROUTES) {
    throw new RangeError('audio route manifest counts or canonical identity collapse changed');
  }
  const sourceRouteDigest = assertPinnedAudioRouteInventory(rows);
  return Object.freeze({
    resolverVersion: AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION,
    sourceRouteDigest,
    routeCount: EXPECTED_APPROVED_ROUTES,
    currentRouteCount: EXPECTED_CURRENT_ROUTES,
    compatibilityRouteCount: 4,
    canonicalIdentityCount: EXPECTED_CURRENT_ROUTES,
  });
}

export const AUDIO_ROUTE_MANIFEST: readonly AudioRouteManifestRow[] = Object.freeze(EXPECTED_ROWS.slice());
export const AUDIO_ROUTE_MANIFEST_AUDIT = auditAudioRouteManifest(AUDIO_ROUTE_MANIFEST);

const ROUTE_LOOKUP = new Map(AUDIO_ROUTE_MANIFEST.map((row) => [row.routeKey, row]));

export function audioRouteManifestRow(
  kingdom: AudioKingdom,
  name: string,
): AudioRouteManifestRow | null {
  return ROUTE_LOOKUP.get(audioCatalogueRouteKey(kingdom, name)) ?? null;
}
