import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GEAR_INVENTORY_SCHEMA,
  decodeGearInventory,
  makeGearSourceActionId,
  migrateLegacyGear,
  projectEngineeringCapabilities,
} from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import { navFromCanonicalCF1Address, resolveCF1StarAddress, resolveCF1WorldAddress } from '@cf/scene';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createEngineeringState,
  createLegacyEngineeringSeedResolver,
  economyReceiptFromFieldSamplesV1,
  economyReceiptFromStellarSkimV1,
  economyReceiptFromWorldMiningV1,
  migrateLegacyEngineeringState,
  planFixedFabrication,
  planStellarSkim,
  planWorldMining,
  projectFieldSamples,
  projectStarOpportunity,
  projectWorldOpportunity,
  type EngineeringStateV2,
} from '../src/index.js';
import { AMBIENT_READS, withoutAmbientSources } from '../../../../tests/support/ambient.js';

/* fixtures/current/opportunity.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the opportunity recorder): fixed fabrication plans; world mining on Mars
   (with an Auto-Extractor second load later on the clock); stellar skimming at a remnant star; and the
   economy receipts taken from them. The only clock is the injected active-play time; the receipt
   ordinal seeds generated-gear metadata. Mining and skimming capabilities are built from the loot
   package, as the recorder built them. The recorder installed the current game's capture hooks first;
   here the descriptors package imports them. */

type Json = Record<string, unknown>;
interface Input { baseId: string; assets: string; state: 'fresh' | 'mined'; activePlayMs: number; receiptOrdinal: number }
interface OpportunityFixture {
  freeGlobals: Record<string, string>;
  injected: Record<string, string>;
  world: { galaxy: { seed: number; x: number; y: number }; star: { seed: number; x: number; y: number }; planet: { seed: number } };
  assets: Record<string, Json>;
  fabrication: { input: Input; output: Json }[];
  mars: { galaxy: { seed: number; x: number; y: number }; star: { seed: number; x: number; y: number }; planet: { seed: number } };
  remnant: { galaxy: { seed: number; x: number; y: number }; star: { seed: number; x: number; y: number } };
  loadouts: Record<string, Loadout>;
  mining: { input: { loadout: string; activePlayMs: number; receiptOrdinal: number }; plan: Json; receipt: Json | null; receiptAtOtherClock: Json | null }[];
  autoExtractor: { input: { loadout: string; first: { activePlayMs: number; receiptOrdinal: number }; second: { activePlayMs: number; receiptOrdinal: number } }; plan: Json }[];
  skimming: { input: { loadout: string; playerHp: number; activePlayMs: number; receiptOrdinal: number }; plan: Json; receipt: Json | null; receiptAtOtherClock: Json | null }[];
  fieldSamples: { input: { landing: 'first'; training: boolean; activePlayMs: number }; receipt: Json }[];
}
interface Loadout { itemCounts: [string, number][]; equipped: Record<string, string>; equippedAffixes: Record<string, unknown>; systems: { baseId: string; count: number }[] }

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/opportunity.json', import.meta.url), 'utf8'),
) as OpportunityFixture;

const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');


function stateOf(name: 'fresh' | 'mined') {
  if (name === 'fresh') return createEngineeringState();
  const resolved = resolveCF1WorldAddress(fixture.world);
  if (!resolved.ok) throw new Error(`world did not resolve: ${resolved.reason}`);
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 2, worlds: [{ seed: fixture.world.planet.seed, extractionsTaken: 3 }], stars: [], research: [],
  }, createLegacyEngineeringSeedResolver({ worlds: [resolved.address], stars: [] }));
}

const answer = (input: Input) => plain(planFixedFabrication({
  state: stateOf(input.state), baseId: input.baseId, assets: structuredClone(fixture.assets[input.assets]) as never,
  activePlay: { activePlayMs: input.activePlayMs }, receiptOrdinal: input.receiptOrdinal,
}));

/* ---- mining, skimming and receipts, rebuilt exactly as the recorder built them ---- */

