/** The gas kit's literal porting tables, a line a table, as the kit text carries them. */
export const GAS_TABLES: readonly string[];
export const PLAN_SEEDS: readonly number[];
export function packGasKit(kitsFolder: string): string;
export function readPortChecks(kitsFolder: string): { seed: number; wide: string; narrow: string }[];
export function readZonalMaps(kitsFolder: string): { seed: number; width: number; hash: string }[];
export function generatedPlans(kitsFolder: string): string;
