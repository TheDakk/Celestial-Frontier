import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { sha256Hex } from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  WORLD_IDENTITY_MANIFEST_NAMESPACE,
  WORLD_IDENTITY_SHARD_PREFIX,
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  encodeWorldIdentityExtensionWrites,
  importSaveV2,
  initializeFreshV5,
  prepareF4AuthorityUpdate,
  prepareWorldIdentityBootstrap,
  readF4Authority,
  readSaveV5,
  readWorldIdentity,
  recordCanonicalWorldLanding,
  worldIdentityName,
  worldIdentityRecord,
  type CanonicalWorldIdentityStateV1,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  canonicalCF1WorldAtlasId,
  navFromCanonicalCF1Address,
  navToView,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
  type SurfaceNav,
} from '@cf/scene';
import {
  ARC0_ATLAS_RECEIPT_KIND,
  commitArc0AtlasAction,
  operationForArc0Atlas,
  verifyArc0AtlasPostcommit,
  type Arc0AtlasActionInput,
} from '../apps/game/src/arc0-atlas-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

beforeAll(() => installCaptureHooks());

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress(candidate);
  if (!resolved.ok) throw new Error(`Atlas world fixture failed: ${resolved.reason}`);
  return resolved.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('Atlas surface fixture failed');
  return result.state;
}

function solWorld(seed: number): CanonicalCF1WorldAddress {
  return world({ galaxy: HOME_GALAXY, star: SOL, planet: { seed } });
}

function foreign133(): CanonicalCF1WorldAddress {
  return world({
    galaxy: {
      seed: 3_959_248_028,
      x: -6_974_362.37248769,
      y: 4_279_128.574915975,
    },
    star: {
      seed: 1_420_541_153,
      x: 100.5842142929323,
      y: -1_171.697432242334,
    },
    planet: { seed: 133 },
  });
}

function persistentSurface(address: CanonicalCF1WorldAddress): Record<string, unknown> {
  const raw = navToView(surface(address));
  if (!raw || raw.type !== 'planet') throw new Error('Atlas view fixture failed');
  const sourceGalaxy = raw.gal as Record<string, unknown>;
  const sourceStar = raw.star as Record<string, unknown>;
  const gal: Record<string, unknown> = {
    x: sourceGalaxy.x,
    y: sourceGalaxy.y,
    seed: sourceGalaxy.seed,
    size: sourceGalaxy.size,
    sp: sourceGalaxy.sp,
    tilt: sourceGalaxy.tilt,
    rot: sourceGalaxy.rot,
  };
  for (const flag of ['home', 'quasar', 'dwarf'] as const) {
    if (sourceGalaxy[flag] === true) gal[flag] = true;
  }
  return {
    gal,
    pseed: raw.pseed,
    star: { x: sourceStar.x, y: sourceStar.y, seed: sourceStar.seed },
    type: 'planet',
  };
}

