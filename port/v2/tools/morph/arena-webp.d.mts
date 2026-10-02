export interface ArenaRgba { readonly width: number; readonly height: number; readonly rgba: Uint8Array; }
export interface ArenaPlateMetrics { readonly visiblePixels: number; readonly psnr: number; readonly maxAbs: number; readonly ssim: number; readonly ssimMinBlock: number; }
export interface ArenaPlateReceipt extends ArenaPlateMetrics { readonly role: 'far' | 'mid' | 'near'; readonly width: number; readonly height: number; readonly bytes: number; readonly sha256: string; readonly alphaIdentical: true; }
export const sharp: unknown;
export const ARENA_WEBP_OPTIONS: Readonly<{ quality: number; alphaQuality: number; effort: number; smartSubsample: boolean; bleedRadius: number }>;
export const ARENA_WEBP_RECEIPT_SCHEMA: 'cf.arena-webp-receipt/v1';
export const ARENA_INVENTORY: string;
export const ARENA_TEMPERATE_SOURCE: Readonly<{ id: string; far: string; mid: string; near: string }>;
export function webpPathFor(pngRel: string): string;
export function decodeRgba(bytes: Uint8Array): Promise<ArenaRgba>;
export function bleedTransparentRgb(rgba: Uint8Array, width: number, height: number, radius?: number): Uint8Array;
export function plateMetrics(a: ArenaRgba, b: ArenaRgba): ArenaPlateMetrics;
export function alphaDifferences(a: ArenaRgba, b: ArenaRgba): number;
export function encodeArenaPlate(pngBytes: Uint8Array, role: 'far' | 'mid' | 'near', options?: { quality?: number; alphaQuality?: number; effort?: number; bleedRadius?: number }): Promise<{ webp: Uint8Array; decoded: ArenaRgba; receipt: ArenaPlateReceipt }>;
export function arenaWebpSources(R: string): readonly Readonly<{ id: string; far: string; mid: string; near: string }>[];
export function encodeArenaSets(R: string, options?: { quality?: number; write?: boolean; log?: (line: string) => void }): Promise<unknown>;
