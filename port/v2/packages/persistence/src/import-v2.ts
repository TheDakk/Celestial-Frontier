/* importSaveV2 — the v1.8.9 cfcc_save_v2 LOAD PATH as a pure function.
   Port Phase 2 deliverable 1. Mirrors main.js loadSave (14202–14484) field
   by field; every clamp there is a shipped-defect lesson and each is
   reproduced with its reason. THE TRUTH IS NOT THIS FILE: the parity test
   replays port/baseline-v1.8.9/save-fixtures.json — post-boot state captured
   from the REAL loadSaveWithRecovery — and this importer must match it.

   Deliberate differences from the original, all inert to the output:
   - `now` is INJECTED (the original reads Date.now() — the anti-edit clamps
     need "no later than now", and a test needs to own "now").
   - state lands in a SaveStateV2 object instead of app globals/DOM.
   - the content VALIDATION SURFACE (id sets/maps/bounds) is injected as
     ContentRegistry (port/baseline-v1.8.9/content-registry.json).

   THE LAWS, restated at the sites that own them below:
   - size is NEVER clamped/wrapped at load (v1.8.6's save corruption).
   - `{}` where an array belongs loses THAT field, never the save (CF-RR-002).
   - tut absent ⇒ done · tips/snd/fx/shake/sv/notif absent ⇒ on · conq e
     absent ⇒ READY once (the deliberate pre-v1.8.8 migration). */
import {
  cleanName, _sanitizeSavedGenome, _sanitizeView, ringGrade,
} from '@cf/domain-strays';
import { describeSpecies, classifyRealm, ecologyRole, realmBiome, realmModifiers, sapienceTier } from '@cf/domain-genome';
import type { Genome } from '@cf/domain-genome';
import { sanitizeEpoch } from '@cf/domain-progression';
import { CF1_WORLD_ATLAS_ID_MAX_CHARS } from '@cf/scene';

export interface ContentRegistry {
  materials: string[];
  items: Record<string, { slot: string | null }>;
  affixHi: Record<string, number>;
  eqSlots: string[];
  techs: string[];
  binderSets: string[];
  charterStarters: string[];
  charterPool: string[];
  sigIds: string[];
  statKeys: string[];
  achLen: number;
  rankHuesLen: number;
  ascChaptersLen: number;
  tierMax: number;
}

export interface CodexEntry {
  id: string; name: string; kind: string; tier: number | null;
  realm: string; sapient: number; from: string; hybrid: boolean; g: Record<string, unknown>;
  /* not in the probe snapshot (never captured) but buildSave re-writes it —
     carried so export→import round-trips; parity projection excludes it */
  where: Record<string, unknown> | null;
}
export const FRONTIER_ENDING_IDS = Object.freeze([
  'conquer', 'protect', 'terraform', 'preserve', 'balance',
] as const);
export type FrontierEndingId = (typeof FRONTIER_ENDING_IDS)[number];
export function isKnownFrontierEndingId(value: unknown): value is FrontierEndingId {
  return typeof value === 'string'
    && (FRONTIER_ENDING_IDS as readonly string[]).includes(value);
}

export interface SaveStateV2 {
  /** Compatibility-named carrier for the advancing epoch snapshot. On boot
   * it becomes a new EpochClock construction origin; ordinary app saves must
   * refresh it from EpochClock.current() immediately before export. An
   * in-memory assignment alone does not prove the repository write committed. */
  /** Opaque bounded v4 compatibility token. Never use it as current event
   * authority without a version-specific resolver. */
  EPOCH_BASE: number; essence: number; explorerName: string; lastAnomKey: number | string | null;
  stats: Record<string, number>;
  pstats: Record<string, number>; hp: number; HP_MAX: number;
  customNames: Array<[string, string]>;
  conquered: Array<[unknown, { t: number; tier: number; e?: number }]>;
  cargo: Array<[string, number]>; cgx: Array<[string, number]>;
  items: Array<[string, number]>; equip: Record<string, string>;
  equipAff: Record<string, { k: string; v: number; forId: string }>;
  pinnedRecipe: string | null; cargoTab: string;
  seenSp: string[]; journal: Array<{ s: number; n: string; w: string; t: number }>;
  mined: Array<[unknown, number]>; mineX: Array<[unknown, number]>; skimX: Array<[unknown, number]>;
  bioX: Array<[number, [number, number]]>;
  techOwned: string[]; claimedSets: string[]; ascCh: number; ascProg: Record<string, number>;
  nameHue: number; savedView: Record<string, unknown> | null;
  fsMode: string; toneMode: string; fontMode: string;
  sndOn: boolean; fxOn: boolean; chartsOn: boolean; shakeOn: boolean;
  salvageConfirm: boolean; notifOn: boolean; tipsOn: boolean;
  sfxVol: number; glassTint: number; motionMode: number; cardExpand: number;
  notifications: Array<{ id: number; tt: string; ms: string; t: number; read: boolean }>;
  surveyedSet: string[]; galSeen: unknown[]; surfSeen: unknown[]; xpFirsts: string[];
  /** Optional v5 overflow binding mirrored into the additive v4 `xpa` field.
   * Older saves omit it. Once present, the matching v5 extension is required;
   * silently treating a lost extension as an old save would re-arm XP. */
  xpFirstsBinding?: LegacyXpFirstsBindingV1 | null;
  sysSeen: number[]; starKindsSeen: string[]; ptypesSeen: string[];
  eventKeysSeen: string[]; evAnnounced: string[]; unlocked: string[];
  landed: number[]; contacted: number[];
  waveOffs: Array<[number, number]>;
  primeFill: Record<string, { title: string; sub: string; tier: number; hex: string; where: unknown }>;
  /** Opaque bounded v4 compatibility token. Call isKnownFrontierEndingId
   * before any future UI or progression trusts it. */
  frontierUnlocked: boolean; frontierEnding: string | null; seenGuide: boolean;
  tutDone: boolean; rnSeen: string; tutSnapPending: unknown; scoutId: string | null;
  chWeek: number; chProg: Record<string, number>; chacc: string[]; chDone: string[];
  homeId: string | null; voiceOn: boolean; combatSfxOn: boolean;
  logMap: Array<[string, Record<string, unknown>]>;
  codex: Array<[string, CodexEntry]>;
}

export interface LegacyXpFirstsBindingV1 {
  readonly v: 1;
  readonly totalCount: number;
  readonly carrierDigest: string;
}

const HARVEST_CD = 3600e3;   /* key anchor (CLAUDE.md) — the harvest stamp floor window */

/* Numeric fields read as trait-table indices by the current Genome and
 * CombatCore descriptors. Honest generated/evolved genes are non-negative
 * integers, but may drift beyond their table length; those exact values are
 * identity and MUST NOT be wrapped or clamped here (especially `size`). Only
 * malformed values are normalized, following the existing share-code
 * hardener's abs/truncate rule without its lossy 32-bit coercion. `heat`,
 * `limbs`, and `accent` are deliberately absent: they are not numeric indices
 * consumed by the current descriptor/combat readers, and honest `heat` is a
 * fractional biome value. */
const IMPORTED_GENOME_INDEX_FIELDS = Object.freeze([
  'color', 'form', 'body', 'loco', 'trait', 'size', 'diet', 'head', 'skin',
  'tail', 'pattern', 'eyes', 'behavior', 'habitat', 'detail', 'temper',
  'sense', 'repro', 'life', 'metab', 'ep',
] as const);

