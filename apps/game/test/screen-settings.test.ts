// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createMemoryBackend } from '@cf/persistence';
import { currentRegionOf } from '@cf/scene';
import { descentCamera, mapPicture, type MapFrame } from '../src/space';
import { REGISTRY, bootSave } from '../src/save/index';
import { SETTINGS_CATALOG } from '../src/screens/strings';
import { LOCALIZED_ATTRIBUTES, currentSheet, pseudoLocalize } from '../src/ui';
import { NOW, SOL_ROUTE, dump, seedCurrentSave } from './save-support';
import { bootPage, pretendLayout, pretendSize, runFrames, settled } from './shell-support';
import { paintedBy, recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const stored = async (backend: Parameters<typeof dump>[0]) =>
  (await bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE })).state;

/** Every string a reader or the eye meets in an element: its text and the three localized attributes, leaving
 *  out the parts marked as data. */
function shownStrings(root: Element): Set<string> {
  const out = new Set<string>();
  const walker = document.createTreeWalker(root, 4);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = (n.nodeValue ?? '').trim();
    if (text && !n.parentElement!.closest('[data-l10n-skip]')) out.add(text);
  }
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('[data-l10n-skip]')) continue;
    for (const a of LOCALIZED_ATTRIBUTES) { const v = el.getAttribute(a); if (v) out.add(v); }
  }
  return out;
}

