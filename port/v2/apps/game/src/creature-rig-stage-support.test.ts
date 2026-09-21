import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {it,expect} from 'vitest';import {Texture,TextureSource,Mesh} from 'pixi.js';
import {createFamilyContactSolver,observedContactSupports} from './creature-rig-contact.js';
import {loadCreatureRigV1,readCreatureRigContactSupport} from './creature-rig.js';
import {compileBodyCard} from './motion/body-card.js';import {buildTimeline} from './motion/timeline.js';
import {createGsapPlayer} from './motion/gsap-adapter.js';
import {familyContractForRecord} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
const root=path.resolve(import.meta.dirname,'../../../../..'),read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const req=createRequire(import.meta.url),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
it('stage gaits retain lift but never accumulate body-space stride over multiple cycles; solver mode still advances',()=>{
 const r=read('audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json'),s=createFamilyContactSolver(r);let lifts=0,legacyAdvance=0;
 for(let i=0;i<=80;i++){
  const phase={actionId:'approach:scuttle',elapsedMs:i*25,durationMs:1000},local=s.resolve({},phase),stage=s.resolve({root:{rotation:0,dx:.1}},{...phase,travel:'stage'});
  expect(stage.pose.root!.dx).toBe(0);
  for(const c of stage.contacts)if(c.stance){expect(c.target.x).toBe(r.landmarks[c.joint][0]);expect(c.target.y).toBe(r.landmarks[c.joint][1]);}
  else lifts=Math.max(lifts,(r.landmarks[c.joint][1]-c.target.y)*r.geometry.height);
  for(const c of local.contacts)legacyAdvance=Math.max(legacyAdvance,Math.abs(c.target.x-r.landmarks[c.joint][0])*r.geometry.width);
 }
 expect(lifts).toBeGreaterThan(1);expect(legacyAdvance).toBeGreaterThan(1);
});
it('observed support accessor reads published mesh under hit, retains last good publication on refusal, and stops at disposal',async()=>{
 const dir='audits/VISION_P1_FOUR_CRABS_20260920/intake-02/crab-fit-01/',r=read(dir+'record.json'),b=read(dir+'binding.json'),manifest=read(dir+'parts/manifest.json');
 const master=fs.readFileSync(path.join(root,r.source)),rgba=PNG.sync.read(fs.readFileSync(path.join(root,dir+'parts/keyed.png'))).data;
 const alpha=Uint8Array.from({length:r.geometry.width*r.geometry.height},(_,i)=>rgba[i*4+3]),atlas=fs.readFileSync(path.join(root,dir+'parts/atlas/'+manifest.creatureId+'.png'));
 const rig=await loadCreatureRigV1(r,b,master,alpha,atlas,async()=>new Texture({source:new TextureSource(b.atlasSize)}));
 const supports=observedContactSupports(r,b),solver=createFamilyContactSolver(r,supports),program=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks);
 const timeline=buildTimeline(compileBodyCard(r,r.genome),'hit',7);let raw:Record<string,{rotation:number;dx?:number;dy?:number}>={};
 const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){raw[j]={rotation,dx,dy};}},{now:()=>0});
 let maxPaint=0,maxJoint=0;
 try{
  expect(readCreatureRigContactSupport(rig,'leg0FarFoot')).toBeNull();rig.applyPose({});
  const rest=Object.fromEntries(Object.keys(supports).map(j=>[j,readCreatureRigContactSupport(rig,j)!]));
  expect(readCreatureRigContactSupport(rig,'carapace')).toBeNull();
  for(let i=0;i<=20;i++){
   raw={};const ms=timeline.durationMs*i/20;player.seek(ms);const solved=solver.resolve(raw,{actionId:'hit',elapsedMs:ms,durationMs:timeline.durationMs,travel:'stage'});rig.applyPose(solved.pose);
   const matrices=program.evaluate(solved.pose);
   for(const [joint,support]of Object.entries(supports)){
    const p=readCreatureRigContactSupport(rig,joint)!,location=support.surface!,part=rig.parts.find(p=>p.id===location.partId)!,mesh=part.display.children[0] as Mesh;
    const data=mesh.geometry.getBuffer('aPosition').data;
    expect(p).toEqual({x:data[location.vertexIndex*2],y:data[location.vertexIndex*2+1]});
    const q=rest[joint]!;maxPaint=Math.max(maxPaint,Math.hypot((p.x-q.x)*r.geometry.width,(p.y-q.y)*r.geometry.height));
    const lm=r.landmarks[joint],jp=transformPoint(matrices[joint]!,{x:lm[0],y:lm[1]});maxJoint=Math.max(maxJoint,Math.hypot((jp.x-lm[0])*r.geometry.width,(jp.y-lm[1])*r.geometry.height));
   }
  }
  expect(maxPaint).toBeLessThanOrEqual(.25);expect(maxJoint).toBeGreaterThan(.25);
  console.log(JSON.stringify({finding:'hit joint proxy versus published support',maxPaintDriftPx:maxPaint,maxJointDriftPx:maxJoint}));
  // Test the published painted surface too: stage plus local support must
  // cancel, even though a foot joint is not the pinned surface on this binding.
  for(const stageDisplacement of [-.03,0,.03]){
   const solved=solver.resolve({}, {actionId:'idle',elapsedMs:0,durationMs:1000,travel:'stage',stageDisplacement});rig.applyPose(solved.pose);
   for(const [joint,q]of Object.entries(rest)){const p=readCreatureRigContactSupport(rig,joint)!;
    expect(Math.hypot((p.x+stageDisplacement*solver.scaleLength-q.x)*r.geometry.width,(p.y-q.y)*r.geometry.height)).toBeLessThanOrEqual(.25);
   }
  }
  const before=readCreatureRigContactSupport(rig,'leg0FarFoot');expect(()=>rig.applyPose({foreign:{rotation:1}})).toThrow();expect(readCreatureRigContactSupport(rig,'leg0FarFoot')).toEqual(before);
  rig.applyPose({root:{rotation:0,dx:.01}});expect(readCreatureRigContactSupport(rig,'leg0FarFoot')).not.toEqual(rest.leg0FarFoot);
  rig.applyPose({});expect(readCreatureRigContactSupport(rig,'leg0FarFoot')).toEqual(rest.leg0FarFoot);
 }finally{player.stop();rig.dispose();}
 expect(readCreatureRigContactSupport(rig,'leg0FarFoot')).toBeNull();
},60_000);

