import {
  chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ART_BROWSER_PROVENANCE_SCHEMA, attestArtBrowserCdp, closeArtToolServer,
  openArtBrowserCdp, validateArtBrowserVersion, withArtBrowserCdp,
} from '../tools/art-browser-contract.mjs';
import { browserCandidates, findChromiumBrowser } from '../tools/browserpath.mjs';

type ToolContract = { file: string; tool: string; server: boolean };

const contracts: ToolContract[] = [
  { file: 'speciesaudit.mjs', tool: 'speciesaudit', server: true },
  { file: 'artlock.mjs', tool: 'artlock', server: true },
  { file: 'proofsheet.mjs', tool: 'proofsheet', server: true },
  { file: 'speciesexport.mjs', tool: 'speciesexport', server: true },
  { file: 'proportioncheck.mjs', tool: 'proportioncheck', server: true },
  { file: 'conformance.mjs', tool: 'conformance', server: true },
  { file: 'gp71compare.mjs', tool: 'gp71compare', server: false },
];

const sourceOf = (file: string) => readFileSync(
  fileURLToPath(new URL(`../tools/${file}`, import.meta.url)),
  'utf8',
);

function assessWiring(source: string, contract: ToolContract): string[] {
  const errors: string[] = [];
  const browserpathImport = source.match(/import\s*\{([^}]+)\}\s*from '\.\/browserpath\.mjs';/u)?.[1] ?? '';
  for (const symbol of ['assertBrowserLaunchAllowed', 'browserCandidates', 'findChromiumBrowser']) {
    if (!new RegExp(`\\b${symbol}\\b`, 'u').test(browserpathImport)) errors.push(`shared-import:${symbol}`);
  }
  const authorityImport = source.match(/import\s*\{([^}]+)\}\s*from '\.\/art-browser-contract\.mjs';/u)?.[1] ?? '';
  if (!/\bwithArtBrowserCdp\b/u.test(authorityImport)) errors.push('authority-import');
  if (contract.server && !/\bcloseArtToolServer\b/u.test(authorityImport)) {
    errors.push('server-cleanup-import');
  }
  if (/Program Files|Microsoft Edge\.app|Google Chrome\.app|msedge\.exe/u.test(source)) {
    errors.push('hardcoded-browser-path');
  }
  if (/--remote-debugging-port|\/json\/version|new\s+WebSocket\s*\(|\bspawn\s*\(/u.test(source)) {
    errors.push('unowned-endpoint');
  }

  const guard = source.indexOf('assertBrowserLaunchAllowed();');
  const resolve = source.indexOf('const browserFile = findChromiumBrowser(browserCandidates(browserOverride));');
  const owner = source.indexOf('withArtBrowserCdp({');
  const target = source.indexOf("await send('Target.createTarget'");
  if (guard < 0) errors.push('launch-guard');
  if (resolve < 0) errors.push('shared-resolution');
  if (owner < 0) errors.push('owned-launcher');
  if (guard >= 0 && resolve >= 0 && owner >= 0 && !(guard < resolve && resolve < owner)) {
    errors.push('launch-order');
  }
  if (owner < 0 || target < 0 || !(owner < target)) {
    errors.push('owned-cdp-before-evidence');
  }
  if (!source.slice(owner, target).includes(`tool: '${contract.tool}'`)) {
    errors.push('owned-cdp-label');
  }
  if (contract.server && !source.slice(owner, target).includes('cleanup: () => closeArtToolServer(server)')) {
    errors.push('server-cleanup-owner');
  }
  if (source.includes('process.exit(0);')) {
    errors.push('exit-bypasses-cleanup');
  }

  if (!source.includes('--browser=')) errors.push('browser-option');
  if (!source.includes('browserCandidates(browserOverride)')) errors.push('override-authority');
  // Point releases are evidence provenance, never a command-line acceptance baseline.
  if (/['"]--version['"]/u.test(source)) errors.push('point-version-gate');
  return errors;
}

function assessSharedOwner(source: string): string[] {
  const errors: string[] = [];
  if (!/import \{ openChromiumCdp \} from '\.\/browsercdp\.mjs';/u.test(source)) {
    errors.push('owned-launcher-import');
  }
  if (!/openCdp = openChromiumCdp/u.test(source) || !/owned = await openCdp\(\{/u.test(source)) {
    errors.push('owned-launcher-call');
  }
  if (!source.includes('owned.browser.executable === portable(exactExecutable)')) {
    errors.push('executable-owner-crosscheck');
  }
  if (/--remote-debugging-port|\/json\/version|new\s+WebSocket\s*\(|\bspawn\s*\(/u.test(source)) {
    errors.push('parallel-cdp-lifecycle');
  }
  return errors;
}

function assessOwnedLauncherSource(source: string): string[] {
  const errors: string[] = [];
  if (!source.includes("'--remote-debugging-port=0'")) errors.push('browser-owned-port-zero');
  if (!source.includes('const observed = activeEndpoint(userData);')) {
    errors.push('owned-active-port-file');
  }
  if (!source.includes('endpointCandidate?.snapshot === observed.snapshot')) {
    errors.push('stable-owned-endpoint');
  }
  if (!source.includes("kind: 'posix-sentinel-process-group'")) {
    errors.push('posix-sentinel-owner');
  }
  if (!source.includes("process.on('SIGTERM', () => {});")) {
    errors.push('sentinel-term-hold');
  }
  if (!source.includes("process.kill(-process.pid, 'SIGTERM');")) {
    errors.push('sentinel-group-term');
  }
  if (!source.includes("process.kill(-process.pid, 'SIGKILL');")) {
    errors.push('sentinel-final-group-barrier');
  }
  if (!source.includes("send('shutdown-finalizing', { pgid: process.pid }")) {
    errors.push('sentinel-final-identity');
  }
  if (!source.includes("message.type === 'shutdown-finalizing-ack'\n      && finalBarrierStarted")) {
    errors.push('sentinel-final-ack');
  }
  if (!source.includes("type: 'shutdown-finalizing-ack',\n            pgid: child.pid")) {
    errors.push('owner-final-ack');
  }
  if (!source.includes('ackTimer = setTimeout(killOwnedGroup, config.ackTimeoutMs);')) {
    errors.push('sentinel-final-ack-watchdog');
  }
  if (!source.includes("if (!process.stderr.write(chunk)) {\n        browser.stderr.pause();")
    || !source.includes("process.stderr.once('drain', () => {\n          if (stderrForwarding) browser.stderr.resume();")) {
    errors.push('sentinel-stderr-backpressure');
  }
  if (!source.includes("stdio: ['ignore', 'ignore', 'pipe'], detached: false")) {
    errors.push('inner-browser-in-sentinel-group');
  }
  if (!source.includes("stdio: ['ignore', 'ignore', 'pipe', 'ipc'], detached, windowsHide: true")) {
    errors.push('detached-sentinel-group-leader');
  }
  if (!source.includes('const detached = true;')) {
    errors.push('detached-sentinel-owner');
  }
  const sentinelStart = source.indexOf('function posixBrowserGroupSentinelEntry() {');
  const sentinelEnd = source.indexOf('const POSIX_BROWSER_GROUP_SENTINEL_SOURCE', sentinelStart);
  const negativePidOperations = [...source.matchAll(/process\.kill\(\s*-/gu)];
  const sentinelNegativePidOperations = negativePidOperations.filter((match) => (
    sentinelStart >= 0 && sentinelEnd > sentinelStart
      && (match.index ?? -1) >= sentinelStart && (match.index ?? -1) < sentinelEnd
  ));
  if (negativePidOperations.length !== 2 || sentinelNegativePidOperations.length !== 2) {
    errors.push('parent-pgid-operation');
  }
  if (/process\.kill\(\s*-process\.pid,\s*0\)/u.test(
    sentinelStart >= 0 && sentinelEnd > sentinelStart
      ? source.slice(sentinelStart, sentinelEnd) : '',
  )) {
    errors.push('post-release-pgid-probe');
  }
  if (/\/json\/version/u.test(source)) errors.push('foreign-http-discovery');
  return errors;
}

const fixtureExecutable = path.join(realpathSync(tmpdir()), 'fixture Chromium browser');
const fixtureVersion = (product = 'Edg/151.0.4129.107') => ({
  product,
  revision: '@fixture-revision',
  userAgent: 'fixture Chromium user agent',
  jsVersion: '15.1.2.3',
  protocolVersion: '1.3',
});
const fixturePortableExecutable = fixtureExecutable.split(path.sep).join('/');
const fakeOwnedBrowser = (close: () => unknown | Promise<unknown>, product = 'Edg/151.0.4129.107') => ({
  browser: {
    executable: fixturePortableExecutable,
    product,
    revision: '@fixture-revision',
    user_agent: 'fixture Chromium user agent',
    js_version: '15.1.2.3',
    protocol_version: '1.3',
  },
  pid: 42,
  send(method: string) {
    if (method !== 'Browser.getVersion') throw new Error(`unexpected method ${method}`);
    return fixtureVersion(product);
  },
  close,
});

describe('art-tool portable browser authority', () => {
  it('binds the art contract to the existing DevToolsActivePort-owned launcher', () => {
    const source = sourceOf('art-browser-contract.mjs');
    expect(assessSharedOwner(source)).toEqual([]);
    const mutations: Array<[string, string, string]> = [
      ['launcher import', source.replace("import { openChromiumCdp } from './browsercdp.mjs';", ''), 'owned-launcher-import'],
      ['launcher call', source.replace('owned = await openCdp({', 'owned = await openForeignCdp({'), 'owned-launcher-call'],
      ['executable cross-check', source.replace(
        'owned.browser.executable === portable(exactExecutable)', 'true'), 'executable-owner-crosscheck'],
      ['parallel endpoint', `${source}\nvoid '/json/version';\n`, 'parallel-cdp-lifecycle'],
    ];
    for (const [label, mutant, expected] of mutations) {
      expect(assessSharedOwner(mutant), label).toContain(expected);
    }
  });

  it('keeps the reused launcher on browser-owned port 0 and a stable owned DevToolsActivePort', () => {
    const source = sourceOf('browsercdp.mjs');
    expect(assessOwnedLauncherSource(source)).toEqual([]);
    const mutations: Array<[string, string, string]> = [
      ['fixed port', source.replace("'--remote-debugging-port=0'", "'--remote-debugging-port=9222'"), 'browser-owned-port-zero'],
      ['foreign discovery', `${source}\nvoid '/json/version';\n`, 'foreign-http-discovery'],
      ['missing owned read', source.replace(
        'const observed = activeEndpoint(userData);', 'const observed = null;'), 'owned-active-port-file'],
      ['unstable snapshot', source.replace(
        'endpointCandidate?.snapshot === observed.snapshot', 'endpointCandidate !== null'), 'stable-owned-endpoint'],
      ['missing sentinel owner', source.replace(
        "kind: 'posix-sentinel-process-group'", "kind: 'direct-child'"), 'posix-sentinel-owner'],
      ['sentinel does not hold TERM', source.replace(
        "process.on('SIGTERM', () => {});", ''), 'sentinel-term-hold'],
      ['sentinel TERM reaches only itself', source.replace(
        "process.kill(-process.pid, 'SIGTERM');", "process.kill(process.pid, 'SIGTERM');"),
      'sentinel-group-term'],
      ['final barrier kills only sentinel', source.replace(
        "process.kill(-process.pid, 'SIGKILL');", "process.kill(process.pid, 'SIGKILL');"),
      'sentinel-final-group-barrier'],
      ['missing final identity announcement', source.replace(
        "send('shutdown-finalizing', { pgid: process.pid }", "send('shutdown-finalizing', {}"),
      'sentinel-final-identity'],
      ['missing final identity acknowledgement', source.replace(
        "message.type === 'shutdown-finalizing-ack'\n      && finalBarrierStarted",
        "message.type === 'shutdown-finalizing-unacked'\n      && finalBarrierStarted"),
      'sentinel-final-ack'],
      ['owner never acknowledges final identity', source.replace(
        "type: 'shutdown-finalizing-ack',\n            pgid: child.pid",
        "type: 'shutdown-finalizing-unacked',\n            pgid: child.pid"),
      'owner-final-ack'],
      ['lost final acknowledgement has no watchdog', source.replace(
        'ackTimer = setTimeout(killOwnedGroup, config.ackTimeoutMs);',
        'ackTimer = null;'), 'sentinel-final-ack-watchdog'],
      ['sentinel ignores stderr backpressure', source.replace(
        "if (!process.stderr.write(chunk)) {\n        browser.stderr.pause();",
        "if (process.stderr.write(chunk)) {\n        browser.stderr.pause();"),
      'sentinel-stderr-backpressure'],
      ['inner browser escapes sentinel group', source.replace(
        "stdio: ['ignore', 'ignore', 'pipe'], detached: false",
        "stdio: ['ignore', 'ignore', 'pipe'], detached: true"),
      'inner-browser-in-sentinel-group'],
      ['sentinel is not group leader', source.replace(
        "stdio: ['ignore', 'ignore', 'pipe', 'ipc'], detached, windowsHide: true",
        "stdio: ['ignore', 'ignore', 'pipe', 'ipc'], detached: false, windowsHide: true"),
      'detached-sentinel-group-leader'],
      ['sentinel ownership flag disabled', source.replace(
        'const detached = true;', 'const detached = false;'), 'detached-sentinel-owner'],
      ['reintroduced numeric group probe', source.replace(
        "process.kill(-process.pid, 'SIGKILL');", 'process.kill(-process.pid, 0);'),
      'post-release-pgid-probe'],
      ['parent reintroduces numeric group probe', source.replace(
        'function directChildProcessTree(child) {',
        'function directChildProcessTree(child) {\n  process.kill(-child.pid, 0);'),
      'parent-pgid-operation'],
      ['parent reintroduces numeric group signal', source.replace(
        'function directChildProcessTree(child) {',
        "function directChildProcessTree(child) {\n  process.kill(-pid, 'SIGTERM');"),
      'parent-pgid-operation'],
    ];
    for (const [label, mutant, expected] of mutations) {
      expect(assessOwnedLauncherSource(mutant), label).toContain(expected);
    }
  });

  it.each(contracts)('$file resolves one executable and uses the owned CDP browser before evidence work', (contract) => {
    expect(assessWiring(sourceOf(contract.file), contract)).toEqual([]);
  });

  it.each(contracts)('$file source control rejects every protected wiring mutation', (contract) => {
    const source = sourceOf(contract.file);
    const mutations: Array<[string, string, string]> = [
      ['missing guard', source.replace('assertBrowserLaunchAllowed();', '/* guard removed */'), 'launch-guard'],
      ['override fallback', source.replace('browserCandidates(browserOverride)', 'browserCandidates()'), 'shared-resolution'],
      ['missing owned launcher', source.replace('withArtBrowserCdp({', 'withForeignBrowserCdp({'), 'owned-launcher'],
      ['fixed CDP endpoint', `${source}\nvoid '--remote-debugging-port=9222';\n`, 'unowned-endpoint'],
      ['direct browser spawn', `${source}\nspawn(browserFile, []);\n`, 'unowned-endpoint'],
      ['hard-coded path', `${source}\nconst MUTANT_EDGE = 'C:/Program Files/Microsoft/Edge/Application/msedge.exe';\n`, 'hardcoded-browser-path'],
      ['point-version gate', `${source}\nvoid ['--version'];\n`, 'point-version-gate'],
      ['mislabelled owner', source.replace(`tool: '${contract.tool}'`, "tool: 'wrong-tool'"), 'owned-cdp-label'],
    ];
    if (contract.server) {
      mutations.push(['unowned server', source.replace(
        'cleanup: () => closeArtToolServer(server)', '/* server cleanup removed */'), 'server-cleanup-owner']);
    }
    const callbackMutant = source.replace(/\}, async \(\{[^)]*\}\) => \{/u,
      (match) => `${match}\n  process.exit(0);`);
    mutations.push(['callback process exit', callbackMutant, 'exit-bypasses-cleanup']);
    for (const [label, mutant, expectedError] of mutations) {
      expect(assessWiring(mutant, contract), label).toContain(expectedError);
    }
  });

  it('keeps invalid explicit paths authoritative while leaving identity to the live CDP attestation', () => {
    const temporary = mkdtempSync(path.join(realpathSync(tmpdir()), 'cf-art-browser-contract-'));
    try {
      const missing = path.join(temporary, 'missing-browser');
      expect(() => browserCandidates('relative/browser')).toThrow(/absolute path/u);
      expect(() => findChromiumBrowser(browserCandidates(missing))).toThrow(/no Chromium-family browser found/u);

      const nonbrowser = path.join(temporary, process.platform === 'win32' ? 'not-browser.exe' : 'not-browser');
      writeFileSync(nonbrowser, process.platform === 'win32' ? Buffer.from('MZnot-a-browser') : '#!/bin/sh\nexit 0\n');
      chmodSync(nonbrowser, 0o755);
      expect(findChromiumBrowser(browserCandidates(nonbrowser))).toBe(realpathSync(nonbrowser));
      expect(() => validateArtBrowserVersion({ Browser: 'not a Browser.getVersion response' },
        realpathSync(nonbrowser), 'fixture')).toThrow(/product is missing or malformed/u);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  it.each([
    'Edg/100.1.2.3',
    'Edg/151.0.4129.107',
    'Edg/999.42.7.3',
    'Chrome/152.0.4200.1',
    'Chromium/152.0.4200.1',
    'HeadlessChrome/152.0.4200.1',
  ])('accepts compatible Chromium-family provenance without pinning %s', (product) => {
    const provenance = validateArtBrowserVersion(fixtureVersion(product), fixtureExecutable, 'fixture');
    expect(provenance).toEqual({
      schema: ART_BROWSER_PROVENANCE_SCHEMA,
      executable: fixtureExecutable,
      product,
      revision: '@fixture-revision',
      user_agent: 'fixture Chromium user agent',
      js_version: '15.1.2.3',
      protocol_version: '1.3',
    });
    expect(Object.isFrozen(provenance)).toBe(true);
  });

  it.each([
    ['non-Chromium family', { ...fixtureVersion(), product: 'Firefox/152.0.0.1' }, /supported Chromium-family/u],
    ['malformed point version', { ...fixtureVersion(), product: 'Edg/152.0.1' }, /supported Chromium-family/u],
    ['wrong CDP', { ...fixtureVersion(), protocolVersion: '1.2' }, /does not match 1\.3/u],
    ['missing revision', { ...fixtureVersion(), revision: '' }, /revision is missing/u],
    ['missing user agent', { ...fixtureVersion(), userAgent: null }, /user agent is missing/u],
    ['missing JS version', { ...fixtureVersion(), jsVersion: undefined }, /JS version is missing/u],
  ] as const)('rejects the %s mutation', (_label, mutant, pattern) => {
    expect(() => validateArtBrowserVersion(mutant, fixtureExecutable, 'fixture')).toThrow(pattern);
  });

  it('calls Browser.getVersion, emits the exact accepted tuple, and emits nothing for a red response', async () => {
    const methods: string[] = [];
    const lines: string[] = [];
    const provenance = await attestArtBrowserCdp({
      send(method: string) { methods.push(method); return fixtureVersion('Edg/999.42.7.3'); },
      executable: fixtureExecutable,
      tool: 'fixture-tool',
      writeLine(line: string) { lines.push(line); },
    });
    expect(methods).toEqual(['Browser.getVersion']);
    expect(provenance.product).toBe('Edg/999.42.7.3');
    expect(lines).toEqual([`ART BROWSER PROVENANCE ${JSON.stringify(provenance)}`]);

    const redLines: string[] = [];
    await expect(attestArtBrowserCdp({
      send: () => fixtureVersion('Firefox/152.0.0.1'),
      executable: fixtureExecutable,
      tool: 'fixture-tool',
      writeLine(line: string) { redLines.push(line); },
    })).rejects.toThrow(/supported Chromium-family/u);
    expect(redLines).toEqual([]);
  });

  it('fails closed when Browser.getVersion rejects or exceeds its bound', async () => {
    await expect(attestArtBrowserCdp({
      send: () => Promise.reject(new Error('synthetic transport failure')),
      executable: fixtureExecutable,
      tool: 'fixture-tool',
    })).rejects.toThrow(/Browser\.getVersion failed.*synthetic transport failure/u);
    await expect(attestArtBrowserCdp({
      send: () => new Promise(() => {}),
      executable: fixtureExecutable,
      tool: 'fixture-tool',
      timeoutMs: 5,
    })).rejects.toThrow(/Browser\.getVersion timed out/u);
  });

  it('cross-checks the selected executable, restores browser selection, and records the live tuple', async () => {
    const environment: Record<string, string | undefined> = { CF_BROWSER: '/fixture/prior-browser' };
    const calls: string[] = [];
    let openOptions: Record<string, unknown> | null = null;
    const browser = await openArtBrowserCdp({
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      startupTimeoutMs: 4321,
      writeLine: (line) => calls.push(line),
    }, {
      environment,
      async openCdp(options) {
        openOptions = options as Record<string, unknown>;
        expect(environment.CF_BROWSER).toBe(fixtureExecutable);
        return fakeOwnedBrowser(() => { calls.push('browser-close'); });
      },
    });
    expect(environment.CF_BROWSER).toBe('/fixture/prior-browser');
    expect(openOptions).toMatchObject({
      label: 'fixture-tool art browser',
      userDataPrefix: 'cf-fixture-owner',
      startupTimeoutMs: 4321,
    });
    expect(browser.provenance.product).toBe('Edg/151.0.4129.107');
    expect(calls).toEqual([`ART BROWSER PROVENANCE ${JSON.stringify(browser.provenance)}`]);
    await browser.close();
    expect(calls.at(-1)).toBe('browser-close');
  });

  it('cleans browser/profile and external resources after success and work failure', async () => {
    const calls: string[] = [];
    const openCdp = async () => fakeOwnedBrowser(async () => { calls.push('browser'); });
    const options = {
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      cleanup: async () => { calls.push('external'); },
      writeLine: () => {},
    };
    await expect(withArtBrowserCdp(options, async () => {
      calls.push('work');
      return 42;
    }, { openCdp })).resolves.toBe(42);
    expect(calls).toEqual(['work', 'browser', 'external']);

    calls.length = 0;
    const primary = new Error('synthetic work failure');
    let caught: unknown = null;
    try {
      await withArtBrowserCdp(options, async () => {
        calls.push('work');
        throw primary;
      }, { openCdp });
    } catch (error) { caught = error; }
    expect(caught).toBe(primary);
    expect(calls).toEqual(['work', 'browser', 'external']);
  });

  it('cleans an owned browser when attestation or executable ownership fails', async () => {
    const attestationCalls: string[] = [];
    await expect(withArtBrowserCdp({
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      cleanup: () => { attestationCalls.push('external'); },
      writeLine: () => {},
    }, async () => { attestationCalls.push('work'); }, {
      openCdp: async () => fakeOwnedBrowser(
        () => { attestationCalls.push('browser'); }, 'Firefox/152.0.0.1'),
    })).rejects.toThrow(/supported Chromium-family/u);
    expect(attestationCalls).toEqual(['browser', 'external']);

    const identityCalls: string[] = [];
    const mismatched = fakeOwnedBrowser(() => { identityCalls.push('browser'); });
    mismatched.browser.executable = `${fixturePortableExecutable}-other`;
    await expect(openArtBrowserCdp({
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      writeLine: () => {},
    }, { openCdp: async () => mismatched })).rejects.toThrow(/does not match selected executable/u);
    expect(identityCalls).toEqual(['browser']);
  });

  it('runs every cleanup after opener/cleanup failures and suppresses a green result', async () => {
    const openerCalls: string[] = [];
    await expect(withArtBrowserCdp({
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      cleanup: () => { openerCalls.push('external'); },
      writeLine: () => {},
    }, async () => { openerCalls.push('work'); }, {
      openCdp: async () => { throw new Error('synthetic opener failure'); },
    })).rejects.toThrow(/synthetic opener failure/u);
    expect(openerCalls).toEqual(['external']);

    const cleanupCalls: string[] = [];
    await expect(withArtBrowserCdp({
      browserFile: fixtureExecutable,
      tool: 'fixture-tool',
      userDataPrefix: 'cf-fixture-owner',
      cleanup: async () => { cleanupCalls.push('external'); throw new Error('external red'); },
      writeLine: () => {},
    }, async () => 'green', {
      openCdp: async () => fakeOwnedBrowser(async () => {
        cleanupCalls.push('browser');
        throw new Error('browser red');
      }),
    })).rejects.toThrow(/cleanup failed.*browser red.*external red/u);
    expect(cleanupCalls).toEqual(['browser', 'external']);
  });

  it('accepts a synchronous server close callback without a timer TDZ', async () => {
    const calls: string[] = [];
    const server = {
      listening: true,
      close(callback: (error?: Error) => void) { calls.push('close'); callback(); },
      closeAllConnections() { calls.push('force'); },
    };
    await expect(closeArtToolServer(server, {
      setTimer: (() => { calls.push('timer'); return 17; }) as unknown as typeof setTimeout,
      clearTimer: (() => { calls.push('clear'); }) as typeof clearTimeout,
    })).resolves.toBeUndefined();
    expect(calls).toEqual(['timer', 'close', 'clear']);
  });

  it('force-closes once and stays red when the server close callback is missing', async () => {
    const calls: string[] = [];
    const callbacks: { fireDeadline?: () => void; lateClose?: () => void } = {};
    const pending = closeArtToolServer({
      listening: true,
      close(callback: () => void) { calls.push('close'); callbacks.lateClose = callback; },
      closeAllConnections() { calls.push('force'); },
    }, {
      setTimer: ((callback: () => void) => {
        calls.push('timer'); callbacks.fireDeadline = callback; return 23;
      }) as unknown as typeof setTimeout,
      clearTimer: (() => { calls.push('clear'); }) as typeof clearTimeout,
    });
    callbacks.fireDeadline?.();
    await expect(pending).rejects.toThrow(/did not close within 2000ms/u);
    callbacks.lateClose?.();
    expect(calls).toEqual(['timer', 'close', 'clear', 'force']);
  });
});
