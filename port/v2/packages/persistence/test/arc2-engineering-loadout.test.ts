import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import * as lootRoot from '@cf/domain-loot';
import {
  isArc2EngineeringLoadout,
  isEngineeringCapabilitySnapshot,
  projectEngineeringCapabilities,
} from '@cf/domain-loot';
import {
  createEngineeringState,
  planWorldMining,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import { navFromCanonicalCF1Address, resolveCF1WorldAddress } from '@cf/scene';
import {
  ARC2_LOOT_NAMESPACE,
  canonicalizeV5Extensions,
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';

beforeAll(() => installCaptureHooks());

const V2_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INTERNAL_ENGINEERING_IMPORT = '@cf/domain-loot/engineering-internal';
const ALLOWED_INTERNAL_IMPORTERS = Object.freeze([
  'packages/domain/loot/test/engineering-capabilities.test.ts',
  'packages/persistence/src/arc2-engineering-loadout.ts',
]);

function TypeScriptFilesUnder(directory: string): readonly string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? TypeScriptFilesUnder(absolute)
      : entry.isFile() && entry.name.endsWith('.ts')
        ? [absolute]
        : [];
  });
}

function relativeV2Path(absolute: string): string {
  return path.relative(V2_ROOT, absolute).split(path.sep).join('/');
}

function importsInternalEngineeringMint(source: string): boolean {
  const importStatements = source.match(/^\s*import\b[\s\S]*?;\s*$/gm) ?? [];
  return importStatements.some((statement) => statement.includes(INTERNAL_ENGINEERING_IMPORT));
}

function forbiddenInternalMintImport(relativePath: string, source: string): boolean {
  return importsInternalEngineeringMint(source)
    && !ALLOWED_INTERNAL_IMPORTERS.includes(relativePath);
}

function preparedInventory(items: readonly (readonly [string, number])[]) {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: items.map(([id, count]) => [id, count]),
      equip: { tool: 'rig3', helmet: 'headlamp' },
      equipAff: { tool: { k: 'yield', v: 0.25, forId: 'rig3' } },
    },
    capacity: 8,
  });
  expect(prepared.kind).toBe('prepared');
  if (prepared.kind !== 'prepared') throw new Error(`loot fixture was ${prepared.kind}`);
  return prepared;
}

