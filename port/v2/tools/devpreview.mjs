/* devpreview.mjs — produce or verify an origin-isolated, provenance-bound
   static package for HUMAN development playtesting.

   This tool deliberately DOES NOT deploy. A generated package may be
   published only by a separate, approved host workflow after verification.
   The runtime loader refuses to start on the production origin, and the
   output path is constrained to the ignored v2 smoke/evidence root so this
   source repository can never be mistaken for the live-site repository.

   Usage:
     node tools/devpreview.mjs --origin=https://dev-celestialfrontier.github.io
     node tools/devpreview.mjs --origin=https://dev-celestialfrontier.github.io --approved-publication-candidate
     node tools/devpreview.mjs --verify=/path/to/extracted/package
     node tools/devpreview.mjs --selftest

   A dirty checkout is rejected. --allow-dirty exists only for local visual
   diagnosis; it stamps the package DIRTY / LOCAL ONLY and publishable=false. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const evidenceRoot = path.join(appDir, 'smoke');
const PROD_ORIGIN = 'https://celestialfrontier.github.io';
const SCHEMA = 'cf-dev-preview/v3';
const VERSION_SCHEMA = 'cf-v2-version/v1';
const SITE_VERSION_SCHEMA = 'cf-development-site-version/v1';
const DEVELOPMENT_CHANNEL = 'development';
const DEFAULT_ORIGIN = 'https://dev-celestialfrontier.github.io';
const CI_PREVIEW_BROWSER = '/usr/bin/google-chrome';
const CONTROLLED_PREVIEW_WORKFLOWS = Object.freeze([
  '.github/workflows/test.yml',
  '.github/workflows/dev-preview-package.yml',
  '.github/workflows/publish-branch-sites.yml',
]);

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function sha256Bytes(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function portable(value) { return value.split(path.sep).join('/'); }
function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function readDevelopmentVersion(root) {
  const versionPath = path.join(root, 'version.json');
  assert(fs.existsSync(versionPath), `shared v2 version file is missing: ${versionPath}`);
  let value;
  try { value = JSON.parse(fs.readFileSync(versionPath, 'utf8')); }
  catch (error) { fail(`shared v2 version file is invalid JSON: ${error.message}`); }
  assert(value?.schema === VERSION_SCHEMA,
    `shared v2 version schema must be ${VERSION_SCHEMA}`);
  assert(typeof value.version === 'string'
    && /^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[-+][0-9A-Za-z.-]+)?$/.test(value.version),
  `shared v2 version is invalid: ${String(value?.version)}`);
  return Object.freeze({ schema: value.schema, version: value.version });
}

function safeTempRemove(root, prefix) {
  const tempBase = fs.realpathSync(os.tmpdir());
  const resolved = path.resolve(root);
  assert(path.dirname(resolved) === tempBase && path.basename(resolved).startsWith(prefix),
    `refusing unsafe temporary snapshot cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true });
}

function assertNoSourceSymlinks(root) {
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const absolute = path.join(dir, name);
      const stat = fs.lstatSync(absolute);
      assert(!stat.isSymbolicLink(), `exact-commit source snapshot contains a symbolic link: ${absolute}`);
      if (stat.isDirectory()) walk(absolute);
    }
  };
  walk(root);
}

function exactCommitSnapshot(repository, commit, sourcePaths, requiredRoot,
  prefix = `cf-devpreview-head-${process.pid}-`) {
  assert(/^[0-9a-f]{40}$/.test(commit), 'exact-commit snapshot requires a full SHA-1 commit');
  assert(Array.isArray(sourcePaths) && sourcePaths.length > 0, 'exact-commit snapshot requires source paths');
  for (const sourcePath of [...sourcePaths, requiredRoot]) {
    assert(/^[A-Za-z0-9._/-]+$/.test(sourcePath) && !sourcePath.startsWith('/')
      && !sourcePath.split('/').includes('..'), `unsafe snapshot source path: ${sourcePath}`);
  }
  const tempBase = fs.realpathSync(os.tmpdir());
  const tempRoot = fs.mkdtempSync(path.join(tempBase, prefix));
  const archive = path.join(tempRoot, 'source.tar');
  try {
    /* git archive reads committed objects, never working-tree bytes. That is
       the integrity boundary: a concurrent edit that is later restored cannot
       be captured between two deceptively clean status checks. */
    execFileSync('git', [
      'archive', '--format=tar', `--output=${archive}`, commit, '--', ...sourcePaths,
    ], { cwd: repository, stdio: ['ignore', 'ignore', 'pipe'] });
    execFileSync('tar', ['-xf', archive, '-C', tempRoot], {
      cwd: tempRoot, stdio: ['ignore', 'ignore', 'pipe'],
    });
    fs.unlinkSync(archive);
    const sourceRoot = path.join(tempRoot, ...requiredRoot.split('/'));
    const stat = fs.lstatSync(sourceRoot);
    assert(stat.isDirectory() && !stat.isSymbolicLink(),
      `exact-commit snapshot did not produce a real ${requiredRoot} directory`);
    assert(fs.realpathSync(sourceRoot).startsWith(`${tempRoot}${path.sep}`),
      'exact-commit snapshot escaped its temporary root');
    assertNoSourceSymlinks(tempRoot);
    return { tempRoot, sourceRoot, cleanup: () => safeTempRemove(tempRoot, prefix) };
  } catch (error) {
    safeTempRemove(tempRoot, prefix);
    throw error;
  }
}

