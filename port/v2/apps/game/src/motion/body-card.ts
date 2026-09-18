import {specializedTemplate} from '../../../../tools/creature-animation/specialized-templates.mjs';
import {measureMotionScale} from '../../../../tools/creature-animation/motion-scale.mjs';
import {compileAmplitudeProfile} from './amplitude-profile.js';
import {poseProjectionSigns,poseProjectionScales} from '../../../../tools/creature-animation/pose-projection.mjs';
/* Motion Kit §3 body card compiler. Reads the painter's resolved-anatomy record
 * (the *.landmarks.json shape) and, for procedural creatures, the genome's
 * FA_* indices. Never invents anatomy: missing landmarks, unsupported
 * templates and out-of-envelope proportions refuse with a named reason.
 * Pure and clock-free; identical inputs give identical cards. */
import {resolveAnatomyInventory,type AnatomyPresence} from '../../../../tools/creature-animation/anatomy-inventory.mjs';
import {resolvePhysicalHabitat} from '../battle-habitat.js';
import {earthFaunaProfile} from '../earth-fauna-profiles.js';
import { FA_HEAD, FA_LOCO, FA_SKIN, FA_TAIL } from '@cf/domain-speciestraits';
import { classifyRealm } from '@cf/domain-genome';
import { isMotionFallback, resolveTemplate, type JointLimitDeg, type JointName, type MotionFallback, type MotionTemplate, type Vec2 } from './templates.js';
import { PLANT_TEMPLATE_IDS, templateIdForFamily } from './family-templates.js';
import { templateGaits } from './family-actions.js';
import { MASS_BY_SIZE_INDEX, MASS_CLASS, type MassClassName } from './timing.js';
import { materialFromSkinName, type Material, type Realm } from './secondary.js';

