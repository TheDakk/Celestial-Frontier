export const MANIFEST_PATH: string;
export const PACKS_DIR: string;
export interface VerifiedPack { name: string; kind: 'parts' | 'interface'; file: string; bytes: number; sha256: string }
export function verifyPacks(options?: { manifestPath?: string; packsDir?: string }):
  Promise<{ problems: string[]; notes: string[]; present: VerifiedPack[] }>;
