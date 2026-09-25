import fs from 'node:fs';import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';import {actionsFor} from './family-actions.js';import {buildTimeline,buildActionTimeline,sampleTimeline} from './timeline.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url),base='audits/ART_BATTLE_FOCUS_20260925/';
const read=(fit:string,f:string)=>JSON.parse(fs.readFileSync(new URL(fit+'/'+f,root),'utf8'));
function refusals(r:any,b:any,tl:any,mode:string){const card=compileBodyCard(r,r.genome),solver=createFamilyContactSolver(r,mode==='observed'?observedContactSupports(r,b):{});let n=0;for(let i=0;i<=120;i++){const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms);try{solver.resolve({...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}},{actionId:tl.actionId,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm});}catch{n++;}}return n;}
it.each([['12-gull/fit-03','dodge'],['15-goose/fit-02','dodge'],['16-heron/fit-01','dodge'],['17-sparrow/fit-01','dodge'],['15-goose/fit-02','hit'],['15-goose/fit-02','tame'],['17-sparrow/fit-01','hit']])('authors an expressive grounded %s %s inside the original support guards',(fit,id)=>{
 const r=read(base+fit,'record.json'),b=read(base+fit,'binding.json'),card=compileBodyCard(r,r.genome),action=actionsFor(card.template.id,card.anatomy)![id]!,original=buildActionTimeline(card,action,card.identity.seed),after=buildTimeline(card,id,card.identity.seed);
 expect(after.notes.some(x=>x.startsWith('grounded-bird:'))).toBe(true);expect(after.phases).toEqual(original.phases);expect(after.durationMs).toBe(original.durationMs);
 for(const mode of ['rest','observed']){expect(refusals(r,b,original,mode)).toBeGreaterThan(0);expect(refusals(r,b,after,mode)).toBe(0);}
 if(id==='dodge')expect(Math.max(...after.tracks.neck0!.map(k=>Math.abs(k.value)))).toBeGreaterThan(.1);
 expect(buildTimeline(JSON.parse(JSON.stringify(card)),id,card.identity.seed)).toEqual(after);
 // The overlay/editor constructor retains the authored original. A failed
 // override cannot be silently replaced with the canonical grounded action.
 expect(buildActionTimeline(card,JSON.parse(JSON.stringify(action)),card.identity.seed)).toEqual(original);
});
it('preserves the shipped Eagle and already admitted new bird reactions exactly',()=>{
 for(const [fit,ids]of [['audits/ARCHETYPE_REPAIRS_20260922/03-biped-bird/fit-12',['dodge','hit','tame']],[base+'12-gull/fit-03',['hit','tame']],[base+'16-heron/fit-01',['hit','tame']]] as const){const r=read(fit,'record.json'),card=compileBodyCard(r,r.genome);for(const id of ids)expect(buildTimeline(card,id,card.identity.seed)).toEqual(buildActionTimeline(card,actionsFor(card.template.id,card.anatomy)![id]!,card.identity.seed));}
});
