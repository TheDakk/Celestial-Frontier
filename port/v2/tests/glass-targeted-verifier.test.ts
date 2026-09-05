import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { glassTargetedEvidenceErrors } from '../tools/glassmatrix.mjs';
// @ts-expect-error The canonical pure evidence contract has no declaration shim.
import { glassTerminalEvidenceErrors } from '../tools/glassmatrix-evidence-contract.mjs';

const v2Root = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(v2Root, '..', '..');
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const carriers = [
  {
    label: 'small-phone', file: 'SMALL_PHONE',
    sha256: '459cffe647ab40ca23788c47a18d33d960b7d61f0119a52a35c99f4e5f181dcf',
  },
  {
    label: 'large-phone', file: 'LARGE_PHONE',
    sha256: '75dcd00fb6127e8fbfe0b56b695a1e95079a6576e0f39d7d0e15bcceedef7818',
  },
] as const;

function retained(label: typeof carriers[number]['label']) {
  const carrier = carriers.find((row) => row.label === label)!;
  const raw = gunzipSync(fs.readFileSync(path.join(repoRoot, 'audits',
    `PR35_CC4D7C9_20260904_GLASS_${carrier.file}.json.gz`)));
  expect(sha256(raw)).toBe(carrier.sha256);
  return JSON.parse(raw.toString('utf8'));
}

function options(original: ReturnType<typeof retained>) {
  return {
    runId: original.run.id,
    viewport: original.viewportInventory[0].label,
    expectedSource: original.source,
    expectedBrowser: original.browser.executable,
  };
}

