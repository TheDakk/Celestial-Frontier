import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseInterfaceSheet } from '@cf/art-interface';
import type { SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { entryZoom, minSideOf, zoomLimits } from '../src/space/camera';
import { visibleBodies } from '../src/space/model';
import { artGrid, artScale, mapItems, type MapFrame } from '../src/space/project';
import { kindOf, systemNav } from './space-support';

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const CLOUDS = [0xfafcff, 0xbfcbe0];
/** A phone held upright, each art pixel one device pixel and then four, and a desktop window. */
const SCREENS = [{ w: 390, h: 844, dpr: 1 }, { w: 390, h: 844, dpr: 3 }, { w: 1280, h: 720, dpr: 1 }];
const highest = (screen: { w: number; h: number }): number => zoomLimits('system', minSideOf(screen), entryZoom('system', minSideOf(screen)))[1];
/** The map's own frame of Earth's system, Earth in the middle of the view, at a zoom. */
function frameAt(screen: { w: number; h: number; dpr: number }, z: number, over: Partial<MapFrame> = {}): MapFrame {
  const nav = systemNav();
  const earth = visibleBodies(nav, { x: 0, y: 0, z: 1 }, screen, 0).find((body) => body.label === 'Earth')!;
  return { nav, cam: { x: earth.wx, y: earth.wy, z }, view: { w: screen.w, h: screen.h }, dpr: screen.dpr, time: 0, epoch: 0, reach: 880, charts: true,
    passes: { effects: true, motion: true }, sized: true, solid: true, marks: true, ...over };
}
function itemsOf(frame: MapFrame): SpaceItem[] {
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  return mapItems(frame, artGrid(frame.view.w, frame.view.h, frame.dpr, scale), scale, sheet);
}
const cloudsOf = (items: readonly SpaceItem[]): number => kindOf(items, 'dot').filter((dot) => CLOUDS.includes(dot.colour)).length;

const printOf = (items: readonly SpaceItem[]): string => createHash('sha256').update(JSON.stringify(items)).digest('hex').slice(0, 16);

describe('Earth at the highest zoom of its system', () => {
  it('builds its picture, cloud deck and all, on a phone held upright and in a desktop window', () => {
    for (const screen of SCREENS) {
      const items = itemsOf(frameAt(screen, highest(screen)));
      expect(cloudsOf(items), `${screen.w} by ${screen.h} at ${screen.dpr}`).toBeGreaterThan(50_000);
    }
  });

  it('builds its picture with the cloud deck in dither, as a map not in solid steps has it', () => {
    for (const screen of SCREENS) {
      const items = itemsOf(frameAt(screen, highest(screen), { solid: false, marks: false }));
      expect(cloudsOf(items), `${screen.w} by ${screen.h} at ${screen.dpr}`).toBeGreaterThan(10_000);
    }
  });

  it('paints what it painted before, item for item and in the same order, at zooms the map already built', () => {
    // Recorded from the map before its cloud deck was joined to the picture one item at a time.
    expect(printOf(itemsOf(frameAt(SCREENS[0]!, 65)))).toBe('22735bca914cc61e');
    expect(printOf(itemsOf(frameAt(SCREENS[1]!, 130)))).toBe('b38b353795926fc4');
    expect(printOf(itemsOf(frameAt(SCREENS[2]!, 240)))).toBe('c713a00f6fe27372');
    expect(printOf(itemsOf(frameAt(SCREENS[0]!, 130, { solid: false, marks: false })))).toBe('fab79d8d30578b8e');
  });
});
