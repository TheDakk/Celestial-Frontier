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
const engineeringPanelSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/engineering-panel.ts', import.meta.url)),
  'utf8',
);

function synchronousShipyardPreviewErrors(source: string): string[] {
  const asynchronousTokens = [
    'setTimeout', 'requestAnimationFrame', 'Promise', 'async', 'await', 'fetch', 'new Image',
  ];
  return asynchronousTokens.filter((token) => source.includes(token));
}

function shipVisualIntegrationErrors(main: string, panel: string): string[] {
  const errors: string[] = [];
  const mainBindings: ReadonlyArray<readonly [string, string]> = [
    [
      'const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;',
      'travel stage bypasses ShipVisualState',
    ],
    [
      'const candidateStage = shipVisualStateOf({',
      'candidate navigation bypasses ShipVisualState',
    ],
    [
      'const ship = shipVisualStateOf({',
      'Engineering read model does not derive the shared visual projection',
    ],
    [
      'engineeringPanelController.setState(projectEngineeringPanelReadModel({',
      'Engineering panel does not consume its verified read model',
    ],
    [
      'shipVisual: currentShipVisualState(),',
      'browser diagnostics omit the shared visual projection',
    ],
    [
      'const SHIP_LIVERY_SEED = 0x5111;',
      'ship livery no longer uses the legacy deterministic seed',
    ],
  ];
  const panelBindings: ReadonlyArray<readonly [string, string]> = [
    ['assertShip(model.ship);', 'Engineering read-model validation bypasses ShipVisualState'],
    [
      'const previewMount = this.#shipOverview(this.#state.ship);',
      'Engineering overview does not consume the verified ShipVisualState',
    ],
    [
      'this.#previewOwner.open(this.#state.ship);',
      'Shipyard preview does not consume the verified ShipVisualState',
    ],
    [
      'for (const id of ship.installedSystemIds)',
      'Engineering installed-system rows bypass ShipVisualState',
    ],
    ["array: 'Long-Range Array',", 'Long-Range Array display name drifted'],
    ["autoext: 'Auto-Extractor',", 'Auto-Extractor display name drifted'],
    ["cscoop: 'Corona Scoop',", 'Corona Scoop display name drifted'],
    [
      "['autoext', 'Auto-Extractor mount', ship.hardpoints.autoext]",
      'Auto-Extractor hardpoint identity drifted',
    ],
    [
      "['cscoop', 'Corona Scoop mount', ship.hardpoints.cscoop]",
      'Corona Scoop hardpoint identity drifted',
    ],
  ];
  for (const [binding, message] of mainBindings) {
    if (main.split(binding).length - 1 !== 1) errors.push(message);
  }
  for (const [binding, message] of panelBindings) {
    if (panel.split(binding).length - 1 !== 1) errors.push(message);
  }
  if (panel.includes('save.items') || panel.includes('save.ascCh')) {
    errors.push('Engineering controller rereads mutable save capability fields');
  }
  return errors;
}

describe('ShipVisualState app integration', () => {
  it('is the one capability projection for travel, panel, preview, and diagnostics', () => {
    expect(shipVisualIntegrationErrors(mainSource, engineeringPanelSource)).toEqual([]);
  });

  it('negative control: a direct travel-stage selector is rejected', () => {
    const broken = mainSource.replace(
      'const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;',
      'const ascStage = (): 0 | 1 | 2 | 3 => ascStageOf(save.items, save.ascCh);',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken, engineeringPanelSource)).toContain(
      'travel stage bypasses ShipVisualState',
    );
  });

  it('negative control: an Engineering controller save reread is rejected', () => {
    const broken = engineeringPanelSource.replace(
      '  #shipOverview(ship: ShipVisualState):',
      '  #shipOverview(ship: ShipVisualState): /* void save.items */',
    );
    expect(broken).not.toBe(engineeringPanelSource);
    expect(shipVisualIntegrationErrors(mainSource, broken)).toContain(
      'Engineering controller rereads mutable save capability fields',
    );
  });

  it('negative control: bypassing the verified Engineering read model is rejected', () => {
    const broken = mainSource.replace(
      'engineeringPanelController.setState(projectEngineeringPanelReadModel({',
      'engineeringPanelController.setState((null as never)); void projectEngineeringPanelReadModel({',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken, engineeringPanelSource)).toContain(
      'Engineering panel does not consume its verified read model',
    );
  });

  it('negative control: a preview fed by a separate projection is rejected', () => {
    const broken = engineeringPanelSource.replace(
      'this.#previewOwner.open(this.#state.ship);',
      'this.#previewOwner.open(structuredClone(this.#state.ship));',
    );
    expect(broken).not.toBe(engineeringPanelSource);
    expect(shipVisualIntegrationErrors(mainSource, broken)).toContain(
      'Shipyard preview does not consume the verified ShipVisualState',
    );
  });

  it('negative control: a friendly hardpoint alias is rejected', () => {
    const broken = engineeringPanelSource.replace(
      "['autoext', 'Auto-Extractor mount', ship.hardpoints.autoext]",
      "['extractor', 'Extractor mount', ship.hardpoints.autoext]",
    );
    expect(broken).not.toBe(engineeringPanelSource);
    expect(shipVisualIntegrationErrors(mainSource, broken)).toContain(
      'Auto-Extractor hardpoint identity drifted',
    );
  });

  it('negative control: installed-system rows cannot bypass ShipVisualState', () => {
    const broken = engineeringPanelSource.replace(
      'for (const id of ship.installedSystemIds)',
      'for (const id of [] as const)',
    );
    expect(broken).not.toBe(engineeringPanelSource);
    expect(shipVisualIntegrationErrors(mainSource, broken)).toContain(
      'Engineering installed-system rows bypass ShipVisualState',
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
