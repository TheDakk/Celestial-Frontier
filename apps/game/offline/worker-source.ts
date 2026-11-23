/* The offline shell's worker, as functions over what a service worker is given. `worker.ts` hands it the
   browser; the tests hand it a Cache Storage held in memory.

   Each build of the shell has its own cache, named by the build's identity: the hash of every file's address
   and SHA-256, and of the worker's own program. A cache counts only when its marker, written last, and every
   file in it still match. One control row names the active build and the one before it. Every open page is
   pinned to the build it started with and is answered from that build alone, so a new build never changes
   the files under a running page; the page takes the active build when it next loads. Nothing is ever
   answered from the network in the shell's name. Art packs are not the shell's: their requests pass by, and
   the cache their loader keeps is never touched. */

export const SHELL_SCHEMA = 'cf-v2-pixel-shell/v1' as const;
/** A build's cache is this and its identity. The pack cache, `cf-v2-pixel-packs`, does not begin with it. */
export const BUILD_CACHE_PREFIX = 'cf-v2-pixel-build-';
export const CONTROL_CACHE = 'cf-v2-pixel-shell-control';
/** Under the app's base: served by the network to the pack loader, which checks every byte itself. */
export const PACKS_FOLDER = 'art-packs/';
const STATE_PATH = '__cf_shell_control__/state';
const CLIENT_PIN_PREFIX = '__cf_shell_control__/client/';
const COMPLETE_PREFIX = '__cf_shell_complete__/';
const HEX64 = /^[a-f0-9]{64}$/;

export interface ShellFile { readonly path: string; readonly sha256: string }
export interface BuildTable {
  readonly buildId: string;
  /** The SHA-256 of the worker's program without its table: a change to the worker alone is a new build. */
  readonly workerRevision: string;
  /** The app's base path, with both slashes. */
  readonly basePath: string;
  readonly files: readonly ShellFile[];
}

/** The text a build's identity is the SHA-256 of. */
export function buildIdentityText(files: readonly ShellFile[], workerRevision: string): string {
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return `${SHELL_SCHEMA}\nworker\t${workerRevision}\n${sorted.map((file) => `${file.path}\t${file.sha256}\n`).join('')}`;
}

export interface CacheLike {
  match(url: string): Promise<Response | undefined>;
  put(url: string, response: Response): Promise<void>;
  delete(url: string): Promise<boolean>;
  keys(): Promise<ReadonlyArray<{ readonly url: string }>>;
}
export interface CachesLike {
  open(name: string): Promise<CacheLike>;
  delete(name: string): Promise<boolean>;
  keys(): Promise<string[]>;
}
export interface ClientLike { readonly id: string; postMessage(message: unknown): void }
export interface WorkerPorts {
  caches: CachesLike;
  clients: {
    matchAll(options: { type: 'all' | 'window'; includeUncontrolled: boolean }): Promise<ReadonlyArray<ClientLike>>;
    get(id: string): Promise<ClientLike | undefined>;
    claim(): Promise<void>;
  };
  /** One file from the server, past every cache of the browser. It fails on a redirect. */
  fetchFresh(url: string): Promise<Response>;
  /** SHA-256. */
  digest(bytes: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
  origin: string;
  /** The worker's scope: the app's base as a whole address. */
  scope: string;
  skipWaiting(): Promise<void>;
}
/** What a fetch event says. */
export interface RequestFacts {
  url: string;
  method: string;
  /** The request loads a page. */
  navigation: boolean;
  clientId: string;
  resultingClientId: string;
}
export interface ShellWorker {
  /** Fetches and checks every file into this build's own cache. It throws, and leaves no cache, unless all match. */
  install(): Promise<void>;
  /** Makes this build the active one and keeps the one before it. It throws rather than strand an open page. */
  activate(): Promise<void>;
  message(data: unknown, source: { postMessage(message: unknown): void } | null): Promise<void>;
  /** False for a request the worker leaves to the network: an art pack. Decided at once, as the browser needs. */
  owns(request: RequestFacts): boolean;
  respond(request: RequestFacts): Promise<Response>;
}

interface ControlState { schema: typeof SHELL_SCHEMA; activeBuildId: string; priorBuildId: string | null }
interface Marker extends BuildTable { schema: typeof SHELL_SCHEMA }

const refuse = (status: number, reason: string): Response => new Response(reason, { status });
const json = (value: unknown): Response => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
const cacheName = (buildId: string): string => BUILD_CACHE_PREFIX + buildId;
const validClientId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f]/.test(value);

