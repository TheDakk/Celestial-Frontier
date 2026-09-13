/* Motion Kit §4 family templates beyond quadruped (work package A11). Joint
 * graphs, joint limits and proportion envelopes as data; anatomy still comes
 * only from the resolved record. Joint names below are the STABLE strings the
 * observer must emit (see audits/LONG_SESSION_20260913/LOG-A11.md).
 * Rotation convention is templates.ts's: a key names the BONE by its child
 * joint, pivoting at its parent; + is clockwise for a right-facing body.
 *
 *  hopper      root pelvis spine chest neck head jaw · {hind,fore}{Far,Near}{Root,Knee,Ankle,Paw} · tail0..3 · ear{Far,Near}{Root,Tip}
 *              (the quadruped inventory verbatim: a hopper record is a quadruped record with folded hind limits)
 *  biped-bird  root pelvis spine chest neck0 neck1 head beak · leg{Far,Near}{Knee,Ankle,Foot} · wing{Far,Near}{Root,Tip} · tailFan
 *  fish        root head jaw spine0..spine5 caudal dorsal pectoralFar pectoralNear
 *  insect      root thorax head mandible abdomen · leg{Front,Mid,Hind}{Far,Near}{Knee,Foot} · antennaFar antennaNear · wingFar wingNear
 *  serpent     root head jaw seg0..seg9
 *  arachnid    root cephalothorax abdomen sting cheliceraFar cheliceraNear · leg{1,2,3,4}{Far,Near}{Knee,Foot}
 *  radial      root centre bell · arm{0..5}Seg{0,1,2}
 *  plant-woody root trunk · branch{0,1,2}{Base,Tip} · leaf{0,1,2}
 *  plant-herb  root · stem{0..3}Seg{0,1,2} · frond{0..3}                                                    */
import type { JointLimitDeg, JointName, MotionTemplate, ProportionBound, SecondaryChain, Vec2 } from './templates.js';

type Pair = readonly [JointName, JointName];
type Bones = Readonly<Record<JointName, number>>;
type LM = Readonly<Record<JointName, Vec2>>;
export type ChainKind = 'tail' | 'ear' | 'wing' | 'tailfan' | 'fin' | 'antenna' | 'frond' | 'bell' | 'arm';
export type FamilyTemplateId = 'hopper' | 'biped-bird' | 'fish' | 'insect' | 'serpent' | 'arachnid' | 'radial' | 'plant-woody' | 'plant-herb';
export const FAMILY_TEMPLATE_IDS: readonly FamilyTemplateId[] = Object.freeze(['hopper', 'biped-bird', 'fish', 'insect', 'serpent', 'arachnid', 'radial', 'plant-woody', 'plant-herb']);
export const PLANT_TEMPLATE_IDS: readonly FamilyTemplateId[] = Object.freeze(['plant-woody', 'plant-herb']);

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need = <T>(v: T | undefined, what: string): T => { if (v === undefined) throw new Error('template bound: ' + what); return v; };
/** A linear chain parent→names[0]→names[1]… */
const chain = (parent: JointName, names: readonly JointName[]): Pair[] => names.map((n, i) => [n, i === 0 ? parent : names[i - 1] as JointName] as const);
const seq = (prefix: string, n: number, parent: JointName): Pair[] => chain(parent, Array.from({ length: n }, (_, i) => prefix + i));
const sides = ['Far', 'Near'] as const;
const F = <T>(x: T): T => Object.freeze(x);
const boneBounds = (): ProportionBound[] => [
  { id: 'bone-min', min: 0.001, max: 0.75, measure: (_: LM, b: Bones) => Math.min(...Object.values(b)) },
  { id: 'bone-max', min: 0.001, max: 0.75, measure: (_: LM, b: Bones) => Math.max(...Object.values(b)) },
];
const axisBound = (a: JointName, b: JointName, min = 0.06, max = 0.85): ProportionBound => ({ id: 'body', min, max, measure: (lm) => dist(need(lm[a], a), need(lm[b], b)) });
const ratioBound = (id: string, joints: readonly JointName[], a: JointName, b: JointName, min: number, max: number): ProportionBound =>
  ({ id, min, max, measure: (lm, bones) => joints.reduce((s, j) => s + need(bones[j], j), 0) / dist(need(lm[a], a), need(lm[b], b)) });
