/** G1 v3 — INDEPENDENT VISIBLE-APPENDAGE COUNTER and the inventory admission built on it (Generated Creature Pipeline,
 * audits/G1_AUTO_AUTHOR_20260926/README.md). The counter reads ONLY the painting's own paint:
 * - significant DETACHED components (paint islands apart from the main body);
 * - APPENDAGES: every protrusion of the main component outside a body core (the largest component that survives an erosion
 *   scaled to the silhouette's minor extent, grown back by the same radius), with its attachment point, extent, direction and a
 *   geometric class (limb-down / rear / front / top / other).
 * It never reads a template's expected count and has no creature or family special cases. Hidden and folded anatomy are declared
 * classes elsewhere and are never inferred here.
 *
 * The admission (`inventoryCheck`) compares the TARGET's counted appendages with the counted appendages of the transferred
 * REFERENCE's own painting, whose hand polygons name each counted appendage's owner parts (the reference's part inventory):
 * - missing: a reference appendage whose owner parts, mapped onto the target, do not land on a target appendage;
 * - merged: two reference appendages land on ONE target appendage that is too small to be both (an erased limb whose mapped
 *   parts collapse onto its neighbour);
 * - extra: a target appendage that no mapped part covers (a duplicated or extra limb);
 * - extra-detached: more significant detached paint islands than the reference has.
 * Counting is evaluated on the UNNUDGED transfer, so part placement may relax without weakening it. Deterministic integer/float work. */
import {erodeAlpha} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {distanceTransform} from './thickness.mjs';

export const LIMB_COUNTER_SCHEMA = 'cf.g1-limb-counter/v1';
export const COUNTER_DEFAULTS = Object.freeze({ longest: 420, coreRatio: 0.55, minAppendageFrac: 0.004, minDetachedFrac: 0.01, groundBand: 0.06, minContactFrac: 0.015 });

function components(m, W, H) {
  const lab = new Int32Array(W * H).fill(-1), stack = new Int32Array(W * H), parts = [];
  for (let s = 0; s < W * H; s++) { if (!m[s] || lab[s] >= 0) continue; const id = parts.length; let top = 0, n = 0, x0 = W, x1 = -1, y0 = H, y1 = -1, sx = 0, sy = 0; stack[top++] = s; lab[s] = id;
    while (top) { const i = stack[--top], x = i % W, y = (i - x) / W; n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (m[j] && lab[j] < 0) { lab[j] = id; stack[top++] = j; } } }
    parts.push({ id, pixels: n, box: { x0, y0, x1, y1 }, cx: sx / n, cy: sy / n }); }
  return { lab, parts };
}
/** Downscale a full-resolution 0/1 mask to a working grid whose longest side is `longest` (a cell is paint when any source pixel is). */
export function workingMask(mask, w, h, longest = COUNTER_DEFAULTS.longest) {
  const s = Math.max(w, h) / longest, W = Math.max(1, Math.round(w / s)), H = Math.max(1, Math.round(h / s)), g = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let any = 0; const ya = Math.floor(y * s), yb = Math.min(h, Math.floor((y + 1) * s)), xa = Math.floor(x * s), xb = Math.min(w, Math.floor((x + 1) * s));
    for (let yy = ya; yy < Math.max(ya + 1, yb) && !any; yy++) for (let xx = xa; xx < Math.max(xa + 1, xb); xx++) if (mask[yy * w + xx]) { any = 1; break; } g[y * W + x] = any; }
  return { g, W, H, scale: s };
}