function atlasEntry(
  id: string,
  address: CanonicalCF1WorldAddress,
  timestamp: number,
  overrides: Readonly<Record<string, unknown>> = {},
): [string, Record<string, unknown>] {
  return [id, {
    id,
    title: `Chart ${id}`.slice(0, 60),
    sub: 'Existing route',
    thumb: null,
    sq: false,
    badge: '',
    where: persistentSurface(address),
    fav: false,
    t: timestamp,
    ...overrides,
  }];
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Atlas base save failed: ${imported.reason}`);
  return imported.state;
}

function identityWithLegacy(
  seed: number,
  options: Readonly<{ name?: string; landed?: boolean }> = {},
): CanonicalWorldIdentityStateV1 {
  const prepared = prepareWorldIdentityBootstrap({
    extensions: {},
    legacy: {
      landed: options.landed === true ? [seed] : [],
      customNames: options.name === undefined ? [] : [[`p${seed}`, options.name]],
    },
    addresses: [],
  });
  if (prepared.kind !== 'prepared') throw new Error(`Atlas identity fixture failed: ${prepared.kind}`);
  return prepared.state;
}

function jsonBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function exactJsonBytes(size: number): string {
  if (!Number.isSafeInteger(size) || size < 8 || size > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new RangeError(`invalid Atlas filler size ${size}`);
  }
  const json = `{"p":"${'x'.repeat(size - 8)}"}`;
  if (jsonBytes(json) !== size) throw new Error('Atlas filler missed its exact size');
  return json;
}

function totalExtensionBytes(extensions: V5Extensions): number {
  return Object.values(extensions).reduce((total, segment) => total + Object.values(segment ?? {})
    .reduce((segmentTotal, carrier) => segmentTotal + jsonBytes(carrier.json), 0), 0);
}

function fillExtensionsToCapacity(extensions: V5Extensions): V5Extensions {
  let remaining = V5_MAX_EXTENSION_TOTAL_BYTES - totalExtensionBytes(extensions);
  const writes = [];
  let index = 0;
  while (remaining > 0) {
    const size = Math.min(V5_MAX_EXTENSION_JSON_BYTES, remaining);
    if (size < 8) throw new Error('Atlas filler left an unrepresentable tail');
    writes.push({
      segment: 'inventory' as const,
      namespace: `arc0.atlas.capacity.${index++}`,
      carrier: { version: 1, json: exactJsonBytes(size) },
    });
    remaining -= size;
  }
  return applyV5ExtensionWrites(extensions, writes).extensions;
}

type IdentityMode = 'loaded' | 'absent' | 'corrupt' | 'future' | 'capacity';

interface FixtureOptions {
  readonly state?: SaveStateV2;
  readonly identity?: CanonicalWorldIdentityStateV1;
  readonly identityMode?: IdentityMode;
  readonly storageFailure?: boolean;
}

async function runtimeFixture(options: FixtureOptions = {}) {
  const submittedState = options.state ?? baseState();
  const session = createSessionRNG(0xA7A5_0001, { 'prior.random': 3 }, 11).state();
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, session);
  const identity = options.identity ?? createEmptyWorldIdentityState();
  let extensions = f4.extensions;
  if (options.identityMode !== 'absent') {
    extensions = applyV5ExtensionWrites(
      extensions,
      encodeWorldIdentityExtensionWrites(identity),
    ).extensions;
  }
  if (options.identityMode === 'corrupt') {
    const catalog = { ...(extensions.catalog ?? {}) };
    delete catalog[`${WORLD_IDENTITY_SHARD_PREFIX}0`];
    extensions = { ...extensions, catalog };
  } else if (options.identityMode === 'future') {
    const catalog = { ...(extensions.catalog ?? {}) };
    const manifest = catalog[WORLD_IDENTITY_MANIFEST_NAMESPACE]!;
    catalog[WORLD_IDENTITY_MANIFEST_NAMESPACE] = { ...manifest, version: 2 };
    extensions = { ...extensions, catalog };
  } else if (options.identityMode === 'capacity') {
    extensions = fillExtensionsToCapacity(extensions);
  }

  const base = createMemoryBackend();
  const initialized = await initializeFreshV5(
    base,
    { state: submittedState, extensions },
    REGISTRY,
    NOW,
  );
  if (initialized.kind !== 'initialized') throw new Error(`Atlas v5 fixture failed: ${initialized.kind}`);
  const loaded = await readSaveV5(base, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`Atlas fixture reload failed: ${loaded.kind}`);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.storageFailure === true) throw new Error('forced Arc 0 Atlas storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: initialized.revision,
    initialExtensions: loaded.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc0-atlas-tab',
    token: 'arc0-atlas-document',
    leaseTtlMs: 10_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Atlas lease failed: ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: loaded.state,
    receiptCas: () => receiptCas,
  };
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  address: CanonicalCF1WorldAddress,
  overrides: Partial<Omit<Arc0AtlasActionInput, 'runtime' | 'address' | 'surface'>> = {},
): Arc0AtlasActionInput {
  return {
    runtime: fixture.runtime,
    state: fixture.state,
    surface: surface(address),
    address,
    title: 'Surveyed World',
    sub: 'Temperate terrestrial world',
    displayTimestamp: NOW,
    codecNow: NOW,
    ...overrides,
  };
}

function atlasRows(count: number, address = solWorld(135)): Array<[string, Record<string, unknown>]> {
  return Array.from({ length: count }, (_, index) => (
    atlasEntry(`legacy-${String(index).padStart(3, '0')}`, address, index)
  ));
}

describe('Arc 0 durable Atlas action', () => {
  it('seals the codec-canonical successor when an unrelated veteran mining stamp moves', async () => {
    const state = baseState();
    state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
    state.mineX = [['veteran-clock-floor', 1]];
    const fixture = await runtimeFixture({ state });
    const before = JSON.stringify(fixture.state);
    const address = solWorld(134);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      codecNow: NOW + 1,
    }));

    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.transaction.state.mined).get('veteran-clock-floor'))
      .toBe(NOW + 1 - 30 * 6e5);
    expect(verifyArc0AtlasPostcommit({
      transaction: outcome.transaction,
      address,
      witness: outcome.witness,
    })).toMatchObject({ kind: 'verified' });
    await fixture.runtime.release();
  });

  it('commits one exact composite row and identity carrier with no RNG draw or live mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const before = structuredClone(fixture.state);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      title: 'Mars',
      sub: 'Rust-red terrestrial world',
    }));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const id = canonicalCF1WorldAtlasId(address);
    expect(outcome.witness.facts).toMatchObject({
      worldKey: address.key,
      identityClaimedLegacy: false,
      identityRecordAfter: false,
      unresolvedSeedAfter: false,
      atlas: {
        status: 'added',
        id,
        title: 'Mars',
        sub: 'Rust-red terrestrial world',
        timestamp: NOW,
        countBefore: 0,
        countAfter: 1,
        evictedId: null,
      },
      receiptOrdinal: 11,
    });
    expect(outcome.transaction).toMatchObject({
      revision: 2,
      plan: {
        operation: `arc0.atlas:${sha256Hex(address.key)}`,
        receiptOrdinal: 11,
      },
      receipt: { ordinal: 11, kind: ARC0_ATLAS_RECEIPT_KIND },
    });
    expect(operationForArc0Atlas(address)).toBe(outcome.transaction.plan.operation);
    const row = outcome.transaction.state.logMap.find(([rowId]) => rowId === id);
    expect(row?.[1]).toMatchObject({
      id,
      title: 'Mars',
      sub: 'Rust-red terrestrial world',
      where: persistentSurface(address),
      t: NOW,
    });
    expect(outcome.transaction.state.landed).toEqual(before.landed);
    const untouched = structuredClone(outcome.transaction.state);
    untouched.logMap = before.logMap;
    expect(untouched).toEqual(before);
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(1);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA7A5_0001,
      ordinal: 12,
      draws: { 'prior.random': 3 },
    });
    expect(verifyArc0AtlasPostcommit({
      transaction: outcome.transaction,
      address,
      witness: outcome.witness,
    }).kind).toBe('verified');

    const persisted = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(persisted.kind).toBe('loaded');
    if (persisted.kind === 'loaded') {
      expect(persisted.state).toEqual(outcome.transaction.state);
      expect(readWorldIdentity(persisted.extensions).kind).toBe('loaded');
      expect(readF4Authority(persisted.extensions)).toMatchObject({
        kind: 'loaded',
        authority: { sessionRng: { ordinal: 12, draws: { 'prior.random': 3 } } },
      });
    }
  });

  it('returns an exact-parent already-durable observation without a receipt or publishable state', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const first = await commitArc0AtlasAction(actionInput(fixture, address));
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    const revision = await fixture.repository.revision();
    const second = await commitArc0AtlasAction(actionInput(fixture, address, {
      state: first.transaction.state,
      title: 'A changed presentation title',
      displayTimestamp: NOW + 1,
    }));

    expect(second).toMatchObject({
      kind: 'already-durable',
      durability: 'observed-detached-f4-parent',
      observation: {
        scope: 'exact-detached-f4-parent',
        worldKey: address.key,
        atlasId: canonicalCF1WorldAtlasId(address),
      },
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect('state' in second).toBe(false);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.revision()).toBe(revision);
    expect(fixture.runtime.sessionRng.ordinal).toBe(12);
  });

  it('preserves every field of unrelated Atlas history while adding the exact new row', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.logMap = [atlasEntry('legacy-history', solWorld(135), NOW - 1, {
      title: 'Keep this history',
      sub: 'Unrelated historical route',
      sq: true,
      badge: 'Rare',
      fav: true,
      star: 'G2 V',
    })];
    state.homeId = 'legacy-history';
    const fixture = await runtimeFixture({ state });
    const preserved = structuredClone(fixture.state.logMap[0]);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state.logMap.find(([id]) => id === 'legacy-history'))
      .toEqual(preserved);
    expect(outcome.transaction.state.homeId).toBe('legacy-history');
  });

  it('accepts the exact durable title, subtitle, and display-time boundaries', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const title = 'T'.repeat(60);
    const sub = 'S'.repeat(120);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      title,
      sub,
      displayTimestamp: 4_102_444_800_000,
    }));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.atlas).toMatchObject({
      title,
      sub,
      timestamp: 4_102_444_800_000,
    });
    expect(outcome.witness.encoded.length).toBeLessThanOrEqual(4_096);
  });

  it('claims unresolved identity and uses its transferred name in the new row atomically', async () => {
    const address = solWorld(134);
    const identity = identityWithLegacy(134, { name: 'Legacy Mars', landed: true });
    const fixture = await runtimeFixture({ identity });
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, { title: 'Modern Mars' }));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      identityClaimedLegacy: true,
      identityRecordAfter: true,
      unresolvedSeedAfter: false,
      atlas: { status: 'added', title: 'Legacy Mars' },
    });
    expect(worldIdentityName(outcome.verification.worldIdentity.state, address)).toBe('Legacy Mars');
    expect(worldIdentityRecord(outcome.verification.worldIdentity.state, address)?.landed).toBe(true);
    expect(outcome.transaction.state.landed).toEqual([]);
  });

  it('commits an unresolved identity claim without duplicating an exact existing row', async () => {
    const address = solWorld(134);
    const id = canonicalCF1WorldAtlasId(address);
    const state = baseState();
    state.logMap = [atlasEntry(id, address, NOW, { title: 'Historical Mars' })];
    const fixture = await runtimeFixture({
      state,
      identity: identityWithLegacy(134, { name: 'Legacy Mars' }),
    });
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      identityClaimedLegacy: true,
      atlas: {
        status: 'existing',
        countBefore: 1,
        countAfter: 1,
        title: 'Historical Mars',
      },
    });
    expect(outcome.transaction.state.logMap).toEqual(fixture.state.logMap);
    expect(worldIdentityName(outcome.verification.worldIdentity.state, address)).toBe('Legacy Mars');
  });

  it('keeps canonical Earth and a foreign seed-133 world as two exact rows', async () => {
    const foreign = foreign133();
    const earth = solWorld(133);
    const fixture = await runtimeFixture({
      identity: identityWithLegacy(133, { name: 'Legacy Collision' }),
    });
    const first = await commitArc0AtlasAction(actionInput(fixture, foreign, { title: 'Foreign 133' }));
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    const second = await commitArc0AtlasAction(actionInput(fixture, earth, {
      state: first.transaction.state,
      title: 'Earth',
      displayTimestamp: NOW + 1,
    }));

    expect(second.kind).toBe('committed');
    if (second.kind !== 'committed') return;
    expect(second.transaction.state.logMap.map(([id]) => id)).toEqual([
      canonicalCF1WorldAtlasId(earth),
      canonicalCF1WorldAtlasId(foreign),
    ]);
    expect(worldIdentityName(second.verification.worldIdentity.state, foreign)).toBe('Legacy Collision');
    expect(worldIdentityName(second.verification.worldIdentity.state, earth)).toBeNull();
  });

  it('fails closed when the exact composite id carries a different route', async () => {
    const address = solWorld(134);
    const id = canonicalCF1WorldAtlasId(address);
    const state = baseState();
    state.logMap = [atlasEntry(id, solWorld(133), NOW)];
    const fixture = await runtimeFixture({ state });
    const before = structuredClone(fixture.state);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      detail: 'atlas:collision',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.revision()).toBe(1);
  });

  it('adds at 119 rows without eviction and preserves the home marker', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.logMap = atlasRows(119);
    state.homeId = state.logMap[0]![0];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      displayTimestamp: 1_000,
    }));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.atlas).toMatchObject({
      countBefore: 119,
      countAfter: 120,
      evictedId: null,
      homeIdAfter: 'legacy-000',
    });
    expect(outcome.transaction.state.logMap).toHaveLength(120);
  });

  it('evicts the oldest durable row at 120 and clears its home marker', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.logMap = atlasRows(120);
    state.homeId = 'legacy-000';
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      displayTimestamp: 1_000,
    }));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.atlas).toMatchObject({
      countBefore: 120,
      countAfter: 120,
      evictedId: 'legacy-000',
      homeIdAfter: null,
    });
    expect(outcome.transaction.state.logMap.map(([id]) => id)).not.toContain('legacy-000');
    expect(outcome.transaction.state.homeId).toBeNull();
  });

  it('refuses a tied-late row that cannot survive the durable 120-row projection', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.logMap = atlasRows(120).map(([id, entry]) => [id, { ...entry, t: 1_000 }]);
    const fixture = await runtimeFixture({ state });
    const before = structuredClone(fixture.state);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address, {
      displayTimestamp: 1_000,
    }));

    expect(outcome).toMatchObject({
      kind: 'refused',
      detail: 'atlas:capacity',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(0);
    expect(fixture.runtime.sessionRng.ordinal).toBe(11);
  });

  it.each([
    ['absent', 'world-identity:absent'],
    ['corrupt', 'world-identity:corrupt'],
    ['future', 'world-identity:future-version'],
  ] as const)('refuses %s identity authority without publication', async (identityMode, detail) => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ identityMode });
    const before = structuredClone(fixture.state);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      detail,
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.revision()).toBe(1);
  });

  it('refuses an unresolved identity claim at shared extension capacity', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({
      identity: identityWithLegacy(134, { name: 'Legacy Mars' }),
      identityMode: 'capacity',
    });
    const before = structuredClone(fixture.state);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      detail: 'world-identity:capacity',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(0);
  });

  it.each([
    ['wrong address', (input: Arc0AtlasActionInput) => ({ ...input, address: solWorld(133) })],
    ['unregistered surface', (input: Arc0AtlasActionInput) => ({
      ...input,
      surface: structuredClone(input.surface) as SurfaceNav,
    })],
    ['unclean title', (input: Arc0AtlasActionInput) => ({ ...input, title: ' <Mars> ' })],
    ['overlong subtitle', (input: Arc0AtlasActionInput) => ({ ...input, sub: 'x'.repeat(121) })],
    ['unknown field', (input: Arc0AtlasActionInput) => ({ ...input, extra: true })],
  ] as const)('rejects %s before invoking F4', async (_name, mutate) => {
    const address = solWorld(134);
    let calls = 0;
    const input: Arc0AtlasActionInput = {
      runtime: {
        async commitAction() {
          calls++;
          return { kind: 'lease-unavailable' };
        },
      },
      state: baseState(),
      surface: surface(address),
      address,
      title: 'Mars',
      sub: '',
      displayTimestamp: NOW,
      codecNow: NOW,
    };
    const outcome = await commitArc0AtlasAction(mutate(input) as Arc0AtlasActionInput);

    expect(outcome).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
    expect(calls).toBe(0);
  });

  it('fails stale once without a receipt, RNG advance, retry, or caller mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const before = structuredClone(fixture.state);
    await fixture.repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'arc0-atlas-race', value: 'other-tab' }],
    });
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 1, actualRevision: 2 },
    });
    expect(fixture.state).toEqual(before);
    expect(fixture.receiptCas()).toBe(0);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA7A5_0001,
      ordinal: 11,
      draws: { 'prior.random': 3 },
    });
  });

  it('fails storage once without receipt, revision, RNG, or product publication', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ storageFailure: true });
    const before = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 0 Atlas storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.runtime.sessionRng.ordinal).toBe(11);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(before));
  });

  it('seals the full state and full identity successor against postcommit mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const outcome = await commitArc0AtlasAction(actionInput(fixture, address));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;

    const alteredState = structuredClone(outcome.transaction.state);
    alteredState.explorerName = 'altered outside Atlas';
    const coherentStateMutation = {
      ...outcome.transaction,
      state: alteredState,
      saved: { ...outcome.transaction.saved, canonicalState: structuredClone(alteredState) },
    };
    expect(verifyArc0AtlasPostcommit({
      transaction: coherentStateMutation as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'state-successor-mismatch' });

    const loadedIdentity = readWorldIdentity(outcome.transaction.saved.extensions);
    expect(loadedIdentity.kind).toBe('loaded');
    if (loadedIdentity.kind !== 'loaded') return;
    const extra = recordCanonicalWorldLanding(
      loadedIdentity.state,
      solWorld(135),
      outcome.transaction.saved.extensions,
    );
    const alteredExtensions = applyV5ExtensionWrites(
      outcome.transaction.saved.extensions,
      encodeWorldIdentityExtensionWrites(extra.state),
    ).extensions;
    const identityMutation = {
      ...outcome.transaction,
      saved: { ...outcome.transaction.saved, extensions: alteredExtensions },
    };
    expect(verifyArc0AtlasPostcommit({
      transaction: identityMutation as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'world-identity-mismatch' });
    expect(verifyArc0AtlasPostcommit({
      transaction: outcome.transaction,
      address,
      witness: structuredClone(outcome.witness),
    })).toEqual({ kind: 'mismatch', detail: 'witness-unregistered' });
  });

  it('captures detached state and display input before F4 queueing', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const input = actionInput(fixture, address, { title: 'Captured Mars' });
    const pending = commitArc0AtlasAction(input);
    fixture.state.explorerName = 'live mutation';
    Object.assign(input as unknown as Record<string, unknown>, {
      title: 'Changed after submission',
      sub: 'Changed after submission',
      displayTimestamp: -1,
      codecNow: -1,
    });
    const outcome = await pending;

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.atlas).toMatchObject({
      title: 'Captured Mars',
      sub: 'Temperate terrestrial world',
      timestamp: NOW,
    });
    expect(outcome.transaction.state.explorerName).not.toBe('live mutation');
    expect(fixture.state.explorerName).toBe('live mutation');
  });
});
