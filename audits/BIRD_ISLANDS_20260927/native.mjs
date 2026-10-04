/** Native on the island-repaired bird fits (goose battle script, observed supports, CF_CPU_THROTTLE=4), one browser at a time.
 * Usage (repo root, out of the sandbox): node audits/BIRD_ISLANDS_20260927/native.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/BIRD_ISLANDS_20260927', NAMES = { '20-seabird': 'Seabird', '20-snow-petrel': 'Snow Petrel' }, out = {};
fs.writeFileSync(path.join(B, '.gitignore'), '*.webm\n*/native/*.png\n!*/native/turn1-hit-reaction-50.png\n!*/native/turn3-hit-idle-90.png\n');
for (const [id, name] of Object.entries(NAMES)) {
  const base = JSON.parse(fs.readFileSync('audits/ART_BATTLE_FOCUS_20260925/15-goose/battle-script.json', 'utf8'));
  for (const r of base.rows) { if ('an' in r) r.an = name; if ('dn' in r) r.dn = name; } base.supports = 'observed';
  const script = path.join(ROOT, B, id, 'script.json'); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  const fit = path.join(ROOT, B, id, 'fit'), dir = path.join(ROOT, B, id, 'native');
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', fit, fit, dir, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.writeFileSync(path.join(ROOT, B, id, 'native.log'), (r.stdout || '') + (r.stderr || ''));
  let status = 'NO_REPORT'; try { status = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')).status; } catch {} out[id] = status; }
fs.writeFileSync(path.join(B, 'native.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
