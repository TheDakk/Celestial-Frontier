import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  SLICE_SCREENSHOT_LOGICAL_NAMES,
  sliceScreenshotInventoryLine,
} from '../tools/slicesmoke-contract.mjs';
import { runBoundedNodeMarker } from '../test-support/bounded-child.js';

const tool = (name: string): string => fileURLToPath(
  new URL(`../tools/${name}`, import.meta.url),
);
const SELFTEST_CHILD_TIMEOUT_MS = 15_000;
const source = (name: string): string => readFileSync(tool(name), 'utf8');
const workflow = readFileSync(
  fileURLToPath(new URL('../../../.github/workflows/test.yml', import.meta.url)),
  'utf8',
);
const previewWorkflow = readFileSync(
  fileURLToPath(new URL('../../../.github/workflows/dev-preview-package.yml', import.meta.url)),
  'utf8',
);
const claudeInstructions = readFileSync(
  fileURLToPath(new URL('../../../CLAUDE.md', import.meta.url)),
  'utf8',
);
const activeLines = (value: string): string[] => value.split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'));
const workflowStepLines = (value: string, stepName: string): string[] | null => {
  const heading = `      - name: ${stepName}`;
  const lines = value.split(/\r?\n/);
  const starts = lines.flatMap((line, index) => line === heading ? [index] : []);
  if (starts.length !== 1) return null;
  const start = starts[0]!;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (/^      - (?:name:|uses:)/.test(lines[index] ?? '')) {
      end = index;
      break;
    }
  }
  return activeLines(lines.slice(start, end).join('\n'));
};
const workflowEvidenceChainErrors = (
  value: string,
  archiveStepName = 'archive battery reports',
): string[] => {
  const errors: string[] = [];
  const globallyRequired = [
    'CF_V2_SLICE_SMOKE_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-slice',
    'CF_V2_GLASSMATRIX_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass',
  ];
  const sliceCommands = [
    'id: slice',
    'npm run smoke:ci',
    'slice_run_id="$(jq -er \'.run.id\' apps/game/smoke/slice-smoke-report.json)"',
    'test "$slice_run_id" = "$CF_V2_SLICE_SMOKE_RUN_ID"',
    'printf \'run_id=%s\\n\' "$slice_run_id" >> "$GITHUB_OUTPUT"',
    'node tools/smokereport.mjs --verify-run="$slice_run_id"',
  ];
  const glassCommands = [
    'id: glass',
    'slice_run_id="${{ steps.slice.outputs.run_id }}"',
    'node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
    'glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"',
    'test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"',
    'printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"',
    'node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"',
  ];
  const carriers = [
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json',
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log',
    'port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
  ];
  const globalActive = activeLines(value);
  for (const item of globallyRequired) {
    if (globalActive.filter((line) => line === item).length !== 1) {
      errors.push(`missing-or-duplicate:${item}`);
    }
  }
  const slice = workflowStepLines(value, 'one-attempt real-browser slice smoke');
  const glass = workflowStepLines(value, 'one-attempt 12-viewport Glass matrix');
  const archive = workflowStepLines(value, archiveStepName);
  const requireOrdered = (lines: string[] | null, required: string[]) => {
    let prior = -1;
    for (const item of required) {
      const matches = lines?.flatMap((line, index) => line === item ? [index] : []) ?? [];
      if (matches.length !== 1) errors.push(`missing-or-duplicate:${item}`);
      else if (matches[0]! <= prior) errors.push(`misordered:${item}`);
      else prior = matches[0]!;
    }
  };
  requireOrdered(slice, sliceCommands);
  requireOrdered(glass, glassCommands);
  for (const item of carriers) {
    if ((archive ?? []).filter((line) => line === item).length !== 1) {
      errors.push(`missing-or-duplicate:${item}`);
    }
  }
  const sliceOffset = value.indexOf('      - name: one-attempt real-browser slice smoke');
  const glassOffset = value.indexOf('      - name: one-attempt 12-viewport Glass matrix');
  if (sliceOffset < 0 || glassOffset <= sliceOffset) errors.push('ordered-chain');
  return errors;
};
const runSelftest = (name: string, marker: string): string => {
  const result = runBoundedNodeMarker(
    [tool(name), '--selftest'], marker, SELFTEST_CHILD_TIMEOUT_MS,
  );
  expect(result.kind, result.diagnostic).toBe('pass');
  return result.stdout;
};
const glassCurrentPointer = fileURLToPath(
  new URL('../apps/game/smoke/glassmatrix-report.json', import.meta.url),
);

