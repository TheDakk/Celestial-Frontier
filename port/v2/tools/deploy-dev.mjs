#!/usr/bin/env node
/* Local DEV-ONLY publisher (Nick 2026-09-25, decisions queue D9: "D9 yes"). The hosted publisher (.github/workflows/publish-branch-sites.yml)
   is hard-parked; this publishes one verified playtest build of the current CLEAN, SIGNED commit to https://dev-celestialfrontier.github.io
   without Actions. It can never target production: the repository and origin are hard-coded below and checked in the built package.

   Steps, stopping at the first failure (no retries):
     1. the source tree is clean and HEAD verifies G (signed);
     2. build the approved publication candidate for the dev origin (tools/devpreview.mjs --approved-publication-candidate);
     3. verify it (devpreview --verify), smoke it (devpreviewcheck), and run the controlled-service-worker REAL-DUEL picker smoke on the package;
     4. clone the dev site repo over HTTPS (the logged-in gh credential), replace its tracked files with the package, commit SIGNED with this
        repo's signing configuration, push main;
     5. wait until the live site's version.json reports this commit.
   Browser-owning: on macOS run outside the sandbox.
   Usage (from port/v2): node tools/deploy-dev.mjs [--skip-duel-smoke] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const DEV_ORIGIN = 'https://dev-celestialfrontier.github.io';
const DEV_REPO = 'https://github.com/Dev-CelestialFrontier/dev-celestialfrontier.github.io.git';
const v2 = path.resolve(import.meta.dirname, '..'), repo = path.resolve(v2, '..', '..');
const skipDuel = process.argv.includes('--skip-duel-smoke');
const fail = (m) => { console.error(`DEV PUBLISH: FAIL — ${m}`); process.exit(1); };
const git = (args, cwd = repo) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const run = (label, cmd, args, cwd = v2) => { console.log(`\n▶ ${label}`); const r = spawnSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', maxBuffer: 1 << 26 }); process.stdout.write((r.stdout ?? '').split('\n').slice(-6).join('\n') + '\n'); if (r.status !== 0) fail(`${label} exited ${r.status}`); return r.stdout ?? ''; };

if (new URL(DEV_ORIGIN).host !== 'dev-celestialfrontier.github.io' || !/^https:\/\/github\.com\/Dev-CelestialFrontier\/dev-celestialfrontier\.github\.io\.git$/.test(DEV_REPO)) fail('the target is not the dev site');
// 1. clean + signed
if (git(['status', '--porcelain=v1', '--untracked-files=all']) !== '') fail('the source tree is not clean; commit first');
const head = git(['rev-parse', 'HEAD']), sig = git(['log', '-1', '--format=%G?']);
if (sig !== 'G') fail(`HEAD ${head.slice(0, 12)} is not a verified signed commit (%G? = ${sig})`);
const branch = git(['branch', '--show-current']);
console.log(`DEV PUBLISH ${head.slice(0, 12)} (${branch}) → ${DEV_ORIGIN}`);

// 2. build the approved candidate for the dev origin
const built = run('build the approved dev candidate', process.execPath, ['tools/devpreview.mjs', `--origin=${DEV_ORIGIN}`, '--approved-publication-candidate']);
const pkg = (built.match(/\/[^\s]*dev-preview-[0-9a-f]{12}-\d+/g) ?? []).pop(); if (!pkg || !fs.existsSync(pkg)) fail('the packager did not report its package directory');
const preview = JSON.parse(fs.readFileSync(path.join(pkg, 'preview.json'), 'utf8'));
if (preview.expectedOrigin !== DEV_ORIGIN || preview.publishable !== true || preview.source?.commit !== head || preview.source?.state !== 'committed') {
  fail(`the package is not a publishable dev candidate of ${head.slice(0, 12)}: ${JSON.stringify({ origin: preview.expectedOrigin, publishable: preview.publishable, commit: preview.source?.commit })}`);
}
// 3. verify + smoke + the real-duel controlled-worker smoke on the package itself
run('verify the package', process.execPath, ['tools/devpreview.mjs', `--verify=${pkg}`]);
run('smoke the package', process.execPath, ['tools/devpreviewcheck.mjs', `--root=${pkg}`]);
const evidence = path.join(repo, 'audits', 'DEV_PUBLISH', head.slice(0, 12));
if (!skipDuel) {
  fs.rmSync(evidence, { recursive: true, force: true });
  run('real-duel smoke with the service worker controlling the page', process.execPath, ['../../audits/BATTLE2_LIBRARY_20260924/picker-smoke.mjs', pkg, evidence, 'alien:12,alien:11', 'Salmon,Octopus', '--sw-control', '--duel']);
  const report = JSON.parse(fs.readFileSync(path.join(evidence, 'report.json'), 'utf8'));
  if (report.status !== 'PASS' || (report.pageErrors ?? []).length) fail(`duel smoke ${report.status}: ${report.error ?? JSON.stringify(report.pageErrors)}`);
}

// 4. publish: a fresh clone of the dev repo, its tracked files replaced by the package, one signed commit, push
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-dev-publish-')), site = path.join(work, 'site');
try {
  execFileSync('git', ['clone', '--depth', '1', DEV_REPO, site], { stdio: 'inherit' });
  const remote = git(['remote', 'get-url', 'origin'], site); if (remote !== DEV_REPO) fail(`unexpected clone remote ${remote}`);
  for (const name of fs.readdirSync(site)) if (name !== '.git' && name !== 'CNAME' && name !== '.nojekyll') fs.rmSync(path.join(site, name), { recursive: true, force: true });
  fs.cpSync(pkg, site, { recursive: true });
  fs.writeFileSync(path.join(site, '.nojekyll'), '');
  for (const key of ['user.name', 'user.email', 'user.signingkey', 'gpg.ssh.program', 'gpg.ssh.allowedSignersFile', 'gpg.format']) {
    try { const value = git(['config', '--get', key]); if (value) git(['config', key, value], site); } catch { /* unset in this repo */ }
  }
  git(['config', 'commit.gpgsign', 'true'], site);
  git(['add', '-A'], site);
  if (git(['status', '--porcelain=v1'], site) === '') { console.log('the dev site already serves this exact package'); }
  else {
    execFileSync('git', ['commit', '-S', '-q', '-m', `dev: publish ${head.slice(0, 12)} (${branch}) — verified package, controlled-worker duel smoke ${skipDuel ? 'skipped' : 'PASS'}`], { cwd: site, stdio: 'inherit' });
    if (git(['log', '-1', '--format=%G?'], site) !== 'G') fail('the site commit is not signed');
    execFileSync('git', ['push', 'origin', 'HEAD:main'], { cwd: site, stdio: 'inherit' });
  }
} finally { fs.rmSync(work, { recursive: true, force: true }); }

// 5. wait for the live site to serve this commit
const deadline = Date.now() + 8 * 60 * 1000; let live = null;
for (;;) {
  try { const r = await fetch(`${DEV_ORIGIN}/version.json?cb=${Date.now()}`, { cache: 'no-store' }); if (r.ok) live = await r.json(); } catch { /* not yet */ }
  if (live && live.sourceCommit === head) break;
  if (Date.now() > deadline) fail(`the live site still reports ${live?.sourceCommit ?? 'nothing'} after 8 minutes (GitHub Pages may still be building)`);
  await new Promise((r) => setTimeout(r, 15000));
}
console.log(`\nDEV PUBLISH: LIVE — ${DEV_ORIGIN} serves ${head.slice(0, 12)} (${live.build ?? ''})${skipDuel ? '' : `; evidence ${path.relative(repo, evidence)}`}`);
