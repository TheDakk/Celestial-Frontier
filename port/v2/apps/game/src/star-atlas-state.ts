/* Shared strict Star Atlas state boundary.

   The shipped Atlas writers operate on v4-compatible `logMap` rows inside
   the F4 SaveState. This helper generalizes the proven Arc 9 Favorite
   detachment, row validation and sealing discipline for the Home and Remove
   owners plus their read-only presentation. It owns no DOM, route sidecar,
   clock, RNG, save call, or gameplay rule. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import { CF1_WORLD_ATLAS_ID_MAX_CHARS } from '@cf/scene';

export const STAR_ATLAS_MAX_ROWS_V1 = 120 as const;
const MAX_CLONE_NODES = 1_500_000;
const MAX_CLONE_CHARACTERS = 16 * 1024 * 1024;
const MAX_DEPTH = 256;
const STAR_ATLAS_STATE_SEAL_SCHEMA_V1 = 'cf-v2-star-atlas-state/v1';
const STAR_ATLAS_ROWS_SEAL_SCHEMA_V1 = 'cf-v2-star-atlas-rows/v1';

export type StarAtlasStateProtectionReasonV1 =
  | 'state-shape'
  | 'atlas-shape'
  | 'atlas-capacity'
  | 'atlas-id-duplicate'
  | 'atlas-target-missing'
  | 'atlas-target-shape'
  | 'atlas-home-shape';

export class StarAtlasStateProtectionV1 extends Error {
  constructor(readonly reason: StarAtlasStateProtectionReasonV1) {
    super(reason);
  }
}

function protect(reason: StarAtlasStateProtectionReasonV1): never {
  throw new StarAtlasStateProtectionV1(reason);
}

interface CloneBudgetV1 { nodes: number; characters: number; }

function consumeCloneBudget(budget: CloneBudgetV1, nodes: number, characters = 0): void {
  if (budget.nodes > MAX_CLONE_NODES - nodes
    || budget.characters > MAX_CLONE_CHARACTERS - characters) {
    throw new RangeError('Star Atlas state exceeds its detachment bound');
  }
  budget.nodes += nodes;
  budget.characters += characters;
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
  budget: CloneBudgetV1,
  depth: number,
): unknown {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Star Atlas numbers must be finite');
    return value;
  }
  if (typeof value === 'string') {
    consumeCloneBudget(budget, 0, value.length);
    return value;
  }
  if (typeof value !== 'object' || depth > MAX_DEPTH || ancestors.has(value)) {
    throw new TypeError('Star Atlas state must be acyclic plain JSON data');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || value.length > MAX_CLONE_NODES) {
        throw new TypeError('Star Atlas arrays must be bounded and native');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Star Atlas arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Star Atlas arrays cannot contain holes or accessors');
        }
        clone.push(clonePlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Star Atlas objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Star Atlas state cannot contain symbols');
    }
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys as string[]) {
      consumeCloneBudget(budget, 0, key.length);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Star Atlas state cannot contain accessors or hidden fields');
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

export function detachStarAtlasDataV1<T>(value: T): T {
  return clonePlainData(
    value,
    new Set<object>(),
    { nodes: 0, characters: 0 },
    0,
  ) as T;
}

export function starAtlasPlainRecordV1(
  value: unknown,
  reason: StarAtlasStateProtectionReasonV1,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) protect(reason);
  const prototype = Object.getPrototypeOf(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) protect(reason);
  return value as Record<string, unknown>;
}

export function starAtlasDataValueV1(
  record: Record<string, unknown>,
  key: string,
  reason: StarAtlasStateProtectionReasonV1,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  return descriptor.value;
}

export function exactStarAtlasIdV1(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 1
    && value.length <= CF1_WORLD_ATLAS_ID_MAX_CHARS
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

function exactJson(value: unknown): string {
  const encoded = JSON.stringify(value);
  if (typeof encoded !== 'string') throw new TypeError('Star Atlas data is not JSON');
  return encoded;
}

export function sameStarAtlasJsonV1(left: unknown, right: unknown): boolean {
  try { return exactJson(left) === exactJson(right); } catch { return false; }
}

export function starAtlasRowsSealV1(rows: readonly unknown[]): string {
  return sha256Hex(`${STAR_ATLAS_ROWS_SEAL_SCHEMA_V1}\u0000${canonicalJson(rows)}`);
}

export function starAtlasStateSealV1(
  rows: readonly unknown[],
  homeId: string | null,
): string {
  return sha256Hex(`${STAR_ATLAS_STATE_SEAL_SCHEMA_V1}\u0000${canonicalJson({ rows, homeId })}`);
}

export interface CheckedStarAtlasStateV1 {
  readonly rows: Array<[string, Record<string, unknown>]>;
  readonly byId: ReadonlyMap<string, Record<string, unknown>>;
  readonly homeId: string | null;
  readonly targetIndex: number;
  readonly targetEntry: Record<string, unknown> | null;
  readonly rowsSeal: string;
  readonly stateSeal: string;
}

/** Validate the compatibility Atlas without interpreting routes or display
 * metadata. Callers that need a target pass its exact id; post-remove fixed
 * points deliberately inspect with `requireTarget=false`. */
