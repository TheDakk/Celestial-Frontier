import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.resolve(here, '..', '..', '..', '.github', 'workflows', 'test.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const SCENE_BROWSER_ENV =
  'CF_BROWSER: ${{ runner.temp }}/scenemem-edge-current/opt/microsoft/msedge/microsoft-edge';
const ZERO_DEFAULT_CONTRACT = [
  'on:\n  pull_request:\n    types: [labeled]',
  "github.event.label.name == 'actions-budget-approved' &&",
  'github.actor == github.repository_owner',
  'needs: authorize',
] as const;
const ORDERED_CONTRACT = [
  '- name: v2 parity, type, art, and coverage gates',
  'npm test',
  '- name: current producer authority binding',
  '\n        run: npx vitest run tests/current-producer-authorities.test.ts\n',
  '- name: install current Arc 1C Edge scene-memory browser',
  'EDGE_PACKAGE_URL: https://go.microsoft.com/fwlink/?linkid=2149051',
  'test "$(dpkg-deb --field "$scene_edge_package" Package)" = "microsoft-edge-stable"',
  'dpkg-deb --extract "$scene_edge_package" "$scene_edge_root"',
  'test -x "$scene_edge_browser"',
  '- name: scene-memory instrument and calibration controls',
  'npx vitest run tests/scenemem-contract.test.ts tests/scenemem-budget.test.ts tests/scenemem-tool.test.ts',
  '- name: one-attempt scene-memory certification',
  'id: scenemem',
  'timeout-minutes: 10',
  'run: node tools/scenemem.mjs --budget=budgets/scene-memory-v2.json',
  '- name: verify current scene-memory evidence',
  'run: node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v2.json',
  '- name: install exact Arc 1A Edge calibration browser',
] as const;
const ORDERED_STEP_NAMES = [
  'v2 parity, type, art, and coverage gates',
  'current producer authority binding',
  'install current Arc 1C Edge scene-memory browser',
  'scene-memory instrument and calibration controls',
  'one-attempt scene-memory certification',
  'verify current scene-memory evidence',
  'install exact Arc 1A Edge calibration browser',
] as const;

const satisfiesZeroDefaultPolicy = (source: string): boolean => {
  const permissions = source.indexOf('\npermissions:');
  if (permissions < 0) return false;
  const trigger = source.slice(0, permissions);
  return ZERO_DEFAULT_CONTRACT.every((token) => source.includes(token))
    && !/\n  (?:push|workflow_dispatch|schedule):/.test(trigger);
};

const satisfiesSceneWorkflow = (source: string): boolean => {
  if (!satisfiesZeroDefaultPolicy(source)) return false;
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
  const directSteps = [...owned.matchAll(/^(?: {6})?- (.+)$/gm)].map((match) => match[1]);
  if (JSON.stringify(directSteps) !== JSON.stringify(
    ORDERED_STEP_NAMES.map((name) => `name: ${name}`),
  )) return false;
  const authorityHeader = '      - name: current producer authority binding';
  const authorityStart = source.indexOf(authorityHeader);
  const authorityEnd = source.indexOf('\n\n', authorityStart + 1);
  if (authorityStart < 0 || authorityEnd < 0) return false;
  const authorityBlock = source.slice(authorityStart, authorityEnd + 2);
  if (authorityBlock !== `${authorityHeader}\n        working-directory: port/v2\n        run: npx vitest run tests/current-producer-authorities.test.ts\n\n`) return false;
  const env = 'CF_SCENEMEM_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-scenemem';
  if (source.split(env).length !== 2) return false;
  const sceneBrowserOwners = [
    'scene-memory instrument and calibration controls',
    'one-attempt scene-memory certification',
    'verify current scene-memory evidence',
  ];
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
    && source.includes('- name: archive scene-memory evidence')
    && source.includes('name: v2-scene-memory-evidence')
    && source.includes('path: port/v2/apps/game/smoke/scenemem-report.json');
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

  it('keeps current Edge-family setup, one attempt, verification, and artifact ownership ordered', () => {
    expect(satisfiesSceneWorkflow(workflow)).toBe(true);
  });

  it('rejects every missing or drifted owned step', () => {
    for (const token of ORDERED_CONTRACT) {
      expect(satisfiesSceneWorkflow(replaceOwnedToken(workflow, token)), token).toBe(false);
    }
    for (const bypass of [
      '        run: npx vitest run tests/current-producer-authorities.test.ts -- --exclude tests/current-producer-authorities.test.ts',
      '        run: npx vitest run tests/current-producer-authorities.test.ts || true',
      '        run: |\n          set +e\n          npx vitest run tests/current-producer-authorities.test.ts',
    ]) {
      expect(satisfiesSceneWorkflow(workflow.replace(
        '        run: npx vitest run tests/current-producer-authorities.test.ts',
        bypass,
      )), bypass).toBe(false);
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
      '          CF_BROWSER: ${{ runner.temp }}/scenemem-edge-current/opt/microsoft/msedge/microsoft-edge',
      '          CF_BROWSER: ${{ runner.temp }}/scenemem-edge-current/opt/microsoft/msedge/microsoft-edge\n'
        + '          CF_BROWSER_COPY: ${{ runner.temp }}/scenemem-edge-current/opt/microsoft/msedge/microsoft-edge',
    ))).toBe(false);
    expect(satisfiesSceneWorkflow(workflow.replace(
      '          test -x "$scene_edge_browser"',
      '          test -x "$scene_edge_browser"\n'
        + '          printf \'CF_BROWSER=%s\\n\' "$scene_edge_browser" >> "$GITHUB_ENV"',
    ))).toBe(false);
  });
});
