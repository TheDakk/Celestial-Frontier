export const ART_LIBRARY_ROOT: string;
export const ART_LIBRARY_PIN_MODULE: string;
export interface ArtLibraryFileEntry { readonly path: string; readonly bytes: number; readonly sha256: string; }
export function artLibraryManifestBody(root?: string): { schema: string; files: ArtLibraryFileEntry[] };
export function manifestBytes(body: unknown): Buffer;
export function pinModuleSource(pin: { path: string; sha256: string; bytes: number; files: number }): string;
export function writeArtLibraryManifest(root?: string): { files: number; bytes: number; pin: { path: string; sha256: string; bytes: number; files: number } };
