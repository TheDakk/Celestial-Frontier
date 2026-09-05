import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(
  fileURLToPath(new URL('../apps/game/index.html', import.meta.url)),
  'utf8',
);
const rendererSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/star-atlas-panel.ts', import.meta.url)),
  'utf8',
);

function balancedBlockAt(source: string, anchor: string, start = 0): string | null {
  const anchorAt = source.indexOf(anchor, start);
  if (anchorAt < 0) return null;
  const anchoredOpen = anchor.lastIndexOf('{');
  const open = anchoredOpen >= 0
    ? anchorAt + anchoredOpen
    : source.indexOf('{', anchorAt + anchor.length);
  if (open < 0) return null;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }
  return null;
}

function declarations(source: string, anchor: string): string {
  return balancedBlockAt(source, anchor) ?? '';
}

function hasTouchFloor(block: string): boolean {
  return /min-width\s*:\s*44px\s*;/u.test(block)
    && /min-height\s*:\s*44px\s*;/u.test(block);
}

function atlasCssIssues(index: string, renderer: string): string[] {
  const issues: string[] = [];
  const body = declarations(index, '#atlaspanel [data-star-atlas-body]');
  const controls = declarations(
    index,
    '#atlaspanel :is(.atlas-view-tabs,.atlas-filters) > button,',
  );
  const rowActions = declarations(index, '#atlaspanel .atlas-entry-actions > button');
  const chart = declarations(index, '#atlaspanel .atlas-chart {');
  const chartPoint = declarations(index, '#atlaspanel .atlas-chart-point {');
  const current = declarations(index, '#atlaspanel .atlas-chart-current {');

  if (!/display\s*:\s*grid\s*;/u.test(body) || !/min-width\s*:\s*0\s*;/u.test(body)) {
    issues.push('bounded-body');
  }
  if (!hasTouchFloor(controls) || !/touch-action\s*:\s*manipulation\s*;/u.test(controls)) {
    issues.push('view-filter-home-undo-touch-floor');
  }
  if (!hasTouchFloor(rowActions)) issues.push('row-action-touch-floor');
  if (!/position\s*:\s*relative\s*;/u.test(chart)
    || !/overflow\s*:\s*hidden\s*;/u.test(chart)
    || !/min-height\s*:\s*240px\s*;/u.test(chart)) {
    issues.push('chart-field');
  }
  if (!/min-width\s*:\s*220px\s*;/u.test(chart)
    || !index.includes('#atlaspanel .atlas-cluster-back,')) {
    issues.push('cluster-touch-extent');
  }
  if (!hasTouchFloor(chartPoint)
    || !/position\s*:\s*absolute\s*;/u.test(chartPoint)
    || !/left\s*:\s*var\(--atlas-x\)\s*;/u.test(chartPoint)
    || !/top\s*:\s*var\(--atlas-y\)\s*;/u.test(chartPoint)
    || !/transform\s*:\s*translate\(-50%\s*,\s*-50%\)\s*;/u.test(chartPoint)) {
    issues.push('chart-point-placement');
  }
  if (!/left\s*:\s*var\(--atlas-x\)\s*;/u.test(current)
    || !/top\s*:\s*var\(--atlas-y\)\s*;/u.test(current)
    || !/pointer-events\s*:\s*none\s*;/u.test(current)) {
    issues.push('current-view-crosshair');
  }

  const reducedBlocks: string[] = [];
  const media = '@media (prefers-reduced-motion: reduce)';
  let cursor = 0;
  while (cursor < index.length) {
    const at = index.indexOf(media, cursor);
    if (at < 0) break;
    const block = balancedBlockAt(index, media, at);
    if (block !== null) reducedBlocks.push(block);
    cursor = at + media.length;
  }
  const reduced = reducedBlocks.some((block) => (
    block.includes('#atlaspanel [data-star-atlas-body]')
    && /animation\s*:\s*none\s*!important\s*;/u.test(block)
    && /transition\s*:\s*none\s*!important\s*;/u.test(block)
  ));
  if (!reduced) issues.push('reduced-motion');

  for (const token of [
    'class="atlas-view-tabs"',
    'class="atlas-filters"',
    'class="atlas-list"',
    'class="atlas-chart"',
    'class="atlas-chart-point',
    'class="atlas-chart-current"',
    'class="atlas-chart-unmapped"',
    'class="atlas-undo"',
  ]) {
    if (!renderer.includes(token)) issues.push(`renderer:${token}`);
  }
  return issues;
}

describe('mature Star Atlas CSS contract', () => {
  it('positions the semantic Chart and preserves mobile-first native controls', () => {
    expect(atlasCssIssues(indexSource, rendererSource)).toEqual([]);
  });

  it('rejects undersized points, detached coordinates, and lost motion protection', () => {
    const undersized = indexSource.replace(
      'width: 44px; height: 44px; min-width: 44px;',
      'width: 32px; height: 32px; min-width: 32px;',
    );
    const detached = indexSource.replace(
      'left: var(--atlas-x); top: var(--atlas-y); transform: translate(-50%,-50%);',
      'left: 0; top: 0; transform: none;',
    );
    const motionLost = indexSource.replace(
      '#atlaspanel [data-star-atlas-body], #atlaspanel [data-star-atlas-body] * {\n'
        + '        animation: none !important; transition: none !important; }',
      '#atlaspanel [data-star-atlas-body] { animation: atlas-drift 2s infinite; }',
    );
    expect(undersized).not.toBe(indexSource);
    expect(detached).not.toBe(indexSource);
    expect(motionLost).not.toBe(indexSource);
    expect(atlasCssIssues(undersized, rendererSource)).toContain('chart-point-placement');
    expect(atlasCssIssues(detached, rendererSource)).toContain('chart-point-placement');
    expect(atlasCssIssues(motionLost, rendererSource)).toContain('reduced-motion');
  });
});

describe('Chart cluster touch floor', () => {
  it('rejects a lost minimum map width or unshared return-control style', () => {
    expect(atlasCssIssues(indexSource, rendererSource)).toEqual([]);
    expect(atlasCssIssues(indexSource.replace('min-width: 220px; min-height: 240px;',
      'min-width: 0; min-height: 240px;'), rendererSource)).toContain('cluster-touch-extent');
    expect(atlasCssIssues(indexSource.replace('#atlaspanel .atlas-cluster-back,', ''),
      rendererSource)).toContain('cluster-touch-extent');
  });
});
