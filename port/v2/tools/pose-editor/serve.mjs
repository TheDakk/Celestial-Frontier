#!/usr/bin/env node
/* Pose editor dev server: bundles entry.mjs with rolldown (the battle2-proof pattern; the game's `.js`
 * specifiers resolve to `.ts` sources, `@cf/*` through the workspace) into a fresh temp directory, then
 * serves the page, the bundle and two read-only audit assets on 127.0.0.1 only. Nothing is written into
 * the repo. Usage: node tools/pose-editor/serve.mjs [--port=N] [--record=<landmarks.json>] [--master=<png>]
 * Defaults: the Civet record (audits/CIVET_2D_PROOF_20260912) and master (audits/ART_KIT_ENGINE_FIRST_20260912). */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import { fileURLToPath } from 'node:url'; import { rolldown } from 'rolldown';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
export const DEFAULT_ASSETS = Object.freeze({
  record: path.join(repo, 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'),
  master: path.join(repo, 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png'),
});
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

export async function buildPoseEditor(outDir) {
  const bundle = await rolldown({ input: path.join(here, 'entry.mjs'), platform: 'browser' });
  try { await bundle.write({ dir: outDir, format: 'es', entryFileNames: 'bundle.js', chunkFileNames: 'chunk-[hash].js' }); } finally { await bundle.close(); }
  fs.copyFileSync(path.join(here, 'index.html'), path.join(outDir, 'index.html'));
}
/** Builds, then listens on 127.0.0.1. Returns { origin, close }. Asset paths must exist and are served read-only. */
export async function startPoseEditorServer({ port = 0, record = DEFAULT_ASSETS.record, master = DEFAULT_ASSETS.master } = {}) {
  for (const [k, p] of Object.entries({ record, master })) if (!fs.existsSync(p)) throw new Error(`pose editor: ${k} asset missing: ${p}`);
  const build = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-pose-editor-'));
  await buildPoseEditor(build);
  const routes = new Map([['/assets/record.json', record], ['/assets/master.png', master]]);
  for (const name of fs.readdirSync(build)) routes.set('/' + name, path.join(build, name));
  routes.set('/', path.join(build, 'index.html'));
  const server = http.createServer((req, res) => {
    const file = routes.get(new URL(req.url, 'http://127.0.0.1').pathname);
    if (!file || req.method !== 'GET') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const close = async () => { await new Promise((r) => server.close(r)); fs.rmSync(build, { recursive: true, force: true }); };
  return { origin, build, close, assets: { record, master } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = (k, d) => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) ?? d;
  const s = await startPoseEditorServer({ port: Number(flag('port', 0)), record: path.resolve(flag('record', DEFAULT_ASSETS.record)), master: path.resolve(flag('master', DEFAULT_ASSETS.master)) });
  console.log(`pose editor: ${s.origin}/  (record ${path.relative(repo, s.assets.record)}, master ${path.relative(repo, s.assets.master)}; Ctrl-C to stop)`);
  const stop = () => s.close().then(() => process.exit(0));
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
