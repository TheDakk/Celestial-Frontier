/** First-refusal geometric trace, with no changed numerical decisions. */
import fs from'node:fs';
import{compileBodyCard}from'../../port/v2/apps/game/src/motion/body-card.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{buildTimeline,sampleTimeline}from'../../port/v2/apps/game/src/motion/timeline.ts';
import{createFamilyContactSolver,observedContactSupports}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
const[fit,out]=process.argv.slice(2),read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8')),record=read(fit+'/record.json'),binding=read(fit+'/binding.json'),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),tl=buildTimeline(card,'hit',card.identity.seed),samples=[];
for(const ms of[351.5625,352.5]){
 const s=createFamilyContactSolver(record,observedContactSupports(record,binding)),p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};
 (globalThis as any).__CF_C203_TRACE=[];
 try{const r=s.resolve(pose,{actionId:'hit',elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm,travel:'solver'});samples.push({ms,status:'PASS',compression:r.compression,trace:(globalThis as any).__CF_C203_TRACE});}
 catch(e){samples.push({ms,status:'RED',error:String(e),cause:String((e as any).cause),trace:(globalThis as any).__CF_C203_TRACE});}
}
fs.writeFileSync(out,JSON.stringify({schema:'cf.c203-contact-geometric-trace/v1',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,bodyLength:card.bodyLength,scaleLength:card.scaleLength,timelineRoot:tl.root,samples},null,2)+'\n',{flag:'wx'});
