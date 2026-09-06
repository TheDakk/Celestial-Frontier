/** U1 presentation values. Domain colors (rarity/resources/Atlas/portraits)
 * retain their existing owners; these roles apply only to interface chrome. */
export const UI_PRESENTATION_TOKENS = Object.freeze({
  'space-1': '4px', 'space-2': '8px', 'space-3': '12px', 'space-4': '16px',
  'space-5': '20px', 'space-6': '24px', 'space-8': '32px',
  'type-caption': '10.5px', 'type-small': '11px', 'type-body': '13px',
  'type-section': '16px', 'type-title': '20px',
  'radius-small': '6px', 'radius-panel': '14px', 'radius-pill': '999px',
  'layer-caption': '6', 'layer-objective': '9', 'layer-trail': '19',
  'layer-shell': '20', 'layer-sheet': '22', 'layer-survey': '23',
  'layer-toast': '30', 'layer-training': '50', 'layer-training-surface': '58',
  'layer-training-settings': '60',
  'color-surface': 'rgba(10,16,30,var(--glass-a))',
  'color-elevated': 'rgba(16,24,40,.96)', 'color-border': '#405477',
  'color-text': 'var(--ink)', 'color-muted': 'var(--dim)',
  'color-faint': 'var(--faint)', 'color-accent-gold': '#ffd96a',
  'color-accent-teal': '#7ec8f0', 'color-success': '#7fe6a0',
  'color-warn': '#ffd96a', 'color-danger': '#ff806f',
  'dock-chip-width': '58px', 'dock-pitch': '64px', 'dock-half-pitch': '32px',
  'touch-target': '44px', 'utility-face': '36px', 'dock-row-gap': '4px',
  'phone-dock-bottom': '12px', 'phone-hint-bottom': '124px',
  'phone-caption-bottom': '164px', 'objective-offset': '128px',
  'duration-press': '150ms', 'duration-enter': '200ms', 'duration-exit': '150ms',
  'ease-standard': 'cubic-bezier(.2,.7,.2,1)',
} as const);

export const UI_PRESENTATION_PHONE_MAX = 700;
export const UI_PRESENTATION_DESKTOP_MIN = UI_PRESENTATION_PHONE_MAX + 1;
const INTER_FONT_URL = new URL('../assets/pilot/fonts/InterVariable.woff2', import.meta.url).href;
const properties = Object.entries(UI_PRESENTATION_TOKENS)
  .map(([name, value]) => `--cf-${name}:${value};`).join('\n');

/** Installed once before chrome measurement. Settings' body-level font and
 * tone properties take precedence over this root-level default. */
export const UI_PRESENTATION_CSS = `
@font-face{font-family:Inter;src:url("${INTER_FONT_URL}") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
:root{${properties}
--ui:Inter,system-ui,-apple-system,sans-serif;}
`;
