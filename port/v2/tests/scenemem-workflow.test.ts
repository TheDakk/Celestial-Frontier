import fs from 'node:fs';
import path from 'node:path';
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
const COMPENDIUM_INSTRUMENT_SELFTEST_NAME =
  'changed-or-production Compendium browser instrument selftests';
const COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND = 'npm run compendiummem:selftest';
const CHANGED_OR_PRODUCTION_CONDITION =
  "        if: >-\n          github.event.pull_request.base.ref == 'main' ||\n          steps.scope.outputs.browser_instrument_changed == 'true'";
const HEAP_PHASE_SELFTEST_HEADER = `      - name: ${HEAP_PHASE_SELFTEST_NAME}`;
const SCENEMEM_CERTIFICATION_HEADER = '      - name: one-attempt scene-memory certification';
const SCENEMEM_VERIFY_HEADER = '      - name: verify current scene-memory evidence';
const HEAP_PHASE_SELFTEST_BLOCK = [
  HEAP_PHASE_SELFTEST_HEADER,
  '        if: >-',
  "          github.event.pull_request.base.ref == 'main' ||",
  "          steps.scope.outputs.browser_instrument_changed == 'true'",
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
  "github.event.label.name == 'actions-budget-approved' &&",
  'github.actor == github.repository_owner',
  'needs: authorize',
] as const;
const ORDERED_CONTRACT = [
  `- name: ${STATIC_PROFILE_NAME}`,
  'develop) node tools/check-profile.mjs --profile=develop ;;',
  'main) node tools/check-profile.mjs --profile=production ;;',
  '- name: develop changed-art mutation control',
  'run: npm run overridecontrol',
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
  'run: node tools/scenemem.mjs --budget=budgets/scene-memory-v2.json',
  '- name: verify current scene-memory evidence',
  'run: node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v2.json',
  `- name: ${COMPENDIUM_INSTRUMENT_SELFTEST_NAME}`,
  'node tools/browserpath.mjs --selftest',
  'node tools/compendiummem-browser-preflight.mjs --selftest',
  COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND,
  '- name: install exact Arc 1A Edge calibration browser',
] as const;
const ORDERED_STEP_NAMES = [
  STATIC_PROFILE_NAME,
  'develop changed-art mutation control',
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
  const certification = workflowStep(source, 'one-attempt scene-memory certification');
  const verifier = workflowStep(source, 'verify current scene-memory evidence');
  const compendiumInstrumentSelftest = workflowStep(
    source, COMPENDIUM_INSTRUMENT_SELFTEST_NAME,
  );
  if (!staticProfile || !certification || !verifier
    || !compendiumInstrumentSelftest) return false;
  if (!staticProfile.includes('develop) node tools/check-profile.mjs --profile=develop ;;')
    || !staticProfile.includes('main) node tools/check-profile.mjs --profile=production ;;')
    || staticProfile.includes('npm run check:')) return false;
  if (source.includes('npx vitest run tests/current-producer-authorities.test.ts')
    || source.includes('npx vitest run tests/scenemem-contract.test.ts')
    || source.includes('node --check tools/scenemem.mjs')
    || source.includes('node --check tools/scenemem-contract.mjs')) return false;
  if (/^ {8}if:/mu.test(certification)
    || certification.includes('continue-on-error')
    || certification.includes("github.event.pull_request.base.ref == 'main'")) return false;
  if (!verifier.includes('always() &&')
    || !verifier.includes("steps.scenemem.outcome == 'success'")
    || !verifier.includes("steps.scenemem.outcome == 'failure'")
    || verifier.includes('github.event.pull_request.base.ref')) return false;

  if (source.split(HEAP_PHASE_SELFTEST_COMMAND).length !== 2) return false;
  if (source.split(COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND).length !== 2
    || !compendiumInstrumentSelftest.includes(CHANGED_OR_PRODUCTION_CONDITION)
    || !compendiumInstrumentSelftest.includes('node tools/browserpath.mjs --selftest')
    || !compendiumInstrumentSelftest.includes(
      'node tools/compendiummem-browser-preflight.mjs --selftest',
    )
    || !compendiumInstrumentSelftest.includes(
      COMPENDIUM_INSTRUMENT_SELFTEST_COMMAND,
    )) return false;
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

  it('binds the changed-instrument/production heap-phase selftest to its exact collector source contract', () => {
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

  it('keeps heap-phase changed-instrument/production-only while certification and verification remain common', () => {
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
      "        if: >-\n          github.event.pull_request.base.ref == 'main' ||\n          steps.scope.outputs.browser_instrument_changed == 'true'",
      "        if: github.event.pull_request.base.ref == 'develop'",
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
        CHANGED_OR_PRODUCTION_CONDITION,
        "        if: github.event.pull_request.base.ref == 'develop'",
      ),
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      SCENEMEM_CERTIFICATION_HEADER,
      `${SCENEMEM_CERTIFICATION_HEADER}\n        if: github.event.pull_request.base.ref == 'main'`,
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      "          always() &&\n          (steps.scenemem.outcome == 'success' || steps.scenemem.outcome == 'failure')",
      "          always() &&\n          github.event.pull_request.base.ref == 'main' &&\n          (steps.scenemem.outcome == 'success' || steps.scenemem.outcome == 'failure')",
    ))).toBe(false);
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
