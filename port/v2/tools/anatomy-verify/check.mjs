/** Pre-commit check for this folder: every runner must RUN on the committed files before a number is recorded
 * (two commits on 2026-09-21 shipped a runner that did not run, with numbers written beforehand). Runs score,
 * ic4 and sheet (into a scratch dir) and exits nonzero on any error. Usage: node check.mjs */
import {spawnSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname);const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'anatomy-check-'));
const steps=[['score.mjs','25'],['ic4.mjs'],['sheet.mjs',tmp]];let ok=true;
for(const [f,...args] of steps){const r=spawnSync(process.execPath,[path.join(here,f),...args],{encoding:'utf8'});const tail=(r.stdout||'').trim().split('\n').slice(-1)[0]||'';console.log((r.status===0?'ok  ':'FAIL')+' '+f.padEnd(10)+' '+tail.slice(0,110));if(r.status!==0){ok=false;console.log((r.stderr||'').split('\n').slice(0,6).join('\n'));}}
fs.rmSync(tmp,{recursive:true,force:true});process.exit(ok?0:1);
