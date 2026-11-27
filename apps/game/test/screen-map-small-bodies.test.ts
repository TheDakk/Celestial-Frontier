// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { describePickWithState } from '@cf/domain-descriptors';
import { PICK_PADDING, pick } from '../src/input';
import { descentCamera, entryZoom, pickFloor, pictureWidth, smallBodies, toScreen, visibleBodies, zoomAbout, zoomLimits, type Camera, type MapBody } from '../src/space';
import { canvas, cardTitle, fire, key, rest, tap } from './screen-map-support';
import { bootPage, pretendLayout, pretendSize } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';
import { VISITED, systemNav } from './space-support';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

const VIEW = { w: 800, h: 600 };
/** The view a system opens on: under 1/420 of the shorter side a unit, so no name of a moon is drawn. */
const FAR = descentCamera('system', 600).to;

/** Sol's map on a page 800 by 600, every clock of it held at its start. */
async function atSystem() {
  const page = await bootPage({ width: 800, height: 600 });
  page.live.motionMode = 1;
  rest(page);
  return page;
}
/** Six wheel steps in about a screen point, come to rest: the camera the view then has, over 1/420 of the shorter side. */
function zoomedIn(page: Awaited<ReturnType<typeof atSystem>>, at: { x: number; y: number }): Camera {
  let cam = FAR;
  for (let i = 0; i < 6; i++) {
    fire(canvas(), 'wheel', { deltaY: -120, clientX: at.x, clientY: at.y });
    cam = zoomAbout(cam, 1.14, at.x - VIEW.w / 2, at.y - VIEW.h / 2, zoomLimits('system', 600, entryZoom('system', 600)));
  }
  rest(page);
  expect(cam.z).toBeGreaterThan(600 / 420);
  return cam;
}
const small = (page: Awaited<ReturnType<typeof atSystem>>, cam: Camera): MapBody[] => smallBodies(page.nav.nav, cam, VIEW, 0, 0);
const placeOf = (cam: Camera, body: MapBody): { x: number; y: number } => toScreen(cam, VIEW, body.wx, body.wy);
/** The title of the card a press by mouse opens, or null. */
const pressed = (x: number, y: number): string | null => {
  if (cardTitle() !== null) key(document, 'Escape');
  tap(x, y);
  return cardTitle();
};