const gearSource = makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'opportunity-recorder', actionKey: 'items-v1', receiptId: 'migration:v4-v5' });
function capabilitiesOf(l: Loadout) {
  const migrated = migrateLegacyGear({ sourceActionId: gearSource, itemCounts: l.itemCounts, equipped: l.equipped, equippedAffixes: l.equippedAffixes } as never);
  const inventory = decodeGearInventory(JSON.stringify({
    schema: GEAR_INVENTORY_SCHEMA, revision: 1, capacity: 8,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped, pendingRewards: [],
  }));
  return projectEngineeringCapabilities(registerArc2EngineeringLoadout(inventory, l.systems as never));
}
const attempt = (fn: () => unknown) => { try { return fn(); } catch (error) { return { throws: String((error as Error).message) }; } };
function mars() {
  const address = resolveCF1WorldAddress(fixture.mars);
  if (!address.ok) throw new Error(address.reason);
  const nav = navFromCanonicalCF1Address(address.address);
  if (!nav.ok || nav.state.mode !== 'surface') throw new Error('Mars surface did not resolve');
  return { address: address.address, surface: nav.state };
}
function remnant() {
  const address = resolveCF1StarAddress(fixture.remnant);
  if (!address.ok) throw new Error(address.reason);
  const nav = navFromCanonicalCF1Address(address.address);
  if (!nav.ok || nav.state.mode !== 'system') throw new Error('remnant system did not resolve');
  return { address: address.address, system: nav.state };
}
const mine = (state: EngineeringStateV2, loadout: string, activePlay: unknown, receiptOrdinal: number) => {
  const m = mars();
  return planWorldMining({
    state, opportunity: projectWorldOpportunity(m.address, null), currentSurface: m.surface,
    capabilities: capabilitiesOf(fixture.loadouts[loadout]!), activePlay: activePlay as never, receiptOrdinal,
  });
};
const skim = (loadout: string, playerHp: number, activePlay: unknown, receiptOrdinal: number) => {
  const r = remnant();
  return planStellarSkim({
    state: createEngineeringState(), opportunity: projectStarOpportunity(r.address), currentSystem: r.system,
    capabilities: capabilitiesOf(fixture.loadouts[loadout]!), playerHp, activePlay: activePlay as never, receiptOrdinal,
  });
};
type Planned = { status: string; receiptOrdinal: number };
const receipt = (fn: (plan: never, options: never) => unknown, plan: Planned, activePlayMs: unknown) => attempt(() => fn(plan as never, { receiptId: `receipt-${plan.receiptOrdinal}`, activePlayMs } as never));
const miningAnswer = ({ input }: OpportunityFixture['mining'][number]) => {
  const plan = mine(createEngineeringState(), input.loadout, { activePlayMs: input.activePlayMs }, input.receiptOrdinal);
  const planned = plan.status === 'planned';
  return plain({ input, plan, receipt: planned ? receipt(economyReceiptFromWorldMiningV1, plan, input.activePlayMs) : null,
    receiptAtOtherClock: planned ? receipt(economyReceiptFromWorldMiningV1, plan, input.activePlayMs + 1) : null });
};
const autoExtractorAnswer = ({ input }: OpportunityFixture['autoExtractor'][number]) => {
  const first = mine(createEngineeringState(), input.loadout, { activePlayMs: input.first.activePlayMs }, input.first.receiptOrdinal);
  if (first.status !== 'planned') throw new Error(first.reason);
  return plain({ input, plan: mine(first.nextState, input.loadout, { activePlayMs: input.second.activePlayMs }, input.second.receiptOrdinal) });
};
const skimmingAnswer = ({ input }: OpportunityFixture['skimming'][number]) => {
  const plan = skim(input.loadout, input.playerHp, { activePlayMs: input.activePlayMs }, input.receiptOrdinal);
  const planned = plan.status === 'planned';
  return plain({ input, plan, receipt: planned ? receipt(economyReceiptFromStellarSkimV1, plan, input.activePlayMs) : null,
    receiptAtOtherClock: planned ? receipt(economyReceiptFromStellarSkimV1, plan, input.activePlayMs + 1) : null });
};
const fieldSamplesAnswer = ({ input }: OpportunityFixture['fieldSamples'][number]) => {
  const m = mars();
  const samples = projectFieldSamples({ address: m.address, opportunity: projectWorldOpportunity(m.address, null), landing: input.landing, training: input.training });
  return plain({ input, receipt: attempt(() => economyReceiptFromFieldSamplesV1(samples as never, { receiptId: 'land-receipt-1', activePlayMs: input.activePlayMs })) });
};
const replayAll = () => ({
  fabrication: fixture.fabrication.map(({ input }) => ({ input, output: answer(input) })),
  mining: fixture.mining.map(miningAnswer),
  autoExtractor: fixture.autoExtractor.map(autoExtractorAnswer),
  skimming: fixture.skimming.map(skimmingAnswer),
  fieldSamples: fixture.fieldSamples.map(fieldSamplesAnswer),
});
const recordedAll = () => ({ fabrication: fixture.fabrication, mining: fixture.mining, autoExtractor: fixture.autoExtractor, skimming: fixture.skimming, fieldSamples: fixture.fieldSamples });

