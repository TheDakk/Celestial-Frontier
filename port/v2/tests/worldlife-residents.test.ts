/* B8: resident idle life on a landfall. The planner is pure and seeded (tier-bounded count, depth band, no
 * overlap, mass-scaled height, seeded facing and alert cadence); the layer plays the idle clip per resident
 * on the injected clock, layers an alert on its seeded cadence, orders draw by depth, survives a failed
 * portrait, and disposes totally. Negative controls: bad seed/tier/ground line refuse, a flora row is never
 * a resident, reduced motion freezes at t=0, a disposed layer never updates. */
import { describe, expect, it, vi } from 'vitest';
import type { RigSpriteLike } from '../apps/game/src/battle2/fixture-rig.js';
import { portraitClip } from '../apps/game/src/battle2/fallback.js';
import { RESIDENT_ALERT, RESIDENT_BAND, RESIDENT_COUNT, ResidentIdleLayer, planResidents, type ResidentNodeLike } from '../apps/game/src/worldlife/residents.js';
import type { PortraitImage } from '../apps/game/src/species-portrait.js';

const fauna = (seed: number, size = 2, kingdom = 'fauna') => ({ genome: { seed, size, kingdom }, label: `f${seed}` });
const rows = [fauna(1), fauna(2, 5), fauna(3, 0), fauna(4), { genome: { seed: 9, kingdom: 'flora' }, label: 'tree' }];
class Node implements ResidentNodeLike { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; scaleSet: [number, number] = [1, 1]; children: object[] = []; readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: () => undefined };
  addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } addChildAt(c: object, i: number) { this.children.splice(i, 0, c); } destroy() { this.destroyed = true; } }
const image = (w: number, h: number): PortraitImage => ({ width: w, height: h, source: { w, h }, pixels: () => { const px = new Uint8ClampedArray(w * h * 4); for (let y = Math.floor(h * 0.2); y < h * 0.9; y++) for (let x = Math.floor(w * 0.1); x < w * 0.9; x++) px[(y * w + x) * 4 + 3] = 255; return px; } });

describe('planResidents', () => {
  it('is seeded and deterministic, bounded by tier, keeps fauna only, spaces residents apart inside the band, scales by depth and mass, and refuses bad inputs', () => {
    const a = planResidents(rows, 77, 'desktop'), b = planResidents(rows, 77, 'desktop');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)); expect(a.residents).toHaveLength(RESIDENT_COUNT.desktop); expect(planResidents(rows, 77, 'phone').residents).toHaveLength(1);
    expect(a.residents.every((r) => r.genome.kingdom === 'fauna')).toBe(true); expect(planResidents([rows[4]!], 1, 'desktop').residents).toEqual([]);
    for (const r of a.residents) { expect(r.x).toBeGreaterThanOrEqual(RESIDENT_BAND.xMin); expect(r.x).toBeLessThanOrEqual(RESIDENT_BAND.xMax); expect(r.footY).toBeGreaterThanOrEqual(0.78 - RESIDENT_BAND.above - 1e-9); expect(r.footY).toBeLessThanOrEqual(0.78 + RESIDENT_BAND.below + 1e-9); expect(r.alertEveryMs).toBeGreaterThanOrEqual(RESIDENT_ALERT.minGapMs); expect(Number.isInteger(r.alertEveryMs)).toBe(false); }
    for (let i = 0; i < a.residents.length; i++) for (let j = i + 1; j < a.residents.length; j++) expect(Math.abs(a.residents[i]!.x - a.residents[j]!.x)).toBeGreaterThanOrEqual(RESIDENT_BAND.minGap - 1e-9);
    for (let i = 1; i < a.residents.length; i++) expect(a.residents[i]!.footY).toBeGreaterThanOrEqual(a.residents[i - 1]!.footY); // far to near
    expect(new Set(a.residents.map((r) => r.index)).size).toBe(a.residents.length); // no resident twice
    const big = planResidents([fauna(1, 5), fauna(2, 0)], 3, 'desktop'), h = (r: { genome: { size?: number } }) => r.genome.size;
    const titanic = big.residents.find((r) => h(r as never) === 5)!, tiny = big.residents.find((r) => h(r as never) === 0)!; expect(titanic.mass).toBeGreaterThan(tiny.mass);
    expect(planResidents(rows, 78, 'desktop').residents.map((r) => r.x)).not.toEqual(a.residents.map((r) => r.x)); // another seed, another arrangement
    expect(() => planResidents(rows, Number.NaN, 'desktop')).toThrow(/seed/); expect(() => planResidents(rows, 1, 'tablet' as never)).toThrow(/tier/); expect(() => planResidents(rows, 1, 'desktop', 1.2)).toThrow(/groundLine/);
  });
});

