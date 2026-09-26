/** Test fixtures for G3's on-demand art library: where a served arena/card file lives on disk (the CORE pack under
 * `public/battle2/…`, or the on-demand LIBRARY under `public/library/…`), and a fetch that serves the site from disk. */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
/** The repository root (computed here, not imported from parts-rig.fixtures, so root-program tests never pull pixi's types in). */
const REPO_ROOT = new URL('../../../../../', import.meta.url);

export const SERVED_CORE = new URL('port/v2/apps/game/public/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/', REPO_ROOT);
export const SERVED_LIBRARY = new URL('port/v2/apps/game/public/library/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/', REPO_ROOT);
export const PUBLIC_ROOT = new URL('port/v2/apps/game/public/', REPO_ROOT);
/** An arena asset path (relative to the recipe directory) → the file that serves it: the core pack copy, else the library copy. */
export const servedArt = (rel: string): URL => { const core = new URL(rel, SERVED_CORE); return existsSync(core) ? core : new URL(rel, SERVED_LIBRARY); };
/** A fetch over the site's public/ directory (`http://localhost/<path>` → public/<path>), for the library module under test. */
export const publicFetch = (tamper?: (path: string, bytes: Uint8Array) => Uint8Array | null): typeof fetch => (async (input: RequestInfo | URL) => {
  const url = new URL(String(input instanceof Request ? input.url : input)), file = new URL('.' + url.pathname, PUBLIC_ROOT);
  if (!existsSync(file)) return new Response('not found', { status: 404 });
  let bytes = new Uint8Array(readFileSync(fileURLToPath(file)));
  if (tamper) { const t = tamper(url.pathname, bytes); if (t === null) return new Response("offline", { status: 503 }); bytes = new Uint8Array(t); }
  return new Response(bytes as unknown as BodyInit, { status: 200 });
}) as typeof fetch;
