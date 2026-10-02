/** Native films of the AI-finished rigs with the SAME battle script each painter rig passed with (one browser at a time).
 * Usage (repo root, out of the sandbox): node audits/AI_FINISH_C121_20261001/native.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), A = 'audits/AI_FINISH_C121_20261001', out = {};
fs.writeFileSync(path.join(A, '.gitignore'), '*.webm\nnative-01/*/*.png\n!native-01/*/turn1-hit-reaction-50.png\n!native-01/*/turn3-hit-idle-90.png\nrebound-*/*/parts/\nfinish-01/prepared/\n');
for (const { id } of JSON.parse(fs.readFileSync(path.join(A, 'subjects.json'), 'utf8'))) {
  const fit = path.join(ROOT, A, 'rebound-01', id), dir = path.join(ROOT, A, 'native-01', id), script = path.join(ROOT, 'audits/G1_AUTO_AUTHOR_20260926/native-g2c121', `${id}-script.json`);
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', fit, fit, dir, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, '..', `${id}.log`), (r.stdout || '') + (r.stderr || ''));
  try { out[id] = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')).status; } catch { out[id] = 'NO_REPORT'; } }
fs.writeFileSync(path.join(A, 'native-01.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
