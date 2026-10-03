import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Import the actual two runners under a different home. Merely checking a helper would
// miss a remaining hard-coded path in either table. Calibration must remain import-safe.
for(const home of ['/virtual/cf-anatomy-home-a','/virtual/cf anatomy home b']){
 test(`both runner subject tables follow the current home: ${home}`,()=>{
  const source=`
   import assert from 'node:assert/strict';
   import os from 'node:os';
   import path from 'node:path';
   import {syncBuiltinESMExports} from 'node:module';
   os.homedir=()=>${JSON.stringify(home)};
   syncBuiltinESMExports();
   const {SUBJECTS}=await import(${JSON.stringify(new URL('./score.mjs',import.meta.url).href)});
   const {CALIBRATION_SUBJECTS}=await import(${JSON.stringify(new URL('./calibrate.mjs',import.meta.url).href)});
   const codex=path.join(os.homedir(),'Projects','celestial-frontier-openai-mac');
   const scores=SUBJECTS.filter(([id])=>id!=='civet');
   assert.equal(scores.length,6);
   for(const row of scores)for(const file of row.slice(2).filter(Boolean)){
    assert(file.startsWith(codex+path.sep),'every Codex master/record/presence follows current home');
    assert(file.includes(path.sep+'audits'+path.sep));
   }
   const calibrated=CALIBRATION_SUBJECTS.filter(([id])=>id==='P1-coconut');
   assert.equal(calibrated.length,1);
   assert.equal(calibrated[0][2],path.join(codex,'audits/VISION_P1_COCONUT_20260920/generation-01/coconut-crab-master.png'));
   assert.equal(CALIBRATION_SUBJECTS.length,7);
   console.log('PASS alternate-home subject tables');
  `;
  const output=execFileSync(process.execPath,['--input-type=module','-e',source],{
   encoding:'utf8',timeout:15_000,env:{...process.env,ANATOMY_SUBJECTS:''},stdio:['ignore','pipe','pipe'],
  });
  assert.equal(output.trim(),'PASS alternate-home subject tables');
 });
}
