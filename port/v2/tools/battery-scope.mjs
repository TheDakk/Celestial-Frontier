#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exact = (...paths) => Object.freeze(new Set(paths));
const prefixes = (...paths) => Object.freeze(paths);

const LEGACY_EXACT = exact(
  'celestial-frontier.html',
  'main.js',
  'package.json',
  'package-lock.json',
);
const LEGACY_PREFIXES = prefixes('original/', 'tools/', 'port/baseline-v1.8.9/');

const V2_DEPENDENCY_INPUTS = exact('port/v2/package.json', 'port/v2/package-lock.json');
const ART_INSTRUMENT_EXACT = exact(
  ...V2_DEPENDENCY_INPUTS,
  '.github/workflows/test.yml',
  'port/v2/tools/battery-scope.mjs',
  'port/v2/tools/overridecheck.mjs',
  'port/v2/tools/overridecheck.control.mjs',
);
const ART_INSTRUMENT_PREFIXES = prefixes(
  'port/v2/packages/art/src/',
  'port/v2/packages/domain/descriptors/src/',
);

const SHARED_BROWSER_TRANSPORT_EXACT = exact(
  ...V2_DEPENDENCY_INPUTS,
  '.github/workflows/test.yml',
  'port/v2/tools/battery-scope.mjs',
  'port/v2/tools/browserpath.mjs',
  'port/v2/tools/browsercdp.mjs',
);
const COMPENDIUM_INSTRUMENT_EXACT = exact(
  ...SHARED_BROWSER_TRANSPORT_EXACT,
  'port/v2/tools/compendiummem.mjs',
  'port/v2/tools/compendiummem-contract.mjs',
  'port/v2/tools/compendiummem-browser-preflight.mjs',
  'port/v2/tools/compendiummem-selftest.mjs',
  'port/v2/tools/compendiummem-fixture.mjs',
  'port/v2/tools/sealed-worker-graph.mjs',
  'port/v2/tools/speciesart-build.mjs',
  'port/v2/tools/workspacelock.mjs',
  'port/v2/tools/fixtures/compendium-1500-v1.json',
  'port/v2/budgets/compendium-memory-v1.json',
);

function matches(path, ownedExact, ownedPrefixes) {
  return ownedExact.has(path) || ownedPrefixes.some((prefix) => path.startsWith(prefix));
}

function requireRepositoryPath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')
    || path.startsWith('/') || path.includes('\\')) {
    throw new Error(`invalid changed path: ${JSON.stringify(path)}`);
  }
  const segments = path.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error(`invalid changed path: ${JSON.stringify(path)}`);
  }
  return path;
}

export function classifyBatteryScope(changedPaths) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    throw new Error('the exact PR base/head diff is empty');
  }
  const paths = changedPaths.map(requireRepositoryPath);
  return Object.freeze({
    changedCount: paths.length,
    legacyChanged: paths.some((path) => matches(path, LEGACY_EXACT, LEGACY_PREFIXES)),
    artInstrumentChanged: paths.some((path) => matches(
      path, ART_INSTRUMENT_EXACT, ART_INSTRUMENT_PREFIXES,
    )),
    compendiumInstrumentChanged: paths.some(
      (path) => COMPENDIUM_INSTRUMENT_EXACT.has(path),
    ),
    browserTransportChanged: paths.some(
      (path) => SHARED_BROWSER_TRANSPORT_EXACT.has(path),
    ),
  });
}

function parseNulPaths(buffer) {
  if (buffer.length === 0) return [];
  const fields = buffer.toString('utf8').split('\0');
  if (fields.at(-1) === '') fields.pop();
  return fields;
}

function parseArgs(args) {
  const values = new Map();
  for (const arg of args) {
    const match = /^--(paths-file|github-output)=(.+)$/u.exec(arg);
    if (!match || values.has(match[1])) {
      throw new Error('usage: node tools/battery-scope.mjs --paths-file=<nul-file> --github-output=<path>');
    }
    values.set(match[1], match[2]);
  }
  if (values.size !== 2 || !values.has('paths-file') || !values.has('github-output')) {
    throw new Error('usage: node tools/battery-scope.mjs --paths-file=<nul-file> --github-output=<path>');
  }
  return Object.freeze({
    pathsFile: resolve(values.get('paths-file')),
    githubOutput: resolve(values.get('github-output')),
  });
}

function main() {
  const { pathsFile, githubOutput } = parseArgs(process.argv.slice(2));
  const scope = classifyBatteryScope(parseNulPaths(readFileSync(pathsFile)));
  const output = [
    `changed_count=${scope.changedCount}`,
    `legacy_changed=${scope.legacyChanged}`,
    `art_instrument_changed=${scope.artInstrumentChanged}`,
    `compendium_instrument_changed=${scope.compendiumInstrumentChanged}`,
    `browser_transport_changed=${scope.browserTransportChanged}`,
  ].join('\n');
  writeFileSync(githubOutput, `${output}\n`, { flag: 'a' });
  console.log(
    `Classified ${scope.changedCount} changed paths: legacy=${scope.legacyChanged} `
      + `art-instrument=${scope.artInstrumentChanged} `
      + `compendium-instrument=${scope.compendiumInstrumentChanged} `
      + `browser-transport=${scope.browserTransportChanged}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`BATTERY SCOPE: FAIL\n${detail}`);
    process.exitCode = 1;
  }
}
