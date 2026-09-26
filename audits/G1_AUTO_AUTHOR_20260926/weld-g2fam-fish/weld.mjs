/** Codex's accepted flat-master weld (audits/ART_BATTLE_FOCUS_20260925/08-bass/weld-flat-master.mjs), applied UNCHANGED in its options
 * to the automatically authored G2 fish fits: re-split the observed surfaces of the fit's pre-split binding with
 * preservePaintBoundaries:true (plus the same fixed/shape/contact options). Record, atlas and parts are copied byte for byte; only
 * binding.json changes. Run from the repository root: node audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/weld.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { createHash } from 'node:crypto';
import { splitObservedSurfaces } from '../../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import { createSourceJoinProbe } from '../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import { familyContactChains, familyContractForRecord } from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const d = import.meta.dirname, root = path.resolve(d, '../../..'), req = createRequire(root + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha = (f) => createHash('sha256').update(fs.readFileSync(f)).digest('hex'), rows = [];
for (const id of ['06-trout', '07-perch', '08-cod', '09-carp', '10-herring']) {
  const old = path.join(root, 'audits/G1_AUTO_AUTHOR_20260926/auto-g2fam-v10', id, 'fit'), out = path.join(d, id, 'fit');
  fs.rmSync(path.join(d, id), { recursive: true, force: true });
  const read = (n) => JSON.parse(fs.readFileSync(path.join(old, n))), record = read('record.json'), binding = read('pre-split-binding.json'), manifest = read('parts/manifest.json');
  const atlasFile = path.join(old, 'parts/atlas', manifest.creatureId + '.png'), atlas = await sharp(atlasFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const probe = createSourceJoinProbe({ record, binding, atlas: { rgba: atlas.data, width: atlas.info.width, height: atlas.info.height } });
  const options = { fixedJoints: ['root'], shapeJoints: [...new Set(binding.parts.filter((p) => p.joint !== 'root').map((p) => p.joint))], contactEndpoints: familyContactChains(familyContractForRecord(record)).map((c) => c.end), preservePaintBoundaries: true };
  const split = await splitObservedSurfaces(binding, record, probe, options);
  fs.cpSync(old, out, { recursive: true }); fs.writeFileSync(path.join(out, 'binding.json'), JSON.stringify(split.binding, null, 2) + '\n');
  fs.writeFileSync(path.join(d, id, 'weld-receipt.json'), JSON.stringify({ schema: 'cf.flat-master-weld/v1', appliedTo: 'automatic G1 packet (not hand-authored)', sourceFit: path.relative(root, old), sourceRecordSha256: sha(path.join(old, 'record.json')), sourceBindingSha256: sha(path.join(old, 'pre-split-binding.json')), sourceAtlasSha256: sha(atlasFile), helperSha256: sha(import.meta.filename), options: { ...options, shapeJoints: options.shapeJoints.length }, bindingHash: split.binding.bindingHash, receipt: split.receipt }, null, 1) + '\n');
  rows.push({ id, bindingHash: split.binding.bindingHash });
}
console.log(JSON.stringify(rows));
