/** Tail close-ups (Dakk: "crunchy and missing"): the LEFT fighter's tail region from each native still, upscaled 3x. Usage: node tail-crops.mjs <out.png> <label>=<nativeDir> ... */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve(import.meta.dirname, '../../port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [out, ...rows] = process.argv.slice(2), stills = ['turn0-hit-approach-50.png', 'turn0-hit-return-end.png', 'turn1-hit-approach-50.png', 'turn1-hit-reaction-50.png'], comp = [];
for (let r = 0; r < rows.length; r++) { const [label, dir] = rows[r].split('=');
  comp.push({ input: Buffer.from(`<svg width="1500" height="30"><text x="8" y="22" font-size="20" font-family="Arial" fill="white">${label}</text></svg>`), left: 0, top: r * 400 });
  for (let k = 0; k < stills.length; k++) { const f = path.join(dir, stills[k]); if (!fs.existsSync(f)) continue;
    comp.push({ input: await sharp(f).extract({ left: 130, top: 340, width: 150, height: 120 }).resize(450, 360, { kernel: 'nearest' }).png().toBuffer(), left: k * 460, top: r * 400 + 32 }); } }
await sharp({ create: { width: 1840, height: rows.length * 400, channels: 4, background: '#0d151a' } }).composite(comp).png().toFile(out); console.log(out);
