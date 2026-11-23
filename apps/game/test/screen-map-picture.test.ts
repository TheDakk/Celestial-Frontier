// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeWhere } from '@cf/domain-strays';
import { currentRegionOf, type NavState } from '@cf/scene';
import { ascentCamera, descentCamera, mapPicture, placedLabels, visibleBodies, type MapFrame } from '../src/space';
import { currentSheet, placeholderSheet, useSheet } from '../src/ui';
import { HOME as HOME_GALAXY, SOL as SOL_STAR } from './nav-support';
import { atUniverse, canvas, fire, rest } from './screen-map-support';
import { bootPage, pretendLayout, pretendSize } from './shell-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

describe('the map screen\'s picture and words', () => {
  it('draws the whole map of the game: its passes with the effects switch, held still under reduced motion', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    page.nav.ascend();
    const home = (page.nav.nav as Extract<NavState, { mode: 'galaxy' }>).gal;
    page.nav.ascend();
    rest(page);
    // Out to where the fog beyond the charter is in the view.
    const cam = ascentCamera({ kind: 'galaxy', x: home.x, y: home.y, size: home.size }, 600).to;
    for (let i = 0; i < 26; i++) { fire(canvas(), 'wheel', { deltaY: 120, clientX: 400, clientY: 300 }); cam.z *= 0.88; }
    rest(page);
    const sheet = currentSheet();
    const shown = (): MapFrame => ({
      nav: page.nav.nav, cam, view: { w: 800, h: 600 }, dpr: 1, time: 0,
      epoch: page.loop.publishedEpoch(), reach: currentRegionOf(0).r, charts: page.live.chartsOn, passes: { effects: page.live.fxOn, motion: false }, sized: true, solid: true,
    });
    const colours = (frame: MapFrame): Array<number | null> =>
      Array.from(mapPicture(frame, sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
    expect(page.live.fxOn).toBe(true);
    expect(paintedBy(canvas())).toEqual(colours(shown()));
    // Each part of the frame shows in this picture: without the passes, with effects off, or with motion on, it differs.
    const { passes: _passes, ...partial } = shown();
    expect(colours(partial)).not.toEqual(colours(shown()));
    expect(colours({ ...shown(), passes: { effects: true, motion: true } })).not.toEqual(colours(shown()));
    page.live.fxOn = false;
    expect(colours(shown())).not.toEqual(colours({ ...shown(), passes: { effects: true, motion: false } }));
    page.env.bus.emit('settings:changed', { field: 'fxOn' });
    rest(page);
    expect(paintedBy(canvas())).toEqual(colours(shown()));
  });

  it('draws each thing the size the game gives it at the zoom, and letters the game\'s labels where they belong', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    rest(page);
    const sheet = currentSheet();
    const frame = (cam: MapFrame['cam']): MapFrame => ({
      nav: page.nav.nav, cam, view: { w: 800, h: 600 }, dpr: 1, time: 0,
      epoch: page.loop.publishedEpoch(), reach: currentRegionOf(0).r, charts: page.live.chartsOn, passes: { effects: page.live.fxOn, motion: false }, sized: true, solid: true,
    });
    const colours = (shown: MapFrame): Array<number | null> =>
      Array.from(mapPicture(shown, sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
    const label = (text: string): HTMLCanvasElement | null => document.querySelector<HTMLCanvasElement>(`.map-captions canvas[data-caption="${text}"]`);
    // Sol, zoomed in: the star is drawn larger than its one size, and each planet in view is named under its disc.
    for (let i = 0; i < 12; i++) fire(canvas(), 'wheel', { deltaY: -120, clientX: 400, clientY: 300 });
    rest(page);
    const system = descentCamera('system', 600).to;
    const near = { ...system, z: system.z * 1.14 ** 12 };
    expect(paintedBy(canvas())).toEqual(colours(frame(near)));
    const { sized: _sized, ...unsized } = frame(near);
    expect(colours(unsized)).not.toEqual(colours(frame(near)));
    // Each word stands where the placement puts it, in the picture's own pixels: here 2 screen pixels each.
    const placed = placedLabels({ ...frame(near), placement: { keepOut: [], tails: true, stand: true, apart: true } }, currentRegionOf(0).name, sheet.font);
    expect(placed.length).toBeGreaterThan(0);
    // The comet's name stands on its foot above the comet, as the game anchors it.
    expect(placed.filter((words) => words.text.startsWith('Comet ')).map((words) => words.side)).toEqual(['above']);
    expect(placed.map((words) => words.text)).toEqual(expect.arrayContaining(visibleBodies(page.nav.nav, near, { w: 800, h: 600 }, 0).filter((body) => body.kind === 'planet').map((body) => body.label)));
    for (const words of placed) {
      const drawn = label(words.text)!;
      expect([drawn.style.left, drawn.style.top, drawn.style.width, drawn.style.height], words.text).toEqual([`${words.x * 2}px`, `${words.y * 2}px`, `${words.w * 2}px`, `${words.h * 2}px`]);
      expect([drawn.width, drawn.height], words.text).toEqual([words.w, words.h]);
    }
    expect(document.querySelectorAll('.map-captions canvas')).toHaveLength(placed.length);
    // The galaxy: the Sun is lettered over its mark. The universe: the home galaxy under it.
    page.nav.ascend();
    rest(page);
    // Over its light, which up close is wider than the 14 pixels the game lifts the words.
    const sun = label('Sun — our star')!;
    const over = placedLabels({ ...frame(ascentCamera({ kind: 'star', x: SOL_STAR.x, y: SOL_STAR.y }, 600).to), placement: { keepOut: [] } }, currentRegionOf(0).name, sheet.font)[0]!;
    expect([over.text, over.side, parseFloat(sun.style.top) + parseFloat(sun.style.height)]).toEqual(['Sun — our star', 'above', (over.y + over.h) * 2]);
    expect((over.y + over.h) * 2).toBeLessThan(300 - 14);
    page.nav.ascend();
    rest(page);
    expect(label('Milky Way — you are here')).not.toBeNull();
    expect(label('Sun — our star')).toBeNull();
  });

  it('on a new game\'s map of Sol no planet\'s name stands across the comet\'s tail', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    rest(page);
    // With motion reduced the comet is held where it starts: 27 world units from the Sun along 1.1 radians, its tail
    // 41 more straight on. In screen pixels about the middle of the view, at the zoom a system is entered at.
    const z = descentCamera('system', 600).to.z;
    const tail = Array.from({ length: 41 }, (_, i) => ({ x: 400 + (27 + i) * Math.cos(1.1) * z, y: 300 + (27 + i) * Math.sin(1.1) * z }));
    const names = [...document.querySelectorAll<HTMLCanvasElement>('.map-captions canvas')];
    expect(names.map((name) => name.dataset.caption)).toContain('Mercury');
    const crossed = names.filter((name) => {
      const [left, top, width, height] = [name.style.left, name.style.top, name.style.width, name.style.height].map(parseFloat) as [number, number, number, number];
      return tail.some((p) => p.x >= left && p.x < left + width && p.y >= top && p.y < top + height);
    });
    expect(crossed.map((name) => name.dataset.caption)).toEqual([]);
  });

  it('letters the map again in the pack\'s font when the pack arrives after the map was first lettered', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    rest(page);
    const earth = (): HTMLCanvasElement => document.querySelector<HTMLCanvasElement>('.map-captions canvas[data-caption="Earth"]')!;
    const before = paintedBy(earth()).join();
    // A sheet whose E is drawn as its X: the same line height, other letters.
    const sheet = placeholderSheet();
    const glyphs = new Map(sheet.font.glyphs);
    glyphs.set('E'.codePointAt(0)!, glyphs.get('X'.codePointAt(0)!)!);
    try {
      useSheet({ ...sheet, font: { ...sheet.font, glyphs } });
      page.env.bus.emit('pack:status', { name: 'interface', state: 'ready', detail: null });
      rest(page);
      expect(paintedBy(earth()).join()).not.toBe(before);
    } finally { useSheet(null); }
  });

  it('letters the captions of the map: the charter over its ring from the zoom it shows at, the belt and the zone with the star charts', async () => {
    const page = await atUniverse();
    const captions = (): string[] => [...document.querySelectorAll<HTMLElement>('.map-captions canvas')].map((c) => c.dataset.caption!);
    const charter = `your charter — ${currentRegionOf(0).name}`;
    // Out to where the top of the charter's ring is in the view.
    for (let i = 0; i < 26; i++) fire(canvas(), 'wheel', { deltaY: 120, clientX: 400, clientY: 300 });
    rest(page);
    expect(captions()).toContain(charter);
    const label = document.querySelector<HTMLCanvasElement>(`.map-captions canvas[data-caption="${charter}"]`)!;
    expect(label.width).toBeGreaterThan(charter.length * 2);
    expect(label.height).toBe(currentSheet().font.line);
    expect(document.querySelector('.map-captions')!.getAttribute('aria-hidden')).toBe('true');
    // Far out, below the zoom the charter shows at, its label goes with its ring.
    for (let i = 0; i < 60; i++) fire(canvas(), 'wheel', { deltaY: 120, clientX: 400, clientY: 300 });
    rest(page);
    expect(captions()).not.toContain(charter);

    page.live.chartsOn = true;
    page.nav.travelToCode(encodeWhere(page.nav.solRoute() as never) as string);
    rest(page);
    expect(captions()).toEqual(expect.arrayContaining(['asteroid belt', 'habitable zone']));
    page.live.chartsOn = false;
    rest(page);
    expect(captions()).not.toContain('asteroid belt');
  });

  it('words wider than the view wrap onto lines that fit it', async () => {
    pretendSize(140, 600);
    try {
      const page = await atUniverse();
      for (let i = 0; i < 26; i++) fire(canvas(), 'wheel', { deltaY: 120, clientX: 70, clientY: 300 });
      rest(page);
      const charter = document.querySelector<HTMLCanvasElement>(`.map-captions canvas[data-caption="your charter — ${currentRegionOf(0).name}"]`)!;
      expect(charter.height).toBeGreaterThan(currentSheet().font.line);
      expect(charter.height % currentSheet().font.line).toBe(0);
      expect(parseFloat(charter.style.width)).toBeLessThanOrEqual(140 - 8);
      expect(parseFloat(charter.style.left)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(charter.style.left) + parseFloat(charter.style.width)).toBeLessThanOrEqual(140);
    } finally {
      pretendSize(800, 600);
    }
  });

  it('no word of the map stands under the top bar or the dock', async () => {
    const page = await atUniverse();
    const boxes = (): Array<{ text: string; top: number; bottom: number }> => [...document.querySelectorAll<HTMLCanvasElement>('.map-captions canvas')]
      .map((c) => ({ text: c.dataset.caption!, top: parseFloat(c.style.top), bottom: parseFloat(c.style.top) + parseFloat(c.style.height) }));
    const underBar = (): string[] => boxes().filter((box) => box.top < 60 && box.bottom > 0).map((box) => box.text);
    // Out until some word stands in the top 60 pixels of the view.
    for (let i = 0; i < 40 && underBar().length === 0; i++) {
      fire(canvas(), 'wheel', { deltaY: 120, clientX: 400, clientY: 300 });
      rest(page);
    }
    const hidden = underBar();
    expect(hidden.length).toBeGreaterThan(0);
    // The page then lays a bar over those 60 pixels.
    const bar = document.querySelector('.top-bar')!;
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 800, height: 60 } as DOMRect);
    rest(page);
    expect(underBar()).toEqual([]);
    expect(boxes().length).toBeGreaterThan(0);
  });

  it('draws the map on its canvas at the size of the view, and again when the place changes', async () => {
    const page = await atUniverse();
    expect([canvas().style.width, canvas().style.height]).toEqual(['800px', '600px']);
    const universe = paintedBy(canvas()).join();
    expect(new Set(paintedBy(canvas())).size).toBeGreaterThan(2);
    page.nav.enterGalaxy(HOME_GALAXY);
    rest(page);
    expect(paintedBy(canvas()).join()).not.toBe(universe);
    // With motion on the map is alive, and asks for its next frame; with motion reduced, at rest, it asks for none.
    expect(page.frames).toHaveLength(1);
    page.live.motionMode = 1;
    rest(page);
    expect(page.frames).toHaveLength(0);
  });
});
