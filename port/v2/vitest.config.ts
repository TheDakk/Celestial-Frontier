import {defineConfig, configDefaults} from 'vitest/config';

// Node's test files have their own runner; collecting them here executes their
// side effects but reports zero Vitest tests. npm test runs both owners.
// testTimeout is the hang budget, not an assertion: no test measures its own speed against it. Vitest's 5 s default
// was outgrown on the 4-vCPU hosted runner (PR #46 run 3: three different tests over 5 s, 58 more between 2.5 and 5 s),
// so one budget replaces per-test raises. Tests that set an explicit timeout keep it.
export default defineConfig({test: {exclude: [...configDefaults.exclude, 'tools/**/*.test.mjs'], testTimeout: 30_000}});
