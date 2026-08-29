import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const mainSource = (): string => readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);

function functionSlice(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const nextCache = source.indexOf('\nlet _', start + 1);
  const nextConst = source.indexOf('\nconst _', start + 1);
  const candidates = [nextCache, nextConst].filter((index) => index > start);
  const end = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}

function hasCompleteLocalPolish(source: string): boolean {
  const expected = new Map([
    ['fbdSpr', 'polishSystemCanvasV1(cv)'],
    ['coronaSpr', 'polishSystemCanvasV1(cv)'],
    ['webBlobSpr', 'polishGalaxyCanvasV1(cv)'],
    ['fogBlobSpr', 'polishGalaxyCanvasV1(cv)'],
    ['obsRingSpr', 'polishGalaxyCanvasV1(cv)'],
    ['radioLobesSpr', 'polishGalaxyCanvasV1(cv)'],
    ['cometTailSpr', 'polishSystemCanvasV1(cv)'],
  ]);
  return [...expected].every(([name, token]) => functionSlice(source, name).includes(token));
}

describe('slice-local universe polish wiring', () => {
  it('finishes every decorative local space canvas through the shared scope owner', () => {
    const source = mainSource();
    expect(hasCompleteLocalPolish(source)).toBe(true);
    for (const token of [
      'polishSystemCanvasV1(cv)',
      'polishGalaxyCanvasV1(cv)',
    ]) {
      expect(hasCompleteLocalPolish(source.replace(token, 'cv')), token).toBe(false);
    }
  });

  it('keeps identity-black and gameplay-mask canvases as explicit raw exceptions', () => {
    const source = mainSource();
    for (const name of ['bhDiscSpr', 'moonTermSpr', 'terminatorSpr', 'veilSpr']) {
      expect(functionSlice(source, name), name).not.toMatch(/polish(?:Galaxy|System)CanvasV1/u);
    }
    expect(functionSlice(source, 'bhDiscSpr')).toContain("bh.addColorStop(0, 'rgba(0,0,0,1)'");
    expect(functionSlice(source, 'veilSpr')).toContain('reach-denial mask');
  });
});
