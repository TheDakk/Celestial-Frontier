/** Bridged variant of Codex's fill-gap-observed.mjs (C55 follow-up). Probe (Cod tail knot, Dakk 2026-09-26): paint owned by the REMAINDER part that lies in the gap between the tail fin polygon and its
 * proximal axial neighbour (the tail stalk segment) is handed to that stalk segment; the stalk polygon is re-traced at full resolution.
 * Placement only (after the verdict), no pixels or landmarks change. Usage (repo root): node .../fill-gap.mjs <srcPacket> <outPacket> <tailPart> <stalkPart> [maxDistPx] */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ownerRaster } from '../../port/v2/tools/anatomy-verify/limb-separation.mjs';
import { traceRegion } from '../../port/v2/tools/anatomy-verify/leaf-growth.mjs';
import { paintMask } from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const [src, out, tail, stalk] = process.argv.slice(2); let maxD = Infinity;
const req = createRequire(new URL('../../port/v2/package.json', import.meta.url)), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const a = JSON.parse(fs.readFileSync(path.join(src, 'authoring.json'), 'utf8')); const { data, info } = await sharp(path.join(src, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, mask = data.some((v,i)=>i%4===3&&v===0) ? Uint8Array.from({length:w*h},(_,i)=>data[i*4+3]>0?1:0) : paintMask(data, w, h).mask, own = ownerRaster(a.parts, w, h), ti = a.parts.findIndex((p) => p.id === tail), si = a.parts.findIndex((p) => p.id === stalk), ri = a.parts.findIndex((p) => p.id === a.remainderPart);
// distance (BFS, 4-neighbour, through paint) from each of the two parts
const dist = (k) => { const d = new Int32Array(w * h).fill(-1), q = []; for (let i = 0; i < w * h; i++) if (own[i] === k && mask[i]) { d[i] = 0; q.push(i); }
  for (let j = 0; j < q.length; j++) { const i = q[j], x = i % w; if (d[i] >= maxD) continue; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (n >= 0 && n < w * h && d[n] < 0 && mask[n]) { d[n] = d[i] + 1; q.push(n); } } return d; };
const dt = dist(ti), ds = dist(si);
const boundary=new Set();for(let i=0;i<w*h;i++)if(mask[i]&&(own[i]<0||own[i]===ri)&&ds[i]>=0){const x=i%w;const ns=[x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w];if(ns.some(n=>n>=0&&n<w*h&&mask[n]&&own[n]===ti))boundary.add(i);}
const components=[];while(boundary.size){const seed=boundary.values().next().value,queue=[seed],component=[];boundary.delete(seed);while(queue.length){const i=queue.pop();component.push(i);const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&X<w&&Y>=0&&Y<h&&boundary.delete(Y*w+X))queue.push(Y*w+X);}}components.push(component);}components.sort((a,b)=>b.length-a.length);if(!components[0]?.length)throw Error('No remainder-to-tail boundary');maxD=Math.max(...components[0].map(i=>ds[i]))+1;if(maxD>w/4)throw Error('Gap exceeds quarter-width locality');
let gained = 0; const region = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) { if (own[i] === si) region[i] = 1; if (mask[i] && (own[i] < 0 || own[i] === ri) && dt[i] >= 0 && ds[i] >= 0 && dt[i]<=maxD && ds[i]<=maxD) { region[i] = 1; gained++; } }
// Trace a one-pixel outward collar so pixel-centre contour rounding cannot
// leave an unowned one-pixel crack. Earlier priority parts retain ownership.
const expanded=region.slice();for(let i=0;i<region.length;i++)if(region[i]){const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&X<w&&Y>=0&&Y<h)expanded[Y*w+X]=1;}}
/* C55 follow-up (Claude): traceRegion keeps ONE 8-connected component, so a request still fragmented AFTER the collar lost pixels (Perch 9, Carp 28).
 * Bridge every fragment to the main component along the shortest 8-connected path through pixels the stalk may already own
 * (its own, the remainder's, or unowned). Priority owners are never crossed, so no other part's paint can change. */
