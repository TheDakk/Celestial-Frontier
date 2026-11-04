/* K24: `--ui` must exist on :root before main.ts evaluates, or the first paint
   uses the serif fallback until the generated sheet arrives. The inline value
   and the token owner must agree byte for byte after whitespace folding. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UI_PRESENTATION_CSS } from '../apps/game/src/ui-presentation-tokens.js';

const INDEX_HTML = readFileSync(new URL('../apps/game/index.html', import.meta.url), 'utf8');

function rootUiToken(css: string, label: string): string {
  const root = /:root\s*\{([^}]*)\}/u.exec(css);
  if (!root) throw new Error(`${label}: no :root block`);
  const matches = [...root[1]!.matchAll(/--ui\s*:\s*([^;]+);/gu)];
  if (matches.length !== 1) throw new Error(`${label}: expected exactly one --ui declaration, found ${matches.length}`);
  return matches[0]![1]!.replace(/\s+/gu, '');
}

describe('boot font token', () => {
  it('declares --ui inline on :root with the token owner value', () => {
    const inlineStyle = /<style>([\s\S]*?)<\/style>/u.exec(INDEX_HTML)?.[1];
    if (!inlineStyle) throw new Error('index.html has no inline <style>');
    expect(rootUiToken(inlineStyle, 'index.html')).toBe('Inter,system-ui,-apple-system,sans-serif');
    expect(rootUiToken(UI_PRESENTATION_CSS, 'ui-presentation-tokens')).toBe(rootUiToken(inlineStyle, 'index.html'));
    // Negative controls: the comparator sees a missing token and a drifted value.
    expect(() => rootUiToken(inlineStyle.replace(/--ui\s*:[^;]+;/u, ''), 'mutant')).toThrow('exactly one --ui');
    expect(rootUiToken(inlineStyle.replace('Inter,', 'Georgia,'), 'mutant')).not.toBe(rootUiToken(UI_PRESENTATION_CSS, 'tokens'));
  });
});
