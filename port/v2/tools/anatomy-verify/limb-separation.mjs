/** G1 v9 — NEAR/FAR LIMB SEPARATION evidence (audits/G1_AUTO_AUTHOR_20260926/README.md). In a strict side profile the near and far
 * limb of a pair overlap into ONE silhouette blob, so the paint-only counter cannot tell one limb from two. This reads the painting's
 * own interior: two separately painted limbs meet along an internal image edge (the far limb is drawn behind, in its own shading),
 * while a single limb has no such edge. For a limb pair it rasterises each chain's authored part polygons (first polygon wins, the
 * intake's ownership order), finds the pixels where the two regions touch INSIDE paint, and measures the luminance gradient there
 * against the painting's ordinary interior texture. Deterministic; no creature or family special cases. */
const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
/** Owner map: index of the first part polygon containing each pixel (-1 = none). */
export function ownerRaster(parts, w, h) {
  const own = new Int32Array(w * h).fill(-1);
  parts.forEach((p, k) => { const xs = p.polygonPx.map((q) => q[0]), ys = p.polygonPx.map((q) => q[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(w - 1, Math.ceil(Math.max(...xs))), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; if (own[i] < 0 && inside(x + 0.5, y + 0.5, p.polygonPx)) own[i] = k; } });
  return own;
}
/** Sobel luminance gradient magnitude. */
export function gradientMagnitude(rgba, w, h) {
  const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = 0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2];
  const g = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
    const gx = L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1], gy = L[i + w - 1] + 2 * L[i + w] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - w] - L[i - w + 1];
    g[i] = Math.hypot(gx, gy); }
  return g;
}
/** Separation evidence for each limb pair [chainA, chainB] (chains from family-contracts: {id, hip, knee, end, terminal}).
 * Returns per pair: contact (pixels where A touches B inside paint, both ≥ `margin` px from the silhouette), contactPerLength
 * (contact / √(area of A)), and edgeRatio (mean of the max gradient within `radius` px of each contact pixel ÷ the median gradient
 * over the painting's interior). */
export function limbSeparation({ rgba, mask, w, h, parts, chains, pairs, radius = 3, margin = 2 }) {
  const own = ownerRaster(parts, w, h), grad = gradientMagnitude(rgba, w, h);
  const chainOfPart = parts.map((p) => chains.find((c) => [c.knee, c.end, c.terminal].includes(p.joint))?.id ?? null); // the hip is shared body
  // distance-to-silhouette ≥ margin, by erosion
  let core = mask.slice(); for (let r = 0; r < margin; r++) { const n = core.slice(); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (core[i] && (!core[i - 1] || !core[i + 1] || !core[i - w] || !core[i + w])) n[i] = 0; } core = n; }
  const interior = []; for (let i = 0; i < w * h; i += 7) if (core[i]) interior.push(grad[i]); interior.sort((a, b) => a - b);
  const base = Math.max(1, interior[interior.length >> 1] ?? 1);
  const chainAt = (i) => (own[i] < 0 ? null : chainOfPart[own[i]]);
  return pairs.map(([a, b]) => {
    let contact = 0, sum = 0, areaA = 0;
    for (let y = radius; y < h - radius; y++) for (let x = radius; x < w - radius; x++) { const i = y * w + x; if (chainAt(i) !== a || !mask[i]) continue; areaA++;
      if (!core[i]) continue; const nb = [i - 1, i + 1, i - w, i + w]; if (!nb.some((j) => core[j] && chainAt(j) === b)) continue;
      contact++; let m = 0; for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) m = Math.max(m, grad[i + dy * w + dx]); sum += m; }
    return { pair: `${a}+${b}`, contact, areaA, contactPerLength: +(contact / Math.sqrt(Math.max(1, areaA))).toFixed(3), edgeRatio: contact ? +((sum / contact) / base).toFixed(3) : 0 };
  });
}
/** Near/far limb pairs of a family: chains that differ only by Near/Far in their id (foreNear/foreFar, hindNear/hindFar, legNear/legFar …). */
export function nearFarPairs(chains) {
  const out = []; for (const c of chains) { if (!/Near/.test(c.id)) continue; const far = chains.find((d) => d.id === c.id.replace('Near', 'Far')); if (far) out.push([c.id, far.id]); } return out;
}
