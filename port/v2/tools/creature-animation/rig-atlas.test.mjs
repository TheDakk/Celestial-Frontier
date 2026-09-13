import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { packRigAtlas } from './rig-atlas.mjs';
const require = createRequire(import.meta.url);
const { Jimp } = require('free-tex-packer-core/utils/jimp');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('one CLI atlas is byte-stable across input order; original pixels and hashes survive', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-rig-atlas-test-'));
  try {
    const parts = [];
    for (const [name, w, h, color] of [['tail.png', 13, 4, 0xff00ffff], ['body.png', 9, 11, 0x663311aa]]) {
      const bytes = await new Jimp({ width: w, height: h, color }).getBuffer('image/png');
      fs.writeFileSync(path.join(root, name), bytes); parts.push({ name, path: name, sha256: hash(bytes) });
    }
    const manifest = path.join(root, 'parts.json');
    const write = p => fs.writeFileSync(manifest, JSON.stringify({ creatureId: 'synthetic', parts: p }));
    write(parts); const a = packRigAtlas(manifest, path.join(root, 'a'));
    write([...parts].reverse()); const b = packRigAtlas(manifest, path.join(root, 'b'));
    assert.deepEqual(a, b);
    for (const name of ['synthetic.png', 'synthetic.json', 'receipt.json'])
      assert.deepEqual(fs.readFileSync(path.join(root, 'a', name)), fs.readFileSync(path.join(root, 'b', name)));
    const packed = await Jimp.read(path.join(root, 'a/synthetic.png'));
    const frames = JSON.parse(fs.readFileSync(path.join(root, 'a/synthetic.json'))).frames;
    for (const part of parts) {
      const original = fs.readFileSync(path.join(root, part.name)); assert.equal(hash(original), part.sha256);
      const image = await Jimp.read(original), f = frames[part.name].frame;
      assert.equal(f.w, image.width); assert.equal(f.h, image.height);
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++)
        assert.equal(packed.getPixelColor(f.x + x, f.y + y), image.getPixelColor(x, y));
    }
    assert.throws(() => packRigAtlas(manifest, path.join(root, 'a')), /new directory/);
    write([{ ...parts[0], sha256: 'corrupt' }]);
    assert.throws(() => packRigAtlas(manifest, path.join(root, 'bad')), /hash mismatch/);
    write([parts[0], parts[0]]);
    assert.throws(() => packRigAtlas(manifest, path.join(root, 'duplicate')), /duplicate/);
    const large = await new Jimp({ width: 1500, height: 1500, color: 0x887766ff }).getBuffer('image/png');
    fs.writeFileSync(path.join(root, 'large.png'), large);
    write(['large-a.png', 'large-b.png'].map(name => ({ name, path: 'large.png', sha256: hash(large) })));
    assert.throws(() => packRigAtlas(manifest, path.join(root, 'overflow')), /exactly one atlas/);
    assert.equal(fs.existsSync(path.join(root, 'overflow')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