describe('ResidentIdleLayer', () => {
  const make = (over: { portrait?: (g: Readonly<Record<string, unknown>>) => Promise<PortraitImage>; reduced?: boolean; tier?: 'desktop' | 'phone' } = {}) => {
    let now = 1000; const nodes: Node[] = [], sprites: RigSpriteLike[] = [];
    const plan = planResidents(rows, 77, over.tier ?? 'desktop');
    const layer = new ResidentIdleLayer({ plan, clock: () => now, width: 1024, height: 576, ...(over.reduced !== undefined ? { reducedMotion: over.reduced } : {}),
      portrait: over.portrait ?? (async (g) => image(120 + Number(g.seed), 100)), factory: { container: () => { const n = new Node(); nodes.push(n); return n; }, portraitSprite: () => { const s = new Node() as unknown as RigSpriteLike; sprites.push(s); return s; } } });
    return { layer, plan, nodes, sprites, setNow: (ms: number) => { now = ms; } };
  };
  it('places every resident when its portrait arrives, in depth order, scaled to its planned height, breathing on the injected clock with a seeded alert', async () => {
    const date = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); });
    const { layer, plan, setNow } = make();
    expect(layer.status()).toMatchObject({ planned: 3, placed: 0, pending: 3, failed: [] });
    const status = await layer.ready; expect(status).toMatchObject({ planned: 3, placed: 3, pending: 0, failed: [] });
    const root = layer.container as Node; expect(root.children).toHaveLength(3);
    const holders = root.children as Node[]; for (let i = 1; i < holders.length; i++) expect(holders[i]!.y).toBeGreaterThanOrEqual(holders[i - 1]!.y); // near draws last
    const r0 = plan.residents[0]!, h0 = holders[0]!; expect(h0.x).toBeCloseTo(r0.x * 1024); expect(h0.y).toBeCloseTo(r0.footY * 576); expect(Math.sign(h0.scaleSet[0])).toBe(r0.facing);
    const bodyPx = 0.7 * 100 * h0.scaleSet[1]; expect(bodyPx).toBeCloseTo(r0.height * 576, 6); // alpha box is 70 % of the portrait height
    const portrait = (h0.children[0] as Node).children[0] as Node; const y0 = portrait.y; // the rig moves its portrait sprite by the root offsets
    setNow(1000 + 700); layer.update(); expect(portrait.y).not.toBe(y0); // the idle bob moved the portrait
    const idle = portraitClip('idle', r0.mass, r0.seed); setNow(1000 + idle.durationMs); layer.update(); expect(portrait.y).toBeCloseTo(y0, 6); // one full period returns to rest
    layer.resize(2048, 1152); expect(h0.x).toBeCloseTo(r0.x * 2048); expect(h0.scaleSet[1]).toBeCloseTo(2 * (r0.height * 576) / (0.7 * 100), 6);
    date.mockRestore();
  });
  it('a failed portrait is recorded and skipped; reduced motion freezes at rest; dispose is total and idempotent', async () => {
    const { layer } = make({ portrait: async (g) => { if (g.seed === 2) throw new Error('no thumb'); return image(100, 100); } });
    const s = await layer.ready; expect(s.placed).toBe(2); expect(s.failed).toEqual([expect.stringMatching(/no thumb/)]);
    const { layer: still, setNow } = make({ reduced: true }); await still.ready;
    const holder = (still.container as Node).children[0] as Node, root = holder.children[0] as Node, portrait = root.children[0] as Node; const y = portrait.y; setNow(9000); still.update(); expect(portrait.y).toBe(y);
    still.setReducedMotion(false); setNow(9700); still.update(); expect(portrait.y).not.toBe(y);
    const nodes = [holder, root]; still.dispose(); still.dispose(); expect(nodes.every((n) => n.destroyed)).toBe(true); expect((still.container as Node).destroyed).toBe(true);
    setNow(20000); expect(() => still.update()).not.toThrow();
    const phone = make({ tier: 'phone' }); await phone.layer.ready; expect(phone.layer.status().placed).toBe(1);
  });
});
