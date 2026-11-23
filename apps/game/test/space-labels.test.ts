import { describe, expect, it } from 'vitest';
import { drawText, parseInterfaceSheet } from '@cf/art-interface';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { galaxyName } from '@cf/domain-naming';
import { HOME_POS, SOL_POS } from '@cf/domain-worldconfig';
import { NAV_HOME, systemScene, universeGalaxies } from '@cf/scene';
import type { GalaxyNode } from '@cf/scene';
import { NAME_GATE, mapLabels, placedLabels } from '../src/space/labels';
import { cometsDrawn } from '../src/space/passes-system';
import { artCamera, artGrid, artScale } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { cosSin } from '../src/space/model';
import { SOL, VISITED, WORMHOLE_GALAXY, galaxyNav, systemNav } from './space-support';

const VIEW = { w: 1280, h: 720 };
const frame = (over: Partial<MapFrame>): MapFrame =>
  ({ nav: NAV_HOME, cam: { x: HOME_POS.x, y: HOME_POS.y, z: 1 }, view: VIEW, dpr: 1, time: 0, epoch: 0, reach: 880, charts: false, passes: { effects: true, motion: true }, sized: true, ...over });
const texts = (over: Partial<MapFrame>): string[] => mapLabels(frame(over), 'the Neighborhood').map((label) => label.text);
/** The first galaxy of a kind in the cells about a place, searched outward from home. */
function findGalaxy(is: (g: GalaxyNode) => boolean): GalaxyNode {
  for (let ring = 0; ring < 12; ring++) for (let cx = -ring; cx <= ring; cx++) for (let cy = -ring; cy <= ring; cy++) {
    const found = universeGalaxies(HOME_POS.x + cx * 2400, HOME_POS.y + cy * 2400, 3).find(is);
    if (found !== undefined) return found;
  }
  throw new Error('no such galaxy near home');
}
/** The labels with the view centred on a galaxy, just under and just over the zoom of a gate. */
const about = (g: GalaxyNode, gate: number): [string[], string[]] =>
  [0.99, 1.01].map((k) => texts({ cam: { x: g.x, y: g.y, z: (gate / g.size) * k } })) as [string[], string[]];

