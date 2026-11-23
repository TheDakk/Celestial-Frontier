// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountScrollCue } from '../src/ui';
import { checkScrollCues } from '../src/layoutcheck/check';

/** A scroll area whose window is `window` pixels high over content `content` pixels high: jsdom lays nothing out. */
function area(window: number, content: number): { el: HTMLElement; setContent(height: number): void; setWindow(height: number): void } {
  const el = document.createElement('div');
  let [win, all] = [window, content];
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => win });
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => Math.max(all, win) });
  document.body.append(el);
  return { el, setContent(height) { all = height; }, setWindow(height) { win = height; } };
}
const cued = (el: HTMLElement): boolean => el.hasAttribute('data-more-below');
/** Lets the observer of the page's changes run. */
const settled = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('the cue that a sheet scrolls', () => {
  it('is shown while content lies below the foot of the sheet, and goes when the foot of the content is reached', () => {
    const { el } = area(300, 1000);
    mountScrollCue(el);
    expect(cued(el)).toBe(true);
    el.scrollTop = 350;
    el.dispatchEvent(new Event('scroll'));
    expect(cued(el)).toBe(true);
    el.scrollTop = 700;
    el.dispatchEvent(new Event('scroll'));
    expect(cued(el)).toBe(false);
    // Within a pixel of the foot is the foot: a device may stop a fraction short.
    el.scrollTop = 699.4;
    el.dispatchEvent(new Event('scroll'));
    expect(cued(el)).toBe(false);
    el.scrollTop = 0;
    el.dispatchEvent(new Event('scroll'));
    expect(cued(el)).toBe(true);
  });

  it('is not shown on a sheet whose content fits', () => {
    const { el } = area(300, 300);
    mountScrollCue(el);
    expect(cued(el)).toBe(false);
  });

  it('follows the content as it is drawn again, the sheet as it is shown, and the view as it changes size', async () => {
    const { el, setContent, setWindow } = area(300, 200);
    mountScrollCue(el);
    expect(cued(el)).toBe(false);
    setContent(900);
    el.append(document.createElement('p'));
    await settled();
    expect(cued(el)).toBe(true);
    setContent(100);
    el.replaceChildren();
    await settled();
    expect(cued(el)).toBe(false);
    // Shown again by its style, as a panel is, with more to show.
    setContent(900);
    el.style.display = 'block';
    await settled();
    expect(cued(el)).toBe(true);
    setWindow(900);
    window.dispatchEvent(new Event('resize'));
    expect(cued(el)).toBe(false);
  });

  it('stops following once it is given up', async () => {
    const { el, setContent } = area(300, 200);
    const stop = mountScrollCue(el);
    stop();
    setContent(900);
    el.append(document.createElement('p'));
    el.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    await settled();
    expect(cued(el)).toBe(false);
  });
});

describe('the layout check on scroll areas', () => {
  const lines = (areas: Parameters<typeof checkScrollCues>[0]): string[] => checkScrollCues(areas).map((p) => `${p.kind}: ${p.ids.join(' + ')} — ${p.detail}`);
  it('a scroll area with 40 px of content below its foot and no cue is reported; with the cue it is not', () => {
    expect(lines([{ id: 'panel', below: 40, cue: false }])).toEqual(['scroll-cue: panel — 40 px of content lies below its foot and nothing shows that it scrolls']);
    expect(lines([{ id: 'panel', below: 40, cue: true }])).toEqual([]);
  });
  it('a cue on a scroll area with nothing below is reported; a pixel of rounding is nothing', () => {
    expect(lines([{ id: 'panel', below: 0, cue: true }])).toEqual(['scroll-cue: panel — it shows that it scrolls with nothing below its foot']);
    expect(lines([{ id: 'a', below: 1, cue: false }, { id: 'b', below: 0.5, cue: false }])).toEqual([]);
  });
});
