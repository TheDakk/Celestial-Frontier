import { describe, expect, it } from 'vitest';
import { ELEMENT_NAMES, paintSpace, parseInterfaceSheet, type Gaps, type InterfaceSheet, type SpaceItem } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { galaxiesInCell } from '@cf/domain-worldgen';
import { NAV_HOME, systemScene, universeGalaxies } from '@cf/scene';
import { UCELL } from '@cf/domain-worldconfig';
import { supernovaBodies, visibleBodies } from '../apps/game/src/space/model';
import type { MapBody } from '../apps/game/src/space/model';
import { GALAXY_KINDS, ORIENTATIONS, PLANET_BANDS, PRIMARY_KINDS, mapItems, projectMap, projectScenery } from '../apps/game/src/space/project';
import { turnGalaxy } from '../apps/game/src/space/passes-universe';
import { HOME, KAUM, MAGNETAR, OSUM, PULSAR, SOL, WORMHOLE_GALAXY, galaxyNav, passView, systemNav } from '../apps/game/test/space-support';
import { GAL_KIND } from '../packages/domain/descriptors/src/apphooks.verbatim.js';
import galaxyCells from '../fixtures/current/galaxies.json' with { type: 'json' };

const sheet = parseInterfaceSheet(testInterfaceSheetText());
const GRID = { w: 64, h: 64 };
const NEAR = { x: 0, y: 0, z: 1 };
const WHOLE = { w: 9000, h: 9000 };
const OPTIONS = { reach: 880, charts: true };

/** Everything the walk meets, as things to paint up close, and the planet types it meets. */
function walk(): { items: SpaceItem[]; planetTypes: Set<string> } {
  const items: SpaceItem[] = [];
  // Every galaxy of every cell the galaxies fixture holds.
  for (const cell of galaxyCells) {
    const centre = { x: (cell.cx + 0.5) * UCELL, y: (cell.cy + 0.5) * UCELL };
    const galaxies = universeGalaxies(centre.x, centre.y, 0);
    expect(galaxies.map((g) => g.seed), `cell ${cell.cx},${cell.cy}`).toEqual(cell.galaxies.map((g) => g.seed));
    const bodies: MapBody[] = galaxies.map((g) => ({ kind: 'galaxy', key: `${g.seed}`, label: '', priority: 1, wx: g.x, wy: g.y, ref: g }));
    items.push(...projectMap(bodies, NEAR, GRID, 0));
  }
  items.push(...projectScenery(NAV_HOME, NEAR, GRID, 0, OPTIONS));
  // The home galaxy: its stars, its scenery, its supernova sites at the first epoch, its centre.
  const home = galaxyNav(HOME);
  items.push(...projectScenery(home, NEAR, GRID, 0, OPTIONS));
  items.push(...projectMap([...visibleBodies(home, NEAR, WHOLE, 0), ...supernovaBodies(home, 0)], NEAR, GRID, 0));
  // The Sol, Kaum and Osum systems.
  const planetTypes = new Set<string>();
  for (const star of [SOL, KAUM, OSUM]) {
    const nav = systemNav(star);
    for (const planet of systemScene(star.seed).planets) planetTypes.add(planet.type);
    items.push(...projectScenery(nav, NEAR, GRID, 0, OPTIONS));
    items.push(...projectMap(visibleBodies(nav, NEAR, WHOLE, 0), NEAR, GRID, 0));
  }
  return { items, planetTypes };
}
const namesOf = (items: readonly SpaceItem[]): string[] => [...new Set(items.flatMap((item) => item.kind === 'element' ? [item.name] : []))];
function gapsOf(items: readonly SpaceItem[], withSheet: InterfaceSheet): string[] {
  const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
  paintSpace(GRID.w, GRID.h, items, withSheet, gaps);
  return [...new Set(gaps.elements)];
}

