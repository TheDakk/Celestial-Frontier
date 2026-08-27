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
const searchTravelSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/search-travel.ts', import.meta.url)),
  'utf8',
);

function synchronousShipyardPreviewErrors(source: string): string[] {
  const asynchronousTokens = [
    'setTimeout', 'requestAnimationFrame', 'Promise', 'async', 'await', 'fetch', 'new Image',
  ];
  return asynchronousTokens.filter((token) => source.includes(token));
}

function shipVisualIntegrationErrors(
  main: string,
  panel: string,
  searchTravel = searchTravelSource,
): string[] {
  const errors: string[] = [];
  const mainBindings: ReadonlyArray<readonly [string, string]> = [
    [
      'const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;',
      'travel stage bypasses ShipVisualState',
    ],
    [
      'const ship = currentShipVisualState();',
      'Engineering read model does not derive the shared visual projection',
    ],
    [
      'engineering: panelModel,',
      'Engineering panel does not atomically consume its verified read model and ship',
    ],
    [
      'Object.freeze({ ship, engineering: null, reason })',
      'protected Engineering panel does not retain its capability-derived ship',
    ],
    [
      'shipVisual: currentShipVisualState(),',
      'browser diagnostics omit the shared visual projection',
    ],
    [
      'stateKey: panelOpen ? diagnostics.previewStateKey : null,',
      'browser diagnostics synthesize a ship key instead of reading the live preview owner',
    ],
    [
      'const SHIP_LIVERY_SEED = 0x5111;',
      'ship livery no longer uses the legacy deterministic seed',
    ],
  ];
  const panelBindings: ReadonlyArray<readonly [string, string]> = [
    ['assertShip(view.ship);', 'Engineering atomic-view validation bypasses ShipVisualState'],
    [
      'shipVisualStateKey(view.ship) !== shipVisualStateKey(view.engineering.ship)',
      'Engineering atomic view does not reject standalone/model ship mismatch',
    ],
    [
      'const previewMount = this.#shipOverview(this.#view.ship);',
      'Engineering overview does not consume the atomic capability-derived ShipVisualState',
    ],
    [
      'this.#previewOwner.open(this.#view.ship);',
      'Shipyard preview does not consume the atomic capability-derived ShipVisualState',
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
  if (searchTravel.split('const candidateStage = shipVisualStateOf({').length - 1 !== 1
    || !searchTravel.includes('items: authoritySave.items,')
    || !searchTravel.includes('ascCh: authoritySave.ascCh,')
    || !searchTravel.includes('liverySeed: shipLiverySeed,')
    || !searchTravel.includes('ascAllowsStar(candidateStage, target.gal.seed, target.star)')) {
    errors.push('candidate navigation bypasses ShipVisualState');
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

  it('negative control: candidate travel cannot bypass ShipVisualState after extraction', () => {
    const broken = searchTravelSource.replace(
      'const candidateStage = shipVisualStateOf({',
      'const candidateStage = ({ chassisStage: authoritySave.ascCh } as never); void shipVisualStateOf({',
    );
    expect(broken).not.toBe(searchTravelSource);
    expect(shipVisualIntegrationErrors(mainSource, engineeringPanelSource, broken)).toContain(
      'candidate navigation bypasses ShipVisualState',
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
      'engineering: panelModel,',
      'engineering: null,',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken, engineeringPanelSource)).toContain(
      'Engineering panel does not atomically consume its verified read model and ship',
    );
  });

  it('negative control: protected Engineering cannot discard the capability-derived ship', () => {
    const broken = mainSource.replace(
      'Object.freeze({ ship, engineering: null, reason })',
      'Object.freeze({ ship: null as never, engineering: null, reason })',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken, engineeringPanelSource)).toContain(
      'protected Engineering panel does not retain its capability-derived ship',
    );
  });

  it('negative control: diagnostics cannot synthesize the expected ship key', () => {
    const broken = mainSource.replace(
      'stateKey: panelOpen ? diagnostics.previewStateKey : null,',
      'stateKey: panelOpen ? currentShipVisualState().stateKey : null,',
    );
    expect(broken).not.toBe(mainSource);
    expect(shipVisualIntegrationErrors(broken, engineeringPanelSource)).toContain(
      'browser diagnostics synthesize a ship key instead of reading the live preview owner',
    );
  });

  it('negative control: a preview fed by a separate projection is rejected', () => {
    const broken = engineeringPanelSource.replace(
      'this.#previewOwner.open(this.#view.ship);',
      'this.#previewOwner.open(structuredClone(this.#view.ship));',
    );
    expect(broken).not.toBe(engineeringPanelSource);
    expect(shipVisualIntegrationErrors(mainSource, broken)).toContain(
      'Shipyard preview does not consume the atomic capability-derived ShipVisualState',
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
