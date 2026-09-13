#!/usr/bin/env node
// Offline parts-atlas tool. Inputs are hash-bound copies; no optimizer touches masters.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort(compare).map(k => [k, canonical(value[k])])) : value;
const json = value => JSON.stringify(canonical(value), null, 2) + '\n';
export const RIG_ATLAS_OPTIONS = Object.freeze({ width: 2048, height: 2048, fixedSize: false,
  powerOfTwo: false, padding: 4, extrude: 1, allowRotation: false, allowTrim: false,
  detectIdentical: false, exporter: 'Pixi', textureFormat: 'png', removeFileExtension: false,
  prependFolderName: false, scale: 1, tinify: false, packer: 'MaxRectsBin', packerMethod: 'BestShortSideFit' });

export function packRigAtlas(manifestFile, outputDirectory) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(manifest.creatureId ?? '')
    || !Array.isArray(manifest.parts) || !manifest.parts.length) throw new Error('invalid creature/parts manifest');
  if (fs.existsSync(outputDirectory)) throw new Error('output must be a new directory; originals cannot be overwritten');
  const names = new Set();
  const parts = manifest.parts.map(part => {
    if (!/^[a-z0-9][a-z0-9_-]{0,79}\.png$/.test(part.name ?? '') || names.has(part.name))
      throw new Error('invalid or duplicate part name');
    names.add(part.name);
    const source = path.resolve(path.dirname(manifestFile), part.path);
    const bytes = fs.readFileSync(source);
    if (digest(bytes) !== part.sha256) throw new Error(`part hash mismatch: ${part.name}`);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('part must be PNG');
    return { name: part.name, source, bytes, sha256: part.sha256 };
  }).sort((a, b) => compare(a.name, b.name));
  for (const [name, version] of [['free-tex-packer-cli', '0.3.0'], ['free-tex-packer-core', '0.3.9']])
    if (require(`${name}/package.json`).version !== version) throw new Error(`wrong ${name} pin`);
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-rig-atlas-'));
  try {
    const stage = path.join(scratch, 'parts'), packed = path.join(scratch, 'packed');
    fs.mkdirSync(stage); fs.mkdirSync(packed);
    for (const part of parts) fs.writeFileSync(path.join(stage, part.name), part.bytes, { flag: 'wx' });
    const project = path.join(scratch, 'project.ftpp');
    fs.writeFileSync(project, json({ images: parts.map(p => ({ name: p.name, path: path.join(stage, p.name) })),
      folders: [], packOptions: { ...RIG_ATLAS_OPTIONS, textureName: manifest.creatureId } }));
    const result = spawnSync(process.execPath, [require.resolve('free-tex-packer-cli'), '--project', project, '--output', packed],
      { encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024 });
    if (result.error || result.status !== 0) throw new Error(`packer failed: ${result.error ?? result.stderr}`);
    const outputs = fs.readdirSync(packed).sort(compare);
    const expected = [`${manifest.creatureId}.json`, `${manifest.creatureId}.png`].sort(compare);
    if (JSON.stringify(outputs) !== JSON.stringify(expected)) throw new Error('rig requires exactly one atlas; missing output or overflow');
    const atlas = JSON.parse(fs.readFileSync(path.join(packed, expected[0]), 'utf8'));
    if (JSON.stringify(Object.keys(atlas.frames ?? {}).sort(compare)) !== JSON.stringify(parts.map(p => p.name)))
      throw new Error('packer lost or renamed a part');
    if (![atlas.meta?.size?.w, atlas.meta?.size?.h].every(n => Number.isInteger(n) && n > 0 && n <= 2048))
      throw new Error('atlas dimensions exceed the 2048 limit');
    // Whitelist metadata: no wall-clock fields, machine paths or implicit packer extras.
    atlas.meta = { image: `${manifest.creatureId}.png`, format: 'RGBA8888', size: atlas.meta.size, scale: '1' };
    const atlasJson = Buffer.from(json(atlas)), png = fs.readFileSync(path.join(packed, `${manifest.creatureId}.png`));
    const receipt = { schema: 'cf-rig-atlas/v1', creatureId: manifest.creatureId,
      core: '0.3.9', cli: '0.3.0', options: RIG_ATLAS_OPTIONS,
      parts: parts.map(p => ({ name: p.name, sha256: p.sha256 })),
      outputs: { jsonSha256: digest(atlasJson), pngSha256: digest(png) } };
    for (const p of parts) if (digest(fs.readFileSync(p.source)) !== p.sha256) throw new Error('source changed during packing');
    fs.mkdirSync(outputDirectory); // exclusive creation prevents overwriting an existing asset directory
    fs.writeFileSync(path.join(outputDirectory, `${manifest.creatureId}.json`), atlasJson, { flag: 'wx' });
    fs.writeFileSync(path.join(outputDirectory, `${manifest.creatureId}.png`), png, { flag: 'wx' });
    fs.writeFileSync(path.join(outputDirectory, 'receipt.json'), json(receipt), { flag: 'wx' });
    return receipt;
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 4) throw new Error('Usage: node rig-atlas.mjs manifest.json NEW_OUTPUT_DIRECTORY');
  process.stdout.write(json(packRigAtlas(path.resolve(process.argv[2]), path.resolve(process.argv[3]))));
}