function normalizedGenomeIndex(value: unknown): number {
  const numeric = typeof value === 'number'
    ? value
    : (typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN);
  if (!Number.isFinite(numeric)) return 0;
  const normalized = Math.abs(Math.trunc(numeric));
  return Number.isSafeInteger(normalized) ? normalized : 0;
}

/** Clone before invoking the byte-verbatim v1 hardener (which intentionally
 * mutates its argument), then repair only malformed numeric descriptor/combat
 * indices. Every valid non-negative integer—including an unwrapped size far
 * above the six presentation classes—survives by exact value and type. */
export function sanitizeImportedGenomeV2(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const clone = { ...(value as Record<string, unknown>) };
  const sanitized = _sanitizeSavedGenome(clone);
  if (!sanitized) return null;
  for (const field of IMPORTED_GENOME_INDEX_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(sanitized, field)) continue;
    const current = sanitized[field];
    if (typeof current === 'number' && Number.isSafeInteger(current) && current >= 0) continue;
    sanitized[field] = normalizedGenomeIndex(current);
  }
  return sanitized;
}

/** A genuine v1.8.9 Field Training checkpoint written immediately before
 * its sandbox starts. It owns only the eleven fields below; the surrounding
 * full save owns every other expedition field. The classifier returns a
 * bounded recursive clone, so these are evidence rather than parsed aliases. */
export interface LegacyTrainingCheckpointV1 {
  readonly st: Readonly<Record<string, unknown>>;
  readonly ps: Readonly<Record<string, unknown>>;
  readonly ac: readonly unknown[];
  readonly es: number;
  readonly c: readonly unknown[];
  readonly ca: readonly unknown[];
  readonly cx: readonly unknown[];
  readonly it: readonly unknown[];
  readonly eq: Readonly<Record<string, unknown>>;
  readonly ea: Readonly<Record<string, unknown>>;
  readonly e: Readonly<Record<string, unknown>> | null;
}

/** The importer must retain pre-sanitizer Training evidence without making it
 * part of the save schema. `current-view` is deliberately the exact one-key
 * snapshot written by the v2 Training restart. A genuine legacy checkpoint
 * is separately recognizable; every other richer shape remains refusal-only. */
export type ImportTrainingSnapshotIngressV2 =
  | { readonly kind: 'none' }
  | { readonly kind: 'current-view'; readonly view: unknown }
  | {
      readonly kind: 'legacy-v1';
      readonly snapshot: LegacyTrainingCheckpointV1;
      readonly rescuedCompleted: boolean;
    }
  | {
      readonly kind: 'legacy-or-unknown';
      readonly snapshot?: unknown;
      readonly retention?: 'save-only';
    };

/** Frozen lookup over pre-repair Atlas route evidence. The backing WeakMap is
 * private, so callers cannot mutate, enumerate or accidentally serialize it. */
export interface ImportAtlasWhereLookupV2 {
  readonly size: number;
  has(entry: Record<string, unknown>): boolean;
  get(entry: Record<string, unknown>): unknown;
}

/** Bounded, runtime-only evidence captured before tolerant legacy repair.
 *
 * `savedView` is a deeply frozen route-only projection of the parsed raw
 * `view` (`undefined` means absent). It retains own-field presence and exact
 * valid route numbers/type strings, but never coerces/defaults them and never
 * retains unrelated nested payloads. Wrong-typed route values become small
 * frozen type sentinels, so later proof still rejects them without pinning an
 * attacker-sized string/object in memory.
 *
 * `atlasWhere` contains at most the final 150 imported Atlas rows and is
 * keyed by the exact entry objects in `SaveStateV2.logMap`. It therefore
 * follows the importer's cap, cleaned-id and last-write-wins semantics without
 * putting raw/provenance fields on an enumerable row that exportSaveV2 could
 * accidentally serialize. */
export interface ImportRouteIngressV2 {
  readonly savedView: unknown;
  readonly atlasWhere: ImportAtlasWhereLookupV2;
  readonly trainingSnapshot: ImportTrainingSnapshotIngressV2;
}

export type ImportSaveResult =
  | { ok: false; reason: 'invalid' | 'future-version' }
  | { ok: true; state: SaveStateV2; ingress: ImportRouteIngressV2 };

type InvalidRouteValueType =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'object'
  | 'other';

interface InvalidRouteValueEvidence {
  readonly kind: 'invalid-route-value';
  readonly valueType: InvalidRouteValueType;
}

const INVALID_ROUTE_VALUES: Readonly<Record<InvalidRouteValueType, InvalidRouteValueEvidence>> =
  Object.freeze(Object.fromEntries(
    (['undefined', 'null', 'boolean', 'number', 'string', 'array', 'object', 'other'] as const)
      .map((valueType) => [valueType, Object.freeze({ kind: 'invalid-route-value' as const, valueType })]),
  ) as Record<InvalidRouteValueType, InvalidRouteValueEvidence>);

function invalidRouteValue(value: unknown): InvalidRouteValueEvidence {
  let valueType: InvalidRouteValueType;
  if (value === null) valueType = 'null';
  else if (Array.isArray(value)) valueType = 'array';
  else {
    switch (typeof value) {
      case 'undefined': valueType = 'undefined'; break;
      case 'boolean': valueType = 'boolean'; break;
      case 'number': valueType = 'number'; break;
      case 'string': valueType = 'string'; break;
      case 'object': valueType = 'object'; break;
      default: valueType = 'other';
    }
  }
  return INVALID_ROUTE_VALUES[valueType];
}

function projectRouteNumber(value: unknown): unknown {
  return typeof value === 'number' ? value : invalidRouteValue(value);
}

function projectRouteType(value: unknown): unknown {
  return typeof value === 'string' && ['galaxy', 'star', 'planet'].includes(value)
    ? value
    : invalidRouteValue(value);
}

function projectRoutePoint(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidRouteValue(value);
  const source = value as Record<string, unknown>;
  const point: Record<string, unknown> = {};
  for (const key of ['x', 'y', 'seed'] as const) {
    if (Object.prototype.hasOwnProperty.call(source, key)) point[key] = projectRouteNumber(source[key]);
  }
  return Object.freeze(point);
}

/** Project one legacy Where-shaped value without compatibility repair. */
function projectRawRoute(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'object' || Array.isArray(value)) return invalidRouteValue(value);
  const source = value as Record<string, unknown>;
  const route: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(source, 'type')) route.type = projectRouteType(source.type);
  if (Object.prototype.hasOwnProperty.call(source, 'gal')) route.gal = projectRoutePoint(source.gal);
  if (Object.prototype.hasOwnProperty.call(source, 'star')) route.star = projectRoutePoint(source.star);
  if (Object.prototype.hasOwnProperty.call(source, 'pseed')) route.pseed = projectRouteNumber(source.pseed);
  return Object.freeze(route);
}

const LEGACY_TRAINING_CHECKPOINT_V1_KEYS = Object.freeze([
  'st', 'ps', 'ac', 'es', 'c', 'ca', 'cx', 'it', 'eq', 'ea', 'e',
] as const);

const LEGACY_TRAINING_ARRAY_CAPS = Object.freeze({
  ac: 500,
  c: 1500,
  ca: 200,
  cx: 200,
  it: 300,
} as const);

