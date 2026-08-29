import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  CF_PWA_SCHEMA,
  __pwaBuildTestOnly,
  canonicalPwaAssetTableV1,
  pwaBuildIdV1,
  pwaWorkerRevisionV1,
  sha256Hex,
  type PwaAssetDigestV1,
} from '../apps/game/pwa-build.js';
import {
  CF_PWA_CLIENT_SCHEMA,
  mountPwaUpdateControl,
} from '../apps/game/src/pwa-update.js';
import { coordinatePwaReload } from '../apps/game/src/pwa-reload.js';

const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => {
    window: Window & typeof globalThis;
  };
};

type WaitEvent = { waitUntil(promise: Promise<unknown>): void };

class MemoryCache {
  readonly rows = new Map<string, Response>();
  readonly puts: string[] = [];

  async match(request: string | Request): Promise<Response | undefined> {
    const key = typeof request === 'string' ? request : request.url;
    return this.rows.get(key)?.clone();
  }

  async put(request: string | Request, response: Response): Promise<void> {
    const key = typeof request === 'string' ? request : request.url;
    this.puts.push(key);
    this.rows.set(key, response.clone());
  }

  async delete(request: string | Request): Promise<boolean> {
    const key = typeof request === 'string' ? request : request.url;
    return this.rows.delete(key);
  }

  async keys(): Promise<Request[]> {
    return [...this.rows.keys()].map((url) => new Request(url));
  }
}

class MemoryCacheStorage {
  readonly rows = new Map<string, MemoryCache>();
  readonly deletes: string[] = [];

  async open(name: string): Promise<MemoryCache> {
    let cache = this.rows.get(name);
    if (!cache) {
      cache = new MemoryCache();
      this.rows.set(name, cache);
    }
    return cache;
  }

  async delete(name: string): Promise<boolean> {
    this.deletes.push(name);
    return this.rows.delete(name);
  }

  async keys(): Promise<string[]> {
    return [...this.rows.keys()];
  }
}

interface WorkerHarness {
  readonly buildId: string;
  readonly workerRevision: string;
  readonly caches: MemoryCacheStorage;
  readonly fetches: string[];
  readonly broadcasts: unknown[];
  readonly replies: unknown[];
  readonly self: {
    skipWaitingCount: number;
    claimCount: number;
  };
  dispatch(type: string, init?: Record<string, unknown>): Promise<unknown>;
}

function responseAt(url: string, body: string): Response {
  const response = new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } });
  Object.defineProperty(response, 'url', { configurable: true, value: url });
  return response;
}

function assetsFor(rows: Readonly<Record<string, string>>): readonly PwaAssetDigestV1[] {
  return Object.freeze(Object.entries(rows).map(([path, body]) => Object.freeze({ path, sha256: sha256Hex(body) })));
}

function createWorkerHarness(
  assets: readonly PwaAssetDigestV1[],
  network: Readonly<Record<string, string>>,
  options: Readonly<{
    caches?: MemoryCacheStorage;
    workerRevision?: string;
    clientIds?: readonly string[];
  }> = Object.freeze({}),
): WorkerHarness {
  const workerRevision = options.workerRevision ?? pwaWorkerRevisionV1();
  const source = __pwaBuildTestOnly.serviceWorkerSource('/', assets, workerRevision);
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const caches = options.caches ?? new MemoryCacheStorage();
  const fetches: string[] = [];
  const broadcasts: unknown[] = [];
  const replies: unknown[] = [];
  const state = { skipWaitingCount: 0, claimCount: 0 };
  const clients = (options.clientIds ?? Object.freeze(['client-current'])).map((id) => ({
    id,
    postMessage(message: unknown) { broadcasts.push(message); },
  }));
  const self = {
    location: new URL('https://game.test/service-worker.js'),
    registration: { scope: 'https://game.test/' },
    clients: {
      async claim() { state.claimCount++; },
      async matchAll() { return clients; },
    },
    async skipWaiting() { state.skipWaitingCount++; },
    addEventListener(type: string, listener: (event: Record<string, unknown>) => void) {
      listeners.set(type, listener);
    },
  };
  const networkFetch = async (request: Request): Promise<Response> => {
    fetches.push(request.url);
    const url = new URL(request.url);
    const body = network[url.pathname];
    if (body === undefined) return responseAt(request.url, 'missing');
    return responseAt(request.url, body);
  };
  const context = vm.createContext({
    self,
    caches,
    fetch: networkFetch,
    crypto: webcrypto,
    TextEncoder,
    URL,
    Request,
    Response,
    Set,
    console,
  });
  vm.runInContext(source, context, { filename: 'generated-service-worker.js' });
  const buildId = pwaBuildIdV1(assets, workerRevision);

  return {
    buildId,
    workerRevision,
    caches,
    fetches,
    broadcasts,
    replies,
    self: {
      get skipWaitingCount() { return state.skipWaitingCount; },
      set skipWaitingCount(value: number) { state.skipWaitingCount = value; },
      get claimCount() { return state.claimCount; },
      set claimCount(value: number) { state.claimCount = value; },
    },
    async dispatch(type: string, init: Record<string, unknown> = {}): Promise<unknown> {
      const listener = listeners.get(type);
      if (!listener) throw new Error(`missing ${type} listener`);
      let work: Promise<unknown> = Promise.resolve();
      let response: Promise<unknown> | null = null;
      const event: Record<string, unknown> & WaitEvent = {
        ...init,
        waitUntil(promise: Promise<unknown>) { work = promise; },
      };
      if (type === 'message' && !event.source) {
        event.source = {
          id: clients[0]?.id ?? 'client-current',
          postMessage(message: unknown) { replies.push(message); },
        };
      }
      if (type === 'fetch') {
        event.clientId ??= clients[0]?.id ?? '';
        const request = event.request as { mode?: string; destination?: string } | undefined;
        if ((request?.mode === 'navigate' || request?.destination === 'document')
          && event.resultingClientId === undefined) {
          event.resultingClientId = clients[0]?.id ?? '';
        }
        event.respondWith = (promise: Promise<unknown>) => { response = promise; };
      }
      listener(event);
      await work;
      return response ? await response : undefined;
    },
  };
}

