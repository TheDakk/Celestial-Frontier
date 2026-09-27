/** Serpent strip author (G1, Claude 2026-09-27).
 * The general author warps a reference's part polygons with a contour spline; for a THIN S-curve snake painted against THICK straight
 * references that warp leaves most polygons over background (every G2 snake refused). The hand serpent packets are built differently:
 * each body segment is a full-height VERTICAL STRIP, landmarks sit on the observed centreline, head/jaw are small polygons. That works
 * because a side-profile snake is x-monotone (one paint run per column). This author measures the target's own centreline and
 * thickness per column and transfers the reference's cuts, landmarks and head/jaw polygons by fraction of body length and by offset in
 * local thicknesses from the centreline. It never invents paint and refuses anything that is not a single, continuous, x-monotone,
 * elongated, right-facing, tapering serpent. Pure function of pixels + reference authoring. */
export const SERPENT_DEFAULTS = Object.freeze({ alpha: 128, minRun: 3, mainShare: 0.97, dominantShare: 0.97, maxGapFrac: 0.01, minElongation: 8,
  endFrac: 0.08, headTailRatio: 1.15, tailTipFrac: 0.03, tailTaper: 0.6, snoutFrac: 0.015, maxSnoutRatio: 0.72, smooth: 15, minPartShareOfRef: 0.25, maxUnowned: 0.01 });

