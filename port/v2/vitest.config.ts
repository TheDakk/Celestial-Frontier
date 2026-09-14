import {defineConfig, configDefaults} from 'vitest/config';

// Node's test files have their own runner; collecting them here executes their
// side effects but reports zero Vitest tests. npm test runs both owners.
export default defineConfig({test: {exclude: [...configDefaults.exclude, 'tools/**/*.test.mjs']}});
