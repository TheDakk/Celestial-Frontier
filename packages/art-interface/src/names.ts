// The one list the app, the checker and the art request share.

/** The code points the display font must draw: printable Basic Latin (U+0020 to U+007E), then the box U+FFFD. */
export const REQUIRED_GLYPHS: readonly number[] = Object.freeze([...Array.from({ length: 95 }, (_, i) => 32 + i), 0xfffd]);

/** The palette ramps a sheet must name: the ramp display text and icons are drawn in, and the second ramp of an icon. */
export const REQUIRED_RAMPS: readonly string[] = Object.freeze(['ink', 'accent']);

/** The interface icons, by name. `missing` is the stand-in drawn for a name the sheet lacks. */
export const ICON_NAMES: readonly string[] = Object.freeze(['missing', 'settings']);

/** The space elements, by name. */
export const ELEMENT_NAMES: readonly string[] = Object.freeze([]);
