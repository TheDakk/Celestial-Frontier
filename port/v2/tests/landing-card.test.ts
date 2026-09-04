import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  createEmptyDescentWaveOffStateV1,
  projectDescentApproachV1,
  stageDescentWaveOffOutcomeV1,
} from '@cf/domain-opportunity';
import { createGearInventory, projectEngineeringCapabilities } from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import { resolveCF1WorldAddress } from '@cf/scene';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { projectLandingCardPresentationV1 } from '../apps/game/src/landing-card.js';

beforeAll(() => installCaptureHooks());

function address() {
  const resolved = resolveCF1WorldAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424_242, x: 560, y: 170 },
    planet: { seed: 132 },
  });
  if (!resolved.ok) throw new Error('test world did not resolve');
  return resolved.address;
}

function policy(options: Readonly<{
  waveOffs?: number;
  training?: boolean;
  alreadyLanded?: boolean;
  hull?: boolean;
}> = {}) {
  const world = address();
  let waveOffs = createEmptyDescentWaveOffStateV1();
  for (let count = 0; count < (options.waveOffs ?? 0); count += 1) {
    waveOffs = stageDescentWaveOffOutcomeV1(waveOffs, world, 'failure');
  }
  return projectDescentApproachV1({
    address: world,
    opportunity: projectWorldOpportunity(world),
    capabilities: projectEngineeringCapabilities(registerArc2EngineeringLoadout(
      createGearInventory(1), [],
    )),
    waveOffs,
    stormActive: false,
    trainingActive: options.training ?? false,
    alreadyLanded: options.alreadyLanded ?? false,
    reinforcedHull: options.hull ?? false,
  });
}

describe('Landing card presentation', () => {
  it('uses the exact projected chance, learned approach and nonlethal HP floor', () => {
    const projected = policy({ waveOffs: 1, hull: true });
    const card = projectLandingCardPresentationV1(projected, 4);
    expect(card.successPercent).toBe(projected.successPercent);
    expect(card.learnedApproachBonus).toBe(20);
    expect(card.label).toBe(`⛳ Land · ${projected.successPercent}%`);
    expect(card.damageMin).toBeLessThanOrEqual(card.damageMax);
    expect(card.damageMax).toBeLessThanOrEqual(3);
    expect(card.title).toContain('cannot defeat the explorer');
    expect(card.title).toContain('Learned exact-world approach +20%');
  });

  it('renders Training and known-world returns as safe zero-damage routes', () => {
    const training = projectLandingCardPresentationV1(policy({ training: true }), 10);
    const revisit = projectLandingCardPresentationV1(policy({ alreadyLanded: true }), 10);
    expect(training).toMatchObject({ label: '⛳ Land safely', damageMin: 0, damageMax: 0 });
    expect(revisit).toMatchObject({ label: '⛳ Return safely', damageMin: 0, damageMax: 0 });
  });

  it('rejects copied policy objects instead of trusting presentation input', () => {
    const projected = policy();
    expect(() => projectLandingCardPresentationV1({ ...projected }, 10)).toThrow(
      /owner-projected descent policy/u,
    );
    expect(() => projectLandingCardPresentationV1(projected, 0)).toThrow(/positive explorer HP/u);
  });
});
