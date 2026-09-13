/* Motion Kit §3/§4 template registry. Joint graphs, joint limits and proportion
 * bounds live here as data; anatomy always comes from the resolved record.
 * The quadruped graph mirrors Codex's tools/creature-animation/quadruped-template.mjs
 * GRAPH (contract-tested in tests/motion-body-card.test.ts). No clock, no randomness.
 *
 * Rotation convention (all modules): a pose key is a BONE named by its child joint
 * and pivoting at its parent joint (`head` = neck→head about the neck, `jaw` =
 * head→jaw about the head, `foreNearKnee` = the near upper foreleg about the
 * shoulder). Positive = clockwise on screen for a right-facing body, so a positive
 * `spine` dips the front and a positive `head` pitches nose-down. `root` is the
 * whole-body rotation about the root landmark; root offsets are in body lengths. */
export type JointName = string;
export type Vec2 = readonly [number, number];
export interface JointLimitDeg { readonly min: number; readonly max: number; }
export interface ProportionBound {
  readonly id: string; readonly min: number; readonly max: number;
  /** Measures the bound from normalized landmarks and bone lengths. */
  readonly measure: (lm: Readonly<Record<JointName, Vec2>>, bones: Readonly<Record<JointName, number>>) => number;
}
export interface SecondaryChain { readonly id: string; readonly driver: JointName; readonly joints: readonly JointName[]; }
export interface MotionTemplate {
  readonly id: 'quadruped';
  readonly version: 1;
  readonly clipSetId: string;
  /** [child, parent] pairs, parents first — root is implicit. */
  readonly graph: readonly (readonly [JointName, JointName])[];
  readonly joints: readonly JointName[];
  readonly legs: readonly string[];
  readonly limitsDeg: Readonly<Record<JointName, JointLimitDeg>>;
  readonly secondaryChains: readonly SecondaryChain[];
  readonly proportions: readonly ProportionBound[];
}
export interface MotionFallback { readonly kind: 'whole-portrait'; readonly reason: string; readonly templateId: string; }

export const QUADRUPED_LEGS = Object.freeze(['hindFar', 'foreFar', 'hindNear', 'foreNear'] as const);
const legGraph = (id: string): (readonly [string, string])[] => [
  [id + 'Root', id.startsWith('hind') ? 'pelvis' : 'chest'], [id + 'Knee', id + 'Root'], [id + 'Ankle', id + 'Knee'], [id + 'Paw', id + 'Ankle'],
];
export const QUADRUPED_GRAPH: readonly (readonly [JointName, JointName])[] = Object.freeze([
  ['pelvis', 'root'], ['spine', 'pelvis'], ['chest', 'spine'], ['neck', 'chest'], ['head', 'neck'], ['jaw', 'head'],
  ...QUADRUPED_LEGS.flatMap(legGraph),
  ['tail0', 'pelvis'], ['tail1', 'tail0'], ['tail2', 'tail1'], ['tail3', 'tail2'],
  ['earFarRoot', 'head'], ['earFarTip', 'earFarRoot'], ['earNearRoot', 'head'], ['earNearTip', 'earNearRoot'],
].map((pair) => Object.freeze(pair) as readonly [JointName, JointName]));

/** Joint limits in degrees, by bone family. Tunable; poses beyond are clamped and flagged. */
const LIMIT_TABLE: readonly (readonly [RegExp, JointLimitDeg])[] = [
  [/^root$/, { min: -15, max: 15 }], [/^pelvis$/, { min: -20, max: 20 }], [/^spine$/, { min: -25, max: 25 }],
  [/^chest$/, { min: -20, max: 20 }], [/^neck$/, { min: -35, max: 35 }], [/^head$/, { min: -35, max: 35 }],
  [/^jaw$/, { min: -30, max: 5 }], [/Root$/, { min: -60, max: 60 }], [/Knee$/, { min: -75, max: 75 }],
  [/Ankle$/, { min: -60, max: 60 }], [/Paw$/, { min: -40, max: 40 }], [/^tail0$/, { min: -40, max: 40 }],
  [/^tail[123]$/, { min: -50, max: 50 }], [/Tip$/, { min: -40, max: 40 }],
];
const limitFor = (joint: JointName): JointLimitDeg => LIMIT_TABLE.find(([re]) => re.test(joint))?.[1] ?? { min: -30, max: 30 };
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need = <T>(v: T | undefined, what: string): T => { if (v === undefined) throw new Error('template bound: ' + what); return v; };

