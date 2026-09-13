/** Pure transport boundary controls only: no source scan, listener, browser or model copy. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeModelMirrorRange, nativeModelMirrorFrontOrigin } from './native-model-mirror.mjs';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as model } from '../../port/v2/apps/game/src/local-model-manifest.ts';

test('an absent Range requests each exact pinned file in full', () => {
  for (const file of model.files) assert.equal(nativeModelMirrorRange(undefined, file.bytes), null);
});
test('open-ended ranges admit first, resumed and last bytes without truncating large file offsets', () => {
  for (const size of [1, 512, ...model.files.map(file => file.bytes), Number.MAX_SAFE_INTEGER]) {
    for (const start of new Set([0, Math.floor(size / 2), size - 1])) {
      const range = nativeModelMirrorRange(`bytes=${start}-`, size);
      assert.deepEqual(range, { start, end: size - 1 });
      assert.equal(Object.isFrozen(range), true);
    }
  }
});
test('Range refuses suffix, closed, multi-range, alternate spelling and non-string requests', () => {
  for (const header of [null, 0, {}, ['bytes=0-'], '', 'bytes=-1', 'bytes=0-1', 'bytes=0-,2-',
    'bytes=00-', 'bytes=01-', 'bytes=+1-', 'bytes=1.0-', 'bytes=1e2-', 'bytes=1 -',
    'bytes=0-\n', ' bytes=0-', 'Bytes=0-', 'items=0-']) {
    assert.throws(() => nativeModelMirrorRange(header, 512));
  }
});
test('Range refuses end-of-file and unsafe offsets plus invalid pinned sizes', () => {
  for (const header of ['bytes=512-', 'bytes=513-', 'bytes=9007199254740992-']) {
    assert.throws(() => nativeModelMirrorRange(header, 512), /range exceeds file/);
  }
  for (const size of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '512', null]) {
    assert.throws(() => nativeModelMirrorRange(undefined, size), /Invalid pinned model size/);
    assert.throws(() => nativeModelMirrorRange('bytes=0-', size), /Invalid pinned model size/);
  }
});
test('the measured front origin accepts exact explicit loopback ports only', () => {
  for (const port of [1, 58521, 65535]) {
    const value = `http://127.0.0.1:${port}`;
    assert.equal(nativeModelMirrorFrontOrigin(value), value);
  }
});
test('the measured front origin refuses aliases, normalization, paths, secrets and unrelated hosts', () => {
  for (const value of [undefined, null, 58521, {}, '', 'not a URL', 'http://127.0.0.1',
    'http://127.0.0.1:0', 'http://127.0.0.1:65536', 'http://127.0.0.1:80',
    'http://127.0.0.1:058521', 'http://127.0.0.1:58521/', 'http://127.0.0.1:58521/private',
    'http://127.0.0.1:58521?x=1', 'http://127.0.0.1:58521#x',
    'http://user:secret@127.0.0.1:58521', 'http://localhost:58521', 'http://[::1]:58521',
    'http://127.1:58521', 'http://2130706433:58521', 'http://127.0.0.2:58521',
    'https://127.0.0.1:58521', 'http://example.com:58521', 'file:///private/model.bin']) {
    assert.throws(() => nativeModelMirrorFrontOrigin(value));
  }
});
