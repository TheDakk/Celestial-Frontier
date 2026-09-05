import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.resolve(here, '..', '..', '..', '.github', 'workflows', 'test.yml');
const sceneMemoryToolPath = path.resolve(here, '..', 'tools', 'scenemem.mjs');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const sceneMemoryTool = fs.readFileSync(sceneMemoryToolPath, 'utf8');
const SCENE_BROWSER_ENV =
  'CF_BROWSER: ${{ runner.temp }}/scenemem-edge-current/opt/microsoft/msedge/microsoft-edge';
const STATIC_PROFILE_NAME = 'v2 base-profile static gates';
const HEAP_PHASE_SELFTEST_NAME = 'scene-memory fixed-eighth phase-validity selftest';
const HEAP_PHASE_SELFTEST_COMMAND = 'node tools/scenemem.mjs --heap-phase-selftest';
const SCENEMEM_CERTIFICATION_COMMAND =
  'node tools/scenemem.mjs --budget=budgets/scene-memory-v2.json';
const SCENEMEM_VERIFY_COMMAND =
  'node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v2.json';

function glassPreflightJqFilter(source: string): string {
  const step = workflowStep(source, GLASS_PREFLIGHT_NAME);
  if (!step) throw new Error('Glass preflight step is absent');
  const lines = step.split(/\r?\n/u);
  const start = lines.findIndex(
    (line) => line.trim() === '--argjson require_native_heartbeat "$require_native_heartbeat" -e \'',
  );
  const end = lines.findIndex(
    (line, index) => index > start && line.trim() === `' "$report" >/dev/null`,
  );
  if (start < 0 || end <= start + 1) throw new Error('Glass preflight jq verdict is malformed');
  return lines.slice(start + 1, end).map((line) => (
    line.startsWith('          ') ? line.slice(10) : line
  )).join('\n');
}
const COMPENDIUM_INSTRUMENT_SELFTEST_NAME =
  'changed-or-production Compendium browser instrument selftests';
const COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND = 'npm run compendiummem:selftest';
const CHROME_LAUNCHER_SELFTEST_NAME = 'changed-or-production Chrome launcher selftest';
const CHROME_LAUNCHER_SELFTEST_COMMAND = 'node tools/browsercdp.mjs --selftest';
const GLASS_PREFLIGHT_NAME = 'changed Glass small-phone and large-phone action preflights';
const GLASS_SMALL_PHONE_PREFLIGHT_COMMAND =
  'CF_V2_GLASSMATRIX_RUN_ID="$CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID" node tools/glassmatrix.mjs --viewport=small-phone';
const GLASS_LARGE_PHONE_PREFLIGHT_COMMAND =
  'CF_V2_GLASSMATRIX_RUN_ID="$CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID" node tools/glassmatrix.mjs --viewport=large-phone';
const GLASS_SMALL_PHONE_REPORT_BINDING =
  'small_phone_report="apps/game/smoke/glassmatrix-${CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID}.json"';
const GLASS_LARGE_PHONE_REPORT_BINDING =
  'large_phone_report="apps/game/smoke/glassmatrix-${CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID}.json"';
const GLASS_PREFLIGHT_BROWSER_BINDING =
  'preflight_browser="$(node tools/browserpath.mjs --print)"';
const GLASS_PREFLIGHT_RUN_ID_CHECK =
  'test "$(jq -er \'.run.id\' "$report")" = "$expected_run_id"';
const GLASS_SMALL_PHONE_VERIFY =
  'verify_preflight_report "$small_phone_report" "$CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID" \\';
const GLASS_SMALL_PHONE_VERIFY_ARGS =
  '"$small_phone_viewport" "$inventory_controls" false';
const GLASS_LARGE_PHONE_VERIFY =
  'verify_preflight_report "$large_phone_report" "$CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID" \\';
const GLASS_LARGE_PHONE_VERIFY_ARGS =
  '"$large_phone_viewport" "$native_tab_controls" true';
const GLASS_PREFLIGHT_CONDITION =
  "        if: >-\n          github.event.pull_request.base.ref == 'develop' &&\n          (steps.lane.outputs.lane == 'agent' ||\n          steps.scope.outputs.glass_preflight_changed == 'true')";