describe('@cf/persistence — fresh Arc 2 engineering loadout bridge', () => {
  it('keeps the internal loadout mint owned by persistence with non-vacuous import controls', () => {
    const sourceFiles = [
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'packages')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'apps')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'tests')),
    ];
    const importers = sourceFiles
      .filter((absolute) => importsInternalEngineeringMint(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(importers).toEqual([...ALLOWED_INTERNAL_IMPORTERS].sort());
    expect(importers.filter((relative) => relative.includes('/src/')))
      .toEqual(['packages/persistence/src/arc2-engineering-loadout.ts']);

    const syntheticAppImport =
      "import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';";
    expect(forbiddenInternalMintImport('apps/game/src/forbidden.ts', syntheticAppImport)).toBe(true);

    const bridgeSource = fs.readFileSync(
      path.join(V2_ROOT, 'packages/persistence/src/arc2-engineering-loadout.ts'),
      'utf8',
    );
    const realMintImport = bridgeSource.match(
      /import\s*\{\s*registerArc2EngineeringLoadout\s*\}\s*from\s*['"]@cf\/domain-loot\/engineering-internal['"];?/,
    )?.[0];
    expect(realMintImport).toBeTruthy();
    expect(forbiddenInternalMintImport(
      'packages/domain/opportunity/src/forbidden-copy.ts',
      realMintImport ?? '',
    )).toBe(true);
    expect(forbiddenInternalMintImport(
      'packages/persistence/src/arc2-engineering-loadout.ts',
      realMintImport ?? '',
    )).toBe(false);
    expect('registerArc2EngineeringLoadout' in lootRoot).toBe(false);
  });

  it('issues one registered coherent loadout and derives only its equipped gear and positive systems', () => {
    const prepared = preparedInventory([
      ['plate', 4], ['rig3', 1], ['headlamp', 1],
      ['jumpdrive', 1], ['autoext', 3], ['cscoop', 2],
    ]);
    const read = readArc2EngineeringLoadout(prepared.extensions);
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded') return;

    expect(isArc2EngineeringLoadout(read.loadout)).toBe(true);
    expect(isEngineeringCapabilitySnapshot(read.capabilities)).toBe(true);
    expect(read.loadout.stackableCounts).toEqual([
      { baseId: 'plate', count: 4 },
      { baseId: 'jumpdrive', count: 1 },
      { baseId: 'autoext', count: 3 },
      { baseId: 'cscoop', count: 2 },
    ]);
    expect(read.capabilities).toMatchObject({
      inventoryRevision: 0,
      miningYieldBonus: 2.25,
      richStrikeChanceBonus: 0.06,
      autoExtractor: true,
      jumpDrive: true,
      coronaScoop: true,
      stellarSkimBonus: 1,
      stellarSkimGuard: true,
    });

    const mars = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 134 },
    });
    expect(mars.ok).toBe(true);
    if (!mars.ok) return;
    const nav = navFromCanonicalCF1Address(mars.address);
    expect(nav.ok).toBe(true);
    if (!nav.ok || nav.state.mode !== 'surface') return;
    const appFacingPlan = planWorldMining({
      state: createEngineeringState(),
      opportunity: projectWorldOpportunity(mars.address),
      currentSurface: nav.state,
      capabilities: read.capabilities,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 0,
    });
    expect(appFacingPlan).toMatchObject({
      status: 'planned',
      result: { autoExtractor: { online: true, initialized: true } },
    });

    const reread = readArc2EngineeringLoadout(prepared.extensions);
    expect(reread.kind).toBe('loaded');
    if (reread.kind === 'loaded') {
      expect(reread.loadout).not.toBe(read.loadout);
      expect(reread.capabilities).not.toBe(read.capabilities);
      expect(reread.loadout.fingerprint).toBe(read.loadout.fingerprint);
      expect(reread.capabilities.fingerprint).toBe(read.capabilities.fingerprint);
    }
  });

  it('rejects cloned or loose authority and fails closed on a forged carrier', () => {
    const read = readArc2EngineeringLoadout(preparedInventory([
      ['rig3', 1], ['headlamp', 1], ['jumpdrive', 1],
    ]).extensions);
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded') return;
    expect(isArc2EngineeringLoadout({ ...read.loadout })).toBe(false);
    expect(isEngineeringCapabilitySnapshot({ ...read.capabilities })).toBe(false);
    expect(() => projectEngineeringCapabilities({
      inventory: read.loadout.inventory,
      stackableCounts: read.loadout.stackableCounts,
    } as never)).toThrow(/registered Arc 2 loadout/);

    const forged = canonicalizeV5Extensions({
      inventory: {
        [ARC2_LOOT_NAMESPACE]: {
          version: 1,
          json: JSON.stringify({
            kind: 'inventory',
            inventory: read.loadout.inventory,
            stackableCounts: [{ baseId: 'jumpdrive', count: 9 }],
            callerBonus: 999,
          }),
        },
      },
    });
    expect(readArc2EngineeringLoadout(forged)).toEqual({ kind: 'corrupt' });
  });

  it('preserves absent, future, corrupt, and legacy-protected outcomes', () => {
    expect(readArc2EngineeringLoadout({})).toEqual({ kind: 'absent' });
    const future = canonicalizeV5Extensions({
      inventory: { [ARC2_LOOT_NAMESPACE]: { version: 77, json: '{"future":true}' } },
    });
    expect(readArc2EngineeringLoadout(future)).toEqual({ kind: 'future-version', version: 77 });
    const corrupt = canonicalizeV5Extensions({
      inventory: { [ARC2_LOOT_NAMESPACE]: { version: 1, json: '{"kind":"inventory"}' } },
    });
    expect(readArc2EngineeringLoadout(corrupt)).toEqual({ kind: 'corrupt' });

    const protectedWrite = prepareArc2LootLegacyMigration({
      extensions: {},
      legacy: { items: [['rig1', 2]], equip: {}, equipAff: {} },
      capacity: 1,
    });
    expect(protectedWrite.kind).toBe('prepared');
    if (protectedWrite.kind === 'prepared') {
      expect(readArc2EngineeringLoadout(protectedWrite.extensions))
        .toEqual({ kind: 'legacy-protected', reason: 'capacity' });
    }
  });
});
