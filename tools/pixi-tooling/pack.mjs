import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AssetPack } from '@assetpack/core';
import { texturePacker } from '@assetpack/core/texture-packer';

assert(process.env.CF_ASSET_INPUT && process.env.CF_ASSET_OUTPUT,
  'Set CF_ASSET_INPUT to a working copy and CF_ASSET_OUTPUT to a NEW output directory.');
const entry = fs.realpathSync(process.env.CF_ASSET_INPUT);
const requestedOutput = path.resolve(process.env.CF_ASSET_OUTPUT);
assert(fs.statSync(entry).isDirectory(), 'Asset input must be a directory');
assert(!fs.existsSync(requestedOutput), 'Output must be new; never overwrite previous assets');
const output = path.join(fs.realpathSync(path.dirname(requestedOutput)), path.basename(requestedOutput));
assert(output !== entry && !output.startsWith(entry + path.sep)
  && !entry.startsWith(output + path.sep), 'Input and output must not contain one another');
const pack = new AssetPack({ entry, output, cache: false, strict: true,
  pipes: [texturePacker({ resolutionOptions: { resolutions: { default: 1 },
    fixedResolution: 'default', maximumTextureSize: 2048 } })] });
await pack.run();
console.log('Prepared assets in ' + output);