export function inspectStarAtlasStateV1(
  stateValue: SaveStateV2,
  targetId: string | null = null,
  requireTarget = false,
): CheckedStarAtlasStateV1 {
  const root = starAtlasPlainRecordV1(stateValue, 'state-shape');
  if (targetId !== null && !exactStarAtlasIdV1(targetId)) protect('atlas-target-shape');
  const value = starAtlasDataValueV1(root, 'logMap', 'atlas-shape');
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Reflect.ownKeys(value).length !== value.length + 1) protect('atlas-shape');
  if (value.length > STAR_ATLAS_MAX_ROWS_V1) protect('atlas-capacity');
  const rows: Array<[string, Record<string, unknown>]> = [];
  const byId = new Map<string, Record<string, unknown>>();
  let targetIndex = -1;
  let targetEntry: Record<string, unknown> | null = null;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    const pair = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (!descriptor || descriptor.enumerable !== true || !Array.isArray(pair)
      || Object.getPrototypeOf(pair) !== Array.prototype || pair.length !== 2
      || Reflect.ownKeys(pair).length !== 3) protect('atlas-shape');
    const idDescriptor = Object.getOwnPropertyDescriptor(pair, '0');
    const entryDescriptor = Object.getOwnPropertyDescriptor(pair, '1');
    const id = idDescriptor && 'value' in idDescriptor ? idDescriptor.value : null;
    const targetCandidate = targetId !== null && id === targetId;
    if (!idDescriptor || idDescriptor.enumerable !== true || !exactStarAtlasIdV1(id)) {
      protect(targetCandidate ? 'atlas-target-shape' : 'atlas-shape');
    }
    if (byId.has(id)) protect('atlas-id-duplicate');
    const entryValue = entryDescriptor && 'value' in entryDescriptor
      ? entryDescriptor.value : null;
    const entry = starAtlasPlainRecordV1(
      entryValue,
      targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
    );
    const rowId = starAtlasDataValueV1(
      entry,
      'id',
      targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
    );
    const favorite = starAtlasDataValueV1(
      entry,
      'fav',
      targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
    );
    if (rowId !== id || typeof favorite !== 'boolean') {
      protect(targetCandidate ? 'atlas-target-shape' : 'atlas-shape');
    }
    const row = pair as [string, Record<string, unknown>];
    rows.push(row);
    byId.set(id, entry);
    if (targetCandidate) {
      targetIndex = index;
      targetEntry = entry;
    }
  }
  if (requireTarget && targetEntry === null) protect('atlas-target-missing');
  const home = starAtlasDataValueV1(root, 'homeId', 'atlas-home-shape');
  if (home !== null && (!exactStarAtlasIdV1(home) || !byId.has(home))) {
    protect('atlas-home-shape');
  }
  const homeId = home as string | null;
  return Object.freeze({
    rows,
    byId,
    homeId,
    targetIndex,
    targetEntry,
    rowsSeal: starAtlasRowsSealV1(rows),
    stateSeal: starAtlasStateSealV1(rows, homeId),
  });
}

export function writableStarAtlasDataV1(
  record: object,
  key: string,
): PropertyDescriptor | null {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor && descriptor.enumerable === true
    && descriptor.writable === true ? descriptor : null;
}
