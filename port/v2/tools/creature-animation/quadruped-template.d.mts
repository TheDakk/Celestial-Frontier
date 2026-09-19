export const GRAPH: readonly (readonly [string, string])[];
export function admitRecord(record: unknown, cutoutBytes: Uint8Array, alpha?: Uint8Array): Promise<true>;
export function hashBytes(bytes: Uint8Array): Promise<string>;
export function hashJSON(value: unknown): Promise<string>;