const sec = (id: string, kind: ChainKind, driver: JointName, joints: readonly JointName[]): SecondaryChain => F({ id, kind, driver, joints: F(joints) });

interface Spec {
  readonly id: FamilyTemplateId; readonly clipSetId: string; readonly graph: readonly Pair[]; readonly legs: readonly string[];
  readonly limits: readonly (readonly [RegExp, JointLimitDeg])[]; readonly secondaryChains: readonly SecondaryChain[];
  readonly proportions: readonly ProportionBound[]; readonly bodyAxis: readonly [JointName, JointName];
}
const build = (s: Spec): MotionTemplate => {
  const joints = ['root', ...s.graph.map(([c]) => c)];
  const limitFor = (j: JointName): JointLimitDeg => s.limits.find(([re]) => re.test(j))?.[1] ?? { min: -30, max: 30 };
  return F({
    id: s.id, version: 1, clipSetId: s.clipSetId, graph: F(s.graph.map((p) => F(p))), joints: F(joints), legs: F(s.legs),
    limitsDeg: F(Object.fromEntries(joints.map((j) => [j, limitFor(j)]))), secondaryChains: F(s.secondaryChains), proportions: F(s.proportions), bodyAxis: F(s.bodyAxis),
  });
};

/* ---- hopper: the quadruped graph with folded hind limits and a short lean allowance ---- */
const QUAD_LEGS = ['hindFar', 'foreFar', 'hindNear', 'foreNear'] as const;
const hopperGraph: Pair[] = [
  ['pelvis', 'root'], ['spine', 'pelvis'], ['chest', 'spine'], ['neck', 'chest'], ['head', 'neck'], ['jaw', 'head'],
  ...QUAD_LEGS.flatMap((id) => chain(id.startsWith('hind') ? 'pelvis' : 'chest', [id + 'Root', id + 'Knee', id + 'Ankle', id + 'Paw'])),
  ...seq('tail', 4, 'pelvis'), ...chain('head', ['earFarRoot', 'earFarTip']), ...chain('head', ['earNearRoot', 'earNearTip']),
];
const HOPPER = build({
  id: 'hopper', clipSetId: 'hopper-land-v1', graph: hopperGraph, legs: QUAD_LEGS, bodyAxis: ['pelvis', 'chest'],
  limits: [[/^root$/, { min: -30, max: 30 }], [/^pelvis$/, { min: -25, max: 25 }], [/^spine$/, { min: -30, max: 30 }], [/^chest$/, { min: -20, max: 20 }],
    [/^(neck|head)$/, { min: -35, max: 35 }], [/^jaw$/, { min: -30, max: 5 }], [/^hind.*Root$/, { min: -70, max: 70 }], [/^hind.*(Knee|Ankle)$/, { min: -110, max: 110 }],
    [/^fore.*Root$/, { min: -60, max: 60 }], [/^fore.*Knee$/, { min: -75, max: 75 }], [/Ankle$/, { min: -60, max: 60 }], [/Paw$/, { min: -45, max: 45 }],
    [/^tail0$/, { min: -40, max: 40 }], [/^tail[123]$/, { min: -50, max: 50 }], [/Tip$/, { min: -40, max: 40 }]],
  secondaryChains: [sec('tail', 'tail', 'pelvis', ['tail0', 'tail1', 'tail2', 'tail3']), sec('earFar', 'ear', 'head', ['earFarRoot', 'earFarTip']), sec('earNear', 'ear', 'head', ['earNearRoot', 'earNearTip'])],
  proportions: [axisBound('pelvis', 'chest', 0.08, 0.65), ...boneBounds(), ...QUAD_LEGS.map((leg) => ratioBound('leg/torso:' + leg, [leg + 'Knee', leg + 'Ankle', leg + 'Paw'], 'pelvis', 'chest', 0.25, 3.2))],
});

