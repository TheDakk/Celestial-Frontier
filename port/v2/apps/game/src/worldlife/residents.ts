/** @module worldlife/residents [domain+app] — resident idle life on a landfall (Motion Kit §7 "everything
 * on stage breathes"). `planResidents` is pure: from the world's fauna rows and the card seed it picks one
 * to three residents (tier-bounded), places them in a depth band around the ground line without overlap,
 * scales them by depth and mass class, faces them, and gives each a seeded idle period and an alert
 * schedule. `ResidentIdleLayer` is the structural Pixi side: each resident is a whole-portrait rig (the A3
 * fallback rig, root offsets only) playing its idle clip on the injected clock with an occasional alert.
 * Portraits arrive asynchronously through the species art loader; a resident whose portrait fails is
 * recorded and skipped, never a thrown frame. No wall clock, no Math.random. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { createPortraitRig, portraitClip, samplePortraitClip, type PortraitClip } from '../battle2/fallback.js';
import type { BattleRigV1, RigContainerLike, RigNodeLike, RigSpriteLike } from '../battle2/fixture-rig.js';
import { MASS_BY_SIZE_INDEX, MASS_CLASS } from '../motion/timing.js';
import { portraitAlphaBox, type PortraitImage } from '../species-portrait.js';
import type { WorldLifeTierV1 } from './spec.js';

export const RESIDENT_PLAN_SCHEMA_V1 = 'cf.worldlife.residents/v1' as const;
export const RESIDENT_COUNT: Readonly<Record<WorldLifeTierV1, number>> = Object.freeze({ desktop: 3, phone: 1 });
/** Depth band around the ground line (frame fractions): nearer residents stand lower and draw larger. */
export const RESIDENT_BAND = Object.freeze({ above: 0.035, below: 0.03, xMin: 0.10, xMax: 0.90, minGap: 0.16 });
/** Creature height as a fraction of frame height at the far edge of the band and at the near edge, before mass. */
export const RESIDENT_HEIGHT = Object.freeze({ far: 0.16, near: 0.24 });
export const RESIDENT_ALERT = Object.freeze({ minGapMs: 6000, maxGapMs: 14000 });

export interface ResidentCandidate { readonly genome: Readonly<Record<string, unknown>>; readonly label: string; }
export interface ResidentV1 {
  readonly index: number; readonly label: string; readonly genome: Readonly<Record<string, unknown>>;
  readonly x: number; readonly footY: number; readonly depth: number; readonly height: number; readonly facing: 1 | -1;
  readonly mass: number; readonly seed: number; readonly alertEveryMs: number;
}
export interface ResidentPlanV1 { readonly schema: typeof RESIDENT_PLAN_SCHEMA_V1; readonly seed: number; readonly tier: WorldLifeTierV1; readonly groundLine: number; readonly residents: readonly ResidentV1[]; }

const massOf = (genome: Readonly<Record<string, unknown>>): number => {
  const size = genome.size; if (typeof size !== 'number' || !Number.isFinite(size)) return MASS_CLASS.medium;
  const n = MASS_BY_SIZE_INDEX.length; return MASS_CLASS[MASS_BY_SIZE_INDEX[(((size | 0) % n) + n) % n] ?? 'medium'];
};
const seedOf = (genome: Readonly<Record<string, unknown>>, fallback: number): number => (typeof genome.seed === 'number' && Number.isFinite(genome.seed) ? genome.seed >>> 0 : fallback >>> 0);

