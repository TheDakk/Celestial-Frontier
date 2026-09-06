#!/usr/bin/env node
/**
 * node tools/with-toolchain-lock.mjs --label NAME -- command arg ...
 * Wrap the WHOLE foreground asset job, update, or certification chain once.
 * The command must wait for its own descendants; do not detach background jobs.
 * Every agent/worktree on this macOS account uses the same UID-keyed lock.
 * No stale-lock recovery is automatic. SIGKILL/crashes retain the lock for review.
 */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { constants, tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LOCK_DIRECTORY = join(process.platform === 'darwin' ? '/private/tmp' : tmpdir(),
  `celestial-frontier-toolchain-${process.getuid?.() ?? 'unsupported'}.lock`);
const USAGE = 'Usage: node tools/with-toolchain-lock.mjs --label NAME -- command [args...]';
const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];

export function parseArgs(argv) {
  if (argv[0] !== '--label' || !argv[1]?.trim() || argv[2] !== '--' || !argv[3])
    throw new Error(USAGE);
  return { label: argv[1], command: argv[3], args: argv.slice(4) };
}

export function acquireToolchainLock(label, directory = LOCK_DIRECTORY) {
  const ownerPath = join(directory, 'owner.json');
  try {
    mkdirSync(directory, { mode: 0o700 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let detail = 'owner metadata missing or unreadable';
    try {
      const owner = JSON.parse(readFileSync(ownerPath, 'utf8'));
      detail = `PID ${owner.pid ?? '?'}; label ${JSON.stringify(owner.label ?? '?')}; started ${owner.startedAt ?? '?'}`;
    } catch { /* An incomplete or stale lock still excludes new work. */ }
    throw new Error(`Toolchain lock already exists at ${directory}: ${detail}. ` +
      'No command started. Inspect its owner before any manual recovery; this tool never removes an existing lock.');
  }
  const owner = { pid: process.pid, token: randomUUID(), label, startedAt: new Date().toISOString() };
  try {
    writeFileSync(ownerPath, `${JSON.stringify(owner, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    // An incomplete lock is retained if anything was written; never erase unknown data.
    try { rmdirSync(directory); } catch { /* Fail closed. */ }
    throw error;
  }
  return {
    owner,
    release() {
      const current = JSON.parse(readFileSync(ownerPath, 'utf8'));
      if (current.token !== owner.token || current.pid !== owner.pid)
        throw new Error(`Toolchain lock ownership changed; retained ${directory}`);
      const entries = readdirSync(directory);
      if (entries.length !== 1 || entries[0] !== 'owner.json')
        throw new Error(`Unexpected toolchain lock contents; retained ${directory}`);
      unlinkSync(ownerPath);
      rmdirSync(directory);
    },
  };
}

export async function runWithToolchainLock({ label, command, args = [], directory = LOCK_DIRECTORY }) {
  const lock = acquireToolchainLock(label, directory);
  return await new Promise((resolve) => {
    let child;
    let requestedSignal;
    let spawnError;
    let finished = false;
    const handlers = new Map();
    const finish = (code, signal) => {
      if (finished) return;
      finished = true;
      for (const [name, handler] of handlers) process.off(name, handler);
      let result = requestedSignal || signal
        ? 128 + (constants.signals[requestedSignal || signal] ?? 1)
        : code ?? 1;
      if (spawnError) {
        console.error(`Toolchain command failed to start: ${spawnError.message}`);
        result = 1;
      }
      try { lock.release(); }
      catch (error) { console.error(error.message); result = 1; }
      resolve(result);
    };
    for (const signal of SIGNALS) {
      const handler = () => {
        requestedSignal ??= signal;
        if (!child?.pid) return;
        try {
          // Only this wrapper's child process group receives forwarded cancellation.
          if (process.platform !== 'win32') process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch (error) {
          if (error.code !== 'ESRCH') console.error(`Could not forward ${signal}: ${error.message}`);
        }
        // Do not release here: the child may ignore or delay handling the signal.
      };
      handlers.set(signal, handler);
      process.on(signal, handler);
    }
    try {
      child = spawn(command, args, { shell: false, stdio: 'inherit', detached: process.platform !== 'win32' });
      child.once('error', (error) => { spawnError = error; });
      child.once('close', finish);
    } catch (error) {
      spawnError = error;
      finish(1);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await runWithToolchainLock(parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
