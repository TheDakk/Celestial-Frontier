// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeWhere } from '@cf/domain-strays';
import { currentRegionOf } from '@cf/scene';
import { descentCamera, mapPicture, pictureWidth, placedLabels, toScreen, visibleBodies, type MapFrame } from '../src/space';
import { PICK_RADIUS_PX } from '../src/input';
import { currentSheet } from '../src/ui';
import { canvas, cardTitle, key, rest, tap } from './screen-map-support';
import { bootPage, pretendLayout, pretendSize, runFrames } from './shell-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

/** Sol's map as a page 800 by 600 opens on it, its worlds orbiting. */
async function atSol() {
  const page = await bootPage({ width: 800, height: 600 });
  const born = page.time.now();
  const view = { w: 800, h: 600 };
  const cam = descentCamera('system', 600).to;
  return Object.assign(page, {
    cam, view,
    /** The seconds the page's clock has run since the map was made. */
    seconds: (): number => (page.time.now() - born) / 1000,
    /** Where a world is on the screen when its orbit has run `orbit` seconds. */
    placeOf(name: string, orbit: number): { x: number; y: number } {
      const body = visibleBodies(page.nav.nav, cam, view, orbit).find((b) => b.label === name)!;
      return toScreen(cam, view, body.wx, body.wy);
    },
    /** How far from a world's middle a press can still be its own: its picture or the pick radius, whichever is more. */
    grasp(name: string): number {
      const body = visibleBodies(page.nav.nav, cam, view, 0).find((b) => b.label === name)!;
      return Math.hypot(1, 1) * Math.max(PICK_RADIUS_PX.mouse, pictureWidth(body, cam.z) * cam.z / 2);
    },
  });
}
const apart = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

