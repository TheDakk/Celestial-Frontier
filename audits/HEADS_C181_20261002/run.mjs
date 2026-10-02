/** Native films of Codex's C181 head-contour repaired fits (Claude 2026-10-02): the family battle script as score-batch.mjs uses
 * (goose for birds, cougar for quadrupeds; observed supports; CF_CPU_THROTTLE=4), one browser at a time.
 * Usage (repo root, out of the sandbox): node audits/HEADS_C181_20261002/run.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/HEADS_C181_20261002', R = 'audits/C163_REFERENCE_REPAIR_20261002', out = {};
const SUBJECTS = [['lark', 'Lark', `${R}/16-lark/fit02`, 'bird'], ['hawk', 'Hawk', `${R}/18-hawk/fit02`, 'bird'], ['crow', 'Crow', `${R}/other-heads/crow/fit01`, 'bird'],
  ['snowy-owl', 'Snowy Owl', `${R}/other-heads/snowy-owl/fit01`, 'bird'], ['hummingbird', 'Hummingbird', `${R}/retained-heads/hummingbird/fit01`, 'bird'], ['wild-pony', 'Wild Pony', `${R}/retained-heads/wild-pony/fit01`, 'quad']];
fs.writeFileSync(path.join(B, '.gitignore'), '*.webm\n*/*.png\n!*/turn1-hit-reaction-50.png\n!*/turn3-hit-idle-90.png\n');
for (const [id, name, fit, fam] of SUBJECTS) {
  const base = JSON.parse(fs.readFileSync(path.join('audits/ART_BATTLE_FOCUS_20260925', fam === 'bird' ? '15-goose' : '05-cougar', 'battle-script.json'), 'utf8'));
  for (const r of base.rows) { if ('an' in r) r.an = name; if ('dn' in r) r.dn = name; } base.supports = 'observed';
  const script = path.join(ROOT, B, `${id}-script.json`); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  const f = path.join(ROOT, fit), dir = path.join(ROOT, B, id);
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', f, f, dir, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.writeFileSync(path.join(ROOT, B, `${id}.log`), (r.stdout || '') + (r.stderr || ''));
  try { out[id] = { fit, status: JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')).status }; } catch { out[id] = { fit, status: 'NO_REPORT' }; } }
fs.writeFileSync(path.join(B, 'native.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