describe('the small bodies of a system answer a press, as in the legacy game', () => {
  it('a tap on Earth, or beside the Moon, at the view a system opens on is Earth\'s: the Moon has no floor there (7773 to 7780)', async () => {
    const page = await atSystem();
    expect(FAR.z).toBeLessThan(600 / 420);
    const earth = visibleBodies(page.nav.nav, FAR, VIEW, 0).find((body) => body.label === 'Earth')!;
    const moon = small(page, FAR).find((body) => body.kind === 'moon' && body.ref.pl.name === 'Earth')!;
    const [onEarth, onMoon] = [placeOf(FAR, earth), placeOf(FAR, moon)];
    // The Moon is drawn under a pixel across here, well inside Earth's 19.2 pixels.
    const gap = Math.hypot(onMoon.x - onEarth.x, onMoon.y - onEarth.y);
    expect(gap).toBeGreaterThan(2);
    expect(gap).toBeLessThan(19.2);
    expect(pressed(onEarth.x, onEarth.y)).toBe('Earth');
    // A pixel from the Moon's middle, on the side away from Earth: nearer the Moon than Earth, and still Earth's.
    const away = { x: onMoon.x + (onMoon.x - onEarth.x) / gap, y: onMoon.y + (onMoon.y - onEarth.y) / gap };
    expect(pressed(away.x, away.y)).toBe('Earth');
    expect(pressed(onMoon.x + 1, onMoon.y - 1)).toBe('Earth');
  });

  it('once the view is near enough that names are drawn, the Moon opens its own card within 12 pixels by mouse, and not beyond (7780)', async () => {
    const page = await atSystem();
    const earth = visibleBodies(page.nav.nav, FAR, VIEW, 0).find((body) => body.label === 'Earth')!;
    const near = zoomedIn(page, placeOf(FAR, earth));
    const moon = small(page, near).find((body) => body.kind === 'moon' && body.ref.pl.name === 'Earth')!;
    const [onEarth, onMoon] = [placeOf(near, earth), placeOf(near, moon)];
    const gap = Math.hypot(onMoon.x - onEarth.x, onMoon.y - onEarth.y);
    const out = { x: (onMoon.x - onEarth.x) / gap, y: (onMoon.y - onEarth.y) / gap };
    expect(pressed(onEarth.x, onEarth.y)).toBe('Earth');
    const title = pressed(onMoon.x, onMoon.y);
    expect(title).toBe('The Moon');
    // Straight out from Earth, past Earth's own 19.2 pixels and its picture: the Moon's floor alone decides.
    expect(Math.abs(out.y)).toBeLessThan(1e-9);
    expect(gap + 11.8).toBeGreaterThan(Math.max(19.2, pictureWidth(earth, near.z) * near.z / 2));
    expect([pressed(onMoon.x + out.x * 11.8, onMoon.y + out.y * 11.8), pressed(onMoon.x + out.x * 12.2, onMoon.y + out.y * 12.2)]).toEqual(['The Moon', null]);
  });

  it('a dwarf planet opens its card within 13.2 pixels by mouse, and not beyond (7806)', async () => {
    const page = await atSystem();
    const ceres = small(page, FAR).find((body) => body.kind === 'dwarf' && body.label === 'Ceres')!;
    const at = placeOf(FAR, ceres);
    expect([pressed(at.x + 13, at.y), pressed(at.x, at.y - 13), pressed(at.x + 13.4, at.y)]).toEqual(['Ceres', 'Ceres', null]);
  });

  it('a comet opens its card within 15.6 pixels by mouse, and not beyond (7842)', async () => {
    const page = await atSystem();
    const comet = small(page, FAR).find((body) => body.kind === 'comet')!;
    const at = placeOf(FAR, comet);
    const others = [...visibleBodies(page.nav.nav, FAR, VIEW, 0), ...small(page, FAR)].filter((body) => body.key !== comet.key).map((body) => placeOf(FAR, body));
    // A way out from the comet on which no other body's own reach (a planet's 19.2 pixels is the widest) comes near,
    // so the comet's floor alone decides.
    const way = [0, 1, 2, 3, 4, 5, 6, 7].map((step) => ({ x: Math.cos(step * Math.PI / 4), y: Math.sin(step * Math.PI / 4) }))
      .find((dir) => others.every((o) => Math.hypot(o.x - (at.x + dir.x * 15.6), o.y - (at.y + dir.y * 15.6)) > 22))!;
    const title = pressed(at.x, at.y);
    expect(title).toBe(describePickWithState({ kind: 'comet', data: comet.ref }, { gal: null, star: page.nav.nav.mode === 'system' ? page.nav.nav.star : null }, () => undefined, 0)!.title);
    expect([pressed(at.x + way.x * 15.4, at.y + way.y * 15.4), pressed(at.x + way.x * 15.8, at.y + way.y * 15.8)]).toEqual([title, null]);
  });

  it('the interstellar visitor is under a press within 14.4 pixels by mouse, and not beyond, and has its card (7825)', () => {
    const nav = systemNav(VISITED);
    const visitor = smallBodies(nav, FAR, VIEW, 0, 0).find((body) => body.kind === 'visitor')!;
    const at = placeOf(FAR, visitor);
    const target = { body: visitor, key: visitor.key, x: at.x, y: at.y, priority: visitor.priority, reach: pictureWidth(visitor, FAR.z) * FAR.z / 2 };
    const under = (dy: number): boolean => pick([target], at.x, at.y + dy, (t) => pickFloor(t.body, FAR.z, 600) * PICK_PADDING.mouse) !== null;
    expect([under(14.2), under(14.6)]).toEqual([true, false]);
    expect(describePickWithState({ kind: 'visitor', data: visitor.ref }, { gal: nav.gal, star: nav.star }, () => undefined, 0)?.title).toBeTruthy();
  });

  it('a press on the line of the asteroid belt, the outer belt or the comet shell opens that ring\'s card, within 10 pixels of it; a body under the press outbids a ring (5606, 7620, 7640, 7650)', async () => {
    const page = await atSystem();
    const sys = systemFor(page.nav.nav.mode === 'system' ? page.nav.nav.star.seed : 0) as unknown as { belt: { r: number }; kuiper: { r: number } };
    const centre = toScreen(FAR, VIEW, 0, 0);
    const bodies = [...visibleBodies(page.nav.nav, FAR, VIEW, 0), ...small(page, FAR)].map((body) => placeOf(FAR, body));
    /** A point of the screen `radius` pixels from the star with no body within 40 pixels. */
    const clearAt = (radius: number): { x: number; y: number } => {
      for (let step = 0; step < 720; step++) {
        const turn = step * Math.PI / 360;
        const at = { x: centre.x + Math.cos(turn) * radius, y: centre.y + Math.sin(turn) * radius };
        if (at.x > 0 && at.y > 0 && at.x < VIEW.w && at.y < VIEW.h && bodies.every((b) => Math.hypot(b.x - at.x, b.y - at.y) > 40)) return at;
      }
      throw new Error('no clear point on the ring');
    };
    // At this view six world units are under 10 pixels: the band is 10 pixels each side.
    expect(6 * FAR.z).toBeLessThan(10);
    const belt = pressed(clearAt(sys.belt.r * FAR.z + 9).x, clearAt(sys.belt.r * FAR.z + 9).y);
    // The outer belt and the comet shell lie under 10 pixels apart: between them the nearer line has the press.
    const outer = pressed(clearAt(sys.kuiper.r * FAR.z - 9).x, clearAt(sys.kuiper.r * FAR.z - 9).y);
    const shell = pressed(clearAt((SYS_R - 3) * FAR.z + 9).x, clearAt((SYS_R - 3) * FAR.z + 9).y);
    const between = (sys.kuiper.r + SYS_R - 3) / 2 * FAR.z;
    expect([pressed(clearAt(between - 1).x, clearAt(between - 1).y), pressed(clearAt(between + 1).x, clearAt(between + 1).y)]).toEqual([outer, shell]);
    expect([belt, outer, shell].every((title) => title !== null)).toBe(true);
    expect(new Set([belt, outer, shell]).size).toBe(3);
    const off = clearAt(sys.belt.r * FAR.z + 11);
    expect(pressed(off.x, off.y)).toBeNull();
    // Ceres stands on the belt: a press on it is Ceres's, not the belt's.
    const ceres = small(page, FAR).find((body) => body.label === 'Ceres')!;
    expect(Math.abs(Math.hypot(ceres.wx, ceres.wy) - sys.belt.r) * FAR.z).toBeLessThan(10);
    expect(pressed(placeOf(FAR, ceres).x, placeOf(FAR, ceres).y)).toBe('Ceres');
  });
});