function attachInstalledDependencies(snapshotV2Root) {
  const installed = path.join(v2Root, 'node_modules');
  const stat = fs.lstatSync(installed);
  assert(stat.isDirectory() && !stat.isSymbolicLink(),
    `installed dependency root must be a real directory: ${installed}`);
  const resolved = fs.realpathSync(installed);
  assert(path.dirname(resolved) === fs.realpathSync(v2Root) && path.basename(resolved) === 'node_modules',
    `installed dependency root escaped port/v2: ${resolved}`);
  assert(fs.existsSync(path.join(resolved, 'vite', 'bin', 'vite.js')),
    'installed dependencies do not contain the pinned Vite executable; run npm ci in port/v2');
  const target = path.join(snapshotV2Root, 'node_modules');
  assert(!fs.existsSync(target), `exact-commit snapshot unexpectedly contains node_modules: ${target}`);
  fs.mkdirSync(target);
  for (const name of fs.readdirSync(resolved).sort()) {
    const from = path.join(resolved, name);
    const to = path.join(target, name);
    if (name === '@cf') {
      const scopeStat = fs.lstatSync(from);
      assert(scopeStat.isDirectory() && !scopeStat.isSymbolicLink(),
        `installed @cf workspace scope is not a real directory: ${from}`);
      fs.mkdirSync(to);
      for (const packageName of fs.readdirSync(from).sort()) {
        const installedPackage = path.join(from, packageName);
        const installedReal = fs.realpathSync(installedPackage);
        const relative = path.relative(fs.realpathSync(v2Root), installedReal);
        assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative),
          `installed @cf/${packageName} workspace link escaped port/v2: ${installedReal}`);
        const snapshotPackage = path.join(snapshotV2Root, relative);
        const packageStat = fs.lstatSync(snapshotPackage);
        assert(packageStat.isDirectory() && !packageStat.isSymbolicLink(),
          `exact-commit snapshot lacks workspace package @cf/${packageName}: ${snapshotPackage}`);
        const linkTarget = process.platform === 'win32'
          ? snapshotPackage : path.relative(to, snapshotPackage);
        fs.symlinkSync(linkTarget, path.join(to, packageName), process.platform === 'win32' ? 'junction' : 'dir');
      }
    } else {
      const stat = fs.lstatSync(from);
      if (stat.isFile()) fs.copyFileSync(from, to);
      else {
        const dependencyReal = fs.realpathSync(from);
        assert(dependencyReal.startsWith(`${resolved}${path.sep}`)
          || !dependencyReal.startsWith(`${fs.realpathSync(v2Root)}${path.sep}`),
          `unclassified installed workspace dependency would read live source: ${from} -> ${dependencyReal}`);
        const dependencyStat = fs.statSync(dependencyReal);
        fs.symlinkSync(dependencyReal, to,
          process.platform === 'win32' && dependencyStat.isDirectory() ? 'junction'
            : dependencyStat.isDirectory() ? 'dir' : 'file');
      }
    }
  }
  assert(fs.existsSync(path.join(target, 'vite', 'bin', 'vite.js')),
    'snapshot dependency view does not expose the pinned Vite executable');
}

export function validatePreviewOrigin(raw) {
  assert(typeof raw === 'string' && raw.trim(), 'preview origin is required');
  let url;
  try { url = new URL(raw); } catch { fail(`invalid preview origin: ${raw}`); }
  assert(url.protocol === 'https:', 'preview origin must use https');
  assert(!url.username && !url.password && !url.search && !url.hash,
    'preview origin cannot contain credentials, query, or fragment');
  assert(url.pathname === '/' || url.pathname === '',
    'preview must own a separate origin; a project-site path is not storage isolation');
  assert(url.origin !== PROD_ORIGIN && url.hostname !== 'celestialfrontier.github.io',
    `preview origin must not be the production origin ${PROD_ORIGIN}`);
  assert(!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'the publish origin must be a remote https hostname, not localhost');
  return url.origin;
}

function validateOutputPath(output) {
  if (fs.existsSync(evidenceRoot)) {
    const stat = fs.lstatSync(evidenceRoot);
    assert(stat.isDirectory() && !stat.isSymbolicLink(),
      `preview evidence root is not a real directory: ${evidenceRoot}`);
  } else fs.mkdirSync(evidenceRoot, { recursive: true });
  const root = fs.realpathSync(evidenceRoot);
  assert(path.dirname(root) === fs.realpathSync(appDir) && path.basename(root) === 'smoke',
    `preview evidence root escaped the game app: ${root}`);
  const resolved = path.resolve(output);
  assert(path.dirname(resolved) === root, `preview output must be a direct child of ${root}`);
  assert(path.basename(resolved).startsWith('dev-preview-'),
    'preview output directory must start with dev-preview-');
  assert(!fs.existsSync(resolved), `refusing to overwrite existing preview package: ${resolved}`);
  return resolved;
}

function yamlIndent(line, where) {
  const whitespace = (line.match(/^[ \t]*/) || [''])[0];
  assert(!whitespace.includes('\t'), `${where}: tabs make workflow scope ambiguous`);
  return whitespace.length;
}

function workflowBlockEnd(lines, start, indent) {
  for (let index = start + 1; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed && !trimmed.startsWith('#') && yamlIndent(lines[index], `workflow line ${index + 1}`) <= indent) {
      return index;
    }
  }
  return lines.length;
}

