import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PORTABLE_V5_FORMAT,
  PORTABLE_V5_MAX_BYTES,
  PORTABLE_V5_MAX_CLOCK_MS,
  PORTABLE_V5_MAX_LEGACY_BYTES,
  PORTABLE_V5_VERSION,
  V4_BACKUP_KEY,
  V4_PRIMARY_KEY,
  V5_JOURNAL_KEY,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  V5_SCHEMA_KEY,
  V5_SNAPSHOT_KEY,
  canonicalizeV5Extensions,
  classifyPortableV5Save,
  classifyV4Save,
  createMemoryBackend,
  createRevisionedRepository,
  exportPortableV5Save,
  migrateStoredV4ToV5,
  prepareV5Replacement,
  readSaveV5,
  readSaveV5WithRecovery,
  STORES,
  type ContentRegistry,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const FIXTURES = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const NOW = 1_753_900_060_000;
const LATER = NOW + 7 * 24 * 60 * 60 * 1_000;
const VETERAN_RAW = JSON.stringify(FIXTURES.inputs.veteran_rich);

async function dump(backend: StorageBackend): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (const store of STORES) {
    const rows: Record<string, string> = {};
    for (const key of (await backend.keys(store)).sort()) {
      const value = await backend.get(store, key);
      if (value !== undefined) rows[key] = value;
    }
    result[store] = rows;
  }
  return result;
}

function veteranState() {
  const classified = classifyV4Save(VETERAN_RAW, REGISTRY, NOW);
  if (classified.kind !== 'supported') throw new Error('veteran fixture must be supported');
  return classified.state;
}

function extensionFixture(): V5Extensions {
  return {
    settings: {
      'zeta.settings': { version: 2, json: '{"exact":"settings"}' },
      'arc7.audio': { version: 1, json: '{"muted":false,"volume":0.5}' },
    },
    player: {
      'test.unrelated': { version: 7, json: '{"bytes":"preserve me"}' },
      'f4.authority': {
        version: 1,
        json: '{"activePlayMs":900,"sessionRng":{"seed":77,"ordinal":4,"draws":{"loot":3}}}',
      },
    },
    inventory: {
      'arc2.inventory': { version: 1, json: '{"entries":["gear-1"],"pending":[]}' },
    },
  };
}

