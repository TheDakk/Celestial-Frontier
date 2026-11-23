import { defineConfig } from 'vite';

// The workspace packages ship TypeScript source (their exports point at src/index.ts); Vite compiles them
// in place, as vitest does, so no package has a build step of its own.
export default defineConfig({ build: { target: 'es2022' } });
