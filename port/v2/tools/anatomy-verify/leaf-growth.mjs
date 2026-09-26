/** G1 v10 — PAINT-GROWN APPENDAGE PARTS (audits/G1_AUTO_AUTHOR_20260926/README.md). A transferred part polygon can fall short of its
 * own painted appendage (the Eagle's tail, warped from the Gull's shorter tail, left 27 % of the painted tail to the body part, which
 * then folds when the tail moves). After the verdict (so no refusal can change), every painted pixel of a counted appendage that the
 * independent counter ASSIGNED to reference owners, and that no owner part claims (the remainder/body has it), is handed to its
 * nearest owner part by a flood through that appendage's own paint; each grown part is re-traced at full resolution. Placement only:
 * the verdict, the counter and the refusal battery are computed before this runs. Deterministic; no creature or family cases. */
import { ownerRaster } from './limb-separation.mjs';

/** Moore-neighbour outer boundary of the largest 8-connected component of a full-resolution 0/1 region, simplified (RDP). */
export function traceRegion(region0, w, h, epsilon = 1.5) {
  // keep the largest 8-connected component (a part's own pixels can be split by earlier parts that overlap it)
  const lab = new Int32Array(w * h).fill(-1), stack = []; let best = -1, bestN = 0;
  for (let s0 = 0; s0 < w * h; s0++) { if (!region0[s0] || lab[s0] >= 0) continue; let n = 0; stack.push(s0); lab[s0] = s0;
    while (stack.length) { const q = stack.pop(); n++; const qx = q % w, qy = (q / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = qx + dx, Y = qy + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const r = Y * w + X; if (region0[r] && lab[r] < 0) { lab[r] = s0; stack.push(r); } } }
    if (n > bestN) { bestN = n; best = s0; } }
  if (best < 0) return null; // Empty paint must never select the unvisited (-1) background as anatomy.
  const region = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) region[i] = lab[i] === best ? 1 : 0;
  let start = -1; for (let i = 0; i < w * h; i++) if (region[i]) { start = i; break; } if (start < 0) return null;
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? region[y * w + x] : 0);
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = []; let x = start % w, y = (start / w) | 0, d = 7; const sx = x, sy = y;
  for (let guard = 0; guard < w * h * 2; guard++) { pts.push([x, y]); let found = false;
    for (let k = 0; k < 8; k++) { const nd = (d + 6 + k) % 8, X = x + dirs[nd][0], Y = y + dirs[nd][1]; if (at(X, Y)) { x = X; y = Y; d = nd; found = true; break; } }
    if (!found || (x === sx && y === sy && pts.length > 2)) break; }
  const rdp = (P, a, b, out) => { let idx = -1, dm = 0; const [x1, y1] = P[a], [x2, y2] = P[b], L = Math.hypot(x2 - x1, y2 - y1) || 1;
    for (let i = a + 1; i < b; i++) { const dd = Math.abs((y2 - y1) * P[i][0] - (x2 - x1) * P[i][1] + x2 * y1 - y2 * x1) / L; if (dd > dm) { dm = dd; idx = i; } }
    if (dm > epsilon) { rdp(P, a, idx, out); rdp(P, idx, b, out); } else out.push(P[a]); };
  if (pts.length < 4) return null; const half = pts.length >> 1, out = []; rdp(pts, 0, half, out); rdp(pts, half, pts.length - 1, out); out.push(pts[pts.length - 1]);
  // pixel-centre coordinates, expanded half a pixel outward is unnecessary: the polygon test samples pixel centres
  return out.length >= 3 ? out.map(([px, py]) => [px + 0.5, py + 0.5]) : null;
}

/** Grow assigned owner parts over the unclaimed paint of their counted appendages. `count` = the counter's target result (working-grid
 * `label`, `scale`, `W`), `assign` = inventoryCheck's assignment ([{owners, target}]). Returns {parts, grown: [{id, pixels}]}. */
export function growAppendageParts({ mask, w, h, parts, remainderPart, count, assign, minGain = 40, minOverlap = 0.1, skipJoints = new Set() }) {
  const own = ownerRaster(parts, w, h), rem = parts.findIndex((p) => p.id === remainderPart), idOf = new Map(parts.map((p, k) => [p.id, k]));
  const cellOf = (i) => { const x = i % w, y = (i / w) | 0; const X = Math.min(count.W - 1, Math.floor(x / count.scale)), Y = Math.min(count.H - 1, Math.floor(y / count.scale)); return Y * count.W + X; };
  const gained = new Map();
  for (const a of assign ?? []) { if (a.target === null || a.target === undefined || a.target < 0 || !((a.overlap ?? 0) >= minOverlap)) continue;
    // contact-chain parts (legs, feet) are the rig's ground-contact surfaces: they never grow
    const owners = new Set(a.owners.map((id) => idOf.get(id)).filter((k) => k !== undefined && k !== rem && !skipJoints.has(parts[k].joint))); if (!owners.size) continue;
    // multi-source flood from owner-claimed paint through the appendage's own unclaimed paint (4-connected)
    const lab = new Int32Array(w * h).fill(-1), queue = [];
    for (let i = 0; i < w * h; i++) if (mask[i] && count.label[cellOf(i)] === a.target && owners.has(own[i])) { lab[i] = own[i]; queue.push(i); }
    for (let q = 0; q < queue.length; q++) { const i = queue[q], x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) { if (j < 0 || j >= w * h || lab[j] >= 0 || !mask[j]) continue;
        if (count.label[cellOf(j)] !== a.target) continue; if (!(own[j] < 0 || own[j] === rem)) continue; lab[j] = lab[i]; queue.push(j);
        let g = gained.get(lab[i]); if (!g) gained.set(lab[i], g = []); g.push(j); } }
  }
  const grown = [], out = parts.map((p, k) => { const g = gained.get(k); if (!g || g.length < minGain) return p;
    const region = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (own[i] === k) region[i] = 1; for (const i of g) region[i] = 1;
    const poly = traceRegion(region, w, h); if (!poly) return p; grown.push({ id: p.id, pixels: g.length }); return { ...p, polygonPx: poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) }; });
  return { parts: out, grown };
}