const find = (where: Partial<Input>) => fixture.fabrication.find(({ input }) => (Object.keys(where) as (keyof Input)[]).every((k) => input[k] === where[k]))!;

describe('@cf/domain-opportunity — recorded fixed fabrication plans', () => {
  it('every recorded plan: gear, exceptional gear, a stackable part and the Auto-Extractor, on a fresh and a mined state', () => {
    expect(fixture.fabrication).toHaveLength(32);
    expect(fixture.fabrication.every(({ output }) => output.status === 'planned')).toBe(true);
    expect(fixture.fabrication.map(({ input }) => ({ input, output: answer(input) }))).toEqual(fixture.fabrication);
  });
});

describe('@cf/domain-opportunity — recorded mining, skimming and economy receipts', () => {
  it('every recorded Mars mining plan and its economy receipt, with and without mining gear', () => {
    expect(fixture.mining).toHaveLength(8);
    expect(fixture.mining.every(({ plan }) => plan.status === 'planned')).toBe(true);
    expect(fixture.mining.map(miningAnswer)).toEqual(fixture.mining);
  });

  it('every recorded skim at the remnant star: refused without the Jump Drive, planned with it', () => {
    expect(fixture.skimming.map(({ plan }) => plan.status)).toEqual([...Array(4).fill('refused'), ...Array(4).fill('planned')]);
    expect(fixture.skimming.map(skimmingAnswer)).toEqual(fixture.skimming);
  });

  it('every recorded field-sample receipt', () => {
    expect(fixture.fieldSamples.map(fieldSamplesAnswer)).toEqual(fixture.fieldSamples);
  });
});

/* Review Focus 3: the injected clock alone decides what it decides, and a plan never falls back to a
   device clock or Math.random. */
