import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { earthLayeredMountLayoutV1 } from '../apps/game/src/earth-layered-layout.js';

const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const start = 'function currentEarthLayeredLayout(imageWidth = 960, imageHeight = 430):';
const end = '\n/** Each optional painting';
if (main.split(start).length !== 2 || main.split(end).length !== 2) throw new Error('Earth layout owner boundaries changed');
const owner = main.slice(main.indexOf(start), main.indexOf(end, main.indexOf(start)));
const rectangle = (left: number, top: number, width: number, height: number) =>
  ({ left, top, right: left + width, bottom: top + height, width, height });
function fixture(options: { side?: 'visible' | 'hidden' | 'absent'; dock?: boolean;
  canvasWidth?: number; retired?: boolean } = {}, source = owner) {
  const canvasRect = rectangle(0, 10, options.canvasWidth ?? 390, 422);
  const side = { getBoundingClientRect: () => rectangle(0, 320, 390, 80) };
  const chrome = Object.freeze({ upper: Object.freeze([rectangle(0, 40, 390, 50), rectangle(0, 100, 390, 20)]),
    dock: options.dock === false ? null : rectangle(0, 390, 390, 44) });
  const getElementById = vi.fn((id: string) => {
    if (id !== 'planetside') throw new Error('Main queried chrome DOM: ' + id);
    return options.side === 'absent' ? null : side;
  });
  const context = {
    app: { canvas: { getBoundingClientRect: () => canvasRect }, screen: { width: 390, height: 844 } },
    appChrome: { surfaceLayoutRects: vi.fn(() => options.retired ? null : chrome) },
    document: { getElementById },
    getComputedStyle: () => ({ display: options.side === 'hidden' ? 'none' : 'block', visibility: 'visible', opacity: '1' }),
    earthLayeredMountLayoutV1,
  };
  const compiled = transformSync('actual-earth-chrome-layout.ts', source);
  if (compiled.errors.length) throw new Error(JSON.stringify(compiled.errors));
  const measure = runInNewContext(compiled.code + '\ncurrentEarthLayeredLayout;', context) as (imageWidth?: number, imageHeight?: number) => ReturnType<typeof earthLayeredMountLayoutV1>;
  return { measure, context, canvasRect };
}
function acceptLayout(actual: ReturnType<typeof earthLayeredMountLayoutV1>, centerY: number): void {
  const scale = 366 / 960, width = 366, height = 430 * scale;
  expect(actual).toEqual({ left: 12, top: centerY - height / 2, width, height, centerX: 195, centerY, scale });
}

describe('Main Earth composition uses detached chrome geometry', () => {
  it('preserves scaled canvas-relative placement and visible Planetside precedence', () => {
    const f = fixture(); acceptLayout(f.measure(), 420);
    expect(f.context.document.getElementById).toHaveBeenCalledOnce();
    expect(f.context.document.getElementById).toHaveBeenCalledWith('planetside');
    expect(f.context.appChrome.surfaceLayoutRects).toHaveBeenCalledOnce();
  });
  it.each(['hidden', 'absent'] as const)('uses dock then canvas fallback when Planetside is %s', side => {
    acceptLayout(fixture({ side }).measure(), 490);
    acceptLayout(fixture({ side, dock: false }).measure(), 532);
  });
  it('contains the complete native AI original inside the same chrome boundaries', () => {
    const f = fixture(), original = f.measure(1024, 576)!;
    expect(original.width / original.height).toBeCloseTo(1024 / 576, 12);
    expect(original.centerY).toBe(420); expect(original.left).toBe(12);
    expect(original.width).toBe(366); expect(original.height).toBe(205.875);
    expect(f.measure(0, 576)).toBeNull(); expect(f.measure(1024, Infinity)).toBeNull();
    expect(f.measure(8193, 576)).toBeNull();
  });
  it('keeps invalid canvas and retired chrome geometry unavailable', () => {
    const invalid = fixture({ canvasWidth: 0 }); expect(invalid.measure()).toBeNull();
    expect(invalid.context.appChrome.surfaceLayoutRects).not.toHaveBeenCalled();
    expect(fixture({ retired: true }).measure()).toBeNull();
  });
  it('rejects lost scaling and reversed lower-bound precedence through the same layout outcome', () => {
    for (const [needle, replacement] of [
      ['const scaleY = app.screen.height / canvas.height;', 'const scaleY = 1;'],
      ["visibleRect(document.getElementById('planetside')) ?? chrome.dock", "chrome.dock ?? visibleRect(document.getElementById('planetside'))"],
    ] as const) {
      expect(owner.split(needle)).toHaveLength(2);
      expect(() => acceptLayout(fixture({}, owner.replace(needle, replacement)).measure(), 420)).toThrow();
      acceptLayout(fixture().measure(), 420);
    }
  });
});
