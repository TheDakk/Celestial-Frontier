import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  LOOT_CATALOGUE_V1,
  SLOTTED_GEAR_BASES_V1,
  setGearProtection,
  type GearInventory,
} from '@cf/domain-loot';
import {
  ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
  ARC2_LOOT_NAMESPACE,
  V4_PRIMARY_KEY,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  canonicalizeV5Extensions,
  createActivePlayPersistenceOwner,
  createF4NoRngProductTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  encodeArc2LootCarrier,
  migrateStoredV4ToV5,
  prepareArc2LootInventoryWrite,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
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
const NOW = 1_753_900_060_000;

type LegacyLootFields = Pick<SaveStateV2, 'items' | 'equip' | 'equipAff'>;

function legacyFixture(): LegacyLootFields {
  return {
    items: [['plate', 3], ['rl-star', 1], ['fieldsuit', 1], ['rig1', 2]],
    equip: { helmet: 'rl-star', suit: 'fieldsuit', tool: 'rig1' },
    equipAff: {
      helmet: { k: 'contact', v: 9, forId: 'rl-star' },
      suit: { k: 'scut', v: 0, forId: 'fieldsuit' },
      tool: { k: 'yield', v: 0.05, forId: 'rig1' },
    },
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
    settings[`test.pad-${index}`] = { version: 99, json: objectJsonOfLength(length) };
  }
  return canonicalizeV5Extensions({ settings });
}

function loadedInventory(extensions: V5Extensions): GearInventory {
  const read = readArc2Loot(extensions);
  if (read.kind !== 'loaded' || read.state.kind !== 'inventory') {
    throw new Error(`expected loaded inventory, got ${read.kind}`);
  }
  return read.state.inventory;
}

describe('@cf/persistence — Arc 2 loot extension carrier', () => {
  it('migrates one complete fitting legacy result through the truthful gear owner and preserves every other namespace', () => {
    const base = canonicalizeV5Extensions({
      player: {
        'f4.authority': { version: 1, json: '{"clock":"keep"}' },
        'future.player': { version: 77, json: '{"opaque":"exact bytes"}' },
      },
      inventory: { 'other.inventory': { version: 4, json: '{"keep":[1,2,3]}' } },
      settings: { 'arc7.audio': { version: 3, json: '{"muted":false}' } },
    });
    const prepared = prepareArc2LootLegacyMigration({
      extensions: base,
      legacy: legacyFixture(),
      capacity: 8,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    expect(prepared.write).toMatchObject({ segment: 'inventory', namespace: ARC2_LOOT_NAMESPACE });
    expect(Object.keys(prepared.write).sort()).toEqual(['carrier', 'namespace', 'segment']);
    expect(Object.keys(prepared.write.carrier).sort()).toEqual(['json', 'version']);
    expect(prepared.extensions.player).toEqual(base.player);
    expect(prepared.extensions.settings).toEqual(base.settings);
    expect(prepared.extensions.inventory?.['other.inventory']).toEqual(base.inventory?.['other.inventory']);

    const read = readArc2Loot(prepared.extensions);
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded' || read.state.kind !== 'inventory') return;
    expect(read.state.inventory).toMatchObject({ schema: 1, revision: 0, capacity: 8 });
    expect(read.state.inventory.entries).toHaveLength(4);
    expect(read.state.inventory.entries.map(({ instance }) => instance.baseId)).toEqual([
      'rig1', 'rig1', 'fieldsuit', 'rl-star',
    ]);
    expect(new Set(read.state.inventory.entries.map(({ instance }) => instance.instanceId)).size).toBe(4);
    expect(read.state.stackableCounts).toEqual([{ baseId: 'plate', count: 3 }]);
    expect(read.state.inventory.entries.every(({ instance }) => (
      instance.provenance.sourceActionId === ARC2_LOOT_LEGACY_SOURCE_ACTION_ID
      && instance.construction === 'legacy'
    ))).toBe(true);
    expect(read.state.inventory.equipped).toHaveLength(3);
    const entriesById = new Map(read.state.inventory.entries.map(({ instance }) => [instance.instanceId, instance]));
    expect(read.state.inventory.equipped.map(({ slot, instanceId }) => ({
      slot,
      baseId: entriesById.get(instanceId)?.baseId,
      affix: entriesById.get(instanceId)?.legacyAffix,
    }))).toEqual([
      {
        slot: 'helmet', baseId: 'rl-star',
        affix: { affixId: 'contact', value: 9, forBaseId: 'rl-star' },
      },
      {
        slot: 'suit', baseId: 'fieldsuit',
        affix: { affixId: 'scut', value: 0, forBaseId: 'fieldsuit' },
      },
      {
        slot: 'tool', baseId: 'rig1',
        affix: { affixId: 'yield', value: 0.05, forBaseId: 'rig1' },
      },
    ]);
    expect(read.state.inventory.entries.filter(({ instance }) => instance.baseId === 'rig1')
      .map(({ instance }) => instance.legacyAffix)).toEqual([
      { affixId: 'yield', value: 0.05, forBaseId: 'rig1' }, null,
    ]);
    expect(encodeArc2LootCarrier(read.state)).toEqual(prepared.write.carrier);
    expect(readArc2Loot(prepared.extensions)).toEqual(read);

    const firstId = read.state.inventory.entries[0]!.instance.instanceId;
    const protectionOutcome = setGearProtection(
      read.state.inventory,
      read.state.inventory.revision,
      firstId,
      { favorite: true, locked: false },
    );
    expect(protectionOutcome.status).toBe('committed');
    if (protectionOutcome.status !== 'committed') return;
    const write = prepareArc2LootInventoryWrite({
      extensions: prepared.extensions,
      inventory: protectionOutcome.state,
      stackableCounts: read.state.stackableCounts,
    });
    expect(write.kind).toBe('prepared');
    if (write.kind === 'prepared') {
      expect(loadedInventory(write.extensions).revision).toBe(1);
      expect(write.extensions.player).toEqual(base.player);
      expect(write.extensions.settings).toEqual(base.settings);
    }
  });

  it('classifies absent, future, and corrupt target carriers without overwriting their exact bytes', () => {
    expect(readArc2Loot({})).toEqual({ kind: 'absent' });

    const future = canonicalizeV5Extensions({ inventory: {
      [ARC2_LOOT_NAMESPACE]: { version: 2, json: '{"opaque":"future gear"}' },
    } });
    expect(readArc2Loot(future)).toEqual({ kind: 'future-version', version: 2 });
    expect(prepareArc2LootLegacyMigration({
      extensions: future, legacy: legacyFixture(), capacity: 8,
    })).toEqual({ kind: 'protected', reason: 'target-future', version: 2 });
    expect(future.inventory?.[ARC2_LOOT_NAMESPACE]?.json).toBe('{"opaque":"future gear"}');

    const corrupt = canonicalizeV5Extensions({ inventory: {
      [ARC2_LOOT_NAMESPACE]: { version: 1, json: '{"kind":"inventory"}' },
    } });
    expect(readArc2Loot(corrupt)).toEqual({ kind: 'corrupt' });
    expect(prepareArc2LootLegacyMigration({
      extensions: corrupt, legacy: legacyFixture(), capacity: 8,
    })).toEqual({ kind: 'protected', reason: 'target-corrupt' });
    expect(corrupt.inventory?.[ARC2_LOOT_NAMESPACE]?.json).toBe('{"kind":"inventory"}');

    const prepared = prepareArc2LootLegacyMigration({ extensions: {}, legacy: legacyFixture(), capacity: 8 });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    const parsed = JSON.parse(prepared.write.carrier.json) as Record<string, unknown>;
    const reordered = canonicalizeV5Extensions({ inventory: {
      [ARC2_LOOT_NAMESPACE]: {
        version: 1,
        json: JSON.stringify({
          stackableCounts: parsed.stackableCounts,
          inventory: parsed.inventory,
          kind: parsed.kind,
        }),
      },
    } });
    expect(readArc2Loot(reordered)).toEqual({ kind: 'corrupt' });
  });

  it('keeps the maximum valid legacy count-map compact and wholly non-mutable instead of expanding or truncating it', () => {
    const fixture = legacyFixture();
    const legacy: LegacyLootFields = {
      items: LOOT_CATALOGUE_V1.map(({ id }) => [id, 999]),
      equip: fixture.equip,
      equipAff: fixture.equipAff,
    };
    const prepared = prepareArc2LootLegacyMigration({ extensions: {}, legacy, capacity: 200 });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.state.kind).toBe('legacy-protected');
    if (prepared.state.kind !== 'legacy-protected') return;

    expect(prepared.state.reason).toBe('capacity');
    expect(prepared.state.estimatedInstanceCount).toBe(SLOTTED_GEAR_BASES_V1.length * 999);
    expect(prepared.state.itemCounts).toEqual(LOOT_CATALOGUE_V1.map(({ id }) => [id, 999]));
    expect(prepared.state.equipped).toEqual({
      helmet: 'rl-star', suit: 'fieldsuit', tool: 'rig1',
    });
    expect(prepared.state.equippedAffixes).toEqual({
      helmet: { k: 'contact', v: 9, forId: 'rl-star' },
      suit: { k: 'scut', v: 0, forId: 'fieldsuit' },
      tool: { k: 'yield', v: 0.05, forId: 'rig1' },
    });
    expect(prepared.write.carrier.json.length).toBeLessThan(V5_MAX_EXTENSION_JSON_BYTES);
    expect(prepared.write.carrier.json).not.toContain('gear1|');
    expect(prepared.write.carrier.json).not.toContain('"entries"');
    expect(readArc2Loot(prepared.extensions)).toEqual({ kind: 'loaded', state: prepared.state });
    expect(encodeArc2LootCarrier(prepared.state)).toEqual(prepared.write.carrier);
    expect(prepareArc2LootInventoryWrite({
      extensions: prepared.extensions,
      inventory: { schema: 1 } as GearInventory,
      stackableCounts: [],
    })).toEqual({ kind: 'protected', reason: 'legacy-protected' });
  });

  it('falls back to the compact source carrier when a full inventory would breach global extension bytes', () => {
    const legacy: LegacyLootFields = { items: [['rig1', 200]], equip: {}, equipAff: {} };
    const full = prepareArc2LootLegacyMigration({ extensions: {}, legacy, capacity: 200 });
    const compact = prepareArc2LootLegacyMigration({ extensions: {}, legacy, capacity: 199 });
    expect(full.kind).toBe('prepared');
    expect(compact.kind).toBe('prepared');
    if (full.kind !== 'prepared' || compact.kind !== 'prepared') return;
    expect(full.state.kind).toBe('inventory');
    expect(compact.state.kind).toBe('legacy-protected');
    const fullBytes = new TextEncoder().encode(full.write.carrier.json).byteLength;
    const compactBytes = new TextEncoder().encode(compact.write.carrier.json).byteLength;
    expect(fullBytes).toBeGreaterThan(compactBytes + 64);

    const available = compactBytes + 64;
    const base = paddingExtensions(V5_MAX_EXTENSION_TOTAL_BYTES - available);
    const prepared = prepareArc2LootLegacyMigration({ extensions: base, legacy, capacity: 200 });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.state).toMatchObject({
      kind: 'legacy-protected', reason: 'extension-bytes', estimatedInstanceCount: 200,
    });
    expect(prepared.extensions.settings).toEqual(base.settings);
    expect(canonicalizeV5Extensions(prepared.extensions)).toEqual(prepared.extensions);
    expect(prepared.write.carrier.json).not.toContain('gear1|');
  });

  it('leaves a globally full extension set unchanged when even the compact carrier cannot fit', () => {
    const full = paddingExtensions(V5_MAX_EXTENSION_TOTAL_BYTES);
    const before = JSON.stringify(full);
    const prepared = prepareArc2LootLegacyMigration({
      extensions: full,
      legacy: { items: [['rig1', 201]], equip: {}, equipAff: {} },
      capacity: 200,
    });
    expect(prepared).toEqual({ kind: 'protected', reason: 'extension-bounds' });
    expect(JSON.stringify(full)).toBe(before);
    expect(full.inventory?.[ARC2_LOOT_NAMESPACE]).toBeUndefined();
  });

  it('protects invalid legacy ownership and requires an explicit caller capacity', () => {
    expect(prepareArc2LootLegacyMigration({
      extensions: {},
      legacy: { items: [], equip: { tool: 'rig1' }, equipAff: {} },
      capacity: 8,
    })).toEqual({ kind: 'protected', reason: 'legacy-corrupt' });
    expect(() => prepareArc2LootLegacyMigration({
      extensions: {}, legacy: legacyFixture(), capacity: 0,
    })).toThrow('caller capacity');
    expect(() => prepareArc2LootLegacyMigration({
      extensions: {}, legacy: legacyFixture(), capacity: 201,
    })).toThrow('caller capacity');
  });

  it('lands the exact prepared namespace through the real lease-fenced no-RNG F4 writer', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{
      store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify(fixtures.inputs.veteran_rich),
    }]);
    expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
    const initial = await readSaveV5(backend, REGISTRY, NOW);
    if (initial.kind !== 'loaded') throw new Error('expected migrated v5 state');
    const repository = createRevisionedRepository(backend);
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc2-test', token: 'arc2-document', ttlMs: 100, now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error('expected Arc 2 test lease');
    const seeded = await createActivePlayPersistenceOwner(repository, REGISTRY).commit({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state: initial.state, extensions: initial.extensions },
      snapshot: { activePlayMs: 25 },
      sessionRng: createSessionRNG(0xA2C2).state(),
      now: NOW,
    });
    expect(seeded.kind).toBe('committed');
    const writable = await readSaveV5(backend, REGISTRY, NOW);
    if (writable.kind !== 'loaded') throw new Error('expected seeded v5 state');
    const prepared = prepareArc2LootLegacyMigration({
      extensions: writable.extensions, legacy: legacyFixture(), capacity: 8,
    });
    if (prepared.kind !== 'prepared') throw new Error(`expected prepared Arc 2 carrier: ${prepared.kind}`);

    const committed = await createF4NoRngProductTransactionOwner(repository, REGISTRY).commit({
      expectedRevision: 1,
      grant: acquired.grant,
      writable: { state: writable.state, extensions: writable.extensions },
      snapshot: { activePlayMs: 25 },
      operation: 'equip',
      now: NOW,
      derive: ({ draft }) => ({
        state: draft,
        witness: 'arc2-carrier-real-extension-write',
        extensionWrites: [prepared.write],
      }),
    });
    expect(committed.kind).toBe('committed');
    if (committed.kind !== 'committed') return;
    expect(committed.receipt).toEqual({
      ordinal: 0, kind: 'arc2-equip', witness: 'arc2-carrier-real-extension-write',
    });
    const stored = await readSaveV5(backend, REGISTRY, NOW);
    expect(stored.kind).toBe('loaded');
    if (stored.kind !== 'loaded') return;
    expect(readArc2Loot(stored.extensions)).toEqual({ kind: 'loaded', state: prepared.state });
    expect(stored.extensions.inventory?.[ARC2_LOOT_NAMESPACE]).toEqual(prepared.write.carrier);
    expect(stored.extensions.player?.['f4.authority']).toBeDefined();
  });
});
