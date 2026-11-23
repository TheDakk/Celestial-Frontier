// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentRegionOf } from '@cf/scene';
import { descentCamera, mapPicture, type Camera, type MapFrame } from '../src/space';
import { currentSheet } from '../src/ui';
import { REGISTRY, bootSave } from '../src/save/index';
import { NOW, SOL_ROUTE } from './save-support';
import { bootPage, pretendLayout, pretendSize, runFrames } from './shell-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

type Page = Awaited<ReturnType<typeof bootPage>>;
const canvas = (): HTMLCanvasElement => document.querySelector<HTMLCanvasElement>('canvas.map')!;
const wheel = (deltaY: number, times: number): void => {
  for (let i = 0; i < times; i++) canvas().dispatchEvent(Object.assign(new Event('wheel', { bubbles: true, cancelable: true }), { deltaY, clientX: 520, clientY: 210 }));
};
/** The picture of the page's place from a camera, with motion reduced: every clock of the map at its start. */
function pictureFrom(page: Page, cam: Camera): Array<number | null> {
  const sheet = currentSheet();
  const frame: MapFrame = {
    nav: page.nav.nav, cam, view: { w: 800, h: 600 }, dpr: 1, time: 0, epoch: page.loop.publishedEpoch(),
    reach: currentRegionOf(0).r, charts: page.live.chartsOn, passes: { effects: page.live.fxOn, motion: false }, sized: true, solid: true,
  };
  return Array.from(mapPicture(frame, sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
}
/** The page is left and the same store opened by a new one: its first frame, with motion reduced so nothing eases. */
async function reloaded(page: Page): Promise<Page> {
  await page.loop.flush();
  // The page going away gives the save up, as a real one does when it is left, and never comes back for it. (In this
  // test the old page's listeners live on in the one document.)
  await page.loop.hide();
  vi.spyOn(page.loop, 'show').mockResolvedValue(undefined);
  vi.spyOn(page.loop, 'beat').mockResolvedValue(undefined);
  const again = await bootPage({ backend: page.backend, width: 800, height: 600 });
  again.live.motionMode = 1;
  runFrames(again, 1);
  return again;
}

describe('the map after a reload', () => {
  it('keeps the place and not the zoom: a galaxy or a system opens centred at its entry view, as the game opens it; the universe at its first view', async () => {
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    runFrames(page, 2);
    // Sol, zoomed in off its centre.
    const entry = descentCamera('system', 600).to;
    expect(paintedBy(canvas())).toEqual(pictureFrom(page, entry));
    wheel(-120, 6);
    runFrames(page, 2);
    expect(page.nav.nav.mode).toBe('system');
    expect(paintedBy(canvas())).not.toEqual(pictureFrom(page, entry));
    const system = await reloaded(page);
    expect(system.nav.nav.mode).toBe('system');
    expect(paintedBy(canvas())).toEqual(pictureFrom(system, entry));
    // What is stored names the place alone: no camera is kept.
    const stored = (await bootSave({ backend: page.backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE })).state.savedView as Record<string, unknown>;
    expect(Object.keys(stored).sort()).toEqual(['gal', 'star', 'type']);

    // The galaxy, come back to about the Sun and zoomed out a little.
    system.nav.ascend();
    runFrames(system, 2);
    wheel(120, 2);
    runFrames(system, 2);
    expect(system.nav.nav.mode).toBe('galaxy');
    expect(paintedBy(canvas())).not.toEqual(pictureFrom(system, descentCamera('galaxy', 600).to));
    const galaxy = await reloaded(system);
    expect(galaxy.nav.nav.mode).toBe('galaxy');
    expect(paintedBy(canvas())).toEqual(pictureFrom(galaxy, descentCamera('galaxy', 600).to));

    // The universe: come back to about the home galaxy; reloaded, it opens on the game's first view.
    galaxy.nav.ascend();
    runFrames(galaxy, 2);
    expect(paintedBy(canvas())).not.toEqual(pictureFrom(galaxy, { x: 0, y: 0, z: 1 }));
    const universe = await reloaded(galaxy);
    expect(universe.nav.nav.mode).toBe('universe');
    expect(paintedBy(canvas())).toEqual(pictureFrom(universe, { x: 0, y: 0, z: 1 }));
  });
});