export interface ResolvedAnatomyRecord {
  readonly projection?:string;
  readonly kind: string;
  readonly anatomy?:AnatomyPresence;
  readonly habitat?:{readonly realm:Realm;readonly gait?:Gait;readonly source:string};
  readonly identity: { readonly speciesVisualKey: string; readonly seed: number; readonly ownerId: string; readonly earthName: string | null };
  readonly template: { readonly id: string; readonly version: number };
  /** A11: painter/rig family (mammal, bird, fish, tree, …); routed through TEMPLATE_BY_FAMILY and cross-checked against `template`. */
  readonly family?: string;
  readonly geometry: { readonly cutoutAssetHash: string; readonly width: number; readonly height: number; readonly groundLineY: number;
    readonly depthLayers: readonly { readonly id: string; readonly order: number }[]; readonly contactPolicy?: string };
  readonly landmarks: Readonly<Record<string, readonly number[]>>;
  readonly materials?: { readonly surface: string; readonly sheenTier?: string; readonly paletteSource?: string; readonly joints?: Readonly<Record<string,string>> };
  readonly clipSetId?: string;
  readonly boundsCheck?: { readonly inside: boolean; readonly clamped: readonly string[]; readonly boneLengths: Readonly<Record<string, number>> };
  readonly recipeHash?: string;
}
/** The genome fields the card reads (procedural creatures only). */
export interface MotionGenomeFields {
  readonly size?: number; readonly loco?: number; readonly skin?: number; readonly head?: number; readonly tail?: number;
  readonly lumin?: boolean; readonly realm?: string; readonly kingdom?: string; readonly habitat?: number; readonly [k: string]: unknown;
}
export type Gait = 'walk' | 'trot' | 'gallop' | 'hop' | 'slither' | 'crawl' | 'swim' | 'jet' | 'fly' | 'glide' | 'roll' | 'cling-crawl' | 'drift';
export type Weapon = 'bite' | 'claw' | 'gore' | 'tail' | 'sting' | 'peck' | 'headbutt' | 'constrict' | 'spit' | 'kick' | 'body';
export type PartGroup = 'body' | 'head' | 'legs' | 'tail' | 'ears' | 'wings' | 'fins' | 'antennae' | 'fronds' | 'arms';
export const PART_GROUPS: readonly PartGroup[] = Object.freeze(['body', 'head', 'legs', 'tail', 'ears', 'wings', 'fins', 'antennae', 'fronds', 'arms']);
export interface BodyPart { readonly joint: JointName; readonly parent: JointName; readonly group: PartGroup; readonly pivot: Vec2; readonly tip: Vec2; readonly boneLength: number; }
export interface SecondaryPart { readonly id: string; readonly driver: JointName; readonly joints: readonly JointName[]; readonly lagOrder: readonly number[]; readonly material: Material; readonly jointMaterials?: Readonly<Record<string,Material>>; readonly kind?: string; }
export interface ClampedBound { readonly id: string; readonly measured: number; readonly clamped: number; }
export interface BodyCard {
  readonly amplitudeProfile?:import('./amplitude-profile.js').AmplitudeProfile;
  readonly kind: 'body-card';
  readonly anatomy?:AnatomyPresence;
  readonly projectionSigns?:Readonly<Record<string,number>>;
  readonly projectionScales?:Readonly<Record<string,number>>;
  readonly identity: ResolvedAnatomyRecord['identity'];
  readonly recipeHash: string | null;
  readonly template: { readonly id: MotionTemplate['id']; readonly version: number; readonly clipSetId: string };
  readonly massClass: { readonly name: MassClassName; readonly multiplier: number };
  /** templateGait is one of the template library's approach:* verbs ('none' for plants). */
  readonly locomotion: { readonly loco: string | null; readonly gait: Gait; readonly templateGait: string };
  readonly realm: Realm;
  readonly materials: Readonly<Record<PartGroup, Material>>;
  readonly jointMaterials?: Readonly<Record<string,Material>>;
  readonly parts: readonly BodyPart[];
  readonly secondaryParts: readonly SecondaryPart[];
  readonly weapons: readonly Weapon[];
  readonly luminous: boolean;
  readonly bodyLength: number;
  readonly scaleLength: number;
  readonly scaleReference: import('../../../../tools/creature-animation/motion-scale.mjs').MotionScaleReference;
  readonly groundLineY: number;
  readonly landmarks: Readonly<Record<JointName, Vec2>>;
  readonly bounds: { readonly inside: boolean; readonly clamped: readonly ClampedBound[]; readonly limitsDeg: Readonly<Record<JointName, JointLimitDeg>>; /** Rest slack per leg chain in body lengths (B3 diagnostic; see LEG_SLACK_MIN_BL). */ readonly legSlack: Readonly<Record<string, number>> };
  readonly notes: readonly string[];
}
export type MotionRefusalReason = 'missing-record' | 'missing-landmarks' | 'joint-inventory' | 'family-mismatch' | 'unsupported-template' | 'out-of-bounds' | 'unsupported-materials';
export class MotionCompileError extends Error {
  readonly reason: MotionRefusalReason;
  readonly fallback: MotionFallback | null;
  constructor(reason: MotionRefusalReason, detail: string, fallback: MotionFallback | null = null) {
    super(`motion refused (${reason}): ${detail}`); this.name = 'MotionCompileError'; this.reason = reason; this.fallback = fallback;
  }
}
/** Named Earth species: the record owns anatomy and materials; gait/mass/weapons come from this table. */
const EARTH_SPECIES: Readonly<Record<string, { gait: Gait; loco: string; mass: MassClassName; weapons: readonly Weapon[] }>> = Object.freeze({
  'Civet':   { gait: 'walk', loco: 'climbers', mass: 'small',  weapons: ['bite', 'claw'] },
  'Frog': {gait:'hop',loco:'leapers',mass:'small',weapons:['bite']},
  'Red Fox': { gait: 'trot', loco: 'runners',  mass: 'medium', weapons: ['bite', 'claw'] },
});
const EARTH_DEFAULT = Object.freeze({ gait: 'walk' as Gait, loco: null, mass: 'medium' as MassClassName, weapons: ['bite', 'claw'] as readonly Weapon[] });
/** FA_LOCO name → approach gait. Every FA_LOCO entry must be here (contract-tested). */
export const LOCO_GAIT: Readonly<Record<string, Gait>> = Object.freeze({
  'grazers': 'walk', 'burrowers': 'walk', 'pack hunters': 'trot', 'gliders': 'glide', 'swimmers': 'swim', 'floaters': 'drift',
  'ambush predators': 'walk', 'climbers': 'walk', 'herd-beasts': 'trot', 'filter-feeders': 'drift', 'leapers': 'hop', 'drifters': 'drift',
  'runners': 'gallop', 'jet-propelled swimmers': 'jet', 'tentacle-walkers': 'crawl', 'rollers': 'roll', 'wall-clingers': 'cling-crawl', 'current-drifters': 'drift',
});
const HEAD_WEAPON: Readonly<Record<string, Weapon>> = Object.freeze({ 'fanged': 'bite', 'horned': 'gore', 'beaked': 'peck', 'mandibled': 'bite', 'domed and bulbous': 'headbutt' });
const TAIL_WEAPON: Readonly<Record<string, Weapon>> = Object.freeze({ 'whip-like': 'tail', 'spiked': 'tail', 'stinger-tipped': 'sting' });
const BOUND_TOLERANCE = 0.15;
/** Rest leg slack below this fraction of body length is noted on the card (kit §3 anatomy; the C2 planted-contact solver needs it). */
export const LEG_SLACK_MIN_BL = 0.03;
/** Natural weapons a template always carries [primary, secondary]; head/tail genome weapons are added around them as before. */
const TEMPLATE_WEAPONS: Readonly<Record<string, readonly Weapon[]>> = Object.freeze({
  quadruped: ['bite', 'claw'], hopper: ['bite', 'claw'], 'biped-bird': ['peck', 'claw'], fish: ['bite'], insect: ['bite'], serpent: ['bite', 'constrict'], arachnid: ['sting', 'bite'], radial: ['sting'], 'plant-woody': [], 'plant-herb': [],
  myriapod: ['bite', 'sting'], cephalopod: ['constrict', 'bite'], 'flyer-membrane': ['bite', 'claw'], primate: ['claw', 'bite'],
});
/** Gait a template falls back to when the card's FA_LOCO gait has no approach in its library (first approach verb in table order). */
const GAIT_FALLBACK: Readonly<Record<string, Record<string, string>>> = Object.freeze({ 'biped-bird': { fly: 'flight', glide: 'flight' }, insect: { fly: 'flight', glide: 'flight' }, radial: { jet: 'pulse', swim: 'pulse' }, fish: { jet: 'swim', drift: 'swim' }, serpent: { crawl: 'slither', swim: 'slither' }, arachnid: { crawl: 'scuttle', walk: 'scuttle', 'cling-crawl': 'scuttle' }, hopper: {},
  myriapod: { walk: 'crawl', 'cling-crawl': 'crawl', trot: 'crawl' }, cephalopod: { swim: 'jet', drift: 'jet', walk: 'crawl', 'cling-crawl': 'crawl' }, 'flyer-membrane': { fly: 'flight', glide: 'flight', walk: 'crawl', 'cling-crawl': 'crawl' }, primate: { 'cling-crawl': 'climb', crawl: 'walk', trot: 'walk', gallop: 'walk' } });
