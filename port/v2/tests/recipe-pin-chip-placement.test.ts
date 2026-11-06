/** FINISH F5 (Slice "ARC 3 OWNED BIOME SURVEY DOCK REOPEN", 2026-11-04): a pinned recipe's chip covered the left rail's first button
 * (Survey) because it was fixed at the rail's own top-left corner. Outcome: the chip sits below the rail's measured bottom; control:
 * without a measurable rail it keeps its stylesheet position (no inline top). */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { RecipePinChipV1 } from '../apps/game/src/recipe-pin.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const model = { baseId: 'jumpdrive', text: '📌 Jump Drive — need 2 Iron', ready: false } as never;
describe('recipe pin chip placement', () => {
  it('sits 8px below the left rail, never over its buttons; without a measurable rail it keeps the stylesheet position', () => {
    const dom = new JSDOM('<!doctype html><body><div id="raillft"><button id="docksurvey">Survey</button></div></body>'), doc = dom.window.document;
    const rail = doc.getElementById('raillft')!;
    rail.getBoundingClientRect = () => ({ top: 150, bottom: 294, left: 8, right: 120, width: 112, height: 144, x: 8, y: 150, toJSON() { return {}; } }) as DOMRect;
    new RecipePinChipV1(doc, () => {}).render(model);
    const chip = doc.getElementById('pinchip') as HTMLButtonElement;
    expect(chip.hidden).toBe(false); expect(chip.style.top).toBe('302px'); expect(Number.parseFloat(chip.style.top)).toBeGreaterThan(294);
    const bare = new JSDOM('<!doctype html><body></body>').window.document; new RecipePinChipV1(bare, () => {}).render(model);
    expect((bare.getElementById('pinchip') as HTMLButtonElement).style.top).toBe('');
  });
});
