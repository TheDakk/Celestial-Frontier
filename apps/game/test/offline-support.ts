import { webcrypto } from 'node:crypto';
import { buildTable, sha256Hex } from '../offline/plugin';
import {
  createShellWorker, type BuildTable, type CacheLike, type CachesLike, type ClientLike, type RequestFacts,
  type ShellWorker, type WorkerPorts,
} from '../offline/worker-source';

export const ORIGIN = 'https://game.test';
export const BASE = '/cf/';
export const at = (path: string): string => `${ORIGIN}${BASE}${path}`;

/** Cache Storage held in memory: every stored answer is given back as a fresh copy. */
export function fakeCaches(): CachesLike & { stores: Map<string, Map<string, Response>> } {
  const stores = new Map<string, Map<string, Response>>();
  const open = (name: string): CacheLike => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = (): Map<string, Response> => stores.get(name) ?? new Map();
    return {
      match: async (url) => store().get(url)?.clone(),
      put: async (url, response) => { store().set(url, response); },
      delete: async (url) => store().delete(url),
      keys: async () => [...store().keys()].map((url) => ({ url })),
    };
  };
  return { stores, open: async (name) => open(name), delete: async (name) => stores.delete(name), keys: async () => [...stores.keys()] };
}

export interface Page extends ClientLike { messages: unknown[] }
export const page = (id: string): Page => {
  const messages: unknown[] = [];
  return { id, messages, postMessage: (message) => { messages.push(message); } };
};

/** One origin: its caches, its open pages, and the files its server holds now. */
export interface World {
  caches: ReturnType<typeof fakeCaches>;
  pages: Page[];
  /** What the server answers for each address; absent means the network fails. */
  server: Map<string, string>;
  fetched: string[];
  skipped: string[];
  claimed: number;
}
export function world(): World {
  return { caches: fakeCaches(), pages: [], server: new Map(), fetched: [], skipped: [], claimed: 0 };
}

export function ports(w: World, name: string): WorkerPorts {
  return {
    caches: w.caches,
    clients: {
      matchAll: async () => [...w.pages],
      get: async (id) => w.pages.find((client) => client.id === id),
      claim: async () => { w.claimed += 1; },
    },
    fetchFresh: async (url) => {
      w.fetched.push(url);
      const body = w.server.get(url);
      if (body === undefined) throw new TypeError('network failure');
      return new Response(body);
    },
    digest: (bytes) => webcrypto.subtle.digest('SHA-256', bytes),
    origin: ORIGIN,
    scope: `${ORIGIN}${BASE}`,
    skipWaiting: async () => { w.skipped.push(name); },
  };
}

/** A build of the shell: its table, as the build step makes it, and its files put on the server. */
export function build(files: Readonly<Record<string, string>>, revision = 'a'.repeat(64)): BuildTable {
  return buildTable(BASE, Object.entries(files).map(([name, text]) => ({ name, bytes: new TextEncoder().encode(text) })), revision);
}
export function serve(w: World, files: Readonly<Record<string, string>>): void {
  for (const [name, text] of Object.entries(files)) w.server.set(at(name), text);
}
export function worker(w: World, table: BuildTable, name = table.buildId.slice(0, 6)): ShellWorker {
  return createShellWorker(table, ports(w, name));
}

export const get = (path: string, clientId: string): RequestFacts =>
  ({ url: at(path), method: 'GET', navigation: false, clientId, resultingClientId: '' });
export const navigate = (path: string, resultingClientId: string): RequestFacts =>
  ({ url: at(path), method: 'GET', navigation: true, clientId: '', resultingClientId });
export const text = async (response: Promise<Response>): Promise<string> => {
  const answer = await response;
  return `${answer.status}:${await answer.text()}`;
};
export { sha256Hex };
