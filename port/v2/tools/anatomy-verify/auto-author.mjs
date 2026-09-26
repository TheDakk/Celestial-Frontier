/** G1 AUTO-AUTHOR (Generated Creature Pipeline, audits/GENERATION_PIPELINE_20260926/PROGRAM.md): a painting + its body family →
 * the exact `authoring.json` Codex hand-writes today, for the UNCHANGED `tools/creature-animation/intake-authored.mjs`.
 *
 * Method: registration by transfer, no creature or family special cases. Every master shares the controlled layout (1254² canvas,
 * strict side profile, facing right). The target's outer silhouette contour is matched to each REFERENCE of the same family by cyclic
 * dynamic time warping on bbox-normalised position + local turning; a regularised thin-plate spline built from the matched contour
 * points carries the reference's landmarks and part polygons onto the target. Polygons come from the best reference; each landmark
 * is the median over the best few references that carry it. References are hand-authored packets of OTHER subjects only (the caller
 * enforces leave-one-subject-out).
 *
 * Verdict (evidence from the target's VISIBLE paint, never the template):
 * - `missing-anatomy`: a part whose mapped polygon covers too little paint (an erased limb),
 * - `unexplained-anatomy`: a large painted region no part claims and far from the body (a duplicated / extra limb),
 * - `facing`: the mirrored target matches its family better than the target does,
 * - `wrong-family`: another family's references match clearly better.
 * Presence (cf.anatomy-presence/v2) starts all-visible; hidden/folded are declared classes and are NEVER inferred here. */
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {countVisibleAnatomy, referenceInventory, inventoryCheck} from './limb-counter.mjs';
/** Counter results cached per painting (keyed by its mask array, which prepared copies share). */
const COUNT_CACHE = new WeakMap();
export const countOf = (subject) => { let c = COUNT_CACHE.get(subject.mask); if (!c) { c = countVisibleAnatomy(subject.mask, subject.w, subject.h); COUNT_CACHE.set(subject.mask, c); } return c; };
const INV_CACHE = new WeakMap();
const inventoryOf = (ref) => { let v = INV_CACHE.get(ref.mask); if (!v) { v = referenceInventory(countOf(ref), ref.authoring); INV_CACHE.set(ref.mask, v); } return v; };

export const AUTO_AUTHOR_SCHEMA = 'cf.g1-auto-author/v1';
const N = 240, WORK = 314; // contour samples; working grid for tracing (1254 / 4)

/** Binary mask (Uint8Array, 1 = paint) from RGBA: alpha where the master has transparency, else the magenta key. */
export function paintMask(rgba, w, h) {
  let transparent = false; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) { transparent = true; break; }
  const alpha = transparent ? null : keyAndDespill(new Uint8ClampedArray(rgba), w, h).alpha;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = (transparent ? rgba[i * 4 + 3] : alpha[i]) >= 128 ? 1 : 0;
  return { mask: m, keyed: !transparent };
}

/** Largest 8-connected component of a mask (holes kept). */
function largestComponent(m, w, h) {
  const lab = new Int32Array(w * h).fill(-1); let best = -1, bestN = 0; const stack = [];
  for (let s = 0; s < w * h; s++) { if (!m[s] || lab[s] >= 0) continue; let n = 0; stack.push(s); lab[s] = s;
    while (stack.length) { const p = stack.pop(); n++; const x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (m[q] && lab[q] < 0) { lab[q] = s; stack.push(q); } } }
    if (n > bestN) { bestN = n; best = s; } }
  const out = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) out[i] = lab[i] === best ? 1 : 0; return out;
}

/** Outer contour of a mask, traced on a downsampled grid (Moore neighbourhood), returned in full-resolution pixel coordinates,
 * clockwise, resampled to N points by arc length. */
