import { describe, expect, it } from 'vitest';
import { paintSpace } from '@cf/art-interface';
import type { SpaceItem, SpacePicture } from '@cf/art-interface';
import type { Camera } from '../src/space/camera';
import { place } from '../src/space/draw';
import { zoneItems } from '../src/space/passes-system';
import { SOL, passView, shadedSheet, systemNav } from './space-support';

const sheet = shadedSheet();
const colours = sheet.palette.colours;
const paint = (items: readonly SpaceItem[]): SpacePicture => paintSpace(640, 360, items, sheet, { glyphs: [], icons: [], elements: [] });
const sol = systemNav(SOL);
const solid = (cam: Camera) => passView(sol, cam, { solid: true, sizing: { perCss: 0.5, solid: true } });

describe('the habitable zone from where it would cover most of the view', () => {
  const GREEN = 0x062027;
  /** The share of the picture's pixels in the zone's fill colour, and how many pixels are drawn at all. */
  const drawn = (cam: Camera) => {
    const picture = paint(zoneItems(solid(cam)));
    let [green, any] = [0, 0];
    for (const value of picture.pixels) { if (colours[value] === GREEN) green++; if (value !== 0) any++; }
    return { green: green / picture.pixels.length, any };
  };
  /** The share of the picture's pixels whose middle lies in the band, by the game's radii for Sol (92 and 140). */
  const inBand = (cam: Camera): number => {
    const v = solid(cam);
    const star = place(v.cam, v.grid, 0, 0);
    const [inner, outer] = [92 * v.cam.z, 140 * v.cam.z];
    let n = 0;
    for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) {
      const d2 = (x - star.x) * (x - star.x) + (y - star.y) * (y - star.y);
      if (d2 >= inner * inner && d2 <= outer * outer) n++;
    }
    return n / (640 * 360);
  };

  it('is not filled when the band is a little narrower than the view is tall: 355 pixels of band on a picture 640 by 360', () => {
    // Mid-band below the star at 7.4 art pixels a unit: the band is 355 pixels from edge to edge and lies across
    // the picture, over nearly all of it.
    const cam = { x: 0, y: 116, z: 14.8 };
    expect(inBand(cam)).toBeGreaterThan(0.9);
    const shown = drawn(cam);
    expect(shown.green).toBeLessThan(0.5);
    expect(shown.green).toBe(0);
  });

  it('is filled while the band lies over just under half of the view, and is its two edges from just over half', () => {
    const [under, over] = [{ x: 0, y: 116, z: 6.8 }, { x: 0, y: 116, z: 7.2 }];
    expect(inBand(under)).toBeGreaterThan(0.47);
    expect(inBand(under)).toBeLessThan(0.5);
    expect(inBand(over)).toBeGreaterThan(0.5);
    expect(inBand(over)).toBeLessThan(0.53);
    // Under: the fill, the whole band of it.
    expect(Math.abs(drawn(under).green - inBand(under))).toBeLessThan(0.01);
    // Over: no fill. The outer edge crosses the picture from side to side and the inner one its top, as thin lines.
    expect(drawn(over).green).toBe(0);
    expect(drawn(over).any).toBeGreaterThan(640);
    expect(drawn(over).any).toBeLessThan(640 * 360 / 100);
  });
});
