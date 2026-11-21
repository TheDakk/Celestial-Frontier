/* Hand-written types for the auto-lifted Genetics body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives. */
import type { Genome } from '@cf/domain-genome';

/** Bred child: adds parents/src/lineage markers on top of Genome; drifted gene
    indices may exceed their table lengths BY DESIGN (readers wrap `% len`;
    `size` famously must NOT be clamped on load — see SAVE_SYSTEM.md v1.8.7). */
export function crossGenome(a: Genome, b: Genome): Genome;
export function evolveGenome(g: Genome, epochs: number): Genome;
