import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { createLocalModelVariantStorageV1, createVariantStorageOwnerV1,
  type VariantStorageContractV1 } from '../apps/game/src/local-model-variant-storage.js';
import { runVerifiedVariantTransactionV1, type LocalModelVariantReadyV1,
  type LocalModelVariantTransactionV1 } from '../apps/game/src/local-model-variant.js';
import { LOCAL_MODEL_CHUNK_BYTES_V1 as C, type LocalModelDirectoryV1,
  type LocalModelFileHandleV1, type LocalModelStorageV1, type LocalModelLockV1 } from '../apps/game/src/local-model-delivery.js';

const sha = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const bytes = (count: number, salt = 0): Uint8Array<ArrayBuffer> => Uint8Array.from({ length: count }, (_, i) => (i * 37 + salt) & 255);
const absent = (): DOMException => new DOMException('Fixture entry absent', 'NotFoundError');
const NS = 'cf-local-model-variants-v1/';
/** Atomic-close storage with real bytes and independently computed SHA pins.
 * Browser OPFS persistence and memory accounting remain separate native proofs. */
class Disk {
  files = new Map<string, Uint8Array<ArrayBuffer>>(); dirs = new Set(['']); closes: string[] = [];
  failWrite: RegExp | null = null; corruptClose: RegExp | null = null;
  onClose: ((path: string) => void) | null = null; quota = 1_000_000_000;
  get usage(): number { return [...this.files.values()].reduce((sum, value) => sum + value.length, 0); }
  directory(prefix = ''): LocalModelDirectoryV1 {
    return {
      getDirectoryHandle: async (name, options) => {
        const key = `${prefix}${name}/`;
        if (!this.dirs.has(key)) { if (!options?.create) throw absent(); this.dirs.add(key); }
        return this.directory(key);
      },
      getFileHandle: async (name, options): Promise<LocalModelFileHandleV1> => {
        const key = prefix + name;
        if (!this.files.has(key)) { if (!options?.create) throw absent(); this.files.set(key, new Uint8Array()); }
        return { getFile: async () => {
          const value = this.files.get(key); if (!value) throw absent(); return new Blob([value]);
        }, createWritable: async () => {
          let pending: Uint8Array<ArrayBuffer> | null = null, retired = false;
          return { write: async value => {
            if (this.failWrite?.test(key)) throw new DOMException('Fixture write quota', 'QuotaExceededError');
            if (retired) throw Error('Retired writer');
            pending = typeof value === 'string' ? new TextEncoder().encode(value) : value.slice();
          }, close: async () => {
            if (retired || !pending) throw Error('Invalid close');
            if (this.corruptClose?.test(key)) pending[Math.floor(pending.length / 2)]! ^= 1;
            this.files.set(key, pending); this.closes.push(key); retired = true; this.onClose?.(key);
          }, abort: async () => { retired = true; } };
        } };
      },
    };
  }
  storage: LocalModelStorageV1 = { getDirectory: async () => this.directory(),
    estimate: async () => ({ usage: this.usage, quota: this.quota }) };
}
function lockFixture() {
  let tail: Promise<void> = Promise.resolve(), held = 0; const names: string[] = [];
  const locks: LocalModelLockV1 = { async run<T>(name: string, signal: AbortSignal, action: () => Promise<T>): Promise<T> {
    names.push(name); const before = tail; let release!: () => void;
    tail = new Promise(resolve => { release = resolve; }); await before;
    let entered = false;
    try { if (signal.aborted) throw new DOMException('Canceled', 'AbortError'); held++; entered = true; return await action(); }
    finally { if (entered) held--; release(); }
  } };
  return { locks, names, held: () => held };
}
function fixture(data = [bytes(C + 17), bytes(23, 7)]) {
  const disk = new Disk(), lock = lockFixture(); let sequence = 0;
  const contract: VariantStorageContractV1 = { planSha256: 'a'.repeat(64), parentManifestSha256: 'b'.repeat(64),
    sourceManifestSha256: 'c'.repeat(64), files: data.map((value, index) => ({ path: `output-${index}.data`, bytes: value.length, sha256: sha(value) })) };
  const marker: LocalModelVariantReadyV1 = { schema: 'cf.local-model-variant-ready.v1', variant: 'q8-block32-repacked-v1',
    planSha256: contract.planSha256, parentManifestSha256: contract.parentManifestSha256, parentAttemptId: 'parent-1',
    sourceManifestSha256: contract.sourceManifestSha256, files: contract.files,
    payloadBytes: data.reduce((sum, value) => sum + value.length, 0), qualityAccepted: false, deviceQualified: false };
  const request = { payloadBytes: marker.payloadBytes, markerBudgetBytes: 65536, planSha256: marker.planSha256,
    parentManifestSha256: marker.parentManifestSha256, parentAttemptId: marker.parentAttemptId };
  const make = (createAttemptId = () => `test-${++sequence}`) => createVariantStorageOwnerV1(contract,
    { storage: disk.storage, locks: lock.locks, createAttemptId });
  const append = async (write: LocalModelVariantTransactionV1['write']) => {
    for (let index = 0; index < data.length; index++) for (let at = 0; at < data[index]!.length; at += C / 4) {
      await write(contract.files[index]!.path, at, data[index]!.slice(at, at + C / 4));
    }
  };
  const derive = (owner = make(), signal = new AbortController().signal) =>
    runVerifiedVariantTransactionV1({ marker, storage: owner, signal, produce: append });
  const prepared = async (signal = new AbortController().signal) => {
    const owner = make(), transaction = await owner.begin(request, signal);
    for (let index = 0; index < data.length; index++) {
      for (let at = 0; at < data[index]!.length; at += C / 4) await transaction.write(contract.files[index]!.path, at, data[index]!.slice(at, at + C / 4));
      await transaction.seal(contract.files[index]!.path);
    }
    return { owner, transaction };
  };
  return { data, disk, lock, contract, marker, request, make, derive, prepared,
    pointer: `${NS}ready-${contract.planSha256}.json`, attempt: (id = 'test-1') => `${NS}attempt-${id}/` };
}