describe('space element coverage', () => {
  const { items, planetTypes } = walk();
  const met = namesOf(items);

  it('coverage walk: every galaxy, star, decoration and planet kind met in the galaxies fixture cells, the home galaxy and the Sol, Kaum and Osum systems has an element name; the placeholder sheet leaves no gap', () => {
    const unnamed = met.filter((name) => !ELEMENT_NAMES.includes(name));
    if (unnamed.length > 0) console.log(`elements with no name in ELEMENT_NAMES: ${unnamed.join(', ')}`);
    expect(unnamed).toEqual([]);
    const missing = gapsOf(items, sheet);
    if (missing.length > 0) console.log(`elements the placeholder sheet lacks: ${missing.join(', ')}`);
    expect(missing).toEqual([]);
    // A planet is a disc banded by its type, not an element: every type met has its bands.
    expect([...planetTypes].filter((type) => !(type in PLANET_BANDS))).toEqual([]);
    expect([...planetTypes].sort()).toEqual(['desert', 'gas', 'ice', 'ocean', 'rocky', 'terran', 'venus']);
  });

  it('the walk meets every galaxy kind, a radio galaxy, every scenery kind, supernova sites, giants and a double star', () => {
    expect(galaxyCells.length).toBe(289);
    const kinds = new Set(met.map((name) => name.replace(/\/v\d$/, '')));
    expect([...kinds].sort()).toEqual([
      'black-hole', 'companion', 'deco/fbd', 'deco/h2', 'deco/mol', 'deco/neb', 'deco/plan', 'deco/rem', 'deco/rogue',
      'galaxy/barred', 'galaxy/elliptical', 'galaxy/irregular', 'galaxy/lenticular', 'galaxy/spiral',
      'primary/star', 'protostar', 'radio-lobes', 'star/giant', 'supernova/ns', 'supernova/shell',
    ]);
    for (const kind of ['spiral', 'barred', 'lenticular', 'elliptical', 'irregular']) {
      expect(met.filter((name) => name.startsWith(`galaxy/${kind}/`)).sort(), kind).toEqual(['v0', 'v1', 'v2', 'v3'].map((v) => `galaxy/${kind}/${v}`));
    }
  });

  it('a name the sheet lacks is reported by the walk', () => {
    const lacking = { ...sheet, elements: new Map([...sheet.elements].filter(([name]) => name !== 'deco/rem' && name !== 'galaxy/barred/v2')) };
    expect(gapsOf(items, lacking).sort()).toEqual(['deco/rem', 'galaxy/barred/v2']);
  });

  it('ELEMENT_NAMES is every name a map can ask for, no more and no fewer, and the placeholder sheet draws each', () => {
    const possible = new Set<string>(['quasar', 'star/giant', 'wormhole', 'protostar', 'black-hole', 'companion', 'primary/star']);
    for (const kind of new Set(GALAXY_KINDS)) for (let v = 0; v < ORIENTATIONS; v++) possible.add(`galaxy/${kind}/v${v}`);
    for (let v = 0; v < ORIENTATIONS; v++) possible.add(`radio-lobes/v${v}`);
    for (const kind of Object.values(PRIMARY_KINDS)) possible.add(`primary/${kind}`);
    for (const kind of ['h2', 'neb', 'mol', 'plan', 'rem', 'rogue', 'fbd']) possible.add(`deco/${kind}`);
    for (const remnant of ['shell', 'ns', 'bh']) possible.add(`supernova/${remnant}`);
    // What moves: three further frames of each thing that turns, and the dimmed form of each thing that pulses.
    for (const name of ['wormhole', 'supernova/ns', 'primary/ns', 'primary/mag']) for (const frame of ['t1', 't2', 't3']) possible.add(`${name}/${frame}`);
    for (const name of ['star/giant', 'quasar', 'protostar']) possible.add(`${name}/dim`);
    expect([...ELEMENT_NAMES].sort()).toEqual([...possible].sort());
    expect(new Set(ELEMENT_NAMES).size).toBe(ELEMENT_NAMES.length);
    expect([...sheet.elements.keys()].sort()).toEqual([...ELEMENT_NAMES].sort());
    expect(met.every((name) => possible.has(name))).toBe(true);
  });

  it('coverage walk in time: with the passes on, every frame and dimmed form the walked maps ask for over five seconds has a name and a stand-in', () => {
    const view = { w: 9000, h: 9000 };
    const moving: SpaceItem[] = [];
    for (const time of [0, 0.3, 0.7, 1.1, 1.6, 2.2, 3.1, 4.5]) {
      for (const nav of [NAV_HOME, galaxyNav(HOME), galaxyNav(WORMHOLE_GALAXY), ...[SOL, KAUM, OSUM, PULSAR, MAGNETAR].map((star) => systemNav(star))]) {
        moving.push(...mapItems({ nav, cam: NEAR, view, dpr: 1, time, epoch: 0, ...OPTIONS, passes: { effects: true, motion: true } }, GRID, 1));
      }
    }
    // No blazar lies in the cells about home: the first galaxy of the walk is made one, and walked through its pulse.
    const blazar = { ...universeGalaxies(HOME.x, HOME.y, 0)[0]!, quasar: true, blazar: true };
    expect(blazar.home).toBe(true);
    for (const time of [0, 0.1, 0.2, 0.3, 0.4, 0.5]) {
      moving.push(...turnGalaxy(blazar, [{ kind: 'element', name: 'quasar', x: 0, y: 0, ramp: 0xffffff }], passView(NAV_HOME, NEAR, { time })));
    }
    const names = namesOf(moving);
    const unnamed = names.filter((name) => !ELEMENT_NAMES.includes(name));
    if (unnamed.length > 0) console.log(`elements with no name in ELEMENT_NAMES: ${unnamed.join(', ')}`);
    expect(unnamed).toEqual([]);
    const missing = gapsOf(moving, sheet);
    if (missing.length > 0) console.log(`elements the placeholder sheet lacks: ${missing.join(', ')}`);
    expect(missing).toEqual([]);
    expect(names.filter((name) => /\/(t\d|dim)$/.test(name)).sort()).toEqual([
      'primary/mag/t1', 'primary/mag/t2', 'primary/mag/t3', 'primary/ns/t1', 'primary/ns/t2', 'primary/ns/t3', 'protostar/dim', 'quasar/dim', 'star/giant/dim',
      'supernova/ns/t1', 'supernova/ns/t2', 'supernova/ns/t3', 'wormhole/t1', 'wormhole/t2', 'wormhole/t3',
    ]);
    const lacking = { ...sheet, elements: new Map([...sheet.elements].filter(([name]) => name !== 'wormhole/t2' && name !== 'star/giant/dim')) };
    expect(gapsOf(moving, lacking).sort()).toEqual(['star/giant/dim', 'wormhole/t2']);
  });

  it("the galaxy kinds are the game's own, sprite by sprite", () => {
    expect(GALAXY_KINDS).toEqual(GAL_KIND);
    // Every galaxy the fixture cells hold has a sprite number the table covers.
    for (const cell of galaxyCells) for (const g of galaxiesInCell(cell.cx, cell.cy)) expect(GALAXY_KINDS[g.sp]).toBeDefined();
  });
});
