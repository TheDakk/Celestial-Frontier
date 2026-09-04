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
export const GLASS_VETERAN_PREF_RAW_SHA256: '3ea92b8b7fbb87357c1c275105fc1f520618aa9e8a14aeda11ad362e871311b0';
export const GLASS_VETERAN_CAPTURE_ORACLE: Readonly<{
  schema: 'cf-v2-glass-veteran-capture-oracle/v1';
  preferenceRawSha256: typeof GLASS_VETERAN_PREF_RAW_SHA256;
  title: 'Homeworld';
  worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
  ecologyEpoch: 12;
  previewCount: 8;
  fullRosterCount: 21;
  fullRosterFingerprint: 'cwr1:21:6980:bc437ec6';
  contextKey: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2|epoch:12|cwr1:21:6980:bc437ec6';
  contactCapturePoints: 0;
  biosphereYield: Readonly<{
    yield: 16;
    used: 0;
    remaining: 16;
    cycle: 0;
  }>;
  odds: Readonly<{
    tame: Readonly<{
      eligibleCount: 9;
      overallChance: 0.43333333333333335;
      chanceMin: 0.36;
      chanceMax: 0.6;
    }>;
    scavenge: Readonly<{
      eligibleCount: 9;
      overallChance: 0.7486666666666666;
      chanceMin: 0.576;
      chanceMax: 0.95;
    }>;
    sample: Readonly<{
      eligibleCount: 3;
      overallChance: 0.7050000000000001;
      chanceMin: 0.54;
      chanceMax: 0.8999999999999999;
    }>;
  }>;
}>;
export function glassEngineeringFixtureOutcome(value: unknown): GlassEngineeringFixtureOutcome;