describe('derived model storage: exact bytes, retained attempts and explicit exclusive lease', () => {
  it('constructs the pinned public owner without touching unsupported browser capabilities', () => {
    const owner = createLocalModelVariantStorageV1();
    expect(owner.status()).toEqual({ phase: 'unknown', ready: false, marker: null, error: null, verifiedBytes: 0 });
  });
  it('persists exact immutable chunk geometry, re-verifies in a fresh instance, and never changes parent bytes', async () => {
    const f = fixture(), originalParent = bytes(13, 8); f.disk.files.set('cf-local-model-delivery-v1/parent', originalParent);
    const owner = f.make(); expect(await f.derive(owner)).toEqual({ writtenPayloadBytes: f.marker.payloadBytes, verifiedPayloadBytes: f.marker.payloadBytes });
    expect(owner.status()).toMatchObject({ phase: 'ready', ready: true, marker: f.marker, verifiedBytes: f.marker.payloadBytes });
    expect(f.disk.files.get(`${f.attempt()}f0-c0`)!.length).toBe(C);
    expect(f.disk.files.get(`${f.attempt()}f0-c1`)!.length).toBe(17);
    expect(f.disk.files.get(`${f.attempt()}f1-c0`)!.length).toBe(23);
    expect(f.disk.files.get('cf-local-model-delivery-v1/parent')).toEqual(originalParent);
    expect(f.disk.closes.every(path => path.startsWith(NS))).toBe(true);
    const reloaded = f.make(); await expect(reloaded.openFile('output-0.data')).rejects.toThrow('explicit verification');
    expect((await reloaded.verify(f.contract.parentManifestSha256, 'parent-1')).ready).toBe(true);
    for (let index = 0; index < f.data.length; index++) expect(new Uint8Array(await (await reloaded.openFile(`output-${index}.data`)).arrayBuffer())).toEqual(f.data[index]);
    expect(new Set(f.lock.names)).toEqual(new Set(['cf-local-model-delivery-v1'])); expect(f.lock.held()).toBe(0);
  });
  it('holds the shared parent lock through commit and readback; only finish admits the queued owner', async () => {
    const f = fixture([bytes(17), bytes(9)]), { owner, transaction } = await f.prepared();
    let nextEntered = false;
    const queued = f.lock.locks.run('cf-local-model-delivery-v1', new AbortController().signal, async () => { nextEntered = true; });
    await transaction.commit(f.marker); expect(await transaction.readReady()).toEqual(f.marker);
    expect(f.lock.held()).toBe(1); expect(nextEntered).toBe(false); expect(owner.status().ready).toBe(false);
    await transaction.finish(); await queued;
    expect(nextEntered).toBe(true); expect(f.lock.held()).toBe(0); expect(owner.status().ready).toBe(true);
    await expect(transaction.abort()).rejects.toThrow('retired');
  });
  it('refuses final release before readback, retaining authority to revoke its committed attempt', async () => {
    const f = fixture([bytes(17), bytes(9)]), { transaction } = await f.prepared(); await transaction.commit(f.marker);
    await expect(transaction.finish()).rejects.toThrow('read back'); expect(f.lock.held()).toBe(1);
    await transaction.abort(); expect(f.lock.held()).toBe(0);
    expect((await f.make().verify(f.contract.parentManifestSha256, 'parent-1')).phase).toBe('missing');
    expect(f.disk.files.has(`${f.attempt()}revoked.json`)).toBe(true);
  });
  it('refuses existing committed output without overwriting it, then permits explicit full verification', async () => {
    const f = fixture([bytes(17), bytes(9)]); await f.derive(); const before = f.disk.files.get(f.pointer)!.slice();
    await expect(f.derive()).rejects.toThrow('already committed'); expect(f.disk.files.get(f.pointer)).toEqual(before);
    expect((await f.make().verify(f.contract.parentManifestSha256, 'parent-1')).ready).toBe(true); expect(f.lock.held()).toBe(0);
  });
  it('allows an explicit new attempt only after known revocation, retaining every old output byte', async () => {
    const f = fixture([bytes(17), bytes(9)]), { transaction } = await f.prepared();
    await transaction.commit(f.marker); await transaction.readReady(); await transaction.abort();
    const old = new Map([...f.disk.files].filter(([path]) => path.startsWith(f.attempt())).map(([path, value]) => [path, value.slice()]));
    await f.derive(); expect(JSON.parse(new TextDecoder().decode(f.disk.files.get(f.pointer)!)).attemptId).toBe('test-2');
    for (const [path, value] of old) expect(f.disk.files.get(path)).toEqual(value);
  });
  it.each(['null', '{broken', '{}'])('preserves malformed/foreign pointer %s and refuses both begin and readiness', async value => {
    const f = fixture([bytes(17), bytes(9)]); f.disk.dirs.add(NS); const original = new TextEncoder().encode(value); f.disk.files.set(f.pointer, original);
    await expect(f.derive()).rejects.toThrow(); expect(f.disk.files.get(f.pointer)).toEqual(original);
    expect((await f.make().verify(f.contract.parentManifestSha256, 'parent-1')).phase).toBe('invalid'); expect(f.lock.held()).toBe(0);
  });
  it('refuses wrong parent/plan/payload before allocation and a different parent attempt after reload', async () => {
    const f = fixture([bytes(17), bytes(9)]), owner = f.make();
    for (const altered of [{ parentManifestSha256: 'd'.repeat(64) }, { planSha256: 'e'.repeat(64) }, { payloadBytes: 25 }, { parentAttemptId: '../x' }]) {
      await expect(owner.begin({ ...f.request, ...altered }, new AbortController().signal)).rejects.toThrow('identity');
    }
    expect(f.disk.files.size).toBe(0); await f.derive(owner);
    expect((await f.make().verify(f.contract.parentManifestSha256, 'other-parent')).phase).toBe('invalid');
  });
  it('reserves full additional payload, marker, staging and 64MiB headroom against actual origin usage', async () => {
    const f = fixture([bytes(17), bytes(9)]); f.disk.files.set('other-owner', bytes(103));
    f.disk.quota = f.disk.usage + f.marker.payloadBytes + 65536 + 65 * C - 1;
    await expect(f.derive()).rejects.toThrow('insufficient storage'); expect(f.disk.files.size).toBe(1); expect(f.lock.held()).toBe(0);
  });
  it('checks shrinking quota after a durable chunk and keeps that partial without publishing readiness', async () => {
    const f = fixture(); f.disk.onClose = path => { if (path.endsWith('f0-c0')) f.disk.quota = f.disk.usage + 65 * C; };
    await expect(f.derive()).rejects.toThrow('insufficient storage');
    expect(f.disk.files.get(`${f.attempt()}f0-c0`)).toEqual(f.data[0]!.slice(0, C));
    expect(f.disk.files.has(f.pointer)).toBe(false); expect(f.disk.files.has(`${f.attempt()}revoked.json`)).toBe(true); expect(f.lock.held()).toBe(0);
  });
  it('self-releases a failed begin without granting a transaction or overwriting its partial metadata', async () => {
    const f = fixture([bytes(17), bytes(9)]); f.disk.failWrite = /attempt\.json$/u;
    await expect(f.derive()).rejects.toThrow('quota'); expect(f.lock.held()).toBe(0); expect(f.disk.files.has(f.pointer)).toBe(false);
    f.disk.failWrite = null; await f.derive(); expect(f.disk.files.has(`${f.attempt('test-2')}ready.json`)).toBe(true);
  });
  it('rejects an attempt collision and preserves all existing partial files', async () => {
    const f = fixture([bytes(17), bytes(9)]), owner = f.make(() => 'fixed');
    const tx = await owner.begin(f.request, new AbortController().signal); await tx.abort();
    const before = [...f.disk.files]; await expect(f.derive(f.make(() => 'fixed'))).rejects.toThrow('already exists');
    expect([...f.disk.files]).toEqual(before); expect(f.lock.held()).toBe(0);
  });
  it('detects same-size corruption on actual durable chunk readback before readiness', async () => {
    const f = fixture([bytes(17), bytes(9)]); f.disk.corruptClose = /f0-c0$/u;
    await expect(f.derive()).rejects.toThrow('chunk write mismatch'); expect(f.disk.files.has(f.pointer)).toBe(false); expect(f.lock.held()).toBe(0);
  });
  it.each(['middle', 'truncated', 'excess'])('fresh verification refuses %s output alteration', async mode => {
    const f = fixture(); await f.derive(); const path = `${f.attempt()}f0-c0`, original = f.disk.files.get(path)!;
    if (mode === 'middle') { const changed = original.slice(); changed[C / 2]! ^= 1; f.disk.files.set(path, changed); }
    else if (mode === 'truncated') f.disk.files.set(path, original.slice(0, -1));
    else f.disk.files.set(`${f.attempt()}f0-c2`, bytes(1));
    const next = f.make(); expect((await next.verify(f.contract.parentManifestSha256, 'parent-1')).phase).toBe('invalid');
    await expect(next.openFile('output-0.data')).rejects.toThrow('explicit verification'); expect(f.lock.held()).toBe(0);
  });
  it('checks revocation again when opening a previously verified instance', async () => {
    const f = fixture([bytes(17), bytes(9)]), owner = f.make(); await f.derive(owner);
    f.disk.files.set(`${f.attempt()}revoked.json`, new TextEncoder().encode(JSON.stringify({ schema: 'cf.local-model-variant-revoked.v1',
      attemptId: 'test-1', planSha256: f.contract.planSha256 })));
    await expect(owner.openFile('output-0.data')).rejects.toThrow('readiness changed'); expect(owner.status().ready).toBe(false);
  });
  it('revokes a marker committed during cancellation and retains cleanup authority', async () => {
    const f = fixture([bytes(17), bytes(9)]), signal = new AbortController(), owner = f.make();
    f.disk.onClose = path => { if (path === f.pointer) signal.abort(); };
    await expect(f.derive(owner, signal.signal)).rejects.toThrow('canceled');
    expect(f.disk.files.has(f.pointer)).toBe(true); expect(f.disk.files.has(`${f.attempt()}revoked.json`)).toBe(true);
    expect(owner.status().ready).toBe(false); expect((await f.make().verify(f.contract.parentManifestSha256, 'parent-1')).ready).toBe(false); expect(f.lock.held()).toBe(0);
  });
  it('preserves both the original corruption and revocation-write failure while releasing the lock', async () => {
    const f = fixture([bytes(17), bytes(9)]); f.disk.corruptClose = /f0-c0$/u; f.disk.failWrite = /revoked\.json$/u;
    const failure = await f.derive().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AggregateError); expect((failure as AggregateError).errors.map(String).join(' ')).toMatch(/chunk write mismatch.*quota/u);
    expect(f.disk.files.has(f.pointer)).toBe(false); expect(f.lock.held()).toBe(0);
  });
  it('does not publish a marker with promoted quality flags or an altered parent attempt', async () => {
    const f = fixture([bytes(17), bytes(9)]), { transaction } = await f.prepared();
    await expect(transaction.commit({ ...f.marker, parentAttemptId: 'parent-2' })).rejects.toThrow('commit identity');
    await expect(transaction.commit({ ...f.marker, qualityAccepted: true } as unknown as LocalModelVariantReadyV1)).rejects.toThrow('marker identity');
    await transaction.abort(); expect(f.disk.files.has(f.pointer)).toBe(false); expect(f.lock.held()).toBe(0);
  });
  it('reacquires cleanup authority if success release itself fails, and never reports ready', async () => {
    const f = fixture([bytes(17), bytes(9)]); let failRelease = true;
    const locks: LocalModelLockV1 = { async run(name, signal, action) {
      const value = await f.lock.locks.run(name, signal, action);
      if (failRelease) { failRelease = false; throw Error('Fixture lease release failure'); } return value;
    } };
    const owner = createVariantStorageOwnerV1(f.contract, { storage: f.disk.storage, locks, createAttemptId: () => 'release-control' });
    await expect(f.derive(owner)).rejects.toThrow('cleanup failed');
    expect(owner.status().phase).toBe('failed'); expect(f.lock.held()).toBe(0);
    expect(f.disk.files.has(`${f.attempt('release-control')}revoked.json`)).toBe(true);
    expect((await f.make().verify(f.contract.parentManifestSha256, 'parent-1')).ready).toBe(false);
  });
});
