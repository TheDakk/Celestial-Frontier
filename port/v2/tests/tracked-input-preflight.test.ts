import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runBoundedNodeMarker } from '../test-support/bounded-child.js';
// @ts-expect-error The executable preflight intentionally has no declaration shim.
import { HOSTED_STATIC_COMMANDS, commandInvocation, runHostedStaticCommands } from '../tools/tracked-input-preflight.mjs';

const TOOL = fileURLToPath(new URL('../tools/tracked-input-preflight.mjs', import.meta.url));
const TEST_WORKFLOW = fileURLToPath(new URL('../../../.github/workflows/test.yml', import.meta.url));
const PREVIEW_WORKFLOW = fileURLToPath(
  new URL('../../../.github/workflows/dev-preview-package.yml', import.meta.url),
);
const STEP_NAME = 'tracked-input prehosted controls';
const STEP_MARKER = `      - name: ${STEP_NAME}`;

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function namedStep(source: string): string | null {
  const start = source.indexOf(STEP_MARKER);
  if (start < 0 || occurrences(source, STEP_MARKER) !== 1) return null;
  const next = source.indexOf('\n      - ', start + STEP_MARKER.length);
  return source.slice(start, next < 0 ? source.length : next);
}

function workflowContractErrors(source: string, followingStepName: string): string[] {
  const errors: string[] = [];
  const step = namedStep(source);
  if (!step) return ['missing or duplicate tracked-input control step'];
  if (!step.includes('working-directory: port/v2')) errors.push('wrong working directory');
  if (!step.includes('run: node tools/tracked-input-preflight.mjs --selftest')) {
    errors.push('wrong selftest command');
  }
  if (/continue-on-error\s*:|\|\|\s*true/.test(step)) errors.push('soft-fail control');
  const install = source.indexOf('      - name: install v2 workspace');
  const control = source.indexOf(STEP_MARKER);
  const following = source.indexOf(`      - name: ${followingStepName}`);
  const starts = [...source.matchAll(/^      - /gmu)].map((match) => match.index);
  const installPosition = starts.indexOf(install);
  const controlPosition = starts.indexOf(control);
  if (
    installPosition < 0
    || controlPosition !== installPosition + 1
    || starts[controlPosition + 1] !== following
  ) errors.push('control step order');
  return errors;
}

