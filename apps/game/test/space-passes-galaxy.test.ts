import { describe, expect, it } from 'vitest';
import type { SpaceItem } from '@cf/art-interface';
import { GR, NAV_HOME } from '@cf/scene';
import { descentCamera } from '../src/space/camera';
import { hsl, place, scaled } from '../src/space/draw';
import type { MapBody } from '../src/space/model';
import { hazeItems, stirGalaxyBody } from '../src/space/passes-galaxy';
import { mapItems } from '../src/space/project';
import type { MapFrame } from '../src/space/project';
import { SOL, WORMHOLE_GALAXY, galaxyNav, kindOf, namesOf, passView, systemNav } from './space-support';

const home = galaxyNav();
const ENTRY = descentCamera('galaxy', 720).to;
const entry = passView(home, ENTRY);
const frame = (over: Partial<MapFrame> = {}): MapFrame =>
  ({ nav: home, cam: ENTRY, view: { w: 1280, h: 720 }, dpr: 1, time: 0, epoch: 0, reach: 880, charts: true, passes: { effects: true, motion: true }, ...over });
const items = (f: MapFrame): SpaceItem[] => mapItems(f, { w: 640, h: 360 }, 2);

describe('the galaxy haze', () => {
  const haze = hazeItems(entry);

  it('fills the disk of the galaxy in rings of light that brighten step by step toward a warm core', () => {
    const centre = place(entry.cam, entry.grid, 0, 0);
    const disk = kindOf(haze, 'veil').slice(0, 11);
    expect(disk.every((ring) => ring.x === centre.x && ring.y === centre.y && ring.light === true)).toBe(true);
    expect(disk.map((ring) => ring.r)).toEqual([1, 0.85, 0.7, 0.56, 0.42, 0.28, 0.2, 0.13, 0.06, 0.03, 0.012].map((part) => Math.round(GR * part * entry.cam.z)));
    // How much light a ring carries: the brightness of its colour times the share of its pixels painted.
    const carried = disk.map((ring) => ((ring.colour >> 16) + ((ring.colour >> 8) & 255) + (ring.colour & 255)) * ring.level);
    for (let i = 1; i < carried.length; i++) expect(carried[i], `ring ${i}`).toBeGreaterThan(carried[i - 1]!);
    expect(disk[0]!.level).toBe(1);
    expect(disk[10]).toMatchObject({ colour: 0xfff0d6, level: 14 });
    // The disk takes the hue of the galaxy: the home galaxy's is 195 degrees.
    expect(disk[8]!.colour).toBe(hsl(195, 0.58, 0.76));
  });

  it('glows along the arms, carries the pink knots, and shows more of its grain the closer the view', () => {
    const veils = kindOf(haze, 'veil');
    expect(veils.filter((item) => item.colour === 0x313540 || item.colour === 0x626980).length).toBeGreaterThan(200);
    // Fourteen knots to each arm, all inside the picture here.
    const knots = veils.filter((item) => item.colour === scaled(hsl(332, 0.75, 0.68), 0.25));
    expect(knots.length % 14).toBe(0);
    expect(knots.length).toBeGreaterThanOrEqual(28);
    const grainAt = (z: number): number => kindOf(hazeItems(passView(home, { x: 0, y: 0, z })), 'dot').length;
    expect(grainAt(ENTRY.z)).toBeLessThan(50);
    expect(grainAt(2)).toBeGreaterThan(500);
    for (const dot of kindOf(hazeItems(passView(home, { x: 300, y: 100, z: 2 })), 'dot')) {
      expect(dot.x >= 0 && dot.x < 640 && dot.y >= 0 && dot.y < 360).toBe(true);
    }
  });

  it('is under everything else of the galaxy, is the same each time, and differs from galaxy to galaxy', () => {
    const all = items(frame());
    expect(all.slice(900, 900 + haze.length)).toEqual(haze);
    expect(hazeItems(passView(home, ENTRY))).toEqual(haze);
    const other = hazeItems(passView(galaxyNav(WORMHOLE_GALAXY), ENTRY));
    expect(other).not.toEqual(haze);
    expect(hazeItems(passView(home, ENTRY))).toEqual(haze);
  });

  it('belongs to the galaxy map alone', () => {
    expect(hazeItems(passView(NAV_HOME, ENTRY))).toEqual([]);
    expect(hazeItems(passView(systemNav(SOL), ENTRY))).toEqual([]);
    const { passes: _, ...plain } = frame();
    expect(kindOf(items(plain), 'veil')).toEqual([]);
  });
});

