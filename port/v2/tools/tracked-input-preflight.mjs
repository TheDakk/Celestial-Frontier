#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '../../..');
const V2_RELATIVE = join('port', 'v2');
const TEMP_PREFIX = 'cf-tracked-input-preflight-';
const CHILD_TIMEOUT_MS = 30 * 60 * 1_000;
const TEST_KINDS = ['test', 'spec'];
const TEST_EXTENSIONS = ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs'];

export const HOSTED_STATIC_COMMANDS = Object.freeze([
  Object.freeze(['npm', 'test']),
  Object.freeze(['npm', 'run', 'typecheck']),
  Object.freeze(['npm', 'run', 'artunused']),
  Object.freeze(['npm', 'run', 'artaudit']),
  Object.freeze(['npm', 'run', 'overridecheck']),
  Object.freeze(['npm', 'run', 'overridecontrol']),
  Object.freeze(['npm', 'run', 'coveragegap']),
  Object.freeze(['node', 'tools/speccheck.mjs']),
  Object.freeze(['npm', 'exec', '--', 'vitest', 'run', 'tests/current-producer-authorities.test.ts']),
]);

export function commandInvocation(
  name,
  args,
  platform = process.platform,
  commandInterpreter = process.env.ComSpec || 'cmd.exe',
) {
  if (name === 'node') return Object.freeze({ executable: process.execPath, args: [...args] });
  if (name === 'npm' && platform !== 'win32') {
    return Object.freeze({ executable: 'npm', args: [...args] });
  }
  if (name === 'npm') {
    const tokens = ['npm.cmd', ...args];
    if (tokens.some((token) => !/^[A-Za-z0-9_./:@=+,-]+$/.test(token))) {
      throw new Error('unsafe token in Windows npm command');
    }
    return Object.freeze({
      executable: commandInterpreter,
      args: ['/d', '/s', '/c', tokens.join(' ')],
    });
  }
  throw new Error(`unsupported tracked-input command executable: ${name}`);
}

function assertOwnedTemporaryDirectory(directory) {
  const absolute = resolve(directory);
  if (
    resolve(dirname(absolute)) !== resolve(tmpdir())
    || !basename(absolute).startsWith(TEMP_PREFIX)
  ) {
    throw new Error(`refusing to remove non-owned temporary directory: ${absolute}`);
  }
  return absolute;
}

function removeOwnedTemporaryDirectory(directory) {
  rmSync(assertOwnedTemporaryDirectory(directory), { recursive: true, force: true });
}

function runCapture(executable, args, cwd, options = {}) {
  return spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
}

