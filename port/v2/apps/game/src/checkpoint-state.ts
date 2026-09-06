/* Receipt-free checkpoint projection.

   A checkpoint starts from the last durable SaveState and may overlay only
   route/profile/preferences/Guide/release fields plus bounded notification
   history and its read flags. Product, progression, ownership, economy, Atlas,
   and naming state always comes from the durable
   parent, so an unrelated receipt-free write cannot smuggle optimistic live
   state across the F4 lease/revision boundary. */
import { checkedEcologyEpoch } from '@cf/domain-ecology';
import type { SaveStateV2 } from '@cf/persistence';

/** Exhaustive current SaveStateV2 top-level inventory. This is exported so a
 * schema addition cannot silently escape the checkpoint touch-scope tests. */
export const SAVE_STATE_V2_FIELD_INVENTORY = Object.freeze([
  'EPOCH_BASE',
  'essence',
  'explorerName',
  'lastAnomKey',
  'stats',
  'pstats',
  'hp',
  'HP_MAX',
  'customNames',
  'conquered',
  'cargo',
  'cgx',
  'items',
  'equip',
  'equipAff',
  'pinnedRecipe',
  'cargoTab',
  'seenSp',
  'journal',
  'mined',
  'mineX',
  'skimX',
  'bioX',
  'techOwned',
  'claimedSets',
  'ascCh',
  'ascProg',
  'nameHue',
  'savedView',
  'fsMode',
  'toneMode',
  'fontMode',
  'sndOn',
  'fxOn',
  'chartsOn',
  'shakeOn',
  'salvageConfirm',
  'notifOn',
  'tipsOn',
  'sfxVol',
  'glassTint',
  'motionMode',
  'cardExpand',
  'notifications',
  'surveyedSet',
  'galSeen',
  'surfSeen',
  'xpFirsts',
  'xpFirstsBinding',
  'sysSeen',
  'starKindsSeen',
  'ptypesSeen',
  'eventKeysSeen',
  'evAnnounced',
  'unlocked',
  'landed',
  'contacted',
  'waveOffs',
  'primeFill',
  'frontierUnlocked',
  'frontierEnding',
  'seenGuide',
  'tutDone',
  'rnSeen',
  'tutSnapPending',
  'scoutId',
  'chWeek',
  'chProg',
  'chacc',
  'chDone',
  'homeId',
  'voiceOn',
  'combatSfxOn',
  'logMap',
  'codex',
] as const satisfies readonly (keyof SaveStateV2)[]);

type InventoriedSaveField = (typeof SAVE_STATE_V2_FIELD_INVENTORY)[number];
type MissingSaveField = Exclude<keyof SaveStateV2, InventoriedSaveField>;
const SAVE_STATE_INVENTORY_IS_EXHAUSTIVE:
  [MissingSaveField] extends [never] ? true : never = true;
void SAVE_STATE_INVENTORY_IS_EXHAUSTIVE;

/** Complete ordinary checkpoint touch scope. EPOCH_BASE and savedView come
 * from explicit proven inputs; every other row comes from the live SaveState. */
export const CHECKPOINT_STATE_OVERLAY_FIELDS = Object.freeze([
  'EPOCH_BASE',
  'savedView',
  'explorerName',
  'nameHue',
  'pinnedRecipe',
  'cargoTab',
  'fsMode',
  'toneMode',
  'fontMode',
  'sndOn',
  'fxOn',
  'chartsOn',
  'shakeOn',
  'salvageConfirm',
  'notifOn',
  'tipsOn',
  'sfxVol',
  'glassTint',
  'motionMode',
  'cardExpand',
  'notifications',
  'seenGuide',
  'rnSeen',
  'voiceOn',
  'combatSfxOn',
] as const satisfies readonly (keyof SaveStateV2)[]);

/** The subset sourced from the current live SaveState. */
export const CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS = Object.freeze([
  'explorerName',
  'nameHue',
  'pinnedRecipe',
  'cargoTab',
  'fsMode',
  'toneMode',
  'fontMode',
  'sndOn',
  'fxOn',
  'chartsOn',
  'shakeOn',
  'salvageConfirm',
  'notifOn',
  'tipsOn',
  'sfxVol',
  'glassTint',
  'motionMode',
  'cardExpand',
  'notifications',
  'seenGuide',
  'rnSeen',
  'voiceOn',
  'combatSfxOn',
] as const satisfies readonly (keyof SaveStateV2)[]);

/** Explicit replacement-only extension to the ordinary scope. */
export const CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS = Object.freeze([
  'tutDone',
  'tutSnapPending',
] as const satisfies readonly (keyof SaveStateV2)[]);

