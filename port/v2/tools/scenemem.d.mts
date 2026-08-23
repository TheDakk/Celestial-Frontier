export type SceneMemoryVerifyOptions = Readonly<{
  budgetFile: string | null;
}>;

export type SceneMemoryVerifyResult = Readonly<{
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
