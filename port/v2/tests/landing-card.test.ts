import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { projectDescentApproachV1 } from '../apps/game/src/descent-policy.js';
import {
  createEmptyDescentWaveOffStateV1,
  stageDescentWaveOffOutcomeV1,
} from '@cf/domain-opportunity';
import { prepareArc2LootLegacyMigration, readArc2EngineeringLoadout } from '@cf/persistence';
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
  guaranteedGear?: boolean;
}> = {}) {
  const world = address();
  let waveOffs = createEmptyDescentWaveOffStateV1();
  for (let count = 0; count < (options.waveOffs ?? 0); count += 1) {
    waveOffs = stageDescentWaveOffOutcomeV1(waveOffs, world, 'failure');
  }
  const gear = options.guaranteedGear === true;
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: gear ? [['anchor', 1]] : [], equip: gear ? { module: 'anchor' } : {}, equipAff: {} },
    capacity: 8,
  });
  if (prepared.kind !== 'prepared') throw new Error(`card loadout migration was ${prepared.kind}`);
  const loadout = readArc2EngineeringLoadout(prepared.extensions);
  if (loadout.kind !== 'loaded') throw new Error(`card loadout was ${loadout.kind}`);
  return projectDescentApproachV1({
    address: world,
    opportunity: projectWorldOpportunity(world),
    capabilities: loadout.capabilities,
    waveOffs,
    stormActive: false,
    trainingActive: options.training ?? false,
    alreadyLanded: options.alreadyLanded ?? false,
  });
}

describe('Landing card presentation', () => {
  it('uses the exact projected chance, learned approach and nonlethal HP floor', () => {
    const projected = policy({ waveOffs: 1 });
    const card = projectLandingCardPresentationV1(projected, 4);
    expect(card.successPercent).toBe(projected.successPercent);
    expect(card.learnedApproachBonus).toBe(20);
    expect(card.label).toBe(`⛳ Land · ${projected.successPercent}%`);
    expect(card.damageMin).toBeLessThanOrEqual(card.damageMax);
    expect(card.damageMax).toBeLessThanOrEqual(3);
    expect(card.disclosure).toContain('at least 1 HP remains');
    expect(card.disclosure).toContain('Learned exact-world approach +20%');
    expect(card.disclosure).toContain(`Wave-off: ${card.damageMin}–${card.damageMax} HP`);
  });

  it('renders Training and known-world returns as safe zero-damage routes', () => {
    const training = projectLandingCardPresentationV1(policy({ training: true }), 10);
    const revisit = projectLandingCardPresentationV1(policy({ alreadyLanded: true }), 10);
    expect(training).toMatchObject({ label: '⛳ Land safely', damageMin: 0, damageMax: 0 });
    expect(revisit).toMatchObject({ label: '⛳ Return safely', damageMin: 0, damageMax: 0 });
  });

  it.each([
    ['learned approach', { waveOffs: 5 }],
    ['landing gear', { guaranteedGear: true }],
  ] as const)('discloses a %s guarantee as zero risk on an unfamiliar world', (_reason, options) => {
    const projected = policy(options);
    expect(projected.safeReason).toBeNull();
    expect(projected.successPercent).toBe(100);
    const card = projectLandingCardPresentationV1(projected, 9);
    expect(card).toMatchObject({ label: '⛳ Land safely', damageMin: 0, damageMax: 0 });
    expect(card.disclosure).toContain('Guaranteed arrival · 0 HP descent risk');
    expect(card.title).not.toContain('wave-off');
    if ('waveOffs' in options) expect(card.disclosure).toContain('Learned exact-world approach +100%');
  });

  it('rejects copied policy objects instead of trusting presentation input', () => {
    const projected = policy();
    expect(() => projectLandingCardPresentationV1({ ...projected }, 10)).toThrow(
      /owner-projected descent policy/u,
    );
    expect(() => projectLandingCardPresentationV1(projected, 0)).toThrow(/positive explorer HP/u);
  });
});
