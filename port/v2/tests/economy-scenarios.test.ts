import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  FIXED_RECIPE_AUTHORITY,
  createGearInstance,
  createGearInventory,
  getFixedCraftGenerationPlan,
  grantGear,
  makeGearSourceActionId,
  replayEconomyTrace,
  type EconomyLedgerSnapshot,
  type EconomyReplayResult,
  type EconomyTraceEvent,
} from '@cf/domain-loot';
import {
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
  ARC3_ECONOMY_SOURCE_MODEL_VERSION,
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createLegacyEngineeringSeedResolver,
  economyReceiptFromFieldSamplesV1,
  economyReceiptFromWorldMiningV1,
  migrateLegacyEngineeringState,
  planFixedFabrication,
  planResearchPurchase,
  planWorldMining,
  projectFieldSamples,
  projectWorldOpportunity,
  type EngineeringStateV2,
  type ResearchId,
} from '@cf/domain-opportunity';

beforeAll(() => installCaptureHooks());

type ScheduleRow =
  | Readonly<{ kind: 'field-samples'; receiptId: string; activePlayMs: number }>
  | Readonly<{ kind: 'mine-world'; receiptId: string; receiptOrdinal: number; activePlayMs: number }>
  | Readonly<{ kind: 'craft'; actionId: string; receiptOrdinal: number; baseId: string; activePlayMs: number }>
  | Readonly<{ kind: 'research'; actionId: string; receiptOrdinal: number; researchId: ResearchId; activePlayMs: number }>;

interface TraceScenario {
  readonly id: 'fresh-save' | 'first-return' | 'mid-reach';
  readonly priorExtractions: number;
  readonly initial: EconomyLedgerSnapshot;
  readonly schedule: readonly ScheduleRow[];
  readonly target: Parameters<typeof replayEconomyTrace>[0]['target'];
  readonly expected: unknown;
}

interface CapacityScenario {
  readonly capacity: number;
  readonly schedule: readonly Readonly<{
    activePlayMs: number;
    receiptId: string;
    baseId: string;
    generationSeed: number;
  }>[];
  readonly expected: unknown;
}

interface ScenarioFixture {
  readonly schema: 'cf-v2-economy-scenarios/v1';
  readonly sourceModelVersion: number;
  readonly world: Readonly<{
    galaxy: Readonly<{ seed: number; x: number; y: number }>;
    star: Readonly<{ seed: number; x: number; y: number }>;
    planet: Readonly<{ seed: number }>;
  }>;
  readonly scenarios: readonly TraceScenario[];
  readonly fullInventory: CapacityScenario;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, '..', 'tools', 'fixtures', 'economy-scenarios-v1.json');
const fixtureRaw = fs.readFileSync(fixturePath, 'utf8');
const fixture = JSON.parse(fixtureRaw) as ScenarioFixture;

function persistedCapabilities() {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: [], equip: {}, equipAff: {} },
    capacity: 8,
  });
  if (prepared.kind !== 'prepared') throw new Error(`scenario loadout was ${prepared.kind}`);
  const loaded = readArc2EngineeringLoadout(prepared.extensions);
  if (loaded.kind !== 'loaded') throw new Error(`scenario capabilities were ${loaded.kind}`);
  return loaded.capabilities;
}

function registeredWorld(): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress(fixture.world);
  if (!resolved.ok) throw new Error(`scenario world was ${resolved.reason}`);
  return resolved.address;
}

function registeredEngineering(
  world: CanonicalCF1WorldAddress,
  scenario: TraceScenario,
): EngineeringStateV2 {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: scenario.priorExtractions,
    worlds: scenario.priorExtractions === 0
      ? []
      : [{ seed: world.planet.seed, extractionsTaken: scenario.priorExtractions }],
    stars: [],
    research: scenario.initial.researchIds ?? [],
  }, createLegacyEngineeringSeedResolver({ worlds: [world], stars: [] }));
}