describe('the words on the maps', () => {
  it('every word the maps letter is drawn by the placeholder sheet with no box, the em dash among them', () => {
    const sheet = parseInterfaceSheet(testInterfaceSheetText());
    const lettered = [
      ...mapLabels(frame({ cam: { x: HOME_POS.x, y: HOME_POS.y, z: 0.3 } }), 'the Neighborhood'),
      ...mapLabels(frame({ nav: galaxyNav(), cam: { x: 0, y: 0, z: 1 } }), 'x'),
      ...mapLabels(frame({ nav: systemNav(), cam: { x: 0, y: 0, z: 0.9 }, charts: true }), 'x'),
    ].map((label) => label.text);
    const fixed = ['quasar — a feeding black hole outshining its galaxy', 'blazar — a quasar jet aimed straight at you', 'radio galaxy — jets inflate giant lobes', 'galaxy cluster', 'cosmic void', 'interstellar object'];
    expect(lettered).toEqual(expect.arrayContaining(['Milky Way — you are here', 'your charter — the Neighborhood', 'Sun — our star', 'Earth', 'asteroid belt', 'habitable zone']));
    const gaps = { glyphs: [] as number[], icons: [], elements: [] };
    for (const text of [...lettered, ...fixed]) drawText(sheet.font, text, gaps);
    expect(gaps.glyphs).toEqual([]);
    // Control: a character outside the sheet is counted.
    drawText(sheet.font, 'Café', gaps);
    expect(gaps.glyphs).toEqual([0xe9]);
  });


  it('the home galaxy is always lettered, hanging under it; the charter stands over its ring from the zoom it shows at', () => {
    const home = universeGalaxies(HOME_POS.x, HOME_POS.y, 3).find((g) => g.home)!;
    for (const z of [0.06, 0.3, 4]) {
      expect(mapLabels(frame({ cam: { x: home.x, y: home.y, z } }), 'x'), `${z}`)
        .toContainEqual({ text: 'Milky Way — you are here', wx: home.x, wy: home.y + home.size * 1.15 + 4, hold: 'below' });
    }
    const whole = { x: HOME_POS.x, y: HOME_POS.y, z: 0.3 };
    expect(mapLabels(frame({ cam: whole }), 'the Neighborhood')).toContainEqual({ text: 'your charter — the Neighborhood', wx: HOME_POS.x, wy: HOME_POS.y - 880 - 4, hold: 'above' });
    expect(texts({ cam: { x: HOME_POS.x, y: HOME_POS.y, z: 0.01 } })).not.toContain('your charter — the Neighborhood');
    // Close on home the top of the ring is far off the screen, and so are its words.
    expect(texts({ cam: { ...whole, z: 3 } })).toEqual(['Milky Way — you are here']);
  });

  it('a galaxy earns its name once it is 34 screen pixels in size; a dwarf never does', () => {
    const named = findGalaxy((g) => !g.home && !g.quasar && !g.radio && !g.dwarf);
    const [under, over] = about(named, NAME_GATE.galaxy);
    expect(under).not.toContain(galaxyName(named.seed));
    expect(over).toContain(galaxyName(named.seed));
    expect(mapLabels(frame({ cam: { x: named.x, y: named.y, z: 40 / named.size } }), 'x'))
      .toContainEqual({ text: galaxyName(named.seed), wx: named.x, wy: named.y + named.size * 1.15, hold: 'below' });
    const dwarf = findGalaxy((g) => g.dwarf && !g.home && !g.quasar && !g.radio);
    expect(texts({ cam: { x: dwarf.x, y: dwarf.y, z: 400 / dwarf.size } })).not.toContain(galaxyName(dwarf.seed));
  });

  it('a quasar, a blazar and a radio galaxy are told what they are, from their own gates, and not by name', () => {
    const cases: [GalaxyNode, string, number, number][] = [
      [findGalaxy((g) => g.quasar && !g.blazar), 'quasar — a feeding black hole outshining its galaxy', NAME_GATE.quasar, 2],
      [findGalaxy((g) => g.quasar && g.blazar), 'blazar — a quasar jet aimed straight at you', NAME_GATE.quasar, 2],
      [findGalaxy((g) => g.radio && !g.quasar), 'radio galaxy — jets inflate giant lobes', NAME_GATE.radio, 2.4],
    ];
    expect(NAME_GATE).toEqual({ galaxy: 34, radio: 30, quasar: 26 });
    for (const [g, text, gate, drop] of cases) {
      const [under, over] = about(g, gate);
      expect(under.filter((t) => t === text), text).toEqual([]);
      expect(over, text).toContain(text);
      expect(over).not.toContain(galaxyName(g.seed));
      expect(mapLabels(frame({ cam: { x: g.x, y: g.y, z: (gate / g.size) * 2 } }), 'x')).toContainEqual({ text, wx: g.x, wy: g.y + g.size * drop, hold: 'below' });
    }
  });

  it('the Sun is lettered 14 screen pixels over its place from the zoom its mark shows at, in the home galaxy alone', () => {
    const sun = { text: 'Sun — our star', wx: SOL_POS.x, wy: SOL_POS.y, hold: 'above', lift: 14 };
    expect(mapLabels(frame({ nav: galaxyNav(), cam: { x: 0, y: 0, z: 720 / 900 * 1.01 } }), 'x')).toEqual([sun]);
    expect(mapLabels(frame({ nav: galaxyNav(), cam: { x: 0, y: 0, z: 720 / 900 * 0.99 } }), 'x')).toEqual([]);
    expect(mapLabels(frame({ nav: galaxyNav(), cam: { x: 0, y: 0, z: 390 / 900 * 1.01 }, view: { w: 390, h: 844 } }), 'x')).toEqual([sun]);
    expect(mapLabels(frame({ nav: galaxyNav(WORMHOLE_GALAXY), cam: { x: 0, y: 0, z: 2 } }), 'x')).toEqual([]);
    // With the Sun far off the screen its words are not listed; just off its edge they still are.
    expect(mapLabels(frame({ nav: galaxyNav(), cam: { x: 0, y: 0, z: 12 } }), 'x')).toEqual([]);
    expect(mapLabels(frame({ nav: galaxyNav(), cam: { x: SOL_POS.x - 700 / 4, y: SOL_POS.y, z: 4 } }), 'x')).toEqual([sun]);
  });

  it('each planet on the screen is named under its disc and its name follows it; the belt is named with the star charts', () => {
    const nav = systemNav();
    const planets = systemScene(SOL.seed).planets;
    const under = (time: number) => planets.map((p) => {
      const [cos, sin] = cosSin(p.orb * 0.13 + time * 0.05 / (p.orb * 0.012));
      return { text: p.name, wx: cos * p.orb, wy: sin * p.orb + 6 * (Number(p.P.sizeMul) || 1), hold: 'below' };
    });
    const wide = { x: 0, y: 0, z: 0.9 };
    expect(planets.map((p) => p.name)).toContain('Earth');
    expect(mapLabels(frame({ nav, cam: wide }), 'x')).toEqual(expect.arrayContaining(under(0)));
    expect(mapLabels(frame({ nav, cam: wide, time: 50 }), 'x')).toEqual(expect.arrayContaining(under(50)));
    expect(under(50)).not.toEqual(under(0));
    // With motion reduced the names stay where the held planets are.
    expect(mapLabels(frame({ nav, cam: wide, time: 50, passes: { effects: true, motion: false } }), 'x')).toEqual(expect.arrayContaining(under(0)));
    // A planet off the screen is not named.
    const earth = under(0).find((label) => label.text === 'Earth')!;
    const close = texts({ nav, cam: { x: earth.wx, y: earth.wy, z: 40 } });
    expect(close.filter((t) => planets.some((p) => p.name === t))).toEqual(['Earth']);
    const belt = (systemScene(SOL.seed).belt as { r: number }).r;
    expect(mapLabels(frame({ nav, cam: wide, charts: true }), 'x')).toContainEqual({ text: 'asteroid belt', wx: 0, wy: -belt - 2, hold: 'above' });
    expect(texts({ nav, cam: wide, charts: true })).toContain('habitable zone');
    expect(texts({ nav, cam: wide })).not.toContain('asteroid belt');
  });
});