describe('the galaxy map in time', () => {
  const v = passView(home, ENTRY);
  const star = (s: number, priority = 1, seed = 97): MapBody => ({ kind: 'star', key: 's', label: 's', priority, wx: 0, wy: 0, ref: { x: 0, y: 0, c: '#c8c8c8', s, seed } });
  const dot: SpaceItem[] = [{ kind: 'dot', x: 1, y: 2, colour: 0xc8c8c8 }];
  const giant: SpaceItem[] = [{ kind: 'element', name: 'star/giant', x: 1, y: 2, ramp: 0xc8c8c8 }, { kind: 'ring', x: 1, y: 2, r: 6, colour: 0xffd9a0 }];
  const shade = (item: SpaceItem | undefined): number => (item?.kind === 'dot' ? item.colour & 255 : -1);

  it('a bright star breathes between 0.64 and 1 of its light; a faint one and a fine one do not', () => {
    // The seed adds nothing to the phase here: sin(2.4 t) is 0 at t = 0, 1 a quarter of the way round and -1 at three quarters.
    const quarter = Math.PI / 2 / 2.4;
    expect(shade(stirGalaxyBody(star(1.4), dot, v)[0])).toBe(Math.round(200 * 0.82));
    expect(shade(stirGalaxyBody(star(1.4), dot, { ...v, time: quarter })[0])).toBe(200);
    expect(shade(stirGalaxyBody(star(1.4), dot, { ...v, time: 3 * quarter })[0])).toBe(Math.round(200 * 0.64));
    expect(stirGalaxyBody(star(1.3), dot, { ...v, time: 3 * quarter })).toEqual(dot);
    expect(stirGalaxyBody(star(1.4, 2), dot, { ...v, time: 3 * quarter })).toEqual(dot);
    // Stars of different seeds are out of step.
    expect(shade(stirGalaxyBody(star(1.4, 1, 5), dot, v)[0])).not.toBe(shade(stirGalaxyBody(star(1.4), dot, v)[0]));
  });

  it('a giant dims by name in the low half of its breath, and its Sol mark is left alone', () => {
    expect(stirGalaxyBody(star(1.6), giant, { ...v, time: Math.PI / 2 / 2.4 })).toEqual(giant);
    expect(stirGalaxyBody(star(1.6), giant, { ...v, time: 3 * Math.PI / 2 / 2.4 })).toEqual([{ ...giant[0], name: 'star/giant/dim' }, giant[1]]);
  });

  it('with motion reduced the breath is held at 0.9; with effects off the star is as it is', () => {
    for (const time of [0, 1, 7.7]) expect(shade(stirGalaxyBody(star(1.4), dot, { ...v, time, motion: false })[0])).toBe(180);
    expect(stirGalaxyBody(star(1.6), giant, { ...v, time: 2, motion: false })).toEqual(giant);
    expect(stirGalaxyBody(star(1.4), dot, { ...v, time: 2, effects: false })).toEqual(dot);
  });

  const named = (body: Partial<MapBody> & Pick<MapBody, 'kind' | 'ref'>, name: string, time: number, over = {}): string =>
    namesOf(stirGalaxyBody({ key: 'k', label: 'l', priority: 3, wx: 0, wy: 0, ...body } as MapBody, [{ kind: 'element', name, x: 0, y: 0, ramp: 0 }], { ...v, time, ...over }))[0]!;

  it('the wormhole turns through four frames a turn', () => {
    const worm = { kind: 'worm', ref: { x: 0, y: 0 } } as const;
    const turn = 2 * Math.PI / 1.2;
    expect([0.1, 0.3, 0.6, 0.8, 1.1].map((part) => named(worm, 'wormhole', part * turn))).toEqual(['wormhole', 'wormhole/t1', 'wormhole/t2', 'wormhole/t3', 'wormhole']);
  });

  it("a pulsar's beams turn through four frames a half turn; a shell does not turn", () => {
    const site = (remnant: 'NS' | 'shell' | 'BH'): Pick<Extract<MapBody, { kind: 'snova' }>, 'kind' | 'ref'> => ({ kind: 'snova', ref: { x: 0, y: 0, remnant, seed: 1, births: [] } });
    const half = Math.PI / 2.2;
    expect([0.1, 0.3, 0.6, 0.8, 1.1].map((part) => named(site('NS'), 'supernova/ns', part * half)))
      .toEqual(['supernova/ns', 'supernova/ns/t1', 'supernova/ns/t2', 'supernova/ns/t3', 'supernova/ns']);
    expect(named(site('shell'), 'supernova/shell', 0.6 * half)).toBe('supernova/shell');
    expect(named(site('BH'), 'supernova/bh', 0.6 * half)).toBe('supernova/bh');
  });

  it('a protostar dims in the low half of its pulse; not with motion reduced, not with effects off', () => {
    const born = { kind: 'protostar', ref: { x: 0, y: 0, seed: 7 } } as const;
    expect(named(born, 'protostar', Math.PI / 6)).toBe('protostar');
    expect(named(born, 'protostar', Math.PI / 2)).toBe('protostar/dim');
    expect(named(born, 'protostar', Math.PI / 2, { motion: false })).toBe('protostar');
    expect(named(born, 'protostar', Math.PI / 2, { effects: false })).toBe('protostar');
  });

  it('with motion reduced the whole galaxy map is the map at time 0', () => {
    const reduced = { effects: true, motion: false };
    expect(items(frame({ time: 500, passes: reduced }))).toEqual(items(frame({ time: 0, passes: reduced })));
    expect(items(frame({ time: 500 }))).not.toEqual(items(frame({ time: 0 })));
  });
});
