/** Bounded diagnosis, NOT a runtime retargeter or acceptance instrument.
 * Compare canonical torso excursions with smaller source-body excursions;
 * limb, head and tail tracks, contact limits and contact modes are unchanged. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createFamilyContactSolver,observedContactSupports} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',out=process.argv[2],sha=(b:any)=>createHash('sha256').update(b).digest('hex');if(!out||fs.existsSync(out))throw Error('New output required');
const paths=['audits/ANATOMY_SINGLE_RUN_20260919/R3-S/civet-input-01','audits/ART_BATTLE_FOCUS_20260925/04-wall-lizard/fit-06','audits/ART_BATTLE_FOCUS_20260925/cougar-repair-03/fit-01','audits/ART_BATTLE_FOCUS_20260925/06-impala/fit-01','audits/ART_BATTLE_FOCUS_20260925/07-marmot/fit-01','audits/ART_BATTLE_FOCUS_20260925/09-cattle/fit-04'];
const report:any={scope:'Contact-only diagnostic on altered poses, no skin/presentation/native/acceptance claim; no runtime changes. Torso gain scales root offsets and root/pelvis/spine/chest angles only. No per-creature curve is written.',inputs:[],subjects:[]};
for(const dir of paths){const read=(name:string)=>{const p=path.join(root,dir,name),bytes=fs.readFileSync(p);report.inputs.push({path:p,sha256:sha(bytes)});return JSON.parse(bytes.toString());},r=read('record.json'),b=read('binding.json'),card=compileBodyCard(r,r.genome),row:any={name:r.identity.earthName,modes:[]};report.subjects.push(row);
 for(const mode of ['rest','observed']){const solver=createFamilyContactSolver(r,mode==='observed'?observedContactSupports(r,b):{}),mr:any={mode,actions:[]};row.modes.push(mr);
  for(const id of ['faint','approach:walk','approach:trot','approach:gallop','hit','tame']){const tl=buildTimeline(card,id,card.identity.seed);let raw:any={};const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){raw[j]={rotation,dx,dy};}},{now:()=>0});const poses=[];for(let i=0;i<=120;i++){raw={};player.seek(tl.durationMs*i/120);poses.push(raw);}player.stop();
   const ar:any={id,gains:[]};mr.actions.push(ar);
   for(const gain of [1,.75,.5,.25]){let passes=0,first=null;for(let i=0;i<poses.length;i++){const pose=Object.fromEntries(Object.entries(poses[i]).map(([j,k]:[string,any])=>[j,['root','pelvis','spine','chest'].includes(j)?{...k,rotation:k.rotation*gain,...j==='root'?{dx:(k.dx??0)*gain,dy:(k.dy??0)*gain}:{}}:{...k}]));try{solver.resolve(pose,{actionId:id,elapsedMs:tl.durationMs*i/120,durationMs:tl.durationMs,weight:1,realm:card.realm});passes++;}catch(e){first??={sample:i,ms:tl.durationMs*i/120,error:String(e)};}}ar.gains.push({gain,passes,first});}
  }
 }
 console.log(row.name,JSON.stringify(row.modes.map(m=>({mode:m.mode,actions:m.actions.map(a=>({id:a.id,gains:a.gains.map(g=>[g.gain,g.passes])}))}))));
}
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
