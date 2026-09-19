import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/** Local development audition only. Originals and candidates never enter a pack implicitly. */
export function audioProductionAssets(): Plugin {
  const directory=path.resolve(import.meta.dirname,'../../../../audio-production/audition');
  return {name:'cf-audio-production-review',apply:'serve',configureServer(server) {
    server.middlewares.use((req,res,next)=>{
      const url=req.url?.split('?')[0] ?? '';
      if (!url.startsWith('/__cf-audio-review/')) return next();
      try {
        if (req.method!=='GET' && req.method!=='HEAD') {res.statusCode=405;res.end();return;}
        const name=url.slice('/__cf-audio-review/'.length);
        if (!/^[a-z0-9._-]+$/u.test(name)) throw Error('Invalid audio path');
        const manifest=fs.readFileSync(path.join(directory,'catalog.json'));
        if (name==='plans.json') {const plans=fs.readFileSync(path.join(directory,'plans.json'));res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(req.method==='HEAD'?undefined:plans);return;}
        if (name==='catalog.json') {res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(req.method==='HEAD'?undefined:manifest);return;}
        const catalog=JSON.parse(manifest.toString()) as {outputs:{previewUrl:string;previewSha256:string}[]};
        const cue=catalog.outputs.find(c=>c.previewUrl===url); if(!cue)throw Error('Not an audition asset');
        const bytes=fs.readFileSync(path.join(directory,name));
        if(createHash('sha256').update(bytes).digest('hex')!==cue.previewSha256)throw Error('Changed audition asset');
        res.setHeader('Content-Type','audio/wav');res.setHeader('Content-Length',bytes.length);res.setHeader('Cache-Control','no-store');
        res.end(req.method==='HEAD'?undefined:bytes);
      } catch {res.statusCode=404;res.end('Audio production candidate unavailable');}
    });
  }};
}
