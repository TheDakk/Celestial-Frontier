import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  classifyLegacyTrainingCheckpointV1,
  exportSaveV2,
  importSaveV2,
  type ContentRegistry,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixture = JSON.parse(fs.readFileSync(path.join(baseline, 'training-restart-fixture.json'), 'utf8')) as {
  captureSchema: string;
  capturedAgainst: string;
  observedErrors: string[];
  observedTut: number;
  settledSave: {
    normalization: { topLevelAt: string };
    topLevelKeyCount: number;
    normalizedJsonByteLength: number;
    normalizedSha256: string;
    surroundingTopLevelKeyCount: number;
    normalizedSurroundingJsonByteLength: number;
    normalizedSurroundingSha256: string;
  };
  snapshotJsonByteLength: number;
  snapshotSha256: string;
  source: {
    fixtureFile: string;
    fixtureName: string;
    fixtureJsonByteLength: number;
    fixtureJsonSha256: string;
    fixtureFileSha256: string;
    gameHtmlFile: string;
    gameHtmlSha256: string;
    probeHarnessFile: string;
    probeHarnessSha256: string;
    captureDriverFile: string;
    captureDriverSha256: string;
    actionPath: string[];
  };
  snapshot: Record<string, unknown>;
};
const saves = JSON.parse(fs.readFileSync(path.join(baseline, fixture.source.fixtureFile), 'utf8')) as {
  inputs: Record<string, Record<string, unknown>>;
};
const registry = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1753900060000;

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function importTraining(tut: number, snapshot: unknown) {
  const result = importSaveV2(JSON.stringify({ epoch: 0, tut, tsnap: snapshot }), registry, NOW);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result;
}

function expectDeepFrozen(value: unknown, seen = new WeakSet<object>()): void {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeepFrozen(child, seen);
}

