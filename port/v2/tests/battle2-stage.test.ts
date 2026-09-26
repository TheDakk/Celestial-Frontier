import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeArena } from '../apps/game/src/battle2/arena.js';
import { PORTRAIT_RIG_LABEL, createPortraitRig, portraitClip, samplePortraitClip } from '../apps/game/src/battle2/fallback.js';
import { FIXTURE_RIG_LABEL, createFixtureRig, cutFixtureParts, type BattleRigV1, type FixturePartCut, type RigContainerLike, type RigSpriteLike } from '../apps/game/src/battle2/fixture-rig.js';
import { BattleStage, MELEE_THEMES, deliveryForTheme, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from '../apps/game/src/battle2/stage.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { EMITTER_PRESETS } from '../apps/game/src/effects/emitter.js';
import { EffectThemeLibrary, isProceduralImage } from '../apps/game/src/effects/theme-library.js';
import type { EffectParticleLike, EffectSpriteLike, EffectTextureLike } from '../apps/game/src/effects/pixi-adapter.js';
import { compileBodyCard, compileBodyCardOrFallback } from '../apps/game/src/motion/body-card.js';
import { isMotionFallback } from '../apps/game/src/motion/templates.js';
import { civetRecord } from '../tools/motion-proof/fixtures.js';

const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; anchorSet: [number, number] = [0, 0]; text = ''; ops: string[] = [];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: (x: number, y: number) => { this.anchorSet = [x, y]; } };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() { this.ops.push('clear'); } rect(x: number, y: number, w: number, h: number) { this.ops.push(`rect ${[x, y, w, h].map((v) => Math.round(v)).join(',')}`); } fill() { this.ops.push('fill'); }
  addParticle(...p: object[]) { this.children.push(...p); } removeParticle(...p: object[]) { this.children = this.children.filter((x) => !p.includes(x)); } destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const rigFactory = { container: (): RigContainerLike => new Node(), partSprite: (_p: FixturePartCut): RigSpriteLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const W = 120, H = 120;
const civetRig = (): BattleRigV1 => { const rec = civetRecord(), a = new Uint8Array(W * H); for (let y = 30; y < 100; y++) for (let x = 5; x < 115; x++) a[y * W + x] = 255; return createFixtureRig({ record: rec, cut: cutFixtureParts(a, W, H, rec), factory: rigFactory }); };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'monotreme', recipeHash: 'platypus-master', cutout: { width: 1254, height: 1254 }, alphaBox: { x: 200, y: 300, width: 850, height: 700 }, factory: rigFactory });
const TEX: EffectTextureLike = { width: 1254, height: 1254 };
const host = { createSprite: (): EffectSpriteLike => new Node(), createParticleContainer: () => new Node(), createParticle: (): EffectParticleLike => ({ x: 0, y: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0, rotation: 0, alpha: 1 }) };
const layout = composeArena({ id: 'proof', groundLineNormalized: 0.78, plates: { far: { width: 1672, height: 941 }, mid: { width: 1672, height: 941 }, near: { width: 1672, height: 941 } } }, { width: 1024, height: 576 });
const ctx = (over: Partial<TurnOutcomeContext> = {}): TurnOutcomeContext => ({
  A: { side: 'A', name: 'Civet', mass: 0.85, card: compileBodyCard(civetRecord()), theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 },
  arena: { groundLineY: 0.78, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300, ...over,
});

describe('whole-portrait fallback', () => {
  it('is used and labelled when the record is missing or the template has no library; its clips share the choreography numbers', () => {
    const noLibrary = compileBodyCardOrFallback({ ...civetRecord(), kind: 'monotreme', template: { id: 'monotreme', version: 1 } });
    expect(isMotionFallback(noLibrary)).toBe(true); expect((noLibrary as { reason: string }).reason).toContain('monotreme');
    const rig = portraitRig();
    expect(rig.kind).toBe('portrait'); expect(rig.label).toBe(PORTRAIT_RIG_LABEL); expect(rig.label).toContain('root offsets'); expect(rig.parts).toHaveLength(1);
    expect(rig.foot).toEqual({ x: 625 / 1254, y: 1000 / 1254 }); expect(rig.bounds.height).toBeCloseTo(700 / 1254);
    const melee = portraitClip('melee', 1, 7), hit = portraitClip('hit', 0.85, 7), idle = portraitClip('idle', 1, 7);
    expect(melee.durationMs).toBeCloseTo(140 + 90 + 1000 / 60 + 260, 9); expect(hit.durationMs).toBeCloseTo(450 * 0.85, 9); expect(idle.loop).toBe(true); expect(idle.durationMs).toBeGreaterThan(2600);
    expect(samplePortraitClip(melee, 230).root!.dx).toBeCloseTo(0.36, 6); expect(samplePortraitClip(hit, 110 * 0.85).root!.dx).toBeCloseTo(-0.08, 6); expect(samplePortraitClip(hit, 9999).root).toEqual({ rotation: 0, dx: 0, dy: 0 });
    const sprite = rig.parts[0]!.display as Node; rig.applyPose({ root: { rotation: 0.1, dx: 0.5 } });
    expect(sprite.rotation).toBe(0.1); expect(sprite.x).toBeCloseTo((rig.foot.x + 0.5 * rig.bodyLength) * 1254);
    rig.dispose(); expect(sprite.destroyed).toBe(true); expect(() => rig.applyPose({})).toThrow('disposed');
    expect(civetRig().label).toBe(FIXTURE_RIG_LABEL); // the rigged path is labelled too
  });
});

describe('combat outcome adapter', () => {
  it('maps damage / dodge rows to turn inputs (A left, B right, theme → delivery, faint from hp) and skips stun / tick', () => {
    const dmg = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 9, crit: true, hpA: 30, hpB: 12 }, ctx());
    expect(dmg.kind).toBe('turn'); if (dmg.kind !== 'turn') return;
    expect(dmg.input).toMatchObject({ outcome: 'hit', damage: 9, critical: true, targetFaints: false, delivery: 'melee', theme: 'wild', readyMs: 800, commandMs: 300 });
    expect(dmg.input.attacker).toMatchObject({ side: 'left', label: 'Civet', mass: 0.85 }); expect(dmg.input.target).toMatchObject({ side: 'right', label: 'Platypus', card: null }); expect(dmg.input.effect?.theme).toBe('wild');
    const back = turnPlanInputFromTranscriptEvent({ side: 'B', an: 'Platypus', dn: 'Civet', dmg: 40, crit: false, hpA: 0, hpB: 12 }, ctx());
    if (back.kind !== 'turn') throw new Error(back.reason);
    expect(back.input).toMatchObject({ delivery: 'cast', theme: 'tide', targetFaints: true, effect: null }); expect(back.input.attacker.side).toBe('right'); expect(back.input.target.side).toBe('left');
    const dodge = turnPlanInputFromTranscriptEvent({ dodge: true, an: 'Platypus', dn: 'Civet', hpA: 30, hpB: 12 }, ctx());
    if (dodge.kind !== 'turn') throw new Error(dodge.reason); expect(dodge.input).toMatchObject({ outcome: 'dodge', damage: 0, delivery: 'cast' }); expect(dodge.input.attacker.label).toBe('Platypus');
    expect(turnPlanInputFromTranscriptEvent({ stun: true, an: 'Civet', dn: 'Platypus', hpA: 1, hpB: 1 }, ctx())).toMatchObject({ kind: 'skip', reason: expect.stringContaining('stun') });
    expect(turnPlanInputFromTranscriptEvent({ tick: true, bA: 2, bB: 0, rA: 0, rB: 0, hpA: 1, hpB: 1 }, ctx()).kind).toBe('skip');
    expect(turnPlanInputFromTranscriptEvent({ dodge: true, an: 'Nobody', dn: 'Civet' }, ctx())).toMatchObject({ kind: 'skip', reason: expect.stringContaining('Nobody') });
    expect(turnPlanInputFromTranscriptEvent({ side: 'C', dmg: 1 }, ctx()).kind).toBe('skip');
    for (const t of MELEE_THEMES) expect(deliveryForTheme(t)).toBe('melee'); expect(deliveryForTheme('fire')).toBe('cast');
  });
});

