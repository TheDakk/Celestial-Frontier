/* SYNTHETIC fixture records for the A11 family templates (not a test file).
 * These are hand-placed normalized landmarks that satisfy each template's
 * proportion envelope so the libraries can be proven mechanically. They are
 * NOT painter output and NOT anatomy evidence: every record is labelled
 * `synthetic` in ownerId, speciesVisualKey and cutoutAssetHash. Deterministic
 * (no clock, no randomness); `write-synthetic-fixtures.mjs` serializes them
 * and the tests assert the JSON on disk equals this generator. */
import { FA_LOCO } from '@cf/domain-speciestraits';
import type { MotionGenomeFields, ResolvedAnatomyRecord } from '../../apps/game/src/motion/index.js';

type LM = Record<string, readonly [number, number]>;
const shift = (lm: LM, names: readonly string[], dx: number, dy = 0): LM => Object.fromEntries(names.map((n) => [n, [+(lm[n]![0] + dx).toFixed(4), +(lm[n]![1] + dy).toFixed(4)] as const]));
const mirror = (lm: LM, from: string, to: string, n: number, cx = 0.5): LM => Object.fromEntries(Array.from({ length: n }, (_, i) => [to + 'Seg' + i, [+(2 * cx - lm[from + 'Seg' + i]![0]).toFixed(4), lm[from + 'Seg' + i]![1]] as const]));

const hopper = (): LM => {
  const far: LM = { hindFarRoot: [0.30, 0.60], hindFarKnee: [0.22, 0.70], hindFarAnkle: [0.30, 0.80], hindFarPaw: [0.40, 0.85], foreFarRoot: [0.60, 0.58], foreFarKnee: [0.60, 0.68], foreFarAnkle: [0.60, 0.78], foreFarPaw: [0.66, 0.85], earFarRoot: [0.72, 0.36], earFarTip: [0.70, 0.28] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.45, 0.55], pelvis: [0.32, 0.55], spine: [0.45, 0.50], chest: [0.58, 0.50], neck: [0.66, 0.46], head: [0.74, 0.42], jaw: [0.80, 0.47], ...far, ...near, tail0: [0.26, 0.58], tail1: [0.20, 0.62], tail2: [0.15, 0.66], tail3: [0.11, 0.70] };
};
const bird = (): LM => {
  const far: LM = { legFarKnee: [0.42, 0.62], legFarAnkle: [0.38, 0.74], legFarFoot: [0.46, 0.85], wingFarRoot: [0.52, 0.42], wingFarTip: [0.32, 0.40] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.46, 0.48], pelvis: [0.42, 0.50], spine: [0.50, 0.47], chest: [0.58, 0.45], neck0: [0.64, 0.38], neck1: [0.68, 0.30], head: [0.72, 0.24], beak: [0.80, 0.25], ...far, ...near, tailFan: [0.30, 0.52] };
};
const fish = (): LM => ({ root: [0.52, 0.50], head: [0.66, 0.50], jaw: [0.74, 0.54], spine0: [0.46, 0.50], spine1: [0.40, 0.50], spine2: [0.34, 0.50], spine3: [0.28, 0.50], spine4: [0.22, 0.50], spine5: [0.16, 0.50], caudal: [0.06, 0.50], dorsal: [0.40, 0.36], pectoralFar: [0.56, 0.60], pectoralNear: [0.58, 0.62] });
const insect = (): LM => {
  const far: LM = { legFrontFarKnee: [0.66, 0.62], legFrontFarFoot: [0.70, 0.75], legMidFarKnee: [0.56, 0.66], legMidFarFoot: [0.58, 0.80], legHindFarKnee: [0.46, 0.64], legHindFarFoot: [0.40, 0.78], antennaFar: [0.74, 0.40], wingFar: [0.36, 0.44] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.50, 0.55], thorax: [0.56, 0.53], head: [0.66, 0.50], mandible: [0.72, 0.53], abdomen: [0.36, 0.56], ...far, ...near };
};
const serpent = (): LM => ({ root: [0.60, 0.60], head: [0.70, 0.55], jaw: [0.76, 0.59], seg0: [0.54, 0.62], seg1: [0.48, 0.66], seg2: [0.42, 0.70], seg3: [0.36, 0.72], seg4: [0.30, 0.70], seg5: [0.24, 0.66], seg6: [0.18, 0.62], seg7: [0.12, 0.60], seg8: [0.07, 0.63], seg9: [0.03, 0.68] });
const arachnid = (): LM => {
  const far: LM = { leg1FarKnee: [0.68, 0.48], leg1FarFoot: [0.76, 0.70], leg2FarKnee: [0.62, 0.44], leg2FarFoot: [0.68, 0.72], leg3FarKnee: [0.50, 0.44], leg3FarFoot: [0.44, 0.72], leg4FarKnee: [0.44, 0.50], leg4FarFoot: [0.34, 0.74], cheliceraFar: [0.64, 0.58] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.50, 0.55], cephalothorax: [0.56, 0.54], abdomen: [0.40, 0.56], sting: [0.30, 0.50], ...far, ...near };
};
const radial = (): LM => {
  const right: LM = { arm0Seg0: [0.58, 0.44], arm0Seg1: [0.62, 0.56], arm0Seg2: [0.64, 0.70], arm2Seg0: [0.54, 0.46], arm2Seg1: [0.56, 0.60], arm2Seg2: [0.57, 0.74], arm4Seg0: [0.62, 0.40], arm4Seg1: [0.68, 0.50], arm4Seg2: [0.72, 0.62] };
  return { root: [0.50, 0.30], centre: [0.50, 0.34], bell: [0.50, 0.22], ...right, ...mirror(right, 'arm0', 'arm1', 3), ...mirror(right, 'arm2', 'arm3', 3), ...mirror(right, 'arm4', 'arm5', 3) };
};
const woody = (): LM => ({ root: [0.50, 0.90], trunk: [0.50, 0.55], branch0Base: [0.62, 0.45], branch0Tip: [0.72, 0.34], leaf0: [0.78, 0.26], branch1Base: [0.38, 0.42], branch1Tip: [0.28, 0.32], leaf1: [0.22, 0.24], branch2Base: [0.56, 0.36], branch2Tip: [0.60, 0.22], leaf2: [0.64, 0.12] });
const herb = (): LM => ({ root: [0.50, 0.90], stem0Seg0: [0.54, 0.74], stem0Seg1: [0.60, 0.58], stem0Seg2: [0.68, 0.44], frond0: [0.78, 0.36], stem1Seg0: [0.46, 0.74], stem1Seg1: [0.40, 0.58], stem1Seg2: [0.32, 0.44], frond1: [0.22, 0.36],
  stem2Seg0: [0.52, 0.72], stem2Seg1: [0.55, 0.54], stem2Seg2: [0.58, 0.36], frond2: [0.62, 0.24], stem3Seg0: [0.48, 0.72], stem3Seg1: [0.45, 0.54], stem3Seg2: [0.42, 0.36], frond3: [0.38, 0.24] });

