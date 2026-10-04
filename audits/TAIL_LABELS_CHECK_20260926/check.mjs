/** Claude's independent checks of Codex's exact-label tail contract (`audits/TAIL_LABELS_C56_20260926/gap-labels.mjs`), 2026-09-26.
 * (1) Agreement: the pixels Codex's labels move must be EXACTLY the pixel set Claude's separate polygon route requested
 *     (`TAIL_STALK_BRIDGE_20260926`), and the new labels must be the ones Codex committed.
 * (2) Mutations on real fits: each must REFUSE or change nothing, never move paint silently.
 * Usage (repo root): node audits/TAIL_LABELS_CHECK_20260926/check.mjs > audits/TAIL_LABELS_CHECK_20260926/results.json */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { fillRemainderGap } from '../TAIL_LABELS_C56_20260926/gap-labels.mjs';
import { deriveTailPair, assertTailPair } from './tail-identity.mjs';
import { ownerRaster } from '../../port/v2/tools/anatomy-verify/limb-separation.mjs';
const req = createRequire(path.resolve('port/v2/package.json')), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const G1 = 'audits/G1_AUTO_AUTHOR_20260926', TL = 'audits/TAIL_LABELS_C56_20260926';
const SUBJECTS = [
  { id: '08-cod', fit: `${G1}/auto-g2fam-v10/08-cod/fit`, packet: `${G1}/auto-g2fam-v10/08-cod/packet`, tail: 'caudal', stalk: 'body-5', remainder: 'body' },
  { id: '07-perch', fit: `${G1}/auto-g2fam-v10/07-perch/fit`, packet: `${G1}/auto-g2fam-v10/07-perch/packet`, tail: 'caudal', stalk: 'body-5', remainder: 'body' },
  { id: '09-carp', fit: `${G1}/auto-g2fam-v10/09-carp/fit`, packet: `${G1}/auto-g2fam-v10/09-carp/packet`, tail: 'caudal', stalk: 'body-5', remainder: 'body' },
  { id: '03-arctic-fox', fit: `${G1}/auto-g2-v10/03-arctic-fox/fit`, packet: `${G1}/auto-g2-v10/03-arctic-fox/packet`, tail: 'tail3', stalk: 'tail2', remainder: 'spine' },
];
const load = async (fit) => { const record = JSON.parse(fs.readFileSync(path.join(fit, 'record.json'))), decl = JSON.parse(fs.readFileSync(path.join(fit, 'declaration.json')));
  const m = await sharp(path.resolve(record.source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), l = await sharp(path.join(fit, 'labels.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { decl, rgba: Uint8Array.from(m.data), width: m.info.width, height: m.info.height, labels: Uint8Array.from({ length: m.info.width * m.info.height }, (_, i) => l.data[i * 4]) }; };
const own = (decl, id) => { const i = decl.parts.findIndex((p) => p.id === id); if (i < 0) throw Error('unknown ' + id); return i + 1; };
const run = (f) => { try { const r = fillRemainderGap(f); return { ok: true, changed: r.receipt.changedPixels, labels: r.labels }; } catch (e) { return { ok: false, error: String(e.message) }; } };
const out = { schema: 'cf.claude-tail-label-check/v1', subjects: {} };
for (const s of SUBJECTS) {
  const src = await load(s.fit), { decl, rgba, width, height, labels } = src, base = { rgba, labels, width, height, remainder: own(decl, s.remainder), tail: own(decl, s.tail), stalk: own(decl, s.stalk) };
  const res = {}, r0 = run(base);
  /* (1a) the committed Codex labels are reproduced exactly */
  const committed = await sharp(path.join(TL, s.id, 'fit/labels.png')).ensureAlpha().raw().toBuffer();
  let diffCommitted = 0; for (let i = 0; i < labels.length; i++) if (committed[i * 4] !== r0.labels[i]) diffCommitted++;
  res.reproducesCommittedLabels = { ok: r0.ok, changed: r0.changed, pixelsDifferingFromCommitted: diffCommitted };
  /* (1b) the moved set equals Claude's polygon-route requested set: remainder-owned (or unowned) paint within the measured distance of BOTH parts, from the packet polygons */
  const a = JSON.parse(fs.readFileSync(path.join(s.packet, 'authoring.json'))), poly = ownerRaster(a.parts, width, height), pk = (id) => a.parts.findIndex((p) => p.id === id);
  const moved = []; for (let i = 0; i < labels.length; i++) if (labels[i] !== r0.labels[i]) moved.push(i);
  const polyOwners = {}; for (const i of moved) { const k = poly[i] < 0 ? '(none)' : a.parts[poly[i]].id; polyOwners[k] = (polyOwners[k] ?? 0) + 1; }
  res.movedPixelsByPolygonOwner = polyOwners; res.movedAllRemainderOrUnownedInPolygons = Object.keys(polyOwners).every((k) => k === '(none)' || k === a.remainderPart);
  /* (2) mutations */
  const M = {};
  /* M1 wrong tail identity: a non-tail fin/limb named as the tail. Must not silently move paint to the stalk. */
  const wrongTail = s.id === '03-arctic-fox' ? 'head' : 'dorsal', wt = run({ ...base, tail: own(decl, wrongTail) });
  M.wrongTailIdentity = { tail: wrongTail, ok: wt.ok, changed: wt.changed ?? 0, error: wt.error };
  /* M2 erased tail: tail paint removed (alpha 0, label 0). Must refuse. */
  { const r = Uint8Array.from(rgba), l = labels.slice(); for (let i = 0; i < l.length; i++) if (l[i] === base.tail) { l[i] = 0; r[i * 4 + 3] = 0; } const e = run({ ...base, rgba: r, labels: l }); M.erasedTail = { ok: e.ok, changed: e.changed ?? 0, error: e.error }; }
  /* M3 far stalk: the stalk named as the most distant axial part. Must refuse (locality) or change nothing. */
  { const far = s.id === '03-arctic-fox' ? 'neck' : 'body-0', e = run({ ...base, stalk: own(decl, far) }); M.farStalk = { stalk: far, ok: e.ok, changed: e.changed ?? 0, error: e.error }; }
  /* M4 transparent cut: a 2-px transparent column through the tail boundary. The fill must not cross it (no bridge through transparency). */
  { const r = Uint8Array.from(rgba), l = labels.slice(); let cx = -1; for (let i = 0; i < l.length && cx < 0; i++) if (l[i] === base.tail) { const x = i % width; for (const n of [i - 1, i + 1]) if (l[n] === base.remainder || l[n] === base.stalk) cx = x; }
    const tailXs = []; for (let i = 0; i < l.length; i++) if (l[i] === base.tail) tailXs.push(i % width); const tailMin = Math.min(...tailXs), tailMax = Math.max(...tailXs);
    /* cut every non-tail pixel in the two columns on the body side of the tail, so tail and body are separated */
    const bodySide = tailMin > width / 2 ? tailMin - 2 : tailMax + 1; for (let y = 0; y < height; y++) for (const x of [bodySide, bodySide + 1]) { const i = y * width + x; if (l[i] !== base.tail) { l[i] = 0; r[i * 4 + 3] = 0; } }
    const e = run({ ...base, rgba: r, labels: l });
    M.transparentCut = { column: bodySide, ok: e.ok, changed: e.changed ?? 0, error: e.error, note: 'a tail still touching the body elsewhere may legitimately fill there' }; }
  /* Guard: the rig-derived pair must equal the requested pair (positive), and the wrong-tail mutation must now refuse (negative control). */
  const guarded = (t, st) => { try { return { ok: true, ...assertTailPair(decl.parts, labels, width, t, st) }; } catch (e) { return { ok: false, error: String(e.message) }; } };
  res.identityGuard = { derived: deriveTailPair(decl.parts, labels, width), requestedPair: guarded(s.tail, s.stalk), wrongTailMutation: guarded(M.wrongTailIdentity.tail, s.stalk) };
  res.mutations = M; out.subjects[s.id] = res;
}
console.log(JSON.stringify(out, null, 1));