export function outerContour(mask, w, h) {
  const s = w / WORK, W = WORK, H = Math.round(h / s), g = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let any = 0; for (let yy = Math.floor(y * s); yy < Math.min(h, Math.floor((y + 1) * s)) && !any; yy++) for (let xx = Math.floor(x * s); xx < Math.min(w, Math.floor((x + 1) * s)); xx++) if (mask[yy * w + xx]) { any = 1; break; } g[y * W + x] = any; }
  const c = largestComponent(g, W, H);
  let start = -1; for (let i = 0; i < W * H; i++) if (c[i]) { start = i; break; } if (start < 0) throw Error('auto-author: empty silhouette');
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? c[y * W + x] : 0);
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = []; let x = start % W, y = (start / W) | 0, d = 7; const sx = x, sy = y;
  for (let guard = 0; guard < W * H * 4; guard++) { pts.push([x, y]); let found = false;
    for (let k = 0; k < 8; k++) { const nd = (d + 6 + k) % 8, X = x + dirs[nd][0], Y = y + dirs[nd][1]; if (at(X, Y)) { x = X; y = Y; d = nd; found = true; break; } }
    if (!found || (x === sx && y === sy && pts.length > 2)) break; }
  const full = pts.map(([px, py]) => [(px + 0.5) * s, (py + 0.5) * s]);
  const len = [0]; for (let i = 1; i <= full.length; i++) { const a = full[i - 1], b = full[i % full.length]; len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = len[full.length], out = [];
  for (let k = 0, j = 0; k < N; k++) { const t = (k / N) * total; while (len[j + 1] < t) j++; const a = full[j], b = full[(j + 1) % full.length], f = (t - len[j]) / Math.max(1e-9, len[j + 1] - len[j]); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return out;
}

const bboxOf = (m, w, h) => { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };

/** Per-point descriptor: bbox-normalised position and the turning angle over a short window (curvature sign/size). */
function describe(contour, box) {
  const n = contour.length, K = 4;
  return contour.map(([x, y], i) => { const a = contour[(i - K + n) % n], b = contour[(i + K) % n];
    const t1 = Math.atan2(y - a[1], x - a[0]), t2 = Math.atan2(b[1] - y, b[0] - x); let turn = t2 - t1; while (turn > Math.PI) turn -= 2 * Math.PI; while (turn < -Math.PI) turn += 2 * Math.PI;
    return [(x - box.x0) / box.w, (y - box.y0) / box.h, turn]; });
}

/** Cyclic DTW: best alignment of B (target) to A (reference) over start offsets; returns mean step cost and the matched index pairs. */
export function cyclicDtw(A, B, { turnWeight = 0.05, offsetStep = 4 } = {}) {
  const n = A.length, m = B.length; let best = { cost: Infinity, pairs: [] };
  const D = new Float64Array((n + 1) * (m + 1)), P = new Uint8Array((n + 1) * (m + 1));
  for (let off = 0; off < m; off += offsetStep) {
    D.fill(Infinity); D[0] = 0;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const a = A[i - 1], b = B[(j - 1 + off) % m], du = a[0] - b[0], dv = a[1] - b[1], dt = a[2] - b[2];
      const c = du * du + dv * dv + turnWeight * dt * dt;
      const x0 = D[(i - 1) * (m + 1) + (j - 1)], x1 = D[(i - 1) * (m + 1) + j], x2 = D[i * (m + 1) + (j - 1)];
      let v = x0, p = 0; if (x1 < v) { v = x1; p = 1; } if (x2 < v) { v = x2; p = 2; }
      D[i * (m + 1) + j] = v + c; P[i * (m + 1) + j] = p;
    }
    const cost = D[n * (m + 1) + m] / (n + m);
    if (cost < best.cost) { const pairs = []; let i = n, j = m; while (i > 0 && j > 0) { pairs.push([i - 1, (j - 1 + off) % m]); const p = P[i * (m + 1) + j]; if (p === 0) { i--; j--; } else if (p === 1) i--; else j--; } pairs.reverse();
      // detours: the longest run where the target advances while the reference index stays put (extra anatomy on the target), and
      // the converse (reference anatomy the target lacks) — fractions of the contour
      let runT = 0, runR = 0, curT = 0, curR = 0; for (let k = 1; k < pairs.length; k++) { if (pairs[k][0] === pairs[k - 1][0]) { curT++; runT = Math.max(runT, curT); } else curT = 0; if (pairs[k][1] === pairs[k - 1][1]) { curR++; runR = Math.max(runR, curR); } else curR = 0; }
      best = { cost, pairs, detourTarget: runT / m, detourRef: runR / n }; }
  }
  return best;
}

/** Regularised 2-D thin-plate spline through control pairs (src → dst). */
export function thinPlate(src, dst, lambda) {
  const n = src.length, U = (r2) => (r2 < 1e-12 ? 0 : r2 * Math.log(r2)), M = n + 3, A = Array.from({ length: M }, () => new Float64Array(M + 2));
  for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { const dx = src[i][0] - src[j][0], dy = src[i][1] - src[j][1]; A[i][j] = U(dx * dx + dy * dy) + (i === j ? lambda : 0); }
    A[i][n] = 1; A[i][n + 1] = src[i][0]; A[i][n + 2] = src[i][1]; A[n][i] = 1; A[n + 1][i] = src[i][0]; A[n + 2][i] = src[i][1]; A[i][M] = dst[i][0]; A[i][M + 1] = dst[i][1]; }
  for (let c = 0; c < M; c++) { let p = c; for (let r = c + 1; r < M; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]]; const piv = A[c][c] || 1e-12;
    for (let r = 0; r < M; r++) { if (r === c) continue; const f = A[r][c] / piv; if (!f) continue; for (let k = c; k < M + 2; k++) A[r][k] -= f * A[c][k]; } }
  const wx = A.map((row, i) => row[M] / (row[i] || 1e-12)), wy = A.map((row, i) => row[M + 1] / (row[i] || 1e-12));
  return ([x, y]) => { let X = wx[n] + wx[n + 1] * x + wx[n + 2] * y, Y = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
    for (let i = 0; i < n; i++) { const dx = x - src[i][0], dy = y - src[i][1], u = U(dx * dx + dy * dy); X += wx[i] * u; Y += wy[i] * u; } return [X, Y]; };
}

/** A prepared subject: mask, contour, descriptors. */
export function prepareSubject(rgba, w, h) {
  const { mask, keyed } = paintMask(rgba, w, h), box = bboxOf(mask, w, h), contour = outerContour(mask, w, h);
  return { w, h, mask, keyed, box, contour, desc: describe(contour, box) };
}
export function mirrorSubject(rgba, w, h) { const out = new Uint8ClampedArray(rgba.length); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (y * w + x) * 4, d = (y * w + (w - 1 - x)) * 4; for (let k = 0; k < 4; k++) out[d + k] = rgba[s + k]; } return prepareSubject(out, w, h); }

/** Transfer one reference onto the target: DTW, spline, mapped landmarks + polygons. */
export function transferReference(target, ref, { lambda = 2e3, pairStride = 3 } = {}) {
  const dtw = cyclicDtw(ref.desc, target.desc), used = new Set(), src = [], dst = [];
  dtw.pairs.forEach(([i, j], k) => { if (k % pairStride || used.has(i)) return; used.add(i); src.push(ref.contour[i]); dst.push(target.contour[j]); });
  const map = thinPlate(src, dst, lambda);
  const landmarksPx = Object.fromEntries(Object.entries(ref.authoring.landmarksPx).map(([k, p]) => [k, map(p)]));
  const parts = ref.authoring.parts.map((p) => ({ id: p.id, joint: p.joint, layer: p.layer, polygonPx: p.polygonPx.map(map) }));
  const gRef = ref.authoring.groundLineY * ref.h, footX = ref.box.x0 + ref.box.w / 2, gy = map([footX, gRef])[1] / target.h;
  return { cost: dtw.cost, detourTarget: dtw.detourTarget, detourRef: dtw.detourRef, landmarksPx, parts, groundLineY: gy, ref };
}

