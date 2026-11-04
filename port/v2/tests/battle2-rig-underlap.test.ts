/* Boundary-band underlap on the fixture rig and the pure posed renderer (C2 bounded repair, Claude lane).
 * Properties: underlap only duplicates child pixels within the band (coverage of the alpha stays exact and
 * the strict cut is byte-identical to before); parents draw before children; the rest render equals the keyed
 * master with 0 changed channels for both cuts; a rotated head opens a joint seam under the strict cut that
 * the underlap closes (seam oracle, same pose, same record). Negative controls: underlap 0 leaves the seam,
 * an out-of-range underlap refuses, a wrong-size rgba refuses. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXTURE_DRAW_ORDER, FIXTURE_PARTS, createFixtureRig, cutFixtureParts, fixtureIsAncestor, fixtureParentPart, type FixtureDisplayFactory, type RigContainerLike, type RigSpriteLike } from '../apps/game/src/battle2/fixture-rig.js';
import { changedChannels, poseFromTimeline, renderPosedCut } from '../apps/game/src/battle2/rig-render.js';
import { compileBodyCard } from '../apps/game/src/motion/body-card.js';
import { QUADRUPED_GRAPH, QUADRUPED_TEMPLATE } from '../apps/game/src/motion/templates.js';
import { buildTimeline } from '../apps/game/src/motion/timeline.js';
import { civetRecord } from '../tools/motion-proof/fixtures.js';
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { write(png: unknown): Buffer } } & (new (o: { width: number; height: number }) => { data: Buffer }) };

const W = 300, H = 300;
/** A synthetic painted civet: tubes along every bone with fur-coloured noise, keyed (alpha 0/255). */
function paint(): { alpha: Uint8Array; rgba: Uint8ClampedArray } {
  const rec = civetRecord(), alpha = new Uint8Array(W * H), rgba = new Uint8ClampedArray(W * H * 4);
  for (const [child, parent] of QUADRUPED_GRAPH) {
    const p = rec.landmarks[parent]!, c = rec.landmarks[child]!, r = child === 'spine' || child === 'chest' || child === 'pelvis' ? 16 : child === 'neck' || child === 'head' ? 12 : 6;
    for (let t = 0; t <= 1; t += 0.02) { const cx = (p[0]! + (c[0]! - p[0]!) * t) * W, cy = (p[1]! + (c[1]! - p[1]!) * t) * H;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) alpha[y * W + x] = 255; }
  }
  for (let i = 0; i < W * H; i++) if (alpha[i]) { const v = 90 + ((i * 7919) % 97); rgba[i * 4] = v; rgba[i * 4 + 1] = v - 30; rgba[i * 4 + 2] = v - 60; rgba[i * 4 + 3] = 255; }
  return { alpha, rgba };
}
const toPng = (rgba: Uint8ClampedArray): Buffer => { const png = new PNG({ width: W, height: H }); png.data = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length); return PNG.sync.write(png); };
const oracle = (rgba: Uint8ClampedArray, dir: string, name: string): Record<string, number> => {
  const p = path.join(dir, name + '.png'), r = path.join(dir, 'record.json'); writeFileSync(p, toPng(rgba)); writeFileSync(r, JSON.stringify(civetRecord()));
  const j = JSON.parse(execFileSync(process.execPath, [path.resolve(__dirname, '../tools/motion-proof/seam-oracle.mjs'), p, r, '--joints=head,neck', '--close=0.02', '--disc=0.12'], { encoding: 'utf8' }).trim()) as { perJoint: Record<string, { seamPixels: number }> };
  return { head: j.perJoint.head!.seamPixels, neck: j.perJoint.neck!.seamPixels };
};

