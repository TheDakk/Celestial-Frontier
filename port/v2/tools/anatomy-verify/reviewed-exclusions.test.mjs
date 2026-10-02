/* Reviewed exclusions reach the G1 author BEFORE its anatomy checks (Claude 2026-10-02). Real C136 Tegu painting + Codex's exact
 * hash-bound ear review, the G1 corpus and the C136 sprawler reference pool (the standard runner flags: topK 1, chains, counter).
 * Run from the worktree root: node --test port/v2/tools/anatomy-verify/reviewed-exclusions.test.mjs */
import assert from 'node:assert/strict'; import { test, before } from 'node:test';
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { autoAuthor, prepareSubject, mirrorSubject, referenceStats } from './auto-author.mjs';
import { reviewedExclusions } from './reviewed-exclusions.mjs';
import { familyContract, familyContactChains } from '../creature-animation/family-contracts.mjs';
const ROOT = path.resolve(import.meta.dirname, '../../../..'), G1 = path.join(ROOT, 'audits/G1_AUTO_AUTHOR_20260926');
const require = createRequire(path.join(ROOT, 'port/v2/package.json')), sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const TEGU = path.join(ROOT, 'audits/G2_C132_QUADRUPEDS_20261001/11-tegu'), REVIEW = JSON.parse(fs.readFileSync(path.join(ROOT, 'audits/C136_SPRAWLER_REFERENCES_20261002/reviews/11-tegu.json'), 'utf8'));
const EARS = ['earFarRoot', 'earFarTip', 'earNearRoot', 'earNearTip'];
const rgbaOf = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { rgba: new Uint8ClampedArray(data), w: info.width, h: info.height }; };
let refs, tegu, chains;
before(async () => {
  const rows = [...JSON.parse(fs.readFileSync(path.join(G1, 'corpus.json'), 'utf8')).subjects, ...JSON.parse(fs.readFileSync(path.join(G1, 'pilots/reference-pool-extras-c136-sprawlers.json'), 'utf8'))];
  refs = [];
  for (const r of rows) { const dir = path.join(ROOT, r.packet), img = await rgbaOf(path.join(dir, 'master.png')), prepared = prepareSubject(img.rgba, img.w, img.h), authoring = JSON.parse(fs.readFileSync(path.join(dir, 'authoring.json'), 'utf8'));
    if (JSON.parse(fs.readFileSync(path.join(dir, 'subject-source.json'), 'utf8')).name === 'Tegu') continue; // leave-one-species-out
    const st = referenceStats(prepared, authoring); refs.push({ ...prepared, family: r.family, subjectId: r.id, authoring, partPaint: st.partPaint, unclaimedFrac: st.unclaimedFrac, skeleton: null }); }
  tegu = await rgbaOf(path.join(TEGU, 'master.png')); chains = familyContactChains(familyContract('quadruped'));
});
const author = (img, excludedJoints) => autoAuthor({ target: prepareSubject(img.rgba, img.w, img.h), mirrored: mirrorSubject(img.rgba, img.w, img.h), family: 'quadruped', id: '11-tegu', refs, topK: 1, counter: {}, chains,
  materials: { surface: 'scales' }, habitat: null, ...(excludedJoints === undefined ? {} : { excludedJoints }) });
const earReason = (r) => /\((ear[A-Z]\w*)\)/.test(r);

test('admitted ear review → exactly the four pinna joints are excluded', () => {
  const rx = reviewedExclusions({ packetDir: TEGU, review: REVIEW, family: 'quadruped' });
  assert.equal(rx.refused, null); assert.deepEqual(rx.excludedJoints, EARS); assert.deepEqual([...rx.admitted.absent], ['external-ears']); });

