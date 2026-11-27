// The hand-run tools load the game's TypeScript with node's own type stripping, which refuses what must be compiled
// rather than stripped: a parameter property, an enum, a namespace. The typechecks and the other tests do not load a
// file that way, so a refused construct in anything a tool imports stops the tool unseen. Here every source file
// every tool can reach is put through node's stripper, and the census tool, the instrument of the census, is started.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import * as nodeModule from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const TOOLS = join(ROOT, 'tools');
const strip = (nodeModule as { stripTypeScriptTypes?: (source: string) => string }).stripTypeScriptTypes;

/** Every module a file names: static imports and exports, and imports made while it runs. */
function specifiersOf(source: string): string[] {
  return [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\1/g)].map((match) => match[2]!);
}

/** The file a specifier names from a file, as the tools' own resolve hook finds it; null for node's own modules and
    for packages that are not the game's. */
function resolveFrom(file: string, specifier: string): string | null {
  if (specifier.startsWith('@cf/')) {
    const [, name, ...sub] = specifier.split('/');
    const home = join(ROOT, 'node_modules', '@cf', name!);
    const exports = (JSON.parse(readFileSync(join(home, 'package.json'), 'utf8')) as { exports: string | Record<string, string> }).exports;
    const target = typeof exports === 'string' ? (sub.length === 0 ? exports : undefined) : exports[sub.length === 0 ? '.' : `./${sub.join('/')}`];
    if (target === undefined) throw new Error(`${specifier} is not an export of its package`);
    return realpathSync(resolve(home, target));
  }
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(file), specifier);
  const tries = [base, base.replace(/\.js$/, '.ts'), `${base}.ts`, join(base, 'index.ts')];
  const found = tries.find((path) => existsSync(path) && statSync(path).isFile());
  if (found === undefined) throw new Error(`${relative(ROOT, file)} imports ${specifier}, which is no file`);
  return found;
}

/** Every TypeScript source a tool can reach, through whatever it imports. */
function sourcesReachedFrom(tool: string): string[] {
  const seen = new Set<string>();
  const queue = [tool];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.(ts|mjs|js)$/.test(file) || file.endsWith('.d.ts')) continue;
    for (const specifier of specifiersOf(readFileSync(file, 'utf8'))) {
      const next = resolveFrom(file, specifier);
      if (next !== null) queue.push(next);
    }
  }
  return [...seen].filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts')).sort();
}

const tools = readdirSync(TOOLS).filter((name) => name.endsWith('.mjs')).map((name) => join(TOOLS, name));

describe('the hand-run tools can load what they import', () => {
  it('node here strips types, as the tools need', () => {
    expect(typeof strip).toBe('function');
  });

  it('the stripper refuses a parameter property, so this check can fail', () => {
    expect(() => strip!('export class Refused extends Error { constructor(readonly why: string) { super(why); } }')).toThrow(/parameter property/i);
    expect(() => strip!('export class Held extends Error { readonly why: string; constructor(why: string) { super(why); this.why = why; } }')).not.toThrow();
  });

  it('every source file a tool reaches is one node can strip: the census tool reaches the world snapshot', () => {
    const refused: string[] = [];
    const reached = new Map<string, string[]>();
    for (const tool of tools) {
      const sources = sourcesReachedFrom(tool);
      reached.set(relative(ROOT, tool), sources.map((file) => relative(ROOT, file)));
      for (const file of sources) {
        try { strip!(readFileSync(file, 'utf8')); } catch (error) { refused.push(`${relative(ROOT, tool)} reaches ${relative(ROOT, file)}: ${(error as Error).message}`); }
      }
    }
    expect([...new Set(refused)]).toEqual([]);
    // The walk is not empty where it matters.
    expect(reached.get('tools/census.mjs')).toEqual(expect.arrayContaining([
      'packages/domain/opportunity/src/snapshot.ts', 'packages/domain/worldkinds/src/play.ts', 'apps/game/src/landing/descent-policy.ts', 'tests/support/census.ts',
    ]));
    expect(reached.get('tools/census.mjs')!.length).toBeGreaterThan(40);
  });

  it('the census tool starts, loads everything it imports and reads a thousand worlds', () => {
    const run = spawnSync(process.execPath, ['--no-warnings', join(TOOLS, 'census.mjs'), '--planets', '1000'], { cwd: ROOT, encoding: 'utf8' });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/worlds changed outside a slice\s+0/);
  });
});
