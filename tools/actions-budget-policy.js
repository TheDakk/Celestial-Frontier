#!/usr/bin/env node
'use strict';

// Browser-free, indentation-aware guard for the repository's finite GitHub
// Actions budget. It intentionally parses only the small YAML surface this
// policy owns; block-scalar/comment decoys cannot satisfy direct-key checks.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOW_DIR = path.join(ROOT, '.github', 'workflows');
const BUDGET_DOC = 'GITHUB_ACTIONS_BUDGET.md';
const BUDGET_MODES = Object.freeze(['FROZEN', 'UNFROZEN']);
const RUN_TOKEN = 'RUN_ONE_AUTHORIZED_WORKFLOW';
const STOP_TOKEN = 'DO_NOT_RUN';
const APPROVAL_LABEL = 'actions-budget-approved';
const OWNER_GUARD = 'github.actor == github.repository_owner';
const MANUAL_GUARD =
  `inputs.actions_budget_authorization == '${RUN_TOKEN}' && ${OWNER_GUARD}`;
const LABEL_GUARD =
  `github.event.label.name == '${APPROVAL_LABEL}' && ${OWNER_GUARD}`;
const PARKED_GUARD = `${MANUAL_GUARD} && false`;
const BATTERY_DISPLAY =
  "needs.authorize.result == 'success' && 'battery' || 'budget-not-authorized'";
const JOB_TIMEOUTS = Object.freeze({
  'branch-flow-guard.yml': Object.freeze({ 'branch-flow': '2' }),
  'dev-preview-package.yml': Object.freeze({ authorize: '2', package: '45' }),
  'publish-branch-sites.yml': Object.freeze({ production: '30', development: '30' }),
  'sync-agent-branches.yml': Object.freeze({ 'fast-forward': '10' }),
  'test.yml': Object.freeze({ authorize: '2', 'v2-compendium-memory': '120' }),
});
const COMPENDIUM_CERTIFICATION_STEP_NAME =
  'one-attempt Compendium memory certification';
const COMPENDIUM_CERTIFICATION_STEP_TIMEOUT = '55';
const BRANCH_AUTH_STEPS_SHA256 =
  '9c3193f9c49dd78c210b138d9f8c214ba17ef5034ef955a9f58959d386f97c30';
const WORKFLOWS = Object.freeze({
  'branch-flow-guard.yml': 'manual',
  'dev-preview-package.yml': 'manual-chain',
  'publish-branch-sites.yml': 'parked',
  'sync-agent-branches.yml': 'manual',
  'test.yml': 'owner-label',
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function indent(line, where) {
  const whitespace = (line.match(/^[ \t]*/) || [''])[0];
  assert(!whitespace.includes('\t'), `${where}: tabs make YAML ownership ambiguous`);
  return whitespace.length;
}

function linesOf(source, where) {
  assert(typeof source === 'string', `${where}: workflow source must be text`);
  return source.replaceAll('\r\n', '\n').split('\n');
}

function blockEnd(lines, start, ownerIndent, limit, where) {
  for (let index = start + 1; index < limit; index++) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (indent(lines[index], `${where}:${index + 1}`) <= ownerIndent) return index;
  }
  return limit;
}

function uniqueDirect(lines, token, expectedIndent, start, end, where) {
  const matches = [];
  for (let index = start; index < end; index++) {
    if (indent(lines[index], `${where}:${index + 1}`) === expectedIndent &&
        lines[index].trim() === token) matches.push(index);
  }
  assert(matches.length === 1,
    `${where}: expected exactly one direct ${token}, found ${matches.length}`);
  return matches[0];
}

function directKeys(lines, expectedIndent, start, end, where) {
  const entries = [];
  for (let index = start; index < end; index++) {
    if (indent(lines[index], `${where}:${index + 1}`) !== expectedIndent) continue;
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = lines[index].trim().match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    assert(match,
      `${where}:${index + 1}: unsupported or quoted direct YAML key`);
    entries.push({ key: match[1], value: match[2] || '', index });
  }
  return entries;
}

function directEntry(lines, key, expectedIndent, start, end, where) {
  const matches = directKeys(lines, expectedIndent, start, end, where)
    .filter((entry) => entry.key === key);
  assert(matches.length === 1,
    `${where}: expected exactly one direct ${key}: entry, found ${matches.length}`);
  const entry = matches[0];
  entry.end = blockEnd(lines, entry.index, expectedIndent, end, where);
  return entry;
}

function directValue(lines, entry) {
  if (entry.value && !['|', '|-', '>', '>-'].includes(entry.value)) return entry.value;
  return lines.slice(entry.index + 1, entry.end)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => line.trim())
    .join(' ');
}

