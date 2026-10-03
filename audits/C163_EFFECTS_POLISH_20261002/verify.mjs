import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=process.cwd(),out='audits/C163_EFFECTS_POLISH_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p));
const write=(p,x)=>fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n',{flag:'wx'}),rows=[];
for(const theme of ['storm','void','stone','sand']){
 const anchors=out+'/'+theme+'/anchors.json',input=fs.readFileSync(anchors),old=json(out+'/'+theme+'/intake.json'),candidate=json(anchors),predecessor=json(old.predecessor.anchors);
 for(const key of ['originAnchor','contactAnchor','phaseOrder','canvasSize'])assert.deepEqual(candidate[key],predecessor[key]);
 for(const phase of old.unchangedPhases)assert.equal(sha(fs.readFileSync(out+'/'+theme+'/registered/'+phase.phase+'.png')),phase.sha256);
 const command=['run','tests/effects-theme-delivery.test.ts'],proc=spawnSync('./node_modules/.bin/vitest',command,{cwd:path.join(root,'port/v2'),env:{...process.env,THEME_DELIVERY:anchors,THEME:theme},encoding:'utf8'});
 const output=((proc.stdout??'')+(proc.stderr??'')).replaceAll(root,'.').replaceAll(os.homedir(),'~');write(out+'/'+theme+'/validation.log',output);
 assert.equal(proc.status,0,theme+' focused delivery owner failed');assert.equal(sha(fs.readFileSync(anchors)),sha(input),'candidate drift');
 rows.push({theme,candidate:anchors,candidateSha256:sha(input),command:'$env:THEME_DELIVERY="'+anchors+'"; $env:THEME="'+theme+'"; Push-Location port/v2; npx vitest run tests/effects-theme-delivery.test.ts; Pop-Location',exitCode:proc.status,log:out+'/'+theme+'/validation.log',logSha256:sha(Buffer.from(output))});console.log(theme+': PASS');
}
write(out+'/validation.json',{schema:'cf.c163-effects-focused-validation/v1',status:'PASS',nativeProof:false,qualityAccepted:false,testOwner:{path:'port/v2/tests/effects-theme-delivery.test.ts',sha256:sha(fs.readFileSync('port/v2/tests/effects-theme-delivery.test.ts'))},rows});