describe('@cf/persistence — portable v5 backup/import authority', () => {
  it('encodes one strict fixed point with canonical v4 bytes and exact unrelated extension pass-through', () => {
    const sourceExtensions = extensionFixture();
    const raw = exportPortableV5Save({ state: veteranState(), extensions: sourceExtensions }, REGISTRY, NOW);
    expect(new TextEncoder().encode(raw).byteLength).toBeLessThanOrEqual(PORTABLE_V5_MAX_BYTES);
    const envelope = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(envelope)).toEqual(['format', 'version', 'legacyV4', 'extensions']);
    expect(envelope.format).toBe(PORTABLE_V5_FORMAT);
    expect(envelope.version).toBe(PORTABLE_V5_VERSION);
    expect(typeof envelope.legacyV4).toBe('string');
    expect(classifyV4Save(envelope.legacyV4 as string, REGISTRY, NOW)).toMatchObject({
      kind: 'supported', normalizedRaw: envelope.legacyV4,
    });

    const classified = classifyPortableV5Save(raw, REGISTRY, LATER);
    expect(classified.kind).toBe('supported');
    if (classified.kind !== 'supported') return;
    expect(classified.canonicalRaw).toBe(raw);
    expect(classified.extensions).toEqual(canonicalizeV5Extensions(sourceExtensions));
    expect(classified.extensions).not.toBe(sourceExtensions);
    expect(Object.isFrozen(classified.extensions)).toBe(true);
    expect(Object.keys(classified.extensions)).toEqual(['player', 'inventory', 'settings']);
    expect(Object.keys(classified.extensions.settings ?? {})).toEqual(['arc7.audio', 'zeta.settings']);
    expect(classified.extensions.player?.['test.unrelated']).toEqual({
      version: 7, json: '{"bytes":"preserve me"}',
    });
    expect(exportPortableV5Save({
      state: classified.state,
      extensions: classified.extensions,
    }, REGISTRY, NOW)).toBe(raw);
  });

  it('replaces rows, mirror, snapshot, backup, receipts, and revision atomically while retaining portable extensions', async () => {
    const backend = createMemoryBackend();
    await backend.apply([
      { store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW },
      { store: 'meta', key: V4_BACKUP_KEY, value: 'old-expedition-backup' },
    ]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    await backend.apply([{
      store: 'receipts', key: 'receipt:99',
      value: '{"ordinal":99,"kind":"old","witness":"old-expedition"}',
    }]);

    const state = structuredClone(veteranState());
    state.explorerName = 'Portable Explorer';
    state.essence = 321;
    const portableRaw = exportPortableV5Save({ state, extensions: extensionFixture() }, REGISTRY, NOW);
    const replacement = prepareV5Replacement(portableRaw, REGISTRY, LATER);
    expect(replacement.kind).toBe('prepared');
    if (replacement.kind !== 'prepared') return;
    expect(replacement.source).toBe('portable-v5');
    expect(replacement.exactRaw).toBe(portableRaw);
    expect(replacement.extensions).toEqual(canonicalizeV5Extensions(extensionFixture()));
    expect(replacement.operations).toContainEqual({ store: 'meta', key: V4_BACKUP_KEY });
    expect(replacement.operations).toContainEqual({
      store: 'meta', key: V4_PRIMARY_KEY, value: replacement.legacyV4Raw,
    });
    expect(replacement.legacyV4Raw).not.toBe(portableRaw);
    const snapshotOperation = replacement.operations.find(
      ({ store, key }) => store === 'journal' && key === V5_SNAPSHOT_KEY,
    );
    expect(JSON.parse(snapshotOperation?.value ?? '{}')).toEqual({
      schema: 5, sourceSchema: 5, raw: portableRaw,
    });
    const journalOperation = replacement.operations.find(
      ({ store, key }) => store === 'journal' && key === V5_JOURNAL_KEY,
    );
    expect(JSON.parse(journalOperation?.value ?? '{}')).toMatchObject({
      kind: 'trusted-portable-v5-replacement', phase: 'complete', snapshotKey: V5_SNAPSHOT_KEY,
    });

    await expect(createRevisionedRepository(backend).replace({
      expectedRevision: 0,
      writes: replacement.operations,
    })).resolves.toEqual({ kind: 'committed', revision: 1, receiptKey: null });
    expect(await backend.keys('receipts')).toEqual([]);
    expect(await backend.get('meta', V4_BACKUP_KEY)).toBeUndefined();
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(replacement.legacyV4Raw);
    const loaded = await readSaveV5(backend, REGISTRY, LATER);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.explorerName).toBe('Portable Explorer');
    expect(loaded.state.essence).toBe(321);
    expect(loaded.extensions).toEqual(replacement.extensions);

    await backend.apply([{
      store: 'inventory', key: 'v5:inventory', value: '{"schema":5,"segment":"inventory","data":[]}',
    }]);
    const recovered = await readSaveV5WithRecovery(backend, REGISTRY, LATER);
    expect(recovered.kind).toBe('recovered-v4');
    if (recovered.kind === 'recovered-v4') {
      expect(recovered.raw).toBe(portableRaw);
      expect(recovered.normalizedV4Raw).toBe(replacement.legacyV4Raw);
      expect(recovered.extensions).toEqual(replacement.extensions);
      expect(recovered.state.explorerName).toBe('Portable Explorer');
    }
  });

  it('keeps authentic old-v4 replacement compatible and never treats v4 fields as extension authority', () => {
    const ordinary = prepareV5Replacement(VETERAN_RAW, REGISTRY, NOW);
    expect(ordinary.kind).toBe('prepared');
    if (ordinary.kind !== 'prepared') return;
    expect(ordinary.source).toBe('legacy-v4');
    expect(ordinary.extensions).toEqual({});
    expect(ordinary.operations).toContainEqual({ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW });

    const fabricatedRaw = JSON.stringify({
      ...(FIXTURES.inputs.veteran_rich as Record<string, unknown>),
      extensions: extensionFixture(),
    });
    const fabricated = prepareV5Replacement(fabricatedRaw, REGISTRY, NOW);
    expect(fabricated.kind).toBe('prepared');
    if (fabricated.kind === 'prepared') {
      expect(fabricated.source).toBe('legacy-v4');
      expect(fabricated.extensions).toEqual({});
      for (const operation of fabricated.operations.filter(({ key }) => key.startsWith('v5:'))) {
        const row = JSON.parse(operation.value ?? '{}') as { extensions?: unknown };
        expect(row.extensions, `${operation.store}/${operation.key}`).toBeUndefined();
      }
    }
    expect(prepareV5Replacement('{"v":9,"epoch":1}', REGISTRY, NOW)).toEqual({
      kind: 'future-version',
    });
    expect(prepareV5Replacement('{}', REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
  });

  it('fails closed on tamper, unknown/current extra fields, future versions, and every byte bound', () => {
    const raw = exportPortableV5Save({ state: veteranState(), extensions: extensionFixture() }, REGISTRY, NOW);
    const envelope = JSON.parse(raw) as {
      format: string;
      version: number;
      legacyV4: string;
      extensions: Record<string, unknown>;
    };
    const corruptCases = [
      ` ${raw}`,
      JSON.stringify({ ...envelope, unknown: true }),
      JSON.stringify({ ...envelope, format: 'celestial-frontier-portable-v5-lookalike' }),
      JSON.stringify({
        ...envelope,
        legacyV4: `${envelope.legacyV4} `,
      }),
      JSON.stringify({
        ...envelope,
        extensions: { ...envelope.extensions, unknown: {} },
      }),
      JSON.stringify({
        ...envelope,
        extensions: {
          ...envelope.extensions,
          inventory: {
            'arc2.inventory': { version: 1, json: '[]' },
          },
        },
      }),
    ];
    for (const candidate of corruptCases) {
      expect(classifyPortableV5Save(candidate, REGISTRY, NOW), candidate.slice(0, 80))
        .toEqual({ kind: 'corrupt' });
      expect(prepareV5Replacement(candidate, REGISTRY, NOW), candidate.slice(0, 80))
        .toEqual({ kind: 'corrupt' });
    }

    const futureRaw = JSON.stringify({ ...envelope, version: PORTABLE_V5_VERSION + 1 });
    expect(classifyPortableV5Save(futureRaw, REGISTRY, NOW)).toEqual({ kind: 'future-version' });
    expect(prepareV5Replacement(futureRaw, REGISTRY, NOW)).toEqual({ kind: 'future-version' });

    expect(classifyPortableV5Save('x'.repeat(PORTABLE_V5_MAX_BYTES + 1), REGISTRY, NOW))
      .toEqual({ kind: 'corrupt' });
    expect(() => exportPortableV5Save(
      { state: veteranState(), extensions: {} }, REGISTRY, PORTABLE_V5_MAX_CLOCK_MS + 1,
    )).toThrow(/portable v5 clock/);
    const oversizeLegacy = JSON.stringify({
      ...envelope,
      legacyV4: 'x'.repeat(PORTABLE_V5_MAX_LEGACY_BYTES + 1),
    });
    expect(classifyPortableV5Save(oversizeLegacy, REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
    const unicodeOversizeJson = JSON.stringify({ x: '💫'.repeat(70_000) });
    expect(unicodeOversizeJson.length).toBeLessThan(V5_MAX_EXTENSION_JSON_BYTES);
    expect(new TextEncoder().encode(unicodeOversizeJson).byteLength)
      .toBeGreaterThan(V5_MAX_EXTENSION_JSON_BYTES);
    expect(() => canonicalizeV5Extensions({
      inventory: { 'arc2.inventory': { version: 1, json: unicodeOversizeJson } },
    })).toThrow(/invalid v5 extension JSON/);
    expect(() => canonicalizeV5Extensions({
      inventory: Object.fromEntries(Array.from(
        { length: V5_MAX_EXTENSION_NAMESPACES_PER_SEGMENT + 1 },
        (_, index) => [`test.${index}`, { version: 1, json: '{}' }],
      )),
    })).toThrow(/namespace count exceeds/);
    const totalChunk = JSON.stringify({
      x: 'a'.repeat(Math.floor(V5_MAX_EXTENSION_TOTAL_BYTES / 5)),
    });
    expect(new TextEncoder().encode(totalChunk).byteLength)
      .toBeLessThan(V5_MAX_EXTENSION_JSON_BYTES);
    expect(() => canonicalizeV5Extensions({
      inventory: Object.fromEntries(Array.from(
        { length: 5 },
        (_, index) => [`test.total-${index}`, { version: 1, json: totalChunk }],
      )),
    })).toThrow(/JSON total exceeds/);
  });

  it('fails closed when individually valid split rows exceed global extension bounds', async () => {
    const initializedBackend = async (): Promise<StorageBackend> => {
      const backend = createMemoryBackend();
      await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
      expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
      return backend;
    };
    const rewriteExtensions = async (
      backend: StorageBackend,
      segment: 'player' | 'creatures' | 'catalog',
      extensions: Record<string, { version: number; json: string }>,
    ): Promise<void> => {
      const key = `v5:${segment}`;
      const raw = await backend.get(segment, key);
      if (raw === undefined) throw new Error(`missing ${key}`);
      await backend.apply([{
        store: segment,
        key,
        value: JSON.stringify({ ...(JSON.parse(raw) as Record<string, unknown>), extensions }),
      }]);
    };

    const excessiveCount = await initializedBackend();
    for (const segment of ['player', 'creatures', 'catalog'] as const) {
      await rewriteExtensions(excessiveCount, segment, Object.fromEntries(Array.from(
        { length: 50 },
        (_, index) => [`test.${segment}.${index}`, { version: 1, json: '{}' }],
      )));
    }
    await expect(readSaveV5(excessiveCount, REGISTRY, NOW)).resolves.toEqual({
      kind: 'corrupt', scope: 'envelope',
    });

    const excessiveBytes = await initializedBackend();
    const largeJson = JSON.stringify({ x: 'a'.repeat(220_000) });
    expect(new TextEncoder().encode(largeJson).byteLength).toBeLessThan(V5_MAX_EXTENSION_JSON_BYTES);
    for (const segment of ['player', 'creatures', 'catalog'] as const) {
      await rewriteExtensions(excessiveBytes, segment, {
        [`test.${segment}.one`]: { version: 1, json: largeJson },
        [`test.${segment}.two`]: { version: 1, json: largeJson },
      });
    }
    await expect(readSaveV5(excessiveBytes, REGISTRY, NOW)).resolves.toEqual({
      kind: 'corrupt', scope: 'envelope',
    });
  });

  it('leaves the old expedition byte-identical when the portable replacement transaction fails', async () => {
    const base = createMemoryBackend();
    let failReplacement = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (failReplacement && clearStores?.includes('receipts')) {
          throw new Error('injected portable replacement failure');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([
      { store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW },
      { store: 'meta', key: V4_BACKUP_KEY, value: 'old-backup' },
    ]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    await backend.apply([{
      store: 'receipts', key: 'receipt:5',
      value: '{"ordinal":5,"kind":"old","witness":"old"}',
    }]);
    const before = await dump(backend);
    const state = structuredClone(veteranState());
    state.essence = 999;
    const portableRaw = exportPortableV5Save({ state, extensions: extensionFixture() }, REGISTRY, NOW);
    const replacement = prepareV5Replacement(portableRaw, REGISTRY, NOW);
    expect(replacement.kind).toBe('prepared');
    if (replacement.kind !== 'prepared') return;
    failReplacement = true;
    await expect(createRevisionedRepository(backend).replace({
      expectedRevision: 0,
      writes: replacement.operations,
    })).rejects.toThrow('injected portable replacement failure');
    expect(await dump(backend)).toEqual(before);
    expect(await backend.get('meta', V5_SCHEMA_KEY)).toBeDefined();
  });
});
