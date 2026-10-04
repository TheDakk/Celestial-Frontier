/** Claude's independent check of Codex's foreleg side repair (`audits/C59_REPAIR_20260926/foreleg-side-labels.mjs`), 2026-09-27.
 * (1) Re-implementation from the stated rule (NOT importing Codex's function): a near/far foreleg pixel below BOTH shoulders moves to the
 *     opposite foreleg's owner when an opposite-chain bone segment is strictly closer than every bone of its own chain... precisely: when
 *     the closest of all 8 foreleg bones (root→knee, knee→ankle, ankle→paw, paw point, per side) belongs to the other side. Compared
 *     pixel-for-pixel with Codex's committed candidate labels.
 * (2) Conservation: only foreleg owners change, only across sides, no pixel gains or loses an owner.
 * (3) Idempotence: the rule applied to its own output changes nothing.
 * (4) Mutation: near/far landmark sets swapped (a wrong chain identity) must be detected. Reported as the moved-pixel count.
 * Usage (repo root): node audits/C59_REPAIR_CHECK_20260927/check.mjs > audits/C59_REPAIR_CHECK_20260927/results.json */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { separateUpperForelegs } from '../C59_REPAIR_20260926/foreleg-side-labels.mjs';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const C = 'audits/C59_REPAIR_20260926', IDS = ['g2c54-05-tiger-side', 'g2c54-06-leopard-side', 'g2c54-09-ocelot-side', 'g2c56-06-mink-side', 'g2c56-08-fisher-side', 'g2c57-05-snow-leopard-side', 'g2c57-06-clouded-leopard-side'];
const png = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { v: Uint8Array.from({ length: info.width * info.height }, (_, i) => data[i * 4]), w: info.width, h: info.height }; };
/* independent implementation */
function mine(labels, w, h, parts, lm) {
  const sides = { Near: ['Root', 'Knee', 'Ankle', 'Paw'].map((s) => 'foreNear' + s), Far: ['Root', 'Knee', 'Ankle', 'Paw'].map((s) => 'foreFar' + s) };
  const ownerOf = (j) => parts.findIndex((p) => p.joint === j) + 1, P = (j) => [lm[j][0] * w, lm[j][1] * h];
  const bones = []; for (const [side, ch] of Object.entries(sides)) for (let k = 0; k < 4; k++) { const [ax, ay] = P(ch[k]), [bx, by] = P(ch[Math.min(3, k + 1)]); bones.push({ side, owner: ownerOf(ch[k]), ax, ay, bx, by }); }
  const sideOf = new Map(bones.map((b) => [b.owner, b.side])), roots = bones.filter((b, k) => k % 4 === 0);
  const d2 = (x, y, b) => { const vx = b.bx - b.ax, vy = b.by - b.ay, L = vx * vx + vy * vy; let t = L ? ((x - b.ax) * vx + (y - b.ay) * vy) / L : 0; t = Math.max(0, Math.min(1, t)); const px = b.ax + t * vx - x, py = b.ay + t * vy - y; return px * px + py * py; };
  const out = labels.slice(); let moved = 0;
  for (let i = 0; i < labels.length; i++) { const s = sideOf.get(labels[i]); if (!s) continue; const x = (i % w) + 0.5, y = Math.floor(i / w) + 0.5;
    if (roots.some((r) => (x - r.ax) * (r.bx - r.ax) + (y - r.ay) * (r.by - r.ay) < 0)) continue;
    /* own bone first (ties keep the pixel with its own owner), then strictly closer bones */
    const own = bones.find((b) => b.owner === labels[i]); let best = own, bd = d2(x, y, own);
    for (const b of bones) { const q = d2(x, y, b); if (q < bd - 1e-8) { best = b; bd = q; } }
    if (best.side !== s) { out[i] = best.owner; moved++; } }
  return { out, moved, sideOf };
}
const res = { schema: 'cf.claude-foreleg-side-check/v1', subjects: {} };
for (const id of IDS) {
  const src = path.join(C, 'source-inputs', id), record = JSON.parse(fs.readFileSync(path.join(src, 'record.json'))), decl = JSON.parse(fs.readFileSync(path.join(src, 'declaration.json')));
  const S = await png(path.join(src, 'labels.png')), F = await png(path.join(C, id, 'fit/labels.png')), { w, h } = S, lm = record.landmarks;
  const m = mine(S.v, w, h, decl.parts, lm); let diffCodex = 0, codexMoved = 0, nonForeleg = 0, sameSide = 0, unownedFlip = 0;
  for (let i = 0; i < S.v.length; i++) { if (m.out[i] !== F.v[i]) diffCodex++; if (S.v[i] !== F.v[i]) { codexMoved++; const a = m.sideOf.get(S.v[i]), b = m.sideOf.get(F.v[i]); if (!a || !b) nonForeleg++; else if (a === b) sameSide++; if (!S.v[i] !== !F.v[i]) unownedFlip++; } }
  const again = separateUpperForelegs({ labels: F.v, width: w, height: h, parts: decl.parts, landmarks: lm }).receipt.changedPixels;
  const swapped = Object.fromEntries(Object.entries(lm).map(([k, v]) => [k.includes('Near') ? k.replace('Near', 'Far') : k.includes('Far') ? k.replace('Far', 'Near') : k, v]));
  /* Preserve the independent pre-guard movement measurement; the current helper must refuse it. */
  const mutant = mine(S.v, w, h, decl.parts, swapped).moved;
  let swappedChainRefused = false;
  try { separateUpperForelegs({ labels: S.v, width: w, height: h, parts: decl.parts, landmarks: swapped }); }
  catch (error) { if (!/exceeds 25%/.test(error.message)) throw error; swappedChainRefused = true; }
  if (!swappedChainRefused) throw Error(id + ': swapped chain was not refused');
  let foreleg = 0; for (let i = 0; i < S.v.length; i++) if (m.sideOf.get(S.v[i])) foreleg++;
  res.subjects[id] = { codexMoved, mineMoved: m.moved, pixelsDifferingFromCodex: diffCodex, conservation: { nonForelegOwnersChanged: nonForeleg, sameSideTransfers: sameSide, ownershipGainedOrLost: unownedFlip },
    idempotentSecondPass: again, forelegPixels: foreleg, movedShareOfForeleg: +(codexMoved / foreleg).toFixed(4), swappedChainRefused, swappedChainMutantMoved: mutant, swappedShareOfForeleg: +(mutant / foreleg).toFixed(4) };
}
console.log(JSON.stringify(res, null, 1));
