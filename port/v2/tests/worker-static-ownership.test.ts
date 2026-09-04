import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { javascriptModuleImports } from '../tools/sealed-worker-graph.mjs';

const speciesWorkerSource = (): string => readFileSync(fileURLToPath(new URL(
  '../apps/game/src/species-art.worker.ts', import.meta.url,
)), 'utf8');

const biomeWorkerSource = (): string => readFileSync(fileURLToPath(new URL(
  '../apps/game/src/biome-vista.worker.ts', import.meta.url,
)), 'utf8');

const hasDynamicModuleImport = (source: string): boolean =>
  javascriptModuleImports(source).some(({ kind }) => kind === 'module-dynamic');

const hasStaticSpeciesPainterOwnership = (source: string): boolean =>
  source.includes("import * as speciesPainter from '@cf/art/species-painter';")
  && source.includes('loadPainter: async () => {')
  && source.includes('return speciesPainter;')
  && !hasDynamicModuleImport(source);

const hasStaticBiomeRendererOwnership = (source: string): boolean =>
  source.includes("import { renderBiomeVistaV1 } from '@cf/art/biome-vista';")
  && source.includes('const canvas = renderBiomeVistaV1({')
  && !hasDynamicModuleImport(source);

describe('worker-local static module ownership', () => {
  it('keeps the species painter in the lazy-created worker without a runtime module fetch', () => {
    const source = speciesWorkerSource();
    expect(hasStaticSpeciesPainterOwnership(source)).toBe(true);
    expect(hasDynamicModuleImport(source)).toBe(false);

    expect(hasStaticSpeciesPainterOwnership(source.replace(
      "import * as speciesPainter from '@cf/art/species-painter';",
      '/* removed static species painter ownership */',
    ))).toBe(false);
    expect(hasStaticSpeciesPainterOwnership(source.replace(
      'return speciesPainter;',
      "return await import('@cf/art/species-painter');",
    ))).toBe(false);
    expect(hasDynamicModuleImport(source.replace(
      'return speciesPainter;',
      "return await import/* comment-separated */('@cf/art/species-painter');",
    ))).toBe(true);
  });

  it('keeps the biome renderer in its lazy-created worker without a runtime module fetch', () => {
    const source = biomeWorkerSource();
    expect(hasStaticBiomeRendererOwnership(source)).toBe(true);
    expect(hasDynamicModuleImport(source)).toBe(false);

    expect(hasStaticBiomeRendererOwnership(source.replace(
      "import { renderBiomeVistaV1 } from '@cf/art/biome-vista';",
      '/* removed static biome renderer ownership */',
    ))).toBe(false);
    const dynamicMutant = source.replace(
      'const canvas = renderBiomeVistaV1({',
      "const { renderBiomeVistaV1 } = await import/* comment-separated */('@cf/art/biome-vista');\n      const canvas = renderBiomeVistaV1({",
    );
    expect(hasStaticBiomeRendererOwnership(dynamicMutant)).toBe(false);
    expect(hasDynamicModuleImport(dynamicMutant)).toBe(true);
  });
});