function normalizedExpression(value) {
  let normalized = value.trim();
  if (normalized.startsWith('${{') && normalized.endsWith('}}')) {
    normalized = normalized.slice(3, -2).trim();
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function assertConcurrency(lines, where, mode) {
  const top = uniqueDirect(lines, 'concurrency:', 0, 0, lines.length, where);
  const end = blockEnd(lines, top, 0, lines.length, where);
  const group = directEntry(lines, 'group', 2, top + 1, end, where);
  const cancel = directEntry(lines, 'cancel-in-progress', 2, top + 1, end, where);
  const expectedGroup = mode === 'owner-label'
    ? 'actions-budget-${{ github.workflow }}-pr-${{ github.event.pull_request.number }}-${{ github.event.label.name }}-${{ github.actor }}'
    : 'actions-budget-${{ github.workflow }}-${{ github.ref }}-${{ inputs.actions_budget_authorization }}-${{ github.actor }}';
  assert(directValue(lines, group) === expectedGroup,
    `${where}: concurrency must partition exact authorization and actor events`);
  assert(directValue(lines, cancel) === 'true',
    `${where}: duplicate budget-authorized runs must cancel in progress`);
}

function assertManualAuthorization(lines, onStart, onEnd, where) {
  const dispatch = directEntry(lines, 'workflow_dispatch', 2, onStart + 1, onEnd, where);
  const inputs = directEntry(lines, 'inputs', 4, dispatch.index + 1, dispatch.end, where);
  const auth = directEntry(lines, 'actions_budget_authorization', 6,
    inputs.index + 1, inputs.end, where);
  const props = directKeys(lines, 8, auth.index + 1, auth.end, where);
  const one = (key) => {
    const matches = props.filter((entry) => entry.key === key);
    assert(matches.length === 1, `${where}: budget input requires one ${key}`);
    matches[0].end = blockEnd(lines, matches[0].index, 8, auth.end, where);
    return matches[0];
  };
  assert(directValue(lines, one('required')) === 'true',
    `${where}: budget input must be required`);
  assert(directValue(lines, one('default')) === STOP_TOKEN,
    `${where}: budget input must default to ${STOP_TOKEN}`);
  assert(directValue(lines, one('type')) === 'choice',
    `${where}: budget input must be a closed choice`);
  const options = one('options');
  const optionValues = lines.slice(options.index + 1, options.end)
    .filter((line, offset) => indent(line, `${where}:${options.index + offset + 2}`) === 10)
    .map((line) => line.trim().match(/^-\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1]);
  assert(JSON.stringify(optionValues) === JSON.stringify([STOP_TOKEN, RUN_TOKEN]),
    `${where}: budget choices must be exactly ${STOP_TOKEN}, ${RUN_TOKEN}`);
}

function jobEntries(lines, where) {
  const jobs = uniqueDirect(lines, 'jobs:', 0, 0, lines.length, where);
  const end = blockEnd(lines, jobs, 0, lines.length, where);
  return directKeys(lines, 2, jobs + 1, end, where).map((entry) => ({
    ...entry,
    end: blockEnd(lines, entry.index, 2, end, where),
  }));
}

function jobIf(lines, job, where) {
  const entry = directEntry(lines, 'if', 4, job.index + 1, job.end,
    `${where} job ${job.key}`);
  return { entry, value: directValue(lines, entry) };
}

function assertJobEnvelope(lines, job, where) {
  const expectedTimeout = JOB_TIMEOUTS[where]?.[job.key];
  assert(expectedTimeout,
    `${where} job ${job.key}: no sealed runner envelope is defined`);
  const keys = directKeys(lines, 4, job.index + 1, job.end,
    `${where} job ${job.key}`);
  assert(!keys.some((entry) => entry.key === 'strategy'),
    `${where} job ${job.key}: matrix/fanout strategy is forbidden`);
  assert(!keys.some((entry) => entry.key === 'continue-on-error'),
    `${where} job ${job.key}: job failure may not be softened`);
  const runner = directEntry(lines, 'runs-on', 4, job.index + 1, job.end,
    `${where} job ${job.key}`);
  const timeout = directEntry(lines, 'timeout-minutes', 4,
    job.index + 1, job.end, `${where} job ${job.key}`);
  assert(directValue(lines, runner) === 'ubuntu-latest',
    `${where} job ${job.key}: runner must remain standard ubuntu-latest`);
  assert(directValue(lines, timeout) === expectedTimeout,
    `${where} job ${job.key}: timeout must remain ${expectedTimeout} minutes`);
}

function assertNamedStepTimeout(lines, job, stepName, expectedTimeout, where) {
  const token = `- name: ${stepName}`;
  const matches = [];
  for (let index = job.index + 1; index < job.end; index++) {
    if (indent(lines[index], `${where}:${index + 1}`) === 6 &&
        lines[index].trim() === token) matches.push(index);
  }
  assert(matches.length === 1,
    `${where} job ${job.key}: expected exactly one ${stepName} step, found ${matches.length}`);
  const stepEnd = blockEnd(lines, matches[0], 6, job.end,
    `${where} job ${job.key} step ${stepName}`);
  const timeout = directEntry(lines, 'timeout-minutes', 8,
    matches[0] + 1, stepEnd, `${where} job ${job.key} step ${stepName}`);
  assert(directValue(lines, timeout) === expectedTimeout,
    `${where} job ${job.key} step ${stepName}: timeout must remain ${expectedTimeout} minutes`);
}

function assertManualWorkflow(source, where, mode) {
  const lines = linesOf(source, where);
  const on = uniqueDirect(lines, 'on:', 0, 0, lines.length, where);
  const onEnd = blockEnd(lines, on, 0, lines.length, where);
  const triggers = directKeys(lines, 2, on + 1, onEnd, where).map((entry) => entry.key);
  assert(JSON.stringify(triggers) === JSON.stringify(['workflow_dispatch']),
    `${where}: automatic trigger found; only workflow_dispatch is allowed`);
  assertManualAuthorization(lines, on, onEnd, where);
  assertConcurrency(lines, where, mode);
  const jobs = jobEntries(lines, where);
  assert(jobs.length > 0, `${where}: workflow must inventory at least one guarded job`);
  for (const job of jobs) assertJobEnvelope(lines, job, where);
  if (mode === 'manual-chain') {
    assert(jobs.length === 2 && jobs[0].key === 'authorize' && jobs[1].key === 'package',
      `${where}: preview must contain only authorize then package`);
    const condition = jobIf(lines, jobs[0], where).value;
    assert(normalizedExpression(condition) === MANUAL_GUARD,
      `${where}: authorization job must have the exact owner budget guard`);
    const needs = directEntry(lines, 'needs', 4, jobs[1].index + 1, jobs[1].end, where);
    assert(directValue(lines, needs) === 'authorize',
      `${where}: package must depend on the budget authorization job`);
    const forbiddenIf = directKeys(lines, 4, jobs[1].index + 1, jobs[1].end, where)
      .filter((entry) => entry.key === 'if');
    assert(forbiddenIf.length === 0,
      `${where}: sealed preview owner job must not add an execution-control if`);
    return;
  }
  for (const job of jobs) {
    const condition = jobIf(lines, job, where).value;
    const expected = mode === 'parked' ? PARKED_GUARD : MANUAL_GUARD;
    assert(normalizedExpression(condition) === expected,
      `${where} job ${job.key}: execution condition is not the exact ${mode === 'parked' ? 'owner guard plus hard park' : 'owner budget guard'}`);
  }
}

function assertOwnerLabelWorkflow(source, where) {
  const lines = linesOf(source, where);
  const on = uniqueDirect(lines, 'on:', 0, 0, lines.length, where);
  const onEnd = blockEnd(lines, on, 0, lines.length, where);
  const triggers = directKeys(lines, 2, on + 1, onEnd, where);
  assert(triggers.length === 1 && triggers[0].key === 'pull_request',
    `${where}: battery may trigger only on pull_request:labeled`);
  const pull = { ...triggers[0], end: blockEnd(lines, triggers[0].index, 2, onEnd, where) };
  const types = directEntry(lines, 'types', 4, pull.index + 1, pull.end, where);
  assert(directValue(lines, types) === '[labeled]',
    `${where}: battery pull_request type must be exactly [labeled]`);
  assertConcurrency(lines, where, 'owner-label');
  const jobs = jobEntries(lines, where);
  assert(jobs.length === 2 && jobs[0].key === 'authorize' &&
    jobs[1].key === 'v2-compendium-memory',
    `${where}: battery must contain only authorize then fail-fast v2-compendium-memory`);
  for (const job of jobs) assertJobEnvelope(lines, job, where);
  const authorization = jobIf(lines, jobs[0], where).value;
  assert(normalizedExpression(authorization) === LABEL_GUARD,
    `${where}: authorization job must have the exact owner-label guard`);
  const authSteps = directEntry(lines, 'steps', 4, jobs[0].index + 1, jobs[0].end, where);
  const firstName = lines.slice(authSteps.index + 1, authSteps.end)
    .find((line) => /^ {6}- name: /.test(line));
  assert(firstName && firstName.trim() === '- name: validate approved branch flow',
    `${where}: branch direction must fail before checkout or browser spend`);
  const authStepBytes = lines.slice(authSteps.index + 1, authSteps.end).join('\n');
  assert(sha256(authStepBytes) === BRANCH_AUTH_STEPS_SHA256,
    `${where}: branch/fork authorization step changed outside its sealed contract`);

  const battery = jobs[1];
  const display = directEntry(lines, 'name', 4, battery.index + 1, battery.end, where);
  assert(normalizedExpression(directValue(lines, display)) === BATTERY_DISPLAY,
    `${where}: required battery context must exist only for the owner-approved event`);
  const needs = directEntry(lines, 'needs', 4, battery.index + 1, battery.end, where);
  assert(directValue(lines, needs) === 'authorize',
    `${where}: expensive battery must depend on the owner authorization job`);
  const forbiddenIf = directKeys(lines, 4, battery.index + 1, battery.end, where)
    .filter((entry) => entry.key === 'if');
  assert(forbiddenIf.length === 0,
    `${where}: sealed Compendium owner job must not add an execution-control if`);
  assertNamedStepTimeout(lines, battery, COMPENDIUM_CERTIFICATION_STEP_NAME,
    COMPENDIUM_CERTIFICATION_STEP_TIMEOUT, where);
}

function readCarriers() {
  const names = fs.readdirSync(WORKFLOW_DIR)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();
  const expected = Object.keys(WORKFLOWS).sort();
  assert(JSON.stringify(names) === JSON.stringify(expected),
    `workflow inventory changed: expected ${expected.join(', ')}, found ${names.join(', ')}`);
  const carriers = new Map();
  for (const name of names) carriers.set(name,
    fs.readFileSync(path.join(WORKFLOW_DIR, name), 'utf8'));
  carriers.set(BUDGET_DOC, fs.readFileSync(path.join(ROOT, BUDGET_DOC), 'utf8'));
  return carriers;
}

function validate(carriers) {
  const actual = [...carriers.keys()].sort();
  const expected = [...Object.keys(WORKFLOWS), BUDGET_DOC].sort();
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `policy carrier inventory changed: expected ${expected.join(', ')}, found ${actual.join(', ')}`);
  const budget = carriers.get(BUDGET_DOC);
  const modes = [...budget.matchAll(/^\*\*Current mode: `([^`]+)`\*\*$/gm)];
  assert(modes.length === 1 && BUDGET_MODES.includes(modes[0][1]),
    `${BUDGET_DOC}: exactly one direct Current mode declaration must be ${BUDGET_MODES.join(' or ')}`);
  assert(budget.includes('3,000'), `${BUDGET_DOC}: missing Nick's hard monthly cap`);
  for (const [name, mode] of Object.entries(WORKFLOWS)) {
    const source = carriers.get(name);
    assert(typeof source === 'string', `${name}: missing workflow carrier`);
    if (mode === 'owner-label') assertOwnerLabelWorkflow(source, name);
    else assertManualWorkflow(source, name, mode);
  }
}

function clone(carriers) { return new Map(carriers); }

function replaceUnique(source, before, after, where) {
  const parts = source.split(before);
  assert(parts.length === 2, `${where}: expected one mutation anchor, found ${parts.length - 1}`);
  return parts[0] + after + parts[1];
}

function mutateJobCondition(source, jobName, before, after, where) {
  const lines = linesOf(source, where);
  const job = jobEntries(lines, where).find((entry) => entry.key === jobName);
  assert(job, `${where}: missing mutation job ${jobName}`);
  const condition = jobIf(lines, job, where).entry;
  const original = lines.slice(condition.index, condition.end).join('\n');
  const changed = replaceUnique(original, before, after, where);
  lines.splice(condition.index, condition.end - condition.index, ...changed.split('\n'));
  return lines.join('\n');
}

function expectInvalid(base, label, mutate) {
  const carriers = clone(base);
  mutate(carriers);
  let rejected = false;
  try { validate(carriers); } catch { rejected = true; }
  assert(rejected, `negative control failed open: ${label}`);
}

function selftest() {
  const base = readCarriers();
  validate(base);
  const frozen = clone(base);
  frozen.set(BUDGET_DOC, replaceUnique(frozen.get(BUDGET_DOC),
    '**Current mode: `UNFROZEN`**', '**Current mode: `FROZEN`**', BUDGET_DOC));
  validate(frozen);
  let controls = 0;
  const control = (label, mutate) => { expectInvalid(base, label, mutate); controls++; };

  control('budget rejects an unknown mode', (c) => c.set(BUDGET_DOC,
    replaceUnique(c.get(BUDGET_DOC), '**Current mode: `UNFROZEN`**',
      '**Current mode: `CONSERVE`**', BUDGET_DOC)));
  control('budget rejects multiple direct mode declarations', (c) => c.set(BUDGET_DOC,
    c.get(BUDGET_DOC) + '\n**Current mode: `FROZEN`**\n'));
  control('battery rejects push trigger', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '  pull_request:\n', '  push:\n', 'test.yml')));
  control('battery rejects synchronize', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    types: [labeled]',
      '    types: [synchronize]', 'test.yml')));
  control('battery rejects wrong approval label', (c) => c.set('test.yml',
    mutateJobCondition(c.get('test.yml'), 'authorize', APPROVAL_LABEL,
      'any-label', 'test.yml')));
  control('battery rejects missing owner guard', (c) => c.set('test.yml',
    mutateJobCondition(c.get('test.yml'), 'authorize',
      'github.actor == github.repository_owner', 'true', 'test.yml')));
  control('battery rejects authorization OR-true bypass', (c) => c.set('test.yml',
    mutateJobCondition(c.get('test.yml'), 'authorize',
      'github.actor == github.repository_owner',
      'github.actor == github.repository_owner || true', 'test.yml')));
  control('skipped or failed authorization cannot emit required battery context', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'),
      `name: \${{ ${BATTERY_DISPLAY} }}`,
      'name: battery',
      'test.yml')));
  control('label event cannot bypass successful authorization result', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'),
      `name: \${{ ${BATTERY_DISPLAY} }}`,
      `name: \${{ github.event.label.name == '${APPROVAL_LABEL}' && 'battery' || 'budget-not-authorized' }}`,
      'test.yml')));
  control('unrelated labels cannot cancel an authorized battery', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '-${{ github.event.label.name }}-${{ github.actor }}',
      '', 'test.yml')));
  control('battery rejects an extra runner job', (c) => c.set('test.yml',
    c.get('test.yml') + '\n  leaked-job:\n    runs-on: ubuntu-latest\n    steps: []\n'));
  control('battery rejects missing authorization dependency', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    needs: authorize',
      '    needs: []', 'test.yml')));
  control('battery rejects runner matrix fanout', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    runs-on: ubuntu-latest\n    timeout-minutes: 120',
      '    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        shard: [1, 2]\n    timeout-minutes: 120', 'test.yml')));
  control('battery rejects larger or alternate runner', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    runs-on: ubuntu-latest\n    timeout-minutes: 120',
      '    runs-on: macos-latest\n    timeout-minutes: 120', 'test.yml')));
  control('battery rejects expanded timeout', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    timeout-minutes: 120',
      '    timeout-minutes: 360', 'test.yml')));
  control('battery rejects reduced Compendium certification timeout', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '        timeout-minutes: 55',
      '        timeout-minutes: 54', 'test.yml')));
  control('battery rejects expanded Compendium certification timeout', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '        timeout-minutes: 55',
      '        timeout-minutes: 56', 'test.yml')));
  control('authorization failure cannot be softened', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '    timeout-minutes: 2\n    steps:',
      '    timeout-minutes: 2\n    continue-on-error: true\n    steps:', 'test.yml')));
  control('branch validator cannot become permissive', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'),
      '          echo "::error::Disallowed flow: $HEAD_BRANCH -> $BASE_BRANCH"\n          exit 1',
      '          echo "branch flow bypassed"\n          exit 0', 'test.yml')));
  control('quoted trigger cannot escape workflow inventory', (c) => c.set('test.yml',
    replaceUnique(c.get('test.yml'), '  pull_request:\n',
      '  "push":\n  pull_request:\n', 'test.yml')));
  control('quoted job cannot escape job inventory', (c) => c.set('test.yml',
    c.get('test.yml') + '\n  "leaked-job":\n    runs-on: ubuntu-latest\n    steps: []\n'));

  for (const [name, mode] of Object.entries(WORKFLOWS)) {
    if (mode === 'owner-label') continue;
    control(`${name} rejects automatic trigger`, (c) => c.set(name,
      replaceUnique(c.get(name), '  workflow_dispatch:\n', '  push:\n', name)));
    control(`${name} rejects renamed budget input`, (c) => c.set(name,
      replaceUnique(c.get(name), '      actions_budget_authorization:\n',
        '      authorization_decoy:\n', name)));
    control(`${name} rejects run-by-default`, (c) => c.set(name,
      replaceUnique(c.get(name), `        default: ${STOP_TOKEN}`,
        `        default: ${RUN_TOKEN}`, name)));
    control(`${name} rejects queued duplicate policy`, (c) => c.set(name,
      replaceUnique(c.get(name), '  cancel-in-progress: true',
        '  cancel-in-progress: false', name)));
    control(`${name} rejects authorization-agnostic concurrency`, (c) => c.set(name,
      replaceUnique(c.get(name), '-${{ inputs.actions_budget_authorization }}-${{ github.actor }}', '', name)));
    control(`${name} rejects actor-agnostic concurrency`, (c) => c.set(name,
      replaceUnique(c.get(name), '-${{ github.actor }}', '', name)));
    const jobs = jobEntries(linesOf(base.get(name), name), name);
    if (mode === 'manual-chain') {
      control(`${name}/authorize rejects missing job guard`, (c) => c.set(name,
        mutateJobCondition(c.get(name), 'authorize',
          `inputs.actions_budget_authorization == '${RUN_TOKEN}'`, 'true', name)));
      control(`${name}/authorize rejects missing owner guard`, (c) => c.set(name,
        mutateJobCondition(c.get(name), 'authorize', OWNER_GUARD, 'true', name)));
      control(`${name}/authorize rejects OR-true bypass`, (c) => c.set(name,
        mutateJobCondition(c.get(name), 'authorize', OWNER_GUARD,
          `${OWNER_GUARD} || true`, name)));
      control(`${name}/package rejects missing authorization dependency`, (c) => c.set(name,
        replaceUnique(c.get(name), '    needs: authorize', '    needs: []', name)));
    } else {
      for (const job of jobs) {
        control(`${name}/${job.key} rejects missing job guard`, (c) => c.set(name,
          mutateJobCondition(c.get(name), job.key,
            `inputs.actions_budget_authorization == '${RUN_TOKEN}'`,
            'true', name)));
        control(`${name}/${job.key} rejects missing owner guard`, (c) => c.set(name,
          mutateJobCondition(c.get(name), job.key, OWNER_GUARD, 'true', name)));
        control(`${name}/${job.key} rejects OR-true bypass`, (c) => c.set(name,
          mutateJobCondition(c.get(name), job.key, OWNER_GUARD,
            `${OWNER_GUARD} || true`, name)));
        if (mode === 'parked') control(`${name}/${job.key} cannot be unparked`, (c) => c.set(name,
          mutateJobCondition(c.get(name), job.key, 'false', 'true', name)));
      }
    }
  }

  control('block-scalar decoy cannot replace owned input', (c) => c.set(
    'sync-agent-branches.yml',
    replaceUnique(c.get('sync-agent-branches.yml'),
      '      actions_budget_authorization:\n', '      authorization_decoy:\n',
      'sync-agent-branches.yml') +
      `\n# decoy\n# actions_budget_authorization: ${RUN_TOKEN}\n`));
  control('comment decoy cannot replace owned job guard', (c) => c.set(
    'sync-agent-branches.yml',
    mutateJobCondition(c.get('sync-agent-branches.yml'), 'fast-forward',
      `inputs.actions_budget_authorization == '${RUN_TOKEN}'`, 'true',
      'sync-agent-branches.yml') +
      `\n# decoy: inputs.actions_budget_authorization == '${RUN_TOKEN}'\n`));
  control('unknown workflow cannot escape classification', (c) => c.set(
    'unclassified.yml', 'name: leak\non:\n  push:\njobs: {}\n'));

  console.log(`ACTIONS BUDGET SELFTEST: PASS — ${controls} fail-closed controls`);
}

try {
  if (process.argv.includes('--selftest')) selftest();
  else {
    validate(readCarriers());
    console.log('ACTIONS BUDGET POLICY: PASS — automatic hosted runner spend is disabled');
  }
} catch (error) {
  console.error(`ACTIONS BUDGET POLICY: FAIL — ${error.message}`);
  process.exitCode = 1;
}
