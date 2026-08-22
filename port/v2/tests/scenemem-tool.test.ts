import { describe, expect, it } from 'vitest';
import { verifyReport } from '../tools/scenemem.mjs';

describe('scene-memory terminal verifier', () => {
  it('rejects a PASS-shaped report whose budget certification was laundered', () => {
    const result = verifyReport({
      schema: 'cf-v2-scene-memory-report/v1',
      runId: 'tampered-certification',
      status: 'pass',
      certification: 'bogus',
      inputs: { budget: null },
    }, 'tampered-certification', { budgetFile: null });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('report certification must be contract-budget');
    expect(result.errors).toContain('verification requires the same tracked --budget');
  });
});
