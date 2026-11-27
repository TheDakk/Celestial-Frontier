/* The balance simulation's worlds and readers: real addressed worlds (the stars of the addressed census,
   fixtures/v1/recorded/census-addressed.json), the app's own descent odds and roster. */
import type { EngineeringCapabilitySnapshot } from '@cf/domain-loot';
import { projectWorldOpportunity, type WorldOpportunityRules } from '@cf/domain-opportunity';
import { systemFor } from '@cf/domain-worldgen';
import type { BalanceSources, BalanceWorld } from '@cf/domain-worldkinds';
import { resolveCF1WorldAddress } from '@cf/scene';
import { loadRecorded } from '../../../tests/support/v1-recorded.js';
import { descentOdds } from '../src/landing/descent-policy';
import { canonicalWorldRoster } from '../src/world/roster';

interface Place { readonly galaxy: { seed: number; x: number; y: number }; readonly star: { seed: number; x: number; y: number } }

/** Every world of the addressed census's stars, with no rules: the legacy worlds. */
export function addressedWorlds(): BalanceWorld[] {
  const places = (loadRecorded('census-addressed').cases as { group: string; input?: Place }[]).filter((c) => c.group === 'star').map((c) => c.input!);
  const worlds: BalanceWorld[] = [];
  for (const place of places) {
    for (const planet of systemFor(place.star.seed).planets) {
      const resolved = resolveCF1WorldAddress({ galaxy: place.galaxy, star: place.star, planet: { seed: planet.P.seed } });
      // Two planets of one star with one seed have no address of their own (the resolver refuses them): left out.
      if (resolved.ok) worlds.push({ address: resolved.address, rules: null });
    }
  }
  return worlds;
}

/** These capabilities (bare hands is no gear), a first landing with no storm and no wave-off, and the animals of the
    roster at epoch 0. */
export function balanceSources(capabilities: EngineeringCapabilitySnapshot): BalanceSources {
  return {
    capabilities,
    landing: (world, snapshot) => {
      const odds = descentOdds({
        planet: { seed: snapshot.source.planetSeed, type: snapshot.source.planetType }, band: snapshot.source.climateBand,
        stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
        ...(snapshot.descentRules === null ? {} : { rules: snapshot.descentRules }),
      });
      return { percent: odds.successPercent, damageMin: odds.damageMin, damageMax: odds.damageMax };
    },
    fauna: (world) => {
      const built = canonicalWorldRoster(world.address, 0, world.rules);
      if (!built.ok) throw new Error(built.message);
      return built.roster.view.all.filter((row) => (row as { kingdom?: unknown }).kingdom === 'fauna').length;
    },
  };
}

/** The worlds of one planet type that hold no life, so they can be mined. */
export function lifelessOf(worlds: readonly BalanceWorld[], type: string, rules: WorldOpportunityRules | null = null): BalanceWorld[] {
  return worlds.filter((world) => {
    const { planetType, biosphereKey } = projectWorldOpportunity(world.address).source;
    return planetType === type && biosphereKey === 'none';
  }).map((world) => ({ ...world, rules }));
}
