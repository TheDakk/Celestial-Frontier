import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decodeGearInventory } from '@cf/domain-loot';
import {
  canonicalizeV5Extensions,
  classifyV4Save,
  classifyPortableV5Save,
  encodeArc2LootCarrier,
  exportPortableV5Save,
  importSaveV2,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  type ContentRegistry,
} from '@cf/persistence';
import {
  assessArc2InventoryOperationOutcome,
  assessArc2InventoryPendingWindow,
  assessArc2InventoryPreDurableRefusal,
  assessInventoryOperationActivation,
  assessInventoryOperationSequenceDurability,
} from '../tools/slicesmoke-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, Record<string, unknown>>;
};
const registry = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const fixturePath = path.join(here, '..', 'tools', 'fixtures', 'arc2-live-outcomes-v1.json');
const fixtureRaw = fs.readFileSync(fixturePath, 'utf8').trim();
const now = 1_753_900_060_000;

function generatedPortableFixture(): string {
  const source = structuredClone(fixtures.inputs.veteran_rich!);
  source.log = [...(source.log as unknown[]),
    {
      id: 'legacy-star', title: 'Legacy chart', sub: 'Imported without complete coordinates', badge: 'Legacy',
      where: { type: 'star', gal: { x: 90, y: -60, seed: 999 }, star: { seed: 777 } },
    },
    {
      id: 'forged-earth', title: 'Forged Earth', sub: 'Imported with a stale parent', badge: 'Legacy',
      where: {
        type: 'planet', gal: { x: 90.01, y: -60, seed: 999 },
        star: { x: 560, y: 170, seed: 424242 }, pseed: 133,
      },
    },
  ];
  source.items = [...(source.items as unknown[]), ['hazmat', 1], ['thermal', 1], ['rig1', 1]];
  source.eq = { ...(source.eq as Record<string, unknown>), suit: 'hazmat' };
  const imported = importSaveV2(JSON.stringify(source), registry, now);
  if (!imported.ok) throw new Error(`fixture import was ${imported.reason}`);
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {}, legacy: imported.state, capacity: 200,
  });
  if (prepared.kind !== 'prepared' || prepared.state.kind !== 'inventory') {
    throw new Error(`fixture migration was ${prepared.kind}`);
  }
  const pendingEntry = prepared.state.inventory.entries.find(({ instance }) => instance.baseId === 'rig1');
  if (!pendingEntry) throw new Error('fixture pending rig was absent');
  const retained = prepared.state.inventory.entries.filter((entry) => entry !== pendingEntry);
  const inventory = decodeGearInventory(JSON.stringify({
    ...prepared.state.inventory,
    capacity: retained.length,
    entries: retained,
    pendingRewards: [{ instance: pendingEntry.instance, reason: 'capacity' }],
  }));
  const arc2 = Object.freeze({
    kind: 'inventory' as const,
    inventory,
    stackableCounts: prepared.state.stackableCounts,
  });
  return exportPortableV5Save({
    state: imported.state,
    extensions: canonicalizeV5Extensions({
      inventory: { 'arc2.loot': encodeArc2LootCarrier(arc2) },
    }),
  }, registry, now);
}

type Operation = 'equip' | 'unequip' | 'salvage' | 'pending-claim';
type ExactInstance = Readonly<{
  instanceId: string;
  baseId: string;
  slot: string;
  legacyAffix: null;
}>;

const hazmat: ExactInstance = Object.freeze({ instanceId: 'gear|hazmat', baseId: 'hazmat', slot: 'suit', legacyAffix: null });
const thermal: ExactInstance = Object.freeze({ instanceId: 'gear|thermal', baseId: 'thermal', slot: 'suit', legacyAffix: null });
const rig: ExactInstance = Object.freeze({ instanceId: 'gear|rig', baseId: 'rig1', slot: 'tool', legacyAffix: null });
const entry = (instance: ExactInstance) => ({ instance, favorite: false, locked: false });
const receipt = (ordinal: number, kind: string, witness: string) => ({ ordinal, kind, witness });
const predecessor = receipt(0, 'f4-smoke', 'f4:smoke:0:predecessor');

