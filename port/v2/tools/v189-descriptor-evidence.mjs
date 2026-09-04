/* Reproducible v1.8.9 descriptor evidence capture and verifier.

   The sealed 50-probe fingerprint called moonDescriptor with no moons and
   galaxyDescriptor on an empty cell, so both stored values are `[]`. This
   tool retrieves the exact shipped HTML from its immutable commit, verifies
   that source byte-for-byte, injects the tracked classic-script recipe, and
   captures non-vacuous raw descriptor objects.

   Usage:
     node tools/v189-descriptor-evidence.mjs --check
     node tools/v189-descriptor-evidence.mjs --capture   # prints; never writes
     node tools/v189-descriptor-evidence.mjs --selftest

   Never replace the fixture merely to make --check pass. A mismatch is source,
   recipe, harness, or observable descriptor drift that must be diagnosed.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import fakeCanvas from '../../../tools/fake2d.js';

const { makeFake2D } = fakeCanvas;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const baselineDir = path.join(root, 'port', 'baseline-v1.8.9');
const evidenceFile = path.join(baselineDir, 'descriptor-fixtures.json');
const probeFile = path.join(here, 'v189-descriptor-probe.js');
const fakeCanvasFile = path.join(root, 'tools', 'fake2d.js');

const SOURCE = Object.freeze({
  tag: 'v1.8.9',
  commit: '92098e91ddc2028cbab9149293b58166f483764c',
  path: 'celestial-frontier.html',
  bytes: 1963584,
  sha256: '9f90f506a7cfcf5b721d80e7b956e0ef717edf04d004edf825ddb4f0303b3c88',
});
const SCHEMA = 'cf-v1.8.9-descriptor-evidence/v1';
const PROBE_RELATIVE = '../v2/tools/v189-descriptor-probe.js';
const FAKE_CANVAS_RELATIVE = '../../tools/fake2d.js';
const REQUIRED_CASES = Object.freeze([
  'sol-earth-moon-0',
  'system-1-planet-0-moon-0',
  'cell--6-4-galaxy-0',
]);
const CLOSE = '\n})();\n</script>';
const mode = process.argv[2];

if (!['--capture', '--check', '--selftest'].includes(mode) || process.argv.length !== 3) {
  console.error('usage: node tools/v189-descriptor-evidence.mjs --capture | --check | --selftest');
  process.exit(2);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) { return JSON.stringify(stable(value)); }

function evidenceHash(value) {
  const core = clone(value);
  delete core.evidenceSha256;
  return sha256(stableJson(core));
}

function immutableSourceBytes() {
  const tagCommit = execFileSync('git', ['rev-parse', `${SOURCE.tag}^{commit}`], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (tagCommit !== SOURCE.commit) {
    throw new Error(`${SOURCE.tag} resolves to ${tagCommit}, expected immutable commit ${SOURCE.commit}`);
  }
  return execFileSync('git', ['show', `${SOURCE.commit}:${SOURCE.path}`], {
    cwd: root, encoding: null, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function validatePinnedBytes(sourceBytes, probeBytes, canvasBytes) {
  const errors = [];
  if (sourceBytes.length !== SOURCE.bytes) errors.push(`legacy source byte length ${sourceBytes.length} != ${SOURCE.bytes}`);
  if (sha256(sourceBytes) !== SOURCE.sha256) errors.push(`legacy source SHA-256 ${sha256(sourceBytes)} != ${SOURCE.sha256}`);
  if (!probeBytes.length) errors.push('capture probe is empty');
  if (!canvasBytes.length) errors.push('fake-canvas contract is empty');
  return errors;
}

function validateEvidence(evidence, sourceBytes, probeBytes, canvasBytes) {
  const errors = validatePinnedBytes(sourceBytes, probeBytes, canvasBytes);
  if (!evidence || typeof evidence !== 'object') return [...errors, 'evidence is not an object'];
  if (evidence.captureSchema !== SCHEMA) errors.push(`capture schema is ${evidence.captureSchema}`);
  if (evidence.capturedAgainst?.tag !== SOURCE.tag) errors.push(`capture tag is ${evidence.capturedAgainst?.tag}`);
  if (evidence.capturedAgainst?.commit !== SOURCE.commit) errors.push(`capture commit is ${evidence.capturedAgainst?.commit}`);
  if (evidence.source?.path !== SOURCE.path) errors.push(`source path is ${evidence.source?.path}`);
  if (evidence.source?.bytes !== SOURCE.bytes) errors.push(`recorded source byte length is ${evidence.source?.bytes}`);
  if (evidence.source?.sha256 !== SOURCE.sha256) errors.push(`recorded source SHA-256 is ${evidence.source?.sha256}`);
  if (evidence.capture?.probeFile !== PROBE_RELATIVE) errors.push(`capture probe path is ${evidence.capture?.probeFile}`);
  if (evidence.capture?.probeSha256 !== sha256(probeBytes)) errors.push('capture probe SHA-256 is stale');
  if (evidence.capture?.fakeCanvasFile !== FAKE_CANVAS_RELATIVE) errors.push(`fake-canvas path is ${evidence.capture?.fakeCanvasFile}`);
  if (evidence.capture?.fakeCanvasSha256 !== sha256(canvasBytes)) errors.push('fake-canvas SHA-256 is stale');
  if (stableJson(evidence.observedErrors) !== '[]') errors.push('capture recorded runtime errors');

  const cases = Array.isArray(evidence.cases) ? evidence.cases : [];
  if (stableJson(cases.map((row) => row.id)) !== stableJson(REQUIRED_CASES)) {
    errors.push('descriptor case inventory or order changed');
  }
  for (const row of cases) {
    const rawJson = stableJson(row.raw);
    if (rawJson !== row.canonicalJson) errors.push(`${row.id}: raw object does not match canonical JSON`);
    if (Buffer.byteLength(row.canonicalJson || '') !== row.canonicalJsonByteLength) {
      errors.push(`${row.id}: canonical JSON byte length is stale`);
    }
    if (sha256(row.canonicalJson || '') !== row.canonicalJsonSha256) {
      errors.push(`${row.id}: canonical JSON SHA-256 is stale`);
    }
  }
  if (evidence.evidenceSha256 !== evidenceHash(evidence)) errors.push('aggregate evidence SHA-256 is stale');
  return errors;
}

function assertValid(label, evidence, sourceBytes, probeBytes, canvasBytes) {
  const errors = validateEvidence(evidence, sourceBytes, probeBytes, canvasBytes);
  if (errors.length) throw new Error(`${label}:\n  - ${errors.join('\n  - ')}`);
}

function assertSameCapture(expected, observed) {
  if (stableJson(expected) !== stableJson(observed)) {
    throw new Error('live immutable-source capture differs from descriptor-fixtures.json');
  }
}

function injectHook(sourceText) {
  const at = sourceText.lastIndexOf(CLOSE);
  if (at < 0) throw new Error('immutable v1.8.9 IIFE close anchor not found');
  const hook = `\ntry { window.__V189_DESCRIPTOR_HOOK__ = {\n`
    + `  get systemFor(){ return systemFor; },\n`
    + `  get galaxiesInCell(){ return galaxiesInCell; },\n`
    + `  get moonDescriptor(){ return moonDescriptor; },\n`
    + `  get galaxyDescriptor(){ return galaxyDescriptor; },\n`
    + `  get GAL_KIND(){ return GAL_KIND; }\n`
    + `}; } catch (error) { window.__V189_DESCRIPTOR_HOOK_ERROR__ = String(error); }\n`;
  return sourceText.slice(0, at) + hook + sourceText.slice(at);
}

async function runLegacyProbe(sourceBytes, probeBytes) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(`jsdomError: ${error && error.message}`));
  virtualConsole.on('error', (...args) => errors.push(`console.error: ${args.map(String).join(' ')}`));
  const dom = new JSDOM(injectHook(sourceBytes.toString('utf8')), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://v189-descriptor-capture.invalid/celestial-frontier.html',
    virtualConsole,
    beforeParse(window) {
      const proto = window.HTMLCanvasElement.prototype;
      proto.getContext = function getContext(kind) {
        if (kind !== '2d') return null;
        if (!this.__fake2d) this.__fake2d = makeFake2D(this);
        return this.__fake2d;
      };
      proto.toDataURL = function toDataURL() { return 'data:image/png;base64,'; };
      window.addEventListener('error', (event) => errors.push(`window.onerror: ${event.message || String(event.error)}`));
    },
  });

  try {
    await wait(400);
    const script = dom.window.document.createElement('script');
    script.textContent = probeBytes.toString('utf8');
    dom.window.document.body.appendChild(script);
    await wait(200);
    const captured = dom.window.__V189_DESCRIPTOR_CAPTURE__;
    if (!captured || captured.error) throw new Error(captured?.error || 'legacy descriptor probe returned no value');
    if (errors.length) throw new Error(`legacy descriptor probe emitted errors:\n  - ${errors.join('\n  - ')}`);
    return { captured: clone(captured), errors };
  } finally {
    dom.window.close();
  }
}

async function captureEvidence(sourceBytes, probeBytes, canvasBytes) {
  const byteErrors = validatePinnedBytes(sourceBytes, probeBytes, canvasBytes);
  if (byteErrors.length) throw new Error(byteErrors.join('\n'));
  const { captured, errors } = await runLegacyProbe(sourceBytes, probeBytes);
  const cases = captured.cases.map((row) => ({
    id: row.id,
    recipe: row.recipe,
    raw: row.raw,
    canonicalJson: row.canonicalJson,
    canonicalJsonByteLength: Buffer.byteLength(row.canonicalJson),
    canonicalJsonSha256: sha256(row.canonicalJson),
  }));
  const evidence = {
    _comment: [
      'Non-vacuous descriptor evidence captured from the immutable shipped v1.8.9 HTML.',
      'The capture command prints a candidate and never writes this sealed fixture.',
      'Do not replace this evidence merely to make a parity failure pass.',
    ],
    captureSchema: SCHEMA,
    capturedAgainst: { tag: SOURCE.tag, commit: SOURCE.commit },
    source: {
      retrieval: `git show ${SOURCE.commit}:${SOURCE.path}`,
      path: SOURCE.path,
      bytes: sourceBytes.length,
      sha256: sha256(sourceBytes),
    },
    capture: {
      probeFile: PROBE_RELATIVE,
      probeSha256: sha256(probeBytes),
      fakeCanvasFile: FAKE_CANVAS_RELATIVE,
      fakeCanvasSha256: sha256(canvasBytes),
      canonicalisation: 'Gate A san(): sorted object keys, array order preserved, numbers rounded to 1e-9',
    },
    guards: captured.guards,
    observedErrors: errors,
    cases,
  };
  evidence.evidenceSha256 = evidenceHash(evidence);
  return evidence;
}

function readInputs() {
  const sourceBytes = immutableSourceBytes();
  const probeBytes = fs.readFileSync(probeFile);
  const canvasBytes = fs.readFileSync(fakeCanvasFile);
  return { sourceBytes, probeBytes, canvasBytes };
}

async function check(inputs) {
  const expected = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
  assertValid('sealed descriptor evidence', expected, inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes);
  const observed = await captureEvidence(inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes);
  assertValid('live descriptor evidence', observed, inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes);
  assertSameCapture(expected, observed);
  return { expected, observed };
}

function expectRejected(label, fn) {
  try {
    fn();
  } catch (_) {
    return;
  }
  throw new Error(`SELFTEST accepted ${label}`);
}

async function selftest(inputs) {
  const { expected, observed } = await check(inputs);

  const rawTamper = clone(expected);
  rawTamper.cases[1].raw.title = 'Tampered moon';
  expectRejected('raw evidence tamper', () => assertValid('raw tamper', rawTamper,
    inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes));

  const resealedTamper = clone(expected);
  resealedTamper.cases[1].raw.title = 'Tampered moon';
  resealedTamper.cases[1].canonicalJson = stableJson(resealedTamper.cases[1].raw);
  resealedTamper.cases[1].canonicalJsonByteLength = Buffer.byteLength(resealedTamper.cases[1].canonicalJson);
  resealedTamper.cases[1].canonicalJsonSha256 = sha256(resealedTamper.cases[1].canonicalJson);
  resealedTamper.evidenceSha256 = evidenceHash(resealedTamper);
  assertValid('internally consistent tamper control', resealedTamper,
    inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes);
  expectRejected('fully re-sealed but false evidence', () => assertSameCapture(resealedTamper, observed));

  const staleSource = clone(expected);
  staleSource.capturedAgainst.commit = '0'.repeat(40);
  staleSource.evidenceSha256 = evidenceHash(staleSource);
  expectRejected('re-sealed stale source provenance', () => assertValid('stale source', staleSource,
    inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes));

  expectRejected('changed capture probe bytes', () => assertValid('changed probe', expected,
    inputs.sourceBytes, Buffer.concat([inputs.probeBytes, Buffer.from('\n// stale\n')]), inputs.canvasBytes));

  console.log('V1.8.9 DESCRIPTOR EVIDENCE SELFTEST PASS — raw tamper, re-sealed false evidence, stale source, and changed probe all rejected');
}

try {
  const inputs = readInputs();
  if (mode === '--capture') {
    const evidence = await captureEvidence(inputs.sourceBytes, inputs.probeBytes, inputs.canvasBytes);
    process.stdout.write(JSON.stringify(evidence, null, 2) + '\n');
  } else if (mode === '--check') {
    const { expected } = await check(inputs);
    console.log(`V1.8.9 DESCRIPTOR EVIDENCE PASS — ${expected.cases.length} non-vacuous cases, immutable source/probe/evidence hashes match`);
  } else {
    await selftest(inputs);
  }
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
