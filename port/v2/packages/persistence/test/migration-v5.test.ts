import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STORES,
  V4_PRIMARY_KEY,
  V5_JOURNAL_KEY,
  V5_SCHEMA_KEY,
  V5_SNAPSHOT_KEY,
  classifyV4Save,
  createMemoryBackend,
  createRevisionedRepository,
  initializeFreshV5,
  migrateStoredV4ToV5,
  prepareV5Replacement,
  prepareV5SaveWrite,
  readSaveV5,
  readSaveV5WithRecovery,
  type ContentRegistry,
  type StorageBackend,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const FIXTURES = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const TRAINING_CAPTURE = JSON.parse(fs.readFileSync(path.join(baseline, 'training-restart-fixture.json'), 'utf8')) as {
  snapshot: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const VETERAN_RAW = JSON.stringify(FIXTURES.inputs.veteran_rich);
const LEGACY_SLICE_VALUE = {
  nav: {
    mode: 'surface',
    gal: { x: 90, y: -60, seed: 999, size: 78, sp: 2 },
    star: { x: 560, y: 170, seed: 424242 },
    planet: { seed: 133 },
  },
  view: {
    type: 'planet',
    gal: { x: 90, y: -60, seed: 999, size: 78, sp: 2 },
    star: { x: 560, y: 170, seed: 424242 },
    pseed: 133,
  },
} as const;
const LEGACY_SLICE_RAW = JSON.stringify(LEGACY_SLICE_VALUE);

async function dump(backend: StorageBackend): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (const store of STORES) {
    const rows: Record<string, string> = {};
    for (const key of (await backend.keys(store)).sort()) rows[key] = (await backend.get(store, key))!;
    result[store] = rows;
  }
  return result;
}