describe('BattleStage (structural Pixi 8, injected clock)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('plays a transcript row end to end: run-up, parallax, effect sprites, flash, number, return; then disposes everything', () => {
    let now = 5000; const clock = () => now;
    const { f, nodes } = stageFactory(), rigs = { left: civetRig(), right: portraitRig() };
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock read'); }), perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock read'); });
    const stage = new BattleStage({ factory: f, clock, layout, plates: { far: { width: 1672, height: 941 }, mid: { width: 1672, height: 941 }, near: { width: 1672, height: 941 } }, rigs, masses: { left: 0.85, right: 0.85 },
      effects: { host, particleTexture: { width: 8, height: 8 }, seed: 99, phaseTextures: (a) => a.phases.map(() => TEX) }, worldLife: { container: new Node(), update: vi.fn(), dispose: vi.fn() } });
    expect(stage.label).toContain(FIXTURE_RIG_LABEL); expect(stage.label).toContain(PORTRAIT_RIG_LABEL);
    const adapted = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 9, crit: false, hpA: 30, hpB: 12 }, ctx());
    if (adapted.kind !== 'turn') throw new Error(adapted.reason);
    const plan = stage.play(adapted.input), b = plan.beats, root = stage.root as Node;
    const hw = stage.halfWidths(); expect(hw.left).toBeCloseTo((rigs.left.bounds.width * W * (576 * (1 / 3 + (1 / 6) * (0.15 / 0.9))) / (rigs.left.bounds.height * W)) / 2048, 9); expect(plan.arena.halfWidths).toEqual(hw);
    // C15 (2026-09-25): the run-up is measured between the painted BOX centres and travels all the way to contact (no 0.55 cap)
    const cx = stage.centresX(); expect(plan.arena.centresX).toEqual(cx);
    expect(Math.abs(plan.runUp)).toBeCloseTo(Math.max(0.15 / 3, Math.abs(cx.right - cx.left) - hw.left - hw.right - 0.02), 9);
    const holders = root.children.filter((c) => (c as Node).children.some((g) => g === rigs.left.root || g === rigs.right.root)) as Node[];
    const holderOf = (rig: BattleRigV1) => holders.find((h) => h.children.includes(rig.root as object))!;
    const left = holderOf(rigs.left), right = holderOf(rigs.right), plates = root.children.slice(0, 2) as Node[];
    expect(left.x).toBeCloseTo(layout.stands.left.x * 1024); expect(left.y).toBeCloseTo(layout.groundLinePx); expect(left.scaleSet[0]).toBeGreaterThan(0); expect(right.scaleSet[0]).toBeLessThan(0); // facing
    expect((rigs.left.root as Node).x).toBeCloseTo(-rigs.left.foot.x * W); expect(rigs.left.bounds.height * W * left.scaleSet[1]).toBeCloseTo(576 * (1 / 3 + (1 / 6) * (0.15 / 0.9)), 6);
    now = 5000 + b.actionStart; const atAction = stage.tick()!;
    expect(atAction.sample.phase).toBe('action'); expect(left.x).toBeCloseTo((layout.stands.left.x + plan.runUp) * 1024); expect(plates[0]!.x).toBeCloseTo(layout.plates[0]!.x - plan.runUp * 1024 * 0.1); expect(plates[1]!.x).toBeCloseTo(layout.plates[1]!.x - plan.runUp * 1024 * 0.5);
    const fx = root.children[5] as Node; expect(fx.children.length).toBe(4); // 3 phase sprites + the particle container
    now = 5000 + b.impactAt + 1; const atImpact = stage.tick()!;
    expect(atImpact.sample.camera.flash).toBe(1); expect((root.children[7] as Node).alpha).toBeCloseTo(0.85); expect(root.x).not.toBe(0);
    const number = nodes.find((n) => n.text === '9')!; expect(number.visible).toBe(true); expect(number.x).toBeCloseTo(layout.stands.right.x * 1024);
    const impactSprite = fx.children[2] as Node; expect(impactSprite.visible).toBe(true); expect(impactSprite.x).toBeCloseTo(layout.stands.right.x * 1024);
    now = 5000 + b.end + 1; const done = stage.tick()!;
    expect(done.done).toBe(true); expect(left.x).toBeCloseTo(layout.stands.left.x * 1024); expect(root.x).toBe(0); expect(number.visible).toBe(false);
    expect(dateSpy).not.toHaveBeenCalled(); expect(perfSpy).not.toHaveBeenCalled();
    stage.dispose();
    expect(nodes.every((n) => n.destroyed)).toBe(true); expect(() => rigs.left.applyPose({})).toThrow('disposed'); expect(() => stage.tick()).toThrow('disposed');
  });
  it('reduced motion plays the same plan with no effect player, no shake and the ready pose', () => {
    let now = 0; const { f } = stageFactory(), rigs = { left: civetRig(), right: portraitRig() };
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses: { left: 1, right: 1 }, reducedMotion: true, effects: { host, particleTexture: TEX, seed: 1, phaseTextures: (a) => a.phases.map(() => TEX) } });
    const adapted = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 3, crit: false, hpA: 30, hpB: 12 }, ctx());
    if (adapted.kind !== 'turn') throw new Error(adapted.reason);
    const plan = stage.play(adapted.input); expect(plan.reducedMotion).toBe(true);
    now = plan.beats.impactAt + 10; const s = stage.tick()!.sample;
    expect(s.camera).toEqual({ shake: { x: 0, y: 0 }, flash: 0 }); expect(s.effect).toBeNull(); expect(s.attacker.displacementX).toBe(0); expect((stage.root as Node).children[5]).toMatchObject({ children: [] });
    stage.dispose();
  });
});