const BOUNDED_TRAINING_EVIDENCE = Object.freeze({
  maxDepth: 12,
  maxArrayLength: 1500,
  maxObjectKeys: 64,
  maxKeyLength: 128,
  maxStringLength: 4096,
  maxNodes: 100_000,
  maxCharacters: 2_000_000,
});

const TRAINING_EVIDENCE_REJECTED = Symbol('training-evidence-rejected');

interface TrainingEvidenceBudget {
  nodes: number;
  characters: number;
  readonly active: WeakSet<object>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Clone and freeze JSON-shaped Training evidence under hard structural and
 * aggregate limits. Accessors, sparse/custom arrays, symbols, cycles and
 * non-JSON values are rejected rather than observed or normalized. */
function cloneBoundedTrainingEvidence(
  value: unknown,
  budget: TrainingEvidenceBudget = { nodes: 0, characters: 0, active: new WeakSet<object>() },
  depth = 0,
): unknown | typeof TRAINING_EVIDENCE_REJECTED {
  if (++budget.nodes > BOUNDED_TRAINING_EVIDENCE.maxNodes
    || depth > BOUNDED_TRAINING_EVIDENCE.maxDepth) return TRAINING_EVIDENCE_REJECTED;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : TRAINING_EVIDENCE_REJECTED;
  if (typeof value === 'string') {
    budget.characters += value.length;
    return value.length <= BOUNDED_TRAINING_EVIDENCE.maxStringLength
      && budget.characters <= BOUNDED_TRAINING_EVIDENCE.maxCharacters
      ? value
      : TRAINING_EVIDENCE_REJECTED;
  }
  if (!value || typeof value !== 'object' || budget.active.has(value)) return TRAINING_EVIDENCE_REJECTED;
  budget.active.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > BOUNDED_TRAINING_EVIDENCE.maxArrayLength
        || Object.getOwnPropertySymbols(value).length !== 0) return TRAINING_EVIDENCE_REJECTED;
      const keys = Object.keys(value);
      const names = Object.getOwnPropertyNames(value);
      if (keys.length !== value.length || names.length !== value.length + 1) return TRAINING_EVIDENCE_REJECTED;
      const clone: unknown[] = [];
      for (let index = 0; index < value.length; index++) {
        const key = String(index);
        if (keys[index] !== key) return TRAINING_EVIDENCE_REJECTED;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return TRAINING_EVIDENCE_REJECTED;
        const item = cloneBoundedTrainingEvidence(descriptor.value, budget, depth + 1);
        if (item === TRAINING_EVIDENCE_REJECTED) return TRAINING_EVIDENCE_REJECTED;
        clone.push(item);
      }
      return Object.freeze(clone);
    }
    if (!isPlainRecord(value) || Object.getOwnPropertySymbols(value).length !== 0) {
      return TRAINING_EVIDENCE_REJECTED;
    }
    const keys = Object.keys(value);
    if (keys.length > BOUNDED_TRAINING_EVIDENCE.maxObjectKeys
      || Object.getOwnPropertyNames(value).length !== keys.length) return TRAINING_EVIDENCE_REJECTED;
    const clone: Record<string, unknown> = {};
    for (const key of keys) {
      budget.characters += key.length;
      if (key.length > BOUNDED_TRAINING_EVIDENCE.maxKeyLength
        || budget.characters > BOUNDED_TRAINING_EVIDENCE.maxCharacters) return TRAINING_EVIDENCE_REJECTED;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return TRAINING_EVIDENCE_REJECTED;
      const item = cloneBoundedTrainingEvidence(descriptor.value, budget, depth + 1);
      if (item === TRAINING_EVIDENCE_REJECTED) return TRAINING_EVIDENCE_REJECTED;
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: item,
      });
    }
    return Object.freeze(clone);
  } finally {
    budget.active.delete(value);
  }
}

/** Recognize only the genuine v1.8.9 checkpoint envelope. Key order is not
 * semantic, but the set and outer container kinds are exact. `e.where` is
 * carried as inert checkpoint data; it is never projected as route authority. */
export function classifyLegacyTrainingCheckpointV1(value: unknown): LegacyTrainingCheckpointV1 | null {
  try {
    if (!isPlainRecord(value)
      || Object.getOwnPropertySymbols(value).length !== 0
      || Object.getOwnPropertyNames(value).length !== LEGACY_TRAINING_CHECKPOINT_V1_KEYS.length) return null;
    const keys = Object.keys(value);
    if (keys.length !== LEGACY_TRAINING_CHECKPOINT_V1_KEYS.length
      || !LEGACY_TRAINING_CHECKPOINT_V1_KEYS.every((key) => Object.prototype.hasOwnProperty.call(value, key))) return null;
    const clone = cloneBoundedTrainingEvidence(value);
    if (clone === TRAINING_EVIDENCE_REJECTED || !isPlainRecord(clone)) return null;
    if (!isPlainRecord(clone.st) || !isPlainRecord(clone.ps)
      || typeof clone.es !== 'number' || !Number.isFinite(clone.es)
      || !isPlainRecord(clone.eq) || !isPlainRecord(clone.ea)
      || !(clone.e === null || isPlainRecord(clone.e))) return null;
    for (const [key, cap] of Object.entries(LEGACY_TRAINING_ARRAY_CAPS) as Array<[
      keyof typeof LEGACY_TRAINING_ARRAY_CAPS,
      number,
    ]>) {
      const container = clone[key];
      if (!Array.isArray(container) || container.length > cap) return null;
    }
    return clone as unknown as LegacyTrainingCheckpointV1;
  } catch {
    return null;
  }
}

function frozenAtlasWhereLookup(
  rows: Iterable<readonly [Record<string, unknown>, unknown]>,
): ImportAtlasWhereLookupV2 {
  const backing = new WeakMap<Record<string, unknown>, unknown>();
  let size = 0;
  for (const [entry, rawWhere] of rows) {
    backing.set(entry, rawWhere);
    size++;
  }
  return Object.freeze({
    size,
    has: (entry: Record<string, unknown>): boolean => backing.has(entry),
    get: (entry: Record<string, unknown>): unknown => backing.get(entry),
  });
}

/** Exact compatibility classifier for the one pre-full-save development
 * envelope written to `cf-v2-slice` by commit e960e21. This is deliberately
 * separate from the mature v4 classifier: only the historical two-field
 * shape, an exact four-field nav record, matching route copies, and finite
 * mode-required identity are accepted. Parsed content still passes through
 * the ordinary bounded importer; this predicate grants no broader authority. */
