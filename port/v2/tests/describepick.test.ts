/* describePick — the game's card ROUTER, exported by the descriptors lift but
   never exercised until the slice wired deco picks. It reads TWO app globals
   the capture hooks do not install (`st`, `customNames` — recorded as D-ST in
   DEVIATIONS): without a seam it throws on first call, the same
   green-while-broken shape as worldgen's GAL_SPRITES. These are REAL-INPUT
   tests through the seam the slice installs. */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { installCaptureHooks, describePick } from '@cf/domain-descriptors';
import { galaxyProfile, starsInCell } from '@cf/domain-worldgen';

const g = globalThis as Record<string, unknown>;
const GAL = { seed: 999, x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, home: true };

beforeAll(() => {
  installCaptureHooks();
  g.st = { gal: GAL, star: null };
  g.customNames = new Map<string, string>();
});
afterAll(() => { delete g.st; delete g.customNames; });

describe('describePick — the card router over the seam', () => {
  it('★ a REAL deco object (home-galaxy nebula) gets a card with where.type=galaxy', () => {
    /* scan real cells for deco — real input, not a hand-shaped object */
    const prof = galaxyProfile(999) as Record<string, unknown>;
    let dc: Record<string, unknown> | null = null;
    outer: for (let cx = -12; cx <= 12; cx++) for (let cy = -12; cy <= 12; cy++) {
      const cell = starsInCell(999, prof, cx, cy) as unknown as { deco: Array<Record<string, unknown>> };
      for (const d of cell.deco) if (['h2', 'neb', 'mol', 'plan', 'rem'].includes(d.k as string)) { dc = d; break outer; }
    }
    expect(dc, 'no deco found in the scanned home-galaxy window').toBeTruthy();
    const card = describePick({ kind: 'deco', data: dc } as never) as Record<string, unknown> | null;
    expect(card).toBeTruthy();
    expect(typeof card!.title).toBe('string');
    expect((card!.title as string).length).toBeGreaterThan(0);
    expect((card!.where as { type: string }).type).toBe('galaxy');
  });
  it('a star pick routes to starDescriptor and carries the where + name key', () => {
    const card = describePick({ kind: 'star', data: { seed: 424242, x: 560, y: 170 } } as never) as Record<string, unknown>;
    expect(card).toBeTruthy();
    expect((card.where as { star: { seed: number } }).star.seed).toBe(424242);
    expect(card._nameKey).toBe('s424242');
  });
  it('custom names ride the card (title swap + "named by you")', () => {
    (g.customNames as Map<string, string>).set('s424242', 'Homefire');
    const card = describePick({ kind: 'star', data: { seed: 424242, x: 560, y: 170 } } as never) as Record<string, unknown>;
    expect(card.title).toBe('Homefire');
    expect(String(card.sub)).toMatch(/named by you/);
    (g.customNames as Map<string, string>).delete('s424242');
  });
  it('the CF173-01 guard: star-needing kinds bail to null when st.star is null', () => {
    expect(describePick({ kind: 'planet', data: {} } as never)).toBeNull();
    expect(describePick({ kind: 'moon', data: {} } as never)).toBeNull();
  });
});