export const QUADRUPED_TEMPLATE: MotionTemplate = Object.freeze({
  id: 'quadruped', version: 1, clipSetId: 'quadruped-land-v1',
  graph: QUADRUPED_GRAPH,
  joints: Object.freeze(['root', ...QUADRUPED_GRAPH.map(([child]) => child)]),
  legs: QUADRUPED_LEGS,
  limitsDeg: Object.freeze(Object.fromEntries(['root', ...QUADRUPED_GRAPH.map(([c]) => c)].map((j) => [j, limitFor(j)]))),
  secondaryChains: Object.freeze([
    { id: 'tail', driver: 'pelvis', joints: Object.freeze(['tail0', 'tail1', 'tail2', 'tail3']) },
    { id: 'earFar', driver: 'head', joints: Object.freeze(['earFarRoot', 'earFarTip']) },
    { id: 'earNear', driver: 'head', joints: Object.freeze(['earNearRoot', 'earNearTip']) },
  ]),
  /* Same envelope as Codex's checkGeometry so both owners agree on "fits". */
  proportions: Object.freeze([
    { id: 'torso', min: 0.08, max: 0.65, measure: (lm) => dist(need(lm.pelvis, 'pelvis'), need(lm.chest, 'chest')) },
    { id: 'head', min: 0.015, max: 0.75, measure: (lm) => dist(need(lm.neck, 'neck'), need(lm.head, 'head')) },
    { id: 'head/torso', min: 0.02, max: 1.6, measure: (lm) => dist(need(lm.neck, 'neck'), need(lm.head, 'head')) / dist(need(lm.pelvis, 'pelvis'), need(lm.chest, 'chest')) },
    { id: 'bone-min', min: 0.001, max: 0.75, measure: (_, b) => Math.min(...Object.values(b)) },
    { id: 'bone-max', min: 0.001, max: 0.75, measure: (_, b) => Math.max(...Object.values(b)) },
    ...QUADRUPED_LEGS.map((leg) => ({
      id: 'leg/torso:' + leg, min: 0.25, max: 2.7,
      measure: (lm: Readonly<Record<JointName, Vec2>>, b: Readonly<Record<JointName, number>>) =>
        (need(b[leg + 'Knee'], leg) + need(b[leg + 'Ankle'], leg) + need(b[leg + 'Paw'], leg)) / dist(need(lm.pelvis, 'pelvis'), need(lm.chest, 'chest')),
    })),
  ]),
});

const REGISTRY: Readonly<Record<string, MotionTemplate>> = Object.freeze({ quadruped: QUADRUPED_TEMPLATE });
export const KNOWN_TEMPLATE_IDS = Object.freeze(Object.keys(REGISTRY));
/** Kit §3: an unsupported template compiles to the labelled whole-portrait fallback. */
export function resolveTemplate(id: string, version = 1): MotionTemplate | MotionFallback {
  const t = REGISTRY[id];
  if (!t) return { kind: 'whole-portrait', templateId: id, reason: `template "${id}" has no motion library (known: ${KNOWN_TEMPLATE_IDS.join(', ')})` };
  if (t.version !== version) return { kind: 'whole-portrait', templateId: id, reason: `template "${id}" v${version} is not v${t.version}` };
  return t;
}
export const isMotionFallback = (x: unknown): x is MotionFallback => typeof x === 'object' && x !== null && (x as MotionFallback).kind === 'whole-portrait';