describe('B2 per-ability theme effects on the stage', () => {
  it('a procedural theme plays with no phase sprite, theme emitters and tint resolved by plan.theme; the painted theme keeps its sprites', () => {
    let now = 0; const clock = () => now;
    const { f } = stageFactory(), rigs = { left: civetRig(), right: portraitRig() };
    const emittersForTheme = vi.fn((t: string) => { void t; return { launch: { ...EMITTER_PRESETS.launch, burst: 5, maxParticles: 5 }, travel: { ...EMITTER_PRESETS.travel, maxParticles: 5 }, impact: { ...EMITTER_PRESETS.impact, burst: 5, maxParticles: 5 } }; });
    const tintForTheme = vi.fn((t: string) => (t === 'tide' ? 0xd8f4f0 : 0x8a6a42));
    const stage = new BattleStage({ factory: f, clock, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs, masses: { left: 0.85, right: 0.85 },
      effects: { host, particleTexture: { width: 8, height: 8 }, seed: 3, phaseTextures: (a) => a.phases.map((p) => (isProceduralImage(p.keyedImage) ? null : TEX)), emittersForTheme, tintForTheme }, worldLife: { container: new Node(), update: vi.fn(), dispose: vi.fn() } });
    const lib = new EffectThemeLibrary([wild()]);
    const c = ctx({ anchorsForTheme: (t) => lib.anchorsFor(t) });
    const tide = turnPlanInputFromTranscriptEvent({ side: 'B', an: 'Platypus', dn: 'Civet', dmg: 4, hpA: 20, hpB: 12 }, c); if (tide.kind !== 'turn') throw new Error(tide.reason);
    const plan = stage.play(tide.input), root = stage.root as Node, fx = root.children[5] as Node;
    expect(plan.theme).toBe('tide'); expect(plan.delivery).toBe('cast'); expect(fx.children.length).toBe(1); // particle container only, no phase sprites
    expect(emittersForTheme).toHaveBeenCalledWith('tide'); expect(tintForTheme).toHaveBeenCalledWith('tide');
    now = plan.beats.impactAt + 5; const frame = stage.tick()!; expect(frame.sample.effect!.phase).toBe('impact'); expect(frame.sample.camera.flash).toBe(1);
    const wildTurn = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Civet', dn: 'Platypus', dmg: 9, hpA: 20, hpB: 3 }, c); if (wildTurn.kind !== 'turn') throw new Error(wildTurn.reason);
    now = plan.beats.end + 1; stage.tick(); const p2 = stage.play(wildTurn.input);
    expect(p2.theme).toBe('wild'); expect(fx.children.length).toBe(4); expect(emittersForTheme).toHaveBeenLastCalledWith('wild');
    stage.dispose();
  });
});
