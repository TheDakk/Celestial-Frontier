import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assessDtrainReleaseConvergence,
  type DtrainReleaseConvergenceEvidence,
} from '../tools/slicesmoke-contract.mjs';

const RELEASE_FIXTURE_VERSION = '2.0.0-test';
const LEGACY_RELEASE_VERSION = '1.8.9';

function convergedEvidence(): DtrainReleaseConvergenceEvidence {
  const raw = { rn: RELEASE_FIXTURE_VERSION };
  const rawText = JSON.stringify(raw);
  return {
    rawBeforeText: rawText,
    rawAfterText: rawText,
    raw,
    state: {
      rnSeen: RELEASE_FIXTURE_VERSION,
      releasePending: null,
      panelOpen: 'guide',
      tutActive: false,
      tutDone: true,
      trainingRestoreWitness: { stage: 'released' },
    },
    focus: {
      heading: 'v2.0.0-test · Browser fixture bulletin',
      backFocus: true,
      insideTraining: false,
      trainingPresent: false,
      inertChrome: 0,
      atlasClosed: true,
    },
  };
}

function withMutation(
  mutate: (evidence: any) => void,
): DtrainReleaseConvergenceEvidence {
  const evidence = structuredClone(convergedEvidence());
  mutate(evidence);
  return evidence;
}

function withRawMutation(
  mutate: (raw: Record<string, unknown>) => void,
): DtrainReleaseConvergenceEvidence {
  return withMutation((evidence) => {
    mutate(evidence.raw);
    evidence.rawBeforeText = JSON.stringify(evidence.raw);
    evidence.rawAfterText = evidence.rawBeforeText;
  });
}

const sliceSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

function uniqueSection(start: string, end: string): string {
  const startAt = sliceSource.indexOf(start);
  expect(startAt, `missing source start ${JSON.stringify(start)}`).toBeGreaterThanOrEqual(0);
  expect(sliceSource.indexOf(start, startAt + 1), `duplicate source start ${JSON.stringify(start)}`).toBe(-1);
  const endAt = sliceSource.indexOf(end, startAt + start.length);
  expect(endAt, `missing source end ${JSON.stringify(end)}`).toBeGreaterThan(startAt);
  return sliceSource.slice(startAt, endAt);
}