/** Count the visible appendages of one painting (full-resolution 0/1 mask). Returns working-grid labels so callers can intersect. */
export function countVisibleAnatomy(mask, w, h, options = {}) {
  const o = { ...COUNTER_DEFAULTS, ...options }, { g, W, H, scale } = workingMask(mask, w, h, o.longest);
  let paint = 0; for (let i = 0; i < W * H; i++) paint += g[i];
  if (!paint) throw Error('limb counter: empty painting');
  const comps = components(g, W, H), main = comps.parts.reduce((a, b) => (b.pixels > a.pixels ? b : a));
  const detached = comps.parts.filter((p) => p !== main && p.pixels >= o.minDetachedFrac * paint).map((p) => ({ frac: +(p.pixels / paint).toFixed(4), box: p.box, cx: +p.cx.toFixed(1), cy: +p.cy.toFixed(1) }));
  // body core: erode the main component by a radius scaled to its minor extent, keep the largest surviving component, grow it back
  const mainMask = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) mainMask[i] = comps.lab[i] === main.id ? 255 : 0;
  // the erosion radius is a fraction of the trunk's own half-thickness (max distance to background): limbs thinner than that fall away
  const dt = distanceTransform(Uint8Array.from(mainMask, (v) => (v ? 1 : 0)), W, H); let maxDt = 0; for (let i = 0; i < W * H; i++) if (dt[i] > maxDt) maxDt = dt[i];
  let r = Math.max(1, Math.min(32, Math.round(maxDt * o.coreRatio))), eroded = erodeAlpha(mainMask, W, H, r), coreC = components(Uint8Array.from(eroded, (v) => (v ? 1 : 0)), W, H);
  while (!coreC.parts.length && r > 1) { r = Math.max(1, r >> 1); eroded = erodeAlpha(mainMask, W, H, r); coreC = components(Uint8Array.from(eroded, (v) => (v ? 1 : 0)), W, H); }
  if (!coreC.parts.length) throw Error('limb counter: no body core at radius ' + r);
  const core = coreC.parts.reduce((a, b) => (b.pixels > a.pixels ? b : a)), coreInv = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) coreInv[i] = coreC.lab[i] === core.id ? 0 : 255;
  const grownInv = erodeAlpha(coreInv, W, H, r), body = new Uint8Array(W * H), rest = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { const inBody = mainMask[i] && !grownInv[i]; body[i] = inBody ? 1 : 0; rest[i] = mainMask[i] && !inBody ? 1 : 0; }
  let bx0 = W, by0 = H, bx1 = -1, by1 = -1; for (let i = 0; i < W * H; i++) if (body[i]) { const x = i % W, y = (i - x) / W; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  const bodyBox = { x0: bx0, y0: by0, x1: bx1, y1: by1 }, bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;
  const app = components(rest, W, H), appendages = [], label = new Int32Array(W * H).fill(-1);
  for (const p of app.parts) { if (p.pixels < o.minAppendageFrac * paint) continue;
    let touch = 0, ax = 0, ay = 0;
    for (let y = p.box.y0; y <= p.box.y1; y++) for (let x = p.box.x0; x <= p.box.x1; x++) { const i = y * W + x; if (app.lab[i] !== p.id) continue;
      let t = false; for (let dy = -1; dy <= 1 && !t; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && body[Y * W + X]) { t = true; break; } }
      if (t) { touch++; ax += x; ay += y; } }
    if (!touch) continue;
    ax /= touch; ay /= touch; const k = appendages.length;
    for (let y = p.box.y0; y <= p.box.y1; y++) for (let x = p.box.x0; x <= p.box.x1; x++) if (app.lab[y * W + x] === p.id) label[y * W + x] = k;
    const dx = p.cx - ax, dy = p.cy - ay, len = Math.hypot(dx, dy) || 1, dir = { x: +(dx / len).toFixed(2), y: +(dy / len).toFixed(2) };
    const relX = (ax - bx0) / Math.max(1, bx1 - bx0), relY = (ay - by0) / Math.max(1, by1 - by0);
    const cls = dir.y > 0.5 && relY > 0.35 ? 'limb-down' : dir.y < -0.5 && relY < 0.5 ? 'top' : ax < bcx && Math.abs(dir.x) >= Math.abs(dir.y) ? 'rear' : ax >= bcx && Math.abs(dir.x) >= Math.abs(dir.y) ? 'front' : 'other';
    appendages.push({ k, frac: +(p.pixels / paint).toFixed(4), pixels: p.pixels, box: p.box, attach: { x: +ax.toFixed(1), y: +ay.toFixed(1), relX: +relX.toFixed(2), relY: +relY.toFixed(2) }, dir, class: cls,
      length: +Math.hypot(Math.max(p.box.x1 - ax, ax - p.box.x0), Math.max(p.box.y1 - ay, ay - p.box.y0)).toFixed(1) }); }
  const byClass = {}; for (const a of appendages) byClass[a.class] = (byClass[a.class] ?? 0) + 1;
  // ground contacts: separate paint blobs in the bottom band of the main component (feet, hooves, a resting belly), each at least
  // `minContactFrac` of the main component's width; counted on the painting alone
  let lowest = -1; for (let i = W * H - 1; i >= 0; i--) if (mainMask[i]) { lowest = (i - (i % W)) / W; break; }
  const bandTop = Math.max(0, Math.round(lowest - o.groundBand * (main.box.y1 - main.box.y0 + 1))), band = new Uint8Array(W * H);
  for (let y = bandTop; y <= lowest; y++) for (let x = 0; x < W; x++) if (mainMask[y * W + x]) band[y * W + x] = 1;
  const bc = components(band, W, H), minW = o.minContactFrac * (main.box.x1 - main.box.x0 + 1);
  const ground = bc.parts.filter((p) => p.box.x1 - p.box.x0 + 1 >= minW).map((p) => ({ x0: p.box.x0, x1: p.box.x1, cx: +p.cx.toFixed(1) }));
  return { schema: LIMB_COUNTER_SCHEMA, W, H, scale, paint, coreRadius: r, bodyBox, detached, appendages, byClass, ground, label, params: o };
}

