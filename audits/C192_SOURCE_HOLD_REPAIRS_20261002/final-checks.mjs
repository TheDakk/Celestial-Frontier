/** Bounded final-byte checks only. Does not run a rig, native browser or static suite. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const base = 'audits/C192_SOURCE_HOLD_REPAIRS_20261002';
const selections = [
  ['01-wild-ass', 'axial-joins-02', 'axial-joins-02/review'],
  ['02-serval-tail-neck', 'axial-joins-02', 'axial-joins-02/review'],
  ['03b-horse-pinnae', 'axial-joins-02', 'axial-joins-02/review'],
  ['04-rhea-legs', 'islands-01', 'review-01'],
  ['05b-snow-petrel-leg', 'islands-01', 'review-01'],
];
const read = p => fs.readFileSync(p);
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const expand = p => p.startsWith('~/') ? path.join(process.env.HOME, p.slice(2)) : p;
const require = createRequire(path.resolve('port/v2/package.json'));
const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
const rows = [];
const checked = new Map();
function bound(entry) {
  assert.equal(sha(read(expand(entry.path))), entry.sha256, 'bound source bytes changed');
  checked.set(entry.path, entry.sha256);
}
function outputLabels(actual, labels, parts) {
  const colors = parts.map((_, i) => { const k = i + 1; return [k * 83 % 200 + 35, k * 137 % 200 + 35, k * 47 % 200 + 35]; });
  for (let i = 0; i < labels.length; i++) {
    const k = labels[i];
    if (!k) { assert.equal(actual[4 * i + 3], 0, 'ownership added alpha'); continue; }
    assert.equal(actual[4 * i + 3], 255);
    for (let c = 0; c < 3; c++) assert.equal(actual[4 * i + c], colors[k - 1][c], 'output ownership mismatch');
  }
}
function limitsEqual(prior, candidate) {
  const { pins: _a, ...a } = prior;
  const { pins: _b, ...b } = candidate;
  assert.deepEqual(b, a, 'solver limits changed');
}
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]); }
for (const [id, selection, reviewSubpath] of selections) {
  const packet = `${base}/${id}`, islandFit = `${packet}/islands-01/fit`, fit = `${packet}/${selection}/fit`;
  const conservation = json(`${packet}/conservation.json`), placement = json(`${packet}/islands-01/receipt.json`);
  const staticPath = `${packet}/${selection}/static.json`, stat = json(staticPath);
  assert.equal(stat.status, 'PASS_STATIC');
  assert.equal(stat.exactRest, true);
  assert.equal(stat.presentation.status, 'PASS');
  assert.equal(stat.sourcePixelRest.changedVisibleRgbaChannels, 0);
  assert(stat.rows.every(r => r.status === 'PASS' && !r.firstRefusal && r.samples === 121));
  assert.deepEqual(stat.settings, { samplesPerAction: 121, presentationHz: 60, paintContactTolerancePx: .25, endpointTolerance: 1e-8 });
  for (const entry of [...stat.inputs, ...json(`${staticPath}.sources.json`)]) bound(entry);
  assert.equal(placement.maxShare, .5);
  assert.equal(placement.nonRemainderOwnersChanged, 0);
  assert.equal(placement.sourceRgbaChanges, 0);
  assert.equal(placement.sourceConservationSha256, sha(read(`${packet}/conservation.json`)));
  bound({ path: placement.placementHelper, sha256: placement.placementHelperSha256 });
  assert.equal(sha(read(`${packet}/master.png`)), conservation.masterSha256);
  assert.deepEqual(read(`${packet}/fit01/record.json`), read(`${fit}/record.json`));
  const key = await sharp(`${fit}/parts/keyed.png`).ensureAlpha().raw().toBuffer();
  assert.equal(sha(key), conservation.keyedRgbaSha256);
  const { data: raw, info } = await sharp(`${fit}/labels.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const labels = Uint8Array.from({ length: info.width * info.height }, (_, i) => raw[4 * i]);
  const own = await sharp(`${fit}/parts/ownership.png`).ensureAlpha().raw().toBuffer();
  const parts = json(`${fit}/declaration.json`).parts;
  outputLabels(own, labels, parts);
  const painted = labels.findIndex(v => v), badOwner = Buffer.from(own);
  badOwner[4 * painted] ^= 1;
  assert.throws(() => outputLabels(badOwner, labels, parts), /output ownership/);
  const badKey = Buffer.from(key); badKey[4 * painted] ^= 1;
  assert.notEqual(sha(badKey), conservation.keyedRgbaSha256);
  let axial = null;
  if (selection === 'axial-joins-02') {
    const recipe = json(`${packet}/${selection}/recipe.json`);
    assert.deepEqual(recipe.paintBoundaryPairs, [['neck', 'spine'], ['root', 'spine']]);
    assert.equal(recipe.receipt.weldedExcludedBoundaries, 2);
    assert.equal(recipe.receipt.sourceCoordinateChanges, 0);
    bound({ path: recipe.compiler, sha256: recipe.compilerSha256 });
    assert.equal(sha(read(`${islandFit}/binding.json`)), recipe.sourceBindingSha256);
    assert.equal(sha(read(`${fit}/binding.json`)), recipe.candidateBindingSha256);
    for (const file of files(islandFit)) if (file !== `${islandFit}/binding.json`) assert.deepEqual(read(file), read(fit + file.slice(islandFit.length)));
    const prior = json(`${islandFit}/binding.json`).paintSkin.solver, next = json(`${fit}/binding.json`).paintSkin.solver;
    limitsEqual(prior, next);
    assert.throws(() => limitsEqual(prior, { ...next, iterations: (next.iterations ?? 0) + 1 }), /solver limits/);
    axial = { paintBoundaryPairs: recipe.paintBoundaryPairs, bindingOnlyChange: true, exactNonPinSolverFields: next && Object.keys(next).filter(k => k !== 'pins'), sourceCoordinatesChanged: 0, limitsMutationRejected: true };
  }
  const reviewPath = `${packet}/${reviewSubpath}/review.json`, review = json(reviewPath);
  assert.equal(review.status, 'PASS_OFFLINE'); assert.equal(review.rows.length, 20);
  assert(review.rows.every(r => r.status === 'PASS' && r.publishedPartParity === 'byte-exact'));
  for (const entry of review.inputs) bound(entry);
  let exactPhase = null;
  const exactPath = `${packet}/${selection}/exact-phase/review.json`;
  if (fs.existsSync(exactPath)) {
    const exact = json(exactPath); assert.equal(exact.status, 'PASS_OFFLINE');
    assert(exact.rows.every(r => r.status === 'PASS' && r.publishedPartParity === 'byte-exact'));
    for (const entry of exact.inputs) bound(entry);
    exactPhase = { path: exactPath, sha256: sha(read(exactPath)), rows: exact.rows.length };
  }
  rows.push({ id, fit, status: 'PASS_STATIC_VISUAL_HELD', actions: stat.rows.length, actionSamples: stat.rows.reduce((n, r) => n + r.samples, 0), presentationSamples: stat.presentation.samples, actualRigParitySamples: review.rows.length, exactPhase, sourceRgbaChanged: 0, unchangedD28Cap: .5, movedRemainderPixels: placement.movedPixels, recordSha256: sha(read(`${fit}/record.json`)), bindingSha256: sha(read(`${fit}/binding.json`)), masterSha256: conservation.masterSha256, static: { path: staticPath, sha256: sha(read(staticPath)) }, review: { path: reviewPath, sha256: sha(read(reviewPath)) }, axial, controls: ['actual output ownership-color mutation rejected', 'actual keyed RGBA mutation rejected'], qualityAccepted: false, independentReferenceEligible: false, native: false });
}
const negatives = ['baseline-horse/static.json', 'baseline-serval/static.json', '05-snow-petrel-wing/islands-01/static.json'].map(relative => {
  const p = `${base}/${relative}`, r = json(p); assert.equal(r.status, 'RED');
  const refused = r.rows.filter(x => x.firstRefusal).map(x => ({ action: x.id, ms: x.firstRefusal.ms, error: x.firstRefusal.error.split('\n')[0] })); assert(refused.length);
  return { path: p, sha256: sha(read(p)), status: r.status, refused };
});
const out = { schema: 'cf.c192-final-output-check/v1', status: 'PASS', scope: 'Final artifact/source/static/parity receipt checks only; no new pose solve, native or quality acceptance.', rows, totals: { candidates: rows.length, actionSamples: rows.reduce((n, r) => n + r.actionSamples, 0), presentationSamples: rows.reduce((n, r) => n + r.presentationSamples, 0), actualRigParitySamples: rows.reduce((n, r) => n + r.actualRigParitySamples + (r.exactPhase?.rows ?? 0), 0) }, retainedNegativeControls: negatives, verifiedSourceFiles: [...checked].map(([path, sha256]) => ({ path, sha256 })), native: false, qualityAccepted: false };
fs.writeFileSync(`${base}/final-checks.json`, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: out.status, ...out.totals, sourceFiles: checked.size, negativeControls: negatives.length }));
