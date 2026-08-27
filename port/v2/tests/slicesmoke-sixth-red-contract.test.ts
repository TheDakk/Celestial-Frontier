import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc4EpochSnapshot } from '../tools/arc4-browser-contract.mjs';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const glassSource = readFileSync(
  new URL('../tools/glassmatrix.mjs', import.meta.url),
  'utf8',
);
const arc4ContractSource = readFileSync(
  new URL('../tools/arc4-browser-contract.mjs', import.meta.url),
  'utf8',
);
const mainSource = readFileSync(
  new URL('../apps/game/src/main.ts', import.meta.url),
  'utf8',
);
const f4RuntimeSource = readFileSync(
  new URL('../apps/game/src/f4-runtime-authority.ts', import.meta.url),
  'utf8',
);

type Marker = readonly [label: string, value: string];

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(stop, `missing section end: ${end}`).toBeGreaterThan(at);
  return source.slice(at, stop);
}

function markerErrors(owner: string, markers: readonly Marker[]): string[] {
  return markers.flatMap(([label, value]) => owner.includes(value) ? [] : [label]);
}

function proveEachMarkerRequired(owner: string, markers: readonly Marker[]): void {
  expect(markerErrors(owner, markers)).toEqual([]);
  markers.forEach(([label, value], index) => {
    const replacement = `__SIXTH_RED_MARKER_${index}__`;
    expect(owner.split(value).length - 1, label).toBe(1);
    const mutant = owner.replace(value, replacement);
    expect(markerErrors(mutant, markers), label).toContain(label);
  });
}

