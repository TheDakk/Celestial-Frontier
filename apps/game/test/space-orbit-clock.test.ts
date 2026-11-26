import { describe, expect, it } from 'vitest';
import { systemFor } from '@cf/domain-worldgen';
import { systemScene } from '@cf/scene';
import { orbitClock } from '../src/space';
import { projectScenery } from '../src/space/project';
import { SOL, systemNav } from './space-support';

/** A clock a test moves by hand, in seconds. */
function handClock(at = 0) {
  return { now: () => at, pass(seconds: number): void { at += seconds; } };
}

describe('the orbit clock', () => {
  it('runs with the clock it is given until it is held, and does not move while held', () => {
    const hand = handClock(5);
    const orbits = orbitClock(hand.now);
    expect(orbits.time()).toBe(5);
    hand.pass(2.5);
    expect(orbits.time()).toBe(7.5);
    orbits.hold();
    hand.pass(30);
    expect(orbits.time()).toBe(7.5);
    hand.pass(600);
    expect(orbits.time()).toBe(7.5);
  });

  it('released, it resumes from the held value with no jump, and runs at the clock\'s pace again', () => {
    const hand = handClock();
    const orbits = orbitClock(hand.now);
    hand.pass(10);
    orbits.hold();
    hand.pass(30);
    orbits.release();
    expect(orbits.time()).toBe(10);
    hand.pass(4);
    expect(orbits.time()).toBe(14);
    // A second hold and release loses its own wait as well: the orbits have run 16 of the clock's 96 seconds.
    hand.pass(2);
    orbits.hold();
    hand.pass(50);
    expect(orbits.time()).toBe(16);
    orbits.release();
    expect([orbits.time(), hand.now()]).toEqual([16, 96]);
  });

  it('a hold while held keeps the first instant, and a release while running changes nothing', () => {
    const hand = handClock();
    const orbits = orbitClock(hand.now);
    orbits.release();
    hand.pass(3);
    expect(orbits.time()).toBe(3);
    orbits.hold();
    hand.pass(5);
    orbits.hold();
    hand.pass(5);
    expect(orbits.time()).toBe(3);
    orbits.release();
    orbits.release();
    hand.pass(1);
    expect(orbits.time()).toBe(4);
  });
});

describe('a system drawn with its orbits held', () => {
  it('the dwarf planets stand where the held orbits put them, and the rocks of the belts move on', () => {
    const scenery = (time: number, orbit?: number) =>
      projectScenery(systemNav(), { x: 0, y: 0, z: 0.4 }, { w: 400, h: 300 }, time, { reach: 500, charts: false, ...(orbit === undefined ? {} : { orbit }) });
    // What lies under a system's worlds, from the back: the rocks of its two belts, its dwarf planets, then its star.
    const scene = systemScene(SOL.seed);
    const rocks = [scene.belt, scene.kuiper].map((belt) => (belt as { rocks: unknown[] } | null)?.rocks.length ?? 0).reduce((sum, count) => sum + count, 0);
    const dwarfs = ((systemFor(SOL.seed) as { dwarfs?: unknown[] }).dwarfs ?? []).length;
    expect([rocks > 20, dwarfs > 0]).toEqual([true, true]);
    const [held, early, late] = [scenery(38, 8), scenery(8), scenery(38)];
    expect(held.slice(rocks, rocks + dwarfs)).toEqual(early.slice(rocks, rocks + dwarfs));
    expect(held.slice(rocks, rocks + dwarfs)).not.toEqual(late.slice(rocks, rocks + dwarfs));
    expect(held.slice(0, rocks)).toEqual(late.slice(0, rocks));
    expect(held.slice(0, rocks)).not.toEqual(early.slice(0, rocks));
    // Without a hold the orbits run with the map's clock.
    expect(scenery(38, 38)).toEqual(late);
  });
});