export function planResidents(candidates: readonly ResidentCandidate[], seed: number, tier: WorldLifeTierV1, groundLine = 0.78): ResidentPlanV1 {
  if (!Number.isFinite(seed)) throw new TypeError('planResidents: seed must be finite');
  if (tier !== 'desktop' && tier !== 'phone') throw new TypeError(`planResidents: unknown tier ${String(tier)}`);
  if (!(groundLine > 0 && groundLine < 1)) throw new RangeError('planResidents: groundLine must be inside (0,1)');
  const fauna = candidates.filter((c) => c && c.genome && typeof c.genome === 'object' && (c.genome.kingdom === undefined || c.genome.kingdom === 'fauna'));
  const rng = mulberry32(hashInt(seed >>> 0, fauna.length, 0x5e51) >>> 0);
  const count = Math.min(RESIDENT_COUNT[tier], fauna.length);
  // Seeded pick without replacement, then seeded slots with a minimum gap (rejection with a bounded retry, then evenly spaced).
  const pool = fauna.map((c, i) => ({ c, i })), picked: { c: ResidentCandidate; i: number }[] = [];
  for (let k = 0; k < count; k++) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  const xs: number[] = [];
  for (let k = 0; k < count; k++) {
    let x = 0, ok = false;
    for (let attempt = 0; attempt < 12 && !ok; attempt++) { x = RESIDENT_BAND.xMin + rng() * (RESIDENT_BAND.xMax - RESIDENT_BAND.xMin); ok = xs.every((o) => Math.abs(o - x) >= RESIDENT_BAND.minGap); }
    if (!ok) x = RESIDENT_BAND.xMin + ((k + 0.5) / count) * (RESIDENT_BAND.xMax - RESIDENT_BAND.xMin);
    xs.push(x);
  }
  const residents = picked.map(({ c, i }, k) => {
    const depth = rng(), footY = groundLine - RESIDENT_BAND.above + depth * (RESIDENT_BAND.above + RESIDENT_BAND.below), mass = massOf(c.genome);
    const height = (RESIDENT_HEIGHT.far + (RESIDENT_HEIGHT.near - RESIDENT_HEIGHT.far) * depth) * (0.85 + 0.15 * mass);
    const facing: 1 | -1 = rng() < 0.5 ? 1 : -1, s = hashInt(seed >>> 0, seedOf(c.genome, i), k) >>> 0;
    const alertEveryMs = RESIDENT_ALERT.minGapMs + Math.floor(rng() * (RESIDENT_ALERT.maxGapMs - RESIDENT_ALERT.minGapMs)) + 0.5;
    return Object.freeze({ index: i, label: c.label, genome: c.genome, x: xs[k]!, footY, depth, height, facing, mass, seed: s, alertEveryMs });
  }).sort((a, b) => a.footY - b.footY); // far to near = draw order
  return Object.freeze({ schema: RESIDENT_PLAN_SCHEMA_V1, seed: seed >>> 0, tier, groundLine, residents: Object.freeze(residents) });
}

/* ---------- structural layer ---------- */
export interface ResidentNodeLike extends RigContainerLike { x: number; y: number; visible: boolean; alpha: number; readonly scale: { set(x: number, y: number): unknown }; destroy(): void; }
export interface ResidentFactory { container(): ResidentNodeLike; portraitSprite(image: PortraitImage): RigSpriteLike; }
export interface ResidentIdleLayerOptions {
  readonly plan: ResidentPlanV1; readonly factory: ResidentFactory; readonly clock: () => number;
  readonly portrait: (genome: Readonly<Record<string, unknown>>) => Promise<PortraitImage>;
  readonly width: number; readonly height: number; readonly reducedMotion?: boolean;
}
export interface ResidentStatus { readonly planned: number; readonly placed: number; readonly pending: number; readonly failed: readonly string[]; }
interface Placed { readonly resident: ResidentV1; readonly rig: BattleRigV1; readonly holder: ResidentNodeLike; readonly idle: PortraitClip; readonly alert: PortraitClip; readonly scale: number; }

export class ResidentIdleLayer {
  readonly container: ResidentNodeLike;
  readonly ready: Promise<ResidentStatus>;
  readonly #o: ResidentIdleLayerOptions; readonly #origin: number;
  readonly #placed: Placed[] = []; readonly #failed: string[] = [];
  #pending: number; #width: number; #height: number; #reduced: boolean; #disposed = false;