export function assertPreviewWorkflowBrowserContract(source, label = 'preview workflow') {
  assert(typeof source === 'string' && source.trim(), `${label}: workflow source is empty`);
  const lines = source.split(/\r?\n/);
  const smokeLines = lines.flatMap((line, index) =>
    /\bnpm\s+run\s+preview:smoke\b/.test(line) ? [index] : []);
  assert(smokeLines.length === 1,
    `${label}: expected exactly one npm run preview:smoke step, found ${smokeLines.length}`);
  const smokeLine = smokeLines[0];

  const jobsLines = lines.flatMap((line, index) => line.trim() === 'jobs:' ? [index] : []);
  assert(jobsLines.length === 1, `${label}: expected one jobs mapping, found ${jobsLines.length}`);
  const jobsLine = jobsLines[0];
  const jobsIndent = yamlIndent(lines[jobsLine], `${label} jobs`);
  const jobsEnd = workflowBlockEnd(lines, jobsLine, jobsIndent);
  assert(smokeLine > jobsLine && smokeLine < jobsEnd,
    `${label}: preview smoke command is not inside jobs`);

  const jobIndent = jobsIndent + 2;
  const jobHeaders = [];
  for (let index = jobsLine + 1; index < jobsEnd; index++) {
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) === jobIndent
      && /^[A-Za-z0-9_-]+:\s*(?:#.*)?$/.test(lines[index].trim())) jobHeaders.push(index);
  }
  const owningJobs = jobHeaders.filter((start, position) => {
    const end = jobHeaders[position + 1] ?? jobsEnd;
    return smokeLine > start && smokeLine < end;
  });
  assert(owningJobs.length === 1, `${label}: preview smoke job ownership is ambiguous`);
  const jobLine = owningJobs[0];
  const jobPosition = jobHeaders.indexOf(jobLine);
  const jobEnd = jobHeaders[jobPosition + 1] ?? jobsEnd;
  const jobName = lines[jobLine].trim().slice(0, -1);

  const directJobEnv = [];
  const directSteps = [];
  for (let index = jobLine + 1; index < jobEnd; index++) {
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) !== jobIndent + 2) continue;
    if (lines[index].trim() === 'env:') directJobEnv.push(index);
    if (lines[index].trim() === 'steps:') directSteps.push(index);
  }
  assert(directJobEnv.length === 1,
    `${label}: job ${jobName} lacks one exact job-level browser environment`);
  const jobEnvLine = directJobEnv[0];
  const jobEnvEnd = workflowBlockEnd(lines, jobEnvLine, jobIndent + 2);
  const jobBrowserPins = [];
  for (let index = jobEnvLine + 1; index < jobEnvEnd; index++) {
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) === jobIndent + 4
      && /^CF_BROWSER\s*:/.test(lines[index].trim())) jobBrowserPins.push(lines[index].trim());
  }
  assert(jobBrowserPins.length === 1 && jobBrowserPins[0] === `CF_BROWSER: ${CI_PREVIEW_BROWSER}`,
    `${label}: job ${jobName} lacks exact job-level CF_BROWSER: ${CI_PREVIEW_BROWSER}`);

  assert(directSteps.length === 1, `${label}: job ${jobName} must own one steps sequence`);
  const stepsLine = directSteps[0];
  const stepsEnd = Math.min(workflowBlockEnd(lines, stepsLine, jobIndent + 2), jobEnd);
  assert(smokeLine > stepsLine && smokeLine < stepsEnd,
    `${label}: preview smoke command is not inside job ${jobName}'s steps`);
  const stepIndent = jobIndent + 4;
  const stepHeaders = [];
  for (let index = stepsLine + 1; index < stepsEnd; index++) {
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) === stepIndent
      && lines[index].trim().startsWith('- ')) stepHeaders.push(index);
  }
  const owningSteps = stepHeaders.filter((start, position) => {
    const end = stepHeaders[position + 1] ?? stepsEnd;
    return smokeLine >= start && smokeLine < end;
  });
  assert(owningSteps.length === 1, `${label}: preview smoke step ownership is ambiguous`);
  const stepLine = owningSteps[0];
  const stepPosition = stepHeaders.indexOf(stepLine);
  const stepEnd = stepHeaders[stepPosition + 1] ?? stepsEnd;

  const stepEnvLines = [];
  for (let index = stepLine + 1; index < stepEnd; index++) {
    const trimmed = lines[index].trim();
    assert(!(/\bCF_BROWSER\b/.test(trimmed) && !/^CF_BROWSER\s*:/.test(trimmed)),
      `${label}: preview smoke step reassigns CF_BROWSER in its command`);
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) === stepIndent + 2
      && trimmed === 'env:') stepEnvLines.push(index);
  }
  assert(stepEnvLines.length <= 1, `${label}: preview smoke step has ambiguous env mappings`);
  if (stepEnvLines.length === 1) {
    const stepEnvLine = stepEnvLines[0];
    const stepEnvEnd = Math.min(workflowBlockEnd(lines, stepEnvLine, stepIndent + 2), stepEnd);
    const stepBrowserPins = [];
    for (let index = stepEnvLine + 1; index < stepEnvEnd; index++) {
      if (yamlIndent(lines[index], `${label} line ${index + 1}`) === stepIndent + 4
        && /^CF_BROWSER\s*:/.test(lines[index].trim())) stepBrowserPins.push(lines[index].trim());
    }
    assert(stepBrowserPins.length <= 1, `${label}: preview smoke step has ambiguous CF_BROWSER pins`);
    if (stepBrowserPins.length === 1) {
      assert(stepBrowserPins[0] === `CF_BROWSER: ${CI_PREVIEW_BROWSER}`,
        `${label}: preview smoke step conflicts with the job browser pin`);
    }
  }
  return Object.freeze({ job: jobName, browser: CI_PREVIEW_BROWSER, smokeLine: smokeLine + 1 });
}