const INPUT_FIELDS = Object.freeze([
  'durable', 'live', 'savedView', 'epoch', 'trainingReplacement',
] as const);
const OPTIONAL_SAVE_FIELDS = new Set<keyof SaveStateV2>(['xpFirstsBinding']);
const SAVE_FIELDS = new Set<string>(SAVE_STATE_V2_FIELD_INVENTORY);
const MAX_CLONE_NODES = 1_500_000;

const STRING_LIVE_FIELDS = new Set<keyof SaveStateV2>([
  'explorerName', 'cargoTab', 'fsMode', 'toneMode', 'fontMode', 'rnSeen',
]);
const BOOLEAN_LIVE_FIELDS = new Set<keyof SaveStateV2>([
  'sndOn', 'fxOn', 'chartsOn', 'shakeOn', 'salvageConfirm', 'notifOn', 'tipsOn',
  'seenGuide', 'voiceOn', 'combatSfxOn',
]);
const NUMBER_LIVE_FIELDS = new Set<keyof SaveStateV2>([
  'nameHue', 'sfxVol', 'glassTint', 'motionMode', 'cardExpand',
]);

export interface CheckpointStateInput {
  readonly durable: SaveStateV2;
  readonly live: SaveStateV2;
  readonly savedView: Record<string, unknown> | null;
  readonly epoch: number;
  readonly trainingReplacement: boolean;
}

export type CheckpointStateRefusalDetail =
  | 'input:invalid'
  | 'durable:invalid'
  | 'live:invalid'
  | 'saved-view:invalid'
  | 'epoch:invalid'
  | `live-field:${(typeof CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS)[number]}:invalid`
  | `training-field:${(typeof CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS)[number]}:invalid`;

export type CheckpointStateProjection =
  | Readonly<{
    kind: 'projected';
    state: SaveStateV2;
    appliedFields: readonly (keyof SaveStateV2)[];
  }>
  | Readonly<{ kind: 'refused'; detail: CheckpointStateRefusalDetail }>;

interface CloneBudget { nodes: number; }

function consumeCloneBudget(budget: CloneBudget, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0
    || budget.nodes > MAX_CLONE_NODES - amount) {
    throw new RangeError('checkpoint state exceeds the detachment bound');
  }
  budget.nodes += amount;
}

function defineData(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function clonePlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: CloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('checkpoint input must be plain data');
  if (depth > 256 || ancestors.has(value)) {
    throw new TypeError('checkpoint input is cyclic or too deep');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('checkpoint arrays must be native');
      const keys = Reflect.ownKeys(value);
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('checkpoint array shape is invalid');
      }
      const length = lengthDescriptor.value as number;
      consumeCloneBudget(budget, length);
      const clone = new Array<unknown>(length);
      for (let index = 0; index < length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined) continue;
        if (!('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('checkpoint arrays cannot contain accessors');
        }
        defineData(
          clone,
          String(index),
          clonePlainData(descriptor.value, ancestors, budget, depth + 1),
        );
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('checkpoint objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    consumeCloneBudget(budget, keys.length);
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys) {
      if (typeof key !== 'string') throw new TypeError('checkpoint data cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('checkpoint data cannot contain accessors or hidden fields');
      }
      defineData(
        clone,
        key,
        clonePlainData(descriptor.value, ancestors, budget, depth + 1),
      );
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function exactInputFields(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...INPUT_FIELDS].sort();
  if (keys.length !== expected.length
    || names.some((name, index) => name !== expected[index])) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const field of INPUT_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    fields[field] = descriptor.value;
  }
  return Object.freeze(fields);
}

/** Validate only the top-level live carrier. Forbidden product subtrees are
 * never traversed or copied, but an accessor/proxy cannot hide at the save
 * boundary and run during a later read. */
function checkedSaveTopLevel(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== 'string' || !SAVE_FIELDS.has(key))) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    fields[key] = descriptor.value;
  }
  for (const field of SAVE_STATE_V2_FIELD_INVENTORY) {
    if (!OPTIONAL_SAVE_FIELDS.has(field) && !Object.prototype.hasOwnProperty.call(fields, field)) {
      return null;
    }
  }
  return Object.freeze(fields);
}

/** Refuse oversized/sparse or decorated arrays before detachment. Field values
 * are never read here: the shared clone rejects accessors, cycles and custom
 * prototypes before the bounded notification row validator examines them. */
function boundedNotificationArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isInteger(length.value)
    || length.value < 0 || length.value > 60) return false;
  const expected = new Set(['length', ...Array.from({ length: length.value as number }, (_, index) => String(index))]);
  const keys = Reflect.ownKeys(value);
  return keys.length === expected.size && keys.every((key) => typeof key === 'string' && expected.has(key));
}

function validNotificationHistory(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 60) return false;
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const row = entry as Record<string, unknown>;
    const keys = Object.keys(row).sort();
    if (keys.join(',') !== 'id,ms,read,t,tt') return false;
    return typeof row.id === 'number' && Number.isInteger(row.id)
      && row.id >= -2_147_483_648 && row.id <= 2_147_483_647
      && typeof row.tt === 'string' && row.tt.length <= 200
      && typeof row.ms === 'string' && row.ms.length <= 400
      && typeof row.t === 'number' && Number.isFinite(row.t) && row.t >= 0 && row.t <= 4e12
      && typeof row.read === 'boolean';
  });
}

function validLiveField(field: keyof SaveStateV2, value: unknown): boolean {
  if (STRING_LIVE_FIELDS.has(field)) return typeof value === 'string';
  if (BOOLEAN_LIVE_FIELDS.has(field)) return typeof value === 'boolean';
  if (NUMBER_LIVE_FIELDS.has(field)) return typeof value === 'number' && Number.isFinite(value);
  if (field === 'pinnedRecipe') return value === null || typeof value === 'string';
  if (field === 'notifications') return validNotificationHistory(value);
  return false;
}

function refused(detail: CheckpointStateRefusalDetail): CheckpointStateProjection {
  return Object.freeze({ kind: 'refused', detail });
}

export function projectCheckpointState(inputValue: CheckpointStateInput): CheckpointStateProjection {
  try {
    const input = exactInputFields(inputValue);
    if (input === null || typeof input.trainingReplacement !== 'boolean') {
      return refused('input:invalid');
    }
    const durableFields = checkedSaveTopLevel(input.durable);
    if (durableFields === null) return refused('durable:invalid');
    const liveFields = checkedSaveTopLevel(input.live);
    if (liveFields === null) return refused('live:invalid');

    let epoch: number;
    try { epoch = checkedEcologyEpoch(input.epoch); }
    catch { return refused('epoch:invalid'); }

    let state: SaveStateV2;
    try {
      const detached = clonePlainData(input.durable, new Set<object>(), { nodes: 0 }, 0);
      if (!detached || typeof detached !== 'object' || Array.isArray(detached)) {
        return refused('durable:invalid');
      }
      state = detached as SaveStateV2;
    } catch {
      return refused('durable:invalid');
    }

    let savedView: Record<string, unknown> | null;
    try {
      if (input.savedView === null) savedView = null;
      else {
        const detached = clonePlainData(input.savedView, new Set<object>(), { nodes: 0 }, 0);
        if (!detached || typeof detached !== 'object' || Array.isArray(detached)) {
          return refused('saved-view:invalid');
        }
        savedView = detached as Record<string, unknown>;
      }
    } catch {
      return refused('saved-view:invalid');
    }

    for (const field of CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS) {
      const value = liveFields[field];
      let detached: unknown;
      try {
        if (field === 'notifications' && !boundedNotificationArray(value)) {
          return refused('live-field:notifications:invalid');
        }
        // Inspect only detached plain data; no live notification accessor runs.
        detached = clonePlainData(value, new Set<object>(), { nodes: 0 }, 0);
      } catch {
        return refused(`live-field:${field}:invalid`);
      }
      if (!validLiveField(field, detached)) return refused(`live-field:${field}:invalid`);
      (state as unknown as Record<string, unknown>)[field] = detached;
    }
    state.EPOCH_BASE = epoch;
    state.savedView = savedView;

    const appliedFields: (keyof SaveStateV2)[] = [...CHECKPOINT_STATE_OVERLAY_FIELDS];
    if (input.trainingReplacement) {
      if (typeof liveFields.tutDone !== 'boolean') {
        return refused('training-field:tutDone:invalid');
      }
      let snapshot: unknown;
      try {
        snapshot = clonePlainData(
          liveFields.tutSnapPending,
          new Set<object>(),
          { nodes: 0 },
          0,
        );
      } catch {
        return refused('training-field:tutSnapPending:invalid');
      }
      state.tutDone = liveFields.tutDone;
      state.tutSnapPending = snapshot;
      appliedFields.push(...CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS);
    }

    return Object.freeze({
      kind: 'projected',
      state,
      appliedFields: Object.freeze(appliedFields),
    });
  } catch {
    return refused('input:invalid');
  }
}
