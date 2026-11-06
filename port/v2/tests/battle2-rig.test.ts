import { afterEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_PARTS, FIXTURE_RIG_LABEL, createFixtureRig, cutFixtureParts, solvePose, type FixtureDisplayFactory, type FixturePartCut, type RigContainerLike, type RigSpriteLike } from '../apps/game/src/battle2/fixture-rig.js';
import { QUADRUPED_GRAPH } from '../apps/game/src/motion/templates.js';
import { civetRecord } from '../tools/motion-proof/fixtures.js';

const W = 160, H = 160;
/** Synthetic keyed alpha: discs painted along every bone of the civet record (no PNG decode in Node). */
function paintAlpha(): Uint8Array {
  const rec = civetRecord(), a = new Uint8Array(W * H);
  for (const [child, parent] of QUADRUPED_GRAPH) {
    const p = rec.landmarks[parent]!, c = rec.landmarks[child]!;
    for (let t = 0; t <= 1; t += 0.05) {
      const cx = (p[0]! + (c[0]! - p[0]!) * t) * W, cy = (p[1]! + (c[1]! - p[1]!) * t) * H, r = child === 'spine' || child === 'chest' ? 9 : 4;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) a[y * W + x] = 255;
    }
  }
  return a;
}
class Sprite implements RigSpriteLike { x = 0; y = 0; rotation = 0; visible = true; anchorSet: [number, number] = [0, 0]; destroyed = false; readonly anchor = { set: (x: number, y: number) => { this.anchorSet = [x, y]; } }; constructor(readonly part: FixturePartCut) {} destroy() { this.destroyed = true; } }
class Container implements RigContainerLike { x = 0; y = 0; rotation = 0; visible = true; children: object[] = []; destroyed = false; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } destroy() { this.destroyed = true; } }
const factory = (): FixtureDisplayFactory & { sprites: Sprite[] } => { const sprites: Sprite[] = []; return { sprites, container: () => new Container(), partSprite: (part) => { const s = new Sprite(part); sprites.push(s); return s; } }; };