describe('sixth Slice red contract repairs', () => {
  it('keeps a fixed 55-row Guide oracle with five independent population controls', () => {
    expect(sliceSource).toContain('const V2_DRAFT_BULLET_COUNT = 55;');
    const owner = section(
      sliceSource,
      '  const releaseDraftCheck = `',
      '  const releaseShipyardCopyCtl = await evalIn(',
    );
    proveEachMarkerRequired(owner, [
      ['fixed positive count', 'populated:bullets.length===${V2_DRAFT_BULLET_COUNT}'],
      ['raw nonempty and trim clauses',
        'bulletRaw.every((bullet)=>bullet.length>0&&bullet===bullet.trim())'],
      ['count deletion control', 'const releaseInventoryCtl = await evalIn('],
      ['uniqueness control', 'const releaseDuplicateCtl = await evalIn('],
      ['section population control', 'const releaseEmptySectionCtl = await evalIn('],
      ['raw empty control', 'const releaseEmptyBulletCtl = await evalIn('],
      ['raw trim control', 'const releaseWhitespaceBulletCtl = await evalIn('],
      ['removal delta',
        'releaseInventoryCtl.removed?.bulletCount !== V2_DRAFT_BULLET_COUNT - 1'],
    ]);
    expect(glassSource).toContain('expectedBulletCount=55');
    expect(glassSource).toContain('inventory?.bulletCount===54');
    expect(glassSource).not.toContain('54-outcome development inventory');
  });

  it('separates both advancing active-play mirrors from stable fixture state', () => {
    const projection = section(
      sliceSource,
      '  const arc4PertarStableStateProjection = (state) => {',
      '  const waitForArc4PertarSurface = async',
    );
    proveEachMarkerRequired(projection, [
      ['runtime projection', 'delete stable.persistence.runtime.activePlayMs;'],
      ['ecology projection',
        'delete stable.persistence.ecology.observedActivePlayMs;'],
      ['ecology before validation',
        'const beforeEcologyActivePlayMs = before?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology after validation',
        'const afterEcologyActivePlayMs = after?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology monotonicity',
        'afterEcologyActivePlayMs >= beforeEcologyActivePlayMs'],
      ['ecology bound',
        'afterEcologyActivePlayMs - beforeEcologyActivePlayMs <= 10_000'],
    ]);
    const controls = section(
      sliceSource,
      '  const arc4FixtureWrongOrdinalClockControl =',
      '  /* A one-sided durable route mutation',
    );
    proveEachMarkerRequired(controls, [
      ['runtime clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.runtime.activePlayMs'],
      ['ecology clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.ecology.observedActivePlayMs'],
    ]);
  });

  it('proves private epoch staging before one committed publication and reload', () => {
    const owner = section(
      sliceSource,
      '  /* DOM-1: exercise the real epoch snapshot path',
      "  await send('Target.closeTarget', { targetId: tk.targetId });",
    );
    proveEachMarkerRequired(owner, [
      ['single awaited persist',
        'persisted=await window.__CF_SLICE__.api.__smokePersistNow()'],
      ['named assessment', 'assessArc4EpochSnapshot(epochSnapshot)'],
      ['control owner',
        'const epochSnapshotControls = epochSnapshotAssessment.ok ? ['],
      ['before control', "'negative-before', ['beforeEpoch']"],
      ['optimistic precommit control', "'optimistic-precommit', ['precommitPrivate']"],
      ['optimistic publication control',
        "'optimistic-publication', ['precommitPublicationPrivate']"],
      ['candidate control', "'missing-candidate', ['precommitCandidateStaged']"],
      ['precommit edge control', "'early-edge-clear', ['precommitEdgeDue']"],
      ['committed epoch control', "'withheld-commit', ['committedEpoch']"],
      ['committed publication control',
        "'withheld-publication', ['committedPublished']"],
      ['committed candidate control',
        "'stale-committed-candidate', ['committedCandidate']"],
      ['committed edge control',
        "'uncleared-committed-edge', ['committedEdgeSettled']"],
      ['stored control', "'stored-base', ['storedCommitted']"],
      ['reload control', "'reloaded-base', ['reloadedCommitted']"],
    ]);

    const base = {
      before: 0,
      precommit: { epoch: 0, publishedEpoch: 0, candidateEpoch: 1, edgeDue: true },
      committed: { epoch: 1, publishedEpoch: 1, candidateEpoch: 1, edgeDue: false },
      stored: 1,
      reloaded: 1,
    };
    expect(assessArc4EpochSnapshot(base).ok).toBe(true);
    const controls = [
      ['beforeEpoch', (next: typeof base) => {
        next.before = -1;
        next.precommit.epoch = -1;
        next.precommit.publishedEpoch = -1;
        next.precommit.candidateEpoch = 0;
        next.committed.epoch = 0;
        next.committed.publishedEpoch = 0;
        next.committed.candidateEpoch = 0;
        next.stored = 0;
        next.reloaded = 0;
      }],
      ['precommitPrivate', (next: typeof base) => { next.precommit.epoch = 1; }],
      ['precommitPublicationPrivate',
        (next: typeof base) => { next.precommit.publishedEpoch = 1; }],
      ['precommitCandidateStaged',
        (next: typeof base) => { next.precommit.candidateEpoch = 0; }],
      ['precommitEdgeDue', (next: typeof base) => { next.precommit.edgeDue = false; }],
      ['committedPublished', (next: typeof base) => { next.committed.publishedEpoch = 0; }],
      ['committedCandidate', (next: typeof base) => { next.committed.candidateEpoch = 0; }],
      ['committedEdgeSettled', (next: typeof base) => { next.committed.edgeDue = true; }],
      ['storedCommitted', (next: typeof base) => { next.stored = 0; }],
      ['reloadedCommitted', (next: typeof base) => { next.reloaded = 0; }],
    ] as const;
    for (const [expected, mutate] of controls) {
      const next = structuredClone(base);
      mutate(next);
      const failures = Object.entries(assessArc4EpochSnapshot(next).checks)
        .filter(([, value]) => value !== true).map(([name]) => name);
      expect(failures, expected).toEqual([expected]);
    }
    const withheld = structuredClone(base);
    withheld.committed.epoch = 0;
    withheld.stored = 0;
    withheld.reloaded = 0;
    expect(Object.entries(assessArc4EpochSnapshot(withheld).checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['committedEpoch']);
  });

  it('binds the Guide oracle to the truthful parked-development publishing contract', () => {
    const sliceOracle = section(
      sliceSource,
      '  const releaseDraftCheck = `',
      '  await evalIn(`document.querySelector',
    );
    proveEachMarkerRequired(sliceOracle, [
      ['publishing heading lookup',
        'publishing=bulletNodes.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/'],
      ['publishing semantic heading',
        "publishingContract=publishingHeading==='Under the Hood'"],
      ['publishing parked body',
        "&&publishingText.includes('DEVELOPMENT PUBLISHING STAYS PARKED')"],
      ['publishing non-publication body',
        "&&publishingText.includes('it does not publish')"],
      ['publishing manual workflow body',
        "&&publishingText.includes('The separate branch-site workflow remains manually parked')"],
      ['publishing production body',
        "&&publishingText.includes('production remains the v1.8.9 main-branch site')"],
      ['publishing contradiction predicate',
        'publishingClaim=/(?:(?:(?:v2(?:[.]0)?'],
      ['publishing contradiction scans every row',
        'publishingContradiction=bulletRaw.some((copy)=>unnegated(copy,publishingClaim))'],
      ['publishing contradiction contract member',
        '&&!publishingContradiction;'],
      ['publishing completeness member',
        '&&shipyardContract&&captureContract&&hdSurfaceContract&&publishingContract'],
      ['publishing contradiction diagnostic',
        'publishingHeading,publishingContract,publishingContradiction,overclaim'],
      ['publishing honesty member',
        '&&!captureContradiction&&!publishingContradiction'],
    ]);
    expect(sliceOracle.split('(?:published|deployed|shipped)').length - 1).toBe(2);
    const sliceControls = section(
      sliceSource,
      '  const releasePublishingCtl = await evalIn(',
      '  const releaseOverclaimCtl = await evalIn(',
    );
    proveEachMarkerRequired(sliceControls, [
      ['publishing missing-clause mutation',
        'const releasePublishingCtl = await evalIn('],
      ['publishing missing-clause restore requirement',
        '!releasePublishingCtl.restored?.publishingContract'],
      ['publishing additive contradiction mutation',
        'const releasePublishingContradictionCtl = await evalIn('],
      ['publishing affirmative control copy',
        "The preview package now publishes and deploys the v2.0 development site."],
      ['publishing contradiction rejection',
        'releasePublishingContradictionCtl.contradictory?.publishingContradiction !== true'],
      ['publishing contradiction restoration',
        'releasePublishingContradictionCtl.restored?.publishingContradiction !== false'],
      ['publishing inverted-live mutation',
        'const releasePublishingLiveProductionCtl = await evalIn('],
      ['publishing inverted-live control copy',
        'The v2.0 preview is live in production.'],
      ['publishing inverted-live rejection',
        'releasePublishingLiveProductionCtl.contradictory?.publishingContradiction !== true'],
      ['publishing inverted-live restoration',
        'releasePublishingLiveProductionCtl.restored?.publishingContradiction !== false'],
      ['publishing passive mutation',
        'const releasePublishingPassiveCtl = await evalIn('],
      ['publishing passive control copy',
        'The preview package is published to the development site.'],
      ['publishing passive rejection',
        'releasePublishingPassiveCtl.contradictory?.publishingContradiction !== true'],
      ['publishing passive restoration',
        'releasePublishingPassiveCtl.restored?.publishingContradiction !== false'],
      ['publishing variant controls',
        'const releasePublishingVariantsCtl = await evalIn('],
      ['publishing continuous control copy',
        'The preview package is being published to the development site.'],
      ['publishing adverb control copy',
        'The development site was just published.'],
      ['publishing deployed control copy',
        'The development site is now deployed.'],
      ['publishing gone-live control copy',
        'The preview package has gone live.'],
      ['publishing variant exact inventory',
        'releasePublishingVariantsCtl.variants?.length !== 4'],
      ['publishing cross-row control',
        'const releasePublishingCrossRowCtl = await evalIn('],
      ['publishing cross-row control copy',
        'The development site now deploys the v2.0 preview package.'],
      ['publishing cross-row rejection',
        'releasePublishingCrossRowCtl.contradictory?.publishingContradiction !== true'],
    ]);

    const glassOracle = section(
      glassSource,
      '        const developmentDetailCheck = `',
      '        const developmentDetail = await evalIn(developmentDetailCheck);',
    );
    proveEachMarkerRequired(glassOracle, [
      ['Glass publishing heading lookup',
        'publishing=bulletNodes.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/'],
      ['Glass publishing semantic heading',
        "publishingContract=publishingHeading==='Under the Hood'"],
      ['Glass publishing parked body',
        "&&publishingText.includes('DEVELOPMENT PUBLISHING STAYS PARKED')"],
      ['Glass publishing non-publication body',
        "&&publishingText.includes('it does not publish')"],
      ['Glass publishing manual workflow body',
        "&&publishingText.includes('The separate branch-site workflow remains manually parked')"],
      ['Glass publishing production body',
        "&&publishingText.includes('production remains the v1.8.9 main-branch site')"],
      ['Glass publishing contradiction predicate',
        'publishingClaim=/(?:(?:(?:v2(?:[.]0)?'],
      ['Glass publishing contradiction scans every row',
        'publishingContradiction=bullets.some((copy)=>unnegated(copy,publishingClaim))'],
      ['Glass publishing contradiction contract member',
        '&&!publishingContradiction;'],
      ['Glass publishing completeness member',
        '&&workspaceContract&&coldArtContract&&workerContract&&shipyardContract&&hdSurfaceContract&&publishingContract'],
      ['Glass publishing contradiction diagnostic',
        'publishingHeading,publishingContract,publishingContradiction,rnSeen:state.rnSeen'],
      ['Glass publishing honesty member',
        '&&!shipyardContradiction&&!publishingContradiction&&lower.includes'],
    ]);
    expect(glassOracle.split('(?:published|deployed|shipped)').length - 1).toBe(2);
    const glassControls = section(
      glassSource,
      '          const detailControls = await evalIn(',
      '          if (!detailControls.ok)',
    );
    proveEachMarkerRequired(glassControls, [
      ['Glass publishing missing-clause mutation',
        "publishing.textContent=publishingText.replace('DEVELOPMENT PUBLISHING STAYS PARKED','DEVELOPMENT PUBLISHING CONTRACT REMOVED')"],
      ['Glass publishing additive control copy',
        "The preview package now publishes and deploys the v2.0 development site."],
      ['Glass publishing contradiction assessment',
        'publishingContradictionChanged=publishing.textContent!==publishingText;publishingContradictory=${developmentDetailCheck}'],
      ['Glass publishing semantic restoration assessment',
        'publishingRestored=${developmentDetailCheck};'],
      ['Glass publishing contradiction rejection',
        '&&publishingContradictionChanged&&publishingContradictory?.ok===false'],
      ['Glass publishing contradiction diagnosis',
        '&&publishingContradictory?.publishingContradiction===true&&publishingContradictory?.honest===false'],
      ['Glass publishing inverted-live control copy',
        'The v2.0 preview is live in production.'],
      ['Glass publishing inverted-live assessment',
        'publishingLiveProductionChanged=publishing.textContent!==publishingText;publishingLiveProductionContradictory=${developmentDetailCheck}'],
      ['Glass publishing inverted-live rejection',
        '&&publishingLiveProductionChanged&&publishingLiveProductionContradictory?.ok===false'],
      ['Glass publishing inverted-live diagnosis',
        '&&publishingLiveProductionContradictory?.publishingContradiction===true'],
      ['Glass publishing passive control copy',
        'The preview package is published to the development site.'],
      ['Glass publishing passive assessment',
        'publishingPassiveChanged=publishing.textContent!==publishingText;publishingPassiveContradictory=${developmentDetailCheck}'],
      ['Glass publishing passive rejection',
        '&&publishingPassiveChanged&&publishingPassiveContradictory?.ok===false'],
      ['Glass publishing passive diagnosis',
        '&&publishingPassiveContradictory?.publishingContradiction===true'],
      ['Glass publishing variant inventory',
        'publishingVariantContradictions.length===4'],
      ['Glass publishing variant diagnosis',
        'publishingVariantContradictions.every((row)=>row.result?.ok===false'],
      ['Glass publishing cross-row mutation',
        'first.textContent=firstText+\' The development site now deploys the v2.0 preview package.\''],
      ['Glass publishing cross-row rejection',
        '&&publishingCrossRowChanged&&publishingCrossRowContradictory?.ok===false'],
      ['Glass publishing restoration requirement',
        '&&publishingRestored?.ok===true&&publishingRestored?.publishingContract===true'],
    ]);
  });

  it('collects one exact convergence-release witness for both Arc 4 reload paths', () => {
    expect(sliceSource.split(
      "const F4_CONVERGENCE_BINDING = '__cfF4AuthorityConvergenceWitness';",
    ).length - 1).toBe(1);
    expect(sliceSource).toContain(
      "await send('Runtime.addBinding', { name: F4_CONVERGENCE_BINDING }, sess);",
    );
    expect(sliceSource).toContain(
      'const arc4ConvergenceReleaseIsolatedCheck = (result, expected) => (',
    );
    const stale = section(
      sliceSource,
      "  const arc4StaleFaultKey = 'cf_slice_arc4_stale_fault_capture_v1';",
      '  const arc4MissBeforeRaw = arc4StaleReloadedRaw;',
    );
    proveEachMarkerRequired(stale, [
      ['stale event mark', 'const arc4StaleMark = events.length;'],
      ['stale witness collection',
        'const arc4StaleConvergenceWitnesses = f4ConvergenceWitnessesSince('],
      ['stale exact witness selection',
        'convergenceWitness: arc4StaleConvergenceWitnesses.length === 1'],
      ['stale missing-count control',
        'const arc4StaleMissingWitnessControl = assessArc4StaleConvergence('],
      ['stale duplicate-count control',
        'const arc4StaleDuplicateWitnessControl = assessArc4StaleConvergence('],
      ['stale before-authority control',
        'const arc4StaleWitnessAuthorityControl = assessArc4StaleWitnessControl('],
      ['stale tuple-drift control',
        'const arc4StaleWitnessTupleControl = assessArc4StaleWitnessControl('],
      ['stale lifecycle-swap control',
        'const arc4StaleWitnessLifecycleControl = assessArc4StaleWitnessControl('],
      ['stale visible-runtime control',
        'const arc4StaleWitnessVisibleControl = assessArc4StaleWitnessControl('],
      ['stale heartbeat-runtime control',
        'const arc4StaleWitnessHeartbeatControl = assessArc4StaleWitnessControl('],
      ['stale nested authority diagnosis',
        "arc4StaleWitnessAuthorityControl, 'beforeAuthority')"],
      ['stale nested tuple diagnosis',
        "arc4StaleWitnessTupleControl, 'tuplePreserved')"],
      ['stale nested lifecycle diagnosis',
        "arc4StaleWitnessLifecycleControl, 'beforeLifecycle')"],
      ['stale pagehide release control',
        'const arc4StalePagehideRuntimeControl = assessArc4StaleOldSurfaceControl('],
      ['stale future UI control',
        'const arc4StaleRenderedFutureControl = assessArc4StaleOldSurfaceControl('],
      ['stale excessive lag control',
        'const arc4StaleExcessiveUiLagControl = assessArc4StaleWitnessControl('],
    ]);
    const publication = section(
      sliceSource,
      "  const arc4PublicationFaultKey = 'cf_slice_arc4_publication_fault_capture_v1';",
      '  arc4SliceLedger = {',
    );
    proveEachMarkerRequired(publication, [
      ['publication event mark', 'const arc4PublicationMark = events.length;'],
      ['publication witness collection',
        'const arc4PublicationConvergenceWitnesses = f4ConvergenceWitnessesSince('],
      ['publication exact witness selection',
        'convergenceWitness: arc4PublicationConvergenceWitnesses.length === 1'],
      ['publication missing-count control',
        'const arc4PublicationMissingWitnessControl = assessArc4PublicationConvergence('],
      ['publication duplicate-count control',
        'const arc4PublicationDuplicateWitnessControl = assessArc4PublicationConvergence('],
      ['publication before-authority control',
        'const arc4PublicationWitnessAuthorityControl'],
      ['publication tuple-drift control',
        'const arc4PublicationWitnessTupleControl'],
      ['publication lifecycle-swap control',
        'const arc4PublicationWitnessLifecycleControl'],
      ['publication visible-runtime control',
        'const arc4PublicationWitnessVisibleControl'],
      ['publication heartbeat-runtime control',
        'const arc4PublicationWitnessHeartbeatControl'],
      ['publication nested authority diagnosis',
        "convergenceExpected: 'beforeAuthority',\n      result: arc4PublicationWitnessAuthorityControl"],
      ['publication nested tuple diagnosis',
        "convergenceExpected: 'tuplePreserved'"],
      ['publication nested lifecycle diagnosis',
        "convergenceExpected: 'beforeLifecycle'"],
      ['publication coordinated pre-action authority control',
        'for (const runtime of [witness.before.runtime, witness.after.runtime])'],
      ['publication pagehide release control',
        'const arc4PublicationPagehideRuntimeControl'],
      ['publication future UI control',
        'const arc4PublicationRenderedFutureControl'],
      ['publication excessive lag control',
        'const arc4PublicationExcessiveUiLagControl'],
    ]);
  });

  it('independently proves convergence release from product-exact audio and stable reads', () => {
    const productAudio = section(
      mainSource,
      'function tameGreetingAudioReleasedForReload(',
      '\ntype BootPhaseStage =',
    );
    const contractAudio = section(
      arc4ContractSource,
      'const exactConvergenceAudioReleased = (audio) => {',
      '\nconst exactConvergenceRuntimeTuple =',
    );
    const mirroredAudioConditions = [
      ['schema',
        'diagnostics.schema === TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA',
        "audio?.schema === 'cf-v2-tame-greeting-audio/v1'"],
      ['disposed', 'diagnostics.disposed === true', 'audio.disposed === true'],
      ['armed', 'diagnostics.armed === 0', 'audio.armed === 0'],
      ['active voice',
        'diagnostics.activeVoiceId === null', 'audio.activeVoiceId === null'],
      ['counterpart none',
        "diagnostics.counterpart.status === 'none'",
        "audio?.counterpart?.status === 'none'"],
      ['counterpart key',
        'diagnostics.counterpart.key === null', 'audio.counterpart.key === null'],
      ['counterpart generation',
        'diagnostics.counterpart.generation === null',
        'audio.counterpart.generation === null'],
      ['counterpart lost',
        "diagnostics.counterpart.status === 'lost'",
        "audio?.counterpart?.status === 'lost'"],
      ['runtime disposed',
        "diagnostics.runtime.state === 'disposed'",
        "audio.runtime?.state === 'disposed'"],
      ['context released',
        'diagnostics.runtime.contextState === null',
        'audio.runtime.contextState === null'],
      ['nodes released',
        'diagnostics.runtime.nodes.active === 0',
        'audio.runtime.nodes?.active === 0'],
      ['voices released',
        'diagnostics.runtime.voices.active === 0',
        'audio.runtime.voices?.active === 0'],
      ['voice ids released',
        'diagnostics.runtime.voices.ids.length === 0',
        'audio.runtime.voices.ids.length === 0'],
      ['creature emitters released',
        'diagnostics.runtime.creatureEmitters.active === 0',
        'audio.runtime.creatureEmitters?.active === 0'],
      ['voice reservations released',
        'diagnostics.runtime.reservations.voices.active === 0',
        'audio.runtime.reservations?.voices?.active === 0'],
      ['node reservations released',
        'diagnostics.runtime.reservations.nodes.active === 0',
        'audio.runtime.reservations?.nodes?.active === 0'],
    ] as const;
    for (const [label, productNeedle, contractNeedle] of mirroredAudioConditions) {
      expect(productAudio, `product ${label}`).toContain(productNeedle);
      expect(contractAudio, `contract ${label}`).toContain(contractNeedle);
    }
    expect(contractAudio).toContain('Array.isArray(audio.runtime.voices.ids)');

    const productConvergence = section(
      mainSource,
      'function scheduleF4AuthorityConvergenceReload(',
      '\ntype F4HeartbeatStorageError =',
    );
    proveEachMarkerRequired(productConvergence, [
      ['product transient read hold', "persistHold = 'transient-read';"],
      ['product pre-release runtime witness',
        'runtime: runtime.diagnostics(),\n        audio: tameGreetingAudioOwner?.diagnostics() ?? null'],
      ['product runtime release await', 'try { await runtime.release(); }'],
      ['product runtime owner clear', 'if (f4Runtime === runtime) f4Runtime = null;'],
      ['product post-release runtime witness',
        'runtime: runtime.diagnostics(),\n          audio: afterAudio'],
      ['product convergence schema',
        "schema: 'cf-v2-f4-authority-convergence/v1' as const"],
    ]);
    const productStaleLifecycle = section(
      f4RuntimeSource,
      '  const blockAndRelease = async (stale: boolean): Promise<void> => {',
      '\n\n  const heartbeatUnsafe =',
    );
    proveEachMarkerRequired(productStaleLifecycle, [
      ['product stale write count', 'if (stale) staleWrites++;'],
      ['product stale block', 'staleBlocked = true;'],
      ['product stale lease release', 'await releaseGrant();'],
    ]);
    const productRuntimeRelease = section(
      f4RuntimeSource,
      '    release(): Promise<void> {',
      '\n    diagnostics(): F4RuntimeDiagnostics {',
    );
    proveEachMarkerRequired(productRuntimeRelease, [
      ['product terminal release latch', 'released = true;'],
      ['product release eligibility',
        'clock.setEligibility({ visible: false, answerable: false, leaseOwned: false }, input.now());'],
      ['product release visibility', 'visible = false;'],
      ['product exact grant release', 'return enqueue(releaseGrant);'],
    ]);
    expect(f4RuntimeSource).toContain('leaseHeartbeat: grant?.heartbeat ?? null');

    const lifecycle = section(
      arc4ContractSource,
      'const exactConvergenceRuntimeTuple = (left, right) => (',
      '\nconst assessConvergenceRelease = ({',
    );
    proveEachMarkerRequired(lifecycle, [
      ['tuple active play', 'left?.activePlayMs === right?.activePlayMs'],
      ['tuple stale block', 'left?.staleBlocked === right?.staleBlocked'],
      ['tuple commits', 'left?.commits === right?.commits'],
      ['tuple stale writes', 'left?.staleWrites === right?.staleWrites'],
      ['tuple lease losses', 'left?.leaseLosses === right?.leaseLosses'],
      ['before visibility', 'runtime?.visible !== true'],
      ['stale lease released', 'runtime.leaseOwned === false'],
      ['stale block retained', 'runtime.staleBlocked === true'],
      ['stale heartbeat released', 'runtime.leaseHeartbeat === null'],
      ['stale write observed', 'runtime.staleWrites > 0'],
      ['publication lease retained', 'runtime.leaseOwned === true'],
      ['publication not stale-blocked', 'runtime.staleBlocked === false'],
      ['publication heartbeat retained', 'counter(runtime.leaseHeartbeat)'],
      ['publication commit observed', 'runtime.commits > 0'],
    ]);
    expect(arc4ContractSource).toContain(
      'commits = 1, staleWrites = staleBlocked ? 1 : 0,',
    );

    const assessment = section(
      arc4ContractSource,
      'const assessConvergenceRelease = ({',
      '\nconst exactReleasedStaleActivePlayProjection =',
    );
    proveEachMarkerRequired(assessment, [
      ['detail attribution', 'detailAttribution: boundedText(expectedDetail, 512)'],
      ['lease read stability', 'leaseReadsStable: counter(before?.leaseReadCount)'],
      ['revision read stability',
        'revisionReadsStable: counter(before?.revisionReadCount)'],
      ['scenario-specific before lifecycle',
        'beforeLifecycle: exactConvergenceBeforeLifecycle(beforeRuntime, scenario)'],
      ['post-release visibility', 'afterRuntime?.visible === false'],
      ['post-release heartbeat', 'afterRuntime?.leaseHeartbeat === null'],
      ['post-disposal audio',
        'audioReleased: exactConvergenceAudioReleased(after?.audio)'],
    ]);
    expect(arc4ContractSource).toContain(
      'expectedDetail: `Arc 4 ${interaction?.verb} authority stale`',
    );
    expect(arc4ContractSource).toContain(
      'expectedDetail: `Arc 4 ${interaction?.verb} committed at revision ${committed?.revision}; publication slice-smoke injected Arc 4 publication rejection`',
    );
    expect(arc4ContractSource).toContain("scenario: 'stale'");
    expect(arc4ContractSource).toContain("scenario: 'publication'");
    expect(mainSource).toContain('`Arc 4 ${verb} authority ${attempt.detail}`');
    expect(mainSource).toContain(
      "throw new Error('slice-smoke injected Arc 4 publication rejection')",
    );
    expect(mainSource).toContain(
      '`Arc 4 ${verb} committed at revision ${transaction.revision}; publication ${detail}`',
    );

    const controls = section(
      arc4ContractSource,
      'const convergenceReleaseDirectionalSelftests = Object.freeze({',
      '\nfor (const [name, control] of Object.entries(',
    );
    proveEachMarkerRequired(controls, [
      ['detail mutant', 'detailAttribution: Object.freeze({'],
      ['lease read mutant', 'leaseReadsStable: Object.freeze({'],
      ['revision read mutant', 'revisionReadsStable: Object.freeze({'],
      ['before visible mutant', 'beforeVisible: Object.freeze({'],
      ['stale lifecycle swap mutant', 'staleLifecycleSwap: Object.freeze({'],
      ['publication lifecycle swap mutant',
        'publicationLifecycleSwap: Object.freeze({'],
      ['after visible mutant', 'afterVisible: Object.freeze({'],
      ['after heartbeat mutant', 'afterLeaseHeartbeat: Object.freeze({'],
      ['tuple stale-block mutant', 'tupleStaleBlocked: Object.freeze({'],
      ['tuple commit mutant', 'tupleCommits: Object.freeze({'],
      ['tuple stale-write mutant', 'tupleStaleWrites: Object.freeze({'],
      ['tuple lease-loss mutant', 'tupleLeaseLosses: Object.freeze({'],
      ['missing audio mutant', 'audioMissing: Object.freeze({'],
      ['audio schema mutant', 'audioSchema: Object.freeze({'],
      ['audio disposal mutant', 'audioDisposed: Object.freeze({'],
      ['audio armed mutant', 'audioArmed: Object.freeze({'],
      ['active voice mutant', 'audioVoiceId: Object.freeze({'],
      ['counterpart mutant', 'audioCounterpart: Object.freeze({'],
      ['counterpart key mutant', 'audioCounterpartKey: Object.freeze({'],
      ['counterpart generation mutant', 'audioCounterpartGeneration: Object.freeze({'],
      ['runtime state mutant', 'audioRuntimeState: Object.freeze({'],
      ['context state mutant', 'audioContextState: Object.freeze({'],
      ['node mutant', 'audioNodes: Object.freeze({'],
      ['voice mutant', 'audioVoices: Object.freeze({'],
      ['voice id mutant', 'audioVoiceIds: Object.freeze({'],
      ['voice id shape mutant', 'audioVoiceIdsShape: Object.freeze({'],
      ['creature emitter mutant', 'audioCreatureEmitter: Object.freeze({'],
      ['voice reservation mutant', 'audioVoiceReservation: Object.freeze({'],
      ['node reservation mutant', 'audioNodeReservation: Object.freeze({'],
    ]);
    expect(arc4ContractSource).toContain(
      "throw new Error('Arc 4 convergence release rejected a released lost counterpart')",
    );
  });

  it('requires canonical Earth identity only after legacy Training restoration', () => {
    const assessment = section(
      sliceSource,
      '  const DTRAIN_CANONICAL_GALAXY_VIEW = Object.freeze({',
      '  const assessDtrainArc2Restore = ({',
    );
    proveEachMarkerRequired(assessment, [
      ['canonical Earth key',
        'const DTRAIN_CANONICAL_EARTH_KEY = ARC3_OTHER_WORLD_CONTROL_ADDRESS.key;'],
      ['canonical Earth id',
        'const DTRAIN_CANONICAL_EARTH_ID = `w|${DTRAIN_CANONICAL_EARTH_KEY}`;'],
      ['physical Earth parent route',
        'const dtrainPhysicalEarthAtlasRow = (entry) => entry?.where?.type === \'planet\''],
      ['physical Earth galaxy identity',
        'entry.where.gal?.seed === DTRAIN_CANONICAL_GALAXY_VIEW.seed'],
      ['physical Earth galaxy x',
        'entry.where.gal?.x === DTRAIN_CANONICAL_GALAXY_VIEW.x'],
      ['physical Earth galaxy y',
        'entry.where.gal?.y === DTRAIN_CANONICAL_GALAXY_VIEW.y'],
      ['physical Earth galaxy size',
        'entry.where.gal?.size === DTRAIN_CANONICAL_GALAXY_VIEW.size'],
      ['physical Earth galaxy spacing',
        'entry.where.gal?.sp === DTRAIN_CANONICAL_GALAXY_VIEW.sp'],
      ['physical Earth galaxy tilt',
        'entry.where.gal?.tilt === DTRAIN_CANONICAL_GALAXY_VIEW.tilt'],
      ['physical Earth galaxy rotation',
        'entry.where.gal?.rot === DTRAIN_CANONICAL_GALAXY_VIEW.rot'],
      ['physical Earth home identity',
        'entry.where.gal?.home === DTRAIN_CANONICAL_GALAXY_VIEW.home'],
      ['physical Earth star identity',
        'entry.where.star?.seed === DTRAIN_CANONICAL_STAR_VIEW.seed'],
      ['physical Earth star x',
        'entry.where.star?.x === DTRAIN_CANONICAL_STAR_VIEW.x'],
      ['physical Earth star y',
        'entry.where.star?.y === DTRAIN_CANONICAL_STAR_VIEW.y'],
      ['physical Earth leaf under canonical parents',
        'entry.where.pseed === EARTH.seed;'],
      ['projection removes one checkpoint row',
        'copy.log = rows.filter((_, index) => index !== checkpointRowIndex)'],
      ['projection recognizes the physical full route',
        'rows.findIndex(dtrainPhysicalEarthAtlasRow)'],
      ['assessment recognizes the physical full route',
        'raw.log.filter(dtrainPhysicalEarthAtlasRow)'],
      ['legacy and duplicate rows forbidden',
        "legacyEarthRows.length === 0 && earthRows.length === 1, 'checkpoint Earth row inventory'"],
      ['canonical parent identity',
        "earthIdentity?.[1] === canonicalEarthIdentity?.[1], 'checkpoint Earth parent identity'"],
      ['canonical ordinal identity',
        "earthIdentity?.[2] === canonicalEarthIdentity?.[2], 'checkpoint Earth ordinal identity'"],
      ['content compared without identity',
        'canonicalJson(earthWithoutId) === canonicalJson(expectedEarth)'],
      ['canonical home binding',
        'raw?.home === DTRAIN_CANONICAL_EARTH_ID'],
    ]);
    const controls = section(
      sliceSource,
      '  const privateProofControlRaw = structuredClone(rescueRaw);',
      '  /* Candidate proof fails before repository ownership reaches a write.',
    );
    proveEachMarkerRequired(controls, [
      ['private ordinal control', 'privateProofEarthRow.where.ordinal = 2;'],
      ['legacy output control', "['legacy Earth output id'"],
      ['wrong parent isolated control',
        "['Earth parent identity', 'checkpoint Earth parent identity'"],
      ['wrong ordinal isolated control',
        "['Earth ordinal identity', 'checkpoint Earth ordinal identity'"],
      ['identity exact-reason assertion',
        'JSON.stringify(assessment.reasons) !== JSON.stringify([expectedReason])'],
      ['identity restoration assertion', '!restored.ok'],
      ['duplicate identity control', "['duplicate legacy and canonical Earth rows'"],
      ['route mismatch control', "['Earth route identity'"],
    ]);
  });

  it('treats failed Arc 2 bootstrap Inventory as lazy, closed, and empty', () => {
    const collector = section(
      sliceSource,
      '  const arc2BootstrapHookFailure = await evalF4Control(',
      '  const arc2BootstrapFailedToken = await sliceToken(',
    );
    proveEachMarkerRequired(collector, [
      ['marker presence retained', 'panelStateMarkerPresent:marker!==null'],
      ['blank marker retained',
        "panelState:marker===null?null:marker.getAttribute('data-inventory-state')"],
      ['logical panel owner presence collected',
        "panelOpenPresent:apiState!==null&&typeof apiState==='object'"],
      ['logical panel owner collected', 'panelOpen:apiState?.panelOpen'],
      ['computed visibility collected',
        'panelDisplay:panel?getComputedStyle(panel).display:null'],
      ['accessibility visibility collected',
        "panelAriaHidden:panel?.getAttribute('aria-hidden')??null"],
      ['dock opener state collected',
        "dockExpanded:dock?.getAttribute('aria-expanded')??null"],
      ['rail opener state collected',
        "railExpanded:rail?.getAttribute('aria-expanded')??null"],
    ]);
    const assessment = section(
      sliceSource,
      'const assessArc2BootstrapRefusal = ({',
      'const assessFreshInitializationRace = (',
    );
    proveEachMarkerRequired(assessment, [
      ['lazy marker is absent, not blank',
        'hook?.panelStateMarkerPresent !== false || hook?.panelState !== null'],
      ['logical closure',
        'hook?.panelOpenPresent !== true || hook?.panelOpen !== null'],
      ['visual closure',
        "if (hook?.panelDisplay !== 'none') reasons.push('failed bootstrap Inventory display')"],
      ['accessible closure',
        "if (hook?.panelAriaHidden !== 'true') reasons.push('failed bootstrap Inventory aria-hidden')"],
      ['dock opener collapsed',
        "if (hook?.dockExpanded !== 'false') reasons.push('failed bootstrap dock opener collapsed')"],
      ['rail opener collapsed',
        "if (hook?.railExpanded !== 'false') reasons.push('failed bootstrap rail opener collapsed')"],
      ['empty deferred rows',
        "if (hook?.panelRows !== 0) reasons.push('failed bootstrap Inventory rows empty')"],
      ['empty deferred actions',
        "if (hook?.panelActions !== 0) reasons.push('failed bootstrap Inventory actions empty')"],
    ]);
    const controls = section(
      sliceSource,
      '  const arc2MissingPanelOpenHook = structuredClone(arc2BootstrapBundle.hook);',
      '  const waitControlValue = async (',
    );
    proveEachMarkerRequired(controls, [
      ['mounted marker control', 'mountedPanelState: assessArc2BootstrapRefusal('],
      ['blank marker control', 'blankPanelStateMarker: assessArc2BootstrapRefusal('],
      ['logical owner control', 'logicalPanelOwner: assessArc2BootstrapRefusal('],
      ['missing logical-owner property control',
        'missingPanelOpenProperty: assessArc2BootstrapRefusal('],
      ['missing logical-owner property mutation',
        'delete arc2MissingPanelOpenHook.panelOpen;'],
      ['missing logical-owner presence mutation',
        'arc2MissingPanelOpenHook.panelOpenPresent = false;'],
      ['visual display control', 'visiblePanelDisplay: assessArc2BootstrapRefusal('],
      ['ARIA visibility control', 'visiblePanelAria: assessArc2BootstrapRefusal('],
      ['dock opener control', 'expandedDockOpener: assessArc2BootstrapRefusal('],
      ['rail opener control', 'expandedRailOpener: assessArc2BootstrapRefusal('],
      ['row leak control', 'leakedPanelRow: assessArc2BootstrapRefusal('],
      ['action leak control', 'leakedPanelAction: assessArc2BootstrapRefusal('],
      ['logical owner exact reason',
        "logicalPanelOwner: 'failed bootstrap logical Inventory owner'"],
      ['missing logical-owner exact reason',
        "missingPanelOpenProperty: 'failed bootstrap logical Inventory owner'"],
      ['visual display exact reason',
        "visiblePanelDisplay: 'failed bootstrap Inventory display'"],
      ['ARIA visibility exact reason',
        "visiblePanelAria: 'failed bootstrap Inventory aria-hidden'"],
      ['dock opener exact reason',
        "expandedDockOpener: 'failed bootstrap dock opener collapsed'"],
      ['rail opener exact reason',
        "expandedRailOpener: 'failed bootstrap rail opener collapsed'"],
      ['closure exact-reason assertion',
        'JSON.stringify(control?.reasons) !== JSON.stringify([expectedReason])'],
      ['closure restoration assertion', '|| !arc2BootstrapAssessment.ok'],
    ]);
  });
});
