/** One command per G2 batch (Claude 2026-09-27): pattern gate → G1 author (standard flags) → intake/static → native on every pass →
 * review sheet + full-size crops → gallery registry. Replaces the dozen hand steps of sessions 4–5 (and their zsh traps).
 * Usage (repo root; native needs the real browser, so run OUT of the sandbox):
 *   node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir-with-pilot.json> <tag> [--no-native] [--fish-seams]
 *   optional (2026-10-02): --extra-refs=<pool json> replaces the default reference pool; --reviewed-presence=<json> is passed to run-auto
 *   optional (2026-10-04): --pilot=<json> scores that pilot list instead of <batchDir>/pilot.json (framing successors, re-score subsets)
 * Writes: pilots/<tag>-eligible.json, auto-<tag>/ (runner), native-<tag>/ (scripts, films, stills, sheets, summary.json), and appends
 * every native PASS to gallery-registry.json (entries are data; the gallery notes start as "unreviewed" until Claude looks). */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const [batchArg, tag, ...flags] = process.argv.slice(2); if (!batchArg || !tag) throw Error('usage: score-batch.mjs <batchDir> <tag> [--no-native] [--fish-seams]');
const ROOT = path.resolve(import.meta.dirname, '../..'), HERE = import.meta.dirname, rel = (p) => path.relative(ROOT, p);
const batch = path.resolve(ROOT, batchArg), pilot = JSON.parse(fs.readFileSync(flags.find((f) => f.startsWith('--pilot='))?.slice(8) ?? path.join(batch, 'pilot.json'), 'utf8')) /* --pilot=<json> (2026-10-04): score a selected subset, e.g. Codex's pilot-selected.json */;
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, ...opts }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
/* 1. pattern gate: only PASS / NOT_REQUIRED paintings are scored (Codex's pattern-observation contract) */
const eligible = [], skipped = [];
for (const p of pilot) { let st = 'MISSING'; for (const n of ['pattern-check.json', 'pattern-review.json']) { const f = path.join(ROOT, p.packet, n); if (fs.existsSync(f)) { st = JSON.parse(fs.readFileSync(f, 'utf8')).status ?? st; break; } }
  (st === 'PASS' || st === 'NOT_REQUIRED' ? eligible : skipped).push(st === 'PASS' || st === 'NOT_REQUIRED' ? p : { id: p.id, pattern: st }); }
const pilotOut = path.join(HERE, 'pilots', `${tag}-eligible.json`); fs.writeFileSync(pilotOut, JSON.stringify(eligible, null, 1) + '\n');
/* 2. author + intake + static (standard flags; the serpent strip and shared-joint merge apply only where they belong) */
const auth = run(process.execPath, [path.join(HERE, 'run-auto.mjs'), `--tag=${tag}`, '--topk=1', '--chains', '--counter', '--fallback=2', '--serpent-strips', '--merge-joint-labels', (flags.find((f) => f.startsWith('--extra-refs=')) ?? '--extra-refs=audits/G1_AUTO_AUTHOR_20260926/pilots/reference-pool-extras.json'), ...flags.filter((f) => f.startsWith('--reviewed-presence=')), `--targets=${rel(pilotOut)}`], { timeout: 6 * 3600e3 });
const rows = eligible.map((p) => { const f = path.join(HERE, `auto-${tag}`, p.id, 'score.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { id: p.id, verdict: 'NO_SCORE' }; });
/* 3. native on every ADMIT + PASS_STATIC, sequentially (one browser at a time) */
const N = path.join(HERE, `native-${tag}`); fs.mkdirSync(N, { recursive: true });
fs.writeFileSync(path.join(N, '.gitignore'), '*.webm\n*/*.png\n!*/turn1-hit-reaction-50.png\n!*/turn0-hit-approach-50.png\n');
const nameOf = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p.packet, 'subject-source.json'), 'utf8')).name;
const passes = rows.filter((r) => r.verdict === 'ADMIT' && r.static === 'PASS_STATIC'), natives = [];
if (!flags.includes('--no-native')) for (const r of passes) { const p = eligible.find((e) => e.id === r.id), name = nameOf(p);
  /* fish need an aquatic WORLD block (key lake, liquid water, surfaceWater), not just lake themes: the native-g2fam-fish script carries it.
   * So does any water-only subject of another family (the eels are serpents: C107's eels failed the land arena's habitat check). */
  const media = JSON.parse(fs.readFileSync(path.join(ROOT, p.packet, 'subject-source.json'), 'utf8')).profile?.media ?? [], aquatic = r.family === 'fish' || (media.includes('water') && !media.includes('ground'));
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, aquatic ? 'audits/G1_AUTO_AUTHOR_20260926/native-g2fam-fish/07-perch-script.json' : path.join('audits/ART_BATTLE_FOCUS_20260925', r.family === 'biped-bird' ? '15-goose' : '05-cougar', 'battle-script.json')), 'utf8'));
  for (const row of base.rows) { if ('an' in row) row.an = name; if ('dn' in row) row.dn = name; }
  /* native must test the same painted contact supports as static and the game (Codex C79: without this, native used rest supports) */
  base.supports = 'observed';
  const script = path.join(N, `${r.id}-script.json`); fs.writeFileSync(script, JSON.stringify(base, null, 1) + '\n');
  /* the passing packet may be a labelled fallback candidate: native must use THAT candidate's fit (bug found on the hand-ref Beetle) */
  const win = r.fallbackFrom ? (r.candidates ?? []).find((c) => c.static === 'PASS_STATIC') : null;
  const A = win && win.rank > 0 ? path.join(HERE, `auto-${tag}`, r.id, `fallback-${win.rank}`) : path.join(HERE, `auto-${tag}`, r.id), fit = ['merge-joint', 'tail-labels'].map((d) => path.join(A, d, 'fit')).find((f) => fs.existsSync(path.join(f, 'binding.json'))) ?? path.join(A, 'fit');
  /* resumable (2026-10-04): a film that already reached a terminal status is not re-run (sweeps outlive one background slot) */
  let prior = null; try { prior = JSON.parse(fs.readFileSync(path.join(N, r.id, 'report.json'), 'utf8')).status; } catch {}
  if (prior && prior !== 'RUNNING') { natives.push({ id: r.id, name, family: r.family, exit: 0, status: prior, resumed: true }); continue; }
  const nr = run(process.execPath, ['tools/battle2-proof/native-runner.mjs', fit, fit, path.join(N, r.id), script], { cwd: path.join(ROOT, 'port/v2'), env: { ...process.env, CF_CPU_THROTTLE: '4' }, timeout: 1800e3 });
  fs.writeFileSync(path.join(N, `${r.id}.log`), nr.out); let status = 'NO_REPORT'; try { status = JSON.parse(fs.readFileSync(path.join(N, r.id, 'report.json'), 'utf8')).status; } catch {}
  natives.push({ id: r.id, name, family: r.family, exit: nr.code, status }); }
