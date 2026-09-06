import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLCHAIN, main, versionState, inspectPcm16Wav, audioWitnessErrors, pngComparisonErrors, audioRenderVenvErrors, parseImageMagickMetric } from './development-toolchain.mjs';

function tone() {
  const frames = 48000, bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(48000, 24); bytes.writeUInt32LE(96000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++) bytes.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 1000 * i / 48000) * 4095), 44 + i * 2);
  return bytes;
}
const probe = { codec_name: 'pcm_s16le', sample_rate: '48000', channels: 1, bits_per_sample: 16 };

test('scope is frozen and rejects action modes before performing work', async () => {
  assert.equal(Object.isFrozen(TOOLCHAIN), true);
  assert.equal(TOOLCHAIN.every(Object.isFrozen), true);
  assert.deepEqual(TOOLCHAIN.map(row => `${row.kind}:${row.name}`), [
    'formula:imagemagick', 'formula:ffmpeg', 'formula:python@3.12', 'formula:node', 'formula:gh',
    'cask:blender', 'cask:inkscape', 'cask:reaper', 'cask:surge-xt', 'npm:gsap',
  ]);
  assert.deepEqual(TOOLCHAIN.filter(row => row.workspace).map(row => row.workspace), ['tools/ui-motion']);
  for (const args of [[], ['--upgrade'], ['--install'], ['--verify', '--check'], ['--check', 'pixi.js']])
    await assert.rejects(main(args), /Usage:/);
});

test('version metadata distinguishes upgrades, older remote metadata and nonnumeric labels', () => {
  assert.equal(versionState(null, '1.0'), 'not-installed');
  assert.equal(versionState('3.12.9', '3.12.10'), 'update-available');
  assert.equal(versionState('9.0.1', '8.2'), 'installed-newer');
  assert.equal(versionState('3.15.0', '3.15.0'), 'current');
  assert.equal(versionState('9.0.1_1', '9.0.1'), 'metadata-differs');
  assert.equal(versionState('HEAD', '1.0'), 'unknown');
});

test('reads real PCM bytes and rejects truncated or incompatible carriers', () => {
  const bytes = tone(), pcm = inspectPcm16Wav(bytes);
  assert.equal(pcm.frames, 48000); assert.equal(pcm.durationSeconds, 1);
  assert(pcm.peak > .12 && pcm.peak < .13); assert(pcm.rms > .08 && pcm.rms < .10);
  assert(pcm.upwardCrossings >= 998 && pcm.upwardCrossings <= 1001);
  for (const truncated of [bytes.subarray(0, 40), bytes.subarray(0, -1)])
    assert.throws(() => inspectPcm16Wav(truncated), /invalid|truncated/);
  const badFormat = Buffer.from(bytes); badFormat.writeUInt16LE(3, 20);
  assert.throws(() => inspectPcm16Wav(badFormat), /PCM16/);
  const badChunk = Buffer.from(bytes); badChunk.writeUInt32LE(bytes.length, 40);
  assert.throws(() => inspectPcm16Wav(badChunk), /truncated/);
});

test('audio verdict rejects silence, clipping, wrong frequency/format and absent loudness', () => {
  const witness = { pcm: inspectPcm16Wav(tone()), stream: probe, integratedLufs: -21.1 };
  assert.deepEqual(audioWitnessErrors(witness), []);
  const silent = tone(); silent.fill(0, 44);
  const mutants = [
    { ...witness, pcm: inspectPcm16Wav(silent) },
    { ...witness, pcm: { ...witness.pcm, peak: 1 } },
    { ...witness, pcm: { ...witness.pcm, sampleRate: 44100 } },
    { ...witness, pcm: { ...witness.pcm, frames: 100 } },
    { ...witness, pcm: { ...witness.pcm, upwardCrossings: 200 } },
    { ...witness, stream: { ...probe, codec_name: 'aac' } },
    { ...witness, stream: { ...probe, sample_rate: '44100' } },
    { ...witness, integratedLufs: NaN },
    { ...witness, integratedLufs: -70 },
  ];
  for (const mutant of mutants) assert(audioWitnessErrors(mutant).length > 0);
  assert.deepEqual(audioWitnessErrors(witness), []);
});