const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
const polyArea = (poly) => { let s = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(s / 2); };
/** Fraction of a polygon's area that is paint (sampled on a 4 px grid). */
function paintCoverage(mask, w, h, poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  let n = 0, p = 0; for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, y1); y += 4) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(w - 1, x1); x += 4) if (inside(x + 0.5, y + 0.5, poly)) { n++; if (mask[y * w + x]) p++; }
  return n ? p / n : 0;
}
/** Nearest paint pixel to a point (bounded spiral search). */
function snapToPaint(mask, w, h, [x, y], R = 60) {
  const xi = Math.round(x), yi = Math.round(y); if (xi >= 0 && yi >= 0 && xi < w && yi < h && mask[yi * w + xi]) return [x, y];
  let best = null, bd = Infinity; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const X = xi + dx, Y = yi + dy; if (X < 0 || Y < 0 || X >= w || Y >= h || !mask[Y * w + X]) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [X + 0.5, Y + 0.5]; } }
  return best ?? [x, y];
}

/** Two-pass chamfer distance transform of the paint (distance to the nearest non-paint pixel, in px). */
export function distanceTransform(mask, w, h) {
  const d = new Float32Array(w * h), INF = 1e9, A = 1, B = Math.SQRT2;
  for (let i = 0; i < w * h; i++) d[i] = mask[i] ? INF : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!d[i]) continue; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + A); if (y > 0) { v = Math.min(v, d[i - w] + A); if (x > 0) v = Math.min(v, d[i - w - 1] + B); if (x < w - 1) v = Math.min(v, d[i - w + 1] + B); } d[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!d[i]) continue; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + A); if (y < h - 1) { v = Math.min(v, d[i + w] + A); if (x < w - 1) v = Math.min(v, d[i + w + 1] + B); if (x > 0) v = Math.min(v, d[i + w - 1] + B); } d[i] = v; }
  return d;
}
/** Move a point uphill on the distance transform (toward the limb's medial ridge), never farther than R px from where it started. */
function climbToRidge(dt, w, h, [x, y], R) {
  let cx = Math.round(x), cy = Math.round(y); const sx = cx, sy = cy;
  for (let it = 0; it < 4 * R; it++) { let bx = cx, by = cy, bv = dt[cy * w + cx];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= w || Y >= h || Math.hypot(X - sx, Y - sy) > R) continue; const v = dt[Y * w + X]; if (v > bv + 1e-6) { bv = v; bx = X; by = Y; } }
    if (bx === cx && by === cy) break; cx = bx; cy = by; }
  return [cx + 0.5, cy + 0.5];
}

/** Bone segments per part: a part at joint J owns the bones J→child for every child of J in the family graph; a terminal owns a short
 * extension of its parent→J bone (the tip); the root marker owns nothing. `graph` is the contract's [[child, parent], ...]. */
