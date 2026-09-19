/** E1.1 — the parts-rig adapter on Codex's REAL source paint-skin rigs (crab-fits-03 × 5, candidate-10
 * Civet). Lives beside the app (not under tests/): the closure reaches pixi.js, whose @webgpu/types collide
 * with lib.dom in the fully strict root program (apps/game/tsconfig.json `_skipLibCheckReason`). */
import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import { compileBodyCard } from '../motion/body-card.js';
import { buildTimeline, EASE_FN } from '../motion/timeline.js';
import { sampleClip } from './choreography.js';
import type { RigPoseContext } from './fixture-rig.js';
import { PARTS_RIG_LABEL, restContext, type PartsRig } from './parts-rig.js';
import { FITS, loadFit, type FitName } from './parts-rig.fixtures.js';

const ctx = (actionId: string, elapsedMs: number, durationMs: number, planted: boolean): RigPoseContext => Object.freeze({ actionId, elapsedMs, durationMs, weight: 1, planted, travel: 'stage' });
const snapshot = (rig: PartsRig) => rig.parts.map((p) => { const d = p.display as Container; return [d.x, d.y, d.rotation, d.scale.x, d.scale.y]; });
const px = (p: { x: number; y: number } | null): [number, number] => { if (!p) throw new Error('no joint'); return [p.x, p.y]; };
const CRAB_FEET = ['leg0FarFoot', 'leg0NearFoot', 'leg1FarFoot', 'leg1NearFoot', 'leg2FarFoot', 'leg2NearFoot', 'leg3FarFoot', 'leg3NearFoot'];

