import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const ownerSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'ecology-epoch-edge.ts'),
  'utf8',
);

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceOnce(source: string, needle: string, replacement: string): string {
  if (source.split(needle).length !== 2) throw new Error(`mutation target is not unique: ${needle}`);
  return source.replace(needle, replacement);
}

function wiringErrors(source: string): string[] {
  const errors: string[] = [];
  const state = section(source, '/* COSMIC_EPOCH is a separately capped', '\nconst TOUCH_DPR');
  const mayAnswer = section(source, 'function f4RuntimeMayAnswer(', '\nconst stopF4Heartbeat');
  const show = section(source, 'const showF4 =', "\naddEventListener('pagehide'");
  const persist = section(source, 'async function persistView(', '\nlet _persistT');
  const request = section(source, 'function requestEcologyEpochCheckpoint()', '\nconst productActionCoordinator');
  const receipt = section(source, 'type RenderedSceneReceipt =', '\nconst cam =');
  const scene = section(source, 'function buildCurrentSceneTransaction(', '\n/* ---- navigation');
  const projection = section(source, 'function refreshCommittedEcologyProjection()', '\nfunction captureOutcomeCopy(');
  const publication = section(source, 'function publishCommittedEcologyEpoch(', '\nfunction captureOutcomeCopy(');
  const capture = section(source, 'async function commitArc4CaptureAction(', '\nfunction captureActivePlayCountdown(');
  const load = section(source, 'async function loadSave(', '\n/* ---- boot ---- */');
  const ticker = section(source, 'app.ticker.add((tk) => {', '\n  emitBootPhase(\'wiring-complete\')');

  for (const [name, body] of Object.entries({
    state, mayAnswer, show, persist, request, receipt, scene, projection, publication, capture, load, ticker,
  })) if (body.length === 0) errors.push(`missing-${name}`);
  if (errors.length) return errors;

  if (!source.includes("from './ecology-epoch-edge.js';")
    || /\bepochClock\b|epochElapsedT0|epochElapsedSeconds/.test(source)) {
    errors.push('single-epoch-owner');
  }
  if (!state.includes('runtime.diagnostics().activePlayMs')
    || /performance\.now|Date\.now|motionOK|motionMode/.test(state)) {
    errors.push('active-play-only-input');
  }
  if (!state.includes('const currentEcologyEpoch = (): number => ecologyEpochAuthority.published();')
    || !state.includes('ecologyEpochAuthority.blocksEcology(ecologyActivePlayNow())')
    || /let ecologyProjection(?:Dirty|Suppressed)/.test(source)) {
    errors.push('published-gameplay-gate');
  }

  const stage = persist.indexOf('ecologyEpochAuthority.stage(ecologyActivePlayNow(), intent)');
  const detached = persist.indexOf('const candidate: SaveStateV2 = {');
  const cas = persist.indexOf('const outcome = await runtime.commit(');
  const durable = persist.indexOf('durable = true;', cas);
  const acknowledge = persist.indexOf('ecologyEpochAuthority.commit(epochStage, outcome.revision)', durable);
  const liveEpoch = persist.indexOf('save.EPOCH_BASE = outcome.saved.canonicalState.EPOCH_BASE;', acknowledge);
  const publish = persist.indexOf('publishCommittedEcologyEpoch(settled.publication)', liveEpoch);
  const firstPublish = persist.indexOf('publishCommittedEcologyEpoch(');
  if (!(stage >= 0 && detached > stage && cas > detached && durable > cas
    && acknowledge > durable && liveEpoch > acknowledge && publish > liveEpoch
    && firstPublish === publish)) {
    errors.push('durable-before-publication');
  }
  if ((persist.match(/runtime\.commit\(/g) ?? []).length !== 1
    || /commitOutcome|commitOutcomes|commitAction|commitProduct|sessionRng|receiptKind|sessionOrdinal|sessionDraws/i.test(persist)) {
    errors.push('receipt-free-single-cas');
  }
  if (!persist.includes('...save,')
    || !persist.includes('EPOCH_BASE: epochStage.epoch,')
    || persist.indexOf('save.EPOCH_BASE =') < cas) {
    errors.push('detached-candidate');
  }
  if (!persist.includes('ecologyEpochAuthority.reject(epochStage);')
    || !persist.includes('if (durable) {')
    || !persist.includes('suppressEcologyProjection();')
    || !persist.includes('return true;')) {
    errors.push('durability-classification');
  }

  if (!request.includes("persistView(null, 'ecology-edge')")
    || !request.includes('autoCheckpointDue(ecologyActivePlayNow())')
    || !request.includes('activePersist || productActionInFlight')) {
    errors.push('edge-single-flight');
  }
  if (!ticker.includes('requestEcologyEpochCheckpoint();')
    || ticker.includes('COSMIC_EPOCH =')
    || ticker.includes('if (animate) requestEcologyEpochCheckpoint();')) {
    errors.push('motion-independent-ticker');
  }

  const refreshInShow = show.indexOf('refreshCommittedEcologyProjection();');
  const answerInShow = show.indexOf('runtime.setAnswerable(');
  if (!mayAnswer.includes('ecologyEpochAuthority.projectionMayAnswer()')
    || !(refreshInShow >= 0 && answerInShow > refreshInShow)
    || !persist.includes('try { refreshCommittedEcologyProjection(); }')
    || !persist.includes("ecologyEpochAuthority.projection().state === 'dirty'")
    || !persist.includes('runtimeDiagnostics.answerable')
    || !persist.includes('runtimeDiagnostics?.visible === true')
    || publication.includes('refreshCommittedEcologyProjection();')) {
    errors.push('hidden-resume-before-answerable');
  }

  if (!receipt.includes('ecologyEpoch: number;')
    || !receipt.includes('ecologyEpoch: currentEcologyEpoch(),')) {
    errors.push('scene-epoch-receipt');
  }
  if ((projection.match(/buildCurrentSceneTransaction\(surfaceRoster\)/g) ?? []).length !== 1
    || !projection.includes('currentCapturePresentationFence = null;')
    || !projection.includes('presentPlanetSurvey(')
    || !projection.includes('card.dataset.ecologyEpoch')
    || !projection.includes('planetsideMatchesFullRoster(surfaceRoster)')
    || !projection.includes('renderedSceneReceipt.ecologyEpoch !== currentEcologyEpoch()')
    || !projection.includes('ecologyEpochAuthority.beginProjectionRefresh()')
    || !projection.includes('ecologyEpochAuthority.completeProjectionRefresh(refreshToken)')
    || !projection.includes('suppressEcologyProjection(refreshToken)')
    || /persistView\(|runtime\.commit\(/.test(projection)) {
    errors.push('exact-projection-invalidation');
  }
  if (!scene.includes('drawSurface(exact, nav, preparedSurfaceRoster)')) {
    errors.push('prepared-roster-scene');
  }
  if ((capture.match(/ecologyEpochBlocksActions\(\)/g) ?? []).length < 2
    || !capture.includes('canonicalWorldRoster(address.address, currentEcologyEpoch())')) {
    errors.push('ecology-action-fence');
  }
  if (!load.includes('activePlayAtBootMs: ecologyObservedActivePlayMs,')
    || !load.includes('COSMIC_EPOCH = currentEcologyEpoch();')) {
    errors.push('boot-authority');
  }
  if ((source.match(/canonicalWorldRoster\([^\n]*currentEcologyEpoch\(\)\)/g) ?? []).length < 4
    || /canonicalWorldRoster\([^\n]*(?:performance\.now|epochClock)/.test(source)) {
    errors.push('published-roster-consumers');
  }
  return [...new Set(errors)];
}

describe('F4 ecology epoch app wiring', () => {
  it('joins active-play candidate, one receipt-free CAS and committed-only projection', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
    expect(ownerSource).not.toMatch(/performance\.now|Date\.now|motionOK|Math\.random|SessionRNG/);
  });

  it('negative control: page residence cannot replace activePlay authority', () => {
    const mutated = replaceOnce(
      mainSource,
      'ecologyObservedActivePlayMs,\n      runtime.diagnostics().activePlayMs,',
      'ecologyObservedActivePlayMs,\n      performance.now(),',
    );
    expect(wiringErrors(mutated)).toContain('active-play-only-input');
  });

  it('negative control: optimistic publication before CAS is rejected', () => {
    const mutated = replaceOnce(
      mainSource,
      'const outcome = await runtime.commit(',
      'publishCommittedEcologyEpoch({} as never);\n      const outcome = await runtime.commit(',
    );
    expect(wiringErrors(mutated)).toContain('durable-before-publication');
  });

  it('negative control: a duplicate CAS or receipt/RNG writer is rejected', () => {
    const duplicate = replaceOnce(
      mainSource,
      'const outcome = await runtime.commit(',
      'await runtime.commit(candidate, Date.now());\n      const outcome = await runtime.commit(',
    );
    expect(wiringErrors(duplicate)).toContain('receipt-free-single-cas');
    const receiptWriter = replaceOnce(
      mainSource,
      'const outcome = await runtime.commit(',
      'const outcome = await runtime.commitOutcome(',
    );
    expect(wiringErrors(receiptWriter)).toContain('receipt-free-single-cas');
  });

  it('negative control: every current scene/Survey/Planetside/capture invalidation is required', () => {
    for (const needle of [
      'buildCurrentSceneTransaction(surfaceRoster);',
      'currentCapturePresentationFence = null;',
      'presentPlanetSurvey(',
      'card.dataset.ecologyEpoch',
      'planetsideMatchesFullRoster(surfaceRoster)',
    ]) {
      const body = section(
        mainSource,
        'function refreshCommittedEcologyProjection()',
        '\nfunction captureOutcomeCopy(',
      );
      const mutatedBody = body.replace(needle, '/* negative control removed required projection */');
      expect(mutatedBody).not.toBe(body);
      const mutated = mainSource.replace(body, mutatedBody);
      expect(wiringErrors(mutated), needle).toContain('exact-projection-invalidation');
    }
  });

  it('negative control: motion coupling and answerable-before-refresh are rejected', () => {
    const motion = replaceOnce(
      mainSource,
      'requestEcologyEpochCheckpoint();',
      'if (animate) requestEcologyEpochCheckpoint();',
    );
    expect(wiringErrors(motion)).toContain('motion-independent-ticker');
    const show = section(mainSource, 'const showF4 =', "\naddEventListener('pagehide'");
    const mutatedShow = replaceOnce(
      show,
      'try { refreshCommittedEcologyProjection(); }',
      'runtime.setAnswerable(true);\n      try { refreshCommittedEcologyProjection(); }',
    );
    const earlyAnswer = mainSource.replace(show, mutatedShow);
    expect(wiringErrors(earlyAnswer)).toContain('hidden-resume-before-answerable');
    const hiddenRepaint = replaceOnce(
      mainSource,
      '&& runtimeDiagnostics.answerable\n',
      '',
    );
    expect(wiringErrors(hiddenRepaint)).toContain('hidden-resume-before-answerable');
  });

  it('negative control: visible publication must refresh and execute both lifecycle transitions', () => {
    const persist = section(mainSource, 'async function persistView(', '\nlet _persistT');
    const withoutVisibleRefresh = replaceOnce(
      persist,
      'try { refreshCommittedEcologyProjection(); }',
      'try { /* negative control omitted visible refresh */ }',
    );
    expect(wiringErrors(mainSource.replace(persist, withoutVisibleRefresh)))
      .toContain('hidden-resume-before-answerable');

    const projection = section(
      mainSource,
      'function refreshCommittedEcologyProjection()',
      '\nfunction captureOutcomeCopy(',
    );
    for (const [transition, label] of [
      ['ecologyEpochAuthority.beginProjectionRefresh()', 'refresh-begin'],
      ['ecologyEpochAuthority.completeProjectionRefresh(refreshToken)', 'refresh-complete'],
    ] as const) {
      const withoutTransition = replaceOnce(
        projection,
        transition,
        `/* negative control omitted ${label} */`,
      );
      expect(wiringErrors(mainSource.replace(projection, withoutTransition)), transition)
        .toContain('exact-projection-invalidation');
    }
  });
});
