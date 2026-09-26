/** G5 in the game (audits/G5_ROUTING_20260926/README.md): the desktop adapter speaks the worker's creature-finish-v1 job with
 * TRANSFERRED buffers and refuses wrong pins; the developer transport admits only the pinned model on this origin; and the real
 * pinned library + fit bytes run end to end through the adapter, Codex's engine and the store back to the shipped card master. */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { appFinishFitForV1, createFinishInferV1, creatureFinishModelHashV1, developerFinishRuntimeV1 } from './creature-finish-app.js';
import { createCreatureFinishRouteV1 } from './creature-finish-route.js';
import { creatureOriginalKey, type AiCreatureInputV1, type AiCreatureOriginalStoreV1, type AiCreatureOriginalV1 } from './creature-originals.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';
import { decodePng } from './morph/png-decode.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { speciesVisualKey } from '@cf/art/species-identity';

const REPO = new URL('../../../../../', import.meta.url), PUBLIC = new URL('../public/', import.meta.url);
const read = (u: URL) => new Uint8Array(readFileSync(u));
const hash = (b: Uint8Array) => new LocalModelSha256V1().update(b).digestHex();
const publicFetch = (async (input: RequestInfo | URL) => { const p = new URL(String(input)).pathname.slice(1); try { return new Response(read(new URL(p, PUBLIC))); } catch { return new Response(null, { status: 404 }); } }) as typeof fetch;
const LIB = { base: 'http://localhost/', fetchImpl: publicFetch } as const;
// the stage's asset source, read from the repository (fit dirs are relative to the arena proof directory)
const repoAssets = async () => ({ json: async (p: string) => JSON.parse(readFileSync(new URL('audits/' + p.replace(/^\.\.\//, ''), REPO), 'utf8')),
  image: async () => { throw Error('unused'); },
  bytes: async (p: string) => { const rel = 'audits/' + p.replace(/^\.\.\//, ''); return rel.endsWith('.gz') ? new Uint8Array(gzipSync(readFileSync(new URL(rel.slice(0, -3), REPO)))) : read(new URL(rel, REPO)); } }) as never;
function memoryStore() { const rows = new Map<string, AiCreatureOriginalV1>(); const find = async (i: AiCreatureInputV1) => rows.get(creatureOriginalKey(i)) ?? null;
  const store: AiCreatureOriginalStoreV1 = { find, read: find, close() {}, async retain(i, blob, receipt) { const key = creatureOriginalKey(i); if (rows.has(key)) throw Error('immutable');
    const row = { key, blob, receipt, sha256: hash(new Uint8Array(await blob.arrayBuffer())) }; rows.set(key, row); return row; } };
  return { store, rows }; }
/** A worker double: receives the job through a REAL structured-clone transfer (the sender's buffers detach) and answers with the
 * master it was sent (an identity finish), or an error. */
function fakeWorker(log: { jobs: Record<string, unknown>[]; detached: boolean[] }, answer: 'identity' | 'error' | 'short' = 'identity') {
  return class { onmessage: ((e: { data: unknown }) => void) | null = null; onerror: ((e: { message: string }) => void) | null = null;
    constructor(public url: string) {}
    postMessage(msg: { recipe: { master: { buffer: ArrayBuffer }; labels: { buffer: ArrayBuffer } }; requestId: number }, transfer: ArrayBuffer[]) {
      const job = structuredClone(msg, { transfer }) as typeof msg & Record<string, unknown>; log.jobs.push(job); log.detached.push(...transfer.map((b) => b.byteLength === 0));
      queueMicrotask(() => this.onmessage?.({ data: answer === 'error' ? { type: 'error', requestId: job.requestId, message: 'model refused' }
        : { type: 'complete', requestId: job.requestId, rgba: answer === 'short' ? new Uint8Array(4) : new Uint8Array(job.recipe.master.buffer) } })); }
    terminate() {} } as unknown as typeof Worker;
}
const crab = (seed = 5) => ({ _earthName: 'Crab', kingdom: 'fauna', seed, color: 12, accent: 3, size: 0, head: 0, tail: 1, pattern: 0 });

describe('G5 in the game', () => {
  it('developer transport: only the pinned model, only this origin', async () => {
    const files = Object.fromEntries(PINNED_LOCAL_MODEL_MANIFEST_V1.files.map((f) => [f.path, '/__local_ai/model/' + f.path]));
    const ok = { modelId: PINNED_LOCAL_MODEL_MANIFEST_V1.modelId, modelRevision: PINNED_LOCAL_MODEL_MANIFEST_V1.revision, modelSource: 'verified-installed-developer-cache', modelFiles: files };
    const serve = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    const rt = await developerFinishRuntimeV1(serve(ok), 'http://localhost'); expect(rt?.workerUrl).toBe('/__local_ai/kit-stage-worker.mjs'); expect(Object.keys(rt!.modelFiles).length).toBe(PINNED_LOCAL_MODEL_MANIFEST_V1.files.length);
    expect(await developerFinishRuntimeV1(serve({ ...ok, modelRevision: 'x' }), 'http://localhost')).toBeNull();
    expect(await developerFinishRuntimeV1(serve({ ...ok, modelFiles: { ...files, [PINNED_LOCAL_MODEL_MANIFEST_V1.files[0]!.path]: 'https://evil.example/m' } }), 'http://localhost')).toBeNull();
    expect(await developerFinishRuntimeV1(serve({}, 404), 'http://localhost')).toBeNull();
  });
  it('END TO END on the real Crab: pinned library master+labels → adapter (transferred job) → engine → store → the shipped card master; wrong model pin, a worker error and a short result all fall back (controls)', async () => {
    const modelHash = creatureFinishModelHashV1(), fitFor = appFinishFitForV1(repoAssets, LIB), cutouts = new Map<string, string>();
    const make = (answer: 'identity' | 'error' | 'short', mh = modelHash) => { const log = { jobs: [] as Record<string, unknown>[], detached: [] as boolean[] }, m = memoryStore();
      const route = createCreatureFinishRouteV1({ tier: 'desktop', store: m.store, modelHash: mh, fitFor, identityOf: (g) => ({ visualKey: speciesVisualKey(g as Record<string, unknown>), seed: Number(g.seed) >>> 0 }),
        onSource: (s) => cutouts.set(s.individualId + '|' + s.settingsHash, s.cutoutAssetHash),
        createInfer: createFinishInferV1({ workerUrl: '/w.mjs', modelFiles: { a: 'b' }, modelHash, cutoutOf: (id, st) => cutouts.get(id + '|' + st) ?? null, WorkerCtor: fakeWorker(log, answer) }) });
      return { route, log, m }; };
    const good = make('identity');
    expect(await good.route.enqueue(crab())).toBe('retained');
    expect(good.log.jobs).toHaveLength(1); expect(good.log.jobs[0]).toMatchObject({ stage: 'creature-finish-v1', modelFiles: { a: 'b' } }); expect(good.log.detached).toEqual([true, true]);
    const f = await good.route.lookup(crab()), shipped = await decodePng(read(new URL(CARD_ARCHETYPES.find((a) => a.earthName === 'Crab')!.dir + 'card/master-512.png', REPO)));
    expect(Buffer.from(f!.rgba).equals(Buffer.from(shipped.rgba))).toBe(true);
    for (const answer of ['error', 'short'] as const) { const bad = make(answer); expect(await bad.route.enqueue(crab())).toBe('fallback'); expect(bad.m.rows.size).toBe(0); }
    const wrongModel = make('identity', 'f'.repeat(64)); expect(await wrongModel.route.enqueue(crab())).toBe('fallback'); expect(wrongModel.log.jobs).toHaveLength(0);
    await expect(fitFor({ _earthName: 'Civet', kingdom: 'fauna', seed: 1 })).rejects.toMatchObject({ code: 'not-in-library' });
  }, 240_000);
});
