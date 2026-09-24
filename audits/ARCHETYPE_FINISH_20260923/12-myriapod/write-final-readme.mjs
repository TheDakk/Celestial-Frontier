/** Prepared only; execute after result.json exists and final source acceptance is sealed.
 * Reads retained evidence, writes README/HISTORY plus its own receipt. No rig or test runs.
 * If either guarded live document changes, review and update the expected hash deliberately.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const base = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(base, '../../..');
const EXPECTED_README_SHA256 = 'c1c5b0b3f5a65249a10b11ea55839de55c51a3b5ee8ccf6dddf432f41b07ef2b';
const EXPECTED_HISTORY_SHA256 = '7d402740ef8b3ca4fd8bdd426366675c3b8b283bdc162c246ec062b42c776314';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = file => fs.readFileSync(file);
const sha = file => hash(bytes(file));
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const owned = relative => {
  assert.equal(typeof relative, 'string');
  const file = path.resolve(base, relative);
  assert(file.startsWith(base + path.sep), `Expected packet-owned path: ${relative}`);
  return file;
};
const sourcePath = value => path.isAbsolute(value) ? value : path.resolve(repository, value);
const rel = file => path.relative(base, file).split(path.sep).join('/');
const link = (file, label = rel(file)) => {
  assert(fs.existsSync(file), `Missing referenced artifact: ${file}`);
  return `[${label}](${rel(file).replaceAll(' ', '%20')})`;
};
const oneLine = value => String(value).replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
const code = value => '`' + String(value).replaceAll('`', '\\`') + '`';
const finite = (value, name) => {
  assert(Number.isFinite(value), `Missing measured ${name}`);
  return value;
};
const firstError = row => row.firstRefusal?.error?.split('\n')[0] ?? 'No first-refusal text emitted';
const readmeFile = owned('README.md'), historyFile = owned('HISTORY.md');
const readmeBefore = bytes(readmeFile), historyBefore = bytes(historyFile);
assert.equal(hash(readmeBefore), EXPECTED_README_SHA256, 'README changed: review and deliberately update its exact guard before writing');
assert.equal(hash(historyBefore), EXPECTED_HISTORY_SHA256, 'HISTORY changed: review and deliberately update its exact guard before writing');
const receiptFile = owned('readme-generation-01.json');
assert(!fs.existsSync(receiptFile), 'README generation receipt already exists; do not repeat');

const resultFile = owned('result.json'), result = json(resultFile);
assert.equal(result.status, 'PASS_LOCAL', 'Final result must exist and be PASS_LOCAL');
const staticFile = owned(result.static.report), stat = json(staticFile);
const staticSourceFile = owned(result.static.report + '.sources.json');
assert(fs.existsSync(staticSourceFile));
assert.equal(stat.status, 'PASS_STATIC');
assert.equal(stat.exactRest, true);
assert.equal(stat.sourcePixelRest.status, 'PASS');
assert.equal(stat.sourcePixelRest.changedVisibleRgbaChannels, 0);
assert(stat.rows.length && stat.rows.every(row => row.status === 'PASS'));
assert.equal(stat.presentation.status, 'PASS');
assert.equal(stat.recordRecipeHash, result.recipeHash);
assert.equal(stat.bindingHash, result.bindingHash);
assert.equal(stat.rows.length, result.static.actions);
assert.equal(stat.presentation.samples, result.static.presentationSamples);
const input = basename => {
  const rows = stat.inputs.filter(row => path.basename(row.path) === basename);
  assert.equal(rows.length, 1, `Expected one static ${basename} input`);
  const file = sourcePath(rows[0].path);
  assert.equal(sha(file), rows[0].sha256, `Measured input changed: ${file}`);
  return file;
};
const recordFile = input('record.json'), bindingFile = input('binding.json');
const fit = path.dirname(recordFile), fitProvenanceFile = path.join(fit, 'intake-provenance.json');
const fitProvenance = json(fitProvenanceFile), fitReceiptFile = path.join(fit, 'receipt.json');
const fitReceipt = json(fitReceiptFile), record = json(recordFile);
const selectedMaster = sourcePath(record.source), candidate = path.dirname(selectedMaster);
assert(candidate.startsWith(base + path.sep), 'Selected master must identify the actual local candidate');
const selectedNames = ['master.png', 'authoring.json', 'prompt.txt', 'request.json', 'generation-receipt.json', 'subject-source.json', 'presence.json'];
const selected = selectedNames.map(name => ({ name, file: path.join(candidate, name), sha256: sha(path.join(candidate, name)) }));
assert.equal(sha(selectedMaster), result.masterSha256);
assert.equal(sha(path.join(candidate, 'prompt.txt')), result.promptSha256);
for (const row of fitProvenance.inputs) assert.equal(sha(sourcePath(row.path)), row.sha256, `Fit source changed: ${row.path}`);
assert(fitProvenance.inputs.some(row => sourcePath(row.path) === selectedMaster), 'Selected candidate is not measured fit source');
const authoring = json(path.join(candidate, 'authoring.json'));
const presence = json(path.join(candidate, 'presence.json'));
const generation = json(path.join(candidate, 'generation-receipt.json'));
assert.equal(generation.masterSha256, result.masterSha256);
const originalIntegrity = json(owned('candidate-03/master-integrity.json'));
assert.equal(originalIntegrity.sha256, result.masterSha256, 'A different selected painting needs its own measured integrity reference');
const nativeFile = owned(result.native.report), native = json(nativeFile);
assert.equal(native.status, 'DIAGNOSTIC_PASS');
assert.equal(native.runId, result.native.runId);
assert.deepEqual(native.capture.refusalsAtEnd, result.native.refusals);
for (const side of ['left', 'right']) {
  assert.equal(native.capture.refusalsAtEnd[side], 0);
  assert.equal(native.gates.refusals[side], 0);
  finite(native.capture.perRigUpdateP95Ms[side], `${side} native CPU p95`);
}
const wholeCpu = finite(native.capture.cpuP95Ms, 'whole-stage native CPU p95');
const cpuLimit = finite(native.paintedTier.limitMs, 'native painted-tier limit');
const filmFile = owned(result.native.film), sheetFile = owned(result.sheet);
assert(fs.existsSync(filmFile) && fs.existsSync(sheetFile));
const sourceCheckFile = owned(result.sourceCheck), sourceCheck = json(sourceCheckFile);
assert(Object.values(sourceCheck).filter(Array.isArray).every(rows => rows.every(row => row.unchanged === true)), 'Source closure contains a changed input');
const s2File = owned(result.s2.evidence), s2 = json(s2File);
assert.equal(s2.status, 'PASS_STATIC_IDENTICAL');
assert.equal(result.s2.status, 'PASS_STATIC_IDENTICAL');
const identity = json(path.join(path.dirname(s2File), 's2/identity.json'));
assert(identity.every(row => row.receiptIdentical && row.samplesIdentical));
assert.equal(result.s2.subjects, identity.length);
assert.equal(result.s2.samples, identity.reduce((sum, row) => sum + row.sampleCount, 0));
assert.equal(result.s2.protectedInputs, s2.retainedInputs.length);
const ssh = json(owned('push-preflight-01.json'));
const sshRepository = json(owned('push-preflight-repository-refusal-01.json'));
assert.equal(ssh.sshAuthentication.status, 'REFUSED');
assert.equal(sshRepository.pushAttempted, false);

const lines = [];
const add = (...values) => lines.push(...values);
add('# Centipede — completed local technical evidence', '',
  '**Completed technical evidence; the containing signed commit is the final authority.** This README asserts measured local results only. It does not assert that signing or the requested final push has succeeded. Nick’s art review remains separate.', '',
  `${link(resultFile, 'Result')} selects ${code(path.basename(candidate))}/${code(path.basename(fit))}. Static source head: ${code(stat.sourceHead)}. Native recorded source: ${code(native.source)}. Exact consumed-source closure: ${link(sourceCheckFile)}. These results do not certify PR43 or extend the historical I5 certificate to later source.`, '',
  '## Measured outcome', '',
  '| Evidence | Measured result |', '|---|---|',
  `| Static | ${stat.rows.length} action rows; ${oneLine(stat.settings.samplesPerAction)} samples per action; ${stat.presentation.samples} separate presentation samples; all PASS |`,
  `| Pose rest | ${stat.exactRest ? 'Exact PASS' : 'FAIL'} |`,
  `| Source-pixel rest | ${stat.sourcePixelRest.changedVisibleRgbaChannels} changed visible RGBA channels; ${oneLine(stat.sourcePixelRest.scope)} |`,
  `| Native run | ${code(native.runId)}; dense refusals ${native.gates.refusals.left}/${native.gates.refusals.right}; live refusals ${native.capture.refusalsAtEnd.left}/${native.capture.refusalsAtEnd.right} |`,
  `| Live capture | ${finite(native.capture.frames, 'live frames')} frames; ${finite(native.capture.durationMs, 'live duration')} ms |`,
  `| Desktop per-rig CPU p95 | left ${native.capture.perRigUpdateP95Ms.left} ms; right ${native.capture.perRigUpdateP95Ms.right} ms; limit ${cpuLimit} ms |`,
  `| Whole-stage CPU p95 | ${wholeCpu} ms; a separate scope from either per-rig number |`,
  `| S2 | ${result.s2.subjects} subjects; ${result.s2.samples} identical support samples; ${result.s2.protectedInputs} protected inputs unchanged |`, '',
  `CPU scope: ${typeof native.capture.timingScope === 'string' ? native.capture.timingScope : JSON.stringify(native.capture.timingScope)}. ` +
  (['left', 'right'].every(side => native.capture.perRigUpdateP95Ms[side] <= cpuLimit)
    ? 'Both measured per-rig values are within the recorded limit.'
    : 'At least one measured per-rig value exceeds the recorded limit; the measured values above are retained honestly.'), '',
  `${link(staticFile)} · ${link(staticSourceFile, 'Static sources')} · ${link(nativeFile, 'Native report/browser/source evidence')} · ${link(s2File, 'Final S2 execution')} · ${link(filmFile, 'Battle2 film')} · ${link(sheetFile, 'Master, labels, fit and film review sheet')}`, '',
  '## Selected source and authorities', '',
  `Generation run: ${code(generation.runId)}. Candidate copies retain the same painting and generation receipt; they are not additional generation calls. Parent-authored presence: ${presence.appendages.walkingLegPairs} walking pairs and ${presence.appendages.ultimateLegPairs} ultimate pair(s); absent=${code(JSON.stringify(presence.absent))}, hidden=${code(JSON.stringify(presence.hidden))}, folded=${code(JSON.stringify(presence.folded))}.`, '',
  `Record recipe: ${code(result.recipeHash)}. Binding authority: ${code(result.bindingHash)}.`, '',
  '| Input | SHA-256 |', '|---|---|');
for (const row of selected) add(`| ${link(row.file, row.name)} | ${code(row.sha256)} |`);
add(`| ${link(recordFile, 'Measured record.json')} | ${code(sha(recordFile))} |`,
  `| ${link(bindingFile, 'Measured binding.json')} | ${code(sha(bindingFile))} |`, '',
  `${link(fitProvenanceFile, 'IC-3/authoring provenance')} · ${link(fitReceiptFile, 'Intake/masks/observed-split/regional receipt')} · ${link(owned('candidate-03/presence-author.md'), 'Manual presence explanation')} · ${link(owned('candidate-03/visual-review.md'), 'Independent count/source review')}.`, '',
  `Selected source declares ${Object.keys(authoring.landmarksPx).length} joint landmarks, ${Object.keys(authoring.fixedAttachmentsPx).length} fixed source sockets, ${authoring.parts.length} texture owners and ${fitProvenance.contactEndpoints.length} walking contact endpoints. Existing joint/part ceilings and numerical motion/contact gates were not widened.`, '',
  '## Representation and runtime repair', '',
  `The explicitly selected stone-centipede representative retains the generic Centipede genome and visual key. ${link(owned('original-subject-source.json'), 'Original subject')} preserves the earlier scolopendrid interpretation. ${link(owned('model-decision.md'), 'Model decision')} and ${link(owned('fixed-socket-design.md'), 'Fixed-socket design')} describe the opt-in rigid trunk and real two-span walking limbs. Fixed sockets add no pose degrees of freedom; painted plates do not claim the legacy eight-segment wave. Legacy records retain their old model.`, '',
  'The compact-only toward-socket swing convention preserves the existing lift magnitude/timing and corrects its direction for upper-projected far limbs. The shared contact selector preserves runtime arithmetic and strict tie order so the writer pins the same observed support. No accepted binding is rewritten; contact tolerances and inherited root/contact pins remain unchanged. Source ownership repairs and existing local mesh refinement separate moving limb bends from genuine body collars.', '',
  'The general painted-support fallback now tries a geometric candidate only after the established iteration fails or leaves excessive residual. Mixed and foreign weights remain in the final whole-ensemble LBS measurement; original reach, limits, compression, endpoint and painted tolerances still decide acceptance. The compact model declares two source-step substeps for hit/dodge/tame only, preserving the exact cached body displacement, original key amplitudes, clock, endpoints and other actions.', '',
  'Native01 refused viewport containment before any film or CPU measurement. Native rest sizing had excluded alpha1–8 pixels while published geometry retained them: the old rest-height input was460px, but retained positive alpha spans1148px. The native sizing helper now includes every nonzero alpha byte; original pixels, mass formula, ground registration and final containment/CPU gates remain unchanged. The selected later native report below qualifies the changed harness source.', '',
  `${link(owned('final-code-review.md'), 'Source review')} is a read-only review, not an additional measurement. ${link(owned('regional-selftest-01-findings.md'), 'Regional compiler controls')} applies to its synthetic fixture; actual candidate acceptance comes from the reports above. Historical proposal files describe their status at creation and do not override final consumed source.`, '',
  '## Retained attempts and refusal chronology', '',
  `The old capacity refusals and original painting remain in ${link(path.resolve(base, '../../ARCHETYPE_REPAIRS_20260922/12-myriapod/README.md'), 'the signed repair packet')}. ${link(owned('visual-review02.md'), 'Paint02 count refusal')} retains the rejected missing-far-leg source; selected paint03 resolves the observed inventory count. It still misses the requested art margin. No previous result is rebound to new source.`, '',
  '| Intake | Retained outcome |', '|---|---|');
for (const name of fs.readdirSync(base).filter(name => /^fit-\d+$/.test(name)).sort()) {
  const dir = owned(name), refusal = path.join(dir, 'refusal.json'), provenance = path.join(dir, 'intake-provenance.json');
  if (fs.existsSync(refusal)) {
    const r = json(refusal);
    add(`| ${link(refusal, name)} | ${oneLine(r.stage)}: ${oneLine(r.error.split('\n')[0])} |`);
  } else if (fs.existsSync(provenance)) {
    const p = json(provenance);
    add(`| ${link(provenance, name)} | ${oneLine(p.status)}; compilation alone is not static/native acceptance |`);
  }
}
add('', '| Static report | Retained outcome |', '|---|---|');
for (const name of fs.readdirSync(base).filter(name => /^static-\d+\.json$/.test(name)).sort()) {
  const file = owned(name), report = json(file);
  const failed = [...report.rows, report.presentation].filter(row => row.status !== 'PASS');
  const details = failed.length ? failed.map(row => `${row.id} at ${row.firstRefusal?.ms ?? 'time not emitted'} ms: ${firstError(row)}`).join('; ') : `${report.rows.length} action rows and presentation PASS`;
  add(`| ${link(file, name)} | ${oneLine(report.status)} — ${oneLine(details)} |`);
}
add('', '| Native attempt | Retained outcome |', '|---|---|');
for (const name of fs.readdirSync(base).filter(name => /^native-\d+$/.test(name)).sort()) {
  const file = path.join(base, name, 'report.json');
  if (!fs.existsSync(file)) continue;
  const report = json(file);
  const dense = report.gates?.refusals, live = report.capture?.refusalsAtEnd;
  const counts = value => value ? `${value.left}/${value.right}` : 'not emitted';
  add(`| ${link(file, name)} | ${oneLine(report.status)}; dense refusals ${counts(dense)}; live refusals ${counts(live)}; run ${code(report.runId ?? 'not emitted')} |`);
}
add('', 'Static01 exposed wrong swing direction, support-selection disagreement and near4 fringe ownership. Static02/03 and their exact replays exposed additional fully pinned source-target inversions. The consolidated target-only scan covered only hit/dodge/tame; it was not another full acceptance battery. The parent then qualified the actual final source separately.', '',
  'Candidate09 applies five diagnosed near shaft/fringe corrections together and consistent 8/32 local sampling with ±8 observed bend cores across the far row. Genuine brown trunk collars stay body-owned. Far8/11 were included for comparable observed short spans, not invented failures. All source pixels, landmarks, sockets and contact definitions were preserved. Later source amendments, if selected, remain explicitly linked below.', '');
for (const name of fs.readdirSync(base).filter(name => /^candidate-\d+$/.test(name)).sort()) {
  for (const document of ['visual-review.md', 'mask-diagnosis.md', 'regional-decision.md', 'change-review.md', 'source-change-receipt.json']) {
    const file = path.join(base, name, document);
    if (fs.existsSync(file)) add(`- ${link(file, `${name}/${document}`)}`);
  }
}
add('', 'The first compact body-attack inventory test refusal, earlier type-check refusals, exact source diagnostics and all later execution logs remain retained. This generated README does not reinterpret a log as a pass or repeat any execution.', '');
for (const name of fs.readdirSync(base).filter(name => /\.log$/.test(name)).sort()) add(`- ${link(owned(name), name)}`);
add('', '## Art and provenance limitations', '',
  `The original measured master is ${originalIntegrity.width}×${originalIntegrity.height}. ${link(owned('candidate-03/master-integrity.json'), 'Master integrity')} records positive-alpha bounds ${code(JSON.stringify(originalIntegrity.positiveAlpha.bounds))}, margins ${code(JSON.stringify(originalIntegrity.positiveAlpha.margins))}, and ${originalIntegrity.positiveAlpha.borderPixels} border pixels. The requested 101px margin is missed. Diagnostic alpha>=128 bounds are not used to trim the source. Red/faint generated fringe and every delivered pixel remain for Nick’s art review.`, '',
  'The exposed far leg row projects above the rigid trunk in stylized elevated lateral/diagrammatic art. It does not establish a biologically exact common ground plane. Internal centers and fixed sockets are manual source-space estimates; multi-segment painted limbs use a two-span approximation. Ultimate appendages are individually controlled, non-walking appendages. Technical PASS does not replace human art acceptance.', '',
  'The paint03 generation receipt predates independent count approval and keeps its historical “pending” text. Copied coverage notes describe earlier authoring prototypes; final regional arrays/receipts are the authority. Same-source landmarks retained across candidates are not fresh image observations or guide coordinates. Exact pose/source-pixel rest is distinct from biological correctness.', '',
  '## Retained 1Password/SSH refusals and handoff', '',
  `${link(owned('push-preflight-01.json'), 'Authentication preflight')} returned exit ${ssh.sshAuthentication.exitCode}:`, '', '```text', ssh.sshAuthentication.error, '```', '',
  `${link(owned('push-preflight-repository-refusal-01.json'), 'Repository preflight')} returned exit ${sshRepository.exitCode}:`, '', '```text', sshRepository.error, '```', '',
  `${link(owned('ssh-effective-config-01.json'), 'Effective SSH configuration')} records the 1Password IdentityAgent. That read-only inspection did not resolve authentication. The two historical refusals remain exact; this generator performs no authentication, signing or push and asserts no later outcome. Consult separate renewed-authority success/refusal receipts and the final root handoff for actual Git status.`, '',
  'Codex seals and signs the completed item, verifies the actual signature, then performs only the authorized final normal openai/mac push and reports its real outcome. Claude consumes the signed completion packet under Nick’s integration direction; its lane remains read-only here. Nick reviews art and need not open Claude until the signed handoff is ready. No fetch/sync, PR, label, hosted attempt, merge, release or deploy is implied. I5 remains bound only to its recorded clean source; there is no PR43 certification claim.', '');

const readmeAfter = Buffer.from(lines.join('\n'));
const historyAfter = Buffer.concat([
  Buffer.from('# Preserved live README before final technical closure\n\n'),
  readmeBefore,
  Buffer.from('\n\n'),
  historyBefore,
]);
// Recheck exact source guards immediately before any document mutation.
assert.equal(sha(readmeFile), EXPECTED_README_SHA256);
assert.equal(sha(historyFile), EXPECTED_HISTORY_SHA256);
const readmeTemporary = owned('README.final-pending.tmp'), historyTemporary = owned('HISTORY.final-pending.tmp');
assert(!fs.existsSync(readmeTemporary) && !fs.existsSync(historyTemporary));
fs.writeFileSync(readmeTemporary, readmeAfter, { flag: 'wx' });
fs.writeFileSync(historyTemporary, historyAfter, { flag: 'wx' });
// Preserve old prose before replacing the live handoff. A failure never discards it.
fs.renameSync(historyTemporary, historyFile);
fs.renameSync(readmeTemporary, readmeFile);
fs.writeFileSync(receiptFile, JSON.stringify({
  schema: 'cf.final-readme-generation/v1',
  scope: 'Evidence reads and guarded documentation writes only; no rig/test/browser/Git execution',
  resultSha256: sha(resultFile),
  staticReport: rel(staticFile), nativeReport: rel(nativeFile), selectedCandidate: rel(candidate),
  readmeBeforeSha256: EXPECTED_README_SHA256, readmeAfterSha256: hash(readmeAfter),
  historyBeforeSha256: EXPECTED_HISTORY_SHA256, historyAfterSha256: hash(historyAfter),
  archivedReadmeVerbatim: historyAfter.includes(readmeBefore),
  selectedSources: selected.map(({ name, sha256 }) => ({ name, sha256 })),
  signedCommitAsserted: false, pushAsserted: false,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ readme: rel(readmeFile), history: rel(historyFile), receipt: rel(receiptFile), result: result.status }));
