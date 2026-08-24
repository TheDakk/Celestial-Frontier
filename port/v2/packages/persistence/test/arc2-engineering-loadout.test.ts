import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import * as lootRoot from '@cf/domain-loot';
import {
  isAcquisitionCapabilitySnapshot,
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
  readArc2AcquisitionCapabilities,
  readArc2EngineeringLoadout,
} from '@cf/persistence';

beforeAll(() => installCaptureHooks());

const V2_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INTERNAL_ENGINEERING_IMPORT = '@cf/domain-loot/engineering-internal';
const INTERNAL_ENGINEERING_RELATIVE_BASENAME = 'engineering-loadout-internal';
const ENGINEERING_MINT_IDENTIFIER = 'registerArc2EngineeringLoadout';
const ALLOWED_INTERNAL_MODULE_REFERENCES = Object.freeze([
  'packages/domain/loot/src/engineering-capabilities.ts',
  'packages/domain/loot/src/index.ts',
  'packages/domain/loot/test/engineering-capabilities.test.ts',
  'packages/persistence/src/arc2-engineering-loadout.ts',
  'packages/persistence/test/arc2-fixed-fabrication.test.ts',
  'packages/persistence/test/arc2-engineering-loadout.test.ts',
]);
const ALLOWED_MINT_REFERENCES = Object.freeze([
  'packages/domain/loot/src/engineering-loadout-internal.ts',
  'packages/domain/loot/test/engineering-capabilities.test.ts',
  'packages/persistence/src/arc2-engineering-loadout.ts',
  'packages/persistence/test/arc2-fixed-fabrication.test.ts',
  'packages/persistence/test/arc2-engineering-loadout.test.ts',
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

function referencesInternalEngineeringModule(source: string): boolean {
  return source.includes(INTERNAL_ENGINEERING_IMPORT)
    || source.includes(INTERNAL_ENGINEERING_RELATIVE_BASENAME);
}

function referencesEngineeringMint(source: string): boolean {
  return source.includes(ENGINEERING_MINT_IDENTIFIER);
}

function forbiddenInternalAuthorityReference(relativePath: string, source: string): boolean {
  return (referencesInternalEngineeringModule(source)
      && !ALLOWED_INTERNAL_MODULE_REFERENCES.includes(relativePath))
    || (referencesEngineeringMint(source)
      && !ALLOWED_MINT_REFERENCES.includes(relativePath));
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
    const moduleReferences = sourceFiles
      .filter((absolute) => referencesInternalEngineeringModule(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(moduleReferences).toEqual([...ALLOWED_INTERNAL_MODULE_REFERENCES].sort());

    const mintReferences = sourceFiles
      .filter((absolute) => referencesEngineeringMint(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(mintReferences).toEqual([...ALLOWED_MINT_REFERENCES].sort());
    expect(mintReferences.filter((relative) => relative.includes('/src/'))).toEqual([
      'packages/domain/loot/src/engineering-loadout-internal.ts',
      'packages/persistence/src/arc2-engineering-loadout.ts',
    ]);

    for (const syntheticAppImport of [
      "import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal'",
      "const authority = await import('@cf/domain-loot/engineering-internal')",
      "export * from '@cf/domain-loot/engineering-internal'",
      "import * as authority from '../../../packages/domain/loot/src/engineering-loadout-internal.js'",
    ]) {
      expect(forbiddenInternalAuthorityReference('apps/game/src/forbidden.ts', syntheticAppImport))
        .toBe(true);
    }

    const bridgeSource = fs.readFileSync(
      path.join(V2_ROOT, 'packages/persistence/src/arc2-engineering-loadout.ts'),
      'utf8',
    );
    const realMintImport = bridgeSource.match(
      /import\s*\{\s*registerArc2EngineeringLoadout\s*\}\s*from\s*['"]@cf\/domain-loot\/engineering-internal['"];?/,
    )?.[0];
    expect(realMintImport).toBeTruthy();
    expect(forbiddenInternalAuthorityReference(
      'packages/domain/opportunity/src/forbidden-copy.ts',
      realMintImport ?? '',
    )).toBe(true);
    expect(forbiddenInternalAuthorityReference(
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

  it('issues capture contact authority only through a fresh carrier-backed loadout', () => {
    const prepared = prepareArc2LootLegacyMigration({
      extensions: {},
      legacy: {
        items: [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]],
        equip: { ears: 'earpiece', necklace: 'diplobeacon' },
        equipAff: { ears: { k: 'contact', v: 7, forId: 'earpiece' } },
      },
      capacity: 6,
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;

    const read = readArc2AcquisitionCapabilities(prepared.extensions);
    expect(read.kind).toBe('loaded');
    if (read.kind !== 'loaded') return;
    expect(isAcquisitionCapabilitySnapshot(read.capabilities)).toBe(true);
    expect(read.capabilities).toMatchObject({
      inventoryRevision: 0,
      contactCaptureBonus: 37,
    });
    expect(isAcquisitionCapabilitySnapshot({ ...read.capabilities })).toBe(false);

    const reread = readArc2AcquisitionCapabilities(prepared.extensions);
    expect(reread.kind).toBe('loaded');
    if (reread.kind === 'loaded') {
      expect(reread.capabilities).not.toBe(read.capabilities);
      expect(reread.capabilities.fingerprint).toBe(read.capabilities.fingerprint);
    }
  });

  it('preserves absent, future, corrupt, and legacy-protected outcomes', () => {
    expect(readArc2EngineeringLoadout({})).toEqual({ kind: 'absent' });
    expect(readArc2AcquisitionCapabilities({})).toEqual({ kind: 'absent' });
    const future = canonicalizeV5Extensions({
      inventory: { [ARC2_LOOT_NAMESPACE]: { version: 77, json: '{"future":true}' } },
    });
    expect(readArc2EngineeringLoadout(future)).toEqual({ kind: 'future-version', version: 77 });
    expect(readArc2AcquisitionCapabilities(future)).toEqual({ kind: 'future-version', version: 77 });
    const corrupt = canonicalizeV5Extensions({
      inventory: { [ARC2_LOOT_NAMESPACE]: { version: 1, json: '{"kind":"inventory"}' } },
    });
    expect(readArc2EngineeringLoadout(corrupt)).toEqual({ kind: 'corrupt' });
    expect(readArc2AcquisitionCapabilities(corrupt)).toEqual({ kind: 'corrupt' });

    const protectedWrite = prepareArc2LootLegacyMigration({
      extensions: {},
      legacy: { items: [['rig1', 2]], equip: {}, equipAff: {} },
      capacity: 1,
    });
    expect(protectedWrite.kind).toBe('prepared');
    if (protectedWrite.kind === 'prepared') {
      expect(readArc2EngineeringLoadout(protectedWrite.extensions))
        .toEqual({ kind: 'legacy-protected', reason: 'capacity' });
      expect(readArc2AcquisitionCapabilities(protectedWrite.extensions))
        .toEqual({ kind: 'legacy-protected', reason: 'capacity' });
    }
  });
});
