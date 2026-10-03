/** Native films of Codex's C239-C250 selected candidate fits (Claude 2026-10-02). Script by subject: birds -> goose, water-only -> the aquatic perch
 * script, everything else -> cougar; observed supports; CF_CPU_THROTTLE=4; one browser at a time. Usage (repo root, out of sandbox):
 * node audits/FILMS_C250_20261003/run.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = process.cwd(), B = 'audits/FILMS_C250_20261003', out = {};
for (const s of JSON.parse(fs.readFileSync(path.join(B, 'subjects.json'), 'utf8'))) {
  const aquatic = s.family === 'fish' || (s.media.includes('water') && !s.media.includes('ground'));
  const base = JSON.parse(fs.readFileSync(aquatic ? 'audits/G1_AUTO_AUTHOR_20260926/native-g2fam-fish/07-perch-script.json' : path.join('audits/ART_BATTLE_FOCUS_20260925', s.family === 'biped-bird' ? '15-goose' : '05-cougar', 'battle-script.json'), 'utf8'));
  for (const r of base.rows) { if ('an' in r) r.an = s.name; if ('dn' in r) r.dn = s.name; } base.supports = 'observed';
  const script = path.join(ROOT, B, `${s.id}-script.json`); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  const f = path.join(ROOT, s.fit), dir = path.join(ROOT, B, s.id);
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', f, f, dir, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.writeFileSync(path.join(ROOT, B, `${s.id}.log`), (r.stdout || '') + (r.stderr || ''));
  try { out[s.id] = JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')).status; } catch { out[s.id] = 'NO_REPORT'; } }
fs.writeFileSync(path.join(B, 'native.json'), JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out));
