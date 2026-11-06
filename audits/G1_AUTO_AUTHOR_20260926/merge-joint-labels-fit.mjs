/** Post-verdict placement (Claude 2026-09-27): merge painter-label owners that share ONE rig joint into the joint-named owner, exactly on
 * the label raster, then compile the fit through the unchanged painter-label path (as Codex's TAIL_LABELS compile.mjs does).
 * Why: the hand beetle packet authors elytron-near / elytron-far / thorax all on joint `thorax`; the shipped beetle's intake merged them
 * (`ARCHETYPE_FINISH_20260923/04-insect/fit-04/label-authoring-receipt.json` regionOwnerMap → owner `thorax`), but intake-authored.mjs
 * does not, so every beetle-referenced insect was refused at the source-join probe ("unique known source owners"). A polygon union
 * cannot do this exactly (a traced outline fills concavities and took ~50 px of other owners), the label raster can.
 * Input: a PARTIAL fit that intake wrote before its source-join refusal (record.json, declaration.json cf.painter-part-intake/v1,
 * labels.png). Conservation: every pixel keeps its part id except group pixels, which take the kept id; source RGBA untouched.
 * Usage (repo root): node .../merge-joint-labels-fit.mjs <id> <partialFitDir> <outDir> -> <outDir>/fit */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { createHash } from 'node:crypto';
import { hashJSON } from '../../port/v2/tools/creature-animation/quadruped-template.mjs';
import { buildAuthoredParts } from '../../port/v2/tools/creature-animation/build-authored-parts.mjs';
import { buildPaintSkin } from '../../port/v2/tools/creature-animation/build-paint-skin.mjs';
import { splitObservedSurfaces } from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import { createSourceJoinProbe } from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import { familyContactChains, familyContractForRecord } from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const [id, srcArg, outArg] = process.argv.slice(2), root = process.cwd(), src = path.resolve(srcArg), out = path.resolve(outArg);
const req = createRequire(root + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp'), sha = (b) => createHash('sha256').update(b).digest('hex');
if (fs.existsSync(out)) throw Error('Fresh output required');
const read = (n) => JSON.parse(fs.readFileSync(path.join(src, n))), record = read('record.json'), declaration = read('declaration.json');
if (declaration.schema !== 'cf.painter-part-intake/v1') throw Error('Native painter labels required');
const remainder = read('pre-split-binding.json').sourceJoinTopology?.remainderPartId; if (!remainder) throw Error('remainder part unknown');
const masterFile = path.join(root, record.source), master = fs.readFileSync(masterFile); if (sha(master) !== record.geometry.cutoutAssetHash) throw Error('Original master hash');
const { info } = await sharp(master).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), labelBytes = fs.readFileSync(path.join(src, 'labels.png'));
if (sha(labelBytes) !== declaration.labelsSha256) throw Error('Source label hash');
const decoded = await sharp(labelBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); if (decoded.info.width !== info.width || decoded.info.height !== info.height) throw Error('Label geometry');
const labels = Uint8Array.from({ length: info.width * info.height }, (_, i) => decoded.data[i * 4]);
/* groups of parts sharing a joint → keep the joint-named part (else the first) */
const parts = declaration.parts, byJoint = new Map(); parts.forEach((p, k) => { if (!byJoint.has(p.joint)) byJoint.set(p.joint, []); byJoint.get(p.joint).push(k); });
const groups = [...byJoint.entries()].filter(([, ks]) => ks.length > 1); if (!groups.length) throw Error('No shared joints: nothing to merge');
const keepOf = new Map(), merged = [];
for (const [joint, ks] of groups) { const keep = ks.find((k) => parts[k].id === joint) ?? ks.find((k) => parts[k].id.includes(joint)) ?? ks[0]; for (const k of ks) keepOf.set(k, keep); merged.push({ joint, keep: parts[keep].id, from: ks.map((k) => parts[k].id) }); }
const kept = parts.map((p, k) => k).filter((k) => !keepOf.has(k) || keepOf.get(k) === k), newIndex = new Map(kept.map((k, n) => [k, n + 1]));
const nextParts = kept.map((k) => parts[k]), next = new Uint8Array(labels.length); let moved = 0, conservationErrors = 0;
for (let i = 0; i < labels.length; i++) { const v = labels[i]; if (!v) continue; const k = v - 1, t = keepOf.has(k) ? keepOf.get(k) : k; next[i] = newIndex.get(t); if (t !== k) moved++;
  if (nextParts[next[i] - 1].id !== (keepOf.has(k) ? parts[keepOf.get(k)].id : parts[k].id)) conservationErrors++; }
if (conservationErrors) throw Error('conservation: ' + conservationErrors);
const pixels = Buffer.alloc(labels.length * 4); for (let i = 0; i < labels.length; i++) pixels.set([next[i], next[i], next[i], 255], i * 4);
const png = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
fs.mkdirSync(path.join(out, 'fit'), { recursive: true }); const fit = path.join(out, 'fit'), write = (n, v) => fs.writeFileSync(path.join(fit, n), JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
write('record.json', record); fs.writeFileSync(path.join(fit, 'labels.png'), png);
const { declarationHash, ...body } = declaration, nb = { ...body, parts: nextParts, labelsSha256: sha(png) }; write('declaration.json', { ...nb, declarationHash: await hashJSON(nb) });
const intake = await buildAuthoredParts({ id, recordFile: path.join(fit, 'record.json'), masterFile, declarationFile: path.join(fit, 'declaration.json'), output: path.join(fit, 'parts') });
const built = await buildPaintSkin(path.join(fit, 'parts'), { seamBridges: { groups: [] } }, record, { boundaryStep: 24, interiorStep: 56, includeTopology: true });
const { bindingHash, ...bb } = built.binding; bb.sourceJoinTopology = { remainderPartId: remainder }; const binding = { ...bb, bindingHash: await hashJSON(bb) }; write('pre-split-binding.json', binding);
const a = await sharp(path.join(fit, 'parts/atlas', id + '.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const probe = createSourceJoinProbe({ record, binding, atlas: { rgba: a.data, width: a.info.width, height: a.info.height } });
const opts = { fixedJoints: ['root'], shapeJoints: [...new Set(binding.parts.filter((p) => p.joint !== 'root').map((p) => p.joint))], contactEndpoints: familyContactChains(familyContractForRecord(record)).map((c) => c.end) };
const split = await splitObservedSurfaces(binding, record, probe, opts); write('binding.json', split.binding);
fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify({ schema: 'cf.g1-merge-joint-labels/v1', sourceFit: src, sourceLabelsSha256: sha(labelBytes), newLabelsSha256: sha(png), sourceMasterSha256: sha(master), merged, movedPixels: moved, conservationErrors: 0, sourceRgbaChanges: 0, placementOnly: true, verdictChanged: false, rule: 'shipped beetle regionOwnerMap: same-joint regions → the joint-named owner', intake, split: split.receipt }, null, 2) + '\n');
console.log(id, JSON.stringify({ merged, moved }));
