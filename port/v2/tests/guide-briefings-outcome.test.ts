import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import * as guide from '../apps/game/src/guide-content.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string) => { window: Window & typeof globalThis };
};
const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
function section(start: string, end: string): string {
  expect(main.split(start)).toHaveLength(2);
  const at = main.indexOf(start), stop = main.indexOf(end, at);
  expect(stop).toBeGreaterThan(at);
  return main.slice(at, stop);
}
function replaceOnce(source: string, old: string, replacement: string): string {
  expect(source.split(old)).toHaveLength(2);
  return source.replace(old, replacement);
}
const owner = section('function guideBodyEl()', 'function requestReleaseContent(')
  + section('function guideTopicRow(', 'function renderGuideSearch(')
  + section('function fillGuide()', '\n/* ---- COMPENDIUM');

function harness(mutate: (source: string) => string = x => x) {
  const dom = new JSDOM('<div id="guidepanel"></div>'), document = dom.window.document;
  const save = { seenGuide: true, rnSeen: null, balance: 123, activePlayMs: 1000 };
  const persist = vi.fn(), before = JSON.stringify(save);
  const globals = {
    document, queueMicrotask, save, guideContentModule: guide, guideCatalogue: null,
    guideViewRequest: 0, openPanelId: () => 'guide', loadGuideContent: async () => guide,
    esc: (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    fillPanel: (_id: string, html: string) => { document.getElementById('guidepanel')!.innerHTML = html; },
    guideBuildIdentity: () => '', blockPlayerMutation: () => false, persistView: persist,
    renderGuideSearch: vi.fn(), renderRelease: vi.fn(), renderReleaseHistory: vi.fn(),
  };
  const transformed = transformSync('main-guide.ts', mutate(owner));
  if (transformed.errors.length) throw new Error(JSON.stringify(transformed.errors));
  Function(...Object.keys(globals), transformed.code + '\nfillGuide();')(...Object.values(globals));
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  const click = async (selector: string) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    expect(button, selector).not.toBeNull();
    button!.click(); await flush();
  };
  return { document, save, persist, before, flush, click, close: () => dom.window.close() };
}

describe('D19 Main Guide briefing outcomes', () => {
  it('opens from the real toolbar, traverses five pages, returns and finishes without expedition writes', async () => {
    const h = harness();
    try {
      await h.flush();
      await h.click('[data-guide-briefing="0"]');
      for (let i = 0; i < guide.V2_ADVANCED_BRIEFINGS.length; i++) {
        const row = guide.V2_ADVANCED_BRIEFINGS[i]!;
        expect(h.document.querySelector('[data-guide-briefing-page]')?.getAttribute('data-guide-briefing-page')).toBe(row.id);
        expect(h.document.activeElement?.textContent).toContain(row.title);
        if (i > 0) {
          await h.click(`[data-guide-briefing="${i - 1}"]`);
          expect(h.document.querySelector('[data-guide-briefing-page]')?.getAttribute('data-guide-briefing-page')).toBe(guide.V2_ADVANCED_BRIEFINGS[i - 1]!.id);
          await h.click(`[data-guide-briefing="${i}"]`);
        }
        if (i < 4) await h.click(`[data-guide-briefing="${i + 1}"]`);
      }
      await h.click('button[data-guide-home]:last-child');
      expect(h.document.querySelectorAll('[data-guide-category]')).toHaveLength(9);
      expect(JSON.stringify(h.save)).toBe(h.before); expect(h.persist).not.toHaveBeenCalled();
    } finally { h.close(); }
  });

  it('every cross-link is a native button that opens the named current topic', async () => {
    const h = harness();
    try {
      await h.flush();
      for (const [index, row] of guide.V2_ADVANCED_BRIEFINGS.entries()) {
        for (const match of row.body.matchAll(/data-gt="([^"]+)"/g)) {
          await h.click('[data-guide-briefing="0"]');
          for (let page = 1; page <= index; page++) await h.click(`[data-guide-briefing="${page}"]`);
          const id = match[1]!;
          expect(h.document.querySelector(`[data-gt="${id}"]`)?.tagName).toBe('BUTTON');
          await h.click(`[data-gt="${id}"]`);
          expect(h.document.querySelector('[data-guide-heading]')?.textContent).toContain(guide.getGuideTopic(id as guide.GuideTopicId)!.title);
        }
      }
      expect(JSON.stringify(h.save)).toBe(h.before); expect(h.persist).not.toHaveBeenCalled();
    } finally { h.close(); }
  });

  it.each([
    ['disconnected start', 'renderGuideBriefing(Number(briefing))', 'void 0'],
    ['stuck next page', 'renderGuideBriefing(Number(briefing))', 'renderGuideBriefing(0)'],
    ['missing cross-link routing', 'else if (topic) renderGuideTopic(topic, true);', 'else if (topic) void 0;'],
  ])('negative control catches %s and the restored route works', async (_label, old, replacement) => {
    async function outcome(mutant: boolean) {
      const h = harness(source => mutant ? replaceOnce(source, old!, replacement!) : source);
      try {
        await h.flush(); await h.click('[data-guide-briefing="0"]');
        if (_label === 'missing cross-link routing') {
          await h.click('[data-gt="landing"]');
          return !h.document.querySelector('[data-guide-briefing-page]');
        }
        if (_label === 'stuck next page') await h.click('[data-guide-briefing="1"]');
        return h.document.querySelector('[data-guide-briefing-page]')?.getAttribute('data-guide-briefing-page') === guide.V2_ADVANCED_BRIEFINGS[_label === 'stuck next page' ? 1 : 0]!.id;
      } finally { h.close(); }
    }
    expect(await outcome(true)).toBe(false); expect(await outcome(false)).toBe(true);
  });

  it('refuses an out-of-range page without changing the current page', async () => {
    const h = harness();
    try {
      await h.flush(); await h.click('[data-guide-briefing="0"]');
      const before = h.document.querySelector('[data-sel="guide-body"]')!.innerHTML;
      h.document.querySelector('[data-guide-briefing="1"]')!.setAttribute('data-guide-briefing', '9999');
      await h.click('[data-guide-briefing="9999"]');
      expect(h.document.querySelector('[data-guide-briefing-page]')?.getAttribute('data-guide-briefing-page')).toBe('reach');
      expect(h.document.querySelector('[data-sel="guide-body"]')!.innerHTML.replace('9999', '1')).toBe(before);
    } finally { h.close(); }
  });
});