/* 3b. --fish-seams (opt-in): Codex's guarded fish-seams-batch.mjs on this batch's pilot + author root, native included. It writes
 * candidate repaired fits/films to native-<tag>-fishseams/; the gallery swap stays a separate full-size review (never automatic). */
if (flags.includes('--fish-seams') && eligible.some((p) => JSON.parse(fs.readFileSync(path.join(ROOT, p.packet, 'subject-source.json'), 'utf8')).family === 'fish')) {
  const fsOut = path.join(HERE, `native-${tag}-fishseams`); if (!fs.existsSync(fsOut)) { const fr = run(process.execPath, [path.join(HERE, 'fish-seams-batch.mjs'), rel(pilotOut), rel(path.join(HERE, `auto-${tag}`)), rel(fsOut), '--native'], { timeout: 6 * 3600e3 }); fs.writeFileSync(path.join(N, 'fish-seams.log'), fr.out); } }
/* 4. sheets: review sheet (master | approach | return | reaction) and full-size reaction crops of the native passes */
const ok = natives.filter((n) => n.status === 'DIAGNOSTIC_PASS');
if (ok.length) { run(process.execPath, [path.join(HERE, 'native-g2c54/sheet.mjs'), path.join(N, 'review-sheet.jpg'), ...ok.map((n) => `${n.name}=${path.join(N, n.id)}=${path.join(ROOT, eligible.find((e) => e.id === n.id).packet, 'master.png')}=${n.family}; native PASS; unreviewed`)]);
  run(process.execPath, [path.join(HERE, 'native-g2c54/crops.mjs'), path.join(N, 'fullsize-reaction.png'), 'turn1-hit-reaction-50.png', ...ok.map((n) => `${n.name}=${path.join(N, n.id)}`)]);
  /* keep the committed sheet small: JPEG, drop the PNG */
  run(process.execPath, ['-e', `const {createRequire}=require('module'),path=require('path');const req=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');sharp(${JSON.stringify(path.join(N, 'fullsize-reaction.png'))}).jpeg({quality:88}).toFile(${JSON.stringify(path.join(N, 'fullsize-reaction.jpg'))}).then(()=>require('fs').rmSync(${JSON.stringify(path.join(N, 'fullsize-reaction.png'))}))`]); }
/* 4b. full-size review sheets (2026-10-04): <name>-frames.png + <name>-zoom.png per native pass, for Claude's review */
if (ok.length) run(process.execPath, [path.join(HERE, 'review-sheets.mjs'), path.join(N, 'review'), ...ok.map((n) => path.join(N, n.id))]);
/* 5. gallery registry (data only; notes stay "unreviewed" until Claude looks at full size) */
const regFile = path.join(ROOT, 'audits/GENERATED_GALLERY_20260927/gallery-registry.json'), reg = fs.existsSync(regFile) ? JSON.parse(fs.readFileSync(regFile, 'utf8')) : [];
for (const n of ok) if (!reg.some((e) => e.nativeDir === rel(path.join(N, n.id)))) reg.push({ family: n.family, name: n.name, nativeDir: rel(path.join(N, n.id)), note: 'unreviewed', batch: rel(batch), tag });
fs.writeFileSync(regFile, JSON.stringify(reg, null, 1) + '\n');
const summary = { schema: 'cf.g1-score-batch/v1', batch: rel(batch), tag, pilot: pilot.length, patternSkipped: skipped, scored: rows.length,
  admitPassStatic: passes.map((r) => r.id), refused: rows.filter((r) => r.verdict !== 'ADMIT').map((r) => ({ id: r.id, reason: (r.reasons ?? [])[0] ?? null })),
  staticRed: rows.filter((r) => r.verdict === 'ADMIT' && r.static !== 'PASS_STATIC').map((r) => ({ id: r.id, static: r.static })), native: natives, runnerExit: auth.code };
fs.writeFileSync(path.join(N, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify({ tag, scored: rows.length, static: passes.length, nativePass: ok.length, nativeFail: natives.filter((n) => n.status !== 'DIAGNOSTIC_PASS').map((n) => n.id) }));
