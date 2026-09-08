// Local read-only server for the immutable, already verified preview package.
// Usage: node serve-preview.mjs /absolute/dev-preview-package /absolute/receipt.json
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

const root = fs.realpathSync(process.argv[2]);
const receiptPath = path.resolve(process.argv[3]);
const manifestBytes = fs.readFileSync(path.join(root, 'preview.json'));
const manifest = JSON.parse(manifestBytes);
if (manifest.publishable !== false || manifest.source.state !== 'dirty-local-only') {
  throw new Error('This checkpoint server is limited to the recorded local-only package');
}
const files = new Map();
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
for (const file of manifest.files) {
  const resolved = path.resolve(root, file.path);
  if (!resolved.startsWith(`${root}${path.sep}`) || fs.realpathSync(resolved) !== resolved) throw new Error('invalid package path');
  const bytes = fs.readFileSync(resolved);
  if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`package hash mismatch: ${file.path}`);
  files.set(file.path, bytes);
}
files.set('preview.json', manifestBytes);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.txt': 'text/plain' };
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let relative;
  try { relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html'; }
  catch { response.writeHead(400); response.end(); return; }
  const bytes = files.get(relative);
  if (!bytes) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(relative)] || 'application/octet-stream',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-length': bytes.length });
  response.end(request.method === 'HEAD' ? undefined : bytes);
});
server.listen(0, '127.0.0.1', () => {
  const receipt = { createdAt: new Date().toISOString(), pid: process.pid, root,
    url: `http://127.0.0.1:${server.address().port}/?paintedvista=1`, sourceCommit: manifest.source.commit,
    sourceState: manifest.source.state, publishable: manifest.publishable,
    contentSha256: manifest.contentSha256, manifestSha256: hash(manifestBytes) };
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(receipt));
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