interface SnapshotSpec {
  revision: number;
  inventoryRevision: number;
  ordinal: number;
  entries: ExactInstance[];
  pending: ExactInstance[];
  equipped: Array<{ slot: string; instanceId: string }>;
  items: Array<[string, number]>;
  cargo: Array<[string, number]>;
  receipts: Array<{ ordinal: number; kind: string; witness: string }>;
  activePlayMs?: number;
  completedOperation?: Operation;
}

function snapshot(spec: SnapshotSpec) {
  const arc2 = {
    kind: 'inventory',
    inventory: {
      schema: 1, revision: spec.inventoryRevision, capacity: 3,
      entries: spec.entries.map(entry), equipped: spec.equipped,
      pendingRewards: spec.pending.map((instance) => ({ instance, reason: 'capacity' })),
    },
    stackableCounts: [],
  };
  const itemRecord = Object.fromEntries(spec.items);
  const expectedEq = Object.fromEntries(spec.equipped.map(({ slot, instanceId }) => [
    slot, [...spec.entries, ...spec.pending].find((instance) => instance.instanceId === instanceId)?.baseId,
  ]));
  const legacy = {
    items: spec.items, eq: expectedEq, ea: {}, cargo: spec.cargo,
    log: [{ id: 'p133', title: 'Earth' }],
  };
  expect(itemRecord).toEqual(Object.fromEntries([
    ...spec.entries.map(({ baseId }) => [baseId, 0] as const),
    ...spec.pending.map(({ baseId }) => [baseId, 0] as const),
  ].reduce((rows, [baseId]) => {
    const found = rows.find(([id]) => id === baseId);
    if (found) found[1] += 1;
    else rows.push([baseId, 1]);
    return rows;
  }, [] as Array<[string, number]>)));
  const authority = {
    activePlayMs: spec.activePlayMs ?? 1_200,
    sessionRng: { seed: 0xC0FFEE, ordinal: spec.ordinal, draws: { capture: 2 } },
  };
  const authorityCarrier = { version: 1, json: JSON.stringify(authority) };
  const lootCarrier = { version: 1, json: JSON.stringify(arc2) };
  const playerRow = { schema: 5, segment: 'player', data: {}, extensions: { 'f4.authority': authorityCarrier } };
  const inventoryRow = {
    schema: 5, segment: 'inventory', data: { items: spec.items, eq: expectedEq, ea: {}, cargo: spec.cargo },
    extensions: { 'arc2.loot': lootCarrier },
  };
  const receiptRows = spec.receipts.map((row) => ({ ...row }));
  const raw = {
    revisionRaw: String(spec.revision), revision: spec.revision,
    legacyRaw: JSON.stringify(legacy), legacy,
    playerRaw: JSON.stringify(playerRow), playerRow,
    inventoryRaw: JSON.stringify(inventoryRow), inventoryRow,
    carrierVersion: 1, carrierJson: lootCarrier.json, arc2,
    authorityVersion: 1, authorityJson: authorityCarrier.json, authority,
    receiptKeys: receiptRows.map(({ ordinal }) => `receipt:${ordinal}`),
    receiptRawRows: receiptRows.map((row) => JSON.stringify(row)), receiptRows,
  };
  const state = {
    mode: 'surface', gal: 999, star: 424242, planet: 133,
    atlasCount: 3, atlasTravelable: 1,
    save: {
      items: structuredClone(spec.items), cargo: structuredClone(spec.cargo),
      landed: [133], customNames: [['p133', 'Homeworld']], savedView: { type: 'planet' },
    },
    inventory: {
      stateKind: 'inventory', bootstrapPending: false, revision: spec.inventoryRevision,
      entries: spec.entries.length, pending: spec.pending.length,
      entryIds: spec.entries.map(({ instanceId }) => instanceId),
      pendingIds: spec.pending.map(({ instanceId }) => instanceId),
      equippedBindings: structuredClone(spec.equipped),
    },
    persistence: {
      runtime: {
        revision: spec.revision, sessionSeed: 0xC0FFEE, sessionOrdinal: spec.ordinal,
        sessionDraws: { capture: 2 },
      },
    },
    engineering: {
      actionCoordinator: {
        inFlight: false, owner: { busy: false, operation: null },
        hold: spec.completedOperation
          ? { phase: 'released', operation: `arc2.${spec.completedOperation}` }
          : { phase: 'idle', operation: null },
      },
    },
  };
  return { raw, state };
}