const myriapod = (): LM => {
  const far: LM = { legAFarKnee: [0.50, 0.70], legAFarFoot: [0.52, 0.80], legBFarKnee: [0.36, 0.71], legBFarFoot: [0.37, 0.81], legCFarKnee: [0.22, 0.70], legCFarFoot: [0.22, 0.80], legDFarKnee: [0.09, 0.68], legDFarFoot: [0.08, 0.78], antennaFar: [0.78, 0.50] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.55, 0.62], head: [0.70, 0.58], mandible: [0.76, 0.61], seg0: [0.48, 0.62], seg1: [0.41, 0.63], seg2: [0.34, 0.64], seg3: [0.27, 0.64], seg4: [0.20, 0.63], seg5: [0.13, 0.62], seg6: [0.07, 0.61], seg7: [0.02, 0.60], ...far, ...near };
};
const cephalopod = (): LM => {
  const left: LM = { arm0Seg0: [0.36, 0.66], arm0Seg1: [0.30, 0.76], arm0Seg2: [0.26, 0.86], arm1Seg0: [0.41, 0.68], arm1Seg1: [0.37, 0.80], arm1Seg2: [0.35, 0.92], arm2Seg0: [0.45, 0.70], arm2Seg1: [0.43, 0.82], arm2Seg2: [0.42, 0.94], arm3Seg0: [0.485, 0.70], arm3Seg1: [0.485, 0.83], arm3Seg2: [0.485, 0.95] };
  return { root: [0.50, 0.50], mantle: [0.50, 0.32], head: [0.50, 0.58], eyeFar: [0.44, 0.56], eyeNear: [0.56, 0.56], siphon: [0.42, 0.50], finFar: [0.42, 0.24], finNear: [0.58, 0.24], ...left, ...mirror(left, 'arm3', 'arm4', 3), ...mirror(left, 'arm2', 'arm5', 3), ...mirror(left, 'arm1', 'arm6', 3), ...mirror(left, 'arm0', 'arm7', 3) };
};
const flyer = (): LM => {
  const far: LM = { wingFarRoot: [0.50, 0.40], wingFarElbow: [0.36, 0.30], wingFarWrist: [0.20, 0.34], wingFarTip: [0.06, 0.46], legFarKnee: [0.42, 0.66], legFarFoot: [0.40, 0.76], earFarTip: [0.64, 0.26] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.50, 0.50], pelvis: [0.46, 0.56], spine: [0.50, 0.50], chest: [0.55, 0.44], neck: [0.60, 0.40], head: [0.66, 0.36], jaw: [0.70, 0.40], ...far, ...near, tail0: [0.40, 0.62] };
};
const primate = (): LM => {
  const far: LM = { armFarShoulder: [0.55, 0.36], armFarElbow: [0.60, 0.48], armFarHand: [0.62, 0.60], legFarHip: [0.47, 0.57], legFarKnee: [0.51, 0.68], legFarFoot: [0.49, 0.82] };
  const near = Object.fromEntries(Object.entries(shift(far, Object.keys(far), 0.02, 0.02)).map(([k, v]) => [k.replace('Far', 'Near'), v]));
  return { root: [0.50, 0.50], pelvis: [0.46, 0.54], spine: [0.48, 0.44], chest: [0.50, 0.34], neck: [0.52, 0.28], head: [0.54, 0.22], jaw: [0.59, 0.26], ...far, ...near, tail0: [0.40, 0.56], tail1: [0.34, 0.60], tail2: [0.30, 0.66] };
};