function requireSuccessful(result, description) {
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${description} failed with status ${String(result.status)}${detail ? `\n${detail}` : ''}`);
  }
  return result.stdout ?? '';
}

function gitCapture(args, cwd = REPOSITORY_ROOT) {
  return requireSuccessful(runCapture('git', args, cwd), `git ${args.join(' ')}`);
}

function isTrackedStateClean(repositoryRoot = REPOSITORY_ROOT) {
  const result = runCapture('git', ['diff', '--quiet', 'HEAD', '--'], repositoryRoot);
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  requireSuccessful(result, 'tracked state inspection');
  return false;
}

function testPathspecs(scope) {
  const normalizedScope = scope.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
  const prefix = normalizedScope ? `${normalizedScope}/` : '';
  return TEST_KINDS.flatMap((kind) => TEST_EXTENSIONS.map(
    (extension) => `:(glob)${prefix}**/*.${kind}.${extension}`,
  ));
}

function nulPaths(output) {
  return output.split('\0').filter(Boolean);
}

function isDependencyOwnedTest(path) {
  return path.replaceAll('\\', '/').split('/').includes('node_modules');
}

function forgottenTestFiles(repositoryRoot = REPOSITORY_ROOT, scope = V2_RELATIVE) {
  const pathspecs = testPathspecs(scope);
  const ordinary = gitCapture(
    ['ls-files', '--others', '--exclude-standard', '-z', '--', ...pathspecs],
    repositoryRoot,
  );
  const ignored = gitCapture(
    ['ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--', ...pathspecs],
    repositoryRoot,
  );
  return [...new Set([...nulPaths(ordinary), ...nulPaths(ignored)])]
    .filter((path) => !isDependencyOwnedTest(path))
    .sort();
}

function candidateStateErrors(
  expectedHead,
  repositoryRoot = REPOSITORY_ROOT,
  scope = V2_RELATIVE,
) {
  const errors = [];
  const observedHead = gitCapture(['rev-parse', 'HEAD'], repositoryRoot).trim();
  if (observedHead !== expectedHead) {
    errors.push(`HEAD changed during tracked-input preflight: ${expectedHead} -> ${observedHead}`);
  }
  if (!isTrackedStateClean(repositoryRoot)) {
    errors.push('tracked worktree or index no longer equals HEAD');
  }
  const forgotten = forgottenTestFiles(repositoryRoot, scope);
  if (forgotten.length > 0) {
    errors.push(`untracked or ignored test files would be absent from CI:\n${forgotten.join('\n')}`);
  }
  return errors;
}

function requireStableCandidate(head) {
  const errors = candidateStateErrors(head);
  if (errors.length > 0) throw new Error(errors.join('\n'));
}

function exportTrackedIndex(repositoryRoot) {
  const snapshotRoot = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  try {
    gitCapture(
      ['checkout-index', '--all', '--force', `--prefix=${snapshotRoot}${sep}`],
      repositoryRoot,
    );
    return snapshotRoot;
  } catch (error) {
    removeOwnedTemporaryDirectory(snapshotRoot);
    throw error;
  }
}

function runHostedStaticCommand(command, cwd) {
  const [name, ...args] = command;
  const invocation = commandInvocation(name, args);
  console.log(`\n[tracked-input] ${command.join(' ')}`);
  execFileSync(invocation.executable, invocation.args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    timeout: CHILD_TIMEOUT_MS,
  });
}

export function runHostedStaticCommands(cwd, runner = runHostedStaticCommand) {
  for (const command of HOSTED_STATIC_COMMANDS) runner(command, cwd);
}

function runTrackedInputPreflight() {
  const discoveredRoot = gitCapture(['rev-parse', '--show-toplevel']).trim();
  if (resolve(discoveredRoot) !== REPOSITORY_ROOT) {
    throw new Error(`script repository mismatch: expected ${REPOSITORY_ROOT}, found ${discoveredRoot}`);
  }
  const head = gitCapture(['rev-parse', 'HEAD']).trim();
  requireStableCandidate(head);
  const snapshotRoot = exportTrackedIndex(REPOSITORY_ROOT);
  const snapshotV2 = join(snapshotRoot, V2_RELATIVE);
  try {
    if (!existsSync(join(snapshotV2, 'package-lock.json'))) {
      throw new Error('tracked snapshot is missing port/v2/package-lock.json');
    }
    if (existsSync(join(snapshotV2, 'node_modules'))) {
      throw new Error('tracked snapshot unexpectedly contains node_modules');
    }
    console.log(`[tracked-input] committed snapshot ${head}`);
    const install = commandInvocation(
      'npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'],
    );
    execFileSync(install.executable, install.args, {
      cwd: snapshotV2,
      env: process.env,
      stdio: 'inherit',
      timeout: CHILD_TIMEOUT_MS,
    });
    runHostedStaticCommands(snapshotV2);
    requireStableCandidate(head);
    console.log(`\nTRACKED INPUT PREFLIGHT: PASS (${head})`);
  } finally {
    removeOwnedTemporaryDirectory(snapshotRoot);
  }
}

function writeFixture(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
}

function fixtureCommandPasses(cwd, ...args) {
  const result = runCapture(process.execPath, args, cwd, { timeout: 5_000 });
  return !result.error && result.status === 0;
}

function assertSelftest(condition, message) {
  if (!condition) throw new Error(`tracked-input selftest: ${message}`);
}

function fixtureSnapshotPasses(repositoryRoot, dependency, generate = false) {
  const snapshot = exportTrackedIndex(repositoryRoot);
  try {
    if (generate) {
      assertSelftest(
        fixtureCommandPasses(snapshot, 'generator.mjs', dependency),
        `tracked generator did not create ${dependency}`,
      );
    }
    return fixtureCommandPasses(snapshot, 'consumer.mjs', dependency);
  } finally {
    removeOwnedTemporaryDirectory(snapshot);
  }
}

function runSelftest() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  try {
    gitCapture(['init', '--quiet'], fixtureRoot);
    gitCapture(['config', 'user.email', 'tracked-input@example.invalid'], fixtureRoot);
    gitCapture(['config', 'user.name', 'Tracked Input Selftest'], fixtureRoot);
    gitCapture(['config', 'commit.gpgsign', 'false'], fixtureRoot);
    gitCapture(['config', 'core.autocrlf', 'false'], fixtureRoot);
    gitCapture(['config', 'core.hooksPath', '.git/no-hooks'], fixtureRoot);
    const consumer = [
      "import { readFileSync } from 'node:fs';",
      "const value = readFileSync(new URL(process.argv[2], import.meta.url), 'utf8');",
      "if (value !== 'fixture\\n') process.exit(9);",
      '',
    ].join('\n');
    const generator = [
      "import { writeFileSync } from 'node:fs';",
      "writeFileSync(new URL(process.argv[2], import.meta.url), 'fixture\\n', 'utf8');",
      '',
    ].join('\n');
    writeFixture(
      join(fixtureRoot, '.gitignore'),
      'ignored.dep\nbuild-output.dep\nignored-tests/\nignored-*.bin\nnode_modules/\n',
    );
    writeFixture(join(fixtureRoot, 'consumer.mjs'), consumer);
    writeFixture(join(fixtureRoot, 'generator.mjs'), generator);
    gitCapture(['add', '.gitignore', 'consumer.mjs', 'generator.mjs'], fixtureRoot);
    gitCapture(['commit', '--quiet', '-m', 'fixture'], fixtureRoot);

    writeFixture(join(fixtureRoot, 'notes.txt'), 'unrelated ambient file\n');
    writeFixture(join(fixtureRoot, 'ignored-cache.bin'), 'unrelated ignored file\n');
    writeFixture(
      join(fixtureRoot, 'node_modules', 'dependency', 'dependency.test.ts'),
      'dependency-owned test\n',
    );
    assertSelftest(
      forgottenTestFiles(fixtureRoot, '').length === 0,
      'unrelated ambient files were mistaken for tests',
    );

    writeFixture(join(fixtureRoot, 'ambient.dep'), 'fixture\n');
    assertSelftest(
      fixtureCommandPasses(fixtureRoot, 'consumer.mjs', 'ambient.dep'),
      'direct tree did not consume the untracked dependency',
    );
    assertSelftest(
      !fixtureSnapshotPasses(fixtureRoot, 'ambient.dep'),
      'tracked snapshot consumed an untracked dependency',
    );
    gitCapture(['add', 'ambient.dep'], fixtureRoot);
    gitCapture(['commit', '--quiet', '-m', 'track dependency'], fixtureRoot);
    assertSelftest(
      fixtureSnapshotPasses(fixtureRoot, 'ambient.dep'),
      'tracked snapshot rejected the tracked dependency control',
    );

    writeFixture(join(fixtureRoot, 'ignored.dep'), 'fixture\n');
    assertSelftest(
      fixtureCommandPasses(fixtureRoot, 'consumer.mjs', 'ignored.dep'),
      'direct tree did not consume the ignored dependency',
    );
    assertSelftest(
      !fixtureSnapshotPasses(fixtureRoot, 'ignored.dep'),
      'tracked snapshot consumed an ignored dependency',
    );
    assertSelftest(
      fixtureSnapshotPasses(fixtureRoot, 'build-output.dep', true),
      'tracked snapshot rejected an artifact generated inside the snapshot',
    );

    writeFixture(join(fixtureRoot, 'tests', 'forgotten.test.ts'), 'throw new Error();\n');
    writeFixture(join(fixtureRoot, 'ignored-tests', 'forgotten.spec.js'), 'throw new Error();\n');
    const forgotten = forgottenTestFiles(fixtureRoot, '');
    assertSelftest(
      forgotten.includes('tests/forgotten.test.ts'),
      'untracked test file was not rejected',
    );
    assertSelftest(
      forgotten.includes('ignored-tests/forgotten.spec.js'),
      'ignored test file was not rejected',
    );

    assertSelftest(isTrackedStateClean(fixtureRoot), 'ambient files made tracked state dirty');
    const stableHead = gitCapture(['rev-parse', 'HEAD'], fixtureRoot).trim();
    assertSelftest(
      candidateStateErrors(stableHead, fixtureRoot, '').some((error) => error.includes('absent from CI')),
      'candidate stability recheck accepted forgotten tests',
    );
    writeFixture(join(fixtureRoot, 'consumer.mjs'), `${consumer}// dirty\n`);
    assertSelftest(!isTrackedStateClean(fixtureRoot), 'dirty tracked input was accepted');
    assertSelftest(
      candidateStateErrors(stableHead, fixtureRoot, '').some((error) => error.includes('no longer equals HEAD')),
      'candidate stability recheck accepted tracked drift',
    );
    writeFixture(join(fixtureRoot, 'consumer.mjs'), consumer);
    assertSelftest(isTrackedStateClean(fixtureRoot), 'restored tracked input remained dirty');
    writeFixture(join(fixtureRoot, 'head-drift.txt'), 'tracked head drift\n');
    gitCapture(['add', 'head-drift.txt'], fixtureRoot);
    gitCapture(['commit', '--quiet', '-m', 'move head'], fixtureRoot);
    assertSelftest(
      candidateStateErrors(stableHead, fixtureRoot, '').some((error) => error.includes('HEAD changed')),
      'candidate stability recheck accepted HEAD drift',
    );

    let cleanupRejected = false;
    try {
      assertOwnedTemporaryDirectory(fixtureRoot.replace(TEMP_PREFIX, 'not-owned-'));
    } catch {
      cleanupRejected = true;
    }
    assertSelftest(cleanupRejected, 'cleanup ownership guard accepted a foreign path');
    console.log('TRACKED INPUT PREFLIGHT SELFTEST: PASS');
  } finally {
    removeOwnedTemporaryDirectory(fixtureRoot);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--selftest') {
    runSelftest();
    return;
  }
  if (args.length !== 0) {
    throw new Error('usage: node tools/tracked-input-preflight.mjs [--selftest]');
  }
  runTrackedInputPreflight();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`TRACKED INPUT PREFLIGHT: FAIL\n${detail}`);
    process.exitCode = 1;
  }
}
