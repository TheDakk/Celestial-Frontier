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
const SCENEMEM_CERTIFICATION_COMMAND =
  'node tools/scenemem.mjs --budget=budgets/scene-memory-v2.json';
const SCENEMEM_VERIFY_COMMAND =
  'node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v2.json';

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
const GLASS_PREFLIGHT_BROWSER_BINDING =
  'preflight_browser="$(node tools/browserpath.mjs --print)"';
const GLASS_SMALL_PHONE_VERIFY =
  'node tools/glassmatrix.mjs --verify-targeted-run="$CF_V2_GLASSMATRIX_PREFLIGHT_RUN_ID" --viewport=small-phone --browser="$preflight_browser"';
const GLASS_LARGE_PHONE_VERIFY =
  'node tools/glassmatrix.mjs --verify-targeted-run="$CF_V2_GLASSMATRIX_LARGE_PHONE_PREFLIGHT_RUN_ID" --viewport=large-phone --browser="$preflight_browser"';
const GLASS_PREFLIGHT_CONDITION =
  "        if: >-\n          github.event.pull_request.base.ref == 'develop' &&\n          steps.scope.outputs.glass_preflight_changed == 'true'";
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
  `- name: ${CHROME_LAUNCHER_SELFTEST_NAME}`,
  `run: ${CHROME_LAUNCHER_SELFTEST_COMMAND}`,
  `- name: ${GLASS_PREFLIGHT_NAME}`,
  'timeout-minutes: 7',
  GLASS_PREFLIGHT_BROWSER_BINDING,
  GLASS_SMALL_PHONE_PREFLIGHT_COMMAND,
  GLASS_SMALL_PHONE_VERIFY,
  GLASS_LARGE_PHONE_PREFLIGHT_COMMAND,
  GLASS_LARGE_PHONE_VERIFY,
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
    || source.split(GLASS_SMALL_PHONE_VERIFY).length !== 2
    || source.split(GLASS_LARGE_PHONE_VERIFY).length !== 2
    || glassPreflight.includes('verify_preflight_report')
    || glassPreflight.includes('jq --arg')
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
