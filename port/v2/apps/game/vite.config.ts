import { defineConfig } from 'vite';

export default defineConfig({
  /* the workspace packages ship TypeScript source (exports -> ./src/index.ts);
     Vite transpiles them in-place — no per-package build step, same as vitest */
  build: { target: 'es2022', sourcemap: true },
});
