/** Post-verdict placement (Claude 2026-09-27): merge authored parts that share ONE rig joint into the part named for that joint,
 * as the shipped beetle's own intake did (`ARCHETYPE_FINISH_20260923/04-insect/fit-04/label-authoring-receipt.json` regionOwnerMap:
 * elytron-near / elytron-far / thorax → owner `thorax`). intake-authored.mjs requires one part per joint, so transfers from the hand
 * beetle packet (three `thorax` parts) were refused at intake ("unique known source owners").
 * The merged outline is the traced union of the group's owned pixels, placed at the group's first list position. Refuses if ANY pixel
 * outside the group changes owner, or any group pixel is lost. Returns {authoring, receipt} (unchanged authoring when nothing shares). */
import { ownerRaster } from '../../port/v2/tools/anatomy-verify/limb-separation.mjs';
import { traceRegion } from '../../port/v2/tools/anatomy-verify/leaf-growth.mjs';
/* try the exact union first; a one-pixel collar only if contour rounding would drop group pixels */
export function mergeJointOwners(authoring, w, h) {
  try { return mergeOnce(authoring, w, h, false); } catch (e) { if (!/group pixels lost [1-9]/.test(String(e.message))) throw e; return mergeOnce(authoring, w, h, true); }
}
function mergeOnce(authoring, w, h, collar) {
  const byJoint = new Map(); authoring.parts.forEach((p, k) => { if (!byJoint.has(p.joint)) byJoint.set(p.joint, []); byJoint.get(p.joint).push(k); });
  const groups = [...byJoint.entries()].filter(([, ks]) => ks.length > 1);
  if (!groups.length) return { authoring, receipt: null };
  let parts = authoring.parts.slice(); const before = ownerRaster(authoring.parts, w, h), merged = [];
  for (const [joint, ks] of groups) {
    const keep = ks.find((k) => authoring.parts[k].id === joint) ?? ks.find((k) => authoring.parts[k].id.includes(joint)) ?? ks[0];
    const region = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (ks.includes(before[i])) region[i] = 1;
    /* one-pixel collar so contour rounding cannot drop a group pixel; earlier owners keep priority */
    const grown = region.slice(); if (collar) for (let i = 0; i < w * h; i++) if (region[i]) { const x = i % w, y = (i / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) grown[Y * w + X] = 1; } }
    const poly = traceRegion(grown, w, h, 0.05); if (!poly) throw Error(`merge ${joint}: empty region`);
    merged.push({ joint, keep: authoring.parts[keep].id, from: ks.map((k) => authoring.parts[k].id), pixels: region.reduce((a, b) => a + b, 0) });
    const first = Math.min(...ks), mergedPart = { ...authoring.parts[keep], polygonPx: poly.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) };
    parts = parts.map((p, k) => (k === first ? mergedPart : ks.includes(k) ? null : p));
  }
  parts = parts.filter(Boolean);
  const after = ownerRaster(parts, w, h), idBefore = (i) => (before[i] < 0 ? null : authoring.parts[before[i]].id), idAfter = (i) => (after[i] < 0 ? null : parts[after[i]].id);
  const groupIds = new Map(); for (const m of merged) for (const id of m.from) groupIds.set(id, m.keep);
  let otherChanged = 0, groupLost = 0, groupGained = 0;
  for (let i = 0; i < w * h; i++) { const a = idBefore(i), b = idAfter(i);
    if (a !== null && groupIds.has(a)) { if (b !== groupIds.get(a)) groupLost++; }
    else if (a !== b) { if (a === null && [...groupIds.values()].includes(b)) groupGained++; else otherChanged++; } }
  if (otherChanged || groupLost) throw Error(`merge joint owners: other owners changed ${otherChanged}, group pixels lost ${groupLost}`);
  return { authoring: { ...authoring, parts }, receipt: { schema: 'cf.g1-merge-joint-owners/v1', merged, otherOwnersChanged: 0, groupPixelsLost: 0, collarPixelsGained: groupGained, collar, rule: 'shipped beetle regionOwnerMap: same-joint regions → the joint-named owner' } };
}
