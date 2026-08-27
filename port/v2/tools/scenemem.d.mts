export type SceneMemoryVerifyOptions = Readonly<{
  budgetFile: string | null;
}>;

export type SceneMemoryVerifyResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

export const SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA: string;
export const SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE: string;
export const SCENE_MEMORY_BROWSER_FAMILY: 'microsoft-edge';
export const SCENE_MEMORY_BROWSER_PROTOCOL_VERSION: '1.3';
export const SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT: string;
export const SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256: string;
export const SCENE_MEMORY_BROWSER_PROFILE_CONTRACT: string;
export const SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256: string;
export const SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA:
  'cf-v2-scene-memory-shipyard-open-observation/v1';
export const SCENE_MEMORY_REQUIRED_CDP_DOMAINS: readonly string[];
export const SCENE_MEMORY_REQUIRED_CDP_METHODS: readonly string[];

export function validSceneMemoryBrowserAuthority(authority: unknown): boolean;

export function sceneMemoryBrowserAuthority(browser: unknown): Readonly<Record<string, string>> | null;

export function sceneMemoryBrowserAuthorityMatches(
  browser: unknown,
  authority: unknown,
): boolean;

export function sceneMemoryBrowserCapabilityInventoryErrors(input?: Readonly<{
  collectorSource?: string;
  browserCdpSource?: string;
}>): string[];

export function sceneMemoryShipyardOpenSettlementReasons(value: unknown): readonly string[];

export function sceneMemoryVeteranRaw(): string;

export function validateSceneMemoryBudget(record: unknown): Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

export function terminalOutcomeInventoryErrors(
  outcomes: unknown,
  canonicalOutcomes?: unknown,
): string[];

export function reportBrowserAuthorityErrors(
  browser: unknown,
  expectedBrowserAuthority: unknown,
): string[];

export function terminalPassEvidenceErrors(
  fatalEvents: unknown,
  findings: unknown,
): string[];

export function terminalProfileEvidenceErrors(profiles: unknown): string[];

export function terminalSourceAuthorityErrors(
  begin: unknown,
  end: unknown,
  current: unknown,
): string[];

export function verifyReport(
  report: unknown,
  expectedRunId: string,
  options: SceneMemoryVerifyOptions,
): SceneMemoryVerifyResult;