async function seedCompleteBuild(
  caches: MemoryCacheStorage,
  rows: Readonly<Record<string, string>>,
  workerRevision = pwaWorkerRevisionV1(),
): Promise<string> {
  const assets = assetsFor(rows);
  const buildId = pwaBuildIdV1(assets, workerRevision);
  const cache = await caches.open(`cf-v2-build-${buildId}`);
  for (const [path, body] of Object.entries(rows)) {
    await cache.put(`https://game.test${path}`, responseAt(`https://game.test${path}`, body));
  }
  await cache.put(
    `https://game.test/__cf_pwa_complete__/${buildId}`,
    new Response(JSON.stringify({
      schema: CF_PWA_SCHEMA,
      buildId,
      workerRevision,
      basePath: '/',
      assets,
    }), {
      headers: { 'content-type': 'application/json' },
    }),
  );
  return buildId;
}

async function seedControlState(caches: MemoryCacheStorage, activeBuildId: string, priorBuildId: string | null): Promise<void> {
  const control = await caches.open('cf-v2-pwa-control-v1');
  await control.put(
    'https://game.test/__cf_pwa_control__/state-v1',
    new Response(JSON.stringify({ schema: CF_PWA_SCHEMA, activeBuildId, priorBuildId }), {
      headers: { 'content-type': 'application/json' },
    }),
  );
}

async function seedClientPin(caches: MemoryCacheStorage, clientId: string, buildId: string): Promise<void> {
  const control = await caches.open('cf-v2-pwa-control-v1');
  await control.put(
    `https://game.test/__cf_pwa_control__/client-v1/${encodeURIComponent(clientId)}`,
    new Response(JSON.stringify({ schema: CF_PWA_SCHEMA, clientId, buildId }), {
      headers: { 'content-type': 'application/json' },
    }),
  );
}

async function readControlState(
  caches: MemoryCacheStorage,
): Promise<Readonly<{ activeBuildId: string; priorBuildId: string | null }> | null> {
  const control = await caches.open('cf-v2-pwa-control-v1');
  const response = await control.match('https://game.test/__cf_pwa_control__/state-v1');
  return response ? await response.json() as Readonly<{ activeBuildId: string; priorBuildId: string | null }> : null;
}

async function readClientPin(caches: MemoryCacheStorage, clientId: string): Promise<string | null> {
  const control = await caches.open('cf-v2-pwa-control-v1');
  const response = await control.match(
    `https://game.test/__cf_pwa_control__/client-v1/${encodeURIComponent(clientId)}`,
  );
  if (!response) return null;
  const value = await response.json() as Readonly<{ buildId?: unknown }>;
  return typeof value.buildId === 'string' ? value.buildId : null;
}

