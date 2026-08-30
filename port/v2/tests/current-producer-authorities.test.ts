import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  compendiumProducerAuthority,
  type CompendiumProducerAuthority,
} from '../tools/compendiummem-contract.mjs';
import { stableJson } from '../tools/compendiummem-fixture.mjs';
import {
  authorityMismatchPaths,
  collectCurrentProducerAuthorities,
  producerAuthorityExitCode,
  type CurrentProducerAuthorities,
} from '../tools/print-producer-authorities.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const gameRoot = path.join(v2Root, 'apps', 'game');
const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (value: NodeJS.ArrayBufferView): string => createHash('sha256')
  .update(value)
  .digest('hex');
const changedHash = (value: Buffer, label: string): string => sha256(Buffer.concat([
  value, Buffer.from(`\ncurrent-producer-authority-negative-control:${label}\n`),
]));

type SceneBudget = {
  authority: { producer: Readonly<Record<string, string>> };
};
type CompendiumBudget = {
  measurementAuthority: unknown;
  producerAuthority: CompendiumProducerAuthority;
};

const sceneBudget = readJson(path.join(
  v2Root, 'budgets', 'scene-memory-v2.json',
)) as SceneBudget;
const compendiumBudget = readJson(path.join(
  v2Root, 'budgets', 'compendium-memory-v1.json',
)) as CompendiumBudget;
let current: CurrentProducerAuthorities;

beforeAll(() => {
  current = collectCurrentProducerAuthorities();
}, 60_000);

describe('current producer authorities', () => {
  it('binds both live memory budgets to independently built current bytes', () => {
    expect(authorityMismatchPaths(
      sceneBudget.authority.producer, current.sceneMemory.producer,
    )).toEqual([]);
    expect(authorityMismatchPaths(
      compendiumBudget.measurementAuthority, current.compendium.measurement,
    )).toEqual([]);
    expect(authorityMismatchPaths(
      compendiumBudget.producerAuthority, current.compendium.producer,
    )).toEqual([]);
    expect(current.sceneMemory).toMatchObject({
      budgetMatches: true,
      budgetMismatches: [],
    });
    expect(current.compendium).toMatchObject({
      measurementBudgetMatches: true,
      measurementBudgetMismatches: [],
      producerBudgetMatches: true,
      producerBudgetMismatches: [],
    });
    expect(producerAuthorityExitCode(current)).toBe(0);

    for (const stale of [
      {
        ...current,
        sceneMemory: { ...current.sceneMemory, budgetMatches: false },
      },
      {
        ...current,
        compendium: { ...current.compendium, measurementBudgetMatches: false },
      },
      {
        ...current,
        compendium: { ...current.compendium, producerBudgetMatches: false },
      },
    ]) expect(producerAuthorityExitCode(stale)).toBe(2);
    expect(producerAuthorityExitCode(undefined)).toBe(2);

    const toolSource = fs.readFileSync(path.join(
      v2Root, 'tools', 'print-producer-authorities.mjs',
    ), 'utf8');
    expect(toolSource.match(
      /process\.exitCode = producerAuthorityExitCode\(report\);/g,
    )).toHaveLength(1);
  });

  it('negative-controls source, build, and duplicate-constant drift independently', () => {
    const mainBytes = fs.readFileSync(path.join(gameRoot, 'src', 'main.ts'));
    const changedMain = {
      ...current.sceneMemory.producer,
      gameMain: changedHash(mainBytes, 'gameMain'),
    };
    expect(authorityMismatchPaths(changedMain, current.sceneMemory.producer))
      .toEqual(['gameMain']);

    const changedBuild = {
      ...current.sceneMemory.producer,
      buildDist: changedHash(Buffer.from(current.build.sha256), 'buildDist'),
    };
    expect(authorityMismatchPaths(changedBuild, current.sceneMemory.producer))
      .toEqual(['buildDist']);

    const forgedBudget = structuredClone(changedMain);
    const duplicatedExpectedConstant = structuredClone(changedMain);
    expect(stableJson(forgedBudget)).toBe(stableJson(duplicatedExpectedConstant));
    expect(authorityMismatchPaths(forgedBudget, current.sceneMemory.producer))
      .toEqual(['gameMain']);
  });

  it('negative-controls the generated service worker inside Compendium producer authority', () => {
    const live = current.compendium.producer;
    const serviceWorker = live.inputs.serviceWorker;
    expect(serviceWorker).toBeDefined();
    const serviceWorkerBytes = fs.readFileSync(path.join(
      gameRoot, 'dist', serviceWorker!.relativePath,
    ));
    const mutant = compendiumProducerAuthority({
      ...live.inputs,
      serviceWorker: {
        ...serviceWorker,
        sha256: changedHash(serviceWorkerBytes, 'compendium-service-worker'),
      },
    });
    expect(mutant).not.toBeNull();
    expect(authorityMismatchPaths(mutant, live))
      .toEqual(['inputs.serviceWorker.sha256', 'sha256']);
  });

  it('negative-controls recomputed Compendium index and owner authorities', () => {
    const live = current.compendium.producer;
    const indexBytes = fs.readFileSync(path.join(gameRoot, 'dist', live.inputs.index.relativePath));
    const indexMutant = compendiumProducerAuthority({
      ...live.inputs,
      index: {
        ...live.inputs.index,
        sha256: changedHash(indexBytes, 'compendium-index'),
      },
    });
    expect(indexMutant).not.toBeNull();
    expect(authorityMismatchPaths(indexMutant, live))
      .toEqual(['inputs.index.sha256', 'sha256']);

    const ownerBytes = fs.readFileSync(path.join(gameRoot, 'dist', live.inputs.owner.relativePath));
    const ownerMutant = compendiumProducerAuthority({
      ...live.inputs,
      owner: {
        ...live.inputs.owner,
        sha256: changedHash(ownerBytes, 'compendium-owner'),
      },
    });
    expect(ownerMutant).not.toBeNull();
    expect(authorityMismatchPaths(ownerMutant, live))
      .toEqual(['inputs.owner.sha256', 'sha256']);
  });
});
