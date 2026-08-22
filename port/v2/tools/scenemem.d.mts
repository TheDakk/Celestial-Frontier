export type SceneMemoryVerifyOptions = Readonly<{
  budgetFile: string | null;
}>;

export type SceneMemoryVerifyResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

export function verifyReport(
  report: unknown,
  expectedRunId: string,
  options: SceneMemoryVerifyOptions,
): SceneMemoryVerifyResult;