const GLASS_PREFLIGHT_VERDICT_TOKENS = [
  '$report.status == "pass"',
  '$report.schema == "cf-v2-glassmatrix/v2"',
  '$report.terminal == true',
  '$report.scope == "targeted-diagnostic"',
  '$report.certifying == false',
  '$report.run.id == $expected_run_id',
  '$report.run.artifactPath == $expected_artifact_path',
  '$report.source.state == "committed"',
  '$report.sourceEnd == $report.source',
  '$report.sourceChange.detected == false',
  '$report.sourceChange.ending == null',
  '$report.summary.viewportCount == 1',
  '$report.summary.findingCount == 0',
  '$report.summary.instrumentFailureCount == 0',
  '($report.viewportInventory | length) == 1',
  '$report.viewportInventory[0] == $expected_viewport',
  '$report.browser.executable == $preflight_browser',
  '($report.browser.product | type) == "string"',
  '($report.browser.product | test("^Chrome/(0|[1-9][0-9]*)\\\\.(0|[1-9][0-9]*)\\\\.(0|[1-9][0-9]*)\\\\.(0|[1-9][0-9]*)$"))',
  '($report.browser.revision | type) == "string"',
  '($report.browser.revision | length) > 0',
  '($report.browser.user_agent | type) == "string"',
  '($report.browser.user_agent | length) > 0',
  '($report.browser.js_version | type) == "string"',
  '($report.browser.js_version | length) > 0',
  '$report.browser.protocol_version == "1.3"',
  '$report.browser.consistentAcrossViewports == true',
  '($report.findings | type) == "array"',
  '($report.findings | length) == 0',
  '($report.instrumentFailures | type) == "array"',
  '($report.instrumentFailures | length) == 0',
  '$report.controlSummary.selftestRan == true',
  '($report.controlSummary.blockedNegativeControls | type) == "array"',
  '($report.controlSummary.blockedNegativeControls | length) == 0',
  '($report.controlSummary.negativeControls | type) == "array"',
  '($required_controls | type) == "array"',
  '($required_controls | length) > 0',
  '($report.controlSummary.negativeControls | index($control)) != null',
  '$report.controlSummary.automaticRetries == 0',
  '$report.exit.code == 0',
  '$require_native_heartbeat == false or (',
  '$report.arc4CaptureOutcomeInventory.expectedCount == 3',
  '$report.arc4CaptureOutcomeInventory.observedCount == 3',
  '$report.arc4CaptureOutcomeInventory.omitted == []',
  '($arc4_outcomes | type) == "array"',
  '($native_outcomes | length) == 1',
  '$native_outcomes[0].checks.idleKeyboardFocus == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.schema ==',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.stateFound == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.seamsAvailable == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.schema ==',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.documentToken ==',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.cycle == "completed"',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.reason == null',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.refresh.capture == "completed"',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.after.originalTargetDisconnected == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.after.originalPriorDisconnected == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.after.replacementAcquired == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.after.priorReplacementAcquired == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.after.priorFocused == true',
  '$native_outcomes[0].diagnostics.sampleFocusHeartbeat.cleanup.attempted == false',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.schema ==',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.ok == true',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.instrumentOk == true',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.productOk == true',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.instrumentChecks | keys | sort',
  '$native_outcomes[0].diagnostics.sampleFocusOutcome.productChecks | keys | sort',
  '$report.shipyardKeyboardHeartbeatInventory.expectedCount == 1',
  '($shipyard_outcomes | type) == "array"',
  '$shipyard_outcomes[0].schema ==',
  '$shipyard_outcomes[0].setup.ok == true',
  '($shipyard_outcomes[0].setup.display | length) > 0',
  '$shipyard_outcomes[0].setup.visibility == "visible"',
  '$shipyard_outcomes[0].setup.effectiveOpacity > 0',
  '$shipyard_outcomes[0].heartbeat.schema ==',
  '$shipyard_outcomes[0].heartbeat.initial.currentCount == 1',
  '$shipyard_outcomes[0].heartbeat.initial.current == $shipyard_descriptor',
  '$shipyard_outcomes[0].heartbeat.cycleReceipt.refresh.shipyard == "completed"',
  '$shipyard_outcomes[0].heartbeat.after.current == $shipyard_descriptor',
  '$shipyard_outcomes[0].receipt.eventTargetIsCurrent == true',
  '($shipyard_outcomes[0].receipt.currentDisplay | length) > 0',
  '$shipyard_outcomes[0].receipt.currentVisibility == "visible"',
  '$shipyard_outcomes[0].receipt.currentEffectiveOpacity > 0',
  '$shipyard_outcomes[0].receipt.active == $shipyard_descriptor',
  '$shipyard_outcomes[0].outcome.schema ==',
  '$shipyard_outcomes[0].outcome.instrumentChecks.heartbeatRequirement == true',
  '$shipyard_outcomes[0].outcome.instrumentChecks | keys | sort',
  '$shipyard_outcomes[0].outcome.productChecks | keys | sort',
] as const;
const COMPENDIUM_CHANGED_OR_PRODUCTION_CONDITION =
  "        if: >-\n          github.event.pull_request.base.ref == 'main' ||\n          steps.scope.outputs.compendium_instrument_changed == 'true'";
const TRANSPORT_CHANGED_OR_PRODUCTION_CONDITION =
  "        if: >-\n          github.event.pull_request.base.ref == 'main' ||\n          steps.scope.outputs.browser_transport_changed == 'true'";
const PRODUCTION_ONLY_CONDITION =
  "        if: github.event.pull_request.base.ref == 'main'";
const PRODUCTION_VERIFY_CONDITION = [
  '        if: >-',
  '          always() &&',
  "          github.event.pull_request.base.ref == 'main' &&",
  "          (steps.scenemem.outcome == 'success' || steps.scenemem.outcome == 'failure')",
].join('\n');
const HEAP_PHASE_SELFTEST_HEADER = `      - name: ${HEAP_PHASE_SELFTEST_NAME}`;
const SCENEMEM_CERTIFICATION_HEADER = '      - name: one-attempt scene-memory certification';
const SCENEMEM_VERIFY_HEADER = '      - name: verify current scene-memory evidence';
const HEAP_PHASE_SELFTEST_BLOCK = [
  HEAP_PHASE_SELFTEST_HEADER,
  PRODUCTION_ONLY_CONDITION,
  '        env:',
  `          ${SCENE_BROWSER_ENV}`,
  '        working-directory: port/v2',
  `        run: ${HEAP_PHASE_SELFTEST_COMMAND}`,
].join('\n');
const HEAP_PHASE_SOURCE_CONTRACT = [
  HEAP_PHASE_SELFTEST_COMMAND,
  "else if (arg === '--heap-phase-selftest') options.heapPhaseSelftest = true;",
  "assert(argv.length === 1, '--heap-phase-selftest accepts no other arguments');",
  'async function runHeapPhaseSelftest() {',
  'if (options.heapPhaseSelftest) return await runHeapPhaseSelftest();',
] as const;
const ZERO_DEFAULT_CONTRACT = [
  'on:\n  pull_request:\n    types: [labeled]',
  "(github.event.label.name == 'actions-budget-approved' ||",
  "github.event.label.name == 'actions-full-chain-approved') &&",
  'github.actor == github.repository_owner',
  'needs: authorize',
] as const;
const ORDERED_CONTRACT = [
  `- name: ${STATIC_PROFILE_NAME}`,
  'develop) node tools/check-profile.mjs --profile=develop ;;',
  'main) node tools/check-profile.mjs --profile=production ;;',
  '- name: develop changed-art mutation control',
  'run: npm run overridecontrol',
  `- name: ${CHROME_LAUNCHER_SELFTEST_NAME}`,
  `run: ${CHROME_LAUNCHER_SELFTEST_COMMAND}`,
  `- name: ${GLASS_PREFLIGHT_NAME}`,
  'timeout-minutes: 7',
  GLASS_PREFLIGHT_RUN_ID_CHECK,
  GLASS_SMALL_PHONE_REPORT_BINDING,
  GLASS_LARGE_PHONE_REPORT_BINDING,
  GLASS_PREFLIGHT_BROWSER_BINDING,
  'small_phone_viewport=\'{"label":"small-phone","width":320,"height":568,"dpr":2,"mobile":true,"safeArea":{"top":0,"right":0,"bottom":0,"left":0}}\'',
  'large_phone_viewport=\'{"label":"large-phone","width":412,"height":915,"dpr":3,"mobile":true,"safeArea":{"top":0,"right":0,"bottom":0,"left":0}}\'',
  'inventory_controls=\'["inventory-modal-focus","inventory-modal-retention","inventory-protected-action","inventory-action-publication","inventory-convergence-retry"]\'',
  'native_tab_controls=\'["arc4-capture-native-survey-return"]\'',
  GLASS_SMALL_PHONE_PREFLIGHT_COMMAND,
  GLASS_SMALL_PHONE_VERIFY,
  GLASS_SMALL_PHONE_VERIFY_ARGS,
  GLASS_LARGE_PHONE_PREFLIGHT_COMMAND,
  GLASS_LARGE_PHONE_VERIFY,
  GLASS_LARGE_PHONE_VERIFY_ARGS,
  '- name: layout (10 viewports)',
  '- name: verify root layout evidence freshness',
  '- name: install current Arc 1C Edge scene-memory browser',
  'EDGE_PACKAGE_URL: https://go.microsoft.com/fwlink/?linkid=2149051',
  'test "$(dpkg-deb --field "$scene_edge_package" Package)" = "microsoft-edge-stable"',
  'dpkg-deb --extract "$scene_edge_package" "$scene_edge_root"',
  'test -x "$scene_edge_browser"',
  `- name: ${HEAP_PHASE_SELFTEST_NAME}`,
  `run: ${HEAP_PHASE_SELFTEST_COMMAND}`,
  '- name: one-attempt scene-memory certification',
  'id: scenemem',
  'timeout-minutes: 10',
  `run: ${SCENEMEM_CERTIFICATION_COMMAND}`,
  '- name: verify current scene-memory evidence',
  `run: ${SCENEMEM_VERIFY_COMMAND}`,
  `- name: ${COMPENDIUM_INSTRUMENT_SELFTEST_NAME}`,
  'node tools/browserpath.mjs --selftest',
  'node tools/compendiummem-browser-preflight.mjs --selftest',
  COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND,
  '- name: install exact Arc 1A Edge calibration browser',
] as const;
const ORDERED_STEP_NAMES = [
  STATIC_PROFILE_NAME,
  'develop changed-art mutation control',
  CHROME_LAUNCHER_SELFTEST_NAME,
  GLASS_PREFLIGHT_NAME,
  'layout (10 viewports)',
  'verify root layout evidence freshness',
  'install current Arc 1C Edge scene-memory browser',
  HEAP_PHASE_SELFTEST_NAME,
  'one-attempt scene-memory certification',
  'verify current scene-memory evidence',
  COMPENDIUM_INSTRUMENT_SELFTEST_NAME,
  'install exact Arc 1A Edge calibration browser',
] as const;

