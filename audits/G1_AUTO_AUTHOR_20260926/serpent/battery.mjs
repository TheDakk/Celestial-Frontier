/** Serpent strip author: positives and mutation battery (verdict only), fixed BEFORE the scored run (Claude, 2026-09-27).
 * Positives: the 10 generated G2 snakes (C54 + C56, pattern-eligible) and the 2 hand serpent references (python, racer), each authored
 * leave-one-species-out from the hand references. Mutants of every positive must REFUSE:
 *   flip (mirrored painting), erased-tail (left 30 % of the body removed), erased-head (right 12 % removed), mid-cut (3 % of the length
 *   removed at the middle), duplicated (a second copy of the body stacked above), plus wrong-family paintings (quadrupeds, birds, fish,
 *   insects). Usage (repo root): node audits/G1_AUTO_AUTHOR_20260926/serpent/battery.mjs > .../serpent/battery.json */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { serpentAuthor, serpentProfile } from '../../../port/v2/tools/anatomy-verify/serpent-author.mjs';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const load = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { rgba: Uint8Array.from(data), w: info.width, h: info.height }; };
const REFS = [{ id: 'python', name: 'Python', dir: 'audits/PYTHON_OPEN_POSE_20260923/candidate-02' }, { id: 'racer', name: 'Racer', dir: 'audits/ART_BATTLE_FOCUS_20260925/21-racer' }];
for (const r of REFS) Object.assign(r, await load(path.join(r.dir, 'master.png')), { authoring: JSON.parse(fs.readFileSync(path.join(r.dir, 'authoring.json'))) });
const C54 = 'audits/G2_THROUGHPUT_C54_20260926', C56 = 'audits/G2_THROUGHPUT_C56_20260926';
const POS = [...['17-python', '18-boa', '19-racer', '20-garter-snake'].map((k) => `${C54}/${k}`), ...['17-tree-snake', '18-rat-snake', '19-cottonmouth', '21-mamba', '23-whip-snake', '24-grass-snake'].map((k) => `${C56}/${k}`), ...REFS.map((r) => r.dir)];
const WRONG = ['01-dingo', '04-lion', '12-weasel', '13-duck', '14-goose', '21-cockroach', '22-locust'].map((k) => `${C54}/${k}`).concat(['audits/G2_THROUGHPUT_C56_20260926/32-stick-insect', 'audits/G2_THROUGHPUT_C56_20260926/09-crow']);
const nameOf = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'subject-source.json'))).name; } catch { return path.basename(dir); } };
const author = (img, name) => serpentAuthor({ ...img, id: 'battery', refs: REFS.filter((r) => r.name !== name), materials: { surface: 'scales' } });
const cols = (img, a, b) => { const o = { ...img, rgba: Uint8Array.from(img.rgba) }; for (let y = 0; y < img.h; y++) for (let x = Math.max(0, a); x <= Math.min(img.w - 1, b); x++) o.rgba[(y * img.w + x) * 4 + 3] = 0; return o; };
const mutants = (img) => { const P = serpentProfile(img.rgba, img.w, img.h).measures, { xmin, xmax, ext, median } = P, out = {};
  { const o = { ...img, rgba: Uint8Array.from(img.rgba) }; for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) for (let c = 0; c < 4; c++) o.rgba[(y * img.w + x) * 4 + c] = img.rgba[(y * img.w + (img.w - 1 - x)) * 4 + c]; out.flip = o; }
  out.erasedTail = cols(img, xmin, xmin + Math.round(ext * 0.3)); out.erasedHead = cols(img, xmax - Math.round(ext * 0.12), xmax);
  out.midCut = cols(img, xmin + Math.round(ext * 0.485), xmin + Math.round(ext * 0.515));
  { const o = { ...img, rgba: Uint8Array.from(img.rgba) }, dy = Math.round(2.5 * median); for (let y = 0; y < img.h; y++) { const sy = y + dy; if (sy >= img.h) continue; for (let x = 0; x < img.w; x++) { const s = (sy * img.w + x) * 4, d = (y * img.w + x) * 4; if (img.rgba[s + 3] >= 128 && o.rgba[d + 3] < 128) for (let c = 0; c < 4; c++) o.rgba[d + c] = img.rgba[s + c]; } } out.duplicated = o; }
  return out; };
const res = { schema: 'cf.g1-serpent-battery/v1', positives: [], mutants: {}, wrongFamily: [] }, tally = {};
for (const dir of POS) { const img = await load(path.join(dir, 'master.png')), name = nameOf(dir), r = author(img, name);
  res.positives.push({ id: path.basename(dir), name, verdict: r.verdict, reasons: r.reasons, ref: r.evidence.bestReference ?? null });
  for (const [k, m] of Object.entries(mutants(img))) { const v = author(m, name); (res.mutants[k] ??= []).push({ id: path.basename(dir), verdict: v.verdict, reasons: v.reasons.slice(0, 2) }); tally[k] ??= [0, 0]; tally[k][1]++; if (v.verdict === 'REFUSE') tally[k][0]++; } }
for (const dir of WRONG) { const img = await load(path.join(dir, 'master.png')), v = author(img, nameOf(dir)); res.wrongFamily.push({ id: path.basename(dir), verdict: v.verdict, reasons: v.reasons.slice(0, 2) }); }
res.summary = { positivesAdmitted: `${res.positives.filter((p) => p.verdict === 'ADMIT').length}/${res.positives.length}`, mutantsRefused: Object.fromEntries(Object.entries(tally).map(([k, [a, b]]) => [k, `${a}/${b}`])), wrongFamilyRefused: `${res.wrongFamily.filter((p) => p.verdict === 'REFUSE').length}/${res.wrongFamily.length}` };
console.log(JSON.stringify(res, null, 1));
