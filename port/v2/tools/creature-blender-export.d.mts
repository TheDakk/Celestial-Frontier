export interface CreatureBlenderPhenotype {
  readonly schema: 'cf.creature-blender-phenotype/v1';
  readonly id: string;
  readonly genome: Readonly<Record<string, unknown>>;
  readonly speciesVisualKey: string;
  readonly sources: readonly { path: string; bytes: number; sha256: string }[];
  readonly route: { kind: string; kingdom: string; name: string | null; painter: string | null };
  readonly morphology: {
    kind: string;
    spec?: Readonly<Record<string, unknown>>;
    plan?: unknown;
    proportions: Readonly<Record<string, number | string>> | null;
    coordinates: { space: 'painter-normalized'; canvasSize: 440; x: 'right'; y: 'down'; fittedRaster: false };
    palette?: Readonly<Record<string, unknown>>;
    lineage?: { anchor: number; drift: number; paths: readonly unknown[]; geometryOwner: string; recipeSupported: false } | null;
  } | null;
  readonly admission: { status: 'supported' | 'static-fallback'; reason: string };
  readonly visualAcceptance: 'UNREVIEWED';
  readonly anatomicalAnimation: 'incomplete';
  readonly inputProvenance?: Readonly<Record<string, unknown>>;
}
export function createCreatureBlenderBridge(): Readonly<{
  exportGenome(genome: Record<string, unknown>, id?: string): CreatureBlenderPhenotype;
  specimens(): readonly CreatureBlenderPhenotype[];
  verify(record: CreatureBlenderPhenotype): true;
}>;
export function assertCreatureBlenderOutputDirectory(directory: string): string;
