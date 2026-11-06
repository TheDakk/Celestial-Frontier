import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { parseFields, encodeVarint, encodeField, concatFields } from './protobuf.mjs';

const hex = (value) => Buffer.from(value.replaceAll(' ', ''), 'hex');
const HARD_MAX = 64 * 1024 * 1024;

test('known wire bytes decode varint, fixed64, length-delimited, and fixed32 fields', () => {
  const input = hex('08 96 01 11 0807060504030201 1a 03 616263 25 efbeadde');
  const fields = parseFields(input);
  assert.deepEqual(fields.map(({ number, wire }) => [number, wire]), [[1, 0], [2, 1], [3, 2], [4, 5]]);
  assert.equal(fields[0].value, 150n);
  assert.deepEqual(fields[1].raw, hex('11 0807060504030201'));
  assert.equal(fields[2].payload.toString('utf8'), 'abc');
  assert.deepEqual(fields[3].raw, hex('25 efbeadde'));
  assert.equal(fields[2].payload.buffer, input.buffer);
  assert.equal(fields[2].payload.byteOffset, input.byteOffset + 14);
  for (const field of fields) assert.equal(field.raw.buffer, input.buffer);
  assert.deepEqual(concatFields(fields), input);
});

test('encoders match independent known unsigned uint64 wire fixtures', () => {
  for (const [value, expected] of [
    [0n, '00'], [1, '01'], [127, '7f'], [128, '8001'], [150, '9601'],
    [300n, 'ac02'], [16384n, '808001'],
    [Number.MAX_SAFE_INTEGER, 'ffffffffffffff0f'],
    [(1n << 64n) - 1n, 'ffffffffffffffffff01'],
  ]) assert.deepEqual(encodeVarint(value), hex(expected));
  assert.deepEqual(encodeField(1, 0, 150n), hex('089601'));
  assert.deepEqual(encodeField(2, 1, hex('0807060504030201')), hex('110807060504030201'));
  assert.deepEqual(encodeField(3, 2, Buffer.from('abc')), hex('1a03616263'));
  assert.deepEqual(encodeField(4, 5, hex('efbeadde')), hex('25efbeadde'));
  assert.deepEqual(encodeField(0x1fffffff, 0, 0), hex('f8ffffff0f00'));
});

test('unknown and noncanonical valid tags, values, and lengths retain exact original bytes', () => {
  // Field 1 tag/value, field 3 tag/length, and unknown field 99 fixed32.
  const input = hex('8800 8000 9a00 8300 616263 9d06 01020304');
  const fields = parseFields(input);
  assert.deepEqual(fields.map(({ number, wire }) => [number, wire]), [[1, 0], [3, 2], [99, 5]]);
  assert.equal(fields[0].value, 0n);
  assert.equal(fields[1].payload.toString(), 'abc');
  assert.deepEqual(fields[0].raw, hex('88008000'));
  assert.deepEqual(fields[1].raw, hex('9a008300616263'));
  assert.deepEqual(fields[2].raw, hex('9d0601020304'));
  assert.deepEqual(concatFields(fields), input);
  assert.notDeepEqual(fields[0].raw, encodeField(1, 0, fields[0].value));
  // Valid overlong uint64 zero occupies the full ten-byte varint budget.
  const tenByteZero = hex('08 80808080808080808000');
  assert.equal(parseFields(tenByteZero)[0].value, 0n);
  assert.deepEqual(concatFields(parseFields(tenByteZero)), tenByteZero);
});

test('nested rewrite preserves untouched unknown fields and existing field order', () => {
  const original = hex('0a09 089601 9d06 01020304 1007 1504030201');
  // Outer field 1 contains varint 150 and opaque unknown fixed32 field 99.
  const outer = parseFields(original);
  const inner = parseFields(outer[0].payload);
  assert.equal(inner[0].value, 150n);
  assert.equal(inner[1].number, 99);
  assert.deepEqual(concatFields(outer), original);
  const changedInner = concatFields([encodeField(1, 0, 151n), inner[1]]);
  const changedOuter = concatFields([encodeField(1, 2, changedInner), ...outer.slice(1)]);
  assert.deepEqual(changedOuter, hex('0a09 089701 9d06 01020304 1007 1504030201'));
  assert.deepEqual(parseFields(changedOuter).slice(1).map((field) => field.raw), outer.slice(1).map((field) => field.raw));
});

