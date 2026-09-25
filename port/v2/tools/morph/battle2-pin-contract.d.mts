export const BATTLE2_MASTER_PINS_SCHEMA: 'cf-battle2-master-pins/v1';
export const BATTLE2_PIN_HASH_CONVENTION: Readonly<Record<'recordSha256' | 'masterSha256' | 'alphaSha256' | 'bindingSha256' | 'atlasSha256' | 'paths', string>>;
export const SHA256_PATTERN: RegExp;
export function canonicalRepoPath(value: unknown): string | null;
export function requireCanonicalRepoPath(value: unknown, what: string): string;
export function pinRecordSha256(record: unknown): Promise<string>;
export function pngHeaderSize(bytes: Uint8Array): { width: number; height: number } | null;
