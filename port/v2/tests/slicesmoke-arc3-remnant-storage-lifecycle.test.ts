import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc3RemnantRejectedSearchControl, assessArc3RemnantSkimRoutePrecondition } from '../tools/engineering-browser-contract.mjs';

const sliceSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);
const contractSource = readFileSync(
  fileURLToPath(new URL('../tools/engineering-browser-contract.mjs', import.meta.url)),
  'utf8',
);
const fourthRedCarrier = readFileSync(fileURLToPath(new URL(
  '../../../audits/ARC4_SLICE_CURRENT_INPUT_FAILURE_20260827_032748771.json.gz',
  import.meta.url,
)));

type Assessment = Readonly<{
  ok: boolean;
  checks: Readonly<Record<string, boolean>>;
  reasons: readonly string[];
}>;
type ContractClassifiers = Readonly<{
  assessArc3RemnantRejectedSearchControl: (evidence: unknown) => Assessment;
  assessArc3RemnantSkimRoutePrecondition: (evidence: unknown) => Assessment;
}>;
type AuditFinding = Readonly<{ index: number; scope: string; message: string }>;
type FourthRedAudit = Readonly<{
  schema: string;
  status: string;
  run: Readonly<{ id: string; screenshotPattern: string; provenance: string }>;
  source: Readonly<{
    commit: string;
    branch: string;
    state: string;
    statusSha256: string;
    workingTreeSha256: string;
  }>;
  sourceChange: Readonly<{ detected: boolean; ending: unknown }>;
  browser: Readonly<{ executable: string; version: string; resolutionError: unknown }>;
  retryPolicy: Readonly<{ automaticRetries: number; reason: string }>;
  summary: Readonly<{ findingCount: number; scopeCount: number }>;
  rawLog: Readonly<{ path: string; bytes: number; sha256: string }>;
  findings: readonly AuditFinding[];
}>;

const contractClassifiers: ContractClassifiers = {
  assessArc3RemnantRejectedSearchControl,
  assessArc3RemnantSkimRoutePrecondition,
};
const fourthRedAudit = JSON.parse(
  gunzipSync(fourthRedCarrier).toString('utf8'),
) as FourthRedAudit;

type Field = readonly [label: string, target: string];
type OrderRule = Readonly<{ label: string; first: string; second: string }>;

const occurrences = (source: string, target: string): number => source.split(target).length - 1;

function section(source: string, start: string, end: string): string {
  expect(occurrences(source, start), `unique owner start: ${start}`).toBe(1);
  expect(occurrences(source, end), `unique owner end: ${end}`).toBe(1);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  return source.slice(left, right);
}

function fieldErrors(owner: string, fields: readonly Field[]): string[] {
  return fields.flatMap(([label, target]) => {
    const count = occurrences(owner, target);
    return count === 1 ? [] : [`${label}: expected one owner field, got ${count}`];
  });
}

function orderErrors(owner: string, rules: readonly OrderRule[]): string[] {
  return rules.flatMap(({ label, first, second }) => {
    const firstCount = occurrences(owner, first);
    const secondCount = occurrences(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      return [`${label}: non-unique order fields (${firstCount}, ${secondCount})`];
    }
    return owner.indexOf(first) < owner.indexOf(second) ? [] : [`${label}: reversed`];
  });
}

function swapUnique(owner: string, first: string, second: string, index: number): string {
  expect(occurrences(owner, first)).toBe(1);
  expect(occurrences(owner, second)).toBe(1);
  const marker = `__ARC3_REMNANT_STORAGE_ORDER_${index}__`;
  expect(owner).not.toContain(marker);
  return owner.replace(first, marker).replace(second, first).replace(marker, second);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Record<string, unknown>;
}

function findingPayload(scope: string): Record<string, unknown> {
  const matches = fourthRedAudit.findings.filter((finding) => finding.scope === scope);
  if (matches.length !== 1) throw new Error(`${scope} finding cardinality is ${matches.length}`);
  const finding = matches[0];
  if (!finding) throw new Error(`${scope} finding is unavailable`);
  const payloadStart = finding.message.indexOf('{');
  if (payloadStart < 0) throw new Error(`${scope} finding has no JSON payload`);
  return record(JSON.parse(finding.message.slice(payloadStart)), `${scope} payload`);
}

