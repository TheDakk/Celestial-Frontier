import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function section(startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function wiringErrors(candidate: string): string[] {
  const errors: string[] = [];
  const detail = (() => {
    const start = candidate.indexOf('function fillCodexDetail(');
    const end = candidate.indexOf('\nfunction boundedCollectionActionsWritable(', start);
    return start >= 0 && end > start ? candidate.slice(start, end) : '';
  })();
  const close = (() => {
    const start = candidate.indexOf('function cancelCodexDetailArt()');
    const end = candidate.indexOf('\nfunction closeCodexSurface()', start);
    return start >= 0 && end > start ? candidate.slice(start, end) : '';
  })();
  if (!candidate.includes("import { LivingSpeciesPreviewControllerV1 } from './living-species-preview.js';")
    || !candidate.includes('const livingSpeciesPreview = new LivingSpeciesPreviewControllerV1({')) {
    errors.push('living preview controller is not the Compendium portrait owner');
  }
  if ((candidate.match(/speciesArtLoader\.requestPortrait\(/gu)?.length ?? 0) !== 1
    || !candidate.includes("resourceKind: 'image'")) {
    errors.push('living preview does not reuse exactly one existing image portrait request');
  }
  for (const owner of [
    'document.visibilityState', "codexMode === 'detail'", "openPanelId() === 'codex'",
    'reducedMotion:', 'app.ticker.add(tick);', 'app.ticker.remove(tick);',
  ]) if (!candidate.includes(owner)) errors.push(`living preview omits ${owner}`);
  if (!close.includes('livingSpeciesPreview.close();')
    || !close.includes('livingSpeciesPortrait = null;')) {
    errors.push('detail replacement does not release its exact portrait owner');
  }
  const bind = detail.indexOf('livingSpeciesPortrait = portrait;');
  const select = detail.indexOf('livingSpeciesPreview.select(e.g as Record<string, unknown>);');
  if (!(bind >= 0 && select > bind)
    || detail.includes('const publishPortrait =')
    || detail.includes("speciesArtLoader.requestPortrait('codex-detail'")) {
    errors.push('detail does not bind one selected genome through the living preview controller');
  }
  if (!candidate.includes('signalLivingSpeciesEnvironment();\n  syncTopbarH()')
    || !candidate.includes('livingSpeciesPreview.dispose();')) {
    errors.push('motion or document teardown is not connected to preview cleanup');
  }
  return errors;
}

describe('living species Compendium integration', () => {
  it('animates the existing exact portrait with bounded lifecycle ownership', () => {
    expect(wiringErrors(source)).toEqual([]);
    expect(section('const livingSpeciesPreview =', '\nlet codexRenderCommits')).not.toBe('');
  });

  it('negative-controls duplicate portrait ownership and close cleanup', () => {
    expect(wiringErrors(source.replace(
      '  livingSpeciesPreview.close();',
      '  // preview leaked',
    ))).toContain('detail replacement does not release its exact portrait owner');
    expect(wiringErrors(source.replace(
      '      livingSpeciesPreview.select(e.g as Record<string, unknown>);',
      "      speciesArtLoader.requestPortrait('codex-detail', e.g as Record<string, unknown>, () => {});",
    ))).toContain('living preview does not reuse exactly one existing image portrait request');
  });
});
