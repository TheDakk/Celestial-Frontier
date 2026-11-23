import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hashBuffer } from '@cf/art-compose';
import { parseInterfaceSheet, type Gaps, type SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { galaxyName } from '@cf/domain-naming';
import { NAV_HOME, currentRegionOf } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { toScreen } from '../apps/game/src/space/camera';
import { mapLabels } from '../apps/game/src/space/labels';
import { artGrid, artScale, mapItems, mapPicture, type MapFrame } from '../apps/game/src/space/project';
import { galaxyNav, systemNav } from '../apps/game/test/space-support';

type Place = 'universe' | 'home-galaxy' | 'sol';
interface Lettered { text: string; x: number; y: number; hold: string }
interface Entry extends Omit<MapFrame, 'nav'> { label: string; place: Place; w: number; h: number; scale: number; hash: string; gaps: string[]; labels: Lettered[] }
const fixture: { sheet: string; entries: Entry[] } = JSON.parse(readFileSync(new URL('../fixtures/art/space-v3.json', import.meta.url), 'utf8'));
const sheet = parseInterfaceSheet(testInterfaceSheetText());
const NAVS: Record<Place, NavState> = { universe: NAV_HOME, 'home-galaxy': galaxyNav(), sol: systemNav() };

const frameOf = (entry: Entry, change: Partial<MapFrame> = {}): MapFrame => ({ ...entry, nav: NAVS[entry.place], ...change });
function drawn(frame: MapFrame) {
  const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
  const picture = mapPicture(frame, sheet, gaps);
  return { w: picture.w, h: picture.h, scale: picture.scale, hash: hashBuffer(picture), gaps: gaps.elements };
}
const letteredOf = (frame: MapFrame): Lettered[] => mapLabels(frame, currentRegionOf(0).name).map(({ text, wx, wy, hold, lift }) => {
  const at = toScreen(frame.cam, frame.view, wx, wy);
  return { text, x: Math.round(at.x), y: Math.round(at.y) - (lift ?? 0), hold };
});
const scene = (start: string): Entry[] => fixture.entries.filter((e) => e.label.startsWith(start));
const texts = (entry: Entry): string[] => entry.labels.map((label) => label.text);
function elementsOf(entry: Entry): Extract<SpaceItem, { kind: 'element' }>[] {
  const scale = artScale(entry.view.w, entry.view.h, entry.dpr);
  return mapItems(frameOf(entry), artGrid(entry.view.w, entry.view.h, entry.dpr, scale), scale).filter((item) => item.kind === 'element');
}

describe('map golden hashes as the map screen draws it: sized by the camera, with its words', () => {
  it('every recorded map matches its hash and its lettering at both screen sizes, with no gap and no two alike', () => {
    expect(fixture.sheet).toBe('art-testparts');
    expect(fixture.entries).toHaveLength(28);
    for (const entry of fixture.entries) {
      expect(drawn(frameOf(entry)), entry.label).toEqual({ w: entry.w, h: entry.h, scale: entry.scale, hash: entry.hash, gaps: [] });
      expect(letteredOf(frameOf(entry)), entry.label).toEqual(entry.labels);
      expect([entry.sized, entry.passes], entry.label).toEqual([true, { effects: true, motion: true }]);
    }
    expect(new Set(fixture.entries.map((e) => e.hash)).size).toBe(28);
    const labels = [...new Set(fixture.entries.map((e) => e.label.replace(/, \d+ by \d+ at \d$/, '')))];
    expect(labels).toHaveLength(14);
    for (const label of labels) expect(scene(`${label},`).map((e) => `${e.view.w}x${e.view.h}`), label).toEqual(['390x844', '1280x720']);
    // A far, an entry and a near zoom of each map.
    for (const map of ['the universe', 'the home galaxy', 'the Sol system']) for (const zoom of ['far', 'entry', 'near']) {
      expect(scene(`${map}, ${zoom}`).length, `${map}, ${zoom}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('the near zoom of each map is not the picture drawn at one size, and things in it are drawn larger than their one size', () => {
    for (const start of ['the universe, near: the home galaxy', 'the home galaxy, near: about the Sun', 'the home galaxy, near: its core', 'the Sol system, near: about Earth', 'the Sol system, near: its star']) {
      const entries = scene(start);
      expect(entries, start).toHaveLength(2);
      for (const entry of entries) {
        const { sized: _, ...unsized } = frameOf(entry);
        expect(drawn(unsized).hash, entry.label).not.toBe(entry.hash);
      }
    }
    for (const entry of scene('the universe, near: the home galaxy')) expect(elementsOf(entry).find((e) => e.name.startsWith('galaxy/') && (e.span ?? 0) > 16 * 4), entry.label).toBeDefined();
    for (const entry of scene('the home galaxy, near: its core')) expect(elementsOf(entry).find((e) => e.name === 'black-hole' && (e.span ?? 0) > 9 * 4), entry.label).toBeDefined();
    for (const entry of scene('the Sol system, near: its star')) expect(elementsOf(entry).find((e) => e.name === 'primary/star' && (e.span ?? 0) > 13 * 2), entry.label).toBeDefined();
  });

  it('the words of each map are recorded where the game letters them', () => {
    const charter = `your charter — ${currentRegionOf(0).name}`;
    for (const entry of scene('the universe, far')) expect(texts(entry), entry.label).toEqual(expect.arrayContaining(['Milky Way — you are here', charter]));
    for (const entry of scene('the universe, entry')) expect(texts(entry), entry.label).toContain('Milky Way — you are here');
    // The Sun is lettered only from the zoom its mark shows at, which the entry zoom is short of.
    for (const entry of scene('the home galaxy, entry')) expect(texts(entry), entry.label).toEqual([]);
    for (const entry of scene('the home galaxy, near: about the Sun')) {
      expect(entry.labels, entry.label).toEqual([{ text: 'Sun — our star', x: entry.view.w / 2, y: entry.view.h / 2 - 14, hold: 'above' }]);
    }
    for (const entry of scene('the Sol system, entry')) expect(texts(entry), entry.label).toEqual(expect.arrayContaining(['Earth', 'habitable zone', 'asteroid belt']));
    for (const entry of scene('the Sol system, near: about Earth')) expect(texts(entry).filter((text) => text === 'Earth'), entry.label).toEqual(['Earth']);
    for (const entry of scene('the universe, near: a neighbour')) expect(entry.labels, entry.label).toContainEqual({ text: galaxyName(334683355), x: entry.view.w / 2, y: entry.view.h / 2 + Math.round(60 * 1.15), hold: 'below' });
    for (const entry of scene('the universe, near: a quasar')) expect(entry.labels, entry.label).toContainEqual({ text: 'quasar — a feeding black hole outshining its galaxy', x: entry.view.w / 2, y: entry.view.h / 2 + 120, hold: 'below' });
    for (const entry of scene('the universe, near: a radio galaxy')) expect(entry.labels, entry.label).toContainEqual({ text: 'radio galaxy — jets inflate giant lobes', x: entry.view.w / 2, y: entry.view.h / 2 + 144, hold: 'below' });
    // Nothing is recorded whose place is far off the screen.
    for (const entry of fixture.entries) for (const label of entry.labels) {
      expect(label.x > -320 && label.x < entry.view.w + 320 && label.y > -62 && label.y < entry.view.h + 48, `${entry.label}: ${label.text}`).toBe(true);
    }
  });
});
