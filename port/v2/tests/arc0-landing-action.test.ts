import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { sha256Hex } from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { DESCENT_OUTCOME_DOMAINS_V1 } from '../apps/game/src/descent-policy.js';
import {
  descentWaveOffCountV1,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import {
  MAX_GEAR_CAPACITY,
  createGearInstance,
  getFixedCraftGenerationPlan,
  makeGearSourceActionId,
} from '@cf/domain-loot';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  PORTABLE_V5_MAX_LEGACY_BYTES,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  WORLD_IDENTITY_MANIFEST_NAMESPACE,
  WORLD_IDENTITY_SHARD_PREFIX,
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc2LootCarrier,
  encodeWorldIdentityExtensionWrites,
  exportSaveV2,
  hasCanonicalWorldLanded,
  importSaveV2,
  initializeFreshV5,
  prepareArc2LootLegacyMigration,
  prepareArc2LootInventoryWrite,
  prepareF4AuthorityUpdate,
  prepareWorldIdentityBootstrap,
  recordCanonicalWorldLanding,
  projectArc2LootLegacyMirror,
  readArc2Loot,
  readDescentWaveOffCarrierV1,
  readF4Authority,
  readSaveV5,
  readWorldIdentity,
  type CanonicalWorldIdentityStateV1,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  navToView,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
  type SurfaceNav,
} from '@cf/scene';
import {
  ARC0_LANDING_RECEIPT_KIND,
  commitArc0LandingAction,
  operationForArc0Landing,
  verifyArc0LandingPostcommit,
  type Arc0LandingActionInput,
} from '../apps/game/src/arc0-landing-action.js';
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
  if (!resolved.ok) throw new Error(`landing world fixture failed: ${resolved.reason}`);
  return resolved.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') {
    throw new Error('landing surface fixture failed');
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
  if (!imported.ok) throw new Error(`landing base save failed: ${imported.reason}`);
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
    throw new Error('near-cap veteran fixture exceeded the supported compact projection');
  }
  const imported = importSaveV2(raw, REGISTRY, NOW);
  if (!imported.ok) throw new Error(`near-cap veteran import failed: ${imported.reason}`);
  if (imported.state.codex.length !== 1_500) {
    throw new Error(`near-cap veteran lost Compendium rows: ${imported.state.codex.length}`);
  }
  if (JSON.stringify(imported.state).length <= PORTABLE_V5_MAX_LEGACY_BYTES) {
    throw new Error('near-cap veteran fixture did not exercise expanded-state overhead');
  }
  if (jsonBytes(exportSaveV2(imported.state, NOW)) > PORTABLE_V5_MAX_LEGACY_BYTES) {
    throw new Error('near-cap veteran no longer fits the supported compact projection');
  }
  return imported.state;
}

function jsonBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function exactJsonBytes(size: number): string {
  if (!Number.isSafeInteger(size) || size < 8 || size > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new RangeError(`invalid filler size ${size}`);
  }
  const json = `{"p":"${'x'.repeat(size - 8)}"}`;
  if (jsonBytes(json) !== size) throw new Error('landing filler missed its exact size');
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
    if (size < 8) throw new Error('landing filler left an unrepresentable tail');
    writes.push({
      segment: 'inventory' as const,
      namespace: `arc0.capacity.${index++}`,
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
  readonly sessionSeed?: number;
}

async function runtimeFixture(options: FixtureOptions = {}) {
  const state = options.state ?? baseState();
  const session = createSessionRNG(
    options.sessionSeed ?? 0xA0A0_0001,
    { 'prior.random': 2 },
    7,
  ).state();
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: state,
    capacity: MAX_GEAR_CAPACITY,
  });
  if (loot.kind !== 'prepared') throw new Error(`landing Arc 2 fixture was ${loot.kind}`);
  const f4 = prepareF4AuthorityUpdate(loot.extensions, { activePlayMs: 0 }, session);
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
    throw new Error(`landing v5 fixture failed: ${initialized.kind}`);
  }
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.storageFailure === true) throw new Error('forced Arc 0 landing storage failure');
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
    ownerId: 'arc0-landing-tab',
    token: 'arc0-landing-document',
    leaseTtlMs: 10_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`landing lease failed: ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state,
    receiptCas: () => receiptCas,
  };
}

function actionInput(
  fixture: Awaited<ReturnType<typeof runtimeFixture>>,
  address: CanonicalCF1WorldAddress,
  training = false,
): Arc0LandingActionInput {
  return {
    runtime: fixture.runtime,
    state: fixture.state,
    surface: surface(address),
    address,
    opportunity: projectWorldOpportunity(address),
    training,
    codecNow: NOW,
  };
}

describe('Arc 0 durable landing action', () => {
  it('seals the codec-canonical successor when an unrelated veteran mining stamp moves', async () => {
    const state = baseState();
    state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
    state.mineX = [['veteran-clock-floor', 1]];
    const fixture = await runtimeFixture({ state });
    const before = JSON.stringify(fixture.state);
    const address = solWorld(134);
    const outcome = await commitArc0LandingAction({
      ...actionInput(fixture, address),
      codecNow: NOW + 1,
    });

    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.transaction.state.mined).get('veteran-clock-floor'))
      .toBe(NOW + 1 - 30 * 6e5);
    expect(verifyArc0LandingPostcommit({
      transaction: outcome.transaction,
      address,
      witness: outcome.witness,
    })).toMatchObject({ kind: 'verified' });
    await fixture.runtime.release();
  });

  it('commits one first landing, sample payout, Charter delta, route, identity, and fixed descent receipt', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const beforeState = structuredClone(fixture.state);
    const before = JSON.stringify(fixture.state);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      worldKey: address.key,
      landing: 'first',
      permanentLanding: true,
      sample: { kind: 'reward' },
      charter: { banked: true, ascChBefore: 0, ascChAfter: 0 },
      receiptOrdinal: 7,
    });
    expect(outcome.transaction).toMatchObject({
      revision: 2,
      plan: {
        receiptOrdinal: 7,
        draws: [
          { domain: 'descent.success' },
          { domain: 'descent.damage' },
        ],
      },
      receipt: { ordinal: 7, kind: ARC0_LANDING_RECEIPT_KIND },
    });
    expect(operationForArc0Landing(address)).toBe(`arc0.land:${sha256Hex(address.key)}`);
    expect(outcome.transaction.receipt.witness).toBe(outcome.witness.encoded);
    expect(outcome.arc2LootState?.kind).toBe('inventory');
    expect(outcome.transaction.state.savedView).toEqual(navToView(surface(address)));
    expect(outcome.transaction.state.landed).toContain(address.planet.seed);
    expect(outcome.transaction.state.stats.landings).toBe(1);
    expect(outcome.transaction.state.stats.essenceEarned).toBe(
      outcome.witness.facts.sample?.kind === 'reward'
        ? outcome.witness.facts.sample.stardust : -1,
    );
    expect(outcome.transaction.state.ascProg['c1-land']).toBe(1);
    const untouched = structuredClone(outcome.transaction.state);
    untouched.savedView = beforeState.savedView;
    untouched.landed = beforeState.landed;
    untouched.ascCh = beforeState.ascCh;
    untouched.ascProg = beforeState.ascProg;
    untouched.cargo = beforeState.cargo;
    untouched.essence = beforeState.essence;
    untouched.stats = beforeState.stats;
    expect(untouched).toEqual(beforeState);
    expect(JSON.stringify(fixture.state)).toBe(before);
    expect(fixture.receiptCas()).toBe(1);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0001,
      ordinal: 8,
      draws: { 'prior.random': 2, 'descent.success': 1, 'descent.damage': 1 },
    });
    expect(outcome.verification.worldIdentity.kind).toBe('loaded');
    if (outcome.verification.worldIdentity.kind === 'loaded') {
      expect(hasCanonicalWorldLanded(outcome.verification.worldIdentity.state, address)).toBe(true);
    }

    const persisted = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(persisted.kind).toBe('loaded');
    if (persisted.kind === 'loaded') {
      expect(persisted.state).toEqual(outcome.transaction.state);
      expect(readWorldIdentity(persisted.extensions).kind).toBe('loaded');
      expect(readF4Authority(persisted.extensions)).toMatchObject({
        kind: 'loaded',
        authority: {
          sessionRng: {
            ordinal: 8,
            draws: { 'prior.random': 2, 'descent.success': 1, 'descent.damage': 1 },
          },
        },
      });
    }
    expect(verifyArc0LandingPostcommit({
      transaction: outcome.transaction,
      address,
      witness: outcome.witness,
    }).kind).toBe('verified');
  });

  it('settles an accepted starter landfall Charter in the same landing receipt and save', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.chacc = ['st-land'];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const sampleStardust = outcome.witness.facts.sample?.kind === 'reward'
      ? outcome.witness.facts.sample.stardust : 0;
    expect(outcome.witness.facts.starterCharters).toMatchObject({
      changed: true,
      progressIds: ['st-land'],
      completions: [{
        id: 'st-land',
        title: 'Make planetfall',
        stardust: 10,
        gearId: null,
        alreadyProven: false,
      }],
    });
    expect(outcome.transaction.state.chacc).toEqual([]);
    expect(outcome.transaction.state.chDone).toEqual(['st-land']);
    expect(outcome.transaction.state.chProg['st-land']).toBe(1);
    expect(outcome.transaction.state.essence).toBe(sampleStardust + 10);
    expect(outcome.transaction.state.stats.essenceEarned).toBe(sampleStardust + 10);
    expect(outcome.transaction.state.stats.charters).toBe(1);
    expect(outcome.transaction.receipt.kind).toBe(ARC0_LANDING_RECEIPT_KIND);
    expect(fixture.receiptCas()).toBe(1);

    const persisted = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(persisted.kind).toBe('loaded');
    if (persisted.kind === 'loaded') {
      expect(persisted.state.chDone).toEqual(['st-land']);
      expect(persisted.state.stats.charters).toBe(1);
    }
  });

  it('binds an exact Arc 2 starter-gear successor, not only its legacy mirror', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.chacc = ['st-mars'];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.starterCharters.completions).toMatchObject([{
      id: 'st-mars', gearId: 'magboots', alreadyProven: false,
    }]);
    expect(outcome.arc2LootState?.kind).toBe('inventory');
    const durable = readArc2Loot(outcome.transaction.saved.extensions);
    expect(durable.kind).toBe('loaded');
    if (durable.kind !== 'loaded' || durable.state.kind !== 'inventory'
      || outcome.arc2LootState === null) return;
    expect(encodeArc2LootCarrier(durable.state))
      .toEqual(encodeArc2LootCarrier(outcome.arc2LootState));
    expect(projectArc2LootLegacyMirror(durable.state)).toEqual({
      items: outcome.transaction.state.items,
      equip: outcome.transaction.state.equip,
      equipAff: outcome.transaction.state.equipAff,
    });
  });

  it('rejects a same-mirror Arc 2 postcommit substitution with wrong provenance', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.chacc = ['st-mars'];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = readArc2Loot(outcome.transaction.saved.extensions);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return;
    const original = loaded.state.inventory.entries[0]?.instance;
    if (!original) throw new Error('expected Landing starter gear');
    const replacement = createGearInstance(makeGearSourceActionId({
      kind: 'expedition',
      ownerId: 'arc0-landing-postcommit-substitution',
      actionKey: 'wrong-magboots',
      receiptId: 'fixture',
    }), 0, getFixedCraftGenerationPlan('magboots', original.generation.seed));
    const inventory = Object.freeze({
      ...loaded.state.inventory,
      entries: loaded.state.inventory.entries.map((entry) => Object.freeze({
        ...entry,
        instance: entry.instance.instanceId === original.instanceId
          ? replacement : entry.instance,
      })),
      equipped: loaded.state.inventory.equipped.map((binding) => Object.freeze({
        ...binding,
        instanceId: binding.instanceId === original.instanceId
          ? replacement.instanceId : binding.instanceId,
      })),
    });
    const altered = prepareArc2LootInventoryWrite({
      extensions: outcome.transaction.saved.extensions,
      inventory,
      stackableCounts: loaded.state.stackableCounts,
    });
    expect(altered.kind).toBe('prepared');
    if (altered.kind !== 'prepared') return;
    expect(projectArc2LootLegacyMirror(altered.state)).toEqual({
      items: outcome.transaction.state.items,
      equip: outcome.transaction.state.equip,
      equipAff: outcome.transaction.state.equipAff,
    });
    expect(verifyArc0LandingPostcommit({
      transaction: Object.freeze({
        ...outcome.transaction,
        saved: Object.freeze({
          ...outcome.transaction.saved,
          extensions: altered.extensions,
        }),
      }),
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'arc2-loot-state-mismatch' });
  });

  it('rejects an exact Arc 2 carrier substitution on a successful no-gear landing', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.starterCharters.completions).toEqual([]);
    const loaded = readArc2Loot(outcome.transaction.saved.extensions);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return;
    const altered = prepareArc2LootInventoryWrite({
      extensions: outcome.transaction.saved.extensions,
      inventory: Object.freeze({
        ...loaded.state.inventory,
        revision: loaded.state.inventory.revision + 1,
      }),
      stackableCounts: loaded.state.stackableCounts,
    });
    expect(altered.kind).toBe('prepared');
    if (altered.kind !== 'prepared') return;
    expect(projectArc2LootLegacyMirror(altered.state)).toEqual({
      items: outcome.transaction.state.items,
      equip: outcome.transaction.state.equip,
      equipAff: outcome.transaction.state.equipAff,
    });
    expect(verifyArc0LandingPostcommit({
      transaction: Object.freeze({
        ...outcome.transaction,
        saved: Object.freeze({
          ...outcome.transaction.saved,
          extensions: altered.extensions,
        }),
      }),
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'arc2-loot-state-mismatch' });
  });

  it('refuses a divergent parent Arc 2 mirror before draws, gear staging, or receipt durability', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.chacc = ['st-mars'];
    const fixture = await runtimeFixture({ state });
    fixture.state.items = [['headlamp', 1]];
    const beforeSession = structuredClone(fixture.runtime.sessionRng);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      detail: 'engineering:legacy-mirror-divergent',
      transaction: { kind: 'pre-draw-refused' },
    });
    expect(fixture.runtime.sessionRng).toEqual(beforeSession);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
  });

  it('refuses a divergent parent Arc 2 mirror on a no-gear landing before any draw', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    fixture.state.items = [['headlamp', 1]];
    const beforeSession = structuredClone(fixture.runtime.sessionRng);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      detail: 'engineering:legacy-mirror-divergent',
      transaction: { kind: 'pre-draw-refused' },
    });
    expect(fixture.runtime.sessionRng).toEqual(beforeSession);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.receiptCas()).toBe(0);
  });

  it('commits a repeat without a second sample, landing stat, or Charter bank', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const first = await commitArc0LandingAction(actionInput(fixture, address));
    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    const firstState = first.transaction.state;
    const second = await commitArc0LandingAction({
      ...actionInput(fixture, address),
      state: firstState,
    });

    expect(second.kind).toBe('committed');
    if (second.kind !== 'committed') return;
    expect(second.witness.facts).toMatchObject({
      landing: 'repeat',
      permanentLanding: true,
      sample: { kind: 'suppressed', reason: 'repeat' },
      charter: { banked: false },
      receiptOrdinal: 8,
    });
    expect(second.transaction.state.essence).toBe(firstState.essence);
    expect(second.transaction.state.cargo).toEqual(firstState.cargo);
    expect(second.transaction.state.stats.essenceEarned).toBe(firstState.stats.essenceEarned);
    expect(second.transaction.state.stats.landings).toBe(firstState.stats.landings);
    expect(second.transaction.state.ascProg['c1-land']).toBe(1);
    expect(fixture.receiptCas()).toBe(2);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0001,
      ordinal: 9,
      draws: { 'prior.random': 2, 'descent.success': 1, 'descent.damage': 1 },
    });
  });

  it('atomically waves off in orbit, learns +20 for the exact world, and never publishes landing fields', async () => {
    const address = solWorld(132);
    const state = baseState();
    state.hp = 10;
    const fixture = await runtimeFixture({ state, sessionSeed: 19_245 });
    const before = structuredClone(fixture.state);
    const first = await commitArc0LandingAction(actionInput(fixture, address));

    expect(first.kind).toBe('committed');
    if (first.kind !== 'committed') return;
    expect(first.witness.facts).toMatchObject({
      permanentLanding: false,
      sample: null,
      achievement: null,
      starterCharters: { changed: false, progressIds: [], completions: [] },
      descent: {
        kind: 'wave-off', navigation: 'orbit', drawsConsumed: 2,
        waveOffCountBefore: 0, waveOffCountAfter: 1,
      },
    });
    expect(first.transaction.plan).toMatchObject({
      draws: DESCENT_OUTCOME_DOMAINS_V1.map((domain) => ({ domain })),
    });
    expect(first.transaction.state.hp).toBeGreaterThanOrEqual(1);
    expect(first.transaction.state.hp).toBeLessThan(before.hp);
    expect(first.transaction.state.savedView).toEqual(before.savedView);
    expect(first.transaction.state.landed).toEqual(before.landed);
    expect(first.transaction.state.ascProg).toEqual(before.ascProg);
    expect(first.transaction.state.cargo).toEqual(before.cargo);
    expect(first.transaction.state.essence).toBe(before.essence);
    expect(first.transaction.state.unlocked).toEqual(before.unlocked);
    expect(first.transaction.state.chDone).toEqual(before.chDone);
    expect(first.worldIdentityWrites).toEqual([]);
    expect(first.arc2LootState).toBeNull();
    const firstWaveOff = readDescentWaveOffCarrierV1(first.transaction.saved.extensions);
    expect(firstWaveOff.kind).toBe('loaded');
    if (firstWaveOff.kind === 'loaded') {
      expect(descentWaveOffCountV1(firstWaveOff.state, address)).toBe(1);
    }
    expect(first.transaction.state.waveOffs).toEqual([[address.planet.seed, 1]]);
    expect(fixture.receiptCas()).toBe(1);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 19_245,
      ordinal: 8,
      draws: { 'prior.random': 2, 'descent.success': 1, 'descent.damage': 1 },
    });

    const second = await commitArc0LandingAction({
      ...actionInput(fixture, address),
      state: first.transaction.state,
    });
    expect(second.kind).toBe('committed');
    if (second.kind !== 'committed') return;
    expect(second.witness.facts.descent).toMatchObject({
      kind: 'wave-off', waveOffCountBefore: 1, waveOffCountAfter: 2,
      policy: {
        waveOffCount: 1,
        learnedApproachBonus: 20,
        successPercent: Math.min(100, first.witness.facts.descent.policy.successPercent + 20),
      },
    });
    expect(second.transaction.state.waveOffs).toEqual([[address.planet.seed, 2]]);
    expect(fixture.runtime.sessionRng.draws).toMatchObject({
      'descent.success': 2, 'descent.damage': 2,
    });
  });

  it('keeps a failed descent nonlethal when the explorer is already at one HP', async () => {
    const address = solWorld(132);
    const state = baseState();
    state.hp = 1;
    const fixture = await runtimeFixture({ state, sessionSeed: 19_245 });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.descent).toMatchObject({
      kind: 'wave-off', navigation: 'orbit', hpBefore: 1, hpAfter: 1, damage: 0,
    });
    expect(outcome.transaction.state.hp).toBe(1);
  });

  it('claims an unresolved already-landed mirror without rewarding or banking it again', async () => {
    const address = solWorld(134);
    const prepared = prepareWorldIdentityBootstrap({
      extensions: {},
      legacy: { landed: [address.planet.seed], customNames: [] },
      addresses: [],
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    const state = baseState();
    state.landed = [address.planet.seed];
    const fixture = await runtimeFixture({ state, identity: prepared.state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      landing: 'unresolved-already-landed',
      landingKnownBefore: true,
      claimedLegacyIdentity: true,
      sample: { kind: 'suppressed', reason: 'unresolved-already-landed' },
      charter: { banked: false, delta: {} },
    });
    expect(outcome.transaction.state.stats.landings).toBe(0);
    expect(outcome.transaction.state.ascProg['c1-land']).toBeUndefined();
    if (outcome.verification.worldIdentity.kind === 'loaded') {
      expect(hasCanonicalWorldLanded(outcome.verification.worldIdentity.state, address)).toBe(true);
      expect(outcome.verification.worldIdentity.state.unresolved).toEqual([]);
    }
  });

  it('keeps canonical Earth sample-free while banking its first home landfall and reconciliation', async () => {
    const address = solWorld(133);
    const state = baseState();
    state.items = [['jumpdrive', 1]];
    state.ascProg = {
      'c1-land': 1,
      'c1-mine': 8,
      'c1-part': 4,
      'c1-comp': 2,
      'c1-jump': 1,
    };
    state.waveOffs = [[address.planet.seed, 2]];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      worldKey: address.key,
      landing: 'first',
      permanentLanding: true,
      sample: { kind: 'suppressed', reason: 'canonical-earth' },
      charter: {
        banked: true,
        ascChBefore: 0,
        ascChAfter: 1,
        stage: 1,
        delta: { 'c1-land': 1 },
      },
      achievement: {
        id: 'home',
        owner: 'landing:earth',
        alreadyUnlocked: false,
        added: true,
        priorUnlockedCount: 0,
        unlockedCountAfter: 1,
      },
    });
    expect(outcome.transaction.state.essence).toBe(0);
    expect(outcome.transaction.state.cargo).toEqual([]);
    expect(outcome.transaction.state.stats.landings).toBe(0);
    expect(outcome.transaction.state.ascCh).toBe(1);
    expect(outcome.transaction.state.landed).toContain(133);
    expect(outcome.transaction.state.unlocked).toEqual(['home']);
    expect(outcome.witness.facts.descent).toMatchObject({
      kind: 'landed', drawsConsumed: 0, waveOffCountBefore: 2, waveOffCountAfter: 0,
    });
    expect(outcome.transaction.state.waveOffs).toEqual([]);
    expect(fixture.runtime.sessionRng.draws).toEqual({ 'prior.random': 2 });
    const persisted = await readSaveV5(fixture.backend, REGISTRY, NOW);
    expect(persisted.kind).toBe('loaded');
    if (persisted.kind === 'loaded') expect(persisted.state.unlocked).toEqual(['home']);
  });

  it('commits only the route for a non-Earth Training landing', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.cargo = [[projectWorldOpportunity(address).deposits[0]!, 1_000_000]];
    state.essence = 1_000_000_000;
    state.stats.essenceEarned = 1_000_000_000;
    state.stats.landings = 1_000_000_000;
    state.waveOffs = [[address.planet.seed, 2]];
    /* Route-only Training must not parse Charter state that it will not use.
       This JSON-equivalent null-prototype carrier is accepted by the save
       codec but deliberately rejected by checkedCharter. */
    state.ascProg = Object.create(null) as Record<string, number>;
    const fixture = await runtimeFixture({ state });
    const before = JSON.stringify(fixture.state);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address, true));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      landing: 'first',
      permanentLanding: false,
      training: true,
      identityLandedAfter: false,
      legacyMirrorContainsSeedAfter: null,
      sample: { kind: 'suppressed', reason: 'training' },
      charter: {
        banked: false,
        ascChBefore: null,
        ascChAfter: null,
        stage: null,
        progressSeal: null,
        delta: {},
      },
      achievement: null,
      descent: {
        kind: 'landed', drawsConsumed: 0, waveOffCountBefore: 2, waveOffCountAfter: 2,
      },
    });
    expect(outcome.worldIdentityWrites).toEqual([]);
    expect(outcome.transaction.state.savedView).toEqual(navToView(surface(address)));
    const routeOnly = structuredClone(outcome.transaction.state);
    routeOnly.savedView = fixture.state.savedView;
    expect(JSON.stringify(routeOnly)).toBe(before);
    expect(outcome.transaction.state.waveOffs).toEqual([[address.planet.seed, 2]]);
    expect(fixture.runtime.sessionRng.draws).toEqual({ 'prior.random': 2 });
    expect(outcome.verification.worldIdentity.kind).toBe('loaded');
    if (outcome.verification.worldIdentity.kind === 'loaded') {
      expect(hasCanonicalWorldLanded(outcome.verification.worldIdentity.state, address)).toBe(false);
    }
  });

  it('keeps canonical Earth route-only during Training and consumes no draw', async () => {
    const address = solWorld(133);
    const state = baseState();
    state.waveOffs = [[address.planet.seed, 2]];
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address, true));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      landing: 'first',
      permanentLanding: false,
      training: true,
      sample: { kind: 'suppressed', reason: 'canonical-earth' },
      charter: { banked: false },
      achievement: null,
      descent: {
        kind: 'landed', drawsConsumed: 0, waveOffCountBefore: 2, waveOffCountAfter: 2,
      },
    });
    expect(outcome.transaction.state.landed).not.toContain(133);
    expect(outcome.transaction.state.unlocked).toEqual([]);
    expect(outcome.transaction.state.stats.landings).toBe(0);
    expect(outcome.transaction.state.waveOffs).toEqual([[address.planet.seed, 2]]);
    expect(fixture.runtime.sessionRng).toEqual({
      seed: 0xA0A0_0001,
      ordinal: 8,
      draws: { 'prior.random': 2 },
    });
    if (outcome.verification.worldIdentity.kind === 'loaded') {
      expect(hasCanonicalWorldLanded(outcome.verification.worldIdentity.state, address)).toBe(false);
    }
  });

  it('rewards a registered foreign seed-133 collision as a non-Earth first landing', async () => {
    const address = foreign133();
    const fixture = await runtimeFixture();
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts).toMatchObject({
      planetSeed: 133,
      landing: 'first',
      permanentLanding: true,
      sample: { kind: 'reward' },
      charter: { banked: true },
      achievement: null,
    });
    expect(outcome.transaction.state.stats.landings).toBe(1);
    expect(outcome.transaction.state.essence).toBeGreaterThan(0);
    expect(outcome.transaction.state.unlocked).not.toContain('home');
  });

  it('protects the achievement bound atomically while allowing durable home at capacity', async () => {
    const address = solWorld(133);
    const full = baseState();
    full.unlocked = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat:${index}`,
    );
    const protectedFixture = await runtimeFixture({ state: full });
    const protectedOutcome = await commitArc0LandingAction(
      actionInput(protectedFixture, address),
    );
    expect(protectedOutcome).toMatchObject({
      kind: 'refused',
      detail: 'achievement:achievement-capacity',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(protectedFixture.receiptCas()).toBe(0);
    expect(protectedFixture.state.landed).not.toContain(133);
    expect(protectedFixture.state.unlocked).toEqual(full.unlocked);

    const alreadyUnlocked = baseState();
    alreadyUnlocked.unlocked = [
      'home',
      ...Array.from(
        { length: MAX_UNLOCKED_ACHIEVEMENT_IDS - 1 },
        (_, index) => `compat:${index}`,
      ),
    ];
    alreadyUnlocked.stats.bestRank = 4;
    const currentFixture = await runtimeFixture({ state: alreadyUnlocked });
    const committed = await commitArc0LandingAction(actionInput(currentFixture, address));
    expect(committed.kind).toBe('committed');
    if (committed.kind !== 'committed') return;
    expect(committed.witness.facts.achievement).toEqual({
      id: 'home',
      owner: 'landing:earth',
      alreadyUnlocked: true,
      added: false,
      priorUnlockedCount: MAX_UNLOCKED_ACHIEVEMENT_IDS,
      unlockedCountAfter: MAX_UNLOCKED_ACHIEVEMENT_IDS,
    });
    expect(committed.transaction.state.unlocked).toEqual(alreadyUnlocked.unlocked);
  });

  it('accepts the full bounded Charter progress surface without overflowing its receipt witness', async () => {
    const address = solWorld(134);
    const state = baseState();
    state.ascProg = { 'c1-land': 0 };
    for (let index = 0; index < 127; index++) {
      state.ascProg[`p${index.toString().padStart(22, '0')}`] = 999;
    }
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(Object.keys(outcome.transaction.state.ascProg)).toHaveLength(128);
    expect(outcome.witness.facts.charter.progressSeal).toMatch(/^[0-9a-f]{64}$/u);
    expect(outcome.witness.encoded.length).toBeLessThanOrEqual(4_096);
  });

  it('lands a valid near-limit veteran save whose expanded canonical state exceeds one MiB', async () => {
    const address = solWorld(134);
    const state = nearCapacityVeteranState();
    expect(JSON.stringify(state).length).toBeGreaterThan(PORTABLE_V5_MAX_LEGACY_BYTES);
    const fixture = await runtimeFixture({ state });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state.codex).toHaveLength(1_500);
    expect(outcome.verification.kind).toBe('verified');
  });

  it.each([
    ['absent', 'world-identity:absent'],
    ['corrupt', 'world-identity:corrupt'],
    ['future', 'world-identity:future-version'],
    ['capacity', 'world-identity:capacity'],
  ] as const)('refuses %s world-identity authority without publication', async (identityMode, detail) => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ identityMode });
    const beforeState = JSON.stringify(fixture.state);
    const beforeSession = structuredClone(fixture.runtime.sessionRng);
    const beforeRevision = await fixture.repository.revision();
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      detail,
      transaction: { kind: 'pre-draw-refused' },
    });
    expect(JSON.stringify(fixture.state)).toBe(beforeState);
    expect(fixture.runtime.sessionRng).toEqual(beforeSession);
    expect(await fixture.repository.revision()).toBe(beforeRevision);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
  });

  it.each([
    ['cargo', (state: SaveStateV2, address: CanonicalCF1WorldAddress) => {
      state.cargo = [[projectWorldOpportunity(address).deposits[0]!, 1_000_000]];
    }, 'field-sample:cargo-capacity'],
    ['essence', (state: SaveStateV2) => { state.essence = 1_000_000_000; },
      'field-sample:essence-capacity'],
    ['essenceEarned', (state: SaveStateV2) => {
      state.stats.essenceEarned = 1_000_000_000;
    }, 'field-sample:essence-earned-capacity'],
    ['landings', (state: SaveStateV2) => {
      state.stats.landings = 1_000_000_000;
    }, 'field-sample:landings-capacity'],
  ] as const)('refuses %s capacity with no receipt or partial state', async (_name, mutate, detail) => {
    const address = solWorld(134);
    const state = baseState();
    mutate(state, address);
    const fixture = await runtimeFixture({ state });
    const before = JSON.stringify(state);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      detail,
      transaction: { kind: 'pre-draw-refused' },
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.runtime.sessionRng.ordinal).toBe(7);
  });

  it('rejects mismatched projection authority before invoking F4', async () => {
    const address = solWorld(134);
    const other = solWorld(133);
    let calls = 0;
    const outcome = await commitArc0LandingAction({
      runtime: {
        async commitAction() {
          calls++;
          return { kind: 'lease-unavailable' };
        },
        async commitOutcomesPreDraw() {
          calls++;
          return { kind: 'lease-unavailable' };
        },
        extensions: {},
      },
      state: baseState(),
      surface: surface(address),
      address,
      opportunity: projectWorldOpportunity(other),
      training: false,
      codecNow: NOW,
    });

    expect(outcome).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
    expect(calls).toBe(0);
  });

  it('rejects a mismatched current surface before invoking F4', async () => {
    const address = solWorld(134);
    const other = solWorld(135);
    let calls = 0;
    const outcome = await commitArc0LandingAction({
      runtime: {
        async commitAction() {
          calls++;
          return { kind: 'lease-unavailable' };
        },
        async commitOutcomesPreDraw() {
          calls++;
          return { kind: 'lease-unavailable' };
        },
        extensions: {},
      },
      state: baseState(),
      surface: surface(other),
      address,
      opportunity: projectWorldOpportunity(address),
      training: false,
      codecNow: NOW,
    });

    expect(outcome).toEqual({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
    expect(calls).toBe(0);
  });

  it('fails stale once without retry, receipt, RNG advance, or caller mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const before = JSON.stringify(fixture.state);
    await fixture.repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'arc0-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

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
      seed: 0xA0A0_0001, ordinal: 7, draws: { 'prior.random': 2 },
    });
    expect(JSON.stringify(fixture.state)).toBe(before);
  });

  it('fails storage once without retry, receipt, revision, or product publication', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture({ storageFailure: true });
    const before = await readSaveV5(fixture.backend, REGISTRY, NOW);
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));

    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 0 landing storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.backend.keys('receipts')).toEqual([]);
    expect(await fixture.repository.revision()).toBe(1);
    expect(fixture.runtime.sessionRng.ordinal).toBe(7);
    expect(JSON.stringify(await readSaveV5(fixture.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(before));
  });

  it('seals the full state and identity successors against postcommit mutation', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const outcome = await commitArc0LandingAction(actionInput(fixture, address));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;

    const mutated = {
      ...outcome.transaction,
      state: { ...outcome.transaction.state, savedView: null },
    };
    expect(verifyArc0LandingPostcommit({
      transaction: mutated as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'state-fixed-point-mismatch' });

    const alteredState = structuredClone(outcome.transaction.state);
    alteredState.explorerName = 'altered outside the landing projection';
    const coherentlyAltered = {
      ...outcome.transaction,
      state: alteredState,
      saved: {
        ...outcome.transaction.saved,
        canonicalState: structuredClone(alteredState),
      },
    };
    expect(verifyArc0LandingPostcommit({
      transaction: coherentlyAltered as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'state-successor-mismatch' });

    const loadedIdentity = readWorldIdentity(outcome.transaction.saved.extensions);
    expect(loadedIdentity.kind).toBe('loaded');
    if (loadedIdentity.kind !== 'loaded') return;
    const extraAddress = solWorld(135);
    const extraLanding = recordCanonicalWorldLanding(
      loadedIdentity.state,
      extraAddress,
      outcome.transaction.saved.extensions,
    );
    expect(extraLanding.capacityProtected).toBe(false);
    const alteredExtensions = applyV5ExtensionWrites(
      outcome.transaction.saved.extensions,
      encodeWorldIdentityExtensionWrites(extraLanding.state),
    ).extensions;
    const identityAltered = {
      ...outcome.transaction,
      saved: { ...outcome.transaction.saved, extensions: alteredExtensions },
    };
    expect(verifyArc0LandingPostcommit({
      transaction: identityAltered as never,
      address,
      witness: outcome.witness,
    })).toEqual({ kind: 'mismatch', detail: 'world-identity-mismatch' });

    expect(verifyArc0LandingPostcommit({
      transaction: outcome.transaction,
      address,
      witness: structuredClone(outcome.witness),
    })).toEqual({ kind: 'mismatch', detail: 'witness-unregistered' });
  });

  it('captures detached input before queueing and never mutates the live save', async () => {
    const address = solWorld(134);
    const fixture = await runtimeFixture();
    const input = actionInput(fixture, address);
    const originalEssence = fixture.state.essence;
    const pending = commitArc0LandingAction(input);
    fixture.state.essence = 777;
    Object.assign(input as unknown as Record<string, unknown>, {
      address: solWorld(133),
      training: true,
      codecNow: -1,
    });
    const outcome = await pending;

    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.witness.facts.worldKey).toBe(address.key);
    expect(outcome.witness.facts.training).toBe(false);
    expect(outcome.transaction.state.essence).toBeGreaterThan(originalEssence);
    expect(outcome.transaction.state.essence).not.toBe(777);
    expect(fixture.state.essence).toBe(777);
  });
});