function fourthRedEvidence(): Readonly<{
  fullPrecision: Record<string, unknown>;
  rounded: Record<string, unknown>;
  remnant: Record<string, unknown>;
}> {
  const rejected = findingPayload('arc-3-remnant-search-controls-failed');
  const stellar = findingPayload('arc-3-stellar-skim');
  return {
    fullPrecision: record(
      record(rejected.legacyRemnantFullPrecision, 'full-precision row').evidence,
      'full-precision evidence',
    ),
    rounded: record(
      record(rejected.legacyRemnantRoundedBlocked, 'rounded row').evidence,
      'rounded evidence',
    ),
    remnant: record(stellar.remnantRouteEvidence, 'remnant route evidence'),
  };
}

function projectedRoute(value: unknown, label: string): Record<string, unknown> {
  const route = record(value, label);
  if (Object.hasOwn(route, 'epoch')) throw new Error(`${label} unexpectedly already owns epoch`);
  const receipt = record(route.renderedScene, `${label} rendered receipt`);
  if (!Number.isSafeInteger(receipt.ecologyEpoch) || Number(receipt.ecologyEpoch) < 0) {
    throw new Error(`${label} rendered receipt has no valid ecology epoch`);
  }
  return route;
}

function routeWithReceiptEpoch(route: Record<string, unknown>): Record<string, unknown> {
  const receipt = record(route.renderedScene, 'projected route rendered receipt');
  return { ...structuredClone(route), epoch: receipt.ecologyEpoch };
}

function expectOnlyAddedReceiptEpoch(
  original: Record<string, unknown>, enriched: Record<string, unknown>,
): void {
  expect(Object.keys(enriched).sort()).toEqual([...Object.keys(original), 'epoch'].sort());
  for (const [name, value] of Object.entries(original)) expect(enriched[name]).toEqual(value);
  expect(enriched.epoch).toBe(record(
    original.renderedScene, 'original projected route receipt',
  ).ecologyEpoch);
}

function enrichedRejectedEvidence(
  originalEvidence: Record<string, unknown>,
): Readonly<{ evidence: Record<string, unknown>; routes: readonly Readonly<{
  original: Record<string, unknown>; enriched: Record<string, unknown>;
}>[] }> {
  const evidence = structuredClone(originalEvidence);
  const before = record(evidence.before, 'rejected before');
  const after = record(evidence.after, 'rejected after');
  const beforeRoute = projectedRoute(before.route, 'rejected before route');
  const afterRoute = projectedRoute(after.route, 'rejected after route');
  const enrichedBeforeRoute = routeWithReceiptEpoch(beforeRoute);
  const enrichedAfterRoute = routeWithReceiptEpoch(afterRoute);
  evidence.before = { ...before, route: enrichedBeforeRoute };
  evidence.after = { ...after, route: enrichedAfterRoute };
  return { evidence, routes: [
    { original: beforeRoute, enriched: enrichedBeforeRoute },
    { original: afterRoute, enriched: enrichedAfterRoute },
  ] };
}

function enrichedRemnantEvidence(
  originalEvidence: Record<string, unknown>,
): Readonly<{ evidence: Record<string, unknown>; route: Readonly<{
  original: Record<string, unknown>; enriched: Record<string, unknown>;
}> }> {
  const evidence = structuredClone(originalEvidence);
  const preRoute = projectedRoute(evidence.preRoute, 'remnant preRoute');
  const enrichedPreRoute = routeWithReceiptEpoch(preRoute);
  evidence.preRoute = enrichedPreRoute;
  return { evidence, route: { original: preRoute, enriched: enrichedPreRoute } };
}

function withCurrentShipyardPreviewIdentity(
  originalEvidence: Record<string, unknown>,
): Record<string, unknown> {
  const evidence = structuredClone(originalEvidence);
  const current = record(evidence.current, 'remnant current route');
  const shipVisual = record(current.shipVisual, 'remnant ship visual');
  const surface = record(evidence.surface, 'remnant Shipyard surface');
  const diagnostics = record(surface.diagnostics, 'remnant Shipyard diagnostics');
  const engineering = record(diagnostics.engineering, 'remnant Engineering diagnostics');
  surface.previewStateKeys = [shipVisual.stateKey];
  diagnostics.stateKey = shipVisual.stateKey;
  engineering.previewStateKey = shipVisual.stateKey;
  return evidence;
}

function expectOnlyNamedCheckRed(assessment: Assessment, expected: string): void {
  expect(assessment.ok).toBe(false);
  expect(assessment.checks[expected]).toBe(false);
  expect(Object.entries(assessment.checks).filter(([, value]) => value !== true))
    .toEqual([[expected, false]]);
}