describe('@cf/persistence — F3 v4 -> v5 migration and compatibility codec', () => {
  it('accepts a coherent v4 envelope with retained Training evidence but does not promote partial loader fixtures', () => {
    const training = FIXTURES.inputs.tut_midtraining as { tut: unknown; tsnap: unknown };
    const coherent = {
      ...(FIXTURES.inputs.veteran_rich as Record<string, unknown>),
      tut: training.tut,
      tsnap: training.tsnap,
    };
    expect(classifyV4Save(JSON.stringify(coherent), REGISTRY, NOW).kind).toBe('supported');
    expect(classifyV4Save(JSON.stringify(FIXTURES.inputs.hostile_shapes), REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
  });

  it('migrates the exact historical development-slice envelope while retaining its bytes and route ingress', async () => {
    /* The compatibility bridge is deliberately storage-only. A two-field
       development envelope must never become a trusted complete-import
       replacement merely because boot migration knows its exact format. */
    expect(classifyV4Save(LEGACY_SLICE_RAW, REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
    expect(prepareV5Replacement(LEGACY_SLICE_RAW, REGISTRY, NOW)).toEqual({ kind: 'corrupt' });

    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: LEGACY_SLICE_RAW }]);
    const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
    expect(migrated.kind).toBe('migrated');
    if (migrated.kind !== 'migrated') return;

    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(LEGACY_SLICE_RAW);
    const snapshot = JSON.parse((await backend.get('journal', V5_SNAPSHOT_KEY))!) as { raw: string };
    expect(snapshot.raw).toBe(LEGACY_SLICE_RAW);

    const expectedRoute = {
      type: 'planet',
      gal: { x: 90, y: -60, seed: 999 },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 133,
    };
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.savedView).toMatchObject(expectedRoute);
    expect(loaded.ingress.savedView).toEqual(expectedRoute);
    expect(Object.isFrozen(loaded.ingress.savedView)).toBe(true);
    expect(Object.isFrozen((loaded.ingress.savedView as { gal: object }).gal)).toBe(true);
    expect(loaded.legacyV4Raw).toBe(migrated.normalizedV4Raw);
    expect(loaded.legacyV4Raw).not.toBe(LEGACY_SLICE_RAW);
    expect(classifyV4Save(loaded.legacyV4Raw, REGISTRY, NOW).kind).toBe('supported');

    const fixedPoint = await dump(backend);
    expect(await migrateStoredV4ToV5(backend, REGISTRY, NOW)).toEqual({
      kind: 'already-current', legacyV4Raw: loaded.legacyV4Raw,
    });
    const loadedAgain = await readSaveV5(backend, REGISTRY, NOW);
    expect(loadedAgain.kind).toBe('loaded');
    if (loadedAgain.kind === 'loaded') {
      expect(loadedAgain.state).toEqual(loaded.state);
      expect(loadedAgain.ingress.savedView).toEqual(expectedRoute);
      expect(loadedAgain.legacyV4Raw).toBe(loaded.legacyV4Raw);
    }
    expect(await dump(backend)).toEqual(fixedPoint);

    await backend.apply([{
      store: 'player', key: 'v5:player', value: '{"schema":5,"segment":"player","data":[]}',
    }]);
    const recovered = await readSaveV5WithRecovery(backend, REGISTRY, NOW);
    expect(recovered.kind).toBe('recovered-v4');
    if (recovered.kind === 'recovered-v4') {
      expect(recovered.raw).toBe(LEGACY_SLICE_RAW);
      expect(recovered.normalizedV4Raw).toBe(loaded.legacyV4Raw);
      expect(recovered.state.savedView).toMatchObject(expectedRoute);
      expect(recovered.ingress.savedView).toEqual(expectedRoute);
    }
  });

  it('protects sparse, near-miss, corrupt, and future lookalikes without creating v5 authority', async () => {
    const nearMisses = [
      { raw: '{}', reason: 'corrupt' },
      { raw: JSON.stringify({ nav: LEGACY_SLICE_VALUE.nav }), reason: 'corrupt' },
      { raw: JSON.stringify({ ...LEGACY_SLICE_VALUE, extra: true }), reason: 'corrupt' },
      {
        raw: JSON.stringify({
          ...LEGACY_SLICE_VALUE,
          view: { ...LEGACY_SLICE_VALUE.view, pseed: 134 },
        }),
        reason: 'corrupt',
      },
      {
        raw: JSON.stringify({
          ...LEGACY_SLICE_VALUE,
          nav: { ...LEGACY_SLICE_VALUE.nav, gal: { ...LEGACY_SLICE_VALUE.nav.gal, x: 91 } },
        }),
        reason: 'corrupt',
      },
      { raw: '{"nav":', reason: 'corrupt' },
      { raw: JSON.stringify({ ...LEGACY_SLICE_VALUE, v: 9 }), reason: 'future-version' },
    ] as const;

    for (const { raw, reason } of nearMisses) {
      const backend = createMemoryBackend();
      await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: raw }]);
      expect(await migrateStoredV4ToV5(backend, REGISTRY, NOW), raw).toEqual({ kind: 'protected', reason });
      expect(await backend.get('meta', V4_PRIMARY_KEY), raw).toBe(raw);
      expect(await backend.get('meta', V5_SCHEMA_KEY), raw).toBeUndefined();
      expect(await backend.get('journal', V5_SNAPSHOT_KEY), raw).toBeUndefined();
      expect(await backend.get('journal', V5_JOURNAL_KEY), raw).toBeUndefined();
      for (const [store, segment] of [
        ['player', 'player'], ['creatures', 'creatures'], ['catalog', 'catalog'],
        ['inventory', 'inventory'], ['settings', 'settings'],
      ] as const) expect(await backend.get(store, `v5:${segment}`), `${raw}:${segment}`).toBeUndefined();
    }
  });

  it('atomically writes every split store plus exact snapshot/journal while retaining the v4 primary', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);

    const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
    expect(migrated.kind).toBe('migrated');
    if (migrated.kind !== 'migrated') return;

    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(VETERAN_RAW);
    expect(await backend.get('meta', V5_SCHEMA_KEY)).toBeDefined();
    for (const [store, segment] of [
      ['player', 'player'], ['creatures', 'creatures'], ['catalog', 'catalog'],
      ['inventory', 'inventory'], ['settings', 'settings'],
    ] as const) {
      const row = JSON.parse((await backend.get(store, `v5:${segment}`))!) as {
        schema: number; segment: string; data: Record<string, unknown>;
      };
      expect(row.schema, segment).toBe(5);
      expect(row.segment, segment).toBe(segment);
      expect(Array.isArray(row.data), segment).toBe(false);
    }
    const snapshot = JSON.parse((await backend.get('journal', V5_SNAPSHOT_KEY))!) as { raw: string };
    expect(snapshot.raw).toBe(VETERAN_RAW);
    expect(JSON.parse((await backend.get('journal', V5_JOURNAL_KEY))!)).toMatchObject({
      schema: 5, kind: 'v4-to-v5', phase: 'complete', snapshotKey: V5_SNAPSHOT_KEY,
    });

    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.legacyV4Raw).toBe(migrated.normalizedV4Raw);

    /* Fixed point: a second migration neither rewrites rows nor advances a
       journal. The first migration's exact bytes remain the only snapshot. */
    const before = await dump(backend);
    expect(await migrateStoredV4ToV5(backend, REGISTRY, NOW)).toEqual({
      kind: 'already-current', legacyV4Raw: migrated.normalizedV4Raw,
    });
    expect(await dump(backend)).toEqual(before);
  });

  it('classifies future and coherent-looking truncations before the total v4 loader can authorize them', async () => {
    expect(classifyV4Save('{"v":9,"epoch":1}', REGISTRY, NOW)).toEqual({ kind: 'future-version' });
    expect(classifyV4Save('{"v":4,"epoch":1,"codex":[],"land":[]}', REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
    for (const raw of ['{}', '[]', 'null', '{"v":4']) {
      expect(classifyV4Save(raw, REGISTRY, NOW), raw).toEqual({ kind: 'corrupt' });
    }

    for (const [raw, reason] of [
      ['{"v":9,"epoch":1}', 'future-version'],
      ['{"v":4,"epoch":1,"codex":[],"land":[]}', 'corrupt'],
    ] as const) {
      const backend = createMemoryBackend();
      await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: raw }]);
      expect(await migrateStoredV4ToV5(backend, REGISTRY, NOW)).toEqual({ kind: 'protected', reason });
      expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(raw);
      expect(await backend.get('meta', V5_SCHEMA_KEY)).toBeUndefined();
      expect(await backend.get('journal', V5_SNAPSHOT_KEY)).toBeUndefined();
    }
  });

  it('leaves the exact v4 source and every v5 row untouched when the atomic backend fails', async () => {
    const memory = createMemoryBackend();
    await memory.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    const failing: StorageBackend = {
      ...memory,
      async compareAndApply() { throw new Error('injected transaction abort'); },
    };

    expect(await migrateStoredV4ToV5(failing, REGISTRY, NOW)).toEqual({
      kind: 'storage-error', message: 'injected transaction abort',
    });
    expect(await memory.get('meta', V4_PRIMARY_KEY)).toBe(VETERAN_RAW);
    expect(await memory.get('meta', V5_SCHEMA_KEY)).toBeUndefined();
    expect(await memory.get('journal', V5_SNAPSHOT_KEY)).toBeUndefined();
    for (const [store, segment] of [
      ['player', 'player'], ['creatures', 'creatures'], ['catalog', 'catalog'],
      ['inventory', 'inventory'], ['settings', 'settings'],
    ] as const) expect(await memory.get(store, `v5:${segment}`), segment).toBeUndefined();
  });

  it('fails a changed-source CAS without snapshotting or splitting the wrong parent', async () => {
    const memory = createMemoryBackend();
    await memory.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    const changed = VETERAN_RAW.replace('"me":"Dakk"', '"me":"Concurrent Writer"');
    expect(changed).not.toBe(VETERAN_RAW);
    const racing: StorageBackend = {
      ...memory,
      async compareAndApply(checks, operations) {
        await memory.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: changed }]);
        return memory.compareAndApply(checks, operations);
      },
    };

    expect(await migrateStoredV4ToV5(racing, REGISTRY, NOW)).toEqual({ kind: 'stale-source' });
    expect(await memory.get('meta', V4_PRIMARY_KEY)).toBe(changed);
    expect(await memory.get('meta', V5_SCHEMA_KEY)).toBeUndefined();
    expect(await memory.get('journal', V5_SNAPSHOT_KEY)).toBeUndefined();
  });

  it('recovers a corrupt current row only from the validated exact snapshot, without modifying storage', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
    expect(migration.kind).toBe('migrated');

    const corruptPlayer = '{"schema":5,"segment":"player","data":[]}';
    await backend.apply([{ store: 'player', key: 'v5:player', value: corruptPlayer }]);
    expect(await readSaveV5(backend, REGISTRY, NOW)).toEqual({ kind: 'corrupt', scope: 'player' });
    const recovered = await readSaveV5WithRecovery(backend, REGISTRY, NOW);
    expect(recovered.kind).toBe('recovered-v4');
    if (recovered.kind === 'recovered-v4') expect(recovered.raw).toBe(VETERAN_RAW);
    expect(await backend.get('player', 'v5:player')).toBe(corruptPlayer);

    /* A future row is protected and must never roll back to the older v4
       snapshot merely because that snapshot is valid. */
    const futurePlayer = '{"schema":6,"segment":"player","data":{}}';
    await backend.apply([{ store: 'player', key: 'v5:player', value: futurePlayer }]);
    expect(await readSaveV5WithRecovery(backend, REGISTRY, NOW)).toEqual({
      kind: 'future-version', scope: 'player',
    });

    /* A malformed/future snapshot cannot authorize recovery either. */
    await backend.apply([
      { store: 'player', key: 'v5:player', value: corruptPlayer },
      { store: 'journal', key: V5_SNAPSHOT_KEY, value: '{"schema":6,"sourceSchema":4,"raw":"old"}' },
    ]);
    expect(await readSaveV5WithRecovery(backend, REGISTRY, NOW)).toEqual({
      kind: 'future-version', scope: 'snapshot',
    });
    await backend.apply([{ store: 'journal', key: V5_SNAPSHOT_KEY, value: '{"schema":5,"sourceSchema":4,"raw":"{}"}' }]);
    expect(await readSaveV5WithRecovery(backend, REGISTRY, NOW)).toEqual({
      kind: 'corrupt', scope: 'snapshot',
    });
  });

  it('keeps current one-key and genuine legacy eleven-key Training ingress distinct across v5 read and snapshot recovery', async () => {
    const veteran = FIXTURES.inputs.veteran_rich as Record<string, unknown>;
    for (const fixture of [
      { name: 'current', snapshot: { view: veteran.view }, expected: 'current-view' },
      { name: 'legacy', snapshot: TRAINING_CAPTURE.snapshot, expected: 'legacy-v1' },
    ] as const) {
      const raw = JSON.stringify({ ...veteran, tut: 0, tsnap: fixture.snapshot });
      const backend = createMemoryBackend();
      await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: raw }]);
      expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind, fixture.name).toBe('migrated');

      const loaded = await readSaveV5(backend, REGISTRY, NOW);
      expect(loaded.kind, fixture.name).toBe('loaded');
      if (loaded.kind !== 'loaded') continue;
      expect(loaded.ingress.trainingSnapshot.kind, fixture.name).toBe(fixture.expected);
      const loadedAtlasEntry = loaded.state.logMap[0]![1];
      expect(loaded.ingress.atlasWhere.has(loadedAtlasEntry), `${fixture.name} Atlas ingress rebased`).toBe(true);
      expect(loaded.ingress.atlasWhere.get(loadedAtlasEntry), fixture.name).toMatchObject({
        type: 'planet', pseed: 133,
      });

      await backend.apply([{
        store: 'player', key: 'v5:player', value: '{"schema":5,"segment":"player","data":[]}',
      }]);
      const recovered = await readSaveV5WithRecovery(backend, REGISTRY, NOW);
      expect(recovered.kind, fixture.name).toBe('recovered-v4');
      if (recovered.kind !== 'recovered-v4') continue;
      expect(recovered.ingress.trainingSnapshot.kind, fixture.name).toBe(fixture.expected);
      const recoveredAtlasEntry = recovered.state.logMap[0]![1];
      expect(recovered.ingress.atlasWhere.has(recoveredAtlasEntry), `${fixture.name} recovered Atlas ingress`).toBe(true);
    }
  });

  it('rejects a current-schema row that moves an owned field into the wrong store', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    await backend.apply([{
      store: 'settings', key: 'v5:settings',
      value: '{"schema":5,"segment":"settings","data":{"essence":999}}',
    }]);
    expect(await readSaveV5(backend, REGISTRY, NOW)).toEqual({ kind: 'corrupt', scope: 'settings' });
  });

  it('prepares one fixed-point ordinary write whose split rows, v4 mirror, and v5-only extension commit under one revision CAS', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const before = await readSaveV5(backend, REGISTRY, NOW);
    expect(before.kind).toBe('loaded');
    if (before.kind !== 'loaded') return;

    const state = structuredClone(before.state);
    state.essence += 77;                                      // player
    state.contacted = [...state.contacted, 77];              // catalog
    state.cargo = state.cargo.map(([material, amount]) =>
      [material, material === 'Fe' ? amount + 1 : amount]);  // inventory
    state.sfxVol = 0.42;                                     // settings
    const extensions = {
      ...before.extensions,
      player: {
        ...(before.extensions.player ?? {}),
        'f4.authority': {
          version: 1,
          json: '{"activePlayMs":1200,"sessionRng":{"seed":77,"ordinal":3,"draws":{"loot":2}}}',
        },
      },
    } as const;
    const prepared = prepareV5SaveWrite({ state, extensions }, REGISTRY, NOW);
    expect(prepared.operations.map(({ store, key }) => `${store}/${key}`)).toEqual([
      'player/v5:player', 'creatures/v5:creatures', 'catalog/v5:catalog',
      'inventory/v5:inventory', 'settings/v5:settings', 'meta/save',
    ]);
    expect(prepared.operations.some((op) => op.store === 'receipts' || op.store === 'journal'
      || (op.store === 'meta' && op.key !== V4_PRIMARY_KEY))).toBe(false);
    expect(prepared.legacyV4Raw).not.toContain('activePlayMs');

    const schemaBefore = await backend.get('meta', V5_SCHEMA_KEY);
    const snapshotBefore = await backend.get('journal', V5_SNAPSHOT_KEY);
    const journalBefore = await backend.get('journal', V5_JOURNAL_KEY);
    const repository = createRevisionedRepository(backend);
    expect(await repository.mutate({ expectedRevision: 0, writes: prepared.operations })).toEqual({
      kind: 'committed', revision: 1, receiptKey: null,
    });
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(prepared.legacyV4Raw);
    expect(await backend.get('meta', V5_SCHEMA_KEY)).toBe(schemaBefore);
    expect(await backend.get('journal', V5_SNAPSHOT_KEY)).toBe(snapshotBefore);
    expect(await backend.get('journal', V5_JOURNAL_KEY)).toBe(journalBefore);
    for (const operation of prepared.operations) {
      expect(await backend.get(operation.store, operation.key), `${operation.store}/${operation.key}`).toBe(operation.value);
    }

    const after = await readSaveV5(backend, REGISTRY, NOW);
    expect(after.kind).toBe('loaded');
    if (after.kind !== 'loaded') return;
    expect(after.state).toEqual(prepared.canonicalState);
    expect(after.extensions).toEqual(prepared.extensions);
    expect(after.legacyV4Raw).toBe(prepared.legacyV4Raw);
    expect(after.state.essence).toBe(before.state.essence + 77);
    expect(after.state.contacted).toContain(77);
    expect(after.state.cargo).toContainEqual(['Fe', 41]);
    expect(after.state.sfxVol).toBe(0.42);

    const fixedPoint = prepareV5SaveWrite({ state: after.state, extensions: after.extensions }, REGISTRY, NOW);
    expect(fixedPoint.legacyV4Raw).toBe(prepared.legacyV4Raw);
    expect(fixedPoint.operations).toEqual(prepared.operations);
  });

  it('does not change any split row, extension, or compatibility mirror for a stale ordinary writer', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;

    const winningState = structuredClone(loaded.state);
    winningState.essence = 111;
    const losingState = structuredClone(loaded.state);
    losingState.essence = 222;
    const winner = prepareV5SaveWrite({
      state: winningState,
      extensions: { player: { 'test.authority': { version: 1, json: '{"value":1}' } } },
    }, REGISTRY, NOW);
    const loser = prepareV5SaveWrite({
      state: losingState,
      extensions: { player: { 'test.authority': { version: 1, json: '{"value":2}' } } },
    }, REGISTRY, NOW);
    const left = createRevisionedRepository(backend);
    const right = createRevisionedRepository(backend);
    expect((await left.mutate({ expectedRevision: 0, writes: winner.operations })).kind).toBe('committed');
    const afterWinner = await dump(backend);

    expect(await right.mutate({ expectedRevision: 0, writes: loser.operations })).toEqual({
      kind: 'stale', expectedRevision: 0, actualRevision: 1,
    });
    expect(await dump(backend)).toEqual(afterWinner);
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(winner.legacyV4Raw);
    expect(await backend.get('meta', V4_PRIMARY_KEY)).not.toBe(loser.legacyV4Raw);
    const final = await readSaveV5(backend, REGISTRY, NOW);
    expect(final.kind).toBe('loaded');
    if (final.kind === 'loaded') {
      expect(final.state.essence).toBe(111);
      expect(final.extensions.player?.['test.authority']?.json).toBe('{"value":1}');
    }
  });

  it('replaces split state, exact compatibility mirror, and recovery authority in one CAS so the prior expedition cannot resurrect', async () => {
    expect(prepareV5Replacement('{"v":9,"epoch":1}', REGISTRY, NOW)).toEqual({ kind: 'future-version' });
    expect(prepareV5Replacement('{}', REGISTRY, NOW)).toEqual({ kind: 'corrupt' });

    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const oldSnapshot = await backend.get('journal', V5_SNAPSHOT_KEY);
    const veteran = FIXTURES.inputs.veteran_rich as Record<string, unknown>;
    const replacementRaw = JSON.stringify({
      ...veteran,
      me: 'Replacement Explorer',
      essence: 42,
      tut: 0,
      tsnap: { view: veteran.view },
    });
    const replacement = prepareV5Replacement(replacementRaw, REGISTRY, NOW);
    expect(replacement.kind).toBe('prepared');
    if (replacement.kind !== 'prepared') return;
    expect(replacement.extensions).toEqual({});
    expect(replacement.operations.some((operation) => operation.store === 'receipts'
      || (operation.store === 'meta' && operation.key !== V4_PRIMARY_KEY))).toBe(false);

    expect(await createRevisionedRepository(backend).mutate({
      expectedRevision: 0,
      writes: replacement.operations,
    })).toEqual({ kind: 'committed', revision: 1, receiptKey: null });
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(replacementRaw);
    const newSnapshot = await backend.get('journal', V5_SNAPSHOT_KEY);
    expect(newSnapshot).not.toBe(oldSnapshot);
    expect(JSON.parse(newSnapshot!).raw).toBe(replacementRaw);
    expect(JSON.parse((await backend.get('journal', V5_JOURNAL_KEY))!)).toMatchObject({
      kind: 'trusted-v4-replacement', phase: 'complete', snapshotKey: V5_SNAPSHOT_KEY,
    });
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.explorerName).toBe('Replacement Explorer');
      expect(loaded.state.essence).toBe(42);
      expect(loaded.ingress.trainingSnapshot.kind).toBe('current-view');
      expect(loaded.extensions).toEqual({});
    }

    await backend.apply([{
      store: 'player', key: 'v5:player', value: '{"schema":5,"segment":"player","data":[]}',
    }]);
    const recovered = await readSaveV5WithRecovery(backend, REGISTRY, NOW);
    expect(recovered.kind).toBe('recovered-v4');
    if (recovered.kind === 'recovered-v4') {
      expect(recovered.raw).toBe(replacementRaw);
      expect(recovered.state.explorerName).toBe('Replacement Explorer');
      expect(recovered.state.essence).toBe(42);
      expect(recovered.ingress.trainingSnapshot.kind).toBe('current-view');
    }
  });

  it('bootstraps schema, split rows, explicit empty-source journal, v4 mirror, and revision in one fresh-store transaction', async () => {
    const classified = classifyV4Save(VETERAN_RAW, REGISTRY, NOW);
    expect(classified.kind).toBe('supported');
    if (classified.kind !== 'supported') return;
    const backend = createMemoryBackend();
    const extensions = {
      player: { 'f4.authority': { version: 1, json: '{"activePlayMs":0,"sessionRng":{"seed":91,"ordinal":0,"draws":{}}}' } },
    } as const;
    const expected = prepareV5SaveWrite({ state: classified.state, extensions }, REGISTRY, NOW);

    expect(await initializeFreshV5(backend, { state: classified.state, extensions }, REGISTRY, NOW)).toEqual({
      kind: 'initialized', revision: 1, legacyV4Raw: classified.normalizedRaw,
    });
    expect(await createRevisionedRepository(backend).revision()).toBe(1);
    expect(await backend.get('journal', V5_SNAPSHOT_KEY)).toBeUndefined();
    expect(JSON.parse((await backend.get('journal', V5_JOURNAL_KEY))!)).toMatchObject({
      schema: 5, kind: 'fresh-v5-init', phase: 'complete', snapshotKey: null,
    });
    expect(await backend.get('meta', V5_SCHEMA_KEY)).toBeDefined();
    expect(await backend.get('meta', V4_PRIMARY_KEY)).toBe(classified.normalizedRaw);
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state).toEqual(expected.canonicalState);
      expect(loaded.extensions).toEqual(extensions);
      expect(loaded.legacyV4Raw).toBe(classified.normalizedRaw);
    }
  });

  it('refuses fresh bootstrap over an existing v4 primary and makes two simultaneous initializers converge on one complete save', async () => {
    const classified = classifyV4Save(VETERAN_RAW, REGISTRY, NOW);
    expect(classified.kind).toBe('supported');
    if (classified.kind !== 'supported') return;
    const occupied = createMemoryBackend();
    await occupied.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect(await initializeFreshV5(occupied, { state: classified.state, extensions: {} }, REGISTRY, NOW))
      .toEqual({ kind: 'not-fresh' });
    expect(await occupied.get('meta', V4_PRIMARY_KEY)).toBe(VETERAN_RAW);
    expect(await occupied.get('meta', V5_SCHEMA_KEY)).toBeUndefined();
    expect(await occupied.get('meta', 'f3:revision')).toBeUndefined();
    expect(await occupied.get('journal', V5_JOURNAL_KEY)).toBeUndefined();

    const racing = createMemoryBackend();
    const a = structuredClone(classified.state);
    const b = structuredClone(classified.state);
    a.essence = 111;
    b.essence = 222;
    const [left, right] = await Promise.all([
      initializeFreshV5(racing, {
        state: a, extensions: { player: { 'test.authority': { version: 1, json: '{"writer":"a"}' } } },
      }, REGISTRY, NOW),
      initializeFreshV5(racing, {
        state: b, extensions: { player: { 'test.authority': { version: 1, json: '{"writer":"b"}' } } },
      }, REGISTRY, NOW),
    ]);
    expect([left.kind, right.kind].sort()).toEqual(['initialized', 'not-fresh']);
    expect(await createRevisionedRepository(racing).revision()).toBe(1);
    const winner = await readSaveV5(racing, REGISTRY, NOW);
    expect(winner.kind).toBe('loaded');
    if (winner.kind === 'loaded') {
      expect([111, 222]).toContain(winner.state.essence);
      const authority = JSON.parse(winner.extensions.player?.['test.authority']?.json ?? '{}') as { writer?: string };
      expect(authority.writer).toBe(winner.state.essence === 111 ? 'a' : 'b');
      expect(await racing.get('meta', V4_PRIMARY_KEY)).toBe(winner.legacyV4Raw);
    }
  });
});
