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
/** Joint position in source pixels (the rig reports display units = normalized cut-out). */
const px = (rig: PartsRig, joint: string): [number, number] => { const p = rig.jointPosition(joint); if (!p) throw new Error('no joint ' + joint); return [p.x * rig.sourceSize.width, p.y * rig.sourceSize.height]; };
const CRAB_FEET = ['leg0FarFoot', 'leg0NearFoot', 'leg1FarFoot', 'leg1NearFoot', 'leg2FarFoot', 'leg2NearFoot', 'leg3FarFoot', 'leg3NearFoot'];

describe('E1.1 parts rig — Codex source paint-skin rigs on the battle stage contract', () => {
  it('loads the five crab fits and the Civet binding as labelled parts rigs (identity, foot, bounds, scale reference, no refusals yet)', async () => {
    for (const name of Object.keys(FITS) as FitName[]) {
      const { rig, record, binding } = await loadFit(name);
      expect(rig.kind).toBe('parts'); expect(rig.label).toContain(PARTS_RIG_LABEL); expect(rig.label).toContain(rig.contactMode);
      expect(rig.contactMode).toBe('family');
      expect(rig.recipeHash).toBe(record.recipeHash); expect(rig.templateId).toBe(record.template.id);
      expect(rig.foot).toEqual({ x: record.landmarks.root![0], y: record.geometry.groundLineY });
      expect(rig.cutout).toEqual({ width: 1, height: 1 }); expect(rig.sourceSize).toEqual({ width: record.geometry.width, height: record.geometry.height }); // display units are normalized (E1.5 film finding)
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
    for (const f of CRAB_FEET) { const p = px(rig, f); expect(Math.hypot(p[0] - rest[f]![0], p[1] - rest[f]![1]), f).toBeLessThan(1e-6); } // rest supports (default): feet stay bit-for-bit; with contactSupports 'observed' the joints drift up to 5.3 px under this hit (2026-09-21, finding for Codex)
    const carapaceRest = px(rig, 'carapace');
    const hit = buildTimeline(card, 'hit', 7), clip = { source: 'timeline' as const, timeline: hit };
    let maxLoad = 0;
    for (let i = 0; i <= 20; i++) {
      const ms = hit.durationMs * i / 20;
      rig.applyPose(sampleClip(clip, ms), ctx(hit.actionId, ms, hit.durationMs, true));
      maxLoad = Math.max(maxLoad, Math.abs(px(rig, 'carapace')[1] - carapaceRest[1]));
      for (const f of CRAB_FEET) { const p = px(rig, f); expect(Math.hypot(p[0] - rest[f]![0], p[1] - rest[f]![1]), `${f}@${ms}`).toBeLessThan(1e-6); }
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

  it('run-up (travel: stage since the R3 re-merge): the gait cycles without a refusal, no foot goes below the ground line, and swing feet lift; feet plant to the body, not the arena', async () => {
    const { rig, record } = await loadFit('coconut-crab');
    const card = compileBodyCard(record, record.genome), H = record.geometry.height;
    const approach = buildTimeline(card, 'approach', 11), clip = { source: 'timeline' as const, timeline: approach };
    const groundY = Object.fromEntries(CRAB_FEET.map((f) => [f, record.landmarks[f]![1] * H]));
    let maxLift = 0;
    for (let i = 0; i <= 40; i++) {
      const ms = approach.durationMs * i / 40;
      rig.applyPose(sampleClip(clip, ms), ctx(approach.actionId, ms, approach.durationMs, false));
      for (const f of CRAB_FEET) { const y = px(rig, f)[1]; expect(y, `${f}@${ms}`).toBeLessThanOrEqual(groundY[f]! + 1e-6); maxLift = Math.max(maxLift, groundY[f]! - y); }
    }
    expect(rig.refusals()).toBe(0); expect(rig.lastRefusal()).toBeNull();
    expect(maxLift).toBeGreaterThan(1); // N2 readability: swing lift is 15 % of lower-leg length, well over a source pixel
    expect(rig.travelOwner).toBe('stage');
    rig.dispose();
  }, 60_000);

  it('stance feet stay planted in ARENA space while the stage carries the run-up (Codex d8787235: ContactPhase.stageDisplacement consumed; the parts rig passes it from RigPoseContext; pin flipped from it.fails)', async () => {
    const { rig, record } = await loadFit('crab');
    const card = compileBodyCard(record, record.genome), W = record.geometry.width, scale = 0.25;
    // one gait cycle carries the stage 0.2 body length on the arena: the solver cancels the displacement exactly
    // (target shift = −d, maxError 0) up to 0.2 body lengths per stance and REFUSES beyond (compression bound, then
    // reach) — measured 2026-09-21 on the crab; 0.18 × frame ≈ 9 body lengths at this scale is unreachable by design
    const runUpPx = 0.2 * scale * W * card.scaleLength;
    const approach = buildTimeline(card, 'approach', 5), clip = { source: 'timeline' as const, timeline: approach };
    // A walking foot advances during its SWING half-cycles and must not move in the arena during its STANCE ones
    // (the solver's rule: leg group 0 stands in the first half of each cycle, group 1 in the second). leg0Near is
    // the second contract leg → group (floor(1/2) + 1 % 2) % 2 = 1 → stance while cycle ≥ 0.5.
    const stanceAt = (ms: number) => ((ms / approach.durationMs) % 1) >= 0.5;
    const windows: number[][] = []; let current: number[] | null = null; let worldAt0: number | null = null;
    for (let i = 0; i <= 60; i++) {
      const k = i / 60, ms = approach.durationMs * k;
      const holderX = runUpPx * EASE_FN['ease-out'](k);
      // body lengths since the stance boundary: the stage's cumulative travel (display units) over the body length,
      // minus what it was when this stance began (the swing half carries no planting)
      const stanceStartX = stanceAt(ms) ? runUpPx * EASE_FN['ease-out'](0.5) : holderX;
      rig.applyPose(sampleClip(clip, ms), { ...ctx(approach.actionId, ms, approach.durationMs, false), stageDisplacement: ((holderX - stanceStartX) / (scale * W)) / card.scaleLength });
      const foot = px(rig, 'leg0NearFoot'), world = holderX + scale * (foot[0] / W - rig.foot.x) * W;
      if (worldAt0 === null) worldAt0 = world;
      if (stanceAt(ms)) { if (!current) { current = []; windows.push(current); } current.push(world); } else current = null;
    }
    // the approach timeline is one gait cycle: one swing half (first) then one stance half (second)
    expect(windows.length).toBeGreaterThanOrEqual(1);
    for (const w of windows) { expect(w.length).toBeGreaterThanOrEqual(3); expect(Math.max(...w) - Math.min(...w), `stance window of ${w.length} samples`).toBeLessThan(0.5); }
    // (in stage mode the foot never advances: the stage carries the body, swings only lift — Codex cb1a667d/d8787235)
    expect(rig.refusals()).toBe(0);
    rig.dispose();
  }, 60_000);

  it('quadruped bindings take the FAMILY solver since the R3 re-merge: the Civet idle plants four paws with zero refusals and measures a stance reach', async () => {
    const { rig, record } = await loadFit('civet');
    expect(rig.contactMode).toBe('family'); expect(rig.stanceReach).toBeGreaterThan(0.1);
    const card = compileBodyCard(record), idle = buildTimeline(card, 'idle', 3), clip = { source: 'timeline' as const, timeline: idle };
    const W = record.geometry.width, H = record.geometry.height, paws = ['hindFarAnkle', 'foreFarAnkle', 'hindNearAnkle', 'foreNearAnkle'];
    for (let i = 0; i <= 30; i++) {
      const ms = idle.durationMs * i / 30;
      rig.applyPose(sampleClip(clip, ms), ctx('idle', ms, idle.durationMs, true));
      for (const j of paws) { const p = px(rig, j); expect(Math.hypot(p[0] - record.landmarks[j]![0] * W, p[1] - record.landmarks[j]![1] * H), `${j}@${ms}`).toBeLessThan(1e-6); }
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
