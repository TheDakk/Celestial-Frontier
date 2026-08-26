import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.join(here, '..');
const repoRoot = path.join(v2Root, '..', '..');
const mainPath = path.join(repoRoot, 'main.js');
const htmlPath = path.join(repoRoot, 'celestial-frontier.html');
const liftToolPath = path.join(v2Root, 'tools/lift.mjs');
const HAZE_BLOCK_SHA256 = '1a6aec9affe551c039bd9d6976dd841c1bb0555994f59da04d1023c4600b4280';
const HAZE_START = 'const hazeCache=new Map();';
const HAZE_END = '/* a curated pool covering all five morphologies';

type Sources = Readonly<{
  main: string;
  legacy: string;
  artLift: string;
  worldgenLift: string;
  appMain: string;
  artIndex: string;
  artDeclaration: string;
  worldgenDeclaration: string;
  artPackage: string;
  packageLock: string;
}>;

function scriptFromTrackedHtml(html: string): string {
  const open = '<script>';
  const close = '</script>';
  if (html.split(open).length - 1 !== 1 || html.split(close).length - 1 !== 1) {
    throw new Error('tracked game HTML must contain exactly one script body');
  }
  const openIndex = html.indexOf(open);
  const closeIndex = html.indexOf(close, openIndex + open.length);
  return html.slice(openIndex + open.length, closeIndex);
}

const trackedHtml = fs.readFileSync(htmlPath, 'utf8');
const trackedMain = scriptFromTrackedHtml(trackedHtml);
const localMain = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf8') : null;

const sources: Sources = Object.freeze({
  main: trackedMain,
  legacy: trackedHtml,
  artLift: fs.readFileSync(path.join(v2Root, 'packages/art/src/galaxyart.verbatim.js'), 'utf8'),
  worldgenLift: fs.readFileSync(path.join(v2Root, 'packages/domain/worldgen/src/worldgen.verbatim.js'), 'utf8'),
  appMain: fs.readFileSync(path.join(v2Root, 'apps/game/src/main.ts'), 'utf8'),
  artIndex: fs.readFileSync(path.join(v2Root, 'packages/art/src/index.ts'), 'utf8'),
  artDeclaration: fs.readFileSync(path.join(v2Root, 'packages/art/src/galaxyart.verbatim.d.ts'), 'utf8'),
  worldgenDeclaration: fs.readFileSync(path.join(v2Root, 'packages/domain/worldgen/src/worldgen.verbatim.d.ts'), 'utf8'),
  artPackage: fs.readFileSync(path.join(v2Root, 'packages/art/package.json'), 'utf8'),
  packageLock: fs.readFileSync(path.join(v2Root, 'package-lock.json'), 'utf8'),
});

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function boundedSection(
  source: string,
  start: string,
  end: string,
  label: string,
  errors: string[],
): string {
  const startCount = occurrences(source, start);
  if (startCount !== 1) {
    errors.push(`${label}-start:${startCount}`);
    return '';
  }
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0) {
    errors.push(`${label}-end:0`);
    return '';
  }
  return source.slice(startIndex, endIndex);
}

function hazeBlock(source: string, label: string, errors: string[]): string {
  return boundedSection(source, HAZE_START, HAZE_END, label, errors);
}