function transformHtml(source, {
  expectedOrigin, entryName, commit, shortCommit, clean, publishable,
  developmentVersion, buildId,
}) {
  assert((source.match(/<head(?:\s[^>]*)?>/g) || []).length === 1,
    `${entryName}: expected exactly one <head>`);
  assert((source.match(/<body(?:\s[^>]*)?>/g) || []).length === 1,
    `${entryName}: expected exactly one <body>`);
  const scripts = [...source.matchAll(/<script type="module"([^>]*) src="([^"]+)"><\/script>/g)];
  assert(scripts.length === 1, `${entryName}: expected exactly one built module entry, found ${scripts.length}`);
  const rawEntry = scripts[0][2];
  const entry = `./${rawEntry.replace(/^\/+/, '')}`;
  assert(!entry.includes('..') && /^\.\/[A-Za-z0-9_./-]+\.js$/.test(entry),
    `${entryName}: built module entry is unsafe: ${rawEntry}`);
  const runtime = {
    schema: SCHEMA,
    expectedOrigin,
    productionOrigin: PROD_ORIGIN,
    sourceCommit: commit,
    shortCommit,
    sourceState: clean ? 'committed' : 'dirty-local-only',
    publishable,
    developmentVersion,
    buildId,
    channel: DEVELOPMENT_CHANNEL,
    entry,
  };
  const loader = `<script type="module" data-cf-dev-loader>
const info=Object.freeze(${scriptJson(runtime)});
window.__CF_DEV_PREVIEW__=info;
const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
if((location.origin===info.expectedOrigin&&info.publishable)||local){
  import(info.entry).catch((error)=>{ console.error('CF DEV PREVIEW entry failed',error); });
}else{
  document.documentElement.dataset.cfPreviewBlocked='true';
  const block=()=>{ document.body.innerHTML='<main style="max-width:52rem;margin:12vh auto;padding:2rem;font:16px/1.5 system-ui;color:#fff;background:#270d16;border:2px solid #ff6b8b;border-radius:16px"><h1>Development preview blocked</h1><p>This build is bound to a different test origin. It did not start, so it cannot read or write game storage here.</p></main>'; };
  document.readyState==='loading'?addEventListener('DOMContentLoaded',block,{once:true}):block();
}
</script>`;
  const robots = '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />';
  let html = source.replace(scripts[0][0], loader);
  html = html.replace(/\b(src|href)="\/([^"]+)"/g, '$1="./$2"');
  html = html.replace(/<\/head>/, `${robots}\n</head>`);
  assert(!/<script type="module"[^>]*\ssrc=/.test(html), `${entryName}: unguarded module entry survived`);
  assert(!html.includes('cf-dev-preview-banner')
    && !html.includes('cf-development-site-banner')
    && !html.includes('data-cf-dev-banner-style'),
    `${entryName}: a visible development corner badge survived packaging`);
  return html;
}

function fileInventory(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const absolute = path.join(dir, name);
      const stat = fs.lstatSync(absolute);
      assert(!stat.isSymbolicLink(), `preview package contains a symbolic link: ${absolute}`);
      if (stat.isDirectory()) walk(absolute);
      else if (stat.isFile() && name !== 'preview.json') {
        const bytes = fs.readFileSync(absolute);
        out.push({ path: portable(path.relative(root, absolute)), bytes: stat.size, sha256: sha256Bytes(bytes) });
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function aggregateInventory(files) {
  return sha256Bytes(files.map((file) => `${file.path}\0${file.bytes}\0${file.sha256}\n`).join(''));
}

export function verifyPackage(root) {
  const resolved = fs.realpathSync(root);
  const manifestPath = path.join(resolved, 'preview.json');
  assert(fs.existsSync(manifestPath), 'preview.json is missing');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.schema === SCHEMA, `unsupported preview schema: ${String(manifest.schema)}`);
  assert(manifest.kind === 'human-development-preview', 'preview manifest kind drifted');
  assert(validatePreviewOrigin(manifest.expectedOrigin) === manifest.expectedOrigin,
    'preview manifest origin is not canonical');
  assert(manifest.productionOrigin === PROD_ORIGIN, 'preview manifest production-origin guard drifted');
  assert(typeof manifest.publishable === 'boolean', 'preview manifest lacks an exact publishable state');
  assert(/^[0-9a-f]{40}$/.test(manifest.source?.commit || ''), 'preview manifest lacks a full source commit');
  assert(manifest.source?.shortCommit === manifest.source.commit.slice(0, 12),
    'preview manifest short/full commit binding drifted');
  assert(typeof manifest.source?.branch === 'string'
    && /^[A-Za-z0-9._/-]+$/.test(manifest.source.branch)
    && !manifest.source.branch.split('/').includes('..'),
  'preview manifest source branch is invalid');
  assert(manifest.development?.versionSchema === VERSION_SCHEMA,
    'preview manifest v2 version schema drifted');
  assert(typeof manifest.development?.version === 'string'
    && /^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.development.version),
  'preview manifest lacks a valid development version');
  assert(manifest.development?.build === `develop-${manifest.source.shortCommit}`,
    'preview manifest build/full commit binding drifted');
  assert(manifest.development?.channel === DEVELOPMENT_CHANNEL,
    'preview manifest channel drifted');
  assert(['committed', 'dirty-local-only'].includes(manifest.source?.state),
    'preview manifest source state is invalid');
  assert(manifest.source?.buildInput && typeof manifest.source.buildInput === 'object',
    'preview manifest lacks build-input provenance');
  if (manifest.source.state === 'committed') {
    assert(manifest.source.buildInput.mode === 'git-archive-exact-commit'
      && manifest.source.buildInput.subtree === 'port/v2'
      && manifest.source.buildInput.workingTreeRead === false
      && /^[0-9a-f]{40}$/.test(manifest.source.buildInput.tree || ''),
    'committed preview was not built from an exact port/v2 commit snapshot');
    assert(Array.isArray(manifest.source.buildInput.externalInputs)
      && manifest.source.buildInput.externalInputs.length === 1
      && manifest.source.buildInput.externalInputs[0]?.path === 'port/baseline-v1.8.9/content-registry.json'
      && /^[0-9a-f]{40}$/.test(manifest.source.buildInput.externalInputs[0]?.blob || ''),
    'committed preview lacks its exact external content-registry input');
  } else {
    assert(manifest.source.buildInput.mode === 'working-tree-dirty-local-only'
      && manifest.source.buildInput.workingTreeRead === true
      && manifest.publishable === false,
    'dirty preview build-input provenance is not local-only');
  }
  assert(!manifest.publishable || (manifest.source.state === 'committed'
    && Array.isArray(manifest.source.dirtyEntries) && manifest.source.dirtyEntries.length === 0),
  'a remotely publishable preview is not bound to a clean committed source');
  assert(/^[0-9a-f]{64}$/.test(manifest.build?.lockfileSha256 || ''),
    'preview manifest lacks its exact dependency-lock hash');
  const actual = fileInventory(resolved);
  assert(JSON.stringify(actual) === JSON.stringify(manifest.files), 'preview file inventory/hash mismatch');
  assert(aggregateInventory(actual) === manifest.contentSha256, 'preview aggregate hash mismatch');
  const htmlEntries = actual.filter((file) => file.path.endsWith('.html')).map((file) => file.path);
  assert(htmlEntries.includes('index.html'), 'preview package has no index.html');
  for (const entry of htmlEntries) {
    const html = fs.readFileSync(path.join(resolved, ...entry.split('/')), 'utf8');
    assert(html.includes('data-cf-dev-loader'), `${entry}: guarded loader is missing`);
    assert(!html.includes('cf-dev-preview-banner')
      && !html.includes('cf-development-site-banner')
      && !html.includes('data-cf-dev-banner-style'),
      `${entry}: development identity must not appear as a visible corner badge`);
    assert(!/<script type="module"[^>]*\ssrc=/.test(html), `${entry}: unguarded module entry survived`);
    assert(html.includes(`"expectedOrigin":${JSON.stringify(manifest.expectedOrigin)}`)
      && html.includes(`"sourceCommit":${JSON.stringify(manifest.source.commit)}`)
      && html.includes(`"publishable":${String(manifest.publishable)}`)
      && html.includes(`"developmentVersion":${JSON.stringify(manifest.development.version)}`)
      && html.includes(`"buildId":${JSON.stringify(manifest.development.build)}`)
      && html.includes(`"channel":${JSON.stringify(manifest.development.channel)}`),
    `${entry}: runtime origin/commit/publication guard disagrees with preview.json`);
    assert(html.includes('noindex,nofollow,noarchive,nosnippet'), `${entry}: robots meta contract is missing`);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      assert(!match[1].startsWith('/'), `${entry}: root-relative asset cannot survive a custom/static host: ${match[1]}`);
    }
  }
  assert(fs.readFileSync(path.join(resolved, 'robots.txt'), 'utf8') === 'User-agent: *\nDisallow: /\n',
    'robots.txt does not disallow indexing');
  const siteVersion = JSON.parse(fs.readFileSync(path.join(resolved, 'version.json'), 'utf8'));
  assert(siteVersion.schema === SITE_VERSION_SCHEMA
    && siteVersion.v === manifest.development.version
    && siteVersion.version === manifest.development.version
    && siteVersion.build === manifest.development.build
    && siteVersion.sourceCommit === manifest.source.commit
    && siteVersion.sourceBranch === manifest.source.branch
    && siteVersion.channel === manifest.development.channel,
  'version.json does not exactly bind version/build/commit/branch/channel to preview.json');
  return manifest;
}

