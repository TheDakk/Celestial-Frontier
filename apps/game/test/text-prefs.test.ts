// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { SizeClass } from '../src/events';
import { applyDisplayScale, applyTextPrefs, applyTokens, displayScale, TEXT_SIZE_PX, textSizeOf, UI_TOKENS, type TextSize } from '../src/ui';

const SIZES: TextSize[] = ['', 'fs-lg', 'fs-xl'];
const CLASSES: SizeClass[] = ['compact', 'medium', 'wide'];
const prefs = (over: Partial<{ fsMode: string; toneMode: string; fontMode: string }> = {}) => ({ fsMode: '', toneMode: '', fontMode: '', ...over });
const vars = (root: HTMLElement, names: string[]): string[] => names.map((n) => root.style.getPropertyValue(n));

describe('text size', () => {
  it('the stored text size sets the root size to 13, 15 or 17 px; an unknown stored value gives 13', () => {
    const root = document.createElement('html');
    for (const [stored, px] of [['', '13px'], ['fs-lg', '15px'], ['fs-xl', '17px'], ['fs-huge', '13px'], ['FS-LG', '13px'], ['toString', '13px']] as const) {
      applyTextPrefs(root, prefs({ fsMode: stored }));
      expect([stored, root.style.fontSize]).toEqual([stored, px]);
    }
    expect(TEXT_SIZE_PX).toEqual({ '': 13, 'fs-lg': 15, 'fs-xl': 17 });
    expect(['', 'fs-lg', 'fs-xl', 'fs-huge', '__proto__'].map(textSizeOf)).toEqual(['', 'fs-lg', 'fs-xl', '', '']);
  });
  it('displayScale is a whole number for every size and size class', () => {
    for (const sizeClass of CLASSES) {
      const scales = SIZES.map((size) => displayScale(size, sizeClass));
      for (const scale of scales) expect([1, 2, 3, 4]).toContain(scale);
      // A larger text size never gives a smaller heading.
      expect([...scales].sort((a, b) => a - b)).toEqual(scales);
    }
    expect(displayScale('fs-xl', 'wide')).toBeGreaterThan(displayScale('', 'compact'));
  });
  it('applyDisplayScale gives the root the scale display text is shown at', () => {
    const root = document.createElement('html');
    applyDisplayScale(root, 'fs-xl', 'wide');
    expect(root.style.getPropertyValue('--display-scale')).toBe(String(displayScale('fs-xl', 'wide')));
    applyDisplayScale(root, '', 'compact');
    expect(root.style.getPropertyValue('--display-scale')).toBe(String(displayScale('', 'compact')));
  });
});

describe('text tone and font', () => {
  const TONE = ['--ink', '--dim', '--faint', '--emph'];
  it('the stored tone sets the four text colours; an unknown stored value gives the soft tone', () => {
    const root = document.createElement('html');
    applyTextPrefs(root, prefs());
    expect(vars(root, TONE)).toEqual(['#e9edff', '#b8c7df', '#91a8ca', 'inherit']);
    applyTextPrefs(root, prefs({ toneMode: 'tone-bright' }));
    expect(vars(root, TONE)).toEqual(['#fff', '#d8e3f2', '#b5c8e2', '#ffd96a']);
    applyTextPrefs(root, prefs({ toneMode: 'tone-max' }));
    expect(vars(root, TONE)).toEqual(['#fff', '#f0f4ff', '#d6e2f4', '#ffe08a']);
    applyTextPrefs(root, prefs({ toneMode: 'tone-neon' }));
    expect(vars(root, TONE)).toEqual(['#e9edff', '#b8c7df', '#91a8ca', 'inherit']);
  });
  it('reading text is Inter with the system font behind it; the stored font picks the system or the mono stack', () => {
    const root = document.createElement('html');
    applyTextPrefs(root, prefs());
    expect(root.style.getPropertyValue('--ui')).toBe('Inter, system-ui, -apple-system, sans-serif');
    applyTextPrefs(root, prefs({ fontMode: 'font-sys' }));
    expect(root.style.getPropertyValue('--ui')).toBe('system-ui, -apple-system, sans-serif');
    applyTextPrefs(root, prefs({ fontMode: 'font-mono' }));
    expect(root.style.getPropertyValue('--ui')).toBe('ui-monospace, "SF Mono", Menlo, Consolas, monospace');
    applyTextPrefs(root, prefs({ fontMode: 'font-comic' }));
    expect(root.style.getPropertyValue('--ui')).toBe('Inter, system-ui, -apple-system, sans-serif');
  });
});

describe('tokens', () => {
  it('every token becomes a --cf- variable on the root, and reading sizes are in rem of the 13 px root', () => {
    const root = document.createElement('html');
    applyTokens(root);
    for (const [name, value] of Object.entries(UI_TOKENS)) expect([name, root.style.getPropertyValue(`--cf-${name}`)]).toEqual([name, value]);
    expect(UI_TOKENS['space-2']).toBe('8px');
    expect(UI_TOKENS['color-danger']).toBe('#ff806f');
    expect(UI_TOKENS['type-body']).toBe('1rem');
    expect(parseFloat(UI_TOKENS['type-title']) * 13).toBeCloseTo(20, 10);
    for (const [name, value] of Object.entries(UI_TOKENS)) if (name.startsWith('type-')) expect(value).toMatch(/^[\d.]+rem$/);
  });
});
