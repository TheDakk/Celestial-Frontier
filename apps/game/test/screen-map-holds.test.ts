// @vitest-environment jsdom
// The clocks of a system's map and what an open card holds: the orbits under every body's card, and under the card
// of a moon, a comet or the visitor the clock that moves those three, so the body read about stays where it was pressed.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentRegionOf } from '@cf/scene';
import { systemFor } from '@cf/domain-worldgen';
import { describePickWithState } from '@cf/domain-descriptors';
import { descentCamera, mapPicture, smallBodies, visibleBodies, type Camera } from '../src/space';
import { canvas, key, rest } from './screen-map-support';
import { bootPage, pretendLayout, pretendSize, runFrames } from './shell-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';
import { VISITED, passView, systemNav } from './space-support';
import { cometsDrawn, systemCaptions, visitorItems } from '../src/space/passes-system';
import { artGrid, artScale, mapItems } from '../src/space/project';
import { currentSheet } from '../src/ui';
import { VIEW, FAR, zoomedIn, small, placeOf, pressed } from './screen-map-small-support';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

describe('the two clocks of a system: its planets and dwarf planets stand by the orbits\' clock, its moons, comets and visitor by the running one (7668, 7797; 7760, 7818, 7832)', () => {
  /** Sol's map with motion on: the clocks run. */
  async function running() {
    const page = await bootPage({ width: 800, height: 600 });
    const born = page.time.now();
    rest(page);
    return Object.assign(page, { seconds: (): number => (page.time.now() - born) / 1000 });
  }
  const planetAt = (page: Awaited<ReturnType<typeof running>>, cam: Camera, name: string, orbit: number) =>
    placeOf(cam, visibleBodies(page.nav.nav, cam, VIEW, orbit).find((body) => body.label === name)!);
  const far = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

  it('with the orbits held and the clock running on, a dwarf planet is pressed where it was held, not where the running clock would have it', async () => {
    const page = await running();
    const held = page.seconds();
    const jupiter = planetAt(page, FAR, 'Jupiter', held);
    expect(pressed(jupiter.x, jupiter.y)).toBe('Jupiter');
    page.time.advance(60_000);
    const now = page.seconds();
    expect(now - held).toBe(60);
    const ceres = (orbit: number) => placeOf(FAR, smallBodies(page.nav.nav, now, orbit).find((body) => body.label === 'Ceres')!);
    expect(far(ceres(held), ceres(now))).toBeGreaterThan(60);
    // Where the running clock would have it there is no Ceres; where it was held it is.
    expect(pressed(ceres(now).x, ceres(now).y)).not.toBe('Ceres');
    expect(pressed(jupiter.x, jupiter.y)).toBe('Jupiter');
    expect(pressed(ceres(held).x, ceres(held).y)).toBe('Ceres');
  });

  it('with the orbits held and the clock running on, a moon is pressed where the running clock has it, about its planet where that was held', async () => {
    const page = await running();
    const held = page.seconds();
    const earthFar = planetAt(page, FAR, 'Earth', held);
    expect(pressed(earthFar.x, earthFar.y)).toBe('Earth');
    const near = zoomedIn(page, earthFar);
    page.time.advance(61_000);
    const now = page.seconds();
    const moon = (time: number, orbit: number) => placeOf(near, smallBodies(page.nav.nav, time, orbit).find((body) => body.kind === 'moon' && body.ref.pl.name === 'Earth')!);
    const [right, frozen, drifted] = [moon(now, held), moon(held, held), moon(now, now)];
    // The three places are well apart: a press on one cannot be a press on another.
    expect(far(right, frozen)).toBeGreaterThan(13);
    expect(far(right, drifted)).toBeGreaterThan(40);
    expect(pressed(right.x, right.y)).toBe('The Moon');
    // Away from Earth, at the place a moon held with the orbits would be: no moon.
    const earth = planetAt(page, near, 'Earth', held);
    const out = { x: (frozen.x - earth.x) / far(frozen, earth), y: (frozen.y - earth.y) / far(frozen, earth) };
    expect(pressed(frozen.x + out.x * 11, frozen.y + out.y * 11)).not.toBe('The Moon');
  });

  it('the card of every body of a system holds the orbits while it is open: a dwarf planet\'s, a comet\'s and the star\'s, opened from nothing or over another card; a ring\'s card does not, and lets them go', async () => {
    const page = await running();
    let held = page.seconds();
    const ceres = (orbit: number) => placeOf(FAR, smallBodies(page.nav.nav, page.seconds(), orbit).find((body) => body.label === 'Ceres')!);
    const comet = () => placeOf(FAR, smallBodies(page.nav.nav, page.seconds(), held).find((body) => body.kind === 'comet')!);
    // A dwarf planet, opened from nothing: two minutes on it is where it was pressed.
    const first = ceres(held);
    expect(pressed(first.x, first.y)).toBe('Ceres');
    page.time.advance(120_000);
    expect(far(ceres(held), ceres(page.seconds()))).toBeGreaterThan(100);
    expect(pressed(first.x, first.y)).toBe('Ceres');
    // A comet's card over it keeps the hold.
    const cometTitle = pressed(comet().x, comet().y);
    expect(cometTitle).toMatch(/Comet/);
    page.time.advance(30_000);
    expect(pressed(first.x, first.y)).toBe('Ceres');
    // The star's card from nothing holds too.
    key(document, 'Escape');
    held = page.seconds() - 150;
    expect(far(ceres(held), first)).toBeLessThan(1e-6);
    expect(pressed(400, 300)).not.toBeNull();
    page.time.advance(60_000);
    expect(pressed(first.x, first.y)).toBe('Ceres');
    // A ring's card over a body's lets the orbits go: a minute on, Ceres has left the place it was held at.
    const sys = systemFor(page.nav.nav.mode === 'system' ? page.nav.nav.star.seed : 0) as unknown as { kuiper: { r: number } };
    const ringTitle = pressed(400, 300 - sys.kuiper.r * FAR.z);
    expect(ringTitle).not.toBeNull();
    expect(ringTitle).not.toBe('Ceres');
    page.time.advance(60_000);
    expect(pressed(first.x, first.y)).not.toBe('Ceres');
  });
});