const groupOf = (joint: string): PartGroup =>
  /^tail|^abdomen$|^sting$/.test(joint) ? 'tail' : /^ear/.test(joint) ? 'ears' : /wing|tailFan/.test(joint) ? 'wings' : /caudal|dorsal|pectoral/.test(joint) ? 'fins' : /antenna/.test(joint) ? 'antennae'
  : /branch|leaf|stem|frond/.test(joint) ? 'fronds' : /^(arm(\d|Far|Near)|tentacle\d)/.test(joint) ? 'arms' : /^(neck\d?|head|jaw|beak|mandible|chelicera|eye)/.test(joint) ? 'head' : /^(pelvis|spine\d?|chest|thorax|cephalothorax|centre|bell|trunk|seg\d|mantle|siphon)$/.test(joint) ? 'body' : /^fin/.test(joint) ? 'fins' : 'legs';
const at = <T>(arr: readonly T[], i: number | undefined): T | undefined => typeof i === 'number' ? arr[((i | 0) % arr.length + arr.length) % arr.length] : undefined;
const realmFromLabel = (label: string): Realm =>
  /Aerial/.test(label) ? 'aerial' : /Aquatic/.test(label) ? 'aquatic' : /Amphibious/.test(label) ? 'amphibious' : /Gas Giant/.test(label) ? 'gas-giant' : 'land';

