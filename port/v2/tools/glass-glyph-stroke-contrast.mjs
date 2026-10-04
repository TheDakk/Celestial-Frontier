/** The centered stroke leaves at least one opaque pixel outside the fill.
 * This function is serialized into the native browser audit: keep it self-contained.
 * Blurred shadows and translucent, narrow, or fill-first strokes prove no backing.
 */
export function assessGlyphStrokeContrast({ foreground, background, opacity, strokeWidth, strokeColor, paintOrder }) {
  const rejected = (reason) => ({ eligible: false, reason, ratio: null, fill: null, halo: null, outerWidth: null });
  const validColor = (value) => Array.isArray(value) && value.length === 4
    && value.every((channel, index) => Number.isFinite(channel) && channel >= 0 && channel <= (index === 3 ? 1 : 255));
  const widthMatch = typeof strokeWidth === 'string' && /^(?:\d+(?:\.\d+)?|\.\d+)px$/.test(strokeWidth);
  const width = widthMatch ? Number.parseFloat(strokeWidth) : NaN;
  if (!Number.isFinite(width) || width < 2) return rejected('stroke must leave at least a 1px outer halo (computed width >= 2px)');
  if (typeof paintOrder !== 'string' || paintOrder.trim().split(/\s+/)[0] !== 'stroke')
    return rejected('computed paint order must begin with stroke');
  if (!validColor(strokeColor) || strokeColor[3] !== 1) return rejected('stroke must be a resolved opaque RGB color');
  if (!validColor(foreground) || !validColor(background) || background[3] !== 1)
    return rejected('fill and opaque original background must be resolved RGB colors');
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) return rejected('cumulative opacity must be between zero and one');
  const composite = (front, back) => {
    const alpha = front[3] + back[3] * (1 - front[3]);
    return [0, 1, 2].map((index) => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
  };
  // Finish the glyph before applying element/ancestor group opacity once.
  const paintedFill = composite(foreground, strokeColor);
  const fill = composite([...paintedFill.slice(0, 3), paintedFill[3] * opacity], background);
  const halo = composite([...strokeColor.slice(0, 3), strokeColor[3] * opacity], background);
  const luminance = (color) => color.slice(0, 3).reduce((sum, channel, index) => {
    const value = channel / 255;
    return sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
  const fillLight = luminance(fill), haloLight = luminance(halo);
  const ratio = (Math.max(fillLight, haloLight) + 0.05) / (Math.min(fillLight, haloLight) + 0.05);
  return { eligible: true, reason: null, ratio, fill, halo, outerWidth: width / 2 };
}