describe('v1.8.9 Field Training checkpoint fixture and ingress classifier', () => {
  it('seals the action-derived capture and every provenance hash', () => {
    const serialized = JSON.stringify(fixture.snapshot);
    expect(fixture.captureSchema).toBe('cf-v1.8.9-training-restart-capture/v1');
    expect(fixture.capturedAgainst).toBe('v1.8.9');
    expect(fixture.observedErrors).toEqual([]);
    expect(fixture.observedTut).toBe(0);
    expect(fixture.settledSave).toEqual({
      normalization: { topLevelAt: '<capture-wall-clock-ms>' },
      topLevelKeyCount: 96,
      normalizedJsonByteLength: 4425,
      normalizedSha256: 'd9ab24f51bbb76f0e3270edd77eb3aeeab888296761cc989c8792523ac707332',
      surroundingTopLevelKeyCount: 95,
      normalizedSurroundingJsonByteLength: 2342,
      normalizedSurroundingSha256: 'e1bcae22e94ae12471495ec2670441b237a22370a66bef7ee5274e416924d644',
    });
    expect(Object.keys(fixture.snapshot)).toEqual(['st', 'ps', 'ac', 'es', 'c', 'ca', 'cx', 'it', 'eq', 'ea', 'e']);
    expect(Buffer.byteLength(serialized)).toBe(fixture.snapshotJsonByteLength);
    expect(fixture.snapshotJsonByteLength).toBe(2074);
    expect(sha256(serialized)).toBe(fixture.snapshotSha256);
    expect(fixture.snapshotSha256).toBe('2e2f7c566a27e79398ea18650de9ac6acf236e92235fc293e4815b8bfefa22e3');
    expect(fixture.settledSave.topLevelKeyCount - fixture.settledSave.surroundingTopLevelKeyCount).toBe(1);
    expect(fixture.settledSave.normalizedJsonByteLength
      - fixture.settledSave.normalizedSurroundingJsonByteLength)
      .toBe(fixture.snapshotJsonByteLength + Buffer.byteLength(',"tsnap":'));

    const sourceSave = JSON.stringify(saves.inputs[fixture.source.fixtureName]);
    expect(Buffer.byteLength(sourceSave)).toBe(fixture.source.fixtureJsonByteLength);
    expect(sha256(sourceSave)).toBe(fixture.source.fixtureJsonSha256);
    expect(sha256(fs.readFileSync(path.join(baseline, fixture.source.fixtureFile)))).toBe(fixture.source.fixtureFileSha256);
    expect(sha256(fs.readFileSync(path.resolve(baseline, fixture.source.gameHtmlFile)))).toBe(fixture.source.gameHtmlSha256);
    expect(sha256(fs.readFileSync(path.resolve(baseline, fixture.source.probeHarnessFile)))).toBe(fixture.source.probeHarnessSha256);
    expect(path.isAbsolute(fixture.source.captureDriverFile)).toBe(false);
    expect(sha256(fs.readFileSync(path.resolve(baseline, fixture.source.captureDriverFile))))
      .toBe(fixture.source.captureDriverSha256);
    expect({
      fixtureJson: fixture.source.fixtureJsonSha256,
      fixtureFile: fixture.source.fixtureFileSha256,
      gameHtml: fixture.source.gameHtmlSha256,
      probeHarness: fixture.source.probeHarnessSha256,
      captureDriver: fixture.source.captureDriverSha256,
    }).toEqual({
      fixtureJson: '26da9dc04940132a2dd4627391ef4a1be57d6a758bf3b6efb4dc6b217c273a16',
      fixtureFile: 'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
      gameHtml: 'd9ebc00c06757a141f97c939c8503d51db991d0668ccadbed1eb556d566a2fd7',
      probeHarness: 'e20159437486c376e1b41424c3fd125e0d011299553646e859d46795770f7c06',
      captureDriver: 'c3f710d90782f7ba812a2082288ce860e5f41ce16cec2c28b3eaba1fb9ec454a',
    });
    expect(fixture.source.actionPath).toEqual([
      'Seed localStorage cfcc_save_v2 with JSON.stringify(inputs.veteran_rich)',
      'Boot the real v1.8.9 document through tools/_probeboot.js',
      'Click #setbtn',
      'Click #retrainopt twice through the real legacy handler',
      'Read JSON.parse(localStorage.cfcc_save_v2).tsnap',
    ]);
  });

  it('returns a detached, recursively frozen checkpoint and never promotes e.where to a view', () => {
    const source = structuredClone(fixture.snapshot);
    const checkpoint = classifyLegacyTrainingCheckpointV1(source);
    expect(checkpoint).not.toBeNull();
    if (!checkpoint) return;
    expect(checkpoint).not.toBe(source);
    expectDeepFrozen(checkpoint);
    (source.st as Record<string, unknown>).surveys = 999;
    expect(checkpoint.st.surveys).toBe(2);
    expect(checkpoint.e).toMatchObject({
      id: 'p133',
      where: { star: { x: 0, y: 0, seed: 424242 }, pseed: 133 },
    });
    expect(Object.prototype.hasOwnProperty.call(checkpoint, 'view')).toBe(false);
  });

  it('sanitizes a nonempty Atlas star-history label at 24 characters and preserves it through export', () => {
    const earth = structuredClone(fixture.snapshot.e) as Record<string, unknown>;
    earth.star = '  G2 V <b>"home"&\'prime\' beyond cap  ';
    const first = importSaveV2(JSON.stringify({ epoch: 0, log: [earth], home: 'p133' }), registry, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const firstEarth = first.state.logMap[0]![1];
    expect(firstEarth.star).toBe('G2 V bhomeprime beyond c');
    expect(String(firstEarth.star)).toHaveLength(24);
    expect(firstEarth.where).toMatchObject({
      star: { x: 0, y: 0, seed: 424242 },
      pseed: 133,
    });

    const exported = JSON.parse(exportSaveV2(first.state, NOW)) as {
      log: Array<Record<string, unknown>>;
    };
    expect(exported.log[0]!.star).toBe('G2 V bhomeprime beyond c');
    const second = importSaveV2(JSON.stringify(exported), registry, NOW);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.state.logMap[0]![1].star).toBe('G2 V bhomeprime beyond c');
  });

  it('recognizes the exact key set in either order and rejects every missing or extra field', () => {
    const reversed = Object.fromEntries(Object.entries(fixture.snapshot).reverse());
    expect(classifyLegacyTrainingCheckpointV1(reversed)).not.toBeNull();
    expect(importTraining(0, reversed).ingress.trainingSnapshot.kind).toBe('legacy-v1');
    for (const key of Object.keys(fixture.snapshot)) {
      const missing = structuredClone(fixture.snapshot);
      delete missing[key];
      expect(classifyLegacyTrainingCheckpointV1(missing), `missing ${key}`).toBeNull();
    }
    const missing = structuredClone(fixture.snapshot);
    delete missing.st;
    expect(importTraining(0, missing).ingress.trainingSnapshot.kind).toBe('legacy-or-unknown');
    const extra = { ...fixture.snapshot, extra: true };
    expect(classifyLegacyTrainingCheckpointV1(extra)).toBeNull();
    expect(importTraining(0, extra).ingress.trainingSnapshot.kind).toBe('legacy-or-unknown');
  });

  it('rejects every wrong outer container and every over-cap array', () => {
    const wrong: Record<string, unknown> = {
      st: [], ps: [], ac: {}, es: {}, c: {}, ca: {}, cx: {}, it: {}, eq: [], ea: [], e: [],
    };
    for (const [key, value] of Object.entries(wrong)) {
      const candidate = structuredClone(fixture.snapshot);
      candidate[key] = value;
      expect(classifyLegacyTrainingCheckpointV1(candidate), `wrong ${key}`).toBeNull();
    }
    const caps = { ac: 500, c: 1500, ca: 200, cx: 200, it: 300 } as const;
    for (const [key, cap] of Object.entries(caps)) {
      const candidate = structuredClone(fixture.snapshot);
      candidate[key] = Array.from({ length: cap + 1 }, () => null);
      expect(classifyLegacyTrainingCheckpointV1(candidate), `over-cap ${key}`).toBeNull();
    }
    const wrongContainer = structuredClone(fixture.snapshot);
    wrongContainer.ac = {};
    expect(importTraining(0, wrongContainer).ingress.trainingSnapshot.kind).toBe('legacy-or-unknown');
    const overCap = structuredClone(fixture.snapshot);
    overCap.ca = Array.from({ length: 201 }, () => null);
    expect(importTraining(0, overCap).ingress.trainingSnapshot.kind).toBe('legacy-or-unknown');
  });

  it('classifies tut=0 as pending and round-trips the checkpoint byte-for-byte', () => {
    const result = importTraining(0, fixture.snapshot);
    expect(result.ingress.trainingSnapshot).toMatchObject({
      kind: 'legacy-v1',
      rescuedCompleted: false,
      snapshot: fixture.snapshot,
    });
    expect(result.state.tutDone).toBe(false);
    expect(result.state.tutSnapPending).toEqual(fixture.snapshot);
    expectDeepFrozen(result.state.tutSnapPending);
    const exported = JSON.parse(exportSaveV2(result.state, NOW)) as Record<string, unknown>;
    expect(exported.tut).toBe(0);
    expect(sha256(JSON.stringify(exported.tsnap))).toBe(fixture.snapshotSha256);
  });

  it('rescues the known tut=1 bug by retaining the exact checkpoint and normalizing incomplete', () => {
    const result = importTraining(1, fixture.snapshot);
    expect(result.ingress.trainingSnapshot).toMatchObject({
      kind: 'legacy-v1',
      rescuedCompleted: true,
      snapshot: fixture.snapshot,
    });
    expect(result.state.tutDone).toBe(false);
    expect(result.state.tutSnapPending).toEqual(fixture.snapshot);
    const exported = JSON.parse(exportSaveV2(result.state, NOW)) as Record<string, unknown>;
    expect(exported.tut).toBe(0);
    expect(sha256(JSON.stringify(exported.tsnap))).toBe(fixture.snapshotSha256);
  });

  it('leaves the exact current {view} contract unchanged in both tut directions', () => {
    const view = { type: 'galaxy', gal: { x: 90, y: -60, seed: 999 } };
    const pending = importTraining(0, { view });
    expect(pending.ingress.trainingSnapshot).toEqual({ kind: 'current-view', view });
    expect(pending.state.tutSnapPending).toEqual({ view });
    const completed = importTraining(1, { view });
    expect(completed.ingress.trainingSnapshot).toEqual({ kind: 'none' });
    expect(completed.state.tutSnapPending).toBeNull();
    expect(completed.state.tutDone).toBe(true);
  });

  it('keeps the old synthetic fixture explicitly unknown while preserving its bounded bytes', () => {
    const bogus = saves.inputs.tut_midtraining!.tsnap;
    expect(bogus).toEqual({ codex: [], essence: 10, marker: 'pre-training-expedition' });
    expect(classifyLegacyTrainingCheckpointV1(bogus)).toBeNull();
    const pending = importTraining(0, bogus);
    expect(pending.ingress.trainingSnapshot).toEqual({ kind: 'legacy-or-unknown', snapshot: bogus });
    expect(pending.state.tutSnapPending).toEqual(bogus);
    expectDeepFrozen(pending.state.tutSnapPending);
    const exported = JSON.parse(exportSaveV2(pending.state, NOW)) as Record<string, unknown>;
    expect(exported.tsnap).toEqual(bogus);

    const completed = importTraining(1, bogus);
    expect(completed.ingress.trainingSnapshot).toEqual({ kind: 'legacy-or-unknown', snapshot: bogus });
    expect(completed.state.tutDone).toBe(true);
    expect(completed.state.tutSnapPending).toEqual(bogus);
    expect(() => exportSaveV2(completed.state, NOW)).toThrow(
      'completed Field Training cannot retain a pending snapshot',
    );
  });

  it('refuses unbounded hostile evidence without retaining or re-exporting a second payload', () => {
    const hostile = { marker: 'x'.repeat(4097), nested: { view: fixture.snapshot } };
    const result = importTraining(0, hostile);
    expect(result.ingress.trainingSnapshot).toEqual({
      kind: 'legacy-or-unknown',
      retention: 'save-only',
    });
    expect(result.state.tutSnapPending).toBeNull();
    const exported = JSON.parse(exportSaveV2(result.state, NOW)) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(exported, 'tsnap')).toBe(false);

    const completed = importTraining(1, hostile);
    expect(completed.ingress.trainingSnapshot).toEqual({
      kind: 'legacy-or-unknown',
      retention: 'save-only',
    });
    expect(completed.state.tutDone).toBe(true);
    expect(completed.state.tutSnapPending).toBeNull();

    const deep = structuredClone(fixture.snapshot);
    let cursor: Record<string, unknown> = {};
    deep.st = cursor;
    for (let index = 0; index < 13; index++) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(classifyLegacyTrainingCheckpointV1(deep)).toBeNull();
  });
});
