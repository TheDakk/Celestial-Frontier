// The one list the app, the checker and the art request share.

/** The code points the display font must draw: printable Basic Latin (U+0020 to U+007E), the em dash U+2014 of the
 *  map's captions, then the box U+FFFD. */
export const REQUIRED_GLYPHS: readonly number[] = Object.freeze([...Array.from({ length: 95 }, (_, i) => 32 + i), 0x2014, 0xfffd]);

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

/** The planet types the game makes. */
export const PLANET_TYPES: readonly string[] = Object.freeze(['gas', 'rocky', 'desert', 'ice', 'terran', 'ocean', 'venus', 'lava']);
/** The planet types that wear a cloud deck. */
export const CLOUDED_PLANET_TYPES: readonly string[] = Object.freeze(['terran', 'ocean']);
const CLOUDS = '/clouds';
/** The elements a sheet may draw or leave out: a planet by its type, and the cloud deck of a type that wears one
 *  (`planet/<type>/clouds`, drawn over the planet at the planet's own size). A planet whose type has no drawing is
 *  banded by code, and one without drawn clouds is clouded by code. */
export const OPTIONAL_ELEMENT_NAMES: readonly string[] = Object.freeze([
  ...PLANET_TYPES.map((type) => `planet/${type}`), ...CLOUDED_PLANET_TYPES.map((type) => `planet/${type}${CLOUDS}`)]);
/** The planet a cloud deck is drawn over: `planet/terran` for `planet/terran/clouds`. Undefined for any other name. */
export function planetOfClouds(name: string): string | undefined {
  return OPTIONAL_ELEMENT_NAMES.includes(name) && name.endsWith(CLOUDS) ? name.slice(0, name.length - CLOUDS.length) : undefined;
}

const TIER_NAME = /^(.+)\/x([1-9][0-9]*)$/;
/**
 * A size tier is the same subject as an element drawn again at a greater width, named `<element>/x<width>`: for
 * `galaxy/spiral/v0/x64`, the element `galaxy/spiral/v0` and the width 64. Undefined for a name that is no tier's.
 */
export function tierOf(name: string): { element: string; width: number } | undefined {
  const match = TIER_NAME.exec(name);
  return match === null ? undefined : { element: match[1] ?? '', width: parseInt(match[2] ?? '', 10) };
}

const FORM_NAME = /^(.+)\/(?:v[0-3]|t[1-3]|dim|clouds)$/;
/**
 * The subject an element is one form of: an orientation (`/v0` to `/v3`), a later frame (`/t1` to `/t3`), a dimmed
 * form (`/dim`) and a cloud deck (`/clouds`) are forms of the name before that last part, and any other name is its own subject (the first frame
 * and the undimmed form carry no such part). Elements of one subject are drawn in one place at one size.
 */
export function subjectOf(name: string): string {
  return FORM_NAME.exec(name)?.[1] ?? name;
}
