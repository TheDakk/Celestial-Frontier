import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  MAX_ENGINEERING_REVISION,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  createLegacyEngineeringSeedResolver,
  migrateLegacyEngineeringState,
  type EngineeringAddressResolver,
} from '@cf/domain-opportunity';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  ARC3_ENGINEERING_VERSION,
  F3_REVISION_KEY,
  V4_PRIMARY_KEY,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  canonicalizeV5Extensions,
  createActivePlayPersistenceOwner,
  createF4DeterministicProductTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  encodeArc3EngineeringCarrier,
  migrateStoredV4ToV5,
  prepareArc3EngineeringLegacyBootstrap,
  prepareArc3EngineeringWrite,
  readArc3Engineering,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type StorageBackend,
  type StorageCheck,
  type StorageOperation,
  type V5Extensions,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const VETERAN_RAW = JSON.stringify(fixtures.inputs.veteran_rich);
const NOW = 1_753_900_060_000;

beforeAll(() => installCaptureHooks());

const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  if (!result.ok) throw new Error(`world fixture did not resolve: ${result.reason}`);
  return result.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const result = resolveCF1StarAddress(candidate);
  if (!result.ok) throw new Error(`star fixture did not resolve: ${result.reason}`);
  return result.address;
}

function legacyEngineering(input: Readonly<{
  worlds?: readonly { readonly seed: number; readonly extractionsTaken: number }[];
  stars?: readonly { readonly seed: number; readonly extractionsTaken: number }[];
  research?: readonly unknown[];
  revision?: number;
}> = {}): unknown {
  return {
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: input.revision ?? 0,
    worlds: input.worlds ?? [],
    stars: input.stars ?? [],
    research: input.research ?? [],
  };
}

function objectJsonOfLength(length: number): string {
  const shellLength = JSON.stringify({ p: '' }).length;
  if (length < shellLength) throw new RangeError('padding JSON is too short');
  const raw = JSON.stringify({ p: 'x'.repeat(length - shellLength) });
  if (raw.length !== length) throw new Error('padding JSON length drifted');
  return raw;
}

function paddingExtensions(totalJsonBytes: number): V5Extensions {
  const count = Math.ceil(totalJsonBytes / V5_MAX_EXTENSION_JSON_BYTES);
  const each = Math.floor(totalJsonBytes / count);
  const remainder = totalJsonBytes % count;
  const settings: Record<string, { version: number; json: string }> = {};
  for (let index = 0; index < count; index++) {
    const length = each + (index < remainder ? 1 : 0);
    settings[`test.pad-${index}`] = { version: 91, json: objectJsonOfLength(length) };
  }
  return canonicalizeV5Extensions({ settings });
}

