import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { sha256Hex } from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import {
  F3_MAX_REVISION,
  PORTABLE_V5_MAX_LEGACY_BYTES,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  WORLD_IDENTITY_MANIFEST_NAMESPACE,
  WORLD_IDENTITY_SHARD_PREFIX,
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  encodeWorldIdentityExtensionWrites,
  exportSaveV2,
  importSaveV2,
  initializeFreshV5,
  prepareF4AuthorityUpdate,
  prepareWorldIdentityBootstrap,
  readF4Authority,
  readSaveV5,
  readWorldIdentity,
  setCanonicalWorldName,
  worldIdentityName,
  type CanonicalWorldIdentityStateV1,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
  type SurfaceNav,
} from '@cf/scene';
import {
  ARC0_WORLD_NAME_RECEIPT_KIND,
  ARC0_WORLD_NAME_WITNESS_SCHEMA,
  commitArc0WorldNameAction,
  operationForArc0WorldName,
  verifyArc0WorldNamePostcommit,
  type Arc0WorldNameActionInput,
} from '../apps/game/src/arc0-world-name-action.js';
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
  if (!resolved.ok) throw new Error(`world-name fixture failed: ${resolved.reason}`);
  return resolved.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') {
    throw new Error('world-name surface fixture failed');
  }
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

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`world-name base save failed: ${imported.reason}`);
  return imported.state;
}

function nearCapacityVeteranState(): SaveStateV2 {
  const padding = 'x'.repeat(560);
  const raw = JSON.stringify({
    codex: Array.from({ length: 1_500 }, (_, index) => ({
      g: { seed: index + 1, kingdom: 'fauna', padding },
      f: 'Veteran archive',
      w: null,
    })),
  });
  if (jsonBytes(raw) > PORTABLE_V5_MAX_LEGACY_BYTES) {
    throw new Error('world-name near-cap fixture exceeded compact projection');
  }
  const imported = importSaveV2(raw, REGISTRY, NOW);
  if (!imported.ok) throw new Error(`world-name veteran import failed: ${imported.reason}`);
  if (JSON.stringify(imported.state).length <= PORTABLE_V5_MAX_LEGACY_BYTES) {
    throw new Error('world-name veteran fixture did not expand beyond one MiB');
  }
  if (jsonBytes(exportSaveV2(imported.state, NOW)) > PORTABLE_V5_MAX_LEGACY_BYTES) {
    throw new Error('world-name veteran fixture no longer has a legal compact projection');
  }
  return imported.state;
}

function jsonBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function exactJsonBytes(size: number): string {
  if (!Number.isSafeInteger(size) || size < 8 || size > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new RangeError(`invalid world-name filler size ${size}`);
  }
  const json = `{"p":"${'x'.repeat(size - 8)}"}`;
  if (jsonBytes(json) !== size) throw new Error('world-name filler missed exact size');
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
    if (size < 8) throw new Error('world-name filler left an unrepresentable tail');
    writes.push({
      segment: 'inventory' as const,
      namespace: `arc0.world-name.capacity.${index++}`,
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
  const state = options.state ?? baseState();
  const session = createSessionRNG(0xA0A0_0002, { 'prior.random': 3 }, 11).state();
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
  const initialized = await initializeFreshV5(base, { state, extensions }, REGISTRY, NOW);
  if (initialized.kind !== 'initialized') {
    throw new Error(`world-name v5 fixture failed: ${initialized.kind}`);
  }
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.storageFailure === true) throw new Error('forced Arc 0 world-name storage failure');
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
    initialExtensions: extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc0-world-name-tab',
    token: 'arc0-world-name-document',
    leaseTtlMs: 10_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`world-name lease failed: ${heartbeat.kind}`);
  return { backend, repository, runtime, state, receiptCas: () => receiptCas };
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  address: CanonicalCF1WorldAddress,
  name = 'Aurora',
): Arc0WorldNameActionInput {
  return {
    runtime: fixture.runtime,
    state: fixture.state,
    surface: surface(address),
    address,
    name,
    codecNow: NOW,
  };
}