  constructor(o: ResidentIdleLayerOptions) {
    this.#o = o; this.#origin = o.clock(); this.#width = o.width; this.#height = o.height; this.#reduced = o.reducedMotion === true;
    this.container = o.factory.container(); this.#pending = o.plan.residents.length;
    this.ready = Promise.all(o.plan.residents.map((r) => this.#load(r))).then(() => this.status());
  }
  status(): ResidentStatus { return Object.freeze({ planned: this.#o.plan.residents.length, placed: this.#placed.length, pending: this.#pending, failed: Object.freeze([...this.#failed]) }); }
  get reducedMotion(): boolean { return this.#reduced; }
  setReducedMotion(on: boolean): void { this.#reduced = on; this.update(); }
  resize(width: number, height: number): void { this.#width = width; this.#height = height; for (const p of this.#placed) this.#fit(p); this.update(); }

  async #load(r: ResidentV1): Promise<void> {
    let image: PortraitImage;
    try { image = await this.#o.portrait(r.genome); } catch (error) { this.#pending--; this.#failed.push(`${r.label}: ${error instanceof Error ? error.message : String(error)}`); return; }
    if (this.#disposed) { this.#pending--; return; }
    const box = portraitAlphaBox(image.pixels(), image.width, image.height), f = this.#o.factory;
    const rig = createPortraitRig({ templateId: 'resident', recipeHash: `resident:${r.seed}`, cutout: { width: image.width, height: image.height }, alphaBox: box, factory: { container: () => f.container(), portraitSprite: () => f.portraitSprite(image) } });
    const holder = f.container(); const root = rig.root as ResidentNodeLike;
    root.x = -rig.foot.x * rig.cutout.width; root.y = -rig.foot.y * rig.cutout.height; holder.addChild(root as unknown as RigNodeLike);
    const placed: Placed = { resident: r, rig, holder, idle: portraitClip('idle', r.mass, r.seed), alert: portraitClip('alert', r.mass, r.seed ^ 0x5a5a), scale: 1 };
    this.#placed.push(placed); this.#placed.sort((a, b) => a.resident.footY - b.resident.footY);
    // Re-add in depth order so nearer residents draw over farther ones.
    for (const p of this.#placed) { this.container.removeChild(p.holder as unknown as RigNodeLike); this.container.addChild(p.holder as unknown as RigNodeLike); }
    this.#fit(placed); this.#pending--; this.update();
  }
  #fit(p: Placed): void {
    const targetPx = p.resident.height * this.#height, bodyPx = p.rig.bounds.height * p.rig.cutout.height;
    (p as { scale: number }).scale = bodyPx > 0 ? targetPx / bodyPx : 1;
  }
  /** Sample every placed resident at the injected clock; idempotent per clock value. */
  update(): void {
    if (this.#disposed) return;
    const ms = this.#reduced ? 0 : this.#o.clock() - this.#origin;
    for (const p of this.#placed) {
      const r = p.resident;
      const alertLocal = ((ms % r.alertEveryMs) + r.alertEveryMs) % r.alertEveryMs;
      const pose = !this.#reduced && alertLocal < p.alert.durationMs ? addRoot(samplePortraitClip(p.idle, ms), samplePortraitClip(p.alert, alertLocal)) : samplePortraitClip(p.idle, ms);
      p.rig.applyPose(pose);
      p.holder.x = r.x * this.#width; p.holder.y = r.footY * this.#height; p.holder.scale.set(r.facing * p.scale, p.scale);
    }
  }
  dispose(): void {
    if (this.#disposed) return; this.#disposed = true;
    for (const p of this.#placed) { try { p.rig.dispose(); } catch { /* total */ } p.holder.destroy(); }
    this.#placed.length = 0; this.container.destroy();
  }
}
const addRoot = (a: ReturnType<typeof samplePortraitClip>, b: ReturnType<typeof samplePortraitClip>): ReturnType<typeof samplePortraitClip> => {
  const ra = a.root ?? { rotation: 0 }, rb = b.root ?? { rotation: 0 };
  return Object.freeze({ root: Object.freeze({ rotation: ra.rotation + rb.rotation, dx: (ra.dx ?? 0) + (rb.dx ?? 0), dy: (ra.dy ?? 0) + (rb.dy ?? 0) }) });
};
