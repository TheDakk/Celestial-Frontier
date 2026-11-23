import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { parseInterfaceSheet, type Gaps } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import type { NavState } from '@cf/scene';
import { mapPicture, type MapFrame } from '../apps/game/src/space/project';
import { galaxyNav, systemNav } from '../apps/game/test/space-support';
import { NAV_HOME } from '@cf/scene';

interface Entry extends Omit<MapFrame, 'nav'> { label: string; place: 'universe' | 'home-galaxy' | 'sol'; w: number; h: number; scale: number; hash: string; gaps: string[] }
const fixture: { sheet: string; entries: Entry[] } = JSON.parse(readFileSync(new URL('../fixtures/art/space-v1.json', import.meta.url), 'utf8'));
const sheet = parseInterfaceSheet(testInterfaceSheetText());
const NAVS: Record<Entry['place'], NavState> = { universe: NAV_HOME, 'home-galaxy': galaxyNav(), sol: systemNav() };

function drawn(entry: Entry, change: Partial<MapFrame> = {}) {
  const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
  const picture = mapPicture({ ...entry, nav: NAVS[entry.place], ...change }, sheet, gaps);
  return { w: picture.w, h: picture.h, scale: picture.scale, hash: hashBuffer(picture), gaps: gaps.elements };
}
const recorded = (e: Entry) => ({ w: e.w, h: e.h, scale: e.scale, hash: e.hash, gaps: e.gaps });

describe('map golden hashes', () => {
  it('the home universe, the home galaxy about Sol and the Sol system match their recorded hashes at two grid sizes', () => {
    expect(fixture.sheet).toBe('art-testparts');
    for (const entry of fixture.entries) expect(drawn(entry), entry.label).toEqual(recorded(entry));
    const sizes = (start: string): string[] => fixture.entries.filter((e) => e.label.startsWith(`${start},`)).map((e) => `${e.w}x${e.h}`);
    for (const scene of ['the home universe', 'the home galaxy about Sol', 'the Sol system']) expect(sizes(scene), scene).toEqual(['293x633', '640x360']);
    expect(fixture.entries).toHaveLength(12);
  });

  it('no recorded picture has a gap, and no two are the same picture', () => {
    expect(fixture.entries.flatMap((e) => e.gaps)).toEqual([]);
    expect(new Set(fixture.entries.map((e) => e.hash)).size).toBe(fixture.entries.length);
  });

  it('a change to what is drawn changes the hash: the camera, the time in a system, the epoch in a galaxy, the charter', () => {
    const [universe, galaxy, sol] = ['the home universe', 'the home galaxy', 'the Sol system'].map((start) => fixture.entries.find((e) => e.label.startsWith(`${start},`))!) as [Entry, Entry, Entry];
    expect(drawn(sol, { cam: { ...sol.cam, x: sol.cam.x + 8 } }).hash).not.toBe(sol.hash);
    expect(drawn(sol, { time: 1 }).hash).not.toBe(sol.hash);
    expect(drawn(sol, { charts: false }).hash).not.toBe(sol.hash);
    expect(drawn(galaxy, { epoch: 1 }).hash).not.toBe(galaxy.hash);
    expect(drawn(universe, { reach: universe.reach * 1.5 }).hash).not.toBe(universe.hash);
    // What a map does not read leaves it alone: the epoch and the time move nothing in the universe.
    expect(drawn(universe, { epoch: 9, time: 77, charts: false }).hash).toBe(universe.hash);
    expect(drawn(sol, { epoch: 9, reach: 1 }).hash).toBe(sol.hash);
  });

  it('a sheet without one of its elements draws the stand-in and reports the gap', () => {
    const sol = fixture.entries.find((e) => e.place === 'sol')!;
    const lacking = { ...sheet, elements: new Map([...sheet.elements].filter(([name]) => name !== 'primary/star')) };
    const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
    expect(hashBuffer(mapPicture({ ...sol, nav: NAVS.sol }, lacking, gaps))).not.toBe(sol.hash);
    expect(gaps.elements).toEqual(['primary/star']);
  });
});
