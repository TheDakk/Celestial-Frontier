import { configDefaults, defineConfig } from 'vitest/config';

// testTimeout is a hang guard only: no test asserts on its own speed.
// The files that sweep poses (they drive the pack checker, or compose thousands of creature poses) take a longer guard
// of their own, file by file: tests/support/budget.ts says which, how long and why.
// `.claude/**` holds the nested working folders of other branches: their tests are not this branch's.
export default defineConfig({ test: { testTimeout: 30_000, exclude: [...configDefaults.exclude, '.claude/**'] } });
