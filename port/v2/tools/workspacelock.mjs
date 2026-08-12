/* workspacelock.mjs — one exclusive local gate per repository checkout.

   overridecheck.control deliberately rewrites production art source and then
   restores it. A concurrent Vite/evidence build can capture those temporary
   bytes even when both commands eventually report a clean tree. Every
   source-mutating control and every byte-producing browser/build gate must
   hold this same lock for its complete process lifetime. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = fs.realpathSync(path.resolve(here, '..', '..', '..'));
const checkoutKey = crypto.createHash('sha256').update(repoRoot).digest('hex').slice(0, 20);
const lockPath = path.join(os.tmpdir(), `celestial-frontier-workspace-${checkoutKey}.lock.json`);
const inheritedLockEnv = 'CF_V2_INHERITED_WORKSPACE_LOCK';
const releaseTokens = new WeakMap();
const childLeaseIssued = new WeakSet();

function processIsAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error?.code !== 'ESRCH' ? true : false; }
}

function readOwner() {
  try { return JSON.parse(fs.readFileSync(lockPath, 'utf8')); }
  catch { return null; }
}

function inheritedOwner() {
  const encoded = process.env[inheritedLockEnv];
  if (!encoded) return null;
  let claim;
  try { claim = JSON.parse(encoded); }
  catch { throw new Error('inherited workspace-lock claim is not valid JSON'); }
  const owner = readOwner();
  if (!owner || owner.token !== claim.token || owner.pid !== claim.pid
    || owner.repoRoot !== repoRoot || process.ppid !== owner.pid || !processIsAlive(owner.pid)) {
    throw new Error('inherited workspace-lock claim does not match a live parent-owned checkout lock');
  }
  return owner;
}

export function acquireWorkspaceLock(label, { inheritFromParent = false } = {}) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('workspace lock label is required');
  if (inheritFromParent && inheritedOwner()) return () => {};
  const token = crypto.randomBytes(16).toString('hex');
  const record = { pid: process.pid, label: label.trim(), token, repoRoot, acquiredAt: new Date().toISOString() };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(lockPath, 'wx', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(record) + '\n'); }
      finally { fs.closeSync(fd); }
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        const current = readOwner();
        if (current?.token === token && current?.pid === process.pid) {
          try { fs.unlinkSync(lockPath); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
        }
      };
      releaseTokens.set(release, token);
      process.once('exit', release);
      return release;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      const owner = readOwner();
      if (owner && processIsAlive(owner.pid)) {
        throw new Error(`workspace gate ${JSON.stringify(label)} cannot overlap ${JSON.stringify(owner.label || 'unknown')} (pid ${owner.pid})`);
      }
      /* A dead process can leave only this exact checkout-keyed temp file.
         Remove it once, then retry the atomic create. */
      try { fs.unlinkSync(lockPath); } catch (unlinkError) { if (unlinkError?.code !== 'ENOENT') throw unlinkError; }
    }
  }
  throw new Error(`workspace gate ${JSON.stringify(label)} could not acquire ${lockPath}`);
}

/** Pass a parent's already-held lock to one direct child. The child still
 * validates the live lock record, token, checkout and parent PID; a bare env
 * flag cannot bypass exclusion. */
export function workspaceLockChildEnvironment(release, baseEnvironment = process.env) {
  const token = releaseTokens.get(release);
  if (!token) throw new Error('workspace-lock child environment requires this process\'s live release handle');
  if (childLeaseIssued.has(release)) {
    throw new Error('workspace-lock release handle has already issued its one direct-child lease');
  }
  const owner = readOwner();
  if (!owner || owner.token !== token || owner.pid !== process.pid || owner.repoRoot !== repoRoot) {
    throw new Error('workspace-lock child environment requires a currently held checkout lock');
  }
  childLeaseIssued.add(release);
  return {
    ...baseEnvironment,
    [inheritedLockEnv]: JSON.stringify({ token, pid: process.pid }),
  };
}

export const WORKSPACE_LOCK_PATH = lockPath;

function runSelftest() {
  const release = acquireWorkspaceLock('workspace lock selftest holder');
  const inheritedScript = `import { acquireWorkspaceLock } from ${JSON.stringify(fileURLToPath(import.meta.url))}; const release=acquireWorkspaceLock('workspace lock selftest inherited child',{inheritFromParent:true}); release();`;
  const inherited = spawnSync(process.execPath, ['--input-type=module', '-e', inheritedScript], {
    cwd: repoRoot, encoding: 'utf8', timeout: 5000,
    env: workspaceLockChildEnvironment(release),
  });
  let duplicateLeaseRejected = false;
  try { workspaceLockChildEnvironment(release); }
  catch (error) { duplicateLeaseRejected = /already issued/.test(String(error?.message || error)); }
  if (!duplicateLeaseRejected) {
    release();
    throw new Error('workspace lock selftest did not reject a second direct-child lease');
  }
  if (inherited.status !== 0) {
    release();
    throw new Error(`workspace lock selftest inheritance failed: ${JSON.stringify({ status: inherited.status, stderr: inherited.stderr })}`);
  }
  const script = `import { acquireWorkspaceLock } from ${JSON.stringify(fileURLToPath(import.meta.url))}; acquireWorkspaceLock('workspace lock selftest contender');`;
  const contender = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: repoRoot, encoding: 'utf8', timeout: 5000,
  });
  release();
  if (contender.status === 0 || !/cannot overlap/.test(contender.stderr || '')) {
    throw new Error(`workspace lock selftest contention control failed: ${JSON.stringify({ status: contender.status, stderr: contender.stderr })}`);
  }
  const after = acquireWorkspaceLock('workspace lock selftest successor');
  after();
  console.log('WORKSPACE LOCK SELFTEST: PASS — one direct child inherited; concurrent gate rejected; release permits the next gate');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length === 3 && process.argv[2] === '--selftest') runSelftest();
  else {
    console.error('usage: node tools/workspacelock.mjs --selftest');
    process.exitCode = 2;
  }
}
