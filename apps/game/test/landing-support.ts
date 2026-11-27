// Worlds and a landing page for the landing and survey tests.
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { readWorldIdentity, worldIdentityRecord, loadDescentWaveOffAuthorityV1 } from '@cf/persistence';
import { descentWaveOffCountV1 } from '@cf/domain-opportunity';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import type { GameEvents } from '../src/events';
import { stageStarterCharterEventV1 } from '../src/guidance';
import { createLandingViews, settleLandingV1, type LandingActionOutcomeV1, type LandingSettleDepsV1, type LandingWorldRulesV1 } from '../src/landing';
import { worldRulesAt } from '../src/world';
import { actionPage, type ActionPageOptions } from './action-support';
import { NOW } from './save-support';

export const SOL = Object.freeze({ mercury: 131, venus: 132, earth: 133, mars: 134, jupiter: 135, saturn: 136, uranus: 137, neptune: 138 });

export function solWorld(seed: number): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed } });
  if (!resolved.ok) throw new Error(`world ${seed} did not resolve: ${resolved.reason}`);
  return resolved.address;
}

/** The world's generated type and climate band. */
export const worldFacts = (address: CanonicalCF1WorldAddress) => {
  const { source, effectiveTier, deposits } = projectWorldOpportunity(address, null);
  return { planet: { seed: address.planet.seed, type: source.planetType }, band: source.climateBand, effectiveTier, deposits };
};

/** A session seed whose first descent roll is at least `floor` (a wave-off at those odds) and whose first
 *  damage draw is `damage` or more of the way up the scrape's range. */
export function waveOffSession(floor = 0.5, damage = 0): number {
  for (let seed = 1; seed < 500; seed++) {
    const rng = createSessionRNG(seed);
    if (rng.at('descent.success', 0) >= floor && rng.at('descent.damage', 0) >= damage) return seed;
  }
  throw new Error('no session seed waves off');
}

/** A session seed whose first descent roll is below `ceiling`: a landing at any odds above it. */
export function landingSession(ceiling = 0.05): number {
  for (let seed = 1; seed < 500; seed++) if (createSessionRNG(seed).at('descent.success', 0) < ceiling) return seed;
  throw new Error('no session seed lands');
}

/** `rules` is the world system's answer for a world; the game's own unless a test brings rules of its own. */
export async function landingPage(options: ActionPageOptions = {}, rules: LandingWorldRulesV1 = worldRulesAt) {
  const page = await actionPage(options);
  const views = createLandingViews();
  const arrived: Array<GameEvents['landing:arrived']> = [];
  page.bus.on('landing:arrived', (event) => { arrived.push(event); });
  const deps: LandingSettleDepsV1 = { door: page.loop, bus: page.bus, views, charters: stageStarterCharterEventV1, rules };
  const land = (address: CanonicalCF1WorldAddress, worldName = 'A world'): Promise<LandingActionOutcomeV1> =>
    settleLandingV1(deps, { address, worldName, codecNow: NOW });
  return {
    ...page, views, arrived, deps, land,
    /** Presses Land until the world is stood on; every outcome, the landing last. */
    landUntilDown: async (address: CanonicalCF1WorldAddress): Promise<LandingActionOutcomeV1[]> => {
      const outcomes: LandingActionOutcomeV1[] = [];
      for (let press = 0; press < 8; press++) {
        const outcome = await land(address);
        outcomes.push(outcome);
        if (outcome.kind !== 'committed') throw new Error(`landing was ${outcome.kind}: ${'detail' in outcome ? outcome.detail : ''}`);
        if (outcome.facts.descent.kind === 'landed') return outcomes;
      }
      throw new Error('the world was never stood on');
    },
    /** Whether the world identity carrier holds this world as landed. */
    identityLanded: (address: CanonicalCF1WorldAddress): boolean => {
      const read = readWorldIdentity(page.runtime.extensions);
      if (read.kind !== 'loaded') throw new Error(`world identity was ${read.kind}`);
      return worldIdentityRecord(read.state, address)?.landed === true;
    },
    /** The wave-offs the carrier remembers for this world. */
    waveOffs: (address: CanonicalCF1WorldAddress): number => {
      const loaded = loadDescentWaveOffAuthorityV1({ extensions: page.runtime.extensions, legacyWaveOffs: page.durable().waveOffs });
      if (loaded.kind !== 'loaded') throw new Error(`wave-offs were ${loaded.reason}`);
      return descentWaveOffCountV1(loaded.state, address);
    },
  };
}
export type LandingPage = Awaited<ReturnType<typeof landingPage>>;