const workflowStep = (source: string, name: string): string | null => {
  const header = `      - name: ${name}`;
  const starts = [...source.matchAll(new RegExp(`^${header}$`, 'gmu'))].map((match) => match.index!);
  if (starts.length !== 1) return null;
  const start = starts[0]!;
  const tail = source.slice(start + header.length);
  const next = tail.search(/^      - (?:name:|uses:)/mu);
  return source.slice(start, next < 0 ? source.length : start + header.length + next);
};

const hasExactStepCondition = (step: string, expected: string): boolean => {
  const lines = step.split(/\r?\n/);
  const starts = lines.flatMap((line, index) => /^ {8}if:/u.test(line) ? [index] : []);
  if (starts.length !== 1) return false;
  const start = starts[0]!;
  let end = start + 1;
  while (end < lines.length && !/^ {8}\S/u.test(lines[end] ?? '')) end += 1;
  return lines.slice(start, end).join('\n') === expected;
};

const satisfiesZeroDefaultPolicy = (source: string): boolean => {
  const permissions = source.indexOf('\npermissions:');
  if (permissions < 0) return false;
  const trigger = source.slice(0, permissions);
  return ZERO_DEFAULT_CONTRACT.every((token) => source.includes(token))
    && !/\n  (?:push|workflow_dispatch|schedule):/.test(trigger);
};

const bindsHeapPhaseSelftestSource = (source: string): boolean => {
  let cursor = -1;
  for (const token of HEAP_PHASE_SOURCE_CONTRACT) {
    const index = source.indexOf(token);
    if (index <= cursor || source.indexOf(token, index + 1) !== -1) return false;
    cursor = index;
  }
  return true;
};