export function createShellWorker(build: BuildTable, ports: WorkerPorts): ShellWorker {
  const { caches, clients } = ports;
  const indexPath = `${build.basePath}index.html`;
  const absolute = (path: string): string => new URL(path, ports.origin).href;
  const inScope = (path: string): string => new URL(path, ports.scope).href;
  const markerUrl = (buildId: string): string => inScope(COMPLETE_PREFIX + buildId);
  const pinUrl = (clientId: string): string => inScope(CLIENT_PIN_PREFIX + encodeURIComponent(clientId));
  const sha256 = async (bytes: ArrayBuffer | string): Promise<string> => {
    const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
    return [...new Uint8Array(await ports.digest(data))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const validFile = (file: unknown): file is ShellFile => {
    const row = file as Partial<ShellFile> | null;
    return !!row && typeof row.path === 'string' && row.path.startsWith(build.basePath) && !/[\t\n]/.test(row.path)
      && typeof row.sha256 === 'string' && HEX64.test(row.sha256);
  };
  /** The marker of a build's cache, when it is whole and names what its identity says. */
  const readMarker = async (cache: CacheLike, buildId: string): Promise<Marker | null> => {
    const response = await cache.match(markerUrl(buildId));
    if (!response) return null;
    let marker: Partial<Marker> | null;
    try { marker = await response.json() as Partial<Marker> | null; } catch { return null; }
    if (!marker || marker.schema !== SHELL_SCHEMA || marker.buildId !== buildId || typeof marker.workerRevision !== 'string'
      || !HEX64.test(marker.workerRevision) || marker.basePath !== build.basePath || !Array.isArray(marker.files)) return null;
    const paths = new Set<string>();
    for (const file of marker.files) {
      if (!validFile(file) || paths.has(file.path)) return null;
      paths.add(file.path);
    }
    if (!paths.has(indexPath)) return null;
    if (await sha256(buildIdentityText(marker.files, marker.workerRevision)) !== buildId) return null;
    return marker as Marker;
  };
  /** True when the build's cache holds its marker and every file, each still matching its hash. */
  const complete = async (buildId: string): Promise<boolean> => {
    if (!HEX64.test(buildId)) return false;
    const cache = await caches.open(cacheName(buildId));
    const marker = await readMarker(cache, buildId);
    if (!marker) return false;
    for (const file of marker.files) {
      const response = await cache.match(absolute(file.path));
      if (!response || !response.ok || await sha256(await response.arrayBuffer()) !== file.sha256) return false;
    }
    return true;
  };

  const validState = (value: Partial<ControlState> | null): value is ControlState => !!value && value.schema === SHELL_SCHEMA
    && typeof value.activeBuildId === 'string' && HEX64.test(value.activeBuildId)
    && (value.priorBuildId === null || (typeof value.priorBuildId === 'string' && HEX64.test(value.priorBuildId) && value.priorBuildId !== value.activeBuildId));
  const readState = async (): Promise<ControlState | null> => {
    const response = await (await caches.open(CONTROL_CACHE)).match(inScope(STATE_PATH));
    if (!response) return null;
    try {
      const value = await response.json() as Partial<ControlState> | null;
      return validState(value) ? value : null;
    } catch { return null; }
  };
  const writeState = async (activeBuildId: string, priorBuildId: string | null): Promise<ControlState> => {
    const value: ControlState = { schema: SHELL_SCHEMA, activeBuildId, priorBuildId };
    if (!validState(value)) throw new Error('Refusing an invalid shell control state');
    await (await caches.open(CONTROL_CACHE)).put(inScope(STATE_PATH), json(value));
    return value;
  };
  const readPin = async (clientId: string): Promise<string | null> => {
    if (!validClientId(clientId)) return null;
    const response = await (await caches.open(CONTROL_CACHE)).match(pinUrl(clientId));
    if (!response) return null;
    try {
      const value = await response.json() as { schema?: unknown; clientId?: unknown; buildId?: unknown } | null;
      return value && value.schema === SHELL_SCHEMA && value.clientId === clientId && typeof value.buildId === 'string' && HEX64.test(value.buildId) ? value.buildId : null;
    } catch { return null; }
  };
  const writePin = async (clientId: string, buildId: string): Promise<void> => {
    await (await caches.open(CONTROL_CACHE)).put(pinUrl(clientId), json({ schema: SHELL_SCHEMA, clientId, buildId }));
  };
  /** Pins a page while answering it. A pin that cannot be written is gone without: the page is still answered. */
  const pinIfPossible = async (clientId: string, buildId: string): Promise<void> => {
    if (!validClientId(clientId)) return;
    try { await writePin(clientId, buildId); } catch { /* answered unpinned */ }
  };

  /** Pins every open page that has no pin to the active build, and forgets the pins of pages that are gone.
   *  False when an open page runs a build that would not be kept: neither the active nor the prior one, or,
   *  when `activeOnly`, any build but the active one. */
  const keepLiveClientBuilds = async (state: ControlState, activeOnly: boolean): Promise<boolean> => {
    const cache = await caches.open(CONTROL_CACHE);
    const live = new Set<string>();
    let safe = true;
    const retain = async (client: ClientLike): Promise<void> => {
      if (!validClientId(client.id)) { safe = false; return; }
      live.add(client.id);
      const pinned = await readPin(client.id);
      const buildId = pinned ?? state.activeBuildId;
      if (pinned === null) await writePin(client.id, buildId);
      if ((buildId !== state.activeBuildId && buildId !== state.priorBuildId) || (activeOnly && buildId !== state.activeBuildId)) safe = false;
    };
    for (const client of await clients.matchAll({ type: 'all', includeUncontrolled: true })) await retain(client);
    const prefix = new URL(CLIENT_PIN_PREFIX, ports.scope).pathname;
    for (const request of await cache.keys()) {
      const url = new URL(request.url);
      if (url.origin !== ports.origin || !url.pathname.startsWith(prefix)) continue;
      let clientId = '';
      try { clientId = decodeURIComponent(url.pathname.slice(prefix.length)); } catch { clientId = ''; }
      if (!validClientId(clientId)) { await cache.delete(request.url); continue; }
      if (live.has(clientId)) continue;
      const client = await clients.get(clientId);
      if (client) await retain(client); else await cache.delete(request.url);
    }
    return safe;
  };
  /** Removes every build cache but those named. Only names with the build prefix are ever removed. */
  const pruneBuildCaches = async (keep: ReadonlySet<string>): Promise<void> => {
    for (const name of await caches.keys()) if (name.startsWith(BUILD_CACHE_PREFIX) && !keep.has(name)) await caches.delete(name);
  };
  const broadcast = async (message: unknown): Promise<void> => {
    for (const client of await clients.matchAll({ type: 'window', includeUncontrolled: true })) client.postMessage(message);
  };
  const status = (state: ControlState | null, phase: 'active' | 'waiting'): unknown => ({
    type: 'CF_PWA_STATUS', schema: SHELL_SCHEMA, workerBuildId: build.buildId,
    activeBuildId: state?.activeBuildId ?? null, priorBuildId: state?.priorBuildId ?? null, phase,
  });

  return {
    async install() {
      // The pins of pages that have closed are forgotten here too, not only when a build is made active.
      try {
        const state = await readState();
        if (state) await keepLiveClientBuilds(state, false);
      } catch { /* housekeeping: the install does not depend on it */ }
      // The browser may install the same worker again: a build already held whole is not fetched twice.
      if (await complete(build.buildId)) return;
      const name = cacheName(build.buildId);
      await caches.delete(name);
      const cache = await caches.open(name);
      try {
        for (const file of build.files) {
          const url = absolute(file.path);
          const response = await ports.fetchFresh(url);
          if (!response.ok || response.redirected) throw new Error(`Shell file was not answered: ${file.path}`);
          if (await sha256(await response.clone().arrayBuffer()) !== file.sha256) throw new Error(`Shell file does not match its hash: ${file.path}`);
          await cache.put(url, response);
        }
        // Written last: a cache with a marker holds every file.
        const marker: Marker = { schema: SHELL_SCHEMA, ...build };
        await cache.put(markerUrl(build.buildId), json(marker));
      } catch (error) {
        await caches.delete(name);
        throw error;
      }
    },

    async activate() {
      if (!await complete(build.buildId)) throw new Error('Refusing to activate an incomplete shell build');
      const previous = await readState();
      if (previous && !await keepLiveClientBuilds(previous, true)) throw new Error('Refusing to remove a build still owned by an open page');
      const prior = previous && previous.activeBuildId !== build.buildId && await complete(previous.activeBuildId) ? previous.activeBuildId : null;
      const state = await writeState(build.buildId, prior);
      await pruneBuildCaches(new Set([cacheName(build.buildId), ...(prior ? [cacheName(prior)] : [])]));
      if (!previous) {
        // The first install: the page that brought the worker is taken at once, and pinned on both sides of it.
        if (!await keepLiveClientBuilds(state, false)) throw new Error('Refusing invalid first-install page ownership');
        await clients.claim();
        if (!await keepLiveClientBuilds(state, false)) throw new Error('Refusing invalid page ownership after the claim');
      }
      await broadcast(status(state, 'active'));
    },

    async message(data, source) {
      const message = data as { type?: unknown; target?: unknown; buildId?: unknown } | null;
      if (!message || typeof message.type !== 'string') return;
      if (message.type === 'CF_PWA_GET_STATUS') {
        source?.postMessage(status(await readState(), message.target === 'waiting' ? 'waiting' : 'active'));
        return;
      }
      if (message.type === 'CF_PWA_ACTIVATE' && message.buildId === build.buildId) {
        const state = await readState();
        const result = { type: 'CF_PWA_ACTIVATE_RESULT', schema: SHELL_SCHEMA, buildId: build.buildId };
        if (state && !await keepLiveClientBuilds(state, true)) {
          source?.postMessage({ ...result, ok: false, reason: 'prior-build-in-use' });
          return;
        }
        source?.postMessage({ ...result, ok: true });
        await ports.skipWaiting();
        return;
      }
      if (message.type === 'CF_PWA_ROLLBACK') {
        const state = await readState();
        const refused = (reason: string): void => { source?.postMessage({ type: 'CF_PWA_ROLLBACK_RESULT', schema: SHELL_SCHEMA, ok: false, reason }); };
        if (!state || !state.priorBuildId || !await complete(state.activeBuildId) || !await complete(state.priorBuildId)) { refused('no-complete-prior-build'); return; }
        if (!await keepLiveClientBuilds(state, false)) { refused('client-build-ownership-invalid'); return; }
        const next = await writeState(state.priorBuildId, state.activeBuildId);
        await pruneBuildCaches(new Set([cacheName(next.activeBuildId), cacheName(state.activeBuildId)]));
        const result = { type: 'CF_PWA_ROLLBACK_RESULT', schema: SHELL_SCHEMA, ok: true, activeBuildId: next.activeBuildId, priorBuildId: next.priorBuildId };
        source?.postMessage(result);
        await broadcast(result);
      }
    },

    owns(request) {
      const url = new URL(request.url);
      return !(request.method === 'GET' && url.origin === ports.origin && url.pathname.startsWith(build.basePath + PACKS_FOLDER));
    },

    async respond(request) {
      const url = new URL(request.url);
      if (request.method !== 'GET') return refuse(405, 'Celestial Frontier is local-first; this build has no network write route.');
      if (url.origin !== ports.origin) return refuse(403, 'External resources are not part of this Celestial Frontier build.');
      const state = await readState();
      if (!state) return refuse(503, 'No complete Celestial Frontier build is active.');
      // A page being loaded takes the active build; everything else is answered from the build its page is pinned
      // to. A page with no pin (the browser named none when it loaded, or the pin could not be written) is
      // pinned to the active build now.
      const pinned = request.navigation ? null : await readPin(request.clientId);
      if (pinned !== null && pinned !== state.activeBuildId && pinned !== state.priorBuildId) return refuse(503, 'This page no longer owns a retained Celestial Frontier build.');
      const selected = pinned ?? state.activeBuildId;
      const cache = await caches.open(cacheName(selected));
      const marker = await readMarker(cache, selected);
      if (!marker) return refuse(503, 'The selected Celestial Frontier build is incomplete.');
      const listed = (path: string): boolean => marker.files.some((file) => file.path === path);
      const path = request.navigation && !(listed(url.pathname) && url.pathname.endsWith('.html')) ? indexPath : url.pathname;
      if (!listed(path)) return refuse(503, 'Resource is not part of the selected Celestial Frontier build.');
      const response = await cache.match(absolute(path));
      if (!response) return refuse(503, 'A required Celestial Frontier build resource is missing.');
      if (request.navigation) await pinIfPossible(validClientId(request.resultingClientId) ? request.resultingClientId : request.clientId, selected);
      else if (pinned === null) await pinIfPossible(request.clientId, selected);
      return response;
    },
  };
}
