import { parse } from 'acorn';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  arc0LandingCoordinatorIsIdle,
  arc0LandingSurveyRouteIsExact,
  assessArc0LandingAwaitBoundary,
  assessArc0LandingPublicationWithheld,
  assessSingleF4ActionCommit,
} from '../tools/slicesmoke-contract.mjs';

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
const surveyContractOwner = section(
  evidenceOwner,
  '  const arc0LandingSurveyReceiptPattern = /^arc9sv1:[0-9a-f]{64}$/u;',
  '  const arc0LandingConvergenceHeld = (state) => (',
);
const surveySetupOwner = section(
  evidenceOwner,
  '  const assessArc0LandingSurveySetup = (evidence) => {',
  '  const arc0LandingSurveyBaselineExact = (evidence) => (',
);
const reloadFixedPointOwner = section(
  evidenceOwner,
  '  const arc0LandingReloadFixedPoint = (evidence, route) => {',
  '  const arc0LandingConvergenceWitnessExact = (evidence, scenario, raw, detail) => {',
);
const convergenceWitnessOwner = section(
  evidenceOwner,
  '  const arc0LandingConvergenceWitnessExact = (evidence, scenario, raw, detail) => {',
  '  const arc0LandingFaultExact = (evidence, injection, outcome) => {',
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

const PERTAR_GALAXY_KEY = 'CF1|g:999@90,-60';
const PERTAR_STAR_KEY = `${PERTAR_GALAXY_KEY}|s:1347060996@414.31,168.49`;
const PERTAR_PAYLOAD = Object.freeze({
  t: 'p',
  g: Object.freeze([90, -60, 78, 0, 0.62, 0.5, 999, 1]),
  s: Object.freeze([414.31, 168.49, 1_347_060_996]),
  p: 546_621_068,
});
const encodeCf1 = (payload: unknown): string => (
  `CF1-${Buffer.from(JSON.stringify(payload)).toString('base64url')}`
);
const exactPertarSurveyRouteEvidence = () => ({
  state: {
    mode: 'system',
    gal: 999,
    galX: 90,
    galY: -60,
    star: 1_347_060_996,
    starX: 414.31,
    starY: 168.49,
    planet: null,
    planetOrdinal: null,
    navGalaxyKey: PERTAR_GALAXY_KEY,
    navStarKey: PERTAR_STAR_KEY,
    navWorldKey: null,
    cardOpen: true,
    cardTitle: 'Pertar',
    epoch: 0,
    renderedScene: {
      serial: 7,
      mode: 'system',
      ecologyEpoch: 0,
      galaxyKey: PERTAR_GALAXY_KEY,
      starKey: PERTAR_STAR_KEY,
      worldKey: null,
    },
  },
  cardCode: encodeCf1(PERTAR_PAYLOAD),
  target: {
    seed: 546_621_068,
    ordinal: 3,
    screenX: 433.36161745314564,
    screenY: 294.0991033542126,
    width: 30.497786755310813,
    height: 30.497786755310813,
  },
});

describe('Slice Arc 0 Landing fault evidence contract', () => {
  it('shares the one unchanged card-action factory across phone and later collision scopes', () => {
    const topLevelFactories = (source: string) => parse(source, {
      ecmaVersion: 'latest', sourceType: 'module',
    }).body.filter((node: any) => node.type === 'VariableDeclaration'
      && node.declarations.some((entry: any) => entry.id.type === 'Identifier'
        && entry.id.name === 'phoneCardActionCheck'));
    const declarations = topLevelFactories(sliceSource);
    expect(declarations).toHaveLength(1);
    expect(occurrences(sliceSource, 'const phoneCardActionCheck =')).toBe(1);
    const declaration = declarations[0]!;
    const exactFactory = sliceSource.slice(declaration.start, declaration.end);
    const run = (factory: string) => Function(`${factory}\nreturn phoneCardActionCheck('landcta');`)();
    expect(run(exactFactory)).toContain('#survey [data-act="landcta"]');
    expect(run(exactFactory)).toContain('b.height>=44');
    const nested = sliceSource.replace(exactFactory, `{ ${exactFactory} }`);
    expect(topLevelFactories(nested)).toHaveLength(0);
    expect(() => run(`{ ${exactFactory} }`)).toThrow(ReferenceError);
    expect(topLevelFactories(nested.replace(`{ ${exactFactory} }`, exactFactory))).toHaveLength(1);
    expect(run(exactFactory)).toContain('#survey [data-act="landcta"]');
    proveEachMarkerRequired(sliceSource, [
      ['phone wave-off action', "const learnedLandAction = await evalNavPh(phoneCardActionCheck('landcta'));"],
      ['desktop panel wave-off action', "const nextAction = await evalPanel(phoneCardActionCheck('landcta'));"],
      ['later collision wave-off action', "const nextAction = await evalF4Control(collisionTarget.session, phoneCardActionCheck('landcta'));"],
    ]);
  });

  it('keeps desktop Mercury waits bound to the explicitly staged compatibility document', async () => {
    const owner = section(sliceSource,
      '  const completeDesktopMercuryLand = async (label, { migratedDocumentToken = null } = {}) => {',
      '  /* Complete the fresh Chapter-1 landfall goal with a second genuine Sol');
    const worldKey = 'CF1|g:999@90,-60|s:424242@560,170|p:131#0';
    for (const migratedDocumentToken of [null, 'fixture-migrated-document-token']) {
      for (const firstWaveOff of [false, true]) {
        const waits: Array<{ label: string; options: unknown }> = [];
        let landCalls = 0;
        // This seam checks wait-option propagation only. The existing durable
        // wave-off and boot-readiness tests independently reject forged facts.
        const run = Function('evalIn', 'waitForF4Writable', 'failSliceWithoutCascade',
          'MERCURY', 'ARC4_DURABLE_READ_EXPRESSION', 'boundedDescentReceipt',
          'earthLandActionCheck', 'MERCURY_DESCENT_WORLD_KEY', 'assessBoundedDescentWaveOff',
          `${owner}\nreturn completeDesktopMercuryLand;`)(
          async (expression: string) => {
            if (expression.includes('api.surveyOn(')) return true;
            if (expression.includes('api.landHere(')) {
              landCalls += 1;
              return !(firstWaveOff && landCalls === 1);
            }
            return {};
          },
          async (label: string, options: unknown) => {
            waits.push({ label, options }); return { index: waits.length };
          },
          (message: string) => { throw new Error(message); }, { seed: 131, ordinal: 0 }, 'raw-expression',
          (_before: unknown, after: { index: number }) => ({ facts: { worldKey, descent: {
            kind: firstWaveOff && after.index === 2 ? 'wave-off' : 'landed',
            policy: { successPercent: after.index === 3 ? 100 : 95 },
          } } }), 'action-expression', worldKey, () => ({ ok: true }),
        );
        if (migratedDocumentToken === null) await run('OBJECTIVE MERCURY LANDFALL');
        else await run('COMPATIBILITY MERCURY LANDFALL', { migratedDocumentToken });
        expect(waits).toHaveLength(firstWaveOff ? 3 : 2);
        expect(waits.map((row) => row.options)).toEqual(Array.from({ length: waits.length }, () => ({
          allowMigrated: migratedDocumentToken !== null, expectedToken: migratedDocumentToken,
        })));
      }
    }
    proveEachMarkerRequired(sliceSource, [
      ['default objective authority', "await completeDesktopMercuryLand('OBJECTIVE MERCURY LANDFALL');"],
      ['explicit compatibility document', "await completeDesktopMercuryLand('COMPATIBILITY MERCURY LANDFALL', {\n    migratedDocumentToken: oneBadFieldBoot.persistence.documentToken,\n  });"],
    ]);
  });

  it('settles exactly one Share notice before Land without exempting notification history or any product field', () => {
    const owner = section(sliceSource,
      '      const assessCharterShareNoticeCheckpoint = (evidence) => {',
      '      const shareNoticeToast = await waitNavPhValue(');
    const canonical = (value: any): string => Array.isArray(value)
      ? `[${value.map(canonical).join(',')}]`
      : value && typeof value === 'object'
        ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
        : JSON.stringify(value);
    const assess = Function('canonicalJson', `${owner}\nreturn assessCharterShareNoticeCheckpoint;`)(canonical);
    const title = '⧉ Share code copied';
    const message = 'Paste it into any explorer’s search bar to guide them here.';
    const encode = (raw: any) => {
      raw.revisionRaw = String(raw.revision);
      raw.authorityJson = JSON.stringify(raw.authority);
      raw.playerRow.extensions['f4.authority'].json = raw.authorityJson;
      raw.legacyRaw = JSON.stringify(raw.legacy);
      for (const key of ['player', 'creatures', 'catalog', 'inventory', 'settings']) {
        raw[`${key}Raw`] = JSON.stringify(raw[`${key}Row`]);
      }
      raw.receiptRawRows = raw.receiptRows.map((row: any) => JSON.stringify(row));
    };
    const authority = (raw: any) => ({ token: 'exact-charter-document', raw: {
      revisionRaw: raw.revisionRaw, revision: raw.revision, legacyRaw: raw.legacyRaw,
      activePlayMs: raw.authority.activePlayMs,
      seed: raw.authority.sessionRng.seed, ordinal: raw.authority.sessionRng.ordinal,
      draws: structuredClone(raw.authority.sessionRng.draws),
      receiptKeys: structuredClone(raw.receiptKeys), receiptRows: structuredClone(raw.receiptRows),
    } });
    const fixture = (count = 2): any => {
      const history = Array.from({ length: count }, (_, index) => ({
        id: index === 0 ? 1 : index + 3, tt: `Prior ${index}`, ms: 'Keep exactly',
        t: 10_000_000 + index, read: index % 2 === 0,
      }));
      const beforeRaw: any = { revision: 35,
        legacy: { at: 20_000_000, notifs: history, hp: 55, essence: 5000, land: [131],
          view: { type: 'star' }, conq: [[7, { t: 16_400_000, value: 1 }]], minedw: [[9, 2_000_000]] },
        playerRow: { schema: 5, segment: 'player', data: { at: 20_000_000,
          notifs: structuredClone(history), hp: 55, essence: 5000,
          conq: [[7, { t: 16_400_000, value: 1 }]] }, extensions: { 'f4.authority': { version: 1, json: '' } } },
        creaturesRow: { schema: 5, segment: 'creatures', data: { ids: [77] } },
        catalogRow: { schema: 5, segment: 'catalog', data: { land: [131] } },
        inventoryRow: { schema: 5, segment: 'inventory', data: { items: [['headlamp', 1]], minedw: [[9, 2_000_000]] } },
        settingsRow: { schema: 5, segment: 'settings', data: { snd: 0 } },
        authorityVersion: 1, authority: { activePlayMs: 200, sessionRng: { seed: 17, ordinal: 3, draws: {} } },
        captureRevision: 0, captureState: { owned: [77] },
        receiptKeys: ['receipt:2'], receiptRows: [{ ordinal: 2, kind: 'arc9-share-send-v1', witness: 'exact-share' }],
      };
      encode(beforeRaw);
      const afterRaw = structuredClone(beforeRaw);
      afterRaw.revision = 36;
      afterRaw.legacy.at = afterRaw.playerRow.data.at = 20_000_100;
      const ids = new Set(history.map((row) => row.id));
      let nextId = ((history[0]?.id ?? 0) + 1) | 0;
      while (ids.has(nextId)) nextId = (nextId + 1) | 0;
      afterRaw.legacy.notifs = [{ id: nextId, tt: title, ms: message, t: 20_000_020, read: false }, ...history].slice(0, 50);
      afterRaw.playerRow.data.notifs = structuredClone(afterRaw.legacy.notifs);
      afterRaw.legacy.conq[0][1].t = afterRaw.playerRow.data.conq[0][1].t = 16_400_100;
      afterRaw.legacy.minedw[0][1] = afterRaw.inventoryRow.data.minedw[0][1] = 2_000_100;
      afterRaw.authority.activePlayMs = 260;
      encode(afterRaw);
      const beforeState = { persistence: { documentToken: 'exact-charter-document', lastOutcome: 'arc9-share-send-committed:35' },
        save: { essence: 5000, stats: { shares: 4 }, landed: [131] },
        mode: 'system', navGalaxyKey: 'Milky Way', navStarKey: 'Sol', navWorldKey: null,
        epoch: 12, stage: 3, cardOpen: true, cardTitle: 'Mercury',
        toastText: title + message, toastSerial: 1,
        progressionCeremony: { queueKeys: ['achievement:share'], deliveries: 0, lastDeliveredKey: null, timerPending: true } };
      const afterState = structuredClone(beforeState);
      afterState.persistence.lastOutcome = 'committed:36';
      return { beforeRaw, afterRaw, beforeAuthority: authority(beforeRaw), afterAuthority: authority(afterRaw),
        beforeState, afterState, toast: { title, message, serial: 1, visible: true, observedAt: 20_000_040 }, committed: true };
    };
    expect(assess(fixture())).toEqual({ ok: true, checks: {
      'exact painted Share notice': true,
      'exact unread notice and unchanged prior history': true,
      'one admitted same-document receipt-free checkpoint': true,
      'exact codec time and monotone active play': true,
      'exact full raw successor without product delta': true,
      'adjacent Share toast and ceremony race preserved': true,
    } });
    expect(assess(fixture(0)).ok, 'empty prior history').toBe(true);
    expect(assess(fixture(50)).ok, 'bounded full history keeps exactly its first 49 prior entries').toBe(true);
    const mutations: Array<[string, (value: any) => void]> = [
      ['missing notice', (v) => { v.afterRaw.legacy.notifs.shift(); }],
      ['extra notice', (v) => { v.afterRaw.legacy.notifs.push({ ...v.afterRaw.legacy.notifs[0], id: 99 }); }],
      ['wrong title', (v) => { v.afterRaw.legacy.notifs[0].tt = 'Other success'; }],
      ['wrong message', (v) => { v.afterRaw.legacy.notifs[0].ms = 'Other outcome'; }],
      ['wrong generated id', (v) => { v.afterRaw.legacy.notifs[0].id = 4; }],
      ['new notice already read', (v) => { v.afterRaw.legacy.notifs[0].read = true; }],
      ['changed old read flag', (v) => { v.afterRaw.legacy.notifs[1].read = false; }],
      ['reordered old history', (v) => { v.afterRaw.legacy.notifs.reverse(); }],
      ['notice predates Share', (v) => { v.afterRaw.legacy.notifs[0].t = 19_999_999; }],
      ['notice follows its observation', (v) => { v.afterRaw.legacy.notifs[0].t = 20_000_041; }],
      ['mismatched codec owner', (v) => { v.afterRaw.playerRow.data.notifs[0].ms = 'Other owner'; }],
      ['unpainted toast', (v) => { v.toast.visible = false; }],
      ['stale toast serial', (v) => { v.toast.serial = 0; }],
      ['refused checkpoint', (v) => { v.committed = false; }],
      ['two checkpoints', (v) => { v.afterRaw.revision += 1; }],
      ['new receipt', (v) => { v.afterRaw.receiptRows.push({ ordinal: 3, kind: 'unexpected' }); v.afterRaw.receiptKeys.push('receipt:3'); }],
      ['new ordinal', (v) => { v.afterRaw.authority.sessionRng.ordinal += 1; }],
      ['new seed', (v) => { v.afterRaw.authority.sessionRng.seed += 1; }],
      ['new RNG draw', (v) => { v.afterRaw.authority.sessionRng.draws['descent.success'] = 1; }],
      ['active-play rewind', (v) => { v.afterRaw.authority.activePlayMs = 199; }],
      ['wrong timer normalization', (v) => { v.afterRaw.legacy.minedw[0][1] += 1; v.afterRaw.inventoryRow.data.minedw[0][1] += 1; }],
      ['durable HP change', (v) => { v.afterRaw.legacy.hp += 1; v.afterRaw.playerRow.data.hp += 1; }],
      ['durable reward change', (v) => { v.afterRaw.legacy.essence += 1; v.afterRaw.playerRow.data.essence += 1; }],
      ['inventory change', (v) => { v.afterRaw.inventoryRow.data.items[0][1] += 1; }],
      ['catalog change', (v) => { v.afterRaw.catalogRow.data.land.push(133); }],
      ['settings change', (v) => { v.afterRaw.settingsRow.data.snd = 1; }],
      ['ownership change', (v) => { v.afterRaw.captureRevision += 1; }],
      ['live reward change', (v) => { v.afterState.save.essence += 1; }],
      ['changed adjacent toast', (v) => { v.afterState.toastSerial += 1; }],
      ['removed queued ceremony', (v) => { v.afterState.progressionCeremony.queueKeys = []; }],
      ['delivered queued ceremony', (v) => { v.afterState.progressionCeremony.deliveries += 1; }],
      ['stopped ceremony timer', (v) => { v.afterState.progressionCeremony.timerPending = false; }],
    ];
    for (const [name, mutate] of mutations) {
      const value = fixture(); mutate(value);
      encode(value.afterRaw); value.afterAuthority = authority(value.afterRaw);
      expect(assess(value).ok, name).toBe(false);
    }
    const wrongDocument = fixture(); wrongDocument.afterAuthority.token = 'other-document';
    expect(assess(wrongDocument).ok).toBe(false);
    const staleRaw = fixture(); staleRaw.afterAuthority.raw.legacyRaw = staleRaw.beforeRaw.legacyRaw;
    expect(assess(staleRaw).ok).toBe(false);
    const incoherentRaw = fixture(); incoherentRaw.afterRaw.legacyRaw = incoherentRaw.beforeRaw.legacyRaw;
    incoherentRaw.afterAuthority.raw.legacyRaw = incoherentRaw.afterRaw.legacyRaw;
    expect(assess(incoherentRaw).ok).toBe(false);
  });

  it('requires the proved Share checkpoint before replacing Land authority or arming its existing hold', () => {
    const owner = section(sliceSource,
      '      const shareNoticeToast = await waitNavPhValue(',
      '    let outcome;\n    let landAuthority;\n    let learnedCharterApproach = false;');
    proveEachMarkerRequired(owner, [
      ['exact existing checkpoint', 'const shareNoticeCommitted = await evalNavPh(`window.__CF_SLICE__.api.__smokePersistNow()`);'],
      ['reacquired raw bytes', 'const shareNoticeRaw = await evalNavPh(ARC4_DURABLE_READ_EXPRESSION);'],
      ['checked result', 'const shareNoticeAssessment = assessCharterShareNoticeCheckpoint(shareNoticeEvidence);'],
      ['stop before accepting red', 'if (!shareNoticeAssessment.ok) {'],
      ['new state predecessor', 'beforeLand = shareNoticeState;'],
      ['new authority predecessor', 'preLandAuthority = shareNoticeAuthority;'],
      ['negative controls', 'if (assessCharterShareNoticeCheckpoint(control).ok) {'],
      ['unchanged Land raw read', 'const beforeLandRaw = await evalNavPh(ARC4_DURABLE_READ_EXPRESSION);'],
      ['existing deliberate Land hold', 'const ceremonyRaceArmed = expectedChapter === 3'],
    ]);
    proveEachOrderRequired(owner, [
      { label: 'checkpoint before reassessment', first: 'const shareNoticeCommitted =', second: 'const shareNoticeAssessment =' },
      { label: 'proof before new authority', first: 'if (!shareNoticeAssessment.ok)', second: 'preLandAuthority = shareNoticeAuthority;' },
      { label: 'controls before new baseline', first: 'const shareNoticeControls =', second: 'beforeLand = shareNoticeState;' },
      { label: 'new predecessor before Land snapshot', first: 'preLandAuthority = shareNoticeAuthority;', second: 'const beforeLandRaw =' },
      { label: 'new baseline before race hold', first: 'const beforeLandRaw =', second: 'const ceremonyRaceArmed =' },
    ]);
  });

  it('permits one learned approach only after an exact durable authored wave-off', () => {
    const owner = section(sliceSource,
      'const MERCURY_DESCENT_WORLD_KEY =', 'const earlyCoreFlowSurveyExpectation = (');
    const canonical = (value: any): string => Array.isArray(value)
      ? `[${value.map(canonical).join(',')}]`
      : value && typeof value === 'object'
        ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
        : JSON.stringify(value);
    const hash = (kind: string, value: any) => createHash('sha256')
      .update(`arc0-landing:${kind}:v1\u0000${canonical(value)}`).digest('hex');
    const assess = Function('canonicalJson', 'createHash', 'assessSingleF4ActionCommit', 'arc0LandingCoordinatorIsIdle', 'COLLISION_REACH_WORLDS',
      `${owner}\nreturn assessBoundedDescentWaveOff;`)(canonical, createHash, assessSingleF4ActionCommit, arc0LandingCoordinatorIsIdle, [
        { name: 'Twin Reach Alpha', key: 'CF1|g:350410949@-7896.51,-370.06|s:127200472@-119.83,75.99|p:1349616177#0' },
        { name: 'Twin Reach Beta', key: 'CF1|g:350410949@-7896.51,-370.06|s:127200472@167.56,-36.82|p:1349616177#0' },
      ]);
    // Synthetic raw fixture: the independently authored seed10 first success
    // draw is .9993766504339874 and damage draw .5748063516803086.
    // Mercury95 therefore waves off for2HP, preserves rewards and learns20%.
    const worldKey = 'CF1|g:999@90,-60|s:424242@560,170|p:131#0';
    const galaxyKey = 'CF1|g:999@90,-60';
    const starKey = `${galaxyKey}|s:424242@560,170`;
    const fixture = () => {
      const landing = { schema: 'cf-v2-arc0-landing-app-state/v1', lastOutcome: 'committed:8',
        actionCoordinator: { inFlight: false,
          owner: { schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy: false, operation: null },
          hold: { schema: 'cf-v2-product-action-hold-diagnostics/v1', phase: 'idle', operation: null, sequence: 0 },
          faultArmed: { storageFailure: false, staleAuthority: false, publicationFailure: false }, lastFault: null } };
      const route = { mode: 'system', navGalaxyKey: galaxyKey, navStarKey: starKey, navWorldKey: null,
        planet: null, planetOrdinal: null, epoch: 12, cardOpen: true, cardTitle: 'Mercury',
        save: { landed: [133], essence: 7, items: [], stats: { landings: 1 }, savedView: { type: 'system' } },
        renderedScene: { mode: 'system', starKey, worldKey: null }, landing };
      const beforeState: any = { ...structuredClone(route), persistence: { lastOutcome: 'arc9-survey-committed:7', runtime: {
        schema: 'cf-v2-f4-runtime/v1', revision: 7, commits: 5, sessionSeed: 10, sessionOrdinal: 3, sessionDraws: {} } } };
      const afterState: any = { ...structuredClone(route), persistence: { lastOutcome: 'arc0-land-committed:8', runtime: {
        schema: 'cf-v2-f4-runtime/v1', revision: 8, commits: 6, sessionSeed: 10, sessionOrdinal: 4,
        sessionDraws: { 'descent.success': 1, 'descent.damage': 1 } } } };
      const beforeLegacy = { hp: 55, at: 1_000, conq: [], minedw: [], wvo: [[901, 3], [902, 5]], land: [133], ess: 7, view: { type: 'system' } };
      const afterLegacy = { ...structuredClone(beforeLegacy), hp: 53, at: 1_100, wvo: [[131, 1], [901, 3], [902, 5]] };
      const waveOffs = { schema: 'cf-v2-descent-wave-offs/v1', version: 1,
        records: [[worldKey, 1]], unresolved: [[901, 3], [902, 5]] };
      const facts: any = {
        schema: 'cf-v2-arc0-landing-witness/v1', worldKey, planetSeed: 131, planetOrdinal: 0,
        landing: 'first', permanentLanding: false, training: false, landingKnownBefore: false,
        identityLandedAfter: false, claimedLegacyIdentity: false, legacyMirrorContainsSeedAfter: false,
        savedView: beforeLegacy.view, sample: null,
        charter: { banked: false, ascChBefore: null, ascChAfter: null, stage: null, progressSeal: null, delta: {} },
        starterCharters: { changed: false, progressIds: [], completions: [], priorUnlockedIds: [], nextUnlockedIds: [],
          addedAchievementIds: [], priorBestRankIndex: 0, nextBestRankIndex: 0 }, achievement: null, descentWeather: null,
        descent: { kind: 'wave-off', navigation: 'orbit', drawsConsumed: 2,
          hpBefore: 55, hpAfter: 53, rawDamage: 2, gearAdjustedDamage: 2, damage: 2,
          waveOffCountBefore: 0, waveOffCountAfter: 1, persistenceOutcome: 'failure',
          policy: { schema: 'cf-v2-descent-policy/v1', key: worldKey,
            address: { format: 'CF1', key: worldKey, galaxy: { seed: 999, x: 90, y: -60 },
              star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 131, ordinal: 0 } },
            opportunityIdentity: `cf-v2-world-opportunity/v3:${worldKey}`, capabilityFingerprint: 'synthetic-no-gear',
            planetType: 'rocky', biomeKey: 'cratered', typeBase: { successPercent: 90, damageMin: 2, damageMax: 2 },
            baseSuccessPercent: 95, stormActive: false, stormAdjustedPercent: 95,
            waveOffCount: 0, learnedApproachBonus: 0, globalGearBonus: 0, familyGearBonus: 0,
            landingGuaranteed: false, successPercent: 95, damageMin: 2, damageMax: 2,
            waveOffDamageReduction: 0, safeReason: null, requiredDomains: ['descent.success', 'descent.damage'] } },
        stateSuccessorSeal: 'a'.repeat(64), worldIdentitySuccessorSeal: 'b'.repeat(64),
        waveOffStateSuccessorSeal: 'c'.repeat(64), waveOffLegacySuccessorSeal: hash('wave-off-legacy', afterLegacy.wvo),
        arc2LootSuccessorSeal: null, waveOffProtectedStateSeal: 'd'.repeat(64), receiptOrdinal: 3,
      };
      const prefix = [{ ordinal: 2, kind: 'arc9-survey-v1', witness: 'fixture-prior' }];
      const beforeAuthority: any = { token: 'bounded-wave-off-document', state: beforeState, raw: {
        revision: 7, revisionRaw: '7', seed: 10, ordinal: 3, draws: {}, legacyRaw: JSON.stringify(beforeLegacy),
        receiptKeys: ['receipt:2'], receiptRows: prefix } };
      const afterAuthority: any = { token: beforeAuthority.token, state: afterState, raw: {
        revision: 8, revisionRaw: '8', seed: 10, ordinal: 4, draws: { 'descent.success': 1, 'descent.damage': 1 },
        legacyRaw: JSON.stringify(afterLegacy), receiptKeys: ['receipt:2', 'receipt:3'],
        receiptRows: [...prefix, { ordinal: 3, kind: 'arc0-land', witness: JSON.stringify(facts) }] } };
      const raw = (authority: any, legacy: any, learned: boolean) => ({
        revision: authority.raw.revision, legacyRaw: JSON.stringify(legacy), legacy,
        authority: { sessionRng: { seed: authority.raw.seed, ordinal: authority.raw.ordinal, draws: authority.raw.draws } },
        playerRow: { data: { hp: legacy.hp, at: legacy.at, conq: legacy.conq, ess: legacy.ess }, extensions: { 'f4.authority': { version: 1, json: 'fixture' } } },
        catalogRow: { data: { wvo: legacy.wvo, land: legacy.land }, extensions: learned
          ? { 'descent.wave-offs': { version: 1, json: JSON.stringify(waveOffs) } } : {} },
        creaturesRaw: '{"data":[]}', inventoryRaw: JSON.stringify({ data: { minedw: legacy.minedw, items: [] } }), settingsRaw: '{"volume":1}',
        receiptKeys: authority.raw.receiptKeys, receiptRows: authority.raw.receiptRows,
      });
      return { worldKey, beforeAuthority, afterAuthority, beforeRaw: raw(beforeAuthority, beforeLegacy, false),
        afterRaw: raw(afterAuthority, afterLegacy, true), beforeState, afterState,
        nextAction: { ok: true, label: '⛳ Land safely' } };
    };
    const rewrite = (value: any, mutate: (facts: any) => void) => {
      const facts = JSON.parse(value.afterAuthority.raw.receiptRows[1].witness);
      mutate(facts); value.afterAuthority.raw.receiptRows[1].witness = JSON.stringify(facts);
    };
    expect(assess(fixture())).toMatchObject({ ok: true });
    for (const [name, mutate] of [
      ['unknown world', (v: any) => { v.worldKey += ':wrong'; }],
      ['wrong seed draw', (v: any) => { v.beforeAuthority.raw.seed = 68; v.afterAuthority.raw.seed = 68; }],
      ['refusal', (v: any) => { v.afterState.landing.lastOutcome = 'refused:storage'; }],
      ['pending action', (v: any) => { v.afterState.landing.actionCoordinator.inFlight = true; }],
      ['wrong receipt', (v: any) => { v.afterAuthority.raw.receiptRows[1].kind = 'arc9-survey-v1'; }],
      ['missing damage draw', (v: any) => { delete v.afterAuthority.raw.draws['descent.damage']; }],
      ['extra receipt', (v: any) => { v.afterAuthority.raw.receiptKeys.push('receipt:4'); v.afterAuthority.raw.receiptRows.push({ ordinal: 4, kind: 'extra', witness: 'extra' }); }],
      ['HP0', (v: any) => { v.afterRaw.legacy.hp = 0; }],
      ['landing reward', (v: any) => { v.afterRaw.catalogRow.data.land.push(131); }],
      ['other durable reward', (v: any) => { v.afterRaw.inventoryRaw = '{"ess":1}'; }],
      ['live reward', (v: any) => { v.afterState.save.essence += 1; }],
      ['left orbit', (v: any) => { v.afterState.mode = 'surface'; }],
      ['other world learning', (v: any) => { const c = v.afterRaw.catalogRow.extensions['descent.wave-offs']; const x = JSON.parse(c.json); x.records[0][0] += ':wrong'; c.json = JSON.stringify(x); }],
      ['lost unrelated learning', (v: any) => { const c = v.afterRaw.catalogRow.extensions['descent.wave-offs']; const x = JSON.parse(c.json); x.unresolved.pop(); c.json = JSON.stringify(x); }],
      ['malformed prior', (v: any) => { v.beforeRaw.catalogRow.extensions['descent.wave-offs'] = { version: 1, json: '{"schema":"cf-v2-descent-wave-offs/v1","version":1,"records":[null],"unresolved":[]}' }; }],
      ['risk label', (v: any) => { v.nextAction.label = '⛳ Land · 95%'; }],
      ['revisit label', (v: any) => { v.nextAction.label = '⛳ Return safely'; }],
      ['disabled action', (v: any) => { v.nextAction.ok = false; }],
      ['false success', (v: any) => rewrite(v, (f) => { f.descent.kind = 'landed'; })],
      ['Charter credit', (v: any) => rewrite(v, (f) => { f.charter.banked = true; })],
      ['other biome', (v: any) => rewrite(v, (f) => { f.descent.policy.biomeKey = 'glacier'; })],
      ['invented gear', (v: any) => rewrite(v, (f) => { f.descent.policy.globalGearBonus = 5; })],
      ['wrong count', (v: any) => rewrite(v, (f) => { f.descent.waveOffCountAfter = 2; })],
      ['wrong seal', (v: any) => rewrite(v, (f) => { f.waveOffLegacySuccessorSeal = '0'.repeat(64); })],
    ] as const) {
      const value = fixture(); mutate(value);
      expect(assess(value).ok, name).toBe(false);
      expect(assess(fixture()).ok, `${name} restored`).toBe(true);
    }
    for (const [title, x, y] of [['Twin Reach Alpha', -119.83, 75.99], ['Twin Reach Beta', 167.56, -36.82]] as const) {
      const value = fixture();
      const collisionStarKey = `CF1|g:350410949@-7896.51,-370.06|s:127200472@${x},${y}`;
      const collisionWorldKey = `${collisionStarKey}|p:1349616177#0`;
      value.worldKey = collisionWorldKey;
      for (const state of [value.beforeState, value.afterState]) {
        state.navGalaxyKey = 'CF1|g:350410949@-7896.51,-370.06';
        state.navStarKey = collisionStarKey; state.cardTitle = title;
        state.renderedScene.starKey = collisionStarKey;
      }
      value.afterRaw.legacy.wvo = [[901, 3], [902, 5], [1349616177, 1]];
      value.afterRaw.catalogRow.data.wvo = value.afterRaw.legacy.wvo;
      value.afterRaw.legacyRaw = JSON.stringify(value.afterRaw.legacy);
      value.afterAuthority.raw.legacyRaw = value.afterRaw.legacyRaw;
      value.afterRaw.catalogRow.extensions['descent.wave-offs']!.json = JSON.stringify({
        schema: 'cf-v2-descent-wave-offs/v1', version: 1,
        records: [[collisionWorldKey, 1]], unresolved: [[901, 3], [902, 5]],
      });
      rewrite(value, (facts) => {
        facts.worldKey = collisionWorldKey; facts.planetSeed = 1349616177; facts.descentWeather = 'snow';
        facts.waveOffLegacySuccessorSeal = hash('wave-off-legacy', value.afterRaw.legacy.wvo);
        const policy = facts.descent.policy;
        policy.key = collisionWorldKey; policy.address.key = collisionWorldKey;
        policy.address.galaxy = { seed: 350410949, x: -7896.51, y: -370.06 };
        policy.address.star = { seed: 127200472, x, y };
        policy.address.planet = { seed: 1349616177, ordinal: 0 };
        policy.opportunityIdentity = `cf-v2-world-opportunity/v3:${collisionWorldKey}`;
        policy.planetType = 'ice'; policy.biomeKey = 'glacier';
        policy.typeBase = { successPercent: 85, damageMin: 3, damageMax: 4 };
        policy.baseSuccessPercent = 90; policy.stormAdjustedPercent = 90;
        policy.stormActive = true; policy.successPercent = 90;
      });
      expect(assess(value).ok, `${title} independent glacier90 wave-off`).toBe(true);
      const wrongExactWorld = structuredClone(value);
      wrongExactWorld.afterRaw.catalogRow.extensions['descent.wave-offs']!.json = JSON.stringify({
        schema: 'cf-v2-descent-wave-offs/v1', version: 1,
        records: [[title === 'Twin Reach Alpha'
          ? 'CF1|g:350410949@-7896.51,-370.06|s:127200472@167.56,-36.82|p:1349616177#0'
          : 'CF1|g:350410949@-7896.51,-370.06|s:127200472@-119.83,75.99|p:1349616177#0', 1]],
        unresolved: [[901, 3], [902, 5]],
      });
      expect(assess(wrongExactWorld).ok, `${title} identical leaf seed is insufficient`).toBe(false);
      expect(assess(value).ok, `${title} restored exact address`).toBe(true);
    }
    const timerFixture = (nextAt = 100_000_150) => {
      const value: any = fixture();
      const priorAt = 100_000_000;
      // Floor-bound rows move only to the new exact floor; interior stamps
      // and fractional values stay fixed until an actual clamp reaches them.
      const conq = [[501, { t: priorAt - 3_600_000, tier: 4, e: 5 }],
        [502, { t: priorAt - 1_000, tier: 2 }], [503, { t: priorAt - 0.5, tier: 9, e: 12 }]];
      const mined = [[801, priorAt - 18_000_000], [802, priorAt - 500]];
      const clamp = (stamp: number, at: number, window: number) => Math.min(at, Math.max(Math.max(0, at - window), stamp));
      for (const [raw, authority, at, next] of [
        [value.beforeRaw, value.beforeAuthority, priorAt, false],
        [value.afterRaw, value.afterAuthority, nextAt, true],
      ] as const) {
        raw.legacy.at = at; raw.playerRow.data.at = at;
        raw.legacy.conq = conq.map(([id, row]: any) => [id, { ...row,
          t: next ? clamp(row.t, at, 3_600_000) : row.t }]);
        raw.playerRow.data.conq = structuredClone(raw.legacy.conq);
        raw.legacy.minedw = mined.map(([id, stamp]: any) => [id,
          next ? clamp(stamp, at, 18_000_000) : stamp]);
        raw.inventoryRaw = JSON.stringify({ data: { minedw: raw.legacy.minedw, items: [['plate', 3]], mx: [[801, 4]] },
          extensions: { 'fixture-protected': { version: 1, json: 'keep-exact' } } });
        raw.legacyRaw = JSON.stringify(raw.legacy);
        authority.raw.legacyRaw = raw.legacyRaw;
      }
      return value;
    };
    const syncTimerReaders = (value: any) => {
      value.afterRaw.playerRow.data.conq = structuredClone(value.afterRaw.legacy.conq);
      const inventory = JSON.parse(value.afterRaw.inventoryRaw);
      inventory.data.minedw = value.afterRaw.legacy.minedw;
      value.afterRaw.inventoryRaw = JSON.stringify(inventory);
      value.afterRaw.legacyRaw = JSON.stringify(value.afterRaw.legacy);
      value.afterAuthority.raw.legacyRaw = value.afterRaw.legacyRaw;
    };
    expect(assess(timerFixture()).ok, 'exact moving floors and unchanged interior timers').toBe(true);
    expect(assess(timerFixture(99_999_900)).ok, 'backward codec clock uses exact upper clamp').toBe(true);
    for (const [name, mutate] of [
      ['conquest floor wrong', (v: any) => { v.afterRaw.legacy.conq[0][1].t += 1; }],
      ['mined floor wrong', (v: any) => { v.afterRaw.legacy.minedw[0][1] += 1; }],
      ['interior conquest moved', (v: any) => { v.afterRaw.legacy.conq[1][1].t += 150; }],
      ['interior mined moved', (v: any) => { v.afterRaw.legacy.minedw[1][1] += 150; }],
      ['conquest ID changed', (v: any) => { v.afterRaw.legacy.conq[0][0] = 999; }],
      ['mined ID changed', (v: any) => { v.afterRaw.legacy.minedw[0][0] = 999; }],
      ['conquest order changed', (v: any) => { v.afterRaw.legacy.conq.reverse(); }],
      ['mined count changed', (v: any) => { v.afterRaw.legacy.minedw.pop(); }],
      ['epoch reward changed', (v: any) => { v.afterRaw.legacy.conq[0][1].e += 1; }],
      ['conquest tier changed', (v: any) => { v.afterRaw.legacy.conq[0][1].tier += 1; }],
    ] as const) {
      const value = timerFixture(); mutate(value); syncTimerReaders(value);
      expect(assess(value).ok, name).toBe(false);
      expect(assess(timerFixture()).ok, `${name} restored`).toBe(true);
    }
    for (const [name, mutate] of [
      ['legacy/partition conquest mismatch', (v: any) => { v.afterRaw.playerRow.data.conq[0][1].t += 1; }],
      ['encoded legacy mismatch', (v: any) => { const x = JSON.parse(v.afterRaw.legacyRaw); x.minedw[0][1] += 1; v.afterRaw.legacyRaw = JSON.stringify(x); v.afterAuthority.raw.legacyRaw = v.afterRaw.legacyRaw; }],
      ['inventory timer mismatch', (v: any) => { const x = JSON.parse(v.afterRaw.inventoryRaw); x.data.minedw[0][1] += 1; v.afterRaw.inventoryRaw = JSON.stringify(x); }],
      ['inventory reward neighbor', (v: any) => { const x = JSON.parse(v.afterRaw.inventoryRaw); x.data.items[0][1] += 1; v.afterRaw.inventoryRaw = JSON.stringify(x); }],
      ['inventory epoch neighbor', (v: any) => { const x = JSON.parse(v.afterRaw.inventoryRaw); x.data.mx[0][1] += 1; v.afterRaw.inventoryRaw = JSON.stringify(x); }],
      ['inventory extension neighbor', (v: any) => { const x = JSON.parse(v.afterRaw.inventoryRaw); x.extensions['fixture-protected'].json = 'changed'; v.afterRaw.inventoryRaw = JSON.stringify(x); }],
      ['noncanonical predecessor floor', (v: any) => { v.beforeRaw.legacy.conq[0][1].t -= 1; }],
    ] as const) {
      const value = timerFixture(); mutate(value);
      expect(assess(value).ok, name).toBe(false);
      expect(assess(timerFixture()).ok, `${name} restored`).toBe(true);
    }
    const heldFixture = () => {
      const value: any = fixture();
      value.beforeState.persistence.documentToken = value.beforeAuthority.token;
      const held = structuredClone(value.beforeState);
      const hold = { schema: 'cf-v2-product-action-hold-diagnostics/v1', phase: 'holding',
        operation: `arc0.land:${'a'.repeat(64)}`, sequence: 1 };
      held.landing.actionCoordinator = { ...held.landing.actionCoordinator, inFlight: true,
        owner: { schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy: true, operation: hold.operation }, hold };
      value.landingHoldProof = { held, protectedState: structuredClone(held), released: true };
      value.afterState.landing.actionCoordinator.hold = { ...hold, phase: 'released' };
      return value;
    };
    expect(assess(heldFixture()).ok).toBe(true);
    const noProof = heldFixture(); delete noProof.landingHoldProof;
    expect(assess(noProof).ok, 'released hold remains rejected by default').toBe(false);
    expect(arc0LandingCoordinatorIsIdle(heldFixture().afterState, { clearFault: true })).toBe(false);
    for (const [name, mutate] of [
      ['wrong operation', (v: any) => { v.afterState.landing.actionCoordinator.hold.operation = `arc0.land:${'b'.repeat(64)}`; }],
      ['wrong sequence', (v: any) => { v.afterState.landing.actionCoordinator.hold.sequence = 2; }],
      ['still holding', (v: any) => { v.afterState.landing.actionCoordinator.hold.phase = 'holding'; }],
      ['missing held', (v: any) => { delete v.landingHoldProof.held; }],
      ['missing protected', (v: any) => { delete v.landingHoldProof.protectedState; }],
      ['missing release', (v: any) => { delete v.landingHoldProof.released; }],
      ['failed release', (v: any) => { v.landingHoldProof.released = false; }],
      ['protected mismatch', (v: any) => { v.landingHoldProof.protectedState.landing.actionCoordinator.hold.sequence = 2; }],
      ['held wrong operation', (v: any) => { v.landingHoldProof.held.landing.actionCoordinator.hold.operation = `arc0.land:${'b'.repeat(64)}`; }],
      ['held wrong document', (v: any) => { v.landingHoldProof.held.persistence.documentToken = 'wrong-document'; }],
      ['protected wrong authority', (v: any) => { v.landingHoldProof.protectedState.persistence.runtime.sessionOrdinal += 1; }],
      ['still in flight', (v: any) => { v.afterState.landing.actionCoordinator.inFlight = true; }],
      ['held reward changed', (v: any) => { v.afterRaw.playerRow.data.ess += 1; }],
    ] as const) {
      const value = heldFixture(); mutate(value);
      expect(assess(value).ok, name).toBe(false);
      expect(assess(heldFixture()).ok, `${name} restored`).toBe(true);
    }
    for (const [name, mutate] of [
      ['missing timestamp', (v: any) => { delete v.afterRaw.legacy.at; }],
      ['fractional timestamp', (v: any) => { v.afterRaw.legacy.at = 1.5; }],
      ['negative timestamp', (v: any) => { v.beforeRaw.legacy.at = -1; }],
      ['player timestamp mismatch', (v: any) => { v.afterRaw.playerRow.data.at += 1; }],
      ['before timestamp mismatch', (v: any) => { v.beforeRaw.playerRow.data.at += 1; }],
      ['encoded timestamp mismatch', (v: any) => { const raw = JSON.parse(v.afterRaw.legacyRaw); raw.at += 1; v.afterRaw.legacyRaw = JSON.stringify(raw); }],
      ['adjacent protected reward', (v: any) => { v.afterRaw.playerRow.data.ess += 1; }],
    ] as const) {
      const value = fixture(); mutate(value);
      expect(assess(value).ok, name).toBe(false);
      expect(assess(fixture()).ok, `${name} restored`).toBe(true);
    }
    const earlierClock = fixture();
    earlierClock.afterRaw.legacy.at = 900;
    earlierClock.afterRaw.playerRow.data.at = 900;
    earlierClock.afterRaw.legacyRaw = JSON.stringify(earlierClock.afterRaw.legacy);
    earlierClock.afterAuthority.raw.legacyRaw = earlierClock.afterRaw.legacyRaw;
    expect(assess(earlierClock).ok, 'writer clock is valid and matched, not assumed monotonic').toBe(true);
    proveEachMarkerRequired(sliceSource, [
      ['Charter-only released hold evidence', 'landingHoldProof: expectedChapter === 3 ? ceremonyRace : null'],
    ]);
    const desktop = section(sliceSource, '  const completeDesktopMercuryLand = async (label, { migratedDocumentToken = null } = {}) => {',
      '  /* Complete the fresh Chapter-1 landfall goal with a second genuine Sol');
    proveEachMarkerRequired(desktop, [
      ['real Survey predecessor', 'api.surveyOn(${JSON.stringify(MERCURY)})'],
      ['wave-off only branch', "if (first.facts?.descent?.kind === 'wave-off')"],
      ['durable wave-off proof', 'const assessment = assessBoundedDescentWaveOff(evidence);'],
      ['no second action on invalid first result', 'if (accepted !== false || !assessment.ok)'],
      ['one learned approach', 'const learnedAccepted = await evalIn(`(async()=>await window.__CF_SLICE__.api.landHere())()`);'],
      ['guaranteed learned result', 'learned.facts?.descent?.policy?.successPercent !== 100'],
    ]);
    expect(occurrences(desktop, 'api.landHere()')).toBe(2);
    expect(desktop).not.toMatch(/\b(?:for|while)\s*\(/u);
    const collision = section(sliceSource, '    const landBeforeAuthority = addAuthority;', '    const landed = landAuthority.state;');
    proveEachMarkerRequired(collision, [
      ['collision wave-off only', "if (first.facts?.descent?.kind === 'wave-off')"],
      ['exact collision proof', 'const assessment = assessBoundedDescentWaveOff(evidence);'],
      ['first trusted pointer', "landPress.pointer?.trusted !== true || landPress.pointer?.act !== 'landcta'"],
      ['preserve first pointer', 'const landApproachPointers = [landPress.pointer];'],
      ['preserve second pointer', 'landApproachPointers.push(landPress.pointer);'],
      ['guaranteed collision result', 'learned.facts?.descent?.policy?.successPercent !== 100'],
    ]);
    expect(occurrences(collision, "nativeControlClick(collisionTarget.session, '#survey [data-act=\"landcta\"]')")).toBe(2);
  });

  it('classifies refused, wrong-document and never-settled actions before generic harness handling', () => {
    const exact = {
      actualAccepted: true,
      expectedAccepted: true,
      actionDocumentToken: 'document:pertar',
      expectedDocumentToken: 'document:pertar',
      waitError: null,
    };
    expect(assessArc0LandingAwaitBoundary(exact)).toEqual({ ok: true, reasons: [] });
    const controls = {
      refused: assessArc0LandingAwaitBoundary({ ...exact, actualAccepted: false }),
      wrongDocument: assessArc0LandingAwaitBoundary({
        ...exact, actionDocumentToken: 'document:other',
      }),
      neverSettled: assessArc0LandingAwaitBoundary({
        ...exact, waitError: 'exact settlement timed out with retained state',
      }),
      wrongAcceptedRefusal: assessArc0LandingAwaitBoundary({
        ...exact, expectedAccepted: false,
      }),
    };
    expect(controls.refused).toEqual({
      ok: false, reasons: ['accepted false !== true'],
    });
    expect(controls.wrongDocument).toEqual({
      ok: false, reasons: ['action document token drifted'],
    });
    expect(controls.neverSettled).toEqual({
      ok: false,
      reasons: ['expected stage did not settle: exact settlement timed out with retained state'],
    });
    expect(controls.wrongAcceptedRefusal).toEqual({
      ok: false, reasons: ['accepted true !== false'],
    });
  });

  it('evaluates every absolute post-Survey Pertar route/card/share field browser-free', () => {
    const exact = exactPertarSurveyRouteEvidence();
    expect(arc0LandingSurveyRouteIsExact(exact)).toBe(true);
    const mutateState = (change: (state: any) => void) => {
      const control = structuredClone(exact);
      change(control.state);
      return arc0LandingSurveyRouteIsExact(control);
    };
    const mutatePayload = (change: (payload: any) => void) => {
      const control = structuredClone(exact);
      const payload = structuredClone(PERTAR_PAYLOAD);
      change(payload);
      control.cardCode = encodeCf1(payload);
      return arc0LandingSurveyRouteIsExact(control);
    };
    expect({
      mode: mutateState((state) => { state.mode = 'surface'; }),
      galaxySeed: mutateState((state) => { state.gal += 1; }),
      galaxyX: mutateState((state) => { state.galX += 1; }),
      galaxyY: mutateState((state) => { state.galY += 1; }),
      starSeed: mutateState((state) => { state.star += 1; }),
      starX: mutateState((state) => { state.starX += 1; }),
      starY: mutateState((state) => { state.starY += 1; }),
      planet: mutateState((state) => { state.planet = 546_621_068; }),
      planetOrdinal: mutateState((state) => { state.planetOrdinal = 3; }),
      galaxyKey: mutateState((state) => { state.navGalaxyKey += ':control'; }),
      starKey: mutateState((state) => { state.navStarKey += ':control'; }),
      worldKey: mutateState((state) => { state.navWorldKey = 'control'; }),
      cardClosed: mutateState((state) => { state.cardOpen = false; }),
      cardTitle: mutateState((state) => { state.cardTitle = 'Not Pertar'; }),
      stateEpoch: mutateState((state) => { state.epoch += 1; }),
      renderedSerial: mutateState((state) => { state.renderedScene.serial = 0; }),
      renderedMode: mutateState((state) => { state.renderedScene.mode = 'surface'; }),
      renderedEpoch: mutateState((state) => { state.renderedScene.ecologyEpoch += 1; }),
      renderedGalaxy: mutateState((state) => { state.renderedScene.galaxyKey += ':control'; }),
      renderedStar: mutateState((state) => { state.renderedScene.starKey += ':control'; }),
      renderedWorld: mutateState((state) => { state.renderedScene.worldKey = 'control'; }),
      renderedExtra: mutateState((state) => { state.renderedScene.extra = true; }),
      invalidCode: arc0LandingSurveyRouteIsExact({ ...exact, cardCode: 'not-cf1' }),
      nonCanonicalCode: arc0LandingSurveyRouteIsExact({
        ...exact, cardCode: `${exact.cardCode}!`,
      }),
      payloadType: mutatePayload((payload) => { payload.t = 's'; }),
      payloadGalaxyX: mutatePayload((payload) => { payload.g[0] += 1; }),
      payloadGalaxyY: mutatePayload((payload) => { payload.g[1] += 1; }),
      payloadGalaxySize: mutatePayload((payload) => { payload.g[2] += 1; }),
      payloadGalaxySp: mutatePayload((payload) => { payload.g[3] += 1; }),
      payloadGalaxyTilt: mutatePayload((payload) => { payload.g[4] += 1; }),
      payloadGalaxyRot: mutatePayload((payload) => { payload.g[5] += 1; }),
      payloadGalaxySeed: mutatePayload((payload) => { payload.g[6] += 1; }),
      payloadGalaxyFlags: mutatePayload((payload) => { payload.g[7] += 1; }),
      payloadGalaxyLength: mutatePayload((payload) => { payload.g.push(0); }),
      payloadStarX: mutatePayload((payload) => { payload.s[0] += 1; }),
      payloadStarY: mutatePayload((payload) => { payload.s[1] += 1; }),
      payloadStarSeed: mutatePayload((payload) => { payload.s[2] += 1; }),
      payloadStarLength: mutatePayload((payload) => { payload.s.push(0); }),
      payloadPlanet: mutatePayload((payload) => { payload.p += 1; }),
      payloadExtra: mutatePayload((payload) => { payload.extra = true; }),
      targetSeed: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, seed: exact.target.seed + 1 },
      }),
      targetOrdinal: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, ordinal: exact.target.ordinal + 1 },
      }),
      targetScreenX: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, screenX: Number.NaN },
      }),
      targetScreenY: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, screenY: Number.POSITIVE_INFINITY },
      }),
      targetWidth: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, width: 0 },
      }),
      targetHeight: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, height: -1 },
      }),
      targetExtra: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, extra: true },
      }),
    }).toEqual(Object.fromEntries([
      'mode', 'galaxySeed', 'galaxyX', 'galaxyY', 'starSeed', 'starX', 'starY',
      'planet', 'planetOrdinal', 'galaxyKey', 'starKey', 'worldKey', 'cardClosed',
      'cardTitle', 'stateEpoch', 'renderedSerial', 'renderedMode', 'renderedEpoch',
      'renderedGalaxy', 'renderedStar', 'renderedWorld', 'renderedExtra', 'invalidCode',
      'nonCanonicalCode', 'payloadType', 'payloadGalaxyX', 'payloadGalaxyY',
      'payloadGalaxySize', 'payloadGalaxySp', 'payloadGalaxyTilt', 'payloadGalaxyRot',
      'payloadGalaxySeed', 'payloadGalaxyFlags', 'payloadGalaxyLength', 'payloadStarX',
      'payloadStarY', 'payloadStarSeed', 'payloadStarLength', 'payloadPlanet',
      'payloadExtra', 'targetSeed', 'targetOrdinal', 'targetScreenX', 'targetScreenY',
      'targetWidth', 'targetHeight', 'targetExtra',
    ].map((key) => [key, false])));
  });

  it('admits an exact post-Survey held publication and rejects product or route drift locally', () => {
    const beforeProduct = {
      mode: 'system',
      gal: 31337,
      galX: 4,
      galY: -2,
      star: 4242,
      starX: 1,
      starY: 3,
      planet: null,
      planetOrdinal: null,
      navGalaxyKey: 'g:pertar',
      navStarKey: 'g:pertar|s:pertar',
      navWorldKey: null,
      save: { landed: [], cargo: [['ferrite', 2]], stats: { landings: 0 } },
    };
    const route = exactPertarSurveyRouteEvidence();
    const exact = {
      beforeProduct,
      heldProduct: structuredClone(beforeProduct),
      heldState: route.state,
      cardCode: route.cardCode,
      target: route.target,
    };
    expect(assessArc0LandingPublicationWithheld(exact)).toEqual({
      ok: true, reasons: [],
    });

    const productMutations: Record<string, (product: any) => void> = {
      mode: (product) => { product.mode = 'surface'; },
      gal: (product) => { product.gal += 1; },
      galX: (product) => { product.galX += 1; },
      galY: (product) => { product.galY += 1; },
      star: (product) => { product.star += 1; },
      starX: (product) => { product.starX += 1; },
      starY: (product) => { product.starY += 1; },
      planet: (product) => { product.planet = 546_621_068; },
      planetOrdinal: (product) => { product.planetOrdinal = 3; },
      navGalaxyKey: (product) => { product.navGalaxyKey += ':control'; },
      navStarKey: (product) => { product.navStarKey += ':control'; },
      navWorldKey: (product) => { product.navWorldKey = 'control'; },
      save: (product) => { product.save.stats.landings += 1; },
    };
    expect(Object.fromEntries(Object.entries(productMutations).map(([name, mutate]) => {
      const heldProduct = structuredClone(beforeProduct);
      mutate(heldProduct);
      return [name, assessArc0LandingPublicationWithheld({ ...exact, heldProduct })];
    }))).toEqual(Object.fromEntries(Object.keys(productMutations).map((name) => [name, {
      ok: false,
      reasons: ['old document live product changed before replacement'],
    }])));

    const optimisticProduct = structuredClone(beforeProduct);
    optimisticProduct.save.stats.landings = 1;
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      heldProduct: optimisticProduct,
    })).toEqual({
      ok: false,
      reasons: ['old document live product changed before replacement'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      heldState: { ...route.state, cardOpen: false },
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      cardCode: 'CF1-not-a-valid-card',
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      target: { ...route.target, ordinal: route.target.ordinal + 1 },
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      beforeProduct: undefined,
      heldProduct: undefined,
      heldState: route.state,
      cardCode: route.cardCode,
      target: route.target,
    })).toEqual({
      ok: false,
      reasons: ['old document live product evidence was incomplete'],
    });
  });

  it('rejects incomplete fault latches and any non-idle product hold', () => {
    const exact = {
      landing: {
        schema: 'cf-v2-arc0-landing-app-state/v1',
        actionCoordinator: {
          inFlight: false,
          owner: {
            schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
            busy: false,
            operation: null,
          },
          hold: {
            schema: 'cf-v2-product-action-hold-diagnostics/v1',
            phase: 'idle',
            operation: null,
            sequence: 0,
          },
          faultArmed: {
            storageFailure: false,
            staleAuthority: false,
            publicationFailure: false,
          },
          lastFault: null,
        },
      },
    };
    expect(arc0LandingCoordinatorIsIdle(exact, { clearFault: true })).toBe(true);
    const mutate = (change: (coordinator: any) => void) => {
      const control = structuredClone(exact);
      change(control.landing.actionCoordinator);
      return arc0LandingCoordinatorIsIdle(control, { clearFault: true });
    };
    expect({
      missingFaultKey: mutate((coordinator) => {
        delete coordinator.faultArmed.storageFailure;
      }),
      renamedFaultKey: mutate((coordinator) => {
        delete coordinator.faultArmed.storageFailure;
        coordinator.faultArmed.storageFailureRenamed = false;
      }),
      extraFalseFaultKey: mutate((coordinator) => {
        coordinator.faultArmed.unexpectedFault = false;
      }),
      armedFault: mutate((coordinator) => {
        coordinator.faultArmed.storageFailure = true;
      }),
      missingHold: mutate((coordinator) => { delete coordinator.hold; }),
      wrongHoldSchema: mutate((coordinator) => {
        coordinator.hold.schema = 'cf-v2-product-action-hold-diagnostics/control';
      }),
      heldPhase: mutate((coordinator) => { coordinator.hold.phase = 'holding'; }),
      retainedOperation: mutate((coordinator) => {
        coordinator.hold.operation = 'arc0.landing-control';
      }),
      advancedSequence: mutate((coordinator) => { coordinator.hold.sequence = 1; }),
      extraHoldField: mutate((coordinator) => { coordinator.hold.extra = false; }),
      extraCoordinatorField: mutate((coordinator) => { coordinator.extra = false; }),
    }).toEqual({
      missingFaultKey: false,
      renamedFaultKey: false,
      extraFalseFaultKey: false,
      armedFault: false,
      missingHold: false,
      wrongHoldSchema: false,
      heldPhase: false,
      retainedOperation: false,
      advancedSequence: false,
      extraHoldField: false,
      extraCoordinatorField: false,
    });
    const retainedFault = structuredClone(exact);
    (retainedFault.landing.actionCoordinator as any).lastFault = { phase: 'settled' };
    expect(arc0LandingCoordinatorIsIdle(retainedFault)).toBe(true);
    expect(arc0LandingCoordinatorIsIdle(retainedFault, { clearFault: true })).toBe(false);
  });

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
      ['Pertar absent from source legacy Survey ledger', '!raw?.legacy?.surveyed?.includes(ARC4_PERTAR_FIXTURE.worldKey)'],
      ['Pertar absent from source split Survey ledger', '!raw?.catalogRow?.data?.surveyed?.includes(ARC4_PERTAR_FIXTURE.worldKey)'],
      ['source Survey ledger mirror parity', 'canonicalJson(raw?.legacy?.surveyed)\n        === canonicalJson(raw?.catalogRow?.data?.surveyed)'],
      ['source receipt arrays aligned', 'arc0LandingReceiptArraysAligned(raw)'],
      ['zero landing receipts', 'arc0LandingReceipts(raw).length === 0'],
      ['zero Survey receipts', 'arc0LandingSurveyReceipts(raw).length === 0'],
      ['source requires clear fault', '&& arc0LandingSurveyReceipts(raw).length === 0\n      && arc0LandingCoordinatorIdle(state, { clearFault: true });'],
    ]);
  });

  it('proves a read-only living Pertar inspection before the one Landing transaction', () => {
    proveEachMarkerRequired(surveyContractOwner, [
      ["synthetic Survey receipt hash schema", "const arc0LandingSurveyReceiptPattern = /^arc9sv1:[0-9a-f]{64}$/u;"],
      ["synthetic Pertar witness for write rejection", "'arc9sv1:21678a94072ba2e5d0df32cdde8454d265cf0edac9310acf98576d2696244ece';"],
      ["Survey receipt kind", ".filter(({ row }) => row?.kind === 'arc9-survey-v1');"],
      ["shared exact post-inspection route", "arc0LandingSurveyRouteIsExact({ state, cardCode, target })"],
      ["one downstream receipt delta", "after.length === before.length + 1"],
      ["zero source Survey receipts", "return arc0LandingSurveyReceipts(beforeRaw).length === 0"],
      ["zero inspection Survey receipts", "&& arc0LandingSurveyReceipts(afterRaw).length === 0"],
      ["receipt keys unchanged", "canonicalJson(afterRaw?.receiptKeys) === canonicalJson(beforeRaw?.receiptKeys)"],
      ["receipt bytes unchanged", "canonicalJson(afterRaw?.receiptRawRows) === canonicalJson(beforeRaw?.receiptRawRows)"],
      ["downstream prefix retained", "before.every(({ key, raw }) => afterByKey.get(key) === raw)"],
      ["Survey identity absent before", "!before.surveyed.includes(ARC4_PERTAR_FIXTURE.worldKey)"],
      ["Survey identity absent after", "!after.surveyed?.includes(ARC4_PERTAR_FIXTURE.worldKey)"],
      ["Ocean facts remain undiscovered", "!before.ptypes.includes('ocean') && !after.ptypes?.includes('ocean')"],
      ["exact retained rank", "before.bestRank === 3 && after.bestRank === 3"],
      ["complete owned facts unchanged", "canonicalJson(after) === canonicalJson(before)"],
      ["complete save row bytes unchanged", "'settingsRaw', 'authorityJson'].every((field) => afterRaw?.[field] === beforeRaw?.[field])"],
      ["legacy/split surveyed parity", "canonicalJson(legacy?.surveyed) === canonicalJson(catalog?.surveyed)"],
      ["legacy/split type parity", "canonicalJson(legacy?.ptypes) === canonicalJson(catalog?.ptypes)"],
      ["live Survey count", "state?.save?.stats?.surveys === legacy?.surveyed?.length"],
      ["live best rank", "state?.save?.stats?.bestRank === legacy?.br"],
      ["live achievements", "canonicalJson(state?.save?.unlocked) === canonicalJson(legacy?.ach)"],
      ["unchanged persistence outcome", "state?.persistence?.lastOutcome === sourceFixture?.state?.persistence?.lastOutcome"],
      ["unchanged Survey outcome", "state?.landing?.surveyOutcome === sourceFixture?.state?.landing?.surveyOutcome"],
      ["unchanged runtime commits", "runtime?.commits === sourceFixture?.state?.persistence?.runtime?.commits\n"],
      ["idle Survey coordinator", "&& state?.landing?.lastOutcome === null\n        && arc0LandingCoordinatorIdle(state, { clearFault: true })"],
      ["exact coordinator contract", "arc0LandingCoordinatorIsIdle(state, options)"],
    ]);
    proveEachMarkerRequired(surveySetupOwner, [
      ['source-proven prerequisite', 'source: arc0LandingSourceExact(sourceFixture),'],
      ['explicit Survey accepted', 'explicitSurvey: evidence?.surveyAction?.accepted === true'],
      ['Survey action token', 'evidence?.surveyAction?.documentToken === sourceFixture?.token'],
      ['awaited Survey revision', 'awaitedSettlement: evidence?.surveySettledState?.persistence?.runtime?.revision'],
      ['unchanged awaited Survey outcome', '=== sourceFixture?.state?.persistence?.lastOutcome'],
      ['same document baseline', 'evidence?.surveyedReady?.token === sourceFixture?.token'],
      ['unchanged global revision', 'noAtomicCommit: afterRaw?.revision === beforeRaw?.revision'],
      ['unchanged authority ordinal', 'afterAuthority?.ordinal === beforeAuthority?.ordinal'],
      ['zero Survey receipts', 'noSurveyReceipt: arc0LandingSurveyReceiptsUnchanged(beforeRaw, afterRaw),'],
      ['unchanged durable Survey', 'durableSurveyUnchanged: arc0LandingSurveyStateUnchanged(beforeRaw, afterRaw),'],
      ['current Survey route', 'currentRoute: arc0LandingSurveyRouteExact('],
      ['current Survey publication', 'currentLivePublication: arc0LandingSurveyLivePublicationExact('],
      ['still unlanded', 'landingStillUnlanded: !fixture?.state?.save?.landed?.includes('],
      ['no Landing receipt', 'arc0LandingReceipts(afterRaw).length === 0'],
      ['saved source route', 'arc4PertarSavedStarRouteExact(fixture?.state)'],
    ]);
  });

  it('collects one awaited action across a held and explicitly released convergence reload', () => {
    const markers = [
      ['fresh source fixture', 'const sourceFixture = await installArc0LandingFaultFixture(label);'],
      ['expected Survey revision', 'const expectedSurveyRevision = sourceFixture.raw.revision;'],
      ['explicit awaited Survey', 'const accepted=await S.api.surveyOn(${JSON.stringify(ARC4_PERTAR_FIXTURE.planet)});'],
      ['Survey settlement wait', 'surveySettledState = await waitDesktopValue(`${label} Survey settlement`'],
      ['exact current Survey card', "&&s.planet===null&&s.planetOrdinal===null&&s.cardOpen===true&&s.cardTitle==='Pertar'"],
      ['unchanged Survey outcome wait', '&&s.persistence?.lastOutcome===${JSON.stringify(sourceFixture.state.persistence.lastOutcome)}'],
      ['Survey writable wait', '`${label} post-Survey writable authority`,'],
      ['same-document writable check', 'previousToken: sourceFixture.priorToken'],
      ['post-Survey durable sample', 'raw=await (${ARC4_DURABLE_READ_EXPRESSION});return {state:S.api.state(),raw,'],
      ['post-Survey card sample', 'raw=await (${ARC4_DURABLE_READ_EXPRESSION});return {state:S.api.state(),raw,\n        cardCode:S.api.cardShareCode(),target:S.api.planetScreenTarget('],
      ['post-Survey baseline fixture', '...sourceFixture, state: surveyBaseline.state, raw: surveyBaseline.raw,'],
      ['Survey setup assessment', 'const surveyAssessment = assessArc0LandingSurveySetup(surveyEvidence);'],
      ['pre-Survey baseline control', 'preSurveyBaselineControl.fixture = structuredClone('],
      ['injected receipt control', 'const syntheticSurveyReceipt = {'],
      ['valid-hash witness control', "row.witness = `arc9sv1:${'0'.repeat(64)}`;"],
      ['witness raw-row realignment', 'surveyWitnessControl.fixture.raw.receiptRawRows[surveyReceiptIndex]\n        = JSON.stringify(row);'],
      ['witness mutation applied', 'surveyWitnessControlMutated = row.witness !== ARC0_PERTAR_SURVEY_RECEIPT_WITNESS'],
      ['route control', "surveyRouteControl.fixture.state.cardTitle = 'Not Pertar';"],
      ['live-publication control', 'surveyPublicationControl.fixture.state.save.stats.surveys += 1;'],
      ['coordinator control factory', 'const surveyCoordinatorControl = (mutate) => {'],
      ['missing fault-key control', 'const surveyFaultMissingControl = surveyCoordinatorControl((coordinator) => {'],
      ['wrong fault-key control', 'coordinator.faultArmed.storageFailureRenamed = false;'],
      ['extra fault-key control', 'coordinator.faultArmed.unexpectedFault = false;'],
      ['armed fault control', 'coordinator.faultArmed.storageFailure = true;'],
      ['hold schema control', "coordinator.hold.schema = 'cf-v2-product-action-hold-diagnostics/control';"],
      ['hold phase control', "coordinator.hold.phase = 'armed';"],
      ['hold operation control', "coordinator.hold.operation = 'arc0.landing-control';"],
      ['hold sequence control', 'coordinator.hold.sequence = 1;'],
      ['pre-Survey rejection', 'preSurveyBaseline: assessArc0LandingSurveySetup(preSurveyBaselineControl),'],
      ['receipt isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.receipt, 'noSurveyReceipt')"],
      ['valid-hash witness isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.witness, 'noSurveyReceipt')"],
      ['route isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.route, 'currentRoute')"],
      ['publication isolated red', "surveyControls.publication, 'currentLivePublication',"],
      ['missing fault-key isolated red', "surveyControls.faultMissing, 'currentLivePublication',"],
      ['wrong fault-key isolated red', "surveyControls.faultWrongKey, 'currentLivePublication',"],
      ['extra fault-key isolated red', "surveyControls.faultExtra, 'currentLivePublication',"],
      ['armed fault isolated red', "surveyControls.faultArmed, 'currentLivePublication',"],
      ['hold schema isolated red', "surveyControls.holdSchema, 'currentLivePublication',"],
      ['hold phase isolated red', "surveyControls.holdPhase, 'currentLivePublication',"],
      ['hold operation isolated red', "surveyControls.holdOperation, 'currentLivePublication',"],
      ['hold sequence isolated red', "surveyControls.holdSequence, 'currentLivePublication',"],
      ['Survey causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING SURVEY SETUP: living-world inspection did not retain its exact no-write fixed point before Landing faults were armed:"],
      ['old document token', 'const beforeToken = fixture.token;'],
      ['event ledger mark', 'const convergenceMark = events.length;'],
      ['convergence hold arm', "'window.__CF_SLICE__.api.__smokeArmF4ConvergenceReloadHold()'"],
      ['one exact fault arm', 'const faultArmed = await evalIn(`window.__CF_SLICE__.api.${faultHook}()`);'],
      ['one awaited current-card Landing', 'const accepted=await S.api.landHere();'],
      ['held phase wait', "s?.persistence?.convergenceReloadHold?.phase==='holding'"],
      ['settled owner wait', "s?.landing?.actionCoordinator?.inFlight===false"],
      ['exact fault wait', 'fault?.injection===${JSON.stringify(injection)}&&fault?.outcome===${JSON.stringify(faultOutcome)}'],
      ['atomic held route/card sample', '?{state:s,cardCode:S.api.cardShareCode(),target:S.api.planetScreenTarget('],
      ['held state extracted before release', 'const heldState = heldObservation.state;'],
      ['held card code extracted before release', 'const heldCardCode = heldObservation.cardCode;'],
      ['held target extracted before release', 'const heldTarget = heldObservation.target;'],
      ['held durable read', 'const heldRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['single release', "'window.__CF_SLICE__.api.__smokeReleaseF4ConvergenceReload()'"],
      ['new document wait', 'await waitForSlice(sess, `${label} replacement`, { previousToken: beforeToken });'],
      ['new writable authority', 'previousToken: beforeToken,'],
      ['reloaded heartbeat quiescence', "'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()'"],
      ['reloaded state', "const reloadedState = await evalIn('window.__CF_SLICE__.api.state()');"],
      ['reloaded durable read', 'const reloadedRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['one convergence witness source', 'f4ConvergenceWitnessesSince(sess, convergenceMark)'],
      ['retained action token', 'accepted: action?.accepted, actionDocumentToken: action?.documentToken,'],
      ['scenario-specific acceptance', 'expectedAccepted: accepted,\n    };'],
      ['receipt control alignment precondition', 'const surveyReceiptControlAligned = arc0LandingReceiptArraysAligned('],
      ['receipt control write guard', 'surveyReceiptControl.fixture.raw.receiptRows.push(syntheticSurveyReceipt);'],
      ['Survey delta control factory', 'const surveyDeltaControl = (mutate) => {'],
      ['control legacy bytes rewritten', 'control.fixture.raw.legacyRaw = JSON.stringify(control.fixture.raw.legacy);'],
      ['control catalog bytes rewritten', 'control.fixture.raw.catalogRaw = JSON.stringify(control.fixture.raw.catalogRow);'],
      ['control player bytes rewritten', 'control.fixture.raw.playerRaw = JSON.stringify(control.fixture.raw.playerRow);'],
      ['Ocean legacy mutant', "raw.legacy.ptypes.push('ocean');"],
      ['Ocean split mutant', "raw.catalogRow.data.ptypes.push('ocean');"],
      ['rank durable mutant', 'raw.legacy.br = 4;'],
      ['rank live mutant', 'state.save.stats.bestRank = 4;'],
      ['achievement durable mutant', "raw.legacy.ach.push('arc0-survey-control');"],
      ['achievement live mutant', "state.save.unlocked.push('arc0-survey-control');"],
      ['Ocean control assessment', 'ptype: assessArc0LandingSurveySetup(surveyPtypeControl),'],
      ['rank control assessment', 'rank: assessArc0LandingSurveySetup(surveyRankControl),'],
      ['achievement control assessment', 'unlocked: assessArc0LandingSurveySetup(surveyUnlockedControl),'],
      ['Ocean isolated red', "surveyControls.ptype, 'durableSurveyUnchanged',"],
      ['rank isolated red', "surveyControls.rank, 'durableSurveyUnchanged',"],
      ['achievement isolated red', "surveyControls.unlocked, 'durableSurveyUnchanged',"],
      ['Survey action boundary classifier', 'const surveyActionBoundary = assessArc0LandingAwaitBoundary({'],
      ['Survey rejection named fail-stop', 'explicit Survey was refused or changed document before its settlement wait:'],
      ['Survey settlement named fail-stop', 'accepted Survey did not reach its exact current-route settlement:'],
      ['Survey writable named fail-stop', 'settled Survey did not reacquire exact writable authority:'],
      ['Landing action boundary classifier', 'const actionBoundary = assessArc0LandingAwaitBoundary({'],
      ['Landing held named fail-stop', 'one awaited Landing did not reach its exact held coordinator/fault settlement:'],
      ['Landing replacement named fail-stop', 'released Landing convergence did not reach its exact replacement authority:'],
      ['source prerequisite check', 'const sourcePrerequisite = arc0LandingSourceExact(sourceFixture);'],
      ['source prerequisite fail-stop', 'source fixture was not exact before Survey; no product action was issued:'],
      ['retained source fault control', "sourceRetainedFaultControl.state.landing.actionCoordinator.lastFault = {"],
      ['retained source fault rejection', 'const sourceRetainedFaultRejected = !arc0LandingSourceExact('],
      ['retained source fault fail-stop', 'retained source fault control did not reject before Survey; no product action was issued:'],
      ['positive Survey fail-stop', 'explicit Survey positive baseline was not exact; controls and Landing faults were not issued:'],
      ['hold arm fail-stop', 'convergence hold did not arm; fault and Landing were not issued:'],
      ['fault arm fail-stop', 'scenario fault did not arm; Landing was not issued:'],
      ['Survey invocation named fail-stop', 'exact Survey invocation failed before its settlement wait:'],
      ['Landing invocation named fail-stop', 'exact Landing invocation failed before held settlement:'],
    ] as const satisfies readonly Marker[];
    const marker = (label: string): string => {
      const row = markers.find(([candidate]) => candidate === label);
      expect(row, `known order marker: ${label}`).toBeDefined();
      return row![1];
    };
    const order = [
      { label: 'fixture before Survey', first: marker('fresh source fixture'), second: marker('explicit awaited Survey') },
      { label: 'source proof before Survey', first: marker('source prerequisite check'), second: marker('explicit awaited Survey') },
      { label: 'source retained-fault rejection before Survey', first: marker('retained source fault rejection'), second: marker('explicit awaited Survey') },
      { label: 'Survey before settlement wait', first: marker('explicit awaited Survey'), second: marker('Survey settlement wait') },
      { label: 'settlement before writable', first: marker('Survey settlement wait'), second: marker('Survey writable wait') },
      { label: 'writable before baseline sample', first: marker('Survey writable wait'), second: marker('post-Survey durable sample') },
      { label: 'baseline before assessment', first: marker('post-Survey durable sample'), second: marker('Survey setup assessment') },
      { label: 'positive Survey fail-stop before controls', first: marker('positive Survey fail-stop'), second: marker('pre-Survey baseline control') },
      { label: 'assessment before controls', first: marker('Survey setup assessment'), second: marker('pre-Survey baseline control') },
      { label: 'controls before causal boundary', first: marker('publication isolated red'), second: marker('Survey causal fail-stop') },
      { label: 'Survey boundary before hold', first: marker('Survey causal fail-stop'), second: marker('convergence hold arm') },
      { label: 'hold before fault', first: marker('convergence hold arm'), second: marker('one exact fault arm') },
      { label: 'hold proof before fault', first: marker('hold arm fail-stop'), second: marker('one exact fault arm') },
      { label: 'fault before action', first: marker('one exact fault arm'), second: marker('one awaited current-card Landing') },
      { label: 'fault proof before action', first: marker('fault arm fail-stop'), second: marker('one awaited current-card Landing') },
      { label: 'action before held wait', first: marker('one awaited current-card Landing'), second: marker('held phase wait') },
      { label: 'held wait before durable read', first: marker('held phase wait'), second: marker('held durable read') },
      { label: 'held read before release', first: marker('held durable read'), second: marker('single release') },
      { label: 'release before replacement', first: marker('single release'), second: marker('new document wait') },
      { label: 'replacement before writable', first: marker('new document wait'), second: marker('new writable authority') },
      { label: 'writable before quiescence', first: marker('new writable authority'), second: marker('reloaded heartbeat quiescence') },
      { label: 'quiescence before reloaded read', first: marker('reloaded heartbeat quiescence'), second: marker('reloaded durable read') },
      { label: 'reloaded read before witness query', first: marker('reloaded durable read'), second: marker('one convergence witness source') },
      { label: 'receipt alignment before injected write', first: marker('receipt control alignment precondition'), second: marker('receipt control write guard') },
      { label: 'delta factory before Ocean mutant', first: marker('Survey delta control factory'), second: marker('Ocean legacy mutant') },
      { label: 'Ocean mutant before assessment', first: marker('Ocean legacy mutant'), second: marker('Ocean control assessment') },
      { label: 'rank mutant before assessment', first: marker('rank durable mutant'), second: marker('rank control assessment') },
      { label: 'achievement mutant before assessment', first: marker('achievement durable mutant'), second: marker('achievement control assessment') },
    ] as const satisfies readonly OrderRule[];
    proveEachMarkerRequired(collectorOwner, markers);
    proveEachOrderRequired(collectorOwner, order);
    expect(occurrences(collectorOwner, '.surveyOn(')).toBe(1);
    expect(occurrences(collectorOwner, '.landHere(')).toBe(1);
    expect(collectorOwner).not.toContain('.landOn(');
  });

  it('binds storage rejection to no durable or local product and no retry', () => {
    proveEachMarkerRequired(storageAssessmentOwner, [
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
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
      ['storage finding label', "findingLabel: 'ARC 0 LANDING STORAGE REFUSAL'"],
      ['storage hook', "faultHook: '__smokeRejectNextArc0LandingStorage'"],
      ['storage expected outcome', "injection: 'storage-failure', faultOutcome: 'storage-error', accepted: false"],
      ['revision mutation', 'arc0LandingStorageRevisionControl.heldRaw.revision += 1;'],
      ['coordinator mutation', 'actionCoordinator.owner.busy = true;'],
      ['revision isolated red', "arc0LandingStorageControls.revision, 'revisionStable'"],
      ['coordinator isolated red', "arc0LandingStorageControls.coordinator, 'coordinatorReleased'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING STORAGE REFUSAL:"],
    ]);
    expect(storageScenarioOwner).not.toContain("fails.push('ARC 0 LANDING STORAGE REFUSAL:");
  });

  it('binds stale refusal to the later writer alone and a source-route fixed point', () => {
    proveEachMarkerRequired(staleAssessmentOwner, [
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
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
      ['stale finding label', "findingLabel: 'ARC 0 LANDING STALE CONVERGENCE'"],
      ['stale hook', "faultHook: '__smokeStaleNextArc0LandingAuthority'"],
      ['stale expected outcome', "injection: 'stale-authority', faultOutcome: 'stale', accepted: false"],
      ['held later-writer mutation', "arc0LandingStaleWriterControl.heldRaw.catalogRaw += '\\n';"],
      ['reloaded later-writer mutation', "arc0LandingStaleWriterControl.reloadedRaw.catalogRaw += '\\n';"],
      ['token mutation', 'arc0LandingStaleTokenControl.reloadedReady.token = arc0LandingStaleTokenControl.beforeToken;'],
      ['later-writer isolated red', "arc0LandingStaleControls.laterWriter, 'laterWriterOnly'"],
      ['reload isolated red', "arc0LandingStaleControls.token, 'reloadFixedPoint'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING STALE CONVERGENCE:"],
    ]);
    expect(staleScenarioOwner).not.toContain("fails.push('ARC 0 LANDING STALE CONVERGENCE:");
  });

  it('binds postcommit publication failure to one durable landing and reward', () => {
    proveEachMarkerRequired(publicationProductOwner, [
      ['complete live saves', 'if (!beforeState?.save || !reloadedState?.save) return false;'],
      ['zero source receipts', 'beforeReceipts.length === 0'],
      ['one committed receipt', 'committedReceipts.length === 1'],
      ['zero inspection prefix receipts', 'arc0LandingSurveyReceipts(beforeRaw).length === 0'],
      ['full prefix append-only', 'arc0LandingReceiptDeltaExact(beforeRaw, committedRaw, receipt?.key)'],
      ['landing raw row identity', 'receipt?.raw === JSON.stringify(receipt?.row)'],
      ['bounded pre-action ordinal', 'Number.isSafeInteger(beforeAuthorityOrdinal)'],
      ['receipt key binds pre-action ordinal', 'receipt?.key === `receipt:${beforeAuthorityOrdinal}`'],
      ['landing receipt kind', "receipt?.row?.kind === 'arc0-land'"],
      ['receipt row binds pre-action ordinal', 'receipt?.row?.ordinal === beforeAuthorityOrdinal'],
      ['witness facts bind pre-action ordinal', 'facts?.receiptOrdinal === beforeAuthorityOrdinal'],
      ['receipt witness schema', "facts?.schema === 'cf-v2-arc0-landing-witness/v1'"],
      ['exact world key', 'facts?.worldKey === ARC4_PERTAR_FIXTURE.worldKey'],
      ['exact planet seed', 'facts?.planetSeed === ARC4_PERTAR_FIXTURE.planet.seed'],
      ['exact current witness count', 'Object.keys(facts).length === 25'],
      ['seeded weather fact', 'facts.descentWeather === ARC4_PERTAR_DESCENT_LANDING.descentWeather'],
      ['exact selected descent', 'canonicalJson(facts.descent) === canonicalJson(ARC4_PERTAR_DESCENT_LANDING.descent)'],
      ['canonical wave-off seal', 'facts.waveOffStateSuccessorSeal === ARC4_PERTAR_DESCENT_LANDING.waveOffStateSuccessorSeal'],
      ['legacy wave-off seal', 'facts.waveOffLegacySuccessorSeal === ARC4_PERTAR_DESCENT_LANDING.waveOffLegacySuccessorSeal'],
      ['exact loot successor seal', 'facts.arc2LootSuccessorSeal === ARC4_PERTAR_DESCENT_LANDING.arc2LootSuccessorSeal'],
      ['no wave-off protected outcome', 'facts.waveOffProtectedStateSeal === null'],
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
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['publication fault', "evidence, 'publication-failure', 'committed-publication-reload'"],
      ['fault revision', 'fault?.injectedRevision === committedRaw?.revision'],
      ['one global revision', 'committedRaw?.revision === beforeRaw?.revision + 1'],
      ['revision serialization', 'committedRaw?.revisionRaw === String(committedRaw.revision)'],
      ['session seed held', 'committedAuthority?.seed === beforeAuthority?.seed'],
      ['one session ordinal', 'committedAuthority?.ordinal === beforeAuthority?.ordinal + 1'],
      ['source descent counters empty', 'canonicalJson(beforeAuthority?.draws) === canonicalJson(ARC4_PERTAR_FIXTURE.initialSessionDraws)'],
      ['two named descent counters only', 'canonicalJson(committedAuthority?.draws) === canonicalJson(ARC4_PERTAR_DESCENT_DRAWS)'],
      ['landing/reward witness', 'durableLandingReward: arc0LandingPublicationProductExact(evidence)'],
      ['legacy surface route', 'arc4PertarLegacyRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['split surface route', 'arc4PertarSplitRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['legacy landed field', 'committedRaw?.legacy?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['split landed field', 'committedRaw?.catalogRow?.data?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['world identity changed', 'canonicalJson(arc0LandingWorldIdentityBytes(beforeRaw))'],
      ['world identity reload parity', 'canonicalJson(arc0LandingWorldIdentityBytes(evidence?.reloadedRaw))'],
      ['browser-free publication assessor', 'localPublicationWithheld: assessArc0LandingPublicationWithheld({'],
      ['pre-action product', 'beforeProduct: arc0LandingLiveProduct(evidence?.fixture?.state)'],
      ['old document product', 'heldProduct: arc0LandingLiveProduct(evidence?.heldState)'],
      ['held state route input', 'heldState: evidence?.heldState'],
      ['held card-code input', 'cardCode: evidence?.heldCardCode'],
      ['held target input', 'target: evidence?.heldTarget'],
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
      ['publication finding label', "findingLabel: 'ARC 0 LANDING PUBLICATION CONVERGENCE'"],
      ['publication hook', "faultHook: '__smokeRejectNextArc0LandingPublication'"],
      ['publication expected outcome', "injection: 'publication-failure', faultOutcome: 'committed-publication-reload'"],
      ['durable success return', 'accepted: true,'],
      ['positive evidence fail-stop', 'if (!arc0LandingPublicationAssessment.ok) {\n    failSliceWithoutCascade(\'ARC 0 LANDING PUBLICATION CONVERGENCE: positive held publication evidence was not exact; controls were not constructed: \''],
      ['old-state optimism mutation', 'arc0LandingPublicationOptimismControl.heldState.save = structuredClone('],
      ['post-Survey route control', 'arc0LandingPublicationRouteControl.heldState.cardOpen = false;'],
      ['held card-code control', "arc0LandingPublicationCardCodeControl.heldCardCode = 'CF1-not-a-valid-card';"],
      ['held target control', 'arc0LandingPublicationTargetControl.heldTarget.ordinal += 1;'],
      ['both durable snapshots mutated', 'for (const raw of [arc0LandingPublicationWitnessControl.heldRaw,'],
      ['field-sample witness mutation', 'witness.sample.stardust += 1;'],
      ['prefix control pair', 'for (const raw of [arc0LandingPublicationPrefixControl.heldRaw,'],
      ['prefix alignment precondition', '|| arc0LandingSurveyReceipts(raw).length !== 0) {'],
      ['injected prefix mutation', 'raw.receiptRows.unshift(unexpectedPrefix);'],
      ['prefix bytes aligned', 'raw.receiptRawRows.unshift(JSON.stringify(unexpectedPrefix));'],
      ['ordinal control pair', 'for (const raw of [arc0LandingPublicationOrdinalControl.heldRaw,'],
      ['forged successor ordinal', '= arc0LandingPublicationEvidence.fixture.raw.authority.sessionRng.ordinal + 1;'],
      ['ordinal alignment precondition', 'if (!arc0LandingReceiptArraysAligned(raw) || landingReceiptIndexes.length !== 1) {'],
      ['row ordinal mutation', 'receiptRow.ordinal = arc0LandingPublicationForgedOrdinal;'],
      ['facts ordinal mutation', 'facts.receiptOrdinal = arc0LandingPublicationForgedOrdinal;'],
      ['key ordinal mutation', 'raw.receiptKeys[landingReceiptIndex]'],
      ['ordinal bytes realigned', 'raw.receiptKeys[landingReceiptIndex]\n      = `receipt:${arc0LandingPublicationForgedOrdinal}`;\n    raw.receiptRawRows[landingReceiptIndex] = JSON.stringify(receiptRow);'],
      ['reload revision mutation', 'arc0LandingPublicationReloadControl.reloadedRaw.revision += 1;'],
      ['prefix control assessment', 'prefix: assessArc0LandingPublicationConvergence('],
      ['ordinal control assessment', 'ordinal: assessArc0LandingPublicationConvergence('],
      ['prefix control prepared', 'if (!arc0LandingPublicationPrefixControlPrepared'],
      ['ordinal control prepared', '|| !arc0LandingPublicationOrdinalControlPrepared'],
      ['optimism isolated red', "arc0LandingPublicationControls.optimism, 'localPublicationWithheld'"],
      ['route isolated red', "arc0LandingPublicationControls.route, 'localPublicationWithheld'"],
      ['card-code isolated red', "arc0LandingPublicationControls.cardCode, 'localPublicationWithheld'"],
      ['target isolated red', "arc0LandingPublicationControls.target, 'localPublicationWithheld'"],
      ['witness isolated red', "arc0LandingPublicationControls.witness, 'durableLandingReward'"],
      ['prefix isolated red', "arc0LandingPublicationControls.prefix, 'durableLandingReward'"],
      ['ordinal isolated red', "arc0LandingPublicationControls.ordinal, 'durableLandingReward'"],
      ['reload isolated red', "arc0LandingPublicationControls.reload, 'reloadFixedPoint'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING PUBLICATION CONVERGENCE: durable one-receipt landing/reward was published locally, retried, or lost across reload:"],
    ]);
    expect(publicationScenarioOwner).not.toContain(
      "fails.push('ARC 0 LANDING PUBLICATION CONVERGENCE:",
    );
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
      ['exact shared coordinator contract', 'arc0LandingCoordinatorIsIdle(state, options)'],
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
      ['surface saved route', 'arc4PertarSavedPlanetRouteExact(state)'],
      ['source saved route', ': arc4PertarSourceRouteExact(state) && arc4PertarSavedStarRouteExact(state);'],
      ['one release witness', 'evidence?.convergenceWitnessCount === 1'],
      ['convergence witness schema', "witness?.schema === 'cf-v2-f4-authority-convergence/v1'"],
      ['released witness status', "witness?.status === 'released'"],
      ['exact release detail', 'witness?.detail === detail'],
      ['old document witness', 'witness?.documentToken === evidence?.beforeToken'],
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
      ['clean reload landing outcome', 'state?.landing?.lastOutcome === null'],
    ]);
    proveEachMarkerRequired(convergenceWitnessOwner, [
      ['authority revision tuple', 'runtime?.revision === raw?.revision'],
      ['authority seed tuple', 'runtime?.sessionSeed === authority?.seed'],
      ['authority ordinal tuple', 'runtime?.sessionOrdinal === authority?.ordinal'],
      ['authority draw tuple', 'canonicalJson(runtime?.sessionDraws) === canonicalJson(authority?.draws)'],
    ]);
  });

  it('awaits every asynchronous landing route before observing state', () => {
    const callPattern = /\b(?:[A-Za-z_$][\w$]*[.])+(?:landOn|landHere|__smokeRouteTrainingTo)\(/gu;
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
