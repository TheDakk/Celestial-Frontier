/** Read-only source/data isolation proof. Does not import or execute game code,
 * invoke a solver, replay a sample, launch a browser, or rerun S2. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = '/Users/nick/Projects/celestial-frontier-openai-mac';
const output = path.join(here, 'final-admission-isolation01.json');
assert(!fs.existsSync(output), 'Fresh isolation receipt required');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFileSync(name);
const json = name => JSON.parse(read(name));
const priorPath = path.join(here, 's2-execution.json');
const prior = json(priorPath);
const nativePath = path.join(here, '../native-01/report.json');
const native = json(nativePath);
const familyPath = path.join(root, 'port/v2/tools/creature-animation/family-record.mjs');
const rigPath = path.join(root, 'port/v2/apps/game/src/creature-rig.ts');
const result = {
  schema: 'cf.s2-final-admission-isolation/v1',
  status: 'PENDING',
  command: [process.execPath, fileURLToPath(import.meta.url)],
  helperSha256: sha(read(fileURLToPath(import.meta.url))),
  priorS2Execution: {path: priorPath, sha256: sha(read(priorPath))},
  nativeWhitespaceAuthority: {path: nativePath, sha256: sha(read(nativePath))},
  proofKind: 'Read-only source hashes, exact reversible text edits, and JSON input predicates',
  gameCodeImported: false, solverExecuted: false, samplesReplayed: 0,
  postGuardS2Run: false, browser: false,
};

function compareInventory(entries) {
  assert.equal(new Set(entries.map(s => s.path)).size, entries.length, 'Unique consumed file paths');
  return entries.map(s => {
    if (s.afterSha256 !== undefined) assert.equal(s.afterSha256, s.sha256, 'Prior execution source drift');
    const currentSha256 = sha(read(s.path));
    return {path: s.path, measuredSha256: s.sha256, currentSha256, unchanged: currentSha256 === s.sha256};
  });
}
function reverseExactly(current, replacements) {
  let previous = current;
  for (const replacement of replacements) {
    assert.equal(previous.split(replacement.current).length - 1, 1, 'Unique reverse edit: ' + replacement.id);
    previous = previous.replace(replacement.current, replacement.measured);
  }
  let restored = previous;
  for (const replacement of replacements) {
    assert.equal(restored.split(replacement.measured).length - 1, 1, 'Unique forward edit: ' + replacement.id);
    restored = restored.replace(replacement.measured, replacement.current);
  }
  assert.equal(restored, current, 'Exact forward/reverse round trip');
  return previous;
}

try {
  assert.equal(prior.status, 'PASS_STATIC_IDENTICAL');
  assert.equal(prior.subjectCount, 6);
  assert.equal(prior.sampleCount, 13286);
  const identityPath = path.join(here, 's2/identity.json');
  assert.equal(sha(read(identityPath)), prior.identitySha256);
  const identities = json(identityPath);
  assert.equal(identities.length, 6);
  assert(identities.every(s => s.receiptIdentical && s.samplesIdentical));
  assert.equal(identities.reduce((n, s) => n + s.sampleCount, 0), 13286);
  result.retainedMeasurement = {status: prior.status, subjectCount: 6, sampleCount: 13286,
    identityPath, identitySha256: prior.identitySha256,
    qualification: 'Measured on prior source bytes; this receipt is a source-isolation proof, not another S2 execution'};

  result.s2ConsumedFiles = compareInventory(prior.sources);
  assert.deepEqual(result.s2ConsumedFiles.filter(s => !s.unchanged).map(s => s.path), [familyPath]);
  assert(!prior.sources.some(s => s.path === rigPath), 'Rig publication owner was not consumed by S2');
  result.nativeConsumedFiles = compareInventory(native.sources);
  assert.deepEqual(result.nativeConsumedFiles.filter(s => !s.unchanged).map(s => s.path).sort(), [familyPath, rigPath].sort());

  const familyEdits = [
    {id: 'legacy-check-geometry-admission-guard',
      current: " if(record?.template?.id==='quadruped'&&!record.anatomy){need(!Object.hasOwn(record.geometry??{},'contactPads'),'terminal pads require family anatomy admission');return checkQuadruped(record,alpha);}",
      measured: " if(record?.template?.id==='quadruped'&&!record.anatomy)return checkQuadruped(record,alpha);"},
    {id: 'legacy-admit-record-admission-guard',
      current: " if(template.id==='quadruped'&&!record.anatomy){need(!Object.hasOwn(record.geometry??{},'contactPads'),'terminal pads require family anatomy admission');await admitQuadruped(record,cutoutBytes,alpha);return template;}",
      measured: " if(template.id==='quadruped'&&!record.anatomy){await admitQuadruped(record,cutoutBytes,alpha);return template;}"},
  ];
  const familyCurrent = read(familyPath).toString('utf8');
  const familyPrevious = reverseExactly(familyCurrent, familyEdits);
  const familyAuthority = prior.sources.find(s => s.path === familyPath);
  assert(familyAuthority);
  assert.equal(sha(familyPrevious), familyAuthority.sha256, 'Only the two exact guard insertions changed');
  const rigEdits = [{id: 'blank-line-four-space-cleanup',
    current: '      if(contacts){contactEvidence.samples+=contacts.length;contactEvidence.maxPaintDriftPx=Math.max(contactEvidence.maxPaintDriftPx,contactMax);}\n\n  };',
    measured: '      if(contacts){contactEvidence.samples+=contacts.length;contactEvidence.maxPaintDriftPx=Math.max(contactEvidence.maxPaintDriftPx,contactMax);}\n    \n  };'}];
  const rigCurrent = read(rigPath).toString('utf8');
  const rigPrevious = reverseExactly(rigCurrent, rigEdits);
  const rigAuthority = native.sources.find(s => s.path === rigPath);
  assert(rigAuthority);
  assert.equal(sha(rigPrevious), rigAuthority.sha256, 'Only four blank-line spaces changed');
  result.reversibleSourceChanges = [
    {path: familyPath, measuredSha256: familyAuthority.sha256, currentSha256: sha(familyCurrent),
      reconstructedMeasuredSha256: sha(familyPrevious), exactRoundTrip: true, replacements: familyEdits},
    {path: rigPath, measuredSha256: rigAuthority.sha256, currentSha256: sha(rigCurrent),
      reconstructedMeasuredSha256: sha(rigPrevious), exactRoundTrip: true, replacements: rigEdits,
      qualification: 'Independent native01 whitespace proof; this file was not consumed by the prior S2 execution'},
  ];

  assert.equal(prior.retainedInputs.length, 12);
  assert.equal(new Set(prior.retainedInputs.map(s => s.path)).size, 12);
  result.retainedInputs = compareInventory(prior.retainedInputs);
  assert(result.retainedInputs.every(s => s.unchanged), 'All twelve sentinel input hashes unchanged');
  const records = prior.retainedInputs.filter(s => path.basename(s.path) === 'record.json');
  assert.equal(records.length, 6);
  assert.equal(prior.retainedInputs.filter(s => path.basename(s.path) === 'binding.json').length, 6);
  result.recordGuardPredicates = records.map(s => {
    const record = json(s.path);
    const anatomyTruthy = !!record.anatomy;
    const contactPadsOwnProperty = Object.hasOwn(record.geometry ?? {}, 'contactPads');
    const legacyBranchByDeclaredTemplate = record.template?.id === 'quadruped' && !anatomyTruthy;
    const rejectionPredicate = legacyBranchByDeclaredTemplate && contactPadsOwnProperty;
    // No resolved-template execution is needed: the inserted need() predicate
    // succeeds for every record, regardless of which branch can reach it.
    assert.equal(contactPadsOwnProperty, false, 'No retained record declares terminal pads');
    assert.equal(rejectionPredicate, false);
    if (anatomyTruthy) assert.equal(legacyBranchByDeclaredTemplate, false);
    return {path: s.path, templateId: record.template?.id, anatomyTruthy,
      contactPadsOwnProperty, legacyBranchByDeclaredTemplate, rejectionPredicate,
      insertedNeedArgument: !contactPadsOwnProperty};
  });

  for (const entry of [...result.s2ConsumedFiles, ...result.nativeConsumedFiles, ...result.retainedInputs])
    assert.equal(sha(read(entry.path)), entry.currentSha256, 'File changed during isolation proof: ' + entry.path);
  result.counts = {s2ConsumedFiles: result.s2ConsumedFiles.length,
    s2UnchangedFiles: result.s2ConsumedFiles.filter(s => s.unchanged).length,
    s2ChangedFiles: 1, nativeConsumedFiles: result.nativeConsumedFiles.length,
    nativeChangedFiles: 2, unchangedInputs: 12, records: 6, bindings: 6};
  result.scope = 'The only S2-consumed source delta is two admission guards whose own-property rejection condition is false on all six unchanged records. Every remaining byte in family-record.mjs reconstructs the measured hash, and every other consumed file hash is unchanged. Pose/solver math bodies and sentinel inputs are unchanged. This does not claim byte-identical final source, a post-guard S2 run, or new native CPU measurements.';
  result.status = 'PASS_SOURCE_ISOLATION';
} catch (error) {
  result.status = 'FAIL_SOURCE_ISOLATION';
  result.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  result.recordedAt = new Date().toISOString();
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
}
console.log(JSON.stringify({status: result.status, counts: result.counts, output}));
