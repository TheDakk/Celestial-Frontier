import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measureText, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { NAV_HOME, currentRegionOf, systemScene } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { place } from '../apps/game/src/space/draw';
import { overlaps, reaches, type Box } from '../apps/game/src/space/label-place';
import { mapLabels, placedLabels, type Lettered } from '../apps/game/src/space/labels';
import { artCamera, artGrid, artScale, type MapFrame } from '../apps/game/src/space/project';
import { toScreen } from '../apps/game/src/space/camera';
import { galaxyContent, visibleBodies } from '../apps/game/src/space/model';
import { STAR_WIDTH, starBase } from '../apps/game/src/space/sizes';
import { galaxyNav, systemNav } from '../apps/game/test/space-support';

type Place = 'universe' | 'home-galaxy' | 'sol';
interface Entry extends Omit<MapFrame, 'nav'> { label: string; place: Place; placement: NonNullable<MapFrame['placement']>; labels: Lettered[] }
const fixture: { sheet: string; entries: Entry[] } = JSON.parse(readFileSync(new URL('../fixtures/art/space-v4.json', import.meta.url), 'utf8'));
const font = parseInterfaceSheet(testInterfaceSheetText()).font;
const NAVS: Record<Place, NavState> = { universe: NAV_HOME, 'home-galaxy': galaxyNav(), sol: systemNav() };
const frameOf = (entry: Entry): MapFrame => ({ ...entry, nav: NAVS[entry.place] });
const scene = (start: string): Entry[] => fixture.entries.filter((e) => e.label.startsWith(start));
const words = (entry: Entry, text: string): Lettered => entry.labels.find((label) => label.text === text)!;
/** The picture of an entry: its grid, its camera, and how many of its pixels one screen pixel is. */
function pictureOf(entry: Entry) {
  const scale = artScale(entry.view.w, entry.view.h, entry.dpr);
  return { grid: artGrid(entry.view.w, entry.view.h, entry.dpr, scale), cam: artCamera(entry.cam, entry.dpr, scale), perCss: entry.dpr / scale };
}
/** What covers the map of an entry, in its picture's pixels, grown outward to whole ones. */
function barsOf(entry: Entry): Box[] {
  const { perCss } = pictureOf(entry);
  return entry.placement.keepOut.map((bar) => {
    const x = Math.floor(bar.x * perCss);
    const y = Math.floor(bar.y * perCss);
    return { x, y, w: Math.ceil((bar.x + bar.w) * perCss) - x, h: Math.ceil((bar.y + bar.h) * perCss) - y };
  });
}

