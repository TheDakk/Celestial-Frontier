import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { parseInterfaceSheet, type Gaps, type SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { NAV_HOME } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { artGrid, artScale, mapItems, mapPicture, type MapFrame } from '../apps/game/src/space/project';
import { MAGNETAR, PULSAR, VISITED, WORMHOLE_GALAXY, galaxyNav, systemNav } from '../apps/game/test/space-support';

type Place = 'universe' | 'home-galaxy' | 'sol' | 'wormhole-galaxy' | 'visited' | 'pulsar' | 'magnetar';
interface Entry extends Omit<MapFrame, 'nav'> { label: string; place: Place; w: number; h: number; scale: number; hash: string; gaps: string[] }
const fixture: { sheet: string; entries: Entry[] } = JSON.parse(readFileSync(new URL('../fixtures/art/space-v2.json', import.meta.url), 'utf8'));
const sheet = parseInterfaceSheet(testInterfaceSheetText());
const NAVS: Record<Place, NavState> = {
  universe: NAV_HOME, 'home-galaxy': galaxyNav(), sol: systemNav(), 'wormhole-galaxy': galaxyNav(WORMHOLE_GALAXY),
  visited: systemNav(VISITED), pulsar: systemNav(PULSAR), magnetar: systemNav(MAGNETAR),
};

const frameOf = (entry: Entry, change: Partial<MapFrame> = {}): MapFrame => ({ ...entry, nav: NAVS[entry.place], ...change });
function drawn(frame: MapFrame) {
  const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
  const picture = mapPicture(frame, sheet, gaps);
  return { w: picture.w, h: picture.h, scale: picture.scale, hash: hashBuffer(picture), gaps: gaps.elements };
}
const scene = (start: string): Entry[] => fixture.entries.filter((e) => e.label.startsWith(start));
function itemsOf(entry: Entry): SpaceItem[] {
  const scale = artScale(entry.view.w, entry.view.h, entry.dpr);
  return mapItems(frameOf(entry), artGrid(entry.view.w, entry.view.h, entry.dpr, scale), scale);
}

describe('map golden hashes with the passes on', () => {
  it('every recorded map with its passes matches its hash, at both screen sizes, with no gap and no two alike', () => {
    expect(fixture.sheet).toBe('art-testparts');
    expect(fixture.entries).toHaveLength(42);
    for (const entry of fixture.entries) {
      expect(drawn(frameOf(entry)), entry.label).toEqual({ w: entry.w, h: entry.h, scale: entry.scale, hash: entry.hash, gaps: [] });
      expect(entry.passes, entry.label).toBeDefined();
    }
    expect(new Set(fixture.entries.map((e) => e.hash)).size).toBe(42);
    const labels = [...new Set(fixture.entries.map((e) => e.label.replace(/, \d+ by \d+ at \d$/, '')))];
    expect(labels).toHaveLength(21);
    for (const label of labels) expect(scene(`${label},`).map((e) => `${e.view.w}x${e.view.h}`), label).toEqual(['390x844', '1280x720']);
  });

  it('each picture differs from the same map without its passes', () => {
    for (const entry of fixture.entries) {
      const { passes: _, ...without } = frameOf(entry);
      expect(drawn(without).hash, entry.label).not.toBe(entry.hash);
    }
  });

  it('each pass is in a recorded picture at both sizes', () => {
    const veils = (entry: Entry, colour: number): number => itemsOf(entry).filter((item) => item.kind === 'veil' && item.colour === colour).length;
    const names = (entry: Entry): string[] => itemsOf(entry).flatMap((item) => item.kind === 'element' ? [item.name] : []);
    const dots = (entry: Entry, colour: number): number => itemsOf(entry).filter((item) => item.kind === 'dot' && item.colour === colour).length;
    const both = (start: string, has: (entry: Entry) => boolean): void => {
      const entries = scene(`${start},`);
      expect(entries, start).toHaveLength(2);
      for (const entry of entries) expect(has(entry), entry.label).toBe(true);
    };
    both('the home universe: web, veil and fog', (e) => veils(e, 0x05070f) === 2 && veils(e, 0x060814) > 0);
    both('the universe from afar: the web and the edge of the observable universe', (e) => veils(e, 0x312f3d) > 0 && veils(e, 0x402b12) === 1);
    both('the universe from farther than the charter shows: the edge alone', (e) => veils(e, 0x05070f) === 0 && veils(e, 0x312f3d) === 0 && veils(e, 0x402b12) === 1);
    both('a colliding pair and its tidal bridge', (e) => veils(e, 0x35373f) > 20);
    both('the home galaxy: haze', (e) => veils(e, 0xfff0d6) === 2);
    both('the home galaxy about Sol: grain', (e) => dots(e, 0x998f80) + dots(e, 0x7c8399) + dots(e, 0x997660) > 50);
    both('the home galaxy after 3.3 seconds: stars twinkle, beams turn, protostars pulse', (e) => names(e).some((name) => /^supernova\/ns\/t\d$/.test(name)) && names(e).includes('star/giant/dim'));
    both('a wormhole, turned', (e) => names(e).includes('wormhole/t1'));
    both('the Sol system: habitable zone, comet, day and night', (e) => veils(e, 0x143521) === 1 && veils(e, 0xcfe6ff) === 1 && veils(e, 0x00000c) >= 2);
    both('Earth up close: cloud deck', (e) => dots(e, 0xfafcff) > 15);
    both('a gas giant of Sol up close: day and night', (e) => veils(e, 0x00000c) >= 2);
    both('a system with an interstellar visitor', (e) => dots(e, 0x8a6f58) >= 2);
    both('a pulsar system, its beams turned', (e) => names(e).includes('primary/ns/t2'));
    both('a magnetar system, its beams turned', (e) => names(e).includes('primary/mag/t3'));
  });

  it('a change to what a pass reads changes the picture: time, the charter, the charts, the settings', () => {
    const first = (start: string): Entry => scene(`${start},`)[1]!;
    const universe = first('the home universe: web, veil and fog');
    expect(drawn(frameOf(universe, { time: 100 })).hash).toBe(first('the home universe after 100 seconds: the fog has drifted').hash);
    expect(drawn(frameOf(universe, { reach: universe.reach * 1.5 })).hash).not.toBe(universe.hash);
    expect(drawn(frameOf(universe, { passes: { effects: false, motion: true } })).hash).toBe(first('the home universe with effects off: no fog').hash);
    const sol = first('the Sol system: habitable zone, comet, day and night');
    expect(drawn(frameOf(sol, { charts: false })).hash).not.toBe(sol.hash);
    expect(drawn(frameOf(sol, { time: 10 })).hash).toBe(first('the Sol system after ten seconds: the comet has moved').hash);
    expect(drawn(frameOf(sol, { epoch: 9, reach: 1 })).hash).toBe(sol.hash);
  });

  it('with motion reduced every recorded map is its picture at time 0, whatever the time', () => {
    const reduced = { effects: true, motion: false };
    for (const entry of fixture.entries) {
      const still = drawn(frameOf(entry, { time: 0, passes: reduced })).hash;
      expect(drawn(frameOf(entry, { time: entry.time + 41, passes: reduced })).hash, entry.label).toBe(still);
    }
    const held = scene('the home universe with motion reduced')[1]!;
    expect(drawn(frameOf(held, { time: 0 })).hash).toBe(held.hash);
    expect(drawn(frameOf(held, { passes: { effects: true, motion: true } })).hash).toBe(scene('the home universe after 100 seconds')[1]!.hash);
  });
});
