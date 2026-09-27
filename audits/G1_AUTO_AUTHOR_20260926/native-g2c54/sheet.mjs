/** Review sheet for the C54 generated paintings that passed G1 v10 + native (Claude, 2026-09-26).
 * One row per creature: the untouched generated master, then three native stills (approach, impact, reaction) cropped to the fighters.
 * Thumbnails only; each native dir keeps its full-size stills and film. Usage (repo root): node .../sheet.mjs <out.jpg> <id>=<nativeDir>=<master>=<note> ... */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve(import.meta.dirname, '../../../port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [out, ...rows] = process.argv.slice(2), esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const W = 2000, RH = 330, stills = ['turn0-hit-approach-50.png', 'turn0-hit-return-end.png', 'turn1-hit-reaction-50.png'], comp = [];
for (let r = 0; r < rows.length; r++) {
  const [id, dir, master, note = ''] = rows[r].split('='), top = 60 + r * RH;
  comp.push({ input: await sharp(master).trim().resize(380, 280, { fit: 'inside' }).png().toBuffer(), left: 10, top: top + 40 });
  for (let k = 0; k < stills.length; k++) { const f = path.join(dir, stills[k]); if (!fs.existsSync(f)) continue;
    /* fighters occupy the middle band of the 1024x576 still */
    comp.push({ input: await sharp(f).extract({ left: 100, top: 150, width: 824, height: 340 }).resize(530, 280).png().toBuffer(), left: 410 + k * 540, top: top + 40 }); }
  comp.push({ input: Buffer.from(`<svg width="${W}" height="36"><text x="10" y="26" font-size="22" font-family="Arial" fill="#eddfbb">${esc(id + '  |  ' + note)}</text></svg>`), left: 0, top });
}
const H = 60 + rows.length * RH, bg = Buffer.from(`<svg width="${W}" height="${H}"><rect width="100%" height="100%" fill="#0d151a"/><text x="10" y="38" font-size="28" font-family="Arial" fill="white">G2 C54 generated paintings: automatic author (G1 v10) + native battle stills (master | approach | return | reaction)</text></svg>`);
await sharp(bg).composite(comp).jpeg({ quality: 85 }).toFile(out);
console.log(out);
