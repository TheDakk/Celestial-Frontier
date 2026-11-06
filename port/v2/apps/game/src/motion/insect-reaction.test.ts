import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {withPaintedContactSupports} from './painted-supports.js';
import {actionsFor} from './family-actions.js';
import {buildTimeline,buildActionTimeline,sampleTimeline} from './timeline.js';
import {insectReactionAction} from './insect-reaction.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../audits/C234_PROGRAM_20261011/phase5/fixtures/',import.meta.url);
function fixture(id:string){const read=(n:string)=>JSON.parse(fs.readFileSync(new URL(id+'/'+n,root),'utf8')),record=read('record.json'),binding=read('binding.json'),base=compileBodyCard(record,record.genome);return{record,binding,base,card:withPaintedContactSupports(base,record,binding)};}
for(const [id,action] of [['springtail','hit'],['osprey','dodge'],['gorilla','approach:walk']])it(id+' completes its formerly refused action under both unchanged contact owners',()=>{
 const f=fixture(id!),tl=buildTimeline(f.card,action!,f.card.identity.seed),solver=createFamilyContactSolver(f.record,observedContactSupports(f.record,f.binding));
 for(let i=0;i<=480;i++){const ms=tl.durationMs*i/480,p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};for(const travel of ['solver','stage'] as const)expect(()=>solver.resolve(pose,{actionId:action!,elapsedMs:ms,durationMs:tl.durationMs,realm:f.card.realm,travel})).not.toThrow();}
 expect(()=>solver.resolve({root:{rotation:1,dy:2}},{actionId:action!,elapsedMs:100,durationMs:tl.durationMs,realm:f.card.realm})).toThrow();
 const raw=actionsFor(f.card.template.id,f.card.anatomy)![action!]!,before=buildActionTimeline(f.card,raw,f.card.identity.seed);
 expect(tl.durationMs).toBe(before.durationMs);expect(tl.phases).toEqual(before.phases);expect(tl.limitsRad).toEqual(before.limitsRad);
 expect(tl.notes.some(n=>n.includes(id==='springtail'?'coherent-short-reaction':id==='gorilla'?'raised-half-stride':'supported-neck-duck'))).toBe(true);
});
it('the insect source-step compiler and painted playback use identical root travel',()=>{
 const f=fixture('springtail');for(const action of ['hit','tame']){const canonical=buildTimeline(f.base,action,f.base.identity.seed),painted=buildTimeline(f.card,action,f.card.identity.seed);expect(painted.root).toEqual(canonical.root);expect(painted.durationMs).toBe(canonical.durationMs);expect(canonical.root.dx.some(k=>k.value!==0)).toBe(true);}
});
it('authors one immutable complete curve and keeps unrelated actions and families unchanged',()=>{
 const f=fixture('springtail'),bird=fixture('osprey');for(const raw of Object.values(actionsFor('insect',f.card.anatomy)!)){const snapshot=JSON.stringify(raw),changed=insectReactionAction(f.card,raw);expect(JSON.stringify(raw)).toBe(snapshot);if(!['hit','tame'].includes(raw.id))expect(changed).toBe(raw);else{expect(changed.poses.map(p=>[p.t,p.ease])).toEqual(raw.poses.map(p=>[p.t,p.ease]));for(let i=0;i<raw.poses.length;i++){expect(changed.poses[i]!.joints.head).toBe(raw.poses[i]!.joints.head);expect(changed.poses[i]!.root.dx).toBe(raw.poses[i]!.root.dx*.25);}}expect(insectReactionAction(bird.card,raw)).toBe(raw);expect(insectReactionAction({...f.card,contactGeometry:{...f.record.geometry,fixedAttachments:{legFrontNearKnee:[.5,.5]}}},raw)).toBe(raw);expect(insectReactionAction({...f.card,realm:'aquatic'},raw)).toBe(raw);}
});
