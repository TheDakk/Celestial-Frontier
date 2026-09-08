import type { EarthResidentLayerPlanV1 } from '@cf/art/earth-resident-layer';

export const EARTH_LAYER_REQUEST = 'cf.earth-resident-request.v1' as const;
export const EARTH_LAYER_RESPONSE = 'cf.earth-resident-response.v1' as const;

export interface EarthResidentRequestV1 {
  readonly schema: typeof EARTH_LAYER_REQUEST;
  readonly token: string;
  readonly plan: EarthResidentLayerPlanV1;
}

/** A separate versioned protocol; the preserved opaque-vista protocol stays exact. */
export function earthResidentRequestV1(value: unknown): EarthResidentRequestV1 | null {
  try {
    const row = dataRecord(value, ['schema', 'token', 'plan']);
    return row?.schema === EARTH_LAYER_REQUEST && validToken(row.token)
      ? row as unknown as EarthResidentRequestV1 : null;
  } catch { return null; }
}

export type EarthResidentResponseV1 = Readonly<{
  schema: typeof EARTH_LAYER_RESPONSE; token: string; type: 'result'; bitmap: ImageBitmap;
}> | Readonly<{
  schema: typeof EARTH_LAYER_RESPONSE; token: string; type: 'error'; message: string;
}>;

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}

function dataRecord(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== fields.length || keys.some(key => typeof key !== 'string' || !fields.includes(key))) return null;
  const result: Record<string, unknown> = Object.create(null);
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return null;
    result[key] = descriptor.value;
  }
  return result;
}

export function earthResidentResponseV1(value: unknown, token: string): EarthResidentResponseV1 | null {
  try {
  const result = dataRecord(value, ['schema', 'token', 'type', 'bitmap']);
  if (result?.schema === EARTH_LAYER_RESPONSE && result.token === token && result.type === 'result') {
    const bitmap = result.bitmap as ImageBitmap | undefined;
    if (bitmap && bitmap.width === 960 && bitmap.height === 430 && typeof bitmap.close === 'function') {
      return result as unknown as EarthResidentResponseV1;
    }
  }
  const error = dataRecord(value, ['schema', 'token', 'type', 'message']);
  return error?.schema === EARTH_LAYER_RESPONSE && error.token === token && error.type === 'error'
    && typeof error.message === 'string' && error.message.length > 0 && error.message.length <= 512
    ? error as unknown as EarthResidentResponseV1 : null;
  } catch { return null; }
}

/** Even refused or stale transferable output must release its backing store. */
export function closeEarthResidentBitmapV1(value: unknown): void {
  try {
    if (!value || typeof value !== 'object') return;
    const descriptor = Object.getOwnPropertyDescriptor(value, 'bitmap');
    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      const bitmap = descriptor.value as ImageBitmap | null;
      if (typeof bitmap?.close === 'function') bitmap.close();
    }
  } catch { /* malformed/stale output never escapes the worker owner */ }
}
