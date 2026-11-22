import { configDefaults, defineConfig } from 'vitest/config';

// testTimeout is a hang guard only: no test asserts on its own speed.
// `.claude/**` holds the nested working folders of other branches: their tests are not this branch's.
export default defineConfig({ test: { testTimeout: 30_000, exclude: [...configDefaults.exclude, '.claude/**'] } });
