import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LATENT_CHANNELS, MAX_TOKENS, MAX_ELEMENTS, computeEmpiricalMu, createSigmaSchedule,
  float32ToFloat16Bits, float16BitsToFloat32, encodeFloat16, decodeFloat16,
  seededGaussianNoise, packedLatentsToTokens, tokensToPackedLatents,
  createImageIds, eulerOutputStep,
} from './pipeline-math.mjs';

const near = (actual, expected, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

function acceptFourStepSchedule(sigmas) {
  assert.equal(sigmas.length, 5);
  assert.equal(sigmas[0], 1);
  assert.equal(sigmas[4], 0);
  for (let i = 1; i < 4; i++) {
    assert.ok(sigmas[i] > sigmas[i + 1] && sigmas[i] < sigmas[i - 1]);
    // Independent inverse/log-odds ruler for the pinned 1024-token/4-step shift.
    const base = [1, 0.75, 0.5, 0.25][i];
    near(Math.log(sigmas[i] / (1 - sigmas[i])) - Math.log(base / (1 - base)),
      2.030689707949945, 1e-11);
  }
}
test('official scheduler anchors, branch and output-only token contract', () => {
  near(computeEmpiricalMu(1024, 10), 1.9878114252576);
  near(computeEmpiricalMu(1024, 200), 0.62999914);
  near(computeEmpiricalMu(8192, 4), 1.8433265);
  near(computeEmpiricalMu(8192, 200), 1.8433265);
  acceptFourStepSchedule(createSigmaSchedule(1024, 4));
  assert.deepEqual([...createSigmaSchedule(1024, 1)], [1, 0]);
  assert.throws(() => acceptFourStepSchedule(createSigmaSchedule(2048, 4)));
});
test('same scheduler outcome ruler rejects unshifted and stale README schedules', () => {
  assert.throws(() => acceptFourStepSchedule([1, 0.75, 0.5, 0.25, 0]));
  const stale = [1, 0.75, 0.5, 0.25].map(s => Math.exp(0.63) / (Math.exp(0.63) + 1 / s - 1));
  assert.throws(() => acceptFourStepSchedule([...stale, 0]));
});
test('scheduler rejects coercion, fractional/empty/excessive shapes and nonfinite input', () => {
  for (const value of [0, -1, 0.5, NaN, Infinity, '1024', MAX_TOKENS + 1]) {
    assert.throws(() => createSigmaSchedule(value, 4));
  }
  for (const value of [0, -1, 0.5, NaN, Infinity, '4', 1001]) {
    assert.throws(() => createSigmaSchedule(1024, value));
  }
});

test('binary16 known values, signed zero, subnormals, ties-to-even and overflow', () => {
  const cases = [[0, 0], [-0, 0x8000], [1, 0x3c00], [-2, 0xc000],
    [65504, 0x7bff], [2 ** -14, 0x0400], [2 ** -24, 1],
    [2 ** -25, 0], [3 * 2 ** -25, 2], [1 + 2 ** -11, 0x3c00],
    [1 + 3 * 2 ** -11, 0x3c02], [65519, 0x7bff], [65520, 0x7c00],
    [Infinity, 0x7c00], [-Infinity, 0xfc00]];
  for (const [value, bits] of cases) assert.equal(float32ToFloat16Bits(value), bits);
  assert.ok(Object.is(float16BitsToFloat32(0x8000), -0));
  assert.ok(Number.isNaN(float16BitsToFloat32(0x7e00)));
  assert.equal(float32ToFloat16Bits(NaN) & 0x7fff, 0x7e00);
});
test('all finite binary16 values survive exact binary32 representation and back', () => {
  for (let bits = 0; bits <= 0xffff; bits++) {
    if ((bits & 0x7c00) === 0x7c00) continue;
    assert.equal(float32ToFloat16Bits(float16BitsToFloat32(bits)), bits, `bits ${bits}`);
  }
});
test('tensor conversion rejects nonfinite/overflow carriers instead of silent GPU NaNs', () => {
  const source = new Float32Array([1, -2, 2 ** -24]);
  assert.deepEqual([...decodeFloat16(encodeFloat16(source))], [...source]);
  assert.deepEqual([...source], [1, -2, 2 ** -24]);
  for (const value of [NaN, Infinity, -Infinity, 70000]) {
    assert.throws(() => encodeFloat16(new Float32Array([value])));
  }
  for (const bits of [0x7c00, 0xfc00, 0x7e00]) {
    assert.throws(() => decodeFloat16(new Uint16Array([bits])));
  }
  assert.throws(() => encodeFloat16([1]));
  assert.throws(() => decodeFloat16(new Float32Array([1])));
  assert.throws(() => float16BitsToFloat32(65536));
});

function acceptGaussian(data) {
  let sum = 0, squares = 0, lag = 0, tail = 0;
  for (let i = 0; i < data.length; i++) {
    assert.ok(Number.isFinite(data[i]));
    sum += data[i]; squares += data[i] ** 2;
    if (i) lag += data[i] * data[i - 1];
    if (Math.abs(data[i]) > 2) tail++;
  }
  assert.ok(Math.abs(sum / data.length) < 0.025, 'Gaussian mean');
  assert.ok(squares / data.length > 0.96 && squares / data.length < 1.04, 'Gaussian second moment');
  assert.ok(Math.abs(lag / (data.length - 1)) < 0.025, 'adjacent noise correlation');
  assert.ok(tail / data.length > 0.038 && tail / data.length < 0.053, 'Gaussian tails');
}
test('explicit seeds repeat independently, preserve odd prefixes and differ by seed', () => {
  for (const seed of [0, 133, 0xffffffff]) {
    const a = seededGaussianNoise(129, seed);
    assert.deepEqual(a, seededGaussianNoise(129, seed));
    assert.deepEqual(a, seededGaussianNoise(130, seed).slice(0, 129));
    assert.notDeepEqual(a, seededGaussianNoise(129, seed === 0 ? 1 : 0));
  }
});
test('noise has normal-distribution outcomes; same ruler rejects zero and uniform substitutes', () => {
  acceptGaussian(seededGaussianNoise(65536, 133));
  assert.throws(() => acceptGaussian(new Float32Array(65536)));
  const uniform = Float32Array.from({ length: 65536 }, (_, i) =>
    (((Math.imul(i, 40503) & 65535) + 0.5) / 65536 * 2 - 1) * Math.sqrt(3));
  assert.throws(() => acceptGaussian(uniform));
});
test('noise rejects implicit/invalid seeds and oversized allocation requests', () => {
  for (const seed of [undefined, -1, 2 ** 32, 0.5, NaN, '133']) {
    assert.throws(() => seededGaussianNoise(128, seed));
  }
  for (const size of [0, -1, 0.5, Infinity, MAX_ELEMENTS + 1]) {
    assert.throws(() => seededGaussianNoise(size, 133));
  }
});

test('non-square packed transposition preserves channel/pixel identity and borrowed inputs', () => {
  const packed = new Float32Array(2 * 3 * LATENT_CHANNELS);
  for (let c = 0; c < LATENT_CHANNELS; c++) {
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) packed[c * 6 + row * 3 + col] = c * 1000 + row * 10 + col;
    }
  }
  const before = packed.slice();
  const tokens = packedLatentsToTokens(packed, 2, 3);
  const acceptPixels = data => {
    assert.equal(data[0], 0);
    assert.equal(data[1], 1000);
    assert.equal(data[128], 1);
    assert.equal(data[3 * 128 + 65], 65010);
    assert.equal(data[5 * 128 + 127], 127012);
  };
  acceptPixels(tokens);
  assert.throws(() => acceptPixels(packed)); // unchanged NCHW is not token-major.
  assert.deepEqual(tokensToPackedLatents(tokens, 2, 3), before);
  assert.deepEqual(packed, before);
  tokens[0] = -1;
  assert.equal(packed[0], 0);
});
test('packed transpose rejects wrong channel count, dimensions and nonfinite values', () => {
  assert.throws(() => packedLatentsToTokens(new Float32Array(32 * 6), 2, 3));
  assert.throws(() => tokensToPackedLatents(new Float32Array(128), 0, 1));
  assert.throws(() => packedLatentsToTokens(new Float32Array(128), 1.5, 1));
  const bad = new Float32Array(128); bad[127] = NaN;
  assert.throws(() => packedLatentsToTokens(bad, 1, 1));
});
test('image IDs use row-major geometry and separate reference time without token-counter L', () => {
  const expected = [0n, 0n, 0n, 0n, 0n, 0n, 1n, 0n, 0n, 0n, 2n, 0n,
    0n, 1n, 0n, 0n, 0n, 1n, 1n, 0n, 0n, 1n, 2n, 0n];
  assert.deepEqual([...createImageIds(2, 3)], expected);
  for (const [index, time] of [[0, 10n], [1, 20n]]) {
    const ids = createImageIds(2, 3, index);
    for (let i = 0; i < expected.length; i++) assert.equal(ids[i], i % 4 ? expected[i] : time);
    assert.notDeepEqual([...ids], expected);
  }
  for (const index of [-1, 0.5, '0', Infinity, 1024]) assert.throws(() => createImageIds(2, 3, index));
});