describe('the words of the maps, stood where they can be read', () => {
  it('every recorded map letters its words in the recorded boxes, at both screen sizes', () => {
    expect(fixture.sheet).toBe('art-testparts');
    expect(fixture.entries).toHaveLength(24);
    for (const entry of fixture.entries) {
      expect(placedLabels(frameOf(entry), currentRegionOf(0).name, font), entry.label).toEqual(entry.labels);
      expect([entry.sized, entry.passes], entry.label).toEqual([true, { effects: true, motion: true }]);
    }
    const labels = [...new Set(fixture.entries.map((e) => e.label.replace(/, \d+ by \d+ at \d$/, '')))];
    expect(labels).toHaveLength(12);
    for (const label of labels) expect(scene(`${label},`).map((e) => `${e.view.w}x${e.view.h}`), label).toEqual(['390x844', '1280x720']);
    expect(fixture.entries.filter((e) => e.placement.keepOut.length === 2)).toHaveLength(20);
  });

  it('no words overlap other words, the top bar or the dock; every box is whole numbers and every line fits the view', () => {
    let pairs = 0;
    for (const entry of fixture.entries) {
      const { grid } = pictureOf(entry);
      for (const a of entry.labels) {
        for (const value of [a.x, a.y, a.w, a.h]) expect(Number.isInteger(value), `${entry.label}: ${a.text}`).toBe(true);
        expect(a.lines.join(' '), entry.label).toBe(a.text);
        expect([a.w, a.h], `${entry.label}: ${a.text}`).toEqual([Math.max(...a.lines.map((line) => measureText(font, line).w)), a.lines.length * font.line]);
        expect(a.w, `${entry.label}: ${a.text}`).toBeLessThanOrEqual(grid.w);
        for (const bar of barsOf(entry)) expect(overlaps(a, bar), `${entry.label}: ${a.text} on a bar`).toBe(false);
        for (const b of entry.labels) if (a !== b) { pairs += 1; expect(overlaps(a, b), `${entry.label}: ${a.text} on ${b.text}`).toBe(false); }
      }
    }
    expect(pairs).toBeGreaterThan(200);
  });

  it('where the game\'s own places put words on words, on a ring or under a bar, they have moved; elsewhere they stand where the game letters them', () => {
    // The game's places, as boxes of the same picture.
    const gameBoxes = (entry: Entry): Array<Box & { text: string }> => {
      const { perCss } = pictureOf(entry);
      return mapLabels(frameOf(entry), currentRegionOf(0).name).map((label) => {
        const at = toScreen(entry.cam, entry.view, label.wx, label.wy);
        const w = measureText(font, label.text).w;
        const top = label.hold === 'above' ? at.y * perCss - (label.lift ?? 0) * perCss - font.line : label.hold === 'below' ? at.y * perCss : at.y * perCss - font.line / 2;
        return { text: label.text, x: Math.round(at.x * perCss - w / 2), y: Math.round(top), w, h: font.line };
      });
    };
    // The far universe on a phone: the game puts the home galaxy's words across a neighbouring galaxy.
    const far = scene('the universe, far: the whole charter,')[0]!;
    const { grid, cam } = pictureOf(far);
    const neighbours = visibleBodies(NAV_HOME, far.cam, far.view, 0).flatMap((body) => (body.kind === 'galaxy' && !body.ref.home
      ? [{ ...place(cam, grid, body.wx, body.wy), r: Math.round(body.ref.size * cam.z) }] : [])).filter((disc) => disc.r >= 3);
    const home = 'Milky Way — you are here';
    expect(neighbours.some((disc) => reaches(gameBoxes(far).find((b) => b.text === home)!, disc))).toBe(true);
    expect(neighbours.some((disc) => reaches(words(far, home), disc))).toBe(false);
    expect(words(far, home).side).toBe('above');
    // Words alone in the view stand exactly where the game letters them.
    for (const entry of [...scene('the Sol system, near: about Earth'), ...scene('the universe, near: a quasar, told')]) {
      const game = gameBoxes(entry);
      expect(entry.labels.map((label) => label.text), entry.label).toEqual(game.map((box) => box.text));
      entry.labels.forEach((label, i) => {
        // To the pixel, but for the rounding of a half.
        expect([Math.abs(label.x - game[i]!.x) <= 1, Math.abs(label.y - game[i]!.y) <= 1, label.w, label.h], `${entry.label}: ${label.text}`).toEqual([true, true, game[i]!.w, game[i]!.h]);
      });
    }
    // Up close the Sun's light is wider than the 14 pixels the game lifts its words: they stand over the light.
    for (const entry of scene('the home galaxy, near: about the Sun')) {
      const { grid, cam, perCss } = pictureOf(entry);
      const sun = galaxyContent(galaxyNav().gal).stars.find((star) => star.sol === true)!;
      const halo = { ...place(cam, grid, sun.x, sun.y), r: Math.round(sun.s * starBase(entry.cam.z) * STAR_WIDTH.coarse * 0.3 * cam.z) };
      const game = gameBoxes(entry)[0]!;
      expect(halo.r, entry.label).toBeGreaterThan(14 * perCss);
      expect([reaches(game, halo), reaches(entry.labels[0]!, halo), entry.labels[0]!.side], entry.label).toEqual([true, false, 'above']);
      expect(entry.labels[0]!.y + entry.labels[0]!.h, entry.label).toBe(halo.y - halo.r - 2);
    }
    // Under the top bar the charter's words leave the top of its ring; without the bar they stand over it.
    const [open, barred] = [scene('the universe, far: the whole charter,')[1]!, scene('the universe, far: the whole charter under')[1]!];
    const charter = `your charter — ${currentRegionOf(0).name}`;
    expect([words(open, charter).side, words(barred, charter).side]).toEqual(['above', 'right']);
    expect(overlaps(words(open, charter), barsOf(barred)[0]!)).toBe(true);
    // The quasar's words, by the edge of the view, are slid to stay in it.
    for (const entry of scene('the universe, near: a quasar by the edge')) {
      const { grid } = pictureOf(entry);
      const quasar = entry.labels[0]!;
      expect(quasar.x + quasar.w, entry.label).toBeLessThanOrEqual(grid.w);
      expect(gameBoxes(entry)[0]!.x + quasar.w, entry.label).toBeGreaterThan(grid.w);
    }
  });

  it('a ringed planet\'s name stands clear of its ring, and no planet\'s name reaches into its own disc', () => {
    let ringed = 0;
    for (const entry of fixture.entries.filter((e) => e.place === 'sol')) {
      const { grid, cam } = pictureOf(entry);
      for (const body of visibleBodies(NAVS.sol, entry.cam, entry.view, 0)) {
        if (body.kind !== 'planet') continue;
        const label = entry.labels.find((l) => l.text === body.ref.name);
        if (label === undefined) continue;
        const size = 6 * (Number(body.ref.P.sizeMul) || 1);
        const at = place(cam, grid, body.wx, body.wy);
        expect(reaches(label, { ...at, r: Math.round(size * cam.z) }), `${entry.label}: ${label.text}`).toBe(false);
        if (!body.ref.ring) continue;
        ringed += 1;
        const ring = Math.round(size * 2.1 * cam.z);
        expect(reaches(label, { ...at, r: ring + 1 }), `${entry.label}: ${label.text} on its ring`).toBe(false);
        // Where the game letters it, at the planet's own radius, it lies across the ring.
        if (ring > 3) expect(reaches({ x: at.x - (label.w >> 1), y: at.y + Math.round(size * cam.z), w: label.w, h: label.h }, { ...at, r: ring }), `${entry.label}: ${label.text}`).toBe(true);
      }
    }
    expect(ringed).toBeGreaterThanOrEqual(8);
    expect(systemScene(systemNav().star.seed).planets.filter((p) => p.ring).map((p) => p.name)).toEqual(expect.arrayContaining(['Saturn', 'Uranus']));
  });
});