function toolContractErrors(source: string): string[] {
  const errors: string[] = [];
  const requiredPatterns: readonly [RegExp, string][] = [
    [/checkout-index[^\n]+--all[^\n]+--force/, 'tracked-index export'],
    [/\['diff', '--quiet', 'HEAD', '--'\]/, 'clean tracked state'],
    [/\['ls-files', '--others', '--exclude-standard', '-z'/, 'untracked test detection'],
    [/\['ls-files', '--others', '--ignored', '--exclude-standard', '-z'/, 'ignored test detection'],
    [/includes\('node_modules'\)/, 'dependency-test exclusion'],
    [/Object\.freeze\(\['npm', 'test'\]\)/, 'npm test'],
    [/Object\.freeze\(\['npm', 'run', 'typecheck'\]\)/, 'typecheck'],
    [/Object\.freeze\(\['npm', 'run', 'artunused'\]\)/, 'artunused'],
    [/Object\.freeze\(\['npm', 'run', 'artaudit'\]\)/, 'artaudit'],
    [/Object\.freeze\(\['npm', 'run', 'overridecheck'\]\)/, 'overridecheck'],
    [/Object\.freeze\(\['npm', 'run', 'overridecontrol'\]\)/, 'overridecontrol'],
    [/Object\.freeze\(\['npm', 'run', 'coveragegap'\]\)/, 'coveragegap'],
    [/Object\.freeze\(\['node', 'tools\/speccheck\.mjs'\]\)/, 'speccheck'],
    [/current-producer-authorities\.test\.ts/, 'producer authority'],
    [/TRACKED INPUT PREFLIGHT: PASS/, 'terminal marker'],
  ];
  for (const [pattern, description] of requiredPatterns) {
    if (!pattern.test(source)) errors.push(description);
  }
  if (occurrences(source, 'requireStableCandidate(head);') !== 2) {
    errors.push('start/end candidate stability');
  }
  if (occurrences(source, 'runHostedStaticCommands(snapshotV2);') !== 1
    || !/for \(const command of HOSTED_STATIC_COMMANDS\) runner\(command, cwd\);/.test(source)) {
    errors.push('ordered command execution');
  }
  return errors;
}

const EXPECTED_STATIC_COMMANDS = Object.freeze([
  ['npm', 'test'],
  ['npm', 'run', 'typecheck'],
  ['npm', 'run', 'artunused'],
  ['npm', 'run', 'artaudit'],
  ['npm', 'run', 'overridecheck'],
  ['npm', 'run', 'overridecontrol'],
  ['npm', 'run', 'coveragegap'],
  ['node', 'tools/speccheck.mjs'],
  ['npm', 'exec', '--', 'vitest', 'run', 'tests/current-producer-authorities.test.ts'],
] as const);

describe('tracked-input prehosted preflight', () => {
  it('passes its hermetic negative controls', () => {
    const result = runBoundedNodeMarker(
      [TOOL, '--selftest'],
      'TRACKED INPUT PREFLIGHT SELFTEST: PASS',
      15_000,
    );
    expect(result.kind, result.diagnostic).toBe('pass');
  }, 20_000);

  it('seals the complete hosted static command inventory and tracked-only export', () => {
    const source = readFileSync(TOOL, 'utf8');
    expect(toolContractErrors(source)).toEqual([]);
    expect(HOSTED_STATIC_COMMANDS).toEqual(EXPECTED_STATIC_COMMANDS);

    const executed: { command: readonly string[]; cwd: string }[] = [];
    runHostedStaticCommands('/tracked-snapshot', (command: readonly string[], cwd: string) => {
      executed.push({ command, cwd });
    });
    expect(executed).toEqual(EXPECTED_STATIC_COMMANDS.map((command) => ({
      command,
      cwd: '/tracked-snapshot',
    })));

    const missingExport = source.replace('checkout-index', 'checkout-disabled');
    expect(toolContractErrors(missingExport)).toContain('tracked-index export');
    const missingTest = source.replace("Object.freeze(['npm', 'test']),", '');
    expect(toolContractErrors(missingTest)).toContain('npm test');
    const missingIgnoredControl = source.replace("'--others', '--ignored'", "'--others', '--not-ignored'");
    expect(toolContractErrors(missingIgnoredControl)).toContain('ignored test detection');
    const missingDependencyExclusion = source.replace("includes('node_modules')", "includes('not-a-dependency')");
    expect(toolContractErrors(missingDependencyExclusion)).toContain('dependency-test exclusion');
    const missingFinalStability = source.replace(
      /\n    requireStableCandidate\(head\);\n    console\.log\(`\\nTRACKED INPUT PREFLIGHT: PASS/,
      '\n    console.log(`\\nTRACKED INPUT PREFLIGHT: PASS',
    );
    expect(toolContractErrors(missingFinalStability)).toContain('start/end candidate stability');
    const missingExecution = source.replace('runHostedStaticCommands(snapshotV2);', '');
    expect(toolContractErrors(missingExecution)).toContain('ordered command execution');
    const noOpRunner = source.replace('runner(command, cwd);', 'void command;');
    expect(toolContractErrors(noOpRunner)).toContain('ordered command execution');
  });

  it('uses an explicit command interpreter for Windows npm without a shell', () => {
    expect(commandInvocation('npm', ['run', 'typecheck'], 'linux', 'unused')).toEqual({
      executable: 'npm', args: ['run', 'typecheck'],
    });
    expect(commandInvocation('npm', ['run', 'typecheck'], 'win32', 'C:/Windows/System32/cmd.exe'))
      .toEqual({
        executable: 'C:/Windows/System32/cmd.exe',
        args: ['/d', '/s', '/c', 'npm.cmd run typecheck'],
      });
    expect(() => commandInvocation('npm', ['run', 'bad token'], 'win32', 'cmd.exe'))
      .toThrow(/unsafe token/u);
  });

  it.each([
    [TEST_WORKFLOW, 'v2 parity, type, art, and coverage gates'],
    [PREVIEW_WORKFLOW, 'deterministic, type, and art gates'],
  ])('runs the control immediately after the v2 install in %s', (path, followingStep) => {
    const source = readFileSync(path, 'utf8');
    expect(workflowContractErrors(source, followingStep)).toEqual([]);

    expect(workflowContractErrors(source.replace(namedStep(source) ?? '', ''), followingStep)).not.toEqual([]);
    expect(
      workflowContractErrors(
        source.replace('run: node tools/tracked-input-preflight.mjs --selftest', 'run: npm test'),
        followingStep,
      ),
    ).toContain('wrong selftest command');
    expect(
      workflowContractErrors(
        source.replace(STEP_MARKER, `${STEP_MARKER}\n        continue-on-error: true`),
        followingStep,
      ),
    ).toContain('soft-fail control');
    expect(
      workflowContractErrors(
        source.replace(STEP_MARKER, `      - name: intervening step\n        run: 'true'\n${STEP_MARKER}`),
        followingStep,
      ),
    ).toContain('control step order');
    expect(
      workflowContractErrors(
        source.replace(STEP_MARKER, `      - run: 'true'\n${STEP_MARKER}`),
        followingStep,
      ),
    ).toContain('control step order');
  });
});
