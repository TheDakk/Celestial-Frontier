import {it,expect} from 'vitest';
import {SPECIALIZED_TEMPLATES} from '../../../../tools/creature-animation/specialized-templates.mjs';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {checkFamilyGeometry,sealFamilyRecord,admitFamilyRecord} from '../../../../tools/creature-animation/family-record.mjs';
import {hashBytes} from '../../../../tools/creature-animation/quadruped-template.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {compileBodyCard,type ResolvedAnatomyRecord} from './body-card.js';
import {resolveTemplate,isMotionFallback} from './templates.js';
import {actionsFor} from './family-actions.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import {createGsapPlayer} from './gsap-adapter.js';
import {missingBodyStructures} from '../missing-body-structures.js';
import {earthFaunaProfile} from '../earth-fauna-profiles.js';
// Synthetic contract exercise only. Does not count as a painter observation or painted fit.
function fixture(id:string):ResolvedAnatomyRecord{
 const t=familyContractForRecord({template:{id}}),landmarks=Object.fromEntries(t.joints.map((j,i)=>[j,[.15+(i%8)*.085,.15+Math.floor(i/8)*.085]]));
 return {kind:id,habitat:{realm:'land',source:'synthetic contract test; not species evidence'},identity:{speciesVisualKey:'synthetic-specialty/'+id,seed:51,ownerId:'contract-control',earthName:null},template:{id,version:1},geometry:{cutoutAssetHash:'synthetic',width:1024,height:1024,groundLineY:.85,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials:{surface:'smooth skin'},clipSetId:t.clipSetId,recipeHash:'synthetic-control'};
}
it('all 12 candidate structures agree across intake, compiler, GSAP and skeleton evaluation for every full action',()=>{
 let n=0;for(const[id,t]of Object.entries(SPECIALIZED_TEMPLATES)){
  const r=fixture(id),card=compileBodyCard(r),contract=familyContractForRecord(r),program=createSkeletonPoseProgram(contract,card.landmarks);
  expect((checkFamilyGeometry(r) as {inside:boolean}).inside).toBe(true);expect(card.parts.map(p=>[p.joint,p.parent])).toEqual(contract.graph);expect(card.parts.length).toBeLessThan(64);
  expect(Object.keys(card.bounds.legSlack).sort()).toEqual([...t.legs].sort());
  for(const action of Object.keys(actionsFor(id)!)){
   n++;const tl=buildTimeline(card,action,51),seen:Record<string,{rotation:number;dx:number;dy:number}>={},player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){seen[j]={rotation,dx,dy};}},{now:()=>0});
   try{for(let i=0;i<=120;i++){
    const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms);player.seek(ms);
    expect(Object.keys(p.joints).sort()).toEqual([...contract.joints].sort());
    for(const[j,v]of Object.entries(p.joints)){const lim=tl.limitsRad[j]!;if(!Number.isFinite(v)||v<lim.min||v>lim.max||Math.abs(seen[j]!.rotation-v)>2e-5)throw Error(id+'/'+action+'/'+j+'@'+ms);if(j!=='root')expect([seen[j]!.dx,seen[j]!.dy]).toEqual([0,0]);}
    expect(Object.values(program.evaluate(seen)).flat().every(Number.isFinite)).toBe(true);
    for(const joint of t.rigid)expect(p.joints[joint]).toBe(0);
    if(t.anchored)expect([p.root.dx,p.root.dy]).toEqual([0,0]);
   }expect(buildTimeline(card,action,51)).toEqual(tl);}finally{player.stop();}
  }
 }expect(n).toBeGreaterThan(110);
},30_000); // 12 structures x every full action: 5.3 s on this Mac, over the 5 s default on a hosted runner (PR #43 run 35669457751). A timeout is not an assertion; the agreement checks are unchanged.
it('cannot hide missing geometry, fabricate mandatory absence, reuse wrong hashes, or infer weapons from unrelated genome fields',async()=>{
 for(const id of Object.keys(SPECIALIZED_TEMPLATES)){
  const r=fixture(id),t=familyContractForRecord(r),bad=structuredClone(r) as unknown as {landmarks:Record<string,number[]>};delete bad.landmarks[t.joints.at(-1)!];
  expect(()=>compileBodyCard(bad as unknown as ResolvedAnatomyRecord)).toThrow('landmark');expect(()=>checkFamilyGeometry(bad)).toThrow();
  expect(()=>compileBodyCard({...r,anatomy:{schema:'cf.anatomy-presence/v1',absent:['body']}})).toThrow('mandatory');
  expect(compileBodyCard(r,{head:0,tail:0}).weapons).toEqual([]);
  const bytes=new Uint8Array([4,5,6]),input={...r,geometry:{...r.geometry,cutoutAssetHash:await hashBytes(bytes)}},sealed=await sealFamilyRecord(input);
  await expect(admitFamilyRecord(sealed,bytes,new Uint8Array(1024*1024).fill(255))).resolves.toBeDefined();
  await expect(admitFamilyRecord(sealed,new Uint8Array([0]),new Uint8Array(1024*1024).fill(255))).rejects.toThrow('cut-out hash');
  const corrupt=structuredClone(sealed);corrupt.landmarks.root=[.5,.5];await expect(admitFamilyRecord(corrupt,bytes)).rejects.toThrow('hash');
 }
 for(const id of ['crust','marine','sessile','unknown'])expect(isMotionFallback(resolveTemplate(id))).toBe(true);
});
it('shell-less and eye-less observations remove only declared optional structures',()=>{
 const r=fixture('gastropod'),landmarks={...r.landmarks};for(const j of ['shell','eyeFar','eyeNear'])delete landmarks[j];
 const slim={...r,landmarks,anatomy:{schema:'cf.anatomy-presence/v1' as const,absent:['shell','eyes']}},c=compileBodyCard(slim);
 expect((checkFamilyGeometry(slim) as {inside:boolean}).inside).toBe(true);expect(c.parts.some(p=>p.joint==='head')).toBe(true);expect(c.parts.some(p=>p.joint==='shell')).toBe(false);
 const wrong={...r,landmarks};expect(()=>compileBodyCard(wrong)).toThrow('landmark');
});
it('retains 53 pending painted identities even after their candidate templates are wired',()=>{
 const rows=missingBodyStructures(),admitted=['Crab','Coconut Crab','Freshwater Crab','Mud Crab','Vent Crab'];expect(rows).toHaveLength(53);expect(new Set([...rows.map(r=>r.name),...admitted]).size).toBe(58);
 for(const name of admitted){expect(rows.some(r=>r.name===name)).toBe(false);expect(earthFaunaProfile(name)!.candidateTemplates).toEqual(['brachyuran']);}
 for(const r of rows){expect(SPECIALIZED_TEMPLATES[r.target]).toBeDefined();expect(earthFaunaProfile(r.name)!.candidateTemplates).toEqual([r.target]);expect(earthFaunaProfile(r.name)!.needsObservedFit).toBe(true);expect(r.status).toBe('needs-observed-fit');}
 expect(rows.find(r=>r.name==='Sea Squirt')!.target).toBe('sessile-filter');expect(rows.find(r=>r.name==='Salp')!.target).toBe('colonial-filter');
});