const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
/** Working-grid cells a full-resolution polygon covers (cell centres). */
function polyCells(poly, count) {
  const s = count.scale; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const out = []; for (let gy = Math.max(0, Math.floor(y0 / s)); gy <= Math.min(count.H - 1, Math.ceil(y1 / s)); gy++) for (let gx = Math.max(0, Math.floor(x0 / s)); gx <= Math.min(count.W - 1, Math.ceil(x1 / s)); gx++)
    if (inside((gx + 0.5) * s, (gy + 0.5) * s, poly)) out.push(gy * count.W + gx);
  return out;
}
/** Vocabulary name of a joint (the family contracts' appendage words), for reporting only. */
export function vocabularyOf(joint) {
  const j = joint.toLowerCase();
  return /wing/.test(j) ? 'wing' : /tentacle|^arm\d/.test(j) ? 'tentacle' : /fin|pectoral|pelvic|dorsal|anal|caudal/.test(j) ? 'fin' : /tail/.test(j) ? 'tail' : /arm|hand|elbow|shoulder|claw|chel/.test(j) ? 'arm'
    : /leg|hind|fore|paw|foot|knee|ankle|shin|thigh|hip|toe/.test(j) ? 'leg' : /ear|antenna|horn/.test(j) ? 'head-appendage' : /head|jaw|neck|beak|bill/.test(j) ? 'head' : 'other';
}

