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
  'Oryx': { legs: 0.1774, depth: 0.1372, len: 0.18, neck: 0.10, muzzle: 0.40, ears: 'small', tail: 'tuft', horn: 'straight', face: 'mask', faceMark: 'darkMask', legMarks: true, hue: '#cdc3b0', family: 'bovid', mammalEPlan: 'Oryx' },
  'Kudu': { legs: 0.2021, depth: 0.1587, len: 0.1667, neck: 0.12, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'spiral', coat: 'stripes', hue: '#9a8468', family: 'bovid', mammalEPlan: 'Kudu' },
  'Nilgai': { legs: 0.1855, depth: 0.1546, len: 0.1901, neck: 0.11, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'shorthorn', hue: '#8a8b90', family: 'bovid' },
  'Bongo': { legs: 0.169, depth: 0.1408, len: 0.1847, neck: 0.10, muzzle: 0.38, ears: 'large', tail: 'tuft', horn: 'spiral', coat: 'stripes', hue: '#a5613a', family: 'bovid' },
  'Eland': { back: 'humped', legs: 0.1817, depth: 0.1840, len: 0.2046, neck: 0.11, muzzle: 0.42, ears: 'large', tail: 'tuft', horn: 'spiral', hue: '#b09a76', family: 'bovid', shoulderHump: 0.22, dewlap: 0.68, mammalEPlan: 'Eland' },
  'Impala': { legs: 0.1885, depth: 0.1288, len: 0.1584, neck: 0.11, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c08a4e', family: 'bovid' , accent: 'rumpStripes', mammalEPlan: 'Impala' },
  'Gazelle': { legs: 0.1861, depth: 0.1184, len: 0.1553, neck: 0.11, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c9a56d', family: 'bovid' , earShape: 'leaf' , accent: 'flankBand', mammalEPlan: 'Gazelle' },
  'Springbok': { legs: 0.1869, depth: 0.1223, len: 0.1504, neck: 0.10, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#c8a067', family: 'bovid' , accent: 'flankBand', faceMark: 'whiteBlaze' },
  'Gerenuk': { legs: 0.2366, depth: 0.1211, len: 0.1271, neck: 0.22, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'lyre', hue: '#bd8f5c', family: 'bovid' },
  'Hartebeest': { legs: 0.2024, depth: 0.1379, len: 0.1697, neck: 0.11, back: 'sloped', muzzle: 0.62, ears: 'large', tail: 'tuft', horn: 'lyre', hue: '#a9764a', family: 'bovid', headScale: 1.20, carry: 0.88, mammalEPlan: 'Hartebeest' },
  'Antelope': { hue: '#c39a5e', legs: 0.1889, depth: 0.1338, len: 0.1645, neck: 0.11, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'lyre', family: 'bovid' },
  'Duiker': { legs: 0.1423, depth: 0.1104, len: 0.1358, neck: 0.07, back: 'arched', muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'shorthorn', hue: '#8f6a48', family: 'bovid' },
  'Saiga': { legs: 0.167, depth: 0.1325, len: 0.163, neck: 0.09, muzzle: 0.66, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'straight', hue: '#c6bda6', family: 'bovid' },
  'Pronghorn': { legs: 0.1885, depth: 0.1288, len: 0.1584, neck: 0.10, muzzle: 0.38, ears: 'large', tail: 'stub', horn: 'prong', hue: '#bd8c55', family: 'bovid' },
  'Ibex': { legs: 0.1496, depth: 0.1318, len: 0.173, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9b8563', family: 'bovid' },
  'Chamois': { legs: 0.1534, depth: 0.1233, len: 0.1517, neck: 0.08, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'shorthorn', hue: '#7d5f42', family: 'bovid' },
  'Tahr': { legs: 0.1366, depth: 0.1367, len: 0.1682, neck: 0.08, muzzle: 0.34, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#8a6242', family: 'bovid' },
  'Serow': { legs: 0.1446, depth: 0.1333, len: 0.1639, neck: 0.08, muzzle: 0.36, ears: 'large', tail: 'stub', horn: 'shorthorn', coat: 'shaggy', hue: '#6f6257', family: 'bovid' },
  'Mountain Goat': { legs: 0.1485, depth: 0.1367, len: 0.1682, neck: 0.08, muzzle: 0.34, ears: 'small', tail: 'stub', horn: 'shorthorn', coat: 'shaggy', hue: '#e6e3db', family: 'bovid' },
  'Goat': { legs: 0.1389, depth: 0.1269, len: 0.1561, neck: 0.08, muzzle: 0.34, ears: 'large', tail: 'stub', horn: 'curl', hue: '#b9ac95', family: 'bovid' },
  'Musk Ox': { legs: 0.1154, depth: 0.1753, len: 0.2157, neck: 0.06, back: 'humped', muzzle: 0.38, jaw: 'broad', ears: 'tiny', tail: 'stub', horn: 'boss', coat: 'shaggy', hue: '#5a4634', family: 'bovid', mammalEPlan: 'Musk Ox' },
  'Yak': { legs: 0.1203, depth: 0.1727, len: 0.2266, neck: 0.06, back: 'humped', muzzle: 0.40, jaw: 'broad', ears: 'small', tail: 'plume', tailScale: 1.28, horn: 'boss', coat: 'shaggy', hue: '#4c4038', family: 'bovid', shoulderHump: 0.30, dewlap: 0.42, carry: 0.24, headDrop: 0.06, mammalEPlan: 'Yak' },
  'Cattle': { hue: '#8a3f28', legs: 0.1489, depth: 0.1717, len: 0.2112, neck: 0.07, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'shorthorn', coat: 'blotches', family: 'bovid', earShape: 'spoon' },
  'Cow': { legs: 0.1462, depth: 0.1662, len: 0.2181, neck: 0.07, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', coat: 'blotches', hue: '#e8e2d6', family: 'bovid', earShape: 'spoon', udder: true, dewlap: 0.38, mammalEPlan: 'Cow' },
  'Bull': { legs: 0.1398, depth: 0.1848, len: 0.2273, neck: 0.06, back: 'humped', muzzle: 0.48, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'shorthorn', hue: '#4a3b31', family: 'bovid', earShape: 'spoon', shoulderHump: 0.36, dewlap: 0.78 },
  'Wildebeest': { legs: 0.1745, depth: 0.147, len: 0.1929, neck: 0.08, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'plume', horn: 'boss', coat: 'stripes', hue: '#5f5a55', family: 'bovid', mammalEPlan: 'Wildebeest' },
  /* ── CANIDS: the long muzzle, the pricked ear, the brush tail ── */
  'Coyote': { legs: 0.1481, depth: 0.1040, len: 0.191, neck: 0.07, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#a08a68', family: 'canid' , tailTip: '#26201d' },
  'Jackal': { legs: 0.145, depth: 0.1010, len: 0.1771, neck: 0.07, muzzle: 0.48, ears: 'large', tail: 'bushy', hue: '#a07a4e', family: 'canid' , tailTip: '#2a231f' },
  'Fox': { legs: 0.1193, depth: 0.1009, len: 0.1903, neck: 0.06, muzzle: 0.50, jaw: 'fine', ears: 'large', tail: 'plume', tailScale: 1.72, tailTip: '#f2efe6', stockings: '#241b19', hue: '#c4642a', family: 'canid', mammalCPlan: 'canid-c1' },
  'Pampas Fox': { legs: 0.1276, depth: 0.1082, len: 0.1775, neck: 0.06, muzzle: 0.48, ears: 'large', tail: 'bushy', tailScale: 1.48, tailTip: '#2d2926', stockings: '#b57444', hue: '#91867a', family: 'canid', mammalCPlan: 'canid-c1' },
  'Maned Wolf': { legs: 0.2583, depth: 0.1363, len: 0.1431, neck: 0.09, muzzle: 0.50, ears: 'large', tail: 'bushy', hue: '#c2662a', family: 'canid', earScale: 1.30 , tailTip: '#f0ece2', stockings: '#211d1a', mane: 'hyena' },
  'African Wild Dog': { legs: 0.1565, depth: 0.1030, len: 0.1855, neck: 0.07, muzzle: 0.44, ears: 'large', tail: 'plume', coat: 'blotches', hue: '#9a6f3c', family: 'canid', earShape: 'round', earScale: 1.45 , tailTip: '#f4f1e8' },
  'Dingo': { legs: 0.1563, depth: 0.1090, len: 0.1733, neck: 0.07, muzzle: 0.48, jaw: 'broad', ears: 'large', tail: 'bushy', hue: '#c08b4c', family: 'canid', stockings: '#efe7d4', mammalCPlan: 'canid-c1' },
  'Dog': { hue: '#a9743f', legs: 0.1423, depth: 0.1325, len: 0.163, neck: 0.07, muzzle: 0.44, ears: 'large', earShape: 'drop', tail: 'plume', tailPose: 'raised', family: 'canid', mammalCPlan: 'canid-c1' },
  /* ── FELIDS: short muzzle, round ear, long tail; rosettes where they belong ── */
  'Bobcat': { back: 'arched', legs: 0.1268, depth: 0.114, len: 0.1776, neck: 0.06, muzzle: 0.28, ears: 'large', tail: 'stub', coat: 'spots', hue: '#c39a63', family: 'felid', earShape: 'tuft', earTuftScale: 1.82, cheekRuff: 2.00, spotScale: 0.58, headScale: 1.10, mammalBPlan: 'felid-r1' },
  'Caracal': { back: 'arched', legs: 0.1413, depth: 0.108, len: 0.1783, neck: 0.06, muzzle: 0.28, ears: 'large', tail: 'long', hue: '#c08e58', family: 'felid', earShape: 'tuft', earScale: 1.72, earTuftScale: 2.18, headScale: 1.08, mammalBPlan: 'felid-r1' },
  'Serval': { legs: 0.205, depth: 0.098, len: 0.1684, neck: 0.07, muzzle: 0.28, ears: 'large', tail: 'long', tailScale: 1.36, coat: 'spots', hue: '#d0a45c', family: 'felid', earShape: 'leaf', earScale: 1.76, legMarks: true, spotScale: 0.70, mammalBPlan: 'felid-r1' },
  'Ocelot': { back: 'arched', legs: 0.112, depth: 0.119, len: 0.1874, neck: 0.06, muzzle: 0.28, ears: 'round', tail: 'long', tailScale: 1.20, coat: 'rosettes', rosetteChain: true, rosetteScale: 1.20, cheekBars: true, hue: '#c79a5c', family: 'felid', legMarks: true, headScale: 1.12, mammalBPlan: 'felid-r1' },
  'Clouded Leopard': { back: 'arched', legs: 0.096, depth: 0.126, len: 0.2124, neck: 0.06, muzzle: 0.30, ears: 'round', tail: 'long', tailScale: 2.90, coat: 'blotches', hue: '#b8975f', family: 'felid', legMarks: true, headScale: 1.10, mammalBPlan: 'felid-r1' },
  /* ★ wave 52 — separated from 'Cat', which artlock put at 1.41 once both got
     a haunch. They were near-identical on the axes that matter and the fix is
     its own reference row, not a smaller haunch (D-ART-83). The row asks for
     three things the spec was not saying: a "sturdy build heavier than a house
     cat" (leg/depth 1.09 → 0.95, where Cat is 1.07 — and it must be a RATIO,
     the fit pass erases absolute size, D-ART-34), a "broad head", and a thick
     blunt tail with "a black tip" that had no `tailTip` at all. */
  'Wildcat': { legs: 0.1060, depth: 0.1120, len: 0.172, neck: 0.06, muzzle: 0.28, jaw: 'broad', ears: 'round', tail: 'banded', tailTip: '#1d1916', coat: 'stripes', hue: '#a09077', family: 'felid' },
  'Sand Cat': { legs: 0.1046, depth: 0.1025, len: 0.1598, neck: 0.05, muzzle: 0.26, ears: 'large', tail: 'banded', hue: '#d6bd8e', family: 'felid', earShape: 'point', earScale: 1.25, mammalBPlan: 'felid-r1' },
  'Fishing Cat': { back: 'arched', legs: 0.101, depth: 0.1265, len: 0.1905, neck: 0.055, muzzle: 0.30, jaw: 'broad', headScale: 1.10, pawScale: 1.24, ears: 'round', earScale: 0.78, tail: 'thick', tailScale: 0.90, tailTip: '#181714', coat: 'spots', hue: '#6f7455', family: 'felid', spotScale: 0.56 },
  'Cat': { back: 'arched', hue: '#7f8288', legs: 0.0992, depth: 0.093, len: 0.1677, neck: 0.05, muzzle: 0.24, headScale: 1.12, ears: 'large', earShape: 'point', pupil: 'slit', domesticCatFace: true, tail: 'long', tailScale: 1.75, tailPose: 'raised', coat: 'stripes', family: 'felid', mammalBPlan: 'felid-r1' },
  /* ── MUSTELIDS & small carnivores: long body, short legs ── */
  'Badger': { legs: 0.058, depth: 0.124, len: 0.2151, neck: 0.04, carry: 0.30, muzzle: 0.38, ears: 'tiny', tail: 'stub', coat: 'plain', face: 'mask', hue: '#8d8a84', family: 'mustelid', faceMark: 'whiteBlaze', clawScale: 1.35, mammalDPlan: 'Badger' },
  'Wolverine': { legs: 0.0961, depth: 0.1182, len: 0.2132, neck: 0.05, back: 'arched', muzzle: 0.38, ears: 'round', tail: 'bushy', coat: 'shaggy', hue: '#5c4433', family: 'mustelid', mammalDPlan: 'Wolverine' },
  'Weasel': { legs: 0.0634, depth: 0.0674, len: 0.1853, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'stub', hue: '#b98a52', family: 'mustelid' },
  /* ★ wave 35 — a stoat has no TUFT; it has a BLACK TIP, and that tip is the
     entire difference between it and a weasel or an otter at a glance. It was
     cast as 'tuft' to borrow the old dark blob on the end, and when that blob
     became real hair the Stoat and the River Otter collapsed into the same
     picture — artlock caught it in the same commit that caused it. */
  'Stoat': { legs: 0.0634, depth: 0.0674, len: 0.1853, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'long', tailTip: '#1c1614', hue: '#c49258', family: 'mustelid' },
  'Mink': { legs: 0.0665, depth: 0.0724, len: 0.199, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'bushy', hue: '#5b4032', family: 'mustelid', mammalDPlan: 'Mink' },
  'Marten': { legs: 0.0773, depth: 0.0814, len: 0.2003, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#7d5334', family: 'mustelid', mammalDPlan: 'Marten' },
  'Fisher': { legs: 0.084, depth: 0.0885, len: 0.2033, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#4f3b2c', family: 'mustelid', mammalDPlan: 'Fisher' },
  'Otter': { legs: 0.0385, depth: 0.0905, len: 0.1720, neck: 0.032, muzzle: 0.30, ears: 'tiny', tail: 'long', family: 'mustelid', hue: '#6b533c', mammalDPlan: 'Otter' },
  /* larger, greyer and longer-tailed than the sea-going one */
  'River Otter': { legs: 0.0452, depth: 0.0815, len: 0.1980, neck: 0.038, muzzle: 0.34, ears: 'tiny', tail: 'long', family: 'mustelid', hue: '#8d7f6e', mammalDPlan: 'River Otter' },
  'Giant Otter': { legs: 0.0651, depth: 0.1019, len: 0.2506, neck: 0.06, muzzle: 0.32, ears: 'tiny', tail: 'long', hue: '#54402e', family: 'mustelid', mammalDPlan: 'Giant Otter' },
  'Sea Otter': { legs: 0.0538, depth: 0.1027, len: 0.219, neck: 0.05, muzzle: 0.28, ears: 'tiny', tail: 'stub', coat: 'shaggy', hue: '#6a5340', family: 'mustelid', mammalDPlan: 'Sea Otter' },
  /* ★ wave 22 — proportioncheck had it at 3.06 wide-to-tall on a 0.23/0.058
     spec, i.e. four times as long as deep. A mongoose is lithe, not a ribbon. */
  'Mongoose': { legs: 0.0671, depth: 0.0856, len: 0.1685, neck: 0.05, muzzle: 0.36, ears: 'round', tail: 'bushy', hue: '#9a8a6c', family: 'mustelid', mammalDPlan: 'Mongoose' },
  'Meerkat': { legs: 0.0943, depth: 0.0998, len: 0.1047, neck: 0.08, muzzle: 0.32, ears: 'round', tail: 'long', hue: '#b5a184', family: 'mustelid' , pose: 'sentinel' },
  'Civet': { legs: 0.078, depth: 0.1039, len: 0.188, neck: 0.05, carry: 0.40, muzzle: 0.38, ears: 'round', tail: 'banded', coat: 'spots', face: 'mask', hue: '#a8996f', family: 'mustelid', faceMark: 'darkMask', mammalDPlan: 'Civet' },
  'Coati': { legs: 0.084, depth: 0.1053, len: 0.182, neck: 0.06, carry: 0.35, tailScale: 1.3, muzzle: 0.54, ears: 'round', tail: 'banded', hue: '#8e6440', family: 'procyonid', tailPose: 'upright', faceMark: 'darkMask' },
  'Kinkajou': { legs: 0.075, depth: 0.1095, len: 0.1437, neck: 0.05, carry: 0.35, tailScale: 1.95, muzzle: 0.30, ears: 'round', tail: 'long', hue: '#a06e3c', family: 'procyonid', headScale: 1.28, iris: '#24170f', mammalCPlan: 'procyonid-c1' },
  'Mole': { legs: 0.0295, depth: 0.0790, len: 0.1610, neck: 0.02, muzzle: 0.46, ears: 'tiny', tail: 'stub', hue: '#39322e', family: 'burrower', earShape: 'hidden', foot: 'claw', mammalDPlan: 'Mole' },
  'Hyrax': { legs: 0.0595, depth: 0.0899, len: 0.1474, neck: 0.03, back: 'arched', muzzle: 0.28, ears: 'round', tail: 'none', hue: '#8b7a63', family: 'rodent', mammalDPlan: 'Hyrax' },
  'Aardvark': { legs: 0.088, depth: 0.1259, len: 0.222, neck: 0.06, carry: 0.35, back: 'roached', muzzle: 0.80, ears: 'huge', tail: 'muscular', tailScale: 1.25, mat: 'hide', hue: '#b09c85', family: 'burrower', earShape: 'leaf' },
  /* ── BEARS, PIGS, EQUIDS ── */
  'Spectacled Bear': { legs: 0.1111, depth: 0.1593, len: 0.1959, neck: 0.05, muzzle: 0.40, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'shaggy', hue: '#3b332c', family: 'ursid', faceMark: 'spectacles', muzzleHue: '#d7c5a4', clawScale: 1.22, mammalBPlan: 'ursid-r1' },
  'Wild Pig': { legs: 0.1014, depth: 0.1365, len: 0.2015, neck: 0.04, back: 'sloped', muzzle: 0.56, jaw: 'barrel', ears: 'large', tail: 'tuft', coat: 'shaggy', hue: '#6b5a49', family: 'suid' },
  'Pig': { legs: 0.0879, depth: 0.1425, len: 0.2104, neck: 0.04, muzzle: 0.56, jaw: 'barrel', ears: 'large', tail: 'stub', hue: '#e0aca5', family: 'suid', earShape: 'drop' },
  'Peccary': { legs: 0.102, depth: 0.1256, len: 0.1752, neck: 0.04, back: 'sloped', muzzle: 0.54, jaw: 'barrel', ears: 'small', tail: 'stub', coat: 'shaggy', hue: '#5f5850', family: 'suid' },
  'Wild Horse': { legs: 0.1964, depth: 0.164, len: 0.1999, neck: 0.13, muzzle: 0.52, ears: 'small', tail: 'flow', mane: 'crestUp', hue: '#a98159', family: 'equid' },
  'Wild Pony': { legs: 0.1542, depth: 0.148, len: 0.1903, neck: 0.11, muzzle: 0.50, ears: 'small', tail: 'flow', mane: 'crest', tailScale: 0.85, coat: 'shaggy', hue: '#8a6a4a' , family: 'equid' },
  /* ★ wave 36 (Nick, on the proof sheet: "the donkey ears were quite huge") —
     these two were 'huge' (1.15·headR) TIMES earScale 1.70, i.e. an ear 1.96×
     the radius of the skull carrying it, and therefore LARGER THAN THE FENNEC
     FOX'S at 1.50 — the one animal in the catalogue whose whole identity is
     outsized ears. The ladder was inverted at the top. A donkey's ear is long,
     not enormous: 'large' × 1.55 puts it just under one head-radius, above
     every other equid and well below the fennec. */
  'Wild Ass': { legs: 0.1901, depth: 0.148, len: 0.1863, neck: 0.12, muzzle: 0.50, ears: 'large', tail: 'tuft', mane: 'crestUp', hue: '#b8ab93', family: 'equid', earShape: 'leaf', earScale: 1.62 },
  'Donkey': { legs: 0.1781, depth: 0.152, len: 0.1788, neck: 0.11, muzzle: 0.50, ears: 'large', tail: 'tuft', mane: 'crestUp', hue: '#9b948c', family: 'equid', earShape: 'leaf', earScale: 1.55 },
  'Gaur': { legs: 0.1561, depth: 0.1898, len: 0.2305, neck: 0.06, back: 'humped', muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'boss', hue: '#241c17', family: 'bovid' , stockings: '#e8e2d4', shoulderHump: 0.20, dewlap: 0.56, mammalEPlan: 'Gaur' },
  'Banteng': { legs: 0.1597, depth: 0.1629, len: 0.2137, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'boss', hue: '#7a4f30', family: 'bovid' , stockings: '#efe9dc' , accent: 'rumpPatch', faceMark: 'whiteBlaze', dewlap: 0.40 },
  'Buffalo': { legs: 0.142, depth: 0.1704, len: 0.2376, neck: 0.06, back: 'humped', muzzle: 0.48, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'boss', hue: '#3b302a', family: 'bovid', earShape: 'drop', earScale: 1.22, shoulderHump: 0.28, dewlap: 0.70, headScale: 1.12, mammalEPlan: 'Buffalo' },
  'Takin': { legs: 0.1306, depth: 0.1574, len: 0.2065, neck: 0.06, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'boss', coat: 'shaggy', hue: '#b59a63', family: 'bovid' },
  /* ★ wave 35 — Caribou and Reindeer sat at #a2917c and #a8917a: the same
     colour to six bits, on the same body, and the shaggy rim was doing all the
     separating. When wave 35 shortened that rim they crossed the confusable
     line. They are the same species, so proportion will never separate them —
     what separates them in life is COAT: the wild North American caribou is
     grey-brown with a pale neck ruff, the domesticated Eurasian reindeer is a
     warmer brown. Derived from the animals, not tuned to the gate. */
  'Caribou': { legs: 0.1823, depth: 0.1497, len: 0.1964, neck: 0.10, muzzle: 0.44, ears: 'large', tail: 'stub', horn: 'branched', coat: 'shaggy', hue: '#8d8b83', family: 'cervid', shoulderHump: 0.10, dewlap: 0.28 },
  'Okapi': { legs: 0.1924, depth: 0.1482, len: 0.1823, neck: 0.16, muzzle: 0.40, ears: 'large', tail: 'tuft', horn: 'ossicone', coat: 'bands', hue: '#5d3b28' , family: 'cervid' , legMarks: true , coatZone: [0.02, 0.40], coatRgb: [238, 231, 218] },
  /* ★ wave 35 — same pig-nose-disc bug as Tapir; see that row. */
  'Mountain Tapir': { legs: 0.1186, depth: 0.1436, len: 0.2002, neck: 0.05, back: 'arched', muzzle: 0.66, jaw: 'barrel', ears: 'small', tail: 'stub', coat: 'shaggy', hue: '#3f3a36', family: 'suid', skull: 'pachyderm', trunk: 0.16 },
  /* ★ wave 35 — it was wearing the ANTEATER'S 3.10-length tube snout, because
     it shares the xenarthran family with one. A sloth's face is the opposite:
     short, flat and round. It keeps the xenarthran BODY (the hooking claws are
     the family's) and takes a round short-muzzled skull. The 'stub' tail was
     the dark disc sitting on its shoulder — a sloth has no visible tail. */
  'Sloth': { legs: 0.0968, depth: 0.1414, len: 0.1484, neck: 0.06, back: 'roached', muzzle: 0.28, ears: 'tiny', tail: 'none', coat: 'shaggy', hue: '#8c8367', family: 'xenarthran', skull: 'procyonid', earShape: 'hidden' , pose: 'hang' },
  'Possum': { legs: 0.065, depth: 0.1026, len: 0.1598, neck: 0.05, carry: 0.35, muzzle: 0.58, ears: 'large', earShape: 'round', tail: 'long', coat: 'shaggy', hue: '#77736e', family: 'marsupial', muzzleHue: '#eee7da', mammalCPlan: 'marsupial-c1' },
  'Marsh Rodent': { legs: 0.0691, depth: 0.0894, len: 0.1789, neck: 0.05, muzzle: 0.34, ears: 'round', tail: 'long', hue: '#7b6448', family: 'rodent', mammalDPlan: 'Marsh Rodent' },
  /* ═══ ★ ARC STAGE 3 WAVE 1 — THE UNROUTED ICONICS ═══
     conformance [U]: these had NO override route, so the verbatim engine drew
     them and their reference mustRead features could not be expressed at all.
     A missing route is invisible to overridecheck by construction (D-ART-71).
     Each spec is derived from its port/v2/reference/fauna.json row. */

  /* "vertical black stripes over orange · white cheek ruff · long ringed tail" */
  'Tiger': { legs: 0.1317, depth: 0.1445, len: 0.2489, neck: 0.070, muzzle: 0.32, jaw: 'broad', ears: 'round', tail: 'banded', tailScale: 1.55, coat: 'stripes', hue: '#d98c2b', family: 'felid' , legMarks: true, mammalBPlan: 'felid-r1' },
  /* "bold stripes continuing onto the legs · stiff upright brush mane · tufted tail" */
  'Zebra': { legs: 0.1837, depth: 0.1567, len: 0.2056, neck: 0.120, muzzle: 0.44, ears: 'large', tail: 'tuft', mane: 'crestUp', coat: 'bands', hue: '#e8e4dc', family: 'equid' , legMarks: true },
  /* "black bandit mask · ringed banded tail · hunched arched back" */
  'Raccoon': { legs: 0.0769, depth: 0.121, len: 0.1905, neck: 0.040, carry: 0.45, tailScale: 1.35, back: 'roached', muzzle: 0.30, ears: 'round', tail: 'banded', face: 'mask', hue: '#777674', family: 'procyonid', mammalCPlan: 'procyonid-c1' },
  /* "flat scaly paddle tail · orange chisel incisors · stocky humped body" */
  'Capybara': { legs: 0.048, depth: 0.196, len: 0.238, neck: 0.022, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'none', hue: '#8b5e3c', family: 'rodent', headScale: 1.22, foot: 'paw', pawScale: 1.24, webbedFeet: true, incisors: 'orange', carry: 0.24, mammalDPlan: 'Capybara' },
  'Agouti': { legs: 0.088, depth: 0.112, len: 0.152, neck: 0.04, back: 'roached', muzzle: 0.34, ears: 'small', tail: 'none', hue: '#7a4b28', family: 'rodent', foot: 'cloven' },
  'Mara': { legs: 0.138, depth: 0.098, len: 0.158, neck: 0.05, muzzle: 0.36, ears: 'large', tail: 'none', hue: '#8c8375', family: 'rodent', mammalDPlan: 'Mara' },
  'Beaver': { legs: 0.0521, depth: 0.1186, len: 0.214, neck: 0.032, back: 'humped', muzzle: 0.26, jaw: 'broad', ears: 'tiny', tail: 'paddle', hue: '#6b4a30', family: 'rodent', incisors: 'orange', headScale: 1.12 },
  /* "long bushy ringed tail · white face mask with rust tear-stripes · black legs" */
  'Red Panda': { legs: 0.0741, depth: 0.1099, len: 0.1712, neck: 0.038, muzzle: 0.26, ears: 'large', tail: 'banded', tailScale: 1.80, face: 'tears', stockings: '#211d1c', hue: '#b5522a', family: 'procyonid', headScale: 1.18, mammalCPlan: 'procyonid-c1' },
  /* "back sloping sharply from high shoulders · massive neck and jaws · blotchy spots" */
  'Spotted Hyena': { legs: 0.1284, depth: 0.1442, len: 0.2128, neck: 0.080, back: 'sloped', muzzle: 0.34, jaw: 'broad', ears: 'round', tail: 'bushy', coat: 'spots', hue: '#a8916b', family: 'hyaenid', mammalBPlan: 'hyaenid-r1' },
  /* "sloping back · heavy jaws · vertical flank stripes and a long dorsal crest" */
  /* ★ wave 35 — `coat:'stripes'` is the TIGER's bar generator, and on a pale
     hyena it painted a hard-edged zebra saddle blanket. A striped hyena's
     stripes are faint vertical smudges mostly on the LEGS, which this engine
     structurally cannot paint (no marking reaches a leg), so plain is the
     honest read until that changes. */
  'Striped Hyena': { legs: 0.1338, depth: 0.1475, len: 0.1936, neck: 0.080, back: 'sloped', muzzle: 0.34, jaw: 'broad', ears: 'large', tail: 'bushy', coat: 'plain', hue: '#b8ac93', family: 'hyaenid', mane: 'hyena', mammalBPlan: 'hyaenid-r1' },
  /* "stout barrel body with NO visible tail · broad bare-nosed snout · bowed legs" */
  'Wombat': { legs: 0.0414, depth: 0.1249, len: 0.1947, neck: 0.024, muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'none', hue: '#8a7358', family: 'marsupial', clawScale: 1.55, headScale: 1.20, mammalCPlan: 'marsupial-c1' },
  /* "oversized blocky head and gaping jaws · white chest band · thick short tail" */
  /* ★ wave 35 — same miscast as Stoat: a devil's tail is a plain thick taper,
     never tufted. Its actual mark is the white chest blaze, which no per-species
     axis can reach yet (coatBlocks is hard-wired to the panda). */
  'Tasmanian Devil': { legs: 0.0515, depth: 0.132, len: 0.185, neck: 0.028, muzzle: 0.40, jaw: 'broad', carry: 0.45, accent: 'chestBlaze', ears: 'round', tail: 'thick', tailScale: 0.72, hue: '#211f20', family: 'marsupial', headScale: 1.42, mammalCPlan: 'marsupial-c1' },
  /* "white spots over the back AND the tail · pointed pink snout · low slinking body" */
  'Quoll': { legs: 0.0602, depth: 0.0901, len: 0.172, neck: 0.034, muzzle: 0.38, ears: 'round', tail: 'bushy', tailScale: 1.55, coat: 'spots', hue: '#6f4c35', family: 'marsupial', muzzleHue: '#d88782', mammalCPlan: 'marsupial-c1' },
  /* "trunk to the ground · huge fan ears · pillar legs and a dipped saddle back" */
  'Elephant': { legs: 0.1136, depth: 0.2312, len: 0.2465, neck: 0.028, muzzle: 0.30, jaw: 'barrel', ears: 'fan', tail: 'tuft', trunk: true, horn: 'tuskdown', hue: '#8b8785', family: 'pachyderm' , back: 'saddle' },
  'African Elephant': { legs: 0.1154, depth: 0.2276, len: 0.2613, neck: 0.028, muzzle: 0.30, jaw: 'barrel', ears: 'fan', earScale: 1.30, tail: 'tuft', trunk: true, horn: 'tuskdown', hue: '#8a8580', family: 'pachyderm' , back: 'saddle' },
  'Asian Elephant': { legs: 0.1093, depth: 0.2186, len: 0.251, neck: 0.028, back: 'arched', muzzle: 0.30, jaw: 'barrel', ears: 'fan', earScale: 0.80, tail: 'tuft', trunk: true, hue: '#94908c', family: 'pachyderm' },
  'Forest Elephant': { legs: 0.1024, depth: 0.2162, len: 0.2305, neck: 0.028, muzzle: 0.30, jaw: 'barrel', ears: 'fan', earScale: 0.92, tail: 'tuft', trunk: true, horn: 'tuskdown', hue: '#7d7873', family: 'pachyderm' , back: 'saddle' },
  /* "banded bony shell over the back · long tapering tail · digging claws" */
  'Armadillo': { legs: 0.0475, depth: 0.0983, len: 0.1934, neck: 0.030, back: 'arched', muzzle: 0.32, ears: 'large', tail: 'long', coat: 'banded', hue: '#a89880', family: 'xenarthran', earShape: 'leaf' , mat: 'plate' },
  /* "enormously long tubular snout · huge plume tail · black shoulder wedge" */
  'Giant Anteater': { legs: 0.0913, depth: 0.1049, len: 0.2237, neck: 0.048, muzzle: 0.78, jaw: 'fine', ears: 'tiny', tail: 'plume', tailScale: 1.6, hue: '#6b6259', family: 'xenarthran' },
  /* "overlapping keratin scales · long heavy tail · small conical head" */
  'Pangolin': { legs: 0.053, depth: 0.1126, len: 0.1754, neck: 0.032, back: 'arched', muzzle: 0.34, ears: 'tiny', tail: 'long', tailScale: 1.5, coat: 'plain', hue: '#9a8258', family: 'xenarthran' , mat: 'plate' },
  /* "gliding membrane between the limbs · black eye-stripe · long plume tail" */
  'Sugar Glider': { legs: 0.0535, depth: 0.0779, len: 0.115, neck: 0.028, muzzle: 0.24, ears: 'large', tail: 'plume', face: 'mask', hue: '#9aa0a8', family: 'marsupial', patagium: true, carry: 0.40, pose: 'glide', gliderPlan: 'sugar-glider' },
  /* "gliding membrane · huge forward eyes · mottled bark-coloured coat" */
  'Colugo': { legs: 0.0578, depth: 0.0937, len: 0.1229, neck: 0.030, muzzle: 0.26, ears: 'small', tail: 'long', coat: 'blotches', hue: '#8b7a63', patagium: true, carry: 0.40, pose: 'glide', gliderPlan: 'colugo' },
  /* ★ WAVE 10 — the pinnipeds had no route at all. They are the family plan
     wave 9 built: bulk resting on the ground, flippers instead of legs. The
     eared seals prop their chest UP on long fore-flippers; a true seal cannot,
     and that is the one thing that separates them. */
  'Seal': { legs: 0.024, depth: 0.1420, len: 0.3050, neck: 0.020, muzzle: 0.34, jaw: 'broad', ears: 'tiny', tail: 'stub', family: 'pinniped', hue: '#6f7683' },
  'Fur Seal': { legs: 0.052, depth: 0.1290, len: 0.2560, neck: 0.045, muzzle: 0.32, ears: 'large', tail: 'stub', family: 'pinniped', hue: '#5a4a3d', earShape: 'round', earScale: 0.70, headScale: 1.08, pinnipedPose: 'fur-seal' },
  'Sea Lion': { legs: 0.058, depth: 0.1360, len: 0.2740, neck: 0.052, muzzle: 0.34, jaw: 'broad', ears: 'large', tail: 'stub', family: 'pinniped', hue: '#6b5340', earShape: 'round', earScale: 0.78, headScale: 1.12, pinnipedPose: 'sea-lion' },
};
