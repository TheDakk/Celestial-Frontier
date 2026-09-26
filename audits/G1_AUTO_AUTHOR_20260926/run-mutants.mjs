/** G1 mutation battery (verdict only): every mutant must REFUSE. Mutants are built from a subject's OWN hand labels (which define the
 * mutation only; the author never reads them): erased limb, duplicated limb, wrong family, flipped facing. Positives are the unmutated
 * paintings. Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs [--tag=NAME] [--ridge=F] [id ...] */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {autoAuthor, autoAuthorShop, prepareSubject, mirrorSubject, referenceStats} from '../../port/v2/tools/anatomy-verify/auto-author.mjs';
const HERE = import.meta.dirname, ROOT = path.resolve(HERE, '../..');
const require = createRequire(path.join(ROOT, 'port/v2/package.json'));
const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const { familyContract, familyContactChains } = await import(path.join(ROOT, 'port/v2/tools/creature-animation/family-contracts.mjs'));
const args = process.argv.slice(2), tag = (args.find((a) => a.startsWith('--tag=')) ?? '').slice(6), only = args.filter((a) => !a.startsWith('--'));
const ridgeArg = args.find((x) => x.startsWith('--ridge=')), ridgeFrac = ridgeArg ? Number(ridgeArg.slice(8)) : 0;
const nudgeArg = args.find((x) => x.startsWith('--nudge=')), nudgeFrac = nudgeArg ? Number(nudgeArg.slice(8)) : 0;
const useCounter = args.includes('--counter'), thinArg = args.find((x) => x.startsWith('--nudge-thin=')), nudgeThinFrac = thinArg ? Number(thinArg.slice(13)) : null;
const nudgeSkipChains = args.includes('--nudge-skip-chains');
const shopArg = args.find((x) => x.startsWith('--shop=')), shopN = shopArg ? Number(shopArg.slice(7)) : 0;
const terminalsOf = (f) => { try { return new Set(familyContactChains(familyContract(f)).map((c) => c.terminal).filter(Boolean)); } catch { return new Set(); } };
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'corpus.json'), 'utf8')).subjects;
const subjects = [];
for (const s of corpus) { const dir = path.join(ROOT, s.packet), { data, info } = await sharp(path.join(dir, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data), prepared = prepareSubject(rgba, info.width, info.height), authoring = JSON.parse(fs.readFileSync(path.join(dir, 'authoring.json'), 'utf8'));
  subjects.push({ ...s, rgba, w: info.width, h: info.height, prepared, authoring, stats: referenceStats(prepared, authoring) }); }
const refOf = (s) => ({ ...s.prepared, family: s.family, subjectId: s.id, authoring: s.authoring, partPaint: s.stats.partPaint, unclaimedFrac: s.stats.unclaimedFrac });
const inside = (x, y, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
/** One limb = the parts of the first contact chain (or, without chains, the largest non-remainder part). */
function limbMask(s) {
  const a = s.authoring; let joints;
  try { const ch = familyContactChains(familyContract(s.family))[0]; joints = ch ? new Set([ch.hip, ch.knee, ch.end, ch.terminal].filter(Boolean)) : null; } catch { joints = null; }
  let ids = joints ? a.parts.filter((p) => joints.has(p.joint)).map((p) => p.id) : [];
  if (!ids.length) { // no contact chain (fish, radial…): the largest non-remainder part stands in for "a limb"
    const area = (poly) => { let t = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) t += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(t / 2); };
    const hasChild = new Set(familyContract(s.family).graph.map(([, par]) => par));
    const cand = a.parts.filter((p) => p.id !== a.remainderPart && p.joint !== 'root' && !hasChild.has(p.joint)).sort((x, y) => area(y.polygonPx) - area(x.polygonPx))[0]; if (cand) ids = [cand.id]; }
  const m = new Uint8Array(s.w * s.h); let n = 0;
  for (let y = 0; y < s.h; y += 1) for (let x = 0; x < s.w; x += 1) { const i = y * s.w + x; if (s.prepared.mask[i] === 0) continue; const k = a.parts.findIndex((p) => inside(x + 0.5, y + 0.5, p.polygonPx)); const id = k < 0 ? a.remainderPart : a.parts[k].id; if (ids.includes(id)) { m[i] = 1; n++; } }
  return { m, n, ids };
}
const ev = (r) => ({ chains: r.evidence?.chains ?? null, inv: r.evidence?.inventory ? { assign: r.evidence.inventory.assign, tByClass: r.evidence.inventory.target.byClass, tApp: r.evidence.inventory.target.appendages, ground: r.evidence.inventory.target.ground, det: r.evidence.inventory.target.detached.length, ref: r.evidence.inventory.reference } : null, reasonsAll: r.reasons, v: r.verdict, cost: r.evidence ? +(r.evidence.costs?.[0]?.cost ?? 0).toFixed(4) : null, dT: r.evidence?.detour?.target ?? null, dR: r.evidence?.detour?.ref ?? null, unclaimed: r.evidence?.unclaimedFrac ?? null, why: (r.reasons?.[0] ?? '').slice(0, 60) });
const author = (s, target, family, mirrored) => autoAuthorShop({ shop: shopN, topK: 1, nudgeFrac, nudgeThinFrac, nudgeSkipChains, counter: useCounter ? {} : null, chains: (() => { try { return familyContactChains(familyContract(family)); } catch { return null; } })(), target, mirrored, family, id: s.id, refs: subjects.filter((o) => o.id !== s.id).map(refOf), materials: { surface: 'x' }, habitat: null, ridge: ridgeFrac > 0 ? { radiusFrac: ridgeFrac, keep: terminalsOf(family) } : null });
const rows = [];
for (const s of subjects) {
  if (only.length && !only.includes(s.id)) continue;
  if (!subjects.some((o) => o.id !== s.id && o.family === s.family)) continue; // needs a same-family reference
  const mir = mirrorSubject(s.rgba, s.w, s.h), row = { id: s.id, family: s.family };
  { const r = author(s, s.prepared, s.family, mir); row.positive = r.verdict; row.posEv = ev(r); }
  row.flipped = author(s, mir, s.family, s.prepared).verdict;
  const other = s.family === 'quadruped' ? 'fish' : 'quadruped'; row.wrongFamily = author(s, s.prepared, other, mir).verdict;
  const L = limbMask(s); row.limbParts = L.ids;
  if (L.n > 500) {
    const erased = new Uint8ClampedArray(s.rgba); for (let i = 0; i < s.w * s.h; i++) if (L.m[i]) erased[i * 4 + 3] = 0;
    // a keyed (opaque magenta) master: erase to the key colour instead
    if (s.prepared.keyed) for (let i = 0; i < s.w * s.h; i++) if (L.m[i]) { erased[i * 4] = 255; erased[i * 4 + 1] = 0; erased[i * 4 + 2] = 255; erased[i * 4 + 3] = 255; }
    const ep = prepareSubject(erased, s.w, s.h); { const r = author(s, ep, s.family, mirrorSubject(erased, s.w, s.h)); row.erased = r.verdict; row.erEv = ev(r); }
    let x0 = s.w, x1 = 0, y0 = s.h, y1 = 0; for (let i = 0; i < s.w * s.h; i++) if (L.m[i]) { const x = i % s.w, y = (i / s.w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    // paste the limb where >= 90% of it lands on empty canvas (8 directions, 1.3x its extent)
    let shift = null; for (const [ux, uy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) { const dx = Math.round(ux * ((x1 - x0) * 1.3 + 20)), dy = Math.round(uy * ((y1 - y0) * 1.3 + 20)); let n = 0, free = 0;
      for (let i = 0; i < s.w * s.h; i += 3) { if (!L.m[i]) continue; const X = (i % s.w) + dx, Y = ((i / s.w) | 0) + dy; n++; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h && !s.prepared.mask[Y * s.w + X]) free++; }
      if (n && free / n >= 0.9) { shift = [dx, dy]; break; } }
    const dup = new Uint8ClampedArray(s.rgba); row.dupShift = shift;
    if (shift) for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const i = y * s.w + x; if (!L.m[i]) continue; const X = x + shift[0], Y = y + shift[1]; if (X < 0 || Y < 0 || X >= s.w || Y >= s.h) continue; const j = Y * s.w + X; if (s.prepared.mask[j]) continue; for (let k = 0; k < 4; k++) dup[j * 4 + k] = s.rgba[i * 4 + k]; }
    if (!shift) { row.duplicated = 'n/a'; } else {
    const dp = prepareSubject(dup, s.w, s.h); { const r = author(s, dp, s.family, mirrorSubject(dup, s.w, s.h)); row.duplicated = r.verdict; row.dupEv = ev(r); } }
  } else { row.erased = 'n/a'; row.duplicated = 'n/a'; }
  rows.push(row); console.log(JSON.stringify(row));
}
const tally = (k, want) => rows.filter((r) => r[k] === want).length + '/' + rows.filter((r) => r[k] && r[k] !== 'n/a').length;
const summary = { positivesAdmitted: tally('positive', 'ADMIT'), flippedRefused: tally('flipped', 'REFUSE'), wrongFamilyRefused: tally('wrongFamily', 'REFUSE'), erasedRefused: tally('erased', 'REFUSE'), duplicatedRefused: tally('duplicated', 'REFUSE') };
console.log(JSON.stringify(summary));
fs.mkdirSync(path.join(HERE, 'mutants'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'mutants', 'summary' + (tag ? '-' + tag : '') + '.json'), JSON.stringify({ summary, rows }, null, 1) + '\n');