export function isLegacySliceEnvelope(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).sort().join('|') !== 'nav|view') return false;
  if (!data.nav || typeof data.nav !== 'object' || Array.isArray(data.nav)) return false;
  const rawNav = data.nav as Record<string, unknown>;
  if (Object.keys(rawNav).sort().join('|') !== 'gal|mode|planet|star') return false;
  const mode = rawNav.mode;
  if (!['universe', 'galaxy', 'system', 'surface'].includes(String(mode))) return false;
  if (mode === 'universe') {
    return data.view === null && rawNav.gal === null && rawNav.star === null && rawNav.planet === null;
  }
  if (!data.view || typeof data.view !== 'object' || Array.isArray(data.view)) return false;
  const rawView = data.view as Record<string, unknown>;
  const expectedType = mode === 'galaxy' ? 'galaxy' : mode === 'system' ? 'star' : 'planet';
  if (rawView.type !== expectedType) return false;
  const samePoint = (a: unknown, b: unknown): boolean => {
    if (!a || typeof a !== 'object' || Array.isArray(a)
      || !b || typeof b !== 'object' || Array.isArray(b)) return false;
    const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
    return typeof left.seed === 'number' && Number.isFinite(left.seed)
      && typeof left.x === 'number' && Number.isFinite(left.x)
      && typeof left.y === 'number' && Number.isFinite(left.y)
      && left.seed === right.seed && left.x === right.x && left.y === right.y;
  };
  if (!samePoint(rawNav.gal, rawView.gal)) return false;
  if (mode === 'galaxy') return rawNav.star === null && rawNav.planet === null;
  if (!samePoint(rawNav.star, rawView.star)) return false;
  if (mode === 'system') return rawNav.planet === null;
  if (!rawNav.planet || typeof rawNav.planet !== 'object' || Array.isArray(rawNav.planet)) return false;
  const rawPlanet = rawNav.planet as Record<string, unknown>;
  return typeof rawPlanet.seed === 'number' && Number.isFinite(rawPlanet.seed)
    && rawPlanet.seed === rawView.pseed;
}

/** Import-sheet guard. Boot loading deliberately accepts sparse legacy data
 * and hardens it into defaults; an explicit destructive import must prove it
 * is a whole save envelope before replacing the stored expedition. */
export function isPlausibleSaveEnvelope(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (data.v !== undefined) {
    const version = Number(data.v);
    /* cfcc_save_v2's real writer has always emitted schema v4. Treating a
       hand-written v0-v3 marker as compatibility evidence would let a
       plausible partial object harden into defaults and replace a full
       expedition. Unversioned mature fixtures remain supported below. */
    if (version !== 4) return false;
  }
  const signature = ['epoch', 'view', 'hp', 'pstats', 'fs', 'tone', 'font', 'snd',
    'fx', 'chart', 'vol', 'rm', 'cx', 'land', 'cont', 'chs', 'chp', 'me',
    'essence', 'conq', 'cargo', 'items', 'eq', 'asc', 'ascp', 'names',
    'surveyed', 'gals', 'surf', 'starK', 'ptypes', 'log', 'home', 'prime',
    'codex', 'at', 'scout'] as const;
  /* This common signature is emitted by the first v4 writer (v1.5) and the
     current exporter. It spans navigation, settings, inventory/equipment,
     identity, progression, records, and Atlas/Compendium state so a
     truncation cannot merely retain the first dozen obvious sentinels. */
  /* Completeness is key PRESENCE, deliberately not pre-sanitizer types.
     Addendum B/CF-RR-002 requires one malformed field to lose that field,
     never roll the otherwise complete expedition back to an older backup. */
  return signature.every((key) => Object.prototype.hasOwnProperty.call(data, key));
}