const allowed=(i)=>own[i]<0||own[i]===ri||own[i]===si;const lab=new Int32Array(w*h).fill(-1),sizes=[];for(let s=0;s<w*h;s++){if(!expanded[s]||lab[s]>=0)continue;const st=[s];lab[s]=sizes.length;let n=0;while(st.length){const q=st.pop();n++;const qx=q%w,qy=(q/w)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=qx+dx,Y=qy+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const r=Y*w+X;if(expanded[r]&&lab[r]<0){lab[r]=sizes.length;st.push(r);}}}sizes.push(n);}
const main=sizes.indexOf(Math.max(...sizes));let bridged=0,bridgePixels=0;const connected=new Uint8Array(sizes.length);connected[main]=1;
/* A fragment enclosed by the main contour is already covered: bridge ONLY fragments whose requested pixels the plain trace loses. */
{const p0=traceRegion(expanded,w,h,0.05),cov=p0?ownerRaster([{polygonPx:p0}],w,h):new Int32Array(w*h).fill(-1);const lost=new Uint8Array(sizes.length);for(let i=0;i<w*h;i++)if(region[i]&&mask[i]&&own[i]!==si&&lab[i]>=0&&cov[i]!==0)lost[lab[i]]=1;for(let k=0;k<sizes.length;k++)if(!lost[k])connected[k]=1;}
for(let round=0;round<sizes.length&&connected.some((c,k)=>!c);round++){const prev=new Int32Array(w*h).fill(-2),q=[];for(let i=0;i<w*h;i++)if(expanded[i]&&connected[lab[i]]){prev[i]=-1;q.push(i);}let hit=-1;
  for(let j=0;j<q.length&&hit<0;j++){const i=q[j],x=i%w,y=(i/w)|0;for(let dy=-1;dy<=1&&hit<0;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const r=Y*w+X;if(prev[r]!==-2)continue;if(expanded[r]&&!connected[lab[r]]){prev[r]=i;hit=r;break;}if(allowed(r)&&!expanded[r]){prev[r]=i;q.push(r);}}}
  if(hit<0)throw Error('Fragment cannot be bridged without crossing another owner');const c=lab[hit];connected[c]=1;bridged++;for(let i=prev[hit];i>=0&&!expanded[i];i=prev[i]){expanded[i]=1;lab[i]=main;bridgePixels++;}
  for(let i=0;i<w*h;i++)if(expanded[i]&&lab[i]===c)lab[i]=main;}
const poly = traceRegion(expanded, w, h, 0.05); if (!poly) throw Error('empty stalk region');
if(fs.existsSync(out))throw Error('Fresh output required');
const next=ownerRaster(a.parts.map((p,k)=>k===si?{...p,polygonPx:poly}:p),w,h);let requestedRetained=0,remaining=0,otherOwnersChanged=0,extraRemainder=0;for(let i=0;i<own.length;i++)if(mask[i]){if(region[i]&&own[i]!==si){if(next[i]===si)requestedRetained++;else remaining++;}if(own[i]>=0&&own[i]!==ri&&own[i]!==si&&own[i]!==next[i])otherOwnersChanged++;if(!region[i]&&next[i]===si&&(own[i]<0||own[i]===ri))extraRemainder++;}if(otherOwnersChanged)throw Error('Earlier ownership changed');
if(remaining)throw Error('Requested gap pixels lost during contour rasterization: '+remaining);
fs.mkdirSync(out, { recursive: true }); for (const f of ['master.png', 'subject-source.json', 'presence.json']) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.writeFileSync(path.join(out, 'authoring.json'), JSON.stringify({ ...a, parts: a.parts.map((p, k) => (k === si ? { ...p, polygonPx: poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) } : p)) }, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'gap-receipt.json'), JSON.stringify({ tail, stalk, maxDistPx: maxD, automaticDistance:true, boundaryComponents:components.map(c=>c.length), requestFragments:sizes.length, bridged, bridgePixels, gainedPixels: gained, requestedRetained, remaining, otherOwnersChanged, extraRemainder, contourCollarPx:1, rule: 'remainder-owned paint within maxD (through paint) of BOTH the tail part and the stalk part goes to the stalk part' }, null, 1) + '\n');
console.log(JSON.stringify({ gained }));
