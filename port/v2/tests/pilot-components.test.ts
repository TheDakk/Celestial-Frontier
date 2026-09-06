import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { mountPilotPortrait, installPilotStyle } from '../apps/game/src/pilot-components.js';
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
    expect(f.accent().attributes['aria-hidden']).toBe('true'); expect(JSON.stringify(specimen.genome)).toBe(before);
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
