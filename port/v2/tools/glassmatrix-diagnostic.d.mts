export interface GlassDiagnosticProjection {
  readonly schema: 'cf-v2-glassmatrix-diagnostic-projection/v1';
  readonly runId: string;
  readonly status: 'pass' | 'fail' | 'instrument-fail';
  readonly exitCode: number;
  readonly source: Readonly<Record<string, unknown>>;
  readonly slice: Readonly<Record<string, unknown>>;
  readonly summary: Readonly<Record<string, unknown>>;
  readonly firstRed: string;
  readonly viewportTimings: ReadonlyArray<Readonly<{ label: string; durationMs: number }>>;
  readonly lastCompletedViewport: string | null;
  readonly report: Readonly<{ path: string; bytes: number; sha256: string }>;
  readonly gzip: Readonly<{
    bytes: number;
    sha256: string;
    encoding: 'gzip+base64';
    base64: string;
  }>;
}

export function validateGlassDiagnosticReport<T>(
  report: T,
  options?: Readonly<{
    glassRunId?: string;
    expectedSource?: unknown;
    expectedSlice?: unknown;
  }>,
): T;

export function createGlassDiagnosticProjection(
  reportBytes: Buffer,
  report: Record<string, any>,
): GlassDiagnosticProjection;

export function renderGlassDiagnosticSummary(
  projection: GlassDiagnosticProjection,
): string;

export function projectGlassDiagnostic(options?: Readonly<{
  glassRunId?: string;
  sliceRunId?: string;
  profile?: 'develop' | 'production' | string;
  directory?: string;
  summaryPath?: string;
  verifySlice?: (...args: any[]) => any;
}>): GlassDiagnosticProjection;
