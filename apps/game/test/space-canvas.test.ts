// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseInterfaceSheet, type Gaps } from '@cf/art-interface';
import { NAV_HOME } from '@cf/scene';
import { mapItems } from '../src/space/project';
import { mapPicture, showSpace, type MapFrame } from '../src/space';
import { placeholderSheet } from '../src/ui/sheet-source';
import placeholderText from '../../../packages/art-testparts/src/interface.txt?raw';
import { galaxyNav, systemNav } from './space-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();

const sheet = placeholderSheet();
const noGaps = (): Gaps => ({ glyphs: [], icons: [], elements: [] });
const FRAME: MapFrame = { nav: systemNav(), cam: { x: 0, y: 0, z: 1 }, view: { w: 412, h: 915 }, dpr: 2.625, time: 0, epoch: 0, reach: 880, charts: true };

describe('the map picture', () => {
  it('covers the view at a whole number of screen pixels to the art pixel', () => {
    const picture = mapPicture(FRAME, sheet, noGaps());
    expect([picture.w, picture.h, picture.scale]).toEqual([271, 601, 4]);
    expect(picture.pixels).toHaveLength(271 * 601);
    expect(picture.pixels.some((value) => value !== 0)).toBe(true);
    expect(picture.pixels.reduce((most, value) => Math.max(most, value), 0)).toBeLessThan(sheet.palette.colours.length);
  });

  it('paints the star field first, then the scenery, then the bodies', () => {
    const kinds = mapItems(FRAME, { w: 271, h: 601 }, 4).map((item) => item.kind);
    expect(kinds.slice(0, 900).every((kind) => kind === 'dot')).toBe(true);
    expect(kinds.indexOf('element')).toBeGreaterThan(kinds.indexOf('ring'));
    expect(kinds.indexOf('disc')).toBeGreaterThan(kinds.indexOf('element'));
  });

  it('a body is drawn where the camera of the view puts it, whatever the pixel density', () => {
    // The Sun is at the centre of the system: the star element is centred in the picture at both densities.
    for (const dpr of [1, 2.625]) {
      const picture = mapPicture({ ...FRAME, dpr }, sheet, noGaps());
      const grid = { w: picture.w, h: picture.h };
      const sun = mapItems({ ...FRAME, dpr }, grid, picture.scale).find((item) => item.kind === 'element')!;
      expect([sun.x, sun.y]).toEqual([Math.round(grid.w / 2), Math.round(grid.h / 2)]);
    }
    // Neptune is 300 world units out: at 1 CSS pixel a unit that is 300 x 2.625 / 4 art pixels.
    const orbits = mapItems(FRAME, { w: 271, h: 601 }, 4).filter((item) => item.kind === 'ring' && item.x === 136 && item.y === 301);
    expect(orbits).toHaveLength(8);
    expect(orbits.at(-1)).toMatchObject({ r: Math.round(300 * 2.625 / 4) });
  });

  it('the supernova sites of a galaxy are drawn for the epoch of the frame', () => {
    const frame: MapFrame = { ...FRAME, nav: galaxyNav(), cam: { x: 0, y: 0, z: 0.3 } };
    const sites = (epoch: number) => mapItems({ ...frame, epoch }, { w: 271, h: 601 }, 4).filter((item) => item.kind === 'element' && item.name.startsWith('supernova/'));
    expect(sites(0)).toHaveLength(3);
    expect(sites(12)).not.toEqual(sites(0));
    expect(mapItems({ ...frame, nav: NAV_HOME }, { w: 271, h: 601 }, 4).some((item) => item.kind === 'element' && item.name.startsWith('supernova/'))).toBe(false);
  });
});

describe('a sheet that numbers its colours above 255', () => {
  // The placeholder sheet with colour n numbered 1000 n: its ramps then name 1000 to 8000.
  const far = parseInterfaceSheet(placeholderText.replace(/^colour (\d) /gm, (_, n: string) => `colour ${Number(n) * 1000} `)
    .replace(/^ramp (\w+) (\d) (\d) (\d) (\d)$/gm, (_, name: string, ...c: string[]) => `ramp ${name} ${c.slice(0, 4).map((n) => Number(n) * 1000).join(' ')}`));

  it('draws the same map, each pixel holding its colour number whole, and the canvas shows the same colours', () => {
    expect(far.palette.ramps['accent']).toEqual([5000, 6000, 7000, 8000]);
    const plain = mapPicture(FRAME, sheet, noGaps());
    const picture = mapPicture(FRAME, far, noGaps());
    expect(Array.from(picture.pixels)).toEqual(Array.from(plain.pixels, (value) => value * 1000));
    expect(picture.pixels).toContain(5000);
    const [canvas, canvasFar] = [document.createElement('canvas'), document.createElement('canvas')];
    showSpace(canvas, plain, sheet.palette.colours, FRAME.dpr);
    showSpace(canvasFar, picture, far.palette.colours, FRAME.dpr);
    expect(paintedBy(canvasFar)).toEqual(paintedBy(canvas));
    expect(paintedBy(canvasFar)).toContain(far.palette.colours[5000]);
  });
});

describe('showing a map picture', () => {
  it('the canvas holds one pixel per art pixel and is laid out at the whole-number scale, with hard edges', () => {
    const canvas = document.createElement('canvas');
    const picture = mapPicture(FRAME, sheet, noGaps());
    showSpace(canvas, picture, sheet.palette.colours, FRAME.dpr);
    expect([canvas.width, canvas.height]).toEqual([271, 601]);
    // Each art pixel is shown in its palette colour, and the background index is left clear.
    const colours = paintedBy(canvas);
    expect(colours).toHaveLength(271 * 601);
    expect(colours).toEqual(Array.from(picture.pixels, (value) => value === 0 ? null : sheet.palette.colours[value]));
    // 271 art pixels of 4 screen pixels each, on a screen of 2.625 screen pixels to the CSS pixel.
    expect(parseFloat(canvas.style.width) * FRAME.dpr).toBeCloseTo(271 * 4, 6);
    expect(parseFloat(canvas.style.height) * FRAME.dpr).toBeCloseTo(601 * 4, 6);
    expect(parseFloat(canvas.style.width)).toBeGreaterThanOrEqual(FRAME.view.w);
    expect(parseFloat(canvas.style.height)).toBeGreaterThanOrEqual(FRAME.view.h);
    expect(canvas.style.imageRendering).toBe('pixelated');
    expect(canvas.style.backgroundColor).toBe('rgb(16, 16, 24)');
  });
});