describe('E1.1 parts rig — Codex source paint-skin rigs on the battle stage contract', () => {
  it('loads the five crab fits and the Civet binding as labelled parts rigs (identity, foot, bounds, scale reference, no refusals yet)', async () => {
    for (const name of Object.keys(FITS) as FitName[]) {
      const { rig, record, binding } = await loadFit(name);
      expect(rig.kind).toBe('parts'); expect(rig.label).toContain(PARTS_RIG_LABEL); expect(rig.label).toContain(rig.contactMode);
      expect(rig.contactMode).toBe(name === 'civet' ? 'quadruped-compat' : 'family');
      expect(rig.recipeHash).toBe(record.recipeHash); expect(rig.templateId).toBe(record.template.id);
      expect(rig.foot).toEqual({ x: record.landmarks.root![0], y: record.geometry.groundLineY });
      expect(rig.cutout).toEqual({ width: record.geometry.width, height: record.geometry.height });
      expect(rig.bounds.height).toBeGreaterThan(0.05); expect(rig.bounds.height).toBeLessThanOrEqual(1); expect(rig.bounds.groundLineY).toBe(record.geometry.groundLineY);
      expect(rig.bodyLength).toBe(compileBodyCard(record, record.genome).scaleLength); // N1: the declared motion scale, never the root→carapace axis
      expect(rig.parts.map((p) => p.id).sort()).toEqual(binding.parts.map((p) => p.id).sort());
      expect(rig.refusals()).toBe(0); expect(rig.applied()).toBe(0); expect(rig.lastPose()).toBeNull();
      rig.dispose();
    }
  }, 120_000);

  it('routes every pose through the owner and the family contact solver: under hit loading the carapace moves while all eight feet stay on their rest landmarks', async () => {
    const { rig, record } = await loadFit('crab');
    const card = compileBodyCard(record, record.genome), W = record.geometry.width, H = record.geometry.height;
    const rest: Record<string, [number, number]> = Object.fromEntries(CRAB_FEET.map((f) => [f, [record.landmarks[f]![0] * W, record.landmarks[f]![1] * H] as [number, number]]));
    rig.applyPose({}, restContext()); expect(rig.applied()).toBe(1);
    for (const f of CRAB_FEET) { const p = px(rig.jointPosition(f)); expect(Math.hypot(p[0] - rest[f]![0], p[1] - rest[f]![1]), f).toBeLessThan(1e-6); }
    const carapaceRest = px(rig.jointPosition('carapace'));
    const hit = buildTimeline(card, 'hit', 7), clip = { source: 'timeline' as const, timeline: hit };
    let maxLoad = 0;
    for (let i = 0; i <= 20; i++) {
      const ms = hit.durationMs * i / 20;
      rig.applyPose(sampleClip(clip, ms), ctx(hit.actionId, ms, hit.durationMs, true));
      maxLoad = Math.max(maxLoad, Math.abs(px(rig.jointPosition('carapace'))[1] - carapaceRest[1]));
      for (const f of CRAB_FEET) { const p = px(rig.jointPosition(f)); expect(Math.hypot(p[0] - rest[f]![0], p[1] - rest[f]![1]), `${f}@${ms}`).toBeLessThan(1e-6); }
    }
    expect(maxLoad).toBeGreaterThan(0.5); // N12: 3 % of the motion scale is visible body loading, not a static crab
    expect(rig.refusals()).toBe(0); expect(rig.applied()).toBe(22);
    rig.dispose();
  }, 60_000);

  it('refusal policy: a refused pose is counted and named, the display keeps the last valid pose, nothing throws into the caller; a valid pose after it applies', async () => {
    const { rig } = await loadFit('freshwater-crab');
    rig.applyPose({ root: { rotation: 0, dx: 0.01 } }, restContext());
    const before = snapshot(rig), applied = rig.applied();
    rig.applyPose({ root: { rotation: 0 }, notAJoint: { rotation: 0.3 } }, restContext());
    expect(rig.refusals()).toBe(1); expect(rig.lastRefusal()).toMatch(/unknown or duplicate joint notAJoint/); expect(rig.applied()).toBe(applied);
    expect(snapshot(rig)).toEqual(before);
    rig.applyPose({ root: { rotation: 0, dx: 0.01 } }, restContext()); expect(rig.applied()).toBe(applied + 1); expect(rig.refusals()).toBe(1);
    rig.dispose();
  }, 60_000);

  it('run-up (interim, pending R3 travel:stage): the gait cycles without a refusal, no foot goes below the ground line, and swing feet lift; feet plant to the body, not the arena', async () => {
    const { rig, record } = await loadFit('coconut-crab');
    const card = compileBodyCard(record, record.genome), H = record.geometry.height;
    const approach = buildTimeline(card, 'approach', 11), clip = { source: 'timeline' as const, timeline: approach };
    const groundY = Object.fromEntries(CRAB_FEET.map((f) => [f, record.landmarks[f]![1] * H]));
    let maxLift = 0;
    for (let i = 0; i <= 40; i++) {
      const ms = approach.durationMs * i / 40;
      rig.applyPose(sampleClip(clip, ms), ctx(approach.actionId, ms, approach.durationMs, false));
      for (const f of CRAB_FEET) { const y = px(rig.jointPosition(f))[1]; expect(y, `${f}@${ms}`).toBeLessThanOrEqual(groundY[f]! + 1e-6); maxLift = Math.max(maxLift, groundY[f]! - y); }
    }
    expect(rig.refusals()).toBe(0); expect(rig.lastRefusal()).toBeNull();
    expect(maxLift).toBeGreaterThan(1); // N2 readability: swing lift is 15 % of lower-leg length, well over a source pixel
    expect(rig.travelOwner).toContain('pending R3');
    rig.dispose();
  }, 60_000);

  it.fails('R3 pending: stance feet stay planted in ARENA space while the stage carries the run-up (flips green when ContactPhase.travel:"stage" lands)', async () => {
    const { rig, record } = await loadFit('crab');
    const card = compileBodyCard(record, record.genome), W = record.geometry.width, frameW = 1024, runUpPx = 0.18 * frameW;
    const approach = buildTimeline(card, 'approach', 5), clip = { source: 'timeline' as const, timeline: approach };
    const scale = 0.25; const world: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12, ms = approach.durationMs * k;
      rig.applyPose(sampleClip(clip, ms), ctx(approach.actionId, ms, approach.durationMs, false));
      const holderX = runUpPx * EASE_FN['ease-out'](k), foot = px(rig.jointPosition('leg0NearFoot'));
      world.push(holderX + scale * (foot[0] - rig.foot.x * W));
    }
    // A planted stance foot must not move in the arena while the body advances; today the foot rides with the body.
    expect(Math.max(...world) - Math.min(...world)).toBeLessThan(0.5);
    rig.dispose();
  }, 60_000);

  it('quadruped bindings take the preserved compatibility solver: the Civet idle plants four paws with zero refusals', async () => {
    const { rig, record } = await loadFit('civet');
    expect(rig.contactMode).toBe('quadruped-compat');
    const card = compileBodyCard(record), idle = buildTimeline(card, 'idle', 3), clip = { source: 'timeline' as const, timeline: idle };
    const W = record.geometry.width, H = record.geometry.height, paws = ['hindFarAnkle', 'foreFarAnkle', 'hindNearAnkle', 'foreNearAnkle'];
    for (let i = 0; i <= 30; i++) {
      const ms = idle.durationMs * i / 30;
      rig.applyPose(sampleClip(clip, ms), ctx('idle', ms, idle.durationMs, true));
      for (const j of paws) { const p = px(rig.jointPosition(j)); expect(Math.hypot(p[0] - record.landmarks[j]![0] * W, p[1] - record.landmarks[j]![1] * H), `${j}@${ms}`).toBeLessThan(1e-6); }
    }
    expect(rig.refusals()).toBe(0); expect(rig.applied()).toBe(31);
    rig.dispose();
  }, 60_000);

  it('dispose is total and one-way: the paint rig is destroyed, a later pose throws, a second dispose is a no-op', async () => {
    const { rig } = await loadFit('mud-crab');
    rig.dispose(); rig.dispose();
    expect((rig.root as Container).destroyed).toBe(true);
    expect(() => rig.applyPose({})).toThrow(/disposed/);
  }, 60_000);
});