function replayPrefix(
  scenario: TraceScenario,
  events: readonly EconomyTraceEvent[],
): Extract<EconomyReplayResult, { status: 'replayed' }> {
  const result = replayEconomyTrace({
    initial: scenario.initial,
    sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
    events,
    target: null,
  });
  if (result.status !== 'replayed') {
    throw new Error(`scenario ${scenario.id} prefix was ${result.reason}: ${result.detail}`);
  }
  return result;
}

function executeTraceScenario(scenario: TraceScenario): EconomyReplayResult {
  const world = registeredWorld();
  const opportunity = projectWorldOpportunity(world);
  const nav = navFromCanonicalCF1Address(world);
  if (!nav.ok || nav.state.mode !== 'surface') throw new Error('scenario world has no SurfaceNav');
  const capabilities = persistedCapabilities();
  let engineering = registeredEngineering(world, scenario);
  const events: EconomyTraceEvent[] = [];

  for (const row of scenario.schedule) {
    const prefix = replayPrefix(scenario, events);
    if (row.kind === 'field-samples') {
      const projection = projectFieldSamples({
        address: world,
        opportunity,
        landing: 'first',
        training: false,
      });
      if (projection.kind !== 'grant') throw new Error(`field samples were ${projection.reason}`);
      events.push(economyReceiptFromFieldSamplesV1(projection, {
        receiptId: row.receiptId,
        activePlayMs: row.activePlayMs,
      }));
      continue;
    }
    if (row.kind === 'mine-world') {
      const plan = planWorldMining({
        state: engineering,
        opportunity,
        currentSurface: nav.state,
        capabilities,
        activePlay: { activePlayMs: row.activePlayMs },
        receiptOrdinal: row.receiptOrdinal,
      });
      if (plan.status !== 'planned') throw new Error(`Mine was ${plan.reason}`);
      events.push(economyReceiptFromWorldMiningV1(plan, {
        receiptId: row.receiptId,
        activePlayMs: row.activePlayMs,
      }));
      engineering = plan.nextState;
      continue;
    }
    if (row.kind === 'craft') {
      const plan = planFixedFabrication({
        state: engineering,
        baseId: row.baseId,
        assets: {
          materials: prefix.state.materials,
          exceptionalMaterials: {},
          itemCounts: prefix.state.itemCounts,
          stardust: prefix.state.stardust,
          signatureIds: prefix.state.signatureIds,
        },
        activePlay: { activePlayMs: row.activePlayMs },
        receiptOrdinal: row.receiptOrdinal,
      });
      if (plan.status !== 'planned') throw new Error(`Craft was ${plan.reason}`);
      events.push({
        kind: 'craft',
        actionId: row.actionId,
        activePlayMs: row.activePlayMs,
        baseId: row.baseId,
      });
      engineering = plan.nextState;
      continue;
    }
    const jumpDriveOwned = (prefix.state.itemCounts.jumpdrive ?? 0) > 0;
    const plan = planResearchPurchase({
      state: engineering,
      researchId: row.researchId,
      jumpDriveOwned,
      assets: { materials: prefix.state.materials, stardust: prefix.state.stardust },
      receiptOrdinal: row.receiptOrdinal,
    });
    if (plan.status !== 'planned') throw new Error(`Research was ${plan.reason}`);
    events.push({
      kind: 'research',
      actionId: row.actionId,
      activePlayMs: row.activePlayMs,
      researchId: row.researchId,
    });
    engineering = plan.nextState;
  }

  return replayEconomyTrace({
    initial: scenario.initial,
    sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
    events,
    target: scenario.target,
  });
}

function executeCapacityScenario(scenario: CapacityScenario) {
  let inventory = createGearInventory(scenario.capacity);
  const locations: string[] = [];
  for (const [ordinal, row] of scenario.schedule.entries()) {
    const sourceActionId = makeGearSourceActionId({
      kind: 'craft',
      ownerId: FIXED_RECIPE_AUTHORITY,
      actionKey: `recipe:${row.baseId}`,
      receiptId: row.receiptId,
    });
    const instance = createGearInstance(
      sourceActionId,
      ordinal,
      getFixedCraftGenerationPlan(row.baseId, row.generationSeed),
    );
    const granted = grantGear(inventory, inventory.revision, instance);
    if (granted.status !== 'committed') throw new Error(`capacity grant was ${granted.status}`);
    locations.push(granted.location);
    inventory = granted.state;
  }
  return {
    schema: inventory.schema,
    revision: inventory.revision,
    capacity: inventory.capacity,
    entryIds: inventory.entries.map(({ instance }) => instance.instanceId),
    pendingIds: inventory.pendingRewards.map(({ instance }) => instance.instanceId),
    locations,
    activePlaySchedule: scenario.schedule.map(({ activePlayMs }) => activePlayMs),
  };
}

