// M1 outcome tests (MORPH_SYSTEM_DESIGN §3 M-A): proportion morphs on the REAL rigs through the real stage. A morphed
// head/tail/ear/antenna sub-tree grows about its root; every contact foot stays exactly where the archetype's is; the
// envelope extremes play a whole turn with zero refusals on all six subjects; identity is byte-identical.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { composeArena } from '../battle2/arena.js';
import type { TurnAttack, TurnPlanInput } from '../battle2/choreography.js';
import { createPortraitRig } from '../battle2/fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from '../battle2/fixture-rig.js';
import { FITS, REPO_ROOT, loadFitDir, type FitName } from '../battle2/parts-rig.fixtures.js';
import { BattleStage, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from '../battle2/stage.js';
import { PROPORTION_ENVELOPE, morphParamsV1 } from './morph-params.js';
import { MORPH_GROUPS, jointScalesV1 } from './morph-skeleton.js';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; anchorSet: [number, number] = [0, 0]; text = ''; ops: string[] = [];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: (x: number, y: number) => { this.anchorSet = [x, y]; } };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() { this.ops.push('clear'); } rect(x: number, y: number, w: number, h: number) { this.ops.push(`rect ${[x, y, w, h].map((v) => Math.round(v)).join(',')}`); } fill() { this.ops.push('fill'); }
  destroy() { this.destroyed = true; } }
const stageFactory = () => { const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
  const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() }; return { f, nodes }; };
const rigFactory = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:platypus', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: rigFactory });
const FRAME = { width: 1024, height: 576 }, TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'm1', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const ctx = (name: string, mass: number, card: Parameters<typeof compileAnatomyAttack>[0]): TurnOutcomeContext => ({
  A: { side: 'A', name, mass, card, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 },
  arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 593405465, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300,
  attackFor: (s, o) => { if (s !== 'A') return null; const r = compileAnatomyAttack(card, 'ground', o); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.contactJoint } as TurnAttack; } });
const turnOf = (c: TurnOutcomeContext, row: Record<string, unknown>, i = 0): TurnPlanInput => { const t = turnPlanInputFromTranscriptEvent(row, c, i); if (t.kind !== 'turn') throw new Error(t.reason); return t.input; };
const ARCH = 'e493cfa99fa1b658c927b8cf6face727b619f19a5e9e26ce8cfd93875e684a53';
const contactJoints = (card: { parts: ReadonlyArray<{ joint: string; group: string }> }) => card.parts.filter((p) => p.group === 'legs').map((p) => p.joint);

describe('morph M1 — proportion on the real rigs', () => {
  it('jointScalesV1: identity → no scales; head/tail genes scale the sub-tree ROOTS only (Civet: neck, tail0, ear roots); the crab has no head group so only antennae (eye roots) scale', async () => {
    const civet = await loadFitDir(FITS.civet), crab = await loadFitDir(FITS.crab);
    expect(jointScalesV1(civet.card, morphParamsV1({}, ARCH))).toEqual({});
    const p = morphParamsV1({ head: 7, tail: 6 }, ARCH); // top of both tables → envelope tops
    expect(p.proportion.head).toBe(PROPORTION_ENVELOPE.head[1]); expect(p.proportion.tail).toBe(PROPORTION_ENVELOPE.tail[1]);
    const sc = jointScalesV1(civet.card, p);
    expect(sc).toMatchObject({ neck: PROPORTION_ENVELOPE.head[1], tail0: PROPORTION_ENVELOPE.tail[1] }); expect(Object.keys(sc).sort()).toEqual(['earFarRoot', 'earNearRoot', 'neck', 'tail0']);
    for (const j of contactJoints(civet.card)) expect(sc[j]).toBeUndefined();
    const sk = jointScalesV1(crab.card, p); expect(Object.keys(sk).sort()).toEqual(['eyeFarRoot', 'eyeNearRoot']);
    expect(Object.keys(MORPH_GROUPS)).toEqual(['head', 'tail', 'ears', 'antennae']);
  });
  it('Civet at head 1.2 / tail 1.35: the head landmark sits 1.2× farther from the neck pivot at rest, the tail tip 1.35× farther from the tail root; every paw is exactly where the archetype\'s is', async () => {
    const base = await loadFitDir(FITS.civet); const p = morphParamsV1({ head: 7, tail: 6 }, ARCH); const morphed = await loadFitDir(FITS.civet, undefined, undefined, jointScalesV1(base.card, p));
    base.rig.applyPose({}); morphed.rig.applyPose({});
    const d = (rig: typeof base.rig, a: string, b: string) => { const pa = rig.jointPosition(a)!, pb = rig.jointPosition(b)!; return Math.hypot(pa.x - pb.x, pa.y - pb.y); };
    // a scaled root pivots on its PARENT's landmark (the pose program's pivot rule): the head grows about the neck's parent, the tail about tail0's parent
    const parentOf = (j: string) => base.card.parts.find((p) => p.joint === j)!.parent;
    expect(d(morphed.rig, 'head', parentOf('neck')) / d(base.rig, 'head', parentOf('neck'))).toBeCloseTo(1.2, 6);
    expect(d(morphed.rig, 'tail3', parentOf('tail0')) / d(base.rig, 'tail3', parentOf('tail0'))).toBeCloseTo(1.35, 6);
    for (const j of contactJoints(base.card)) { const a = base.rig.jointPosition(j)!, b = morphed.rig.jointPosition(j)!; expect(Math.hypot(a.x - b.x, a.y - b.y), j).toBeLessThan(1e-12); }
    expect(morphed.rig.tallestHeight!).toBeGreaterThan(base.rig.tallestHeight!); // a bigger head is a taller creature
  });
  for (const name of Object.keys(FITS) as FitName[]) for (const [label, genome] of [['smallest', { head: 0, tail: 0 }], ['largest', { head: 7, tail: 6 }]] as const) it(`${name} at the ${label} envelope corner plays a whole turn (attack, hit, dodge, faint) on the real stage with zero refusals`, async () => {
    const probe = await loadFitDir(FITS[name]); const scales = jointScalesV1(probe.card, morphParamsV1(genome, ARCH));
    const { rig, card } = await loadFitDir(FITS[name], undefined, undefined, scales);
    const { f } = stageFactory(); let now = 0;
    const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 } });
    const rows = [{ side: 'A', an: 'X', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: 'X', dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: 'X', dn: 'Platypus', dodge: true }, { side: 'B', an: 'Platypus', dn: 'X', dmg: 26, crit: true, hpA: 0, hpB: 20 }];
    let ticks = 0; for (const [i, row] of rows.entries()) { now = 0; const plan = stage.play(turnOf(ctx('X', card.massClass.multiplier, card), row, i)); for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; if (!stage.tick()) throw new Error('no frame'); ticks++; } now = plan.beats.end; if (!stage.tick()?.done) throw new Error('turn never reached its end'); ticks++; } // each turn from clock 0 (review 2026-09-24)
    expect(ticks).toBeGreaterThan(200); expect(rig.refusals(), rig.lastRefusal() ?? '').toBe(0);
    stage.dispose();
  }, 300_000);
});