const satisfiesSceneWorkflow = (
  source: string,
  collectorSource = sceneMemoryTool,
): boolean => {
  if (!satisfiesZeroDefaultPolicy(source)) return false;
  if (!bindsHeapPhaseSelftestSource(collectorSource)) return false;
  const ownedStart = source.indexOf(ORDERED_CONTRACT[0]);
  const ownedEnd = source.indexOf(ORDERED_CONTRACT.at(-1)!);
  if (ownedStart < 0 || ownedEnd <= ownedStart) return false;
  const owned = source.slice(ownedStart, ownedEnd + ORDERED_CONTRACT.at(-1)!.length);
  let cursor = -1;
  for (const token of ORDERED_CONTRACT) {
    const index = owned.indexOf(token);
    if (index <= cursor || owned.indexOf(token, index + 1) !== -1) return false;
    cursor = index;
  }
  const directSteps = [...owned.matchAll(/^(?: {6})?- (.+)$/gmu)].map((match) => match[1]);
  if (JSON.stringify(directSteps) !== JSON.stringify(
    ORDERED_STEP_NAMES.map((name) => `name: ${name}`),
  )) return false;

  const staticProfile = workflowStep(source, STATIC_PROFILE_NAME);
  const installation = workflowStep(source, 'install current Arc 1C Edge scene-memory browser');
  const heapPhaseSelftest = workflowStep(source, HEAP_PHASE_SELFTEST_NAME);
  const certification = workflowStep(source, 'one-attempt scene-memory certification');
  const verifier = workflowStep(source, 'verify current scene-memory evidence');
  const compendiumInstrumentSelftest = workflowStep(
    source, COMPENDIUM_INSTRUMENT_SELFTEST_NAME,
  );
  const chromeLauncherSelftest = workflowStep(source, CHROME_LAUNCHER_SELFTEST_NAME);
  const glassPreflight = workflowStep(source, GLASS_PREFLIGHT_NAME);
  if (!staticProfile || !installation || !heapPhaseSelftest || !certification || !verifier
    || !compendiumInstrumentSelftest || !chromeLauncherSelftest || !glassPreflight) return false;
  if (!staticProfile.includes('develop) node tools/check-profile.mjs --profile=develop ;;')
    || !staticProfile.includes('main) node tools/check-profile.mjs --profile=production ;;')
    || staticProfile.includes('npm run check:')) return false;
  if (source.includes('npx vitest run tests/current-producer-authorities.test.ts')
    || source.includes('npx vitest run tests/scenemem-contract.test.ts')
    || source.includes('node --check tools/scenemem.mjs')
    || source.includes('node --check tools/scenemem-contract.mjs')) return false;
  if (!hasExactStepCondition(installation, PRODUCTION_ONLY_CONDITION)
    || !hasExactStepCondition(heapPhaseSelftest, PRODUCTION_ONLY_CONDITION)
    || !hasExactStepCondition(certification, PRODUCTION_ONLY_CONDITION)
    || certification.includes('continue-on-error')) return false;
  if (!hasExactStepCondition(verifier, PRODUCTION_VERIFY_CONDITION)) return false;

  for (const command of [
    HEAP_PHASE_SELFTEST_COMMAND,
    SCENEMEM_CERTIFICATION_COMMAND,
    SCENEMEM_VERIFY_COMMAND,
  ]) {
    if (source.split(command).length !== 2) return false;
  }
  if (source.split('node tools/scenemem.mjs').length !== 4) return false;
  if (source.split(COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND).length !== 2
    || !hasExactStepCondition(
      compendiumInstrumentSelftest, COMPENDIUM_CHANGED_OR_PRODUCTION_CONDITION,
    )
    || !compendiumInstrumentSelftest.includes('node tools/browserpath.mjs --selftest')
    || !compendiumInstrumentSelftest.includes(
      'node tools/compendiummem-browser-preflight.mjs --selftest',
    )
    || !compendiumInstrumentSelftest.includes(
      COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND,
    )) return false;
  if (source.split(CHROME_LAUNCHER_SELFTEST_COMMAND).length !== 2
    || !hasExactStepCondition(
      chromeLauncherSelftest, TRANSPORT_CHANGED_OR_PRODUCTION_CONDITION,
    )) return false;
  const glassPreflightLines = glassPreflight.split(/\r?\n/u).map((line) => line.trim());
  if (source.split(GLASS_SMALL_PHONE_PREFLIGHT_COMMAND).length !== 2
    || source.split(GLASS_LARGE_PHONE_PREFLIGHT_COMMAND).length !== 2
    || !hasExactStepCondition(glassPreflight, GLASS_PREFLIGHT_CONDITION)
    || glassPreflightLines.filter((line) => line === 'timeout-minutes: 7').length !== 1
    || !glassPreflight.includes('CF_BROWSER: /usr/bin/google-chrome')
    || source.split(GLASS_PREFLIGHT_BROWSER_BINDING).length !== 2
    || source.split(GLASS_SMALL_PHONE_REPORT_BINDING).length !== 2
    || source.split(GLASS_LARGE_PHONE_REPORT_BINDING).length !== 2
    || source.split(GLASS_SMALL_PHONE_VERIFY).length !== 2
    || source.split(GLASS_LARGE_PHONE_VERIFY).length !== 2
    || !glassPreflight.includes('jq --arg preflight_browser "$preflight_browser" \\')
    || glassPreflight.includes('.browser.executable == "/usr/bin/google-chrome"')
    || GLASS_PREFLIGHT_VERDICT_TOKENS.some(
      (token) => glassPreflight.split(token).length !== 2,
    )
    || glassPreflight.includes('continue-on-error')
    || glassPreflight.includes('--slice-run=')
    || glassPreflight.includes('--profile=')) return false;
  for (const environment of [
    'CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-preflight',
    'CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-glass-large-phone-preflight',
  ]) {
    if (source.split(environment).length !== 2) return false;
  }
  if (!source.includes(`${HEAP_PHASE_SELFTEST_BLOCK}\n${SCENEMEM_CERTIFICATION_HEADER}`)) return false;
  const env = 'CF_SCENEMEM_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-scenemem';
  if (source.split(env).length !== 2) return false;
  const sceneBrowserOwners = [
    HEAP_PHASE_SELFTEST_NAME,
    'one-attempt scene-memory certification',
    'verify current scene-memory evidence',
  ];
  if (source.split(SCENE_BROWSER_ENV).length !== sceneBrowserOwners.length + 1) return false;
  for (const name of [
    'install current Arc 1C Edge scene-memory browser',
    ...sceneBrowserOwners,
  ]) {
    const index = ORDERED_STEP_NAMES.findIndex((candidate) => candidate === name);
    const header = `      - name: ${name}`;
    const start = source.indexOf(header);
    if (start < 0) return false;
    const nextName = ORDERED_STEP_NAMES[index + 1];
    const end = nextName === undefined ? source.length : source.indexOf(`      - name: ${nextName}`, start + 1);
    if (end < 0) return false;
    const block = source.slice(start, end);
    const browserMentions = block.split('\n').filter((line) => line.includes('CF_BROWSER'));
    if (sceneBrowserOwners.includes(name)) {
      if (browserMentions.length !== 1 || browserMentions[0]?.trim() !== SCENE_BROWSER_ENV) return false;
    } else if (browserMentions.length !== 0) return false;
  }
  return !owned.includes('continue-on-error')
    && !owned.includes('--calibrate')
    && !owned.includes('--allow-dirty')
    && !owned.includes('$GITHUB_ENV')
    && !owned.includes('151.0.4129.101')
    && !owned.includes('EDGE_PACKAGE_SHA256')
    && source.includes('- name: archive battery reports')
    && source.includes('name: battery-evidence')
    && source.includes('port/v2/apps/game/smoke/scenemem-report.json');
};

const replaceOwnedToken = (source: string, token: string): string => {
  const ownedStart = source.indexOf(ORDERED_CONTRACT[0]);
  const tokenAt = source.indexOf(token, Math.max(0, ownedStart));
  if (tokenAt < 0) return source;
  return `${source.slice(0, tokenAt)}BROKEN${source.slice(tokenAt + token.length)}`;
};

