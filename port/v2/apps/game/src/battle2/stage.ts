/** @module battle2/stage [app] — the Pixi 8 battle stage v2: renders a TurnPlan through a
 * BattleRigV1 per side (fixture / portrait / C2 parts), the effects player, the world-life
 * adapter (arena mode) and the three parallax plates. Structurally typed like the other adapters
 * (no pixi.js import; the wiring binds real classes). The clock is injected; dispose is total.
 * The combat outcome adapter at the bottom maps a @cf/domain-combatcore transcript log entry to a
 * TurnPlanInput; nothing here imports main.ts state. */
import type { EffectPhaseName, EffectSequenceAnchors } from '../effects/anchors.js';
import { EMITTER_PRESETS, type EmitterConfig } from '../effects/emitter.js';
import { EffectSequencePlayer, type EffectPixiHost, type EffectTextureLike } from '../effects/pixi-adapter.js';
import type { EffectDelivery } from '../effects/sequencer.js';
import type { BodyCard } from '../motion/body-card.js';
import { PLATE_ORDER, combatantScale, fitCombatantWidth, parallaxOffset, type ArenaLayout, type PlateId } from './arena.js';
/** D2 G6 — a guardian rig fills the frame (kit GUARDIAN RULE: "fills the battle screen"): its TALLEST pose
 * (`BattleRigV1.tallestHeight`, measured by the parts rig at load) spans this fraction of the frame height, so a rearing
 * melee stays inside the frame and under the HUD band. An option of `combatantScale`, not a species branch. Bear
 * (tallest = 1.38 × rest): rest height 0.70 of the frame at 0.96. Film -01 (rest at 0.9, head leaves the frame when
 * rearing) is kept beside film -02 for Nick's eye. */
export const GUARDIAN_FRAME_FILL = 0.96;
/** ONE sizing rule for a combatant's presentation (2026-09-24; used by the app wiring, the film harness and the tests — two
 * copies could disagree): the mass rule (or the guardian's decided tallest-pose fill), then the arena WIDTH cap for a long
 * body (guardians exempt). `height`/`footBelowCentre` are frame fractions at the returned scale, ready for the habitat's
 * band fit; `capped` says the scale differs from the stage's own mass rule. */
export function combatantPresentation(rig: Pick<BattleRigV1, 'bounds' | 'cutout' | 'foot' | 'guardian' | 'tallestHeight'>, mass: number, frame: Readonly<{ width: number; height: number }>): Readonly<{ scale: number; capped: boolean; height: number; footBelowCentre: number }> {
  const k = combatantScale(rig.bounds, rig.cutout.height, mass, frame.height, rig.guardian ? { frameFill: GUARDIAN_FRAME_FILL, ...(rig.tallestHeight !== undefined ? { tallestHeight: rig.tallestHeight } : {}) } : {});
  const scale = rig.guardian ? k.scale : fitCombatantWidth(k.scale, rig.bounds, rig.cutout.width, frame.width), f = scale / k.scale;
  return Object.freeze({ scale, capped: f < 1, height: k.heightFraction * f, footBelowCentre: ((rig.foot.y - 0.5) * rig.cutout.height * scale) / frame.height });
}
import { buildTurnPlan, sampleTurn, type Side, type StageSample, type TurnArena, type TurnAttack, type TurnPlan, type TurnPlanInput } from './choreography.js';
import { TurnCuePlayer, buildTurnCuePlan, type CueSink, type TurnCuePlan } from './cue-plan.js';
import type { BattleRigV1, RigNodeLike } from './fixture-rig.js';