describe('Slice D-TRAIN queued-release convergence', () => {
  it('rejects the legitimate queued pre-state before Training and the bulletin settle', () => {
    const queued = withRawMutation((raw) => { raw.rn = LEGACY_RELEASE_VERSION; }) as any;
    queued.state.rnSeen = LEGACY_RELEASE_VERSION;
    queued.state.releasePending = RELEASE_FIXTURE_VERSION;
    queued.state.panelOpen = null;
    queued.state.tutActive = true;
    queued.state.tutDone = false;
    queued.state.trainingRestoreWitness.stage = 'live-swap-complete';
    queued.focus.backFocus = false;
    queued.focus.insideTraining = true;
    queued.focus.trainingPresent = true;
    queued.focus.inertChrome = 1;
    queued.focus.atlasClosed = false;
    const assessment = assessDtrainReleaseConvergence(queued, RELEASE_FIXTURE_VERSION);
    expect(assessment.ok).toBe(false);
    expect(Object.entries(assessment.checks).filter(([, value]) => value === false)
      .map(([name]) => name)).toEqual([
      'trainingReleased', 'liveSeen', 'pendingCleared', 'guideExclusive',
      'durableSeen', 'fixtureBackFocused', 'trainingFocusReleased',
      'trainingRemoved', 'chromeReleased', 'atlasClosed',
    ]);
  });

  it('accepts only the fully converged live, focus, Training, and durable outcome', () => {
    const assessment = assessDtrainReleaseConvergence(
      convergedEvidence(), RELEASE_FIXTURE_VERSION,
    );
    expect(assessment.ok).toBe(true);
    expect(Object.keys(assessment.checks)).toEqual([
      'durableStable', 'trainingReleased', 'liveSeen', 'pendingCleared',
      'guideExclusive', 'durableSeen', 'fixtureHeading', 'fixtureBackFocused',
      'trainingFocusReleased', 'trainingRemoved', 'chromeReleased', 'atlasClosed',
    ]);
    expect(Object.values(assessment.checks).every((value) => value === true)).toBe(true);
  });

  it.each([
    ['unstable durable bracket', 'durableStable', () => withMutation((value) => { value.rawBeforeText += ' '; })],
    ['active Training', 'trainingReleased', () => withMutation((value) => { value.state.tutActive = true; })],
    ['unfinished Training', 'trainingReleased', () => withMutation((value) => { value.state.tutDone = false; })],
    ['wrong release stage', 'trainingReleased', () => withMutation((value) => { value.state.trainingRestoreWitness.stage = 'live-swap-complete'; })],
    ['stale live rn', 'liveSeen', () => withMutation((value) => { value.state.rnSeen = LEGACY_RELEASE_VERSION; })],
    ['pending bulletin', 'pendingCleared', () => withMutation((value) => { value.state.releasePending = RELEASE_FIXTURE_VERSION; })],
    ['wrong panel', 'guideExclusive', () => withMutation((value) => { value.state.panelOpen = null; })],
    ['stale durable rn', 'durableSeen', () => withRawMutation((raw) => { raw.rn = LEGACY_RELEASE_VERSION; })],
    ['stale heading version', 'fixtureHeading', () => withMutation((value) => {
      value.focus.heading = 'v1.8.9 · Browser fixture bulletin';
    })],
    ['wrong focus', 'fixtureBackFocused', () => withMutation((value) => { value.focus.backFocus = false; })],
    ['Training owns focus', 'trainingFocusReleased', () => withMutation((value) => { value.focus.insideTraining = true; })],
    ['remaining Training UI', 'trainingRemoved', () => withMutation((value) => { value.focus.trainingPresent = true; })],
    ['inert chrome', 'chromeReleased', () => withMutation((value) => { value.focus.inertChrome = 1; })],
    ['open Atlas', 'atlasClosed', () => withMutation((value) => { value.focus.atlasClosed = false; })],
  ] as const)('rejects %s independently', (_label, failedCheck, build) => {
    const assessment = assessDtrainReleaseConvergence(build(), RELEASE_FIXTURE_VERSION);
    expect(assessment.ok).toBe(false);
    expect(assessment.checks[failedCheck]).toBe(false);
    expect(
      Object.entries(assessment.checks).filter(([, value]) => value === false).map(([key]) => key),
    ).toEqual([failedCheck]);
  });

  it('waits for the post-release bulletin outcome before assessing restored raw bytes', () => {
    const finish = uniqueSection(
      '  /* Hold an older persist across the native Finish activation, then attempt',
      '  /* the promise: training persists as DONE across reload */',
    );
    const trainingPollAt = finish.indexOf('let done3 = null;');
    const releasedAt = finish.indexOf("trainingRestoreWitness?.stage === 'released'");
    const rawReadAt = finish.indexOf('const dtrainFinishRaw =');
    expect(trainingPollAt).toBeGreaterThanOrEqual(0);
    expect(releasedAt).toBeGreaterThan(trainingPollAt);
    expect(releasedAt).toBeGreaterThanOrEqual(0);
    expect(rawReadAt).toBeGreaterThan(releasedAt);

    const convergence = finish.slice(trainingPollAt, rawReadAt);
    expect(convergence).not.toContain('await sleep(80);');
    expect(convergence).toContain('dtrainReleaseConvergenceExpression');
    expect(convergence).toContain('rawBeforeText=await (${READ_PRIMARY_EXPRESSION})');
    expect(convergence).toContain('state=S.api.state()');
    expect(convergence).toContain('rawAfterText=await (${READ_PRIMARY_EXPRESSION})');
    expect(convergence).toContain('raw=JSON.parse(rawAfterText)');
    expect(convergence).toContain('active=document.activeElement');
    expect(convergence).toContain('backFocus:active===back');
    expect(convergence).toContain("document.getElementById('tutcard')");
    expect(convergence).toContain('const dtrainReleaseDeadline = performance.now() + 8_000;');
    expect(convergence).toContain('while (performance.now() < dtrainReleaseDeadline');
    expect(convergence).toContain('dtrainReleaseDeadline - performance.now()');
    expect(convergence).toContain('await evalTWithin(');
    expect(convergence).toContain('assessDtrainReleaseConvergence(');
    expect(convergence).toContain('RELEASE_FIXTURE_VERSION');
    expect(convergence).toContain('failSliceWithoutCascade(');

    /* One bounded poll owns Training release and a second owns the distinct
       bulletin convergence. A fixed delay must never substitute for either. */
    expect(convergence.split('for (let i = 0; i < 80').length - 1).toBe(1);
    expect(convergence.split('while (performance.now() < dtrainReleaseDeadline').length - 1).toBe(1);
    expect(convergence.split('await sleep(50)').length - 1).toBeGreaterThanOrEqual(2);

    const assessmentAt = finish.indexOf('const dtrainFinishRawAssessment =');
    expect(assessmentAt).toBeGreaterThan(rawReadAt);
    expect(finish.slice(rawReadAt, assessmentAt + 800)).toContain(
      'expectedRn: RELEASE_FIXTURE_VERSION',
    );
    const controls = finish.slice(
      finish.indexOf('  const releaseControls = {'),
      finish.indexOf('  /* The native primary-put binding is asynchronous'),
    );
    for (const marker of [
      'queuedPreState:',
      'staleLiveSeen:',
      'staleDurableSeen:',
      'unstableDurableRead:',
      'pendingNotCleared:',
      'wrongPanel:',
      'wrongHeading:',
      'wrongFocus:',
      'trainingFocusRetained:',
      'trainingRetained:',
      'inertChromeRetained:',
      'atlasOpen:',
      'trainingStillActive:',
      'trainingNotDone:',
      'trainingStageWrong:',
      'Object.values(releaseControlResults).some((control) => control.ok)',
    ]) expect(controls).toContain(marker);
  });
});