describe('@cf/domain-opportunity — injected clock and receipt', () => {
  it('the recorded plans differ when only the injected clock or only the receipt ordinal differs', () => {
    const base = { baseId: 'autoext', assets: 'plenty', state: 'mined' as const };
    const early = find({ ...base, activePlayMs: 0, receiptOrdinal: 4 }).output;
    const late = find({ ...base, activePlayMs: 90000, receiptOrdinal: 4 }).output;
    expect(early.witness).not.toBe(late.witness);
    expect(early.nextState).not.toEqual(late.nextState); // the Auto-Extractor re-anchors at the injected clock
    const gear4 = find({ baseId: 'meteor', assets: 'plenty', state: 'fresh', activePlayMs: 0, receiptOrdinal: 4 }).output;
    const gear5 = find({ baseId: 'meteor', assets: 'plenty', state: 'fresh', activePlayMs: 0, receiptOrdinal: 5 }).output;
    expect(gear4.result).not.toEqual(gear5.result); // the receipt seeds the generated gear
    for (const recorded of [early, late, gear4, gear5]) {
      const { input } = fixture.fabrication.find(({ output }) => output === recorded)!;
      expect(answer(input)).toEqual(answer(input));
      expect(answer(input)).toEqual(recorded);
    }
  });

  it('mining, the Auto-Extractor, skimming and their receipts: the injected clock alone decides', () => {
    // Mining: two clocks, same receipt: different witnesses; the receipt carries the plan's own clock and
    // is refused at any other clock.
    for (const loadout of ['none', 'mining']) {
      const [early, late] = [1000, 90000].map((t) => fixture.mining.find(({ input }) => input.loadout === loadout && input.receiptOrdinal === 3 && input.activePlayMs === t)!);
      expect(early!.plan.witness).not.toBe(late!.plan.witness);
      expect([early!.receipt!.activePlayMs, late!.receipt!.activePlayMs]).toEqual([1000, 90000]);
      for (const c of [early!, late!]) {
        expect(c.receiptAtOtherClock).toEqual({ throws: 'Mine receipt does not match its registered action witness' });
        expect(miningAnswer(c)).toEqual(miningAnswer(c));
        expect(miningAnswer(c)).toEqual(c);
      }
    }
    // The Auto-Extractor: from the same first load, the later the injected clock, the more loads collected.
    expect(fixture.autoExtractor.map(({ input }) => input.second.activePlayMs)).toEqual([601000, 3601000]);
    expect(fixture.autoExtractor.map(({ plan }) => (plan.result as { loads: number }).loads)).toEqual([2, 7]);
    expect(fixture.autoExtractor.map(autoExtractorAnswer)).toEqual(fixture.autoExtractor);
    // Skimming: two clocks, same receipt.
    const [early, late] = [2000, 90000].map((t) => fixture.skimming.find(({ input }) => input.loadout === 'jumpdrive' && input.receiptOrdinal === 4 && input.activePlayMs === t)!);
    expect(early!.plan.witness).not.toBe(late!.plan.witness);
    for (const c of [early!, late!]) {
      expect(c.receiptAtOtherClock).toEqual({ throws: 'Skim receipt does not match its registered action witness' });
      expect(skimmingAnswer(c)).toEqual(c);
    }
    // Field samples: the receipt's clock is exactly the injected one.
    expect(fixture.fieldSamples.map(({ receipt: r }) => r.activePlayMs)).toEqual([500, 90000]);
  });

  it('no recorded plan or receipt reads the device clock or Math.random', () => {
    withoutAmbientSources(() => {
      expect(replayAll()).toEqual(recordedAll());
    });
    // The guard itself works: each ambient source throws inside it.
    for (const read of AMBIENT_READS) expect(() => withoutAmbientSources(read)).toThrow(/^ambient /u);
  });

  it('throws when the clock is missing', () => {
    const { input } = fixture.fabrication[0]!;
    const plan = (activePlay: unknown) => planFixedFabrication({
      state: stateOf(input.state), baseId: input.baseId, assets: structuredClone(fixture.assets[input.assets]) as never,
      activePlay: activePlay as never, receiptOrdinal: input.receiptOrdinal,
    });
    const missing = /engineering action requires a bounded F4 active-play snapshot/u;
    expect(() => plan(undefined)).toThrow(missing);
    expect(() => plan({})).toThrow(missing);
    expect(() => plan({ activePlayMs: -1 })).toThrow(missing);
  });

  it('mining, skimming and every economy receipt throw when the clock is missing', () => {
    const missing = /engineering action requires a bounded F4 active-play snapshot/u;
    expect(() => mine(createEngineeringState(), 'mining', undefined, 3)).toThrow(missing);
    expect(() => mine(createEngineeringState(), 'mining', {}, 3)).toThrow(missing);
    expect(() => skim('jumpdrive', 100, undefined, 4)).toThrow(missing);
    expect(() => skim('jumpdrive', 100, {}, 4)).toThrow(missing);
    const mined = mine(createEngineeringState(), 'none', { activePlayMs: 1000 }, 3);
    const skimmed = skim('jumpdrive', 100, { activePlayMs: 2000 }, 4);
    if (mined.status !== 'planned' || skimmed.status !== 'planned') throw new Error('fixture plans refused');
    const unbounded = { throws: 'economy source active play must be bounded' };
    expect(receipt(economyReceiptFromWorldMiningV1, mined, undefined)).toEqual(unbounded);
    expect(receipt(economyReceiptFromStellarSkimV1, skimmed, undefined)).toEqual(unbounded);
    const m = mars();
    const samples = projectFieldSamples({ address: m.address, opportunity: projectWorldOpportunity(m.address, null), landing: 'first', training: false });
    expect(attempt(() => economyReceiptFromFieldSamplesV1(samples as never, { receiptId: 'land-receipt-1', activePlayMs: undefined } as never))).toEqual(unbounded);
    expect(attempt(() => economyReceiptFromWorldMiningV1(mined as never, { receiptId: 'no-clock' } as never)))
      .toEqual({ throws: 'economy source receipt options have unknown or missing fields' });
  });
});
