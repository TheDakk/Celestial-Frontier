import { describe, expect, it } from 'vitest';
import { paintSpace, parseInterfaceSheet, type SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { systemScene } from '@cf/scene';
import { descentCamera } from '../src/space/camera';
import { artGrid, artScale, mapItems, mapPicture, type MapFrame } from '../src/space/project';
import { SOL, kindOf, systemNav } from './space-support';

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const noGaps = () => ({ glyphs: [], icons: [], elements: [] });
const ORBIT = 0x2a3a55;
/** The two recorded screens: a phone held upright (each art pixel 4 device pixels) and a desktop window (2). */
const SCREENS = [{ w: 390, h: 844, dpr: 3 }, { w: 1280, h: 720, dpr: 1 }];
const frameAt = (screen: { w: number; h: number; dpr: number }, k: number, charts = true): MapFrame => {
  const entry = descentCamera('system', Math.min(screen.w, screen.h)).to;
  return { nav: systemNav(), cam: { ...entry, z: entry.z * k }, view: { w: screen.w, h: screen.h }, dpr: screen.dpr, time: 0, epoch: 0, reach: 880, charts, passes: { effects: true, motion: true }, sized: true };
};
function gridOf(frame: MapFrame) {
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  return { scale, grid: artGrid(frame.view.w, frame.view.h, frame.dpr, scale) };
}
const orbitsOf = (frame: MapFrame): Extract<SpaceItem, { kind: 'ring' }>[] => {
  const { scale, grid } = gridOf(frame);
  return kindOf(mapItems(frame, grid, scale), 'ring').filter((ring) => ring.colour === ORBIT);
};

/** The breaks in a line painted alone: lit pixels, away from the picture's edge, with fewer than two lit neighbours. */
function breaks(w: number, h: number, pixels: ArrayLike<number>): number {
  let found = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (pixels[y * w + x] === 0) continue;
    let neighbours = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && pixels[(y + dy) * w + x + dx] !== 0) neighbours++;
    if (neighbours < 2) found++;
  }
  return found;
}

describe('the orbit lines of the star charts', () => {
  it('each orbit is one unbroken line at both recorded screen sizes, from the far zoom to a near one', () => {
    for (const screen of SCREENS) for (const k of [0.5, 1, 1.7, 4]) {
      const frame = frameAt(screen, k);
      const { grid } = gridOf(frame);
      const orbits = orbitsOf(frame);
      expect(orbits, `${screen.w} at ${k}`).toHaveLength(systemScene(SOL.seed).planets.length);
      for (const orbit of orbits) {
        const alone = paintSpace(grid.w, grid.h, [orbit], sheet, noGaps());
        const lit = alone.pixels.reduce((sum, value) => sum + (value === 0 ? 0 : 1), 0);
        expect(breaks(grid.w, grid.h, alone.pixels), `${screen.w} at ${k}, radius ${orbit.r}`).toBe(0);
        // A ring that lies wholly in the picture is lit all the way round: about 5.6 pixels for each of radius.
        const whole = orbit.x - orbit.r >= 0 && orbit.x + orbit.r < grid.w && orbit.y - orbit.r >= 0 && orbit.y + orbit.r < grid.h;
        if (whole && orbit.r > 4) expect(lit, `${screen.w} at ${k}, radius ${orbit.r}`).toBeGreaterThanOrEqual(5 * orbit.r);
      }
    }
  });

  it('nothing on the map darkens an orbit line: every pixel of each is lit in the whole picture', () => {
    for (const screen of SCREENS) {
      const frame = frameAt(screen, 1);
      const { grid } = gridOf(frame);
      const picture = mapPicture(frame, sheet, noGaps());
      // A planet sits on its orbit and its night side is dark: the line is judged outside every disc.
      const discs = kindOf(mapItems(frame, grid, gridOf(frame).scale), 'disc');
      const onDisc = (i: number): boolean => discs.some((d) => ((i % grid.w) - d.x) ** 2 + (Math.floor(i / grid.w) - d.y) ** 2 <= (d.r + 1) ** 2);
      let checked = 0;
      for (const orbit of orbitsOf(frame)) {
        const alone = paintSpace(grid.w, grid.h, [orbit], sheet, noGaps());
        alone.pixels.forEach((value, i) => { if (value !== 0 && !onDisc(i)) { checked++; expect(picture.pixels[i], `${screen.w}: pixel ${i}`).not.toBe(0); } });
      }
      expect(checked).toBeGreaterThan(1000);
    }
  });

  it('with the star charts off, as in a new game, no orbit is drawn: the ring of dots is the belt', () => {
    for (const screen of SCREENS) {
      expect(orbitsOf(frameAt(screen, 1, false))).toEqual([]);
      const { scale, grid } = gridOf(frameAt(screen, 1, false));
      const rocks = (systemScene(SOL.seed).belt as { rocks: unknown[] }).rocks.length;
      expect(kindOf(mapItems(frameAt(screen, 1, false), grid, scale), 'dot').filter((dot) => dot.colour === 0x9a8f80)).toHaveLength(rocks);
    }
  });
});
