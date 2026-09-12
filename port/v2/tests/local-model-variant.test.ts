import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as MODEL } from '../apps/game/src/local-model-manifest.js';
import type { LocalModelDeliveryStatusV1 } from '../apps/game/src/local-model-delivery.js';
import { admitLocalModelVariantPlanV1, applyVariantGraphPatchesV1, expandVariantOperandsV1,
  streamVariantParameterRangeV1, verifyVariantBlobV1, deriveLocalModelVariantV1,
  runVerifiedVariantTransactionV1, LOCAL_MODEL_VARIANT_PLAN_SHA256_V1,
  type LocalModelVariantReadyV1, type LocalModelVariantStorageV1,
  type LocalModelVariantTransactionV1 } from '../apps/game/src/local-model-variant.js';
const sha = (value: Uint8Array | string): string => createHash('sha256').update(value).digest('hex');
const planJson = await readFile(new URL('../../../tools/local-image-generation/browser-variant-plan.json', import.meta.url), 'utf8');
const bytes = (length: number): Uint8Array<ArrayBuffer> => Uint8Array.from({ length }, (_, i) => (i * 37 + Math.floor(i / 257)) & 255);
const live = (): AbortSignal => new AbortController().signal;
const range = (length: number, width: 1 | 2 = 2) => ({ source: 'fixture', offset: 0, length, width, outputOffset: 0 });
function parentFixture() {
  const manifestSha256 = sha(JSON.stringify(MODEL)); let reads = 0, begins = 0;
  const status: LocalModelDeliveryStatusV1 = { phase: 'ready', ready: true, manifestSha256,
    totalBytes: MODEL.totalBytes, storedBytes: MODEL.totalBytes, verifiedBytes: MODEL.totalBytes,
    downloadedBytes: 0, verifiedFiles: 20, totalFiles: 20, file: null, error: null,
    attemptId: 'fixture-attempt', qualityAccepted: false, deviceQualified: false };
  const parent = { manifest: MODEL, manifestSha256, status: () => status,
    openFile: async (_path: string): Promise<Blob> => { reads++; return new Blob(['wrong size']); } };
  const storage = { begin: async (): Promise<never> => { begins++; throw new Error('No fixture allocation permitted'); } };
  return { parent, storage, status, calls: () => ({ reads, begins }) };
}
describe('detached exact block32 variant plan', () => {
  it('admits only the retained142918-byte plan with exact targets/ranges and freezes its tree', () => {
    expect(Buffer.byteLength(planJson)).toBe(142918); expect(sha(planJson)).toBe(LOCAL_MODEL_VARIANT_PLAN_SHA256_V1);
    const plan = admitLocalModelVariantPlanV1(planJson); expect(plan.patches).toHaveLength(413); expect(plan.ranges).toHaveLength(206);
    expect(plan.files.map(row => row.bytes)).toEqual([4991273, 347332608]);
    expect(plan.ranges.reduce((n, row) => n + row.length * 4, 0)).toBe(347332608);
    expect(Object.isFrozen(plan.ranges[0])).toBe(true); expect(plan.qualityAccepted).toBe(false); expect(plan.deviceQualified).toBe(false);
  });
  it('rejects mutated parent, patch, source range, output hash, extra metadata and whitespace carriers', () => {
    for (const change of [
      (p: any) => { p.parent.graph.sha256 = '0'.repeat(64); },
      (p: any) => { p.patches[2].hex = '00'; }, (p: any) => { p.ranges[0].offset++; },
      (p: any) => { p.files[1].sha256 = '0'.repeat(64); }, (p: any) => { p.accepted = true; },
    ]) { const plan = JSON.parse(planJson); change(plan); expect(() => admitLocalModelVariantPlanV1(JSON.stringify(plan))).toThrow('plan SHA'); }
    expect(() => admitLocalModelVariantPlanV1(planJson + '\n')).toThrow('plan SHA');
    expect(() => admitLocalModelVariantPlanV1('x'.repeat(524289))).toThrow('size');
  });
  it('patches representative byte regions without touching unchanged parent bytes', () => {
    const source = new Uint8Array([0, 1, 2, 3, 4, 5]);
    expect([...applyVariantGraphPatchesV1(source, [{ offset: 1, remove: 2, hex: 'aabbcc' }, { offset: 5, remove: 1, hex: '' }], 6)])
      .toEqual([0, 170, 187, 204, 3, 4]); expect([...source]).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('refuses overlap, out-of-bounds, malformed literals and inconsistent graph size', () => {
    const source = new Uint8Array(6);
    for (const patches of [[{ offset: 5, remove: 2, hex: '00' }], [{ offset: 1, remove: 1, hex: '0g' }],
      [{ offset: 1, remove: 2, hex: '00' }, { offset: 2, remove: 1, hex: '00' }]]) {
      expect(() => applyVariantGraphPatchesV1(source, patches, 6)).toThrow();
    }
    expect(() => applyVariantGraphPatchesV1(source, [], 5)).toThrow('output size');
  });
  it('preserves all uint8 values and nonuniform float16 bit pairs through independent inverse addressing', () => {
    for (const width of [1, 2] as const) {
      const source = bytes(65536), output = expandVariantOperandsV1(source, width); expect(output.length).toBe(262144);
      const expected = Uint8Array.from({ length: output.length }, (_, i) => source[Math.floor(Math.floor(i / width) / 4) * width + i % width]!);
      expect(Buffer.from(output).equals(expected)).toBe(true);
      expect(source).toEqual(bytes(65536));
    }
    expect(() => expandVariantOperandsV1(bytes(3), 2)).toThrow();
    expect(() => expandVariantOperandsV1(bytes(65538), 2)).toThrow();
  });
  it('streams multiple operand chunks in order with at most256KiB per awaited write', async () => {
    const source = bytes(65536 + 258), writes: { offset: number; bytes: Uint8Array<ArrayBuffer> }[] = [];
    const total = await streamVariantParameterRangeV1(new Blob([source]), range(source.length), live(), async (offset, data) => { writes.push({ offset, bytes: data }); });
    expect(writes.map(row => [row.offset, row.bytes.length])).toEqual([[0, 262144], [262144, 1032]]);
    const output = Buffer.concat(writes.map(row => row.bytes)); expect(total).toBe(source.length * 4);
    const expected = Uint8Array.from({ length: output.length }, (_, i) => source[Math.floor(Math.floor(i / 2) / 4) * 2 + i % 2]!);
    expect(output.equals(expected)).toBe(true);
  });
  it('stops after cancellation or real writer quota failure without issuing later chunks', async () => {
    const source = new Blob([bytes(65538)]), controller = new AbortController(); let writes = 0;
    await expect(streamVariantParameterRangeV1(source, range(source.size), controller.signal, async () => { writes++; controller.abort(); })).rejects.toMatchObject({ name: 'AbortError' });
    expect(writes).toBe(1); writes = 0;
    await expect(streamVariantParameterRangeV1(source, range(source.size), live(), async () => { writes++; throw new DOMException('full', 'QuotaExceededError'); })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(writes).toBe(1);
  });
  it('refuses invalid range geometry and truncated reads before any output write', async () => {
    let writes = 0; const consume = async (): Promise<void> => { writes++; };
    await expect(streamVariantParameterRangeV1(new Blob([bytes(4)]), range(6), live(), consume)).rejects.toThrow('range');
    class Truncated extends Blob { override slice(): Blob { return new Blob([bytes(1)]); } }
    await expect(streamVariantParameterRangeV1(new Truncated([bytes(4)]), range(4), live(), consume)).rejects.toThrow('truncated');
    expect(writes).toBe(0);
  });
  it('reads and hashes complete output bytes; rejects same-sized middle corruption and wrong size', async () => {
    const output = bytes(65538), expected = { path: 'fixture', bytes: output.length, sha256: sha(output) }; let count = 0;
    await verifyVariantBlobV1(new Blob([output]), expected, live(), n => { count += n; }); expect(count).toBe(output.length);
    output[32768] = output[32768]! ^ 1;
    await expect(verifyVariantBlobV1(new Blob([output]), expected, live())).rejects.toThrow('readback SHA');
    await expect(verifyVariantBlobV1(new Blob([output.slice(1)]), expected, live())).rejects.toThrow('readback size');
  });
  it('readback cancellation after the first chunk never verifies the remainder', async () => {
    const output = bytes(65538), controller = new AbortController(); let count = 0;
    await expect(verifyVariantBlobV1(new Blob([output]), { path: 'fixture', bytes: output.length, sha256: sha(output) }, controller.signal,
      n => { count += n; controller.abort(); })).rejects.toMatchObject({ name: 'AbortError' }); expect(count).toBe(65536);
  });
  it('refuses wrong or unverified parent before storage allocation or model reads', async () => {
    for (const mutate of [(f: ReturnType<typeof parentFixture>) => { f.parent.manifestSha256 = '0'.repeat(64); },
      (f: ReturnType<typeof parentFixture>) => { Object.assign(f.status, { ready: false }); }]) {
      const fixture = parentFixture(); mutate(fixture);
      await expect(deriveLocalModelVariantV1({ planJson, ...fixture, signal: live() })).rejects.toThrow('parent');
      expect(fixture.calls()).toEqual({ reads: 0, begins: 0 });
    }
  });
  it('refuses an aborted attempt, replaced readiness and incorrect native Blob size before allocation', async () => {
    const controller = new AbortController(); controller.abort(); const aborted = parentFixture();
    await expect(deriveLocalModelVariantV1({ planJson, ...aborted, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(aborted.calls()).toEqual({ reads: 0, begins: 0 });
    const replaced = parentFixture(); replaced.parent.openFile = async () => { Object.assign(replaced.status, { attemptId: 'replaced' }); return new Blob(['x']); };
    await expect(deriveLocalModelVariantV1({ planJson, ...replaced, signal: live() })).rejects.toThrow('not verified');
    const short = parentFixture(); await expect(deriveLocalModelVariantV1({ planJson, ...short, signal: live() })).rejects.toThrow('Blob size');
    expect(short.calls()).toEqual({ reads: 1, begins: 0 });
  });
});


/** Tiny real byte/real SHA storage fixture for the SAME transaction owner used by
 * production deriveLocalModelVariantV1. It does not substitute any hash operation,
 * model admission or variant output pin, and claims no native OPFS qualification. */
function transactionFixture(faults: { failWriteAt?: number; staleReadback?: boolean; abortDuringCommit?: boolean;
  failAbort?: boolean; corruptOutput?: boolean; failFinish?: boolean } = {}) {
  const originals = new Map([['tiny-graph.onnx', bytes(17)], ['tiny-parameters.data', bytes(9)]]);
  const files = [...originals].map(([path, data]) => ({ path, bytes: data.length, sha256: sha(data) }));
  const marker: LocalModelVariantReadyV1 = { schema: 'cf.local-model-variant-ready.v1', variant: 'q8-block32-repacked-v1',
    planSha256: 'a'.repeat(64), parentManifestSha256: 'b'.repeat(64), parentAttemptId: 'tiny-transaction-control',
    sourceManifestSha256: 'c'.repeat(64), files, payloadBytes: 26, qualityAccepted: false, deviceQualified: false };
  const controller = new AbortController(), events: string[] = [], stored = new Map<string, Uint8Array<ArrayBuffer>>();
  let retained: LocalModelVariantReadyV1 | null = null, held = false, writeCount = 0;
  const transaction: LocalModelVariantTransactionV1 = {
    async write(path, offset, chunk) {
      events.push('write:' + path + ':' + offset); expect(held).toBe(true); writeCount++;
      if (faults.failWriteAt === writeCount) throw new DOMException('Actual fixture writer quota refusal', 'QuotaExceededError');
      const previous = stored.get(path) ?? new Uint8Array(); expect(previous.length).toBe(offset);
      const next = new Uint8Array(previous.length + chunk.length); next.set(previous); next.set(chunk, previous.length); stored.set(path, next);
    },
    async seal(path) { events.push('seal:' + path); expect(held).toBe(true); },
    async open(path) {
      events.push('open:' + path); expect(held).toBe(true); const data = stored.get(path)!.slice();
      if (faults.corruptOutput) data[Math.floor(data.length / 2)] = data[Math.floor(data.length / 2)]! ^ 1;
      return new Blob([data]);
    },
    async commit(value) {
      events.push('commit'); expect(held).toBe(true); retained = structuredClone(value);
      if (faults.abortDuringCommit) controller.abort(); await Promise.resolve();
    },
    async readReady() { events.push('readReady'); expect(held).toBe(true);
      return faults.staleReadback ? { ...retained, planSha256: 'd'.repeat(64) } : retained; },
    async finish() { events.push('finish'); expect(held).toBe(true); if (faults.failFinish) throw Error('release failed'); held = false; },
    async abort() {
      events.push('abort'); expect(held).toBe(true); if (faults.failAbort) throw Error('revoke failed'); retained = null; held = false;
    },
  };
  const storage: LocalModelVariantStorageV1 = { async begin(request) {
    events.push('begin'); expect(request).toEqual({ payloadBytes: 26, markerBudgetBytes: 65536,
      planSha256: marker.planSha256, parentManifestSha256: marker.parentManifestSha256,
      parentAttemptId: marker.parentAttemptId }); held = true; return transaction;
  } };
  const produce = async (append: (path: string, offset: number, chunk: Uint8Array<ArrayBuffer>) => Promise<void>): Promise<void> => {
    for (const [path, data] of originals) { await append(path, 0, data.slice(0, 8)); await append(path, 8, data.slice(8)); }
  };
  return { marker, storage, signal: controller.signal, produce, events, stored, originals,
    state: () => ({ retained, held, writeCount }) };
}
describe('actual shared variant transaction outcomes with tiny exact files', () => {
  it('writes/hashes/readbacks both files and retains the exact marker before explicit success release', async () => {
    const fixture = transactionFixture(); const result = await runVerifiedVariantTransactionV1(fixture);
    expect(result).toEqual({ writtenPayloadBytes: 26, verifiedPayloadBytes: 26 });
    expect(fixture.events).toEqual(['begin', 'write:tiny-graph.onnx:0', 'write:tiny-graph.onnx:8', 'seal:tiny-graph.onnx',
      'write:tiny-parameters.data:0', 'write:tiny-parameters.data:8', 'seal:tiny-parameters.data',
      'open:tiny-graph.onnx', 'open:tiny-parameters.data', 'commit', 'readReady', 'finish']);
    expect(fixture.state()).toMatchObject({ retained: fixture.marker, held: false });
    for (const [path, original] of fixture.originals) expect(fixture.stored.get(path)).toEqual(original);
  });
  it('post-write quota refusal aborts the owned attempt without committing or attempting later output', async () => {
    const fixture = transactionFixture({ failWriteAt: 2 });
    await expect(runVerifiedVariantTransactionV1(fixture)).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(fixture.events).toEqual(['begin', 'write:tiny-graph.onnx:0', 'write:tiny-graph.onnx:8', 'abort']);
    expect(fixture.stored.get('tiny-graph.onnx')?.length).toBe(8);
    expect(fixture.state()).toMatchObject({ retained: null, held: false, writeCount: 2 });
  });
  it('a successful commit followed by stale marker readback revokes readiness before release', async () => {
    const fixture = transactionFixture({ staleReadback: true });
    await expect(runVerifiedVariantTransactionV1(fixture)).rejects.toThrow('readiness readback mismatch');
    expect(fixture.events.slice(-3)).toEqual(['commit', 'readReady', 'abort']);
    expect(fixture.events).not.toContain('finish'); expect(fixture.state()).toMatchObject({ retained: null, held: false });
  });
  it('cancellation during commit revokes the published marker while its lease remains held', async () => {
    const fixture = transactionFixture({ abortDuringCommit: true });
    await expect(runVerifiedVariantTransactionV1(fixture)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fixture.events.slice(-2)).toEqual(['commit', 'abort']); expect(fixture.events).not.toContain('readReady');
    expect(fixture.events).not.toContain('finish'); expect(fixture.state()).toMatchObject({ retained: null, held: false });
  });
  it('abort failure retains both the original failure and failed cleanup without claiming release', async () => {
    const fixture = transactionFixture({ staleReadback: true, failAbort: true });
    const error = await runVerifiedVariantTransactionV1(fixture).catch(error => error as AggregateError);
    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors.map(error => String(error))).toEqual([
      'Error: Variant readiness readback mismatch', 'Error: revoke failed']);
    expect(fixture.events.slice(-3)).toEqual(['commit', 'readReady', 'abort']);
    expect(fixture.state().held).toBe(true); expect(fixture.events).not.toContain('finish');
  });
  it('same-sized output corruption refuses before commit despite successful producer writes', async () => {
    const fixture = transactionFixture({ corruptOutput: true });
    await expect(runVerifiedVariantTransactionV1(fixture)).rejects.toThrow('readback SHA');
    expect(fixture.events).not.toContain('commit'); expect(fixture.events.at(-1)).toBe('abort');
    expect(fixture.state()).toMatchObject({ retained: null, held: false });
  });
  it('failed success release invokes owned cleanup and never resolves ready', async () => {
    const fixture = transactionFixture({ failFinish: true });
    await expect(runVerifiedVariantTransactionV1(fixture)).rejects.toThrow('release failed');
    expect(fixture.events.slice(-3)).toEqual(['readReady', 'finish', 'abort']);
    expect(fixture.state()).toMatchObject({ retained: null, held: false });
  });
  it('incomplete output cannot reach readback or marker publication', async () => {
    const fixture = transactionFixture();
    await expect(runVerifiedVariantTransactionV1({ ...fixture, produce: async append => {
      await append('tiny-graph.onnx', 0, bytes(8));
    } })).rejects.toThrow('incomplete output');
    expect(fixture.events).toEqual(['begin', 'write:tiny-graph.onnx:0', 'abort']);
  });
});
