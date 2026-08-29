import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);

type Marker = readonly [label: string, target: string];
type OrderRule = Readonly<{ label: string; first: string; second: string }>;

const occurrences = (source: string, target: string): number => (
  source.split(target).length - 1
);

function section(source: string, start: string, end: string): string {
  expect(occurrences(source, start), `unique section start: ${start}`).toBe(1);
  expect(occurrences(source, end), `unique section end: ${end}`).toBe(1);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  return source.slice(left, right);
}

function markerErrors(owner: string, markers: readonly Marker[]): string[] {
  return markers.flatMap(([label, target]) => {
    const count = occurrences(owner, target);
    return count === 1 ? [] : [`${label}: expected one marker, got ${count}`];
  });
}

function orderErrors(owner: string, rules: readonly OrderRule[]): string[] {
  return rules.flatMap(({ label, first, second }) => {
    const firstCount = occurrences(owner, first);
    const secondCount = occurrences(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      return [`${label}: non-unique order markers (${firstCount}, ${secondCount})`];
    }
    return owner.indexOf(first) < owner.indexOf(second) ? [] : [`${label}: reversed`];
  });
}

function proveEachMarkerRequired(owner: string, markers: readonly Marker[]): void {
  expect(markerErrors(owner, markers)).toEqual([]);
  markers.forEach(([label, target], index) => {
    const replacement = `__ARC0_LANDING_MARKER_${index}__`;
    expect(owner).not.toContain(replacement);
    const mutant = owner.replace(target, replacement);
    expect(mutant, label).not.toBe(owner);
    expect(markerErrors(mutant, markers), label)
      .toContain(`${label}: expected one marker, got 0`);
  });
}

function swapUnique(owner: string, first: string, second: string, index: number): string {
  expect(occurrences(owner, first)).toBe(1);
  expect(occurrences(owner, second)).toBe(1);
  const marker = `__ARC0_LANDING_ORDER_${index}__`;
  expect(owner).not.toContain(marker);
  return owner.replace(first, marker).replace(second, first).replace(marker, second);
}

function proveEachOrderRequired(owner: string, rules: readonly OrderRule[]): void {
  expect(orderErrors(owner, rules)).toEqual([]);
  rules.forEach((rule, index) => {
    const mutant = swapUnique(owner, rule.first, rule.second, index);
    expect(orderErrors(mutant, [rule]), rule.label).toEqual([`${rule.label}: reversed`]);
  });
}

const faultFixtureOwner = section(
  sliceSource,
  'const ARC0_LANDING_FAULT_RAW = (() => {',
  'const ARC4_PERTAR_SOURCE_SAVE = JSON.parse(ARC4_PERTAR_RAW);',
);
const evidenceOwner = section(
  sliceSource,
  '  /* ARC 0 LANDING FAULT EVIDENCE BEGIN.',
  '  /* ARC 0 LANDING FAULT EVIDENCE END. */',
);
const collectorOwner = section(
  evidenceOwner,
  '  const collectArc0LandingFaultEvidence = async ({',
  '  const arc0LandingIsolatedControl =',
);
const sourceExactOwner = section(
  evidenceOwner,
  '  const arc0LandingSourceExact = (fixture) => {',
  '  const arc0LandingConvergenceHeld = (state) => (',
);
const reloadFixedPointOwner = section(
  evidenceOwner,
  '  const arc0LandingReloadFixedPoint = (evidence, route) => {',
  '  const arc0LandingConvergenceWitnessExact = (evidence, scenario, raw, detail) => {',
);
const storageAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingStorageRefusal = (evidence) => {',
  '  const assessArc0LandingStaleConvergence = (evidence) => {',
);
const staleAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingStaleConvergence = (evidence) => {',
  '  const assessArc0LandingPublicationConvergence = (evidence) => {',
);
const publicationAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingPublicationConvergence = (evidence) => {',
  '  const collectArc0LandingFaultEvidence = async ({',
);
const publicationProductOwner = section(
  evidenceOwner,
  '  const arc0LandingPublicationProductExact = (evidence) => {',
  '  const arc0LandingOneAwaitedActionExact = (evidence) => (',
);
const storageScenarioOwner = section(
  evidenceOwner,
  '  const arc0LandingStorageEvidence = await collectArc0LandingFaultEvidence({',
  '  const arc0LandingStaleEvidence = await collectArc0LandingFaultEvidence({',
);
const staleScenarioOwner = section(
  evidenceOwner,
  '  const arc0LandingStaleEvidence = await collectArc0LandingFaultEvidence({',
  '  const arc0LandingPublicationEvidence = await collectArc0LandingFaultEvidence({',
);
const publicationScenarioOwner = section(
  sliceSource,
  '  const arc0LandingPublicationEvidence = await collectArc0LandingFaultEvidence({',
  '  /* ARC 0 LANDING FAULT EVIDENCE END. */',
);

