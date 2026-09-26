/** Browser-free diagnosis of the adapter's six-phase reach estimate. No source edits. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.js';
import {buildTimeline} from '../../../port/v2/apps/game/src/motion/timeline.js';
import {sampleClip,addPose} from '../../../port/v2/apps/game/src/battle2/choreography.js';
import {createFamilyContactSolver,observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.js';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=root+'/audits/ART_BATTLE_FOCUS_20260925';
const cases=[['Cougar','cougar-repair-03/fit-03'],['Brown Bear','14-brown-bear/fit-02'],['Ibex','18-ibex/fit-02'],['Wolf','11-wolf/fit-03'],['River Otter','13-river-otter/fit-02']];
const rows=[];
for(const[name,fit]of cases){const record=JSON.parse(fs.readFileSync(base+'/'+fit+'/record.json','utf8')),binding=JSON.parse(fs.readFileSync(base+'/'+fit+'/binding.json','utf8')),card=compileBodyCard(record,record.genome),approach=buildTimeline(card,'approach',5),idle=buildTimeline(card,'idle',5),clip={source:'timeline' as const,timeline:approach},idleClip={source:'timeline' as const,timeline:idle};
 const row:any={name,fit,recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,durationMs:approach.durationMs,idleDurationMs:idle.durationMs,modes:[]};
 for(const mode of['rest','observed']){const solver=createFamilyContactSolver(record,mode==='observed'?observedContactSupports(record,binding):{});
 const resolve=(pose:any,ms:number,d:number)=>{try{solver.resolve(pose,{actionId:approach.actionId,elapsedMs:ms,durationMs:approach.durationMs,weight:1,realm:card.realm,travel:'stage',stageDisplacement:d});return null;}catch(e){return String(e);}};
 let reach=.5;const brackets=[];for(const frac of[.05,.25,.45,.55,.75,.95]){const ms=approach.durationMs*frac,pose=sampleClip(clip,ms),ok=(d:number)=>resolve(pose,ms,d)===null;let lo=0,hi=reach;if(ok(hi)){brackets.push({frac,zero:ok(0),admitted:hi});continue;}for(let k=0;k<8;k++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m;}reach=Math.min(reach,lo);brackets.push({frac,zero:ok(0),admitted:lo});}reach*=.9;
 const scenarios:any[]=[];for(const kind of['pure-zero','pure-cadence','composite-zero','composite-cadence']){let count=0,total=0,first:any=null;const composite=kind.startsWith('composite');for(let i=0;i<=120;i++){const fraction=i/120,ms=approach.durationMs*fraction,at=fraction%1,withinHalf=at>=.5?at-.5:at,d=kind.endsWith('cadence')?2*reach*withinHalf:0;const pose=sampleClip(clip,ms);for(let k=0;k<(composite?32:1);k++){const idleMs=idle.durationMs*k/32,p=composite?addPose(sampleClip(idleClip,idleMs),pose):pose,error=resolve(p,ms,d);total++;if(error){count++;first??={fraction,ms,idleMs,d,error};}}}scenarios.push({kind,total,refusals:count,first});}
 row.modes.push({mode,sixPhaseReach:reach,brackets,scenarios});}
 rows.push(row);console.log(JSON.stringify(row));}
fs.writeFileSync(process.argv[2],JSON.stringify({schema:'cf.approach-envelope-diagnosis/v1',scope:'Exact current adapter algorithm and existing solver, dense phase controls. No native measurement, no change to limits or exported stance-reach gate.',rows},null,2)+'\n',{flag:'wx'});
