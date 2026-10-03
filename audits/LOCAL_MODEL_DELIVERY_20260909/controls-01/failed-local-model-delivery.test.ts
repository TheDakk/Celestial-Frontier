import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createLocalModelDeliveryV1, probeLocalModelCapabilitiesV1, LOCAL_MODEL_CHUNK_BYTES_V1,
  type LocalModelManifestV1, type LocalModelDirectoryV1, type LocalModelFileHandleV1,
  type LocalModelStorageV1, type LocalModelLockV1, type LocalModelDeliveryStatusV1 } from '../apps/game/src/local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from '../apps/game/src/local-model-manifest.js';
const sha = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const C = LOCAL_MODEL_CHUNK_BYTES_V1;
const bytes = (length: number, salt = 0): Uint8Array<ArrayBuffer> => Uint8Array.from({ length }, (_, i) => (i * 19 + salt) & 255);
function manifest(data: readonly Uint8Array[]): LocalModelManifestV1 {
  return { schema: 'cf.local-model-delivery-manifest.v1', modelId: 'synthetic/model', revision: 'a'.repeat(40),
    sourceManifestSha256: 'b'.repeat(64), totalBytes: data.reduce((n, item) => n + item.length, 0),
    files: data.map((item, index) => ({ path: `file-${index}.data`, bytes: item.length, sha256: sha(item) })) };
}
const missing = (): DOMException => new DOMException('Absent fixture entry', 'NotFoundError');
/** OPFS-shaped atomic writer fault fixture. Native OPFS + HTTP qualification is
 * a separate real-browser case; these tests never claim browser I/O. */
class Disk {
  files = new Map<string, Uint8Array<ArrayBuffer>>(); dirs = new Set<string>(['']); reads: number[] = [];
  closes: string[] = []; writes = 0; failWrite = false; corruptChunk = false; quota = 1_000_000_000;
  get usage(): number { return [...this.files.values()].reduce((sum, item) => sum + item.length, 0); }
  directory(prefix = ''): LocalModelDirectoryV1 {
    return {
      getDirectoryHandle: async (name, options) => { const key = `${prefix}${name}/`;
        if (!this.dirs.has(key)) { if (!options?.create) throw missing(); this.dirs.add(key); }
        return this.directory(key);
      },
      getFileHandle: async (name, options): Promise<LocalModelFileHandleV1> => {
        const key = prefix + name;
        if (!this.files.has(key)) { if (!options?.create) throw missing(); this.files.set(key, new Uint8Array()); }
        return { getFile: async () => {
          const value = this.files.get(key); if (!value) throw missing(); const blob = new Blob([value]);
          const original = blob.arrayBuffer.bind(blob);
          blob.arrayBuffer = async () => { this.reads.push(blob.size); expect(blob.size).toBeLessThanOrEqual(C); return original(); };
          return blob;
        }, createWritable: async () => {
          let pending: Uint8Array<ArrayBuffer> | null = null, retired = false;
          return { write: async data => {
            if (this.failWrite) throw new DOMException('Synthetic quota exhaustion', 'QuotaExceededError');
            if (retired) throw Error('Writer already retired'); this.writes++;
            pending = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
          }, close: async () => {
            if (retired || !pending) throw Error('Invalid atomic close');
            if (this.corruptChunk && /\/f\d+-c\d+$/u.test(key)) pending[0] = pending[0]! ^ 1;
            this.files.set(key, pending); this.closes.push(key); retired = true;
          }, abort: async () => { retired = true; } };
        } };
      },
    };
  }
  storage: LocalModelStorageV1 = { getDirectory: async () => this.directory(), estimate: async () => ({ usage: this.usage, quota: this.quota }) };
}
function lockFixture(): LocalModelLockV1 {
  let tail: Promise<void> = Promise.resolve();
  return { async run<T>(_name: string, signal: AbortSignal, action: () => Promise<T>): Promise<T> {
    const previous = tail; let release!: () => void; tail = new Promise(resolve => { release = resolve; });
    await previous;
    try { if (signal.aborted) throw new DOMException('Canceled', 'AbortError'); return await action(); } finally { release(); }
  } };
}
function fixture(data = [bytes(C * 2 + 17), bytes(23, 2)]) {
  const disk = new Disk(), locks = lockFixture(), calls: { path: string; range: string | null }[] = [], states: LocalModelDeliveryStatusV1[] = [];
  let sequence = 0, responseMode = 'good';
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input)), index = Number(url.pathname.match(/file-(\d+)/u)?.[1]);
    const range = new Headers(init?.headers).get('Range'); calls.push({ path: url.pathname, range });
    expect(init?.credentials).toBe('omit'); expect(init?.signal).toBeInstanceOf(AbortSignal);
    const original = data[index]!; const offset = range ? Number(range.match(/bytes=(\d+)-/u)?.[1]) : 0;
    let body = original.slice(offset);
    if (responseMode === 'corrupt') body[0] = body[0]! ^ 1;
    if (responseMode === 'short') body = body.slice(0, -1);
    if (responseMode === 'excess') { const extra = new Uint8Array(body.length + 1); extra.set(body); body = extra; }
    const ranged = range !== null && responseMode !== 'ignore-range';
    return new Response(new Blob([body]).stream(), { status: ranged ? 206 : 200,
      headers: ranged ? { 'Content-Range': `bytes ${offset}-${original.length - 1}/${original.length}` } : {} });
  };
  const make = (onStatus?: (status: LocalModelDeliveryStatusV1) => void) => createLocalModelDeliveryV1({
    manifest: manifest(data), baseUrl: 'http://127.0.0.1:12345/model/', storage: disk.storage, locks, fetch: fetcher,
    headroomBytes: 0, createAttemptId: () => `attempt-${++sequence}`, onStatus: status => { states.push(status); onStatus?.(status); },
  });
  return { data, disk, calls, states, make, mode: (value: string) => { responseMode = value; } };
}
const readyMarkers = (disk: Disk): string[] => [...disk.files.keys()].filter(key => /\/ready-/.test(key) && disk.files.get(key)!.length > 0);

