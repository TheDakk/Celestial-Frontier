#!/usr/bin/env node
'use strict';

/* Publishes the checked-out, tested root HTML to exactly one Pages user-site.
 * This tool is intentionally usable only after the branch-to-site workflow has
 * selected a known commit and injected the matching one-repository deploy key. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
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
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();

function count(text, needle) { return text.split(needle).length - 1; }
function replaceOnce(text, needle, replacement, label) {
  if (count(text, needle) !== 1) fail(`${label} must appear exactly once`);
  return text.replace(needle, replacement);
}

function packageFiles(html, channelName, sourceCommit) {
  const channel = channels[channelName];
  if (!channel) fail(`unknown channel ${channelName}`);
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) fail('source commit must be a full SHA');
  const build = channel.development ? `develop-${sourceCommit.slice(0, 12)}` : sourceCommit.slice(0, 12);
  let page = replaceOnce(html, "const BUILD_ID='dev';", `const BUILD_ID='${build}';`, 'BUILD_ID placeholder');
  const files = {
    'index.html': page,
    'celestial-frontier.html': page,
    'version.json': `${JSON.stringify({ v: (page.match(/const GAME_VERSION='([^']+)'/) || [])[1], build, sourceCommit, sourceBranch: channel.branch, channel: channelName }, null, 2)}\n`,
  };
  if (channel.development) {
    page = replaceOnce(page, '</head>', '  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">\n  <style id="cf-development-site-banner">#cf-development-site-banner{position:fixed;z-index:2147483647;top:0;right:0;margin:8px;padding:5px 8px;border:1px solid #7fe7ff;border-radius:6px;background:#04121ee8;color:#bff6ff;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;pointer-events:none}</style>\n</head>', 'head closing tag');
    page = replaceOnce(page, '</body>', `<div id="cf-development-site-banner" aria-label="Development build ${sourceCommit}">DEV · ${sourceCommit.slice(0, 12)}</div>\n</body>`, 'body closing tag');
    files['index.html'] = page;
    files['celestial-frontier.html'] = page;
    files['robots.txt'] = 'User-agent: *\nDisallow: /\n';
  }
  return files;
}

function assertSourceIdentity(channelName, expectedBranch, expectedCommit, actualCommit) {
  const channel = channels[channelName];
  if (!channel) fail(`unknown channel ${channelName}`);
  if (expectedBranch !== channel.branch) fail(`channel ${channelName} accepts only ${channel.branch}, received ${expectedBranch || '(unset)'}`);
  if (!/^[0-9a-f]{40}$/.test(expectedCommit)) fail('workflow source commit must be a full SHA');
  if (actualCommit !== expectedCommit) fail(`checked-out commit ${actualCommit} did not match workflow commit ${expectedCommit}`);
}

function selftest() {
  const fixture = "<html><head></head><body><script>const GAME_VERSION='1.8.9';const BUILD_ID='dev';</script></body></html>";
  const sha = '0123456789abcdef0123456789abcdef01234567';
  const production = packageFiles(fixture, 'production', sha);
  const development = packageFiles(fixture, 'development', sha);
  if (production['index.html'].includes('cf-development-site-banner') || production['robots.txt']) fail('production selftest leaked development markers');
  if (!development['index.html'].includes('DEV · 0123456789ab') || !development['index.html'].includes('noindex,nofollow') || development['robots.txt'] !== 'User-agent: *\nDisallow: /\n') fail('development selftest omitted isolation markers');
  let rejected = false;
  try { packageFiles(fixture.replace("const BUILD_ID='dev';", ''), 'production', sha); } catch { rejected = true; }
  if (!rejected) fail('selftest did not reject a missing BUILD_ID placeholder');
  rejected = false;
  try { assertSourceIdentity('development', 'main', sha, sha); } catch { rejected = true; }
  if (!rejected) fail('selftest did not reject a cross-channel branch');
  console.log('branch-site publisher selftest PASS');
}

function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const channelIndex = process.argv.indexOf('--channel');
  const channelName = channelIndex >= 0 ? process.argv[channelIndex + 1] : '';
  const channel = channels[channelName];
  if (!channel) fail('pass --channel production or --channel development');
  const expectedBranch = process.env.CF_PUBLISH_SOURCE_BRANCH;
  const expectedCommit = process.env.CF_PUBLISH_SOURCE_SHA;
  const actualCommit = run('git', ['rev-parse', 'HEAD']);
  assertSourceIdentity(channelName, expectedBranch, expectedCommit, actualCommit);
  if (run('git', ['status', '--porcelain'])) fail('source checkout is dirty');
  const html = fs.readFileSync(path.join(root, 'celestial-frontier.html'), 'utf8');
  const files = packageFiles(html, channelName, actualCommit);
  const site = fs.mkdtempSync(path.join(os.tmpdir(), `cf-${channelName}-pages-`));
  try {
    run('git', ['clone', '--depth=1', channel.repo, site], root);
    run('git', ['checkout', '-B', 'main'], site);
    for (const [name, contents] of Object.entries(files)) fs.writeFileSync(path.join(site, name), contents);
    run('git', ['add', '--', ...Object.keys(files)], site);
    if (!run('git', ['status', '--porcelain'], site)) {
      console.log(`${channelName} site already matches ${actualCommit}`);
      return;
    }
    run('git', ['config', 'user.name', 'Celestial Frontier Pages Publisher'], site);
    run('git', ['config', 'user.email', 'pages-publisher@users.noreply.github.com'], site);
    run('git', ['commit', '-m', `Publish ${channelName} build ${actualCommit.slice(0, 12)}`], site);
    run('git', ['push', 'origin', 'HEAD:main'], site);
    console.log(`published ${channelName} ${actualCommit} -> ${channel.url}`);
  } finally {
    fs.rmSync(site, { recursive: true, force: true });
  }
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
