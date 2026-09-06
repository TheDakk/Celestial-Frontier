import { defineConfig } from 'vite';
import { celestialFrontierPwaPlugin } from './pwa-build.js';
import { gameBuildMode } from './pwa-build.js';

export default defineConfig(({ mode }) => ({
  // Production-built evidence is explicit; NODE_ENV and dev/preview never opt in.
  define: { __CF_EVIDENCE_BUILD__: JSON.stringify(gameBuildMode(mode) === 'evidence') },
  plugins: [celestialFrontierPwaPlugin()],
  /* the workspace packages ship TypeScript source (exports -> ./src/index.ts);
     Vite transpiles them in-place — no per-package build step, same as vitest */
  build: { target: 'es2022', sourcemap: true, rollupOptions: { input: { main: 'index.html', audit: 'audit.html', hybridMatrix: 'hybrid-matrix.html', audiovisualPilot: 'audiovisual-pilot.html' } } },
  worker: { format: 'es' },
  /* content-registry.json lives in port/baseline-v1.8.9 (the fixture home,
     one truth) — outside this app root, so the DEV server needs the allow;
     `vite build` inlines it either way */
  server: { fs: { allow: ['../../..'] } },
}));