/** Column profile of the painted body: centreline cy[x], thickness th[x] of the dominant run, plus the refusal measures. */
export function serpentProfile(rgba, w, h, o = SERPENT_DEFAULTS) {
  const mask = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) mask[i] = rgba[i * 4 + 3] >= o.alpha ? 1 : 0;
  /* 8-connected components: the body must be one piece */
  const lab = new Int32Array(w * h).fill(-1), sizes = []; let total = 0;
  for (let s = 0; s < w * h; s++) { if (!mask[s] || lab[s] >= 0) continue; const st = [s], id = sizes.length; lab[s] = id; let n = 0;
    while (st.length) { const q = st.pop(); n++; const x = q % w, y = (q / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const r = Y * w + X; if (mask[r] && lab[r] < 0) { lab[r] = id; st.push(r); } } }
    sizes.push(n); total += n; }
  if (!total) return { ok: false, reasons: ['no paint'] };
  const main = sizes.indexOf(Math.max(...sizes)), mainShare = sizes[main] / total;
  const cy = new Float64Array(w).fill(NaN), th = new Float64Array(w).fill(0); let xmin = w, xmax = -1, dom = 0, colPaint = 0;
  for (let x = 0; x < w; x++) { const runs = []; let top = -1;
    for (let y = 0; y <= h; y++) { const on = y < h && lab[y * w + x] === main; if (on && top < 0) top = y; else if (!on && top >= 0) { runs.push([top, y - 1]); top = -1; } }
    const big = runs.filter(([a, b]) => b - a + 1 >= o.minRun); if (!big.length) continue;
    const best = big.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a)), n = big.reduce((s, [a, b]) => s + b - a + 1, 0);
    cy[x] = (best[0] + best[1]) / 2; th[x] = best[1] - best[0] + 1; dom += th[x]; colPaint += n; xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
  /* Codex C64: a body with no measurable column (every run shorter than minRun) must refuse explicitly, not flow on as NaN */
  if (xmax < xmin) return { ok: false, reasons: ['no measurable body: no column holds a paint run of at least ' + o.minRun + ' px'], measures: { mainShare: +mainShare.toFixed(4), paint: total } };
  const ext = xmax - xmin + 1; let gaps = 0;
  /* a hair-thin tail tip fading under the alpha threshold is anatomy, not a break: gaps count only beyond the outer tail-tip span */
  for (let x = xmin + Math.round(ext * o.tailTipFrac); x <= xmax; x++) if (!(th[x] > 0)) gaps++;
  /* fill gap columns by interpolation (only for lookups; gaps themselves refuse above the tolerance), then smooth */
  let last = xmin; for (let x = xmin + 1; x <= xmax; x++) if (th[x] > 0) { for (let k = last + 1; k < x; k++) { const t = (k - last) / (x - last); cy[k] = cy[last] + t * (cy[x] - cy[last]); th[k] = th[last] + t * (th[x] - th[last]); } last = x; }
  const sm = (a) => { const out = new Float64Array(w).fill(NaN); for (let x = xmin; x <= xmax; x++) { let s = 0, n = 0; for (let k = Math.max(xmin, x - o.smooth); k <= Math.min(xmax, x + o.smooth); k++) { s += a[k]; n++; } out[x] = s / n; } return out; };
  const scy = sm(cy), sth = sm(th), sorted = [...th.slice(xmin, xmax + 1)].sort((a, b) => a - b), median = sorted[sorted.length >> 1];
  const mean = (a, b) => { let s = 0; for (let x = a; x <= b; x++) s += th[x]; return s / (b - a + 1); }, e = Math.max(1, Math.round(ext * o.endFrac)), tip = Math.max(1, Math.round(ext * o.tailTipFrac));
  /* snout: a real head tapers to a snout over its last ~1.5 % (raw column thickness); a cut-off head ends blunt.
   * Calibrated 2026-09-27 on 11 positives (0.27-0.59) against their erased-head mutants (0.85-1.12). */
  const rawTh = (x) => { let n = 0; for (let y = 0; y < h; y++) if (lab[y * w + x] === main) n++; return n; }, sn = Math.max(2, Math.round(ext * o.snoutFrac));
  let snoutSum = 0, endSum = 0; for (let x = xmax - sn + 1; x <= xmax; x++) snoutSum += rawTh(x); for (let x = xmax - e + 1; x <= xmax; x++) endSum += rawTh(x);
  const snoutRatio = +((snoutSum / sn) / Math.max(1, endSum / e)).toFixed(3);
  const m = { snoutRatio, mainShare: +mainShare.toFixed(4), dominantShare: +(dom / colPaint).toFixed(4), gapFrac: +(gaps / ext).toFixed(4), elongation: +(ext / median).toFixed(2),
    headEnd: +mean(xmax - e + 1, xmax).toFixed(1), tailEnd: +mean(xmin, xmin + e - 1).toFixed(1), tailTip: +mean(xmin, xmin + tip - 1).toFixed(1), median, xmin, xmax, ext, paint: total };
  const reasons = [];
  for (const [k, v] of Object.entries(m)) if (typeof v === 'number' && !Number.isFinite(v)) reasons.push(`non-finite measure: ${k}`);
  if (mainShare < o.mainShare) reasons.push(`detached paint: the largest piece holds ${(mainShare * 100).toFixed(1)} % (need ${o.mainShare * 100} %)`);
  if (m.dominantShare < o.dominantShare) reasons.push(`not x-monotone: the dominant column run holds ${(m.dominantShare * 100).toFixed(1)} % (coil or overlap; vertical strips cannot separate it)`);
  if (m.gapFrac > o.maxGapFrac) reasons.push(`body not continuous: ${(m.gapFrac * 100).toFixed(1)} % of the length has no paint`);
  if (m.elongation < o.minElongation) reasons.push(`wrong family: length/thickness ${m.elongation} < ${o.minElongation}`);
  if (m.headEnd < o.headTailRatio * m.tailEnd) reasons.push(`facing: the right (head) end is not thicker than the left (tail) end (${m.headEnd} vs ${m.tailEnd})`);
  if (snoutRatio > o.maxSnoutRatio) reasons.push(`head end blunt: snout ratio ${snoutRatio} > ${o.maxSnoutRatio} (no tapering snout; a cut-off head?)`);
  if (m.tailTip > o.tailTaper * median) reasons.push(`tail not tapered: tip ${m.tailTip}px vs median ${median}px (truncated tail?)`);
  return { ok: !reasons.length, reasons, measures: m, cy: scy, th: sth, lab, main };
}

const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };

/** Paint share owned by each polygon (first polygon wins, as in ownerRaster) and the unowned share, over the profile's main body. */
function ownership(parts, P, w, h) {
  const own = new Int32Array(w * h).fill(-1); parts.forEach((p, k) => { const xs = p.polygonPx.map((q) => q[0]), ys = p.polygonPx.map((q) => q[1]);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(h - 1, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(w - 1, Math.ceil(Math.max(...xs))); x++) { const i = y * w + x; if (own[i] < 0 && inside(x + 0.5, y + 0.5, p.polygonPx)) own[i] = k; } });
  const n = new Array(parts.length).fill(0); let un = 0, paint = 0; for (let i = 0; i < w * h; i++) if (P.lab[i] === P.main) { paint++; if (own[i] < 0) un++; else n[own[i]]++; }
  return { frac: n.map((v) => v / paint), unowned: un / paint };
}

/** Transfer a serpent reference onto the target. refs: [{id, name, authoring, rgba, w, h}] (same family, other species).
 * Returns {verdict, reasons, authoring, presence, evidence}. */