export function compileBodyCard(record: ResolvedAnatomyRecord, genome?: MotionGenomeFields): BodyCard {
  if (!record || typeof record !== 'object' || !record.identity || (!record.template && !record.family)) throw new MotionCompileError('missing-record', 'record lacks template/identity');
  // A11: the painter family routes to a template; when the record also names a template the two must agree.
  const familyTemplate = record.family ? templateIdForFamily(String(record.family)) : null;
  if (record.family && !familyTemplate) throw new MotionCompileError('unsupported-template', `family "${record.family}" routes to no motion template`, { kind: 'whole-portrait', templateId: String(record.family), reason: `family "${record.family}" has no motion library` });
  if (familyTemplate && record.template && String(record.template.id) !== familyTemplate) throw new MotionCompileError('family-mismatch', `family "${record.family}" routes to ${familyTemplate} but the record names template "${record.template.id}"`);
  const templateId = record.template ? String(record.template.id) : familyTemplate as string, templateVersion = record.template ? Number(record.template.version) : 1;
  const baseTemplate = resolveTemplate(templateId, templateVersion);
  if (isMotionFallback(baseTemplate)) throw new MotionCompileError('unsupported-template', baseTemplate.reason, baseTemplate);
  const resolved = resolveAnatomyInventory(baseTemplate,record.anatomy);
  if (isMotionFallback(resolved)) throw new MotionCompileError('unsupported-template', resolved.reason, resolved);
  if (record.kind !== resolved.id) throw new MotionCompileError('unsupported-template', `record kind "${record.kind}" is not ${resolved.id}`, { kind: 'whole-portrait', templateId, reason: `kind ${record.kind} does not match template ${resolved.id}` });
  const lmIn = record.landmarks;
  if (!lmIn || typeof lmIn !== 'object') throw new MotionCompileError('missing-landmarks', 'record has no landmarks');
  const landmarks: Record<JointName, Vec2> = {};
  for (const j of resolved.joints) {
    const p = lmIn[j];
    if (!Array.isArray(p) || p.length !== 2 || !p.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) throw new MotionCompileError('missing-landmarks', `landmark "${j}" missing or not a normalized [x,y] (${resolved.id} inventory: ${resolved.joints.length} joints)`);
    landmarks[j] = [p[0] as number, p[1] as number];
  }
  const foreign = Object.keys(lmIn).filter((j) => !resolved.joints.includes(j));
  if (foreign.length) throw new MotionCompileError('joint-inventory', `landmarks [${foreign.join(', ')}] are not in the ${resolved.id} joint inventory`);
  const bones: Record<JointName, number> = {};
  const specialized=specializedTemplate(resolved.id);
  const specialtyGroup=(joint:string):PartGroup=>{
   const role=specialized&&Object.entries(specialized.roles).find(([,names])=>names.includes(joint))?.[0];
   return role==='legs'?'legs':role==='sensors'?'antennae':role==='head'?'head':role==='claws'||role==='reach'?'arms':'body';
  };
  const parts: BodyPart[] = resolved.graph.map(([child, parent]) => {
    const pivot = landmarks[parent] as Vec2, tip = landmarks[child] as Vec2, boneLength = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
    bones[child] = boneLength;
    return { joint: child, parent, group: specialized?specialtyGroup(child):groupOf(child), pivot, tip, boneLength };
  });
  const clamped: ClampedBound[] = [];
  for (const b of resolved.proportions) {
    const v = b.measure(landmarks, bones);
    if (!Number.isFinite(v)) throw new MotionCompileError('out-of-bounds', `${b.id} is not finite`);
    if (v >= b.min && v <= b.max) continue;
    const limit = v < b.min ? b.min : b.max, over = Math.abs(v - limit) / limit;
    if (over > BOUND_TOLERANCE) throw new MotionCompileError('out-of-bounds', `${b.id}=${v.toFixed(4)} is ${(over * 100).toFixed(1)}% beyond [${b.min}, ${b.max}]`);
    clamped.push({ id: b.id, measured: v, clamped: limit });
  }
  const notes: string[] = [];
  const earth = record.identity.earthName ? (EARTH_SPECIES[record.identity.earthName] ?? EARTH_DEFAULT) : null;
  if (record.identity.earthName && !EARTH_SPECIES[record.identity.earthName]) notes.push(`earth species "${record.identity.earthName}" mass uncalibrated (medium); gait from physical habitat/anatomy`);
  // Mass, locomotion, weapons, luminous, realm.
  const massName: MassClassName = earth ? earth.mass : (at(MASS_BY_SIZE_INDEX, genome?.size) ?? 'medium');
  const locoName = earth ? earth.loco : (at(FA_LOCO as readonly string[], genome?.loco) ?? null);
  const physical=resolvePhysicalHabitat(record,genome);
  const habitatGait:Gait=physical.realm==='aquatic'?'swim':physical.realm==='aerial'||physical.realm==='gas-giant'?'fly':resolved.id==='hopper'?'hop':'walk';
  const gait: Gait = record.habitat?.gait ?? (record.identity.earthName ? EARTH_SPECIES[record.identity.earthName]?.gait ?? habitatGait : (locoName ? LOCO_GAIT[locoName] ?? habitatGait : habitatGait));
  const gaits = templateGaits(resolved.id), gaitAlias = GAIT_FALLBACK[resolved.id]?.[gait];
  const isPlant = PLANT_TEMPLATE_IDS.includes(resolved.id as typeof PLANT_TEMPLATE_IDS[number]);
  let templateGait: string = gaits.includes(gait) ? gait : gaitAlias && gaits.includes(gaitAlias) ? gaitAlias : gaits[0] ?? 'none';
  if (!isPlant && !gaits.includes(gait)) notes.push(`gait "${gait}" has no ${resolved.id} approach; using ${templateGait}`);
  if (isPlant) templateGait = 'none';
  const weapons: Weapon[] = [];
  const addWeapon = (w: Weapon | undefined): void => { if (w && !weapons.includes(w)) weapons.push(w); };
  const natural = TEMPLATE_WEAPONS[resolved.id] ?? (specializedTemplate(resolved.id)?[]:['bite', 'claw']);
  if (isPlant) { /* plants carry no weapons */ }
  else if (earth) {
    // Intent only. Runtime attacks still require observed parts and conditional weapon evidence.
    const verbs=earthFaunaProfile(record.identity.earthName!)?.intendedMoves??[];
    const vocabulary:Readonly<Record<string,Weapon>>={bite:'bite',claw:'claw',peck:'peck',headbutt:'headbutt',tail:'tail',strike:'bite',constrict:'constrict',mandible:'bite',lash:'constrict',punch:'claw',kick:'kick',body:'body','sting-arms':'sting'};
    for(const verb of verbs)addWeapon(vocabulary[verb]);
  }
  else if (!specialized) {
    const headName = earth ? undefined : at(FA_HEAD as readonly string[], genome?.head), tailName = earth ? undefined : at(FA_TAIL as readonly string[], genome?.tail);
    addWeapon(headName ? HEAD_WEAPON[headName] : undefined); addWeapon(natural[0]);
    if (tailName) addWeapon(TAIL_WEAPON[tailName]);
    addWeapon(natural[1]);
  }
  const luminous = genome?.lumin === true;
  const realm:Realm=physical.realm;
  notes.push('physical realm: '+physical.source);
  // Materials (CONTRACTS §5, 2026-09-13): the resolved-anatomy record is the authority because it
  // describes what the winning painter actually drew. The genome's FA_SKIN is read only when the
  // record omits `materials.surface`; that fallback, and any disagreement, is recorded in notes.
  const surface = record.materials?.surface ?? null;
  const recordMaterial = surface ? materialFromSkinName(surface) : null;
  let material: Material | null = recordMaterial;
  if (typeof genome?.skin === 'number') {
    const skinName = at(FA_SKIN as readonly string[], genome.skin), genomeMaterial = skinName ? materialFromSkinName(skinName) : null;
    if (genomeMaterial && surface === null && !record.identity.earthName) { material = genomeMaterial; notes.push(`materials: record omits surface; genome skin "${skinName}" used as fallback`); }
    else if (genomeMaterial && recordMaterial && recordMaterial !== genomeMaterial) notes.push(`materials: record surface "${surface}" wins over genome skin "${skinName}" (observer disagreement)`);
  }
  if (!material) throw new MotionCompileError('unsupported-materials', `surface "${surface}" maps to no kit material`);
  const materials = Object.freeze(Object.fromEntries(PART_GROUPS.map((g) => [g, material]))) as Readonly<Record<PartGroup, Material>>;
  const jointMaterials: Record<string,Material> = Object.fromEntries(resolved.joints.map(j=>[j,material]));
  for(const [joint,surface] of Object.entries(record.materials?.joints ?? {})){
    const selected=materialFromSkinName(surface);
    if(!resolved.joints.includes(joint)||!selected)throw new MotionCompileError('unsupported-materials','unknown joint/material '+joint+': '+surface);
    jointMaterials[joint]=selected;
  }
  // A mixed woody/foliage chain retains each source-owned material and lag order.
  const secondaryParts: SecondaryPart[] = resolved.secondaryChains.map(c=>({id:c.id,driver:c.driver,joints:c.joints,lagOrder:c.joints.map((_,i)=>i),material,jointMaterials:Object.fromEntries(c.joints.map(j=>[j,jointMaterials[j]!])),...(c.kind?{kind:c.kind}:{})}));
  // B3/C2 diagnostic: rest slack per two-bone leg chain (reach of Root→Knee→Ankle minus the rest vertical drop at the
  // rest horizontal offset), in body lengths. A collinear chain (slack near 0) cannot absorb any lift under a planted-paw
  // constraint (the fox foreNear refusal, C2 review 2026-09-13); it is an observer error in the record, so it is noted, not refused.
  const legSlack: Record<string, number> = {};
  for (const leg of resolved.legs) {
    const kneeJoint=leg+'Knee', kneeParent=resolved.graph.find(([j])=>j===kneeJoint)?.[1];
    const r = landmarks[leg + 'Root'] ?? (kneeParent?landmarks[kneeParent]:undefined), k = landmarks[kneeJoint], a = landmarks[leg + 'Ankle'] ?? landmarks[leg+'Foot'];
    if (!r || !k || !a) { notes.push('leg slack unavailable: '+leg+' lacks an observed two-bone chain'); continue; }
    const upper = Math.hypot(k[0] - r[0], k[1] - r[1]), lower = Math.hypot(a[0] - k[0], a[1] - k[1]), dx = a[0] - r[0], vertical = a[1] - r[1];
    const reach = Math.sqrt(Math.max(0, (upper + lower) ** 2 - dx * dx));
    legSlack[leg] = reach - vertical;
  }
  const [axisA, axisB] = resolved.bodyAxis ?? ['pelvis', 'chest'];
  const torso = landmarks[axisA] && landmarks[axisB] ? Math.hypot((landmarks[axisB] as Vec2)[0] - (landmarks[axisA] as Vec2)[0], (landmarks[axisB] as Vec2)[1] - (landmarks[axisA] as Vec2)[1]) : 0;
  const torsoClamp = clamped.find((c) => c.id === 'torso' || c.id === 'body');
  const bodyLength = torsoClamp ? torsoClamp.clamped : torso;
  const scale=measureMotionScale(resolved,landmarks);
  const slackBL = Object.freeze(Object.fromEntries(Object.entries(legSlack).map(([leg, v]) => [leg, bodyLength > 0 ? v / bodyLength : 0])));
  const straight = Object.entries(slackBL).filter(([, v]) => v < LEG_SLACK_MIN_BL).map(([leg, v]) => `${leg} ${(v * 100).toFixed(1)}%`);
  if (straight.length) notes.push(`leg slack under ${LEG_SLACK_MIN_BL * 100}% of body length (near-collinear rest chain; a planted paw cannot absorb lifts): ${straight.join(', ')}`);
  return {
    kind: 'body-card', amplitudeProfile:compileAmplitudeProfile(parts,scale.length,jointMaterials,poseProjectionScales(record)), ...(record.anatomy?{anatomy:structuredClone(record.anatomy)}:{}), projectionSigns:poseProjectionSigns(record), projectionScales:poseProjectionScales(record), identity: record.identity, recipeHash: record.recipeHash ?? null,
    template: { id: resolved.id, version: resolved.version, clipSetId: resolved.clipSetId },
    massClass: { name: massName, multiplier: MASS_CLASS[massName] },
    locomotion: { loco: locoName, gait, templateGait }, realm, materials, jointMaterials:Object.freeze(jointMaterials), parts, secondaryParts, weapons, luminous,
    bodyLength, scaleLength:scale.length, scaleReference:scale.reference, groundLineY: record.geometry.groundLineY, landmarks,
    bounds: { inside: clamped.length === 0, clamped, limitsDeg: resolved.limitsDeg, legSlack: slackBL }, notes,
  };
}
/** Battle-scene convenience: a card, or the labelled whole-portrait fallback for templates without a library. */
export function compileBodyCardOrFallback(record: ResolvedAnatomyRecord, genome?: MotionGenomeFields): BodyCard | MotionFallback {
  try { return compileBodyCard(record, genome); }
  catch (e) { if (e instanceof MotionCompileError && e.fallback) return e.fallback; throw e; }
}
