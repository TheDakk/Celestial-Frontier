#!/usr/bin/env node
/* Joint-seam oracle for a posed cut-out render (C2 bounded repair review, 2026-09-13).
 * The rest-silhouette rule ("rest pixels that are transparent in the pose") counts every pixel a moving
 * part legitimately vacates, so it can never reach zero for a real pose. This oracle measures what the
 * eye sees instead: transparent pixels that sit INSIDE the posed body envelope (a morphological closing
 * of the rendered alpha) and within a disc of each named joint pivot. A wedge that opens at a joint is
 * counted; a concavity between legs or the vacated space behind a turned head is not.
 * Pure, deterministic: chamfer distance transforms, no randomness, no clock.
 * Usage: node tools/motion-proof/seam-oracle.mjs <render.png> <record.landmarks.json> [--close=0.02] [--disc=0.10] [--joints=head,neck,...] [--alpha=8] [--out=report.json]
 *   close: closing radius as a fraction of image width (fills gaps narrower than 2x this);
 *   disc:  joint disc radius as a fraction of image width, centred on the REST pivot of each joint (the joint's parent landmark);
 *   joints: which joints to report (default: every graph joint with a parent). Exit 0 always; the report carries the counts. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const args = process.argv.slice(2), positional = args.filter((a) => !a.startsWith('--')), opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
if (positional.length < 2) { console.error('usage: seam-oracle.mjs <render.png> <record.landmarks.json> [--close=0.02] [--disc=0.10] [--joints=a,b] [--alpha=8] [--out=report.json]'); process.exit(2); }
const [renderPath, recordPath] = positional;
const closeFrac = Number(opt('close', '0.02')), discFrac = Number(opt('disc', '0.10')), alphaMin = Number(opt('alpha', '8'));
const png = PNG.sync.read(fs.readFileSync(renderPath)), W = png.width, H = png.height, N = W * H;
const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
const GRAPH = [['pelvis', 'root'], ['spine', 'pelvis'], ['chest', 'spine'], ['neck', 'chest'], ['head', 'neck'], ['jaw', 'head'],
  ...['hindFar', 'foreFar', 'hindNear', 'foreNear'].flatMap((l) => [[l + 'Root', l.startsWith('hind') ? 'pelvis' : 'chest'], [l + 'Knee', l + 'Root'], [l + 'Ankle', l + 'Knee'], [l + 'Paw', l + 'Ankle']]),
  ['tail0', 'pelvis'], ['tail1', 'tail0'], ['tail2', 'tail1'], ['tail3', 'tail2'], ['earFarRoot', 'head'], ['earFarTip', 'earFarRoot'], ['earNearRoot', 'head'], ['earNearTip', 'earNearRoot']];
const parentOf = new Map(GRAPH);
const joints = (opt('joints', '') || GRAPH.map(([c]) => c).join(',')).split(',').filter(Boolean);

// Opaque mask.
const opaque = new Uint8Array(N); let opaqueCount = 0;
for (let i = 0; i < N; i++) if (png.data[i * 4 + 3] > alphaMin) { opaque[i] = 1; opaqueCount++; }
if (opaqueCount === 0) { console.error('render has no opaque pixels'); process.exit(2); }

/** Chamfer 3-4 distance (in pixel units, /3) from every pixel to the nearest pixel where mask === 1. */
function distanceTo(mask) {
  const INF = 1e9, d = new Float64Array(N).fill(INF);
  for (let i = 0; i < N; i++) if (mask[i]) d[i] = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 3); if (y > 0) { v = Math.min(v, d[i - W] + 3); if (x > 0) v = Math.min(v, d[i - W - 1] + 4); if (x < W - 1) v = Math.min(v, d[i - W + 1] + 4); }
    d[i] = v;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x; let v = d[i];
    if (x < W - 1) v = Math.min(v, d[i + 1] + 3); if (y < H - 1) { v = Math.min(v, d[i + W] + 3); if (x < W - 1) v = Math.min(v, d[i + W + 1] + 4); if (x > 0) v = Math.min(v, d[i + W - 1] + 4); }
    d[i] = v;
  }
  for (let i = 0; i < N; i++) d[i] /= 3;
  return d;
}
const r = closeFrac * W;
const dOpaque = distanceTo(opaque);
const dilated = new Uint8Array(N); for (let i = 0; i < N; i++) dilated[i] = dOpaque[i] <= r ? 1 : 0;
const notDilated = new Uint8Array(N); for (let i = 0; i < N; i++) notDilated[i] = dilated[i] ? 0 : 1;
const dHole = distanceTo(notDilated);
const closed = new Uint8Array(N); for (let i = 0; i < N; i++) closed[i] = dHole[i] > r ? 1 : 0; // erode the dilation by r
// Gap = inside the closed envelope but transparent.
const gap = new Uint8Array(N); let gapTotal = 0; for (let i = 0; i < N; i++) if (closed[i] && !opaque[i]) { gap[i] = 1; gapTotal++; }
// Per joint: gap pixels inside the disc around the joint's rest pivot (its parent landmark).
const R = discFrac * W, perJoint = {};
for (const j of joints) {
  const p = parentOf.get(j); const lm = record.landmarks?.[p ?? 'root']; if (!lm) { perJoint[j] = null; continue; }
  const cx = lm[0] * W, cy = lm[1] * H; let n = 0, box = [W, H, -1, -1];
  const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H - 1, Math.ceil(cy + R));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (gap[y * W + x] && Math.hypot(x - cx, y - cy) <= R) { n++; if (x < box[0]) box[0] = x; if (y < box[1]) box[1] = y; if (x > box[2]) box[2] = x; if (y > box[3]) box[3] = y; }
  perJoint[j] = { pivot: [Math.round(cx), Math.round(cy)], seamPixels: n, bounds: n ? { x: box[0], y: box[1], width: box[2] - box[0] + 1, height: box[3] - box[1] + 1 } : null };
}
const report = { schema: 'cf.seam-oracle/v1', render: path.basename(renderPath), record: path.basename(recordPath), size: { width: W, height: H }, opaquePixels: opaqueCount,
  closeRadiusPx: +r.toFixed(2), discRadiusPx: +R.toFixed(2), gapPixelsInsideEnvelope: gapTotal, perJoint };
const out = opt('out', ''); if (out) fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