const specs: SnapshotSpec[] = [
  {
    revision: 10, inventoryRevision: 0, ordinal: 1,
    entries: [hazmat, thermal], pending: [rig], equipped: [{ slot: 'suit', instanceId: hazmat.instanceId }],
    items: [['hazmat', 1], ['thermal', 1], ['rig1', 1]], cargo: [], receipts: [predecessor],
  },
  {
    revision: 11, inventoryRevision: 1, ordinal: 2,
    entries: [hazmat, thermal], pending: [rig], equipped: [{ slot: 'suit', instanceId: thermal.instanceId }],
    items: [['hazmat', 1], ['thermal', 1], ['rig1', 1]], cargo: [],
    receipts: [predecessor, receipt(1, 'arc2-equip', `arc2:equip:1:${thermal.instanceId}:1`)],
  },
  {
    revision: 12, inventoryRevision: 2, ordinal: 3,
    completedOperation: 'unequip',
    entries: [hazmat, thermal], pending: [rig], equipped: [],
    items: [['hazmat', 1], ['thermal', 1], ['rig1', 1]], cargo: [],
    receipts: [predecessor,
      receipt(1, 'arc2-equip', `arc2:equip:1:${thermal.instanceId}:1`),
      receipt(2, 'arc2-unequip', `arc2:unequip:2:${thermal.instanceId}:2`)],
  },
  {
    revision: 13, inventoryRevision: 3, ordinal: 4,
    completedOperation: 'salvage',
    entries: [hazmat], pending: [rig], equipped: [],
    items: [['hazmat', 1], ['rig1', 1]], cargo: [['S', 1], ['W', 1]],
    receipts: [predecessor,
      receipt(1, 'arc2-equip', `arc2:equip:1:${thermal.instanceId}:1`),
      receipt(2, 'arc2-unequip', `arc2:unequip:2:${thermal.instanceId}:2`),
      receipt(3, 'arc2-salvage', `arc2:salvage:3:${thermal.instanceId}:3`)],
  },
  {
    revision: 14, inventoryRevision: 4, ordinal: 5,
    completedOperation: 'pending-claim',
    entries: [hazmat, rig], pending: [], equipped: [],
    items: [['hazmat', 1], ['rig1', 1]], cargo: [['S', 1], ['W', 1]],
    receipts: [predecessor,
      receipt(1, 'arc2-equip', `arc2:equip:1:${thermal.instanceId}:1`),
      receipt(2, 'arc2-unequip', `arc2:unequip:2:${thermal.instanceId}:2`),
      receipt(3, 'arc2-salvage', `arc2:salvage:3:${thermal.instanceId}:3`),
      receipt(4, 'arc2-pending-claim', `arc2:pending-claim:4:${rig.instanceId}:4`)],
  },
];
const snapshots = specs.map(snapshot);
const operations = [
  { operation: 'equip' as const, instanceId: thermal.instanceId, receiptOrdinal: 1, inventoryRevision: 1 },
  { operation: 'unequip' as const, instanceId: thermal.instanceId, receiptOrdinal: 2, inventoryRevision: 2 },
  { operation: 'salvage' as const, instanceId: thermal.instanceId, receiptOrdinal: 3, inventoryRevision: 3 },
  { operation: 'pending-claim' as const, instanceId: rig.instanceId, receiptOrdinal: 4, inventoryRevision: 4 },
];

function committedDetail(operation: Operation, instanceId: string) {
  const salvage = operation === 'salvage';
  return {
    open: !salvage, sheetHidden: salvage, ariaHidden: salvage ? 'true' : 'false',
    bodyChildren: salvage ? 0 : 1, detailId: salvage ? null : instanceId,
    busy: 'false', statusKind: salvage ? null : 'committed',
    actions: salvage ? [] : [operation === 'equip' ? 'unequip' : 'equip', 'salvage'],
    diagnostics: {
      activeCount: salvage ? 0 : 1, retainedCount: 0,
      pendingWork: 0, selectedInstanceId: salvage ? null : instanceId,
      lastAction: { operation, instanceId, kind: 'committed' },
    },
  };
}

