/* The balance simulation: what worlds pay, measured by the game's own rules. Each world is given its address and the
   rules it plays by (a new type's, or none); its snapshot, its pulls and its first landing's sample are the
   opportunity package's own (projectWorldOpportunity, planWorldMining, projectFieldSamples), and its landing and its
   animals are read by the app's descent odds and roster, handed in. No formula of the game is written here again.

   The margin (the designs' rule): on a new type, no measure may be more than 1.15 times the best existing world's at
   the same stage. The best existing world is the best class of like worlds, by the mean of its worlds: one world's
   own pulls are too few to be its expectation. */
import type { EngineeringCapabilitySnapshot } from '@cf/domain-loot';
import {
  createEngineeringState, planWorldMining, projectFieldSamples, projectWorldOpportunity,
  type WorldOpportunityRules, type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import { navFromCanonicalCF1Address, type CanonicalCF1WorldAddress } from '@cf/scene';

export const BALANCE_MARGIN = 1.15;

export interface BalanceWorld {
  readonly address: CanonicalCF1WorldAddress;
  /** The rules the world plays by; null is the legacy rules. */
  readonly rules: WorldOpportunityRules | null;
}

export interface BalanceSources {
  /** What the explorer wears and has built: the yield and the strike odds of every pull. Bare hands is no gear. */
  readonly capabilities: EngineeringCapabilitySnapshot;
  /** A first landing as the game works it out: no storm, no wave-off, this gear. */
  landing(world: BalanceWorld, snapshot: WorldOpportunitySnapshot): { readonly percent: number; readonly damageMin: number; readonly damageMax: number };
  /** The animals of the world's roster. */
  fauna(world: BalanceWorld): number;
}

/** One world's measures. */
export interface WorldMeasure {
  readonly world: BalanceWorld;
  readonly snapshot: WorldOpportunitySnapshot;
  /** The pulls taken; 0 on a world that cannot be mined (it has life, or it is Earth). */
  readonly pulls: number;
  /** Units of each material a pull, over the pulls taken. */
  readonly unitsAPull: ReadonlyMap<string, number>;
  /** Units of every material over the whole reserve, at the rate of the pulls taken. */
  readonly reserveUnits: number;
  readonly landingPercent: number;
  /** The scrape of a wave-off, the middle of its range. */
  readonly hpAWaveOff: number;
  readonly fauna: number;
  /** The Stardust of the first landing's sample. */
  readonly stardustFirst: number;
}

export interface BalanceResult {
  /** The worlds of the tier asked for: every measure is over these. */
  readonly measured: readonly WorldMeasure[];
  /** Of those, the worlds that could be mined: the units are over these. */
  readonly mined: number;
  readonly unitsAPull: ReadonlyMap<string, number>;
  readonly reserveUnits: number;
  readonly landingPercent: number;
  readonly hpAWaveOff: number;
  readonly faunaAWorld: number;
  readonly stardustFirst: number;
}

const mean = (values: readonly number[]): number => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

function measure(world: BalanceWorld, snapshot: WorldOpportunitySnapshot, pulls: number, sources: BalanceSources): WorldMeasure {
  const nav = navFromCanonicalCF1Address(world.address);
  if (!nav.ok || nav.state.mode !== 'surface') throw new Error('a world of the simulation has no surface');
  const totals = new Map<string, number>();
  let state = createEngineeringState();
  let taken = 0;
  for (; taken < Math.min(pulls, snapshot.reservePulls); taken++) {
    const plan = planWorldMining({
      state, opportunity: snapshot, currentSurface: nav.state, capabilities: sources.capabilities, activePlay: { activePlayMs: 0 }, receiptOrdinal: taken + 1,
    });
    // A living world and Earth are not mined (the planner's own refusals): they have no units.
    if (plan.status !== 'planned') break;
    for (const { id, quantity } of plan.result.materials) totals.set(id, (totals.get(id) ?? 0) + quantity);
    state = plan.nextState;
  }
  const unitsAPull = new Map([...totals].map(([id, units]) => [id, units / taken]));
  const landing = sources.landing(world, snapshot);
  const sample = projectFieldSamples({ address: world.address, opportunity: snapshot, landing: 'first', training: false });
  return {
    world, snapshot, pulls: taken, unitsAPull,
    reserveUnits: [...unitsAPull.values()].reduce((sum, units) => sum + units, 0) * snapshot.reservePulls,
    landingPercent: landing.percent,
    hpAWaveOff: (landing.damageMin + landing.damageMax) / 2,
    fauna: sources.fauna(world),
    stardustFirst: sample.kind === 'grant' ? sample.reward.stardust : 0,
  };
}

/** The mean units of each material a pull over these worlds: a material a world lacks counts as none there. */
export function meanUnitsAPull(worlds: readonly WorldMeasure[]): ReadonlyMap<string, number> {
  const totals = new Map<string, number>();
  for (const world of worlds) for (const [id, units] of world.unitsAPull) totals.set(id, (totals.get(id) ?? 0) + units);
  return new Map([...totals].map(([id, units]) => [id, units / worlds.length]));
}

/** Measures the worlds whose tier is `tier`, taking `pulls` pulls of each that can be mined. */
export function simulate(input: { readonly worlds: readonly BalanceWorld[]; readonly tier: number; readonly pulls: number }, sources: BalanceSources): BalanceResult {
  if (!Number.isInteger(input.pulls) || input.pulls < 1) throw new RangeError('the simulation takes a whole number of pulls, 1 or more');
  const measured: WorldMeasure[] = [];
  for (const world of input.worlds) {
    const snapshot = projectWorldOpportunity(world.address, world.rules);
    if (snapshot.effectiveTier === input.tier) measured.push(measure(world, snapshot, input.pulls, sources));
  }
  const mined = measured.filter((world) => world.pulls > 0);
  return {
    measured,
    mined: mined.length,
    unitsAPull: meanUnitsAPull(mined),
    reserveUnits: mean(mined.map((world) => world.reserveUnits)),
    landingPercent: mean(measured.map((world) => world.landingPercent)),
    hpAWaveOff: mean(measured.map((world) => world.hpAWaveOff)),
    faunaAWorld: mean(measured.map((world) => world.fauna)),
    stardustFirst: mean(measured.map((world) => world.stardustFirst)),
  };
}

/** The best existing world by a measure: of the classes of like worlds, the highest mean. Null when there is none. */
export function bestExisting(
  worlds: readonly WorldMeasure[],
  measureOf: (world: WorldMeasure) => number,
  classOf: (world: WorldMeasure) => string,
): { readonly cls: string; readonly worlds: number; readonly value: number } | null {
  const classes = new Map<string, number[]>();
  for (const world of worlds) {
    const cls = classOf(world);
    classes.set(cls, [...(classes.get(cls) ?? []), measureOf(world)]);
  }
  let best: { cls: string; worlds: number; value: number } | null = null;
  for (const [cls, values] of classes) {
    const value = mean(values);
    if (best === null || value > best.value) best = { cls, worlds: values.length, value };
  }
  return best;
}

/** Whether a new type's measure is inside the margin of the best existing world's. */
export function withinMargin(newValue: number, best: number, margin: number = BALANCE_MARGIN): boolean {
  return newValue <= best * margin;
}
