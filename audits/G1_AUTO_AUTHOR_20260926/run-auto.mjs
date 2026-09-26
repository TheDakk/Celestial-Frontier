/** G1 run: for each corpus subject, AUTO-author its packet from the OTHER subjects' hand-authored packets (leave-one-subject-out),
 * run Codex's unchanged intake + the re-rooted static gate, and score against the subject's own hand authoring (which the author
 * never reads). Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs [--tag=NAME] [id ...]
 * Writes auto[-TAG]/<id>/{packet/, fit/, static.json, evidence.json, score.json} and auto[-TAG]/summary.json. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {autoAuthor, prepareSubject, mirrorSubject, referenceStats, skeletonStats} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const HERE = import.meta.dirname, ROOT = path.resolve(HERE, '../..');
const require = createRequire(path.join(ROOT, 'port/v2/package.json'));
const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const { earthFaunaProfile } = await import(path.join(ROOT, 'port/v2/apps/game/src/earth-fauna-profiles.ts'));
const args = process.argv.slice(2), tag = (args.find((a) => a.startsWith('--tag=')) ?? '').slice(6), only = args.filter((a) => !a.startsWith('--'));
const skipStatic = args.includes('--no-static');
const ridgeArg = args.find((x) => x.startsWith('--ridge=')), ridgeFrac = ridgeArg ? Number(ridgeArg.slice(8)) : 0;
const nudgeArg = args.find((x) => x.startsWith('--nudge=')), nudgeFrac = nudgeArg ? Number(nudgeArg.slice(8)) : 0;
const { familyContract, familyContactChains } = await import(path.join(ROOT, 'port/v2/tools/creature-animation/family-contracts.mjs'));
const topkArg = args.find((x) => x.startsWith('--topk=')), topK = topkArg ? Number(topkArg.slice(7)) : 3;
const useChains = args.includes('--chains');
const useSkeleton = args.includes('--skeleton'), graphOf = (family) => familyContract(family).graph;
const terminalsOf = (family) => { try { return new Set(familyContactChains(familyContract(family)).map((c) => c.terminal).filter(Boolean)); } catch { return new Set(); } };
const OUT = path.join(HERE, 'auto' + (tag ? '-' + tag : ''));
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'corpus.json'), 'utf8')).subjects;
// family material defaults: a painted-surface class, not a reading of any subject's authoring
const MATERIAL = { quadruped: 'painted fur or hide', fish: 'painted scales and fin rays', 'biped-bird': 'painted feathers, horn bill and scaled feet', serpent: 'painted scales', insect: 'chitin', arachnid: 'chitin', myriapod: 'chitin', hopper: 'smooth skin', primate: 'fur', 'flyer-membrane': 'fur and membrane', radial: 'soft skin', cephalopod: 'smooth skin' };
const habitatFor = (name) => { const p = earthFaunaProfile(name); if (!p) return null; const m = p.media;
  const realm = m.includes('water') && m.includes('ground') ? 'amphibious' : m.includes('water') ? 'aquatic' : m.includes('ground') ? 'land' : m.includes('air') ? 'aerial' : null;
  return realm ? { realm, source: `G1 automatic: Earth fauna profile ${p.id} media ${m.join('+')}` } : null; };
const rgbaOf = async (file) => { const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { rgba: new Uint8ClampedArray(data), w: info.width, h: info.height }; };

// prepare every subject once
const subjects = [];
for (const s of corpus) {
  const dir = path.join(ROOT, s.packet), img = await rgbaOf(path.join(dir, 'master.png')), prepared = prepareSubject(img.rgba, img.w, img.h);
  const authoring = JSON.parse(fs.readFileSync(path.join(dir, 'authoring.json'), 'utf8'));
  subjects.push({ ...s, dir, img, prepared, authoring, subject: JSON.parse(fs.readFileSync(path.join(dir, 'subject-source.json'), 'utf8')), stats: referenceStats(prepared, authoring), skeleton: useSkeleton ? skeletonStats(prepared, authoring, graphOf(s.family)) : null });
}
const refOf = (s) => ({ ...s.prepared, family: s.family, subjectId: s.id, authoring: s.authoring, partPaint: s.stats.partPaint, unclaimedFrac: s.stats.unclaimedFrac, skeleton: s.skeleton });

const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
const ownerAt = (a, x, y) => { const k = a.parts.findIndex((p) => inside(x, y, p.polygonPx)); return k < 0 ? a.remainderPart : a.parts[k].id; };
function score(auto, hand, prepared) {
  const pts = Object.values(hand.landmarksPx); let bl = 0; for (const p of pts) for (const q of pts) bl = Math.max(bl, Math.hypot(p[0] - q[0], p[1] - q[1]));
  const errs = Object.entries(hand.landmarksPx).filter(([k]) => auto.landmarksPx[k]).map(([k, p]) => ({ joint: k, e: Math.hypot(p[0] - auto.landmarksPx[k][0], p[1] - auto.landmarksPx[k][1]) / bl }));
  let n = 0, same = 0; for (let y = 0; y < prepared.h; y += 6) for (let x = 0; x < prepared.w; x += 6) { if (!prepared.mask[y * prepared.w + x]) continue; n++; if (ownerAt(auto, x + 0.5, y + 0.5) === ownerAt(hand, x + 0.5, y + 0.5)) same++; }
  const sorted = errs.map((e) => e.e).sort((a, b) => a - b);
  return { bodyLengthPx: +bl.toFixed(1), landmarkMedian: +(sorted[(sorted.length - 1) >> 1] ?? NaN).toFixed(4), landmarkMax: +(sorted.at(-1) ?? NaN).toFixed(4), worst: errs.sort((a, b) => b.e - a.e).slice(0, 3).map((e) => `${e.joint} ${e.e.toFixed(3)}`), labelAgreement: +(same / Math.max(1, n)).toFixed(4), missingJoints: Object.keys(hand.landmarksPx).filter((k) => !auto.landmarksPx[k]) };
}

fs.mkdirSync(OUT, { recursive: true });
const rows = [];
for (const s of subjects) {
  if (only.length && !only.includes(s.id)) continue;
  const dir = path.join(OUT, s.id); fs.mkdirSync(dir, { recursive: true });
  const refs = subjects.filter((o) => o.id !== s.id).map(refOf); // leave-one-subject-out
  const mirrored = mirrorSubject(s.img.rgba, s.img.w, s.img.h);
  const res = autoAuthor({ target: s.prepared, mirrored, family: s.family, id: s.authoring.id ?? s.id, refs, materials: { surface: MATERIAL[s.family] ?? 'painted surface' }, habitat: habitatFor(s.subject.name), topK, nudgeFrac, ridge: ridgeFrac > 0 ? { radiusFrac: ridgeFrac, keep: terminalsOf(s.family) } : null, skeleton: useSkeleton ? { graph: graphOf(s.family) } : null, chains: useChains ? (() => { try { return familyContactChains(familyContract(s.family)); } catch { return null; } })() : null });
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify({ verdict: res.verdict, reasons: res.reasons, ...res.evidence }, null, 1) + '\n');
  const row = { id: s.id, family: s.family, verdict: res.verdict, reasons: res.reasons };
  if (res.authoring) {
    Object.assign(row, score(res.authoring, s.authoring, s.prepared));
    const packet = path.join(dir, 'packet'); fs.mkdirSync(packet, { recursive: true });
    fs.copyFileSync(path.join(s.dir, 'master.png'), path.join(packet, 'master.png'));
    fs.copyFileSync(path.join(s.dir, 'subject-source.json'), path.join(packet, 'subject-source.json')); // species metadata, not anatomy
    fs.writeFileSync(path.join(packet, 'authoring.json'), JSON.stringify(res.authoring, null, 2) + '\n');
    fs.writeFileSync(path.join(packet, 'presence.json'), JSON.stringify(res.presence, null, 2) + '\n');
    if ((res.verdict === 'ADMIT' || args.includes('--diagnostic-static')) && !skipStatic) { if (res.verdict !== 'ADMIT') row.diagnosticOnly = 'static run on a REFUSED author (diagnostic; never an admission)';
      const fit = path.join(dir, 'fit');
      if (!fs.existsSync(fit)) { const r = spawnSync(process.execPath, ['port/v2/tools/creature-animation/intake-authored.mjs', packet, fit], { cwd: ROOT, encoding: 'utf8', timeout: 900000 }); fs.writeFileSync(path.join(dir, 'intake.log'), (r.stdout || '') + (r.stderr || '')); }
      if (fs.existsSync(path.join(fit, 'binding.json'))) {
        const report = path.join(dir, 'static.json');
        if (!fs.existsSync(report)) { const r = spawnSync(process.execPath, [path.join(HERE, 'harness/static-runner.mjs'), fit, report], { cwd: ROOT, encoding: 'utf8', timeout: 1800000 }); fs.writeFileSync(path.join(dir, 'static.log'), (r.stdout || '') + (r.stderr || '')); }
        let st = null; try { st = JSON.parse(fs.readFileSync(report, 'utf8')); } catch {}
        row.static = st ? st.status : 'STATIC_ERROR'; row.staticFails = st?.rows?.filter((r) => r.status !== 'PASS').map((r) => r.id) ?? null;
        if (!st) { const log = fs.readFileSync(path.join(dir, 'static.log'), 'utf8'); row.staticError = (log.match(/"error":"([^"]{0,200})/) ?? [])[1] ?? log.slice(-200); }
      } else { row.static = 'INTAKE_REFUSED'; try { row.intakeError = JSON.parse(fs.readFileSync(path.join(fit, 'refusal.json'), 'utf8')).error.slice(0, 200); } catch {} }
    }
  }
  fs.writeFileSync(path.join(dir, 'score.json'), JSON.stringify(row, null, 1) + '\n');
  rows.push(row); console.log(JSON.stringify({ id: row.id, verdict: row.verdict, static: row.static, lm: row.landmarkMedian, lab: row.labelAgreement, reasons: row.reasons?.slice(0, 2), err: row.staticError ?? row.intakeError }));
}
fs.writeFileSync(path.join(OUT, 'summary' + (only.length ? '-partial' : '') + '.json'), JSON.stringify(rows, null, 1) + '\n');
