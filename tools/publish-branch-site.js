#!/usr/bin/env node
'use strict';

/* Publish one already-tested source commit to its one allowed Pages user-site.
 * Production preserves the legacy root-HTML package. Development accepts only
 * an approved, browser-smoked port/v2 devpreview package whose manifest,
 * version identity, origin guard, and exact-commit inputs all agree. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const DEV_PREVIEW_SCHEMA = 'cf-dev-preview/v3';
const SHARED_VERSION_SCHEMA = 'cf-v2-version/v1';
const SITE_VERSION_SCHEMA = 'cf-development-site-version/v1';
const channels = Object.freeze({
  production: Object.freeze({
    branch: 'main',
    repo: 'git@github.com:CelestialFrontier/celestialfrontier.github.io.git',
    url: 'https://celestialfrontier.github.io/',
    development: false,
  }),
  development: Object.freeze({
    branch: 'develop',
    repo: 'git@github.com:Dev-CelestialFrontier/dev-celestialfrontier.github.io.git',
    url: 'https://dev-celestialfrontier.github.io/',
    development: true,
  }),
});

const fail = (message) => { throw new Error(`BRANCH SITE PUBLISH ABORTED — ${message}`); };
const run = (command, args, cwd = root) => execFileSync(command, args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

function count(text, needle) { return text.split(needle).length - 1; }
function replaceOnce(text, needle, replacement, label) {
  if (count(text, needle) !== 1) fail(`${label} must appear exactly once`);
  return text.replace(needle, replacement);
}

function packageProductionFiles(html, sourceCommit) {
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) fail('source commit must be a full SHA');
  const channel = channels.production;
  const build = sourceCommit.slice(0, 12);
  const page = replaceOnce(html, "const BUILD_ID='dev';", `const BUILD_ID='${build}';`, 'BUILD_ID placeholder');
  return {
    'index.html': page,
    'celestial-frontier.html': page,
    'version.json': `${JSON.stringify({
      v: (page.match(/const GAME_VERSION='([^']+)'/) || [])[1],
      build,
      sourceCommit,
      sourceBranch: channel.branch,
      channel: 'production',
    }, null, 2)}\n`,
  };
}

function assertSourceIdentity(channelName, expectedBranch, expectedCommit, actualCommit) {
  const channel = channels[channelName];
  if (!channel) fail(`unknown channel ${channelName}`);
  if (expectedBranch !== channel.branch) fail(`channel ${channelName} accepts only ${channel.branch}, received ${expectedBranch || '(unset)'}`);
  if (!/^[0-9a-f]{40}$/.test(expectedCommit)) fail('workflow source commit must be a full SHA');
  if (actualCommit !== expectedCommit) fail(`checked-out commit ${actualCommit} did not match workflow commit ${expectedCommit}`);
}

function readJson(file, label) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail(`${label} is not readable JSON (${error.message})`); }
}

function assertDevelopmentIdentity(manifest, siteVersion, expected) {
  const channel = channels.development;
  const expectedOrigin = channel.url.replace(/\/$/, '');
  if (manifest?.schema !== DEV_PREVIEW_SCHEMA) fail(`development package schema must be ${DEV_PREVIEW_SCHEMA}`);
  if (manifest.expectedOrigin !== expectedOrigin || manifest.productionOrigin !== channels.production.url.replace(/\/$/, '')) {
    fail('development package origin/production refusal guard drifted');
  }
  if (manifest.publishable !== true || manifest.publication !== 'approved-candidate-awaiting-separate-host-publication') {
    fail('development package is not an approved publication candidate');
  }
  if (manifest.source?.commit !== expected.sourceCommit
    || manifest.source?.shortCommit !== expected.sourceCommit.slice(0, 12)
    || manifest.source?.branch !== channel.branch
    || manifest.source?.state !== 'committed'
    || !Array.isArray(manifest.source?.dirtyEntries)
    || manifest.source.dirtyEntries.length !== 0) {
    fail('development package source commit/branch/clean-state identity drifted');
  }
  if (manifest.source?.buildInput?.mode !== 'git-archive-exact-commit'
    || manifest.source.buildInput.tree !== expected.sourceTree
    || manifest.source.buildInput.workingTreeRead !== false
    || manifest.source.buildInput.externalInputs?.length !== 1
    || manifest.source.buildInput.externalInputs[0]?.path !== 'port/baseline-v1.8.9/content-registry.json'
    || manifest.source.buildInput.externalInputs[0]?.blob !== expected.registryBlob) {
    fail('development package was not built from the exact checked-out commit inputs');
  }
  const build = `develop-${expected.sourceCommit.slice(0, 12)}`;
  if (manifest.development?.versionSchema !== SHARED_VERSION_SCHEMA
    || manifest.development?.version !== expected.sharedVersion
    || manifest.development?.build !== build
    || manifest.development?.channel !== 'development') {
    fail('development preview manifest version/build/channel identity drifted');
  }
  if (siteVersion?.schema !== SITE_VERSION_SCHEMA
    || siteVersion.v !== expected.sharedVersion
    || siteVersion.version !== expected.sharedVersion
    || siteVersion.build !== build
    || siteVersion.sourceCommit !== expected.sourceCommit
    || siteVersion.sourceBranch !== channel.branch
    || siteVersion.channel !== 'development') {
    fail('development version.json version/build/commit/branch/channel identity drifted');
  }
}

function validateDevelopmentPackage(requestedRoot, sourceCommit) {
  if (!requestedRoot) fail('development publication requires --package-root');
  const absolute = path.resolve(requestedRoot);
  if (!fs.existsSync(absolute)) fail(`development package root does not exist: ${absolute}`);
  const requestedStat = fs.lstatSync(absolute);
  if (!requestedStat.isDirectory() || requestedStat.isSymbolicLink()) fail('development package root must be a real directory');
  const packageRoot = fs.realpathSync(absolute);
  if (packageRoot !== absolute) fail('development package root cannot traverse aliases or symbolic links');

  run(process.execPath, [path.join(root, 'port', 'v2', 'tools', 'devpreview.mjs'), `--verify=${packageRoot}`]);
  const manifest = readJson(path.join(packageRoot, 'preview.json'), 'development preview.json');
  const siteVersion = readJson(path.join(packageRoot, 'version.json'), 'development version.json');
  const sharedVersion = readJson(path.join(root, 'port', 'v2', 'version.json'), 'shared port/v2/version.json');
  if (sharedVersion.schema !== SHARED_VERSION_SCHEMA || typeof sharedVersion.version !== 'string') {
    fail(`shared port/v2/version.json must use ${SHARED_VERSION_SCHEMA}`);
  }
  assertDevelopmentIdentity(manifest, siteVersion, {
    sourceCommit,
    sourceTree: run('git', ['rev-parse', `${sourceCommit}:port/v2`]),
    registryBlob: run('git', ['rev-parse', `${sourceCommit}:port/baseline-v1.8.9/content-registry.json`]),
    sharedVersion: sharedVersion.version,
  });
  return { root: packageRoot, manifest };
}

function assertWithin(parent, target, label) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) fail(`${label} escaped ${parent}`);
}

function removeEntryWithoutFollowing(boundary, target) {
  assertWithin(boundary, target, 'temporary site entry');
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || stat.isFile()) fs.unlinkSync(target);
  else if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) removeEntryWithoutFollowing(boundary, path.join(target, name));
    fs.rmdirSync(target);
  } else fail(`temporary site contains unsupported filesystem entry: ${target}`);
}

function clearTemporarySiteWorktree(site) {
  const tempBase = fs.realpathSync(os.tmpdir());
  const resolved = fs.realpathSync(site);
  if (path.dirname(resolved) !== tempBase || !path.basename(resolved).startsWith('cf-development-pages-')) {
    fail(`refusing to clear an unowned development site worktree: ${resolved}`);
  }
  const entries = fs.readdirSync(resolved).filter((name) => name !== '.git');
  for (const name of entries) removeEntryWithoutFollowing(resolved, path.join(resolved, name));
}

function copyPackageContents(packageRoot, site) {
  clearTemporarySiteWorktree(site);
  for (const name of fs.readdirSync(packageRoot)) {
    const from = path.join(packageRoot, name);
    const stat = fs.lstatSync(from);
    if (stat.isSymbolicLink()) fail(`verified package unexpectedly contains a symbolic link: ${from}`);
    fs.cpSync(from, path.join(site, name), { recursive: true, errorOnExist: true, force: false });
  }
}

function safeRemoveTemporaryRoot(target, prefix) {
  const tempBase = fs.realpathSync(os.tmpdir());
  const resolved = path.resolve(target);
  if (path.dirname(resolved) !== tempBase || !path.basename(resolved).startsWith(prefix)) {
    fail(`refusing unsafe temporary cleanup: ${resolved}`);
  }
  if (fs.existsSync(resolved)) removeEntryWithoutFollowing(tempBase, resolved);
}

function selftest() {
  const fixture = "<html><head></head><body><script>const GAME_VERSION='1.8.9';const BUILD_ID='dev';</script></body></html>";
  const sha = '0123456789abcdef0123456789abcdef01234567';
  const production = packageProductionFiles(fixture, sha);
  if (production['index.html'].includes('cf-development-site-banner')
    || production['index.html'].includes('cf-dev-preview-banner')
    || production['robots.txt']) fail('production selftest leaked development markers');
  let rejected = false;
  try { packageProductionFiles(fixture.replace("const BUILD_ID='dev';", ''), sha); } catch { rejected = true; }
  if (!rejected) fail('selftest did not reject a missing production BUILD_ID placeholder');

  const sourceTree = '1'.repeat(40);
  const registryBlob = '2'.repeat(40);
  const build = `develop-${sha.slice(0, 12)}`;
  const manifest = {
    schema: DEV_PREVIEW_SCHEMA,
    expectedOrigin: channels.development.url.replace(/\/$/, ''),
    productionOrigin: channels.production.url.replace(/\/$/, ''),
    publishable: true,
    publication: 'approved-candidate-awaiting-separate-host-publication',
    development: { versionSchema: SHARED_VERSION_SCHEMA, version: '2.0', build, channel: 'development' },
    source: {
      commit: sha, shortCommit: sha.slice(0, 12), branch: 'develop', state: 'committed', dirtyEntries: [],
      buildInput: {
        mode: 'git-archive-exact-commit', tree: sourceTree, workingTreeRead: false,
        externalInputs: [{ path: 'port/baseline-v1.8.9/content-registry.json', blob: registryBlob }],
      },
    },
  };
  const version = {
    schema: SITE_VERSION_SCHEMA, v: '2.0', version: '2.0', build,
    sourceCommit: sha, sourceBranch: 'develop', channel: 'development',
  };
  assertDevelopmentIdentity(manifest, version, { sourceCommit: sha, sourceTree, registryBlob, sharedVersion: '2.0' });
  rejected = false;
  try { assertDevelopmentIdentity({ ...manifest, publishable: false }, version, { sourceCommit: sha, sourceTree, registryBlob, sharedVersion: '2.0' }); }
  catch { rejected = true; }
  if (!rejected) fail('selftest did not reject an unapproved development artifact');
  rejected = false;
  try { assertSourceIdentity('development', 'main', sha, sha); } catch { rejected = true; }
  if (!rejected) fail('selftest did not reject a cross-channel branch');

  const tempBase = fs.realpathSync(os.tmpdir());
  const packageFixture = fs.mkdtempSync(path.join(tempBase, 'cf-publisher-package-selftest-'));
  const siteFixture = fs.mkdtempSync(path.join(tempBase, 'cf-development-pages-selftest-'));
  try {
    fs.writeFileSync(path.join(packageFixture, 'index.html'), 'v2 package\n');
    fs.writeFileSync(path.join(packageFixture, 'version.json'), JSON.stringify(version));
    fs.mkdirSync(path.join(siteFixture, '.git'));
    fs.writeFileSync(path.join(siteFixture, 'celestial-frontier.html'), 'stale legacy build\n');
    fs.mkdirSync(path.join(siteFixture, 'stale-assets'));
    fs.writeFileSync(path.join(siteFixture, 'stale-assets', 'legacy.js'), 'stale\n');
    copyPackageContents(packageFixture, siteFixture);
    if (fs.existsSync(path.join(siteFixture, 'celestial-frontier.html'))
      || fs.existsSync(path.join(siteFixture, 'stale-assets'))
      || fs.readFileSync(path.join(siteFixture, 'index.html'), 'utf8') !== 'v2 package\n') {
      fail('development mirror selftest retained stale legacy bytes');
    }
  } finally {
    safeRemoveTemporaryRoot(packageFixture, 'cf-publisher-package-selftest-');
    safeRemoveTemporaryRoot(siteFixture, 'cf-development-pages-selftest-');
  }
  console.log('branch-site publisher selftest PASS');
}

function parseArgs(argv) {
  const parsed = { channelName: '', packageRoot: '', selftest: false };
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === '--selftest') parsed.selftest = true;
    else if (token === '--channel') parsed.channelName = argv[++index] || '';
    else if (token.startsWith('--channel=')) parsed.channelName = token.slice('--channel='.length);
    else if (token === '--package-root') parsed.packageRoot = argv[++index] || '';
    else if (token.startsWith('--package-root=')) parsed.packageRoot = token.slice('--package-root='.length);
    else fail(`unknown argument ${token}`);
  }
  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selftest) {
    if (args.channelName || args.packageRoot) fail('--selftest cannot be combined with publishing arguments');
    return selftest();
  }
  const channel = channels[args.channelName];
  if (!channel) fail('pass --channel production or --channel development');
  if (!channel.development && args.packageRoot) fail('production publication does not accept a development package root');
  const expectedBranch = process.env.CF_PUBLISH_SOURCE_BRANCH;
  const expectedCommit = process.env.CF_PUBLISH_SOURCE_SHA;
  const actualCommit = run('git', ['rev-parse', 'HEAD']);
  assertSourceIdentity(args.channelName, expectedBranch, expectedCommit, actualCommit);
  if (run('git', ['status', '--porcelain'])) fail('source checkout is dirty');

  const developmentPackage = channel.development
    ? validateDevelopmentPackage(args.packageRoot, actualCommit) : null;
  const productionFiles = channel.development ? null
    : packageProductionFiles(fs.readFileSync(path.join(root, 'celestial-frontier.html'), 'utf8'), actualCommit);
  const site = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), `cf-${args.channelName}-pages-`));
  try {
    run('git', ['clone', '--depth=1', channel.repo, site], root);
    run('git', ['checkout', '-B', 'main'], site);
    if (developmentPackage) copyPackageContents(developmentPackage.root, site);
    else for (const [name, contents] of Object.entries(productionFiles)) fs.writeFileSync(path.join(site, name), contents);
    run('git', ['add', '--all', '--', '.'], site);
    if (!run('git', ['status', '--porcelain'], site)) {
      console.log(`${args.channelName} site already matches ${actualCommit}`);
      return;
    }
    run('git', ['config', 'user.name', 'Celestial Frontier Pages Publisher'], site);
    run('git', ['config', 'user.email', 'pages-publisher@users.noreply.github.com'], site);
    run('git', ['commit', '-m', `Publish ${args.channelName} build ${actualCommit.slice(0, 12)}`], site);
    run('git', ['push', 'origin', 'HEAD:main'], site);
    console.log(`published ${args.channelName} ${actualCommit} -> ${channel.url}`);
  } finally {
    safeRemoveTemporaryRoot(site, `cf-${args.channelName}-pages-`);
  }
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
