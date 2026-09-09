/* Serve one previously built, hash-verified local study. No build, hosted publish,
 * diagnostic execution, personal browser profile, service worker or game state. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const base = path.dirname(fileURLToPath(import.meta.url));
assert.equal(process.argv.length, 4, 'Usage: node serve-study.mjs STUDY_OUTPUT_NAME PORT');
assert(/^[a-z0-9][a-z0-9-]*$/.test(process.argv[2])); const port = Number(process.argv[3]); assert(Number.isInteger(port) && port >= 1024 && port <= 65535);
const output = fs.realpathSync(path.join(base, process.argv[2])), dist = fs.realpathSync(path.join(output, 'dist'));
const report = JSON.parse(fs.readFileSync(path.join(output, 'report.json'), 'utf8')); assert.equal(report.status, 'PASS'); assert.equal(report.certification, false);
const inventory = new Map(report.dist.inventory.map(row => [row.path, row]));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [name, row] of inventory) { const bytes = fs.readFileSync(path.join(dist, name)); assert.equal(bytes.length, row.bytes); assert.equal(sha(bytes), row.sha256); }
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((request, response) => {
  try {
    assert(['GET', 'HEAD'].includes(request.method)); const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = fs.realpathSync(path.resolve(dist, '.' + (pathname === '/' ? '/study.html' : pathname))); assert(file.startsWith(dist + path.sep));
    const name = path.relative(dist, file), row = inventory.get(name); assert(row); const bytes = fs.readFileSync(file); assert.equal(sha(bytes), row.sha256);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404); response.end(); }
});
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ schema: 'cf-local-civet-water-motion-server/v1', url: `http://127.0.0.1:${port}/`, pid: process.pid, output, certification: false, filesVerified: inventory.size })));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
