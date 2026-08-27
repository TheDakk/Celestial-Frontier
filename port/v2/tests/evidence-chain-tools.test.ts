import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tool = (name: string): string => fileURLToPath(
  new URL(`../tools/${name}`, import.meta.url),
);
const source = (name: string): string => readFileSync(tool(name), 'utf8');
const workflow = readFileSync(
  fileURLToPath(new URL('../../../.github/workflows/test.yml', import.meta.url)),
  'utf8',
);
const workflowEvidenceChainErrors = (value: string): string[] => {
  const errors: string[] = [];
  const required = [
    'CF_V2_SLICE_SMOKE_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-slice',
    'CF_V2_GLASSMATRIX_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass',
    'node tools/smokereport.mjs --verify-run="$slice_run_id"',
    'node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
    'node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"',
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json',
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log',
    'port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
  ];
  for (const item of required) {
    if (value.split(item).length !== 2) errors.push(`missing-or-duplicate:${item}`);
  }
  const slice = value.indexOf('- name: one-attempt real-browser slice smoke');
  const glass = value.indexOf('- name: one-attempt 12-viewport Glass matrix');
  if (slice < 0 || glass <= slice) errors.push('ordered-chain');
  return errors;
};
const runSelftest = (name: string): string => execFileSync(
  process.execPath, [tool(name), '--selftest'], { encoding: 'utf8' },
);

describe('Slice → Glass → Arc 4 recovery evidence chain', () => {
  it('keeps immutable Slice evidence, interruption red, and its named verifier mutation-sensitive', () => {
    const output = runSelftest('smokereport.mjs');
    const collector = source('smokereport.mjs');
    expect(output).toContain('immutable evidence: selected per-run report/log accepted');
    expect(output).toContain('stale current PASS, interruption, dirty source, wrong run/source, missing artifact, and log mismatch rejected');
    expect(output).toContain('physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
    expect(collector.match(/spawnSync\(/g)).toHaveLength(1);
    expect(collector).toContain('--verify-run=<immutable-run-id>');
    expect(collector.indexOf('atomicWriteJson(currentReportPath, sentinel)'))
      .toBeLessThan(collector.indexOf('const run = spawnSync('));
    expect(collector).toContain('automaticRetries: 0');
  });

  it('requires an exact clean Slice predecessor for full Glass and binds the newest release semantics in both directions', () => {
    const output = runSelftest('glassmatrix.mjs');
    const collector = source('glassmatrix.mjs');
    expect(output).toContain('exact clean Slice predecessor accepted');
    expect(output).toContain('stale/interrupted/dirty/wrong/targeted/missing/mismatched bindings rejected');
    expect(output).toContain('physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
    expect(collector).toContain('full certifying Glass requires --slice-run=<immutable-Slice-run-id>');
    expect(collector).toContain('full certifying Glass requires clean committed source');
    expect(collector).toContain('Equipped capture-chance gear is included in the shown odds at +1.5 percentage points per point before the 95% overall chance ceiling, with its contribution capped at +25 percentage points; first contact remains unavailable');
    expect(collector).toContain('The shown odds ignore equipped capture-chance gear.');
    expect(collector).toContain('A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson');
    expect(collector).toContain('Escape from a wrong-world detour abandons Sol and the lesson.');
  });

  it('requires the exact immutable Slice+Glass pair for recovery and preserves one-attempt verification', () => {
    const output = runSelftest('arc4recovery.mjs');
    const collector = source('arc4recovery.mjs');
    const contract = source('arc4-recovery-contract.mjs');
    const glassContract = source('glassmatrix-evidence-contract.mjs');
    expect(output).toContain('ARC 4 RECOVERY SELFTEST: PASS');
    expect(collector).toContain('--slice-run=<Slice-run-id> --glass-run=<Glass-run-id>');
    expect(collector).toContain('--verify-run=<Recovery-run-id>');
    expect(collector).toContain('selected Glass predecessor failed verification');
    expect(contract).toContain('exact Slice/Glass predecessor chain');
    expect(contract).toContain('Glass-to-Slice nested predecessor binding');
    expect(collector).toContain('glassTerminalEvidenceErrors(report');
    expect(glassContract).toContain('Glass planned-vs-executed negative-control ledger');
    expect(glassContract).toContain('Glass Arc 4 capture outcome inventory is empty');
    expect(glassContract).toContain('Glass viewport inventory is not the exact ordered 12-row matrix');
    expect(collector).toContain('attemptCount: 1');
    expect(collector).toContain('automaticRetries: 0');
  });

  it('threads the exact Slice ID through hosted Glass and retains immutable carriers', () => {
    expect(workflowEvidenceChainErrors(workflow)).toEqual([]);

    const bareGlass = workflow.replace(
      'node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
      'npm run glassmatrix',
    );
    expect(workflowEvidenceChainErrors(bareGlass)).toContain(
      'missing-or-duplicate:node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
    );
    const pointerOnly = workflow
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json\n', '')
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log\n', '')
      .replace('            port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json\n', '');
    expect(workflowEvidenceChainErrors(pointerOnly)).toContain(
      'missing-or-duplicate:port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
    );
  });
});