describe('Arc 0 durable canonical-world naming action', () => {
  it('commits one cleaned name to exact identity and legacy mirror with one no-RNG receipt', async () => {
    const address = solWorld(134);
    const unrelated = solWorld(135);
    const priorIdentity = setCanonicalWorldName(
      createEmptyWorldIdentityState(), unrelated, 'Keep World', {},
    );
    expect(priorIdentity.capacityProtected).toBe(false);
    const state = baseState();
    state.customNames = [['c7', 'Keep Creature'], ['other', 'Keep Other']];
    const beforeState = structuredClone(state);
    const fixture = await runtimeFixture({ state, identity: priorIdentity.state });
    const outcome = await commitArc0WorldNameAction(
      actionInput(fixture, address, '  New <Gaia>  '),
    );

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toEqual(expect.objectContaining({
      schema: ARC0_WORLD_NAME_WITNESS_SCHEMA,
      worldKey: address.key,
      planetSeed: address.planet.seed,
      planetOrdinal: address.planet.ordinal,
      name: 'New Gaia',
      canonicalNameBefore: null,
      canonicalChanged: true,
      claimedLegacyIdentity: false,
      legacyKey: 'p134',
      legacyNameBefore: null,
      legacyNameAfter: 'New Gaia',
      legacyMirrorChanged: true,
      achievement: {
        id: 'namer',
        owner: 'naming:first-discovery-name',
        alreadyUnlocked: false,
        added: true,
        priorUnlockedCount: 0,
        unlockedCountAfter: 1,
      },
      receiptOrdinal: 11,
    }));
    expect(outcome.transaction.plan.operation).toBe(
      `arc0.world-name:${sha256Hex(address.key)}`,
    );
    expect(operationForArc0WorldName(address)).toBe(outcome.transaction.plan.operation);
    expect(outcome.transaction.receipt).toMatchObject({
      ordinal: 11,
      kind: ARC0_WORLD_NAME_RECEIPT_KIND,
      witness: outcome.witness.encoded,
    });
    expect(outcome.transaction.state.customNames).toEqual([
      ['c7', 'Keep Creature'], ['other', 'Keep Other'], ['p134', 'New Gaia'],
    ]);
    expect(outcome.transaction.state.unlocked).toEqual(['namer']);
    const untouched = structuredClone(outcome.transaction.state);
    untouched.customNames = beforeState.customNames;
    untouched.unlocked = beforeState.unlocked;
    expect(untouched).toEqual(beforeState);
    expect(fixture.state).toEqual(state);
    expect(fixture.receiptCas()).toBe(1);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0002,
      ordinal: 12,
      draws: { 'prior.random': 3 },
    });
    expect(worldIdentityName(outcome.verification.worldIdentity.state, address)).toBe('New Gaia');
    expect(worldIdentityName(outcome.verification.worldIdentity.state, unrelated)).toBe('Keep World');

    const persisted = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(persisted.kind).toBe('loaded');
    if (persisted.kind === 'loaded') {
      expect(persisted.state).toEqual(outcome.transaction.state);
      const identity = readWorldIdentity(persisted.extensions);
      expect(identity.kind).toBe('loaded');
      if (identity.kind === 'loaded') {
        expect(worldIdentityName(identity.state, address)).toBe('New Gaia');
        expect(worldIdentityName(identity.state, unrelated)).toBe('Keep World');
      }
      expect(readF4Authority(persisted.extensions)).toMatchObject({
        kind: 'loaded',
        authority: { sessionRng: { ordinal: 12, draws: { 'prior.random': 3 } } },
      });
    }
  });

  it('renames once and treats an already-durable same name as an idempotent receipt action', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const first = await commitArc0WorldNameAction(actionInput(fixture, address, 'Aurora'));
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    const renamed = await commitArc0WorldNameAction({
      ...actionInput(fixture, address, 'Zenith'), state: first.transaction.state,
    });
    expect(renamed.kind).toBe('committed');
    if (renamed.kind !== 'committed') return;
    expect(renamed.witness.facts).toMatchObject({
      canonicalNameBefore: 'Aurora',
      name: 'Zenith',
      canonicalChanged: true,
      legacyNameBefore: 'Aurora',
      legacyMirrorChanged: true,
      achievement: { alreadyUnlocked: true, added: false, unlockedCountAfter: 1 },
      receiptOrdinal: 12,
    });
    const fixedPointState = structuredClone(renamed.transaction.state);
    const fixedPointIdentity = renamed.verification.worldIdentity.state;
    const idempotent = await commitArc0WorldNameAction({
      ...actionInput(fixture, address, 'Zenith'), state: renamed.transaction.state,
    });
    expect(idempotent.kind).toBe('committed');
    if (idempotent.kind !== 'committed') return;
    expect(idempotent.witness.facts).toMatchObject({
      canonicalNameBefore: 'Zenith',
      canonicalChanged: false,
      legacyNameBefore: 'Zenith',
      legacyMirrorChanged: false,
      achievement: { alreadyUnlocked: true, added: false, unlockedCountAfter: 1 },
      receiptOrdinal: 13,
    });
    expect(idempotent.transaction.state).toEqual(fixedPointState);
    expect(idempotent.verification.worldIdentity.state).toEqual(fixedPointIdentity);
    expect(idempotent.transaction.state.customNames.filter(([key]) => key === 'p134'))
      .toEqual([['p134', 'Zenith']]);
    expect(fixture.receiptCas()).toBe(3);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0002, ordinal: 14, draws: { 'prior.random': 3 },
    });
  });

  it('isolates same-seed worlds canonically while the lossy legacy mirror follows the latest name', async () => {
    const earth = solWorld(133);
    const foreign = foreign133();
    expect(foreign.planet.seed).toBe(earth.planet.seed);
    expect(foreign.key).not.toBe(earth.key);
    const fixture = await runtimeFixture();
    const first = await commitArc0WorldNameAction(actionInput(fixture, earth, 'Home Earth'));
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    const second = await commitArc0WorldNameAction({
      ...actionInput(fixture, foreign, 'Far Earth'), state: first.transaction.state,
    });
    expect(second.kind).toBe('committed');
    if (second.kind !== 'committed') return;
    expect(worldIdentityName(second.verification.worldIdentity.state, earth)).toBe('Home Earth');
    expect(worldIdentityName(second.verification.worldIdentity.state, foreign)).toBe('Far Earth');
    expect(second.transaction.state.customNames.filter(([key]) => key === 'p133'))
      .toEqual([['p133', 'Far Earth']]);

    const third = await commitArc0WorldNameAction({
      ...actionInput(fixture, earth, 'Blue Earth'), state: second.transaction.state,
    });
    expect(third.kind).toBe('committed');
    if (third.kind !== 'committed') return;
    expect(worldIdentityName(third.verification.worldIdentity.state, earth)).toBe('Blue Earth');
    expect(worldIdentityName(third.verification.worldIdentity.state, foreign)).toBe('Far Earth');
    expect(third.transaction.state.customNames.filter(([key]) => key === 'p133'))
      .toEqual([['p133', 'Blue Earth']]);
  });

  it('claims one unresolved v4 name into the exact source-proven world while renaming it', async () => {
    const address = solWorld(134);
    const prepared = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: { landed: [], customNames: [['p134', 'Legacy Name']] },
      addresses: [],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    const state = baseState();
    state.customNames = [['p134', 'Legacy Name']];
    const fixture = await runtimeFixture({ state, identity: prepared.state });
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address, 'Exact Name'));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      canonicalNameBefore: null,
      claimedLegacyIdentity: true,
      legacyNameBefore: 'Legacy Name',
      name: 'Exact Name',
    });
    expect(outcome.verification.worldIdentity.state.unresolved).toEqual([]);
    expect(worldIdentityName(outcome.verification.worldIdentity.state, address)).toBe('Exact Name');
  });

  it.each([
    ['absent', 'world-identity:absent'],
    ['corrupt', 'world-identity:corrupt'],
    ['future', 'world-identity:future-version'],
    ['capacity', 'world-identity:capacity'],
  ] as const)('refuses %s identity authority without a receipt or partial mirror', async (
    identityMode,
    detail,
  ) => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ identityMode });
    const before = JSON.stringify(fixture.state);
    const beforeSession = structuredClone(fixture.runtime.sessionRng);
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', detail,
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
    expect(fixture.runtime.sessionRng).toEqual(beforeSession);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
  });

  it('renames an existing row at the 5,000-row legacy boundary but refuses a new row', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.customNames = Array.from({ length: 4_999 }, (_, index): [string, string] => (
      [`c${index}`, `N${index}`]
    ));
    state.customNames.push(['p134', 'Old']);
    const fixture = await runtimeFixture({ state });
    const renamed = await commitArc0WorldNameAction(actionInput(fixture, address, 'New'));
    expect(renamed.kind).toBe('committed');
    if (renamed.kind !== 'committed') return;
    expect(renamed.transaction.state.customNames).toHaveLength(5_000);
    expect(renamed.transaction.state.customNames.at(-1)).toEqual(['p134', 'New']);

    const other = solWorld(135);
    const fullFixture = await runtimeFixture({ state: baseState() });
    fullFixture.state.customNames = Array.from({ length: 5_000 }, (_, index): [string, string] => (
      [`c${index}`, `N${index}`]
    ));
    const refused = await commitArc0WorldNameAction(actionInput(fullFixture, other, 'No Room'));
    expect(refused).toMatchObject({
      kind: 'refused',
      detail: 'legacy-custom-names:capacity',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fullFixture.receiptCas()).toBe(0);
    expect(fullFixture.runtime.sessionRng.ordinal).toBe(11);
  });

  it('protects the achievement bound atomically while allowing an already-unlocked namer at capacity', async () => {
    const address = solWorld(134);
    const full = baseState();
    full.unlocked = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat:${index}`,
    );
    const protectedFixture = await runtimeFixture({ state: full });
    const protectedOutcome = await commitArc0WorldNameAction(
      actionInput(protectedFixture, address, 'No Partial Name'),
    );
    expect(protectedOutcome).toMatchObject({
      kind: 'refused',
      detail: 'achievement:achievement-capacity',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(protectedFixture.receiptCas()).toBe(0);
    expect(protectedFixture.state.customNames).toEqual([]);
    expect(protectedFixture.state.unlocked).toEqual(full.unlocked);

    const alreadyUnlocked = baseState();
    alreadyUnlocked.unlocked = [
      'namer',
      ...Array.from(
        { length: MAX_UNLOCKED_ACHIEVEMENT_IDS - 1 },
        (_, index) => `compat:${index}`,
      ),
    ];
    alreadyUnlocked.stats.bestRank = 4;
    const currentFixture = await runtimeFixture({ state: alreadyUnlocked });
    const committed = await commitArc0WorldNameAction(
      actionInput(currentFixture, address, 'Allowed Name'),
    );
    expect(committed.kind).toBe('committed');
    if (committed.kind !== 'committed') return;
    expect(committed.witness.facts.achievement).toEqual({
      id: 'namer',
      owner: 'naming:first-discovery-name',
      alreadyUnlocked: true,
      added: false,
      priorUnlockedCount: MAX_UNLOCKED_ACHIEVEMENT_IDS,
      unlockedCountAfter: MAX_UNLOCKED_ACHIEVEMENT_IDS,
    });
    expect(committed.transaction.state.unlocked).toEqual(alreadyUnlocked.unlocked);
  });

  it.each([
    ['duplicate key collision', [['p134', 'One'], ['p134', 'Two']],
      'legacy-custom-names:collision'],
    ['malformed row', [['p134', 'One', 'extra']], 'legacy-custom-names:invalid'],
    ['noncanonical saved name', [['p134', '  padded  ']], 'legacy-custom-names:invalid'],
  ] as const)('refuses %s without a receipt', async (_label, rows, detail) => {
    const state = baseState();
    state.customNames = rows as unknown as Array<[string, string]>;
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, solWorld(134)));
    expect(outcome).toMatchObject({
      kind: 'refused', detail, transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.revision()).toBe(1);
  });

  it('rejects mismatched surface/address and structural address copies before invoking F4', async () => {
    const address = solWorld(134);
    const other = solWorld(135);
    let calls = 0;
    const runtime = {
      async commitAction() {
        calls++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    const mismatched = await commitArc0WorldNameAction({
      runtime, state: baseState(), surface: surface(other), address, name: 'Aurora', codecNow: NOW,
    });
    expect(mismatched).toEqual({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
    const copied = await commitArc0WorldNameAction({
      runtime,
      state: baseState(),
      surface: surface(address),
      address: structuredClone(address) as CanonicalCF1WorldAddress,
      name: 'Aurora',
      codecNow: NOW,
    });
    expect(copied).toMatchObject({ kind: 'refused', detail: 'input:invalid-or-unregistered' });
    expect(calls).toBe(0);
    expect(() => operationForArc0WorldName(structuredClone(address) as CanonicalCF1WorldAddress))
      .toThrow('registered canonical world address');
  });

  it.each(['empty', 'cyclic', 'proxy', 'state-accessor', 'input-accessor'] as const)(
    'fails closed on %s input without invoking F4',
    async (mode) => {
      const address = solWorld(134);
      let calls = 0;
      const runtime = {
        async commitAction() {
          calls++;
          return { kind: 'lease-unavailable' as const };
        },
      };
      let state = baseState() as SaveStateV2 & Record<string, unknown>;
      const input: Arc0WorldNameActionInput = {
        runtime, state, surface: surface(address), address, name: 'Aurora', codecNow: NOW,
      };
      if (mode === 'empty') Object.assign(input as unknown as { name: string }, { name: '<>&"\'' });
      if (mode === 'cyclic') state.self = state;
      if (mode === 'proxy') {
        state = new Proxy(state, {
          getPrototypeOf() { throw new Error('proxy trap'); },
        });
        Object.assign(input as unknown as { state: SaveStateV2 }, { state });
      }
      if (mode === 'state-accessor') {
        Object.defineProperty(state, 'trap', { enumerable: true, get: () => 'no' });
      }
      if (mode === 'input-accessor') {
        Object.defineProperty(input, 'name', { enumerable: true, get: () => 'Aurora' });
      }
      const outcome = await commitArc0WorldNameAction(input);
      expect(outcome).toEqual({
        kind: 'refused', durability: 'none', convergence: 'none',
        detail: 'input:invalid-or-unregistered', transaction: null,
      });
      expect(calls).toBe(0);
    },
  );

  it('captures detached state and canonical name before queued work can observe caller mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const input = actionInput(fixture, address, '  First  ');
    const pending = commitArc0WorldNameAction(input);
    fixture.state.explorerName = 'mutated caller';
    fixture.state.customNames.push(['p134', 'mutated caller']);
    Object.assign(input as unknown as Record<string, unknown>, {
      address: solWorld(135),
      name: 'Second',
      codecNow: -1,
    });
    const outcome = await pending;

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({ worldKey: address.key, name: 'First' });
    expect(outcome.transaction.state.explorerName).not.toBe('mutated caller');
    expect(outcome.transaction.state.customNames).toEqual([['p134', 'First']]);
    expect(fixture.state.explorerName).toBe('mutated caller');
  });

  it('fails one stale race without retry, receipt, RNG advance, or caller publication', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const before = JSON.stringify(fixture.state);
    await fixture.repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'arc0-world-name-race', value: 'other-tab' }],
    });
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 1, actualRevision: 2 },
    });
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0002, ordinal: 11, draws: { 'prior.random': 3 },
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
  });

  it('fails one storage attempt without retry, receipt, revision, or publication', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ storageFailure: true });
    const before = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 0 world-name storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.runtime.sessionRng.ordinal).toBe(11);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(before));
  });

  it('maps revision exhaustion to read-only convergence without fabricating durability', async () => {
    const address = solWorld(134);
    let calls = 0;
    const outcome = await commitArc0WorldNameAction({
      runtime: {
        async commitAction() {
          calls++;
          return { kind: 'revision-exhausted', revision: F3_MAX_REVISION } as never;
        },
      },
      state: baseState(),
      surface: surface(address),
      address,
      name: 'Aurora',
      codecNow: NOW,
    });
    expect(outcome).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:revision-exhausted',
      transaction: { kind: 'revision-exhausted', revision: F3_MAX_REVISION },
    });
    expect(calls).toBe(1);
  });

  it('returns explicit committed convergence when a runtime reports commit without action evidence', async () => {
    const address = solWorld(134);
    const transaction = { kind: 'committed', revision: 2 } as never;
    const outcome = await commitArc0WorldNameAction({
      runtime: { async commitAction() { return transaction; } },
      state: baseState(),
      surface: surface(address),
      address,
      name: 'Aurora',
      codecNow: NOW,
    });
    expect(outcome).toEqual({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-world-name-evidence-missing',
      transaction,
    });
  });

  it('seals the complete state and identity successors and rejects copied witnesses', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;

    const alteredState = structuredClone(outcome.transaction.state);
    alteredState.explorerName = 'altered outside the naming projection';
    const coherentlyAltered = {
      ...outcome.transaction,
      state: alteredState,
      saved: { ...outcome.transaction.saved, canonicalState: structuredClone(alteredState) },
    };
    expect(verifyArc0WorldNamePostcommit({
      transaction: coherentlyAltered as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'state-successor-mismatch' });

    const loaded = readWorldIdentity(outcome.transaction.saved.extensions);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    const other = solWorld(135);
    const changed = setCanonicalWorldName(
      loaded.state, other, 'Injected', outcome.transaction.saved.extensions,
    );
    expect(changed.capacityProtected).toBe(false);
    const alteredExtensions = applyV5ExtensionWrites(
      outcome.transaction.saved.extensions,
      encodeWorldIdentityExtensionWrites(changed.state),
    ).extensions;
    expect(verifyArc0WorldNamePostcommit({
      transaction: {
        ...outcome.transaction,
        saved: { ...outcome.transaction.saved, extensions: alteredExtensions },
      } as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'world-identity-mismatch' });

    expect(verifyArc0WorldNamePostcommit({
      transaction: outcome.transaction,
      address,
      witness: structuredClone(outcome.witness),
    })).toEqual({ kind: 'mismatch', detail: 'witness-unregistered' });
  });

  it('names a legal near-limit veteran save whose expanded state exceeds one MiB', async () => {
    const address = solWorld(134);
    const state = nearCapacityVeteranState();
    expect(JSON.stringify(state).length).toBeGreaterThan(PORTABLE_V5_MAX_LEGACY_BYTES);
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0WorldNameAction(actionInput(fixture, address, 'Veteran'));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state.codex).toHaveLength(1_500);
    expect(outcome.verification.kind).toBe('verified');
  });
});
