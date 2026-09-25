import fs from 'node:fs';import assert from 'node:assert/strict';
import {compileBodyCard} from '../../../port/v2/apps/game/src/motion/body-card.js';
import {buildTurnPlan,sampleTurn} from '../../../port/v2/apps/game/src/battle2/choreography.js';
import {createFamilyContactSolver,observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.js';
const dir='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ART_BATTLE_FOCUS_20260925/bird-motion-02/goose-fit-04',r=JSON.parse(fs.readFileSync(dir+'/record.json','utf8')),b=JSON.parse(fs.readFileSync(dir+'/binding.json','utf8')),card=compileBodyCard(r,r.genome);
const combatant=(side:'left'|'right')=>({side,mass:card.massClass.multiplier,card,seed:r.identity.seed,label:'Goose'}),input={seed:5,attacker:combatant('left'),target:combatant('right'),delivery:'melee' as const,theme:'wild',outcome:'hit' as const,damage:9,effect:null,arena:{groundLineY:.8,stands:{left:{x:.25,y:.8},right:{x:.75,y:.8}}},readyMs:600,commandMs:300};
const plan=buildTurnPlan({...input,targetFaints:true}),samples=Array.from({length:241},(_,i)=>sampleTurn(plan,plan.beats.end*i/240)),rows=[];
for(const mode of ['rest','observed']){const solver=createFamilyContactSolver(r,mode==='observed'?observedContactSupports(r,b):{});let refused=0,first=null;for(const frame of samples)try{solver.resolve(frame.target.pose,{...frame.target.context,realm:card.realm});}catch(e){refused++;first??={ms:frame.ms,error:String(e)};}rows.push({mode,refused,first});}
const ordinary=buildTurnPlan({...input,targetFaints:false}),ordinarySamples=Array.from({length:121},(_,i)=>sampleTurn(ordinary,ordinary.beats.end*i/120));
const expected=process.argv[3];
fs.writeFileSync(process.argv[2],JSON.stringify({expected,scope:'Same full faint poses, only correct horizontal travel owner; all contact guards unchanged',rows,faintPoses:samples.map(f=>f.target.pose),ordinarySamples},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({expected,rows}));