describe('fixture rig underlap', () => {
  it('duplicates only child pixels within the band, keeps alpha coverage exact, leaves the strict cut identical, orders parents first, and refuses a bad band', () => {
    const rec = civetRecord(), { alpha } = paint(), strict = cutFixtureParts(alpha, W, H, rec), band = cutFixtureParts(alpha, W, H, rec, { underlapPx: 10 });
    expect(strict.underlapPx).toBe(0); expect(strict.parts.every((p) => p.underlapCount === 0)).toBe(true); expect(band.underlapPx).toBe(10);
    expect(JSON.stringify({ ...strict, parts: strict.parts.map((p) => ({ ...p, mask: undefined })) })).toBe(JSON.stringify({ ...cutFixtureParts(alpha, W, H, rec, { underlapPx: 0 }), parts: strict.parts.map((p) => ({ ...p, mask: undefined })) }));
    // Owners: strict masks partition the alpha; band masks cover the alpha and the extra pixels belong to a child of the part.
    const owner = new Int16Array(W * H).fill(-1);
    strict.parts.forEach((p, pi) => { for (let y = 0; y < p.box.height; y++) for (let x = 0; x < p.box.width; x++) if (p.mask[y * p.box.width + x]) owner[(p.box.y + y) * W + p.box.x + x] = pi; });
    let dup = 0;
    band.parts.forEach((p, pi) => {
      expect(p.pixelCount).toBe(strict.parts[pi]!.pixelCount);
      for (let y = 0; y < p.box.height; y++) for (let x = 0; x < p.box.width; x++) if (p.mask[y * p.box.width + x]) {
        const i = (p.box.y + y) * W + p.box.x + x; expect(alpha[i]).toBe(255);
        if (owner[i] !== pi) { dup++; expect(fixtureIsAncestor(pi, owner[i]!), `${p.id} borrowed from ${strict.parts[owner[i]!]!.id}`).toBe(true); }
      }
    });
    expect(dup).toBeGreaterThan(50); expect(dup).toBe(band.parts.reduce((n, p) => n + p.underlapCount, 0));
    expect(band.parts.find((p) => p.id === 'neck')!.underlapCount).toBeGreaterThan(0); expect(band.parts.find((p) => p.id === 'torso')!.underlapCount).toBeGreaterThan(0); expect(band.parts.find((p) => p.id === 'head')!.underlapCount).toBe(0); // the head has no child part
    expect(FIXTURE_DRAW_ORDER).toHaveLength(FIXTURE_PARTS.length); FIXTURE_DRAW_ORDER.forEach((pi, k) => { const parent = fixtureParentPart(pi); if (parent >= 0) expect(FIXTURE_DRAW_ORDER.indexOf(parent)).toBeLessThan(k); });
    expect(() => cutFixtureParts(alpha, W, H, rec, { underlapPx: -1 })).toThrow(/underlapPx/); expect(() => cutFixtureParts(alpha, W, H, rec, { underlapPx: 500 })).toThrow(/underlapPx/);
    // The bound rig draws in that order too.
    const sprites: RigSpriteLike[] = [], f: FixtureDisplayFactory = { container: (): RigContainerLike => ({ x: 0, y: 0, rotation: 0, visible: true, addChild: () => undefined, removeChild: () => undefined, destroy: () => undefined }), partSprite: (part) => { const s = { x: 0, y: 0, rotation: 0, visible: true, id: part.id, anchor: { set: () => undefined }, destroy: () => undefined }; sprites.push(s); return s; } };
    const rig = createFixtureRig({ record: rec, cut: band, factory: f }); const ids = (sprites as unknown as { id: string }[]).map((s) => s.id);
    expect(ids.indexOf('torso')).toBeLessThan(ids.indexOf('neck')); expect(ids.indexOf('neck')).toBeLessThan(ids.indexOf('head')); expect(ids.indexOf('foreNearUpper')).toBeLessThan(ids.indexOf('foreNearLower')); rig.dispose();
  });
  it('renders the rest pose byte-identical to the keyed master for both cuts; a hit recoil opens a head and neck seam under the strict cut that the underlap closes', () => {
    const rec = civetRecord(), { alpha, rgba } = paint(), strict = cutFixtureParts(alpha, W, H, rec), band = cutFixtureParts(alpha, W, H, rec, { underlapPx: 10 });
    expect(changedChannels(renderPosedCut(strict, rec, rgba, {}).rgba, rgba)).toBe(0); expect(changedChannels(renderPosedCut(band, rec, rgba, {}).rgba, rgba)).toBe(0);
    const card = compileBodyCard(rec), hit = buildTimeline(card, 'hit', 3), pose = poseFromTimeline(hit, hit.bodyMs * 0.25);
    expect(pose.head!.rotation).toBeLessThan(0); expect(pose.root!.dx).toBeLessThan(0);
    const dir = mkdtempSync(path.join(tmpdir(), 'underlap-'));
    const open = oracle(renderPosedCut(strict, rec, rgba, pose).rgba, dir, 'strict'), closed = oracle(renderPosedCut(band, rec, rgba, pose).rgba, dir, 'band'), rest = oracle(rgba, dir, 'rest');
    const opened = open.head! + open.neck! - rest.head! - rest.neck!, remaining = closed.head! + closed.neck! - rest.head! - rest.neck!; // pose minus rest, as the oracle is read
    expect(opened).toBeGreaterThan(20); // the seam opens under the strict cut
    expect(remaining).toBeLessThan(opened * 0.5); // the underlap closes most of it on the synthetic tubes (the real master is measured by rig-pose-render.mjs)
    // Limit-driven depth: deeper bands where the cut swings farther, never past the cap, floor from underlapPx; rest still exact; the seam closes at least as well.
    const auto = cutFixtureParts(alpha, W, H, rec, { underlapPx: 4, underlapByLimit: { limitsDeg: QUADRUPED_TEMPLATE.limitsDeg, capPx: 30 } });
    expect(auto.parts.reduce((n, p) => n + p.underlapCount, 0)).toBeGreaterThan(band.parts.reduce((n, p) => n + p.underlapCount, 0) * 0.5);
    expect(changedChannels(renderPosedCut(auto, rec, rgba, {}).rgba, rgba)).toBe(0);
    const autoClosed = oracle(renderPosedCut(auto, rec, rgba, pose).rgba, dir, 'auto'); expect(autoClosed.head! + autoClosed.neck! - rest.head! - rest.neck!).toBeLessThanOrEqual(remaining);
    expect(() => cutFixtureParts(alpha, W, H, rec, { underlapByLimit: { limitsDeg: QUADRUPED_TEMPLATE.limitsDeg, capPx: 0 } })).toThrow(/capPx/);
    expect(() => renderPosedCut(strict, rec, new Uint8ClampedArray(4), {})).toThrow(/size/);
    const magenta = new Uint8ClampedArray(rgba); for (let i = 0; i < magenta.length; i += 4) if (magenta[i + 3] === 0) { magenta[i] = 255; magenta[i + 2] = 255; } // a keyed master keeps magenta under alpha 0
    expect(changedChannels(renderPosedCut(strict, rec, magenta, {}).rgba, magenta)).toBe(0); expect(changedChannels(rgba, new Uint8ClampedArray(rgba.length))).toBeGreaterThan(0); expect(() => changedChannels(rgba, new Uint8ClampedArray(3))).toThrow(/size/);
  });
});
