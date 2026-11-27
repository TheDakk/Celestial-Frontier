// @vitest-environment jsdom
// A press on the star and the small bodies of a system, the keyboard's stops among them, and which of two bodies
// exactly as near a press is selected: the legacy game's rules, with its lines.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OBS_R, SYS_R } from '@cf/domain-worldconfig';
import { NAV_HOME } from '@cf/scene';
import { systemFor } from '@cf/domain-worldgen';
import { describePickWithState } from '@cf/domain-descriptors';
import { PICK_PADDING, pick } from '../src/input';
import { inPressOrder, pickRadius, ringUnder, smallBodies, toScreen, visibleBodies, type Camera, type MapBody } from '../src/space';
import { canvas, cardTitle, fire, key, keyboardFocus, rest, tap } from './screen-map-support';
import { pretendLayout, pretendSize, runFrames } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';
import { VISITED, galaxyNav, systemNav } from './space-support';
import { VIEW, FAR, atSystem, zoomedIn, small, placeOf, pressed } from './screen-map-small-support';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

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
    expect(gap + 11.8).toBeGreaterThan(pickRadius(earth, near.z, 600, 1.2));
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
    const visitor = smallBodies(nav, 0, 0).find((body) => body.kind === 'visitor')!;
    const at = placeOf(FAR, visitor);
    const target = { body: visitor, key: visitor.key, x: at.x, y: at.y, priority: visitor.priority };
    const under = (dy: number): boolean => pick([target], at.x, at.y + dy, (t) => pickRadius(t.body, FAR.z, 600, PICK_PADDING.mouse)) !== null;
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

  it('a ring\'s band is world units once they are wider than its floor: 6 a belt and 5 the comet shell about a system, 30 about the observable universe, whose floor is 16 pixels (7620, 7640, 7650, 6073)', () => {
    const nav = systemNav();
    const sys = systemFor(nav.star.seed) as unknown as { belt: { r: number }; kuiper: { r: number } };
    const near: Camera = { x: 0, y: 0, z: 4 };
    /** The ring met `off` pixels outside the line of the ring of radius `r`, straight right of the star. */
    const at = (cam: Camera, r: number, off: number) => ringUnder(nav, cam, VIEW, 400 + (r - cam.x) * cam.z + off, 300)?.kind ?? null;
    expect([at(near, sys.belt.r, 23), at(near, sys.belt.r, -23), at(near, sys.belt.r, 25), at(near, sys.belt.r, -25)]).toEqual(['belt', 'belt', null, null]);
    expect([at(near, SYS_R - 3, 19), at(near, SYS_R - 3, 21)]).toEqual(['oort', null]);
    // The outer belt's own 24 pixels, inward where the comet shell is not nearer.
    expect([at(near, sys.kuiper.r, -23), at(near, sys.kuiper.r, -25)]).toEqual(['kuiper', null]);
    const edge = (z: number, off: number) => ringUnder(NAV_HOME, { x: OBS_R, y: 0, z }, VIEW, 400 + off, 300)?.kind ?? null;
    expect([edge(1, 29), edge(1, -29), edge(1, 31), edge(1, -31)]).toEqual(['cmb', 'cmb', null, null]);
    expect([edge(0.1, 15), edge(0.1, -15), edge(0.1, 17), edge(0.1, -17)]).toEqual(['cmb', 'cmb', null, null]);
    expect(ringUnder(galaxyNav(), { x: OBS_R, y: 0, z: 1 }, VIEW, 400, 300)).toBeNull();
  });

  it('the star of a system opens its card within its own disc or 21.6 pixels by mouse, and the nearer middle wins beside it (7527, 5607)', async () => {
    const page = await atSystem();
    const nav = page.nav.nav.mode === 'system' ? page.nav.nav : null;
    const star = small(page, FAR).find((body) => body.kind === 'starsys')!;
    const radius = pickRadius(star, FAR.z, 600, 1.2);
    expect(radius).toBeGreaterThan(21.5);
    const title = describePickWithState({ kind: 'starsys', data: star.ref }, { gal: nav!.gal, star: nav!.star }, () => undefined, 0)!.title;
    const comet = placeOf(FAR, small(page, FAR).find((body) => body.kind === 'comet')!);
    // Away from the comet, which stands 20 pixels from the star: the star's own radius decides.
    const away = { x: 400 - comet.x, y: 300 - comet.y };
    const unit = { x: away.x / Math.hypot(away.x, away.y), y: away.y / Math.hypot(away.x, away.y) };
    expect([pressed(400, 300), pressed(400 + unit.x * (radius - 0.5), 300 + unit.y * (radius - 0.5)), pressed(400 + unit.x * (radius + 0.5), 300 + unit.y * (radius + 0.5))])
      .toEqual([title, title, null]);
    // Between the two, nearer the comet: the comet's.
    expect(pressed(comet.x - unit.x * 2, comet.y - unit.y * 2)).not.toBe(title);
    expect(pressed(comet.x - unit.x * 2, comet.y - unit.y * 2)).not.toBeNull();
  });

  it('a tap on empty space closes the open card (5619)', async () => {
    const page = await atSystem();
    const jupiter = visibleBodies(page.nav.nav, FAR, VIEW, 0).find((body) => body.label === 'Jupiter')!;
    const at = placeOf(FAR, jupiter);
    expect(pressed(at.x, at.y)).toBe('Jupiter');
    const everything = [...visibleBodies(page.nav.nav, FAR, VIEW, 0), ...small(page, FAR)].map((body) => placeOf(FAR, body));
    // A point of the view far from every body and every ring.
    const empty = [[60, 60], [740, 60], [60, 540], [740, 540], [400, 80], [400, 520]].map(([x, y]) => ({ x: x!, y: y! }))
      .find((spot) => everything.every((b) => Math.hypot(b.x - spot.x, b.y - spot.y) > 40) && ringUnder(page.nav.nav, FAR, VIEW, spot.x, spot.y) === null)!;
    tap(empty.x, empty.y);
    expect(cardTitle()).toBeNull();
  });

  it('a body at the very edge of the view is still under a press: a dwarf planet 6 pixels in opens its own card, not the belt\'s it stands on', async () => {
    const page = await atSystem();
    const ceres = small(page, FAR).find((body) => body.label === 'Ceres')!;
    const before = placeOf(FAR, ceres);
    // Drag the view so Ceres stands 6 pixels from its left edge.
    const dx = 6 - before.x;
    fire(canvas(), 'pointerdown', { pointerId: 1, clientX: 600, clientY: 300, pointerType: 'mouse' });
    fire(document, 'pointermove', { pointerId: 1, clientX: 600 + dx, clientY: 300, pointerType: 'mouse' });
    fire(document, 'pointerup', { pointerId: 1, clientX: 600 + dx, clientY: 300, pointerType: 'mouse' });
    rest(page);
    const cam = { ...FAR, x: FAR.x - dx / FAR.z };
    expect(placeOf(cam, ceres).x).toBeCloseTo(6, 6);
    expect(pressed(6, before.y)).toBe('Ceres');
    expect(pressed(14, before.y + 3)).toBe('Ceres');
  });
});

