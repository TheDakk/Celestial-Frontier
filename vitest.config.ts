import { defineConfig } from 'vitest/config';

// testTimeout is a hang guard only: no test asserts on its own speed.
export default defineConfig({ test: { testTimeout: 30_000 } });