describe('read-only targeted Glass verification', () => {
  it.each(carriers)('replays the real $label carrier without promoting its source or scope', ({ label }) => {
    const report = retained(label);
    expect(report.source.commit).toBe('cc4d7c920083c3c630a9c8c8e6fc5a6e40f5e0d4');
    expect(glassTargetedEvidenceErrors(report, options(report))).toEqual([]);
    expect(glassTerminalEvidenceErrors(report, {
      runId: report.run.id, reportPath: report.run.artifactPath,
      expectedSource: report.source, requirePass: true,
    }).join('; ')).toContain('targeted/non-full Glass report refused');
  });

  it.each(carriers)('rejects malformed and laundered $label provenance, inventories, and control ledgers', ({ label }) => {
    const original = retained(label);
    const required = label === 'small-phone' ? 'inventory-modal-focus' : 'arc4-capture-native-survey-return';
    const mutations = [
      (r: typeof original) => { r.schema = 'cf-v2-glassmatrix/v1'; },
      (r: typeof original) => { r.status = 'fail'; },
      (r: typeof original) => { r.terminal = false; },
      (r: typeof original) => { r.scope = 'full-certifying'; r.certifying = true; },
      (r: typeof original) => { r.predecessors = { slice: {} }; },
      (r: typeof original) => { r.run.id += '-wrong'; },
      (r: typeof original) => { r.run.artifactPath = 'apps/game/smoke/glassmatrix-report.json'; },
      (r: typeof original) => { r.source.state = r.sourceEnd.state = 'dirty-diagnostic'; },
      (r: typeof original) => { r.source.commit = r.sourceEnd.commit = 'f'.repeat(40); },
      (r: typeof original) => { r.source.workingTreeSha256 = r.sourceEnd.workingTreeSha256 = 'f'.repeat(64); },
      (r: typeof original) => { r.sourceEnd.branch = 'detached'; },
      (r: typeof original) => { r.sourceChange.detected = true; },
      (r: typeof original) => { r.sourceChange.ending = {}; },
      (r: typeof original) => { r.durationMs++; },
      (r: typeof original) => { r.viewportInventory[0].width++; },
      (r: typeof original) => { r.viewportTimings = []; },
      (r: typeof original) => { r.summary.viewportCount = 12; },
      (r: typeof original) => { r.browser.executable = '/wrong/chrome'; },
      (r: typeof original) => { r.browser.product = 'Edg/152.0.7977.82'; },
      (r: typeof original) => { r.browser.product = 'Chrome/0152.0.7977.82'; },
      (r: typeof original) => { r.browser.protocol_version = '1.2'; },
      (r: typeof original) => { r.browser.revision = ''; },
      (r: typeof original) => { r.browser.user_agent = ''; },
      (r: typeof original) => { r.browser.js_version = ''; },
      (r: typeof original) => { r.browser.consistentAcrossViewports = false; },
      (r: typeof original) => { r.findings = null; },
      (r: typeof original) => { r.findings = [{ code: 'real-product-red' }]; },
      (r: typeof original) => { r.instrumentFailures = {}; },
      (r: typeof original) => { r.controlSummary.selftestRan = false; },
      (r: typeof original) => { r.controlSummary.automaticRetries = 1; },
      (r: typeof original) => { r.controlSummary.blockedNegativeControls = ['real-block']; },
      (r: typeof original) => { r.controlSummary.negativeControls.push(required); },
      (r: typeof original) => { r.controlSummary.negativeControls = r.controlSummary.negativeControls.filter((name: string) => name !== required); },
      (r: typeof original) => { r.controlSummary.omittedNegativeControls.push(required); },
      (r: typeof original) => { r.controlSummary.plannedNegativeControls.pop(); },
      (r: typeof original) => { r.arc4CaptureOutcomeInventory.outcomes = []; },
      (r: typeof original) => { r.arc4CaptureOutcomeInventory.outcomes[0].checks = { forged: true }; },
      (r: typeof original) => { r.shipyardKeyboardHeartbeatInventory = null; },
      (r: typeof original) => { r.exit.code = 1; },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const report = structuredClone(original);
      mutate(report);
      expect(glassTargetedEvidenceErrors(report, options(original)), `mutation ${index}`).not.toEqual([]);
    }
    expect(glassTargetedEvidenceErrors(null, options(original))).not.toEqual([]);
  });

  it('rederives the real heartbeat assessments while forged all-true maps remain untouched', () => {
    const original = retained('large-phone');
    for (const key of ['priorFocused', 'originalPriorDisconnected', 'replacementAcquired']) {
      const report = structuredClone(original);
      report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after[key] = false;
      expect(glassTargetedEvidenceErrors(report, options(original)).join('; ')).toContain('native Tab raw evidence');
    }
    for (const mutate of [
      (r: typeof original) => { r.setup.effectiveOpacity = 0; },
      (r: typeof original) => { r.setup.visibility = 'collapse'; },
      (r: typeof original) => { r.setup.accessibleName = '   '; },
      (r: typeof original) => { r.receipt.trusted = false; },
      (r: typeof original) => { r.receipt.currentRect[2] = r.receipt.currentRect[0]; },
      (r: typeof original) => { r.heartbeat.cycleReceipt.refresh.shipyard = 'skipped'; },
    ]) {
      const report = structuredClone(original);
      mutate(report.shipyardKeyboardHeartbeatInventory.outcomes[0]);
      expect(glassTargetedEvidenceErrors(report, options(original)).join('; ')).toContain('Shipyard');
    }
    const report = structuredClone(original);
    report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.productChecks = { forged: true };
    expect(glassTargetedEvidenceErrors(report, options(original)).join('; ')).toContain('native Tab raw evidence');
  });

  it('retains every former workflow heartbeat corruption check with the shared Node verdict', () => {
    const original = retained('large-phone');
    const heartbeatMutations: ((report: Record<string, any>) => void)[] = [
      (report) => { report.arc4CaptureOutcomeInventory.expectedCount = 2; },
      (report) => {
        report.arc4CaptureOutcomeInventory.outcomes = Object.fromEntries(
          report.arc4CaptureOutcomeInventory.outcomes.map((row: any, index: number) => [index, row]),
        );
      },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].checks.idleKeyboardFocus = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusSetup.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.schema = 'cf-v2-glass-arc4-native-tab-heartbeat/v1'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.stateFound = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.seamsAvailable = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.error = 'collector failed'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.initial.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.initial.heartbeatRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.wasRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.cycleSettled = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.resume.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.resume.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt = null; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.cycle = 'skipped'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.reason = 'held'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.refresh.capture = 'skipped'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.heartbeatRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.originalTargetDisconnected = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.priorFocused = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cleanup.attempted = true; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.ok = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.instrumentOk = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.productOk = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.instrumentChecks.heartbeatRequirement = false; },
      (report) => { delete report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.productChecks.keyboardFocus; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.expectedCount = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.complete = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.omitted = ['large-phone']; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes = {}; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].sectionId = 'research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].beforeOpen = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].afterOpen = true; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.ok = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.selector = '#wrong'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.display = ''; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.effectiveOpacity = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.rect = [20, 40, 40, 44]; },
      (report) => {
        const row = report.shipyardKeyboardHeartbeatInventory.outcomes[0];
        for (const descriptor of [
          row.setup, row.heartbeat.initial.current, row.heartbeat.after.current, row.receipt.current,
          row.receipt.eventTarget, row.receipt.active,
        ]) descriptor.accessibleName = ' ';
      },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat = null; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.initial.currentCount = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.initial.current.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.quiescence.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.quiescence.wasRunning = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.resume.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cycleReceipt.cycle = 'skipped'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cycleReceipt.refresh.shipyard = 'panel-closed'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.after.currentFocused = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.after.replacementAcquired = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cleanup.error = 'cleanup failed'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.trusted = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.eventTargetIsCurrent = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentDisplay = ''; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentVisibility = 'collapse'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentEffectiveOpacity = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.active.surveyClose = true; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.active.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.instrumentOk = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.productOk = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.instrumentChecks.heartbeatRequirement = false; },
      (report) => { delete report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.productChecks.semanticIdentity; },
    ];
    for (const [index, mutate] of heartbeatMutations.entries()) {
      const report = structuredClone(original);
      mutate(report);
      expect(glassTargetedEvidenceErrors(report, options(original)), `former jq heartbeat mutation ${index}`).not.toEqual([]);
    }
  });

  it('keeps the new CLI separate from full verification and refuses incomplete authority before any run', () => {
    for (const args of [
      ['--verify-run=fixture', '--viewport=small-phone'],
      ['--verify-targeted-run=fixture', '--viewport=small-phone'],
      ['--verify-targeted-run=fixture', '--viewport=small-phone', '--browser=/chrome', '--profile=develop'],
    ]) {
      const result = spawnSync(process.execPath, ['tools/glassmatrix.mjs', ...args], {
        cwd: v2Root, encoding: 'utf8', timeout: 10_000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('usage: node tools/glassmatrix.mjs');
    }
  }, 15_000);
});
