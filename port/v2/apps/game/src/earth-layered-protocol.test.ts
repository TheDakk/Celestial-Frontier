import { describe, expect, it, vi } from 'vitest';
import {
  EARTH_LAYER_REQUEST, EARTH_LAYER_RESPONSE, earthResidentRequestV1,
  earthResidentResponseV1, closeEarthResidentBitmapV1,
} from './earth-layered-protocol.js';

const TOKEN = 'earth-plan:1';
function bitmap(width = 960, height = 430) { return { width, height, close: vi.fn() }; }
function result(image = bitmap()) {
  return { schema: EARTH_LAYER_RESPONSE, token: TOKEN, type: 'result', bitmap: image };
}
function request() { return { schema: EARTH_LAYER_REQUEST, token: TOKEN, plan: { fixture: true } }; }

describe('Earth resident envelope admission', () => {
  it('accepts exact ordinary and null-prototype request envelopes without mutating the plan', () => {
    const ordinary = request(), plain = Object.assign(Object.create(null), ordinary);
    for (const value of [ordinary, plain]) {
      const accepted = earthResidentRequestV1(value);
      expect(accepted).toEqual(ordinary); expect(accepted!.plan).toBe(ordinary.plan);
    }
  });

  it.each(['schema', 'empty token', 'long token', 'missing', 'extra', 'symbol', 'array', 'prototype', 'hidden'] as const)('rejects malformed request %s', fault => {
    let value: unknown = request(); const row = value as Record<string, unknown>;
    if (fault === 'schema') row.schema = 'future';
    if (fault === 'empty token') row.token = '';
    if (fault === 'long token') row.token = 'x'.repeat(257);
    if (fault === 'missing') delete row.plan;
    if (fault === 'extra') row.extra = true;
    if (fault === 'symbol') Object.defineProperty(row, Symbol('hidden'), { value: 1 });
    if (fault === 'array') value = [row];
    if (fault === 'prototype') value = Object.assign(Object.create({ inherited: true }), row);
    if (fault === 'hidden') Object.defineProperty(row, 'plan', { value: row.plan, enumerable: false });
    expect(earthResidentRequestV1(value)).toBeNull();
  });

  it('refuses request and response envelope accessors without executing them', () => {
    for (const [value, field, check] of [
      [request(), 'plan', earthResidentRequestV1],
      [result(), 'bitmap', (input: unknown) => earthResidentResponseV1(input, TOKEN)],
    ] as const) {
      const getter = vi.fn(() => { throw new Error('must not execute'); });
      Object.defineProperty(value, field, { enumerable: true, get: getter });
      expect(check(value)).toBeNull(); expect(getter).not.toHaveBeenCalled();
      closeEarthResidentBitmapV1(value); expect(getter).not.toHaveBeenCalled();
    }
  });

  it('accepts exact result/error envelopes and leaves bitmap ownership with the caller', () => {
    const image = bitmap(), value = result(image);
    expect(earthResidentResponseV1(value, TOKEN)).toEqual(value);
    expect(image.close).not.toHaveBeenCalled();
    const error = { schema: EARTH_LAYER_RESPONSE, token: TOKEN, type: 'error', message: 'render failed' };
    expect(earthResidentResponseV1(error, TOKEN)).toEqual(error);
    expect(earthResidentResponseV1(Object.assign(Object.create(null), value), TOKEN)).toEqual(value);
  });

  it.each(['token', 'schema', 'type', 'width', 'height', 'close', 'extra', 'missing'] as const)('rejects invalid result %s', fault => {
    const value: Record<string, unknown> = result(bitmap(fault === 'width' ? 961 : 960, fault === 'height' ? 431 : 430));
    if (fault === 'token') value.token = 'other';
    if (fault === 'schema') value.schema = 'future';
    if (fault === 'type') value.type = 'error';
    if (fault === 'close') value.bitmap = { width: 960, height: 430 };
    if (fault === 'extra') value.extra = true;
    if (fault === 'missing') delete value.bitmap;
    expect(earthResidentResponseV1(value, TOKEN)).toBeNull();
  });

  it.each(['', 'x'.repeat(513), 7, null])('rejects an invalid error message %#', message => {
    expect(earthResidentResponseV1({ schema: EARTH_LAYER_RESPONSE, token: TOKEN, type: 'error', message }, TOKEN)).toBeNull();
  });

  it('fails closed on a throwing record proxy or bitmap property', () => {
    const hostile = new Proxy({}, { getPrototypeOf() { throw new Error('hostile object'); } });
    expect(() => earthResidentRequestV1(hostile)).not.toThrow(); expect(earthResidentRequestV1(hostile)).toBeNull();
    expect(() => earthResidentResponseV1(hostile, TOKEN)).not.toThrow(); expect(earthResidentResponseV1(hostile, TOKEN)).toBeNull();
    for (const field of ['width', 'height', 'close']) {
      const image = bitmap();
      Object.defineProperty(image, field, { get() { throw new Error('hostile bitmap'); } });
      expect(() => earthResidentResponseV1(result(image), TOKEN)).not.toThrow();
      expect(earthResidentResponseV1(result(image), TOKEN)).toBeNull();
    }
  });

  it('closes refused or stale bitmaps even when their envelope is invalid', () => {
    const image = bitmap(1, 1);
    const value = { schema: 'wrong', token: 'stale', type: 'unknown', bitmap: image, extra: true };
    expect(earthResidentResponseV1(value, TOKEN)).toBeNull();
    closeEarthResidentBitmapV1(value); expect(image.close).toHaveBeenCalledOnce();
  });

  it('swallows malformed cleanup and bitmap close failures', () => {
    const close = vi.fn(() => { throw new Error('close failed'); });
    const hostile = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('descriptor failed'); } });
    for (const value of [null, undefined, 4, [], hostile, { bitmap: { close } }]) {
      expect(() => closeEarthResidentBitmapV1(value)).not.toThrow();
    }
    expect(close).toHaveBeenCalledOnce();
  });
});