describe('Settings', () => {
  it('each Settings control changes its save field and the change is stored after the save loop runs', async () => {
    const page = await bootPage();
    page.openSettings();
    const before = { ...page.live };
    expect([before.sndOn, before.tipsOn, before.motionMode, before.fsMode, before.toneMode, before.fontMode]).toEqual([true, true, -1, '', '', '']);

    page.control('sound').click();
    page.control('tips').click();
    page.control('motion', '1').click();
    page.control('size', 'fs-xl').click();
    page.control('tone', 'tone-max').click();
    page.control('font', 'font-mono').click();
    const volume = page.panel().querySelector<HTMLInputElement>('[data-set="volume"]')!;
    volume.value = '35';
    volume.dispatchEvent(new Event('input', { bubbles: true }));
    await page.loop.flush();

    const after = await stored(page.backend);
    expect({ sndOn: after.sndOn, tipsOn: after.tipsOn, motionMode: after.motionMode, fsMode: after.fsMode, toneMode: after.toneMode, fontMode: after.fontMode, sfxVol: after.sfxVol })
      .toEqual({ sndOn: false, tipsOn: false, motionMode: 1, fsMode: 'fs-xl', toneMode: 'tone-max', fontMode: 'font-mono', sfxVol: 0.35 });
    // The panel shows the new values, and the page looks as they say.
    expect(page.control('sound').getAttribute('aria-pressed')).toBe('false');
    expect(page.control('size', 'fs-xl').getAttribute('aria-pressed')).toBe('true');
    expect(page.control('size', '').getAttribute('aria-pressed')).toBe('false');
    const root = document.documentElement;
    expect([root.style.fontSize, root.dataset.motion, root.style.getPropertyValue('--display-scale')]).toEqual(['17px', 'reduced', '3']);
    expect(root.style.getPropertyValue('--ui')).toContain('monospace');
    expect(root.style.getPropertyValue('--cf-space-2')).toBe('8px');
  });

  it('Star charts is off in a new game; a press turns it on, stores it, and the map then draws the orbit lines, the zone and the chart labels', async () => {
    pretendSize(800, 600);
    const page = await bootPage({ width: 800, height: 600 });
    page.live.motionMode = 1;
    runFrames(page, 80);
    const sheet = currentSheet();
    const canvas = document.querySelector<HTMLCanvasElement>('canvas.map')!;
    const captions = (): string[] => [...document.querySelectorAll<HTMLElement>('.map-captions canvas')].map((c) => c.dataset.caption!);
    const picture = (charts: boolean): Array<number | null> => {
      const frame: MapFrame = {
        nav: page.nav.nav, cam: descentCamera('system', 600).to, view: { w: 800, h: 600 }, dpr: 1, time: 0, epoch: page.loop.publishedEpoch(),
        reach: currentRegionOf(0).r, charts, passes: { effects: page.live.fxOn, motion: false }, sized: true, solid: true, marks: true,
      };
      return Array.from(mapPicture(frame, sheet, { glyphs: [], icons: [], elements: [] }).pixels, (value) => (value === 0 ? null : sheet.palette.colours[value]!));
    };
    // The charts are the orbit lines and the zone: the two pictures differ, and each is the game's own.
    expect(picture(true)).not.toEqual(picture(false));
    const changes: string[] = [];
    page.env.bus.on('settings:changed', (event) => changes.push(event.field));

    page.openSettings();
    expect([page.live.chartsOn, page.control('charts').textContent, page.control('charts').getAttribute('aria-pressed')]).toEqual([false, 'Off', 'false']);
    expect(page.control('charts').title).toBe('Orbit paths, the habitable zone and chart labels in system view. Off keeps the sky looking like a universe.');
    // It stands after Motion, before the text controls.
    const order = [...page.panel().querySelectorAll('[data-set]')].map((control) => control.getAttribute('data-set'));
    expect(order.indexOf('charts')).toBe(order.lastIndexOf('motion') + 1);
    expect(paintedBy(canvas)).toEqual(picture(false));
    expect(captions()).not.toContain('habitable zone');

    page.control('charts').click();
    expect([page.live.chartsOn, page.control('charts').textContent, page.control('charts').getAttribute('aria-pressed')]).toEqual([true, 'On', 'true']);
    expect(changes).toEqual(['chartsOn']);
    runFrames(page, 2);
    expect(paintedBy(canvas)).toEqual(picture(true));
    expect(captions()).toEqual(expect.arrayContaining(['asteroid belt', 'habitable zone']));
    await page.loop.flush();
    expect((await stored(page.backend)).chartsOn).toBe(true);

    // Off again: the clean sky, stored as well.
    page.control('charts').click();
    runFrames(page, 2);
    expect([page.live.chartsOn, page.control('charts').textContent]).toEqual([false, 'Off']);
    expect(paintedBy(canvas)).toEqual(picture(false));
    expect(captions()).not.toContain('habitable zone');
    await page.loop.flush();
    expect((await stored(page.backend)).chartsOn).toBe(false);
  });

  it('a page opened on a save with Star charts on shows On and the charted map', async () => {
    pretendSize(800, 600);
    const first = await bootPage({ width: 800, height: 600 });
    first.openSettings();
    first.control('charts').click();
    await first.loop.flush();

    const page = await bootPage({ backend: first.backend, width: 800, height: 600 });
    runFrames(page, 80);
    expect(page.live.chartsOn).toBe(true);
    expect([...document.querySelectorAll<HTMLElement>('.map-captions canvas')].map((c) => c.dataset.caption)).toEqual(expect.arrayContaining(['asteroid belt', 'habitable zone']));
    page.openSettings();
    expect([page.control('charts').textContent, page.control('charts').getAttribute('aria-pressed')]).toEqual(['On', 'true']);
  });

  it('the two listening modes are kept on the device, not in the save, and the focus stays on the control pressed', async () => {
    const page = await bootPage();
    page.openSettings();
    const before = await dump(page.backend);
    page.control('mono').focus();
    page.control('mono').click();
    expect(document.activeElement).toBe(page.control('mono'));
    page.control('soft').click();
    expect([page.control('mono').getAttribute('aria-pressed'), page.control('soft').getAttribute('aria-pressed')]).toEqual(['true', 'true']);
    expect(JSON.parse(page.devicePreferenceRows.get('cf-v2-pixel/audio-accessibility/v1')!)).toEqual({ mono: true, reducedIntensity: true });
    await page.loop.flush();
    expect(await dump(page.backend)).toEqual(before);
  });

  it('Reset asks first; No changes nothing; Yes resets', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    const page = await bootPage({ backend });
    page.openSettings();
    const confirm = (): HTMLElement => document.getElementById('setresetconfirm')!;
    const before = await dump(backend);
    expect(confirm().hidden).toBe(true);

    page.control('reset').click();
    expect(confirm().hidden).toBe(false);
    expect(document.activeElement).toBe(page.control('reset-no'));
    page.control('reset-no').click();
    await settled();
    expect(confirm().hidden).toBe(true);
    expect(document.activeElement).toBe(page.control('reset'));
    expect([await dump(backend), page.reloads, (await stored(backend)).explorerName]).toEqual([before, 0, 'Vega']);

    page.control('reset').click();
    page.control('reset-yes').click();
    await settled();
    expect(page.reloads).toBe(1);
    const fresh = await stored(backend);
    expect(fresh.explorerName).not.toBe('Vega');
    expect(fresh.savedView).toEqual(page.nav.solRoute());
  });

  it('every Settings string exists in the catalogue; the pseudo-locale leaves none untranslated', async () => {
    const seen = new Set<string>();
    const states: Array<(page: Awaited<ReturnType<typeof bootPage>>) => Promise<void>> = [
      async () => undefined,
      async (page) => { for (const key of ['sound', 'mono', 'soft', 'charts', 'tips']) page.control(key).click(); page.control('reset').click(); },
      async (page) => { page.control('backup').click(); await settled(); },
      async (page) => { page.control('backup').click(); await settled(); page.chooser.answer = page.files[0]!.text; page.control('restore').click(); await settled(); },
      async (page) => { page.chooser.answer = '{broken'; page.control('restore').click(); await settled(); },
      async (page) => {
        page.control('backup').click();
        await settled();
        page.chooser.answer = JSON.stringify({ ...JSON.parse(page.files[0]!.text) as object, version: 2 });
        page.control('restore').click();
        await settled();
      },
      async (page) => { page.chooser.answer = 'x'.repeat(40_000_000); page.control('restore').click(); await settled(); },
      async (page) => { page.env.bus.emit('creature:gap', { key: 'k', gap: 'species:civet' }); },
      async (page) => { page.env.bus.emit('pack:status', { name: 'interface', state: 'standin', detail: 'absent' }); page.env.bus.emit('pack:status', { name: 'b', state: 'ready', detail: null }); page.env.bus.emit('pack:status', { name: 'c', state: 'refused', detail: 'wrong-hash' }); },
    ];
    for (const persisted of ['kept', 'not-kept', 'unknown', null] as const) {
      for (const reach of states) {
        const page = await bootPage(persisted === null ? {} : { persist: { persisted, asked: persisted } });
        await settled();
        page.openSettings();
        await reach(page);
        for (const s of shownStrings(page.panel())) seen.add(s);
      }
    }
    const held = createMemoryBackend();
    await seedCurrentSave(held);
    await held.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const heldPage = await bootPage({ backend: held });
    heldPage.openSettings();
    for (const s of shownStrings(heldPage.panel())) seen.add(s);

    const known = new Set(SETTINGS_CATALOG.strings);
    // The close control is the panel manager's, and the title is drawn text: both are outside the catalogue's rows.
    expect([...seen].filter((s) => !known.has(s) && s !== 'Close Settings').sort()).toEqual([]);
    // Not reached by the states above: the drawn title, and two that need a lost save or a loaded pack.
    const reached = new Set([...seen, 'Settings', 'Reload needed', 'From the art pack']);
    expect(SETTINGS_CATALOG.strings.filter((s) => !reached.has(s))).toEqual([]);

    const page = await bootPage({ search: '?locale=qps-ploc' });
    page.openSettings();
    page.control('reset').click();
    const pseudo = shownStrings(page.panel());
    expect([...pseudo].filter((s) => known.has(s))).toEqual([]);
    expect(pseudo.has(pseudoLocalize('Reset expedition'))).toBe(true);
    expect(page.control('sound').getAttribute('aria-label')).toBe(pseudoLocalize('Sound'));
    // The title stands in the panel's header, in the page's language, and nowhere among the rows.
    expect([page.panel().querySelector('.sheet-head h2')!.textContent, page.panel().querySelector('.panel-body h2')]).toEqual([pseudoLocalize('Settings'), null]);
    // A localized control still does its job.
    page.control('sound').click();
    expect(page.live.sndOn).toBe(false);
  });

  it('Status shows the build, the save state, each pack and the missing art', async () => {
    const page = await bootPage();
    page.openSettings();
    const facts = (): Record<string, string> => Object.fromEntries([...page.panel().querySelectorAll('[data-set="status"] .row')]
      .map((row) => [row.querySelector('.row-label')!.textContent!, [...row.querySelectorAll('.row-value')].map((v) => v.textContent).join(' ')]));
    expect(facts()).toMatchObject({ Build: 'test-build', Save: 'Stored on this device', 'Save revision': String(page.runtime.revision), 'Art packs': 'None listed', 'Interface art': 'Stand-in', 'Missing icons': '0' });
    page.env.bus.emit('pack:status', { name: 'interface', state: 'refused', detail: 'wrong-hash' });
    expect(facts()['Art packs']).toBe('interface refused');
    const revision = page.runtime.revision;
    page.control('sound').click();
    await page.loop.flush();
    expect(facts()['Save revision']).toBe(String(revision + 1));
  });

  it('Status lists the gaps in creature pictures by kind, each with the number of different gaps of that kind', async () => {
    const page = await bootPage();
    page.openSettings();
    const rows = (): string[][] => [...page.panel().querySelectorAll('[data-set="status"] [data-gap-kind]')]
      .map((value) => [value.getAttribute('data-gap-kind')!, value.textContent!]);
    const label = (): string[] => [...page.panel().querySelectorAll('[data-set="status"] .row')]
      .filter((row) => row.querySelector('.row-label')!.textContent === 'Missing creature art')
      .map((row) => [...row.querySelectorAll('.row-value')].map((v) => v.textContent).join(' '));
    expect([rows(), label()]).toEqual([[], ['None']]);
    for (const gap of ['species:civet', 'fallback:flora/medium', 'species:frog', 'species:civet', 'attach:eye0']) page.env.bus.emit('creature:gap', { key: 'k', gap });
    // Drawn again as the gaps arrive, the kinds in the order of the alphabet.
    expect(rows()).toEqual([['attach', '1'], ['fallback', '1'], ['species', '2']]);
    expect(label()).toEqual(['attach 1']);
    // A kind and its number are data: the page's language leaves them as they are.
    const other = await bootPage({ search: '?locale=qps-ploc' });
    other.env.bus.emit('creature:gap', { key: 'k', gap: 'species:civet' });
    other.openSettings();
    expect([...other.panel().querySelectorAll('[data-set="status"] [data-gap-kind]')].map((v) => v.closest('.row')!.textContent)).toEqual([`${pseudoLocalize('Missing creature art')}species1`]);
  });
});