describe('the keyboard\'s stops on a system\'s map', () => {
  /** Every stop the arrow keys step through from the first, by where the focus ring stands and what it says. */
  async function stops(page: Awaited<ReturnType<typeof atSystem>>): Promise<string[]> {
    await keyboardFocus();
    const seen: string[] = [];
    for (let i = 0; i < 200; i++) {
      runFrames(page, 1);
      const ring = document.querySelector<HTMLElement>('.map-focus')!;
      const stop = `${ring.firstElementChild!.textContent} at ${ring.style.left},${ring.style.top}`;
      if (seen.includes(stop)) break;
      seen.push(stop);
      key(canvas(), 'ArrowRight');
    }
    return seen;
  }

  it('at the view Sol opens on: its eight planets, its star, two dwarf planets and a comet, and no moon, which no pointer has a floor for there', async () => {
    const page = await atSystem();
    const all = await stops(page);
    expect(all.length).toBe(12);
    expect(all.filter((stop) => /Moon|Io |Titan|Phobos/.test(stop))).toEqual([]);
    expect(all.map((stop) => stop.split(' at ')[0])).toEqual(expect.arrayContaining(['Earth', 'Jupiter', 'Ceres', 'Pluto', 'Comet Taran']));
  });

  it('a small body off the screen is no stop: with the view dragged so Ceres and the star stand beyond its edge, neither is stepped to', async () => {
    const page = await atSystem();
    expect((await stops(page)).map((stop) => stop.split(' at ')[0])).toEqual(expect.arrayContaining(['Ceres', 'Sun (Sol)']));
    const ceres = placeOf(FAR, small(page, FAR).find((body) => body.label === 'Ceres')!);
    // Drag the view left until the star is 60 pixels beyond its left edge; Ceres, left of the star, goes with it.
    expect(ceres.x).toBeLessThan(400);
    for (let moved = 0; moved < 460; moved += 230) {
      fire(canvas(), 'pointerdown', { pointerId: 1, clientX: 600, clientY: 300, pointerType: 'mouse' });
      fire(document, 'pointermove', { pointerId: 1, clientX: 370, clientY: 300, pointerType: 'mouse' });
      fire(document, 'pointerup', { pointerId: 1, clientX: 370, clientY: 300, pointerType: 'mouse' });
    }
    rest(page);
    const after = (await stops(page)).map((stop) => stop.split(' at ')[0]);
    expect(after.length).toBeGreaterThan(2);
    expect(after).not.toContain('Ceres');
    expect(after).not.toContain('Sun (Sol)');
  });

  it('near enough that a moon has its floor, the Moon is a stop', async () => {
    const page = await atSystem();
    const earth = visibleBodies(page.nav.nav, FAR, VIEW, 0).find((body) => body.label === 'Earth')!;
    zoomedIn(page, placeOf(FAR, earth));
    expect((await stops(page)).map((stop) => stop.split(' at ')[0])).toContain('The Moon');
  });
});

