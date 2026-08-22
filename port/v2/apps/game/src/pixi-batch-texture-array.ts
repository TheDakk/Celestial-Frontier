export type BatchTextureArrayClass = {
  readonly prototype: object & { clear(): void };
};

type BatchTextureArrayRuntime = {
  count: number;
  ids: Record<string, number | null | undefined>;
};

type ClearPatchState = {
  readonly schema: 'cf-v2-batch-texture-clear/v1';
  readonly originalClear: (this: BatchTextureArrayRuntime) => void;
  wrappedClear: (this: BatchTextureArrayRuntime) => void;
  fault: Error | null;
};

const CLEAR_PATCH = Symbol.for('cf.v2.pixi.batch-texture-array.clear.v1');

const asFault = (cause: unknown): Error => (
  cause instanceof Error
    ? cause
    : new Error('Pixi BatchTextureArray.clear failed with a non-Error value')
);

/**
 * Pixi 8.19 clears batch texture UID slots to null but never compacts the hash.
 * Scene-owned TextureSources therefore leave one key behind for every UID ever
 * rendered by a pooled batch. Install one narrow wrapper before rendering so a
 * completed clear also deletes those exact tombstones in place. Keeping the
 * hash identity avoids replacing it with a newly allocated object each clear.
 */
export function installBatchTextureArrayUidCompaction(
  BatchTextureArray: BatchTextureArrayClass,
): void {
  const prototype = BatchTextureArray?.prototype as Record<PropertyKey, unknown> | undefined;
  if (!prototype || (typeof prototype !== 'object' && typeof prototype !== 'function')) {
    throw new Error('Pixi BatchTextureArray prototype is unavailable');
  }

  const priorPatch = Object.getOwnPropertyDescriptor(prototype, CLEAR_PATCH)?.value;
  if (priorPatch !== undefined) {
    const state = priorPatch as Partial<ClearPatchState>;
    if (
      state.schema !== 'cf-v2-batch-texture-clear/v1'
      || typeof state.wrappedClear !== 'function'
      || prototype.clear !== state.wrappedClear
    ) {
      throw new Error('Pixi BatchTextureArray.clear compaction patch drifted');
    }
    if (state.fault) throw state.fault;
    return;
  }

  const clearDescriptor = Object.getOwnPropertyDescriptor(prototype, 'clear');
  if (
    !clearDescriptor
    || typeof clearDescriptor.value !== 'function'
    || clearDescriptor.writable !== true
  ) {
    throw new Error('Pixi BatchTextureArray.clear has an unsupported shape');
  }

  const state = {
    schema: 'cf-v2-batch-texture-clear/v1',
    originalClear: clearDescriptor.value as (this: BatchTextureArrayRuntime) => void,
    fault: null,
  } as ClearPatchState;

  state.wrappedClear = function wrappedBatchTextureClear(
    this: BatchTextureArrayRuntime,
  ): void {
    if (state.fault) throw state.fault;

    try {
      state.originalClear.call(this);
      if (this.count !== 0) {
        throw new Error('Pixi BatchTextureArray.clear did not reset its count');
      }

      const ids = this.ids;
      if (!ids || typeof ids !== 'object' || Object.getPrototypeOf(ids) !== null) {
        throw new Error('Pixi BatchTextureArray ids hash has an unsupported shape');
      }
      for (const key in ids) {
        if (ids[key] != null) {
          throw new Error('Pixi BatchTextureArray.clear left a live UID slot');
        }
        if (!Reflect.deleteProperty(ids, key)) {
          throw new Error('Pixi BatchTextureArray UID tombstone deletion was rejected');
        }
      }
      for (const _key in ids) {
        throw new Error('Pixi BatchTextureArray UID tombstones survived compaction');
      }
    }
    catch (cause) {
      state.fault = asFault(cause);
      throw state.fault;
    }
  };

  Object.defineProperty(prototype, 'clear', {
    ...clearDescriptor,
    value: state.wrappedClear,
  });
  Object.defineProperty(prototype, CLEAR_PATCH, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: state,
  });
}
