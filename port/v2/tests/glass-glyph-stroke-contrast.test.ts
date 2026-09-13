import { describe, expect, it } from 'vitest';
import { assessGlyphStrokeContrast, type GlyphStrokeContrastInput } from '../tools/glass-glyph-stroke-contrast.mjs';

const white = [255, 255, 255, 1];
const black = [0, 0, 0, 1];
const baseline: GlyphStrokeContrastInput = {
  foreground: white, background: white, opacity: 1,
  strokeWidth: '2px', strokeColor: black, paintOrder: 'stroke fill',
};
const assess = (change: Partial<GlyphStrokeContrastInput> = {}) => assessGlyphStrokeContrast({ ...baseline, ...change });

// Execute the identical self-contained function that Glass injects into Chromium.
const browserAssessor = Function(`return (${assessGlyphStrokeContrast.toString()});`)() as typeof assessGlyphStrokeContrast;

describe('Glass opaque glyph stroke contrast', () => {
  it('admits a 1px outer black halo around white fill against bright artwork', () => {
    expect(assess()).toEqual({ eligible: true, reason: null, ratio: 21, fill: white, halo: black, outerWidth: 1 });
    expect(browserAssessor(baseline)).toEqual(assess());
    expect(assess({ paintOrder: 'stroke' })).toEqual(assess());
  });

  it('measures the inherited cyan keyword against the same opaque halo', () => {
    const cyan = assess({ foreground: [76, 220, 239, 1] });
    expect(cyan.eligible).toBe(true);
    expect(cyan.ratio).toBeGreaterThan(11);
  });

  it.each(['0px', '1px', '1.99px', '', '2', '2em', 'Infinitypx', '-2px'])('rejects unproved outer width %s', (strokeWidth) => {
    expect(assess({ strokeWidth })).toMatchObject({ eligible: false, ratio: null });
    expect(assess({ strokeWidth }).reason).toContain('1px outer halo');
  });

  it.each(['normal', 'fill stroke', 'fill', undefined])('rejects paint order %s that does not put the stroke behind fill', (paintOrder) => {
    expect(assess({ paintOrder })).toMatchObject({ eligible: false, ratio: null });
    expect(assess({ paintOrder }).reason).toContain('paint order');
  });

  it.each([{ strokeColor: [0, 0, 0, 0] }, { strokeColor: [0, 0, 0, .99] }, { strokeColor: [0, 0, 0] }, { strokeColor: [0, 0, 300, 1] }, { strokeColor: null }])('rejects unresolved or nonopaque stroke $strokeColor', ({ strokeColor }) => {
    expect(assess({ strokeColor })).toMatchObject({ eligible: false, ratio: null });
  });

  it('keeps a light opaque halo red at the unchanged small-text threshold', () => {
    const result = assess({ strokeColor: [238, 238, 238, 1] });
    expect(result.eligible).toBe(true);
    expect(result.ratio).toBeLessThan(4.5);
    expect(assess({ strokeColor: white }).ratio).toBe(1);
  });

  it('retains cumulative opacity instead of treating a dark stroke as an opacity exemption', () => {
    for (const opacity of [.15, .5, .5 * .5]) {
      const result = assess({ opacity });
      expect(result.fill).toEqual(white);
      expect(result.halo).toEqual([255 * (1 - opacity), 255 * (1 - opacity), 255 * (1 - opacity), 1]);
      expect(result.ratio).toBeLessThan(4.5);
      expect(browserAssessor({ ...baseline, opacity })).toEqual(result);
    }
  });

  it('completes translucent fill over the stroke before applying group opacity exactly once', () => {
    const result = assess({ foreground: [255, 255, 255, .5], opacity: .5 });
    expect(result.fill).toEqual([191.25, 191.25, 191.25, 1]);
    expect(result.halo).toEqual([127.5, 127.5, 127.5, 1]);
    expect(result.ratio).toBeLessThan(4.5);
    expect(assess({ foreground: [255, 255, 255, 0] }).ratio).toBe(1);
  });

  it('uses the original colored background for the complete glyph and halo', () => {
    const result = assess({ background: [80, 160, 240, 1], opacity: .5 });
    expect(result.fill).toEqual([167.5, 207.5, 247.5, 1]);
    expect(result.halo).toEqual([40, 80, 120, 1]);
  });

  it('fails closed on invalid opacity, fill, or unresolved original background', () => {
    for (const opacity of [-1, 1.01, NaN, Infinity, undefined]) expect(assess({ opacity }).eligible).toBe(false);
    expect(assess({ foreground: null }).eligible).toBe(false);
    expect(assess({ foreground: [255, 255, 255, NaN] }).eligible).toBe(false);
    expect(assess({ background: [255, 255, 255, .5] }).eligible).toBe(false);
  });

  it('does not mutate source colors when producing repeated browser observations', () => {
    const input = structuredClone(baseline);
    const prior = structuredClone(input);
    assessGlyphStrokeContrast(input);
    browserAssessor(input);
    expect(input).toEqual(prior);
  });
});