export interface StageNodeLike extends RigNodeLike { alpha: number; readonly scale: { set(x: number, y: number): unknown }; }
export interface StageContainerLike extends StageNodeLike { addChild(child: object): unknown; removeChild(child: object): unknown; }
export interface StageSpriteLike extends StageNodeLike { readonly anchor: { set(x: number, y: number): unknown }; }
export interface StageTextLike extends StageNodeLike { text: string; }
export interface StageGraphicsLike extends StageNodeLike { clear(): unknown; rect(x: number, y: number, w: number, h: number): unknown; fill(style: Readonly<{ color: number; alpha: number }>): unknown; }
export interface BattleStageFactory { container(): StageContainerLike; sprite(texture: EffectTextureLike): StageSpriteLike; text(text: string): StageTextLike; graphics(): StageGraphicsLike; }
export interface WorldLifeLayerLike { readonly container: object; update(): unknown; dispose(): void; }
export interface BattleStageEffects {
  readonly host: EffectPixiHost; readonly particleTexture: EffectTextureLike; readonly seed: number;
  /** One texture per anchors phase, in phase order (resolved by keyedImage name at the wiring site); null = procedural phase, no sprite. */
  phaseTextures(anchors: EffectSequenceAnchors): readonly (EffectTextureLike | null)[];
  /** Theme emitter presets (Art Kit §4K materials); absent = the Motion Kit §7 defaults for every theme. */
  emittersForTheme?(theme: string): Readonly<Record<EffectPhaseName, EmitterConfig>>;
  /** Theme material colour for the particle views; absent = untinted. */
  tintForTheme?(theme: string): number;
}
/** Sound cues synced to the turn beats (B1): the sink receives each admitted cue once, on its beat, from the stage's own clock. */
export interface BattleStageCues { readonly sink: CueSink; readonly phone?: boolean; }
/** Optional diagnostic timing. Shared sampling covers both producers; rig timings cover
 * each applyPose (performance/contact/publication). Consumers sum every event in a frame,
 * including play()'s implicit tick, before computing any per-frame percentile. */
export interface StageCpuSample {
  readonly kind: 'tick' | 'rest';
  readonly sampleTurnMs: number;
  readonly rigMs: Readonly<Record<Side, number>>;
}
export interface BattleStageTiming {
  readonly now: () => number;
  readonly sample: (sample: StageCpuSample) => void;
}
export interface BattleStageOptions {
  readonly factory: BattleStageFactory; readonly clock: () => number; readonly layout: ArenaLayout;
  readonly plates: Readonly<Record<PlateId, EffectTextureLike>>;
  readonly rigs: Readonly<Record<Side, BattleRigV1>>; readonly masses: Readonly<Record<Side, number>>;
  readonly worldLife?: WorldLifeLayerLike | null; readonly effects?: BattleStageEffects | null; readonly reducedMotion?: boolean;
  readonly cues?: BattleStageCues | null;
  /** Explicit, measured presentation scales. Placement, width and cadence all use
   * these same values; absent preserves the mass/guardian rule exactly. */
  readonly presentationScales?: Readonly<Record<Side, number>>;
  readonly timing?: BattleStageTiming;
}
export interface StageFrame { readonly sample: StageSample; readonly done: boolean; readonly label: string; readonly cuesFired: number; }
export const HUD = Object.freeze({ barX: 16, barY: 12, barH: 8, cursorH: 14 });

export class BattleStage {
  readonly root: StageContainerLike;
  readonly label: string;
  readonly #o: BattleStageOptions;
  readonly #plates: Record<PlateId, StageSpriteLike>;
  readonly #holders: Record<Side, StageContainerLike>;
  readonly #scales: Record<Side, number>;
  readonly #fx: StageContainerLike; readonly #flash: StageGraphicsLike; readonly #bar: StageGraphicsLike; readonly #cursor: StageGraphicsLike; readonly #number: StageTextLike;
  #plan: TurnPlan | null = null; #startMs = 0; #player: EffectSequencePlayer | null = null; #fxNodes: object[] = []; #disposed = false;
  #cues: TurnCuePlayer | null = null;

