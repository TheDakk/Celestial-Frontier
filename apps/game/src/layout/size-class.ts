import type { SizeClass } from '../events';

export const SIZE_CLASS_LIMITS = Object.freeze({ compactMaxWidth: 599, wideMinWidth: 1100, wideMinHeight: 600 });

/** Width and height in CSS pixels of the visual viewport. Throws RangeError unless both are finite and above 0. */
export function sizeClass(width: number, height: number): SizeClass {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError(`sizeClass: width and height must be finite and above 0, got ${width} x ${height}`);
  }
  if (width < SIZE_CLASS_LIMITS.compactMaxWidth + 1) return 'compact';
  if (width >= SIZE_CLASS_LIMITS.wideMinWidth && height >= SIZE_CLASS_LIMITS.wideMinHeight) return 'wide';
  return 'medium';
}
