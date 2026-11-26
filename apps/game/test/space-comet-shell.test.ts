import { describe, expect, it } from 'vitest';
import { paintSpace, parseInterfaceSheet, type SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { NAV_HOME } from '@cf/scene';
import { descentCamera } from '../src/space/camera';
import { place } from '../src/space/draw';
import { artCamera, artGrid, artScale, mapItems, mapPicture, type MapFrame } from '../src/space/project';
import { galaxyNav, kindOf, systemNav } from './space-support';

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const noGaps = () => ({ glyphs: [], icons: [], elements: [] });
/** The two recorded screens: a phone held upright (each art pixel 4 device pixels) and a desktop window (2). */
const SCREENS = [{ w: 390, h: 844, dpr: 3 }, { w: 1280, h: 720, dpr: 1 }];
/** The legacy game's shell: three units inside the edge of a system 320 units in radius, 2.5 units wide, and round
 *  it 181 dashes, each 6 units of every 11 (celestial-frontier.html 3637, 7643 to 7649). */
const SHELL_R = 317;
const frameAt = (screen: { w: number; h: number; dpr: number }, k: number, change: Partial<MapFrame> = {}): MapFrame => {
  const entry = descentCamera('system', Math.min(screen.w, screen.h)).to;
  return { nav: systemNav(), cam: { ...entry, z: entry.z * k }, view: { w: screen.w, h: screen.h }, dpr: screen.dpr, time: 0, epoch: 0, reach: 880, charts: true,
    passes: { effects: true, motion: true }, sized: true, solid: true, marks: true, ...change };
};
function drawnOf(frame: MapFrame) {
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  const grid = artGrid(frame.view.w, frame.view.h, frame.dpr, scale);
  const items = mapItems(frame, grid, scale, sheet);
  return { grid, items, cam: artCamera(frame.cam, frame.dpr, scale), shells: kindOf(items, 'dashes') };
}
/** The pieces of a picture: its lit pixels grouped where they touch, corners included; each piece's pixel count. */
function pieces(w: number, h: number, pixels: ArrayLike<number>): number[] {
  const seen = new Uint8Array(w * h);
  const sizes: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (pixels[start] === 0 || seen[start] === 1) continue;
    const queue = [start];
    seen[start] = 1;
    let size = 0;
    while (queue.length > 0) {
      const at = queue.pop()!;
      size++;
      const [x, y] = [at % w, Math.floor(at / w)];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || pixels[ny * w + nx] === 0 || seen[ny * w + nx] === 1) continue;
        seen[ny * w + nx] = 1;
        queue.push(ny * w + nx);
      }
    }
    sizes.push(size);
  }
  return sizes;
}