export function boneSegments(partsSpec, landmarksPx, graph, convention = null, { extendTerminals = true } = {}) {
  const children = new Map(), parent = new Map(); for (const [c, p] of graph) { if (!children.has(p)) children.set(p, []); children.get(p).push(c); parent.set(c, p); }
  return partsSpec.map((part) => { const J = part.joint, P = landmarksPx[J]; if (!P || J === 'root') return [];
    if (convention?.get(part.id) === 'parent') { const Q = landmarksPx[parent.get(J)]; return Q ? [[Q, P]] : [[P, P]]; }
    if (!extendTerminals && !(children.get(J) ?? []).some((c) => landmarksPx[c])) return [[P, P]];
    const kids = (children.get(J) ?? []).filter((c) => landmarksPx[c]);
    if (kids.length) return kids.map((c) => [P, landmarksPx[c]]);
    const par = parent.get(J), Q = par && landmarksPx[par]; if (!Q) return [[P, P]];
    return [[P, [P[0] + (P[0] - Q[0]) * 0.45, P[1] + (P[1] - Q[1]) * 0.45]]]; });
}
const segDist2 = (x, y, [a, b]) => { const vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy; let t = L ? ((x - a[0]) * vx + (y - a[1]) * vy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = a[0] + t * vx - x, dy = a[1] + t * vy - y; return dx * dx + dy * dy; };
/** Label every painted pixel (on a `step` grid) with the part whose bone is nearest; returns labels (part index, -1 = none) and
 * each pixel's distance to its nearest bone. */
export function labelByBones(target, segs, step = 2) {
  const W = Math.ceil(target.w / step), H = Math.ceil(target.h / step), lab = new Int16Array(W * H).fill(-1), dist = new Float32Array(W * H);
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) { const x = gx * step + step / 2, y = gy * step + step / 2, xi = Math.min(target.w - 1, Math.floor(x)), yi = Math.min(target.h - 1, Math.floor(y));
    if (!target.mask[yi * target.w + xi]) continue; let best = -1, bd = Infinity;
    for (let k = 0; k < segs.length; k++) for (const s of segs[k]) { const d = segDist2(x, y, s); if (d < bd) { bd = d; best = k; } }
    lab[gy * W + gx] = best; dist[gy * W + gx] = Math.sqrt(bd); }
  return { lab, dist, W, H, step };
}
/** Trace the outer boundary of label k's largest region on the label grid → a simplified polygon in pixel coordinates. */
function regionPolygon(L, k) {
  const { lab, W, H, step } = L, m = new Uint8Array(W * H); let any = 0; for (let i = 0; i < W * H; i++) if (lab[i] === k) { m[i] = 1; any++; }
  if (!any) return null;
  const c = largestComponent(m, W, H); let start = -1; for (let i = 0; i < W * H; i++) if (c[i]) { start = i; break; }
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? c[y * W + x] : 0), dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = []; let x = start % W, y = (start / W) | 0, d = 7; const sx = x, sy = y;
  for (let g = 0; g < W * H * 4; g++) { pts.push([x, y]); let f = false; for (let t = 0; t < 8; t++) { const nd = (d + 6 + t) % 8, X = x + dirs[nd][0], Y = y + dirs[nd][1]; if (at(X, Y)) { x = X; y = Y; d = nd; f = true; break; } } if (!f || (x === sx && y === sy && pts.length > 2)) break; }
  // pad each traced cell outward by half a cell so the polygon covers its pixels, then Ramer–Douglas–Peucker
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const full = pts.map(([px, py]) => { const vx = px - cx, vy = py - cy, n = Math.hypot(vx, vy) || 1; return [(px + 0.5 + 0.7 * vx / n) * step, (py + 0.5 + 0.7 * vy / n) * step]; });
  const rdp = (a, eps) => { if (a.length < 3) return a; let idx = -1, dm = 0; const [p, q] = [a[0], a[a.length - 1]];
    for (let i = 1; i < a.length - 1; i++) { const d = Math.sqrt(segDist2(a[i][0], a[i][1], [p, q])); if (d > dm) { dm = d; idx = i; } }
    return dm > eps ? [...rdp(a.slice(0, idx + 1), eps).slice(0, -1), ...rdp(a.slice(idx), eps)] : [p, q]; };
  const poly = full.length > 8 ? rdp(full, 1.5) : full;
  return poly.length >= 3 ? poly.map(([a, b]) => [Math.round(a * 10) / 10, Math.round(b * 10) / 10]) : null;
}
/** Bone-on-paint evidence: the share of each part's bone length that lies on (slightly dilated) paint. */
function boneOnPaint(target, segs, dilatePx) {
  const on = (x, y) => { const xi = Math.round(x), yi = Math.round(y); for (let dy = -dilatePx; dy <= dilatePx; dy += Math.max(1, dilatePx >> 1)) for (let dx = -dilatePx; dx <= dilatePx; dx += Math.max(1, dilatePx >> 1)) { const X = xi + dx, Y = yi + dy; if (X >= 0 && Y >= 0 && X < target.w && Y < target.h && target.mask[Y * target.w + X]) return true; } return false; };
  return segs.map((ss) => { if (!ss.length) return 1; let n = 0, p = 0; for (const [a, b] of ss) for (let t = 0; t <= 1.0001; t += 0.1) { n++; if (on(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) p++; } return p / n; });
}
/** Paint far from every bone, relative to the body diagonal (duplicated or extra anatomy). */
function farFromBones(L, diag, frac) { let n = 0, far = 0; for (let i = 0; i < L.lab.length; i++) { if (L.lab[i] < 0) continue; n++; if (L.dist[i] > frac * diag) far++; } return far / Math.max(1, n); }
/** Skeleton statistics of a subject's OWN hand authoring (so the verdict compares like with like), plus, per part, how well each bone
 * convention reproduces the subject's hand polygons (IoU on paint) — pooled over REFERENCES to choose the convention for a target. */
export function skeletonStats(prepared, authoring, graph, farFrac = 0.1) {
  const diag = Math.hypot(prepared.box.w, prepared.box.h), all = (c) => new Map(authoring.parts.map((p) => [p.id, c]));
  const hand = (x, y) => { const k = authoring.parts.findIndex((p) => inside(x, y, p.polygonPx)); return k < 0 ? authoring.remainderPart : authoring.parts[k].id; };
  const iou = {}; let L = null;
  for (const conv of ['child', 'parent']) { const Lc = labelByBones(prepared, boneSegments(authoring.parts, authoring.landmarksPx, graph, all(conv)), 4); if (conv === 'child') L = Lc;
    const inter = new Map(), a = new Map(), b = new Map();
    for (let gy = 0; gy < Lc.H; gy++) for (let gx = 0; gx < Lc.W; gx++) { const k = Lc.lab[gy * Lc.W + gx]; if (k < 0) continue; const got = authoring.parts[k].id, want = hand(gx * 4 + 2, gy * 4 + 2);
      a.set(got, (a.get(got) ?? 0) + 1); b.set(want, (b.get(want) ?? 0) + 1); if (got === want) inter.set(got, (inter.get(got) ?? 0) + 1); }
    for (const p of authoring.parts) { const I = inter.get(p.id) ?? 0, U = (a.get(p.id) ?? 0) + (b.get(p.id) ?? 0) - I; (iou[p.id] ??= {})[conv] = U ? I / U : 0; } }
  const shareOf = (Lx) => { const tot = Lx.lab.reduce((n, v) => n + (v >= 0 ? 1 : 0), 0); return Object.fromEntries(authoring.parts.map((p, k) => { let n = 0; for (let i = 0; i < Lx.lab.length; i++) if (Lx.lab[i] === k) n++; return [p.id, n / Math.max(1, tot)]; })); };
  const Lp = labelByBones(prepared, boneSegments(authoring.parts, authoring.landmarksPx, graph, all('parent')), 4);
  return { far: farFromBones(L, diag, farFrac), farParent: farFromBones(Lp, diag, farFrac), partShare: shareOf(L), partShareParent: shareOf(Lp), conventionIoU: iou };
}
/** Per-part convention pooled over reference subjects' hand authoring (never the target's). */
export function learnConvention(refs) {
  const sum = new Map(); for (const r of refs) for (const [id, v] of Object.entries(r.skeleton?.conventionIoU ?? {})) { const s = sum.get(id) ?? { child: 0, parent: 0 }; s.child += v.child; s.parent += v.parent; sum.set(id, s); }
  // ONE convention per family (a mixed choice gives two parts the same bone, and one of them then owns nothing)
  let child = 0, parent = 0; for (const s of sum.values()) { child += s.child; parent += s.parent; }
  const pick = parent > child ? 'parent' : 'child'; return new Map([...sum.keys()].map((id) => [id, pick]));
}

/** Shortest path over the paint from A to B that favours the medial ridge (cost 1/(dt+1) per step), on a `step` grid inside the
 * padded box of the two points; returns full-resolution points A→B, or null when the paint does not connect them. */
export function ridgePath(target, dt, A, B, step = 3, pad = 80) {
  const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0]) - pad)), y0 = Math.max(0, Math.floor(Math.min(A[1], B[1]) - pad));
  const x1 = Math.min(target.w - 1, Math.ceil(Math.max(A[0], B[0]) + pad)), y1 = Math.min(target.h - 1, Math.ceil(Math.max(A[1], B[1]) + pad));
  const W = Math.floor((x1 - x0) / step) + 1, H = Math.floor((y1 - y0) / step) + 1, idx = (x, y) => y * W + x;
  const cell = (p) => [Math.min(W - 1, Math.max(0, Math.round((p[0] - x0) / step))), Math.min(H - 1, Math.max(0, Math.round((p[1] - y0) / step)))];
  const paint = (gx, gy) => { const X = x0 + gx * step, Y = y0 + gy * step; return target.mask[Y * target.w + X] ? dt[Y * target.w + X] : -1; };
  const [sx, sy] = cell(A), [tx, ty] = cell(B), dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const heap = []; const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  dist[idx(sx, sy)] = 0; push(0, idx(sx, sy)); const goal = idx(tx, ty);
  while (heap.length) { const [d, i] = pop(); if (d > dist[i]) continue; if (i === goal) break; const gx = i % W, gy = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = gx + dx, Y = gy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const v = paint(X, Y); if (v < 0 && !(X === tx && Y === ty)) continue;
      const j = idx(X, Y), nd = d + Math.hypot(dx, dy) / (Math.max(0, v) + 1); if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd, j); } } }
  if (!Number.isFinite(dist[goal])) return null;
  const out = []; for (let i = goal; i >= 0; i = prev[i]) out.push([x0 + (i % W) * step, y0 + ((i / W) | 0) * step]);
  return out.reverse();
}
/** Place a contact chain's interior joints (knee, end) along the painted leg: arc-length fractions of the reference's own bones. */
export function refineChain(target, dt, landmarksPx, refLandmarks, chain) {
  const ids = [chain.hip, chain.knee, chain.end, chain.terminal].filter((j) => j && landmarksPx[j] && refLandmarks[j]);
  if (ids.length < 3) return false;
  const path = ridgePath(target, dt, landmarksPx[ids[0]], landmarksPx[ids.at(-1)]); if (!path || path.length < 4) return false;
  const seg = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), refLen = []; let tot = 0;
  for (let k = 1; k < ids.length; k++) { tot += seg(refLandmarks[ids[k - 1]], refLandmarks[ids[k]]); refLen.push(tot); }
  const cum = [0]; for (let k = 1; k < path.length; k++) cum.push(cum[k - 1] + seg(path[k - 1], path[k]));
  for (let k = 1; k < ids.length - 1; k++) { const t = (refLen[k - 1] / tot) * cum.at(-1); let j = 1; while (j < cum.length - 1 && cum[j] < t) j++; const f = (t - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]);
    landmarksPx[ids[k]] = [path[j - 1][0] + (path[j][0] - path[j - 1][0]) * f, path[j - 1][1] + (path[j][1] - path[j - 1][1]) * f]; }
  return true;
}