describe('scene-memory test-battery workflow contract', () => {
  it('keeps hosted execution owner-label-gated with no default trigger', () => {
    expect(satisfiesZeroDefaultPolicy(workflow)).toBe(true);
  });

  it('rejects every missing zero-default authorization control', () => {
    for (const token of ZERO_DEFAULT_CONTRACT) {
      expect(satisfiesZeroDefaultPolicy(workflow.replace(token, 'BROKEN')), token).toBe(false);
    }
  });

  it('keeps the two static profiles ahead of current Edge, one attempt, verification, and evidence', () => {
    expect(satisfiesSceneWorkflow(workflow)).toBe(true);
  });

  it('makes both hosted Glass canaries reject malformed evidence and heartbeat drift', () => {
    const filter = glassPreflightJqFilter(workflow);
    const inventoryControls = [
      'inventory-modal-focus',
      'inventory-modal-retention',
      'inventory-protected-action',
      'inventory-action-publication',
      'inventory-convergence-retry',
    ];
    const nativeTabControls = ['arc4-capture-native-survey-return'];
    const source = { commit: 'a'.repeat(40), branch: 'openai/mac', state: 'committed' };
    const canonicalChrome = '/opt/google/chrome/google-chrome';
    const smallPhone = {
      label: 'small-phone', width: 320, height: 568, dpr: 2, mobile: true,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    };
    const largePhone = {
      label: 'large-phone', width: 412, height: 915, dpr: 3, mobile: true,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    };
    const reportFor = (
      viewport: typeof smallPhone,
      runId: string,
      requiredControls: string[],
    ): Record<string, any> => ({
      schema: 'cf-v2-glassmatrix/v2',
      status: 'pass',
      terminal: true,
      scope: 'targeted-diagnostic',
      certifying: false,
      run: {
        id: runId,
        artifactPath: `apps/game/smoke/glassmatrix-${runId}.json`,
      },
      source,
      sourceEnd: source,
      sourceChange: { detected: false, ending: null },
      summary: { viewportCount: 1, findingCount: 0, instrumentFailureCount: 0 },
      viewportInventory: [viewport],
      browser: {
        executable: canonicalChrome,
        product: 'Chrome/152.0.0.0',
        revision: '@revision',
        user_agent: 'Mozilla/5.0 HeadlessChrome/152.0.0.0',
        js_version: '15.2.0',
        protocol_version: '1.3',
        consistentAcrossViewports: true,
      },
      findings: [],
      instrumentFailures: [],
      controlSummary: {
        selftestRan: true,
        blockedNegativeControls: [],
        negativeControls: requiredControls,
        automaticRetries: 0,
      },
      exit: { code: 0 },
    });
    const smallRunId = 'gha-selftest-glass-preflight';
    const largeRunId = 'gha-selftest-glass-large-phone-preflight';
    const validSmall = reportFor(smallPhone, smallRunId, inventoryControls);
    const documentToken = 'large-phone-document';
    const documentHref = 'http://127.0.0.1:4321/';
    const validLarge = reportFor(largePhone, largeRunId, nativeTabControls);
    validLarge.arc4CaptureOutcomeInventory = {
      plannedOutcomeCodes: [
        'ARC4_CAPTURE_NATIVE_SURVEY_RETURN',
        'ARC4_CAPTURE_PRESENTATION_TRUTH',
        'ARC4_CAPTURE_GEOMETRY_FOCUS',
      ],
      complete: true,
      expectedCount: 3,
      observedCount: 3,
      omitted: [],
      outcomes: [{
        viewport: 'large-phone',
        code: 'ARC4_CAPTURE_NATIVE_SURVEY_RETURN',
        ok: true,
        checks: { idleKeyboardFocus: true },
        diagnostics: {
          sampleFocusSetup: {
            schema: 'cf-v2-glass-arc4-native-tab-setup/v1',
            documentToken,
          },
          sampleFocusHeartbeat: {
            schema: 'cf-v2-glass-arc4-native-tab-heartbeat/v2',
            required: true,
            stateFound: true,
            seamsAvailable: true,
            error: null,
            initial: { documentToken, heartbeatRunning: true },
            quiescence: {
              schema: 'cf-v2-f4-heartbeat-quiescence/v1',
              documentToken,
              wasRunning: true,
              stopped: true,
              cycleSettled: true,
            },
            resume: {
              schema: 'cf-v2-f4-heartbeat-resume/v1',
              documentToken,
              running: true,
            },
            cycleReceipt: {
              schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1',
              documentToken,
              cycle: 'completed',
              reason: null,
              refresh: {
                shipyard: 'panel-closed',
                compendium: 'panel-closed',
                capture: 'completed',
              },
            },
            after: {
              documentToken,
              heartbeatRunning: true,
              originalTargetDisconnected: true,
              originalPriorDisconnected: true,
              replacementAcquired: true,
              priorReplacementAcquired: true,
              priorFocused: true,
            },
            cleanup: { attempted: false, receipt: null, error: null },
          },
          sampleFocusOutcome: {
            schema: 'cf-v2-glass-arc4-native-tab-assessment/v2',
            ok: true,
            instrumentOk: true,
            productOk: true,
            instrumentChecks: Object.fromEntries([
              'heartbeatRequirement', 'setupCarrier', 'setupDocument', 'focusCarrier',
              'documentIdentity', 'trustedTabReceipt', 'scrollCarrier', 'heartbeatLifecycle',
              'cycleReceiptCarrier', 'captureRerenderCompleted', 'replacementObserved',
              'receiptReplacementCoherence',
            ].map((key) => [key, true])),
            productChecks: Object.fromEntries([
              'setupReady', 'setupIdentity', 'tabOrigin', 'currentControls',
              'semanticLineage', 'heartbeatFocusRestored', 'scrollSettled',
              'keyboardFocus', 'activeSemanticFocus',
            ].map((key) => [key, true])),
          },
        },
      }, {
        viewport: 'large-phone', code: 'ARC4_CAPTURE_PRESENTATION_TRUTH', ok: true,
      }, {
        viewport: 'large-phone', code: 'ARC4_CAPTURE_GEOMETRY_FOCUS', ok: true,
      }],
    };
    const shipyardDescriptor = {
      tag: 'SUMMARY',
      id: null,
      focusKey: 'section:mining',
      surveyClose: false,
      captureAction: null,
      engineeringSection: 'mining',
      accessibleName: 'Mining',
    };
    const shipyardSetup = {
      schema: 'cf-v2-glass-keyboard-activation-setup/v1',
      ok: true,
      selector: '#shipyardpanel details[data-engineering-section="mining"] > summary',
      documentToken,
      documentHref,
      instrumentReady: true,
      productReady: true,
      targetCount: 1,
      targetConnected: true,
      focused: true,
      visible: true,
      ...shipyardDescriptor,
      display: 'list-item',
      visibility: 'visible',
      opacity: 1,
      effectiveOpacity: 1,
      rect: [20, 40, 220, 84],
    };
    validLarge.shipyardKeyboardHeartbeatInventory = {
      plannedViewports: ['large-phone'],
      complete: true,
      expectedCount: 1,
      observedCount: 1,
      omitted: [],
      outcomes: [{
        schema: 'cf-v2-glass-shipyard-keyboard-heartbeat-outcome/v1',
        viewport: 'large-phone',
        sectionId: 'mining',
        beforeOpen: true,
        afterOpen: false,
        setup: shipyardSetup,
        heartbeat: {
          schema: 'cf-v2-glass-keyboard-activation-heartbeat/v1',
          required: true,
          stateFound: true,
          seamsAvailable: true,
          setupDocumentToken: documentToken,
          setupDocumentHref: documentHref,
          initial: {
            documentToken,
            documentHref,
            heartbeatRunning: true,
            currentCount: 1,
            currentConnected: true,
            currentFocused: true,
            current: { ...shipyardDescriptor },
            originalTargetDisconnected: false,
            replacementAcquired: false,
          },
          quiescence: {
            schema: 'cf-v2-f4-heartbeat-quiescence/v1',
            documentToken,
            wasRunning: true,
            stopped: true,
            cycleSettled: true,
          },
          resume: {
            schema: 'cf-v2-f4-heartbeat-resume/v1',
            documentToken,
            running: true,
          },
          cycleReceipt: {
            schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1',
            documentToken,
            cycle: 'completed',
            reason: null,
            refresh: {
              shipyard: 'completed',
              compendium: 'panel-closed',
              capture: 'card-hidden',
            },
          },
          after: {
            documentToken,
            documentHref,
            heartbeatRunning: true,
            currentCount: 1,
            currentConnected: true,
            currentFocused: true,
            originalTargetDisconnected: true,
            replacementAcquired: true,
            current: { ...shipyardDescriptor },
          },
          cleanup: { attempted: false, receipt: null, error: null },
          error: null,
        },
        receipt: {
          schema: 'cf-v2-glass-keyboard-activation-receipt/v1',
          trusted: true,
          key: 'Enter',
          code: 'Enter',
          setupDocumentToken: documentToken,
          documentToken,
          setupDocumentHref: documentHref,
          documentHref,
          tag: shipyardDescriptor.tag,
          focusKey: shipyardDescriptor.focusKey,
          surveyClose: shipyardDescriptor.surveyClose,
          ignoredUntrustedEnterCount: 0,
          currentCount: 1,
          currentConnected: true,
          currentVisible: true,
          currentDisplay: 'list-item',
          currentVisibility: 'visible',
          currentOpacity: 1,
          currentEffectiveOpacity: 1,
          currentRect: [20, 40, 220, 84],
          originalTargetDisconnected: true,
          replacementAcquired: true,
          eventTargetIsCurrent: true,
          activeIsCurrent: true,
          current: { ...shipyardDescriptor },
          eventTarget: { ...shipyardDescriptor },
          active: { ...shipyardDescriptor },
        },
        outcome: {
          schema: 'cf-v2-glass-keyboard-activation-assessment/v1',
          ok: true,
          instrumentOk: true,
          productOk: true,
          instrumentChecks: Object.fromEntries([
            'heartbeatRequirement', 'setupCarrier', 'setupDocument', 'setupQueryWitness',
            'setupDescriptor', 'receiptCarrier', 'trustedEnter', 'documentIdentity',
            'currentQueryWitness', 'receiptDescriptors', 'heartbeatLifecycle',
            'heartbeatCycleCarrier', 'shipyardRefreshCompleted',
            'heartbeatReplacementScenario', 'heartbeatReceiptReplacementCoherence',
            'heartbeatCurrentDescriptor',
          ].map((key) => [key, true])),
          productChecks: Object.fromEntries([
            'setupReady', 'currentTarget', 'semanticIdentity', 'eventOrigin',
            'activeTarget', 'replacementLineage', 'heartbeatFocusRestored',
            'heartbeatSemanticIdentity',
          ].map((key) => [key, true])),
        },
      }],
    };
    const evaluate = (
      report: Record<string, any>,
      expectedRunId: string,
      viewport: typeof smallPhone,
      requiredControls: string[],
      requireNativeHeartbeat: boolean,
    ) => spawnSync(
      'jq', [
        '--arg', 'preflight_browser', canonicalChrome,
        '--arg', 'expected_run_id', expectedRunId,
        '--arg', 'expected_artifact_path', `apps/game/smoke/glassmatrix-${expectedRunId}.json`,
        '--argjson', 'expected_viewport', JSON.stringify(viewport),
        '--argjson', 'required_controls', JSON.stringify(requiredControls),
        '--argjson', 'require_native_heartbeat', String(requireNativeHeartbeat),
        '-e', filter,
      ], {
      input: JSON.stringify(report), encoding: 'utf8',
      },
    );
    for (const [label, accepted] of [
      ['small-phone', evaluate(validSmall, smallRunId, smallPhone, inventoryControls, false)],
      ['large-phone', evaluate(validLarge, largeRunId, largePhone, nativeTabControls, true)],
    ] as const) {
      expect(accepted.error, `${label}: ${accepted.stderr}`).toBeUndefined();
      expect(accepted.status, `${label}: ${accepted.stderr}`).toBe(0);
    }
    const mutants = [
      { ...validSmall, schema: 'cf-v2-glassmatrix/v1' },
      { ...validSmall, findings: null },
      { ...validSmall, findings: {} },
      { ...validSmall, instrumentFailures: null },
      {
        ...validSmall,
        viewportInventory: [{ ...validSmall.viewportInventory[0], width: 321 }],
      },
      { ...validSmall, browser: { ...validSmall.browser, product: 'Edg/152.0.0.0' } },
      { ...validSmall, browser: { ...validSmall.browser, product: 'Chrome/152.0.0.0 forged' } },
      { ...validSmall, browser: { ...validSmall.browser, protocol_version: '1.4' } },
      {
        ...validSmall,
        controlSummary: { ...validSmall.controlSummary, negativeControls: null },
      },
      {
        ...validSmall,
        controlSummary: {
          ...validSmall.controlSummary,
          negativeControls: inventoryControls.filter((value) => value !== 'inventory-modal-focus'),
        },
      },
      { ...validSmall, run: { ...validSmall.run, id: 'wrong-run' } },
      { ...validSmall, run: { ...validSmall.run, artifactPath: 'apps/game/smoke/glassmatrix-report.json' } },
      { ...validSmall, sourceEnd: { ...source, commit: 'b'.repeat(40) } },
      { ...validSmall, exit: { code: 1 } },
    ];
    for (const [index, mutant] of mutants.entries()) {
      const rejected = evaluate(mutant, smallRunId, smallPhone, inventoryControls, false);
      expect(rejected.error, `mutant ${index}: ${rejected.stderr}`).toBeUndefined();
      expect(rejected.status, `mutant ${index}: ${rejected.stderr}`).not.toBe(0);
    }
    const heartbeatMutations: ((report: Record<string, any>) => void)[] = [
      (report) => { report.arc4CaptureOutcomeInventory.expectedCount = 2; },
      (report) => {
        report.arc4CaptureOutcomeInventory.outcomes = Object.fromEntries(
          report.arc4CaptureOutcomeInventory.outcomes.map((row: any, index: number) => [index, row]),
        );
      },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].checks.idleKeyboardFocus = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusSetup.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.schema = 'cf-v2-glass-arc4-native-tab-heartbeat/v1'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.stateFound = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.seamsAvailable = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.error = 'collector failed'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.initial.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.initial.heartbeatRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.wasRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.quiescence.cycleSettled = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.resume.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.resume.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt = null; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.cycle = 'skipped'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.reason = 'held'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cycleReceipt.refresh.capture = 'skipped'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.documentToken = 'wrong-document'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.heartbeatRunning = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.originalTargetDisconnected = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.after.priorFocused = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusHeartbeat.cleanup.attempted = true; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.schema = 'old'; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.ok = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.instrumentOk = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.productOk = false; },
      (report) => { report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.instrumentChecks.heartbeatRequirement = false; },
      (report) => { delete report.arc4CaptureOutcomeInventory.outcomes[0].diagnostics.sampleFocusOutcome.productChecks.keyboardFocus; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.expectedCount = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.complete = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.omitted = ['large-phone']; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes = {}; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].sectionId = 'research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].beforeOpen = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].afterOpen = true; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.ok = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.selector = '#wrong'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.display = ''; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.effectiveOpacity = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].setup.rect = [20, 40, 40, 44]; },
      (report) => {
        const row = report.shipyardKeyboardHeartbeatInventory.outcomes[0];
        for (const descriptor of [
          row.setup, row.heartbeat.initial.current, row.heartbeat.after.current, row.receipt.current,
          row.receipt.eventTarget, row.receipt.active,
        ]) descriptor.accessibleName = ' ';
      },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat = null; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.initial.currentCount = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.initial.current.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.quiescence.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.quiescence.wasRunning = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.resume.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cycleReceipt.cycle = 'skipped'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cycleReceipt.refresh.shipyard = 'panel-closed'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.after.currentFocused = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.after.replacementAcquired = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].heartbeat.cleanup.error = 'cleanup failed'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.trusted = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.documentToken = 'wrong-document'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.eventTargetIsCurrent = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentDisplay = ''; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentVisibility = 'collapse'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.currentEffectiveOpacity = 0; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.active.surveyClose = true; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].receipt.active.focusKey = 'section:research'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.schema = 'old'; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.instrumentOk = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.productOk = false; },
      (report) => { report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.instrumentChecks.heartbeatRequirement = false; },
      (report) => { delete report.shipyardKeyboardHeartbeatInventory.outcomes[0].outcome.productChecks.semanticIdentity; },
    ];
    for (const [index, mutate] of heartbeatMutations.entries()) {
      const mutant = structuredClone(validLarge);
      mutate(mutant);
      const rejected = evaluate(mutant, largeRunId, largePhone, nativeTabControls, true);
      expect(rejected.error, `heartbeat mutant ${index}: ${rejected.stderr}`).toBeUndefined();
      expect(rejected.status, `heartbeat mutant ${index}: ${rejected.stderr}`).not.toBe(0);
    }
  });

  it('binds the production heap-phase selftest to its exact collector source contract', () => {
    expect(bindsHeapPhaseSelftestSource(sceneMemoryTool)).toBe(true);
    for (const token of HEAP_PHASE_SOURCE_CONTRACT) {
      expect(
        satisfiesSceneWorkflow(workflow, sceneMemoryTool.replace(token, 'BROKEN')),
        token,
      ).toBe(false);
    }
    expect(satisfiesSceneWorkflow(
      workflow,
      `${sceneMemoryTool}\n${HEAP_PHASE_SOURCE_CONTRACT[0]}`,
    )).toBe(false);
  });

  it('rejects every missing or drifted owned step and any restored focused duplicate', () => {
    for (const token of ORDERED_CONTRACT) {
      expect(satisfiesSceneWorkflow(replaceOwnedToken(workflow, token)), token).toBe(false);
    }
    const anchor = '      - name: install current Arc 1C Edge scene-memory browser';
    for (const duplicate of [
      '      - name: duplicate current producer authority\n        run: npx vitest run tests/current-producer-authorities.test.ts\n',
      '      - name: duplicate SceneMemory contracts\n        run: npx vitest run tests/scenemem-contract.test.ts\n',
      '      - name: duplicate SceneMemory syntax\n        run: node --check tools/scenemem.mjs\n',
    ]) {
      expect(satisfiesSceneWorkflow(workflow.replace(anchor, `${duplicate}${anchor}`))).toBe(false);
    }
  });

  it('rejects anonymous work inserted ahead of the short fail-fast ruler', () => {
    const anchor = '      - name: install current Arc 1C Edge scene-memory browser';
    for (const anonymous of [
      '      - run: npm run compendiummem\n',
      '      - uses: actions/checkout@v4\n',
    ]) {
      expect(satisfiesSceneWorkflow(workflow.replace(anchor, `${anonymous}${anchor}`)))
        .toBe(false);
    }
  });

  it('rejects restoring a point-version pin at the SceneMemory browser boundary', () => {
    expect(satisfiesSceneWorkflow(workflow.replace(
      'https://go.microsoft.com/fwlink/?linkid=2149051',
      'microsoft-edge-stable_151.0.4129.101-1_amd64.deb',
    ))).toBe(false);
  });

  it('keeps live SceneMemory production-only and scopes the remaining browser controls', () => {
    const selftestWithTrailingNewline = `${HEAP_PHASE_SELFTEST_BLOCK}\n`;
    const withoutSelftest = workflow.replace(selftestWithTrailingNewline, '');
    expect(satisfiesSceneWorkflow(withoutSelftest)).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      SCENEMEM_CERTIFICATION_HEADER,
      `${selftestWithTrailingNewline}${SCENEMEM_CERTIFICATION_HEADER}`,
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(withoutSelftest.replace(
      SCENEMEM_VERIFY_HEADER,
      `${selftestWithTrailingNewline}${SCENEMEM_VERIFY_HEADER}`,
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      HEAP_PHASE_SELFTEST_BLOCK,
      HEAP_PHASE_SELFTEST_BLOCK.replace(
        SCENE_BROWSER_ENV,
        'CF_BROWSER: /usr/bin/microsoft-edge-stable',
      ),
    ))).toBe(false);
    const compendiumSelftest = workflowStep(
      workflow, COMPENDIUM_INSTRUMENT_SELFTEST_NAME,
    );
    expect(compendiumSelftest).not.toBeNull();
    expect(satisfiesSceneWorkflow(workflow.replace(
      compendiumSelftest!,
      compendiumSelftest!.replace(
        COMPENDIUM_CHANGED_OR_PRODUCTION_CONDITION,
        "        if: github.event.pull_request.base.ref == 'develop'",
      ),
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      compendiumSelftest!,
      compendiumSelftest!.replace(
        'steps.scope.outputs.compendium_instrument_changed',
        'steps.scope.outputs.browser_transport_changed',
      ),
    ))).toBe(false);
    const chromeLauncherSelftest = workflowStep(workflow, CHROME_LAUNCHER_SELFTEST_NAME);
    expect(chromeLauncherSelftest).not.toBeNull();
    expect(satisfiesSceneWorkflow(workflow.replace(
      chromeLauncherSelftest!,
      chromeLauncherSelftest!.replace(
        TRANSPORT_CHANGED_OR_PRODUCTION_CONDITION,
        COMPENDIUM_CHANGED_OR_PRODUCTION_CONDITION,
      ),
    ))).toBe(false);
    const glassPreflight = workflowStep(workflow, GLASS_PREFLIGHT_NAME);
    expect(glassPreflight).not.toBeNull();
    expect(satisfiesSceneWorkflow(workflow.replace(
      glassPreflight!,
      glassPreflight!.replace(
        GLASS_PREFLIGHT_CONDITION,
        "        if: github.event.pull_request.base.ref == 'develop'",
      ),
    ))).toBe(false);
    for (const weakened of [
      ['timeout-minutes: 7', 'timeout-minutes: 50'],
    ] as const) {
      expect(glassPreflight!.split(/\r?\n/u).filter(
        (line) => line.trim() === weakened[0],
      )).toHaveLength(1);
      const mutantStep = glassPreflight!.replace(weakened[0], weakened[1]);
      const mutant = workflow.replace(glassPreflight!, mutantStep);
      expect(mutantStep, weakened[0]).not.toBe(glassPreflight);
      expect(satisfiesSceneWorkflow(mutant), weakened[0]).toBe(false);
    }
    for (const token of GLASS_PREFLIGHT_VERDICT_TOKENS) {
      expect(workflow.split(token).length - 1, token).toBe(1);
      expect(satisfiesSceneWorkflow(workflow.replace(token, 'true')), token).toBe(false);
    }
    for (const name of [
      'install current Arc 1C Edge scene-memory browser',
      HEAP_PHASE_SELFTEST_NAME,
      'one-attempt scene-memory certification',
    ]) {
      const step = workflowStep(workflow, name);
      expect(step).not.toBeNull();
      for (const leaked of [
        "        if: github.event.pull_request.base.ref == 'develop'",
        COMPENDIUM_CHANGED_OR_PRODUCTION_CONDITION,
        TRANSPORT_CHANGED_OR_PRODUCTION_CONDITION,
        '',
      ]) {
        expect(satisfiesSceneWorkflow(workflow.replace(
          step!, step!.replace(PRODUCTION_ONLY_CONDITION, leaked),
        )), `${name}/${leaked || 'unconditional'}`).toBe(false);
      }
    }
    expect(satisfiesSceneWorkflow(workflow.replace(
      '        run: node tools/scenemem.mjs --heap-phase-selftest',
      '        continue-on-error: true\n        run: node tools/scenemem.mjs --heap-phase-selftest',
    ))).toBe(false);
    const archiveAnchor = '      - name: archive battery reports';
    for (const command of [
      HEAP_PHASE_SELFTEST_COMMAND,
      SCENEMEM_CERTIFICATION_COMMAND,
      SCENEMEM_VERIFY_COMMAND,
      'node tools/scenemem.mjs --verify-run=leaked --budget=budgets/scene-memory-v2.json',
    ]) {
      const leaked = [
        '      - name: leaked SceneMemory develop owner',
        "        if: github.event.pull_request.base.ref == 'develop'",
        '        working-directory: port/v2',
        `        run: ${command}`,
        '',
      ].join('\n');
      expect(satisfiesSceneWorkflow(
        workflow.replace(archiveAnchor, `${leaked}${archiveAnchor}`),
      ), command).toBe(false);
    }
    const verifier = workflowStep(workflow, 'verify current scene-memory evidence');
    expect(verifier).not.toBeNull();
    expect(satisfiesSceneWorkflow(workflow.replace(
      verifier!, verifier!.replace(
        "          github.event.pull_request.base.ref == 'main' &&\n",
        '',
      ),
    ))).toBe(false);
    const developFallback = "          || github.event.pull_request.base.ref == 'develop'";
    expect(satisfiesSceneWorkflow(workflow.replace(
      verifier!,
      verifier!.replace(
        PRODUCTION_VERIFY_CONDITION,
        `${PRODUCTION_VERIFY_CONDITION}\n${developFallback}`,
      ),
    ))).toBe(false);
    expect(workflow).not.toContain('steps.scope.outputs.browser_instrument_changed');
  });

  it('rejects SceneMemory browser scope drift or leakage into the exact Compendium boundary', () => {
    let cursor = 0;
    for (let occurrence = 0; occurrence < 3; occurrence++) {
      const at = workflow.indexOf(SCENE_BROWSER_ENV, cursor);
      expect(at).toBeGreaterThanOrEqual(0);
      expect(satisfiesSceneWorkflow(
        `${workflow.slice(0, at)}CF_BROWSER: /usr/bin/microsoft-edge-stable${workflow.slice(at + SCENE_BROWSER_ENV.length)}`,
      )).toBe(false);
      cursor = at + SCENE_BROWSER_ENV.length;
    }
    expect(satisfiesSceneWorkflow(workflow.replace(
      '          test -x "$scene_edge_browser"',
      '          test -x "$scene_edge_browser"\n'
        + '          printf \'CF_BROWSER=%s\\n\' "$scene_edge_browser" >> "$GITHUB_ENV"',
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      'port/v2/apps/game/smoke/scenemem-report.json',
      'port/v2/apps/game/smoke/missing-scene-report.json',
    ))).toBe(false);
  });
});
