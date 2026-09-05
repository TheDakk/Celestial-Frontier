import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const V2_ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const INTERNAL_BASENAME = 'ownership-v2-internal';
const INTERNAL_SPECIFIER = `@cf/domain-acquisition/${INTERNAL_BASENAME}`;
const PERSISTENCE_OWNER = 'packages/persistence/src/arc5-ownership-migration.ts';

function sourceFilesUnder(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(absolute);
    }
  };
  visit(root);
  return files;
}

function importSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  for (const pattern of [
    /\bfrom\s*['"]([^'"]+)['"]/gu,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
    /\bimport\s*['"]([^'"]+)['"]/gu,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]!);
  }
  return specifiers;
}

function relative(absolute: string): string {
  return path.relative(V2_ROOT, absolute).split(path.sep).join('/');
}

describe('@cf/persistence — Arc 5 internal V2 source-projection boundary', () => {
  it('keeps the internal subpath owned only by the Arc 5 compact-delta writer', () => {
    const productionFiles = [
      ...sourceFilesUnder(path.join(V2_ROOT, 'packages')),
      ...sourceFilesUnder(path.join(V2_ROOT, 'apps')),
    ].filter((absolute) => relative(absolute).includes('/src/'));
    const consumers = productionFiles.filter((absolute) => (
      importSpecifiers(fs.readFileSync(absolute, 'utf8'))
        .some((specifier) => specifier.includes(INTERNAL_BASENAME))
    )).map(relative).sort();
    expect(consumers).toEqual([PERSISTENCE_OWNER]);

    const manifest = JSON.parse(fs.readFileSync(
      path.join(V2_ROOT, 'packages/domain/acquisition/package.json'),
      'utf8',
    )) as { exports: Record<string, string> };
    expect(manifest.exports[`./${INTERNAL_BASENAME}`])
      .toBe(`./src/${INTERNAL_BASENAME}.ts`);
    const publicRoot = fs.readFileSync(
      path.join(V2_ROOT, 'packages/domain/acquisition/src/index.ts'),
      'utf8',
    );
    expect(publicRoot).not.toContain('createOwnershipSourceProjectionSuccessorV2');
    expect(publicRoot).not.toContain('createCaptureOwnershipSourceProjectionSuccessorV2');

    expect(importSpecifiers(
      `import { createOwnershipSourceProjectionSuccessorV2 } from '${INTERNAL_SPECIFIER}';`,
    )).toEqual([INTERNAL_SPECIFIER]);
    expect(importSpecifiers(
      `const authority = import('${INTERNAL_SPECIFIER}')`,
    )).toEqual([INTERNAL_SPECIFIER]);

    const persistenceOwner = fs.readFileSync(path.join(V2_ROOT, PERSISTENCE_OWNER), 'utf8');
    expect(persistenceOwner).toContain('prepareArc5CaptureOwnershipMigrationSuccessor');
    expect(persistenceOwner).toContain('createCaptureOwnershipSourceProjectionSuccessorV2(');
    expect(persistenceOwner).not.toContain('captureFirstForSpecies: boolean');
  });
});