/** Deterministic polygon repair: a warped polygon can cross itself (a thin tail or shin folded by the spline). At each crossing
 * the ring splits into two loops and the larger-area loop is kept; repeated until simple. Geometry only, no anatomy decision. */
export function untanglePolygon(P) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const area = (Q) => { let s = 0; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };
  let ring = P.map((p) => [...p]), repairs = 0;
  for (let guard = 0; guard < 64; guard++) { let hit = null; const n = ring.length;
    for (let i = 0; i < n && !hit; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; const a = ring[i], b = ring[(i + 1) % n], c = ring[j], d = ring[(j + 1) % n];
      if (o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0) { const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]), t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
        hit = { i, j, x: [Math.round((a[0] + t * (b[0] - a[0])) * 10) / 10, Math.round((a[1] + t * (b[1] - a[1])) * 10) / 10] }; break; } }
    if (!hit) break; repairs++;
    const A = [...ring.slice(0, hit.i + 1), hit.x, ...ring.slice(hit.j + 1)], B = [hit.x, ...ring.slice(hit.i + 1, hit.j + 1)];
    ring = area(A) >= area(B) ? A : B; if (ring.length < 3) return { polygon: P, repairs: -1 }; }
  return { polygon: ring, repairs };
}

/** Reference shopping (labelled, `shop` = how many further ranks): when the best reference's author REFUSES on anatomy evidence only
 * (missing / extra / unexplained), author again from the next-ranked references and return the first that earns its own ADMIT.
 * Facing, wrong-family, no-reference and presence refusals are properties of the painting and are never shopped. The mutation
 * battery must run with the SAME policy (run-mutants --shop), so any extra chance it gives a mutant is measured. */
export function autoAuthorShop(opts) {
  const r0 = autoAuthor({ ...opts, refRank: 0 }); if (r0.verdict === 'ADMIT' || !(opts.shop > 0)) return r0;
  if (r0.reasons.some((r) => /^(facing|wrong-family|no-reference|presence-unmeasured|identity)/.test(r))) return r0;
  const tried = [{ rank: 0, reference: r0.evidence?.bestReference ?? null, reasons: r0.reasons.slice(0, 3) }];
  for (let k = 1; k <= opts.shop; k++) { const rk = autoAuthor({ ...opts, refRank: k }); if (!rk.evidence) break; tried.push({ rank: k, reference: rk.evidence.bestReference, reasons: rk.reasons.slice(0, 3) });
    if (rk.verdict === 'ADMIT') return { ...rk, evidence: { ...rk.evidence, shopped: tried } }; }
  return { ...r0, evidence: r0.evidence ? { ...r0.evidence, shopped: tried } : r0.evidence };
}

/** Author one target from same-family references (and, for the verdict, the other families' references and the mirrored target).
 * `refs`: [{family, subjectId, rgba?, prepared, authoring, h}] ; returns {verdict, reasons, authoring, presence, evidence}. */