describe('Slice Arc 0 Landing fault evidence contract', () => {
  it('starts every fault from one exact source-proven unlanded fixture', () => {
    proveEachMarkerRequired(faultFixtureOwner, [
      ['Pertar source clone', 'const save = JSON.parse(ARC4_PERTAR_RAW);'],
      ['fault-fixture identity', "save.me = 'Arc 0 Landing Fault Browser Fixture';"],
      ['bounded landed-array input', 'save.land = Array.isArray(save.land)'],
      ['Pertar removal', '.filter((seed) => seed !== ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['serialized replacement', 'return JSON.stringify(save);'],
    ]);
    proveEachMarkerRequired(sourceExactOwner, [
      ['source heartbeat stopped', 'fixture?.heartbeat?.stopped === true'],
      ['source heartbeat settled', 'fixture?.heartbeat?.cycleSettled === true'],
      ['source heartbeat token', 'fixture?.heartbeat?.documentToken === fixture?.token'],
      ['source writable token', 'fixture?.sourceReady?.token === fixture?.token'],
      ['exact live source route', 'arc4PertarSourceRouteExact(state)'],
      ['exact saved source route', 'arc4PertarSavedStarRouteExact(state)'],
      ['live unlanded product', '!state?.save?.landed?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['legacy unlanded product', '!raw?.legacy?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['split unlanded product', '!raw?.catalogRow?.data?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['zero landing receipts', 'arc0LandingReceipts(raw).length === 0'],
    ]);
  });

  it('collects one awaited action across a held and explicitly released convergence reload', () => {
    const markers = [
      ['fresh fixture', 'const fixture = await installArc0LandingFaultFixture(label);'],
      ['old document token', 'const beforeToken = fixture.token;'],
      ['event ledger mark', 'const convergenceMark = events.length;'],
      ['convergence hold arm', "'window.__CF_SLICE__.api.__smokeArmF4ConvergenceReloadHold()'"],
      ['one exact fault arm', 'const faultArmed = await evalIn(`window.__CF_SLICE__.api.${faultHook}()`);'],
      ['awaited landing', 'const accepted=await S.api.landOn(${JSON.stringify(ARC4_PERTAR_FIXTURE.planet)});'],
      ['action token witness', 'return {accepted,documentToken:S.documentToken}'],
      ['held phase wait', "s?.persistence?.convergenceReloadHold?.phase==='holding'"],
      ['settled owner wait', "s?.landing?.actionCoordinator?.inFlight===false"],
      ['exact fault wait', 'fault?.injection===${JSON.stringify(injection)}&&fault?.outcome===${JSON.stringify(faultOutcome)}'],
      ['held durable read', 'const heldRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['single release', "'window.__CF_SLICE__.api.__smokeReleaseF4ConvergenceReload()'"],
      ['new document wait', 'await waitForSlice(sess, `${label} replacement`, { previousToken: beforeToken });'],
      ['new writable authority', 'previousToken: beforeToken,'],
      ['reloaded heartbeat quiescence', "'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()'"],
      ['reloaded state', "const reloadedState = await evalIn('window.__CF_SLICE__.api.state()');"],
      ['reloaded durable read', 'const reloadedRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['one convergence witness source', 'f4ConvergenceWitnessesSince(sess, convergenceMark)'],
      ['retained action token', 'actionDocumentToken: action?.documentToken'],
      ['scenario-specific acceptance', 'expectedAccepted: accepted'],
    ] as const satisfies readonly Marker[];
    const order = [
      { label: 'fixture before hold', first: markers[0][1], second: markers[3][1] },
      { label: 'hold before fault', first: markers[3][1], second: markers[4][1] },
      { label: 'fault before action', first: markers[4][1], second: markers[5][1] },
      { label: 'action before held wait', first: markers[5][1], second: markers[7][1] },
      { label: 'held wait before durable read', first: markers[7][1], second: markers[10][1] },
      { label: 'held read before release', first: markers[10][1], second: markers[11][1] },
      { label: 'release before replacement', first: markers[11][1], second: markers[12][1] },
      { label: 'replacement before writable', first: markers[12][1], second: markers[13][1] },
      { label: 'writable before quiescence', first: markers[13][1], second: markers[14][1] },
      { label: 'quiescence before reloaded read', first: markers[14][1], second: markers[16][1] },
      { label: 'reloaded read before witness query', first: markers[16][1], second: markers[17][1] },
    ] as const satisfies readonly OrderRule[];
    proveEachMarkerRequired(collectorOwner, markers);
    proveEachOrderRequired(collectorOwner, order);
  });

  it('binds storage rejection to no durable or local product and no retry', () => {
    proveEachMarkerRequired(storageAssessmentOwner, [
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['storage fault', "arc0LandingFaultExact(evidence, 'storage-failure', 'storage-error')"],
      ['no injected revision', 'injectedRevision === null'],
      ['held revision stable', 'heldRaw?.revision === beforeRaw?.revision'],
      ['reloaded revision stable', 'evidence?.reloadedRaw?.revision === beforeRaw?.revision'],
      ['held durable rows stable', 'arc0LandingRowsAndReceiptsExact(beforeRaw, heldRaw)'],
      ['reloaded durable rows stable', 'arc0LandingRowsAndReceiptsExact(heldRaw, evidence?.reloadedRaw)'],
      ['local publication withheld', ')) === canonicalJson(arc0LandingLiveProduct(evidence?.heldState))'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['convergence released', "arc0LandingConvergenceWitnessExact(evidence, 'storage', beforeRaw, detail)"],
      ['source reload fixed point', "reloadFixedPoint: arc0LandingReloadFixedPoint(evidence, 'source')"],
      ['zero postreload receipts', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 0'],
      ['no landing reward retry', '=== evidence?.fixture?.state?.save?.stats?.landings'],
    ]);
    proveEachMarkerRequired(storageScenarioOwner, [
      ['storage scenario label', "label: 'Arc 0 Landing storage-failure replacement'"],
      ['storage hook', "faultHook: '__smokeRejectNextArc0LandingStorage'"],
      ['storage expected outcome', "injection: 'storage-failure', faultOutcome: 'storage-error', accepted: false"],
      ['revision mutation', 'arc0LandingStorageRevisionControl.heldRaw.revision += 1;'],
      ['coordinator mutation', 'actionCoordinator.owner.busy = true;'],
      ['revision isolated red', "arc0LandingStorageControls.revision, 'revisionStable'"],
      ['coordinator isolated red', "arc0LandingStorageControls.coordinator, 'coordinatorReleased'"],
    ]);
  });

  it('binds stale refusal to the later writer alone and a source-route fixed point', () => {
    proveEachMarkerRequired(staleAssessmentOwner, [
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['stale fault', "arc0LandingFaultExact(evidence, 'stale-authority', 'stale')"],
      ['injected later revision', 'fault?.injectedRevision === beforeRaw?.revision + 1'],
      ['only one later revision', 'heldRaw?.revision === beforeRaw?.revision + 1'],
      ['later revision serialization', 'heldRaw?.revisionRaw === String(heldRaw.revision)'],
      ['later writer changed no product row', 'arc0LandingRowsAndReceiptsExact(beforeRaw, heldRaw)'],
      ['no action receipt', 'arc0LandingReceipts(heldRaw).length === 0'],
      ['no live action publication', '=== canonicalJson(arc0LandingLiveProduct(evidence?.heldState))'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['stale release witness', "arc0LandingConvergenceWitnessExact(evidence, 'stale', beforeRaw, detail)"],
      ['source reload', "arc0LandingReloadFixedPoint(evidence, 'source')"],
      ['held/reload fixed point', 'arc0LandingSnapshotExact(heldRaw, evidence?.reloadedRaw)'],
      ['no second revision', 'evidence?.reloadedRaw?.revision === beforeRaw?.revision + 1'],
      ['no postreload receipt', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 0'],
      ['no reward retry', '=== evidence?.fixture?.state?.save?.stats?.landings'],
    ]);
    proveEachMarkerRequired(staleScenarioOwner, [
      ['stale scenario label', "label: 'Arc 0 Landing stale-authority replacement'"],
      ['stale hook', "faultHook: '__smokeStaleNextArc0LandingAuthority'"],
      ['stale expected outcome', "injection: 'stale-authority', faultOutcome: 'stale', accepted: false"],
      ['held later-writer mutation', "arc0LandingStaleWriterControl.heldRaw.catalogRaw += '\\n';"],
      ['reloaded later-writer mutation', "arc0LandingStaleWriterControl.reloadedRaw.catalogRaw += '\\n';"],
      ['token mutation', 'arc0LandingStaleTokenControl.reloadedReady.token = arc0LandingStaleTokenControl.beforeToken;'],
      ['later-writer isolated red', "arc0LandingStaleControls.laterWriter, 'laterWriterOnly'"],
      ['reload isolated red', "arc0LandingStaleControls.token, 'reloadFixedPoint'"],
    ]);
  });

  it('binds postcommit publication failure to one durable landing and reward', () => {
    proveEachMarkerRequired(publicationProductOwner, [
      ['complete live saves', 'if (!beforeState?.save || !reloadedState?.save) return false;'],
      ['zero source receipts', 'beforeReceipts.length === 0'],
      ['one committed receipt', 'committedReceipts.length === 1'],
      ['receipt key/ordinal identity', 'receipt?.key === `receipt:${receipt?.row?.ordinal}`'],
      ['landing receipt kind', "receipt?.row?.kind === 'arc0-land'"],
      ['receipt witness schema', "facts?.schema === 'cf-v2-arc0-landing-witness/v1'"],
      ['exact world key', 'facts?.worldKey === ARC4_PERTAR_FIXTURE.worldKey'],
      ['exact planet seed', 'facts?.planetSeed === ARC4_PERTAR_FIXTURE.planet.seed'],
      ['exact planet ordinal', 'facts?.planetOrdinal === ARC4_PERTAR_FIXTURE.planet.ordinal'],
      ['first permanent landing', "facts?.landing === 'first' && facts?.permanentLanding === true"],
      ['nontraining source', 'facts?.training === false && facts?.landingKnownBefore === false'],
      ['identity and mirror landed', 'facts?.identityLandedAfter === true'],
      ['reloaded landed field', 'reloadedState.save.landed.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['reward witness', "sample?.kind === 'reward'"],
      ['two field samples', 'Array.isArray(sample.materials) && sample.materials.length === 2'],
      ['bounded material quantities', 'material?.quantity === 1'],
      ['material successor amounts', 'new Map(actualCargo).get(material.id) === material.quantityAfter'],
      ['positive Stardust', 'sample.stardust > 0'],
      ['reloaded essence', 'reloadedState?.save?.essence === sample.essenceAfter'],
      ['reloaded earned total', 'reloadedState?.save?.stats?.essenceEarned === sample.essenceEarnedAfter'],
      ['reloaded landing total', 'reloadedState?.save?.stats?.landings === sample.landingsAfter'],
      ['single Stardust delta', 'reloadedState.save.essence === beforeState.save.essence + sample.stardust'],
      ['single landing delta', 'reloadedState.save.stats.landings === beforeState.save.stats.landings + 1'],
      ['exact cargo successor', 'canonicalJson(actualCargo) === canonicalJson(expectedCargo)'],
      ['legacy cargo mirror', 'canonicalJson(committedRaw?.legacy?.cargo)'],
      ['split cargo mirror', 'canonicalJson(committedRaw?.inventoryRow?.data?.cargo)'],
      ['legacy essence mirror', 'committedRaw?.legacy?.essence === sample.essenceAfter'],
      ['legacy earned mirror', 'committedRaw?.legacy?.essenceEarned === sample.essenceEarnedAfter'],
      ['legacy landing mirror', 'committedRaw?.legacy?.landings === sample.landingsAfter'],
      ['split essence mirror', 'committedRaw?.playerRow?.data?.essence === sample.essenceAfter'],
      ['split earned mirror', 'committedRaw?.playerRow?.data?.essenceEarned === sample.essenceEarnedAfter'],
      ['split landing mirror', 'committedRaw?.playerRow?.data?.landings === sample.landingsAfter'],
    ]);
    proveEachMarkerRequired(publicationAssessmentOwner, [
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['publication fault', "evidence, 'publication-failure', 'committed-publication-reload'"],
      ['fault revision', 'fault?.injectedRevision === committedRaw?.revision'],
      ['one global revision', 'committedRaw?.revision === beforeRaw?.revision + 1'],
      ['revision serialization', 'committedRaw?.revisionRaw === String(committedRaw.revision)'],
      ['session seed held', 'committedAuthority?.seed === beforeAuthority?.seed'],
      ['one session ordinal', 'committedAuthority?.ordinal === beforeAuthority?.ordinal + 1'],
      ['session draws held', 'canonicalJson(committedAuthority?.draws) === canonicalJson(beforeAuthority?.draws)'],
      ['landing/reward witness', 'durableLandingReward: arc0LandingPublicationProductExact(evidence)'],
      ['legacy surface route', 'arc4PertarLegacyRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['split surface route', 'arc4PertarSplitRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['legacy landed field', 'committedRaw?.legacy?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['split landed field', 'committedRaw?.catalogRow?.data?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['world identity changed', 'canonicalJson(arc0LandingWorldIdentityBytes(beforeRaw))'],
      ['world identity reload parity', 'canonicalJson(arc0LandingWorldIdentityBytes(evidence?.reloadedRaw))'],
      ['old document withheld', '=== canonicalJson(arc0LandingLiveProduct(evidence?.heldState))'],
      ['old source route retained', 'arc4PertarSourceRouteExact(evidence?.heldState)'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['publication release witness', "evidence, 'publication', committedRaw, detail"],
      ['surface reload', "arc0LandingReloadFixedPoint(evidence, 'surface')"],
      ['committed/reload fixed point', 'arc0LandingSnapshotExact(committedRaw, evidence?.reloadedRaw)'],
      ['one landing receipt after reload', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 1'],
      ['no second authority draw', '=== committedAuthority?.ordinal'],
    ]);
    proveEachMarkerRequired(publicationScenarioOwner, [
      ['publication scenario label', "label: 'Arc 0 Landing postcommit-publication replacement'"],
      ['publication hook', "faultHook: '__smokeRejectNextArc0LandingPublication'"],
      ['publication expected outcome', "injection: 'publication-failure', faultOutcome: 'committed-publication-reload'"],
      ['durable success return', 'accepted: true,'],
      ['old-state optimism mutation', 'arc0LandingPublicationOptimismControl.heldState.save = structuredClone('],
      ['both durable snapshots mutated', 'for (const raw of [arc0LandingPublicationWitnessControl.heldRaw,'],
      ['field-sample witness mutation', 'witness.sample.stardust += 1;'],
      ['witness byte rewrite', 'raw.receiptRawRows[landingReceiptIndex] = JSON.stringify(receiptRow);'],
      ['reload revision mutation', 'arc0LandingPublicationReloadControl.reloadedRaw.revision += 1;'],
      ['optimism isolated red', "arc0LandingPublicationControls.optimism, 'localPublicationWithheld'"],
      ['witness isolated red', "arc0LandingPublicationControls.witness, 'durableLandingReward'"],
      ['reload isolated red', "arc0LandingPublicationControls.reload, 'reloadFixedPoint'"],
    ]);
  });

  it('binds the shared fault, coordinator, and convergence witnesses', () => {
    proveEachMarkerRequired(evidenceOwner, [
      ['operation digest', "const arc0LandingOperationPattern = /^arc0[.]land:[0-9a-f]{64}$/u;"],
      ['fault witness schema', "fault?.schema === 'cf-v2-arc0-landing-fault-witness/v1'"],
      ['fault operation', 'arc0LandingOperationPattern.test(fault?.operation ?? \'\')'],
      ['fault injection', 'fault?.injection === injection'],
      ['settled fault phase', "fault?.phase === 'settled'"],
      ['before revision witness', 'fault?.beforeRevision === evidence?.fixture?.raw?.revision'],
      ['fault outcome', 'fault?.outcome === outcome'],
      ['landing diagnostics schema', "landing?.schema === 'cf-v2-arc0-landing-app-state/v1'"],
      ['coordinator not in flight', 'coordinator?.inFlight === false'],
      ['coordinator schema', "coordinator?.owner?.schema === 'cf-v2-product-action-coordinator-diagnostics/v1'"],
      ['coordinator owner idle', 'coordinator.owner.busy === false && coordinator.owner.operation === null'],
      ['one-shot latches clear', 'Object.values(coordinator?.faultArmed ?? {}).every((value) => value === false)'],
      ['hold mutation fence', "state?.persistence?.hold === 'transient-read'"],
      ['held mutation blocked', 'state?.persistence?.mutationBlocked === true'],
      ['held reload scheduled', 'state?.persistence?.convergenceReloadScheduled === true'],
      ['held reload phase', "state?.persistence?.convergenceReloadHold?.phase === 'holding'"],
      ['held runtime unanswerable', 'state?.persistence?.runtime?.answerable === false'],
      ['new document token', 'evidence?.reloadedReady?.token !== evidence?.beforeToken'],
      ['reloaded heartbeat settled', 'evidence?.reloadedHeartbeat?.cycleSettled === true'],
      ['reloaded heartbeat token', 'evidence?.reloadedHeartbeat?.documentToken === evidence?.reloadedReady?.token'],
      ['clean current-v5 boot', "state?.persistence?.bootKind === 'current-v5'"],
      ['zero reload commits', 'state?.persistence?.runtime?.commits === 0'],
      ['clean reload landing outcome', 'state?.landing?.lastOutcome === null'],
      ['surface saved route', 'arc4PertarSavedPlanetRouteExact(state)'],
      ['source saved route', ': arc4PertarSourceRouteExact(state) && arc4PertarSavedStarRouteExact(state);'],
      ['one release witness', 'evidence?.convergenceWitnessCount === 1'],
      ['convergence witness schema', "witness?.schema === 'cf-v2-f4-authority-convergence/v1'"],
      ['released witness status', "witness?.status === 'released'"],
      ['exact release detail', 'witness?.detail === detail'],
      ['old document witness', 'witness?.documentToken === evidence?.beforeToken'],
      ['authority revision tuple', 'runtime?.revision === raw?.revision'],
      ['authority seed tuple', 'runtime?.sessionSeed === authority?.seed'],
      ['authority ordinal tuple', 'runtime?.sessionOrdinal === authority?.ordinal'],
      ['authority draw tuple', 'canonicalJson(runtime?.sessionDraws) === canonicalJson(authority?.draws)'],
      ['stale lifecycle', "const beforeLifecycle = scenario === 'stale'"],
      ['released lifecycle', 'afterRuntime?.leaseOwned === false && afterRuntime?.leaseHeartbeat === null'],
      ['one awaited action token', 'evidence?.actionDocumentToken === evidence?.beforeToken'],
    ]);
    proveEachMarkerRequired(reloadFixedPointOwner, [
      ['reloaded heartbeat stopped', 'state?.persistence?.heartbeatRunning === false'],
      ['reloaded lease owned', 'state?.persistence?.runtime?.leaseOwned === true'],
      ['reloaded authority current', 'state?.persistence?.runtime?.staleBlocked === false'],
      ['reloaded answerable', 'state?.persistence?.runtime?.answerable === true'],
      ['reloaded accrual live', 'state?.persistence?.runtime?.accruing === true'],
    ]);
  });

  it('awaits every asynchronous landOn and landHere call before observing state', () => {
    const callPattern = /\b(?:[A-Za-z_$][\w$]*[.])+(?:landOn|landHere)\(/gu;
    const calls = [...sliceSource.matchAll(callPattern)];
    expect(calls.length).toBeGreaterThanOrEqual(10);
    const unawaited = (source: string) => [...source.matchAll(callPattern)]
      .filter((match) => source.slice(Math.max(0, match.index - 6), match.index) !== 'await ');
    expect(unawaited(sliceSource)).toEqual([]);
    calls.forEach((call, index) => {
      expect(sliceSource.slice(call.index - 6, call.index)).toBe('await ');
      const mutant = `${sliceSource.slice(0, call.index - 6)}${sliceSource.slice(call.index)}`;
      expect(unawaited(mutant), `unawaited landing mutation ${index}`).toHaveLength(1);
    });
  });
});