interface Synth { readonly family: string; readonly surface: string; readonly ground: number; readonly loco: string; readonly realm: string; readonly lm: () => LM; }
/** Family, painted surface (approximate for plants: bark→warty, herb→slick, see LOG-A11), ground line, FA_LOCO name, realm. */
export const SYNTHETIC: Readonly<Record<string, Synth>> = Object.freeze({
  hopper:       { family: 'frog',     surface: 'slick and wet', ground: 0.85, loco: 'leapers',          realm: 'amphibious', lm: hopper },
  'biped-bird': { family: 'bird',     surface: 'feathered',     ground: 0.85, loco: 'gliders',          realm: 'aerial',     lm: bird },
  fish:         { family: 'fish',     surface: 'scaled',        ground: 0.92, loco: 'swimmers',         realm: 'aquatic',    lm: fish },
  insect:       { family: 'insect',   surface: 'chitinous',     ground: 0.80, loco: 'tentacle-walkers', realm: 'land',       lm: insect },
  serpent:      { family: 'snake',    surface: 'scaled',        ground: 0.72, loco: 'burrowers',        realm: 'land',       lm: serpent },
  arachnid:     { family: 'arachnid', surface: 'chitinous',     ground: 0.74, loco: 'wall-clingers',    realm: 'land',       lm: arachnid },
  radial:       { family: 'jelly',    surface: 'translucent',   ground: 0.95, loco: 'drifters',         realm: 'aquatic',    lm: radial },
  'plant-woody': { family: 'tree',    surface: 'warty',         ground: 0.90, loco: 'grazers',          realm: 'land',       lm: woody },
  'plant-herb':  { family: 'fern',    surface: 'slick and wet', ground: 0.90, loco: 'grazers',          realm: 'land',       lm: herb },
  myriapod:     { family: 'myriapod', surface: 'chitinous',     ground: 0.82, loco: 'burrowers',        realm: 'land',       lm: myriapod },
  cephalopod:   { family: 'ceph',     surface: 'slick and wet', ground: 0.95, loco: 'jet-propelled swimmers', realm: 'aquatic', lm: cephalopod },
  'flyer-membrane': { family: 'bat',  surface: 'furred',        ground: 0.80, loco: 'gliders',          realm: 'aerial',     lm: flyer },
  primate:      { family: 'primate',  surface: 'furred',        ground: 0.84, loco: 'climbers',         realm: 'land',       lm: primate },
});
export const SYNTHETIC_IDS = Object.freeze(Object.keys(SYNTHETIC));
export function syntheticRecordOf(id: string): ResolvedAnatomyRecord {
  const s = SYNTHETIC[id]; if (!s) throw new Error('no synthetic fixture for ' + id);
  const index = SYNTHETIC_IDS.indexOf(id);
  return {
    kind: id, identity: { speciesVisualKey: `synthetic:${id}`, seed: 0xA1100 + index, ownerId: 'synthetic:a11-fixture', earthName: null },
    template: { id, version: 1 }, family: s.family,
    geometry: { cutoutAssetHash: 'synthetic-no-cutout', width: 1024, height: 1024, groundLineY: s.ground, depthLayers: [{ id: 'far', order: 0 }, { id: 'near', order: 1 }] },
    landmarks: s.lm(), materials: { surface: s.surface, sheenTier: 'painted', paletteSource: 'synthetic' }, clipSetId: id + '-v1',
    // A source habitat declaration is the intended path (battle-habitat.ts): non-fauna records require one, and the
    // genome inference reads habitat/locomotion genes the synthetic genomes do not carry (a 'drifters' jelly would
    // resolve aerial). Every synthetic record therefore declares the realm its table row names.
    habitat: { realm: s.realm as 'land' | 'aerial' | 'aquatic' | 'amphibious' | 'gas-giant', source: 'synthetic A11 fixture (not painter output)' },
  };
}
export function syntheticGenomeOf(id: string): MotionGenomeFields {
  const s = SYNTHETIC[id]; if (!s) throw new Error('no synthetic fixture for ' + id);
  return { size: 2, loco: (FA_LOCO as readonly string[]).indexOf(s.loco), realm: s.realm, kingdom: id.startsWith('plant') ? 'flora' : 'fauna' };
}
