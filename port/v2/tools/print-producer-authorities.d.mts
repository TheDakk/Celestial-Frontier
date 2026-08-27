import type {
  CompendiumMeasurementAuthority,
  CompendiumProducerAuthority,
} from './compendiummem-contract.mjs';

export type SceneMemoryProducerAuthority = Readonly<Record<string, string>>;

export type CurrentProducerAuthorities = Readonly<{
  schema: 'cf-v2-current-producer-authorities/v1';
  build: Readonly<{ schema: string; sha256: string; fileCount: number }>;
  sceneMemory: Readonly<{
    producer: SceneMemoryProducerAuthority;
    budgetMatches: boolean;
    budgetMismatches: readonly string[];
  }>;
  compendium: Readonly<{
    measurement: CompendiumMeasurementAuthority;
    producer: CompendiumProducerAuthority;
    measurementBudgetMatches: boolean;
    measurementBudgetMismatches: readonly string[];
    producerBudgetMatches: boolean;
    producerBudgetMismatches: readonly string[];
    fixedRulerAuthority: unknown;
    numericCeilingsSha256: string;
  }>;
}>;

export function authorityMismatchPaths(
  expected: unknown,
  observed: unknown,
  prefix?: string,
): readonly string[];

export function producerAuthorityExitCode(report: unknown): 0 | 2;

export function collectCurrentProducerAuthorities(): CurrentProducerAuthorities;
