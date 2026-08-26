/* Arc-local Edge-compatibility preflight for the Compendium resource gate.

   This caller replaces the generic launcher's cold live leg in the Edge-only
   workflow job. It deliberately leaves every Compendium measurement-authority
   input byte-identical: the shared launcher and candidate collector retain
   their sealed bounds and semantics. This short preflight proves the browser
   family/protocol and fresh-target prerequisite subset; the contract seals the
   complete CDP method inventory and the full collector exercises that inventory.

   Usage:
     node tools/compendiummem-browser-preflight.mjs --selftest
     node tools/compendiummem-browser-preflight.mjs
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { findChromiumBrowser } from './browserpath.mjs';
import {
  CANDIDATE_TRANSPORT_TIMEOUT_MS,
  COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
  COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256,
  compendiumBrowserAuthority,
  compendiumBrowserAuthorityMatches,
  compendiumBudgetBrowserAuthority,
  compendiumCdpOptions,
  validCompendiumBrowserAuthority,
} from './compendiummem-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const repoRoot = path.resolve(here, '..', '..', '..');
const EDGE_INSTALL_STEP_NAME = 'install exact Arc 1A Edge calibration browser';
const EDGE_PACKAGE_URL = 'https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/microsoft-edge-stable_151.0.4129.101-1_amd64.deb';
const EDGE_PACKAGE_SHA256 = 'bd7604025424914a61c06293cb6bf269141a29d8c54cf1997110bc96d3365d60';
const EDGE_PACKAGE_FILENAME = 'microsoft-edge-stable_151.0.4129.101-1_amd64.deb';
const EDGE_PACKAGE_VERSION = '151.0.4129.101-1';
const EDGE_BROWSER = '/usr/bin/microsoft-edge-stable';
const CHROME_BROWSER = '/usr/bin/google-chrome';
const EDGE_REINSTALL_COMMAND = 'sudo apt-get install --reinstall --yes "$edge_package"';
const EDGE_CERTIFICATION_STEP_NAME = 'one-attempt Compendium memory certification';
const EDGE_WORKFLOW_CONTRACTS = Object.freeze([
  Object.freeze({
    relative: '.github/workflows/test.yml',
    jobName: 'v2-compendium-memory',
    jobBrowser: EDGE_BROWSER,
    preflightStepName: 'browser provenance and Compendium memory instrument selftests',
    preflightBrowser: null,
    preflightCommands: Object.freeze([
      'node tools/browserpath.mjs --selftest',
      'node tools/compendiummem-browser-preflight.mjs --selftest',
      'node tools/compendiummem-browser-preflight.mjs',
      'npm run compendiummem:selftest',
    ]),
    certificationBrowser: null,
    executableCheck: 'test -x "$CF_BROWSER"',
  }),
  Object.freeze({
    relative: '.github/workflows/dev-preview-package.yml',
    jobName: 'package',
    jobBrowser: CHROME_BROWSER,
    preflightStepName: 'Compendium memory instrument selftest',
    preflightBrowser: EDGE_BROWSER,
    preflightCommands: Object.freeze([
      'node tools/compendiummem-browser-preflight.mjs --selftest',
      'node tools/compendiummem-browser-preflight.mjs',
      'npm run compendiummem:selftest',
    ]),
    certificationBrowser: EDGE_BROWSER,
    executableCheck: 'test -x /usr/bin/microsoft-edge-stable',
  }),
]);
const PREFLIGHT_LABEL = 'Compendium Arc 1A Edge browser preflight';
const PREFLIGHT_PROFILE_PREFIX = 'cf-compendiummem-edge-preflight';
const PREFLIGHT_STARTUP_TIMEOUT_MS = 45_000;
const PREFLIGHT_SOCKET_TIMEOUT_MS = 15_000;
const PREFLIGHT_SHUTDOWN_TIMEOUT_MS = 2_000;
const PREFLIGHT_SENTINEL = 'cf-v2-compendium-edge-preflight/v1';
const PREFLIGHT_OPTION_KEYS = Object.freeze([
  'commandTimeoutMs', 'label', 'onEvent', 'shutdownTimeoutMs',
  'startupTimeoutMs', 'userDataPrefix', 'webSocketOpenTimeoutMs',
].sort());

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function portable(file) { return file.replaceAll('\\', '/'); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function yamlIndent(line, where) {
  const whitespace = (line.match(/^[ \t]*/) || [''])[0];
  assert(!whitespace.includes('\t'), `${where}: tabs make workflow scope ambiguous`);
  return whitespace.length;
}

function exactWorkflowLines(lines, token, start = 0, end = lines.length) {
  const matches = [];
  for (let index = start; index < end; index++) {
    if (lines[index].trim() === token) matches.push(index);
  }
  return matches;
}

function exactIndentedWorkflowLines(lines, token, indent, start = 0, end = lines.length) {
  return exactWorkflowLines(lines, token, start, end)
    .filter((index) => yamlIndent(lines[index], `workflow line ${index + 1}`) === indent);
}

function workflowBlockEnd(lines, start, indent, limit, label) {
  for (let index = start + 1; index < limit; index++) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const currentIndent = yamlIndent(lines[index], `${label} line ${index + 1}`);
    if (currentIndent <= indent) return index;
  }
  return limit;
}

