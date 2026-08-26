import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const collectorPath = fileURLToPath(
  new URL('../tools/arc4recovery.mjs', import.meta.url),
);

describe('Arc 4 real-time recovery certificate instrument', () => {
  it('keeps its real-time, closure, authority, transition and report controls mutation-sensitive', () => {
    const output = execFileSync(process.execPath, [collectorPath, '--selftest'], {
      encoding: 'utf8',
    });
    expect(output).toContain('ARC 4 RECOVERY SELFTEST: PASS');
  });
});
