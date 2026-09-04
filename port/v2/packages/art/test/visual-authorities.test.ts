import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BIOME_SETS } from '@cf/domain-strays';
import {
  BIOME_VISUAL_KEYS_V1,
  BIOME_VISUAL_PROFILES_V1,
  createBiomeVisualProfileAuthorityV1,
} from '@cf/art/biome-visual-profile';
import {
  IDENTITY_VISUAL_TREATMENT_GRADE_V1,
  VISUAL_TREATMENT_AXES_V1,
  VISUAL_TREATMENT_LEVELS_V1,
  VISUAL_TREATMENT_SCOPES_V1,
  createVisualTreatmentV1,
} from '@cf/art/visual-treatment';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(here, '..', 'src');

function recursivelyFrozen(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value !== 'object' || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Object.values(value as Record<string, unknown>).every((child) => recursivelyFrozen(child, seen));
}

function authoredBiomeProfiles(): Record<string, unknown> {
  const generated = readFileSync(path.join(sourceRoot, 'thumbart.verbatim.js'), 'utf8');
  const literal = generated.match(/const BIOME_PROFILES=(\{[\s\S]*?\n\});/u)?.[1];
  if (!literal) throw new Error('generated BIOME_PROFILES literal is missing');
  return runInNewContext(`(${literal})`, Object.create(null), {
    timeout: 1000,
    contextCodeGeneration: { strings: false, wasm: false },
  }) as Record<string, unknown>;
}

function liveBiomeKeys(): string[] {
  return Object.values(BIOME_SETS)
    .flatMap((set) => set.map((row) => String(row.k)))
    .sort();
}