function expectAllChecksGreen(assessment: Assessment): void {
  expect(assessment.ok).toBe(true);
  expect(assessment.reasons).toEqual([]);
  expect(Object.keys(assessment.checks).length).toBeGreaterThan(0);
  expect(Object.values(assessment.checks).every((value) => value === true)).toBe(true);
}

const contractOwner = section(
  contractSource,
  'const ENGINEERING_POST_LIFECYCLE_SOURCE_ORACLE = Object.freeze({',
  '/* Pure no-optimism evidence owner shared by Slice and this module',
);
const selftestOwner = section(
  contractSource,
  "const encodeRouteSelftestCode = (target) => 'CF1-'",
  'if (ENGINEERING_RESEARCH_IDS.length !== 6',
);
const routeProjectionOwner = section(
  sliceSource,
  'const arc3RemnantRouteProjection = (state) => ({',
  'const STALE_SAVED_ROUTE_RAW = (() => {',
);
const remnantOwner = section(
  sliceSource,
  "  const engineeringRouteClose = await closeEngineeringPanel('Arc 3 route to remnant');",
  '  const engineeringReloadPrecondition = skimCommitPrecondition && skimAssessment.ok;',
);
const storageOwner = section(
  sliceSource,
  '  const biomeReloadObservation = await waitDesktopValue(',
  '  const staleBeforeToken = await sliceToken(sess);',
);
const f4OutcomeOwner = section(
  sliceSource,
  '  /* F4 app-level storage failure. Hold only the already-scheduled convergence',
  '  /* 5. zero console errors / exceptions across the whole run */',
);

const CONTRACT_FIELDS = [
  ['exact biome-system identity',
    'route.star === 380168149 && route.starX === 347.25 && route.starY === 24.8'],
  ['exact system/no-world shape',
    "route.mode === 'system'\n    && route.gal === 999"],
  ['exact null planet', 'route.planet === null && route.planetOrdinal === null'],
  ['exact biome key', "starKey: 'CF1|g:999@90,-60|s:380168149@347.25,24.8'"],
  ['exact six-key receipt',
    "=== 'ecologyEpoch,galaxyKey,mode,serial,starKey,worldKey'"],
  ['receipt epoch coherence', 'receipt.mode === mode && receipt.ecologyEpoch === ecologyEpoch'],
  ['closed panel/card source', 'route.panelOpen === null && route.cardOpen === false'],
  ['owned Stage-1 Jump Drive source',
    "canonicalToolJson(route.shipVisual?.installedSystemIds) === canonicalToolJson(['jumpdrive'])"],
  ['rejected-route preservation',
    'exactRoute: canonicalToolJson(after?.route) === canonicalToolJson(before?.route)'],
  ['rejected source oracle', 'source: exactPostLifecycleBiomeSystemSource(before?.route)'],
  ['Skim preRoute oracle', 'preRoute: exactPostLifecycleBiomeSystemSource(preRoute)'],
  ['current receipt epoch', 'mode: \'system\', ecologyEpoch: current?.epoch,'],
  ['nonempty Shipyard app preview identity',
    "typeof previewStateKey === 'string' && previewStateKey.length > 0"],
  ['exact Shipyard DOM preview identity',
    'canonicalToolJson(surface?.previewStateKeys) === canonicalToolJson([previewStateKey])'],
  ['exact Shipyard outer preview identity',
    'diagnostics?.stateKey === previewStateKey'],
  ['exact Shipyard preview identity',
    'engineering?.previewStateKey === previewStateKey'],
] as const satisfies readonly Field[];

const SELFTEST_FIELDS = [
  ['live hidden title witness', "cardTitle: 'Oska'"],
  ['old Mars negative', 'preRoute: remnantRouteSelftestOldMarsRoute'],
  ['wrong biome identity', 'preRoute: { ...remnantRouteSelftestPreRoute, star: 380168150 }'],
  ['wrong biome key',
    "navStarKey: 'CF1|g:999@90,-60|s:380168149@347.25,24.81'"],
  ['missing route epoch', 'delete remnantRouteWithoutEpoch.epoch;'],
  ['missing pre receipt epoch',
    'delete remnantRouteWithoutReceiptEpoch.renderedScene.ecologyEpoch;'],
  ['missing current receipt epoch',
    'delete remnantCurrentWithoutReceiptEpoch.renderedScene.ecologyEpoch;'],
  ['wrong pre receipt epoch',
    'renderedScene: { ...remnantRouteSelftestPreRoute.renderedScene, ecologyEpoch: 13 }'],
  ['wrong current epoch',
    'current: { ...remnantRouteSelftestEvidence.current, epoch: 13 }'],
  ['real rejected-route drift',
    'starX: rejectedRouteFullPrecisionEvidence.after.route.starX + 1'],
  ['Shipyard app identity negative control',
    "stateKey: 'ship:v1:remnant-app-control-mismatch'"],
  ['Shipyard outer identity negative control',
    "stateKey: 'ship:v1:remnant-outer-control-mismatch'"],
  ['Shipyard inner identity negative control',
    "previewStateKey: 'ship:v1:remnant-inner-control-mismatch'"],
  ['Shipyard DOM identity negative control',
    "previewStateKeys: ['ship:v1:remnant-dom-control-mismatch']"],
  ['Shipyard four-way missing-identity negative control',
    'evidence.surface.previewStateKeys = [];'],
] as const satisfies readonly Field[];

