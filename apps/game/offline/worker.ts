/* The service worker itself: it hands the browser's events to `worker-source.ts` and decides nothing. The build
   step writes the table of this build's files above this program. */
import { createShellWorker, type BuildTable, type ClientLike } from './worker-source';

declare const CF_SHELL_BUILD: BuildTable;

interface Waitable { waitUntil(work: Promise<unknown>): void }
interface FetchLike extends Waitable {
  request: Request;
  clientId: string;
  resultingClientId: string;
  respondWith(response: Promise<Response>): void;
}
interface WorkerScope {
  caches: CacheStorage;
  clients: { matchAll(options: object): Promise<ReadonlyArray<ClientLike>>; get(id: string): Promise<ClientLike | undefined>; claim(): Promise<void> };
  location: { origin: string };
  registration: { scope: string };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install' | 'activate', listener: (event: Waitable) => void): void;
  addEventListener(type: 'message', listener: (event: Waitable & { data: unknown; source: ClientLike | null }) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchLike) => void): void;
}
const scope = self as unknown as WorkerScope;

const worker = createShellWorker(CF_SHELL_BUILD, {
  caches: scope.caches,
  clients: scope.clients,
  fetchFresh: (url) => fetch(new Request(url, { cache: 'reload', credentials: 'same-origin', redirect: 'error' })),
  digest: (bytes) => crypto.subtle.digest('SHA-256', bytes),
  origin: scope.location.origin,
  scope: scope.registration.scope,
  skipWaiting: () => scope.skipWaiting(),
});

scope.addEventListener('install', (event) => { event.waitUntil(worker.install()); });
scope.addEventListener('activate', (event) => { event.waitUntil(worker.activate()); });
scope.addEventListener('message', (event) => { event.waitUntil(worker.message(event.data, event.source)); });
scope.addEventListener('fetch', (event) => {
  const { request } = event;
  const facts = {
    url: request.url,
    method: request.method,
    navigation: request.mode === 'navigate' || request.destination === 'document',
    clientId: event.clientId,
    resultingClientId: event.resultingClientId,
  };
  if (worker.owns(facts)) event.respondWith(worker.respond(facts));
});
