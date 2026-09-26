/** Codex's C48 proposal, bounded: weld ONLY named part pairs (existing `paintBoundaryPairs`) on an automatic fit; fins and siblings
 * stay independent. Usage (repo root): node .../weld-pairs.mjs <fishId> <variant> '<json pairs>' */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { createHash } from 'node:crypto';
import { splitObservedSurfaces } from '../../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import { createSourceJoinProbe } from '../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import { familyContactChains, familyContractForRecord } from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const [id, variant, pairsJson] = process.argv.slice(2), pairs = JSON.parse(pairsJson);
const d = import.meta.dirname, root = path.resolve(d, '../../..'), req = createRequire(root + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp');
const old = path.join(root, 'audits/G1_AUTO_AUTHOR_20260926/auto-g2fam-v10', id, 'fit'), dir = path.join(d, 'pairs', id + '-' + variant), out = path.join(dir, 'fit');
fs.rmSync(dir, { recursive: true, force: true });
const read = (n) => JSON.parse(fs.readFileSync(path.join(old, n))), record = read('record.json'), binding = read('pre-split-binding.json'), manifest = read('parts/manifest.json');
const atlas = await sharp(path.join(old, 'parts/atlas', manifest.creatureId + '.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const probe = createSourceJoinProbe({ record, binding, atlas: { rgba: atlas.data, width: atlas.info.width, height: atlas.info.height } });
const options = { fixedJoints: ['root'], shapeJoints: [...new Set(binding.parts.filter((p) => p.joint !== 'root').map((p) => p.joint))], contactEndpoints: familyContactChains(familyContractForRecord(record)).map((c) => c.end), paintBoundaryPairs: pairs };
const split = await splitObservedSurfaces(binding, record, probe, options);
fs.cpSync(old, out, { recursive: true }); fs.writeFileSync(path.join(out, 'binding.json'), JSON.stringify(split.binding, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'weld-receipt.json'), JSON.stringify({ schema: 'cf.selective-weld/v1', fit: id, variant, pairs, helperSha256: createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex'), bindingHash: split.binding.bindingHash, receipt: split.receipt }, null, 1) + '\n');
console.log(JSON.stringify({ id, variant, bindingHash: split.binding.bindingHash }));
