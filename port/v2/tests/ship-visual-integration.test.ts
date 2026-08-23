import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);
const shipyardPreviewSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/shipyard-preview.ts', import.meta.url)),
  'utf8',
);

function synchronousShipyardPreviewErrors(source: string): string[] {
  const asynchronousTokens = [
    'setTimeout', 'requestAnimationFrame', 'Promise', 'async', 'await', 'fetch', 'new Image',
  ];
  return asynchronousTokens.filter((token) => source.includes(token));
}

function shipVisualIntegrationErrors(source: string): string[] {
  const errors: string[] = [];
  const bindings: ReadonlyArray<readonly [string, string]> = [
    [
      'const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;',
      'travel stage bypasses ShipVisualState',
    ],
    [
      'const candidateStage = shipVisualStateOf({',
      'candidate navigation bypasses ShipVisualState',
    ],
    [
      'const visual = currentShipVisualState();',
      'Shipyard does not consume the shared visual projection',
    ],
    [
      'shipyardPreviewOwner.open(visual);',
      'Shipyard preview does not consume the shared visual projection',
    ],
    [
      'shipVisual: currentShipVisualState(),',
      'browser diagnostics omit the shared visual projection',
    ],
    [
      'const SHIP_LIVERY_SEED = 0x5111;',
      'ship livery no longer uses the legacy deterministic seed',
    ],
    [
      "array: 'Long-Range Array',",
      'Long-Range Array display name drifted',
    ],
    [
      "autoext: 'Auto-Extractor',",
      'Auto-Extractor display name drifted',
    ],
    [
      "cscoop: 'Corona Scoop',",
      'Corona Scoop display name drifted',
    ],
    [
      "['autoext', 'Auto-Extractor mount', visual.hardpoints.autoext]",
      'Auto-Extractor hardpoint identity drifted',
    ],
    [
      "['cscoop', 'Corona Scoop mount', visual.hardpoints.cscoop]",
      'Corona Scoop hardpoint identity drifted',
    ],
  ];
  for (const [binding, message] of bindings) {
    if (source.split(binding).length - 1 !== 1) errors.push(message);
  }

  const panelStart = source.indexOf('function fillShipyard(): void {');
  const panelEnd = source.indexOf('function shipyardDiagnostics(): unknown {');
  const panel = panelStart >= 0 && panelEnd > panelStart
    ? source.slice(panelStart, panelEnd)
    : '';
  if (!panel.includes('visual.installedSystemIds')) {
    errors.push('Shipyard installed-system rows bypass ShipVisualState');
  }
  if (panel.includes('save.items') || panel.includes('save.ascCh')) {
    errors.push('Shipyard rereads mutable save capability fields');
  }
  return errors;
}

describe('ShipVisualState app integration', () => {
  it('is the one capability projection for travel, panel, preview, and diagnostics', () => {
    expect(shipVisualIntegrationErrors(mainSource)).toEqual([]);
  });

  it('negative control: a direct travel-stage selector is rejected', () => {
    const broken = mainSource.replace(
      'const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;',
      'const ascStage = (): 0 | 1 | 2 | 3 => ascStageOf(save.items, save.ascCh);',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken)).toContain(
      'travel stage bypasses ShipVisualState',
    );
  });

  it('negative control: a Shipyard save reread is rejected', () => {
    const broken = mainSource.replace(
      'const visual = currentShipVisualState();',
      'const visual = currentShipVisualState(); void save.items;',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken)).toContain(
      'Shipyard rereads mutable save capability fields',
    );
  });

  it('negative control: a preview fed by a separate projection is rejected', () => {
    const broken = mainSource.replace(
      'shipyardPreviewOwner.open(visual);',
      'shipyardPreviewOwner.open(currentShipVisualState());',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken)).toContain(
      'Shipyard preview does not consume the shared visual projection',
    );
  });

  it('negative control: a friendly hardpoint alias is rejected', () => {
    const broken = mainSource.replace(
      "['autoext', 'Auto-Extractor mount', visual.hardpoints.autoext]",
      "['extractor', 'Extractor mount', visual.hardpoints.autoext]",
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken)).toContain(
      'Auto-Extractor hardpoint identity drifted',
    );
  });

  it('keeps the one-owner Shipyard preview synchronously settled', () => {
    expect(synchronousShipyardPreviewErrors(shipyardPreviewSource)).toEqual([]);
  });

  it('negative control: asynchronous Shipyard preview work cannot hide behind zero diagnostics', () => {
    const broken = shipyardPreviewSource.replace(
      'const SVG_NS =',
      'void Promise.resolve();\nconst SVG_NS =',
    );
    expect(broken).not.toBe(shipyardPreviewSource);
    expect(synchronousShipyardPreviewErrors(broken)).toEqual(['Promise']);
  });
});
