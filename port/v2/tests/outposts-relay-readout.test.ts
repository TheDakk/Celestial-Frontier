/** D14 Outposts P5 — the Survey Relay's reward: the star card's relay rows are EXACTLY the orbit readout Deep Scanners gives from inside
 * the system (the same projector on a real system nav), for every lifeless non-Earth world; nothing without Deep Scanners; never Earth. */
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, migrateLegacyEngineeringState } from '@cf/domain-opportunity';
import { navFromCanonicalCF1Address, resolveCF1StarAddress, resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { projectOrbitalMineralSurveyRow, projectRelayMineralSurveyRowsV1 } from '../apps/game/src/engineering-panel-model.js';

const GAL = { seed: 999, x: 90, y: -60 }, SOL = { seed: 424242, x: 560, y: 170 };
const engineering = (research: string[]) => migrateLegacyEngineeringState({ schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 0, worlds: [], stars: [], research },
  { resolveWorldSeed: () => [], resolveStarSeed: () => [] });

beforeAll(() => installCaptureHooks());
describe('Survey Relay readout (P5)', () => {
  it('equals the in-orbit Deep Scanner readout world by world; nothing without Deep Scanners; Earth never', () => {
    const planets = systemScene(SOL.seed).planets;
    const worlds = planets.flatMap((q, i) => { const r = resolveCF1WorldAddress({ galaxy: GAL, star: SOL, planet: { seed: q.seed } }); return r.ok ? [{ address: r.address, name: `W${i}` }] : []; });
    expect(worlds.length).toBeGreaterThan(3);
    const star = resolveCF1StarAddress({ galaxy: GAL, star: SOL }); if (!star.ok) throw new Error('star');
    const nav = navFromCanonicalCF1Address(star.address); if (!nav.ok || nav.state.mode !== 'system') throw new Error('nav');
    const eng = engineering(['scan1']);
    const relay = projectRelayMineralSurveyRowsV1({ engineering: eng, worlds });
    const orbit = worlds.flatMap((w) => { const row = projectOrbitalMineralSurveyRow({ engineering: eng, nav: nav.state, address: w.address }); return row ? [{ key: `📡 ${w.name}`, value: row.value }] : []; });
    expect(orbit.length, 'the fixture must exercise real readouts').toBeGreaterThan(0);
    expect(relay).toEqual(orbit);
    expect(relay.some((r) => r.key === `📡 W${planets.findIndex((q) => q.seed === 133)}`)).toBe(false); // Earth is protected
    // control: without Deep Scanners the relay shows nothing (the orbit rule withholds it too)
    expect(projectRelayMineralSurveyRowsV1({ engineering: engineering([]), worlds })).toEqual([]);
  });
});
