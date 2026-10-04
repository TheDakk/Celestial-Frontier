/** Probe (Cod tail knot, Dakk 2026-09-26): paint owned by the REMAINDER part that lies in the gap between the tail fin polygon and its
 * proximal axial neighbour (the tail stalk segment) is handed to that stalk segment; the stalk polygon is re-traced at full resolution.
 * Placement only (after the verdict), no pixels or landmarks change. Usage (repo root): node .../fill-gap.mjs <srcPacket> <outPacket> <tailPart> <stalkPart> [maxDistPx] */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ownerRaster } from '../../port/v2/tools/anatomy-verify/limb-separation.mjs';
import { traceRegion } from '../../port/v2/tools/anatomy-verify/leaf-growth.mjs';
import { paintMask } from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const [src, out, tail, stalk, maxArg] = process.argv.slice(2), maxD = Number(maxArg ?? 40);
const req = createRequire(new URL('../../port/v2/package.json', import.meta.url)), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const a = JSON.parse(fs.readFileSync(path.join(src, 'authoring.json'), 'utf8')); const { data, info } = await sharp(path.join(src, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, mask = data.some((v,i)=>i%4===3&&v===0) ? Uint8Array.from({length:w*h},(_,i)=>data[i*4+3]>0?1:0) : paintMask(data, w, h).mask, own = ownerRaster(a.parts, w, h), ti = a.parts.findIndex((p) => p.id === tail), si = a.parts.findIndex((p) => p.id === stalk), ri = a.parts.findIndex((p) => p.id === a.remainderPart);
// distance (BFS, 4-neighbour, through paint) from each of the two parts
const dist = (k) => { const d = new Int32Array(w * h).fill(-1), q = []; for (let i = 0; i < w * h; i++) if (own[i] === k && mask[i]) { d[i] = 0; q.push(i); }
  for (let j = 0; j < q.length; j++) { const i = q[j], x = i % w; if (d[i] >= maxD) continue; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (n >= 0 && n < w * h && d[n] < 0 && mask[n]) { d[n] = d[i] + 1; q.push(n); } } return d; };
const dt = dist(ti), ds = dist(si); let gained = 0; const region = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) { if (own[i] === si) region[i] = 1; if (mask[i] && (own[i] < 0 || own[i] === ri) && dt[i] >= 0 && ds[i] >= 0) { region[i] = 1; gained++; } }
// Trace a one-pixel outward collar so pixel-centre contour rounding cannot
// leave an unowned one-pixel crack. Earlier priority parts retain ownership.
const expanded=region.slice();for(let i=0;i<region.length;i++)if(region[i]){const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&X<w&&Y>=0&&Y<h)expanded[Y*w+X]=1;}}
const poly = traceRegion(expanded, w, h, 0.05); if (!poly) throw Error('empty stalk region');
fs.mkdirSync(out, { recursive: true }); for (const f of ['master.png', 'subject-source.json', 'presence.json']) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.writeFileSync(path.join(out, 'authoring.json'), JSON.stringify({ ...a, parts: a.parts.map((p, k) => (k === si ? { ...p, polygonPx: poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) } : p)) }, null, 2) + '\n');
const next=ownerRaster(a.parts.map((p,k)=>k===si?{...p,polygonPx:poly}:p),w,h);let requestedRetained=0,remaining=0,otherOwnersChanged=0,extraRemainder=0;for(let i=0;i<own.length;i++)if(mask[i]){if(region[i]&&own[i]!==si){if(next[i]===si)requestedRetained++;else remaining++;}if(own[i]>=0&&own[i]!==ri&&own[i]!==si&&own[i]!==next[i])otherOwnersChanged++;if(!region[i]&&next[i]===si&&(own[i]<0||own[i]===ri))extraRemainder++;}if(otherOwnersChanged)throw Error('Earlier ownership changed');
fs.writeFileSync(path.join(out, 'gap-receipt.json'), JSON.stringify({ tail, stalk, maxDistPx: maxD, gainedPixels: gained, requestedRetained, remaining, otherOwnersChanged, extraRemainder, contourCollarPx:1, rule: 'remainder-owned paint within maxD (through paint) of BOTH the tail part and the stalk part goes to the stalk part' }, null, 1) + '\n');
console.log(JSON.stringify({ gained }));
