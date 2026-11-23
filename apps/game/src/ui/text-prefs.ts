import type { SizeClass } from '../events';

export type TextSize = '' | 'fs-lg' | 'fs-xl';            // the stored values, unchanged
export const TEXT_SIZE_PX: Readonly<Record<TextSize, number>> = Object.freeze({ '': 13, 'fs-lg': 15, 'fs-xl': 17 });
/** The text size a stored value names; anything else is ''. */
export function textSizeOf(stored: string): TextSize {
  return stored === 'fs-lg' || stored === 'fs-xl' ? stored : '';
}

export type TextTone = '' | 'tone-bright' | 'tone-max';
/** The four text colours of each tone: main, secondary, faint, and emphasis. */
export const TEXT_TONES: Readonly<Record<TextTone, Readonly<{ ink: string; dim: string; faint: string; emph: string }>>> = Object.freeze({
  '': { ink: '#e9edff', dim: '#b8c7df', faint: '#91a8ca', emph: 'inherit' },
  'tone-bright': { ink: '#fff', dim: '#d8e3f2', faint: '#b5c8e2', emph: '#ffd96a' },
  'tone-max': { ink: '#fff', dim: '#f0f4ff', faint: '#d6e2f4', emph: '#ffe08a' },
});
/** The tone a stored value names; anything else is ''. */
export function textToneOf(stored: string): TextTone {
  return stored === 'tone-bright' || stored === 'tone-max' ? stored : '';
}

export type TextFont = '' | 'font-sys' | 'font-mono';
/** The reading font of each choice. Inter is used when the app carries it; the system font stands behind it. */
export const TEXT_FONTS: Readonly<Record<TextFont, string>> = Object.freeze({
  '': 'Inter, system-ui, -apple-system, sans-serif',
  'font-sys': 'system-ui, -apple-system, sans-serif',
  'font-mono': 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
});
/** The font a stored value names; anything else is ''. */
export function textFontOf(stored: string): TextFont {
  return stored === 'font-sys' || stored === 'font-mono' ? stored : '';
}

const DISPLAY_SCALES: Readonly<Record<SizeClass, Readonly<Record<TextSize, 1 | 2 | 3 | 4>>>> = Object.freeze({
  compact: { '': 2, 'fs-lg': 2, 'fs-xl': 3 },
  medium: { '': 2, 'fs-lg': 3, 'fs-xl': 3 },
  wide: { '': 2, 'fs-lg': 3, 'fs-xl': 4 },
});
/** Whole-number scale of the display font. */
export function displayScale(size: TextSize, sizeClass: SizeClass): 1 | 2 | 3 | 4 {
  return DISPLAY_SCALES[sizeClass][size];
}

/** Sets --display-scale on the root: the screen pixels per art pixel display text is shown at. */
export function applyDisplayScale(root: HTMLElement, size: TextSize, sizeClass: SizeClass): void {
  root.style.setProperty('--display-scale', String(displayScale(size, sizeClass)));
}

/**
 * Applies the stored text settings to the root: its font size (every rem follows it), the four text colours
 * --ink, --dim, --faint and --emph, and the reading font --ui. An unknown stored value is the default.
 */
export function applyTextPrefs(root: HTMLElement, prefs: { fsMode: string; toneMode: string; fontMode: string }): void {
  root.style.fontSize = `${TEXT_SIZE_PX[textSizeOf(prefs.fsMode)]}px`;
  for (const [name, value] of Object.entries(TEXT_TONES[textToneOf(prefs.toneMode)])) root.style.setProperty(`--${name}`, value);
  root.style.setProperty('--ui', TEXT_FONTS[textFontOf(prefs.fontMode)]);
}
