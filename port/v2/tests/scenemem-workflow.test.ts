import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.resolve(here, '..', '..', '..', '.github', 'workflows', 'test.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const ZERO_DEFAULT_CONTRACT = [
  'on:\n  pull_request:\n    types: [labeled]',
  "github.event.label.name == 'actions-budget-approved' &&",
  'github.actor == github.repository_owner',
  'needs: authorize',
] as const;
const ORDERED_CONTRACT = [
  '- name: verify current Compendium memory evidence',
  '- name: install exact Arc 1C Edge scene-memory browser',
  'EDGE_PACKAGE_URL: https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/microsoft-edge-stable_151.0.4129.101-1_amd64.deb',
  'EDGE_PACKAGE_SHA256: bd7604025424914a61c06293cb6bf269141a29d8c54cf1997110bc96d3365d60',
  'sudo apt-get install --yes "$scene_edge_package"',
  'test "$(dpkg-query -W -f=\'${Version}\' microsoft-edge-stable)" = "151.0.4129.101-1"',
  '- name: scene-memory instrument and calibration controls',
  'npx vitest run tests/scenemem-contract.test.ts tests/scenemem-budget.test.ts tests/scenemem-tool.test.ts',
  '- name: one-attempt scene-memory certification',
  'id: scenemem',
  'timeout-minutes: 10',
  'run: node tools/scenemem.mjs --budget=budgets/scene-memory-v2.json',
  '- name: verify current scene-memory evidence',
  'run: node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v2.json',
  '- name: Chrome provenance and reporter selftests',
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
  let cursor = -1;
  for (const token of ORDERED_CONTRACT) {
    const index = source.indexOf(token);
    if (index <= cursor || source.indexOf(token, index + 1) !== -1) return false;
    cursor = index;
  }
  const env = 'CF_SCENEMEM_RUN_ID: gha-${{ github.run_id }}-${{ github.run_attempt }}-scenemem';
  if (source.split(env).length !== 2) return false;
  const owned = source.slice(
    source.indexOf(ORDERED_CONTRACT[1]),
    source.indexOf(ORDERED_CONTRACT.at(-1)!),
  );
  return !owned.includes('continue-on-error')
    && !owned.includes('--calibrate')
    && !owned.includes('--allow-dirty')
    && source.includes('- name: archive scene-memory evidence')
    && source.includes('name: v2-scene-memory-evidence')
    && source.includes('path: port/v2/apps/game/smoke/scenemem-report.json');
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

  it('keeps exact Edge install, one attempt, verification, and artifact ownership ordered', () => {
    expect(satisfiesSceneWorkflow(workflow)).toBe(true);
  });

  it('rejects every missing or drifted owned step', () => {
    for (const token of ORDERED_CONTRACT) {
      expect(satisfiesSceneWorkflow(workflow.replace(token, 'BROKEN')), token).toBe(false);
    }
  });
});
