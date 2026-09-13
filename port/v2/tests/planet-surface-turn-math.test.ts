import { describe, expect, it } from 'vitest';
import {
  PLANET_SURFACE_TURN_DURATION_SECONDS,
  PLANET_SURFACE_TURN_LONGITUDE_SCALE,
  PLANET_SURFACE_TURN_MAX_RADIANS,
  projectSurfaceTurnSampleV1,
  surfaceTurnAngleV1,
} from '../apps/game/src/planet-surface-turn-math.js';

type Projector = typeof projectSurfaceTurnSampleV1;
const angles = [-0.22, -0.11, 0, 0.11, 0.22];
const landmarks = [
  { latitude: 0, longitude: 0 },
  { latitude: 0.55, longitude: -0.7 },
  { latitude: -0.45, longitude: 0.65 },
];

// Independently place a fixed geographic landmark on a yawed unit sphere.
// Each selected longitude remains on the front hemisphere throughout the turn.
function screenLandmark(latitude: number, longitude: number, angle: number) {
  return {
    x: Math.cos(latitude) * Math.sin(longitude + angle),
    y: Math.sin(latitude),
    z: Math.cos(latitude) * Math.cos(longitude + angle),
  };
}

function expectLandmarkRecovery(project: Projector): void {
  for (const point of landmarks) for (const angle of angles) {
    const screen = screenLandmark(point.latitude, point.longitude, angle);
    const sample = project(screen.x, screen.y, angle);
    expect(sample).not.toBeNull();
    expect(sample!.u).toBeCloseTo(point.longitude * 1.4, 12);
    expect(sample!.latitude).toBeCloseTo(Math.sin(point.latitude), 12);
    expect(sample!.z).toBeCloseTo(screen.z, 12);
  }
}

function expectFixedLight(project: Projector): void {
  const points = [[0, 0], [0.4, -0.25], [-0.6, 0.3], [0.8, 0.5]];
  for (const [x, y] of points) {
    const baseline = project(x!, y!, 0);
    expect(baseline).not.toBeNull();
    for (const angle of angles) {
      const sample = project(x!, y!, angle);
      expect(sample).not.toBeNull();
      expect(sample!.shade).toBeCloseTo(baseline!.shade, 12);
      expect(sample!.z).toBeCloseTo(baseline!.z, 12);
    }
  }
}

describe('finite planet surface turn', () => {
  it('keeps the finite duration, maximum yaw and longitude scale explicit', () => {
    expect(PLANET_SURFACE_TURN_DURATION_SECONDS).toBe(18);
    expect(PLANET_SURFACE_TURN_MAX_RADIANS).toBe(0.22);
    expect(PLANET_SURFACE_TURN_LONGITUDE_SCALE).toBe(1.4);
  });

  it('starts and settles at zero, peaks halfway, and stays bounded', () => {
    expect(surfaceTurnAngleV1(0)).toBe(0);
    expect(surfaceTurnAngleV1(4.5)).toBeCloseTo(0.11, 12);
    expect(surfaceTurnAngleV1(9)).toBeCloseTo(0.22, 12);
    expect(surfaceTurnAngleV1(13.5)).toBeCloseTo(0.11, 12);
    for (let step = 0; step <= 180; step++) {
      const angle = surfaceTurnAngleV1(step / 10);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThanOrEqual(0.22);
    }
    for (const elapsed of [18, 18.001, 36, Number.MAX_VALUE]) {
      expect(surfaceTurnAngleV1(elapsed)).toBe(0);
    }
  });

  it('approaches zero velocity at both ends instead of snapping', () => {
    const dt = 0.001;
    const startSlope = surfaceTurnAngleV1(dt) / dt;
    const endSlope = (surfaceTurnAngleV1(18) - surfaceTurnAngleV1(18 - dt)) / dt;
    expect(startSlope).toBeGreaterThan(0);
    expect(Math.abs(startSlope)).toBeLessThan(0.00001);
    expect(Math.abs(endSlope)).toBeLessThan(0.00001);
    expect(startSlope).toBeCloseTo(-endSlope, 10);
  });

  it('returns the settled angle for invalid or negative elapsed time', () => {
    for (const elapsed of [NaN, Infinity, -Infinity, -0.001, -18,
      undefined, null, '9'] as unknown[]) {
      expect(surfaceTurnAngleV1(elapsed as number)).toBe(0);
    }
  });
});

