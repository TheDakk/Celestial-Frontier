export type GlassEngineeringFixtureVariant =
  | 'original-orphan'
  | 'mx-only'
  | 'minedw-only'
  | 'cleared';

export interface GlassEngineeringFixtureOutcome {
  readonly ok: boolean;
  readonly checks: Readonly<Record<string, boolean>>;
  readonly reasons: readonly string[];
}

export const GLASS_VETERAN_ORPHAN_MINE_X: readonly (readonly [201, 4])[];
export const GLASS_VETERAN_ORPHAN_MINED: readonly (readonly [201, 1753898800000])[];
export const GLASS_VETERAN_SOL_SKIM_X: readonly (readonly [424242, 2])[];
export const GLASS_VETERAN_EARTH_WHERE: Readonly<{
  type: 'planet';
  gal: Readonly<{
    x: 90; y: -60; size: 14.5; sp: 4; tilt: 0.62; rot: 1.13;
    seed: 999; home: true;
  }>;
  star: Readonly<{ x: 560; y: 170; seed: 424242 }>;
  pseed: 133;
}>;
export function glassVeteranPreferenceRaw(variant?: GlassEngineeringFixtureVariant): string;
export const GLASS_VETERAN_PREF_RAW: string;
export function glassEngineeringFixtureOutcome(value: unknown): GlassEngineeringFixtureOutcome;
