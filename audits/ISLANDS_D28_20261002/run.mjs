/** D28 (Dakk 2026-10-02, cap raised to accommodate every case): re-run the unchanged remainder-islands placement on every creature that
 * was held only by the old 5% cap, then the static gate and native with the subject's own scoring script (Claude). One browser at a time.
 * Usage (repo root, out of the sandbox): node audits/ISLANDS_D28_20261002/run.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/ISLANDS_D28_20261002', G = 'audits/G1_AUTO_AUTHOR_20260926', out = {};
const SUBJECTS = [['g2c107', '23-wild-pony'], ['g2c107', '24-wild-ass'], ['g2c114', '13-horse'], ['g2c121', '05-chough'], ['g2c121', '09-hawk'], ['g2c121', '14-snowy-owl'], ['g2c151', '18-hawk'], ['g2c233', '14-wolf'], ['g2c233', '16-serval']];
const run = (args, opts = {}) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26, ...opts });
for (const [tag, id] of SUBJECTS) { const key = `${tag}-${id}`, dir = path.join(B, key), row = out[key] = {};
  const r = JSON.parse(fs.readFileSync(path.join(G, `auto-${tag}`, id, 'score.json'), 'utf8')), win = r.fallbackFrom ? (r.candidates ?? []).find((c) => c.static === 'PASS_STATIC') : null;
  const A = win && win.rank > 0 ? path.join(G, `auto-${tag}`, id, `fallback-${win.rank}`) : path.join(G, `auto-${tag}`, id);
  const src = ['merge-joint', 'tail-labels'].map((d) => path.join(A, d, 'fit')).find((f) => fs.existsSync(path.join(f, 'binding.json'))) ?? path.join(A, 'fit'); row.source = src;
  const i = run([path.join(G, 'remainder-islands-fit.mjs'), id, src, dir]); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'islands.log'), (i.stdout || '') + (i.stderr || ''));
  if (i.status) { row.islands = 'REFUSED'; continue; } row.islands = 'PLACED';
  const s = run([path.join(G, 'harness/static-runner.mjs'), path.join(dir, 'fit'), path.join(dir, 'static.json')]); fs.writeFileSync(path.join(dir, 'static.log'), (s.stdout || '') + (s.stderr || ''));
  try { row.static = JSON.parse(fs.readFileSync(path.join(dir, 'static.json'), 'utf8')).status; } catch { row.static = 'NO_REPORT'; } if (s.status) continue;
  const script = path.join(ROOT, dir, 'script.json'); fs.copyFileSync(path.join(G, `native-${tag}`, `${id}-script.json`), script);
  const n = run(['tools/battle2-proof/native-runner.mjs', path.join(ROOT, dir, 'fit'), path.join(ROOT, dir, 'fit'), path.join(ROOT, dir, 'native'), script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' } });
  fs.writeFileSync(path.join(dir, 'native.log'), (n.stdout || '') + (n.stderr || ''));
  try { row.native = JSON.parse(fs.readFileSync(path.join(dir, 'native', 'report.json'), 'utf8')).status; } catch { row.native = 'NO_REPORT'; } }
fs.writeFileSync(path.join(B, 'result.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
