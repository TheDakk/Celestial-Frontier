/* Browser-free, read-only authority printer for the final frozen v2 build.
   It owns one locked unconditional app build before reading dist, never edits a budget,
   and never treats a historical calibration sample as current. */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_OUTCOMES, compendiumMeasurementAuthority, compendiumProducerAuthority,
} from './compendiummem-contract.mjs';
import {
  COMPENDIUM_FIXTURE_SPEC_PATH, buildCompendiumFixture, stableJson,
} from './compendiummem-fixture.mjs';
import { findCandidateSpeciesArtBuildGraph } from './speciesart-build.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hashFile = (file) => sha256(fs.readFileSync(file));
const portable = (value) => value.split(path.sep).join('/');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function distIdentity() {
  const files = [];
  const visit = (directory) => {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory() && !stat.isSymbolicLink()) visit(absolute);
      else if (stat.isFile() && !stat.isSymbolicLink()) {
        files.push({
          path: portable(path.relative(distDir, absolute)),
          bytes: stat.size,
          sha256: hashFile(absolute),
        });
      } else throw new Error(`dist contains unsupported entry: ${absolute}`);
    }
  };
  visit(distDir);
  if (!files.some((item) => item.path === 'index.html')) {
    throw new Error('Vite build did not produce index.html');
  }
  return Object.freeze({
    schema: 'cf-v2-scene-memory-build/v1',
    files: Object.freeze(files),
    sha256: sha256(stableJson(files)),
  });
}

function sceneMemoryProducerAuthority(fixture, build) {
  const file = (...parts) => path.join(v2Root, ...parts);
  return Object.freeze({
    collector: hashFile(file('tools', 'scenemem.mjs')),
    browserCdp: hashFile(file('tools', 'browsercdp.mjs')),
    browserPath: hashFile(file('tools', 'browserpath.mjs')),
    workspaceLock: hashFile(file('tools', 'workspacelock.mjs')),
    fixtureGenerator: hashFile(file('tools', 'compendiummem-fixture.mjs')),
    verdictContract: hashFile(file('tools', 'scenemem-contract.mjs')),
    fixtureSpec: hashFile(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixture.rowsSha256,
    baselineSaveFixtures: hashFile(path.join(
      v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
    )),
    package: hashFile(file('package.json')),
    packageLock: hashFile(file('package-lock.json')),
    appPackage: hashFile(file('apps', 'game', 'package.json')),
    buildDist: build.sha256,
    gameHtml: hashFile(file('apps', 'game', 'index.html')),
    gameMain: hashFile(file('apps', 'game', 'src', 'main.ts')),
    shipVisualState: hashFile(file('packages', 'scene', 'src', 'ship-visual-state.ts')),
    shipyardPreview: hashFile(file('apps', 'game', 'src', 'shipyard-preview.ts')),
    planetTextureAttachment: hashFile(file(
      'apps', 'game', 'src', 'planet-texture-attachment.ts',
    )),
    planetTextureDemand: hashFile(file('apps', 'game', 'src', 'planet-texture-demand.ts')),
    sceneTextureOwner: hashFile(file('apps', 'game', 'src', 'scene-texture-owner.ts')),
    pixiManagedResourceOwner: hashFile(file(
      'apps', 'game', 'src', 'pixi-managed-resource-owner.ts',
    )),
    pixiBatchTextureArray: hashFile(file(
      'apps', 'game', 'src', 'pixi-batch-texture-array.ts',
    )),
    sceneText: hashFile(file('apps', 'game', 'src', 'scene-text.ts')),
  });
}

function compendiumAuthorities(fixture) {
  const file = (...parts) => path.join(v2Root, ...parts);
  const measurementInputs = Object.freeze({
    fixtureSpec: hashFile(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixture.rowsSha256,
    fixtureGenerator: hashFile(file('tools', 'compendiummem-fixture.mjs')),
    budgetSchema: hashFile(file('budgets', 'compendium-memory-v1.schema.json')),
    outcomeContract: hashFile(file('tools', 'compendiummem-contract.mjs')),
    collector: hashFile(file('tools', 'compendiummem.mjs')),
    browserCdp: hashFile(file('tools', 'browsercdp.mjs')),
    browserPath: hashFile(file('tools', 'browserpath.mjs')),
    workspaceLock: hashFile(file('tools', 'workspacelock.mjs')),
    package: hashFile(file('package.json')),
    packageLock: hashFile(file('package-lock.json')),
    appPackage: hashFile(file('apps', 'game', 'package.json')),
    baselineSaveFixtures: hashFile(path.join(
      v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
    )),
    speciesArtBuildGraph: hashFile(file('tools', 'speciesart-build.mjs')),
    outcomeInventory: sha256(stableJson(EXPECTED_OUTCOMES)),
  });
  const measurement = compendiumMeasurementAuthority(measurementInputs);
  if (measurement === null) throw new Error('Compendium measurement authority is unavailable');
  const graph = Object.freeze({
    index: Object.freeze({
      relativePath: 'index.html',
      sha256: hashFile(path.join(distDir, 'index.html')),
    }),
    ...findCandidateSpeciesArtBuildGraph(distDir),
  });
  const producer = compendiumProducerAuthority(graph);
  if (producer === null) throw new Error('Compendium producer authority is unavailable');
  return Object.freeze({ measurement, producer });
}

export function collectCurrentProducerAuthorities() {
  const releaseWorkspaceLock = acquireWorkspaceLock('current producer authority build');
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    const fixture = buildCompendiumFixture();
    const build = distIdentity();
    const sceneMemory = sceneMemoryProducerAuthority(fixture, build);
    const compendium = compendiumAuthorities(fixture);
    const sceneBudget = readJson(path.join(v2Root, 'budgets', 'scene-memory-v2.json'));
    const compendiumBudget = readJson(path.join(
      v2Root, 'budgets', 'compendium-memory-v1.json',
    ));
    return Object.freeze({
      schema: 'cf-v2-current-producer-authorities/v1',
      build: Object.freeze({
        schema: build.schema,
        sha256: build.sha256,
        fileCount: build.files.length,
      }),
      sceneMemory: Object.freeze({
        producer: sceneMemory,
        budgetMatches: stableJson(sceneBudget.authority?.producer) === stableJson(sceneMemory),
      }),
      compendium: Object.freeze({
        measurement: compendium.measurement,
        producer: compendium.producer,
        measurementBudgetMatches:
          stableJson(compendiumBudget.measurementAuthority) === stableJson(compendium.measurement),
        producerBudgetMatches:
          stableJson(compendiumBudget.producerAuthority) === stableJson(compendium.producer),
        fixedRulerAuthority: compendiumBudget.calibration?.rulerAuthority ?? null,
        numericCeilingsSha256: sha256(stableJson(compendiumBudget.ceilings)),
      }),
    });
  } finally {
    releaseWorkspaceLock();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(collectCurrentProducerAuthorities(), null, 2)}\n`);
}