/* ---- biped-bird ---- */
const birdLegs = sides.map((s) => 'leg' + s);
const BIRD = build({
  id: 'biped-bird', clipSetId: 'biped-bird-v1', legs: birdLegs, bodyAxis: ['pelvis', 'chest'],
  graph: [['pelvis', 'root'], ['spine', 'pelvis'], ['chest', 'spine'], ...chain('chest', ['neck0', 'neck1', 'head', 'beak']),
    ...birdLegs.flatMap((l) => chain('pelvis', [l + 'Knee', l + 'Ankle', l + 'Foot'])), ...sides.flatMap((s) => chain('chest', ['wing' + s + 'Root', 'wing' + s + 'Tip'])), ['tailFan', 'pelvis']],
  limits: [[/^root$/, { min: -25, max: 25 }], [/^(pelvis|chest)$/, { min: -20, max: 20 }], [/^spine$/, { min: -25, max: 25 }], [/^neck[01]$/, { min: -45, max: 45 }], [/^head$/, { min: -40, max: 40 }],
    [/^beak$/, { min: -30, max: 5 }], [/Knee$/, { min: -70, max: 70 }], [/Ankle$/, { min: -85, max: 85 }], [/Foot$/, { min: -45, max: 45 }], [/^wing.*Root$/, { min: -60, max: 95 }], [/^wing.*Tip$/, { min: -70, max: 70 }], [/^tailFan$/, { min: -40, max: 40 }]],
  secondaryChains: [sec('wingFar', 'wing', 'chest', ['wingFarRoot', 'wingFarTip']), sec('wingNear', 'wing', 'chest', ['wingNearRoot', 'wingNearTip']), sec('tailFan', 'tailfan', 'pelvis', ['tailFan'])],
  proportions: [axisBound('pelvis', 'chest', 0.06, 0.65), ...boneBounds(), ...birdLegs.map((l) => ratioBound('leg/torso:' + l, [l + 'Knee', l + 'Ankle', l + 'Foot'], 'pelvis', 'chest', 0.3, 3.5)),
    ratioBound('wing/torso', ['wingFarRoot', 'wingFarTip'], 'pelvis', 'chest', 0.4, 4.5)],
});

/* ---- fish ---- */
const spine6 = Array.from({ length: 6 }, (_, i) => 'spine' + i);
const FISH = build({
  id: 'fish', clipSetId: 'fish-aquatic-v1', legs: [], bodyAxis: ['spine0', 'spine5'],
  graph: [['head', 'root'], ['jaw', 'head'], ...seq('spine', 6, 'root'), ['caudal', 'spine5'], ['dorsal', 'spine1'], ['pectoralFar', 'root'], ['pectoralNear', 'root']],
  limits: [[/^root$/, { min: -30, max: 30 }], [/^head$/, { min: -30, max: 30 }], [/^jaw$/, { min: -35, max: 5 }], [/^spine[0-5]$/, { min: -35, max: 35 }], [/^caudal$/, { min: -50, max: 50 }], [/^dorsal$/, { min: -35, max: 35 }], [/^pectoral/, { min: -60, max: 60 }]],
  secondaryChains: [sec('caudal', 'fin', 'spine5', ['caudal']), sec('dorsal', 'fin', 'spine1', ['dorsal']), sec('pectoralFar', 'fin', 'root', ['pectoralFar']), sec('pectoralNear', 'fin', 'root', ['pectoralNear'])],
  proportions: [axisBound('spine0', 'spine5', 0.1, 0.85), ...boneBounds(), ratioBound('caudal/body', ['caudal'], 'spine0', 'spine5', 0.05, 0.9), ratioBound('head/body', ['head'], 'spine0', 'spine5', 0.04, 0.8)],
});