describe('of two bodies exactly as near a press, the one the legacy game makes its pick of first is selected (5607)', () => {
  const nav = systemNav();
  const all = inPressOrder([...visibleBodies(nav, FAR, VIEW, 0), ...smallBodies(nav, 0, 0)]);
  const named = (name: string): MapBody => all.find((body) => body.label === name || (body.kind === 'starsys' && name === 'star') || (body.kind === 'comet' && name === 'comet'))!;
  const moonOf = (planet: string, m: number): MapBody => all.find((body) => body.kind === 'moon' && body.ref.pl.name === planet && body.ref.m === m)!;

  it('the order is the legacy game\'s: the star (7527); each planet in the system\'s own order with its moons after it (7673, 7780); the dwarf planets (7806); the comets (7842)', () => {
    const kinds = all.map((body) => (body.kind === 'planet' ? body.label : body.kind === 'moon' ? `${body.ref.pl.name} ${body.ref.m}` : body.kind === 'dwarf' ? body.label : body.kind));
    expect(kinds.slice(0, 6)).toEqual(['starsys', 'Mercury', 'Venus', 'Earth', 'Earth 0', 'Mars']);
    expect(kinds.slice(-3)).toEqual(['Ceres', 'Pluto', 'comet']);
    expect(kinds.indexOf('Jupiter 0')).toBe(kinds.indexOf('Jupiter') + 1);
    expect(kinds.indexOf('Neptune')).toBeLessThan(kinds.indexOf('Ceres'));
  });

  it.each([
    ['the star and Mercury', () => [named('star'), named('Mercury')], 0],
    ['Venus and Earth', () => [named('Venus'), named('Earth')], 0],
    ['a moon of Mars and Ceres', () => [moonOf('Mars', 0), named('Ceres')], 0],
    ['Pluto and the comet', () => [named('Pluto'), named('comet')], 0],
    ['the star and the comet', () => [named('star'), named('comet')], 0],
    ['Earth and its Moon', () => [named('Earth'), moonOf('Earth', 0)], 0],
    ['Mars and Jupiter', () => [named('Mars'), named('Jupiter')], 0],
    ['Mercury and Venus', () => [named('Mercury'), named('Venus')], 0],
    ['two moons of Jupiter', () => [moonOf('Jupiter', 0), moonOf('Jupiter', 1)], 0],
    ['Ceres and Pluto', () => [named('Ceres'), named('Pluto')], 0],
    ['Neptune and Pluto', () => [named('Neptune'), named('Pluto')], 0],
  ] as const)('%s: the first of the two', (_name, pair, winner) => {
    const [a, b] = pair();
    // The two stand 10 pixels apart and the press is exactly between them, whichever side each is on.
    for (const [left, right] of [[a!, b!], [b!, a!]] as const) {
      const placed = new Map([[left.key, 95], [right.key, 105]]);
      const targets = all.filter((body) => placed.has(body.key)).map((body) => ({ body, key: body.key, x: placed.get(body.key)!, y: 100, priority: body.priority }));
      expect(pick(targets, 100, 100, () => 20)?.body.key).toBe(pair()[winner]!.key);
    }
  });
});
