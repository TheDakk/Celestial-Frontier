import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error The small browser observation owner is executable JavaScript.
import { developmentPreviewReadiness } from '../tools/devpreview-readiness.mjs';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const windows: Array<{ close(): void }> = [];
afterEach(() => { for (const window of windows.splice(0)) window.close(); });

function renderedPreview() {
  const { window } = new JSDOM('<!doctype html><html><head><meta name="cf-build-mode" content="distributable"></head><body><span id="playerchip">Explorer</span><div id="trail">Cosmos · Sol</div><canvas width="320" height="568"></canvas></body></html>');
  windows.push(window);
  window.__CF_DEV_PREVIEW__ = { sourceCommit: 'a'.repeat(40) };
  window.HTMLElement.prototype.getClientRects = function () {
    return this.hidden || this.style.display === 'none' ? [] : [{ width: 320, height: 44 }];
  };
  return window;
}

describe('distributable preview readiness', () => {
  it('uses rendered product fields and serializes without importing diagnostic state', () => {
    const window = renderedPreview();
    const read = new Function('document', 'window', `return (${developmentPreviewReadiness.toString()})(document,window);`);
    expect(read(window.document, window)).toMatchObject({
      ready: true, distributable: true, harnessAbsent: true, trail: 'Cosmos · Sol',
    });
  });

  it('rejects static or hidden UI, evidence builds, and a leaked diagnostic API', () => {
    const mutations = [
      (w: any) => { w.document.getElementById('trail').textContent = ''; },
      (w: any) => { w.document.getElementById('playerchip').textContent = ''; },
      (w: any) => { w.document.getElementById('trail').hidden = true; },
      (w: any) => { w.document.querySelector('canvas').width = 1; },
      (w: any) => { w.document.querySelector('canvas').style.visibility = 'hidden'; },
      (w: any) => { w.document.querySelector('meta').content = 'evidence'; },
      (w: any) => { w.document.querySelector('meta').remove(); },
      (w: any) => { w.document.head.append(w.document.querySelector('meta').cloneNode()); },
      (w: any) => { w.__CF_SLICE__ = undefined; },
      (w: any) => { delete w.__CF_DEV_PREVIEW__; },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const window = renderedPreview();
      mutate(window);
      expect(developmentPreviewReadiness(window.document, window).ready, `mutation ${index}`).toBe(false);
    }
  });

  it('recognizes rendered but inert Training background without claiming it can be activated', () => {
    const window = renderedPreview();
    window.document.body.classList.add('training');
    for (const element of window.document.querySelectorAll('canvas,#trail,#playerchip')) element.setAttribute('inert', '');
    expect(developmentPreviewReadiness(window.document, window)).toMatchObject({
      ready: true, training: true, canvasReady: true, renderedUi: true,
    });
  });

  it.each([
    ['canvas', 'opacity', '0'],
    ['#playerchip', 'opacity', '0'],
    ['#trail', 'filter', 'opacity(0)'],
    ['body', 'display', 'none'],
    ['body', 'visibility', 'hidden'],
    ['body', 'visibility', 'collapse'],
    ['body', 'opacity', '0'],
    ['html', 'opacity', '0'],
    ['body', 'filter', 'blur(0px) opacity(0%)'],
    ['html', 'filter', 'opacity(50%) opacity(0e0)'],
  ])('rejects non-painted %s with %s:%s despite retained rectangles', (selector, property, value) => {
    const window = renderedPreview();
    window.document.querySelector(selector).style.setProperty(property, value);
    // The fixture intentionally retains descendant rects under ancestor CSS;
    // inspecting only the leaf's geometry must not satisfy this control.
    expect(developmentPreviewReadiness(window.document, window).ready).toBe(false);
  });

  it('accepts positive cumulative opacity and filter opacity on inert ancestors', () => {
    const window = renderedPreview();
    window.document.documentElement.style.opacity = '0.5';
    window.document.body.style.cssText = 'opacity:0.5;filter:opacity(50%) blur(0px) opacity(.5)';
    window.document.body.setAttribute('inert', '');
    window.document.querySelector('canvas').style.opacity = '0.5';
    expect(developmentPreviewReadiness(window.document, window)).toMatchObject({
      ready: true, canvasReady: true, renderedUi: true,
    });
  });
});