describe('Slice → Glass → Arc 4 recovery evidence chain', () => {
  it('keeps Claude on the immutable predecessor chain instead of the rejected bare Glass call', () => {
    const callerErrors = (value: string): string[] => {
      const errors: string[] = [];
      if (!value.includes('Browser evidence is one immutable **Slice → Glass → recovery** chain')) {
        errors.push('missing-chain');
      }
      if (!value.includes('pass its exact run ID to full Glass')) errors.push('missing-slice-id');
      if (!value.includes('Stop after any nonzero, red, or instrument result')) {
        errors.push('missing-stop-law');
      }
      for (const match of value.matchAll(
        /(?:node tools\/glassmatrix\.mjs|npm run glassmatrix)([^\r\n]*)/g,
      )) {
        if (!/--(?:slice-run|verify-run|selftest)(?:=|\b)/.test(match[1] ?? '')) {
          errors.push('bare-glass');
        }
      }
      return errors;
    };
    expect(callerErrors(claudeInstructions)).toEqual([]);
    expect(callerErrors(
      `${claudeInstructions}\nRun node tools/glassmatrix.mjs before review.\n`,
    )).toContain('bare-glass');
    expect(callerErrors(claudeInstructions.replace(
      'Browser evidence is one immutable **Slice → Glass → recovery** chain',
      'Browser proof instructions removed.',
    ))).toContain('missing-chain');
  });

  it('keeps immutable Slice evidence, interruption red, and its named verifier mutation-sensitive', () => {
    const output = runSelftest(
      'smokereport.mjs',
      'immutable evidence: selected per-run report/log accepted',
    );
    const collector = source('smokereport.mjs');
    expect(output).toContain('immutable evidence: selected per-run report/log accepted');
    expect(output).toContain('stale current PASS, interruption, dirty source, wrong run/source, missing artifact, and log mismatch rejected');
    expect(output).toContain('physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
    expect(collector.match(/spawnSync\(/g)).toHaveLength(1);
    expect(collector).toContain('--verify-run=<immutable-run-id>');
    expect(collector.indexOf('atomicWriteJson(currentReportPath, sentinel)'))
      .toBeLessThan(collector.indexOf('const run = spawnSync('));
    expect(collector).toContain('automaticRetries: 0');
  }, 20_000);

 it('requires an exact clean Slice predecessor for full Glass and binds the newest release semantics in both directions', () => {
   const output = runSelftest('glassmatrix.mjs', 'exact clean Slice predecessor accepted');
   const collector = source('glassmatrix.mjs');
    const slice = source('slicesmoke.mjs');
    expect(output).toContain('exact clean Slice predecessor accepted');
    expect(output).toContain('stale/interrupted/dirty/wrong/targeted/missing/mismatched bindings rejected');
    expect(output).toContain('physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
    expect(collector).toContain('full certifying Glass requires --slice-run=<immutable-Slice-run-id>');
    expect(collector).toContain('full certifying Glass requires clean committed source');
    expect(collector).toContain('Equipped capture-chance gear is included in the shown odds at +1.5 percentage points per point before the 95% overall chance ceiling, with its contribution capped at +25 percentage points; first contact remains unavailable');
    expect(collector).toContain('The shown odds ignore equipped capture-chance gear.');
    expect(collector).toContain('A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson');
   expect(collector).toContain('Escape from a wrong-world detour abandons Sol and the lesson.');
    for (const contract of [slice, collector]) {
      expect(contract).toContain('Both complete save outcomes—including exact Charter progress—are proved before the one draw');
      expect(contract).toContain('A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save');
      expect(contract).toContain('A failed pairing also banks the Charter hybrid bloodline goal.');
      expect(contract).toContain('an explorer-requested call from one exact owned-fauna detail');
      expect(contract).toContain('Browsing, filtering, focusing, and returning through the Compendium never auto-play it');
      expect(contract).toContain('The biosphere signal grants a discovery reward and changes the save.');
    }
    expect(slice).toContain('const V2_DRAFT_BULLET_COUNT = 73;');
    expect(collector).toContain('expectedBulletCount=73');
    expect(collector).toContain('exact five-section, 73-outcome development inventory');
 }, 20_000);

  it('rejects invalid full Glass invocations without changing the current evidence pointer', () => {
    const before = existsSync(glassCurrentPointer)
      ? readFileSync(glassCurrentPointer)
      : null;
    const cases = [
      { args: [], message: 'full certifying Glass requires --slice-run=<immutable-Slice-run-id>' },
      { args: ['--slice-run=not/a/run/id'], message: 'invalid Slice run ID' },
    ];
    for (const control of cases) {
      const outcome = spawnSync(process.execPath, [tool('glassmatrix.mjs'), ...control.args], {
        encoding: 'utf8',
      });
      const after = existsSync(glassCurrentPointer)
        ? readFileSync(glassCurrentPointer)
        : null;
      expect(outcome.status, control.message ?? control.args[0]).toBe(2);
      if (control.message) expect(outcome.stderr).toContain(control.message);
      expect(after, control.message ?? control.args[0]).toEqual(before);
    }
    const collector = source('glassmatrix.mjs');
    const runStart = collector.indexOf("const releaseLock = acquireWorkspaceLock('v2 responsive glass matrix')");
    const predecessorPreflight = collector.indexOf(
      'const sliceVerification = verifySliceRunEvidence(selectedSliceRunId, {',
      runStart,
    );
    const immutableReservation = collector.indexOf('atomicCreateFile(artifacts.report', runStart);
    const reservationOwned = collector.indexOf('runArtifactReserved = true;', runStart);
    const pointerPublication = collector.indexOf(
      'atomicWriteJson(currentReportPath, sentinel)',
      runStart,
    );
    expect(predecessorPreflight).toBeGreaterThan(runStart);
    expect(predecessorPreflight).toBeLessThan(immutableReservation);
    expect(immutableReservation).toBeLessThan(reservationOwned);
    expect(reservationOwned).toBeLessThan(pointerPublication);
  }, 15_000);

  it('requires the exact immutable Slice+Glass pair for recovery and preserves one-attempt verification', () => {
    const output = runSelftest('arc4recovery.mjs', 'ARC 4 RECOVERY SELFTEST: PASS');
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
  }, 20_000);

  it('threads the exact Slice ID through hosted Glass and retains immutable carriers', () => {
    expect(workflowEvidenceChainErrors(workflow)).toEqual([]);
    expect(workflowEvidenceChainErrors(
      previewWorkflow,
      'upload structured browser evidence',
    )).toEqual([]);

    const bareGlass = workflow.replace(
      'node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
      'npm run glassmatrix',
    );
    expect(workflowEvidenceChainErrors(bareGlass)).toContain(
      'missing-or-duplicate:node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
    );
    const previewBareGlass = previewWorkflow.replace(
      'node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
      'npm run glassmatrix',
    );
    expect(workflowEvidenceChainErrors(
      previewBareGlass,
      'upload structured browser evidence',
    )).toContain(
      'missing-or-duplicate:node tools/glassmatrix.mjs --slice-run="$slice_run_id"',
    );
    const previewMissingSliceId = previewWorkflow.replace('        id: slice\n', '');
    expect(workflowEvidenceChainErrors(
      previewMissingSliceId,
      'upload structured browser evidence',
    )).toContain('missing-or-duplicate:id: slice');
    const previewWrongGlassId = previewWorkflow.replace('        id: glass\n', '        id: stale-glass\n');
    expect(workflowEvidenceChainErrors(
      previewWrongGlassId,
      'upload structured browser evidence',
    )).toContain('missing-or-duplicate:id: glass');
    const pointerOnly = workflow
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json\n', '')
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log\n', '')
      .replace('            port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json\n', '');
    expect(workflowEvidenceChainErrors(pointerOnly)).toContain(
      'missing-or-duplicate:port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
    );

    const commentedVerifier = workflow.replace(
      '          node tools/smokereport.mjs --verify-run="$slice_run_id"',
      '          # node tools/smokereport.mjs --verify-run="$slice_run_id"',
    );
    expect(workflowEvidenceChainErrors(commentedVerifier)).toContain(
      'missing-or-duplicate:node tools/smokereport.mjs --verify-run="$slice_run_id"',
    );

    const wrongStepVerifier = workflow
      .replace('          node tools/smokereport.mjs --verify-run="$slice_run_id"\n', '')
      .replace(
        '          slice_run_id="${{ steps.slice.outputs.run_id }}"',
        '          slice_run_id="${{ steps.slice.outputs.run_id }}"\n'
          + '          node tools/smokereport.mjs --verify-run="$slice_run_id"',
      );
    expect(workflowEvidenceChainErrors(wrongStepVerifier)).toContain(
      'missing-or-duplicate:node tools/smokereport.mjs --verify-run="$slice_run_id"',
    );

    const reorderedGlassVerifier = workflow.replace(
      '          node tools/glassmatrix.mjs --slice-run="$slice_run_id"\n'
        + '          glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"\n'
        + '          test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"\n'
        + '          printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"\n'
        + '          node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"',
      '          node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"\n'
        + '          node tools/glassmatrix.mjs --slice-run="$slice_run_id"\n'
        + '          glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"\n'
        + '          test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"\n'
        + '          printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"',
    );
    expect(workflowEvidenceChainErrors(reorderedGlassVerifier)).toContain(
      'misordered:node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"',
    );
  });

  it('binds the Slice writer, stdout, and reporter to one exact ten-image inventory', () => {
    const expected = [
      'codex', 'earth', 'galaxy', 'guide', 'phone',
      'settings', 'sol', 'solmark', 'training', 'universe',
    ];
    expect([...SLICE_SCREENSHOT_LOGICAL_NAMES]).toEqual(expected);
    expect(sliceScreenshotInventoryLine()).toBe(
      'screenshots: apps/game/smoke/ '
        + expected.map((logicalName) => `slice-${logicalName}`).join(' · '),
    );
    const harness = source('slicesmoke.mjs');
    const reporter = source('smokereport.mjs');
    const written = [...harness.matchAll(/screenshotPath\('([^']+)'\)/g)]
      .map((match) => match[1]);
    expect(written).toHaveLength(expected.length);
    expect([...written].sort()).toEqual(expected);
    expect(harness).toContain('console.log(sliceScreenshotInventoryLine())');
    expect(reporter).toContain('SLICE_SCREENSHOT_LOGICAL_NAMES,');
    expect(reporter).not.toContain('const SLICE_SCREENSHOT_LOGICAL_NAMES =');
  });
});
