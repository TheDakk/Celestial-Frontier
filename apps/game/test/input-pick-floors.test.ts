import { describe, expect, it } from 'vitest';
import { systemScene, type GalaxyNode } from '@cf/scene';
import { PICK_PADDING } from '../src/input';
import type { MapBody } from '../src/space/model';
import { pickFloor } from '../src/space/sizes';
import { SOL } from './space-support';

const body = (over: Partial<MapBody>): MapBody => ({ key: 'k', label: 'l', priority: 1, wx: 0, wy: 0, ...over } as MapBody);
const galaxy = (size: number, over: Partial<GalaxyNode> = {}): MapBody =>
  body({ kind: 'galaxy', ref: { seed: 8, x: 0, y: 0, size, sp: 0, tilt: 1, rot: 0, home: false, quasar: false, dwarf: false, radio: false, blazar: false, bridge: null, ...over } });
const star = (priority: number): MapBody => body({ kind: 'star', priority, ref: { x: 0, y: 0, c: '#ff9a6a', s: 1, seed: 3 } });

/** Each kind of body a press can select, with the legacy game's floor for it (celestial-frontier.html, the line named):
 *  the base, and what its padding makes of it by mouse (1.2) and by touch (1.4), line 2542. */
const ROWS: ReadonlyArray<readonly [name: string, line: number, made: MapBody, zoom: number, base: number, mouse: number, touch: number]> = [
  ['a planet', 7673, body({ kind: 'planet', ref: systemScene(SOL.seed).planets[0]! }), 1, 16, 19.2, 22.4],
  ['a galaxy, resolved', 6151, galaxy(40), 1, 16, 19.2, 22.4],
  ['a quasar, resolved', 6151, galaxy(40, { quasar: true }), 1, 16, 19.2, 22.4],
  ['a galaxy 2.6 screen pixels in size: resolved', 6139, galaxy(26), 0.1, 16, 19.2, 22.4],
  ['a galaxy under 2.6 screen pixels in size: a grain of light', 6146, galaxy(25.9), 0.1, 9, 10.8, 12.6],
  ['a wormhole', 6570, body({ kind: 'worm', ref: { x: 0, y: 0 } }), 1, 14, 16.8, 19.6],
  ['a supernova site', 6693, body({ kind: 'snova' }), 1, 13, 15.6, 18.2],
  ['a star of a galaxy', 6628, star(1), 1, 12, 14.4, 16.8],
  ['the Sun among them', 6628, star(0), 1, 12, 14.4, 16.8],
  ['scenery of a galaxy', 6620, body({ kind: 'deco', ref: { k: 'neb', x: 0, y: 0 } }), 1, 12, 14.4, 16.8],
  ['a protostar', 6700, body({ kind: 'protostar' }), 1, 11, 13.2, 15.4],
  ['a fine star of a galaxy', 6651, star(2), 1, 9, 10.8, 12.6],
  ['a comet', 7842, body({ kind: 'comet' }), 1, 13, 15.6, 18.2],
  ['the interstellar visitor', 7825, body({ kind: 'visitor' }), 1, 12, 14.4, 16.8],
  ['a dwarf planet', 7806, body({ kind: 'dwarf' }), 1, 11, 13.2, 15.4],
  ['a moon, the view near enough that names are drawn: a zoom over 1/420 of the shorter side', 7780, body({ kind: 'moon' }), 1.43, 10, 12, 14],
  ['a moon from farther out: no floor, its true size', 7780, body({ kind: 'moon' }), 600 / 420, 0, 0, 0],
];
/** The shorter side of the view the rows are asked at. */
const MIN_SIDE = 600;

describe('how near a press must be to a body, by its kind', () => {
  it.each(ROWS)('%s (legacy line %i)', (_name, _line, made, zoom, base, mouse, touch) => {
    expect(pickFloor(made, zoom, MIN_SIDE)).toBe(base);
    expect(pickFloor(made, zoom, MIN_SIDE) * PICK_PADDING.mouse).toBeCloseTo(mouse, 9);
    expect(pickFloor(made, zoom, MIN_SIDE) * PICK_PADDING.touch).toBeCloseTo(touch, 9);
  });

  it('the padding is the legacy game\'s: a fifth more by mouse, two fifths more by touch', () => {
    expect(PICK_PADDING).toEqual({ touch: 1.4, mouse: 1.2 });
  });
});
