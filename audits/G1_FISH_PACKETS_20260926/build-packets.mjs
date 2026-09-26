/** Durable candidate packets for the first fully automatic creatures (Perch, Cod, Carp), per Codex's C49 contract
 * (audits/C49_FISH_REVIEW_20260926/packet-contract.json, status PROPOSED_NOT_RUNTIME_AUTHORITY). A packet ADMITS NOTHING: runtime
 * authority comes only from the existing registry/library/build-pin owners, after Nick's visual decision on these exact bytes.
 * For each fish this copies, byte for byte and hash-checked, the final welded fit (29 files) and the native evidence (report, full
 * film, 18 named stills), re-derives the weld from the retained pre-split binding and the recorded pair list (must reproduce the final
 * binding file byte for byte), and writes manifest.json with identity, required hashes, a per-file inventory with durable locations,
 * the weld receipt, provenance and evidence references. The master is NOT copied: record.source points at an ignored auto-packet copy,
 * so the manifest binds it to the byte-identical TRACKED G2 master instead (record unchanged; relocating it would need a new record).
 * Run from the repository root: node audits/G1_FISH_PACKETS_20260926/build-packets.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto'; import { createRequire } from 'node:module';
import { splitObservedSurfaces } from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import { createSourceJoinProbe } from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import { familyContactChains, familyContractForRecord } from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const ROOT = path.resolve(import.meta.dirname, '../..'), HERE = import.meta.dirname, rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const req = createRequire(ROOT + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha = (b) => createHash('sha256').update(b).digest('hex'), shaF = (f) => sha(fs.readFileSync(f));
const W = path.join(ROOT, 'audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish'), AUTO = path.join(ROOT, 'audits/G1_AUTO_AUTHOR_20260926/auto-g2fam-v10'), G2 = path.join(ROOT, 'audits/G2_FAMILY_PILOT_20260926'), C49 = path.join(ROOT, 'audits/C49_FISH_REVIEW_20260926');
const walk = (d, base = d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name)).split(path.sep).join('/')]).sort();
const PRODUCERS = ['port/v2/tools/creature-animation/split-observed-surfaces.mjs', 'port/v2/tools/quadruped-proof/source-join-continuity.mjs', 'port/v2/tools/creature-animation/family-contracts.mjs', 'audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/weld-pairs.mjs', 'audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/greedy.sh', 'audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/adjjson.mjs', 'port/v2/tools/anatomy-verify/auto-author.mjs', 'port/v2/tools/anatomy-verify/limb-counter.mjs', 'port/v2/tools/creature-animation/intake-authored.mjs'];
const summary = [];
for (const id of ['07-perch', '08-cod', '09-carp']) {
  const src = path.join(W, 'pairs', id + '-final'), out = path.join(HERE, id); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  // 1. copy fit + native byte for byte
  const inventory = [];
  for (const [from, to] of [['fit', 'fit'], ['native', 'native']]) for (const f of walk(path.join(src, from))) {
    const a = path.join(src, from, f), b = path.join(out, to, f); fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b);
    const h = shaF(b); if (h !== shaF(a)) throw Error('copy mismatch ' + f); inventory.push({ relativePath: to + '/' + f, bytes: fs.statSync(b).size, sha256: h, durableLocation: rel(b) }); }
  for (const f of ['static.json', 'weld-receipt.json']) { const a = path.join(src, f), b = path.join(out, 'evidence', f); fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); inventory.push({ relativePath: 'evidence/' + f, bytes: fs.statSync(b).size, sha256: shaF(b), durableLocation: rel(b) }); }
  const fit = path.join(out, 'fit'), J = (n) => JSON.parse(fs.readFileSync(path.join(fit, n), 'utf8'));
  const record = J('record.json'), binding = J('binding.json'), pre = J('pre-split-binding.json'), manifest = J('parts/manifest.json'), weld = JSON.parse(fs.readFileSync(path.join(src, 'weld-receipt.json'), 'utf8'));
  // 2. the master: bind the record's cut-out hash to the byte-identical TRACKED G2 master (the record is not edited)
  const g2Master = path.join(G2, id, 'master.png'), masterSha = shaF(g2Master);
  if (masterSha !== record.geometry.cutoutAssetHash) throw Error(id + ': tracked G2 master is not the record cut-out');
  const recordSourceCopy = path.join(ROOT, record.source), recordSourceMatches = fs.existsSync(recordSourceCopy) ? shaF(recordSourceCopy) === masterSha : null;
  // 3. re-derive the weld from the retained pre-split binding and the recorded ordered pairs: must reproduce the final binding bytes
  const atlasFile = path.join(fit, 'parts/atlas', manifest.creatureId + '.png'), atlas = await sharp(atlasFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const probe = createSourceJoinProbe({ record, binding: pre, atlas: { rgba: atlas.data, width: atlas.info.width, height: atlas.info.height } });
  const options = { fixedJoints: ['root'], shapeJoints: [...new Set(pre.parts.filter((p) => p.joint !== 'root').map((p) => p.joint))], contactEndpoints: familyContactChains(familyContractForRecord(record)).map((c) => c.end), paintBoundaryPairs: weld.pairs };
  const redo = await splitObservedSurfaces(pre, record, probe, options), redoBytes = Buffer.from(JSON.stringify(redo.binding, null, 2) + '\n');
  const reproduces = sha(redoBytes) === shaF(path.join(fit, 'binding.json'));
  const coordChanges = pre.parts.reduce((n, p, k) => n + (JSON.stringify(p.cutout) !== JSON.stringify(binding.parts[k]?.cutout) || JSON.stringify(p.frame) !== JSON.stringify(binding.parts[k]?.frame) ? 1 : 0), 0);
  const labels = await sharp(path.join(fit, 'labels.png')).ensureAlpha().raw().toBuffer();
  const greedyLog = fs.readFileSync(path.join(W, 'greedy.log'), 'utf8').split('\n').filter((l) => l.startsWith(id + ' ') || l.startsWith('FINAL ' + id));
  const subject = JSON.parse(fs.readFileSync(path.join(G2, id, 'subject-source.json'), 'utf8'));
  const file = (p) => ({ path: rel(p), bytes: fs.statSync(p).size, sha256: shaF(p) });
  const nat = JSON.parse(fs.readFileSync(path.join(out, 'native/report.json'), 'utf8'));
  const packet = { schema: 'cf.g1-automatic-candidate-packet/v1', contract: rel(path.join(C49, 'packet-contract.json')), status: 'CANDIDATE: admits nothing; Nick visual decision PENDING',
    identity: { speciesId: id.replace(/^\d+-/, ''), speciesName: subject.name, visualKey: subject.visualKey, recordRecipeHash: record.recipeHash, width: record.geometry.width, height: record.geometry.height },
    hashes: { masterEncodedSha256: masterSha, keyedAlphaSha256: shaF(path.join(fit, 'parts/keyed.png')), labelsEncodedSha256: shaF(path.join(fit, 'labels.png')), labelsDecodedSha256: sha(labels),
      atlasEncodedSha256: shaF(atlasFile), recordFileSha256: shaF(path.join(fit, 'record.json')), preSplitFileSha256: shaF(path.join(fit, 'pre-split-binding.json')), bindingFileSha256: shaF(path.join(fit, 'binding.json')), bindingSemanticHash: binding.bindingHash },
    master: { durableLocation: rel(g2Master), sha256: masterSha, bytes: fs.statSync(g2Master).size, recordSource: record.source, recordSourceIsIgnoredCopy: true, recordSourceCopyMatches: recordSourceMatches, note: 'record.source is an ignored copy of the tracked G2 master; bound here by byte equality; the record is not edited' },
    weld: { orderedPaintBoundaryPairs: weld.pairs, fixedJoints: options.fixedJoints, shapeJoints: options.shapeJoints, contactEndpoints: options.contactEndpoints, sourceBindingHash: pre.bindingHash ?? null, preSplitFileSha256: shaF(path.join(fit, 'pre-split-binding.json')),
      outputBindingHash: binding.bindingHash, outputBindingFileSha256: shaF(path.join(fit, 'binding.json')), reproducesFinalBindingByteForByte: reproduces, sourceCoordinateChanges: coordChanges,
      selectionOrigin: 'greedy automatic search: candidates = observed axial excluded adjacencies (adjjson.mjs), each added in order and kept only if the unchanged static gate passed (greedy.sh)',
      candidates: fs.readFileSync(path.join(W, 'candidates-' + id + '.txt'), 'utf8').trim().split('\n'), searchTrajectory: greedyLog, producerFileInventory: PRODUCERS.map((p) => file(path.join(ROOT, p))) },
    provenance: { G2GenerationReceipt: ['generation.json', 'request.json', 'prompt.txt', 'compiler-inputs.json', 'visible-anatomy.json'].filter((n) => fs.existsSync(path.join(G2, id, n))).map((n) => file(path.join(G2, id, n))),
      subjectSource: file(path.join(G2, id, 'subject-source.json')), presenceEvidence: file(path.join(AUTO, id, 'packet/presence.json')), authoringEvidence: [file(path.join(AUTO, id, 'packet/authoring.json')), file(path.join(AUTO, id, 'evidence.json'))],
      automaticTransferProvenance: file(path.join(AUTO, id, 'provenance.json')), legacyFlagCorrections: 'intake writes manualAuthoring=true / sourceLandmarksReused=false unconditionally; provenance.json records that these are NOT an automatic-origin attestation' },
    evidence: { originalStatic: { file: 'evidence/static.json', status: JSON.parse(fs.readFileSync(path.join(out, 'evidence/static.json'), 'utf8')).status },
      selectedBoundaryAudit: file(path.join(C49, id + '-selected.json')), unweldedNegativeControl: file(path.join(C49, '07-perch-unwelded-selected.json')),
      nativeRecordedHead: { file: 'native/report.json', recordedSource: nat.source ?? null, status: nat.status ?? null, frames: nat.capture?.frames ?? null, cpuP95Ms: nat.capture?.cpuP95Ms ?? null, cpuThrottle: nat.cpuThrottle ?? null, note: 'historical diagnostic at its recorded head; a current-head native requirement needs a new run' },
      codexReview: file(path.join(C49, 'README.md')), filmAndStillInventory: inventory.filter((x) => x.relativePath.startsWith('native/')).map(({ relativePath, bytes, sha256 }) => ({ relativePath, bytes, sha256 })),
      NickVisualDecisionForExactPacket: 'PENDING' },
    fileInventory: inventory };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(packet, null, 1) + '\n');
  summary.push({ id, files: inventory.length, reproduces, sourceCoordinateChanges: coordChanges, recordSourceCopyMatches: recordSourceMatches, bindingSemanticHash: binding.bindingHash });
}
fs.writeFileSync(path.join(HERE, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary));
