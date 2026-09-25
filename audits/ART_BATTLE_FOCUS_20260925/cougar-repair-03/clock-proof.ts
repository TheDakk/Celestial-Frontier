/** Bounded diagnosis, NOT a runtime retargeter or acceptance instrument.
 * Compare canonical torso excursions with smaller source-body excursions;
 * limb, head and tail tracks, contact limits and contact modes are unchanged. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',out=process.argv[2],sha=(b:any)=>createHash('sha256').update(b).digest('hex');if(!out||fs.existsSync(out))throw Error('New output required');
const fit='audits/ART_BATTLE_FOCUS_20260925/cougar-repair-03/fit-01';
const r=JSON.parse(fs.readFileSync(path.join(root,fit,'record.json'),'utf8')),b=JSON.parse(fs.readFileSync(path.join(root,fit,'binding.json'),'utf8')),card=compileBodyCard(r,r.genome),solver=createFamilyContactSolver(r,observedContactSupports(r,b));
const timings:any={},players:any={};
for(const id of ['idle','approach:trot']){const tl=buildTimeline(card,id,card.identity.seed);timings[id]=tl;let raw:any={};const pl=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){raw[j]={rotation,dx,dy};}},{now:()=>0});players[id]={sample(ms){raw={};pl.seek(ms);return raw;},stop(){pl.stop();}};}
const age=516.3004730865359,globalMs=6750,results=[];
for(const mode of ['bodyMs','durationMs']){const tl=timings['approach:trot'],pose=closedLoopPose(players['approach:trot'].sample,age,tl[mode]);let result:any={mode,bodyMs:tl.bodyMs,durationMs:tl.durationMs,age,pose};try{result.contact=solver.resolve(pose,{actionId:'approach:trot',elapsedMs:age,durationMs:tl.durationMs,weight:1,realm:card.realm});result.status='PASS';}catch(e){result.status='REFUSED';result.error=String(e);}results.push(result);}
for(const player of Object.values(players) as any[])player.stop();
fs.writeFileSync(out,JSON.stringify({scope:'One exact Cougar presentation contact, pose/contact cadence comparison; no skin or acceptance',results},null,2)+'\n',{flag:'wx'});console.log(results.map(({mode,status,error})=>({mode,status,error})));
