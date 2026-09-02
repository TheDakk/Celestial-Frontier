import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runBoundedNodeMarker } from '../test-support/bounded-child.js';
// @ts-expect-error The dependency-free workflow scope classifier has no declaration shim.
import { classifyBatteryScope } from '../tools/battery-scope.mjs';
// @ts-expect-error The executable profile policy intentionally has no declaration shim.
import { CHECK_PROFILE_COMMANDS, checkCommandInvocation, checkProfileCommands, checkProfileEnvironment, resolveCheckProfile, runCheckProfile } from '../tools/check-profile.mjs';
// @ts-expect-error The executable preflight intentionally has no declaration shim.
import { HOSTED_STATIC_COMMANDS, commandInvocation, hostedStaticCommands, runHostedStaticCommands } from '../tools/tracked-input-preflight.mjs';

const CHECK_PROFILE_TOOL = fileURLToPath(new URL('../tools/check-profile.mjs', import.meta.url));
const BATTERY_SCOPE_TOOL = fileURLToPath(new URL('../tools/battery-scope.mjs', import.meta.url));
const PREFLIGHT_TOOL = fileURLToPath(new URL('../tools/tracked-input-preflight.mjs', import.meta.url));
const TEST_WORKFLOW = fileURLToPath(new URL('../../../.github/workflows/test.yml', import.meta.url));
const PREVIEW_WORKFLOW = fileURLToPath(
  new URL('../../../.github/workflows/dev-preview-package.yml', import.meta.url),
);
const STEP_NAME = 'tracked-input prehosted controls';
const STEP_MARKER = `      - name: ${STEP_NAME}`;
const EXPLICIT_SELFTEST_COMMAND = 'run: node tools/tracked-input-preflight.mjs --selftest';

