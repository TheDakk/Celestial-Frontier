/* Motion Kit §3 body card compiler. Reads the painter's resolved-anatomy record
 * (the *.landmarks.json shape) and, for procedural creatures, the genome's
 * FA_* indices. Never invents anatomy: missing landmarks, unsupported
 * templates and out-of-envelope proportions refuse with a named reason.
 * Pure and clock-free; identical inputs give identical cards. */
import { FA_HEAD, FA_LOCO, FA_SKIN, FA_TAIL } from '@cf/domain-speciestraits';
import { classifyRealm } from '@cf/domain-genome';
import { isMotionFallback, resolveTemplate, type JointLimitDeg, type JointName, type MotionFallback, type MotionTemplate, type Vec2 } from './templates.js';
import { MASS_BY_SIZE_INDEX, MASS_CLASS, type MassClassName } from './timing.js';
import { materialFromSkinName, type Material, type Realm } from './secondary.js';

export interface ResolvedAnatomyRecord {
  readonly kind: string;
  readonly identity: { readonly speciesVisualKey: string; readonly seed: number; readonly ownerId: string; readonly earthName: string | null };
  readonly template: { readonly id: string; readonly version: number };
  readonly geometry: { readonly cutoutAssetHash: string; readonly width: number; readonly height: number; readonly groundLineY: number;
    readonly depthLayers: readonly { readonly id: string; readonly order: number }[]; readonly contactPolicy?: string };
  readonly landmarks: Readonly<Record<string, readonly number[]>>;
  readonly materials?: { readonly surface: string; readonly sheenTier?: string; readonly paletteSource?: string };
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
export type Weapon = 'bite' | 'claw' | 'gore' | 'tail' | 'sting' | 'peck' | 'headbutt' | 'constrict' | 'spit';
export type PartGroup = 'body' | 'head' | 'legs' | 'tail' | 'ears';
export interface BodyPart { readonly joint: JointName; readonly parent: JointName; readonly group: PartGroup; readonly pivot: Vec2; readonly tip: Vec2; readonly boneLength: number; }
export interface SecondaryPart { readonly id: string; readonly driver: JointName; readonly joints: readonly JointName[]; readonly lagOrder: readonly number[]; readonly material: Material; }
export interface ClampedBound { readonly id: string; readonly measured: number; readonly clamped: number; }
export interface BodyCard {
  readonly kind: 'body-card';
  readonly identity: ResolvedAnatomyRecord['identity'];
  readonly recipeHash: string | null;
  readonly template: { readonly id: MotionTemplate['id']; readonly version: number; readonly clipSetId: string };
  readonly massClass: { readonly name: MassClassName; readonly multiplier: number };
  readonly locomotion: { readonly loco: string | null; readonly gait: Gait; readonly templateGait: 'walk' | 'trot' | 'gallop' | 'hop' };
  readonly realm: Realm;
  readonly materials: Readonly<Record<PartGroup, Material>>;
  readonly parts: readonly BodyPart[];
  readonly secondaryParts: readonly SecondaryPart[];
  readonly weapons: readonly Weapon[];
  readonly luminous: boolean;
  readonly bodyLength: number;
  readonly groundLineY: number;
  readonly landmarks: Readonly<Record<JointName, Vec2>>;
  readonly bounds: { readonly inside: boolean; readonly clamped: readonly ClampedBound[]; readonly limitsDeg: Readonly<Record<JointName, JointLimitDeg>> };
  readonly notes: readonly string[];
}
export type MotionRefusalReason = 'missing-record' | 'missing-landmarks' | 'unsupported-template' | 'out-of-bounds' | 'unsupported-materials';
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
const TEMPLATE_GAITS = new Set<Gait>(['walk', 'trot', 'gallop', 'hop']);
const groupOf = (joint: string): PartGroup => /^tail/.test(joint) ? 'tail' : /^ear/.test(joint) ? 'ears' : /^(neck|head|jaw)$/.test(joint) ? 'head' : /^(pelvis|spine|chest)$/.test(joint) ? 'body' : 'legs';
const at = <T>(arr: readonly T[], i: number | undefined): T | undefined => typeof i === 'number' ? arr[((i | 0) % arr.length + arr.length) % arr.length] : undefined;
const realmFromLabel = (label: string): Realm =>
  /Aerial/.test(label) ? 'aerial' : /Aquatic/.test(label) ? 'aquatic' : /Amphibious/.test(label) ? 'amphibious' : /Gas Giant/.test(label) ? 'gas-giant' : 'land';

export function compileBodyCard(record: ResolvedAnatomyRecord, genome?: MotionGenomeFields): BodyCard {
  if (!record || typeof record !== 'object' || !record.template || !record.identity) throw new MotionCompileError('missing-record', 'record lacks template/identity');
  const resolved = resolveTemplate(String(record.template.id), Number(record.template.version));
  if (isMotionFallback(resolved)) throw new MotionCompileError('unsupported-template', resolved.reason, resolved);
  if (record.kind !== resolved.id) throw new MotionCompileError('unsupported-template', `record kind "${record.kind}" is not ${resolved.id}`, { kind: 'whole-portrait', templateId: String(record.template.id), reason: `kind ${record.kind} does not match template ${resolved.id}` });
  const lmIn = record.landmarks;
  if (!lmIn || typeof lmIn !== 'object') throw new MotionCompileError('missing-landmarks', 'record has no landmarks');
  const landmarks: Record<JointName, Vec2> = {};
  for (const j of resolved.joints) {
    const p = lmIn[j];
    if (!Array.isArray(p) || p.length !== 2 || !p.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) throw new MotionCompileError('missing-landmarks', `landmark "${j}" missing or not a normalized [x,y]`);
    landmarks[j] = [p[0] as number, p[1] as number];
  }
  const bones: Record<JointName, number> = {};
  const parts: BodyPart[] = resolved.graph.map(([child, parent]) => {
    const pivot = landmarks[parent] as Vec2, tip = landmarks[child] as Vec2, boneLength = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
    bones[child] = boneLength;
    return { joint: child, parent, group: groupOf(child), pivot, tip, boneLength };
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
  if (record.identity.earthName && !EARTH_SPECIES[record.identity.earthName]) notes.push(`earth species "${record.identity.earthName}" not in the named table; walk/medium defaults`);
  // Mass, locomotion, weapons, luminous, realm.
  const massName: MassClassName = earth ? earth.mass : (at(MASS_BY_SIZE_INDEX, genome?.size) ?? 'medium');
  const locoName = earth ? earth.loco : (at(FA_LOCO as readonly string[], genome?.loco) ?? null);
  const gait: Gait = earth ? earth.gait : (locoName ? LOCO_GAIT[locoName] ?? 'walk' : 'walk');
  if (!TEMPLATE_GAITS.has(gait)) { notes.push(`gait "${gait}" has no ${resolved.id} approach; using walk`); }
  const templateGait = (TEMPLATE_GAITS.has(gait) ? gait : 'walk') as BodyCard['locomotion']['templateGait'];
  const weapons: Weapon[] = [];
  const addWeapon = (w: Weapon | undefined): void => { if (w && !weapons.includes(w)) weapons.push(w); };
  if (earth) earth.weapons.forEach(addWeapon);
  else {
    const headName = at(FA_HEAD as readonly string[], genome?.head), tailName = at(FA_TAIL as readonly string[], genome?.tail);
    addWeapon(headName ? HEAD_WEAPON[headName] : undefined); addWeapon('bite');
    if (tailName) addWeapon(TAIL_WEAPON[tailName]);
    addWeapon('claw');
  }
  const luminous = genome?.lumin === true;
  let realm: Realm = 'land';
  if (genome?.realm && ['land', 'aerial', 'aquatic', 'amphibious', 'gas-giant'].includes(genome.realm)) realm = genome.realm as Realm;
  else if (genome && !earth && genome.kingdom === 'fauna') realm = realmFromLabel(String(classifyRealm(genome as Parameters<typeof classifyRealm>[0])));
  // Materials (CONTRACTS §5, 2026-09-13): the resolved-anatomy record is the authority because it
  // describes what the winning painter actually drew. The genome's FA_SKIN is read only when the
  // record omits `materials.surface`; that fallback, and any disagreement, is recorded in notes.
  const surface = record.materials?.surface ?? null;
  const recordMaterial = surface ? materialFromSkinName(surface) : null;
  let material: Material | null = recordMaterial;
  if (typeof genome?.skin === 'number') {
    const skinName = at(FA_SKIN as readonly string[], genome.skin), genomeMaterial = skinName ? materialFromSkinName(skinName) : null;
    if (genomeMaterial && !recordMaterial) { material = genomeMaterial; notes.push(`materials: record omits surface; genome skin "${skinName}" used as fallback`); }
    else if (genomeMaterial && recordMaterial && recordMaterial !== genomeMaterial) notes.push(`materials: record surface "${surface}" wins over genome skin "${skinName}" (observer disagreement)`);
  }
  if (!material) throw new MotionCompileError('unsupported-materials', `surface "${surface}" maps to no kit material`);
  const materials = Object.freeze({ body: material, head: material, legs: material, tail: material, ears: material });
  const secondaryParts: SecondaryPart[] = resolved.secondaryChains.map((c) => ({ id: c.id, driver: c.driver, joints: c.joints, lagOrder: c.joints.map((_, i) => i), material }));
  const torso = bones.chest !== undefined && bones.spine !== undefined ? Math.hypot((landmarks.chest as Vec2)[0] - (landmarks.pelvis as Vec2)[0], (landmarks.chest as Vec2)[1] - (landmarks.pelvis as Vec2)[1]) : 0;
  const torsoClamp = clamped.find((c) => c.id === 'torso');
  return {
    kind: 'body-card', identity: record.identity, recipeHash: record.recipeHash ?? null,
    template: { id: resolved.id, version: resolved.version, clipSetId: resolved.clipSetId },
    massClass: { name: massName, multiplier: MASS_CLASS[massName] },
    locomotion: { loco: locoName, gait, templateGait }, realm, materials, parts, secondaryParts, weapons, luminous,
    bodyLength: torsoClamp ? torsoClamp.clamped : torso, groundLineY: record.geometry.groundLineY, landmarks,
    bounds: { inside: clamped.length === 0, clamped, limitsDeg: resolved.limitsDeg }, notes,
  };
}
/** Battle-scene convenience: a card, or the labelled whole-portrait fallback for templates without a library. */
export function compileBodyCardOrFallback(record: ResolvedAnatomyRecord, genome?: MotionGenomeFields): BodyCard | MotionFallback {
  try { return compileBodyCard(record, genome); }
  catch (e) { if (e instanceof MotionCompileError && e.fallback) return e.fallback; throw e; }
}
