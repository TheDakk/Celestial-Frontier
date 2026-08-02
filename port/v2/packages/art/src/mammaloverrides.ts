/* mammaloverrides.ts — THE MORPHOLOGY PASS, wave 10a: THE MAMMAL REMAINDER.
   Measuring the gap again turned up something bigger than the arthropods:
   ~95 catalog mammals were still on the verbatim engine — bovids, canids,
   felids, mustelids, bears, pigs, equids and the domestics — every one of
   them a body plan wave 4's quadruped system already knows how to draw.
   This is table work, not painter work, which is exactly what a good
   parameterised system should make a large gap feel like.

   The one painter change wave 10a needed: THE BOVID HORN. An antelope IS
   its horns — an oryx's metre-long straight rapiers, a kudu's corkscrew, an
   impala's lyre, a pronghorn's forward prong — and drawn as one generic
   spike they would all have been the same goat.

   Deliberately ABSENT (D-ART-14, never override what already excels): the
   verbatim Elephants, Zebra, Tiger, Lion, Red Panda and Raccoon, which the
   reviews scored well and wave 4 removed after a regression. */
import type { QuadSpec } from './quadrupedoverrides.js';

export const QUAD2_SPEC: Record<string, QuadSpec> = {
  /* ── BOVIDS: the horn is the species ── */
  'Oryx': { legs: 0.145, depth: 0.095, len: 0.26, neck: 0.10, muzzle: 0.40, ears: 'small', tail: 'tuft', horn: 'straight', face: 'mask', hue: '#cdc3b0' },
  'Kudu': { legs: 0.155, depth: 0.098, len: 0.27, neck: 0.12, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'spiral', coat: 'stripes', hue: '#9a8468' },
  'Nilgai': { legs: 0.150, depth: 0.105, len: 0.28, neck: 0.11, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'shorthorn', hue: '#8a8b90' },
  'Bongo': { legs: 0.140, depth: 0.100, len: 0.26, neck: 0.10, muzzle: 0.38, ears: 'large', tail: 'tuft', horn: 'spiral', coat: 'stripes', hue: '#a5613a' },
  'Eland': { legs: 0.150, depth: 0.110, len: 0.29, neck: 0.11, muzzle: 0.42, ears: 'large', tail: 'tuft', horn: 'spiral', hue: '#b09a76' },
  'Impala': { legs: 0.150, depth: 0.085, len: 0.24, neck: 0.11, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c08a4e' },
  'Gazelle': { legs: 0.150, depth: 0.080, len: 0.23, neck: 0.11, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c9a56d' },
  'Springbok': { legs: 0.148, depth: 0.080, len: 0.23, neck: 0.10, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c8a067' },
  'Gerenuk': { legs: 0.175, depth: 0.070, len: 0.22, neck: 0.22, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#bd8f5c' },
  'Hartebeest': { legs: 0.160, depth: 0.090, len: 0.26, neck: 0.11, back: 'sloped', muzzle: 0.44, ears: 'large', tail: 'tuft', horn: 'lyre', hue: '#a9764a' },
  'Antelope': { legs: 0.150, depth: 0.088, len: 0.25, neck: 0.11, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'lyre' },
  'Duiker': { legs: 0.115, depth: 0.075, len: 0.20, neck: 0.07, back: 'arched', muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'shorthorn', hue: '#8f6a48' },
  'Saiga': { legs: 0.135, depth: 0.090, len: 0.24, neck: 0.09, muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'straight', hue: '#c6bda6' },
  'Pronghorn': { legs: 0.150, depth: 0.085, len: 0.24, neck: 0.10, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'prong', hue: '#bd8c55' },
  'Ibex': { legs: 0.125, depth: 0.095, len: 0.24, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9b8563' },
  'Chamois': { legs: 0.125, depth: 0.085, len: 0.22, neck: 0.08, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'shorthorn', hue: '#7d5f42' },
  'Tahr': { legs: 0.115, depth: 0.100, len: 0.23, neck: 0.08, muzzle: 0.34, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#8a6242' },
  'Serow': { legs: 0.120, depth: 0.095, len: 0.23, neck: 0.08, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'shorthorn', coat: 'shaggy', hue: '#6f6257' },
  'Mountain Goat': { legs: 0.125, depth: 0.100, len: 0.23, neck: 0.08, muzzle: 0.34, ears: 'small', tail: 'stub', horn: 'shorthorn', coat: 'shaggy', hue: '#e6e3db' },
  'Goat': { legs: 0.115, depth: 0.090, len: 0.22, neck: 0.08, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'curl', hue: '#b9ac95' },
  'Musk Ox': { legs: 0.100, depth: 0.135, len: 0.28, neck: 0.06, back: 'humped', muzzle: 0.38, jaw: 'broad', ears: 'tiny', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#5a4634' },
  'Yak': { legs: 0.105, depth: 0.135, len: 0.29, neck: 0.06, back: 'humped', muzzle: 0.40, jaw: 'broad', ears: 'small', tail: 'plume', horn: 'curl', coat: 'shaggy', hue: '#4c4038' },
  'Cattle': { legs: 0.125, depth: 0.125, len: 0.29, neck: 0.07, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'shorthorn', coat: 'patches' },
  'Cow': { legs: 0.125, depth: 0.125, len: 0.29, neck: 0.07, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', coat: 'patches', hue: '#e8e2d6' },
  'Bull': { legs: 0.120, depth: 0.140, len: 0.30, neck: 0.06, back: 'humped', muzzle: 0.48, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'shorthorn', hue: '#4a3b31' },
  'Wildebeest': { legs: 0.145, depth: 0.105, len: 0.27, neck: 0.08, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'plume', horn: 'curl', coat: 'stripes', hue: '#5f5a55' },
  /* ── CANIDS: the long muzzle, the pricked ear, the brush tail ── */
  'Coyote': { legs: 0.125, depth: 0.090, len: 0.26, neck: 0.07, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#a08a68' },
  'Jackal': { legs: 0.120, depth: 0.085, len: 0.25, neck: 0.07, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#a07a4e' },
  'Fox': { legs: 0.105, depth: 0.080, len: 0.24, neck: 0.06, muzzle: 0.50, ears: 'large', tail: 'bushy', hue: '#c4642a' },
  'Pampas Fox': { legs: 0.108, depth: 0.080, len: 0.24, neck: 0.06, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#9c8f7c' },
  'Maned Wolf': { legs: 0.190, depth: 0.078, len: 0.25, neck: 0.09, muzzle: 0.50, ears: 'huge', tail: 'bushy', hue: '#c2662a' },
  'African Wild Dog': { legs: 0.130, depth: 0.085, len: 0.26, neck: 0.07, muzzle: 0.44, ears: 'huge', tail: 'plume', coat: 'patches', hue: '#9a6f3c' },
  'Dingo': { legs: 0.125, depth: 0.088, len: 0.26, neck: 0.07, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#c08b4c' },
  'Dog': { legs: 0.115, depth: 0.090, len: 0.24, neck: 0.07, muzzle: 0.44, ears: 'large', tail: 'bushy' },
  /* ── FELIDS: short muzzle, round ear, long tail; rosettes where they belong ── */
  'Bobcat': { legs: 0.110, depth: 0.088, len: 0.23, neck: 0.06, muzzle: 0.28, ears: 'large', tail: 'stub', coat: 'spots', hue: '#b08a5e' },
  'Caracal': { legs: 0.120, depth: 0.085, len: 0.24, neck: 0.06, muzzle: 0.28, ears: 'huge', tail: 'long', hue: '#c08e58' },
  'Serval': { legs: 0.140, depth: 0.080, len: 0.24, neck: 0.07, muzzle: 0.28, ears: 'huge', tail: 'long', coat: 'spots', hue: '#d0a45c' },
  'Ocelot': { legs: 0.105, depth: 0.085, len: 0.24, neck: 0.06, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'rosettes', hue: '#c79a5c' },
  'Clouded Leopard': { legs: 0.100, depth: 0.092, len: 0.26, neck: 0.06, muzzle: 0.30, ears: 'round', tail: 'long', coat: 'rosettes', hue: '#b8975f' },
  'Wildcat': { legs: 0.100, depth: 0.082, len: 0.22, neck: 0.06, muzzle: 0.28, ears: 'round', tail: 'banded', coat: 'stripes', hue: '#a09077' },
  'Sand Cat': { legs: 0.090, depth: 0.078, len: 0.21, neck: 0.05, muzzle: 0.26, ears: 'huge', tail: 'banded', hue: '#d6bd8e' },
  'Fishing Cat': { legs: 0.100, depth: 0.090, len: 0.23, neck: 0.06, muzzle: 0.30, ears: 'round', tail: 'stub', coat: 'spots', hue: '#93856d' },
  'Cat': { legs: 0.090, depth: 0.078, len: 0.20, neck: 0.05, muzzle: 0.24, ears: 'large', tail: 'long', coat: 'stripes' },
  /* ── MUSTELIDS & small carnivores: long body, short legs ── */
  'Badger': { legs: 0.070, depth: 0.098, len: 0.24, neck: 0.04, muzzle: 0.38, ears: 'tiny', tail: 'stub', coat: 'stripes', face: 'mask', hue: '#8d8a84' },
  'Wolverine': { legs: 0.090, depth: 0.105, len: 0.24, neck: 0.05, back: 'arched', muzzle: 0.38, ears: 'round', tail: 'bushy', coat: 'shaggy', hue: '#5c4433' },
  'Weasel': { legs: 0.055, depth: 0.052, len: 0.24, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'stub', hue: '#b98a52' },
  'Stoat': { legs: 0.055, depth: 0.052, len: 0.24, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'tuft', hue: '#c49258' },
  'Mink': { legs: 0.060, depth: 0.060, len: 0.24, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'bushy', hue: '#5b4032' },
  'Marten': { legs: 0.070, depth: 0.068, len: 0.24, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#7d5334' },
  'Fisher': { legs: 0.075, depth: 0.072, len: 0.25, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#4f3b2c' },
  'Otter': { legs: 0.055, depth: 0.075, len: 0.26, neck: 0.05, muzzle: 0.30, ears: 'tiny', tail: 'long', hue: '#6b4f38' },
  'River Otter': { legs: 0.055, depth: 0.075, len: 0.26, neck: 0.05, muzzle: 0.30, ears: 'tiny', tail: 'long', hue: '#6f5239' },
  'Giant Otter': { legs: 0.060, depth: 0.088, len: 0.29, neck: 0.06, muzzle: 0.32, ears: 'tiny', tail: 'long', hue: '#54402e' },
  'Sea Otter': { legs: 0.050, depth: 0.090, len: 0.25, neck: 0.05, muzzle: 0.28, ears: 'tiny', tail: 'stub', coat: 'shaggy', hue: '#6a5340' },
  'Mongoose': { legs: 0.062, depth: 0.058, len: 0.23, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#9a8a6c' },
  'Meerkat': { legs: 0.070, depth: 0.058, len: 0.18, neck: 0.08, muzzle: 0.32, ears: 'round', tail: 'long', hue: '#b5a184' },
  'Civet': { legs: 0.080, depth: 0.070, len: 0.24, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'banded', coat: 'spots', face: 'mask', hue: '#a8996f' },
  'Coati': { legs: 0.085, depth: 0.072, len: 0.24, neck: 0.06, muzzle: 0.54, ears: 'round', tail: 'banded', hue: '#8e6440' },
  'Kinkajou': { legs: 0.078, depth: 0.075, len: 0.21, neck: 0.05, muzzle: 0.30, ears: 'round', tail: 'long', hue: '#a06e3c' },
  'Mole': { legs: 0.028, depth: 0.062, len: 0.16, neck: 0.02, muzzle: 0.46, ears: 'tiny', tail: 'stub', hue: '#4a423c' },
  'Hyrax': { legs: 0.055, depth: 0.078, len: 0.17, neck: 0.03, back: 'arched', muzzle: 0.28, ears: 'round', tail: 'none', hue: '#8b7a63' },
  'Aardvark': { legs: 0.095, depth: 0.100, len: 0.26, neck: 0.06, back: 'arched', muzzle: 0.80, ears: 'huge', tail: 'long', hue: '#b09c85' },
  /* ── BEARS, PIGS, EQUIDS ── */
  'Bear': { legs: 0.095, depth: 0.125, len: 0.27, neck: 0.05, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'shaggy' },
  'Spectacled Bear': { legs: 0.095, depth: 0.120, len: 0.26, neck: 0.05, muzzle: 0.40, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'shaggy', face: 'tears', hue: '#3b332c' },
  'Wild Pig': { legs: 0.090, depth: 0.110, len: 0.25, neck: 0.04, back: 'sloped', muzzle: 0.56, jaw: 'barrel', ears: 'large', tail: 'tuft', coat: 'shaggy', hue: '#6b5a49' },
  'Pig': { legs: 0.080, depth: 0.120, len: 0.25, neck: 0.04, muzzle: 0.56, jaw: 'barrel', ears: 'large', tail: 'stub', hue: '#e0aca5' },
  'Peccary': { legs: 0.090, depth: 0.100, len: 0.22, neck: 0.04, back: 'sloped', muzzle: 0.54, jaw: 'barrel', ears: 'small', tail: 'stub', coat: 'shaggy', hue: '#5f5850' },
  'Wild Horse': { legs: 0.160, depth: 0.105, len: 0.29, neck: 0.13, muzzle: 0.52, ears: 'large', tail: 'plume', hue: '#a98159' },
  'Wild Pony': { legs: 0.130, depth: 0.100, len: 0.26, neck: 0.11, muzzle: 0.50, ears: 'large', tail: 'plume', coat: 'shaggy', hue: '#8a6a4a' },
  'Wild Ass': { legs: 0.155, depth: 0.098, len: 0.27, neck: 0.12, muzzle: 0.50, ears: 'huge', tail: 'tuft', hue: '#b8ab93' },
  'Donkey': { legs: 0.145, depth: 0.100, len: 0.26, neck: 0.11, muzzle: 0.50, ears: 'huge', tail: 'tuft', hue: '#9b948c' },
  'Gaur': { legs: 0.135, depth: 0.135, len: 0.30, neck: 0.06, back: 'humped', muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#3f3229' },
  'Banteng': { legs: 0.135, depth: 0.120, len: 0.29, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#7a4f30' },
  'Buffalo': { legs: 0.125, depth: 0.135, len: 0.30, neck: 0.06, back: 'humped', muzzle: 0.48, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#4b433c' },
  'Takin': { legs: 0.115, depth: 0.125, len: 0.26, neck: 0.06, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#b59a63' },
  'Caribou': { legs: 0.150, depth: 0.105, len: 0.28, neck: 0.10, muzzle: 0.44, ears: 'large', tail: 'stub', horn: 'branched', coat: 'shaggy', hue: '#a2917c' },
  'Okapi': { legs: 0.155, depth: 0.100, len: 0.27, neck: 0.16, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'ossicone', coat: 'stripes', hue: '#5d3b28' },
  'Mountain Tapir': { legs: 0.105, depth: 0.115, len: 0.25, neck: 0.05, back: 'arched', muzzle: 0.66, jaw: 'barrel', ears: 'small', tail: 'stub', coat: 'shaggy', hue: '#3f3a36' },
  'Sloth': { legs: 0.080, depth: 0.100, len: 0.21, neck: 0.06, back: 'arched', muzzle: 0.28, ears: 'tiny', tail: 'stub', coat: 'shaggy', hue: '#8c8367' },
  'Possum': { legs: 0.070, depth: 0.078, len: 0.21, neck: 0.05, muzzle: 0.44, ears: 'large', tail: 'long', hue: '#a49b8c' },
  'Marsh Rodent': { legs: 0.065, depth: 0.080, len: 0.20, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'long', hue: '#7b6448' },
};