describe('front-sphere surface projection', () => {
  it('recovers fixed geographic landmarks while their image positions move', () => {
    expectLandmarkRecovery(projectSurfaceTurnSampleV1);
    const a = screenLandmark(0, 0, -0.22);
    const b = screenLandmark(0, 0, 0.22);
    expect(a.x).toBeLessThan(-0.2);
    expect(b.x).toBeGreaterThan(0.2);
    expect(a.y).toBe(b.y);
    expect(projectSurfaceTurnSampleV1(a.x, a.y, -0.22)!.u).toBeCloseTo(0, 12);
    expect(projectSurfaceTurnSampleV1(b.x, b.y, 0.22)!.u).toBeCloseTo(0, 12);
  });

  it('preserves the unit-disk silhouette and exact front-hemisphere landmarks', () => {
    expect(projectSurfaceTurnSampleV1(0, 0, 0)).toEqual({ u: 0, latitude: 0, z: 1, shade: 0.86 });
    for (const angle of angles) {
      for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const sample = projectSurfaceTurnSampleV1(x!, y!, angle);
        expect(sample).not.toBeNull();
        expect(sample!.z).toBe(0);
      }
      for (const [x, y] of [[1 + Number.EPSILON, 0], [0, -1.001], [0.8, 0.8]]) {
        expect(projectSurfaceTurnSampleV1(x!, y!, angle)).toBeNull();
      }
    }
    expect(projectSurfaceTurnSampleV1(1, 0, 0)!.u).toBeCloseTo(Math.PI * 0.7, 12);
    expect(projectSurfaceTurnSampleV1(-1, 0, 0)!.u).toBeCloseTo(-Math.PI * 0.7, 12);
  });

  it('keeps unscaled canonical light fixed while longitude turns', () => {
    expectFixedLight(projectSurfaceTurnSampleV1);
    expect(projectSurfaceTurnSampleV1(-1, 0, 0)!.shade).toBe(0.42);
    expect(projectSurfaceTurnSampleV1(0, -1, 0)!.shade).toBe(0.30);
    expect(projectSurfaceTurnSampleV1(1, 0, 0)!.shade).toBe(0);
    expect(projectSurfaceTurnSampleV1(0, 1, 0)!.shade).toBe(0);
    const expectedShade = -0.42 * 0.4 - 0.30 * -0.25 + 0.86 * Math.sqrt(1 - 0.4 ** 2 - 0.25 ** 2);
    expect(projectSurfaceTurnSampleV1(0.4, -0.25, 0.22)!.shade).toBeCloseTo(expectedShade, 12);
  });

  it('refuses nonfinite coordinates and out-of-contract yaw', () => {
    for (const value of [NaN, Infinity, -Infinity, null, undefined, '0'] as unknown[]) {
      expect(projectSurfaceTurnSampleV1(value as number, 0, 0)).toBeNull();
      expect(projectSurfaceTurnSampleV1(0, value as number, 0)).toBeNull();
      expect(projectSurfaceTurnSampleV1(0, 0, value as number)).toBeNull();
    }
    for (const angle of [-0.220001, 0.220001, Math.PI]) {
      expect(projectSurfaceTurnSampleV1(0, 0, angle)).toBeNull();
    }
  });

  it('rejects rotating a baked disc: the landmark and fixed-light oracles both detect it', () => {
    const bakedRotation: Projector = (x, y, angle) => projectSurfaceTurnSampleV1(
      x * Math.cos(angle) + y * Math.sin(angle),
      y * Math.cos(angle) - x * Math.sin(angle),
      0,
    );
    expect(() => expectLandmarkRecovery(bakedRotation)).toThrow();
    expect(() => expectFixedLight(bakedRotation)).toThrow();
  });

  it('rejects sliding a planar texture: the same geometric and light oracles both detect it', () => {
    const planarShift: Projector = (x, y, angle) => projectSurfaceTurnSampleV1(x - angle, y, 0);
    expect(() => expectLandmarkRecovery(planarShift)).toThrow();
    expect(() => expectFixedLight(planarShift)).toThrow();
  });
});
