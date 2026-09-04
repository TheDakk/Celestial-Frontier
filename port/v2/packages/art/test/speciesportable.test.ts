import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import type { ArtCanvas } from '../src/speciescanvas.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const artRoot = path.resolve(here, '..');
const packagesRoot = path.resolve(artRoot, '..');

function sourcePath(importer: string, specifier: string): string | null {
  if (specifier.startsWith('.')) {
    const exact = path.resolve(path.dirname(importer), specifier);
    const candidates = exact.endsWith('.js')
      ? [exact.slice(0, -3) + '.ts', exact]
      : [exact, exact + '.ts', exact + '.js'];
    return candidates.find(existsSync) ?? null;
  }
  if (!specifier.startsWith('@cf/')) return null;
  const packageDirs: string[] = [];
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const direct = path.join(packagesRoot, entry.name);
    if (existsSync(path.join(direct, 'package.json'))) packageDirs.push(direct);
    for (const child of readdirSync(direct, { withFileTypes: true })) {
      if (child.isDirectory()) packageDirs.push(path.join(direct, child.name));
    }
  }
  for (const packageDir of packageDirs) {
    const manifestPath = path.join(packageDir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      name?: string;
      exports?: Record<string, string>;
    };
    if (manifest.name !== specifier) continue;
    const exported = manifest.exports?.['.'];
    if (!exported) throw new Error(`${specifier} lacks a source export`);
    return path.resolve(packageDir, exported);
  }
  throw new Error(`unresolved workspace import ${specifier}`);
}

function staticImports(source: string): string[] {
  return [...source.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g)]
    .map((match) => match[1]!);
}

function workerGraph(entry: string): Map<string, string> {
  const graph = new Map<string, string>();
  const pending = [entry];
  while (pending.length) {
    const file = pending.pop()!;
    if (graph.has(file)) continue;
    const source = readFileSync(file, 'utf8');
    graph.set(file, source);
    for (const specifier of staticImports(source)) {
      const target = sourcePath(file, specifier);
      if (target) pending.push(target);
    }
  }
  return graph;
}