test('PNG verdict requires both identical and exactly one changed pixel outcomes', () => {
  const witness = { format: 'PNG', width: 16, height: 16, sameStatus: 0, samePixels: 0, changedStatus: 1, changedPixels: 1 };
  assert.deepEqual(pngComparisonErrors(witness), []);
  for (const patch of [{ format: 'JPEG' }, { width: 1 }, { samePixels: 1 }, { sameStatus: 1 }, { changedPixels: 0 }, { changedPixels: 2 }, { changedStatus: 0 }])
    assert(pngComparisonErrors({ ...witness, ...patch }).length > 0);
});


test('existing audio venv rejects stale Python base/version/architecture and mismatched SSL', () => {
  const selected = { major: 3, minor: 12, version: '3.12.14', architecture: 'arm64',
    basePrefixRealPath: '/cellar/python/3.12.14/framework', executableRealPath: '/cellar/python/3.12.14/bin/python',
    baseExecutableRealPath: '/cellar/python/3.12.14/bin/python', ssl: 'OpenSSL3',
    sslModuleRealPath: '/cellar/python/3.12.14/ssl.py', sslModuleSha256: 'ssl-source-digest',
    sslExtensionRealPath: '/cellar/python/3.12.14/_ssl.so', sslExtensionSha256: 'ssl-extension-digest' };
  const root = '/owned/audio/.venv';
  const existing = { ...selected, isolatedVenv: true, prefixRealPath: root, sslContextReady: true,
    zlibRoundTrip: true, digest: '5deec989484019560832cf109c3c732230c6932f790e299e4bba4f29ea2e44c3' };
  assert.deepEqual(audioRenderVenvErrors(selected, existing, root), []);
  for (const patch of [{ major: 2 }, { minor: 13 }, { version: '3.12.13' }, { architecture: 'x86_64' },
    { basePrefixRealPath: '/old/framework' }, { baseExecutableRealPath: '/old/bin/python' },
    { executableRealPath: '/old/bin/python' }, { isolatedVenv: false }, { prefixRealPath: '/different/.venv' },
    { sslModuleSha256: 'stale' }, { sslExtensionSha256: 'stale' }, { ssl: 'oldSSL' },
    { sslContextReady: false }, { digest: 'wrong' }, { zlibRoundTrip: false }])
    assert(audioRenderVenvErrors(selected, { ...existing, ...patch }, root).length > 0);
  assert.deepEqual(audioRenderVenvErrors(selected, existing, root), []);
});


test('ImageMagick metric accepts the optional normalized suffix and rejects junk or nonfinite values', () => {
  assert.deepEqual(parseImageMagickMetric('0'), { absolute: 0, normalized: null });
  assert.deepEqual(parseImageMagickMetric('0 (0)'), { absolute: 0, normalized: 0 });
  assert.deepEqual(parseImageMagickMetric('1 (0.00390625)\n'), { absolute: 1, normalized: .00390625 });
  assert.deepEqual(parseImageMagickMetric('0.796078 (0.00310968)'), { absolute: .796078, normalized: .00310968 });
  assert.deepEqual(parseImageMagickMetric('1e2 (3.90625e-1)'), { absolute: 100, normalized: .390625 });
  for (const value of ['', ' ', 'NaN', 'Infinity', '-1', '1e999', '0 warning', 'warning: 0 (0)',
    '0 (0) extra', '0\n1', '0 (NaN)', '0 (-1)', '0 (2)', '0 (0) (0)', '0 (0', '0)'])
    assert.throws(() => parseImageMagickMetric(value), /ImageMagick metric/);
});