describe('the comet shell of the star charts', () => {
  it('with the charts on a system has one, about its star, three units inside the system\'s edge', () => {
    for (const screen of SCREENS) for (const k of [0.65, 1, 2.2]) {
      const { grid, cam, shells } = drawnOf(frameAt(screen, k));
      expect(shells, `${screen.w} at ${k}`).toHaveLength(1);
      expect(shells[0], `${screen.w} at ${k}`).toMatchObject({ ...place(cam, grid, 0, 0), r: Math.round(SHELL_R * cam.z), on: 6, of: 11 });
    }
  });

  it('is separate solid dashes all the way round: none a lone dot, none joined to the next', () => {
    for (const screen of SCREENS) for (const k of [0.4, 0.65, 1]) {
      const { grid, shells } = drawnOf(frameAt(screen, k));
      const shell = shells[0]!;
      // At these zooms the whole shell is in the picture.
      expect(Math.min(shell.x - shell.r, shell.y - shell.r, grid.w - 1 - shell.x - shell.r, grid.h - 1 - shell.y - shell.r), `${screen.w} at ${k}`).toBeGreaterThan(0);
      const alone = paintSpace(grid.w, grid.h, [shell], sheet, noGaps());
      const found = pieces(grid.w, grid.h, alone.pixels);
      expect(found, `${screen.w} at ${k}`).toHaveLength(shell.count);
      expect(Math.min(...found), `${screen.w} at ${k}`).toBeGreaterThanOrEqual(2);
      // A dash is at least 3 pixels of the ring long, so there are no more than that allows, and never more than the legacy game's 181.
      expect(shell.count, `${screen.w} at ${k}`).toBe(Math.min(181, Math.floor(2 * Math.PI * shell.r * 6 / 11 / 3)));
      expect(shell.count, `${screen.w} at ${k}`).toBeGreaterThan(40);
      // Six parts in eleven of the ring are lit (0.545): a ring one pixel wide is 6.28 pixels for each of radius.
      const lit = found.reduce((sum, size) => sum + size, 0);
      expect(lit / (2 * Math.PI * shell.r), `${screen.w} at ${k}`).toBeGreaterThan(0.51);
      expect(lit / (2 * Math.PI * shell.r), `${screen.w} at ${k}`).toBeLessThan(0.58);
    }
  });

  it('from close by it has the legacy game\'s 181 dashes and its width of 2.5 units', () => {
    // On the desktop window the entry zoom is 0.473 art pixels a unit, on the phone 0.385: 2.5 units are 0.57, 2.6, 2.1,
    // 4.7 and 3.9 pixels. At four times the entry zoom the shell is seen with the view moved out to it.
    const out = { x: SHELL_R, y: 0 };
    for (const [screen, k, width, at] of [[SCREENS[1]!, 1.2, 1, {}], [SCREENS[1]!, 2.2, 3, {}], [SCREENS[0]!, 2.2, 2, {}], [SCREENS[1]!, 4, 5, out], [SCREENS[0]!, 4, 4, out]] as const) {
      const frame = frameAt(screen, k);
      expect(drawnOf({ ...frame, cam: { ...frame.cam, ...at } }).shells[0], `${screen.w} at ${k}`).toMatchObject({ count: 181, width });
    }
    // A picture drawn at one size has it one pixel wide at any zoom.
    expect(drawnOf(frameAt(SCREENS[1]!, 2.2, { sized: false })).shells[0]).toMatchObject({ count: 181, width: 1 });
  });

  it('is listed only where some of it is in the picture: not from inside it with all of it out of view, nor from beside it', () => {
    for (const screen of SCREENS) {
      const frame = frameAt(screen, 4);
      const z = frame.cam.z;
      const [halfW, halfH] = [screen.w / 2 / z, screen.h / 2 / z];
      // From the star at four times the entry zoom the corners of the view are still inside the shell.
      expect(Math.hypot(halfW, halfH), `${screen.w}`).toBeLessThan(SHELL_R - 8);
      expect(drawnOf(frame).shells, `${screen.w}`).toEqual([]);
      const moved = (x: number, y: number): SpaceItem[] => drawnOf({ ...frame, cam: { x, y, z } }).shells;
      // Moved toward a corner until the shell is a few units inside that corner of the view, it is listed; a few outside, it is not.
      const corner = (SHELL_R - Math.hypot(halfW, halfH)) / Math.hypot(halfW, halfH);
      expect([moved(halfW * corner + 4, halfH * corner + 4).length, moved(halfW * corner - 4, halfH * corner - 4).length], `${screen.w}`).toEqual([1, 0]);
      // From outside it, with the view beside it: 4 units into the left edge of the view it is listed, 4 units short it is not.
      expect([moved(SHELL_R + halfW - 4, 0).length, moved(SHELL_R + halfW + 4, 0).length], `${screen.w}`).toEqual([1, 0]);
      // And whenever it is listed some pixel of it is painted.
      for (const at of [moved(halfW * corner + 4, halfH * corner + 4), moved(SHELL_R + halfW - 4, 0)]) {
        const { grid } = drawnOf(frame);
        expect(paintSpace(grid.w, grid.h, at, sheet, noGaps()).pixels.some((value) => value !== 0), `${screen.w}`).toBe(true);
      }
    }
  });

  it('lies over the orbit lines and under the belts, and nothing on the map darkens it', () => {
    for (const screen of SCREENS) {
      const frame = frameAt(screen, 1);
      const { grid, items, shells } = drawnOf(frame);
      const at = items.indexOf(shells[0]!);
      const orbit = (item: SpaceItem): boolean => item.kind === 'ring' && item.colour === 0x2a3a55;
      const rock = (item: SpaceItem): boolean => 'colour' in item && (item.colour === 0x9a8f80 || item.colour === 0xbcd4e8);
      expect([orbit(items[at - 1]!), items.slice(at).some(orbit)], `${screen.w}`).toEqual([true, false]);
      expect([rock(items[at + 1]!), items.slice(0, at).some(rock)], `${screen.w}`).toEqual([true, false]);
      const alone = paintSpace(grid.w, grid.h, [shells[0]!], sheet, noGaps());
      const picture = mapPicture(frame, sheet, noGaps());
      let [checked, own] = [0, 0];
      alone.pixels.forEach((value, i) => {
        if (value === 0) return;
        checked++;
        expect(picture.pixels[i], `${screen.w}: pixel ${i}`).not.toBe(0);
        if (picture.pixels[i] === value) own++;
      });
      expect(checked).toBeGreaterThan(300);
      // All but what a rock, a comet or a name's body covers is in its own colour.
      expect(own / checked).toBeGreaterThan(0.9);
    }
  });

  it('with the charts off, as in a new game, there is none, and no other map has one', () => {
    for (const screen of SCREENS) for (const k of [0.65, 1, 2.2]) {
      expect(drawnOf(frameAt(screen, k, { charts: false })).shells, `${screen.w} at ${k}`).toEqual([]);
      expect(drawnOf(frameAt(screen, k, { charts: false, passes: undefined as never })).shells).toEqual([]);
    }
    const elsewhere = (nav: MapFrame['nav'], z: number): SpaceItem[] => drawnOf({ ...frameAt(SCREENS[1]!, 1), nav, cam: { x: 0, y: 0, z } }).shells;
    expect(elsewhere(NAV_HOME, 0.3)).toEqual([]);
    expect(elsewhere(galaxyNav(), 1)).toEqual([]);
  });
});