/** The reference's inventory: its counted appendages (on its own paint), each named by the hand parts that own it. */
export function referenceInventory(refCount, authoring, { minRefFrac = 0.006, ownerShare = 0.15 } = {}) {
  const cellOwner = new Map(); // cell → part id (first containing polygon, as the author's order)
  authoring.parts.forEach((p) => { if (p.id === authoring.remainderPart || p.joint === 'root') return; for (const c of polyCells(p.polygonPx, refCount)) if (!cellOwner.has(c)) cellOwner.set(c, p.id); });
  const jointOf = new Map(authoring.parts.map((p) => [p.id, p.joint])), inv = [];
  for (const a of refCount.appendages) { if (a.frac < minRefFrac) continue;
    const tally = new Map(); let n = 0; for (let i = 0; i < refCount.label.length; i++) { if (refCount.label[i] !== a.k) continue; n++; const o = cellOwner.get(i); if (o) tally.set(o, (tally.get(o) ?? 0) + 1); }
    const owners = [...tally].filter(([, c]) => c >= ownerShare * n).map(([id]) => id);
    if (!owners.length) continue; // an appendage no part names (body remainder bulge): not part of the inventory
    const names = [...new Set(owners.map((id) => vocabularyOf(jointOf.get(id) ?? id)))];
    inv.push({ k: a.k, frac: a.frac, class: a.class, owners, names });
  }
  return inv;
}

/** Admission: counted target anatomy against the reference inventory, through the UNNUDGED mapped parts. */
/** The v3 ADMISSION RULES (chosen on the mutation battery with no loss of admitted positives; `simulate-rules.mjs` records every
 * alternative): detached islands, an unassigned target appendage ≥ 6 % of the paint, and the family floor on the REAR class. The
 * per-appendage missing / merged / covered-extra rules are kept as options, OFF: their overlap distributions for positives and
 * erased limbs coincide (README v3). */
export const V3_RULES = Object.freeze({ detached: true, unassignedMin: 0.06, assignOverlap: 0.1, floor: Object.freeze({ classes: Object.freeze(['rear']), rho: 0.7, presentOnly: true }), groundFloor: true,
  missing: false, merged: false, coveredExtra: false });
/** Largest appendage of each geometric class, as a fraction of the paint. */
export const largestByClass = (count) => { const o = {}; for (const a of count.appendages) o[a.class] = Math.max(o[a.class] ?? 0, a.frac); return o; };
/** Family floor per class from OTHER same-family paintings' own counts: the smallest "largest appendage of that class" among them (a
 * class counts only when every one of them has it). Derived from counted reference paint, never from a template. */
