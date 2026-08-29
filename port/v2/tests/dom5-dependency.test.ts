import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cleanName } from '@cf/domain-naming';
import { STAT_KEYS } from '@cf/domain-speciestraits';
import {
  cleanName as compatibilityCleanName,
  STAT_KEYS as compatibilityStatKeys,
} from '@cf/domain-strays';
import { canon } from './parity.js';
import { probeRaw } from './baseline.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.join(here, '..');
const legacySource = readTrackedV1Source().script;

type Graph = Map<string, Set<string>>;

function workspaceManifestPaths(): string[] {
  const paths: string[] = [];
  for (const parent of [path.join(v2Root, 'packages', 'domain'), path.join(v2Root, 'apps')]) {
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      if (entry.isDirectory()) paths.push(path.join(parent, entry.name, 'package.json'));
    }
  }
  for (const name of ['persistence', 'scene', 'art', 'audio']) {
    paths.push(path.join(v2Root, 'packages', name, 'package.json'));
  }
  return paths;
}

function workspaceGraph(): Graph {
  const manifests = workspaceManifestPaths().map((manifestPath) =>
    JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      name: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    });
  const names = new Set(manifests.map((manifest) => manifest.name));
  return new Map(manifests.map((manifest) => [
    manifest.name,
    new Set(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
      .filter((dependency) => names.has(dependency))),
  ]));
}

function firstCycle(graph: Graph): string[] | null {
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const visit = (name: string): string[] | null => {
    if (state.get(name) === 'visiting') {
      const start = stack.indexOf(name);
      return [...stack.slice(start), name];
    }
    if (state.get(name) === 'done') return null;
    state.set(name, 'visiting');
    stack.push(name);
    for (const dependency of [...(graph.get(name) ?? [])].sort()) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(name, 'done');
    return null;
  };
  for (const name of [...graph.keys()].sort()) {
    const cycle = visit(name);
    if (cycle) return cycle;
  }
  return null;
}

function exactMainLine(anchor: string): { readonly text: string; readonly line: number } {
  const matches = legacySource
    .split('\n').map((text, index) => ({ text, line: index + 1 }))
    .filter(({ text }) => text.includes(anchor));
  expect(matches, `unique main.js anchor ${anchor}`).toHaveLength(1);
  return matches[0]!;
}

function expectedSharedArtifact(
  source: { readonly text: string; readonly line: number },
  symbol: 'cleanName' | 'STAT_KEYS',
): string {
  const sha = createHash('sha256').update(source.text).digest('hex').slice(0, 16);
  const description = symbol === 'cleanName'
    ? 'shared name normalizer'
    : 'shared ordered stat schema';
  return `/* AUTO-LIFTED VERBATIM ${description} from main.js (v1.8.9) —\n`
    + `   ${symbol} (${source.line}-${source.line}); body sha256/16 ${sha}.\n`
    + '   ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */\n'
    + `${source.text}\nexport { ${symbol} };\n`;
}

describe('DOM-5 — shared byte owners and an acyclic package graph', () => {
  it('keeps both moved one-line seams byte-identical and parity-compatible', () => {
    const cleanNameSource = exactMainLine('function cleanName(s,n){');
    const statKeysSource = exactMainLine("const STAT_KEYS=['vit','fer','res','agi','ins'];");
    const cleanNameGenerated = fs.readFileSync(path.join(
      v2Root, 'packages', 'domain', 'naming', 'src', 'cleanname.verbatim.js'), 'utf8');
    const statKeysGenerated = fs.readFileSync(path.join(
      v2Root, 'packages', 'domain', 'speciestraits', 'src', 'statkeys.verbatim.js'), 'utf8');

    const expectedCleanName = expectedSharedArtifact(cleanNameSource, 'cleanName');
    const expectedStatKeys = expectedSharedArtifact(statKeysSource, 'STAT_KEYS');
    expect(cleanNameGenerated).toBe(expectedCleanName);
    expect(statKeysGenerated).toBe(expectedStatKeys);

    /* A copied source line/header hash is not implementation authority. This
       mutation keeps both in dead comment text while exporting a different
       body; exact full-artifact equality must reject it. */
    const launderedCleanName = expectedCleanName.replace(
      cleanNameSource.text,
      `function cleanName(){ return 'wrong'; }\n/* ${cleanNameSource.text} */`,
    );
    expect(launderedCleanName).toContain(cleanNameSource.text);
    expect(launderedCleanName).toContain(
      createHash('sha256').update(cleanNameSource.text).digest('hex').slice(0, 16),
    );
    expect(launderedCleanName).not.toBe(expectedCleanName);
    expect(compatibilityCleanName).toBe(cleanName);
    expect(compatibilityStatKeys).toBe(STAT_KEYS);
    expect(canon([
      cleanName('<b>Evil&"Name\'</b> with a very long tail beyond cap'),
      cleanName('  ok  '),
    ])).toBe(probeRaw('cleanName'));
    expect(STAT_KEYS).toEqual(['vit', 'fer', 'res', 'agi', 'ins']);
  });

  it('has no workspace-package cycle and the historical reverse edge is a proven red control', () => {
    const live = workspaceGraph();
    expect(live.get('@cf/domain-strays')).toContain('@cf/domain-combatcore');
    expect(live.get('@cf/domain-combatcore')).not.toContain('@cf/domain-strays');
    expect(firstCycle(live)).toBeNull();

    const regressed = new Map([...live].map(([name, dependencies]) => [name, new Set(dependencies)]));
    regressed.get('@cf/domain-combatcore')!.add('@cf/domain-strays');
    const historicalCycle = firstCycle(regressed);
    expect(historicalCycle).not.toBeNull();
    expect(new Set(historicalCycle)).toEqual(new Set([
      '@cf/domain-combatcore',
      '@cf/domain-strays',
    ]));
    expect(historicalCycle?.at(0)).toBe(historicalCycle?.at(-1));
  });
});