it('stage displacement plants stance endpoints in arena space in either direction; omission retains the sliding negative control',()=>{
 const r=read('audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json'),solver=createFamilyContactSolver(r),program=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks),W=r.geometry.width,scale=.25;
 let worst=0,omittedDrift=0;
 for(const actionId of ['idle','approach:scuttle'])for(const sign of [-1,1])for(let i=0;i<=12;i++){
  const phase={actionId,elapsedMs:i*1000/12,durationMs:1000,travel:'stage' as const},displacement=sign*.03*i/12;
  const moved=solver.resolve({}, {...phase,stageDisplacement:displacement}),zero=solver.resolve({},phase),matrices=program.evaluate(moved.pose);
  expect(moved.pose.root!.dx).toBe(0);
  for(const c of moved.contacts){const previous=zero.contacts.find(p=>p.joint===c.joint)!;
   if(c.stance){const rest=r.landmarks[c.joint],actual=transformPoint(matrices[c.joint]!,{x:rest[0],y:rest[1]}),holderX=displacement*solver.scaleLength*W*scale;
    const error=Math.abs(holderX+actual.x*W*scale-rest[0]*W*scale);worst=Math.max(worst,error);expect(error).toBeLessThan(1e-6);
    expect(c.target.x).toBe(previous.target.x-displacement*solver.scaleLength);omittedDrift=Math.max(omittedDrift,Math.abs(holderX));
   }else expect(c.target).toEqual(previous.target);
  }
  const legacy={...phase,travel:'solver' as const};expect(solver.resolve({},legacy)).toEqual(solver.resolve({}, {...legacy,stageDisplacement:displacement}));
 }
 expect(omittedDrift).toBeGreaterThan(.25);
 // A whole 184.32px arena run-up cannot be one unlimited stance at quarter scale.
 expect(()=>solver.resolve({}, {actionId:'idle',elapsedMs:0,durationMs:1000,travel:'stage',stageDisplacement:(.18*1024)/(scale*W*solver.scaleLength)})).toThrow(/reach|compression/);
 for(const stageDisplacement of [NaN,Infinity,-Infinity])expect(()=>solver.resolve({}, {actionId:'idle',elapsedMs:0,durationMs:1000,travel:'stage',stageDisplacement})).toThrow('invalid stage displacement');
 console.log(JSON.stringify({finding:'arena stance cancellation',maxArenaErrorPx:worst,omittedDisplacementDriftPx:omittedDrift}));
});
