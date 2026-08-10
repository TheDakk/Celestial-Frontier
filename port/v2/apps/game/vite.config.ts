import { defineConfig } from 'vite';

export default defineConfig({
  /* the workspace packages ship TypeScript source (exports -> ./src/index.ts);
     Vite transpiles them in-place — no per-package build step, same as vitest */
  build: { target: 'es2022', sourcemap: true, rollupOptions: { input: { main: 'index.html', audit: 'audit.html', hybridMatrix: 'hybrid-matrix.html' } } },
  /* content-registry.json lives in port/baseline-v1.8.9 (the fixture home,
     one truth) — outside this app root, so the DEV server needs the allow;
     `vite build` inlines it either way */
  server: { fs: { allow: ['../../..'] } },
});
