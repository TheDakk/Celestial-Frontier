import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { acquireToolchainLock, LOCK_DIRECTORY, parseArgs, runWithToolchainLock } from './with-toolchain-lock.mjs';

function scratch(t) {
  const directory = mkdtempSync(join(tmpdir(), 'cf-toolchain-lock-unit-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, lock: join(directory, 'lock') };
}

test('CLI keeps command arguments literal and the macOS lock shared across worktrees', () => {
  const literal = 'literal ; $(echo should-not-run)';
  assert.deepEqual(parseArgs(['--label', 'asset batch', '--', 'node', literal]),
    { label: 'asset batch', command: 'node', args: [literal] });
  for (const argv of [[], ['--label', '', '--', 'node'], ['--label', 'x', 'node'], ['--label', 'x', '--']])
    assert.throws(() => parseArgs(argv), /Usage:/);
  if (process.platform === 'darwin')
    assert.equal(LOCK_DIRECTORY, `/private/tmp/celestial-frontier-toolchain-${process.getuid()}.lock`);
});

test('existing ownership excludes another command, including a stale PID', async (t) => {
  const { lock, directory } = scratch(t);
  const first = acquireToolchainLock('certification', lock);
  const ownerPath = join(lock, 'owner.json');
  const original = readFileSync(ownerPath, 'utf8');
  await assert.rejects(runWithToolchainLock({ label: 'update', directory: lock,
    command: process.execPath, args: ['-e', 'require("node:fs").writeFileSync(process.argv[1], "ran")', join(directory, 'forbidden')] }),
  /already exists.*certification/);
  assert.equal(existsSync(join(directory, 'forbidden')), false);
  assert.equal(readFileSync(ownerPath, 'utf8'), original);
  writeFileSync(ownerPath, JSON.stringify({ ...first.owner, pid: 999999999 }));
  assert.throws(() => acquireToolchainLock('update', lock), /PID 999999999/);
  writeFileSync(ownerPath, original);
  first.release();
});

test('changed token or unreadable metadata retains the existing lock', (t) => {
  const { lock } = scratch(t);
  const owned = acquireToolchainLock('assets', lock);
  const ownerPath = join(lock, 'owner.json');
  writeFileSync(ownerPath, JSON.stringify({ ...owned.owner, token: 'replacement-owner' }));
  assert.throws(() => owned.release(), /ownership changed/);
  assert.equal(JSON.parse(readFileSync(ownerPath, 'utf8')).token, 'replacement-owner');
  writeFileSync(ownerPath, '{');
  assert.throws(() => acquireToolchainLock('update', lock), /metadata missing or unreadable/);
  assert.equal(readFileSync(ownerPath, 'utf8'), '{');
});

test('normal and nonzero child exits release the lock and preserve literal argv', async (t) => {
  const { lock } = scratch(t);
  const literal = 'literal ; $(echo should-not-run)';
  assert.equal(await runWithToolchainLock({ label: 'literal argv', directory: lock,
    command: process.execPath, args: ['-e', 'process.exit(process.argv[1] === "literal ; $(echo should-not-run)" ? 0 : 8)', literal] }), 0);
  assert.equal(existsSync(lock), false);
  assert.equal(await runWithToolchainLock({ label: 'nonzero', directory: lock,
    command: process.execPath, args: ['-e', 'process.exit(7)'] }), 7);
  assert.equal(existsSync(lock), false);
});

test('spawn failure releases only its newly acquired lock', async (t) => {
  const { lock, directory } = scratch(t);
  assert.equal(await runWithToolchainLock({ label: 'missing executable', directory: lock,
    command: join(directory, 'does-not-exist') }), 1);
  assert.equal(existsSync(lock), false);
});

test('SIGTERM keeps the lock until the owned child has completed its delayed exit', { timeout: 10000 }, async (t) => {
  const { directory, lock } = scratch(t);
  const ready = join(directory, 'ready');
  const signalled = join(directory, 'signalled');
  const moduleUrl = new URL('./with-toolchain-lock.mjs', import.meta.url).href;
  const childCode = `const fs = require('node:fs');
    process.on('SIGTERM', () => { fs.writeFileSync(${JSON.stringify(signalled)}, 'yes'); setTimeout(() => process.exit(0), 500); });
    fs.writeFileSync(${JSON.stringify(ready)}, 'yes'); setInterval(() => {}, 1000);`;
  const wrapperCode = `import {runWithToolchainLock} from ${JSON.stringify(moduleUrl)};
    process.exitCode = await runWithToolchainLock({label:'signal test', directory:${JSON.stringify(lock)},
      command:process.execPath, args:['-e',${JSON.stringify(childCode)}]});`;
  const wrapper = spawn(process.execPath, ['--input-type=module', '-e', wrapperCode], { stdio: 'pipe' });
  const closed = once(wrapper, 'close');
  t.after(async () => {
    if (wrapper.exitCode === null && wrapper.signalCode === null) wrapper.kill('SIGTERM');
    await closed;
  });
  const waitFor = async (path) => {
    const deadline = Date.now() + 4000;
    while (!existsSync(path) && Date.now() < deadline) await delay(10);
    assert.equal(existsSync(path), true, `child did not produce ${path}`);
  };
  await waitFor(ready);
  wrapper.kill('SIGTERM');
  await waitFor(signalled);
  assert.equal(existsSync(lock), true);
  assert.throws(() => acquireToolchainLock('update while stopping', lock), /already exists/);
  assert.deepEqual(await closed, [143, null]);
  assert.equal(existsSync(lock), false);
});
