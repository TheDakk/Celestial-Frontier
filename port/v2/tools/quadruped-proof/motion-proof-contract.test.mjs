import test from 'node:test';import assert from 'node:assert/strict';
import {inspectFramePacing,inspectEncodedFrames,createMotionObservation} from './motion-proof-contract.mjs';
import {createTurnPoseSampler} from './turn-performance.mjs';
test('pacing admits a real 60 Hz trace and rejects 30 Hz, stalls, missing samples and slow rigs',()=>{
 const good=Array(600).fill(1000/60),updates=Array(601).fill(.8),cpu=Array(601).fill(3);
 assert(Math.abs(inspectFramePacing(good,updates,cpu).fps-60)<1e-9);
 for(const delta of [Array(300).fill(1000/30),Array(600).fill(1000/30),good.map((v,i)=>i===20?120:v)])assert.throws(()=>inspectFramePacing(delta,updates,cpu));
 assert.throws(()=>inspectFramePacing(good,updates.slice(1),cpu),/CPU samples/);
 assert.throws(()=>inspectFramePacing(good,updates.map(()=>2),cpu),/2 ms/);
 assert.throws(()=>inspectEncodedFrames([{codec_type:'video',nb_read_frames:'300'}]),/lost frames/);
 assert.equal(inspectEncodedFrames([{codec_type:'video',nb_read_frames:'601',width:1536,height:740}]).frames,601);
});
test('motion evidence rejects static appendages, missing phases and missing endpoints',()=>{
 const joints=['root','head','jaw','tail0','earFarTip','earNearTip'],phases=['ready','command','approach','action','hitstop','impact','return','idle'];
 const run=(mutate=()=>{})=>{const o=createMotionObservation(joints);for(let i=0;i<=600;i++){const sample={ms:i*10000/600,phase:phases[i%8],role:i<300?'attacker':'target',pose:Object.fromEntries(joints.map(j=>[j,{rotation:Math.sin(i/20)}]))};mutate(sample,i);o.observe(sample);}return o.finish();};
 assert.equal(run().lastMs,10000);
 assert.throws(()=>run(s=>s.pose.jaw.rotation=0),/unmoving appendage jaw/);
 assert.throws(()=>run(s=>s.phase='idle'),/missing phase/);
 assert.throws(()=>run((s,i)=>{if(i===600)s.ms=9999;}),/endpoints/);
});
test('turn sampler retains additive curves, freezes hitstop and kills every compiled player',()=>{
 let created=0,killed=0;
 const create=(timeline,target)=>{created++;return{seek(ms){target.setJoint('root',timeline.value+ms/1000,0,0);target.setJoint('head',timeline.value,0,0);},stop(){killed++;}};};
 const clip=value=>({source:'timeline',timeline:{value,durationMs:100,bodyMs:100}});
 const plan={beats:{commandEnd:100,actionStart:200,impactAt:250,hitstopEnd:280,actionEnd:330,returnEnd:430,reactionStart:280},clips:{attacker:{idle:clip(1),approach:clip(2),action:clip(3),after:clip(4)},target:{idle:clip(5),reaction:clip(6)}},targetFaints:false};
 const sampler=createTurnPoseSampler(create);
 assert(Math.abs(sampler.sample(plan,150).root.rotation-3.2)<1e-12);
 assert.deepEqual(sampler.sample(plan,260),sampler.sample(plan,275));
 assert.equal(sampler.sample(plan,300,true).head.rotation,11);
 sampler.dispose();sampler.dispose();assert.equal(killed,created);assert.throws(()=>sampler.sample(plan,0),/Invalid turn sample/);
});