describe('Celestial Frontier exact-build PWA', () => {
  it('derives a stable build identity from sorted exact paths and bytes', () => {
    const left = assetsFor({ '/index.html': 'index-a', '/assets/main-a.js': 'main-a' });
    const right = [...left].reverse();
    expect(canonicalPwaAssetTableV1(left)).toBe(canonicalPwaAssetTableV1(right));
    expect(pwaBuildIdV1(left)).toBe(pwaBuildIdV1(right));
    expect(pwaBuildIdV1(assetsFor({ '/index.html': 'index-b', '/assets/main-a.js': 'main-a' })))
      .not.toBe(pwaBuildIdV1(left));
    expect(pwaWorkerRevisionV1()).toMatch(/^[a-f0-9]{64}$/u);
    expect(pwaBuildIdV1(left, '1'.repeat(64))).not.toBe(pwaBuildIdV1(left, '2'.repeat(64)));
    const workerTemplate = __pwaBuildTestOnly.workerTemplateSource();
    expect(pwaWorkerRevisionV1()).toBe(sha256Hex(workerTemplate));
    expect(sha256Hex(workerTemplate.replace(
      'This document has no retained Celestial Frontier build.',
      'This document has no retained exact Celestial Frontier build.',
    ))).not.toBe(pwaWorkerRevisionV1());
    expect(() => canonicalPwaAssetTableV1([...left, left[0]!])).toThrow(/duplicate asset/u);

    const localeHostile = assetsFor({ '/z': 'z', '/A': 'upper', '/a': 'lower', '/-': 'dash' });
    const orderedPaths = canonicalPwaAssetTableV1(localeHostile)
      .split('\n')
      .slice(1, -1)
      .map((row) => row.split('\t')[0]);
    expect(orderedPaths).toEqual(['/-', '/A', '/a', '/z']);
  });

  it('emits same-origin install metadata and excludes no-runtime source maps from its contract', () => {
    const manifest = JSON.parse(__pwaBuildTestOnly.webManifest('/frontier/')) as Record<string, unknown>;
    expect(manifest).toMatchObject({
      id: '/frontier/', start_url: '/frontier/', scope: '/frontier/',
      display: 'standalone', background_color: '#05070d', theme_color: '#0b1428',
    });
    expect(JSON.stringify(manifest)).not.toMatch(/https?:\/\//u);
    expect(() => __pwaBuildTestOnly.normalizeBase('//cdn.example/')).toThrow(/same-origin/u);

    const assets = assetsFor({
      '/index.html': 'index',
      '/assets/main.js': 'main',
      '/manifest.webmanifest': 'manifest',
    });
    const source = __pwaBuildTestOnly.serviceWorkerSource('/', assets);
    expect(source).toContain(`const BUILD_ID=${JSON.stringify(pwaBuildIdV1(assets))}`);
    expect(source).toContain("Written last: its presence means every exact response above was fetched and verified.");
    expect(source).not.toMatch(/"path":"[^"]+\.map"/u);
    expect(source.indexOf("self.addEventListener('install'"))
      .toBeLessThan(source.indexOf("self.addEventListener('activate'"));
    const install = source.slice(source.indexOf("self.addEventListener('install'"), source.indexOf("self.addEventListener('activate'"));
    expect(install).not.toContain('skipWaiting');
  });

  it('writes its complete marker last only after every body passes its exact digest', async () => {
    const rows = { '/index.html': 'index-v1', '/assets/main-v1.js': 'main-v1', '/manifest.webmanifest': 'manifest-v1' };
    const harness = createWorkerHarness(assetsFor(rows), rows);
    await harness.dispatch('install');
    const cache = harness.caches.rows.get(`cf-v2-build-${harness.buildId}`)!;
    expect(cache.puts.at(-1)).toBe(`https://game.test/__cf_pwa_complete__/${harness.buildId}`);
    expect(harness.self.skipWaitingCount).toBe(0);
  });

  it('deletes a partial cache and rejects install when one fetched body is not exact', async () => {
    const rows = { '/index.html': 'index-v1', '/assets/main-v1.js': 'main-v1' };
    const harness = createWorkerHarness(assetsFor(rows), { ...rows, '/assets/main-v1.js': 'tampered' });
    await expect(harness.dispatch('install')).rejects.toThrow(/digest mismatch/u);
    expect(harness.caches.rows.has(`cf-v2-build-${harness.buildId}`)).toBe(false);
    expect(harness.caches.deletes.filter((name) => name === `cf-v2-build-${harness.buildId}`).length).toBe(2);
  });

  it('reuses a verified same-identity cache without deleting or refetching the selected build', async () => {
    const caches = new MemoryCacheStorage();
    const rows = { '/index.html': 'index-v1', '/assets/main-v1.js': 'main-v1' };
    const first = createWorkerHarness(assetsFor(rows), rows, {
      caches,
      workerRevision: '1'.repeat(64),
    });
    await first.dispatch('install');
    await first.dispatch('activate');
    const deletesBefore = caches.deletes.length;

    const repeated = createWorkerHarness(assetsFor(rows), {
      ...rows,
      '/assets/main-v1.js': 'network-must-not-win',
    }, {
      caches,
      workerRevision: '1'.repeat(64),
    });
    expect(repeated.buildId).toBe(first.buildId);
    await repeated.dispatch('install');
    expect(repeated.fetches).toHaveLength(0);
    expect(caches.deletes).toHaveLength(deletesBefore);
    expect(caches.rows.has(`cf-v2-build-${first.buildId}`)).toBe(true);
    expect(await readControlState(caches)).toMatchObject({ activeBuildId: first.buildId });
  });

  it('activates only a verified build and retains exactly it plus one verified predecessor', async () => {
    const newestRows = { '/index.html': 'index-new', '/assets/main-new.js': 'main-new' };
    const harness = createWorkerHarness(assetsFor(newestRows), newestRows);
    const oldestId = await seedCompleteBuild(harness.caches, { '/index.html': 'index-oldest', '/assets/main-oldest.js': 'main-oldest' });
    const priorId = await seedCompleteBuild(harness.caches, { '/index.html': 'index-prior', '/assets/main-prior.js': 'main-prior' });
    await seedControlState(harness.caches, priorId, oldestId);
    await harness.dispatch('install');
    await harness.dispatch('activate');
    expect(harness.self.claimCount).toBe(0);
    expect(new Set(await harness.caches.keys())).toEqual(new Set([
      'cf-v2-pwa-control-v1',
      `cf-v2-build-${harness.buildId}`,
      `cf-v2-build-${priorId}`,
    ]));
    expect(harness.caches.deletes).toContain(`cf-v2-build-${oldestId}`);
  });

  it('pins a running document to its exact predecessor until navigation adopts the active build', async () => {
    const caches = new MemoryCacheStorage();
    const oldRows = { '/index.html': 'index-old', '/assets/main-old.js': 'main-old' };
    const oldHarness = createWorkerHarness(assetsFor(oldRows), oldRows, {
      caches,
      workerRevision: '1'.repeat(64),
      clientIds: ['client-old'],
    });
    await oldHarness.dispatch('install');
    await oldHarness.dispatch('activate');
    expect(oldHarness.self.claimCount).toBe(1);
    expect(await readClientPin(caches, 'client-old')).toBe(oldHarness.buildId);

    const newRows = { '/index.html': 'index-new', '/assets/main-new.js': 'main-new' };
    const newHarness = createWorkerHarness(assetsFor(newRows), newRows, {
      caches,
      workerRevision: '2'.repeat(64),
      clientIds: ['client-old'],
    });
    await newHarness.dispatch('install');
    await newHarness.dispatch('message', {
      data: { type: 'CF_PWA_ACTIVATE', buildId: newHarness.buildId },
    });
    expect(newHarness.replies.at(-1)).toMatchObject({
      type: 'CF_PWA_ACTIVATE_RESULT', ok: true, buildId: newHarness.buildId,
    });
    await newHarness.dispatch('activate');
    expect(newHarness.self.claimCount).toBe(0);

    const oldAsset = await oldHarness.dispatch('fetch', {
      clientId: 'client-old',
      request: { method: 'GET', url: 'https://game.test/assets/main-old.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(await oldAsset.text()).toBe('main-old');
    const forbiddenMix = await oldHarness.dispatch('fetch', {
      clientId: 'client-old',
      request: { method: 'GET', url: 'https://game.test/assets/main-new.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(forbiddenMix.status).toBe(503);

    const navigation = await oldHarness.dispatch('fetch', {
      clientId: 'client-old',
      resultingClientId: 'client-new',
      request: { method: 'GET', url: 'https://game.test/explore', mode: 'navigate', destination: 'document' },
    }) as Response;
    expect(await navigation.text()).toBe('index-new');
    expect(await readClientPin(caches, 'client-old')).toBe(oldHarness.buildId);
    expect(await readClientPin(caches, 'client-new')).toBe(newHarness.buildId);

    const newAsset = await newHarness.dispatch('fetch', {
      clientId: 'client-new',
      request: { method: 'GET', url: 'https://game.test/assets/main-new.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(await newAsset.text()).toBe('main-new');
    const reverseMix = await newHarness.dispatch('fetch', {
      clientId: 'client-new',
      request: { method: 'GET', url: 'https://game.test/assets/main-old.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(reverseMix.status).toBe(503);
    expect(newHarness.fetches).toHaveLength(Object.keys(newRows).length);
  });

  it('refuses a third-build activation while a live document still owns the retained prior', async () => {
    const caches = new MemoryCacheStorage();
    const priorId = await seedCompleteBuild(
      caches,
      { '/index.html': 'index-prior', '/assets/main-prior.js': 'main-prior' },
      '1'.repeat(64),
    );
    const activeId = await seedCompleteBuild(
      caches,
      { '/index.html': 'index-active', '/assets/main-active.js': 'main-active' },
      '2'.repeat(64),
    );
    await seedControlState(caches, activeId, priorId);
    await seedClientPin(caches, 'client-prior', priorId);

    const candidateRows = { '/index.html': 'index-candidate', '/assets/main-candidate.js': 'main-candidate' };
    const candidate = createWorkerHarness(assetsFor(candidateRows), candidateRows, {
      caches,
      workerRevision: '3'.repeat(64),
      clientIds: ['client-prior'],
    });
    await candidate.dispatch('install');
    await candidate.dispatch('message', {
      data: { type: 'CF_PWA_ACTIVATE', buildId: candidate.buildId },
    });
    expect(candidate.replies.at(-1)).toMatchObject({
      type: 'CF_PWA_ACTIVATE_RESULT', ok: false, buildId: candidate.buildId,
      reason: 'prior-build-in-use',
    });
    expect(candidate.self.skipWaitingCount).toBe(0);
    expect(await readControlState(caches)).toMatchObject({
      activeBuildId: activeId,
      priorBuildId: priorId,
    });
    expect(caches.rows.has(`cf-v2-build-${activeId}`)).toBe(true);
    expect(caches.rows.has(`cf-v2-build-${priorId}`)).toBe(true);
  });

  it('gives worker-logic-only updates a distinct cache without endangering the selected build', async () => {
    const caches = new MemoryCacheStorage();
    const rows = { '/index.html': 'same-index', '/assets/main.js': 'same-main' };
    const oldHarness = createWorkerHarness(assetsFor(rows), rows, {
      caches,
      workerRevision: '1'.repeat(64),
      clientIds: ['client-current'],
    });
    await oldHarness.dispatch('install');
    await oldHarness.dispatch('activate');

    const failed = createWorkerHarness(assetsFor(rows), { ...rows, '/assets/main.js': 'tampered' }, {
      caches,
      workerRevision: '2'.repeat(64),
      clientIds: ['client-current'],
    });
    expect(failed.buildId).not.toBe(oldHarness.buildId);
    await expect(failed.dispatch('install')).rejects.toThrow(/digest mismatch/u);
    expect(caches.rows.has(`cf-v2-build-${oldHarness.buildId}`)).toBe(true);
    expect(await readControlState(caches)).toMatchObject({
      activeBuildId: oldHarness.buildId,
      priorBuildId: null,
    });

    const next = createWorkerHarness(assetsFor(rows), rows, {
      caches,
      workerRevision: '2'.repeat(64),
      clientIds: ['client-current'],
    });
    await next.dispatch('install');
    expect(await readControlState(caches)).toMatchObject({ activeBuildId: oldHarness.buildId });
    expect(caches.rows.has(`cf-v2-build-${oldHarness.buildId}`)).toBe(true);
    await next.dispatch('message', { data: { type: 'CF_PWA_ACTIVATE', buildId: next.buildId } });
    await next.dispatch('activate');
    expect(await readControlState(caches)).toMatchObject({
      activeBuildId: next.buildId,
      priorBuildId: oldHarness.buildId,
    });
    expect(new Set(await caches.keys())).toEqual(new Set([
      'cf-v2-pwa-control-v1',
      `cf-v2-build-${next.buildId}`,
      `cf-v2-build-${oldHarness.buildId}`,
    ]));
  });

  it('serves only the selected complete cache and never falls through to a network mix', async () => {
    const rows = { '/index.html': 'index-v1', '/assets/main-v1.js': 'main-v1' };
    const harness = createWorkerHarness(assetsFor(rows), rows);
    await harness.dispatch('install');
    await harness.dispatch('activate');
    const installFetchCount = harness.fetches.length;

    const navigation = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://game.test/explore/earth', mode: 'navigate', destination: 'document' },
    }) as Response;
    expect(await navigation.text()).toBe('index-v1');
    const asset = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://game.test/assets/main-v1.js?ignored=1', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(await asset.text()).toBe('main-v1');
    const missing = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://game.test/assets/foreign.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(missing.status).toBe(503);
    const external = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://cdn.example/foreign.js', mode: 'cors', destination: 'script' },
    }) as Response;
    expect(external.status).toBe(403);
    expect(harness.fetches).toHaveLength(installFetchCount);
  });

  it('requires an exact user activation message and can select the retained prior build for rollback', async () => {
    const newestRows = { '/index.html': 'index-new', '/assets/main-new.js': 'main-new' };
    const harness = createWorkerHarness(assetsFor(newestRows), newestRows);
    const priorId = await seedCompleteBuild(harness.caches, { '/index.html': 'index-prior', '/assets/main-prior.js': 'main-prior' });
    await seedControlState(harness.caches, priorId, null);
    await harness.dispatch('install');

    await harness.dispatch('message', { data: { type: 'CF_PWA_ACTIVATE', buildId: '0'.repeat(64) } });
    expect(harness.self.skipWaitingCount).toBe(0);
    await harness.dispatch('message', { data: { type: 'CF_PWA_ACTIVATE', buildId: harness.buildId } });
    expect(harness.self.skipWaitingCount).toBe(1);
    await harness.dispatch('activate');

    await harness.dispatch('message', { data: { type: 'CF_PWA_ROLLBACK' } });
    expect(harness.replies.at(-1)).toMatchObject({
      type: 'CF_PWA_ROLLBACK_RESULT', ok: true, activeBuildId: priorId, priorBuildId: harness.buildId,
    });
    const navigation = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://game.test/', mode: 'navigate', destination: 'document' },
    }) as Response;
    expect(await navigation.text()).toBe('index-prior');
    expect(new Set(await harness.caches.keys())).toEqual(new Set([
      'cf-v2-pwa-control-v1',
      `cf-v2-build-${harness.buildId}`,
      `cf-v2-build-${priorId}`,
    ]));

    await harness.dispatch('message', { data: { type: 'CF_PWA_ROLLBACK' } });
    expect(harness.replies.at(-1)).toMatchObject({
      type: 'CF_PWA_ROLLBACK_RESULT', ok: true,
      activeBuildId: harness.buildId, priorBuildId: priorId,
    });
    const restored = await harness.dispatch('fetch', {
      request: { method: 'GET', url: 'https://game.test/', mode: 'navigate', destination: 'document' },
    }) as Response;
    expect(await restored.text()).toBe('index-new');
  });
});

type Listener = (event: Event) => void;

class FakeEventOwner {
  readonly listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const callback = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener);
    const rows = this.listeners.get(type) ?? new Set<Listener>();
    rows.add(callback as Listener);
    this.listeners.set(type, rows);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener === 'function') this.listeners.get(type)?.delete(listener as Listener);
  }
  dispatch(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

class FakeWorker extends FakeEventOwner {
  state: ServiceWorkerState = 'activated';
  readonly messages: unknown[] = [];
  postMessage(message: unknown): void { this.messages.push(message); }
}

class FakeRegistration extends FakeEventOwner {
  active = new FakeWorker();
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  updates = 0;
  async update(): Promise<ServiceWorkerRegistration> {
    this.updates++;
    return this as unknown as ServiceWorkerRegistration;
  }
}

class FakeContainer extends FakeEventOwner {
  readonly registration = new FakeRegistration();
  controller: FakeWorker | null = this.registration.active;
  registrations: Array<readonly [string | URL, RegistrationOptions | undefined]> = [];
  async register(scriptURL: string | URL, options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
    this.registrations.push([scriptURL, options]);
    return this.registration as unknown as ServiceWorkerRegistration;
  }
}

describe('accessible PWA update control', () => {
  it('announces waiting/rollback state and never reloads except from the explicit button', async () => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'https://game.test/' });
    const container = new FakeContainer();
    const navigator = { serviceWorker: container } as unknown as Navigator;
    let reloads = 0;
    const control = mountPwaUpdateControl({
      document: dom.window.document,
      navigator,
      reload: () => { reloads++; },
      enabled: true,
      workerUrl: 'https://game.test/service-worker.js',
      scope: 'https://game.test/',
    });
    await control.ready;
    expect(container.registrations).toEqual([[
      'https://game.test/service-worker.js',
      { scope: 'https://game.test/', type: 'classic', updateViaCache: 'none' },
    ]]);
    const message = control.element.querySelector('[data-pwa-message]')!;
    expect(message.getAttribute('aria-live')).toBe('polite');
    expect(control.element.getAttribute('aria-label')).toBe('App offline and update status');

    const firstInstalling = new FakeWorker();
    container.registration.installing = firstInstalling;
    container.registration.dispatch('updatefound', {} as Event);
    expect(firstInstalling.listeners.get('statechange')?.size).toBe(1);
    const replacementInstalling = new FakeWorker();
    container.registration.installing = replacementInstalling;
    container.registration.dispatch('updatefound', {} as Event);
    expect(firstInstalling.listeners.get('statechange')?.size ?? 0).toBe(0);
    expect(replacementInstalling.listeners.get('statechange')?.size).toBe(1);

    const waiting = new FakeWorker();
    container.registration.waiting = waiting;
    const nextId = 'a'.repeat(64);
    container.dispatch('message', { source: new FakeWorker(), data: {
      type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: nextId,
      activeBuildId: 'b'.repeat(64), priorBuildId: null, phase: 'waiting',
    } } as unknown as MessageEvent);
    const activate = control.element.querySelector<HTMLButtonElement>('[data-pwa-action="activate"]')!;
    expect(activate.hidden).toBe(true);
    container.dispatch('message', { source: waiting, data: {
      type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: nextId,
      activeBuildId: 'b'.repeat(64), priorBuildId: null, phase: 'waiting',
    } } as unknown as MessageEvent);
    expect(activate.hidden).toBe(false);
    expect(message.textContent).toMatch(/will not reload automatically/u);
    activate.click();
    expect(waiting.messages.at(-1)).toEqual({
      type: 'CF_PWA_ACTIVATE', schema: CF_PWA_CLIENT_SCHEMA, buildId: nextId,
    });
    expect(reloads).toBe(0);

    container.dispatch('message', { source: waiting, data: {
      type: 'CF_PWA_ACTIVATE_RESULT', schema: CF_PWA_CLIENT_SCHEMA,
      ok: true, buildId: nextId,
    } } as unknown as MessageEvent);
    const reload = control.element.querySelector<HTMLButtonElement>('[data-pwa-action="reload"]')!;
    expect(reload.hidden).toBe(true);
    container.dispatch('controllerchange', {} as Event);
    expect(reload.hidden).toBe(true);
    container.dispatch('message', { source: container.registration.active, data: {
      type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: nextId,
      activeBuildId: nextId, priorBuildId: 'b'.repeat(64), phase: 'active',
    } } as unknown as MessageEvent);
    expect(reload.hidden).toBe(true);
    container.registration.active = waiting;
    container.registration.waiting = null;
    container.dispatch('message', { source: waiting, data: {
      type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: nextId,
      activeBuildId: nextId, priorBuildId: 'b'.repeat(64), phase: 'active',
    } } as unknown as MessageEvent);
    expect(reload.hidden).toBe(false);
    expect(reloads).toBe(0);
    reload.click();
    expect(reloads).toBe(1);

    container.dispatch('message', { source: container.registration.active, data: {
      type: 'CF_PWA_ROLLBACK_RESULT', schema: CF_PWA_CLIENT_SCHEMA, ok: true,
      activeBuildId: 'c'.repeat(64), priorBuildId: 'a'.repeat(64),
    } } as unknown as MessageEvent);
    expect(message.textContent).toMatch(/prior complete build is selected/u);
    expect(reloads).toBe(1);
    control.dispose();
    expect(replacementInstalling.listeners.get('statechange')?.size ?? 0).toBe(0);
    expect(dom.window.document.querySelector('[data-cf-pwa-update]')).toBeNull();
  });

  it('restores the exact activation control when a retained-prior window blocks activation', async () => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'https://game.test/' });
    const container = new FakeContainer();
    const control = mountPwaUpdateControl({
      document: dom.window.document,
      navigator: { serviceWorker: container } as unknown as Navigator,
      reload: () => { throw new Error('must not reload'); },
      enabled: true,
      workerUrl: 'https://game.test/service-worker.js',
      scope: 'https://game.test/',
    });
    await control.ready;
    const waiting = new FakeWorker();
    container.registration.waiting = waiting;
    const buildId = 'd'.repeat(64);
    container.dispatch('message', { source: waiting, data: {
      type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: buildId,
      activeBuildId: 'e'.repeat(64), priorBuildId: 'f'.repeat(64), phase: 'waiting',
    } } as unknown as MessageEvent);
    const activate = control.element.querySelector<HTMLButtonElement>('[data-pwa-action="activate"]')!;
    activate.click();
    expect(activate.disabled).toBe(true);
    container.dispatch('message', { source: waiting, data: {
      type: 'CF_PWA_ACTIVATE_RESULT', schema: CF_PWA_CLIENT_SCHEMA,
      ok: false, buildId, reason: 'prior-build-in-use',
    } } as unknown as MessageEvent);
    expect(activate.hidden).toBe(false);
    expect(activate.disabled).toBe(false);
    expect(control.element.querySelector('[data-pwa-message]')?.textContent).toMatch(/another open Celestial Frontier window/u);
    control.dispose();
  });

  it('removes itself outside an emitted production PWA build', async () => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
    const container = new FakeContainer();
    const control = mountPwaUpdateControl({
      document: dom.window.document,
      navigator: { serviceWorker: container } as unknown as Navigator,
      reload: () => { throw new Error('must not reload'); },
    });
    await control.ready;
    expect(control.element.isConnected).toBe(false);
    expect(container.registrations).toHaveLength(0);
  });
});