function assertExactBlockLines(lines, start, end, indent, expected, label) {
  const actual = [];
  for (let index = start; index < end; index++) {
    if (!lines[index].trim()) continue;
    assert(yamlIndent(lines[index], `${label} line ${index + 1}`) === indent,
      `${label}: block-scalar or mapping content has the wrong indentation at line ${index + 1}`);
    actual.push(lines[index].trim());
  }
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: exact ordered block content changed (${JSON.stringify(actual)})`);
}

function exactDirectLine(lines, token, indent, start, end, label) {
  const matches = exactIndentedWorkflowLines(lines, token, indent, start, end);
  assert(matches.length === 1,
    `${label}: expected one exact direct ${token}, found ${matches.length}`);
  return matches[0];
}

function assertNoWorkflowExecutionControls(lines, start, end, indent, label) {
  const forbidden = [];
  for (let index = start + 1; index < end; index++) {
    if (yamlIndent(lines[index], `${label} line ${index + 1}`) !== indent) continue;
    if (/^(?:if|continue-on-error)\s*:/.test(lines[index].trim())) forbidden.push(index + 1);
  }
  assert(forbidden.length === 0,
    `${label}: execution-control keys may not skip or soften the required chain (lines ${forbidden.join(', ')})`);
}

function workflowJobBounds(lines, contract, label) {
  const jobsLines = exactIndentedWorkflowLines(lines, 'jobs:', 0);
  assert(jobsLines.length === 1, `${label}: expected one exact root jobs mapping`);
  const jobsStart = jobsLines[0];
  const jobsEnd = workflowBlockEnd(lines, jobsStart, 0, lines.length, label);
  const jobLines = exactIndentedWorkflowLines(
    lines, `${contract.jobName}:`, 2, jobsStart + 1, jobsEnd,
  );
  assert(jobLines.length === 1,
    `${label}: expected one exact owning job ${contract.jobName}, found ${jobLines.length}`);
  const jobStart = jobLines[0];
  const jobEnd = workflowBlockEnd(lines, jobStart, 2, jobsEnd, label);
  return Object.freeze({ jobsStart, jobsEnd, jobStart, jobEnd });
}

function assertBrowserEnv(lines, envLine, end, expectedBrowser, label) {
  const envIndent = yamlIndent(lines[envLine], `${label} env`);
  const envEnd = workflowBlockEnd(lines, envLine, envIndent, end, label);
  const browserPins = [];
  for (let index = envLine + 1; index < envEnd; index++) {
    if (/^CF_BROWSER\s*:/.test(lines[index].trim())) browserPins.push(index);
  }
  assert(browserPins.length === 1
    && yamlIndent(lines[browserPins[0]], `${label} CF_BROWSER`) === envIndent + 2
    && lines[browserPins[0]].trim() === `CF_BROWSER: ${expectedBrowser}`,
  `${label}: expected one exact direct CF_BROWSER: ${expectedBrowser}`);
  return Object.freeze({ envEnd, browserLine: browserPins[0] });
}

function assertStepBrowser(lines, start, end, stepIndent, expectedBrowser, label) {
  const envLines = exactIndentedWorkflowLines(lines, 'env:', stepIndent + 2, start + 1, end);
  const mentions = [];
  for (let index = start + 1; index < end; index++) {
    if (/\bCF_BROWSER\b/.test(lines[index].trim())) mentions.push(index);
  }
  if (expectedBrowser === null) {
    assert(envLines.length === 0 && mentions.length === 0,
      `${label}: inherited Edge CF_BROWSER must not be overridden in the step`);
    return null;
  }
  assert(envLines.length === 1, `${label}: expected one direct step environment mapping`);
  const browser = assertBrowserEnv(lines, envLines[0], end, expectedBrowser, label);
  assert(mentions.length === 1 && mentions[0] === browser.browserLine,
    `${label}: CF_BROWSER must be owned only by the direct step environment`);
  return Object.freeze({ envLine: envLines[0], ...browser });
}

export function assertCompendiumEdgeWorkflowContract(source, contract) {
  const label = contract?.relative || 'Compendium Edge workflow';
  assert(typeof source === 'string' && source.trim(), `${label}: workflow source is empty`);
  assert(contract && typeof contract.jobName === 'string'
    && typeof contract.jobBrowser === 'string'
    && typeof contract.preflightStepName === 'string'
    && Array.isArray(contract.preflightCommands)
    && typeof contract.executableCheck === 'string',
  `${label}: workflow contract configuration is invalid`);
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    yamlIndent(lines[index], `${label} line ${index + 1}`);
  }

  const { jobStart, jobEnd } = workflowJobBounds(lines, contract, label);
  assertNoWorkflowExecutionControls(
    lines, jobStart, jobEnd, 4, `${label} job ${contract.jobName}`,
  );
  const jobEnvLine = exactDirectLine(lines, 'env:', 4, jobStart + 1, jobEnd,
    `${label} job ${contract.jobName}`);
  assertBrowserEnv(lines, jobEnvLine, jobEnd, contract.jobBrowser,
    `${label} job ${contract.jobName}`);
  const stepsLine = exactDirectLine(lines, 'steps:', 4, jobStart + 1, jobEnd,
    `${label} job ${contract.jobName}`);
  assert(jobEnvLine < stepsLine,
    `${label}: owning job environment must be declared before its steps sequence`);
  const stepsEnd = workflowBlockEnd(lines, stepsLine, 4, jobEnd, label);
  const stepIndent = 6;

  const installHeader = `- name: ${EDGE_INSTALL_STEP_NAME}`;
  const globalInstallHeaders = exactWorkflowLines(lines, installHeader);
  const installHeaders = exactIndentedWorkflowLines(
    lines, installHeader, stepIndent, stepsLine + 1, stepsEnd,
  );
  assert(globalInstallHeaders.length === 1 && installHeaders.length === 1
    && globalInstallHeaders[0] === installHeaders[0],
  `${label}: exact Edge install step must belong to job ${contract.jobName}`);
  const installStart = installHeaders[0];
  const installEnd = workflowBlockEnd(lines, installStart, stepIndent, stepsEnd, label);
  assertNoWorkflowExecutionControls(
    lines, installStart, installEnd, stepIndent + 2, `${label} Edge install`,
  );
  assert(installEnd < stepsEnd,
    `${label}: exact Edge install step has no following preflight step`);

  const preflightHeader = `- name: ${contract.preflightStepName}`;
  const globalPreflightHeaders = exactWorkflowLines(lines, preflightHeader);
  const preflightHeaders = exactIndentedWorkflowLines(
    lines, preflightHeader, stepIndent, stepsLine + 1, stepsEnd,
  );
  assert(globalPreflightHeaders.length === 1 && preflightHeaders.length === 1
    && globalPreflightHeaders[0] === preflightHeaders[0]
    && preflightHeaders[0] === installEnd,
  `${label}: Compendium preflight must be the step immediately after exact Edge installation`);
  const preflightStart = preflightHeaders[0];
  const preflightEnd = workflowBlockEnd(lines, preflightStart, stepIndent, stepsEnd, label);
  assertNoWorkflowExecutionControls(
    lines, preflightStart, preflightEnd, stepIndent + 2, `${label} preflight`,
  );

  const certificationHeader = `- name: ${EDGE_CERTIFICATION_STEP_NAME}`;
  const globalCertificationHeaders = exactWorkflowLines(lines, certificationHeader);
  const certificationHeaders = exactIndentedWorkflowLines(
    lines, certificationHeader, stepIndent, stepsLine + 1, stepsEnd,
  );
  assert(globalCertificationHeaders.length === 1 && certificationHeaders.length === 1
    && globalCertificationHeaders[0] === certificationHeaders[0]
    && certificationHeaders[0] === preflightEnd,
  `${label}: one-attempt certification must be the step immediately after Compendium preflight`);
  const certificationStart = certificationHeaders[0];
  const certificationEnd = workflowBlockEnd(
    lines, certificationStart, stepIndent, stepsEnd, label,
  );
  assertNoWorkflowExecutionControls(
    lines, certificationStart, certificationEnd, stepIndent + 2, `${label} certification`,
  );

  const installShellLine = exactDirectLine(
    lines, 'shell: bash', stepIndent + 2, installStart + 1, installEnd, `${label} Edge install`,
  );
  const installEnvLine = exactDirectLine(
    lines, 'env:', stepIndent + 2, installStart + 1, installEnd, `${label} Edge install`,
  );
  const installRunLine = exactDirectLine(
    lines, 'run: |', stepIndent + 2, installStart + 1, installEnd, `${label} Edge install`,
  );
  assert(installShellLine < installEnvLine && installEnvLine < installRunLine,
    `${label}: Edge install shell, environment, and run blocks are out of order`);
  const installEnvEnd = workflowBlockEnd(
    lines, installEnvLine, stepIndent + 2, installEnd, `${label} Edge install`,
  );
  assert(installEnvEnd === installRunLine,
    `${label}: Edge package environment must be owned directly before the install run block`);
  assertExactBlockLines(lines, installEnvLine + 1, installEnvEnd, stepIndent + 4, [
    `EDGE_PACKAGE_URL: ${EDGE_PACKAGE_URL}`,
    `EDGE_PACKAGE_SHA256: ${EDGE_PACKAGE_SHA256}`,
  ], `${label} Edge install environment`);
  const installRunEnd = workflowBlockEnd(
    lines, installRunLine, stepIndent + 2, installEnd, `${label} Edge install`,
  );
  assert(installRunEnd === installEnd,
    `${label}: install run block must own all remaining step commands`);

  const installCommands = [];
  for (let index = installRunLine + 1; index < installRunEnd; index++) {
    if (yamlIndent(lines[index], `${label} install command`) === stepIndent + 4
      && /^sudo\s+apt-get\s+install\b/.test(lines[index].trim())) installCommands.push(index);
  }
  assert(installCommands.length === 1
    && lines[installCommands[0]].trim() === EDGE_REINSTALL_COMMAND,
  `${label}: owned Edge step must contain one exact reinstall command`);
  assert(exactWorkflowLines(lines, EDGE_REINSTALL_COMMAND).length === 1,
    `${label}: exact Edge reinstall command must occur once in the workflow`);
  assertExactBlockLines(lines, installRunLine + 1, installRunEnd, stepIndent + 4, [
    'set -euo pipefail',
    `edge_package="$RUNNER_TEMP/${EDGE_PACKAGE_FILENAME}"`,
    'curl --fail --location --silent --show-error "$EDGE_PACKAGE_URL" --output "$edge_package"',
    'printf \'%s  %s\\n\' "$EDGE_PACKAGE_SHA256" "$edge_package" | sha256sum --check --strict',
    EDGE_REINSTALL_COMMAND,
    `test "$(dpkg-query -W -f='\${Version}' microsoft-edge-stable)" = "${EDGE_PACKAGE_VERSION}"`,
    contract.executableCheck,
  ], `${label} Edge install run block`);

  const preflightWorkingLine = exactDirectLine(
    lines, 'working-directory: port/v2', stepIndent + 2,
    preflightStart + 1, preflightEnd, `${label} preflight`,
  );
  const preflightBrowser = assertStepBrowser(
    lines, preflightStart, preflightEnd, stepIndent, contract.preflightBrowser,
    `${label} preflight`,
  );
  const preflightRunLine = exactDirectLine(
    lines, 'run: |', stepIndent + 2, preflightStart + 1, preflightEnd, `${label} preflight`,
  );
  assert(preflightWorkingLine < (preflightBrowser?.envLine ?? preflightRunLine)
    && (preflightBrowser?.envLine ?? preflightWorkingLine) < preflightRunLine,
  `${label}: preflight working directory, Edge environment, and run block are out of order`);
  const preflightRunEnd = workflowBlockEnd(
    lines, preflightRunLine, stepIndent + 2, preflightEnd, `${label} preflight`,
  );
  assert(preflightRunEnd === preflightEnd,
    `${label}: preflight run block must own all remaining step commands`);
  assertExactBlockLines(
    lines, preflightRunLine + 1, preflightRunEnd, stepIndent + 4,
    contract.preflightCommands, `${label} preflight run block`,
  );

  const certificationWorkingLine = exactDirectLine(
    lines, 'working-directory: port/v2', stepIndent + 2,
    certificationStart + 1, certificationEnd, `${label} certification`,
  );
  const certificationBrowser = assertStepBrowser(
    lines, certificationStart, certificationEnd, stepIndent, contract.certificationBrowser,
    `${label} certification`,
  );
  const certificationRunLine = exactDirectLine(
    lines, 'run: npm run compendiummem', stepIndent + 2,
    certificationStart + 1, certificationEnd, `${label} certification`,
  );
  assert(certificationWorkingLine < (certificationBrowser?.envLine ?? certificationRunLine)
    && (certificationBrowser?.envLine ?? certificationWorkingLine) < certificationRunLine,
  `${label}: certification working directory, Edge environment, and command are out of order`);
  const directCertificationRuns = [];
  for (let index = certificationStart + 1; index < certificationEnd; index++) {
    if (yamlIndent(lines[index], `${label} certification line ${index + 1}`) === stepIndent + 2
      && /^run\s*:/.test(lines[index].trim())) directCertificationRuns.push(index);
  }
  assert(directCertificationRuns.length === 1
    && directCertificationRuns[0] === certificationRunLine,
  `${label}: certification must own only the exact npm run compendiummem command`);
  return Object.freeze({
    jobLine: jobStart + 1,
    installLine: installStart + 1,
    preflightLine: preflightStart + 1,
    certificationLine: certificationStart + 1,
  });
}

function removeWorkflowReinstall(source, label) {
  const lines = source.split(/\r?\n/);
  const matches = exactWorkflowLines(lines, EDGE_REINSTALL_COMMAND);
  assert(matches.length === 1,
    `SELFTEST ${label}: expected one exact reinstall command to mutate, found ${matches.length}`);
  lines[matches[0]] = lines[matches[0]].replace(' --reinstall', '');
  return lines.join('\n');
}

function injectWorkflowReinstallDecoy(source, label) {
  const lines = source.split(/\r?\n/);
  const installHeader = `- name: ${EDGE_INSTALL_STEP_NAME}`;
  const matches = exactWorkflowLines(lines, installHeader);
  assert(matches.length === 1,
    `SELFTEST ${label}: expected one exact install step for the decoy control`);
  const index = matches[0];
  const indent = (lines[index].match(/^[ ]*/) || [''])[0];
  lines.splice(index, 0,
    `${indent}- name: unrelated Edge reinstall decoy`,
    `${indent}  shell: bash`,
    `${indent}  run: |`,
    `${indent}    ${EDGE_REINSTALL_COMMAND}`);
  return lines.join('\n');
}

function moveWorkflowContractToWrongJob(source, contract, label) {
  const lines = source.split(/\r?\n/);
  const { jobStart } = workflowJobBounds(lines, contract, `SELFTEST ${label}`);
  assert(yamlIndent(lines[jobStart], `SELFTEST ${label} job`) === 2,
    `SELFTEST ${label}: owning job indentation changed`);
  lines[jobStart] = `  wrong-${contract.jobName}:`;
  lines.push(
    `  ${contract.jobName}:`,
    '    runs-on: ubuntu-latest',
    '    env:',
    `      CF_BROWSER: ${contract.jobBrowser}`,
    '    steps:',
    '      - name: unrelated expected-job step',
    '        run: echo unrelated');
  return lines.join('\n');
}

function injectWorkflowBlockScalarDecoy(source, label) {
  const lines = source.split(/\r?\n/);
  const installHeader = `- name: ${EDGE_INSTALL_STEP_NAME}`;
  const installHeaders = exactWorkflowLines(lines, installHeader);
  assert(installHeaders.length === 1,
    `SELFTEST ${label}: expected one exact install step for the block-scalar control`);
  const installStart = installHeaders[0];
  const installIndent = yamlIndent(lines[installStart], `SELFTEST ${label} install step`);
  const installEnd = workflowBlockEnd(
    lines, installStart, installIndent, lines.length, `SELFTEST ${label}`,
  );
  const download = 'curl --fail --location --silent --show-error "$EDGE_PACKAGE_URL" --output "$edge_package"';
  const downloadLines = exactIndentedWorkflowLines(
    lines, download, installIndent + 4, installStart + 1, installEnd,
  );
  assert(downloadLines.length === 1,
    `SELFTEST ${label}: expected one package download for the block-scalar control`);
  lines.splice(downloadLines[0], 0, `${' '.repeat(installIndent + 2)}decoy: |`);
  return lines.join('\n');
}

function injectWorkflowInterveningStep(source, label) {
  const lines = source.split(/\r?\n/);
  const certificationHeader = `- name: ${EDGE_CERTIFICATION_STEP_NAME}`;
  const certificationHeaders = exactWorkflowLines(lines, certificationHeader);
  assert(certificationHeaders.length === 1,
    `SELFTEST ${label}: expected one certification step for the adjacency control`);
  const index = certificationHeaders[0];
  const indent = (lines[index].match(/^[ ]*/) || [''])[0];
  lines.splice(index, 0,
    `${indent}- name: unrelated intervening step`,
    `${indent}  run: echo unrelated`);
  return lines.join('\n');
}

function mutateWorkflowJobBrowser(source, contract, label) {
  const lines = source.split(/\r?\n/);
  const { jobStart, jobEnd } = workflowJobBounds(lines, contract, `SELFTEST ${label}`);
  const envLine = exactDirectLine(
    lines, 'env:', 4, jobStart + 1, jobEnd, `SELFTEST ${label} job`,
  );
  const browser = assertBrowserEnv(
    lines, envLine, jobEnd, contract.jobBrowser, `SELFTEST ${label} job`,
  );
  const replacement = contract.jobBrowser === EDGE_BROWSER ? CHROME_BROWSER : EDGE_BROWSER;
  lines[browser.browserLine] = `      CF_BROWSER: ${replacement}`;
  return lines.join('\n');
}

function mutateWorkflowStepBrowser(source, stepName, expectedBrowser, runToken, label) {
  const lines = source.split(/\r?\n/);
  const stepHeader = `- name: ${stepName}`;
  const stepHeaders = exactWorkflowLines(lines, stepHeader);
  assert(stepHeaders.length === 1,
    `SELFTEST ${label}: expected one ${stepName} step for the browser control`);
  const stepStart = stepHeaders[0];
  const stepIndent = yamlIndent(lines[stepStart], `SELFTEST ${label} step`);
  const stepEnd = workflowBlockEnd(
    lines, stepStart, stepIndent, lines.length, `SELFTEST ${label}`,
  );
  if (expectedBrowser === null) {
    const runLine = exactDirectLine(
      lines, runToken, stepIndent + 2, stepStart + 1, stepEnd, `SELFTEST ${label}`,
    );
    lines.splice(runLine, 0,
      `${' '.repeat(stepIndent + 2)}env:`,
      `${' '.repeat(stepIndent + 4)}CF_BROWSER: ${CHROME_BROWSER}`);
    return lines.join('\n');
  }
  const envLine = exactDirectLine(
    lines, 'env:', stepIndent + 2, stepStart + 1, stepEnd, `SELFTEST ${label}`,
  );
  const browser = assertBrowserEnv(
    lines, envLine, stepEnd, expectedBrowser, `SELFTEST ${label}`,
  );
  const replacement = expectedBrowser === EDGE_BROWSER ? CHROME_BROWSER : EDGE_BROWSER;
  lines[browser.browserLine] = `${' '.repeat(stepIndent + 4)}CF_BROWSER: ${replacement}`;
  return lines.join('\n');
}

function injectWorkflowExecutionControl(source, contract, target, control, label) {
  const lines = source.split(/\r?\n/);
  let start;
  let indent;
  if (target === 'job') {
    ({ jobStart: start } = workflowJobBounds(lines, contract, `SELFTEST ${label}`));
    indent = 4;
  } else {
    const stepName = target === 'install'
      ? EDGE_INSTALL_STEP_NAME
      : target === 'preflight'
        ? contract.preflightStepName
        : EDGE_CERTIFICATION_STEP_NAME;
    const matches = exactWorkflowLines(lines, `- name: ${stepName}`);
    assert(matches.length === 1,
      `SELFTEST ${label}: expected one ${target} owner for execution-control mutation`);
    start = matches[0];
    indent = yamlIndent(lines[start], `SELFTEST ${label} ${target}`) + 2;
  }
  lines.splice(start + 1, 0, `${' '.repeat(indent)}${control}`);
  return lines.join('\n');
}

function createDeadlineSignal(deadlineMs, { readNow, setTimer, clearTimer }) {
  assert(Number.isFinite(deadlineMs) && typeof readNow === 'function'
    && typeof setTimer === 'function' && typeof clearTimer === 'function',
  'Compendium browser preflight deadline dependencies are invalid');
  let active = true;
  let timer = null;
  let resolveSignal;
  const promise = new Promise((resolve) => { resolveSignal = resolve; });
  const observe = () => {
    if (!active) return;
    const observedAtMs = readNow();
    const remainingMs = deadlineMs - observedAtMs;
    if (remainingMs > 0) {
      timer = setTimer(observe, Math.max(1, Math.ceil(remainingMs)));
      return;
    }
    active = false;
    timer = null;
    resolveSignal(Object.freeze({ kind: 'deadline', receivedAtMs: observedAtMs }));
  };
  observe();
  return Object.freeze({
    promise,
    cancel() {
      if (!active) return;
      active = false;
      if (timer !== null) clearTimer(timer);
      timer = null;
    },
  });
}

function ownedProfiles(prefix) {
  const temporary = fs.realpathSync(os.tmpdir());
  const stem = `${prefix}-${process.pid}-`;
  return fs.readdirSync(temporary).filter((name) => name.startsWith(stem));
}

function assertNoOwnedProfiles(prefix, where) {
  const profiles = ownedProfiles(prefix);
  assert(profiles.length === 0,
    `${where}: browser profiles leaked (${profiles.join(', ')})`);
}

function preflightOptions({ profilePrefix, onEvent }) {
  assert(typeof profilePrefix === 'string' && profilePrefix.length > 0,
    'Compendium browser preflight profile prefix is invalid');
  assert(typeof onEvent === 'function',
    'Compendium browser preflight event owner is invalid');
  return compendiumCdpOptions('candidate', {
    label: PREFLIGHT_LABEL,
    userDataPrefix: profilePrefix,
    webSocketOpenTimeoutMs: PREFLIGHT_SOCKET_TIMEOUT_MS,
    startupTimeoutMs: PREFLIGHT_STARTUP_TIMEOUT_MS,
    shutdownTimeoutMs: PREFLIGHT_SHUTDOWN_TIMEOUT_MS,
    onEvent,
  });
}

export async function runCompendiumBrowserPreflight({
  openCdp = openChromiumCdp,
  selectedExecutable = findChromiumBrowser(),
  expectedAuthority,
  profilePrefix = PREFLIGHT_PROFILE_PREFIX,
  nonce = crypto.randomBytes(8).toString('hex'),
  now = () => performance.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  assert(typeof openCdp === 'function', 'Compendium browser preflight opener is invalid');
  assert(typeof selectedExecutable === 'string' && selectedExecutable.length > 0,
    'Compendium browser preflight selected executable is invalid');
  assert(validCompendiumBrowserAuthority(expectedAuthority),
    'Compendium browser preflight expected authority is invalid');
  assert(typeof nonce === 'string' && /^[a-z0-9-]+$/i.test(nonce),
    'Compendium browser preflight nonce is invalid');
  assert(typeof now === 'function' && typeof setTimer === 'function'
    && typeof clearTimer === 'function',
  'Compendium browser preflight phase clock is invalid');

  const marker = `cf-compendiummem-edge-preflight-${nonce}`;
  let lastNowMs = Number.NEGATIVE_INFINITY;
  const readNow = () => {
    const value = now();
    assert(Number.isFinite(value) && value >= lastNowMs,
      'Compendium browser preflight phase clock is not monotonic');
    lastNowMs = value;
    return value;
  };
  let activeEventPhase = null;
  const options = preflightOptions({
    profilePrefix,
    onEvent(event) {
      if (activeEventPhase === null
        || event?.method !== 'Runtime.consoleAPICalled'
        || event.sessionId !== activeEventPhase.sessionId
        || !Array.isArray(event.params?.args)
        || !event.params.args.some((argument) => argument?.value === marker)) return;
      const receivedAtMs = readNow();
      if (activeEventPhase.receipt !== null) return;
      activeEventPhase.receipt = Object.freeze({
        kind: 'event',
        receivedAtMs,
      });
      activeEventPhase.resolve(activeEventPhase.receipt);
    },
  });
  let connection = null;
  try {
    /* Exactly one opener call. A failure is terminal; there is no retry,
       relaunch, fallback, sleep-before-launch, or alternate browser. */
    connection = await openCdp(options);
    assert(connection && typeof connection.send === 'function'
      && typeof connection.close === 'function',
    'Compendium browser preflight opener returned an invalid connection');
    assert(connection.browser?.executable === portable(selectedExecutable),
      `Compendium browser preflight executable mismatch: expected ${portable(selectedExecutable)}, got ${String(connection.browser?.executable)}`);
    assert(compendiumBrowserAuthorityMatches(connection.browser, expectedAuthority),
      'Compendium browser preflight browser does not match the Arc 1A compatibility authority');

    const target = await connection.send('Target.createTarget', { url: 'about:blank' });
    assert(typeof target?.targetId === 'string' && target.targetId.length > 0,
      'Compendium browser preflight did not create a fresh target');
    const attached = await connection.send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    });
    assert(typeof attached?.sessionId === 'string' && attached.sessionId.length > 0,
      'Compendium browser preflight did not attach the fresh target');
    await connection.send('Runtime.enable', {}, attached.sessionId);
    await connection.send('Page.enable', {}, attached.sessionId);
    await connection.send('HeapProfiler.enable', {}, attached.sessionId);
    const phaseStartedAtMs = readNow();
    const phaseDeadlineMs = phaseStartedAtMs + CANDIDATE_TRANSPORT_TIMEOUT_MS;
    let resolveEvent;
    const eventPromise = new Promise((resolve) => { resolveEvent = resolve; });
    activeEventPhase = {
      sessionId: attached.sessionId,
      receipt: null,
      resolve: resolveEvent,
    };
    const evaluated = await connection.send('Runtime.evaluate', {
      expression: `(()=>{console.log(${JSON.stringify(marker)});return ${JSON.stringify(PREFLIGHT_SENTINEL)}})()`,
      returnByValue: true,
    }, attached.sessionId, { timeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS });
    const evaluateReceivedAtMs = readNow();
    assert(evaluateReceivedAtMs < phaseDeadlineMs,
      'Compendium browser preflight Runtime.evaluate receipt was not strictly before the phase deadline');
    assert(!evaluated?.exceptionDetails
      && evaluated?.result?.value === PREFLIGHT_SENTINEL,
    'Compendium browser preflight Runtime.evaluate sentinel was not returned');
    let eventReceipt = activeEventPhase.receipt;
    if (eventReceipt === null) {
      const deadlineSignal = createDeadlineSignal(phaseDeadlineMs, {
        readNow, setTimer, clearTimer,
      });
      try {
        const joined = await Promise.race([eventPromise, deadlineSignal.promise]);
        if (joined.kind === 'event') eventReceipt = joined;
      } finally {
        deadlineSignal.cancel();
      }
    }
    activeEventPhase = null;
    assert(eventReceipt !== null,
      'Compendium browser preflight Runtime event sentinel was not observed before the phase deadline');
    assert(eventReceipt.receivedAtMs >= phaseStartedAtMs
      && eventReceipt.receivedAtMs < phaseDeadlineMs,
    'Compendium browser preflight Runtime event receipt was not strictly before the phase deadline');
    const closedTarget = await connection.send('Target.closeTarget', {
      targetId: target.targetId,
    });
    assert(closedTarget?.success === true,
      'Compendium browser preflight fresh target did not close');
    return Object.freeze({
      browser: connection.browser,
      marker,
      commandTimeoutMs: options.commandTimeoutMs,
      phase: Object.freeze({
        startedAtMs: phaseStartedAtMs,
        deadlineMs: phaseDeadlineMs,
        evaluateReceivedAtMs,
        eventReceivedAtMs: eventReceipt.receivedAtMs,
      }),
    });
  } finally {
    activeEventPhase = null;
    try {
      if (connection !== null) await connection.close();
    } finally {
      assertNoOwnedProfiles(profilePrefix, 'Compendium browser preflight cleanup');
    }
  }
}

async function expectRejected(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message),
    `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

function selftestAuthority() {
  const authority = compendiumBrowserAuthority({
    product: 'Edg/151.0.4129.101', revision: '@selftest-edge-revision',
    jsVersion: '15.1.23.9', protocolVersion: '1.3',
  });
  assert(validCompendiumBrowserAuthority(authority)
    && authority.schema === COMPENDIUM_BROWSER_AUTHORITY_SCHEMA
    && authority.scope === COMPENDIUM_BROWSER_AUTHORITY_SCOPE
    && authority.capabilityContractSha256
      === COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256,
  'SELFTEST could not derive the browser compatibility authority');
  return authority;
}

function selftestBrowser(authority, executable, overrides = {}) {
  assert(validCompendiumBrowserAuthority(authority),
    'SELFTEST fake browser received an invalid compatibility authority');
  return Object.freeze({
    executable: portable(executable),
    product: 'Edg/151.0.4129.101',
    revision: '@selftest-edge-revision',
    user_agent: 'cf-compendiummem-edge-preflight-selftest',
    js_version: '15.1.23.9',
    protocol_version: '1.3',
    ...overrides,
  });
}

function removeSelftestProfile(directory, profilePrefix) {
  const temporary = fs.realpathSync(os.tmpdir());
  const resolved = path.resolve(directory);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === temporary
    && path.basename(resolved).startsWith(`${profilePrefix}-${process.pid}-`)
    && stat.isDirectory() && !stat.isSymbolicLink(),
  `SELFTEST refusing unsafe profile cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true });
}

function fakeOpener({
  authority,
  executable,
  browserOverrides = {},
  failMethod = null,
  sentinel = PREFLIGHT_SENTINEL,
  eventMarker = null,
  eventSessionId = 'selftest-session',
  phaseClock = null,
  eventAtMs = null,
  evaluateReceiptAtMs = null,
  profilePrefix,
  createProfile = false,
  retainProfile = false,
}) {
  const state = {
    calls: 0,
    closeCalls: 0,
    options: null,
    commands: [],
    profile: null,
    emitEvent: null,
  };
  const opener = async (options) => {
    state.calls += 1;
    state.options = options;
    assert(state.calls === 1, 'SELFTEST fake opener was retried');
    if (createProfile) {
      const temporary = fs.realpathSync(os.tmpdir());
      state.profile = path.join(temporary,
        `${profilePrefix}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`);
      fs.mkdirSync(state.profile);
    }
    let closed = false;
    state.emitEvent = (marker, sessionId = eventSessionId) => options.onEvent({
      method: 'Runtime.consoleAPICalled',
      sessionId,
      params: { args: [{ value: marker }] },
    });
    return {
      browser: selftestBrowser(authority, executable, browserOverrides),
      async send(method, params = {}, sessionId, commandOptions = {}) {
        state.commands.push({ method, params, sessionId, commandOptions });
        if (method === failMethod) throw new Error(`injected ${method} failure`);
        if (method === 'Target.createTarget') return { targetId: 'selftest-target' };
        if (method === 'Target.attachToTarget') return { sessionId: 'selftest-session' };
        if (method === 'Runtime.evaluate') {
          if (phaseClock !== null && eventAtMs !== null) phaseClock.value = eventAtMs;
          if (eventMarker !== null) state.emitEvent(eventMarker);
          if (phaseClock !== null && evaluateReceiptAtMs !== null) {
            assert(evaluateReceiptAtMs >= phaseClock.value,
              'SELFTEST evaluate receipt moved the clock backwards');
            phaseClock.value = evaluateReceiptAtMs;
          }
          return { result: { value: sentinel } };
        }
        if (method === 'Target.closeTarget') return { success: true };
        return {};
      },
      async close() {
        assert(!closed, 'SELFTEST connection was closed more than once');
        closed = true;
        state.closeCalls += 1;
        if (state.profile !== null && !retainProfile) {
          removeSelftestProfile(state.profile, profilePrefix);
          state.profile = null;
        }
      },
    };
  };
  return { opener, state };
}

function selftestClock(initialValue = 0) {
  const clock = { value: initialValue };
  return Object.freeze({
    clock,
    now: () => clock.value,
  });
}

function selftestDeadlineTimers({
  clock,
  openerState,
  eventAtMs = null,
  eventMarker = null,
}) {
  const state = { setCalls: 0, clearCalls: 0 };
  return Object.freeze({
    state,
    setTimer(callback, delayMs) {
      state.setCalls += 1;
      assert(Number.isInteger(delayMs) && delayMs > 0,
        'SELFTEST deadline timer received an invalid delay');
      const scheduledAtMs = clock.value + delayMs;
      if (eventAtMs !== null) {
        assert(eventAtMs >= clock.value,
          'SELFTEST event receipt moved the clock backwards');
        clock.value = eventAtMs;
        openerState.emitEvent(eventMarker);
      }
      if (clock.value < scheduledAtMs) clock.value = scheduledAtMs;
      callback();
      return state.setCalls;
    },
    clearTimer() { state.clearCalls += 1; },
  });
}

async function runSelftest() {
  for (const contract of EDGE_WORKFLOW_CONTRACTS) {
    const source = fs.readFileSync(path.join(repoRoot, contract.relative), 'utf8');
    assertCompendiumEdgeWorkflowContract(source, contract);

    const wrongJob = moveWorkflowContractToWrongJob(source, contract, contract.relative);
    await expectRejected(`${contract.relative} wrong owning job`,
      () => assertCompendiumEdgeWorkflowContract(wrongJob, contract),
      /exact Edge install step must belong to job/);

    const withoutReinstall = removeWorkflowReinstall(source, contract.relative);
    await expectRejected(`${contract.relative} reinstall removal`,
      () => assertCompendiumEdgeWorkflowContract(withoutReinstall, contract),
      /exact reinstall command/);
    const decoyOutsideStep = injectWorkflowReinstallDecoy(withoutReinstall, contract.relative);
    await expectRejected(`${contract.relative} reinstall decoy outside owned step`,
      () => assertCompendiumEdgeWorkflowContract(decoyOutsideStep, contract),
      /exact reinstall command/);

    const blockScalarDecoy = injectWorkflowBlockScalarDecoy(source, contract.relative);
    await expectRejected(`${contract.relative} install block-scalar decoy`,
      () => assertCompendiumEdgeWorkflowContract(blockScalarDecoy, contract),
      /install run block must own all remaining step commands/);

    const interveningStep = injectWorkflowInterveningStep(source, contract.relative);
    await expectRejected(`${contract.relative} intervening certification step`,
      () => assertCompendiumEdgeWorkflowContract(interveningStep, contract),
      /certification must be the step immediately after Compendium preflight/);

    const wrongJobBrowser = mutateWorkflowJobBrowser(source, contract, contract.relative);
    await expectRejected(`${contract.relative} wrong job CF_BROWSER`,
      () => assertCompendiumEdgeWorkflowContract(wrongJobBrowser, contract),
      /expected one exact direct CF_BROWSER/);

    const wrongPreflightBrowser = mutateWorkflowStepBrowser(
      source, contract.preflightStepName, contract.preflightBrowser, 'run: |',
      `${contract.relative} preflight`,
    );
    await expectRejected(`${contract.relative} wrong preflight CF_BROWSER`,
      () => assertCompendiumEdgeWorkflowContract(wrongPreflightBrowser, contract),
      contract.preflightBrowser === null
        ? /preflight: inherited Edge CF_BROWSER must not be overridden/
        : /preflight: expected one exact direct CF_BROWSER/);

    const wrongCertificationBrowser = mutateWorkflowStepBrowser(
      source, EDGE_CERTIFICATION_STEP_NAME, contract.certificationBrowser,
      'run: npm run compendiummem', `${contract.relative} certification`,
    );
    await expectRejected(`${contract.relative} wrong certification CF_BROWSER`,
      () => assertCompendiumEdgeWorkflowContract(wrongCertificationBrowser, contract),
      contract.certificationBrowser === null
        ? /certification: inherited Edge CF_BROWSER must not be overridden/
        : /certification: expected one exact direct CF_BROWSER/);

    for (const target of ['job', 'install', 'preflight', 'certification']) {
      for (const control of ['if: false', 'continue-on-error: true']) {
        const softened = injectWorkflowExecutionControl(
          source, contract, target, control, `${contract.relative} ${target} ${control}`,
        );
        await expectRejected(`${contract.relative} ${target} ${control}`,
          () => assertCompendiumEdgeWorkflowContract(softened, contract),
          /execution-control keys may not skip or soften/);
      }
    }
  }

  const authority = selftestAuthority();
  const executable = portable(path.join(fs.realpathSync(os.tmpdir()), 'selftest-edge'));
  const nonce = 'selftest-success';
  const marker = `cf-compendiummem-edge-preflight-${nonce}`;
  const successClock = selftestClock();
  const successPrefix = 'cf-compendiummem-edge-preflight-selftest-success';
  const success = fakeOpener({
    authority, executable, profilePrefix: successPrefix,
    createProfile: true, eventMarker: marker,
    phaseClock: successClock.clock, eventAtMs: 100, evaluateReceiptAtMs: 100,
  });
  const result = await runCompendiumBrowserPreflight({
    openCdp: success.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: successPrefix,
    nonce,
    now: successClock.now,
  });
  assert(result.commandTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS,
    'SELFTEST preflight did not retain the sealed candidate transport ceiling');
  assert(result.phase.startedAtMs === 0
    && result.phase.deadlineMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && result.phase.evaluateReceivedAtMs === 100
    && result.phase.eventReceivedAtMs === 100,
  `SELFTEST successful phase authority drifted (${JSON.stringify(result.phase)})`);
  assert(success.state.calls === 1 && success.state.closeCalls === 1,
    'SELFTEST successful preflight did not open and close exactly once');
  const captured = success.state.options;
  assert(JSON.stringify(Object.keys(captured).sort()) === JSON.stringify(PREFLIGHT_OPTION_KEYS),
    `SELFTEST preflight option keys drifted (${JSON.stringify(Object.keys(captured).sort())})`);
  assert(captured.label === PREFLIGHT_LABEL
    && captured.userDataPrefix === successPrefix
    && captured.startupTimeoutMs === PREFLIGHT_STARTUP_TIMEOUT_MS
    && captured.webSocketOpenTimeoutMs === PREFLIGHT_SOCKET_TIMEOUT_MS
    && captured.commandTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && captured.shutdownTimeoutMs === PREFLIGHT_SHUTDOWN_TIMEOUT_MS
    && typeof captured.onEvent === 'function',
  `SELFTEST preflight options drifted (${JSON.stringify(captured)})`);
  assert(JSON.stringify(success.state.commands.map((command) => command.method))
    === JSON.stringify([
      'Target.createTarget', 'Target.attachToTarget', 'Runtime.enable',
      'Page.enable', 'HeapProfiler.enable', 'Runtime.evaluate', 'Target.closeTarget',
    ]),
  `SELFTEST preflight command order drifted (${JSON.stringify(success.state.commands)})`);
  assert(JSON.stringify(success.state.commands[0]?.params) === JSON.stringify({ url: 'about:blank' })
    && JSON.stringify(success.state.commands[1]?.params)
      === JSON.stringify({ targetId: 'selftest-target', flatten: true })
    && success.state.commands[5]?.params?.returnByValue === true
    && success.state.commands[5]?.params?.expression?.includes(marker)
    && JSON.stringify(success.state.commands[5]?.commandOptions)
      === JSON.stringify({ timeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS })
    && JSON.stringify(success.state.commands[6]?.params)
      === JSON.stringify({ targetId: 'selftest-target' }),
  'SELFTEST fresh-target, evaluate, or close parameters drifted');
  assert(success.state.commands.slice(2, 6).every((command) =>
    command.sessionId === 'selftest-session'),
  'SELFTEST target-domain commands escaped the fresh attached session');
  assertNoOwnedProfiles(successPrefix, 'SELFTEST successful cleanup');

  for (const variant of [
    {
      key: 'installed-107', product: 'Edg/151.0.4129.107',
      revision: '@selftest-edge-107', jsVersion: '15.1.24.1',
    },
    {
      key: 'future', product: 'Edg/999.42.7.3',
      revision: '@selftest-edge-future', jsVersion: '99.42.7.3',
    },
  ]) {
    const variantClock = selftestClock();
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-${variant.key}`;
    const variantNonce = `compatible-${variant.key}`;
    const variantMarker = `cf-compendiummem-edge-preflight-${variantNonce}`;
    const compatible = fakeOpener({
      authority, executable, profilePrefix, eventMarker: variantMarker,
      phaseClock: variantClock.clock, eventAtMs: 100, evaluateReceiptAtMs: 100,
      browserOverrides: {
        product: variant.product, revision: variant.revision,
        js_version: variant.jsVersion,
      },
    });
    const compatibleResult = await runCompendiumBrowserPreflight({
      openCdp: compatible.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix,
      nonce: variantNonce,
      now: variantClock.now,
    });
    assert(compatibleResult.browser.product === variant.product
      && compatibleResult.browser.revision === variant.revision
      && compatibleResult.browser.js_version === variant.jsVersion
      && compatible.state.calls === 1 && compatible.state.closeCalls === 1,
    `SELFTEST compatible ${variant.product} provenance was rejected or retried`);
  }

  const evaluateBoundaryScenarios = [
    { key: 'just-before', evaluateAtMs: 4_999, accepted: true },
    { key: 'exact', evaluateAtMs: 5_000, accepted: false },
    { key: 'just-late', evaluateAtMs: 5_001, accepted: false },
  ];
  for (const scenario of evaluateBoundaryScenarios) {
    const boundaryClock = selftestClock();
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-evaluate-${scenario.key}`;
    const boundaryNonce = `evaluate-${scenario.key}`;
    const boundaryMarker = `cf-compendiummem-edge-preflight-${boundaryNonce}`;
    const boundary = fakeOpener({
      authority, executable, profilePrefix, eventMarker: boundaryMarker,
      phaseClock: boundaryClock.clock, eventAtMs: 100,
      evaluateReceiptAtMs: scenario.evaluateAtMs,
    });
    const work = () => runCompendiumBrowserPreflight({
      openCdp: boundary.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix,
      nonce: boundaryNonce,
      now: boundaryClock.now,
    });
    if (scenario.accepted) {
      const boundaryResult = await work();
      assert(boundaryResult.phase.evaluateReceivedAtMs === scenario.evaluateAtMs
        && boundaryResult.phase.eventReceivedAtMs === 100,
      `SELFTEST ${scenario.key} evaluate receipts drifted (${JSON.stringify(boundaryResult.phase)})`);
    } else {
      await expectRejected(`${scenario.key} evaluate receipt`, work,
        /Runtime\.evaluate receipt was not strictly before the phase deadline/);
    }
    assert(boundary.state.calls === 1 && boundary.state.closeCalls === 1,
      `SELFTEST ${scenario.key} evaluate boundary retried or failed to close`);
  }

  const authorityMismatchCases = [
    ['chrome-family', { product: 'Chrome/151.0.4129.101' }],
    ['malformed-edge-product', { product: 'Edg/151.0.4129' }],
    ['missing-product', { product: '' }],
    ['missing-revision', { revision: '' }],
    ['missing-js-version', { js_version: '' }],
    ['protocol-version', { protocol_version: '9.9' }],
  ];
  for (const [field, browserOverrides] of authorityMismatchCases) {
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-${field.toLowerCase()}`;
    const mismatch = fakeOpener({
      authority, executable, browserOverrides, profilePrefix,
      eventMarker: `cf-compendiummem-edge-preflight-${field}`,
    });
    await expectRejected(`${field} authority mismatch`, () =>
      runCompendiumBrowserPreflight({
        openCdp: mismatch.opener,
        selectedExecutable: executable,
        expectedAuthority: authority,
        profilePrefix,
        nonce: field,
      }), /does not match the Arc 1A compatibility authority/);
    assert(mismatch.state.calls === 1 && mismatch.state.closeCalls === 1,
      `SELFTEST ${field} mismatch retried or failed to close`);
  }

  const executableMismatchPrefix = 'cf-compendiummem-edge-preflight-selftest-executable';
  const executableMismatch = fakeOpener({
    authority, executable, profilePrefix: executableMismatchPrefix,
    browserOverrides: { executable: '/wrong/edge' },
    eventMarker: 'cf-compendiummem-edge-preflight-executable',
  });
  await expectRejected('executable mismatch', () => runCompendiumBrowserPreflight({
    openCdp: executableMismatch.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: executableMismatchPrefix,
    nonce: 'executable',
  }), /executable mismatch/);
  assert(executableMismatch.state.calls === 1 && executableMismatch.state.closeCalls === 1,
    'SELFTEST executable mismatch retried or failed to close');

  const setupFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-setup-failure';
  const setupFailure = fakeOpener({
    authority, executable, profilePrefix: setupFailurePrefix,
    failMethod: 'Runtime.enable',
    eventMarker: 'cf-compendiummem-edge-preflight-setup-failure',
  });
  await expectRejected('setup failure', () => runCompendiumBrowserPreflight({
    openCdp: setupFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: setupFailurePrefix,
    nonce: 'setup-failure',
  }), /injected Runtime\.enable failure/);
  assert(setupFailure.state.calls === 1 && setupFailure.state.closeCalls === 1,
    'SELFTEST setup failure retried or failed to close exactly once');

  const sentinelFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-sentinel';
  const sentinelFailure = fakeOpener({
    authority, executable, profilePrefix: sentinelFailurePrefix,
    sentinel: 'wrong-sentinel',
    eventMarker: 'cf-compendiummem-edge-preflight-sentinel-failure',
  });
  await expectRejected('evaluate sentinel failure', () => runCompendiumBrowserPreflight({
    openCdp: sentinelFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: sentinelFailurePrefix,
    nonce: 'sentinel-failure',
  }), /Runtime\.evaluate sentinel was not returned/);
  assert(sentinelFailure.state.calls === 1 && sentinelFailure.state.closeCalls === 1,
    'SELFTEST evaluate sentinel failure retried or failed to close');

  const eventFailureClock = selftestClock();
  const eventFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-event';
  const eventFailure = fakeOpener({
    authority, executable, profilePrefix: eventFailurePrefix,
    eventMarker: 'wrong-event-marker', phaseClock: eventFailureClock.clock,
    eventAtMs: 100, evaluateReceiptAtMs: 100,
  });
  const eventFailureTimers = selftestDeadlineTimers({
    clock: eventFailureClock.clock,
    openerState: eventFailure.state,
  });
  await expectRejected('wrong event sentinel', () => runCompendiumBrowserPreflight({
    openCdp: eventFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: eventFailurePrefix,
    nonce: 'event-failure',
    now: eventFailureClock.now,
    setTimer: eventFailureTimers.setTimer,
    clearTimer: eventFailureTimers.clearTimer,
  }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(eventFailure.state.calls === 1 && eventFailure.state.closeCalls === 1
    && eventFailureTimers.state.setCalls === 1,
  'SELFTEST wrong-event failure retried, slept, or failed to close');

  const wrongSessionClock = selftestClock();
  const wrongSessionPrefix = 'cf-compendiummem-edge-preflight-selftest-wrong-session';
  const wrongSessionMarker = 'cf-compendiummem-edge-preflight-wrong-session';
  const wrongSession = fakeOpener({
    authority, executable, profilePrefix: wrongSessionPrefix,
    eventMarker: wrongSessionMarker, eventSessionId: 'wrong-selftest-session',
    phaseClock: wrongSessionClock.clock, eventAtMs: 100,
    evaluateReceiptAtMs: 100,
  });
  const wrongSessionTimers = selftestDeadlineTimers({
    clock: wrongSessionClock.clock,
    openerState: wrongSession.state,
  });
  await expectRejected('same marker on wrong session', () =>
    runCompendiumBrowserPreflight({
      openCdp: wrongSession.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix: wrongSessionPrefix,
      nonce: 'wrong-session',
      now: wrongSessionClock.now,
      setTimer: wrongSessionTimers.setTimer,
      clearTimer: wrongSessionTimers.clearTimer,
    }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(wrongSession.state.calls === 1 && wrongSession.state.closeCalls === 1
    && wrongSessionTimers.state.setCalls === 1,
  'SELFTEST wrong-session failure retried, slept, or failed to close');

  const missingEventClock = selftestClock();
  const missingEventPrefix = 'cf-compendiummem-edge-preflight-selftest-missing-event';
  const missingEvent = fakeOpener({
    authority, executable, profilePrefix: missingEventPrefix,
    phaseClock: missingEventClock.clock, evaluateReceiptAtMs: 100,
  });
  const missingEventTimers = selftestDeadlineTimers({
    clock: missingEventClock.clock,
    openerState: missingEvent.state,
  });
  await expectRejected('missing event sentinel', () => runCompendiumBrowserPreflight({
    openCdp: missingEvent.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: missingEventPrefix,
    nonce: 'missing-event',
    now: missingEventClock.now,
    setTimer: missingEventTimers.setTimer,
    clearTimer: missingEventTimers.clearTimer,
  }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(missingEvent.state.calls === 1 && missingEvent.state.closeCalls === 1
    && missingEventTimers.state.setCalls === 1,
  'SELFTEST missing-event failure retried, slept, or failed to close');

  const backwardClockPrefix = 'cf-compendiummem-edge-preflight-selftest-backward-clock';
  const backwardClock = fakeOpener({
    authority, executable, profilePrefix: backwardClockPrefix,
  });
  const backwardReads = [0, 100, 99];
  await expectRejected('backward phase clock', () => runCompendiumBrowserPreflight({
    openCdp: backwardClock.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: backwardClockPrefix,
    nonce: 'backward-clock',
    now: () => backwardReads.shift(),
    setTimer: () => { throw new Error('SELFTEST backward clock reached a timer'); },
    clearTimer: () => {},
  }), /phase clock is not monotonic/);
  assert(backwardClock.state.calls === 1 && backwardClock.state.closeCalls === 1,
    'SELFTEST backward-clock failure retried or failed to close');

  const eventBoundaryScenarios = [
    { key: 'just-before', eventAtMs: 4_999, accepted: true },
    { key: 'exact', eventAtMs: 5_000, accepted: false },
    { key: 'just-late', eventAtMs: 5_001, accepted: false },
  ];
  for (const scenario of eventBoundaryScenarios) {
    const boundaryClock = selftestClock();
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-${scenario.key}`;
    const boundaryNonce = `event-${scenario.key}`;
    const boundaryMarker = `cf-compendiummem-edge-preflight-${boundaryNonce}`;
    const boundary = fakeOpener({
      authority, executable, profilePrefix,
      phaseClock: boundaryClock.clock, evaluateReceiptAtMs: 100,
    });
    const boundaryTimers = selftestDeadlineTimers({
      clock: boundaryClock.clock,
      openerState: boundary.state,
      eventAtMs: scenario.eventAtMs,
      eventMarker: boundaryMarker,
    });
    const work = () => runCompendiumBrowserPreflight({
      openCdp: boundary.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix,
      nonce: boundaryNonce,
      now: boundaryClock.now,
      setTimer: boundaryTimers.setTimer,
      clearTimer: boundaryTimers.clearTimer,
    });
    if (scenario.accepted) {
      const boundaryResult = await work();
      assert(boundaryResult.phase.evaluateReceivedAtMs === 100
        && boundaryResult.phase.eventReceivedAtMs === scenario.eventAtMs,
      `SELFTEST ${scenario.key} event receipts drifted (${JSON.stringify(boundaryResult.phase)})`);
    } else {
      await expectRejected(`${scenario.key} event receipt`, work,
        /Runtime event receipt was not strictly before the phase deadline/);
    }
    assert(boundary.state.calls === 1 && boundary.state.closeCalls === 1
      && boundaryTimers.state.setCalls === 1,
    `SELFTEST ${scenario.key} event boundary retried, slept, or failed to close`);
  }

  const leakPrefix = 'cf-compendiummem-edge-preflight-selftest-leak';
  const leak = fakeOpener({
    authority, executable, profilePrefix: leakPrefix,
    createProfile: true, retainProfile: true,
    eventMarker: 'cf-compendiummem-edge-preflight-leak',
  });
  try {
    await expectRejected('profile leak', () => runCompendiumBrowserPreflight({
      openCdp: leak.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix: leakPrefix,
      nonce: 'leak',
    }), /browser profiles leaked/);
  } finally {
    if (leak.state.profile !== null) {
      removeSelftestProfile(leak.state.profile, leakPrefix);
      leak.state.profile = null;
    }
  }
  assert(leak.state.calls === 1 && leak.state.closeCalls === 1,
    'SELFTEST profile-leak control retried or failed to close');
  assertNoOwnedProfiles(leakPrefix, 'SELFTEST leak-control cleanup');

  console.log('COMPENDIUM BROWSER PREFLIGHT SELFTEST PASS');
  console.log('  exact job/step/block ownership, Edge environments, and install → preflight → certification ordering: PASS');
  console.log('  per-workflow reinstall removal and outside-step decoys: rejected');
  console.log('  wrong-job/block-scalar/intervening-step/CF_BROWSER controls: rejected');
  console.log('  job/install/preflight/certification skip and soft-fail controls: rejected');
  console.log('  exact options 45s startup / 15s socket / 5s command / 2s shutdown: PASS');
  console.log('  one opener call, fresh target/domain order, evaluate result and event: PASS');
  console.log('  Edge .101/.107/future versions: compatible; exact build fields retained as provenance');
  console.log('  Chrome/malformed/incomplete/protocol-incompatible browsers and executable mismatch: rejected');
  console.log('  preflight proves its prerequisite subset; the full collector exercises the sealed CDP inventory');
  console.log('  one immutable 5s evaluate+event phase; just-before/exact/late receipts: PASS/rejected/rejected');
  console.log('  setup/sentinel/missing-event/wrong-marker/wrong-session/backward-clock failures: terminal, one close, no retry');
  console.log('  owned profile cleanup and deliberate leak control: PASS');
}

async function runLive() {
  const budget = readJson(budgetPath);
  assert(budget.status === 'active',
    'Compendium browser preflight requires the active numeric budget');
  const authority = compendiumBudgetBrowserAuthority(budget);
  assert(validCompendiumBrowserAuthority(authority),
    'Compendium browser preflight budget has no Arc 1A Edge compatibility authority');
  const result = await runCompendiumBrowserPreflight({ expectedAuthority: authority });
  console.log('COMPENDIUM BROWSER PREFLIGHT PASS');
  console.log(JSON.stringify({
    browser: result.browser,
    authority,
    policy: {
      attemptCount: 1,
      automaticRetries: 0,
      startupTimeoutMs: PREFLIGHT_STARTUP_TIMEOUT_MS,
      webSocketOpenTimeoutMs: PREFLIGHT_SOCKET_TIMEOUT_MS,
      commandTimeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS,
      shutdownTimeoutMs: PREFLIGHT_SHUTDOWN_TIMEOUT_MS,
    },
  }));
}

const IS_MAIN = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (IS_MAIN) {
  const arguments_ = process.argv.slice(2);
  const action = arguments_.length === 0
    ? runLive
    : arguments_.length === 1 && arguments_[0] === '--selftest'
      ? runSelftest
      : null;
  if (action === null) {
    console.error('usage: node tools/compendiummem-browser-preflight.mjs [--selftest]');
    process.exitCode = 2;
  } else {
    action().catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
  }
}
