import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const G = 'audits/G1_AUTO_AUTHOR_20260926', rows = [];
for (const a of fs.readdirSync(G).filter((d) => d.startsWith('auto-'))) for (const id of fs.readdirSync(path.join(G, a))) {
  const fit = path.join(G, a, id, 'fit'); if (!fs.existsSync(path.join(fit, 'binding.json')) || !fs.existsSync(path.join(fit, 'parts/ownership.png'))) continue;
  const d = JSON.parse(fs.readFileSync(path.join(fit, 'declaration.json'))); if (d.schema !== 'cf.authored-part-masks/v1') continue;
  const k = d.parts.findIndex((p) => p.id === d.remainderPart) + 1; if (!k) continue; const want = [(k * 83) % 200 + 35, (k * 137) % 200 + 35, (k * 47) % 200 + 35];
  const { data, info } = await sharp(path.join(fit, 'parts/ownership.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const w = info.width, h = info.height;
  const m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = data[i * 4] === want[0] && data[i * 4 + 1] === want[1] && data[i * 4 + 2] === want[2] && data[i * 4 + 3] > 0 ? 1 : 0;
  const comp = new Int32Array(w * h).fill(-1), sizes = [];
  for (let i = 0; i < w * h; i++) { if (!m[i] || comp[i] >= 0) continue; const c = sizes.length, st = [i]; comp[i] = c; let n = 0;
    while (st.length) { const j = st.pop(); n++; const x = j % w, y = (j / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < w && Y < h) { const q = Y * w + X; if (m[q] && comp[q] < 0) { comp[q] = c; st.push(q); } } } } sizes.push(n); }
  sizes.sort((x, y) => y - x); const tot = sizes.reduce((s, n) => s + n, 0), isl = sizes.slice(1), big = isl.filter((n) => n >= 100);
  rows.push({ fit: `${a}/${id}`, islands: isl.length, islandPx: isl.reduce((s, n) => s + n, 0), big: big.length, biggest: isl[0] ?? 0, biggestShare: +((isl[0] ?? 0) / tot).toFixed(3) });
}
rows.sort((a, b) => b.biggest - a.biggest); fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
console.log('fits', rows.length, 'with an island >=100px', rows.filter((r) => r.big).length, 'with >5% island', rows.filter((r) => r.biggestShare > 0.05).length);
