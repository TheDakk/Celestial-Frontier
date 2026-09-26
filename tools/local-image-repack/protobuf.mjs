/**
 * Bounded protobuf wire helpers for local model metadata only.
 * Unknown fields are carried through raw Buffer views; parsing never normalizes
 * a valid noncanonical varint. Views share the caller's Buffer, so callers must
 * keep that input immutable for the lifetime of the parsed fields.
 */
import { Buffer } from 'node:buffer';

const MAX_BYTES = 64 * 1024 * 1024;
const MAX_FIELD_NUMBER = 0x1fffffff;
const MAX_UINT64 = (1n << 64n) - 1n;
const SUPPORTED_WIRES = new Set([0, 1, 2, 5]);

function uint64(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError('Varint number must be a nonnegative safe integer');
    }
    return BigInt(value);
  }
  if (typeof value !== 'bigint') throw new TypeError('Varint requires a bigint or safe integer');
  if (value < 0n || value > MAX_UINT64) throw new RangeError('Varint exceeds uint64 range');
  return value;
}

function readVarint(buffer, offset) {
  const start = offset;
  let value = 0n;
  for (let index = 0; index < 10; index += 1) {
    if (offset >= buffer.length) throw new RangeError(`Truncated varint at byte ${start}`);
    const byte = buffer[offset++];
    if (index === 9 && byte > 1) throw new RangeError(`Varint uint64 overflow at byte ${start}`);
    value |= BigInt(byte & 0x7f) << BigInt(index * 7);
    if ((byte & 0x80) === 0) return { value, offset };
  }
  throw new RangeError(`Varint uint64 overflow at byte ${start}`);
}

/** Decode supported fields without rewriting any bytes. No nested parsing is implicit. */
export function parseFields(buffer, { maxBytes = MAX_BYTES } = {}) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Protobuf input must be a Buffer');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > MAX_BYTES) {
    throw new RangeError(`maxBytes must be an integer from 0 through ${MAX_BYTES}`);
  }
  if (buffer.length > maxBytes) throw new RangeError(`Protobuf input exceeds ${maxBytes} byte limit`);
  const fields = [];
  let offset = 0;
  while (offset < buffer.length) {
    const start = offset;
    const tag = readVarint(buffer, offset);
    offset = tag.offset;
    const numberValue = tag.value >> 3n;
    const wire = Number(tag.value & 7n);
    if (numberValue === 0n || numberValue > BigInt(MAX_FIELD_NUMBER)) {
      throw new RangeError(`Invalid protobuf field number at byte ${start}`);
    }
    if (!SUPPORTED_WIRES.has(wire)) throw new RangeError(`Unsupported wire type ${wire} at byte ${start}`);
    const field = { number: Number(numberValue), wire };
    if (wire === 0) {
      const item = readVarint(buffer, offset);
      field.value = item.value;
      offset = item.offset;
    } else if (wire === 2) {
      const length = readVarint(buffer, offset);
      offset = length.offset;
      if (length.value > BigInt(buffer.length - offset)) {
        throw new RangeError(`Length-delimited field exceeds input boundary at byte ${start}`);
      }
      const end = offset + Number(length.value);
      field.payload = buffer.subarray(offset, end);
      offset = end;
    } else {
      const size = wire === 1 ? 8 : 4;
      if (size > buffer.length - offset) {
        throw new RangeError(`Fixed-width field exceeds input boundary at byte ${start}`);
      }
      offset += size;
    }
    field.raw = buffer.subarray(start, offset);
    fields.push(field);
  }
  return fields;
}

/** Emit the canonical unsigned uint64 varint for a newly authored value. */
export function encodeVarint(value) {
  let remaining = uint64(value);
  const bytes = Buffer.alloc(10);
  let offset = 0;
  do {
    const low = Number(remaining & 0x7fn);
    remaining >>= 7n;
    bytes[offset++] = low | (remaining === 0n ? 0 : 0x80);
  } while (remaining !== 0n);
  return bytes.subarray(0, offset);
}

/** Encode one newly authored supported field; fixed-width values stay opaque bytes. */
export function encodeField(number, wire, value) {
  if (!Number.isSafeInteger(number) || number < 1 || number > MAX_FIELD_NUMBER) {
    throw new RangeError(`Field number must be an integer from 1 through ${MAX_FIELD_NUMBER}`);
  }
  if (!SUPPORTED_WIRES.has(wire)) throw new RangeError(`Unsupported wire type ${String(wire)}`);
  const tag = encodeVarint(BigInt(number) * 8n + BigInt(wire));
  if (wire === 0) return concatFields([tag, encodeVarint(value)]);
  if (!Buffer.isBuffer(value)) throw new TypeError('Byte-valued field requires a Buffer');
  if ((wire === 1 && value.length !== 8) || (wire === 5 && value.length !== 4)) {
    throw new RangeError(`Wire ${wire} requires exactly ${wire === 1 ? 8 : 4} bytes`);
  }
  if (wire === 2) return concatFields([tag, encodeVarint(value.length), value]);
  return concatFields([tag, value]);
}

/** Concatenate original fields or fresh encoded Buffers, with a hard total-byte cap. */
export function concatFields(fields) {
  if (!Array.isArray(fields)) throw new TypeError('Fields must be an array');
  const buffers = [];
  let total = 0;
  for (const field of fields) {
    const buffer = Buffer.isBuffer(field) ? field : field?.raw;
    if (!Buffer.isBuffer(buffer)) throw new TypeError('Each field requires a Buffer or raw Buffer');
    if (buffer.length > MAX_BYTES - total) throw new RangeError(`Protobuf output exceeds ${MAX_BYTES} byte limit`);
    total += buffer.length;
    buffers.push(buffer);
  }
  return Buffer.concat(buffers, total);
}
