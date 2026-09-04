#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHILD_TIMEOUT_MS = 30 * 60 * 1_000;
const command = (...tokens) => Object.freeze(tokens);

const DEV_COMMANDS = Object.freeze([
  command('npm', 'test'),
  command('npm', 'exec', '--', 'tsc', '--noEmit', '--noUnusedLocals'),
  command('npm', 'exec', '--', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.json'),
  command('npm', 'exec', '--', 'tsc', '--noEmit', '-p', 'apps/game/tsconfig.worker.json'),
]);
const DEVELOP_COMMANDS = Object.freeze([
  ...DEV_COMMANDS,
  command('npm', 'run', 'artaudit'),
  command('npm', 'run', 'overridecheck'),
  command('node', 'tools/speccheck.mjs'),
]);
const PRODUCTION_COMMANDS = Object.freeze([
  ...DEVELOP_COMMANDS,
  command('npm', 'run', 'overridecontrol'),
]);

export const CHECK_PROFILE_COMMANDS = Object.freeze({
  dev: DEV_COMMANDS,
  develop: DEVELOP_COMMANDS,
  production: PRODUCTION_COMMANDS,
});

export function checkProfileCommands(profile) {
  if (!Object.hasOwn(CHECK_PROFILE_COMMANDS, profile)) {
    throw new Error(`unsupported check profile: ${String(profile)}`);
  }
  return CHECK_PROFILE_COMMANDS[profile];
}

export function resolveCheckProfile(environment = process.env) {
  const profile = environment.CF_V2_CHECK_PROFILE ?? 'dev';
  checkProfileCommands(profile);
  return profile;
}

export function checkProfileEnvironment(profile, environment = process.env) {
  checkProfileCommands(profile);
  return Object.freeze({
    ...environment,
    CF_V2_CHECK_PROFILE: profile,
  });
}

export function checkCommandInvocation(
  name,
  args,
  platform = process.platform,
  commandInterpreter = process.env.ComSpec || 'cmd.exe',
) {
  if (name === 'node') return Object.freeze({ executable: process.execPath, args: [...args] });
  if (name === 'npm' && platform !== 'win32') {
    return Object.freeze({ executable: 'npm', args: [...args] });
  }
  if (name === 'npm') {
    const tokens = ['npm.cmd', ...args];
    if (tokens.some((token) => !/^[A-Za-z0-9_./:@=+,-]+$/.test(token))) {
      throw new Error('unsafe token in Windows npm command');
    }
    return Object.freeze({
      executable: commandInterpreter,
      args: ['/d', '/s', '/c', tokens.join(' ')],
    });
  }
  throw new Error(`unsupported check-profile executable: ${name}`);
}

function runCheckCommand(profile, commandTokens, cwd) {
  const [name, ...args] = commandTokens;
  const invocation = checkCommandInvocation(name, args);
  console.log(`\n[check:${profile}] ${commandTokens.join(' ')}`);
  execFileSync(invocation.executable, invocation.args, {
    cwd,
    env: checkProfileEnvironment(profile, process.env),
    stdio: 'inherit',
    timeout: CHILD_TIMEOUT_MS,
  });
}

export function runCheckProfile(
  profile,
  runner = runCheckCommand,
  cwd = V2_ROOT,
) {
  for (const commandTokens of checkProfileCommands(profile)) {
    runner(profile, commandTokens, cwd);
  }
}

function main() {
  const args = process.argv.slice(2);
  const profile = args.length === 1
    ? /^--profile=(dev|develop|production)$/.exec(args[0])?.[1]
    : undefined;
  if (!profile) {
    throw new Error('usage: node tools/check-profile.mjs --profile=dev|develop|production');
  }
  runCheckProfile(profile);
  console.log(`\nCHECK PROFILE: PASS (${profile})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`CHECK PROFILE: FAIL\n${detail}`);
    process.exitCode = 1;
  }
}