/* ---- insect ---- */
const insectLegs = ['Front', 'Mid', 'Hind'].flatMap((p) => sides.map((s) => 'leg' + p + s));
const INSECT = build({
  id: 'insect', clipSetId: 'insect-v1', legs: insectLegs, bodyAxis: ['abdomen', 'head'],
  graph: [['thorax', 'root'], ['head', 'thorax'], ['mandible', 'head'], ['abdomen', 'thorax'], ...insectLegs.flatMap((l) => chain('thorax', [l + 'Knee', l + 'Foot'])),
    ['antennaFar', 'head'], ['antennaNear', 'head'], ['wingFar', 'thorax'], ['wingNear', 'thorax']],
  limits: [[/^root$/, { min: -25, max: 25 }], [/^thorax$/, { min: -15, max: 15 }], [/^head$/, { min: -35, max: 35 }], [/^mandible$/, { min: -40, max: 5 }], [/^abdomen$/, { min: -35, max: 50 }],
    [/Knee$/, { min: -65, max: 65 }], [/Foot$/, { min: -75, max: 75 }], [/^antenna/, { min: -50, max: 50 }], [/^wing/, { min: -85, max: 85 }]],
  secondaryChains: [sec('antennaFar', 'antenna', 'head', ['antennaFar']), sec('antennaNear', 'antenna', 'head', ['antennaNear']), sec('wingFar', 'wing', 'thorax', ['wingFar']), sec('wingNear', 'wing', 'thorax', ['wingNear'])],
  proportions: [axisBound('abdomen', 'head', 0.08, 0.85), ...boneBounds(), ...insectLegs.map((l) => ratioBound('leg/body:' + l, [l + 'Knee', l + 'Foot'], 'abdomen', 'head', 0.1, 2.5))],
});

/* ---- serpent ---- */
const SERPENT = build({
  id: 'serpent', clipSetId: 'serpent-v1', legs: [], bodyAxis: ['seg0', 'seg9'],
  graph: [['head', 'root'], ['jaw', 'head'], ...seq('seg', 10, 'root')],
  limits: [[/^root$/, { min: -25, max: 25 }], [/^head$/, { min: -50, max: 50 }], [/^jaw$/, { min: -45, max: 5 }], [/^seg\d$/, { min: -45, max: 45 }]],
  secondaryChains: [sec('tail', 'tail', 'seg6', ['seg7', 'seg8', 'seg9'])],
  proportions: [axisBound('seg0', 'seg9', 0.1, 0.9), ...boneBounds(), ratioBound('head/body', ['head'], 'seg0', 'seg9', 0.02, 0.5)],
});

/* ---- arachnid ---- */
const arachnidLegs = [1, 2, 3, 4].flatMap((n) => sides.map((s) => 'leg' + n + s));
const ARACHNID = build({
  id: 'arachnid', clipSetId: 'arachnid-v1', legs: arachnidLegs, bodyAxis: ['abdomen', 'cephalothorax'],
  graph: [['cephalothorax', 'root'], ['abdomen', 'cephalothorax'], ['sting', 'abdomen'], ['cheliceraFar', 'cephalothorax'], ['cheliceraNear', 'cephalothorax'],
    ...arachnidLegs.flatMap((l) => chain('cephalothorax', [l + 'Knee', l + 'Foot']))],
  limits: [[/^root$/, { min: -25, max: 25 }], [/^cephalothorax$/, { min: -15, max: 15 }], [/^abdomen$/, { min: -35, max: 65 }], [/^sting$/, { min: -70, max: 70 }], [/^chelicera/, { min: -45, max: 45 }], [/Knee$/, { min: -65, max: 65 }], [/Foot$/, { min: -75, max: 75 }]],
  secondaryChains: [sec('abdomen', 'tail', 'cephalothorax', ['abdomen', 'sting'])],
  proportions: [axisBound('abdomen', 'cephalothorax', 0.05, 0.7), ...boneBounds(), ...arachnidLegs.map((l) => ratioBound('leg/body:' + l, [l + 'Knee', l + 'Foot'], 'abdomen', 'cephalothorax', 0.15, 4))],
});

/* ---- radial ---- */
const arms = [0, 1, 2, 3, 4, 5].map((n) => 'arm' + n);
const RADIAL = build({
  id: 'radial', clipSetId: 'radial-v1', legs: [], bodyAxis: ['centre', 'bell'],
  graph: [['centre', 'root'], ['bell', 'centre'], ...arms.flatMap((a) => chain('centre', [a + 'Seg0', a + 'Seg1', a + 'Seg2']))],
  limits: [[/^root$/, { min: -35, max: 35 }], [/^centre$/, { min: -15, max: 15 }], [/^bell$/, { min: -25, max: 25 }], [/Seg0$/, { min: -45, max: 45 }], [/Seg[12]$/, { min: -55, max: 55 }]],
  secondaryChains: [sec('bell', 'bell', 'centre', ['bell']), ...arms.map((a) => sec(a, 'arm', 'centre', [a + 'Seg0', a + 'Seg1', a + 'Seg2']))],
  proportions: [axisBound('centre', 'bell', 0.03, 0.6), ...boneBounds(), ...arms.map((a) => ratioBound('arm/bell:' + a, [a + 'Seg0', a + 'Seg1', a + 'Seg2'], 'centre', 'bell', 0.3, 8))],
});

