/** C274/C275 remainder islands (Claude 2026-10-04): the unchanged remainder-islands-fit.mjs (D28 cap 0.5), the static gate, then native
 * with the SAME battle script the batch film used, one browser at a time. Pattern: audits/ISLANDS_C256_20261003/run.mjs.
 * Subjects from the full-size review (audits/REVIEW_C274_C275_20261004/review.json): Sparrow (floating far-wing shard), Capybara (ear
 * stays with the neck when the head moves). Usage (repo root, out of the sandbox): node audits/ISLANDS_C274_20261004/run.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/ISLANDS_C274_20261004', G = 'audits/G1_AUTO_AUTHOR_20260926', out = {};
const IDS = [['g2c274', '18-sparrow'], ['g2c275', '02-capybara']];
fs.writeFileSync(path.join(B, '.gitignore'), '*.webm\n*/native/*.png\n!*/native/turn1-hit-reaction-50.png\n!*/native/turn3-hit-idle-50.png\n!*/native/turn3-hit-idle-90.png\n*/fit/\n');
const run = (args, opts = {}) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26, ...opts });
for (const [tag, id] of IDS) { const A = path.join(G, `auto-${tag}`, id), dir = path.join(B, id), row = out[id] = { tag };
  /* the fit native-<tag> used (same selection as score-batch.mjs; neither subject won through a fallback candidate) */
  const src = ['merge-joint', 'tail-labels'].map((d) => path.join(A, d, 'fit')).find((f) => fs.existsSync(path.join(f, 'binding.json'))) ?? path.join(A, 'fit'); row.source = src;
  if (!fs.existsSync(path.join(dir, 'receipt.json'))) { const r = run([path.join(G, 'remainder-islands-fit.mjs'), id, src, dir]); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'islands.log'), (r.stdout || '') + (r.stderr || '')); if (r.status) { row.islands = 'REFUSED'; continue; } }
  row.islands = 'PLACED'; const fit = path.join(dir, 'fit');
  const s = run([path.join(G, 'harness/static-runner.mjs'), fit, path.join(dir, 'static.json')]); fs.writeFileSync(path.join(dir, 'static.log'), (s.stdout || '') + (s.stderr || ''));
  let st = 'NO_REPORT'; try { const j = JSON.parse(fs.readFileSync(path.join(dir, 'static.json'), 'utf8')); st = j.status ?? j.verdict ?? 'SEE_REPORT'; } catch {} row.static = st; if (s.status) continue;
  const script = path.join(ROOT, dir, 'script.json'); fs.copyFileSync(path.join(G, `native-${tag}`, `${id}-script.json`), script);
  const n = run(['tools/battle2-proof/native-runner.mjs', path.join(ROOT, fit), path.join(ROOT, fit), path.join(ROOT, dir, 'native'), script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' } });
  fs.writeFileSync(path.join(dir, 'native.log'), (n.stdout || '') + (n.stderr || ''));
  try { row.native = JSON.parse(fs.readFileSync(path.join(dir, 'native', 'report.json'), 'utf8')).status; } catch { row.native = 'NO_REPORT'; } }
fs.writeFileSync(path.join(B, 'result.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