const EXPECTED_DEV_COMMANDS = [
  ['npm', 'test'],
  ['npm', 'exec', '--', 'tsc', '--noEmit', '--noUnusedLocals'],
  ['npm', 'exec', '--', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.json'],
  ['npm', 'exec', '--', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.worker.json'],
] as const;
const EXPECTED_DEVELOP_COMMANDS = [
  ...EXPECTED_DEV_COMMANDS,
  ['npm', 'run', 'artaudit'],
  ['npm', 'run', 'overridecheck'],
  ['node', 'tools/speccheck.mjs'],
] as const;
const EXPECTED_PRODUCTION_COMMANDS = [
  ...EXPECTED_DEVELOP_COMMANDS,
  ['npm', 'run', 'overridecontrol'],
] as const;
const EXPECTED_CHECK_PROFILE_COMMANDS = {
  dev: EXPECTED_DEV_COMMANDS,
  develop: EXPECTED_DEVELOP_COMMANDS,
  production: EXPECTED_PRODUCTION_COMMANDS,
} as const;
const EXPECTED_TRACKED_DEVELOP_COMMANDS = [
  ['node', 'tools/check-profile.mjs', '--profile=develop'],
] as const;
const EXPECTED_TRACKED_PRODUCTION_COMMANDS = [
  ['node', 'tools/check-profile.mjs', '--profile=production'],
] as const;

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function explicitSelftestErrors(source: string): string[] {
  const errors: string[] = [];
  if (occurrences(source, STEP_MARKER) !== 0) errors.push('explicit selftest step');
  if (occurrences(source, EXPLICIT_SELFTEST_COMMAND) !== 0) errors.push('explicit selftest command');
  return errors;
}

function profileInventoryErrors(
  profiles: Readonly<Record<string, readonly (readonly string[])[]>>,
): string[] {
  const errors: string[] = [];
  const expectedNames = Object.keys(EXPECTED_CHECK_PROFILE_COMMANDS);
  if (JSON.stringify(Object.keys(profiles)) !== JSON.stringify(expectedNames)) {
    errors.push('profile names');
  }
  for (const name of expectedNames) {
    if (JSON.stringify(profiles[name])
      !== JSON.stringify(EXPECTED_CHECK_PROFILE_COMMANDS[name as keyof typeof EXPECTED_CHECK_PROFILE_COMMANDS])) {
      errors.push(name);
    }
  }
  return errors;
}

function checkProfileToolContractErrors(source: string): string[] {
  const errors: string[] = [];
  const requiredPatterns: readonly [RegExp, string][] = [
    [/Object\.hasOwn\(CHECK_PROFILE_COMMANDS, profile\)/, 'own profile selection'],
    [/for \(const commandTokens of checkProfileCommands\(profile\)\)/, 'ordered fail-fast execution'],
    [/execFileSync\(invocation\.executable, invocation\.args/, 'shell-free execution'],
    [/env: checkProfileEnvironment\(profile, process\.env\)/, 'profile child environment'],
    [/\^--profile=\(dev\|develop\|production\)\$/, 'exact CLI parser'],
    [/CHECK PROFILE: PASS \(\$\{profile\}\)/, 'terminal marker'],
  ];
  for (const [pattern, description] of requiredPatterns) {
    if (!pattern.test(source)) errors.push(description);
  }
  return errors;
}

function preflightToolContractErrors(source: string): string[] {
  const errors: string[] = [];
  const requiredPatterns: readonly [RegExp, string][] = [
    [/checkout-index[^\n]+--all[^\n]+--force/, 'tracked-index export'],
    [/\['diff', '--quiet', 'HEAD', '--'\]/, 'clean tracked state'],
    [/\['ls-files', '--others', '--exclude-standard', '-z'/, 'untracked test detection'],
    [/\['ls-files', '--others', '--ignored', '--exclude-standard', '-z'/, 'ignored test detection'],
    [/includes\('node_modules'\)/, 'dependency-test exclusion'],
    [/Object\.freeze\(\['node', 'tools\/check-profile\.mjs', '--profile=develop'\]\)/, 'develop profile'],
    [/Object\.freeze\(\['node', 'tools\/check-profile\.mjs', '--profile=production'\]\)/, 'production profile'],
    [/\^--profile=\(develop\|production\)\$/, 'profile parser'],
    [/runTrackedInputPreflight\('develop'\);/, 'default develop profile'],
    [/TRACKED INPUT PREFLIGHT: PASS/, 'terminal marker'],
  ];
  for (const [pattern, description] of requiredPatterns) {
    if (!pattern.test(source)) errors.push(description);
  }
  if (occurrences(source, 'requireStableCandidate(head);') !== 2) {
    errors.push('start/end candidate stability');
  }
  if (occurrences(source, 'runHostedStaticCommands(snapshotV2, runHostedStaticCommand, profile);') !== 1
    || !/for \(const command of hostedStaticCommands\(profile\)\) runner\(command, cwd\);/.test(source)) {
    errors.push('ordered command execution');
  }
  return errors;
}

describe('tracked-input prehosted preflight', () => {
  it('passes its hermetic negative controls', () => {
    const result = runBoundedNodeMarker(
      [PREFLIGHT_TOOL, '--selftest'],
      'TRACKED INPUT PREFLIGHT SELFTEST: PASS',
      15_000,
    );
    expect(result.kind, result.diagnostic).toBe('pass');
  }, 20_000);

  it('keeps one immutable owner for the exact static profile argv', () => {
    const source = readFileSync(CHECK_PROFILE_TOOL, 'utf8');
    expect(checkProfileToolContractErrors(source)).toEqual([]);
    expect(profileInventoryErrors(CHECK_PROFILE_COMMANDS)).toEqual([]);
    expect(Object.isFrozen(CHECK_PROFILE_COMMANDS)).toBe(true);

    for (const [name, expected] of Object.entries(EXPECTED_CHECK_PROFILE_COMMANDS)) {
      expect(checkProfileCommands(name), name).toEqual(expected);
      expect(Object.isFrozen(checkProfileCommands(name)), name).toBe(true);
      for (const command of checkProfileCommands(name)) {
        expect(Object.isFrozen(command), `${name}: ${command.join(' ')}`).toBe(true);
      }

      const mutated = {
        ...CHECK_PROFILE_COMMANDS,
        [name]: checkProfileCommands(name).slice(0, -1),
      };
      expect(profileInventoryErrors(mutated), name).toContain(name);
    }

    expect(() => checkProfileCommands('release')).toThrow(/unsupported check profile/u);
    expect(() => checkProfileCommands('toString')).toThrow(/unsupported check profile/u);
    expect(JSON.stringify(EXPECTED_DEVELOP_COMMANDS)).not.toContain('coveragegap');
    expect(JSON.stringify(EXPECTED_DEVELOP_COMMANDS)).not.toContain('overridecontrol');
    expect(JSON.stringify(EXPECTED_DEVELOP_COMMANDS)).not.toContain('current-producer-authorities');
    expect(occurrences(JSON.stringify(EXPECTED_PRODUCTION_COMMANDS), 'overridecontrol')).toBe(1);
  });

  it('executes profiles in order and stops on the first failed command', () => {
    const executed: { profile: string; command: readonly string[]; cwd: string }[] = [];
    runCheckProfile(
      'production',
      (profile: string, command: readonly string[], cwd: string) => {
        executed.push({ profile, command, cwd });
      },
      '/tracked-snapshot/port/v2',
    );
    expect(executed).toEqual(EXPECTED_PRODUCTION_COMMANDS.map((command) => ({
      profile: 'production',
      command,
      cwd: '/tracked-snapshot/port/v2',
    })));

    const beforeFailure: (readonly string[])[] = [];
    expect(() => runCheckProfile(
      'develop',
      (_profile: string, command: readonly string[]) => {
        beforeFailure.push(command);
        if (beforeFailure.length === 2) throw new Error('expected stop');
      },
      '/tracked-snapshot/port/v2',
    )).toThrow('expected stop');
    expect(beforeFailure).toEqual(EXPECTED_DEVELOP_COMMANDS.slice(0, 2));
  });

  it('classifies exact PR scope fail-closed without taxing unrelated V2 work', () => {
    expect(classifyBatteryScope(['port/v2/apps/game/src/main.ts'])).toEqual({
      changedCount: 1,
      legacyChanged: false,
      artInstrumentChanged: false,
      compendiumInstrumentChanged: false,
      browserTransportChanged: false,
      glassPreflightChanged: true,
    });
    expect(classifyBatteryScope(['main.js', 'tools/validate.js'])).toMatchObject({
      changedCount: 2,
      legacyChanged: true,
    });
    expect(classifyBatteryScope([
      'port/v2/packages/art/src/species-render.ts',
      'port/v2/tools/overridecheck.mjs',
    ])).toMatchObject({
      changedCount: 2,
      artInstrumentChanged: true,
      compendiumInstrumentChanged: false,
      browserTransportChanged: false,
      glassPreflightChanged: true,
    });
    for (const path of ['port/v2/package.json', 'port/v2/package-lock.json']) {
      expect(classifyBatteryScope([path]), path).toEqual({
        changedCount: 1,
        legacyChanged: false,
        artInstrumentChanged: true,
        compendiumInstrumentChanged: true,
        browserTransportChanged: true,
        glassPreflightChanged: true,
      });
    }
    for (const path of ['.github/workflows/test.yml', 'port/v2/tools/battery-scope.mjs']) {
      expect(classifyBatteryScope([path]), path).toMatchObject({
        changedCount: 1,
        artInstrumentChanged: true,
        compendiumInstrumentChanged: true,
        browserTransportChanged: true,
        glassPreflightChanged: true,
      });
    }
    for (const path of [
      'port/v2/tools/browserpath.mjs',
      'port/v2/tools/browsercdp.mjs',
    ]) {
      expect(classifyBatteryScope([path]), path).toMatchObject({
        changedCount: 1,
        compendiumInstrumentChanged: true,
        browserTransportChanged: true,
        glassPreflightChanged: true,
      });
    }
    for (const path of [
      'port/v2/tools/compendiummem.mjs',
      'port/v2/tools/compendiummem-contract.mjs',
      'port/v2/tools/compendiummem-browser-preflight.mjs',
      'port/v2/tools/compendiummem-selftest.mjs',
      'port/v2/tools/compendiummem-fixture.mjs',
      'port/v2/tools/sealed-worker-graph.mjs',
      'port/v2/tools/speciesart-build.mjs',
      'port/v2/tools/workspacelock.mjs',
      'port/v2/tools/fixtures/compendium-1500-v1.json',
      'port/v2/budgets/compendium-memory-v1.json',
    ]) {
      expect(classifyBatteryScope([path]), path).toMatchObject({
        changedCount: 1,
        compendiumInstrumentChanged: true,
        browserTransportChanged: false,
        glassPreflightChanged: [
          'port/v2/tools/compendiummem-fixture.mjs',
          'port/v2/tools/sealed-worker-graph.mjs',
          'port/v2/tools/workspacelock.mjs',
          'port/v2/tools/fixtures/compendium-1500-v1.json',
        ].includes(path),
      });
    }
    for (const path of [
      'port/v2/tools/scenemem.mjs',
      'port/v2/tools/scenemem-contract.mjs',
      'port/v2/budgets/scene-memory-v2.json',
    ]) {
      expect(classifyBatteryScope([path]), path).toMatchObject({
        changedCount: 1,
        compendiumInstrumentChanged: false,
        browserTransportChanged: false,
        glassPreflightChanged: false,
      });
    }
    for (const path of [
      'port/baseline-v1.8.9/content-registry.json',
      'port/baseline-v1.8.9/save-fixtures.json',
      'port/v2/tsconfig.json',
      'port/v2/version.json',
      'port/v2/apps/game/audit.html',
      'port/v2/apps/game/hybrid-matrix.html',
      'port/v2/apps/game/index.html',
      'port/v2/apps/game/package.json',
      'port/v2/apps/game/pwa-build.ts',
      'port/v2/apps/game/tsconfig.json',
      'port/v2/apps/game/vite.config.ts',
      'port/v2/apps/game/src/main.ts',
      'port/v2/packages/domain/loot/package.json',
      'port/v2/packages/domain/loot/src/inventory.ts',
      'port/v2/tools/arc4-browser-contract.mjs',
      'port/v2/tools/engineering-browser-contract.mjs',
      'port/v2/tools/glass-engineering-fixture-contract.mjs',
      'port/v2/tools/glassmatrix.mjs',
      'port/v2/tools/glassmatrix-evidence-contract.mjs',
      'port/v2/tools/fixtures/compendium-1500-v1.json',
      'port/v2/tools/sealed-worker-graph.mjs',
      'port/v2/tools/slicesmoke-contract.mjs',
      'port/v2/tools/smokereport.mjs',
    ]) {
      expect(classifyBatteryScope([path]), path).toMatchObject({
        changedCount: 1,
        glassPreflightChanged: true,
      });
    }
    for (const path of [
      'port/v2/apps/game/.gitignore',
      'port/v2/apps/game/src/scene-text.test.ts',
      'port/v2/apps/game/tsconfig.worker.json',
      'port/v2/packages/art/src/biomevista.worker.verbatim.d.ts',
      'port/v2/packages/domain/loot/test/inventory.test.ts',
      'port/v2/tests/glass-inventory-instrument.test.ts',
      'port/v2/tools/glassmatrix.d.mts',
    ]) {
      expect(classifyBatteryScope([path]), path)
        .toMatchObject({ changedCount: 1, glassPreflightChanged: false });
    }
    expect(() => classifyBatteryScope([])).toThrow(/exact PR base\/head diff is empty/u);
    expect(() => classifyBatteryScope(['/absolute/path'])).toThrow(/invalid changed path/u);
    expect(() => classifyBatteryScope(['port/v2/../escape'])).toThrow(/invalid changed path/u);

    const tempRoot = mkdtempSync(join(tmpdir(), 'cf-battery-scope-'));
    try {
      const pathsFile = join(tempRoot, 'paths.nul');
      const outputFile = join(tempRoot, 'github-output');
      writeFileSync(pathsFile, Buffer.from(
        'port/v2/apps/game/src/main.ts\0.github/workflows/test.yml\0',
      ));
      writeFileSync(outputFile, 'existing=value\n');
      const result = spawnSync(process.execPath, [
        BATTERY_SCOPE_TOOL,
        `--paths-file=${pathsFile}`,
        `--github-output=${outputFile}`,
      ], { encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(
        'Classified 2 changed paths: legacy=false art-instrument=true '
          + 'compendium-instrument=true browser-transport=true glass-preflight=true',
      );
      expect(readFileSync(outputFile, 'utf8')).toBe(
        'existing=value\nchanged_count=2\nlegacy_changed=false\n'
          + 'art_instrument_changed=true\ncompendium_instrument_changed=true\n'
          + 'browser_transport_changed=true\nglass_preflight_changed=true\n',
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('runs one snapshot-local policy command for each hosted profile', () => {
    const source = readFileSync(PREFLIGHT_TOOL, 'utf8');
    expect(preflightToolContractErrors(source)).toEqual([]);
    expect(HOSTED_STATIC_COMMANDS).toEqual(EXPECTED_TRACKED_DEVELOP_COMMANDS);
    expect(hostedStaticCommands()).toEqual(EXPECTED_TRACKED_DEVELOP_COMMANDS);
    expect(hostedStaticCommands('develop')).toEqual(EXPECTED_TRACKED_DEVELOP_COMMANDS);
    expect(hostedStaticCommands('production')).toEqual(EXPECTED_TRACKED_PRODUCTION_COMMANDS);
    expect(() => hostedStaticCommands('release')).toThrow(/unsupported tracked-input profile/u);
    expect(() => hostedStaticCommands('toString')).toThrow(/unsupported tracked-input profile/u);

    const executed: { command: readonly string[]; cwd: string }[] = [];
    runHostedStaticCommands('/tracked-snapshot/port/v2', (command: readonly string[], cwd: string) => {
      executed.push({ command, cwd });
    });
    expect(executed).toEqual(EXPECTED_TRACKED_DEVELOP_COMMANDS.map((command) => ({
      command,
      cwd: '/tracked-snapshot/port/v2',
    })));

    const productionExecuted: { command: readonly string[]; cwd: string }[] = [];
    runHostedStaticCommands('/tracked-snapshot/port/v2', (command: readonly string[], cwd: string) => {
      productionExecuted.push({ command, cwd });
    }, 'production');
    expect(productionExecuted).toEqual(EXPECTED_TRACKED_PRODUCTION_COMMANDS.map((command) => ({
      command,
      cwd: '/tracked-snapshot/port/v2',
    })));

    const missingExport = source.replace('checkout-index', 'checkout-disabled');
    expect(preflightToolContractErrors(missingExport)).toContain('tracked-index export');
    const missingDevelop = source.replace(
      "Object.freeze(['node', 'tools/check-profile.mjs', '--profile=develop']),",
      '',
    );
    expect(preflightToolContractErrors(missingDevelop)).toContain('develop profile');
    const missingProduction = source.replace(
      "Object.freeze(['node', 'tools/check-profile.mjs', '--profile=production']),",
      '',
    );
    expect(preflightToolContractErrors(missingProduction)).toContain('production profile');
    const wrongDefault = source.replace(
      "runTrackedInputPreflight('develop');",
      "runTrackedInputPreflight('production');",
    );
    expect(preflightToolContractErrors(wrongDefault)).toContain('default develop profile');
    const missingIgnoredControl = source.replace("'--others', '--ignored'", "'--others', '--not-ignored'");
    expect(preflightToolContractErrors(missingIgnoredControl)).toContain('ignored test detection');
    const missingDependencyExclusion = source.replace("includes('node_modules')", "includes('not-a-dependency')");
    expect(preflightToolContractErrors(missingDependencyExclusion)).toContain('dependency-test exclusion');
    const missingFinalStability = source.replace(
      /\n    requireStableCandidate\(head\);\n    console\.log\(`\\nTRACKED INPUT PREFLIGHT: PASS/,
      '\n    console.log(`\\nTRACKED INPUT PREFLIGHT: PASS',
    );
    expect(preflightToolContractErrors(missingFinalStability)).toContain('start/end candidate stability');
    const missingExecution = source.replace(
      'runHostedStaticCommands(snapshotV2, runHostedStaticCommand, profile);',
      '',
    );
    expect(preflightToolContractErrors(missingExecution)).toContain('ordered command execution');
    const noOpRunner = source.replace('runner(command, cwd);', 'void command;');
    expect(preflightToolContractErrors(noOpRunner)).toContain('ordered command execution');
  });

  it('uses explicit command interpreters without a shell', () => {
    expect(checkCommandInvocation('npm', ['test'], 'linux', 'unused')).toEqual({
      executable: 'npm', args: ['test'],
    });
    expect(checkCommandInvocation('npm', ['run', 'artaudit'], 'win32', 'C:/Windows/System32/cmd.exe'))
      .toEqual({
        executable: 'C:/Windows/System32/cmd.exe',
        args: ['/d', '/s', '/c', 'npm.cmd run artaudit'],
      });
    expect(() => checkCommandInvocation('npm', ['run', 'bad token'], 'win32', 'cmd.exe'))
      .toThrow(/unsafe token/u);
    expect(commandInvocation('node', ['tools/check-profile.mjs'], 'linux', 'unused')).toEqual({
      executable: process.execPath, args: ['tools/check-profile.mjs'],
    });
  });

  it('propagates one validated static profile and cannot inherit a weaker tier', () => {
    expect(resolveCheckProfile({})).toBe('dev');
    expect(resolveCheckProfile({ CF_V2_CHECK_PROFILE: 'production' })).toBe('production');
    expect(() => resolveCheckProfile({ CF_V2_CHECK_PROFILE: 'release' }))
      .toThrow(/unsupported check profile/u);
    expect(() => resolveCheckProfile({ CF_V2_CHECK_PROFILE: 'toString' }))
      .toThrow(/unsupported check profile/u);

    expect(checkProfileEnvironment('develop', {
      CF_V2_CHECK_PROFILE: 'production',
      SENTINEL: 'retained',
    })).toEqual({
      CF_V2_CHECK_PROFILE: 'develop',
      SENTINEL: 'retained',
    });
    expect(checkProfileEnvironment('production', {
      CF_V2_CHECK_PROFILE: 'dev',
    })).toEqual({
      CF_V2_CHECK_PROFILE: 'production',
    });
    expect(() => checkProfileEnvironment('release', {}))
      .toThrow(/unsupported check profile/u);

    const source = readFileSync(CHECK_PROFILE_TOOL, 'utf8');
    const inheritedOnly = source.replace(
      'env: checkProfileEnvironment(profile, process.env)',
      'env: process.env',
    );
    expect(checkProfileToolContractErrors(inheritedOnly)).toContain('profile child environment');
  });

  it.each([TEST_WORKFLOW, PREVIEW_WORKFLOW])(
    'does not duplicate the npm-test-owned preflight selftest in %s',
    (path) => {
      const source = readFileSync(path, 'utf8');
      expect(explicitSelftestErrors(source)).toEqual([]);
      const duplicated = `${source}\n${STEP_MARKER}\n        working-directory: port/v2\n        ${EXPLICIT_SELFTEST_COMMAND}\n`;
      expect(explicitSelftestErrors(duplicated)).toEqual([
        'explicit selftest step',
        'explicit selftest command',
      ]);
    },
  );

  it('binds each guarded workflow branch to the shared policy profile and exact scope classifier', () => {
    const testWorkflow = readFileSync(TEST_WORKFLOW, 'utf8');
    expect(occurrences(testWorkflow, 'node tools/check-profile.mjs --profile=develop')).toBe(1);
    expect(occurrences(testWorkflow, 'node tools/check-profile.mjs --profile=production')).toBe(1);
    for (const token of [
      'fetch-depth: 0',
      'git cat-file -e "$BASE_SHA^{commit}"',
      'git cat-file -e "$HEAD_SHA^{commit}"',
      'git diff --name-only --no-renames -z "$BASE_SHA" "$HEAD_SHA" -- > "$changed_paths"',
      'node port/v2/tools/battery-scope.mjs \\',
      '--paths-file="$changed_paths" \\',
      '--github-output="$GITHUB_OUTPUT"',
    ]) {
      expect(occurrences(testWorkflow, token), token).toBe(1);
    }
    expect(occurrences(testWorkflow, 'steps.scope.outputs.legacy_changed')).toBe(4);
    expect(occurrences(testWorkflow, 'steps.scope.outputs.art_instrument_changed')).toBe(1);
    expect(occurrences(testWorkflow, 'steps.scope.outputs.compendium_instrument_changed')).toBe(1);
    expect(occurrences(testWorkflow, 'steps.scope.outputs.browser_transport_changed')).toBe(1);
    expect(occurrences(testWorkflow, 'steps.scope.outputs.glass_preflight_changed')).toBe(1);
    expect(testWorkflow).not.toContain('steps.scope.outputs.browser_instrument_changed');
    expect(testWorkflow).not.toContain('npm run check:');

    const previewWorkflow = readFileSync(PREVIEW_WORKFLOW, 'utf8');
    expect(occurrences(previewWorkflow, 'run: node tools/check-profile.mjs --profile=dev')).toBe(1);
    expect(previewWorkflow).not.toContain('--profile=develop');
    expect(previewWorkflow).not.toContain('--profile=production');
    expect(previewWorkflow).not.toContain('npm run check:');
  });
});