test('Euler integrates only generated tokens with descending sigma, retaining all inputs', () => {
  const output = new Float32Array(128).fill(2);
  const predictions = new Float32Array(384).fill(9000);
  predictions.fill(4, 0, 128);
  const before = predictions.slice();
  const acceptOutput = value => {
    assert.equal(value.length, 128);
    assert.ok([...value].every(v => v === 0)); // 2 + (0 - .5) * 4.
  };
  acceptOutput(eulerOutputStep(output, predictions, 0.5, 0));
  assert.throws(() => acceptOutput(output)); // skipped update.
  assert.throws(() => acceptOutput(new Float32Array(384))); // reference tokens leaked.
  assert.throws(() => acceptOutput(new Float32Array(128).fill(4))); // wrong sign.
  assert.deepEqual(output, new Float32Array(128).fill(2));
  assert.deepEqual(predictions, before);
  predictions.fill(-9000, 128);
  acceptOutput(eulerOutputStep(output, predictions, 0.5, 0));
});
test('Euler rejects malformed predictions, ascending times and numerical overflow', () => {
  const output = new Float32Array(128).fill(1);
  for (const length of [0, 127, 129]) assert.throws(() =>
    eulerOutputStep(output, new Float32Array(length), 1, 0));
  for (const times of [[0, 0], [0.5, 0.5], [0.5, 1], [1, -0.1], [NaN, 0], [2, 0]]) {
    assert.throws(() => eulerOutputStep(output, output, ...times));
  }
  const bad = new Float32Array(256); bad[255] = Infinity;
  assert.throws(() => eulerOutputStep(output, bad, 1, 0));
  assert.throws(() => eulerOutputStep(new Float32Array(128).fill(3e38),
    new Float32Array(128).fill(-3e38), 1, 0));
});
