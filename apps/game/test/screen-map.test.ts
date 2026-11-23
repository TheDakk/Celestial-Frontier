// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { describePickWithState } from '@cf/domain-descriptors';
import { encodeWhere } from '@cf/domain-strays';
import { OBS_R } from '@cf/domain-worldconfig';
import { createMemoryBackend, initializeFreshV5 } from '@cf/persistence';
import { ascHintFor, navToView } from '@cf/scene';
import { ascentCamera, descentCamera, supernovaBodies, toScreen, visibleBodies } from '../src/space';
import type { GameEvents } from '../src/events';
import { REGISTRY } from '../src/save/index';
import descriptors from '../../../fixtures/current/descriptors.json' with { type: 'json' };
import { HOME as HOME_GALAXY, SOL as SOL_STAR } from './nav-support';
import { NOW, namedState } from './save-support';
import { atUniverse, canvas, card, cardRows, cardTitle, fire, key, keyboardFocus, rest, storedRoute, tap } from './screen-map-support';
import { bootPage, pretendLayout, pretendSize, runFrames } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();
pretendSize(800, 600);
beforeEach(() => { vi.restoreAllMocks(); recordCanvasPainting(); });

describe('the map screen', () => {
  it('tapping the home galaxy opens its card; Enter galaxy enters it; the route is saved', async () => {
    const page = await atUniverse();
    expect(page.nav.nav.mode).toBe('universe');
    expect(cardTitle()).toBeNull();
    tap(400, 300);
    expect(cardTitle()).toBe('Milky Way');
    expect([page.ping.mock.calls.length, page.whoosh.mock.calls.length]).toEqual([1, 0]);
    const enter = card().querySelector<HTMLButtonElement>('[data-act="travel"]')!;
    expect(enter.textContent).toBe('Enter galaxy');
    enter.click();
    expect(page.nav.nav).toMatchObject({ mode: 'galaxy', gal: { seed: HOME_GALAXY.seed } });
    expect([cardTitle(), page.whoosh.mock.calls.length]).toEqual([null, 1]);
    await page.loop.flush();
    expect(await storedRoute(page)).toMatchObject({ type: 'galaxy', gal: { seed: HOME_GALAXY.seed } });

    // The place is kept across a reload.
    const again = await bootPage({ backend: page.backend, width: 800, height: 600 });
    expect(again.nav.nav).toMatchObject({ mode: 'galaxy', gal: { seed: HOME_GALAXY.seed } });
  });

  it('the map carries the line that rings it for the keyboard: after the picture, inside the map\'s own box', async () => {
    await atUniverse();
    const edge = document.querySelector<HTMLElement>('.map-area > .map-edge')!;
    expect([edge.getAttribute('aria-hidden'), edge.textContent]).toEqual(['true', '']);
    // It follows the picture among the map's own children, which is how the stylesheet shows it for a focused map.
    expect(canvas().compareDocumentPosition(edge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([canvas().parentElement, canvas().tabIndex]).toEqual([edge.parentElement, 0]);
  });

  it('the same path works from the keyboard alone', async () => {
    const page = await atUniverse();
    canvas().focus();
    // Keyboard focus takes the first body: the home galaxy, then the Sun.
    expect(document.querySelector('.map-focus span')).not.toBeNull();
    runFrames(page);
    expect(document.querySelector<HTMLElement>('.map-focus')!.hidden).toBe(false);
    expect(document.querySelector('.map-focus span')!.textContent).toBe('Milky Way — you are here');
    key(canvas(), 'Enter');
    expect(cardTitle()).toBe('Milky Way');
    expect(document.activeElement).toBe(card().querySelector('[data-act="travel"]'));
    (document.activeElement as HTMLElement).click();
    expect(page.nav.nav.mode).toBe('galaxy');
    rest(page);

    await keyboardFocus();
    key(canvas(), 'Enter');
    expect(cardTitle()).toBe('Sun (Sol)');
    (document.activeElement as HTMLElement).click();
    expect(page.nav.nav).toMatchObject({ mode: 'system', star: { seed: SOL_STAR.seed } });
    expect(page.whoosh).toHaveBeenCalledTimes(2);
    rest(page);

    // A world shows its rows and offers no travel; then back out by Escape, the card first.
    await keyboardFocus();
    key(canvas(), 'Enter');
    expect(cardTitle()).toBe('Earth');
    expect(card().querySelector('[data-act="travel"]')).toBeNull();
    expect(document.activeElement).toBe(card().querySelector('[data-survey-close]'));
    key(document, 'Escape');
    expect([cardTitle(), page.nav.nav.mode, document.activeElement]).toEqual([null, 'system', canvas()]);
    canvas().blur();
    key(document, 'Escape');
    expect(page.nav.nav.mode).toBe('galaxy');
    key(document, 'Escape');
    expect(page.nav.nav.mode).toBe('universe');
    key(document, 'Escape');
    expect(page.nav.nav.mode).toBe('universe');
    expect(page.whoosh).toHaveBeenCalledTimes(4);
    await page.loop.flush();
    expect(await storedRoute(page)).toEqual(navToView(page.nav.nav));
  });

  it('a star outside reach shows the charter hint and the nav is unchanged', async () => {
    const page = await atUniverse();
    page.nav.enterGalaxy(HOME_GALAXY);
    rest(page);
    page.whoosh.mockClear();
    const refused: GameEvents['nav:refused'][] = [];
    page.env.bus.on('nav:refused', (event) => refused.push(event));
    const before = page.nav.nav;
    await page.loop.flush();

    canvas().focus();
    key(canvas(), 'ArrowRight');
    key(canvas(), 'Enter');
    expect(cardTitle()).not.toBe('Sun (Sol)');
    const enter = card().querySelector<HTMLButtonElement>('[data-act="travel"]')!;
    expect(enter.textContent).toBe('Enter system');
    enter.click();
    expect(refused).toEqual([{ reason: 'charter-reach', hint: ascHintFor(0) }]);
    expect(page.chrome.toast.textContent).toBe(`Beyond Your Charter${ascHintFor(0)}`);
    expect(page.nav.nav).toBe(before);
    await page.loop.flush();
    expect([page.whoosh.mock.calls.length, cardTitle() !== null]).toEqual([0, true]);
    expect(await storedRoute(page)).toMatchObject({ type: 'galaxy' });

    // Zooming into the same star is refused the same way, and the view is held short of the dive.
    refused.length = 0;
    await keyboardFocus();
    key(canvas(), 'ArrowRight');
    for (let i = 0; i < 40; i++) key(canvas(), '+');
    expect(refused.length).toBeGreaterThan(0);
    expect(refused.every((event) => event.reason === 'charter-reach')).toBe(true);
    expect(page.nav.nav).toBe(before);
  });

  it('scenery of a galaxy is named by its card and opens in silence; a supernova site answers with the ping', async () => {
    const page = await atUniverse();
    page.nav.enterGalaxy(HOME_GALAXY);
    rest(page);
    const cam = descentCamera('galaxy', 600).to;
    const view = { w: 800, h: 600 };
    const all = [...visibleBodies(page.nav.nav, cam, view, 0), ...supernovaBodies(page.nav.nav, 0)]
      .map((body) => ({ body, ...toScreen(cam, view, body.wx, body.wy) }));
    /** A body of one of the kinds, in the view. A tap exactly on a body selects it: it is the nearest. */
    const inView = (...kinds: string[]) => all.find((a) => kinds.includes(a.body.kind) && a.x > 20 && a.x < 780 && a.y > 20 && a.y < 580)!;
    const nowhere = { gal: page.nav.nav.mode === 'galaxy' ? page.nav.nav.gal : null, star: null };

    const deco = inView('deco');
    tap(deco.x, deco.y);
    const decoTitle = describePickWithState({ kind: 'deco', data: deco.body.ref }, nowhere, () => null, 0)!.title;
    expect([cardTitle(), page.ping.mock.calls.length]).toEqual([decoTitle, 0]);
    expect(card().querySelector('[data-act="travel"]')).toBeNull();

    const site = inView('snova', 'protostar');
    tap(site.x, site.y);
    expect([cardTitle(), page.ping.mock.calls.length]).toEqual([describePickWithState({ kind: site.body.kind, data: site.body.ref }, nowhere, () => null, 0)!.title, 1]);

    // The keyboard announces scenery by the title of its card, not by a stand-in word.
    await keyboardFocus();
    key(canvas(), 'ArrowLeft');
    key(canvas(), 'ArrowLeft');
    const announced = document.querySelector('[aria-live="polite"][aria-atomic]')!.textContent!;
    key(canvas(), 'Enter');
    expect(announced).toBe(`${cardTitle()}. Press Enter to survey; plus or minus to zoom.`);
    expect(['nebula', 'emission nebula', 'wormhole', 'protostar', 'supernova aftermath', 'molecular cloud']).not.toContain(cardTitle());
  });

  it('a refusal with no words shows no toast', async () => {
    const page = await atUniverse();
    page.env.bus.emit('nav:refused', { reason: 'not-proven', hint: '' });
    page.env.bus.emit('nav:refused', { reason: 'charter-reach', hint: '' });
    expect(page.chrome.toast.textContent).toBe('');
  });

  it('the card for a body the descriptors fixture holds shows the recorded title and rows', async () => {
    const recorded = (kind: string, where: (input: Record<string, unknown>) => boolean) => {
      const found = descriptors.cases.find((c) => c.input.kind === kind && where(c.input as Record<string, unknown>))!.output as Record<string, unknown>;
      return (found.card ?? found) as { title: string; sub: string; badge?: string; rows: string[][]; designation?: { name: string } };
    };
    const shown = (expected: ReturnType<typeof recorded>, rarity: boolean): void => {
      expect(cardTitle()).toBe(expected.title);
      expect(card().querySelector('[data-sel="sub"]')!.textContent).toBe(expected.badge ? `${expected.sub} · ${expected.badge}` : expected.sub);
      const rows = expected.rows.filter(([name]) => name !== 'Spectral class').map(([name, value]) => [name, value]);
      expect(cardRows()).toEqual(rarity ? [['Rarity', expected.designation!.name], ...rows] : rows);
    };
    const page = await atUniverse();
    tap(400, 300);
    shown(recorded('galaxy', (input) => input.cx === 0 && input.cy === -1 && input.index === 0), true);
    card().querySelector<HTMLElement>('[data-act="travel"]')!.click();
    rest(page);
    await keyboardFocus();
    key(canvas(), 'Enter');
    shown(recorded('star', (input) => input.seed === SOL_STAR.seed), true);
    card().querySelector<HTMLElement>('[data-act="travel"]')!.click();
    rest(page);
    await keyboardFocus();
    key(canvas(), 'Enter');
    // A world's rarity is not shown before it is landed on.
    shown(recorded('planet', (input) => input.planet === 133 && input.epoch === 0), false);
  });

  it('the descriptor is asked with the published epoch', async () => {
    const backend = createMemoryBackend();
    const state = namedState('Vega');
    state.EPOCH_BASE = 12;
    state.savedView = (await bootPage()).nav.solRoute();
    expect((await initializeFreshV5(backend, { state, extensions: {} }, REGISTRY, NOW)).kind).toBe('initialized');
    const page = await bootPage({ backend, width: 800, height: 600 });
    expect([page.nav.nav.mode, page.loop.publishedEpoch()]).toEqual(['system', 12]);
    rest(page);
    canvas().focus();
    key(canvas(), 'Enter');
    const recorded = (epoch: number): string[][] => (descriptors.cases.find((c) => c.input.kind === 'planet' && c.input.planet === 133 && c.input.epoch === epoch)!
      .output as unknown as { rows: string[][] }).rows.filter(([name]) => name !== 'Spectral class').map(([name, value]) => [name!, value!]);
    expect(cardTitle()).toBe('Earth');
    expect(cardRows()).toEqual(recorded(12));
    expect(recorded(12)).not.toEqual(recorded(0));
  });

  it('Escape closes the card before it ascends', async () => {
    const page = await atUniverse();
    page.nav.enterGalaxy(HOME_GALAXY);
    rest(page);
    canvas().focus();
    key(canvas(), 'Enter');
    expect([cardTitle(), page.nav.nav.mode]).toEqual(['Sun (Sol)', 'galaxy']);
    key(document, 'Escape');
    expect([cardTitle(), page.nav.nav.mode]).toEqual([null, 'galaxy']);
    key(document, 'Escape');
    expect(page.nav.nav.mode).toBe('universe');
    // An open panel yields before the card does.
    tap(400, 300);
    page.openSettings();
    key(document, 'Escape');
    expect([page.panels.openId(), cardTitle()]).toEqual([null, 'Milky Way']);
  });

  it('a pasted code travels to its place within reach, plays the whoosh, and is refused in silence when it is no place', async () => {
    const page = await atUniverse();
    const search = document.querySelector<HTMLInputElement>('.stage input[type="search"]')!;
    const code = encodeWhere(page.nav.solRoute() as never) as string;
    search.focus();
    search.value = 'not a code';
    key(search, 'Enter');
    expect([page.nav.nav.mode, search.value, page.chrome.toast.textContent]).toEqual(['universe', 'not a code', '']);
    key(document, 'Escape');
    expect([document.activeElement === search, page.nav.nav.mode]).toEqual([false, 'universe']);
    search.focus();
    search.value = ` ${code} `;
    key(search, 'Enter');
    expect(page.nav.nav).toMatchObject({ mode: 'system', star: { seed: SOL_STAR.seed } });
    expect([search.value, page.whoosh.mock.calls.length, document.activeElement === search]).toEqual(['', 1, false]);
    await page.loop.flush();
    expect(await storedRoute(page)).toEqual(page.nav.solRoute());
  });

  it('zooming into the home galaxy dives into it, and zooming far out of it ascends', async () => {
    const page = await atUniverse();
    const wheel = (deltaY: number, times: number): void => {
      for (let i = 0; i < times && page.nav.nav.mode === start; i++) fire(canvas(), 'wheel', { deltaY, clientX: 400, clientY: 300 });
    };
    let start = page.nav.nav.mode;
    wheel(-120, 60);
    expect(page.nav.nav).toMatchObject({ mode: 'galaxy', gal: { seed: HOME_GALAXY.seed } });
    rest(page);
    start = 'galaxy';
    wheel(120, 60);
    expect(page.nav.nav.mode).toBe('universe');
    expect(page.whoosh).toHaveBeenCalledTimes(2);
  });

  it('a tap on empty space by the ring of the observable universe opens the origin card, and nowhere else', async () => {
    const page = await atUniverse();
    tap(40, 40);
    expect(cardTitle()).toBeNull();
    // Zoom out until the ring crosses the view. The view stays centred on the home galaxy.
    const steps = 33;
    for (let i = 0; i < steps; i++) fire(canvas(), 'wheel', { deltaY: 120, clientX: 400, clientY: 300 });
    rest(page);
    const z = ascentCamera({ kind: 'galaxy', x: page.home.x, y: page.home.y, size: page.home.size }, 600).to.z * 0.88 ** steps;
    const origin = describePickWithState({ kind: 'cmb', data: {} }, { gal: null, star: null }, () => null, 0)!.title;
    // A body under the tap takes it, as on any map: the ring answers where the space is empty.
    const titles: Array<string | null> = [];
    for (let turn = 0; turn < 16 && !titles.includes(origin); turn++) {
      const angle = turn * Math.PI / 8;
      tap(400 + (Math.cos(angle) * OBS_R - page.home.x) * z, 300 + (Math.sin(angle) * OBS_R - page.home.y) * z);
      titles.push(cardTitle());
    }
    expect(titles).toContain(origin);
    expect(card().querySelector('[data-act="travel"]')).toBeNull();
    // Well inside the ring, empty space opens nothing.
    key(document, 'Escape');
    const inside: Array<string | null> = [];
    for (let turn = 0; turn < 16; turn++) {
      tap(400 + Math.cos(turn) * OBS_R * 0.6 * z, 300 + Math.sin(turn) * OBS_R * 0.6 * z);
      inside.push(cardTitle());
      key(document, 'Escape');
    }
    expect(inside).not.toContain(origin);
  });

});
