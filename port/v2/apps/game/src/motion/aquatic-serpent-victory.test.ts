import fs from 'node:fs';
import path from 'node:path';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {actionsFor} from './family-actions.js';
import {buildTimeline,buildActionTimeline} from './timeline.js';
import {serpentVictoryAction} from './serpent-victory.js';
import {sampleClip,addPose} from '../battle2/choreography.js';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../../tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../../../tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,paintPartAreas,assertPaintPartShape} from '../../../../tools/creature-animation/paint-skin.mjs';
const ROOT=path.resolve(new URL('../../../../../../',import.meta.url).pathname);
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const candidate=serpentVictoryAction;
// Named source mesh points bound to actual painted upper snout and lower jaw. Moray upper: flat top of skull 987,559 -> tip 1037,559;
// lower: lip run 998,646 -> 1045,654. Gulper upper: top 1008,518.5 -> 1048,517; lower lip 1008,695 -> 1037,705.
// A returned rostrum must remain forward, within 30deg of its authored direction. This is new scoped regression evidence, not a sealed gate.
const CASES=[
 {name:'Moray Eel',slug:'moray-eel',fit:'audits/C243_ALLOUT_20261011/execution/batch02/round2/ai-finish/rebound-02/c243b02r2c2-21-moray-eel',upper:[[987,559],[1037,559]],lower:[[998,646],[1045,654]]},
 {name:'Gulper Eel',slug:'gulper-eel',fit:'audits/C243_ALLOUT_20261011/execution/batch02/round2/ai-finish/rebound-01/c243b02r2c2-12-gulper-eel',upper:[[1008,518.5],[1048,517]],lower:[[1008,695],[1037,705]]}
];
function make(f:typeof CASES[number]){
 const r=read(f.fit+'/record.json'),b=read(f.fit+'/binding.json'),c=compileBodyCard(r,r.genome),def=familyContractForRecord(r),prog=createSkeletonPoseProgram(def,r.landmarks),skin=b.paintSkin,w=r.geometry.width,h=r.geometry.height;
 const field=new Float32Array(skin.vertices.length*2),target=field.slice(),compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver);
 const part=skin.parts.find((p:any)=>p.id==='head'),out=new Float32Array(part.vertices.length*2),areas=paintPartAreas(part,skin);
 const source=part.vertices.map((v:any)=>v.triangle.reduce((p:number[],k:number,i:number)=>[p[0]!+skin.vertices[k].x*v.barycentric[i],p[1]!+skin.vertices[k].y*v.barycentric[i]],[0,0]));
 const index=(xy:number[])=>{const i=source.findIndex((p:number[])=>Math.hypot(p[0]!-xy[0]!,p[1]!-xy[1]!)<.01);expect(i,'source annotation must be an exact published mesh vertex '+xy).toBeGreaterThanOrEqual(0);return i;};
 const pairs={upper:f.upper.map(index),lower:f.lower.map(index)};
 const report=read('audits/C275_CODEX_20261017/coordinator/plans/'+f.slug+'/native/report.json'),t3=report.gates.turns[3],idle=buildTimeline(c,'idle',c.identity.seed);
 const authored=actionsFor('serpent',c.anatomy)!.victory!,action=candidate(c,authored),tl=buildActionTimeline(c,action,c.identity.seed,[...c.notes,'serpent:landing-victory-v1']);
 function pose(ms:number,override?:typeof tl){const since=t3.beats.returnEnd+ms,idleAt=since-(t3.beats.hitstopEnd-t3.beats.impactAt);return addPose(sampleClip({source:'timeline',timeline:idle},idleAt),sampleClip({source:'timeline',timeline:override??tl},ms));}
 function at(ms:number,override?:typeof tl){const matrices=prog.evaluate(pose(ms,override));applyCompiledSkinField(compiled,matrices,target);solveArapSkin(scratch,target,field);applyPaintPart(part,field,out);assertPaintPartShape(part,skin,out,w,h,areas);
  return Object.fromEntries(Object.entries(pairs).map(([name,[a,b]])=>{const s=source[b!]!.map((x:number,k:number)=>x-source[a!]![k]),p=[(out[b!*2]!-out[a!*2]!)*w,(out[b!*2+1]!-out[a!*2+1]!)*h],angle=Math.abs(Math.atan2(s[0]!*p[1]!-s[1]!*p[0]!,s[0]!*p[0]!+s[1]!*p[1]!))*180/Math.PI;return[name,{angleDeg:angle,forward:p[0]!,lengthRatio:Math.hypot(...p)/Math.hypot(...s)}];}));}
 return {r,c,authored,tl,at};
}
const findings:any[]=[];
it.each(CASES)('$name actual ARAP upper snout and lower lip remain forward at reported idle50 and across victory',f=>{
 const x=make(f),rows=[];
 for(let ms=0;ms<=600;ms+=5)rows.push({ms,...x.at(ms)});
 findings.push({name:f.name,rows});
 for(const {ms,...got}of rows)for(const [surface,v]of Object.entries(got)as any){expect(v.angleDeg,f.name+' '+surface+' '+ms+'ms '+JSON.stringify(v)).toBeLessThanOrEqual(30);expect(v.forward).toBeGreaterThan(0);expect(v.lengthRatio).toBeGreaterThan(.6);}
});
it('caps do not mutate authored source and leave every unrelated action/family exact',()=>{
 const fixtures=read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records;let checked=0;
 for(const fixture of Object.values(fixtures)as any[]){const c=compileBodyCard(fixture,fixture.genome);for(const a of Object.values(actionsFor(c.template.id,c.anatomy)!)as any[]){const before=structuredClone(a),got=candidate(c,a);expect(a).toEqual(before);if(c.template.id!=='serpent'||(a.id!=='victory'&&!(c.realm==='aquatic'&&['hit','faint'].includes(a.id))))expect(got).toBe(a);else for(const p of got.poses)for(const[j,cap]of [['head',12],['jaw',4]]as const){const g=(c.amplitudeProfile?.scales[j]??1)*(c.projectionScales?.[j]??1)*(c.projectionSigns?.[j]??1);if(g!==0)expect(Math.abs((p.joints[j]??0)*g)).toBeLessThanOrEqual(cap+1e-10);}checked++;}}
 for(const f of CASES){const x=make(f);for(const a of Object.values(actionsFor('serpent',x.c.anatomy)!)as any[]){if(!['victory','hit','faint'].includes(a.id))expect(candidate(x.c,a)).toBe(a);}const dry={...x.c,realm:'land' as const};const dryAction=candidate(dry,x.authored);for(const p of dryAction.poses)for(const[j,cap]of [['head',12],['jaw',4]]as const){const g=(dry.amplitudeProfile?.scales[j]??1)*(dry.projectionScales?.[j]??1)*(dry.projectionSigns?.[j]??1);if(g!==0)expect(Math.abs((p.joints[j]??0)*g)).toBeLessThanOrEqual(cap+1e-10);}}
 expect(checked).toBeGreaterThan(100);
});
it.each(CASES.flatMap(f=>['hit','faint'].map(action=>({...f,action}))))('$name $action projects head/jaw within the existing aquatic cap and preserves every other track',f=>{
 const r=read(f.fit+'/record.json'),c=compileBodyCard(r,r.genome),authored=actionsFor('serpent',c.anatomy)![f.action]!,before=structuredClone(authored);
 const raw=buildActionTimeline(c,authored,c.identity.seed),got=buildTimeline(c,f.action,c.identity.seed);
 for(const [joint,cap]of [['head',12],['jaw',4]]as const)expect(Math.max(...got.tracks[joint]!.map(k=>Math.abs(k.value)*180/Math.PI)),f.name+'/'+f.action+'/'+joint).toBeLessThanOrEqual(cap+1e-10);
 for(const [joint,track]of Object.entries(raw.tracks))if(!['head','jaw'].includes(joint))expect(got.tracks[joint],joint).toEqual(track);
 expect(got.root).toEqual(raw.root);expect(got.durationMs).toEqual(raw.durationMs);expect(got.bodyMs).toEqual(raw.bodyMs);expect(authored).toEqual(before);
});
it('both-direction painted controls: current curl and an exaggerated opposite gape fail the same angular outcome',()=>{
 for(const f of CASES){const x=make(f),capped=candidate(x.c,x.authored),restored={...capped,poses:capped.poses.map((p,i)=>{const joints={...p.joints};for(const j of ['head','jaw']){delete joints[j];const v=x.authored.poses[i]!.joints[j];if(v!==undefined)joints[j]=v;}return {...p,joints};})},original=buildActionTimeline(x.c,restored,x.c.identity.seed);const raw=x.at(300,original)as any;expect(Math.max(raw.upper.angleDeg,raw.lower.angleDeg)).toBeGreaterThan(30);
 const opposite={...x.tl,tracks:{...x.tl.tracks,head:x.tl.tracks.head!.map(k=>({...k,value:k.value===0?0:Math.PI/3})),jaw:x.tl.tracks.jaw!.map(k=>({...k,value:k.value===0?0:Math.PI/6}))}};const wrong=x.at(300,opposite)as any;expect(Math.max(wrong.upper.angleDeg,wrong.lower.angleDeg)).toBeGreaterThan(30);
 }
});
