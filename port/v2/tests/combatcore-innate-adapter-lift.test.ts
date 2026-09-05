import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.join(here, '..');
const liftToolPath = path.join(v2Root, 'tools/lift.mjs');
const committedPath = path.join(
  v2Root, 'packages/domain/combatcore/src/combatcore.verbatim.js',
);
const EXPECTED_BODY_SHA256_16 = '0b84ae593147bf62';
const MODULE_OPEN = 'const CombatCore=(()=>{';
const MODULE_CLOSE = '})();\nconst {';
const BODY_RETURN = 'return Object.freeze({';
const BODY_FIRST = "\nconst STAT_NAMES=['Vitality','Ferocity','Resilience','Agility','Instinct'];";

const tracked = readTrackedV1Source().script;
const committed = fs.readFileSync(committedPath, 'utf8');

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function exactCombatCoreBody(source: string): string {
  if (occurrences(source, MODULE_OPEN) !== 1) {
    throw new Error('tracked CombatCore wrapper must be unique');
  }
  const start = source.indexOf(MODULE_OPEN) + MODULE_OPEN.length;
  const close = source.indexOf(MODULE_CLOSE, start);
  const returned = source.lastIndexOf(BODY_RETURN, close);
  if (close < start || returned < start) throw new Error('tracked CombatCore bounds are invalid');
  return source.slice(start, returned);
}

const trackedBody = exactCombatCoreBody(tracked);

function adapterErrors(source: string): string[] {
  const errors: string[] = [];
  const expectedMarkers = [
    ['adapter-owner', 'function projectCreatureInnateArts(g){'],
    ['live-kit-owner', 'const K=classKit(g), arts=[];'],
    ['verb-order', 'const id=K.cls.verbs[i], ar=ARCHETYPES.find(a=>a.id===id);'],
    ['slot-effects', '...ar.mk(i)'],
    ['effect-freeze', 'effects:Object.freeze({'],
    ['art-freeze', 'arts.push(Object.freeze({'],
    ['list-freeze', 'arts:Object.freeze(arts)'],
  ] as const;
  for (const [label, marker] of expectedMarkers) {
    if (occurrences(source, marker) !== 1) errors.push(label);
  }
  if (!source.includes(`body sha256/16 ${EXPECTED_BODY_SHA256_16}`)) {
    errors.push('body-sha-header');
  }
  if (occurrences(source, trackedBody) !== 1) errors.push('lifted-body-byte-parity');

  const exportLine = source.match(/export \{([^}]*)\};\s*$/u)?.[1]
    ?.split(',').map((name) => name.trim()).filter(Boolean) ?? [];
  if (!exportLine.includes('projectCreatureInnateArts')) errors.push('adapter-export');
  if (exportLine.includes('ARCHETYPES') || exportLine.includes('classKit')) {
    errors.push('private-table-export');
  }
  const bodyStart = source.indexOf(BODY_FIRST);
  const adapterStart = source.indexOf('function projectCreatureInnateArts(g){');
  const adapterPrelude = adapterStart >= 0 && bodyStart > adapterStart
    ? source.slice(adapterStart, bodyStart) : '';
  if (/\bconst\s+(?:ARCHETYPES|CLASSES|CLASS_GROUPS)\b/u.test(adapterPrelude)) {
    errors.push('duplicate-catalogue');
  }
  if (/\b(?:Math\.random|mulberry32|hashInt)\b/u.test(adapterPrelude)) {
    errors.push('adapter-rng');
  }
  return errors;
}

function replaceExactly(source: string, target: string, replacement: string): string {
  expect(occurrences(source, target), `unique mutation target: ${target}`).toBe(1);
  return source.replace(target, replacement);
}

function withTempDir<T>(run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-combatcore-adapter-'));
  try { return run(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

describe('CombatCore canonical innate-art generated adapter', () => {
  it('regenerates exactly from tracked source while preserving the sealed body', () => {
    expect(createHash('sha256').update(trackedBody).digest('hex').slice(0, 16))
      .toBe(EXPECTED_BODY_SHA256_16);
    expect(adapterErrors(committed)).toEqual([]);
    withTempDir((dir) => {
      const sourcePath = path.join(dir, 'tracked-main.js');
      const outDir = path.join(dir, 'out');
      fs.writeFileSync(sourcePath, tracked);
      const result = spawnSync(
        process.execPath,
        [liftToolPath, 'CombatCore', outDir, '--source', sourcePath],
        { cwd: v2Root, encoding: 'utf8' },
      );
      expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
      expect(fs.readFileSync(path.join(outDir, 'combatcore.verbatim.js'), 'utf8'))
        .toBe(committed);
    });
  });

  it('negative-controls art order, per-slot effects, deep freeze and public authority', () => {
    expect(adapterErrors(replaceExactly(
      committed, 'const id=K.cls.verbs[i]', 'const id=K.cls.verbs[0]',
    ))).toContain('verb-order');
    expect(adapterErrors(replaceExactly(
      committed, 'effects:Object.freeze({...ar.mk(i)})',
      'effects:Object.freeze({...ar.mk(0)})',
    ))).toContain('slot-effects');
    expect(adapterErrors(replaceExactly(
      committed, 'effects:Object.freeze({...ar.mk(i)})', 'effects:{...ar.mk(i)}',
    ))).toContain('effect-freeze');
    expect(adapterErrors(replaceExactly(
      committed, ', projectCreatureInnateArts };', ' };',
    ))).toContain('adapter-export');
    expect(adapterErrors(replaceExactly(
      committed, ', projectCreatureInnateArts };', ', projectCreatureInnateArts, ARCHETYPES };',
    ))).toContain('private-table-export');
    expect(adapterErrors(replaceExactly(
      committed,
      'function projectCreatureInnateArts(g){',
      'function projectCreatureInnateArts(g){\n  const CLASSES=[];',
    ))).toContain('duplicate-catalogue');
    expect(adapterErrors(replaceExactly(
      committed,
      'const K=classKit(g), arts=[];',
      'Math.random();\n  const K=classKit(g), arts=[];',
    ))).toContain('adapter-rng');
    expect(adapterErrors(replaceExactly(
      committed, 'burn:0.045', 'burn:0.046',
    ))).toContain('lifted-body-byte-parity');
  });
});
