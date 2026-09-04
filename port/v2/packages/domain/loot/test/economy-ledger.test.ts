import { describe, expect, it, vi } from 'vitest';
import {
  LEGACY_RESEARCH_SINKS_V1,
  LOOT_CATALOGUE_V1,
  auditEconomyCoverage,
  replayEconomyTrace,
  type EconomyCraftEvent,
  type EconomyReplayInput,
  type EconomySourceReceiptEvent,
} from '@cf/domain-loot';

const authority = [{ ownerId: 'arc3-world', version: 1 }] as const;

const initial = (overrides: Partial<EconomyReplayInput['initial']> = {}): EconomyReplayInput['initial'] => ({
  activePlayMs: 0,
  materials: {},
  itemCounts: {},
  stardust: 0,
  signatureIds: [],
  ...overrides,
});

const sourceReceipt = (
  overrides: Partial<EconomySourceReceiptEvent> = {},
): EconomySourceReceiptEvent => ({
  kind: 'source-receipt',
  receiptId: 'world-receipt-1',
  sourceOwnerId: 'arc3-world',
  sourceVersion: 1,
  sourceId: 'CF1|fixture-world',
  activePlayMs: 1_000,
  materials: { Al: 12, CH4: 2, Ca: 1, Fe: 8, H: 8, O: 2, Si: 8 },
  stardust: 30,
  ...overrides,
});

function jumpDriveTrace(): EconomyReplayInput {
  const sequence = [
    'wire', 'wire', 'wire', 'wire',
    'plate', 'plate',
    'chip', 'chip',
    'lens',
    'pellet', 'pellet',
    'cell',
    'coil', 'coil',
    'navcore',
    'fuelcell',
    'jumpdrive',
  ];
  const crafts: EconomyCraftEvent[] = sequence.map((baseId, index) => ({
    kind: 'craft',
    actionId: `craft-${index + 1}-${baseId}`,
    activePlayMs: 1_010 + index * 10,
    baseId,
  }));
  return {
    initial: initial(),
    sourceAuthorities: authority,
    events: [sourceReceipt(), ...crafts],
    target: { baseId: 'jumpdrive', quantity: 1 },
  };
}

describe('@cf/domain-loot — source-neutral economy ledger', () => {
  it('reports exact executable sink coverage without claiming Arc 3 source closure', () => {
    const audit = auditEconomyCoverage();
    expect(audit.valid).toBe(true);
    expect(audit.materialCount).toBe(47);
    expect(audit.recipeSinkMaterialIds).toHaveLength(33);
    expect(audit.researchSinkMaterialIds).toHaveLength(12);
    expect(audit.combinedSinkMaterialIds).toHaveLength(34);
    expect(audit.sinklessMaterialIds).toEqual([
      'Mg', 'Na', 'Cu', 'Zn', 'Sn', 'Mn', 'He', 'N', 'Cl', 'CO2', 'Th', 'Li', 'Co',
    ]);
    expect(audit.stardustSinks).toEqual({ itemRecipes: 320, research: 580, combined: 900 });
    expect(audit.sourceModelStatus).toBe('arc3-deferred');
    expect(LEGACY_RESEARCH_SINKS_V1).toHaveLength(6);

    const removed = LOOT_CATALOGUE_V1.map((definition) => definition.id === 'cg-proto'
      ? { ...definition, materialCost: Object.fromEntries(Object.entries(definition.materialCost).filter(([id]) => id !== 'Pro')) }
      : definition);
    const negative = auditEconomyCoverage(removed);
    expect(negative.combinedSinkMaterialIds).toHaveLength(33);
    expect(negative.sinklessMaterialIds).toEqual([...audit.sinklessMaterialIds, 'Pro']);
  });

  it('uses exact code-unit ordering without consulting ambient locale collation', () => {
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('economy authority must not consult ambient locale collation');
    });
    try {
      const audit = auditEconomyCoverage([
        { id: 'ordering-probe', materialCost: { 'ä': 1, a: 1, Z: 1 }, stardustCost: 0 },
      ], [], ['Z', 'a', 'ä']);
      expect(audit.valid).toBe(true);
      expect(audit.recipeSinkMaterialIds).toEqual(['Z', 'a', 'ä']);

      const replay = replayEconomyTrace({
        initial: initial({ materials: { Si: 1, C: 1, Al: 1 } }),
        sourceAuthorities: [],
        events: [],
        target: null,
      });
      expect(replay.status).toBe('replayed');
      if (replay.status !== 'replayed') return;
      expect(Object.keys(replay.state.materials)).toEqual(['Al', 'C', 'Si']);
      expect(localeCompare).not.toHaveBeenCalled();
    } finally {
      localeCompare.mockRestore();
    }
  });

  it('replays the exact raw-to-Jump-Drive trace deterministically without predicting an ETA', () => {
    const input = jumpDriveTrace();
    const first = replayEconomyTrace(input);
    const replay = replayEconomyTrace(structuredClone(input));
    expect(replay).toEqual(first);
    expect(first.status).toBe('replayed');
    if (first.status !== 'replayed') return;
    expect(first.state).toMatchObject({
      schema: 1,
      activePlayMs: 1_170,
      materials: {},
      itemCounts: { jumpdrive: 1 },
      stardust: 0,
      appliedReceiptIds: ['world-receipt-1'],
    });
    expect(first.state.appliedCraftActionIds).toHaveLength(17);
    expect(first.target).toEqual({
      status: 'reached-in-trace',
      baseId: 'jumpdrive',
      quantity: 1,
      observedAtActivePlayMs: 1_170,
      etaActivePlayMs: null,
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.state.materials)).toBe(true);
  });

  it('rejects duplicate receipts, backward active play, and overspend before partial settlement', () => {
    const receipt = sourceReceipt({ materials: { Fe: 4 }, stardust: 0 });
    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: authority,
      events: [receipt, { ...receipt, activePlayMs: 1_001 }],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'duplicate-receipt', eventIndex: 1 });

    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: authority,
      events: [receipt, { kind: 'craft', actionId: 'past-craft', activePlayMs: 999, baseId: 'plate' }],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'backward-active-play', eventIndex: 1 });

    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: [],
      events: [{ kind: 'craft', actionId: 'unfunded', activePlayMs: 1, baseId: 'plate' }],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'overspend', eventIndex: 0 });
  });

  it('rejects unknown assets and unbound, mismatched, or conflicting source versions', () => {
    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: authority,
      events: [sourceReceipt({ materials: { Unobtainium: 1 }, stardust: 0 })],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'unknown-asset' });

    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: authority,
      events: [sourceReceipt({ sourceVersion: 2 })],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'source-version-mismatch' });

    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: authority,
      events: [sourceReceipt({ sourceOwnerId: 'unbound-owner' })],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'unknown-source-owner' });

    expect(replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: [{ ownerId: 'arc3-world', version: 1 }, { ownerId: 'arc3-world', version: 1 }],
      events: [],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'source-authority-conflict' });
  });

  it('fails closed with a null ETA when Arc 3 has supplied no source model', () => {
    const result = replayEconomyTrace({
      initial: initial(),
      sourceAuthorities: [],
      events: [],
      target: { baseId: 'jumpdrive', quantity: 1 },
    });
    expect(result).toMatchObject({
      status: 'replayed',
      target: {
        status: 'source-model-absent',
        baseId: 'jumpdrive',
        quantity: 1,
        observedAtActivePlayMs: null,
        etaActivePlayMs: null,
      },
    });
  });
});
