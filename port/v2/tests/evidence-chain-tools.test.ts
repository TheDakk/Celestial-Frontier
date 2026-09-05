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
const portReadme = readFileSync(
  fileURLToPath(new URL('../README.md', import.meta.url)),
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
// Slice, Glass and the three owned Compendium steps run only on the full chain
// (develop -> main, or an agent PR under `actions-full-chain-approved`). The
// bounded agent lane stops after the browser-free develop profile and the two
// phone Glass canaries. Every long stage carries exactly this guard and nothing
// else; the lane itself is selected once, before any dependency install.
const LANE_STEP_NAME = 'select battery lane';
const LANE_FULL_GUARD = "if: steps.lane.outputs.lane == 'full'";
const LANE_GATED_STEPS = [
  'install exact Arc 1A Edge calibration browser',
  'Compendium live preflight',
  'one-attempt Compendium memory certification',
  'one-attempt real-browser slice smoke',
  'one-attempt 12-viewport Glass matrix',
] as const;
const LANE_SELECTOR_CONTRACT = [
  'id: lane',
  'shell: bash',
  'BASE_BRANCH: ${{ github.event.pull_request.base.ref }}',
  'APPROVAL_LABEL: ${{ github.event.label.name }}',
  'set -euo pipefail',
  'case "$BASE_BRANCH/$APPROVAL_LABEL" in',
  'main/actions-budget-approved|main/actions-full-chain-approved) lane=full ;;',
  'develop/actions-full-chain-approved) lane=full ;;',
  'develop/actions-budget-approved) lane=agent ;;',
  '*) echo "::error::Unsupported battery lane: $APPROVAL_LABEL -> $BASE_BRANCH"; exit 1 ;;',
  'esac',
  'printf \'lane=%s\\n\' "$lane" >> "$GITHUB_OUTPUT"',
] as const;
const workflowLaneErrors = (value: string): string[] => {
  const errors: string[] = [];
  const lane = workflowStepLines(value, LANE_STEP_NAME);
  if (!lane) errors.push('missing-or-duplicate-lane-step');
  let prior = -1;
  for (const item of LANE_SELECTOR_CONTRACT) {
    const matches = lane?.flatMap((line, index) => line === item ? [index] : []) ?? [];
    if (matches.length !== 1) errors.push(`missing-or-duplicate:${item}`);
    else if (matches[0]! <= prior) errors.push(`misordered:${item}`);
    else prior = matches[0]!;
  }
  const laneOffset = value.indexOf(`      - name: ${LANE_STEP_NAME}`);
  const installOffset = value.indexOf('      - name: install v2 workspace');
  if (laneOffset < 0 || installOffset <= laneOffset) errors.push('lane-selected-after-install');
  for (const name of LANE_GATED_STEPS) {
    const lines = workflowStepLines(value, name);
    const conditions = (lines ?? []).filter((line) => line.startsWith('if:'));
    if (!lines || conditions.length !== 1 || conditions[0] !== LANE_FULL_GUARD) {
      errors.push(`unguarded-full-chain-stage:${name}`);
    }
  }
  if (value.split(LANE_FULL_GUARD).length - 1 !== LANE_GATED_STEPS.length) {
    errors.push('full-lane-guard-count');
  }
  if (value.split("steps.lane.outputs.lane == 'agent'").length - 1 !== 1) {
    errors.push('agent-lane-canary-binding');
  }
  return errors;
};
const workflowEvidenceChainErrors = (value: string): string[] => {
  const errors: string[] = [];
  const globallyRequired = [
    'CF_V2_SLICE_SMOKE_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-slice',
    'CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-preflight',
    'CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-large-phone-preflight',
    'CF_V2_GLASSMATRIX_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass',
    'CF_V2_ARC4_RECOVERY_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-recovery',
  ];
  const sliceCommands = [
    'id: slice',
    LANE_FULL_GUARD,
    'shell: bash',
    'BASE_BRANCH: ${{ github.event.pull_request.base.ref }}',
    'set -euo pipefail',
    'case "$BASE_BRANCH" in',
    'develop) slice_profile=develop ;;',
    'main) slice_profile=production ;;',
    '*) echo "::error::Unsupported battery base: $BASE_BRANCH"; exit 1 ;;',
    'esac',
    'npm run smoke:ci -- --profile="$slice_profile"',
    'slice_run_id="$(jq -er \'.run.id\' apps/game/smoke/slice-smoke-report.json)"',
    'test "$slice_run_id" = "$CF_V2_SLICE_SMOKE_RUN_ID"',
    'printf \'run_id=%s\\n\' "$slice_run_id" >> "$GITHUB_OUTPUT"',
    'printf \'profile=%s\\n\' "$slice_profile" >> "$GITHUB_OUTPUT"',
    'node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
  ];
  const glassCommands = [
    'id: glass',
    LANE_FULL_GUARD,
    'shell: bash',
    'set -euo pipefail',
    'slice_run_id="${{ steps.slice.outputs.run_id }}"',
    'slice_profile="${{ steps.slice.outputs.profile }}"',
    'case "$slice_profile" in',
    'develop|production) ;;',
    '*) echo "::error::Unsupported Slice assurance profile: $slice_profile"; exit 1 ;;',
    'esac',
    'node tools/glassmatrix.mjs --slice-run="$slice_run_id" --profile="$slice_profile"',
    'glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"',
    'test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"',
    'printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"',
    'node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"',
  ];
  const recoveryCommands = [
    'id: recovery',
    "if: github.event.pull_request.base.ref == 'main'",
    'slice_run_id="${{ steps.slice.outputs.run_id }}"',
    'glass_run_id="${{ steps.glass.outputs.run_id }}"',
    'node tools/arc4recovery.mjs --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
    'test "$recovery_run_id" = "$CF_V2_ARC4_RECOVERY_RUN_ID"',
    'node tools/arc4recovery.mjs --verify-run="$recovery_run_id" --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
  ];
  const glassDiagnosticCommands = [
    'if: >-',
    'always() &&',
    "steps.glass.outcome != 'skipped'",
    'working-directory: port/v2',
    'shell: bash',
    'set -euo pipefail',
    'node tools/glassmatrix-diagnostic.mjs \\',
    '--glass-run="$CF_V2_GLASSMATRIX_RUN_ID" \\',
    '--slice-run="${{ steps.slice.outputs.run_id }}" \\',
    '--profile="${{ steps.slice.outputs.profile }}"',
  ];
  const carriers = [
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json',
    'port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log',
    'port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID }}.json',
    'port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID }}.json',
    'port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
    'port/v2/apps/game/smoke/arc4-recovery-${{ env.CF_V2_ARC4_RECOVERY_RUN_ID }}.json',
  ];
  const globalActive = activeLines(value);
  for (const item of globallyRequired) {
    if (globalActive.filter((line) => line === item).length !== 1) {
      errors.push(`missing-or-duplicate:${item}`);
    }
  }
  const slice = workflowStepLines(value, 'one-attempt real-browser slice smoke');
  const glass = workflowStepLines(value, 'one-attempt 12-viewport Glass matrix');
  const glassDiagnostic = workflowStepLines(value, 'retain exact Glass terminal diagnostic');
  const recovery = workflowStepLines(
    value, 'one-attempt Slice-and-Glass-bound Recovery certification',
  );
  const archive = workflowStepLines(value, 'archive battery reports');
  for (const [name, lines] of [['slice', slice], ['glass', glass]] as const) {
    const conditions = (lines ?? []).filter((line) => line.startsWith('if:'));
    if (conditions.length !== 1 || conditions[0] !== LANE_FULL_GUARD) {
      errors.push(`conditional-common-stage:${name}`);
    }
    if ((lines ?? []).some((line) => line.startsWith('continue-on-error:'))) {
      errors.push(`soft-fail-common-stage:${name}`);
    }
  }
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
  requireOrdered(glassDiagnostic, glassDiagnosticCommands);
  requireOrdered(recovery, recoveryCommands);
  if ((glassDiagnostic ?? []).some((line) => line.startsWith('continue-on-error:'))) {
    errors.push('soft-fail-glass-diagnostic');
  }
  for (const item of carriers) {
    if ((archive ?? []).filter((line) => line === item).length !== 1) {
      errors.push(`missing-or-duplicate:${item}`);
    }
  }
  const sliceOffset = value.indexOf('      - name: one-attempt real-browser slice smoke');
  const glassOffset = value.indexOf('      - name: one-attempt 12-viewport Glass matrix');
  const glassDiagnosticOffset = value.indexOf('      - name: retain exact Glass terminal diagnostic');
  const recoveryOffset = value.indexOf(
    '      - name: one-attempt Slice-and-Glass-bound Recovery certification',
  );
  const archiveOffset = value.indexOf('      - name: archive battery reports');
  if (sliceOffset < 0 || glassOffset <= sliceOffset || glassDiagnosticOffset <= glassOffset
    || recoveryOffset <= glassDiagnosticOffset
    || archiveOffset <= recoveryOffset) errors.push('ordered-chain');
  return errors;
};
const previewWorkflowErrors = (value: string): string[] => {
  const errors: string[] = [];
  if (value.split('npm run preview:selftest').length - 1 !== 1) {
    errors.push('missing-or-duplicate:global-preview-selftest');
  }
  const required = [
    ['install v2 workspace', ['working-directory: port/v2', 'run: npm ci']],
    ['check development preview', [
      'working-directory: port/v2',
      'run: node tools/check-profile.mjs --profile=dev',
    ]],
    ['preview producer selftests', [
      'working-directory: port/v2',
      'CF_BROWSER: /usr/bin/google-chrome',
      'run: npm run preview:selftest',
    ]],
    ['build commit-bound preview artifact', [
      'working-directory: port/v2',
      'npm run preview:package -- --origin="$PREVIEW_ORIGIN" --output="$PREVIEW_OUTPUT" --approved-publication-candidate',
      'npm run preview:smoke -- --root="$PREVIEW_OUTPUT"',
    ]],
    ['upload playable development preview', ['name: manual-development-preview']],
  ] as const;
  let priorStep = -1;
  for (const [stepName, commands] of required) {
    const lines = workflowStepLines(value, stepName);
    const stepOffset = value.indexOf(`      - name: ${stepName}`);
    if (stepOffset <= priorStep) errors.push(`missing-or-misordered-step:${stepName}`);
    priorStep = stepOffset;
    for (const command of commands) {
      if ((lines ?? []).filter((line) => line === command).length !== 1) {
        errors.push(`missing-or-duplicate:${command}`);
      }
    }
  }
  for (const forbidden of [
    'compendiummem', 'smoke:ci', 'glassmatrix', 'arc4recovery', 'arc4-recovery',
    'persona:report', 'CF_V2_SLICE_SMOKE_RUN_ID', 'CF_V2_GLASSMATRIX_RUN_ID',
    'CF_V2_ARC4_RECOVERY_RUN_ID', 'battery-evidence',
  ]) {
    if (value.includes(forbidden)) errors.push(`forbidden:${forbidden}`);
  }
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
const sliceCurrentPointer = fileURLToPath(
  new URL('../apps/game/smoke/slice-smoke-report.json', import.meta.url),
);
const pointerBytes = (path: string): Buffer | null => (
  existsSync(path) ? readFileSync(path) : null
);

describe('Slice → Glass → Arc 4 recovery evidence chain', () => {
  it('keeps agent instructions and copy-ready develop commands on the tiered evidence chain', () => {
    const callerErrors = (value: string): string[] => {
      const errors: string[] = [];
      if (!value.includes('The `develop` admission browser boundary runs the sealed Compendium certificate, then one immutable **Slice → Glass** chain')) {
        errors.push('missing-develop-chain');
      }
      if (!value.includes('A production/release candidate runs **SceneMemory → Compendium → Slice → Glass → Recovery**')) {
        errors.push('missing-production-recovery');
      }
      if (!value.includes('passing both exact predecessor IDs')) errors.push('missing-predecessor-ids');
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
      'The `develop` admission browser boundary runs the sealed Compendium certificate, then one immutable **Slice → Glass** chain',
      'Browser proof instructions removed.',
    ))).toContain('missing-develop-chain');
    expect(callerErrors(claudeInstructions.replace(
      'A production/release candidate runs **SceneMemory → Compendium → Slice → Glass → Recovery**',
      'Production recovery instructions removed.',
    ))).toContain('missing-production-recovery');

    const strictHeading = portReadme.indexOf('### Strict current browser evidence chain');
    const shellStart = portReadme.indexOf('```sh', strictHeading);
    const shellEnd = portReadme.indexOf('\n```', shellStart);
    expect(strictHeading).toBeGreaterThanOrEqual(0);
    expect(shellStart).toBeGreaterThan(strictHeading);
    expect(shellEnd).toBeGreaterThan(shellStart);
    const copyReady = portReadme.slice(shellStart, shellEnd);
    const recoveryOnlyCommands = [
      'CF_BROWSER="$evidence_chromium_browser" node tools/arc4recovery.mjs --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
      'recovery_run_id="$(jq -er \'.runId\' apps/game/smoke/arc4-recovery-report.json)"',
      'node tools/arc4recovery.mjs --verify-run="$recovery_run_id" --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
    ];
    const copyReadyActive = activeLines(copyReady);
    for (const command of recoveryOnlyCommands) {
      expect(copyReadyActive).not.toContain(command);
      expect(copyReady).toContain(`# ${command}`);
      expect(activeLines(copyReady.replace(`# ${command}`, command))).toContain(command);
    }
  });

  it('keeps immutable Slice evidence, interruption red, and its named verifier mutation-sensitive', () => {
    const output = runSelftest(
      'smokereport.mjs',
      'immutable evidence: selected profile-bound v2 report/log accepted',
    );
    const collector = source('smokereport.mjs');
    expect(output).toContain('immutable evidence: selected profile-bound v2 report/log accepted');
    expect(output).toContain('explicit legacy-v1 replay remains read-only and cannot satisfy current assurance');
    expect(output).toContain('exact develop/production ledgers + profile markers accepted');
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
    expect(output).toContain('trail/portrait controls: measured-opposite mutation, eligible baseline, exact property restoration, no-op rejection, and first-red causal stop accepted');
    expect(collector).toContain('full certifying Glass requires --slice-run=<immutable-Slice-run-id>');
    expect(collector).toContain('full certifying Glass requires clean committed source');
    expect(collector).toContain('Equipped capture-chance gear adds 1.5 percentage points per point before the 95% overall ceiling, capped at +25 points; first contact remains unavailable');
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
    expect(slice).toContain('const V2_DRAFT_BULLET_COUNT = 78;');
    expect(collector).toContain('expectedBulletCount=78');
    expect(collector).toContain('exact five-section, 78-outcome development inventory');
 }, 20_000);

  it('rejects invalid full Glass invocations without changing the current evidence pointer', () => {
    const before = existsSync(glassCurrentPointer)
      ? readFileSync(glassCurrentPointer)
      : null;
    const cases = [
      {
        args: ['--verify-run=', '--slice-run=not/a/run/id', '--profile=develop'],
        message: 'usage: node tools/glassmatrix.mjs',
      },
    ];
    for (const control of cases) {
      const outcome = spawnSync(process.execPath, [tool('glassmatrix.mjs'), ...control.args], {
        encoding: 'utf8',
      });
      const after = existsSync(glassCurrentPointer)
        ? readFileSync(glassCurrentPointer)
        : null;
      expect(outcome.status, control.message ?? control.args[0]).not.toBe(0);
      if (control.message) expect(outcome.stderr).toContain(control.message);
      expect(after, control.message ?? control.args[0]).toEqual(before);
    }
    const collector = source('glassmatrix.mjs');
    expect(collector).toContain(
      "const singletonPrefixes = ['--viewport=', '--slice-run=', '--verify-run=', '--profile=',\n"
      + "  '--verify-targeted-run=', '--browser='];",
    );
    expect(collector).toContain('|| (profileArg && !selectedAssuranceProfile)');
    expect(collector).toContain('|| (sliceRunArg && !selectedSliceRunId)');
    expect(collector).toContain('|| (verifyRunArg && !selectedVerifyRunId)');
    expect(collector).toContain(
      'full certifying Glass requires --slice-run=<immutable-Slice-run-id>',
    );
    expect(collector).toContain("assertEvidenceRunId(selectedSliceRunId, 'Slice')");
    expect(collector).toContain(
      "full certifying Glass requires --profile=develop|production",
    );
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

  it('fails closed on one representative malformed profile call per evidence producer', () => {
    const before = {
      slice: pointerBytes(sliceCurrentPointer),
      glass: pointerBytes(glassCurrentPointer),
    };
    const controls = [
      {
        tool: 'slicesmoke.mjs',
        args: ['--profile=develop', '--profile=production'],
        message: 'full Slice smoke requires exactly one --profile=develop|production',
      },
      {
        tool: 'smokereport.mjs',
        args: ['--profile=preview'],
        message: 'usage: node tools/smokereport.mjs',
      },
      {
        tool: 'glassmatrix.mjs',
        args: ['--slice-run=profile-control-slice'],
        message: 'full certifying Glass requires --profile=develop|production',
      },
    ];
    for (const control of controls) {
      const outcome = spawnSync(process.execPath, [tool(control.tool), ...control.args], {
        encoding: 'utf8',
      });
      expect(outcome.status, control.tool).not.toBe(0);
      expect(outcome.stderr, control.tool).toContain(control.message);
      expect(pointerBytes(sliceCurrentPointer), control.tool).toEqual(before.slice);
      expect(pointerBytes(glassCurrentPointer), control.tool).toEqual(before.glass);
    }
    const slice = source('slicesmoke.mjs');
    const smoke = source('smokereport.mjs');
    const glass = source('glassmatrix.mjs');
    expect(slice).toContain('sliceProfileArgs.length !== 1 || sliceUnknownArgs.length !== 0');
    expect(slice).toContain('!SLICE_ASSURANCE_PROFILES.includes(SLICE_ASSURANCE_PROFILE)');
    expect(smoke).toContain('profileArgs.length !== 1 || !profileMatch');
    expect(smoke).toContain('verifyArgs.length > 1 || args.length !== 1 + verifyArgs.length');
    expect(glass).toContain('unknownArgs.length || duplicateSingleton');
    expect(glass).toContain('|| (verifyRunArg && (!sliceRunArg || !profileArg || cliArgs.length !== 3))');
  }, 20_000);

  it('requires the exact immutable Slice+Glass pair for recovery and preserves one-attempt verification', () => {
    const collector = source('arc4recovery.mjs');
    const contract = source('arc4-recovery-contract.mjs');
    const glassContract = source('glassmatrix-evidence-contract.mjs');
    expect(collector).toContain('--slice-run=<Slice-run-id> --glass-run=<Glass-run-id>');
    expect(collector).toContain('--verify-run=<Recovery-run-id>');
    expect(collector).toContain('selected Glass predecessor failed verification');
    expect(contract).toContain('exact Slice/Glass predecessor chain');
    expect(contract).toContain('Glass-to-Slice nested predecessor binding');
    expect(collector).toContain('glassTerminalEvidenceErrors(report');
    expect(glassContract).toContain('Glass planned-vs-executed negative-control ledger');
    expect(glassContract).toContain('Glass Arc 4 capture outcome inventory is empty');
    expect(glassContract).toContain('current Glass PASS schema is required');
    expect(glassContract).toContain('Glass Shipyard keyboard heartbeat outcome is malformed');
    expect(glassContract).toContain('Glass viewport inventory is not the exact ordered 12-row matrix');
    expect(collector).toContain('attemptCount: 1');
    expect(collector).toContain('automaticRetries: 0');
  });

  it('keeps the certifying Slice → Glass → production Recovery chain out of preview packaging', () => {
    expect(workflowEvidenceChainErrors(workflow)).toEqual([]);
    expect(previewWorkflowErrors(previewWorkflow)).toEqual([]);

    const sliceProfileControls = [
      [
        'develop profile mapping',
        '            develop) slice_profile=develop ;;',
        '            develop) slice_profile=production ;;',
        'missing-or-duplicate:develop) slice_profile=develop ;;',
      ],
      [
        'production profile mapping',
        '            main) slice_profile=production ;;',
        '            main) slice_profile=develop ;;',
        'missing-or-duplicate:main) slice_profile=production ;;',
      ],
      [
        'unknown base refusal',
        '            *) echo "::error::Unsupported battery base: $BASE_BRANCH"; exit 1 ;;',
        '            *) slice_profile=develop ;;',
        'missing-or-duplicate:*) echo "::error::Unsupported battery base: $BASE_BRANCH"; exit 1 ;;',
      ],
      [
        'missing base refusal',
        '          BASE_BRANCH: ${{ github.event.pull_request.base.ref }}',
        '          BASE_BRANCH: ""',
        'missing-or-duplicate:BASE_BRANCH: ${{ github.event.pull_request.base.ref }}',
      ],
      [
        'profile-bound Slice producer',
        '          npm run smoke:ci -- --profile="$slice_profile"',
        '          npm run smoke:ci',
        'missing-or-duplicate:npm run smoke:ci -- --profile="$slice_profile"',
      ],
      [
        'profile-bound Slice verifier',
        '          node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
        '          node tools/smokereport.mjs --verify-run="$slice_run_id"',
        'missing-or-duplicate:node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
      ],
    ] as const;
    const sliceStepStart = workflow.indexOf(
      '      - name: one-attempt real-browser slice smoke',
    );
    const sliceStepEnd = workflow.indexOf(
      '      - name: one-attempt 12-viewport Glass matrix', sliceStepStart,
    );
    expect(sliceStepStart).toBeGreaterThanOrEqual(0);
    expect(sliceStepEnd).toBeGreaterThan(sliceStepStart);
    const sliceStep = workflow.slice(sliceStepStart, sliceStepEnd);
    for (const [name, current, mutant, diagnosis] of sliceProfileControls) {
      expect(sliceStep.split(current).length - 1, name).toBe(1);
      const mutatedStep = sliceStep.replace(current, mutant);
      const mutatedWorkflow = workflow.slice(0, sliceStepStart) + mutatedStep
        + workflow.slice(sliceStepEnd);
      expect(workflowEvidenceChainErrors(mutatedWorkflow), name)
        .toContain(diagnosis);
    }

    const bareGlass = workflow.replace(
      'node tools/glassmatrix.mjs --slice-run="$slice_run_id" --profile="$slice_profile"',
      'npm run glassmatrix',
    );
    expect(workflowEvidenceChainErrors(bareGlass)).toContain(
      'missing-or-duplicate:node tools/glassmatrix.mjs --slice-run="$slice_run_id" --profile="$slice_profile"',
    );
    const profilelessGlassVerifier = workflow.replace(
      'node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"',
      'node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id"',
    );
    expect(workflowEvidenceChainErrors(profilelessGlassVerifier)).toContain(
      'missing-or-duplicate:node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"',
    );
    const skippedGlassDiagnostic = workflow.replace(
      "          steps.glass.outcome != 'skipped'",
      "          steps.glass.outcome == 'success'",
    );
    expect(workflowEvidenceChainErrors(skippedGlassDiagnostic)).toContain(
      "missing-or-duplicate:steps.glass.outcome != 'skipped'",
    );
    const softenedGlassDiagnostic = workflow.replace(
      '      - name: retain exact Glass terminal diagnostic\n',
      '      - name: retain exact Glass terminal diagnostic\n        continue-on-error: true\n',
    );
    expect(workflowEvidenceChainErrors(softenedGlassDiagnostic)).toContain(
      'soft-fail-glass-diagnostic',
    );
    const currentPointerGlassDiagnostic = workflow.replace(
      '          node tools/glassmatrix-diagnostic.mjs \\\n',
      '          jq . apps/game/smoke/glassmatrix-report.json\n',
    );
    expect(workflowEvidenceChainErrors(currentPointerGlassDiagnostic)).toContain(
      'missing-or-duplicate:node tools/glassmatrix-diagnostic.mjs \\',
    );
    const missingSliceProfileOutput = workflow.replace(
      'printf \'profile=%s\\n\' "$slice_profile" >> "$GITHUB_OUTPUT"',
      'echo Slice profile output omitted',
    );
    expect(workflowEvidenceChainErrors(missingSliceProfileOutput)).toContain(
      'missing-or-duplicate:printf \'profile=%s\\n\' "$slice_profile" >> "$GITHUB_OUTPUT"',
    );
    const previewProfileDecoy = previewWorkflow.replace(
      '        run: node tools/check-profile.mjs --profile=dev',
      '        run: echo preview profile moved',
    ) + '\n# run: node tools/check-profile.mjs --profile=dev\n';
    expect(previewWorkflowErrors(previewProfileDecoy)).toContain(
      'missing-or-duplicate:run: node tools/check-profile.mjs --profile=dev',
    );
    expect(previewWorkflowErrors(`${previewWorkflow}\n# arc4recovery certification\n`)).toContain(
      'forbidden:arc4recovery',
    );
    const wrongRecoveryVerifier = workflow.replace(
      'node tools/arc4recovery.mjs --verify-run="$recovery_run_id" --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
      'echo recovery not verified',
    );
    expect(workflowEvidenceChainErrors(wrongRecoveryVerifier)).toContain(
      'missing-or-duplicate:node tools/arc4recovery.mjs --verify-run="$recovery_run_id" --slice-run="$slice_run_id" --glass-run="$glass_run_id"',
    );
    const nonProductionRecovery = workflow.replace(
      '      - name: one-attempt Slice-and-Glass-bound Recovery certification\n'
        + '        id: recovery\n'
        + "        if: github.event.pull_request.base.ref == 'main'",
      '      - name: one-attempt Slice-and-Glass-bound Recovery certification\n'
        + '        id: recovery\n'
        + "        if: github.event.pull_request.base.ref == 'develop'",
    );
    expect(workflowEvidenceChainErrors(nonProductionRecovery)).toContain(
      "missing-or-duplicate:if: github.event.pull_request.base.ref == 'main'",
    );
    for (const stage of [
      'one-attempt real-browser slice smoke',
      'one-attempt 12-viewport Glass matrix',
    ]) {
      const conditional = workflow.replace(
        `      - name: ${stage}\n`,
        `      - name: ${stage}\n        if: github.event.pull_request.base.ref == 'main'\n`,
      );
      expect(workflowEvidenceChainErrors(conditional), stage).toContain(
        `conditional-common-stage:${stage.includes('slice') ? 'slice' : 'glass'}`,
      );
    }
    expect(previewWorkflowErrors(
      `${previewWorkflow}\n      - name: duplicate preview selftest\n        run: npm run preview:selftest\n`,
    )).toContain('missing-or-duplicate:global-preview-selftest');
    const pointerOnly = workflow
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.json\n', '')
      .replace('            port/v2/apps/game/smoke/slice-smoke-${{ env.CF_V2_SLICE_SMOKE_RUN_ID }}.log\n', '')
      .replace('            port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json\n', '')
      .replace('            port/v2/apps/game/smoke/arc4-recovery-${{ env.CF_V2_ARC4_RECOVERY_RUN_ID }}.json\n', '');
    expect(workflowEvidenceChainErrors(pointerOnly)).toContain(
      'missing-or-duplicate:port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_RUN_ID }}.json',
    );
    expect(workflowEvidenceChainErrors(pointerOnly)).toContain(
      'missing-or-duplicate:port/v2/apps/game/smoke/arc4-recovery-${{ env.CF_V2_ARC4_RECOVERY_RUN_ID }}.json',
    );
    const missingLargePhoneCanary = workflow
      .replace('      CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-large-phone-preflight\n', '')
      .replace('            port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID }}.json\n', '');
    expect(workflowEvidenceChainErrors(missingLargePhoneCanary)).toContain(
      'missing-or-duplicate:CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-large-phone-preflight',
    );
    expect(workflowEvidenceChainErrors(missingLargePhoneCanary)).toContain(
      'missing-or-duplicate:port/v2/apps/game/smoke/glassmatrix-${{ env.CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID }}.json',
    );

    const commentedVerifier = workflow.replace(
      '          node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
      '          # node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
    );
    expect(workflowEvidenceChainErrors(commentedVerifier)).toContain(
      'missing-or-duplicate:node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
    );

    const wrongStepVerifier = workflow
      .replace('          node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"\n', '')
      .replace(
        '          slice_run_id="${{ steps.slice.outputs.run_id }}"',
        '          slice_run_id="${{ steps.slice.outputs.run_id }}"\n'
          + '          node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
      );
    expect(workflowEvidenceChainErrors(wrongStepVerifier)).toContain(
      'missing-or-duplicate:node tools/smokereport.mjs --verify-run="$slice_run_id" --profile="$slice_profile"',
    );

    const reorderedGlassVerifier = workflow.replace(
      '          node tools/glassmatrix.mjs --slice-run="$slice_run_id" --profile="$slice_profile"\n'
        + '          glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"\n'
        + '          test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"\n'
        + '          printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"\n'
        + '          node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"',
      '          node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"\n'
        + '          node tools/glassmatrix.mjs --slice-run="$slice_run_id" --profile="$slice_profile"\n'
        + '          glass_run_id="$(jq -er \'.run.id\' apps/game/smoke/glassmatrix-report.json)"\n'
        + '          test "$glass_run_id" = "$CF_V2_GLASSMATRIX_RUN_ID"\n'
        + '          printf \'run_id=%s\\n\' "$glass_run_id" >> "$GITHUB_OUTPUT"',
    );
    expect(workflowEvidenceChainErrors(reorderedGlassVerifier)).toContain(
      'misordered:node tools/glassmatrix.mjs --verify-run="$glass_run_id" --slice-run="$slice_run_id" --profile="$slice_profile"',
    );
  });

  it('keeps the agent lane bounded and gates every long stage on the exact lane selector', () => {
    expect(workflowLaneErrors(workflow)).toEqual([]);
    const laneHeader = `      - name: ${LANE_STEP_NAME}`;
    const laneStart = workflow.indexOf(laneHeader);
    const laneEnd = workflow.indexOf('      # This policy uses only Node built-ins', laneStart);
    expect(laneStart).toBeGreaterThanOrEqual(0);
    expect(laneEnd).toBeGreaterThan(laneStart);
    const laneStep = workflow.slice(laneStart, laneEnd);
    expect(workflowLaneErrors(workflow.replace(laneStep, '')))
      .toContain('missing-or-duplicate-lane-step');
    expect(workflowLaneErrors(workflow.replace(laneHeader, `${laneHeader} renamed`)))
      .toContain('missing-or-duplicate-lane-step');
    for (const [current, mutant] of [
      [
        'develop/actions-budget-approved) lane=agent ;;',
        'develop/actions-budget-approved) lane=full ;;',
      ],
      [
        'develop/actions-full-chain-approved) lane=full ;;',
        'develop/actions-full-chain-approved) lane=agent ;;',
      ],
      [
        '*) echo "::error::Unsupported battery lane: $APPROVAL_LABEL -> $BASE_BRANCH"; exit 1 ;;',
        '*) lane=agent ;;',
      ],
    ] as const) {
      expect(workflow.split(current).length - 1, current).toBe(1);
      expect(workflowLaneErrors(workflow.replace(current, mutant)), current)
        .toContain(`missing-or-duplicate:${current}`);
    }
    const withGuard = (source: string, stepName: string, replacement: string): string => {
      const start = source.indexOf(`      - name: ${stepName}`);
      expect(start, stepName).toBeGreaterThanOrEqual(0);
      const guardAt = source.indexOf(`        ${LANE_FULL_GUARD}\n`, start);
      expect(guardAt, stepName).toBeGreaterThan(start);
      return source.slice(0, guardAt) + replacement
        + source.slice(guardAt + `        ${LANE_FULL_GUARD}\n`.length);
    };
    for (const name of LANE_GATED_STEPS) {
      expect(workflowLaneErrors(withGuard(workflow, name, '')), name)
        .toContain(`unguarded-full-chain-stage:${name}`);
      expect(workflowLaneErrors(withGuard(
        workflow, name, "        if: steps.lane.outputs.lane != 'agent'\n",
      )), name).toContain(`unguarded-full-chain-stage:${name}`);
      expect(workflowLaneErrors(withGuard(workflow, name, '        if: always()\n')), name)
        .toContain(`unguarded-full-chain-stage:${name}`);
    }
    for (const stage of [
      ['one-attempt real-browser slice smoke', 'slice'],
      ['one-attempt 12-viewport Glass matrix', 'glass'],
    ] as const) {
      expect(workflowEvidenceChainErrors(withGuard(workflow, stage[0], '')), stage[0])
        .toContain(`conditional-common-stage:${stage[1]}`);
      expect(workflowEvidenceChainErrors(withGuard(
        workflow, stage[0], "        if: github.event.pull_request.base.ref == 'main'\n",
      )), stage[0]).toContain(`conditional-common-stage:${stage[1]}`);
    }
    expect(workflowLaneErrors(workflow.replace(
      "(steps.lane.outputs.lane == 'agent' ||",
      "(steps.lane.outputs.lane == 'full' ||",
    ))).toContain('agent-lane-canary-binding');
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
