import { describe, expect, it } from 'vitest';
import {
  type CleanManagedHash,
  PixiManagedResourceOwner,
} from '../apps/game/src/pixi-managed-resource-owner.js';

type FakeResource = { readonly label: string };
type FakeHash = Record<string, FakeResource | null | undefined>;

const managedHash = (
  slots: Record<string, FakeResource | null | undefined>,
): FakeHash => Object.assign(Object.create(null) as FakeHash, slots);

const cleanManagedHash: CleanManagedHash = (hash) => {
  let hasClearedSlot = false;
  for (const key in hash) {
    if (hash[key] == null) {
      hasClearedSlot = true;
      break;
    }
  }
  if (!hasClearedSlot) return hash;

  const replacement = Object.create(null) as ReturnType<CleanManagedHash>;
  for (const key in hash) {
    const value = hash[key];
    if (value) replacement[key] = value;
  }
  return replacement;
};

const rendererFor = (...contexts: Array<{ name: string; items: FakeHash }>): object => ({
  gc: {
    _managedResourceHashes: contexts.map((context, index) => ({
      context,
      hash: 'items',
      type: index === 0 ? 'resource' : 'renderable',
      priority: index,
    })),
  },
});

describe('Pixi managed-resource owner', () => {
  it('compacts only cleared slots and keeps later writes on the replacement hashes', () => {
    const a = { label: 'a' };
    const b = { label: 'b' };
    const c = { label: 'c' };
    const firstHash = managedHash({ a, removed: null, missing: undefined });
    const secondHash = managedHash({ b, c, removed: null });
    const first = { name: 'first', items: firstHash };
    const second = { name: 'second', items: secondHash };
    const renderer = rendererFor(first, second);
    let cleanerCallCount = 0;
    const countingCleaner: CleanManagedHash = (hash) => {
      cleanerCallCount++;
      return cleanManagedHash(hash);
    };
    const owner = new PixiManagedResourceOwner(() => renderer, countingCleaner);

    expect(owner.snapshot()).toEqual({
      schema: 'cf-v2-pixi-managed-resources/v2',
      valid: true,
      hashCount: 2,
      hashes: [
        {
          name: 'second', type: 'renderable',
          liveEntryCount: 2, clearedEntryCount: 1,
        },
        {
          name: 'first', type: 'resource',
          liveEntryCount: 1, clearedEntryCount: 2,
        },
      ],
      liveEntryCount: 3,
      clearedEntryCount: 3,
      compactionCount: 0,
      compactedSlotCount: 0,
      faultCount: 0,
    });
    expect(cleanerCallCount).toBe(0);
    expect(first.items).toBe(firstHash);
    expect(second.items).toBe(secondHash);

    expect(owner.compact()).toMatchObject({
      valid: true,
      clearedEntryCount: 0,
      compactionCount: 1,
      compactedSlotCount: 3,
    });
    expect(cleanerCallCount).toBe(2);
    expect(first.items).not.toBe(firstHash);
    expect(second.items).not.toBe(secondHash);
    expect(Object.getPrototypeOf(first.items)).toBeNull();
    expect(Object.getPrototypeOf(second.items)).toBeNull();
    expect(first.items.a).toBe(a);
    expect(second.items.b).toBe(b);
    expect(second.items.c).toBe(c);
    expect(Reflect.ownKeys(first.items)).toEqual(['a']);
    expect(Reflect.ownKeys(second.items)).toEqual(['b', 'c']);
    expect(owner.snapshot()).toMatchObject({
      valid: true,
      hashCount: 2,
      liveEntryCount: 3,
      clearedEntryCount: 0,
      compactionCount: 1,
      compactedSlotCount: 3,
      faultCount: 0,
    });

    expect(owner.compact()).toMatchObject({
      valid: true,
      clearedEntryCount: 0,
      compactionCount: 1,
      compactedSlotCount: 3,
    });
    expect(owner.snapshot()).toMatchObject({ compactionCount: 1, compactedSlotCount: 3 });
    expect(cleanerCallCount).toBe(2);

    const later = { label: 'later' };
    first.items.later = later;
    expect(first.items.later).toBe(later);
    expect(firstHash.later).toBeUndefined();
    expect(owner.snapshot()).toMatchObject({
      valid: true,
      liveEntryCount: 4,
      clearedEntryCount: 0,
      compactionCount: 1,
    });
  });

  it('makes an invalid private shape a sticky fail-closed fault', () => {
    let renderer: object = rendererFor({
      name: 'invalid', items: { live: { label: 'wrong prototype' } },
    });
    const owner = new PixiManagedResourceOwner(() => renderer, cleanManagedHash);

    expect(owner.snapshot()).toMatchObject({
      valid: false,
      hashCount: 0,
      liveEntryCount: 0,
      clearedEntryCount: 0,
      compactionCount: 0,
      compactedSlotCount: 0,
      faultCount: 1,
    });
    renderer = rendererFor({
      name: 'valid', items: managedHash({ live: { label: 'now valid' } }),
    });
    expect(() => owner.compact()).toThrow('null prototype');
    expect(owner.snapshot()).toMatchObject({
      valid: false,
      hashCount: 0,
      liveEntryCount: 0,
      clearedEntryCount: 0,
      compactionCount: 0,
      compactedSlotCount: 0,
      faultCount: 1,
    });
  });

  it('makes a duplicate semantic owner identity a sticky fail-closed fault', () => {
    const first = { name: 'duplicate', items: managedHash({ first: { label: 'first' } }) };
    const second = { name: 'duplicate', items: managedHash({ second: { label: 'second' } }) };
    const renderer = {
      gc: {
        _managedResourceHashes: [
          { context: first, hash: 'items', type: 'resource', priority: 0 },
          { context: second, hash: 'items', type: 'resource', priority: 1 },
        ],
      },
    };
    const owner = new PixiManagedResourceOwner(() => renderer, cleanManagedHash);

    expect(owner.snapshot()).toMatchObject({
      valid: false,
      hashCount: 0,
      liveEntryCount: 0,
      clearedEntryCount: 0,
      faultCount: 1,
    });
    expect(() => owner.compact()).toThrow('duplicate semantic owner');
    expect(owner.snapshot()).toMatchObject({ valid: false, faultCount: 1 });
  });

  it('makes a rejected hash assignment a sticky postcondition fault', () => {
    const original = managedHash({ live: { label: 'live' }, removed: null });
    const target = { name: 'blocked', items: original };
    const context = new Proxy(target, {
      set(_target, key) { return key === 'items'; },
    });
    const owner = new PixiManagedResourceOwner(() => rendererFor(context), cleanManagedHash);

    expect(() => owner.compact()).toThrow('replacement postcondition failed');
    expect(target.items).toBe(original);
    expect(() => owner.compact()).toThrow('replacement postcondition failed');
    expect(owner.snapshot()).toMatchObject({
      valid: false,
      compactionCount: 0,
      compactedSlotCount: 0,
      faultCount: 1,
    });
  });
});