describe('@cf/persistence — Arc 3 engineering carrier', () => {
  it('bootstraps exact canonical state and classifies absent, loaded, future, and corrupt carriers', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const sol = star(SOL);
    const legacyResolver = createLegacyEngineeringSeedResolver({ worlds: [mars], stars: [sol] });
    const base = canonicalizeV5Extensions({
      player: { 'other.player': { version: 7, json: '{"opaque":"player"}' } },
      inventory: { 'arc2.loot': { version: 1, json: '{"opaque":"inventory"}' } },
      settings: { 'arc7.audio': { version: 2, json: '{"muted":false}' } },
    });
    const before = JSON.stringify(base);
    const bootstrap = prepareArc3EngineeringLegacyBootstrap({
      extensions: base,
      legacy: legacyEngineering({
        worlds: [{ seed: 134, extractionsTaken: 12 }],
        stars: [{ seed: 424242, extractionsTaken: 3 }],
        research: ['drive2', 'unknown', 'scan1'],
        revision: 8,
      }),
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver,
    });
    expect(bootstrap.kind).toBe('prepared');
    if (bootstrap.kind !== 'prepared') return;

    expect(JSON.stringify(base)).toBe(before);
    expect(bootstrap.write).toMatchObject({
      segment: ARC3_ENGINEERING_SEGMENT,
      namespace: ARC3_ENGINEERING_NAMESPACE,
      carrier: { version: ARC3_ENGINEERING_VERSION },
    });
    expect(bootstrap.extensions.player?.['other.player']).toEqual(base.player?.['other.player']);
    expect(bootstrap.extensions.inventory).toEqual(base.inventory);
    expect(bootstrap.extensions.settings).toEqual(base.settings);

    const loaded = readArc3Engineering(
      bootstrap.extensions,
      SCENE_ENGINEERING_ADDRESS_RESOLVER,
    );
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state).toMatchObject({
      revision: 8,
      research: ['scan1', 'drive2'],
      worlds: [{ key: mars.key, extractionsTaken: 12, autoExtractorCursor: null }],
      stars: [{ key: sol.key, extractionsTaken: 3 }],
    });
    expect(encodeArc3EngineeringCarrier(loaded.state)).toEqual(bootstrap.write.carrier);
    expect(readArc3Engineering({}, SCENE_ENGINEERING_ADDRESS_RESOLVER)).toEqual({ kind: 'absent' });

    const loadedBootstrap = prepareArc3EngineeringLegacyBootstrap({
      extensions: bootstrap.extensions,
      legacy: legacyEngineering(),
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    });
    expect(loadedBootstrap).toMatchObject({ kind: 'already-loaded', state: loaded.state });

    const future = canonicalizeV5Extensions({
      player: { [ARC3_ENGINEERING_NAMESPACE]: { version: 2, json: '{}' } },
    });
    expect(readArc3Engineering(future, SCENE_ENGINEERING_ADDRESS_RESOLVER))
      .toEqual({ kind: 'future-version', version: 2 });
    const corrupt = canonicalizeV5Extensions({
      player: { [ARC3_ENGINEERING_NAMESPACE]: { version: 1, json: '{}' } },
    });
    expect(readArc3Engineering(corrupt, SCENE_ENGINEERING_ADDRESS_RESOLVER))
      .toEqual({ kind: 'corrupt' });
    const refusingAddressResolver: EngineeringAddressResolver = {
      resolveWorldAddress: () => null,
      resolveStarAddress: () => null,
    };
    expect(readArc3Engineering(bootstrap.extensions, refusingAddressResolver))
      .toEqual({ kind: 'corrupt' });
  });

  it('refuses collisions and never overwrites absent, future, corrupt, or globally over-bound authority', () => {
    const marsA = world({ ...SOL, planet: { seed: 134 } });
    const marsB = world({ ...SOL, planet: { seed: 134 } });
    const legacy = legacyEngineering({ worlds: [{ seed: 134, extractionsTaken: 1 }] });
    const collision = prepareArc3EngineeringLegacyBootstrap({
      extensions: {},
      legacy,
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [marsA, marsB], stars: [] }),
    });
    expect(collision).toEqual({ kind: 'protected', reason: 'legacy-refused' });
    const missing = prepareArc3EngineeringLegacyBootstrap({
      extensions: {},
      legacy,
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    });
    expect(missing).toEqual({ kind: 'protected', reason: 'legacy-refused' });

    const next = migrateLegacyEngineeringState(
      legacyEngineering({
        worlds: [{ seed: 134, extractionsTaken: 2 }],
        research: ['scan1'],
        revision: 1,
      }),
      createLegacyEngineeringSeedResolver({ worlds: [marsA], stars: [] }),
    );
    expect(prepareArc3EngineeringWrite({
      extensions: {}, state: next, resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'target-absent' });

    const future = canonicalizeV5Extensions({
      player: { [ARC3_ENGINEERING_NAMESPACE]: { version: 99, json: '{}' } },
    });
    expect(prepareArc3EngineeringLegacyBootstrap({
      extensions: future,
      legacy,
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [marsA], stars: [] }),
    })).toEqual({ kind: 'protected', reason: 'target-future', version: 99 });
    const corrupt = {
      player: { [ARC3_ENGINEERING_NAMESPACE]: { version: 1, json: '{}' } },
    } as V5Extensions;
    expect(prepareArc3EngineeringLegacyBootstrap({
      extensions: corrupt,
      legacy,
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [marsA], stars: [] }),
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    expect(prepareArc3EngineeringLegacyBootstrap({
      extensions: { unknown: {} } as unknown as V5Extensions,
      legacy,
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [marsA], stars: [] }),
    })).toEqual({ kind: 'protected', reason: 'extensions-corrupt' });

    const emptyResolver: EngineeringAddressResolver = {
      resolveWorldAddress: () => null,
      resolveStarAddress: () => null,
    };
    const empty = prepareArc3EngineeringLegacyBootstrap({
      extensions: {},
      legacy: legacyEngineering(),
      addressResolver: emptyResolver,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    });
    expect(empty.kind).toBe('prepared');
    if (empty.kind !== 'prepared') return;
    expect(prepareArc3EngineeringWrite({
      extensions: empty.extensions,
      state: next,
      resolver: emptyResolver,
    })).toEqual({ kind: 'protected', reason: 'state-unreadable' });

    const padding = paddingExtensions(
      V5_MAX_EXTENSION_TOTAL_BYTES - empty.write.carrier.json.length,
    );
    const exactFullBase = canonicalizeV5Extensions({
      ...padding,
      player: { [ARC3_ENGINEERING_NAMESPACE]: empty.write.carrier },
    });
    expect(prepareArc3EngineeringWrite({
      extensions: exactFullBase,
      state: next,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
  });

  it('prepares current replacements while preserving every unrelated extension exactly', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const resolver = createLegacyEngineeringSeedResolver({ worlds: [mars], stars: [] });
    const starting = prepareArc3EngineeringLegacyBootstrap({
      extensions: canonicalizeV5Extensions({
        player: { 'other.player': { version: 5, json: '{"keep":1}' } },
        inventory: { 'arc2.loot': { version: 1, json: '{"keep":2}' } },
      }),
      legacy: legacyEngineering({ worlds: [{ seed: 134, extractionsTaken: 1 }] }),
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: resolver,
    });
    expect(starting.kind).toBe('prepared');
    if (starting.kind !== 'prepared') return;
    const next = migrateLegacyEngineeringState(
      legacyEngineering({
        worlds: [{ seed: 134, extractionsTaken: 2 }], research: ['drive2'], revision: 1,
      }),
      resolver,
    );
    const write = prepareArc3EngineeringWrite({
      extensions: starting.extensions,
      state: next,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    });
    expect(write.kind).toBe('prepared');
    if (write.kind !== 'prepared') return;
    expect(write.extensions.player?.['other.player']).toEqual({ version: 5, json: '{"keep":1}' });
    expect(write.extensions.inventory?.['arc2.loot']).toEqual({ version: 1, json: '{"keep":2}' });
    expect(write.extensions.player?.[ARC3_ENGINEERING_NAMESPACE]).toEqual(write.write.carrier);
    expect(readArc3Engineering(write.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER))
      .toMatchObject({ kind: 'loaded', state: { revision: 1, research: ['drive2'] } });

    expect(prepareArc3EngineeringWrite({
      extensions: starting.extensions,
      state: starting.state,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({
      kind: 'protected', reason: 'revision-conflict', expectedRevision: 1, actualRevision: 0,
    });
    expect(prepareArc3EngineeringWrite({
      extensions: write.extensions,
      state: starting.state,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({
      kind: 'protected', reason: 'revision-conflict', expectedRevision: 2, actualRevision: 0,
    });
    const skipped = migrateLegacyEngineeringState(
      legacyEngineering({ worlds: [{ seed: 134, extractionsTaken: 3 }], revision: 3 }),
      resolver,
    );
    expect(prepareArc3EngineeringWrite({
      extensions: write.extensions,
      state: skipped,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({
      kind: 'protected', reason: 'revision-conflict', expectedRevision: 2, actualRevision: 3,
    });

    const terminal = prepareArc3EngineeringLegacyBootstrap({
      extensions: {},
      legacy: legacyEngineering({ revision: MAX_ENGINEERING_REVISION }),
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver: createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }),
    });
    expect(terminal.kind).toBe('prepared');
    if (terminal.kind !== 'prepared') return;
    expect(prepareArc3EngineeringWrite({
      extensions: terminal.extensions,
      state: terminal.state,
      resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    })).toEqual({
      kind: 'protected', reason: 'revision-exhausted', actualRevision: MAX_ENGINEERING_REVISION,
    });
  });
});

describe('@cf/persistence — Arc 3 deterministic action join', () => {
  it('atomically lands compatibility state, carrier, F4 authority, receipt, revision, and lease without an RNG draw', async () => {
    const baseBackend = createMemoryBackend();
    let captured: { checks: readonly StorageCheck[]; operations: readonly StorageOperation[] } | null = null;
    let armed = false;
    const backend: StorageBackend = {
      ...baseBackend,
      async compareAndApply(checks, operations, clearStores) {
        if (armed && operations.some((operation) => operation.store === 'receipts')) {
          captured = { checks: [...checks], operations: [...operations] };
        }
        return baseBackend.compareAndApply(checks, operations, clearStores);
      },
    };
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const initial = await readSaveV5(backend, REGISTRY, NOW);
    if (initial.kind !== 'loaded') throw new Error(`expected loaded v5, received ${initial.kind}`);

    const mars = world({ ...SOL, planet: { seed: 134 } });
    const legacyResolver = createLegacyEngineeringSeedResolver({ worlds: [mars], stars: [] });
    const starting = prepareArc3EngineeringLegacyBootstrap({
      extensions: initial.extensions,
      legacy: legacyEngineering({
        worlds: [{ seed: 134, extractionsTaken: 1 }], research: ['drive1'], revision: 4,
      }),
      addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
      legacyResolver,
    });
    if (starting.kind !== 'prepared') throw new Error(`expected Arc 3 bootstrap, received ${starting.kind}`);

    const clock = { now: () => 0 };
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc3-tab', token: 'arc3-session', ttlMs: 1_000, now: clock.now,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`expected lease, received ${acquired.kind}`);
    const initialRng = createSessionRNG(
      0xA3C3,
      { 'capture.success': 4, 'loot.rarity': 2 },
      9,
    ).state();
    const authorityCommit = await createActivePlayPersistenceOwner(
      createRevisionedRepository(backend),
      REGISTRY,
    ).commit({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state: initial.state, extensions: starting.extensions },
      snapshot: { activePlayMs: 250 },
      sessionRng: initialRng,
      now: NOW,
    });
    expect(authorityCommit.kind).toBe('committed');
    const current = await readSaveV5(backend, REGISTRY, NOW);
    if (current.kind !== 'loaded') throw new Error(`expected current v5, received ${current.kind}`);

    const nextEngineering = migrateLegacyEngineeringState(
      legacyEngineering({
        worlds: [{ seed: 134, extractionsTaken: 2 }],
        research: ['drive1', 'drive2'],
        revision: 5,
      }),
      legacyResolver,
    );
    const beforeEssence = current.state.essence;
    armed = true;
    const outcome = await createF4DeterministicProductTransactionOwner(
      createRevisionedRepository(backend),
      REGISTRY,
    ).commit({
      expectedRevision: 1,
      grant: acquired.grant,
      writable: { state: current.state, extensions: current.extensions },
      snapshot: { activePlayMs: 275 },
      operation: 'research:drive2',
      receiptKind: 'arc3-research',
      now: NOW,
      derive: ({ operation, receiptOrdinal, activePlayMs, draft, extensions }) => {
        expect(operation).toBe('research:drive2');
        expect(receiptOrdinal).toBe(9);
        expect(activePlayMs).toBe(275);
        draft.essence -= 25;
        const carrier = prepareArc3EngineeringWrite({
          extensions,
          state: nextEngineering,
          resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
        });
        if (carrier.kind !== 'prepared') {
          throw new Error(`expected Arc 3 write, received ${carrier.reason}`);
        }
        return {
          state: draft,
          witness: `research:drive2:cost=25:engineering-revision=${nextEngineering.revision}`,
          extensionWrites: [carrier.write],
        };
      },
    });

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.revision).toBe(2);
    expect(outcome.receipt).toEqual({
      ordinal: 9,
      kind: 'arc3-research',
      witness: 'research:drive2:cost=25:engineering-revision=5',
    });
    expect(outcome.authority).toEqual({
      activePlayMs: 275,
      sessionRng: {
        seed: 0xA3C3,
        ordinal: 10,
        draws: { 'capture.success': 4, 'loot.rarity': 2 },
      },
    });
    expect(outcome.plan.currentAuthority.sessionRng.draws)
      .toEqual(outcome.plan.nextSessionRng.draws);
    expect(captured).not.toBeNull();
    expect(captured!.checks).toEqual([
      { store: 'meta', key: F3_REVISION_KEY, value: '1' },
      { store: 'receipts', key: 'receipt:9', value: undefined },
      acquired.grant.check,
    ]);
    expect(captured!.operations).toEqual([
      ...outcome.saved.operations,
      { store: 'receipts', key: 'receipt:9', value: JSON.stringify(outcome.receipt) },
      { store: 'meta', key: F3_REVISION_KEY, value: '2' },
    ]);

    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.essence).toBe(beforeEssence - 25);
    const engineering = readArc3Engineering(
      loaded.extensions,
      SCENE_ENGINEERING_ADDRESS_RESOLVER,
    );
    expect(engineering).toMatchObject({
      kind: 'loaded',
      state: {
        revision: 5,
        research: ['drive1', 'drive2'],
        worlds: [{ key: mars.key, extractionsTaken: 2 }],
      },
    });
    expect(readF4Authority(loaded.extensions)).toEqual({
      kind: 'loaded', authority: outcome.authority,
    });
    const repository = createRevisionedRepository(backend);
    expect(await repository.revision()).toBe(2);
    expect(await repository.readReceipt(9)).toEqual(outcome.receipt);
    expect(starting.state).toMatchObject({ revision: 4, research: ['drive1'] });
  });
});