describe('the words of a system keep off a comet\'s tail', () => {
  const font = parseInterfaceSheet(testInterfaceSheetText()).font;
  // A new game's view of Sol on a phone and on a desktop, under the top bar and the dock.
  const VIEWS = [
    { view: { w: 390, h: 844 }, dpr: 3, z: 0.511875, keepOut: [{ x: 0, y: 0, w: 390, h: 60 }, { x: 140, y: 784, w: 110, h: 52 }] },
    { view: { w: 1280, h: 720 }, dpr: 1, z: 0.945, keepOut: [{ x: 0, y: 0, w: 1280, h: 60 }, { x: 585, y: 660, w: 110, h: 52 }] },
  ];
  /** The words that hold a pixel of the comet's tail, at a time. */
  function crossed(at: (typeof VIEWS)[number], time: number, tails: boolean, passes = { effects: true, motion: true }): string[] {
    const sol = frame({ nav: systemNav(), cam: { x: 0, y: 0, z: at.z }, view: at.view, dpr: at.dpr, time, passes, placement: tails ? { keepOut: at.keepOut, tails: true } : { keepOut: at.keepOut } });
    const scale = artScale(at.view.w, at.view.h, at.dpr);
    const tail = cometsDrawn({ ...passes, nav: sol.nav, cam: artCamera(sol.cam, at.dpr, scale), grid: artGrid(at.view.w, at.view.h, at.dpr, scale), view: at.view, zoom: at.z, time: passes.motion ? time : 0, reach: 880, charts: false })
      .flatMap((comet) => comet.tail);
    expect(tail.length).toBeGreaterThan(0);
    return placedLabels(sol, 'x', font).filter((box) => tail.some((p) => p.x >= box.x && p.x < box.x + box.w && p.y >= box.y && p.y < box.y + box.h)).map((box) => box.text);
  }
  const ORBIT = Array.from({ length: 180 }, (_, i) => i * 0.25);

  it('through an orbit of Sol\'s comet a planet\'s name is crossed by its tail only where none of its sides is clear, and every planet is still named', () => {
    const moments = (at: (typeof VIEWS)[number]): string[] => ORBIT.flatMap((time) => crossed(at, time, true).map((text) => `${text} at ${time}`));
    // What is left: Mercury and Venus close under the Sun, with the Sun, a planet or the tail on every side of them.
    expect(moments(VIEWS[0]!)).toEqual(['Mercury at 0.25', 'Venus at 43.5', 'Venus at 43.75', 'Venus at 44']);
    expect(moments(VIEWS[1]!)).toEqual(['Venus at 43.5', 'Venus at 43.75']);
    for (const at of VIEWS) {
      const named = placedLabels(frame({ nav: systemNav(), cam: { x: 0, y: 0, z: at.z }, view: at.view, dpr: at.dpr, placement: { keepOut: at.keepOut, tails: true } }), 'x', font).map((box) => box.text);
      expect(named).toEqual(expect.arrayContaining(systemScene(SOL.seed).planets.map((p) => p.name)));
    }
  });
  it('where a new game starts the tail runs through the place the game letters Mercury: the name moves off it', () => {
    for (const at of VIEWS) {
      expect(crossed(at, 0, false)).toEqual(['Mercury']);
      expect(crossed(at, 0, true)).toEqual([]);
      // With motion reduced the comet is held where it starts, and the words keep off it there at any time.
      expect(crossed(at, 20, true, { effects: true, motion: false })).toEqual([]);
    }
  });
  it('a frame that does not ask for it letters the words as before', () => {
    for (const at of VIEWS) expect(ORBIT.flatMap((time) => crossed(at, time, false)).length).toBeGreaterThan(20);
  });
});