/* ---- plants ---- */
const branches = [0, 1, 2].map((n) => 'branch' + n);
const WOODY = build({
  id: 'plant-woody', clipSetId: 'plant-woody-v1', legs: [], bodyAxis: ['root', 'trunk'],
  graph: [['trunk', 'root'], ...branches.flatMap((b, i) => [...chain('trunk', [b + 'Base', b + 'Tip']), ['leaf' + i, b + 'Tip'] as const])],
  limits: [[/^root$/, { min: -5, max: 5 }], [/^trunk$/, { min: -12, max: 12 }], [/Base$/, { min: -25, max: 25 }], [/Tip$/, { min: -35, max: 35 }], [/^leaf/, { min: -45, max: 45 }]],
  secondaryChains: branches.map((b, i) => sec(b, 'frond', 'trunk', [b + 'Base', b + 'Tip', 'leaf' + i])),
  proportions: [axisBound('root', 'trunk', 0.08, 0.8), ...boneBounds(), ...branches.map((b) => ratioBound('branch/trunk:' + b, [b + 'Base', b + 'Tip'], 'root', 'trunk', 0.1, 2.5))],
});
const stems = [0, 1, 2, 3].map((n) => 'stem' + n);
const HERB = build({
  id: 'plant-herb', clipSetId: 'plant-herb-v1', legs: [], bodyAxis: ['stem0Seg0', 'stem0Seg2'],
  graph: stems.flatMap((s, i) => [...chain('root', [s + 'Seg0', s + 'Seg1', s + 'Seg2']), ['frond' + i, s + 'Seg2'] as const]),
  limits: [[/^root$/, { min: -5, max: 5 }], [/Seg0$/, { min: -25, max: 25 }], [/Seg[12]$/, { min: -40, max: 40 }], [/^frond/, { min: -50, max: 50 }]],
  secondaryChains: stems.map((s, i) => sec(s, 'frond', 'root', [s + 'Seg0', s + 'Seg1', s + 'Seg2', 'frond' + i])),
  proportions: [axisBound('stem0Seg0', 'stem0Seg2', 0.04, 0.8), ...boneBounds(), ...stems.map((s) => ratioBound('stem/stem0:' + s, [s + 'Seg1', s + 'Seg2'], 'stem0Seg0', 'stem0Seg2', 0.2, 4))],
});

export const FAMILY_TEMPLATES: Readonly<Record<FamilyTemplateId, MotionTemplate>> = F({
  hopper: HOPPER, 'biped-bird': BIRD, fish: FISH, insect: INSECT, serpent: SERPENT, arachnid: ARACHNID, radial: RADIAL, 'plant-woody': WOODY, 'plant-herb': HERB,
});
/** Painter family / rig family / flora architecture → template. Unlisted families have no motion library (whole-portrait fallback). */
export const TEMPLATE_BY_FAMILY: Readonly<Record<string, FamilyTemplateId | 'quadruped'>> = F({
  mammal: 'quadruped', reptile: 'quadruped', amphibian: 'quadruped', turtle: 'quadruped', quadruped: 'quadruped',
  frog: 'hopper', hopper: 'hopper', leaper: 'hopper',
  bird: 'biped-bird', fish: 'fish', marine: 'fish', insect: 'insect', arachnid: 'arachnid', crust: 'arachnid', snake: 'serpent', serpent: 'serpent',
  jelly: 'radial', sessile: 'radial', radial: 'radial',
  tree: 'plant-woody', shrub: 'plant-woody', vine: 'plant-woody', cane: 'plant-woody',
  fern: 'plant-herb', grass: 'plant-herb', rosette: 'plant-herb', seaweed: 'plant-herb', fungal: 'plant-herb',
});
export const templateIdForFamily = (family: string): FamilyTemplateId | 'quadruped' | null => TEMPLATE_BY_FAMILY[family.toLowerCase()] ?? null;