describe('Slice Arc 2 native live-outcome fixture and semantic contracts', () => {
  it('seals the portable-v5 fixture as a real authority-derived fixed point', () => {
    expect(fixtureRaw).toBe(generatedPortableFixture());
    expect(classifyV4Save(fixtureRaw, registry, now + 10_000)).toEqual({ kind: 'corrupt' });
    const envelope = JSON.parse(fixtureRaw) as { legacyV4?: unknown };
    expect(typeof envelope.legacyV4).toBe('string');
    expect(classifyV4Save(String(envelope.legacyV4), registry, now + 10_000).kind)
      .toBe('supported');
    const classified = classifyPortableV5Save(fixtureRaw, registry, now + 10_000);
    expect(classified.kind).toBe('supported');
    if (classified.kind !== 'supported') return;
    const loaded = readArc2Loot(classified.extensions);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return;
    expect(loaded.state.inventory).toMatchObject({ revision: 0, capacity: 3 });
    expect(loaded.state.inventory.entries.map(({ instance }) => instance.baseId).sort())
      .toEqual(['hazmat', 'headlamp', 'thermal']);
    expect(loaded.state.inventory.pendingRewards.map(({ instance }) => instance.baseId)).toEqual(['rig1']);
    expect(generatedPortableFixture()).toBe(fixtureRaw);
  });

  it('accepts every exact trusted operation activation and rejects count, identity, trust, and point drift', () => {
    for (const [operation, expectedCount] of [
      ['equip', 1], ['unequip', 1], ['salvage', 2], ['pending-claim', 1],
    ] as const) {
      const points = Array.from({ length: expectedCount }, () => ({ ok: true, x: 40, y: 80, height: 44 }));
      const presses = Array.from({ length: expectedCount }, () => ({
        operation, instanceId: thermal.instanceId, tag: 'BUTTON', trusted: true,
        pointerType: 'mouse', x: 40, y: 80,
      }));
      const green = { points, point: points[0], interaction: { pressCount: expectedCount, presses } };
      expect(assessInventoryOperationActivation(green, operation, thermal.instanceId, expectedCount)).toEqual({ ok: true, reasons: [] });
      expect(assessInventoryOperationActivation({ ...green,
        interaction: { pressCount: expectedCount + 1, presses } }, operation, thermal.instanceId, expectedCount).ok).toBe(false);
      expect(assessInventoryOperationActivation({ ...green,
        interaction: { pressCount: expectedCount, presses: presses.map((press) => ({ ...press, trusted: false })) } },
      operation, thermal.instanceId, expectedCount).ok).toBe(false);
      expect(assessInventoryOperationActivation({ ...green,
        points: points.map((point) => ({ ...point, x: 42 })) }, operation, thermal.instanceId, expectedCount).ok).toBe(false);
      expect(assessInventoryOperationActivation(green, operation, thermal.instanceId, expectedCount).ok).toBe(true);
    }
  });

  it('makes the held no-optimism/retry window and authority refusal bidirectionally mutation-sensitive', () => {
    const before = snapshots[1]!;
    const point = { ok: true, x: 40, y: 80, height: 44 };
    const press = {
      operation: 'unequip', instanceId: thermal.instanceId, tag: 'BUTTON', trusted: true,
      pointerType: 'mouse', x: 40, y: 80,
    };
    const heldState = structuredClone(before.state);
    (heldState.engineering as { actionCoordinator: unknown }).actionCoordinator = {
      inFlight: true, owner: { busy: true, operation: 'arc2.unequip' },
      hold: { phase: 'holding', operation: 'arc2.unequip' },
    };
    const heldDetail = {
      busy: 'true', statusKind: 'pending', diagnostics: { pendingWork: 1 },
      actionButtons: [{ operation: 'unequip', instanceId: thermal.instanceId, disabled: true }],
    };
    const retryPoint = { ...point, disabled: true };
    const pending = {
      operation: 'unequip', instanceId: thermal.instanceId, point, points: [point], retryPoint,
      activation: { pressCount: 1, presses: [press] },
      retry: {
        dispatch: { kind: 'cdp-mouse', button: 'left', clickCount: 1, x: 40, y: 80 },
        pressCount: 0, presses: [],
      },
      beforeRaw: before.raw, heldRaw: structuredClone(before.raw), retriedRaw: structuredClone(before.raw),
      beforeState: before.state, heldState, retriedState: structuredClone(heldState),
      heldDetail, retriedDetail: structuredClone(heldDetail),
    };
    expect(assessArc2InventoryPendingWindow(pending)).toEqual({ ok: true, reasons: [] });
    const optimistic = structuredClone(pending);
    optimistic.heldState.inventory.revision += 1;
    expect(assessArc2InventoryPendingWindow(optimistic).reasons).toContain('no optimistic live publication');
    const retried = structuredClone(pending);
    retried.retriedRaw.revision += 1;
    expect(assessArc2InventoryPendingWindow(retried).reasons).toContain('pre-durable bytes unchanged');
    const wrongRetry = structuredClone(pending);
    wrongRetry.retry.dispatch.clickCount = 2;
    expect(assessArc2InventoryPendingWindow(wrongRetry).reasons)
      .toContain('exact native disabled retry dispatch');
    expect(assessArc2InventoryPendingWindow(pending).ok).toBe(true);

    const refusedState = structuredClone(before.state);
    const refusedDetail = {
      open: true, detailId: thermal.instanceId, busy: 'false', statusKind: 'unavailable',
      diagnostics: {
        pendingWork: 0,
        lastAction: { operation: 'unequip', instanceId: thermal.instanceId, kind: 'unavailable' },
      },
    };
    const refusal = {
      operation: 'unequip', instanceId: thermal.instanceId, armed: true, released: false,
      point, activation: { pressCount: 1, presses: [press] },
      beforeRaw: before.raw, afterRaw: structuredClone(before.raw),
      beforeState: before.state, afterState: refusedState, detail: refusedDetail,
    };
    expect(assessArc2InventoryPreDurableRefusal(refusal)).toEqual({ ok: true, reasons: [] });
    const falseDurable = structuredClone(refusal);
    falseDurable.afterRaw.receiptKeys.push('receipt:2');
    expect(assessArc2InventoryPreDurableRefusal(falseDurable).reasons)
      .toContain('pre-durable refusal bytes/receipt/RNG unchanged');
    expect(assessArc2InventoryPreDurableRefusal(refusal).ok).toBe(true);
  });

  it('binds all four carrier transitions to one revision/ordinal/receipt and exact reload ledger', () => {
    const cases: Array<[Operation, number, string, Record<string, number>]> = [
      ['equip', 0, thermal.instanceId, {}],
      ['unequip', 1, thermal.instanceId, {}],
      ['salvage', 2, thermal.instanceId, { S: 1, W: 1 }],
      ['pending-claim', 3, rig.instanceId, {}],
    ];
    for (const [operation, index, instanceId, expectedCargoDelta] of cases) {
      const bundle = {
        operation, instanceId, expectedCargoDelta,
        beforeRaw: snapshots[index]!.raw, beforeState: snapshots[index]!.state,
        afterRaw: snapshots[index + 1]!.raw, afterState: snapshots[index + 1]!.state,
        afterDetail: committedDetail(operation, instanceId),
      };
      expect(assessArc2InventoryOperationOutcome(bundle), operation).toEqual({ ok: true, reasons: [] });
      const drawDrift = structuredClone(bundle);
      drawDrift.afterRaw.authority.sessionRng.draws.capture += 1;
      drawDrift.afterRaw.authorityJson = JSON.stringify(drawDrift.afterRaw.authority);
      drawDrift.afterRaw.playerRow.extensions['f4.authority'].json = drawDrift.afterRaw.authorityJson;
      drawDrift.afterRaw.playerRaw = JSON.stringify(drawDrift.afterRaw.playerRow);
      drawDrift.afterState.persistence.runtime.sessionDraws.capture += 1;
      expect(assessArc2InventoryOperationOutcome(drawDrift).reasons)
        .toContain('one revision/ordinal/receipt with unchanged RNG draws');
      const parityDrift = structuredClone(bundle);
      parityDrift.afterState.save.cargo.push(['control', 1]);
      expect(assessArc2InventoryOperationOutcome(parityDrift).reasons)
        .toContain('Arc 2 carrier/legacy items/equip/cargo parity');
      const unrelatedEntryDrift = structuredClone(bundle);
      unrelatedEntryDrift.afterRaw.arc2.inventory.entries[0]!.favorite = true;
      unrelatedEntryDrift.afterRaw.carrierJson = JSON.stringify(unrelatedEntryDrift.afterRaw.arc2);
      unrelatedEntryDrift.afterRaw.inventoryRow.extensions['arc2.loot'].json = unrelatedEntryDrift.afterRaw.carrierJson;
      unrelatedEntryDrift.afterRaw.inventoryRaw = JSON.stringify(unrelatedEntryDrift.afterRaw.inventoryRow);
      expect(assessArc2InventoryOperationOutcome(unrelatedEntryDrift).reasons)
        .toContain(`exact ${operation} publication`);
      if (operation === 'equip' || operation === 'unequip' || operation === 'pending-claim') {
        const targetEntryDrift = structuredClone(bundle);
        const target = targetEntryDrift.afterRaw.arc2.inventory.entries
          .find(({ instance }) => instance.instanceId === instanceId)!;
        target.favorite = true;
        targetEntryDrift.afterRaw.carrierJson = JSON.stringify(targetEntryDrift.afterRaw.arc2);
        targetEntryDrift.afterRaw.inventoryRow.extensions['arc2.loot'].json = targetEntryDrift.afterRaw.carrierJson;
        targetEntryDrift.afterRaw.inventoryRaw = JSON.stringify(targetEntryDrift.afterRaw.inventoryRow);
        expect(assessArc2InventoryOperationOutcome(targetEntryDrift).reasons)
          .toContain(`exact ${operation} publication`);
      }
      if (operation === 'salvage') {
        const retainedOwner = structuredClone(bundle);
        retainedOwner.afterDetail.diagnostics.retainedCount = 1;
        expect(assessArc2InventoryOperationOutcome(retainedOwner).reasons)
          .toContain('committed detail/lifecycle publication');
      }
      if (operation !== 'equip') {
        const releasedHoldDrift = structuredClone(bundle);
        releasedHoldDrift.afterState.engineering.actionCoordinator.hold = {
          phase: 'idle', operation: null,
        };
        expect(assessArc2InventoryOperationOutcome(releasedHoldDrift).reasons)
          .toContain('unrelated product continuity/owner release');
      }
      expect(assessArc2InventoryOperationOutcome(bundle).ok).toBe(true);
    }

    const committed = snapshots[4]!;
    const reloaded = snapshot({ ...specs[4]!, activePlayMs: 1_300 });
    const durability = {
      committed: committed.raw, reloaded: reloaded.raw,
      committedRuntime: committed.state.persistence.runtime,
      reloadedRuntime: reloaded.state.persistence.runtime,
    };
    expect(assessInventoryOperationSequenceDurability(durability, operations)).toEqual({ ok: true, reasons: [] });
    expect(assessInventoryOperationSequenceDurability(durability,
      [operations[1]!, operations[0]!, ...operations.slice(2)]).ok).toBe(false);
    const witnessDrift = structuredClone(durability);
    witnessDrift.reloaded.receiptRows[4]!.witness = 'arc2:pending-claim:4:wrong:4';
    witnessDrift.reloaded.receiptRawRows[4] = JSON.stringify(witnessDrift.reloaded.receiptRows[4]);
    expect(assessInventoryOperationSequenceDurability(witnessDrift, operations).ok).toBe(false);
    const missingPredecessor = structuredClone(durability);
    missingPredecessor.reloaded.receiptKeys.shift();
    missingPredecessor.reloaded.receiptRawRows.shift();
    missingPredecessor.reloaded.receiptRows.shift();
    expect(assessInventoryOperationSequenceDurability(missingPredecessor, operations).ok).toBe(false);
    expect(assessInventoryOperationSequenceDurability(durability, operations).ok).toBe(true);
  });
});