describe('fixture rig cut (pure)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('assigns every GRAPH bone to exactly one of 19 parts', () => {
    const bones = FIXTURE_PARTS.flatMap((p) => p.bones);
    expect(FIXTURE_PARTS).toHaveLength(19); expect(new Set(bones).size).toBe(bones.length); expect([...bones].sort()).toEqual(QUADRUPED_GRAPH.map(([c]) => c).sort());
    for (const p of FIXTURE_PARTS) expect(QUADRUPED_GRAPH.find(([c]) => c === p.joint)?.[1]).toBe(p.parentJoint);
  });
  it('covers every alpha pixel exactly once and pivots each part at its parent joint', () => {
    const alpha = paintAlpha(), cut = cutFixtureParts(alpha, W, H, civetRecord());
    expect(cut.label).toBe(FIXTURE_RIG_LABEL);
    const coverage = new Uint8Array(W * H);
    for (const p of cut.parts) { let n = 0; for (let y = 0; y < p.box.height; y++) for (let x = 0; x < p.box.width; x++) if (p.mask[y * p.box.width + x]) { coverage[(p.box.y + y) * W + p.box.x + x] = (coverage[(p.box.y + y) * W + p.box.x + x] ?? 0) + 1; n++; } expect(n).toBe(p.pixelCount); }
    let painted = 0; for (let i = 0; i < alpha.length; i++) { expect(coverage[i]).toBe(alpha[i] ? 1 : 0); if (alpha[i]) painted++; }
    expect(cut.alphaCount).toBe(painted); expect(painted).toBeGreaterThan(1000);
    const rec = civetRecord();
    for (const p of cut.parts) { expect([p.pivot.x, p.pivot.y]).toEqual(rec.landmarks[p.parentJoint]); expect(p.pixelCount).toBeGreaterThan(0); }
    expect(cut.parts.find((p) => p.id === 'head')!.pixelCount).toBeGreaterThan(cut.parts.find((p) => p.id === 'tail3')!.pixelCount);
    expect(cutFixtureParts(alpha, W, H, civetRecord())).toEqual(cut); // deterministic
    expect(() => cutFixtureParts(alpha, W, H - 1, civetRecord())).toThrow('width*height');
    expect(() => cutFixtureParts(alpha, W, H, { ...civetRecord(), template: { id: 'serpent', version: 1 } })).toThrow('not quadruped');
  });
  it('solves the hierarchy in GRAPH parent order: a spine rotation carries chest/neck/head and the forelegs, not the pelvis or hind legs', () => {
    const rec = civetRecord(), rest = solvePose(rec, 0.28, {}), bent = solvePose(rec, 0.28, { spine: { rotation: 0.3 } });
    expect(rest.order).toEqual(['root', ...QUADRUPED_GRAPH.map(([c]) => c)]);
    for (const j of Object.keys(rec.landmarks)) expect(rest.position[j]).toEqual(rec.landmarks[j]);
    for (const moved of ['spine', 'chest', 'neck', 'head', 'jaw', 'foreFarRoot', 'foreNearPaw', 'earNearTip']) expect(bent.position[moved]).not.toEqual(rest.position[moved]);
    for (const still of ['root', 'pelvis', 'hindFarRoot', 'hindNearPaw', 'tail3']) expect(bent.position[still]).toEqual(rest.position[still]);
    expect(bent.angle.head).toBeCloseTo(0.3); expect(bent.angle.tail0).toBe(0);
    const shifted = solvePose(rec, 0.28, { root: { rotation: 0, dx: 0.5, dy: -0.25 } });
    expect(shifted.position.head![0]).toBeCloseTo(rec.landmarks.head![0]! + 0.14); expect(shifted.position.head![1]).toBeCloseTo(rec.landmarks.head![1]! - 0.07);
  });
  it('binds parts to sprites pivoting at the parent joint, layered far then near, and applies poses through the hierarchy', () => {
    const rec = civetRecord(), cut = cutFixtureParts(paintAlpha(), W, H, rec), f = factory(), rig = createFixtureRig({ record: rec, cut, factory: f });
    expect(rig.kind).toBe('fixture'); expect(rig.label).toBe(FIXTURE_RIG_LABEL); expect(rig.templateId).toBe('quadruped'); expect(rig.parts).toHaveLength(19);
    expect(rig.cutout).toEqual({ width: W, height: H }); expect(rig.bounds.groundLineY).toBe(rec.geometry.groundLineY); expect(rig.bounds.height).toBeGreaterThan(0.3);
    const layers = rig.parts.map((p) => p.layer); expect(layers.lastIndexOf('far')).toBeLessThan(layers.indexOf('near'));
    const head = f.sprites.find((s) => s.part.id === 'head')!, neck = f.sprites.find((s) => s.part.id === 'neck')!, paw = f.sprites.find((s) => s.part.id === 'foreNearPaw')!;
    expect([head.x / W, head.y / H]).toEqual(rec.landmarks.neck); // pivot = parent joint
    const px = rec.landmarks.neck![0]! * W, py = rec.landmarks.neck![1]! * H;
    expect(head.part.box.x + head.anchorSet[0] * head.part.box.width).toBeCloseTo(px); expect(head.part.box.y + head.anchorSet[1] * head.part.box.height).toBeCloseTo(py);
    rig.applyPose({ head: { rotation: 0.4 }, root: { rotation: 0, dx: 0.1 } });
    expect(head.rotation).toBeCloseTo(0.4); expect(neck.rotation).toBe(0); expect(paw.rotation).toBe(0);
    expect(head.x / W).toBeCloseTo(rec.landmarks.neck![0]! + 0.1 * rig.bodyLength); expect(paw.x / W).toBeCloseTo(rec.landmarks.foreNearAnkle![0]! + 0.1 * rig.bodyLength);
    rig.applyPose({ spine: { rotation: 0.2 } });
    expect(head.rotation).toBeCloseTo(0.2); expect(neck.rotation).toBeCloseTo(0.2); expect(f.sprites.find((s) => s.part.id === 'tail1')!.rotation).toBe(0);
    rig.dispose();
    expect(f.sprites.every((s) => s.destroyed)).toBe(true); expect((rig.root as Container).destroyed).toBe(true); expect(() => rig.applyPose({})).toThrow('disposed');
  });
  it('never reads a clock or Math.random while cutting or posing', () => {
    const alpha = paintAlpha(), rec = civetRecord();
    const spies = [vi.spyOn(Date, 'now'), vi.spyOn(performance, 'now'), vi.spyOn(Math, 'random')].map((s) => s.mockImplementation(() => { throw new Error('clock read'); }));
    expect(() => performance.now()).toThrow('clock read');
    const cut = cutFixtureParts(alpha, W, H, rec); createFixtureRig({ record: rec, cut, factory: factory() }).applyPose({ head: { rotation: 0.1 } });
    expect(spies[1]).toHaveBeenCalledTimes(1); expect(spies[0]).not.toHaveBeenCalled(); expect(spies[2]).not.toHaveBeenCalled();
  });
});