function forbiddenProducerTokens(source: string): string[] {
  const checks = [
    ['document', /\bdocument\b/],
    ['window', /\bwindow\b/],
    ['Image constructor', /\bImage\b/],
    ['synchronous URL encoder', /\.toDataURL\s*\(/],
  ] as const;
  return checks.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
}

function fakeCanvas(width: number, height: number): ArtCanvas {
  const fields: Record<PropertyKey, unknown> = { width, height };
  const method = (name: string) => (...args: unknown[]): unknown => {
    if (name === 'createLinearGradient' || name === 'createRadialGradient') {
      return { addColorStop: () => {} };
    }
    if (name === 'measureText') return { width: String(args[0] ?? '').length * 8 };
    if (name === 'getImageData' || name === 'createImageData') {
      const x = name === 'getImageData' ? 2 : 0;
      const w = Math.max(0, Number(args[x]) || 0);
      const h = Math.max(0, Number(args[x + 1]) || 0);
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    }
    if (name === 'getLineDash') return [];
    if (name === 'getTransform') return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    if (name === 'isPointInPath' || name === 'isPointInStroke') return false;
    return undefined;
  };
  const context = new Proxy(fields, {
    get(target, property) {
      if (Reflect.has(target, property)) return Reflect.get(target, property);
      const fn = method(String(property));
      Reflect.set(target, property, fn);
      return fn;
    },
    set(target, property, value) { return Reflect.set(target, property, value); },
  });
  const canvas = {
    width,
    height,
    getContext: (kind: string) => kind === '2d' ? context : null,
  };
  Reflect.set(fields, 'canvas', canvas);
  return canvas as unknown as ArtCanvas;
}

describe.sequential('portable species portrait graph', () => {
  it('has a complete static graph with no browser-owned allocator or encoder', () => {
    const entry = path.join(artRoot, 'src', 'speciespainter.ts');
    const graph = workerGraph(entry);
    const relativeFiles = [...graph.keys()].map((file) => path.relative(packagesRoot, file)).sort();
    expect(relativeFiles).toContain('art/src/hdportrait.worker.verbatim.js');
    expect(relativeFiles).toContain('art/src/speciesoverrides.ts');
    expect(relativeFiles).toContain('domain/genome/src/genome.verbatim.js');
    expect(relativeFiles).not.toContain('art/src/hdart.verbatim.js');
    expect(relativeFiles).not.toContain('art/src/speciesart.ts');
    expect(relativeFiles).not.toContain('art/src/speciescompat.ts');

    const findings = [...graph.entries()].flatMap(([file, source]) =>
      forbiddenProducerTokens(source).map((token) => `${path.relative(packagesRoot, file)}: ${token}`));
    expect(findings).toEqual([]);

    /* NEGATIVE CONTROLS: the guard catches the old allocator/encoder shape,
       while ordinary drawImage use is not a false positive for `Image`. */
    expect(forbiddenProducerTokens("document.createElement('canvas').toDataURL()"))
      .toEqual(['document', 'synchronous URL encoder']);
    expect(forbiddenProducerTokens('context.drawImage(canvas, 0, 0)')).toEqual([]);
  });

  it('keeps the legacy generated files byte-sealed and the worker export set narrow', () => {
    const legacy = readFileSync(path.join(artRoot, 'src', 'hdart.verbatim.js'));
    const legacyDeclaration = readFileSync(path.join(artRoot, 'src', 'hdart.verbatim.d.ts'));
    expect(createHash('sha256').update(legacy).digest('hex'))
      .toBe('8ab222a3c63a0db04c28a7e5d51a5af4e34e7dbdfe1573eaaaa2c50bed086e49');
    expect(createHash('sha256').update(legacyDeclaration).digest('hex'))
      .toBe('e9dc30cba0b4988d516bf69cb620ac5906408cd25ac264cf31fce37eab9874c7');

    const worker = readFileSync(path.join(artRoot, 'src', 'hdportrait.worker.verbatim.js'), 'utf8');
    expect(worker.match(/createSpeciesCanvas\(1, 1\)/g)).toHaveLength(14);
    const exportLine = worker.match(/export \{ ([^}]+) \};\s*$/)?.[1]?.split(', ').sort();
    expect(exportLine).toEqual([
      'HD_PALS',
      '_hdCamo',
      '_hdFbm',
      '_hdHash',
      '_hdPlaceBeast',
      '_hdPlantBare',
      '_hdSm',
      '_hdStampPlant',
      'hdBeastBare',
      'hdFloraBare',
      'hdPortraitFaunaCanvas',
      'hdPortraitFloraCanvas',
      'hdPortraitFungiCanvas',
      'hdPortraitMicrobeCanvas',
    ].sort());
    expect(worker).not.toMatch(/\b(?:_hdVolcano|vistaBox)\b/);
  });

  it('enforces one realm canvas factory before allocation', async () => {
    vi.resetModules();
    const canvasOwner = await import('../src/speciescanvas.js');
    expect(() => canvasOwner.createSpeciesCanvas(1, 1)).toThrow(/factory is not installed/);
    expect(() => canvasOwner.createSpeciesCanvas(0, 1)).toThrow(/positive integers/);
    canvasOwner.installSpeciesCanvasFactory(fakeCanvas);
    const canvas = canvasOwner.createSpeciesCanvas(17, 23);
    expect([canvas.width, canvas.height]).toEqual([17, 23]);
    expect(() => canvasOwner.installSpeciesCanvasFactory(fakeCanvas)).toThrow(/cannot change after allocation/);
  });

  it('renders all four fallback kingdoms and the 132 derivative through the portable seam', async () => {
    vi.resetModules();
    const canvasOwner = await import('../src/speciescanvas.js');
    const allocations: Array<readonly [number, number]> = [];
    canvasOwner.installSpeciesCanvasFactory((width, height) => {
      allocations.push([width, height]);
      return fakeCanvas(width, height);
    });
    const painter = await import('../src/speciespainter.js');
    for (const [index, kingdom] of ['fauna', 'flora', 'fungi', 'microbe'].entries()) {
      const genome = {
        ...(makeGenome(1200 + index, kingdom, 1) as unknown as Record<string, unknown>),
        _earthName: 'Portable fallback control',
      };
      const portrait = painter.renderSpeciesPortraitCanvas(genome);
      expect([portrait.width, portrait.height]).toEqual([440, 440]);
    }
    const thumbGenome = {
      ...(makeGenome(1300, 'fauna', 1) as unknown as Record<string, unknown>),
      _earthName: 'Portable fallback control',
    };
    const thumb = painter.renderSpeciesThumbCanvas(thumbGenome);
    expect([thumb.width, thumb.height]).toEqual([132, 132]);
    expect(allocations).toContainEqual([132, 132]);
  });

  it('fails closed when the supplied realm has no 2D surface', async () => {
    vi.resetModules();
    const canvasOwner = await import('../src/speciescanvas.js');
    canvasOwner.installSpeciesCanvasFactory((width, height) => ({
      width,
      height,
      getContext: () => null,
    }) as unknown as ArtCanvas);
    const painter = await import('../src/speciespainter.js');
    const genome = {
      ...(makeGenome(1301, 'fauna', 1) as unknown as Record<string, unknown>),
      _earthName: 'Portable fallback control',
    };
    /* NEGATIVE CONTROL: missing producer capability cannot become a
       superficially valid painted asset. */
    expect(() => painter.renderSpeciesThumbCanvas(genome)).toThrow();
  });
});
