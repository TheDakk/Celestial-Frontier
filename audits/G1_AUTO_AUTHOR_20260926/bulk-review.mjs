/** Bulk review triage (Claude 2026-10-11, for the C243 all-out program). Visual acceptance stays a full-size still review; this tool
 * only makes that review scale to hundreds of species. For every native film dir under the given roots it reads the five review frames
 * (turn1 hit reaction, turn2 dodge reaction, turn3 hit reaction, turn3 late idle 50/90), counts key-magenta pixels per frame
 * (r>170, b>150, g<110, r-g>90: the C243 phase-1 rule), and writes one strip per film (five frames side by side, half size) plus
 * sheets of 6 strips (labels are in triage.json sheetOrder; this ffmpeg has no drawtext), so every reaction pose is seen, not only victory. Films with >= FLAG magenta pixels are listed first (magentaFilms).
 * Usage (repo root): node audits/G1_AUTO_AUTHOR_20260926/bulk-review.mjs OUTDIR ROOT [ROOT...]
 * A ROOT is a dir of film dirs (native-sweep7, an AI_FINISH native-01) or a film dir itself. Output: OUTDIR/triage.json, strips/, sheet-NN.png */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [out, ...roots] = process.argv.slice(2);
if (!out || !roots.length) { console.error('usage: bulk-review.mjs OUTDIR ROOT [ROOT...]'); process.exit(2); }
const FRAMES = ['turn1-hit-reaction-50', 'turn2-dodge-reaction-50', 'turn3-hit-reaction-50', 'turn3-hit-idle-50', 'turn3-hit-idle-90'];
const W = 1024, H = 576, FLAG = 5; /* 1-3 px appear on clean accepted films (effect sparks, anti-aliasing); measured on sweep 7: Moth 122, Bee 638, Water Beetle successor 41 */
const isFilm = (d) => FRAMES.every((f) => fs.existsSync(path.join(d, f + '.png')));
const films = [];
for (const r of roots) { if (isFilm(r)) { films.push(r); continue; }
  for (const e of fs.readdirSync(r, { withFileTypes: true })) if (e.isDirectory()) { const d = path.join(r, e.name);
    if (isFilm(d)) films.push(d); else if (isFilm(path.join(d, 'native'))) films.push(path.join(d, 'native')); } }
const magenta = (png) => { const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', png, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: W * H * 4 });
  let n = 0; for (let i = 0; i < b.length; i += 3) { const r = b[i], g = b[i + 1], bl = b[i + 2]; if (r > 170 && bl > 150 && g < 110 && r - g > 90) n++; } return n; };
fs.mkdirSync(path.join(out, 'strips'), { recursive: true });
const rows = films.map((d) => { const id = d.split(path.sep).filter((s) => s !== 'native').pop(), counts = FRAMES.map((f) => magenta(path.join(d, f + '.png')));
  const strip = path.join(out, 'strips', id + '.png'), inputs = FRAMES.flatMap((f) => ['-i', path.join(d, f + '.png')]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex',
    FRAMES.map((_, i) => `[${i}]scale=512:288[s${i}]`).join(';') + ';' + FRAMES.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${FRAMES.length}`, strip]);
  return { id, film: d, magenta: Object.fromEntries(FRAMES.map((f, i) => [f, counts[i]])), magentaTotal: counts.reduce((a, b) => a + b, 0), strip }; });
rows.sort((a, b) => (b.magentaTotal > 0) - (a.magentaTotal > 0) || a.id.localeCompare(b.id));
for (let k = 0; k < rows.length; k += 6) { const part = rows.slice(k, k + 6);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...part.flatMap((r) => ['-i', r.strip]), '-filter_complex',
    part.length > 1 ? part.map((_, i) => `[${i}]`).join('') + `vstack=inputs=${part.length}` : '[0]null', path.join(out, `sheet-${String(k / 6 + 1).padStart(2, '0')}.png`)]); }
fs.writeFileSync(path.join(out, 'triage.json'), JSON.stringify({ schema: 'cf.bulk-review/v1', frames: FRAMES, films: rows.length, sheetOrder: rows.map((r, i) => `sheet-${String(Math.floor(i / 6) + 1).padStart(2, '0')} row ${i % 6 + 1}: ${r.id}`),
  magentaFilms: rows.filter((r) => r.magentaTotal >= FLAG).map((r) => r.id), rows }, null, 1) + '\n');
console.log(JSON.stringify({ films: rows.length, magenta: rows.filter((r) => r.magentaTotal >= FLAG).map((r) => `${r.id}:${r.magentaTotal}`), sheets: Math.ceil(rows.length / 6) }));
