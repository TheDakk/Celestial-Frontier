/** Re-run the gallery's legged creatures (quadrupeds, birds, insects) through native with `supports: 'observed'` (Codex C79: native must
 * test the same painted contact supports as static and the game; the earlier gallery natives used rest supports). Fish and snakes have
 * no ground-contact chains, so the supports mode cannot change their proof and they are not re-run. Each entry's fit is RESOLVED from
 * the run script (`run.sh`) or score record that produced its native dir; an entry whose fit cannot be resolved is listed, not guessed.
 * Usage (repo root, out of the sandbox): node audits/GENERATED_GALLERY_20260927/observed-rerun.mjs [--dry] */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(import.meta.dirname, '../..'), HERE = import.meta.dirname, G = 'audits/G1_AUTO_AUTHOR_20260926', dry = process.argv.includes('--dry');
const reg = JSON.parse(fs.readFileSync(path.join(HERE, 'gallery-registry.json'), 'utf8'));
/* fit per native out-dir, from every run.sh line: "... native-runner.mjs <fitL> <fitR> <outDir> <script>" (with $R/$A/$N variables) */
const fitByOut = new Map();
for (const rs of fs.readdirSync(path.join(ROOT, G)).filter((d) => d.startsWith('native-')).map((d) => path.join(ROOT, G, d, 'run.sh')).filter((f) => fs.existsSync(f))) {
  const txt = fs.readFileSync(rs, 'utf8'), vars = {};
  for (const m of txt.matchAll(/^(?:[A-Z]=\S+;?\s*)+/gm)) for (const kv of m[0].matchAll(/([A-Z])=([^;\s]+)/g)) vars[kv[1]] = kv[2];
  const sub = (s) => s.replace(/\$R\//g, '').replace(/\$([A-Z])/g, (_, k) => (vars[k] ?? '').replace(/^\$R\//, ''));
  for (const line of txt.split('\n')) { const m = line.match(/native-runner\.mjs\s+(\S+)\s+\S+\s+(\S+)\s+\S+/); if (!m) continue;
    let fit = m[1]; if (fit === '$F') { const f = line.match(/F=(\S+?)(?:;|\s)/); fit = f ? f[1] : null; } if (!fit) continue;
    fitByOut.set(path.normalize(sub(m[2])), path.normalize(sub(fit))); } }
/* score-batch dirs: native-<tag>/<id> ← auto-<tag>/<id> (winning candidate; merge-joint / tail-labels fit when built) */
const AUTO_OF = { 'g2-quad': 'g2-v10', 'g2c54': 'g2c54-v10' };
const scoreBatchFit = (nativeDir) => { const m = nativeDir.match(/native-([^/]+)\/([^/]+)$/); if (!m) return null; const A = path.join(G, `auto-${AUTO_OF[m[1]] ?? m[1]}`, m[2]), sf = path.join(ROOT, A, 'score.json'); if (!fs.existsSync(sf)) return null;
  const s = JSON.parse(fs.readFileSync(sf, 'utf8')), win = s.fallbackFrom ? (s.candidates ?? []).find((c) => c.static === 'PASS_STATIC') : null, base = win && win.rank > 0 ? path.join(A, `fallback-${win.rank}`) : A;
  return ['merge-joint', 'tail-labels'].map((d) => path.join(base, d, 'fit')).find((f) => fs.existsSync(path.join(ROOT, f, 'binding.json'))) ?? path.join(base, 'fit'); };
const special = { [`${G}/native-g2bird-poolv2/fam-02-heron`]: `${G}/auto-g2bird-faint-c77-withbirds/fam-02-heron/fit`, [`${G}/native-perf-recheck/15-donkey`]: `${G}/auto-g2-v10/15-donkey/fallback-1/fit`, [`${G}/native-perf-recheck/q20-06-lynx`]: `${G}/auto-g2quad-handrefs/q20-06-lynx/fit` };
const codexSide = (d) => { const m = d.match(/C59_REPAIR_20260926\/(.+)-side-native$/); return m ? `audits/C59_REPAIR_20260926/${m[1]}-side/fit` : null; };
const legged = reg.filter((e) => ['quadruped', 'biped-bird', 'insect'].includes(e.family) && !/BIRD_NATIVE_INPUT_C79/.test(e.nativeDir));
const plan = legged.map((e) => { const fit = special[e.nativeDir] ?? codexSide(e.nativeDir) ?? fitByOut.get(path.normalize(e.nativeDir)) ?? scoreBatchFit(e.nativeDir);
  return { ...e, fit, ok: !!fit && fs.existsSync(path.join(ROOT, fit, 'binding.json')) }; });
const OUT = path.join(G, 'native-observed-rerun');
if (dry) { for (const p of plan) console.log(p.ok ? 'OK ' : 'MISSING', p.name.padEnd(32), p.fit); console.log(plan.filter((p) => p.ok).length, 'of', plan.length, 'resolvable'); process.exit(0); }
fs.mkdirSync(path.join(ROOT, OUT), { recursive: true }); fs.writeFileSync(path.join(ROOT, OUT, '.gitignore'), '*.webm\n*/*.png\n!*/turn1-hit-reaction-50.png\n');
const results = [];
for (const p of plan) { if (!p.ok) { results.push({ name: p.name, nativeDir: p.nativeDir, status: 'UNRESOLVED_FIT' }); continue; }
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), base = JSON.parse(fs.readFileSync(path.join(ROOT, 'audits/ART_BATTLE_FOCUS_20260925', p.family === 'biped-bird' ? '15-goose' : '05-cougar', 'battle-script.json'), 'utf8'));
  const species = p.name.replace(/\s*\(.*\)$/, ''); for (const r of base.rows) { if ('an' in r) r.an = species; if ('dn' in r) r.dn = species; } base.supports = 'observed';
  const script = path.join(ROOT, OUT, `${slug}-script.json`); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  const fit = path.join(ROOT, p.fit), out = path.join(ROOT, OUT, slug);
  const r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', fit, fit, out, script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, encoding: 'utf8', timeout: 1800e3, maxBuffer: 1 << 26 });
  fs.writeFileSync(path.join(ROOT, OUT, `${slug}.log`), (r.stdout || '') + (r.stderr || '')); let status = 'NO_REPORT', frames = null, refusals = null;
  try { const rep = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8')); status = rep.status; const fs2 = rep.capture?.frameSamples ?? []; frames = fs2.length; refusals = Math.max(0, ...fs2.map((f) => f.refusals)); } catch {}
  results.push({ name: p.name, family: p.family, fit: p.fit, previousNativeDir: p.nativeDir, observedNativeDir: path.relative(ROOT, out), status, frames, refusals }); console.log(p.name, status, frames, refusals); }
fs.writeFileSync(path.join(ROOT, OUT, 'results.json'), JSON.stringify({ schema: 'cf.observed-rerun/v1', supports: 'observed', results }, null, 1) + '\n');
