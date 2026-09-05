import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { replayEconomyTrace } from '@cf/domain-loot';
import {
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
} from '@cf/scene';
import {
  ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1,
  ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
  ARC3_ECONOMY_SOURCE_MODEL_VERSION,
  ARC3_STELLAR_SKIM_SOURCE_OWNER_V1,
  ARC3_WORLD_MINING_SOURCE_OWNER_V1,
  createEngineeringState,
  economyReceiptFromFieldSamplesV1,
  economyReceiptFromStellarSkimV1,
  economyReceiptFromWorldMiningV1,
  planStellarSkim,
  planWorldMining,
  projectFieldSamples,
  projectStarOpportunity,
  projectWorldOpportunity,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

const SOL = Object.freeze({
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
});

function capabilities(...baseIds: string[]) {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: baseIds.map((id): [string, number] => [id, 1]), equip: {}, equipAff: {} },
    capacity: 8,
  });
  if (prepared.kind !== 'prepared') throw new Error(prepared.kind);
  const loadout = readArc2EngineeringLoadout(prepared.extensions);
  if (loadout.kind !== 'loaded') throw new Error(loadout.kind);
  return loadout.capabilities;
}

describe('@cf/domain-opportunity — registered economy source model', () => {
  it('adapts only real Mine results and preserves their exact decided quantities', () => {
    const addressResult = resolveCF1WorldAddress({ ...SOL, planet: { seed: 134 } });
    if (!addressResult.ok) throw new Error(addressResult.reason);
    const navResult = navFromCanonicalCF1Address(addressResult.address);
    if (!navResult.ok || navResult.state.mode !== 'surface') throw new Error('surface fixture failed');
    const plan = planWorldMining({
      state: createEngineeringState(),
      opportunity: projectWorldOpportunity(addressResult.address),
      currentSurface: navResult.state,
      capabilities: capabilities(),
      activePlay: { activePlayMs: 1_000 },
      receiptOrdinal: 3,
    });
    if (plan.status !== 'planned') throw new Error(plan.reason);
    const event = economyReceiptFromWorldMiningV1(plan, {
      receiptId: 'mine-receipt-3', activePlayMs: 1_000,
    });
    expect(event).toEqual({
      kind: 'source-receipt', receiptId: 'mine-receipt-3',
      sourceOwnerId: ARC3_WORLD_MINING_SOURCE_OWNER_V1,
      sourceVersion: ARC3_ECONOMY_SOURCE_MODEL_VERSION,
      sourceId: addressResult.address.key,
      activePlayMs: 1_000,
      materials: Object.fromEntries(plan.result.materials.map(({ id, quantity }) => [id, quantity])),
      stardust: 0,
    });
    expect(() => economyReceiptFromWorldMiningV1(structuredClone(plan), {
      receiptId: 'clone', activePlayMs: 1_000,
    })).toThrow('registered Mine plan');
    expect(() => economyReceiptFromWorldMiningV1(plan, {
      receiptId: 'wrong-time', activePlayMs: 999,
    })).toThrow('registered action witness');
  });

  it('adapts registered stellar Skim and first-landfall grants without copied source math', () => {
    const starResult = resolveCF1StarAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756 },
    });
    if (!starResult.ok) throw new Error(starResult.reason);
    const systemResult = navFromCanonicalCF1Address(starResult.address);
    if (!systemResult.ok || systemResult.state.mode !== 'system') throw new Error('system fixture failed');
    const skim = planStellarSkim({
      state: createEngineeringState(),
      opportunity: projectStarOpportunity(starResult.address),
      currentSystem: systemResult.state,
      capabilities: capabilities('jumpdrive'),
      playerHp: 100,
      activePlay: { activePlayMs: 2_000 },
      receiptOrdinal: 4,
    });
    if (skim.status !== 'planned') throw new Error(skim.reason);
    expect(economyReceiptFromStellarSkimV1(skim, {
      receiptId: 'skim-receipt-4', activePlayMs: 2_000,
    })).toMatchObject({
      sourceOwnerId: ARC3_STELLAR_SKIM_SOURCE_OWNER_V1,
      sourceId: starResult.address.key,
      materials: { [skim.result.material]: skim.result.quantity },
      stardust: 0,
    });

    const worldResult = resolveCF1WorldAddress({ ...SOL, planet: { seed: 134 } });
    if (!worldResult.ok) throw new Error(worldResult.reason);
    const samples = projectFieldSamples({
      address: worldResult.address,
      opportunity: projectWorldOpportunity(worldResult.address),
      landing: 'first',
      training: false,
    });
    if (samples.kind !== 'grant') throw new Error(samples.reason);
    const sampleEvent = economyReceiptFromFieldSamplesV1(samples, {
      receiptId: 'land-receipt-1', activePlayMs: 500,
    });
    expect(sampleEvent).toMatchObject({
      sourceOwnerId: ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1,
      sourceId: worldResult.address.key,
      stardust: samples.reward.stardust,
    });
    expect(sampleEvent.materials).toEqual(Object.fromEntries(
      samples.reward.materials.map(({ id, quantity }) => [id, quantity]),
    ));
    expect(() => economyReceiptFromFieldSamplesV1(structuredClone(samples), {
      receiptId: 'clone', activePlayMs: 500,
    })).toThrow('registered grant');
  });

  it('binds all three exact owners and lets the neutral ledger reject duplicates and version drift', () => {
    expect(ARC3_ECONOMY_SOURCE_AUTHORITIES_V1).toEqual([
      { ownerId: ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1, version: 1 },
      { ownerId: ARC3_WORLD_MINING_SOURCE_OWNER_V1, version: 1 },
      { ownerId: ARC3_STELLAR_SKIM_SOURCE_OWNER_V1, version: 1 },
    ]);
    const event = Object.freeze({
      kind: 'source-receipt' as const,
      receiptId: 'sample-1',
      sourceOwnerId: ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1,
      sourceVersion: 1,
      sourceId: 'CF1|source',
      activePlayMs: 1,
      materials: Object.freeze({ Fe: 1 }),
      stardust: 0,
    });
    const initial = {
      activePlayMs: 0, materials: {}, itemCounts: {}, stardust: 0, signatureIds: [],
    } as const;
    expect(replayEconomyTrace({
      initial, sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
      events: [event, event], target: null,
    })).toMatchObject({ status: 'rejected', reason: 'duplicate-receipt', eventIndex: 1 });
    expect(replayEconomyTrace({
      initial, sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
      events: [{ ...event, sourceVersion: 2 }], target: null,
    })).toMatchObject({ status: 'rejected', reason: 'source-version-mismatch', eventIndex: 0 });
  });
});
