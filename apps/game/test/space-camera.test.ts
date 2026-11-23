import { describe, expect, it } from 'vitest';
import { ascentCamera, descentCamera, entryZoom, minSideOf, toScreen, zoomAbout, zoomLimits } from '../src/space/camera';

describe('map camera', () => {
  it('the shorter side of the view is never under 80', () => {
    expect(minSideOf({ w: 390, h: 844 })).toBe(390);
    expect(minSideOf({ w: 1280, h: 720 })).toBe(720);
    expect(minSideOf({ w: 0, h: 0 })).toBe(80);
  });

  it("each mode has the game's zoom limits", () => {
    const galaxy = entryZoom('galaxy', 600);
    const system = entryZoom('system', 600);
    expect(galaxy).toBeCloseTo(0.21, 12);
    expect(system).toBeCloseTo(0.75, 12);
    expect(zoomLimits('universe', 600, 0)).toEqual([0.0024, 40]);
    expect(zoomLimits('galaxy', 600, galaxy)).toEqual([galaxy * 0.5, 240]);
    expect(zoomLimits('system', 600, system)).toEqual([system * 0.5, 200]);
    expect(zoomLimits('surface', 600, 0)).toEqual([0.45, (600 / 420) * 1.6]);
    expect(zoomLimits('surface', 100, 0)).toEqual([0.45, 0.9]);
  });

  it('zooming about a point keeps the world point under it in place', () => {
    const view = { w: 800, h: 600 };
    const cam = { x: 120, y: -40, z: 2 };
    const world = { x: cam.x + 150 / cam.z, y: cam.y - 90 / cam.z };
    for (const factor of [1.14, 0.88, 3, 1000, 0.000001]) {
      const next = zoomAbout(cam, factor, 150, -90, [0.5, 8]);
      expect(next.z).toBe(Math.min(8, Math.max(0.5, cam.z * factor)));
      const at = toScreen(next, view, world.x, world.y);
      expect(at.x).toBeCloseTo(view.w / 2 + 150, 9);
      expect(at.y).toBeCloseTo(view.h / 2 - 90, 9);
    }
  });

  it('zooming about the centre of the view leaves the centre where it was', () => {
    expect(zoomAbout({ x: 7, y: 9, z: 1 }, 1.22, 0, 0, [0.1, 10])).toEqual({ x: 7, y: 9, z: 1.22 });
  });

  it('a descent is centred and eases in from wide to just above the entry zoom', () => {
    for (const mode of ['galaxy', 'system'] as const) {
      const base = entryZoom(mode, 600);
      expect(descentCamera(mode, 600)).toEqual({ from: { x: 0, y: 0, z: base * 0.35 }, to: { x: 0, y: 0, z: base * 1.05 } });
    }
  });

  it('an ascent centres the outer map on what was left and eases out', () => {
    const fromGalaxy = ascentCamera({ kind: 'galaxy', x: 90, y: -60, size: 78 }, 600);
    expect(fromGalaxy.to).toEqual({ x: 90, y: -60, z: (0.55 * 600 / 78) * 0.8 });
    expect(fromGalaxy.from).toEqual({ x: 90, y: -60, z: fromGalaxy.to.z * 1.6 });
    expect(ascentCamera({ kind: 'galaxy', x: 1, y: 2, size: 0 }, 600).to.z).toBe((0.55 * 600 / 40) * 0.8);
    const fromStar = ascentCamera({ kind: 'star', x: 560, y: 170 }, 600);
    expect(fromStar.to).toEqual({ x: 560, y: 170, z: (600 / 34) * 0.8 });
    expect(fromStar.from).toEqual({ x: 560, y: 170, z: fromStar.to.z * 1.4 });
  });
});
