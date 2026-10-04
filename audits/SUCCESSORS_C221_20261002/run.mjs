/** Native films of Codex's C221 bird contour successors + C222 Flounder join correction (Claude 2026-10-02): the family script as
 * score-batch.mjs uses (goose for birds, the aquatic perch script for fish; observed supports; CF_CPU_THROTTLE=4). */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/SUCCESSORS_C221_20261002', I = 'audits/C183_ISLAND_AUTHORING_20261002', out = {};
const S = [['grouse', 'Grouse', `${I}/10-grouse/fit01`, 'bird'], ['hornbill', 'Hornbill', `${I}/20-hornbill/fit01`, 'bird'], ['parrot', 'Parrot', `${I}/21-parrot/fit01`, 'bird'],
  ['weaverbird', 'Weaverbird', `${I}/24-weaverbird/fit01`, 'bird'], ['flounder', 'Flounder', 'audits/C183_REMAINING_HOLDS_20261002/flounder/fit01', 'fish']];
for (const [id, name, fit, fam] of S) {
  const base = JSON.parse(fs.readFileSync(fam === 'fish' ? 'audits/G1_AUTO_AUTHOR_20260926/native-g2fam-fish/07-perch-script.json' : 'audits/ART_BATTLE_FOCUS_20260925/15-goose/battle-script.json', 'utf8'));
  for (const r of base.rows) { if ('an' in r) r.an = name; if ('dn' in r) r.dn = name; } base.supports = 'observed';
  const script = path.join(ROOT, B, `${id}-script.json`); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  const f = path.join(ROOT, fit), dir = path.join(ROOT, B, id);
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', f, f, dir, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.writeFileSync(path.join(ROOT, B, `${id}.log`), (r.stdout || '') + (r.stderr || ''));
  try { out[id] = { fit, status: JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')).status }; } catch { out[id] = { fit, status: 'NO_REPORT' }; } }
fs.writeFileSync(path.join(B, 'native.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