test('empty messages and empty length-delimited values preserve exact boundaries', () => {
  assert.deepEqual(parseFields(Buffer.alloc(0), { maxBytes: 0 }), []);
  assert.deepEqual(concatFields([]), Buffer.alloc(0));
  assert.deepEqual(encodeField(1, 2, Buffer.alloc(0)), hex('0a00'));
  const field = parseFields(hex('0a00'))[0];
  assert.equal(field.payload.length, 0);
  assert.deepEqual(field.raw, hex('0a00'));
  assert.equal(parseFields(hex('08ffffffffffffffffff01'))[0].value, (1n << 64n) - 1n);
});

test('malformed tags, invalid wire types, truncated varints and uint64 overflow are refused', () => {
  for (const encoded of [
    '00', '01', '02', '05', // Field zero is invalid on every supported wire.
    '0b', '0c', '0e', '0f', // Groups and undefined wires are unsupported.
    '8080808010', // Field number is one beyond the protobuf maximum.
    '80', '08', '0880', '088080', // Truncated tag/value varints.
    '08ffffffffffffffffff02', // The tenth byte cannot exceed one.
    '0880808080808080808080', // Continuation beyond ten bytes.
    '8080808080808080808080', // Overflow applies to tags too.
    '0a80808080808080808002', // Overflow applies to lengths too.
  ]) assert.throws(() => parseFields(hex(encoded)), RangeError, encoded);
});

test('fixed-width and length-delimited overruns fail before allocating payloads', () => {
  for (const encoded of [
    '09', '0901020304050607', '0d', '0d010203',
    '0a', '0a80', '0a036162', '0affffffffffffffffff01',
  ]) assert.throws(() => parseFields(hex(encoded)), RangeError, encoded);
  assert.throws(() => parseFields(hex('0801'), { maxBytes: 1 }), /byte limit/);
  assert.equal(parseFields(hex('0801'), { maxBytes: 2 })[0].value, 1n);
});

test('input types and tightened limits reject invalid settings', () => {
  for (const value of [new Uint8Array([8, 1]), '0801', null, undefined]) {
    assert.throws(() => parseFields(value), TypeError);
  }
  for (const maxBytes of [-1, 0.5, NaN, Infinity, HARD_MAX + 1, 2n, '2']) {
    assert.throws(() => parseFields(Buffer.alloc(0), { maxBytes }), RangeError);
  }
  assert.throws(() => parseFields(Buffer.alloc(0), null), TypeError);
});

test('encoder range and type failures cannot silently truncate values or field numbers', () => {
  for (const value of [-1, -1n, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 1n << 64n]) {
    assert.throws(() => encodeVarint(value), RangeError);
  }
  for (const value of ['1', null, undefined, true, Buffer.from([1])]) {
    assert.throws(() => encodeVarint(value), TypeError);
  }
  for (const number of [0, -1, 0x20000000, 1.5, NaN, Infinity, 1n, '1']) {
    assert.throws(() => encodeField(number, 0, 0), RangeError);
  }
  for (const wire of [-1, 3, 4, 6, 7, 8, 0n, '0', null]) {
    assert.throws(() => encodeField(1, wire, 0), RangeError);
  }
  for (const wire of [1, 2, 5]) {
    assert.throws(() => encodeField(1, wire, new Uint8Array(8)), TypeError);
  }
  for (const [wire, lengths] of [[1, [0, 7, 9]], [5, [0, 3, 5]]]) {
    for (const length of lengths) assert.throws(() => encodeField(1, wire, Buffer.alloc(length)), RangeError);
  }
});

test('concatenation accepts mixed raw fields and Buffers but refuses invalid carriers and oversize output', () => {
  assert.deepEqual(concatFields([hex('0801'), { raw: hex('1002') }]), hex('08011002'));
  for (const values of [null, {}, '0801', new Uint8Array([8, 1])]) assert.throws(() => concatFields(values), TypeError);
  for (const entry of [null, {}, { raw: new Uint8Array([8, 1]) }, '0801', 1]) {
    assert.throws(() => concatFields([entry]), TypeError);
  }
  // Reuse one 1 MiB Buffer: exercise the total bound without a 64 MiB allocation.
  const oneMiB = Buffer.alloc(1024 * 1024);
  assert.throws(() => concatFields(Array(65).fill(oneMiB)), /output exceeds/);
});
