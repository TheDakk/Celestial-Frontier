import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(
  new URL('../apps/game/src/main.ts', import.meta.url),
  'utf8',
);
const ownerSource = readFileSync(
  new URL('../apps/game/src/frame-coalescer.ts', import.meta.url),
  'utf8',
);

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function section(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : '';
}

function replaceUnique(source: string, needle: string, replacement: string): string {
  if (occurrences(source, needle) !== 1) {
    throw new Error(`renderer-density mutation anchor is not unique: ${needle}`);
  }
  return source.replace(needle, replacement);
}

function integrationErrors(main: string, owner: string): string[] {
  const errors: string[] = [];
  const importBlock = section(
    main,
    "import { createFrameCoalescer } from './frame-coalescer.js';",
    '\n',
  );
  const densityOwner = section(
    main,
    '  const rendererDensitySync = createFrameCoalescer(',
    "\n  addEventListener('resize', syncRendererDensity);",
  );
  const release = section(
    main,
    '  releaseRendererForReload = (reason, audio): ReloadReleaseWitness => {',
    '\n  app.stage.addChild(world);',
  );

  if (importBlock.length === 0) errors.push('owner-import');
  if (densityOwner.length === 0
    || occurrences(densityOwner, 'createFrameCoalescer(') !== 1
    || occurrences(densityOwner, 'rendererDensitySync.request();') !== 1) {
    errors.push('single-owner');
  }
  if (!densityOwner.includes('(callback) => requestAnimationFrame(callback),')
    || !densityOwner.includes('(handle) => cancelAnimationFrame(handle),')) {
    errors.push('animation-frame-boundary');
  }
  const sampling = densityOwner.indexOf('const nextDensityPlan = effectiveDensityPlan();');
  const frameCallback = densityOwner.indexOf('    () => {');
  if (frameCallback < 0 || sampling < frameCallback) errors.push('latest-frame-sampling');
  if (!densityOwner.includes('rerender({ preserveSurvey: true, skipPersist: true });')) {
    errors.push('nonpersistent-rebuild');
  }
  if (densityOwner.includes('rerender({ preserveSurvey: true });')) {
    errors.push('legacy-persisting-rebuild');
  }
  const cancel = release.indexOf('rendererDensitySync.cancel();');
  const destroy = release.indexOf('app.destroy(');
  if (cancel < 0 || destroy < 0 || cancel >= destroy) errors.push('reload-cancel-before-destroy');

  if (!owner.includes('if (handle !== null) return;')
    || !owner.includes('handle = null;\n      run();')
    || !owner.includes('cancelScheduled(handle);\n    handle = null;')) {
    errors.push('coalescer-semantics');
  }
  if (/\b(?:window|document|Application|Texture|persistView|rerender)\b/.test(owner)) {
    errors.push('owner-layering');
  }
  return [...new Set(errors)];
}

describe('renderer density resize ownership', () => {
  it('coalesces event bursts, samples on-frame, and never persists a density-only rebuild', () => {
    expect(integrationErrors(mainSource, ownerSource)).toEqual([]);
  });

  it('negative-controls persistence, direct event work, and reload teardown', () => {
    const densityRebuild = [
      '           mint persistence intent. */',
      '        rerender({ preserveSurvey: true, skipPersist: true });',
    ].join('\n');
    const persisting = replaceUnique(
      mainSource,
      densityRebuild,
      densityRebuild.replace(
        'rerender({ preserveSurvey: true, skipPersist: true });',
        'rerender({ preserveSurvey: true });',
      ),
    );
    expect(integrationErrors(persisting, ownerSource)).toEqual(expect.arrayContaining([
      'nonpersistent-rebuild', 'legacy-persisting-rebuild',
    ]));

    const direct = replaceUnique(
      mainSource,
      'const syncRendererDensity = (): void => { rendererDensitySync.request(); };',
      'const syncRendererDensity = (): void => { effectiveDensityPlan(); };',
    );
    expect(integrationErrors(direct, ownerSource)).toContain('single-owner');

    const uncancelled = replaceUnique(
      mainSource,
      '    rendererDensitySync.cancel();',
      '    /* negative control: pending density frame retained */',
    );
    expect(integrationErrors(uncancelled, ownerSource)).toContain('reload-cancel-before-destroy');
  });

  it('negative-controls a coalescer that retains frame ownership while running', () => {
    const staleHandle = replaceUnique(
      ownerSource,
      '      handle = null;\n      run();',
      '      run();\n      handle = null;',
    );
    expect(integrationErrors(mainSource, staleHandle)).toContain('coalescer-semantics');
  });
});