export function importSaveV2(raw: string | null | undefined, registry: ContentRegistry, now: number): ImportSaveResult {
  try {
    if (!raw) return { ok: false, reason: 'invalid' };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'invalid' };
    const data = parsed as Record<string, unknown>;
    if (data.v !== undefined) {
      const version = Number(data.v);
      if (Number.isSafeInteger(version) && version > 4) return { ok: false, reason: 'future-version' };
      if (!Number.isSafeInteger(version) || version < 0) return { ok: false, reason: 'invalid' };
    }
    if (data.ever && typeof data.ever === 'object' && !Array.isArray(data.ever)) {
      const version = (data.ever as Record<string, unknown>).v;
      /* `ever` has its own reader contract inside compatible v4 envelopes.
         A valid later writer is protected, not silently downgraded to v1 by
         the next ordinary save. Malformed v1 data remains a contained field. */
      if (typeof version === 'number' && Number.isSafeInteger(version) && version > 1) {
        return { ok: false, reason: 'future-version' };
      }
    }

    let xpFirstsBinding: LegacyXpFirstsBindingV1 | null = null;
    if (data.xpa !== undefined) {
      if (!data.xpa || typeof data.xpa !== 'object' || Array.isArray(data.xpa)) {
        return { ok: false, reason: 'invalid' };
      }
      const binding = data.xpa as Record<string, unknown>;
      if (Number.isSafeInteger(binding.v) && (binding.v as number) > 1) {
        return { ok: false, reason: 'future-version' };
      }
      const keys = Object.keys(binding).sort();
      if (keys.length !== 3
        || keys[0] !== 'carrierDigest'
        || keys[1] !== 'totalCount'
        || keys[2] !== 'v') {
        return { ok: false, reason: 'invalid' };
      }
      if (binding.v !== 1
        || !Number.isSafeInteger(binding.totalCount)
        || (binding.totalCount as number) <= 4000
        || typeof binding.carrierDigest !== 'string'
        || !/^[0-9a-f]{64}$/u.test(binding.carrierDigest)) {
        return { ok: false, reason: 'invalid' };
      }
      xpFirstsBinding = Object.freeze({
        v: 1,
        totalCount: binding.totalCount as number,
        carrierDigest: binding.carrierDigest,
      });
    }

    const num = (v: unknown, d?: number): number => {
      const x = +(v as number);
      return Number.isFinite(x) ? x : (d === undefined ? 0 : d);
    };
    const clamp = (v: number, a: number, b: number): number => (v < a ? a : (v > b ? b : v));
    /* D-9i: generations are counters, not free-form save payload. The v1
       loader compared a string numerically and then stored the original
       string, so the next `gen + 1` could concatenate. Keep every honest
       integer unchanged, coerce legacy numeric strings once, and reject
       fractional/negative/unsafe values instead of persisting poison. */
    const generation = (v: unknown): number => {
      const n = +(v as number);
      return Number.isSafeInteger(n) && n >= 0 ? n : 0;
    };
    /* CF-RR-002: `{}` where an array belongs loads EMPTY; the save survives */
    const _capA = (a: unknown, n: number): unknown[] => (Array.isArray(a) ? a.slice(0, n) : []);
    const itemBy = registry.items;
    const TIER_MAX = registry.tierMax;

    /* v4 compatible extension, independently versioned: these values are
       cumulative records, not a projection of the creatures that remain
       in the Compendium. Older saves have no carrier and keep the historical
       derive-from-current-codex behavior. Once present, the carrier can only
       raise the derived floor; it can never hide a surviving record holder. */
    const cumulativeRecord = (() => {
      const value = data.ever;
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const raw = value as Record<string, unknown>;
      if (raw.v !== 1) return null;
      const counter = (field: string, hi: number): number => {
        const candidate = raw[field];
        return typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate >= 0
          ? Math.min(candidate, hi) : 0;
      };
      return Object.freeze({
        hybrids: counter('hybrids', 1_000_000_000),
        best: counter('best', TIER_MAX),
        maxGen: counter('maxGen', 1_000_000_000),
        scanhits: counter('scanhits', 1_000_000_000),
        arrivals: Object.prototype.hasOwnProperty.call(raw, 'arrivals')
          && typeof raw.arrivals === 'number'
          && Number.isSafeInteger(raw.arrivals)
          && raw.arrivals >= 0
          ? Math.min(raw.arrivals, 1_000_000_000)
          : null,
      });
    })();

    const EPOCH_BASE = sanitizeEpoch(data.epoch);
    const customNames = new Map<string, string>();
    for (const kv of _capA(data.names, 5000) as Array<[unknown, unknown]>) {
      if (kv && typeof kv[0] === 'string') { const nm = cleanName(kv[1]); if (nm) customNames.set(kv[0], nm); }
    }
    const stats: Record<string, number> = {
      /* hybrids/best/maxGen first rebuild from surviving Compendium rows;
         scanhits has no identity ledger. The optional cumulative record is
         applied after the Compendium source pass. */
      hybrids: 0, best: 0, maxGen: 0,
      shares: num(data.shares), jumps: num(data.jumps), anomalies: num(data.anomalies),
      events: num(data.events), duels: num(data.duels), duelwins: num(data.duelwins),
      breeds: num(data.breeds), breedwins: num(data.breedwins),
      feeds: num(data.feeds), feedfails: num(data.feedfails),
      harvests: num(data.harvests), essenceEarned: num(data.essenceEarned),
      guardians: num(data.guardians), paragons: num(data.paragons),
      mines: num(data.mines), crafts: num(data.crafts), minedout: num(data.minedout),
      skims: num(data.skims), cosmics: num(data.cosmics),
      landings: num(data.landings), charters: num(data.charters),
      surveys: 0, bestRank: clamp(num(data.br), 0, registry.rankHuesLen - 1),
    };
    /* Generated saves use a non-negative five-minute bucket number, while
       captured legacy fixtures also carry short opaque string tokens. Keep
       those bytes as inert compatibility data, but reject objects, controls,
       unbounded strings, fractional/negative numbers, and non-finite values. */
    const lastAnomKey = typeof data.anomKey === 'number'
      && Number.isSafeInteger(data.anomKey) && data.anomKey >= 0
      ? data.anomKey
      : typeof data.anomKey === 'string'
        && /^[A-Za-z0-9._:-]{1,64}$/.test(data.anomKey)
        ? data.anomKey : null;
    const explorerName = cleanName((data.me as string) || '');
    const essence = clamp(num(data.essence), 0, 1e9);

    /* the save's own wall-clock stamp — the anti-edit anchor. `now` injected. */
    const _nowL = now;
    const _atL = clamp(num(data.at, _nowL), 0, _nowL);
    /* v1.8.8: `t` is a DISPLAY stamp and gates nothing; readiness rides `e`,
       bounded to the epoch clock's own range — a future epoch would hold a
       world hostage forever, a wild negative would mint free harvests.
       ABSENT e ⇒ READY (one deliberate migration cycle per world). */
    const _hvFloor = Math.max(0, _atL - HARVEST_CD);
    /* Reconstruct the original collection owners before projecting DTO arrays.
       Map.set is last-write-wins without moving an existing key's insertion
       slot; Set.add is first-occurrence order with duplicate collapse. */
    const conquered = new Map<unknown, { t: number; tier: number; e?: number }>();
    for (const kv of _capA(data.conq, 20000) as Array<[unknown, Record<string, unknown>]>) {
      if (!kv || kv[0] == null || !kv[1]) continue;
      const _row: { t: number; tier: number; e?: number } = { t: clamp(num(kv[1].t), _hvFloor, _nowL), tier: clamp(num(kv[1].tier), 0, TIER_MAX) };
      if (kv[1].e != null) _row.e = clamp(num(kv[1].e), 0, EPOCH_BASE);
      conquered.set(kv[0], _row);
    }
    const claimedSets = new Set<string>();
    for (const s of _capA(data.setsc, 200)) if (registry.binderSets.includes(s as string)) claimedSets.add(s as string);
    const cargo = new Map<string, number>();
    for (const kv of _capA(data.cargo, 200) as Array<[string, unknown]>) { if (kv && registry.materials.includes(kv[0])) cargo.set(kv[0], clamp(num(kv[1]), 0, 1e6)); }
    /* exceptional sub-counts clamp to the HELD quantity — a crafted save can never mint grade */
    const cgx = new Map<string, number>();
    for (const kv of _capA(data.cgx, 200) as Array<[string, unknown]>) { if (kv && registry.materials.includes(kv[0])) cgx.set(kv[0], clamp(num(kv[1]), 0, cargo.get(kv[0]) || 0)); }
    const pinnedRecipe = (typeof data.pin === 'string' && itemBy[data.pin]) ? data.pin : null;
    const cargoTab = (data.ctb === 'mat' || data.ctb === 'craft' || data.ctb === 'gear') ? data.ctb : 'mat';
    const seenSp = new Set<string>();
    if (Array.isArray(data.seen)) for (const id of data.seen.slice(0, 3000)) { if (typeof id === 'string') seenSp.add(id.slice(0, 24)); }
    const journal: SaveStateV2['journal'] = [];
    if (Array.isArray(data.jrn)) for (const j of data.jrn.slice(-24) as Array<Record<string, unknown>>) {
      if (j && j.n) journal.push({ s: num(j.s) | 0, n: String(j.n).slice(0, 28), w: String(j.w || '').slice(0, 16), t: clamp(num(j.t), 0, 4102444800000) });
    }
    /* exploit audit: a mined stamp edited to 0 pre-armed 30 loads on every
       world — floor each stamp to one accrual window before the save's own
       stamp; legitimate players are unaffected (the 30-load cap dominates) */
    const _minT = Math.max(0, _atL - 30 * 6e5);
    const mined = new Map<unknown, number>();
    for (const kv of (Array.isArray(data.minedw) ? data.minedw.slice(0, 60000) : []) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) mined.set(kv[0], clamp(num(kv[1]), _minT, _nowL)); }
    const skimX = new Map<unknown, number>();
    if (Array.isArray(data.skx)) { for (const kv of data.skx.slice(0, 60000) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) skimX.set(kv[0], clamp(num(kv[1]), 0, 1e7) | 0); } }
    /* mx capped while minedw is not — a mined world fallen off the cap must
       never read untouched, or its finite reserve silently refills */
    const mineX = new Map<unknown, number>();
    if (Array.isArray(data.mx)) {
      for (const kv of data.mx.slice(0, 60000) as Array<[unknown, unknown]>) { if (kv && kv[0] != null) mineX.set(kv[0], clamp(num(kv[1]), 0, 1e7) | 0); }
      for (const k of mined.keys()) if (!mineX.has(k)) mineX.set(k, 1);
    } else {
      for (const k of mined.keys()) mineX.set(k, 1);
    }
    const bioX = new Map<number, [number, number]>();
    if (Array.isArray(data.bx)) for (const kv of data.bx.slice(0, 60000) as Array<[unknown, unknown[]]>) {
      if (kv && kv[0] != null && Array.isArray(kv[1])) bioX.set(num(kv[0]), [clamp(num(kv[1][0]), 0, 999) | 0, clamp(num(kv[1][1]), 0, 1e9) | 0]);
    }
    const techOwned = new Set<string>();
    for (const t of _capA(data.tech, 100)) if (registry.techs.includes(t as string)) techOwned.add(t as string);
    /* absent ⇒ empty bench — veterans start crafting from zero like everyone */
    const items = new Map<string, number>();
    for (const kv of _capA(data.items, 300) as Array<[string, unknown]>) { if (kv && itemBy[kv[0]]) items.set(kv[0], clamp(num(kv[1]), 0, 999) | 0); }
    const equip: Record<string, string> = {};
    if (data.eq && typeof data.eq === 'object') {
      for (const sid of registry.eqSlots) {
        const id = (data.eq as Record<string, unknown>)[sid];
        if (typeof id === 'string' && itemBy[id] && itemBy[id]!.slot === sid && (items.get(id) || 0) > 0) equip[sid] = id;
      }
    }
    const equipAff: SaveStateV2['equipAff'] = {};
    if (data.ea && typeof data.ea === 'object') for (const sid of registry.eqSlots) {
      const a = (data.ea as Record<string, Record<string, unknown>>)[sid];
      const hi = a && registry.affixHi[a.k as string];   /* clamp to the affix's OWN hi */
      if (hi !== undefined && a && typeof a.forId === 'string' && equip[sid] === a.forId)
        equipAff[sid] = { k: a.k as string, v: clamp(num(a.v), 0, hi), forId: a.forId };
    }
    const ascCh = clamp(num(data.asc), 0, registry.ascChaptersLen) | 0;
    const ascProg: Record<string, number> = {};
    if (data.ascp && typeof data.ascp === 'object' && !Array.isArray(data.ascp)) {
      for (const k in data.ascp as Record<string, unknown>) { const v = +((data.ascp as Record<string, unknown>)[k] as number); if (typeof k === 'string' && k.length < 24 && Number.isFinite(v) && v >= 0) ascProg[k] = Math.min(v | 0, 999); }
    }
    const nameHue = Number.isFinite(+(data.nh as number)) ? clamp((+(data.nh as number)) | 0, -1, registry.rankHuesLen - 1) : -1;
    const savedView = _sanitizeView(data.view);
    const pstats: Record<string, number> = { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 };   /* the game's declared defaults */
    if (data.pstats && typeof data.pstats === 'object') { for (const _k of registry.statKeys) { const v = (data.pstats as Record<string, unknown>)[_k]; if (typeof v === 'number') pstats[_k] = clamp(Math.round(v), 1, 330); } }
    const HP_MAX = Math.max(20, Math.round(pstats.vit! * 2));   /* hpMaxFromVit */
    let hp = HP_MAX;
    if (typeof data.hp === 'number') hp = clamp(data.hp, 1, HP_MAX);   /* never load in dead */
    const fsMode = (data.fs === 'fs-lg' || data.fs === 'fs-xl') ? data.fs : '';   /* whitelist — becomes a body class */
    const toneMode = (data.tone === 'tone-bright' || data.tone === 'tone-max') ? data.tone : '';
    const fontMode = (data.font === 'font-sys' || data.font === 'font-mono') ? data.font : '';
    const sndOn = data.snd !== 0;
    const fxOn = data.fx !== 0;
    const chartsOn = data.chart === 1;   /* absent ⇒ off — the clean sky is the default */
    const shakeOn = data.shake !== 0;
    const salvageConfirm = data.sv !== 0;
    const notifOn = data.notif !== 0;
    const tipsOn = data.tips !== 0;
    const sfxVol = data.vol === undefined ? 1 : clamp(num(data.vol, 100), 0, 100) / 100;
    const glassTint = data.gt === undefined ? 0.72 : clamp(num(data.gt, 72) / 100, 0.40, 0.98);
    const _rmv = num(data.rm, -1);
    const motionMode = _rmv === 1 ? 1 : (_rmv === 0 ? 0 : -1);
    /* the old 0..7 clamp DESTROYED fold bits 8/16 on every reload — full mask */
    const cardExpand = clamp(num(data.cx), 0, 31) | 0;
    const notifications: SaveStateV2['notifications'] = [];
    for (const n of _capA(data.notifs, 60) as Array<Record<string, unknown>>) {
      if (n && n.tt != null && notifications.length < 60)
        notifications.push({ id: num(n.id) | 0, tt: String(n.tt).slice(0, 200), ms: String(n.ms == null ? '' : n.ms).slice(0, 400), t: clamp(num(n.t), 0, 4e12) || now, read: !!n.read });
    }
    const surveyedSet = new Set<string>();
    for (const s of _capA(data.surveyed, 60000)) surveyedSet.add(s as string);
    stats.surveys = surveyedSet.size;
    const galSeen = new Set<unknown>(); for (const s of _capA(data.gals, 20000)) galSeen.add(s);
    const surfSeen = new Set<unknown>(); for (const s of _capA(data.surf, 60000)) surfSeen.add(s);
    const xpFirsts = new Set<string>(); for (const s of _capA(data.xpf, 4000)) if (typeof s === 'string') xpFirsts.add(s.slice(0, 64));
    if (xpFirstsBinding !== null && (
      !Array.isArray(data.xpf)
      || data.xpf.length !== 4000
      || data.xpf.some((entry) => typeof entry !== 'string' || entry.length > 64)
      || xpFirsts.size !== 4000
    )) return { ok: false, reason: 'invalid' };
    const sysSeen = new Set<number>(); for (const s of _capA(data.sysv, 60000)) { const n = +(s as number); if (Number.isFinite(n)) sysSeen.add(n); }
    /* A legacy save may contain sysSeen without ever having serialized the
       corresponding dynamic Records counter. Preserve that v1 shape unless
       the nested carrier explicitly opts in; when it does, the identity
       ledger—not the free numeric claim—remains authority. */
    if (cumulativeRecord?.arrivals !== null && cumulativeRecord?.arrivals !== undefined) {
      stats.arrivals = sysSeen.size;
    }
    const starKindsSeen = new Set<string>(); for (const s of _capA(data.starK, 200)) starKindsSeen.add(s as string);
    const ptypesSeen = new Set<string>(); for (const s of _capA(data.ptypes, 200)) ptypesSeen.add(s as string);
    const eventKeysSeen = new Set<string>(); for (const s of _capA(data.evts, 400)) eventKeysSeen.add(s as string);
    const evAnnounced = new Set<string>(); for (const s of _capA(data.evann, 120)) evAnnounced.add(s as string);
    const unlocked = new Set<string>(); for (const a of _capA(data.ach, registry.achLen + 50)) unlocked.add(a as string);

    /* codex — every genome through THE sanitizer; size survives UNWRAPPED
       (the v1.8.6 lesson). Entry shape mirrors _storeSpecies' snapshot
       surface; the grade rides ringGrade's region cap. */
    const codex = new Map<string, CodexEntry>();
    for (const e of _capA(data.codex, 1500) as Array<Record<string, unknown>>) {
      try {
      const _sg = e && e.g && sanitizeImportedGenomeV2(e.g);
      if (!_sg) continue;
      const savedGenome = _sg as Record<string, unknown>;
      savedGenome.gen = generation(savedGenome.gen);
      const g = _sg as unknown as Genome;
      const from = String(e.f || '').replace(/[<>&"']/g, '').slice(0, 48) || null;
      const where = _sanitizeView(e.w) || null;
      const id = 's' + (g as { seed: number }).seed;   /* codexId */
      if (codex.has(id)) continue;                     /* _storeSpecies: first sighting wins */
      const d = describeSpecies(g);
      const grade = ringGrade(g as never, d.grade as never, where) as { tier?: number } | null;
      let name = d.name;
      const cn = customNames.get('c' + id);
      if (cn) name = cn;
      /* realmModifiers/ecologyRole/realmBiome are computed by _storeSpecies
         too — called here so a future snapshot extension stays cheap */
      void realmModifiers(g); void ecologyRole(g); void realmBiome(g);
      const entry: CodexEntry = {
        id, name, kind: d.kind, tier: grade && typeof grade.tier === 'number' ? grade.tier : null,
        realm: classifyRealm(g), sapient: sapienceTier(g),
        from: from || 'Unknown world', hybrid: !!(g as { parents?: unknown }).parents,
        g: _sg as Record<string, unknown>, where,
      };
      codex.set(id, entry);
      /* onSpeciesStored's DERIVED stats — recomputed as the codex restores,
         not read from the save (found when veteran_rich pinned best=4,
         hybrids=1 against this importer's declaration zeros) */
      if (entry.hybrid) stats.hybrids = (stats.hybrids || 0) + 1;
      if (entry.tier != null && entry.tier > stats.best!) stats.best = entry.tier;
      /* Deliberate v2 hardening over the frozen v1.8.9 fixture: maxGen and
         the genome now share the same validated numeric counter. */
      const _gen = generation(savedGenome.gen);
      if (_gen > stats.maxGen!) stats.maxGen = _gen;
      } catch {
        /* One malformed creature must never make the otherwise recoverable
           expedition fail as a whole. The verbatim sanitizer deliberately
           preserves honest out-of-range evolution drift (notably `size`), so
           descriptor totality is contained at the entry boundary instead of
           rewriting genome values on load. */
        continue;
      }
    }
    if (cumulativeRecord) {
      stats.hybrids = Math.max(stats.hybrids || 0, cumulativeRecord.hybrids);
      stats.best = Math.max(stats.best || 0, cumulativeRecord.best);
      stats.maxGen = Math.max(stats.maxGen || 0, cumulativeRecord.maxGen);
      if (cumulativeRecord.scanhits > 0) {
        stats.scanhits = Math.max(stats.scanhits || 0, cumulativeRecord.scanhits);
      }
    }
    /* pre-v1.7 veteran: `seen` ABSENT (not empty) ⇒ everything already
       catalogued counts as viewed — the new-dot flood guard */
    if (!Array.isArray(data.seen)) for (const id of codex.keys()) seenSp.add(id);

    const voiceOn = data.vce != null ? !!data.vce : true;
    const combatSfxOn = data.cbx != null ? !!data.cbx : true;
    let tutSnapPending: unknown = null;
    let rescuedLegacyTrainingCompleted = false;
    const trainingSnapshot: ImportTrainingSnapshotIngressV2 = (() => {
      const rawSnapshot = data.tsnap;
      if (!rawSnapshot || typeof rawSnapshot !== 'object') {
        return Object.freeze({ kind: 'none' as const });
      }
      const currentViewShape = !Array.isArray(rawSnapshot)
        && Object.keys(rawSnapshot as Record<string, unknown>).length === 1
        && Object.prototype.hasOwnProperty.call(rawSnapshot, 'view');
      if (currentViewShape && data.tut) return Object.freeze({ kind: 'none' as const });
      if (currentViewShape) {
        const view = projectRawRoute((rawSnapshot as { view: unknown }).view);
        const boundedCurrentSnapshot = cloneBoundedTrainingEvidence(rawSnapshot);
        /* Preserve every bounded byte of the current one-key checkpoint for
           export parity. If its view hides hostile bulk, retain only the
           already-bounded route projection rather than a second raw copy. */
        tutSnapPending = boundedCurrentSnapshot === TRAINING_EVIDENCE_REJECTED
          ? Object.freeze({ view })
          : boundedCurrentSnapshot;
        return Object.freeze({
          kind: 'current-view' as const,
          view,
        });
      }
      const legacyCheckpoint = classifyLegacyTrainingCheckpointV1(rawSnapshot);
      if (legacyCheckpoint && (data.tut === 0 || data.tut === 1)) {
        rescuedLegacyTrainingCompleted = data.tut === 1;
        tutSnapPending = legacyCheckpoint;
        return Object.freeze({
          kind: 'legacy-v1' as const,
          snapshot: legacyCheckpoint,
          rescuedCompleted: rescuedLegacyTrainingCompleted,
        });
      }
      const boundedSnapshot = cloneBoundedTrainingEvidence(rawSnapshot);
      if (boundedSnapshot === TRAINING_EVIDENCE_REJECTED) {
        return Object.freeze({ kind: 'legacy-or-unknown' as const, retention: 'save-only' as const });
      }
      tutSnapPending = boundedSnapshot;
      return Object.freeze({ kind: 'legacy-or-unknown' as const, snapshot: boundedSnapshot });
    })();
    const scoutId = (typeof data.scout === 'string' && codex.has(data.scout)) ? data.scout : null;
    const chDone = new Set<string>();
    for (const s of _capA(data.chs, 500)) if (registry.charterStarters.includes(s as string)) chDone.add(s as string);
    const chWeek = num(data.chw, -1);
    const chProg: Record<string, number> = {};
    if (data.chp && typeof data.chp === 'object' && !Array.isArray(data.chp)) {
      for (const k in data.chp as Record<string, unknown>) { const v = +((data.chp as Record<string, unknown>)[k] as number); if (typeof k === 'string' && k.length < 24 && Number.isFinite(v) && v >= 0) chProg[k] = Math.min(v | 0, 999); }
    }
    const chacc = new Set<string>();
    for (const s of _capA(data.chacc, 50)) if (typeof s === 'string' && !chDone.has(s) && (registry.charterStarters.includes(s) || registry.charterPool.includes(s))) chacc.add(s);

    /* Atlas — rebuilt with COERCED fields only (renderLog's innerHTML sinks) */
    const _cs = (v: unknown, n: number): string => cleanName(v == null ? '' : v, n);
    const _cw = (w: unknown): Record<string, unknown> | null => {
      if (!w || typeof w !== 'object') return null;
      const src = w as Record<string, unknown>;
      const type = typeof src.type === 'string' && ['planet', 'star', 'galaxy'].includes(src.type) ? src.type : null;
      if (!type) return null;
      const o: Record<string, unknown> = {};
      if (src.gal && typeof src.gal === 'object') {
        const g = src.gal as Record<string, unknown>;
        const gx = +g.x!, gy = +g.y!, gs = +g.seed!;
        if (Number.isFinite(gx) && Number.isFinite(gy) && Number.isFinite(gs)) {
          const gal: Record<string, unknown> = { x: gx, y: gy, seed: gs };
          for (const gk of ['size', 'sp', 'tilt', 'rot', 'seed']) { const gv = num(g[gk], NaN); if (Number.isFinite(gv)) gal[gk] = gv; }
          for (const gk of ['home', 'quasar', 'dwarf']) if (g[gk]) gal[gk] = true;
          o.gal = gal;
        }
      }
      if (!o.gal) return null;
      for (const k of ['pseed', 'sseed', 'seed', 'orb', 'm', 'pi']) { const v2 = num(src[k], NaN); if (Number.isFinite(v2)) o[k] = v2; }
      if (type === 'star' || type === 'planet') {
        if (!src.star || typeof src.star !== 'object') return null;
        const star = src.star as Record<string, unknown>;
        const sx = +star.x!, sy = +star.y!, ss = +star.seed!;
        if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(ss)) return null;
        o.star = { x: sx, y: sy, seed: ss };
      }
      if (type === 'planet' && !Number.isFinite(+src.pseed!)) return null;
      o.type = type;
      return o;
    };
    const logMap = new Map<string, Record<string, unknown>>();
    const rawAtlasWhereById = new Map<string, unknown>();
    for (const it of _capA(data.log, 150) as Array<Record<string, unknown>>) {
      if (it && it.id != null) {
        const _id = _cs(it.id, CF1_WORLD_ATLAS_ID_MAX_CHARS);
        if (!_id) continue;   /* an all-stripped id must not mint an empty key */
        const entry: Record<string, unknown> = {
          id: _id, title: _cs(it.title, 60) || 'Charted place', sub: _cs(it.sub, 120),
          /* CF-RR-001: STRICT base64 charset — no quotes, no attribute breakout */
          thumb: (typeof it.thumb === 'string' && it.thumb.length < 300000 &&
            /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(it.thumb)) ? it.thumb : null,
          sq: !!it.sq, badge: _cs(it.badge, 18), where: _cw(it.where), fav: !!it.fav, t: clamp(num(it.t), 0, 4102444800000),
        };
        /* Field Training's v1 checkpoint carries the Atlas star-class
           display/history label separately from `where.star` identity. Keep
           absent legacy fields absent, but preserve an explicitly empty one. */
        if (Object.prototype.hasOwnProperty.call(it, 'star')) entry.star = _cs(it.star, 24);
        logMap.set(_id, entry);
        rawAtlasWhereById.set(_id, projectRawRoute(it.where));
      }
    }
    const atlasWhere = frozenAtlasWhereLookup(
      [...logMap].map(([id, entry]) => [entry, rawAtlasWhereById.get(id)] as const),
    );
    const homeId = (() => {
      const _h = _cs(data.home, CF1_WORLD_ATLAS_ID_MAX_CHARS);
      return (_h && logMap.has(_h)) ? _h : null;
    })();
    const landed = new Set<number>(); for (const s of _capA(data.land, 60000)) { const n = +(s as number); if (Number.isFinite(n)) landed.add(n); }
    const contacted = new Set<number>(); for (const s of _capA(data.cont, 4000)) { const n = +(s as number); if (Number.isFinite(n)) contacted.add(n); }
    const waveOffs = new Map<number, number>();
    if (Array.isArray(data.wvo)) for (const e2 of data.wvo.slice(-400) as unknown[]) {
      if (!Array.isArray(e2)) continue;
      const s2 = +(e2[0] as number), n2 = Math.max(0, Math.min(5, (+(e2[1] as number)) | 0));
      if (Number.isFinite(s2) && n2 > 0) waveOffs.set(s2, n2);
    }
    const primeFill: SaveStateV2['primeFill'] = {};
    if (data.prime && typeof data.prime === 'object' && !Array.isArray(data.prime)) {
      const _sanS = (v: unknown, n2: number): string => String(v == null ? '' : v).replace(/[<>&"']/g, '').slice(0, n2);
      for (const k in data.prime as Record<string, unknown>) {
        const f = (data.prime as Record<string, Record<string, unknown>>)[k];
        if (!registry.sigIds.includes(k) || !f || typeof f !== 'object') continue;
        primeFill[k] = {
          title: _sanS(f.title, 48) || 'a lost record', sub: _sanS(f.sub, 32),
          tier: clamp(num(f.tier), 0, TIER_MAX) | 0,
          hex: /^#[0-9a-fA-F]{3,8}$/.test(String(f.hex || '')) ? String(f.hex) : '#9fb6d6',
          where: _sanitizeView(f.where) || null,
        };
      }
    }
    /* applyNameplate's "unlocks never demote" raise, run at load exactly as
       renderRank does: the RANK the restored record already earns lifts
       bestRank above the saved br (found when pre_v17_veteran pinned
       bestRank=1 from br-less data — score 52 ⇒ Scout). Formula verbatim
       from rankInfo/rankIdx (main.js 13803/13824). */
    {
      const RANKS_FLOORS = [0, 30, 90, 220, 460, 900, 1700, 3000, 5200, 8200];
      const score = stats.surveys! * 4 + codex.size * 2 + stats.best! * 12 + unlocked.size * 6 + stats.hybrids! + galSeen.size * 3;
      const last = RANKS_FLOORS[RANKS_FLOORS.length - 1]!;
      const floor = score >= last ? last + Math.floor((score - last) / 3000) * 3000
        : RANKS_FLOORS.reduce((f, r) => (score >= r ? r : f), 0);
      let idx = 0; for (let k = 0; k < RANKS_FLOORS.length; k++) if (floor >= RANKS_FLOORS[k]!) idx = k;
      if (idx > (stats.bestRank || 0)) stats.bestRank = idx;
    }
    const frontierUnlocked = !!data.frontier;
    /* Unknown legacy/future-within-v4 ids remain round-trippable evidence,
       not authority: consumers must call isKnownFrontierEndingId first. */
    const frontierEnding = typeof data.ending === 'string'
      && /^[a-z][a-z0-9-]{0,31}$/.test(data.ending)
      ? data.ending : null;
    const seenGuide = !!data.guide;
    /* The shipped legacy restart bug could persist `tut:1` beside its exact
       pre-Training checkpoint. Normalize that proven pair back to pending so
       an ordinary export cannot cement completed+pending or erase the rescue. */
    const tutDone = rescuedLegacyTrainingCompleted
      ? false
      : data.tut === undefined ? true : !!data.tut;   /* absent ⇒ done — never force training on a held run */
    const rnSeen = typeof data.rn === 'string' ? data.rn.slice(0, 12) : '0';

    return {
      ok: true,
      state: {
        EPOCH_BASE, essence, explorerName, lastAnomKey, stats, pstats, hp, HP_MAX,
        customNames: [...customNames.entries()], conquered: [...conquered.entries()],
        cargo: [...cargo.entries()], cgx: [...cgx.entries()],
        items: [...items.entries()], equip, equipAff, pinnedRecipe, cargoTab,
        seenSp: [...seenSp.values()], journal,
        mined: [...mined.entries()], mineX: [...mineX.entries()], skimX: [...skimX.entries()],
        bioX: [...bioX.entries()], techOwned: [...techOwned.values()],
        claimedSets: [...claimedSets.values()], ascCh, ascProg, nameHue, savedView,
        fsMode, toneMode, fontMode, sndOn, fxOn, chartsOn, shakeOn, salvageConfirm,
        notifOn, tipsOn, sfxVol, glassTint, motionMode, cardExpand, notifications,
        surveyedSet: [...surveyedSet.values()], galSeen: [...galSeen.values()],
        surfSeen: [...surfSeen.values()], xpFirsts: [...xpFirsts.values()], xpFirstsBinding,
        sysSeen: [...sysSeen.values()], starKindsSeen: [...starKindsSeen.values()],
        ptypesSeen: [...ptypesSeen.values()], eventKeysSeen: [...eventKeysSeen.values()],
        evAnnounced: [...evAnnounced.values()], unlocked: [...unlocked.values()],
        landed: [...landed.values()], contacted: [...contacted.values()],
        waveOffs: [...waveOffs.entries()], primeFill, frontierUnlocked, frontierEnding, seenGuide, tutDone,
        rnSeen, tutSnapPending, scoutId, chWeek, chProg,
        chacc: [...chacc.values()], chDone: [...chDone.values()], homeId,
        voiceOn, combatSfxOn, logMap: [...logMap.entries()],
        codex: [...codex.entries()],
      },
      ingress: Object.freeze({
        savedView: projectRawRoute(data.view),
        atlasWhere,
        trainingSnapshot,
      }),
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