describe('the name of a comet and of the visitor', () => {
  const font = parseInterfaceSheet(testInterfaceSheetText()).font;
  // Near enough for both: 720 / 520 is 1.385.
  const near = (nav: MapFrame['nav'], placement?: MapFrame['placement']): MapFrame => frame({ nav, cam: { x: 0, y: 0, z: 1.4 }, ...(placement === undefined ? {} : { placement }) });
  const [cos, sin] = [Math.cos(1.1), Math.sin(1.1)];

  it('stands on its foot two units above the comet where the frame asks for it, as the game anchors it', () => {
    const asked = near(systemNav(), { keepOut: [], stand: true });
    const label = mapLabels(asked, 'x').find((l) => l.text.startsWith('Comet '))!;
    expect(label.hold).toBe('above');
    expect([label.wx, label.wy]).toEqual([expect.closeTo(27 * cos, 9), expect.closeTo(27 * sin - 2, 9)]);
    // On the map: centred over the comet's head, its foot two world units above it.
    const scale = artScale(VIEW.w, VIEW.h, 1);
    const cam = artCamera(asked.cam, 1, scale);
    const [head] = cometsDrawn({ effects: true, motion: true, nav: asked.nav, cam, grid: artGrid(VIEW.w, VIEW.h, 1, scale), view: VIEW, zoom: 1.4, time: 0, reach: 880, charts: false }).map((comet) => comet.head);
    const box = placedLabels(asked, 'x', font).find((l) => l.text.startsWith('Comet '))!;
    expect([box.side, box.x, box.y + box.h]).toEqual(['above', head!.x - (box.w >> 1), head!.y - Math.round(2 * cam.z)]);
  });

  it('lies centred on the game\'s point in a frame that does not ask, as before', () => {
    for (const placement of [undefined, { keepOut: [] }, { keepOut: [], tails: true }]) {
      const label = mapLabels(near(systemNav(), placement), 'x').find((l) => l.text.startsWith('Comet '))!;
      expect(label).toEqual({ text: label.text, wx: expect.closeTo(27 * cos, 9), wy: expect.closeTo(27 * sin - 2, 9), hold: 'centre' });
    }
    expect(placedLabels(near(systemNav(), { keepOut: [] }), 'x', font).find((l) => l.text.startsWith('Comet '))!.side).toBe('centre');
  });

  it('the visitor\'s stands four units above it', () => {
    const visited = systemNav(VISITED);
    const plain = mapLabels(near(visited), 'x').find((l) => l.text === 'interstellar object')!;
    const stood = mapLabels(near(visited, { keepOut: [], stand: true }), 'x').find((l) => l.text === 'interstellar object')!;
    expect([plain.hold, stood.hold, stood.wx, stood.wy]).toEqual(['centre', 'above', plain.wx, plain.wy]);
    // The words of the place itself are not stood: the habitable zone lies on its band.
    expect(mapLabels(frame({ nav: systemNav(), cam: { x: 0, y: 0, z: 1.4 }, charts: true, placement: { keepOut: [], stand: true } }), 'x').find((l) => l.text === 'habitable zone')!.hold).toBe('centre');
  });
});