describe('the orbits of a system on the map screen', () => {
  it('by mouse a press within 19.2 pixels of a small world\'s middle opens its card, as in the game, and one just beyond does not', async () => {
    const page = await atSol();
    page.live.motionMode = 1;
    rest(page);
    const mercury = visibleBodies(page.nav.nav, page.cam, page.view, 0).find((body) => body.label === 'Mercury')!;
    // Its picture is far smaller than the floor: the floor alone decides.
    expect(pictureWidth(mercury, page.cam.z) * page.cam.z / 2).toBeLessThan(10);
    const at = page.placeOf('Mercury', 0);
    tap(at.x - 19, at.y);
    expect(cardTitle()).toBe('Mercury');
    key(document, 'Escape');
    tap(at.x, at.y + 19.2);
    expect(cardTitle()).toBe('Mercury');
    key(document, 'Escape');
    tap(at.x - 19.5, at.y);
    expect(cardTitle()).toBeNull();
    tap(at.x - 14, at.y + 14);
    expect(cardTitle()).toBeNull();
  });

  it('a tap follows a planet where it has moved to: its place at second 0 and at second 30 each open its card, and its old place does not', async () => {
    const page = await atSol();
    const first = page.placeOf('Jupiter', 0);
    tap(first.x, first.y);
    expect([cardTitle(), page.seconds()]).toEqual(['Jupiter', 0]);
    key(document, 'Escape');
    page.time.advance(30_000);
    expect(page.seconds()).toBe(30);
    const later = page.placeOf('Jupiter', 30);
    // It has moved clear of where it was: no press on its new place could be a press on its old one.
    expect(apart(first, later)).toBeGreaterThan(2 * page.grasp('Jupiter'));
    tap(later.x, later.y);
    expect(cardTitle()).toBe('Jupiter');
    key(document, 'Escape');
    tap(first.x, first.y);
    expect(cardTitle()).not.toBe('Jupiter');
  });

  it('the orbits hold while a planet\'s card is open, the rest of the sky moving on; closed, they go on from where they were, with no jump', async () => {
    const page = await atSol();
    rest(page);
    expect(page.seconds()).toBe(8);
    const sheet = currentSheet();
    const frame = (time: number, orbit?: number): MapFrame => ({
      nav: page.nav.nav, cam: page.cam, view: page.view, dpr: 1, time, ...(orbit === undefined ? {} : { orbit }), epoch: page.loop.publishedEpoch(),
      reach: currentRegionOf(0).r, charts: false, passes: { effects: true, motion: true }, sized: true, solid: true, marks: true,
    });
    const colours = (time: number, orbit?: number): Array<number | null> =>
      Array.from(mapPicture(frame(time, orbit), sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
    /** Where a world's name stands on the screen: as the page shows it, and as a frame places it. */
    const nameShown = (name: string): string[] => {
      const style = document.querySelector<HTMLCanvasElement>(`.map-captions canvas[data-caption="${name}"]`)!.style;
      return [style.left, style.top];
    };
    const namePlaced = (name: string, time: number, orbit?: number): string[] => {
      const pixel = mapPicture(frame(time, orbit), sheet, { glyphs: [], icons: [], elements: [] }).scale;
      const words = placedLabels({ ...frame(time, orbit), placement: { keepOut: [], tails: true, stand: true, apart: true } }, currentRegionOf(0).name, sheet.font, sheet)
        .find((label) => label.text === name)!;
      return [`${(words.x - 1) * pixel}px`, `${(words.y - 1) * pixel}px`];
    };
    expect(paintedBy(canvas())).toEqual(colours(8));
    const held = page.placeOf('Jupiter', 8);
    tap(held.x, held.y);
    expect(cardTitle()).toBe('Jupiter');

    // Thirty seconds on, the card open: every world is where it was at second 8, and the sky is that of second 38.
    runFrames(page, 300);
    expect([cardTitle(), page.seconds()]).toEqual(['Jupiter', 38]);
    expect(paintedBy(canvas())).toEqual(colours(38, 8));
    expect(colours(38, 8)).not.toEqual(colours(38));
    expect(colours(38, 8)).not.toEqual(colours(8));
    // Each world's name stays under it.
    expect(nameShown('Jupiter')).toEqual(namePlaced('Jupiter', 38, 8));
    expect(namePlaced('Jupiter', 38, 8)).not.toEqual(namePlaced('Jupiter', 38));
    // A press finds each world where it is drawn: another planet's card keeps the hold, and Jupiter is still there.
    const saturn = page.placeOf('Saturn', 8);
    tap(saturn.x, saturn.y);
    expect(cardTitle()).toBe('Saturn');
    runFrames(page, 20);
    tap(held.x, held.y);
    expect([cardTitle(), page.seconds()]).toEqual(['Jupiter', 40]);

    // Closed after 32 seconds: ten seconds later the orbits have run 18, not 50.
    key(document, 'Escape');
    runFrames(page, 100);
    expect(paintedBy(canvas())).toEqual(colours(50, 18));
    const resumed = page.placeOf('Jupiter', 18);
    const jumped = page.placeOf('Jupiter', 50);
    expect(apart(resumed, jumped)).toBeGreaterThan(2 * page.grasp('Jupiter'));
    tap(resumed.x, resumed.y);
    expect(cardTitle()).toBe('Jupiter');
    key(document, 'Escape');
    tap(jumped.x, jumped.y);
    expect(cardTitle()).not.toBe('Jupiter');
  });

  it('a change of map releases the orbits: back in the system its worlds have moved on', async () => {
    const page = await atSol();
    rest(page);
    const held = page.placeOf('Jupiter', 8);
    tap(held.x, held.y);
    expect(cardTitle()).toBe('Jupiter');
    runFrames(page, 50);
    // Up to the galaxy at second 13, the orbits held at 8; back down, and thirty seconds more.
    page.nav.ascend();
    expect([page.nav.nav.mode, cardTitle()]).toEqual(['galaxy', null]);
    page.nav.travelToCode(encodeWhere(page.nav.solRoute() as never) as string);
    expect(page.nav.nav.mode).toBe('system');
    runFrames(page, 300);
    expect(page.seconds()).toBe(43);
    const moved = page.placeOf('Jupiter', 38);
    expect(apart(held, moved)).toBeGreaterThan(2 * page.grasp('Jupiter'));
    tap(moved.x, moved.y);
    expect(cardTitle()).toBe('Jupiter');
    key(document, 'Escape');
    tap(held.x, held.y);
    expect(cardTitle()).not.toBe('Jupiter');
  });

  it('Motion set to Reduced after a hold: every world is drawn at its start and pressed there', async () => {
    const page = await atSol();
    rest(page);
    const held = page.placeOf('Jupiter', 8);
    tap(held.x, held.y);
    runFrames(page, 300);
    key(document, 'Escape');
    page.live.motionMode = 1;
    page.env.bus.emit('settings:changed', { field: 'motionMode' });
    runFrames(page, 2);
    const start = page.placeOf('Jupiter', 0);
    // Thirty seconds were spent under the hold: a clock that ran back by them would look for Jupiter far from here.
    expect(apart(start, page.placeOf('Jupiter', -30))).toBeGreaterThan(2 * page.grasp('Jupiter'));
    tap(start.x, start.y);
    expect(cardTitle()).toBe('Jupiter');
    key(document, 'Escape');
    // Full motion again: the orbits go on from where they were held, as if Reduced had never been set.
    page.live.motionMode = 0;
    runFrames(page, 20);
    const on = page.placeOf('Jupiter', page.seconds() - 30);
    tap(on.x, on.y);
    expect(cardTitle()).toBe('Jupiter');
  });

  it('Motion set to Reduced while a card holds the orbits: every world is at its start, and another world is pressed there', async () => {
    const page = await atSol();
    rest(page);
    runFrames(page, 300);
    const moving = page.placeOf('Jupiter', 38);
    tap(moving.x, moving.y);
    expect(cardTitle()).toBe('Jupiter');
    page.live.motionMode = 1;
    page.env.bus.emit('settings:changed', { field: 'motionMode' });
    runFrames(page, 2);
    const saturn = page.placeOf('Saturn', 0);
    expect(apart(saturn, page.placeOf('Saturn', 38))).toBeGreaterThan(2 * page.grasp('Saturn'));
    tap(saturn.x, saturn.y);
    expect(cardTitle()).toBe('Saturn');
  });

  it('under reduced motion every world stays at its start, and a card changes nothing', async () => {
    const page = await atSol();
    page.live.motionMode = 1;
    rest(page);
    const start = page.placeOf('Jupiter', 0);
    tap(start.x, start.y);
    expect(cardTitle()).toBe('Jupiter');
    runFrames(page, 300);
    key(document, 'Escape');
    runFrames(page, 300);
    tap(start.x, start.y);
    expect(cardTitle()).toBe('Jupiter');
  });
});
