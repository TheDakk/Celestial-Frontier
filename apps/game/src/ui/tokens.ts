import { TEXT_SIZE_PX } from './text-prefs';

/** A reading size as a share of the root size, so it grows with the text-size setting. `px` is its size at the default root. */
const rem = (px: number): string => `${px / TEXT_SIZE_PX['']}rem`;

/** Interface values: spacing, reading sizes, corners and chrome colours. Each is the CSS variable --cf-<name>. */
export const UI_TOKENS = Object.freeze({
  'space-1': '4px', 'space-2': '8px', 'space-3': '12px', 'space-4': '16px',
  'space-5': '20px', 'space-6': '24px', 'space-8': '32px',
  'type-caption': rem(10.5), 'type-small': rem(11), 'type-body': rem(13),
  'type-section': rem(16), 'type-title': rem(20),
  'radius-small': '6px', 'radius-panel': '14px', 'radius-pill': '999px',
  'color-surface': 'rgba(10,16,30,var(--glass-a,.84))',
  'color-elevated': 'rgba(16,24,40,.96)', 'color-border': '#405477',
  'color-text': 'var(--ink)', 'color-muted': 'var(--dim)',
  'color-faint': 'var(--faint)', 'color-accent-gold': '#ffd96a',
  'color-accent-teal': '#7ec8f0', 'color-success': '#7fe6a0',
  'color-warn': '#ffd96a', 'color-danger': '#ff806f',
} as const);

/** Sets every token on the root as --cf-<name>. */
export function applyTokens(root: HTMLElement): void {
  for (const [name, value] of Object.entries(UI_TOKENS)) root.style.setProperty(`--cf-${name}`, value);
}
