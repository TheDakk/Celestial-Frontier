import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='audits/C132_LIBRARY_SCALE_ATTACK_20261002',file='port/v2/apps/game/src/battle2/library-arena.test.ts',sha=b=>createHash('sha256').update(b).digest('hex'),expected='1e74d781f23ba68f747a2d23adddfa4cc59df8dbfa8ad6cd2350a87400f5be68',green=fs.readFileSync(file),before=JSON.parse(fs.readFileSync(dir+'/source-change.json'));
if(sha(green)!==expected||fs.existsSync(dir+'/negative-control.json'))throw Error('Expected untouched green owner and one negative-control attempt only');
const from="      const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, medium, ordinal, undefined, declaration); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; };";
const to="      const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; const r = compileAnatomyAttack(card, medium, ordinal, undefined, declaration); return null; };";
if(green.toString().split(from).length!==2)throw Error('Scale callback match is not unique');
const mutant=green.toString().replace(from,to),normalize=s=>s.split(os.homedir()).join('~'),start=performance.now();let run,log='',restored=false;
fs.writeFileSync(dir+'/mutant.library-arena.test.ts',mutant,{flag:'wx'});
try{
 fs.writeFileSync(file+'.c132.tmp',mutant,{flag:'wx'});fs.renameSync(file+'.c132.tmp',file);
 run=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','apps/game/src/battle2/library-arena.test.ts','-t','SCALE SWEEP','--reporter=verbose'],{cwd:path.resolve('port/v2'),encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,NO_COLOR:'1',FORCE_COLOR:'0'}});
 log=normalize((run.stdout||'')+'\n'+(run.stderr||''));
}finally{
 fs.writeFileSync(file+'.c132.restore.tmp',green,{flag:'wx'});fs.renameSync(file+'.c132.restore.tmp',file);restored=sha(fs.readFileSync(file))===expected;if(!restored)throw Error('Green test restoration hash mismatch');
}
fs.writeFileSync(dir+'/negative-control.log',log,{flag:'wx'});
const caught=run.status!==0&&run.status!==null&&/anatomical attack must not fall back/.test(log)&&/expected null not to be null/.test(log),report={schema:'cf.c132-library-scale-negative-control/v1',status:caught?'EXPECTED_REFUSAL_PASS':'CONTROL_FAILED',mutation:'Only the scale-sweep A callback return is changed from its compiled TurnAttack to null; compilation and all owner assertions remain unchanged.',command:'node node_modules/vitest/vitest.mjs run apps/game/src/battle2/library-arena.test.ts -t "SCALE SWEEP" --reporter=verbose',workingDirectory:'~/Projects/celestial-frontier-openai-mac/port/v2',exitCode:run.status,signal:run.signal,expectedFailureObserved:caught,durationMs:performance.now()-start,mutantSha256:sha(mutant),greenBeforeSha256:sha(green),greenRestoredSha256:sha(fs.readFileSync(file)),restored,protectedInputsUnchanged:before.protectedInputs.every(p=>sha(fs.readFileSync(p.path))===p.sha256),log:{path:dir+'/negative-control.log',sha256:sha(log)},attempts:1,fullOwnerRerun:false,nativeRun:false};
fs.writeFileSync(dir+'/negative-control.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));console.log(log.split('\n').slice(-25).join('\n'));if(!caught||!report.protectedInputsUnchanged)process.exitCode=1;