test('tampered review (any hash mismatch) or another painting → no exclusion at all', () => {
  const flip = (h) => h.slice(0, -1) + (h.at(-1) === '0' ? '1' : '0');
  for (const k of ['masterSha256', 'subjectSha256', 'promptSha256']) { const rx = reviewedExclusions({ packetDir: TEGU, review: { ...REVIEW, [k]: flip(REVIEW[k]) }, family: 'quadruped' });
    assert.equal(rx.excludedJoints, null, k); assert.equal(rx.admitted, null); assert.match(rx.refused, /hash/); }
  const other = reviewedExclusions({ packetDir: path.join(ROOT, 'audits/G2_C132_QUADRUPEDS_20261001/12-lizard'), review: REVIEW, family: 'quadruped' });
  assert.equal(other.excludedJoints, null); });

test('no review / null / [] → author output byte-identical to the author without the option', () => {
  const base = JSON.stringify(author(tegu, undefined));
  assert.equal(JSON.stringify(author(tegu, null)), base); assert.equal(JSON.stringify(author(tegu, [])), base);
  assert.match(base, /missing-anatomy: part ear-far-tip \(earFarTip\)/); // the refusal the review exists for
});

test('admitted exclusions: no ear reason, no ear part or landmark, every other reason kept', () => {
  const base = author(tegu), ex = author(tegu, EARS);
  assert.ok(base.reasons.some(earReason)); assert.ok(!ex.reasons.some(earReason), ex.reasons.join('; '));
  assert.ok(!ex.authoring.parts.some((p) => EARS.includes(p.joint))); assert.ok(!EARS.some((j) => j in ex.authoring.landmarksPx));
  assert.deepEqual(ex.evidence.reviewedExclusion.joints, EARS);
  for (const r of base.reasons.filter((x) => !earReason(x) && !/^unexplained-anatomy/.test(x))) assert.ok(ex.reasons.includes(r), 'kept: ' + r);
  // every non-ear part and landmark is the same as without the review
  assert.deepEqual(ex.authoring.parts, base.authoring.parts.filter((p) => !EARS.includes(p.joint)));
  assert.deepEqual(ex.authoring.landmarksPx, Object.fromEntries(Object.entries(base.authoring.landmarksPx).filter(([j]) => !EARS.includes(j)))); });

test('an ear-absent review does not excuse a missing leg', () => {
  const base = author(tegu), ch = chains[0], legJoints = new Set([ch.hip, ch.knee, ch.end, ch.terminal].filter(Boolean));
  const legPolys = base.authoring.parts.filter((p) => legJoints.has(p.joint) && p.joint !== ch.hip).map((p) => p.polygonPx);
  const inside = (x, y, P) => { let yes = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes; } return yes; };
  const keyed = prepareSubject(tegu.rgba, tegu.w, tegu.h).keyed, erased = new Uint8ClampedArray(tegu.rgba); let n = 0;
  for (let y = 0; y < tegu.h; y++) for (let x = 0; x < tegu.w; x++) if (legPolys.some((P) => inside(x + 0.5, y + 0.5, P))) { const i = (y * tegu.w + x) * 4; n++; if (keyed) { erased[i] = 255; erased[i + 1] = 0; erased[i + 2] = 255; erased[i + 3] = 255; } else erased[i + 3] = 0; }
  assert.ok(n > 500, 'leg region erased');
  const ex = author({ rgba: erased, w: tegu.w, h: tegu.h }, EARS);
  assert.equal(ex.verdict, 'REFUSE'); assert.ok(ex.reasons.some((r) => /^missing-anatomy/.test(r) && !earReason(r)), ex.reasons.join('; ')); });

test('the remainder part is never excluded', () => {
  const base = author(tegu), rj = base.authoring.parts.find((p) => p.id === base.authoring.remainderPart).joint, ex = author(tegu, [rj]);
  assert.equal(ex.verdict, 'REFUSE'); assert.ok(ex.reasons.some((r) => /^reviewed-absence: .*remainder/.test(r))); assert.ok(ex.authoring.parts.some((p) => p.id === base.authoring.remainderPart)); });