export function serpentAuthor({ rgba, w, h, id, refs, materials, habitat, o = SERPENT_DEFAULTS }) {
  const T = serpentProfile(rgba, w, h, o), evidence = { author: 'serpent-strips/v1', target: T.measures };
  if (!T.ok) return { verdict: 'REFUSE', reasons: T.reasons, evidence };
  /* reference: same serpent template (head, jaw, root, seg0..seg9), closest thickness ratio */
  const want = ['head', 'jaw', 'root', ...Array.from({ length: 10 }, (_, k) => 'seg' + k)];
  const cands = refs.map((r) => ({ r, P: serpentProfile(r.rgba, r.w, r.h, o) })).filter(({ r, P }) => P.ok && want.every((j) => r.authoring.parts.some((p) => p.joint === j) && r.authoring.landmarksPx[j]));
  if (!cands.length) return { verdict: 'REFUSE', reasons: ['no admissible serpent reference'], evidence };
  const ratio = T.measures.median / T.measures.ext; cands.sort((a, b) => Math.abs(a.P.measures.median / a.P.measures.ext - ratio) - Math.abs(b.P.measures.median / b.P.measures.ext - ratio));
  const { r: ref, P: R } = cands[0]; evidence.bestReference = ref.id; evidence.reference = R.measures; evidence.candidates = cands.map(({ r, P }) => ({ ref: r.id, ratio: +(P.measures.median / P.measures.ext).toFixed(4) }));
  const RW = ref.w, RH = ref.h, rx = (x) => Math.min(R.measures.xmax, Math.max(R.measures.xmin, Math.round(x))), tx = (x) => Math.min(T.measures.xmax, Math.max(T.measures.xmin, Math.round(x)));
  const mapX = (x) => (x <= 0 ? 0 : x >= RW ? w : T.measures.xmin + ((x - R.measures.xmin) / R.measures.ext) * T.measures.ext);
  const map = ([x, y]) => { const X = mapX(x); if (y <= 0) return [X, 0]; if (y >= RH) return [X, h];
    const kx = rx(x), dy = (y - R.cy[kx]) / Math.max(1, R.th[kx]), kt = tx(X); return [X, Math.min(h, Math.max(0, T.cy[kt] + dy * T.th[kt]))]; };
  const r1 = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  const landmarksPx = Object.fromEntries(Object.entries(ref.authoring.landmarksPx).map(([k, p]) => [k, r1(map(p))]));
  const parts = ref.authoring.parts.map((p) => ({ ...p, polygonPx: p.polygonPx.map((q) => r1(map(q))) }));
  /* ground line: keep the reference's gap between its lowest paint and its ground line */
  const lowest = (P, W) => { let b = 0; for (let x = P.measures.xmin; x <= P.measures.xmax; x++) b = Math.max(b, P.cy[x] + P.th[x] / 2); return b; };
  const groundLineY = +Math.min(0.99, ref.authoring.groundLineY + (lowest(T) - lowest(R)) / h).toFixed(4);
  /* ownership: each part must own at least a quarter of the paint share the SAME part owns in the reference (tiny marker parts
   * stay tiny); almost no paint may be unowned */
  const T_own = ownership(parts, T, w, h), R_own = ownership(ref.authoring.parts, R, RW, RH), reasons = [];
  const coverage = parts.map((p, k) => ({ id: p.id, joint: p.joint, paintFrac: +T_own.frac[k].toFixed(4), refFrac: +R_own.frac[k].toFixed(4) }));
  for (const c of coverage) if (c.paintFrac < o.minPartShareOfRef * c.refFrac) reasons.push(`missing-anatomy: part ${c.id} owns ${(c.paintFrac * 100).toFixed(2)} % of the paint (reference ${(c.refFrac * 100).toFixed(2)} %)`);
  if (T_own.unowned > o.maxUnowned) reasons.push(`unowned paint ${(T_own.unowned * 100).toFixed(1)} %`);
  evidence.coverage = coverage; evidence.unownedFrac = +T_own.unowned.toFixed(4);
  const authoring = { id, family: 'serpent', landmarksPx, groundLineY, materials, ...(habitat ? { habitat } : {}), remainderPart: ref.authoring.remainderPart, parts,
    coverage: { declarations: `Automatic serpent strip transfer from ${ref.id}: vertical segment cuts, head/jaw polygons and centreline landmarks placed by fraction of the measured body length and by local-thickness offset from the measured centreline. No hidden, absent or folded contract groups (a continuous x-monotone limbless body is measured).`, visualAcceptance: 'pending (automatic; no visual review)' } };
  const presence = { schema: 'cf.anatomy-presence/v2', absent: [], hidden: [], folded: [] };
  return { verdict: reasons.length ? 'REFUSE' : 'ADMIT', reasons, authoring, presence, evidence };
}
