import fs from 'node:fs';import assert from 'node:assert/strict';import{createRequire}from'node:module';
import{compileBodyCard,buildTimeline,createGsapPlayer}from'../../port/v2/apps/game/src/motion/index.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{preparePaintedSamples,posedPaintedY}from'../C202_PRIMATE_REFERENCES_20261004/painted-samples.mjs';
import{createPaintPublication}from'./paint-publication.mjs';import{createForehandSupport,convexHull}from'./forehand-support.ts';
import{buildTurnPlan,sampleTurn,sampleClip}from'../../port/v2/apps/game/src/battle2/choreography.ts';
import{loadCreatureRigV1}from'../../port/v2/apps/game/src/creature-rig.ts';
import{createForehandHinge}from'./forehand-hinge.ts';
import{createSourceJoinProbe,assessSourceJoinContinuity}from'../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import{rasterPaint}from'../C132_FAINT_GROUND_20261002/render-mesh.mjs';
const {PNG}=createRequire(process.cwd()+'/port/v2/package.json')('pngjs'),B='audits/C203_PRIMATE_REFERENCES_20261004',J=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const [candidate,old,mode,outName,gainArg='1']=process.argv.slice(2);const gain=Number(gainArg);assert(Number.isFinite(gain)&&gain>=0&&gain<=1);assert(['baseline','source-only','support','hinge'].includes(mode));
const base='audits/C202_PRIMATE_REFERENCES_20261004/'+old,dir=B+'/'+candidate,fit=(mode==='baseline'?base:dir)+'/fit01',out=dir+'/'+outName;assert(!fs.existsSync(out));fs.mkdirSync(out);
const record=J(fit+'/record.json'),binding=J(fit+'/binding.json'),manifest=J(fit+'/parts/manifest.json'),atlas=PNG.sync.read(fs.readFileSync(fit+'/parts/atlas/'+manifest.creatureId+'.png'));
const joinProbe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.width,height:atlas.height}});
const oldBinding=J(base+'/fit01/binding.json'),oldManifest=J(base+'/fit01/parts/manifest.json'),oldAtlas=PNG.sync.read(fs.readFileSync(base+'/fit01/parts/atlas/'+oldManifest.creatureId+'.png'));
const joints=['armNearHand','armFarHand'],sourceHands=joints.map(j=>{
 const prepared=preparePaintedSamples(oldBinding,oldAtlas,oldBinding.parts.find((p:any)=>p.joint===j).id);
 const corners=prepared.samples.flatMap((s:any)=>[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>[s.x+x,s.y+y]));
 return {joint:j,hull:convexHull(corners),positiveTexels:prepared.positiveTexels};
});
const support=createForehandHinge(record,familyContractForRecord(record),sourceHands),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),pub=createPaintPublication(record,binding,card.realm,['support','hinge'].includes(mode)?(p:any,phase:any)=>support.resolve(p,phase):null);
assert.equal(mode,'hinge');assert(gain>0&&gain<=1,'zero gain is a rest control, never a faint candidate');
const prepared=joints.map(j=>preparePaintedSamples(binding,atlas,binding.parts.find((p:any)=>p.joint===j).id)),ground=record.geometry.groundLineY*record.geometry.height,epsilon=8*2**-23*record.geometry.height,baseline=createPaintPublication(record,binding,card.realm);
const scale=(timeline:any,g:number)=>{const t=structuredClone(timeline);for(const keys of [...Object.values(t.tracks),t.root.dx,t.root.dy,...t.secondary.map((s:any)=>s.keys)] as any[])for(const k of keys)k.value*=g;return t;};
const {Texture,BufferImageSource}=createRequire(process.cwd()+'/port/v2/package.json')('pixi.js'),atlasBytes=fs.readFileSync(fit+'/parts/atlas/'+manifest.creatureId+'.png'),master=fs.readFileSync(dir+'/master.png'),key=PNG.sync.read(fs.readFileSync(fit+'/parts/keyed.png'));
const tex=new Texture({source:new BufferImageSource({resource:new Uint8Array(atlas.data),width:atlas.width,height:atlas.height})}),alpha=Uint8Array.from({length:key.width*key.height},(_,i)=>key.data[i*4+3]);
const rig=await loadCreatureRigV1(record,binding,master,alpha,atlasBytes,async()=>tex),rows:any[]=[],controls:any={nonFaint:[],negative:[],parity:[]};
const measure=(result:any)=>prepared.map(p=>posedPaintedY(p,result.positions,record.geometry.height,ground));
function parity(result:any,label:string){rig.applyPose(result.resolved);for(const p of rig.parts)assert.deepEqual(p.display.children[0].geometry.getBuffer('aPosition').data,result.positions[p.id]);controls.parity.push(label);}
function check(pose:any,phase:any,label:string,render=false){try{
 const r=pub.publish(pose,phase),hands=measure(r),joins=assessSourceJoinContinuity(joinProbe,r.positions),maxBelow=Math.max(...hands.map(h=>h.maximumBelowGuidePx));
 const row={label,status:maxBelow<=epsilon&&joins.status==='PASS'?'PASS_DIAGNOSTIC':'HELD',hands,joins:{status:joins.status,maxGapPx:joins.maxGapPx,excluded:joins.excluded.filter((j:any)=>j.maxGapPx>epsilon)},contactError:r.contactError,paintTargetError:r.paintTargetError,forehand:r.forehand,pose:r.resolved};rows.push(row);
 if(render){parity(r,label);for(const facing of [1,-1])fs.writeFileSync(out+'/'+label+(facing===1?'-right':'-left')+'.png',PNG.sync.write(rasterPaint(record,binding,atlas,r.positions,facing)),{flag:'wx'});}return r;
}catch(e:any){rows.push({label,status:'REFUSED',error:e.message});return null;}}
try{
 const faint=buildTimeline(card,'faint',record.identity.seed),scaled=scale(faint,gain);
 assert.deepEqual(scaled.phases,faint.phases);assert.equal(scaled.durationMs,faint.durationMs);assert.deepEqual(scaled.limitsRad,faint.limitsRad);
 for(let i=0;i<=256;i++){const ms=faint.durationMs*i/256;check(sampleClip({source:'timeline',timeline:scaled},ms),{actionId:'faint',elapsedMs:ms,durationMs:faint.durationMs,weight:1,realm:card.realm,travel:'stage'},'faint-'+i,[0,128,256].includes(i));}
 for(const action of ['idle','cast','hit']){const tl=buildTimeline(card,action,record.identity.seed);for(const f of [0,.5,1]){const pose=sampleClip({source:'timeline',timeline:tl},tl.durationMs*f),phase={actionId:action,elapsedMs:tl.durationMs*f,durationMs:tl.durationMs,weight:1,realm:card.realm,travel:'stage'},a=baseline.publish(pose,phase),b=pub.publish(pose,phase);assert.deepEqual(a.positions,b.positions);assert.equal(support.resolve(pose,phase).pose,pose);controls.nonFaint.push({action,fraction:f,byteIdentical:true});}}
 assert.throws(()=>createForehandHinge(record,familyContractForRecord(record),sourceHands.map((h,i)=>i? h:{...h,hull:[]})),/observed hand contour/);controls.negative.push('missing actual hand contour rejected');
 const originalPose=sampleClip({source:'timeline',timeline:faint},faint.durationMs),endPhase={actionId:'faint',elapsedMs:faint.durationMs,durationMs:faint.durationMs,weight:1,realm:card.realm,travel:'stage'},original=baseline.publish(originalPose,endPhase),oldBelow=Math.max(...measure(original).map(h=>h.maximumBelowGuidePx));assert(oldBelow>20);controls.negative.push({control:'original deep faint paint remains below floor',maximumBelowGuidePx:oldBelow});
 const rest=sampleClip({source:'timeline',timeline:scale(faint,0)},faint.durationMs),restOut=pub.publish(rest,endPhase);assert(Math.max(...measure(restOut).map(h=>h.maximumBelowGuidePx))<=epsilon);controls.negative.push({control:'zero gain is explicitly rest only',qualifies:false});
 const restBound=Math.max(...measure(restOut).map(h=>h.maximumPaintedYBound)),mutantShift=ground-restBound+1;
 const shifted=Object.fromEntries(Object.entries(restOut.positions).map(([id,b]:any)=>[id,Float32Array.from(b,(v,i)=>i%2?v+mutantShift/record.geometry.height:v)]));assert(Math.max(...prepared.map(p=>posedPaintedY(p,shifted,record.geometry.height,ground).maximumBelowGuidePx))>.9);controls.negative.push({control:'one source-pixel below actual guide publication mutant rejected',translationSourcePx:mutantShift,priorPaintBound:restBound,guide:ground});
 const idle=buildTimeline(card,'idle',record.identity.seed);
 for(let phaseIndex=0;phaseIndex<8;phaseIndex++){
  const plan:any=structuredClone(buildTurnPlan({seed:record.identity.seed,attacker:{side:'left',mass:1,card:null,seed:1,label:'control'},target:{side:'right',mass:1,card,seed:record.identity.seed,label:record.identity.earthName},delivery:'cast',theme:'wild',outcome:'hit',damage:10,targetFaints:true,effect:null,arena:{groundLineY:.78,stands:{left:{x:1/3,y:.78},right:{x:2/3,y:.78}}},readyMs:1000+idle.durationMs*phaseIndex/8,commandMs:400,idleTailMs:600}));
  plan.clips.target.reaction.timeline=scale(plan.clips.target.reaction.timeline,gain);
  const start=plan.beats.reactionStart,duration=plan.clips.target.reaction.timeline.durationMs;
  for(let i=0;i<=128;i++){const elapsed=duration*i/128,t=sampleTurn(plan,start+elapsed).target;check(t.pose,{...t.context,realm:card.realm,travel:'stage'},'phase-'+phaseIndex+'-'+i,phaseIndex===0&&[0,64,128].includes(i));}
  const held=sampleTurn(plan,plan.beats.end-1).target;check(held.pose,{...held.context,realm:card.realm,travel:'stage'},'held-'+phaseIndex,phaseIndex===0);
 }
 const refusal=rows.filter(r=>r.status==='REFUSED'),held=rows.filter(r=>r.status==='HELD'),maxBelow=Math.max(...rows.flatMap(r=>(r.hands||[]).map((h:any)=>h.maximumBelowGuidePx))),maxContact=Math.max(...rows.filter(r=>r.contactError!==undefined).map(r=>r.contactError));
 let maxStep=0;for(let i=1;i<=256;i++){const a=rows[i-1],b=rows[i];if(a.pose&&b.pose)for(const j of joints)maxStep=Math.max(maxStep,Math.abs(a.pose[j].rotation-b.pose[j].rotation));}
 const report={schema:'cf.c203-primate-dense-forehand/v1',status:refusal.length||held.length?'HELD':'PASS_DIAGNOSTIC_ONLY',scope:'Quarter-depth whole-faint plus exact positive-alpha terminal forearm support, unchanged actual rig/ARAP/joint/contact guards. Actual sampleTurn idle fade and held-faint contexts, eight source idle phases. No native/stage or visual admission.',fit,gain,sourceHands,epsilonSourcePx:epsilon,summary:{samples:rows.length,refusals:refusal.length,held:held.length,maxBelowSourcePx:maxBelow,maxContact,maxAdjacentHandRotationRad:maxStep},controls,rows,native:false,qualified:false};
 fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,status:report.status,...report.summary,firstRefusal:refusal[0],firstHeld:held[0]?{label:held[0].label,hands:held[0].hands}:null}));
}finally{rig.dispose();}
