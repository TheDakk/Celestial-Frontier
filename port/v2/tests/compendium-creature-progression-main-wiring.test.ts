import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

function wiringErrors(source: string): string[] {
  const errors: string[] = [];
  const owner = section(
    source,
    'const compendiumCreatureProgressionSurface = new CompendiumCreatureProgressionSurfaceV1({',
    '\n\nfunction projectCurrentCompendiumAudition(',
  );
  const projection = section(
    source,
    'function projectCurrentCompendiumCreatureProgression(',
    '\nfunction projectCurrentCompendiumExplorerMeal(',
  );
  const refresh = section(source, 'function refreshCompendiumFeedState()', '\nfunction disposeCodexList()');
  const detail = section(source, 'function fillCodexDetail(', '\nfunction fillRecords(');

  for (const symbol of [
    'projectCompendiumCreatureProgressionV1,',
    'type CompendiumCreatureProgressionV1,',
    "import { CompendiumCreatureProgressionSurfaceV1 } from './compendium-creature-progression-surface.js';",
  ]) if (!source.includes(symbol)) errors.push(`missing-import:${symbol}`);
  for (const marker of [
    "isCurrent: () => codexMode === 'detail' && openPanelId() === 'codex',",
    'project: (pageIndex) => {',
    'projectCurrentCompendiumCreatureProgression(row, pageIndex)',
  ]) if (!owner.includes(marker)) errors.push(`surface-owner:${marker}`);
  for (const marker of [
    'logicalId: String(row[0]),', 'record: row[1],', 'ownership: arc5OwnershipState,',
    'protected: arc5OwnershipProtection !== null,', 'fixture: compendiumFixtureRows !== null,',
    'observedActivePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,', 'pageIndex,',
  ]) if (!projection.includes(marker)) errors.push(`projection:${marker}`);
  if (projection.includes('f4RuntimeMayMutate')) {
    errors.push('read-only-projection-depends-on-mutation-authority');
  }
  if (!refresh.includes('compendiumCreatureProgressionSurface.refresh();')) {
    errors.push('heartbeat-refresh-missing');
  }
  const panel = detail.indexOf("fillPanel('codex'");
  const attach = detail.indexOf('compendiumCreatureProgressionSurface.attach(');
  if (!(panel >= 0 && attach > panel)) errors.push('detail-attach-order');
  if ((source.match(/compendiumCreatureProgressionSurface\.detach\(\);/gu)?.length ?? 0) < 3) {
    errors.push('surface-lifecycle-release');
  }
  return errors;
}

describe('exact-instance Compendium progression Main wiring', () => {
  it('binds one paged read-only surface to live ownership and heartbeat refresh', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
  });

  it('negative-controls mutation authority, active-play status, refresh and mounting', () => {
    expect(wiringErrors(mainSource.replace(
      '      protected: arc5OwnershipProtection !== null,',
      '      protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),',
    ))).toContain('read-only-projection-depends-on-mutation-authority');
    expect(wiringErrors(mainSource.replace(
      '      observedActivePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,',
      '      observedActivePlayMs: 0,',
    ))).toContain(`projection:observedActivePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,`);
    expect(wiringErrors(mainSource.replace(
      '  compendiumCreatureProgressionSurface.refresh();', '  void row;',
    ))).toContain('heartbeat-refresh-missing');
    expect(wiringErrors(mainSource.replace(
      '  compendiumCreatureProgressionSurface.attach(', '  void (',
    ))).toContain('detail-attach-order');
  });
});
