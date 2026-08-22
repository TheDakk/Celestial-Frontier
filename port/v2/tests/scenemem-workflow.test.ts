import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflowPath = path.resolve(here, '..', '..', '..', '.github', 'workflows', 'test.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const ORDERED_CONTRACT = [
  '- name: verify current Compendium memory evidence',
  '- name: install exact Arc 1B Edge scene-memory browser',
  'EDGE_PACKAGE_URL: https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/microsoft-edge-stable_151.0.4129.93-1_amd64.deb',
  'EDGE_PACKAGE_SHA256: 09e3819fcd01e526cf4c26dab8a028679ced0cfd73ce89418c773c47ca366ebf',
  'sudo apt-get install --yes "$scene_edge_package"',
  'test "$(dpkg-query -W -f=\'${Version}\' microsoft-edge-stable)" = "151.0.4129.93-1"',
  '- name: scene-memory instrument and calibration controls',
  'npx vitest run tests/scenemem-contract.test.ts tests/scenemem-budget.test.ts tests/scenemem-tool.test.ts',
  '- name: one-attempt scene-memory certification',
  'id: scenemem',
  'timeout-minutes: 10',
  'run: node tools/scenemem.mjs --budget=budgets/scene-memory-v1.json',
  '- name: verify current scene-memory evidence',
  'run: node tools/scenemem.mjs --verify-run="$CF_SCENEMEM_RUN_ID" --budget=budgets/scene-memory-v1.json',
  '- name: Chrome provenance and reporter selftests',
] as const;

const satisfiesSceneWorkflow = (source: string): boolean => {
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
  it('keeps exact Edge install, one attempt, verification, and artifact ownership ordered', () => {
    expect(satisfiesSceneWorkflow(workflow)).toBe(true);
  });

  it('rejects every missing or drifted owned step', () => {
    for (const token of ORDERED_CONTRACT) {
      expect(satisfiesSceneWorkflow(workflow.replace(token, 'BROKEN')), token).toBe(false);
    }
  });
});
