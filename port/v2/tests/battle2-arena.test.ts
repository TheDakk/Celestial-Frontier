import { afterEach, describe, expect, it, vi } from 'vitest';
import { COMBATANT_HEIGHT_FRACTION, PARALLAX_RATES, RUN_UP_FRACTION, STAND_X, combatantScale, composeArena, parallaxOffset, selectArena } from '../apps/game/src/battle2/arena.js';

const RECIPE = { id: 'earth-temperate-proof', groundLineNormalized: 0.78, plates: { far: { width: 1672, height: 941 }, mid: { width: 1672, height: 941 }, near: { width: 1672, height: 941 } } };
const FRAME = { width: 1024, height: 576 };

describe('arena composition (kit §7 ARENA)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('puts the stands at x = 1/3 and 2/3 on the ground line and scales plates to cover plus their parallax overscan', () => {
    const L = composeArena(RECIPE, FRAME);
    expect(L.stands.left).toEqual({ x: STAND_X.left, y: 0.78 }); expect(L.stands.right).toEqual({ x: STAND_X.right, y: 0.78 });
    expect(L.groundLinePx).toBeCloseTo(0.78 * 576); expect(L.runUp).toBeCloseTo((2 / 3 - 1 / 3) * RUN_UP_FRACTION);
    expect(L.plates.map((p) => p.id)).toEqual(['far', 'mid', 'near']);
    for (const p of L.plates) {
      expect(p.rate).toBe(PARALLAX_RATES[p.id]);
      expect(p.width).toBeGreaterThanOrEqual(FRAME.width + 2 * p.rate * L.runUpPx - 1e-6); // room for the parallax shift
      expect(p.height).toBeGreaterThanOrEqual(FRAME.height - 1e-6);
      expect(p.y + 0.78 * p.height).toBeCloseTo(L.groundLinePx, 6); // plate ground line on the frame ground line
      expect(p.x + p.width / 2).toBeCloseTo(FRAME.width / 2, 6);
    }
    const near = L.plates[2]!, far = L.plates[0]!;
    expect(near.width).toBeGreaterThan(far.width);
    expect(() => composeArena({ ...RECIPE, groundLineNormalized: 1.2 }, FRAME)).toThrow('groundLineNormalized');
    expect(() => composeArena({ ...RECIPE, plates: { ...RECIPE.plates, mid: { width: 0, height: 0 } } }, FRAME)).toThrow('plate "mid"');
  });
  it('parallax is a pure function of the run-up displacement at .10/.50/1.20', () => {
    expect(parallaxOffset(100)).toEqual({ far: -10, mid: -50, near: -120 });
    expect(parallaxOffset(-40)).toEqual({ far: 4, mid: 20, near: 48 });
    expect(parallaxOffset(0)).toEqual({ far: -0, mid: -0, near: -0 });
    expect(() => parallaxOffset(Number.NaN)).toThrow('finite');
  });
  it('scales combatants to 1/3 (tiny) .. 1/2 (titanic) of frame height from the rig bounds', () => {
    const bounds = { height: 0.6 };
    for (const [mass, fraction] of [[0.7, 1 / 3], [1.6, 1 / 2]] as const) {
      const s = combatantScale(bounds, 1254, mass, 576);
      expect(s.heightFraction).toBeCloseTo(fraction, 9); expect(s.scale * 0.6 * 1254).toBeCloseTo(fraction * 576, 6);
    }
    const mid = combatantScale(bounds, 1254, 1.0, 576);
    expect(mid.heightFraction).toBeGreaterThan(COMBATANT_HEIGHT_FRACTION.min); expect(mid.heightFraction).toBeLessThan(COMBATANT_HEIGHT_FRACTION.max);
    expect(combatantScale(bounds, 1254, 9, 576).heightFraction).toBe(COMBATANT_HEIGHT_FRACTION.max);
    expect(() => combatantScale({ height: 0 }, 1254, 1, 576)).toThrow('bounds.height');
  });
  it('home-versus-visitor: wild → wild world, guardian → lair, duel → host first then alternating; deterministic', () => {
    const wild = selectArena({ kind: 'wild', seed: 593405465, wildWorldArenas: ['w-a', 'w-b', 'w-c'] });
    expect(wild.owner).toBe('wild-world'); expect(['w-a', 'w-b', 'w-c']).toContain(wild.recipeId);
    expect(selectArena({ kind: 'wild', seed: 593405465, wildWorldArenas: ['w-a', 'w-b', 'w-c'] })).toEqual(wild);
    expect(selectArena({ kind: 'guardian', seed: 7, lairArenas: ['lair'] })).toMatchObject({ recipeId: 'lair', owner: 'lair' });
    const duel = (i: number) => selectArena({ kind: 'duel', seed: 11, hostArenas: ['host-1', 'host-2'], visitorArenas: ['visitor-1'], duelIndex: i });
    expect(duel(0).owner).toBe('host'); expect(duel(1)).toMatchObject({ owner: 'visitor', recipeId: 'visitor-1' }); expect(duel(2).owner).toBe('host'); expect(duel(3).owner).toBe('visitor');
    expect(duel(0).recipeId.startsWith('host')).toBe(true); expect(duel(2)).toEqual(duel(2));
    expect(() => selectArena({ kind: 'guardian', seed: 1, lairArenas: [] })).toThrow('lairArenas');
    expect(() => duel(-1)).toThrow('duelIndex');
  });
  it('never reads a clock or Math.random', () => {
    const now = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock read'); });
    const perf = vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock read'); });
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random read'); });
    expect(() => Date.now()).toThrow('clock read');
    composeArena(RECIPE, FRAME); parallaxOffset(50); combatantScale({ height: 0.5 }, 1254, 1, 576);
    selectArena({ kind: 'duel', seed: 3, hostArenas: ['h'], visitorArenas: ['v'], duelIndex: 5 });
    expect(now).toHaveBeenCalledTimes(1); expect(perf).not.toHaveBeenCalled(); expect(rnd).not.toHaveBeenCalled();
  });
});