function digest(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

function namedImport(source: string, specifier: string): string[] | null {
  const imports = [...source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';/gu)]
    .filter((match) => match[2] === specifier);
  if (imports.length !== 1) return null;
  return (imports[0]?.[1] ?? '').split(',').map((name) => name.trim()).filter(Boolean);
}

function ownershipErrors(input: Sources): string[] {
  const errors: string[] = [];
  const mainArt = boundedSection(
    input.main,
    'const GalaxyArt=(()=>{',
    '/* per-seed galaxy sprites (I4)',
    'main-art',
    errors,
  );
  const mainWorldgen = boundedSection(
    input.main,
    'const WorldGen=(()=>{',
    '/* @end WorldGen */',
    'main-worldgen',
    errors,
  );
  const legacyArt = boundedSection(
    input.legacy,
    'const GalaxyArt=(()=>{',
    '/* per-seed galaxy sprites (I4)',
    'legacy-art',
    errors,
  );
  const legacyWorldgen = boundedSection(
    input.legacy,
    'const WorldGen=(()=>{',
    '/* @end WorldGen */',
    'legacy-worldgen',
    errors,
  );

  const owners = [
    ['main-art', mainArt, 1, 1],
    ['main-worldgen', mainWorldgen, 0, 0],
    ['legacy-art', legacyArt, 1, 1],
    ['legacy-worldgen', legacyWorldgen, 0, 0],
    ['lift-art', input.artLift, 1, 1],
    ['lift-worldgen', input.worldgenLift, 0, 0],
  ] as const;
  for (const [label, source, expectedFunctions, expectedCaches] of owners) {
    const functions = occurrences(source, 'function galaxyHaze(seed, prof){');
    const caches = occurrences(source, HAZE_START);
    if (functions !== expectedFunctions) errors.push(`${label}-function-owner:${functions}`);
    if (caches !== expectedCaches) errors.push(`${label}-cache-owner:${caches}`);
  }
  if (/\bgalaxyHaze\b/u.test(mainWorldgen)) errors.push('main-worldgen-haze-token');
  if (/\bgalaxyHaze\b/u.test(legacyWorldgen)) errors.push('legacy-worldgen-haze-token');
  if (/\bdocument\s*\./u.test(input.worldgenLift)) errors.push('lift-worldgen-dom');
  if (occurrences(input.artLift, '@module GalaxyArt [app]') !== 1
    || input.artLift.includes('@module GalaxyArt [domain]')) errors.push('lift-art-header');
  if (occurrences(input.worldgenLift, '@module WorldGen [domain]') !== 1
    || input.worldgenLift.includes('@module WorldGen [app]')) errors.push('lift-worldgen-header');

  const mainBlock = hazeBlock(mainArt, 'main-haze', errors);
  const legacyBlock = hazeBlock(legacyArt, 'legacy-haze', errors);
  const liftedBlock = hazeBlock(input.artLift, 'lift-haze', errors);
  if (mainBlock && digest(mainBlock) !== HAZE_BLOCK_SHA256) errors.push('main-haze-byte-parity');
  if (legacyBlock && digest(legacyBlock) !== HAZE_BLOCK_SHA256) errors.push('legacy-haze-byte-parity');
  if (liftedBlock && digest(liftedBlock) !== HAZE_BLOCK_SHA256) errors.push('lift-haze-byte-parity');
  if (mainBlock && legacyBlock && mainBlock !== legacyBlock) errors.push('main-legacy-haze-parity');
  if (mainBlock && liftedBlock && mainBlock !== liftedBlock) errors.push('main-lift-haze-parity');
  if (legacyBlock && liftedBlock && legacyBlock !== liftedBlock) errors.push('legacy-lift-haze-parity');

  if (!/return Object\.freeze\(\{[^}]*\bgalaxyHaze\b[^}]*\}\);/u.test(mainArt)) {
    errors.push('main-art-export');
  }
  if (!/return Object\.freeze\(\{[^}]*\bgalaxyHaze\b[^}]*\}\);/u.test(legacyArt)) {
    errors.push('legacy-art-export');
  }
  if (!/export \{[^}]*\bgalaxyHaze\b[^}]*\};/u.test(input.artLift)) errors.push('lift-art-export');
  if (/\bgalaxyHaze\b/u.test(input.worldgenLift)) errors.push('lift-worldgen-export');

  const artImport = namedImport(input.appMain, '@cf/art');
  const worldgenImport = namedImport(input.appMain, '@cf/domain-worldgen');
  if (!artImport?.includes('galaxyHaze')) errors.push('app-art-import');
  if (!worldgenImport || worldgenImport.includes('galaxyHaze')) errors.push('app-worldgen-import');
  if (occurrences(input.artIndex, 'galaxyHaze') !== 2) errors.push('art-index-surface');
  if (occurrences(
    input.artDeclaration,
    'export function galaxyHaze(seed: number, prof: Record<string, unknown>): HTMLCanvasElement;',
  ) !== 1) errors.push('art-declaration');
  if (/\bgalaxyHaze\b/u.test(input.worldgenDeclaration)) errors.push('worldgen-declaration');

  const artPackage = JSON.parse(input.artPackage) as { dependencies?: Record<string, string> };
  const packageLock = JSON.parse(input.packageLock) as {
    packages?: Record<string, { dependencies?: Record<string, string> }>;
  };
  if (artPackage.dependencies?.['@cf/domain-worldconfig'] !== '*') errors.push('art-package-dependency');
  if (packageLock.packages?.['packages/art']?.dependencies?.['@cf/domain-worldconfig'] !== '*') {
    errors.push('art-lock-dependency');
  }
  return errors;
}