const SLICE_GLOBAL_FIELDS = [
  ['projected ecology epoch', 'epoch: state?.epoch ?? null,'],
] as const satisfies readonly Field[];

const REMNANT_SEARCH_FAIL_CALL =
  "failSliceWithoutCascade('ARC 3 REMNANT SEARCH CONTROLS FAILED";

const REMNANT_FIELDS = [
  ['real rejected-route drift', 'starX: evidence.after.route.starX + 1'],
  ['rejected-search fail-fast', REMNANT_SEARCH_FAIL_CALL],
  ['positive-control gate', 'if (remnantRouteAssessment.ok) {'],
  ['old Mars live control', 'oldMarsPreRoute: assessArc3RemnantSkimRoutePrecondition'],
  ['biome identity live control', 'biomeIdentityDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['biome key live control', 'biomeKeyDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['missing pre epoch live control', 'missingPreEpoch: assessArc3RemnantSkimRoutePrecondition'],
  ['missing receipt epoch live control',
    'missingCurrentReceiptEpoch: assessArc3RemnantSkimRoutePrecondition'],
  ['wrong receipt epoch live control',
    'wrongCurrentReceiptEpoch: assessArc3RemnantSkimRoutePrecondition'],
  ['Shipyard app diagnostics live control',
    'diagnosticsAppKeyDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['Shipyard outer diagnostics live control',
    'diagnosticsOuterKeyDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['Shipyard inner diagnostics live control',
    'diagnosticsInnerKeyDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['Shipyard DOM diagnostics live control',
    'diagnosticsDomKeyDrift: assessArc3RemnantSkimRoutePrecondition'],
  ['Shipyard four-way missing diagnostics live control',
    'diagnosticsFourWayIdentityMissing: assessArc3RemnantSkimRoutePrecondition'],
  ['pre-Skim fail-fast',
    "failSliceWithoutCascade('ARC 3 REMNANT ROUTE/PRECONDITION CONTROL FAILED"],
] as const satisfies readonly Field[];

const STORAGE_LIFECYCLE_FAIL_CALL =
  "failSliceWithoutCascade('ARC 3 RELOADED SURVEY/STORAGE LIFECYCLE";
const STORAGE_TARGET_READY_FAIL_CALL =
  "failSliceWithoutCascade('ARC 3 STORAGE PRECONDITION: native Plate target was not ready before";
const STORAGE_TERMINAL_FAIL_CALL = 'failSliceWithoutCascade(storageTerminalFailure);';
const STORAGE_CONTROL_FAIL_CALL = "failSliceWithoutCascade('ARC 3 STORAGE CONTROLS FAILED";
const STORAGE_OPEN_CALL = "const storageOpen = await openEngineeringPanel('ARC 3 STORAGE CONTROL');";
const STORAGE_HOOK_ARM_CALL =
  'const storageArmed = await evalIn(`window.__CF_SLICE__.api.__smokeRejectNextArc3ActionStorage()`);';
const STALE_PATH_CALL = 'const staleBeforeToken = await sliceToken(sess);';

const STORAGE_FIELDS = [
  ['reload proof fail-fast', "failSliceWithoutCascade('ARC 3 BIOME SURVEY RELOAD"],
  ['trusted reload Close',
    "const biomeReloadStorageClose = await pressArc3SurveyLifecyclePointer('close');"],
  ['closed lifecycle assessment',
    'const biomeReloadStorageCloseAssessment = assessArc3SurveyClosedRailLifecycle('],
  ['positive lifecycle-control gate',
    'const biomeReloadStorageCloseControls = biomeReloadStorageCloseAssessment.ok ? {'],
  ['trusted Close mutant', 'omittedClose: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card mutant', 'staleCard: assessArc3SurveyClosedRailLifecycle'],
  ['body-release mutant', 'staleBody: assessArc3SurveyClosedRailLifecycle'],
  ['Survey ARIA mutant', 'staleSurvey: assessArc3SurveyClosedRailLifecycle'],
  ['dock ARIA mutant', 'expandedDock: assessArc3SurveyClosedRailLifecycle'],
  ['right-rail mutant', 'hiddenRail: assessArc3SurveyClosedRailLifecycle'],
  ['route mutant', 'routeDrift: assessArc3SurveyClosedRailLifecycle'],
  ['durable read-only mutant', 'durableDrift: assessArc3SurveyClosedRailLifecycle'],
  ['lifecycle fail-fast', STORAGE_LIFECYCLE_FAIL_CALL],
  ['Storage opener', STORAGE_OPEN_CALL],
  ['Storage opener guard', "failSliceWithoutCascade('ARC 3 STORAGE OPEN"],
  ['pre-arm target readiness',
    "const storageTargetReady = await readEngineeringKeyboardTarget('fabricate', 'plate');"],
  ['pre-arm target guard', STORAGE_TARGET_READY_FAIL_CALL],
  ['storage hook arm', STORAGE_HOOK_ARM_CALL],
  ['post-arm native action',
    "const storageTarget = await pressEngineeringKeyboard('fabricate', 'plate');"],
  ['terminal fail-fast', STORAGE_TERMINAL_FAIL_CALL],
  ['control fail-fast', STORAGE_CONTROL_FAIL_CALL],
  ['Storage live DOM preview capture',
    'const storageAfterPreviewStateKeys = await captureStorageTerminal('],
  ['Storage live DOM preview evidence',
    'afterPreviewStateKeys: storageAfterPreviewStateKeys'],
  ['Storage app preview identity control',
    'previewAppIdentity: assessArc3StorageRefusal'],
  ['Storage outer preview identity control',
    'previewOuterIdentity: assessArc3StorageRefusal'],
  ['Storage inner preview identity control',
    'previewInnerIdentity: assessArc3StorageRefusal'],
  ['Storage DOM preview identity control',
    'previewDomIdentity: assessArc3StorageRefusal'],
  ['Storage four-way missing preview identity control',
    'previewFourWayIdentityMissing: assessArc3StorageRefusal'],
] as const satisfies readonly Field[];

const REMNANT_ORDER = [
  {
    label: 'rejected Search fail call -> remnant route',
    first: REMNANT_SEARCH_FAIL_CALL,
    second: 'const remnantPreRouteState = await evalIn(`window.__CF_SLICE__.api.state()`);',
  },
  {
    label: 'route verdict -> positive controls',
    first: 'const remnantRouteAssessment = assessArc3RemnantSkimRoutePrecondition(remnantRouteEvidence);',
    second: 'if (remnantRouteAssessment.ok) {',
  },
  {
    label: 'precondition fail-fast -> Skim evidence',
    first: "failSliceWithoutCascade('ARC 3 REMNANT ROUTE/PRECONDITION CONTROL FAILED",
    second: "let skimBeforeState = remnantState && typeof remnantState === 'object'",
  },
] as const satisfies readonly OrderRule[];

const STORAGE_ORDER = [
  {
    label: 'reload Survey -> real Close',
    first: 'const biomeReloadAssessment = assessArc3OrbitalSurvey({',
    second: "const biomeReloadStorageClose = await pressArc3SurveyLifecyclePointer('close');",
  },
  {
    label: 'real Close -> lifecycle assessment',
    first: "const biomeReloadStorageClose = await pressArc3SurveyLifecyclePointer('close');",
    second: 'const biomeReloadStorageCloseAssessment = assessArc3SurveyClosedRailLifecycle(',
  },
  {
    label: 'lifecycle fail call -> Storage opener',
    first: STORAGE_LIFECYCLE_FAIL_CALL,
    second: STORAGE_OPEN_CALL,
  },
  {
    label: 'Storage opener guard -> target readiness',
    first: "failSliceWithoutCascade('ARC 3 STORAGE OPEN",
    second: "const storageTargetReady = await readEngineeringKeyboardTarget('fabricate', 'plate');",
  },
  {
    label: 'target-readiness fail call -> hook arm',
    first: STORAGE_TARGET_READY_FAIL_CALL,
    second: STORAGE_HOOK_ARM_CALL,
  },
  {
    label: 'hook arm -> native action',
    first: STORAGE_HOOK_ARM_CALL,
    second: "const storageTarget = await pressEngineeringKeyboard('fabricate', 'plate');",
  },
  {
    label: 'terminal fail call -> storage-control fail call',
    first: STORAGE_TERMINAL_FAIL_CALL,
    second: STORAGE_CONTROL_FAIL_CALL,
  },
] as const satisfies readonly OrderRule[];

const STORAGE_STALE_BOUNDARY_ORDER = [
  {
    label: 'terminal storage red -> stale path boundary',
    first: STORAGE_TERMINAL_FAIL_CALL,
    second: STALE_PATH_CALL,
  },
  {
    label: 'storage-control red -> stale path boundary',
    first: STORAGE_CONTROL_FAIL_CALL,
    second: STALE_PATH_CALL,
  },
] as const satisfies readonly OrderRule[];

describe('Slice Arc 3 remnant and Storage lifecycle harness', () => {
  it('binds the exact preserved fourth-red carrier and signed source provenance', () => {
    expect(createHash('sha256').update(fourthRedCarrier).digest('hex')).toBe(
      'c34bd6fa26f417d664291c206facc8cfe604123166986553a1638570bd652ac2',
    );
    expect(fourthRedAudit.schema).toBe('cf-v2-slice-smoke-ci/v1');
    expect(fourthRedAudit.status).toBe('fail');
    expect(fourthRedAudit.run).toEqual({
      id: '20260827032748771-8092-d2a0130882c1',
      screenshotPattern: 'apps/game/smoke/slice-20260827032748771-8092-d2a0130882c1-*.png',
      provenance: 'Only PNGs bearing this cryptographically unique child-run ID are attributed to this execution.',
    });
    expect(fourthRedAudit.source).toEqual({
      commit: 'bd6b06baa2511c859a4bc227b1a8736b2097fc9d',
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
    });
    expect(fourthRedAudit.sourceChange).toEqual({ detected: false, ending: null });
    expect(fourthRedAudit.browser).toEqual({
      executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      version: 'Microsoft Edge 151.0.4129.107',
      resolutionError: null,
    });
    expect(fourthRedAudit.retryPolicy.automaticRetries).toBe(0);
    expect(fourthRedAudit.summary).toEqual({ findingCount: 6, scopeCount: 6 });
    expect(fourthRedAudit.rawLog).toEqual({
      path: 'apps/game/smoke/slice-smoke.log',
      bytes: 633427,
      sha256: '504060415fab5800acc110b5833956aa0acac0cdfe43f3617b99432584d9c05e',
    });
    expect(fourthRedAudit.findings.map(({ index, scope }) => ({ index, scope }))).toEqual([
      { index: 0, scope: 'arc-3-remnant-search-controls-failed' },
      { index: 1, scope: 'arc-3-remnant-route-diagnostic-control-failed' },
      { index: 2, scope: 'arc-3-stellar-skim' },
      { index: 3, scope: 'arc-3-storage-control' },
      { index: 4, scope: 'arc-3-storage-settlement-timeout' },
      { index: 5, scope: 'harness' },
    ]);
  });

  it('replays the three original projected routes red only at absent top-level epoch ownership', () => {
    const evidence = fourthRedEvidence();
    for (const [label, rejected] of [
      ['full-precision Search', evidence.fullPrecision],
      ['rounded blocked Search', evidence.rounded],
    ] as const) {
      const before = record(rejected.before, `${label} before`);
      const after = record(rejected.after, `${label} after`);
      const beforeRoute = projectedRoute(before.route, `${label} before route`);
      const afterRoute = projectedRoute(after.route, `${label} after route`);
      expect(record(beforeRoute.renderedScene, `${label} before receipt`).ecologyEpoch).toBe(12);
      expect(record(afterRoute.renderedScene, `${label} after receipt`).ecologyEpoch).toBe(12);
      expectOnlyNamedCheckRed(
        contractClassifiers.assessArc3RemnantRejectedSearchControl(rejected),
        'source',
      );
    }
    const currentRemnant = withCurrentShipyardPreviewIdentity(evidence.remnant);
    const preRoute = projectedRoute(currentRemnant.preRoute, 'remnant preRoute');
    expect(record(preRoute.renderedScene, 'remnant preRoute receipt').ecologyEpoch).toBe(12);
    const current = record(evidence.remnant.current, 'remnant current route');
    expect(current.epoch).toBe(12);
    expect(record(current.renderedScene, 'remnant current receipt').ecologyEpoch).toBe(12);
    expectOnlyNamedCheckRed(
      contractClassifiers.assessArc3RemnantSkimRoutePrecondition(currentRemnant),
      'preRoute',
    );
  });

  it('adds only each preserved receipt epoch and replays both Searches plus remnant fully green', () => {
    const original = fourthRedEvidence();
    const fullPrecision = enrichedRejectedEvidence(original.fullPrecision);
    const rounded = enrichedRejectedEvidence(original.rounded);
    const remnant = enrichedRemnantEvidence(withCurrentShipyardPreviewIdentity(original.remnant));
    for (const { original: route, enriched } of [
      ...fullPrecision.routes, ...rounded.routes, remnant.route,
    ]) expectOnlyAddedReceiptEpoch(route, enriched);
    expectAllChecksGreen(
      contractClassifiers.assessArc3RemnantRejectedSearchControl(fullPrecision.evidence),
    );
    expectAllChecksGreen(
      contractClassifiers.assessArc3RemnantRejectedSearchControl(rounded.evidence),
    );
    expectAllChecksGreen(
      contractClassifiers.assessArc3RemnantSkimRoutePrecondition(remnant.evidence),
    );
    const previewMismatch = structuredClone(remnant.evidence);
    const previewSurface = record(previewMismatch.surface, 'preview mismatch surface');
    const previewDiagnostics = record(previewSurface.diagnostics, 'preview mismatch diagnostics');
    record(previewDiagnostics.engineering, 'preview mismatch engineering').previewStateKey =
      'ship:v1:remnant-control-mismatch';
    expectOnlyNamedCheckRed(
      contractClassifiers.assessArc3RemnantSkimRoutePrecondition(previewMismatch),
      'diagnostics',
    );
    const domMismatch = structuredClone(remnant.evidence);
    record(domMismatch.surface, 'DOM mismatch surface').previewStateKeys = [
      'ship:v1:remnant-dom-control-mismatch',
    ];
    expectOnlyNamedCheckRed(
      contractClassifiers.assessArc3RemnantSkimRoutePrecondition(domMismatch),
      'diagnostics',
    );
    const missingFourWayPreviewIdentity = structuredClone(remnant.evidence);
    const missingCurrent = record(
      missingFourWayPreviewIdentity.current,
      'missing-identity current',
    );
    delete record(missingCurrent.shipVisual, 'missing-identity ship visual').stateKey;
    const missingSurface = record(
      missingFourWayPreviewIdentity.surface,
      'missing-identity surface',
    );
    missingSurface.previewStateKeys = [];
    const missingDiagnostics = record(
      missingSurface.diagnostics,
      'missing-identity diagnostics',
    );
    delete missingDiagnostics.stateKey;
    delete record(
      missingDiagnostics.engineering,
      'missing-identity Engineering diagnostics',
    ).previewStateKey;
    expectOnlyNamedCheckRed(
      contractClassifiers.assessArc3RemnantSkimRoutePrecondition(missingFourWayPreviewIdentity),
      'diagnostics',
    );
    expect(Object.hasOwn(
      record(record(original.fullPrecision.before, 'original full before').route,
        'original full before route'),
      'epoch',
    )).toBe(false);
    expect(Object.hasOwn(record(original.remnant.preRoute, 'original remnant preRoute'), 'epoch'))
      .toBe(false);
  });

  it('owns one exact current source/receipt contract without binding the hidden title', () => {
    expect(fieldErrors(contractOwner, CONTRACT_FIELDS)).toEqual([]);
    expect(contractOwner).not.toContain('route.cardTitle');
    expect(occurrences(f4OutcomeOwner, 'JSON.stringify(ENGINEERING_VETERAN_RAW)')).toBe(2);
    expect(f4OutcomeOwner).not.toContain('JSON.stringify(VETERAN_RAW)');
  });

  it('keeps every source and epoch selftest control present and non-vacuous', () => {
    expect(fieldErrors(selftestOwner, SELFTEST_FIELDS)).toEqual([]);
    expect(selftestOwner).not.toContain(
      'route: { ...rejectedRouteFullPrecisionEvidence.after.route, planet: null }',
    );
  });

  it('makes every contract/selftest field deletion a focused source red', () => {
    for (const [index, [label, target]] of [...CONTRACT_FIELDS, ...SELFTEST_FIELDS].entries()) {
      const owner = index < CONTRACT_FIELDS.length ? contractOwner : selftestOwner;
      const fields = index < CONTRACT_FIELDS.length ? CONTRACT_FIELDS : SELFTEST_FIELDS;
      const marker = `__ARC3_CONTRACT_FIELD_${index}__`;
      const mutant = owner.replace(target, marker);
      expect(mutant, label).not.toBe(owner);
      expect(fieldErrors(mutant, fields), label).toContain(
        `${label}: expected one owner field, got 0`,
      );
    }
  });

  it('keeps remnant controls gated green and fail-fast before dependent Skim work', () => {
    expect(fieldErrors(routeProjectionOwner, SLICE_GLOBAL_FIELDS)).toEqual([]);
    expect(fieldErrors(remnantOwner, REMNANT_FIELDS)).toEqual([]);
    expect(orderErrors(remnantOwner, REMNANT_ORDER)).toEqual([]);
  });

  it('keeps reload Survey -> Close -> lifecycle -> guarded Storage order exact', () => {
    expect(fieldErrors(storageOwner, STORAGE_FIELDS)).toEqual([]);
    expect(orderErrors(storageOwner, STORAGE_ORDER)).toEqual([]);
    expect(orderErrors(sliceSource, STORAGE_STALE_BOUNDARY_ORDER)).toEqual([]);
    expect(storageOwner).not.toContain("fails.push('ARC 3 STORAGE");
  });

  it('makes each Slice owner field deletion and each order reversal focused red', () => {
    for (const [index, [label, target]] of SLICE_GLOBAL_FIELDS.entries()) {
      const marker = `__ARC3_SLICE_GLOBAL_${index}__`;
      const mutant = routeProjectionOwner.replace(target, marker);
      expect(mutant, label).not.toBe(routeProjectionOwner);
      expect(fieldErrors(mutant, SLICE_GLOBAL_FIELDS), label).toContain(
        `${label}: expected one owner field, got 0`,
      );
    }
    const fieldOwners: ReadonlyArray<readonly [string, readonly Field[]]> = [
      [remnantOwner, REMNANT_FIELDS],
      [storageOwner, STORAGE_FIELDS],
    ];
    for (const [ownerIndex, [owner, fields]] of fieldOwners.entries()) {
      for (const [fieldIndex, [label, target]] of fields.entries()) {
        const marker = `__ARC3_SLICE_FIELD_${ownerIndex}_${fieldIndex}__`;
        const mutant = owner.replace(target, marker);
        expect(mutant, label).not.toBe(owner);
        expect(fieldErrors(mutant, fields), label).toContain(
          `${label}: expected one owner field, got 0`,
        );
      }
    }
    const orderOwners: ReadonlyArray<readonly [string, readonly OrderRule[]]> = [
      [remnantOwner, REMNANT_ORDER],
      [storageOwner, STORAGE_ORDER],
    ];
    for (const [ownerIndex, [owner, rules]] of orderOwners.entries()) {
      for (const [ruleIndex, rule] of rules.entries()) {
        const mutant = swapUnique(owner, rule.first, rule.second, ownerIndex * 10 + ruleIndex);
        expect(orderErrors(mutant, rules), rule.label).toContain(`${rule.label}: reversed`);
      }
    }
    for (const [ruleIndex, rule] of STORAGE_STALE_BOUNDARY_ORDER.entries()) {
      const mutant = swapUnique(sliceSource, rule.first, rule.second, 100 + ruleIndex);
      expect(orderErrors(mutant, STORAGE_STALE_BOUNDARY_ORDER), rule.label)
        .toContain(`${rule.label}: reversed`);
    }
  });

  it('rejects moving the epoch field to an unrelated projection despite whole-file cardinality one', () => {
    const [epochField] = SLICE_GLOBAL_FIELDS;
    if (!epochField) throw new Error('projected ecology epoch field is unavailable');
    const [label, target] = epochField;
    const surveyProjectionStart = 'const arc3SurveyRouteProjection = (state) => ({';
    expect(occurrences(sliceSource, surveyProjectionStart)).toBe(1);
    const movedSource = sliceSource
      .replace(target, '')
      .replace(surveyProjectionStart, `${surveyProjectionStart}\n  ${target}`);
    expect(occurrences(movedSource, target), label).toBe(1);
    const movedOwner = section(
      movedSource,
      'const arc3RemnantRouteProjection = (state) => ({',
      'const STALE_SAVED_ROUTE_RAW = (() => {',
    );
    expect(fieldErrors(movedOwner, SLICE_GLOBAL_FIELDS), label).toContain(
      `${label}: expected one owner field, got 0`,
    );
  });
});
