/** Probe (Cod tail knot, Dakk 2026-09-26): paint owned by the REMAINDER part that lies in the gap between the tail fin polygon and its
 * proximal axial neighbour (the tail stalk segment) is handed to that stalk segment; the stalk polygon is re-traced at full resolution.
 * Placement only (after the verdict), no pixels or landmarks change. Usage (repo root): node .../fill-gap.mjs <srcPacket> <outPacket> <tailPart> <stalkPart> [maxDistPx] */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ownerRaster } from '../../../port/v2/tools/anatomy-verify/limb-separation.mjs';
import { traceRegion } from '../../../port/v2/tools/anatomy-verify/leaf-growth.mjs';
import { paintMask } from '../../../port/v2/tools/anatomy-verify/auto-author.mjs';
const [src, out, tail, stalk, maxArg] = process.argv.slice(2), maxD = Number(maxArg ?? 40);
const req = createRequire(new URL('../../../port/v2/package.json', import.meta.url)), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const a = JSON.parse(fs.readFileSync(path.join(src, 'authoring.json'), 'utf8')); const { data, info } = await sharp(path.join(src, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, mask = paintMask(data, w, h).mask, own = ownerRaster(a.parts, w, h), ti = a.parts.findIndex((p) => p.id === tail), si = a.parts.findIndex((p) => p.id === stalk), ri = a.parts.findIndex((p) => p.id === a.remainderPart);
// distance (BFS, 4-neighbour, through paint) from each of the two parts
const dist = (k) => { const d = new Int32Array(w * h).fill(-1), q = []; for (let i = 0; i < w * h; i++) if (own[i] === k && mask[i]) { d[i] = 0; q.push(i); }
  for (let j = 0; j < q.length; j++) { const i = q[j], x = i % w; if (d[i] >= maxD) continue; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (n >= 0 && n < w * h && d[n] < 0 && mask[n]) { d[n] = d[i] + 1; q.push(n); } } return d; };
const dt = dist(ti), ds = dist(si); let gained = 0; const region = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) { if (own[i] === si) region[i] = 1; if (mask[i] && (own[i] < 0 || own[i] === ri) && dt[i] >= 0 && ds[i] >= 0) { region[i] = 1; gained++; } }
const poly = traceRegion(region, w, h); if (!poly) throw Error('empty stalk region');
fs.mkdirSync(out, { recursive: true }); for (const f of ['master.png', 'subject-source.json', 'presence.json']) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.writeFileSync(path.join(out, 'authoring.json'), JSON.stringify({ ...a, parts: a.parts.map((p, k) => (k === si ? { ...p, polygonPx: poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) } : p)) }, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'gap-receipt.json'), JSON.stringify({ tail, stalk, maxDistPx: maxD, gainedPixels: gained, rule: 'remainder-owned paint within maxD (through paint) of BOTH the tail part and the stalk part goes to the stalk part' }, null, 1) + '\n');
console.log(JSON.stringify({ gained }));