describe('PWA reload durability boundary', () => {
  function coordinator(options: Readonly<{
    conflict?: string | null;
    claim?: symbol | null;
    active?: Promise<boolean> | null;
    checkpointRequired?: boolean;
    checkpoint?: () => Promise<boolean>;
  }> = Object.freeze({})) {
    const calls: string[] = [];
    const claim = options.claim === undefined ? Symbol('claim') : options.claim;
    return {
      calls,
      owner: {
        conflict: () => { calls.push('conflict'); return options.conflict ?? null; },
        claim: () => { calls.push('claim'); return claim; },
        activePersist: () => { calls.push('active-persist'); return options.active ?? null; },
        checkpointRequired: () => {
          calls.push('checkpoint-required');
          return options.checkpointRequired ?? false;
        },
        checkpoint: async () => {
          calls.push('checkpoint');
          return options.checkpoint ? options.checkpoint() : true;
        },
        release: () => { calls.push('release-rearm'); },
        schedule: () => { calls.push('schedule'); },
      },
    };
  }

  it('refuses product/import/training/convergence conflicts before claiming replacement ownership', async () => {
    for (const conflict of ['product-action', 'import-write', 'training', 'authority-convergence']) {
      const run = coordinator({ conflict });
      await expect(coordinatePwaReload(run.owner)).resolves.toEqual({
        kind: 'refused', stage: 'preflight', detail: conflict,
      });
      expect(run.calls).toEqual(['conflict']);
    }
  });

  it('joins an active persistence write before checkpointing a canceled settings debounce', async () => {
    let settleActive!: (value: boolean) => void;
    const active = new Promise<boolean>((resolve) => { settleActive = resolve; });
    const run = coordinator({ active, checkpointRequired: true });
    const outcome = coordinatePwaReload(run.owner);
    await Promise.resolve();
    expect(run.calls).toEqual(['conflict', 'claim', 'active-persist']);
    settleActive(true);
    await expect(outcome).resolves.toEqual({ kind: 'scheduled' });
    expect(run.calls).toEqual([
      'conflict', 'claim', 'active-persist', 'checkpoint-required', 'checkpoint', 'schedule',
    ]);
  });

  it('releases and rearms without teardown when an active save or checkpoint is not durable', async () => {
    const activeFailure = coordinator({ active: Promise.resolve(false), checkpointRequired: true });
    await expect(coordinatePwaReload(activeFailure.owner)).resolves.toEqual({
      kind: 'refused', stage: 'active-persist', detail: 'save-not-durable',
    });
    expect(activeFailure.calls).toEqual(['conflict', 'claim', 'active-persist', 'release-rearm']);

    const checkpointFailure = coordinator({
      active: Promise.resolve(true), checkpointRequired: true,
      checkpoint: async () => false,
    });
    await expect(coordinatePwaReload(checkpointFailure.owner)).resolves.toEqual({
      kind: 'refused', stage: 'checkpoint', detail: 'save-not-durable',
    });
    expect(checkpointFailure.calls).toEqual([
      'conflict', 'claim', 'active-persist', 'checkpoint-required', 'checkpoint', 'release-rearm',
    ]);
  });
});