  constructor(o: BattleStageOptions) {
    if (o.presentationScales && ['left', 'right'].some(side => {
      const value = o.presentationScales![side as Side];
      return !Number.isFinite(value) || value <= 0;
    })) throw new TypeError('battle2 stage: presentation scales must be finite and positive for both sides');
    this.#o = o;
    const f = o.factory, L = o.layout, w = L.frame.width;
    this.root = f.container();
    const plate = (id: PlateId): StageSpriteLike => { const p = L.plates.find((x) => x.id === id)!, s = f.sprite(o.plates[id]); s.anchor.set(0, 0); s.scale.set(p.scale, p.scale); s.x = p.x; s.y = p.y; return s; };
    this.#plates = { far: plate('far'), mid: plate('mid'), near: plate('near') };
    this.root.addChild(this.#plates.far); this.root.addChild(this.#plates.mid);
    if (o.worldLife) this.root.addChild(o.worldLife.container);
    const holder = (side: Side): StageContainerLike => {
      const rig = o.rigs[side], h = f.container(), r = rig.root as StageNodeLike;
      r.x = -rig.foot.x * rig.cutout.width; r.y = -rig.foot.y * rig.cutout.height; h.addChild(r as object);
      this.root.addChild(h); return h;
    };
    this.#scales = o.presentationScales ? { ...o.presentationScales } : { left: combatantScale(o.rigs.left.bounds, o.rigs.left.cutout.height, o.masses.left, L.frame.height, o.rigs.left.guardian ? { frameFill: GUARDIAN_FRAME_FILL, ...(o.rigs.left.tallestHeight !== undefined ? { tallestHeight: o.rigs.left.tallestHeight } : {}) } : {}).scale, right: combatantScale(o.rigs.right.bounds, o.rigs.right.cutout.height, o.masses.right, L.frame.height, o.rigs.right.guardian ? { frameFill: GUARDIAN_FRAME_FILL, ...(o.rigs.right.tallestHeight !== undefined ? { tallestHeight: o.rigs.right.tallestHeight } : {}) } : {}).scale };
    this.#holders = { left: holder('left'), right: holder('right') };
    this.#fx = f.container(); this.root.addChild(this.#fx);
    this.root.addChild(this.#plates.near);
    this.#flash = f.graphics(); this.#flash.rect(0, 0, w, L.frame.height); this.#flash.fill({ color: 0xffffff, alpha: 1 }); this.#flash.alpha = 0; this.root.addChild(this.#flash);
    this.#bar = f.graphics(); this.#cursor = f.graphics(); this.#number = f.text(''); this.#number.visible = false;
    this.root.addChild(this.#bar); this.root.addChild(this.#cursor); this.root.addChild(this.#number);
    this.label = `battle2 stage · left: ${o.rigs.left.label} · right: ${o.rigs.right.label}`;
    this.#place('left', 0, 1); this.#place('right', 0, -1);
    this.#applyRest();
  }

  get plan(): TurnPlan | null { return this.#plan; }
  /** The current turn's cue plan (null without a sink or before the first turn). */
  get cuePlan(): TurnCuePlan | null { return this.#cues?.plan ?? null; }
  cuesFired(): number { return this.#cues?.fired.length ?? 0; }
  /** Half the standing width of each rig at stage scale, as a fraction of frame width (the run-up stops at contact). */
  halfWidths(): Readonly<{ left: number; right: number }> {
    const hw = (side: Side): number => (this.#o.rigs[side].bounds.width * this.#o.rigs[side].cutout.width * this.#scales[side]) / (2 * this.#o.layout.frame.width);
    return Object.freeze({ left: hw('left'), right: hw('right') });
  }

  /** Start a turn now (per the injected clock). Accepts a built plan or its input. */
  play(turn: TurnPlan | TurnPlanInput): TurnPlan {
    this.#assertLive();
    const plan = (turn as TurnPlan).kind === 'turn-plan' ? (turn as TurnPlan) : buildTurnPlan({ ...(turn as TurnPlanInput), attacker: this.#withCadence((turn as TurnPlanInput).attacker), reducedMotion: (turn as TurnPlanInput).reducedMotion === true || this.#o.reducedMotion === true,
      arena: { ...(turn as TurnPlanInput).arena, halfWidths: (turn as TurnPlanInput).arena.halfWidths ?? this.halfWidths() } });
    this.#clearEffect();
    this.#plan = plan; this.#startMs = this.#o.clock();
    // Reduced motion (E1 §1.6): both rigs take the rest pose once per turn here and are never updated per tick.
    if (plan.reducedMotion) this.#applyRest();
    const cues = this.#o.cues;
    if (cues) this.#cues = new TurnCuePlayer(buildTurnCuePlan(plan, cues.phone !== undefined ? { phone: cues.phone } : {}), cues.sink, () => this.#o.clock() - this.#startMs);
    const fx = this.#o.effects;
    if (plan.effect && fx && !plan.reducedMotion) {
      const tint = fx.tintForTheme?.(plan.theme);
      this.#player = new EffectSequencePlayer({ host: fx.host, schedule: plan.effect.schedule, phaseTextures: fx.phaseTextures(plan.effect.anchors), particleTexture: fx.particleTexture,
        ...(tint !== undefined ? { particleTint: tint } : {}),
        emitters: fx.emittersForTheme?.(plan.theme) ?? EMITTER_PRESETS, seed: fx.seed, arena: { width: this.#o.layout.frame.width, height: this.#o.layout.frame.height },
        // The effect's ms 0 is the action start on the turn clock; an explicit start means a skipped or jumped frame lands at the right effect time.
        startAtMs: plan.effect.startMs, clock: () => this.#o.clock() - this.#startMs });
      for (const s of this.#player.sprites) { this.#fx.addChild(s); this.#fxNodes.push(s); }
      this.#fx.addChild(this.#player.particles); this.#fxNodes.push(this.#player.particles);
    }
    this.tick();
    return plan;
  }

  /** Advance to the injected clock and render; idempotent per clock value. */
  tick(): StageFrame | null {
    this.#assertLive();
    const plan = this.#plan;
    if (!plan) return null;
    const ms = this.#o.clock() - this.#startMs, timing = this.#o.timing;
    const sampleStart = timing?.now();
    const s = sampleTurn(plan, ms), sampleTurnMs = timing ? timing.now() - sampleStart! : 0;
    const L = this.#o.layout, w = L.frame.width, h = L.frame.height;
    const rigMs = timing ? { left: 0, right: 0 } : null;
    this.root.x = s.camera.shake.x; this.root.y = s.camera.shake.y;
    const off = parallaxOffset(s.runUpX * w);
    for (const id of PLATE_ORDER) this.#plates[id].x = L.plates.find((p) => p.id === id)!.x + off[id];
    this.#place(plan.attacker.side, s.attacker.displacementX, s.attacker.facing);
    this.#place(plan.target.side, s.target.displacementX, s.target.facing);
    // Reduced motion: both rigs stay at the rest pose applied at construction / the previous turn's end (E1 §1.6); no per-tick update.
    if (!plan.reducedMotion) {
      if (timing && rigMs) {
        const start = timing.now();
        this.#o.rigs[plan.attacker.side].applyPose(s.attacker.pose, s.attacker.context);
        const middle = timing.now();
        this.#o.rigs[plan.target.side].applyPose(s.target.pose, s.target.context);
        const end = timing.now();
        rigMs[plan.attacker.side] = middle - start; rigMs[plan.target.side] = end - middle;
      } else {
        this.#o.rigs[plan.attacker.side].applyPose(s.attacker.pose, s.attacker.context);
        this.#o.rigs[plan.target.side].applyPose(s.target.pose, s.target.context);
      }
    }
    if (this.#player && plan.effect && ms >= plan.effect.startMs) {
      this.#player.tick();
      s.effect?.tracks.forEach((t, i) => { const sp = this.#player!.spriteForTrack(i); if (sp) sp.alpha = t.transform.alpha; });
    }
    this.#flash.alpha = s.camera.flash * 0.85;
    const n = s.numbers[0];
    this.#number.visible = n?.visible === true;
    if (n) { this.#number.text = n.text; this.#number.x = n.x * w; this.#number.y = n.y * h; this.#number.alpha = n.alpha; this.#number.scale.set(n.scale, n.scale); }
    this.#bar.clear(); this.#bar.rect(HUD.barX, HUD.barY, (w - 2 * HUD.barX) * s.timingBar, HUD.barH); this.#bar.fill({ color: s.timingBar >= 1 ? 0xf2e3b6 : 0x8fb7c9, alpha: 0.9 });
    this.#cursor.visible = s.cursor.visible && s.cursor.on;
    if (this.#cursor.visible) { const st = L.stands[s.cursor.side]; this.#cursor.clear(); this.#cursor.rect(st.x * w - 6, st.y * h - h * 0.5, 12, HUD.cursorH); this.#cursor.fill({ color: 0xffd166, alpha: 1 }); }
    this.#o.worldLife?.update();
    const cues = this.#cues?.tick();
    if (timing && rigMs) timing.sample(Object.freeze({ kind: 'tick', sampleTurnMs, rigMs: Object.freeze(rigMs) }));
    return Object.freeze({ sample: s, done: ms >= plan.beats.end, label: this.label, cuesFired: cues?.fired ?? 0 });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#clearEffect(); this.#o.worldLife?.dispose();
    for (const side of ['left', 'right'] as const) { this.#o.rigs[side].dispose(); this.#holders[side].destroy(); }
    for (const n of [this.#plates.far, this.#plates.mid, this.#plates.near, this.#fx, this.#flash, this.#bar, this.#cursor, this.#number]) n.destroy();
    this.root.destroy(); this.#plan = null; this.#disposed = true;
  }

  /** A2: a rig that measured its stance reach walks its approach in whole gait cycles with feet planted; body length in
   * stand units = display body length × stage scale / frame width. Other rigs keep the legacy eased run-up. */
  #withCadence(a: TurnPlanInput['attacker']): TurnPlanInput['attacker'] {
    const rig = this.#o.rigs[a.side], reach = rig.stanceReach;
    if (reach === undefined || !(reach > 0) || a.cadence) return a;
    return { ...a, cadence: Object.freeze({ bodyLength: rig.bodyLength * this.#scales[a.side] / this.#o.layout.frame.width, stanceReach: reach }) };
  }
  #place(side: Side, displacementX: number, facing: 1 | -1): void {
    const L = this.#o.layout, st = L.stands[side], h = this.#holders[side], k = this.#scales[side];
    h.x = (st.x + displacementX) * L.frame.width; h.y = st.y * L.frame.height; h.scale.set(facing * k, k);
  }
  #applyRest(): void {
    const timing = this.#o.timing;
    if (!timing) { this.#o.rigs.left.applyPose({}); this.#o.rigs.right.applyPose({}); return; }
    const start = timing.now(); this.#o.rigs.left.applyPose({});
    const middle = timing.now(); this.#o.rigs.right.applyPose({});
    const end = timing.now();
    timing.sample(Object.freeze({ kind: 'rest', sampleTurnMs: 0, rigMs: Object.freeze({ left: middle - start, right: end - middle }) }));
  }
  #clearEffect(): void {
    if (this.#player) { this.#player.dispose(); for (const n of this.#fxNodes) this.#fx.removeChild(n); this.#fxNodes = []; this.#player = null; }
    if (this.#cues) { this.#cues.dispose(); this.#cues = null; }
  }
  #assertLive(): void { if (this.#disposed) throw new Error('battle2 stage is disposed'); }
}

/* ---------- combat outcome adapter: transcript log entry → TurnPlanInput ---------- */
export const COMBAT_THEMES: readonly string[] = Object.freeze(['fire', 'frost', 'storm', 'tide', 'stone', 'venom', 'void', 'sand', 'chem', 'psionic', 'wild']);
/** A3 default: contact themes are melee, the rest cast. A kit wording decision if Nick wants it moved. */
export const MELEE_THEMES: readonly string[] = Object.freeze(['wild', 'stone', 'sand']);
export const deliveryForTheme = (theme: string): EffectDelivery => (MELEE_THEMES.includes(theme) ? 'melee' : 'cast');
export interface CombatantVisualV1 { readonly side: 'A' | 'B'; readonly name: string; readonly mass: number; readonly card: BodyCard | null; readonly theme: string; readonly seed: number; }
export interface TurnOutcomeContext {
  readonly A: CombatantVisualV1; readonly B: CombatantVisualV1; readonly arena: TurnArena; readonly seed: number;
  readonly anchorsForTheme: (theme: string) => EffectSequenceAnchors | null;
  readonly readyMs: number; readonly commandMs: number; readonly reducedMotion?: boolean;
  /** E1 §1.2: the anatomy attack for this combatant's n-th staged attack, or null to play the family delivery clip. */
  readonly attackFor?: (side: 'A' | 'B', ordinal: number) => TurnAttack | null;
}
export type TurnOutcomeAdapt = Readonly<{ kind: 'turn'; input: TurnPlanInput }> | Readonly<{ kind: 'skip'; reason: string }>;
const SIDE_STAND: Readonly<Record<'A' | 'B', Side>> = Object.freeze({ A: 'left', B: 'right' });
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Maps one `SettledDuelTranscriptV1.log` entry (damage / dodge / stun / tick) to a turn plan input. Champion A stands left. */
export function turnPlanInputFromTranscriptEvent(event: Readonly<Record<string, unknown>>, ctx: TurnOutcomeContext, ordinal = 0): TurnOutcomeAdapt {
  if (!event || typeof event !== 'object') return { kind: 'skip', reason: 'event is not an object' };
  if (event.tick === true) return { kind: 'skip', reason: 'tick rows (burn/regen) have no staging' };
  if (event.stun === true) return { kind: 'skip', reason: 'stun: the strike never comes' };
  const byName = (name: unknown): 'A' | 'B' | null => (name === ctx.A.name ? 'A' : name === ctx.B.name ? 'B' : null);
  let attacker: 'A' | 'B' | null, outcome: 'hit' | 'dodge', damage = 0, critical = false, targetFaints = false;
  if (event.dodge === true) { attacker = byName(event.an); outcome = 'dodge'; if (!attacker) return { kind: 'skip', reason: `dodge attacker "${String(event.an)}" is neither combatant` }; }
  else {
    attacker = event.side === 'A' || event.side === 'B' ? event.side : null; outcome = 'hit';
    const dmg = num(event.dmg);
    if (!attacker || dmg === null) return { kind: 'skip', reason: 'damage row lacks side/dmg' };
    damage = dmg; critical = event.crit === true;
    const hp = attacker === 'A' ? num(event.hpB) : num(event.hpA);
    targetFaints = hp !== null && hp <= 0;
  }
  const a = ctx[attacker], t = ctx[attacker === 'A' ? 'B' : 'A'];
  const combatant = (c: CombatantVisualV1) => ({ side: SIDE_STAND[c.side], mass: c.mass, card: c.card, seed: c.seed, label: c.name });
  const input: TurnPlanInput = { seed: ctx.seed, attacker: combatant(a), target: combatant(t), delivery: deliveryForTheme(a.theme), theme: a.theme, outcome, damage, critical, targetFaints,
    effect: ctx.anchorsForTheme(a.theme), arena: ctx.arena, readyMs: ctx.readyMs, commandMs: ctx.commandMs, reducedMotion: ctx.reducedMotion === true,
    attack: a.card ? ctx.attackFor?.(attacker, ordinal) ?? null : null };
  return { kind: 'turn', input };
}
