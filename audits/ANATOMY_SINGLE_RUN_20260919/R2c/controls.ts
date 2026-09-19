import fs from 'node:fs';import assert from 'node:assert/strict';
import {createFamilyContactSolver,contactPaintDriftPx} from '../../../port/v2/apps/game/src/creature-rig-contact.ts';
import {createFamilyContactSolver as previous} from './previous-contact.ts';
import {familyContractForRecord,familyContactChains} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../port/v2/tools/creature-animation/kinematics.ts';
import {createCompiledSkinField,applyCompiledSkinField} from '../../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '../../../port/v2/tools/creature-animation/arap-skin.mjs';
const r=JSON.parse(fs.readFileSync('port/v2/tools/creature-animation/test-fixtures/family-records.json')).records.quadruped,t=familyContractForRecord(r);
for(const c of familyContactChains(t)){const a=r.landmarks[c.hip],b=r.landmarks[c.end];r.landmarks[c.knee]=[(a[0]+b[0])/2+.025,(a[1]+b[1])/2-.02];}
const phase={actionId:'dodge',elapsedMs:200,durationMs:1000},pose={root:{rotation:0,dx:.001,dy:.01}},s=createFamilyContactSolver(r),zero=Object.fromEntries(s.chains.map(c=>[c.end,r.landmarks[c.end]])),old=previous(r).resolve(pose,phase),current=createFamilyContactSolver(r,zero).resolve(pose,phase);
assert.deepEqual(current.pose,old.pose);assert.equal(current.maxError,old.maxError);
const supports=Object.fromEntries(s.chains.map(c=>[c.end,[c.endPoint.x+.002,c.endPoint.y+.002]])),double=Object.fromEntries(s.chains.map(c=>[c.end,[c.endPoint.x+.004,c.endPoint.y+.004]])),p=createSkeletonPoseProgram(t,r.landmarks),rows=[];
for(const [name,points]of [['offset',supports],['double-offset',double]]){const sol=createFamilyContactSolver(r,points).resolve(pose,phase),matrices=p.evaluate(sol.pose);for(const c of sol.contacts){const src=points[c.joint],now=transformPoint(matrices[c.joint],{x:src[0],y:src[1]}),drift=contactPaintDriftPx([now.x,now.y],src,[c.target.x,c.target.y],r.landmarks[c.joint],[r.geometry.width,r.geometry.height]);assert(drift<=.25);rows.push({control:name,joint:c.joint,driftPx:drift});}}
// A synthetic finite triangle around a support: pinned endpoint control passes,
// then unpin and diffuse to the moving root; actual compiled-field/ARAP publication fails.
const sol=createFamilyContactSolver(r,supports).resolve(pose,phase),matrices=p.evaluate(sol.pose),joint=s.chains[0].end,src=supports[joint],w=r.geometry.width,h=r.geometry.height;
const vertices=[[src[0],src[1]],[src[0]+.003,src[1]],[src[0],src[1]+.003]].map(([x,y])=>({x:x*w,y:y*h,weights:[[joint,1]]})),field={schema:'cf.paint-skin/v1',vertices,triangles:[0,1,2],parts:[]},result=[];
for(const mutant of [false,true]){const skin=structuredClone(field);if(mutant)for(const v of skin.vertices)v.weights=[[joint,.25],['root',.75]];const compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,{iterations:4,globalIterations:4,targetWeight:.35,pins:mutant?[]:[0,1,2]}),target=new Float32Array(6),output=target.slice();applyCompiledSkinField(compiled,matrices,target);solveArapSkin(scratch,target,output);const drift=contactPaintDriftPx([output[0],output[1]],src,r.landmarks[joint],r.landmarks[joint],[w,h]);assert(mutant?drift>.25:drift<=.25);result.push({mutant,driftPx:drift});}
console.log(JSON.stringify({status:'PASS',scope:'synthetic explicit bent source graph; no real subject acceptance',zeroOffset:'exact previous pose and endpoint error',rows,compiledArapNegativeControl:result},null,2));