function sourceFindings(source: string): string[] {
  const rules = [
    ['DOM', /\b(?:document|window|HTMLElement|HTMLCanvasElement|OffscreenCanvas|CanvasRenderingContext2D|localStorage|sessionStorage|navigator)\b/u],
    ['audio', /\b(?:AudioContext|AudioNode|AudioBuffer|OscillatorNode|GainNode)\b|@cf\/audio/u],
    ['ambient-global', /\b(?:globalThis|process)\b/u],
    ['nondeterminism', /\b(?:Date|performance)\b|Math\.random\s*\(|crypto\.(?:randomUUID|getRandomValues)/u],
    ['canvas-allocation', /document\.createElement\s*\(\s*['"]canvas|new\s+OffscreenCanvas/u],
  ] as const;
  return rules.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
}

function forbiddenShapeKeys(value: unknown): string[] {
  const forbidden = new Set([
    'x', 'y', 'z', 'width', 'height', 'radius', 'scale', 'offset', 'anchor',
    'position', 'placement', 'geometry', 'anatomy', 'body', 'head', 'limbs',
    'tail', 'wing',
  ]);
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    ...(forbidden.has(key) ? [key] : []),
    ...forbiddenShapeKeys(child),
  ]);
}

describe('BiomeVisualProfileV1 authority', () => {
  it('is the exact 43-key live BIOME_SETS identity set with no duplicates', () => {
    const live = liveBiomeKeys();
    expect(live).toHaveLength(43);
    expect(new Set(live).size).toBe(43);
    expect([...BIOME_VISUAL_KEYS_V1].sort()).toEqual(live);
    expect(Object.keys(BIOME_VISUAL_PROFILES_V1).sort()).toEqual(live);
  });

  it('preserves every authored signature/family/hazard/weather value and structure', () => {
    expect(BIOME_VISUAL_PROFILES_V1).toEqual(authoredBiomeProfiles());
    for (const profile of Object.values(BIOME_VISUAL_PROFILES_V1)) {
      expect(Object.keys(profile).sort()).toEqual(['fauna', 'flora', 'hazard', 'sig', 'weather']);
    }
  });

  it('is recursively immutable and detached from attempted writes', () => {
    expect(recursivelyFrozen(BIOME_VISUAL_KEYS_V1)).toBe(true);
    expect(recursivelyFrozen(BIOME_VISUAL_PROFILES_V1)).toBe(true);
    expect(() => {
      (BIOME_VISUAL_PROFILES_V1.temperate.fauna as string[]).push('mutant');
    }).toThrow();
    expect(() => {
      (BIOME_VISUAL_PROFILES_V1 as Record<string, unknown>).temperate = null;
    }).toThrow();
    expect(BIOME_VISUAL_PROFILES_V1.temperate.fauna).toEqual([
      'mammal', 'bird', 'insect', 'amphibian',
    ]);
  });

  it('rejects duplicate, missing, wrong-key, and wrong-structure controls', () => {
    const entries = Object.entries(BIOME_VISUAL_PROFILES_V1)
      .map(([key, profile]) => [key, profile] as const);
    expect(() => createBiomeVisualProfileAuthorityV1([...entries, entries[0]!]))
      .toThrow(/duplicate key temperate/u);
    expect(() => createBiomeVisualProfileAuthorityV1(entries.slice(1)))
      .toThrow(/missing keys temperate/u);
    expect(() => createBiomeVisualProfileAuthorityV1([
      ['wrong-biome', entries[0]![1]], ...entries.slice(1),
    ])).toThrow(/unexpected key wrong-biome/u);
    expect(() => createBiomeVisualProfileAuthorityV1([
      ['temperate', { ...entries[0]![1], extra: 'mutant' }], ...entries.slice(1),
    ])).toThrow(/wrong fields/u);
  });

  it('canonicalizes input order deterministically', () => {
    const entries = Object.entries(BIOME_VISUAL_PROFILES_V1)
      .map(([key, profile]) => [key, profile] as const);
    const forward = createBiomeVisualProfileAuthorityV1(entries);
    const reverse = createBiomeVisualProfileAuthorityV1([...entries].reverse());
    expect(reverse).toEqual(forward);
    expect(JSON.stringify(reverse)).toBe(JSON.stringify(forward));
    expect(recursivelyFrozen(reverse)).toBe(true);
  });
});

describe('VisualTreatmentV1 identity/default authority', () => {
  it('provides one exact identity default for every future grading scope', () => {
    expect(VISUAL_TREATMENT_SCOPES_V1).toEqual([
      'galaxy', 'system', 'planet', 'biome', 'species', 'ship',
    ]);
    expect(VISUAL_TREATMENT_AXES_V1).toEqual([
      'color', 'contrast', 'lighting', 'material', 'atmosphere',
    ]);
    expect(VISUAL_TREATMENT_LEVELS_V1).toEqual(['identity', 'polished']);
    expect(IDENTITY_VISUAL_TREATMENT_GRADE_V1).toEqual({
      color: 'identity', contrast: 'identity', lighting: 'identity',
      material: 'identity', atmosphere: 'identity',
    });
    for (const scope of VISUAL_TREATMENT_SCOPES_V1) {
      const treatment = createVisualTreatmentV1({ scope, key: `fixture:${scope}` });
      expect(treatment).toEqual({
        schema: 'cf.art.visual-treatment.v1',
        identity: { scope, key: `fixture:${scope}` },
        grade: IDENTITY_VISUAL_TREATMENT_GRADE_V1,
      });
      expect(recursivelyFrozen(treatment)).toBe(true);
    }
  });

  it('uses only explicit finite overrides and leaves omitted axes at identity', () => {
    const treatment = createVisualTreatmentV1(
      { scope: 'biome', key: 'temperate' },
      { color: 'polished', atmosphere: 'polished' },
    );
    expect(treatment.grade).toEqual({
      color: 'polished', contrast: 'identity', lighting: 'identity',
      material: 'identity', atmosphere: 'polished',
    });
    expect(IDENTITY_VISUAL_TREATMENT_GRADE_V1.color).toBe('identity');
  });

  it('is deterministic by value and changes only the explicit identity/default inputs', () => {
    const input = { scope: 'species' as const, key: 'fauna|Wolf|seed:7' };
    const grade = { material: 'polished' as const, lighting: 'polished' as const };
    const first = createVisualTreatmentV1(input, grade);
    const second = createVisualTreatmentV1({ ...input }, { ...grade });
    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(createVisualTreatmentV1({ ...input, key: 'fauna|Wolf|seed:8' }).identity.key)
      .toBe('fauna|Wolf|seed:8');
  });

  it('rejects non-finite scopes, tokens, extra axes, and inexact identities', () => {
    expect(() => createVisualTreatmentV1({ scope: 'effect' as never, key: 'fixture' }))
      .toThrow(/invalid scope/u);
    expect(() => createVisualTreatmentV1({ scope: 'planet', key: ' fixture' }))
      .toThrow(/exact nonblank token/u);
    expect(() => createVisualTreatmentV1(
      { scope: 'planet', key: 'fixture' }, { color: 'maximum' as never },
    )).toThrow(/invalid color level/u);
    expect(() => createVisualTreatmentV1(
      { scope: 'planet', key: 'fixture' }, { color: 'identity', geometry: 'mutant' } as never,
    )).toThrow(/unexpected grade axis geometry/u);
    expect(() => createVisualTreatmentV1(
      { scope: 'planet', key: 'fixture', seed: 7 } as never,
    )).toThrow(/wrong fields/u);
  });

  it('returns no geometry, placement, or anatomy values', () => {
    const treatment = createVisualTreatmentV1(
      { scope: 'ship', key: 'starter' },
      Object.fromEntries(VISUAL_TREATMENT_AXES_V1.map((axis) => [axis, 'polished'])),
    );
    expect(forbiddenShapeKeys(treatment)).toEqual([]);
    expect(forbiddenShapeKeys({ grade: { width: 12, anatomy: 'mutant' } }))
      .toEqual(['width', 'anatomy']);
  });
});

describe('visual authority environment and package boundaries', () => {
  it('is DOM/audio/ambient-global/nondeterminism/canvas-allocation free', () => {
    for (const file of ['biome-visual-profile.ts', 'visual-treatment.ts']) {
      expect(sourceFindings(readFileSync(path.join(sourceRoot, file), 'utf8')), file).toEqual([]);
    }

    expect(sourceFindings("document.createElement('canvas')")).toEqual(['DOM', 'canvas-allocation']);
    expect(sourceFindings('new AudioContext()')).toEqual(['audio']);
    expect(sourceFindings('globalThis.visualState')).toEqual(['ambient-global']);
    expect(sourceFindings('Date.now(); performance.now(); Math.random()'))
      .toEqual(['nondeterminism']);
  });

  it('exposes explicit subpaths and makes the browser barrel consume the reviewed finishing owner', () => {
    const manifest = JSON.parse(readFileSync(path.resolve(here, '..', 'package.json'), 'utf8')) as {
      exports: Record<string, string>;
    };
    expect(manifest.exports['./biome-visual-profile']).toBe('./src/biome-visual-profile.ts');
    expect(manifest.exports['./visual-treatment']).toBe('./src/visual-treatment.ts');
    expect(manifest.exports['./canvas-treatment']).toBe('./src/canvas-treatment.ts');
    expect(manifest.exports['./surface-polish']).toBe('./src/surface-polish.ts');
    const rootBarrel = readFileSync(path.join(sourceRoot, 'index.ts'), 'utf8');
    const finishingOwner = readFileSync(path.join(sourceRoot, 'surface-polish.ts'), 'utf8');
    expect(rootBarrel).toMatch(/from '\.\/surface-polish\.js'/u);
    expect(finishingOwner).toMatch(/from '\.\/canvas-treatment\.js'/u);
    expect(finishingOwner).toMatch(/from '\.\/visual-treatment\.js'/u);
    expect(rootBarrel).not.toMatch(/from '\.\/(?:canvas-treatment|visual-treatment)\.js'/u);
    expect(rootBarrel).toMatch(/const GAL_SPRITES = LIFTED_GAL_SPRITES;/u);
    expect(rootBarrel).not.toMatch(/export const GAL_SPRITES/u);
    expect(rootBarrel).toMatch(/return polishGalaxyCanvasV1\([\s\S]*GAL_SPRITES\[g\.sp\]/u);
    const disconnectedRoot = rootBarrel.replace("from './surface-polish.js'", "from './raw-art.js'");
    expect(disconnectedRoot).not.toMatch(/from '\.\/surface-polish\.js'/u);
    const biomeCompatibility = readFileSync(path.join(sourceRoot, 'biome-visual-profile.ts'), 'utf8');
    expect(biomeCompatibility).toMatch(/from '@cf\/domain-biome-profile'/u);
    expect(biomeCompatibility).not.toMatch(/const BIOME_(?:VISUAL_)?PROFILES/u);
    expect(readFileSync(path.join(sourceRoot, 'visual-treatment.ts'), 'utf8')).not.toMatch(/^import\s/mu);
  });
});
