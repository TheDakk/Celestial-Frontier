// Prepared only. Run once after result.json and its evidence are complete; never guesses a commit.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const itemDir = import.meta.dirname, sprintDir = path.dirname(itemDir), repo = path.resolve(itemDir, '../../..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rel = file => path.relative(repo, file).split(path.sep).join('/');
function file(value, base = itemDir) {
  assert.equal(typeof value, 'string', 'An explicit evidence path is required');
  const absolute = path.resolve(value.startsWith('audits/') ? repo : base, value);
  assert(absolute.startsWith(repo + path.sep), `Evidence outside repository: ${value}`);
  assert(fs.statSync(absolute).isFile(), `Missing evidence file: ${value}`);
  return absolute;
}
const draftFile = file('final-sprint-index-draft.json'), resultFile = file('result.json');
const draft = read(draftFile), result = read(resultFile);
assert.equal(draft.schema, 'cf.final-sprint-index-draft/v1');
assert.equal(draft.items.length, 13);
assert.equal(new Set(draft.items.map(row => row.item)).size, 13);
assert.equal(draft.acceptedTechnicalSelections, 12);
assert.deepEqual(draft.pendingItems, [12]);
assert.equal(result.schema, 'cf.sprint-item-result/v1');
assert.equal(result.item, '12-myriapod');
assert.equal(result.species, 'Centipede');
assert(['PASS_LOCAL', 'PASS_LOCAL_SIGNING_PENDING'].includes(result.status), 'Result has not passed');
const staticFile = file(result.static.report), nativeFile = file(result.native.report);
const sourceFile = file(result.sourceCheck), sourceReceiptFile = file(staticFile + '.sources.json');
const stat = read(staticFile), native = read(nativeFile), source = read(sourceFile), staticSources = read(sourceReceiptFile);
assert.equal(stat.status, 'PASS_STATIC');
assert(stat.rows.length > 0 && stat.rows.every(row => row.status === 'PASS' && row.samples === 121 && row.exactRest === true));
assert.equal(stat.exactRest, true);
assert.equal(stat.sourcePixelRest.status, 'PASS');
assert.equal(stat.sourcePixelRest.changedVisibleRgbaChannels, 0);
assert.equal(stat.presentation.status, 'PASS');
assert.equal(stat.presentation.exactRest, true);
assert(stat.presentation.samples > 0);
assert.equal(result.static.status, stat.status);
assert.equal(result.static.actions, stat.rows.length);
assert.equal(result.static.samplesPerAction, 121);
assert.equal(result.static.presentationSamples, stat.presentation.samples);
assert.equal(result.static.exactRest, true);
assert.deepEqual(result.static.sourcePixelRest, stat.sourcePixelRest);
assert.equal(native.status, 'DIAGNOSTIC_PASS');
assert.equal(native.gates.status, 'DIAGNOSTIC_PASS');
assert.equal(result.native.status, native.status);
assert.equal(result.native.runId, native.runId);
assert.equal(native.script.runId, native.runId);
assert.equal(result.sourceHead, stat.sourceHead);
assert.equal(native.source, stat.sourceHead);
assert.equal(native.paintedTier.limitMs, 3.5);
for (const side of ['left', 'right']) {
  assert.equal(native.gates.refusals[side], 0);
  assert.equal(native.capture.refusalsAtEnd[side], 0);
  assert.equal(result.native.refusals[side], 0);
  const cpu = native.capture.perRigUpdateP95Ms[side];
  assert(Number.isFinite(cpu) && cpu >= 0 && cpu <= 3.5, `${side} native CPU has not passed`);
  assert.equal(result.native.perRigUpdateP95Ms[side], cpu);
}
for (const [key, measured] of Object.entries({ frames: native.capture.frames, durationMs: native.capture.durationMs, wholeStageP95Ms: native.capture.cpuP95Ms, timingScope: native.capture.timingScope })) assert.equal(result.native[key], measured);
assert(native.capture.frames > 0 && native.capture.durationMs > 0 && native.capture.encodedFrames.frames > 0);
assert.deepEqual(result.native.encodedFrames, native.capture.encodedFrames);
assert.deepEqual(result.native.encodedMedia, native.capture.encodedMedia);
assert.equal(source.schema, 'cf.sprint-source-check/v1');
assert.equal(source.nativeRunId, native.runId);
for (const key of ['nativeSources', 'staticSources', 'inputs', 's2Sources']) {
  assert(source[key].length > 0 && source[key].every(row => row.unchanged === true && row.sha256 === row.currentSha256), `Changed ${key}`);
}
function matches(rows, checked) {
  assert(rows.length > 0);
  for (const row of rows) assert(checked.some(x => x.path === row.path && x.sha256 === row.sha256), `Unmatched source/input: ${row.path}`);
}
matches(native.sources, source.nativeSources); matches(staticSources, source.staticSources); matches(stat.inputs, source.inputs);
assert(stat.inputs.every(row => row.unchanged === true) && staticSources.every(row => row.unchanged === true));
const recordInputs = stat.inputs.filter(row => row.path.endsWith('/record.json'));
assert.equal(recordInputs.length, 1);
const recordFile = file(recordInputs[0].path), fit = path.dirname(recordFile), bindingFile = file('binding.json', fit);
const record = read(recordFile), binding = read(bindingFile), masterFile = file(record.source);
for (const target of [recordFile, bindingFile]) {
  const input = stat.inputs.find(row => row.path === target);
  assert(input && input.sha256 === sha(target), `Selected artifact changed: ${target}`);
  matches([input], native.sources);
}
assert.equal(record.recipeHash, result.recipeHash); assert.equal(record.recipeHash, stat.recordRecipeHash);
assert.equal(binding.recordRecipeHash, record.recipeHash);
assert.equal(binding.bindingHash, result.bindingHash); assert.equal(binding.bindingHash, stat.bindingHash);
assert.equal(sha(masterFile), record.geometry.cutoutAssetHash); assert.equal(result.masterSha256, record.geometry.cutoutAssetHash);
const s2File = file(result.s2.evidence ?? 'contact-regression/s2-execution.json'), s2 = read(s2File);
assert.equal(s2.status, 'PASS_STATIC_IDENTICAL'); assert.equal(s2.childExitCode, 0);
assert.equal(s2.subjectCount, 6); assert.equal(s2.sampleCount, 13286); assert.equal(s2.retainedInputs.length, 12);
assert(s2.sources.length > 0 && s2.sources.every(row => row.sha256 === row.afterSha256));
matches(s2.sources, source.s2Sources);
const filmFile = file(result.native.film), sheetFile = file(result.sheet), prior = draft.items.find(row => row.item === 12);
assert(prior && prior.selectionStatus === 'PENDING');
const completed = {
  item: 12, name: 'Centipede', selectionStatus: 'LOCAL_TECHNICAL_PASS_SIGNING_PENDING', packet: rel(itemDir), readme: prior.readme,
  signedResultCommit: null, signingStatus: 'PENDING_SIGNING', result: rel(resultFile), fit: rel(fit), master: rel(masterFile), reviewSheet: rel(sheetFile),
  static: { report: rel(staticFile), sourceReceipt: rel(sourceReceiptFile), status: stat.status, sourceHead: stat.sourceHead, actionRows: stat.rows.length, actionIds: stat.rows.map(row => row.id), samplesPerAction: [...new Set(stat.rows.map(row => row.samples))], presentationRows: 1, presentationSamples: stat.presentation.samples, totalRowsIncludingPresentation: stat.rows.length + 1, exactPoseRest: stat.exactRest, sourcePixelRest: stat.sourcePixelRest },
  native: { report: rel(nativeFile), film: rel(filmFile), runId: native.runId, orchestrationRunId: native.runId, status: native.status, recordedSourceHead: native.source, denseRefusals: native.gates.refusals, liveRefusals: native.capture.refusalsAtEnd, liveFrames: native.capture.frames, liveDurationMs: native.capture.durationMs, encodedMedia: native.capture.encodedMedia, cpu: { perRigP95Ms: native.capture.perRigUpdateP95Ms, wholeStageP95Ms: native.capture.cpuP95Ms, perRigLimitMs: native.paintedTier.limitMs, scope: native.capture.timingScope } },
  sourceCheck: rel(sourceFile), s2: { evidence: rel(s2File), status: s2.status, subjects: s2.subjectCount, samples: s2.sampleCount, protectedInputs: s2.retainedInputs.length },
  recordRecipeHash: record.recipeHash, bindingAuthorityHash: binding.bindingHash, masterSha256FromRecord: record.geometry.cutoutAssetHash,
  artAcceptance: 'Nick review pending; technical PASS does not replace art acceptance.', note: 'Signing is pending. This index makes no inferred signed-commit, clean-source or PR43 certification claim.'
};
const index = { ...draft, schema: 'cf.final-sprint-index/v1', status: '13_TECHNICAL_PASS_SIGNING_PENDING', acceptedTechnicalSelections: 13, pendingItems: [], pendingSigningItems: [12], items: draft.items.map(row => row.item === 12 ? completed : row), indexEvidence: { draft: rel(draftFile), draftSha256: sha(draftFile), result: rel(resultFile), resultSha256: sha(resultFile), scope: 'Retained report consistency and selected artifact hashes checked; no measurements, test runs or signature verification performed by this writer. Other twelve rows preserved exactly.' } };
assert.equal(JSON.stringify(index.items.filter(row => row.item !== 12)), JSON.stringify(draft.items.filter(row => row.item !== 12)));
const link = (label, target) => `[${label}](<${path.relative(sprintDir, file(target, repo)).split(path.sep).join('/')}>)`;
const gallery = ['# Sprint review index', '', 'Thirteen retained technical selections; Centipede signing and Nick’s art review remain pending. Historical sources and CPU scopes are preserved in final-sprint-index.json.', ''];
for (const row of index.items) {
  const links = [['Packet', row.readme], ['Master', row.master], ['Review sheet', row.reviewSheet], ['Film', row.native?.film]].filter(([, target]) => typeof target === 'string').map(([label, target]) => link(label, target));
  for (const [n, target] of (row.reviewImages ?? []).entries()) if (typeof target === 'string') links.push(link(`Evidence image ${n + 1}`, target));
  gallery.push(`- **${row.item}. ${row.name}** — ${links.join(' · ')}`);
}
const output = path.join(sprintDir, 'final-sprint-index.json'), galleryOutput = path.join(sprintDir, 'final-sprint-review-index.md');
assert(!fs.existsSync(output) && !fs.existsSync(galleryOutput), 'Refusing to overwrite an existing final index');
fs.writeFileSync(output, JSON.stringify(index, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(galleryOutput, gallery.join('\n') + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: index.status, index: rel(output), reviewIndex: rel(galleryOutput), signedResultCommit: null }));
