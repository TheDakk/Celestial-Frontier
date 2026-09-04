/* art-browser-contract.mjs — shared version-tolerant browser authority for
   the older art tools that own a raw CDP connection.

   Executable discovery is only path selection. The connected browser must
   identify itself through Browser.getVersion before any evidence work begins.
   Point versions are retained as provenance and never compared to a pin. */
import path from 'node:path';
import { openChromiumCdp } from './browsercdp.mjs';

export const ART_BROWSER_PROVENANCE_SCHEMA = 'cf-v2-art-browser-provenance/v1';

const CHROMIUM_PRODUCT = /^(?:Chrome|Chromium|Edg|HeadlessChrome)\/[1-9]\d*(?:\.\d+){3}$/u;

function fail(message) { throw new Error(`art browser: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function requiredString(value, where) {
  assert(typeof value === 'string' && value.trim() === value && value.length > 0,
    `${where} is missing or malformed`);
  assert(!/[\u0000-\u001f\u007f]/u.test(value), `${where} contains control characters`);
  return value;
}

export function validateArtBrowserVersion(version, executable, tool = 'art tool') {
  assert(version !== null && typeof version === 'object' && !Array.isArray(version),
    `${tool}: Browser.getVersion returned no object`);
  const exactExecutable = requiredString(executable, `${tool} executable`);
  assert(path.isAbsolute(exactExecutable) && path.normalize(exactExecutable) === exactExecutable,
    `${tool} executable is not one normalized absolute path`);

  const product = requiredString(version.product, `${tool} product`);
  assert(CHROMIUM_PRODUCT.test(product),
    `${tool} product ${JSON.stringify(product)} is not a supported Chromium-family product/version`);
  const protocolVersion = requiredString(version.protocolVersion, `${tool} protocol version`);
  assert(protocolVersion === '1.3',
    `${tool} CDP protocol ${JSON.stringify(protocolVersion)} does not match 1.3`);

  return Object.freeze({
    schema: ART_BROWSER_PROVENANCE_SCHEMA,
    executable: exactExecutable,
    product,
    revision: requiredString(version.revision, `${tool} revision`),
    user_agent: requiredString(version.userAgent, `${tool} user agent`),
    js_version: requiredString(version.jsVersion, `${tool} JS version`),
    protocol_version: protocolVersion,
  });
}

export async function attestArtBrowserCdp({
  send,
  executable,
  tool,
  timeoutMs = 5000,
  writeLine = console.log,
}) {
  assert(typeof send === 'function', `${tool || 'art tool'}: CDP sender is missing`);
  assert(typeof tool === 'string' && tool.trim() === tool && tool.length > 0,
    'tool label is missing or malformed');
  assert(Number.isInteger(timeoutMs) && timeoutMs > 0,
    `${tool}: Browser.getVersion timeout must be a positive integer`);
  assert(typeof writeLine === 'function', `${tool}: provenance writer is missing`);

  let timer = null;
  let version;
  try {
    version = await Promise.race([
      Promise.resolve().then(() => send('Browser.getVersion')),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(
          `art browser: ${tool}: Browser.getVersion timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${tool}: Browser.getVersion failed (${message})`);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }

  const provenance = validateArtBrowserVersion(version, executable, tool);
  writeLine(`ART BROWSER PROVENANCE ${JSON.stringify(provenance)}`);
  return provenance;
}

function portable(value) { return value.split(path.sep).join('/'); }
function errorMessage(error) { return error instanceof Error ? error.message : String(error); }
const NO_ERROR = Symbol('no-error');

async function runCleanups(primaryError, cleanups) {
  const cleanupErrors = [];
  for (const [label, cleanup] of cleanups) {
    try { await cleanup(); }
    catch (error) { cleanupErrors.push(`${label}: ${errorMessage(error)}`); }
  }
  if (cleanupErrors.length > 0) {
    const primary = primaryError === NO_ERROR ? '' : `${errorMessage(primaryError)}; `;
    fail(`${primary}cleanup failed (${cleanupErrors.join(' · ')})`);
  }
  if (primaryError !== NO_ERROR) throw primaryError;
}

/* `browserFile` is resolved before this boundary so an explicit --browser
   remains authoritative. browsercdp owns the actual child, asks it for port 0,
   and discovers the endpoint only through that child's stable
   DevToolsActivePort. The temporary CF_BROWSER assignment is restored on
   every outcome and the launched executable is cross-checked before the
   second, art-specific family/protocol attestation is published. */
export async function openArtBrowserCdp({
  browserFile,
  tool,
  userDataPrefix,
  startupTimeoutMs,
  commandTimeoutMs,
  webSocketOpenTimeoutMs,
  shutdownTimeoutMs,
  onEvent,
  writeLine,
}, { openCdp = openChromiumCdp, environment = process.env } = {}) {
  const exactTool = requiredString(tool, 'art tool label');
  const exactExecutable = requiredString(browserFile, `${exactTool} executable`);
  assert(path.isAbsolute(exactExecutable) && path.normalize(exactExecutable) === exactExecutable,
    `${exactTool} executable is not one normalized absolute path`);
  assert(typeof openCdp === 'function', `${exactTool}: owned CDP opener is missing`);
  assert(environment !== null && typeof environment === 'object',
    `${exactTool}: browser environment carrier is missing`);

  const priorBrowser = environment.CF_BROWSER;
  let owned = null;
  let primaryError = NO_ERROR;
  try {
    environment.CF_BROWSER = exactExecutable;
    owned = await openCdp({
      label: `${exactTool} art browser`, userDataPrefix,
      ...(startupTimeoutMs === undefined ? {} : { startupTimeoutMs }),
      ...(commandTimeoutMs === undefined ? {} : { commandTimeoutMs }),
      ...(webSocketOpenTimeoutMs === undefined ? {} : { webSocketOpenTimeoutMs }),
      ...(shutdownTimeoutMs === undefined ? {} : { shutdownTimeoutMs }),
      ...(onEvent === undefined ? {} : { onEvent }),
    });
    assert(owned !== null && typeof owned === 'object'
      && typeof owned.send === 'function' && typeof owned.close === 'function'
      && owned.browser !== null && typeof owned.browser === 'object',
    `${exactTool}: owned CDP opener returned an invalid browser owner`);
    assert(owned.browser.executable === portable(exactExecutable),
      `${exactTool}: owned launcher executable ${JSON.stringify(owned.browser.executable)} does not match selected executable ${JSON.stringify(portable(exactExecutable))}`);
    const provenance = await attestArtBrowserCdp({
      send: owned.send, executable: exactExecutable, tool: exactTool,
      ...(writeLine === undefined ? {} : { writeLine }),
    });
    return Object.freeze({
      send: owned.send,
      browser: owned.browser,
      pid: owned.pid,
      provenance,
      close: owned.close,
    });
  } catch (error) {
    primaryError = error;
  } finally {
    if (priorBrowser === undefined) delete environment.CF_BROWSER;
    else environment.CF_BROWSER = priorBrowser;
  }

  await runCleanups(primaryError, owned ? [['browser/profile', () => owned.close()]] : []);
  throw new Error('art browser: unreachable open failure');
}

/* The work callback never owns shutdown. Browser/profile cleanup and any
   caller cleanup (normally the static server) both run after success or any
   failure, and a cleanup failure suppresses a green return. */
export async function withArtBrowserCdp(options, work, dependencies) {
  assert(typeof work === 'function', `${options?.tool || 'art tool'}: browser work callback is missing`);
  const cleanup = options?.cleanup;
  assert(cleanup === undefined || typeof cleanup === 'function',
    `${options?.tool || 'art tool'}: external cleanup callback is invalid`);
  const browserOptions = { ...options };
  delete browserOptions.cleanup;

  let browser = null;
  let result;
  let primaryError = NO_ERROR;
  try {
    browser = await openArtBrowserCdp(browserOptions, dependencies);
    result = await work(browser);
  } catch (error) {
    primaryError = error;
  }
  await runCleanups(primaryError, [
    ...(browser ? [['browser/profile', () => browser.close()]] : []),
    ...(cleanup ? [['external resource', cleanup]] : []),
  ]);
  return result;
}

/* Server shutdown is an owned, bounded outcome. A missing/error/late close
   callback force-closes active sockets exactly once and remains red. */
export async function closeArtToolServer(server, {
  timeoutMs = 2000,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  if (!server?.listening) return;
  assert(Number.isInteger(timeoutMs) && timeoutMs > 0,
    'HTTP server shutdown timeout must be a positive integer');
  assert(typeof server.close === 'function' && typeof setTimer === 'function'
    && typeof server.closeAllConnections === 'function'
    && typeof clearTimer === 'function', 'HTTP server cleanup dependencies are invalid');
  await new Promise((resolve, reject) => {
    let settled = false;
    let forced = false;
    let timer = null;
    const force = () => {
      if (forced) return null;
      forced = true;
      try { server.closeAllConnections(); return null; }
      catch (error) { return error; }
    };
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimer(timer);
      if (error) {
        const forceError = force();
        reject(forceError
          ? new Error(`${error.message}; force-close failed (${errorMessage(forceError)})`)
          : error);
      } else resolve();
    };
    timer = setTimer(() => finish(new Error(
      `art browser: HTTP server did not close within ${timeoutMs}ms`)), timeoutMs);
    try {
      server.close((error) => finish(error
        ? new Error(`art browser: HTTP server close failed (${errorMessage(error)})`)
        : null));
    } catch (error) {
      finish(new Error(`art browser: HTTP server close threw (${errorMessage(error)})`));
    }
  });
}
