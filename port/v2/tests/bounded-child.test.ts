import { describe, expect, it } from 'vitest';
import { runBoundedNodeMarker } from '../test-support/bounded-child.js';

describe('bounded synchronous selftest child', () => {
  it('classifies pass, timeout, nonzero, and vacuous marker outcomes independently', () => {
    const pass = runBoundedNodeMarker(
      ['-e', "process.stdout.write('EXPECTED PASS')"],
      'EXPECTED PASS',
      5_000,
    );
    expect(pass.kind).toBe('pass');

    const timedOut = runBoundedNodeMarker(
      ['-e', 'setInterval(() => {}, 1000)'],
      'EXPECTED PASS',
      100,
    );
    expect(timedOut.kind).toBe('timed-out');
    expect(timedOut.diagnostic).toContain('ETIMEDOUT');

    const nonzero = runBoundedNodeMarker(
      ['-e', "process.stdout.write('EXPECTED PASS'); process.exit(7)"],
      'EXPECTED PASS',
      5_000,
    );
    expect(nonzero.kind).toBe('nonzero');
    expect(nonzero.status).toBe(7);

    const missing = runBoundedNodeMarker(
      ['-e', "process.stdout.write('not the marker')"],
      'EXPECTED PASS',
      5_000,
    );
    expect(missing.kind).toBe('missing-marker');
    expect(missing.status).toBe(0);
  });

  it('rejects invalid timeout and marker inputs before spawning', () => {
    expect(() => runBoundedNodeMarker(['-e', ''], 'marker', 0)).toThrow(/timeout/);
    expect(() => runBoundedNodeMarker(['-e', ''], '', 1_000)).toThrow(/marker/);
  });
});