export function autoAuthor({ target, mirrored, family, id, refs, materials, habitat, topK = 3, minPartPaint = 0.08, unexplainedFrac = 0.06, ridge = null, skeleton = null, chains = null, nudgeFrac = 0, counter = null, nudgeThinFrac = null, nudgeSkipChains = false, requireCount = true, refRank = 0 }) {
  const same = refs.filter((r) => r.family === family), other = refs.filter((r) => r.family !== family);
  if (!same.length) return { verdict: 'REFUSE', reasons: ['no-reference: no other hand-authored subject of family ' + family], authoring: null };
  const trAll = same.map((r) => transferReference(target, r)).sort((a, b) => a.cost - b.cost), reasons = [];
  // `refRank` > 0: author from the k-th best reference instead (a labelled fallback candidate); facing and family are judged on the
  // painting's best match either way
  if (refRank >= trAll.length) return { verdict: 'REFUSE', reasons: [`no-reference: no reference of rank ${refRank} (${trAll.length} same-family)`], authoring: null };
  const tr = [trAll[refRank], ...trAll.filter((_, k) => k !== refRank)], best = tr[0], judge = trAll[0];
  // facing / family checks on the contour cost alone
  const mirrorBest = Math.min(...same.map((r) => cyclicDtw(r.desc, mirrored.desc).cost));
  if (mirrorBest < judge.cost * 0.85) reasons.push(`facing: the mirrored painting matches ${family} better (${mirrorBest.toFixed(4)} < ${judge.cost.toFixed(4)})`);
  const otherBest = other.length ? other.map((r) => ({ f: r.family, c: cyclicDtw(r.desc, target.desc).cost })).sort((a, b) => a.c - b.c)[0] : null;
  if (otherBest && otherBest.c < judge.cost * 0.7) reasons.push(`wrong-family: ${otherBest.f} matches clearly better (${otherBest.c.toFixed(4)} < ${judge.cost.toFixed(4)})`);
  // landmarks: median over the best K references carrying the joint; contact endpoints snapped onto paint
  const top = tr.slice(0, topK), med = (vals) => { const s = [...vals].sort((a, b) => a - b); return s[(s.length - 1) >> 1]; };
  const landmarksPx = {};
  for (const joint of Object.keys(best.landmarksPx)) { const vals = top.filter((t) => t.landmarksPx[joint]).map((t) => t.landmarksPx[joint]); landmarksPx[joint] = [med(vals.map((p) => p[0])), med(vals.map((p) => p[1]))]; }
  // optional ridge refinement: interior joints climb to the limb's medial ridge (bounded); `ridge.keep` (contact terminals) only snap onto paint
  const dt = ridge ? distanceTransform(target.mask, target.w, target.h) : null, R = ridge ? ridge.radiusFrac * Math.hypot(target.box.w, target.box.h) : 0;
  const rawLandmarks = Object.fromEntries(Object.entries(landmarksPx).map(([k, p]) => [k, [...p]]));
  for (const joint of Object.keys(landmarksPx)) { let p = snapToPaint(target.mask, target.w, target.h, landmarksPx[joint]); if (dt && !ridge.keep.has(joint)) p = climbToRidge(dt, target.w, target.h, p, R); landmarksPx[joint] = p.map((v) => Math.round(v * 10) / 10); }
  // optional chain refinement: each contact chain's knee/end placed along the painted leg's ridge path (reference bone fractions)
  const chainLog = []; if (chains?.length) { const dtc = dt ?? distanceTransform(target.mask, target.w, target.h);
    const diagT = Math.hypot(target.box.w, target.box.h), snapOf = (j) => (j && rawLandmarks[j] && landmarksPx[j] ? +(Math.hypot(rawLandmarks[j][0] - landmarksPx[j][0], rawLandmarks[j][1] - landmarksPx[j][1]) / diagT).toFixed(4) : null);
    for (const ch of chains) { const snap = { terminal: snapOf(ch.terminal), end: snapOf(ch.end) }; const ok = refineChain(target, dtc, landmarksPx, best.ref.authoring.landmarksPx, ch); chainLog.push({ chain: ch.id, refined: ok, snap }); }
    for (const j of Object.keys(landmarksPx)) landmarksPx[j] = landmarksPx[j].map((v) => Math.round(v * 10) / 10); }
  if (skeleton) return skeletonAuthor({ target, best, top, landmarksPx, rawLandmarks, graph: skeleton.graph, convention: learnConvention(same), reasons, family, id, habitat, materials, mirrorBest, otherBest, tr });
  let parts = best.parts.map((p) => ({ ...p, polygonPx: p.polygonPx.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) }));
  // v3: the INDEPENDENT counter's inventory admission, on the UNNUDGED transfer (counting stays strict while placement may relax)
  let inventory = null; if (counter) { const tc = countOf(target), rc = countOf(best.ref);
    inventory = inventoryCheck(tc, rc, inventoryOf(best.ref), rc.detached.length, parts, { remainderPart: best.ref.authoring.remainderPart, sameFamilyCounts: same.map((r) => countOf(r)), ...(counter.options ?? {}) });
    reasons.push(...inventory.reasons);
    inventory = { ...inventory, target: { appendages: tc.appendages.map(({ k, frac, class: c, attach }) => ({ k, frac, class: c, attach })), detached: tc.detached, byClass: tc.byClass, ground: tc.ground.length }, reference: { subject: best.ref.subjectId, byClass: rc.byClass, detached: rc.detached.length } }; }
  // optional bounded nudge: each non-remainder part may translate within ±nudgeFrac of the diagonal to sit on its painted anatomy
  const nudged = []; if (nudgeFrac > 0) { const Rn = nudgeFrac * Math.hypot(target.box.w, target.box.h), stepN = Rn / 3;
    // contact-chain parts (legs) stay where the transfer put them: their paint coverage is the erased-limb evidence
    const chainJoints = new Set(nudgeSkipChains ? (chains ?? []).flatMap((c) => [c.hip, c.knee, c.end, c.terminal].filter(Boolean)) : []);
    const diagArea = target.box.w * target.box.h; parts = parts.map((p) => { if (p.id === best.ref.authoring.remainderPart || p.joint === 'root') return p; if (nudgeThinFrac !== null && polyArea(p.polygonPx) > nudgeThinFrac * diagArea) return p; if (chainJoints.has(p.joint)) return p; const base = paintCoverage(target.mask, target.w, target.h, p.polygonPx); let bestC = base, bd = [0, 0];
      for (let dy = -Rn; dy <= Rn + 1e-9; dy += stepN) for (let dx = -Rn; dx <= Rn + 1e-9; dx += stepN) { if (!dx && !dy) continue; const c = paintCoverage(target.mask, target.w, target.h, p.polygonPx.map(([x, y]) => [x + dx, y + dy])); if (c > bestC + 0.05) { bestC = c; bd = [dx, dy]; } }
      if (bd[0] || bd[1]) { nudged.push({ id: p.id, dx: Math.round(bd[0]), dy: Math.round(bd[1]), from: +base.toFixed(2), to: +bestC.toFixed(2) }); return { ...p, polygonPx: p.polygonPx.map(([x, y]) => [Math.round((x + bd[0]) * 10) / 10, Math.round((y + bd[1]) * 10) / 10]) }; }
      return p; }); }
  // canvas clamp (geometry only): the spline can carry a vertex past the canvas edge, where there is no paint; intake refuses a
  // polygon outside the normalised [0, 1] canvas, so vertices are clamped to it before the untangle
  const clamped = []; parts = parts.map((p) => { let n = 0; const poly = p.polygonPx.map(([x, y]) => { const cx = Math.min(target.w, Math.max(0, x)), cy = Math.min(target.h, Math.max(0, y)); if (cx !== x || cy !== y) n++; return [cx, cy]; }); if (n) clamped.push({ id: p.id, vertices: n }); return n ? { ...p, polygonPx: poly } : p; });
  const untangled = []; parts = parts.map((p) => { const u = untanglePolygon(p.polygonPx); if (u.repairs > 0) { untangled.push({ id: p.id, repairs: u.repairs }); return { ...p, polygonPx: u.polygon }; } return p; });
  // evidence from visible paint: every part must sit on paint; no large unclaimed painted region away from the body
  const coverage = parts.map((p) => ({ id: p.id, joint: p.joint, paint: paintCoverage(target.mask, target.w, target.h, p.polygonPx), area: polyArea(p.polygonPx) }));
  const refCoverage = new Map(best.ref.partPaint.map((c) => [c.id, c.paint]));
  const missing = coverage.filter((c) => c.id !== best.ref.authoring.remainderPart && c.paint < Math.max(minPartPaint, 0.35 * (refCoverage.get(c.id) ?? 0)));
  for (const c of missing) reasons.push(`missing-anatomy: part ${c.id} (${c.joint}) covers ${(c.paint * 100).toFixed(0)}% paint (reference ${((refCoverage.get(c.id) ?? 0) * 100).toFixed(0)}%)`);
  let paint = 0, unclaimed = 0; const nonRemainder = parts.filter((p) => p.id !== best.ref.authoring.remainderPart);
  const cx = target.box.x0 + target.box.w / 2, cy = target.box.y0 + target.box.h / 2;
  for (let y = 0; y < target.h; y += 6) for (let x = 0; x < target.w; x += 6) { if (!target.mask[y * target.w + x]) continue; paint++;
    if (!nonRemainder.some((p) => inside(x + 0.5, y + 0.5, p.polygonPx))) { const far = Math.hypot((x - cx) / target.box.w, (y - cy) / target.box.h) > 0.28; if (far) unclaimed++; } }
  const refUnclaimed = best.ref.unclaimedFrac ?? 0;
  if (unclaimed / Math.max(1, paint) > Math.max(unexplainedFrac, refUnclaimed + 0.04)) reasons.push(`unexplained-anatomy: ${(100 * unclaimed / paint).toFixed(1)}% of the paint lies away from the body and in no part (reference ${(100 * refUnclaimed).toFixed(1)}%)`);
  // presence is a measured claim (Codex G1 review): all-visible lists are emitted only when the independent visible-appendage
  // counter ran on this painting and resolved without a refusal; without it the author refuses rather than assert maximum anatomy
  if (requireCount && !inventory) reasons.push('presence-unmeasured: no independent visible-appendage count; an all-visible presence is never asserted without one');
  const authoring = { id, family, ...(habitat ? { habitat } : {}), landmarksPx, groundLineY: Math.min(0.999, Math.max(0.05, best.groundLineY)), materials, remainderPart: best.ref.authoring.remainderPart, parts,
    coverage: { declarations: `G1 automatic authoring (automatic transfer, not observed): landmarks transferred from ${top.length === 1 ? 'the single best registered reference' : `the median of ${top.length} registered references`}; parts from ${best.ref.subjectId}. No hidden/folded inference; nothing declared absent; visible counts measured by the limb counter.`, sourceFacing: 'right', visualAcceptance: 'none — automatic' } };
  return { verdict: reasons.length ? 'REFUSE' : 'ADMIT', reasons, authoring, presence: { schema: 'cf.anatomy-presence/v2', absent: [], hidden: [], folded: [] },
    evidence: { schema: AUTO_AUTHOR_SCHEMA, chains: chainLog, nudged, clamped, untangled, inventory, detour: { target: +best.detourTarget.toFixed(4), ref: +best.detourRef.toFixed(4) }, bestReference: best.ref.subjectId, refRank, costs: trAll.map((t) => ({ ref: t.ref.subjectId, cost: +t.cost.toFixed(5) })), mirrorBest: +mirrorBest.toFixed(5), otherFamilyBest: otherBest ? { family: otherBest.f, cost: +otherBest.c.toFixed(5) } : null, coverage, unclaimedFrac: +(unclaimed / Math.max(1, paint)).toFixed(4) } };
}

