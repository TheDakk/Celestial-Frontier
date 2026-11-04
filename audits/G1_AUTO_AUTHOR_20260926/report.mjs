/** Print a run's per-subject table: node audits/G1_AUTO_AUTHOR_20260926/report.mjs <auto-dir-name> */
import fs from 'node:fs'; import path from 'node:path';
const dir = path.join(import.meta.dirname, process.argv[2]);
for (const id of fs.readdirSync(dir).sort()) { const f = path.join(dir, id, 'score.json'); if (!fs.existsSync(f)) continue; const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  let red = ''; try { const s = JSON.parse(fs.readFileSync(path.join(dir, id, 'static.json'), 'utf8')); red = s.rows.filter((x) => x.status !== 'PASS').map((x) => x.id).join(','); const pres = s.presentation; if (pres && pres.status && pres.status !== 'PASS') red += ` presentation:${pres.status}`; } catch {}
  console.log(id.padEnd(12), (r.family ?? '').padEnd(15), r.verdict.padEnd(7), String(r.static ?? '-').padEnd(15), String(r.landmarkMedian).padEnd(7), (red || (r.reasons?.[0] ?? '') || r.staticError || r.intakeError || '').slice(0, 110)); }
