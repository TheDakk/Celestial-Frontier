/** Full-resolution crops of both fighters (no downscale) from one native still per creature. Usage: node crops.mjs <out.png> <still> <label>=<dir> ... */
import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(path.resolve(import.meta.dirname, '../../../port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [out, still, ...rows] = process.argv.slice(2), comp = [];
for (let r = 0; r < rows.length; r++) { const [label, dir] = rows[r].split('=');
  comp.push({ input: Buffer.from(`<svg width="900" height="26"><text x="6" y="20" font-size="18" font-family="Arial" fill="white">${label}</text></svg>`), left: (r % 2) * 910, top: Math.floor(r / 2) * 300 });
  comp.push({ input: await sharp(path.join(dir, still)).extract({ left: 110, top: 200, width: 900, height: 270 }).png().toBuffer(), left: (r % 2) * 910, top: Math.floor(r / 2) * 300 + 28 }); }
await sharp({ create: { width: 1820, height: Math.ceil(rows.length / 2) * 300, channels: 4, background: '#0d151a' } }).composite(comp).png().toFile(out); console.log(out);
