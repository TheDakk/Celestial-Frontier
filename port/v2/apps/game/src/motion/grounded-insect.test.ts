import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {withPaintedContactSupports} from './painted-supports.js';
import {buildTimeline,buildActionTimeline,sampleTimeline,type MotionTimeline} from './timeline.js';
import {actionsFor} from './family-actions.js';
import {createFamilyContactSolver,observedContactSupports} from '../creature-rig-contact.js';
const root=new URL('../../../../../../audits/',import.meta.url);
const dirs=['INSECT_CONTACT_C67_20260927/26-cicada/fit','INSECT_CONTACT_C67_20260927/24-termite/fit','G2_REFERENCES_C62_20260927/08-ant/fit-01','G2_REFERENCES_C62_20260927/09-cricket/fit-01','ARCHETYPE_FINISH_20260923/04-insect/fit-04'];
function fixture(dir:string){const read=(f:string)=>JSON.parse(fs.readFileSync(new URL(dir+'/'+f,root),'utf8')),record=read('record.json'),binding=read('binding.json'),base=compileBodyCard(record,record.genome);return{record,binding,base,card:withPaintedContactSupports(base,record,binding)};}
const pose=(tl:MotionTimeline,ms:number)=>{const p=sampleTimeline(tl,ms);return{...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};};
function outcomes(f:ReturnType<typeof fixture>,tl:MotionTimeline){const solver=createFamilyContactSolver(f.record,observedContactSupports(f.record,f.binding));let refused=0,maxCompression=0;
 for(let i=0;i<=240;i++){const ms=tl.durationMs*i/240;try{const r=solver.resolve(pose(tl,ms),{actionId:tl.actionId,elapsedMs:ms,durationMs:tl.durationMs,realm:f.card.realm,weight:1});maxCompression=Math.max(maxCompression,r.compression??0);for(const c of r.contacts)expect(Number.isFinite(c.paintedTarget.x)&&Number.isFinite(c.paintedTarget.y)).toBe(true);}catch{refused++;}}
 return{refused,maxCompression,solver};}
it.each(['feed'])('repairs Cicada %s while the unchanged external guard still refuses',id=>{
 const f=fixture(dirs[0]!),snapshot=JSON.stringify(f),raw=actionsFor('insect',f.card.anatomy)![id]!,before=buildActionTimeline(f.card,raw,f.card.identity.seed),after=buildTimeline(f.card,id,f.card.identity.seed);
 expect(outcomes(f,before).refused).toBeGreaterThan(0);const actual=outcomes(f,after);expect(actual.refused).toBe(0);expect(actual.maxCompression).toBeLessThanOrEqual(actual.solver.scaleLength*.08);
 expect(after.notes.some(n=>n.startsWith('grounded-insect:painted-torso-gain='))).toBe(true);expect(after.phases).toEqual(before.phases);expect(after.durationMs).toBe(before.durationMs);expect(after.secondary).toEqual(before.secondary);expect(after.limitsRad).toEqual(before.limitsRad);expect(after.deform).toEqual(before.deform);
 for(const[j,keys]of Object.entries(before.tracks))if(!['root','thorax'].includes(j))expect(after.tracks[j]).toEqual(keys);
 expect(buildActionTimeline(f.card,raw,f.card.identity.seed)).toEqual(before);expect(buildTimeline(f.base,id,f.base.identity.seed)).toEqual(buildActionTimeline(f.base,raw,f.base.identity.seed));
 expect(()=>actual.solver.resolve({...pose(after,100),root:{rotation:1,dy:2}},{actionId:id,elapsedMs:100,durationMs:after.durationMs,realm:f.card.realm})).toThrow();expect(JSON.stringify(f)).toBe(snapshot);
});
it.each(dirs)('preserves passing feeding and every unrelated action: %s',dir=>{
 const f=fixture(dir);for(const[id,raw]of Object.entries(actionsFor('insect',f.card.anatomy)!)){const before=buildActionTimeline(f.card,raw,f.card.identity.seed),after=buildTimeline(f.card,id,f.card.identity.seed);
  if(id!=='feed'||outcomes(f,before).refused===0)expect(after).toEqual(before);
 }
});
it('does not mask Cicada source-step failures or lose cache identity',()=>{
 const f=fixture(dirs[0]!);for(const id of ['cast','hit','tame'])expect(outcomes(f,buildTimeline(f.card,id,f.card.identity.seed)).refused).toBeGreaterThan(0);
 const a=buildTimeline(f.card,'feed',1),b=buildTimeline(f.card,'feed',2);expect(a.seed).toBe(1);expect(b.seed).toBe(2);expect(a.hash).not.toBe(b.hash);expect(a.tracks).toEqual(b.tracks);expect(buildTimeline(JSON.parse(JSON.stringify(f.card)),'feed',2)).toEqual(b);
});