export function familyFloor(refCounts, classes = null) {
  const per = refCounts.map(largestByClass), out = {}; if (!per.length) return out;
  for (const c of classes ?? [...new Set(per.flatMap((o) => Object.keys(o)))]) { if (per.some((o) => !(c in o))) continue; out[c] = Math.min(...per.map((o) => o[c])); }
  return out;
}
export function inventoryCheck(targetCount, refCount, refInventory, refDetached, mappedParts, { minMappedOverlap = 0.25, mergeRatio = 0.7, minExtraFrac = 0.012, minCovered = 0.3, remainderPart = null, rules = V3_RULES, sameFamilyCounts = [] } = {}) {
  const reasons = [], byId = new Map(mappedParts.map((p) => [p.id, p])), T = targetCount, cells = new Map();
  const cellsOf = (id) => { if (!cells.has(id)) { const p = byId.get(id); cells.set(id, p ? polyCells(p.polygonPx, T) : []); } return cells.get(id); };
  const tgtPaint = (i) => T.label[i] >= 0; // on a counted appendage
  const assign = refInventory.map((A) => {
    const ov = new Map(); let mapped = 0, onPaint = 0; const seen = new Set();
    for (const id of A.owners) for (const c of cellsOf(id)) { if (seen.has(c)) continue; seen.add(c); mapped++; if (T.label[c] >= 0) { onPaint++; ov.set(T.label[c], (ov.get(T.label[c]) ?? 0) + 1); } }
    let best = -1, bv = 0; for (const [k, v] of ov) if (v > bv) { bv = v; best = k; }
    return { A, best, overlap: bv, mapped, frac: mapped ? bv / mapped : 0 };
  });
  if (rules.missing) for (const a of assign) if (a.best < 0 || a.frac < minMappedOverlap) reasons.push(`missing-anatomy (counted): reference ${a.A.names.join('/')} appendage [${a.A.owners.join(', ')}] lands ${(100 * a.frac).toFixed(0)}% on a counted target appendage`);
  // merged: several reference appendages collapse onto one target appendage that is too small to hold them
  const groups = new Map(); for (const a of assign) if (a.best >= 0 && a.frac >= minMappedOverlap) { if (!groups.has(a.best)) groups.set(a.best, []); groups.get(a.best).push(a); }
  if (rules.merged) for (const [k, list] of groups) { if (list.length < 2) continue; const t = T.appendages.find((x) => x.k === k), want = list.reduce((s, a) => s + a.A.frac, 0);
    if (t.frac < mergeRatio * want) reasons.push(`missing-anatomy (merged): ${list.length} reference appendages [${list.map((a) => a.A.owners[0]).join(', ')}] land on one target appendage of ${(100 * t.frac).toFixed(1)}% paint (they total ${(100 * want).toFixed(1)}%)`); }
  // extra: a significant target appendage no mapped part covers
  // the body remainder's polygon (and the root marker) name no appendage: they never cover one
  const covered = new Uint8Array(T.label.length); for (const p of mappedParts) { if (p.id === remainderPart || p.joint === 'root') continue; for (const c of cellsOf(p.id)) covered[c] = 1; }
  if (rules.coveredExtra) for (const t of T.appendages) { if (t.frac < minExtraFrac) continue; let n = 0, cov = 0; for (let i = 0; i < T.label.length; i++) if (T.label[i] === t.k) { n++; if (covered[i]) cov++; }
    if (cov < minCovered * n) reasons.push(`extra-anatomy (counted): a ${t.class} appendage of ${(100 * t.frac).toFixed(1)}% paint that no mapped part covers (${(100 * cov / Math.max(1, n)).toFixed(0)}%)`); }
  // unassigned: a sizeable target appendage that no reference appendage lands on (a duplicated or extra limb)
  if (rules.unassignedMin) { const used = new Set(assign.filter((a) => a.best >= 0 && a.frac >= rules.assignOverlap).map((a) => a.best));
    for (const t of T.appendages) if (!used.has(t.k) && t.frac >= rules.unassignedMin) reasons.push(`extra-anatomy (unassigned): a ${t.class} appendage of ${(100 * t.frac).toFixed(1)}% paint that no reference appendage lands on`); }
  // family floor: the target's largest appendage of a class the family always shows must not shrink far below the family's smallest
  if (rules.floor && sameFamilyCounts.length) { const f = familyFloor(sameFamilyCounts, rules.floor.classes), mine = largestByClass(T);
    for (const [c, v] of Object.entries(f)) { if (rules.floor.presentOnly && !(c in mine)) continue; if ((mine[c] ?? 0) < rules.floor.rho * v) reasons.push(`missing-anatomy (family floor): the largest ${c} appendage is ${(100 * (mine[c] ?? 0)).toFixed(1)}% of the paint; every same-family reference shows at least ${(100 * v).toFixed(1)}%`); } }
  // ground floor: at least as many separate ground contacts as the fewest any same-family reference shows (an erased foot)
  if (rules.groundFloor && sameFamilyCounts.length) { const g = Math.min(...sameFamilyCounts.map((c) => c.ground.length));
    if (T.ground.length < g) reasons.push(`missing-anatomy (ground): ${T.ground.length} ground contact(s); every same-family reference shows at least ${g}`); }
  if (rules.detached && T.detached.length > refDetached) reasons.push(`extra-anatomy (detached): ${T.detached.length} separate paint island(s) of ≥ ${(100 * T.params.minDetachedFrac).toFixed(0)}% (reference ${refDetached})`);
  void tgtPaint;
  return { reasons, assign: assign.map((a) => ({ owners: a.A.owners, names: a.A.names, refFrac: a.A.frac, target: a.best, overlap: +a.frac.toFixed(3) })) };
}
