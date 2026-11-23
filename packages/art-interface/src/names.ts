// The one list the app, the checker and the art request share.

/** The code points the display font must draw: printable Basic Latin (U+0020 to U+007E), then the box U+FFFD. */
export const REQUIRED_GLYPHS: readonly number[] = Object.freeze([...Array.from({ length: 95 }, (_, i) => 32 + i), 0xfffd]);

/** The palette ramps a sheet must name: the ramp display text and icons are drawn in, and the second ramp of an icon. */
export const REQUIRED_RAMPS: readonly string[] = Object.freeze(['ink', 'accent']);

/** The interface icons, by name. `missing` is the stand-in drawn for a name the sheet lacks. */
export const ICON_NAMES: readonly string[] = Object.freeze(['missing', 'settings', 'close', 'warn', 'ok', 'search']);

const ORIENTATIONS: readonly string[] = ['v0', 'v1', 'v2', 'v3'];
const oriented = (name: string): string[] => ORIENTATIONS.map((orientation) => `${name}/${orientation}`);

/**
 * The space elements, by name: everything a map draws from the sheet. Galaxies by kind and the lobes of a radio galaxy,
 * each in four orientations; the quasar; a giant star; the scenery of a galaxy (nebulae, remnants, a rogue planet, a
 * failed star), its wormhole, its supernova sites by what they left, a protostar and the black hole at its centre; and
 * in a system the star itself by kind, and a companion star. Then what moves: the three further frames of each thing
 * that turns (the wormhole through a turn; the beams of a pulsar's remains, and of a pulsar or a magnetar at the heart
 * of a system, through a half turn), and the dimmed form of each thing that pulses.
 */
export const ELEMENT_NAMES: readonly string[] = Object.freeze([
  ...['spiral', 'barred', 'lenticular', 'elliptical', 'irregular'].flatMap((kind) => oriented(`galaxy/${kind}`)),
  ...oriented('radio-lobes'),
  'quasar',
  'star/giant',
  ...['h2', 'neb', 'mol', 'plan', 'rem', 'rogue', 'fbd'].map((kind) => `deco/${kind}`),
  'wormhole',
  ...['shell', 'ns', 'bh'].map((remnant) => `supernova/${remnant}`),
  'protostar',
  'black-hole',
  ...['star', 'bh', 'ns', 'mag', 'proto'].map((kind) => `primary/${kind}`),
  'companion',
  ...['wormhole', 'supernova/ns', 'primary/ns', 'primary/mag'].flatMap((name) => ['t1', 't2', 't3'].map((frame) => `${name}/${frame}`)),
  ...['star/giant', 'quasar', 'protostar'].map((name) => `${name}/dim`),
]);
