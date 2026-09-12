import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const tools = path.join(root, 'tools/local-image-generation');
export function kitRuntimeAssets(): Plugin {
  const names = ['kit-stage-worker.mjs', 'kit-worker-engine.mjs', 'kit-worker-expansion.mjs',
    'kit-engine-math.mjs', 'kit-contact-math.mjs', 'pipeline-math.mjs', 'gpu-profile.mjs',
    'denoiser-shapes.mjs', 'browser-variant-plan.json',
    'node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs',
    'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs',
    'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm',
    'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'];
  return { name: 'cf-kit-runtime',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/__local_ai/')) { next(); return; }
        const name = url.slice('/__local_ai/'.length);
        if (!names.includes(name)) { next(); return; }
        if (!['GET', 'HEAD'].includes(req.method ?? '')) { res.statusCode = 405; res.end(); return; }
        res.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : name.endsWith('.json') ? 'application/json' : 'text/javascript');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = fs.createReadStream(path.join(tools, name)); stream.on('error', () => res.destroy()); stream.pipe(res);
      });
    },
    generateBundle() { for (const name of names) this.emitFile({ type: 'asset', fileName: '__local_ai/' + name, source: fs.readFileSync(path.join(tools, name)) }); },
  };
}
