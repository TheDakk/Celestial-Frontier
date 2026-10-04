import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire, registerHooks} from 'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
registerHooks({resolve});
const require = createRequire(new URL('../../port/v2/package.json', import.meta.url));
const {PNG} = require('pngjs'), {BufferImageSource, Texture} = require('pixi.js');
const {loadCreatureRigV1} = await import('../../port/v2/apps/game/src/creature-rig.ts');
const {createPaintPublication} = await import('./paint-publication.mjs');
const {sampleClip} = await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const read = p => fs.readFileSync(new URL(p, import.meta.url)), json = p => JSON.parse(read(p));
const record = json('./inputs/fit/record.json'), binding = json('./inputs/fit/binding.json');
const atlasBytes = read('./inputs/fit/parts/atlas/03-alligator.png'), atlas = PNG.sync.read(atlasBytes), keyed = PNG.sync.read(read('./inputs/fit/parts/keyed.png'));
const alpha = Uint8Array.from({length: keyed.width * keyed.height}, (_, i) => keyed.data[i * 4 + 3]);
// A custom decoded texture avoids Canvas/GPU/browser execution. Actual rig
// source admission, publication, contact and shape owners remain unchanged.
const texture = new Texture({source: new BufferImageSource({resource: new Uint8Array(atlas.data), width: atlas.width, height: atlas.height})});
const rig = await loadCreatureRigV1(record, binding, read('./inputs/packet/master.png'), alpha, atlasBytes, async () => texture);
const publisher = createPaintPublication(record, binding, 'amphibious'), rows = [];
try {
  for (const name of ['original', 'candidate']) {
    const timeline = json('./' + name + '-faint.json');
    for (const elapsedMs of [0, 420, 840, 1500]) {
      const pose = sampleClip({source: 'timeline', timeline}, elapsedMs), out = publisher.publish(pose, {actionId: 'faint', elapsedMs, durationMs: timeline.durationMs, weight: 1});
      rig.applyPose(out.resolved);
      let coordinates = 0;
      for (const part of rig.parts) {
        const actual = part.display.children[0].geometry.getBuffer('aPosition').data, expected = out.positions[part.id];
        assert.equal(actual.length, expected.length);
        assert(Buffer.from(actual.buffer, actual.byteOffset, actual.byteLength).equals(Buffer.from(expected.buffer, expected.byteOffset, expected.byteLength)), 'Actual loaded rig differs: ' + part.id);
        coordinates += actual.length;
      }
      rows.push({name, elapsedMs, parts: rig.parts.length, coordinates, byteParity: true});
    }
  }
} finally { rig.dispose(); }
const result = {schema: 'cf.c132-faint-rig-parity/v1', status: 'PASS', scope: 'Node-loaded actual CreatureRigV1 published positions, custom decoded texture; no browser, GPU or native visual acceptance', rows};
fs.writeFileSync(new URL('./runtime-parity.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
