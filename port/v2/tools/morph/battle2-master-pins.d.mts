export const PINS_MODULE: string;
export const PIN_FIELDS: readonly string[];
export function alphaOnlyPng(bytes: Uint8Array): Uint8Array;
export function admitAndPinArchetype(entry: { readonly earthName: string; readonly dir: string }, root?: string): Promise<Readonly<Record<string, string | number>>>;
export function validatePins<T>(pins: T): T;
export function renderBattle2MasterPinsModule(pins: readonly Readonly<Record<string, unknown>>[]): string;
export function buildBattle2MasterPins(archetypes: readonly { readonly earthName: string; readonly dir: string }[], root?: string): Promise<{ pins: Readonly<Record<string, string | number>>[]; source: string }>;
export function writeBattle2MasterPins(archetypes: readonly { readonly earthName: string; readonly dir: string }[], root?: string): Promise<Readonly<Record<string, string | number>>[]>;