describe('Arc 2 analytical economy scenarios', () => {
  it('pins the versioned inputs and explicit active-play schedule', () => {
    expect(fixture.schema).toBe('cf-v2-economy-scenarios/v1');
    expect(fixture.sourceModelVersion).toBe(ARC3_ECONOMY_SOURCE_MODEL_VERSION);
    expect(fixture.scenarios.map(({ id }) => id)).toEqual([
      'fresh-save', 'first-return', 'mid-reach',
    ]);
    const fresh = fixture.scenarios[0]!.expected as Extract<EconomyReplayResult, { status: 'replayed' }>;
    const firstReturn = fixture.scenarios[1]!;
    expect(firstReturn.initial).toEqual({
      activePlayMs: fresh.state.activePlayMs,
      materials: fresh.state.materials,
      itemCounts: fresh.state.itemCounts,
      stardust: fresh.state.stardust,
      signatureIds: fresh.state.signatureIds,
      researchIds: fresh.state.researchIds,
    });
    for (const scenario of fixture.scenarios) {
      const times = scenario.schedule.map(({ activePlayMs }) => activePlayMs);
      expect(times.every((time, index) => index === 0
        ? time >= scenario.initial.activePlayMs
        : time >= times[index - 1]!)).toBe(true);
    }
    expect(fixture.fullInventory.schedule.map(({ activePlayMs }) => activePlayMs))
      .toEqual([200_000, 201_000]);
  });

  it('replays fresh-save, first-return, and mid-reach through registered planners byte-identically', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');
    try {
      for (const scenario of fixture.scenarios) {
        const first = executeTraceScenario(scenario);
        const second = executeTraceScenario(structuredClone(scenario));
        expect(JSON.stringify(second)).toBe(JSON.stringify(first));
        expect(first).toEqual(scenario.expected);
        if (first.status === 'replayed' && first.target !== null) {
          expect(first.target.etaActivePlayMs).toBeNull();
        }
      }
      expect(random).not.toHaveBeenCalled();
      expect(now).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
  });

  it('puts the second exact reward in pending state when Inventory is full', () => {
    const first = executeCapacityScenario(fixture.fullInventory);
    const second = executeCapacityScenario(structuredClone(fixture.fullInventory));
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first).toEqual(fixture.fullInventory.expected);
  });

  it('fails closed for source-version drift, source removal, and backward active play', () => {
    const fresh = fixture.scenarios[0]!;
    const world = registeredWorld();
    const opportunity = projectWorldOpportunity(world);
    const projection = projectFieldSamples({
      address: world, opportunity, landing: 'first', training: false,
    });
    if (projection.kind !== 'grant') throw new Error(projection.reason);
    const event = economyReceiptFromFieldSamplesV1(projection, {
      receiptId: 'control-source', activePlayMs: 100,
    });
    expect(replayEconomyTrace({
      initial: fresh.initial,
      sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
      events: [{ ...event, sourceVersion: event.sourceVersion + 1 }],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'source-version-mismatch' });
    expect(replayEconomyTrace({
      initial: fresh.initial,
      sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1.filter(
        ({ ownerId }) => ownerId !== event.sourceOwnerId,
      ),
      events: [event],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'unknown-source-owner' });
    expect(replayEconomyTrace({
      initial: fresh.initial,
      sourceAuthorities: ARC3_ECONOMY_SOURCE_AUTHORITIES_V1,
      events: [event, {
        kind: 'craft', actionId: 'backward-control', activePlayMs: 99, baseId: 'plate',
      }],
      target: null,
    })).toMatchObject({ status: 'rejected', reason: 'backward-active-play', eventIndex: 1 });
  });
});