function ordered(source: string, needles: readonly string[]): boolean {
  let cursor = 0;
  for (const needle of needles) {
    const next = source.indexOf(needle, cursor);
    if (next < 0) return false;
    cursor = next + needle.length;
  }
  return true;
}

describe('PWA production wiring', () => {
  it('wires only emitted builds into Settings and crosses the owned replacement boundary on reload', () => {
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    const config = readFileSync(new URL('../apps/game/vite.config.ts', import.meta.url), 'utf8');
    expect(config).toContain("import { celestialFrontierPwaPlugin } from './pwa-build.js';");
    expect(config).toContain('plugins: [celestialFrontierPwaPlugin()]');
    expect(main).toContain("type ReplacementReloadReason = 'training-restart' | 'training-complete' | 'training-recovery' | 'save-import' | 'storage-retry' | 'pwa-update';");
    expect(main).toContain('if (pwaUpdateControl) el.append(pwaUpdateControl.element);');
    expect(ordered(main, [
      'app.start();',
      'emitBootPhase(\'ticker-started\');',
      'if (document.querySelector(\'meta[name="cf-pwa-enabled"][content="true"]\')) {',
      'pwaUpdateControl = mountPwaUpdateControl({',
      "mount: document.getElementById('setpanel')!,",
      "placement: 'settings',",
      'void reloadForPwaUpdate();',
      'void pwaUpdateControl.ready;',
    ])).toBe(true);
    expect(ordered(main, [
      'function pwaReloadConflict(): string | null {',
      "if (productActionInFlight) return 'product-action';",
      "if (importWriteInFlight) return 'import-write';",
      "if (trainingCheckpointWriteHeld || trainingActive() || trainingRecoveryLock !== null) return 'training';",
      "if (f4AuthorityReloadScheduled || replacementReloadPending || ecologyEpochBlocksActions()) {",
      "return 'authority-convergence';",
      "if (!f4RuntimeMayMutate()) return 'save-authority';",
      'async function reloadForPwaUpdate(): Promise<void> {',
      'const outcome = await coordinatePwaReload<ReplacementTransaction>({',
      'conflict: pwaReloadConflict,',
      "claim: () => claimReplacementTransaction('pwa-update'),",
      'activePersist: () => activePersist,',
      'checkpointRequired: (claim) => claim.persistWasScheduled,',
      'checkpoint: (claim) => persistView(claim),',
      'release: (claim) => { releaseReplacementTransaction(claim); },',
      'schedule: (claim) => { scheduleReplacementReload(claim); },',
    ])).toBe(true);
    const mountStart = main.indexOf("if (document.querySelector('meta[name=\"cf-pwa-enabled\"][content=\"true\"]')) {");
    const mountEnd = main.indexOf('/* Runtime.addBinding installs this optional readiness seam', mountStart);
    const mount = main.slice(mountStart, mountEnd);
    expect(mount).not.toContain('location.reload');
    expect(ordered(main, [
      'pwaUpdateControl?.dispose();',
      'pwaUpdateControl = null;',
      'clearPlanetside();',
      'speciesArtLoader.dispose(',
      'app.destroy(',
    ])).toBe(true);

    const bypassed = mount.replace('void reloadForPwaUpdate();', 'location.reload();');
    expect(bypassed).toContain('location.reload();');
    expect(bypassed).not.toContain('void reloadForPwaUpdate();');
  });
});
