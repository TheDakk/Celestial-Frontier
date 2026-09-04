import { spawnSync } from 'node:child_process';

export type BoundedChildResult = Readonly<{
  kind: 'pass' | 'timed-out' | 'spawn-error' | 'nonzero' | 'missing-marker';
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  diagnostic: string;
}>;

export function runBoundedNodeMarker(
  args: readonly string[],
  marker: string,
  timeoutMs: number,
): BoundedChildResult {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('bounded child timeout must be a positive safe integer');
  }
  if (marker.length === 0) throw new TypeError('bounded child marker must be nonempty');
  const result = spawnSync(process.execPath, [...args], {
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const error = result.error as NodeJS.ErrnoException | undefined;
  const kind = error?.code === 'ETIMEDOUT'
    ? 'timed-out'
    : error
      ? 'spawn-error'
      : result.status !== 0
        ? 'nonzero'
        : !stdout.includes(marker)
          ? 'missing-marker'
          : 'pass';
  const diagnostic = [
    `kind=${kind}`,
    `status=${String(result.status)}`,
    `signal=${String(result.signal)}`,
    error ? `error=${error.code ?? error.message}` : '',
    stderr ? `stderr=${stderr.slice(0, 1_000)}` : '',
  ].filter(Boolean).join('; ');
  return Object.freeze({
    kind,
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    diagnostic,
  });
}
