export interface CardArchetypeEntry { readonly earthName: string; readonly dir: string; readonly key: string; readonly markings?: string; }
export const CARD_ARCHETYPES: readonly CardArchetypeEntry[];
export const CARD_MASTER_SIDE: number;
export const SHIPPED_ROOT: string;
export function generatedSources(archetypes: readonly CardArchetypeEntry[], markingsFilesOf: (a: CardArchetypeEntry) => readonly string[]): Readonly<{ registry: string; assets: string; arena: string }>;
