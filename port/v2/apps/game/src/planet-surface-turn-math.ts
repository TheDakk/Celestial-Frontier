/** Finite surface yaw; generation, clocks and scene lifetime stay with callers. */
export const PLANET_SURFACE_TURN_DURATION_SECONDS = 18;
export const PLANET_SURFACE_TURN_MAX_RADIANS = 0.22;
export const PLANET_SURFACE_TURN_LONGITUDE_SCALE = 1.4;

export function surfaceTurnAngleV1(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0
    || elapsedSeconds >= PLANET_SURFACE_TURN_DURATION_SECONDS) return 0;
  const envelope = Math.sin(Math.PI * elapsedSeconds / PLANET_SURFACE_TURN_DURATION_SECONDS);
  return PLANET_SURFACE_TURN_MAX_RADIANS * envelope * envelope;
}

/** Sample the front hemisphere. Yaw changes longitude, while silhouette and
 * the canonical screen-space light remain fixed. This is not a 360-degree map. */
export function projectSurfaceTurnSampleV1(
  x: number,
  y: number,
  angle: number,
): { u: number; latitude: number; z: number; shade: number } | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(angle)
    || Math.abs(angle) > PLANET_SURFACE_TURN_MAX_RADIANS) return null;
  const radiusSquared = x * x + y * y;
  if (radiusSquared > 1) return null;
  const z = Math.sqrt(1 - radiusSquared);
  return {
    u: (Math.atan2(x, z) - angle) * PLANET_SURFACE_TURN_LONGITUDE_SCALE,
    latitude: y,
    z,
    shade: Math.max(-0.42 * x - 0.30 * y + 0.86 * z, 0),
  };
}
