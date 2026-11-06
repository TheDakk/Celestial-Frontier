import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {defaultArenaWorld,lakeArenaWorld} from '../../../port/v2/apps/game/src/battle2/habitat-arena.ts';
import {compileHabitatBattle,resolvePhysicalHabitat} from '../../../port/v2/apps/game/src/battle-habitat.ts';
const B='audits/C475_DECISIONS_20261019/coordinator',rows=[];
const read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const slug of ['tube-worm-d41-r02','ice-worm-d41','flatworm-d41-r02','sand-dollar-d41-r02']){
 const p=B+'/plans/'+slug+'/plan.json',plan=read(p)[0],record=read(plan.fit+'/record.json'),script=read(plan.script),physical=resolvePhysicalHabitat(record),world={...defaultArenaWorld(.78),...script.world};
 const compile=w=>compileHabitatBattle({contextId:'C475-world-input',seed:424242,round:0,kind:'wild',home:w,visitor:w,left:physical,right:physical});
 const result=compile(world);assert.equal(result.status,'READY');assert.equal(result.left.medium,physical.preferred);assert.equal(result.right.medium,physical.preferred);
 const negative=[];
 if(physical.realm==='aquatic'){
  assert.deepEqual(world,lakeArenaWorld(.78));
  for(const [name,w] of [['missing-liquid',{...world,liquid:null}],['wrong-liquid',{...world,liquid:'methane'}],['dry-default',defaultArenaWorld(.78)]]){assert.equal(compile(w).status,'UNSUPPORTED',name);negative.push(name);}
 }else{assert.equal(physical.realm,'land');assert.equal(script.world,undefined);}
 rows.push({slug,realm:physical.realm,actualMedium:result.left.medium,script:{path:plan.script,sha256:sha(plan.script)},record:{path:plan.fit+'/record.json',sha256:sha(plan.fit+'/record.json')},positive:'READY',rejectedMutants:negative});
}
const first=read(B+'/plans/tube-worm-d41/native/report.json');assert.equal(first.status,'FAIL');assert.match(first.error,/habitat: Selected home arena cannot support/);assert.deepEqual(first.script.world,{surfaceWater:true});
const output={status:'PASS_ACTUAL_HABITAT_INPUT_CONTROLS',rows,positiveControls:4,rejectedMutants:9,actualFirstRefusal:{path:B+'/plans/tube-worm-d41/native/report.json',sha256:sha(B+'/plans/tube-worm-d41/native/report.json')},runtimeOrGateChanges:false};
fs.writeFileSync(B+'/native-world-controls-r01.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:output.status,positiveControls:4,rejectedMutants:9}));
