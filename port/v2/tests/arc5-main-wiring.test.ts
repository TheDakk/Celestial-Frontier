import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  importSaveV2,
  prepareArc5OwnershipMigration,
  readArc5OwnershipMigration,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  applyArc5BootLiveProjection,
  captureArc5BootLiveProjection,
  classifyArc5TrainingBootGate,
  runArc5BootRuntimeGate,
} from '../apps/game/src/arc5-boot-runtime-gate.js';
import {
  prepareArc4AppBootstrap,
  stageArc4BootstrapLegacyProjection,
} from '../apps/game/src/arc4-capture-action.js';

beforeAll(() => installCaptureHooks());

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`source section is missing: ${startText}`);
  const body = source.slice(start, end);
  if (body.length === 0 || body.split(needle).length !== 2) {
    throw new Error(`source section must contain one nonempty mutation target: ${needle}`);
  }
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

function bootErrors(source: string): string[] {
  const errors: string[] = [];
  for (const needle of [
    'let arc5OwnershipState: OwnershipStateV2 | null = null;',
    'let arc5OwnershipEvidence: Arc5OwnershipMigrationEvidence | null = null;',
    'let arc5OwnershipBootstrapPrepared: PreparedArc5OwnershipMigrationV2 | null = null;',
    'let arc5OwnershipBootstrapPending = false;',
    'let arc5OwnershipProtection: string | null = null;',
    'let lastArc5BootstrapOutcome: string | null = null;',
  ]) {
    if (!source.includes(needle)) errors.push('boot-state');
  }

  const ensure = section(
    source,
    'async function ensureBootAuthorityCommit(',
    '\nfunction f4RuntimeMayMutate(',
  );
  if (ensure.length === 0) return ['boot-ensure-section'];
  const commit = ensure.indexOf('const seeded = await runtime.commit(');
  const durable = ensure.indexOf('durable = true;', commit);
  const verify = ensure.indexOf('const loaded = committedArc5OwnershipState(', durable);
  const publish = ensure.indexOf('arc5OwnershipState = loaded.state;', verify);
  if (!ensure.includes('if (!arc5OwnershipBootstrapPending')
    || !ensure.includes('&& !arc4OwnershipBootstrapPending) return true;')) {
    errors.push('boot-pending-entry');
  }
  for (const needle of [
    'const ownershipV2BootstrapWasPending = arc5OwnershipBootstrapPending;',
    'const ownershipV2StateAtCommit = arc5OwnershipState;',
    'const ownershipV2PreparedAtCommit = arc5OwnershipBootstrapPrepared;',
    'arc5OwnershipBootstrapPending = false;',
    'arc5OwnershipBootstrapPrepared = null;',
    "arc5OwnershipProtection = durable\n          ? 'committed-publication-reload' : 'bootstrap-failed';",
  ]) {
    if (!ensure.includes(needle)) errors.push('boot-shared-authority');
  }
  if ((ensure.match(/runtime\.commit\(/gu) ?? []).length !== 1) errors.push('boot-single-cas');
  if (!(commit >= 0 && durable > commit && verify > durable && publish > verify)
    || !ensure.includes('ownershipV2PreparedAtCommit.state !== ownershipV2StateAtCommit')
    || !ensure.includes('arc5OwnershipEvidence = loaded.evidence;')) {
    errors.push('boot-postcommit-verification');
  }
  if (!ensure.includes("if (durable) {\n          arc4OwnershipState = null;\n          arc4OwnershipProtection = 'committed-publication-reload';")) {
    errors.push('boot-postcommit-convergence');
  }

  const mayMutate = section(source, 'function f4RuntimeMayMutate(', '\nfunction f4RuntimeMayAnswer(');
  const heartbeat = section(source, 'const heartbeatF4 =', '\nconst settleF4Heartbeat =');
  const show = section(source, 'const showF4 =', "\naddEventListener('pagehide'");
  if (mayMutate.length === 0 || heartbeat.length === 0 || show.length === 0
    || !mayMutate.includes('|| arc5OwnershipBootstrapPending')
    || !mayMutate.includes('|| arc4OwnershipBootstrapPending')
    || !heartbeat.includes('|| arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending')
    || !show.includes('|| arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending')) {
    errors.push('boot-lifecycle-gates');
  }

  const load = section(source, 'async function loadSave(', '\n/* ---- boot ---- */');
  const arc5 = section(
    load,
    "  /* Arc 5's compact source-bound manifest",
    '  /* A newly prepared or reconciled carrier',
  );
  if (load.length === 0 || arc5.length === 0) return [...new Set([...errors, 'boot-load-section'])];
  const arc4At = load.indexOf('const prepared = prepareArc4AppBootstrap({');
  const arc5At = load.indexOf('const prepared = prepareArc5OwnershipMigration({');
  const runtimeAt = load.indexOf('return createF4RuntimeAuthority({');
  if (!(arc4At >= 0 && arc5At > arc4At && runtimeAt > arc5At)) errors.push('boot-owner-order');
  for (const needle of [
    'arc5OwnershipState = null;',
    'arc5OwnershipEvidence = null;',
    'arc5OwnershipBootstrapPrepared = null;',
    'arc5OwnershipBootstrapPending = false;',
    'arc5OwnershipProtection = null;',
    'lastArc5BootstrapOutcome = null;',
  ]) {
    if (!load.slice(0, arc4At).includes(needle)) errors.push('boot-reset');
  }
  const trainingArc5 = section(
    arc5,
    '    if (deferredForLegacyTraining) {',
    '    } else {\n      const prepared = prepareArc5OwnershipMigration({',
  );
  const trainingRead = trainingArc5.indexOf('const existing = readArc5OwnershipMigration(');
  const trainingClassification = trainingArc5.indexOf(
    'arc5BootGateClassification = classifyArc5TrainingBootGate(existing);',
    trainingRead,
  );
  const trainingAbsent = trainingArc5.indexOf("if (existing.kind === 'absent')", trainingClassification);
  const trainingHold = trainingArc5.indexOf('holdProtectedArc5Boot(', trainingAbsent);
  if (!(trainingRead >= 0 && trainingClassification > trainingRead
    && trainingAbsent > trainingClassification && trainingHold > trainingAbsent)
    || !trainingArc5.includes(
      "existing.kind === 'future-version' ? 'future-protected' : 'corrupt-protected',",
    )) {
    errors.push('boot-training-anomaly-hold');
  }
  for (const needle of [
    "trainingSnapshotIngress.kind === 'legacy-v1'",
    "trainingSnapshotIngress.kind === 'legacy-or-unknown'",
    'const existing = readArc5OwnershipMigration(',
    'arc5BootGateClassification = classifyArc5TrainingBootGate(existing);',
    "existing.kind === 'future-version' ? 'future-protected' : 'corrupt-protected',",
    "lastArc5BootstrapOutcome = 'training-deferred';",
    'extensions: initialExtensions,',
    'arc5BootGateClassification = prepared;',
    'initialExtensions = prepared.extensions;',
    'arc5OwnershipEvidence = prepared.evidence;',
    'arc5OwnershipBootstrapPrepared = prepared;',
    'arc5OwnershipBootstrapPending = true;',
  ]) {
    if (!arc5.includes(needle)) errors.push('boot-classification');
  }
  for (const needle of [
    "arc2LootProtection = 'blocked-by-arc5-protection';",
    "arc3EngineeringProtection = 'blocked-by-arc5-protection';",
    "arc4OwnershipProtection = 'blocked-by-arc5-protection';",
    'bootRouteRepairPending = false;',
    'arc2LootBootstrapPending = false;',
    'arc3EngineeringBootstrapPending = false;',
    'arc4OwnershipBootstrapPending = false;',
    'arc5OwnershipBootstrapPending = false;',
    'bootProductBootstrapCandidate = null;',
    "persistHold = 'protected-payload';",
    "kind: 'future-protected' | 'corrupt-protected',",
    'holdProtectedArc5Boot(',
  ]) {
    if (!arc5.includes(needle)) errors.push('boot-protection-no-retry');
  }
  const protectedHold = arc5.indexOf("persistHold = 'protected-payload';");
  const runtimeGate = load.indexOf('const arc5BootGate = runArc5BootRuntimeGate({', arc5At);
  const runtimeReady = load.indexOf("if (arc5BootGate.kind === 'protected')", runtimeGate);
  const runtimeGateCall = section(
    load,
    'const arc5BootGate = runArc5BootRuntimeGate({',
    "\n  if (arc5BootGate.kind === 'protected')",
  );
  if (!(protectedHold >= 0 && runtimeGate > arc5At && runtimeAt > runtimeGate
    && runtimeReady > runtimeAt)
    || !load.includes('applyArc5BootLiveProjection(save, arc5BootGate.live);')
    || !load.includes('const runtime = arc5BootGate.runtime;')) {
    errors.push('boot-protection-before-runtime');
  }
  const exactGateArguments = [
    'classification: arc5BootGateClassification,',
    'durable: durableArc5BootLive,',
    'staged: captureArc5BootLiveProjection(save),',
    'createRuntime: () => {',
    'return createF4RuntimeAuthority({',
  ];
  const gateArgumentOffsets = exactGateArguments.map((needle) => runtimeGateCall.indexOf(needle));
  if (runtimeGateCall.length === 0
    || gateArgumentOffsets.some((offset) => offset < 0)
    || gateArgumentOffsets.some((offset, index) => index > 0
      && offset <= gateArgumentOffsets[index - 1]!)
    || exactGateArguments.some((needle) => (
      runtimeGateCall.split(needle).length !== 2
    ))
    || load.indexOf('const durableArc5BootLive = captureArc5BootLiveProjection(save);') < 0
    || load.indexOf('const durableArc5BootLive = captureArc5BootLiveProjection(save);') > arc4At) {
    errors.push('boot-runtime-gate-binding');
  }
  if (!load.includes('|| arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending)')) {
    errors.push('boot-initial-lease-gate');
  }
  if (!load.includes("arc5OwnershipProtection ||= 'bootstrap-failed';")) {
    errors.push('boot-outer-cleanup');
  }
  return [...new Set(errors)];
}

function trainingErrors(source: string): string[] {
  const errors: string[] = [];
  const body = section(source, 'async function completeTraining(', '\nconst F4_FRESH_RACE_RELEASE_KEY');
  if (body.length === 0) return ['training-section'];
  const arc4 = body.indexOf('const arc4Preparation = prepareTrainingArc4Restore(');
  const arc5 = body.indexOf('const arc5Preparation = prepareTrainingArc5Restore({');
  const protect = body.indexOf("if (arc5Preparation.kind === 'protected')", arc5);
  const commit = body.indexOf('const committed = await f4Runtime!.commit(', protect);
  const durable = body.indexOf('durablyWritten = true;', commit);
  const verify = body.indexOf('const committedOwnershipV2 = committedTrainingArc5State(', durable);
  const preserveVerify = body.indexOf('const loadedOwnershipV2 = readArc5OwnershipMigration(', durable);
  const publish = body.indexOf('arc5OwnershipState = restoredOwnershipV2;', preserveVerify);
  if (!(arc4 >= 0 && arc5 > arc4 && protect > arc5 && commit > protect
    && durable > commit && verify > durable && preserveVerify > durable && publish > preserveVerify)) {
    errors.push('training-order');
  }
  if ((body.match(/f4Runtime!\.commit\(/gu) ?? []).length !== 1) errors.push('training-single-cas');
  for (const needle of [
    "checkpointKind: outcome.kind === 'deferred' ? 'source-deferred' : checkpoint.kind,",
    'baseExtensions: preparedLoot?.extensions ?? f4Runtime!.extensions,',
    'arc4Preparation: preparedOwnership,',
    'arc5OwnershipProtection = `training:${arc5Preparation.reason}`;',
    "...(arc5Preparation.kind === 'prepared' ? arc5Preparation.writes : []),",
    "if (arc5Preparation.kind === 'prepared') {",
    'ownershipStateDigestV2(arc5Preparation.state)',
    'JSON.stringify(loadedOwnershipV2.evidence)',
    'arc5OwnershipEvidence = restoredOwnershipV2Evidence;',
    "arc5OwnershipProtection = 'training-deferred:source-deferred';",
  ]) {
    if (!body.includes(needle)) errors.push('training-composition');
  }
  const durableCatch = section(
    body,
    '    if (durablyWritten) {',
    "    phase(writeStarted ? 'primary-write-rejected'",
  );
  if (durableCatch.length === 0
    || !durableCatch.includes("arc4OwnershipProtection = 'committed-publication-reload';")
    || !durableCatch.includes("arc5OwnershipProtection = 'committed-publication-reload';")
    || !durableCatch.includes('scheduleReplacementReload(replacement)')) {
    errors.push('training-postdurable-convergence');
  }
  return [...new Set(errors)];
}

function captureErrors(source: string): string[] {
  const errors: string[] = [];
  const writer = section(
    source,
    'async function commitArc4CaptureAction(',
    '\nfunction captureActivePlayCountdown(',
  );
  if (writer.length === 0) return ['capture-section'];
  const arc4Ready = writer.indexOf("if (arc4OwnershipState?.mode !== 'current'");
  const arc5Ready = writer.indexOf("if (ownershipV2Parent?.mode !== 'current'");
  const claim = writer.indexOf('const actionClaim = productActionCoordinator.tryClaim(');
  const durable = writer.indexOf('durable = true;');
  const verify = writer.indexOf('const verified = verifyArc4CommittedCaptureV1({', durable);
  const publishV1 = writer.indexOf('arc4OwnershipState = verified.ownership;', verify);
  const publishV2 = writer.indexOf('arc5OwnershipState = verified.ownershipV2;', publishV1);
  if (!(arc4Ready >= 0 && arc5Ready > arc4Ready && claim > arc5Ready
    && durable > claim && verify > durable && publishV1 > verify && publishV2 > publishV1)) {
    errors.push('capture-dependent-authority');
  }
  if (!writer.includes("attempt.detail.startsWith('capacity:arc5-migration:')")
    || !writer.includes("lastArc5BootstrapOutcome = 'capture-protected';")) {
    errors.push('capture-predraw-protection');
  }
  const refresh = section(
    source,
    'function refreshCaptureCardState(',
    '\nfunction captureOutcomeCopy(',
  );
  if (refresh.length === 0
    || !refresh.includes('preparedRoster: CanonicalWorldRoster | null = null')
    || !refresh.includes('preparedRoster.worldKey !== address.address.key')
    || !refresh.includes('preparedRoster.ecologyEpoch !== currentEcologyEpoch()')
    || !refresh.includes('canonicalWorldRoster(address.address, currentEcologyEpoch())')
    || !refresh.includes("arc4OwnershipState?.mode !== 'current'")
    || !refresh.includes('arc4OwnershipProtection !== null')
    || !refresh.includes("arc5OwnershipState?.mode !== 'current'")
    || !refresh.includes('arc5OwnershipEvidence?.representationVersion')
    || !refresh.includes('arc5OwnershipProtection !== null')) {
    errors.push('capture-read-model-authority');
  }
  if ((writer.match(/arc5OwnershipProtection = 'committed-publication-reload';/gu) ?? []).length < 3
    || (writer.match(/arc5OwnershipState = null;/gu) ?? []).length < 3
    || (writer.match(/arc5OwnershipEvidence = null;/gu) ?? []).length < 3) {
    errors.push('capture-postdurable-convergence');
  }
  if (!writer.includes('ownershipV2: ownershipV2Parent,')
    || !writer.includes('arc5OwnershipEvidence?.representationVersion')
    || !writer.includes('arc5OwnershipEvidence = verified.ownershipV2Evidence;')) {
    errors.push('capture-v2-evidence');
  }
  const runner = section(
    source,
    'async function runCaptureCardAction(',
    '\nfunction engineeringOutcomeConverges(',
  );
  if (runner.length === 0
    || !runner.includes("arc4OwnershipProtection = 'committed-publication-reload';")
    || !runner.includes("arc5OwnershipProtection = 'committed-publication-reload';")) {
    errors.push('capture-presentation-convergence');
  }
  return [...new Set(errors)];
}

function diagnosticErrors(source: string): string[] {
  const errors: string[] = [];
  for (const needle of [
    "schema: 'cf-v2-arc5-app-state/v2'",
    "stateKind: arc5OwnershipState === null ? 'unavailable' : 'loaded'",
    'representationVersion: arc5OwnershipEvidence?.representationVersion ?? null,',
    'protection: arc5OwnershipProtection,',
    'bootstrapPending: arc5OwnershipBootstrapPending,',
    'bootstrapOutcome: lastArc5BootstrapOutcome,',
    'sourceRevision: arc5OwnershipState === null',
    'ownershipSourceStateV1(arc5OwnershipState).revision,',
    'sourceDigest: arc5OwnershipEvidence?.sourceDigest ?? null,',
    'targetDigest: arc5OwnershipEvidence?.targetDigest ?? null,',
    'deltaDigest: arc5OwnershipEvidence?.representationVersion',
    'deltaRows: arc5OwnershipEvidence?.representationVersion',
    'deltaShardCount: arc5OwnershipEvidence?.representationVersion',
    'deltaShardDigests: arc5OwnershipEvidence?.representationVersion',
    'ownershipV2BootstrapPending: arc5OwnershipBootstrapPending,',
  ]) {
    if (!source.includes(needle)) errors.push('diagnostics');
  }
  return [...new Set(errors)];
}

function arc5BootSave(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 5 boot fixture failed: ${imported.reason}`);
  imported.state.savedView = {
    type: 'planet', gal: { x: 90, y: -60, seed: 999 },
    star: { x: 560, y: 170, seed: 424242 }, pseed: 133,
  };
  imported.state.logMap = [[
    'durable-atlas-row',
    {
      id: 'durable-atlas-row', title: 'Durable Atlas', sub: 'Unrelated sentinel',
      thumb: null, sq: false, badge: 'Held', fav: true, t: NOW,
      where: {
        type: 'planet', gal: { x: 90, y: -60, seed: 999 },
        star: { x: 560, y: 170, seed: 424242 }, pseed: 133,
      },
    },
  ], [
    'outer-atlas-row',
    {
      id: 'outer-atlas-row', title: 'Outer Atlas', sub: 'Second ordered sentinel',
      thumb: null, sq: true, badge: 'Charted', fav: false, t: NOW - 1,
      where: {
        type: 'planet', gal: { x: 1, y: 2, seed: 3 },
        star: { x: 4, y: 5, seed: 6 }, pseed: 900,
      },
    },
  ]];
  imported.state.items = [['earpiece', 2]];
  imported.state.equip = { ears: 'earpiece' };
  imported.state.equipAff = {
    ears: { k: 'contact', v: 7, forId: 'earpiece' },
  };
  return imported.state;
}

function arc5TargetExtensions(kind: 'corrupt' | 'future'): V5Extensions {
  return {
    player: {
      [ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace]: {
        version: kind === 'future'
          ? ARC5_OWNERSHIP_MIGRATION_VERSION + 1
          : ARC5_OWNERSHIP_MIGRATION_VERSION,
        json: '{}',
      },
    },
  };
}

function legacyArc5Extensions(current: V5Extensions): V5Extensions {
  const loaded = readArc5OwnershipMigration(
    current,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (loaded.kind !== 'loaded'
    || loaded.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) {
    throw new Error(`Arc 5 legacy fixture source was ${loaded.kind}`);
  }
  const source = ownershipSourceStateV1(loaded.state);
  const legacy = structuredClone(current) as Record<
    string, Record<string, { version: number; json: string }>
  >;
  for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
    delete legacy[target.segment]?.[target.namespace];
  }
  (legacy.player ??= {})[ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace] = {
    version: 1,
    json: canonicalJson({
      schema: 'cf-v2-ownership-v1-to-v2/v1',
      version: 1,
      sourceSchema: source.schema,
      sourceVersion: source.version,
      sourceRevision: source.revision,
      sourceMode: source.mode,
      sourceDigest: ownershipStateDigestV1(source),
      targetSchema: loaded.state.schema,
      targetVersion: loaded.state.version,
      targetRevision: loaded.state.revision,
      targetMode: loaded.state.mode,
      targetDigest: ownershipStateDigestV2(loaded.state),
    }),
  };
  return legacy as unknown as V5Extensions;
}

function stageArc5BootLiveFields(save: SaveStateV2): void {
  save.savedView = {
    type: 'planet', gal: { x: 91, y: -61, seed: 1000 },
    star: { x: 561, y: 171, seed: 424243 }, pseed: 134,
  };
  save.logMap[0]![1].where = {
    type: 'planet', gal: { x: 91, y: -61, seed: 1000 },
    star: { x: 561, y: 171, seed: 424243 }, pseed: 134,
  };
  save.logMap[1]![1].where = {
    type: 'planet', gal: { x: 7, y: 8, seed: 9 },
    star: { x: 10, y: 11, seed: 12 }, pseed: 901,
  };
  save.items = [['diplobeacon', 9]];
  save.equip = { necklace: 'diplobeacon' };
  save.equipAff = {
    necklace: { k: 'contact', v: 99, forId: 'diplobeacon' },
  };
}

describe('Arc 5 Main authority wiring', () => {
  it('executes the Main boot gate and blocks runtime/CAS/retry on corrupt or future Arc 5 after Arc 4 stages', () => {
    const controls = Object.freeze([
      ['corrupt', 'target-corrupt'],
      ['future', 'target-future'],
    ] as const);
    for (const [targetKind, reason] of controls) {
      const durableSave = arc5BootSave();
      const durable = captureArc5BootLiveProjection(durableSave);
      const arc4 = prepareArc4AppBootstrap({
        extensions: arc5TargetExtensions(targetKind),
        save: durableSave,
      });
      expect(arc4.kind, targetKind).toBe('prepared');
      if (arc4.kind !== 'prepared') continue;
      const arc4Live = stageArc4BootstrapLegacyProjection({
        source: durableSave,
        state: arc4.state,
        registry: REGISTRY,
        codecNow: NOW,
      });
      expect(arc4Live.kind, targetKind).toBe('staged');
      if (arc4Live.kind !== 'staged') continue;
      const classification = prepareArc5OwnershipMigration({
        extensions: arc4.extensions,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      });
      expect(classification, targetKind).toMatchObject({ kind: 'protected', reason });
      if (classification.kind !== 'protected') continue;

      const save = arc4Live.candidate;
      stageArc5BootLiveFields(save);
      const staged = captureArc5BootLiveProjection(save);
      expect(staged.savedView, targetKind).not.toEqual(durable.savedView);
      expect(staged.atlas, targetKind).not.toEqual(durable.atlas);
      expect(staged.items, targetKind).not.toEqual(durable.items);
      expect(staged.equip, targetKind).not.toEqual(durable.equip);
      expect(staged.equipAff, targetKind).not.toEqual(durable.equipAff);

      let runtimeCreations = 0;
      let receiptCas = 0;
      let retries = 0;
      let publications = 0;
      const gate = runArc5BootRuntimeGate({
        classification,
        durable,
        staged,
        createRuntime: () => {
          runtimeCreations++;
          return Object.freeze({
            commit: (): 'committed' | 'rejected' => { receiptCas++; return 'rejected'; },
          });
        },
      });
      if (gate.kind === 'ready') {
        const outcome = gate.runtime.commit();
        if (outcome !== 'committed') retries++;
        else publications++;
      } else {
        applyArc5BootLiveProjection(save, gate.live);
      }

      expect(gate.kind, targetKind).toBe('protected');
      expect(runtimeCreations, targetKind).toBe(0);
      expect(receiptCas, targetKind).toBe(0);
      expect(retries, targetKind).toBe(0);
      expect(publications, targetKind).toBe(0);
      expect(captureArc5BootLiveProjection(save), targetKind).toEqual(durable);
      expect(save.logMap[0]![1].title, targetKind).toBe('Durable Atlas');
      expect(save.logMap[1]![1].title, targetKind).toBe('Outer Atlas');
    }
  });

  it('holds actual loaded/future/corrupt Training carriers with exact rollback and zero runtime work', () => {
    const sourceSave = arc5BootSave();
    const arc4 = prepareArc4AppBootstrap({ extensions: {}, save: sourceSave });
    if (arc4.kind !== 'prepared') throw new Error(`Arc 4 loaded fixture was ${arc4.kind}`);
    const arc5 = prepareArc5OwnershipMigration({
      extensions: arc4.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (arc5.kind !== 'prepared') throw new Error(`Arc 5 loaded fixture was ${arc5.kind}`);
    const controls = Object.freeze([
      ['loaded', readArc5OwnershipMigration(
        arc5.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      )],
      ['future-version', readArc5OwnershipMigration(
        arc5TargetExtensions('future'),
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      )],
      ['corrupt', readArc5OwnershipMigration(
        arc5TargetExtensions('corrupt'),
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      )],
    ] as const);

    for (const [label, read] of controls) {
      expect(read.kind, label).toBe(label);
      const classification = classifyArc5TrainingBootGate(read);
      expect(classification, label).toEqual({
        kind: 'held', reason: `training-carrier-anomaly:${label}`,
      });

      const save = arc5BootSave();
      const durable = captureArc5BootLiveProjection(save);
      stageArc5BootLiveFields(save);
      const staged = captureArc5BootLiveProjection(save);
      expect(staged, label).not.toEqual(durable);

      let runtimeCreations = 0;
      let receiptCas = 0;
      let retries = 0;
      let publications = 0;
      const gate = runArc5BootRuntimeGate({
        classification,
        durable,
        staged,
        createRuntime: () => {
          runtimeCreations++;
          return Object.freeze({
            commit: (): 'committed' | 'rejected' => { receiptCas++; return 'rejected'; },
          });
        },
      });
      if (gate.kind === 'ready') {
        const outcome = gate.runtime.commit();
        if (outcome === 'committed') publications++;
        else retries++;
      } else {
        applyArc5BootLiveProjection(save, gate.live);
      }

      expect(gate.kind, label).toBe('protected');
      expect(runtimeCreations, label).toBe(0);
      expect(receiptCas, label).toBe(0);
      expect(retries, label).toBe(0);
      expect(publications, label).toBe(0);
      expect(captureArc5BootLiveProjection(save), label).toEqual(durable);
      expect(save.logMap.map(([id]) => id), label)
        .toEqual(['durable-atlas-row', 'outer-atlas-row']);
      expect(save.logMap[0]![1].title, label).toBe('Durable Atlas');
      expect(save.logMap[1]![1].title, label).toBe('Outer Atlas');
    }
  });

  it('allows ordinary prepared/aligned and actual absent-Training deferred gates exactly one runtime', () => {
    const save = arc5BootSave();
    const arc4 = prepareArc4AppBootstrap({ extensions: {}, save });
    if (arc4.kind !== 'prepared') throw new Error(`Arc 4 gate control was ${arc4.kind}`);
    const prepared = prepareArc5OwnershipMigration({
      extensions: arc4.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (prepared.kind !== 'prepared') {
      throw new Error(`Arc 5 gate preparation was ${prepared.kind}`);
    }
    const alreadyLoaded = prepareArc5OwnershipMigration({
      extensions: prepared.extensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (alreadyLoaded.kind !== 'already-loaded') {
      throw new Error(`Arc 5 fixed-point control was ${alreadyLoaded.kind}`);
    }
    expect(prepared.writes).toHaveLength(ARC5_OWNERSHIP_EXTENSION_TARGETS.length);
    expect(prepared.evidence.representationVersion).toBe(ARC5_OWNERSHIP_MIGRATION_VERSION);
    expect(alreadyLoaded.writes).toEqual([]);
    expect(alreadyLoaded.extensions).toEqual(prepared.extensions);
    expect(alreadyLoaded.evidence).toEqual(prepared.evidence);

    const legacyExtensions = legacyArc5Extensions(prepared.extensions);
    const legacyRead = readArc5OwnershipMigration(
      legacyExtensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (legacyRead.kind !== 'loaded') throw new Error(`Arc 5 legacy read was ${legacyRead.kind}`);
    expect(legacyRead.evidence.representationVersion).toBe(1);
    const upgrade = prepareArc5OwnershipMigration({
      extensions: legacyExtensions,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    });
    if (upgrade.kind !== 'prepared') throw new Error(`Arc 5 legacy upgrade was ${upgrade.kind}`);
    expect(upgrade.representationUpgrade).toBe('legacy-v1');
    expect(upgrade.writes).toHaveLength(ARC5_OWNERSHIP_EXTENSION_TARGETS.length);
    expect(upgrade.evidence.representationVersion).toBe(ARC5_OWNERSHIP_MIGRATION_VERSION);
    expect(ownershipStateDigestV2(upgrade.state)).toBe(ownershipStateDigestV2(legacyRead.state));
    const absent = readArc5OwnershipMigration({}, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(absent.kind).toBe('absent');
    const deferred = classifyArc5TrainingBootGate(absent);
    expect(deferred).toEqual({ kind: 'deferred' });
    const classifications = Object.freeze([
      ['prepared', prepared],
      ['legacy-v1-upgrade', upgrade],
      ['already-loaded', alreadyLoaded],
      ['absent-training-deferred', deferred],
    ] as const);
    const durable = captureArc5BootLiveProjection(save);
    stageArc5BootLiveFields(save);
    const staged = captureArc5BootLiveProjection(save);
    for (const [label, classification] of classifications) {
      let runtimeCreations = 0;
      const runtime = Object.freeze({ owner: label, identity: Symbol(label) });
      const gate = runArc5BootRuntimeGate({
        classification,
        durable,
        staged,
        createRuntime: () => { runtimeCreations++; return runtime; },
      });
      expect(gate, label).toMatchObject({
        kind: 'ready', classification, runtime, live: staged,
      });
      expect(runtimeCreations, label).toBe(1);
      expect(captureArc5BootLiveProjection(save), label).toEqual(staged);
    }
  });

  it('rejects reordered Atlas rollback and exposes a partial two-row restoration as non-durable', () => {
    const save = arc5BootSave();
    const durable = captureArc5BootLiveProjection(save);
    stageArc5BootLiveFields(save);
    const staged = captureArc5BootLiveProjection(save);
    expect(durable.atlas).toHaveLength(2);
    expect(staged.atlas).toHaveLength(2);

    const reordered = Object.freeze({
      ...durable,
      atlas: Object.freeze([durable.atlas[1]!, durable.atlas[0]!]),
    });
    expect(() => applyArc5BootLiveProjection(save, reordered))
      .toThrow('Arc 5 boot rollback Atlas identity changed');
    expect(captureArc5BootLiveProjection(save)).toEqual(staged);

    const partial = Object.freeze({
      ...durable,
      atlas: Object.freeze([durable.atlas[0]!, staged.atlas[1]!]),
    });
    applyArc5BootLiveProjection(save, partial);
    expect(captureArc5BootLiveProjection(save)).not.toEqual(durable);
    expect(save.logMap[0]![1].where).toEqual(durable.atlas[0]![1]);
    expect(save.logMap[1]![1].where).toEqual(staged.atlas[1]![1]);

    applyArc5BootLiveProjection(save, durable);
    expect(captureArc5BootLiveProjection(save)).toEqual(durable);
  });

  it('joins boot, Training and capture publication to one protected V2 authority', () => {
    expect(bootErrors(mainSource)).toEqual([]);
    expect(trainingErrors(mainSource)).toEqual([]);
    expect(captureErrors(mainSource)).toEqual([]);
    expect(diagnosticErrors(mainSource)).toEqual([]);
  });

  it('negative-controls boot entry, fixed-point publication and lifecycle gates', () => {
    const entry = replaceInSectionExact(
      mainSource,
      'async function ensureBootAuthorityCommit(',
      '\nfunction f4RuntimeMayMutate(',
      'if (!arc5OwnershipBootstrapPending\n',
      'if (true\n',
    );
    expect(bootErrors(entry)).toContain('boot-pending-entry');

    const verify = replaceInSectionExact(
      mainSource,
      'async function ensureBootAuthorityCommit(',
      '\nfunction f4RuntimeMayMutate(',
      'const loaded = committedArc5OwnershipState(',
      'const loaded = null && committedArc5OwnershipState(',
    );
    expect(bootErrors(verify)).toContain('boot-postcommit-verification');

    const lifecycle = replaceInSectionExact(
      mainSource,
      'function f4RuntimeMayMutate(',
      '\nfunction f4RuntimeMayAnswer(',
      ' || arc5OwnershipBootstrapPending',
      '',
    );
    expect(bootErrors(lifecycle)).toContain('boot-lifecycle-gates');
  });

  it('negative-controls Arc4-pending plus protected Arc5 as a zero-commit, zero-retry boot', () => {
    const noHold = replaceInSectionExact(
      mainSource,
      "  /* Arc 5's compact source-bound manifest",
      '  /* A newly prepared or reconciled carrier',
      "persistHold = 'protected-payload';",
      'persistHold = false;',
    );
    expect(bootErrors(noHold)).toContain('boot-protection-no-retry');

    const retryPending = replaceInSectionExact(
      mainSource,
      "  /* Arc 5's compact source-bound manifest",
      '  /* A newly prepared or reconciled carrier',
      'arc4OwnershipBootstrapPending = false;',
      'arc4OwnershipBootstrapPending = true;',
    );
    expect(bootErrors(retryPending)).toContain('boot-protection-no-retry');

    const staleExtensions = replaceInSectionExact(
      mainSource,
      "  /* Arc 5's compact source-bound manifest",
      '  /* A newly prepared or reconciled carrier',
      'initialExtensions = prepared.extensions;',
      'initialExtensions = initialExtensions;',
    );
    expect(bootErrors(staleExtensions)).toContain('boot-classification');

    const ungatedRuntime = replaceInSectionExact(
      mainSource,
      'async function loadSave(',
      '\n/* ---- boot ---- */',
      'const arc5BootGate = runArc5BootRuntimeGate({',
      'const arc5BootGate = false && runArc5BootRuntimeGate({',
    );
    expect(bootErrors(ungatedRuntime)).toContain('boot-protection-before-runtime');

    const changedClassification = replaceInSectionExact(
      mainSource,
      'async function loadSave(',
      '\n/* ---- boot ---- */',
      '    classification: arc5BootGateClassification,',
      "    classification: Object.freeze({ kind: 'deferred' }),",
    );
    expect(bootErrors(changedClassification)).toContain('boot-runtime-gate-binding');

    const optimisticTrainingAnomaly = replaceInSectionExact(
      mainSource,
      "  /* Arc 5's compact source-bound manifest",
      '  /* A newly prepared or reconciled carrier',
      "        holdProtectedArc5Boot(\n          existing.kind === 'future-version' ? 'future-protected' : 'corrupt-protected',\n          `Arc 5 ownership authority ${arc5OwnershipProtection}`,\n        );\n",
      '',
    );
    expect(bootErrors(optimisticTrainingAnomaly)).toContain('boot-training-anomaly-hold');

    const swappedProjections = replaceInSectionExact(
      mainSource,
      'async function loadSave(',
      '\n/* ---- boot ---- */',
      '    durable: durableArc5BootLive,\n    staged: captureArc5BootLiveProjection(save),',
      '    durable: captureArc5BootLiveProjection(save),\n    staged: durableArc5BootLive,',
    );
    expect(bootErrors(swappedProjections)).toContain('boot-runtime-gate-binding');

    const changedRuntimeOwner = replaceInSectionExact(
      mainSource,
      'async function loadSave(',
      '\n/* ---- boot ---- */',
      '    createRuntime: () => {',
      '    createRuntime: () => null, decoyRuntime: () => {',
    );
    expect(bootErrors(changedRuntimeOwner)).toContain('boot-runtime-gate-binding');
  });

  it('negative-controls Training write composition, postcommit verification and convergence', () => {
    const missingWrite = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      "            ...(arc5Preparation.kind === 'prepared' ? arc5Preparation.writes : []),\n",
      '',
    );
    expect(trainingErrors(missingWrite)).toContain('training-composition');

    const missingVerify = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      'const committedOwnershipV2 = committedTrainingArc5State(',
      'const committedOwnershipV2 = null && committedTrainingArc5State(',
    );
    expect(trainingErrors(missingVerify)).toContain('training-order');

    const optimistic = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      "arc5OwnershipProtection = 'committed-publication-reload';",
      'arc5OwnershipProtection = null;',
    );
    expect(trainingErrors(optimistic)).toContain('training-postdurable-convergence');
  });

  it('negative-controls capture dependency, V2 publication and both durable failure surfaces', () => {
    const missingDependency = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      "  const ownershipV2Parent = arc5OwnershipState;\n  if (ownershipV2Parent?.mode !== 'current'\n    || arc5OwnershipEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION\n    || arc5OwnershipProtection !== null) {\n    return unavailable(`arc5:${arc5OwnershipProtection ?? 'ownership-v2-unavailable'}`, verb);\n  }\n",
      '',
    );
    expect(captureErrors(missingDependency)).toContain('capture-dependent-authority');

    const missingPublish = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      'arc5OwnershipState = verified.ownershipV2;',
      'arc5OwnershipState = arc5OwnershipState;',
    );
    expect(captureErrors(missingPublish)).toContain('capture-dependent-authority');

    const presentationOptimistic = replaceInSectionExact(
      mainSource,
      'async function runCaptureCardAction(',
      '\nfunction engineeringOutcomeConverges(',
      "arc5OwnershipProtection = 'committed-publication-reload';",
      'arc5OwnershipProtection = null;',
    );
    expect(captureErrors(presentationOptimistic)).toContain('capture-presentation-convergence');

    const readModelOptimistic = replaceInSectionExact(
      mainSource,
      'function refreshCaptureCardState(',
      '\nfunction captureOutcomeCopy(',
      "    || arc5OwnershipState?.mode !== 'current'\n    || arc5OwnershipEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION\n    || arc5OwnershipProtection !== null\n",
      '',
    );
    expect(captureErrors(readModelOptimistic)).toContain('capture-read-model-authority');

    const stalePreparedRoster = replaceInSectionExact(
      mainSource,
      'function refreshCaptureCardState(',
      '\nfunction captureOutcomeCopy(',
      '      || preparedRoster.ecologyEpoch !== currentEcologyEpoch()) {',
      '      || preparedRoster.ecologyEpoch !== preparedRoster.ecologyEpoch) {',
    );
    expect(captureErrors(stalePreparedRoster)).toContain('capture-read-model-authority');

    const wrongWorldPreparedRoster = replaceInSectionExact(
      mainSource,
      'function refreshCaptureCardState(',
      '\nfunction captureOutcomeCopy(',
      '    if (preparedRoster.worldKey !== address.address.key',
      '    if (preparedRoster.worldKey !== preparedRoster.worldKey',
    );
    expect(captureErrors(wrongWorldPreparedRoster)).toContain('capture-read-model-authority');
  });

  it('negative-controls the public diagnostic carrier', () => {
    const mutant = mainSource.replace(
      "schema: 'cf-v2-arc5-app-state/v2'",
      "schema: 'cf-v2-arc5-app-state/broken'",
    );
    expect(mutant).not.toBe(mainSource);
    expect(diagnosticErrors(mutant)).toEqual(['diagnostics']);

    for (const needle of [
      '          sourceRevision: arc5OwnershipState === null\n            ? null : ownershipSourceStateV1(arc5OwnershipState).revision,\n',
      '          representationVersion: arc5OwnershipEvidence?.representationVersion ?? null,\n',
      '          sourceDigest: arc5OwnershipEvidence?.sourceDigest ?? null,\n',
      '          targetDigest: arc5OwnershipEvidence?.targetDigest ?? null,\n',
      '          deltaDigest: arc5OwnershipEvidence?.representationVersion\n            === ARC5_OWNERSHIP_MIGRATION_VERSION\n            ? arc5OwnershipEvidence.deltaDigest : null,\n',
      '          deltaShardDigests: arc5OwnershipEvidence?.representationVersion\n            === ARC5_OWNERSHIP_MIGRATION_VERSION\n            ? arc5OwnershipEvidence.shardDigests : [],\n',
    ]) {
      const missingAuthority = replaceInSectionExact(
        mainSource,
        '        ownershipV2: {',
        '\n        cardOpen:',
        needle,
        '',
      );
      expect(diagnosticErrors(missingAuthority), needle).toContain('diagnostics');
    }
  });
});
