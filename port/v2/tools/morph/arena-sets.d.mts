export interface ArenaSetSourceRow { readonly id: string; readonly biome: string; readonly delivery: string; readonly recipe: string; readonly acceptance: string; readonly far: string; readonly mid: string; readonly near: string; readonly masters: Readonly<{ far: string; mid: string; near: string }>; }
export const ARENA_DELIVERIES_FILE: string;
export const ARENA_SETS_GENERATED: string;
export function readArenaDelivery(R: string, rel: string): ArenaSetSourceRow;
export function checkArenaDelivery(R: string, rel: string, manifest: unknown): ArenaSetSourceRow;
export function arenaSetsFromDeliveries(R: string): { schema: 'cf.arena-sets/v1'; generatedBy: string; sets: ArenaSetSourceRow[] };
export function arenaSetsSource(R: string): string;
export function writeArenaSets(R: string): ArenaSetSourceRow[];
export function arenaRuntimeFiles(sets: readonly ArenaSetSourceRow[]): string[];