function replaceExactly(source: string, target: string, replacement: string): string {
  expect(occurrences(source, target), `nonempty unique mutation target: ${target}`).toBe(1);
  const changed = source.replace(target, replacement);
  expect(changed).not.toBe(source);
  return changed;
}

function withTempDir<T>(run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-d-haze-lift-'));
  try { return run(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function runLift(name: string, outDir: string, sourcePath?: string) {
  const args = [liftToolPath, name, outDir];
  if (sourcePath) args.push('--source', sourcePath);
  return spawnSync(process.execPath, args, {
    cwd: v2Root,
    encoding: 'utf8',
  });
}

function fixtureModule(name: 'GalaxyArt' | 'WorldGen', banner: string): string {
  return `/* ================================================================\n`
    + `   ${banner}\n`
    + `   ================================================================ */\n`
    + `const ${name}=(()=>{\n`
    + `function marker(){ return 1; }\n`
    + `return Object.freeze({marker});\n`
    + `})();\n`
    + `const {marker}=${name};\n`;
}

describe('D-HAZE — exact render-layer ownership and parity', () => {
  it('keeps the exact legacy generator/cache bytes in GalaxyArt and out of WorldGen', () => {
    if (localMain !== null) expect(localMain).toBe(sources.main);
    expect(ownershipErrors(sources)).toEqual([]);
  });

  it('negative control: a haze-output mutation breaks the exact parity seal', () => {
    const mutated = replaceExactly(
      sources.artLift,
      'while(placed<15000 && tries<230000)',
      'while(placed<14999 && tries<230000)',
    );
    expect(ownershipErrors({ ...sources, artLift: mutated })).toEqual(expect.arrayContaining([
      'lift-haze-byte-parity',
      'legacy-lift-haze-parity',
    ]));

    const mutatedMain = replaceExactly(
      sources.main,
      'while(placed<15000 && tries<230000)',
      'while(placed<14999 && tries<230000)',
    );
    expect(ownershipErrors({ ...sources, main: mutatedMain })).toEqual(expect.arrayContaining([
      'main-haze-byte-parity',
      'main-legacy-haze-parity',
      'main-lift-haze-parity',
    ]));
  });

  it('negative control: stale domain ownership is rejected independently', () => {
    const staleWorldgen = `${sources.worldgenLift}\n${HAZE_START}\nfunction galaxyHaze(seed, prof){ document.body; return [seed, prof]; }\n`;
    expect(ownershipErrors({ ...sources, worldgenLift: staleWorldgen })).toEqual(expect.arrayContaining([
      'lift-worldgen-function-owner:1',
      'lift-worldgen-cache-owner:1',
      'lift-worldgen-dom',
      'lift-worldgen-export',
    ]));

    const staleMainWorldgen = replaceExactly(
      sources.main,
      '/* @end WorldGen */',
      'const staleGalaxyHaze=galaxyHaze;\n/* @end WorldGen */',
    );
    expect(ownershipErrors({ ...sources, main: staleMainWorldgen }))
      .toEqual(['main-worldgen-haze-token']);
  });

  it('negative control: wiring the app back to WorldGen is rejected', () => {
    const withoutArtOwner = replaceExactly(sources.appMain, '  galaxyHaze,\n', '');
    const rewired = replaceExactly(
      withoutArtOwner,
      'import { galaxyProfile, systemFor,',
      'import { galaxyProfile, galaxyHaze, systemFor,',
    );
    expect(ownershipErrors({ ...sources, appMain: rewired })).toEqual(expect.arrayContaining([
      'app-art-import',
      'app-worldgen-import',
    ]));
  });

  it('negative control: generated ownership labels are rejected', () => {
    const artAsDomain = replaceExactly(
      sources.artLift,
      '@module GalaxyArt [app]',
      '@module GalaxyArt [domain]',
    );
    expect(ownershipErrors({ ...sources, artLift: artAsDomain })).toContain('lift-art-header');

    const worldgenAsApp = replaceExactly(
      sources.worldgenLift,
      '@module WorldGen [domain]',
      '@module WorldGen [app]',
    );
    expect(ownershipErrors({ ...sources, worldgenLift: worldgenAsApp }))
      .toContain('lift-worldgen-header');
  });

  it('executes the real lifter for current parity and fail-closed banner ownership', () => {
    withTempDir((dir) => {
      const trackedSourcePath = path.join(dir, 'tracked-main.js');
      fs.writeFileSync(trackedSourcePath, sources.main);
      const currentOut = path.join(dir, 'current');
      const currentArt = runLift('GalaxyArt', currentOut, trackedSourcePath);
      const currentWorldgen = runLift('WorldGen', currentOut, trackedSourcePath);
      expect({ status: currentArt.status, stderr: currentArt.stderr }).toEqual({ status: 0, stderr: '' });
      expect({ status: currentWorldgen.status, stderr: currentWorldgen.stderr })
        .toEqual({ status: 0, stderr: '' });
      expect(fs.readFileSync(path.join(currentOut, 'galaxyart.verbatim.js'), 'utf8'))
        .toBe(sources.artLift);
      expect(fs.readFileSync(path.join(currentOut, 'worldgen.verbatim.js'), 'utf8'))
        .toBe(sources.worldgenLift);

      const fixtureCases = [
        ['app', 'GalaxyArt', '@module GalaxyArt [app]', 0, '@module GalaxyArt [app]'],
        ['domain', 'WorldGen', '@module WorldGen [domain]', 0, '@module WorldGen [domain]'],
        ['missing', 'GalaxyArt', 'module owner intentionally absent', 1, null],
        ['wrong-kind', 'GalaxyArt', '@module GalaxyArt [worker]', 1, null],
        ['duplicate', 'GalaxyArt', '@module GalaxyArt [app]\n   @module GalaxyArt [domain]', 1, null],
      ] as const;
      for (const [label, name, banner, expectedStatus, expectedHeader] of fixtureCases) {
        const sourcePath = path.join(dir, `${label}.js`);
        const outDir = path.join(dir, `${label}-out`);
        fs.writeFileSync(sourcePath, fixtureModule(name, banner));
        const result = runLift(name, outDir, sourcePath);
        expect(result.status, `${label}: ${result.stderr}`).toBe(expectedStatus);
        if (expectedStatus === 0) {
          const generated = fs.readFileSync(path.join(outDir, `${name.toLowerCase()}.verbatim.js`), 'utf8');
          expect(generated).toContain(expectedHeader);
        } else {
          expect(result.stderr).toContain(`exact module ownership banner not found for: ${name}`);
          expect(fs.existsSync(outDir)).toBe(false);
        }
      }
    });
  });
});