function parseArgs(argv) {
  const args = { allowDirty: false, approved: false, origin: null, output: null, verify: null, selftest: false };
  for (const token of argv) {
    if (token === '--allow-dirty') args.allowDirty = true;
    else if (token === '--approved-publication-candidate') args.approved = true;
    else if (token === '--selftest') args.selftest = true;
    else if (token.startsWith('--origin=')) args.origin = token.slice('--origin='.length);
    else if (token.startsWith('--output=')) args.output = token.slice('--output='.length);
    else if (token.startsWith('--verify=')) args.verify = token.slice('--verify='.length);
    else fail(`unknown argument: ${token}`);
  }
  return args;
}

function packagePreviewLocked(args) {
  const expectedOrigin = validatePreviewOrigin(args.origin || DEFAULT_ORIGIN);
  const commit = git(['rev-parse', 'HEAD']);
  assert(/^[0-9a-f]{40}$/.test(commit), 'git did not return a full source commit');
  const shortCommit = commit.slice(0, 12);
  const branch = process.env.CF_PUBLISH_SOURCE_BRANCH
    || process.env.GITHUB_HEAD_REF || git(['branch', '--show-current'])
    || process.env.GITHUB_REF_NAME || 'detached';
  assert(/^[A-Za-z0-9._/-]+$/.test(branch) && !branch.split('/').includes('..'),
    `unsafe preview source branch identity: ${branch}`);
  const dirtyLines = git(['status', '--porcelain=v1', '--untracked-files=all'])
    .split(/\r?\n/).filter(Boolean);
  const clean = dirtyLines.length === 0;
  assert(!(args.allowDirty && args.approved),
    '--allow-dirty cannot create an approved publication candidate');
  assert(clean || args.allowDirty,
    `preview publication requires a clean committed v2 source; dirty entries: ${dirtyLines.join(' | ')}`);
  const publishable = clean && args.approved;
  const sourceTree = clean ? git(['rev-parse', `${commit}:port/v2`]) : null;
  const contentRegistryBlob = clean
    ? git(['rev-parse', `${commit}:port/baseline-v1.8.9/content-registry.json`]) : null;
  if (clean) assert(/^[0-9a-f]{40}$/.test(sourceTree), 'git did not return the exact port/v2 tree');
  if (clean) assert(/^[0-9a-f]{40}$/.test(contentRegistryBlob),
    'git did not return the exact content-registry blob');

  const runTag = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || '1'}`
    : new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const output = validateOutputPath(args.output || path.join(evidenceRoot, `dev-preview-${shortCommit}-${runTag}`));

  let snapshot = null;
  let buildV2Root = v2Root;
  let buildAppDir = appDir;
  let buildDistDir = distDir;
  let viteVersion = null;
  let lockfileSha256 = null;
  let developmentVersion = null;
  try {
    if (clean) {
      snapshot = exactCommitSnapshot(repoRoot, commit, [
        'port/v2', 'port/baseline-v1.8.9/content-registry.json',
      ], 'port/v2');
      buildV2Root = snapshot.sourceRoot;
      attachInstalledDependencies(buildV2Root);
      buildAppDir = path.join(buildV2Root, 'apps', 'game');
      buildDistDir = path.join(buildAppDir, 'dist');
    }
    developmentVersion = readDevelopmentVersion(buildV2Root).version;
    viteVersion = JSON.parse(fs.readFileSync(path.join(buildAppDir, 'package.json'), 'utf8')).devDependencies.vite;
    lockfileSha256 = sha256Bytes(fs.readFileSync(path.join(buildV2Root, 'package-lock.json')));
    execSync('npx vite build', { cwd: buildAppDir, stdio: 'inherit' });
    assert(fs.existsSync(path.join(buildDistDir, 'index.html')), 'vite build did not produce index.html');
    fs.cpSync(buildDistDir, output, { recursive: true, errorOnExist: true, force: false });
  } finally {
    if (snapshot) snapshot.cleanup();
  }

  assert(git(['rev-parse', 'HEAD']) === commit,
    'repository HEAD changed while the development preview was being packaged');
  if (clean) {
    const finalDirty = git(['status', '--porcelain=v1', '--untracked-files=all'])
      .split(/\r?\n/).filter(Boolean);
    assert(finalDirty.length === 0,
      `clean preview source changed while packaging: ${finalDirty.join(' | ')}`);
  }

  const htmlFiles = fs.readdirSync(output).filter((name) => name.endsWith('.html')).sort();
  assert(htmlFiles.includes('index.html'), 'preview build has no index.html');
  assert(developmentVersion, 'preview build did not resolve its shared v2 version');
  const buildId = `develop-${shortCommit}`;
  for (const name of htmlFiles) {
    const file = path.join(output, name);
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, transformHtml(source, {
      expectedOrigin, entryName: name, commit, shortCommit, clean, publishable,
      developmentVersion, buildId,
    }));
  }
  fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  fs.writeFileSync(path.join(output, 'version.json'), `${JSON.stringify({
    schema: SITE_VERSION_SCHEMA,
    v: developmentVersion,
    version: developmentVersion,
    build: buildId,
    sourceCommit: commit,
    sourceBranch: branch,
    channel: DEVELOPMENT_CHANNEL,
  }, null, 2)}\n`);

  const files = fileInventory(output);
  const manifest = {
    schema: SCHEMA,
    kind: 'human-development-preview',
    generatedAt: new Date().toISOString(),
    expectedOrigin,
    productionOrigin: PROD_ORIGIN,
    publishable,
    development: {
      versionSchema: VERSION_SCHEMA,
      version: developmentVersion,
      build: buildId,
      channel: DEVELOPMENT_CHANNEL,
    },
    source: {
      commit,
      shortCommit,
      branch,
      state: clean ? 'committed' : 'dirty-local-only',
      dirtyEntries: clean ? [] : dirtyLines,
      buildInput: clean ? {
        mode: 'git-archive-exact-commit',
        subtree: 'port/v2',
        tree: sourceTree,
        externalInputs: [{
          path: 'port/baseline-v1.8.9/content-registry.json',
          blob: contentRegistryBlob,
        }],
        workingTreeRead: false,
      } : {
        mode: 'working-tree-dirty-local-only',
        subtree: 'port/v2',
        tree: null,
        externalInputs: [],
        workingTreeRead: true,
      },
    },
    build: {
      command: clean
        ? 'npx vite build in isolated git-archive snapshot of exact source commit (root-relative HTML asset references rewritten and verified relative)'
        : 'npx vite build from dirty working tree for nonpublishable local diagnosis only (root-relative HTML asset references rewritten and verified relative)',
      node: process.version,
      vite: viteVersion,
      lockfileSha256,
      platform: process.platform,
      architecture: process.arch,
      githubRunId: process.env.GITHUB_RUN_ID || null,
      githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
    },
    storage: {
      isolation: 'exact-origin',
      indexedDbName: 'cf-v2-slice',
      localStorageKeys: ['cf_v2_import_original'],
      contract: 'The guarded app runs only on expectedOrigin or loopback. Production and preview therefore cannot share browser storage.',
    },
    indexing: 'noindex,nofollow,noarchive,nosnippet plus robots.txt Disallow: /',
    publication: publishable
      ? 'approved-candidate-awaiting-separate-host-publication'
      : 'review-artifact-not-authorized-for-remote-publication',
    files,
    contentSha256: aggregateInventory(files),
  };
  fs.writeFileSync(path.join(output, 'preview.json'), JSON.stringify(manifest, null, 2) + '\n');
  verifyPackage(output);
  console.log(`DEV PREVIEW PACKAGE: ${publishable ? 'APPROVED CANDIDATE' : clean ? 'REVIEW ARTIFACT' : 'LOCAL ONLY'} — ${output}`);
  console.log(`  source ${commit} (${branch})`);
  console.log(`  origin ${expectedOrigin}`);
  console.log(`  content ${manifest.contentSha256}`);
  return output;
}

function packagePreview(args) {
  const releaseWorkspaceLock = acquireWorkspaceLock('development preview package');
  try { return packagePreviewLocked(args); }
  finally { releaseWorkspaceLock(); }
}

function expectRejected(label, work, pattern) {
  let error = null;
  try { work(); } catch (caught) { error = caught; }
  assert(error, `SELFTEST ${label}: injected defect was accepted`);
  assert(pattern.test(error.message), `SELFTEST ${label}: wrong rejection (${error.message})`);
}

function runSelftest() {
  const validWorkflow = [
    'name: fixture',
    'jobs:',
    '  battery:',
    '    env:',
    `      CF_BROWSER: ${CI_PREVIEW_BROWSER}`,
    '    steps:',
    '      - name: package preview',
    '        run: |',
    '          npm run preview:package',
    '          npm run preview:smoke -- --root=fixture',
  ].join('\n');
  assertPreviewWorkflowBrowserContract(validWorkflow, 'SELFTEST valid job-level pin');
  const previousStepOnly = [
    'name: fixture',
    'jobs:',
    '  battery:',
    '    steps:',
    '      - name: prior browser gate',
    '        env:',
    `          CF_BROWSER: ${CI_PREVIEW_BROWSER}`,
    '        run: npm run glassmatrix',
    '      - name: package preview',
    '        run: npm run preview:smoke -- --root=fixture',
  ].join('\n');
  expectRejected('previous-step-only browser pin',
    () => assertPreviewWorkflowBrowserContract(previousStepOnly, 'SELFTEST previous-step-only'),
    /lacks one exact job-level browser environment/);
  const duplicateSmoke = `${validWorkflow}\n      - name: duplicate preview\n        run: npm run preview:smoke -- --root=duplicate\n`;
  expectRejected('duplicate preview smoke',
    () => assertPreviewWorkflowBrowserContract(duplicateSmoke, 'SELFTEST duplicate'),
    /expected exactly one npm run preview:smoke step, found 2/);
  const conflictingStepPin = validWorkflow.replace(
    '      - name: package preview\n',
    '      - name: package preview\n        env:\n          CF_BROWSER: /usr/bin/microsoft-edge\n',
  );
  expectRejected('conflicting preview-step browser pin',
    () => assertPreviewWorkflowBrowserContract(conflictingStepPin, 'SELFTEST conflicting step'),
    /preview smoke step conflicts with the job browser pin/);
  const commandOverride = validWorkflow.replace(
    '          npm run preview:smoke -- --root=fixture',
    '          CF_BROWSER=/usr/bin/microsoft-edge npm run preview:smoke -- --root=fixture',
  );
  expectRejected('preview-step command browser override',
    () => assertPreviewWorkflowBrowserContract(commandOverride, 'SELFTEST command override'),
    /preview smoke step reassigns CF_BROWSER in its command/);
  for (const relative of CONTROLLED_PREVIEW_WORKFLOWS) {
    const contract = assertPreviewWorkflowBrowserContract(
      fs.readFileSync(path.join(repoRoot, relative), 'utf8'), relative,
    );
    assert(contract.browser === CI_PREVIEW_BROWSER,
      `SELFTEST ${relative}: workflow browser contract changed`);
  }

  assert(validatePreviewOrigin(DEFAULT_ORIGIN) === DEFAULT_ORIGIN, 'SELFTEST valid separate origin rejected');
  expectRejected('production origin', () => validatePreviewOrigin(PROD_ORIGIN), /production origin/);
  expectRejected('same-origin project path', () => validatePreviewOrigin(`${PROD_ORIGIN}/dev-preview/`),
    /project-site path/);
  expectRejected('insecure origin', () => validatePreviewOrigin('http://dev-celestialfrontier.github.io'), /https/);
  expectRejected('origin with path', () => validatePreviewOrigin('https://example.test/play/'), /project-site path/);
  expectRejected('output escape', () => validateOutputPath(path.join(fs.realpathSync(os.tmpdir()), 'dev-preview-escape')),
    /direct child/);

  const source = '<!doctype html><html><head><title>x</title><script type="module" crossorigin src="/assets/x.js"></script></head><body><main>x</main></body></html>';
  const transformed = transformHtml(source, {
    expectedOrigin: DEFAULT_ORIGIN,
    entryName: 'index.html',
    commit: 'a'.repeat(40),
    shortCommit: 'a'.repeat(12),
    clean: true,
    publishable: true,
    developmentVersion: '2.0',
    buildId: `develop-${'a'.repeat(12)}`,
  });
  assert(transformed.includes('data-cf-dev-loader')
    && transformed.includes('"developmentVersion":"2.0"')
    && !transformed.includes('cf-dev-preview-banner')
    && !transformed.includes('cf-development-site-banner')
    && !transformed.includes('data-cf-dev-banner-style'),
  'SELFTEST transform omitted the guarded Guide identity or retained a visible corner badge');
  assert(!/<script type="module"[^>]*\ssrc=/.test(transformed),
    'SELFTEST transform left an unguarded module entry');
  const loaderBody = (transformed.match(/<script type="module" data-cf-dev-loader>([\s\S]*?)<\/script>/) || [])[1];
  assert(loaderBody, 'SELFTEST could not recover the guarded module body');
  // Parsing the generated loader is the negative control for malformed
  // injected JavaScript; this does not execute the page or its dynamic import.
  new Function(loaderBody);
  const blockedDocument = {
    documentElement: { dataset: {} },
    readyState: 'complete',
    body: { innerHTML: '' },
  };
  new Function('window', 'location', 'document', 'addEventListener', loaderBody)(
    {}, { origin: PROD_ORIGIN, hostname: 'celestialfrontier.github.io' }, blockedDocument, () => {},
  );
  assert(blockedDocument.documentElement.dataset.cfPreviewBlocked === 'true'
    && /Development preview blocked/.test(blockedDocument.body.innerHTML),
  'SELFTEST production-origin runtime guard did not block before module import');
  const reviewOnly = transformHtml(source, {
    expectedOrigin: DEFAULT_ORIGIN,
    entryName: 'index.html',
    commit: 'b'.repeat(40),
    shortCommit: 'b'.repeat(12),
    clean: true,
    publishable: false,
    developmentVersion: '2.0',
    buildId: `develop-${'b'.repeat(12)}`,
  });
  const reviewLoader = (reviewOnly.match(/<script type="module" data-cf-dev-loader>([\s\S]*?)<\/script>/) || [])[1];
  const reviewDocument = {
    documentElement: { dataset: {} },
    readyState: 'complete',
    body: { innerHTML: '' },
  };
  new Function('window', 'location', 'document', 'addEventListener', reviewLoader)(
    {}, { origin: DEFAULT_ORIGIN, hostname: 'dev-celestialfrontier.github.io' }, reviewDocument, () => {},
  );
  assert(reviewDocument.documentElement.dataset.cfPreviewBlocked === 'true',
    'SELFTEST unapproved review artifact ran remotely on its bound host');

  const snapshotFixturePrefix = `cf-devpreview-archive-selftest-${process.pid}-`;
  const snapshotFixture = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), snapshotFixturePrefix));
  let exactFixture = null;
  try {
    const fixtureRepo = path.join(snapshotFixture, 'repo');
    const fixtureSource = path.join(fixtureRepo, 'fixture');
    fs.mkdirSync(fixtureSource, { recursive: true });
    execFileSync('git', ['init', '--quiet'], { cwd: fixtureRepo, stdio: ['ignore', 'ignore', 'pipe'] });
    fs.writeFileSync(path.join(fixtureSource, 'marker.txt'), 'committed bytes\n');
    execFileSync('git', ['add', '--', 'fixture/marker.txt'], {
      cwd: fixtureRepo, stdio: ['ignore', 'ignore', 'pipe'],
    });
    execFileSync('git', [
      '-c', 'user.name=CF Preview Selftest', '-c', 'user.email=preview-selftest@invalid.example',
      '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture',
    ], { cwd: fixtureRepo, stdio: ['ignore', 'ignore', 'pipe'] });
    const fixtureCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: fixtureRepo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    fs.writeFileSync(path.join(fixtureSource, 'marker.txt'), 'TRANSIENT WORKING-TREE POISON\n');
    exactFixture = exactCommitSnapshot(fixtureRepo, fixtureCommit, ['fixture'], 'fixture',
      `cf-devpreview-head-selftest-${process.pid}-`);
    assert(fs.readFileSync(path.join(exactFixture.sourceRoot, 'marker.txt'), 'utf8') === 'committed bytes\n',
      'SELFTEST exact-commit snapshot captured transient working-tree poison');
  } finally {
    if (exactFixture) exactFixture.cleanup();
    safeTempRemove(snapshotFixture, snapshotFixturePrefix);
  }

  const tempBase = fs.realpathSync(os.tmpdir());
  const fixture = fs.mkdtempSync(path.join(tempBase, `cf-devpreview-selftest-${process.pid}-`));
  try {
    fs.writeFileSync(path.join(fixture, 'index.html'), transformed);
    fs.writeFileSync(path.join(fixture, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    fs.writeFileSync(path.join(fixture, 'version.json'), `${JSON.stringify({
      schema: SITE_VERSION_SCHEMA,
      v: '2.0',
      version: '2.0',
      build: `develop-${'a'.repeat(12)}`,
      sourceCommit: 'a'.repeat(40),
      sourceBranch: 'develop',
      channel: DEVELOPMENT_CHANNEL,
    }, null, 2)}\n`);
    const files = fileInventory(fixture);
    fs.writeFileSync(path.join(fixture, 'preview.json'), JSON.stringify({
      schema: SCHEMA,
      kind: 'human-development-preview',
      expectedOrigin: DEFAULT_ORIGIN,
      productionOrigin: PROD_ORIGIN,
      publishable: true,
      development: {
        versionSchema: VERSION_SCHEMA,
        version: '2.0',
        build: `develop-${'a'.repeat(12)}`,
        channel: DEVELOPMENT_CHANNEL,
      },
      source: {
        commit: 'a'.repeat(40), shortCommit: 'a'.repeat(12), branch: 'develop', state: 'committed', dirtyEntries: [],
        buildInput: {
          mode: 'git-archive-exact-commit', subtree: 'port/v2', tree: 'c'.repeat(40),
          externalInputs: [{
            path: 'port/baseline-v1.8.9/content-registry.json', blob: 'e'.repeat(40),
          }],
          workingTreeRead: false,
        },
      },
      build: { lockfileSha256: 'd'.repeat(64) },
      files,
      contentSha256: aggregateInventory(files),
    }));
    verifyPackage(fixture);
    fs.appendFileSync(path.join(fixture, 'index.html'), '<!-- injected tamper -->');
    expectRejected('content tamper', () => verifyPackage(fixture), /inventory\/hash mismatch/);
  } finally {
    const resolved = path.resolve(fixture);
    assert(path.dirname(resolved) === tempBase && path.basename(resolved).startsWith(`cf-devpreview-selftest-${process.pid}-`),
      `SELFTEST refusing unsafe fixture cleanup: ${resolved}`);
    fs.rmSync(resolved, { recursive: true });
  }
  console.log('DEV PREVIEW SELFTEST: PASS');
  console.log('  workflow browser provenance: exact job-level Chrome pin in all controlled workflows');
  console.log('  previous-step-only/conflicting/command-override/duplicate preview-smoke controls: rejected');
  console.log('  production/same-origin/insecure/path origins: rejected');
  console.log('  output outside the owned ignored evidence root: rejected');
  console.log('  unapproved review artifact: remote execution rejected');
  console.log('  transient working-tree poison: excluded from exact-commit snapshot');
  console.log('  module entry: runtime-guarded; v2/full-commit identity reserved for Guide; no corner badge');
  console.log('  content tamper: rejected');
}

const IS_MAIN = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (IS_MAIN) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.selftest) {
      assert(!args.verify && !args.origin && !args.output && !args.allowDirty && !args.approved,
        '--selftest cannot be combined with packaging arguments');
      runSelftest();
    } else if (args.verify) {
      assert(!args.origin && !args.output && !args.allowDirty && !args.approved,
        '--verify cannot be combined with packaging arguments');
      const manifest = verifyPackage(args.verify);
      console.log(`DEV PREVIEW VERIFY: PASS — ${manifest.source.commit}`);
      console.log(`  origin ${manifest.expectedOrigin}`);
      console.log(`  content ${manifest.contentSha256}`);
      console.log(`  publishable ${String(manifest.publishable)}`);
    } else {
      packagePreview(args);
    }
  } catch (error) {
    console.error(`DEV PREVIEW: FAIL — ${error.message}`);
    process.exitCode = 1;
  }
}