/** Skeleton mode: parts grown from the TARGET's own paint by nearest bone of the placed skeleton, traced to polygons; the verdict is
 * bone-on-paint (on the UNSNAPPED transferred skeleton: an erased limb's bones hang over empty canvas), part share against the
 * reference's own hand skeleton, and paint far from every bone. */
function skeletonAuthor({ target, best, top, landmarksPx, rawLandmarks, graph, convention, reasons, family, id, habitat, materials, mirrorBest, otherBest, tr }) {
  const spec = best.ref.authoring.parts.filter((p) => landmarksPx[p.joint]), remainder = best.ref.authoring.remainderPart;
  const diag = Math.hypot(target.box.w, target.box.h), segs = boneSegments(spec, landmarksPx, graph, convention), L = labelByBones(target, segs, 2);
  const total = L.lab.reduce((n, v) => n + (v >= 0 ? 1 : 0), 0), share = spec.map((_, k) => { let n = 0; for (let i = 0; i < L.lab.length; i++) if (L.lab[i] === k) n++; return n / Math.max(1, total); });
  const isParent = [...convention.values()][0] === 'parent', refShare = (isParent ? best.ref.skeleton?.partShareParent : best.ref.skeleton?.partShare) ?? {};
  const parts = [];
  spec.forEach((p, k) => {
    if (p.joint === 'root') { const [x, y] = landmarksPx.root; parts.push({ id: p.id, joint: p.joint, layer: p.layer, polygonPx: [[x - 6, y - 6], [x + 6, y - 6], [x + 6, y + 6], [x - 6, y + 6]] }); return; }
    const poly = regionPolygon(L, k); if (poly) parts.push({ id: p.id, joint: p.joint, layer: p.layer, polygonPx: poly });
  });
  if (!parts.some((p) => p.id === remainder)) { const r = spec.find((p) => p.id === remainder); if (r) { const [x, y] = landmarksPx[r.joint]; parts.push({ id: r.id, joint: r.joint, layer: r.layer, polygonPx: [[x - 4, y - 4], [x + 4, y - 4], [x + 4, y + 4], [x - 4, y + 4]] }); } }
  const rawSegs = boneSegments(spec, rawLandmarks, graph, convention, { extendTerminals: false }), onPaint = boneOnPaint(target, rawSegs, Math.max(2, Math.round(0.02 * diag)));
  const evidence = spec.map((p, k) => ({ id: p.id, joint: p.joint, boneOnPaint: +onPaint[k].toFixed(3), share: +share[k].toFixed(4), refShare: +(refShare[p.id] ?? 0).toFixed(4) }));
  for (const e of evidence) { if (e.joint === 'root' || e.id === remainder) continue;
    if (e.boneOnPaint < 0.5) reasons.push(`missing-anatomy: bone of ${e.id} (${e.joint}) lies ${Math.round(100 * (1 - e.boneOnPaint))}% off the paint`);
    else if (e.refShare > 0.004 && e.share < 0.2 * e.refShare) reasons.push(`missing-anatomy: part ${e.id} owns ${(100 * e.share).toFixed(2)}% of the paint (reference ${(100 * e.refShare).toFixed(2)}%)`); }
  const far = farFromBones(L, diag, 0.1), refFar = (isParent ? best.ref.skeleton?.farParent : best.ref.skeleton?.far) ?? 0;
  if (far > refFar + 0.03) reasons.push(`unexplained-anatomy: ${(100 * far).toFixed(1)}% of the paint lies far from every bone (reference ${(100 * refFar).toFixed(1)}%)`);
  reasons.push('presence-unmeasured: the skeleton mode has no independent visible-appendage count; it is a diagnostic, never an admission');
  const authoring = { id, family, ...(habitat ? { habitat } : {}), landmarksPx, groundLineY: Math.min(0.999, Math.max(0.05, best.groundLineY)), materials, remainderPart: remainder, parts,
    coverage: { declarations: `G1 automatic authoring (skeleton parts): landmarks = median of ${top.length} registered references; parts grown from this painting by nearest bone; part inventory from ${best.ref.subjectId}. No hidden/folded inference.`, sourceFacing: 'right', visualAcceptance: 'none — automatic' } };
  return { verdict: reasons.length ? 'REFUSE' : 'ADMIT', reasons, authoring, presence: { schema: 'cf.anatomy-presence/v2', absent: [], hidden: [], folded: [] },
    evidence: { schema: AUTO_AUTHOR_SCHEMA, mode: 'skeleton', convention: Object.fromEntries(convention), bestReference: best.ref.subjectId, costs: tr.map((t) => ({ ref: t.ref.subjectId, cost: +t.cost.toFixed(5) })), mirrorBest: +mirrorBest.toFixed(5), otherFamilyBest: otherBest ? { family: otherBest.f, cost: +otherBest.c.toFixed(5) } : null, bones: evidence, farFromBones: +far.toFixed(4) } };
}

/** Reference-side statistics (their own authoring on their own paint) so the verdict compares like with like. */
export function referenceStats(prepared, authoring) {
  const partPaint = authoring.parts.map((p) => ({ id: p.id, paint: paintCoverage(prepared.mask, prepared.w, prepared.h, p.polygonPx) }));
  const nonRemainder = authoring.parts.filter((p) => p.id !== authoring.remainderPart), cx = prepared.box.x0 + prepared.box.w / 2, cy = prepared.box.y0 + prepared.box.h / 2;
  let paint = 0, unclaimed = 0; for (let y = 0; y < prepared.h; y += 6) for (let x = 0; x < prepared.w; x += 6) { if (!prepared.mask[y * prepared.w + x]) continue; paint++; if (!nonRemainder.some((p) => inside(x + 0.5, y + 0.5, p.polygonPx)) && Math.hypot((x - cx) / prepared.box.w, (y - cy) / prepared.box.h) > 0.28) unclaimed++; }
  return { partPaint, unclaimedFrac: unclaimed / Math.max(1, paint) };
}