describe('the body whose card is open stays where it was pressed (Dakk, 2026-11-27)', () => {
  it('a comet stays under its own card for two minutes, the picture with it; closed, it goes on from there with no jump; under a planet\'s card it runs on', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    const born = page.time.now();
    const seconds = (): number => (page.time.now() - born) / 1000;
    rest(page);
    const cometAtTime = (time: number) => placeOf(FAR, smallBodies(page.nav.nav, time, 0).find((body) => body.kind === 'comet')!);
    const apart = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
    const held = seconds();
    const at = cometAtTime(held);
    const title = pressed(at.x, at.y);
    expect(title).toMatch(/Comet/);
    runFrames(page, 1200);
    const now = seconds();
    expect(now - held).toBe(120);
    expect(apart(at, cometAtTime(now))).toBeGreaterThan(40);
    // The picture has it where it was pressed: the comet and the orbits of second `held`, the sky of now.
    const sheet = currentSheet();
    const colours = (time: number, orbit: number, small: number): Array<number | null> => Array.from(mapPicture({
      nav: page.nav.nav, cam: FAR, view: VIEW, dpr: 1, time, orbit, small, epoch: page.loop.publishedEpoch(), reach: currentRegionOf(0).r, charts: false,
      passes: { effects: true, motion: true }, sized: true, solid: true, marks: true,
    }, sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
    expect(paintedBy(canvas())).toEqual(colours(now, held, held));
    expect(colours(now, held, held)).not.toEqual(colours(now, held, now));
    // A press where it would have run to is not the comet; where it was pressed it still is.
    expect(pressed(cometAtTime(now).x, cometAtTime(now).y)).not.toBe(title);
    expect(pressed(at.x, at.y)).toBe(title);
    // Closed: ten seconds on it has run ten seconds from where it was held, not jumped to the running clock.
    const closed = seconds();
    key(document, 'Escape');
    page.time.advance(10_000);
    const lost = closed - seconds() + 10 + (closed - held);
    const resumed = cometAtTime(seconds() - lost);
    expect(apart(resumed, cometAtTime(seconds()))).toBeGreaterThan(40);
    expect(pressed(cometAtTime(seconds()).x, cometAtTime(seconds()).y)).not.toBe(title);
    expect(pressed(resumed.x, resumed.y)).toBe(title);
    // A planet's card over the comet's lets the comet run again from there.
    const start = seconds();
    const jupiter = placeOf(FAR, visibleBodies(page.nav.nav, FAR, VIEW, start - lost).find((body) => body.label === 'Jupiter')!);
    expect(pressed(jupiter.x, jupiter.y)).toBe('Jupiter');
    page.time.advance(60_000);
    const ran = cometAtTime(seconds() - lost - 0);
    expect(apart(ran, resumed)).toBeGreaterThan(20);
    expect(pressed(ran.x, ran.y)).toBe(title);
  });
});

describe('the picture places the comets and the visitor by their own held clock, where a frame gives one', () => {
  const FAR_VIEW = descentCamera('system', 720).to;
  it('a comet, its name and the visitor stand where that clock has them while the sky runs on; with none given they stand by the running clock', () => {
    const sol = systemNav();
    const head = (over: { time: number; small?: number }) => cometsDrawn(passView(sol, FAR_VIEW, over))[0]!.head;
    expect(head({ time: 100, small: 0 })).toEqual(head({ time: 0 }));
    expect(head({ time: 100, small: 0 })).not.toEqual(head({ time: 100 }));
    const name = (over: { time: number; small?: number }) => systemCaptions(passView(sol, { ...FAR_VIEW, z: FAR_VIEW.z * 4 }, over)).find((caption) => /Comet/.test(caption.text))!;
    expect(name({ time: 100, small: 0 })).toEqual(name({ time: 0 }));
    expect(name({ time: 100, small: 0 })).not.toEqual(name({ time: 100 }));
    const visited = systemNav(VISITED);
    const drawn = (over: { time: number; small?: number }) => visitorItems(passView(visited, FAR_VIEW, over)).map((item) => ('x' in item ? [item.x, item.y] : null));
    const caption = (over: { time: number; small?: number }) => systemCaptions(passView(visited, { ...FAR_VIEW, z: FAR_VIEW.z * 4 }, over)).find((entry) => /interstellar/.test(entry.text))!;
    expect(caption({ time: 300, small: 0 })).toEqual(caption({ time: 0 }));
    expect(caption({ time: 300, small: 0 })).not.toEqual(caption({ time: 300 }));
    expect(drawn({ time: 300, small: 0 })[0]).toEqual(drawn({ time: 0 })[0]);
    expect(drawn({ time: 300, small: 0 })[0]).not.toEqual(drawn({ time: 300 })[0]);
  });
});

describe('the picture places the moons by their own held clock, where a frame gives one', () => {
  it('Jupiter\'s moons stand where that clock has them, with and without the map\'s passes; with none given they stand by the running clock', () => {
    const sol = systemNav();
    const jupiter = visibleBodies(sol, FAR, VIEW, 0).find((body) => body.label === 'Jupiter')!;
    const scale = artScale(1280, 720, 1);
    const grid = artGrid(1280, 720, 1, scale);
    for (const passes of [undefined, { effects: false, motion: true }]) {
      /** Every moon-coloured mark of the picture, by its place. */
      const moons = (over: { time: number; small?: number }): string[] => mapItems({
        nav: sol, cam: { x: jupiter.wx, y: jupiter.wy, z: 12 }, view: { w: 1280, h: 720 }, dpr: 1, orbit: 0, epoch: 0, reach: 880, charts: false, sized: true,
        ...(passes === undefined ? {} : { passes }), ...over,
      }, grid, scale).filter((item) => (item.kind === 'dot' && item.colour === 0xc8c8d0) || (item.kind === 'disc' && item.bands[0] === 0xc8c8d0))
        .map((item) => `${(item as { x: number }).x},${(item as { y: number }).y}`);
      expect(moons({ time: 0 }).length).toBeGreaterThan(4);
      expect(moons({ time: 100, small: 0 })).toEqual(moons({ time: 0 }));
      expect(moons({ time: 100, small: 0 })).not.toEqual(moons({ time: 100 }));
    }
  });
});

describe('a ring\'s card holds nothing', () => {
  it('over a comet\'s card it lets the comet go: a minute on the comet has run a minute from where it was held', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    const born = page.time.now();
    const seconds = (): number => (page.time.now() - born) / 1000;
    rest(page);
    const cometAtTime = (time: number) => placeOf(FAR, smallBodies(page.nav.nav, time, 0).find((body) => body.kind === 'comet')!);
    const held = seconds();
    const title = pressed(cometAtTime(held).x, cometAtTime(held).y);
    page.time.advance(30_000);
    const sys = systemFor(page.nav.nav.mode === 'system' ? page.nav.nav.star.seed : 0) as unknown as { kuiper: { r: number } };
    const ring = pressed(400, 300 - sys.kuiper.r * FAR.z);
    expect(ring).not.toBeNull();
    expect(ring).not.toBe(title);
    page.time.advance(60_000);
    expect(Math.hypot(cometAtTime(held).x - cometAtTime(held + 60).x, cometAtTime(held).y - cometAtTime(held + 60).y)).toBeGreaterThan(20);
    expect(pressed(cometAtTime(held).x, cometAtTime(held).y)).not.toBe(title);
    expect(pressed(cometAtTime(held + 60).x, cometAtTime(held + 60).y)).toBe(title);
  });
});

