import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: unknown) => { window: Window & { Event: typeof Event } };
};
import { describe, expect, it, vi } from 'vitest';
import { mountPilotPortrait, installPilotStyle, createPilotVista } from '../apps/game/src/pilot-components.js';
import { PILOT_TOKENS } from '../apps/game/src/pilot-tokens.js';
import { PILOT_SPECIMENS_V1 } from '../apps/game/src/pilot-specimens.js';
import type { SpeciesArtLoader } from '../apps/game/src/species-art-loader.js';

class Media extends EventTarget { matches = false; }
class Element extends EventTarget {
  className = ''; textContent = ''; src = ''; alt = ''; width = 0; height = 0;
  readonly dataset: Record<string, string> = {}; readonly attributes: Record<string, string> = {};
  readonly style = { opacity: '', animation: '', transform: '', filter: '' };
  readonly children: Element[] = []; parent: Element | null = null; connected = false;
  constructor(readonly ownerDocument: Doc, readonly tagName: string) { super(); }
  get isConnected(): boolean { return this.connected || this.parent?.isConnected === true; }
  append(...nodes: Element[]): void { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  remove(): void { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  setAttribute(key: string, value: string): void { this.attributes[key] = value; }
}
class Doc extends EventTarget {
  visibilityState = 'visible'; readonly media = new Media();
  readonly defaultView = { matchMedia: () => this.media }; readonly head = new Element(this, 'head');
  createElement(tag: string): Element { return new Element(this, tag); }
}
function fixture() {
  const document = new Doc(); const mount = new Element(document, 'section'); mount.connected = true;
  let publish!: (asset: { key: string; url: string } | null, error?: unknown) => void;
  const release = vi.fn(); const unsubscribe = vi.fn(); const cancel = vi.fn();
  const thumb = vi.fn(() => ({ current: null, release, subscribe: (callback: typeof publish) => { publish = callback; return unsubscribe; } }));
  const portrait = vi.fn((_id, _genome, callback: typeof publish) => { publish = callback; return { current: null, cancel }; });
  const loader = { leaseThumb: thumb, requestPortrait: portrait } as unknown as SpeciesArtLoader;
  return { document, mount, loader, thumb, portrait, release, unsubscribe, cancel,
    publish: (asset: Parameters<typeof publish>[0], error?: unknown) => publish(asset, error),
    image: () => mount.children[0]!.children[0]!, accent: () => mount.children[0]!.children[1]! };
}
const specimen = PILOT_SPECIMENS_V1[2]!;

describe('selected canonical portrait mounts', () => {
  it.each([132, 300, 440] as const)('uses the exact broker identity and honest native/display size at %i', (size) => {
    const f = fixture(); const before = JSON.stringify(specimen.genome);
    const dispose = mountPilotPortrait(f.loader, f.mount as unknown as HTMLElement, specimen, size, true);
    expect(f.image()).toMatchObject({ width: size, height: size, src: '', dataset: { visualKey: specimen.visualKey, pilotPortrait: 'loading' } });
    if (size === 132) { expect(f.thumb).toHaveBeenCalledExactlyOnceWith(specimen.genome); expect(f.portrait).not.toHaveBeenCalled(); }
    else { expect(f.portrait.mock.calls[0]![1]).toBe(specimen.genome); expect(f.thumb).not.toHaveBeenCalled(); }
    f.publish({ key: specimen.visualKey, url: 'blob:canonical-pixels' });
    expect(f.image().dataset.pilotPortrait).toBe('loading'); f.image().dispatchEvent(new Event('load'));
    expect(f.image().dataset.pilotPortrait).toBe('ready');
    expect(f.mount.children[1]!.textContent).toContain(size === 300 ? 'unchanged 440 px' : `${size} px native`);
    expect(f.mount.children[1]!.textContent).toContain('Anatomical animation incomplete');
    expect(f.image().style.transform).toBe(''); expect(f.image().style.filter).toBe('');
    expect(f.accent().attributes['aria-hidden']).toBe('true');
    expect(f.mount.children[0]!.dataset.pilotAnatomy).toBe('static-fallback-incomplete');
    expect(JSON.stringify(specimen.genome)).toBe(before);
    const image = f.image(); dispose(); dispose();
    expect(f.mount.children).toHaveLength(0);
    expect(size === 132 ? f.release : f.cancel).toHaveBeenCalledTimes(1);
    if (size === 132) expect(f.unsubscribe).toHaveBeenCalledTimes(1);
    f.publish({ key: specimen.visualKey, url: 'blob:late' }); expect(image.src).toBe('blob:canonical-pixels');
  });
  it('marks wrong identity and failed native image decoding incomplete', () => {
    const f = fixture(); const dispose = mountPilotPortrait(f.loader, f.mount as unknown as HTMLElement, specimen, 132, false);
    f.publish({ key: 'wrong-full-genome-key', url: 'blob:wrong' });
    expect(f.image().src).toBe(''); expect(f.image().dataset.pilotPortrait).toBe('error');
    f.publish({ key: specimen.visualKey, url: 'blob:correct' }); f.image().dispatchEvent(new Event('error'));
    expect(f.image().dataset.pilotPortrait).toBe('error'); expect(f.mount.children[1]!.textContent).toContain('incomplete');
    dispose();
  });
  it('animates only a CSS marker on low tier, then stops it for motion/effects/visibility policy', () => {
    const f = fixture(); const presentation = { effectsOn: true, motion: 'full' as const, deviceTier: 'low' as const };
    const dispose = mountPilotPortrait(f.loader, f.mount as unknown as HTMLElement, specimen, 300, true, presentation);
    expect(f.accent().style.animation).toBe('cf-pilot-portrait-accent 12s linear infinite');
    f.document.media.matches = true; f.document.media.dispatchEvent(new Event('change'));
    expect(f.accent().style.animation).toBe('none'); expect(f.accent().style.opacity).toBe('0.3');
    f.document.media.matches = false; f.document.media.dispatchEvent(new Event('change'));
    expect(f.accent().style.animation).toContain('infinite');
    f.document.visibilityState = 'hidden'; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(f.accent().style.animation).toBe('none'); expect(f.accent().style.opacity).toBe('0');
    f.document.visibilityState = 'visible'; presentation.effectsOn = false; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(f.accent().style.animation).toBe('none'); expect(f.accent().style.opacity).toBe('0');
    const accent = f.accent(); dispose(); presentation.effectsOn = true; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(accent.style.animation).toBe('none');
  });
  it('has no frame loop, and style installation supplies an outside-only decorative marker', () => {
    const f = fixture(); const remove = installPilotStyle(f.document as unknown as Document);
    const css = f.document.head.children[0]!.textContent;
    expect(css).toContain('.p-portrait-accent'); expect(css).toContain('right:-10px;top:-10px');
    expect(css).toContain('width:7px;height:7px'); remove(); expect(f.document.head.children).toHaveLength(0);
    const code = readFileSync(new URL('../apps/game/src/pilot-components.ts', import.meta.url), 'utf8');
    expect(code).not.toMatch(/requestAnimationFrame|cancelAnimationFrame|performance\.now|setInterval/);
    expect(code).not.toMatch(/image\.style\.(?:transform|filter|opacity)|drawImage|renderSpecies/);
  });
});


describe('compact pilot direction review', () => {
  it('keeps scene layers decorative under one named image and uses shared compact typography', () => {
    const f = fixture();
    const scene = createPilotVista(f.document as unknown as Document,
      ['local-far.webp', 'local-middle.webp', 'local-near.webp']) as unknown as Element;
    expect(scene.attributes.role).toBe('img');
    expect(scene.attributes['aria-label']).toContain('temperate woodland');
    expect(scene.children.map((image) => image.dataset.depth)).toEqual(['far', 'middle', 'near']);
    for (const image of scene.children) {
      expect(image.alt).toBe('');
      expect(image.attributes['aria-hidden']).toBe('true');
      expect(image.attributes.draggable).toBe('false');
    }
    expect(PILOT_TOKENS.fontBody).toBe(PILOT_TOKENS.fontDisplay);
    expect(PILOT_TOKENS.fontBody).toMatch(/^Inter, system-ui,/u);
    expect(PILOT_TOKENS.fontSize).toEqual({ caption: 12, body: 14, section: 16, title: 22 });
    expect(PILOT_TOKENS.fontWeight).toEqual({ regular: 400, medium: 500, heading: 600 });
    expect(PILOT_TOKENS.radius).toBe(8);
  });

  it('builds the actual Earth-first study with honest version/listening links, full family selectors and native disclosures', async () => {
    const dom = new JSDOM('<!doctype html><html><head></head><body><main id="pilot-review"></main></body></html>',
      { url: 'https://example.invalid/audiovisual-pilot.html', pretendToBeVisual: true });
    const play = vi.fn(async () => true);
    const disposeLoader = vi.fn();
    vi.doMock('../apps/game/src/species-art-loader.js', () => ({
      SpeciesArtLoader: class { activate(): void {} dispose(): void { disposeLoader(); } },
    }));
    vi.doMock('../apps/game/src/tame-greeting-audio.js', () => ({
      createTameGreetingAudioOwner: () => ({
        armNativePilotGesture: vi.fn(() => true), setHidden: vi.fn(), dispose: vi.fn(async () => {}),
      }),
    }));
    vi.doMock('../apps/game/src/pilot-sound-player.js', () => ({
      PilotSoundPlayer: class { play = play; stop(): void {} dispose(): void {} },
    }));
    vi.stubGlobal('document', dom.window.document);
    vi.stubGlobal('addEventListener', dom.window.addEventListener.bind(dom.window));
    // Deferred art remains covered by the existing broker/portrait/vista tests;
    // this assertion uses the actual shipped study builder, without a worker or device.
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    try {
      await import('../apps/game/src/pilot-review.js');
      const document = dom.window.document;
      expect(document.querySelector('h1')!.textContent).toBe('Audiovisual pilot');
      expect([...document.querySelectorAll('#pilot-review>section')].slice(0, 2).map((node) => node.id))
        .toEqual(['pilot-earth', 'pilot-ship']);
      expect([...document.querySelectorAll('header nav a')].map((node) =>
        [node.textContent, node.getAttribute('href')])).toEqual([
        ['Open playable pilot', './?avpilot=1'],
        ['Current v2 · without pilot', './'],
        ['Production v1.8.9', 'https://celestialfrontier.github.io/'],
      ]);
      expect(document.querySelectorAll('#pilot-earth canvas')).toHaveLength(2);
      expect(document.querySelector('[data-pilot-study-vista="candidate"] img')).not.toBeNull();
      const family = document.querySelector<HTMLSelectElement>('select[aria-label="Body plan specimen"]')!;
      expect([...family.options].map((option) => option.value))
        .toEqual(PILOT_SPECIMENS_V1.map((row) => row.id));
      expect(family.options).toHaveLength(8);
      expect([...document.querySelector<HTMLSelectElement>('select[aria-label="Actual portrait size"]')!.options]
        .map((option) => option.value)).toEqual(['132', '300', '440']);
      expect(document.querySelector('#pilot-specimens .p-rule')!.textContent)
        .toContain('Anatomical animation remains incomplete');
      expect(document.querySelector('#pilot-specimens [role=region]')!.getAttribute('tabindex')).toBe('0');
      expect(document.querySelectorAll('button[data-pilot-cue]')).toHaveLength(8);
      expect(document.querySelector('#pilot-audio')!.textContent).toContain('Match the listening level manually');
      expect(document.querySelector('#pilot-audio')!.textContent).toContain('Play music + woodland');
      expect(document.querySelector('#pilot-audio')!.textContent).not.toContain('Play complete scene');
      const cue = document.querySelector<HTMLButtonElement>('button[data-pilot-cue]')!;
      cue.click(); expect(play).not.toHaveBeenCalled();
      expect(dom.window.getComputedStyle(cue).minHeight).toBe('44px');
      expect(dom.window.getComputedStyle(cue).borderRadius).toBe('6px');
      expect(dom.window.getComputedStyle(document.querySelector('h1')!).fontSize).toBe('22px');
      for (const code of document.querySelectorAll('.p-code')) expect(code.closest('details')).not.toBeNull();
      const disclosures = document.querySelectorAll<HTMLDetailsElement>('details');
      expect(disclosures).toHaveLength(4);
      for (const disclosure of disclosures) {
        expect(disclosure.open).toBe(false);
        const summary = disclosure.querySelector('summary')!;
        expect(dom.window.getComputedStyle(summary).minHeight).toBe('44px');
      }
      expect(document.querySelector('#pilot-provenance')!.textContent).toContain('Phase 2 top bar, dock and rails still wait for approval');
      dom.window.dispatchEvent(new dom.window.Event('pagehide'));
      expect(disposeLoader).toHaveBeenCalledOnce();
    } finally {
      dom.window.close();
      vi.unstubAllGlobals();
      vi.doUnmock('../apps/game/src/species-art-loader.js');
      vi.doUnmock('../apps/game/src/tame-greeting-audio.js');
      vi.doUnmock('../apps/game/src/pilot-sound-player.js');
      vi.resetModules();
    }
  });
});
