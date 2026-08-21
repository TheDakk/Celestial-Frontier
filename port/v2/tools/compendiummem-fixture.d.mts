export const COMPENDIUM_FIXTURE_SPEC_PATH: string;
export function stableJson(value: unknown): string;
export function loadCompendiumFixtureSpec(): Readonly<Record<string, unknown>>;
export function buildCompendiumFixture(options?: { verifyDigest?: boolean }): Readonly<{
  schema: string;
  generator: string;
  seed: number;
  count: number;
  rowsSha256: string;
  sameSeedPair: readonly string[];
  filterBeacon: string;
  rows: Array<[string, Record<string, unknown>]>;
}>;
export function buildBrokenBaselineProjection(fixture?: ReturnType<typeof buildCompendiumFixture>): Readonly<{
  schema: string;
  sourceRowsSha256: string;
  count: number;
  uniqueSeeds: number;
  rekeys: ReadonlyArray<{
    index: number; logicalId: string; originalSeed: number; projectedSeed: number;
  }>;
  rowsSha256: string;
  codex: Array<Record<string, unknown>>;
}>;