describe('a moon\'s card and the visitor\'s card hold the orbits as a planet\'s does, and the body itself', () => {
  const far = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

  it('the Moon\'s card: a minute on, Earth is where the orbits were held, not where they would have run to', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    const born = page.time.now();
    const seconds = (): number => (page.time.now() - born) / 1000;
    rest(page);
    const earthAt = (cam: Camera, orbit: number) => placeOf(cam, visibleBodies(page.nav.nav, cam, VIEW, orbit).find((body) => body.label === 'Earth')!);
    // Earth's card holds the orbits while the view comes in on it; closed, they run on from where they were held.
    const held = seconds();
    const start = earthAt(FAR, held);
    expect(pressed(start.x, start.y)).toBe('Earth');
    const near = zoomedIn(page, start);
    key(document, 'Escape');
    const released = seconds();
    page.time.advance(5_000);
    const orbit = held + (seconds() - released);
    const moon = placeOf(near, smallBodies(page.nav.nav, seconds(), orbit).find((body) => body.kind === 'moon' && body.ref.pl.name === 'Earth')!);
    expect(pressed(moon.x, moon.y)).toBe('The Moon');
    // A wait after which the running clock would have carried the Moon well clear of where it was pressed.
    const moonAfter = (wait: number) => placeOf(near, smallBodies(page.nav.nav, seconds() + wait, orbit).find((body) => body.kind === 'moon' && body.ref.pl.name === 'Earth')!);
    const wait = [60, 65, 70, 75, 80, 85, 90].find((s) => far(moon, moonAfter(s)) > 20)!;
    page.time.advance(wait * 1000);
    // The Moon itself stays where it was pressed under its own card.
    expect(far(moon, moonAfter(0))).toBeGreaterThan(20);
    expect(pressed(moon.x, moon.y)).toBe('The Moon');
    const [kept, run] = [earthAt(near, orbit), earthAt(near, orbit + wait)];
    expect(far(kept, run)).toBeGreaterThan(60);
    expect(pressed(run.x, run.y)).not.toBe('Earth');
    expect(pressed(kept.x, kept.y)).toBe('Earth');
  });

  it('the visitor\'s card: five minutes on, the system\'s first world is where the orbits were held', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    // A ship that may leave Sol.
    page.live.items = [['igdrive', 1]];
    page.nav.ascend();
    expect(page.nav.enterSystem(VISITED).ok).toBe(true);
    const entered = page.time.now();
    rest(page);
    const seconds = (): number => (page.time.now() - entered) / 1000;
    const held = seconds();
    const visitor = placeOf(FAR, smallBodies(page.nav.nav, held, held).find((body) => body.kind === 'visitor')!);
    const title = pressed(visitor.x, visitor.y);
    expect(title).toBe(describePickWithState({ kind: 'visitor', data: {} }, { gal: null, star: page.nav.nav.mode === 'system' ? page.nav.nav.star : null }, () => undefined, 0)!.title);
    page.time.advance(300_000);
    // The visitor itself stays where it was pressed under its own card; by the running clock it would be far off.
    const visitorRun = placeOf(FAR, smallBodies(page.nav.nav, seconds(), held).find((body) => body.kind === 'visitor')!);
    expect(far(visitor, visitorRun)).toBeGreaterThan(40);
    expect(pressed(visitor.x, visitor.y)).toBe(title);
    const world = visibleBodies(page.nav.nav, FAR, VIEW, held)[0]!;
    const at = (orbit: number) => placeOf(FAR, visibleBodies(page.nav.nav, FAR, VIEW, orbit).find((body) => body.key === world.key)!);
    expect(far(at(held), at(held + 300))).toBeGreaterThan(50);
    expect(pressed(at(held + 300).x, at(held + 300).y)).not.toBe(world.label);
    expect(pressed(at(held).x, at(held).y)).toBe(world.label);
  });
});
