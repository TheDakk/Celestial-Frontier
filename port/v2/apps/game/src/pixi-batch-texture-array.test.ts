import { BatchTextureArray } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import {
  installBatchTextureArrayUidCompaction,
  type BatchTextureArrayClass,
} from './pixi-batch-texture-array.js';

type TextureSourceLike = { readonly uid: number };

const addTexture = (batch: BatchTextureArray, source: TextureSourceLike): number => {
  const index = batch.count;
  batch.ids[source.uid] = index;
  batch.textures[index] = source as (typeof batch.textures)[number];
  batch.count++;
  return index;
};

describe('Pixi BatchTextureArray UID ownership', () => {
  it('compacts every cleared UID while preserving live batch lookup semantics', () => {
    installBatchTextureArrayUidCompaction(BatchTextureArray);
    const installedClear = BatchTextureArray.prototype.clear;
    installBatchTextureArrayUidCompaction(BatchTextureArray);
    expect(BatchTextureArray.prototype.clear).toBe(installedClear);

    const batch = new BatchTextureArray();
    const ids = batch.ids;
    for (let cycle = 0; cycle < 64; cycle++) {
      const first = { uid: 10_000 + cycle * 2 };
      const second = { uid: first.uid + 1 };

      expect(addTexture(batch, first)).toBe(0);
      expect(addTexture(batch, second)).toBe(1);
      expect(batch.ids[first.uid]).toBe(0);
      expect(batch.ids[second.uid]).toBe(1);
      expect(batch.textures[0]).toBe(first);
      expect(batch.textures[1]).toBe(second);

      batch.clear();
      expect(batch.count).toBe(0);
      expect(batch.ids).toBe(ids);
      expect(Object.getPrototypeOf(batch.ids)).toBeNull();
      expect(Reflect.ownKeys(batch.ids)).toEqual([]);
    }

    const replacement = { uid: 99_999 };
    expect(addTexture(batch, replacement)).toBe(0);
    expect(batch.ids[replacement.uid]).toBe(0);
    expect(batch.textures[0]).toBe(replacement);
  });

  it('sticks fail-closed when an upstream clear leaves a live UID slot', () => {
    let originalClearCalls = 0;
    class LocalBatchTextureArray {
      count = 0;
      ids: Record<string, number | null | undefined> = Object.create(null);

      clear(): void {
        originalClearCalls++;
        this.count = 0;
      }
    }

    installBatchTextureArrayUidCompaction(
      LocalBatchTextureArray as unknown as BatchTextureArrayClass,
    );
    const batch = new LocalBatchTextureArray();
    batch.ids.live = 0;

    expect(() => batch.clear()).toThrow(
      'Pixi BatchTextureArray.clear left a live UID slot',
    );
    expect(originalClearCalls).toBe(1);
    expect(() => batch.clear()).toThrow(
      'Pixi BatchTextureArray.clear left a live UID slot',
    );
    expect(originalClearCalls).toBe(1);
  });
});
