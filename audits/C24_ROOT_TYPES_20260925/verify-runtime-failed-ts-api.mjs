import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import ts from '../../port/v2/node_modules/typescript/lib/typescript.js';
const files=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(x=>x.endsWith('.ts'));
const transpile=(text)=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,removeComments:true}}).outputText;
const hash=s=>createHash('sha256').update(s).digest('hex');const rows=files.map(file=>{const before=transpile(execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'})),after=transpile(fs.readFileSync(file,'utf8'));return{file,before:hash(before),after:hash(after),identical:before===after};});
fs.writeFileSync(import.meta.dirname+'/runtime-parity.json',JSON.stringify(rows,null,2)+'\n');if(rows.some(x=>!x.identical))process.exitCode=1;