describe('explicit browser model delivery: synthetic OPFS-shaped controls, no weights downloaded', () => {
  it('pins every runtime path/byte/hash exactly and excludes only the authoring README', async () => {
    const source = await readFile(new URL('../../../tools/local-image-generation/model-manifest.json', import.meta.url));
    const parsed = JSON.parse(source.toString()) as { files: { path: string; bytes: number; sha256: string }[] };
    expect(PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256).toBe(sha(source));
    expect(PINNED_LOCAL_MODEL_MANIFEST_V1.files).toEqual(parsed.files.filter(row => row.path !== 'README.md')
      .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })));
    expect(PINNED_LOCAL_MODEL_MANIFEST_V1.totalBytes).toBe(6_691_020_416);
    const delivery = createLocalModelDeliveryV1({ manifest: PINNED_LOCAL_MODEL_MANIFEST_V1 });
    expect(delivery.status().phase).toBe('unknown');
    expect(delivery.baseUrl).toBe('https://huggingface.co/cgb/flux2-klein-4b-onnx-webgpu/resolve/3bffc0efef1d9f84727036cdbc44df3b6ab51131/');
  });
  it('installs actual stream bytes, publishes last, reopens/reverifies and returns a composed Blob', async () => {
    const f = fixture(); const delivery = f.make();
    expect((await delivery.verify()).phase).toBe('missing'); expect(f.calls).toEqual([]);
    const result = await delivery.install();
    expect(result).toMatchObject({ phase: 'ready', ready: true, verifiedFiles: 2, verifiedBytes: C * 2 + 40, storedBytes: C * 2 + 40,
      qualityAccepted: false, deviceQualified: false });
    expect(f.disk.closes.at(-1)).toContain('/ready-'); expect(readyMarkers(f.disk)).toHaveLength(1);
    const previousCalls = f.calls.length, reopened = f.make(); expect(reopened.status().ready).toBe(false);
    await expect(reopened.openFile('file-0.data')).rejects.toThrow('model-not-verified-ready');
    expect((await reopened.verify()).ready).toBe(true); expect(f.calls).toHaveLength(previousCalls);
    expect(new Uint8Array(await (await reopened.openFile('file-0.data')).arrayBuffer())).toEqual(f.data[0]);
    expect(Math.max(...f.disk.reads)).toBe(C);
  });
  it('cancels after one committed chunk and resumes only the missing Range on a new instance', async () => {
    const f = fixture(), controller = new AbortController();
    const result = await f.make(status => { if (status.storedBytes >= C && status.phase === 'downloading') controller.abort(); }).install({ signal: controller.signal });
    expect(result.phase).toBe('canceled'); expect(readyMarkers(f.disk)).toEqual([]);
    const resumed = f.make(); expect((await resumed.verify()).phase).toBe('partial');
    expect((await resumed.install()).ready).toBe(true);
    expect(f.calls[1]!.range).toBe(`bytes=${C}-`); expect(f.calls).toHaveLength(3);
  });
  it('retains truncated prefixes without ready, then successfully resumes instead of restarting bytes', async () => {
    const f = fixture(); f.mode('short'); const first = await f.make().install();
    expect(first).toMatchObject({ phase: 'failed', ready: false, error: 'truncated-file' }); expect(readyMarkers(f.disk)).toEqual([]);
    f.mode('good'); const restored = await f.make().install(); expect(restored.ready).toBe(true);
    expect(f.calls[1]!.range).toBe(`bytes=${2 * C}-`);
  });
  it('rejects bad file SHA, preserves failed chunks and explicitly retries into a distinct attempt', async () => {
    const f = fixture([bytes(71)]); f.mode('corrupt');
    expect(await f.make().install()).toMatchObject({ phase: 'invalid', ready: false, error: 'hash-mismatch' });
    expect(readyMarkers(f.disk)).toEqual([]); expect((await f.make().verify()).phase).toBe('failed');
    const retained = [...f.disk.files.entries()].filter(([name]) => name.includes('attempt-1/')).map(([name, value]) => [name, sha(value)]);
    f.mode('good'); expect((await f.make().install()).ready).toBe(true);
    for (const [name, hash] of retained) expect(sha(f.disk.files.get(name!)!)).toBe(hash);
  });
  it('hashes committed storage bytes, catching corruption introduced by the writer', async () => {
    const f = fixture([bytes(71)]); f.disk.corruptChunk = true;
    expect(await f.make().install()).toMatchObject({ phase: 'invalid', ready: false, error: 'hash-mismatch' });
    expect(readyMarkers(f.disk)).toEqual([]);
  });
  it('refuses excess bytes and an ignored resumed Range with no partial ready publication', async () => {
    const f = fixture([bytes(C + 17)]); f.mode('excess');
    expect((await f.make().install()).error).toBe('excess-file-bytes'); expect(readyMarkers(f.disk)).toEqual([]);
    f.mode('ignore-range'); expect((await f.make().install()).error).toBe('invalid-range-response');
    expect(readyMarkers(f.disk)).toEqual([]);
    f.mode('good'); expect((await f.make().install()).ready).toBe(true);
  });
  it('pauses before fetch when total origin headroom is insufficient and preserves unrelated blobs', async () => {
    const f = fixture([bytes(71)]); f.disk.files.set('game-save', bytes(900, 3)); f.disk.quota = 900;
    expect(await f.make().install()).toMatchObject({ phase: 'paused', ready: false, error: 'insufficient-storage' });
    expect(f.calls).toEqual([]); expect(f.disk.files.get('game-save')).toEqual(bytes(900, 3));
    f.disk.quota = 20_000_000; expect((await f.make().install()).ready).toBe(true);
  });
  it('write-time quota failure never commits readiness or rewrites preexisting bytes', async () => {
    const f = fixture([bytes(71)]); f.disk.files.set('prior-model', bytes(21, 4)); f.disk.failWrite = true;
    expect(await f.make().install()).toMatchObject({ phase: 'paused', ready: false });
    expect(readyMarkers(f.disk)).toEqual([]); expect(f.disk.files.get('prior-model')).toEqual(bytes(21, 4));
    f.disk.failWrite = false; expect((await f.make().install({ restart: true })).ready).toBe(true);
  });
  it('reopen refuses a missing or corrupt ready chunk despite a surviving ready marker', async () => {
    const f = fixture([bytes(71)]); expect((await f.make().install()).ready).toBe(true);
    const key = [...f.disk.files.keys()].find(name => /\/f0-c0$/u.test(name))!;
    const original = f.disk.files.get(key)!; f.disk.files.set(key, bytes(71, 8));
    expect(await f.make().verify()).toMatchObject({ phase: 'invalid', ready: false, error: 'hash-mismatch' });
    f.disk.files.delete(key); expect((await f.make().verify()).error).toBe('missing-ready-chunk');
    f.disk.files.set(key, original); expect((await f.make().verify()).ready).toBe(true);
  });
  it('serializes two browser owners and reuses verified files rather than duplicating installation', async () => {
    const f = fixture([bytes(71)]), first = f.make(), second = f.make();
    const results = await Promise.all([first.install(), second.install()]); expect(results.every(row => row.ready)).toBe(true);
    expect(f.calls).toHaveLength(1); expect(readyMarkers(f.disk)).toHaveLength(1);
  });
  it('rejects same-instance overlapping work without disrupting the running owner', async () => {
    const f = fixture([bytes(71)]), owner = f.make(), first = owner.install();
    await expect(owner.install()).rejects.toThrow('delivery-busy'); expect((await first).ready).toBe(true);
  });
  it('validates manifest paths, totals and base URLs before storage or network I/O', () => {
    const source = manifest([bytes(3)]);
    expect(() => createLocalModelDeliveryV1({ manifest: { ...source, totalBytes: 2 } })).toThrow('invalid-manifest-total');
    expect(() => createLocalModelDeliveryV1({ manifest: { ...source, files: [{ ...source.files[0]!, path: '../private' }] } })).toThrow('invalid-manifest-file');
    expect(() => createLocalModelDeliveryV1({ manifest: source, baseUrl: 'http://example.com/' })).toThrow('invalid-base-url');
    expect(() => createLocalModelDeliveryV1({ manifest: source, baseUrl: 'https://user:pass@example.com/' })).toThrow('invalid-base-url');
  });
  it('reports capability facts while keeping API support distinct from model/device qualification', async () => {
    const host = { storage: { estimate: async () => ({ usage: 12, quota: 34 }), persisted: async () => false, getDirectory: () => undefined },
      locks: { request: () => undefined }, gpu: { requestAdapter: async () => ({ features: new Set(['shader-f16']), info: { isFallbackAdapter: false },
        limits: { maxBufferSize: 1024, maxStorageBufferBindingSize: 512, maxStorageBuffersPerShaderStage: 8 } }) } } as unknown as Pick<Navigator, 'storage' | 'locks' | 'gpu'>;
    expect(await probeLocalModelCapabilitiesV1(host, true)).toMatchObject({ supported: true, deviceQualified: false,
      shaderF16: true, limits: { maxBufferSize: 1024 }, storage: { usageBytes: 12, quotaBytes: 34, persisted: false } });
    expect((await probeLocalModelCapabilitiesV1(host, false)).supported).toBe(false);
    const absent = { ...host, gpu: undefined } as unknown as typeof host;
    expect(await probeLocalModelCapabilitiesV1(absent, true)).toMatchObject({ supported: false, webgpu: false, deviceQualified: false });
  });
});
